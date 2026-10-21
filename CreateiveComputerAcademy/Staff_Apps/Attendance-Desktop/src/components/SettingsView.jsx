import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiMonitor, FiMoon, FiSun, FiGlobe, FiVolume2, FiVolumeX,
  FiServer, FiRefreshCw, FiCheck, FiLayout, FiSidebar, FiTerminal,
  FiShield, FiDownloadCloud
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import { soundFx } from '../utils/soundFx';
import updateService from '../services/UpdateService';

const SettingsView = ({ onNavigate }) => {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cca_theme') || localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  // Language state
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('cca_lang') || 'en';
  });


  // Update check state
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [appVersion, setAppVersion] = useState('2.0.0');

  useEffect(() => {
    updateService.getVersion().then(v => {
      if (v) setAppVersion(v);
    }).catch(() => {});
  }, []);

  // Toggle Theme
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cca_theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cca_theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    soundFx.play('pop');
    toast.success(next ? 'Dark Mode Activated' : 'Light Mode Activated');
  };

  // Toggle Language
  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('cca_lang', newLang);
    soundFx.play('pop');
    toast.success(newLang === 'bn' ? 'ভাষা বাংলায় পরিবর্তিত হয়েছে' : 'Language set to English');
  };





  // Check for updates
  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await updateService.checkForUpdates();
      if (res && res.has_update) {
        soundFx.playSuccess();
        toast.info(`New version v${res.latest_version} available!`);
      } else {
        toast.success(`Your CCA Workstation is up to date (v${appVersion})!`);
      }
    } catch (e) {
      toast.error('Unable to verify update server.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className=" mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <FiMonitor size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Workstation Settings
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                v{appVersion} Desktop
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Customize appearance, window behavior, audio preferences, and desktop diagnostics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckUpdates}
          disabled={checkingUpdate}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <FiRefreshCw size={14} className={checkingUpdate ? 'animate-spin text-blue-600' : ''} />
          <span>Check for Updates</span>
        </button>
      </div>

      {/* ──────── 1. Appearance & Theme ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <HiSparkles className="text-amber-500" /> Appearance & Theme
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Dark Mode / Light Mode
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently active: <strong className="text-blue-600 dark:text-blue-400">{isDark ? 'Dark Theme' : 'Light Theme'}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex h-8 w-16 items-center rounded-full p-1 transition-colors cursor-pointer focus:outline-none shadow-inner ${
              isDark ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform flex items-center justify-center text-xs ${
                isDark ? 'translate-x-8 text-slate-900' : 'translate-x-0 text-amber-500'
              }`}
            >
              {isDark ? <FiMoon size={13} /> : <FiSun size={13} />}
            </span>
          </button>
        </div>
      </div>

      {/* ──────── 4. Language / ভাষা ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <FiGlobe className="text-blue-500" /> Language / ভাষা
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 cursor-pointer ${
              lang === 'en'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
              lang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              EN
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">English</p>
              <p className="text-[11px] text-slate-400">Default workstation language</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('bn')}
            className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 cursor-pointer ${
              lang === 'bn'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
              lang === 'bn' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              বাং
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">বাংলা (Bengali)</p>
              <p className="text-[11px] text-slate-400">অফিশিয়াল বাংলা ভাষা ইন্টারফেস</p>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
