import React from 'react';
import { Flame, AlertTriangle, Megaphone } from 'lucide-react';

export default function RebelWarrantCard({ 
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
      className="bg-gradient-to-br from-red-950 via-neutral-950 to-zinc-950 border-4 border-red-600 rounded-[36px] p-5 md:p-6 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Revolutionary Top Header */}
      <div className="bg-red-600 text-white -m-5 md:-m-6 mb-4 p-3.5 rounded-t-[30px] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚩</span>
          <div>
            <h4 className="text-xs md:text-sm font-black tracking-widest uppercase leading-none">
              {isFemale ? 'মশাল নেত্রী ও আন্দোলন ওয়ারেন্ট' : 'সার্বক্ষণিক আন্দোলন ও মশাল ওয়ারেন্ট'}
            </h4>
            <p className="text-[8px] text-red-100 font-extrabold uppercase tracking-widest mt-0.5">
              24/7 STREET PROTEST & BLOCKADE REVOLUTIONARY WARRANT
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black bg-white text-red-700 px-2.5 py-0.5 rounded-full uppercase shadow">
          {isFemale ? 'চিহ্নিত নারী কমরেড' : 'চিহ্নিত কমরেড'}
        </span>
      </div>

      {/* Wanted Poster Center Section with Virtual Teep */}
      <div className="flex items-center gap-4 my-3 bg-red-950/60 p-3.5 rounded-3xl border border-red-600/40">
        <div className="relative flex-shrink-0">
          {userPhoto ? (
            <div className="relative">
              <img
                src={userPhoto}
                alt="কমরেড ছবি"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-red-500 shadow-md grayscale contrast-125"
              />
              {hasVirtualTeep && (
                <div 
                  className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border-2 border-red-900 shadow-lg pointer-events-none"
                  title="কপালে লাল টিপ"
                ></div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-red-900 border-4 border-red-500 flex flex-col items-center justify-center text-3xl shadow-inner relative">
              <span>{isFemale ? '👩🏻‍🦰' : '🧔🏻'}</span>
              {hasVirtualTeep && (
                <div className="absolute top-2 w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow"></div>
              )}
            </div>
          )}
          <span className="absolute -bottom-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow border border-red-400">
            {score}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <p className="text-[9px] font-extrabold text-red-300 uppercase tracking-widest">
              {isFemale ? 'বিপ্লবী নারী কমরেড' : 'বিপ্লবী কমরেড'}
            </p>
            {district && (
              <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.2 rounded-full border border-red-400">
                📍 {district}
              </span>
            )}
          </div>
          <p className="text-lg md:text-xl font-black text-white leading-tight truncate">{displayName}</p>
          <p className="text-xs font-bold text-amber-300 mt-0.5 truncate">
            {isFemale ? 'শাহবাগ মোড় অবরোধ ও মশাল নেত্রী' : 'শাহবাগ মোড় অবরোধ ও মশাল মাস্টার'}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-bold text-red-200 bg-red-900/60 px-2 py-0.5 rounded-md border border-red-700">
              কেস ফাইল নং: ANDOLON-2026-{score}
            </span>
            {division && (
              <span className="text-[9px] font-bold text-amber-300">
                • {division} ঘাঁটি
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Slogan Banner */}
      <div className="my-2 py-1 px-3 rounded-xl bg-red-900/40 border border-red-500/40 text-center">
        <p className="text-[11px] font-black text-red-200">
          🔥 "চায়ে চিনি বেশি হলেও শাহবাগ মোড় অবরোধ আমাদের গণতান্ত্রিক অধিকার!" 🔥
        </p>
      </div>

      {/* Crimes & Revolutionary Punishments Box */}
      <div className="my-3 p-3.5 rounded-2xl bg-black/50 border border-red-600/30 space-y-2 text-xs">
        <div>
          <p className="text-[10px] font-black text-red-400 uppercase tracking-wide">অনুমোদিত আন্দোলনসমূহ:</p>
          <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">
            তুচ্ছাতিতুচ্ছ কারণে ব্যানার-ফেস্টুন নিয়ে রাস্তায় দাঁড়ানো, ৭ দফা গণদাবি পেশ করা ও আমরণ অনশনের মহড়া দেওয়া।
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-wide">মশাল সরবরাহের অধিকার:</p>
          <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">
            রাতে টিএসসির চত্বরে মশাল হাতে 'চলবে না, চলবে না' স্লোগানে গোটা এলাকা মুখরিত করার সার্বক্ষণিক অনুমতি।
          </p>
        </div>
      </div>

      {/* Bottom Red Seal */}
      <div className="mt-3 pt-3 border-t border-red-900/60 flex items-center justify-between text-[10px] text-red-300 font-bold">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>সার্বক্ষণিক রাজপথ প্রস্তুত</span>
        </div>
        <span className="font-mono text-red-400 font-black">CONFIDENTIAL REV-PASS</span>
      </div>
    </div>
  );
}
