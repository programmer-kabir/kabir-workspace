"""
examples/bouncing_ball.py
=========================
Minimal example animation demonstrating the RenderPy contract.

Run:
    python renderpy.py examples/bouncing_ball.py --preview 0 1.5 3.0
    python renderpy.py examples/bouncing_ball.py --width 1280 --height 720 --preset ultrafast
"""
import math
import cairo

W        = 1920
H        = 1080
FPS      = 30
DURATION = 4.0


def render(t: float) -> cairo.ImageSurface:
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr = cairo.Context(surf)

    # Sky background
    sky = cairo.LinearGradient(0, 0, 0, H)
    sky.add_color_stop_rgb(0.0, 0.08, 0.14, 0.28)
    sky.add_color_stop_rgb(1.0, 0.20, 0.35, 0.58)
    cr.set_source(sky)
    cr.paint()

    # Ground
    ground_y = H * 0.80
    cr.rectangle(0, ground_y, W, H - ground_y)
    cr.set_source_rgb(0.14, 0.20, 0.24)
    cr.fill()

    # Ball trajectory
    progress = (t % DURATION) / DURATION
    x = W * (0.12 + 0.76 * progress)
    bounce = abs(math.sin(progress * math.pi * 3.0))
    radius = 64.0
    y = ground_y - radius - bounce * (H * 0.45)

    # Contact shadow
    shadow_scale = 1.0 - 0.55 * bounce
    cr.save()
    cr.translate(x, ground_y + 8)
    cr.scale(shadow_scale * 1.4, shadow_scale * 0.35)
    cr.arc(0, 0, radius, 0, 2.0 * math.pi)
    cr.set_source_rgba(0, 0, 0, 0.35 * shadow_scale)
    cr.fill()
    cr.restore()

    # Ball with radial highlight
    grad = cairo.RadialGradient(
        x - radius * 0.3, y - radius * 0.3, radius * 0.1,
        x, y, radius,
    )
    grad.add_color_stop_rgb(0.0, 1.0, 0.88, 0.45)
    grad.add_color_stop_rgb(0.7, 0.95, 0.45, 0.15)
    grad.add_color_stop_rgb(1.0, 0.65, 0.18, 0.08)
    cr.arc(x, y, radius, 0, 2.0 * math.pi)
    cr.set_source(grad)
    cr.fill()

    return surf
