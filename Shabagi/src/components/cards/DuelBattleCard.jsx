import React from 'react';
import { Swords, Trophy, Flame, ShieldAlert, Award } from 'lucide-react';

export default function DuelBattleCard({
  cardRef,
  challengerName = 'কমরেড বন্ধু',
  challengerScore = 95,
  challengerGender = 'male',
  challengerPhoto = null,
  userName = 'আপনি',
  userScore = 98,
  userGender = 'female',
  userPhoto = null,
  hasVirtualTeep = false,
  userDistrict = 'ঢাকা'
}) {
  const isChallengerWon = challengerScore > userScore;
  const isUserWon = userScore > challengerScore;
  const isTie = userScore === challengerScore;

  const winnerName = isUserWon ? userName : (isChallengerWon ? challengerName : null);
  const loserName = isUserWon ? challengerName : (isChallengerWon ? userName : null);

  return (
    <div
      ref={cardRef}
      className="bg-gradient-to-br from-slate-950 via-zinc-900 to-red-950 border-4 border-amber-500 rounded-[36px] p-5 md:p-6 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white -m-5 md:-m-6 mb-4 p-3.5 rounded-t-[30px] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-black/30 rounded-xl">
            <Swords className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-black tracking-widest uppercase leading-none">
              কমরেড ডুয়েল যুদ্ধ • ফেস-অফ সনদ
            </h4>
            <p className="text-[8px] text-amber-100 font-extrabold uppercase tracking-widest mt-0.5">
              OFFICIAL SHABAGI COMRADE DUEL & BATTLE CERTIFICATE
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase shadow">
          {isTie ? 'অমীমাংসিত যুদ্ধ' : 'চূড়ান্ত ফলাফল'}
        </span>
      </div>

      {/* Versus Grid */}
      <div className="grid grid-cols-2 gap-3 my-3 relative">
        
        {/* Center VS Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-400 to-red-600 border-2 border-white flex items-center justify-center font-black text-xs md:text-sm text-slate-950 shadow-xl shadow-red-500/40 animate-pulse">
            VS
          </div>
        </div>

        {/* Left Side: Challenger */}
        <div className={`p-3 rounded-2xl border ${
          isChallengerWon 
            ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50' 
            : 'bg-black/40 border-slate-700/60'
        } flex flex-col items-center text-center relative`}>
          {isChallengerWon && (
            <div className="absolute -top-3 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Trophy className="w-3 h-3" /> বিজয়ী
            </div>
          )}

          <div className="relative my-1">
            {challengerPhoto ? (
              <img
                src={challengerPhoto}
                alt={challengerName}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-amber-400 shadow"
              />
            ) : (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner">
                {challengerGender === 'female' ? '👩🏻‍🦰' : '🧔🏻'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full border border-white">
              {challengerScore}%
            </span>
          </div>

          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">চ্যালেঞ্জার</p>
          <p className="text-sm font-black text-white truncate max-w-full">{challengerName}</p>
          <p className="text-[9px] text-slate-300 font-medium mt-0.5">
            {challengerScore >= 95 ? 'কোর শাহবাগী' : 'আঁতেল কমরেড'}
          </p>
        </div>

        {/* Right Side: You */}
        <div className={`p-3 rounded-2xl border ${
          isUserWon 
            ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50' 
            : 'bg-black/40 border-slate-700/60'
        } flex flex-col items-center text-center relative`}>
          {isUserWon && (
            <div className="absolute -top-3 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Trophy className="w-3 h-3" /> বিজয়ী
            </div>
          )}

          <div className="relative my-1">
            {userPhoto ? (
              <div className="relative">
                <img
                  src={userPhoto}
                  alt={userName}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-rose-500 shadow"
                />
                {userGender === 'female' && hasVirtualTeep && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow"></div>
                )}
              </div>
            ) : (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800 border-2 border-rose-500 flex items-center justify-center text-2xl shadow-inner relative">
                <span>{userGender === 'female' ? '👩🏻‍🦰' : '🧔🏻'}</span>
                {userGender === 'female' && hasVirtualTeep && (
                  <div className="absolute top-1.5 w-2 h-2 rounded-full bg-red-600 border border-white"></div>
                )}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full border border-white">
              {userScore}%
            </span>
          </div>

          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">আপনি</p>
          <p className="text-sm font-black text-white truncate max-w-full">{userName}</p>
          <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[9px] text-slate-300 font-medium">
              {userScore >= 95 ? 'কোর শাহবাগী' : 'আঁতেল কমরেড'}
            </span>
            {userDistrict && (
              <span className="text-[8px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                📍 {userDistrict}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Duel Verdict Box */}
      <div className="bg-gradient-to-r from-red-950/80 via-neutral-900 to-zinc-950 p-3 rounded-2xl border border-amber-500/50 my-2 text-center">
        {isTie ? (
          <div>
            <p className="text-xs font-black text-amber-300">
              🤝 দুজনেই {userScore}% পেয়ে সমানে সমান!
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              কেউ কাউকে হারাতে পারেনি! দুজনেই আজীবন একসাথে টিএসসিতে লাল চা খেতে বাধ্য থাকবেন!
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>বিজয়ী কমরেড: {winnerName} ({Math.max(userScore, challengerScore)}%)</span>
            </p>
            <p className="text-[10px] text-slate-200 mt-1">
              {isUserWon
                ? `অভিনন্দন! আপনি কমরেড ${challengerName}-কে গুঁড়িয়ে দিয়ে শাহবাগের আসল নেতা বনে গেছেন!`
                : `হায় হায়! কমরেড ${challengerName} আপনার চেয়ে বড় আঁতেল প্রমাণিত হয়েছেন! অবিলম্বে লাল চা খেয়ে শক্তি বাড়ান!`
              }
            </p>
          </div>
        )}
      </div>

      {/* Official Footnote / Verification Stamp */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] text-slate-400">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>ভেরিফাইড শাহবাগ ডুয়েল রেফারেন্স: DUEL-{userScore}-{challengerScore}</span>
        </div>
        <span className="font-bold text-amber-300">আঁতেলস্কোপ ৩.০</span>
      </div>
    </div>
  );
}
