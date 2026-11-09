import React from 'react';
import { FiTarget, FiCalendar } from 'react-icons/fi';

/**
 * ProfileRecentTasks
 * Displays recent assignments with status badges and deadlines.
 */
export default function ProfileRecentTasks({ recentTasks }) {
  const statusConfig = {
    'Completed': {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      bar: 'bg-emerald-400 dark:bg-emerald-500',
    },
    'In Progress': {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      bar: 'bg-blue-400 dark:bg-blue-500',
    },
    'In Review': {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      bar: 'bg-amber-400 dark:bg-amber-500',
    },
    'Rejected': {
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      bar: 'bg-rose-400 dark:bg-rose-500',
    },
    'To-Do': {
      bg: 'bg-slate-50 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      bar: 'bg-slate-400 dark:bg-slate-500',
    },
  };

  const priorityConfig = {
    'High':
      'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-800',
    'Medium':
      'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800',
    'Low':
      'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
          Recent Assignments
        </h3>
      </div>

      {recentTasks?.length > 0 ? (
        <div className="space-y-4">
          {recentTasks.map((task) => {
            const conf = statusConfig[task.status] || statusConfig['To-Do'];
            const pConf = priorityConfig[task.priority] || priorityConfig['Low'];

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 group relative overflow-hidden"
              >
                {/* Accent left border based on status */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${conf.bar}`} />

                <div className="flex items-start gap-4 pl-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
                        #{task.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border ${pConf}`}>
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end pl-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}
                  >
                    {task.status}
                  </span>
                  {task.deadline && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                      <FiCalendar size={12} />
                      {new Date(task.deadline).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 border-dashed">
          <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FiTarget className="text-slate-300 dark:text-slate-500" size={24} />
          </div>
          <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-1">
            No Active Tasks
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven't been assigned any tasks recently.
          </p>
        </div>
      )}
    </div>
  );
}

