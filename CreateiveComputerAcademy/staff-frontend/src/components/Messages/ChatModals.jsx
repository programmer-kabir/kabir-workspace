import React from 'react';
import NewChatModal from './NewChatModal';
import ForwardMessageModal from './ForwardMessageModal';
import GroupInfoSidebar from './GroupInfoSidebar';
import MiniProfileModal from './MiniProfileModal';
import DeleteModal from './DeleteModal';
import AddMemberModal from './AddMemberModal';
import EditGroupModal from './EditGroupModal';
import MessageInfoModal from './MessageInfoModal';
import LightboxModal from './LightboxModal';
import FullProfileModal from './FullProfileModal';

/**
 * ChatModals: Bundles all floating modals and sidebars for the Chat Terminal
 */
const ChatModals = ({
  // New Chat Modal
  isNewChatModalOpen,
  setIsNewChatModalOpen,
  selectedContacts,
  setSelectedContacts,
  groupName,
  setGroupName,
  searchContact,
  setSearchContact,
  filteredContacts,
  toggleContactSelection,
  handleCreateChat,
  API_URL,

  // Lightbox Modal
  lightboxImage,
  setLightboxImage,

  // Message Info Modal
  infoMessage,
  setInfoMessage,

  // Delete Modal
  messageToDelete,
  setMessageToDelete,
  handleDeleteMessage,
  userToRemove,
  setUserToRemove,
  handleManageMember,

  // Forward Modal
  forwardModalOpen,
  setForwardModalOpen,
  forwardSearchQuery,
  setForwardSearchQuery,
  filteredForwardChats,
  filteredForwardContacts,
  forwardSelectedTargets,
  toggleForwardTarget,
  contacts,
  handleForwardMessage,
  isForwarding,

  // Group Info Sidebar
  isGroupInfoOpen,
  setIsGroupInfoOpen,
  activeChat,
  setSelectedMiniProfile,
  setMemberSearchQuery,
  memberSearchQuery,
  amIAdmin,
  setEditGroupName,
  setEditGroupFile,
  setIsEditGroupModalOpen,
  setIsAddMemberModalOpen,
  currentUser,

  // Mini Profile Modal
  selectedMiniProfile,
  handleDirectMessage,
  handleViewProfile,

  // Add Member Modal
  isAddMemberModalOpen,
  handleAddMembers,

  // Edit Group Modal
  isEditGroupModalOpen,
  handleEditGroup,
  editGroupFile,
  editGroupName,

  // Full Profile Modal
  viewingProfileCode,
  setViewingProfileCode,
  viewingProfileData,
  loadingProfile,
}) => {
  return (
    <>
      {/* 1. New Chat / Group Modal */}
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

      {/* 2. Lightbox for Images */}
      <LightboxModal
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
        API_URL={API_URL}
      />

      {/* 3. Message Info Modal */}
      <MessageInfoModal
        infoMessage={infoMessage}
        setInfoMessage={setInfoMessage}
      />

      {/* 4. Delete Confirmation Modals */}
      <DeleteModal
        messageToDelete={messageToDelete}
        setMessageToDelete={setMessageToDelete}
        handleDeleteMessage={handleDeleteMessage}
        userToRemove={userToRemove}
        setUserToRemove={setUserToRemove}
        handleManageMember={handleManageMember}
      />

      {/* 5. Forward Modal */}
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

      {/* 6. Group Info Sidebar */}
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

      {/* 7. Mini Profile Modal */}
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

      {/* 8. Add Members Modal */}
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

      {/* 9. Edit Group Modal */}
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

      {/* 10. Full Staff Profile Modal */}
      <FullProfileModal
        viewingProfileCode={viewingProfileCode}
        setViewingProfileCode={setViewingProfileCode}
        viewingProfileData={viewingProfileData}
        loadingProfile={loadingProfile}
        API_URL={API_URL}
      />
    </>
  );
};

export default ChatModals;
