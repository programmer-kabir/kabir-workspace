import React, { useRef } from 'react';
import { FiUser, FiBriefcase, FiEdit, FiCamera, FiBookOpen } from 'react-icons/fi';

/**
 * ProfileHeaderBanner
 * Generous height cover banner with avatar sitting in the middle of the bottom border line (Facebook/Twitter hero style),
 * featuring crisp typography, glassmorphism badges, and quick action buttons.
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
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700/80 overflow-hidden relative transition-colors">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/40 dark:from-blue-900/10 to-transparent pointer-events-none" />

      {/* ── 1. EXPANDED PANORAMIC COVER PICTURE (TALL FOR FULL VIEW) ── */}
      <div className="relative h-80 sm:h-96 lg:h-[410px] w-full group overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
          style={{
            backgroundImage: currentUser?.cover_picture
              ? `url(${apiUrl}${currentUser.cover_picture})`
              : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
          }}
        />
        {/* Cinematic gradient overlay at bottom of cover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

        {/* Change Cover Photo floating button on top right */}
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
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/70 hover:bg-slate-900/90 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer active:scale-95"
            title="Change cover photo"
          >
            <FiCamera size={14} className="text-white/90" />
            <span className="hidden sm:inline">Change Cover</span>
          </button>
        </div>
      </div>

      {/* ── 2. PROFILE INFO SECTION (AVATAR IN THE MIDDLE OF THE LINE) ── */}
      <div className="relative px-6 sm:px-10 lg:px-12 pb-7">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start lg:items-end -mt-20 sm:-mt-24 lg:-mt-28 relative z-10 justify-between">
          
          {/* Left: Avatar + Name + Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 sm:gap-7 flex-1">
            
            {/* Avatar centered on boundary line (half on cover, half below) */}
            <div className="relative group/avatar shrink-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl ring-4 ring-white dark:ring-slate-800 transition-all duration-300 group-hover/avatar:scale-[1.02] relative overflow-hidden">
                {currentUser?.profile_picture ? (
                  <img
                    src={`${apiUrl}${currentUser.profile_picture}`}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-2xl shadow-inner"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-6xl uppercase shadow-inner">
                    {currentUser?.name?.charAt(0)}
                  </div>
                )}

                {/* Hover Camera Overlay Button */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-2 bg-slate-950/70 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold gap-1.5 transition-all duration-200 backdrop-blur-xs cursor-pointer"
                  title="Change profile photo"
                >
                  <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center shadow-lg">
                    <FiCamera size={18} />
                  </div>
                  <span>Change Photo</span>
                </button>
              </div>
            </div>

            {/* Name & Badges */}
            <div className="space-y-3 pb-1">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white lg:text-white lg:drop-shadow-xl tracking-tight transition-colors"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {currentUser?.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/80 px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-xs border border-slate-200 dark:border-slate-600 transition-colors">
                  <FiUser className="text-slate-500 dark:text-slate-400" size={15} />
                  {currentUser?.role_name || 'Staff Member'}
                </span>

                {currentUser?.department_name && (
                  <span className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/80 px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-xs border border-slate-200 dark:border-slate-600 transition-colors">
                    <FiBriefcase className="text-slate-500 dark:text-slate-400" size={15} />
                    {currentUser.department_name}
                  </span>
                )}

                {Boolean(currentUser?.is_student) && (
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-xs border border-emerald-200 dark:border-emerald-800 transition-colors">
                    <FiBookOpen className="text-emerald-600 dark:text-emerald-400" size={15} />
                    <span>
                      {currentUser?.institution_type || 'Student'}
                      {currentUser?.student_institution ? ` • ${currentUser.student_institution}` : ''}
                    </span>
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Right: Edit Profile Button */}
          <div className="shrink-0 pb-1 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => onOpenModal('profile')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-2xl font-bold border border-slate-200 dark:border-slate-600 transition-all shadow-sm hover:shadow-md cursor-pointer text-sm active:scale-95"
            >
              <FiEdit size={16} /> Edit Profile
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
