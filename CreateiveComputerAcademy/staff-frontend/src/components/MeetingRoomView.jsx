import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Peer from 'peerjs';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiTv, FiPhoneOff,
  FiUsers, FiUser, FiCopy, FiCheck, FiShield, FiRadio,
  FiAlertTriangle, FiLoader, FiMaximize, FiMinimize
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Fallback silent & blank MediaStream for environments without camera/mic hardware
function createFallbackStream() {
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

export default function MeetingRoomView({ roomId, meetingTitle, currentUser, onLeave }) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const activeCallsRef = useRef({}); // peerId -> call object

  const [myPeerId, setMyPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState({}); // peerId -> { stream, userName, role, avatar }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Background attendance logger
  const logAttendance = useCallback(async (action, pId) => {
    if (!currentUser?.id || !roomId) return;
    try {
      const res = await axios.post(`${API_BASE}api/meetings/log_attendance.php`, {
        room_id: roomId,
        user_id: currentUser.id,
        action,
        peer_id: pId || myPeerId
      });
      return res.data;
    } catch (err) {
      console.warn(`Attendance sync (${action}) warning:`, err.message);
    }
  }, [currentUser?.id, roomId, myPeerId]);

  // Handle incoming remote stream
  const addRemoteStream = useCallback((remotePeerId, stream, peerInfo = {}) => {
    setRemotePeers(prev => ({
      ...prev,
      [remotePeerId]: {
        stream,
        userName: peerInfo.userName || peerInfo.user_name || (isBn ? 'সহকর্মী' : 'CCA Colleague'),
        role: peerInfo.role || 'Member',
        avatar: peerInfo.avatar || peerInfo.profile_picture || null
      }
    }));
  }, [isBn]);

  // Remove remote stream
  const removeRemoteStream = useCallback((remotePeerId) => {
    setRemotePeers(prev => {
      const copy = { ...prev };
      delete copy[remotePeerId];
      return copy;
    });
    if (activeCallsRef.current[remotePeerId]) {
      try { activeCallsRef.current[remotePeerId].close(); } catch (e) {}
      delete activeCallsRef.current[remotePeerId];
    }
  }, []);

  // Initialize Local Media & PeerJS
  useEffect(() => {
    let isMounted = true;
    let peer = null;
    let syncInterval = null;

    const startConference = async () => {
      try {
        setLoadingMedia(true);
        // 1. Acquire Local Camera & Microphone with graceful fallback
        let stream = null;
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
              });
            } catch (mediaErr) {
              console.warn('Full camera/mic access failed, trying audio only:', mediaErr);
              try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                setIsVideoOff(true);
              } catch (audioErr) {
                console.warn('Audio-only failed, falling back to view/listen stream:', audioErr);
                stream = createFallbackStream();
                setIsVideoOff(true);
                setIsMuted(true);
              }
            }
          } else {
            stream = createFallbackStream();
            setIsVideoOff(true);
            setIsMuted(true);
          }
        } catch (setupErr) {
          console.warn('Media setup fallback:', setupErr);
          stream = createFallbackStream();
          setIsVideoOff(true);
          setIsMuted(true);
        }

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setLoadingMedia(false);

        // 2. Initialize PeerJS client with Google STUN servers
        const generatedPeerId = `cca_${roomId.replace(/[^a-zA-Z0-9]/g, '')}_u${currentUser?.id || 2}_${Math.floor(1000 + Math.random() * 9000)}`;
        setMyPeerId(generatedPeerId);

        peer = new Peer(generatedPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ]
          }
        });
        peerInstanceRef.current = peer;

        peer.on('error', (pErr) => {
          console.warn('Peer connection notice:', pErr.type || pErr.message);
        });

        peer.on('disconnected', () => {
          if (peer && !peer.destroyed) {
            try { peer.reconnect(); } catch (e) {}
          }
        });

        peer.on('open', async (id) => {
          if (!isMounted) return;
          // Log join & fetch current active peers
          const res = await logAttendance('join', id);
          const activePeers = res?.active_peers || [];

          // Connect to each existing peer in the room
          activePeers.forEach(p => {
            if (p.peer_id && p.peer_id !== id && !activeCallsRef.current[p.peer_id]) {
              const call = peer.call(p.peer_id, stream, {
                metadata: {
                  userId: currentUser?.id,
                  userName: currentUser?.name || 'Staff Member',
                  role: currentUser?.roles?.[0] || 'Staff',
                  avatar: currentUser?.profile_picture || null
                }
              });

              if (call) {
                activeCallsRef.current[p.peer_id] = call;
                call.on('stream', (remoteStream) => {
                  if (isMounted) addRemoteStream(p.peer_id, remoteStream, p);
                });
                call.on('close', () => {
                  if (isMounted) removeRemoteStream(p.peer_id);
                });
                call.on('error', () => {
                  if (isMounted) removeRemoteStream(p.peer_id);
                });
              }
            }
          });
        });

        // Answer incoming calls from new participants
        peer.on('call', (incomingCall) => {
          incomingCall.answer(stream);
          const callerId = incomingCall.peer;
          activeCallsRef.current[callerId] = incomingCall;

          incomingCall.on('stream', (remoteStream) => {
            if (isMounted) {
              const meta = incomingCall.metadata || {};
              addRemoteStream(callerId, remoteStream, {
                userName: meta.userName || 'CCA Member',
                role: meta.role || 'Participant',
                avatar: meta.avatar || null
              });
            }
          });

          incomingCall.on('close', () => {
            if (isMounted) removeRemoteStream(callerId);
          });
          incomingCall.on('error', () => {
            if (isMounted) removeRemoteStream(callerId);
          });
        });

        // 3. Keep-alive heartbeat & peer discovery loop (every 7 seconds)
        syncInterval = setInterval(async () => {
          if (!isMounted || !peer || peer.destroyed) return;
          const res = await logAttendance('ping', peer.id);
          const peers = res?.active_peers || [];

          // Connect to any new peers who just entered
          peers.forEach(p => {
            if (p.peer_id && p.peer_id !== peer.id && !activeCallsRef.current[p.peer_id]) {
              const call = peer.call(p.peer_id, localStreamRef.current, {
                metadata: {
                  userId: currentUser?.id,
                  userName: currentUser?.name || 'Staff Member',
                  role: currentUser?.roles?.[0] || 'Staff',
                  avatar: currentUser?.profile_picture || null
                }
              });

              if (call) {
                activeCallsRef.current[p.peer_id] = call;
                call.on('stream', (remoteStream) => {
                  if (isMounted) addRemoteStream(p.peer_id, remoteStream, p);
                });
                call.on('close', () => {
                  if (isMounted) removeRemoteStream(p.peer_id);
                });
              }
            }
          });
        }, 7000);

      } catch (err) {
        if (!isMounted) return;
        console.error('Conference Init Error:', err);
        setPermissionError(err.message || 'Media devices error');
        setLoadingMedia(false);
      }
    };

    startConference();

    return () => {
      isMounted = false;
      if (syncInterval) clearInterval(syncInterval);
      logAttendance('leave');

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // Close all peer calls
      Object.values(activeCallsRef.current).forEach(c => {
        try { c.close(); } catch (e) {}
      });
      // Destroy PeerJS instance
      if (peerInstanceRef.current) {
        try { peerInstanceRef.current.destroy(); } catch (e) {}
      }
    };
  }, [roomId, currentUser?.id, addRemoteStream, removeRemoteStream, logAttendance, isBn]);

  // Toggle Microphone
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  // Screen Share
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track in all active peer connections
        Object.values(activeCallsRef.current).forEach(call => {
          const sender = call.peerConnection?.getSenders()?.find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          revertToCamera();
        };

        setIsScreenSharing(true);
      } else {
        revertToCamera();
      }
    } catch (err) {
      console.warn('Screen share canceled or failed:', err);
    }
  };

  const revertToCamera = () => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      Object.values(activeCallsRef.current).forEach(call => {
        const sender = call.peerConnection?.getSenders()?.find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success(isBn ? 'কনফারেন্স লিংক কপি হয়েছে!' : 'Conference room link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const remotePeerList = Object.entries(remotePeers);
  const totalInRoom = 1 + remotePeerList.length;

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      
      {/* 🌟 Top Navigation Bar */}
      <div className="h-12 px-5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase text-rose-500 tracking-wider">
              {isBn ? 'সিসিএ স্টুডিও' : 'CCA STUDIO'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-xs md:max-w-md">
            {meetingTitle || (isBn ? 'লাইভ কনফারেন্স রুম' : 'Creative Computer Academy Live Conference')}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <FiUsers size={12} />
            <span>{totalInRoom} {isBn ? 'জন যুক্ত' : 'in room'}</span>
          </div>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
            <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'শেয়ার লিংক' : 'Share Link')}</span>
          </button>
        </div>
      </div>

      {/* 🌟 Main Video Conference Stage */}
      <div className="relative flex-1 w-full h-full bg-[#070b14] p-3 md:p-5 overflow-hidden flex flex-col justify-between">
        
        {/* Loading Media Screen */}
        {loadingMedia && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#070b14] text-white">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <FiRadio className="w-7 h-7 animate-pulse" />
              </div>
              <span className="absolute -inset-2 rounded-3xl border border-rose-500/20 animate-ping opacity-40"></span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-white">
                {isBn ? 'সিসিএ ইন-হাউস ভিডিও স্টুডিও চালু হচ্ছে...' : 'Starting CCA Native Video Studio...'}
              </p>
              <p className="text-xs text-slate-400">
                {isBn ? 'ক্যামেরা ও মাইক্রোফোন সংযোগ নেওয়া হচ্ছে' : 'Requesting camera & microphone access'}
              </p>
            </div>
          </div>
        )}

        {/* Permission Denied Error Screen */}
        {permissionError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#070b14] text-white p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-rose-400 max-w-md">{permissionError}</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {isBn 
                ? 'ব্রাউজারের অ্যাড্রেস বারের ক্যামেরা/মাইক আইকনে ক্লিক করে "Allow" দিন, তারপর আবার চেষ্টা করুন।'
                : 'Please click the camera/mic icon in your browser address bar and choose "Allow", then retry.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              {isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry Camera Access'}
            </button>
          </div>
        )}

        {/* 🌟 Dynamic Responsive Video Grid */}
        <div className={`w-full h-[calc(100%-80px)] grid gap-3 md:gap-4 ${
          totalInRoom === 1 ? 'grid-cols-1' :
          totalInRoom === 2 ? 'grid-cols-1 md:grid-cols-2' :
          totalInRoom <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
        }`}>
          
          {/* LOCAL USER TILE */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
            />

            {/* Video Off Placeholder */}
            {isVideoOff && (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl font-black shadow-inner">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {isBn ? 'ক্যামেরা বন্ধ রয়েছে' : 'Camera Turned Off'}
                </span>
              </div>
            )}

            {/* Local Badge Label */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
              <span>{currentUser?.name || 'You'} ({isBn ? 'আপনি' : 'You'})</span>
              {isMuted ? (
                <FiMicOff className="text-rose-500" size={13} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            {/* Waiting for other members hint if alone */}
            {totalInRoom === 1 && (
              <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{isBn ? 'অন্যান্য সদস্যের যোগদানের জন্য অপেক্ষা করা হচ্ছে...' : 'Waiting for other team members to join...'}</span>
              </div>
            )}
          </div>

          {/* REMOTE USERS TILES */}
          {remotePeerList.map(([peerId, remote]) => (
            <RemoteVideoTile
              key={peerId}
              remotePeerId={peerId}
              stream={remote.stream}
              userName={remote.userName}
              role={remote.role}
              avatar={remote.avatar}
            />
          ))}

        </div>

        {/* 🌟 Floating Glass Controls Bar */}
        <div className="w-full flex items-center justify-center z-20 pt-2">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
            
            {/* Mic Button */}
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isMuted ? (isBn ? 'মাইক্রোফোন চালু করুন' : 'Unmute Microphone') : (isBn ? 'মাইক্রোফোন মিউট করুন' : 'Mute Microphone')}
            >
              {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
            </button>

            {/* Video Button */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                isVideoOff
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isVideoOff ? (isBn ? 'ক্যামেরা চালু করুন' : 'Start Camera') : (isBn ? 'ক্যামেরা বন্ধ করুন' : 'Stop Camera')}
            >
              {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
            </button>

            {/* Screen Share Button */}
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center ${
                isScreenSharing
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isScreenSharing ? (isBn ? 'স্ক্রিন শেয়ার বন্ধ করুন' : 'Stop Screen Sharing') : (isBn ? 'স্ক্রিন শেয়ার করুন' : 'Share Screen')}
            >
              <FiTv size={18} />
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            {/* Leave Room Button */}
            <button
              onClick={onLeave}
              className="flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
              title={isBn ? 'রুম ত্যাগ করুন' : 'Leave this meeting'}
            >
              <FiPhoneOff size={16} />
              <span>{isBn ? 'ত্যাগ করুন' : 'Leave Studio'}</span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}

// Subcomponent for each remote peer video
function RemoteVideoTile({ remotePeerId, stream, userName, role, avatar }) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setHasVideo(videoTrack.enabled);
        videoTrack.onmute = () => setHasVideo(false);
        videoTrack.onunmute = () => setHasVideo(true);
      } else {
        setHasVideo(false);
      }
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
      />

      {/* Placeholder when peer's camera is off */}
      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white shadow-inner">
            {userName ? userName.charAt(0).toUpperCase() : 'C'}
          </div>
          <span className="text-xs font-bold text-slate-400">{userName} (Camera Off)</span>
        </div>
      )}

      {/* Remote User Label */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
        <span>{userName}</span>
        {role && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
            {role}
          </span>
        )}
      </div>
    </div>
  );
}
