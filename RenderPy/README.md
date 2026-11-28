# RenderPy

> Convert any pycairo animation script into a 4K 30fps MP4, WebM, MOV, or PNG sequence. No boilerplate. No FFmpeg knowledge required.

---

## Quick Start

```bash
# Install the one runtime dependency
pip install pycairo

# Render the included example script
python renderpy.py examples/school_bus_cartoon.py
```

That's it. RenderPy auto-discovers resolution, FPS, and duration from your script and produces:
```
school_bus_cartoon_3840x2160_30fps.mp4
```

You can also scaffold a new animation script immediately:
```bash
python renderpy.py --init my_animation.py
```

---

## Requirements

| Requirement | Minimum |
|---|---|
| Python | 3.11+ |
| pycairo | 1.24.0+ |
| FFmpeg | 4.4+ (must be on PATH, optional for `--format png`) |
| OS | Windows 10/11 x64, Linux, macOS |

Verify your setup:
```bash
python renderpy.py --check-ffmpeg
```

---

## The Render Contract

Your script must expose one function:

```python
def render(t: float) -> cairo.ImageSurface:
    """Return one animation frame at time t (seconds)."""
```

Optionally, declare these module-level constants (RenderPy reads them automatically):

```python
W        = 3840    # output width
H        = 2160    # output height
FPS      = 30      # frames per second
DURATION = 10.1    # total duration in seconds
AUDIO    = "track.mp3"  # optional audio track (relative to script)
```

If any are missing, RenderPy falls back to CLI flags, `renderpy.toml`, or built-in defaults (3840×2160 @ 30fps, 10s).

---

## Usage

### Full Render

```bash
python renderpy.py examples/school_bus_cartoon.py
python renderpy.py examples/bouncing_ball.py --output my_video.mp4
```

### Quick Draft (1080p, fast encode)

```bash
python renderpy.py examples/school_bus_cartoon.py --width 1920 --height 1080 --preset ultrafast --crf 28
```

### Parallel Rendering & GPU Encoding

```bash
# Render frames across 4 worker processes
python renderpy.py examples/school_bus_cartoon.py --workers 4

# Encode with NVIDIA NVENC (when supported by your GPU/FFmpeg)
python renderpy.py examples/school_bus_cartoon.py --codec h264_nvenc --workers 4
```

### Audio, Transparency & Alternative Formats

```bash
# Mux an audio track into MP4
python renderpy.py animation.py --audio soundtrack.mp3

# Transparent WebM (VP9 with alpha channel)
python renderpy.py animation.py --format webm --transparent

# Apple ProRes 4444 MOV with alpha
python renderpy.py animation.py --format mov --transparent

# Export numbered PNG sequence (no FFmpeg required)
python renderpy.py animation.py --format png --output ./frames
```

### Preview Specific Timestamps

```bash
python renderpy.py examples/bouncing_ball.py --preview 0 1.5 3.0
python renderpy.py examples/bouncing_ball.py --preview 1.5 --preview-dir ./previews
```

### Partial Render & Validation

```bash
python renderpy.py animation.py --start-frame 100 --end-frame 200
python renderpy.py animation.py --dry-run
python renderpy.py animation.py --json-progress 2>/dev/null
```

---

## Configuration File (`renderpy.toml`)

Place an optional `renderpy.toml` in your project or script directory (or pass `--config path/to/renderpy.toml`):

```toml
[renderpy]
preset = "fast"
crf = 18
workers = 4
format = "mp4"
codec = "libx264"
```

---

## All Options

```
positional:
  script                    Path to the pycairo animation script

render control:
  --output PATH             Output file path (or directory for --format png)
  --width INT               Override script W
  --height INT              Override script H
  --fps FLOAT               Override script FPS
  --duration FLOAT          Override script DURATION
  --start-frame INT         First frame index (default: 0)
  --end-frame INT           Last frame index inclusive (default: last)
  --crf INT                 Quality CRF/CQ 0-51 (default: 16)
  --preset PRESET           ultrafast..veryslow (default: medium)
  --codec CODEC             libx264|h264_nvenc|libx265|libvpx-vp9|prores_ks
  --format FORMAT           mp4|webm|mov|png (default: mp4)
  --transparent             Preserve alpha channel (webm/mov/png)
  --audio PATH              Optional audio file to mux into video
  --workers INT             Parallel render workers (default: 1)

preview:
  --preview T [T ...]       Timestamps to render as PNG
  --preview-dir PATH        Directory for PNG output

progress:
  --json-progress           JSON lines to stdout (CI mode)
  --quiet / -q              Suppress all output except errors and final path
  --verbose / -v            Per-frame diagnostics

validation & scaffolding:
  --dry-run                 Validate without rendering
  --check-ffmpeg            Check FFmpeg installation
  --init PATH               Create a starter animation script

advanced:
  --config PATH             Path to renderpy.toml
  --ffmpeg-path PATH        Override FFmpeg binary location
  --keep-partial            Keep partial output file on cancel
```

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Script error (missing `render()`, exception) |
| `2` | Configuration error (bad args, odd resolution) |
| `3` | FFmpeg error (not found, encode failure) |
| `4` | I/O error (disk full, path not writable) |
| `130` | Cancelled by user (Ctrl+C) |

---

## Project Structure

```
RenderPy/
├── renderpy.py                  ← CLI entrypoint
├── pyproject.toml               ← Package metadata & tooling config
├── core/
│   ├── config.py                ← renderpy.toml loader & --init generator
│   ├── loader.py                ← Script importer & config extractor
│   ├── pipeline.py              ← FFmpeg & PNG sequence pipelines
│   ├── renderer.py              ← Frame loop, scaling & multiprocessing workers
│   ├── progress.py              ← Human / JSON / Quiet reporters
│   ├── validator.py             ← Pre-render validation
│   └── preview.py               ← --preview mode
├── examples/
│   ├── bouncing_ball.py
│   └── school_bus_cartoon.py
└── tests/
    ├── fixtures/
    ├── test_cli.py
    ├── test_config.py
    ├── test_loader.py
    ├── test_pipeline.py
    ├── test_preview.py
    ├── test_progress.py
    ├── test_renderer.py
    └── test_validator.py
```

---

## Running Tests

```bash
pip install -r requirements-dev.txt
pytest tests/ -v --cov=core --cov-report=term-missing
```

---

*RenderPy v1.1 — Built for pycairo animation authors.*
