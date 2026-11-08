import React from 'react';
import { FiClock } from 'react-icons/fi';

export default function AttendanceShiftTracker({
  workTimeData,
  shiftHours = 8
}) {
  if (!workTimeData) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed p-8 flex flex-col items-center justify-center relative text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
          <FiClock size={24} />
        </div>
        <h3 className="text-lg font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Shift Tracker Offline</h3>
        <p className="text-slate-400 font-medium text-sm">Check in to start your {shiftHours}-hour live countdown.</p>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 p-8 flex flex-col justify-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
        Shift Progress ({shiftHours} Hours)
      </h3>

      {/* Progress Display */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner mb-4">
          <div
            className={`h-full transition-all duration-1000 ${workTimeData.barColor}`}
            style={{ width: `${Math.min(workTimeData.progress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>0h</span>
          <span>{Math.floor(shiftHours / 2)}h</span>
          <span>{shiftHours}h</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Worked</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">{workTimeData.elapsed}</p>
        </div>
        <div className={`p-5 rounded-2xl border text-center transition-transform hover:scale-105 duration-300 ${workTimeData.bg} ${workTimeData.borderColor}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${workTimeData.color}`}>{workTimeData.label}</p>
          <p className={`text-2xl font-black font-mono ${workTimeData.color}`}>{workTimeData.value}</p>
        </div>
      </div>
    </div>
  );
}

