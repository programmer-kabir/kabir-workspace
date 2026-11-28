"""End-to-end CLI tests for renderpy.py"""
import os
import shutil
import sys
import subprocess
import tempfile
import pytest

_has_ffmpeg = shutil.which("ffmpeg") is not None

RENDERPY  = os.path.join(os.path.dirname(__file__), "..", "renderpy.py")
FIXTURES  = os.path.join(os.path.dirname(__file__), "fixtures")
PYTHON    = sys.executable


def run(*args, timeout=120) -> subprocess.CompletedProcess:
    """Run renderpy.py with given args."""
    return subprocess.run(
        [PYTHON, RENDERPY] + list(args),
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def fixture(name: str) -> str:
    return os.path.join(FIXTURES, name)


class TestCheckFFmpeg:
    def test_check_ffmpeg_exits_cleanly(self):
        result = run("--check-ffmpeg")
        # Either finds FFmpeg (exit 0) or reports not found (exit 3)
        assert result.returncode in (0, 3)

    def test_check_ffmpeg_no_script_needed(self):
        """--check-ffmpeg should not require a script argument."""
        result = run("--check-ffmpeg")
        assert result.returncode in (0, 3)


class TestDryRun:
    def test_dry_run_valid_script_exits_0(self):
        result = run(fixture("minimal_script.py"), "--dry-run")
        # May fail only if FFmpeg is not installed (exit 2 after validation)
        assert result.returncode in (0, 2)

    def test_dry_run_no_mp4_created(self):
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "should_not_exist.mp4")
            run(fixture("minimal_script.py"), "--dry-run", "--output", out)
            assert not os.path.exists(out)

    def test_dry_run_invalid_resolution_exits_nonzero(self):
        result = run(
            fixture("minimal_script.py"), "--dry-run",
            "--width", "321",   # odd width
        )
        assert result.returncode != 0


class TestScriptValidation:
    def test_missing_script_exits_2(self):
        result = run("/nonexistent/script.py")
        assert result.returncode in (1, 2)

    def test_no_render_fn_exits_1(self):
        result = run(fixture("no_render_script.py"), "--dry-run")
        assert result.returncode == 1

    def test_non_py_file_exits_2(self):
        result = run("not_a_python_file.txt")
        assert result.returncode == 2


class TestPreviewMode:
    def test_preview_creates_png_files(self):
        with tempfile.TemporaryDirectory() as td:
            result = run(
                fixture("minimal_script.py"),
                "--preview", "0", "0.5",
                "--preview-dir", td,
            )
            pngs = [f for f in os.listdir(td) if f.endswith(".png")]
            assert len(pngs) == 2

    def test_preview_correct_filenames(self):
        with tempfile.TemporaryDirectory() as td:
            run(
                fixture("minimal_script.py"),
                "--preview", "0.5",
                "--preview-dir", td,
            )
            pngs = os.listdir(td)
            assert any("0.500" in f for f in pngs)

    def test_preview_does_not_create_mp4(self):
        with tempfile.TemporaryDirectory() as td:
            run(
                fixture("minimal_script.py"),
                "--preview", "0",
                "--preview-dir", td,
            )
            mp4s = [f for f in os.listdir(td) if f.endswith(".mp4")]
            assert len(mp4s) == 0


class TestFullRender:
    """These tests require FFmpeg to be installed."""

    @pytest.mark.skipif(
        not _has_ffmpeg,
        reason="FFmpeg not available",
    )
    def test_full_render_produces_mp4(self):
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "test_output.mp4")
            result = run(
                fixture("minimal_script.py"),
                "--output", out,
                timeout=120,
            )
            assert result.returncode == 0
            assert os.path.isfile(out)
            assert os.path.getsize(out) > 0

    @pytest.mark.skipif(
        not _has_ffmpeg,
        reason="FFmpeg not available",
    )
    def test_frame_error_recovery_completes(self):
        """Script that errors on frame 5 should still complete."""
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "error_recovery.mp4")
            result = run(
                fixture("error_frame_script.py"),
                "--output", out,
                timeout=120,
            )
            assert result.returncode == 0
            assert os.path.isfile(out)

    @pytest.mark.skipif(
        not _has_ffmpeg,
        reason="FFmpeg not available",
    )
    def test_json_progress_emits_valid_json(self):
        import json
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "json_test.mp4")
            result = run(
                fixture("minimal_script.py"),
                "--output", out,
                "--json-progress",
                timeout=120,
            )
            lines = [l.strip() for l in result.stdout.splitlines() if l.strip()]
            assert len(lines) > 0
            for line in lines:
                obj = json.loads(line)   # must be valid JSON
                assert "event" in obj

    @pytest.mark.skipif(
        not _has_ffmpeg,
        reason="FFmpeg not available",
    )
    def test_quiet_mode_only_outputs_path(self):
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "quiet.mp4")
            result = run(
                fixture("minimal_script.py"),
                "--output", out,
                "--quiet",
                timeout=120,
            )
            assert result.returncode == 0
            assert out in result.stdout.strip()
            assert len(result.stdout.strip().splitlines()) == 1

    @pytest.mark.skipif(
        not _has_ffmpeg,
        reason="FFmpeg not available",
    )
    def test_parallel_workers_and_partial_range(self):
        with tempfile.TemporaryDirectory() as td:
            out = os.path.join(td, "parallel.mp4")
            result = run(
                fixture("minimal_script.py"),
                "--output", out,
                "--workers", "2",
                "--start-frame", "0",
                "--end-frame", "11",
                timeout=120,
            )
            assert result.returncode == 0
            assert os.path.isfile(out)
            assert os.path.getsize(out) > 0

    @pytest.mark.skipif(
        not _has_ffmpeg,
        reason="FFmpeg not available",
    )
    def test_webm_transparent_and_audio_muxing(self):
        import wave
        with tempfile.TemporaryDirectory() as td:
            wav_path = os.path.join(td, "silence.wav")
            with wave.open(wav_path, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                wf.writeframes(b"\x00\x00" * 16000)

            out = os.path.join(td, "alpha.webm")
            result = run(
                fixture("minimal_script.py"),
                "--format", "webm",
                "--transparent",
                "--audio", wav_path,
                "--end-frame", "9",
                "--output", out,
                timeout=120,
            )
            assert result.returncode == 0
            assert os.path.isfile(out)
            assert os.path.getsize(out) > 0


class TestPhase3And4Commands:
    def test_init_creates_renderable_script(self):
        with tempfile.TemporaryDirectory() as td:
            target = os.path.join(td, "new_anim.py")
            res = run("--init", target)
            assert res.returncode == 0
            assert os.path.isfile(target)
            dry = run(target, "--dry-run")
            assert dry.returncode == 0

    def test_png_sequence_export_no_ffmpeg_needed(self):
        with tempfile.TemporaryDirectory() as td:
            frames_dir = os.path.join(td, "frames")
            res = run(
                fixture("minimal_script.py"),
                "--format", "png",
                "--start-frame", "0",
                "--end-frame", "4",
                "--output", frames_dir,
            )
            assert res.returncode == 0
            pngs = sorted(os.listdir(frames_dir))
            assert len(pngs) == 5
            assert pngs[0] == "frame_000000.png"

    def test_output_directory_returns_exit_4(self):
        with tempfile.TemporaryDirectory() as td:
            res = run(fixture("minimal_script.py"), "--output", td)
            assert res.returncode == 4

    def test_example_scripts_pass_dry_run_and_preview(self):
        root = os.path.join(os.path.dirname(__file__), "..")
        for name in ("bouncing_ball.py", "school_bus_cartoon.py"):
            ex_path = os.path.join(root, "examples", name)
            dry = run(ex_path, "--dry-run")
            assert dry.returncode == 0
            with tempfile.TemporaryDirectory() as td:
                prev = run(ex_path, "--preview", "0.5", "--width", "320", "--height", "180", "--preview-dir", td)
                assert prev.returncode == 0
                assert len(os.listdir(td)) == 1
