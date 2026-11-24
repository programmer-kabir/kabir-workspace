import React from 'react';
import {
  FiUsers, FiMic, FiMicOff, FiCheck, FiX, FiShield, FiStar
} from 'react-icons/fi';
import { getAvatarUrl } from './meetingUtils';

/**
 * ParticipantsModal Component
 * Zoom-style active roster modal:
 * - Priority hand-raised queue with 1-click lower hand
 * - 1-Click host audio mute / unmute for all or individual participants
 * - Promote / demote co-host permissions
 */
export default function ParticipantsModal(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const isBn = props.isBn;
  const currentUser = props.currentUser;
  const media = props.media || props;
  const rtc = props.rtc || props;

  const isMeHost = rtc.isMeHost;
  const myHostTier = rtc.myHostTier;
  const isMuted = media.isMuted;
  const onToggleMyAudio = props.onToggleMyAudio || media.toggleAudio;
  const raisedHands = rtc.raisedHands || {};
  const remotePeerList = rtc.remotePeerList || [];
  const remoteMuteStates = rtc.remoteMuteStates || {};
  const getUserHostTier = rtc.getUserHostTier;
  const onLowerHand = rtc.handleLowerHand;
  const onToggleParticipantMic = rtc.handleToggleParticipantMic;
  const onToggleCoHost = rtc.handleToggleCoHost;
  const onMuteAll = rtc.handleMuteAll;
  const onUnmuteAll = rtc.handleUnmuteAll;

  if (!isOpen) return null;

  const raisedHandsList = Object.entries(raisedHands);
  const totalInRoom = remotePeerList.length + 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <FiUsers size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isBn ? 'উপস্থিত সদস্যবৃন্দ' : 'Participants'}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-black">
                  {totalInRoom}
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Priority Hand-Raised Queue (When members raise hands) */}
        {raisedHandsList.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
              <span className="text-sm animate-bounce">✋</span>
              <span>{isBn ? 'কথা বলার অনুরোধের তালিকা' : 'Raised Hands Queue'}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20">
                {raisedHandsList.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {raisedHandsList.map(([uId, data]) => {
                const isUserMe = Number(uId) === Number(currentUser?.id);
                return (
                  <div key={uId} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">
                        {data.userName} {isUserMe ? (isBn ? '(আপনি)' : '(You)') : ''}
                      </span>
                    </div>
                    {isMeHost && !isUserMe && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onToggleParticipantMic(uId, data.userName, true)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition flex items-center gap-1"
                          title={isBn ? 'মাইক চালু করতে বলুন' : 'Unmute & Allow to speak'}
                        >
                          <FiMic size={11} />
                          <span>{isBn ? 'অনুমতি দিন' : 'Allow'}</span>
                        </button>
                        <button
                          onClick={() => onLowerHand(uId, data.userName)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                          title={isBn ? 'হাত নামিয়ে দিন' : 'Lower hand'}
                        >
                          <FiX size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Participant Roster List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 mt-1">
          {/* 1. Local Current User Entry */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.profile_picture ? (
                <img
                  src={getAvatarUrl(currentUser.profile_picture)}
                  alt="You"
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-rose-500/30 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>{currentUser?.name || 'You'} ({isBn ? 'আপনি' : 'You'})</span>
                  {myHostTier === 'host' ? (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                      👑 {isBn ? 'হোস্ট' : 'Host'}
                    </span>
                  ) : myHostTier === 'co_host' ? (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                      ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
                    </span>
                  ) : null}
                </p>
                <p className="text-[10px] text-slate-400">{currentUser?.roles?.[0] || 'Staff Member'}</p>
              </div>
            </div>

            <button
              onClick={() => onToggleMyAudio()}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
              title={isMuted ? (isBn ? 'মাইক চালু করুন' : 'Unmute') : (isBn ? 'মাইক বন্ধ করুন' : 'Mute')}
            >
              {isMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
            </button>
          </div>

          {/* 2. Remote Participant Entries */}
          {remotePeerList.map(([peerId, remote]) => {
            const remoteTier = getUserHostTier ? getUserHostTier(remote.userId, remote.role) : 'member';
            const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
            const isHandUp = Boolean(raisedHands[remote.userId]);

            return (
              <div key={peerId} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-700 transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  {remote.avatar ? (
                    <img
                      src={getAvatarUrl(remote.avatar)}
                      alt={remote.userName}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {remote.userName ? remote.userName.charAt(0).toUpperCase() : 'M'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                      <span>{remote.userName}</span>
                      {isHandUp && <span className="text-xs animate-bounce" title="Hand Raised">✋</span>}
                      {remoteTier === 'host' ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                          👑 Host
                        </span>
                      ) : remoteTier === 'co_host' ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                          ⭐ Co-Host
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{remote.role || 'Member'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Co-Host Promote/Demote (Host Only) */}
                  {isMeHost && remote.userId && (
                    <button
                      onClick={() => onToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        remoteTier === 'co_host'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/30'
                      }`}
                      title={remoteTier === 'co_host' ? (isBn ? 'কো-হোস্ট পদ বাতিল করুন' : 'Demote Co-Host') : (isBn ? 'কো-হোস্ট নিযুক্ত করুন' : 'Make Co-Host')}
                    >
                      <FiStar size={13} />
                    </button>
                  )}

                  {/* 1-Click Mic Mute / Unmute Control */}
                  {isMeHost && remote.userId ? (
                    <button
                      onClick={() => onToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        isRemoteMuted
                          ? 'bg-rose-500/20 text-rose-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400'
                      }`}
                      title={isRemoteMuted ? (isBn ? 'মাইক আনমিউট করুন' : '1-Click Unmute') : (isBn ? 'মাইক মিউট করুন' : '1-Click Mute')}
                    >
                      {isRemoteMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
                    </button>
                  ) : (
                    <div className="p-2 text-slate-500">
                      {isRemoteMuted ? <FiMicOff size={14} className="text-rose-400/60" /> : <FiMic size={14} className="text-emerald-400/60" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Host Quick Actions Bar (Mute All / Unmute All) */}
        {isMeHost && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={onMuteAll}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiMicOff size={13} />
              <span>{isBn ? 'সবাইকে মিউট' : 'Mute All'}</span>
            </button>
            <button
              onClick={onUnmuteAll}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-500/30 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiMic size={13} />
              <span>{isBn ? 'সবার মাইক চালু' : 'Unmute All'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
