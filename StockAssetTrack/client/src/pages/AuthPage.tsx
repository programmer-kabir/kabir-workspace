import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { useAuth } from '../hooks/useAuth';
import { ApiClientError, resendVerificationEmail } from '../services/api';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const {
    user,
    pendingDevVerificationCode,
    signIn,
    register,
    verifyEmail,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signIn(email, password, undefined, turnstileToken || undefined);
        toast.success('Signed in to StockAssetTrack');
        navigate(redirectTarget);
      } else {
        const res = await register(email, password, displayName, undefined, turnstileToken || undefined);
        if (res.verificationCode) {
          setVerifyCodeInput(res.verificationCode);
        }
        toast.success('Account created! Please verify your email code.');
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'DEVICE_LIMIT_EXCEEDED') {
        toast.error('Active device slot limit reached. Select a slot to replace.');
        navigate('/auth/device-limit');
        return;
      }
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <section className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>Signed in as {user.displayName}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {user.email} · Plan: <strong className="uppercase text-brand-indigo">{user.planTier}</strong>
          </p>

          {!user.emailVerified ? (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <div className="font-bold text-amber-600 dark:text-amber-300">
                Email Verification Required
              </div>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Enter your 8-character verification code below to unlock searches and AI tools.
              </p>

              {pendingDevVerificationCode && (
                <div className="mt-2 rounded-lg bg-slate-950/80 px-3 py-1.5 font-mono text-[11px] text-emerald-300">
                  Local Dev Code: {pendingDevVerificationCode}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  id="auth-verify-code"
                  name="verificationCode"
                  type="text"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
                  placeholder="8-char code"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await verifyEmail(verifyCodeInput);
                      toast.success('Email verified!');
                      navigate(redirectTarget);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Verification failed');
                    }
                  }}
                  className="rounded-lg bg-brand-indigo px-4 py-2 font-semibold text-white hover:bg-indigo-500"
                >
                  Verify
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const res = await resendVerificationEmail();
                  if (res.verificationCode) setVerifyCodeInput(res.verificationCode);
                  toast.info('Verification code refreshed');
                }}
                className="mt-2 text-[11px] font-semibold text-brand-cyan hover:underline"
              >
                Resend verification code
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(redirectTarget)}
              className="mt-6 w-full rounded-xl bg-brand-indigo py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-indigo/15 text-brand-indigo">
            {mode === 'login' ? <KeyRound className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Sign In to StockAssetTrack' : 'Create Creator Account'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Access daily quota tracking, MySQL competitor watchlists &amp; synced favorites.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 font-semibold transition ${
              mode === 'login' ? 'bg-brand-indigo text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-lg py-2 font-semibold transition ${
              mode === 'register' ? 'bg-brand-indigo text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-display-name" className="block font-semibold text-slate-700 dark:text-slate-300">
                Display Name
              </label>
              <input
                id="auth-display-name"
                name="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kabir Studio"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative mt-1 flex items-center">
              <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3.5 text-sm text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative mt-1 flex items-center">
              <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3.5 text-sm text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <TurnstileWidget onToken={setTurnstileToken} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-indigo/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting
              ? 'Processing...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Free Account'}
          </button>
        </form>
      </div>
    </section>
  );
}
