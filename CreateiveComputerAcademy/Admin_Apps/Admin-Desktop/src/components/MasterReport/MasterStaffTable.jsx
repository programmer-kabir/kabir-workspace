import React from 'react';
import { FiUsers } from 'react-icons/fi';
import MasterStaffRow from './MasterStaffRow';

const MasterStaffTable = ({
  filteredStaff = [],
  expandedStaffId,
  toggleExpand,
  navigate,
  API_BASE = import.meta.env.VITE_API_BASE_URL || '/'
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <FiUsers className="text-blue-600" />
            <span>Company Staff Performance Directory ({filteredStaff.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive multi-dimensional analysis with Quality Stars, Output Pipeline, Duty Hours & Attendance.
          </p>
        </div>

        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40 self-start sm:self-auto">
          Interactive Drilldown Enabled
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-4 px-4 text-center w-12">#</th>
              <th className="py-4 px-4">Employee</th>
              <th className="py-4 px-4">Department</th>
              <th className="py-4 px-4 text-center">Quality Stars</th>
              <th className="py-4 px-4 text-center">Attendance</th>
              <th className="py-4 px-4 text-center">Duty Hours</th>
              <th className="py-4 px-4 text-center">Tasks Output</th>
              <th className="py-4 px-4 text-center">Task Pipeline</th>
              <th className="py-4 px-4 text-center">Time Tracked</th>
              <th className="py-4 px-4 text-center">Rejections</th>
              <th className="py-4 px-4 text-center">Score</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff, idx) => (
                <MasterStaffRow
                  key={staff.user_id}
                  staff={staff}
                  idx={idx}
                  isExpanded={expandedStaffId === staff.user_id}
                  toggleExpand={toggleExpand}
                  navigate={navigate}
                  API_BASE={API_BASE}
                />
              ))
            ) : (
              <tr>
                <td colSpan="12" className="py-12 text-center text-slate-400 font-bold italic">
                  No staff records found matching filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterStaffTable;
