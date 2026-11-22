import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FiLoader, FiAlertTriangle, FiPhoneOff, FiCopy, FiCheck,
  FiShield, FiRadio, FiVideo, FiExternalLink
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function MeetingRoomView({ roomId, meetingTitle, currentUser, onLeave }) {
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const cleanRoom = `CCA_ACADEMY_${(roomId || '').replace(/[^a-zA-Z0-9_]/g, '')}`;
  const directRoomUrl = `https://meet.jit.si/${cleanRoom}`;

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
    let fallbackTimer = null;

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

        containerRef.current.innerHTML = '';

        const domain = 'meet.jit.si';

        const options = {
          roomName: cleanRoom,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: (currentUser?.name || 'Admin') + ' (Host)',
            email: currentUser?.email || ''
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableClosePage: false
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#070b14',
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'raisehand',
              'videoquality', 'tileview', 'mute-everyone', 'settings'
            ]
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        // Immediately log attendance for entering room
        logAttendance('join');

        pingInterval = setInterval(() => {
          logAttendance('ping');
        }, 60000);

        // Remove loading overlay as soon as iframe mounts so user can see camera/mic & Join button!
        fallbackTimer = setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 1200);

        api.addEventListener('videoConferenceJoined', () => {
          if (!isMounted) return;
          setLoading(false);
          logAttendance('join');
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
      if (fallbackTimer) clearTimeout(fallbackTimer);
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
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      
      {/* Sub-header status bar */}
      <div className="h-11 px-5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase text-rose-500 tracking-wider">SECURE STUDIO LINK</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-bold text-slate-300 truncate max-w-xs md:max-w-md">
            {meetingTitle || 'Academy Host Room'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <FiShield size={10} />
            <span>Attendance Logged</span>
          </div>

          <a
            href={directRoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Open WebRTC room in a standalone full window"
          >
            <FiExternalLink size={12} />
            <span className="hidden sm:inline">Open in Tab</span>
          </a>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
            <span>{copied ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>
      </div>

      {/* Jitsi Host Container */}
      <div className="relative flex-1 w-full h-full bg-[#070b14] overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-4 bg-[#070b14]/90 backdrop-blur-xs text-white p-6 transition-opacity duration-300">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <FiVideo className="w-7 h-7 animate-pulse" />
              </div>
              <span className="absolute -inset-2 rounded-3xl border border-rose-500/20 animate-ping opacity-40"></span>
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-white tracking-wide">
                Initializing CCA Studio Broadcast...
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Setting up WebRTC audio-video channels & attendance tracker
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#070b14] text-white p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-rose-400 max-w-md">{error}</p>
            <div className="flex gap-2 justify-center mt-2">
              <a
                href={directRoomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <FiExternalLink size={13} />
                <span>Open Direct in Browser</span>
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
