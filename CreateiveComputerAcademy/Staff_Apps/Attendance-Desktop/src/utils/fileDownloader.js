/**
 * Universal safe file downloader & offline asset cache manager:
 * 1. Fetches original high-resolution files from backend proxy
 * 2. Caches every viewed/downloaded file into local Electron disk cache & browser Cache Storage
 * 3. Enables instant 100% offline file downloads & opening without internet
 * 4. Provides background pre-caching for active task attachments
 */
import { getApiBase } from './api';

const CACHE_NAME = 'cca-task-assets-v1';

export const cleanFileName = (fileUrl, customFileName = null) => {
  if (customFileName) return customFileName;
  if (!fileUrl) return 'file';
  try {
    const pathPart = fileUrl.split('?')[0];
    const extracted = pathPart.substring(pathPart.lastIndexOf('/') + 1);
    return extracted ? decodeURIComponent(extracted) : 'file';
  } catch {
    return 'file';
  }
};

/**
 * Check if a file is already cached locally (Electron disk or Browser Cache Storage)
 */
export const isTaskFileCached = async (fileUrl, customFileName = null) => {
  if (!fileUrl) return false;
  const fileName = cleanFileName(fileUrl, customFileName);

  // 1. Check Electron local disk cache
  if (window.electronAPI?.isTaskFileCached) {
    try {
      const exists = await window.electronAPI.isTaskFileCached(fileName);
      if (exists) return true;
    } catch {}
  }

  // 2. Check Browser Cache Storage
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(fileUrl);
      if (matched) return true;
    } catch {}
  }

  return false;
};

/**
 * Save a file blob into local cache (Electron disk + Browser Cache Storage)
 */
export const saveFileToCache = async (fileUrl, fileName, blob) => {
  if (!blob || !fileUrl) return;

  // 1. Save to Electron disk cache
  if (window.electronAPI?.saveCachedTaskFile) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      await window.electronAPI.saveCachedTaskFile({
        fileName,
        buffer: arrayBuffer,
        url: fileUrl
      });
      console.log(`[FileDownloader] Cached "${fileName}" to Electron disk cache.`);
    } catch (e) {
      console.warn('[FileDownloader] Error saving to Electron disk cache:', e);
    }
  }

  // 2. Save to Browser Cache Storage
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const res = new Response(blob.slice(0, blob.size, blob.type || 'application/octet-stream'), {
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
          'Content-Length': String(blob.size),
          'X-Cached-At': new Date().toISOString()
        }
      });
      await cache.put(fileUrl, res);
      console.log(`[FileDownloader] Cached "${fileName}" to Cache Storage.`);
    } catch (e) {
      console.warn('[FileDownloader] Error saving to Cache Storage:', e);
    }
  }
};

/**
 * Retrieve cached blob for offline viewing or saving
 */
export const getCachedFileBlob = async (fileUrl, fileName) => {
  // 1. Check Electron disk cache
  if (window.electronAPI?.getCachedTaskFile) {
    try {
      const res = await window.electronAPI.getCachedTaskFile(fileName);
      if (res?.success && res.buffer) {
        return new Blob([res.buffer]);
      }
    } catch {}
  }

  // 2. Check Browser Cache Storage
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(fileUrl);
      if (matched) {
        return await matched.blob();
      }
    } catch {}
  }

  return null;
};

/**
 * Trigger local browser save for a Blob
 */
const triggerBlobDownload = (blob, fileName) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
};

/**
 * Universal safe file downloader:
 * Checks local cache first; if cached, serves instantly even offline.
 * If not cached and online, downloads, caches for future, and delivers file.
 */
export const downloadFile = async (fileUrl, customFileName = null) => {
  if (!fileUrl) return { success: false, error: 'Empty file URL' };

  const API_BASE = getApiBase();
  const fileName = cleanFileName(fileUrl, customFileName);

  // ── 1. Check if file is already cached locally ──────────────────────────────
  const isCached = await isTaskFileCached(fileUrl, fileName);

  if (isCached) {
    console.log(`[FileDownloader] File "${fileName}" is cached locally. Serving offline!`);

    // In Electron: if user has default desktop app (Photoshop, Illustrator, Acrobat, etc.), open or save
    if (window.electronAPI?.openCachedTaskFile) {
      try {
        const openRes = await window.electronAPI.openCachedTaskFile(fileName);
        if (openRes?.success) {
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('File Opened (Offline Cache) 💾', `Opened "${fileName}" from local cache.`);
          }
          return { success: true, fromCache: true, openedOnDesktop: true };
        }
      } catch (e) {
        console.warn('[FileDownloader] Could not open cached file via shell, falling back to blob download:', e);
      }
    }

    // Fallback: Export Blob to Downloads folder
    const cachedBlob = await getCachedFileBlob(fileUrl, fileName);
    if (cachedBlob) {
      triggerBlobDownload(cachedBlob, fileName);
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification('Downloaded from Cache 💾', `"${fileName}" saved from offline cache.`);
      }
      return { success: true, fromCache: true };
    }
  }

  // ── 2. If not cached and OFFLINE ───────────────────────────────────────────
  if (!navigator.onLine) {
    const errorMsg = `⚠️ "${fileName}" ফাইলটি পূর্বে অফলাইনে ব্যবহারের জন্য ডাউনলোড বা ক্যাশ করা হয়নি। ইন্টারনেট সংযোগ এলে এটি ডাউনলোড করা যাবে।`;
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification('Offline File Notice', errorMsg);
    } else {
      alert(errorMsg);
    }
    return { success: false, error: 'offline_not_cached' };
  }

  // ── 3. If ONLINE: Fetch file from backend proxy, cache it, and trigger download ─
  const proxyUrl = `${API_BASE}api/tasks/download_file.php?url=${encodeURIComponent(fileUrl)}${fileName ? `&filename=${encodeURIComponent(fileName)}` : ''}`;

  try {
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      
      // Save to local cache for future offline access!
      await saveFileToCache(fileUrl, fileName, blob);

      // Trigger download
      triggerBlobDownload(blob, fileName);
      return { success: true, fromCache: false, cachedNow: true };
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`[FileDownloader] Direct fetch failed (${err.message}), falling back to standard link navigation.`);
    
    // Fallback standard navigation
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, fromCache: false, fallbackUsed: true };
  }
};

/**
 * Pre-cache task reference files & attachments in the background while online
 * So when internet cuts out, the files are ALREADY waiting on disk!
 */
export const preCacheTaskAssets = async (tasks = []) => {
  if (!navigator.onLine || !Array.isArray(tasks) || tasks.length === 0) return;

  const urlsToPreCache = [];

  for (const task of tasks) {
    // Only pre-cache assets for active tasks (To-Do & In Progress)
    if (task.status === 'Completed' || task.status === 'Archived') continue;

    if (task.attachment_file && typeof task.attachment_file === 'string') {
      urlsToPreCache.push({ url: task.attachment_file, name: cleanFileName(task.attachment_file) });
    }

    if (Array.isArray(task.attachments)) {
      for (const a of task.attachments) {
        const u = a.url || a.file_url || a.path;
        if (u) urlsToPreCache.push({ url: u, name: cleanFileName(u, a.file_name || a.name) });
      }
    }

    if (Array.isArray(task.submissions)) {
      for (const s of task.submissions) {
        const u = s.file_url || s.url;
        if (u) urlsToPreCache.push({ url: u, name: cleanFileName(u, s.file_name || s.name) });
      }
    }
  }

  // Deduplicate URLs
  const uniqueUrls = [];
  const seen = new Set();
  for (const item of urlsToPreCache) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      uniqueUrls.push(item);
    }
  }

  if (uniqueUrls.length === 0) return;

  // Process in low-priority background sequence (max 8 files per batch)
  const batch = uniqueUrls.slice(0, 8);
  console.log(`[FileDownloader] Background pre-caching ${batch.length} task asset(s)...`);

  const API_BASE = getApiBase();

  for (const item of batch) {
    try {
      const alreadyCached = await isTaskFileCached(item.url, item.name);
      if (alreadyCached) continue;

      const proxyUrl = `${API_BASE}api/tasks/download_file.php?url=${encodeURIComponent(item.url)}${item.name ? `&filename=${encodeURIComponent(item.name)}` : ''}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        await saveFileToCache(item.url, item.name, blob);
      }
    } catch (e) {
      // Non-blocking background worker
    }
  }
};
