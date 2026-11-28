"""Test suite for core/pipeline.py"""
import io
import os
import subprocess
import sys
import tempfile
from unittest.mock import MagicMock, patch

import cairo
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.pipeline import (
    FFmpegNotFoundError,
    FFmpegPipeline,
    ImageSequencePipeline,
    PipelineError,
    RenderConfig,
    create_pipeline,
)


class TestCommandConstruction:
    def test_libx264_default_command(self):
        cfg = RenderConfig(width=1920, height=1080, fps=30, output_path="out.mp4")
        cmd = FFmpegPipeline(cfg)._build_command()
        assert "-c:v" in cmd and "libx264" in cmd
        assert "-pix_fmt" in cmd and "yuv420p" in cmd
        assert cmd[-1] == "out.mp4"

    def test_nvenc_command(self):
        cfg = RenderConfig(width=1920, height=1080, fps=30, codec="h264_nvenc", preset="fast", crf=20)
        cmd = FFmpegPipeline(cfg)._build_command()
        assert "h264_nvenc" in cmd
        assert "-cq" in cmd
        assert "p4" in cmd

    def test_libx265_command(self):
        cfg = RenderConfig(width=1920, height=1080, fps=30, codec="libx265")
        cmd = FFmpegPipeline(cfg)._build_command()
        assert "libx265" in cmd
        assert "hvc1" in cmd

    def test_vp9_transparent_command(self):
        cfg = RenderConfig(
            width=640, height=360, fps=30,
            codec="libvpx-vp9", output_format="webm", transparent=True,
        )
        cmd = FFmpegPipeline(cfg)._build_command()
        assert "libvpx-vp9" in cmd
        assert "yuva420p" in cmd

    def test_prores_transparent_and_audio_command(self):
        cfg = RenderConfig(
            width=640, height=360, fps=30,
            codec="prores_ks", output_format="mov", transparent=True, audio_path="sound.wav",
        )
        cmd = FFmpegPipeline(cfg)._build_command()
        assert "prores_ks" in cmd
        assert "yuva444p10le" in cmd
        assert "sound.wav" in cmd
        assert "pcm_s16le" in cmd
        assert "-shortest" in cmd


class TestFFmpegDetection:
    def test_override_missing_raises(self):
        with pytest.raises(FFmpegNotFoundError):
            FFmpegPipeline.detect_ffmpeg("/nonexistent/ffmpeg.exe")

    def test_which_not_found_raises(self):
        with patch("core.pipeline.shutil.which", return_value=None):
            with pytest.raises(FFmpegNotFoundError):
                FFmpegPipeline.detect_ffmpeg()

    def test_get_ffmpeg_version_parses_stdout(self):
        mock_res = MagicMock(stdout="ffmpeg version 7.1.0 Copyright\n")
        with patch("core.pipeline.subprocess.run", return_value=mock_res):
            assert FFmpegPipeline.get_ffmpeg_version("ffmpeg") == "7.1.0"

    def test_get_ffmpeg_version_unknown_on_error(self):
        with patch("core.pipeline.subprocess.run", side_effect=OSError("fail")):
            assert FFmpegPipeline.get_ffmpeg_version("ffmpeg") == "(unknown)"


class TestPipelineLifecycle:
    def test_write_before_open_raises(self):
        pipe = FFmpegPipeline(RenderConfig(width=64, height=64, fps=30))
        with pytest.raises(PipelineError, match="not open"):
            pipe.write_raw_frame(b"\x00" * 64 * 64 * 4)

    def test_open_missing_binary_raises(self):
        pipe = FFmpegPipeline(RenderConfig(width=64, height=64, fps=30, ffmpeg_path="nonexistent_ff"))
        with patch("core.pipeline.subprocess.Popen", side_effect=FileNotFoundError()):
            with pytest.raises(FFmpegNotFoundError):
                pipe.open()

    def test_open_write_close_success_with_mock_popen(self):
        mock_proc = MagicMock()
        mock_proc.stdin = io.BytesIO()
        mock_proc.stderr = io.BytesIO(b"warning line\n")
        mock_proc.poll.return_value = None
        mock_proc.returncode = 0

        with patch("core.pipeline.subprocess.Popen", return_value=mock_proc):
            pipe = FFmpegPipeline(RenderConfig(width=32, height=32, fps=30))
            pipe.open()
            surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, 32, 32)
            pipe.write_frame(surf)
            assert pipe.close() == 0
            assert any("warning line" in line for line in pipe.get_stderr())

    def test_write_broken_pipe_raises_pipeline_error(self):
        mock_proc = MagicMock()
        mock_proc.stdin = MagicMock()
        mock_proc.stdin.write.side_effect = BrokenPipeError("broken")
        mock_proc.stderr = io.BytesIO(b"codec error\n")
        mock_proc.poll.return_value = None

        with patch("core.pipeline.subprocess.Popen", return_value=mock_proc):
            pipe = FFmpegPipeline(RenderConfig(width=32, height=32, fps=30))
            pipe.open()
            with pytest.raises(PipelineError, match="Frame write to FFmpeg failed"):
                pipe.write_raw_frame(b"\x00" * 1024)

    def test_close_nonzero_exit_raises(self):
        mock_proc = MagicMock()
        mock_proc.stdin = io.BytesIO()
        mock_proc.stderr = io.BytesIO(b"encode failed\n")
        mock_proc.returncode = 1

        with patch("core.pipeline.subprocess.Popen", return_value=mock_proc):
            pipe = FFmpegPipeline(RenderConfig(width=32, height=32, fps=30))
            pipe.open()
            with pytest.raises(PipelineError, match="exited with code 1"):
                pipe.close()

    def test_terminate_kills_on_timeout(self):
        mock_proc = MagicMock()
        mock_proc.stdin = io.BytesIO()
        mock_proc.stderr = io.BytesIO(b"")
        mock_proc.wait.side_effect = subprocess.TimeoutExpired(cmd="ffmpeg", timeout=5)

        with patch("core.pipeline.subprocess.Popen", return_value=mock_proc):
            pipe = FFmpegPipeline(RenderConfig(width=32, height=32, fps=30))
            pipe.open()
            pipe.terminate()
            mock_proc.kill.assert_called_once()


class TestImageSequencePipeline:
    def test_writes_numbered_pngs(self):
        with tempfile.TemporaryDirectory() as td:
            cfg = RenderConfig(width=64, height=32, fps=30, output_path=td, output_format="png")
            pipe = create_pipeline(cfg)
            assert isinstance(pipe, ImageSequencePipeline)
            pipe.open()
            surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, 64, 32)
            pipe.write_frame(surf)
            pipe.write_raw_frame(bytes(surf.get_data()))
            assert pipe.close() == 0
            assert os.path.isfile(os.path.join(td, "frame_000000.png"))
            assert os.path.isfile(os.path.join(td, "frame_000001.png"))
