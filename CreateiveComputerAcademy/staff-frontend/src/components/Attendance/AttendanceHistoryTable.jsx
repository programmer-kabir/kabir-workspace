import React from 'react';
import { FiCalendar, FiAlertTriangle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function AttendanceHistoryTable({
  displayHistory = [],
  setSelectedDisputeDate,
  setIsDisputeModalOpen,
  setDisputeSuccessMsg,
  disputeSuccessMsg
}) {
  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <FiCalendar className="text-primary-500" /> This Month's History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Check In</th>
                <th className="p-4 font-bold">Check Out</th>
                <th className="p-4 font-bold">Work Hours</th>
                <th className="p-4 font-bold">Break Time</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayHistory.length > 0 ? (
                displayHistory.map((record, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 cursor-default animate-fade-in"
                    style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {record.check_in || '-'}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col gap-1 items-start">
                        <span>{record.check_out || '-'}</span>
                        {Number(record.is_forgotten_checkout) === 1 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md cursor-help"
                            title="Auto checked out by system at shift end. Click report issue if you worked overtime."
                          >
                            <FiAlertTriangle size={10} className="shrink-0 text-amber-500" />
                            Auto Check-Out
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {record.total_hours ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{record.total_hours}</span>
                          {record.overtime && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-transform duration-300 group-hover:scale-110 ${
                                record.is_short === true
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                  : record.is_short === false
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {record.overtime}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {record.total_break_minutes > 0 ? `${record.total_break_minutes}m` : '-'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block transition-transform duration-300 group-hover:translate-x-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${
                          record.status === 'Present'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'
                            : record.status === 'Late'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50'
                            : record.status === 'Absent'
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'
                            : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedDisputeDate(record.date);
                          setIsDisputeModalOpen(true);
                          setDisputeSuccessMsg('');
                        }}
                        className="text-slate-400 hover:text-amber-500 transition-colors p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        title="Report an issue"
                      >
                        <FiAlertCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No attendance records found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {disputeSuccessMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in z-50">
          <FiCheckCircle size={24} />
          <p className="font-bold">{disputeSuccessMsg}</p>
        </div>
      )}
    </>
  );
}

