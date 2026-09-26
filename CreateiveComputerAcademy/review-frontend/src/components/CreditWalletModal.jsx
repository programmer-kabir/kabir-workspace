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
  FiAlertOctagon,
  FiClock,
  FiUser,
  FiSearch,
  FiCheckCircle,
  FiInfo,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiRefreshCw,
  FiShield,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import TaskDetailsModal from './TaskDetailsModal';

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

  // Pagination & Modals state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedTx, setSelectedTx] = useState(null);
  const [activeModalTaskId, setActiveModalTaskId] = useState(null);

  // Fetch Wallet Data
  const fetchWallet = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}&portal=reviewer`);
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setWallet(data.wallet);
        if (onBalanceChange) {
          onBalanceChange(data.wallet.balance);
        }
      }
    } catch (err) {
      console.error('Error fetching reviewer wallet:', err);
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
    if (isOpen && userId) {
      fetchWallet();
      fetchTransferUsers();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (activeTab === 'send') {
      const timer = setTimeout(() => {
        fetchTransferUsers(searchUserQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchUserQuery, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a teammate to transfer credits to.');
      return;
    }

    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid credit amount (at least 1 credit).');
      return;
    }

    if (!wallet || wallet.balance < amt) {
      toast.error(`Insufficient credits. Your current balance is ${wallet?.balance || 0} credits.`);
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
      toast.error('Failed to communicate with server.');
    } finally {
      setTransferring(false);
    }
  };

  const currentBalance = wallet ? wallet.balance : 0;
  const isNegative = currentBalance < 0;

  const approvalCredit = wallet?.policy_settings?.reviewer_approval_credit ?? 1;
  const rejectionCredit = wallet?.policy_settings?.reviewer_rejection_credit ?? 1;
  const deliveryBonus = wallet?.policy_settings?.reviewer_delivery_bonus ?? 3;

  if (!isOpen) return null;

  // Filter transactions
  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'approvals') {
      return tx.type === 'reviewer_approval_reward' || (tx.event_key && tx.event_key.startsWith('rev_appr'));
    }
    if (filterType === 'rejections') {
      return tx.type === 'reviewer_rejection_reward' || (tx.event_key && tx.event_key.startsWith('rev_rejc'));
    }
    if (filterType === 'delivery') {
      return tx.type === 'reviewer_delivery_bonus' || (tx.event_key && tx.event_key.startsWith('rev_deliv'));
    }
    if (filterType === 'transfers') {
      return tx.type === 'transfer_sent' || tx.type === 'transfer_received';
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenTaskRoute = (taskId, tx = null) => {
    if (!taskId) return;
    const type = (tx?.type || '').toLowerCase();
    const desc = (tx?.description || '').toLowerCase();

    if (onClose) onClose();

    if (type.includes('rejection') || desc.includes('rejection') || desc.includes('reject')) {
      navigate(`/rejected?taskId=${taskId}`, { state: { taskId } });
    } else if (type.includes('pending') || desc.includes('pending')) {
      navigate(`/pending?taskId=${taskId}`, { state: { taskId } });
    } else {
      navigate(`/completed?taskId=${taskId}`, { state: { taskId } });
    }
  };

  // Helper to format review activity metadata
  const getReviewActivityInfo = (tx) => {
    const isApproval = tx.type === 'reviewer_approval_reward' || (tx.event_key && tx.event_key.startsWith('rev_appr'));
    const isRejection = tx.type === 'reviewer_rejection_reward' || (tx.event_key && tx.event_key.startsWith('rev_rejc'));
    const isDelivery = tx.type === 'reviewer_delivery_bonus' || (tx.event_key && tx.event_key.startsWith('rev_deliv'));
    const isTransferSent = tx.type === 'transfer_sent';
    const isTransferReceived = tx.type === 'transfer_received';

    if (isApproval) {
      return {
        badge: 'Approval Reward',
        badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
        icon: <FiCheckCircle size={17} className="text-emerald-500" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500',
        amountPrefix: '+'
      };
    }
    if (isRejection) {
      return {
        badge: 'QA Audit / Reject',
        badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
        icon: <FiAlertOctagon size={17} className="text-amber-500" />,
        iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-500',
        amountPrefix: '+'
      };
    }
    if (isDelivery) {
      return {
        badge: 'Stock Delivery Bonus',
        badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25',
        icon: <HiSparkles size={17} className="text-purple-500" />,
        iconBg: 'bg-purple-500/10 border border-purple-500/20 text-purple-500',
        amountPrefix: '+'
      };
    }
    if (isTransferSent) {
      return {
        badge: 'Transfer Sent',
        badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
        icon: <FiArrowUpRight size={17} className="text-rose-500" />,
        iconBg: 'bg-rose-500/10 border border-rose-500/20 text-rose-500',
        amountPrefix: ''
      };
    }
    if (isTransferReceived) {
      return {
        badge: 'Transfer Received',
        badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
        icon: <FiArrowDownLeft size={17} className="text-blue-500" />,
        iconBg: 'bg-blue-500/10 border border-blue-500/20 text-blue-500',
        amountPrefix: '+'
      };
    }

    return {
      badge: 'QA Credit',
      badgeBg: 'bg-brand-500/15 text-brand-500 border border-brand-500/25',
      icon: <FiAward size={17} className="text-brand-500" />,
      iconBg: 'bg-brand-500/10 border border-brand-500/20 text-brand-500',
      amountPrefix: tx.amount > 0 ? '+' : ''
    };
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
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-dark-900 border border-dark-700/80 shadow-2xl rounded-3xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header & Wallet Banner */}
          <div className="p-6 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-brand-700 shadow-md">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[rgba(255,255,255,0.12)] rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.18)] backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.25)] shadow-inner">
                  <HiSparkles size={24} className="text-amber-300 drop-shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#ffffff] tracking-tight">
                      Reviewer Credit Wallet
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.2)] text-[#ffffff] border border-[rgba(255,255,255,0.3)]">
                      Rank #{wallet?.rank || 1}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(255,255,255,0.85)] font-medium">
                    QA Review & Evaluation Incentives Ledger
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchWallet}
                  disabled={loading}
                  className="p-2 rounded-xl bg-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.28)] text-[#ffffff] transition-colors cursor-pointer active:scale-95"
                  title="Refresh Balance"
                >
                  <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.28)] text-[#ffffff] transition-colors cursor-pointer active:scale-95"
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Big Balance Number */}
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 relative z-10">
              <div>
                <span className="text-xs font-bold text-[rgba(255,255,255,0.8)] uppercase tracking-wider block mb-1">
                  Available Reviewer Balance
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#ffffff] drop-shadow-sm leading-none">
                    {loading ? '...' : currentBalance}
                  </span>
                  <span className="text-base font-bold text-[rgba(255,255,255,0.9)]">Credits</span>
                </div>
              </div>

              {/* Stat Pills */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="px-3.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.18)] backdrop-blur-md border border-[rgba(255,255,255,0.25)] text-left">
                  <span className="text-[10px] text-[rgba(255,255,255,0.8)] block uppercase font-bold tracking-wider">Earned</span>
                  <span className="text-xs font-black text-emerald-300">+{wallet?.total_earned || 0}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.18)] backdrop-blur-md border border-[rgba(255,255,255,0.25)] text-left">
                  <span className="text-[10px] text-[rgba(255,255,255,0.8)] block uppercase font-bold tracking-wider">Sent</span>
                  <span className="text-xs font-black text-amber-300">{wallet?.total_sent || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-dark-700 bg-dark-900 px-6 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <FiClock size={15} />
              Reviewer Activity
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('send')}
              className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'send'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <FiSend size={15} />
              Send to Teammate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'rules'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <FiShield size={15} />
              Reviewer Policy
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-dark-950">
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: 'all', label: 'All Reviews', icon: FiAward },
                    { key: 'approvals', label: 'Approvals', icon: FiCheckCircle },
                    { key: 'rejections', label: 'Rejections / Audits', icon: FiAlertOctagon },
                    { key: 'delivery', label: 'Delivery Bonus', icon: HiSparkles },
                    { key: 'transfers', label: 'Transfers', icon: FiSend }
                  ].map((f) => {
                    const Icon = f.icon;
                    const isActive = filterType === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilterType(f.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-500/20'
                            : 'bg-dark-900 text-white/60 border border-dark-700 hover:text-white hover:bg-dark-800'
                        }`}
                      >
                        <Icon size={13} className={isActive ? 'text-white' : 'text-white/40'} />
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>

                {loading ? (
                  <div className="py-16 text-center text-white/40">
                    <FiRefreshCw className="animate-spin text-2xl mx-auto mb-2 text-brand-400" />
                    <p className="text-xs font-medium">Loading reviewer transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-14 text-center bg-dark-900 rounded-2xl border border-dark-700/80">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center text-white/40">
                      <FiClock size={22} />
                    </div>
                    <p className="text-sm font-bold text-white">
                      No Reviewer Transactions Found
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Credits earned from task evaluations will be recorded here automatically.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {paginatedTransactions.map((tx) => {
                        const isPositive = Number(tx.amount) > 0;
                        const actInfo = getReviewActivityInfo(tx);

                        return (
                          <div
                            key={tx.id}
                            className="p-3.5 bg-dark-900 hover:bg-dark-800/80 rounded-2xl border border-dark-700/80 transition-all flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${actInfo.iconBg}`}>
                                {actInfo.icon}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${actInfo.badgeBg}`}>
                                    {actInfo.badge}
                                  </span>
                                  {tx.meta_data?.task_title && (
                                    <span className="text-[11px] font-semibold text-white/40 truncate">
                                      {tx.meta_data.task_title}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                                  {tx.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
                                  <span>
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
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenTaskRoute(tx.reference_id, tx);
                                        }}
                                        className="font-mono text-brand-400 hover:text-brand-300 hover:underline cursor-pointer"
                                        title={`Open Task #${tx.reference_id}`}
                                      >
                                        Task #{tx.reference_id}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                <span
                                  className={`text-base font-black ${
                                    isPositive
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {actInfo.amountPrefix}{tx.amount}
                                </span>
                                <span className="block text-[10px] text-white/40 uppercase font-bold tracking-wider">
                                  Credits
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 pl-2 border-l border-dark-700/80">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTx(tx);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-white/80 hover:text-white border border-dark-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  title="View Transaction Details"
                                >
                                  <FiInfo size={12} className="text-brand-400" />
                                  <span>Details</span>
                                </button>

                                {tx.reference_id && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTaskRoute(tx.reference_id, tx);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 border border-brand-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
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
                      <div className="mt-4 pt-3 border-t border-dark-700/80 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs text-white/40 font-medium">
                          Page {currentPage} of {totalPages} ({filteredTransactions.length} total records)
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 rounded-xl border border-dark-700 bg-dark-900 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <FiChevronLeft size={13} />
                            Prev
                          </button>

                          <div className="flex items-center gap-1 px-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                  currentPage === pageNum
                                    ? 'bg-brand-500 text-white shadow-xs'
                                    : 'text-white/40 hover:bg-dark-800 hover:text-white'
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
                            className="px-2.5 py-1.5 rounded-xl border border-dark-700 bg-dark-900 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
                        className="w-full py-3 px-4 rounded-2xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/25 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                      >
                        <span>View Complete Credit History & Details (View More)</span>
                        <FiExternalLink size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'send' && (
              <form onSubmit={handleTransfer} className="space-y-4">
                {currentBalance <= 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-300">
                      <FiAlertOctagon size={16} /> Insufficient Balance
                    </p>
                    <p className="text-white/70">
                      You need at least 1 credit in your reviewer balance to transfer credits to a teammate. Your current balance is {currentBalance} credits.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                        1. Select Teammate
                      </label>
                      <div className="relative mb-2">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                        <input
                          type="text"
                          value={searchUserQuery}
                          onChange={(e) => setSearchUserQuery(e.target.value)}
                          placeholder="Search by name or role..."
                          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      <div className="max-h-40 overflow-y-auto border border-dark-700 rounded-2xl bg-dark-900 divide-y divide-dark-700/50">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-xs text-white/40">Searching teammates...</div>
                        ) : users.length === 0 ? (
                          <div className="p-4 text-center text-xs text-white/40">No team members found</div>
                        ) : (
                          users.map((u) => {
                            const isSelected = selectedUser?.id === u.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-brand-500/15 border-l-2 border-brand-500'
                                    : 'hover:bg-dark-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-brand-500/30">
                                    {u.profile_picture ? (
                                      <img
                                        src={u.profile_picture.startsWith('http') ? u.profile_picture : `${API_BASE}/${u.profile_picture}`}
                                        alt={u.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      u.name?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">
                                      {u.name}
                                    </p>
                                    <p className="text-[11px] text-white/40 truncate">
                                      {u.designation || u.department_name || u.email}
                                    </p>
                                  </div>
                                </div>

                                {isSelected && (
                                  <FiCheckCircle className="text-brand-400 shrink-0" size={16} />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-white/80 uppercase tracking-wider">
                            2. Credit Amount
                          </label>
                          <button
                            type="button"
                            onClick={() => setTransferAmount(String(currentBalance))}
                            className="text-[11px] text-brand-400 hover:underline font-semibold cursor-pointer"
                          >
                            Max ({currentBalance})
                          </button>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max={currentBalance}
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="e.g. 2"
                          required
                          className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-sm font-bold text-white placeholder-white/40 outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                          3. Message (Optional)
                        </label>
                        <input
                          type="text"
                          value={transferNotes}
                          onChange={(e) => setTransferNotes(e.target.value)}
                          placeholder="e.g. Great job on evaluation!"
                          className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={transferring || !selectedUser || !transferAmount || parseInt(transferAmount, 10) > currentBalance}
                      className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      {transferring ? (
                        <>
                          <FiRefreshCw className="animate-spin" size={16} />
                          Transferring credits...
                        </>
                      ) : (
                        <>
                          <FiSend size={16} />
                          {selectedUser ? `Send ${transferAmount || 0} Credits to ${selectedUser.name}` : 'Send Credits'}
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="p-4 bg-dark-900 rounded-2xl border border-dark-700/80 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                    <FiCheckCircle size={16} /> Task Approval Reward (+{approvalCredit} Credit{approvalCredit > 1 ? 's' : ''})
                  </h4>
                  <p className="text-white/70 leading-relaxed">
                    Earn {approvalCredit} credit{approvalCredit > 1 ? 's' : ''} immediately upon reviewing and approving submitted designer tasks based on quality and completeness.
                  </p>
                </div>

                <div className="p-4 bg-dark-900 rounded-2xl border border-dark-700/80 space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center gap-2">
                    <FiAlertOctagon size={16} /> Rejection Audit Reward (+{rejectionCredit} Credit{rejectionCredit > 1 ? 's' : ''})
                  </h4>
                  <p className="text-white/70 leading-relaxed">
                    Earn {rejectionCredit} credit{rejectionCredit > 1 ? 's' : ''} when sending back detailed feedback and revision requests for defective or incomplete task submissions.
                  </p>
                </div>

                <div className="p-4 bg-dark-900 rounded-2xl border border-dark-700/80 space-y-2">
                  <h4 className="font-bold text-purple-400 flex items-center gap-2">
                    <HiSparkles size={16} /> Final Stock Delivery Super Bonus (+{deliveryBonus} Credit{deliveryBonus > 1 ? 's' : ''})
                  </h4>
                  <p className="text-white/70 leading-relaxed">
                    Super reward of {deliveryBonus} credits awarded upon final file verification and delivering completed stock assets to the cloud stock drive.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction Detail Breakdown Modal */}
        <AnimatePresence>
          {selectedTx && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTx(null)}
                className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                className="relative w-full max-w-lg bg-dark-900 border border-dark-700/80 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-dark-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
                      <FiInfo size={17} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Review Credit Details</h3>
                      <p className="text-xs text-white/40">Record #{selectedTx.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTx(null)}
                    className="p-2 rounded-xl bg-dark-800 text-white/60 hover:text-white cursor-pointer"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <div className="p-4 bg-dark-950 rounded-2xl border border-dark-700/80 space-y-3.5 text-xs">
                  <div>
                    <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Description</span>
                    <p className="text-white font-bold text-sm mt-0.5">{selectedTx.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dark-700/50">
                    <div>
                      <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Reward Amount</span>
                      <p className="text-emerald-400 font-extrabold text-base mt-0.5">+{selectedTx.amount} Credits</p>
                    </div>
                    <div>
                      <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Date & Time</span>
                      <p className="text-white font-semibold mt-0.5">
                        {new Date(selectedTx.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedTx.meta_data?.task_title && (
                    <div className="pt-2 border-t border-dark-700/50">
                      <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Task Title</span>
                      <p className="text-white font-bold text-xs mt-0.5">{selectedTx.meta_data.task_title}</p>
                    </div>
                  )}

                  {selectedTx.meta_data?.rejection_reason && (
                    <div className="pt-2 border-t border-dark-700/50 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-amber-400 block font-bold uppercase tracking-wider text-[10px] mb-1">Feedback / Audit Note</span>
                      <p className="text-white/80 font-medium leading-relaxed italic">"{selectedTx.meta_data.rejection_reason}"</p>
                    </div>
                  )}

                  {selectedTx.reference_id && (
                    <div className="pt-2 border-t border-dark-700/50 flex items-center justify-between">
                      <div>
                        <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Associated Task</span>
                        <p className="text-brand-400 font-mono font-bold">Task #{selectedTx.reference_id}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenTaskRoute(selectedTx.reference_id, selectedTx);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <span>Open Task #{selectedTx.reference_id}</span>
                        <FiExternalLink size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Complete Task Details & Deliverables Modal */}
        <TaskDetailsModal
          isOpen={!!activeModalTaskId}
          onClose={() => setActiveModalTaskId(null)}
          taskId={activeModalTaskId}
        />
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CreditWalletModal;
