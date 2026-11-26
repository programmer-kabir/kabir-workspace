import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Laptop,
  LogOut,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import {
  cancelBillingRenewal,
  fetchDashboard,
  resendVerificationEmail,
  resubscribeBillingRenewal,
  revokeDeviceSlot,
  updateProfileName,
} from '../services/api';
import type { DashboardResponse } from '../types/stock';

export function DashboardPage() {
  const { user, pendingDevVerificationCode, verifyEmail, refreshSession, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [verifyCodeInput, setVerifyCodeInput] = useState(pendingDevVerificationCode ?? '');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboard();
      setDashboard(res);
      setDisplayNameInput(res.user.displayName);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void loadDashboard();
    } else {
      setDashboard(null);
    }
  }, [user]);

  useEffect(() => {
    if (pendingDevVerificationCode) {
      setVerifyCodeInput(pendingDevVerificationCode);
    }
  }, [pendingDevVerificationCode]);

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/75">
          <UserCheck className="mx-auto h-10 w-10 text-brand-indigo" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            Creator Account &amp; SaaS Dashboard
          </h1>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Sign in or create a free account to monitor your daily quota, manage active device slots, sync favorites in MySQL, and manage subscriptions.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/auth"
              className="rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-indigo/25"
            >
              Sign In / Create Account
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const activeUser = dashboard?.user ?? user;
  const usage = dashboard?.usage;
  const limit = activeUser.dailySearchesLimit;
  const used = usage?.searchesToday ?? 0;
  const usagePct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const activeSub = (dashboard?.subscriptions ?? []).find((s) => s.status === 'active');

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Account, Quota &amp; Device Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {activeUser.email} · Plan:{' '}
            <strong className="uppercase text-brand-indigo">{activeUser.planTier}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/pricing"
            className="rounded-xl bg-brand-indigo px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Upgrade Plan
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              toast.success('Signed out cleanly');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {!activeUser.emailVerified && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Email Not Verified — Search &amp; AI Tools Paused (403 Enforced Atomically)</span>
          </div>
          <p className="mt-1 text-slate-700 dark:text-slate-300">
            Verify your account email to unlock API requests.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              id="dash-verify-code"
              name="verificationCode"
              type="text"
              value={verifyCodeInput}
              onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
              placeholder="Verification code"
              className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await verifyEmail(verifyCodeInput);
                  await loadDashboard();
                  toast.success('Email verified cleanly!');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Invalid code');
                }
              }}
              className="rounded-lg bg-brand-indigo px-3.5 py-1.5 font-semibold text-white"
            >
              Verify Email
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await resendVerificationEmail();
                if (res.verificationCode) setVerifyCodeInput(res.verificationCode);
                toast.info(
                  res.verificationCode ? `Local Dev Code: ${res.verificationCode}` : 'Code sent'
                );
              }}
              className="font-semibold text-brand-cyan hover:underline"
            >
              Get / Resend Code
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>DAILY QUOTA USAGE</span>
            <Activity className="h-4 w-4 text-brand-cyan" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
            {limit < 0 ? `${used} / Unlimited` : `${used} / ${limit}`}
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan" style={{ width: `${usagePct}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Searches: {usage?.searchCount ?? 0} · AI Prompts: {usage?.promptCount ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>DEVICE SLOTS</span>
            <Laptop className="h-4 w-4 text-brand-indigo" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
            {(dashboard?.devices ?? []).length} / {activeUser.maxDevices}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Plan <strong className="uppercase">{activeUser.planTier}</strong> slot enforcement active
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>API &amp; SECURITY STATUS</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center gap-2 font-mono text-sm font-bold text-slate-900 dark:text-white">
            <span>mode={dashboard?.platform.adobeDataMode ?? 'demo'}</span>
            {activeUser.emailVerified && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Adobe API Key: {dashboard?.platform.adobeKeyConfigured ? 'Configured' : 'Demo Seed Active'}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Profile Settings</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateProfileName(displayNameInput);
                await refreshSession();
                await loadDashboard();
                toast.success('Profile updated');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Update failed');
              }
            }}
            className="mt-4 flex gap-2 text-xs"
          >
            <input
              id="dash-display-name"
              name="displayName"
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              aria-label="Display Name"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-indigo px-4 py-2 font-semibold text-white hover:bg-indigo-500"
            >
              Save Name
            </button>
          </form>

          <h3 className="mt-6 text-sm font-bold text-slate-900 dark:text-white">
            Active Registered Devices ({(dashboard?.devices ?? []).length}/{activeUser.maxDevices})
          </h3>
          <div className="mt-3 space-y-2 text-xs">
            {(dashboard?.devices ?? []).map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <span>{dev.deviceLabel}</span>
                    {dev.isCurrent && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                        This Browser
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Active: {new Date(`${dev.lastActiveAt}Z`).toLocaleString()}
                  </div>
                </div>

                {!dev.isCurrent && (
                  <button
                    type="button"
                    aria-label={`Revoke device ${dev.id}`}
                    onClick={async () => {
                      await revokeDeviceSlot(dev.id);
                      await loadDashboard();
                      toast.success('Device removed');
                    }}
                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Subscription &amp; Billing History
              </h2>
            </div>

            {activeSub && (
              <button
                type="button"
                onClick={async () => {
                  if (activeSub.cancelAtPeriodEnd) {
                    await resubscribeBillingRenewal();
                    toast.success('Auto-renewal restored');
                  } else {
                    await cancelBillingRenewal();
                    toast.info('Subscription set to cancel at period end');
                  }
                  await loadDashboard();
                }}
                className="rounded-lg border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {activeSub.cancelAtPeriodEnd ? 'Resubscribe' : 'Cancel Renewal'}
              </button>
            )}
          </div>

          {(dashboard?.subscriptions ?? []).length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              No paid subscription transactions yet. Explore Starter, Pro, or Annual tiers on Pricing.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5 text-xs">
              {(dashboard?.subscriptions ?? []).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div>
                    <div className="font-semibold uppercase text-slate-900 dark:text-white">
                      {sub.gateway} · {sub.status}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {sub.externalSubId ?? `Sub #${sub.id}`}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>{sub.cancelAtPeriodEnd ? 'Cancels at end' : 'Active'}</div>
                    <div>{new Date(`${sub.createdAt}Z`).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
