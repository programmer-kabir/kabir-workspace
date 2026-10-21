// Attendence_Apps/Attendance-Desktop/src/services/WorkstationRecorderService.js
import axios from 'axios';
import { API_BASE, getApiBase } from '../utils/api';

class WorkstationRecorderService {
  constructor() {
    this.currentUser = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.chunkStartTime = null;
    this.chunkIndex = 1;
    this.rolloverTimer = null;
    this.spoolWorkerInterval = null;
    this.isRecording = false;
    this.isUploading = false;
    this.statusListeners = new Set();
    this.currentStatus = {
      isRecording: false,
      chunkIndex: 0,
      chunkStartTime: null,
      lastUploadedChunk: null,
      error: null,
      spoolCount: 0,
      spoolTotalBytes: 0,
      freeDiskBytes: 0,
      totalDiskBytes: 0,
      spoolItems: [],
      isUploading: false,
      currentUpload: null // { fileName, percent, loaded, total }
    };

    // Standard production 30-minute chunk cycle (1800 seconds)
    this.CHUNK_DURATION_MS = 30 * 60 * 1000;

    // Listen for reconnection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[WorkstationRecorder] Connection restored. Refreshing spool & flushing...');
        this.refreshSpoolInfo();
        this.flushPendingSpool();
      });
    }
  }

  // Subscribe to status updates for UI badge
  subscribeStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatus(update) {
    this.currentStatus = { ...this.currentStatus, ...update };
    for (const listener of this.statusListeners) {
      try {
        listener(this.currentStatus);
      } catch (e) {}
    }
  }

  init(user) {
    if (!user || !user.id) return;
    this.currentUser = user;
    this.refreshSpoolInfo();
    this.startSpoolWorker();
  }

  async acquireScreenStream() {
    // Attempt 1: Standard getDisplayMedia (Cleanly handled by Electron setDisplayMediaRequestHandler)
    if (navigator.mediaDevices?.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        });
        if (stream && stream.active && stream.getVideoTracks().length > 0) {
          console.log('[WorkstationRecorder] Acquired screen stream via getDisplayMedia.');
          return stream;
        }
      } catch (err) {
        console.warn('[WorkstationRecorder] getDisplayMedia fallback to getUserMedia:', err.message);
      }
    }

    // Attempt 2: Electron desktopCapturer with getUserMedia
    if (window.electronAPI?.getScreenSources) {
      try {
        const sources = await window.electronAPI.getScreenSources();
        if (sources && sources.length > 0) {
          const primarySource = sources[0];
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: primarySource.id,
                maxWidth: 1920,
                maxHeight: 1080,
                maxFrameRate: 30
              }
            }
          });
          if (stream && stream.active && stream.getVideoTracks().length > 0) {
            console.log('[WorkstationRecorder] Acquired screen stream via getUserMedia.');
            return stream;
          }
        }
      } catch (err) {
        console.warn('[WorkstationRecorder] getUserMedia desktop source failed:', err.message);
      }
    }

    throw new Error('Could not acquire screen stream for workstation surveillance.');
  }

  async startContinuousRecording(user) {
    if (this.isRecording) return;
    if (user) this.currentUser = user;
    if (!this.currentUser?.id) return;

    try {
      this.stream = await this.acquireScreenStream();
      this.isRecording = true;
      this.chunkIndex = 1;

      this.notifyStatus({
        isRecording: true,
        chunkIndex: 1,
        error: null
      });

      this.startNewChunk();
      console.log(`[WorkstationRecorder] Continuous recording started (${this.CHUNK_DURATION_MS / 60000}m chunk cycle).`);
    } catch (err) {
      console.error('[WorkstationRecorder] Failed to start continuous screen recording:', err);
      this.isRecording = false;
      this.notifyStatus({
        isRecording: false,
        error: err.message
      });
    }
  }

  startNewChunk() {
    if (!this.stream || !this.stream.active) {
      console.warn('[WorkstationRecorder] Stream inactive when starting chunk. Re-acquiring...');
      this.reacquireAndStartChunk();
      return;
    }

    this.recordedChunks = [];
    this.chunkStartTime = new Date();

    const mimeTypes = [
      'video/webm; codecs=h264',
      'video/webm; codecs=vp9',
      'video/webm; codecs=vp8',
      'video/webm'
    ];

    let selectedMime = 'video/webm';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 1500000 // 1.5 Mbps: Crystal-clear Full HD 1080p at 30 FPS (~330MB/30min)
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Slice data every 5 seconds to prevent memory spikes
      this.mediaRecorder.start(5000);

      this.notifyStatus({
        isRecording: true,
        chunkIndex: this.chunkIndex,
        chunkStartTime: this.chunkStartTime
      });

      // Schedule next rollover
      if (this.rolloverTimer) clearTimeout(this.rolloverTimer);
      this.rolloverTimer = setTimeout(() => {
        this.rolloverChunk();
      }, this.CHUNK_DURATION_MS);

    } catch (err) {
      console.error('[WorkstationRecorder] Error initializing MediaRecorder:', err);
      this.notifyStatus({ error: err.message });
    }
  }

  async reacquireAndStartChunk() {
    try {
      this.stream = await this.acquireScreenStream();
      this.startNewChunk();
    } catch (err) {
      console.error('[WorkstationRecorder] Reacquisition failed:', err);
    }
  }

  // Seamless rollover without losing a single second
  rolloverChunk() {
    if (!this.isRecording) return;
    console.log(`[WorkstationRecorder] Rollover boundary reached for chunk #${this.chunkIndex}.`);

    const activeRecorder = this.mediaRecorder;
    const activeChunks = [...this.recordedChunks];
    const currentIndex = this.chunkIndex;
    const currentStartTime = this.chunkStartTime;

    // Reset buffer for the new upcoming chunk immediately
    this.recordedChunks = [];
    this.chunkIndex++;

    // Immediately start the next chunk so 0 seconds are lost
    this.startNewChunk();

    // When the old recorder stops, flush its final chunk and save
    if (activeRecorder) {
      activeRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          activeChunks.push(e.data);
        }
      };

      activeRecorder.onstop = () => {
        this.saveCompletedChunkData(activeChunks, currentIndex, currentStartTime);
      };

      if (activeRecorder.state !== 'inactive') {
        try {
          activeRecorder.stop();
        } catch (e) {}
      }
    }
  }

  async saveCompletedChunkData(chunks, chunkIdx, chunkStart) {
    if (!chunks || chunks.length === 0) {
      console.warn(`[WorkstationRecorder] Chunk #${chunkIdx} has no data, skipping save.`);
      return;
    }

    const chunkBlob = new Blob(chunks, { type: 'video/webm' });
    const now = new Date();
    const startTimeStr = chunkStart ? chunkStart.toTimeString().split(' ')[0] : '09:00:00';
    const endTimeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];

    const fileName = `spool_${this.currentUser.id}_${Date.now()}_chunk_${chunkIdx}.webm`;

    const metadata = {
      user_id: this.currentUser.id,
      staff_name: this.currentUser.name || `Staff_${this.currentUser.id}`,
      date: dateStr,
      start_time: startTimeStr,
      end_time: endTimeStr,
      chunk_index: chunkIdx,
      duration_seconds: Math.round((now.getTime() - (chunkStart?.getTime() || now.getTime())) / 1000)
    };

    try {
      const arrayBuffer = await chunkBlob.arrayBuffer();
      if (window.electronAPI?.saveSpoolVideo) {
        const res = await window.electronAPI.saveSpoolVideo({
          fileName,
          buffer: arrayBuffer,
          metadata
        });

        if (res?.success) {
          const mbSize = (chunkBlob.size / (1024 * 1024)).toFixed(2);
          console.log(`[WorkstationRecorder] Saved chunk #${chunkIdx} to local spool (${mbSize} MB). Flushing spool...`);
          await this.refreshSpoolInfo();
          this.flushPendingSpool();
        }
      }
    } catch (err) {
      console.error('[WorkstationRecorder] Failed to save spool chunk to disk:', err);
    }
  }

  stopContinuousRecording() {
    this.isRecording = false;
    if (this.rolloverTimer) {
      clearTimeout(this.rolloverTimer);
      this.rolloverTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        const chunks = [...this.recordedChunks];
        const idx = this.chunkIndex;
        const st = this.chunkStartTime;
        this.mediaRecorder.onstop = () => {
          this.saveCompletedChunkData(chunks, idx, st);
        };
        this.mediaRecorder.stop();
      } catch (e) {}
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.notifyStatus({
      isRecording: false,
      chunkStartTime: null
    });
    console.log('[WorkstationRecorder] Continuous recording stopped.');
  }

  // ── Read Spool Storage Information ──────────────────────────────────────────
  async refreshSpoolInfo() {
    try {
      let spoolItems = [];
      let count = 0;
      let totalBytes = 0;
      let freeDiskBytes = 0;
      let totalDiskBytes = 0;
      let spoolDir = '';

      if (window.electronAPI?.listSpoolVideos) {
        spoolItems = (await window.electronAPI.listSpoolVideos()) || [];
      }

      if (window.electronAPI?.getSpoolStorageInfo) {
        const info = await window.electronAPI.getSpoolStorageInfo();
        if (info && info.success) {
          count = info.fileCount;
          totalBytes = info.totalBytes;
          freeDiskBytes = info.freeDiskBytes;
          totalDiskBytes = info.totalDiskBytes;
          spoolDir = info.spoolDir || '';
        }
      } else {
        count = spoolItems.length;
        totalBytes = spoolItems.reduce((acc, it) => acc + (it.size || 0), 0);
      }

      const update = {
        spoolCount: count,
        spoolTotalBytes: totalBytes,
        freeDiskBytes,
        totalDiskBytes,
        spoolDir,
        spoolItems
      };

      this.notifyStatus(update);
      return update;
    } catch (e) {
      console.warn('[WorkstationRecorder] refreshSpoolInfo failed:', e);
      return null;
    }
  }

  // ── Background Spool Uploader Worker ──────────────────────────────────────────
  startSpoolWorker() {
    if (this.spoolWorkerInterval) return;

    // Check spool every 20 seconds for pending uploads
    this.spoolWorkerInterval = setInterval(() => {
      this.flushPendingSpool();
    }, 20000);

    // Initial check after 3 seconds
    setTimeout(() => {
      this.refreshSpoolInfo();
      this.flushPendingSpool();
    }, 3000);
  }

  async triggerManualUpload() {
    if (this.isUploading) return { status: 'already_uploading' };
    if (!navigator.onLine) return { status: 'offline' };
    await this.refreshSpoolInfo();
    await this.flushPendingSpool();
    return { status: 'started' };
  }

  async openSpoolFolder() {
    if (window.electronAPI?.openSpoolFolder) {
      return await window.electronAPI.openSpoolFolder();
    }
    return { success: false, error: 'Not in desktop environment' };
  }

  async openSpoolVideo(fileName) {
    if (window.electronAPI?.openSpoolVideo) {
      return await window.electronAPI.openSpoolVideo(fileName);
    }
    return { success: false, error: 'Not in desktop environment' };
  }

  async deleteSpoolVideo(fileName) {
    if (window.electronAPI?.deleteSpoolVideo) {
      const res = await window.electronAPI.deleteSpoolVideo(fileName);
      await this.refreshSpoolInfo();
      return res;
    }
    return { success: false, error: 'Not in desktop environment' };
  }

  async flushPendingSpool() {
    if (this.isUploading || !navigator.onLine) return;
    if (!window.electronAPI?.listSpoolVideos || !window.electronAPI?.readSpoolVideo) return;

    this.isUploading = true;
    this.notifyStatus({ isUploading: true });

    try {
      const spoolList = await window.electronAPI.listSpoolVideos();
      if (!spoolList || spoolList.length === 0) {
        this.isUploading = false;
        this.notifyStatus({
          isUploading: false,
          currentUpload: null,
          spoolCount: 0,
          spoolTotalBytes: 0,
          spoolItems: []
        });
        return;
      }

      console.log(`[WorkstationRecorder] Found ${spoolList.length} video chunks pending upload.`);

      // Upload oldest first (FIFO)
      for (const item of spoolList) {
        if (!navigator.onLine) {
          console.log('[WorkstationRecorder] Network dropped during spool flush. Pausing.');
          break;
        }

        const { fileName, metadata, size } = item;
        const readRes = await window.electronAPI.readSpoolVideo(fileName);

        if (!readRes?.success || !readRes.buffer) {
          continue;
        }

        const videoBlob = new Blob([readRes.buffer], { type: 'video/webm' });
        const formData = new FormData();

        formData.append('user_id', metadata?.user_id || this.currentUser?.id || 0);
        formData.append('staff_name', metadata?.staff_name || this.currentUser?.name || 'Staff');
        formData.append('date', metadata?.date || new Date().toISOString().split('T')[0]);
        formData.append('start_time', metadata?.start_time || '09:00:00');
        formData.append('end_time', metadata?.end_time || '09:30:00');
        formData.append('chunk_index', metadata?.chunk_index || 1);
        formData.append('duration_seconds', metadata?.duration_seconds || 1800);
        formData.append('video_file', videoBlob, fileName);

        const base = getApiBase ? getApiBase() : API_BASE;
        const uploadUrl = `${base}api/screen_monitor/upload_workstation_video.php`;

        // Notify initial upload state
        const uploadStartTime = Date.now();
        this.notifyStatus({
          isUploading: true,
          currentUpload: {
            fileName,
            chunkIndex: metadata?.chunk_index || 1,
            percent: 0,
            loaded: 0,
            total: size || videoBlob.size,
            speedMbps: 0
          }
        });

        try {
          const res = await axios.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 600000, // 10 minutes timeout for 1080p 30-min chunk network upload
            onUploadProgress: (progressEvent) => {
              const loaded = progressEvent.loaded || 0;
              const total = progressEvent.total || videoBlob.size;
              const percent = total > 0 ? Math.min(100, Math.round((loaded * 100) / total)) : 0;
              const elapsedSec = (Date.now() - uploadStartTime) / 1000;
              const speedMbps = elapsedSec > 0 ? ((loaded * 8) / (elapsedSec * 1024 * 1024)).toFixed(2) : 0;

              this.notifyStatus({
                isUploading: true,
                currentUpload: {
                  fileName,
                  chunkIndex: metadata?.chunk_index || 1,
                  percent,
                  loaded,
                  total,
                  speedMbps
                }
              });
            }
          });

          if (res.data?.status === 'success') {
            console.log(`[WorkstationRecorder] Chunk ${fileName} uploaded to Google Drive! Cleaning local spool.`);
            await window.electronAPI.deleteSpoolVideo(fileName);
            await this.refreshSpoolInfo();

            this.notifyStatus({
              lastUploadedChunk: {
                fileName,
                chunkIndex: metadata?.chunk_index || 1,
                time: new Date().toLocaleTimeString(),
                viewLink: res.data.view_link,
                driveFileId: res.data.drive_file_id
              },
              currentUpload: null
            });
          }
        } catch (uploadErr) {
          console.warn(`[WorkstationRecorder] Upload error for ${fileName}, will retry in next cycle:`, uploadErr?.message);
          this.notifyStatus({
            currentUpload: null
          });
          break; // Stop loop and retry in next cycle if network fails
        }
      }
    } catch (err) {
      console.error('[WorkstationRecorder] Spool worker glitch:', err);
    } finally {
      this.isUploading = false;
      this.notifyStatus({
        isUploading: false,
        currentUpload: null
      });
      await this.refreshSpoolInfo();
    }
  }

  destroy() {
    this.stopContinuousRecording();
    if (this.spoolWorkerInterval) {
      clearInterval(this.spoolWorkerInterval);
      this.spoolWorkerInterval = null;
    }
    this.flushPendingSpool();
  }
}

export const workstationRecorderService = new WorkstationRecorderService();
export default workstationRecorderService;
