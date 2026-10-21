import React from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiTarget, FiTrendingUp } from 'react-icons/fi';

export const StatsGrid = ({ stats }) => {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const cards = [
    {
      id: 'total',
      label: 'Total Assigned',
      value: stats.total,
      icon: FiTarget,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      cubeBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
      glowShadow: 'group-hover:shadow-blue-500/25 group-hover:border-blue-500/40',
      cubeShadow: 'shadow-md shadow-blue-500/30',
      badge: 'All Tasks',
      badgeStyle: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40'
    },
    {
      id: 'todo',
      label: 'To-Do',
      value: stats.todo,
      icon: FiClock,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600',
      cubeBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
      glowShadow: 'group-hover:shadow-amber-500/25 group-hover:border-amber-500/40',
      cubeShadow: 'shadow-md shadow-amber-500/30',
      badge: 'In Queue',
      badgeStyle: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.completed,
      icon: FiCheckCircle,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      cubeBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      glowShadow: 'group-hover:shadow-emerald-500/25 group-hover:border-emerald-500/40',
      cubeShadow: 'shadow-md shadow-emerald-500/30',
      badge: `${completionRate}% Rate`,
      badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: stats.rejected,
      icon: FiXCircle,
      color: 'rose',
      gradient: 'from-rose-500 to-pink-600',
      cubeBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white',
      glowShadow: 'group-hover:shadow-rose-500/25 group-hover:border-rose-500/40',
      cubeShadow: 'shadow-md shadow-rose-500/30',
      badge: 'Needs Fix',
      badgeStyle: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`group relative bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-xl ${c.glowShadow} hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between`}
          >
            {/* Subtle top light sheen on hover */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" style={{ color: `var(--${c.color}-500, #3b82f6)` }} />

            <div className="flex items-start justify-between gap-3">
              {/* 3D Glass Metatile Icon Cube */}
              <div
                className={`w-12 h-12 rounded-2xl ${c.cubeBg} ${c.cubeShadow} flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}
                style={{
                  boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-2xl pointer-events-none" />
                <Icon size={22} className="relative z-10 drop-shadow-sm" />
              </div>

              {/* Status Badge */}
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${c.badgeStyle} flex items-center gap-1 flex-shrink-0`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {c.badge}
              </span>
            </div>

            {/* Value & Label */}
            <div className="mt-4">
              <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                {c.label}
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {c.value.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Subtle interactive bottom indicator line */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all duration-500`}
                style={{
                  width: c.id === 'completed' 
                    ? `${Math.min(100, Math.max(5, completionRate))}%`
                    : c.value > 0 ? '100%' : '0%'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
