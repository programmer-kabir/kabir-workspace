import React from 'react';
import { Droplets, ShieldCheck, QrCode } from 'lucide-react';

export default function AntiShowerLicenseCard({ 
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
      className="bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50 border-4 border-teal-500 rounded-[36px] p-5 md:p-6 shadow-2xl relative overflow-hidden text-slate-800"
    >
      {/* Official Government style Top Header */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white -m-5 md:-m-6 mb-4 p-4 rounded-t-[32px] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-lg shadow-sm">
            🚿
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-black tracking-wide leading-tight">
              গণপ্রজাতন্ত্রী গোসল বর্জন অধিদপ্তর
            </h4>
            <p className="text-[9px] text-teal-200 font-bold uppercase tracking-widest mt-0.5">
              SMART ANTI-SHOWER NATIONAL LICENSE • আইডি নং: {score}90-B
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-amber-300 bg-amber-400/30 flex items-center justify-center text-[10px] font-black text-amber-200 shadow">
          GOV
        </div>
      </div>

      {/* Hologram Stamp */}
      <div className="absolute top-16 right-3 transform rotate-[-8deg] opacity-90 pointer-events-none z-10">
        <div className="border-2 border-emerald-600 rounded-2xl px-2.5 py-1 text-[10px] font-black text-emerald-700 bg-emerald-100/95 shadow-sm uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>১০০% সাবানমুক্ত</span>
        </div>
      </div>

      {/* Main License Content */}
      <div className="flex gap-4 items-center my-3 bg-white/90 p-3.5 rounded-3xl border border-teal-200/80 shadow-sm">
        {/* Photo with Smart Card Border & Virtual Teep */}
        <div className="relative flex-shrink-0">
          {userPhoto ? (
            <div className="relative">
              <img
                src={userPhoto}
                alt="লাইসেন্সধারী ছবি"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-teal-500 shadow-md"
              />
              {hasVirtualTeep && (
                <div 
                  className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-white shadow"
                  title="কপালে লাল টিপ"
                ></div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-teal-100 border-4 border-teal-400 flex flex-col items-center justify-center text-3xl shadow-inner relative">
              <span>{isFemale ? '👩🏻‍🦰' : '🧔🏻'}</span>
              {hasVirtualTeep && (
                <div className="absolute top-1.5 w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow"></div>
              )}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-teal-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow">
            PASS
          </span>
        </div>

        {/* License details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">লাইসেন্সধারীর নাম</p>
            <p className="text-base md:text-lg font-black text-slate-900 leading-tight truncate">{displayName}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">লাইসেন্স নং</p>
            <p className="text-xs font-mono font-black text-teal-800 tracking-wider">NO-SOAP-2026-{score}99</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">গোসল বর্জন সক্ষমতা</p>
            <p className="text-xs font-black text-emerald-600">{score}% বিশুদ্ধ গোসলহীন</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">আঞ্চলিক ঘাঁটি</p>
            <p className="text-[11px] font-bold text-teal-900 truncate">📍 {district} জেলা ({division})</p>
          </div>
        </div>
      </div>

      {/* Slogan Pill */}
      <div className="my-2 py-1 px-3 rounded-xl bg-teal-100/70 border border-teal-300 text-center">
        <p className="text-[11px] font-black text-teal-900">
          🌿 "শরীরে দুর্গন্ধ নয়—এটি হলো কর্পোরেট সাবানবিরোধী বিপ্লবের সুবাস!" 🌿
        </p>
      </div>

      {/* License Rules & Conditions Box */}
      <div className="my-3 p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-1.5 text-xs text-slate-700">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-500">লাইসেন্স শ্রেণি:</span>
          <span className="text-teal-900 font-extrabold">হেভি ডিউটি পানি ও সাবান সাশ্রয়ী</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-500">সাবান স্পর্শের অনুমোদন:</span>
          <span className="text-red-600 font-extrabold">সম্পূর্ণ নিষিদ্ধ ও দণ্ডনীয়</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-500">মেয়াদ উত্তীর্ণের তারিখ:</span>
          <span className="text-emerald-700 font-extrabold">বিপ্লব না আসা পর্যন্ত আজীবন</span>
        </div>
      </div>

      {/* Barcode & Footer Strip */}
      <div className="mt-3 pt-3 border-t border-teal-200/80 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[9px] font-black text-teal-900 tracking-widest font-mono">
            ||||| | |||| ||| |||||| | ||| |||||||
          </div>
          <p className="text-[9px] text-slate-400 font-bold">কর্তৃপক্ষ: প্রধান গোসল পরিদর্শক</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-[9px] font-black border border-teal-300">
            স্মার্ট ওয়াটার সেভার ২০২৬
          </span>
        </div>
      </div>
    </div>
  );
}
