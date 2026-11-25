import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const VIRTUAL_BACKGROUND_PRESETS = [
  { id: 'none', type: 'none', labelEn: 'None', labelBn: 'স্বাভাবিক', thumbnail: '🚫' },
  { id: 'blur-light', type: 'blur-light', labelEn: 'Slight Blur', labelBn: 'হালকা ব্লার', thumbnail: '💧' },
  { id: 'blur-heavy', type: 'blur-heavy', labelEn: 'Deep Blur', labelBn: 'ভারি ব্লার', thumbnail: '🌫️' },
  { id: 'cca-office', type: 'image', url: '/backgrounds/cca_executive_office.svg', labelEn: 'CCA Office', labelBn: 'এক্সিকিউটিভ অফিস', thumbnail: '🏛️' },
  { id: 'cca-studio', type: 'image', url: '/backgrounds/cca_cyber_studio.svg', labelEn: 'Cyber Studio', labelBn: 'সাইবার স্টুডিও', thumbnail: '🎬' },
  { id: 'cca-library', type: 'image', url: '/backgrounds/cca_library_class.svg', labelEn: 'Academic Lab', labelBn: 'একাডেমিক ল্যাব', thumbnail: '📚' },
  { id: 'cca-minimal', type: 'image', url: '/backgrounds/cca_minimal_brand.svg', labelEn: 'CCA Minimal', labelBn: 'ব্র্যান্ড মিনিমাল', thumbnail: '💎' },
];

/**
 * Loads MediaPipe SelfieSegmentation with CDN loader and resilient fallback
 */
function loadSelfieSegmentation() {
  if (window.SelfieSegmentation) {
    return Promise.resolve(window.SelfieSegmentation);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.SelfieSegmentation) {
        resolve(window.SelfieSegmentation);
      } else {
        reject(new Error('SelfieSegmentation did not mount to window'));
      }
    };
    script.onerror = () => {
      // Local fallback
      const localScript = document.createElement('script');
      localScript.src = '/mediapipe/selfie_segmentation.js';
      localScript.async = true;
      localScript.onload = () => resolve(window.SelfieSegmentation);
      localScript.onerror = reject;
      document.body.appendChild(localScript);
    };
    document.body.appendChild(script);
  });
}

/**
 * useVirtualBackground Hook
 * High-speed GPU/Canvas background blur & CCA virtual background processor.
 * Intercepts camera stream and broadcasts processed canvas stream to peers.
 */
export function useVirtualBackground({
  isBn,
  localStreamRef,
  localVideoRef,
  localFilmstripVideoRef,
  activeCallsRef,
  isVideoOff,
  setIsVideoOff,
}) {
  const [selectedBgId, setSelectedBgId] = useState(() => {
    return localStorage.getItem('cca_meeting_bg_id') || 'none';
  });
  const [customBgUrl, setCustomBgUrl] = useState(() => {
    return localStorage.getItem('cca_meeting_custom_bg') || null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // Dedicated processing elements
  const offscreenVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const segmenterRef = useRef(null);
  const bgImageElementRef = useRef(null);
  const isProcessingRef = useRef(false);
  const rawCameraStreamRef = useRef(null);
  const originalCamTrackRef = useRef(null);
  const processedTrackRef = useRef(null);

  // Active background URL helper
  const activePreset = VIRTUAL_BACKGROUND_PRESETS.find(p => p.id === selectedBgId);
  const activeBgUrl = activePreset?.type === 'image' ? activePreset.url : (selectedBgId === 'custom' ? customBgUrl : null);

  /**
   * Replace active video track on local elements and active WebRTC calls
   */
  const swapVideoTrack = useCallback((newTrack) => {
    if (!newTrack) return;

    // 1. Update localStreamRef stream's video track
    if (localStreamRef.current) {
      const currentStream = localStreamRef.current;
      const oldTrack = currentStream.getVideoTracks()[0];
      if (oldTrack && oldTrack !== newTrack) {
        currentStream.removeTrack(oldTrack);
        currentStream.addTrack(newTrack);
      }
    }

    // 2. Update local video elements (force Chromium HTMLMediaElement re-bind)
    if (localVideoRef?.current && localStreamRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
    if (localFilmstripVideoRef?.current && localStreamRef.current) {
      localFilmstripVideoRef.current.srcObject = null;
      localFilmstripVideoRef.current.srcObject = localStreamRef.current;
      localFilmstripVideoRef.current.play().catch(() => {});
    }

    // 3. Broadcast to all connected remote peers via RTCRtpSender.replaceTrack
    if (activeCallsRef?.current) {
      Object.values(activeCallsRef.current).forEach(call => {
        const sender = call.peerConnection?.getSenders()?.find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newTrack).catch(err => {
            console.warn('[VirtualBG] Failed to replaceTrack on peer call:', err);
          });
        }
      });
    }
  }, [localStreamRef, localVideoRef, localFilmstripVideoRef, activeCallsRef]);

  /**
   * Stops background processing loop and restores original camera track
   */
  const stopProcessing = useCallback(() => {
    isProcessingRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    // Revert to original camera track
    if (originalCamTrackRef.current) {
      swapVideoTrack(originalCamTrackRef.current);
    }
  }, [swapVideoTrack]);

  /**
   * Starts background segmentation and compositing loop
   */
  const startProcessing = useCallback(async (bgId, customUrl) => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    const preset = VIRTUAL_BACKGROUND_PRESETS.find(p => p.id === bgId);
    if (!preset && bgId !== 'custom') {
      stopProcessing();
      return;
    }
    if (bgId === 'none') {
      stopProcessing();
      return;
    }

    // Ensure raw camera stream exists
    if (!localStreamRef.current) {
      toast.error(isBn ? 'ক্যামেরা চালু নেই।' : 'Camera is not active.');
      return;
    }

    let rawCamTrack = localStreamRef.current.getVideoTracks()[0];

    // Check if current track is fallback and attempt to acquire real webcam
    const isFallback = !rawCamTrack || rawCamTrack._isFallback || !originalCamTrackRef.current || originalCamTrackRef.current._isFallback;
    if (isFallback && navigator.mediaDevices?.getUserMedia) {
      try {
        const realCamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const realTrack = realCamStream.getVideoTracks()[0];
        if (realTrack) {
          rawCamTrack = realTrack;
          originalCamTrackRef.current = realTrack;
          if (localStreamRef.current) {
            const oldT = localStreamRef.current.getVideoTracks()[0];
            if (oldT && oldT !== realTrack) localStreamRef.current.removeTrack(oldT);
            localStreamRef.current.addTrack(realTrack);
          }
        }
      } catch (camErr) {
        console.warn('[VirtualBG] Real camera acquisition failed or busy:', camErr);
        if (camErr.name === 'NotReadableError' || camErr.name === 'TrackStartError') {
          toast.warning(isBn
            ? '⚠️ ক্যামেরা অন্য ট্যাবে (যেমন Staff Portal) চালু আছে। অন্য ট্যাবের ক্যামেরা বন্ধ করুন।'
            : '⚠️ Camera is busy in another tab. Please stop camera in that tab.');
        }
      }
    }

    if (!rawCamTrack) {
      toast.error(isBn ? 'ভিডিও ট্র্যাক পাওয়া যায়নি।' : 'No video track found.');
      return;
    }

    // Store original camera track reference if not already stored
    if (!originalCamTrackRef.current || originalCamTrackRef.current.readyState === 'ended') {
      originalCamTrackRef.current = rawCamTrack;
    }

    // Auto-enable camera track & state if currently off
    if (rawCamTrack && !rawCamTrack.enabled) {
      rawCamTrack.enabled = true;
    }
    if (originalCamTrackRef.current && !originalCamTrackRef.current.enabled) {
      originalCamTrackRef.current.enabled = true;
    }
    if (setIsVideoOff) {
      setIsVideoOff(false);
    }

    setIsLoadingModel(true);

    try {
      // 1. Preload target background image if applicable
      const targetPreset = VIRTUAL_BACKGROUND_PRESETS.find(p => p.id === bgId);
      const targetUrl = targetPreset?.type === 'image' ? targetPreset.url : (bgId === 'custom' ? customUrl : null);
      if (targetUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = targetUrl;
        await new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });
        bgImageElementRef.current = img;
      } else {
        bgImageElementRef.current = null;
      }

      // 2. Initialize SelfieSegmentation model
      if (!segmenterRef.current) {
        const SelfieSegClass = await loadSelfieSegmentation();
        const segmenter = new SelfieSegClass({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });
        segmenter.setOptions({
          modelSelection: 1, // 1 for landscape orientation (ideal for webcam/laptops)
          selfieMode: false,
        });

        segmenterRef.current = segmenter;
      }

      // 3. Create dedicated raw camera stream for offscreen video (prevents recursive canvas feedback)
      rawCameraStreamRef.current = new MediaStream([originalCamTrackRef.current]);

      // 4. Create offscreen video element for frame reading
      if (!offscreenVideoRef.current) {
        const v = document.createElement('video');
        v.autoplay = true;
        v.playsInline = true;
        v.muted = true;
        v.style.position = 'fixed';
        v.style.top = '-9999px';
        v.style.left = '-9999px';
        v.style.width = '640px';
        v.style.height = '360px';
        v.style.opacity = '0';
        v.style.pointerEvents = 'none';
        document.body.appendChild(v);
        offscreenVideoRef.current = v;
      }

      const v = offscreenVideoRef.current;
      v.srcObject = rawCameraStreamRef.current;
      await v.play().catch(() => {});

      // 5. Create canvas for composited output matching camera aspect ratio
      if (!canvasRef.current) {
        const c = document.createElement('canvas');
        canvasRef.current = c;
      }
      const canvas = canvasRef.current;
      const targetWidth = v.videoWidth || 1280;
      const targetHeight = v.videoHeight || 720;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d', { alpha: false });

      // Immediately paint the chosen background onto canvas so user sees it right away!
      if (bgImageElementRef.current && ctx) {
        ctx.drawImage(bgImageElementRef.current, 0, 0, targetWidth, targetHeight);
      } else if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // 6. Configure MediaPipe onResults callback
      segmenterRef.current.onResults((results) => {
        if (!isProcessingRef.current || !ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        const currentPreset = VIRTUAL_BACKGROUND_PRESETS.find(p => p.id === bgId);
        const hasBgImage = (currentPreset?.type === 'image' || bgId === 'custom') && bgImageElementRef.current;

        // Step A: Draw segmentation mask
        ctx.drawImage(results.segmentationMask, 0, 0, w, h);

        // Step B: Clip out person (foreground)
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(results.image, 0, 0, w, h);

        // Step C: Draw background behind person
        ctx.globalCompositeOperation = 'destination-over';

        if (bgId === 'blur-light') {
          ctx.filter = 'blur(7px)';
          ctx.drawImage(results.image, 0, 0, w, h);
          ctx.filter = 'none';
        } else if (bgId === 'blur-heavy') {
          ctx.filter = 'blur(18px)';
          ctx.drawImage(results.image, 0, 0, w, h);
          ctx.filter = 'none';
        } else if (hasBgImage) {
          ctx.drawImage(bgImageElementRef.current, 0, 0, w, h);
        } else {
          // Dark fallback gradient
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      });

      // 7. Generate processed canvas stream
      const processedStream = canvas.captureStream(30);
      const newVideoTrack = processedStream.getVideoTracks()[0];
      processedTrackRef.current = newVideoTrack;

      // 8. Start the continuous frame delivery loop
      isProcessingRef.current = true;
      const processFrame = async () => {
        if (!isProcessingRef.current) return;
        if (v && segmenterRef.current) {
          if (v.readyState >= 2 || v.videoWidth > 0) {
            await segmenterRef.current.send({ image: v }).catch(() => {});
          } else if (bgImageElementRef.current && ctx) {
            ctx.drawImage(bgImageElementRef.current, 0, 0, canvas.width, canvas.height);
          }
        }
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      };
      animFrameIdRef.current = requestAnimationFrame(processFrame);

      // 9. Swap the video track across the room
      swapVideoTrack(newVideoTrack);
      setIsLoadingModel(false);

      toast.success(isBn ? '🖼️ ব্যাকগ্রাউন্ড সফলভাবে সক্রিয় হয়েছে!' : '🖼️ Virtual background applied successfully!');
    } catch (err) {
      console.error('[VirtualBG] Initialization error:', err);
      setIsLoadingModel(false);
      stopProcessing();
      toast.error(isBn ? 'ব্যাকগ্রাউন্ড লোড করতে সমস্যা হয়েছে।' : 'Failed to apply virtual background.');
    }
  }, [isBn, localStreamRef, swapVideoTrack, stopProcessing, setIsVideoOff]);

  /**
   * Apply Background Selection
   */
  const applyBackground = useCallback((bgId, customUrl = null) => {
    setSelectedBgId(bgId);
    localStorage.setItem('cca_meeting_bg_id', bgId);
    if (customUrl) {
      setCustomBgUrl(customUrl);
      localStorage.setItem('cca_meeting_custom_bg', customUrl);
    }

    if (bgId === 'none') {
      stopProcessing();
      toast.info(isBn ? 'স্বাভাবিক ব্যাকগ্রাউন্ড সক্রিয়।' : 'Default background restored.');
    } else {
      // Auto-enable camera if currently turned off so user immediately sees effect
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = true; });
      }
      if (originalCamTrackRef.current) {
        originalCamTrackRef.current.enabled = true;
      }
      if (setIsVideoOff) {
        setIsVideoOff(false);
      }
      startProcessing(bgId, customUrl);
    }
  }, [isBn, localStreamRef, setIsVideoOff, startProcessing, stopProcessing]);

  // Restore saved background from localStorage upon camera readiness
  useEffect(() => {
    const savedBgId = localStorage.getItem('cca_meeting_bg_id');
    const savedCustomUrl = localStorage.getItem('cca_meeting_custom_bg');
    if (
      savedBgId &&
      savedBgId !== 'none' &&
      localStreamRef?.current?.getVideoTracks()?.length > 0 &&
      !isProcessingRef.current
    ) {
      const timer = setTimeout(() => {
        startProcessing(savedBgId, savedCustomUrl);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [localStreamRef.current, startProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (offscreenVideoRef.current) {
        offscreenVideoRef.current.srcObject = null;
        offscreenVideoRef.current.remove();
        offscreenVideoRef.current = null;
      }
      if (segmenterRef.current) {
        segmenterRef.current.close?.();
        segmenterRef.current = null;
      }
    };
  }, []);

  return {
    selectedBgId,
    customBgUrl,
    activeBgUrl,
    isModalOpen,
    setIsModalOpen,
    isLoadingModel,
    applyBackground,
    presets: VIRTUAL_BACKGROUND_PRESETS,
  };
}
