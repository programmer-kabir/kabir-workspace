import React from 'react';
import { FiList } from 'react-icons/fi';
import { TaskCard } from './TaskCard';
import TaskSkeletonGrid from './TaskSkeletonGrid';

export const TaskColumnGrid = ({
  loading,
  renderColumns = {},
  activeTab,
  setActiveTab,
  getColStyle,
  apiBase = import.meta.env.VITE_API_BASE_URL || '/',
  openEditModal,
  handleDuplicateTask,
  fetchTaskHistory,
  onOpenDetails,
  handleStatusChange,
  handleRejectClick,
  actionLoading
}) => {
  if (loading) {
    return (
      <div className="pt-4 pb-8">
        <TaskSkeletonGrid count={8} />
      </div>
    );
  }

  const columnKeys = Object.keys(renderColumns);
  const currentTab = activeTab && renderColumns[activeTab] ? activeTab : columnKeys[0];
  const colTasks = currentTab && renderColumns[currentTab] ? renderColumns[currentTab] : [];

  const [visibleCount, setVisibleCount] = React.useState(24);

  React.useEffect(() => {
    setVisibleCount(24);
  }, [currentTab]);

  const displayedTasks = colTasks.slice(0, visibleCount);
  const hasMore = colTasks.length > visibleCount;

  return (
    <div className="flex flex-col">
      {/* Sticky Tabs Navigation Bar */}
      <div className="sticky -top-8 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md -mx-8 px-8 pt-4 pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {columnKeys.map((colKey) => {
            const isActive = activeTab === colKey || (!activeTab && colKey === columnKeys[0]);
            const style = getColStyle ? getColStyle(colKey) : { dot: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' };
            const textColorClass = style?.text?.split('-')[1] || 'blue';

            return (
              <button
                key={colKey}
                onClick={() => setActiveTab(colKey)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-sm uppercase tracking-wider whitespace-nowrap shadow-sm ${
                  isActive
                    ? `bg-white dark:bg-slate-800 text-${textColorClass}-600 border ${style?.border || 'border-blue-200'} dark:border-slate-700 shadow-md ring-2 ring-blue-500/10`
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${style?.dot || 'bg-blue-500'}`} />
                {colKey}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold'
                  }`}
                >
                  {renderColumns[colKey]?.length || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content Area */}
      <div className="min-h-[400px]">
        {colTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
            <FiList size={48} className="mb-4 opacity-20" />
            <p className="font-semibold text-base">No tasks in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedTasks.map((task) => (
                <TaskCard
                  key={String(task.id)}
                  task={task}
                  isReview={task.status === 'In Review'}
                  apiBase={apiBase}
                  onEdit={openEditModal}
                  onDuplicate={handleDuplicateTask}
                  onViewHistory={fetchTaskHistory}
                  onOpenDetails={onOpenDetails}
                  onStatusChange={handleStatusChange}
                  onReject={handleRejectClick}
                  actionLoading={actionLoading}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                  className="px-6 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold text-sm rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all shadow-sm active:scale-95"
                >
                  Load More (+24) • {colTasks.length - visibleCount} remaining
                </button>
                <button
                  onClick={() => setVisibleCount(colTasks.length)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Show All ({colTasks.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskColumnGrid;
