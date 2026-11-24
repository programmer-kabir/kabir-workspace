// staff-frontend/src/components/Meeting/meetingUtils.js
// Shared constants and helper functions for CCA Video Conference Studio

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Clean profile picture URL helper
export const getAvatarUrl = (pic) => {
  if (!pic) return null;
  if (pic.startsWith('http://') || pic.startsWith('https://')) return pic;
  const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const cleanPath = pic.startsWith('/') ? pic.slice(1) : pic;
  return `${base}${cleanPath}`;
};

// 🌟 Available Live Floating Reactions
export const AVAILABLE_REACTIONS = [
  { emoji: '❤️', labelBn: 'ভালোবাসা', labelEn: 'Heart' },
  { emoji: '👍', labelBn: 'থাম্বস আপ', labelEn: 'Thumbs Up' },
  { emoji: '👏', labelBn: 'হাততালি', labelEn: 'Clap' },
  { emoji: '🎉', labelBn: 'উদযাপন', labelEn: 'Celebrate' },
  { emoji: '😂', labelBn: 'হাসি', labelEn: 'Laugh' },
  { emoji: '🔥', labelBn: 'অসাধারণ / আগুন', labelEn: 'Fire' },
  { emoji: '😮', labelBn: 'বিস্ময়', labelEn: 'Wow' },
  { emoji: '💯', labelBn: '১০০%', labelEn: '100' },
];

// 💻 Supported Code Snippet Languages
export const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'html', label: 'HTML / CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C / C++' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'bash', label: 'Bash / Shell' },
  { id: 'json', label: 'JSON' },
  { id: 'other', label: 'Plain Code' },
];

// 📎 Helper to format file size in B, KB, MB
export const formatChatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 📎 Helper to get chat attachment full URL
export const getChatAttachmentUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${base}${cleanPath}`;
};

// ⬇️ Helper to construct direct-download endpoint URL (Forces direct download)
export const getChatFileDownloadUrl = (url, originalName) => {
  if (!url) return '';
  const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const cleanFile = url.split('/').pop() || url;
  const encodedName = encodeURIComponent(originalName || cleanFile);
  return `${base}api/meetings/download_chat_file.php?file=${encodeURIComponent(cleanFile)}&name=${encodedName}`;
};

// Fallback silent & blank MediaStream for environments without camera/mic hardware
export function createFallbackStream() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#e11d48';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CCA Live Studio', 320, 180);

  let videoTrack = null;
  if (canvas.captureStream) {
    const stream = canvas.captureStream(5);
    videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = false;
  }

  let audioTrack = null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const dst = audioCtx.createMediaStreamDestination();
      audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = false;
    }
  } catch (e) {}

  const tracks = [];
  if (videoTrack) tracks.push(videoTrack);
  if (audioTrack) tracks.push(audioTrack);
  return new MediaStream(tracks);
}
