"""Script that raises an exception on frame 5 — tests error recovery."""
import cairo

W, H, FPS, DURATION = 320, 180, 30, 1.0
_frame_counter = [0]


def render(t: float) -> cairo.ImageSurface:
    _frame_counter[0] += 1
    if _frame_counter[0] == 5:
        raise ValueError("Simulated frame render error (frame 5)")
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr   = cairo.Context(surf)
    cr.set_source_rgb(0.2, 0.4, 0.8)
    cr.paint()
    return surf
