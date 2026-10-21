import React from 'react';
import { Flame, Sparkles, Award } from 'lucide-react';

export default function MasterCertificateCard({ 
  cardRef, 
  displayName, 
  gender = 'female', 
  userPhoto, 
  score, 
  result, 
  goals, 
  hasVirtualTeep,
  district = 'ঢাকা',
  division = 'ঢাকা বিভাগ'
}) {
  const isFemale = gender === 'female';

  return (
    <div
      ref={cardRef}
      className="bg-gradient-to-br from-amber-50 via-rose-50/40 to-orange-50 border-4 border-rose-300 rounded-[38px] p-5 md:p-7 shadow-2xl relative overflow-hidden text-slate-800"
    >
      {/* Red Seal Stamp */}
      <div className="absolute -top-1 -right-1 transform rotate-12 opacity-95 pointer-events-none z-10">
        <div className="border-2 border-red-600 rounded-full px-3 py-1 text-[11px] font-black text-red-600 bg-red-50/95 uppercase tracking-widest shadow-md flex items-center gap-1">
          <span>{isFemale ? 'খাঁটি নারী কমরেড' : 'খাঁটি শাহবাগী'}</span>
          <span>🚩</span>
        </div>
      </div>

      {/* Certificate Brand Header */}
      <div className="flex items-center justify-between border-b border-rose-200/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md">
            <Flame className="w-5 h-5 text-yellow-200 fill-yellow-200" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-black text-slate-900 leading-none">
              জাতীয় শাহবাগী ও আঁতেল মহাসনদ
            </h4>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              AntelScope™ • কেন্দ্রীয় মুক্তচিন্তা, কপালে টিপ ও প্রতিবাদী ব্যুরো
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shadow-xs">
          {result.emoji} {result.grade}
        </span>
      </div>

      {/* User Profile & Photo Section with optional Virtual Red Teep */}
      <div className="flex items-center gap-3.5 my-3 bg-white/90 p-3.5 rounded-3xl border border-rose-100 shadow-sm">
        <div className="relative flex-shrink-0">
          {userPhoto ? (
            <div className="relative">
              <img
                src={userPhoto}
                alt="ইউজার ছবি"
                className="w-16 h-16 rounded-full object-cover border-4 border-rose-400 shadow-md"
              />
              {hasVirtualTeep && (
                <div 
                  className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow"
                  title="কপালে লাল টিপ"
                ></div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-100 to-amber-200 border-4 border-rose-300 flex flex-col items-center justify-center text-3xl shadow-inner relative">
              <span>{isFemale ? '👩🏻‍🦰' : '🧔🏻'}</span>
              {hasVirtualTeep && (
                <div className="absolute top-1.5 w-3 h-3 rounded-full bg-red-600 border border-white shadow"></div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              {isFemale ? 'সনদপ্রাপ্ত কমরেড আপা' : 'সনদপ্রাপ্ত কমরেড'}
            </p>
            {district && (
              <span className="text-[10px] bg-red-100 text-red-700 font-black px-2 py-0.5 rounded-full border border-red-200 shadow-xs">
                📍 {district} জেলা
              </span>
            )}
          </div>
          <p className="text-lg md:text-xl font-black text-slate-900 leading-tight truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs font-bold text-rose-600 truncate">{result.badge}</span>
            {division && (
              <span className="text-[9.5px] font-semibold text-slate-500">({division})</span>
            )}
          </div>
        </div>
      </div>

      {/* Circular Score Meter & Status */}
      <div className="my-3.5 p-4 rounded-3xl bg-white border border-rose-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 flex-shrink-0">
            <span className="text-2xl font-black leading-none">{score}%</span>
            <span className="text-[9px] font-extrabold uppercase tracking-tighter mt-0.5">শাহবাগী</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">জাতীয় মর্যাদা</p>
            <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight mt-0.5">
              {result.title}
            </h3>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-xs">
            ✓ ৮৫%+ সার্টিফাইড
          </span>
        </div>
      </div>

      {/* Humorous description & advice */}
      <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium px-1">
        {result.description}
      </p>

      <div className="my-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-left text-xs text-orange-950 font-medium leading-relaxed">
        💡 <span className="font-bold">{result.advice}</span>
      </div>

      {/* UNLOCKED GOALS & MEDALS */}
      <div className="mt-3 pt-3 border-t border-rose-100">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 text-center">
          অর্জিত বিশেষ সম্মাননা পদক ({goals.length}/৪)
        </p>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {goals.map((g, i) => (
            <div key={i} className="bg-white/90 border border-rose-200/90 rounded-2xl py-2 px-1 shadow-xs">
              <span className="text-lg block mb-0.5">{g.icon}</span>
              <span className="text-[9px] font-black text-slate-800 block truncate">{g.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Footer */}
      <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
        <span>ভেরিফিকেশন কোড: #SHAHBAG-2026-{score}</span>
        <span className="font-mono text-rose-600 font-black">AntelScope Official Seal</span>
      </div>
    </div>
  );
}
