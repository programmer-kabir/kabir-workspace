import React from 'react';
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiTrendingUp,
  FiAlertCircle,
  FiSearch,
  FiX,
  FiGrid,
  FiList,
  FiLink,
  FiEye
} from 'react-icons/fi';
import ReportStatsGrid from './ReportStatsGrid';

/**
 * TaskDeliverablesTab Component
 * Renders task deliverable metrics, status filter pills, search, and view mode toggle (Cards vs Table)
 */
const TaskDeliverablesTab = (props) => {
  const {
    taskReport,
    filteredTasks,
    taskStatusFilter,
    setTaskStatusFilter,
    taskSearchQuery,
    setTaskSearchQuery,
    taskViewMode,
    setTaskViewMode,
    getCleanTaskSnippet,
    setSelectedTaskModal,
    setModalActiveTab,
    setShowRawJson
  } = props;

  if (!taskReport) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-bold italic">
        Select an employee and period to load task deliverables.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 1. Task Metrics Stats Cards */}
      <ReportStatsGrid {...props} activeTab="tasks" />

      {/* 2. Tasks List Header & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              <span>Task Log Details</span>
              <span className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                {filteredTasks?.length || 0} {filteredTasks?.length !== (taskReport.tasks?.length || 0) ? `of ${taskReport.tasks?.length || 0}` : ''}
              </span>
            </h3>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'completed', label: 'Completed' },
                { id: 'in progress', label: 'In Progress' },
                { id: 'in review', label: 'In Review' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'delayed', label: 'Delayed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTaskStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${taskStatusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Controls: Search & View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                placeholder="Filter task title..."
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {taskSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTaskSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

            {/* View Switcher: Cards vs Table */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setTaskViewMode('cards')}
                title="Compact Cards View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${taskViewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                <FiGrid size={14} />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskViewMode('table')}
                title="Dense Table View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${taskViewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                <FiList size={14} />
                <span className="hidden sm:inline text-[11px]">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. TASKS VIEW: CARDS MODE */}
        {taskViewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredTasks && filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Card Header: Status + Category + Assigned Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${task.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400' :
                          task.status === 'In Review' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-400' :
                            task.status === 'Rejected' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400' :
                              task.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400' :
                                'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                          {task.status || 'To-Do'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {task.category || 'General'}
                        </span>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                        {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Task Title */}
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {getCleanTaskSnippet ? getCleanTaskSnippet(task.description) : (task.description || 'No description provided.')}
                      </p>
                    </div>

                    {/* Flags / Tags */}
                    {(task.was_delayed || task.was_resubmitted || task.admin_note) && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {task.was_delayed && (
                          <span className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                            Delayed
                          </span>
                        )}
                        {task.was_resubmitted && (
                          <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                            Resubmitted ({task.resubmit_count}x)
                          </span>
                        )}
                        {task.admin_note && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px] px-1.5 py-0.5 rounded truncate max-w-full">
                            Note: {task.admin_note}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Deliverable Link & View Details CTA */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {task.submission_link ? (
                        <a
                          href={task.submission_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline truncate"
                        >
                          <FiLink size={12} className="flex-shrink-0" />
                          <span className="truncate">Deliverable</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No link attached</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskModal(task);
                        setModalActiveTab('overview');
                        setShowRawJson(false);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                    >
                      <FiEye size={12} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No tasks found matching your filter.
              </div>
            )}
          </div>
        )}

        {/* 4. TASKS VIEW: TABLE MODE */}
        {taskViewMode === 'table' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Deliverable</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                  {filteredTasks && filteredTasks.length > 0 ? (
                    filteredTasks.map((task, idx) => (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {getCleanTaskSnippet ? getCleanTaskSnippet(task.description) : (task.description || 'No description provided.')}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {task.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${task.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400' :
                            task.status === 'In Review' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-400' :
                              task.status === 'Rejected' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400' :
                                task.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400' :
                                  'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}>
                            {task.status || 'To-Do'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {task.completed_at ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              {new Date(task.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {task.submission_link ? (
                            <a
                              href={task.submission_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[11px] rounded-lg transition-colors"
                            >
                              <FiLink size={11} />
                              <span>Link</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskModal(task);
                              setModalActiveTab('overview');
                              setShowRawJson(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-[11px] rounded-lg transition-colors"
                          >
                            <FiEye size={12} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400 font-bold italic">
                        No tasks found matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDeliverablesTab;
