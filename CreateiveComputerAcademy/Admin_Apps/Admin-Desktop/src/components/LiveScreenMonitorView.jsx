// admin-frontend/src/pages/LiveScreenMonitor.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import {
  FiMonitor, FiMaximize2, FiMinimize2, FiRefreshCw, FiSearch,
  FiUsers, FiClock, FiShield, FiSliders, FiPlay, FiSquare,
  FiActivity, FiWifi, FiCheckCircle, FiAlertCircle, FiX, FiMousePointer,
  FiLayers
} from 'react-icons/fi';
import { toast } from 'sonner';
import { soundFx } from '../utils/soundFx';
import { getApiBase } from '../context/AuthContext';

const API_BASE = getApiBase();

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const LiveScreenMonitor = () => {
  const [activeStaffList, setActiveStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState(3); // 2, 3, or 4
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Streams and Peer Connections state
  // streams[userId] = MediaStream
  const [streams, setStreams] = useState({});
  // streamStatus[userId] = 'connecting' | 'live' | 'idle'
  const [streamStatus, setStreamStatus] = useState({});
  // staffIdleMap[userId] = { isIdle: boolean, idleSeconds: number, timestamp: number }
  const [staffIdleMap, setStaffIdleMap] = useState({});
  // staffActiveWindowMap[userId] = { process: string, title: string, pid: number, timestamp: number }
  const [staffActiveWindowMap, setStaffActiveWindowMap] = useState({});
  // Selected staff to view running applications modal
  const [selectedStaffAppsModal, setSelectedStaffAppsModal] = useState(null);

  // Remote Control / Inspection Modal State
  const [inspectingStaff, setInspectingStaff] = useState(null);
  const [isControlActive, setIsControlActive] = useState(false);
  const [remoteBounds, setRemoteBounds] = useState({ width: 1920, height: 1080 });
  const [displayFitMode, setDisplayFitMode] = useState('fill'); // 'fill' = 100% Edge-to-edge (zero gap) | 'fit' = original aspect ratio
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  // Refs for WebRTC peers & channels
  const peersRef = useRef({}); // { [userId]: RTCPeerConnection }
  const dataChannelsRef = useRef({}); // { [userId]: RTCDataChannel }
  const pusherRef = useRef(null);
  const notifiedOfflineRef = useRef({});
  const modalVideoRef = useRef(null);
  const pendingCandidatesRef = useRef({}); // { [staffId]: [] }
  const requestDebounceRef = useRef({}); // { [staffId]: timestamp }

  // Fetch all staff who checked in today and haven't checked out yet
  const fetchActiveStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/screen_monitor/get_active_staff.php`);
      if (res.data?.status === 'success') {
        const list = res.data.data || [];
        setActiveStaffList(list);

        // Detect and trigger force-close / abrupt offline alerts
        list.forEach(staff => {
          const staffId = staff.user_id;
          if (staff.is_abrupt_offline) {
            if (!notifiedOfflineRef.current[staffId]) {
              notifiedOfflineRef.current[staffId] = true;
              soundFx.playAlert();
              toast.error(`⚠️ Force-Close Alert: ${staff.name} went offline without checking out!`, {
                duration: 8000
              });
            }
          } else if (notifiedOfflineRef.current[staffId]) {
            // Heartbeat recovered / staff reconnected
            delete notifiedOfflineRef.current[staffId];
            toast.success(`🟢 Reconnected: ${staff.name} is back online!`, {
              duration: 4000
            });
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch active staff:', err);
      toast.error('Failed to load active staff roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStaff();
    const interval = setInterval(fetchActiveStaff, 20000); // Check heartbeat status every 20s
    return () => clearInterval(interval);
  }, []);

  // Listen to browser native fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Initialize Pusher WebRTC signaling
  useEffect(() => {
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2',
      forceTLS: true
    });
    pusherRef.current = pusher;

    const adminChannel = pusher.subscribe('screen-admin-channel');

    adminChannel.bind('screen-signal', async (data) => {
      if (!data) return;
      const { signal_type, sender_id, payload } = data;

      switch (signal_type) {
        case 'staff-online':
          toast.info(`${payload?.name || 'Staff'} came online on desktop attendance.`);
          fetchActiveStaff();
          break;

        case 'staff-offline':
          handleStaffOffline(sender_id);
          fetchActiveStaff();
          break;

        case 'staff-force-quit': {
          const staffName = payload?.name || 'Staff';
          const staffUserId = payload?.user_id || sender_id;
          notifiedOfflineRef.current[staffUserId] = true;
          soundFx.playAlert();
          toast.error(`🚨 Force-Close Alert: ${staffName} exited desktop app without checking out!`, {
            duration: 10000
          });
          setActiveStaffList(prev => prev.map(s => {
            if (String(s.user_id) === String(staffUserId)) {
              return { ...s, is_abrupt_offline: true, seconds_since_heartbeat: 999 };
            }
            return s;
          }));
          handleStaffOffline(staffUserId);
          fetchActiveStaff();
          break;
        }

        case 'staff-idle':
          setStaffIdleMap(prev => ({
            ...prev,
            [sender_id]: {
              isIdle: true,
              idleSeconds: payload?.idle_seconds || 300,
              name: payload?.name || 'Staff',
              timestamp: Date.now()
            }
          }));
          toast.warning(`⚠️ Inactivity Alert: ${payload?.name || 'Staff'} has been idle for 5+ minutes!`, {
            duration: 7000
          });
          break;

        case 'staff-active':
          setStaffIdleMap(prev => {
            const next = { ...prev };
            delete next[sender_id];
            return next;
          });
          toast.success(`${payload?.name || 'Staff'} resumed computer activity.`, {
            duration: 3500
          });
          break;

        case 'staff-active-window':
          if (sender_id && payload?.active_window) {
            setStaffActiveWindowMap(prev => ({
              ...prev,
              [sender_id]: {
                process: payload.active_window.process,
                title: payload.active_window.title,
                pid: payload.active_window.pid,
                timestamp: Date.now()
              }
            }));
          }
          break;

        case 'offer':
          if (sender_id && payload?.sdp) {
            await handleReceiveOffer(sender_id, payload.sdp, payload.bounds);
          }
          break;

        case 'ice-candidate':
          if (sender_id && payload?.candidate) {
            handleReceiveIceCandidate(sender_id, payload.candidate);
          }
          break;

        default:
          break;
      }
    });

    return () => {
      try {
        adminChannel.unbind_all();
        adminChannel.unsubscribe();
        if (pusher.connection.state !== 'disconnected') {
          pusher.disconnect();
        }
      } catch (e) {}
      // Close all active peers
      try {
        Object.values(peersRef.current).forEach(peer => peer?.close());
      } catch (e) {}
      peersRef.current = {};
      dataChannelsRef.current = {};
    };
  }, []);

  // Request a stream from a staff member with in-flight debounce and timeout protection
  const requestStreamFromStaff = async (staffId) => {
    // If already live and stream exists, no need to re-request
    if (streams[staffId] && streamStatus[staffId] === 'live') {
      return;
    }

    // Debounce: If already requested within last 4 seconds, ignore spam clicks
    const now = Date.now();
    const lastReq = requestDebounceRef.current[staffId] || 0;
    if (streamStatus[staffId] === 'connecting' && (now - lastReq) < 4000) {
      toast.info(`Connecting to staff #${staffId}... please wait a second.`, { duration: 1500 });
      return;
    }
    requestDebounceRef.current[staffId] = now;

    try {
      setStreamStatus(prev => ({ ...prev, [staffId]: 'connecting' }));
      // Clear any pending candidates for clean new session
      pendingCandidatesRef.current[staffId] = [];

      await axios.post(`${API_BASE}api/screen_monitor/signal.php`, {
        signal_type: 'request-stream',
        sender_id: 'admin',
        target_id: staffId,
        payload: { admin_id: 'admin' }
      });
      toast.info(`Connecting live P2P feed with staff #${staffId}...`);

      // Auto-fallback: If no stream received after 9s, release connecting lock
      setTimeout(() => {
        setStreamStatus(prev => {
          if (prev[staffId] === 'connecting') {
            return { ...prev, [staffId]: 'idle' };
          }
          return prev;
        });
      }, 9000);
    } catch (err) {
      console.error('Error requesting stream:', err);
      toast.error('Could not request live feed.');
      setStreamStatus(prev => ({ ...prev, [staffId]: 'idle' }));
    }
  };

  // Handle incoming WebRTC Offer from Staff
  const handleReceiveOffer = async (staffId, sdpOffer, bounds) => {
    try {
      if (bounds) {
        setRemoteBounds(bounds);
      }

      // Close previous peer if any
      if (peersRef.current[staffId]) {
        try { peersRef.current[staffId].close(); } catch (e) {}
      }

      const peer = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current[staffId] = peer;

      // Handle receiving screen video track with maximum text clarity
      peer.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          if (event.track && 'contentHint' in event.track) {
            event.track.contentHint = 'detail';
          }
          setStreams(prev => ({ ...prev, [staffId]: stream }));
          setStreamStatus(prev => ({ ...prev, [staffId]: 'live' }));
        }
      };

      // Handle DataChannel created by Staff for Remote Control
      peer.ondatachannel = (event) => {
        const dc = event.channel;
        dataChannelsRef.current[staffId] = dc;
        dc.onopen = () => console.log(`DataChannel to staff #${staffId} OPEN.`);
        dc.onclose = () => console.log(`DataChannel to staff #${staffId} CLOSED.`);
      };

      // Exchange ICE Candidates
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', staffId, { candidate: event.candidate });
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
          setStreamStatus(prev => ({ ...prev, [staffId]: 'live' }));
        } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
          setTimeout(() => {
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
              setStreamStatus(prev => ({ ...prev, [staffId]: 'idle' }));
            }
          }, 3000);
        }
      };

      // Set Remote Offer
      await peer.setRemoteDescription(new RTCSessionDescription(sdpOffer));

      // Drain queued ICE candidates that arrived before setRemoteDescription
      if (pendingCandidatesRef.current[staffId] && pendingCandidatesRef.current[staffId].length > 0) {
        const queued = pendingCandidatesRef.current[staffId];
        pendingCandidatesRef.current[staffId] = [];
        for (const cand of queued) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('Error adding drained candidate:', e);
          }
        }
      }

      // Create & send SDP Answer
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      await sendSignal('answer', staffId, { sdp: peer.localDescription });
    } catch (err) {
      console.error('Failed to handle incoming offer:', err);
      setStreamStatus(prev => ({ ...prev, [staffId]: 'idle' }));
    }
  };

  const handleReceiveIceCandidate = async (staffId, candidate) => {
    const peer = peersRef.current[staffId];
    if (!peer || !peer.remoteDescription || !peer.remoteDescription.type) {
      // Buffer early ICE candidate until offer/remoteDescription is ready!
      if (!pendingCandidatesRef.current[staffId]) {
        pendingCandidatesRef.current[staffId] = [];
      }
      pendingCandidatesRef.current[staffId].push(candidate);
      return;
    }

    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ICE candidate:', err);
    }
  };

  const handleStaffOffline = (staffId) => {
    if (peersRef.current[staffId]) {
      peersRef.current[staffId].close();
      delete peersRef.current[staffId];
    }
    delete dataChannelsRef.current[staffId];
    setStreams(prev => {
      const next = { ...prev };
      delete next[staffId];
      return next;
    });
    setStreamStatus(prev => ({ ...prev, [staffId]: 'idle' }));
  };

  const sendSignal = async (signalType, targetId, payload) => {
    try {
      await axios.post(`${API_BASE}api/screen_monitor/signal.php`, {
        signal_type: signalType,
        sender_id: 'admin',
        target_id: targetId,
        payload: payload
      });
    } catch (err) {
      console.error('Failed to send signal:', err);
    }
  };

  // Transmit remote input command via WebRTC DataChannel (sub-millisecond)
  const sendControlCommand = (cmd) => {
    try {
      if (!inspectingStaff?.user_id) return;
      const staffId = inspectingStaff.user_id;
      const dc = dataChannelsRef.current[staffId];
      if (dc && dc.readyState === 'open') {
        dc.send(cmd);
      } else {
        // Fallback via Pusher signaling
        sendSignal('control-command', staffId, { command: cmd });
      }
    } catch (err) {
      console.error('Failed to send control command:', err);
    }
  };

  // Convert mouse event on modal video player to remote coordinates
  const handleRemoteMouseEvent = (e, eventType) => {
    try {
      if (!isControlActive || !modalVideoRef.current) return;
      const rect = modalVideoRef.current.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      // Scale to remote machine's actual resolution
      const rw = (remoteBounds && remoteBounds.width) ? remoteBounds.width : 1920;
      const rh = (remoteBounds && remoteBounds.height) ? remoteBounds.height : 1080;
      const scaleX = rw / rect.width;
      const scaleY = rh / rect.height;

      const targetX = Math.round(x * scaleX);
      const targetY = Math.round(y * scaleY);

      switch (eventType) {
        case 'move':
          sendControlCommand(`M ${targetX} ${targetY}`);
          break;
        case 'down':
          if (e.button === 2) {
            sendControlCommand(`RD ${targetX} ${targetY}`);
          } else {
            sendControlCommand(`LD ${targetX} ${targetY}`);
          }
          break;
        case 'up':
          if (e.button === 2) {
            sendControlCommand(`RU ${targetX} ${targetY}`);
          } else {
            sendControlCommand(`LU ${targetX} ${targetY}`);
          }
          break;
        case 'click':
          sendControlCommand(`C ${targetX} ${targetY}`);
          break;
        case 'contextmenu':
          e.preventDefault();
          sendControlCommand(`RC ${targetX} ${targetY}`);
          break;
        case 'dblclick':
          sendControlCommand(`DC ${targetX} ${targetY}`);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Remote mouse event error:', err);
    }
  };

  const handleRemoteWheel = (e) => {
    try {
      if (!isControlActive) return;
      const delta = e.deltaY > 0 ? -120 : 120;
      sendControlCommand(`W ${delta}`);
    } catch (err) {
      console.error('Remote wheel error:', err);
    }
  };

  const handleRemoteKeyDown = (e) => {
    try {
      if (!isControlActive) return;
      if (e.key === 'Escape') {
        setIsControlActive(false);
        toast.info('Exited Remote Control Mode.');
        return;
      }
      // Prevent browser default shortcut like Ctrl+W
      e.preventDefault();
      if (e.key.length === 1) {
        sendControlCommand(`T ${e.key}`);
      } else {
        sendControlCommand(`KD ${e.keyCode}`);
        setTimeout(() => sendControlCommand(`KU ${e.keyCode}`), 50);
      }
    } catch (err) {
      console.error('Remote key error:', err);
    }
  };

  // Calculate duty elapsed time
  const getElapsedDutyTime = (checkInTime) => {
    if (!checkInTime) return '0h 0m';
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const now = new Date();
    const checkIn = new Date();
    checkIn.setHours(hours, minutes, 0);

    const diffMs = Math.max(0, now - checkIn);
    const diffMins = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  // Filter staff list
  const departments = ['All', ...new Set(activeStaffList.map(s => s.department_name).filter(Boolean))];
  const filteredStaff = activeStaffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.employee_code && s.employee_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.designation && s.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = departmentFilter === 'All' || s.department_name === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto transition-colors rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* ── Top Header Toolbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-2xs">
              <FiMonitor size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Live Staff Surveillance Wall
                </h1>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  P2P Stream Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time zero-storage desktop screen monitoring & remote control for checked-in staff.
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
              <FiUsers className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Checked-In:</span>
              <span className="font-black text-slate-900 dark:text-white">{activeStaffList.length}</span>
            </div>

            {/* Grid Columns Switcher */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
              {[2, 3, 4].map(cols => (
                <button
                  key={cols}
                  onClick={() => setGridCols(cols)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${gridCols === cols
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {cols} Cols
                </button>
              ))}
            </div>

            <button
              onClick={fetchActiveStaff}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, designation, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${departmentFilter === dept
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-2xs'
                  }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Surveillance Grid ────────────────────────────────────────── */}
      <main className="flex-1 p-6">
        {loading && activeStaffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 dark:text-slate-400">
            <FiRefreshCw className="animate-spin text-blue-500 mb-3" size={36} />
            <p className="font-bold">Scanning active staff attendance records...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-3">
              <FiUsers size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Active Staff Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Either no staff members have checked in today, or no staff matched your search filter.
            </p>
          </div>
        ) : (
          <div className={`grid gap-5 ${gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
              gridCols === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' :
                'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            }`}>
            {filteredStaff.map((staff) => {
              const staffId = staff.user_id;
              const stream = streams[staffId];
              const status = streamStatus[staffId] || 'idle';
              const isLive = status === 'live' && !!stream;
              const idleInfo = staffIdleMap[staffId];
              const isStaffIdle = Boolean(idleInfo?.isIdle || staff.is_idle);
              const isAbruptOffline = Boolean(staff.is_abrupt_offline);
              const activeWin = staffActiveWindowMap[staffId] || {
                process: staff.active_process,
                title: staff.active_window_title
              };
              const runningApps = staff.running_apps_list || [];

              return (
                <div
                  key={staffId}
                  className={`group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border shadow-xs dark:shadow-xl overflow-hidden transition-all duration-200 ${isAbruptOffline
                      ? 'border-rose-300 dark:border-rose-500/60 shadow-rose-500/10 dark:shadow-rose-950/20 ring-1 ring-rose-400 dark:ring-rose-500/30'
                      : isStaffIdle
                        ? 'border-amber-300 dark:border-amber-500/80 shadow-amber-500/10 ring-1 ring-amber-400 dark:ring-amber-500/40'
                        : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                        {staff.profile_picture ? (
                          <img
                            src={`${API_BASE}${staff.profile_picture}`}
                            alt={staff.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${isAbruptOffline ? 'bg-rose-500' : isStaffIdle ? 'bg-amber-400' : isLive ? 'bg-emerald-400' : 'bg-slate-400 dark:bg-slate-500'
                          }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {staff.name}
                          </h4>
                          {staff.employee_code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                              {staff.employee_code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {staff.designation || staff.department_name || 'Staff Member'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      {isAbruptOffline ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 animate-pulse flex items-center gap-1">
                          🔴 Force Offline
                        </span>
                      ) : isStaffIdle ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 animate-pulse flex items-center gap-1">
                          ⚠️ Idle (5m+)
                        </span>
                      ) : null}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <FiClock size={10} className="text-emerald-500 dark:text-emerald-400" />
                          {staff.check_in?.substring(0, 5)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {getElapsedDutyTime(staff.check_in)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Window & Running Software Subheader */}
                  {isAbruptOffline ? (
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900/30 text-[11px]">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Workstation Offline</span>
                        {staff.seconds_since_heartbeat ? (
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">• {staff.seconds_since_heartbeat}s ago</span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">• Disconnected</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800/40">
                        App Closed
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800/80 text-[11px] gap-2">
                      <div
                        className="flex items-center gap-1.5 min-w-0 flex-1"
                        title={activeWin?.process ? `${activeWin.process}: ${activeWin.title || 'In focus'}` : 'No active window reported'}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0 animate-pulse" />
                        {activeWin?.process ? (
                          <div className="flex items-center gap-1 min-w-0 truncate">
                            <span className="font-semibold text-blue-700 dark:text-blue-300 font-mono text-[10px] shrink-0 px-1 py-0.2 rounded bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40">
                              {activeWin.process}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 truncate text-[11px]">
                              {activeWin.title || 'In foreground'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">No active window detected</span>
                        )}
                      </div>

                      {/* Running Apps Counter / Modal Trigger */}
                      {runningApps.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaffAppsModal(staff);
                          }}
                          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                          title="Click to view all running software on this PC"
                        >
                          <FiLayers size={10} className="text-blue-500 dark:text-blue-400" />
                          <span>{runningApps.length} Apps</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Video Viewport */}
                  <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                    {isAbruptOffline ? (
                      /* Dedicated, Clean Offline Workstation Screen (Zero Overlapping Text) */
                      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
                        <div className="absolute w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative mb-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm dark:shadow-xl dark:shadow-rose-950/50">
                            <FiAlertCircle size={24} className="animate-pulse" />
                          </div>
                        </div>

                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">Desktop App Terminated</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mb-3.5 leading-relaxed">
                          {staff.seconds_since_heartbeat
                            ? `Heartbeat lost (${staff.seconds_since_heartbeat}s without response)`
                            : 'App was closed or disconnected without checking out'}
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/50 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                            ⚠️ Force-Closed / Tamper
                          </span>
                          <button
                            onClick={() => fetchActiveStaff()}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title="Check workstation connection status"
                          >
                            <FiRefreshCw size={10} />
                            <span>Refresh</span>
                          </button>
                        </div>
                      </div>
                    ) : isLive ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        ref={(el) => {
                          if (el && stream && el.srcObject !== stream) {
                            el.srcObject = stream;
                            el.play().catch(() => {});
                          }
                        }}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => {
                          setInspectingStaff(staff);
                          setIsControlActive(false);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        {status === 'connecting' ? (
                          <>
                            <FiRefreshCw className="animate-spin text-blue-500 dark:text-blue-400 mb-2" size={28} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Connecting WebRTC P2P...</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Awaiting screen offer from staff PC</span>
                          </>
                        ) : (
                          <>
                            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 mb-2 shadow-2xs">
                              <FiMonitor size={24} />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Desktop Stream Standby</span>
                            <button
                              onClick={() => requestStreamFromStaff(staffId)}
                              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                            >
                              <FiPlay size={12} />
                              <span>Connect Live Feed</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Live Indicator overlay badge */}
                    {isLive && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-black text-emerald-400 shadow-sm pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE 30 FPS
                      </div>
                    )}

                    {/* Quick Action Overlay (on hover) */}
                    {isLive && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setInspectingStaff(staff);
                            setIsControlActive(false);
                            if (!streams[staff.user_id]) {
                              requestStreamFromStaff(staff.user_id);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                        >
                          <FiMaximize2 size={13} />
                          <span>Fullscreen Inspect</span>
                        </button>
                        <button
                          onClick={() => {
                            setInspectingStaff(staff);
                            setIsControlActive(true);
                            if (!streams[staff.user_id]) {
                              requestStreamFromStaff(staff.user_id);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                        >
                          <FiMousePointer size={13} />
                          <span>Take Control</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FiShield size={12} className={isAbruptOffline ? "text-rose-500 dark:text-rose-400" : "text-blue-600 dark:text-blue-400"} />
                      <span>{isAbruptOffline ? 'Workstation Offline' : 'Encrypted P2P Link'}</span>
                    </div>
                    {isLive ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setInspectingStaff(staff);
                            setIsControlActive(false);
                          }}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Fullscreen Inspect"
                        >
                          <FiMaximize2 size={11} />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => requestStreamFromStaff(staffId)}
                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                          title="Reconnect Stream"
                        >
                          <FiRefreshCw size={11} />
                          <span>Reconnect</span>
                        </button>
                      </div>
                    ) : isAbruptOffline ? (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400/90 font-medium">Tamper Warning</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setInspectingStaff(staff);
                            setIsControlActive(false);
                            requestStreamFromStaff(staffId);
                          }}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                          title="Open Fullscreen View & Connect"
                        >
                          <FiMaximize2 size={11} />
                          <span>Fullscreen</span>
                        </button>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Standby</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Interactive Remote Desktop / Fullscreen Modal ─────────────────── */}
      {inspectingStaff && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/90 dark:bg-slate-950 flex flex-col p-2 backdrop-blur-md"
          onKeyDown={handleRemoteKeyDown}
          tabIndex={0}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900/95 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl mb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                {inspectingStaff?.profile_picture ? (
                  <img
                    src={`${API_BASE}${inspectingStaff.profile_picture}`}
                    alt={inspectingStaff?.name || 'Staff'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950">
                    {inspectingStaff?.name ? inspectingStaff.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{inspectingStaff?.name || 'Staff Member'}</h3>
                  {inspectingStaff?.employee_code && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {inspectingStaff.employee_code}
                    </span>
                  )}
                  {inspectingStaff?.designation && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">• {inspectingStaff.designation}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {inspectingStaff?.check_in && (
                    <>
                      <span>Duty Start: {inspectingStaff.check_in}</span>
                      <span>•</span>
                      <span>Working Time: <b className="text-emerald-600 dark:text-emerald-400">{getElapsedDutyTime(inspectingStaff.check_in)}</b></span>
                      <span>•</span>
                    </>
                  )}
                  <span>Resolution: {remoteBounds?.width || 1920} x {remoteBounds?.height || 1080}</span>
                  {(() => {
                    const win = (inspectingStaff?.user_id ? staffActiveWindowMap[inspectingStaff.user_id] : null) || {
                      process: inspectingStaff?.active_process,
                      title: inspectingStaff?.active_window_title
                    };
                    if (!win?.process) return null;
                    return (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
                          Active: <b className="font-mono text-slate-800 dark:text-white">{win.process}</b>
                          {win.title && <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">({win.title})</span>}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Mode Controls */}
            <div className="flex items-center gap-2.5">
              {/* Running Apps Button */}
              {Array.isArray(inspectingStaff?.running_apps_list) && inspectingStaff.running_apps_list.length > 0 && (
                <button
                  onClick={() => setSelectedStaffAppsModal(inspectingStaff)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="View all running applications on this PC"
                >
                  <FiLayers size={13} className="text-blue-500 dark:text-blue-400" />
                  <span>{inspectingStaff.running_apps_list.length} Apps</span>
                </button>
              )}

              {/* Display Fit Mode Toggle (Fill Zero Gap vs Fit Aspect Ratio) */}
              <button
                onClick={() => setDisplayFitMode(prev => prev === 'fill' ? 'fit' : 'fill')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  displayFitMode === 'fill'
                    ? 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={displayFitMode === 'fill' ? "Mode: Fill Screen (Zero Side Gaps). Click for original Aspect Ratio." : "Mode: Aspect Ratio Preserved. Click for Edge-to-Edge Fill Screen."}
              >
                <FiMonitor size={13} className={displayFitMode === 'fill' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                <span>{displayFitMode === 'fill' ? 'Full Fill (Zero Gap)' : 'Fit Aspect'}</span>
              </button>

              {/* Native Monitor Fullscreen (F11) */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className={`p-2 rounded-xl transition-all border cursor-pointer ${
                  isNativeFullscreen 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
                }`}
                title={isNativeFullscreen ? "Exit Monitor Fullscreen" : "Enter Complete Monitor Fullscreen (Hides browser tabs & taskbar)"}
              >
                {isNativeFullscreen ? <FiMinimize2 size={15} /> : <FiMaximize2 size={15} />}
              </button>

              {/* Remote Control Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setIsControlActive(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!isControlActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <FiMonitor size={14} />
                  <span>View Only</span>
                </button>
                <button
                  onClick={() => setIsControlActive(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isControlActive
                      ? 'bg-amber-600 text-white shadow-xs animate-pulse'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <FiMousePointer size={14} />
                  <span>Remote Control</span>
                </button>
              </div>

              {isControlActive && (
                <span className="hidden xl:flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping"></span>
                  Control Active (Esc to Release)
                </span>
              )}

              <button
                onClick={() => {
                  setInspectingStaff(null);
                  setIsControlActive(false);
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 text-slate-500 dark:text-slate-400 hover:text-white transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Close Fullscreen View"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Screen Container */}
          <div
            className="flex-1 relative bg-black rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden flex items-center justify-center select-none"
            onContextMenu={(e) => handleRemoteMouseEvent(e, 'contextmenu')}
          >
            {inspectingStaff?.user_id && streams[inspectingStaff.user_id] ? (
              <video
                ref={(el) => {
                  modalVideoRef.current = el;
                  if (el && inspectingStaff?.user_id && streams[inspectingStaff.user_id]) {
                    if (el.srcObject !== streams[inspectingStaff.user_id]) {
                      el.srcObject = streams[inspectingStaff.user_id];
                      el.play().catch(() => {});
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                onMouseMove={(e) => handleRemoteMouseEvent(e, 'move')}
                onMouseDown={(e) => handleRemoteMouseEvent(e, 'down')}
                onMouseUp={(e) => handleRemoteMouseEvent(e, 'up')}
                onClick={(e) => handleRemoteMouseEvent(e, 'click')}
                onDoubleClick={(e) => handleRemoteMouseEvent(e, 'dblclick')}
                onWheel={handleRemoteWheel}
                className={`transition-all duration-150 ${
                  displayFitMode === 'fill'
                    ? 'w-full h-full object-fill'
                    : 'max-w-full max-h-full object-contain'
                } ${isControlActive ? 'cursor-crosshair' : 'cursor-default'}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <FiRefreshCw className="animate-spin text-blue-400 mb-3" size={36} />
                <p className="text-sm font-bold text-white">Connecting to live feed...</p>
                <button
                  onClick={() => inspectingStaff?.user_id && requestStreamFromStaff(inspectingStaff.user_id)}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Send Stream Request
                </button>
              </div>
            )}

            {isControlActive && (
              <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs text-amber-300 font-bold flex items-center gap-2 pointer-events-none shadow-xl">
                <FiMousePointer size={14} className="text-amber-400" />
                <span>Controlling {inspectingStaff?.name || 'Staff'}'s PC • Mouse & Typing Simulated</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Running Software / Open Applications Inspector Modal ────────────── */}
      {selectedStaffAppsModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
                  <FiLayers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Running Software & Active Windows
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-mono">
                      {selectedStaffAppsModal?.name || 'Staff'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspecting running applications and active window state on staff workstation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffAppsModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Highlight Current Active Foreground App */}
              {(() => {
                const curWin = (selectedStaffAppsModal?.user_id ? staffActiveWindowMap[selectedStaffAppsModal.user_id] : null) || {
                  process: selectedStaffAppsModal?.active_process,
                  title: selectedStaffAppsModal?.active_window_title
                };

                return (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
                        Currently In Foreground (Active Window)
                      </span>
                      {curWin?.process && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                          {curWin.process}.exe
                        </span>
                      )}
                    </div>
                    {curWin?.process ? (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{curWin.process}</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                          {curWin.title || 'Main Application Window'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">No active window currently focused.</p>
                    )}
                  </div>
                );
              })()}

              {/* All Open Application Windows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FiMonitor size={13} className="text-emerald-500 dark:text-emerald-400" />
                    Open Application Windows
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {Array.isArray(selectedStaffAppsModal?.running_apps_list) ? selectedStaffAppsModal.running_apps_list.length : 0} applications detected
                  </span>
                </div>

                {Array.isArray(selectedStaffAppsModal?.running_apps_list) && selectedStaffAppsModal.running_apps_list.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedStaffAppsModal.running_apps_list.map((app, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{app.process}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                              Task
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-sans">
                            {app.title || 'Window Active'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                          Running
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                    <FiLayers size={28} className="mx-auto mb-2 opacity-40" />
                    No additional open window data received from workstation.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs text-slate-500 dark:text-slate-400">
              <span>Auto-refreshed via workstation heartbeat every 20s</span>
              <button
                onClick={() => setSelectedStaffAppsModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScreenMonitor;

