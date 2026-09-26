import React from 'react';
import { FiCheckSquare, FiX, FiFlag, FiClock, FiAlertCircle, FiLoader, FiZap } from 'react-icons/fi';

const ClaimTaskModal = ({
  task,
  isOpen,
  onClose,
  onConfirm,
  loading,
  error
}) => {
  if (!isOpen || !task) return null;

  const getCoverImage = () => {
    if (!task.visual_image) return null;
    let images = [];
    try {
      if (task.visual_image.trim().startsWith('[')) {
        images = JSON.parse(task.visual_image);
      } else if (task.visual_image.includes(',')) {
        images = task.visual_image.split(',').map(i => i.trim());
      } else {
        images = [task.visual_image.trim()];
      }
    } catch {
      images = [task.visual_image.trim()];
    }
    return images.length > 0 && images[0] ? `${import.meta.env.VITE_API_BASE_URL}${images[0]}` : null;
  };

  const coverImage = getCoverImage();

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={!loading ? onClose : undefined} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Glow Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <FiX size={20} />
        </button>

        <div className="p-7">
          {/* Header & Icon */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <FiZap size={26} className="animate-pulse" />
            </div>
            <div className="pr-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Task Claiming
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Claim this Task?
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This task will be assigned directly to you and moved to your <strong>To-Do</strong> board so you can start working on it.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400 font-bold">
              <FiAlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Snapshot Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-3.5">
              {coverImage && (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
                  <img src={coverImage} alt={task.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    {task.category || 'General'}
                  </span>
                  {task.priority && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      task.priority === 'High' ? 'bg-red-100/80 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                      task.priority === 'Medium' ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                      'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    }`}>
                      <FiFlag size={10} /> {task.priority}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {task.title}
                </h4>
                {task.deadline && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-mono">
                    <FiClock size={12} className="text-amber-500" /> Deadline: {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(task.id)}
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={16} />
                  <span>Claiming...</span>
                </>
              ) : (
                <>
                  <FiCheckSquare size={16} />
                  <span>Yes, Claim Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimTaskModal;
