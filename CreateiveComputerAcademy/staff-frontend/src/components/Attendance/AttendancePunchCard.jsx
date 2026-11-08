import React from 'react';
import { FiCheckCircle, FiLogOut, FiAlertTriangle, FiShield, FiLoader } from 'react-icons/fi';

export default function AttendancePunchCard({
  time,
  todayStatus,
  isPunching,
  currentUser,
  handleCheckIn,
  handleCheckOut
}) {
  const isAuthorizedToPunch = Number(currentUser?.id) === 2;
  const isCashierRole = [4, 5].includes(currentUser?.id);

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
      {/* Animated Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500/5 to-transparent dark:from-primary-500/10 pointer-events-none opacity-50"></div>

      <div className="relative mb-6 mt-2">
        <div className="absolute inset-0 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-full animate-ping opacity-75"></div>

        {/* Outer Bezel (3D Cyan Gradient) */}
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-300 via-cyan-500 to-cyan-700 shadow-[0_0_20px_rgba(6,182,212,0.6)] p-[8px] relative z-10 group-hover:scale-105 transition-transform duration-500">
          {/* Inner White Face */}
          <div className="w-full h-full bg-white rounded-full shadow-[inset_0_2px_15px_rgba(0,0,0,0.15)] relative flex items-center justify-center">
            {/* 60 Minute Ticks */}
            {[...Array(60)].map((_, i) => (
              <div key={`tick-${i}`} className="absolute inset-[3px] pointer-events-none" style={{ transform: `rotate(${i * 6}deg)` }}>
                <div className={`mx-auto rounded-none ${i % 5 === 0 ? 'w-[2.5px] h-2.5 bg-slate-800' : 'w-[1.5px] h-1.5 bg-slate-400'}`}></div>
              </div>
            ))}

            {/* 12 Numbers */}
            {[...Array(12)].map((_, i) => {
              const num = i === 0 ? 12 : i;
              const angle = i * 30;
              const radius = 50;
              const x = Math.sin((angle * Math.PI) / 180) * radius;
              const y = -Math.cos((angle * Math.PI) / 180) * radius;
              return (
                <div
                  key={`num-${num}`}
                  className="absolute top-1/2 left-1/2 text-[14px] font-bold text-slate-800 pointer-events-none flex items-center justify-center leading-none"
                  style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                >
                  {num}
                </div>
              );
            })}

            {/* Logo / Brand */}
            <div className="absolute top-[28%] text-[9px] font-black text-cyan-700 tracking-widest uppercase pointer-events-none">
              CREATIVE
            </div>

            {/* Hour Hand (Dark Cyan) */}
            <div
              className="absolute top-1/2 left-1/2 w-[5px] h-[26%] bg-cyan-950 rounded-full origin-bottom z-10 shadow-sm transition-transform duration-200"
              style={{ transform: `translate(-50%, -100%) rotate(${(time.getHours() / 12) * 360 + (time.getMinutes() / 60) * 30}deg)` }}
            ></div>

            {/* Minute Hand (Dark Cyan) */}
            <div
              className="absolute top-1/2 left-1/2 w-[3.5px] h-[37%] bg-cyan-900 rounded-full origin-bottom z-20 shadow-sm transition-transform duration-200"
              style={{ transform: `translate(-50%, -100%) rotate(${(time.getMinutes() / 60) * 360 + (time.getSeconds() / 60) * 6}deg)` }}
            ></div>

            {/* Second Hand (Orange with tail) */}
            <div
              className="absolute top-1/2 left-1/2 w-[2px] h-[46%] bg-orange-500 rounded-full origin-[50%_80%] z-30 shadow-md transition-transform duration-200 ease-linear"
              style={{ transform: `translate(-50%, -80%) rotate(${(time.getSeconds() / 60) * 360}deg)` }}
            ></div>

            {/* Center Pin (Black with silver dot) */}
            <div className="absolute top-1/2 left-1/2 w-3.5 h-3.5 bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-40 shadow-md flex items-center justify-center">
              <div className="w-[3px] h-[3px] bg-slate-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight font-mono relative z-10">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">
        {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="w-full max-w-sm">
        {!todayStatus ? (
          <button
            onClick={handleCheckIn}
            disabled={isPunching || !isAuthorizedToPunch}
            className={`relative overflow-hidden w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider group/btn ${isPunching ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
            {isPunching ? (
              <>
                <FiLoader size={20} className="animate-spin relative z-10" />
                <span className="relative z-10 text-sm">Verifying & Punching...</span>
              </>
            ) : (
              <>
                <FiCheckCircle size={20} className="relative z-10" /> <span className="relative z-10">Check In Now</span>
              </>
            )}
          </button>
        ) : !todayStatus.check_out ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl relative overflow-hidden shadow-sm hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle size={64} />
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 font-black uppercase tracking-wider text-sm mb-0.5">
                {isCashierRole ? "Cash In" : "Check In"}
              </p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">at {todayStatus.check_in}</p>
            </div>
            <button
              onClick={handleCheckOut}
              disabled={isPunching || !isAuthorizedToPunch}
              className={`w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:bg-rose-700 hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider ${isPunching ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isPunching ? (
                <>
                  <FiLoader size={20} className="animate-spin" />
                  <span className="text-sm">Processing...</span>
                </>
              ) : (
                <>
                  <FiLogOut size={20} /> {isCashierRole ? "Cash Out" : "Check Out"}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
            <div className="flex justify-center text-emerald-500 mb-3">
              <FiCheckCircle size={32} />
            </div>
            <p className="text-slate-800 dark:text-slate-100 font-black uppercase tracking-wider text-sm mb-1">Workday Completed</p>
            <p className="font-bold text-slate-500 dark:text-slate-400 font-mono">
              In: {todayStatus.check_in} | Out: {todayStatus.check_out}
            </p>
            {Number(todayStatus.is_forgotten_checkout) === 1 && (
              <div className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 flex items-center justify-center gap-1.5">
                <FiAlertTriangle size={14} className="shrink-0 text-amber-500" />
                <span>Auto checked out by system at shift end</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <FiShield size={13} className="text-emerald-500" />
          <span>Office Geofence & Device Protected</span>
        </div>
      </div>
    </div>
  );
}

