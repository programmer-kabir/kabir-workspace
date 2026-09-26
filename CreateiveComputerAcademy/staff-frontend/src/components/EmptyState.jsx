import React from 'react';
import { FiInbox, FiCheckCircle, FiPlay, FiSearch, FiLayers, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const EmptyState = ({ activeTab, hasFilter, onClearFilter, onSwitchTab, onCreateTask }) => {
  if (hasFilter) {
    return (
      <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 bg-white/40 dark:bg-slate-850/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mb-4 shadow-inner">
          <FiSearch size={26} />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No matching tasks found</h3>
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-1 mb-5">
          We couldn't find any tasks matching your selected category filters or search query.
        </p>
        {onClearFilter && (
          <button
            type="button"
            onClick={onClearFilter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <FiRefreshCw size={14} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  // State configurations per tab
  const tabConfigs = {
    'Unassigned': {
      icon: FiLayers,
      color: 'from-purple-500 to-indigo-600',
      title: 'Pool is completely empty',
      desc: 'All available tasks have been assigned or claimed by the team. Great job!',
      actionLabel: 'Create Creative Task',
      action: onCreateTask,
    },
    'To-Do': {
      icon: FiCheckCircle,
      color: 'from-blue-500 to-cyan-500',
      title: 'Your To-Do queue is clean!',
      desc: 'You have completed everything in your immediate to-do list. Check the pool for new work!',
      actionLabel: 'Explore Available Tasks',
      action: () => onSwitchTab && onSwitchTab('Unassigned'),
    },
    'In Progress': {
      icon: FiPlay,
      color: 'from-amber-500 to-orange-500',
      title: 'No tasks currently running',
      desc: 'Ready to work on something? Start a task from your To-Do queue to begin tracking time.',
      actionLabel: 'View To-Do Queue',
      action: () => onSwitchTab && onSwitchTab('To-Do'),
    },
    'In Review': {
      icon: FiInbox,
      color: 'from-blue-600 to-indigo-600',
      title: 'Nothing waiting for review',
      desc: 'Tasks submitted for QA or admin review will show up here.',
      actionLabel: null,
    },
    'Rejected': {
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-teal-500',
      title: 'Zero rejected tasks! 🌟',
      desc: 'Clean record! All your submitted work is meeting quality guidelines.',
      actionLabel: null,
    },
    'Completed': {
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-green-600',
      title: 'No completed tasks yet',
      desc: 'Completed and approved work will be listed here.',
      actionLabel: null,
    }
  };

  const config = tabConfigs[activeTab] || {
    icon: FiInbox,
    color: 'from-slate-400 to-slate-600',
    title: `No tasks in ${activeTab}`,
    desc: 'No task items currently exist in this section.',
    actionLabel: null,
  };

  const Icon = config.icon;

  return (
    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 bg-white/40 dark:bg-slate-850/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs shadow-xs">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${config.color} text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10`}>
        <Icon size={30} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{config.title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-1 mb-5">
        {config.desc}
      </p>

      {config.actionLabel && config.action && (
        <button
          type="button"
          onClick={config.action}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
        >
          <HiSparkles size={16} />
          <span>{config.actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
