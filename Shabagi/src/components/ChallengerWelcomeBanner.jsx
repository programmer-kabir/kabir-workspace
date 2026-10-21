import React from 'react';
import { Swords, Trophy, Flame, Zap, ArrowRight } from 'lucide-react';
import { playBattleSound } from '../utils/audio';

export default function ChallengerWelcomeBanner({
  challenger,
  onAccept
}) {
  if (!challenger || !challenger.name) return null;

  return (
    <div className="w-full mb-5 rounded-3xl bg-gradient-to-r from-red-950 via-zinc-900 to-amber-950 border-2 border-amber-400 p-4 md:p-5 shadow-2xl relative overflow-hidden animate-fadeIn text-white">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 p-0.5 flex-shrink-0 shadow-lg">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-2xl">
              {challenger.gender === 'female' ? '👩🏻‍🦰' : '🧔🏻'}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Swords className="w-3 h-3 text-amber-400 animate-bounce" />
              <span>ওপেন ফ্রেন্ড ডুয়েল চ্যালেঞ্জ</span>
            </div>
            <h3 className="text-base md:text-lg font-black text-white leading-tight">
              কমরেড <span className="text-amber-300 font-extrabold">{challenger.name}</span> আপনাকে চ্যালেঞ্জ পাঠিয়েছেন!
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              তার স্কোর: <span className="font-black text-rose-400">{challenger.score || 96}%</span> • "তোর দম থাকলে আমার এই স্কোর টপকে দেখা!"
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            playBattleSound();
            onAccept();
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-red-600 hover:from-amber-500 hover:to-red-700 text-slate-950 font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 group flex-shrink-0"
        >
          <span>চ্যালেঞ্জ গ্রহণ করলাম</span>
          <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
