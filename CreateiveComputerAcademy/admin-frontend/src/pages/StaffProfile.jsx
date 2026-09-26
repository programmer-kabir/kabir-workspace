import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiUser, FiMail, FiPhone, FiBriefcase,
  FiActivity, FiMapPin, FiHash, FiClock as FiShift,
  FiCalendar, FiTarget, FiArrowLeft, FiCheckCircle, FiClock, FiXCircle,
  FiInbox, FiEye
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RoleBadge = ({ role }) => {
  const styles = {
    staff:      'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    manager:    'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
    instructor: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${styles[role] || 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
      {role || 'staff'}
    </span>
  );
};

const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [staff, setStaff] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}api/admin/staff/get_staff_profile.php?employee_code=${id}`);
        if (res.data.status === 'success') {
          setStaff(res.data.data.info);
          setStats(res.data.data.stats);
          setRecentTasks(res.data.data.recent_tasks);
        } else {
          setError(res.data.message || 'Failed to load staff profile.');
        }
      } catch (err) {
        console.error(err);
        setError('Server error while fetching profile.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[600px]">
        <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
          <FiUser className="text-slate-300 dark:text-slate-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Profile Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{error || 'The requested staff member does not exist.'}</p>
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
        >
          <FiArrowLeft /> Return to Directory
        </button>
      </div>
    );
  }

  const calculateTenure = (startDate, endDate) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    const months = Math.floor(diffDays / 30.4375);
    const years = Math.floor(months / 12);
    const remMonths = months % 12;

    if (years === 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    if (remMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${years} yr${years > 1 ? 's' : ''}, ${remMonths} mo${remMonths > 1 ? 's' : ''}`;
  };

  const tenure = staff ? calculateTenure(staff.joining_date, staff.resignation_date) : null;
  const empStatus = (staff?.employment_status || 'active').toLowerCase();

  const getStatusBadge = () => {
    if (empStatus === 'probation') {
      return { label: 'Probation', class: 'bg-purple-500 text-white' };
    }
    if (empStatus === 'resigned') {
      return { label: 'Resigned', class: 'bg-amber-500 text-white' };
    }
    if (empStatus === 'terminated') {
      return { label: 'Terminated', class: 'bg-rose-500 text-white' };
    }
    if (empStatus === 'on_leave' || empStatus === 'on leave') {
      return { label: 'On Leave', class: 'bg-sky-500 text-white' };
    }
    if (empStatus === 'suspended') {
      return { label: 'Suspended', class: 'bg-orange-500 text-white' };
    }
    if (empStatus === 'inactive' || staff?.status === 'inactive') {
      return { label: 'Inactive', class: 'bg-slate-500 text-white' };
    }
    return { label: 'Active', class: 'bg-emerald-500 text-white' };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      `}</style>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/staff')}
          className="group flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md"
        >
          <FiArrowLeft className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" size={18} />
          <span className="font-semibold text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Back to Staff</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden relative">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent pointer-events-none" />

        {/* Header / Cover */}
        <div className="relative h-72 lg:h-80 w-full group overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
            style={{ 
              backgroundImage: staff?.cover_picture 
                ? `url(${API_BASE}${staff.cover_picture})` 
                : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' 
            }} 
          />
          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        </div>

        {/* Profile Info Overlay */}
        <div className="relative px-8 lg:px-12 pb-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end -mt-24 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 rotate-[-2deg] transition-transform hover:rotate-0 duration-300">
                {staff?.profile_picture ? (
                  <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-6xl uppercase shadow-inner">
                    {staff?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg border-2 border-white dark:border-slate-800 ${statusBadge.class}`}>
                {statusBadge.label}
              </div>
            </div>

            {/* Name & Role */}
            <div className="flex-1 mb-2 lg:mb-6">
              <h1 
                className="text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {staff?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <RoleBadge role={staff?.role} />
                <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/80 px-3 py-1 rounded-full text-sm shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md">
                  <FiBriefcase className="text-slate-400 dark:text-slate-400" size={14} />
                  {staff?.designation || 'Staff Member'}
                </span>
                {staff?.department_name && (
                  <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/80 px-3 py-1 rounded-full text-sm shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md">
                    <FiMapPin className="text-slate-400 dark:text-slate-400" size={14} />
                    {staff.department_name}
                  </span>
                )}
                {staff?.status === 'inactive' && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 px-3 py-1 rounded-full text-xs shadow-sm border border-rose-200 dark:border-rose-800">
                    <FiXCircle size={14} /> Account Blocked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-8 lg:px-12 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Info Section (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Contact Card */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-black/20 transition-shadow">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5 mb-6">
                  <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FiUser size={14} />
                  </span>
                  Contact Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                      <FiMail size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Email Address</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{staff?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                      <FiPhone size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Phone Number</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{staff?.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Card */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-black/20 transition-shadow">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5 mb-6">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FiBriefcase size={14} />
                  </span>
                  Employment Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                      <FiHash className="text-slate-400 dark:text-slate-500" /> Employee ID
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{staff?.employee_code || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                      <FiShift className="text-slate-400 dark:text-slate-500" /> Working Shift
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs">
                      {staff?.shift_start?.slice(0,5)} - {staff?.shift_end?.slice(0,5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                      <FiCalendar className="text-slate-400 dark:text-slate-500" /> Date Joined
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {staff?.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  {staff?.resignation_date && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5 text-rose-500 dark:text-rose-400 text-sm">
                        <FiCalendar className="text-rose-400" /> Release / End Date
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {new Date(staff.resignation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {tenure && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                        <FiClock className="text-slate-400 dark:text-slate-500" /> Service Tenure
                      </div>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg text-xs">
                        {tenure} {staff?.resignation_date ? '(Completed)' : '(Active)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Stats & Tasks (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Statistics Section */}
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  Performance Overview
                </h3>
                {stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity text-slate-800 dark:text-slate-100">
                        <FiActivity size={64} />
                      </div>
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Tasks</div>
                      <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.total}</div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-500 group-hover:opacity-20 transition-opacity">
                        <FiInbox size={64} />
                      </div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">To-Do</div>
                      <div className="text-4xl font-black text-slate-700 dark:text-slate-200">{stats.to_do}</div>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-[1.5rem] border border-blue-100 dark:border-blue-800/50 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600 group-hover:opacity-20 transition-opacity">
                        <FiClock size={64} />
                      </div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">In Progress</div>
                      <div className="text-4xl font-black text-blue-700 dark:text-blue-300">{stats.in_progress}</div>
                    </div>

                    <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-[1.5rem] border border-amber-100 dark:border-amber-800/50 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600 group-hover:opacity-20 transition-opacity">
                        <FiEye size={64} />
                      </div>
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">In Review</div>
                      <div className="text-4xl font-black text-amber-700 dark:text-amber-300">{stats.in_review}</div>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800/50 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 group-hover:opacity-20 transition-opacity">
                        <FiCheckCircle size={64} />
                      </div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Completed</div>
                      <div className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{stats.completed}</div>
                    </div>
                    
                    <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 rounded-[1.5rem] border border-rose-100 dark:border-rose-800/50 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600 group-hover:opacity-20 transition-opacity">
                        <FiXCircle size={64} />
                      </div>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Rejected</div>
                      <div className="text-4xl font-black text-rose-700 dark:text-rose-300">{stats.rejected}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">Failed to load statistics.</div>
                )}
              </div>

              {/* Recent Tasks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Recent Assignments
                  </h3>
                  <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-xl">
                    View All Tasks
                  </button>
                </div>
                
                {recentTasks?.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map(task => {
                      const statusConfig = {
                        'Completed':   { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50' },
                        'In Progress': { bg: 'bg-blue-50 dark:bg-blue-500/10',    text: 'text-blue-700 dark:text-blue-400',    border: 'border-blue-200 dark:border-blue-800/50' },
                        'In Review':   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800/50' },
                        'Rejected':    { bg: 'bg-rose-50 dark:bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-400',    border: 'border-rose-200 dark:border-rose-800/50' },
                        'To-Do':       { bg: 'bg-slate-50 dark:bg-slate-500/10',   text: 'text-slate-700 dark:text-slate-400',   border: 'border-slate-200 dark:border-slate-700' },
                      };
                      const conf = statusConfig[task.status] || statusConfig['To-Do'];
                      
                      const priorityConfig = {
                        'High':   'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-800/50',
                        'Medium': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-800/50',
                        'Low':    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/50',
                      };
                      const pConf = priorityConfig[task.priority] || priorityConfig['Low'];

                      return (
                        <div key={task.id} className="bg-white dark:bg-slate-800/50 p-5 lg:p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] dark:hover:shadow-black/20 hover:border-slate-200 dark:hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 group relative overflow-hidden">
                          {/* Accent left border based on status */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${conf.bg.split(' ')[0].replace('bg-', 'bg-').replace('50', '400')}`} />
                          
                          <div className="flex items-start gap-4 pl-2">
                            <div>
                              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">{task.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">#{task.id}</span>
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
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                <FiCalendar size={12} className="text-slate-400 dark:text-slate-500" />
                                {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 border-dashed">
                    <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <FiTarget className="text-slate-300 dark:text-slate-500" size={24} />
                    </div>
                    <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">No Active Tasks</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This staff member hasn't been assigned any tasks recently.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default StaffProfile;
