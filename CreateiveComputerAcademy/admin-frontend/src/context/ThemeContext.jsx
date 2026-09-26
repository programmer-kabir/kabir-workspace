import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const applyTheme = (selectedTheme) => {
    let isDark = false;
    if (selectedTheme === 'dark') {
      isDark = true;
    } else if (selectedTheme === 'light') {
      isDark = false;
    } else {
      // system
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const currentIsDark = document.documentElement.classList.contains('dark');
    const nextTheme = currentIsDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);

    // System theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if invoked outside ThemeProvider
    const fallbackTheme = localStorage.getItem('theme') || 'system';
    const fallbackSetTheme = (t) => {
      localStorage.setItem('theme', t);
      if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    return {
      theme: fallbackTheme,
      setTheme: fallbackSetTheme,
      toggleTheme: () => fallbackSetTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
    };
  }
  return context;
};

export default ThemeContext;
