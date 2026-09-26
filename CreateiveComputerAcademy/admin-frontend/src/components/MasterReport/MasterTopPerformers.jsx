import React from 'react';
import { HiSparkles } from 'react-icons/hi';
import { FiLayers } from 'react-icons/fi';

const MasterTopPerformers = ({
  topPerformers = [],
  toggleExpand,
  departmentStats = [],
  selectedDept = 'all',
  setSelectedDept,
  API_BASE = import.meta.env.VITE_API_BASE_URL || '/'
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top 3 Performers Spotlight */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <HiSparkles className="text-amber-500" />
              Top Contributors
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold border border-slate-200 dark:border-slate-700">
              This Period
            </span>
          </div>

          <div className="space-y-3 mt-2">
            {topPerformers.length > 0 ? (
              topPerformers.map((staff, idx) => (
                <div
                  key={staff.user_id}
                  onClick={() => toggleExpand && toggleExpand(staff.user_id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/40' :
                      idx === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' :
                      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                      {staff.profile_picture ? (
                        <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{staff.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{staff.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{staff.department_name}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="flex items-center justify-end gap-1.5">
                      {staff.rated_count > 0 && (
                        <span className="text-[11px] font-bold text-amber-500">⭐ {staff.avg_rating}</span>
                      )}
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{staff.tasks_completed} Done</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">{staff.attendance_rate}% Att • {staff.efficiency_score}% Score</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active task performers in this period
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500">
          <span>Ranked by Output, Quality & Attendance</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Auto-Ranked</span>
        </div>
      </div>

      {/* Department-wise Productivity Snapshot */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FiLayers className="text-blue-600" />
              <span>Department Performance Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Team Distribution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {departmentStats.map((dept, i) => (
              <div
                key={i}
                onClick={() => setSelectedDept && setSelectedDept(dept.department_name)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedDept === dept.department_name
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate" title={dept.department_name}>
                    {dept.department_name}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {dept.staff_count} Staff
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Tasks Done:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{dept.tasks_completed} / {dept.tasks_assigned}</strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${dept.completion_rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                    <span>Work Duration:</span>
                    <strong className="text-purple-600 dark:text-purple-400">{dept.task_worked_formatted}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Click any department card above to filter the master table.</span>
          {selectedDept !== 'all' && (
            <button
              onClick={() => setSelectedDept && setSelectedDept('all')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterTopPerformers;
