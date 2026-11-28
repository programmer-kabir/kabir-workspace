"""Test suite for core/validator.py"""
import os
import sys
import pytest
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.loader    import ScriptLoader
from core.pipeline  import RenderConfig
from core.validator import PreflightValidator

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def fixture(name: str) -> str:
    return os.path.join(FIXTURES, name)


def make_config(**kwargs) -> RenderConfig:
    defaults = dict(
        width=320, height=180, fps=30.0, crf=16,
        preset="slow", output_path=tempfile.mktemp(suffix=".mp4"),
        ffmpeg_path="ffmpeg",
    )
    defaults.update(kwargs)
    return RenderConfig(**defaults)


def load_minimal():
    return ScriptLoader().load(fixture("minimal_script.py"))


class TestPreflightValidator:

    def test_valid_config_passes(self):
        script  = load_minimal()
        config  = make_config()
        report  = PreflightValidator().validate(script, config, dry_run=True)
        # FFmpeg check may warn if not installed — only check no hard errors from resolution/contract
        non_ffmpeg_errors = [
            i for i in report.errors()
            if i.code not in ("FFMPEG_NOT_FOUND", "FFMPEG_NOT_EXECUTABLE")
        ]
        assert len(non_ffmpeg_errors) == 0

    def test_odd_width_is_error(self):
        script = load_minimal()
        config = make_config(width=321)
        report = PreflightValidator().validate(script, config, dry_run=True)
        codes  = [i.code for i in report.errors()]
        assert "ODD_RESOLUTION" in codes

    def test_odd_height_is_error(self):
        script = load_minimal()
        config = make_config(height=181)
        report = PreflightValidator().validate(script, config, dry_run=True)
        codes  = [i.code for i in report.errors()]
        assert "ODD_RESOLUTION" in codes

    def test_output_is_directory_is_error(self):
        script = load_minimal()
        config = make_config(output_path=tempfile.gettempdir())
        report = PreflightValidator().validate(script, config, dry_run=False)
        codes  = [i.code for i in report.errors()]
        assert "OUTPUT_IS_DIRECTORY" in codes

    def test_report_has_errors_property(self):
        script = load_minimal()
        config = make_config(width=321, height=181)
        report = PreflightValidator().validate(script, config, dry_run=True)
        assert report.has_errors is True

    def test_report_no_errors_returns_false(self):
        script = load_minimal()
        config = make_config()
        report = PreflightValidator().validate(script, config, dry_run=True)
        non_ffmpeg = [i for i in report.errors() if "FFMPEG" not in i.code]
        assert len(non_ffmpeg) == 0

    def test_invalid_frame_range_is_error(self):
        script = load_minimal()
        config = make_config()
        report = PreflightValidator().validate(script, config, dry_run=True, start_frame=10, end_frame=5)
        codes = [i.code for i in report.errors()]
        assert "INVALID_FRAME_RANGE" in codes

    def test_transparent_mp4_is_error(self):
        script = load_minimal()
        config = make_config(transparent=True, output_format="mp4")
        report = PreflightValidator().validate(script, config, dry_run=True)
        codes = [i.code for i in report.errors()]
        assert "ALPHA_NOT_SUPPORTED" in codes

    def test_missing_audio_is_error(self):
        script = load_minimal()
        config = make_config(audio_path="/nonexistent/audio.wav")
        report = PreflightValidator().validate(script, config, dry_run=True)
        codes = [i.code for i in report.errors()]
        assert "AUDIO_NOT_FOUND" in codes

    def test_png_format_skips_even_resolution_and_checks_dir(self):
        script = load_minimal()
        with tempfile.TemporaryDirectory() as td:
            out_dir = os.path.join(td, "frames")
            config = make_config(width=321, height=181, output_format="png", output_path=out_dir)
            report = PreflightValidator().validate(script, config, dry_run=False)
            assert not report.has_errors

    def test_low_disk_space_warning(self):
        from collections import namedtuple
        from unittest.mock import patch

        script = load_minimal()
        config = make_config()
        Usage = namedtuple("Usage", ["total", "used", "free"])
        with patch("core.validator.shutil.disk_usage", return_value=Usage(1000, 999, 1024)):
            report = PreflightValidator().validate(script, config, dry_run=False)
        assert any(w.code == "LOW_DISK_SPACE" for w in report.warnings())

    def test_has_io_errors_flag(self):
        script = load_minimal()
        config = make_config(output_path=tempfile.gettempdir())
        report = PreflightValidator().validate(script, config, dry_run=False)
        assert report.has_io_errors is True
