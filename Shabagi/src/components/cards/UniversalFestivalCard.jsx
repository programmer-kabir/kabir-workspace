import React from 'react';
import { Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function UniversalFestivalCard({ 
  cardRef, 
  displayName, 
  gender = 'female', 
  userPhoto, 
  score, 
  hasVirtualTeep,
  district = 'ঢাকা',
  division = 'ঢাকা বিভাগ'
}) {
  const isFemale = gender === 'female';

  return (
    <div
      ref={cardRef}
      className="bg-gradient-to-br from-amber-900 via-rose-950 to-neutral-950 border-4 border-amber-400/80 rounded-[36px] p-5 md:p-6 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Official Top Ribbon */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-slate-950 -m-5 md:-m-6 mb-4 p-4 rounded-t-[32px] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-lg shadow-sm">
            🎉
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-black tracking-wide leading-tight">
              সার্বজনীন সম্প্রীতি ও উৎসব কাউন্সিল
            </h4>
            <p className="text-[9px] text-amber-950 font-black uppercase tracking-widest mt-0.5">
              ALL-FESTIVAL HARMONY VIP PRIVILEGE PASS
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black bg-slate-950 text-amber-300 px-2.5 py-1 rounded-full uppercase border border-amber-400 shadow">
          ভিআইপি সদস্য
        </span>
      </div>

      {/* Slogan Banner */}
      <div className="my-2 py-1.5 px-3 rounded-2xl bg-white/10 border border-white/20 text-center backdrop-blur-sm">
        <p className="text-xs md:text-sm font-black text-amber-300 tracking-wide">
          ✨ "ধর্ম যার যার, উৎসব সবার — খিচুড়ি ও মিষ্টি সবার আগে আমার!" ✨
        </p>
      </div>

      {/* User Info & Photo with Virtual Red Teep */}
      <div className="flex items-center gap-3.5 my-3 bg-white/10 p-3.5 rounded-3xl border border-white/20 backdrop-blur-md">
        <div className="relative flex-shrink-0">
          {userPhoto ? (
            <div className="relative">
              <img
                src={userPhoto}
                alt="ভিআইপি পাসধারী"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-amber-400 shadow-md"
              />
              {/* Virtual Red Teep on forehead if enabled */}
              {hasVirtualTeep && (
                <div 
                  className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border-2 border-red-900 shadow-lg pointer-events-none animate-pulse"
                  title="কপালে লাল টিপ"
                ></div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center text-3xl shadow-inner relative">
              <span>{isFemale ? '👩🏻‍🦰' : '🧔🏻'}</span>
              {hasVirtualTeep && (
                <div className="absolute top-2 w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow"></div>
              )}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow border border-rose-300">
            {score}%
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <p className="text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">পাসধারীর নাম</p>
            <p className="text-base md:text-lg font-black text-white leading-tight truncate">{displayName}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-amber-200/80 uppercase tracking-wider">স্পেশাল পদবী</p>
            <p className="text-xs font-bold text-amber-300 truncate">
              {isFemale ? 'সার্বজনীন খিচুড়ি ও টিপ স্পেশালিস্ট আপা' : 'সার্বজনীন খিচুড়ি ও টিপ বিশেষজ্ঞ'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-amber-200/80 uppercase tracking-wider">পাস আইডি</p>
            <p className="text-xs font-mono font-bold text-rose-300">UTSHOB-SOBAR-{score}99</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-amber-200/80 uppercase tracking-wider">উৎসব জোন</p>
            <p className="text-[11px] font-bold text-amber-300 truncate">📍 {district} জেলা ({division})</p>
          </div>
        </div>
      </div>

      {/* Privileges List */}
      <div className="my-3 p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 mt-0.5 font-bold">✔</span>
          <p className="text-slate-200 leading-snug">
            যেকোনো ধর্মীয় উৎসবে যেয়ে ছবি তুলে ফেসবুকে ৩ প্যারার সম্প্রীতির পোস্ট দেওয়ার স্থায়ী লাইসেন্স।
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-400 mt-0.5 font-bold">✔</span>
          <p className="text-slate-200 leading-snug">
            কপালে বড় লাল বা কালো গোল টিপ পরে সর্বত্র চলাচলের নিরঙ্কুশ প্রগতিশীল অধিকার।
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-400 mt-0.5 font-bold">✔</span>
          <p className="text-slate-200 leading-snug">
            উৎসবের সব অনুষ্ঠানে খিচুড়ি, মিষ্টি ও ফিরনি সর্বপ্রথম পাওয়ার ভিআইপি কোটা সংরক্ষিত।
          </p>
        </div>
      </div>

      {/* Hologram & Footer */}
      <div className="mt-3 pt-3 border-t border-amber-500/30 flex items-center justify-between text-[9px] font-bold text-amber-200/70">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>১০০% সম্প্রীতি ও নিরপেক্ষতা ভেরিফাইড</span>
        </div>
        <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 border border-amber-500/40">
          VALID ALL YEAR
        </span>
      </div>
    </div>
  );
}
