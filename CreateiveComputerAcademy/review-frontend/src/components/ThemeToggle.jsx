import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
        isDark ? 'bg-white/10 border border-white/5 shadow-inner' : 'bg-slate-200 border border-slate-300 shadow-inner'
      }`}
      aria-label="Toggle Theme"
    >
      <motion.div
        className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
          isDark ? 'bg-dark-900 text-purple-400' : 'bg-white text-orange-500'
        }`}
        initial={false}
        animate={{
          x: isDark ? 28 : 0,
          rotate: isDark ? 360 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? <FiMoon size={12} /> : <FiSun size={12} />}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
