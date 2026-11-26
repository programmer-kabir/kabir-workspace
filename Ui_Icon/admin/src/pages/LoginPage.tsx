// admin/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, setToken } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser(login, password);
      if (res.success && res.data?.token) {
        const hasAdmin = res.data.user.roles?.includes('admin') || res.data.user.role === 'admin';
        if (!hasAdmin) {
          setError('Access denied. Administrator privileges required.');
          return;
        }
        setToken(res.data.token);
        navigate('/');
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/nav-logo.png"
            alt="IconBaba"
            className="h-14 mx-auto object-contain filter drop-shadow-[0_4px_20px_rgba(168,85,247,0.4)]"
          />
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            Admin Dashboard
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Portal
            </span>
          </h1>
          <p className="text-xs text-slate-400">Sign in with your administrator credentials</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              required
              placeholder="admin@iconbaba.com"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          IconBaba Management Platform &middot; All actions audited
        </div>
      </div>
    </div>
  );
}
