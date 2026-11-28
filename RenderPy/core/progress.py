"""
core/progress.py
================
Progress reporting implementations.

Three modes:
  HumanProgressReporter  — live-updating single-line terminal output
  JsonProgressReporter   — JSON lines to stdout (for CI pipelines)
  QuietProgressReporter  — silent except for errors
"""
from __future__ import annotations

import json
import sys
import time
from collections import deque
from dataclasses import dataclass
from typing import Protocol, Optional


# ── Shared Data ───────────────────────────────────────────────────────────────

@dataclass
class RenderResult:
    frames_rendered:  int
    frames_errored:   int
    elapsed_seconds:  float
    output_path:      str
    cancelled:        bool
    output_size_bytes: int = 0


# ── Protocol ──────────────────────────────────────────────────────────────────

class ProgressReporter(Protocol):
    def start(self, total: int, summary: str, output_path: str) -> None: ...
    def update(self, frame_index: int, frame_time_s: float) -> None: ...
    def frame_error(self, frame_index: int, exc: Exception) -> None: ...
    def finish(self, result: RenderResult) -> None: ...
    def info(self, message: str) -> None: ...
    def error(self, message: str) -> None: ...


# ── Human Reporter ────────────────────────────────────────────────────────────

class HumanProgressReporter:
    """
    Writes live-updating progress to stderr and info messages to stderr.

    Progress line format:
      Frame  187 / 303  [===========--------]  61.7%  Elapsed: 1:22  ETA: 0:50  2.3 fps
    """

    _BAR_WIDTH = 20
    _ROLLING_WINDOW = 10   # frames to average for ETA

    def __init__(self) -> None:
        self._total:      int   = 0
        self._start_time: float = 0.0
        self._recent_times: deque[float] = deque(maxlen=self._ROLLING_WINDOW)
        self._last_frame_t: float = 0.0
        self._on_new_line = True

    def start(self, total: int, summary: str, output_path: str) -> None:
        self._total      = total
        self._start_time = time.monotonic()
        self._on_new_line = True
        self._print(f"Config:  {summary}")
        self._print(f"Output:  {output_path}")
        self._print(f"Rendering {total} frames...")

    def update(self, frame_index: int, frame_time_s: float) -> None:
        now     = time.monotonic()
        elapsed = now - self._start_time

        # Track per-frame times for rolling ETA
        self._recent_times.append(frame_time_s)
        avg_frame = sum(self._recent_times) / len(self._recent_times)
        remaining = self._total - frame_index - 1
        eta       = avg_frame * remaining
        fps_r     = 1.0 / avg_frame if avg_frame > 0 else 0.0

        done = frame_index + 1
        pct  = done / self._total * 100.0
        bar  = self._bar(done, self._total)

        line = (
            f"\r  Frame {done:>4} / {self._total}  "
            f"[{bar}]  {pct:5.1f}%  "
            f"Elapsed: {self._fmt_time(elapsed)}  "
            f"ETA: {self._fmt_time(eta)}  "
            f"{fps_r:.1f} fps"
        )
        sys.stderr.write(line)
        sys.stderr.flush()
        self._on_new_line = False

    def frame_error(self, frame_index: int, exc: Exception) -> None:
        self._ensure_new_line()
        sys.stderr.write(
            f"  [WARN] Frame {frame_index} error: {type(exc).__name__}: {exc} "
            f"— writing black frame.\n"
        )
        self._on_new_line = True

    def finish(self, result: RenderResult) -> None:
        self._ensure_new_line()
        if result.cancelled:
            sys.stderr.write("[RenderPy] Render cancelled.\n")
        else:
            size_mb = result.output_size_bytes / 1_048_576
            sys.stderr.write(
                f"\n[RenderPy] Done in {self._fmt_time(result.elapsed_seconds)} "
                f"→ {result.output_path} ({size_mb:.1f} MB)\n"
            )
            if result.frames_errored > 0:
                sys.stderr.write(
                    f"[RenderPy] Warning: {result.frames_errored} frame(s) had errors "
                    f"and were replaced with black frames.\n"
                )

    def info(self, message: str) -> None:
        self._ensure_new_line()
        sys.stderr.write(f"[RenderPy] {message}\n")

    def error(self, message: str) -> None:
        self._ensure_new_line()
        sys.stderr.write(f"[ERROR]    {message}\n")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _print(self, msg: str) -> None:
        self._ensure_new_line()
        sys.stderr.write(f"[RenderPy] {msg}\n")

    def _ensure_new_line(self) -> None:
        if not self._on_new_line:
            sys.stderr.write("\n")
            self._on_new_line = True

    @classmethod
    def _bar(cls, done: int, total: int) -> str:
        filled = int(cls._BAR_WIDTH * done / total)
        return "=" * filled + "-" * (cls._BAR_WIDTH - filled)

    @staticmethod
    def _fmt_time(seconds: float) -> str:
        seconds = max(0.0, seconds)
        m, s = divmod(int(seconds), 60)
        return f"{m}:{s:02d}"


# ── JSON Reporter ─────────────────────────────────────────────────────────────

class JsonProgressReporter:
    """
    Emits JSON lines to stdout — suitable for CI pipelines.

    Events:
        {"event": "start",    "frames": N, "summary": "..."}
        {"event": "frame",    "index": i, "total": N, "pct": X, "elapsed": Y, "eta": Z, "fps_rendered": F}
        {"event": "error",    "frame": i, "type": "...", "message": "..."}
        {"event": "complete", "output": "...", "size_bytes": N, "elapsed": X}
        {"event": "cancelled"}
    """

    _EMIT_EVERY = 1   # emit JSON every N frames (1 = every frame)

    def __init__(self) -> None:
        self._total:      int   = 0
        self._start_time: float = 0.0
        self._recent_times: deque[float] = deque(maxlen=10)

    def start(self, total: int, summary: str, output_path: str) -> None:
        self._total      = total
        self._start_time = time.monotonic()
        self._emit({"event": "start", "frames": total,
                    "summary": summary, "output": output_path})

    def update(self, frame_index: int, frame_time_s: float) -> None:
        self._recent_times.append(frame_time_s)
        avg_frame = sum(self._recent_times) / len(self._recent_times)
        remaining = self._total - frame_index - 1
        elapsed   = time.monotonic() - self._start_time
        eta       = avg_frame * remaining
        fps_r     = 1.0 / avg_frame if avg_frame > 0 else 0.0
        pct       = (frame_index + 1) / self._total * 100.0
        self._emit({
            "event":        "frame",
            "index":        frame_index,
            "total":        self._total,
            "pct":          round(pct, 1),
            "elapsed":      round(elapsed, 2),
            "eta":          round(eta, 2),
            "fps_rendered": round(fps_r, 2),
        })

    def frame_error(self, frame_index: int, exc: Exception) -> None:
        self._emit({
            "event":   "error",
            "frame":   frame_index,
            "type":    type(exc).__name__,
            "message": str(exc),
        })

    def finish(self, result: RenderResult) -> None:
        if result.cancelled:
            self._emit({"event": "cancelled"})
        else:
            self._emit({
                "event":      "complete",
                "output":     result.output_path,
                "size_bytes": result.output_size_bytes,
                "elapsed":    round(result.elapsed_seconds, 2),
                "frames_errored": result.frames_errored,
            })

    def info(self, message: str) -> None:
        self._emit({"event": "info", "message": message})

    def error(self, message: str) -> None:
        self._emit({"event": "error", "message": message}, to_stderr=True)

    @staticmethod
    def _emit(obj: dict, to_stderr: bool = False) -> None:
        line = json.dumps(obj)
        if to_stderr:
            sys.stderr.write(line + "\n")
            sys.stderr.flush()
        else:
            sys.stdout.write(line + "\n")
            sys.stdout.flush()


# ── Quiet Reporter ────────────────────────────────────────────────────────────

class QuietProgressReporter:
    """Suppresses all output except errors and the final output path."""

    def start(self, total: int, summary: str, output_path: str) -> None:
        pass

    def update(self, frame_index: int, frame_time_s: float) -> None:
        pass

    def frame_error(self, frame_index: int, exc: Exception) -> None:
        sys.stderr.write(
            f"[WARN] Frame {frame_index} error: {type(exc).__name__}: {exc}\n"
        )

    def finish(self, result: RenderResult) -> None:
        if not result.cancelled:
            sys.stdout.write(result.output_path + "\n")

    def info(self, message: str) -> None:
        pass

    def error(self, message: str) -> None:
        sys.stderr.write(f"[ERROR] {message}\n")
