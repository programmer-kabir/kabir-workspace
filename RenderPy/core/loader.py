"""
core/loader.py
==============
Imports a user-supplied pycairo animation script via importlib,
extracts the render() function and optional config constants.

Render Contract (mandatory):
    def render(t: float) -> cairo.ImageSurface

Optional module-level constants (auto-discovered):
    W        = int    # output width
    H        = int    # output height
    FPS      = float  # frames per second
    DURATION = float  # total seconds
"""
from __future__ import annotations

import importlib.util
import os
import sys
import types
from dataclasses import dataclass, field
from typing import Callable, Optional

import cairo


# ── Exceptions ───────────────────────────────────────────────────────────────

class ScriptLoadError(RuntimeError):
    """Raised when the script file cannot be imported (syntax error, missing file, etc.)."""


class ContractError(RuntimeError):
    """Raised when the script does not satisfy the render contract."""


# ── Data Structures ───────────────────────────────────────────────────────────

@dataclass
class LoadedScript:
    """Everything RenderPy needs extracted from a compliant script."""

    render_fn:   Callable[[float], cairo.ImageSurface]
    width:       int      # pixels
    height:      int      # pixels
    fps:         float    # frames per second
    duration:    float    # seconds
    frames:      int      # computed: round(duration * fps)
    script_path: str      # absolute path to the .py file
    module:      types.ModuleType = field(repr=False)
    audio:       Optional[str] = None

    # Human-readable summary for progress/log output
    def summary(self) -> str:
        return (
            f"{self.width}×{self.height} @ {self.fps:.0f}fps | "
            f"Duration: {self.duration}s | Frames: {self.frames}"
        )


# ── Defaults ─────────────────────────────────────────────────────────────────

DEFAULT_W        = 3840
DEFAULT_H        = 2160
DEFAULT_FPS      = 30.0
DEFAULT_DURATION = 10.0


# ── Loader ────────────────────────────────────────────────────────────────────

class ScriptLoader:
    """
    Loads a pycairo animation script and validates the render contract.

    Usage:
        loader = ScriptLoader()
        script = loader.load(
            path         = "school_bus_cartoon.py",
            width_override    = None,   # or 1920 to override W
            height_override   = None,
            fps_override      = None,
            duration_override = None,
        )
    """

    def load(
        self,
        path: str,
        width_override:    Optional[int]   = None,
        height_override:   Optional[int]   = None,
        fps_override:      Optional[float] = None,
        duration_override: Optional[float] = None,
    ) -> LoadedScript:
        """
        Import the script at `path` using importlib.

        Args:
            path: Absolute or relative path to a .py animation script.
            width_override:    If set, overrides the script's W constant.
            height_override:   If set, overrides the script's H constant.
            fps_override:      If set, overrides the script's FPS constant.
            duration_override: If set, overrides the script's DURATION constant.

        Returns:
            LoadedScript with render_fn and resolved config.

        Raises:
            FileNotFoundError: Script file does not exist.
            ScriptLoadError:   Import failed (SyntaxError, missing module, etc.).
            ContractError:     render() not found or not callable.
        """
        abs_path = os.path.abspath(path)

        if not os.path.isfile(abs_path):
            raise FileNotFoundError(f"Script not found: {abs_path}")

        mod = self._import_module(abs_path)
        render_fn = self._extract_render_fn(mod, abs_path)

        # Resolve config: CLI override > script constant > default
        w        = width_override    if width_override    is not None else self._get_int(mod,   "W",        DEFAULT_W)
        h        = height_override   if height_override   is not None else self._get_int(mod,   "H",        DEFAULT_H)
        fps      = fps_override      if fps_override      is not None else self._get_float(mod, "FPS",      DEFAULT_FPS)
        duration = duration_override if duration_override is not None else self._get_float(mod, "DURATION", DEFAULT_DURATION)
        frames   = int(round(duration * fps))
        audio    = self._get_audio(mod, os.path.dirname(abs_path))

        return LoadedScript(
            render_fn   = render_fn,
            width       = w,
            height      = h,
            fps         = fps,
            duration    = duration,
            frames      = frames,
            script_path = abs_path,
            module      = mod,
            audio       = audio,
        )

    # ── Private ──────────────────────────────────────────────────────────────

    @staticmethod
    def _import_module(abs_path: str) -> types.ModuleType:
        """Import the script at abs_path, injecting its directory into sys.path."""
        script_dir = os.path.dirname(abs_path)
        if script_dir not in sys.path:
            sys.path.insert(0, script_dir)

        spec = importlib.util.spec_from_file_location("_renderpy_user_script", abs_path)
        if spec is None or spec.loader is None:
            raise ScriptLoadError(f"Cannot create module spec for: {abs_path}")

        mod = importlib.util.module_from_spec(spec)

        try:
            spec.loader.exec_module(mod)   # runs module-level code (TREES, rng, etc.)
        except SyntaxError as exc:
            raise ScriptLoadError(
                f"Syntax error in script:\n  {exc.filename}:{exc.lineno}: {exc.msg}"
            ) from exc
        except Exception as exc:
            raise ScriptLoadError(
                f"Error while importing script '{abs_path}':\n  {type(exc).__name__}: {exc}"
            ) from exc

        return mod

    @staticmethod
    def _extract_render_fn(mod: types.ModuleType, path: str) -> Callable:
        """Extract and validate the render() function from the module."""
        if not hasattr(mod, "render"):
            raise ContractError(
                f"Script '{path}' has no render() function.\n"
                f"Add:  def render(t: float) -> cairo.ImageSurface: ..."
            )
        render_fn = getattr(mod, "render")
        if not callable(render_fn):
            raise ContractError(
                f"'render' in '{path}' is defined but is not callable "
                f"(found {type(render_fn).__name__})."
            )
        return render_fn

    @staticmethod
    def _get_int(mod: types.ModuleType, name: str, default: int) -> int:
        val = getattr(mod, name, default)
        try:
            return int(val)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _get_float(mod: types.ModuleType, name: str, default: float) -> float:
        val = getattr(mod, name, default)
        try:
            return float(val)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _get_audio(mod: types.ModuleType, script_dir: str) -> Optional[str]:
        val = getattr(mod, "AUDIO", None)
        if not val or not isinstance(val, str):
            return None
        if os.path.isabs(val):
            return val
        return os.path.abspath(os.path.join(script_dir, val))
