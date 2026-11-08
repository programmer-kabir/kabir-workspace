import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';

import CommunityHeaderBanner from '../components/Community/CommunityHeaderBanner.jsx';
import CommunityFilterBar from '../components/Community/CommunityFilterBar.jsx';
import CommunityPostComposer from '../components/Community/CommunityPostComposer.jsx';
import CommunityPostCard from '../components/Community/CommunityPostCard.jsx';
import CommunityLightboxModal from '../components/Community/CommunityLightboxModal.jsx';
import useCommunityFeed from '../components/Community/useCommunityFeed.js';
import useCommunityMentions from '../components/Community/useCommunityMentions.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function CommunityFeed() {
  const { currentUser } = useAuth();

  // Local Composer & Comments Form States
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Feed Actions & Realtime State Hook
  const {
    posts,
    loading,
    hasMore,
    page,
    selectedCategory,
    setSelectedCategory,
    activeFilter,
    setActiveFilter,
    imageFile,
    imagePreview,
    isSubmitting,
    submittingComment,
    fileInputRef,
    fetchFeed,
    handleImageSelect,
    removeImage,
    handleCreatePost,
    handleToggleLike,
    handleAddComment,
    handleDeletePost
  } = useCommunityFeed({ currentUser, apiBase: API_BASE });

  // Mention Autocomplete Hook
  const {
    mentionState,
    filteredMentionUsers,
    selectedMentionIdx,
    handleContentChange,
    handleCommentInputChange,
    handleSelectMention,
    handleMentionKeyDown
  } = useCommunityMentions({
    content,
    setContent,
    commentInputs,
    setCommentInputs,
    apiBase: API_BASE
  });

  const currentAvatar = currentUser?.profile_picture
    ? `${API_BASE}${currentUser.profile_picture}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Staff')}&background=0D8ABC&color=fff`;

  return (
    <div className="mx-auto space-y-6 animate-fadeIn pb-16 select-text">
      {/* 1. Header Banner */}
      <CommunityHeaderBanner onRefresh={() => fetchFeed(1, false)} loading={loading} />

      {/* 2. Post Composer Card */}
      <CommunityPostComposer
        currentUser={currentUser}
        currentAvatar={currentAvatar}
        content={content}
        setContent={setContent}
        postCategory={postCategory}
        setPostCategory={setPostCategory}
        imagePreview={imagePreview}
        imageFile={imageFile}
        isSubmitting={isSubmitting}
        fileInputRef={fileInputRef}
        handleContentChange={handleContentChange}
        handleMentionKeyDown={handleMentionKeyDown}
        handleImageSelect={handleImageSelect}
        removeImage={removeImage}
        handleCreatePost={(e) => handleCreatePost(e, content, postCategory, () => {
          setContent('');
          setPostCategory('General');
        })}
        mentionState={mentionState}
        filteredMentionUsers={filteredMentionUsers}
        selectedMentionIdx={selectedMentionIdx}
        handleSelectMention={handleSelectMention}
        apiBase={API_BASE}
      />

      {/* 3. Category Filter Chips & Tab Bar */}
      <CommunityFilterBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      {/* 4. Stream Feed Cards */}
      {loading && posts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <FiRefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading Community Wall...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 p-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center text-3xl mx-auto shadow-inner">
            📢
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">No Posts Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Be the first to share an achievement, update, or topic of discussion with your academy team!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              currentAvatar={currentAvatar}
              openComments={openComments}
              setOpenComments={setOpenComments}
              commentInputs={commentInputs}
              submittingComment={submittingComment}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              handleToggleLike={handleToggleLike}
              handleDeletePost={handleDeletePost}
              handleAddComment={(pId) => handleAddComment(pId, commentInputs[pId], () => {
                setCommentInputs(prev => ({ ...prev, [pId]: '' }));
              })}
              handleCommentInputChange={handleCommentInputChange}
              setLightboxImage={setLightboxImage}
              mentionState={mentionState}
              filteredMentionUsers={filteredMentionUsers}
              selectedMentionIdx={selectedMentionIdx}
              handleMentionKeyDown={handleMentionKeyDown}
              handleSelectMention={handleSelectMention}
              apiBase={API_BASE}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => fetchFeed(page + 1, true)}
                className="px-6 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer"
              >
                Load Older Posts ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      <CommunityLightboxModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
