export interface PlatformInfo {
  name: string;
  id: string;
  color: string;
  badge: string;
}

export interface VideoFormat {
  formatId: string;
  resolution: string;
  qualityName: string;
  height: number;
  ext: string;
  hasAudio: boolean;
  size: string | null;
  rawSize?: number | null;
  url?: string | null;
}

export interface AudioFormat {
  formatId: string;
  ext: string;
  codec: string;
  bitrate: string;
  size: string | null;
  rawSize?: number | null;
  url?: string | null;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  duration: string | null;
  rawDuration: number;
  uploader: string;
  uploaderUrl?: string | null;
  viewCount?: string | null;
  platform: PlatformInfo;
  originalUrl: string;
  videoFormats: VideoFormat[];
  hasAudioFormats: boolean;
  bestAudio?: AudioFormat | null;
}
