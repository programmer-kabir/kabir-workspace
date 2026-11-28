"""
desktop/app.py
==============
Entry point for the RenderPy Desktop Application.
Spawns a native desktop window using pywebview and wires the frontend
to the RenderPyBridge engine.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.request
from typing import Any, Dict, List, Optional

# Ensure project root is on sys.path so 'desktop' and 'core' imports work
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import webview
from desktop.bridge import RenderPyBridge


class DesktopAppAPI:
    """Methods exposed directly to the JavaScript environment via `window.pywebview.api`."""

    def __init__(self, bridge: RenderPyBridge) -> None:
        self._bridge = bridge
        self.window: Optional[webview.Window] = None

    def set_window(self, window: webview.Window) -> None:
        self.window = window

    # ── File Dialogs ──────────────────────────────────────────────────────────

    def select_script_dialog(self) -> Optional[str]:
        """Open native Windows file dialog to select a .py script."""
        if not self.window:
            return None
        file_types = ("Python Script (*.py)", "All Files (*.*)")
        result = self.window.create_file_dialog(
            dialog_type=webview.OPEN_DIALOG,
            allow_multiple=False,
            file_types=file_types,
        )
        if result and len(result) > 0:
            return os.path.abspath(result[0])
        return None

    def select_audio_dialog(self) -> Optional[str]:
        """Open native file dialog to select an audio track."""
        if not self.window:
            return None
        file_types = ("Audio Files (*.mp3;*.wav;*.aac)", "All Files (*.*)")
        result = self.window.create_file_dialog(
            dialog_type=webview.OPEN_DIALOG,
            allow_multiple=False,
            file_types=file_types,
        )
        if result and len(result) > 0:
            return os.path.abspath(result[0])
        return None

    def select_output_dialog(self, default_name: str = "output.mp4") -> Optional[str]:
        """Open native save file dialog to choose output video destination."""
        if not self.window:
            return None
        result = self.window.create_file_dialog(
            dialog_type=webview.SAVE_DIALOG,
            save_filename=default_name,
        )
        if result:
            return os.path.abspath(result) if isinstance(result, str) else os.path.abspath(result[0])
        return None

    # ── Engine Methods ────────────────────────────────────────────────────────

    def get_system_info(self) -> Dict[str, Any]:
        return self._bridge.get_system_info()

    def inspect_script(
        self,
        script_path: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        fps: Optional[float] = None,
        duration: Optional[float] = None,
    ) -> Dict[str, Any]:
        return self._bridge.inspect_script(
            script_path=script_path,
            width=width,
            height=height,
            fps=fps,
            duration=duration,
        )

    def render_preview_frame(
        self,
        script_path: str,
        timestamp: float,
        max_width: int = 1280,
    ) -> Dict[str, Any]:
        return self._bridge.render_preview_frame(
            script_path=script_path,
            timestamp=timestamp,
            max_width=max_width,
        )

    def start_render(self, options: Dict[str, Any]) -> Dict[str, Any]:
        def on_event(event_type: str, data: Dict[str, Any]) -> None:
            if self.window:
                # Dispatch event to JS frontend
                payload_json = json.dumps({"type": event_type, "data": data})
                js_code = (
                    f"if (window.__onRenderEvent) {{ "
                    f"  window.__onRenderEvent({payload_json}); "
                    f"}}"
                )
                self.window.evaluate_js(js_code)

        return self._bridge.start_render(options, on_event=on_event)

    def cancel_render(self) -> Dict[str, Any]:
        return self._bridge.cancel_render()

    def get_render_status(self) -> Dict[str, Any]:
        return self._bridge.get_render_status()

    # ── OS Integration ────────────────────────────────────────────────────────

    def open_output_folder(self, target_path: str) -> bool:
        """Reveal file or folder in Windows Explorer."""
        if not target_path:
            return False
        abs_path = os.path.abspath(target_path)
        try:
            if os.path.isdir(abs_path):
                os.startfile(abs_path)
                return True
            if os.path.isfile(abs_path):
                subprocess.run(["explorer", f"/select,{abs_path}"], check=False)
                return True
            parent = os.path.dirname(abs_path)
            if os.path.isdir(parent):
                os.startfile(parent)
                return True
        except Exception:
            pass
        return False


# ── Embedded Fallback Test HTML ───────────────────────────────────────────────

FALLBACK_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RenderPy Studio - Diagnostic Shell</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #131b2e;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: #1e293b;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; width: 100%; max-width: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { font-size: 24px; font-weight: 700; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    p { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }
    .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .status-list { list-style: none; margin-bottom: 24px; }
    .status-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
    .btn { background: var(--accent); color: #0f172a; border: none; padding: 12px 20px; font-size: 14px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: 0.2s; width: 100%; }
    .btn:hover { opacity: 0.9; box-shadow: 0 0 15px var(--accent-glow); }
    pre { background: #0b1120; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 12px; color: #38bdf8; overflow-x: auto; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h1>RenderPy Studio</h1>
      <span class="badge">Shell Connected</span>
    </div>
    <p>Desktop Shell & Bridge Layer are active. Ready for React Frontend integration.</p>

    <div class="status-list">
      <div class="status-item"><span>Engine Status:</span><strong style="color: var(--success);">Connected</strong></div>
      <div class="status-item"><span>FFmpeg Status:</span><span id="ffmpeg-status">Checking...</span></div>
      <div class="status-item"><span>CPU Cores:</span><span id="cpu-cores">...</span></div>
    </div>

    <button class="btn" onclick="testSelectScript()">Test File Picker Dialog</button>
    <pre id="output">Waiting for user interaction...</pre>
  </div>

  <script>
    window.addEventListener('pywebviewready', async () => {
      try {
        const info = await window.pywebview.api.get_system_info();
        document.getElementById('ffmpeg-status').textContent = info.ffmpeg_installed ? info.ffmpeg_version : 'Not Detected';
        document.getElementById('cpu-cores').textContent = info.cpu_cores + ' cores';
        document.getElementById('output').textContent = JSON.stringify(info, null, 2);
      } catch (err) {
        document.getElementById('output').textContent = 'Error: ' + err;
      }
    });

    async function testSelectScript() {
      const path = await window.pywebview.api.select_script_dialog();
      if (!path) {
        document.getElementById('output').textContent = 'Selection canceled.';
        return;
      }
      document.getElementById('output').textContent = 'Inspecting: ' + path + '...';
      const meta = await window.pywebview.api.inspect_script(path);
      document.getElementById('output').textContent = JSON.stringify(meta, null, 2);
    }
  </script>
</body>
</html>
"""


def is_dev_server_running(url: str = "http://localhost:5173") -> bool:
    """Check if the Vite React dev server is actively responding."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=0.8) as response:
            return response.status in (200, 304)
    except Exception:
        return False


def run_app(dev: bool = False) -> None:
    bridge = RenderPyBridge()
    api = DesktopAppAPI(bridge)

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dist = os.path.join(project_root, "frontend", "dist", "index.html")

    # Determine load target:
    # 1. Dev server (http://localhost:5173) if explicitly requested or running
    # 2. Built frontend (frontend/dist/index.html) if exists
    # 3. Fallback diagnostic HTML page
    dev_url = "http://localhost:5173"
    target_url = None

    if dev or is_dev_server_running(dev_url):
        target_url = dev_url
        print(f"[RenderPy Desktop] Connecting to React Dev Server: {dev_url}")
    elif os.path.isfile(frontend_dist):
        target_url = frontend_dist
        print(f"[RenderPy Desktop] Serving built frontend: {frontend_dist}")
    else:
        print("[RenderPy Desktop] Loading diagnostic shell (React frontend pending)...")

    window = webview.create_window(
        title="RenderPy Studio",
        url=target_url if target_url else None,
        html=FALLBACK_HTML if not target_url else None,
        js_api=api,
        width=1200,
        height=820,
        min_size=(900, 650),
        background_color="#090d16",
    )
    api.set_window(window)

    webview.start(debug=dev)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RenderPy Desktop Application")
    parser.add_argument("--dev", action="store_true", help="Connect to local Vite React dev server")
    args = parser.parse_args()

    run_app(dev=args.dev)
