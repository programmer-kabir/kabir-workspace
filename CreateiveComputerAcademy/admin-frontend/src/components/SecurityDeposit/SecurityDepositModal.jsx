import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiShield,
  FiCheckCircle,
  FiDollarSign,
  FiInfo,
  FiSave,
  FiClock,
  FiPlus,
  FiCalendar,
  FiFileText,
  FiRefreshCw
} from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';

/**
 * SecurityDepositModal
 * Admin Modal to configure and manage Staff Security Deposit (জামানত)
 * implementing Option A living allowance threshold & surplus deposit tracking,
 * complete with date-wise audit ledger history and manual cash logging.
 */
export default function SecurityDepositModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}) {
  const [modalTab, setModalTab] = useState('settings'); // 'settings' | 'ledger'
  const [loading, setLoading] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [targetAmount, setTargetAmount] = useState('20000');
  const [livingAllowance, setLivingAllowance] = useState('5000');
  const [offlineDeposit, setOfflineDeposit] = useState('0');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');

  // Ledger state
  const [ledgerList, setLedgerList] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [depositMeta, setDepositMeta] = useState(null);

  // Manual cash deposit form inside Ledger tab
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualNotes, setManualNotes] = useState('');
  const [recordingEntry, setRecordingEntry] = useState(false);

  // Current deposit state from user summary
  const currentDeposit = user?.wallet_summary?.security_deposit || depositMeta;

  // Extract staff member's actual base salary (বেতন)
  const staffBaseSalary = parseFloat(
    user?.wallet_summary?.monthly_salary ||
    user?.salary_amount ||
    user?.monthly_salary ||
    (user?.tiers && user?.tiers[0]?.monthly_salary) ||
    0
  );

  const fetchLedger = async () => {
    if (!user?.user_id) return;
    try {
      setLedgerLoading(true);
      const res = await axios.get(`${API_BASE}api/security_deposit/get_security_deposit.php?user_id=${user.user_id}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setDepositMeta(res.data.data);
        setLedgerList(res.data.data.ledger || []);
      }
    } catch (err) {
      console.error('Error fetching deposit ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      const userSalary = parseFloat(
        user?.wallet_summary?.monthly_salary ||
        user?.salary_amount ||
        user?.monthly_salary ||
        (user?.tiers && user?.tiers[0]?.monthly_salary) ||
        0
      );

      fetchLedger();

      if (currentDeposit && currentDeposit.has_deposit) {
        setHasDeposit(true);
        setTargetAmount(currentDeposit.target_amount?.toString() || '20000');
        const savedAllowance = parseFloat(currentDeposit.monthly_living_allowance || 0);
        setLivingAllowance(savedAllowance > 0 ? savedAllowance.toString() : (userSalary > 0 ? userSalary.toString() : '5000'));
        setOfflineDeposit(currentDeposit.initial_offline_deposit?.toString() || '0');
        setStatus(currentDeposit.status || 'active');
        setNotes(currentDeposit.notes || '');
      } else {
        setHasDeposit(false);
        setTargetAmount('20000');
        setLivingAllowance(userSalary > 0 ? userSalary.toString() : '5000');
        setOfflineDeposit('0');
        setStatus('exempt');
        setNotes('');
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleToggle = (checked) => {
    setHasDeposit(checked);
    if (!checked) {
      setStatus('exempt');
    } else {
      setStatus('active');
    }
  };

  const handleMarkFulfilled = () => {
    setStatus('fulfilled');
    toast.info('Status set to 100% Fulfilled. Click Save to apply.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}api/security_deposit/save_security_deposit.php`, {
        user_id: user.user_id,
        has_security_deposit: hasDeposit,
        target_amount: parseFloat(targetAmount) || 0,
        monthly_living_allowance: parseFloat(livingAllowance) || staffBaseSalary || 5000,
        initial_offline_deposit: parseFloat(offlineDeposit) || 0,
        status: status,
        notes: notes,
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Security deposit settings updated!');
        fetchLedger();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to save security deposit.');
      }
    } catch (err) {
      console.error('Error saving security deposit:', err);
      toast.error(err.response?.data?.message || 'Network error updating deposit.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (!amt || amt <= 0) {
      toast.error('সঠিক জমার পরিমাণ লিখুন');
      return;
    }
    try {
      setRecordingEntry(true);
      const res = await axios.post(`${API_BASE}api/security_deposit/record_manual_deposit.php`, {
        user_id: user.user_id,
        amount: amt,
        entry_date: manualDate,
        entry_type: 'offline_cash',
        notes: manualNotes || 'অফলাইনে নগদ জমা প্রদান'
      });

      if (res.data?.status === 'success') {
        toast.success(`৳ ${amt.toLocaleString()} টাকা সফলভাবে জামানতে জমা হয়েছে!`);
        setManualAmount('');
        setManualNotes('');
        setShowManualForm(false);
        fetchLedger();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data?.message || 'জমা এন্ট্রি সম্পন্ন হয়নি');
      }
    } catch (err) {
      console.error('Error recording deposit:', err);
      toast.error(err.response?.data?.message || 'জমা রেকর্ড করতে নেটওয়ার্ক সমস্যা হয়েছে');
    } finally {
      setRecordingEntry(false);
    }
  };

  const collected = parseFloat(depositMeta?.collected_amount || currentDeposit?.collected_amount || 0);
  const target = parseFloat(targetAmount || depositMeta?.target_amount || 0);
  const remaining = Math.max(0, target - collected);
  const progressPercent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300/40 flex items-center justify-center text-xl shrink-0">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Security Deposit (জামানত) ব্যবস্থাপনা</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{user.name} ({user.designation || 'Staff'} • {user.department_name || 'CCA'})</span>
                {staffBaseSalary > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    মূল বেতন: ৳ {staffBaseSalary.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setModalTab('settings')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              modalTab === 'settings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FiShield className="w-3.5 h-3.5 text-amber-500" />
            <span>⚙️ জামানত সেটিংস ও লক্ষ্যমাত্রা</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalTab('ledger');
              fetchLedger();
            }}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              modalTab === 'ledger'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FiClock className="w-3.5 h-3.5 text-indigo-500" />
            <span>📜 জমার খতিয়ান ও ডেট হিস্ট্রি</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              modalTab === 'ledger' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {ledgerList.length}
            </span>
          </button>
        </div>

        {/* Summary Metric Ribbon (Visible in both tabs) */}
        {hasDeposit && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-emerald-500/10 dark:from-amber-950/20 dark:via-slate-850 dark:to-emerald-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">১. দেওয়ার কথা (Target)</span>
                <strong className="text-xs md:text-sm font-black text-slate-900 dark:text-white">৳ {target.toLocaleString()}</strong>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">২. এ পর্যন্ত জমা (Paid)</span>
                <strong className="text-xs md:text-sm font-black text-amber-600 dark:text-amber-400">৳ {collected.toLocaleString()}</strong>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">৩. অবশিষ্ট বাকি (Due)</span>
                <strong className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">৳ {remaining.toLocaleString()}</strong>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status === 'fulfilled' || progressPercent >= 100
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>প্রগ্রেস: <strong className="text-amber-600 dark:text-amber-400">{progressPercent}%</strong></span>
                <span>স্ট্যাটাস: <strong className="uppercase">{status}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SETTINGS & CONFIGURATION */}
        {modalTab === 'settings' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Toggle Switch */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer">
                  <span>এই স্টাফের জন্য জামানত প্রযোজ্য করুন</span>
                  {hasDeposit ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      ফুল বেতন (Exempt)
                    </span>
                  )}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  বন্ধ রাখলে স্টাফ তার মোট মাসিক উপার্জনের ১০০% কোনো কর্তন ছাড়া সরাসরি তুলতে পারবে।
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasDeposit}
                  onChange={(e) => handleToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Deposit Configuration Details (shown only if enabled) */}
            {hasDeposit && (
              <div className="space-y-4 animate-fadeIn">
                {/* Grid 1: Target & Allowance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      মোট জামানতের লক্ষ্যমাত্রা (দেওয়ার কথা ৳) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        required
                        min="1000"
                        step="500"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="e.g. 20000"
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      সর্বমোট কত টাকা জামানত তহবিলে জমা রাখতে হবে।
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        মাসিক বেতন / ন্যূনতম খরচ (Salary ৳) *
                      </label>
                      {staffBaseSalary > 0 && (
                        <button
                          type="button"
                          onClick={() => setLivingAllowance(staffBaseSalary.toString())}
                          className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 transition"
                          title="স্টাফের বর্তমান চুক্তিবদ্ধ মূল বেতন বসান"
                        >
                          <span>বেতন: ৳ {staffBaseSalary.toLocaleString()}</span>
                          <span className="font-black text-amber-700 dark:text-amber-300">➔ বসান</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        required
                        min="1000"
                        step="500"
                        value={livingAllowance}
                        onChange={(e) => setLivingAllowance(e.target.value)}
                        placeholder={staffBaseSalary > 0 ? staffBaseSalary.toString() : "5000"}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      স্টাফের নির্ধারিত মাসিক বেতন। প্রতি মাসে এই পরিমাণ নিশ্চিত পাবে, অতিরিক্ত আয় জামানতে যাবে।
                    </p>
                  </div>
                </div>

                {/* Grid 2: Offline Paid & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      পূর্বে অফলাইনে দেওয়া জামানত (Initial Deposit ৳)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={offlineDeposit}
                        onChange={(e) => setOfflineDeposit(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      আগে ক্যাশে বা ব্যাংক একাউন্টে জমা দিয়ে থাকলে এখানে বসান।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      জামানত বর্তমান অবস্থা (Status)
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="active">Active — জামানত চলমান (কর্তন চালু)</option>
                      <option value="fulfilled">Fulfilled — ১০০% সম্পূর্ণ (ফুল বেতন চালু)</option>
                      <option value="paused">Paused — সাময়িক স্থগিত</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Fulfilled হলে কোনো টাকা আর কাটা হবে না।
                    </p>
                  </div>
                </div>

                {/* Option A Policy Ribbon Explainer */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                  <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>অপশন A কার্যকর:</strong> স্টাফের মাসিক আয় থেকে নির্ধারিত বেতন ৳ {Number(livingAllowance || staffBaseSalary || 0).toLocaleString()} সে নিশ্চিতভাবে হাতে পাবে। ৳ {Number(livingAllowance || staffBaseSalary || 0).toLocaleString()}-এর অতিরিক্ত উদ্বৃত্ত অংশ জামানত ফান্ডে জমা হবে যতক্ষণ পর্যন্ত না ৳ {Number(targetAmount || 0).toLocaleString()} পূর্ণ হয়।
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    শর্তাবলী / নোট (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="যেমন: ট্রেনিং সম্পন্ন হওয়ার পর চুক্তিমাফিক জামানত প্রযোজ্য..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Quick 1-Click Fulfill button */}
                {status !== 'fulfilled' && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleMarkFulfilled}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>১-ক্লিকে জামানত ১০০% ফিলাপ মার্ক করুন</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'জামানত সেভ করুন'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DATE-WISE LEDGER & TRANSACTION HISTORY */}
        {modalTab === 'ledger' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Top Action Bar: Add Manual Deposit Entry */}
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">জমার খতিয়ান লগ</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">কোন তারিখে কত জমা হয়েছে তার স্থায়ী অডিট হিস্ট্রি</span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>{showManualForm ? 'ফর্ম বন্ধ করুন' : '+ নগদ জমা এন্ট্রি'}</span>
              </button>
            </div>

            {/* Collapsible Manual Cash Deposit Form */}
            {showManualForm && (
              <form onSubmit={handleManualDepositSubmit} className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <FiDollarSign className="w-4 h-4 text-amber-600" />
                    <span>নতুন অফলাইন/নগদ জামানত এন্ট্রি</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      জমার পরিমাণ (৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="e.g. 2000"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      জমার তারিখ *
                    </label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মন্তব্য / রেফারেন্স
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="যেমন: অফিসে নগদ প্রদান বা মানি রিসিট #1234"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={recordingEntry}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <FiSave className="w-3.5 h-3.5" />
                    <span>{recordingEntry ? 'জমা হচ্ছে...' : 'জমা সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Date-wise Ledger Table */}
            {ledgerLoading ? (
              <div className="text-center py-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                <FiRefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>খতিয়ান লোড হচ্ছে...</span>
              </div>
            ) : ledgerList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
                <FiFileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">এখনো কোনো জমার হিস্ট্রি নেই</p>
                <p className="text-[11px] text-slate-400">
                  স্টাফ নগদ জমা দিলে ওপরের "+ নগদ জমা এন্ট্রি" বাটন দিয়ে যুক্ত করতে পারেন, অথবা মাস শেষে উদ্বৃত্ত স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/90 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">তারিখ / মাস</th>
                      <th className="p-3">লেনদেনের ধরন</th>
                      <th className="p-3 text-right">জমার পরিমাণ</th>
                      <th className="p-3 text-right">তহবিলের স্থিতি</th>
                      <th className="p-3">বিবরণ / নোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {ledgerList.map((entry, idx) => {
                      const isOffline = entry.entry_type === 'offline_cash';
                      const entryDate = entry.entry_date || entry.created_at?.split(' ')[0] || entry.month_key;
                      return (
                        <tr key={entry.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{entryDate}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">মাস: {entry.month_key}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isOffline ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                💵 অফলাইন নগদ জমা
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                🔄 মাসিক উদ্বৃত্ত কর্তন
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            +৳ {parseFloat(entry.deducted_amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                            ৳ {parseFloat(entry.running_total || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[200px] truncate" title={entry.notes}>
                            {entry.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
