export interface SystemInfo {
  ffmpeg_installed: boolean;
  ffmpeg_version: string;
  ffmpeg_path: string;
  supported_codecs: string[];
  supported_formats: string[];
  cpu_cores: number;
}

export interface ScriptMetadata {
  success: boolean;
  script_path?: string;
  filename?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  frames?: number;
  audio?: string | null;
  summary?: string;
  error?: string;
  error_type?: string;
}

export interface PreviewFrameResponse {
  success: boolean;
  timestamp?: number;
  width?: number;
  height?: number;
  data_url?: string;
  error?: string;
}

export interface PreviewVideoResponse {
  success: boolean;
  video_id?: string;
  video_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  elapsed_seconds?: number;
  cached?: boolean;
  error?: string;
}

export interface RenderStartResponse {
  success: boolean;
  output_path?: string;
  total_frames?: number;
  width?: number;
  height?: number;
  fps?: number;
  error?: string;
}

export interface RenderEvent {
  type: 'start' | 'progress' | 'frame_error' | 'finish' | 'error' | 'info';
  data: any;
}

export interface PyWebViewAPI {
  select_script_dialog(): Promise<string | null>;
  select_audio_dialog(): Promise<string | null>;
  select_output_dialog(default_name?: string): Promise<string | null>;
  get_system_info(): Promise<SystemInfo>;
  inspect_script(
    script_path: string,
    width?: number,
    height?: number,
    fps?: number,
    duration?: number
  ): Promise<ScriptMetadata>;
  render_preview_frame(
    script_path: string,
    timestamp: number,
    max_width?: number
  ): Promise<PreviewFrameResponse>;
  start_render(options: Record<string, any>): Promise<RenderStartResponse>;
  cancel_render(): Promise<{ success: boolean; message: string }>;
  get_render_status(): Promise<Record<string, any>>;
  open_output_folder(target_path: string): Promise<boolean>;
}

declare global {
  interface Window {
    pywebview?: {
      api: PyWebViewAPI;
    };
    __onRenderEvent?: (event: RenderEvent) => void;
  }
}
