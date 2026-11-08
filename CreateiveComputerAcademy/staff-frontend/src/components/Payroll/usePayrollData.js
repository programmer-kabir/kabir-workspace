import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';

export function usePayrollData() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Timeframe filter state: 'today' | 'this_week' | 'this_month' | 'all_time'
  const [timeFilter, setTimeFilter] = useState('today');
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Modal & Payout states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [submitting, setSubmitting] = useState(false);
  const [savedPayoutSettings, setSavedPayoutSettings] = useState(null);
  const [includeOvertimeCashout, setIncludeOvertimeCashout] = useState(false);

  const fetchPayoutSettings = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${API_BASE}api/payroll/get_payout_settings.php?user_id=${currentUser.id}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setSavedPayoutSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching payout settings:', err);
    }
  };

  const openWithdrawModal = () => {
    setIncludeOvertimeCashout(false);
    const baseVal = Math.floor(Number(data?.summary?.available_withdrawable || 0));
    setWithdrawAmount(baseVal > 0 ? baseVal : '');
    setPaymentMethod(savedPayoutSettings?.account_number ? (savedPayoutSettings.payment_method || 'bkash') : 'cash');
    setIsModalOpen(true);
  };

  const fetchPayroll = async (isSilent = false) => {
    if (!currentUser?.id) return;
    try {
      if (!isSilent) setLoading(true);
      else setSyncing(true);
      const res = await axios.get(`${API_BASE}api/payroll/get_my_payroll.php?user_id=${currentUser.id}`);
      if (res.data?.status === 'success') {
        setData(res.data);
      } else if (!isSilent) {
        toast.error(res.data?.message || 'Failed to load payroll data.');
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
    fetchPayoutSettings();
    const interval = setInterval(() => fetchPayroll(true), 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Live ticking timer for ongoing shift
  useEffect(() => {
    const activeStart = data?.summary?.active_session?.session_start;
    if (!activeStart) {
      setLiveSeconds(0);
      return;
    }
    const calcSeconds = () => {
      const startTs = new Date(activeStart.replace(' ', 'T')).getTime();
      return Math.max(0, Math.floor((Date.now() - startTs) / 1000));
    };
    setLiveSeconds(calcSeconds());
    const interval = setInterval(() => setLiveSeconds(calcSeconds()), 1000);
    return () => clearInterval(interval);
  }, [data?.summary?.active_session?.session_start]);

  const summary = data?.summary || {};
  const hasScheme = Boolean(data?.has_scheme);
  const scheme = summary?.scheme || {};
  const isYearlyContract = scheme.scheme_type === 'YEARLY_CONTRACT';
  const isStaggeredContract = scheme.scheme_type === 'STAGGERED_CONTRACT';
  const contractRoadmap = summary?.contract_roadmap || null;
  const activeTier = summary?.active_tier || null;
  const progressPercent = summary.progress_percent || 0;
  const targetCompleted = Boolean(summary.target_completed);

  const activeHourlyRate = Number(activeTier?.hourly_rate || summary?.active_session?.hourly_rate || scheme.hourly_rate || 0);
  const liveEarned = (liveSeconds / 3600) * activeHourlyRate;
  const liveTotalMinutes = Math.floor(liveSeconds / 60);
  const liveClockHours = Math.floor(liveTotalMinutes / 60);
  const liveClockMinutes = liveTotalMinutes % 60;
  const liveSecsRemainder = liveSeconds % 60;
  const liveHumanTime = liveClockHours > 0 ? `${liveClockHours}h ${liveClockMinutes}m` : `${liveClockMinutes}m`;
  const hasActiveShift = Boolean(summary?.active_session);
  const periodStats = summary?.period_stats || {};

  // Date filters for client calculations
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dayOfWeek = now.getDay();
  const diffToSat = (dayOfWeek + 1) % 7;
  const satDate = new Date(now);
  satDate.setDate(now.getDate() - diffToSat);
  const weekStartStr = `${satDate.getFullYear()}-${String(satDate.getMonth() + 1).padStart(2, '0')}-${String(satDate.getDate()).padStart(2, '0')}`;
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  let basePeriodEarned = 0, basePeriodMinutes = 0, basePeriodSessions = 0;
  if (timeFilter === 'today') {
    basePeriodEarned = Number(periodStats.today?.earned ?? 0);
    basePeriodMinutes = Number(periodStats.today?.minutes ?? 0);
    basePeriodSessions = Number(periodStats.today?.sessions ?? 0);
  } else if (timeFilter === 'this_week') {
    basePeriodEarned = Number(periodStats.this_week?.earned ?? 0);
    basePeriodMinutes = Number(periodStats.this_week?.minutes ?? 0);
    basePeriodSessions = Number(periodStats.this_week?.sessions ?? 0);
  } else if (timeFilter === 'this_month') {
    basePeriodEarned = Number(periodStats.this_month?.earned ?? 0);
    basePeriodMinutes = Number(periodStats.this_month?.minutes ?? 0);
    basePeriodSessions = Number(periodStats.this_month?.sessions ?? 0);
  } else {
    basePeriodEarned = Number(summary.total_earned ?? periodStats.all_time?.earned ?? 0);
    basePeriodMinutes = Number(summary.total_approved_minutes ?? periodStats.all_time?.minutes ?? 0);
    basePeriodSessions = Number(summary.total_sessions ?? periodStats.all_time?.sessions ?? 0);
  }

  const currentPeriodEarned = basePeriodEarned + (hasActiveShift ? liveEarned : 0);
  const currentPeriodMinutes = basePeriodMinutes + (hasActiveShift ? liveTotalMinutes : 0);
  const currentPeriodHours = (currentPeriodMinutes / 60).toFixed(1);
  const currentPeriodSessions = basePeriodSessions + (hasActiveShift ? 1 : 0);

  const filteredEarnings = (data?.recent_earnings || []).filter((item) => {
    if (timeFilter === 'all_time') return true;
    const itemDate = item.work_date;
    if (!itemDate) return true;
    if (timeFilter === 'today') return itemDate === todayStr;
    if (timeFilter === 'this_week') return itemDate >= weekStartStr;
    if (timeFilter === 'this_month') return itemDate >= monthStartStr;
    return true;
  });

  const filterSubtitles = {
    today: hasActiveShift ? "🔴 লাইভ ডিউটি চালু রয়েছে (প্রতি সেকেন্ডে ইনকাম বাড়ছে)" : "আজকের সম্পন্ন সকল শিফটের মোট উপার্জন",
    this_week: `সপ্তাহের শুরু (${weekStartStr}) থেকে আজকের দিন পর্যন্ত মোট আয়`,
    this_month: `চলতি মাসের ১ তারিখ (${monthStartStr}) থেকে আজকের দিন পর্যন্ত মোট আয়`,
    all_time: "কাজের শুরুর দিন থেকে অদ্যাবধি সর্বমোট অর্জিত মোট উপার্জন",
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }

    const totalFunds = Number(summary.available_withdrawable_total ?? summary.available_withdrawable ?? 0) +
      (includeOvertimeCashout ? Number(summary.overtime_bank?.cash_value || 0) : 0);
    const available = Math.floor(totalFunds);
    const minLimit = Number(summary.min_withdrawal_limit || 0);

    if (minLimit > 0 && amountNum < minLimit) {
      toast.error(`উত্তোলন করতে ন্যূনতম ৳${minLimit.toLocaleString()} প্রয়োজন। দয়া করে ওভারটাইম যোগ করুন অথবা ব্যালেন্স পরবর্তী মাসের সাথে রোলওভার হবে।`);
      return;
    }

    if (amountNum > available) {
      toast.error(`Amount exceeds available withdrawable balance (৳${Math.floor(available).toLocaleString()}).`);
      return;
    }

    let finalDetails = '';
    if (paymentMethod === 'cash') {
      finalDetails = 'Office Cash In-Hand (অফিস থেকে ক্যাশ গ্রহণ)';
    } else {
      if (!savedPayoutSettings || !savedPayoutSettings.account_number) {
        toast.error('আপনার প্রোফাইলে এই মেথডের তথ্য সেভ করা নেই। দয়া করে প্রোফাইলে গিয়ে সেটআপ করুন অথবা Cash নির্বাচন করুন।');
        return;
      }
      if (paymentMethod === 'bank' || savedPayoutSettings.payment_method === 'bank') {
        const parts = [
          `A/C: ${savedPayoutSettings.account_number}`,
          savedPayoutSettings.account_holder_name ? `Holder: ${savedPayoutSettings.account_holder_name}` : '',
          savedPayoutSettings.bank_name ? `Bank: ${savedPayoutSettings.bank_name}` : '',
          savedPayoutSettings.branch_name ? `Branch: ${savedPayoutSettings.branch_name}` : '',
          savedPayoutSettings.routing_number ? `Routing: ${savedPayoutSettings.routing_number}` : '',
        ].filter(Boolean);
        finalDetails = parts.join(', ');
      } else {
        finalDetails = `${savedPayoutSettings.account_number} (${paymentMethod.toUpperCase()} Personal)`;
      }
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}api/payroll/request_withdrawal.php`, {
        user_id: currentUser?.id,
        amount: amountNum,
        payment_method: paymentMethod,
        account_details: finalDetails,
        overtime_hours: includeOvertimeCashout ? (summary.overtime_bank?.available_hours || 0) : 0,
      });

      if (res.data?.status === 'success') {
        toast.success('Withdrawal request submitted successfully!');
        setIsModalOpen(false);
        setWithdrawAmount('');
        fetchPayroll();
      } else {
        toast.error(res.data?.message || 'Failed to submit withdrawal.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    currentUser, loading, syncing, data, summary, hasScheme, scheme,
    isYearlyContract, isStaggeredContract, contractRoadmap, activeTier,
    progressPercent, targetCompleted, activeHourlyRate, liveEarned,
    liveTotalMinutes, liveClockHours, liveClockMinutes, liveSecsRemainder,
    liveHumanTime, hasActiveShift, timeFilter, setTimeFilter,
    currentPeriodEarned, currentPeriodMinutes, currentPeriodHours,
    currentPeriodSessions, filteredEarnings, filterSubtitles, todayStr,
    isModalOpen, setIsModalOpen, openWithdrawModal, selectedInvoice,
    setSelectedInvoice, withdrawAmount, setWithdrawAmount, paymentMethod,
    setPaymentMethod, savedPayoutSettings, includeOvertimeCashout,
    setIncludeOvertimeCashout, submitting, handleWithdrawSubmit, fetchPayroll,
  };
}

export default usePayrollData;
