import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiExternalLink,
  FiLock
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaCoins } from 'react-icons/fa6';
import { toast } from 'sonner';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

const CreditWalletModal = ({ isOpen, onClose, user, onBalanceChange }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'send' | 'rules'
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const userId = user?.id || user?.user_id;

  // Send credits form state
  const [users, setUsers] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch Wallet Data
  const fetchWallet = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}&portal=staff`);
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

  // Fetch users for transfer
  const fetchTransferUsers = async (query = '') => {
    if (!userId) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_users.php?exclude_user_id=${userId}&q=${encodeURIComponent(query)}`);
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
    if (activeTab === 'send') {
      const timer = setTimeout(() => {
        fetchTransferUsers(searchUserQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchUserQuery, activeTab]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a recipient to send credits.');
      return;
    }

    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid credit amount (at least 1 credit).');
      return;
    }

    if (!wallet || wallet.balance < amt) {
      toast.error(`Insufficient credit balance. Your current balance is ${wallet?.balance || 0} credits.`);
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
        toast.success(`Successfully sent ${amt} credits to ${selectedUser.name}!`);
        setSelectedUser(null);
        setTransferAmount('');
        setTransferNotes('');
        setActiveTab('history');
        fetchWallet();
      } else {
        toast.error(data.message || 'Credit transfer failed.');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      toast.error('Unable to communicate with the server.');
    } finally {
      setTransferring(false);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedTx, setSelectedTx] = useState(null);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  // Early return if modal is closed
  if (!isOpen) return null;

  const currentBalance = wallet ? wallet.balance : 0;
  const isNegative = currentBalance < 0;

  // Filter transactions
  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'rewards') return tx.type === 'task_reward' || tx.type === 'bonus' || Number(tx.amount) > 0;
    if (filterType === 'penalties') return tx.type === 'rejection_penalty' || tx.type === 'task_penalty' || tx.type === 'admin_deduct' || Number(tx.amount) < 0;
    if (filterType === 'transfers') return tx.type === 'transfer_sent' || tx.type === 'transfer_received';
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to format transaction title, badge, and reason
  const getTransactionMeta = (tx) => {
    const isPenalty = 
      tx.type === 'rejection_penalty' || 
      tx.type === 'task_penalty' || 
      tx.type === 'rejection' ||
      tx.type === 'admin_deduct' || 
      Number(tx.amount) < 0 ||
      (typeof tx.description === 'string' && tx.description.toLowerCase().includes('reject'));

    const isPositive = Number(tx.amount) > 0;
    const meta = tx.meta_data || {};

    let badgeText = isPenalty ? 'Task Rejected' : isPositive ? 'Task Approved' : 'Transaction';
    let badgeClass = isPenalty
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
      : isPositive
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

    let mainTitle = tx.description || 'Transaction Record';
    let reasonText = meta.rejection_reason || meta.reason || meta.notes || '';
    let categoryName = meta.category_name || '';

    if (
      tx.type === 'rejection_penalty' || 
      tx.type === 'task_penalty' || 
      tx.type === 'rejection' ||
      (typeof tx.description === 'string' && tx.description.toLowerCase().includes('reject')) ||
      (Number(tx.amount) < 0 && !tx.type?.includes('transfer') && !tx.type?.includes('deduct'))
    ) {
      badgeText = 'Task Rejected';
      badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60';
      mainTitle = meta.task_title || (tx.reference_id ? `Task #${tx.reference_id}` : 'Task Revision');
      
      // If reason wasn't in meta, try extracting from description if format: '... ("reason")'
      if (!reasonText && tx.description && tx.description.includes('("')) {
        const match = tx.description.match(/\("([^"]+)"\)/);
        if (match) reasonText = match[1];
      }
    } else if (tx.type === 'task_reward' || (typeof tx.description === 'string' && (tx.description.toLowerCase().includes('reward') || tx.description.toLowerCase().includes('approved')))) {
      badgeText = 'Task Approved';
      badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60';
      mainTitle = meta.task_title || (tx.reference_id ? `Task #${tx.reference_id}` : 'Task Completed');
    } else if (tx.type === 'transfer_sent') {
      badgeText = 'Transfer Sent';
      badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60';
      mainTitle = `To: ${tx.receiver_name || meta.receiver_name || 'Teammate'}`;
    } else if (tx.type === 'transfer_received') {
      badgeText = 'Transfer Received';
      badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60';
      mainTitle = `From: ${tx.sender_name || meta.sender_name || 'Teammate'}`;
    } else if (tx.type === 'admin_grant' || tx.type === 'bonus') {
      badgeText = 'Bonus / Grant';
      badgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60';
      mainTitle = tx.description;
    } else if (tx.type === 'admin_deduct') {
      badgeText = 'Admin Deduction';
      badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60';
      mainTitle = tx.description;
    }

    // Clean title if it contains old raw string like "-1 Credit — Task Rejection: 'LETTERHEAD 05'"
    if (typeof mainTitle === 'string' && mainTitle.includes(' — Task Rejection:')) {
      const match = mainTitle.match(/Task Rejection:\s*'([^']+)'/);
      if (match) mainTitle = match[1];
    } else if (typeof mainTitle === 'string' && mainTitle.includes(' — Task Reward:')) {
      const match = mainTitle.match(/Task Reward:\s*'([^']+)'/);
      if (match) mainTitle = match[1];
    }

    return { isPenalty, isPositive, badgeText, badgeClass, mainTitle, reasonText, categoryName };
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header & Wallet Banner */}
          <div className={`p-6 pb-7 text-white relative overflow-hidden transition-all ${
            isNegative 
              ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-amber-900' 
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700'
          }`}>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <HiSparkles size={24} className="text-amber-300 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    CCA Credit Wallet
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                      Rank #{wallet?.rank || 1}
                    </span>
                  </h3>
                  <p className="text-xs text-white/80">
                    Category-Based Task Rewards & Activity Ledger
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

            {/* Big Balance Number */}
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 relative z-10">
              <div>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider block mb-1">
                  Available Balance
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
                    {loading ? '...' : currentBalance}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-white/90">Credits</span>
                </div>
              </div>

              {/* Stat Pills */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Earned</span>
                  <span className="text-xs font-bold text-emerald-300">+{wallet?.total_earned || 0}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Penalties</span>
                  <span className="text-xs font-bold text-rose-300">-{wallet?.total_penalties || 0}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Sent</span>
                  <span className="text-xs font-bold text-amber-300">{wallet?.total_spent || 0}</span>
                </div>
              </div>
            </div>

            {/* Negative Balance Alert */}
            {isNegative && (
              <div className="mt-4 p-3 rounded-2xl bg-black/30 backdrop-blur-md border border-rose-300/30 flex items-center gap-2.5 text-xs text-rose-100">
                <FiAlertTriangle className="text-rose-300 shrink-0 text-base" />
                <span>
                  <strong>Warning:</strong> Your balance is negative due to penalties ({currentBalance}). Complete assigned tasks to restore your balance into the positive.
                </span>
              </div>
            )}
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
              Transaction Ledger
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
              Send to Teammate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FiInfo size={14} />
              Rules & Guide
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
            {/* TAB 1: LEDGER / HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: 'All Transactions', icon: null },
                    { key: 'rewards', label: 'Task Rewards', icon: <FaCoins size={11} className="text-amber-500" /> },
                    { key: 'penalties', label: 'Rejections (-1)', icon: <FiAlertTriangle size={11} className="text-rose-500" /> },
                    { key: 'transfers', label: 'P2P Transfers', icon: <FiSend size={11} className="text-blue-500" /> }
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilterType(f.key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        filterType === f.key
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f.icon}
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    <FiRefreshCw className="animate-spin text-2xl mx-auto mb-2 text-blue-500" />
                    <p className="text-xs">Loading ledger transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
                      <FaCoins size={22} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No transactions found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Task completions and penalty logs will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {paginatedTransactions.map((tx) => {
                        const info = getTransactionMeta(tx);
                        return (
                          <div
                            key={tx.id}
                            className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all flex items-start justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {/* Left Status Icon */}
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  info.isPenalty
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                                    : tx.type === 'transfer_sent'
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                                    : tx.type === 'transfer_received'
                                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40'
                                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                                }`}
                              >
                                {info.isPenalty ? (
                                  <FiTrendingDown size={18} />
                                ) : tx.type === 'transfer_sent' ? (
                                  <FiArrowUpRight size={18} />
                                ) : tx.type === 'transfer_received' ? (
                                  <FiArrowDownLeft size={18} />
                                ) : (
                                  <FiTrendingUp size={18} />
                                )}
                              </div>

                              {/* Transaction Header & Details */}
                              <div className="min-w-0 flex-1">
                                {/* Header Badge + Title */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${info.badgeClass}`}>
                                    {info.badgeText}
                                  </span>
                                  {info.categoryName && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                                      {info.categoryName}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 break-words">
                                  {info.mainTitle}
                                </h4>

                                {/* Rejection Reason / Note Box */}
                                {info.reasonText && (
                                  <div className="mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                    <FiMessageSquare className="text-slate-400 shrink-0 mt-0.5" size={12} />
                                    <span className="break-words line-clamp-2 italic">
                                      "{info.reasonText}"
                                    </span>
                                  </div>
                                )}

                                {/* Date, Time & Task ID Footer */}
                                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <FiClock size={11} className="shrink-0" />
                                    {new Date(tx.created_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric',
                                      hour12: true
                                    })}
                                  </span>
                                  {tx.reference_id && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium">
                                        Task #{tx.reference_id}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Amount Pill & Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-xl inline-block ${
                                    info.isPositive
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                                  }`}
                                >
                                  {info.isPositive ? `+${tx.amount}` : tx.amount}
                                </span>
                                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                                  Credits
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTx(tx);
                                  }}
                                  className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  title="View Details"
                                >
                                  <FiInfo size={12} className="text-blue-500" />
                                  <span>Details</span>
                                </button>

                                {tx.reference_id && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      navigate(`/tasks`);
                                    }}
                                    className="px-2 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    title={`Open Task #${tx.reference_id}`}
                                  >
                                    <FiExternalLink size={12} />
                                    <span>Task #{tx.reference_id}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Page {currentPage} of {totalPages} ({filteredTransactions.length} total records)
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <FiChevronLeft size={13} />
                            Previous
                          </button>

                          <div className="flex items-center gap-1 px-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            Next
                            <FiChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* View Full Ledger Details Page Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate('/credits');
                        }}
                        className="w-full py-2.5 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                      >
                        <span>View Full Credit History & Task Ledger</span>
                        <FiExternalLink size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: SEND CREDITS (P2P TRANSFER) - LOCKED WITH FUNNY MESSAGE */}
            {activeTab === 'send' && (
              <div className="py-6 px-4 sm:p-6 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-amber-300 dark:border-amber-700/60 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-inner border border-amber-200 dark:border-amber-800 animate-bounce">
                  😂
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    <FiLock size={12} /> Transfer Locked
                  </span>
                  
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Hold on, Generous Soul! 😂
                  </h3>

                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    "You barely earn enough credits yourself, and you want to give them to someone else?" 💸
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Work hard, complete your assigned tasks, and build your own balance first before acting like a billionaire! P2P transfers are disabled for your financial protection.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3">
                  <span>Your Balance: <strong className="text-slate-900 dark:text-white">{currentBalance} Credits</strong></span>
                  <span>•</span>
                  <span>Charity Level: <strong className="text-rose-500">Not Qualified Yet 💀</strong></span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.error("Nice try! 😂 You barely earn enough credits yourself. Go finish some tasks first!", {
                        icon: '💸',
                        duration: 4000
                      });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Try Sending Anyway 🥺
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Back to My Ledger 📊
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: RULES & GUIDE */}
            {activeTab === 'rules' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <span>💎</span> Category-Based Reward System
                  </h4>
                  <p>
                    Credits for each task are automatically assigned according to the preset task category (e.g., Letterhead = 5 Credits, Business Card = 7 Credits, Logo = 10 Credits).
                  </p>
                  <p>
                    As soon as a reviewer marks your submission as <strong>Approved / Completed</strong>, the full category reward is immediately credited to your wallet.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <span>⚠️</span> Rejection Penalties & Negative Balance
                  </h4>
                  <p>
                    If a submitted task contains critical flaws and the reviewer issues a <strong>Rejected / Revision</strong> status, <strong>-1 Credit</strong> is deducted from your balance.
                  </p>
                  <p>
                    Penalties can push a balance into <strong>Negative numbers</strong> (e.g. 2 ➔ 1 ➔ 0 ➔ -1 ➔ -2). Completing subsequent tasks successfully will recover your balance into the positive.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <span>🔄</span> Peer-to-Peer Transfers (P2P Transfers)
                  </h4>
                  <p>
                    Direct credit transfers between team members are currently disabled by system administration.
                  </p>
                  <p>
                    Please focus on completing assigned tasks and building your individual credit portfolio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction Detail Modal */}
        <AnimatePresence>
          {selectedTx && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTx(null)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FiInfo size={17} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Transaction Details</h3>
                      <p className="text-xs text-slate-400">Record #{selectedTx.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTx(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Description</span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mt-0.5">{selectedTx.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Credit Amount</span>
                      <p className={`font-extrabold text-base mt-0.5 ${Number(selectedTx.amount) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {Number(selectedTx.amount) > 0 ? `+${selectedTx.amount}` : selectedTx.amount} Credits
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Date & Time</span>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold mt-0.5">{new Date(selectedTx.created_at).toLocaleString('en-US')}</p>
                    </div>
                  </div>

                  {selectedTx.meta_data?.task_title && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Task Title</span>
                      <p className="text-slate-800 dark:text-slate-200 font-bold text-xs mt-0.5">{selectedTx.meta_data.task_title}</p>
                    </div>
                  )}

                  {selectedTx.meta_data?.rejection_reason && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40">
                      <span className="text-rose-600 dark:text-rose-400 block font-bold uppercase tracking-wider text-[10px] mb-1">Rejection Reason / Feedback</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">"{selectedTx.meta_data.rejection_reason}"</p>
                    </div>
                  )}

                  {selectedTx.reference_id && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Task Reference</span>
                        <p className="text-blue-600 dark:text-blue-400 font-mono font-bold">Task #{selectedTx.reference_id}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTx(null);
                          onClose();
                          navigate('/tasks');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <span>View Task</span>
                        <FiExternalLink size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CreditWalletModal;
