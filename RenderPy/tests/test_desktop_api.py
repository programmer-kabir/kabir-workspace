"""
tests/test_desktop_api.py
=========================
Unit tests for DesktopAppAPI exposed to the webview JS runtime.
"""
import os
import pytest

from desktop.app import DesktopAppAPI
from desktop.bridge import RenderPyBridge


@pytest.fixture
def app_api() -> DesktopAppAPI:
    bridge = RenderPyBridge()
    return DesktopAppAPI(bridge)


@pytest.fixture
def sample_script() -> str:
    root = os.path.dirname(os.path.dirname(__file__))
    return os.path.join(root, "examples", "bouncing_ball.py")


def test_api_get_system_info(app_api: DesktopAppAPI):
    info = app_api.get_system_info()
    assert "supported_codecs" in info
    assert "supported_formats" in info
    assert isinstance(info["ffmpeg_installed"], bool)


def test_api_inspect_script(app_api: DesktopAppAPI, sample_script: str):
    res = app_api.inspect_script(sample_script)
    assert res["success"] is True
    assert res["width"] == 1920
    assert res["height"] == 1080
    assert res["frames"] == 120


def test_api_render_preview_frame(app_api: DesktopAppAPI, sample_script: str):
    res = app_api.render_preview_frame(sample_script, timestamp=1.0, max_width=640)
    assert res["success"] is True
    assert res["data_url"].startswith("data:image/png;base64,")


def test_api_dialogs_without_window_return_none(app_api: DesktopAppAPI):
    # Without an open window, dialog methods should return None safely without raising
    assert app_api.select_script_dialog() is None
    assert app_api.select_audio_dialog() is None
    assert app_api.select_output_dialog() is None
