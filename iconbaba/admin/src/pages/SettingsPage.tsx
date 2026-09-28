// admin/src/pages/SettingsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Layers
} from 'lucide-react';
import { getMe, updateProfile } from '../lib/api';
import { User as UserType } from '../types/icon';

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          setFullName(res.data.user.full_name || '');
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
      }
    }
    loadUser();
  }, []);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await updateProfile(fullName, password || undefined);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setPassword('');
        setMsg({ type: 'success', text: 'Admin profile & security credentials updated successfully!' });
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg({ type: 'error', text: res.message || 'Failed to update admin profile.' });
      }
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'An unexpected error occurred during update.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Too Short', color: 'bg-rose-500', width: '25%' };
    if (password.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (password.length < 12) return { label: 'Strong', color: 'bg-blue-500', width: '75%' };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="size-3.5 text-purple-400" />
            Security & Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your master administrator profile, update passwords, and inspect live environment health.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-inner">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-purple-900/30">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{user.full_name || user.username}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active" />
              </div>
              <div className="text-xs text-purple-400 font-medium">Super Administrator</div>
            </div>
          </div>
        )}
      </div>

      {/* Global Alerts */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center gap-3 transition-all duration-200 shadow-lg ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-emerald-950/40'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-rose-950/40'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="size-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{msg.text}</span>
        </div>
      )}

      {/* Main Grid: 2-Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile & Credentials Form (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Administrator Credentials</h2>
                <p className="text-xs text-slate-400">Update display name and secure account password</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Role
            </span>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-5">
            {/* Username (Read-Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[11px] text-slate-500 font-normal">Immutable System ID</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="size-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={user?.username || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 font-mono cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Email Address (Read-Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[11px] text-slate-500 font-normal">Primary Recovery Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="size-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 font-mono cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="size-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. IconBaba Administrator"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* New Password with Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[11px] text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="size-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4 text-purple-400" />
                  ) : (
                    <Eye className="size-4 text-slate-400 hover:text-slate-200" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {strength && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className="font-semibold text-slate-200">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Credentials...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-purple-200" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Platform Status & Security Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Environment Health Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">System Diagnostics</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Cpu className="size-3.5 text-slate-500" />
                  <span>Frontend Architecture</span>
                </div>
                <span className="font-semibold text-indigo-300">Vite + React 18 SPA</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Server className="size-3.5 text-slate-500" />
                  <span>API Backend Engine</span>
                </div>
                <span className="font-semibold text-slate-200">PHP 8.2 + PDO / Apache</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Database className="size-3.5 text-slate-500" />
                  <span>Database Storage</span>
                </div>
                <span className="font-semibold text-slate-200">MySQL InnoDB (utf8mb4)</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>AI Intelligence</span>
                </div>
                <span className="font-semibold text-amber-300">Google Gemini 2.5 Flash</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers className="size-3.5 text-purple-400" />
                  <span>DRM Vector Security</span>
                </div>
                <span className="font-semibold text-emerald-400">Layer 2 Obfuscation</span>
              </div>
            </div>
          </div>

          {/* Best Practices & Security Tip Card */}
          <div className="bg-gradient-to-br from-purple-950/40 to-slate-900/80 border border-purple-500/20 rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
              <ShieldCheck className="size-4 text-purple-400" />
              <span>Administrator Security Recommendations</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
              <li>Use a minimum of 10+ characters with mixed casing & symbols.</li>
              <li>Admin session tokens expire automatically after 30 days of inactivity.</li>
              <li>Keep backend <code className="text-purple-300 font-mono">.env</code> secrets out of public version control.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
