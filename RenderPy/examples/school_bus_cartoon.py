"""
examples/school_bus_cartoon.py
==============================
4K 30fps cartoon animation demonstrating a moving school bus, parallax hills,
drifting clouds, and rotating wheels in pure pycairo.

Run:
    python renderpy.py examples/school_bus_cartoon.py --preview 0 2.5 5.0
    python renderpy.py examples/school_bus_cartoon.py --width 1920 --height 1080 --preset ultrafast
    python renderpy.py examples/school_bus_cartoon.py --workers 4
"""
import math
import cairo

W        = 3840
H        = 2160
FPS      = 30
DURATION = 6.0


def _draw_cloud(cr: cairo.Context, cx: float, cy: float, scale: float) -> None:
    cr.save()
    cr.translate(cx, cy)
    cr.scale(scale, scale)
    cr.set_source_rgba(1.0, 1.0, 1.0, 0.92)
    for ox, oy, r in [(-70, 10, 48), (-20, -18, 62), (45, -8, 55), (90, 14, 42)]:
        cr.arc(ox, oy, r, 0, 2.0 * math.pi)
        cr.fill()
    cr.restore()


def _draw_wheel(cr: cairo.Context, cx: float, cy: float, r: float, angle: float) -> None:
    cr.save()
    cr.translate(cx, cy)
    cr.rotate(angle)

    # Tire
    cr.arc(0, 0, r, 0, 2.0 * math.pi)
    cr.set_source_rgb(0.12, 0.13, 0.15)
    cr.fill()

    # Rim
    cr.arc(0, 0, r * 0.56, 0, 2.0 * math.pi)
    cr.set_source_rgb(0.82, 0.85, 0.88)
    cr.fill()

    # Spokes
    cr.set_source_rgb(0.35, 0.38, 0.42)
    cr.set_line_width(8)
    for k in range(4):
        a = k * (math.pi / 2.0)
        cr.move_to(math.cos(a) * -r * 0.45, math.sin(a) * -r * 0.45)
        cr.line_to(math.cos(a) * r * 0.45, math.sin(a) * r * 0.45)
        cr.stroke()

    cr.arc(0, 0, r * 0.18, 0, 2.0 * math.pi)
    cr.set_source_rgb(0.25, 0.27, 0.30)
    cr.fill()
    cr.restore()


def render(t: float) -> cairo.ImageSurface:
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr = cairo.Context(surf)

    # Sky
    sky = cairo.LinearGradient(0, 0, 0, H * 0.72)
    sky.add_color_stop_rgb(0.0, 0.28, 0.64, 0.96)
    sky.add_color_stop_rgb(1.0, 0.72, 0.90, 1.00)
    cr.set_source(sky)
    cr.paint()

    # Sun
    cr.arc(W * 0.84, H * 0.20, 150, 0, 2.0 * math.pi)
    cr.set_source_rgb(1.0, 0.90, 0.35)
    cr.fill()

    # Drifting clouds
    _draw_cloud(cr, (W * 0.22 - t * 60) % (W + 400) - 200, H * 0.20, 2.0)
    _draw_cloud(cr, (W * 0.62 - t * 40) % (W + 400) - 200, H * 0.30, 1.6)

    # Rolling hills
    cr.move_to(0, H * 0.72)
    for px in range(0, W + 80, 80):
        hy = H * 0.66 + math.sin((px + t * 180) * 0.0022) * 85.0
        cr.line_to(px, hy)
    cr.line_to(W, H)
    cr.line_to(0, H)
    cr.close_path()
    cr.set_source_rgb(0.32, 0.70, 0.36)
    cr.fill()

    # Road
    road_y = H * 0.72
    cr.rectangle(0, road_y, W, H - road_y)
    cr.set_source_rgb(0.20, 0.21, 0.24)
    cr.fill()

    # Dashed road lane line
    cr.set_source_rgb(0.96, 0.82, 0.24)
    dash_offset = (t * 720) % 360
    for dx in range(-360, W + 360, 360):
        cr.rectangle(dx - dash_offset, road_y + (H - road_y) * 0.48, 180, 26)
        cr.fill()

    # Bus motion
    progress = (t % DURATION) / DURATION
    bus_x = -1100 + progress * (W + 2200)
    bounce = math.sin(t * 18.0) * 5.0
    bus_y = road_y - 310 + bounce

    # Bus shadow
    cr.rectangle(bus_x + 40, road_y - 10, 960, 34)
    cr.set_source_rgba(0, 0, 0, 0.28)
    cr.fill()

    # Bus body
    cr.rectangle(bus_x, bus_y, 920, 320)
    cr.set_source_rgb(0.98, 0.74, 0.10)
    cr.fill()

    # Hood
    cr.rectangle(bus_x + 900, bus_y + 120, 140, 200)
    cr.set_source_rgb(0.95, 0.68, 0.08)
    cr.fill()

    # Black trim stripe
    cr.rectangle(bus_x, bus_y + 195, 920, 26)
    cr.set_source_rgb(0.12, 0.12, 0.14)
    cr.fill()

    # Windows
    cr.set_source_rgb(0.76, 0.91, 0.98)
    for wx in range(6):
        cr.rectangle(bus_x + 45 + wx * 138, bus_y + 42, 108, 120)
        cr.fill()

    # Windshield
    cr.rectangle(bus_x + 875, bus_y + 42, 80, 115)
    cr.set_source_rgb(0.76, 0.91, 0.98)
    cr.fill()

    # Headlight
    cr.arc(bus_x + 1030, bus_y + 230, 22, 0, 2.0 * math.pi)
    cr.set_source_rgb(1.0, 0.96, 0.68)
    cr.fill()

    # Rotating wheels
    wheel_angle = (bus_x / 95.0)
    _draw_wheel(cr, bus_x + 210, road_y - 15, 95, wheel_angle)
    _draw_wheel(cr, bus_x + 810, road_y - 15, 95, wheel_angle)

    return surf
