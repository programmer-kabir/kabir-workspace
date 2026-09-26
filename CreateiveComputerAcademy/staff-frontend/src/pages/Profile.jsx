import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiXCircle, 
  FiBriefcase, FiHash, FiCamera, FiEdit, FiX, FiImage, FiClock, FiCalendar,
  FiActivity, FiTarget, FiInbox, FiEye
} from 'react-icons/fi';

const Profile = () => {
  const { currentUser, updateUser } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [imgMessage, setImgMessage] = useState(null);

  // New Profile Edit States
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('profile'); // 'profile' or 'security'

  // Stats States
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [attStats, setAttStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fallback host
  const API_URL = (import.meta.env.VITE_API_BASE_URL) + '';

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await axios.get(`${API_URL}api/profile/get_my_stats.php?user_id=${currentUser.id}`);
        if (res.data.status === 'success') {
          setStats(res.data.data.task_stats);
          setRecentTasks(res.data.data.recent_tasks);
          setAttStats(res.data.data.attendance_stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    };
    if (currentUser?.id) fetchStats();
  }, [currentUser?.id, API_URL]);

  // Profile Update Handler
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await axios.post(`${API_URL}api/profile/update_profile.php`, {
        user_id: currentUser.id,
        name: name,
        phone: phone
      });
      
      if(res.data.status === 'success') {
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
        updateUser({ name, phone });
        setTimeout(() => {
          setIsModalOpen(false);
          setProfileMessage(null);
        }, 1000);
      } else {
        setProfileMessage({ text: res.data.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (error) {
      setProfileMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('user_id', currentUser.id);
    formData.append('type', type);

    setProfileMessage({ text: `Uploading ${type} photo...`, type: 'info' });
    try {
        const res = await axios.post(`${API_URL}api/profile/upload_pictures.php`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if(res.data.status === 'success') {
            setProfileMessage({ text: res.data.message, type: 'success' });
            updateUser({
                [type === 'profile' ? 'profile_picture' : 'cover_picture']: res.data.path
            });
            setTimeout(() => setProfileMessage(null), 3000);
        } else {
            setProfileMessage({ text: res.data.message, type: 'error' });
        }
    } catch (error) {
        setProfileMessage({ text: 'Error uploading image.', type: 'error' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const res = await axios.post(`${API_URL}api/profile/change_password.php`, {
        user_id: currentUser.id,
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if(res.data.status === 'success') {
        setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ text: res.data.message || 'Failed to update password.', type: 'error' });
      }
    } catch (error) {
      setPasswordMessage({ text: 'Server error occurred.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      `}</style>
      
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your personal information and track your performance.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden relative transition-colors">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

          {/* Header / Cover */}
          <div className="relative h-72 lg:h-80 w-full group overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
              style={{ 
                backgroundImage: currentUser?.cover_picture 
                  ? `url(${API_URL}${currentUser.cover_picture})` 
                  : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' 
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          </div>

          {/* Profile Info Overlay */}
          <div className="relative px-8 lg:px-12 pb-10">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end -mt-24 relative z-10">
              
              {/* Avatar */}
              <div className="relative">
                <div className="w-40 h-40 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 rotate-[-2deg] transition-all hover:rotate-0 duration-300 relative overflow-hidden">
                  {currentUser?.profile_picture ? (
                    <img src={`${API_URL}${currentUser.profile_picture}`} alt={currentUser.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-300 font-black text-6xl uppercase shadow-inner">
                      {currentUser?.name?.charAt(0)}
                    </div>
                  )}
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
                      onClick={() => {
                          setName(currentUser.name || '');
                          setPhone(currentUser.phone || '');
                          setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-xl font-bold backdrop-blur-md border border-slate-200 dark:border-white/20 transition-all shadow-sm"
                  >
                      <FiEdit size={18} /> Edit Profile
                  </button>
              </div>

            </div>
          </div>

          {/* Content Body */}
          <div className="px-8 lg:px-12 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Info Section (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Contact Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5 mb-6">
                    <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FiUser size={14} />
                    </span>
                    Contact Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                        <FiMail size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Email Address</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{currentUser?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                        <FiPhone size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Phone Number</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{currentUser?.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5 mb-6">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <FiBriefcase size={14} />
                    </span>
                    Employment
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                        <FiHash className="text-slate-400 dark:text-slate-500" /> Employee Code
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.employee_code || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                        <FiBriefcase className="text-slate-400 dark:text-slate-500" /> Designation
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.designation || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                        <FiClock className="text-slate-400 dark:text-slate-500" /> Working Shift
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs">
                        {currentUser?.shift_start ? `${currentUser.shift_start.slice(0,5)} - ${currentUser.shift_end?.slice(0,5)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                        <FiCalendar className="text-slate-400 dark:text-slate-500" /> Date Joined
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {currentUser?.joining_date ? new Date(currentUser.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Stats (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                
                {statsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {/* Performance Overview */}
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        Performance Overview
                      </h3>
                      {stats ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 transition-opacity text-slate-900 dark:text-white">
                              <FiActivity size={64} />
                            </div>
                            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Tasks</div>
                            <div className="text-4xl font-black text-slate-800 dark:text-white">{stats.total}</div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-500 dark:text-slate-400 group-hover:opacity-20 transition-opacity">
                              <FiInbox size={64} />
                            </div>
                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">To-Do</div>
                            <div className="text-4xl font-black text-slate-700 dark:text-slate-200">{stats.to_do}</div>
                          </div>

                          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-[1.5rem] border border-blue-100 dark:border-blue-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600 dark:text-blue-400 group-hover:opacity-20 transition-opacity">
                              <FiClock size={64} />
                            </div>
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">In Progress</div>
                            <div className="text-4xl font-black text-blue-700 dark:text-blue-300">{stats.in_progress}</div>
                          </div>

                          <div className="bg-amber-50/50 dark:bg-amber-900/20 p-5 rounded-[1.5rem] border border-amber-100 dark:border-amber-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-600 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600 dark:text-amber-400 group-hover:opacity-20 transition-opacity">
                              <FiEye size={64} />
                            </div>
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">In Review</div>
                            <div className="text-4xl font-black text-amber-700 dark:text-amber-300">{stats.in_review}</div>
                          </div>

                          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-5 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 dark:text-emerald-400 group-hover:opacity-20 transition-opacity">
                              <FiCheckCircle size={64} />
                            </div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Completed</div>
                            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{stats.completed}</div>
                          </div>
                          
                          <div className="bg-rose-50/50 dark:bg-rose-900/20 p-5 rounded-[1.5rem] border border-rose-100 dark:border-rose-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600 dark:text-rose-400 group-hover:opacity-20 transition-opacity">
                              <FiXCircle size={64} />
                            </div>
                            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Rejected</div>
                            <div className="text-4xl font-black text-rose-700 dark:text-rose-300">{stats.rejected}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-slate-500 py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">No performance data available.</div>
                      )}
                    </div>

                    {/* Attendance Overview */}
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        Attendance & Time Tracking
                      </h3>
                      {attStats ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Present</div>
                              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{attStats.present}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <FiCheckCircle />
                            </div>
                          </div>

                          <div className="bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-[1.5rem] border border-rose-100 dark:border-rose-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Absent</div>
                              <div className="text-2xl font-black text-rose-700 dark:text-rose-300">{attStats.absent}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                              <FiXCircle />
                            </div>
                          </div>

                          <div className="bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-[1.5rem] border border-amber-100 dark:border-amber-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Leave</div>
                              <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{attStats.leave}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                              <FiCalendar />
                            </div>
                          </div>

                          <div className="bg-violet-50/50 dark:bg-violet-900/20 p-4 rounded-[1.5rem] border border-violet-100 dark:border-violet-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Expected Duty</div>
                              <div className="text-xl font-black text-violet-700 dark:text-violet-300">{attStats.expected_duty || '0h 0m'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                              <FiClock />
                            </div>
                          </div>

                          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-[1.5rem] border border-blue-100 dark:border-blue-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Hours Worked</div>
                              <div className="text-xl font-black text-blue-700 dark:text-blue-300">{attStats.hours_worked || '0h 0m'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <FiUser />
                            </div>
                          </div>

                          <div className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-[1.5rem] border border-teal-100 dark:border-teal-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Overtime</div>
                              <div className="text-xl font-black text-teal-700 dark:text-teal-300">{attStats.overtime || '0h 0m'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                              <FiActivity />
                            </div>
                          </div>

                          <div className="bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-[1.5rem] border border-rose-100 dark:border-rose-800 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Short Time</div>
                              <div className="text-xl font-black text-rose-700 dark:text-rose-300">{attStats.short_time || '0h 0m'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                              <FiXCircle />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-slate-500 py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">No attendance data available.</div>
                      )}
                    </div>

                    {/* Recent Tasks */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                          Recent Assignments
                        </h3>
                      </div>
                      
                      {recentTasks?.length > 0 ? (
                        <div className="space-y-4">
                          {recentTasks.map(task => {
                            const statusConfig = {
                              'Completed':   { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-400 dark:bg-emerald-500' },
                              'In Progress': { bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400',    border: 'border-blue-200 dark:border-blue-800', bar: 'bg-blue-400 dark:bg-blue-500' },
                              'In Review':   { bg: 'bg-amber-50 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800', bar: 'bg-amber-400 dark:bg-amber-500' },
                              'Rejected':    { bg: 'bg-rose-50 dark:bg-rose-900/30',    text: 'text-rose-700 dark:text-rose-400',    border: 'border-rose-200 dark:border-rose-800', bar: 'bg-rose-400 dark:bg-rose-500' },
                              'To-Do':       { bg: 'bg-slate-50 dark:bg-slate-800',   text: 'text-slate-700 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-400 dark:bg-slate-500' },
                            };
                            const conf = statusConfig[task.status] || statusConfig['To-Do'];
                            
                            const priorityConfig = {
                              'High':   'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-800',
                              'Medium': 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800',
                              'Low':    'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800',
                            };
                            const pConf = priorityConfig[task.priority] || priorityConfig['Low'];

                            return (
                              <div key={task.id} className="bg-white dark:bg-slate-800 p-5 lg:p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 group relative overflow-hidden">
                                {/* Accent left border based on status */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${conf.bar}`} />
                                
                                <div className="flex items-start gap-4 pl-2">
                                  <div>
                                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">{task.title}</h4>
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">#{task.id}</span>
                                      <span className={`px-2 py-0.5 rounded-md border ${pConf}`}>
                                        {task.priority} Priority
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 sm:flex-col sm:items-end pl-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}>
                                    {task.status}
                                  </span>
                                  {task.deadline && (
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                      <FiCalendar size={12} />
                                      {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 border-dashed">
                          <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <FiTarget className="text-slate-300 dark:text-slate-500" size={24} />
                          </div>
                          <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-1">No Active Tasks</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">You haven't been assigned any tasks recently.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile & Security Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl z-10 relative overflow-hidden animate-in zoom-in-95 duration-250 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-sm">
                    {modalTab === 'profile' ? <FiUser /> : <FiLock />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Settings</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage your profile & security.</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
                <button 
                  onClick={() => setModalTab('profile')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${modalTab === 'profile' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => setModalTab('security')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${modalTab === 'security' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Security
                </button>
              </div>

              {/* Tab Content: Profile */}
              {modalTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {profileMessage && (
                    <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
                      profileMessage.type === 'success' || profileMessage.type === 'info' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                    }`}>
                      {profileMessage.type === 'success' ? <FiCheckCircle className="mt-0.5 text-lg shrink-0" /> : profileMessage.type === 'info' ? <FiImage className="mt-0.5 text-lg shrink-0" /> : <FiXCircle className="mt-0.5 text-lg shrink-0" />}
                      {profileMessage.text}
                    </div>
                  )}

                  <div className="mb-6 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <FiCamera />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Profile Picture</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Square image recommended</p>
                        </div>
                      </div>
                      <label className="cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profile')} />
                      </label>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <FiImage />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Cover Picture</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Wide image recommended</p>
                        </div>
                      </div>
                      <label className="cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
                      </label>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Full Name</label>
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
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Phone Number</label>
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
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {profileLoading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          'Save Profile Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab Content: Security */}
              {modalTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {passwordMessage && (
                      <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
                          passwordMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                      }`}>
                          {passwordMessage.type === 'success' ? <FiCheckCircle className="mt-0.5 text-lg shrink-0" /> : <FiXCircle className="mt-0.5 text-lg shrink-0" />}
                          {passwordMessage.text}
                      </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                      <div>
                          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Current Password</label>
                          <input 
                              type="password" 
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                              placeholder="Enter current password"
                              required
                          />
                      </div>
                      
                      <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full my-4"></div>
                      
                      <div>
                          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">New Password</label>
                          <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                              placeholder="Min. 6 characters"
                              required
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Confirm New Password</label>
                          <input 
                              type="password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                              placeholder="Re-type new password"
                              required
                          />
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                          <button 
                              type="submit" 
                              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                              className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              {passwordLoading ? (
                                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                              ) : (
                                  'Update Password'
                              )}
                          </button>
                      </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
