import React from 'react';

/**
 * Creative Computer Academy (CCA) - Dashboard Utilities
 * Date range calculation, credit resolution, performance tier badge rendering, and staff sorting.
 */

/**
 * Calculates start and end dates according to selected timeframe filter.
 */
export const calculateDateRange = (timeFilter) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  let endDate = todayStr;

  if (timeFilter === 'today') {
    startDate = todayStr;
    endDate = todayStr;
  } else if (timeFilter === 'this_week') {
    const d = new Date();
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    const diffToSat = (day + 1) % 7;
    d.setDate(d.getDate() - diffToSat);
    startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    endDate = todayStr;
  } else if (timeFilter === 'all_time') {
    startDate = '2023-01-01';
    endDate = todayStr;
  }

  return { startDate, endDate };
};

/**
 * Returns net credits earned by staff depending on active timeframe filter.
 */
export const getStaffCredit = (staff, timeFilter = 'today') => {
  if (!staff) return 0;
  if (timeFilter === 'all_time') {
    return Number(staff.credit_balance || 0);
  }
  return Number(staff.period_credits !== undefined ? staff.period_credits : (staff.credit_balance || 0));
};

/**
 * Generates an executive pill badge for performance tiers.
 */
export const getTierBadge = (tier) => {
  switch (tier) {
    case 'Top Performer':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          🏆 Top Performer
        </span>
      );
    case 'High Output':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
          🚀 High Output
        </span>
      );
    case 'Good Standing':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          ✓ Good Standing
        </span>
      );
    case 'Attendance Only':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          ⏱️ Attendance Only
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
          ⚠️ Needs Attention
        </span>
      );
  }
};

/**
 * Sorts staff array by active dimension tab.
 */
export const sortStaffList = (staffData = [], sortBy = 'attendance', timeFilter = 'today') => {
  const list = [...staffData];
  if (sortBy === 'tasks') {
    return list.sort((a, b) => b.tasks_completed - a.tasks_completed || b.efficiency_score - a.efficiency_score);
  }
  if (sortBy === 'attendance') {
    return list.sort((a, b) => (b.total_worked_seconds - a.total_worked_seconds) || (b.present_days - a.present_days));
  }
  if (sortBy === 'quality') {
    return list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || b.tasks_completed - a.tasks_completed);
  }
  if (sortBy === 'credits') {
    return list.sort((a, b) => getStaffCredit(b, timeFilter) - getStaffCredit(a, timeFilter) || b.efficiency_score - a.efficiency_score);
  }
  return list.sort((a, b) => b.efficiency_score - a.efficiency_score || b.tasks_completed - a.tasks_completed);
};

