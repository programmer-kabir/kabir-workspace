import React, { useState } from 'react';
import {
  FiSettings, FiSliders, FiActivity, FiHelpCircle,
  FiSun, FiMoon, FiGlobe
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh]               = useState(true);
  const [compactCards, setCompactCards]             = useState(false);
  const [language, setLanguage]                     = useState('english');

  return (
    <div className=" mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiSettings className="text-brand-400" /> Portal Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">Configure your review preferences and view scoring criteria.</p>
      </div>

      <div className="grid gap-6">
        
        {/* Appearance & Theme Selector */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-1">
            <FiMoon className="text-brand-400" /> Interface Theme
          </h3>
          <p className="text-white/35 text-[10px] mt-0.5">Select your preferred interface color style.</p>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'
              }`}
            >
              <FiMoon size={20} />
              <div className="text-center">
                <p className="text-xs font-bold">Dark Theme</p>
                <p className="text-[9px] opacity-60 mt-0.5">High contrast, soft on eyes</p>
              </div>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'
              }`}
            >
              <FiSun size={20} />
              <div className="text-center">
                <p className="text-xs font-bold">Light Theme</p>
                <p className="text-[9px] opacity-60 mt-0.5">Bright, crisp aesthetics</p>
              </div>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-1">
            <FiGlobe className="text-brand-400" /> Portal Language
          </h3>
          <p className="text-white/35 text-[10px] mt-0.5">Set the display language of the reviewer interface.</p>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              onClick={() => setLanguage('english')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                language === 'english'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400 font-semibold'
                  : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'
              }`}
            >
              <span className="text-xs">English (US)</span>
            </button>

            <button
              onClick={() => setLanguage('bangla')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                language === 'bangla'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400 font-semibold'
                  : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'
              }`}
            >
              <span className="text-xs">বাংলা (BD)</span>
            </button>
          </div>
        </div>

        {/* Preference Toggles */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
            <FiSliders className="text-brand-400" /> Preferences
          </h3>

          {/* Toggle 1 */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-white text-xs font-semibold">Enable Desktop Notifications</p>
              <p className="text-white/30 text-[10px] mt-0.5">Get notified instantly when new tasks are submitted for review.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={allowNotifications} 
                onChange={() => setAllowNotifications(v => !v)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-white text-xs font-semibold">Auto-Refresh Dashboard</p>
              <p className="text-white/30 text-[10px] mt-0.5">Automatically refresh team task logs every 5 minutes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={() => setAutoRefresh(v => !v)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white text-xs font-semibold">Compact Cards View</p>
              <p className="text-white/30 text-[10px] mt-0.5">Use compact visual layouts for staff profiles and lists.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={compactCards} 
                onChange={() => setCompactCards(v => !v)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Scoring System Details */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4 bg-gradient-to-br from-brand-600/5 to-transparent">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
            <FiActivity className="text-brand-400" /> Work Score Configuration
          </h3>
          <p className="text-white/50 text-xs leading-relaxed">
            The Work Score is automatically calculated based on the employee's monthly task outcomes under your team. 
            The system applies the following weight distribution:
          </p>

          <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-white/40 font-bold uppercase text-[9px]">Task Completion Rate (Weight: 70%)</p>
              <p className="text-emerald-400 text-sm font-bold mt-1">+0.7 points <span className="text-white/40 font-normal">per 1% completed</span></p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-white/40 font-bold uppercase text-[9px]">Rejection Penalty (Weight: 30%)</p>
              <p className="text-rose-400 text-sm font-bold mt-1">-0.3 points <span className="text-white/40 font-normal">per 1% rejected (max -30)</span></p>
            </div>
          </div>
        </div>

        {/* Portal Help */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <FiHelpCircle className="text-brand-400" /> Quick Guidelines
          </h3>
          <ul className="list-disc list-inside text-xs text-white/50 space-y-2 leading-relaxed pl-1">
            <li>Review tasks under the <strong>Pending Reviews</strong> tab.</li>
            <li>Always check the submitted links and attachments before approving a task.</li>
            <li>Provide helpful feedback comments when sending a task back for revision (Rejection).</li>
            <li>Contact administrator if any team member is missing in your panel.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Settings;
