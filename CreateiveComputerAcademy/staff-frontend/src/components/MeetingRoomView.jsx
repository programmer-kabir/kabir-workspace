import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FiLoader, FiAlertTriangle, FiPhoneOff, FiCopy, FiCheck, FiShield } from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function MeetingRoomView({ roomId, meetingTitle, currentUser, onLeave }) {
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // 1. Log Attendance Helper
  const logAttendance = async (action) => {
    if (!currentUser?.id || !roomId) return;
    try {
      await axios.post(`${API_BASE}api/meetings/log_attendance.php`, {
        room_id: roomId,
        user_id: currentUser.id,
        action
      });
    } catch (err) {
      console.warn(`Meeting attendance log (${action}) notice:`, err.message);
    }
  };

  useEffect(() => {
    let pingInterval = null;
    let isMounted = true;

    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }

        const existingScript = document.getElementById('jitsi-meet-api-script');
        if (existingScript) {
          existingScript.onload = () => resolve(window.JitsiMeetExternalAPI);
          existingScript.onerror = reject;
          return;
        }

        const script = document.createElement('script');
        script.id = 'jitsi-meet-api-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Failed to load WebRTC conference engine.'));
        document.body.appendChild(script);
      });
    };

    const initMeeting = async () => {
      try {
        await loadJitsiScript();
        if (!isMounted || !containerRef.current) return;

        // Container cleanup
        containerRef.current.innerHTML = '';

        const domain = 'meet.jit.si';
        // Prefix room to avoid public collisions
        const cleanRoom = `CCA_ACADEMY_${roomId.replace(/[^a-zA-Z0-9_]/g, '')}`;

        const options = {
          roomName: cleanRoom,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: currentUser?.name || 'CCA Member',
            email: currentUser?.email || ''
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableClosePage: false,
            disableInviteFunctions: true
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#0f172a',
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'raisehand',
              'videoquality', 'tileview'
            ]
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        // Event listeners
        api.addEventListener('videoConferenceJoined', () => {
          if (!isMounted) return;
          setLoading(false);
          logAttendance('join');

          // Keep alive ping every 60s
          pingInterval = setInterval(() => {
            logAttendance('ping');
          }, 60000);
        });

        api.addEventListener('videoConferenceLeft', () => {
          logAttendance('leave');
          if (onLeave) onLeave();
        });

        api.addEventListener('readyToClose', () => {
          logAttendance('leave');
          if (onLeave) onLeave();
        });

      } catch (err) {
        if (!isMounted) return;
        console.error('Jitsi Init Error:', err);
        setError(err.message || 'Conference engine initialization failed.');
        setLoading(false);
      }
    };

    initMeeting();

    return () => {
      isMounted = false;
      if (pingInterval) clearInterval(pingInterval);
      logAttendance('leave');
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {}
        jitsiApiRef.current = null;
      }
    };
  }, [roomId, currentUser?.id]);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Meeting link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[550px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      
      {/* Top Bar inside Meeting */}
      <div className="h-12 px-5 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800/80 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-black uppercase text-rose-500 tracking-wider">LIVE</span>
          </div>
          <span className="text-slate-600 dark:text-slate-400">|</span>
          <span className="text-xs font-black text-white truncate max-w-[200px] sm:max-w-xs">
            {meetingTitle || 'Academy Meeting Room'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Copy meeting URL to share"
          >
            {copied ? <FiCheck size={13} className="text-emerald-400" /> : <FiCopy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>
      </div>

      {/* Conference Container */}
      <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950 text-white">
            <div className="w-12 h-12 rounded-2xl bg-primary-600/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
              <FiLoader className="w-6 h-6 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black">Connecting to Secure Meeting Room...</p>
              <p className="text-xs text-slate-500 mt-0.5">Setting up camera, microphone and WebRTC channels</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950 text-white p-6 text-center">
            <FiAlertTriangle className="w-10 h-10 text-rose-500" />
            <p className="text-sm font-bold text-rose-400">{error}</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Please check your internet connection or browser camera/microphone permissions.
            </p>
          </div>
        )}

        {/* Jitsi External API Parent Node */}
        <div ref={containerRef} className="w-full h-full" />
      </div>

    </div>
  );
}
