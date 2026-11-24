import React from 'react';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiTv, FiMessageSquare, FiLogOut
} from 'react-icons/fi';
import { AVAILABLE_REACTIONS } from './meetingUtils';

/**
 * MeetingControlsBar Component
 * Floating Zoom-style bottom dock with:
 * - Mic / Camera toggles
 * - Screen sharing toggle
 * - Interactive Whiteboard launcher
 * - 🔴 In-Browser Meeting Recorder (Host / Co-host)
 * - In-Meeting Chat launcher with unread badge & lock indicator
 * - Raise hand button
 * - Live reaction launcher
 * - Leave meeting button
 */
export default function MeetingControlsBar(props) {
  const isBn = props.isBn;
  const media = props.media || props;
  const rtc = props.rtc || props;
  const chat = props.chat || props;
  const recorder = props.recorder;

  const isMeHost = rtc.isMeHost;
  const isMuted = media.isMuted;
  const isVideoOff = media.isVideoOff;
  const isScreenSharing = media.isScreenSharing;
  const isWhiteboardOpen = rtc.isWhiteboardOpen;
  const chatOpen = chat.chatOpen;
  const unreadCount = chat.unreadCount || 0;
  const isChatLocked = props.isChatLocked ?? chat.isChatLocked;
  const isHandRaised = rtc.isHandRaised;
  const reactionPickerOpen = props.reactionPickerOpen;

  const onToggleAudio = props.onToggleAudio || media.toggleAudio;
  const onToggleVideo = props.onToggleVideo || media.toggleVideo;
  const onToggleScreenShare = props.onToggleScreenShare || (() => media.toggleScreenShare(rtc.activeCallsRef));
  const onToggleWhiteboard = props.onToggleWhiteboard || rtc.handleToggleWhiteboard;
  const onToggleChat = props.onToggleChat || (() => {
    chat.setChatOpen(!chat.chatOpen);
    if (!chat.chatOpen) chat.setUnreadCount(0);
  });
  const onToggleRaiseHand = props.onToggleRaiseHand || rtc.toggleRaiseHand;
  const onToggleReactionPicker = props.onToggleReactionPicker;
  const onSendReaction = props.onSendReaction || rtc.sendFloatingReaction;
  const onLeave = props.onLeave;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 px-3 md:px-5 py-2.5 rounded-3xl flex items-center gap-2 md:gap-3 shadow-2xl shadow-black/80 max-w-[95vw] overflow-x-auto">
      {/* 1. Microphone Toggle */}
      <button
        onClick={() => onToggleAudio()}
        className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
          isMuted
            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
            : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
        }`}
        title={isMuted ? (isBn ? 'মাইক চালু করুন' : 'Unmute Mic') : (isBn ? 'মাইক বন্ধ করুন' : 'Mute Mic')}
      >
        {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
        <span className="text-[9px] font-bold mt-0.5">{isMuted ? (isBn ? 'আনমিউট' : 'Unmute') : (isBn ? 'মিউট' : 'Mute')}</span>
      </button>

      {/* 2. Video Camera Toggle */}
      <button
        onClick={onToggleVideo}
        className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
          isVideoOff
            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
            : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
        }`}
        title={isVideoOff ? (isBn ? 'ক্যামেরা চালু করুন' : 'Start Video') : (isBn ? 'ক্যামেরা বন্ধ করুন' : 'Stop Video')}
      >
        {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
        <span className="text-[9px] font-bold mt-0.5">{isVideoOff ? (isBn ? 'স্টার্ট' : 'Start') : (isBn ? 'স্টপ' : 'Stop')}</span>
      </button>

      {/* 3. Screen Share Toggle */}
      <button
        onClick={onToggleScreenShare}
        className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
          isScreenSharing
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
            : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
        }`}
        title={isScreenSharing ? (isBn ? 'স্ক্রিন শেয়ার বন্ধ করুন' : 'Stop Presenting') : (isBn ? 'স্ক্রিন শেয়ার করুন' : 'Share Screen')}
      >
        <FiTv size={18} />
        <span className="text-[9px] font-bold mt-0.5">{isScreenSharing ? (isBn ? 'শেয়ারিং' : 'Sharing') : (isBn ? 'শেয়ার' : 'Share')}</span>
      </button>

      {/* 4. Whiteboard Toggle */}
      <button
        onClick={onToggleWhiteboard}
        className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
          isWhiteboardOpen
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
            : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
        }`}
        title={isBn ? 'ইন্টারঅ্যাক্টিভ হোয়াইটবোর্ড' : 'Interactive Whiteboard'}
      >
        <span className="text-base leading-none">🎨</span>
        <span className="text-[9px] font-bold mt-0.5">{isBn ? 'বোর্ড' : 'Board'}</span>
      </button>

      {/* 5. 🔴 Host Meeting Recorder Toggle (Host / Co-Host Only) */}
      {isMeHost && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (recorder?.isRecording) {
                recorder.stopRecording();
              } else {
                recorder?.startRecording({
                  localStream: media?.localStreamRef?.current,
                  remotePeerList: rtc?.remotePeerList || []
                });
              }
            }}
            className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
              recorder?.isRecording
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
            }`}
            title={
              recorder?.isRecording
                ? (isBn ? `রেকর্ডিং বন্ধ করুন (${recorder.formattedDuration})` : `Stop Recording (${recorder.formattedDuration})`)
                : (isBn ? 'মিটিং রেকর্ড করুন' : 'Record Meeting')
            }
          >
            {recorder?.isRecording ? (
              <span className="w-3.5 h-3.5 bg-white rounded-xs shadow-xs" />
            ) : (
              <span className="w-3.5 h-3.5 bg-rose-500 rounded-full shadow-sm ring-2 ring-rose-500/30" />
            )}
            <span className="text-[9px] font-bold mt-0.5">
              {recorder?.isRecording ? (isBn ? 'স্টপ' : 'Stop') : (isBn ? 'রেকর্ড' : 'Record')}
            </span>
          </button>

          {/* Pause / Resume button while recording */}
          {recorder?.isRecording && (
            <button
              onClick={() => {
                if (recorder.isPaused) recorder.resumeRecording();
                else recorder.pauseRecording();
              }}
              className="flex flex-col items-center justify-center w-8 h-11 md:w-9 md:h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title={recorder.isPaused ? (isBn ? 'রেকর্ডিং চালু করুন' : 'Resume Recording') : (isBn ? 'রেকর্ডিং থামান' : 'Pause Recording')}
            >
              <span className="text-xs">{recorder.isPaused ? '▶️' : '⏸️'}</span>
              <span className="text-[8px] font-bold mt-0.5">{recorder.isPaused ? (isBn ? 'চালু' : 'Play') : (isBn ? 'পজ' : 'Pause')}</span>
            </button>
          )}
        </div>
      )}

      {/* 6. In-Meeting Live Chat Button */}
      <button
        onClick={onToggleChat}
        className={`relative flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
          chatOpen
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
            : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
        }`}
        title={isBn ? 'ইন-মিটিং চ্যাট' : 'In-Meeting Chat'}
      >
        <FiMessageSquare size={18} />
        <span className="text-[9px] font-bold mt-0.5">{isBn ? 'চ্যাট' : 'Chat'}</span>
        {unreadCount > 0 && !chatOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#070b14] animate-bounce shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isChatLocked && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-black flex items-center justify-center ring-1 ring-[#070b14]" title="Chat is locked by host">
            🔒
          </span>
        )}
      </button>

      {/* 7. Raise Hand Button */}
      <button
        onClick={onToggleRaiseHand}
        className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
          isHandRaised
            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 animate-pulse'
            : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
        }`}
        title={isHandRaised ? (isBn ? 'হাত নামিয়ে নিন' : 'Lower Hand') : (isBn ? 'কথা বলার জন্য হাত তুলুন' : 'Raise Hand')}
      >
        <span className="text-base leading-none">✋</span>
        <span className="text-[9px] font-bold mt-0.5">{isHandRaised ? (isBn ? 'তোলা' : 'Raised') : (isBn ? 'হাত' : 'Hand')}</span>
      </button>

      {/* 8. Live Reaction Launcher with Picker Tray */}
      <div className="relative reaction-picker-container">
        <button
          onClick={onToggleReactionPicker}
          className={`flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition cursor-pointer ${
            reactionPickerOpen
              ? 'bg-slate-700 text-white shadow-lg'
              : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 hover:text-white'
          }`}
          title={isBn ? 'রিঅ্যাকশন দিন' : 'Send Reaction'}
        >
          <span className="text-base leading-none">😊</span>
          <span className="text-[9px] font-bold mt-0.5">{isBn ? 'রিঅ্যাক্ট' : 'React'}</span>
        </button>

        {reactionPickerOpen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-2 rounded-2xl shadow-2xl flex items-center gap-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
            {AVAILABLE_REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => {
                  onSendReaction(emoji);
                  onToggleReactionPicker?.();
                }}
                className="w-10 h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition cursor-pointer"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-7 bg-slate-800 mx-1" />

      {/* 9. Leave Meeting Button */}
      <button
        onClick={onLeave}
        className="flex items-center gap-1.5 px-3 md:px-4 h-11 md:h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-rose-600/30"
        title={isBn ? 'মিটিং থেকে প্রস্থান করুন' : 'Leave Meeting'}
      >
        <FiLogOut size={16} />
        <span className="hidden md:inline">{isBn ? 'ত্যাগ করুন' : 'Leave'}</span>
      </button>
    </div>
  );
}
