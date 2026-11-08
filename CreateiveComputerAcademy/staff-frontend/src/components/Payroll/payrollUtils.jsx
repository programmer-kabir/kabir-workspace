import React, { useState } from 'react';

const R2_PUBLIC_BASE = 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/';

export const getProfileImgUrl = (pic) => {
  if (!pic) return null;
  const cleanPic = String(pic).trim();
  if (!cleanPic) return null;
  if (cleanPic.startsWith('http://') || cleanPic.startsWith('https://')) return cleanPic;

  const r2Base = R2_PUBLIC_BASE.replace(/\/+$/, '');
  const relative = cleanPic.replace(/^\/+/, '');
  return `${r2Base}/${relative}`;
};

export const StaffAvatar = ({ name = '', picture = '', size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name ? name.trim().charAt(0).toUpperCase() : 'S';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-black',
  };

  const colors = [
    'from-blue-600 to-indigo-600',
    'from-indigo-600 to-purple-600',
    'from-emerald-600 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-600 to-blue-600',
    'from-violet-600 to-fuchsia-600',
  ];
  const colorIndex = (name || 'A').charCodeAt(0) % colors.length;
  const gradient = colors[colorIndex];

  const src = getProfileImgUrl(picture);

  if (!picture || imgError || !src) {
    return (
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr ${gradient} text-white font-black flex items-center justify-center shrink-0 shadow-lg uppercase select-none ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0 select-none ${className}`}
    />
  );
};

export const formatHoursToClock = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0m';
  const num = Number(val);
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  const finalH = m === 60 ? h + 1 : h;
  const finalM = m === 60 ? 0 : m;

  let text = '';
  if (finalH === 0 && finalM === 0) text = '0m';
  else if (finalH === 0) text = `${finalM}m`;
  else if (finalM === 0) text = `${finalH}h`;
  else text = `${finalH}h ${finalM}m`;
  return isNeg ? `-${text}` : text;
};

export const formatHoursToBengali = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '০ মিনিট';
  const num = Number(val);
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  const finalH = m === 60 ? h + 1 : h;
  const finalM = m === 60 ? 0 : m;

  let text = '';
  if (finalH === 0 && finalM === 0) text = '০ মিনিট';
  else if (finalH === 0) text = `${finalM} মিনিট`;
  else if (finalM === 0) text = `${finalH} ঘণ্টা`;
  else text = `${finalH} ঘণ্টা ${finalM} মিনিট`;
  return isNeg ? `-${text}` : text;
};

export const formatMinutesToClock = (mins) => {
  const m = Math.round(Number(mins) || 0);
  const isNeg = m < 0;
  const absM = Math.abs(m);
  const h = Math.floor(absM / 60);
  const remM = absM % 60;
  let text = '';
  if (h === 0 && remM === 0) text = '0m';
  else if (h === 0) text = `${remM}m`;
  else if (remM === 0) text = `${h}h`;
  else text = `${h}h ${remM}m`;
  return isNeg ? `-${text}` : text;
};

