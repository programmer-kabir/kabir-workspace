"""
tests/test_bridge.py
====================
Tests for the desktop engine bridge adapter.
"""
import os
import tempfile
import time
import pytest

from desktop.bridge import RenderPyBridge


@pytest.fixture
def bridge() -> RenderPyBridge:
    return RenderPyBridge()


@pytest.fixture
def sample_script() -> str:
    root = os.path.dirname(os.path.dirname(__file__))
    return os.path.join(root, "examples", "bouncing_ball.py")


def test_get_system_info(bridge: RenderPyBridge):
    info = bridge.get_system_info()
    assert "ffmpeg_installed" in info
    assert "supported_codecs" in info
    assert "supported_formats" in info
    assert "mp4" in info["supported_formats"]
    assert "libx264" in info["supported_codecs"]
    assert info["cpu_cores"] >= 1


def test_inspect_script_valid(bridge: RenderPyBridge, sample_script: str):
    data = bridge.inspect_script(sample_script)
    assert data["success"] is True
    assert data["width"] == 1920
    assert data["height"] == 1080
    assert data["fps"] == 30.0
    assert data["duration"] == 4.0
    assert data["frames"] == 120
    assert "bouncing_ball.py" in data["filename"]


def test_inspect_script_not_found(bridge: RenderPyBridge):
    data = bridge.inspect_script("non_existent_file_xyz.py")
    assert data["success"] is False
    assert "FileNotFoundError" in data["error_type"]


def test_render_preview_frame(bridge: RenderPyBridge, sample_script: str):
    res = bridge.render_preview_frame(sample_script, timestamp=1.5, max_width=640)
    assert res["success"] is True
    assert res["timestamp"] == 1.5
    assert res["data_url"].startswith("data:image/png;base64,")
    assert len(res["data_url"]) > 100
    assert res["width"] == 640


def test_start_render_job_and_events(bridge: RenderPyBridge, sample_script: str):
    events = []

    def on_event(event_type, data):
        events.append((event_type, data))

    with tempfile.TemporaryDirectory() as td:
        out_file = os.path.join(td, "bridge_test.mp4")
        res = bridge.start_render(
            {
                "script_path": sample_script,
                "output_path": out_file,
                "duration": 0.5,  # Only render 0.5s (15 frames) for fast test
                "preset": "ultrafast",
            },
            on_event=on_event,
        )
        assert res["success"] is True
        assert res["output_path"] == os.path.abspath(out_file)

        # Wait for background thread to complete
        timeout = 20.0
        start = time.monotonic()
        while time.monotonic() - start < timeout:
            status = bridge.get_render_status()
            if not status["running"]:
                break
            time.sleep(0.1)

        assert not status["running"]
        assert status["error"] is None
        assert os.path.isfile(out_file)
        assert os.path.getsize(out_file) > 0

        # Verify event stream
        event_names = [e[0] for e in events]
        assert "start" in event_names
        assert "progress" in event_names
        assert "finish" in event_names


def test_render_preview_video(bridge: RenderPyBridge, sample_script: str):
    res = bridge.render_preview_video(sample_script, max_width=480, max_duration=1.0)
    assert res["success"] is True
    assert os.path.isfile(res["video_path"])
    assert os.path.getsize(res["video_path"]) > 0
    assert res["width"] == 480
    # Second call should hit cache immediately
    res2 = bridge.render_preview_video(sample_script, max_width=480, max_duration=1.0)
    assert res2["success"] is True
    assert res2["cached"] is True

