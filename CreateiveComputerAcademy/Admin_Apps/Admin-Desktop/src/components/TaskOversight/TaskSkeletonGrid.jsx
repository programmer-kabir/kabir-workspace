import React from 'react';

export const TaskCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 flex flex-col h-full shadow-xs overflow-hidden animate-pulse">
      {/* Thumbnail Placeholder */}
      <div className="w-[calc(100%+2.5rem)] h-40 -mt-5 -mx-5 mb-5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-700/60 dark:to-slate-700 rounded-t-2xl relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Badges row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700/60 rounded-md" />
        </div>
        <div className="h-5 w-8 bg-slate-100 dark:bg-slate-700/60 rounded-md" />
      </div>

      {/* Title */}
      <div className="space-y-2 mb-4 flex-1">
        <div className="h-4.5 bg-slate-200 dark:bg-slate-700 rounded-md w-11/12" />
        <div className="h-4.5 bg-slate-200 dark:bg-slate-700 rounded-md w-3/5" />
      </div>

      {/* Description Snippet */}
      <div className="space-y-1.5 mb-5">
        <div className="h-3 bg-slate-100 dark:bg-slate-700/40 rounded-sm w-full" />
        <div className="h-3 bg-slate-100 dark:bg-slate-700/40 rounded-sm w-4/5" />
      </div>

      {/* Meta Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          <div className="space-y-1">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-xs" />
            <div className="h-2.5 w-14 bg-slate-100 dark:bg-slate-700/50 rounded-xs" />
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700/60 rounded-lg" />
      </div>
    </div>
  );
};

export const TaskSkeletonGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default TaskSkeletonGrid;
