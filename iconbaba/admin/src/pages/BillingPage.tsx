// admin/src/pages/BillingPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  Crown,
  Receipt,
  DollarSign,
  Search,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { getBillingStats, getAdminSubscriptions, getAdminPayments } from '../lib/api';
import { BillingStats, AdminSubscriptionItem, AdminPaymentItem } from '../types/admin';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions');

  // Stats
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Subscriptions Tab State
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsPage, setSubsPage] = useState(1);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsTotalPages, setSubsTotalPages] = useState(1);
  const [subsSearch, setSubsSearch] = useState('');
  const [subsStatus, setSubsStatus] = useState('all');
  const [subsPlan, setSubsPlan] = useState('all');

  // Payments Tab State
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsStatus, setPaymentsStatus] = useState('all');

  // Copy feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getBillingStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load billing stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await getAdminSubscriptions({
        page: subsPage,
        limit: 15,
        q: subsSearch.trim(),
        status: subsStatus,
        plan_type: subsPlan !== 'all' ? subsPlan : undefined,
      });
      if (res.success && res.data) {
        setSubscriptions(res.data.items);
        setSubsTotal(res.data.pagination.total);
        setSubsTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setSubsLoading(false);
    }
  }, [subsPage, subsSearch, subsStatus, subsPlan]);

  // Fetch Payments
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const res = await getAdminPayments({
        page: paymentsPage,
        limit: 15,
        q: paymentsSearch.trim(),
        status: paymentsStatus,
      });
      if (res.success && res.data) {
        setPayments(res.data.items);
        setPaymentsTotal(res.data.pagination.total);
        setPaymentsTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentsPage, paymentsSearch, paymentsStatus]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else {
      fetchPayments();
    }
  }, [activeTab, fetchSubscriptions, fetchPayments]);

  const refreshAll = () => {
    fetchStats();
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else {
      fetchPayments();
    }
  };

  // Helper date formatter
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Card brand helper
  const renderCardBadge = (brand?: string | null, last4?: string | null) => {
    if (!brand && !last4) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          <span>Card</span>
        </span>
      );
    }

    const b = (brand || 'Card').toUpperCase();
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200">
        <span className="font-semibold tracking-wider text-indigo-300">{b}</span>
        {last4 && <span className="font-mono text-slate-400">•••• {last4}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <span>Finance & Billing</span>
            <span>/</span>
            <span>Lemon Squeezy Sync</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Subscriptions & Payments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time transaction log, member access control, and annual renewal dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/60 shadow-sm transition-all"
            title="Refresh billing data"
          >
            <RefreshCw className={`w-4 h-4 ${(statsLoading || subsLoading || paymentsLoading) ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {statsLoading ? (
                <div className="h-9 w-28 bg-slate-800 animate-pulse rounded" />
              ) : (
                `$${(stats?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Gross processed via Lemon Squeezy
            </p>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crown className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Subscribers
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {statsLoading ? (
                <div className="h-9 w-16 bg-slate-800 animate-pulse rounded" />
              ) : (
                stats?.active_subscribers || 0
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block animate-pulse"></span>
              Currently active Pro & Team accounts
            </p>
          </div>
        </div>

        {/* Total Payments */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Receipt className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {statsLoading ? (
                <div className="h-9 w-16 bg-slate-800 animate-pulse rounded" />
              ) : (
                stats?.total_payments || 0
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Successful checkout payments
            </p>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Plan Distribution
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white flex items-center gap-2">
              {statsLoading ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" />
              ) : (
                <>
                  <span className="text-amber-400">{stats?.plans?.solo || 0} Solo</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-indigo-400">{stats?.plans?.team || 0} Team</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active plan breakdown
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-800/80 px-6 pt-5 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Subscriptions</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'subscriptions'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {subsTotal}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Payment History</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'payments'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {paymentsTotal}
              </span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'subscriptions' ? (
              <>
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user, email, sub ID..."
                    value={subsSearch}
                    onChange={(e) => {
                      setSubsSearch(e.target.value);
                      setSubsPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={subsStatus}
                  onChange={(e) => {
                    setSubsStatus(e.target.value);
                    setSubsPage(1);
                  }}
                  className="px-3 py-2 bg-slate-950/70 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="expired">Expired / Past Due</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={subsPlan}
                  onChange={(e) => {
                    setSubsPlan(e.target.value);
                    setSubsPage(1);
                  }}
                  className="px-3 py-2 bg-slate-950/70 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Plans</option>
                  <option value="solo">Solo Plan</option>
                  <option value="team">Team Plan</option>
                </select>
              </>
            ) : (
              <>
                <div className="relative min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search order #, user, card..."
                    value={paymentsSearch}
                    onChange={(e) => {
                      setPaymentsSearch(e.target.value);
                      setPaymentsPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={paymentsStatus}
                  onChange={(e) => {
                    setPaymentsStatus(e.target.value);
                    setPaymentsPage(1);
                  }}
                  className="px-3 py-2 bg-slate-950/70 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: Subscriptions Table                               */}
        {/* ======================================================== */}
        {activeTab === 'subscriptions' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">User / Subscriber</th>
                    <th className="py-3.5 px-4">Plan & Seats</th>
                    <th className="py-3.5 px-4">Access Status</th>
                    <th className="py-3.5 px-4">Subscribed Date</th>
                    <th className="py-3.5 px-4">Renewal / Expiry</th>
                    <th className="py-3.5 px-4">Last Order</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {subsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                          <span>Loading subscriptions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Crown className="w-10 h-10 text-slate-600 mx-auto" />
                          <p className="text-base font-semibold text-slate-300">No subscriptions found</p>
                          <p className="text-xs text-slate-500">
                            No member subscriptions match the current search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isActive = sub.is_currently_active;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* User info */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {sub.full_name ? sub.full_name.charAt(0).toUpperCase() : sub.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-2">
                                  <span>{sub.full_name || sub.username}</span>
                                  <span className="text-[11px] font-mono text-slate-500">ID #{sub.user_id}</span>
                                </div>
                                <div className="text-xs text-slate-400 font-mono">{sub.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Plan & Seats */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  sub.plan_type === 'team'
                                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                    : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                }`}
                              >
                                <Crown className="w-3 h-3" />
                                <span>{sub.plan_type} Plan</span>
                              </span>
                              <span className="text-xs text-slate-400">
                                {sub.team_seats > 1 ? `${sub.team_seats} seats` : '1 seat (Personal)'}
                              </span>
                            </div>
                          </td>

                          {/* Access Status */}
                          <td className="py-4 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Active</span>
                              </span>
                            ) : sub.status === 'cancelled' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                <XCircle className="w-3 h-3" />
                                <span>Cancelled</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{sub.status || 'Expired'}</span>
                              </span>
                            )}
                          </td>

                          {/* Subscribed Date */}
                          <td className="py-4 px-4">
                            <div className="text-slate-200 text-xs font-medium">
                              {formatDate(sub.created_at)}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>Started</span>
                            </div>
                          </td>

                          {/* Renewal / Expiry */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{formatShortDate(sub.renews_at || sub.ends_at)}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Renews & ends on same date
                              </div>
                            </div>
                          </td>

                          {/* Last Order */}
                          <td className="py-4 px-4">
                            {sub.last_order_number ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-xs font-bold text-indigo-300">
                                  {sub.last_order_number}
                                </span>
                                {sub.last_payment_amount && (
                                  <div className="text-xs text-slate-400 font-semibold">
                                    ${parseFloat(sub.last_payment_amount).toFixed(2)} {sub.last_payment_currency}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sub.customer_portal_url ? (
                                <a
                                  href={sub.customer_portal_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-all"
                                  title="Open Lemon Squeezy Customer Billing Portal"
                                >
                                  <span>Portal</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-500 italic">No portal</span>
                              )}

                              <button
                                onClick={() => copyToClipboard(sub.lemonsqueezy_subscription_id)}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Copy Lemon Squeezy Subscription ID"
                              >
                                {copiedText === sub.lemonsqueezy_subscription_id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Subscriptions */}
            {subsTotalPages > 1 && (
              <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {subsPage} of {subsTotalPages} ({subsTotal} total subscriptions)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={subsPage <= 1}
                    onClick={() => setSubsPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={subsPage >= subsTotalPages}
                    onClick={() => setSubsPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Payment History Table                             */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Order Number</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                          <span>Loading payment transactions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
                          <p className="text-base font-semibold text-slate-300">No payments found</p>
                          <p className="text-xs text-slate-500">
                            No payment transactions match the current search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((pmt) => {
                      const isPaid = pmt.status === 'paid';
                      return (
                        <tr key={pmt.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Order Number */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700/60">
                                {pmt.order_number || `#${pmt.id}`}
                              </span>
                              <button
                                onClick={() => copyToClipboard(pmt.order_number || String(pmt.id))}
                                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                                title="Copy Order Number"
                              >
                                {copiedText === (pmt.order_number || String(pmt.id)) ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-1">
                              LS ID: {pmt.lemonsqueezy_order_id}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-semibold text-xs">
                                {pmt.full_name ? pmt.full_name.charAt(0).toUpperCase() : (pmt.username?.charAt(0).toUpperCase() || 'U')}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200">
                                  {pmt.full_name || pmt.username}
                                </div>
                                <div className="text-xs text-slate-400 font-mono">{pmt.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-4">
                            <div className="text-base font-extrabold text-white">
                              ${parseFloat(pmt.amount).toFixed(2)}
                            </div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                              {pmt.currency || 'USD'}
                            </span>
                          </td>

                          {/* Payment Method */}
                          <td className="py-4 px-4">
                            {renderCardBadge(pmt.card_brand, pmt.card_last_four)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Paid</span>
                              </span>
                            ) : pmt.status === 'refunded' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Refunded</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>{pmt.status}</span>
                              </span>
                            )}
                          </td>

                          {/* Date & Time */}
                          <td className="py-4 px-4">
                            <div className="text-slate-200 text-xs font-medium">
                              {formatDate(pmt.created_at)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Transaction timestamp
                            </div>
                          </td>

                          {/* Receipt */}
                          <td className="py-4 px-6 text-right">
                            {pmt.receipt_url ? (
                              <a
                                href={pmt.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
                                title="View official Lemon Squeezy Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-500 italic">No receipt</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Payments */}
            {paymentsTotalPages > 1 && (
              <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {paymentsPage} of {paymentsTotalPages} ({paymentsTotal} total payments)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={paymentsPage <= 1}
                    onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={paymentsPage >= paymentsTotalPages}
                    onClick={() => setPaymentsPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
