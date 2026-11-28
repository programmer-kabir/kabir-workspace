import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Loader2,
  Film,
  Video,
  Sliders,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ScriptMetadata } from '../types/pywebview';
import { studioApi } from '../services/api';

interface TimelinePreviewProps {
  metadata: ScriptMetadata;
}

type PreviewMode = 'video' | 'frames';

export default function TimelinePreview({ metadata }: TimelinePreviewProps) {
  const duration = metadata.duration || 4.0;
  const fps = metadata.fps || 30.0;
  const totalFrames = metadata.frames || Math.round(duration * fps);

  const [mode, setMode] = useState<PreviewMode>('video');

  // Video Preview State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoRenderTime, setVideoRenderTime] = useState<number | null>(null);

  // Frame Scrubber State
  const [currentTime, setCurrentTime] = useState<number>(0.0);
  const [isPlayingFrames, setIsPlayingFrames] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoadingFrame, setIsLoadingFrame] = useState<boolean>(false);
  const [frameCache] = useState<Map<number, string>>(() => new Map());

  const activeScrubReqRef = useRef<number>(0);

  // Current frame index (0-based)
  const currentFrame = Math.min(
    totalFrames - 1,
    Math.max(0, Math.round(currentTime * fps))
  );

  // Format seconds to MM:SS.mmm
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

  // ── Fetch Single Frame (for Scrubbing / Poster) ───────────────────────────
  const fetchScrubFrame = useCallback(
    async (time: number) => {
      if (!metadata.script_path) return;

      const frameIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(time * fps))
      );

      if (frameCache.has(frameIndex)) {
        setPreviewImage(frameCache.get(frameIndex)!);
        return;
      }

      const reqId = ++activeScrubReqRef.current;
      setIsLoadingFrame(true);

      try {
        const res = await studioApi.render_preview_frame(
          metadata.script_path,
          time,
          960
        );

        if (reqId === activeScrubReqRef.current && res.success && res.data_url) {
          setPreviewImage(res.data_url);
          frameCache.set(frameIndex, res.data_url);
        }
      } catch (err) {
        console.error('Frame preview error:', err);
      } finally {
        if (reqId === activeScrubReqRef.current) {
          setIsLoadingFrame(false);
        }
      }
    },
    [metadata.script_path, fps, totalFrames, frameCache]
  );

  // ── Generate Draft Preview Video ──────────────────────────────────────────
  const generateVideoPreview = useCallback(async (scriptPath: string) => {
    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoUrl(null);
    setVideoRenderTime(null);

    try {
      const res = await studioApi.render_preview_video(scriptPath, 640);
      if (res.success && res.video_url) {
        // Bust browser cache with timestamp if re-rendered
        setVideoUrl(`${res.video_url}?t=${Date.now()}`);
        if (res.elapsed_seconds !== undefined) {
          setVideoRenderTime(res.elapsed_seconds);
        }
      } else {
        setVideoError(res.error || 'Could not generate video preview.');
      }
    } catch (err: any) {
      setVideoError(err?.message || 'Failed to generate video preview.');
    } finally {
      setIsGeneratingVideo(false);
    }
  }, []);

  // ── Load Initial Frame + Auto-Generate Video on Script Change ─────────────
  useEffect(() => {
    if (!metadata.script_path) return;

    frameCache.clear();
    setCurrentTime(0.0);
    setIsPlayingFrames(false);
    setPreviewImage(null);

    // 1. Show Frame 0 right away as poster
    fetchScrubFrame(0.0);
    // 2. Render fast draft MP4 preview automatically
    generateVideoPreview(metadata.script_path);
  }, [metadata.script_path, fetchScrubFrame, generateVideoPreview, frameCache]);

  // ── Fixed Sequential Async Playback Loop (Frame Scrubber Mode) ────────────
  useEffect(() => {
    if (mode !== 'frames' || !isPlayingFrames || !metadata.script_path) {
      return;
    }

    let cancelled = false;
    let frameIdx = Math.min(totalFrames - 1, Math.max(0, Math.round(currentTime * fps)));
    const scriptPath = metadata.script_path;

    const runLoop = async () => {
      while (!cancelled) {
        const tickStart = performance.now();
        const t = frameIdx / fps;
        setCurrentTime(t);

        if (frameCache.has(frameIdx)) {
          setPreviewImage(frameCache.get(frameIdx)!);
        } else {
          try {
            const res = await studioApi.render_preview_frame(scriptPath, t, 960);
            if (cancelled) break;
            if (res.success && res.data_url) {
              frameCache.set(frameIdx, res.data_url);
              setPreviewImage(res.data_url);
            }
          } catch (err) {
            console.error('Playback frame error:', err);
          }
        }

        if (cancelled) break;
        frameIdx = (frameIdx + 1) % totalFrames;

        const elapsed = performance.now() - tickStart;
        const targetMs = 1000 / fps;
        const waitMs = Math.max(12, targetMs - elapsed);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    };

    runLoop();

    return () => {
      cancelled = true;
    };
  }, [mode, isPlayingFrames, metadata.script_path, fps, totalFrames, frameCache]);

  // ── Scrubbing Handlers ────────────────────────────────────────────────────
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPlayingFrames) setIsPlayingFrames(false);
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    fetchScrubFrame(newTime);
  };

  const handleStepFrame = (deltaFrames: number) => {
    if (isPlayingFrames) setIsPlayingFrames(false);
    const newFrame = Math.max(0, Math.min(totalFrames - 1, currentFrame + deltaFrames));
    const newTime = newFrame / fps;
    setCurrentTime(newTime);
    fetchScrubFrame(newTime);
  };

  const handleReset = () => {
    if (isPlayingFrames) setIsPlayingFrames(false);
    setCurrentTime(0.0);
    fetchScrubFrame(0.0);
  };

  const jumpToPercent = (pct: number) => {
    if (isPlayingFrames) setIsPlayingFrames(false);
    const newTime = duration * pct;
    setCurrentTime(newTime);
    fetchScrubFrame(newTime);
  };

  const handleModeSwitch = (newMode: PreviewMode) => {
    if (newMode !== 'frames') {
      setIsPlayingFrames(false);
    }
    setMode(newMode);
  };

  return (
    <div className="rounded-2xl border border-surface-50 bg-surface-200/90 p-5 shadow-2xl backdrop-blur">
      {/* Canvas Top Bar with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-50 text-xs">
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="inline-flex rounded-lg border border-surface-50 bg-surface-300/80 p-0.5">
            <button
              onClick={() => handleModeSwitch('video')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === 'video'
                  ? 'bg-accent text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Video Preview</span>
            </button>
            <button
              onClick={() => handleModeSwitch('frames')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === 'frames'
                  ? 'bg-accent text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Frame Scrubber</span>
            </button>
          </div>

          {mode === 'video' && isGeneratingVideo && (
            <span className="flex items-center gap-1.5 text-[11px] text-accent animate-pulse ml-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Rendering draft video...
            </span>
          )}

          {mode === 'frames' && isLoadingFrame && (
            <span className="flex items-center gap-1 text-[11px] text-accent animate-pulse ml-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Rendering Frame...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'video' && videoUrl && (
            <button
              onClick={() => metadata.script_path && generateVideoPreview(metadata.script_path)}
              disabled={isGeneratingVideo}
              title="Re-render video preview"
              className="flex items-center gap-1 rounded border border-surface-50 bg-surface-300 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-surface-50 transition"
            >
              <RefreshCw className={`h-3 w-3 ${isGeneratingVideo ? 'animate-spin' : ''}`} />
              <span>Reload</span>
            </button>
          )}
          <span className="rounded bg-surface-300 px-2 py-0.5 text-[11px] font-mono text-slate-300">
            {metadata.width}×{metadata.height}
          </span>
          <span className="rounded bg-accent/15 px-2 py-0.5 text-[11px] font-mono text-accent font-semibold">
            {fps} FPS
          </span>
        </div>
      </div>

      {/* ── VIDEO PREVIEW MODE ── */}
      {mode === 'video' && (
        <div className="mt-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-surface-50/80 bg-slate-950 shadow-inner flex items-center justify-center">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                poster={previewImage || undefined}
                controls
                autoPlay
                loop
                playsInline
                className="h-full w-full object-contain bg-black"
              />
            ) : videoError ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-xs text-red-300 font-mono max-w-md">{videoError}</p>
                <button
                  onClick={() => metadata.script_path && generateVideoPreview(metadata.script_path)}
                  className="mt-2 rounded-lg bg-surface-100 px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-50 transition"
                >
                  Retry Video Preview
                </button>
              </div>
            ) : (
              <>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Initial frame poster"
                    className="h-full w-full object-contain opacity-45 blur-[1px]"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/50 backdrop-blur-[2px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-accent/40 shadow-lg shadow-accent/20">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-100">Generating Live Video Preview...</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Encoding fast draft MP4 ({totalFrames} frames @ {fps}fps)
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-accent" />
              Fast 360p Draft Preview (Full 4K/1080p quality will be used in final render)
            </span>
            {videoRenderTime !== null && (
              <span className="font-mono text-emerald-400">
                Generated in {videoRenderTime}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── FRAME SCRUBBER MODE ── */}
      {mode === 'frames' && (
        <>
          <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border border-surface-50/80 bg-slate-950 shadow-inner flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {previewImage ? (
              <img
                src={previewImage}
                alt="Rendered animation frame"
                className="h-full w-full object-contain pointer-events-none"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <span className="text-xs">Generating Frame...</span>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-slate-950/75 px-2.5 py-1 backdrop-blur border border-white/10 text-[11px] font-mono text-slate-300">
              <span className={`h-2 w-2 rounded-full ${isPlayingFrames ? 'bg-accent animate-ping' : 'bg-emerald-400'}`} />
              <span>t = {currentTime.toFixed(3)}s</span>
            </div>

            <div className="absolute top-3 right-3 rounded-lg bg-slate-950/75 px-2.5 py-1 backdrop-blur border border-white/10 text-[11px] font-mono text-slate-300">
              Frame {currentFrame + 1} / {totalFrames}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration}
                step={1 / fps}
                value={currentTime}
                onChange={handleSliderChange}
                className="w-full h-2.5 bg-surface-300 rounded-lg appearance-none cursor-pointer accent-accent transition-all hover:bg-surface-50"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  title="Reset to Start (0s)"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-50 bg-surface-100 text-slate-300 hover:text-white hover:bg-surface-50 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => handleStepFrame(-1)}
                  title="Step Back 1 Frame"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-50 bg-surface-100 text-slate-300 hover:text-white hover:bg-surface-50 transition"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => setIsPlayingFrames(!isPlayingFrames)}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-slate-950 font-bold hover:bg-accent-hover transition shadow-sm shadow-accent/20"
                >
                  {isPlayingFrames ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" />
                      <span className="text-xs">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span className="text-xs">Play Frames</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleStepFrame(1)}
                  title="Step Forward 1 Frame"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-50 bg-surface-100 text-slate-300 hover:text-white hover:bg-surface-50 transition"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1">
                {[0, 0.25, 0.5, 0.75, 1.0].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => jumpToPercent(pct)}
                    className="rounded border border-surface-50 bg-surface-300/80 px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition"
                  >
                    {pct === 0 ? '0%' : pct === 1.0 ? '100%' : `${pct * 100}%`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-surface-300/60 px-3 py-1.5 border border-surface-50 text-xs font-mono">
                <span className="text-accent font-semibold">{formatTime(currentTime)}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
