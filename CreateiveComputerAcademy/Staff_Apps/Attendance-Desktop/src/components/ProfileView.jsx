import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../utils/api';
import { soundFx } from '../utils/soundFx';
import { toast } from 'sonner';
import {
  FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiXCircle,
  FiBriefcase, FiHash, FiCamera, FiEdit, FiX, FiClock, FiCalendar,
  FiActivity, FiTarget, FiInbox, FiCreditCard, FiDollarSign, FiRefreshCw,
  FiShield, FiTrendingUp
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const ProfileView = ({ onNavigate }) => {
  const { currentUser, updateUser } = useAuth();
  const API_BASE = (getApiBase() || '').replace(/\/+$/, '');
  const userId = currentUser?.id || currentUser?.user_id;

  // Edit Modal & Tabs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('profile'); // 'profile' | 'payout' | 'security'

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    payment_method: 'bkash',
    account_number: '',
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    routing_number: ''
  });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState(null);

  // Performance Stats
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [attStats, setAttStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setUsername(currentUser.username || '');
    }
  }, [currentUser]);

  // Fetch Payout Settings
  const fetchPayoutSettings = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/payroll/get_payout_settings.php?user_id=${userId}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setPayoutForm(res.data.data);
      }
    } catch (err) {
      console.warn('Payout settings fetch notice:', err);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    if (!userId) return;
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/profile/get_my_stats.php?user_id=${userId}`);
      if (res.data?.status === 'success') {
        setStats(res.data.data?.task_stats || null);
        setRecentTasks(res.data.data?.recent_tasks || []);
        setAttStats(res.data.data?.attendance_stats || null);
      }
    } catch (err) {
      console.error('Error fetching profile stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
      fetchPayoutSettings();
    }
  }, [userId]);

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMessage({ text: 'Please enter your full name.', type: 'error' });
      return;
    }
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/api/profile/update_profile.php`, {
        user_id: userId,
        name: name.trim(),
        phone: phone.trim(),
        username: username.trim()
      });

      if (res.data?.status === 'success') {
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
        toast.success('Profile updated successfully!');
        soundFx.playSuccess();
        updateUser({ name: name.trim(), phone: phone.trim(), username: username.trim() });
        setTimeout(() => {
          setIsModalOpen(false);
          setProfileMessage(null);
        }, 1200);
      } else {
        setProfileMessage({ text: res.data?.message || 'Failed to update profile.', type: 'error' });
        toast.error(res.data?.message || 'Failed to update profile.');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Server error occurred.';
      setProfileMessage({ text: errMsg, type: 'error' });
      toast.error(errMsg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Image Upload (Profile or Cover)
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('user_id', userId);
    formData.append('type', type);

    toast.info(`Uploading ${type === 'profile' ? 'profile picture' : 'cover photo'}...`);
    try {
      const res = await axios.post(`${API_BASE}/api/profile/upload_pictures.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Image uploaded successfully!');
        soundFx.playSuccess();
        updateUser({
          [type === 'profile' ? 'profile_picture' : 'cover_picture']: res.data.path
        });
      } else {
        toast.error(res.data?.message || 'Image upload failed.');
      }
    } catch (error) {
      toast.error('Error uploading image to server.');
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/api/profile/change_password.php`, {
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword
      });

      if (res.data?.status === 'success') {
        setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
        toast.success('Security password updated successfully!');
        soundFx.playSuccess();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMessage(null), 3000);
      } else {
        setPasswordMessage({ text: res.data?.message || 'Failed to update password.', type: 'error' });
        toast.error(res.data?.message || 'Password update failed.');
      }
    } catch (error) {
      setPasswordMessage({ text: 'Server error occurred while updating password.', type: 'error' });
      toast.error('Server error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Payout Settings Save
  const handleSavePayoutSettings = async (e) => {
    if (e) e.preventDefault();
    if (!payoutForm.account_number.trim()) {
      setPayoutMessage({ text: 'Please enter your account number / mobile wallet number.', type: 'error' });
      toast.error('Account number is required.');
      return;
    }

    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/api/payroll/save_payout_settings.php`, {
        user_id: userId,
        ...payoutForm
      });
      if (res.data?.status === 'success') {
        setPayoutMessage({ text: 'Payout payment method saved successfully!', type: 'success' });
        toast.success('Payout payment settings saved!');
        soundFx.playSuccess();
        setTimeout(() => setPayoutMessage(null), 3500);
      } else {
        setPayoutMessage({ text: res.data?.message || 'Failed to save payout method.', type: 'error' });
        toast.error(res.data?.message || 'Failed to save payout settings.');
      }
    } catch (err) {
      setPayoutMessage({ text: 'Error saving payout settings.', type: 'error' });
      toast.error('Error saving payout settings.');
    } finally {
      setPayoutLoading(false);
    }
  };

  if (!currentUser) return null;

  const profileImgUrl = currentUser?.profile_picture
    ? (currentUser.profile_picture.startsWith('http')
      ? currentUser.profile_picture
      : `${API_BASE}/${currentUser.profile_picture.replace(/^\/+/, '')}`)
    : null;

  const coverImgUrl = currentUser?.cover_picture
    ? (currentUser.cover_picture.startsWith('http')
      ? currentUser.cover_picture
      : `${API_BASE}/${currentUser.cover_picture.replace(/^\/+/, '')}`)
    : null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ──────── Main Profile Card ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden relative">
        {/* Cover Image Area */}
        <div className="relative h-56 sm:h-72 w-full group overflow-hidden bg-slate-900">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: coverImgUrl
                ? `url(${coverImgUrl})`
                : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #4f46e5 100%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Change Cover Button */}
          <label className="absolute top-4 right-4 px-3.5 py-2 rounded-2xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95">
            <FiCamera size={14} />
            <span className="hidden sm:inline">Change Cover</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, 'cover')}
            />
          </label>
        </div>

        {/* Profile Avatar & Primary Info Overlay */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 -mt-20 sm:-mt-24 relative z-10">
            {/* Avatar with Camera Icon */}
            <div className="relative group">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white dark:bg-slate-900 p-2 shadow-2xl ring-2 ring-white/20 relative overflow-hidden">
                {profileImgUrl ? (
                  <img
                    src={profileImgUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-5xl uppercase shadow-inner">
                    {currentUser?.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>

              {/* Upload Avatar Badge */}
              <label className="absolute bottom-1 right-1 p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-2 border-white dark:border-slate-900 transition-all cursor-pointer active:scale-95">
                <FiCamera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'profile')}
                />
              </label>
            </div>

            {/* Edit Profile Button */}
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setName(currentUser.name || '');
                  setPhone(currentUser.phone || '');
                  setUsername(currentUser.username || '');
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <FiEdit size={14} /> Edit Profile & Payout
              </button>
            </div>
          </div>

          {/* Name, Roles & Badges */}
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentUser?.name}
              </h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {currentUser?.role_name || 'Staff Member'}
              </span>
              {currentUser?.department_name && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentUser.department_name}
                </span>
              )}
            </div>

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <FiMail size={13} className="text-blue-500" /> {currentUser?.email || 'N/A'}
              </span>
              {currentUser?.phone && (
                <span className="flex items-center gap-1.5">
                  <FiPhone size={13} className="text-emerald-500" /> {currentUser.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <FiHash size={13} className="text-amber-500" /> @{currentUser?.username || 'user'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────── Stats & Summary Cards ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Completed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tasks Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiCheckCircle size={15} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.completed || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Out of {stats?.total || 0} assigned tasks</p>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiClock size={15} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.pending || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Pending review & work</p>
        </div>

        {/* Attendance Days */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Days Present
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FiCalendar size={15} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {attStats?.present || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Logged attendances</p>
        </div>

        {/* Overtime Hours */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Total Overtime
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FiTrendingUp size={15} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {attStats?.total_overtime || '0h 0m'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Accumulated overtime balance</p>
        </div>
      </div>

      {/* ──────── Recent Task Deliverables ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Recent Task Deliverables
          </h3>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/tasks')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            View All Tasks →
          </button>
        </div>

        {statsLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No recent task activity recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {task.category || 'General'} • Assigned {new Date(task.assign_date || task.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    task.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                      : task.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────── Edit Profile Modal ──────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                  <FiEdit className="text-blue-600" /> Account Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab('profile')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === 'profile'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General Info
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('payout')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === 'payout'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Payout Method
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('security')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === 'security'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Security & Password
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* 1. General Profile Tab */}
                {modalTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    {profileMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold ${
                          profileMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {profileMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md disabled:opacity-60 cursor-pointer"
                    >
                      {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </form>
                )}

                {/* 2. Payout Settings Tab */}
                {modalTab === 'payout' && (
                  <form onSubmit={handleSavePayoutSettings} className="space-y-4">
                    {payoutMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold ${
                          payoutMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {payoutMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Payment Method
                      </label>
                      <select
                        value={payoutForm.payment_method}
                        onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        <option value="bkash">bKash Personal</option>
                        <option value="nagad">Nagad Personal</option>
                        <option value="rocket">Rocket Personal</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Account / Wallet Number
                      </label>
                      <input
                        type="text"
                        value={payoutForm.account_number}
                        onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                        placeholder="01XXXXXXXXX or Bank Account No"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                        required
                      />
                    </div>

                    {payoutForm.payment_method === 'bank' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={payoutForm.bank_name || ''}
                            onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                            placeholder="e.g. Dutch-Bangla Bank"
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Branch Name
                          </label>
                          <input
                            type="text"
                            value={payoutForm.branch_name || ''}
                            onChange={(e) => setPayoutForm({ ...payoutForm, branch_name: e.target.value })}
                            placeholder="e.g. Kawran Bazar Branch"
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md disabled:opacity-60 cursor-pointer"
                    >
                      {payoutLoading ? 'Saving...' : 'Save Payout Details'}
                    </button>
                  </form>
                )}

                {/* 3. Security Tab */}
                {modalTab === 'security' && (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {passwordMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold ${
                          passwordMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {passwordMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md disabled:opacity-60 cursor-pointer"
                    >
                      {passwordLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileView;
