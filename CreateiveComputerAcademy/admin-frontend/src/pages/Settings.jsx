import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { 
  FiSettings, 
  FiCpu, 
  FiEdit3, 
  FiMoon, 
  FiSun, 
  FiMonitor, 
  FiGlobe, 
  FiBell, 
  FiVolume2, 
  FiCheck, 
  FiSave, 
  FiRefreshCw, 
  FiLayers,
  FiZap,
  FiShield,
  FiMapPin
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Settings = () => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    task_creation_mode: 'agentic', // 'agentic' | 'manual'
    theme_mode: theme || 'system', // 'light' | 'dark' | 'system'
    language: 'bn',                // 'bn' | 'en'
    notification_sound: 1,         // 1 | 0
    email_notifications: 1,        // 1 | 0
    ai_model: 'gemini-1.5-pro'     // 'gemini-1.5-pro' | 'gpt-4o' | 'claude-3-5-sonnet'
  });

  // System & Reviewer Credit & Attendance Security Settings State
  const [systemSettings, setSystemSettings] = useState({
    reviewer_approval_credit: 1,
    reviewer_rejection_credit: 1,
    reviewer_delivery_bonus: 3,
    staff_rejection_penalty: 1,
    max_review_rewards_per_task: 3,
    office_latitude: '23.81033100',
    office_longitude: '90.41252100',
    office_geofence_radius_meters: 50,
    attendance_security_mode: 'audit_flag',
    office_allowed_ips: '127.0.0.1,::1,182.48.76.182'
  });
  const [savingSystem, setSavingSystem] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser does not support geolocation.');
      return;
    }
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSystemSettings(prev => ({
          ...prev,
          office_latitude: pos.coords.latitude.toFixed(8),
          office_longitude: pos.coords.longitude.toFixed(8)
        }));
        setGettingLoc(false);
        toast.success(`Location set: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        setGettingLoc(false);
        toast.error('Could not get GPS location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fetch Settings on Mount
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [userRes, sysRes] = await Promise.all([
          axios.post(`${API_URL}api/settings/get_user_settings.php`, { user_id: currentUser.id }),
          axios.get(`${API_URL}api/settings/get_system_settings.php`)
        ]);

        if (userRes.data?.status === 'success' && userRes.data.settings) {
          setSettings(prev => ({
            ...prev,
            ...userRes.data.settings,
            notification_sound: Number(userRes.data.settings.notification_sound ?? 1),
            email_notifications: Number(userRes.data.settings.email_notifications ?? 1),
          }));
          if (userRes.data.settings.theme_mode) {
            setTheme(userRes.data.settings.theme_mode);
          }
        }

        if (sysRes.data?.status === 'success' && sysRes.data.settings) {
          setSystemSettings(prev => ({
            ...prev,
            ...sysRes.data.settings
          }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast.error('সেটিংস লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [currentUser, API_URL]);

  // Handle Save System & Credit Settings
  const handleSaveSystemSettings = async () => {
    setSavingSystem(true);
    try {
      const res = await axios.post(`${API_URL}api/settings/update_system_settings.php`, {
        settings: systemSettings
      });
      if (res.data?.status === 'success') {
        toast.success(
          settings.language === 'bn'
            ? 'রিভিউয়ার ও ক্রেডিট পলিসি সফলভাবে সংরক্ষিত হয়েছে!'
            : 'Reviewer & Credit settings updated successfully!'
        );
      } else {
        toast.error(res.data?.message || 'Failed to update system settings');
      }
    } catch (e) {
      toast.error('সিস্টেম সেটিংস সংরক্ষণে ত্রুটি ঘটেছে');
    } finally {
      setSavingSystem(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (customSettings = null) => {
    const payload = customSettings || settings;
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}api/settings/update_user_settings.php`, {
        user_id: currentUser.id,
        ...payload
      });

      if (res.data.status === 'success') {
        toast.success(
          settings.language === 'bn' 
            ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' 
            : 'Settings saved successfully!'
        );
      } else {
        toast.error(res.data.message || 'Error saving settings');
      }
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('সেটিংস সংরক্ষণে ত্রুটি ঘটেছে');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle & Auto-Save
  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (key === 'theme_mode') {
      setTheme(value);
    }
    handleSaveSettings(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">সেটিংস কনসোল লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiSettings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {settings.language === 'bn' ? 'সিস্টেম ও ওয়ার্কস্পেস সেটিংস' : 'System & Workspace Settings'}
              </h1>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                {settings.language === 'bn' 
                  ? 'টাস্ক ক্রিয়েশন মোড, মুড, ভাষা এবং ওয়ার্কফ্লো কনফিগার করুন' 
                  : 'Configure task creation workflow, mood, language and system preferences'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
          <span>{settings.language === 'bn' ? 'সেভ করুন' : 'Save Changes'}</span>
        </button>
      </div>

      {/* 1. TASK CREATION WORKFLOW SECTION (AGENTIC VS MANUAL) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FiZap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {settings.language === 'bn' ? 'টাস্ক পাঠানোর মোড (Task Creation Workflow)' : 'Task Creation Workflow Mode'}
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              {settings.language === 'bn' 
                ? 'নতুন টাস্ক অ্যাসাইন করার সময় স্বয়ংক্রিয়ভাবে কোন মোডটি চালু থাকবে' 
                : 'Select the default mode when creating and assigning tasks'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AGENTIC MODE OPTION */}
          <div
            onClick={() => updateSetting('task_creation_mode', 'agentic')}
            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
              settings.task_creation_mode === 'agentic'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-lg shadow-indigo-600/10'
                : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            {settings.task_creation_mode === 'agentic' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <FiCheck size={14} />
              </div>
            )}

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-600/30 mb-4">
                <FiCpu size={24} />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                  {settings.language === 'bn' ? 'Agentic Mode (AI Blueprint Architect)' : 'Agentic Mode (AI Blueprint)'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Recommended
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {settings.language === 'bn'
                  ? 'ডিজাইনের ছবি (Flyer/Banner) আপলোড করলে AI স্বয়ংক্রিয়ভাবে Document Specs, Palette, Typography ও PSD Layer Tree জেনারেট করবে।'
                  : 'Upload design preview images. The AI agent automatically extracts JSON specs, color palettes, fonts, and structured PSD layer tree.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              <FiLayers size={14} />
              <span>{settings.language === 'bn' ? 'JSON Spec + Assets + Layer Tree সাপোর্ট' : 'JSON Spec + Assets + PSD Layer Tree'}</span>
            </div>
          </div>

          {/* MANUAL MODE OPTION */}
          <div
            onClick={() => updateSetting('task_creation_mode', 'manual')}
            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
              settings.task_creation_mode === 'manual'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-lg shadow-blue-600/10'
                : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            {settings.task_creation_mode === 'manual' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                <FiCheck size={14} />
              </div>
            )}

            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xl font-bold shadow-md mb-4">
                <FiEdit3 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1.5">
                {settings.language === 'bn' ? 'Manual Mode (সাধারণ ফর্ম)' : 'Manual Mode (Classic Form)'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {settings.language === 'bn'
                  ? 'সাধারণ ডেসক্রিপশন এডিটর ও চেকলিস্টের মাধ্যমে ম্যানুয়ালি টাস্কের বিবরণ টাইপ করে অ্যাসাইন করা।'
                  : 'Traditional task workflow with rich text description editor, manual checklist items, and direct links.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <FiEdit3 size={14} />
              <span>{settings.language === 'bn' ? 'স্ট্যান্ডার্ড রিচ টেক্সট ও চেকলিস্ট' : 'Standard Rich Text & Checklists'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THEME / MOOD SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FiSun size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {settings.language === 'bn' ? 'থিম ও ইউজার ইন্টারফেস (Mood / Theme)' : 'Theme & Interface Mood'}
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              {settings.language === 'bn' ? 'আপনার পছন্দের ভিজ্যুয়াল থিম সিলেক্ট করুন' : 'Select your preferred visual appearance'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light */}
          <div
            onClick={() => updateSetting('theme_mode', 'light')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
              settings.theme_mode === 'light'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FiSun size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Light Mode</p>
              <p className="text-[11px] text-slate-400 font-semibold">{settings.language === 'bn' ? 'উজ্জ্বল সাদা ইন্টারফেস' : 'Clean & bright'}</p>
            </div>
          </div>

          {/* Dark */}
          <div
            onClick={() => updateSetting('theme_mode', 'dark')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
              settings.theme_mode === 'dark'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center">
              <FiMoon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Dark Mode</p>
              <p className="text-[11px] text-slate-400 font-semibold">{settings.language === 'bn' ? 'চোখের আরামদায়ক ডার্ক' : 'Sleek dark theme'}</p>
            </div>
          </div>

          {/* System */}
          <div
            onClick={() => updateSetting('theme_mode', 'system')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
              settings.theme_mode === 'system'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FiMonitor size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">System Auto</p>
              <p className="text-[11px] text-slate-400 font-semibold">{settings.language === 'bn' ? 'ডিভাইসের সাথে অটো' : 'Match OS settings'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LANGUAGE PREFERENCE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FiGlobe size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {settings.language === 'bn' ? 'ভাষা নির্বাচন (Language Preference)' : 'Language Preference'}
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              {settings.language === 'bn' ? 'প্যানেলের প্রদর্শনী ভাষা নির্ধারণ করুন' : 'Choose your preferred language for the console'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bangla */}
          <div
            onClick={() => updateSetting('language', 'bn')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              settings.language === 'bn'
                ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇧🇩</span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">বাংলা (Bengali)</p>
                <p className="text-[11px] text-slate-400 font-semibold">ডিফল্ট সিস্টেম ভাষা</p>
              </div>
            </div>
            {settings.language === 'bn' && <FiCheck className="text-emerald-600 font-bold" size={18} />}
          </div>

          {/* English */}
          <div
            onClick={() => updateSetting('language', 'en')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              settings.language === 'en'
                ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">English (US)</p>
                <p className="text-[11px] text-slate-400 font-semibold">Standard English</p>
              </div>
            </div>
            {settings.language === 'en' && <FiCheck className="text-emerald-600 font-bold" size={18} />}
          </div>
        </div>
      </div>

      {/* 4. NOTIFICATIONS & ALERTS */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FiBell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {settings.language === 'bn' ? 'বিজ্ঞপ্তি ও সাউন্ড (Notifications)' : 'Notifications & Alerts'}
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              {settings.language === 'bn' ? 'টাস্ক সাবমিশন ও মেসেজের নোটিফিকেশন কন্ট্রোল' : 'Manage audio and delivery alert preferences'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FiVolume2 size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {settings.language === 'bn' ? 'সাউন্ড অ্যালার্ট (Notification Sound)' : 'Notification Sound'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {settings.language === 'bn' ? 'নতুন বার্তা বা নোটিফিকেশন আসলে শব্দ হবে' : 'Play audio tone for incoming updates'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings.notification_sound)}
                onChange={(e) => updateSetting('notification_sound', e.target.checked ? 1 : 0)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FiShield size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {settings.language === 'bn' ? 'ইমেইল সামারি অ্যালার্ট (Email Notifications)' : 'Email Summary Notifications'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {settings.language === 'bn' ? 'দৈনিক কাজের রিপোর্ট ইমেইলে পাঠানো হবে' : 'Receive automated email digests'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings.email_notifications)}
                onChange={(e) => updateSetting('email_notifications', e.target.checked ? 1 : 0)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Reviewer Incentive & Credit Rewards Policy (Dynamic DB Settings) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HiSparkles size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {settings.language === 'bn' ? 'রিভিউয়ার ইনসেন্টিভ ও ক্রেডিট পলিসি' : 'Reviewer Incentives & Credit Policy'}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {settings.language === 'bn' ? 'টাস্ক রিভিউ, রিজেকশন কিউএ এবং ফাইনাল স্টক ডেলিভারির ক্রেডিট রেট নিয়ন্ত্রণ করুন' : 'Control QA credits for approvals, rejections, and final stock delivery bonuses'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={savingSystem}
            onClick={handleSaveSystemSettings}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingSystem ? <FiRefreshCw className="animate-spin" size={14} /> : <FiSave size={14} />}
            <span>{settings.language === 'bn' ? 'পলিসি সংরক্ষণ করুন' : 'Save Credit Policy'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Approval Credit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'টাস্ক অ্যাপ্রুভ ক্রেডিট' : 'Task Approval Credit'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                + Points
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'একটি টাস্ক অনুমোদন করলে রিভিউয়ার কত পয়েন্ট পাবে' : 'Credits awarded to reviewer upon approving a task'}
            </p>
            <input
              type="number"
              min="0"
              max="50"
              value={systemSettings.reviewer_approval_credit ?? 1}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, reviewer_approval_credit: Number(e.target.value) }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
            />
          </div>

          {/* Rejection QA Credit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'রিজেকশন কিউএ ক্রেডিট' : 'QA Rejection Credit'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                + Points
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'ভুল ধরে ফিডব্যাক সহ রিজেক্ট করলে রিভিউয়ারের পুরস্কার' : 'Credits awarded for thorough QA inspection with feedback'}
            </p>
            <input
              type="number"
              min="0"
              max="50"
              value={systemSettings.reviewer_rejection_credit ?? 1}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, reviewer_rejection_credit: Number(e.target.value) }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
            />
          </div>

          {/* Super Delivery Bonus */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'ফাইনাল ডেলিভারি সুপার বোনাস' : 'Super Delivery Bonus'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                🚀 Bonus
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'নিজে ডিজাইন ফিক্স করে R2 ক্লাউডে স্টক ডেলিভারি দিলে বোনাস' : 'Bonus for fixing and uploading final stock ready asset'}
            </p>
            <input
              type="number"
              min="0"
              max="100"
              value={systemSettings.reviewer_delivery_bonus ?? 3}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, reviewer_delivery_bonus: Number(e.target.value) }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
            />
          </div>

          {/* Staff Rejection Penalty */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'স্টাফ রিজেকশন পেনাল্টি' : 'Staff Rejection Penalty'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                - Penalty
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'টাস্ক রিজেক্ট হলে স্টাফের ওয়ালেট থেকে কত মাইনাস হবে' : 'Deducted from staff upon task rejection'}
            </p>
            <input
              type="number"
              min="0"
              max="20"
              value={systemSettings.staff_rejection_penalty ?? 1}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, staff_rejection_penalty: Number(e.target.value) }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
            />
          </div>

          {/* Max Rewards Cap Per Task */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'ম্যাক্সিমাম রিওয়ার্ড ক্যাপ (Anti-Spam)' : 'Max Reward Cap Per Task'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                🛡️ Limit
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'একই টাস্কে একজন রিভিউয়ার সর্বোচ্চ কতবার ক্রেডিট পাবে' : 'Max review rewards a reviewer can earn for a single task'}
            </p>
            <input
              type="number"
              min="1"
              max="10"
              value={systemSettings.max_review_rewards_per_task ?? 3}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, max_review_rewards_per_task: Number(e.target.value) }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Attendance & Geofencing Security Policy */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <FiShield size={20} className="text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {settings.language === 'bn' ? 'অ্যাটেনডেন্স ও জিওফেন্সিং সিকিউরিটি' : 'Attendance & Geofencing Security'}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {settings.language === 'bn' ? 'অফিসের জিপিএস স্থানাঙ্ক, রেডিয়াস ও আইপি ভেরিফিকেশন নিয়ন্ত্রণ করুন' : 'Control office GPS coordinates, radius, and network validation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={savingSystem}
            onClick={handleSaveSystemSettings}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingSystem ? <FiRefreshCw className="animate-spin" size={14} /> : <FiSave size={14} />}
            <span>{settings.language === 'bn' ? 'সিকিউরিটি সংরক্ষণ করুন' : 'Save Security Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Office Latitude */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'অফিস Latitude (জিপিএস)' : 'Office Latitude'}
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gettingLoc}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <FiMapPin size={10} />
                {gettingLoc ? 'Locating...' : 'Use My GPS'}
              </button>
            </div>
            <input
              type="text"
              value={systemSettings.office_latitude ?? '23.81033100'}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, office_latitude: e.target.value }))}
              placeholder="e.g. 23.81033100"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-800 dark:text-white outline-none focus:border-primary-500"
            />
          </div>

          {/* Office Longitude */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'অফিস Longitude (জিপিএস)' : 'Office Longitude'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                GPS Coords
              </span>
            </div>
            <input
              type="text"
              value={systemSettings.office_longitude ?? '90.41252100'}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, office_longitude: e.target.value }))}
              placeholder="e.g. 90.41252100"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-800 dark:text-white outline-none focus:border-primary-500"
            />
          </div>

          {/* Allowed Geofence Radius */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'অনুমোদিত রেডিয়াস (Meters)' : 'Allowed Radius (Meters)'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Distance Limit
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'অফিস থেকে সর্বোচ্চ কত মিটারের মধ্যে পাঞ্চ গ্রহণযোগ্য' : 'Max distance allowed from office coordinates'}
            </p>
            <input
              type="number"
              min="10"
              max="1000"
              value={systemSettings.office_geofence_radius_meters ?? 50}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, office_geofence_radius_meters: Number(e.target.value) }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-primary-500"
            />
          </div>

          {/* Security Strictness Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'সিকিউরিটি মোড (Strictness)' : 'Security Enforcement Mode'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                Enforcement
              </span>
            </div>
            <select
              value={systemSettings.attendance_security_mode || 'audit_flag'}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, attendance_security_mode: e.target.value }))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="audit_flag">Audit Mode (Allow & Flag with Alert Badge)</option>
              <option value="strict_block">Strict Mode (Block punch if outside office)</option>
            </select>
          </div>

          {/* Allowed Office IPs */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {settings.language === 'bn' ? 'অফিস পাবলিক আইপি ও সাবনেট (Comma Separated)' : 'Allowed Office IPs / Subnets'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                Network
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'bn' ? 'অফিসের ব্রডব্যান্ড পাবলিক আইপি (কমা দিয়ে একাধিক যোগ করতে পারেন)' : 'Whitelisted public IPs of office broadband routers'}
            </p>
            <input
              type="text"
              value={systemSettings.office_allowed_ips ?? '127.0.0.1,::1,182.48.76.182'}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, office_allowed_ips: e.target.value }))}
              placeholder="127.0.0.1, ::1, 182.48.76.182"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-800 dark:text-white outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
