import React from 'react';
import {
  FiChevronDown,
  FiChevronUp,
  FiArrowUpRight,
  FiFileText,
  FiClock,
  FiLink
} from 'react-icons/fi';

const MasterStaffRow = ({
  staff,
  idx,
  isExpanded,
  toggleExpand,
  navigate,
  API_BASE = import.meta.env.VITE_API_BASE_URL || '/'
}) => {
  return (
    <>
      <tr
        onClick={() => toggleExpand && toggleExpand(staff.user_id)}
        className={`cursor-pointer transition-colors ${
          isExpanded
            ? 'bg-blue-50/40 dark:bg-slate-800/80 border-l-4 border-l-blue-600'
            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
        }`}
      >
        {/* Rank */}
        <td className="py-4 px-4 text-center font-black text-xs text-slate-400">
          {idx + 1}
        </td>

        {/* Employee Profile */}
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm">
              {staff.profile_picture ? (
                <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
              ) : (
                <span>{staff.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-slate-900 dark:text-white leading-snug">{staff.name}</p>
                {staff.performance_tier === 'Top Performer' && (
                  <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-500 text-[10px] font-black rounded">⭐️ Top</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{staff.designation}</p>
            </div>
          </div>
        </td>

        {/* Department */}
        <td className="py-4 px-4">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {staff.department_name}
          </span>
        </td>

        {/* Quality Stars */}
        <td className="py-4 px-4 text-center">
          <div className="flex flex-col items-center">
            {staff.rated_count > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-500 border border-amber-500/25">
                  ⭐ {staff.avg_rating}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  {staff.rated_count} rated
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                  -
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  0 rated
                </span>
              </>
            )}
          </div>
        </td>

        {/* Attendance % */}
        <td className="py-4 px-4 text-center">
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
              staff.attendance_rate >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
              staff.attendance_rate >= 75 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
              'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}>
              {staff.attendance_rate}%
            </span>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              {staff.present_days}P / {staff.late_days}L / {staff.absent_days}A
            </p>
          </div>
        </td>

        {/* Duty Hours */}
        <td className="py-4 px-4 text-center">
          <span className="font-extrabold text-slate-800 dark:text-slate-200">{staff.total_worked_formatted}</span>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
            Avg {staff.avg_daily_hours}h/day
          </p>
        </td>

        {/* Tasks Output */}
        <td className="py-4 px-4 text-center">
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {staff.tasks_completed} <span className="text-slate-400 font-normal">/ {staff.tasks_assigned}</span>
            </span>
            <div className="w-20 mx-auto bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${staff.completion_rate}%` }}
              />
            </div>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
              {staff.completion_rate}% Done
            </p>
          </div>
        </td>

        {/* Pipeline Breakdown */}
        <td className="py-4 px-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40" title="In Review">
                {staff.tasks_in_review || 0} Rev
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40" title="In Progress">
                {staff.tasks_in_progress || 0} Prog
              </span>
            </div>
            {staff.tasks_resubmitted > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40" title="Resubmitted">
                {staff.tasks_resubmitted} Resub
              </span>
            )}
          </div>
        </td>

        {/* Working Time Tracked */}
        <td className="py-4 px-4 text-center">
          <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-900/40">
            {staff.task_worked_formatted}
          </span>
        </td>

        {/* Rejections */}
        <td className="py-4 px-4 text-center">
          {staff.tasks_rejected > 0 ? (
            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-full border border-rose-200 dark:border-rose-900/40">
              {staff.tasks_rejected}x ({staff.rejection_rate}%)
            </span>
          ) : (
            <span className="text-slate-400 text-xs">-</span>
          )}
        </td>

        {/* Efficiency Score */}
        <td className="py-4 px-4 text-center">
          <div className="flex flex-col items-center">
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
              staff.efficiency_score === 0 ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
              staff.efficiency_score >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
              staff.efficiency_score >= 60 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
              'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
            }`}>
              {staff.efficiency_score}%
            </span>
            <span className="text-[9px] text-slate-400 font-bold mt-0.5">
              {staff.performance_tier}
            </span>
          </div>
        </td>

        {/* Actions */}
        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => toggleExpand && toggleExpand(staff.user_id)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isExpanded ? "Collapse Details" : "Expand Details"}
            >
              {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
            <button
              onClick={() => navigate && navigate(`/reports?staff=${staff.user_id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-all border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              <span>Inspect</span>
              <FiArrowUpRight size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* ── EXPANDABLE IN-PLACE DRILLDOWN PANEL ── */}
      {isExpanded && (
        <tr className="bg-slate-50/80 dark:bg-slate-950/60">
          <td colSpan="12" className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">

              {/* Left: Recent Tasks */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FiFileText className="text-blue-600" />
                    <span>Recent Tasks & Deliverables ({(staff.recent_tasks || []).length})</span>
                  </h4>
                  <button
                    onClick={() => navigate && navigate(`/reports?staff=${staff.user_id}&tab=tasks`)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    View All Tasks →
                  </button>
                </div>

                {staff.recent_tasks && staff.recent_tasks.length > 0 ? (
                  <div className="space-y-2.5">
                    {staff.recent_tasks.map((task, tidx) => (
                      <div key={task.id || tidx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {task.category || 'General'} • Assign: {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {task.rating && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              ⭐ {task.rating}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            task.status === 'In Review' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                            task.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                            'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          }`}>
                            {task.status}
                          </span>
                          {task.submission_link && (
                            <a
                              href={task.submission_link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white"
                              title="Open submission link"
                            >
                              <FiLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No tasks recorded in this period.</p>
                )}
              </div>

              {/* Right: Recent Attendance Logs */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FiClock className="text-emerald-600" />
                    <span>Recent Attendance Activity ({(staff.recent_attendance || []).length} Days)</span>
                  </h4>
                  <button
                    onClick={() => navigate && navigate(`/reports?staff=${staff.user_id}&tab=attendance`)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    View All Logs →
                  </button>
                </div>

                {staff.recent_attendance && staff.recent_attendance.length > 0 ? (
                  <div className="space-y-2">
                    {staff.recent_attendance.map((att, aidx) => (
                      <div key={aidx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}
                        </span>
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <span>In: {att.check_in || '--:--'}</span>
                          <span>Out: {att.check_out || '--:--'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          att.status === 'Late' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                          att.status === 'Absent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {att.status || 'Present'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No attendance logs found in this period.</p>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default MasterStaffRow;
