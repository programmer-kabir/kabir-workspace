import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  X, 
  Play, 
  Square, 
  Copy, 
  Check, 
  Sparkles, 
  Radio, 
  Shuffle, 
  MessageSquareQuote
} from 'lucide-react';
import { 
  memeSoundList, 
  playMemeSfx, 
  speakDialogue, 
  stopAllSpeech, 
  playClickSound 
} from '../utils/audio';

export default function MemeSoundboardModal({
  isOpen,
  onClose
}) {
  const [activeSoundId, setActiveSoundId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const handlePlaySound = (sound) => {
    setActiveSoundId(sound.id);
    playMemeSfx(sound.sfx);
    speakDialogue(sound.quote);
  };

  const handleStopAll = () => {
    playClickSound();
    stopAllSpeech();
    setActiveSoundId(null);
  };

  const handlePlayRandom = () => {
    const randomSound = memeSoundList[Math.floor(Math.random() * memeSoundList.length)];
    handlePlaySound(randomSound);
  };

  const handleCopyQuote = (sound, e) => {
    e.stopPropagation();
    playClickSound();
    const shareText = `📢 "${sound.quote}" ☕🚩\n👉 আঁতেলস্কোপ ৩.০ সাউন্ডবোর্ড থেকে বাজান: ${typeof window !== 'undefined' ? window.location.origin : ''}`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(sound.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const activeSound = memeSoundList.find(s => s.id === activeSoundId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="glass-card w-full max-w-4xl rounded-[36px] p-5 md:p-8 shadow-2xl border border-white/50 relative my-auto max-h-[96vh] overflow-y-auto no-scrollbar text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={() => {
            handleStopAll();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-90 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-red-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
              ভাইরাল মিম অডিও স্টুডিও
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              শাহবাগী মিম সাউন্ডবোর্ড ও ভয়েস ডায়লগ 🔥
            </h3>
          </div>
        </div>

        {/* Live Active Audio Banner */}
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-zinc-900 to-red-950 border border-amber-500/40 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-xl flex-shrink-0 ${
              activeSoundId ? 'animate-bounce' : ''
            }`}>
              {activeSound ? activeSound.icon : '📢'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                {activeSoundId ? '🔊 বর্তমানে বাজছে:' : 'ক্লিক করে ডায়লগ ও সাউন্ড শুনুন'}
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-100 truncate">
                {activeSound ? activeSound.quote : 'যেকোনো সাউন্ডবোর্ড টাইলে ক্লিক করুন—অডিও ও বাংলা ভয়েস ডায়লগ একসাথে বাজবে!'}
              </p>
            </div>
          </div>

          {activeSoundId && (
            <button
              onClick={handleStopAll}
              className="px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all shadow"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>ভয়েস থামান</span>
            </button>
          )}
        </div>

        {/* Soundboard Grid (8 Tiles) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-3">
          {memeSoundList.map((sound) => {
            const isPlaying = activeSoundId === sound.id;
            const isCopied = copiedId === sound.id;

            return (
              <div
                key={sound.id}
                onClick={() => handlePlaySound(sound)}
                className={`p-4 rounded-3xl cursor-pointer transition-all border text-left relative overflow-hidden group select-none ${
                  isPlaying
                    ? 'bg-gradient-to-br from-red-950 to-slate-900 text-white border-amber-400 ring-2 ring-amber-400/50 scale-[1.02] shadow-xl'
                    : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200/90 hover:border-rose-300 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Visual Audio Wave indicator when active */}
                {isPlaying && (
                  <div className="absolute top-2 right-2 flex items-end gap-1 h-5">
                    <span className="w-1 bg-amber-400 rounded-full h-3 animate-ping"></span>
                    <span className="w-1 bg-rose-400 rounded-full h-5 animate-pulse"></span>
                    <span className="w-1 bg-amber-300 rounded-full h-2 animate-bounce"></span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform">
                    {sound.icon}
                  </span>
                  <button
                    onClick={(e) => handleCopyQuote(sound, e)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      isPlaying 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                    title="ডায়লগ টেক্সট কপি করুন"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <h4 className={`text-sm font-black leading-tight ${isPlaying ? 'text-amber-300' : 'text-slate-900'}`}>
                  {sound.title}
                </h4>
                
                <p className={`text-[10px] font-bold mt-1 ${isPlaying ? 'text-slate-300' : 'text-rose-600'}`}>
                  {sound.tagline}
                </p>

                <p className={`text-[11px] font-medium mt-2 line-clamp-2 italic ${
                  isPlaying ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  "{sound.quote}"
                </p>

                {/* Bottom Trigger Indicator */}
                <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-bold">
                  <span className={isPlaying ? 'text-amber-400' : 'text-slate-400'}>
                    {isPlaying ? '▶ অডিও বাজছে...' : 'ক্লিক করে বাজান'}
                  </span>
                  <Play className={`w-3 h-3 ${isPlaying ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Control Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 mt-2">
          <button
            onClick={handlePlayRandom}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span>র‍্যান্ডম মিম ডায়লগ বাজান</span>
          </button>

          <p className="text-[11px] text-slate-500 font-medium">
            * ব্রাউজারের স্পিচ সিন্থেসিস ও ওয়েব অডিও দিয়ে সরাসরি ভয়েস বাজবে
          </p>

          <button
            onClick={handleStopAll}
            className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>ভয়েস ও সাউন্ড বন্ধ</span>
          </button>
        </div>

      </div>
    </div>
  );
}
