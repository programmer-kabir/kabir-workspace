import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';

/**
 * useServerTime
 * Fetches server time string once, parses it as Asia/Dhaka time,
 * then tracks elapsed time correctly to tick every second.
 * Returns a Date object synced to server time.
 */
const useServerTime = () => {
  const [serverNow, setServerNow] = useState(null);

  useEffect(() => {
    let interval;

    const init = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/server_time.php`);

        if (res.data.status === 'success') {
          const raw = res.data.server_time; // e.g. "2026-08-25 10:09:41"
          const [datePart, timePart] = raw.split(' ');
          const [y, mo, d] = datePart.split('-').map(Number);
          const [h, mi, s] = timePart.split(':').map(Number);

          const serverDate = new Date(y, mo - 1, d, h, mi, s, 0);
          const capturedAt = Date.now();

          setServerNow(new Date(serverDate));

          interval = setInterval(() => {
            const elapsed = Date.now() - capturedAt;
            setServerNow(new Date(serverDate.getTime() + elapsed));
          }, 1000);
        } else {
          throw new Error('Bad response');
        }
      } catch (err) {
        setServerNow(new Date());
        interval = setInterval(() => setServerNow(new Date()), 1000);
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
