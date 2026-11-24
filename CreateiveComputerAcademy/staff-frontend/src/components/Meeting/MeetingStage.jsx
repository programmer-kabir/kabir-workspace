import React from 'react';
import { FiRadio, FiTv, FiMicOff } from 'react-icons/fi';
import InteractiveWhiteboard from '../InteractiveWhiteboard';
import FloatingReactionsOverlay from './FloatingReactionsOverlay';
import ParticipantTile from './ParticipantTile';
import { getAvatarUrl, createFallbackStream } from './meetingUtils';

/**
 * MeetingStage Component
 * Renders the active video presentation viewport:
 * 1. Connecting / Skip & Join listen-only overlay
 * 2. Screen sharing banner + stage & filmstrip
 * 3. Interactive whiteboard + filmstrip
 * 4. Hero spotlight / pin stage + filmstrip
 * 5. Zoom-style gallery grid (Local user card + remote participant cards)
 */
export default function MeetingStage(props) {
  const isBn = props.isBn;
  const currentUser = props.currentUser;
  const media = props.media || props;
  const rtc = props.rtc || props;

  const loadingMedia = media.loadingMedia;
  const setLoadingMedia = media.setLoadingMedia;
  const localStreamRef = media.localStreamRef;
  const localVideoRef = media.localVideoRef;
  const localFilmstripVideoRef = media.localFilmstripVideoRef;
  const isVideoOff = media.isVideoOff;
  const setIsVideoOff = media.setIsVideoOff;
  const isMuted = media.isMuted;
  const setIsMuted = media.setIsMuted;
  const isScreenSharing = media.isScreenSharing;
  const revertToCamera = props.revertToCamera || (() => media.revertToCamera(rtc.activeCallsRef));

  const isMeHost = rtc.isMeHost;
  const myHostTier = rtc.myHostTier;
  const isHandRaised = rtc.isHandRaised;
  const tileReactions = rtc.tileReactions;
  const floatingReactions = rtc.floatingReactions;
  const remotePeerList = rtc.remotePeerList || [];
  const getUserHostTier = rtc.getUserHostTier;
  const remoteMuteStates = rtc.remoteMuteStates || {};
  const raisedHands = rtc.raisedHands || {};
  const totalInRoom = rtc.totalInRoom || (remotePeerList.length + 1);
  const pinnedUser = rtc.pinnedUser;
  const setPinnedUser = rtc.setPinnedUser;
  const spotlightUser = rtc.spotlightUser;
  const isWhiteboardOpen = rtc.isWhiteboardOpen;
  const setIsWhiteboardOpen = rtc.setIsWhiteboardOpen;
  const whiteboardSharedBy = rtc.whiteboardSharedBy;
  const whiteboardAllowOthers = rtc.whiteboardAllowOthers;
  const whiteboardHistory = rtc.whiteboardHistory || [];
  const handleToggleWhiteboard = rtc.handleToggleWhiteboard;
  const handleToggleWhiteboardAllowOthers = rtc.handleToggleWhiteboardAllowOthers;
  const handleWhiteboardAction = rtc.handleWhiteboardAction;
  const handleWhiteboardUndo = rtc.handleWhiteboardUndo;
  const handleWhiteboardClear = rtc.handleWhiteboardClear;
  const handleToggleParticipantMic = rtc.handleToggleParticipantMic;
  const handleToggleCoHost = rtc.handleToggleCoHost;
  const handleTogglePin = rtc.handleTogglePin;
  const handleToggleSpotlight = rtc.handleToggleSpotlight;

  // Focus resolution for Stage vs Filmstrip
  const effectiveFocusUser = pinnedUser || spotlightUser;
  const isFocusSpotlight = Boolean(
    spotlightUser && (!pinnedUser || (pinnedUser.peerId === spotlightUser.peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(spotlightUser.userId))))
  );
  const isFocusLocal = Boolean(
    effectiveFocusUser && (
      effectiveFocusUser.peerId === 'local' ||
      (effectiveFocusUser.userId && Number(effectiveFocusUser.userId) === Number(currentUser?.id))
    )
  );

  return (
    <>
      {/* 🌟 CONNECTING SCREEN / SKIP FALLBACK */}
      {loadingMedia && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#070b14]/90 backdrop-blur-sm text-white p-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <FiRadio className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-xs font-bold text-slate-300">
            {isBn ? 'সিসিএ স্টুডিওতে যুক্ত হওয়া হচ্ছে...' : 'Connecting to CCA Video Studio...'}
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs">
            {isBn ? 'ক্যামেরা ও মাইক্রোফোন লোড হতে দেরি হলে সরাসরি যুক্ত হন' : 'If camera takes time, you can join immediately'}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!localStreamRef.current) {
                const fallback = createFallbackStream();
                localStreamRef.current = fallback;
                setIsVideoOff(true);
                setIsMuted(true);
              }
              setLoadingMedia(false);
            }}
            className="mt-1 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <span>🚀 {isBn ? 'সরাসরি প্রবেশ করুন (লিসেন অনলি)' : 'Skip & Join (Listen-Only)'}</span>
          </button>
        </div>
      )}

      {/* 🌟 SCREEN SHARING BANNER (When active) */}
      {isScreenSharing && (
        <div className="mb-3 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-white animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isBn ? 'আপনি বর্তমানে সবার সাথে আপনার স্ক্রিন শেয়ার করছেন' : 'You are currently sharing your screen with everyone'}</span>
          </div>
          <button
            onClick={revertToCamera}
            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer"
          >
            {isBn ? 'শেয়ার বন্ধ করুন' : 'Stop Presenting'}
          </button>
        </div>
      )}

      {/* 🌟 ZOOM-STYLE GALLERY GRID (When NOT sharing screen, or when presenting) */}
      <div className="relative flex-1 w-full h-[calc(100%-70px)] overflow-hidden flex items-center justify-center">
        {/* Floating Reactions Overlay */}
        <FloatingReactionsOverlay floatingReactions={floatingReactions} />

        {/* 1. Screen Sharing Stage */}
        {isScreenSharing ? (
          <div className="w-full h-full flex flex-col md:flex-row gap-3">
            <div className="flex-1 h-full rounded-2xl md:rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl relative flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-slate-700">
                <FiTv className="text-emerald-400" size={13} />
                <span>{isBn ? 'আপনার শেয়ারকৃত স্ক্রিন' : 'Your Shared Screen'}</span>
              </div>
            </div>

            {remotePeerList.length > 0 && (
              <div className="w-full md:w-60 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
                {remotePeerList.map(([peerId, remote]) => {
                  const remoteTier = getUserHostTier ? getUserHostTier(remote.userId, remote.role) : 'member';
                  const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                  const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
                  const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

                  return (
                    <div key={peerId} className="w-48 md:w-full h-32 shrink-0">
                      <ParticipantTile
                        remotePeerId={peerId}
                        stream={remote.stream}
                        userId={remote.userId}
                        userName={remote.userName}
                        role={remote.role}
                        avatar={remote.avatar}
                        tier={remoteTier}
                        isMuted={isRemoteMuted}
                        isHandRaised={Boolean(raisedHands[remote.userId])}
                        recentReaction={tileReactions?.[remote.userId]?.emoji}
                        canControlAudio={isMeHost}
                        onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                        canPromote={isMeHost}
                        onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                        compact
                        isBn={isBn}
                        isPinned={isTilePinned}
                        onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                        isSpotlighted={isTileSpotlighted}
                        onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                        canSpotlight={isMeHost}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : isWhiteboardOpen ? (
          /* 2. Interactive Whiteboard Hero Stage + Filmstrip */
          <div className="w-full h-full flex flex-col md:flex-row gap-3">
            <div className="flex-1 h-full min-h-[420px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative">
              <InteractiveWhiteboard
                isHost={isMeHost}
                canDraw={isMeHost || whiteboardAllowOthers}
                sharedBy={whiteboardSharedBy}
                allowOthers={whiteboardAllowOthers}
                onToggleAllowOthers={handleToggleWhiteboardAllowOthers}
                onClose={() => {
                  if (isMeHost) handleToggleWhiteboard();
                  else setIsWhiteboardOpen(false);
                }}
                history={whiteboardHistory}
                onBroadcastAction={handleWhiteboardAction}
                onBroadcastUndo={handleWhiteboardUndo}
                onBroadcastClear={handleWhiteboardClear}
                isBn={isBn}
                currentUser={currentUser}
              />
            </div>

            <div className="w-full md:w-60 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
              <div className="w-48 md:w-full h-32 shrink-0 rounded-2xl overflow-hidden bg-slate-900 border border-purple-500/30 relative flex items-center justify-center shadow-lg">
                <video
                  ref={localFilmstripVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-bold text-sm shadow">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                  <span>{currentUser?.name || 'You'} ({isBn ? 'আপনি' : 'You'})</span>
                </div>
              </div>

              {remotePeerList.map(([peerId, remote]) => {
                const remoteTier = getUserHostTier ? getUserHostTier(remote.userId, remote.role) : 'member';
                const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
                const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

                return (
                  <div key={peerId} className="w-48 md:w-full h-32 shrink-0">
                    <ParticipantTile
                      remotePeerId={peerId}
                      stream={remote.stream}
                      userId={remote.userId}
                      userName={remote.userName}
                      role={remote.role}
                      avatar={remote.avatar}
                      tier={remoteTier}
                      isMuted={isRemoteMuted}
                      isHandRaised={Boolean(raisedHands[remote.userId])}
                      recentReaction={tileReactions?.[remote.userId]?.emoji}
                      canControlAudio={isMeHost}
                      onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                      canPromote={isMeHost}
                      onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                      compact
                      isBn={isBn}
                      isPinned={isTilePinned}
                      onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                      isSpotlighted={isTileSpotlighted}
                      onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                      canSpotlight={isMeHost}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : effectiveFocusUser ? (
          /* 3. Hero Stage + Filmstrip (When Pinned or Spotlighted) */
          <div className="w-full h-full flex flex-col md:flex-row gap-3">
            <div className="flex-1 h-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-amber-500/40 shadow-2xl relative flex items-center justify-center">
              {/* Pin/Spotlight Indicator Banner */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold shadow-lg ${
                  isFocusSpotlight
                    ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                }`}>
                  <span>{isFocusSpotlight ? '🌟' : '📌'}</span>
                  <span>
                    {isFocusSpotlight
                      ? (isBn ? `সবার জন্য স্পটলাইট: ${effectiveFocusUser.userName}` : `Spotlight: ${effectiveFocusUser.userName}`)
                      : (isBn ? `আপনার জন্য পিন করা: ${effectiveFocusUser.userName}` : `Pinned for You: ${effectiveFocusUser.userName}`)}
                  </span>
                </div>

                {pinnedUser ? (
                  <button
                    onClick={() => setPinnedUser(null)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                    title={isBn ? 'আনপিন করুন' : 'Unpin speaker'}
                  >
                    <span>✕</span>
                    <span>{isBn ? 'আনপিন' : 'Unpin'}</span>
                  </button>
                ) : isMeHost ? (
                  <button
                    onClick={() => handleToggleSpotlight(spotlightUser.peerId, spotlightUser.userId, spotlightUser.userName)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                    title={isBn ? 'স্পটলাইট বন্ধ করুন' : 'Remove spotlight'}
                  >
                    <span>✕</span>
                    <span>{isBn ? 'সরান' : 'Remove'}</span>
                  </button>
                ) : null}
              </div>

              {/* Hero Video Content */}
              {isFocusLocal ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                  />
                  {isVideoOff && (
                    <div className="flex flex-col items-center justify-center gap-3">
                      {currentUser?.profile_picture ? (
                        <img
                          src={getAvatarUrl(currentUser.profile_picture)}
                          alt={currentUser.name}
                          className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-rose-500/40 ring-4 ring-rose-500/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <p className="text-base font-bold text-white">{currentUser?.name || (isBn ? 'আপনি' : 'You')}</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
                    <span>{currentUser?.name || (isBn ? 'আপনি' : 'You')} ({isBn ? 'আপনি' : 'You'})</span>
                    {isMuted ? <FiMicOff className="text-rose-500" size={13} /> : <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                </div>
              ) : (
                (() => {
                  const focusedRemoteEntry = remotePeerList.find(([pId, r]) => pId === effectiveFocusUser.peerId || (r.userId && Number(r.userId) === Number(effectiveFocusUser.userId)));
                  if (!focusedRemoteEntry) return null;
                  const [focusedPeerId, focusedRemote] = focusedRemoteEntry;
                  const focusedTier = getUserHostTier ? getUserHostTier(focusedRemote.userId, focusedRemote.role) : 'member';
                  const isFocusedMuted = Boolean(remoteMuteStates[focusedRemote.userId]);

                  return (
                    <div className="w-full h-full relative">
                      <ParticipantTile
                        remotePeerId={focusedPeerId}
                        stream={focusedRemote.stream}
                        userId={focusedRemote.userId}
                        userName={focusedRemote.userName}
                        role={focusedRemote.role}
                        avatar={focusedRemote.avatar}
                        tier={focusedTier}
                        isMuted={isFocusedMuted}
                        isHandRaised={Boolean(raisedHands[focusedRemote.userId])}
                        recentReaction={tileReactions?.[focusedRemote.userId]?.emoji}
                        canControlAudio={isMeHost}
                        onToggleMic={() => handleToggleParticipantMic(focusedRemote.userId, focusedRemote.userName, isFocusedMuted)}
                        canPromote={isMeHost}
                        onToggleCoHost={() => handleToggleCoHost(focusedRemote.userId, focusedRemote.userName, focusedTier === 'co_host')}
                        isBn={isBn}
                        isPinned={Boolean(pinnedUser && (pinnedUser.peerId === focusedPeerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(focusedRemote.userId))))}
                        onTogglePin={() => handleTogglePin(focusedPeerId, focusedRemote.userId, focusedRemote.userName)}
                        isSpotlighted={Boolean(spotlightUser && (spotlightUser.peerId === focusedPeerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(focusedRemote.userId))))}
                        onToggleSpotlight={() => handleToggleSpotlight(focusedPeerId, focusedRemote.userId, focusedRemote.userName)}
                        canSpotlight={isMeHost}
                      />
                    </div>
                  );
                })()
              )}
            </div>

            {/* Filmstrip of Remaining Participants */}
            <div className="w-full md:w-60 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0 pr-1">
              {!isFocusLocal && (
                <div className="w-48 md:w-full h-32 shrink-0 relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
                  <video
                    ref={localFilmstripVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                  />
                  {isVideoOff && (
                    <div className="flex flex-col items-center justify-center gap-1">
                      {currentUser?.profile_picture ? (
                        <img
                          src={getAvatarUrl(currentUser.profile_picture)}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-white">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-slate-300">{currentUser?.name || (isBn ? 'আপনি' : 'You')}</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-white text-[10px] font-bold z-10">
                    <span>{currentUser?.name || (isBn ? 'আপনি' : 'You')} ({isBn ? 'আপনি' : 'You'})</span>
                    {isMuted ? <FiMicOff className="text-rose-500" size={10} /> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1 z-20">
                    <button
                      onClick={() => handleTogglePin('local', currentUser?.id, currentUser?.name || 'You')}
                      className="p-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs text-white cursor-pointer"
                      title={isBn ? 'নিজেকে পিন করুন' : 'Pin yourself'}
                    >
                      📌
                    </button>
                    {isMeHost && (
                      <button
                        onClick={() => handleToggleSpotlight('local', currentUser?.id, currentUser?.name || 'You')}
                        className="p-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 cursor-pointer"
                        title={isBn ? 'নিজেকে স্পটলাইট করুন' : 'Spotlight yourself'}
                      >
                        🌟
                      </button>
                    )}
                  </div>
                </div>
              )}

              {remotePeerList
                .filter(([pId, r]) => !(isFocusLocal ? false : (pId === effectiveFocusUser.peerId || (r.userId && Number(r.userId) === Number(effectiveFocusUser.userId)))))
                .map(([peerId, remote]) => {
                  const remoteTier = getUserHostTier ? getUserHostTier(remote.userId, remote.role) : 'member';
                  const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                  const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
                  const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

                  return (
                    <div key={peerId} className="w-48 md:w-full h-32 shrink-0">
                      <ParticipantTile
                        remotePeerId={peerId}
                        stream={remote.stream}
                        userId={remote.userId}
                        userName={remote.userName}
                        role={remote.role}
                        avatar={remote.avatar}
                        tier={remoteTier}
                        isMuted={isRemoteMuted}
                        isHandRaised={Boolean(raisedHands[remote.userId])}
                        recentReaction={tileReactions?.[remote.userId]?.emoji}
                        canControlAudio={isMeHost}
                        onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                        canPromote={isMeHost}
                        onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                        compact
                        isBn={isBn}
                        isPinned={isTilePinned}
                        onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                        isSpotlighted={isTileSpotlighted}
                        onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                        canSpotlight={isMeHost}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* 4. Standard Gallery Grid (Zoom Style) */
          <div className={`w-full h-full grid gap-3 md:gap-4 p-1 ${
            totalInRoom === 1 ? 'grid-cols-1 max-w-4xl mx-auto' :
            totalInRoom === 2 ? 'grid-cols-1 md:grid-cols-2' :
            totalInRoom <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
          }`}>
            {/* Local User Card */}
            <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 shadow-xl flex items-center justify-center group ${
              !isMuted ? 'border-rose-500/40 ring-1 ring-rose-500/20' : 'border-slate-800'
            }`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
              />

              {isVideoOff && (
                <div className="flex flex-col items-center justify-center gap-3">
                  {currentUser?.profile_picture ? (
                    <img
                      src={getAvatarUrl(currentUser.profile_picture)}
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-rose-500/40 ring-4 ring-rose-500/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{currentUser?.name || (isBn ? 'আপনি' : 'You')}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {isBn ? 'ক্যামেরা বন্ধ রয়েছে' : 'Camera Off'}
                    </p>
                  </div>
                </div>
              )}

              {isHandRaised && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/25 backdrop-blur-md border border-amber-500/60 text-amber-300 text-xs font-bold animate-bounce shadow-xl">
                  <span className="text-sm">✋</span>
                  <span>{isBn ? 'আপনার হাত তোলা' : 'Hand Raised'}</span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
                <span>
                  {currentUser?.name || (isBn ? 'আপনি' : 'You')}{' '}
                  ({myHostTier === 'host' ? (isBn ? 'হোস্ট' : 'Host') : myHostTier === 'co_host' ? (isBn ? 'কো-হোস্ট' : 'Co-Host') : (isBn ? 'আপনি' : 'You')})
                </span>
                {tileReactions?.[currentUser?.id] && (
                  <span className="text-sm animate-bounce select-none" title={isBn ? 'আপনার রিঅ্যাকশন' : 'Your Reaction'}>
                    {tileReactions[currentUser?.id].emoji}
                  </span>
                )}
                {myHostTier === 'host' ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
                    👑 {isBn ? 'হোস্ট' : 'Host'}
                  </span>
                ) : myHostTier === 'co_host' ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1">
                    ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
                  </span>
                ) : null}
                {isMuted ? (
                  <FiMicOff className="text-rose-500" size={13} />
                ) : (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
                    <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
                  </span>
                )}
              </div>

              <div className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 transition-opacity ${
                (pinnedUser?.peerId === 'local' || spotlightUser?.peerId === 'local') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <button
                  onClick={() => handleTogglePin('local', currentUser?.id, currentUser?.name || 'You')}
                  className={`px-2 py-1 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg flex items-center gap-1 ${
                    pinnedUser?.peerId === 'local'
                      ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200'
                      : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                  title={isBn ? 'নিজেকে পিন করুন' : 'Pin yourself'}
                >
                  <span>📌</span>
                  <span className="text-[10px]">{pinnedUser?.peerId === 'local' ? (isBn ? 'আনপিন' : 'Unpin') : (isBn ? 'পিন' : 'Pin')}</span>
                </button>
                {isMeHost && (
                  <button
                    onClick={() => handleToggleSpotlight('local', currentUser?.id, currentUser?.name || 'You')}
                    className={`px-2 py-1 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg flex items-center gap-1 ${
                      spotlightUser?.peerId === 'local'
                        ? 'bg-amber-500/40 border-amber-400 text-amber-200 animate-pulse'
                        : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-amber-300'
                    }`}
                    title={isBn ? 'নিজেকে সবার জন্য স্পটলাইট করুন' : 'Spotlight yourself'}
                  >
                    <span>🌟</span>
                    <span className="text-[10px]">{spotlightUser?.peerId === 'local' ? (isBn ? 'স্পটলাইট সরান' : 'Remove') : (isBn ? 'স্পটলাইট' : 'Spotlight')}</span>
                  </button>
                )}
              </div>

              {totalInRoom === 1 && (
                <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{isBn ? 'অন্যান্য সদস্যের যোগদানের জন্য অপেক্ষা করা হচ্ছে...' : 'Waiting for team members to join...'}</span>
                </div>
              )}
            </div>

            {/* Remote Participants */}
            {remotePeerList.map(([peerId, remote]) => {
              const remoteTier = getUserHostTier ? getUserHostTier(remote.userId, remote.role) : 'member';
              const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
              const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
              const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

              return (
                <ParticipantTile
                  key={peerId}
                  remotePeerId={peerId}
                  stream={remote.stream}
                  userId={remote.userId}
                  userName={remote.userName}
                  role={remote.role}
                  avatar={remote.avatar}
                  tier={remoteTier}
                  isMuted={isRemoteMuted}
                  isHandRaised={Boolean(raisedHands[remote.userId])}
                  recentReaction={tileReactions?.[remote.userId]?.emoji}
                  canControlAudio={isMeHost}
                  onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                  canPromote={isMeHost}
                  onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                  isBn={isBn}
                  isPinned={isTilePinned}
                  onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                  isSpotlighted={isTileSpotlighted}
                  onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                  canSpotlight={isMeHost}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
