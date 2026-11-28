"""Minimal valid render contract — 1-second solid color animation."""
import cairo

W, H, FPS, DURATION = 320, 180, 30, 1.0


def render(t: float) -> cairo.ImageSurface:
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr   = cairo.Context(surf)
    cr.set_source_rgb(t % 1.0, 0.5, 1.0 - (t % 1.0))
    cr.paint()
    return surf
