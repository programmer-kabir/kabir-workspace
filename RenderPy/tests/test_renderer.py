"""Test suite for core/renderer.py"""
import os
import sys
import threading
from typing import List

import cairo
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.loader import ScriptLoader
from core.pipeline import PipelineError, RenderConfig
from core.progress import QuietProgressReporter
from core.renderer import FrameRenderer, normalize_surface

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def fixture(name: str) -> str:
    return os.path.join(FIXTURES, name)


class FakePipeline:
    def __init__(self, fail_on_frame: int | None = None) -> None:
        self.frames: List[bytes] = []
        self.fail_on_frame = fail_on_frame

    def open(self) -> None:
        pass

    def write_frame(self, surface: cairo.ImageSurface) -> None:
        surface.flush()
        self.write_raw_frame(bytes(surface.get_data()))

    def write_raw_frame(self, data: bytes) -> None:
        if self.fail_on_frame is not None and len(self.frames) == self.fail_on_frame:
            raise PipelineError("Simulated FFmpeg crash")
        self.frames.append(data)

    def close(self) -> int:
        return 0

    def terminate(self) -> None:
        pass

    def get_stderr(self) -> List[str]:
        return []


class TestNormalizeSurface:
    def test_exact_match_is_zero_copy(self):
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, 64, 32)
        assert normalize_surface(surf, 64, 32) is surf

    def test_scales_mismatched_dimensions(self):
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, 64, 32)
        out = normalize_surface(surf, 128, 64)
        assert out.get_width() == 128
        assert out.get_height() == 64
        assert out.get_format() == cairo.FORMAT_ARGB32

    def test_converts_non_argb32_format(self):
        surf = cairo.ImageSurface(cairo.FORMAT_RGB24, 64, 32)
        out = normalize_surface(surf, 64, 32)
        assert out.get_format() == cairo.FORMAT_ARGB32

    def test_invalid_return_type_raises(self):
        with pytest.raises(TypeError, match="cairo.ImageSurface"):
            normalize_surface("not a surface", 64, 32)


class TestFrameRenderer:
    def test_sequential_partial_range(self):
        script = ScriptLoader().load(fixture("minimal_script.py"))
        cfg = RenderConfig(width=320, height=180, fps=30.0)
        pipe = FakePipeline()
        res = FrameRenderer().render_all(
            script, pipe, cfg, QuietProgressReporter(), threading.Event(),
            start_frame=5, end_frame=9,
        )
        assert res.frames_rendered == 5
        assert res.frames_errored == 0
        assert res.cancelled is False
        assert len(pipe.frames) == 5

    def test_empty_range_returns_zero_frames(self):
        script = ScriptLoader().load(fixture("minimal_script.py"))
        cfg = RenderConfig(width=320, height=180, fps=30.0)
        pipe = FakePipeline()
        res = FrameRenderer().render_all(
            script, pipe, cfg, QuietProgressReporter(), threading.Event(),
            start_frame=10, end_frame=5,
        )
        assert res.frames_rendered == 0
        assert len(pipe.frames) == 0

    def test_cancel_event_stops_render(self):
        script = ScriptLoader().load(fixture("minimal_script.py"))
        cfg = RenderConfig(width=320, height=180, fps=30.0)
        pipe = FakePipeline()
        cancel = threading.Event()
        cancel.set()
        res = FrameRenderer().render_all(
            script, pipe, cfg, QuietProgressReporter(), cancel,
        )
        assert res.cancelled is True
        assert res.frames_rendered == 0

    def test_abort_when_too_many_frame_errors(self):
        script = ScriptLoader().load(fixture("minimal_script.py"))
        # Replace render_fn with one that always raises
        script.render_fn = lambda t: (_ for _ in ()).throw(RuntimeError("boom"))
        cfg = RenderConfig(width=320, height=180, fps=30.0)
        pipe = FakePipeline()
        res = FrameRenderer().render_all(
            script, pipe, cfg, QuietProgressReporter(), threading.Event(),
            start_frame=0, end_frame=9,   # 10 frames -> max_errors = 1 -> aborts on 2nd error
        )
        assert res.cancelled is True
        assert res.frames_errored == 2

    def test_pipeline_error_bubbles_up(self):
        script = ScriptLoader().load(fixture("minimal_script.py"))
        cfg = RenderConfig(width=320, height=180, fps=30.0)
        pipe = FakePipeline(fail_on_frame=2)
        with pytest.raises(PipelineError, match="Simulated FFmpeg crash"):
            FrameRenderer().render_all(
                script, pipe, cfg, QuietProgressReporter(), threading.Event(),
            )

    def test_parallel_workers_render_all_frames(self):
        script = ScriptLoader().load(fixture("minimal_script.py"))
        cfg = RenderConfig(width=320, height=180, fps=30.0, workers=2)
        pipe = FakePipeline()
        res = FrameRenderer().render_all(
            script, pipe, cfg, QuietProgressReporter(), threading.Event(),
            start_frame=0, end_frame=7,
        )
        assert res.cancelled is False
        assert res.frames_rendered == 8
        assert len(pipe.frames) == 8

    def test_parallel_workers_error_recovery(self):
        script = ScriptLoader().load(fixture("error_frame_script.py"))
        cfg = RenderConfig(width=320, height=180, fps=30.0, workers=2)
        pipe = FakePipeline()
        res = FrameRenderer().render_all(
            script, pipe, cfg, QuietProgressReporter(), threading.Event(),
            start_frame=0, end_frame=29,
        )
        assert res.cancelled is False
        assert res.frames_rendered == 30
        assert res.frames_errored >= 1
        assert len(pipe.frames) == 30
