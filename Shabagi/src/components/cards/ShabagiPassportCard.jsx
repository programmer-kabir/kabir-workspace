import React from 'react';
import { ShieldCheck, Award, Radio } from 'lucide-react';

export default function ShabagiPassportCard({
  cardRef,
  displayName = 'কমরেড আঁতেল',
  gender = 'female',
  userPhoto = null,
  passportNo = 'SHB2026-TEA-99',
  division = 'ঢাকা বিভাগ',
  district = 'ঢাকা',
  bloodGroup = 'চা পজিটিভ (Tea+)',
  birthPlace = 'টিএসসি টংয়ের আড্ডা, ঢাকা',
  identMark = 'কপালে আড়াই ইঞ্চি সুবিশাল লাল টিপ ও কাঁধে শান্তিনিকেতনি রঙচটা ঝোলা ব্যাগ',
  hasVirtualTeep = true
}) {
  const isFemale = gender === 'female';
  const cleanEnglishName = displayName.replace(/[^\w\s]/gi, '').trim().toUpperCase() || (isFemale ? 'TASNUVA' : 'ANTEL');
  const mrzName = cleanEnglishName.replace(/\s+/g, '<');

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[620px] aspect-[1.48/1] rounded-2xl overflow-hidden relative shadow-2xl bg-[#f0f7f3] text-slate-900 select-none border-2 border-emerald-800/80 p-3 sm:p-5 flex flex-col justify-between"
      style={{
        boxShadow: '0 25px 50px -12px rgba(6, 78, 59, 0.4), 0 0 25px rgba(16, 185, 129, 0.25)',
        fontFamily: "'Courier New', Courier, monospace, 'Hind Siliguri', sans-serif"
      }}
    >
      {/* 1. Guilloche Security Wave Background & Translucent Watermark */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(5, 150, 105, 0.15) 0%, transparent 60%),
            repeating-radial-gradient(circle at 20% 30%, transparent 0, transparent 4px, rgba(16, 185, 129, 0.08) 5px, transparent 6px),
            repeating-linear-gradient(45deg, rgba(6, 78, 59, 0.04) 0px, rgba(6, 78, 59, 0.04) 2px, transparent 2px, transparent 6px)
          `,
          backgroundSize: '100% 100%'
        }}
      ></div>

      {/* Central Translucent National Emblem Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] select-none">
        <span className="text-[180px]">🚩</span>
      </div>

      {/* Microprint Security Border */}
      <div className="absolute inset-1.5 border border-dashed border-emerald-700/30 rounded-xl pointer-events-none"></div>

      {/* 2. Top Government Passport Header */}
      <div className="relative z-10 border-b-2 border-emerald-800/60 pb-2 mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Emblem Icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 text-lg sm:text-xl shadow-md flex-shrink-0">
            <span>🚩</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wider uppercase font-sans">
                PEOPLE'S REPUBLIC OF SHABAG
              </h2>
              <span className="text-[9px] bg-emerald-800 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                e-Passport
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-red-700 leading-tight">
              গণপ্রজাতন্ত্রী শাহবাগী কমরেড পাসপোর্ট
            </h1>
            <p className="text-[9px] text-emerald-900 font-bold tracking-widest uppercase">
              NATIONAL PROLETARIAT & INTELLECTUAL BUREAU
            </p>
          </div>
        </div>

        {/* Passport Code Box */}
        <div className="text-right font-mono text-[9px] sm:text-[10px] bg-white/70 backdrop-blur-sm p-1.5 rounded-lg border border-emerald-600/40 shadow-sm">
          <div><span className="text-slate-500">TYPE/ধরন:</span> <strong className="text-red-700">P</strong></div>
          <div><span className="text-slate-500">CODE/কোড:</span> <strong className="text-emerald-900">SHB</strong></div>
          <div><span className="text-slate-500">NO/নম্বর:</span> <strong className="text-emerald-950 font-black">{passportNo}</strong></div>
        </div>
      </div>

      {/* 3. Middle Section: Photo (Left) & Biometric Fields (Right) */}
      <div className="relative z-10 flex gap-3 sm:gap-4 flex-1 items-stretch">
        
        {/* LEFT: Passport Photo & Stamp */}
        <div className="w-[30%] sm:w-[28%] flex flex-col items-center justify-between">
          
          {/* The Photo Container with Hologram Corner */}
          <div className="w-full aspect-[3/4] rounded-xl overflow-hidden relative border-2 border-emerald-800 bg-slate-200 shadow-md">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={displayName}
                className="w-full h-full object-cover filter contrast-105"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-emerald-100 to-white text-center p-1">
                <span className="text-5xl sm:text-6xl mb-1 filter drop-shadow">
                  {isFemale ? '👩🏻‍🦰' : '🧔🏻'}
                </span>
                <span className="text-[8px] font-bold text-emerald-900 bg-emerald-200/60 px-1 rounded">
                  {isFemale ? 'কপালে লাল টিপ' : 'উশকোখুশকো চুল'}
                </span>
              </div>
            )}

            {/* Virtual Teep if female without photo */}
            {!userPhoto && isFemale && hasVirtualTeep && (
              <div className="absolute top-[32%] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-md pointer-events-none"></div>
            )}

            {/* Optical Variable Hologram Seal on Corner */}
            <div className="absolute top-1 right-1 bg-gradient-to-tr from-amber-400 via-rose-400 to-emerald-400 text-[7px] font-black text-slate-900 px-1 rounded shadow pointer-events-none opacity-90 border border-white/60">
              OVI ★
            </div>

            {/* Security Microline across lower photo */}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] font-mono text-emerald-300 text-center py-0.5 tracking-tighter truncate font-bold">
              SHB•VERIFIED•COMRADE•PASSPORT
            </div>
          </div>

          {/* Holder's Official Cursive Signature */}
          <div className="w-full mt-1.5 pt-1 border-t border-dashed border-emerald-700/40 text-center">
            <span className="text-[8px] text-slate-500 block font-sans">স্বাক্ষর / Signature</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-950 italic tracking-wider font-serif">
              {displayName}
            </span>
          </div>

          {/* Official Round Rubber Stamp */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-red-600/80 flex flex-col items-center justify-center text-red-700 text-[6px] sm:text-[7px] font-bold rotate-[-12deg] pointer-events-none shadow-sm -mt-3 bg-red-500/10 backdrop-blur-[0.5px]">
            <span>★ গণপ্রজাতন্ত্রী ★</span>
            <span className="font-black text-[7px] sm:text-[8px]">ভেরিফাইড</span>
            <span>শাহবাগী ব্যুরো</span>
          </div>

        </div>

        {/* RIGHT: Biometric Passport Data Fields */}
        <div className="flex-1 flex flex-col justify-between text-[10px] sm:text-xs leading-tight">
          
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 bg-white/60 backdrop-blur-sm p-2 sm:p-2.5 rounded-xl border border-emerald-700/20 shadow-sm">
            
            {/* Field: Full Name */}
            <div className="col-span-2">
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                পূর্ণ নাম / FULL NAME:
              </span>
              <strong className="text-xs sm:text-sm text-emerald-950 font-black uppercase tracking-wide">
                কমরেড {displayName}
              </strong>
            </div>

            {/* Field: Nationality */}
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                জাতীয়তা / NATIONALITY:
              </span>
              <strong className="text-emerald-950 font-black">শাহবাগী (SHABAGI)</strong>
            </div>

            {/* Field: Blood Group */}
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                রক্তের গ্রুপ / BLOOD GRP:
              </span>
              <strong className="text-red-700 font-black">{bloodGroup}</strong>
            </div>

            {/* Field: Place of Birth & District */}
            <div className="col-span-2">
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                জন্মস্থান ও জেলা ঘাঁটি / HOMELAND & BASE:
              </span>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <strong className="text-slate-800 font-bold text-[10px] sm:text-xs truncate">
                  {birthPlace}
                </strong>
                <span className="bg-emerald-800 text-amber-300 font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-sm border border-emerald-600">
                  📍 {district} ({division})
                </span>
              </div>
            </div>

            {/* Field: Parents */}
            <div className="col-span-2">
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                তাত্ত্বিক অভিভাবক / MENTORS:
              </span>
              <strong className="text-slate-800 font-bold text-[10px]">
                {isFemale ? 'বেগম রোকেয়া ও কার্ল মার্ক্স' : 'কার্ল মার্ক্স ও চে গুয়েভারা'}
              </strong>
            </div>

            {/* Field: Identification Mark */}
            <div className="col-span-2">
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                শনাক্তকারী চিহ্ন / IDENTIFICATION MARK:
              </span>
              <strong className="text-emerald-900 font-bold text-[9px] sm:text-[10px] leading-snug">
                {identMark}
              </strong>
            </div>

            {/* Field: Issue Date */}
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                ইস্যুর তারিখ / DATE OF ISSUE:
              </span>
              <strong className="text-slate-800 font-bold text-[10px]">
                ১৮/১০/২০২৬
              </strong>
            </div>

            {/* Field: Expiry Date */}
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans block">
                মেয়াদ / DATE OF EXPIRY:
              </span>
              <strong className="text-red-700 font-black text-[9px] sm:text-[10px]">
                পুঁজিবাদ ধ্বংস না হওয়া পর্যন্ত
              </strong>
            </div>

          </div>

          {/* Authority Footer Line */}
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-500 pt-1 px-1 font-sans">
            <span>প্রদানকারী: জাতীয় শাহবাগী পাসপোর্ট ও অভিবাসন ব্যুরো</span>
            <span className="font-bold text-emerald-800">CLASS: A-1 INTELLIGENTSIA</span>
          </div>

        </div>

      </div>

      {/* 4. Bottom Machine Readable Zone (MRZ) - Exact ICAO Doc 9303 Format */}
      <div className="relative z-10 mt-2 bg-slate-900 text-emerald-400 font-mono text-[9px] sm:text-[11px] leading-[1.15] p-2 rounded-xl border border-emerald-500/30 tracking-[2px] sm:tracking-[2.5px] font-bold select-all overflow-hidden shadow-inner">
        <div>P&lt;SHB&lt;&lt;COMRADE&lt;{mrzName}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
        <div>SHB2026994SHB0101018F9912314&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</div>
      </div>

    </div>
  );
}
