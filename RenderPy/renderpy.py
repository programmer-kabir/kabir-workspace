#!/usr/bin/env python3
"""
RenderPy v1.1 — pycairo animation script → 4K MP4/WebM/MOV/PNG renderer
=========================================================================

Usage:
    python renderpy.py <script> [options]
    python renderpy.py --init my_animation.py
    python renderpy.py --check-ffmpeg
"""
from __future__ import annotations

import argparse
import os
import signal
import sys
import threading
import time
from typing import Optional

# ── Version ───────────────────────────────────────────────────────────────────
__version__ = "1.1.0"

# ── Exit Codes (as per PRD) ───────────────────────────────────────────────────
EXIT_OK          = 0
EXIT_SCRIPT_ERR  = 1
EXIT_CONFIG_ERR  = 2
EXIT_FFMPEG_ERR  = 3
EXIT_IO_ERR      = 4
EXIT_CANCELLED   = 130


# ── CLI Definition ────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        prog        = "renderpy",
        description = "Convert a pycairo animation script into a 4K 30fps MP4 (or WebM/MOV/PNG).",
        formatter_class = argparse.RawDescriptionHelpFormatter,
        epilog = (
            "Examples:\n"
            "  python renderpy.py examples/school_bus_cartoon.py\n"
            "  python renderpy.py animation.py --output my_video.mp4\n"
            "  python renderpy.py animation.py --width 1920 --height 1080 --preset ultrafast\n"
            "  python renderpy.py animation.py --workers 4 --codec h264_nvenc\n"
            "  python renderpy.py animation.py --format webm --transparent\n"
            "  python renderpy.py animation.py --preview 0 2.5 9.8\n"
            "  python renderpy.py --init my_animation.py\n"
            "  python renderpy.py --check-ffmpeg\n"
        ),
    )

    ap.add_argument(
        "script",
        nargs   = "?",
        help    = "Path to the pycairo animation script (.py)",
    )
    ap.add_argument(
        "--version", action="version",
        version = f"RenderPy {__version__}",
    )

    # ── Render control ────────────────────────────────────────────────────────
    rgroup = ap.add_argument_group("render control")
    rgroup.add_argument(
        "--output", "-o", metavar="PATH",
        help = "Output file path (or directory for --format png)",
    )
    rgroup.add_argument(
        "--width", type=int, metavar="INT",
        help = "Output width in pixels (overrides script W, must be even for video)",
    )
    rgroup.add_argument(
        "--height", type=int, metavar="INT",
        help = "Output height in pixels (overrides script H, must be even for video)",
    )
    rgroup.add_argument(
        "--fps", type=float, metavar="FLOAT",
        help = "Frames per second (overrides script FPS)",
    )
    rgroup.add_argument(
        "--duration", type=float, metavar="FLOAT",
        help = "Total duration in seconds (overrides script DURATION)",
    )
    rgroup.add_argument(
        "--start-frame", type=int, default=0, metavar="INT",
        help = "First frame index to render (default: 0)",
    )
    rgroup.add_argument(
        "--end-frame", type=int, default=None, metavar="INT",
        help = "Last frame index to render inclusive (default: last frame)",
    )
    rgroup.add_argument(
        "--crf", type=int, default=None, metavar="INT",
        help = "Quality CRF/CQ 0-51 (0=lossless, 51=worst, default: 16)",
    )
    rgroup.add_argument(
        "--preset", default=None,
        choices = ["ultrafast", "superfast", "veryfast", "faster", "fast",
                   "medium", "slow", "slower", "veryslow"],
        help = "FFmpeg encoding preset (default: medium)",
    )
    rgroup.add_argument(
        "--codec", default=None,
        choices = ["libx264", "h264_nvenc", "libx265", "libvpx-vp9", "prores_ks"],
        help = "Video codec (default: libx264, or auto from --format)",
    )
    rgroup.add_argument(
        "--format", dest="output_format", default=None,
        choices = ["mp4", "webm", "mov", "png"],
        help = "Output container or PNG sequence (default: mp4)",
    )
    rgroup.add_argument(
        "--transparent", action="store_true", default=None,
        help = "Preserve alpha channel (supported with --format webm, mov, png)",
    )
    rgroup.add_argument(
        "--audio", metavar="PATH", default=None,
        help = "Optional audio file (mp3/wav/aac) to mux into the video",
    )
    rgroup.add_argument(
        "--workers", type=int, default=None, metavar="INT",
        help = "Parallel worker processes for frame rendering (default: 1)",
    )

    # ── Preview mode ──────────────────────────────────────────────────────────
    pgroup = ap.add_argument_group("preview mode")
    pgroup.add_argument(
        "--preview", type=float, nargs="+", metavar="T",
        help = "Render specific timestamps as PNG files instead of MP4",
    )
    pgroup.add_argument(
        "--preview-dir", metavar="PATH",
        help = "Directory to save preview PNGs (default: same directory as script)",
    )

    # ── Progress ──────────────────────────────────────────────────────────────
    ogroup = ap.add_argument_group("output / progress")
    xgroup = ogroup.add_mutually_exclusive_group()
    xgroup.add_argument(
        "--json-progress", action="store_true",
        help = "Emit progress as JSON lines to stdout (for CI pipelines)",
    )
    xgroup.add_argument(
        "--quiet", "-q", action="store_true",
        help = "Suppress all output except errors and the final output path",
    )
    ogroup.add_argument(
        "--verbose", "-v", action="store_true",
        help = "Show verbose per-frame diagnostics",
    )

    # ── Validation & Scaffolding ──────────────────────────────────────────────
    vgroup = ap.add_argument_group("validation & scaffolding")
    vgroup.add_argument(
        "--dry-run", action="store_true",
        help = "Validate script and environment; do not render",
    )
    vgroup.add_argument(
        "--check-ffmpeg", action="store_true",
        help = "Check FFmpeg installation and print version, then exit",
    )
    vgroup.add_argument(
        "--init", metavar="PATH",
        help = "Create a starter pycairo animation script at PATH and exit",
    )

    # ── Advanced ──────────────────────────────────────────────────────────────
    agroup = ap.add_argument_group("advanced")
    agroup.add_argument(
        "--config", metavar="PATH",
        help = "Path to a renderpy.toml configuration file",
    )
    agroup.add_argument(
        "--ffmpeg-path", metavar="PATH", default=None,
        help = "Override FFmpeg binary location",
    )
    agroup.add_argument(
        "--keep-partial", action="store_true",
        help = "Do not delete the partial output file if render is cancelled",
    )

    return ap


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_reporter(args: argparse.Namespace):
    """Return the appropriate ProgressReporter based on CLI flags."""
    from core.progress import HumanProgressReporter, JsonProgressReporter, QuietProgressReporter
    if args.json_progress:
        return JsonProgressReporter()
    if args.quiet:
        return QuietProgressReporter()
    return HumanProgressReporter()


def _default_output_path(
    script_path: str,
    width: int,
    height: int,
    fps: float,
    output_format: str = "mp4",
) -> str:
    """Generate the default output filename or directory next to the script."""
    stem    = os.path.splitext(os.path.basename(script_path))[0]
    fps_str = f"{int(fps)}fps" if fps == int(fps) else f"{fps}fps"
    parent  = os.path.dirname(os.path.abspath(script_path))
    if output_format == "png":
        return os.path.join(parent, f"{stem}_{width}x{height}_{fps_str}_frames")
    return os.path.join(parent, f"{stem}_{width}x{height}_{fps_str}.{output_format}")


def _resolve_codec(explicit_codec: Optional[str], output_format: str) -> str:
    if explicit_codec is not None:
        return explicit_codec
    if output_format == "webm":
        return "libvpx-vp9"
    if output_format == "mov":
        return "prores_ks"
    return "libx264"


def _pick(cli_val, cfg_val, default_val):
    if cli_val is not None:
        return cli_val
    if cfg_val is not None:
        return cfg_val
    return default_val


def _validate_crf(crf: int) -> bool:
    if not (0 <= crf <= 51):
        print(f"[ERROR] --crf must be between 0 and 51 (got {crf}).", file=sys.stderr)
        return False
    return True


def _load_settings(args: argparse.Namespace, script_path: Optional[str] = None):
    from core.config import find_config_file, load_project_settings
    cfg_path = find_config_file(script_path=script_path, explicit_path=args.config)
    return load_project_settings(cfg_path)


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_check_ffmpeg(args: argparse.Namespace) -> int:
    from core.pipeline import FFmpegPipeline, FFmpegNotFoundError
    try:
        settings = _load_settings(args)
    except FileNotFoundError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return EXIT_CONFIG_ERR

    ffmpeg_override = _pick(args.ffmpeg_path, settings.ffmpeg_path, None)
    try:
        path    = FFmpegPipeline.detect_ffmpeg(ffmpeg_override)
        version = FFmpegPipeline.get_ffmpeg_version(path)
        print(f"[RenderPy] FFmpeg found: {path}")
        print(f"[RenderPy] FFmpeg version: {version}")
        return EXIT_OK
    except FFmpegNotFoundError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return EXIT_FFMPEG_ERR


def cmd_init(args: argparse.Namespace) -> int:
    from core.config import create_starter_script
    try:
        created = create_starter_script(args.init)
        print(f"[RenderPy] Created starter animation script: {created}")
        return EXIT_OK
    except FileExistsError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return EXIT_CONFIG_ERR
    except OSError as exc:
        print(f"[ERROR] Could not write starter script: {exc}", file=sys.stderr)
        return EXIT_IO_ERR


def cmd_preview(args: argparse.Namespace) -> int:
    from core.loader import ScriptLoader, ScriptLoadError, ContractError
    from core.preview import PreviewRenderer
    from core.progress import RenderResult

    reporter = _make_reporter(args)

    try:
        settings = _load_settings(args, script_path=args.script)
    except FileNotFoundError as exc:
        reporter.error(str(exc))
        return EXIT_CONFIG_ERR

    try:
        loader = ScriptLoader()
        script = loader.load(
            path              = args.script,
            width_override    = _pick(args.width, settings.width, None),
            height_override   = _pick(args.height, settings.height, None),
            fps_override      = _pick(args.fps, settings.fps, None),
            duration_override = _pick(args.duration, settings.duration, None),
        )
    except FileNotFoundError as exc:
        reporter.error(str(exc))
        return EXIT_CONFIG_ERR
    except (ScriptLoadError, ContractError) as exc:
        reporter.error(str(exc))
        return EXIT_SCRIPT_ERR

    reporter.info(f"Loaded: {args.script}")
    out_dir = args.preview_dir or os.path.dirname(os.path.abspath(args.script))

    preview_start = time.monotonic()
    renderer = PreviewRenderer()
    try:
        saved = renderer.render_timestamps(
            script     = script,
            timestamps = args.preview,
            output_dir = out_dir,
            progress   = reporter,
        )
    except OSError as exc:
        reporter.error(f"Cannot write preview directory '{out_dir}': {exc}")
        return EXIT_IO_ERR

    errored = len(args.preview) - len(saved)
    reporter.finish(RenderResult(
        frames_rendered  = len(saved),
        frames_errored   = errored,
        elapsed_seconds  = time.monotonic() - preview_start,
        output_path      = out_dir,
        cancelled        = False,
    ))

    if len(saved) == 0 and errored > 0:
        return EXIT_SCRIPT_ERR
    return EXIT_OK


def cmd_render(args: argparse.Namespace) -> int:
    from core.loader    import ScriptLoader, ScriptLoadError, ContractError
    from core.pipeline  import create_pipeline, FFmpegPipeline, FFmpegNotFoundError, PipelineError, RenderConfig
    from core.renderer  import FrameRenderer
    from core.validator import PreflightValidator
    from core.progress  import RenderResult

    reporter = _make_reporter(args)

    try:
        settings = _load_settings(args, script_path=args.script)
    except FileNotFoundError as exc:
        reporter.error(str(exc))
        return EXIT_CONFIG_ERR

    crf           = _pick(args.crf, settings.crf, 16)
    preset        = _pick(args.preset, settings.preset, "medium")
    output_format = _pick(args.output_format, settings.output_format, "mp4")
    codec         = _resolve_codec(_pick(args.codec, settings.codec, None), output_format)
    transparent   = bool(_pick(args.transparent, settings.transparent, False))
    workers       = _pick(args.workers, settings.workers, 1)
    ffmpeg_ov     = _pick(args.ffmpeg_path, settings.ffmpeg_path, None)

    if not _validate_crf(crf):
        return EXIT_CONFIG_ERR

    # ── 1. Load script ────────────────────────────────────────────────────────
    reporter.info(f"Loading: {args.script}")
    try:
        loader = ScriptLoader()
        script = loader.load(
            path              = args.script,
            width_override    = _pick(args.width, settings.width, None),
            height_override   = _pick(args.height, settings.height, None),
            fps_override      = _pick(args.fps, settings.fps, None),
            duration_override = _pick(args.duration, settings.duration, None),
        )
    except FileNotFoundError as exc:
        reporter.error(str(exc))
        return EXIT_CONFIG_ERR
    except (ScriptLoadError, ContractError) as exc:
        reporter.error(str(exc))
        return EXIT_SCRIPT_ERR

    reporter.info(f"Loaded:  {args.script}")

    # ── 2. Resolve FFmpeg (only needed for video formats) ─────────────────────
    ffmpeg_path = "ffmpeg"
    if output_format != "png":
        try:
            ffmpeg_path = FFmpegPipeline.detect_ffmpeg(ffmpeg_ov)
            ffmpeg_ver  = FFmpegPipeline.get_ffmpeg_version(ffmpeg_path)
            reporter.info(f"FFmpeg:  {ffmpeg_ver} at {ffmpeg_path}")
        except FFmpegNotFoundError as exc:
            reporter.error(str(exc))
            return EXIT_FFMPEG_ERR

    # ── 3. Build render config ────────────────────────────────────────────────
    output_path = args.output or _default_output_path(
        args.script, script.width, script.height, script.fps, output_format
    )
    audio_path = _pick(args.audio, script.audio or settings.audio_path, None)

    config = RenderConfig(
        width         = script.width,
        height        = script.height,
        fps           = script.fps,
        crf           = crf,
        preset        = preset,
        output_path   = output_path,
        ffmpeg_path   = ffmpeg_path,
        codec         = codec,
        output_format = output_format,
        transparent   = transparent,
        audio_path    = audio_path,
        workers       = workers,
    )

    # ── 4. Preflight validation ───────────────────────────────────────────────
    validator = PreflightValidator()
    report    = validator.validate(
        script,
        config,
        dry_run     = args.dry_run,
        start_frame = args.start_frame,
        end_frame   = args.end_frame,
    )

    for issue in report.warnings():
        reporter.info(f"[{issue.severity}] {issue.message}")
    for issue in report.errors():
        reporter.error(issue.message)

    if report.has_errors:
        return EXIT_IO_ERR if report.has_io_errors else EXIT_CONFIG_ERR

    # ── 5. Dry run — stop here ────────────────────────────────────────────────
    if args.dry_run:
        reporter.info("Dry run complete. All checks passed.")
        reporter.info(f"Would render: {script.frames} frames → {output_path}")
        return EXIT_OK

    # ── 6. Set up cancel handler & open pipeline ──────────────────────────────
    cancel_evt = threading.Event()
    pipeline   = create_pipeline(config)

    def _sigint_handler(sig, frame):
        reporter.info("Cancellation requested (Ctrl+C)...")
        cancel_evt.set()

    old_handler = signal.signal(signal.SIGINT, _sigint_handler)

    try:
        try:
            pipeline.open()
        except FFmpegNotFoundError as exc:
            reporter.error(str(exc))
            return EXIT_FFMPEG_ERR
        except OSError as exc:
            reporter.error(f"Output I/O error: {exc}")
            return EXIT_IO_ERR
        except Exception as exc:
            reporter.error(f"Failed to start render pipeline: {exc}")
            return EXIT_FFMPEG_ERR

        render_start = time.monotonic()
        renderer     = FrameRenderer()

        try:
            result = renderer.render_all(
                script      = script,
                pipeline    = pipeline,
                config      = config,
                progress    = reporter,
                cancel_evt  = cancel_evt,
                start_frame = args.start_frame,
                end_frame   = args.end_frame,
            )
        except PipelineError as exc:
            reporter.info("")
            reporter.error(f"FFmpeg crashed during render: {exc}")
            stderr_lines = pipeline.get_stderr()
            if stderr_lines:
                reporter.error("FFmpeg output:")
                for line in stderr_lines:
                    reporter.error(f"  {line}")
            else:
                reporter.error("No FFmpeg output captured. Possible causes: out of memory, codec error.")
            reporter.error(
                "Tip: try --preset fast --crf 23  or  --width 1920 --height 1080 "
                "for a test render with lower memory usage."
            )
            if not args.keep_partial and os.path.isfile(output_path):
                try:
                    os.remove(output_path)
                    reporter.info(f"Partial file deleted: {output_path}")
                except OSError:
                    pass
            return EXIT_FFMPEG_ERR

        if result.cancelled:
            pipeline.terminate()
            if not args.keep_partial and os.path.isfile(output_path):
                try:
                    os.remove(output_path)
                    reporter.info(f"Partial file deleted: {output_path}")
                except OSError:
                    pass
            reporter.finish(result)
            return EXIT_CANCELLED

        try:
            pipeline.close()
        except PipelineError as exc:
            reporter.error(str(exc))
            stderr_lines = pipeline.get_stderr()
            if stderr_lines:
                reporter.error("FFmpeg output:")
                for line in stderr_lines:
                    reporter.error(f"  {line}")
            return EXIT_FFMPEG_ERR

        result.elapsed_seconds = time.monotonic() - render_start
        if os.path.isfile(output_path):
            result.output_size_bytes = os.path.getsize(output_path)
        elif os.path.isdir(output_path):
            result.output_size_bytes = sum(
                os.path.getsize(os.path.join(output_path, f))
                for f in os.listdir(output_path)
                if os.path.isfile(os.path.join(output_path, f))
            )

        if args.verbose:
            stderr_lines = pipeline.get_stderr()
            if stderr_lines:
                reporter.info("FFmpeg warnings during encode:")
                for line in stderr_lines:
                    reporter.info(f"  {line}")

        reporter.finish(result)
        return EXIT_OK
    finally:
        signal.signal(signal.SIGINT, old_handler)


# ── Entry Point ───────────────────────────────────────────────────────────────

def main() -> int:
    ap   = build_parser()
    args = ap.parse_args()

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    if args.init:
        return cmd_init(args)

    if args.check_ffmpeg:
        return cmd_check_ffmpeg(args)

    if not args.script:
        ap.print_help()
        return EXIT_CONFIG_ERR

    if not args.script.endswith(".py"):
        print(
            f"[ERROR] Expected a .py file, got: {args.script}",
            file=sys.stderr,
        )
        return EXIT_CONFIG_ERR

    if args.preview is not None:
        return cmd_preview(args)

    return cmd_render(args)


if __name__ == "__main__":
    sys.exit(main())
