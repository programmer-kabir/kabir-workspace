import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiList, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function DashboardActiveTasks({ activeTasks = [] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <FiList size={18} />
            </span>
            <span>My Active Tasks & Work Pipeline</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete these tasks with 5★ quality to boost your Master Efficiency Score.
          </p>
        </div>

        <button
          onClick={() => navigate('/tasks')}
          className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
        >
          <span>Open Tasks Board</span>
          <FiArrowRight size={14} />
        </button>
      </div>

      {activeTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTasks.slice(0, 6).map(task => {
            const isRejected = task.status === 'Rejected';
            const isInProgress = task.status === 'In Progress';

            return (
              <div
                key={task.id}
                onClick={() => navigate('/tasks', { state: { activeTab: task.status } })}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 ${isRejected
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300/80 dark:border-rose-800/60 hover:border-rose-500'
                  : isInProgress
                    ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60 hover:border-blue-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {task.category_name || task.category || 'General Task'}
                    </span>

                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${isRejected
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        : isInProgress
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {task.title}
                  </h4>

                  {isRejected && task.fix_notes && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-xl font-medium mt-2 line-clamp-2 border border-rose-200 dark:border-rose-800/40">
                      <strong>Fix Required:</strong> {task.fix_notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Due: {task.assign_date || 'Today'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Action &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
            <FiCheckCircle size={32} />
          </div>
          <h4 className="text-lg font-black text-slate-800 dark:text-white">All caught up!</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">No pending or rejected tasks requiring your attention. Check the board to grab new assignments!</p>
        </div>
      )}
    </div>
  );
}

