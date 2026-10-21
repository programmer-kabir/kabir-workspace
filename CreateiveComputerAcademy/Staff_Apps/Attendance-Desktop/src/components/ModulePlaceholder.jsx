import React from 'react';
import { FiExternalLink, FiClock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const ModulePlaceholder = ({ 
  tabId, 
  title, 
  engTitle, 
  icon, 
  stepLabel, 
  description, 
  features = [], 
  webPath,
  onBackToAttendance 
}) => {

  const handleOpenBrowser = () => {
    const baseUrl = 'http://localhost:5174';
    const targetUrl = `${baseUrl}${webPath}`;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(targetUrl);
    } else {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar select-none">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-2xl text-sky-600 dark:text-sky-400">
              {icon}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                {stepLabel || 'Upcoming Module'}
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{engTitle}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          {description}
        </p>

        {features.length > 0 && (
          <div className="mb-6 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              এই মডিউলে যা যা থাকছে:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60">
                  <FiCheckCircle className="text-sky-500 dark:text-sky-400 shrink-0" size={14} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onBackToAttendance}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <FiArrowLeft size={14} />
            হাজিরা ড্যাশবোর্ডে ফিরুন
          </button>

          <button
            onClick={handleOpenBrowser}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition cursor-pointer"
          >
            <FiExternalLink size={14} />
            ব্রাউজারে এখনই খুলুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
