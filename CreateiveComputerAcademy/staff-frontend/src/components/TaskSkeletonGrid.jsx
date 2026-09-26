import React from 'react';

export const StaffTaskCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 flex flex-col h-full shadow-xs overflow-hidden animate-pulse">
      {/* Visual Thumbnail Skeleton */}
      <div className="w-[calc(100%+2.5rem)] h-36 -mt-5 -mx-5 mb-4 bg-slate-200 dark:bg-slate-700 rounded-t-2xl relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Badges & Meta */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div className="h-5 w-20 bg-slate-100 dark:bg-slate-700/60 rounded-md" />
        </div>
        <div className="h-5 w-10 bg-slate-100 dark:bg-slate-700/50 rounded-md" />
      </div>

      {/* Task Title */}
      <div className="space-y-2 mb-4 flex-1">
        <div className="h-4.5 bg-slate-200 dark:bg-slate-700 rounded-md w-11/12" />
        <div className="h-4.5 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3" />
      </div>

      {/* Checklists / Deliverable Skeleton */}
      <div className="space-y-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/40">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-xs w-24 mb-2" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xs w-full" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xs w-4/5" />
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-8 w-20 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
      </div>
    </div>
  );
};

export const StaffTaskSkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse flex-shrink-0" />
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <StaffTaskCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default StaffTaskSkeletonGrid;
