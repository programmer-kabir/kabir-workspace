import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiClock,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiSend,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiExternalLink,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiTag,
  FiCalendar,
  FiLock
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaCoins } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

const Credits = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const userId = currentUser?.id || currentUser?.user_id;

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'rewards' | 'penalties' | 'transfers'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Send Transfer State
  const [isSendOpen, setIsSendOpen] = useState(false);
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
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      toast.error('Failed to load wallet data.');
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
    if (userId) {
      fetchWallet();
    }
    const handleCreditUpdated = () => {
      if (userId) fetchWallet();
    };
    window.addEventListener('credit-updated', handleCreditUpdated);
    return () => window.removeEventListener('credit-updated', handleCreditUpdated);
  }, [userId]);

  useEffect(() => {
    if (isSendOpen) {
      const timer = setTimeout(() => {
        fetchTransferUsers(searchUserQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchUserQuery, isSendOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

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
      toast.error(`Insufficient credit balance. Your current balance is ${wallet?.balance || 0}`);
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/send_credits.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedUser.id,
          amount: amt,
          notes: transferNotes.trim()
        })
      });
      const data = await res.json();

      if (data.status === 'success') {
        toast.success(`Successfully sent ${amt} credits to ${selectedUser.name}!`);
        setIsSendOpen(false);
        setSelectedUser(null);
        setTransferAmount('');
        setTransferNotes('');
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

  const getTransactionInfo = (tx) => {
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
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
      : isPositive
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';

    let mainTitle = tx.description || 'Transaction Record';
    let reasonText = meta.rejection_reason || meta.reason || meta.notes || '';
    let categoryName = meta.category_name || tx.task_category_name || '';
    let taskTitle = meta.task_title || tx.task_title || '';

    if (tx.type === 'marketplace_upload') {
      badgeText = 'Marketplace Upload (+1)';
      badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Marketplace Upload');
    } else if (tx.type === 'marketplace_dayal_upload') {
      badgeText = 'Dayal Stock Upload (+1)';
      badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Dayal Stock Upload');
    } else if (tx.type === 'marketplace_approved') {
      badgeText = 'Marketplace Approved (+2)';
      badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Marketplace Approved');
    } else if (tx.type === 'marketplace_rejected') {
      badgeText = 'Marketplace Rejected (-1)';
      badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
      mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Marketplace Rejected');
    } else if (isPenalty) {
      badgeText = 'Task Rejected (-1)';
      badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
      mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Task Revision');

      if (!reasonText && tx.description && tx.description.includes('("')) {
        const match = tx.description.match(/\("([^"]+)"\)/);
        if (match) reasonText = match[1];
      }
    } else if (tx.type === 'task_reward' || (typeof tx.description === 'string' && (tx.description.toLowerCase().includes('reward') || tx.description.toLowerCase().includes('approved')))) {
      badgeText = `Task Approved (+${tx.amount})`;
      badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Task Completed');
    } else if (tx.type === 'transfer_sent') {
      badgeText = 'Transfer Sent';
      badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      mainTitle = `Sent to ${tx.receiver_name || meta.receiver_name || 'Teammate'}`;
    } else if (tx.type === 'transfer_received') {
      badgeText = 'Transfer Received';
      badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      mainTitle = `Received from ${tx.sender_name || meta.sender_name || 'Teammate'}`;
    } else if (tx.type === 'admin_grant' || tx.type === 'bonus') {
      badgeText = 'Bonus / Grant';
      badgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
      mainTitle = tx.description;
    } else if (tx.type === 'admin_deduct') {
      badgeText = 'Admin Deduction';
      badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
      mainTitle = tx.description;
    }

    if (typeof mainTitle === 'string' && mainTitle.includes(' — Task Rejection:')) {
      const match = mainTitle.match(/Task Rejection:\s*'([^']+)'/);
      if (match) mainTitle = match[1];
    } else if (typeof mainTitle === 'string' && mainTitle.includes(' — Task Reward:')) {
      const match = mainTitle.match(/Task Reward:\s*'([^']+)'/);
      if (match) mainTitle = match[1];
    }

    return { isPenalty, isPositive, badgeText, badgeClass, mainTitle, taskTitle, reasonText, categoryName, meta };
  };

  // Filter transactions
  const transactions = wallet?.transactions || [];
  const filtered = transactions.filter((tx) => {
    const info = getTransactionInfo(tx);
    const matchesSearch = 
      (info.mainTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (info.reasonText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (info.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (String(tx.reference_id || '')).includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'rewards') return tx.type === 'task_reward' || tx.type === 'bonus' || Number(tx.amount) > 0;
    if (filterType === 'penalties') return info.isPenalty;
    if (filterType === 'transfers') return tx.type === 'transfer_sent' || tx.type === 'transfer_received';
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const balance = wallet ? wallet.balance : 0;
  const isNegative = balance < 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <FaCoins size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Credit Wallet & Ledger
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Rank #{wallet?.rank || 1}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              View detailed task approval rewards, rejection penalties, and credit transaction ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchWallet}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsSendOpen(true)}
            disabled={balance <= 0}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
          >
            <FiSend size={14} />
            Send to Teammate
          </button>
        </div>
      </div>

      {/* Hero Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Balance */}
        <div className={`p-6 rounded-3xl text-white relative overflow-hidden shadow-lg ${
          isNegative
            ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-amber-900'
            : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700'
        }`}>
          <div className="relative z-10">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{loading ? '...' : balance}</span>
              <span className="text-base font-medium text-white/90">Credits</span>
            </div>
            <p className="text-[11px] text-white/75 mt-2">
              {isNegative ? '⚠️ Negative balance due to penalties' : '✅ Active credit balance'}
            </p>
          </div>
          <div className="absolute -right-2 -bottom-4 opacity-15 text-white pointer-events-none select-none">
            <FaCoins size={96} />
          </div>
        </div>

        {/* Card 2: Total Earned */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Task Earned
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              +{wallet?.total_earned || 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Approved task rewards</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <FiAward size={22} />
          </div>
        </div>

        {/* Card 3: Total Penalties */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Rejection Penalties
            </span>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              -{wallet?.total_penalties || 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Revision & rejection cuts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
            <FiTrendingDown size={22} />
          </div>
        </div>

        {/* Card 4: Transferred */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              P2P Transferred
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {wallet?.total_sent || 0}
              </span>
              <span className="text-xs text-slate-400">Sent /</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {wallet?.total_received || 0}
              </span>
              <span className="text-xs text-slate-400">Recv</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Teammate transfers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
            <FiSend size={22} />
          </div>
        </div>
      </div>

      {/* Main Ledger Table & Filter Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Filter Controls Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { key: 'all', label: 'All Transactions', icon: null },
              { key: 'rewards', label: 'Task Rewards', icon: <FaCoins size={12} className="text-amber-500" /> },
              { key: 'penalties', label: 'Rejections (-1)', icon: <FiAlertTriangle size={12} className="text-rose-500" /> },
              { key: 'transfers', label: 'P2P Transfers', icon: <FiSend size={12} className="text-blue-500" /> }
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterType(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterType === f.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task title, ID or reason..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Ledger Rows */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <FiRefreshCw className="animate-spin text-3xl mx-auto mb-3 text-blue-500" />
            <p className="text-sm font-semibold">Loading credit ledger...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <FaCoins size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No transaction records found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No records match your search criteria.' : 'History will automatically appear here when tasks are completed or reviewed.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginated.map((tx) => {
              const info = getTransactionInfo(tx);
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Status Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        info.isPenalty
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40'
                          : tx.type === 'transfer_sent'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40'
                          : tx.type === 'transfer_received'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40'
                      }`}
                    >
                      {info.isPenalty ? (
                        <FiTrendingDown size={20} />
                      ) : tx.type === 'transfer_sent' ? (
                        <FiArrowUpRight size={20} />
                      ) : tx.type === 'transfer_received' ? (
                        <FiArrowDownLeft size={20} />
                      ) : (
                        <FiTrendingUp size={20} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${info.badgeClass}`}>
                          {info.badgeText}
                        </span>

                        {info.categoryName && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                            <FiTag size={10} />
                            {info.categoryName}
                          </span>
                        )}

                        {tx.reference_id && (
                          <span className="font-mono text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-lg">
                            Task #{tx.reference_id}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {info.mainTitle}
                      </h3>

                      {/* Reason / Note snippet */}
                      {info.reasonText && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <FiMessageSquare className="text-slate-400 shrink-0 mt-0.5" size={13} />
                          <span className="break-words line-clamp-2 italic">
                            "{info.reasonText}"
                          </span>
                        </div>
                      )}

                      {/* Date & Sub info */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <FiClock size={12} />
                          {new Date(tx.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })}
                        </span>
                        {tx.sender_name && tx.type === 'transfer_received' && (
                          <span>From: <strong className="text-slate-700 dark:text-slate-200">{tx.sender_name}</strong></span>
                        )}
                        {tx.receiver_name && tx.type === 'transfer_sent' && (
                          <span>To: <strong className="text-slate-700 dark:text-slate-200">{tx.receiver_name}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & View button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <span
                      className={`text-base sm:text-lg font-black px-3 py-1 rounded-2xl border block ${
                        info.isPositive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      {info.isPositive ? `+${tx.amount}` : tx.amount} Credits
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                      View Details <FiExternalLink size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Page {currentPage} of {totalPages} ({filtered.length} total records)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <FiChevronLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
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
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE TRANSACTION DETAILS MODAL */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4"
            >
              {(() => {
                const info = getTransactionInfo(selectedTx);
                return (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${info.badgeClass}`}>
                          {info.badgeText}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTx(null)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <FiX size={18} />
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Task / Description</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {info.mainTitle}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Credit Impact:</span>
                        <span className={`font-black text-sm ${info.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {info.isPositive ? `+${selectedTx.amount}` : selectedTx.amount} Credits
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Category:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {info.categoryName || 'General'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Date & Time:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(selectedTx.created_at).toLocaleString('en-US')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Task Reference:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {selectedTx.reference_id ? `#TASK-${selectedTx.reference_id}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {info.reasonText && (
                      <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1">
                        <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                          <FiMessageSquare size={13} /> Reviewer Feedback / Reason:
                        </span>
                        <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed">
                          "{info.reasonText}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      {selectedTx.reference_id && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = selectedTx.reference_id;
                            const statusTab = selectedTx.task_status || (info.isPenalty ? 'Rejected' : 'Completed');
                            setSelectedTx(null);
                            navigate(`/tasks?taskId=${targetId}`, {
                              state: {
                                taskId: targetId,
                                activeTab: statusTab
                              }
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          View Task <FiExternalLink size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedTx(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* P2P SEND MODAL */}
      <AnimatePresence>
        {isSendOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSendOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="text-center space-y-4 py-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-inner border border-amber-200 dark:border-amber-800 animate-bounce">
                  😂
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    <FiLock size={12} /> Transfer Disabled
                  </span>
                  
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Hold on, Generous Soul! 😂
                  </h3>

                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-snug">
                    "You barely earn enough credits yourself, and you want to give them to someone else?" 💸
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Work hard, complete your tasks, and build your own balance first before playing philanthropist! P2P transfers are currently disabled.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3">
                  <span>Available Balance: <strong className="text-slate-900 dark:text-white">{balance} Credits</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-rose-500">Locked 🔒</strong></span>
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
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Try Sending Anyway 🥺
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSendOpen(false)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Got it, Back to Work! 🚀
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Credits;
