import React from 'react';
import { FiLayers } from 'react-icons/fi';
import { getStaffCredit, getTierBadge } from './dashboardUtils.jsx';

export default function DashboardLeaderboardTable({
  top5StaffList = [],
  currentUser,
  sortBy,
  timeFilter,
  apiBase = ''
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <FiLayers className="text-indigo-600" />
          <span>Top 5 Staff Performance Directory</span>
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Sorted by: {sortBy.toUpperCase()}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Quality Stars</th>
              <th className="py-3 px-4">Attendance</th>
              <th className="py-3 px-4">Duty Hours</th>
              <th className="py-3 px-4">Tasks Output</th>
              <th className="py-3 px-4">Rejections</th>
              <th className="py-3 px-4">Credit Balance</th>
              <th className="py-3 px-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {top5StaffList.map((staff, idx) => {
              const rankNum = idx + 1;
              const isMe = staff.user_id === currentUser?.id;

              return (
                <tr
                  key={staff.user_id}
                  className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${isMe ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-bold' : ''
                    }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 font-black text-slate-800 dark:text-slate-200">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${rankNum === 1 ? 'bg-amber-400 text-slate-950 font-black' :
                      rankNum === 2 ? 'bg-slate-200 dark:bg-slate-700 text-slate-800' :
                        rankNum === 3 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800' :
                          'text-slate-400'
                      }`}>
                      {rankNum}
                    </span>
                  </td>

                  {/* Employee */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {staff.profile_picture ? (
                          <img src={`${apiBase}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {staff.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{staff.name}</span>
                          {isMe && <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase">You</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{staff.designation}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {staff.department_name}
                    </span>
                  </td>

                  {/* Quality Stars */}
                  <td className="py-3.5 px-4">
                    {staff.rated_count > 0 ? (
                      <div>
                        <span className="font-bold text-amber-500">⭐ {staff.avg_rating}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({staff.rated_count} rated)</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Attendance */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {staff.attendance_rate}%
                    </div>
                    <span className="text-[10px] text-slate-400">{staff.present_days}P / {staff.late_days || 0}L</span>
                  </td>

                  {/* Duty Hours */}
                  <td className={`py-3.5 px-4 ${sortBy === 'attendance' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                      {staff.total_worked_formatted}
                    </span>
                    <span className="block text-[9px] font-black uppercase tracking-wider">
                      {staff.is_currently_working ? (
                        <span className="text-emerald-500 font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> LIVE
                        </span>
                      ) : (
                        <span className="text-slate-400">WORKED</span>
                      )}
                    </span>
                  </td>

                  {/* Tasks Output */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {staff.tasks_completed} / {staff.tasks_assigned}
                      </span>
                      <span className="text-[10px] text-slate-400">({staff.completion_rate}%)</span>
                    </div>
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${staff.completion_rate}%` }} />
                    </div>
                  </td>

                  {/* Rejections */}
                  <td className="py-3.5 px-4">
                    {staff.tasks_rejected > 0 ? (
                      <span className="font-bold text-rose-500 text-[11px]">
                        {staff.tasks_rejected}x ({staff.rejection_rate}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">0</span>
                    )}
                  </td>

                  {/* Credit Balance */}
                  <td className={`py-3.5 px-4 ${sortBy === 'credits' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 text-xs">🪙</span>
                      <span className={`font-black font-mono text-xs ${getStaffCredit(staff, timeFilter) < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                        }`}>
                        {getStaffCredit(staff, timeFilter) > 0 ? `+${getStaffCredit(staff, timeFilter)}` : getStaffCredit(staff, timeFilter)}
                      </span>
                    </div>
                    <span className="block text-[9px] text-slate-400 font-medium">
                      {timeFilter === 'all_time' ? 'Wallet Balance' : 'Net Period'}
                    </span>
                  </td>

                  {/* Efficiency Score */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white mr-1.5">
                      {staff.efficiency_score}%
                    </span>
                    {getTierBadge(staff.performance_tier)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

