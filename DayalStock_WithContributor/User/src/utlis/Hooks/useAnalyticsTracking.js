import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { logVisit, updateVisit } from "../../api/api";
import { getAuth } from "firebase/auth";
import app from "../../Firebase/Firebase.config";

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.indexOf("Chrome") > -1) return "Chrome";
  if (ua.indexOf("Firefox") > -1) return "Firefox";
  if (ua.indexOf("Safari") > -1) return "Safari";
  if (ua.indexOf("Edge") > -1) return "Edge";
  return "Unknown";
};

const getOS = () => {
  const ua = navigator.userAgent;
  if (ua.indexOf("Windows") > -1) return "Windows";
  if (ua.indexOf("Android") > -1) return "Android";
  if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) return "iOS";
  if (ua.indexOf("Mac") > -1) return "macOS";
  if (ua.indexOf("Linux") > -1) return "Linux";
  return "Unknown";
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
};

export const useAnalyticsTracking = () => {
  const location = useLocation();
  const auth = getAuth(app);
  
  const visitorLogIdRef = useRef(null);
  const pageEnterTimeRef = useRef(Date.now());
  const isFirstLoadRef = useRef(true);

  // Initialize Session
  let sessionId = sessionStorage.getItem("dayalstock_session_id");
  let lastActive = sessionStorage.getItem("dayalstock_last_active");

  const now = Date.now();
  // 30 mins timeout
  if (!sessionId || (lastActive && now - parseInt(lastActive, 10) > 30 * 60 * 1000)) {
    sessionId = generateUUID();
    sessionStorage.setItem("dayalstock_session_id", sessionId);
  }
  sessionStorage.setItem("dayalstock_last_active", now.toString());

  useEffect(() => {
    const trackPageVisit = async () => {
      // If not first load, update previous page duration before logging new page
      if (!isFirstLoadRef.current && visitorLogIdRef.current) {
        const duration = Math.floor((Date.now() - pageEnterTimeRef.current) / 1000);
        await updateVisit({
          visitor_log_id: visitorLogIdRef.current,
          visit_duration: duration
        });
      }

      pageEnterTimeRef.current = Date.now();
      isFirstLoadRef.current = false;
      sessionStorage.setItem("dayalstock_last_active", Date.now().toString());

      const user = auth.currentUser;
      
      const visitData = {
        session_id: sessionId,
        user_id: user ? user.uid : '',
        is_logged_in: user ? true : false,
        page_url: window.location.pathname + window.location.search,
        page_title: document.title,
        referrer: document.referrer,
        browser: getBrowser(),
        os: getOS(),
        device_type: getDeviceType(),
        user_agent: navigator.userAgent,
        language: navigator.language || "Unknown",
      };

      const res = await logVisit(visitData);
      if (res && res.success) {
        visitorLogIdRef.current = res.visitor_log_id;
      }
    };

    trackPageVisit();

  }, [location.pathname, location.search, auth.currentUser]); // Re-run on route change or auth state change

  useEffect(() => {
    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && visitorLogIdRef.current) {
        const duration = Math.floor((Date.now() - pageEnterTimeRef.current) / 1000);
        updateVisit({
          visitor_log_id: visitorLogIdRef.current,
          visit_duration: duration
        });
      }
    };

    // Handle browser close / unload
    const handleBeforeUnload = () => {
      if (visitorLogIdRef.current) {
        const duration = Math.floor((Date.now() - pageEnterTimeRef.current) / 1000);
        
        // Use sendBeacon for robustness
        const updateData = JSON.stringify({
          visitor_log_id: visitorLogIdRef.current,
          visit_duration: duration
        });
        
        const blob = new Blob([updateData], { type: 'application/json' });
        navigator.sendBeacon(`${import.meta.env.VITE_LOCALHOST_KEY}/analytics/update_visit.php`, blob);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, []);
};
