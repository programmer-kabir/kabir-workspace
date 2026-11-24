import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key) => key,
    };
  }
  return ctx;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('cca_lang') || 'en');

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'bn' : 'en';
      localStorage.setItem('cca_lang', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t: (k) => k }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
