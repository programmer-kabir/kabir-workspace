import { VideoMetadata, PlatformInfo } from '../types';

const API_BASE = '/api';

export async function extractVideo(url: string): Promise<VideoMetadata> {
  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to extract video details.');
  }

  return data.data;
}

export function getDownloadUrl(options: {
  url: string;
  formatId?: string;
  type?: 'video' | 'audio';
  title?: string;
}): string {
  const params = new URLSearchParams();
  params.append('url', options.url);
  if (options.formatId) params.append('formatId', options.formatId);
  if (options.type) params.append('type', options.type);
  if (options.title) params.append('title', options.title);

  return `${API_BASE}/download?${params.toString()}`;
}

export function detectLocalPlatform(url: string): PlatformInfo {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { name: 'YouTube', id: 'youtube', color: '#EF4444', badge: 'YouTube' };
  }
  if (lower.includes('tiktok.com')) {
    return { name: 'TikTok', id: 'tiktok', color: '#06B6D4', badge: 'TikTok (No Watermark)' };
  }
  if (lower.includes('instagram.com')) {
    return { name: 'Instagram', id: 'instagram', color: '#EC4899', badge: 'Instagram Reel' };
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return { name: 'Facebook', id: 'facebook', color: '#3B82F6', badge: 'Facebook Watch' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { name: 'Twitter / X', id: 'twitter', color: '#38BDF8', badge: 'Twitter / X' };
  }
  if (lower.includes('reddit.com') || lower.includes('v.redd.it')) {
    return { name: 'Reddit', id: 'reddit', color: '#F97316', badge: 'Reddit' };
  }
  if (lower.includes('vimeo.com')) {
    return { name: 'Vimeo', id: 'vimeo', color: '#0EA5E9', badge: 'Vimeo' };
  }
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) {
    return { name: 'Pinterest', id: 'pinterest', color: '#E11D48', badge: 'Pinterest' };
  }

  return { name: 'Universal', id: 'generic', color: '#8B5CF6', badge: 'All Platforms' };
}
