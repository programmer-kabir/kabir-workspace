import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  CreditCard
} from 'lucide-react';
import {
  fetchAdminPaymentStats,
  fetchAdminTransactions,
  approveAdminTransaction,
  rejectAdminTransaction,
  fetchAdminPaymentMethods,
  createAdminPaymentMethod,
  updateAdminPaymentMethod,
  deleteAdminPaymentMethod
} from '../../services/api';
import {
  AdminPaymentStats,
  PaymentTransaction,
  PaymentMethod
} from '../../types';

export const AdminPaymentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verification' | 'wallets'>('verification');
  const [stats, setStats] = useState<AdminPaymentStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [wallets, setWallets] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action Modals State
  const [approveModalTrx, setApproveModalTrx] = useState<PaymentTransaction | null>(null);
  const [adminApproveNote, setAdminApproveNote] = useState('');
  const [rejectModalTrx, setRejectModalTrx] = useState<PaymentTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Wallet Modal State
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<PaymentMethod | null>(null);
  const [walletForm, setWalletForm] = useState({
    name: '',
    identifier: '',
    accountNumber: '',
    accountType: 'Personal',
    instructions: '',
    isEnabled: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, trxData, walletsData] = await Promise.all([
        fetchAdminPaymentStats(),
        fetchAdminTransactions({
          status: statusFilter,
          search: searchQuery,
          page,
          limit: 20
        }),
        fetchAdminPaymentMethods()
      ]);

      setStats(statsData);
      setTransactions(trxData.transactions);
      setTotalPages(trxData.totalPages);
      setWallets(walletsData);
    } catch (err: any) {
      console.error('Admin payments data error:', err);
      setError(err.message || 'Failed to load admin payment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleApprove = async () => {
    if (!approveModalTrx) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await approveAdminTransaction(approveModalTrx.id, adminApproveNote.trim() || undefined);
      setApproveModalTrx(null);
      setAdminApproveNote('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalTrx || !rejectionReason.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await rejectAdminTransaction(rejectModalTrx.id, rejectionReason.trim());
      setRejectModalTrx(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenWalletModal = (wallet?: PaymentMethod) => {
    if (wallet) {
      setEditingWallet(wallet);
      setWalletForm({
        name: wallet.name,
        identifier: wallet.identifier,
        accountNumber: wallet.account_number,
        accountType: wallet.account_type,
        instructions: wallet.instructions,
        isEnabled: wallet.is_enabled === 1
      });
    } else {
      setEditingWallet(null);
      setWalletForm({
        name: '',
        identifier: '',
        accountNumber: '',
        accountType: 'Personal',
        instructions: '',
        isEnabled: true
      });
    }
    setActionError(null);
    setWalletModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setActionError(null);
    try {
      if (editingWallet) {
        await updateAdminPaymentMethod(editingWallet.id, {
          name: walletForm.name,
          accountNumber: walletForm.accountNumber,
          accountType: walletForm.accountType,
          instructions: walletForm.instructions,
          isEnabled: walletForm.isEnabled
        });
      } else {
        await createAdminPaymentMethod({
          name: walletForm.name,
          identifier: walletForm.identifier,
          accountNumber: walletForm.accountNumber,
          accountType: walletForm.accountType,
          instructions: walletForm.instructions,
          isEnabled: walletForm.isEnabled
        });
      }
      setWalletModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save wallet configuration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await deleteAdminPaymentMethod(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment method.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Restricted Area</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <span>Payment Verification & Billing Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manually verify bKash, Nagad, and Rocket transactions to activate customer subscriptions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Financial Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">{stats.pendingCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Requires manual cross-check</div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>Total Approved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">{stats.approvedCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active subscriptions granted</div>
          </div>

          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>Total Rejected</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">{stats.rejectedCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Invalid or fake TrxIDs</div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">৳{stats.totalRevenueBdt.toLocaleString()} BDT</div>
            <div className="text-[11px] text-slate-400 mt-1">Real verified payments</div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'verification'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Payment Transactions ({stats?.pendingCount || 0} Pending)
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'wallets'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Wallet Settings ({wallets.length})
        </button>
      </div>

      {/* View 1: Payment Verification Table */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by TrxID, mobile number, user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review Only</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Transactions List Table */}
          {transactions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-400">No Transactions Found</div>
              <p className="text-xs text-slate-500">No payment submissions matched your query or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Plan & Billing</th>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4">Sender Number</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-white">{tx.user_name || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400">{tx.user_email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <span className="font-bold uppercase text-indigo-300">
                          {tx.plan_name || tx.plan_slug}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize">{tx.billing_period}</div>
                      </td>

                      <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                        {tx.payment_method_name}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {tx.sender_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 font-bold border border-slate-800">
                          {tx.transaction_id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans font-bold text-emerald-400">
                        ৳{tx.amount} BDT
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase ${
                          tx.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-sans">
                        {tx.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setApproveModalTrx(tx);
                                setAdminApproveNote('');
                                setActionError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                setRejectModalTrx(tx);
                                setRejectionReason('');
                                setActionError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {tx.status === 'approved' ? `Approved on ${new Date(tx.verified_at || tx.updated_at).toLocaleDateString()}` : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* View 2: Wallet Settings */}
      {activeTab === 'wallets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Configured Payment Methods</h3>
              <p className="text-xs text-slate-400">Users will send real money to these wallet numbers.</p>
            </div>

            <button
              onClick={() => handleOpenWalletModal()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Wallet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-white text-base">{wallet.name}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    wallet.is_enabled === 1
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {wallet.is_enabled === 1 ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{wallet.account_type} Number:</div>
                  <div className="text-lg font-mono font-bold text-white mt-0.5 tracking-wider">
                    {wallet.account_number}
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                  {wallet.instructions}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenWalletModal(wallet)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Wallet"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteWallet(wallet.id)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition-colors"
                    title="Delete Wallet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Payment Modal */}
      {approveModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Verify & Approve Payment</span>
              </h3>
              <button onClick={() => setApproveModalTrx(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white font-bold">{approveModalTrx.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="text-indigo-400 font-bold uppercase">{approveModalTrx.plan_slug} ({approveModalTrx.billing_period})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Received:</span>
                <span className="text-emerald-400 font-bold">৳{approveModalTrx.amount} BDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wallet & Sender:</span>
                <span className="text-white font-mono">{approveModalTrx.payment_method_name} ({approveModalTrx.sender_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-indigo-300 font-mono font-bold">{approveModalTrx.transaction_id}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Admin Verification Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Cross-checked with bKash merchant statement #1029"
                value={adminApproveNote}
                onChange={(e) => setAdminApproveNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalTrx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Activating Plan...' : 'Confirm & Activate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Reject Payment Verification</span>
              </h3>
              <button onClick={() => setRejectModalTrx(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Rejecting TrxID <code className="text-rose-400 font-mono font-bold">{rejectModalTrx.transaction_id}</code>. Please provide a clear explanation for the customer.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Rejection Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Transaction ID was not found in our SMS statement, or amount received was incorrect."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalTrx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Wallet Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span>{editingWallet ? 'Edit Wallet Configuration' : 'Add Custom Wallet'}</span>
              </h3>
              <button onClick={() => setWalletModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveWallet} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Wallet Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bKash, Upay"
                    value={walletForm.name}
                    onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Identifier</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingWallet}
                    placeholder="e.g. upay"
                    value={walletForm.identifier}
                    onChange={(e) => setWalletForm({ ...walletForm, identifier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01712345678"
                    value={walletForm.accountNumber}
                    onChange={(e) => setWalletForm({ ...walletForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Account Type</label>
                  <select
                    value={walletForm.accountType}
                    onChange={(e) => setWalletForm({ ...walletForm, accountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Instructions for User</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Step-by-step instructions for user..."
                  value={walletForm.instructions}
                  onChange={(e) => setWalletForm({ ...walletForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={walletForm.isEnabled}
                  onChange={(e) => setWalletForm({ ...walletForm, isEnabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isEnabled" className="text-xs text-slate-300 cursor-pointer">
                  Enable this payment method for public checkout
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  {isProcessing ? 'Saving...' : 'Save Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
