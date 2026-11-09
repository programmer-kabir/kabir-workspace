import React, { useRef } from 'react';
import { FiCheckCircle, FiImage, FiXCircle, FiCamera } from 'react-icons/fi';

/**
 * ProfileModalProfileTab
 * Tab for updating basic profile info and selecting pictures for crop/upload.
 */
export default function ProfileModalProfileTab({
  profileMessage,
  onSelectImageFile,
  username,
  setUsername,
  name,
  setName,
  phone,
  setPhone,
  profileLoading,
  onProfileUpdate,
}) {
  const profilePicRef = useRef(null);
  const coverPicRef = useRef(null);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {profileMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
            profileMessage.type === 'success' || profileMessage.type === 'info'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
          }`}
        >
          {profileMessage.type === 'success' ? (
            <FiCheckCircle className="mt-0.5 text-lg shrink-0" />
          ) : profileMessage.type === 'info' ? (
            <FiImage className="mt-0.5 text-lg shrink-0" />
          ) : (
            <FiXCircle className="mt-0.5 text-lg shrink-0" />
          )}
          {profileMessage.text}
        </div>
      )}

      {/* Picture Upload Selectors */}
      <div className="mb-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
              <FiCamera />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Profile Picture
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Interactive 1:1 circle cropper
              </p>
            </div>
          </div>
          <input
            ref={profilePicRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onSelectImageFile(file, 'profile');
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => profilePicRef.current?.click()}
            className="cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Adjust & Upload
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
              <FiImage />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Cover Picture
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Wide banner crop format
              </p>
            </div>
          </div>
          <input
            ref={coverPicRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onSelectImageFile(file, 'cover');
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => coverPicRef.current?.click()}
            className="cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Adjust & Upload
          </button>
        </div>
      </div>

      <form onSubmit={onProfileUpdate} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            Username{' '}
            <span className="text-[11px] font-semibold text-indigo-500 lowercase">
              (for instant login)
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
              }
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 pl-9 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono"
              placeholder="e.g. sonia_akter"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Lowercase letters, numbers, dot (.) and underscore (_) only.
          </p>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Enter full name"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Enter phone number"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
          <button
            type="submit"
            disabled={profileLoading || !name}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {profileLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Save Profile Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

