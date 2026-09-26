import React, { useRef } from 'react';
import {
  FiAward, FiZap, FiActivity, FiClock, FiCheckCircle,
  FiPrinter, FiTarget, FiAlertCircle, FiLock
} from 'react-icons/fi';

const FoundationsAnalytics = ({ progressData, user }) => {
  const stats = progressData?.stats || {};
  const badges = progressData?.badges || [];
  const weakKeys = progressData?.weak_keys || {};
  const recentTyping = progressData?.recent_typing || [];
  const certRef = useRef(null);

  const handlePrintCertificate = () => {
    window.print();
  };

  const isEligibleForCert = (stats.best_wpm_en >= 15 || stats.best_wpm_bn >= 10) && stats.total_drills_completed >= 2;

  return (
    <div className="space-y-8">
      {/* Metrics Summary HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Best Typing Speed</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.best_wpm_en || 0} <span className="text-xs font-bold text-slate-400">WPM (EN)</span>
          </p>
          {stats.best_wpm_bn > 0 && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              🇧🇩 {stats.best_wpm_bn} WPM (Bangla)
            </p>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Average Accuracy</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.avg_typing_accuracy || 100}%
          </p>
          <p className="text-[11px] text-slate-400">Across all practice sessions</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Drills Completed</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.total_drills_completed || 0}
          </p>
          <p className="text-[11px] text-slate-400">Mouse & shortcut exercises</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Badges Earned</p>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {stats.unlocked_badges_count || 0} / {stats.total_badges_count || 11}
          </p>
          <p className="text-[11px] text-slate-400">Skill milestones unlocked</p>
        </div>
      </div>

      {/* Weak Keys Heatmap Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎯 Weak Keys & Error Heatmap</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keys where you made the most typos. Target these keys during practice to boost your WPM.
            </p>
          </div>
        </div>

        {Object.keys(weakKeys).length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl">
            No weak keys recorded yet! Keep practicing to generate your error heatmap analysis.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(weakKeys).slice(0, 12).map(([key, count]) => (
              <div
                key={key}
                className="px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-mono font-black flex items-center justify-center text-xs uppercase">
                  {key === ' ' ? 'SPC' : key}
                </span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {count} {count === 1 ? 'typo' : 'typos'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges Showcase Grid */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏆 Skill Badges & Trophies</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Earn badges by hitting speed milestones and completing foundation drills.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {badges.map((b) => (
            <div
              key={b.code}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                b.is_unlocked
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                b.is_unlocked
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 shadow-inner'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                {b.is_unlocked ? b.icon : <FiLock size={18} />}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {b.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {b.description}
                </p>
                {b.is_unlocked && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                    ✓ Unlocked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Digital Certificate of Computer Foundations */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎓 Digital Certificate of Computer Foundations</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Awarded upon achieving 15+ WPM typing speed and completing 2+ mouse drills.
            </p>
          </div>

          {isEligibleForCert && (
            <button
              onClick={handlePrintCertificate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <FiPrinter size={15} />
              <span>Print / Download Certificate</span>
            </button>
          )}
        </div>

        {isEligibleForCert ? (
          /* Certificate Card */
          <div
            ref={certRef}
            className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-indigo-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 border-4 border-double border-amber-400/80 dark:border-amber-500/50 shadow-2xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="space-y-1">
              <span className="text-4xl">🏆</span>
              <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Creative Computer Academy
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif">
                Certificate of Competency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In Computer Foundations, Touch Typing & Mouse Precision
              </p>
            </div>

            <div className="py-2 space-y-2 max-w-lg mx-auto">
              <p className="text-xs text-slate-500 dark:text-slate-400">This is proudly presented to</p>
              <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 underline-offset-8">
                {user?.name || 'Dedicated Student'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 font-medium">
                For demonstrating exceptional dedication and achieving <strong>{stats.best_wpm_en} WPM</strong> typing speed with <strong>{stats.avg_typing_accuracy}%</strong> accuracy.
              </p>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-amber-200 dark:border-amber-900/60 text-left text-xs text-slate-500 dark:text-slate-400">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Date Issued</p>
                <p>{new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-indigo-600 dark:text-indigo-400 font-serif">Creative Computer Academy</p>
                <p className="text-[10px] text-slate-400">Director of Academic Excellence</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <span className="text-3xl">🔒</span>
            <h5 className="text-sm font-black text-slate-800 dark:text-slate-200">Certificate Locked</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Complete at least 2 mouse drills and reach 15 WPM in typing to unlock your official digital certificate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundationsAnalytics;
