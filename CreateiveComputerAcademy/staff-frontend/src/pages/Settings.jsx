import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FiMoon, FiSun, FiGlobe, FiMonitor } from 'react-icons/fi';
import { toast } from 'sonner';

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    toast.success(lang === 'en' ? 'Language changed to English' : 'ভাষা পরিবর্তন করা হয়েছে');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-8">
          <FiMonitor className="text-primary-500" />
          {t('settings')}
        </h1>

        <div className="space-y-10">
          {/* Appearance Section */}
          <section>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
              Appearance
            </h2>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Theme Preference</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between Light and Dark mode</p>
              </div>
              <button
                onClick={() => {
                  toggleTheme();
                  toast.success(isDarkMode ? 'Switched to Light Mode' : 'Switched to Dark Mode');
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  isDarkMode ? 'bg-primary-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-1'
                  } flex items-center justify-center`}
                >
                  {isDarkMode ? <FiMoon size={12} className="text-slate-800" /> : <FiSun size={12} className="text-amber-500" />}
                </span>
              </button>
            </div>
          </section>

          {/* Language Section */}
          <section>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
              Language / ভাষা
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  language === 'en'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  language === 'en' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <FiGlobe />
                </div>
                <div>
                  <p className={`font-bold ${language === 'en' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    English
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Default</p>
                </div>
              </button>

              <button
                onClick={() => handleLanguageChange('bn')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  language === 'bn'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  language === 'bn' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <FiGlobe />
                </div>
                <div>
                  <p className={`font-bold ${language === 'bn' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    বাংলা
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bengali</p>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
