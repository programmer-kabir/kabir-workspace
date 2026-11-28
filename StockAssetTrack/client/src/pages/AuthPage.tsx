import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  RotateCw,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { useAuth } from '../hooks/useAuth';
import {
  ApiClientError,
  resendVerificationEmail,
  setStoredAuthToken,
  setStoredDeviceToken,
} from '../services/api';

interface OtpBoxInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

function OtpBoxInput({ value, onChange, onComplete, disabled }: OtpBoxInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length: 8 }, (_, i) => value[i] || '');

  const handleCharChange = (index: number, rawChar: string) => {
    const cleaned = rawChar.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!cleaned) {
      const nextArr = [...chars];
      nextArr[index] = '';
      onChange(nextArr.join(''));
      return;
    }

    const char = cleaned.slice(-1);
    const nextArr = [...chars];
    nextArr[index] = char;
    const nextStr = nextArr.join('');
    onChange(nextStr);

    if (index < 7) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    } else if (nextStr.length === 8 && onComplete) {
      onComplete(nextStr);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[index]) {
        const nextArr = [...chars];
        nextArr[index] = '';
        onChange(nextArr.join(''));
      } else if (index > 0) {
        const nextArr = [...chars];
        nextArr[index - 1] = '';
        onChange(nextArr.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
    if (!pasted) return;

    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 7);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 8 && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {chars.map((char, index) => {
        const isMiddle = index === 3;
        return (
          <div key={index} className="flex items-center gap-2 sm:gap-3">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={char}
              disabled={disabled}
              onChange={(e) => handleCharChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${index + 1}`}
              className={`h-12 w-9 rounded-xl border-2 text-center font-mono text-lg font-extrabold uppercase transition outline-none sm:h-14 sm:w-11 sm:text-xl ${
                char
                  ? 'border-brand-indigo bg-brand-indigo/15 text-brand-indigo shadow-md shadow-brand-indigo/25 dark:text-indigo-200'
                  : 'border-slate-200 bg-slate-50/80 text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:border-slate-700'
              } focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/20`}
            />
            {isMiddle && (
              <span className="select-none text-base font-bold text-slate-400 dark:text-slate-600 sm:text-xl">
                &ndash;
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const {
    user,
    signIn,
    register,
    verifyEmail,
    signOut,
    refreshSession,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
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
        await register(email, password, displayName, undefined, turnstileToken || undefined);
        setVerifyCodeInput('');
        toast.success('Account created! Check your email for the 8-character verification code.');
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'EMAIL_NOT_VERIFIED') {
        const details = err.details as { email?: string; pendingToken?: string; deviceToken?: string } | undefined;
        const unverifiedEmail = details?.email || email;
        if (details?.pendingToken) {
          setStoredAuthToken(details.pendingToken);
          if (details.deviceToken) setStoredDeviceToken(details.deviceToken);
          await refreshSession();
        }
        setVerifyCodeInput('');
        toast.info(`Account requires verification. We sent an 8-character code to ${unverifiedEmail}`);
        return;
      }
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

  const handleVerify = async (codeToSubmit = verifyCodeInput) => {
    if (codeToSubmit.trim().length < 8) {
      toast.error('Please enter the complete 8-character verification code.');
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmail(codeToSubmit.trim());
      toast.success('Email verified successfully! Welcome aboard.');
      navigate(redirectTarget);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid or expired verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success(`Fresh verification code sent to ${user?.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  // State A: User is already signed in
  if (user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-10">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-indigo/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-brand-cyan/10 blur-3xl pointer-events-none" />

          {/* User Status Bar */}
          <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-indigo/15 font-bold text-brand-indigo dark:text-indigo-300">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {user.displayName}
                  </span>
                  <span className="rounded-full bg-brand-indigo/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-indigo dark:text-indigo-300">
                    {user.planTier}
                  </span>
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                signOut();
                toast.info('Signed out');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {!user.emailVerified ? (
            <div className="relative mt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-indigo/20 via-brand-purple/20 to-brand-cyan/20 text-brand-indigo shadow-inner ring-1 ring-brand-indigo/30 dark:text-indigo-300">
                <Mail className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Verify Your Email Address
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                We sent an 8-character verification code to{' '}
                <strong className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-900 dark:bg-slate-800 dark:text-white">
                  {user.email}
                </strong>. Enter the code below to unlock the full platform.
              </p>

              {/* 8-Box Segmented OTP Input */}
              <div className="mt-8">
                <OtpBoxInput
                  value={verifyCodeInput}
                  onChange={setVerifyCodeInput}
                  disabled={submitting}
                  onComplete={handleVerify}
                />
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={verifyCodeInput.length < 8 || submitting}
                  onClick={() => handleVerify()}
                  className={`w-full max-w-md rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition ${
                    verifyCodeInput.length === 8 && !submitting
                      ? 'bg-gradient-to-r from-brand-indigo via-indigo-600 to-brand-purple shadow-brand-indigo/25 hover:opacity-95'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                  }`}
                >
                  {submitting ? 'Verifying Code...' : 'Verify & Unlock All Tools'}
                </button>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                  <span>Didn&apos;t receive the email?</span>
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1 font-semibold text-brand-indigo transition hover:underline dark:text-brand-cyan"
                  >
                    <RotateCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Sending...' : 'Resend Code'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Tip: Check your spam or promotions folder if it doesn&apos;t appear in your primary inbox.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Account Active &amp; Verified
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                You have full access to Niche Explorer, Category Heatmaps, and AI Prompt tools.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(redirectTarget)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-indigo px-6 py-3 text-xs font-bold text-white shadow-md shadow-brand-indigo/25 transition hover:bg-indigo-500 sm:text-sm"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900 sm:text-sm"
                >
                  Explore Niches
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // State B: Guest Sign In / Registration Form
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-10">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-indigo/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-brand-purple/10 blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="relative text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-1 text-xs font-medium text-brand-indigo dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>StockAssetTrack Creator Access</span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {mode === 'login' ? 'Welcome Back, Creator' : 'Create Your Free Creator Account'}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
            {mode === 'login'
              ? 'Sign in to access your daily quota, competitor watchlists, and saved research.'
              : 'Start free with 2 niche searches per day, 12 instant sorts, and 1-click Adobe Stock CSV exports.'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="relative mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-950/80">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 transition ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-md dark:bg-brand-indigo dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 transition ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-md dark:bg-brand-indigo dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Account</span>
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="relative mt-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-display-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Creator / Studio Name
              </label>
              <div className="relative mt-1.5 flex items-center">
                <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="auth-display-name"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Studio Kabir"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-indigo focus:bg-white focus:ring-4 focus:ring-brand-indigo/15 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-brand-indigo dark:focus:bg-slate-950"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative mt-1.5 flex items-center">
              <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-indigo focus:bg-white focus:ring-4 focus:ring-brand-indigo/15 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-brand-indigo dark:focus:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative mt-1.5 flex items-center">
              <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Choose at least 6 characters' : 'Enter your password'}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-brand-indigo focus:bg-white focus:ring-4 focus:ring-brand-indigo/15 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-brand-indigo dark:focus:bg-slate-950"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <TurnstileWidget onToken={setTurnstileToken} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-indigo via-indigo-600 to-brand-purple py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-indigo/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting
              ? 'Authenticating...'
              : mode === 'login'
                ? 'Sign In to Account'
                : 'Create Free Account & Continue'}
          </button>
        </form>

        {/* Feature Checkmarks */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-200/80 pt-6 text-xs text-slate-500 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>Free Forever Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>Instant Plan Activation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
