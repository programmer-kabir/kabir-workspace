import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiUser, FiMail, FiPhone, FiLock, FiCheckCircle,
  FiXCircle, FiCamera, FiEdit, FiShield
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const { currentUser, updateUser } = useAuth();

  const [name, setName]   = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdMessage, setPwdMessage]   = useState(null);

  const [imgMessage, setImgMessage]   = useState(null);

  // Profile Details Save
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await axios.post(`${API_BASE}api/profile/update_profile.php`, {
        user_id: currentUser.id,
        name,
        phone
      });
      if (res.data.status === 'success') {
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
        updateUser({ name, phone });
      } else {
        setProfileMessage({ text: res.data.message || 'Failed to update profile.', type: 'error' });
      }
    } catch {
      setProfileMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('user_id', currentUser.id);
    formData.append('type', type); // 'profile' or 'cover'

    setImgMessage({ text: `Uploading ${type} photo...`, type: 'info' });
    try {
      const res = await axios.post(`${API_BASE}api/profile/upload_pictures.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setImgMessage({ text: res.data.message, type: 'success' });
        updateUser({
          [type === 'profile' ? 'profile_picture' : 'cover_picture']: res.data.path
        });
      } else {
        setImgMessage({ text: res.data.message, type: 'error' });
      }
    } catch {
      setImgMessage({ text: 'Error uploading image.', type: 'error' });
    }
  };

  // Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setPwdLoading(true);
    setPwdMessage(null);
    try {
      const res = await axios.post(`${API_BASE}api/profile/change_password.php`, {
        user_id: currentUser.id,
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.data.status === 'success') {
        setPwdMessage({ text: 'Password updated successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMessage({ text: res.data.message || 'Failed to update password.', type: 'error' });
      }
    } catch {
      setPwdMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const coverUrl = currentUser?.cover_picture
    ? `url(${API_BASE}${currentUser.cover_picture})`
    : 'linear-gradient(to bottom right, #4f46e5, #312e81)';

  return (
    <div className=" mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account credentials, avatar, and security settings.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Card: Profile Cover/Avatar and Summary */}
        <div className="lg:col-span-1 space-y-4">
          
          {imgMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold text-center ${
              imgMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              imgMessage.type === 'info' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {imgMessage.text}
            </div>
          )}

          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {/* Cover photo */}
            <div 
              className="h-28 relative bg-cover bg-center group cursor-pointer"
              style={{ backgroundImage: coverUrl }}
            >
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <FiCamera className="text-white text-lg animate-pulse" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
              </label>

              {/* Avatar picture */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 group/avatar">
                <div className="w-20 h-20 bg-dark-950 p-1 rounded-full relative overflow-hidden shadow-lg border border-white/10">
                  {currentUser?.profile_picture ? (
                    <img src={`${API_BASE}${currentUser.profile_picture}`} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-brand-600/40 rounded-full flex items-center justify-center text-2xl font-bold text-brand-300 uppercase">
                      {currentUser?.name?.charAt(0)}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full">
                    <FiCamera className="text-white text-sm" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profile')} />
                  </label>
                </div>
              </div>
            </div>

            {/* Profile Info Summary */}
            <div className="pt-14 pb-6 px-5 text-center space-y-4">
              <div>
                <h3 className="text-white font-bold text-lg">{currentUser?.name}</h3>
                <p className="text-brand-400 text-xs font-semibold mt-0.5">Reviewer Portal</p>
              </div>

              <div className="space-y-2 text-left">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3">
                  <FiMail className="text-white/30" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Email</p>
                    <p className="text-white/80 text-xs font-medium truncate">{currentUser?.email}</p>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3">
                  <FiPhone className="text-white/30" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Phone</p>
                    <p className="text-white/80 text-xs font-medium">{currentUser?.phone || 'Not added'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Forms Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Form 1: Profile Edit details */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <FiUser className="text-brand-400" /> Personal Information
            </h3>
            {profileMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 text-center ${
                profileMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {profileMessage.text}
              </div>
            )}
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="Enter phone number" 
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={profileLoading} 
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {profileLoading ? 'Saving...' : 'Save Details'}
              </button>
            </form>
          </div>

          {/* Form 2: Password Edit */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <FiLock className="text-brand-400" /> Change Password
            </h3>
            {pwdMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 text-center ${
                pwdMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {pwdMessage.text}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                      placeholder="At least 6 characters"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                      placeholder="Repeat new password"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={pwdLoading} 
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
