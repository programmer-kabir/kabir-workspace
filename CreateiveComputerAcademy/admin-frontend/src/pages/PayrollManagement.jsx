import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  FiDollarSign, FiClock, FiUsers, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiTrendingUp, FiSearch, FiFilter, FiPlus,
  FiEdit3, FiRefreshCw, FiCalendar, FiArrowUpRight, FiCheck,
  FiX, FiList, FiFileText, FiShield, FiSend, FiUserPlus, FiUser,
  FiBriefcase, FiChevronDown, FiUserCheck, FiEye, FiActivity,
  FiLayers, FiInfo, FiChevronRight, FiGrid, FiSliders, FiPrinter
} from 'react-icons/fi';
import { FaCoins, FaGraduationCap } from 'react-icons/fa6';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';
const R2_PUBLIC_BASE = 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/';

export const getProfileImgUrl = (pic) => {
  if (!pic) return null;
  const cleanPic = String(pic).trim();
  if (!cleanPic) return null;
  if (cleanPic.startsWith('http://') || cleanPic.startsWith('https://')) return cleanPic;

  const r2Base = R2_PUBLIC_BASE.replace(/\/+$/, '');
  const relative = cleanPic.replace(/^\/+/, '');
  return `${r2Base}/${relative}`;
};

export const StaffAvatar = ({ name = '', picture = '', size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name ? name.trim().charAt(0).toUpperCase() : 'S';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-14 h-14 text-lg font-black',
  };

  const colors = [
    'from-blue-600 to-indigo-600',
    'from-indigo-600 to-purple-600',
    'from-emerald-600 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-600 to-blue-600',
    'from-violet-600 to-fuchsia-600',
  ];
  const colorIndex = (name || 'A').charCodeAt(0) % colors.length;
  const gradient = colors[colorIndex];

  const src = getProfileImgUrl(picture);

  if (!picture || imgError || !src) {
    return (
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr ${gradient} text-white font-black flex items-center justify-center shrink-0 shadow-xs uppercase select-none ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0 select-none ${className}`}
    />
  );
};

export default function PayrollManagement() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'withdrawals'
  const [loading, setLoading] = useState(true);

  // Data states
  const [staffSchemes, setStaffSchemes] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'YEARLY_CONTRACT' | 'MONTHLY'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'staff' | 'student' | 'reviewer'
  const [withdrawalFilter, setWithdrawalFilter] = useState('pending'); // 'all' | 'pending' | 'paid' | 'rejected'

  // Modal 1: Scheme Configuration
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [selectedUserForScheme, setSelectedUserForScheme] = useState(null);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef(null);
  const [userSearchText, setUserSearchText] = useState('');
  const [schemeForm, setSchemeForm] = useState({
    scheme_id: 0,
    user_id: 0,
    scheme_type: 'YEARLY_CONTRACT',
    salary_amount: '',
    contract_amount: '50000',
    contract_duration_months: '12',
    working_days_per_month: '26',
    standard_daily_hours: '8',
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    notes: ''
  });
  const [submittingScheme, setSubmittingScheme] = useState(false);

  // Modal 2: Process Withdrawal
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [processForm, setProcessForm] = useState({
    status: 'paid',
    transaction_reference: '',
    admin_notes: ''
  });
  const [submittingProcess, setSubmittingProcess] = useState(false);

  // Modal 3: Manual Adjustment
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    user_id: '',
    minutes: '60',
    notes: 'Admin manual time adjustment',
    work_date: new Date().toISOString().split('T')[0]
  });
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Modal 4: Detailed Staff Payroll Breakdown & Logs
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedUserPayrollDetails, setSelectedUserPayrollDetails] = useState(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState('daily'); // 'daily' | 'monthly' | 'sessions' | 'withdrawals' | 'scheme'
  const [dailyFilterMonth, setDailyFilterMonth] = useState('ALL');
  const [dailySearchDate, setDailySearchDate] = useState('');
  const [selectedAdminInvoice, setSelectedAdminInvoice] = useState(null);

  const handleOpenDetailsModal = async (userId) => {
    setIsDetailsModalOpen(true);
    setDetailsLoading(true);
    setActiveDetailsTab('daily');
    setDailyFilterMonth('ALL');
    setDailySearchDate('');
    try {
      const res = await axios.get(`${API_BASE}api/admin/payroll/get_staff_payroll_details.php?user_id=${userId}`);
      if (res.data.status === 'success') {
        setSelectedUserPayrollDetails(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load details');
      }
    } catch (err) {
      toast.error('Failed to load payroll details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSyncDetailsAttendance = async (userId) => {
    try {
      setSyncingAttendance(true);
      const res = await axios.post(`${API_BASE}api/admin/payroll/sync_attendance_earnings.php`, { user_id: userId });
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        // Refresh details modal
        const detailsRes = await axios.get(`${API_BASE}api/admin/payroll/get_staff_payroll_details.php?user_id=${userId}`);
        if (detailsRes.data.status === 'success') {
          setSelectedUserPayrollDetails(detailsRes.data.data);
        }
        // Refresh schemes list in background
        fetchSchemes();
      } else {
        toast.error(res.data.message || 'Sync failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed.');
    } finally {
      setSyncingAttendance(false);
    }
  };

  // Fetch all schemes
  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/admin/payroll/get_all_schemes.php`);
      if (res.data.status === 'success') {
        setStaffSchemes(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load schemes.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all eligible users (students, staff, reviewers)
  const fetchEligibleUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/admin/payroll/get_eligible_users.php`);
      if (res.data.status === 'success') {
        setEligibleUsers(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    try {
      const url = withdrawalFilter === 'all'
        ? `${API_BASE}api/admin/payroll/get_withdrawals.php`
        : `${API_BASE}api/admin/payroll/get_withdrawals.php?status=${withdrawalFilter}`;
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setWithdrawals(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchemes();
    fetchEligibleUsers();
    fetchWithdrawals();
  }, [withdrawalFilter]);

  // Click outside to close staff dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target)) {
        setIsStaffDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Hourly Rate calculation
  const calculatePreviewRate = () => {
    const days = parseInt(schemeForm.working_days_per_month) || 26;
    const hours = parseFloat(schemeForm.standard_daily_hours) || 8.0;
    const months = parseInt(schemeForm.contract_duration_months) || 12;

    if (schemeForm.scheme_type === 'YEARLY_CONTRACT') {
      const amount = parseFloat(schemeForm.contract_amount) || 0;
      const totalHours = days * months * hours;
      return totalHours > 0 ? (amount / totalHours).toFixed(2) : '0.00';
    } else {
      const amount = parseFloat(schemeForm.salary_amount) || 0;
      const monthlyHours = days * hours;
      return monthlyHours > 0 ? (amount / monthlyHours).toFixed(2) : '0.00';
    }
  };

  // Open modal to assign brand new user (e.g. Student / Intern)
  const handleOpenNewUserScheme = () => {
    setSelectedUserForScheme(null);
    setUserSearchText('');
    setSchemeForm({
      scheme_id: 0,
      user_id: 0,
      scheme_type: 'YEARLY_CONTRACT',
      salary_amount: '',
      contract_amount: '50000',
      contract_duration_months: '12',
      working_days_per_month: '26',
      standard_daily_hours: '8',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      notes: ''
    });
    setIsSchemeModalOpen(true);
  };

  // Open modal to edit existing scheme
  const handleOpenEditScheme = (user) => {
    setSelectedUserForScheme(user);
    const summary = user.wallet_summary?.scheme || {};
    const isYearly = (user.scheme_type || 'YEARLY_CONTRACT') === 'YEARLY_CONTRACT';
    setSchemeForm({
      scheme_id: user.scheme_id || 0,
      user_id: user.user_id,
      scheme_type: user.scheme_type || 'YEARLY_CONTRACT',
      salary_amount: user.salary_amount || '',
      contract_amount: user.contract_amount || '50000',
      contract_duration_months: user.contract_duration_months || '12',
      working_days_per_month: user.working_days_per_month || '26',
      standard_daily_hours: user.standard_daily_hours || '8',
      contract_start_date: user.contract_start_date || new Date().toISOString().split('T')[0],
      contract_end_date: isYearly ? (user.contract_end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]) : '',
      notes: summary.notes || ''
    });
    setIsSchemeModalOpen(true);
  };

  const handleSaveScheme = async (e) => {
    e.preventDefault();
    if (!schemeForm.user_id) {
      toast.error('Please select a user / student.');
      return;
    }

    try {
      setSubmittingScheme(true);
      const res = await axios.post(`${API_BASE}api/admin/payroll/save_scheme.php`, schemeForm);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Scheme saved successfully!');
        setIsSchemeModalOpen(false);
        fetchSchemes();
        fetchEligibleUsers();
      } else {
        toast.error(res.data.message || 'Failed to save scheme.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving scheme.');
    } finally {
      setSubmittingScheme(false);
    }
  };

  const [syncingAttendance, setSyncingAttendance] = useState(false);

  // Sync attendance into work earnings
  const handleSyncAttendance = async (userId = null) => {
    try {
      setSyncingAttendance(true);
      const res = await axios.post(`${API_BASE}api/admin/payroll/sync_attendance_earnings.php`, {
        user_id: userId
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Attendance synced successfully!');
        fetchSchemes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync attendance.');
    } finally {
      setSyncingAttendance(false);
    }
  };

  const handleOpenProcess = (w, targetStatus) => {
    setSelectedWithdrawal(w);
    setProcessForm({
      status: targetStatus,
      transaction_reference: '',
      admin_notes: ''
    });
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWithdrawal?.id) return;

    try {
      setSubmittingProcess(true);
      const res = await axios.post(`${API_BASE}api/admin/payroll/process_withdrawal.php`, {
        withdrawal_id: selectedWithdrawal.id,
        admin_id: currentUser?.id,
        status: processForm.status,
        transaction_reference: processForm.transaction_reference,
        admin_notes: processForm.admin_notes
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message);
        setIsProcessModalOpen(false);
        fetchWithdrawals();
        fetchSchemes();
      } else {
        toast.error(res.data.message || 'Process failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing withdrawal.');
    } finally {
      setSubmittingProcess(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const userIdNum = parseInt(adjustForm.user_id);
    const minutesNum = parseInt(adjustForm.minutes);

    if (!userIdNum || !minutesNum) {
      toast.error('Please select a user and enter minutes.');
      return;
    }

    try {
      setSubmittingAdjust(true);
      const res = await axios.post(`${API_BASE}api/admin/payroll/manual_adjustment.php`, {
        user_id: userIdNum,
        minutes: minutesNum,
        notes: adjustForm.notes,
        work_date: adjustForm.work_date
      });

      if (res.data.status === 'success') {
        toast.success('Manual adjustment recorded successfully!');
        setIsAdjustModalOpen(false);
        setAdjustForm({ user_id: '', minutes: '60', notes: '', work_date: new Date().toISOString().split('T')[0] });
        fetchSchemes();
      } else {
        toast.error(res.data.message || 'Failed to apply adjustment.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error applying adjustment.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Filtered users
  const filteredSchemes = staffSchemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roles && s.roles.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.department_name && s.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || s.scheme_type === filterType;
    const matchesRole = roleFilter === 'ALL' || (s.roles && s.roles.toLowerCase().includes(roleFilter.toLowerCase()));
    return matchesSearch && matchesType && matchesRole;
  });

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <FiShield className="w-3.5 h-3.5" />
            Staff Payroll & 50K Contract Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Staff Pay Schemes & 50K Wallet</h1>
          <p className="text-slate-300 text-sm max-w-xl mt-1">
            Assign 50K Yearly Contracts or Monthly Schemes to <b>Staff Members</b> with work-time earning calculation, target milestone tracking, and surplus payouts.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleSyncAttendance(null)}
            disabled={syncingAttendance}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
            title="Sync all past & current attendance hours into ledger"
          >
            <FiRefreshCw className={`w-4 h-4 ${syncingAttendance ? 'animate-spin' : ''}`} />
            {syncingAttendance ? 'Syncing...' : 'Sync Attendance'}
          </button>
          <button
            onClick={handleOpenNewUserScheme}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <FiUserPlus className="w-4 h-4" />
            + Assign Scheme to Staff
          </button>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Manual Adjustment
          </button>
          <button
            onClick={() => { fetchSchemes(); fetchWithdrawals(); }}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/10"
            title="Refresh"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition ${activeTab === 'schemes'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <FiUsers className="w-4 h-4" />
          Assigned Schemes & Live Progress ({staffSchemes.length})
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition relative ${activeTab === 'withdrawals'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <FiDollarSign className="w-4 h-4" />
          Withdrawal Requests
          {pendingWithdrawalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {pendingWithdrawalsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Staff & Student Schemes */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, student, staff..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold uppercase">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Roles</option>
                  <option value="staff">Staff Only</option>
                  <option value="student">Students / Interns</option>
                  <option value="reviewer">Reviewers</option>
                </select>
              </div>

              {/* Scheme Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold uppercase">Scheme:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Types</option>
                  <option value="YEARLY_CONTRACT">Yearly Contract (50K Target)</option>
                  <option value="MONTHLY">Monthly Regular Salary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schemes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((user) => {
              const summary = user.wallet_summary || {};
              const isYearly = user.scheme_type === 'YEARLY_CONTRACT';
              const progress = summary.progress_percent || 0;
              const targetCompleted = summary.target_completed;
              const isStudent = user.roles && user.roles.includes('student');

              return (
                <div
                  key={user.user_id}
                  onClick={() => handleOpenDetailsModal(user.user_id)}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 hover:border-indigo-500 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 group flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Header: Profile & Roles */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <StaffAvatar
                          name={user.name}
                          picture={user.profile_picture}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition flex items-center gap-1.5">
                            {user.name}
                            {isStudent && (
                              <span title="Student Profile" className="text-emerald-500"><FaGraduationCap size={14} /></span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {user.roles?.split(',').map((r, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase">
                                {r.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Scheme Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${isYearly
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        }`}>
                        {isYearly ? '50K Contract' : 'Monthly'}
                      </span>
                    </div>

                    {/* Rate & Hours KPI */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Hourly Rate</span>
                        <div className="text-base font-black text-slate-900 dark:text-white">
                          ৳ {Number(user.hourly_rate || 0).toFixed(2)}
                          <span className="text-[10px] text-slate-400 font-normal">/h</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Hours</span>
                        <div className="text-base font-black text-slate-900 dark:text-white">
                          {summary.total_approved_hours || 0}
                          <span className="text-[10px] text-slate-400 font-normal">h</span>
                        </div>
                      </div>
                    </div>

                    {/* Contract Progress / Monthly Earned */}
                    {isYearly ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">
                            Company Target (৳{Number(user.contract_amount || 50000).toLocaleString()})
                          </span>
                          <span className={targetCompleted ? 'text-emerald-500 font-black' : 'text-indigo-600 dark:text-indigo-400'}>
                            {progress.toFixed(1)}% {targetCompleted && '✅'}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${targetCompleted
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                              }`}
                            style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span>Earned: ৳{Number(summary.total_earned || 0).toLocaleString()}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Surplus: ৳{Number(summary.staff_surplus_earned || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/30 rounded-2xl">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Monthly Salary:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">৳ {Number(user.salary_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Total Work Earned:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">৳ {Number(summary.total_earned || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Available for Cashout */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 uppercase">Available Payout:</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ৳ {Number(summary.available_withdrawable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSyncAttendance(user.user_id);
                      }}
                      disabled={syncingAttendance}
                      className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 rounded-xl transition cursor-pointer border border-teal-200/50 dark:border-teal-800/50 shrink-0"
                      title="Sync this staff's attendance hours"
                    >
                      <FiRefreshCw className={`w-3.5 h-3.5 ${syncingAttendance ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailsModal(user.user_id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-200/40 dark:border-indigo-800/40"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditScheme(user);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                      title="Configure Scheme"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Withdrawal Requests */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {['pending', 'paid', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setWithdrawalFilter(st)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${withdrawalFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Requested Amount</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Account / Phone</th>
                    <th className="p-4">Trx ID / Ref</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {withdrawals.length > 0 ? (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{w.staff_name}</div>
                          <div className="text-[11px] text-slate-400">{w.staff_email}</div>
                        </td>
                        <td className="p-4 font-black text-sm text-emerald-600 dark:text-emerald-400">
                          ৳ {Number(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                            {w.withdrawal_type === 'CONTRACT_SURPLUS' ? '50K Surplus' : 'Monthly Salary'}
                          </span>
                        </td>
                        <td className="p-4 capitalize font-bold text-indigo-600 dark:text-indigo-400">
                          {w.payment_method}
                        </td>
                        <td className="p-4 font-mono text-xs">{w.account_details || '—'}</td>
                        <td className="p-4 font-mono text-xs text-slate-500">{w.transaction_reference || '—'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${w.status === 'paid' || w.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : w.status === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {w.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenProcess(w, 'paid')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <FiCheck className="w-3.5 h-3.5" /> Disburse & Pay
                              </button>
                              <button
                                onClick={() => handleOpenProcess(w, 'rejected')}
                                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <FiX className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400 font-normal">
                        No {withdrawalFilter} withdrawal requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Configure / Edit Scheme (Rendered via Portal to avoid top-gap/clipping) */}
      {isSchemeModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedUserForScheme ? 'Configure Staff Scheme' : 'Assign Scheme to Staff'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedUserForScheme ? `Staff: ${selectedUserForScheme?.name}` : 'Select a verified staff member to configure pay scheme'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSchemeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-4">
              {/* User Selector Dropdown */}
              {!selectedUserForScheme && (
                <div className="space-y-1.5" ref={staffDropdownRef}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Staff Member
                  </label>

                  {/* Dropdown Trigger Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStaffDropdownOpen(prev => !prev)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition cursor-pointer shadow-xs ${isStaffDropdownOpen
                          ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {schemeForm.user_id ? (
                        (() => {
                          const picked = eligibleUsers.find(u => u.user_id === schemeForm.user_id);
                          return picked ? (
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <StaffAvatar
                                name={picked.name}
                                picture={picked.profile_picture}
                                size="md"
                                className="border-2 border-indigo-500/40 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                    {picked.name}
                                  </h4>
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold uppercase">Staff</span>
                                  {picked.active_scheme_id && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{picked.email}</p>
                                {(picked.designation || picked.department_name) && (
                                  <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                    {picked.designation} {picked.department_name ? `• ${picked.department_name}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">-- Choose Staff Member --</span>
                          );
                        })()
                      ) : (
                        <div className="flex items-center gap-2.5 text-slate-400 py-1">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                            <FiUser className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">-- Click to Choose Staff Member --</span>
                        </div>
                      )}

                      <div className="shrink-0 pl-2">
                        <FiChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isStaffDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                      </div>
                    </button>

                    {/* Dropdown Popup Menu */}
                    {isStaffDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 max-h-72 flex flex-col backdrop-blur-xl animate-fadeIn">
                        {/* Search Input inside popup */}
                        <div className="relative shrink-0">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                          <input
                            type="text"
                            value={userSearchText}
                            onChange={(e) => setUserSearchText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Type to search staff by name, email, role..."
                            className="w-full pl-8 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            autoFocus
                          />
                          {userSearchText && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setUserSearchText(''); }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Staff list */}
                        <div className="overflow-y-auto space-y-1 flex-1 custom-scrollbar max-h-52 pr-0.5">
                          {eligibleUsers
                            .filter(u => !userSearchText || u.name.toLowerCase().includes(userSearchText.toLowerCase()) || u.email.toLowerCase().includes(userSearchText.toLowerCase()) || (u.designation && u.designation.toLowerCase().includes(userSearchText.toLowerCase())) || (u.department_name && u.department_name.toLowerCase().includes(userSearchText.toLowerCase())))
                            .map((u) => {
                              const isSelected = schemeForm.user_id === u.user_id;
                              return (
                                <div
                                  key={u.user_id}
                                  onClick={() => {
                                    setSchemeForm({ ...schemeForm, user_id: u.user_id });
                                    setIsStaffDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer group ${isSelected
                                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-semibold'
                                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <StaffAvatar
                                      name={u.name}
                                      picture={u.profile_picture}
                                      size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-bold text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {u.name}
                                      </h5>
                                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                                      {(u.designation || u.department_name) && (
                                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium truncate">
                                          {u.designation} {u.department_name ? `(${u.department_name})` : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2 pl-2">
                                    {u.active_scheme_id ? (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                                        {u.scheme_type === 'YEARLY_CONTRACT' ? '50K Active' : 'Monthly'}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">
                                        No Scheme
                                      </span>
                                    )}
                                    {isSelected && (
                                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                        <FiCheck size={12} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {eligibleUsers.length === 0 && (
                            <div className="py-4 text-center text-xs text-slate-400">
                              No staff members found.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scheme Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Scheme Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSchemeForm({ ...schemeForm, scheme_type: 'YEARLY_CONTRACT' })}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${schemeForm.scheme_type === 'YEARLY_CONTRACT'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    <div className="font-bold text-sm">Yearly Contract</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">৳50,000 Target + 100% Surplus</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchemeForm({ ...schemeForm, scheme_type: 'MONTHLY' })}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${schemeForm.scheme_type === 'MONTHLY'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    <div className="font-bold text-sm">Monthly Regular</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Fixed monthly base salary</div>
                  </button>
                </div>
              </div>

              {/* Amount input */}
              {schemeForm.scheme_type === 'YEARLY_CONTRACT' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Yearly Contract Target (৳)
                  </label>
                  <input
                    type="number"
                    value={schemeForm.contract_amount}
                    onChange={(e) => setSchemeForm({ ...schemeForm, contract_amount: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Monthly Salary (৳)
                  </label>
                  <input
                    type="number"
                    value={schemeForm.salary_amount}
                    onChange={(e) => setSchemeForm({ ...schemeForm, salary_amount: e.target.value })}
                    placeholder="e.g. 10000"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              )}

              {/* Standard Hours & Days Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Working Days / Month
                  </label>
                  <input
                    type="number"
                    value={schemeForm.working_days_per_month}
                    onChange={(e) => setSchemeForm({ ...schemeForm, working_days_per_month: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Standard Daily Hours (Divisor)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={schemeForm.standard_daily_hours}
                    onChange={(e) => setSchemeForm({ ...schemeForm, standard_daily_hours: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              {schemeForm.scheme_type === 'YEARLY_CONTRACT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Contract Start Date
                    </label>
                    <input
                      type="date"
                      value={schemeForm.contract_start_date}
                      onChange={(e) => setSchemeForm({ ...schemeForm, contract_start_date: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Contract End Date (1 Year)
                    </label>
                    <input
                      type="date"
                      value={schemeForm.contract_end_date}
                      onChange={(e) => setSchemeForm({ ...schemeForm, contract_end_date: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Scheme Start Date
                    </label>
                    <input
                      type="date"
                      value={schemeForm.contract_start_date}
                      onChange={(e) => setSchemeForm({ ...schemeForm, contract_start_date: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-center p-3 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <FiCalendar className="text-emerald-500" />
                      No End Date (Ongoing)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Monthly regular salary remains active continuously without any expiry.</span>
                  </div>
                </div>
              )}

              {/* Live Hourly Rate Formula Box */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  ⚡ Computed Hourly Rate Preview:
                </span>
                <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                  ৳ {calculatePreviewRate()} <span className="text-xs font-medium text-slate-500">/ approved hour</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Formula: {schemeForm.scheme_type === 'YEARLY_CONTRACT'
                    ? `৳${schemeForm.contract_amount || 0} ÷ (${schemeForm.working_days_per_month} days × 12 months × 8h standard)`
                    : `৳${schemeForm.salary_amount || 0} ÷ (${schemeForm.working_days_per_month} days × 8h standard)`}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSchemeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingScheme || !schemeForm.user_id}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingScheme ? 'Saving...' : 'Save Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Process Withdrawal (Disburse / Reject) */}
      {isProcessModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {processForm.status === 'paid' ? 'Confirm Payout Disbursal' : 'Reject Withdrawal Request'}
              </h3>
              <button
                onClick={() => setIsProcessModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Staff Member:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedWithdrawal?.staff_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">৳ {Number(selectedWithdrawal?.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method & Account:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedWithdrawal?.payment_method} - {selectedWithdrawal?.account_details}</span>
              </div>
            </div>

            <form onSubmit={handleProcessSubmit} className="space-y-4">
              {processForm.status === 'paid' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Transaction ID / Reference Number
                  </label>
                  <input
                    type="text"
                    value={processForm.transaction_reference}
                    onChange={(e) => setProcessForm({ ...processForm, transaction_reference: e.target.value })}
                    placeholder="e.g. BKASH_TRX_98741258"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={processForm.admin_notes}
                  onChange={(e) => setProcessForm({ ...processForm, admin_notes: e.target.value })}
                  placeholder={processForm.status === 'paid' ? 'e.g. Sent from Official CCA Account' : 'e.g. Reason for rejection'}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProcessModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProcess}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition cursor-pointer ${processForm.status === 'paid'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                >
                  {submittingProcess ? 'Processing...' : (processForm.status === 'paid' ? 'Confirm Payment' : 'Confirm Rejection')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Manual Time Adjustment */}
      {isAdjustModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manual Work-Time Adjustment</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Staff Member
                </label>
                <select
                  value={adjustForm.user_id}
                  onChange={(e) => setAdjustForm({ ...adjustForm, user_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Staff --</option>
                  {staffSchemes.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.name} ({s.email}) — [{s.roles || 'staff'}] - {s.scheme_type === 'YEARLY_CONTRACT' ? '50K Contract' : 'Monthly'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Minutes to Adjust (+ for extra time)
                </label>
                <input
                  type="number"
                  value={adjustForm.minutes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, minutes: e.target.value })}
                  placeholder="e.g. 120 (for 2 hours)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjustment Reason / Audit Note
                </label>
                <textarea
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="e.g. Compensatory time for offline weekend project sprint"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingAdjust ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 4: Detailed Staff Payroll Breakdown & Logs (Rendered via Portal) */}
      {isDetailsModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-5 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Header: User Overview & Top Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <StaffAvatar
                  name={selectedUserPayrollDetails?.user?.name || 'Staff'}
                  picture={selectedUserPayrollDetails?.user?.profile_picture}
                  size="xl"
                  className="ring-4 ring-indigo-500/20 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">
                      {selectedUserPayrollDetails?.user?.name || (detailsLoading ? 'Loading details...' : 'Staff Member')}
                    </h3>
                    {selectedUserPayrollDetails?.user?.student_code && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                        {selectedUserPayrollDetails.user.student_code}
                      </span>
                    )}
                    {selectedUserPayrollDetails?.user?.employee_code && (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">
                        {selectedUserPayrollDetails.user.employee_code}
                      </span>
                    )}
                    {selectedUserPayrollDetails?.summary?.scheme && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedUserPayrollDetails.summary.scheme.scheme_type === 'YEARLY_CONTRACT'
                          ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                      }`}>
                        {selectedUserPayrollDetails.summary.scheme.scheme_type === 'YEARLY_CONTRACT' ? '50K Contract' : 'Monthly Salary'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    <span>{selectedUserPayrollDetails?.user?.email}</span>
                    {selectedUserPayrollDetails?.user?.phone && (
                      <span>• {selectedUserPayrollDetails.user.phone}</span>
                    )}
                    {selectedUserPayrollDetails?.user?.designation && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        • {selectedUserPayrollDetails.user.designation} {selectedUserPayrollDetails.user.department_name ? `(${selectedUserPayrollDetails.user.department_name})` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Close */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                {selectedUserPayrollDetails?.user?.id && (
                  <button
                    onClick={() => handleSyncDetailsAttendance(selectedUserPayrollDetails.user.id)}
                    disabled={syncingAttendance}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition border border-teal-200 dark:border-teal-800 cursor-pointer shadow-xs"
                    title="Re-sync all attendance hours from database"
                  >
                    <FiRefreshCw className={`w-3.5 h-3.5 ${syncingAttendance ? 'animate-spin' : ''}`} />
                    Sync Attendance
                  </button>
                )}
                <button
                  onClick={() => {
                    const userForScheme = staffSchemes.find(s => s.user_id === selectedUserPayrollDetails?.user?.id);
                    if (userForScheme) {
                      setIsDetailsModalOpen(false);
                      handleOpenEditScheme(userForScheme);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                  Edit Scheme
                </button>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {detailsLoading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <FiRefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading detailed breakdown...</p>
              </div>
            ) : selectedUserPayrollDetails ? (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                
                {/* Active Live Session Alert */}
                {selectedUserPayrollDetails.summary?.active_session && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <h5 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          Active Work Session In Progress (Today)
                        </h5>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium">
                          Clocked In at: {selectedUserPayrollDetails.summary.active_session.check_in_time} • Elapsed: {selectedUserPayrollDetails.summary.active_session.elapsed_hours}h ({selectedUserPayrollDetails.summary.active_session.elapsed_minutes}m)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Earned</span>
                      <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        +৳ {Number(selectedUserPayrollDetails.summary.active_session.live_earned || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3 text-emerald-500" /> Total Earned
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      ৳ {Number(selectedUserPayrollDetails.summary?.total_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {selectedUserPayrollDetails.summary?.total_sessions || 0} total sessions
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FiClock className="w-3 h-3 text-indigo-500" /> Total Work Hours
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedUserPayrollDetails.summary?.total_approved_hours || 0} <span className="text-xs text-slate-400 font-normal">hrs</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ({selectedUserPayrollDetails.summary?.total_approved_minutes || 0} mins approved)
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FiArrowUpRight className="w-3 h-3 text-teal-500" /> Available Payout
                    </span>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      ৳ {Number(selectedUserPayrollDetails.summary?.available_withdrawable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Paid: ৳{Number(selectedUserPayrollDetails.summary?.total_withdrawn || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FaCoins className="w-3 h-3 text-amber-500" /> Hourly Rate
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      ৳ {Number(selectedUserPayrollDetails.summary?.scheme?.hourly_rate || 0).toFixed(2)}
                      <span className="text-xs text-slate-400 font-normal">/h</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {selectedUserPayrollDetails.summary?.scheme?.scheme_type === 'YEARLY_CONTRACT'
                        ? `Target: ৳${Number(selectedUserPayrollDetails.summary?.contract_target || 50000).toLocaleString()}`
                        : `Salary: ৳${Number(selectedUserPayrollDetails.summary?.monthly_salary || 0).toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs Selector */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
                  {[
                    { id: 'daily', label: '📅 Daily Breakdown (দিন অনুযায়ী আয়)', count: selectedUserPayrollDetails.daily_breakdown?.length || 0 },
                    { id: 'monthly', label: '📊 Monthly Summary (মাসিক হিসাব)', count: selectedUserPayrollDetails.monthly_breakdown?.length || 0 },
                    { id: 'sessions', label: '⏱️ All Work Sessions (সকল লগ)', count: selectedUserPayrollDetails.earnings?.length || 0 },
                    { id: 'withdrawals', label: '💳 Payout History (উত্তোলন)', count: selectedUserPayrollDetails.withdrawals?.length || 0 },
                    { id: 'scheme', label: '📜 Contract & Rules (চুক্তি)', count: selectedUserPayrollDetails.schemes?.length || 0 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDetailsTab(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeDetailsTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                        activeDetailsTab === tab.id ? 'bg-indigo-700/80 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: DAILY BREAKDOWN */}
                {activeDetailsTab === 'daily' && (
                  <div className="space-y-4">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={dailyFilterMonth}
                          onChange={(e) => setDailyFilterMonth(e.target.value)}
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="ALL">All Months</option>
                          {selectedUserPayrollDetails.monthly_breakdown?.map((m) => (
                            <option key={m.month_key} value={m.month_key}>{m.month_label}</option>
                          ))}
                        </select>

                        <div className="relative flex-1 sm:w-48">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                          <input
                            type="text"
                            value={dailySearchDate}
                            onChange={(e) => setDailySearchDate(e.target.value)}
                            placeholder="Filter by date (YYYY-MM-DD)..."
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 font-medium">
                        Showing {
                          selectedUserPayrollDetails.daily_breakdown?.filter(d => {
                            if (dailyFilterMonth !== 'ALL' && !d.work_date.startsWith(dailyFilterMonth)) return false;
                            if (dailySearchDate && !d.work_date.includes(dailySearchDate)) return false;
                            return true;
                          }).length || 0
                        } days of work history
                      </div>
                    </div>

                    {/* Daily Table */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3.5">Work Date</th>
                            <th className="p-3.5">Time Span (In ➔ Out)</th>
                            <th className="p-3.5">Approved Work</th>
                            <th className="p-3.5">Daily Earned</th>
                            <th className="p-3.5">Sessions</th>
                            <th className="p-3.5">Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {selectedUserPayrollDetails.daily_breakdown?.filter(d => {
                            if (dailyFilterMonth !== 'ALL' && !d.work_date.startsWith(dailyFilterMonth)) return false;
                            if (dailySearchDate && !d.work_date.includes(dailySearchDate)) return false;
                            return true;
                          }).length > 0 ? (
                            selectedUserPayrollDetails.daily_breakdown
                              .filter(d => {
                                if (dailyFilterMonth !== 'ALL' && !d.work_date.startsWith(dailyFilterMonth)) return false;
                                if (dailySearchDate && !d.work_date.includes(dailySearchDate)) return false;
                                return true;
                              })
                              .map((day) => {
                                const formattedDate = new Date(day.work_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                                const isSurplus = parseFloat(day.surplus_earned || 0) > 0;

                                return (
                                  <tr key={day.work_date} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/80 transition">
                                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                                      <div className="flex items-center gap-2">
                                        <FiCalendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span>{formattedDate}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono font-normal ml-5">{day.work_date}</span>
                                    </td>
                                    <td className="p-3.5 font-mono text-xs">
                                      {day.first_session_start ? (
                                        <div className="text-slate-600 dark:text-slate-300">
                                          {new Date(day.first_session_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ➔{' '}
                                          {day.last_session_end ? new Date(day.last_session_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                                        </div>
                                      ) : '—'}
                                    </td>
                                    <td className="p-3.5">
                                      <span className="font-bold text-slate-900 dark:text-white">{day.total_hours} hrs</span>
                                      <span className="text-[10px] text-slate-400 font-normal ml-1.5">({day.total_minutes} mins)</span>
                                    </td>
                                    <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                      ৳ {Number(day.total_earned || 0).toFixed(2)}
                                    </td>
                                    <td className="p-3.5 font-bold">
                                      <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                                        {day.total_sessions} session(s)
                                      </span>
                                    </td>
                                    <td className="p-3.5">
                                      {isSurplus ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                          ✨ 50K Surplus
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                                          Regular Target
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400 font-normal">
                                No daily work records found for this period. Click "Sync Attendance" to fetch logs.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: MONTHLY SUMMARY */}
                {activeDetailsTab === 'monthly' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedUserPayrollDetails.monthly_breakdown?.length > 0 ? (
                        selectedUserPayrollDetails.monthly_breakdown.map((m) => {
                          const avgDailyHours = m.total_days > 0 ? (m.total_hours / m.total_days).toFixed(1) : 0;
                          return (
                            <div
                              key={m.month_key}
                              className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 hover:border-indigo-500/40 transition shadow-xs"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                                  <FiCalendar className="w-4 h-4 text-indigo-500" />
                                  {m.month_label}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                  {m.total_days} Days Worked
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold">Total Work Hours</span>
                                  <div className="font-black text-slate-900 dark:text-white text-sm">
                                    {m.total_hours} <span className="text-[10px] font-normal text-slate-400">hrs</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold">Sessions</span>
                                  <div className="font-black text-slate-900 dark:text-white text-sm">
                                    {m.total_sessions}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold">Total Earned</span>
                                  <div className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                                    ৳ {Number(m.total_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold">Surplus</span>
                                  <div className="font-black text-emerald-500 text-sm">
                                    ৳ {Number(m.surplus_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Avg Work Time:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{avgDailyHours} hrs / day</span>
                              </div>

                              <button
                                onClick={() => setSelectedAdminInvoice({
                                  ...m,
                                  user: selectedUserPayrollDetails.user,
                                  scheme: selectedUserPayrollDetails.summary?.scheme
                                })}
                                className="w-full mt-2 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                              >
                                <FiFileText className="w-3.5 h-3.5" /> View Payslip / Invoice
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full p-8 text-center text-slate-400">
                          No monthly records generated yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: ALL WORK SESSIONS */}
                {activeDetailsTab === 'sessions' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3.5">Date & Time</th>
                            <th className="p-3.5">Duration</th>
                            <th className="p-3.5">Rate Applied</th>
                            <th className="p-3.5">Earned</th>
                            <th className="p-3.5">Source</th>
                            <th className="p-3.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {selectedUserPayrollDetails.earnings?.length > 0 ? (
                            selectedUserPayrollDetails.earnings.map((e) => (
                              <tr key={e.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/80 transition">
                                <td className="p-3.5">
                                  <div className="font-bold text-slate-900 dark:text-white">{e.work_date}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {e.session_start ? new Date(e.session_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} ➔{' '}
                                    {e.session_end ? new Date(e.session_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </div>
                                </td>
                                <td className="p-3.5 font-bold">
                                  {(e.approved_minutes / 60).toFixed(2)} hrs
                                  <div className="text-[10px] text-slate-400 font-normal">({e.approved_minutes} mins)</div>
                                </td>
                                <td className="p-3.5 font-mono">
                                  ৳ {Number(e.applied_rate || 0).toFixed(2)}/h
                                </td>
                                <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                                  ৳ {Number(e.earned_amount || 0).toFixed(2)}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    e.source_type === 'attendance'
                                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                                      : e.source_type === 'timer'
                                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  }`}>
                                    {e.source_type}
                                  </span>
                                </td>
                                <td className="p-3.5 text-[11px] text-slate-400 max-w-xs truncate">
                                  {e.notes || '—'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400">
                                No individual session logs found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: WITHDRAWALS */}
                {activeDetailsTab === 'withdrawals' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3.5">Requested Date</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">Method & Account</th>
                            <th className="p-3.5">Trx ID / Ref</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Admin Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {selectedUserPayrollDetails.withdrawals?.length > 0 ? (
                            selectedUserPayrollDetails.withdrawals.map((w) => (
                              <tr key={w.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition">
                                <td className="p-3.5 font-mono text-xs">
                                  {new Date(w.requested_at).toLocaleDateString()}
                                </td>
                                <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                  ৳ {Number(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3.5">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                                    {w.withdrawal_type === 'CONTRACT_SURPLUS' ? '50K Surplus' : 'Monthly Salary'}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-bold capitalize text-indigo-600 dark:text-indigo-400">{w.payment_method}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{w.account_details || '—'}</div>
                                </td>
                                <td className="p-3.5 font-mono text-xs text-slate-500">
                                  {w.transaction_reference || '—'}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    w.status === 'paid' || w.status === 'approved'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : w.status === 'rejected'
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  }`}>
                                    {w.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-[11px] text-slate-400 max-w-xs truncate">
                                  {w.admin_notes || '—'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400">
                                No withdrawal payout history for this staff member yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 5: SCHEMES & CONTRACT RULES */}
                {activeDetailsTab === 'scheme' && (
                  <div className="space-y-4">
                    {selectedUserPayrollDetails.schemes?.length > 0 ? (
                      selectedUserPayrollDetails.schemes.map((s, idx) => (
                        <div
                          key={s.id}
                          className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                Pay Scheme #{s.id} {idx === 0 && '(Active Scheme)'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {s.status}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                              Created: {new Date(s.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Scheme Type</span>
                              <div className="font-black text-slate-900 dark:text-white">
                                {s.scheme_type === 'YEARLY_CONTRACT' ? '50K Contract Target' : 'Monthly Salary'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold">
                                {s.scheme_type === 'YEARLY_CONTRACT' ? 'Contract Amount' : 'Salary Amount'}
                              </span>
                              <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                ৳ {Number(s.scheme_type === 'YEARLY_CONTRACT' ? s.contract_amount : s.salary_amount).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Hourly Rate</span>
                              <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                ৳ {Number(s.hourly_rate).toFixed(2)}/h
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Contract Period</span>
                              <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                {s.contract_start_date} ➔ {s.contract_end_date || 'Ongoing'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Working Days / Month</span>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{s.working_days_per_month} days</div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Standard Daily Hours</span>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{s.standard_daily_hours} hrs/day</div>
                            </div>
                          </div>

                          {s.notes && (
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                              <strong className="text-slate-700 dark:text-slate-300">Notes:</strong> {s.notes}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">No scheme contract history.</div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">No details available.</div>
            )}
            
            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-400 font-medium">
                💡 Tip: Click "Sync Attendance" anytime to recalculate hours from attendance logs.
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer shadow-sm"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Modal 5: Admin Payslip / Invoice Modal */}
      {selectedAdminInvoice && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                  CCA
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Creative Computer Academy</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official Monthly Payroll Payslip & Statement</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdminInvoice(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Payslip Details Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Payslip No.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">CCA-PS-{selectedAdminInvoice.month_key?.replace('-', '')}-{selectedAdminInvoice.user?.id}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Billing Cycle</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedAdminInvoice.month_label}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Maturity Date</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedAdminInvoice.payout_unlock_date || '15th of next month'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ✅ Verified Statement
                </span>
              </div>
            </div>

            {/* Staff Info */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <StaffAvatar name={selectedAdminInvoice.user?.name} picture={selectedAdminInvoice.user?.profile_picture} size="md" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedAdminInvoice.user?.name}</h4>
                  <p className="text-xs text-slate-400">{selectedAdminInvoice.user?.email} • {selectedAdminInvoice.scheme?.scheme_name || 'Staff Scheme'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate Applied</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">৳{Number(selectedAdminInvoice.scheme?.hourly_rate || 0).toFixed(2)} / hr</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Approved Time</th>
                    <th className="p-3 text-right">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-3 font-medium">
                      Gross Accrued Work Earnings ({selectedAdminInvoice.month_label})
                      <div className="text-[11px] text-slate-400">{selectedAdminInvoice.total_sessions || 0} approved work sessions ({selectedAdminInvoice.total_days || 0} active days)</div>
                    </td>
                    <td className="p-3 text-center font-bold">{selectedAdminInvoice.total_hours} hrs ({selectedAdminInvoice.total_minutes}m)</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white">৳ {Number(selectedAdminInvoice.total_earned || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                    <td className="p-3 font-bold text-emerald-700 dark:text-emerald-300" colSpan={2}>
                      1. Whole Integer Payable (Cashout Limit)
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ৳ {Number(Math.floor(selectedAdminInvoice.total_earned || 0)).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <td className="p-3 text-slate-500 dark:text-slate-400" colSpan={2}>
                      2. Fractional Paisa Rollover (Automatically Carried Forward to Next Cycle)
                    </td>
                    <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                      + ৳ {Number((selectedAdminInvoice.total_earned || 0) - Math.floor(selectedAdminInvoice.total_earned || 0)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notice */}
            <p className="text-[11px] text-slate-400 leading-relaxed text-center">
              This is an official system-generated computerized payslip. Under Creative Computer Academy payroll regulations, payouts mature on the 15th of the following month and roll over seamlessly into subsequent months without expiration.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAdminInvoice(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                <FiPrinter className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
