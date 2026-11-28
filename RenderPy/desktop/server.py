"""
desktop/server.py
=================
Multi-threaded HTTP API backend for RenderPy Studio.
Enables running in standard browsers (Brave/Chrome/Edge) AND on cloud servers (Hostinger VPS).
"""
from __future__ import annotations

import os
import re
import sys
import tempfile
from socketserver import ThreadingMixIn
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from bottle import Bottle, ServerAdapter, request, response, static_file
from desktop.bridge import RenderPyBridge

app = Bottle()
bridge = RenderPyBridge()
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "renderpy_studio_uploads")
PREVIEW_VIDEO_DIR = os.path.join(tempfile.gettempdir(), "renderpy_video_previews")
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")


# ── Multi-Threaded WSGI Adapter ───────────────────────────────────────────────

class _ThreadedWSGIServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 64


class _QuietHandler(WSGIRequestHandler):
    def log_message(self, format: str, *args) -> None:
        pass


class ThreadedWSGIRefServer(ServerAdapter):
    def run(self, handler) -> None:
        httpd = make_server(
            self.host,
            self.port,
            handler,
            server_class=_ThreadedWSGIServer,
            handler_class=_QuietHandler,
        )
        httpd.serve_forever()


# ── CORS Middleware ───────────────────────────────────────────────────────────

@app.hook("after_request")
def enable_cors() -> None:
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Origin, Accept, Content-Type, X-Requested-With"


@app.route("/api/<path:path>", method="OPTIONS")
def options_handler(path: str):
    return {}


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/api/system-info")
def get_system_info():
    response.content_type = "application/json"
    return bridge.get_system_info()


@app.get("/api/sample-scripts")
def get_sample_scripts():
    response.content_type = "application/json"
    examples_dir = os.path.join(PROJECT_ROOT, "examples")
    samples = []
    if os.path.isdir(examples_dir):
        for f in sorted(os.listdir(examples_dir)):
            if f.endswith(".py"):
                full_path = os.path.join(examples_dir, f)
                samples.append({
                    "filename": f,
                    "path": full_path,
                })
    return {"samples": samples}


@app.post("/api/upload-script")
def upload_script():
    """Save browser-uploaded .py script content and inspect it."""
    response.content_type = "application/json"
    data = request.json or {}
    filename = str(data.get("filename", "uploaded_script.py"))
    content = data.get("content")

    if content is None or not isinstance(content, str):
        return {"success": False, "error": "Missing script content."}

    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", os.path.basename(filename))
    if not safe_name.endswith(".py"):
        safe_name = f"{safe_name}.py"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    target_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(target_path, "w", encoding="utf-8") as fh:
        fh.write(content)

    return bridge.inspect_script(target_path)


@app.post("/api/inspect")
def inspect_script():
    response.content_type = "application/json"
    data = request.json or {}
    path = data.get("script_path", "")
    return bridge.inspect_script(
        path,
        width=data.get("width"),
        height=data.get("height"),
        fps=data.get("fps"),
        duration=data.get("duration"),
    )


@app.post("/api/preview")
def render_preview():
    response.content_type = "application/json"
    data = request.json or {}
    path = data.get("script_path", "")
    timestamp = float(data.get("timestamp", 0.0))
    max_width = int(data.get("max_width", 1280))
    return bridge.render_preview_frame(path, timestamp, max_width)


@app.post("/api/preview-video")
def render_preview_video():
    response.content_type = "application/json"
    data = request.json or {}
    path = data.get("script_path", "")
    max_width = int(data.get("max_width", 640))
    res = bridge.render_preview_video(path, max_width=max_width)
    if res.get("success") and res.get("video_id"):
        res["video_url"] = f"/api/video/{res['video_id']}.mp4"
    return res


@app.get("/api/video/<filename>")
def serve_preview_video(filename: str):
    if not filename.endswith(".mp4") or "/" in filename or "\\" in filename:
        response.status = 400
        return "Invalid video filename"
    return static_file(filename, root=PREVIEW_VIDEO_DIR, mimetype="video/mp4")


@app.post("/api/render/start")
def start_render():
    response.content_type = "application/json"
    options = request.json or {}
    return bridge.start_render(options)


@app.post("/api/render/cancel")
def cancel_render():
    response.content_type = "application/json"
    return bridge.cancel_render()


@app.get("/api/render/status")
def get_render_status():
    response.content_type = "application/json"
    return bridge.get_render_status()


@app.post("/api/open-folder")
def open_folder():
    response.content_type = "application/json"
    data = request.json or {}
    target = data.get("path", "")
    if target and os.path.exists(target):
        try:
            if os.path.isdir(target):
                os.startfile(target)
            else:
                os.startfile(os.path.dirname(target))
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    return {"success": False, "error": "Path does not exist"}


# ── Static Frontend Serving (Production / Direct Port 5000) ───────────────────

@app.get("/")
def serve_index():
    if os.path.isfile(os.path.join(FRONTEND_DIST, "index.html")):
        return static_file("index.html", root=FRONTEND_DIST)
    return "RenderPy API Server Running. Frontend dist not built."


@app.get("/<filepath:path>")
def serve_static(filepath: str):
    if os.path.isdir(FRONTEND_DIST):
        return static_file(filepath, root=FRONTEND_DIST)
    response.status = 404
    return "Not found"


def start_server(host: str = "127.0.0.1", port: int = 5000) -> None:
    app.run(server=ThreadedWSGIRefServer(host=host, port=port))


if __name__ == "__main__":
    print("[RenderPy Server] Multi-threaded API listening on http://127.0.0.1:5000")
    start_server()
