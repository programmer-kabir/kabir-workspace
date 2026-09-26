import React, { useState, useMemo } from 'react';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiCoffee,
  FiTrendingUp,
  FiInfo,
  FiGrid,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

/**
 * MonthlyRosterView Component
 * Renders an interactive, visually rich calendar matrix and monthly day-by-day shift roster
 * for the selected employee in the Reports section.
 */
const MonthlyRosterView = ({
  attReport,
  selectedStaffInfo,
  activeDateRange,
  selectedMonth,
  selectedYear
}) => {
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const history = useMemo(() => {
    if (!attReport?.history || !Array.isArray(attReport.history)) return [];
    return attReport.history;
  }, [attReport]);

  // Status Styling Configuration Helper
  const getStatusBadge = (status, isWeekend, isHoliday) => {
    const s = String(status || '').toLowerCase();

    if (isWeekend || s === 'weekend') {
      return {
        label: 'Weekend',
        bg: 'bg-slate-100 dark:bg-slate-800/80',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-500 dark:text-slate-400',
        dot: 'bg-slate-400',
        icon: null
      };
    }

    if (isHoliday || s === 'holiday') {
      return {
        label: 'Holiday',
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        border: 'border-purple-200 dark:border-purple-800/50',
        text: 'text-purple-700 dark:text-purple-300',
        dot: 'bg-purple-500',
        icon: null
      };
    }

    if (s === 'present') {
      return {
        label: 'Present',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        text: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
        icon: <FiCheckCircle className="text-emerald-600 dark:text-emerald-400" size={12} />
      };
    }

    if (s === 'late') {
      return {
        label: 'Late',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/50',
        text: 'text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500',
        icon: <FiAlertCircle className="text-amber-600 dark:text-amber-400" size={12} />
      };
    }

    if (s === 'absent') {
      return {
        label: 'Absent',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-800/50',
        text: 'text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500',
        icon: <FiXCircle className="text-rose-600 dark:text-rose-400" size={12} />
      };
    }

    if (s === 'leave' || s.includes('leave')) {
      return {
        label: 'Leave',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        text: 'text-indigo-700 dark:text-indigo-400',
        dot: 'bg-indigo-500',
        icon: null
      };
    }

    return {
      label: status || 'Off-Day',
      bg: 'bg-slate-50 dark:bg-slate-800/50',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
      icon: null
    };
  };

  // Month Statistics Summary
  const stats = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let weekendCount = 0;
    let totalWorkedMinutes = 0;

    history.forEach((day) => {
      const s = String(day.status || '').toLowerCase();
      if (s === 'present') presentCount++;
      else if (s === 'late') lateCount++;
      else if (s === 'absent') absentCount++;
      else if (s === 'weekend' || day.is_weekend) weekendCount++;

      if (day.total_hours) {
        const match = day.total_hours.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          totalWorkedMinutes += (parseInt(match[1], 10) * 60) + parseInt(match[2], 10);
        }
      }
    });

    const hours = Math.floor(totalWorkedMinutes / 60);
    const mins = totalWorkedMinutes % 60;

    return {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      weekend: weekendCount,
      totalHours: `${hours}h ${mins}m`
    };
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-bold italic">
        No roster or calendar records found for this selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ──────── Header Matrix Bar ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiGrid className="text-blue-600" />
            <span>Monthly Roster & Shift Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            Complete day-by-day attendance grid for {selectedStaffInfo?.name || 'Staff'}.
          </p>
        </div>

        {/* Mini Legend Pills */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present ({stats.present})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Late ({stats.late})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent ({stats.absent})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Weekend ({stats.weekend})
          </span>
        </div>
      </div>

      {/* ──────── Day-by-Day Roster Grid ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {history.map((day, idx) => {
          const dateObj = new Date(day.date);
          const dayNum = String(dateObj.getDate()).padStart(2, '0');
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
          const badge = getStatusBadge(day.status, day.is_weekend, day.is_holiday);
          const isSelected = selectedDayDetail?.date === day.date;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDayDetail(isSelected ? null : day)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-3.5 shadow-xs transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 ${isSelected
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-800'
                }`}
            >
              {/* Top Row: Date & Status */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-slate-800 dark:text-slate-100">{dayNum}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{dayName}</span>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Shift Details */}
                <div className="space-y-1 text-xs">
                  {day.check_in ? (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="text-slate-400 text-[10px]">In / Out:</span>
                      <span className="font-mono text-[11px]">{day.check_in} - {day.check_out || 'Active'}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      {badge.label === 'Weekend' ? 'Scheduled Off' : 'No Punch Record'}
                    </div>
                  )}

                  {day.total_hours && (
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-bold">
                      <span className="text-slate-400 text-[10px]">Worked:</span>
                      <span>{day.total_hours}</span>
                    </div>
                  )}

                  {day.total_break_minutes > 0 && (
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span className="flex items-center gap-1">
                        <FiCoffee size={10} /> Break:
                      </span>
                      <span>{day.total_break_minutes}m</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Overtime / Short Tag */}
              {day.overtime && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Shift Balance:</span>
                  <span className={`font-black ${day.overtime.startsWith('+')
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                    }`}>
                    {day.overtime}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ──────── Selected Day Popup / Detail Drawer ──────── */}
      {selectedDayDetail && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-3xl p-5 border border-blue-200 dark:border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
              <FiInfo size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                Shift Log for {new Date(selectedDayDetail.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Status: <strong className="font-bold text-slate-800 dark:text-white">{selectedDayDetail.status || 'N/A'}</strong> •
                Check In: <strong className="font-bold text-slate-800 dark:text-white">{selectedDayDetail.check_in || '—'}</strong> •
                Check Out: <strong className="font-bold text-slate-800 dark:text-white">{selectedDayDetail.check_out || '—'}</strong> •
                Total Duration: <strong className="font-bold text-blue-600 dark:text-blue-400">{selectedDayDetail.total_hours || '0h 0m'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDayDetail(null)}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs self-start md:self-auto"
          >
            Close Detail
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthlyRosterView;
