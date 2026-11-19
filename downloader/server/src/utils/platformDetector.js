export function detectPlatform(url) {
  if (!url || typeof url !== 'string') return { name: 'Unknown', icon: 'globe' };

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return { name: 'YouTube', id: 'youtube', color: '#FF0000', badge: 'YouTube Video/Shorts' };
  }
  if (lowerUrl.includes('tiktok.com')) {
    return { name: 'TikTok', id: 'tiktok', color: '#00F2FE', badge: 'TikTok (No Watermark)' };
  }
  if (lowerUrl.includes('instagram.com')) {
    return { name: 'Instagram', id: 'instagram', color: '#E1306C', badge: 'Instagram Reel/Post' };
  }
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) {
    return { name: 'Facebook', id: 'facebook', color: '#1877F2', badge: 'Facebook Watch' };
  }
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return { name: 'Twitter / X', id: 'twitter', color: '#1DA1F2', badge: 'Twitter/X Post' };
  }
  if (lowerUrl.includes('reddit.com') || lowerUrl.includes('v.redd.it')) {
    return { name: 'Reddit', id: 'reddit', color: '#FF4500', badge: 'Reddit Video' };
  }
  if (lowerUrl.includes('vimeo.com')) {
    return { name: 'Vimeo', id: 'vimeo', color: '#1AB7EA', badge: 'Vimeo Video' };
  }
  if (lowerUrl.includes('pinterest.com') || lowerUrl.includes('pin.it')) {
    return { name: 'Pinterest', id: 'pinterest', color: '#E60023', badge: 'Pinterest Pin' };
  }

  return { name: 'Web Media', id: 'generic', color: '#6366F1', badge: 'Supported Site' };
}

export function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}
