import React from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const REACTION_OPTIONS = [
  { type: 'like', icon: '👍', label: 'Like' },
  { type: 'love', icon: '❤️', label: 'Love' },
  { type: 'insight', icon: '💡', label: 'Insightful' },
  { type: 'fire', icon: '🔥', label: 'Fire' },
  { type: 'clap', icon: '👏', label: 'Clap' },
];

const BlogReactionsBar = ({
  blogId,
  userReaction,
  setUserReaction,
  reactionsSummary,
  setReactionsSummary,
  currentUser
}) => {
  const totalReactions = Object.values(reactionsSummary || {}).reduce((a, b) => a + Number(b), 0);

  const handleToggleReaction = async (reactionType) => {
    if (!currentUser?.id || !blogId) return;

    // Optimistic update
    const previousReaction = userReaction;
    const isRemoving = (previousReaction === reactionType);
    setUserReaction(isRemoving ? null : reactionType);

    setReactionsSummary(prev => {
      const updated = { ...prev };
      if (previousReaction) {
        updated[previousReaction] = Math.max(0, (updated[previousReaction] || 1) - 1);
      }
      if (!isRemoving) {
        updated[reactionType] = (updated[reactionType] || 0) + 1;
      }
      return updated;
    });

    try {
      const res = await axios.post(`${API_BASE}api/blogs/react_blog.php`, {
        blog_id: blogId,
        user_id: currentUser.id,
        reaction_type: reactionType
      });
      if (res.data.status === 'success') {
        setUserReaction(res.data.user_reaction);
        setReactionsSummary(res.data.reactions_summary || {});
      }
    } catch (err) {
      console.error('Reaction error', err);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
          React & Share Feedback
        </h4>
        <p className="text-[11px] text-slate-400">
          {totalReactions > 0 ? `${totalReactions} team reaction(s)` : 'Be the first to react!'}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {REACTION_OPTIONS.map((r) => {
          const count = Number(reactionsSummary?.[r.type] || 0);
          const isSelected = userReaction === r.type;

          return (
            <button
              key={r.type}
              type="button"
              onClick={() => handleToggleReaction(r.type)}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-90 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30 scale-105'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">{r.icon}</span>
              <span>{count > 0 ? count : ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BlogReactionsBar;

