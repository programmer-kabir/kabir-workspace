// Attendance-Desktop/src/services/ScreenStreamService.js
import Pusher from 'pusher-js';
import axios from 'axios';
import { API_BASE, getApiBase } from '../utils/api';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

class ScreenStreamService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.activeStream = null;
    this.currentUser = null;
    this.isStreaming = false;
  }

  // Initialize Pusher listener when staff is checked in
  init(user) {
    if (!user || !user.id) return;
    this.currentUser = user;

    if (this.pusher) {
      this.destroy();
    }

    try {
      this.pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const channelName = `screen-staff-${user.id}`;
      this.channel = this.pusher.subscribe(channelName);

      this.channel.bind('screen-signal', async (data) => {
        if (!data || !data.signal_type) return;
        await this.handleSignal(data);
      });

      // Announce staff online status to admin
      this.sendSignal('staff-online', 'admin', {
        user_id: user.id,
        name: user.name,
        email: user.email
      });

      console.log(`[ScreenStreamService] Subscribed to ${channelName} & announced online.`);
    } catch (err) {
      console.error('[ScreenStreamService] Init error:', err);
    }
  }

  async handleSignal(data) {
    const { signal_type, sender_id, payload } = data;

    switch (signal_type) {
      case 'request-stream':
        console.log('[ScreenStreamService] Admin requested live screen stream.');
        await this.startStreaming(sender_id);
        break;

      case 'answer':
        if (this.peerConnection && payload && payload.sdp) {
          console.log('[ScreenStreamService] Received SDP answer from admin.');
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            // Drain any pending ICE candidates
            if (this.pendingCandidates && this.pendingCandidates.length > 0) {
              for (const cand of this.pendingCandidates) {
                try {
                  await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
                } catch (ce) {}
              }
              this.pendingCandidates = [];
            }
          } catch (err) {
            console.error('[ScreenStreamService] Error setting remote description answer:', err);
          }
        }
        break;

      case 'ice-candidate':
        if (payload && payload.candidate) {
          if (!this.peerConnection || !this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
            // Buffer candidate until remote description answer is set
            if (!this.pendingCandidates) this.pendingCandidates = [];
            this.pendingCandidates.push(payload.candidate);
            return;
          }
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.error('[ScreenStreamService] Error adding ICE candidate:', e);
          }
        }
        break;

      case 'control-command':
        // Fallback control command via Pusher if DataChannel is unavailable
        if (payload && payload.command && window.electronAPI?.sendRemoteInput) {
          window.electronAPI.sendRemoteInput(payload.command);
        }
        break;

      case 'stop-stream':
        console.log('[ScreenStreamService] Admin requested stop stream.');
        this.stopStreaming(true); // Keep screen stream warm in memory for instant reconnects
        break;

      default:
        break;
    }
  }

  // Obtains or reuses promptless desktop screen stream
  async getOrCaptureStream() {
    if (this.activeStream && this.activeStream.active) {
      const tracks = this.activeStream.getVideoTracks();
      if (tracks.length > 0 && tracks[0].readyState === 'live') {
        return this.activeStream;
      }
    }

    // Method 1: Electron native desktopCapturer (100% prompt-free in Electron)
    if (window.electronAPI?.getScreenSources) {
      try {
        const sources = await window.electronAPI.getScreenSources();
        if (sources && sources.length > 0) {
          const primarySource = sources[0];

          // Fetch exact native screen resolution to prevent horizontal squishing or downscaling
          let screenW = 1920;
          let screenH = 1080;
          if (window.electronAPI?.getScreenBounds) {
            try {
              const b = await window.electronAPI.getScreenBounds();
              if (b && b.width && b.height) {
                screenW = b.width;
                screenH = b.height;
              }
            } catch (e) {}
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: primarySource.id,
                maxWidth: screenW,
                maxHeight: screenH,
                maxFrameRate: 24
              }
            }
          });
          stream.getVideoTracks().forEach((track) => {
            if ('contentHint' in track) {
              track.contentHint = 'detail';
            }
          });
          this.activeStream = stream;
          return stream;
        }
      } catch (err) {
        console.warn('[ScreenStreamService] getUserMedia desktop source failed, trying getDisplayMedia:', err);
      }
    }

    // Method 2: Standard getDisplayMedia (auto-granted by main.cjs session handler)
    if (navigator.mediaDevices?.getDisplayMedia) {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 24, max: 24, min: 20 },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      });
      stream.getVideoTracks().forEach((track) => {
        if ('contentHint' in track) {
          track.contentHint = 'detail';
        }
      });
      this.activeStream = stream;
      return stream;
    }

    throw new Error('No supported screen capture method found.');
  }

  // Pre-authorize & warm stream on Check-In or Login so Admin live views trigger zero user prompts
  async prewarmStream() {
    try {
      await this.getOrCaptureStream();
      console.log('[ScreenStreamService] Screen stream pre-authorized & ready in background.');
    } catch (err) {
      console.debug('[ScreenStreamService] Prewarm stream notice:', err.message);
    }
  }

  async startStreaming(targetAdminId = 'admin') {
    if (this.isNegotiating) {
      console.log('[ScreenStreamService] Stream negotiation already in progress, ignoring duplicate trigger.');
      return;
    }
    this.isNegotiating = true;
    this.pendingCandidates = [];

    try {
      // 1. Obtain warm or silently captured primary screen
      await this.getOrCaptureStream();
      if (!this.activeStream) {
        console.warn('[ScreenStreamService] Unable to obtain screen stream.');
        this.isNegotiating = false;
        return;
      }

      // 2. Setup WebRTC PeerConnection
      if (this.peerConnection) {
        try { this.peerConnection.close(); } catch (e) {}
      }

      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Add screen tracks with maximum text clarity and 24 FPS optimization
      this.activeStream.getTracks().forEach((track) => {
        if (track.kind === 'video' && 'contentHint' in track) {
          track.contentHint = 'detail';
        }
        const sender = this.peerConnection.addTrack(track, this.activeStream);
        try {
          if (track.kind === 'video') {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = 3000000; // 3.0 Mbps for crisp 1080p
            params.encodings[0].maxFramerate = 24; // 24 FPS smooth motion
            sender.setParameters(params);
          }
        } catch (e) {}
      });

      // 3. Setup DataChannel for sub-millisecond remote control
      this.dataChannel = this.peerConnection.createDataChannel('remote-control');
      this.dataChannel.onopen = () => {
        console.log('[ScreenStreamService] Remote Control DataChannel OPEN.');
      };
      this.dataChannel.onmessage = (event) => {
        const cmd = event.data;
        if (cmd && window.electronAPI?.sendRemoteInput) {
          window.electronAPI.sendRemoteInput(cmd);
        }
      };

      // 4. Handle ICE Candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal('ice-candidate', targetAdminId, {
            candidate: event.candidate
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log('[ScreenStreamService] Connection State:', this.peerConnection.connectionState);
      };

      // 5. Create & send SDP Offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false
      });
      await this.peerConnection.setLocalDescription(offer);

      // Get screen resolution bounds
      let bounds = { width: 1920, height: 1080 };
      if (window.electronAPI?.getScreenBounds) {
        bounds = await window.electronAPI.getScreenBounds();
      }

      await this.sendSignal('offer', targetAdminId, {
        sdp: this.peerConnection.localDescription,
        bounds: bounds
      });

      this.isStreaming = true;
    } catch (err) {
      console.error('[ScreenStreamService] Failed to start screen stream:', err);
    } finally {
      setTimeout(() => {
        this.isNegotiating = false;
      }, 3500);
    }
  }

  stopStreaming(keepStreamWarm = true) {
    if (!keepStreamWarm && this.activeStream) {
      this.activeStream.getTracks().forEach((t) => t.stop());
      this.activeStream = null;
    }
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.isStreaming = false;
  }

  async sendSignal(signalType, targetId, payload) {
    try {
      const base = getApiBase ? getApiBase() : API_BASE;
      const url = `${base}api/screen_monitor/signal.php`;
      await axios.post(url, {
        signal_type: signalType,
        sender_id: this.currentUser ? this.currentUser.id : 'unknown',
        target_id: targetId,
        payload: payload
      });
    } catch (err) {
      console.error('[ScreenStreamService] Signal dispatch error:', err);
    }
  }

  destroy() {
    this.stopStreaming(false); // Fully release screen stream on check-out / logout
    if (this.currentUser) {
      this.sendSignal('staff-offline', 'admin', { user_id: this.currentUser.id });
    }
    if (this.channel) {
      this.channel.unbind_all();
      this.channel.unsubscribe();
      this.channel = null;
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.currentUser = null;
  }
}

export const screenStreamService = new ScreenStreamService();
export default screenStreamService;
