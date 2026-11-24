/**
 * meetingRecorderEngine.js
 * Step 1: MediaStream Audio & Video Mixer Engine
 * Captures high-definition viewport/tab video and mixes local mic,
 * remote peers' audio, and tab system audio into a unified composite stream
 * ready for MediaRecorder without UI lag or heavy CPU overhead.
 */

/**
 * Checks and returns the most optimal video/audio MIME type supported by current browser
 */
export function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }

  const preferredTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4'
  ];

  for (const type of preferredTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}

/**
 * Creates a composite recording stream by combining:
 * 1. Screen/Current Tab Display Media (1080p/720p 30fps)
 * 2. Host's Local Microphone Audio Track
 * 3. All Remote Participants' Audio Tracks
 * 4. Tab System Audio (if shared by user)
 *
 * @param {Object} options
 * @param {MediaStream} options.localStream - Local host stream with mic track
 * @param {Array} options.remotePeerList - Array of [peerId, remote] entries with streams
 * @param {Function} options.onScreenEnded - Callback if user clicks native browser "Stop sharing"
 * @returns {Promise<{ compositeStream: MediaStream, audioCtx: AudioContext, cleanup: Function }>}
 */
export async function createCompositeMeetingStream({ localStream, remotePeerList = [], onScreenEnded }) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Screen capture is not supported on this browser.');
  }

  // 1. Capture Current Tab / Screen with Tab Audio
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: 'browser',
      frameRate: { ideal: 30, max: 60 },
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
    },
    audio: true, // Captures tab audio (media, videos, tabs)
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    systemAudio: 'include',
  });

  const videoTrack = displayStream.getVideoTracks()[0];
  if (!videoTrack) {
    displayStream.getTracks().forEach(t => t.stop());
    throw new Error('No video track selected for recording.');
  }

  // Handle native "Stop sharing" button bar click
  if (typeof onScreenEnded === 'function') {
    videoTrack.onended = () => {
      onScreenEnded();
    };
  }

  // 2. Initialize Web Audio Context for Multi-Source Audio Mixing
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let destination = null;
  const audioSources = [];

  try {
    if (AudioCtx) {
      audioCtx = new AudioCtx();
      destination = audioCtx.createMediaStreamDestination();

      // Mix A: Tab System Audio (if user checked "Share tab audio")
      const tabAudioTracks = displayStream.getAudioTracks();
      if (tabAudioTracks.length > 0) {
        try {
          const tabSource = audioCtx.createMediaStreamSource(new MediaStream([tabAudioTracks[0]]));
          tabSource.connect(destination);
          audioSources.push(tabSource);
        } catch (e) {
          console.warn('Tab audio routing notice:', e.message);
        }
      }

      // Mix B: Host's Local Microphone Audio
      if (localStream && localStream.getAudioTracks().length > 0) {
        const micTrack = localStream.getAudioTracks()[0];
        try {
          const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
          micSource.connect(destination);
          audioSources.push(micSource);
        } catch (e) {
          console.warn('Local mic routing notice:', e.message);
        }
      }

      // Mix C: All Connected Remote Participants' Audio Tracks
      if (Array.isArray(remotePeerList)) {
        remotePeerList.forEach(([peerId, remote]) => {
          if (remote?.stream && remote.stream.getAudioTracks().length > 0) {
            try {
              const remoteTrack = remote.stream.getAudioTracks()[0];
              const remoteSource = audioCtx.createMediaStreamSource(new MediaStream([remoteTrack]));
              remoteSource.connect(destination);
              audioSources.push(remoteSource);
            } catch (e) {
              console.warn(`Remote peer (${peerId}) audio routing notice:`, e.message);
            }
          }
        });
      }
    }
  } catch (audioErr) {
    console.warn('Web Audio Mixer initialization warning, using direct tracks fallback:', audioErr);
  }

  // 3. Assemble Unified Composite MediaStream
  const mixedAudioTracks = destination ? destination.stream.getAudioTracks() : displayStream.getAudioTracks();
  const compositeStream = new MediaStream([videoTrack, ...mixedAudioTracks]);

  // 4. Safe Cleanup Teardown Function
  const cleanup = () => {
    // Stop captured display tracks
    displayStream.getTracks().forEach(track => {
      try { track.stop(); } catch (e) {}
    });

    // Disconnect audio nodes
    audioSources.forEach(source => {
      try { source.disconnect(); } catch (e) {}
    });

    // Close AudioContext
    if (audioCtx && audioCtx.state !== 'closed') {
      try { audioCtx.close(); } catch (e) {}
    }
  };

  return {
    displayStream,
    compositeStream,
    audioCtx,
    videoTrack,
    cleanup,
  };
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS string
 */
export function formatRecordingDuration(totalSeconds = 0) {
  const sec = Math.floor(totalSeconds % 60);
  const min = Math.floor((totalSeconds / 60) % 60);
  const hrs = Math.floor(totalSeconds / 3600);

  const pad = (n) => String(n).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  }
  return `${pad(min)}:${pad(sec)}`;
}

/**
 * Formats byte size to human readable (MB, GB, KB)
 */
export function formatRecordingSize(bytes = 0) {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
