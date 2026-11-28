"""Test suite for core/loader.py"""
import os
import sys
import pytest

# Make sure we can import from the project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.loader import ScriptLoader, ScriptLoadError, ContractError, LoadedScript

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def fixture(name: str) -> str:
    return os.path.join(FIXTURES, name)


class TestScriptLoader:

    def test_load_minimal_script(self):
        """Valid script loads successfully and exposes render_fn."""
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"))
        assert isinstance(script, LoadedScript)
        assert callable(script.render_fn)
        assert script.width    == 320
        assert script.height   == 180
        assert script.fps      == 30.0
        assert script.duration == 1.0
        assert script.frames   == 30

    def test_script_summary(self):
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"))
        summary = script.summary()
        assert "320" in summary
        assert "180" in summary
        assert "30" in summary

    def test_missing_file_raises(self):
        loader = ScriptLoader()
        with pytest.raises(FileNotFoundError):
            loader.load("/nonexistent/path/script.py")

    def test_no_render_fn_raises_contract_error(self):
        loader = ScriptLoader()
        with pytest.raises(ContractError, match="render\\(\\)"):
            loader.load(fixture("no_render_script.py"))

    def test_cli_width_override(self):
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"), width_override=1920)
        assert script.width == 1920
        assert script.height == 180  # unchanged

    def test_cli_height_override(self):
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"), height_override=1080)
        assert script.height == 1080

    def test_cli_fps_override(self):
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"), fps_override=60.0)
        assert script.fps    == 60.0
        assert script.frames == 60   # 1.0s × 60fps

    def test_cli_duration_override(self):
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"), duration_override=5.0)
        assert script.duration == 5.0
        assert script.frames   == 150  # 5.0s × 30fps

    def test_render_fn_returns_surface(self):
        import cairo
        loader = ScriptLoader()
        script = loader.load(fixture("minimal_script.py"))
        surf = script.render_fn(0.0)
        assert isinstance(surf, cairo.ImageSurface)

    def test_missing_constants_use_defaults(self):
        """Script without W/H/FPS/DURATION should use loader defaults."""
        # Create a temporary script with only render() defined
        import tempfile, textwrap
        src = textwrap.dedent("""
            import cairo
            def render(t):
                s = cairo.ImageSurface(cairo.FORMAT_ARGB32, 100, 100)
                return s
        """)
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
            f.write(src)
            path = f.name
        try:
            loader = ScriptLoader()
            script = loader.load(path)
            assert script.width    == 3840
            assert script.height   == 2160
            assert script.fps      == 30.0
            assert script.duration == 10.0
        finally:
            os.unlink(path)

    def test_syntax_error_raises_script_load_error(self):
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
            f.write("def render(t:\n    pass\n")
            path = f.name
        try:
            with pytest.raises(ScriptLoadError, match="Syntax error"):
                ScriptLoader().load(path)
        finally:
            os.unlink(path)

    def test_runtime_import_error_raises_script_load_error(self):
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
            f.write("raise RuntimeError('import boom')\n")
            path = f.name
        try:
            with pytest.raises(ScriptLoadError, match="import boom"):
                ScriptLoader().load(path)
        finally:
            os.unlink(path)

    def test_non_callable_render_raises_contract_error(self):
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
            f.write("render = 123\n")
            path = f.name
        try:
            with pytest.raises(ContractError, match="not callable"):
                ScriptLoader().load(path)
        finally:
            os.unlink(path)

    def test_audio_constant_resolved_relative_to_script(self):
        import tempfile
        with tempfile.TemporaryDirectory() as td:
            path = os.path.join(td, "anim.py")
            with open(path, "w", encoding="utf-8") as f:
                f.write("import cairo\nAUDIO = 'bgm.mp3'\ndef render(t): return cairo.ImageSurface(cairo.FORMAT_ARGB32, 10, 10)\n")
            script = ScriptLoader().load(path)
            assert script.audio == os.path.abspath(os.path.join(td, "bgm.mp3"))
