import React from 'react';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiMessageSquare } from 'react-icons/fi';

const LeaveHistoryList = ({ leaves, loading, searchTerm }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Leave History</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="text-3xl text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {searchTerm ? 'No Matching Leaves' : 'No Leave History'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {searchTerm ? `No records found matching "${searchTerm}"` : "You haven't applied for any leaves yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <div key={leave.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      leave.type === 'Student Academic Leave'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {leave.type === 'Student Academic Leave' ? '🎓 Student Academic Leave' : leave.type}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(leave.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                      {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Applied on {new Date(leave.created_at).toLocaleDateString()}</p>
                </div>

                <div>
                  {leave.status === 'Approved' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
                      <FiCheckCircle /> Approved
                    </span>
                  ) : leave.status === 'Rejected' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-100">
                      <FiXCircle /> Rejected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-100">
                      <FiClock /> Pending Approval
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> {leave.reason}</p>
              </div>

              {leave.admin_comment && (
                <div className="mt-3 bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
                  <FiMessageSquare className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider mb-1 text-blue-600">Admin Note</p>
                    <p>{leave.admin_comment}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveHistoryList;

