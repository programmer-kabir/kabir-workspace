import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiMessageSquare, FiImage, FiUser, FiPaperclip, FiSend, FiX, FiCheck, FiMoreVertical, FiDownload, FiUsers, FiInfo, FiTrash2, FiUserPlus, FiPlus, FiFile, FiEdit2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import useMessages from '../components/Messages/useMessages';
import ChatSidebar from '../components/Messages/ChatSidebar';
import MessageBubble from '../components/Messages/MessageBubble';
import MessageInput from '../components/Messages/MessageInput';
import ChatHeader from '../components/Messages/ChatHeader';
import NewChatModal from '../components/Messages/NewChatModal';
import ForwardMessageModal from '../components/Messages/ForwardMessageModal';
import GroupInfoSidebar from '../components/Messages/GroupInfoSidebar';
import MiniProfileModal from '../components/Messages/MiniProfileModal';
import DeleteModal from '../components/Messages/DeleteModal';
import AddMemberModal from '../components/Messages/AddMemberModal';
import EditGroupModal from '../components/Messages/EditGroupModal';
import MessageInfoModal from '../components/Messages/MessageInfoModal';
import LightboxModal from '../components/Messages/LightboxModal';
import FullProfileModal from '../components/Messages/FullProfileModal';
import PendingChatView from '../components/Messages/PendingChatView';
import { ChatBgProvider, useChatBg } from '../context/ChatBgContext';

// Inner component that consumes ChatBgContext
const MessagesInner = () => {
  const { getChatBg, isPinned } = useChatBg();
  const navigate = useNavigate();
  const {
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
  } = useMessages();


  // Initial loads and polling interval
  useEffect(() => {
    fetchChats();
    loadContacts();
    loadAdmins();

    const chatInterval = setInterval(() => {
      fetchChats();
      loadAdmins(); // Refresh admin online status too
    }, 4000);

    return () => clearInterval(chatInterval);
  }, [currentUser]);

  // Messages load and polling when active chat changes
  const prevChatIdRef = useRef(null);

  useEffect(() => {
    if (activeChat) {
      if (prevChatIdRef.current !== activeChat.id) {
        setLoadingMessages(true);
      }
      prevChatIdRef.current = activeChat.id;

      fetchMessages(activeChat.id).then(() => {
        setLoadingMessages(false);
        scrollToBottom();
      });

      const messageInterval = setInterval(() => {
        fetchMessages(activeChat.id);
      }, 4000);

      return () => clearInterval(messageInterval);
    } else {
      setMessages([]);
      prevChatIdRef.current = null;
      prevMessagesLengthRef.current = 0;
    }
  }, [activeChat]);

  // Keep scrolled to bottom when messages list increases
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (messages.length !== prevMessagesLengthRef.current) {
      if (messages.length > prevMessagesLengthRef.current || prevMessagesLengthRef.current === 0) {
        scrollToBottom();
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);


  // Fast typing status polling (1000ms)
  useEffect(() => {
    if (activeChat && activeChat.id) {
      const typingInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}api/chat/check_typing.php?chat_id=${activeChat.id}&user_id=${currentUser.id}`);
          if (res.data.status === 'success') {
            setTypingUsers(res.data.typing_users);
          }
        } catch (err) {
          // Silent catch
        }
      }, 1000);
      return () => clearInterval(typingInterval);
    } else {
      setTypingUsers([]);
    }
  }, [activeChat, currentUser]);


  return (
    <div className="flex h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative">

      {/* 1. LEFT SIDEBAR: Chat List */}
      <ChatSidebar
        activeChat={activeChat}
        admins={admins}
        contactingAdmin={contactingAdmin}
        handleContactAdmin={handleContactAdmin}
        searchChat={searchChat}
        setSearchChat={setSearchChat}
        loadingChats={loadingChats}
        filteredChats={[...filteredChats].sort((a, b) => (isPinned(b.id) ? 1 : 0) - (isPinned(a.id) ? 1 : 0))}
        isPinned={isPinned}
        getDirectRecipient={getDirectRecipient}
        getChatTitle={getChatTitle}
        getChatSub={getChatSub}
        setActiveChat={setActiveChat}
        setIsNewChatModalOpen={setIsNewChatModalOpen}
        API_URL={API_URL}
      />

      {/* 2. RIGHT CHAT WINDOW: Message History */}
      <div className="flex-1 bg-transparent flex flex-col h-full overflow-hidden relative min-w-0">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              getDirectRecipient={getDirectRecipient}
              getChatTitle={getChatTitle}
              API_URL={API_URL}
              setIsGroupInfoOpen={setIsGroupInfoOpen}
              getChatSub={getChatSub}
              setSelectedMiniProfile={setSelectedMiniProfile}
              currentUser={currentUser}
              messages={messages}
              handleReact={handleReact}
              fetchMessages={fetchMessages}
              fetchChats={fetchChats}
            />

            {/* Messages logs area — dynamic background */}
            <div
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar min-h-0 transition-all duration-500"
              style={getChatBg(activeChat?.id)?.style || { background: undefined }}
            >
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center text-2xl shadow-inner mb-3">
                    👋
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Say Hello!</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">Start the conversation by typing your first message below.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageBubble
                    key={`msg-${msg.id || 'temp'}-${index}`}
                    msg={msg}
                    index={index}
                    currentUser={currentUser}
                    activeChat={activeChat}
                    API_URL={API_URL}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    showEmojiPickerId={showEmojiPickerId}
                    setShowEmojiPickerId={setShowEmojiPickerId}
                    emojis={emojis}
                    handleReact={handleReact}
                    setReplyingTo={setReplyingTo}
                    setForwardingMessage={setForwardingMessage}
                    setForwardModalOpen={setForwardModalOpen}
                    setForwardSelectedTargets={setForwardSelectedTargets}
                    setForwardSearchQuery={setForwardSearchQuery}
                    setEditingMessage={setEditingMessage}
                    setTypedMessage={setTypedMessage}
                    setInfoMessage={setInfoMessage}
                    setMessageToDelete={setMessageToDelete}
                    setLightboxImage={setLightboxImage}
                  />
                ))
              )}

              {/* Smart Typing Indicator UI */}
              {!amIRemoved && typingUsers.length > 0 && (
                <div className="flex items-center gap-2 p-2 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-2 flex items-center gap-1 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic">
                    {typingUsers.length === 1
                      ? `${typingUsers[0].name} is typing...`
                      : typingUsers.length === 2
                        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                        : `${typingUsers[0].name}, ${typingUsers[1].name} and ${typingUsers.length - 2} others are typing...`
                    }
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <MessageInput
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingMessage={editingMessage}
              setEditingMessage={setEditingMessage}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              amIRemoved={amIRemoved}
              handleSendMessage={handleSendMessage}
              fileInputRef={fileInputRef}
              typedMessage={typedMessage}
              setTypedMessage={setTypedMessage}
              handleTyping={handleTyping}
              showEmojiPickerId={showEmojiPickerId}
              setShowEmojiPickerId={setShowEmojiPickerId}
              emojis={emojis}
              isSending={isSending}
              messages={messages}
              currentUser={currentUser}
              handleReact={handleReact}
              activeChat={activeChat}
            />
          </>
        ) : pendingChatTarget ? (
          <PendingChatView
            pendingChatTarget={pendingChatTarget}
            API_URL={API_URL}
            fileInputRef={fileInputRef}
            setSelectedFile={setSelectedFile}
            selectedFile={selectedFile}
            typedMessage={typedMessage}
            setTypedMessage={setTypedMessage}
            handleSendMessage={handleSendMessage}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center text-3xl shadow-inner mb-4">
              💬
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">CCA Chat Terminal</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-[280px] leading-relaxed font-semibold">
              Select a conversation from the left sidebar to read, write, or share documents. Click the "+" button to start a new chat.
            </p>
          </div>
        )}
      </div>

      {/* 3. NEW CHAT / GROUP MODAL */}
      <NewChatModal
        isNewChatModalOpen={isNewChatModalOpen}
        setIsNewChatModalOpen={setIsNewChatModalOpen}
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
        groupName={groupName}
        setGroupName={setGroupName}
        searchContact={searchContact}
        setSearchContact={setSearchContact}
        filteredContacts={filteredContacts}
        toggleContactSelection={toggleContactSelection}
        handleCreateChat={handleCreateChat}
        API_URL={API_URL}
      />

      {/* Lightbox for Images */}
      <LightboxModal
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
        API_URL={API_URL}
      />

      {/* 4. MESSAGE INFO MODAL */}
      <MessageInfoModal
        infoMessage={infoMessage}
        setInfoMessage={setInfoMessage}
      />

      {/* 5. DELETE CONFIRMATION MODALS */}
      <DeleteModal
        messageToDelete={messageToDelete}
        setMessageToDelete={setMessageToDelete}
        handleDeleteMessage={handleDeleteMessage}
        userToRemove={userToRemove}
        setUserToRemove={setUserToRemove}
        handleManageMember={handleManageMember}
      />

      {/* 6. FORWARD MODAL */}
      <ForwardMessageModal
        forwardModalOpen={forwardModalOpen}
        setForwardModalOpen={setForwardModalOpen}
        forwardSearchQuery={forwardSearchQuery}
        setForwardSearchQuery={setForwardSearchQuery}
        filteredForwardChats={filteredForwardChats}
        filteredForwardContacts={filteredForwardContacts}
        forwardSelectedTargets={forwardSelectedTargets}
        toggleForwardTarget={toggleForwardTarget}
        contacts={contacts}
        API_URL={API_URL}
        handleForwardMessage={handleForwardMessage}
        isForwarding={isForwarding}
      />

      {/* Group Info Sidebar */}
      <GroupInfoSidebar
        isGroupInfoOpen={isGroupInfoOpen}
        setIsGroupInfoOpen={setIsGroupInfoOpen}
        activeChat={activeChat}
        setSelectedMiniProfile={setSelectedMiniProfile}
        setMemberSearchQuery={setMemberSearchQuery}
        memberSearchQuery={memberSearchQuery}
        API_URL={API_URL}
        amIAdmin={amIAdmin}
        setEditGroupName={setEditGroupName}
        setEditGroupFile={setEditGroupFile}
        setIsEditGroupModalOpen={setIsEditGroupModalOpen}
        setIsAddMemberModalOpen={setIsAddMemberModalOpen}
        currentUser={currentUser}
      />

      {/* Mini Profile Modal */}
      <MiniProfileModal
        selectedMiniProfile={selectedMiniProfile}
        setSelectedMiniProfile={setSelectedMiniProfile}
        API_URL={API_URL}
        amIAdmin={amIAdmin}
        currentUser={currentUser}
        handleManageMember={handleManageMember}
        setUserToRemove={setUserToRemove}
        handleDirectMessage={handleDirectMessage}
        handleViewProfile={handleViewProfile}
      />



      {/* Add Members Modal */}
      <AddMemberModal
        isAddMemberModalOpen={isAddMemberModalOpen}
        setIsAddMemberModalOpen={setIsAddMemberModalOpen}
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
        searchContact={searchContact}
        setSearchContact={setSearchContact}
        contacts={contacts}
        activeChat={activeChat}
        toggleContactSelection={toggleContactSelection}
        API_URL={API_URL}
        handleAddMembers={handleAddMembers}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        isEditGroupModalOpen={isEditGroupModalOpen}
        setIsEditGroupModalOpen={setIsEditGroupModalOpen}
        handleEditGroup={handleEditGroup}
        editGroupFile={editGroupFile}
        setEditGroupFile={setEditGroupFile}
        activeChat={activeChat}
        API_URL={API_URL}
        editGroupName={editGroupName}
        setEditGroupName={setEditGroupName}
      />

      {/* Full Staff Profile Modal */}
      <FullProfileModal
        viewingProfileCode={viewingProfileCode}
        setViewingProfileCode={setViewingProfileCode}
        viewingProfileData={viewingProfileData}
        loadingProfile={loadingProfile}
        API_URL={API_URL}
      />

    </div>
  );
};

// Outer wrapper with ChatBgProvider
const Messages = () => (
  <ChatBgProvider>
    <MessagesInner />
  </ChatBgProvider>
);

export default Messages;
