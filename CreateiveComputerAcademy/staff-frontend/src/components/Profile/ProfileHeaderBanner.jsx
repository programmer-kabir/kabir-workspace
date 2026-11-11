import React, { useRef } from 'react';
import { FiUser, FiBriefcase, FiEdit, FiCamera, FiBookOpen } from 'react-icons/fi';

/**
 * ProfileHeaderBanner
 * Full-bleed panoramic cover banner with avatar, name, badges, and edit button
 * completely inside the image over a sleek gradient. No bottom white bar.
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
    <div className="relative rounded-[2.5rem] shadow-xl border border-slate-200/50 dark:border-slate-700/60 overflow-hidden group transition-all w-full min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] flex flex-col justify-end">
      
      {/* ── 1. 100% FULL-BLEED PANORAMIC COVER PICTURE (NO WHITE BAR) ── */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
        style={{
          backgroundImage: currentUser?.cover_picture
            ? `url(${apiUrl}${currentUser.cover_picture})`
            : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
        }}
      />

      {/* ── 2. CINEMATIC GRADIENT OVERLAYS (FOR 100% READABILITY) ── */}
      {/* Top subtle vignette for Change Cover button */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
      {/* Bottom deep smooth gradient so Name, Avatar, and Badges pop crisply */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent pointer-events-none" />

      {/* ── 3. FLOATING CHANGE COVER BUTTON (TOP RIGHT) ── */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20">
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
          className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-black/60 active:scale-95 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
          title="Change cover photo"
        >
          <FiCamera size={14} className="text-white/90" />
          <span className="hidden sm:inline">Change Cover</span>
        </button>
      </div>

      {/* ── 4. PROFILE INFO (INSIDE THE IMAGE AT THE BOTTOM) ── */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-7 items-start lg:items-end justify-between">
          
          {/* Left: Avatar + Name + Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 sm:gap-6 flex-1">
            
            {/* Avatar with Interactive Camera Overlay */}
            <div className="relative group/avatar shrink-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-3xl bg-white/20 dark:bg-slate-900/50 p-2 shadow-2xl backdrop-blur-md ring-2 ring-white/40 dark:ring-white/30 transition-all duration-300 group-hover/avatar:ring-white/70 relative overflow-hidden">
                {currentUser?.profile_picture ? (
                  <img
                    src={`${apiUrl}${currentUser.profile_picture}`}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-2xl shadow-inner"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-5xl uppercase shadow-inner">
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

            {/* Name & Badges — FULLY INSIDE THE IMAGE */}
            <div className="space-y-3 pb-1">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-2xl"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.75)' 
                }}
              >
                {currentUser?.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-white font-bold flex items-center gap-1.5 bg-black/40 hover:bg-black/55 px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-sm border border-white/20 backdrop-blur-md transition-colors">
                  <FiUser className="text-white/80" size={15} />
                  {currentUser?.role_name || 'Staff Member'}
                </span>

                {currentUser?.department_name && (
                  <span className="text-white font-bold flex items-center gap-1.5 bg-black/40 hover:bg-black/55 px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-sm border border-white/20 backdrop-blur-md transition-colors">
                    <FiBriefcase className="text-white/80" size={15} />
                    {currentUser.department_name}
                  </span>
                )}

                {Boolean(currentUser?.is_student) && (
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-950/90 px-3.5 py-1.5 rounded-full text-xs sm:text-sm shadow-sm border border-emerald-400/40 backdrop-blur-md transition-colors">
                    <FiBookOpen className="text-emerald-400" size={15} />
                    <span>
                      {currentUser?.institution_type || 'Student'}
                      {currentUser?.student_institution ? ` • ${currentUser.student_institution}` : ''}
                    </span>
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Right: Glassmorphism Edit Profile Button */}
          <div className="shrink-0 pb-1 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => onOpenModal('profile')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-2xl font-bold backdrop-blur-md border border-white/30 transition-all shadow-lg hover:shadow-xl cursor-pointer text-sm"
            >
              <FiEdit size={16} /> Edit Profile
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
