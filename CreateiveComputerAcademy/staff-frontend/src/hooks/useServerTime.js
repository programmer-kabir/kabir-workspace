import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * useServerTime
 * Fetches server time string once, parses it as local time,
 * then tracks elapsed time correctly to tick every second.
 * Returns a Date object synced to server time.
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
          // Parse "2026-08-25 10:09:41" → treated as LOCAL timezone (Asia/Dhaka from server)
          const raw = res.data.server_time; // e.g. "2026-08-25 10:09:41"
          const [datePart, timePart] = raw.split(' ');
          const [y, mo, d] = datePart.split('-').map(Number);
          const [h, mi, s] = timePart.split(':').map(Number);

          // Create date in LOCAL timezone — server returns BDT, browser timezone is also BDT
          const serverDate = new Date(y, mo - 1, d, h, mi, s, 0);
          const capturedAt = Date.now(); // local ms at time of fetch

          // Set initial immediately
          setServerNow(new Date(serverDate));

          // Tick: add elapsed real time to the initial server date
          interval = setInterval(() => {
            const elapsed = Date.now() - capturedAt; // ms passed since fetch (accurate even if clock changed)
            setServerNow(new Date(serverDate.getTime() + elapsed));
          }, 1000);
        } else {
          throw new Error('Bad response');
        }
      } catch (err) {
        console.warn('useServerTime: Falling back to local time.', err);
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
