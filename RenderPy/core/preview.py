"""
core/preview.py
===============
Preview mode: render specific timestamps as PNG files.
"""
from __future__ import annotations

import os
import time
from typing import List

from .loader import LoadedScript
from .progress import ProgressReporter
from .renderer import normalize_surface


class PreviewRenderer:
    """Renders one or more specific timestamps to PNG files."""

    def render_timestamps(
        self,
        script:     LoadedScript,
        timestamps: List[float],
        output_dir: str,
        progress:   ProgressReporter,
    ) -> List[str]:
        """Render each timestamp as a PNG file and return saved paths."""
        os.makedirs(output_dir, exist_ok=True)

        stem  = os.path.splitext(os.path.basename(script.script_path))[0]
        saved: List[str] = []
        total = len(timestamps)

        progress.info(f"Preview mode — rendering {total} frame(s) as PNG.")
        progress.start(total, script.summary(), output_dir)

        for idx, t in enumerate(timestamps):
            t_clamped = max(0.0, min(t, script.duration))
            out_path = os.path.join(
                output_dir,
                f"{stem}_preview_{t_clamped:07.3f}s.png",
            )

            try:
                frame_start = time.monotonic()
                raw_surf = script.render_fn(t_clamped)
                surf = normalize_surface(raw_surf, script.width, script.height)
                surf.write_to_png(out_path)
                frame_elapsed = time.monotonic() - frame_start
                progress.update(idx, frame_elapsed)
                progress.info(f"  Saved: {out_path}")
                saved.append(os.path.abspath(out_path))
            except Exception as exc:
                progress.frame_error(idx, exc)
                progress.error(f"  Failed to render t={t_clamped}: {exc}")

        return saved
