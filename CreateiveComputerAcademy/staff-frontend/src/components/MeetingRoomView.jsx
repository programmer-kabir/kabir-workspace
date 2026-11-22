import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Peer from 'peerjs';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiTv, FiPhoneOff,
  FiUsers, FiUser, FiCopy, FiCheck, FiShield, FiRadio,
  FiAlertTriangle, FiLoader, FiMaximize, FiMinimize,
  FiMessageSquare, FiSend, FiX, FiCheckCircle, FiLock,
  FiUnlock, FiStar, FiUserCheck, FiUserPlus, FiUserX
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Clean profile picture URL helper
const getAvatarUrl = (pic) => {
  if (!pic) return null;
  if (pic.startsWith('http://') || pic.startsWith('https://')) return pic;
  const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const cleanPath = pic.startsWith('/') ? pic.slice(1) : pic;
  return `${base}${cleanPath}`;
};

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

export default function MeetingRoomView({ roomId, meetingTitle, creatorId, currentUser, onLeave }) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const activeCallsRef = useRef({}); // peerId -> call object
  const activeConnsRef = useRef({}); // peerId -> data connection
  const myPeerIdRef = useRef('');
  const chatScrollRef = useRef(null);

  const [myPeerId, setMyPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState({}); // peerId -> { stream, userId, userName, role, avatar, isScreen }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [copied, setCopied] = useState(false);

  // Host & Permission State
  const [hostsList, setHostsList] = useState([]); // array of user IDs
  const [meetingCreatorId, setMeetingCreatorId] = useState(creatorId ? Number(creatorId) : null);
  const [isChatLocked, setIsChatLocked] = useState(true); // default locked at start!
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);

  // Keep creatorId synced if passed as prop
  useEffect(() => {
    if (creatorId) {
      setMeetingCreatorId(Number(creatorId));
    }
  }, [creatorId]);

  // Live Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  // Remote Audio & Mic Management State
  const [remoteMuteStates, setRemoteMuteStates] = useState({}); // userId -> boolean (true if muted)
  const [unmutePrompt, setUnmutePrompt] = useState({ open: false, requestedBy: '' });

  // Determine exact host tier: 'host' (original creator), 'co_host' (promoted or developer/admin), or 'member'
  const getUserHostTier = useCallback((userId, role) => {
    if (!userId) return 'member';
    const numId = Number(userId);

    // 1. Primary meeting creator is always the main 'host'
    if (meetingCreatorId && numId === Number(meetingCreatorId)) {
      return 'host';
    }

    // 2. Appointed Co-Hosts or Developer/Admin joining
    if (hostsList.includes(numId)) {
      return 'co_host';
    }
    if (Number(currentUser?.id) === numId) {
      const isSuper = currentUser?.roles?.some(r => ['admin', 'developer', 'superadmin', 'dev'].includes(r.toLowerCase()));
      if (isSuper) return 'co_host';
    }
    if (role && ['admin', 'developer', 'superadmin', 'dev'].includes(role.toLowerCase())) {
      return 'co_host';
    }

    return 'member';
  }, [currentUser?.id, currentUser?.roles, meetingCreatorId, hostsList]);

  const myHostTier = getUserHostTier(currentUser?.id, currentUser?.roles?.[0]);
  const isMeHost = myHostTier === 'host' || myHostTier === 'co_host';
  const isMePrimaryHost = myHostTier === 'host';

  // Background attendance logger (stable ref, never causes re-renders)
  const logAttendance = useCallback(async (action, pId) => {
    if (!currentUser?.id || !roomId) return;
    try {
      const currentPid = pId || myPeerIdRef.current;
      const res = await axios.post(`${API_BASE}api/meetings/log_attendance.php`, {
        room_id: roomId,
        user_id: currentUser.id,
        action,
        peer_id: currentPid
      });
      return res.data;
    } catch (err) {
      console.warn(`Attendance sync (${action}) warning:`, err.message);
    }
  }, [currentUser?.id, roomId]);

  // Handle incoming remote stream
  const addRemoteStream = useCallback((remotePeerId, stream, peerInfo = {}) => {
    setRemotePeers(prev => ({
      ...prev,
      [remotePeerId]: {
        stream,
        userId: peerInfo.userId || peerInfo.user_id || null,
        userName: peerInfo.userName || peerInfo.user_name || (isBn ? 'সহকর্মী' : 'CCA Colleague'),
        role: peerInfo.role || 'Member',
        avatar: peerInfo.avatar || peerInfo.profile_picture || null,
        isScreen: Boolean(peerInfo.isScreen)
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
    if (activeConnsRef.current[remotePeerId]) {
      try { activeConnsRef.current[remotePeerId].close(); } catch (e) {}
      delete activeConnsRef.current[remotePeerId];
    }
  }, []);

  // Receive a chat message
  const handleIncomingMessage = useCallback((msgObj) => {
    setChatMessages(prev => {
      if (prev.some(m => m.id === msgObj.id || (m.created_at === msgObj.created_at && m.user_id === msgObj.user_id && m.message === msgObj.message))) {
        return prev;
      }
      return [...prev, msgObj];
    });

    setChatOpen(isOpen => {
      if (!isOpen) {
        setUnreadCount(c => c + 1);
        toast.info(`💬 ${msgObj.user_name}: ${msgObj.message.substring(0, 30)}...`);
      }
      return isOpen;
    });
  }, []);

  // Handle pin toggle from another peer
  const handlePinUpdate = useCallback((messageId, isPinned) => {
    setChatMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_pinned: isPinned } : m))
    );
  }, []);

  // Unified DataChannel dispatcher for in-meeting chat, pins, lock, hosts & mic commands
  const handleIncomingData = useCallback((data) => {
    if (!data) return;
    if (data.type === 'chat_message' && data.payload) {
      handleIncomingMessage(data.payload);
    } else if (data.type === 'pin_toggle' && data.payload) {
      handlePinUpdate(data.payload.messageId, data.payload.isPinned);
    } else if (data.type === 'chat_lock_toggle' && typeof data.payload?.isLocked === 'boolean') {
      setIsChatLocked(data.payload.isLocked);
      toast.info(data.payload.isLocked 
        ? (isBn ? '🔒 হোস্ট চ্যাট লক করেছেন।' : '🔒 Host has locked the chat.') 
        : (isBn ? '🔓 হোস্ট সবার জন্য চ্যাট উন্মুক্ত করেছেন!' : '🔓 Host has unlocked the chat for everyone!'));
    } else if (data.type === 'host_update' && Array.isArray(data.payload?.hosts)) {
      setHostsList(data.payload.hosts);
      if (Number(data.payload.targetUserId) === Number(currentUser?.id)) {
        toast.success(data.payload.isPromoted 
          ? (isBn ? '⭐ হোস্ট আপনাকে কো-হোস্ট (Co-Host) হিসেবে নিযুক্ত করেছেন!' : '⭐ You have been promoted to Co-Host by the host!') 
          : (isBn ? 'কো-হোস্ট স্ট্যাটাস প্রত্যাহার করা হয়েছে।' : 'You are no longer a Co-Host.'));
      }
    } else if (data.type === 'set_mic_state' && data.payload) {
      // Direct remote mic control from host/co-host
      if (Number(data.payload.targetUserId) === Number(currentUser?.id)) {
        const nextMuted = Boolean(data.payload.isMuted);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !nextMuted; });
        }
        setIsMuted(nextMuted);
        if (nextMuted) {
          toast.warning(isBn 
            ? `🔇 হোস্ট (${data.payload.toggledBy || 'Host'}) আপনার মাইক মিউট করেছেন।` 
            : `🔇 Host (${data.payload.toggledBy || 'Host'}) has muted your microphone.`);
        } else {
          toast.success(isBn 
            ? `🎙️ হোস্ট (${data.payload.toggledBy || 'Host'}) আপনার মাইক চালু করেছেন!` 
            : `🎙️ Host (${data.payload.toggledBy || 'Host'}) has unmuted your microphone!`);
        }

        // Broadcast to all other peers so their UI updates
        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: nextMuted }
              });
            }
          } catch (e) {}
        });
      }
    } else if (data.type === 'unmute_all') {
      // Unmute all triggered by host
      if (Number(data.payload?.senderId) !== Number(currentUser?.id)) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        }
        setIsMuted(false);
        toast.success(isBn 
          ? `🎙️ হোস্ট (${data.payload?.unmutedBy || 'Host'}) সবার মাইক চালু করেছেন!` 
          : `🎙️ Host (${data.payload?.unmutedBy || 'Host'}) has unmuted everyone!`);

        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: false }
              });
            }
          } catch (e) {}
        });
      }
    } else if (data.type === 'mute_all') {
      // Force mute if we are not the sender
      if (Number(data.payload?.senderId) !== Number(currentUser?.id)) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
        }
        setIsMuted(true);
        toast.warning(isBn 
          ? `🔇 হোস্ট (${data.payload?.mutedBy || 'Host'}) সবাইকে মিউট করেছেন।` 
          : `🔇 Host (${data.payload?.mutedBy || 'Host'}) has muted everyone.`);

        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: true }
              });
            }
          } catch (e) {}
        });
      }
    } else if (data.type === 'force_mute') {
      if (Number(data.payload?.targetUserId) === Number(currentUser?.id)) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
        }
        setIsMuted(true);
        toast.warning(isBn 
          ? `🔇 হোস্ট (${data.payload?.mutedBy || 'Host'}) আপনার মাইক্রোফোন মিউট করেছেন।` 
          : `🔇 Host (${data.payload?.mutedBy || 'Host'}) has muted your microphone.`);
      }
    } else if (data.type === 'unmute_request') {
      if (Number(data.payload?.targetUserId) === Number(currentUser?.id)) {
        setUnmutePrompt({
          open: true,
          requestedBy: data.payload?.requestedBy || (isBn ? 'হোস্ট' : 'Host')
        });
      }
    } else if (data.type === 'peer_mic_state' && data.payload?.userId) {
      setRemoteMuteStates(prev => ({
        ...prev,
        [data.payload.userId]: Boolean(data.payload.isMuted)
      }));
    }
  }, [currentUser?.id, isBn, handleIncomingMessage, handlePinUpdate]);

  // Fetch initial chat messages, hosts & lock state, poll periodically
  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/meetings/get_messages.php?room_id=${roomId}`);
        if (res.data?.status === 'success' && isMounted) {
          setChatMessages(res.data.messages || []);
          if (typeof res.data.is_chat_locked !== 'undefined') {
            setIsChatLocked(Number(res.data.is_chat_locked) === 1);
          }
          if (Array.isArray(res.data.hosts)) {
            setHostsList(res.data.hosts.map(Number));
          }
          if (res.data.created_by) {
            setMeetingCreatorId(Number(res.data.created_by));
          }
        }
      } catch (err) {
        // silent catch
      }
    };

    fetchMessages();
    const chatInterval = setInterval(fetchMessages, 5000);
    return () => {
      isMounted = false;
      clearInterval(chatInterval);
    };
  }, [roomId]);

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    if (chatOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages.length, chatOpen]);

  // 🌟 Main Conference Initialization (Runs ONCE per roomId/currentUser)
  useEffect(() => {
    let isMounted = true;
    let peer = null;
    let syncInterval = null;

    const startConference = async () => {
      try {
        setLoadingMedia(true);
        // 1. Acquire Local Camera & Microphone with timeout and graceful fallback
        let stream = null;
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const timeoutPromise = (ms) => new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Media access timeout')), ms)
            );

            try {
              stream = await Promise.race([
                navigator.mediaDevices.getUserMedia({
                  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                  audio: true
                }),
                timeoutPromise(4000)
              ]);
            } catch (mediaErr) {
              console.warn('Full camera/mic access failed or timed out, trying audio only:', mediaErr);
              setIsVideoOff(true);
              try {
                stream = await Promise.race([
                  navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
                  timeoutPromise(3000)
                ]);
              } catch (audioErr) {
                console.warn('Audio-only failed or timed out, falling back to view/listen stream:', audioErr);
                stream = createFallbackStream();
                setIsVideoOff(true);
                setIsMuted(true);
                toast.info(isBn ? 'লিসেন ও ভিউ মোডে যুক্ত হয়েছেন (ক্যামেরা/মাইক্রোফোন পাওয়া যায়নি)।' : 'Joined in Listen & View mode (no active microphone or camera found).');
              }
            }
          } else {
            stream = createFallbackStream();
            setIsVideoOff(true);
            setIsMuted(true);
          }
        } catch (setupErr) {
          console.warn('Device acquisition fallback:', setupErr);
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

        // Ready: clear loading screen immediately
        setLoadingMedia(false);

        // 2. Initialize PeerJS client with Google STUN servers
        const generatedPeerId = `cca_${roomId.replace(/[^a-zA-Z0-9]/g, '')}_u${currentUser?.id || 2}_${Math.floor(1000 + Math.random() * 9000)}`;
        myPeerIdRef.current = generatedPeerId;
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

        // Setup data channel listener for live in-meeting chat, pins, lock & host updates
        peer.on('connection', (conn) => {
          activeConnsRef.current[conn.peer] = conn;
          conn.on('data', handleIncomingData);
        });

        peer.on('open', async (id) => {
          if (!isMounted) return;
          // Log join & fetch current active peers
          const res = await logAttendance('join', id);
          if (res?.created_by) setMeetingCreatorId(Number(res.created_by));
          if (Array.isArray(res?.hosts)) setHostsList(res.hosts.map(Number));
          if (typeof res?.is_chat_locked !== 'undefined') setIsChatLocked(Boolean(res.is_chat_locked));
          const activePeers = res?.active_peers || [];

          // Connect to each existing peer in the room
          activePeers.forEach(p => {
            if (p.peer_id && p.peer_id !== id && !activeCallsRef.current[p.peer_id]) {
              try {
                const conn = peer.connect(p.peer_id);
                activeConnsRef.current[p.peer_id] = conn;
                conn.on('data', handleIncomingData);
              } catch (e) {}

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
          incomingCall.answer(localStreamRef.current || stream);
          const callerId = incomingCall.peer;
          activeCallsRef.current[callerId] = incomingCall;

          incomingCall.on('stream', (remoteStream) => {
            if (isMounted) {
              const meta = incomingCall.metadata || {};
              addRemoteStream(callerId, remoteStream, {
                userId: meta.userId || null,
                userName: meta.userName || (isBn ? 'সহকর্মী' : 'CCA Member'),
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
              try {
                const conn = peer.connect(p.peer_id);
                activeConnsRef.current[p.peer_id] = conn;
                conn.on('data', handleIncomingData);
              } catch (e) {}

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
  }, [roomId, currentUser?.id]); // STABLE: only runs once per roomId & currentUser

  // Toggle Microphone (with real-time state broadcast)
  const toggleAudio = (forceState) => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextEnabled = typeof forceState === 'boolean' ? forceState : !audioTrack.enabled;
      audioTrack.enabled = nextEnabled;
      const nextMuted = !nextEnabled;
      setIsMuted(nextMuted);

      // Broadcast mic state to all peers
      Object.values(activeConnsRef.current).forEach(conn => {
        try {
          if (conn.open) {
            conn.send({
              type: 'peer_mic_state',
              payload: { userId: currentUser?.id, isMuted: nextMuted }
            });
          }
        } catch (e) {}
      });
    }
  };

  // Host Action: Mute All participants
  const handleMuteAll = () => {
    if (!isMeHost) return;
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'mute_all',
            payload: {
              mutedBy: currentUser?.name || 'Host',
              senderId: currentUser?.id
            }
          });
        }
      } catch (e) {}
    });

    setRemoteMuteStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(uid => { updated[uid] = true; });
      return updated;
    });

    toast.warning(isBn ? '🔇 সবাইকে মিউট করা হয়েছে।' : '🔇 All participants have been muted.');
  };

  // Host Action: Unmute All participants
  const handleUnmuteAll = () => {
    if (!isMeHost) return;
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'unmute_all',
            payload: {
              unmutedBy: currentUser?.name || 'Host',
              senderId: currentUser?.id
            }
          });
        }
      } catch (e) {}
    });

    setRemoteMuteStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(uid => { updated[uid] = false; });
      return updated;
    });

    toast.success(isBn ? '🎙️ সবার মাইক চালু করা হয়েছে।' : '🎙️ All participants have been unmuted.');
  };

  // Host Action: Direct 1-Click Bidirectional Mic Toggle (Mute ⇄ Unmute anytime)
  const handleToggleParticipantMic = (targetUserId, targetName, currentMutedState) => {
    if (!isMeHost || !targetUserId) return;
    const nextMuted = !currentMutedState;

    // Optimistic UI state update
    setRemoteMuteStates(prev => ({ ...prev, [targetUserId]: nextMuted }));

    // Broadcast set_mic_state to target peer
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'set_mic_state',
            payload: {
              targetUserId,
              isMuted: nextMuted,
              toggledBy: currentUser?.name || 'Host'
            }
          });
          // Also broadcast peer mic state update to room
          conn.send({
            type: 'peer_mic_state',
            payload: { userId: targetUserId, isMuted: nextMuted }
          });
        }
      } catch (e) {}
    });

    if (nextMuted) {
      toast.warning(isBn ? `🔇 ${targetName}-কে মিউট করা হয়েছে।` : `🔇 Muted ${targetName}.`);
    } else {
      toast.success(isBn ? `🎙️ ${targetName}-এর মাইক চালু করা হয়েছে।` : `🎙️ Unmuted ${targetName}.`);
    }
  };

  // Host Action: Legacy single mute fallback
  const handleMuteParticipant = (targetUserId, targetName) => {
    handleToggleParticipantMic(targetUserId, targetName, false);
  };

  // Host Action: Legacy ask to speak fallback
  const handleAskToUnmute = (targetUserId, targetName) => {
    handleToggleParticipantMic(targetUserId, targetName, true);
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

  // Screen Share (Zoom Style)
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
        toast.success(isBn ? '🖥️ আপনি স্ক্রিন শেয়ার করছেন' : '🖥️ You are now sharing your screen');
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
    toast.info(isBn ? 'স্ক্রিন শেয়ার বন্ধ হয়েছে।' : 'Screen share stopped. Switched back to camera.');
  };

  // Send a live chat message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || !currentUser?.id || isSending) return;

    if (isChatLocked && !isMeHost) {
      toast.error(isBn ? 'চ্যাট বর্তমানে হোস্ট দ্বারা লক করা রয়েছে।' : 'Chat is currently locked by the host.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        room_id: roomId,
        user_id: currentUser.id,
        user_name: currentUser.name || (isBn ? 'স্টাফ মেম্বার' : 'Staff Member'),
        user_role: isMeHost ? 'Host' : (currentUser.roles?.[0] || 'Staff'),
        message: text
      };

      const res = await axios.post(`${API_BASE}api/meetings/send_message.php`, payload);
      if (res.data?.status === 'success' && res.data.message) {
        const newMsg = res.data.message;
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');

        // Broadcast to all connected peers via DataChannel
        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({ type: 'chat_message', payload: newMsg });
            }
          } catch (e) {}
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'মেসেজ পাঠানো সম্ভব হয়নি।' : 'Failed to send message.'));
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Chat Lock (Host only)
  const handleToggleChatLock = async () => {
    if (!isMeHost) {
      toast.error(isBn ? 'কেবল মিটিং হোস্ট চ্যাট লক বা আনলক করতে পারেন।' : 'Only meeting hosts can lock/unlock the chat.');
      return;
    }

    const nextLocked = !isChatLocked;
    setIsChatLocked(nextLocked);

    try {
      const res = await axios.post(`${API_BASE}api/meetings/toggle_chat_lock.php`, {
        room_id: roomId,
        user_id: currentUser?.id,
        is_locked: nextLocked ? 1 : 0
      });

      if (res.data?.status === 'success') {
        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({ type: 'chat_lock_toggle', payload: { isLocked: nextLocked } });
            }
          } catch (e) {}
        });
        toast.success(
          nextLocked 
            ? (isBn ? '🔒 চ্যাট এখন সাধারণ সদস্যদের জন্য লক করা হয়েছে।' : '🔒 Chat is now locked for participants.') 
            : (isBn ? '🔓 চ্যাট সবার জন্য উন্মুক্ত করা হয়েছে!' : '🔓 Chat is now unlocked for everyone!')
        );
      }
    } catch (err) {
      setIsChatLocked(!nextLocked);
      toast.error(isBn ? 'লক পরিবর্তন করা সম্ভব হয়নি।' : 'Failed to change chat lock state.');
    }
  };

  // Promote or Demote Co-Host (Host only)
  const handleToggleCoHost = async (targetUserId, targetName, isCurrentlyHost) => {
    if (!isMeHost) {
      toast.error(isBn ? 'কেবল মিটিং হোস্ট কো-হোস্ট নিযুক্ত করতে পারেন।' : 'Only meeting hosts can appoint co-hosts.');
      return;
    }

    const action = isCurrentlyHost ? 'demote' : 'promote';

    try {
      const res = await axios.post(`${API_BASE}api/meetings/manage_host.php`, {
        room_id: roomId,
        requester_id: currentUser?.id,
        target_user_id: targetUserId,
        action
      });

      if (res.data?.status === 'success') {
        const updatedHosts = (res.data.hosts || []).map(Number);
        setHostsList(updatedHosts);

        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'host_update',
                payload: {
                  hosts: updatedHosts,
                  targetUserId,
                  isPromoted: action === 'promote'
                }
              });
            }
          } catch (e) {}
        });

        toast.success(
          action === 'promote' 
            ? `⭐ ${targetName} ${isBn ? 'এখন কো-হোস্ট!' : 'is now a Co-Host!'}` 
            : `${targetName} ${isBn ? 'আর কো-হোস্ট নন।' : 'is no longer a Co-Host.'}`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'কো-হোস্ট স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।' : 'Failed to update host privileges.'));
    }
  };

  // Pin or Unpin a message (Host only)
  const togglePinMessage = async (msg) => {
    if (!isMeHost) {
      toast.error(isBn ? 'কেবল মিটিং হোস্ট মেসেজ পিন করতে পারেন।' : 'Only meeting hosts can pin messages.');
      return;
    }

    const nextPinned = Number(msg.is_pinned) === 1 ? 0 : 1;
    const action = nextPinned === 1 ? 'pin' : 'unpin';

    setChatMessages(prev =>
      prev.map(m => (m.id === msg.id ? { ...m, is_pinned: nextPinned } : m))
    );

    try {
      await axios.post(`${API_BASE}api/meetings/pin_message.php`, {
        room_id: roomId,
        message_id: msg.id,
        user_id: currentUser?.id,
        action
      });

      Object.values(activeConnsRef.current).forEach(conn => {
        try {
          if (conn.open) {
            conn.send({
              type: 'pin_toggle',
              payload: { messageId: msg.id, isPinned: nextPinned }
            });
          }
        } catch (e) {}
      });

      toast.success(
        nextPinned === 1
          ? (isBn ? '📌 মেসেজটি উপরে পিন করা হয়েছে' : '📌 Message pinned to top')
          : (isBn ? 'মেসেজটি আনপিন করা হয়েছে' : 'Message unpinned')
      );
    } catch (err) {
      toast.error(isBn ? 'পিন আপডেট করা সম্ভব হয়নি।' : 'Failed to update pin state.');
      setChatMessages(prev =>
        prev.map(m => (m.id === msg.id ? { ...m, is_pinned: msg.is_pinned } : m))
      );
    }
  };

  // Scroll to a specific pinned message in chat
  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2500);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success(isBn ? 'কনফারেন্স লিংক কপি হয়েছে!' : 'Conference room link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const remotePeerList = Object.entries(remotePeers);
  const totalInRoom = 1 + remotePeerList.length;
  const pinnedMessages = chatMessages.filter(m => Number(m.is_pinned) === 1);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] bg-[#0c101b] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      
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
          {myHostTier === 'host' ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              👑 {isBn ? 'হোস্ট নিয়ন্ত্রণ সক্রিয়' : 'HOST CONTROLS ACTIVE'}
            </span>
          ) : myHostTier === 'co_host' ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              ⭐ {isBn ? 'কো-হোস্ট নিয়ন্ত্রণ সক্রিয়' : 'CO-HOST CONTROLS ACTIVE'}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mute All & Unmute All Actions (Host / Co-Host Only) */}
          {isMeHost && totalInRoom > 1 && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-full p-0.5 shadow-sm">
              <button
                onClick={handleMuteAll}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold transition cursor-pointer"
                title={isBn ? 'মিটিংয়ের সবাইকে একসাথে মিউট করুন' : 'Mute all participants at once'}
              >
                <FiMicOff size={12} />
                <span>{isBn ? 'সবাই মিউট' : 'Mute All'}</span>
              </button>
              <button
                onClick={handleUnmuteAll}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
                title={isBn ? 'মিটিংয়ের সবার মাইক চালু করুন' : 'Unmute all participants'}
              >
                <FiMic size={12} />
                <span>{isBn ? 'সবাই আনমিউট' : 'Unmute All'}</span>
              </button>
            </div>
          )}

          {/* Participant Count Pill (Click to open list & promote co-hosts) */}
          <button
            onClick={() => setParticipantsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition cursor-pointer"
            title={isBn ? 'সদস্য তালিকা ও অডিও পরিচালনা করুন' : 'Click to view & manage participants'}
          >
            <FiUsers size={12} />
            <span>{totalInRoom} {isBn ? 'জন যুক্ত' : 'in room'}</span>
          </button>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
            <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'শেয়ার লিংক' : 'Share Link')}</span>
          </button>
        </div>
      </div>

      {/* 🌟 Main Body (Video Stage + Optional Chat Drawer) */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden">
        
        {/* 🌟 VIDEO CONFERENCE STAGE */}
        <div className="relative flex-1 h-full bg-[#070b14] p-3 md:p-5 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle loading spinner during initial 1-second connect only */}
          {loadingMedia && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#070b14]/90 backdrop-blur-sm text-white p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                <FiRadio className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-300">
                {isBn ? 'সিসিএ স্টুডিওতে যুক্ত হওয়া হচ্ছে...' : 'Connecting to CCA Video Studio...'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                {isBn ? 'ক্যামেরা ও মাইক্রোফোন লোড হতে দেরি হলে সরাসরি যুক্ত হন' : 'If camera takes time, you can join immediately'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!localStreamRef.current) {
                    const fallback = createFallbackStream();
                    localStreamRef.current = fallback;
                    setIsVideoOff(true);
                    setIsMuted(true);
                  }
                  setLoadingMedia(false);
                }}
                className="mt-1 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>🚀 {isBn ? 'সরাসরি প্রবেশ করুন (লিসেন অনলি)' : 'Skip & Join (Listen-Only)'}</span>
              </button>
            </div>
          )}

          {/* 🌟 SCREEN SHARING BANNER (When active) */}
          {isScreenSharing && (
            <div className="mb-3 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-white animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isBn ? 'আপনি বর্তমানে সবার সাথে আপনার স্ক্রিন শেয়ার করছেন' : 'You are currently sharing your screen with everyone'}</span>
              </div>
              <button
                onClick={revertToCamera}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer"
              >
                {isBn ? 'শেয়ার বন্ধ করুন' : 'Stop Presenting'}
              </button>
            </div>
          )}

          {/* 🌟 ZOOM-STYLE GALLERY GRID (When NOT sharing screen, or when presenting) */}
          <div className="relative flex-1 w-full h-[calc(100%-70px)] overflow-hidden flex items-center justify-center">
            
            {/* If Local User is Screen Sharing: Big Stage + Mini Filmstrip */}
            {isScreenSharing ? (
              <div className="w-full h-full flex flex-col md:flex-row gap-3">
                {/* Main Screen Stream Tile */}
                <div className="flex-1 h-full rounded-2xl md:rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl relative flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-slate-700">
                    <FiTv className="text-emerald-400" size={13} />
                    <span>{isBn ? 'আপনার শেয়ারকৃত স্ক্রিন' : 'Your Shared Screen'}</span>
                  </div>
                </div>

                {/* Filmstrip of Participants (Zoom Style) */}
                {remotePeerList.length > 0 && (
                  <div className="w-full md:w-60 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
                    {remotePeerList.map(([peerId, remote]) => {
                      const remoteTier = getUserHostTier(remote.userId, remote.role);
                      const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                      return (
                        <div key={peerId} className="w-48 md:w-full h-32 shrink-0">
                          <RemoteVideoTile
                            remotePeerId={peerId}
                            stream={remote.stream}
                            userId={remote.userId}
                            userName={remote.userName}
                            role={remote.role}
                            avatar={remote.avatar}
                            tier={remoteTier}
                            isMuted={isRemoteMuted}
                            canControlAudio={isMeHost}
                            onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                            canPromote={isMeHost}
                            onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                            compact
                            isBn={isBn}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Standard Gallery Grid (Zoom Style) */
              <div className={`w-full h-full grid gap-3 md:gap-4 p-1 ${
                totalInRoom === 1 ? 'grid-cols-1 max-w-4xl mx-auto' :
                totalInRoom === 2 ? 'grid-cols-1 md:grid-cols-2' :
                totalInRoom <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
              }`}>
                
                {/* 🌟 LOCAL USER ZOOM CARD */}
                <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 shadow-xl flex items-center justify-center group ${
                  !isMuted ? 'border-rose-500/40 ring-1 ring-rose-500/20' : 'border-slate-800'
                }`}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                  />

                  {/* Zoom-Style Video Off Avatar Card */}
                  {isVideoOff && (
                    <div className="flex flex-col items-center justify-center gap-3">
                      {currentUser?.profile_picture ? (
                        <img
                          src={getAvatarUrl(currentUser.profile_picture)}
                          alt={currentUser.name}
                          className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-rose-500/40 ring-4 ring-rose-500/20"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{currentUser?.name || (isBn ? 'আপনি' : 'You')}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {isBn ? 'ক্যামেরা বন্ধ রয়েছে' : 'Camera Off'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Local Badge Label (Zoom Style Bottom-Left) */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
                    <span>
                      {currentUser?.name || (isBn ? 'আপনি' : 'You')}{' '}
                      ({myHostTier === 'host' ? (isBn ? 'হোস্ট' : 'Host') : myHostTier === 'co_host' ? (isBn ? 'কো-হোস্ট' : 'Co-Host') : (isBn ? 'আপনি' : 'You')})
                    </span>
                    {myHostTier === 'host' ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
                        👑 {isBn ? 'হোস্ট' : 'Host'}
                      </span>
                    ) : myHostTier === 'co_host' ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1">
                        ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
                      </span>
                    ) : null}
                    {isMuted ? (
                      <FiMicOff className="text-rose-500" size={13} />
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
                        <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
                        <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>

                  {/* Waiting hint if alone in room */}
                  {totalInRoom === 1 && (
                    <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>{isBn ? 'অন্যান্য সদস্যের যোগদানের জন্য অপেক্ষা করা হচ্ছে...' : 'Waiting for team members to join...'}</span>
                    </div>
                  )}
                </div>

                {/* 🌟 REMOTE PARTICIPANT ZOOM CARDS */}
                {remotePeerList.map(([peerId, remote]) => {
                  const remoteTier = getUserHostTier(remote.userId, remote.role);
                  const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                  return (
                    <RemoteVideoTile
                      key={peerId}
                      remotePeerId={peerId}
                      stream={remote.stream}
                      userId={remote.userId}
                      userName={remote.userName}
                      role={remote.role}
                      avatar={remote.avatar}
                      tier={remoteTier}
                      isMuted={isRemoteMuted}
                      canControlAudio={isMeHost}
                      onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                      canPromote={isMeHost}
                      onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                      isBn={isBn}
                    />
                  );
                })}

              </div>
            )}

          </div>

          {/* 🌟 FLOATING ZOOM-STYLE CONTROL DOCK */}
          <div className="w-full flex items-center justify-center z-20 pt-2 shrink-0">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800 shadow-2xl">
              
              {/* Mic Toggle Button */}
              <button
                onClick={toggleAudio}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                <span className="text-[10px] font-bold">{isMuted ? (isBn ? 'আনমিউট' : 'Unmute') : (isBn ? 'মিউট' : 'Mute')}</span>
              </button>

              {/* Video Toggle Button */}
              <button
                onClick={toggleVideo}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  isVideoOff
                    ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
              >
                {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
                <span className="text-[10px] font-bold">{isVideoOff ? (isBn ? 'ভিডিও চালু' : 'Start Video') : (isBn ? 'ভিডিও বন্ধ' : 'Stop Video')}</span>
              </button>

              {/* Screen Share Button */}
              <button
                onClick={toggleScreenShare}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  isScreenSharing
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 ring-1 ring-emerald-500/40'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
              >
                <FiTv size={18} className={isScreenSharing ? 'text-emerald-400' : 'text-emerald-500'} />
                <span className="text-[10px] font-bold">{isScreenSharing ? (isBn ? 'শেয়ার বন্ধ' : 'Stop Share') : (isBn ? 'স্ক্রিন শেয়ার' : 'Share')}</span>
              </button>

              {/* In-Meeting Live Chat Button */}
              <button
                onClick={() => {
                  setChatOpen(!chatOpen);
                  if (!chatOpen) setUnreadCount(0);
                }}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  chatOpen
                    ? 'bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/40'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                title="Open Live Chat"
              >
                <div className="relative">
                  <FiMessageSquare size={18} />
                  {isChatLocked && (
                    <FiLock size={9} className="absolute -bottom-1 -right-1 text-amber-400" />
                  )}
                </div>
                <span className="text-[10px] font-bold">{isBn ? 'লাইভ চ্যাট' : 'Chat'}</span>
                {unreadCount > 0 && !chatOpen && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-bounce shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="h-7 w-px bg-slate-800 mx-1" />

              {/* Leave Room Button */}
              <button
                onClick={onLeave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
                title="Leave this meeting"
              >
                <FiPhoneOff size={15} />
                <span>{isBn ? 'বের হন' : 'Leave'}</span>
              </button>

            </div>
          </div>

        </div>

        {/* 🌟 IN-MEETING LIVE CHAT DRAWER */}
        {chatOpen && (
          <div className="w-80 md:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
            
            {/* Chat Header (With Host Lock/Unlock Controller) */}
            <div className="h-12 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 text-white shrink-0">
              <div className="flex items-center gap-2">
                <FiMessageSquare size={16} className="text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {isBn ? 'ইন-মিটিং লাইভ চ্যাট' : 'In-Meeting Chat'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                  {chatMessages.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 🌟 Host Lock/Unlock Toggle */}
                {isMeHost ? (
                  <button
                    onClick={handleToggleChatLock}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer border ${
                      isChatLocked
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                    title={isChatLocked ? 'Click to Unlock Chat for Everyone' : 'Click to Lock Chat for Host Only'}
                  >
                    {isChatLocked ? <FiLock size={11} /> : <FiUnlock size={11} />}
                    <span>{isChatLocked ? (isBn ? 'লকড' : 'Locked') : (isBn ? 'আনলকড' : 'Unlocked')}</span>
                  </button>
                ) : (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                    isChatLocked
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isChatLocked ? <FiLock size={10} /> : <FiUnlock size={10} />}
                    <span>{isChatLocked ? (isBn ? 'হোস্ট কেবল' : 'Host Only') : (isBn ? 'উন্মুক্ত' : 'Public')}</span>
                  </span>
                )}

                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close Chat"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* 🌟 PINNED MESSAGE STICKY BANNER */}
            {pinnedMessages.length > 0 && (
              <div className="mx-3 mt-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-2 text-white animate-in fade-in shrink-0">
                <div
                  onClick={() => scrollToMessage(pinnedMessages[0].id)}
                  className="flex-1 cursor-pointer flex items-start gap-2 overflow-hidden group"
                  title={isBn ? 'পিন করা মেসেজে যান' : 'Click to view pinned message'}
                >
                  <span className="text-base leading-none">📌</span>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                        {isBn ? 'পিন করা বার্তা' : 'Pinned Message'}
                      </span>
                      <span className="text-[10px] text-slate-400">• {pinnedMessages[0].user_name}</span>
                    </div>
                    <p className="text-xs text-slate-200 truncate mt-0.5 font-medium group-hover:text-amber-300 transition-colors">
                      {pinnedMessages[0].message}
                    </p>
                  </div>
                </div>

                {/* Only Host can unpin */}
                {isMeHost && (
                  <button
                    onClick={() => togglePinMessage(pinnedMessages[0])}
                    className="text-slate-400 hover:text-amber-400 p-1 rounded-md text-[10px] font-bold transition cursor-pointer"
                    title={isBn ? 'আনপিন করুন' : 'Unpin message'}
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Chat Message Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3.5 text-white text-xs scrollbar-thin scrollbar-thumb-slate-800"
            >
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                    <FiMessageSquare size={20} />
                  </div>
                  <p className="font-bold text-slate-300">{isBn ? 'এখনও কোনো মেসেজ নেই' : 'No messages yet'}</p>
                  <p className="text-[11px] text-slate-500">
                    {isChatLocked 
                      ? (isBn ? 'চ্যাট বর্তমানে হোস্ট দ্বারা লক করা রয়েছে। কেবল হোস্ট মেসেজ দিতে পারেন।' : 'Chat is currently locked by the host. Only hosts can post.')
                      : (isBn ? 'এখানে পাঠানো মেসেজ মিটিংয়ের সবাই দেখতে পাবেন।' : 'Messages sent here are visible to everyone in this meeting.')}
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = Number(msg.user_id) === Number(currentUser?.id);
                  const isPinned = Number(msg.is_pinned) === 1;
                  const avatarUrl = getAvatarUrl(msg.profile_picture);
                  const isHighlighted = highlightedMsgId === msg.id;

                  return (
                    <div
                      key={msg.id || i}
                      id={`chat-msg-${msg.id}`}
                      className={`group relative flex gap-2.5 transition-all p-1.5 rounded-2xl ${
                        isHighlighted
                          ? 'ring-2 ring-amber-400 bg-amber-500/20'
                          : isPinned
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'hover:bg-slate-800/40'
                      } ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* 🌟 Profile Picture / Initial Avatar */}
                      <div className="shrink-0 pt-0.5">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={msg.user_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700/80 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                            avatarUrl ? 'hidden' : ''
                          } ${
                            isMe
                              ? 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white'
                              : 'bg-gradient-to-tr from-indigo-600 to-slate-700 text-white'
                          }`}
                        >
                          {msg.user_name ? msg.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>

                      {/* Content Bubble */}
                      <div className={`flex flex-col gap-1 max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Name, Role, Time & Pin tag */}
                        <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="font-bold text-slate-200">{isMe ? (isBn ? 'আপনি' : 'You') : msg.user_name}</span>
                          {msg.user_role && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/60 text-[9px] text-slate-300 font-medium">
                              {msg.user_role}
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Now'}
                          </span>
                          {isPinned && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                              📌 {isBn ? 'পিন' : 'Pinned'}
                            </span>
                          )}
                        </div>

                        {/* Message Text Bubble */}
                        <div
                          className={`relative px-3.5 py-2.5 rounded-2xl text-xs break-words leading-relaxed shadow-md ${
                            isMe
                              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-tr-none'
                              : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>

                      {/* 🌟 Hover Pin/Unpin Action Button (ONLY FOR HOSTS) */}
                      {isMeHost && (
                        <button
                          onClick={() => togglePinMessage(msg)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer self-center shrink-0 ${
                            isPinned ? '!opacity-100 text-amber-400' : 'text-slate-400 hover:text-amber-400'
                          }`}
                          title={isPinned ? (isBn ? 'আনপিন করুন' : 'Unpin message') : (isBn ? 'উপরে পিন করুন' : 'Pin message to top')}
                        >
                          📌
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Message Input Footer (With Lock Awareness) */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2 shrink-0">
              {isChatLocked && !isMeHost ? (
                <div className="flex-1 py-2 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs">
                  <FiLock size={14} className="shrink-0" />
                  <span className="truncate">{isBn ? 'চ্যাট হোস্ট দ্বারা লক করা রয়েছে।' : 'Chat is locked by host. Only hosts can post.'}</span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      isChatLocked 
                        ? (isBn ? '[হোস্ট ব্রডকাস্ট] বার্তা লিখুন...' : '[Host Broadcast] Type a message...') 
                        : (isBn ? 'সবার উদ্দেশ্যে মেসেজ লিখুন...' : 'Type a message to everyone...')
                    }
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSending}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Send Message"
                  >
                    {isSending ? <FiLoader className="animate-spin" size={15} /> : <FiSend size={15} />}
                  </button>
                </>
              )}
            </form>

          </div>
        )}

      </div>

      {/* 🌟 PARTICIPANTS & CO-HOST MANAGEMENT MODAL */}
      {participantsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FiUsers className="text-emerald-400" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {isBn ? `রুমের সদস্যবৃন্দ (${totalInRoom})` : `Room Participants (${totalInRoom})`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isMeHost && totalInRoom > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleMuteAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                      title={isBn ? 'মিটিংয়ের সবাইকে একসাথে মিউট করুন' : 'Mute all participants at once'}
                    >
                      <FiMicOff size={12} />
                      <span>{isBn ? 'সবাই মিউট' : 'Mute All'}</span>
                    </button>
                    <button
                      onClick={handleUnmuteAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                      title={isBn ? 'মিটিংয়ের সবার মাইক চালু করুন' : 'Unmute all participants'}
                    >
                      <FiMic size={12} />
                      <span>{isBn ? 'সবাই আনমিউট' : 'Unmute All'}</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setParticipantsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Participant List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              
              {/* Local User Row */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  {currentUser?.profile_picture ? (
                    <img
                      src={getAvatarUrl(currentUser.profile_picture)}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-xs font-black">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{currentUser?.name || (isBn ? 'আপনি' : 'You')} ({isBn ? 'আপনি' : 'You'})</span>
                      {myHostTier === 'host' ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
                          👑 {isBn ? 'হোস্ট' : 'Host'}
                        </span>
                      ) : myHostTier === 'co_host' ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1">
                          ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-slate-400">{currentUser?.roles?.[0] || 'Member'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMuted ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 flex items-center gap-1">
                      <FiMicOff size={10} /> {isBn ? 'মিউট' : 'Muted'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                      <FiMic size={10} /> {isBn ? 'চালু' : 'Active'}
                    </span>
                  )}
                </div>
              </div>

              {/* Remote Participants Rows */}
              {remotePeerList.map(([peerId, remote]) => {
                const remoteTier = getUserHostTier(remote.userId, remote.role);
                const avatarUrl = getAvatarUrl(remote.avatar);
                const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);

                return (
                  <div key={peerId} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={remote.userName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-white">
                          {remote.userName ? remote.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{remote.userName}</span>
                          {remoteTier === 'host' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
                              👑 {isBn ? 'হোস্ট' : 'Host'}
                            </span>
                          ) : remoteTier === 'co_host' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1">
                              ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[10px] text-slate-400">{remote.role || 'Member'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Host Mic Control for this user - 1-Click Bidirectional Mute ⇄ Unmute */}
                      {isMeHost && remote.userId && (
                        <button
                          onClick={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer shadow-sm ${
                            isRemoteMuted
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40 hover:border-rose-400'
                          }`}
                          title={isRemoteMuted ? (isBn ? 'মাইক চালু করুন (আনমিউট)' : 'Unmute microphone') : (isBn ? 'মাইক বন্ধ করুন (মিউট)' : 'Mute microphone')}
                        >
                          {isRemoteMuted ? <FiMic size={11} className="text-emerald-400" /> : <FiMicOff size={11} className="text-rose-400" />}
                          <span>{isRemoteMuted ? (isBn ? 'আনমিউট' : 'Unmute') : (isBn ? 'মিউট' : 'Mute')}</span>
                        </button>
                      )}

                      {/* Host action button: Promote/Demote Co-Host (cannot demote primary meeting creator) */}
                      {isMeHost && remote.userId && remoteTier !== 'host' ? (
                        <button
                          onClick={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer border ${
                            remoteTier === 'co_host'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {remoteTier === 'co_host' ? <FiUserX size={11} /> : <FiUserPlus size={11} />}
                          <span>{remoteTier === 'co_host' ? (isBn ? 'বাদ' : 'Demote') : (isBn ? 'কো-হোস্ট' : 'Co-Host')}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setParticipantsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 UNMUTE REQUEST DIALOG POPUP (When Host asks user to speak) */}
      {unmutePrompt?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 text-white">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
              <FiMic size={24} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {isBn ? 'কথা বলার অনুরোধ' : 'Speaking Request'}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {isBn
                  ? `হোস্ট (${unmutePrompt.requestedBy}) আপনাকে মাইক্রোফোন চালু করে কথা বলতে অনুরোধ করেছেন।`
                  : `Host (${unmutePrompt.requestedBy}) would like you to unmute your microphone to speak.`}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setUnmutePrompt({ open: false, requestedBy: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                {isBn ? 'মিউট থাকুন' : 'Stay Muted'}
              </button>
              <button
                onClick={() => {
                  toggleAudio(true);
                  setUnmutePrompt({ open: false, requestedBy: '' });
                  toast.success(isBn ? '🎙️ আপনার মাইক্রোফোন চালু হয়েছে।' : '🎙️ Microphone is now active.');
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <FiMic size={14} />
                <span>{isBn ? 'আনমিউট করুন' : 'Unmute Mic'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🌟 ZOOM-STYLE REMOTE VIDEO TILE (With Host Crown & Quick Co-Host Button)
function RemoteVideoTile({
  remotePeerId, stream, userId, userName, role, avatar,
  compact = false, tier = 'member', isMuted = false,
  canControlAudio = false, onToggleMic,
  canPromote = false, onToggleCoHost, isBn = false
}) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);
  const avatarUrl = getAvatarUrl(avatar);

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

  const isHost = tier === 'host';
  const isCoHost = tier === 'co_host';

  return (
    <div className={`group relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 shadow-xl flex items-center justify-center w-full h-full ${
      isHost ? 'border-amber-400/60 ring-1 ring-amber-400/20' : isCoHost ? 'border-amber-500/40' : 'border-slate-800'
    } ${compact ? 'rounded-xl' : ''}`}>
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
      />

      {/* Zoom-Style Video Off Avatar Card */}
      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className={`w-16 h-16 rounded-full object-cover border shadow-md ring-2 ${
                isHost ? 'border-amber-400 ring-amber-400/40' : isCoHost ? 'border-amber-500/60 ring-amber-500/20' : 'border-slate-700 ring-slate-700/50'
              }`}
            />
          ) : (
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-xl font-black text-white shadow-inner ${
              isHost ? 'bg-amber-600/30 border-amber-400 text-amber-200' : isCoHost ? 'bg-amber-600/20 border-amber-500/60 text-amber-300' : 'bg-slate-800 border-slate-700 text-white'
            }`}>
              {userName ? userName.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          {!compact && (
            <div className="text-center">
              <p className="text-xs font-bold text-white">{userName}</p>
              <p className="text-[10px] text-slate-400">
                {isBn ? 'ক্যামেরা বন্ধ' : 'Camera Off'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Remote Audio Control for Host (Top-Left) */}
      {canControlAudio && userId && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <button
            onClick={onToggleMic}
            className={`px-2.5 py-1 rounded-xl backdrop-blur-md text-[10px] font-bold cursor-pointer shadow-lg flex items-center gap-1 transition-all ${
              isMuted
                ? 'bg-slate-950/85 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                : 'bg-slate-950/85 hover:bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:border-rose-400 ring-1 ring-rose-500/20'
            }`}
            title={isMuted ? (isBn ? 'মাইক চালু করুন (আনমিউট)' : 'Unmute microphone') : (isBn ? 'মাইক বন্ধ করুন (মিউট)' : 'Mute microphone')}
          >
            {isMuted ? <FiMic size={11} className="text-emerald-400" /> : <FiMicOff size={11} className="text-rose-400" />}
            <span>{isMuted ? (isBn ? 'আনমিউট' : 'Unmute') : (isBn ? 'মিউট' : 'Mute')}</span>
          </button>
        </div>
      )}

      {/* Zoom-Style Remote User Pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-[11px] font-bold z-10">
        <span>{userName}</span>
        {isHost ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
            👑 {isBn ? 'হোস্ট' : 'Host'}
          </span>
        ) : isCoHost ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
            ⭐ {isBn ? 'কো-হোস্ট' : 'Co-Host'}
          </span>
        ) : role ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
            {role}
          </span>
        ) : null}
        {canControlAudio ? (
          <button
            onClick={onToggleMic}
            className="cursor-pointer hover:scale-115 transition-transform p-0.5 rounded"
            title={isMuted ? (isBn ? 'আনমিউট করতে ক্লিক করুন' : 'Click to Unmute') : (isBn ? 'মিউট করতে ক্লিক করুন' : 'Click to Mute')}
          >
            {isMuted ? (
              <FiMicOff className="text-rose-500" size={13} />
            ) : (
              <span className="flex items-center gap-0.5">
                <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
                <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
                <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
              </span>
            )}
          </button>
        ) : (
          isMuted ? (
            <FiMicOff className="text-rose-500" size={12} title={isBn ? 'মাইক বন্ধ' : 'Muted'} />
          ) : (
            <span className="flex items-center gap-0.5" title={isBn ? 'মাইক চালু' : 'Unmuted'}>
              <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
              <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
            </span>
          )
        )}
      </div>

      {/* Quick Host Action on Hover (Top-Right) - Cannot demote primary creator */}
      {canPromote && userId && !compact && tier !== 'host' && (
        <button
          onClick={onToggleCoHost}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-bold text-amber-300 hover:bg-slate-800 cursor-pointer shadow-lg flex items-center gap-1 z-20"
          title={isCoHost ? 'Remove Co-Host status' : 'Promote to Co-Host'}
        >
          <FiStar size={11} className={isCoHost ? 'fill-amber-400' : ''} />
          <span>{isCoHost ? (isBn ? 'পদবী কাটুন' : 'Remove Co-Host') : (isBn ? 'কো-হোস্ট বানান' : 'Make Co-Host')}</span>
        </button>
      )}

    </div>
  );
}
