"""
core/validator.py
=================
Pre-render validation (preflight checks).

Runs before any rendering begins. Validates:
  1. render() is callable                  → ContractError
  2. Render dimensions, FPS, frame range   → ConfigError
  3. FFmpeg is found and executable        → FFmpegNotFoundError (skipped for PNG format)
  4. Resolution dimensions are even ints   → ConfigError (video codecs)
  5. Audio file exists (if specified)      → ConfigError
  6. Output path parent dir is writable    → IOError
  7. Output path type matches format       → IOError
  8. Estimated disk space is sufficient    → IOError (warning only)
"""
from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass, field
from typing import List, Optional

from .loader import LoadedScript
from .pipeline import RenderConfig, SUPPORTED_CODECS, SUPPORTED_FORMATS


# ── Constants ─────────────────────────────────────────────────────────────────

IO_ERROR_CODES = frozenset({
    "OUTPUT_IS_DIRECTORY",
    "OUTPUT_IS_FILE",
    "OUTPUT_DIR_CREATE_FAILED",
    "OUTPUT_NOT_WRITABLE",
})


# ── Report ────────────────────────────────────────────────────────────────────

@dataclass
class ValidationIssue:
    severity:  str   # "ERROR" or "WARNING"
    code:      str   # machine-readable code
    message:   str


@dataclass
class ValidationReport:
    issues: List[ValidationIssue] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return any(i.severity == "ERROR" for i in self.issues)

    @property
    def has_warnings(self) -> bool:
        return any(i.severity == "WARNING" for i in self.issues)

    @property
    def has_io_errors(self) -> bool:
        return any(i.severity == "ERROR" and i.code in IO_ERROR_CODES for i in self.issues)

    def errors(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == "ERROR"]

    def warnings(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == "WARNING"]


# ── Validator ─────────────────────────────────────────────────────────────────

class PreflightValidator:
    """Runs all preflight checks and returns a ValidationReport."""

    _MP4_COMPRESSION_RATIO = 0.005   # ~0.5% of raw size (CRF 16, H.264)
    MAX_ERROR_FRACTION     = 0.10

    def validate(
        self,
        script:      LoadedScript,
        config:      RenderConfig,
        dry_run:     bool = False,
        start_frame: int  = 0,
        end_frame:   Optional[int] = None,
    ) -> ValidationReport:
        """Run all preflight checks and return a ValidationReport."""
        report = ValidationReport()

        self._check_render_callable(script, report)
        self._check_render_params(script, config, start_frame, end_frame, report)

        if config.output_format != "png":
            self._check_ffmpeg(config, report)
            self._check_even_resolution(config, report)

        if config.audio_path:
            self._check_audio_path(config, report)

        if not dry_run:
            self._check_output_path(config, report)
            self._check_disk_space(script, config, start_frame, end_frame, report)

        return report

    # ── Checks ────────────────────────────────────────────────────────────────

    @staticmethod
    def _check_render_callable(script: LoadedScript, report: ValidationReport) -> None:
        if not callable(script.render_fn):
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "RENDER_NOT_CALLABLE",
                message  = (
                    f"render() in '{script.script_path}' is not callable "
                    f"(found {type(script.render_fn).__name__})."
                ),
            ))

    @staticmethod
    def _check_render_params(
        script:      LoadedScript,
        config:      RenderConfig,
        start_frame: int,
        end_frame:   Optional[int],
        report:      ValidationReport,
    ) -> None:
        if config.width <= 0 or config.height <= 0:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "INVALID_RESOLUTION",
                message  = f"Width and height must be positive (got {config.width}x{config.height}).",
            ))

        if config.fps <= 0:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "INVALID_FPS",
                message  = f"FPS must be greater than 0 (got {config.fps}).",
            ))

        if script.frames <= 0:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "ZERO_FRAMES",
                message  = f"Total frame count must be positive (got {script.frames}).",
            ))

        if config.workers < 1:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "INVALID_WORKERS",
                message  = f"--workers must be >= 1 (got {config.workers}).",
            ))

        if config.output_format not in SUPPORTED_FORMATS:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "UNSUPPORTED_FORMAT",
                message  = f"Unsupported format '{config.output_format}'. Choose from: {', '.join(SUPPORTED_FORMATS)}.",
            ))

        if config.output_format != "png" and config.codec not in SUPPORTED_CODECS:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "UNSUPPORTED_CODEC",
                message  = f"Unsupported codec '{config.codec}'. Choose from: {', '.join(SUPPORTED_CODECS)}.",
            ))

        if config.transparent and config.output_format not in ("webm", "mov", "png"):
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "ALPHA_NOT_SUPPORTED",
                message  = (
                    f"Transparency (--transparent) is not supported with format '{config.output_format}'. "
                    f"Use --format webm, --format mov, or --format png."
                ),
            ))

        if start_frame < 0:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "INVALID_FRAME_RANGE",
                message  = f"--start-frame must be >= 0 (got {start_frame}).",
            ))
        elif script.frames > 0 and start_frame >= script.frames:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "INVALID_FRAME_RANGE",
                message  = (
                    f"--start-frame ({start_frame}) exceeds last frame index ({script.frames - 1})."
                ),
            ))

        if end_frame is not None and end_frame < start_frame:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "INVALID_FRAME_RANGE",
                message  = f"--end-frame ({end_frame}) cannot be less than --start-frame ({start_frame}).",
            ))

    @staticmethod
    def _check_audio_path(config: RenderConfig, report: ValidationReport) -> None:
        if config.audio_path and not os.path.isfile(config.audio_path):
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "AUDIO_NOT_FOUND",
                message  = f"Audio file not found: {config.audio_path}",
            ))
        elif config.audio_path and config.output_format == "png":
            report.issues.append(ValidationIssue(
                severity = "WARNING",
                code     = "AUDIO_IGNORED_FOR_PNG",
                message  = "Audio track is ignored when exporting PNG image sequences.",
            ))

    @staticmethod
    def _check_ffmpeg(config: RenderConfig, report: ValidationReport) -> None:
        ffmpeg = shutil.which(config.ffmpeg_path) or (
            config.ffmpeg_path if os.path.isfile(config.ffmpeg_path) else None
        )
        if ffmpeg is None:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "FFMPEG_NOT_FOUND",
                message  = (
                    f"FFmpeg not found at '{config.ffmpeg_path}'.\n"
                    f"  Install from: https://ffmpeg.org/download.html\n"
                    f"  Then add ffmpeg/bin to your system PATH."
                ),
            ))
            return

        try:
            result = subprocess.run(
                [ffmpeg, "-version"],
                capture_output=True,
                timeout=10,
            )
            if result.returncode != 0:
                report.issues.append(ValidationIssue(
                    severity = "WARNING",
                    code     = "FFMPEG_VERSION_CHECK_FAILED",
                    message  = f"FFmpeg found at '{ffmpeg}' but -version returned non-zero.",
                ))
        except (OSError, subprocess.TimeoutExpired) as exc:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "FFMPEG_NOT_EXECUTABLE",
                message  = f"FFmpeg found at '{ffmpeg}' but cannot be executed: {exc}",
            ))

    @staticmethod
    def _check_even_resolution(config: RenderConfig, report: ValidationReport) -> None:
        issues = []
        if config.width % 2 != 0:
            issues.append(f"width={config.width}")
        if config.height % 2 != 0:
            issues.append(f"height={config.height}")
        if issues:
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "ODD_RESOLUTION",
                message  = (
                    f"Video encoding requires even width and height. "
                    f"Odd value(s): {', '.join(issues)}. "
                    f"Adjust with --width / --height."
                ),
            ))

    @staticmethod
    def _check_output_path(config: RenderConfig, report: ValidationReport) -> None:
        out = config.output_path

        if config.output_format == "png":
            if os.path.isfile(out):
                report.issues.append(ValidationIssue(
                    severity = "ERROR",
                    code     = "OUTPUT_IS_FILE",
                    message  = f"PNG sequence output path '{out}' is an existing file. Provide a directory path.",
                ))
                return
            try:
                os.makedirs(out, exist_ok=True)
            except OSError as exc:
                report.issues.append(ValidationIssue(
                    severity = "ERROR",
                    code     = "OUTPUT_DIR_CREATE_FAILED",
                    message  = f"Cannot create output directory '{out}': {exc}",
                ))
                return
            if not os.access(out, os.W_OK):
                report.issues.append(ValidationIssue(
                    severity = "ERROR",
                    code     = "OUTPUT_NOT_WRITABLE",
                    message  = f"Output directory '{out}' is not writable.",
                ))
            return

        parent = os.path.dirname(os.path.abspath(out)) or "."

        if os.path.isdir(out):
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "OUTPUT_IS_DIRECTORY",
                message  = f"Output path '{out}' is a directory. Provide a file path.",
            ))
            return

        if not os.path.isdir(parent):
            try:
                os.makedirs(parent, exist_ok=True)
            except OSError as exc:
                report.issues.append(ValidationIssue(
                    severity = "ERROR",
                    code     = "OUTPUT_DIR_CREATE_FAILED",
                    message  = f"Cannot create output directory '{parent}': {exc}",
                ))
                return

        if not os.access(parent, os.W_OK):
            report.issues.append(ValidationIssue(
                severity = "ERROR",
                code     = "OUTPUT_NOT_WRITABLE",
                message  = f"Output directory '{parent}' is not writable.",
            ))

    def _check_disk_space(
        self,
        script:      LoadedScript,
        config:      RenderConfig,
        start_frame: int,
        end_frame:   Optional[int],
        report:      ValidationReport,
    ) -> None:
        try:
            target_dir = (
                os.path.abspath(config.output_path)
                if config.output_format == "png"
                else (os.path.dirname(os.path.abspath(config.output_path)) or ".")
            )
            stat = shutil.disk_usage(target_dir)

            resolved_end = script.frames - 1 if end_frame is None else min(end_frame, script.frames - 1)
            resolved_start = max(0, start_frame)
            frame_count = max(0, resolved_end - resolved_start + 1)

            bytes_per_frame = config.width * config.height * 4
            ratio = 0.25 if config.output_format == "png" else self._MP4_COMPRESSION_RATIO
            estimated_bytes = int(bytes_per_frame * frame_count * ratio)
            required = estimated_bytes * 2 + 512 * 1024 * 1024
            if stat.free < required:
                report.issues.append(ValidationIssue(
                    severity = "WARNING",
                    code     = "LOW_DISK_SPACE",
                    message  = (
                        f"Low disk space. Estimated output size: "
                        f"{estimated_bytes / 1_048_576:.0f} MB. "
                        f"Free: {stat.free / 1_048_576:.0f} MB."
                    ),
                ))
        except OSError:
            pass
