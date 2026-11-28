"""Test suite for core/preview.py"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.loader import ScriptLoader
from core.preview import PreviewRenderer
from core.progress import QuietProgressReporter

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


class TestPreviewRenderer:
    def test_clamps_timestamps_and_scales_override(self):
        script = ScriptLoader().load(
            os.path.join(FIXTURES, "minimal_script.py"),
            width_override=160,
            height_override=90,
        )
        with tempfile.TemporaryDirectory() as td:
            saved = PreviewRenderer().render_timestamps(
                script, [-5.0, 99.0], td, QuietProgressReporter()
            )
            assert len(saved) == 2
            assert any("000.000s.png" in p for p in saved)
            assert any("001.000s.png" in p for p in saved)

    def test_frame_error_does_not_crash_remaining_previews(self):
        script = ScriptLoader().load(os.path.join(FIXTURES, "minimal_script.py"))
        original = script.render_fn

        def flaky(t: float):
            if t == 0.0:
                raise ValueError("bad first preview")
            return original(t)

        script.render_fn = flaky
        with tempfile.TemporaryDirectory() as td:
            saved = PreviewRenderer().render_timestamps(
                script, [0.0, 0.5], td, QuietProgressReporter()
            )
            assert len(saved) == 1
            assert "000.500s.png" in saved[0]
