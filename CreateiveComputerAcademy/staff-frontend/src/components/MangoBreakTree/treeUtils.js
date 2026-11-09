/**
 * treeUtils.js
 * Utility functions, formatters, safe branch coordinates, and interactive boy quotes
 * for the Mango Break Tree visualizer and ledger system.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Formats decimal hours (e.g. 0.64, 1.07, 232.47) into friendly human format:
 * "38 mins", "1 hr 4 mins", "232 hrs 28 mins", "13 hrs 2 mins"
 */
export const formatHoursToHuman = (val, { showSign = false, forceSign = null } = {}) => {
  if (val === null || val === undefined || isNaN(val)) return '0 mins';
  const num = Number(val);
  const isNeg = forceSign === '-' || (forceSign === null && num < 0);
  const abs = Math.abs(num);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);

  const finalH = m === 60 ? h + 1 : h;
  const finalM = m === 60 ? 0 : m;

  let text = '';
  if (finalH === 0 && finalM === 0) {
    text = '0 mins';
  } else if (finalH === 0) {
    text = `${finalM} min${finalM === 1 ? '' : 's'}`;
  } else if (finalM === 0) {
    text = `${finalH} hr${finalH === 1 ? '' : 's'}`;
  } else {
    text = `${finalH} hr${finalH === 1 ? '' : 's'} ${finalM} min${finalM === 1 ? '' : 's'}`;
  }

  if (isNeg) return `-${text}`;
  if (showSign && num > 0) return `+${text}`;
  return text;
};

/**
 * Formats a 24h time string (HH:MM or YYYY-MM-DD HH:MM:SS) to 12h AM/PM string
 */
export const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  try {
    const rawTime = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
    const [h, m] = rawTime.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
};

/**
 * Parses an ISO date string into day of week, day number, short month, and full formatted string
 */
export const parseLedgerDate = (dateStr) => {
  if (!dateStr) {
    return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: dateStr || '', raw: dateStr || '' };
  }
  try {
    const cleanDate = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
    const d = new Date(cleanDate + 'T00:00:00');
    if (isNaN(d.getTime())) {
      return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: cleanDate, raw: dateStr };
    }
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { dayOfWeek, dayNumber, monthStr, formatted, raw: cleanDate };
  } catch {
    return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: dateStr, raw: dateStr };
  }
};

/**
 * Safe collision-free coordinates for the 4 tree mangoes on the SVG tree
 * (Crown Apex, High Left, High Right, Mid Right)
 */
export const SAFE_TREE_POSITIONS = [
  { x: 38, y: 24, branch: 'crown-left' },   // High Left Crown
  { x: 62, y: 24, branch: 'crown-right' },  // High Right Crown
  { x: 50, y: 20, branch: 'crown-apex' },   // Apex Center Top
  { x: 66, y: 34, branch: 'mid-right' },    // Mid Right Branch
];

/**
 * Returns dynamic interactive dialogue quotes for the animated boy character
 */
export const getBoyQuotes = (extraBasketMangoesCount = 0) => [
  extraBasketMangoesCount > 0
    ? `মাশাল্লাহ! গাছে ৪টি আর ঝুড়িতে +${extraBasketMangoesCount}টি পাকা আম জমা হয়েছে! 🧺🥭`
    : 'কখন যে পাকা টসটসে আমটা পড়বে! 🥭🤤',
  'এক কামড় দিতে পারলে মনটা জুড়িয়ে যেত! 😋',
  'গাছের ডালে ঝুলছে মিষ্টি আম, আমার ছুটি হবে রঙিন! ✨',
  'খোকা গাছে তাকিয়ে দিন গুনছে, ওভারটাইমের পাকা আম! 👦🥭',
];

