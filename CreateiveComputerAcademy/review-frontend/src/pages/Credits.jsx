import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
  FiAlertOctagon,
  FiInfo,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiShield,
  FiLayers,
  FiCalendar
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import TaskDetailsModal from '../components/TaskDetailsModal';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

const Credits = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const userId = currentUser?.id || currentUser?.user_id;

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'approvals' | 'rejections' | 'delivery' | 'transfers'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [activeModalTaskId, setActiveModalTaskId] = useState(null);

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
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${userId}&portal=reviewer`);
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error('Error fetching reviewer wallet:', err);
      toast.error('Failed to load wallet ledger data.');
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
      toast.error('Please select a teammate to send credits to.');
      return;
    }

    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid credit amount (at least 1 credit).');
      return;
    }

    if (!wallet || wallet.balance < amt) {
      toast.error(`Insufficient balance. Your current reviewer balance is ${wallet?.balance || 0} credits.`);
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
        toast.success(`Successfully transferred ${amt} credits to ${selectedUser.name}!`);
        setSelectedUser(null);
        setTransferAmount('');
        setTransferNotes('');
        setIsSendOpen(false);
        fetchWallet();
      } else {
        toast.error(data.message || 'Credit transfer failed.');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      toast.error('Network error during transfer.');
    } finally {
      setTransferring(false);
    }
  };

  const currentBalance = wallet ? wallet.balance : 0;
  const isNegative = currentBalance < 0;

  const approvalCredit = wallet?.policy_settings?.reviewer_approval_credit ?? 1;
  const rejectionCredit = wallet?.policy_settings?.reviewer_rejection_credit ?? 1;
  const deliveryBonus = wallet?.policy_settings?.reviewer_delivery_bonus ?? 3;

  // Filter transactions
  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    const isApproval = tx.type === 'reviewer_approval_reward' || (tx.event_key && tx.event_key.startsWith('rev_appr'));
    const isRejection = tx.type === 'reviewer_rejection_reward' || (tx.event_key && tx.event_key.startsWith('rev_rejc'));
    const isDelivery = tx.type === 'reviewer_delivery_bonus' || (tx.event_key && tx.event_key.startsWith('rev_deliv'));
    const isTransfer = tx.type === 'transfer_sent' || tx.type === 'transfer_received';

    if (filterType === 'approvals' && !isApproval) return false;
    if (filterType === 'rejections' && !isRejection) return false;
    if (filterType === 'delivery' && !isDelivery) return false;
    if (filterType === 'transfers' && !isTransfer) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      const title = (tx.meta_data?.task_title || tx.task_title || '').toLowerCase();
      const sName = (tx.sender_name || '').toLowerCase();
      const rName = (tx.receiver_name || '').toLowerCase();
      const ref = String(tx.reference_id || '');
      if (!desc.includes(q) && !title.includes(q) && !sName.includes(q) && !rName.includes(q) && !ref.includes(q)) {
        return false;
      }
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

    if (type.includes('rejection') || desc.includes('rejection') || desc.includes('reject')) {
      navigate(`/rejected?taskId=${taskId}`, { state: { taskId } });
    } else if (type.includes('pending') || desc.includes('pending')) {
      navigate(`/pending?taskId=${taskId}`, { state: { taskId } });
    } else {
      navigate(`/completed?taskId=${taskId}`, { state: { taskId } });
    }
  };

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
        icon: <FiCheckCircle size={18} className="text-emerald-500" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500',
        amountPrefix: '+'
      };
    }
    if (isRejection) {
      return {
        badge: 'QA Audit / Reject',
        badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
        icon: <FiAlertOctagon size={18} className="text-amber-500" />,
        iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-500',
        amountPrefix: '+'
      };
    }
    if (isDelivery) {
      return {
        badge: 'Stock Delivery Bonus',
        badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25',
        icon: <HiSparkles size={18} className="text-purple-500" />,
        iconBg: 'bg-purple-500/10 border border-purple-500/20 text-purple-500',
        amountPrefix: '+'
      };
    }
    if (isTransferSent) {
      return {
        badge: 'Transfer Sent',
        badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
        icon: <FiArrowUpRight size={18} className="text-rose-500" />,
        iconBg: 'bg-rose-500/10 border border-rose-500/20 text-rose-500',
        amountPrefix: ''
      };
    }
    if (isTransferReceived) {
      return {
        badge: 'Transfer Received',
        badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
        icon: <FiArrowDownLeft size={18} className="text-blue-500" />,
        iconBg: 'bg-blue-500/10 border border-blue-500/20 text-blue-500',
        amountPrefix: '+'
      };
    }

    return {
      badge: 'QA Credit',
      badgeBg: 'bg-brand-500/15 text-brand-500 border border-brand-500/25',
      icon: <FiAward size={18} className="text-brand-500" />,
      iconBg: 'bg-brand-500/10 border border-brand-500/20 text-brand-500',
      amountPrefix: tx.amount > 0 ? '+' : ''
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-brand-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[rgba(255,255,255,0.12)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.18)] backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.25)] shadow-inner">
                <HiSparkles size={26} className="text-amber-300 drop-shadow-sm" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#ffffff] tracking-tight">
                    Reviewer Credit Ledger
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.2)] text-[#ffffff] border border-[rgba(255,255,255,0.3)]">
                    Rank #{wallet?.rank || 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.85)] font-medium">
                  Complete history of QA task approvals, rejection audits, and delivery rewards.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSendOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)] text-[#ffffff] font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-[rgba(255,255,255,0.25)]"
            >
              <FiSend size={15} />
              <span>Send Credits</span>
            </button>
            <button
              type="button"
              onClick={fetchWallet}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.28)] text-[#ffffff] transition-colors cursor-pointer active:scale-95"
              title="Refresh Wallet"
            >
              <FiRefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.2)] grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div>
            <span className="text-xs font-bold text-[rgba(255,255,255,0.8)] uppercase tracking-wider block mb-1">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#ffffff] drop-shadow-sm leading-none">
                {loading ? '...' : currentBalance}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[rgba(255,255,255,0.85)]">Credits</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-[rgba(255,255,255,0.8)] uppercase tracking-wider block mb-1">
              Total Earned
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 leading-none">
              +{wallet?.total_earned || 0}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[rgba(255,255,255,0.8)] uppercase tracking-wider block mb-1">
              Transferred Sent
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 leading-none">
              {wallet?.total_sent || 0}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[rgba(255,255,255,0.8)] uppercase tracking-wider block mb-1">
              Evaluation Level
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#ffffff] leading-none">
              Lead QA
            </span>
          </div>
        </div>
      </div>

      {/* Main Ledger Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Transactions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-dark-900 border border-dark-700/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
              {[
                { key: 'all', label: 'All Activity', icon: FiAward },
                { key: 'approvals', label: 'Approvals', icon: FiCheckCircle },
                { key: 'rejections', label: 'Rejections', icon: FiAlertOctagon },
                { key: 'delivery', label: 'Deliveries', icon: HiSparkles },
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
                        : 'bg-dark-800 text-white/60 border border-dark-700 hover:text-white'
                    }`}
                  >
                    <Icon size={13} className={isActive ? 'text-white' : 'text-white/40'} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-3 py-1.5 bg-dark-800 border border-dark-700 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="py-20 text-center bg-dark-900 border border-dark-700/80 rounded-2xl">
              <FiRefreshCw className="animate-spin text-2xl mx-auto mb-2 text-brand-400" />
              <p className="text-xs text-white/40 font-medium">Loading ledger transactions...</p>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="py-16 text-center bg-dark-900 border border-dark-700/80 rounded-2xl">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center text-white/40">
                <FiClock size={22} />
              </div>
              <p className="text-sm font-bold text-white">No Reviewer Transactions Found</p>
              <p className="text-xs text-white/40 mt-0.5">
                Evaluations and task approval points will be recorded here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTransactions.map((tx) => {
                const isPositive = Number(tx.amount) > 0;
                const actInfo = getReviewActivityInfo(tx);

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="p-4 bg-dark-900 hover:bg-dark-800/90 border border-dark-700/80 rounded-2xl transition-all flex items-center justify-between gap-4 cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${actInfo.iconBg}`}>
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
                              year: 'numeric',
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

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-base sm:text-lg font-black ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
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
                          className="px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-white/80 hover:text-white border border-dark-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="View Transaction Details"
                        >
                          <FiInfo size={13} className="text-brand-400" />
                          <span>Details</span>
                        </button>

                        {tx.reference_id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTaskRoute(tx.reference_id, tx);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 border border-brand-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                            title={`Open Task #${tx.reference_id}`}
                          >
                            <FiExternalLink size={13} />
                            <span>Task #{tx.reference_id}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-dark-900 border border-dark-700/80 rounded-2xl p-4 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-white/50 font-medium">
                Page {currentPage} of {totalPages} ({filteredTransactions.length} total records)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-dark-700 bg-dark-800 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
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
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-white/50 hover:bg-dark-800 hover:text-white'
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
                  className="px-3 py-1.5 rounded-xl border border-dark-700 bg-dark-800 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  Next
                  <FiChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Policy Guide */}
        <div className="space-y-4">
          <div className="bg-dark-900 border border-dark-700/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FiShield className="text-brand-400" size={18} />
              Reviewer Credit Policy
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 bg-dark-950 rounded-2xl border border-dark-700/60 space-y-1.5">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs">
                  <FiCheckCircle size={14} /> Task Approval (+{approvalCredit} Credit{approvalCredit > 1 ? 's' : ''})
                </h4>
                <p className="text-white/60 text-xs leading-relaxed">
                  Earn {approvalCredit} credit{approvalCredit > 1 ? 's' : ''} immediately upon conducting QA evaluation and approving submitted designer tasks.
                </p>
              </div>

              <div className="p-3.5 bg-dark-950 rounded-2xl border border-dark-700/60 space-y-1.5">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-xs">
                  <FiAlertOctagon size={14} /> Rejection Audit (+{rejectionCredit} Credit{rejectionCredit > 1 ? 's' : ''})
                </h4>
                <p className="text-white/60 text-xs leading-relaxed">
                  Earn {rejectionCredit} credit{rejectionCredit > 1 ? 's' : ''} for comprehensive feedback audits and revision requests on defective designs.
                </p>
              </div>

              <div className="p-3.5 bg-dark-950 rounded-2xl border border-dark-700/60 space-y-1.5">
                <h4 className="font-bold text-purple-400 flex items-center gap-2 text-xs">
                  <HiSparkles size={14} /> Stock Delivery Bonus (+{deliveryBonus} Credit{deliveryBonus > 1 ? 's' : ''})
                </h4>
                <p className="text-white/60 text-xs leading-relaxed">
                  Super reward of {deliveryBonus} credits awarded upon packaging and syncing verified files to the final cloud stock drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedTx && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
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
                className="relative w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-dark-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
                      <FiInfo size={17} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Transaction Breakdown</h3>
                      <p className="text-xs text-white/40">Ledger Record #{selectedTx.id}</p>
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
                      <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Amount</span>
                      <p className="text-emerald-400 font-extrabold text-base mt-0.5">+{selectedTx.amount} Credits</p>
                    </div>
                    <div>
                      <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Date & Time</span>
                      <p className="text-white font-semibold mt-0.5">{new Date(selectedTx.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedTx.meta_data?.task_title && (
                    <div className="pt-2 border-t border-dark-700/50">
                      <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Task Title</span>
                      <p className="text-white font-bold text-xs mt-0.5">{selectedTx.meta_data.task_title}</p>
                    </div>
                  )}

                  {selectedTx.meta_data?.rejection_reason && (
                    <div className="pt-2 border-t border-dark-700/50 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <span className="text-rose-400 block font-bold uppercase tracking-wider text-[10px] mb-1">Rejection Feedback</span>
                      <p className="text-white/80 font-medium leading-relaxed italic">"{selectedTx.meta_data.rejection_reason}"</p>
                    </div>
                  )}

                  {selectedTx.reference_id && (
                    <div className="pt-2 border-t border-dark-700/50 flex items-center justify-between">
                      <div>
                        <span className="text-white/40 block font-bold uppercase tracking-wider text-[10px]">Task Reference</span>
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
        </AnimatePresence>,
        document.body
      )}

      {/* Transfer Modal */}
      {createPortal(
        <AnimatePresence>
          {isSendOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSendOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FiSend className="text-brand-400" />
                    Send Credits to Teammate
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSendOpen(false)}
                    className="p-2 rounded-xl bg-dark-800 text-white/60 hover:text-white cursor-pointer"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <form onSubmit={handleTransfer} className="space-y-4">
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
                        className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-dark-700 rounded-2xl bg-dark-800 divide-y divide-dark-700/50">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-xs text-white/40">Searching...</div>
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
                                  : 'hover:bg-dark-700/50'
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
                                  <p className="text-xs font-bold text-white truncate">{u.name}</p>
                                  <p className="text-[11px] text-white/40 truncate">{u.designation || u.department_name || u.email}</p>
                                </div>
                              </div>

                              {isSelected && <FiCheckCircle className="text-brand-400 shrink-0" size={16} />}
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
                        className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm font-bold text-white placeholder-white/40 outline-none focus:border-brand-500"
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
                        placeholder="e.g. Great job on review!"
                        className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={transferring || !selectedUser || !transferAmount || parseInt(transferAmount, 10) > currentBalance}
                    className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {transferring ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={16} />
                        Transferring...
                      </>
                    ) : (
                      <>
                        <FiSend size={16} />
                        {selectedUser ? `Send ${transferAmount || 0} Credits to ${selectedUser.name}` : 'Send Credits'}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Complete Task Details & Deliverables Modal */}
      <TaskDetailsModal
        isOpen={!!activeModalTaskId}
        onClose={() => setActiveModalTaskId(null)}
        taskId={activeModalTaskId}
      />
    </div>
  );
};

export default Credits;