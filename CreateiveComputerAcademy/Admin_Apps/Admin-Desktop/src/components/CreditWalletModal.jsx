import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiSend,
  FiTrendingUp,
  FiTrendingDown,
  FiAward,
  FiAlertTriangle,
  FiClock,
  FiUser,
  FiSearch,
  FiCheckCircle,
  FiInfo,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiRefreshCw,
  FiShield
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import { useAuth, getApiBase } from '../context/AuthContext';

const CreditWalletModal = ({ isOpen, onClose, user, onBalanceChange }) => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'send' | 'admin' | 'rules'
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Send credits form state
  const [users, setUsers] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Admin Direct Adjust State
  const [adminTargetUser, setAdminTargetUser] = useState(null);
  const [adminAdjustAmount, setAdminAdjustAmount] = useState('');
  const [adminAdjustType, setAdminAdjustType] = useState('bonus'); // 'bonus' | 'admin_grant' | 'admin_deduct'
  const [adminAdjustReason, setAdminAdjustReason] = useState('');
  const [adminAdjusting, setAdminAdjusting] = useState(false);

  const rawApiBase = getApiBase();
  const API_BASE = rawApiBase.replace(/\/+$/, '');

  const getAuthToken = () => {
    return localStorage.getItem('cca_admin_desktop_token') ||
           localStorage.getItem('cca_admin_token') ||
           localStorage.getItem('cca_token') || '';
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Wallet Data
  const fetchWallet = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${user.id}&token=${token}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setWallet(data.wallet);
        if (onBalanceChange) {
          onBalanceChange(data.wallet.balance);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferUsers = async (query = '') => {
    setLoadingUsers(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/credits/get_users.php?exclude_user_id=${user?.id || 0}&q=${encodeURIComponent(query)}&token=${token}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching transfer users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchWallet();
      fetchTransferUsers();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (activeTab === 'send' || activeTab === 'admin') {
      const timer = setTimeout(() => {
        fetchTransferUsers(searchUserQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchUserQuery, activeTab]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('টিম মেম্বার সিলেক্ট করুন।');
      return;
    }

    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('সঠিক ক্রেডিটের পরিমাণ দিন।');
      return;
    }

    if (!wallet || wallet.balance < amt) {
      toast.error(`আপনার পর্যাপ্ত ক্রেডিট নেই। বর্তমান ব্যালেন্স ${wallet?.balance || 0} ক্রেডিট।`);
      return;
    }

    setTransferring(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/credits/send_credits.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          amount: amt,
          notes: transferNotes.trim(),
          token
        })
      });
      const data = await res.json();

      if (data.status === 'success') {
        toast.success(`সফলভাবে ${selectedUser.name}-কে ${amt} ক্রেডিট পাঠানো হয়েছে!`);
        setSelectedUser(null);
        setTransferAmount('');
        setTransferNotes('');
        setActiveTab('history');
        fetchWallet();
        window.dispatchEvent(new Event('credit-balance-updated'));
      } else {
        toast.error(data.message || 'ক্রেডিট ট্রান্সফার ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      toast.error('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
    } finally {
      setTransferring(false);
    }
  };

  const handleAdminAdjust = async (e) => {
    e.preventDefault();
    if (!adminTargetUser) {
      toast.error('ব্যবহারকারী নির্বাচন করুন।');
      return;
    }

    const amt = parseInt(adminAdjustAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('সঠিক ক্রেডিটের পরিমাণ দিন।');
      return;
    }

    setAdminAdjusting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/credits/admin_adjust.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          admin_id: user.id,
          user_id: adminTargetUser.id,
          amount: amt,
          type: adminAdjustType,
          reason: adminAdjustReason.trim(),
          token
        })
      });
      const data = await res.json();

      if (data.status === 'success') {
        toast.success(`${adminTargetUser.name}-এর ব্যালেন্স সফলভাবে আপডেট হয়েছে! (নতুন ব্যালেন্স: ${data.new_balance})`);
        setAdminTargetUser(null);
        setAdminAdjustAmount('');
        setAdminAdjustReason('');
        fetchTransferUsers();
        window.dispatchEvent(new Event('credit-balance-updated'));
      } else {
        toast.error(data.message || 'এডজাস্টমেন্ট ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      toast.error('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
    } finally {
      setAdminAdjusting(false);
    }
  };

  if (!isOpen) return null;

  const currentBalance = wallet ? wallet.balance : 0;
  const isNegative = currentBalance < 0;

  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'rewards') return tx.type === 'task_reward' || tx.type === 'bonus' || Number(tx.amount) > 0;
    if (filterType === 'penalties') return tx.type === 'rejection_penalty' || tx.type === 'task_penalty' || tx.type === 'admin_deduct' || Number(tx.amount) < 0;
    if (filterType === 'transfers') return tx.type === 'transfer_in' || tx.type === 'transfer_out';
    return true;
  });

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <FiX size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">
                🪙
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  এডমিন ক্রেডিট ওয়ালেট ও রিওয়ার্ডস
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">Executive</span>
                </h3>
                <p className="text-xs text-blue-100 opacity-90">
                  {user?.name} &bull; টিম ক্রেডিট এডজাস্টমেন্ট ও বোনাস ম্যানেজমেন্ট
                </p>
              </div>
            </div>

            {/* Balance Badge */}
            <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider block">
                  বর্তমান অ্যাডমিন ক্রেডিট রিজার্ভ
                </span>
                <span className={`text-3xl font-extrabold ${isNegative ? 'text-rose-300' : 'text-white'}`}>
                  {loading ? '...' : currentBalance} <span className="text-sm font-medium">Credits</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-blue-100 block">মোট ট্রানজ্যাকশন</span>
                <span className="text-lg font-bold">{wallet?.transactions?.length || 0} টি</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mt-4 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                📜 ট্রানজ্যাকশন হিস্ট্রি
              </button>
              <button
                onClick={() => setActiveTab('send')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'send' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                💸 ক্রেডিট সেন্ড
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                ⚖️ এডমিন এডজাস্টমেন্ট
              </button>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Filter */}
                <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {['all', 'rewards', 'penalties', 'transfers'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                        filterType === f
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">ডাটা লোড হচ্ছে...</div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">কোনো ট্রানজ্যাকশন পাওয়া যায়নি।</div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransactions.map((tx) => {
                      const isPositive = Number(tx.amount) > 0;
                      return (
                        <div
                          key={tx.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                                isPositive
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                              }`}
                            >
                              {isPositive ? <FiArrowDownLeft size={16} /> : <FiArrowUpRight size={16} />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {tx.description || tx.type}
                              </p>
                              <span className="text-[10px] text-slate-400">{tx.created_at}</span>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-extrabold font-mono ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'send' && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    টিম মেম্বার সিলেক্ট করুন
                  </label>
                  <input
                    type="text"
                    placeholder="নাম বা ইমেইল দিয়ে সার্চ করুন..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs mb-2"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar border border-slate-100 dark:border-slate-800 p-1 rounded-xl">
                    {loadingUsers ? (
                      <p className="p-2 text-center text-xs text-slate-400">খোঁজা হচ্ছে...</p>
                    ) : users.length === 0 ? (
                      <p className="p-2 text-center text-xs text-slate-400">কোনো ইউজার পাওয়া যায়নি</p>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between ${
                            selectedUser?.id === u.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{u.name} ({u.employee_code || u.role})</span>
                          <span className="text-[10px] opacity-80">{u.balance || 0} Credits</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ক্রেডিটের পরিমাণ
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={wallet?.balance || 9999}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="যেমন: 10"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="যেমন: বিশেষ অবদানের জন্য বোনাস"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={transferring || !selectedUser || !transferAmount}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition"
                >
                  {transferring ? 'পাঠানো হচ্ছে...' : 'ক্রেডিট পাঠান'}
                </button>
              </form>
            )}

            {activeTab === 'admin' && (
              <form onSubmit={handleAdminAdjust} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <FiShield size={16} className="shrink-0" />
                  <span>এডমিন ডিরেক্ট এডজাস্টমেন্ট: যেকোনো সদস্যের একাউন্টে সরাসরি বোনাস বা পেনাল্টি প্রদান করুন।</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ইউজার সিলেক্ট করুন
                  </label>
                  <input
                    type="text"
                    placeholder="সার্চ করুন..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs mb-2"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar border border-slate-100 dark:border-slate-800 p-1 rounded-xl">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setAdminTargetUser(u)}
                        className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between ${
                          adminTargetUser?.id === u.id
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{u.name} ({u.employee_code || u.role})</span>
                        <span className="text-[10px] opacity-80">{u.balance || 0} Credits</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ধরণ</label>
                    <select
                      value={adminAdjustType}
                      onChange={(e) => setAdminAdjustType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    >
                      <option value="bonus">🎁 Bonus Award (যোগ)</option>
                      <option value="admin_grant">⚡ Direct Grant (যোগ)</option>
                      <option value="admin_deduct">🔻 Penalty Deduct (বিয়োগ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">পরিমাণ</label>
                    <input
                      type="number"
                      min="1"
                      value={adminAdjustAmount}
                      onChange={(e) => setAdminAdjustAmount(e.target.value)}
                      placeholder="যেমন: 25"
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">কারণ / রেফারেন্স</label>
                  <input
                    type="text"
                    value={adminAdjustReason}
                    onChange={(e) => setAdminAdjustReason(e.target.value)}
                    placeholder="যেমন: Monthly top performer award"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminAdjusting || !adminTargetUser || !adminAdjustAmount}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition"
                >
                  {adminAdjusting ? 'এডজাস্ট করা হচ্ছে...' : 'ক্রেডিট এডজাস্ট করুন'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CreditWalletModal;
