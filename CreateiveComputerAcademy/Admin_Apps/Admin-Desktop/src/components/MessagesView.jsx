import React from 'react';
import ChatSidebar from './Message/ChatSidebar';
import { useMessages } from '../hooks/useMessages';
import ChatHeader from './Message/ChatHeader';
import ChatInput from './Message/ChatInput';
import MessageList from './Message/MessageList';
import TypingIndicator from './Message/TypingIndicator';
import NewChatModal from './Modals/NewChatModal';
import ForwardModal from './Modals/ForwardModal';
import DeleteMessageModal from './Modals/DeleteMessageModal';
import ImageLightbox from './Modals/ImageLightbox';
import GroupInfoDrawer from './Modals/GroupInfoDrawer';
import MessageInfoModal from './Modals/MessageInfoModal';

const MessagesView = ({ setActiveTab }) => {
  // Active state lists from useMessages hook
  const {
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
    emojis, currentUser,
    API_URL,
    messagesEndRef,
    fileInputRef,
    fetchChats, fetchMessages,
    handleReact, loadContacts,
    handleSendMessage, handleTyping, scrollToBottom,
    handleForwardMessage, toggleForwardTarget,
    filteredForwardContacts, filteredForwardChats,
    handleDeleteMessage, handleCreateChat,
    getDirectRecipient, getChatTitle,
    getChatSub, toggleContactSelection,
    filteredChats, filteredContacts, handleDirectMessage,
    amIAdmin, amIRemoved,
    handleManageMember, handleAddMembers, handleEditGroup,
  } = useMessages();

  return (
    <div className="relative h-[calc(100vh-140px)] w-full bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex shadow-sm animate-in fade-in duration-300">

      {/* 1. LEFT SIDEBAR: Chats list */}
      <ChatSidebar
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        loadingChats={loadingChats}
        searchChat={searchChat}
        setSearchChat={setSearchChat}
        setIsNewChatModalOpen={setIsNewChatModalOpen}
        getChatTitle={getChatTitle}
        getDirectRecipient={getDirectRecipient}
        getChatSub={getChatSub}
        filteredChats={filteredChats}
        API_URL={API_URL}
      />

      {/* 2. RIGHT CHAT WINDOW: Message History */}
      <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col h-full overflow-hidden relative">
        {activeChat ? (
          <>
            <ChatHeader
              API_URL={API_URL}
              activeChat={activeChat}
              getChatTitle={getChatTitle}
              getDirectRecipient={getDirectRecipient}
              getChatSub={getChatSub}
              setIsGroupInfoOpen={setIsGroupInfoOpen}
            />

            {/* Messages logs area */}
            <MessageList
              loadingMessages={loadingMessages}
              messages={messages}
              currentUser={currentUser}
              activeChat={activeChat}
              API_URL={API_URL}
              emojis={emojis}
              handleReact={handleReact}
              setReplyingTo={setReplyingTo}
              setEditingMessage={setEditingMessage}
              setTypedMessage={setTypedMessage}
              setForwardingMessage={setForwardingMessage}
              setForwardModalOpen={setForwardModalOpen}
              setForwardSelectedTargets={setForwardSelectedTargets}
              setForwardSearchQuery={setForwardSearchQuery}
              setInfoMessage={setInfoMessage}
              setMessageToDelete={setMessageToDelete}
              setLightboxImage={setLightboxImage}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              showEmojiPickerId={showEmojiPickerId}
              setShowEmojiPickerId={setShowEmojiPickerId}
              typingUsers={typingUsers}
              amIRemoved={amIRemoved}
              messagesEndRef={messagesEndRef}
            />

            {/* Input area */}
            <ChatInput
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingMessage={editingMessage}
              setEditingMessage={setEditingMessage}
              setTypedMessage={setTypedMessage}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              fileInputRef={fileInputRef}
              amIRemoved={amIRemoved}
              handleSendMessage={handleSendMessage}
              handleTyping={handleTyping}
              isSending={isSending}
              typedMessage={typedMessage}
              API_URL={API_URL}
            />
          </>
        ) : (
          <TypingIndicator />
        )}
      </div>

      {/* 3. NEW CHAT / GROUP MODAL */}
      {isNewChatModalOpen && (
        <NewChatModal
          API_URL={API_URL}
          setIsNewChatModalOpen={setIsNewChatModalOpen}
          selectedContacts={selectedContacts}
          setSelectedContacts={setSelectedContacts}
          searchContact={searchContact}
          setSearchContact={setSearchContact}
          filteredContacts={filteredContacts}
          toggleContactSelection={toggleContactSelection}
          groupName={groupName}
          setGroupName={setGroupName}
          handleCreateChat={handleCreateChat}
        />
      )}

      {/* 4. LIGHTBOX PREVIEW MODAL */}
      {lightboxImage && (
        <ImageLightbox setLightboxImage={setLightboxImage} lightboxImage={lightboxImage} API_URL={API_URL} />
      )}

      {/* 5. MESSAGE INFO MODAL */}
      {infoMessage && (
        <MessageInfoModal setInfoMessage={setInfoMessage} infoMessage={infoMessage} />
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {messageToDelete && (
        <DeleteMessageModal handleDeleteMessage={handleDeleteMessage} setMessageToDelete={setMessageToDelete} />
      )}

      {/* 7. FORWARD MODAL */}
      {forwardModalOpen && (
        <ForwardModal
          setForwardModalOpen={setForwardModalOpen}
          handleForwardMessage={handleForwardMessage}
          forwardSelectedTargets={forwardSelectedTargets}
          toggleForwardTarget={toggleForwardTarget}
          forwardSearchQuery={forwardSearchQuery}
          setForwardSearchQuery={setForwardSearchQuery}
          filteredForwardChats={filteredForwardChats}
          filteredForwardContacts={filteredForwardContacts}
          contacts={contacts}
          API_URL={API_URL}
          isForwarding={isForwarding}
        />
      )}

      {/* 8. Group Info Drawer & Modals */}
      <GroupInfoDrawer
        isGroupInfoOpen={isGroupInfoOpen}
        setIsGroupInfoOpen={setIsGroupInfoOpen}
        activeChat={activeChat}
        amIAdmin={amIAdmin}
        currentUser={currentUser}
        API_URL={API_URL}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        selectedMiniProfile={selectedMiniProfile}
        setSelectedMiniProfile={setSelectedMiniProfile}
        userToRemove={userToRemove}
        setUserToRemove={setUserToRemove}
        isAddMemberModalOpen={isAddMemberModalOpen}
        setIsAddMemberModalOpen={setIsAddMemberModalOpen}
        isEditGroupModalOpen={isEditGroupModalOpen}
        setIsEditGroupModalOpen={setIsEditGroupModalOpen}
        editGroupName={editGroupName}
        setEditGroupName={setEditGroupName}
        editGroupFile={editGroupFile}
        setEditGroupFile={setEditGroupFile}
        searchContact={searchContact}
        setSearchContact={setSearchContact}
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
        contacts={contacts}
        toggleContactSelection={toggleContactSelection}
        handleManageMember={handleManageMember}
        handleAddMembers={handleAddMembers}
        handleEditGroup={handleEditGroup}
        handleDirectMessage={handleDirectMessage}
        setActiveTab={setActiveTab}
      />

    </div>
  );
};

export default MessagesView;
