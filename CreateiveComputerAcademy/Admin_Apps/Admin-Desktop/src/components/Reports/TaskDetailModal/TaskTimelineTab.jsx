import React from 'react';
import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity,
  FiCheckSquare,
  FiZap
} from 'react-icons/fi';

/**
 * TaskTimelineTab
 * Renders Time Spent / Turnaround stats, Progress Lifecycle Stepper, Revisions & Audit Transition Log.
 */
const TaskTimelineTab = ({
  selectedTaskModal,
  startReactionDuration,
  workDuration,
  reviewDuration,
  totalTurnaround,
  tAssigned,
  tInProgress,
  tSubmitted,
  tCompleted,
  formatDateTime
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Duration Analytics Breakdown */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 rounded-3xl border border-blue-200/80 dark:border-slate-800">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FiZap className="text-amber-500" />
          <span>Time Spent & Execution Duration Analysis</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Time to Start</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {startReactionDuration || 'Started Instantly'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Assigned → Started</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs bg-indigo-50/20">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Work Duration</p>
            <p className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
              {workDuration || 'In Progress'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">In Progress → Submitted</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Review Duration</p>
            <p className="text-sm font-black text-amber-700 dark:text-amber-300 mt-0.5">
              {reviewDuration || (selectedTaskModal.status === 'In Review' ? 'Under Review' : '-')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Submitted → Approved</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Turnaround</p>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {totalTurnaround || (selectedTaskModal.status === 'Completed' ? 'Completed' : 'Active')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Assigned → Completion</p>
          </div>
        </div>
      </div>

      {/* Visual Milestone Stepper */}
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FiActivity className="text-blue-600" />
          <span>Task Progress Lifecycle Stepper</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          <div className="flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs">
              <FiCheckCircle size={15} />
              <span>1. Assigned</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
              {formatDateTime ? formatDateTime(tAssigned) : (tAssigned || 'Assigned')}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Task Dispatched</span>
          </div>

          <div className={`flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs relative ${tInProgress || ['In Progress', 'In Review', 'Completed', 'Rejected'].includes(selectedTaskModal.status)
            ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20'
            : 'border-slate-200 dark:border-slate-800 opacity-60'
            }`}>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs">
              <FiClock size={15} />
              <span>2. Started Work</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
              {formatDateTime ? formatDateTime(tInProgress) : (['In Progress', 'In Review', 'Completed'].includes(selectedTaskModal.status) ? 'In Progress' : 'Pending')}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Work Initiated</span>
          </div>

          <div className={`flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs relative ${tSubmitted || ['In Review', 'Completed', 'Rejected'].includes(selectedTaskModal.status)
            ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20'
            : 'border-slate-200 dark:border-slate-800 opacity-60'
            }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
              <FiCheckSquare size={15} />
              <span>3. Submitted</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
              {formatDateTime ? formatDateTime(tSubmitted) : (['In Review', 'Completed'].includes(selectedTaskModal.status) ? 'Submitted' : 'Pending Submission')}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Under Review</span>
          </div>

          <div className={`flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs relative ${selectedTaskModal.status === 'Completed'
            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-200 dark:border-slate-800 opacity-60'
            }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
              <FiCheckCircle size={15} />
              <span>4. Completed</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
              {selectedTaskModal.status === 'Completed'
                ? (formatDateTime ? formatDateTime(tCompleted) : 'Completed')
                : 'In Progress'}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Final Approval</span>
          </div>
        </div>
      </div>

      {/* Resubmissions & Rejections Info */}
      {(selectedTaskModal.was_resubmitted || selectedTaskModal.was_delayed || (selectedTaskModal.rejections && selectedTaskModal.rejections.length > 0)) && (
        <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
          <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiAlertCircle size={14} />
            <span>Revision & Resubmission Log</span>
          </h4>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-400">Total Resubmissions:</span>{' '}
              <span className="text-rose-600 font-black">{selectedTaskModal.resubmit_count || 0} time(s)</span>
            </div>
            {selectedTaskModal.was_delayed && (
              <div className="text-rose-600 font-bold bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-lg">
                Delayed Completion Flagged
              </div>
            )}
          </div>

          {selectedTaskModal.rejections && selectedTaskModal.rejections.length > 0 && (
            <div className="space-y-2 pt-1">
              {selectedTaskModal.rejections.map((rej, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/40 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1">
                    <span>Rejection #{idx + 1} by {rej.changed_by}</span>
                    <span>{formatDateTime ? formatDateTime(rej.rejected_at) : rej.rejected_at}</span>
                  </div>
                  <p className="text-rose-700 dark:text-rose-300 font-medium">
                    {rej.comment || 'No specific comment provided.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Audit Transition Logs */}
      {selectedTaskModal.logs && selectedTaskModal.logs.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Detailed Status Transition History
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-4">From</th>
                  <th className="py-2.5 px-4">To</th>
                  <th className="py-2.5 px-4">Changed By</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {selectedTaskModal.logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-4 font-semibold text-slate-500">{log.status_from || '-'}</td>
                    <td className="py-2 px-4 font-bold text-slate-800 dark:text-slate-100">{log.status_to}</td>
                    <td className="py-2 px-4 text-slate-600 dark:text-slate-400">{log.changed_by_name || 'System'}</td>
                    <td className="py-2 px-4 text-slate-500 whitespace-nowrap">{formatDateTime ? formatDateTime(log.created_at) : log.created_at}</td>
                    <td className="py-2 px-4 text-slate-600 dark:text-slate-300">{log.comment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimelineTab;
