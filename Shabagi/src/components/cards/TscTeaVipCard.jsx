import React from 'react';
import { Wifi, Sparkles, Coffee } from 'lucide-react';

export default function TscTeaVipCard({ cardRef, displayName, userPhoto, score }) {
  return (
    <div
      ref={cardRef}
      className="bg-gradient-to-br from-zinc-950 via-neutral-900 to-amber-950 border-2 border-amber-500/70 rounded-[34px] p-6 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Background Gold Shimmer Waves */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Card Branding */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            ☕
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-black tracking-widest text-amber-300 uppercase leading-none">
              TSC TEA CLUB
            </h4>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              BLACK PLATINUM MEMBER CARD
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Wifi className="w-4 h-4 transform rotate-90" />
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
            VIP PASS
          </span>
        </div>
      </div>

      {/* Gold EMV Metallic Chip Graphic & Contactless */}
      <div className="flex items-center justify-between my-3 px-1">
        <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200 shadow-md flex flex-col justify-between p-1.5">
          <div className="w-full h-0.5 bg-amber-700/50"></div>
          <div className="w-full h-0.5 bg-amber-700/50"></div>
          <div className="w-full h-0.5 bg-amber-700/50"></div>
        </div>

        {/* User Mini Avatar on Card */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="ইউজার"
              className="w-8 h-8 rounded-full object-cover border-2 border-amber-400"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
              🧔🏻
            </div>
          )}
          <span className="text-[11px] font-bold text-amber-200 truncate max-w-[120px]">
            {displayName}
          </span>
        </div>
      </div>

      {/* 16 Digit Embossed Card Number */}
      <div className="my-4 px-1">
        <p className="font-mono text-base md:text-lg font-black tracking-[0.25em] text-amber-200/95 drop-shadow">
          7100 • 2026 • 99{score} • 1971
        </p>
        <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
          <span>MEMBER SINCE: 2026</span>
          <span>EXPIRES: NEVER / ∞</span>
        </div>
      </div>

      {/* VIP Tea Privileges Box */}
      <div className="my-3 p-3 rounded-2xl bg-white/5 border border-amber-500/30 space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-400 font-bold">দৈনিক চা কোটা:</span>
          <span className="text-xs font-black text-amber-300">আনলিমিটেড কড়া লিকার</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-400 font-bold">আড্ডার মেয়াদ:</span>
          <span className="text-xs font-black text-emerald-400">সন্ধ্যা ৬টা থেকে ভোর ৫টা</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-400 font-bold">সদস্য মর্যাদা:</span>
          <span className="text-xs font-black text-amber-400">লেজেন্ডারি লিকার মাস্টার ({score}%)</span>
        </div>
      </div>

      {/* Card Footer Strip */}
      <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-[9px] text-zinc-400 font-bold">
        <span>টিএসসি মোড় • comrademeter.app</span>
        <span className="text-amber-400 font-black">PLATINUM CLUB</span>
      </div>
    </div>
  );
}
