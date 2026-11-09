import React, { useRef } from 'react';
import { FiUser, FiBriefcase, FiEdit, FiCamera, FiImage } from 'react-icons/fi';

/**
 * ProfileHeaderBanner
 * Top cover, avatar, employee title badges, and quick action buttons.
 */
export default function ProfileHeaderBanner({
  currentUser,
  apiUrl,
  onOpenModal,
  onSelectImageFile,
}) {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImageFile(file, 'profile');
      e.target.value = '';
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImageFile(file, 'cover');
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden relative transition-colors">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

      {/* Header / Cover */}
      <div className="relative h-72 lg:h-80 w-full group overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: currentUser?.cover_picture
              ? `url(${apiUrl}${currentUser.cover_picture})`
              : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        {/* Change Cover Photo floating button on hover */}
        <div className="absolute top-6 right-6 z-20">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/70 hover:bg-slate-900/90 text-white rounded-xl text-xs font-bold backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
            title="Change cover photo"
          >
            <FiCamera size={14} />
            <span className="hidden sm:inline">Change Cover</span>
          </button>
        </div>
      </div>

      {/* Profile Info Overlay */}
      <div className="relative px-8 lg:px-12 pb-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end -mt-24 relative z-10">
          
          {/* Avatar with Interactive Camera Overlay */}
          <div className="relative group/avatar">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="w-40 h-40 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 rotate-[-2deg] transition-all group-hover/avatar:rotate-0 duration-300 relative overflow-hidden">
              {currentUser?.profile_picture ? (
                <img
                  src={`${apiUrl}${currentUser.profile_picture}`}
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-300 font-black text-6xl uppercase shadow-inner">
                  {currentUser?.name?.charAt(0)}
                </div>
              )}

              {/* Hover / Click Camera Button overlay */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-2 bg-slate-950/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold gap-1 transition-all backdrop-blur-xs cursor-pointer"
                title="Change profile photo"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                  <FiCamera size={18} />
                </div>
                <span>Change Photo</span>
              </button>
            </div>
          </div>

          {/* Name & Role */}
          <div className="flex-1 mb-2 lg:mb-6">
            <h1
              className="text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentUser?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 px-4 py-1.5 rounded-full text-sm shadow-sm border border-slate-200 dark:border-slate-600 backdrop-blur-md">
                <FiUser className="text-slate-500 dark:text-slate-400" size={16} />
                {currentUser?.role_name || 'Staff Member'}
              </span>
              {currentUser?.department_name && (
                <span className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 px-4 py-1.5 rounded-full text-sm shadow-sm border border-slate-200 dark:border-slate-600 backdrop-blur-md">
                  <FiBriefcase className="text-slate-500 dark:text-slate-400" size={16} />
                  {currentUser.department_name}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-2 lg:mb-6">
            <button
              type="button"
              onClick={() => onOpenModal('profile')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-xl font-bold backdrop-blur-md border border-slate-200 dark:border-white/20 transition-all shadow-sm cursor-pointer"
            >
              <FiEdit size={18} /> Edit Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

