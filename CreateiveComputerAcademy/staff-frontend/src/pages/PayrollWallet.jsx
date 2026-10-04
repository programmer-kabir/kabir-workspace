import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle,
  FiArrowUpRight, FiTrendingUp, FiShield, FiSend, FiRefreshCw,
  FiCalendar, FiLayers, FiInfo
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CCA_Server/';
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
    xl: 'w-16 h-16 text-xl font-black',
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
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr ${gradient} text-white font-black flex items-center justify-center shrink-0 shadow-lg uppercase select-none ${className}`}
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

export default function PayrollWallet() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const fetchPayroll = async (isSilent = false) => {
    if (!currentUser?.id) return;
    try {
      if (!isSilent) setLoading(true);
      else setSyncing(true);
      const res = await axios.get(`${API_BASE}api/payroll/get_my_payroll.php?user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        setData(res.data);
      } else if (!isSilent) {
        toast.error(res.data.message || 'Failed to load payroll data.');
      }
    } catch (err) {
      if (!isSilent) toast.error('Network error loading payroll information.');
    } finally {
      if (!isSilent) setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    // Auto-refresh every 60 seconds for live earning updates
    const interval = setInterval(() => {
      fetchPayroll(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }

    const available = data?.summary?.available_withdrawable || 0;
    if (amountNum > available) {
      toast.error(`Amount exceeds available withdrawable balance (৳${available.toLocaleString()}).`);
      return;
    }

    if (!accountDetails.trim()) {
      toast.error('Please enter your account number/phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}api/payroll/request_withdrawal.php`, {
        user_id: currentUser.id,
        amount: amountNum,
        payment_method: paymentMethod,
        account_details: accountDetails.trim()
      });

      if (res.data.status === 'success') {
        toast.success('Withdrawal request submitted successfully!');
        setIsModalOpen(false);
        setWithdrawAmount('');
        setAccountDetails('');
        fetchPayroll();
      } else {
        toast.error(res.data.message || 'Failed to submit withdrawal.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading your payroll and wallet summary...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const hasScheme = data?.has_scheme;
  const scheme = summary?.scheme || {};
  const isYearlyContract = scheme.scheme_type === 'YEARLY_CONTRACT';
  const progressPercent = summary.progress_percent || 0;
  const targetCompleted = summary.target_completed;

  return (
    <div className="mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <StaffAvatar
            name={currentUser?.name}
            picture={currentUser?.profile_picture}
            size="xl"
            className="border-2 border-indigo-400/40 shadow-lg shrink-0"
          />
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <FiShield className="w-3.5 h-3.5" />
              {isYearlyContract ? 'Yearly Company Contract' : 'Monthly Salary Scheme'}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {currentUser?.name}'s Work Wallet
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-xl">
              {isYearlyContract
                ? 'Your approved work time contributes to your ৳50,000 Company Target. Once complete, 100% of all additional earnings are yours to withdraw!'
                : 'Your salary is computed dynamically from your approved work time (8 standard hours base divisor + overtime).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchPayroll}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/10"
            title="Refresh"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
          {hasScheme && (
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={summary.available_withdrawable <= 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition duration-200 ${summary.available_withdrawable > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
            >
              <FiArrowUpRight className="w-5 h-5" />
              Request Withdrawal
            </button>
          )}
        </div>
      </div>

      {!hasScheme ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-6 rounded-3xl text-center space-y-3">
          <FiAlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Active Pay Scheme Configured</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your payroll scheme is currently pending assignment by the administrator. Please reach out to management.
          </p>
        </div>
      ) : (
        <>
          {/* Active Ongoing Shift Live Earning Banner */}
          {summary.active_session && (
            <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden animate-pulse-subtle">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping absolute" />
                  <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full z-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Live Shift In Progress
                    </span>
                    <span className="text-xs text-slate-400">
                      Checked in at {summary.active_session.check_in_time}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    Currently Working: <span className="text-emerald-300">{summary.active_session.elapsed_hours} hrs</span> ({summary.active_session.elapsed_minutes} mins)
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-slate-900/80 px-5 py-3 rounded-2xl border border-emerald-500/20">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Live Session Earnings</div>
                  <div className="text-xl font-black text-emerald-400">
                    + ৳ {Number(summary.active_session.live_earned || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Hourly Rate</div>
                  <div className="text-sm font-bold text-slate-200">
                    ৳ {Number(summary.active_session.hourly_rate || 0).toFixed(2)}/h
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main 3-Pillar Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Hourly Rate snapshot */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Hourly Earning Rate</span>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <FiClock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                ৳ {Number(scheme.hourly_rate || 0).toFixed(2)}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">/ hr</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Based on {scheme.working_days_per_month || 26} days × 8 standard base hours
              </p>
            </div>

            {/* Card 2: Actual Work Hours */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Approved Time</span>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {summary.total_approved_hours || 0}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">hrs ({summary.total_approved_minutes || 0}m)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Across {summary.total_sessions || 0} tracked work sessions (no 8h daily limit)
              </p>
            </div>

            {/* Card 3: Total Cumulative Earned */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Work Earned</span>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <FaCoins className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                ৳ {Number(summary.total_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {isYearlyContract ? `Company Cap: ৳${Number(summary.contract_target || 50000).toLocaleString()}` : 'Monthly Work Earnings'}
              </p>
            </div>

            {/* Card 4: Available for Withdrawal */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/10 relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-100 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Available Cashout</span>
                <div className="p-2.5 bg-white/20 rounded-2xl text-white">
                  <FiDollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">
                ৳ {Number(summary.available_withdrawable || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-100 mt-2">
                {isYearlyContract ? '100% Surplus (Unlocked after 50K)' : 'Available for payout'}
              </p>
            </div>
          </div>

          {/* Yearly Contract Speedometer / Progress Bar (If Yearly Contract) */}
          {isYearlyContract && (
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Company Contract Target: ৳{Number(summary.contract_target || 50000).toLocaleString()}
                    </h3>
                    {targetCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
                        <FiCheckCircle className="w-4 h-4" /> 100% Completed!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Contract Period: {scheme.contract_start_date} to {scheme.contract_end_date} (1-Year Duration)
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {progressPercent.toFixed(1)}%
                  </span>
                  <p className="text-xs text-slate-400 font-medium">Progress to Unlock Surplus</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${targetCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                    }`}
                  style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
                />
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">1. Company Reserved</span>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                    ৳ {Number(summary.company_reserved || 0).toLocaleString()} / ৳{Number(summary.contract_target || 50000).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">One-time commitment for the full year</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">2. Staff Surplus Earned</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ৳ {Number(summary.staff_surplus_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">100% staff share after 50K milestone</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">3. Total Withdrawn / Pending</span>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                    ৳ {Number(summary.total_withdrawn || 0).toLocaleString()} <span className="text-xs text-amber-500 font-normal">({Number(summary.pending_withdrawn || 0).toLocaleString()} pending)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Disbursed via bKash / Bank</p>
                </div>
              </div>
            </div>
          )}

          {/* Tables: Earnings & Withdrawals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Work Sessions Table */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiClock className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Work-Time Earnings</h3>
                </div>
                <span className="text-xs font-medium text-slate-400">Latest 50 entries</span>
              </div>

              <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                    <tr>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Duration</th>
                      <th className="pb-3 font-semibold">Rate Snapshot</th>
                      <th className="pb-3 font-semibold">Earned</th>
                      <th className="pb-3 font-semibold text-right">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                    {data.recent_earnings && data.recent_earnings.length > 0 ? (
                      data.recent_earnings.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.work_date}</td>
                          <td className="py-3">{item.approved_minutes} mins ({(item.approved_minutes / 60).toFixed(1)}h)</td>
                          <td className="py-3">৳ {Number(item.applied_rate).toFixed(2)}/h</td>
                          <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">৳ {Number(item.earned_amount).toFixed(2)}</td>
                          <td className="py-3 text-right">
                            {item.is_surplus == 1 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">Surplus</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">Contract</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                          No work sessions logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Withdrawal History</h3>
                </div>
                <span className="text-xs font-medium text-slate-400">All Payout Requests</span>
              </div>

              <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                    <tr>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">Trx / Ref</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                    {data.recent_withdrawals && data.recent_withdrawals.length > 0 ? (
                      data.recent_withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{w.requested_at?.split(' ')[0]}</td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">৳ {Number(w.amount).toFixed(2)}</td>
                          <td className="py-3 capitalize">{w.payment_method}</td>
                          <td className="py-3 text-slate-400 font-mono text-[11px]">{w.transaction_reference || '—'}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${w.status === 'paid' || w.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : w.status === 'rejected'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}>
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                          No withdrawal requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Withdrawal Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request Payout</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Available for Cashout
                </label>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Withdrawable Balance</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ৳ {Number(summary.available_withdrawable || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Amount to Withdraw (৳)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(summary.available_withdrawable || '')}
                    className="absolute right-2 top-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-200 transition"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="bkash">bKash Personal</option>
                  <option value="nagad">Nagad Personal</option>
                  <option value="rocket">Rocket</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Office Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Account Details / Phone Number
                </label>
                <textarea
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX (bKash Personal) or Bank Account Name, A/C No, Branch"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
