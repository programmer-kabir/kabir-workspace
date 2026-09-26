/**
 * Utility functions for user online status and "last seen" formatting.
 * Considers a user "Online" (Active Now) if their last activity is within 5 minutes (300,000 ms).
 * After 5 minutes, accurately formats the relative/absolute last seen time.
 */

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Parses a MySQL DATETIME timestamp into a valid Date object assuming Asia/Dhaka (+06:00).
 */
export const parseActivityDate = (lastActivity) => {
  if (!lastActivity) return null;
  try {
    let str = String(lastActivity).trim().replace(' ', 'T');
    if (!str.includes('+') && !str.endsWith('Z')) {
      str += '+06:00';
    }
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
};

/**
 * Determines whether a user / participant / chat target is currently online.
 * Returns true if explicitly marked online OR if last_activity is within the last 5 minutes.
 */
export const isUserOnline = (entity) => {
  if (!entity) return false;
  if (entity.is_online) return true;

  const date = parseActivityDate(entity.last_activity);
  if (!date) return false;

  const diffMs = Date.now() - date.getTime();
  return diffMs >= 0 && diffMs <= ONLINE_THRESHOLD_MS;
};

/**
 * Formats the "last seen" status string.
 * @param {string|Date} lastActivity - Timestamp of last activity
 * @param {boolean} [forcedOnline] - Optional pre-evaluated online status
 * @returns {string} e.g. "Active Now", "Last seen 6m ago", "Last seen today at 3:15 PM", "Last seen yesterday at 11:30 AM", or "Offline"
 */
export const formatLastSeen = (lastActivity, forcedOnline = null) => {
  if (forcedOnline === true) return 'Active Now';

  const date = parseActivityDate(lastActivity);
  if (!date) {
    return forcedOnline === false ? 'Offline' : 'Offline';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();

  // Within 5 minutes -> show "Active Now"
  if (diffMs <= ONLINE_THRESHOLD_MS) {
    return 'Active Now';
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) {
    return `Last seen ${diffMinutes}m ago`;
  }

  const timeStr = date.toLocaleTimeString([], {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
  });

  const nowDate = new Date();
  const todayDhaka = nowDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const targetDhaka = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

  if (todayDhaka === targetDhaka) {
    return `Last seen today at ${timeStr}`;
  }

  const yesterdayDate = new Date(now - 24 * 60 * 60 * 1000);
  const yesterdayDhaka = yesterdayDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

  if (yesterdayDhaka === targetDhaka) {
    return `Last seen yesterday at ${timeStr}`;
  }

  const monthDay = date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'short',
    day: 'numeric',
  });

  return `Last seen ${monthDay} at ${timeStr}`;
};

/**
 * Returns complete presence data for any user, chat participant, or chat item.
 */
export const getPresenceInfo = (entity) => {
  const online = isUserOnline(entity);
  const lastSeen = formatLastSeen(entity?.last_activity, online);
  return {
    isOnline: online,
    text: lastSeen,
  };
};
