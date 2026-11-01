import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Converts a UTC epoch (ms) into a Date object whose local getters
 * (getHours, getMinutes, getSeconds, toLocaleTimeString) represent
 * Bangladesh Standard Time (Asia/Dhaka, UTC+06:00) on ANY machine.
 */
const toDhakaShiftedDate = (utcEpochMs) => {
  const temp = new Date(utcEpochMs);
  const dhakaOffsetMinutes = 360; // UTC+06:00
  const localOffsetMinutes = -temp.getTimezoneOffset();
  const shiftMs = (dhakaOffsetMinutes - localOffsetMinutes) * 60 * 1000;
  return new Date(utcEpochMs + shiftMs);
};

/**
 * useServerTime
 * Fetches server time from server_time.php, binds it to Bangladesh Standard Time (Asia/Dhaka),
 * and tracks real elapsed time every second.
 * Returns a Date object synced to Bangladesh Standard Time.
 */
const useServerTime = () => {
  const [serverNow, setServerNow] = useState(null);

  useEffect(() => {
    let interval;

    const init = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}api/server_time.php`
        );

        if (res.data.status === 'success') {
          let serverUtcEpoch;

          if (res.data.timestamp_ms) {
            serverUtcEpoch = Number(res.data.timestamp_ms);
          } else if (res.data.server_time) {
            const [datePart, timePart] = res.data.server_time.split(' ');
            serverUtcEpoch = new Date(`${datePart}T${timePart}+06:00`).getTime();
          } else {
            throw new Error('Invalid server_time payload');
          }

          const capturedAt = Date.now();

          // Set initial Dhaka date
          setServerNow(toDhakaShiftedDate(serverUtcEpoch));

          // Tick every second: add real elapsed time
          interval = setInterval(() => {
            const elapsed = Date.now() - capturedAt;
            setServerNow(toDhakaShiftedDate(serverUtcEpoch + elapsed));
          }, 1000);
        } else {
          throw new Error('Bad response');
        }
      } catch (err) {
        console.warn('useServerTime: Falling back to local time synced to Dhaka offset.', err);
        const fallbackCapturedAt = Date.now();
        setServerNow(toDhakaShiftedDate(fallbackCapturedAt));
        interval = setInterval(() => {
          setServerNow(toDhakaShiftedDate(Date.now()));
        }, 1000);
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return serverNow;
};

export default useServerTime;
