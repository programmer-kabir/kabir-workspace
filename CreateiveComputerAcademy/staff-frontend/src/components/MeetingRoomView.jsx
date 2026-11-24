import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

// Modular Sub-components
import MeetingTopBar from './Meeting/MeetingTopBar';
import MeetingStage from './Meeting/MeetingStage';
import MeetingControlsBar from './Meeting/MeetingControlsBar';
import MeetingChatDrawer from './Meeting/MeetingChatDrawer';
import ParticipantsModal from './Meeting/ParticipantsModal';
import UnmutePromptModal from './Meeting/UnmutePromptModal';
import MeetingImagePreviewModal from './Meeting/MeetingImagePreviewModal';
import MeetingRecordingModal from './Meeting/MeetingRecordingModal';

// Specialized Custom Hooks
import { useMeetingMedia } from './Meeting/hooks/useMeetingMedia';
import { useMeetingChat } from './Meeting/hooks/useMeetingChat';
import { useMeetingWebRTC } from './Meeting/hooks/useMeetingWebRTC';
import { useMeetingRecorder } from './Meeting/hooks/useMeetingRecorder';

/**
 * MeetingRoomView (Modular Component-Based Architecture)
 * Reduced from 3,600 lines to ~230 lines via decoupled sub-components and hooks:
 * - useMeetingMedia: Audio/video hardware acquisition, tracks, screen share & sound FX
 * - useMeetingChat: Real-time messaging, attachments, code snippets & direct downloads
 * - useMeetingWebRTC: Mesh signaling, host privileges, live whiteboard & hand raising
 * - useMeetingRecorder: In-browser meeting recording, mixer, timer & local/cloud save
 */
export default function MeetingRoomView({ roomId, meetingTitle, currentUser, onLeave, creatorId }) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // High-level UI Modals & Menus
  const [copied, setCopied] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(true);

  // 1. Media Acquisition & Controls
  const media = useMeetingMedia({ isBn });

  // 2. Live Chat & Attachment Management
  const chat = useMeetingChat({
    roomId,
    currentUser,
    isBn,
    isMeHost: false,
    isChatLocked,
    setIsChatLocked,
    activeConnsRef: null,
  });

  // 3. WebRTC Mesh Network, Signaling & Room Controls
  const rtc = useMeetingWebRTC({
    roomId,
    currentUser,
    creatorId,
    isBn,
    localStreamRef: media.localStreamRef,
    localVideoRef: media.localVideoRef,
    setLoadingMedia: media.setLoadingMedia,
    setIsVideoOff: media.setIsVideoOff,
    setIsMuted: media.setIsMuted,
    playSpotlightChime: media.playSpotlightChime,
    playReactionSound: media.playReactionSound,
    playHandRaiseChime: media.playHandRaiseChime,
    isChatLocked,
    setIsChatLocked,
    onIncomingMessage: chat.receiveIncomingMessage,
    onPinUpdate: chat.receivePinUpdate,
  });

  // 4. In-Browser Meeting Recorder
  const recorder = useMeetingRecorder({ isBn, roomId, currentUser });

  // Connect WebRTC connection pool to chat broadcaster
  useEffect(() => {
    chat.activeConnsRef = rtc.activeConnsRef;
  }, [rtc.activeConnsRef]);

  // Keep local stream connected to mini filmstrip video when mounted
  useEffect(() => {
    if (media.localFilmstripVideoRef.current && media.localStreamRef.current) {
      media.localFilmstripVideoRef.current.srcObject = media.localStreamRef.current;
    }
  }, [media.localFilmstripVideoRef, media.localStreamRef, media.isVideoOff]);

  // Copy Meeting Room Link
  const copyMeetingInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success(isBn ? 'মিটিং লিংক ক্লিপবোর্ডে কপি হয়েছে!' : 'Meeting link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Accept Host Unmute Prompt
  const handleUnmuteAccept = () => {
    if (media.localStreamRef.current) {
      media.localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
    }
    media.setIsMuted(false);
    rtc.setUnmutePrompt({ open: false, requestedBy: '' });
    toast.success(isBn ? 'আপনার মাইক চালু হয়েছে।' : 'Microphone unmuted.');

    if (rtc.activeConnsRef.current) {
      Object.values(rtc.activeConnsRef.current).forEach(conn => {
        try {
          if (conn.open) {
            conn.send({
              type: 'peer_mic_state',
              payload: { userId: currentUser?.id, isMuted: false },
            });
          }
        } catch (e) {}
      });
    }
  };

  // Local Mic Toggle with Peer State Broadcast
  const handleToggleAudio = (forceState) => {
    media.toggleAudio(forceState, (nextMuted) => {
      if (rtc.activeConnsRef.current) {
        Object.values(rtc.activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: nextMuted },
              });
            }
          } catch (e) {}
        });
      }
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-68px)] bg-[#050811] flex flex-col overflow-hidden font-sans select-none">
      {/* 🌟 1. Top Navigation Bar */}
      <MeetingTopBar
        isBn={isBn}
        roomId={roomId}
        meetingTitle={meetingTitle}
        isMeHost={rtc.isMeHost}
        totalInRoom={rtc.totalInRoom}
        copied={copied}
        recorder={recorder}
        onCopyInvite={copyMeetingInvite}
        onOpenParticipants={() => setParticipantsModalOpen(true)}
        onMuteAll={rtc.handleMuteAll}
        onUnmuteAll={rtc.handleUnmuteAll}
      />

      {/* 🌟 2. Central Viewport (Stage Area + Chat Drawer) */}
      <div className="relative flex-1 w-full flex overflow-hidden">
        <div className="relative flex-1 h-full bg-[#070b14] p-3 md:p-5 flex flex-col justify-between overflow-hidden">
          <MeetingStage
            isBn={isBn}
            currentUser={currentUser}
            media={media}
            rtc={rtc}
          />

          <MeetingControlsBar
            isBn={isBn}
            media={media}
            rtc={rtc}
            chat={chat}
            recorder={recorder}
            isChatLocked={isChatLocked}
            reactionPickerOpen={reactionPickerOpen}
            onToggleAudio={handleToggleAudio}
            onToggleReactionPicker={() => setReactionPickerOpen(prev => !prev)}
            onLeave={onLeave}
          />
        </div>

        {/* 🌟 3. In-Meeting Chat Drawer */}
        <MeetingChatDrawer
          isBn={isBn}
          currentUser={currentUser}
          isMeHost={rtc.isMeHost}
          isChatLocked={isChatLocked}
          chat={chat}
        />
      </div>

      {/* 🌟 4. Participants Management Modal */}
      <ParticipantsModal
        isOpen={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        isBn={isBn}
        currentUser={currentUser}
        media={media}
        rtc={rtc}
        onToggleMyAudio={handleToggleAudio}
      />

      {/* 🌟 5. Unmute Prompt Modal */}
      <UnmutePromptModal
        isOpen={rtc.unmutePrompt.open}
        requestedBy={rtc.unmutePrompt.requestedBy}
        isBn={isBn}
        onAccept={handleUnmuteAccept}
        onDecline={() => rtc.setUnmutePrompt({ open: false, requestedBy: '' })}
      />

      {/* 🌟 6. Fullscreen Image Attachment Lightbox */}
      <MeetingImagePreviewModal
        imageUrl={chat.previewImageModal}
        onClose={() => chat.setPreviewImageModal(null)}
        onDownload={chat.handleDirectFileDownload}
        isBn={isBn}
      />

      {/* 🌟 7. Meeting Recording Preview & Download Modal */}
      <MeetingRecordingModal
        isOpen={recorder.recordingModalOpen}
        onClose={() => recorder.setRecordingModalOpen(false)}
        isBn={isBn}
        meetingTitle={meetingTitle}
        recordedBlobUrl={recorder.recordedBlobUrl}
        formattedDuration={recorder.formattedDuration}
        formattedFileSize={recorder.formattedFileSize}
        onDownload={() => recorder.downloadLocally()}
        onDiscard={recorder.discardRecording}
        isUploading={recorder.isUploading}
        uploadProgress={recorder.uploadProgress}
      />
    </div>
  );
}
