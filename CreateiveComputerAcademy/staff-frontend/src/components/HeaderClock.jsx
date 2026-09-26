import React, { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';
import useServerTime from '../hooks/useServerTime';

const HeaderClock = () => {
  const serverTime = useServerTime();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const d = serverTime || new Date();
    const formatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    setTimeStr(formatted);
  }, [serverTime]);

  return (
    <div 
      className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold shadow-xs select-none"
      title="CCA Official Server Time (BST • UTC+6)"
    >
      <FiClock size={13} className="text-blue-500 animate-pulse shrink-0" />
      <span>{timeStr || '--:--:-- --'}</span>
      <span className="text-[10px] font-sans font-black uppercase text-slate-400 dark:text-slate-500 pl-1 border-l border-slate-200 dark:border-slate-700">
        BST
      </span>
    </div>
  );
};

export default HeaderClock;
