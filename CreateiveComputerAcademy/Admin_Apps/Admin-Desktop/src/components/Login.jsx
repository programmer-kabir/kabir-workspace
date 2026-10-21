import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiSettings, FiServer } from 'react-icons/fi';
import { toast } from 'sonner';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Server URL Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('cca_admin_api_base') || 'http://localhost/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('ইমেইল ও পাসওয়ার্ড দেওয়া আবশ্যক');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('অ্যাডমিন কনসোলে সফলভাবে লগইন হয়েছে!');
    } catch (err) {
      toast.error(err.message || 'লগইন ব্যর্থ হয়েছে। ক্রেডেনশিয়াল পরীক্ষা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServer = () => {
    let finalUrl = serverUrl.trim();
    if (!finalUrl.endsWith('/')) finalUrl += '/';
    localStorage.setItem('cca_admin_api_base', finalUrl);
    setServerUrl(finalUrl);
    setShowSettings(false);
    toast.success('সার্ভার URL সফলভাবে সংরক্ষিত হয়েছে!');
    window.location.reload();
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden bg-slate-950">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Settings Button */}
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        title="Server Connection Settings"
        className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
      >
        <FiSettings size={18} />
      </button>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-1">
            <img src="./logo.png" alt="CCA Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            CCA <span className="text-blue-400">Admin Desktop</span>
          </h1>
          <p className="text-xs text-slate-400">
            Executive Control & Surveillance Workstation
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Admin Email / Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
              <FiArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Server Config Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FiServer size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Server Endpoint URL</h3>
                <p className="text-xs text-slate-400">Configure connection to backend API</p>
              </div>
            </div>

            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost/"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveServer}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold transition cursor-pointer"
              >
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
