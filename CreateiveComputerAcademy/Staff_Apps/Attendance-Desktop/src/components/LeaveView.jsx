import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { getApiBase } from '../utils/api';
import { soundFx } from '../utils/soundFx';
import { toast } from 'sonner';
import {
  FiCalendar,
  FiFileText,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiFilter,
  FiInfo,
  FiAlertTriangle,
  FiChevronRight,
  FiSearch,
  FiCheck
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const LeaveView = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const API_BASE = (getApiBase() || '').replace(/\/+$/, '');
  const userId = currentUser?.id || currentUser?.user_id;

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [studentQuota, setStudentQuota] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Approved' | 'Rejected' | 'Student'

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Casual');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState(null);

  // Fetch Leaves
  const fetchLeaves = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/leave/get_my_leaves.php`, {
        user_id: userId
      });
      if (res.data?.status === 'success') {
        setLeaves(res.data.leaves || []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Student Quota
  const fetchStudentQuota = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/leave/get_student_quota.php?user_id=${userId}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setStudentQuota(res.data.data);
        if (res.data.data.is_student) {
          setType('Student Academic Leave');
        }
      }
    } catch (e) {
      console.warn('Student quota fetch notice:', e);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLeaves();
      fetchStudentQuota();
    }
  }, [userId]);

  // Calculate inclusive calendar days
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // inclusive
  };

  // Calculate working days excluding Friday (same logic as backend StudentLeaveHelper)
  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    let cur = new Date(start);
    const endD = new Date(end);
    let days = 0;
    while (cur <= endD) {
      // 5 is Friday in ISO (0 is Sunday, 5 is Friday in standard getDay: Sunday=0, Friday=5)
      if (cur.getDay() !== 5) {
        days++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  // Stats calculation
  const calculateStats = () => {
    let casual = 0;
    let medical = 0;
    let pending = 0;
    let unpaid = 0;
    let student = 0;

    leaves.forEach((leave) => {
      const days = calculateDays(leave.start_date, leave.end_date);
      if (leave.status === 'Pending') {
        pending += days;
      } else if (leave.status === 'Approved') {
        if (leave.type === 'Casual') casual += days;
        else if (leave.type === 'Medical') medical += days;
        else if (leave.type === 'Student Academic Leave') student += days;
        else unpaid += days;
      }
    });

    return { casual, medical, pending, unpaid, student };
  };

  const stats = calculateStats();
  const selectedDays = calculateDays(startDate, endDate);
  const selectedWorkingDays = calculateWorkingDays(startDate, endDate);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      toast.error('Please fill in start date, end date, and reason.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setMessage({ text: 'End date cannot be earlier than start date.', type: 'error' });
      toast.error('End date cannot be earlier than start date.');
      return;
    }

    if (type === 'Student Academic Leave') {
      if (!studentQuota?.is_student) {
        setMessage({ text: 'Only verified college/university students can select this leave type.', type: 'error' });
        toast.error('Student Academic Leave is only available for student staff.');
        return;
      }
      if (selectedWorkingDays > (studentQuota?.remaining_days || 0)) {
        const msg = `Requested ${selectedWorkingDays} working days exceed your available student quota (${studentQuota?.remaining_days || 0} days remaining).`;
        setMessage({ text: msg, type: 'error' });
        toast.error(msg);
        return;
      }
    }

    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(`${API_BASE}/api/leave/apply_leave.php`, {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        type: type,
        reason: reason.trim()
      });

      if (res.data?.status === 'success') {
        setMessage({ text: 'Leave application submitted successfully for Admin approval!', type: 'success' });
        toast.success('Leave application submitted successfully!', {
          description: `Dates: ${startDate} to ${endDate} (${selectedDays} days)`
        });
        soundFx.playSuccess();

        // Reset inputs
        setStartDate('');
        setEndDate('');
        setReason('');
        if (!studentQuota?.is_student) {
          setType('Casual');
        }

        fetchLeaves();
        fetchStudentQuota();
      } else {
        const errorMsg = res.data?.message || 'Failed to submit application.';
        setMessage({ text: errorMsg, type: 'error' });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Submit leave error:', error);
      const serverMsg = error?.response?.data?.message || 'Server connection error occurred.';
      setMessage({ text: serverMsg, type: 'error' });
      toast.error(serverMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter leaves based on search & category
  const filteredLeaves = leaves.filter((leave) => {
    // Status / Category tab filter
    if (statusFilter === 'Pending' && leave.status !== 'Pending') return false;
    if (statusFilter === 'Approved' && leave.status !== 'Approved') return false;
    if (statusFilter === 'Rejected' && leave.status !== 'Rejected') return false;
    if (statusFilter === 'Student' && leave.type !== 'Student Academic Leave') return false;

    // Search term filter
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (leave.type || '').toLowerCase().includes(term) ||
      (leave.reason || '').toLowerCase().includes(term) ||
      (leave.status || '').toLowerCase().includes(term) ||
      (leave.admin_comment || '').toLowerCase().includes(term) ||
      (leave.start_date || '').toLowerCase().includes(term) ||
      (leave.end_date || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <FiCalendar size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Leave Management & Student Academic Quota
              </h1>
              {studentQuota?.is_student && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  🎓 Student Staff
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Apply for casual, medical, and academic leave. Live tracking of approval status and zero mango overtime deduction quota.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchLeaves();
              fetchStudentQuota();
            }}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Refresh Leave History"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Hero Leave Balance & Stats Cards */}
      <div className={`grid grid-cols-1 ${studentQuota?.is_student ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4 sm:gap-6`}>
        {/* Student Academic Quota Card */}
        {studentQuota?.is_student && (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30">
            <div className="absolute top-0 right-0 p-4 opacity-15 text-6xl pointer-events-none select-none">
              🎓
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                Monthly Quota
              </span>
            </div>
            <h3 className="text-sm font-semibold text-indigo-100 mb-1">Student Leave Left</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight">{studentQuota.remaining_days}</span>
              <span className="text-sm font-medium text-indigo-200">/ {studentQuota.monthly_quota} Days</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-indigo-200 font-medium">
              <span>Unpaid Day</span>
              <span className="text-emerald-300 font-bold">Zero Mango Cut 🥭</span>
            </div>
          </div>
        )}

        {/* Casual Leaves Taken */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/20 border border-emerald-400/30">
          <div className="absolute top-0 right-0 p-4 opacity-15 text-emerald-100 pointer-events-none">
            <FiCheckCircle size={68} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
            Approved Casual
          </span>
          <h3 className="text-sm font-semibold text-emerald-100 mt-2 mb-1">Casual Leaves Taken</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight">{stats.casual}</span>
            <span className="text-sm font-medium text-emerald-200">Days</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 text-[11px] text-emerald-100/80 font-medium">
            Paid annual casual quota
          </div>
        </div>

        {/* Medical Leaves Taken */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 border border-blue-400/30">
          <div className="absolute top-0 right-0 p-4 opacity-15 text-blue-100 pointer-events-none">
            <FiCalendar size={68} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
            Approved Medical
          </span>
          <h3 className="text-sm font-semibold text-blue-100 mt-2 mb-1">Medical Leaves Taken</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight">{stats.medical}</span>
            <span className="text-sm font-medium text-blue-200">Days</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 text-[11px] text-blue-100/80 font-medium">
            Medical certificates applied
          </div>
        </div>

        {/* Pending Approval */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-6 text-white shadow-lg shadow-amber-600/20 border border-amber-400/30">
          <div className="absolute top-0 right-0 p-4 opacity-15 text-amber-100 pointer-events-none">
            <FiClock size={68} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
            Under Review
          </span>
          <h3 className="text-sm font-semibold text-amber-100 mt-2 mb-1">Pending Approval</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight">{stats.pending}</span>
            <span className="text-sm font-medium text-amber-200">Days</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 text-[11px] text-amber-100/80 font-medium">
            Awaiting Admin review
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Apply Form (5 cols on lg) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiSend className="text-blue-600 dark:text-blue-400" /> Apply for Official Leave
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">Fast Review</span>
            </div>

            <div className="p-6">
              {message && (
                <div
                  className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-3 transition-all ${
                    message.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <FiCheckCircle className="mt-0.5 text-base shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <FiAlertTriangle className="mt-0.5 text-base shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="leading-relaxed">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Dates Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Start Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={15} />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block pl-10 pr-3 py-2.5 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      End Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={15} />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block pl-10 pr-3 py-2.5 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Badge */}
                {startDate && endDate && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between text-xs font-bold text-blue-800 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <FiClock size={14} /> Total Duration:
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 shadow-2xs font-black">
                      {selectedDays} Calendar Day{selectedDays > 1 ? 's' : ''}
                      {type === 'Student Academic Leave' && ` (${selectedWorkingDays} Working Day${selectedWorkingDays > 1 ? 's' : ''})`}
                    </span>
                  </div>
                )}

                {/* Leave Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Leave Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all cursor-pointer"
                  >
                    {studentQuota?.is_student && (
                      <option value="Student Academic Leave">
                        🎓 Student Academic Leave ({studentQuota.remaining_days} days left this month)
                      </option>
                    )}
                    <option value="Casual">Casual Leave (Paid Annual)</option>
                    <option value="Medical">Medical Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>

                  {/* Student Academic Leave Bengali Explainer */}
                  {type === 'Student Academic Leave' && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                        <span>🎓 স্টুডেন্ট একাডেমিক ছুটি নীতিমালা:</span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        এই ছুটির জন্য কর্মদিবসের কোনো বেতন প্রদান হবে না (Unpaid Day), তবে আপনার আম গাছ (Mango Overtime) ব্যালেন্স থেকে <strong>১ মিনিটও কাটা হবে না</strong> এবং কোনো জরিমানা হবে না।
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[11px] font-semibold border-t border-indigo-200/60 dark:border-indigo-800/60">
                        <span>চলতি মাসের অবশিষ্ট কোটা:</span>
                        <strong className="text-indigo-700 dark:text-indigo-300">{studentQuota?.remaining_days || 0} দিন</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Reason for Leave
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Be specific</span>
                  </div>
                  <div className="relative">
                    <FiFileText className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" size={15} />
                    <textarea
                      rows="4"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain your reason (e.g. semester exam, personal emergency, medical sickness)..."
                      className="w-full bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block pl-10 pr-3 py-3 outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                      required
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Submit Application <FiSend size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Leave History & Tracking (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                My Leave Application History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredLeaves.length} record{filteredLeaves.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'Pending', label: 'Pending' },
                { id: 'Approved', label: 'Approved' },
                { id: 'Rejected', label: 'Rejected' },
                ...(studentQuota?.is_student ? [{ id: 'Student', label: '🎓 Student' }] : [])
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leaves List */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-xs font-semibold text-slate-500">Loading leave applications...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FiCalendar size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                {searchTerm || statusFilter !== 'all' ? 'No Matching Leaves Found' : 'No Leave History'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
                {searchTerm
                  ? `No leave records matching "${searchTerm}". Try clearing your search term.`
                  : statusFilter !== 'all'
                  ? `No applications found with status "${statusFilter}".`
                  : "You haven't submitted any leave applications yet. Fill the form to apply."}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredLeaves.map((leave) => {
                const isStudentLeave = leave.type === 'Student Academic Leave';
                const duration = calculateDays(leave.start_date, leave.end_date);

                return (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              isStudentLeave
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : leave.type === 'Casual'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : leave.type === 'Medical'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isStudentLeave ? '🎓 Student Academic' : leave.type}
                          </span>

                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {new Date(leave.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {leave.start_date !== leave.end_date &&
                              ` → ${new Date(leave.end_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}`}
                          </span>

                          <span className="text-[11px] font-semibold text-slate-400">
                            ({duration} {duration === 1 ? 'day' : 'days'})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 font-medium">
                          Applied on {new Date(leave.created_at || leave.start_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {leave.status === 'Approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                            <FiCheckCircle className="text-emerald-500" size={14} /> Approved
                          </span>
                        ) : leave.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
                            <FiXCircle className="text-rose-500" size={14} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
                            <FiClock className="text-amber-500 animate-pulse" size={14} /> Pending Approval
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reason Text */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p>
                        <span className="font-bold text-slate-800 dark:text-slate-200 mr-1.5">Reason:</span>
                        {leave.reason}
                      </p>
                    </div>

                    {/* Admin Comment Note */}
                    {leave.admin_comment && (
                      <div className="mt-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl p-3.5 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                        <FiMessageSquare className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" size={15} />
                        <div>
                          <p className="font-extrabold text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-0.5">
                            Admin Note
                          </p>
                          <p className="leading-relaxed">{leave.admin_comment}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveView;
