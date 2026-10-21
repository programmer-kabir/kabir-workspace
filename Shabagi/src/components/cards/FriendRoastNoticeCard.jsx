import React from 'react';
import { AlertOctagon, Skull, Flame, FileText, CheckCircle2 } from 'lucide-react';

export default function FriendRoastNoticeCard({
  cardRef,
  friendName = 'রাকিব আহমেদ',
  friendGender = 'male',
  friendPhoto = null,
  roastReason = 'সপ্তাহে একদিনও গোসল না করে ফ্রয়েড ও মার্ক্স চর্চা করা',
  roastPenalty = 'সমস্ত বন্ধুদের নিজ খরচে ৩ কাপ মালাই চা খাওয়ানো এবং ফেসবুকে স্ট্যাটাস দিয়ে ক্ষমা চাওয়া!',
  roastScore = 98,
  senderName = 'কমরেড বন্ধু',
  hasVirtualTeep = false
}) {
  const isFemale = friendGender === 'female';

  return (
    <div
      ref={cardRef}
      className="bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 border-4 border-red-600 rounded-[34px] p-5 md:p-6 shadow-2xl relative overflow-hidden text-slate-900"
    >
      {/* Background Watermark Stamp */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
        <span className="text-8xl font-black text-red-900 rotate-[-25deg]">ROASTED</span>
      </div>

      {/* Top Warning Ribbon */}
      <div className="bg-red-600 text-white -m-5 md:-m-6 mb-4 p-3 rounded-t-[28px] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-300 animate-pulse" />
          <div>
            <h4 className="text-xs md:text-sm font-black tracking-wider uppercase leading-none">
              জাতীয় আঁতেল ও শাহবাগী নিয়ন্ত্রণ ব্যুরো
            </h4>
            <p className="text-[8px] text-red-100 font-bold uppercase tracking-widest mt-0.5">
              OFFICIAL FRIEND ROAST & SHOW-CAUSE NOTICE
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black bg-amber-400 text-red-950 px-2.5 py-0.5 rounded-full uppercase shadow">
          জরুরি নোটিশ
        </span>
      </div>

      {/* Accused Friend Header Profile */}
      <div className="flex items-center gap-3.5 bg-white/90 p-3.5 rounded-2xl border-2 border-red-200 shadow-sm relative">
        <div className="relative flex-shrink-0">
          {friendPhoto ? (
            <div className="relative">
              <img
                src={friendPhoto}
                alt={friendName}
                className="w-16 h-16 rounded-xl object-cover border-2 border-red-500 shadow"
              />
              {isFemale && hasVirtualTeep && (
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 border border-white shadow"></div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-rose-100 border-2 border-red-400 flex items-center justify-center text-3xl shadow-inner relative">
              <span>{isFemale ? '👩🏻‍🦰' : '🧔🏻'}</span>
              {isFemale && hasVirtualTeep && (
                <div className="absolute top-1.5 w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow"></div>
              )}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
            {roastScore}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-extrabold text-red-600 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded">
            অভিযুক্ত আঁতেল বন্ধু
          </span>
          <h3 className="text-lg font-black text-slate-900 leading-tight truncate mt-1">{friendName}</h3>
          <p className="text-[11px] font-bold text-amber-800">
            {isFemale ? 'কপালে ৩ ইঞ্চি টিপধারী চরমপন্থী' : 'সাবানবিমুখ সার্বক্ষণিক বিপ্লবী'}
          </p>
        </div>

        {/* Big Official Stamp Badge */}
        <div className="hidden sm:flex flex-col items-center justify-center border-2 border-dashed border-red-600 rounded-xl p-1.5 text-center rotate-[-6deg] bg-red-50/80">
          <span className="text-[8px] font-black text-red-600 uppercase">সার্টিফাইড</span>
          <span className="text-xs font-black text-red-700">আঁতেল</span>
          <span className="text-[8px] font-bold text-red-600">{roastScore}%</span>
        </div>
      </div>

      {/* Charge Sheet / অভিযোগপত্র */}
      <div className="my-3 space-y-2 bg-white/70 p-3.5 rounded-2xl border border-red-200">
        <div>
          <p className="text-[10px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-red-600" />
            প্রধান আনীত অভিযোগ:
          </p>
          <p className="text-xs font-bold text-slate-800 mt-1 pl-2 border-l-2 border-red-500">
            "{roastReason}"
          </p>
        </div>

        <div className="pt-2 border-t border-red-100">
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Skull className="w-3.5 h-3.5 text-amber-600" />
            ব্যুরো কর্তৃক নির্ধারিত তাৎক্ষণিক শাস্তি:
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5 pl-2 border-l-2 border-amber-500">
            {roastPenalty}
          </p>
        </div>
      </div>

      {/* Sender & Legal Disclaimer */}
      <div className="flex items-center justify-between pt-2 border-t border-red-200 text-[10px] text-slate-600">
        <div>
          <span className="font-bold text-slate-800">রোস্ট প্রেরক: </span>
          <span className="font-extrabold text-red-700">{senderName}</span>
        </div>
        <div className="font-black text-red-600 tracking-wider">
          কেস নং: ROAST-{roastScore}-TS
        </div>
      </div>

      {/* Footer Tagline */}
      <div className="mt-2 text-center text-[9px] font-bold text-slate-500">
        🔥 আপনার বন্ধুকে রোস্ট করতে বা সনদ যাচাই করতে ভিজিট করুন: আঁতেলস্কোপ ৩.০
      </div>
    </div>
  );
}
