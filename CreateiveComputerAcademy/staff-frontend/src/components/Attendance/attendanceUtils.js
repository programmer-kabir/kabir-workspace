export const calculateWorkTime = (checkInTimeStr, time, shiftHours = 8) => {
  if (!checkInTimeStr || !time) return null;

  const parts = checkInTimeStr.split(':').map(Number);
  if (parts.length < 3) return null;
  const [hours, minutes, seconds] = parts;
  const checkInDate = new Date(time);
  checkInDate.setHours(hours, minutes, seconds, 0);

  const now = time;
  let elapsedSeconds = Math.floor((now - checkInDate) / 1000);
  if (elapsedSeconds < 0) elapsedSeconds = 0;

  const TARGET_HOURS = shiftHours || 8;
  const TARGET_SECONDS = TARGET_HOURS * 3600;

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatElapsed = formatTime(elapsedSeconds);

  if (elapsedSeconds >= TARGET_SECONDS) {
    const overtimeSec = elapsedSeconds - TARGET_SECONDS;
    return {
      type: 'overtime',
      label: 'Overtime (+)',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-200 dark:border-emerald-800/50',
      barColor: 'bg-emerald-500 dark:bg-emerald-400',
      value: formatTime(overtimeSec),
      elapsed: formatElapsed,
      progress: 100
    };
  } else {
    const remainingSec = TARGET_SECONDS - elapsedSeconds;
    const progress = (elapsedSeconds / TARGET_SECONDS) * 100;
    return {
      type: 'remaining',
      label: 'Time Remaining',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
      barColor: 'bg-amber-500 dark:bg-amber-400',
      value: formatTime(remainingSec),
      elapsed: formatElapsed,
      progress: progress
    };
  }
};

export const parseTime = (timeStr) => {
  const parts = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!parts) return null;
  let h = parseInt(parts[1], 10);
  let m = parseInt(parts[2], 10);
  let s = parts[3] ? parseInt(parts[3], 10) : 0;
  let ampm = parts[4] ? parts[4].toUpperCase() : null;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { h, m, s };
};

export const processAttendanceHistory = (history = [], shiftHours = 8) => {
  return history.map((record) => {
    if (!record.check_in || !record.check_out || record.check_out === '-') return record;

    let total_hours = record.total_hours;
    let overtime = null;
    let is_short = false;
    let rawOverSec = 0;
    let rawShortSec = 0;

    const inTime = parseTime(record.check_in);
    const outTime = parseTime(record.check_out);

    if (inTime && outTime) {
      const inDate = new Date();
      inDate.setHours(inTime.h, inTime.m, inTime.s, 0);

      const outDate = new Date();
      outDate.setHours(outTime.h, outTime.m, outTime.s, 0);

      let elapsedSeconds = Math.floor((outDate - inDate) / 1000);
      if (elapsedSeconds < 0) elapsedSeconds += 24 * 3600;

      const TARGET_SECONDS = (shiftHours || 8) * 3600;

      if (!total_hours) {
        const h = Math.floor(elapsedSeconds / 3600);
        const m = Math.floor((elapsedSeconds % 3600) / 60);
        total_hours = `${h}h ${m}m`;
      }

      if (!overtime) {
        if (elapsedSeconds > TARGET_SECONDS) {
          const overSec = elapsedSeconds - TARGET_SECONDS;
          rawOverSec = overSec;
          const oh = Math.floor(overSec / 3600);
          const om = Math.floor((overSec % 3600) / 60);
          if (overSec >= 60) {
            overtime = `+${oh}h ${om}m`;
            is_short = false;
          } else {
            overtime = `PERFECT`;
            is_short = null;
          }
        } else if (elapsedSeconds < TARGET_SECONDS) {
          const shortSec = TARGET_SECONDS - elapsedSeconds;
          rawShortSec = shortSec;
          const sh = Math.floor(shortSec / 3600);
          const sm = Math.floor((shortSec % 3600) / 60);
          if (shortSec >= 60) {
            overtime = `-${sh}h ${sm}m GAP`;
            is_short = true;
          } else {
            overtime = `PERFECT`;
            is_short = null;
          }
        } else {
          overtime = `PERFECT`;
          is_short = null;
        }
      }
    }
    return { ...record, total_hours, overtime, is_short, rawOverSec, rawShortSec };
  });
};

export const formatTotalSec = (sec) => {
  if (!sec || sec === 0) return '0h 0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

