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

// 🌟 Available Live Floating Reactions
const AVAILABLE_REACTIONS = [
  { emoji: '❤️', labelBn: 'ভালোবাসা', labelEn: 'Heart' },
  { emoji: '👍', labelBn: 'থাম্বস আপ', labelEn: 'Thumbs Up' },
  { emoji: '👏', labelBn: 'হাততালি', labelEn: 'Clap' },
  { emoji: '🎉', labelBn: 'উদযাপন', labelEn: 'Celebrate' },
  { emoji: '😂', labelBn: 'হাসি', labelEn: 'Laugh' },
  { emoji: '🔥', labelBn: 'অসাধারণ / আগুন', labelEn: 'Fire' },
  { emoji: '😮', labelBn: 'বিস্ময়', labelEn: 'Wow' },
  { emoji: '💯', labelBn: '১০০%', labelEn: '100' },
];

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
  const localVideoRef = useRef(null);
  const localFilmstripVideoRef = useRef(null);
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

  // ✋ Raise Hand State
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({}); // userId -> { userName, raisedAt }

  // 😊 Live Floating Reactions State
  const [floatingReactions, setFloatingReactions] = useState([]); // [{ id, emoji, senderName, leftPercent, duration }]
  const [tileReactions, setTileReactions] = useState({}); // userId -> { emoji, expiresAt }
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  // 🌟 Spotlight & Pin Speaker State
  const [spotlightUser, setSpotlightUser] = useState(null); // { peerId, userId, userName, spotlightedBy }
  const [pinnedUser, setPinnedUser] = useState(null); // { peerId, userId, userName }

  // Fanfare / chord chime when host spotlights a speaker
  const playSpotlightChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, []);

  // Subtle tactile pop sound when a reaction is triggered
  const playReactionSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }, []);

  // Trigger floating reaction animation & tile badge
  const triggerFloatingReaction = useCallback((reactionData) => {
    const reactionId = reactionData.id || `${Date.now()}-${Math.random()}`;
    const reactionObj = {
      ...reactionData,
      id: reactionId,
      leftPercent: reactionData.leftPercent ?? (15 + Math.random() * 70),
      duration: reactionData.duration ?? 3200
    };

    setFloatingReactions(prev => [...prev.slice(-15), reactionObj]);

    if (reactionData.senderId) {
      setTileReactions(prev => ({
        ...prev,
        [Number(reactionData.senderId)]: {
          emoji: reactionData.emoji,
          expiresAt: Date.now() + 3500
        }
      }));
    }

    playReactionSound();

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
    }, reactionObj.duration + 200);
  }, [playReactionSound]);

  // Pleasant audio chime when a participant raises their hand (Host notification)
  const playHandRaiseChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }, []);

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
        userName: peerInfo.userName || peerInfo.user_name || 'CCA Colleague',
        role: peerInfo.role || 'Member',
        avatar: peerInfo.avatar || peerInfo.profile_picture || null,
        isScreen: Boolean(peerInfo.isScreen)
      }
    }));
  }, []);

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
      toast.info(data.payload.isLocked ? '🔒 Host has locked the chat.' : '🔓 Host has unlocked the chat for everyone!');
    } else if (data.type === 'host_update' && Array.isArray(data.payload?.hosts)) {
      setHostsList(data.payload.hosts);
      if (Number(data.payload.targetUserId) === Number(currentUser?.id)) {
        toast.success(data.payload.isPromoted ? '⭐ You have been promoted to Co-Host by the host!' : 'You are no longer a Co-Host.');
      }
    } else if (data.type === 'set_mic_state' && data.payload) {
      if (Number(data.payload.targetUserId) === Number(currentUser?.id)) {
        const nextMuted = Boolean(data.payload.isMuted);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !nextMuted; });
        }
        setIsMuted(nextMuted);
        if (nextMuted) {
          toast.warning(`🔇 Host (${data.payload.toggledBy || 'Host'}) has muted your microphone.`);
        } else {
          toast.success(`🎙️ Host (${data.payload.toggledBy || 'Host'}) has unmuted your microphone!`);
        }

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
      if (Number(data.payload?.senderId) !== Number(currentUser?.id)) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        }
        setIsMuted(false);
        toast.success(`🎙️ Host (${data.payload?.unmutedBy || 'Host'}) has unmuted everyone!`);

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
      if (Number(data.payload?.senderId) !== Number(currentUser?.id)) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
        }
        setIsMuted(true);
        toast.warning(`🔇 Host (${data.payload?.mutedBy || 'Host'}) has muted everyone.`);

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
        toast.warning(`🔇 Host (${data.payload?.mutedBy || 'Host'}) has muted your microphone.`);
      }
    } else if (data.type === 'unmute_request') {
      if (Number(data.payload?.targetUserId) === Number(currentUser?.id)) {
        setUnmutePrompt({
          open: true,
          requestedBy: data.payload?.requestedBy || 'Host'
        });
      }
    } else if (data.type === 'peer_mic_state' && data.payload?.userId) {
      setRemoteMuteStates(prev => ({
        ...prev,
        [data.payload.userId]: Boolean(data.payload.isMuted)
      }));
    } else if (data.type === 'raise_hand' && data.payload) {
      const { userId, userName, isRaised, raisedAt, loweredBy } = data.payload;
      const numUserId = Number(userId);

      setRaisedHands(prev => {
        const updated = { ...prev };
        if (isRaised) {
          updated[numUserId] = {
            userName: userName || 'Participant',
            raisedAt: raisedAt || Date.now()
          };
        } else {
          delete updated[numUserId];
        }
        return updated;
      });

      if (numUserId === Number(currentUser?.id)) {
        setIsHandRaised(Boolean(isRaised));
        if (!isRaised && loweredBy) {
          toast.info(`Host (${loweredBy}) lowered your hand.`);
        }
      }

      if (isRaised && numUserId !== Number(currentUser?.id) && isMeHost) {
        playHandRaiseChime();
        toast.info(`✋ ${userName || 'Participant'} raised hand to speak!`);
      }
    } else if (data.type === 'floating_reaction' && data.payload?.emoji) {
      triggerFloatingReaction(data.payload);
    } else if (data.type === 'spotlight_toggle' && data.payload) {
      const { targetPeerId, targetUserId, targetName, isSpotlighted, spotlightedBy } = data.payload;
      if (isSpotlighted) {
        setSpotlightUser({
          peerId: targetPeerId,
          userId: targetUserId,
          userName: targetName,
          spotlightedBy
        });
        playSpotlightChime();
        toast.info(`🌟 Host (${spotlightedBy}) spotlighted ${targetName} for everyone.`);
      } else {
        setSpotlightUser(null);
        toast.info(`🌟 Spotlight removed.`);
      }
    }
  }, [currentUser?.id, currentUser?.name, isMeHost, playHandRaiseChime, playSpotlightChime, triggerFloatingReaction, handleIncomingMessage, handlePinUpdate]);

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
        // silent fail on network glitch
      }
    };

    fetchMessages();
    const chatInterval = setInterval(fetchMessages, 5000);
    return () => {
      isMounted = false;
      clearInterval(chatInterval);
    };
  }, [roomId]);

  // Scroll to bottom of chat whenever messages change (unless user scrolled up)
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
                toast.info('Joined in Listen & View mode (no active microphone or camera found).');
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
        const generatedPeerId = `cca_${roomId.replace(/[^a-zA-Z0-9]/g, '')}_u${currentUser?.id || 1}_${Math.floor(1000 + Math.random() * 9000)}`;
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
          const activePeers = res?.active_peers || [];

          // Connect to each existing peer in the room
          activePeers.forEach(p => {
            if (p.peer_id && p.peer_id !== id && !activeCallsRef.current[p.peer_id]) {
              // Initiate data connection for chat
              try {
                const conn = peer.connect(p.peer_id);
                activeConnsRef.current[p.peer_id] = conn;
                conn.on('data', handleIncomingData);
              } catch (e) {}

              // Initiate media call
              const call = peer.call(p.peer_id, stream, {
                metadata: {
                  userId: currentUser?.id,
                  userName: currentUser?.name || 'Admin Host',
                  role: currentUser?.roles?.[0] || 'Admin',
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
          if (res?.created_by) setMeetingCreatorId(Number(res.created_by));
          if (Array.isArray(res?.hosts)) setHostsList(res.hosts.map(Number));
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
                  userName: currentUser?.name || 'Admin Host',
                  role: currentUser?.roles?.[0] || 'Admin',
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

    toast.warning('🔇 All participants have been muted.');
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

    toast.success('🎙️ All participants have been unmuted.');
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
      toast.warning(`🔇 Muted ${targetName}.`);
    } else {
      toast.success(`🎙️ Unmuted ${targetName}.`);
      // Auto-lower hand if participant had raised hand
      if (raisedHands[targetUserId]) {
        handleLowerHand(targetUserId, targetName);
      }
    }
  };

  // ✋ Participant Action: Toggle Raise Hand
  const toggleRaiseHand = () => {
    const nextRaised = !isHandRaised;
    setIsHandRaised(nextRaised);

    setRaisedHands(prev => {
      const updated = { ...prev };
      if (nextRaised) {
        updated[currentUser?.id] = {
          userName: currentUser?.name || 'You',
          raisedAt: Date.now()
        };
      } else {
        delete updated[currentUser?.id];
      }
      return updated;
    });

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'raise_hand',
            payload: {
              userId: currentUser?.id,
              userName: currentUser?.name || 'Participant',
              isRaised: nextRaised,
              raisedAt: Date.now()
            }
          });
        }
      } catch (e) {}
    });

    if (nextRaised) {
      toast.success('✋ You raised your hand to speak.');
    } else {
      toast.info('Hand lowered.');
    }
  };

  // ✋ Host Action: Lower a participant's hand
  const handleLowerHand = (targetUserId, targetName) => {
    if (!isMeHost || !targetUserId) return;
    const numId = Number(targetUserId);

    setRaisedHands(prev => {
      const updated = { ...prev };
      delete updated[numId];
      return updated;
    });

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'raise_hand',
            payload: {
              userId: numId,
              userName: targetName,
              isRaised: false,
              loweredBy: currentUser?.name || 'Host'
            }
          });
        }
      } catch (e) {}
    });

    toast.info(`✋ Lowered ${targetName}'s hand.`);
  };

  // 🌟 Participant Action: Send floating reaction
  const sendFloatingReaction = (emoji) => {
    const reactionPayload = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'You',
      leftPercent: 20 + Math.random() * 60,
      duration: 3200
    };

    triggerFloatingReaction(reactionPayload);

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'floating_reaction',
            payload: reactionPayload
          });
        }
      } catch (e) {}
    });
  };

  // Close reaction picker on outside click
  useEffect(() => {
    if (!reactionPickerOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.reaction-picker-container')) {
        setReactionPickerOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [reactionPickerOpen]);

  // 📌 Local Pin Toggle
  const handleTogglePin = (peerId, userId, userName) => {
    if (pinnedUser && (pinnedUser.peerId === peerId || (userId && Number(pinnedUser.userId) === Number(userId)))) {
      setPinnedUser(null);
      toast.info('📌 Unpinned.');
    } else {
      setPinnedUser({ peerId, userId, userName });
      toast.success(`📌 Pinned ${userName} for you.`);
    }
  };

  // 🌟 Host Spotlight Toggle (Broadcasts to everyone)
  const handleToggleSpotlight = (peerId, userId, userName) => {
    if (!isMeHost) return;
    const isCurrentlySpotlighted = spotlightUser && (spotlightUser.peerId === peerId || (userId && Number(spotlightUser.userId) === Number(userId)));
    const nextSpotlight = !isCurrentlySpotlighted;

    const payload = {
      targetPeerId: peerId,
      targetUserId: userId,
      targetName: userName,
      isSpotlighted: nextSpotlight,
      spotlightedBy: currentUser?.name || 'Host'
    };

    if (nextSpotlight) {
      setSpotlightUser({
        peerId,
        userId,
        userName,
        spotlightedBy: currentUser?.name || 'Host'
      });
      playSpotlightChime();
      toast.success(`🌟 Spotlighted ${userName} for everyone!`);
    } else {
      setSpotlightUser(null);
      toast.info('🌟 Spotlight removed.');
    }

    // Broadcast over DataChannel to all participants
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'spotlight_toggle',
            payload
          });
        }
      } catch (e) {}
    });
  };

  const remotePeerList = Object.entries(remotePeers);
  const totalInRoom = 1 + remotePeerList.length;

  // Focus resolution for Stage vs Filmstrip
  const effectiveFocusUser = pinnedUser || spotlightUser;
  const isFocusSpotlight = Boolean(spotlightUser && (!pinnedUser || (pinnedUser.peerId === spotlightUser.peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(spotlightUser.userId)))));
  const isFocusLocal = Boolean(effectiveFocusUser && (
    effectiveFocusUser.peerId === 'local' ||
    (effectiveFocusUser.userId && Number(effectiveFocusUser.userId) === Number(currentUser?.id))
  ));

  // Auto-clear pinned/spotlight user if they leave the room
  useEffect(() => {
    if (pinnedUser && pinnedUser.peerId !== 'local' && Number(pinnedUser.userId) !== Number(currentUser?.id)) {
      const exists = remotePeerList.some(([pId, r]) => pId === pinnedUser.peerId || (r.userId && Number(r.userId) === Number(pinnedUser.userId)));
      if (!exists) setPinnedUser(null);
    }
    if (spotlightUser && spotlightUser.peerId !== 'local' && Number(spotlightUser.userId) !== Number(currentUser?.id)) {
      const exists = remotePeerList.some(([pId, r]) => pId === spotlightUser.peerId || (r.userId && Number(r.userId) === Number(spotlightUser.userId)));
      if (!exists) setSpotlightUser(null);
    }
  }, [remotePeerList, pinnedUser, spotlightUser, currentUser?.id]);

  // Keep local stream connected to mini filmstrip video when mounted
  useEffect(() => {
    if (localFilmstripVideoRef.current && localStreamRef.current) {
      localFilmstripVideoRef.current.srcObject = localStreamRef.current;
    }
  });

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
        toast.success('🖥️ You are now sharing your screen');
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
    toast.info('Screen share stopped. Switched back to camera.');
  };

  // Send a live chat message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || !currentUser?.id || isSending) return;

    if (isChatLocked && !isMeHost) {
      toast.error('Chat is currently locked by the host.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        room_id: roomId,
        user_id: currentUser.id,
        user_name: currentUser.name || 'Admin Host',
        user_role: isMeHost ? 'Host' : (currentUser.roles?.[0] || 'Member'),
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
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Chat Lock (Host only)
  const handleToggleChatLock = async () => {
    if (!isMeHost) {
      toast.error('Only meeting hosts can lock/unlock the chat.');
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
        // Broadcast to all peers
        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({ type: 'chat_lock_toggle', payload: { isLocked: nextLocked } });
            }
          } catch (e) {}
        });
        toast.success(nextLocked ? '🔒 Chat is now locked for participants.' : '🔓 Chat is now unlocked for everyone!');
      }
    } catch (err) {
      setIsChatLocked(!nextLocked);
      toast.error('Failed to change chat lock state.');
    }
  };

  // Promote or Demote Co-Host (Host only)
  const handleToggleCoHost = async (targetUserId, targetName, isCurrentlyHost) => {
    if (!isMeHost) {
      toast.error('Only meeting hosts can appoint co-hosts.');
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

        // Broadcast host update to all peers
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

        toast.success(action === 'promote' ? `⭐ ${targetName} is now a Co-Host!` : `${targetName} is no longer a Co-Host.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update host privileges.');
    }
  };

  // Pin or Unpin a message (Host only)
  const togglePinMessage = async (msg) => {
    if (!isMeHost) {
      toast.error('Only meeting hosts can pin messages.');
      return;
    }

    const nextPinned = Number(msg.is_pinned) === 1 ? 0 : 1;
    const action = nextPinned === 1 ? 'pin' : 'unpin';

    // Optimistic update
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

      // Broadcast pin toggle to peers
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

      toast.success(nextPinned === 1 ? '📌 Message pinned to top' : 'Message unpinned');
    } catch (err) {
      toast.error('Failed to update pin state.');
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
    toast.success('Conference room link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

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
              CCA STUDIO
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-xs md:max-w-md">
            {meetingTitle || 'Creative Computer Academy Live Conference'}
          </span>
          {myHostTier === 'host' ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              👑 Host Controls Active
            </span>
          ) : myHostTier === 'co_host' ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              ⭐ Co-Host Controls Active
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
                title="Mute all participants at once"
              >
                <FiMicOff size={12} />
                <span>Mute All</span>
              </button>
              <button
                onClick={handleUnmuteAll}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition cursor-pointer"
                title="Unmute all participants"
              >
                <FiMic size={12} />
                <span>Unmute All</span>
              </button>
            </div>
          )}

          {/* Participant Count Pill (Click to open list & promote co-hosts) */}
          <button
            onClick={() => setParticipantsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition cursor-pointer"
            title="Click to view & manage participants"
          >
            <FiUsers size={12} />
            <span>{totalInRoom} in room</span>
          </button>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
            <span>{copied ? 'Copied' : 'Share Link'}</span>
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
              <p className="text-xs font-bold text-slate-300">Connecting to CCA Video Studio...</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                If camera or mic takes time, you can join immediately in listen mode
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
                <span>🚀 Skip & Join (Listen-Only)</span>
              </button>
            </div>
          )}

          {/* 🌟 SCREEN SHARING BANNER (When active) */}
          {isScreenSharing && (
            <div className="mb-3 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-white animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>You are currently sharing your screen with everyone</span>
              </div>
              <button
                onClick={revertToCamera}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer"
              >
                Stop Presenting
              </button>
            </div>
          )}

          {/* 🌟 ZOOM-STYLE GALLERY GRID (When NOT sharing screen, or when presenting) */}
          <div className="relative flex-1 w-full h-[calc(100%-70px)] overflow-hidden flex items-center justify-center">
            
            {/* 🌟 KEYFRAME STYLES FOR FLOATING REACTIONS */}
            <style>{`
              @keyframes floatUpDrift {
                0% {
                  opacity: 0;
                  transform: translateY(20px) scale(0.6) rotate(0deg);
                }
                12% {
                  opacity: 1;
                  transform: translateY(-40px) scale(1.15) rotate(-6deg);
                }
                28% {
                  transform: translateY(-110px) scale(1) rotate(6deg);
                }
                60% {
                  transform: translateY(-240px) scale(0.95) rotate(-4deg);
                  opacity: 0.95;
                }
                100% {
                  transform: translateY(-420px) scale(0.8) rotate(8deg);
                  opacity: 0;
                }
              }
            `}</style>

            {/* 🌟 LIVE FLOATING REACTIONS OVERLAY */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
              {floatingReactions.map((reaction) => (
                <div
                  key={reaction.id}
                  style={{
                    left: `${reaction.leftPercent}%`,
                    bottom: '16px',
                    animation: `floatUpDrift ${reaction.duration || 3200}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`
                  }}
                  className="absolute pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl select-none"
                >
                  <span className="text-2xl drop-shadow-md">{reaction.emoji}</span>
                  <span className="text-[11px] font-bold text-white max-w-[110px] truncate drop-shadow">
                    {reaction.senderName}
                  </span>
                </div>
              ))}
            </div>
            
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
                    <span>Your Shared Screen</span>
                  </div>
                </div>

                {/* Filmstrip of Participants (Zoom Style) */}
                {remotePeerList.length > 0 && (
                  <div className="w-full md:w-60 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
                    {remotePeerList.map(([peerId, remote]) => {
                      const remoteTier = getUserHostTier(remote.userId, remote.role);
                      const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                      const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
                      const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

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
                            isHandRaised={Boolean(raisedHands[remote.userId])}
                            recentReaction={tileReactions[remote.userId]?.emoji}
                            canControlAudio={isMeHost}
                            onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                            canPromote={isMeHost}
                            onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                            compact
                            isPinned={isTilePinned}
                            onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                            isSpotlighted={isTileSpotlighted}
                            onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                            canSpotlight={isMeHost}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : effectiveFocusUser ? (
              /* 🌟 HERO STAGE + FILMSTRIP (When a User is Pinned or Spotlighted) */
              <div className="w-full h-full flex flex-col md:flex-row gap-3">
                
                {/* Main Hero Stage */}
                <div className="flex-1 h-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-amber-500/40 shadow-2xl relative flex items-center justify-center">
                  
                  {/* Top Banner: Pin or Spotlight Indicator */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold shadow-lg ${
                      isFocusSpotlight
                        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                    }`}>
                      <span>{isFocusSpotlight ? '🌟' : '📌'}</span>
                      <span>
                        {isFocusSpotlight
                          ? `Spotlight: ${effectiveFocusUser.userName}`
                          : `Pinned for You: ${effectiveFocusUser.userName}`}
                      </span>
                    </div>

                    {/* Quick Close / Unpin Button */}
                    {pinnedUser ? (
                      <button
                        onClick={() => setPinnedUser(null)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                        title="Unpin speaker"
                      >
                        <span>✕</span>
                        <span>Unpin</span>
                      </button>
                    ) : isMeHost ? (
                      <button
                        onClick={() => handleToggleSpotlight(spotlightUser.peerId, spotlightUser.userId, spotlightUser.userName)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                        title="Remove spotlight"
                      >
                        <span>✕</span>
                        <span>Remove</span>
                      </button>
                    ) : null}
                  </div>

                  {/* Hero Video Content */}
                  {isFocusLocal ? (
                    /* Large Local Video Tile */
                    <div className="w-full h-full relative flex items-center justify-center">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                      />
                      {isVideoOff && (
                        <div className="flex flex-col items-center justify-center gap-3">
                          {currentUser?.profile_picture ? (
                            <img
                              src={getAvatarUrl(currentUser.profile_picture)}
                              alt={currentUser.name}
                              className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-rose-500/40 ring-4 ring-rose-500/20"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20">
                              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <p className="text-base font-bold text-white">{currentUser?.name || 'You'}</p>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
                        <span>{currentUser?.name || 'You'} (You)</span>
                        {isMuted ? <FiMicOff className="text-rose-500" size={13} /> : <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                    </div>
                  ) : (
                    /* Large Remote Video Tile */
                    (() => {
                      const focusedRemoteEntry = remotePeerList.find(([pId, r]) => pId === effectiveFocusUser.peerId || (r.userId && Number(r.userId) === Number(effectiveFocusUser.userId)));
                      if (!focusedRemoteEntry) return null;
                      const [focusedPeerId, focusedRemote] = focusedRemoteEntry;
                      const focusedTier = getUserHostTier(focusedRemote.userId, focusedRemote.role);
                      const isFocusedMuted = Boolean(remoteMuteStates[focusedRemote.userId]);

                      return (
                        <div className="w-full h-full relative">
                          <RemoteVideoTile
                            remotePeerId={focusedPeerId}
                            stream={focusedRemote.stream}
                            userId={focusedRemote.userId}
                            userName={focusedRemote.userName}
                            role={focusedRemote.role}
                            avatar={focusedRemote.avatar}
                            tier={focusedTier}
                            isMuted={isFocusedMuted}
                            isHandRaised={Boolean(raisedHands[focusedRemote.userId])}
                            recentReaction={tileReactions[focusedRemote.userId]?.emoji}
                            canControlAudio={isMeHost}
                            onToggleMic={() => handleToggleParticipantMic(focusedRemote.userId, focusedRemote.userName, isFocusedMuted)}
                            canPromote={isMeHost}
                            onToggleCoHost={() => handleToggleCoHost(focusedRemote.userId, focusedRemote.userName, focusedTier === 'co_host')}
                            isPinned={Boolean(pinnedUser && (pinnedUser.peerId === focusedPeerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(focusedRemote.userId))))}
                            onTogglePin={() => handleTogglePin(focusedPeerId, focusedRemote.userId, focusedRemote.userName)}
                            isSpotlighted={Boolean(spotlightUser && (spotlightUser.peerId === focusedPeerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(focusedRemote.userId))))}
                            onToggleSpotlight={() => handleToggleSpotlight(focusedPeerId, focusedRemote.userId, focusedRemote.userName)}
                            canSpotlight={isMeHost}
                          />
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Filmstrip of Remaining Participants */}
                <div className="w-full md:w-60 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0 pr-1">
                  
                  {/* If focus is NOT local user, show mini local user card in filmstrip */}
                  {!isFocusLocal && (
                    <div className="w-48 md:w-full h-32 shrink-0 relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
                      <video
                        ref={localFilmstripVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                      />
                      {isVideoOff && (
                        <div className="flex flex-col items-center justify-center gap-1">
                          {currentUser?.profile_picture ? (
                            <img
                              src={getAvatarUrl(currentUser.profile_picture)}
                              alt={currentUser.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-white">
                              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <p className="text-[10px] font-bold text-slate-300">{currentUser?.name || 'You'}</p>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-white text-[10px] font-bold z-10">
                        <span>{currentUser?.name || 'You'} (You)</span>
                        {isMuted ? <FiMicOff className="text-rose-500" size={10} /> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1 z-20">
                        <button
                          onClick={() => handleTogglePin('local', currentUser?.id, currentUser?.name || 'You')}
                          className="p-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs text-white cursor-pointer"
                          title="Pin yourself"
                        >
                          📌
                        </button>
                        {isMeHost && (
                          <button
                            onClick={() => handleToggleSpotlight('local', currentUser?.id, currentUser?.name || 'You')}
                            className="p-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 cursor-pointer"
                            title="Spotlight yourself"
                          >
                            🌟
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mini Remote Participants (All except the focused one) */}
                  {remotePeerList
                    .filter(([pId, r]) => !(isFocusLocal ? false : (pId === effectiveFocusUser.peerId || (r.userId && Number(r.userId) === Number(effectiveFocusUser.userId)))))
                    .map(([peerId, remote]) => {
                      const remoteTier = getUserHostTier(remote.userId, remote.role);
                      const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                      const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
                      const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

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
                            isHandRaised={Boolean(raisedHands[remote.userId])}
                            recentReaction={tileReactions[remote.userId]?.emoji}
                            canControlAudio={isMeHost}
                            onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                            canPromote={isMeHost}
                            onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                            compact
                            isPinned={isTilePinned}
                            onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                            isSpotlighted={isTileSpotlighted}
                            onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                            canSpotlight={isMeHost}
                          />
                        </div>
                      );
                    })}
                </div>
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
                        <p className="text-sm font-bold text-white">{currentUser?.name || 'You'}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Camera Off</p>
                      </div>
                    </div>
                  )}

                  {/* Local Badge Label (Zoom Style Bottom-Left) */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-bold">
                    <span>
                      {currentUser?.name || 'You'} ({isMePrimaryHost ? 'Host' : isMeHost ? 'Co-Host' : 'You'})
                    </span>
                    {tileReactions[currentUser?.id] && (
                      <span className="text-sm animate-bounce select-none" title="Your Reaction">
                        {tileReactions[currentUser?.id].emoji}
                      </span>
                    )}
                    {isMePrimaryHost ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1">
                        👑 Host
                      </span>
                    ) : isMeHost ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1">
                        ⭐ Co-Host
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

                  {/* ✋ Local User Raised Hand Badge */}
                  {isHandRaised && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/25 backdrop-blur-md border border-amber-500/60 text-amber-300 text-xs font-black animate-bounce shadow-xl">
                      <span className="text-base">✋</span>
                      <span>Hand Raised</span>
                    </div>
                  )}

                  {/* Local User Quick Pin & Spotlight (Top-Right) */}
                  <div className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 transition-opacity ${
                    (pinnedUser?.peerId === 'local' || spotlightUser?.peerId === 'local') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={() => handleTogglePin('local', currentUser?.id, currentUser?.name || 'You')}
                      className={`px-2 py-1 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg flex items-center gap-1 ${
                        pinnedUser?.peerId === 'local'
                          ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                      title="Pin yourself"
                    >
                      <span>📌</span>
                      <span className="text-[10px]">{pinnedUser?.peerId === 'local' ? 'Unpin' : 'Pin'}</span>
                    </button>
                    {isMeHost && (
                      <button
                        onClick={() => handleToggleSpotlight('local', currentUser?.id, currentUser?.name || 'You')}
                        className={`px-2 py-1 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg flex items-center gap-1 ${
                          spotlightUser?.peerId === 'local'
                            ? 'bg-amber-500/40 border-amber-400 text-amber-200 animate-pulse'
                            : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-amber-300'
                        }`}
                        title="Spotlight yourself"
                      >
                        <span>🌟</span>
                        <span className="text-[10px]">{spotlightUser?.peerId === 'local' ? 'Remove' : 'Spotlight'}</span>
                      </button>
                    )}
                  </div>

                  {/* Waiting hint if alone in room */}
                  {totalInRoom === 1 && (
                    <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Waiting for team members to join...</span>
                    </div>
                  )}
                </div>

                {/* 🌟 REMOTE PARTICIPANT ZOOM CARDS */}
                {remotePeerList.map(([peerId, remote]) => {
                  const remoteTier = getUserHostTier(remote.userId, remote.role);
                  const isRemoteMuted = Boolean(remoteMuteStates[remote.userId]);
                  const isTilePinned = Boolean(pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId))));
                  const isTileSpotlighted = Boolean(spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId))));

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
                      isHandRaised={Boolean(raisedHands[remote.userId])}
                      recentReaction={tileReactions[remote.userId]?.emoji}
                      canControlAudio={isMeHost}
                      onToggleMic={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                      canPromote={isMeHost}
                      onToggleCoHost={() => handleToggleCoHost(remote.userId, remote.userName, remoteTier === 'co_host')}
                      isPinned={isTilePinned}
                      onTogglePin={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                      isSpotlighted={isTileSpotlighted}
                      onToggleSpotlight={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                      canSpotlight={isMeHost}
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
                <span className="text-[10px] font-bold">{isMuted ? 'Unmute' : 'Mute'}</span>
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
                <span className="text-[10px] font-bold">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
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
                <span className="text-[10px] font-bold">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
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
                <span className="text-[10px] font-bold">Chat</span>
                {unreadCount > 0 && !chatOpen && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-bounce shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* ✋ Raise Hand / Lower Hand Button */}
              <button
                onClick={toggleRaiseHand}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  isHandRaised
                    ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                title={isHandRaised ? 'Lower Hand' : 'Raise Hand to Speak'}
              >
                <span className="text-lg leading-none select-none">✋</span>
                <span className="text-[10px] font-bold">
                  {isHandRaised ? 'Hand Up' : 'Raise Hand'}
                </span>
              </button>

              {/* 😊 Live Floating Reactions Button & Tray */}
              <div className="relative reaction-picker-container">
                {/* Emoji Reaction Tray Popup */}
                {reactionPickerOpen && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150">
                    {AVAILABLE_REACTIONS.map(({ emoji, labelEn }) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          sendFloatingReaction(emoji);
                        }}
                        className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-xl md:text-2xl hover:scale-130 active:scale-90 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title={labelEn}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setReactionPickerOpen(prev => !prev)}
                  className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    reactionPickerOpen
                      ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shadow-lg'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Send Floating Reaction"
                >
                  <span className="text-lg leading-none select-none">😊</span>
                  <span className="text-[10px] font-bold">React</span>
                </button>
              </div>

              <div className="h-7 w-px bg-slate-800 mx-1" />

              {/* Leave Room Button */}
              <button
                onClick={onLeave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
                title="Leave this meeting"
              >
                <FiPhoneOff size={15} />
                <span>Leave</span>
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
                <span className="text-xs font-black uppercase tracking-wider">In-Meeting Chat</span>
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
                    <span>{isChatLocked ? 'Locked' : 'Unlocked'}</span>
                  </button>
                ) : (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                    isChatLocked
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isChatLocked ? <FiLock size={10} /> : <FiUnlock size={10} />}
                    <span>{isChatLocked ? 'Host Only' : 'Public'}</span>
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
                  title="Click to view pinned message"
                >
                  <span className="text-base leading-none">📌</span>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                        Pinned Notice
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
                    title="Unpin message"
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
                  <p className="font-bold text-slate-300">No messages yet</p>
                  <p className="text-[11px] text-slate-500">
                    {isChatLocked 
                      ? 'Chat is currently locked by the host. Only hosts can broadcast messages.'
                      : 'Messages sent here are visible to everyone in this meeting.'}
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
                          <span className="font-bold text-slate-200">{isMe ? 'You' : msg.user_name}</span>
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
                              📌 Pinned
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
                          title={isPinned ? 'Unpin message' : 'Pin message to top'}
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
                  <span className="truncate">Chat is locked by host. Only hosts can post.</span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      isChatLocked 
                        ? '[Host Broadcast] Type a message...' 
                        : 'Type a message to everyone...'
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
                <h3 className="text-sm font-black uppercase tracking-wider">Room Participants ({totalInRoom})</h3>
              </div>
              <div className="flex items-center gap-2">
                {isMeHost && totalInRoom > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleMuteAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                      title="Mute all participants at once"
                    >
                      <FiMicOff size={12} />
                      <span>Mute All</span>
                    </button>
                    <button
                      onClick={handleUnmuteAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                      title="Unmute all participants"
                    >
                      <FiMic size={12} />
                      <span>Unmute All</span>
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
              
              {/* ✋ Raised Hands Priority Section (When any member raises hand) */}
              {Object.keys(raisedHands).length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">✋</span>
                      <span>Raised Hands to Speak ({Object.keys(raisedHands).length})</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(raisedHands).map(([uId, hand]) => {
                      const numId = Number(uId);
                      const isSelf = numId === Number(currentUser?.id);
                      const remoteUserMuted = isSelf ? isMuted : Boolean(remoteMuteStates[numId]);

                      return (
                        <div key={uId} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <span className="text-base animate-bounce">✋</span>
                            <div>
                              <p className="text-xs font-bold text-white">
                                {hand.userName} {isSelf ? '(You)' : ''}
                              </p>
                              <p className="text-[9px] text-amber-300/80">
                                Waiting to speak
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isMeHost && !isSelf && (
                              <>
                                <button
                                  onClick={() => {
                                    handleToggleParticipantMic(numId, hand.userName, remoteUserMuted);
                                    handleLowerHand(numId, hand.userName);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition cursor-pointer"
                                  title="Unmute & allow to speak"
                                >
                                  <FiMic size={11} />
                                  <span>Allow Speak</span>
                                </button>
                                <button
                                  onClick={() => handleLowerHand(numId, hand.userName)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                                  title="Lower hand"
                                >
                                  <span>Lower Hand</span>
                                </button>
                              </>
                            )}
                            {isSelf && (
                              <button
                                onClick={toggleRaiseHand}
                                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                              >
                                <span>Lower Hand</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      <span>{currentUser?.name || 'You'} (You)</span>
                      {myHostTier === 'host' ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1">
                          👑 Host
                        </span>
                      ) : myHostTier === 'co_host' ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1">
                          ⭐ Co-Host
                        </span>
                      ) : null}
                      {isHandRaised && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40 flex items-center gap-0.5 animate-pulse">
                          <span>✋</span>
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">{currentUser?.roles?.[0] || 'Member'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePin('local', currentUser?.id, currentUser?.name || 'You')}
                    className={`p-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      pinnedUser?.peerId === 'local'
                        ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={pinnedUser?.peerId === 'local' ? 'Unpin' : 'Pin yourself'}
                  >
                    📌
                  </button>
                  {isMeHost && (
                    <button
                      onClick={() => handleToggleSpotlight('local', currentUser?.id, currentUser?.name || 'You')}
                      className={`p-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        spotlightUser?.peerId === 'local'
                          ? 'bg-amber-500/30 text-amber-200 border-amber-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                      }`}
                      title={spotlightUser?.peerId === 'local' ? 'Remove spotlight' : 'Spotlight yourself'}
                    >
                      🌟
                    </button>
                  )}
                  {isMuted ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 flex items-center gap-1">
                      <FiMicOff size={10} /> Muted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                      <FiMic size={10} /> Active
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
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1">
                              👑 Host
                            </span>
                          ) : remoteTier === 'co_host' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 flex items-center gap-1">
                              ⭐ Co-Host
                            </span>
                          ) : null}
                          {Boolean(raisedHands[remote.userId]) && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40 flex items-center gap-0.5 animate-pulse">
                              <span>✋</span>
                              <span>Hand Up</span>
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400">{remote.role || 'Member'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Pin Speaker for yourself */}
                      <button
                        onClick={() => handleTogglePin(peerId, remote.userId, remote.userName)}
                        className={`p-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId)))
                            ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title={
                          pinnedUser && (pinnedUser.peerId === peerId || (pinnedUser.userId && Number(pinnedUser.userId) === Number(remote.userId)))
                            ? 'Unpin user'
                            : 'Pin user for you'
                        }
                      >
                        📌
                      </button>

                      {/* Spotlight Speaker for Everyone (Host / Co-Host Only) */}
                      {isMeHost && (
                        <button
                          onClick={() => handleToggleSpotlight(peerId, remote.userId, remote.userName)}
                          className={`p-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId)))
                              ? 'bg-amber-500/30 text-amber-200 border-amber-400 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                          }`}
                          title={
                            spotlightUser && (spotlightUser.peerId === peerId || (spotlightUser.userId && Number(spotlightUser.userId) === Number(remote.userId)))
                              ? 'Remove spotlight'
                              : 'Spotlight for everyone'
                          }
                        >
                          🌟
                        </button>
                      )}

                      {/* Host Mic Control for this user - 1-Click Bidirectional Mute ⇄ Unmute */}
                      {isMeHost && remote.userId && (
                        <button
                          onClick={() => handleToggleParticipantMic(remote.userId, remote.userName, isRemoteMuted)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer shadow-sm ${
                            isRemoteMuted
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40 hover:border-rose-400'
                          }`}
                          title={isRemoteMuted ? 'Unmute microphone' : 'Mute microphone'}
                        >
                          {isRemoteMuted ? <FiMic size={11} className="text-emerald-400" /> : <FiMicOff size={11} className="text-rose-400" />}
                          <span>{isRemoteMuted ? 'Unmute' : 'Mute'}</span>
                        </button>
                      )}

                      {/* Host action button: Promote/Demote Co-Host (creator can never be demoted) */}
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
                          <span>{remoteTier === 'co_host' ? 'Remove' : 'Co-Host'}</span>
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
                Close
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
              <h4 className="text-base font-bold text-white">Speaking Request</h4>
              <p className="text-xs text-slate-300 mt-1">
                Host ({unmutePrompt.requestedBy}) would like you to unmute your microphone to speak.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setUnmutePrompt({ open: false, requestedBy: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Stay Muted
              </button>
              <button
                onClick={() => {
                  toggleAudio(true);
                  setUnmutePrompt({ open: false, requestedBy: '' });
                  toast.success('🎙️ Microphone is now active.');
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <FiMic size={14} />
                <span>Unmute Mic</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🌟 ZOOM-STYLE REMOTE VIDEO TILE (With Host Crown, Co-Host & Spotlight/Pin Controls)
function RemoteVideoTile({
  remotePeerId, stream, userId, userName, role, avatar,
  compact = false, tier = 'member', isMuted = false,
  canControlAudio = false, onToggleMic,
  canPromote = false, onToggleCoHost,
  isHandRaised = false, recentReaction = null,
  isPinned = false, onTogglePin,
  isSpotlighted = false, onToggleSpotlight, canSpotlight = false
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
      
      {/* ✋ Remote User Raised Hand Badge */}
      {isHandRaised && (
        <div className={`absolute top-3 z-30 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/25 backdrop-blur-md border border-amber-500/60 text-amber-300 text-[11px] font-bold animate-bounce shadow-xl ${
          canPromote && tier !== 'host' ? 'right-28' : 'right-3'
        }`}>
          <span className="text-sm">✋</span>
          <span>Hand Up</span>
        </div>
      )}

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
              <p className="text-[10px] text-slate-400">Camera Off</p>
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
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <FiMic size={11} className="text-emerald-400" /> : <FiMicOff size={11} className="text-rose-400" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>
      )}

      {/* Zoom-Style Remote User Pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-[11px] font-bold z-10">
        <span>{userName}</span>
        {recentReaction && (
          <span className="text-sm animate-bounce select-none" title="Reaction">
            {recentReaction}
          </span>
        )}
        {isHost ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1 shadow-sm">
            👑 Host
          </span>
        ) : isCoHost ? (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
            ⭐ Co-Host
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
            title={isMuted ? 'Click to Unmute' : 'Click to Mute'}
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
            <FiMicOff className="text-rose-500" size={12} title="Muted" />
          ) : (
            <span className="flex items-center gap-0.5" title="Unmuted">
              <span className="w-1 h-2 bg-emerald-400 animate-pulse" />
              <span className="w-1 h-3.5 bg-emerald-400 animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-1.5 bg-emerald-400 animate-pulse [animation-delay:300ms]" />
            </span>
          )
        )}
      </div>

      {/* Quick Actions (Top-Right): Pin, Spotlight, Co-Host */}
      <div className={`absolute top-3 right-3 z-20 flex items-center gap-1 transition-opacity ${
        isPinned || isSpotlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        {/* Pin Button */}
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg ${
              isPinned
                ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/40'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isPinned ? 'Unpin user' : 'Pin user'}
          >
            📌
          </button>
        )}

        {/* Spotlight Button (Host / Co-Host Only) */}
        {canSpotlight && onToggleSpotlight && (
          <button
            onClick={onToggleSpotlight}
            className={`p-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition cursor-pointer shadow-lg ${
              isSpotlighted
                ? 'bg-amber-500/40 border-amber-400 text-amber-200 ring-1 ring-amber-400/40 animate-pulse'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-amber-300 hover:text-white'
            }`}
            title={isSpotlighted ? 'Remove spotlight' : 'Spotlight user'}
          >
            🌟
          </button>
        )}

        {/* Quick Host Action on Hover - Cannot demote primary creator */}
        {canPromote && userId && !compact && tier !== 'host' && (
          <button
            onClick={onToggleCoHost}
            className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-bold text-amber-300 hover:bg-slate-800 cursor-pointer shadow-lg flex items-center gap-1"
            title={isCoHost ? 'Remove Co-Host status' : 'Promote to Co-Host'}
          >
            <FiStar size={11} className={isCoHost ? 'fill-amber-400' : ''} />
            <span>{isCoHost ? 'Demote' : 'Co-Host'}</span>
          </button>
        )}
      </div>

    </div>
  );
}
