import {
  PreviewFrameResponse,
  PreviewVideoResponse,
  PyWebViewAPI,
  RenderStartResponse,
  ScriptMetadata,
  SystemInfo,
} from '../types/pywebview';

export interface SampleScript {
  filename: string;
  path: string;
}

const API_BASE = '/api';

class StudioApiService implements PyWebViewAPI {
  public get hasPyWebView(): boolean {
    return !!window.pywebview?.api;
  }

  async select_script_dialog(): Promise<string | null> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.select_script_dialog();
    }
    return null;
  }

  async upload_script(filename: string, content: string): Promise<ScriptMetadata> {
    const res = await fetch(`${API_BASE}/upload-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  }

  async select_audio_dialog(): Promise<string | null> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.select_audio_dialog();
    }
    return null;
  }

  async select_output_dialog(default_name?: string): Promise<string | null> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.select_output_dialog(default_name);
    }
    return null;
  }

  async get_system_info(): Promise<SystemInfo> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.get_system_info();
    }
    const res = await fetch(`${API_BASE}/system-info`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  }

  async get_sample_scripts(): Promise<SampleScript[]> {
    const res = await fetch(`${API_BASE}/sample-scripts`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.samples || [];
  }

  async inspect_script(
    script_path: string,
    width?: number,
    height?: number,
    fps?: number,
    duration?: number
  ): Promise<ScriptMetadata> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.inspect_script(script_path, width, height, fps, duration);
    }
    const res = await fetch(`${API_BASE}/inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_path, width, height, fps, duration }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  }

  async render_preview_frame(
    script_path: string,
    timestamp: number,
    max_width: number = 1280
  ): Promise<PreviewFrameResponse> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.render_preview_frame(script_path, timestamp, max_width);
    }
    const res = await fetch(`${API_BASE}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_path, timestamp, max_width }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  }

  async render_preview_video(
    script_path: string,
    max_width: number = 640
  ): Promise<PreviewVideoResponse> {
    const res = await fetch(`${API_BASE}/preview-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_path, max_width }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  }

  async start_render(options: Record<string, any>): Promise<RenderStartResponse> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.start_render(options);
    }
    const res = await fetch(`${API_BASE}/render/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.json();
  }

  async cancel_render(): Promise<{ success: boolean; message: string }> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.cancel_render();
    }
    const res = await fetch(`${API_BASE}/render/cancel`, { method: 'POST' });
    return res.json();
  }

  async get_render_status(): Promise<Record<string, any>> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.get_render_status();
    }
    const res = await fetch(`${API_BASE}/render/status`);
    return res.json();
  }

  async open_output_folder(target_path: string): Promise<boolean> {
    if (this.hasPyWebView) {
      return window.pywebview!.api.open_output_folder(target_path);
    }
    const res = await fetch(`${API_BASE}/open-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: target_path }),
    });
    const data = await res.json();
    return !!data.success;
  }
}

export const studioApi = new StudioApiService();
