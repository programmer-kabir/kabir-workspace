// frontend/src/pages/BillingPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  Users,
  CheckCircle2,
  ExternalLink,
  Download,
  RefreshCw,
  FileText,
  Sparkles,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  User,
  AlertCircle,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Mail,
  UserCheck,
  Info,
  UserX,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SiteHeader from '@/components/header/SiteHeader';
import InvoiceModal from '@/components/billing/InvoiceModal';
import {
  getUserBilling,
  syncSubscription,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  respondTeamInvite
} from '@/lib/api';
import { UserBillingData, UserPayment, TeamData, TeamMember, TeamInvitation } from '@/types/icon';

export default function BillingPage() {
  const { user, setShowAuthModal, setAuthMode, refreshUser } = useAuth();
  const [billingData, setBillingData] = useState<UserBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedPaymentForInvoice, setSelectedPaymentForInvoice] = useState<UserPayment | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Team Management state
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Invitation response state (when logged-in user received an invitation)
  const [respondingInviteId, setRespondingInviteId] = useState<number | null>(null);
  const [inviteActionMessage, setInviteActionMessage] = useState<string | null>(null);

  // Modal for when user is not found in database
  const [notFoundEmailModal, setNotFoundEmailModal] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true);
      const res = await getTeamMembers();
      if (res.success && res.data) {
        setTeamData(res.data);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await getUserBilling();
      if (res.success && res.data) {
        setBillingData(res.data);
        if (res.data.subscription?.plan_type === 'team') {
          fetchTeam();
        }
      }
    } catch (err) {
      console.error('Failed to load billing details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBilling();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await syncSubscription();
      if (res.success) {
        setSyncMessage('Subscription & payments synced successfully!');
        await refreshUser();
        await fetchBilling();
        await fetchTeam();
      } else {
        setSyncMessage(res.message || 'Sync failed');
      }
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim();
    if (!emailToInvite) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await addTeamMember(emailToInvite);
      if (res.success) {
        setInviteSuccess(res.message || 'Teammate seat assigned successfully!');
        setInviteEmail('');
        await fetchTeam();
        await fetchBilling();
      } else {
        const errorMsg = res.message || 'Failed to assign seat';
        setInviteError(errorMsg);
        if (
          (res as any)?.data?.error_code === 'USER_NOT_FOUND' ||
          errorMsg.toLowerCase().includes('no registered account') ||
          errorMsg.toLowerCase().includes('must create an account') ||
          errorMsg.toLowerCase().includes('not found')
        ) {
          setNotFoundEmailModal(emailToInvite);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to assign seat';
      setInviteError(errorMsg);
      if (
        errorMsg.toLowerCase().includes('no registered account') ||
        errorMsg.toLowerCase().includes('not found')
      ) {
        setNotFoundEmailModal(emailToInvite);
      }
    } finally {
      setInviting(false);
      setTimeout(() => {
        setInviteSuccess(null);
        setInviteError(null);
      }, 5000);
    }
  };

  const handleRemoveMember = async (id: number, email: string) => {
    if (!window.confirm(`Revoke PRO seat from ${email}? They will return to the free quota limit.`)) {
      return;
    }
    setRemovingId(id);
    try {
      const res = await removeTeamMember(id);
      if (res.success) {
        await fetchTeam();
        await fetchBilling();
      } else {
        alert(res.message || 'Failed to revoke seat');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke seat');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRespondInvite = async (inviteId: number, action: 'accept' | 'decline') => {
    setRespondingInviteId(inviteId);
    setInviteActionMessage(null);
    try {
      const res = await respondTeamInvite(inviteId, action);
      if (res.success) {
        setInviteActionMessage(res.message);
        await refreshUser();
        await fetchBilling();
        await fetchTeam();
      } else {
        alert(res.message || 'Failed to respond to invitation');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to respond to invitation');
    } finally {
      setRespondingInviteId(null);
      setTimeout(() => setInviteActionMessage(null), 5000);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15] text-slate-100">
      <SiteHeader />

      <main className="flex-1  w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
              <CreditCard className="size-3.5" />
              <span>Billing & Subscription Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Subscription & Invoices
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              View your active subscription, payment receipts, and download PDF invoices anytime.
            </p>
          </div>

          {user && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm self-start sm:self-auto"
              title="Sync latest status and payments"
            >
              <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Subscription'}</span>
            </button>
          )}
        </div>

        {/* Sync message banner */}
        {syncMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="size-4 text-purple-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Invitation action feedback */}
        {inviteActionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{inviteActionMessage}</span>
          </div>
        )}

        {/* Pending Team Invitations received by the logged-in user */}
        {user?.pending_invites && user.pending_invites.length > 0 && (
          <div className="mb-8 space-y-4">
            {user.pending_invites.map((invite) => (
              <div 
                key={invite.invite_id}
                className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950/70 via-[#181928] to-indigo-950/70 border border-purple-500/40 shadow-2xl shadow-purple-950/40 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-300"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 blur-[80px] pointer-events-none" />

                <div className="flex items-start gap-4 relative z-10">
                  <div className="size-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Sparkles className="size-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-1.5 border border-purple-500/30">
                      <Users className="size-3.5" />
                      <span>Team Invitation Received</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {invite.owner_name || invite.owner_username || 'Team Owner'} invited you to join their Team Plan!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Approve this invitation to activate unlimited PRO downloads, full SVG source vectors, and commercial licenses under this team.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 relative z-10 self-start md:self-auto">
                  <button
                    onClick={() => handleRespondInvite(invite.invite_id, 'accept')}
                    disabled={respondingInviteId === invite.invite_id}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {respondingInviteId === invite.invite_id ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>Approve & Join Team</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRespondInvite(invite.invite_id, 'decline')}
                    disabled={respondingInviteId === invite.invite_id}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Not logged in state */}
        {!user && !loading && (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#13141f] border border-white/10  mx-auto">
            <div className="size-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <CreditCard className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sign in to view billing</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Please log in to see your active subscription details, past payment history, and download receipts.
            </p>
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              Log in to your account
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-6">
            <div className="h-44 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
            <div className="h-60 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
          </div>
        )}

        {/* Main Content */}
        {user && !loading && billingData && (
          <div className="space-y-8">
            {/* 1. Subscription Card */}
            {billingData.subscription && billingData.subscription.status === 'active' ? (
              <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#171826] to-[#12131d] border border-purple-500/30 shadow-xl shadow-purple-950/20">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[100px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                        Active Subscription
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white capitalize">
                        {billingData.subscription.plan_type === 'team_member' ? 'Team Plan (Member)' : `${billingData.subscription.plan_type} Plan`}
                      </h2>
                      {billingData.subscription.plan_type === 'team' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          {teamData?.total_seats || billingData.subscription.total_seats || billingData.subscription.team_seats || 8} Team Seats
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300">
                      {billingData.subscription.renews_at && billingData.subscription.plan_type !== 'team_member' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-purple-400" />
                          <span>Renews on: <strong className="text-white">{formatDate(billingData.subscription.renews_at)}</strong></span>
                        </div>
                      )}
                      
                      {billingData.subscription.plan_type === 'team_member' ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Users className="size-4 text-slate-500" />
                          <span>Invited by: <strong className="text-white">{billingData.subscription.owner?.name || 'Team Owner'}</strong> ({billingData.subscription.owner?.email})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="size-4 text-slate-500" />
                          <span>Started: {formatDate(billingData.subscription.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
                    {billingData.subscription.customer_portal_url && (
                      <a
                        href={billingData.subscription.customer_portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                      >
                        <span>Customer Portal</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    {billingData.subscription.plan_type !== 'team_member' && (
                      <Link
                        to="/pricing"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                      >
                        <span>Upgrade / Change</span>
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Team Seat Allocation Overview */}
                {billingData.subscription.plan_type === 'team' && (
                  <div className="mt-6 p-4.5 rounded-2xl bg-white/[0.03] border border-white/10 relative z-10 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-4 py-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <Users className="size-3.5 text-purple-400" />
                        <span>Seat Allocation</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({teamData?.total_seats || billingData.subscription.total_seats || billingData.subscription.team_seats || 8} Total Seats Included)
                        </span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px] ">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
                          {teamData?.used_seats || billingData.subscription.used_seats || 1} Assigned
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/25">
                          {teamData?.remaining_seats ?? billingData.subscription.remaining_seats ?? ((billingData.subscription.team_seats || 8) - 1)} Free / Available
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-4">
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(12, (((teamData?.used_seats || billingData.subscription.used_seats || 1) / (teamData?.total_seats || billingData.subscription.total_seats || billingData.subscription.team_seats || 8)) * 100)))}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-4 py-2">
                      <span>
                        {teamData?.used_seats || billingData.subscription.used_seats || 1} seat in use (Owner)
                        {((teamData?.used_seats || billingData.subscription.used_seats || 1) > 1) ? ` + ${((teamData?.used_seats || billingData.subscription.used_seats || 1) - 1)} teammate(s)` : ''}
                      </span>
                      <span className="text-purple-300">
                        {teamData?.remaining_seats ?? billingData.subscription.remaining_seats ?? ((billingData.subscription.team_seats || 8) - 1)} seats can be distributed to teammates below
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>Commercial License Included • Unlimited Vector Downloads</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#141522] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium mb-2">
                    <User className="size-3" />
                    <span>Free Plan</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">You are on the Free Plan</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
                    Upgrade to Solo or Team to unlock unlimited downloads, Figma files, and commercial licenses.
                  </p>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>View Pro Plans</span>
                </Link>
              </div>
            )}

            {/* 2. Team Member Management (Only shown for Team Plan owners) */}
            {billingData.subscription && billingData.subscription.status === 'active' && billingData.subscription.plan_type === 'team' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#141522] border border-white/10 relative overflow-hidden shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                      <Users className="size-3" />
                      <span>Team Seat Distribution</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Assign Team Seats</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                      You have <strong className="text-purple-300">{teamData?.total_seats || billingData.subscription.team_seats || 8} total seats</strong>. Enter teammate emails below to give them immediate, full PRO access with unlimited downloads.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <div className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-center min-w-[70px]">
                      <span className="block text-[11px] text-slate-400">Total</span>
                      <span className="text-base font-bold text-white">{teamData?.total_seats || billingData.subscription.team_seats || 8}</span>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[70px]">
                      <span className="block text-[11px] text-emerald-400 font-medium">Active</span>
                      <span className="text-base font-bold text-emerald-300">{teamData?.used_seats || 1}</span>
                    </div>
                    {(teamData?.pending_seats ?? 0) > 0 && (
                      <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[70px]">
                        <span className="block text-[11px] text-amber-400 font-medium">Pending</span>
                        <span className="text-base font-bold text-amber-300">{teamData?.pending_seats}</span>
                      </div>
                    )}
                    <div className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center min-w-[70px]">
                      <span className="block text-[11px] text-purple-300 font-medium">Available</span>
                      <span className="text-base font-bold text-purple-200">
                        {teamData?.remaining_seats ?? ((teamData?.total_seats || billingData.subscription.team_seats || 8) - (teamData?.used_seats || 1))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invite Form */}
                <div className="py-6 border-b border-white/10">
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-300">
                        Add New Team Member
                      </label>
                      <span className="text-[11px] text-purple-300">
                        * Accepts registered email or username
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <Mail className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Enter teammate's email or username (e.g. alex or alex@company.com)"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          disabled={inviting || (teamData?.remaining_seats !== undefined && teamData.remaining_seats <= 0)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={inviting || !inviteEmail.trim() || (teamData?.remaining_seats !== undefined && teamData.remaining_seats <= 0)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {inviting ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span>Sending Invite...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="size-3.5" />
                            <span>Invite Teammate</span>
                          </>
                        )}
                      </button>
                    </div>

                    {inviteSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                        <span>{inviteSuccess}</span>
                      </div>
                    )}
                    {inviteError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="size-3.5 text-rose-400 shrink-0" />
                        <span>{inviteError}</span>
                      </div>
                    )}
                    {teamData?.remaining_seats !== undefined && teamData.remaining_seats <= 0 && (
                      <p className="text-xs text-amber-400/90 flex items-center gap-1.5">
                        <AlertCircle className="size-3.5" />
                        All {teamData.total_seats || 8} seats are currently assigned or pending. Revoke an existing member below if you need to free up a seat.
                      </p>
                    )}
                  </form>
                </div>

                {/* Members List */}
                <div className="pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Active & Pending Seats ({teamData?.used_seats || 1} Active{(teamData?.pending_seats ?? 0) > 0 ? `, ${teamData?.pending_seats} Pending` : ''} of {teamData?.total_seats || billingData.subscription.team_seats || 8})
                  </h3>

                  <div className="space-y-2">
                    {/* Owner Row */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                          {(teamData?.owner?.name || billingData.customer?.name || 'O').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {teamData?.owner?.name || billingData.customer?.name || 'Account Owner'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Team Owner (Seat #1)
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {teamData?.owner?.email || billingData.customer?.email}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        Active (Owner)
                      </span>
                    </div>

                    {/* Invited Members */}
                    {teamData?.members && teamData.members.length > 0 ? (
                      teamData.members.map((member: TeamMember, idx: number) => {
                        const isPending = member.status === 'pending' || member.is_pending;
                        return (
                          <div key={member.id} className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 flex items-center justify-between gap-4 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`size-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isPending 
                                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' 
                                  : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                              }`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{member.name}</span>
                                  {isPending ? (
                                    <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                      <Clock className="size-3" /> Pending Approval
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                      <Check className="size-3" /> Active (PRO)
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                                    Seat #{idx + 2}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{member.email}</span>
                                  {isPending && (
                                    <span className="text-[11px] text-amber-400/80">
                                      • Waiting for approval
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 hidden sm:inline">
                                {isPending ? `Invited ${formatDate(member.created_at)}` : `Joined ${formatDate(member.created_at)}`}
                              </span>
                              <button
                                onClick={() => handleRemoveMember(member.id, member.email)}
                                disabled={removingId === member.id}
                                className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                  isPending
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border-amber-500/25'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-rose-500/25'
                                }`}
                                title={isPending ? 'Cancel this pending invitation' : 'Revoke seat access'}
                              >
                                <Trash2 className="size-3.5" />
                                <span>
                                  {removingId === member.id
                                    ? 'Processing...'
                                    : (isPending ? 'Cancel Invite' : 'Revoke Seat')}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-5 rounded-2xl bg-white/[0.01] border border-dashed border-white/10 text-center">
                        <p className="text-xs text-slate-400">
                          No additional teammates added yet. You have <strong className="text-purple-300">{teamData?.remaining_seats ?? ((teamData?.total_seats || billingData.subscription.team_seats || 8) - 1)} free seats</strong> available to assign above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Payment History & Invoices Table */}
            <div className="rounded-3xl bg-[#141522] border border-white/10 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-purple-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Payment History & Invoices
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All completed transactions and downloadable invoices.
                  </p>
                </div>

                <div className="text-xs text-slate-400 self-start sm:self-auto bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  Total Spent: <strong className="text-white">${billingData.total_spent.toFixed(2)} USD</strong> ({billingData.total_payments} {billingData.total_payments === 1 ? 'payment' : 'payments'})
                </div>
              </div>

              {billingData.payments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mx-auto mb-3">
                    <FileText className="size-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300">No payments found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    You haven&apos;t made any payments yet. When you upgrade, your receipts and invoices will be listed here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6 font-semibold">Date & Time</th>
                        <th className="py-3.5 px-4 font-semibold">Order #</th>
                        <th className="py-3.5 px-4 font-semibold">Plan</th>
                        <th className="py-3.5 px-4 font-semibold">Amount</th>
                        <th className="py-3.5 px-4 font-semibold">Method</th>
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right font-semibold">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {billingData.payments.map((pmt: UserPayment) => (
                        <tr key={pmt.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-slate-300">
                            {formatDate(pmt.created_at)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap font-medium text-white">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-white">
                                {pmt.order_number || `#${pmt.lemonsqueezy_order_id || pmt.id}`}
                              </span>
                              <button
                                onClick={() => {
                                  const idToCopy = (pmt.order_number || pmt.lemonsqueezy_order_id || String(pmt.id)).replace(/^#/, '');
                                  navigator.clipboard.writeText(idToCopy);
                                  setCopiedId(pmt.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Copy Order ID"
                              >
                                {copiedId === pmt.id ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {pmt.plan_type === 'team' || (pmt.team_seats && pmt.team_seats > 1) ? (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <Users className="size-3" />
                                  Team ({pmt.team_seats || teamData?.total_seats || billingData.subscription?.total_seats || 8} Seats)
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" title="Active approved seats">
                                    {teamData?.used_seats || pmt.used_seats || billingData.subscription?.used_seats || 1} Active
                                  </span>
                                  {(teamData?.pending_seats ?? 0) > 0 && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20" title="Seats pending teammate approval">
                                        {teamData?.pending_seats} Pending
                                      </span>
                                    </>
                                  )}
                                  <span className="text-slate-600">•</span>
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20" title="Seats available/remaining">
                                    {teamData?.remaining_seats ?? pmt.remaining_seats ?? billingData.subscription?.remaining_seats ?? ((pmt.team_seats || 8) - 1)} Left
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 capitalize">
                                {pmt.plan_type || 'Solo'} Plan
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap font-bold text-white">
                            ${Number(pmt.amount).toFixed(2)} <span className="text-xs font-normal text-slate-400">{pmt.currency}</span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                            {pmt.card_brand ? (
                              <span className="capitalize">
                                {pmt.card_brand} {pmt.card_last_four ? `•••• ${pmt.card_last_four}` : ''}
                              </span>
                            ) : (
                              <span className="capitalize">{pmt.payment_method || 'Card'}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${pmt.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                              <span className={`size-1.5 rounded-full ${pmt.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <span className="capitalize">{pmt.status}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setSelectedPaymentForInvoice(pmt)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                                title="View, Print & Download IconBaba Invoice"
                              >
                                <FileText className="size-3.5" />
                                <span>View Invoice</span>
                              </button>
                              {pmt.receipt_url && (
                                <a
                                  href={pmt.receipt_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5 cursor-pointer"
                                  title="View payment gateway receipt"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Help / FAQ note */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-slate-400">
              <AlertCircle className="size-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-300">Need official PDF invoices or order proofs?</p>
                <p className="mt-0.5">
                  Click <strong>&quot;View Invoice&quot;</strong> on any transaction above to generate, view, and print/save a full itemized IconBaba PDF invoice. You can also copy your Order ID or upgrade seats at any time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {selectedPaymentForInvoice && user && billingData && (
          <InvoiceModal
            payment={selectedPaymentForInvoice}
            customerName={billingData.customer?.name || user.full_name || user.username}
            customerEmail={billingData.customer?.email || user.email}
            userId={user.id}
            onClose={() => setSelectedPaymentForInvoice(null)}
          />
        )}

        {/* User Not Registered / Not Found Modal */}
        {notFoundEmailModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setNotFoundEmailModal(null)}
          >
            <div 
              className="relative w-full max-w-md bg-[#13141f] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/50 text-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setNotFoundEmailModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="size-4" />
              </button>

              {/* Red Alert Icon */}
              <div className="size-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4 shadow-lg shadow-rose-500/10">
                <UserX className="size-8" />
              </div>

              <h3 className="text-xl font-extrabold text-white tracking-tight">
                User Not Found!
              </h3>
              <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mt-1">
                No Registered Account Found
              </p>

              {/* Target Email Box */}
              <div className="my-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 inline-block max-w-full">
                <span className="font-mono text-xs sm:text-sm text-rose-300 font-medium break-all">
                  {notFoundEmailModal}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                No IconBaba account was found matching this email or username. Team seats can only be assigned to existing registered accounts.
              </p>
              
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                  <span className="size-1.5 rounded-full bg-purple-400" />
                  <span>How to resolve this:</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-4 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p className="text-slate-300">Ask your teammate to create an account on IconBaba using this email or username.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-4 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p className="text-slate-300">Once they register, enter their email or username here to instantly grant them PRO access.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-4 text-emerald-300" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copy Website Link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setNotFoundEmailModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
