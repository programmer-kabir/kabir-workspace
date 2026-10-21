import React from 'react';
import { Award, BookOpen, GraduationCap } from 'lucide-react';

export default function AttelDegreeCard({ 
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
      className="bg-gradient-to-br from-amber-50/95 via-yellow-50/70 to-stone-100 border-4 border-amber-600 rounded-[38px] p-6 md:p-7 shadow-2xl relative overflow-hidden text-slate-850 min-h-[460px] flex flex-col justify-between"
    >
      {/* Gold Academic Crest Stamp */}
      <div className="absolute top-4 right-4 transform rotate-12 opacity-95 pointer-events-none z-10">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-700 bg-amber-100/90 flex flex-col items-center justify-center text-amber-900 shadow-md p-1">
          <GraduationCap className="w-6 h-6 text-amber-800" />
          <span className="text-[7.5px] font-black uppercase tracking-tighter">PH.D</span>
        </div>
      </div>

      <div>
        {/* Diploma Header */}
        <div className="text-center border-b-2 border-amber-300/90 pb-3 mb-3">
          <p className="text-[9.5px] font-black tracking-[0.22em] text-amber-800 uppercase">
            INTERNATIONAL ACADEMY OF INTELLECTUALS & WOKE PHILOSOPHY
          </p>
          <h4 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-1">
            আন্তর্জাতিক মুক্তচিন্তা ও আঁতেল একাডেমি
          </h4>
          <div className="inline-block px-3.5 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-black mt-1.5 border border-amber-400 shadow-xs">
            🎓 {isFemale ? 'ডক্টরেট অব ফেমিনিস্ট আঁতেলিজম ও টিপতত্ত্ব (Ph.D.)' : 'ডক্টরেট অব আঁতেলিজম, কপালে টিপ ও ঝোলাতত্ত্ব (Ph.D.)'}
          </div>
        </div>

        {/* Recipient Presentation */}
        <div className="text-center my-2">
          <p className="text-xs text-slate-600 font-medium italic">
            জেন্ডার স্টেরিওটাইপ ভাঙা, কাঁধে কাপড়ের ঝোলা ও অতি-জটিল ফেসবুক তত্ত্বের স্বীকৃতিস্বরূপ প্রদান করা হলো:
          </p>
        </div>

        {/* Recipient Name & Photo with Virtual Teep */}
        <div className="flex items-center justify-center gap-3.5 my-3 bg-white/90 p-3.5 rounded-3xl border border-amber-200/90 shadow-sm">
          <div className="relative flex-shrink-0">
            {userPhoto ? (
              <div className="relative">
                <img
                  src={userPhoto}
                  alt="ডক্টরেট ছবি"
                  className="w-16 h-16 rounded-full object-cover border-4 border-amber-500 shadow"
                />
                {hasVirtualTeep && (
                  <div 
                    className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow"
                    title="কপালে লাল টিপ"
                  ></div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-500 flex flex-col items-center justify-center text-3xl shadow-inner relative">
                <span>{isFemale ? '👩🏻‍🦰' : '🧔🏻'}</span>
                {hasVirtualTeep && (
                  <div className="absolute top-1.5 w-3 h-3 rounded-full bg-red-600 border border-white shadow"></div>
                )}
              </div>
            )}
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                {isFemale ? 'সম্মানিত ডক্টরেট আপা' : 'সম্মানিত ডক্টরেট গবেষক'}
              </p>
              {district && (
                <span className="text-[9.5px] bg-amber-200 text-amber-900 font-black px-2 py-0.2 rounded-full border border-amber-400">
                  📍 {district} একাডেমি
                </span>
              )}
            </div>
            <p className="text-lg md:text-xl font-black text-slate-900 leading-tight truncate">{displayName}</p>
            <p className="text-xs font-bold text-amber-700 mt-0.5">যোগ্যতা নম্বর: {score}% (Summa Cum Laude)</p>
          </div>
        </div>

        {/* Slogan Pill */}
        <div className="my-2 py-1 px-3 rounded-xl bg-amber-100 border border-amber-300 text-center">
          <p className="text-[11px] font-black text-amber-950">
            {isFemale 
              ? '🧣 "শাড়ির নিচে স্নিকার্স আর কপালে ২ ইঞ্চি বড় লাল টিপই আসল বিপ্লব!" 🧣'
              : '🧣 "পোশাকের কোনো জেন্ডার নেই—কুর্তি, নূপুর আর কপালে লাল টিপই আসল বিপ্লব!" 🧣'}
          </p>
        </div>

        {/* Thesis Details Box */}
        <div className="my-2 p-3 rounded-2xl bg-amber-100/60 border border-amber-300/80 text-xs space-y-1">
          <p className="font-extrabold text-amber-950">গবেষণা অভিসন্দর্ভ (PhD Thesis):</p>
          <p className="text-slate-700 italic text-[11px] leading-relaxed">
            {isFemale
              ? '"চায়ে চিনি বেশি হওয়ার সাথে নিও-লিবারেল পিতৃতান্ত্রিক শোষণের জৈবনিক সম্পর্ক এবং কপালে আড়াই ইঞ্চি বড় লাল টিপের সাইকোলজিক্যাল প্রভাব।"'
              : '"চায়ে চিনি বেশি হওয়ার সাথে নিও-লিবারেল পুঁজিতান্ত্রিক শোষণের দ্বান্দ্বিক সম্পর্ক এবং কপালে আড়াই ইঞ্চি লাল টিপের সাইকোলজিক্যাল প্রভাব।"'}
          </p>
        </div>
      </div>

      {/* Degree Signatures */}
      <div className="border-t-2 border-amber-300/90 pt-3 flex items-end justify-between text-center">
        <div>
          <div className="text-xs font-serif font-black text-slate-700 italic mb-0.5">কমরেড ঝোলাওয়ালা</div>
          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest border-t border-slate-300 pt-0.5">
            প্রধান ডিন, আঁতেল ফ্যাকাল্টি
          </p>
        </div>
        <div className="text-amber-700 text-xl font-black">
          🏛️
        </div>
        <div>
          <div className="text-xs font-serif font-black text-slate-700 italic mb-0.5">ড. কপাল-টিপ</div>
          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest border-t border-slate-300 pt-0.5">
            সভাপতি, মুক্তচিন্তা সংসদ
          </p>
        </div>
      </div>
    </div>
  );
}
