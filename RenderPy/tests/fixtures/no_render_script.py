"""Script with no render() function — tests ContractError detection."""
import cairo

W, H, FPS, DURATION = 320, 180, 30, 1.0


def not_render(t: float) -> cairo.ImageSurface:
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    return surf
