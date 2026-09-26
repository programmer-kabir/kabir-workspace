import React, { useRef } from 'react';
import { FiX, FiPrinter, FiAward, FiCheckCircle, FiShield, FiCalendar } from 'react-icons/fi';

const getSpeedTier = (wpm) => {
  if (wpm >= 70) return { title: 'Master Typist (Platinum Tier)', icon: '👑', color: 'from-purple-600 to-indigo-600', text: 'text-purple-600 dark:text-purple-400' };
  if (wpm >= 50) return { title: 'Pro Typist (Gold Tier)', icon: '🥇', color: 'from-amber-500 to-yellow-600', text: 'text-amber-600 dark:text-amber-400' };
  if (wpm >= 35) return { title: 'Intermediate Typist (Silver Tier)', icon: '🥈', color: 'from-slate-400 to-slate-600', text: 'text-slate-600 dark:text-slate-400' };
  return { title: 'Qualified Typist (Bronze Tier)', icon: '🥉', color: 'from-orange-500 to-amber-700', text: 'text-orange-600 dark:text-orange-400' };
};

const TypingCertificateModal = ({
  isOpen,
  onClose,
  stats,
  passageTitle,
  durationSec,
  user
}) => {
  const certRef = useRef(null);

  if (!isOpen || !stats) return null;

  const netWpm = stats.netWpm || stats.wpm || 0;
  const grossWpm = stats.grossWpm || stats.raw_wpm || netWpm;
  const accuracy = stats.accuracy || stats.accuracy_percent || 100;
  const durationMin = Math.max(1, Math.round((durationSec || stats.timeSpentSec || 60) / 60));
  const studentName = user?.name || user?.full_name || 'Dedicated Typist';
  const tier = getSpeedTier(netWpm);

  const certId = `CCA-TYP-${user?.id || 'STUDENT'}-${Date.now().toString(36).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              🎓
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Official Typing Speed & Accuracy Diploma
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Verified certificate issued by Creative Computer Academy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FiPrinter size={14} />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* ── THE PRINTABLE CERTIFICATE CANVAS ───────────────────────── */}
        <div className="p-4 sm:p-8 md:p-10 bg-slate-100 dark:bg-slate-950 flex items-center justify-center print:p-0 print:bg-white">
          <div
            ref={certRef}
            className="w-full max-w-3xl bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/80 text-slate-900 border-8 border-double border-amber-500/80 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden text-center space-y-6 print:border-8 print:border-amber-600 print:shadow-none print:rounded-none print:m-0 print:w-full print:h-screen print:flex print:flex-col print:justify-between"
          >
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[280px]">⌨️</span>
            </div>

            {/* Certificate Header */}
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <span className="text-2xl">★</span>
                <span className="text-xs font-black uppercase tracking-[0.25em]">
                  CREATIVE COMPUTER ACADEMY (CCA)
                </span>
                <span className="text-2xl">★</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-serif text-slate-950">
                Certificate of Proficiency
              </h1>

              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-600">
                IN PROFESSIONAL TOUCH TYPING SPEED & ACCURACY
              </p>

              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto pt-1" />
            </div>

            {/* Recipient Section */}
            <div className="space-y-2 relative z-10 py-2">
              <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
                This certificate is officially presented with distinction to
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-indigo-950 underline decoration-amber-400 decoration-2 underline-offset-8">
                {studentName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto pt-3 font-medium leading-relaxed">
                For demonstrating exceptional keyboard mastery and professional typing dexterity in the official <strong>{durationMin}-Minute Speed Exam</strong> on <em>"{passageTitle || 'Standard Passage'}"</em>.
              </p>
            </div>

            {/* Verified Metrics Badge Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto relative z-10">
              <div className="p-3 rounded-2xl bg-white/90 border border-amber-200 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Net Speed</p>
                <p className="text-2xl font-black text-indigo-950 font-mono">⚡ {netWpm}</p>
                <p className="text-[9px] text-slate-500 font-bold">Words Per Minute</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 border border-amber-200 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Accuracy</p>
                <p className="text-2xl font-black text-emerald-900 font-mono">🎯 {accuracy}%</p>
                <p className="text-[9px] text-slate-500 font-bold">Standard Formula</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 border border-amber-200 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-600">Gross Speed</p>
                <p className="text-2xl font-black text-purple-950 font-mono">🚀 {grossWpm}</p>
                <p className="text-[9px] text-slate-500 font-bold">Raw Keystrokes</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 border border-amber-200 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Rating</p>
                <p className="text-xl font-black text-amber-900 truncate">{tier.icon}</p>
                <p className="text-[9px] text-slate-600 font-bold truncate">{tier.title.split(' ')[0]}</p>
              </div>
            </div>

            {/* Tier Badge Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black relative z-10 shadow-xs">
              <span>{tier.icon}</span>
              <span>HONOR LEVEL: {tier.title.toUpperCase()}</span>
            </div>

            {/* Certificate Footer: Signatures & Verification Stamp */}
            <div className="pt-6 border-t border-amber-200 flex items-end justify-between text-left text-xs relative z-10">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <FiCalendar size={13} className="text-amber-600" />
                  <span>Date Issued:</span>
                </p>
                <p className="text-slate-700 font-semibold">{currentDate}</p>
                <p className="text-[10px] font-mono text-slate-400 font-medium">ID: {certId}</p>
              </div>

              {/* Official Gold Seal Graphic */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-dashed border-amber-500 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-lg flex flex-col items-center justify-center text-amber-950 select-none">
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">CCA</span>
                <span className="text-base sm:text-xl font-bold">★ SEAL ★</span>
                <span className="text-[8px] font-black tracking-tighter uppercase">OFFICIAL</span>
              </div>

              <div className="text-right space-y-1">
                <div className="font-serif italic font-black text-indigo-900 text-sm sm:text-base border-b border-slate-300 pb-1">
                  Academic Board of Examiners
                </div>
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  Creative Computer Academy
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Director of Digital Learning</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TypingCertificateModal;
