import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const useMessages = () => {
    const { currentUser } = useAuth();
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    // Active state lists
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [searchChat, setSearchChat] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [contactingAdmin, setContactingAdmin] = useState(null);
    const [pendingChatTarget, setPendingChatTarget] = useState(null);
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

    // Staff Profile View
    const [viewingProfileCode, setViewingProfileCode] = useState(null);
    const [viewingProfileData, setViewingProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // ─── Functions ───────────────────────────────────────────

    // 1. Fetch Chat channels list
    const fetchChats = async (selectFirstId = null) => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_chats.php`, {
                user_id: currentUser.id
            });
            if (res.data.status === 'success') {
                const chatsList = res.data.chats || [];
                setChats(chatsList);

                // Auto-select chat if specified, or if we had an active chat previously
                if (selectFirstId) {
                    const matchingChat = chatsList.find(c => c.id === selectFirstId);
                    if (matchingChat) setActiveChat(matchingChat);
                } else if (activeChat) {
                    const matchingChat = chatsList.find(c => c.id === activeChat.id);
                    if (matchingChat) setActiveChat(matchingChat);
                }
            }
        } catch (err) {
            console.error('Error fetching chats', err);
        } finally {
            setLoadingChats(false);
        }
    };

    // 2. Fetch messages in active chat
    const fetchMessages = async (chatId) => {
        if (!chatId || !currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_messages.php`, {
                chat_id: chatId,
                user_id: currentUser.id
            });
            if (res.data.status === 'success') {
                setMessages(res.data.messages || []);
            }
        } catch (err) {
            console.error('Error fetching messages', err);
        }
    };

    // 3. Toggle emoji reaction on a message
    const handleReact = async (messageId, reaction) => {
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
    };

    // 4. View a staff member's profile
    const handleViewProfile = async (target) => {
        setSelectedMiniProfile(null);
        const code = typeof target === 'object' && target ? (target.employee_code || target.id) : target;
        setViewingProfileCode(code);

        // Pre-populate immediately if we already have partial profile details
        if (typeof target === 'object' && target) {
            setViewingProfileData({
                info: {
                    name: target.name,
                    email: target.email,
                    phone: target.phone,
                    role: target.role_name || target.role,
                    role_display: target.role_display || target.role_name,
                    profile_picture: target.profile_picture,
                    employee_code: target.employee_code,
                    department_name: target.department_name,
                    status: target.status || 'Active',
                    last_activity: target.last_activity,
                    is_online: target.is_online
                }
            });
        } else {
            setViewingProfileData(null);
        }

        setLoadingProfile(true);
        try {
            const res = await axios.get(`${API_URL}api/admin/staff/get_staff_profile.php?employee_code=${encodeURIComponent(code)}`);
            if (res.data.status === 'success' && res.data.data) {
                setViewingProfileData(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching staff profile:', err);
        } finally {
            setLoadingProfile(false);
        }
    };

    // 5. Load contacts list for starting a new chat
    const loadContacts = async () => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_chat_users.php`, {
                user_id: currentUser.id
            });
            if (res.data.status === 'success') {
                setContacts(res.data.users || []);
            }
        } catch (err) {
            console.error('Error loading contacts', err);
        }
    };

    // 6. Load admin list for quick-contact feature
    const loadAdmins = async () => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/get_chat_users.php`, {
                user_id: currentUser.id,
                admins_only: true
            });
            if (res.data.status === 'success') {
                setAdmins(res.data.users || []);
            }
        } catch (err) {
            console.error('Error loading admins', err);
        }
    };

    // 7. Click admin → open existing chat OR show pending chat window
    const handleContactAdmin = async (admin) => {
        const existingChat = chats.find(chat => {
            if (chat.type !== 'direct') return false;
            return chat.participants && chat.participants.some(p => p.id === admin.id);
        });

        if (existingChat) {
            setActiveChat(existingChat);
            setPendingChatTarget(null);
        } else {
            setActiveChat(null);
            setPendingChatTarget(admin);
            setMessages([]);
        }
    };

    // 8. Send a message (text, file, or edit existing)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const hasContent = typedMessage.trim() || selectedFile;
        if (!hasContent) return;
        if (!activeChat && !pendingChatTarget) return;
        if (isSending) return;

        setIsSending(true);
        try {
            let chatId = activeChat?.id;

            // If this is a pending chat (no room yet), create the room first
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
                await fetchChats(chatId);
                fetchMessages(activeChat.id);
            }
        } catch (err) {
            console.error('Error sending message', err);
        } finally {
            setIsSending(false);
        }
    };

    // 9. Download an image file
    const handleDownloadImage = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = url.substring(url.lastIndexOf('/') + 1);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error downloading image', err);
            window.open(url, '_blank');
        }
    };

    // 10. Delete a message
    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;
        try {
            const res = await axios.post(`${API_URL}api/chat/delete_message.php`, {
                message_id: messageToDelete,
                user_id: currentUser.id
            });
            if (res.data.status === 'success') {
                setMessageToDelete(null);
                fetchMessages(activeChat.id);
            }
        } catch (err) {
            console.error('Error deleting message', err);
        } finally {
            setMessageToDelete(null);
        }
    };

    // 11. Forward a message to users/chats
    const handleForwardMessage = async () => {
        if (!forwardingMessage) return;
        const { users, chats } = forwardSelectedTargets;
        if (users.length === 0 && chats.length === 0) return;

        setIsForwarding(true);
        try {
            const res = await axios.post(`${API_URL}api/chat/forward_message.php`, {
                message_id: forwardingMessage.id,
                sender_id: currentUser.id,
                target_users: users,
                target_chats: chats
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
    };

    // 12. Toggle a user/chat in the forward targets list
    const toggleForwardTarget = (type, id) => {
        setForwardSelectedTargets(prev => {
            const targetArray = prev[type];
            if (targetArray.includes(id)) {
                return { ...prev, [type]: targetArray.filter(tId => tId !== id) };
            } else {
                return { ...prev, [type]: [...targetArray, id] };
            }
        });
    };

    // 13. Computed: filtered contacts/chats for the forward modal
    const filteredForwardContacts = contacts.filter(u =>
        u.id !== currentUser.id &&
        u.name.toLowerCase().includes(forwardSearchQuery.toLowerCase())
    );
    const filteredForwardChats = chats.filter(c =>
        c.name?.toLowerCase().includes(forwardSearchQuery.toLowerCase())
    );

    // 14. Create a new chat (one-to-one or group)
    const handleCreateChat = async () => {
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
    };

    // 15. Promote/demote/remove a group member
    const handleManageMember = async (action, targetUserId) => {
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
            console.error(err);
        }
    };

    // 16. Add new members to a group
    const handleAddMembers = async () => {
        if (selectedContacts.length === 0) return;
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
            console.error(err);
        }
    };

    // 17. Edit group name/picture
    const handleEditGroup = async (e) => {
        e.preventDefault();
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
            console.error(err);
        }
    };

    // 18. Handle typing — update input + push typing status (throttled)
    const lastTypedAtRef = useRef(0);
    const handleTyping = async (e) => {
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
                } catch (err) {
                    // Silent catch
                }
            }
        }
    };

    // ─── Helper functions & computed values ─────────────────────

    // Get the other participant in a direct chat
    const getDirectRecipient = (chat) => {
        if (chat.type !== 'direct') return null;
        return chat.participants.find(p => p.id !== currentUser.id) || null;
    };

    const getChatTitle = (chat) => {
        if (chat.type === 'group') return chat.name;
        const recipient = getDirectRecipient(chat);
        return recipient ? recipient.name : 'Unknown User';
    };

    const getChatSub = (chat) => {
        if (chat.type === 'group') return `${chat.participants.filter(p => p.status !== 'removed').length} Members`;
        const recipient = getDirectRecipient(chat);
        return recipient ? recipient.role_name : 'Staff';
    };

    const toggleContactSelection = (contactId) => {
        if (selectedContacts.includes(contactId)) {
            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        } else {
            setSelectedContacts([...selectedContacts, contactId]);
        }
    };

    // Filtered lists
    const filteredChats = chats.filter(chat => {
        const title = getChatTitle(chat).toLowerCase();
        return title.includes(searchChat.toLowerCase());
    });

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchContact.toLowerCase()) ||
        (contact.department_name && contact.department_name.toLowerCase().includes(searchContact.toLowerCase()))
    );

    // Open a direct chat from within group info panel
    const handleDirectMessage = (member) => {
        if (member.id === currentUser.id) return;
        const existingChat = chats.find(chat =>
            chat.type === 'direct' && chat.participants.some(p => p.id === member.id)
        );
        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            setActiveChat(null);
            setPendingChatTarget(member);
        }
        setIsGroupInfoOpen(false);
    };

    // Computed: current user's role in active group
    const amIAdmin = activeChat?.type === 'group'
        ? activeChat.participants.some(p => p.id === currentUser.id && p.is_admin == 1 && p.status !== 'removed')
        : false;

    const amIRemoved = activeChat?.type === 'group'
        ? activeChat.participants.some(p => p.id === currentUser.id && p.status === 'removed')
        : false;

    // DOM refs for scroll & file input
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return {
        chats, setChats,
        activeChat, setActiveChat,
        messages, setMessages,
        contacts, setContacts,
        admins, setAdmins,
        searchChat, setSearchChat,
        searchContact, setSearchContact,
        selectedContacts, setSelectedContacts,
        groupName, setGroupName,
        contactingAdmin, setContactingAdmin,
        pendingChatTarget, setPendingChatTarget,
        isNewChatModalOpen, setIsNewChatModalOpen,
        isGroupInfoOpen, setIsGroupInfoOpen,
        isAddMemberModalOpen, setIsAddMemberModalOpen,
        isEditGroupModalOpen, setIsEditGroupModalOpen,
        editGroupName, setEditGroupName,
        editGroupFile, setEditGroupFile,
        memberSearchQuery, setMemberSearchQuery,
        selectedMiniProfile, setSelectedMiniProfile,
        userToRemove, setUserToRemove,
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
        viewingProfileCode, setViewingProfileCode,
        viewingProfileData, setViewingProfileData,
        loadingProfile, setLoadingProfile,
        // Functions
        fetchChats,
        fetchMessages,
        handleReact,
        handleViewProfile,
        loadContacts,
        loadAdmins,
        handleContactAdmin,
        handleSendMessage,
        handleDownloadImage,
        handleDeleteMessage,
        handleForwardMessage,
        toggleForwardTarget,
        filteredForwardContacts,
        filteredForwardChats,
        handleCreateChat,
        handleManageMember,
        handleAddMembers,
        handleEditGroup,
        handleTyping,
        // Helpers & computed
        getDirectRecipient,
        getChatTitle,
        getChatSub,
        toggleContactSelection,
        filteredChats,
        filteredContacts,
        handleDirectMessage,
        amIAdmin,
        amIRemoved,
        scrollToBottom,
        messagesEndRef,
        fileInputRef,
        currentUser,
        API_URL,
    };
};

export default useMessages;
