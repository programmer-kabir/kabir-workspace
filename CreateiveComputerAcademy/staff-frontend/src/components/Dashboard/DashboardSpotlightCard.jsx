import React from 'react';
import { getTierBadge, getStaffCredit } from './dashboardUtils.jsx';

export default function DashboardSpotlightCard({
  staff,
  rank,
  sortBy,
  timeFilter,
  top1,
  apiBase = ''
}) {
  if (!staff) return null;
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  return (
    <div
      key={staff.user_id}
      className={`${isGold
        ? 'order-first md:order-2 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-800 dark:to-slate-800/80 rounded-3xl p-5 border-2 border-amber-400/80 dark:border-amber-500/60 shadow-lg shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden'
        : isSilver
          ? 'order-2 md:order-1 bg-slate-50/80 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition-all'
          : 'order-3 md:order-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition-all'
        }`}
    >
      <div className="relative z-10">
        {/* Top Rank Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${isGold
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : isSilver
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                : isBronze
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
          >
            #{rank}
          </span>
          {isGold ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
              {sortBy === 'attendance' ? '⏱️ Top Duty' : sortBy === 'tasks' ? '🚀 Top Output' : sortBy === 'quality' ? '⭐ Quality Leader' : '👑 Top Contributor'}
            </span>
          ) : (
            getTierBadge(staff.performance_tier)
          )}
        </div>

        {/* Profile Header with Unique Bordered Rank Icon next to Name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`rounded-2xl overflow-hidden shrink-0 border shadow-sm relative ${isGold
              ? 'w-14 h-14 border-2 border-amber-400 shadow-md ring-2 ring-amber-400/20'
              : isSilver
                ? 'w-12 h-12 border-2 border-slate-300 dark:border-slate-600'
                : 'w-12 h-12 border-2 border-amber-300/60 dark:border-amber-800'
              }`}
          >
            {staff.profile_picture ? (
              <img src={`${apiBase}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-black ${isGold ? 'bg-amber-100 text-amber-700 text-base' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 text-sm'}`}>
                {staff.name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-black text-slate-900 dark:text-white truncate ${isGold ? 'text-base' : 'text-sm'}`}>
                {staff.name}
              </h4>

              {rank === 1 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500 text-xs shadow-xs shrink-0" title="Rank #1 Diamond Champion">
                  💎
                </span>
              )}
              {rank === 2 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs shadow-xs shrink-0" title="Rank #2 Elite Performer">
                  🏆
                </span>
              )}
              {rank === 3 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 text-xs shadow-xs shrink-0" title="Rank #3 Quality Star">
                  ⭐
                </span>
              )}
            </div>

            <p className={`text-[11px] truncate ${isGold ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 font-semibold'}`}>
              {staff.department_name}
            </p>
          </div>
        </div>

        {/* Dynamic Headline Metric Box based on Active Tab */}
        <div
          className={`p-3.5 rounded-2xl mb-3 flex items-center justify-between border ${isGold
            ? 'bg-white dark:bg-slate-800 border-amber-300/80 dark:border-amber-500/40 shadow-xs'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
            }`}
        >
          {sortBy === 'attendance' ? (
            <>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Logged Duty</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {staff.is_currently_working ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> On Duty Now
                    </span>
                  ) : (
                    `${staff.present_days} Days Present (${staff.attendance_rate}%)`
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black tracking-tight font-mono ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {staff.total_worked_formatted}
                </span>
                <span className="block text-[10px] font-black tracking-wider uppercase">
                  {staff.is_currently_working ? (
                    <span className="text-emerald-500 font-extrabold flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> LIVE
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">WORKED</span>
                  )}
                </span>
              </div>
            </>
          ) : sortBy === 'tasks' ? (
            <>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tasks Output</span>
                <span className="text-[10px] text-slate-400 font-medium">{staff.completion_rate}% Completion</span>
              </div>
              <span className={`text-2xl font-black tracking-tight ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {staff.tasks_completed} Done
              </span>
            </>
          ) : sortBy === 'quality' ? (
            <>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quality Rating</span>
                <span className="text-[10px] text-slate-400 font-medium">{staff.rated_count || 0} Rated Tasks</span>
              </div>
              <span className={`text-2xl font-black tracking-tight ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                ⭐ {staff.avg_rating || '5.0'}
              </span>
            </>
          ) : sortBy === 'credits' ? (
            <>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {timeFilter === 'today' ? "Today's Net Credits" :
                    timeFilter === 'this_week' ? "This Week's Credits" :
                      timeFilter === 'this_month' ? "This Month's Credits" :
                        "Net Credit Balance"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {timeFilter === 'all_time'
                    ? 'Total Balance (Earned − Deductions)'
                    : `+${staff.period_earned || 0} earned / -${staff.period_penalties || 0} minus`}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black tracking-tight font-mono ${getStaffCredit(staff, timeFilter) < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : isGold
                    ? 'text-3xl text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-white'
                  }`}>
                  {getStaffCredit(staff, timeFilter) > 0 ? `+${getStaffCredit(staff, timeFilter)}` : getStaffCredit(staff, timeFilter)}
                </span>
                <span className="block text-[10px] font-black tracking-wider uppercase text-amber-500 font-extrabold">
                  CREDITS
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Master Score</span>
                <span className="text-[10px] text-slate-400 font-medium">{staff.performance_tier}</span>
              </div>
              <span className={`text-2xl font-black tracking-tight ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {staff.efficiency_score}%
              </span>
            </>
          )}
        </div>

        {/* Sub-Metric Matrix & Progress Bar */}
        {sortBy === 'attendance' ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Duty Hours Logged:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {staff.total_worked_formatted} ({staff.present_days}d Present)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((staff.total_worked_seconds / Math.max(1, (staff.present_days || 1) * 8 * 3600)) * 100))}%` }} />
            </div>
            <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
              <span>Avg: <strong className="text-slate-800 dark:text-slate-200 font-bold">{staff.avg_daily_hours}h/day</strong></span>
              <span>Late: <strong className="text-amber-500 font-bold">{staff.late_days || 0}d</strong></span>
              <span>Att: <strong className="text-slate-700 dark:text-slate-300 font-bold">{staff.attendance_rate}%</strong></span>
            </div>
          </div>
        ) : sortBy === 'tasks' ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Output Rate:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {staff.tasks_completed} / {staff.tasks_assigned} ({staff.completion_rate}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${staff.completion_rate}%` }} />
            </div>
            <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
              <span>In Progress: <strong className="text-indigo-500 font-bold">{staff.tasks_in_progress || 0}</strong></span>
              <span>Review: <strong className="text-amber-500 font-bold">{staff.tasks_in_review || 0}</strong></span>
              <span>Rejections: <strong className="text-rose-500 font-bold">{staff.tasks_rejected || 0}x</strong></span>
            </div>
          </div>
        ) : sortBy === 'quality' ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Quality Star Level:</span>
              <span className="font-extrabold text-amber-500">
                ⭐ {staff.avg_rating || '5.0'} / 5.0
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${((staff.avg_rating || 5.0) / 5) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
              <span>Rated Tasks: <strong className="text-slate-800 dark:text-slate-200 font-bold">{staff.rated_count || 0}</strong></span>
              <span>Completed: <strong className="text-emerald-500 font-bold">{staff.tasks_completed}</strong></span>
              <span>Rejections: <strong className="text-rose-500 font-bold">{staff.tasks_rejected || 0}x</strong></span>
            </div>
          </div>
        ) : sortBy === 'credits' ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-medium">
                {timeFilter === 'all_time' ? 'Wallet Balance:' : `${timeFilter === 'today' ? 'Today' : timeFilter === 'this_week' ? 'This Week' : 'This Month'} Net:`}
              </span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {getStaffCredit(staff, timeFilter) > 0 ? `+${getStaffCredit(staff, timeFilter)}` : getStaffCredit(staff, timeFilter)} Credits
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, Math.min(100, Math.round((Math.max(0, getStaffCredit(staff, timeFilter)) / Math.max(1, getStaffCredit(top1, timeFilter) || 50)) * 100)))}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
              <span>Earned: <strong className="text-emerald-500 font-bold">+{timeFilter === 'all_time' ? (staff.credits_earned || staff.credit_balance || 0) : (staff.period_earned || 0)}</strong></span>
              <span>Minus: <strong className="text-rose-500 font-bold">-{timeFilter === 'all_time' ? (staff.credits_penalties || 0) : (staff.period_penalties || 0)}</strong></span>
              <span>Wallet Bal: <strong className="text-amber-500 font-bold font-mono">{staff.credit_balance || 0}</strong></span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Tasks Output:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {staff.tasks_completed} / {staff.tasks_assigned} ({staff.completion_rate}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${staff.completion_rate}%` }} />
            </div>
            <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
              <span>⭐ Rating: <strong className="text-amber-500 font-bold">{staff.avg_rating || '5.0'}</strong></span>
              <span>Att: <strong className="text-slate-800 dark:text-slate-200 font-bold">{staff.attendance_rate}%</strong> ({staff.present_days}P / {staff.late_days || 0}L)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

