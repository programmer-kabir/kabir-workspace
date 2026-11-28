"""Test suite for core/progress.py"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.progress import (
    HumanProgressReporter,
    JsonProgressReporter,
    QuietProgressReporter,
    RenderResult,
)


class TestHumanProgressReporter:
    def test_full_lifecycle(self, capsys):
        rep = HumanProgressReporter()
        rep.info("Starting test")
        rep.start(4, "320x180 @ 30fps", "out.mp4")
        rep.update(0, 0.05)
        rep.frame_error(1, ValueError("boom"))
        rep.update(2, 0.04)
        rep.error("Minor error")
        rep.finish(RenderResult(4, 1, 1.5, "out.mp4", cancelled=False, output_size_bytes=2 * 1048576))

        err = capsys.readouterr().err
        assert "[RenderPy] Starting test" in err
        assert "Config:  320x180 @ 30fps" in err
        assert "Frame    1 / 4" in err
        assert "Frame 1 error: ValueError: boom" in err
        assert "[ERROR]    Minor error" in err
        assert "out.mp4 (2.0 MB)" in err
        assert "1 frame(s) had errors" in err

    def test_cancelled_finish(self, capsys):
        rep = HumanProgressReporter()
        rep.start(2, "summary", "out.mp4")
        rep.update(0, 0.1)
        rep.finish(RenderResult(1, 0, 0.1, "out.mp4", cancelled=True))
        err = capsys.readouterr().err
        assert "Render cancelled." in err


class TestJsonProgressReporter:
    def test_json_events(self, capsys):
        rep = JsonProgressReporter()
        rep.info("hello")
        rep.start(2, "summary", "out.mp4")
        rep.update(0, 0.02)
        rep.frame_error(1, RuntimeError("bad"))
        rep.finish(RenderResult(2, 1, 0.5, "out.mp4", cancelled=False, output_size_bytes=1024))
        rep.error("stderr err")

        captured = capsys.readouterr()
        stdout_events = [json.loads(line) for line in captured.out.strip().splitlines()]
        assert [e["event"] for e in stdout_events] == ["info", "start", "frame", "error", "complete"]
        assert stdout_events[-1]["size_bytes"] == 1024
        assert stdout_events[-1]["frames_errored"] == 1

        stderr_event = json.loads(captured.err.strip())
        assert stderr_event == {"event": "error", "message": "stderr err"}

    def test_json_cancelled(self, capsys):
        rep = JsonProgressReporter()
        rep.finish(RenderResult(0, 0, 0.0, "out.mp4", cancelled=True))
        event = json.loads(capsys.readouterr().out.strip())
        assert event == {"event": "cancelled"}


class TestQuietProgressReporter:
    def test_quiet_outputs_only_path_and_errors(self, capsys):
        rep = QuietProgressReporter()
        rep.info("ignored")
        rep.start(2, "summary", "out.mp4")
        rep.update(0, 0.1)
        rep.frame_error(0, ValueError("oops"))
        rep.error("fatal")
        rep.finish(RenderResult(2, 1, 0.2, "out.mp4", cancelled=False))

        captured = capsys.readouterr()
        assert captured.out.strip() == "out.mp4"
        assert "[WARN] Frame 0 error: ValueError: oops" in captured.err
        assert "[ERROR] fatal" in captured.err

    def test_quiet_cancelled_outputs_nothing_to_stdout(self, capsys):
        rep = QuietProgressReporter()
        rep.finish(RenderResult(0, 0, 0.0, "out.mp4", cancelled=True))
        assert capsys.readouterr().out == ""
