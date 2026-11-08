import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiMessageSquare, FiSend, FiTrash2 } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BlogCommentsSection = ({ blogId, comments, setComments, currentUser }) => {
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Handle Comment Submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment || !currentUser?.id) return;

    setSubmittingComment(true);
    try {
      const res = await axios.post(`${API_BASE}api/blogs/add_comment.php`, {
        blog_id: blogId,
        user_id: currentUser.id,
        comment: newComment.trim()
      });

      if (res.data.status === 'success') {
        setComments(prev => {
          if (prev.some(c => c.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
        setNewComment('');
        toast.success('Comment posted!');
      } else {
        toast.error(res.data.message || 'Failed to post comment');
      }
    } catch (err) {
      toast.error('Error posting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Comment Delete
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/blogs/delete_comment.php`, {
        comment_id: commentId,
        user_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Comment deleted.');
      }
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMessageSquare size={20} className="text-blue-500" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Team Discussions & Questions ({comments.length})
          </h3>
        </div>
      </div>

      {/* Comment Input Box */}
      <form onSubmit={handleCommentSubmit} className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts, questions, or feedback on this guideline..."
          className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Posting as <strong>{currentUser?.name || 'User'}</strong>
          </span>
          <button
            type="submit"
            disabled={!newComment.trim() || submittingComment}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FiSend size={13} />
            <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          comments.map((c) => {
            const isMine = c.user_id === currentUser?.id;

            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 overflow-hidden">
                      {c.user_avatar ? (
                        <img
                          src={c.user_avatar.startsWith('http') ? c.user_avatar : `${API_BASE}${c.user_avatar}`}
                          alt={c.user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        c.user_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {c.user_name}
                        </p>
                        {c.user_role === 'admin' && (
                          <span className="px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {(isMine || currentUser?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete Comment"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 pl-10 leading-relaxed whitespace-pre-wrap">
                  {c.comment}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BlogCommentsSection;

