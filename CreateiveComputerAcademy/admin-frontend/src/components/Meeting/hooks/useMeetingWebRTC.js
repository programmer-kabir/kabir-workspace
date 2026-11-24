import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Peer from 'peerjs';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE, createFallbackStream } from '../meetingUtils';

/**
 * useMeetingWebRTC
 * Manages PeerJS peer mesh network, Google STUN connectivity,
 * stream negotiation, heartbeat attendance logging, whiteboard syncing,
 * and high-priority host/co-host room controls.
 */
export function useMeetingWebRTC({
  roomId,
  currentUser,
  creatorId,
  isBn,
  localStreamRef,
  localVideoRef,
  setLoadingMedia,
  setIsVideoOff,
  setIsMuted,
  playSpotlightChime,
  playReactionSound,
  playHandRaiseChime,
  onIncomingMessage,
  onPinUpdate,
  isChatLocked,
  setIsChatLocked,
}) {
  const peerInstanceRef = useRef(null);
  const activeCallsRef = useRef({});
  const activeConnsRef = useRef({});
  const myPeerIdRef = useRef('');

  const [myPeerId, setMyPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState({});
  const [hostsList, setHostsList] = useState([]);
  const [meetingCreatorId, setMeetingCreatorId] = useState(creatorId ? Number(creatorId) : null);

  // Sync creatorId
  useEffect(() => {
    if (creatorId) {
      setMeetingCreatorId(Number(creatorId));
    }
  }, [creatorId]);

  // Audio / Mic states
  const [remoteMuteStates, setRemoteMuteStates] = useState({});
  const [unmutePrompt, setUnmutePrompt] = useState({ open: false, requestedBy: '' });

  // Hand raise
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});

  // Reactions
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [tileReactions, setTileReactions] = useState({});

  // Spotlight & Pin
  const [spotlightUser, setSpotlightUser] = useState(null);
  const [pinnedUser, setPinnedUser] = useState(null);

  // Interactive Whiteboard
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardSharedBy, setWhiteboardSharedBy] = useState(null);
  const [whiteboardAllowOthers, setWhiteboardAllowOthers] = useState(false);
  const [whiteboardHistory, setWhiteboardHistory] = useState([]);
  const whiteboardHistoryRef = useRef([]);
  const whiteboardStateRef = useRef({ isOpen: false, sharedBy: null, allowOthers: false });

  useEffect(() => {
    whiteboardStateRef.current = {
      isOpen: isWhiteboardOpen,
      sharedBy: whiteboardSharedBy,
      allowOthers: whiteboardAllowOthers,
    };
  }, [isWhiteboardOpen, whiteboardSharedBy, whiteboardAllowOthers]);

  // Determine host tier
  const getUserHostTier = useCallback((userId, role) => {
    if (!userId) return 'member';
    const numId = Number(userId);

    if (meetingCreatorId && numId === Number(meetingCreatorId)) {
      return 'host';
    }
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

  // Attendance logger
  const logAttendance = useCallback(async (action, pId) => {
    if (!currentUser?.id || !roomId) return;
    try {
      const currentPid = pId || myPeerIdRef.current;
      const res = await axios.post(`${API_BASE}api/meetings/log_attendance.php`, {
        room_id: roomId,
        user_id: currentUser.id,
        action,
        peer_id: currentPid,
      });
      return res.data;
    } catch (err) {
      console.warn(`Attendance sync (${action}) warning:`, err.message);
    }
  }, [currentUser?.id, roomId]);

  // Add / remove remote stream
  const addRemoteStream = useCallback((remotePeerId, stream, peerInfo = {}) => {
    setRemotePeers(prev => ({
      ...prev,
      [remotePeerId]: {
        stream,
        userId: peerInfo.userId || peerInfo.user_id || null,
        userName: peerInfo.userName || peerInfo.user_name || (isBn ? 'সহকর্মী' : 'CCA Colleague'),
        role: peerInfo.role || 'Member',
        avatar: peerInfo.avatar || peerInfo.profile_picture || null,
        isScreen: Boolean(peerInfo.isScreen),
      },
    }));
  }, [isBn]);

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

  // Floating reaction trigger
  const triggerFloatingReaction = useCallback((reactionData) => {
    const reactionId = reactionData.id || `${Date.now()}-${Math.random()}`;
    const reactionObj = {
      ...reactionData,
      id: reactionId,
      leftPercent: reactionData.leftPercent ?? (15 + Math.random() * 70),
      duration: reactionData.duration ?? 3200,
    };

    setFloatingReactions(prev => [...prev.slice(-15), reactionObj]);

    if (reactionData.senderId) {
      setTileReactions(prev => ({
        ...prev,
        [Number(reactionData.senderId)]: {
          emoji: reactionData.emoji,
          expiresAt: Date.now() + 3500,
        },
      }));
    }

    if (typeof playReactionSound === 'function') playReactionSound();

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
    }, reactionObj.duration + 200);
  }, [playReactionSound]);

  // Send reaction
  const sendFloatingReaction = useCallback((emoji) => {
    const reactionPayload = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      senderId: currentUser?.id,
      senderName: currentUser?.name || (isBn ? 'আপনি' : 'You'),
      leftPercent: 20 + Math.random() * 60,
      duration: 3200,
    };

    triggerFloatingReaction(reactionPayload);

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'floating_reaction',
            payload: reactionPayload,
          });
        }
      } catch (e) {}
    });
  }, [currentUser, isBn, triggerFloatingReaction]);

  // Incoming DataChannel router
  const handleIncomingData = useCallback((data) => {
    if (!data) return;

    if (data.type === 'chat_message' && data.payload) {
      if (typeof onIncomingMessage === 'function') onIncomingMessage(data.payload);
    } else if (data.type === 'pin_toggle' && data.payload) {
      if (typeof onPinUpdate === 'function') onPinUpdate(data.payload.messageId, data.payload.isPinned);
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

        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: nextMuted },
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
        toast.success(isBn
          ? `🎙️ হোস্ট (${data.payload?.unmutedBy || 'Host'}) সবার মাইক চালু করেছেন!`
          : `🎙️ Host (${data.payload?.unmutedBy || 'Host'}) has unmuted everyone!`);

        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: false },
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
        toast.warning(isBn
          ? `🔇 হোস্ট (${data.payload?.mutedBy || 'Host'}) সবাইকে মিউট করেছেন।`
          : `🔇 Host (${data.payload?.mutedBy || 'Host'}) has muted everyone.`);

        Object.values(activeConnsRef.current).forEach(conn => {
          try {
            if (conn.open) {
              conn.send({
                type: 'peer_mic_state',
                payload: { userId: currentUser?.id, isMuted: true },
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
          requestedBy: data.payload?.requestedBy || (isBn ? 'হোস্ট' : 'Host'),
        });
      }
    } else if (data.type === 'peer_mic_state' && data.payload?.userId) {
      setRemoteMuteStates(prev => ({
        ...prev,
        [data.payload.userId]: Boolean(data.payload.isMuted),
      }));
    } else if (data.type === 'raise_hand' && data.payload) {
      const { userId, userName, isRaised, raisedAt, loweredBy } = data.payload;
      const numUserId = Number(userId);

      setRaisedHands(prev => {
        const updated = { ...prev };
        if (isRaised) {
          updated[numUserId] = {
            userName: userName || 'Participant',
            raisedAt: raisedAt || Date.now(),
          };
        } else {
          delete updated[numUserId];
        }
        return updated;
      });

      if (numUserId === Number(currentUser?.id)) {
        setIsHandRaised(Boolean(isRaised));
        if (!isRaised && loweredBy) {
          toast.info(isBn
            ? `হোস্ট (${loweredBy}) আপনার হাত নামিয়ে দিয়েছেন।`
            : `Host (${loweredBy}) lowered your hand.`);
        }
      }

      if (isRaised && numUserId !== Number(currentUser?.id) && isMeHost) {
        if (typeof playHandRaiseChime === 'function') playHandRaiseChime();
        toast.info(isBn
          ? `✋ ${userName || 'মেম্বার'} কথা বলার জন্য হাত তুলেছেন!`
          : `✋ ${userName || 'Participant'} raised hand to speak!`);
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
          spotlightedBy,
        });
        if (typeof playSpotlightChime === 'function') playSpotlightChime();
        toast.info(isBn
          ? `🌟 হোস্ট (${spotlightedBy}) সবার জন্য ${targetName}-কে স্পটলাইট করেছেন।`
          : `🌟 Host (${spotlightedBy}) spotlighted ${targetName} for everyone.`);
      } else {
        setSpotlightUser(null);
        toast.info(isBn ? '🌟 স্পটলাইট সরানো হয়েছে।' : '🌟 Spotlight removed.');
      }
    } else if (data.type === 'wb_toggle' && data.payload) {
      const { isOpen, sharedBy, allowOthers } = data.payload;
      setIsWhiteboardOpen(Boolean(isOpen));
      setWhiteboardSharedBy(isOpen ? sharedBy : null);
      if (typeof allowOthers === 'boolean') setWhiteboardAllowOthers(allowOthers);
      if (!isOpen) {
        setWhiteboardHistory([]);
        whiteboardHistoryRef.current = [];
      }
      if (isOpen) {
        toast.info(isBn
          ? `🎨 ${sharedBy?.userName || 'উপস্থাপক'} লাইভ হোয়াইটবোর্ড চালু করেছেন।`
          : `🎨 ${sharedBy?.userName || 'Presenter'} opened Live Whiteboard.`);
      } else {
        toast.info(isBn ? '🎨 হোয়াইটবোর্ড বন্ধ করা হয়েছে।' : '🎨 Whiteboard closed.');
      }
    } else if (data.type === 'wb_permission' && typeof data.payload?.allowOthers === 'boolean') {
      setWhiteboardAllowOthers(data.payload.allowOthers);
      toast.info(data.payload.allowOthers
        ? (isBn ? '🔓 হোস্ট সবার জন্য হোয়াইটবোর্ডে ড্রয়িং উন্মুক্ত করেছেন!' : '🔓 Host allowed everyone to draw!')
        : (isBn ? '🔒 হোস্ট হোয়াইটবোর্ড শুধুমাত্র উপস্থাপক মোডে রেখেছেন।' : '🔒 Host set whiteboard to presenter-only mode.'));
    } else if (data.type === 'wb_draw' && data.payload) {
      setWhiteboardHistory(prev => {
        const next = [...prev, data.payload];
        whiteboardHistoryRef.current = next;
        return next;
      });
    } else if (data.type === 'wb_undo') {
      setWhiteboardHistory(prev => {
        const next = prev.slice(0, -1);
        whiteboardHistoryRef.current = next;
        return next;
      });
    } else if (data.type === 'wb_clear') {
      setWhiteboardHistory([]);
      whiteboardHistoryRef.current = [];
    } else if (data.type === 'wb_sync' && data.payload) {
      setIsWhiteboardOpen(Boolean(data.payload.isOpen));
      setWhiteboardSharedBy(data.payload.sharedBy || null);
      if (typeof data.payload.allowOthers === 'boolean') setWhiteboardAllowOthers(data.payload.allowOthers);
      if (Array.isArray(data.payload.history)) {
        setWhiteboardHistory(data.payload.history);
        whiteboardHistoryRef.current = data.payload.history;
      }
    }
  }, [
    currentUser?.id,
    currentUser?.name,
    isBn,
    isMeHost,
    playHandRaiseChime,
    playSpotlightChime,
    triggerFloatingReaction,
    onIncomingMessage,
    onPinUpdate,
    setIsChatLocked,
    setIsMuted,
    localStreamRef,
  ]);

  // Main conference initialization
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
                  audio: true,
                }),
                timeoutPromise(4000),
              ]);
            } catch (mediaErr) {
              console.warn('Full camera/mic access failed or timed out, trying audio only:', mediaErr);
              setIsVideoOff(true);
              try {
                stream = await Promise.race([
                  navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
                  timeoutPromise(3000),
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
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
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

        const setupPeerConnection = (conn) => {
          activeConnsRef.current[conn.peer] = conn;
          conn.on('data', handleIncomingData);
          conn.on('open', () => {
            if (whiteboardStateRef.current.isOpen) {
              try {
                conn.send({
                  type: 'wb_sync',
                  payload: {
                    isOpen: true,
                    sharedBy: whiteboardStateRef.current.sharedBy,
                    allowOthers: whiteboardStateRef.current.allowOthers,
                    history: whiteboardHistoryRef.current,
                  },
                });
              } catch (e) {}
            }
          });
        };

        peer.on('connection', (conn) => {
          setupPeerConnection(conn);
        });

        peer.on('open', async (id) => {
          if (!isMounted) return;
          const res = await logAttendance('join', id);
          if (res?.created_by) setMeetingCreatorId(Number(res.created_by));
          if (Array.isArray(res?.hosts)) setHostsList(res.hosts.map(Number));
          if (typeof res?.is_chat_locked !== 'undefined') setIsChatLocked(Boolean(res.is_chat_locked));
          const activePeers = res?.active_peers || [];

          activePeers.forEach(p => {
            if (p.peer_id && p.peer_id !== id && !activeCallsRef.current[p.peer_id]) {
              try {
                const conn = peer.connect(p.peer_id);
                setupPeerConnection(conn);
              } catch (e) {}

              const call = peer.call(p.peer_id, stream, {
                metadata: {
                  userId: currentUser?.id,
                  userName: currentUser?.name || 'Staff Member',
                  role: currentUser?.roles?.[0] || 'Staff',
                  avatar: currentUser?.profile_picture || null,
                },
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
                avatar: meta.avatar || null,
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

        // 3. Heartbeat loop (every 7 seconds)
        syncInterval = setInterval(async () => {
          if (!isMounted || !peer || peer.destroyed) return;
          const res = await logAttendance('ping', peer.id);
          const peers = res?.active_peers || [];

          peers.forEach(p => {
            if (p.peer_id && p.peer_id !== peer.id && !activeCallsRef.current[p.peer_id]) {
              try {
                const conn = peer.connect(p.peer_id);
                setupPeerConnection(conn);
              } catch (e) {}

              const call = peer.call(p.peer_id, localStreamRef.current, {
                metadata: {
                  userId: currentUser?.id,
                  userName: currentUser?.name || 'Staff Member',
                  role: currentUser?.roles?.[0] || 'Staff',
                  avatar: currentUser?.profile_picture || null,
                },
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

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      Object.values(activeCallsRef.current).forEach(c => {
        try { c.close(); } catch (e) {}
      });
      if (peerInstanceRef.current) {
        try { peerInstanceRef.current.destroy(); } catch (e) {}
      }
    };
  }, [
    roomId,
    currentUser?.id,
    currentUser?.name,
    currentUser?.roles,
    currentUser?.profile_picture,
    isBn,
    logAttendance,
    addRemoteStream,
    removeRemoteStream,
    handleIncomingData,
    localStreamRef,
    localVideoRef,
    setIsMuted,
    setIsVideoOff,
    setLoadingMedia,
    setIsChatLocked,
  ]);

  // Host Action: Mute All
  const handleMuteAll = useCallback(() => {
    if (!isMeHost) return;
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'mute_all',
            payload: {
              mutedBy: currentUser?.name || 'Host',
              senderId: currentUser?.id,
            },
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
  }, [isMeHost, currentUser, isBn]);

  // Host Action: Unmute All
  const handleUnmuteAll = useCallback(() => {
    if (!isMeHost) return;
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'unmute_all',
            payload: {
              unmutedBy: currentUser?.name || 'Host',
              senderId: currentUser?.id,
            },
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
  }, [isMeHost, currentUser, isBn]);

  // Lower participant hand
  const handleLowerHand = useCallback((targetUserId, targetName) => {
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
              loweredBy: currentUser?.name || 'Host',
            },
          });
        }
      } catch (e) {}
    });

    toast.info(isBn ? `✋ ${targetName}-এর হাত নামিয়ে দেওয়া হয়েছে।` : `✋ Lowered ${targetName}'s hand.`);
  }, [isMeHost, currentUser, isBn]);

  // Toggle participant mic
  const handleToggleParticipantMic = useCallback((targetUserId, targetName, currentMutedState) => {
    if (!isMeHost || !targetUserId) return;
    const nextMuted = !currentMutedState;

    setRemoteMuteStates(prev => ({ ...prev, [targetUserId]: nextMuted }));

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'set_mic_state',
            payload: {
              targetUserId,
              isMuted: nextMuted,
              toggledBy: currentUser?.name || 'Host',
            },
          });
          conn.send({
            type: 'peer_mic_state',
            payload: { userId: targetUserId, isMuted: nextMuted },
          });
        }
      } catch (e) {}
    });

    if (nextMuted) {
      toast.warning(isBn ? `🔇 ${targetName}-কে মিউট করা হয়েছে।` : `🔇 Muted ${targetName}.`);
    } else {
      toast.success(isBn ? `🎙️ ${targetName}-এর মাইক চালু করা হয়েছে।` : `🎙️ Unmuted ${targetName}.`);
      if (raisedHands[targetUserId]) {
        handleLowerHand(targetUserId, targetName);
      }
    }
  }, [isMeHost, currentUser, isBn, raisedHands, handleLowerHand]);

  // Toggle Raise Hand
  const toggleRaiseHand = useCallback(() => {
    const nextRaised = !isHandRaised;
    setIsHandRaised(nextRaised);

    setRaisedHands(prev => {
      const updated = { ...prev };
      if (nextRaised) {
        updated[currentUser?.id] = {
          userName: currentUser?.name || 'You',
          raisedAt: Date.now(),
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
              raisedAt: Date.now(),
            },
          });
        }
      } catch (e) {}
    });

    if (nextRaised) {
      toast.success(isBn ? '✋ আপনি কথা বলার জন্য হাত তুলেছেন।' : '✋ You raised your hand to speak.');
    } else {
      toast.info(isBn ? 'হাত নামিয়ে নেওয়া হয়েছে।' : 'Hand lowered.');
    }
  }, [isHandRaised, currentUser, isBn]);

  // Local Pin Toggle
  const handleTogglePin = useCallback((peerId, userId, userName) => {
    if (pinnedUser && (pinnedUser.peerId === peerId || (userId && Number(pinnedUser.userId) === Number(userId)))) {
      setPinnedUser(null);
      toast.info(isBn ? '📌 পিন সরানো হয়েছে।' : '📌 Unpinned.');
    } else {
      setPinnedUser({ peerId, userId, userName });
      toast.success(isBn ? `📌 ${userName}-কে আপনার জন্য পিন করা হয়েছে।` : `📌 Pinned ${userName} for you.`);
    }
  }, [pinnedUser, isBn]);

  // Host Spotlight Toggle
  const handleToggleSpotlight = useCallback((peerId, userId, userName) => {
    if (!isMeHost) return;
    const isCurrentlySpotlighted = spotlightUser && (spotlightUser.peerId === peerId || (userId && Number(spotlightUser.userId) === Number(userId)));
    const nextSpotlight = !isCurrentlySpotlighted;

    const payload = {
      targetPeerId: peerId,
      targetUserId: userId,
      targetName: userName,
      isSpotlighted: nextSpotlight,
      spotlightedBy: currentUser?.name || 'Host',
    };

    if (nextSpotlight) {
      setSpotlightUser({
        peerId,
        userId,
        userName,
        spotlightedBy: currentUser?.name || 'Host',
      });
      if (typeof playSpotlightChime === 'function') playSpotlightChime();
      toast.success(isBn ? `🌟 ${userName}-কে সবার জন্য স্পটলাইট করা হয়েছে!` : `🌟 Spotlighted ${userName} for everyone!`);
    } else {
      setSpotlightUser(null);
      toast.info(isBn ? '🌟 স্পটলাইট সরানো হয়েছে।' : '🌟 Spotlight removed.');
    }

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({
            type: 'spotlight_toggle',
            payload,
          });
        }
      } catch (e) {}
    });
  }, [isMeHost, spotlightUser, currentUser, playSpotlightChime, isBn]);

  // Promote / Demote Co-Host
  const handleToggleCoHost = useCallback(async (targetUserId, targetName, isCurrentlyHost) => {
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
        action,
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
                  isPromoted: action === 'promote',
                },
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
  }, [isMeHost, currentUser, isBn, roomId]);

  // Whiteboard actions
  const handleToggleWhiteboard = useCallback(() => {
    if (!isMeHost) {
      toast.error(isBn ? 'শুধুমাত্র হোস্ট ও কো-হোস্ট হোয়াইটবোর্ড নিয়ন্ত্রণ করতে পারবেন।' : 'Only hosts and co-hosts can manage the whiteboard.');
      return;
    }
    const nextOpen = !isWhiteboardOpen;
    const sharedByInfo = nextOpen ? {
      userId: currentUser?.id,
      userName: currentUser?.name || 'Host',
      peerId: myPeerId || 'host',
    } : null;

    setIsWhiteboardOpen(nextOpen);
    setWhiteboardSharedBy(sharedByInfo);
    if (!nextOpen) {
      setWhiteboardHistory([]);
      whiteboardHistoryRef.current = [];
    }

    const payload = {
      isOpen: nextOpen,
      sharedBy: sharedByInfo,
      allowOthers: whiteboardAllowOthers,
    };

    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({ type: 'wb_toggle', payload });
        }
      } catch (e) {}
    });

    if (nextOpen) {
      toast.success(isBn ? '🎨 লাইভ হোয়াইটবোর্ড চালু হয়েছে!' : '🎨 Live Whiteboard opened!');
    } else {
      toast.info(isBn ? '🎨 হোয়াইটবোর্ড বন্ধ করা হয়েছে।' : '🎨 Whiteboard closed.');
    }
  }, [isMeHost, isWhiteboardOpen, currentUser, myPeerId, whiteboardAllowOthers, isBn]);

  const handleWhiteboardAction = useCallback((action) => {
    setWhiteboardHistory(prev => {
      const next = [...prev, action];
      whiteboardHistoryRef.current = next;
      return next;
    });
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({ type: 'wb_draw', payload: action });
        }
      } catch (e) {}
    });
  }, []);

  const handleWhiteboardUndo = useCallback(() => {
    setWhiteboardHistory(prev => {
      const next = prev.slice(0, -1);
      whiteboardHistoryRef.current = next;
      return next;
    });
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({ type: 'wb_undo' });
        }
      } catch (e) {}
    });
  }, []);

  const handleWhiteboardClear = useCallback(() => {
    setWhiteboardHistory([]);
    whiteboardHistoryRef.current = [];
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({ type: 'wb_clear' });
        }
      } catch (e) {}
    });
    toast.info(isBn ? '🎨 হোয়াইটবোর্ড পরিষ্কার করা হয়েছে।' : '🎨 Whiteboard cleared.');
  }, [isBn]);

  const handleToggleWhiteboardAllowOthers = useCallback(() => {
    if (!isMeHost) return;
    const nextVal = !whiteboardAllowOthers;
    setWhiteboardAllowOthers(nextVal);
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({ type: 'wb_permission', payload: { allowOthers: nextVal } });
        }
      } catch (e) {}
    });
    toast.success(nextVal
      ? (isBn ? '🔓 অন্যান্য সদস্যরা এখন হোয়াইটবোর্ডে ড্র করতে পারবেন!' : '🔓 Participants can now draw on the whiteboard!')
      : (isBn ? '🔒 হোয়াইটবোর্ড শুধুমাত্র হোস্টের জন্য সীমাবদ্ধ করা হয়েছে।' : '🔒 Whiteboard restricted to presenter only.'));
  }, [isMeHost, whiteboardAllowOthers, isBn]);

  // Remote peer list array
  const remotePeerList = useMemo(() => Object.entries(remotePeers), [remotePeers]);
  const totalInRoom = remotePeerList.length + 1;

  // Auto-clear pinned/spotlight user if they leave the room
  useEffect(() => {
    if (pinnedUser && pinnedUser.peerId !== 'local') {
      const exists = remotePeerList.some(([pId, r]) => pId === pinnedUser.peerId || (r.userId && Number(r.userId) === Number(pinnedUser.userId)));
      if (!exists) setPinnedUser(null);
    }
    if (spotlightUser && spotlightUser.peerId !== 'local') {
      const exists = remotePeerList.some(([pId, r]) => pId === spotlightUser.peerId || (r.userId && Number(r.userId) === Number(spotlightUser.userId)));
      if (!exists) setSpotlightUser(null);
    }
  }, [remotePeerList, pinnedUser, spotlightUser]);

  return {
    myPeerId,
    activeCallsRef,
    activeConnsRef,
    remotePeers,
    remotePeerList,
    totalInRoom,
    hostsList,
    meetingCreatorId,
    getUserHostTier,
    myHostTier,
    isMeHost,
    isMePrimaryHost,
    remoteMuteStates,
    unmutePrompt,
    setUnmutePrompt,
    isHandRaised,
    setIsHandRaised,
    raisedHands,
    toggleRaiseHand,
    handleLowerHand,
    floatingReactions,
    tileReactions,
    sendFloatingReaction,
    spotlightUser,
    setSpotlightUser,
    pinnedUser,
    setPinnedUser,
    handleTogglePin,
    handleToggleSpotlight,
    handleMuteAll,
    handleUnmuteAll,
    handleToggleParticipantMic,
    handleToggleCoHost,
    isWhiteboardOpen,
    setIsWhiteboardOpen,
    whiteboardSharedBy,
    whiteboardAllowOthers,
    whiteboardHistory,
    handleToggleWhiteboard,
    handleToggleWhiteboardAllowOthers,
    handleWhiteboardAction,
    handleWhiteboardUndo,
    handleWhiteboardClear,
  };
}
