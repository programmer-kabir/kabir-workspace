import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import { detectPlatform } from '../utils/platformDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate yt-dlp binary
function getYtDlpPath() {
  const localBinWindows = path.resolve(__dirname, '../../bin/yt-dlp.exe');
  const localBinLinux = path.resolve(__dirname, '../../bin/yt-dlp');

  if (fs.existsSync(localBinWindows)) return localBinWindows;
  if (fs.existsSync(localBinLinux)) return localBinLinux;

  return 'yt-dlp'; // fallback to PATH
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return null;
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null;
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  }
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
}

// In-memory cache for fast repeat requests and instant demo chips
const metadataCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Dedicated fallback for TikTok (No-watermark API)
 */
async function extractTikTokFallback(url) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      const d = json.data;
      const platform = detectPlatform(url);
      const formats = [];
      if (d.hdplay) {
        formats.push({
          formatId: 'hdplay',
          resolution: '1080p',
          qualityName: 'Full HD (No Watermark)',
          height: 1080,
          ext: 'mp4',
          hasAudio: true,
          size: d.hd_size ? formatBytes(d.hd_size) : null,
          url: d.hdplay
        });
      }
      if (d.play) {
        formats.push({
          formatId: 'play',
          resolution: '720p',
          qualityName: 'HD (No Watermark)',
          height: 720,
          ext: 'mp4',
          hasAudio: true,
          size: d.size ? formatBytes(d.size) : null,
          url: d.play
        });
      }
      return {
        id: d.id,
        title: d.title || 'TikTok Video',
        description: d.title || '',
        thumbnail: d.cover || d.origin_cover || null,
        duration: formatDuration(d.duration),
        rawDuration: d.duration || 0,
        uploader: d.author?.nickname || 'TikTok Creator',
        uploaderUrl: d.author?.unique_id ? `https://www.tiktok.com/@${d.author.unique_id}` : null,
        viewCount: d.play_count ? d.play_count.toLocaleString() : null,
        platform,
        originalUrl: url,
        videoFormats: formats,
        hasAudioFormats: !!d.music,
        bestAudio: d.music ? {
          formatId: 'music',
          ext: 'mp3',
          codec: 'mp3',
          bitrate: 'Original Sound',
          size: null,
          url: d.music
        } : null
      };
    }
  } catch (e) {
    console.warn('TikWM fallback error:', e.message);
  }
  return null;
}

/**
 * Extracts metadata and available download qualities from a video URL.
 */
export async function extractMediaInfo(url) {
  // Check cache first
  const cached = metadataCache.get(url);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const ytDlp = getYtDlpPath();

  const args = [
    '--dump-single-json',
    '--no-playlist',
    '--no-warnings',
    '--no-call-home',
    '--prefer-free-formats',
    url
  ];

  if (ffmpegPath) {
    args.push('--ffmpeg-location', ffmpegPath);
  }

  return new Promise((resolve, reject) => {
    const process = spawn(ytDlp, args);
    let stdoutData = '';
    let stderrData = '';

    process.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    process.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    process.on('close', async (code) => {
      if (code !== 0) {
        // If TikTok failed on yt-dlp, try TikTok fallback
        if (url.toLowerCase().includes('tiktok.com')) {
          const fallbackData = await extractTikTokFallback(url);
          if (fallbackData) {
            metadataCache.set(url, { timestamp: Date.now(), data: fallbackData });
            return resolve(fallbackData);
          }
        }

        let errorMsg = 'Failed to fetch video information.';
        if (stderrData.includes('Private video') || stderrData.includes('login required')) {
          errorMsg = 'This video is private or requires login to view.';
        } else if (stderrData.includes('Video unavailable') || stderrData.includes('not found') || stderrData.includes('404')) {
          errorMsg = 'Video is unavailable or not found. Please verify the URL.';
        } else if (stderrData.includes('DRM') || stderrData.includes('protected')) {
          errorMsg = 'This content is protected by DRM and cannot be downloaded.';
        } else if (stderrData.includes('empty media response')) {
          errorMsg = 'The requested post is not accessible or has been removed.';
        }
        return reject(new Error(errorMsg));
      }

      try {
        const raw = JSON.parse(stdoutData);
        const platform = detectPlatform(url);

        // Process video and audio formats
        const rawFormats = raw.formats || [];
        const videoQualityMap = new Map();
        const audioFormats = [];

        for (const f of rawFormats) {
          const ext = f.ext || 'mp4';
          const isAudioOnly = f.vcodec === 'none' && f.acodec !== 'none';
          const isVideo = f.vcodec !== 'none';
          const height = f.height || 0;
          const size = f.filesize || f.filesize_approx || null;

          if (isAudioOnly) {
            audioFormats.push({
              formatId: f.format_id,
              ext: ext === 'webm' ? 'mp3' : ext,
              codec: f.acodec,
              bitrate: f.abr ? `${Math.round(f.abr)}kbps` : 'Audio',
              size: formatBytes(size),
              rawSize: size,
              url: f.url || null
            });
          } else if (isVideo && height >= 144) {
            const label = `${height}p`;
            const qualityName = height >= 1080 ? 'Full HD' : height >= 720 ? 'HD' : 'SD';
            
            const existing = videoQualityMap.get(label);
            const score = (f.ext === 'mp4' ? 100 : 0) + (f.acodec !== 'none' ? 50 : 0) + (f.tbr || 0);

            if (!existing || score > existing.score) {
              videoQualityMap.set(label, {
                score,
                formatId: f.format_id,
                resolution: label,
                qualityName,
                height,
                ext: 'mp4',
                hasAudio: f.acodec !== 'none',
                size: formatBytes(size),
                rawSize: size,
                url: f.url || null
              });
            }
          }
        }

        // Sort video qualities descending by height
        let sortedVideoFormats = Array.from(videoQualityMap.values())
          .sort((a, b) => b.height - a.height)
          .map(({ score, ...rest }) => rest);

        // Fallback if no height-tagged format matched (e.g. some Instagram/Facebook posts)
        if (sortedVideoFormats.length === 0) {
          const validMp4 = rawFormats.find(f => f.ext === 'mp4' && f.url) || rawFormats[rawFormats.length - 1];
          if (validMp4 || raw.url) {
            sortedVideoFormats.push({
              formatId: validMp4?.format_id || 'best',
              resolution: 'HD',
              qualityName: 'Standard HD',
              height: 720,
              ext: 'mp4',
              hasAudio: true,
              size: formatBytes(validMp4?.filesize || validMp4?.filesize_approx),
              url: validMp4?.url || raw.url || null
            });
          }
        }

        // Standardized response
        const result = {
          id: raw.id,
          title: raw.title || 'Untitled Video',
          description: raw.description ? raw.description.slice(0, 200) + '...' : '',
          thumbnail: raw.thumbnail || null,
          duration: formatDuration(raw.duration),
          rawDuration: raw.duration || 0,
          uploader: raw.uploader || raw.channel || platform.name,
          uploaderUrl: raw.uploader_url || raw.channel_url || null,
          viewCount: raw.view_count ? raw.view_count.toLocaleString() : null,
          platform: platform,
          originalUrl: url,
          videoFormats: sortedVideoFormats,
          hasAudioFormats: audioFormats.length > 0,
          bestAudio: audioFormats.length > 0 ? audioFormats[audioFormats.length - 1] : null
        };

        // Save in cache
        metadataCache.set(url, { timestamp: Date.now(), data: result });

        resolve(result);
      } catch (err) {
        reject(new Error('Failed to parse video metadata: ' + err.message));
      }
    });
  });
}

/**
 * Streams the video or audio download directly to the response.
 */
export function streamMedia({ url, formatId, type, res }) {
  const ytDlp = getYtDlpPath();

  let args = [];

  if (type === 'audio') {
    // Download and convert to MP3 on-the-fly
    args = [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '-o', '-',
      '--no-playlist',
      url
    ];
  } else if (formatId && formatId !== 'best' && formatId !== 'hdplay' && formatId !== 'play') {
    // If formatId provided, merge with bestaudio if it has no audio
    args = [
      '-f', `${formatId}+bestaudio/best`,
      '--merge-output-format', 'mp4',
      '-o', '-',
      '--no-playlist',
      url
    ];
  } else {
    // Default best mp4
    args = [
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '-o', '-',
      '--no-playlist',
      url
    ];
  }

  if (ffmpegPath) {
    args.push('--ffmpeg-location', ffmpegPath);
  }

  const child = spawn(ytDlp, args);

  child.stdout.pipe(res);

  child.stderr.on('data', (data) => {
    // progress
  });

  child.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process media stream.' });
    }
  });

  res.on('close', () => {
    child.kill();
  });
}
