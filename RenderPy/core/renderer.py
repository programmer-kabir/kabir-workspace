"""
core/renderer.py
================
Main frame render loop (single-process and optional multi-process workers).

Responsibilities:
  - Iterate over every frame index in [start_frame, end_frame]
  - Call script.render_fn(t) for each frame (or fan out across worker processes)
  - Validate & normalize returned surfaces to (config.width, config.height) ARGB32
  - On render exception: log error, write a blank black frame, continue
  - Abort if > MAX_ERROR_FRACTION of frames fail
  - On PipelineError: re-raise immediately (FFmpeg crashed — not recoverable)
  - Respect a cancel threading.Event
  - Emit progress updates after each frame
"""
from __future__ import annotations

import concurrent.futures
import threading
import time
from typing import Dict, Optional, Tuple

import cairo

from .loader import LoadedScript, ScriptLoader
from .pipeline import FrameSink, PipelineError, RenderConfig
from .progress import ProgressReporter, RenderResult
from .validator import PreflightValidator


# ── Surface Normalization ─────────────────────────────────────────────────────

def normalize_surface(surf: object, width: int, height: int) -> cairo.ImageSurface:
    """
    Validate that `surf` is a cairo.ImageSurface and normalize it to
    FORMAT_ARGB32 at (width, height).

    Returns the original surface untouched (zero-copy) when dimensions and
    format already match.
    """
    if not isinstance(surf, cairo.ImageSurface):
        raise TypeError(
            f"render(t) must return cairo.ImageSurface, got {type(surf).__name__}"
        )

    src_w = surf.get_width()
    src_h = surf.get_height()
    if src_w <= 0 or src_h <= 0:
        raise ValueError(f"render(t) returned invalid surface size: {src_w}x{src_h}")

    if surf.get_format() == cairo.FORMAT_ARGB32 and src_w == width and src_h == height:
        return surf

    target = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
    cr = cairo.Context(target)
    if src_w != width or src_h != height:
        cr.scale(width / src_w, height / src_h)
    cr.set_source_surface(surf, 0, 0)
    if src_w != width or src_h != height:
        cr.get_source().set_filter(cairo.FILTER_BILINEAR)
    cr.set_operator(cairo.OPERATOR_SOURCE)
    cr.paint()
    target.flush()
    return target


# ── Multiprocessing Worker Globals ────────────────────────────────────────────

_WORKER_SCRIPT: Optional[LoadedScript] = None
_WORKER_WIDTH:  int = 0
_WORKER_HEIGHT: int = 0


def _worker_init(script_path: str, width: int, height: int) -> None:
    """Initializer executed once per worker process."""
    global _WORKER_SCRIPT, _WORKER_WIDTH, _WORKER_HEIGHT
    _WORKER_SCRIPT = ScriptLoader().load(
        script_path,
        width_override=width,
        height_override=height,
    )
    _WORKER_WIDTH = width
    _WORKER_HEIGHT = height


def _worker_render_frame(
    frame_index: int,
    t: float,
) -> Tuple[int, Optional[bytes], float, Optional[Tuple[str, str]]]:
    """Render and normalize one frame inside a worker process."""
    assert _WORKER_SCRIPT is not None
    frame_start = time.monotonic()
    try:
        surf = _WORKER_SCRIPT.render_fn(t)
        norm = normalize_surface(surf, _WORKER_WIDTH, _WORKER_HEIGHT)
        norm.flush()
        raw = bytes(norm.get_data())
        return frame_index, raw, time.monotonic() - frame_start, None
    except Exception as exc:
        return (
            frame_index,
            None,
            time.monotonic() - frame_start,
            (type(exc).__name__, str(exc)),
        )


class _RemoteFrameError(RuntimeError):
    """Preserves exception type name from a worker process for progress reporting."""

    def __init__(self, exc_type: str, message: str) -> None:
        super().__init__(message)
        self.exc_type = exc_type


# ── Renderer ──────────────────────────────────────────────────────────────────

class FrameRenderer:
    """Executes the render loop and writes frames to the output pipeline."""

    def render_all(
        self,
        script:      LoadedScript,
        pipeline:    FrameSink,
        config:      RenderConfig,
        progress:    ProgressReporter,
        cancel_evt:  threading.Event,
        start_frame: int = 0,
        end_frame:   Optional[int] = None,
    ) -> RenderResult:
        """
        Main frame loop.

        Raises:
            PipelineError: If FFmpeg crashes during the render.
        """
        if end_frame is None:
            end_frame = script.frames - 1

        end_frame   = min(end_frame, script.frames - 1)
        start_frame = max(0, start_frame)
        total       = end_frame - start_frame + 1

        if total <= 0:
            return RenderResult(
                frames_rendered=0,
                frames_errored=0,
                elapsed_seconds=0.0,
                output_path=config.output_path,
                cancelled=False,
            )

        blank_frame = self._make_blank_frame(config.width, config.height)
        progress.start(total, script.summary(), config.output_path)

        if config.workers > 1 and total > 1:
            return self._render_parallel(
                script=script,
                pipeline=pipeline,
                config=config,
                progress=progress,
                cancel_evt=cancel_evt,
                start_frame=start_frame,
                end_frame=end_frame,
                total=total,
                blank_frame=blank_frame,
            )

        return self._render_sequential(
            script=script,
            pipeline=pipeline,
            config=config,
            progress=progress,
            cancel_evt=cancel_evt,
            start_frame=start_frame,
            end_frame=end_frame,
            total=total,
            blank_frame=blank_frame,
        )

    # ── Sequential Path ───────────────────────────────────────────────────────

    def _render_sequential(
        self,
        script:      LoadedScript,
        pipeline:    FrameSink,
        config:      RenderConfig,
        progress:    ProgressReporter,
        cancel_evt:  threading.Event,
        start_frame: int,
        end_frame:   int,
        total:       int,
        blank_frame: cairo.ImageSurface,
    ) -> RenderResult:
        wall_start      = time.monotonic()
        frames_rendered = 0
        frames_errored  = 0
        cancelled       = False
        max_errors      = max(1, int(total * PreflightValidator.MAX_ERROR_FRACTION))

        for i in range(start_frame, end_frame + 1):
            if cancel_evt.is_set():
                cancelled = True
                break

            t = i / script.fps
            frame_start = time.monotonic()

            try:
                raw_surf = script.render_fn(t)
                surf = normalize_surface(raw_surf, config.width, config.height)
            except Exception as exc:
                progress.frame_error(i, exc)
                frames_errored += 1
                surf = blank_frame

                if frames_errored > max_errors:
                    progress.error(
                        f"Too many frame errors ({frames_errored}/{total}). "
                        f"Aborting render."
                    )
                    cancelled = True
                    break

            pipeline.write_frame(surf)

            frame_elapsed = time.monotonic() - frame_start
            frames_rendered += 1
            progress.update(i - start_frame, frame_elapsed)

        return RenderResult(
            frames_rendered = frames_rendered,
            frames_errored  = frames_errored,
            elapsed_seconds = time.monotonic() - wall_start,
            output_path     = config.output_path,
            cancelled       = cancelled,
        )

    # ── Parallel Worker Path ──────────────────────────────────────────────────

    def _render_parallel(
        self,
        script:      LoadedScript,
        pipeline:    FrameSink,
        config:      RenderConfig,
        progress:    ProgressReporter,
        cancel_evt:  threading.Event,
        start_frame: int,
        end_frame:   int,
        total:       int,
        blank_frame: cairo.ImageSurface,
    ) -> RenderResult:
        wall_start      = time.monotonic()
        frames_rendered = 0
        frames_errored  = 0
        cancelled       = False
        max_errors      = max(1, int(total * PreflightValidator.MAX_ERROR_FRACTION))
        blank_bytes     = bytes(blank_frame.get_data())

        max_in_flight   = max(2, config.workers * 3)
        next_submit     = start_frame
        next_write      = start_frame
        in_flight: Dict[int, concurrent.futures.Future] = {}
        completed: Dict[int, Tuple[Optional[bytes], float, Optional[Tuple[str, str]]]] = {}

        with concurrent.futures.ProcessPoolExecutor(
            max_workers=config.workers,
            initializer=_worker_init,
            initargs=(script.script_path, config.width, config.height),
        ) as executor:
            while next_write <= end_frame:
                if cancel_evt.is_set():
                    cancelled = True
                    break

                # Keep bounded window of frames in flight
                while next_submit <= end_frame and len(in_flight) < max_in_flight:
                    idx = next_submit
                    in_flight[idx] = executor.submit(
                        _worker_render_frame,
                        idx,
                        idx / script.fps,
                    )
                    next_submit += 1

                if not in_flight and next_write not in completed:
                    break

                # Wait for at least one future to finish
                if next_write not in completed and in_flight:
                    done_set, _ = concurrent.futures.wait(
                        in_flight.values(),
                        return_when=concurrent.futures.FIRST_COMPLETED,
                    )
                    for fut in done_set:
                        idx, raw_bytes, f_elapsed, err = fut.result()
                        in_flight.pop(idx, None)
                        completed[idx] = (raw_bytes, f_elapsed, err)

                # Drain ready frames in strict order
                while next_write in completed:
                    if cancel_evt.is_set():
                        cancelled = True
                        break

                    raw_bytes, f_elapsed, err = completed.pop(next_write)
                    if err is not None:
                        exc_type, exc_msg = err
                        progress.frame_error(next_write, _RemoteFrameError(exc_type, exc_msg))
                        frames_errored += 1
                        raw_bytes = blank_bytes

                        if frames_errored > max_errors:
                            progress.error(
                                f"Too many frame errors ({frames_errored}/{total}). "
                                f"Aborting render."
                            )
                            cancelled = True
                            break

                    assert raw_bytes is not None
                    pipeline.write_raw_frame(raw_bytes)
                    frames_rendered += 1
                    progress.update(next_write - start_frame, f_elapsed)
                    next_write += 1

                if cancelled:
                    break

            if cancelled:
                for fut in in_flight.values():
                    fut.cancel()

        return RenderResult(
            frames_rendered = frames_rendered,
            frames_errored  = frames_errored,
            elapsed_seconds = time.monotonic() - wall_start,
            output_path     = config.output_path,
            cancelled       = cancelled,
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _make_blank_frame(width: int, height: int) -> cairo.ImageSurface:
        """Create a solid black frame as a fallback for failed render() calls."""
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
        cr   = cairo.Context(surf)
        cr.set_source_rgb(0, 0, 0)
        cr.paint()
        surf.flush()
        return surf
