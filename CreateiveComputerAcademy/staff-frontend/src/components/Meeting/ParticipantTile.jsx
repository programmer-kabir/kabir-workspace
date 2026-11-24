import React, { useEffect, useRef, useState } from 'react';
import { FiMic, FiMicOff, FiStar } from 'react-icons/fi';
import { getAvatarUrl } from './meetingUtils';

/**
 * 🌟 ParticipantTile (RemoteVideoTile)
 * Zoom-style video card with avatar fallback, host crowns, audio waveforms,
 * raised hand badge, and 1-click Pin / Spotlight / Mic controls.
 */
export default function ParticipantTile({
  remotePeerId,
  stream,
  userId,
  userName,
  role,
  avatar,
  compact = false,
  tier = 'member',
  isMuted = false,
  canControlAudio = false,
  onToggleMic,
  canPromote = false,
  onToggleCoHost,
  isBn = false,
  isHandRaised = false,
  recentReaction = null,
  isPinned = false,
  onTogglePin,
  isSpotlighted = false,
  onToggleSpotlight,
  canSpotlight = false
}) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);
  const avatarUrl = getAvatarUrl(avatar);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setHasVideo(videoTrack.enabled);
        videoTrack.onmute = () => setHasVideo(false);
        videoTrack.onunmute = () => setHasVideo(true);
      } else {
        setHasVideo(false);
      }
    }
  }, [stream]);

  const isHost = tier === 'host';
  const isCoHost = tier === 'co_host';

  return (
    <div
      className={`group relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 shadow-xl flex items-center justify-center w-full h-full ${
        isHost
          ? 'border-amber-400/60 ring-1 ring-amber-400/20'
          : isCoHost
          ? 'border-amber-500/40'
          : 'border-slate-800'
      } ${compact ? 'rounded-xl' : ''}`}
    >
      {/* ✋ Remote User Raised Hand Badge */}
      {isHandRaised && (
        <div
          className={`absolute top-3 z-30 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/25 backdrop-blur-md border border-amber-500/60 text-amber-300 text-[11px] font-bold animate-bounce shadow-xl ${
            canPromote && tier !== 'host' ? 'right-28' : 'right-3'
          }`}
        >
          <span className="text-sm">✋</span>
          <span>{isBn ? 'হাত তুলেছে' : 'Hand Up'}</span>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
      />

      {/* Zoom-Style Video Off Avatar Card */}
      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className={`w-16 h-16 rounded-full object-cover border shadow-md ring-2 ${
                isHost
                  ? 'border-amber-400 ring-amber-400/40'
                  : isCoHost
                  ? 'border-amber-500/60 ring-amber-500/20'
                  : 'border-slate-700 ring-slate-700/50'
              }`}
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full border flex items-center justify-center text-xl font-black text-white shadow-inner ${
                isHost
                  ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                  : isCoHost
                  ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {userName ? userName.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          {!compact && (
            <div className="text-center">
              <p className="text-xs font-bold text-white">{userName}</p>
              <p className="text-[10px] text-slate-400">
                {isBn ? 'ক্যামেরা বন্ধ' : 'Camera Off'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Remote Audio Control for Host (Top-Left) */}
      {canControlAudio && userId && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMic}
            className={`px-2.5 py-1 rounded-xl backdrop-blur-md text-[10px] font-bold cursor-pointer shadow-lg flex items-center gap-1 transition-all ${
              isMuted
                ? 'bg-slate-950/85 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                : 'bg-slate-950/85 hover:bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:border-rose-400 ring-1 ring-rose-500/20'
            }`}
            title={
              isMuted
                ? isBn
                  ? 'মাইক চালু করুন (আনমিউট)'
                  : 'Unmute microphone'
                : isBn
                ? 'মাইক বন্ধ করুন (মিউট)'
                : 'Mute microphone'
            }
          >
            {isMuted ? (
              <FiMic size={11} className="text-emerald-400" />
            ) : (
              <FiMicOff size={11} className="text-rose-400" />
            )}
            <span>{isMuted ? (isBn ? 'আনমিউট' : 'Unmute') : (isBn ? 'মিউট' : 'Mute')}</span>
          </button>
        </div>
      )}

      {/* Zoom-Style Remote User Pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-[11px] font-bold z-10">
        <span>{userName}</span>
        {recentReaction && (
          <span className="text-sm animate-bounce select-none" title="Reaction">
            {recentReaction}
          </span>
        )}
        {isHost ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
            👑 {isBn ? 'হোস্ট' : 'Host'}
          </span>
        ) : isCoHost ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
            ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
          </span>
        ) : role ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
            {role}
          </span>
        ) : null}
        {canControlAudio ? (
          <button
            type="button"
            onClick={onToggleMic}
            className="cursor-pointer hover:scale-115 transition-transform p-0.5 rounded"
            title={
              isMuted
                ? isBn
                  ? 'আনমিউট করতে ক্লিক করুন'
                  : 'Click to Unmute'
                : isBn
                ? 'মিউট করতে ক্লিক করুন'
                : 'Click to Mute'
            }
          >
            {isMuted ? (
              <FiMicOff className="text-rose-500" size={13} />
            ) : (
              <span className="flex items-center gap-0.5">
                <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
                <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
                <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
              </span>
            )}
          </button>
        ) : isMuted ? (
          <FiMicOff className="text-rose-500" size={12} title={isBn ? 'মাইক বন্ধ' : 'Muted'} />
        ) : (
          <span className="flex items-center gap-0.5" title={isBn ? 'মাইক চালু' : 'Unmuted'}>
            <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
            <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
          </span>
        )}
      </div>

      {/* Quick Actions (Top-Right): Pin, Spotlight, Co-Host */}
      <div
        className={`absolute top-3 right-3 z-20 flex items-center gap-1 transition-opacity ${
          isPinned || isSpotlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Pin Button */}
        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg ${
              isPinned
                ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/40'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isPinned ? (isBn ? 'আনপিন করুন' : 'Unpin user') : isBn ? 'পিন করুন' : 'Pin user'}
          >
            📌
          </button>
        )}

        {/* Spotlight Button (Host / Co-Host Only) */}
        {canSpotlight && onToggleSpotlight && (
          <button
            type="button"
            onClick={onToggleSpotlight}
            className={`p-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg ${
              isSpotlighted
                ? 'bg-amber-500/40 border-amber-400 text-amber-200 ring-1 ring-amber-400/40 animate-pulse'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-amber-300 hover:text-white'
            }`}
            title={
              isSpotlighted
                ? isBn
                  ? 'স্পটলাইট সরান'
                  : 'Remove Spotlight'
                : isBn
                ? 'সবার জন্য স্পটলাইট করুন'
                : 'Spotlight for Everyone'
            }
          >
            🌟
          </button>
        )}

        {/* Co-Host Promote/Demote */}
        {canPromote && userId && !compact && tier !== 'host' && (
          <button
            type="button"
            onClick={onToggleCoHost}
            className="px-2 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-bold text-amber-300 hover:bg-slate-800 cursor-pointer shadow-lg flex items-center gap-1"
            title={isCoHost ? 'Remove Co-Host status' : 'Promote to Co-Host'}
          >
            <FiStar size={11} className={isCoHost ? 'fill-amber-400' : ''} />
            <span>
              {isCoHost ? (isBn ? 'পদবী কাটুন' : 'Remove Co-Host') : isBn ? 'কো-হোস্ট বানান' : 'Make Co-Host'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
