"""Test suite for core/config.py"""
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.config import create_starter_script, find_config_file, load_project_settings
from core.loader import ScriptLoader


class TestConfigLoader:
    def test_find_explicit_missing_raises(self):
        with pytest.raises(FileNotFoundError):
            find_config_file(explicit_path="/nonexistent/renderpy.toml")

    def test_find_and_load_toml_next_to_script(self):
        with tempfile.TemporaryDirectory() as td:
            cfg_path = os.path.join(td, "renderpy.toml")
            script_path = os.path.join(td, "anim.py")
            with open(script_path, "w", encoding="utf-8") as fh:
                fh.write("# dummy\n")
            with open(cfg_path, "w", encoding="utf-8") as fh:
                fh.write(
                    '[renderpy]\n'
                    'preset = "fast"\n'
                    'crf = 20\n'
                    'workers = 2\n'
                    'format = "webm"\n'
                    'transparent = true\n'
                    'audio = "track.mp3"\n'
                )

            found = find_config_file(script_path=script_path)
            assert found == cfg_path
            settings = load_project_settings(found)
            assert settings.preset == "fast"
            assert settings.crf == 20
            assert settings.workers == 2
            assert settings.output_format == "webm"
            assert settings.transparent is True
            assert settings.audio_path == os.path.abspath(os.path.join(td, "track.mp3"))


class TestStarterGenerator:
    def test_create_starter_script_loads_cleanly(self):
        with tempfile.TemporaryDirectory() as td:
            target = os.path.join(td, "demo_anim")
            created = create_starter_script(target)
            assert created.endswith(".py")
            assert os.path.isfile(created)

            loaded = ScriptLoader().load(created)
            surf = loaded.render_fn(0.5)
            assert surf.get_width() == 1920
            assert surf.get_height() == 1080

            with pytest.raises(FileExistsError):
                create_starter_script(created)
