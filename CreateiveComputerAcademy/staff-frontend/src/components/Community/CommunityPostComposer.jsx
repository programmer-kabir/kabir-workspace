import React from 'react';
import { FiSend, FiImage, FiX, FiRefreshCw } from 'react-icons/fi';
import { CATEGORIES, EMOJIS } from './communityUtils.jsx';

export default function CommunityPostComposer({
  currentUser,
  currentAvatar,
  content,
  setContent,
  postCategory,
  setPostCategory,
  imagePreview,
  imageFile,
  isSubmitting,
  fileInputRef,
  handleContentChange,
  handleMentionKeyDown,
  handleImageSelect,
  removeImage,
  handleCreatePost,
  mentionState,
  filteredMentionUsers = [],
  selectedMentionIdx,
  handleSelectMention,
  apiBase = ''
}) {
  const firstName = currentUser?.name?.split(' ')[0] || '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3.5">
        <img
          src={currentAvatar}
          alt="My Avatar"
          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-xs shrink-0"
        />
        <div className="flex-1 space-y-3 relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleMentionKeyDown}
            placeholder={`Share what's on your mind or announce something, ${firstName}... (Type @ to mention colleagues)`}
            rows={3}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 resize-none transition"
          />

          {/* Mention Suggestions Popup (Composer) */}
          {mentionState.active && mentionState.target === 'composer' && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="px-3 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/70 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                <span>Tag Colleague (@{mentionState.query})</span>
                <span className="text-[10px] text-slate-400 font-normal">Esc to close &bull; Enter to select</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMentionUsers.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">No colleagues matching @{mentionState.query}</div>
                ) : (
                  filteredMentionUsers.map((u, i) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectMention(u)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition cursor-pointer ${
                        i === selectedMentionIdx
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <img
                        src={u.avatar ? `${apiBase}${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D8ABC&color=fff`}
                        alt={u.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-[12px]">{u.name}</div>
                        <div className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold">@{u.username}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                        {u.role || 'Staff'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attached Image Preview */}
          {imagePreview && (
            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-64 shadow-md group">
              <img src={imagePreview} alt="Attached Preview" className="max-h-64 object-contain rounded-2xl" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition cursor-pointer shadow-md"
                title="Remove image"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Emoji Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm select-none">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 shrink-0">Quick Reactions:</span>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setContent(prev => prev + ' ' + emoji)}
                className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition text-sm cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Dropdown */}
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>

              {/* Attach Image Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <FiImage className="w-4 h-4 text-emerald-500" />
                <span>Photo / Banner</span>
              </button>
            </div>

            {/* Publish Button */}
            <button
              type="button"
              onClick={handleCreatePost}
              disabled={isSubmitting || (!content.trim() && !imageFile)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  <span>Post to Wall</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

