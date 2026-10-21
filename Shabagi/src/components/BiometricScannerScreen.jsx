import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  Flame, 
  ArrowRight, 
  Volume2, 
  Zap, 
  ShieldAlert,
  Cpu,
  Target
} from 'lucide-react';
import { 
  playScanBeepSound, 
  playScanLaserSweep, 
  playBiometricLockSound, 
  playScanCompleteSound,
  playVictorySound
} from '../utils/audio';

export default function BiometricScannerScreen({
  userPhoto,
  userName,
  gender = 'female',
  score = 96,
  onComplete,
  isModal = false,
  onClose
}) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef(null);

  const isFemale = gender === 'female';
  const displayName = userName?.trim() ? userName.trim() : (isFemale ? 'কমরেড তাসনুভা' : 'কমরেড আঁতেল');

  // Satirical diagnostic step logs
  const diagnosticSteps = [
    {
      pct: 15,
      stage: 'ফেসিয়াল বায়োমেট্রিক্স',
      text: 'স্যাটেলাইট অপটিক্যাল ফেস ডিটেকশন চালু... কপালের সুবিশাল লাল টিপের ব্যাস ও গোল চশমার ফ্রেম স্ক্যান হচ্ছে...',
      tag: 'কপালের টিপ: ৪২ মিমি'
    },
    {
      pct: 38,
      stage: 'চুল ও সাবান ডিটেকশন',
      text: 'উশকোখুশকো চুল ও সাবানহীন ত্বকের গন্ধ বিশ্লেষণ চলছে... ফলাফল: ত্বকে সাবানের কোনো ট্রেস মেলেনি! ৯৯.৪% নির্ভেজাল আঁতেল!',
      tag: 'গোসলহীনতা: ১০০%'
    },
    {
      pct: 64,
      stage: 'রক্তের চা-স্পেকট্রোমেট্রি',
      text: 'রক্তের গ্রুপ ও টিএসসির কড়া লিকারের লাল চা পরিমাপ... রেজাল্ট: রক্তের গ্রুপ "চা পজিটিভ (Tea+)"! ক্যাফেইন লেভেল চরম!',
      tag: 'লাল চা পিউরিটি: ৯৮.৭%'
    },
    {
      pct: 88,
      stage: 'বিপ্লবী চেতনা ও ডেসিবল',
      text: 'রাজপথ অবরোধ প্রবণতা ও বিপ্লবী স্লোগান ফ্রিকোয়েন্সি হিসাব... মাত্রা: এক্সট্রিম লেভেল (১২৪ dB)! শান্তিনিকেতনি ভাবাবেগ তুঙ্গে!',
      tag: 'স্লোগান সূচক: অতি-উচ্চ'
    },
    {
      pct: 100,
      stage: 'বায়োমেট্রিক ভেরিফাইড',
      text: 'বায়োমেট্রিক স্ক্যান সম্পন্ন! জাতীয় শাহবাগী সেন্ট্রাল সার্ভারে আপনার নাম স্থায়ীভাবে অন্তর্ভুক্ত করা হয়েছে!',
      tag: 'ম্যাচ: ১০০% খাঁটি শাহবাগী'
    }
  ];

  // Progressive scan timer with audio cues
  useEffect(() => {
    let currentPct = 0;
    playScanLaserSweep();

    intervalRef.current = setInterval(() => {
      currentPct += 2;
      
      // Audio beep intervals
      if (currentPct % 14 === 0 && currentPct < 90) {
        playScanBeepSound(650 + currentPct * 6);
      }
      if (currentPct === 44 || currentPct === 70) {
        playScanLaserSweep();
      }

      if (currentPct >= 20 && currentPct < 40) setStepIndex(1);
      else if (currentPct >= 40 && currentPct < 65) setStepIndex(2);
      else if (currentPct >= 65 && currentPct < 90) setStepIndex(3);
      else if (currentPct >= 90) setStepIndex(4);

      if (currentPct >= 95 && !isLocked) {
        setIsLocked(true);
        playBiometricLockSound();
      }

      if (currentPct >= 100) {
        clearInterval(intervalRef.current);
        setProgress(100);
        setIsDone(true);
        playScanCompleteSound();
        setTimeout(() => {
          playVictorySound();
        }, 350);
        return;
      }

      setProgress(currentPct);
    }, 65); // ~3.3 seconds total scan duration

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleFinish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (onComplete) onComplete();
    if (isModal && onClose) onClose();
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto px-4 py-4 md:py-6'} animate-fadeIn text-white`}>
      
      {/* Top Cyber Satellite Status HUD */}
      <div className="flex items-center justify-between gap-2 mb-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-rose-500/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="font-mono text-rose-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            SAT-ORBIT #SHABAG-TSC-3.0
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <span>LAT: 23.7383° N [TSC]</span>
          <span>•</span>
          <span>LONG: 90.3957° E [SHAHBAG]</span>
        </div>
        <button
          onClick={handleFinish}
          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[11px] font-bold text-amber-300 border border-amber-300/30 flex items-center gap-1"
        >
          <span>{isDone ? 'ফলাফল দেখুন' : 'স্কিপ করুন'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Scanner Container */}
      <div className="relative rounded-[32px] bg-gradient-to-b from-slate-950 via-slate-900 to-black p-5 md:p-8 border-2 border-rose-500/40 shadow-2xl shadow-rose-950/50 overflow-hidden">
        
        {/* Animated Cyber Grid Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(244, 63, 94, 0.4) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>

        {/* Ambient Glow Orbs */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Scanner Title */}
        <div className="text-center mb-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black tracking-wider uppercase mb-1.5">
            <Scan className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>AI বায়োমেট্রিক ফেস ও চেতনা ডিটেকশন</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center justify-center gap-2">
            <span>কমরেড <span className="text-amber-300">{displayName}</span>-এর প্রোফাইল স্ক্যান</span>
          </h2>
          <p className="text-xs text-rose-200/80 mt-0.5">
            স্যাটেলাইট অপটিক্যাল সেন্সরে আপনার শাহবাগী ডিএনএ ও রক্তের লাল চা লিকার পরীক্ষা হচ্ছে...
          </p>
        </div>

        {/* Central Viewport & Diagnostic Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
          
          {/* Left Column: Biometric Face HUD Target (md:col-span-6) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            
            {/* The Target Viewport Box */}
            <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-3xl bg-black/80 border-2 border-rose-500/60 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
              
              {/* Outer Rotating Radar Ring */}
              <div className="absolute inset-2 border border-dashed border-rose-400/40 rounded-full animate-radar-spin pointer-events-none"></div>
              <div className="absolute inset-5 border border-rose-500/20 rounded-full animate-radar-spin-reverse pointer-events-none"></div>
              
              {/* Cyber Corner Brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-rose-400 pointer-events-none"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-rose-400 pointer-events-none"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-rose-400 pointer-events-none"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-rose-400 pointer-events-none"></div>

              {/* Subject Image / Avatar */}
              <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden relative flex items-center justify-center bg-gradient-to-tr from-slate-900 via-rose-950 to-slate-900 border border-white/20">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={displayName}
                    className="w-full h-full object-cover filter contrast-110"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-3 select-none">
                    <span className="text-6xl md:text-7xl mb-1 filter drop-shadow">
                      {isFemale ? '👩🏻‍🦰' : '🧔🏻'}
                    </span>
                    <span className="text-[11px] font-mono text-rose-300 font-bold bg-black/60 px-2 py-0.5 rounded-full border border-rose-500/30">
                      {isFemale ? 'কপালে লাল টিপ' : 'উশকোখুশকো চুল'}
                    </span>
                  </div>
                )}

                {/* Facial Landmark Tracking Hotspots */}
                {/* 1. Forehead Teep Tracking Pin */}
                <div className="absolute top-[22%] left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none">
                  <div className="w-4 h-4 rounded-full border border-red-500 bg-red-600/40 animate-ping"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-lg shadow-red-500/80 -ml-3.5"></div>
                  <span className="bg-black/80 text-[8px] font-mono text-rose-300 px-1 py-0.5 rounded border border-rose-500/40 whitespace-nowrap ml-1 font-bold">
                    [লাল টিপ ডিটেক্টেড]
                  </span>
                </div>

                {/* 2. Eye Glasses Sensor */}
                <div className="absolute top-[40%] left-[20%] right-[20%] border-t border-b border-cyan-400/50 flex justify-between px-1 pointer-events-none">
                  <span className="text-[8px] font-mono text-cyan-300 font-bold bg-black/70 px-1">
                    {isFemale ? 'স্মার্ট দৃষ্টি' : 'গোল চশমা'}
                  </span>
                  <span className="text-[8px] font-mono text-cyan-300 font-bold bg-black/70 px-1">
                    FOCAL: 98%
                  </span>
                </div>

                {/* 3. Tea & Lip Sensor */}
                <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="bg-black/85 text-[8px] font-mono text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40 whitespace-nowrap font-bold flex items-center gap-1">
                    <span>☕ চা লিকার ৯৯%</span>
                  </div>
                </div>

                {/* Glowing Laser Scan Beam moving up and down */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-scan-beam pointer-events-none z-20">
                  <div className="w-2 h-2 rounded-full bg-white mx-auto -mt-0.5 shadow-[0_0_8px_#ffffff]"></div>
                </div>

                {/* Target Locked Overlay Stamp on 100% */}
                {isDone && (
                  <div className="absolute inset-0 bg-red-600/25 backdrop-blur-[2px] flex items-center justify-center p-2 z-30 animate-fadeIn">
                    <div className="border-4 border-white/90 bg-rose-700/90 text-white font-black text-center py-2 px-3 rounded-2xl rotate-[-6deg] shadow-2xl">
                      <p className="text-[10px] tracking-widest uppercase">OFFICIALLY VERIFIED</p>
                      <p className="text-base font-extrabold text-amber-200">১০০% খাঁটি শাহবাগী</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Viewport Reticle Target Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 border border-rose-400/30 rounded-full flex items-center justify-center">
                  <Target className={`w-6 h-6 ${isLocked ? 'text-emerald-400' : 'text-rose-400'} animate-pulse`} />
                </div>
              </div>
            </div>

            {/* Live Status Pill below viewport */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`}></span>
              <span className="font-mono text-xs font-bold text-slate-300">
                {isDone ? 'বায়োমেট্রিক বিশ্লেষণ সম্পন্ন!' : diagnosticSteps[stepIndex].stage}
              </span>
            </div>
          </div>

          {/* Right Column: Telemetry Gauges & Satirical Diagnostic Terminal (md:col-span-6) */}
          <div className="md:col-span-6 space-y-3.5">
            
            {/* Live Progress Percentage Card */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-rose-500/30 shadow-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-rose-400" />
                  স্ক্যান অগ্রগতি (ANALYSIS PROGRESS)
                </span>
                <span className="text-xl font-mono font-black text-amber-300">
                  {progress}%
                </span>
              </div>

              {/* Segmented Neon Progress Bar */}
              <div className="w-full h-3 bg-black/60 rounded-full p-0.5 border border-rose-500/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 transition-all duration-100 shadow-[0_0_10px_#f43f5e]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* 4 Satirical Real-time Sensor Meters */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/20">
                <div className="text-[10px] text-slate-400">🔴 কপালে টিপ ব্যাস</div>
                <div className="text-sm font-black text-rose-400 mt-0.5">
                  {progress > 15 ? '৪২.৫ mm (বিশাল)' : 'ক্যালকুলেটিং...'}
                </div>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/20">
                <div className="text-[10px] text-slate-400">☕ রক্তে লাল চা লিকার</div>
                <div className="text-sm font-black text-amber-400 mt-0.5">
                  {progress > 40 ? '৯৮.৭% (Tea+)' : 'অপেক্ষা করুন...'}
                </div>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/20">
                <div className="text-[10px] text-slate-400">🚿 গোসল বিমুখতা ইনডেক্স</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {progress > 65 ? '১০০% (সাবানহীন)' : 'ডিএনএ রিডিং...'}
                </div>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/20">
                <div className="text-[10px] text-slate-400">📢 স্লোগান তীব্রতা</div>
                <div className="text-sm font-black text-cyan-400 mt-0.5">
                  {progress > 85 ? '১২৪ dB (বিপ্লবী)' : 'ফ্রিকোয়েন্সি চেক...'}
                </div>
              </div>
            </div>

            {/* Satirical Terminal Output Box */}
            <div className="bg-black/90 rounded-2xl p-3.5 border border-rose-500/40 font-mono text-xs text-rose-300/90 shadow-inner min-h-[90px] flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border-b border-white/10 pb-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>SYSTEM DIAGNOSTIC LOG</span>
              </div>
              <p className="text-xs leading-relaxed text-white font-medium">
                {diagnosticSteps[stepIndex].text}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-amber-300 font-bold">
                <span>ট্যাগ: {diagnosticSteps[stepIndex].tag}</span>
                <span className="animate-pulse">● LIVE</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Call-to-action button when scan finishes */}
        <div className="mt-6 pt-4 border-t border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="text-xs text-slate-300 text-center sm:text-left">
            {isDone ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                বায়োমেট্রিক সনদপত্র প্রস্তুত! নিচে ক্লিক করে লাইসেন্স ও কার্ড অ্যালবাম দেখুন।
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                স্ক্যানিং চলছে... সম্পূর্ণ নির্ভুল ফলাফলের জন্য অপেক্ষা করুন।
              </span>
            )}
          </div>

          <button
            onClick={handleFinish}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 ${
              isDone
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-rose-600/40 animate-pulse'
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            <span>{isDone ? '🎉 চূড়ান্ত ৫টি সনদ ও লাইসেন্সপত্র দেখুন' : 'ফলাফল সরাসরি দেখুন (Skip)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
