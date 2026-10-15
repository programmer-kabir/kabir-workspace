import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiSettings, FiCheck, FiX, FiServer } from 'react-icons/fi';
import { soundFx } from '../utils/soundFx';
import { getApiBase } from '../utils/api';

const Login = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your identifier and password.');
      soundFx.playError();
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      soundFx.playPunchIn();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      soundFx.playError();
    } finally {
      setLoading(false);
    }
  };

  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('cca_api_base_url') || 'https://api.creativecomputeracademy.com/');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveServer = (url) => {
    let finalUrl = (url || serverUrl).trim();
    if (!finalUrl.endsWith('/')) finalUrl += '/';
    localStorage.setItem('cca_api_base_url', finalUrl);
    setServerUrl(finalUrl);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
      window.location.reload();
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 relative">
      {/* Settings Button */}
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        title="Server Settings"
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
      >
        <FiSettings size={18} />
      </button>

      {/* Decorative gradient glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center mb-6 relative">
        <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-3">
          <img src="./logo.png" alt="CCA Logo" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          CCA <span className="text-sky-400">Staff Portal</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Desktop Attendance Station
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <FiShield className="shrink-0 text-rose-400" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email / Username / Phone
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiUser size={15} />
            </span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. employee ID or email"
              autoFocus
              className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiLock size={15} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Punch In</span>
              <FiArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-[11px] text-slate-500">
        Creative Computer Academy &bull; Secure Desktop Client
      </div>

      {/* Server Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <FiServer size={18} />
                <span>Backend Server Connection</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select or type the API server endpoint this app should connect to:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSaveServer('http://10.141.179.45/server/')}
                className="w-full text-left px-3 py-2 rounded-xl text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition"
              >
                <div>
                  <div className="font-semibold text-sky-400">Local Wi-Fi XAMPP Server</div>
                  <div className="text-[10px] text-slate-400">http://10.141.179.45/server/</div>
                </div>
                {serverUrl.includes('10.141.179.45') && <FiCheck className="text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveServer('http://localhost/server/')}
                className="w-full text-left px-3 py-2 rounded-xl text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition"
              >
                <div>
                  <div className="font-semibold text-sky-400">Localhost (This PC only)</div>
                  <div className="text-[10px] text-slate-400">http://localhost/server/</div>
                </div>
                {serverUrl.includes('localhost') && <FiCheck className="text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveServer('https://api.creativecomputeracademy.com/')}
                className="w-full text-left px-3 py-2 rounded-xl text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition"
              >
                <div>
                  <div className="font-semibold text-sky-400">Live Production Server</div>
                  <div className="text-[10px] text-slate-400">https://api.creativecomputeracademy.com/</div>
                </div>
                {serverUrl.includes('api.creativecomputeracademy.com') && <FiCheck className="text-emerald-400" />}
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Custom Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://192.168.x.x/server/"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveServer(serverUrl)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="text-center text-xs text-emerald-400 font-semibold">
                Saved! Reloading...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
