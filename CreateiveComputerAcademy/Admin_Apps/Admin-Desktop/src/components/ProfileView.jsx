import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiShield,
  FiCamera, FiEdit3, FiSave, FiRefreshCw, FiEye, FiEyeOff,
  FiKey, FiServer, FiClock, FiActivity, FiCpu, FiHash,
  FiSliders, FiCopy, FiCheck, FiHardDrive, FiCheckSquare
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

export default function ProfileView({ setActiveTab }) {
  const { currentUser, updateUser, getApiBase } = useAuth();
  const API_BASE = (getApiBase ? getApiBase() : (import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/')).replace(/\/+$/, '') + '/';

  // Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Avatar Upload States
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Telemetry & Token Copy State
  const [tokenCopied, setTokenCopied] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem('cca_admin_desktop_token') ||
           localStorage.getItem('cca_admin_token') ||
           localStorage.getItem('cca_token') || '';
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Populate data from currentUser
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Handle Profile Details Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (!name.trim()) {
      toast.error('নাম ফাঁকা রাখা যাবে না!');
      return;
    }

    setProfileSaving(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(`${API_BASE}api/profile/update_profile.php`, {
        user_id: currentUser.id,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        token
      }, {
        headers: getAuthHeaders()
      });

      if (res.data?.status === 'success') {
        updateUser({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          phone: phone.trim()
        });
        toast.success(res.data.message || 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!');
      } else {
        toast.error(res.data?.message || 'প্রোফাইল আপডেট ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'সার্ভার এরর: প্রোফাইল সেভ করা যায়নি');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (!currentPassword) {
      toast.error('বর্তমান পাসওয়ার্ড দেওয়া আবশ্যক');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড দুটি মিলছে না!');
      return;
    }

    setPasswordSaving(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(`${API_BASE}api/profile/change_password.php`, {
        user_id: currentUser.id,
        current_password: currentPassword,
        new_password: newPassword,
        token
      }, {
        headers: getAuthHeaders()
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'সার্ভার এরর: পাসওয়ার্ড পরিবর্তন করা যায়নি');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Avatar Image Selection & Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে');
      return;
    }

    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('type', 'profile');
    formData.append('image', file);
    formData.append('token', getAuthToken());

    setAvatarUploading(true);
    const toastId = toast.loading('প্রোফাইল ছবি আপলোড হচ্ছে...');
    try {
      const res = await axios.post(`${API_BASE}api/profile/upload_pictures.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders()
        }
      });

      if (res.data?.status === 'success') {
        const newPath = res.data.path || res.data.url;
        updateUser({ profile_picture: newPath });
        toast.success('প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!', { id: toastId });
      } else {
        toast.error(res.data?.message || 'ছবি আপলোড ব্যর্থ হয়েছে', { id: toastId });
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error(err.response?.data?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyToken = () => {
    const token = getAuthToken();
    if (!token) return;
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    toast.success('অ্যাডমিন সেশন টোকেন ক্লিপবোর্ডে কপি হয়েছে');
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleReloadWindow = () => {
    window.location.reload();
  };

  const getProfileImgUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    const cleanBase = API_BASE.replace(/\/+$/, '');
    return `${cleanBase}/${pic.replace(/^\/+/, '')}`;
  };

  const avatarUrl = getProfileImgUrl(currentUser?.profile_picture);
  const roles = currentUser?.roles || ['admin'];
  const token = getAuthToken();

  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ── Top Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 border border-blue-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Upload Button */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-2xl ring-4 ring-white/10 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover rounded-[22px]"
                  />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-slate-800 flex items-center justify-center text-3xl font-black text-blue-400">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
              </div>

              {/* Camera Icon Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title="Change Profile Picture"
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {avatarUploading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCamera className="w-4 h-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Admin Title & Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
                  <FiShield className="w-3.5 h-3.5" />
                  <span>Super Administrator</span>
                </span>
                {roles.map(r => (
                  <span
                    key={r}
                    className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[11px] font-bold uppercase tracking-wider border border-white/15"
                  >
                    {r}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentUser?.name || 'Administrator'}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <FiUser className="text-blue-400" /> @{currentUser?.username || 'admin'}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <FiMail className="text-indigo-400" /> {currentUser?.email || 'admin@cca.com'}
                </span>
                {currentUser?.phone && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <FiPhone className="text-emerald-400" /> {currentUser.phone}
                  </span>
                )}
                {currentUser?.employee_code && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <FiHash className="text-amber-400" /> ID: {currentUser.employee_code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick System Badge */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 shrink-0 justify-around sm:justify-start">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </p>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timezone</p>
              <p className="text-xs font-bold text-slate-200 mt-1">Asia/Dhaka</p>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access</p>
              <p className="text-xs font-bold text-amber-300 mt-1">Full Root</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal Information (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <FiEdit3 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">ব্যক্তিগত ও অ্যাকাউন্ট তথ্য</h2>
                  <p className="text-xs text-slate-400">নাম, ইউজারনেম এবং যোগাযোগের ফোন নম্বর আপডেট করুন</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  সম্পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Creative Computer Academy"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  ইউজারনেম (Username)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    placeholder="e.g. admin"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা, ডট (.) এবং আন্ডারস্কোর (_) ব্যবহার করা যাবে।
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  মোবাইল নম্বর (Phone)
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01700000000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  ইমেইল অ্যাড্রেস (Email — লক করা)
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  নিরাপত্তার স্বার্থে অ্যাডমিন ইমেইল পরিবর্তন করতে ডাটাবেস অ্যাডমিন বা সিস্টেম ডেভেলপারের সহায়তা নিন।
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <FiRefreshCw className="animate-spin w-4 h-4" />
                      <span>সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      <span>পরিবর্তন সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security, Password & System Info (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <FiLock size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">নিরাপত্তা ও পাসওয়ার্ড</h2>
                <p className="text-xs text-slate-400">অ্যাডমিন পাসওয়ার্ড নিয়মিত পরিবর্তন করুন</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  বর্তমান পাসওয়ার্ড
                </label>
                <div className="relative">
                  <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  নতুন পাসওয়ার্ড
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <div className="relative">
                  <FiCheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {passwordSaving ? (
                    <>
                      <FiRefreshCw className="animate-spin w-4 h-4" />
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <FiLock className="w-4 h-4" />
                      <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* System Specs & Authority Overview */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <FiServer className="w-4 h-4" />
                <span>System Privilege Matrix</span>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ROOT PRIVILEGED
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Account Type</span>
                <span className="font-bold text-emerald-400">CCA Executive / Root</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Authorized Roles</span>
                <span className="font-mono text-slate-300 font-semibold">{roles.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-mono text-cyan-300">MySQL / MariaDB</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">API Endpoint</span>
                <span className="font-mono text-blue-400 text-[11px] truncate max-w-[200px]" title={API_BASE}>
                  {API_BASE}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Active Token</span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400 hover:text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 cursor-pointer"
                  title="Click to copy full token"
                >
                  {tokenCopied ? <FiCheck size={11} className="text-emerald-400" /> : <FiCopy size={11} />}
                  <span>{token ? `${token.substring(0, 8)}...` : 'None'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Audit Status</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <FiCheckSquare className="text-emerald-400" />
                  Protected &amp; Logged
                </span>
              </div>
            </div>

            {/* Quick Desktop Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('settings')}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiSliders size={13} className="text-blue-400" />
                <span>System Settings</span>
              </button>
              <button
                type="button"
                onClick={handleReloadWindow}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Reload Desktop View"
              >
                <FiRefreshCw size={13} className="text-emerald-400" />
                <span>Reload</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
