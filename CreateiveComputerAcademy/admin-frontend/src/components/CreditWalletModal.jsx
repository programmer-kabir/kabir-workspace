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

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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

  // Fetch Wallet Data
  const fetchWallet = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${user.id}`);
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
      const res = await fetch(`${API_BASE}/api/credits/get_users.php?exclude_user_id=${user?.id || 0}&q=${encodeURIComponent(query)}`);
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
      const res = await fetch(`${API_BASE}/api/credits/send_credits.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          amount: amt,
          notes: transferNotes.trim()
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
      const res = await fetch(`${API_BASE}/api/credits/admin_adjust.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: user.id,
          user_id: adminTargetUser.id,
          amount: amt,
          type: adminAdjustType,
          reason: adminAdjustReason.trim()
        })
      });
      const data = await res.json();

      if (data.status === 'success') {
        toast.success(`${adminTargetUser.name}-এর ব্যালেন্স সফলভাবে আপডেট হয়েছে! (নতুন ব্যালেন্স: ${data.new_balance})`);
        setAdminTargetUser(null);
        setAdminAdjustAmount('');
        setAdminAdjustReason('');
        fetchTransferUsers();
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
    if (filterType === 'transfers') return tx.type === 'transfer_sent' || tx.type === 'transfer_received';
    return true;
  });

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header & Banner */}
          <div className="p-5 sm:p-6 text-white relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <HiSparkles size={24} className="text-amber-300 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Admin Credit Management
                  </h3>
                  <p className="text-xs text-white/80">
                    Organization Credit Ledger & Manual Adjustments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchWallet}
                  disabled={loading}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                  title="Refresh Balance"
                >
                  <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Admin Balance Display */}
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4 relative z-10">
              <div>
                <span className="text-xs font-semibold text-white/75 uppercase tracking-wider block mb-0.5">
                  Your Balance
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    {loading ? '...' : currentBalance}
                  </span>
                  <span className="text-base sm:text-lg font-medium text-white/90">Credits</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Earned</span>
                  <span className="text-xs font-bold text-emerald-300">+{wallet?.total_earned || 0}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Sent</span>
                  <span className="text-xs font-bold text-amber-300">{wallet?.total_spent || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 sm:px-6 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FiClock size={14} />
              My Ledger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('send')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'send'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FiSend size={14} />
              Send Credits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FiShield size={14} />
              Admin Grant / Bonus
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
            {activeTab === 'history' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    <FiRefreshCw className="animate-spin text-2xl mx-auto mb-2 text-blue-500" />
                    <p className="text-xs">Loading ledger transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-3xl mb-2 block">📜</span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      কোনো ট্রানজেকশন নেই
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 sm:p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <FiTrendingUp size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {tx.description}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {new Date(tx.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                          </span>
                          <span className="block text-[10px] text-slate-400 uppercase font-medium">Credits</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'send' && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    টিম মেম্বার নির্বাচন করুন
                  </label>
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder="নাম বা পদবী দিয়ে খুঁজুন..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{u.name} ({u.designation || u.email})</span>
                        {selectedUser?.id === u.id && <FiCheckCircle className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="পরিমাণ (Credits)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="নোট (ঐচ্ছিক)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={transferring || !selectedUser || !transferAmount}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {transferring ? 'পাঠানো হচ্ছে...' : 'ক্রেডিট পাঠান'}
                </button>
              </form>
            )}

            {/* TAB 3: ADMIN DIRECT ADJUSTMENT */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminAdjust} className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <FiShield size={14} /> এডমিন ক্রেডিট কন্ট্রোল
                  </p>
                  <p className="mt-0.5 text-[11px]">
                    এডমিন হিসেবে আপনি যেকোনো স্টাফ/মেম্বারের ওয়ালেটে সরাসরি বোনাস বা অ্যাডজাস্টমেন্ট প্রদান করতে পারেন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    মেম্বার নির্বাচন করুন
                  </label>
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder="নাম বা পদবী দিয়ে খুঁজুন..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2"
                  />
                  <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setAdminTargetUser(u)}
                        className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          adminTargetUser?.id === u.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.designation || u.email}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          বর্তমান: {u.balance} Credits
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">অ্যাকশন টাইপ</label>
                    <select
                      value={adminAdjustType}
                      onChange={(e) => setAdminAdjustType(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="bonus">🎁 পারফরম্যান্স বোনাস (+)</option>
                      <option value="admin_grant">⚡ এডমিন গ্রান্ট (+)</option>
                      <option value="admin_deduct">🔴 এডমিন ডিডাকশন (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ক্রেডিটের পরিমাণ</label>
                    <input
                      type="number"
                      min="1"
                      value={adminAdjustAmount}
                      onChange={(e) => setAdminAdjustAmount(e.target.value)}
                      placeholder="যেমন: 25"
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">কারণ / নোট</label>
                  <input
                    type="text"
                    value={adminAdjustReason}
                    onChange={(e) => setAdminAdjustReason(e.target.value)}
                    placeholder="যেমন: Monthly top performer award"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminAdjusting || !adminTargetUser || !adminAdjustAmount}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
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
