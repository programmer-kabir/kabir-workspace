import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { createFallbackStream } from '../meetingUtils';

/**
 * useMeetingMedia
 * Handles hardware camera & microphone acquisition, track toggles,
 * audio oscillators / chimes, and Zoom-style screen sharing.
 */
export function useMeetingMedia({ isBn }) {
  const localVideoRef = useRef(null);
  const localFilmstripVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);

  // 1. Chime: Spotlight Fanfare
  const playSpotlightChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, []);

  // 2. Chime: Subtle Tactile Reaction Pop
  const playReactionSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }, []);

  // 3. Chime: Hand Raise Notification
  const playHandRaiseChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }, []);

  // 4. Toggle Microphone
  const toggleAudio = useCallback((forceState, broadcastMicState) => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextEnabled = typeof forceState === 'boolean' ? forceState : !audioTrack.enabled;
      audioTrack.enabled = nextEnabled;
      const nextMuted = !nextEnabled;
      setIsMuted(nextMuted);

      if (typeof broadcastMicState === 'function') {
        broadcastMicState(nextMuted);
      }
    }
  }, []);

  // 5. Toggle Camera
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  }, []);

  // 6. Screen Share (Zoom Style)
  const toggleScreenShare = useCallback(async (activeCallsRef) => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track in all active peer connections
        if (activeCallsRef?.current) {
          Object.values(activeCallsRef.current).forEach(call => {
            const sender = call.peerConnection?.getSenders()?.find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
          });
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          revertToCamera(activeCallsRef);
        };

        setIsScreenSharing(true);
        toast.success(isBn ? '🖥️ আপনি স্ক্রিন শেয়ার করছেন' : '🖥️ You are now sharing your screen');
      } else {
        revertToCamera(activeCallsRef);
      }
    } catch (err) {
      console.warn('Screen share canceled or failed:', err);
    }
  }, [isBn, isScreenSharing]);

  // 7. Revert back to Camera
  const revertToCamera = useCallback((activeCallsRef) => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack && activeCallsRef?.current) {
      Object.values(activeCallsRef.current).forEach(call => {
        const sender = call.peerConnection?.getSenders()?.find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
    toast.info(isBn ? 'স্ক্রিন শেয়ার বন্ধ হয়েছে।' : 'Screen share stopped. Switched back to camera.');
  }, [isBn]);

  return {
    localVideoRef,
    localFilmstripVideoRef,
    localStreamRef,
    isMuted,
    setIsMuted,
    isVideoOff,
    setIsVideoOff,
    isScreenSharing,
    setIsScreenSharing,
    loadingMedia,
    setLoadingMedia,
    playSpotlightChime,
    playReactionSound,
    playHandRaiseChime,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    revertToCamera,
  };
}
