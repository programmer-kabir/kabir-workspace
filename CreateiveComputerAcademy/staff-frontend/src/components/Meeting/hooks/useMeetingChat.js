import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE, getChatFileDownloadUrl } from '../meetingUtils';

/**
 * useMeetingChat
 * Manages in-meeting chat state, text/code/file sending, pinned messages,
 * chat locking (host only), and direct file downloads.
 */
export function useMeetingChat({
  roomId,
  currentUser,
  isBn,
  isMeHost,
  isChatLocked,
  setIsChatLocked,
  activeConnsRef,
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  // Code Snippet & Attachment state
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  const chatScrollRef = useRef(null);
  const chatFileInputRef = useRef(null);

  // Broadcast data payload to all connected peers
  const broadcastData = useCallback((type, payload) => {
    if (!activeConnsRef?.current) return;
    Object.values(activeConnsRef.current).forEach(conn => {
      try {
        if (conn.open) {
          conn.send({ type, payload });
        }
      } catch (e) {}
    });
  }, [activeConnsRef]);

  // Periodic fetch of chat messages
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
        }
      } catch (err) {}
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, setIsChatLocked]);

  // Receive incoming chat message via DataChannel
  const receiveIncomingMessage = useCallback((msgObj) => {
    setChatMessages(prev => {
      if (prev.some(m => m.id === msgObj.id || (m.created_at === msgObj.created_at && m.user_id === msgObj.user_id && m.message === msgObj.message))) {
        return prev;
      }
      return [...prev, msgObj];
    });

    setChatOpen(isOpen => {
      if (!isOpen) {
        setUnreadCount(c => c + 1);
        toast.info(`💬 ${msgObj.user_name}: ${msgObj.message?.substring(0, 30)}...`);
      }
      return isOpen;
    });
  }, []);

  // Receive pin update via DataChannel
  const receivePinUpdate = useCallback((messageId, isPinned) => {
    setChatMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_pinned: isPinned } : m))
    );
  }, []);

  // 1. Send live text message
  const handleSendMessage = useCallback(async (e) => {
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
        message: text,
      };

      const res = await axios.post(`${API_BASE}api/meetings/send_message.php`, payload);
      if (res.data?.status === 'success' && res.data.message) {
        const newMsg = res.data.message;
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');
        broadcastData('chat_message', newMsg);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'মেসেজ পাঠানো সম্ভব হয়নি।' : 'Failed to send message.'));
    } finally {
      setIsSending(false);
    }
  }, [chatInput, currentUser, isSending, isChatLocked, isMeHost, isBn, roomId, broadcastData]);

  // 2. Send code snippet
  const handleSendCodeSnippet = useCallback(async (e) => {
    e?.preventDefault();
    const code = codeSnippet.trim();
    if (!code || !currentUser?.id || isSending) return;

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
        message: code,
        message_type: 'code',
        code_language: codeLanguage,
      };

      const res = await axios.post(`${API_BASE}api/meetings/send_message.php`, payload);
      if (res.data?.status === 'success' && res.data.message) {
        const newMsg = res.data.message;
        setChatMessages(prev => [...prev, newMsg]);
        setCodeSnippet('');
        setCodeModalOpen(false);
        broadcastData('chat_message', newMsg);
        toast.success(isBn ? 'কোড স্ননিপেট সফলভাবে শেয়ার হয়েছে!' : 'Code snippet shared successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isBn ? 'কোড পাঠানো সম্ভব হয়নি।' : 'Failed to send code snippet.'));
    } finally {
      setIsSending(false);
    }
  }, [codeSnippet, currentUser, isSending, isChatLocked, isMeHost, isBn, roomId, codeLanguage, broadcastData]);

  // 3. Upload & share file/image
  const handleChatFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id || isUploadingFile) return;

    if (isChatLocked && !isMeHost) {
      toast.error(isBn ? 'চ্যাট বর্তমানে হোস্ট দ্বারা লক করা রয়েছে।' : 'Chat is currently locked by the host.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error(isBn ? 'ফাইলের আকার ২৫MB এর বেশি হতে পারবে না।' : 'File size cannot exceed 25MB.');
      return;
    }

    setIsUploadingFile(true);
    const toastId = toast.loading(isBn ? `"${file.name}" আপলোড হচ্ছে...` : `Uploading "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_id', roomId);
      formData.append('user_id', currentUser.id);

      const uploadRes = await axios.post(`${API_BASE}api/meetings/upload_chat_file.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.status === 'success') {
        const fileData = uploadRes.data.file || uploadRes.data;
        const isImage = Boolean(fileData.is_image);
        const msgType = isImage ? 'image' : 'file';
        const fileUrl = fileData.url || fileData.file_url || '';
        const fileName = fileData.original_name || fileData.filename || file.name || 'attachment';
        const fileSize = fileData.size || fileData.file_size || file.size || 0;

        const payload = {
          room_id: roomId,
          user_id: currentUser.id,
          user_name: currentUser.name || (isBn ? 'স্টাফ মেম্বার' : 'Staff Member'),
          user_role: isMeHost ? 'Host' : (currentUser.roles?.[0] || 'Staff'),
          message: fileName,
          message_type: msgType,
          attachment_url: fileUrl,
          attachment_name: fileName,
          attachment_size: fileSize,
        };

        const res = await axios.post(`${API_BASE}api/meetings/send_message.php`, payload);
        if (res.data?.status === 'success' && res.data.message) {
          const newMsg = res.data.message;
          setChatMessages(prev => [...prev, newMsg]);
          broadcastData('chat_message', newMsg);
          toast.dismiss(toastId);
          toast.success(isBn ? 'ফাইল সফলভাবে শেয়ার হয়েছে!' : 'File shared successfully!');
        }
      } else {
        throw new Error(uploadRes.data?.message || 'Upload failed');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || (isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে।' : 'File upload failed.'));
    } finally {
      setIsUploadingFile(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  }, [currentUser, isUploadingFile, isChatLocked, isMeHost, isBn, roomId, broadcastData]);

  // 4. Copy code snippet
  const handleCopyCodeSnippet = useCallback((msgId, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSnippetId(msgId);
    toast.success(isBn ? 'কোড ক্লিপবোর্ডে কপি হয়েছে!' : 'Code copied to clipboard!');
    setTimeout(() => {
      setCopiedSnippetId(null);
    }, 2000);
  }, [isBn]);

  // 5. Direct file downloader (forces direct attachment download)
  const handleDirectFileDownload = useCallback(async (fileUrl, fileName, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const safeName = fileName || 'download';
    const downloadApiUrl = getChatFileDownloadUrl(fileUrl, safeName);

    const toastId = toast.loading(isBn ? `"${safeName}" ডাউনলোড হচ্ছে...` : `Downloading "${safeName}"...`);
    try {
      const response = await fetch(downloadApiUrl);
      if (!response.ok) throw new Error('Download request failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', safeName);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      toast.dismiss(toastId);
      toast.success(isBn ? 'ডাউনলোড সফল হয়েছে!' : 'Download complete!');
    } catch (err) {
      toast.dismiss(toastId);
      const tempLink = document.createElement('a');
      tempLink.href = downloadApiUrl;
      tempLink.setAttribute('download', safeName);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    }
  }, [isBn]);

  // 6. Host Toggle Chat Lock
  const handleToggleChatLock = useCallback(async () => {
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
        is_locked: nextLocked ? 1 : 0,
      });

      if (res.data?.status === 'success') {
        broadcastData('chat_lock_toggle', { isLocked: nextLocked });
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
  }, [isMeHost, isBn, isChatLocked, setIsChatLocked, roomId, currentUser?.id, broadcastData]);

  // 7. Host Pin/Unpin message
  const togglePinMessage = useCallback(async (msg) => {
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
        action,
      });

      broadcastData('pin_toggle', { messageId: msg.id, isPinned: nextPinned });

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
  }, [isMeHost, isBn, roomId, currentUser?.id, broadcastData]);

  // 8. Scroll to message
  const scrollToMessage = useCallback((msgId) => {
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 3000);
    }
  }, []);

  return {
    chatOpen,
    setChatOpen,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    unreadCount,
    setUnreadCount,
    isSending,
    highlightedMsgId,
    codeModalOpen,
    setCodeModalOpen,
    codeSnippet,
    setCodeSnippet,
    codeLanguage,
    setCodeLanguage,
    isUploadingFile,
    copiedSnippetId,
    previewImageModal,
    setPreviewImageModal,
    chatScrollRef,
    chatFileInputRef,
    handleSendMessage,
    handleSendCodeSnippet,
    handleChatFileUpload,
    handleCopyCodeSnippet,
    handleDirectFileDownload,
    handleToggleChatLock,
    togglePinMessage,
    scrollToMessage,
    receiveIncomingMessage,
    receivePinUpdate,
  };
}
