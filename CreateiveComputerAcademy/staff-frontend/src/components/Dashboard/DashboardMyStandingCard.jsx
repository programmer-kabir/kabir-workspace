import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity } from 'react-icons/fi';
import { getStaffCredit, getTierBadge } from './dashboardUtils.jsx';

export default function DashboardMyStandingCard({
  myStanding,
  aheadPerson,
  sortBy,
  timeFilter
}) {
  const navigate = useNavigate();

  if (!myStanding) return null;

  return (
    <div className="rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl shrink-0">
          <FiActivity />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Your Performance Standing
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black">
              Rank #{myStanding.rank}
            </span>
            <span className="text-xs font-bold text-slate-300">
              {sortBy === 'credits'
                ? `(${getStaffCredit(myStanding, timeFilter)} Credits ${timeFilter === 'all_time' ? 'Wallet Balance' : 'in ' + (timeFilter === 'today' ? 'Today' : timeFilter === 'this_week' ? 'This Week' : 'This Month')})`
                : sortBy === 'attendance'
                  ? `(${myStanding.total_worked_formatted} Worked • ${myStanding.present_days}d)`
                  : sortBy === 'tasks'
                    ? `(${myStanding.tasks_completed} Tasks Completed)`
                    : sortBy === 'quality'
                      ? `(⭐ ${myStanding.avg_rating || '5.0'} Rating)`
                      : `(${myStanding.efficiency_score}% Efficiency Score)`}
            </span>
            {getTierBadge(myStanding.performance_tier)}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            {myStanding.rank === 1 ? (
              <span>👑 You are currently Rank #1! Outstanding performance across workforce metrics.</span>
            ) : aheadPerson ? (
              <span>
                {sortBy === 'credits' ? (
                  <>Need only <strong>+{Math.max(1, getStaffCredit(aheadPerson, timeFilter) - getStaffCredit(myStanding, timeFilter))} more credits</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                ) : sortBy === 'attendance' ? (
                  <>Need only <strong>+{Math.max(1, Math.ceil((aheadPerson.total_worked_seconds - myStanding.total_worked_seconds) / 3600))}h more duty</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                ) : sortBy === 'tasks' ? (
                  <>Need only <strong>+{Math.max(1, aheadPerson.tasks_completed - myStanding.tasks_completed + 1)} tasks</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                ) : (
                  <>Need only <strong>+{Math.max(1, aheadPerson.efficiency_score - myStanding.efficiency_score + 1)}% score</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                )}
              </span>
            ) : (
              <span>Complete your assigned tasks with 5★ quality to climb higher in company rankings.</span>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate(sortBy === 'credits' ? '/credits' : sortBy === 'attendance' ? '/attendance' : '/tasks')}
        className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all shrink-0 cursor-pointer self-start md:self-auto"
      >
        {sortBy === 'credits' ? 'Credit Wallet \u2192' : sortBy === 'attendance' ? 'Duty & Shifts \u2192' : 'Boost Score \u2192'}
      </button>
    </div>
  );
}

