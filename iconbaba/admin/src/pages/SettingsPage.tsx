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
  Layers,
  Wand2,
  RefreshCw,
  Zap,
  Check,
  Bot
} from 'lucide-react';
import { 
  getMe, 
  updateProfile, 
  getAdminSettings, 
  updateAdminSettings, 
  testGeminiApiKey 
} from '../lib/api';
import { User as UserType } from '../types/icon';

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI & Key State (Simplified: Key only)
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isKeyFromDb, setIsKeyFromDb] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState(false);
  
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    sampleTags?: string;
    message: string;
  } | null>(null);
  const [aiMsg, setAiMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, settingsRes] = await Promise.allSettled([
          getMe(),
          getAdminSettings()
        ]);

        if (meRes.status === 'fulfilled' && meRes.value.success && meRes.value.data?.user) {
          setUser(meRes.value.data.user);
          setFullName(meRes.value.data.user.full_name || '');
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.success && settingsRes.value.data) {
          const g = settingsRes.value.data.gemini;
          setGeminiApiKey(g.api_key || '');
          setIsKeyFromDb(g.is_from_db);
          setHasEnvKey(g.has_key);
        }
      } catch (err) {
        console.error('Failed to load initial settings', err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadData();
  }, []);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileMsg(null);

    try {
      const res = await updateProfile(fullName, password || undefined);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setPassword('');
        setProfileMsg({ type: 'success', text: 'Admin profile credentials updated successfully!' });
        setTimeout(() => setProfileMsg(null), 4000);
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Failed to update admin profile.' });
      }
    } catch (err: unknown) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred during update.' });
    } finally {
      setSubmittingProfile(false);
    }
  }

  async function handleSaveAiKey(e: React.FormEvent) {
    e.preventDefault();
    setSavingKey(true);
    setAiMsg(null);
    setAiTestResult(null);

    try {
      const payload: Record<string, any> = {
        gemini_api_key: geminiApiKey.trim(),
      };

      const res = await updateAdminSettings(payload);
      if (res.success) {
        setIsKeyFromDb(!!geminiApiKey.trim());
        setAiMsg({ type: 'success', text: '✨ Gemini API Key saved in MySQL database (system_settings table) successfully!' });
        setTimeout(() => setAiMsg(null), 5000);
      } else {
        setAiMsg({ type: 'error', text: res.message || 'Failed to save Gemini API key.' });
      }
    } catch (err: unknown) {
      setAiMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save settings.' });
    } finally {
      setSavingKey(false);
    }
  }

  async function handleTestAiConnection() {
    if (!geminiApiKey.trim()) {
      setAiTestResult({
        success: false,
        message: 'Please enter a Gemini API Key to test connection.',
      });
      return;
    }

    setTestingAi(true);
    setAiTestResult(null);

    try {
      const res = await testGeminiApiKey(geminiApiKey.trim());
      if (res.success && res.data) {
        setAiTestResult({
          success: true,
          latencyMs: res.data.latency_ms,
          sampleTags: res.data.sample_tags,
          message: `Connected successfully! Response time: ${res.data.latency_ms}ms`,
        });
      } else {
        setAiTestResult({
          success: false,
          message: res.message || 'Connection test failed. Please check key validity.',
        });
      }
    } catch (err: unknown) {
      setAiTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error testing Gemini API.',
      });
    } finally {
      setTestingAi(false);
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
    <div className="mx-auto space-y-8 pb-12 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="size-3.5 text-purple-400" />
            Security & System Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System & AI Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure Google Gemini AI API key stored in database and manage administrator profile.
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 COLS): Gemini AI & Admin Profile */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Gemini AI Key Card */}
          <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/80 border border-purple-500/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Bot className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Google Gemini AI Key</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Auto-Fallback Chain
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Stored in database for automatic metadata generation</p>
                </div>
              </div>

              {isKeyFromDb ? (
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check className="size-3" />
                  DB Active
                </span>
              ) : hasEnvKey ? (
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  .env Active
                </span>
              ) : (
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Key Missing
                </span>
              )}
            </div>

            {aiMsg && (
              <div
                className={`p-4 rounded-xl text-sm flex items-center gap-3 transition-all duration-200 shadow-md ${
                  aiMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {aiMsg.type === 'success' ? (
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="size-5 text-rose-400 shrink-0" />
                )}
                <span className="font-medium text-xs sm:text-sm">{aiMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAiKey} className="space-y-5 relative">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>Google Gemini API Key</span>
                    <span className="text-[10px] text-purple-400 font-mono font-normal">(Saved in MySQL Database)</span>
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                  >
                    Get free key on Google AI Studio ↗
                  </a>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="size-4 text-purple-400" />
                  </div>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="Paste your Gemini API key (AIzaSyB...)"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full pl-10 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none rounded-lg"
                      title={showGeminiKey ? 'Hide key' : 'Show key'}
                    >
                      {showGeminiKey ? <EyeOff className="size-4 text-purple-400" /> : <Eye className="size-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1.5">
                  Just enter your API key here and click save. The backend will automatically try models in order (Gemini 3.1 Flash, 3.7 Flash, 2.5 Flash, etc.) for high speed and reliability.
                </span>
              </div>

              {/* Live Connection Test Output */}
              {aiTestResult && (
                <div
                  className={`p-4 rounded-xl text-xs space-y-1.5 animate-in fade-in-50 border ${
                    aiTestResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {aiTestResult.success ? (
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 text-rose-400 shrink-0" />
                    )}
                    <span>{aiTestResult.message}</span>
                  </div>
                  {aiTestResult.sampleTags && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-emerald-500/20">
                      <span className="font-semibold text-emerald-400">Sample Generated Tags: </span>
                      <span className="font-mono">{aiTestResult.sampleTags}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={testingAi || !geminiApiKey.trim()}
                  onClick={handleTestAiConnection}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {testingAi ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin text-purple-400" />
                      <span>Testing Gemini API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.5 text-purple-400" />
                      <span>Test Live Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={savingKey || loadingSettings}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-purple-900/30 transition-all flex items-center gap-2"
                >
                  {savingKey ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4 text-purple-200" />
                      <span>Save API Key in Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Administrator Credentials Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <User className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Administrator Profile</h2>
                  <p className="text-xs text-slate-400">Update super admin credentials and account password</p>
                </div>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-4 rounded-xl text-sm flex items-center gap-3 transition-all duration-200 shadow-lg ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="size-5 text-rose-400 shrink-0" />
                )}
                <span className="font-medium text-xs sm:text-sm">{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Username (Read-Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[10px] text-slate-500">Immutable</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="size-4" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs sm:text-sm text-slate-400 font-mono cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Email Address (Read-Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-500">Primary ID</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs sm:text-sm text-slate-400 font-mono cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="size-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Master Administrator"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>New Password</span>
                  <span className="text-[10px] text-slate-500">(Leave blank to keep unchanged)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="size-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4 text-purple-400" /> : <Eye className="size-4 text-slate-400" />}
                  </button>
                </div>

                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className="font-semibold text-slate-200">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  {submittingProfile ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 COLS): Diagnostics & Fallback Chain */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Environment Diagnostics Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">System Diagnostics</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Database className="size-3.5 text-purple-400" />
                  <span>Dynamic Settings DB</span>
                </div>
                <span className="font-semibold text-emerald-400">system_settings</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>AI Fallback Engine</span>
                </div>
                <span className="font-semibold text-amber-300 text-[11px]">13+ Models Auto-Cascade</span>
              </div>

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
                  <span>Backend REST API</span>
                </div>
                <span className="font-semibold text-slate-200">PHP 8.2 + PDO / Apache</span>
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

          {/* Auto-Cascade Models Chain Display */}
          <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-slate-900/80 border border-purple-500/20 rounded-2xl p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
              <Sparkles className="size-4 text-purple-400" />
              <span>Automatic Gemini Models Cascade</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When generating metadata or SEO tags, the engine automatically checks this chain in sequence until one succeeds:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'gemini-3.1-flash-lite',
                'gemini-3.1-pro-preview',
                'gemini-3.1-flash-image',
                'gemini-3.1-flash-lite-preview',
                'gemini-3.5-flash',
                'gemini-3.7-flash',
                'gemini-3.8-flash',
                'gemini-2.5-flash',
                'gemini-2.5-pro',
                'gemini-flash-latest',
                'gemini-pro-latest',
                'gemini-2.5-flash-lite',
                'gemini-3-flash-preview',
              ].map((m) => (
                <span key={m} className="px-2 py-0.5 bg-slate-950 border border-purple-500/30 text-purple-300 font-mono text-[10px] rounded-md">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
