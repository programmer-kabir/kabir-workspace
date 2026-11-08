import React from 'react';
import { HiSparkles } from 'react-icons/hi';
import DashboardSpotlightCard from './DashboardSpotlightCard';
import DashboardMyStandingCard from './DashboardMyStandingCard';
import DashboardLeaderboardTable from './DashboardLeaderboardTable';

const TIME_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'all_time', label: 'All Time' }
];

const DIMENSION_TABS = [
  { id: 'overall', label: '🏆 Overall Performance' },
  { id: 'tasks', label: '🚀 Tasks Output' },
  { id: 'attendance', label: '⏱️ Duty Hours' },
  { id: 'quality', label: '⭐ Quality & Stars' },
  { id: 'credits', label: '🪙 Credit Balance' }
];

const DashboardLeaderboardSection = ({
  timeFilter,
  setTimeFilter,
  sortBy,
  setSortBy,
  sortedStaffList,
  reportLoading,
  top1,
  top2,
  top3,
  top5StaffList,
  myStanding,
  aheadPerson,
  currentUser,
  apiBase
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden relative">
      {/* Top Control Bar: Heading + Time Filters */}
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900 dark:to-slate-900/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
              <HiSparkles className="text-amber-500" /> Company Master Performance
            </span>
            <span className="text-xs text-slate-400 font-medium">• Official Evaluation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Top Contributors & Workforce Standings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Calculated using the official Master Report formula: <strong>35% Task Output + 35% Quality Star Rating + 30% Attendance</strong> minus Rejection Penalty.
          </p>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0 self-start lg:self-center">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                timeFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dimension Tabs */}
      <div className="px-6 md:px-8 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2">
          {DIMENSION_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                sortBy === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:inline-block">
          {sortedStaffList.length} Staff Ranked
        </span>
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-8 space-y-8">
        {reportLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-bold mt-3 uppercase tracking-wider">Syncing Master Metrics...</p>
          </div>
        ) : sortedStaffList.length > 0 ? (
          <>
            {/* Top 3 Spotlight Performers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <DashboardSpotlightCard staff={top2} rank={2} sortBy={sortBy} timeFilter={timeFilter} top1={top1} apiBase={apiBase} />
              <DashboardSpotlightCard staff={top1} rank={1} sortBy={sortBy} timeFilter={timeFilter} top1={top1} apiBase={apiBase} />
              <DashboardSpotlightCard staff={top3} rank={3} sortBy={sortBy} timeFilter={timeFilter} top1={top1} apiBase={apiBase} />
            </div>

            {/* My Standing & Benchmark HUD Card */}
            <DashboardMyStandingCard
              myStanding={myStanding}
              aheadPerson={aheadPerson}
              sortBy={sortBy}
              timeFilter={timeFilter}
            />

            {/* Top 5 Staff Performance Directory Table */}
            <DashboardLeaderboardTable
              top5StaffList={top5StaffList}
              currentUser={currentUser}
              sortBy={sortBy}
              timeFilter={timeFilter}
              apiBase={apiBase}
            />
          </>
        ) : (
          <div className="py-16 text-center text-slate-400">
            No staff performance logs recorded for this timeframe.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLeaderboardSection;

