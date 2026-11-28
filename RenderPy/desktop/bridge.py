"""
desktop/bridge.py
=================
Engine Adapter / Bridge layer connecting RenderPy engine (core/) to modern UI frontends.

Responsibilities:
  - Inspect animation scripts and extract metadata (resolution, fps, duration, frames).
  - Fast, cached timeline scrubbing frame generation (base64 PNG with optional downscaling).
  - Background rendering thread with live progress event callbacks.
  - Job cancellation and resource cleanup.
  - System diagnostics (FFmpeg detection, supported formats/codecs).
"""
from __future__ import annotations

import base64
import hashlib
import io
import os
import sys
import tempfile
import threading
import time
from collections import deque
from dataclasses import asdict, dataclass, field
from typing import Any, Callable, Dict, List, Optional

import cairo

from core.config import find_config_file, load_project_settings
from core.loader import ContractError, LoadedScript, ScriptLoadError, ScriptLoader
from core.pipeline import (
    FFmpegNotFoundError,
    FFmpegPipeline,
    PipelineError,
    RenderConfig,
    SUPPORTED_CODECS,
    SUPPORTED_FORMATS,
    create_pipeline,
)
from core.progress import ProgressReporter, RenderResult
from core.renderer import FrameRenderer, normalize_surface
from core.validator import PreflightValidator


# ── Bridge Progress Reporter ──────────────────────────────────────────────────

class BridgeProgressReporter:
    """Implements ProgressReporter protocol, routing events to a thread-safe callback."""

    _ROLLING_WINDOW = 10

    def __init__(self, callback: Optional[Callable[[str, Dict[str, Any]], None]] = None) -> None:
        self.callback = callback
        self._total = 0
        self._start_time = 0.0
        self._recent_times: deque[float] = deque(maxlen=self._ROLLING_WINDOW)

    def _emit(self, event_type: str, data: Dict[str, Any]) -> None:
        if self.callback:
            try:
                self.callback(event_type, data)
            except Exception:
                pass

    def start(self, total: int, summary: str, output_path: str) -> None:
        self._total = total
        self._start_time = time.monotonic()
        self._emit("start", {
            "total_frames": total,
            "summary": summary,
            "output_path": output_path,
        })

    def update(self, frame_index: int, frame_time_s: float) -> None:
        now = time.monotonic()
        elapsed = now - self._start_time
        self._recent_times.append(frame_time_s)
        avg_frame = sum(self._recent_times) / len(self._recent_times) if self._recent_times else 0.0
        remaining = max(0, self._total - frame_index - 1)
        eta = avg_frame * remaining
        fps = 1.0 / avg_frame if avg_frame > 0 else 0.0
        done = frame_index + 1
        pct = (done / self._total * 100.0) if self._total > 0 else 0.0

        self._emit("progress", {
            "frame": done,
            "total_frames": self._total,
            "percent": round(pct, 1),
            "elapsed_seconds": round(elapsed, 1),
            "eta_seconds": round(eta, 1),
            "fps": round(fps, 1),
        })

    def frame_error(self, frame_index: int, exc: Exception) -> None:
        self._emit("frame_error", {
            "frame": frame_index,
            "error": str(exc),
            "error_type": type(exc).__name__,
        })

    def finish(self, result: RenderResult) -> None:
        self._emit("finish", {
            "frames_rendered": result.frames_rendered,
            "frames_errored": result.frames_errored,
            "elapsed_seconds": round(result.elapsed_seconds, 2),
            "output_path": result.output_path,
            "cancelled": result.cancelled,
            "output_size_bytes": result.output_size_bytes,
        })

    def info(self, message: str) -> None:
        self._emit("info", {"message": message})

    def error(self, message: str) -> None:
        self._emit("error", {"message": message})


# ── Active Render Job ─────────────────────────────────────────────────────────

class RenderJob:
    """Manages an active render operation in a worker thread."""

    def __init__(
        self,
        config: RenderConfig,
        script: LoadedScript,
        on_event: Optional[Callable[[str, Dict[str, Any]], None]] = None,
    ) -> None:
        self.config = config
        self.script = script
        self.on_event = on_event
        self.cancel_event = threading.Event()
        self.thread: Optional[threading.Thread] = None
        self.result: Optional[RenderResult] = None
        self.error: Optional[str] = None
        self.is_running = False

    def start(self) -> None:
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def cancel(self) -> None:
        self.cancel_event.set()

    def _run(self) -> None:
        reporter = BridgeProgressReporter(self.on_event)
        renderer = FrameRenderer()
        pipeline = None
        try:
            pipeline = create_pipeline(self.config)
            pipeline.open()
            self.result = renderer.render_all(
                script=self.script,
                pipeline=pipeline,
                config=self.config,
                progress=reporter,
                cancel_evt=self.cancel_event,
            )
            # Query output file size if completed
            if self.result and os.path.isfile(self.result.output_path):
                self.result.output_size_bytes = os.path.getsize(self.result.output_path)
            reporter.finish(self.result)
        except Exception as exc:
            self.error = str(exc)
            reporter.error(str(exc))
        finally:
            if pipeline:
                try:
                    pipeline.close()
                except Exception:
                    pass
            self.is_running = False


# ── Bridge API ────────────────────────────────────────────────────────────────

class RenderPyBridge:
    """
    Main interface exposed to Desktop UI / Webview JS runtime.
    Thread-safe and decoupled from CLI stdout/stderr.
    """

    def __init__(self) -> None:
        self._loader = ScriptLoader()
        self._cached_script_path: Optional[str] = None
        self._cached_script: Optional[LoadedScript] = None
        self._cached_mtime: float = 0.0
        self._lock = threading.Lock()
        self._active_job: Optional[RenderJob] = None

    def _resolve_ffmpeg_path(self, script_path: Optional[str] = None, explicit_path: Optional[str] = None) -> str:
        """Resolve FFmpeg binary path from explicit override, config file, or system PATH."""
        if explicit_path and os.path.isfile(explicit_path):
            return explicit_path

        cfg_file = find_config_file(script_path=script_path)
        settings = load_project_settings(cfg_file)
        target = explicit_path or settings.ffmpeg_path

        try:
            return FFmpegPipeline.detect_ffmpeg(target)
        except FFmpegNotFoundError:
            # Fallback check for common local ffmpeg paths if on Windows
            fallback_candidates = [
                r"C:\Users\CCA\Desktop\downloader\server\node_modules\ffmpeg-static\ffmpeg.exe",
            ]
            for cand in fallback_candidates:
                if os.path.isfile(cand):
                    return cand
            raise

    def get_system_info(self) -> Dict[str, Any]:
        """Detect FFmpeg and supported rendering capabilities."""
        ffmpeg_found = False
        ffmpeg_version = "Not found"
        ffmpeg_path = ""

        try:
            path = self._resolve_ffmpeg_path()
            ver = FFmpegPipeline.get_ffmpeg_version(path)
            ffmpeg_found = True
            ffmpeg_path = path
            ffmpeg_version = ver
        except FFmpegNotFoundError:
            pass

        return {
            "ffmpeg_installed": ffmpeg_found,
            "ffmpeg_version": ffmpeg_version,
            "ffmpeg_path": ffmpeg_path,
            "supported_codecs": list(SUPPORTED_CODECS),
            "supported_formats": list(SUPPORTED_FORMATS),
            "cpu_cores": os.cpu_count() or 1,
        }

    def inspect_script(
        self,
        script_path: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        fps: Optional[float] = None,
        duration: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Load and extract metadata from an animation script."""
        abs_path = os.path.abspath(script_path)
        if not os.path.isfile(abs_path):
            return {
                "success": False,
                "error": f"File does not exist: {script_path}",
                "error_type": "FileNotFoundError",
            }

        try:
            script = self._loader.load(
                abs_path,
                width_override=width,
                height_override=height,
                fps_override=fps,
                duration_override=duration,
            )
            with self._lock:
                self._cached_script_path = abs_path
                self._cached_script = script
                self._cached_mtime = os.path.getmtime(abs_path)

            return {
                "success": True,
                "script_path": abs_path,
                "filename": os.path.basename(abs_path),
                "width": script.width,
                "height": script.height,
                "fps": script.fps,
                "duration": round(script.duration, 3),
                "frames": script.frames,
                "audio": script.audio,
                "summary": script.summary(),
            }
        except (ScriptLoadError, ContractError, Exception) as exc:
            return {
                "success": False,
                "error": str(exc),
                "error_type": type(exc).__name__,
            }

    def _get_or_load_script(self, script_path: str) -> LoadedScript:
        abs_path = os.path.abspath(script_path)
        current_mtime = os.path.getmtime(abs_path) if os.path.isfile(abs_path) else 0.0

        with self._lock:
            if (
                self._cached_script is not None
                and self._cached_script_path == abs_path
                and self._cached_mtime == current_mtime
            ):
                return self._cached_script

        script = self._loader.load(abs_path)
        with self._lock:
            self._cached_script_path = abs_path
            self._cached_script = script
            self._cached_mtime = current_mtime
        return script

    def render_preview_frame(
        self,
        script_path: str,
        timestamp: float,
        max_width: int = 1280,
    ) -> Dict[str, Any]:
        """
        Renders a single frame at timestamp t and returns a base64 Data URI.
        Scales down if larger than max_width for high UI responsiveness.
        """
        try:
            script = self._get_or_load_script(script_path)
            t_clamped = max(0.0, min(float(timestamp), script.duration))

            # 1. Generate surface from animation script
            raw_surf = script.render_fn(t_clamped)
            surf = normalize_surface(raw_surf, script.width, script.height)

            # 2. Downscale for preview if needed
            out_w = script.width
            out_h = script.height

            if max_width and out_w > max_width:
                scale = max_width / out_w
                preview_w = int(out_w * scale)
                preview_h = int(out_h * scale)
                thumb_surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, preview_w, preview_h)
                cr = cairo.Context(thumb_surf)
                cr.scale(scale, scale)
                cr.set_source_surface(surf, 0, 0)
                cr.get_source().set_filter(cairo.FILTER_BILINEAR)
                cr.paint()
                target_surf = thumb_surf
                final_w, final_h = preview_w, preview_h
            else:
                target_surf = surf
                final_w, final_h = out_w, out_h

            # 3. Write to in-memory PNG buffer
            buf = io.BytesIO()
            target_surf.write_to_png(buf)
            png_bytes = buf.getvalue()
            b64_str = base64.b64encode(png_bytes).decode("ascii")

            return {
                "success": True,
                "timestamp": t_clamped,
                "width": final_w,
                "height": final_h,
                "data_url": f"data:image/png;base64,{b64_str}",
            }
        except Exception as exc:
            return {
                "success": False,
                "error": str(exc),
                "error_type": type(exc).__name__,
            }

    def start_render(
        self,
        options: Dict[str, Any],
        on_event: Optional[Callable[[str, Dict[str, Any]], None]] = None,
    ) -> Dict[str, Any]:
        """
        Validates settings and launches a background render job.
        `on_event` receives ('start' | 'progress' | 'frame_error' | 'finish' | 'error', data).
        """
        with self._lock:
            if self._active_job and self._active_job.is_running:
                return {
                    "success": False,
                    "error": "A render job is already running.",
                }

        script_path = options.get("script_path", "")
        if not script_path or not os.path.isfile(script_path):
            return {
                "success": False,
                "error": f"Invalid script path: {script_path}",
            }

        try:
            script = self._loader.load(
                script_path,
                width_override=options.get("width"),
                height_override=options.get("height"),
                fps_override=options.get("fps"),
                duration_override=options.get("duration"),
            )

            output_format = options.get("output_format", "mp4").lower()
            codec = options.get("codec")
            if not codec:
                if output_format == "webm":
                    codec = "libvpx-vp9"
                elif output_format == "mov":
                    codec = "prores_ks"
                else:
                    codec = "libx264"

            # Resolve default output path if not specified
            output_path = options.get("output_path")
            if not output_path:
                stem = os.path.splitext(os.path.basename(script_path))[0]
                folder = os.path.dirname(os.path.abspath(script_path))
                if output_format == "png":
                    output_path = os.path.join(folder, f"{stem}_frames")
                else:
                    output_path = os.path.join(
                        folder,
                        f"{stem}_{script.width}x{script.height}_{script.fps:.0f}fps.{output_format}",
                    )

            # Resolve FFmpeg path
            ffmpeg_path = "ffmpeg"
            if output_format != "png":
                try:
                    ffmpeg_path = self._resolve_ffmpeg_path(script_path, options.get("ffmpeg_path"))
                except FFmpegNotFoundError as exc:
                    return {
                        "success": False,
                        "error": str(exc),
                    }

            config = RenderConfig(
                width=script.width,
                height=script.height,
                fps=script.fps,
                crf=int(options.get("crf", 16)),
                preset=options.get("preset", "medium"),
                output_path=os.path.abspath(output_path),
                ffmpeg_path=ffmpeg_path,
                codec=codec,
                output_format=output_format,
                transparent=bool(options.get("transparent", False)),
                audio_path=options.get("audio_path") or script.audio,
                workers=int(options.get("workers", 1)),
            )

            # Run preflight validation
            validator = PreflightValidator()
            report = validator.validate(script, config)
            if report.has_errors:
                err_msgs = [e.message for e in report.errors()]
                return {
                    "success": False,
                    "error": "; ".join(err_msgs),
                }

            # Launch job
            job = RenderJob(config, script, on_event=on_event)
            with self._lock:
                self._active_job = job
            job.start()

            return {
                "success": True,
                "output_path": config.output_path,
                "total_frames": script.frames,
                "width": config.width,
                "height": config.height,
                "fps": config.fps,
            }
        except Exception as exc:
            return {
                "success": False,
                "error": str(exc),
                "error_type": type(exc).__name__,
            }

    def cancel_render(self) -> Dict[str, Any]:
        """Cancel any currently running render job."""
        with self._lock:
            if not self._active_job or not self._active_job.is_running:
                return {"success": False, "message": "No active render job."}
            self._active_job.cancel()
            return {"success": True, "message": "Cancellation signal sent."}

    def get_render_status(self) -> Dict[str, Any]:
        """Query current status of the render job."""
        with self._lock:
            if not self._active_job:
                return {"running": False, "status": "idle"}
            return {
                "running": self._active_job.is_running,
                "error": self._active_job.error,
                "result": asdict(self._active_job.result) if self._active_job.result else None,
            }

    def render_preview_video(
        self,
        script_path: str,
        max_width: int = 640,
        max_duration: float = 15.0,
    ) -> Dict[str, Any]:
        """
        Render a fast low-res draft MP4 preview for smooth HTML5 <video> playback.
        Results are cached by script path + mtime so repeated loads are instant.
        """
        try:
            abs_path = os.path.abspath(script_path)
            if not os.path.isfile(abs_path):
                return {"success": False, "error": f"Script not found: {script_path}"}

            script = self._get_or_load_script(abs_path)
            mtime = os.path.getmtime(abs_path)

            # Calculate scaled even dimensions (required by libx264 yuv420p)
            scale = min(1.0, max_width / script.width) if max_width else 1.0
            pw = max(2, int(round(script.width * scale)) & ~1)
            ph = max(2, int(round(script.height * scale)) & ~1)

            preview_duration = min(script.duration, max_duration)
            end_frame = max(0, int(round(preview_duration * script.fps)) - 1)

            cache_input = f"{abs_path}|{mtime}|{pw}x{ph}|{end_frame}"
            cache_key = hashlib.md5(cache_input.encode("utf-8")).hexdigest()[:16]

            preview_dir = os.path.join(tempfile.gettempdir(), "renderpy_video_previews")
            os.makedirs(preview_dir, exist_ok=True)
            out_file = os.path.join(preview_dir, f"{cache_key}.mp4")

            if os.path.isfile(out_file) and os.path.getsize(out_file) > 0:
                return {
                    "success": True,
                    "video_id": cache_key,
                    "video_path": out_file,
                    "width": pw,
                    "height": ph,
                    "duration": round(preview_duration, 3),
                    "cached": True,
                }

            ffmpeg_path = self._resolve_ffmpeg_path(abs_path)
            tmp_file = os.path.join(preview_dir, f"{cache_key}_{threading.get_ident()}.tmp.mp4")

            workers = min(4, os.cpu_count() or 1)
            config = RenderConfig(
                width=pw,
                height=ph,
                fps=script.fps,
                crf=26,
                preset="ultrafast",
                output_path=tmp_file,
                ffmpeg_path=ffmpeg_path,
                codec="libx264",
                output_format="mp4",
                transparent=False,
                audio_path=script.audio,
                workers=workers,
            )

            renderer = FrameRenderer()
            reporter = BridgeProgressReporter()
            cancel_evt = threading.Event()
            pipeline = create_pipeline(config)

            t0 = time.monotonic()
            pipeline.open()
            try:
                result = renderer.render_all(
                    script=script,
                    pipeline=pipeline,
                    config=config,
                    progress=reporter,
                    cancel_evt=cancel_evt,
                    start_frame=0,
                    end_frame=end_frame,
                )
            finally:
                pipeline.close()

            if os.path.isfile(tmp_file) and os.path.getsize(tmp_file) > 0:
                os.replace(tmp_file, out_file)

            return {
                "success": True,
                "video_id": cache_key,
                "video_path": out_file,
                "width": pw,
                "height": ph,
                "duration": round(preview_duration, 3),
                "elapsed_seconds": round(time.monotonic() - t0, 2),
                "frames_rendered": result.frames_rendered,
                "cached": False,
            }
        except Exception as exc:
            return {
                "success": False,
                "error": str(exc),
                "error_type": type(exc).__name__,
            }
