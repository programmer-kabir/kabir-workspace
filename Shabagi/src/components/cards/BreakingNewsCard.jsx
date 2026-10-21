import React from 'react';
import { Radio, AlertTriangle, Flame, Tv } from 'lucide-react';

export default function BreakingNewsCard({
  cardRef,
  displayName = 'কমরেড আঁতেল',
  gender = 'female',
  userPhoto = null,
  channelName = 'শাহবাগ ২৪',
  locationName = null,
  headline = 'টানা ৪২ দিন গোসল বর্জন করে শাহবাগে মার্ক্সবাদের বই পড়ার দায়ে কমরেড আটক!',
  tickerText = 'টিএসসিতে চায়ের দাম ১ টাকা বাড়ায় ৩ দিনের অনশনের ডাক • কপালে ৩ ইঞ্চি লাল টিপ না পরলে প্রবেশ নিষেধ!',
  reporterName = 'স্বপন আঁতেল, বিশেষ প্রতিনিধি',
  hasVirtualTeep = true,
  district = 'ঢাকা',
  division = 'ঢাকা বিভাগ'
}) {
  const isFemale = gender === 'female';
  const displayLocation = locationName || (district ? `${district} ব্যুরো, ${division}` : 'শাহবাগ চত্বর, ঢাকা');

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[620px] aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden relative shadow-2xl bg-slate-950 text-white select-none border-2 border-slate-700/80 flex flex-col justify-between"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(220, 38, 38, 0.25)'
      }}
    >
      {/* 1. Main Background / Camera Subject */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        {userPhoto ? (
          <img
            src={userPhoto}
            alt={displayName}
            className="w-full h-full object-cover filter contrast-105 brightness-95"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-rose-950/40 to-slate-900 pb-16">
            <span className="text-8xl sm:text-9xl mb-2 filter drop-shadow-2xl">
              {isFemale ? '👩🏻‍🦰' : '🧔🏻'}
            </span>
            <span className="text-xs font-mono text-rose-300 font-bold bg-black/70 px-3 py-1 rounded-full border border-rose-500/30">
              {isFemale ? 'কপালে লাল টিপ ও শান্তিনিকেতনি শাড়ি' : 'উশকোখুশকো চুল ও কড়া লাল চা'}
            </span>
          </div>
        )}

        {/* Virtual Teep Indicator if no photo */}
        {!userPhoto && isFemale && hasVirtualTeep && (
          <div className="absolute top-[32%] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-white shadow-lg shadow-red-500/80 pointer-events-none"></div>
        )}

        {/* CRT Scanline & Grain Texture Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 2px)',
            backgroundSize: '100% 2px'
          }}
        ></div>

        {/* Vignette Overlay for Broadcast Drama */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none"></div>
      </div>

      {/* 2. Top Broadcast HUD Bar */}
      <div className="relative z-10 p-3 sm:p-4 flex items-start justify-between">
        
        {/* Left: Location & Broadcast Cam Info */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-mono font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>📍 {displayLocation}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-emerald-500/30 w-fit">
            <span>[ 4K UHD 60FPS ]</span>
            <span>•</span>
            <span>REC 🔴</span>
            <span>•</span>
            <span>ISO 400</span>
          </div>
        </div>

        {/* Right: TV Channel Logo & Live Pill */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/50 shadow-lg">
            <span className="text-base sm:text-lg">🚩</span>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-black text-white tracking-wider flex items-center gap-1 uppercase">
                <span>{channelName}</span>
              </div>
              <div className="text-[8px] font-mono text-rose-300 font-bold tracking-widest uppercase">
                NEWS 24/7
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow animate-pulse">
            <Radio className="w-2.5 h-2.5" />
            <span>সরাসরি • LIVE</span>
          </div>
        </div>
      </div>

      {/* 3. Center Subject Tag (Name & Crime / Status) */}
      <div className="relative z-10 px-4 mb-2 flex items-end justify-between">
        <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border-l-4 border-amber-400 text-left shadow-lg max-w-[75%]">
          <div className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>অভিযুক্ত আঁতেল কমরেড:</span>
            {district && (
              <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-sans font-black">
                📍 {district}
              </span>
            )}
          </div>
          <div className="text-sm sm:text-base font-black text-white truncate">
            {displayName}
          </div>
        </div>

        {/* Comical News Mic Graphic */}
        <div className="hidden sm:flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[10px] font-bold text-slate-300">
          <span className="text-sm">🎙️</span>
          <span>{reporterName}</span>
        </div>
      </div>

      {/* 4. Lower Third Iconic Breaking News Graphics */}
      <div className="relative z-20 w-full shadow-2xl">
        
        {/* Strip 1: Red & Yellow Breaking News Header Bar */}
        <div className="flex items-stretch bg-black">
          {/* Breaking News Tag */}
          <div className="bg-red-600 text-white font-black px-3.5 sm:px-5 py-1 text-xs sm:text-sm tracking-widest uppercase flex items-center gap-1.5 shadow-md flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>ব্রেকিং নিউজ</span>
          </div>

          {/* Special Bulletin Tag with diagonal slant */}
          <div className="bg-amber-400 text-slate-950 font-black px-3 py-1 text-[10px] sm:text-xs tracking-wider uppercase flex items-center gap-1 flex-shrink-0 hidden xs:flex">
            <AlertTriangle className="w-3 h-3 text-slate-950" />
            <span>বিশেষ সংবাদ</span>
          </div>

          {/* Time & Satellite Orbit */}
          <div className="bg-slate-900 text-slate-300 font-mono text-[9px] sm:text-[10px] px-2.5 py-1 flex items-center justify-end flex-1 border-l border-white/10">
            <span>ঢাকা • {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Strip 2: Main Dramatic Headline (Dark Red / Crimson) */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-2.5 sm:p-3.5 border-y-2 border-white/30 shadow-lg">
          <p className="text-sm sm:text-lg md:text-xl font-black leading-tight sm:leading-snug drop-shadow-md text-left">
            {headline}
          </p>
        </div>

        {/* Strip 3: Bottom Yellow Scrolling Ticker */}
        <div className="bg-amber-300 text-slate-950 px-3 py-1 text-[10px] sm:text-xs font-black flex items-center gap-2 overflow-hidden shadow-inner border-t border-amber-400">
          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex-shrink-0">
            তাজা খবর
          </span>
          <div className="truncate font-bold tracking-tight text-slate-900">
            {tickerText}
          </div>
        </div>

      </div>
    </div>
  );
}
