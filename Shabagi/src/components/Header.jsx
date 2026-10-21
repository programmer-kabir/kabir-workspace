import React from 'react';
import { Flame, Volume2, VolumeX, Sparkles, Radio, Swords, Skull, Scan, Tv, ShieldCheck, MapPin } from 'lucide-react';
import { toggleMute, playClickSound, playRoastSound } from '../utils/audio';

export default function Header({ 
  isMuted, 
  setIsMuted,
  onOpenRoastModal,
  onOpenChallengeModal,
  onOpenStickerBooth,
  onOpenSoundboard,
  onOpenScannerModal,
  onOpenNewsModal,
  onOpenPassportModal,
  onOpenCensusModal
}) {
  const handleToggleSound = () => {
    const newState = toggleMute();
    setIsMuted(newState);
    if (!newState) {
      playClickSound();
    }
  };

  return (
    <header className="w-full max-w-6xl mx-auto pt-3 md:pt-5 px-4 pb-2 flex items-center justify-between gap-2">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 shadow-lg shadow-black/20 flex items-center justify-center text-white border border-white/40 animate-bounce-slow flex-shrink-0">
          <span className="text-xl">🚩</span>
        </div>
        <div>
          <h1 className="text-lg md:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 drop-shadow-sm">
            আঁতেলস্কোপ
            <span className="text-[9px] md:text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-amber-200 font-extrabold tracking-widest border border-white/30 uppercase">
              AntelScope 3.0
            </span>
          </h1>
          <p className="text-[11px] md:text-xs text-rose-200 font-medium hidden sm:block">
            জাতীয় শাহবাগী, কপালে টিপ ও আঁতেল রাডার
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {onOpenScannerModal && (
          <button
            onClick={() => {
              playClickSound();
              onOpenScannerModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md"
            title="AI বায়োমেট্রিক ফেস ও চেতনা স্ক্যানার"
          >
            <Scan className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
            <span className="hidden md:inline">ফেস স্ক্যান</span>
          </button>
        )}

        {onOpenSoundboard && (
          <button
            onClick={() => {
              playClickSound();
              onOpenSoundboard();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md"
            title="শাহবাগী মিম সাউন্ডবোর্ড ও ডায়লগ শুনুন"
          >
            <span>🔊 সাউন্ডবোর্ড</span>
          </button>
        )}

        {onOpenStickerBooth && (
          <button
            onClick={() => {
              playClickSound();
              onOpenStickerBooth();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md backdrop-blur-md"
            title="ছবিতে কপালে লাল টিপ, গোল চশমা ও ঝোলা বসান"
          >
            <span>👓 স্টিকার বুথ</span>
          </button>
        )}

        {onOpenNewsModal && (
          <button
            onClick={() => {
              playClickSound();
              onOpenNewsModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md"
            title="বন্ধুর নামে টিভি ব্রেকিং নিউজ মিম বানান"
          >
            <Tv className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">ব্রেকিং নিউজ</span>
          </button>
        )}

        {onOpenPassportModal && (
          <button
            onClick={() => {
              playClickSound();
              onOpenPassportModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md"
            title="গণপ্রজাতন্ত্রী শাহবাগী কমরেড পাসপোর্ট"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">পাসপোর্ট</span>
          </button>
        )}

        {onOpenCensusModal && (
          <button
            onClick={() => {
              playClickSound();
              onOpenCensusModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md"
            title="জাতীয় শাহবাগী আদমশুমারি ও জেলা র‍্যাঙ্কিং"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">জেলা শুমারি</span>
          </button>
        )}

        {onOpenRoastModal && (
          <button
            onClick={() => {
              playRoastSound();
              onOpenRoastModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 active:scale-95 transition-all text-white border border-white/30 text-xs font-black shadow-md"
            title="বন্ধুকে অফিসিয়াল শাহবাগী শোকজ সনদ পাঠান"
          >
            <Skull className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">বন্ধু রোস্ট</span>
          </button>
        )}

        {/* Audio Mute button */}
        <button
          onClick={handleToggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/30 text-xs font-bold backdrop-blur-md shadow-sm"
          title={isMuted ? "সাউন্ড অন করুন" : "সাউন্ড অফ করুন"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-200" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
          <span className="hidden sm:inline">{isMuted ? "মিউট" : "সাউন্ড"}</span>
        </button>
      </div>
    </header>
  );
}

