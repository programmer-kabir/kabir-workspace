import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const dictionary = {
  en: {
    dashboard: "Dashboard",
    tasks: "Tasks",
    attendance: "Attendance",
    leave: "Leave",
    reports: "Reports",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome back",
    activeTasks: "Active Tasks",
    completed: "Completed",
    inReview: "In Review",
    credits_wallet: "Credit Wallet",
    message: "Message",
    brand_kit: "Brand Kit",
    breaks_log: "Breaks Log",
    academy_feed: "Academy Feed",
    dev_suite: "Dev Console",
    dev_overview: "Overview",
    dev_impersonate: "User Impersonator",
    dev_logs: "System Logs",
    dev_api_tester: "API & Sockets",
    dev_crons: "Crons & Auto",
    dev_database: "Database",
    dev_editor: "Server Code Editor",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    tasks: "টাস্ক সমূহ",
    attendance: "উপস্থিতি",
    leave: "ছুটি",
    reports: "রিপোর্টস",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    logout: "লগআউট",
    welcome: "স্বাগতম",
    activeTasks: "সচল টাস্ক",
    completed: "সম্পন্ন",
    inReview: "রিভিউ চলছে",
    credits_wallet: "ক্রেডিট ওয়ালেট",
    message: "মেসেজ",
    brand_kit: "ব্র্যান্ড কিট",
    breaks_log: "ব্রেক লগ",
    academy_feed: "অ্যাকাডেমি ফিড",
    dev_suite: "ডেভ কনসোল",
    dev_overview: "ওভারভিউ",
    dev_impersonate: "ইউজার ইমপার্সনেটর",
    dev_logs: "সিস্টেম লগ",
    dev_api_tester: "API ও সকেট",
    dev_crons: "ক্রন ও অটোমেশন",
    dev_database: "ডাটাবেজ",
    dev_editor: "সার্ভার কোড এডিটর",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('cca_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cca_language', language);
    // Optionally set html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return dictionary[language]?.[key] || dictionary['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
