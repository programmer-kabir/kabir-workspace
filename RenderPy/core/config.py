"""
core/config.py
==============
Project configuration (renderpy.toml) loader and starter script generator.

Uses Python 3.11+ built-in `tomllib` (zero external dependencies).
"""
from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from typing import Any, Dict, Optional


STARTER_TEMPLATE = '''"""
{title} — RenderPy Animation Script
Run:
    python renderpy.py {filename} --preview 0 1.5 3.0
    python renderpy.py {filename}
"""
import math
import cairo

W        = 1920
H        = 1080
FPS      = 30
DURATION = 4.0


def render(t: float) -> cairo.ImageSurface:
    """Render one frame at timestamp t (seconds)."""
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr = cairo.Context(surf)

    # Background gradient
    bg = cairo.LinearGradient(0, 0, 0, H)
    bg.add_color_stop_rgb(0.0, 0.07, 0.10, 0.18)
    bg.add_color_stop_rgb(1.0, 0.15, 0.22, 0.36)
    cr.set_source(bg)
    cr.paint()

    # Smooth animated circle
    progress = (t % DURATION) / DURATION
    cx = W * (0.15 + 0.70 * (0.5 - 0.5 * math.cos(progress * 2.0 * math.pi)))
    cy = H * 0.5 + math.sin(progress * 4.0 * math.pi) * (H * 0.12)
    radius = min(W, H) * 0.08

    cr.arc(cx, cy, radius, 0, 2.0 * math.pi)
    cr.set_source_rgb(0.98, 0.72, 0.22)
    cr.fill_preserve()
    cr.set_source_rgb(1.0, 0.92, 0.65)
    cr.set_line_width(6.0)
    cr.stroke()

    return surf
'''


@dataclass
class ProjectSettings:
    """Optional defaults loaded from a renderpy.toml file."""

    width:         Optional[int]   = None
    height:        Optional[int]   = None
    fps:           Optional[float] = None
    duration:      Optional[float] = None
    crf:           Optional[int]   = None
    preset:        Optional[str]   = None
    codec:         Optional[str]   = None
    output_format: Optional[str]   = None
    transparent:   Optional[bool]  = None
    workers:       Optional[int]   = None
    ffmpeg_path:   Optional[str]   = None
    audio_path:    Optional[str]   = None


def find_config_file(script_path: Optional[str] = None, explicit_path: Optional[str] = None) -> Optional[str]:
    """
    Locate renderpy.toml:
      1. Explicit --config path (raises FileNotFoundError if missing)
      2. Same directory as the animation script
      3. Current working directory
    """
    if explicit_path:
        abs_cfg = os.path.abspath(explicit_path)
        if not os.path.isfile(abs_cfg):
            raise FileNotFoundError(f"Config file not found: {abs_cfg}")
        return abs_cfg

    candidates = []
    if script_path:
        candidates.append(os.path.join(os.path.dirname(os.path.abspath(script_path)), "renderpy.toml"))
    candidates.append(os.path.join(os.getcwd(), "renderpy.toml"))

    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def load_project_settings(config_path: Optional[str]) -> ProjectSettings:
    """Parse a renderpy.toml file into ProjectSettings."""
    if not config_path:
        return ProjectSettings()

    with open(config_path, "rb") as fh:
        raw: Dict[str, Any] = tomllib.load(fh)

    # Support either top-level keys or a [renderpy] table
    section = raw.get("renderpy", raw)
    if not isinstance(section, dict):
        return ProjectSettings()

    audio = section.get("audio")
    if isinstance(audio, str) and not os.path.isabs(audio):
        audio = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(config_path)), audio))

    return ProjectSettings(
        width         = int(section["width"]) if "width" in section else None,
        height        = int(section["height"]) if "height" in section else None,
        fps           = float(section["fps"]) if "fps" in section else None,
        duration      = float(section["duration"]) if "duration" in section else None,
        crf           = int(section["crf"]) if "crf" in section else None,
        preset        = str(section["preset"]) if "preset" in section else None,
        codec         = str(section["codec"]) if "codec" in section else None,
        output_format = str(section["format"]) if "format" in section else None,
        transparent   = bool(section["transparent"]) if "transparent" in section else None,
        workers       = int(section["workers"]) if "workers" in section else None,
        ffmpeg_path   = str(section["ffmpeg_path"]) if "ffmpeg_path" in section else None,
        audio_path    = audio,
    )


def create_starter_script(target_path: str, overwrite: bool = False) -> str:
    """Write a starter pycairo animation script at target_path."""
    abs_path = os.path.abspath(target_path)
    if not abs_path.endswith(".py"):
        abs_path = f"{abs_path}.py"

    if os.path.exists(abs_path) and not overwrite:
        raise FileExistsError(f"Target file already exists: {abs_path}")

    parent = os.path.dirname(abs_path)
    if parent:
        os.makedirs(parent, exist_ok=True)

    filename = os.path.basename(abs_path)
    title = os.path.splitext(filename)[0].replace("_", " ").title()
    content = STARTER_TEMPLATE.format(title=title, filename=filename)

    with open(abs_path, "w", encoding="utf-8") as fh:
        fh.write(content)
    return abs_path
