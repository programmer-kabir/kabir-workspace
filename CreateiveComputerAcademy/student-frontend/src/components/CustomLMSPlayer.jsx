import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize,
  FiRotateCcw, FiRotateCw, FiSettings, FiSliders,
  FiSkipBack, FiSkipForward, FiTv
} from 'react-icons/fi';
import { LuPictureInPicture2 } from 'react-icons/lu';

// Helper to extract YouTube video ID
const extractYouTubeId = (url) => {
  if (!url) return null;
  const match = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

// Helper to extract clean Google Drive preview embed URL
const extractDrivePreviewUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.includes('drive.google.com')) return null;

  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  return trimmed;
};

// Format seconds into MM:SS or HH:MM:SS
export const formatTime = (secs) => {
  if (isNaN(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const CustomLMSPlayer = forwardRef(({
  videoUrl,
  title = '',
  watermarkText = 'student@cca.com',
  showWatermark = false,
  onPrev = null,
  onNext = null,
  hasPrev = false,
  hasNext = false,
  onEnded = null,
  onProgressUpdate = null
}, ref) => {
  const containerRef = useRef(null);
  const videoElementRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ top: '25%', left: '70%' });

  const ytId = extractYouTubeId(videoUrl);
  const driveUrl = extractDrivePreviewUrl(videoUrl);
  const isDirectVideo = !ytId && !driveUrl && videoUrl && (videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm') || videoUrl.includes('.mp4?'));

  // 1. Move watermark randomly every 12 seconds for anti-piracy
  useEffect(() => {
    const moveWatermark = () => {
      const top = Math.floor(15 + Math.random() * 65) + '%';
      const left = Math.floor(15 + Math.random() * 65) + '%';
      setWatermarkPos({ top, left });
    };
    const interval = setInterval(moveWatermark, 12000);
    return () => clearInterval(interval);
  }, []);

  const isHoveredRef = useRef(false);
  const playGuardUntilRef = useRef(0);
  const guardTimeoutRef = useRef(null);

  // Trigger 5-second mandatory guard whenever playback starts, resumes, or loads initially
  const triggerPlayGuard = useCallback(() => {
    setShowControls(true);
    playGuardUntilRef.current = Date.now() + 5000;
    if (guardTimeoutRef.current) clearTimeout(guardTimeoutRef.current);
    guardTimeoutRef.current = setTimeout(() => {
      playGuardUntilRef.current = 0;
      // When 5s guard expires, if user is not hovering over the video, hide overlays
      if (!isHoveredRef.current) {
        setShowControls(false);
      }
    }, 5000);
  }, []);

  // Whenever videoUrl changes (initial page load or switching video lessons)
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    triggerPlayGuard();
  }, [videoUrl, triggerPlayGuard]);

  const onEndedRef = useRef(onEnded);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const triggerPlayGuardRef = useRef(triggerPlayGuard);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onProgressUpdateRef.current = onProgressUpdate;
    triggerPlayGuardRef.current = triggerPlayGuard;
  }, [onEnded, onProgressUpdate, triggerPlayGuard]);

  // 2. Load YouTube IFrame API if YT video (Only re-runs when ytId changes!)
  useEffect(() => {
    if (!ytId) return;

    let isMounted = true;
    let pollInterval = null;

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: ytId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            const dur = event.target.getDuration();
            if (dur) setDuration(dur);
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            // 1: Playing
            if (event.data === 1) {
              setIsPlaying(true);
              if (triggerPlayGuardRef.current) triggerPlayGuardRef.current();
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);
            } 
            // 2: Paused
            else if (event.data === 2) {
              setIsPlaying(false);
            } 
            // 0: Ended
            else if (event.data === 0) {
              setIsPlaying(false);
              if (onEndedRef.current) onEndedRef.current();
            }
          }
        }
      });

      // Poll time update from YouTube API
      pollInterval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur > 0) setDuration(dur);
            if (onProgressUpdateRef.current) onProgressUpdateRef.current(cur, dur);
          } catch (err) {}
        }
      }, 500);
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initYT;
    } else {
      initYT();
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
      }
    };
  }, [ytId]);

  // Whenever video starts playing (off to on or unpause):
  useEffect(() => {
    if (isPlaying) {
      triggerPlayGuard();
    } else {
      setShowControls(true);
      playGuardUntilRef.current = 0;
      if (guardTimeoutRef.current) clearTimeout(guardTimeoutRef.current);
    }
  }, [isPlaying, triggerPlayGuard]);

  // Mouse events
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setShowControls(true);
  };

  const handleMouseMove = () => {
    isHoveredRef.current = true;
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    if (isPlaying) {
      const isGuardActive = Date.now() < playGuardUntilRef.current;
      // If 5s play guard is NOT active, instantly hide overlays when mouse leaves
      if (!isGuardActive) {
        setShowControls(false);
      }
    }
  };

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (ytId && ytPlayerRef.current) {
      try {
        const state = typeof ytPlayerRef.current.getPlayerState === 'function' ? ytPlayerRef.current.getPlayerState() : -1;
        // 1 = PLAYING, 3 = BUFFERING
        if (state === 1 || state === 3) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          triggerPlayGuard();
        }
      } catch (err) {
        setIsPlaying(prev => !prev);
      }
    } else if (videoElementRef.current) {
      if (videoElementRef.current.paused) {
        videoElementRef.current.play().catch(() => {});
        setIsPlaying(true);
        triggerPlayGuard();
      } else {
        videoElementRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [ytId, triggerPlayGuard]);

  // Direct Seek to specific seconds (for Timestamp Notes & Q&A clicks)
  const seekToSeconds = useCallback((seconds) => {
    const target = Math.max(0, Math.min(duration || 99999, seconds));
    setCurrentTime(target);
    triggerPlayGuard();
    if (ytId && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(target, true);
    } else if (videoElementRef.current) {
      videoElementRef.current.currentTime = target;
    }
  }, [duration, ytId, triggerPlayGuard]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => seekToSeconds(seconds),
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    togglePlay: () => togglePlay()
  }), [seekToSeconds, currentTime, duration, togglePlay]);

  // Seek (Scrubbing timeline)
  const handleSeek = (e) => {
    const seekTo = parseFloat(e.target.value);
    seekToSeconds(seekTo);
  };

  // Rewind / Fast Forward (Skip 10s)
  const handleSkip = (seconds) => {
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(target);
    triggerPlayGuard();
    if (ytId && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(target, true);
    } else if (videoElementRef.current) {
      videoElementRef.current.currentTime = target;
    }
  };

  // Volume
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (ytId && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(val * 100);
      if (val === 0) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } else if (videoElementRef.current) {
      videoElementRef.current.volume = val;
      videoElementRef.current.muted = val === 0;
    }
  };

  // Mute Toggle
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(volume || 1);
      if (ytId && ytPlayerRef.current) {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume((volume || 1) * 100);
      } else if (videoElementRef.current) {
        videoElementRef.current.muted = false;
      }
    } else {
      setIsMuted(true);
      if (ytId && ytPlayerRef.current) {
        ytPlayerRef.current.mute();
      } else if (videoElementRef.current) {
        videoElementRef.current.muted = true;
      }
    }
  };

  // Playback Rate
  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    setShowSettings(false);
    if (ytId && ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      ytPlayerRef.current.setPlaybackRate(rate);
    } else if (videoElementRef.current) {
      videoElementRef.current.playbackRate = rate;
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (videoElementRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoElementRef.current.requestPictureInPicture();
        }
      } catch (err) {}
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, currentTime, duration]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl overflow-hidden bg-black select-none group transition-all duration-300 shadow-2xl border border-slate-200/80 dark:border-slate-800 ${
        isTheater ? 'w-full aspect-[21/9]' : 'w-full aspect-video'
      }`}
    >
      {/* 1. Video Render Area - Pure 100% Full Frame (Zero Cropping) */}
      {driveUrl ? (
        <iframe
          src={driveUrl}
          title={title}
          className="w-full h-full border-0 object-contain rounded-3xl"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : ytId ? (
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center pointer-events-none">
          <div
            ref={ytContainerRef}
            className="w-full h-full absolute pointer-events-none [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 [&>iframe]:pointer-events-none"
          />
        </div>
      ) : isDirectVideo ? (
        <video
          ref={videoElementRef}
          src={videoUrl}
          autoPlay
          playsInline
          onTimeUpdate={() => {
            if (videoElementRef.current) {
              const cur = videoElementRef.current.currentTime;
              const dur = videoElementRef.current.duration || 0;
              setCurrentTime(cur);
              setDuration(dur);
              handleProgressTick(cur, dur);
              if (onProgressUpdate) onProgressUpdate(cur, dur);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (onEnded) onEnded();
            if (onLessonCompleted) onLessonCompleted(duration, duration);
          }}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />
      ) : (
        <iframe
          src={videoUrl}
          title={title}
          className="w-full h-full border-0 object-contain"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {/* 2. Top Academy Brand Mask (Positioned directly over YouTube's title & icon) */}
      <div
        className={`absolute top-0 inset-x-0 z-20 h-16 bg-gradient-to-b from-black from-40% via-black/85 to-transparent px-3.5 sm:px-5 pt-2 sm:pt-2.5 flex items-start justify-between pointer-events-none transition-all duration-300 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-4 mt-4">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wide truncate max-w-md sm:max-w-xl md:max-w-2xl">
            {title || 'Creative Computer Academy'}
          </span>
        </div>
        <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-indigo-200 bg-indigo-950/90 border border-indigo-500/40 px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-md shrink-0 mt-0.5">
          CCA LMS
        </span>
      </div>

      {/* 3. Floating Anti-Piracy Watermark (Hidden by default) */}
      {showWatermark && (
        <div
          style={{ top: watermarkPos.top, left: watermarkPos.left }}
          className="absolute z-20 pointer-events-none transition-all duration-1000 ease-out font-mono font-bold text-xs sm:text-sm text-red-500/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider select-none px-2 py-0.5 rounded bg-black/20 backdrop-blur-[1px]"
        >
          {watermarkText}
        </div>
      )}

      {/* 4. Click-to-Play Overlay (Softens YouTube pause screen with dark backdrop) */}
      <div
        onClick={togglePlay}
        className={`absolute inset-0 z-10 cursor-pointer flex items-center justify-center transition-all duration-300 ${
          !isPlaying ? 'bg-black/35 backdrop-blur-[1px]' : 'bg-transparent'
        }`}
      >
        {!isPlaying && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform transition-transform hover:scale-110 active:scale-95 border border-white/20">
            <FiPlay size={32} className="ml-1" />
          </div>
        )}
      </div>

      {/* 5. Bottom Custom LMS Controls Bar (Auto-fades out during playback) */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-3 sm:p-5 pt-12 transition-all duration-300 flex flex-col gap-2.5 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Progress Scrubber Bar */}
        <div className="relative group/scrubber flex items-center w-full cursor-pointer h-3">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white transition-all group-hover/scrubber:h-2.5"
            style={{
              background: `linear-gradient(to right, #ffffff ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`
            }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Previous Lesson */}
            <button
              onClick={(e) => { e.stopPropagation(); onPrev && onPrev(); }}
              disabled={!hasPrev}
              className={`p-1.5 hover:text-indigo-400 transition-colors cursor-pointer ${!hasPrev ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Previous Class"
            >
              <FiSkipBack size={18} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
            </button>

            {/* Next Lesson */}
            <button
              onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
              disabled={!hasNext}
              className={`p-1.5 hover:text-indigo-400 transition-colors cursor-pointer ${!hasNext ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Next Class"
            >
              <FiSkipForward size={18} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
              >
                {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hidden sm:inline-block"
              />
            </div>

            {/* Time Stamp Display */}
            <span className="font-mono text-xs sm:text-sm text-slate-200 font-semibold tracking-wider select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Rewind 10s */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
              className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Rewind 10 seconds"
            >
              <FiRotateCcw size={16} />
              <span className="text-[10px] font-bold">10</span>
            </button>

            {/* Forward 10s */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSkip(10); }}
              className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Forward 10 seconds"
            >
              <FiRotateCw size={16} />
              <span className="text-[10px] font-bold">10</span>
            </button>

            {/* Playback Speed Menu */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1"
                title="Playback Speed"
              >
                <span>{playbackRate}x</span>
              </button>

              {showSettings && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full right-0 mb-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-2 shadow-2xl min-w-[120px] text-xs font-bold space-y-1 z-50"
                >
                  <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">Speed</p>
                  {[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                        playbackRate === rate ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <span className="text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            {isDirectVideo && (
              <button
                onClick={(e) => { e.stopPropagation(); togglePiP(); }}
                className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer hidden sm:block"
                title="Picture-in-Picture"
              >
                <LuPictureInPicture2 size={17} />
              </button>
            )}

            {/* Theater Mode */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsTheater(!isTheater); }}
              className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer hidden sm:block"
              title="Theater Mode"
            >
              <FiTv size={17} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="p-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
              title="Fullscreen (f)"
            >
              {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomLMSPlayer;
