import React from 'react';
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMoreVertical,
  FiTrash2
} from 'react-icons/fi';
import { toast } from 'sonner';
import { CATEGORIES, formatBdDateTime, renderFormattedContent } from './communityUtils.jsx';
import CommunityCommentsSection from './CommunityCommentsSection.jsx';

export default function CommunityPostCard({
  post,
  currentUser,
  currentAvatar,
  openComments = {},
  setOpenComments,
  commentInputs = {},
  submittingComment = {},
  activeMenuId,
  setActiveMenuId,
  handleToggleLike,
  handleDeletePost,
  handleAddComment,
  handleCommentInputChange,
  setLightboxImage,
  mentionState,
  filteredMentionUsers = [],
  selectedMentionIdx,
  handleMentionKeyDown,
  handleSelectMention,
  apiBase = ''
}) {
  const author = post.author || {};
  const isMyPost = (Number(author.id) === Number(currentUser?.id));
  const categoryMeta = CATEGORIES.find(c => c.id.toLowerCase() === (post.category || '').toLowerCase()) || CATEGORIES[0];
  const isLiked = post.my_reaction === 'like';
  const showComments = Boolean(openComments[post.id]);

  const authorAvatar = author.avatar
    ? `${apiBase}${author.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || 'User')}&background=0D8ABC&color=fff`;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border ${
        post.is_pinned
          ? 'border-amber-400/80 dark:border-amber-500/50 shadow-md shadow-amber-500/5'
          : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
      } p-5 md:p-6 transition hover:border-indigo-400/50 space-y-4 relative`}
    >
      {/* Pinned Ribbon */}
      {post.is_pinned === 1 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700/60 mb-1">
          <span>📌</span>
          <span>Pinned Announcement</span>
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={authorAvatar}
            alt={author.name}
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {author.name}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                @{author.username}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                {author.role}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span>{author.designation || 'Academy Staff'}</span>
              <span>&bull;</span>
              <span>{author.department || 'Academy'}</span>
              <span>&bull;</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {formatBdDateTime(post.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Badges & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${categoryMeta.color}`}>
            <span>{categoryMeta.icon}</span>
            <span>{categoryMeta.label}</span>
          </span>

          {/* Menu Button */}
          {isMyPost && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
              {activeMenuId === post.id && (
                <div className="absolute right-0 top-8 z-30 w-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      handleDeletePost(post.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold cursor-pointer transition"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Body Content */}
      {post.content && (
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
          {renderFormattedContent(post.content)}
        </p>
      )}

      {/* Post Image Attachment */}
      {post.image_url && (
        <div
          onClick={() => setLightboxImage(`${apiBase}${post.image_url}`)}
          className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 max-h-[520px] cursor-pointer group relative bg-slate-100 dark:bg-slate-950/60 flex items-center justify-center p-1"
        >
          <img
            src={`${apiBase}${post.image_url}`}
            alt="Post Attachment"
            className="w-auto max-w-full max-h-[510px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-2xl">
            <span>Click to view full image</span>
          </div>
        </div>
      )}

      {/* Post Footer Action Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => handleToggleLike(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
              isLiked
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <FiHeart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{post.likes_count || 0}</span>
            <span className="hidden sm:inline">{post.likes_count === 1 ? 'Like' : 'Likes'}</span>
          </button>

          {/* Comments Toggle Button */}
          <button
            type="button"
            onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer font-bold"
          >
            <FiMessageCircle className="w-4 h-4" />
            <span>{post.comments_count || 0}</span>
            <span className="hidden sm:inline">{post.comments_count === 1 ? 'Comment' : 'Comments'}</span>
          </button>
        </div>

        {/* Share / Copy Link */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
          title="Copy wall link"
        >
          <FiShare2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Collapsible Comments Section */}
      {showComments && (
        <CommunityCommentsSection
          post={post}
          currentAvatar={currentAvatar}
          commentInputs={commentInputs}
          submittingComment={submittingComment}
          handleAddComment={handleAddComment}
          handleCommentInputChange={handleCommentInputChange}
          mentionState={mentionState}
          filteredMentionUsers={filteredMentionUsers}
          selectedMentionIdx={selectedMentionIdx}
          handleMentionKeyDown={handleMentionKeyDown}
          handleSelectMention={handleSelectMention}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}
