// useMessages.js
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const useMessages = () => {
    const { currentUser } = useAuth();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevChatIdRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);
    const lastTypedAtRef = useRef(0);

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const activeChatRef = useRef(activeChat);
    activeChatRef.current = activeChat;

    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);

    // Search / Selection state
    const [searchChat, setSearchChat] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [groupName, setGroupName] = useState('');

    // Modals / Statuses
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupFile, setEditGroupFile] = useState(null);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [selectedMiniProfile, setSelectedMiniProfile] = useState(null);
    const [userToRemove, setUserToRemove] = useState(null);
    const [pendingChatTarget, setPendingChatTarget] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Message input / upload
    const [typedMessage, setTypedMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [forwardSearchQuery, setForwardSearchQuery] = useState('');
    const [forwardSelectedTargets, setForwardSelectedTargets] = useState({ users: [], chats: [] });
    const [isForwarding, setIsForwarding] = useState(false);

    // Reactions
    const [reactionHoverId, setReactionHoverId] = useState(null);
    const [showEmojiPickerId, setShowEmojiPickerId] = useState(null);

    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    // --- Helper Functions ---
    const getDirectRecipient = useCallback((chat) => {
        if (!chat || chat.type !== 'direct') return null;
        return chat.participants?.find(p => p.id !== currentUser?.id) || null;
    }, [currentUser?.id]);

    const getChatTitle = useCallback((chat) => {
        if (!chat) return '';
        if (chat.type === 'group') return chat.name;
        const recipient = getDirectRecipient(chat);
        return recipient ? recipient.name : 'Unknown User';
    }, [getDirectRecipient]);

    const getChatSub = useCallback((chat) => {
        if (!chat) return '';
        if (chat.type === 'group') return `${chat.participants?.filter(p => p.status !== 'removed').length || 0} Members`;
        const recipient = getDirectRecipient(chat);
        return recipient ? recipient.role_name : 'Staff';
    }, [getDirectRecipient]);

    const toggleContactSelection = (contactId) => {
        setSelectedContacts(prev => {
            if (prev.includes(contactId)) {
                return prev.filter(id => id !== contactId);
            } else {
                return [...prev, contactId];
            }
        });
    };

    const handleDirectMessage = (member) => {
        if (!member || member.id === currentUser?.id) return;
        const existingChat = chats.find(chat => chat.type === 'direct' && chat.participants?.some(p => p.id === member.id));
        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            setActiveChat(null);
            setPendingChatTarget(member);
        }
        setIsGroupInfoOpen(false);
    };

    // Filter chats by search bar
    const filteredChats = chats.filter(chat => {
        const title = getChatTitle(chat).toLowerCase();
        return title.includes(searchChat.toLowerCase());
    });

    // Filter contacts in create modal by search bar
    const filteredContacts = contacts.filter(contact => {
        return (contact.name && contact.name.toLowerCase().includes(searchContact.toLowerCase())) ||
            (contact.department_name && contact.department_name.toLowerCase().includes(searchContact.toLowerCase()));
    });

    const amIAdmin = activeChat?.type === 'group'
        ? activeChat.participants?.some(p => p.id === currentUser?.id && p.is_admin == 1 && p.status !== 'removed') || false
        : false;

    const amIRemoved = activeChat?.type === 'group'
        ? activeChat.participants?.some(p => p.id === currentUser?.id && p.status === 'removed') || false
        : false;

    // --- API & State Methods ---

    const fetchChats = useCallback(async (selectFirstId = null) => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_chats.php`, { user_id: currentUser.id });
            if (res.data && res.data.status === 'success') {
                const chatsList = res.data.chats || [];
                setChats(chatsList);

                if (selectFirstId) {
                    const m = chatsList.find(c => c.id === selectFirstId);
                    if (m) setActiveChat(m);
                } else if (activeChatRef.current) {
                    const currentId = activeChatRef.current.id;
                    const m = chatsList.find(c => c.id === currentId);
                    if (m) {
                        setActiveChat(prev => {
                            if (!prev) return m;
                            if (prev.id === m.id && prev.name === m.name && prev.unread_count === m.unread_count && prev.participants?.length === m.participants?.length) {
                                return prev; // stable reference
                            }
                            return m;
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching chats', err);
        } finally {
            setLoadingChats(false);
        }
    }, [currentUser?.id, API_URL]);

    const fetchMessages = useCallback(async (chatId) => {
        if (!chatId || !currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_messages.php`, {
                chat_id: chatId,
                user_id: currentUser.id
            });
            if (res.data && res.data.status === 'success') {
                setMessages(res.data.messages || []);
            }
        } catch (err) {
            console.error('Error fetching messages', err);
        }
    }, [currentUser?.id, API_URL]);

    const loadContacts = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_chat_users.php`, {
                user_id: currentUser.id
            });
            if (res.data && res.data.status === 'success') {
                setContacts(res.data.users || []);
            }
        } catch (err) {
            console.error('Error loading contacts', err);
        }
    }, [currentUser?.id, API_URL]);

    // --- Effects ---

    // Initial load and periodic chat list polling
    useEffect(() => {
        if (!currentUser?.id) return;
        fetchChats();
        loadContacts();
        const chatInterval = setInterval(() => {
            if (!document.hidden) {
                fetchChats();
            }
        }, 5000);
        return () => clearInterval(chatInterval);
    }, [currentUser?.id, fetchChats, loadContacts]);

    // Message load and polling for active chat
    const activeChatId = activeChat?.id;
    useEffect(() => {
        if (activeChatId) {
            if (prevChatIdRef.current !== activeChatId) {
                setLoadingMessages(true);
            }
            prevChatIdRef.current = activeChatId;

            fetchMessages(activeChatId).then(() => {
                setLoadingMessages(false);
                scrollToBottom();
            });

            const messageInterval = setInterval(() => {
                if (!document.hidden) {
                    fetchMessages(activeChatId);
                }
            }, 4000);

            return () => clearInterval(messageInterval);
        } else {
            setMessages([]);
            prevChatIdRef.current = null;
            prevMessagesLengthRef.current = 0;
        }
    }, [activeChatId, fetchMessages]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (messages.length !== prevMessagesLengthRef.current) {
            if (messages.length > prevMessagesLengthRef.current || prevMessagesLengthRef.current === 0) {
                scrollToBottom();
            }
            prevMessagesLengthRef.current = messages.length;
        }
    }, [messages]);

    // Typing status polling
    useEffect(() => {
        if (activeChatId && currentUser?.id) {
            const typingInterval = setInterval(async () => {
                if (document.hidden) return;
                try {
                    const res = await axios.get(`${API_URL}api/chat/check_typing.php?chat_id=${activeChatId}&user_id=${currentUser.id}`);
                    if (res.data && res.data.status === 'success') {
                        setTypingUsers(res.data.typing_users || []);
                    }
                } catch (err) { /* silent */ }
            }, 3000);
            return () => clearInterval(typingInterval);
        } else {
            setTypingUsers([]);
        }
    }, [activeChatId, currentUser?.id, API_URL]);

    const filteredForwardContacts = contacts.filter(u =>
        u.id !== currentUser?.id &&
        u.name.toLowerCase().includes(forwardSearchQuery.toLowerCase())
    );
    const filteredForwardChats = chats.filter(c =>
        c.name?.toLowerCase().includes(forwardSearchQuery.toLowerCase())
    );

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    async function handleReact(messageId, reaction) {
        try {
            const newMessages = messages.map(msg => {
                if (msg.id === messageId) {
                    let reactions = msg.reactions ? [...msg.reactions] : [];
                    const existing = reactions.find(r => r.user_id === currentUser.id);
                    if (existing) {
                        if (existing.reaction === reaction) {
                            reactions = reactions.filter(r => r.user_id !== currentUser.id);
                        } else {
                            existing.reaction = reaction;
                        }
                    } else {
                        reactions.push({ user_id: currentUser.id, name: currentUser.name, reaction });
                    }
                    return { ...msg, reactions };
                }
                return msg;
            });
            setMessages(newMessages);
            setShowEmojiPickerId(null);
            await axios.post(`${API_URL}api/chat/toggle_reaction.php`, {
                message_id: messageId,
                user_id: currentUser.id,
                reaction: reaction
            });
        } catch (err) {
            console.error('Reaction failed:', err);
        }
    }

    async function handleTyping(e) {
        setTypedMessage(e.target.value);
        if (activeChat && activeChat.id && e.target.value.trim().length > 0) {
            const now = Date.now();
            if (now - lastTypedAtRef.current > 2000) {
                lastTypedAtRef.current = now;
                try {
                    await axios.post(`${API_URL}api/chat/update_typing.php`, {
                        chat_id: activeChat.id,
                        user_id: currentUser.id
                    });
                } catch (err) { /* silent */ }
            }
        }
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        const hasContent = typedMessage.trim() || selectedFile;
        if (!hasContent || (!activeChat && !pendingChatTarget) || isSending) return;

        setIsSending(true);
        try {
            let chatId = activeChat?.id;
            if (!chatId && pendingChatTarget) {
                const createRes = await axios.post(`${API_URL}api/chat/create_chat.php`, {
                    type: 'direct',
                    name: null,
                    participant_ids: [currentUser.id, pendingChatTarget.id],
                    created_by: currentUser.id
                });
                if (createRes.data.status !== 'success') {
                    setIsSending(false);
                    return;
                }
                chatId = createRes.data.chat_id;
                setPendingChatTarget(null);
            }

            if (editingMessage) {
                const res = await axios.post(`${API_URL}api/chat/edit_message.php`, {
                    message_id: editingMessage.id,
                    message: typedMessage,
                    user_id: currentUser.id
                });
                if (res.data.status === 'success') {
                    setTypedMessage('');
                    setEditingMessage(null);
                    fetchMessages(chatId);
                } else {
                    alert(res.data.message);
                }
                setIsSending(false);
                return;
            }

            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('sender_id', currentUser.id);
            if (typedMessage.trim()) formData.append('message', typedMessage.trim());
            if (selectedFile) formData.append('file', selectedFile);
            if (replyingTo) formData.append('reply_to_id', replyingTo.id);

            const res = await axios.post(`${API_URL}api/chat/send_message.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === 'success') {
                setTypedMessage('');
                setSelectedFile(null);
                setReplyingTo(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchMessages(chatId);
                fetchChats();
            }
        } catch (err) {
            console.error('Error sending message', err);
        } finally {
            setIsSending(false);
        }
    }

    async function handleForwardMessage() {
        if (!forwardingMessage) return;
        const { users, chats: targetChats } = forwardSelectedTargets;
        if (users.length === 0 && targetChats.length === 0) return;

        setIsForwarding(true);
        try {
            const res = await axios.post(`${API_URL}api/chat/forward_message.php`, {
                message_id: forwardingMessage.id,
                sender_id: currentUser.id,
                target_users: users,
                target_chats: targetChats
            });
            if (res.data.status === 'success') {
                setForwardModalOpen(false);
                setForwardingMessage(null);
                setForwardSelectedTargets({ users: [], chats: [] });
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error('Error forwarding message', err);
        } finally {
            setIsForwarding(false);
        }
    }

    function toggleForwardTarget(type, id) {
        setForwardSelectedTargets(prev => {
            const targetArray = prev[type];
            if (targetArray.includes(id)) {
                return { ...prev, [type]: targetArray.filter(tId => tId !== id) };
            } else {
                return { ...prev, [type]: [...targetArray, id] };
            }
        });
    }

    async function handleDeleteMessage() {
        if (!messageToDelete) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/delete_message.php`, {
                message_id: messageToDelete,
                user_id: currentUser.id
            });
            if (res.data.status === 'success') {
                if (activeChat?.id) fetchMessages(activeChat.id);
                setMessageToDelete(null);
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error('Error deleting message', err);
        }
    }

    async function handleCreateChat() {
        if (selectedContacts.length === 0) return;

        const isGroup = selectedContacts.length > 1;
        if (isGroup && !groupName.trim()) {
            alert('Please enter a Group Name');
            return;
        }

        const participantIds = [currentUser.id, ...selectedContacts];
        try {
            const res = await axios.post(`${API_URL}api/chat/create_chat.php`, {
                type: isGroup ? 'group' : 'direct',
                name: isGroup ? groupName.trim() : null,
                participant_ids: participantIds,
                created_by: currentUser.id
            });

            if (res.data.status === 'success') {
                const newChatId = res.data.chat_id;
                setSelectedContacts([]);
                setGroupName('');
                setIsNewChatModalOpen(false);
                fetchChats(newChatId);
            }
        } catch (err) {
            console.error('Error creating chat', err);
        }
    }

    async function handleManageMember(action, targetUserId) {
        if (!activeChat) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/manage_group_member.php`, {
                chat_id: activeChat.id,
                admin_id: currentUser.id,
                target_user_id: targetUserId,
                action: action
            });
            if (res.data.status === 'success') {
                fetchChats(activeChat.id);
                setSelectedMiniProfile(null);
                setUserToRemove(null);
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error('Error managing group member', err);
        }
    }

    async function handleAddMembers() {
        if (!activeChat || selectedContacts.length === 0) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/add_group_members.php`, {
                chat_id: activeChat.id,
                user_ids: selectedContacts,
                requested_by: currentUser.id
            });
            if (res.data.status === 'success') {
                setIsAddMemberModalOpen(false);
                setSelectedContacts([]);
                fetchChats(activeChat.id);
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error('Error adding members', err);
        }
    }

    async function handleEditGroup(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!activeChat) return;
        try {
            const formData = new FormData();
            formData.append('chat_id', activeChat.id);
            formData.append('user_id', currentUser.id);
            if (editGroupName !== activeChat.name && editGroupName.trim() !== '') {
                formData.append('name', editGroupName.trim());
            }
            if (editGroupFile) {
                formData.append('file', editGroupFile);
            }

            const res = await axios.post(`${API_URL}api/chat/update_group.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === 'success') {
                setIsEditGroupModalOpen(false);
                fetchChats(activeChat.id);
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error('Error editing group', err);
        }
    }

    return {
        chats, setChats,
        activeChat, setActiveChat,
        messages, setMessages,
        contacts, setContacts,
        searchChat, setSearchChat,
        searchContact, setSearchContact,
        selectedContacts, setSelectedContacts,
        groupName, setGroupName,
        isNewChatModalOpen, setIsNewChatModalOpen,
        isGroupInfoOpen, setIsGroupInfoOpen,
        isAddMemberModalOpen, setIsAddMemberModalOpen,
        isEditGroupModalOpen, setIsEditGroupModalOpen,
        editGroupName, setEditGroupName,
        editGroupFile, setEditGroupFile,
        memberSearchQuery, setMemberSearchQuery,
        selectedMiniProfile, setSelectedMiniProfile,
        userToRemove, setUserToRemove,
        pendingChatTarget, setPendingChatTarget,
        loadingChats, setLoadingChats,
        loadingMessages, setLoadingMessages,
        typedMessage, setTypedMessage,
        selectedFile, setSelectedFile,
        lightboxImage, setLightboxImage,
        isSending, setIsSending,
        replyingTo, setReplyingTo,
        editingMessage, setEditingMessage,
        activeDropdown, setActiveDropdown,
        infoMessage, setInfoMessage,
        messageToDelete, setMessageToDelete,
        typingUsers, setTypingUsers,
        forwardingMessage, setForwardingMessage,
        forwardModalOpen, setForwardModalOpen,
        forwardSearchQuery, setForwardSearchQuery,
        forwardSelectedTargets, setForwardSelectedTargets,
        isForwarding, setIsForwarding,
        reactionHoverId, setReactionHoverId,
        showEmojiPickerId, setShowEmojiPickerId,
        emojis,
        // Refs
        messagesEndRef,
        fileInputRef,
        // Auth & Config
        currentUser,
        API_URL,
        // Functions & Helpers
        getDirectRecipient,
        getChatTitle,
        getChatSub,
        toggleContactSelection,
        handleDirectMessage,
        filteredChats,
        filteredContacts,
        amIAdmin,
        amIRemoved,
        fetchChats,
        fetchMessages,
        handleReact,
        loadContacts,
        handleSendMessage,
        handleTyping,
        scrollToBottom,
        handleForwardMessage,
        toggleForwardTarget,
        filteredForwardContacts,
        filteredForwardChats,
        handleDeleteMessage,
        handleCreateChat,
        handleManageMember,
        handleAddMembers,
        handleEditGroup,
    };
};
