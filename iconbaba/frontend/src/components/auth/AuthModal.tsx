// frontend/components/auth/AuthModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from '@/lib/api';
import { setToken } from '@/lib/api';

// ─── Password Strength Meter ─────────────────────────────────────────────────
function calculatePasswordStrength(pass: string) {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak (min 8 chars with letter & number)', color: 'bg-rose-500' };
  if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
  return { score: 3, label: 'Strong password', color: 'bg-emerald-500' };
}

// ─── OTP Input — 6 boxes ─────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr   = value.split('');
    arr[i]      = digit;
    const next  = arr.join('').slice(0, 6);
    onChange(next);
    if (digit && i < 5) {
      setTimeout(() => inputs.current[i + 1]?.focus(), 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputs.current[focusIdx]?.focus(), 0);
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:bg-purple-500/10 transition-all caret-transparent"
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');

  return (
    <span className={remaining <= 30 ? 'text-rose-400' : 'text-slate-400'}>
      {m}:{s}
    </span>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
type Step =
  | 'login'
  | 'register_info'   // Step 1: fill name/username/email/password
  | 'register_otp'    // Step 2: verify email OTP → account created
  | 'forgot_email'    // Step A: enter email for forgot password
  | 'forgot_otp'      // Step B: verify OTP
  | 'forgot_newpass'; // Step C: set new password

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, login, refreshUser, triggerWelcome } = useAuth();

  // Common
  const [step, setStep]       = useState<Step>('login');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginId, setLoginId]     = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register fields
  const [fullName, setFullName]   = useState('');
  const [username, setUsername]   = useState('');
  const [regEmail, setRegEmail]   = useState('');
  const [regPass, setRegPass]     = useState('');

  // OTP
  const [otp, setOtp]           = useState('');
  const [otpTimer, setOtpTimer] = useState(600);

  // Forgot password
  const [fpEmail, setFpEmail]         = useState('');
  const [fpResetToken, setFpResetToken] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Show/hide passwords
  const [showLoginPass, setShowLoginPass]   = useState(false);
  const [showRegPass, setShowRegPass]       = useState(false);
  const [showNewPass, setShowNewPass]       = useState(false);
  const [showConfPass, setShowConfPass]     = useState(false);

  const strength = calculatePasswordStrength(step === 'register_otp' ? regPass : newPass);

  // Sync step with authMode prop
  useEffect(() => {
    if (authMode === 'login') setStep('login');
    if (authMode === 'register') setStep('register_info');
    setError('');
    setSuccess('');
    setOtp('');
  }, [authMode]);

  if (!showAuthModal) return null;

  const reset = () => {
    setError(''); setSuccess(''); setOtp('');
    setFullName(''); setUsername(''); setRegEmail(''); setRegPass('');
    setLoginId(''); setLoginPass('');
    setFpEmail(''); setFpResetToken(''); setNewPass(''); setConfirmPass('');
  };

  // ── HANDLERS ───────────────────────────────────────────────────────────────

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(loginId, loginPass);
      if (!res.success) setError(res.message || 'Invalid credentials');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Register Step 1 → send OTP
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPass.length < 8 || !/[a-zA-Z]/.test(regPass) || !/\d/.test(regPass)) {
      setError('Password must be at least 8 characters with letters and numbers.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendRegistrationOtp(regEmail);
      if (res.success) {
        setOtp('');
        setOtpTimer(600);
        setStep('register_otp');
        setSuccess(`Verification code sent to ${regEmail}`);
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Register Step 2 → verify OTP + create account
  const handleVerifyRegisterOtp = async () => {
    if (otp.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtpAndRegister({
        email: regEmail, otp, username, password: regPass, full_name: fullName,
      });
      if (res.success && res.data?.token && res.data?.user) {
        setToken(res.data.token);
        await refreshUser();
        triggerWelcome(res.data.user, true);
        setShowAuthModal(false);
        reset();
      } else {
        setError(res.message || 'Verification failed. Please check the code.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async (purpose: 'registration' | 'forgot_password') => {
    setError('');
    setSuccess('');
    setOtp('');
    setLoading(true);
    try {
      const email = purpose === 'registration' ? regEmail : fpEmail;
      const fn    = purpose === 'registration' ? sendRegistrationOtp : sendForgotPasswordOtp;
      const res   = await fn(email);
      if (res.success) {
        setOtpTimer(600);
        setSuccess('New code sent! Check your inbox.');
      } else {
        setError(res.message || 'Failed to resend. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Step A → send OTP
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await sendForgotPasswordOtp(fpEmail);
      if (res.success) {
        setOtp('');
        setOtpTimer(600);
        setStep('forgot_otp');
        setSuccess(`If that email is registered, a code has been sent to ${fpEmail}`);
      } else {
        setError(res.message || 'Failed to send OTP.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Step B → verify OTP
  const handleVerifyForgotOtp = async () => {
    if (otp.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await verifyForgotPasswordOtp(fpEmail, otp);
      if (res.success && res.data?.reset_token) {
        setFpResetToken(res.data.reset_token);
        setStep('forgot_newpass');
        setSuccess('');
        setError('');
      } else {
        setError(res.message || 'Incorrect code. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Step C → set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) {
      setError('Passwords do not match.'); return;
    }
    if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/\d/.test(newPass)) {
      setError('Password must be at least 8 characters with letters and numbers.'); return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(fpResetToken, newPass);
      if (res.success && res.data?.token && res.data?.user) {
        setToken(res.data.token);
        await refreshUser();
        triggerWelcome(res.data.user, false);
        setShowAuthModal(false);
        reset();
      } else {
        setError(res.message || 'Password reset failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── SHARED UI ATOMS ───────────────────────────────────────────────────────

  const modalTitle: Record<Step, string> = {
    login:          'Sign In to IconBaba',
    register_info:  'Create an Account',
    register_otp:   'Verify Your Email',
    forgot_email:   'Forgot Password',
    forgot_otp:     'Check Your Email',
    forgot_newpass: 'Set New Password',
  };

  const modalSub: Record<Step, string> = {
    login:          'Access your favorites, collections & pro features',
    register_info:  'Join IconBaba — 5,000+ vector icons await you',
    register_otp:   `Enter the 6-digit code sent to ${regEmail}`,
    forgot_email:   "Enter your registered email to get a reset code",
    forgot_otp:     `Enter the 6-digit code sent to ${fpEmail}`,
    forgot_newpass: 'Choose a strong new password for your account',
  };

  const showBack = step !== 'login' && step !== 'register_info';

  const goBack = () => {
    setError(''); setSuccess(''); setOtp('');
    if (step === 'register_otp') setStep('register_info');
    else if (step === 'forgot_otp') setStep('forgot_email');
    else if (step === 'forgot_newpass') setStep('forgot_otp');
    else setStep('login');
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#12131e] border border-white/10 shadow-2xl p-6 sm:p-8">

        {/* Close */}
        <button
          onClick={() => { setShowAuthModal(false); reset(); }}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Back arrow */}
        {showBack && (
          <button
            onClick={goBack}
            className="absolute left-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <img src="/nav-logo.png" alt="IconBaba" className="h-10 mx-auto object-contain mb-3 filter drop-shadow-[0_2px_12px_rgba(168,85,247,0.35)]" />
          <h2 className="text-xl font-bold text-white tracking-tight">{modalTitle[step]}</h2>
          <p className="text-xs text-slate-400 mt-1">{modalSub[step]}</p>
        </div>

        {/* Tabs — only on login/register_info */}
        {(step === 'login' || step === 'register_info') && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setStep('login'); setError(''); setSuccess(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${step === 'login' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setStep('register_info'); setError(''); setSuccess(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${step === 'register_info' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-2">
            <span className="shrink-0">⚠️</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-start gap-2">
            <span className="shrink-0">✅</span><span>{success}</span>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="text" required value={loginId} onChange={e => setLoginId(e.target.value)}
                  placeholder="admin@iconbaba.com or demo"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type={showLoginPass ? 'text' : 'password'} required value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
                <button type="button" onClick={() => setShowLoginPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showLoginPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Forgot password link */}
              <div className="flex justify-end mt-1.5">
                <button type="button" onClick={() => { setStep('forgot_email'); setError(''); setSuccess(''); }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 mt-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── REGISTER STEP 1: Info ── */}
        {step === 'register_info' && (
          <form onSubmit={handleSendRegisterOtp} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="johndoe"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type={showRegPass ? 'text' : 'password'} required value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
                <button type="button" onClick={() => setShowRegPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showRegPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {regPass && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{strength.label}</span>
                    {strength.score >= 3 && <span className="text-emerald-400 flex items-center gap-0.5"><ShieldCheck className="size-3" /> Secure</span>}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 mt-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <><Mail className="size-3.5" /> Send Verification Code</>
              )}
            </button>
          </form>
        )}

        {/* ── REGISTER STEP 2: OTP ── */}
        {step === 'register_otp' && (
          <div className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} />
            <div className="text-center text-xs text-slate-400">
              Code expires in{' '}
              <Countdown seconds={otpTimer} onExpire={() => setError('Code expired. Please request a new one.')} />
            </div>
            <button onClick={handleVerifyRegisterOtp} disabled={loading || otp.length !== 6}
              className="w-full h-11 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <><ShieldCheck className="size-3.5" /> Verify & Create Account</>
              )}
            </button>
            <button type="button" onClick={() => handleResendOtp('registration')} disabled={loading}
              className="w-full text-xs text-slate-400 hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw className="size-3" /> Resend code
            </button>
          </div>
        )}

        {/* ── FORGOT STEP A: Email ── */}
        {step === 'forgot_email' && (
          <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="email" required value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 mt-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <><Mail className="size-3.5" /> Send Reset Code</>
              )}
            </button>
            <button type="button" onClick={() => setStep('login')}
              className="w-full text-xs text-slate-400 hover:text-purple-400 transition-colors text-center">
              Back to Sign In
            </button>
          </form>
        )}

        {/* ── FORGOT STEP B: OTP ── */}
        {step === 'forgot_otp' && (
          <div className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} />
            <div className="text-center text-xs text-slate-400">
              Code expires in{' '}
              <Countdown seconds={otpTimer} onExpire={() => setError('Code expired. Please request a new one.')} />
            </div>
            <button onClick={handleVerifyForgotOtp} disabled={loading || otp.length !== 6}
              className="w-full h-11 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <><ShieldCheck className="size-3.5" /> Verify Code</>
              )}
            </button>
            <button type="button" onClick={() => handleResendOtp('forgot_password')} disabled={loading}
              className="w-full text-xs text-slate-400 hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw className="size-3" /> Resend code
            </button>
          </div>
        )}

        {/* ── FORGOT STEP C: New Password ── */}
        {step === 'forgot_newpass' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type={showNewPass ? 'text' : 'password'} required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
                <button type="button" onClick={() => setShowNewPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {newPass && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                  <span className="text-[10px] text-slate-400">{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type={showConfPass ? 'text' : 'password'} required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
                <button type="button" onClick={() => setShowConfPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showConfPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPass && newPass !== confirmPass && (
                <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 mt-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <><ShieldCheck className="size-3.5" /> Reset Password & Sign In</>
              )}
            </button>
          </form>
        )}

        {/* Admin hint */}
        {(step === 'login' || step === 'register_info') && (
          <div className="mt-5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 text-center">
            <span className="font-semibold text-purple-300">Admin Account:</span>{' '}
            <span className="font-mono text-slate-300">admin@iconbaba.com</span> /{' '}
            <span className="font-mono text-slate-300">admin123</span>
          </div>
        )}
      </div>
    </div>
  );
}
