import React from 'react';
import { FiMic, FiMicOff, FiUsers, FiCopy, FiCheck } from 'react-icons/fi';

/**
 * 🌟 MeetingTopBar
 * Top navigation bar showing studio status, meeting title, host status,
 * live recording indicator, room participant pill, invite link copier,
 * and host Mute All / Unmute All buttons.
 */
export default function MeetingTopBar({
  isBn = false,
  meetingTitle = '',
  myHostTier = 'member',
  isMeHost = false,
  totalInRoom = 1,
  copied = false,
  recorder = null,
  onMuteAll,
  onUnmuteAll,
  onOpenParticipants,
  onCopyLink,
  onCopyInvite,
}) {
  const handleCopy = onCopyInvite || onCopyLink;
  return (
    <div className="h-12 px-5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20 text-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-[11px] font-black uppercase text-rose-500 tracking-wider">
            {isBn ? 'সিসিএ স্টুডিও' : 'CCA STUDIO'}
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="text-xs font-bold text-slate-200 truncate max-w-xs md:max-w-md">
          {meetingTitle || (isBn ? 'লাইভ কনফারেন্স রুম' : 'Creative Computer Academy Live Conference')}
        </span>

        {/* 🔴 Live Recording Indicator Badge */}
        {recorder?.isRecording && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold shadow-md animate-in fade-in">
            <span className={`w-2 h-2 rounded-full ${recorder.isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-[10px] font-mono tracking-wider font-black">
              {recorder.isPaused ? `⏸️ PAUSED ${recorder.formattedDuration}` : `🔴 REC ${recorder.formattedDuration}`}
            </span>
          </div>
        )}

        {myHostTier === 'host' ? (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            👑 {isBn ? 'হোস্ট নিয়ন্ত্রণ সক্রিয়' : 'HOST CONTROLS ACTIVE'}
          </span>
        ) : myHostTier === 'co_host' ? (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            ⭐ {isBn ? 'কো-হোস্ট নিয়ন্ত্রণ সক্রিয়' : 'CO-HOST CONTROLS ACTIVE'}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Mute All & Unmute All Actions (Host / Co-Host Only) */}
        {isMeHost && totalInRoom > 1 && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-full p-0.5 shadow-sm">
            <button
              type="button"
              onClick={onMuteAll}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold transition cursor-pointer"
              title={isBn ? 'মিটিংয়ের সবাইকে একসাথে মিউট করুন' : 'Mute all participants at once'}
            >
              <FiMicOff size={12} />
              <span>{isBn ? 'সবাই মিউট' : 'Mute All'}</span>
            </button>
            <button
              type="button"
              onClick={onUnmuteAll}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
              title={isBn ? 'মিটিংয়ের সবার মাইক চালু করুন' : 'Unmute all participants'}
            >
              <FiMic size={12} />
              <span>{isBn ? 'সবাই আনমিউট' : 'Unmute All'}</span>
            </button>
          </div>
        )}

        {/* Participant Count Pill */}
        <button
          type="button"
          onClick={onOpenParticipants}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition cursor-pointer"
          title={isBn ? 'সদস্য তালিকা ও অডিও পরিচালনা করুন' : 'Click to view & manage participants'}
        >
          <FiUsers size={12} />
          <span>{totalInRoom} {isBn ? 'জন যুক্ত' : 'in room'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
          <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'শেয়ার লিংক' : 'Share Link')}</span>
        </button>
      </div>
    </div>
  );
}
