import React from 'react';
import { formatBdDateTime, renderFormattedContent } from './communityUtils.jsx';

export default function CommunityCommentsSection({
  post,
  currentAvatar,
  commentInputs = {},
  submittingComment = {},
  handleAddComment,
  handleCommentInputChange,
  mentionState,
  filteredMentionUsers = [],
  selectedMentionIdx,
  handleMentionKeyDown,
  handleSelectMention,
  apiBase = ''
}) {
  const postComments = post.comments || [];

  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fadeIn">
      {/* Existing Comments List */}
      {postComments.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {postComments.map((c) => {
            const cAuthor = c.author || {};
            const cAvatar = cAuthor.avatar
              ? `${apiBase}${cAuthor.avatar}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor.name || 'User')}&background=0D8ABC&color=fff`;

            return (
              <div key={c.id} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <img src={cAvatar} alt={cAuthor.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {cAuthor.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        @{cAuthor.username}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatBdDateTime(c.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                    {renderFormattedContent(c.comment)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Comment Input Box */}
      <div className="flex items-center gap-2.5 pt-1 relative">
        <img src={currentAvatar} alt="My Avatar" className="w-8 h-8 rounded-xl object-cover shrink-0" />
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={commentInputs[post.id] || ''}
            onChange={(e) => handleCommentInputChange(post.id, e)}
            onKeyDown={(e) => {
              if (mentionState.active && mentionState.target === `comment_${post.id}`) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
                  handleMentionKeyDown(e);
                  return;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                  if (filteredMentionUsers[selectedMentionIdx]) {
                    e.preventDefault();
                    handleSelectMention(filteredMentionUsers[selectedMentionIdx]);
                    return;
                  }
                }
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment(post.id);
              }
            }}
            placeholder="Write a constructive comment or reply... (Type @ to tag)"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
          />

          {/* Comment Mention Autocomplete Dropdown */}
          {mentionState.active && mentionState.target === `comment_${post.id}` && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
              <div className="px-3 py-1 bg-indigo-50/70 dark:bg-indigo-950/70 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                <span>Tag Colleague (@{mentionState.query})</span>
                <span className="text-[9px] text-slate-400">Esc to close &bull; Enter to select</span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMentionUsers.length === 0 ? (
                  <div className="p-2 text-xs text-slate-400 text-center">No colleagues matching @{mentionState.query}</div>
                ) : (
                  filteredMentionUsers.map((u, i) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectMention(u)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                        i === selectedMentionIdx
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <img
                        src={u.avatar ? `${apiBase}${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D8ABC&color=fff`}
                        alt={u.name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-[11px]">{u.name}</div>
                        <div className="text-[10px] text-indigo-500 font-semibold">@{u.username}</div>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                        {u.role || 'Staff'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleAddComment(post.id)}
          disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {submittingComment[post.id] ? '...' : 'Reply'}
        </button>
      </div>
    </div>
  );
}

