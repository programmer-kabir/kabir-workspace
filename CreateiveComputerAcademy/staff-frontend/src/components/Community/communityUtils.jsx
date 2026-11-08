import React from 'react';

export const CATEGORIES = [
  { id: 'General', label: 'General', icon: '💬', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  { id: 'Announcement', label: 'Announcement', icon: '📢', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { id: 'Discussion', label: 'Discussion', icon: '💡', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { id: 'Achievement', label: 'Achievement', icon: '🎉', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { id: 'Question', label: 'Question / Help', icon: '❓', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
];

export const EMOJIS = ['👏', '🔥', '🎉', '❤️', '🥭', '💯', '🚀', '🙌'];

/**
 * Formats timestamps in Bangladesh Local Time (Asia/Dhaka, UTC+6)
 * Returns friendly formats like: "এখনই (Just now)", "৫ মিনিট আগে", "আজ • 10:30 AM", "গতকাল • 04:15 PM", "12 Oct, 2026 • 10:30 AM"
 */
export const formatBdDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split(/[- :]/);
    if (parts.length >= 6) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      const minute = parseInt(parts[4], 10);
      const second = parseInt(parts[5], 10);

      // UTC time corresponding to Bangladesh (+6)
      const d = new Date(Date.UTC(year, month, day, hour - 6, minute, second));
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);

      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      const mStr = minute < 10 ? '0' + minute : minute;
      const timeStr = `${h12}:${mStr} ${ampm}`;

      if (diffSec < 60 && diffSec >= 0) return 'এখনই (Just now)';
      if (diffMin < 60 && diffMin > 0) return `${diffMin} মিনিট আগে`;

      // Bangladesh Date calculation for Today / Yesterday
      const nowBd = new Date(now.getTime() + 6 * 3600 * 1000);
      const nowDay = nowBd.getUTCDate();
      const nowMonth = nowBd.getUTCMonth();
      const nowYear = nowBd.getUTCFullYear();

      if (year === nowYear && month === nowMonth && day === nowDay) {
        return `আজ • ${timeStr}`;
      }

      const yestBd = new Date(now.getTime() + 6 * 3600 * 1000 - 86400 * 1000);
      if (year === yestBd.getUTCFullYear() && month === yestBd.getUTCMonth() && day === yestBd.getUTCDate()) {
        return `গতকাল • ${timeStr}`;
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[month]}, ${year} • ${timeStr}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const DEFAULT_MENTION_USERS = [
  { id: 1, name: 'Creative Computer Academy', username: 'admin', avatar: 'uploads/profiles/cca_academy.webp', role: 'Admin' },
  { id: 2, name: 'KABIR HOSSEN', username: 'kabir', avatar: 'uploads/profiles/profile_2_1787112027.jpg', role: 'Staff' },
  { id: 3, name: 'Ashraful Islam Siam', username: 'siam', avatar: 'uploads/profiles/profile_3_1788405288.jpg', role: 'Staff' },
  { id: 4, name: 'Jahidul PSD', username: 'jahidul', avatar: 'uploads/profiles/profile_4_1786956529.jpeg', role: 'Staff' },
  { id: 5, name: 'KalamCreativeStudio', username: 'kalam', avatar: 'uploads/profiles/profile_5_1791353072.jpeg', role: 'Staff' },
  { id: 6, name: 'Rahima Akter', username: 'rahima', avatar: 'uploads/profiles/profile_6_1789038881.jpg', role: 'Staff' },
  { id: 7, name: 'Happy Akter', username: 'happy', avatar: 'uploads/profiles/profile_7_1790734417.jpg', role: 'Staff' },
  { id: 8, name: 'Akhi Akter', username: 'akhi', avatar: 'uploads/profiles/profile_8_1786937895.png', role: 'Staff' },
  { id: 10, name: 'Shahin Alam', username: 'shahin', avatar: null, role: 'Staff' },
  { id: 14, name: 'Sonia Akter', username: 'sonia', avatar: 'uploads/profiles/profile_14_1790947166.webp', role: 'Staff' },
  { id: 15, name: 'MAHFUJA AKTER', username: 'mahfuja', avatar: null, role: 'Staff' },
  { id: 16, name: 'Fahad Sikdar', username: 'fahad', avatar: null, role: 'Staff' },
  { id: 17, name: 'Maruf Mia', username: 'maruf', avatar: null, role: 'Staff' }
];

export const KNOWN_USERNAMES = {
  1: 'admin',
  2: 'kabir',
  3: 'siam',
  4: 'jahidul',
  5: 'kalam',
  6: 'rahima',
  7: 'happy',
  8: 'akhi',
  10: 'shahin',
  14: 'sonia',
  15: 'mahfuja',
  16: 'fahad',
  17: 'maruf'
};

// Parse @mentions in post and comment text
export const renderFormattedContent = (text) => {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.]{3,40})/g);
  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={idx}
          className="font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-1 py-0.5 rounded-md hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

