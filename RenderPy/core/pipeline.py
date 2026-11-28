"""
core/pipeline.py
================
Manages the FFmpeg subprocess (or PNG image sequence output) that receives
raw BGRA frames and encodes them into MP4, WebM, MOV, or PNG frames.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import threading
from dataclasses import dataclass
from typing import List, Optional, Protocol

import cairo


# ── Constants ─────────────────────────────────────────────────────────────────

SUPPORTED_CODECS  = ("libx264", "h264_nvenc", "libx265", "libvpx-vp9", "prores_ks")
SUPPORTED_FORMATS = ("mp4", "webm", "mov", "png")

_NVENC_PRESET_MAP = {
    "ultrafast": "p1",
    "superfast": "p2",
    "veryfast":  "p3",
    "faster":    "p3",
    "fast":      "p4",
    "medium":    "p4",
    "slow":      "p5",
    "slower":    "p6",
    "veryslow":  "p7",
}

_AUDIO_CODEC_BY_FORMAT = {
    "mp4":  "aac",
    "mov":  "pcm_s16le",
    "webm": "libopus",
}


# ── Exceptions ────────────────────────────────────────────────────────────────

class FFmpegNotFoundError(RuntimeError):
    """Raised when FFmpeg binary cannot be located on the system."""


class PipelineError(RuntimeError):
    """Raised when the FFmpeg process exits with a non-zero code."""


# ── Config ────────────────────────────────────────────────────────────────────

@dataclass
class RenderConfig:
    """All parameters needed to configure the render encode pipeline."""

    width:         int
    height:        int
    fps:           float
    crf:           int           = 16
    preset:        str           = "medium"   # 'slow' exhausts RAM at 4K — use 'medium' as safe default
    output_path:   str           = "output.mp4"
    ffmpeg_path:   str           = "ffmpeg"   # resolved at runtime by detect_ffmpeg()
    codec:         str           = "libx264"
    output_format: str           = "mp4"
    transparent:   bool          = False
    audio_path:    Optional[str] = None
    workers:       int           = 1


class FrameSink(Protocol):
    """Common interface for FFmpegPipeline and ImageSequencePipeline."""

    def open(self) -> None: ...
    def write_frame(self, surface: cairo.ImageSurface) -> None: ...
    def write_raw_frame(self, data: bytes) -> None: ...
    def close(self) -> int: ...
    def terminate(self) -> None: ...
    def get_stderr(self) -> List[str]: ...


# ── FFmpeg Pipeline ───────────────────────────────────────────────────────────

class FFmpegPipeline:
    """
    Manages a single FFmpeg subprocess encode session.

    Stderr is drained continuously in a background thread to prevent
    the stderr pipe buffer from filling and blocking FFmpeg.
    """

    def __init__(self, config: RenderConfig) -> None:
        self._config   = config
        self._process: subprocess.Popen | None = None
        self._stderr_lines: List[str] = []
        self._stderr_lock   = threading.Lock()
        self._stderr_thread: threading.Thread | None = None

    # ── Public API ────────────────────────────────────────────────────────────

    def open(self) -> None:
        """
        Start the FFmpeg subprocess and the stderr drainer thread.

        Raises:
            FFmpegNotFoundError: FFmpeg binary not found.
            PipelineError: FFmpeg failed to start.
        """
        cmd = self._build_command()
        try:
            self._process = subprocess.Popen(
                cmd,
                stdin  = subprocess.PIPE,
                stdout = subprocess.DEVNULL,
                stderr = subprocess.PIPE,   # captured via drainer thread
            )
        except FileNotFoundError:
            raise FFmpegNotFoundError(
                f"FFmpeg not found at '{self._config.ffmpeg_path}'.\n"
                f"Install FFmpeg from https://ffmpeg.org/download.html\n"
                f"and make sure it is on your PATH."
            )
        except OSError as exc:
            raise PipelineError(f"Failed to start FFmpeg: {exc}") from exc

        self._stderr_thread = threading.Thread(
            target = self._drain_stderr,
            name   = "ffmpeg-stderr-drainer",
            daemon = True,
        )
        self._stderr_thread.start()

    def write_frame(self, surface: cairo.ImageSurface) -> None:
        """Write one cairo.ImageSurface (ARGB32/BGRA) to the FFmpeg stdin pipe."""
        surface.flush()
        self.write_raw_frame(bytes(surface.get_data()))

    def write_raw_frame(self, data: bytes) -> None:
        """
        Write one raw BGRA frame buffer to the FFmpeg stdin pipe.

        For 4K frames (31.6 MB each), data is written in 1 MB chunks to avoid
        Windows pipe buffer limitations with single large writes.
        """
        if self._process is None or self._process.stdin is None:
            raise PipelineError("Pipeline is not open. Call open() first.")

        poll = self._process.poll()
        if poll is not None:
            stderr = self._get_captured_stderr()
            raise PipelineError(
                f"FFmpeg exited unexpectedly (code {poll}) before frame was written.\n"
                f"FFmpeg output:\n{stderr or '  (no output captured)'}"
            )

        chunk_size = 1 * 1024 * 1024   # 1 MB
        try:
            offset = 0
            while offset < len(data):
                chunk = data[offset: offset + chunk_size]
                self._process.stdin.write(chunk)
                offset += len(chunk)
        except (BrokenPipeError, OSError) as exc:
            stderr = self._get_captured_stderr()
            exc_detail = f"{type(exc).__name__}({getattr(exc, 'errno', '?')}): {exc.strerror or str(exc)}"
            raise PipelineError(
                f"Frame write to FFmpeg failed: {exc_detail}\n"
                f"FFmpeg output:\n{stderr or '  (no output captured)'}"
            ) from exc

    def close(self) -> int:
        """Close stdin and wait for FFmpeg to finish encoding."""
        if self._process is None:
            return 0

        if self._process.stdin is not None:
            try:
                self._process.stdin.close()
            except OSError:
                pass

        self._process.wait()
        exit_code = self._process.returncode

        if self._stderr_thread and self._stderr_thread.is_alive():
            self._stderr_thread.join(timeout=5)

        if exit_code != 0:
            stderr = self._get_captured_stderr()
            raise PipelineError(
                f"FFmpeg exited with code {exit_code}.\n"
                f"FFmpeg output:\n{stderr or '  (no output captured)'}"
            )
        return exit_code

    def terminate(self) -> None:
        """Kill the FFmpeg process immediately (used when the user cancels)."""
        if self._process is not None:
            if self._process.stdin is not None:
                try:
                    self._process.stdin.close()
                except OSError:
                    pass
            try:
                self._process.terminate()
                self._process.wait(timeout=5)
            except (OSError, subprocess.TimeoutExpired):
                try:
                    self._process.kill()
                except OSError:
                    pass

    def get_stderr(self) -> List[str]:
        """Return all captured FFmpeg stderr lines."""
        return self._get_captured_stderr().splitlines()

    # ── Static Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def detect_ffmpeg(override_path: str | None = None) -> str:
        """Find the FFmpeg binary on PATH or at override_path."""
        if override_path:
            if os.path.isfile(override_path):
                return override_path
            raise FFmpegNotFoundError(
                f"FFmpeg not found at specified path: {override_path}"
            )

        found = shutil.which("ffmpeg")
        if found:
            return found

        raise FFmpegNotFoundError(
            "FFmpeg not found on PATH.\n"
            "Install FFmpeg from: https://ffmpeg.org/download.html\n"
            "Then add its bin/ directory to your system PATH."
        )

    @staticmethod
    def get_ffmpeg_version(ffmpeg_path: str) -> str:
        """Return the FFmpeg version string, e.g. '6.1.1'."""
        try:
            result = subprocess.run(
                [ffmpeg_path, "-version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            first_line = result.stdout.splitlines()[0] if result.stdout else ""
            parts = first_line.split()
            if len(parts) >= 3 and parts[0] == "ffmpeg":
                return parts[2]
        except Exception:
            pass
        return "(unknown)"

    # ── Private ───────────────────────────────────────────────────────────────

    def _build_command(self) -> list[str]:
        cfg = self._config
        cmd = [
            cfg.ffmpeg_path,
            "-y",
            "-loglevel", "warning",
            "-f",        "rawvideo",
            "-pix_fmt",  "bgra",
            "-s",        f"{cfg.width}x{cfg.height}",
            "-r",        str(cfg.fps),
            "-i",        "-",
        ]

        if cfg.audio_path:
            cmd.extend(["-i", cfg.audio_path])

        cmd.extend(self._codec_args(cfg))

        if cfg.audio_path:
            audio_codec = _AUDIO_CODEC_BY_FORMAT.get(cfg.output_format, "aac")
            cmd.extend(["-c:a", audio_codec, "-shortest"])

        cmd.append(cfg.output_path)
        return cmd

    @staticmethod
    def _codec_args(cfg: RenderConfig) -> list[str]:
        if cfg.codec == "h264_nvenc":
            nvenc_preset = _NVENC_PRESET_MAP.get(cfg.preset, "p4")
            return [
                "-c:v", "h264_nvenc",
                "-preset", nvenc_preset,
                "-cq", str(cfg.crf),
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
            ]
        if cfg.codec == "libx265":
            return [
                "-c:v", "libx265",
                "-preset", cfg.preset,
                "-crf", str(cfg.crf),
                "-pix_fmt", "yuv420p",
                "-tag:v", "hvc1",
                "-movflags", "+faststart",
            ]
        if cfg.codec == "libvpx-vp9":
            pix_fmt = "yuva420p" if cfg.transparent else "yuv420p"
            return [
                "-c:v", "libvpx-vp9",
                "-crf", str(cfg.crf),
                "-b:v", "0",
                "-pix_fmt", pix_fmt,
            ]
        if cfg.codec == "prores_ks":
            profile = "4" if cfg.transparent else "3"
            pix_fmt = "yuva444p10le" if cfg.transparent else "yuv422p10le"
            return [
                "-c:v", "prores_ks",
                "-profile:v", profile,
                "-pix_fmt", pix_fmt,
            ]

        # Default: libx264
        return [
            "-c:v",      "libx264",
            "-preset",   cfg.preset,
            "-crf",      str(cfg.crf),
            "-profile:v","high",
            "-level",    "5.2",
            "-pix_fmt",  "yuv420p",
            "-movflags", "+faststart",
        ]

    def _drain_stderr(self) -> None:
        """Background thread: read FFmpeg stderr line by line."""
        try:
            if self._process is None or self._process.stderr is None:
                return
            for raw_line in self._process.stderr:
                line = raw_line.decode(errors="replace").rstrip()
                if line:
                    with self._stderr_lock:
                        self._stderr_lines.append(line)
        except (OSError, ValueError):
            pass

    def _get_captured_stderr(self) -> str:
        with self._stderr_lock:
            return "\n".join(f"  {l}" for l in self._stderr_lines)


# ── PNG Image Sequence Pipeline ───────────────────────────────────────────────

class ImageSequencePipeline:
    """Writes rendered frames sequentially as numbered PNG files."""

    def __init__(self, config: RenderConfig) -> None:
        self._config = config
        self._frame_counter = 0

    def open(self) -> None:
        os.makedirs(self._config.output_path, exist_ok=True)
        self._frame_counter = 0

    def write_frame(self, surface: cairo.ImageSurface) -> None:
        out_file = os.path.join(
            self._config.output_path,
            f"frame_{self._frame_counter:06d}.png",
        )
        surface.flush()
        surface.write_to_png(out_file)
        self._frame_counter += 1

    def write_raw_frame(self, data: bytes) -> None:
        buf = bytearray(data)
        surf = cairo.ImageSurface.create_for_data(
            buf,
            cairo.FORMAT_ARGB32,
            self._config.width,
            self._config.height,
        )
        self.write_frame(surf)

    def close(self) -> int:
        return 0

    def terminate(self) -> None:
        pass

    def get_stderr(self) -> List[str]:
        return []


def create_pipeline(config: RenderConfig) -> FrameSink:
    """Factory returning the pipeline implementation for config.output_format."""
    if config.output_format == "png":
        return ImageSequencePipeline(config)
    return FFmpegPipeline(config)
