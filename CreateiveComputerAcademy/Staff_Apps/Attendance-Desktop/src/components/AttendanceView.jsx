import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiClock, FiCheckCircle, FiLogOut, FiCalendar, FiAlertTriangle, 
  FiPieChart, FiTrendingDown, FiAward, FiCoffee, FiAlertCircle, 
  FiArrowRight, FiShield, FiLoader, FiSearch, FiRefreshCw,
  FiHardDrive, FiUploadCloud, FiVideo
} from 'react-icons/fi';
import { soundFx } from '../utils/soundFx';
import BreakWidget from './BreakWidget';
import AttendanceDisputeModal from './AttendanceDisputeModal';
import TiffinTimer from './TiffinTimer';
import VideoSpoolModal from './VideoSpoolModal';
import useServerTime from '../hooks/useServerTime';
import { parseDesktopDeviceInfo, getDesktopLocation } from '../utils/deviceFingerprint';
import { API_BASE } from '../utils/api';
import screenStreamService from '../services/ScreenStreamService';
import offlineQueueService from '../services/OfflineQueueService';
import workstationRecorderService from '../services/WorkstationRecorderService';

const AttendanceView = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const time = useServerTime() || new Date();

  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [shiftHours, setShiftHours] = useState(8);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [actionError, setActionError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Offline and Auto-Sync States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeStr = (d = new Date()) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeDate, setSelectedDisputeDate] = useState(null);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState('');
  const [isManualBreak, setIsManualBreak] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const idleStateRef = useRef({ isIdle: false, idleSeconds: 0 });
  const idleStartRef = useRef(null);
  const activeWindowRef = useRef({ process: '', title: '' });
  const runningAppsRef = useRef([]);

  const [currentIdleStatus, setCurrentIdleStatus] = useState({ isIdle: false, idleSeconds: 0 });
  const [todayIdleSummary, setTodayIdleSummary] = useState({ incidents: 0, totalMinutes: 0, alerts: [] });
  const [showIdleDetailsModal, setShowIdleDetailsModal] = useState(false);
  const [showSpoolModal, setShowSpoolModal] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState(workstationRecorderService.currentStatus);

  useEffect(() => {
    const unsub = workstationRecorderService.subscribeStatus((st) => {
      setRecorderStatus({ ...st });
    });
    return unsub;
  }, []);

  const fetchIdleStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${API_BASE}api/attendance/get_my_idle_status.php?user_id=${currentUser.id}`);
      if (res.data?.status === 'success' && res.data?.data) {
        const summary = {
          incidents: res.data.data.today_incidents_count || 0,
          totalMinutes: res.data.data.today_total_minutes || 0,
          alerts: res.data.data.today_alerts || []
        };
        setTodayIdleSummary(summary);
        offlineQueueService.saveLocalIdleSummary(currentUser.id, summary);

        if (res.data.data.is_currently_idle) {
          setCurrentIdleStatus({
            isIdle: true,
            idleSeconds: res.data.data.current_idle_seconds || 300
          });
        }
      }
    } catch {
      // Offline fallback: load cached idle summary from local storage
      const local = offlineQueueService.getLocalIdleSummary(currentUser.id);
      if (local) {
        setTodayIdleSummary(local);
      }
    }
  };

  const triggerOfflineSync = async () => {
    if (!navigator.onLine || !currentUser?.id || isSyncing) return;
    const punchCount = offlineQueueService.getPendingCount(currentUser.id);
    const breakCount = offlineQueueService.getPendingBreaksCount ? offlineQueueService.getPendingBreaksCount(currentUser.id) : 0;
    const taskCount = offlineQueueService.getPendingTasksCount ? offlineQueueService.getPendingTasksCount(currentUser.id) : 0;
    const idleCount = offlineQueueService.getPendingIdleCount ? offlineQueueService.getPendingIdleCount(currentUser.id) : 0;

    if (punchCount === 0 && breakCount === 0 && taskCount === 0 && idleCount === 0) {
      setPendingSyncCount(0);
      return;
    }

    setIsSyncing(true);
    try {
      let syncedPunches = 0;
      if (punchCount > 0) {
        const res = await offlineQueueService.syncPendingPunches(currentUser.id, API_BASE);
        if (res.success && res.synced_count > 0) {
          syncedPunches = res.synced_count;
        }
      }

      let syncedBreaks = 0;
      if (breakCount > 0 && offlineQueueService.syncPendingBreaks) {
        const resBrk = await offlineQueueService.syncPendingBreaks(currentUser.id, API_BASE);
        if (resBrk.success && resBrk.synced_count > 0) {
          syncedBreaks = resBrk.synced_count;
        }
      }

      let syncedTasks = 0;
      if (taskCount > 0 && offlineQueueService.syncPendingTaskActions) {
        const resTask = await offlineQueueService.syncPendingTaskActions(currentUser.id, API_BASE);
        if (resTask.success && resTask.synced_count > 0) {
          syncedTasks = resTask.synced_count;
        }
      }

      let syncedIdle = 0;
      if (idleCount > 0 && offlineQueueService.syncPendingIdle) {
        const resIdle = await offlineQueueService.syncPendingIdle(currentUser.id, API_BASE);
        if (resIdle.success && resIdle.synced_count > 0) {
          syncedIdle = resIdle.synced_count;
        }
      }

      const totalSynced = syncedPunches + syncedBreaks + syncedTasks + syncedIdle;
      if (totalSynced > 0) {
        soundFx.playSuccess();
        const parts = [];
        if (syncedPunches > 0) parts.push(`${syncedPunches}টি পাঞ্চ`);
        if (syncedBreaks > 0) parts.push(`${syncedBreaks}টি ব্রেক`);
        if (syncedTasks > 0) parts.push(`${syncedTasks}টি টাস্ক`);
        if (syncedIdle > 0) parts.push(`${syncedIdle}টি আইডল`);
        const msg = `${parts.join(', ')} সার্ভারে সফলভাবে সিঙ্ক হয়েছে!`;
        setSyncSuccessMsg(msg);
        setTimeout(() => setSyncSuccessMsg(''), 6000);

        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification('অফলাইন ডেটা সিঙ্ক হয়েছে ✅', msg);
        }
        await fetchAttendance();
        await fetchIdleStatus();
      }
    } catch (e) {
      console.warn('[Auto-sync routine glitch]:', e);
    } finally {
      const remPunches = offlineQueueService.getPendingCount(currentUser.id);
      const remBreaks = offlineQueueService.getPendingBreaksCount ? offlineQueueService.getPendingBreaksCount(currentUser.id) : 0;
      const remTasks = offlineQueueService.getPendingTasksCount ? offlineQueueService.getPendingTasksCount(currentUser.id) : 0;
      const remIdle = offlineQueueService.getPendingIdleCount ? offlineQueueService.getPendingIdleCount(currentUser.id) : 0;
      setPendingSyncCount(remPunches + remBreaks + remTasks + remIdle);
      setIsSyncing(false);
    }
  };

  const fetchAttendance = async () => {
    if (!currentUser?.id) return;
    const todayStr = getLocalDateStr(time);
    
    // Check local offline cache first as optimistic fallback
    const localCached = offlineQueueService.getLocalAttendance(currentUser.id, todayStr);
    if (localCached && !todayStatus) {
      setTodayStatus(localCached);
    }
    const pCount = offlineQueueService.getPendingCount(currentUser.id);
    const bCount = offlineQueueService.getPendingBreaksCount ? offlineQueueService.getPendingBreaksCount(currentUser.id) : 0;
    const tCount = offlineQueueService.getPendingTasksCount ? offlineQueueService.getPendingTasksCount(currentUser.id) : 0;
    setPendingSyncCount(pCount + bCount + tCount);

    if (!navigator.onLine) {
      if (localCached) {
        setTodayStatus(localCached);
      }
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}api/attendance/get_attendance.php`, {
        user_id: currentUser.id
      });
      if (response.data.status === 'success') {
        const srvToday = response.data.today;
        // If server says no check_in yet but we have an unsynced local check_in, retain local status
        if ((!srvToday || !srvToday.check_in) && localCached?.check_in && localCached.is_offline_pending) {
          setTodayStatus({
            ...localCached,
            ...(srvToday || {})
          });
        } else {
          setTodayStatus(srvToday);
          if (srvToday?.check_in) {
            offlineQueueService.markLocalAttendanceSynced(currentUser.id, todayStr);
          }
        }

        setHistory(response.data.history || []);
        if (response.data.shift_hours) setShiftHours(response.data.shift_hours);
        if (response.data.total_break_minutes !== undefined) setTotalBreakMinutes(response.data.total_break_minutes);
        if (response.data.is_manual_break !== undefined) {
          setIsManualBreak(Boolean(response.data.is_manual_break));
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance from server', err);
      if (localCached) {
        setTodayStatus(localCached);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Network listener & Auto-Sync watchdog
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerOfflineSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check & periodic sync check every 20 seconds
    triggerOfflineSync();
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        triggerOfflineSync();
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [currentUser?.id]);

  // Listen for Tray quick punch and confirm-exit actions
  useEffect(() => {
    if (window.electronAPI?.onTrayAction) {
      const unsub = window.electronAPI.onTrayAction(async (action) => {
        if (action === 'trigger-punch') {
          if (!todayStatus) {
            handleCheckIn();
          } else if (!todayStatus.check_out) {
            handleCheckOut();
          }
        } else if (action === 'confirm-exit') {
          // If staff is currently on active duty, warn and alert admin if forced
          if (todayStatus?.check_in && !todayStatus?.check_out) {
            const confirmed = window.confirm(
              '⚠️ You are currently Checked In on active duty!\n\nExiting without checking out will alert administrators.\n\nAre you sure you want to quit?'
            );
            if (confirmed) {
              try {
                // Dispatch emergency alert to Admin portal before process terminates
                await screenStreamService.sendSignal('staff-force-quit', 'admin', {
                  user_id: currentUser?.id,
                  name: currentUser?.name || 'Staff',
                  reason: 'Staff closed desktop attendance app from tray menu while on duty'
                });
              } catch (e) {}
              window.electronAPI.quitApp();
            }
          } else {
            // Safe clean exit
            window.electronAPI.quitApp();
          }
        }
      });
      return unsub;
    }
  }, [todayStatus, currentUser]);

  // Live Screen Surveillance & Continuous 30-Min Video Recording Lifecycle
  useEffect(() => {
    if (currentUser?.id && todayStatus?.check_in && !todayStatus?.check_out) {
      screenStreamService.init(currentUser);
      screenStreamService.prewarmStream();
      workstationRecorderService.init(currentUser);
      workstationRecorderService.startContinuousRecording(currentUser);
    } else {
      screenStreamService.destroy();
      workstationRecorderService.destroy();
    }
    return () => {
      screenStreamService.destroy();
      workstationRecorderService.destroy();
    };
  }, [todayStatus?.check_in, todayStatus?.check_out, currentUser?.id]);

  // 5-Minute Inactivity & Idle Watchdog Listener
  useEffect(() => {
    if (currentUser?.id) {
      fetchIdleStatus();
    }
  }, [currentUser?.id, todayStatus?.check_in]);

  useEffect(() => {
    if (!window.electronAPI?.onInactivityStatus) return;

    const unsub = window.electronAPI.onInactivityStatus((data) => {
      const safeIdleSecs = Math.min(43200, Math.max(0, Number(data?.idleSeconds) || 0));
      idleStateRef.current = { isIdle: Boolean(data?.isIdle), idleSeconds: safeIdleSecs };
      setCurrentIdleStatus({ isIdle: Boolean(data?.isIdle), idleSeconds: safeIdleSecs });

      // Refresh today's summary when resuming
      if (!data?.isIdle) {
        fetchIdleStatus();
      }

      // If this is a periodic tick while already idle, don't re-notify or resend initial staff-idle signal
      if (data?.isTick) {
        return;
      }

      // Only process inactivity if staff is currently checked in on duty
      if (todayStatus?.check_in && !todayStatus?.check_out && currentUser?.id) {
        if (data.isIdle) {
          if (!idleStartRef.current) {
            idleStartRef.current = new Date(Date.now() - ((data.idleSeconds || 300) * 1000));
          }
          console.warn('[AttendanceView] 5-minute inactivity detected.');
          // 1. Local gentle alert to staff
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification(
              'Inactivity Notice (5 min+)',
              'You have been idle for 5 minutes. If you are on a break, please select Break in the app.'
            );
          }
          // 2. Dispatch real-time alert to Admin portal (if online)
          if (navigator.onLine) {
            screenStreamService.sendSignal('staff-idle', 'admin', {
              user_id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              idle_seconds: data.idleSeconds || 300,
              active_process: activeWindowRef.current?.process || '',
              active_window_title: activeWindowRef.current?.title || ''
            });
          }
        } else {
          console.log('[AttendanceView] Staff resumed activity.');
          const finalIdleSeconds = Math.max(300, Number(data?.idleSeconds) || 300);
          const startedAt = idleStartRef.current || new Date(Date.now() - (finalIdleSeconds * 1000));
          const resumedAt = new Date();

          // Enqueue offline idle alert
          offlineQueueService.enqueueIdleAlert({
            userId: currentUser.id,
            startedAt,
            resumedAt,
            idleSeconds: finalIdleSeconds,
            activeProcess: activeWindowRef.current?.process || '',
            activeWindowTitle: activeWindowRef.current?.title || ''
          });

          // Refresh local summary
          const localSum = offlineQueueService.getLocalIdleSummary(currentUser.id);
          setTodayIdleSummary(localSum);
          idleStartRef.current = null;

          // If online, immediately try to sync
          if (navigator.onLine) {
            offlineQueueService.syncPendingIdle(currentUser.id, API_BASE).then(() => {
              fetchIdleStatus();
            }).catch(() => {});

            screenStreamService.sendSignal('staff-active', 'admin', {
              user_id: currentUser.id,
              name: currentUser.name,
              idle_seconds: data?.idleSeconds || 0
            });
          }
        }
      }
    });

    return unsub;
  }, [todayStatus?.check_in, todayStatus?.check_out, currentUser]);

  // Real-time Active Window & Running Software Tracker
  useEffect(() => {
    if (!window.electronAPI?.onActiveWindowChange) return;

    // Fetch initial state
    if (window.electronAPI.getActiveWindow) {
      window.electronAPI.getActiveWindow().then(win => {
        if (win) activeWindowRef.current = win;
      }).catch(() => {});
    }

    if (window.electronAPI.getRunningApps) {
      window.electronAPI.getRunningApps().then(apps => {
        if (apps) runningAppsRef.current = apps;
      }).catch(() => {});
    }

    const unsubWindow = window.electronAPI.onActiveWindowChange((win) => {
      activeWindowRef.current = win;
      // Real-time push to Admin monitor if on duty
      if (todayStatus?.check_in && !todayStatus?.check_out && currentUser?.id) {
        screenStreamService.sendSignal('staff-active-window', 'admin', {
          user_id: currentUser.id,
          name: currentUser.name,
          active_window: win
        });
      }
    });

    const unsubApps = window.electronAPI.onRunningAppsChange ? window.electronAPI.onRunningAppsChange((apps) => {
      runningAppsRef.current = apps;
    }) : null;

    return () => {
      if (unsubWindow) unsubWindow();
      if (unsubApps) unsubApps();
    };
  }, [todayStatus?.check_in, todayStatus?.check_out, currentUser]);

  // 30-Second Heartbeat Watchdog for Live Attendance & Tamper Detection
  useEffect(() => {
    if (!currentUser?.id || !todayStatus?.check_in || todayStatus?.check_out) return;

    const sendHeartbeat = async () => {
      try {
        await axios.post(`${API_BASE}api/screen_monitor/heartbeat.php`, {
          user_id: currentUser.id,
          status: 'checked_in',
          is_idle: idleStateRef.current.isIdle ? 1 : 0,
          idle_seconds: idleStateRef.current.idleSeconds || 0,
          active_process: activeWindowRef.current?.process || '',
          active_window_title: activeWindowRef.current?.title || '',
          running_apps: JSON.stringify(runningAppsRef.current || [])
        });
      } catch (err) {
        console.debug('[Heartbeat] Ping failed (network or server glitch):', err.message);
      }
    };

    // Immediate initial heartbeat ping
    sendHeartbeat();

    // Repeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [todayStatus?.check_in, todayStatus?.check_out, currentUser?.id]);

  const handleCheckIn = async () => {
    setActionError('');
    setIsPunching(true);
    const todayStr = getLocalDateStr(time);
    const timeStr = getLocalTimeStr(time);

    try {
      // 1. Silently claim and pre-warm screen capture immediately upon user button click gesture
      if (currentUser?.id) {
        screenStreamService.init(currentUser);
        screenStreamService.prewarmStream().catch(() => {});
      }

      const [deviceInfo, location] = await Promise.all([
        parseDesktopDeviceInfo(),
        getDesktopLocation()
      ]);

      let appVersion = '1.0.2';
      if (window.electronAPI?.getAppVersion) {
        try {
          const v = await window.electronAPI.getAppVersion();
          if (v) appVersion = v;
        } catch (e) {}
      }

      // Check if offline before attempting network request
      if (!navigator.onLine) {
        await offlineQueueService.enqueuePunch({
          userId: currentUser.id,
          type: 'check_in',
          punchDate: todayStr,
          punchTime: timeStr,
          deviceInfo,
          location
        });

        setTodayStatus({
          date: todayStr,
          check_in: timeStr,
          check_out: null,
          status: 'Present',
          is_offline_pending: true
        });

        setPendingSyncCount(offlineQueueService.getPendingCount(currentUser.id));
        soundFx.playPunchIn();

        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(
            'Checked In (Offline ⏳)',
            `অফলাইনে হাজিরা রেকর্ড হয়েছে: ${timeStr}। ইন্টারনেট এলে স্বয়ংক্রিয়ভাবে সার্ভারে সিঙ্ক হবে।`
          );
        }
        return;
      }

      const response = await axios.post(`${API_BASE}api/attendance/check_in.php`, {
        user_id: currentUser.id,
        device_info: deviceInfo,
        location: location,
        app_version: appVersion
      });

      if (response.data.status === 'success') {
        soundFx.playPunchIn();
        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification('Checked In Successfully', `Recorded at ${time.toLocaleTimeString()}`);
        }
        offlineQueueService.markLocalAttendanceSynced(currentUser.id, todayStr);
        await fetchAttendance();
        // Ensure stream is ready and live in background
        screenStreamService.init(currentUser);
        screenStreamService.prewarmStream().catch(() => {});
      } else {
        soundFx.playError();
        setActionError(response.data.message || 'Failed to check in.');
        if (response.data.require_update) {
          window.dispatchEvent(new CustomEvent('cca-force-update-required', { detail: response.data }));
        }
      }
    } catch (err) {
      // Check if network failure occurred — fallback to offline punch queue seamlessly!
      const isNetworkErr = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        try {
          const [deviceInfo, location] = await Promise.all([
            parseDesktopDeviceInfo(),
            getDesktopLocation()
          ]);
          await offlineQueueService.enqueuePunch({
            userId: currentUser.id,
            type: 'check_in',
            punchDate: todayStr,
            punchTime: timeStr,
            deviceInfo,
            location
          });

          setTodayStatus({
            date: todayStr,
            check_in: timeStr,
            check_out: null,
            status: 'Present',
            is_offline_pending: true
          });

          setPendingSyncCount(offlineQueueService.getPendingCount(currentUser.id));
          soundFx.playPunchIn();

          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification(
              'Checked In (Offline ⏳)',
              `নেটওয়ার্ক বিচ্ছিন্ন হওয়ায় অফলাইনে হাজিরা রেকর্ড হয়েছে: ${timeStr}। ইন্টারনেট পেলে সিঙ্ক হবে।`
            );
          }
          return;
        } catch (enqueueErr) {
          console.error('Offline fallback check-in failed:', enqueueErr);
        }
      }

      soundFx.playError();
      const errData = err.response?.data;
      if (errData?.require_update || err.response?.status === 426) {
        window.dispatchEvent(new CustomEvent('cca-force-update-required', { detail: errData }));
        setActionError(errData?.message || 'Update required before clocking in.');
      } else {
        setActionError(errData?.message || 'An error occurred during check-in. Make sure you are within office premises.');
      }
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    setActionError('');
    setIsPunching(true);
    const todayStr = getLocalDateStr(time);
    const timeStr = getLocalTimeStr(time);

    try {
      const [deviceInfo, location] = await Promise.all([
        parseDesktopDeviceInfo(),
        getDesktopLocation()
      ]);

      // Check if offline before attempting network request
      if (!navigator.onLine) {
        await offlineQueueService.enqueuePunch({
          userId: currentUser.id,
          type: 'check_out',
          punchDate: todayStr,
          punchTime: timeStr,
          deviceInfo,
          location
        });

        setTodayStatus(prev => ({
          ...(prev || {}),
          check_out: timeStr,
          is_offline_pending: true
        }));

        setPendingSyncCount(offlineQueueService.getPendingCount(currentUser.id));
        soundFx.playPunchOut();
        screenStreamService.destroy();

        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(
            'Checked Out (Offline ⏳)',
            `অফলাইনে প্রস্থান রেকর্ড হয়েছে: ${timeStr}। ইন্টারনেট এলে স্বয়ংক্রিয়ভাবে সার্ভারে সিঙ্ক হবে।`
          );
        }
        return;
      }

      const response = await axios.post(`${API_BASE}api/attendance/check_out.php`, {
        user_id: currentUser.id,
        device_info: deviceInfo,
        location: location
      });

      if (response.data.status === 'success') {
        soundFx.playPunchOut();
        screenStreamService.destroy();
        // Notify server heartbeat of clean checkout
        axios.post(`${API_BASE}api/screen_monitor/heartbeat.php`, {
          user_id: currentUser.id,
          status: 'checked_out'
        }).catch(() => {});

        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification('Checked Out Successfully', `Recorded at ${time.toLocaleTimeString()}`);
        }
        offlineQueueService.markLocalAttendanceSynced(currentUser.id, todayStr);
        await fetchAttendance();
      } else {
        soundFx.playError();
        setActionError(response.data.message || 'Failed to check out.');
      }
    } catch (err) {
      // Check if network error occurred, fallback to offline checkout
      const isNetworkErr = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        try {
          const [deviceInfo, location] = await Promise.all([
            parseDesktopDeviceInfo(),
            getDesktopLocation()
          ]);
          await offlineQueueService.enqueuePunch({
            userId: currentUser.id,
            type: 'check_out',
            punchDate: todayStr,
            punchTime: timeStr,
            deviceInfo,
            location
          });

          setTodayStatus(prev => ({
            ...(prev || {}),
            check_out: timeStr,
            is_offline_pending: true
          }));

          setPendingSyncCount(offlineQueueService.getPendingCount(currentUser.id));
          soundFx.playPunchOut();
          screenStreamService.destroy();

          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification(
              'Checked Out (Offline ⏳)',
              `নেটওয়ার্ক বিচ্ছিন্ন হওয়ায় অফলাইনে চেক-আউট রেকর্ড হয়েছে: ${timeStr}। ইন্টারনেট পেলে সিঙ্ক হবে।`
            );
          }
          return;
        } catch (enqueueErr) {
          console.error('Offline fallback check-out failed:', enqueueErr);
        }
      }

      soundFx.playError();
      setActionError(err.response?.data?.message || 'An error occurred during check-out.');
    } finally {
      setIsPunching(false);
    }
  };

  const calculateWorkTime = (checkInTimeStr) => {
    if (!checkInTimeStr) return null;
    const parts = checkInTimeStr.split(':').map(Number);
    if (parts.length < 3) return null;
    const [hours, minutes, seconds] = parts;
    const checkInDate = new Date(time);
    checkInDate.setHours(hours, minutes, seconds, 0);

    let elapsedSeconds = Math.floor((time - checkInDate) / 1000);
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
        color: 'text-emerald-700 dark:text-emerald-400',
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
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
        barColor: 'bg-amber-500 dark:bg-amber-400',
        value: formatTime(remainingSec),
        elapsed: formatElapsed,
        progress: progress
      };
    }
  };

  const workTimeData = todayStatus && !todayStatus.check_out ? calculateWorkTime(todayStatus.check_in) : null;

  const totalDays = history.length;
  const presentDays = history.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const leaveDays = history.filter(r => r.status === 'Leave').length;
  const absentDays = history.filter(r => r.status === 'Absent').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const processedHistory = history.map(record => {
    if (!record.check_in || !record.check_out || record.check_out === '-') return record;

    let total_hours = record.total_hours;
    let overtime = null;
    let is_short = false;
    let rawOverSec = 0;
    let rawShortSec = 0;

    const parseTime = (timeStr) => {
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

  const displayHistory = processedHistory.filter(record => {
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (record.date || '').toLowerCase().includes(term) ||
      (record.status || '').toLowerCase().includes(term) ||
      (record.check_in || '').toLowerCase().includes(term) ||
      (record.check_out || '').toLowerCase().includes(term) ||
      (record.total_hours || '').toLowerCase().includes(term)
    );
  });

  const totalOvertimeSec = processedHistory.reduce((acc, curr) => acc + (curr.rawOverSec || 0), 0);
  const totalGapSec = processedHistory.reduce((acc, curr) => acc + (curr.rawShortSec || 0), 0);

  const formatTotalSec = (sec) => {
    if (sec === 0) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading Attendance Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto w-full">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Attendance Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Manage your daily check-ins, shift progress, and view attendance history.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Tiffin Timer Banner */}
      <TiffinTimer />

      {/* Workstation Video Surveillance & Offline Spool Banner */}
      {(todayStatus?.check_in && !todayStatus?.check_out) || (recorderStatus?.spoolCount > 0) ? (
        <div className="mb-4 px-4 py-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              recorderStatus?.currentUpload
                ? 'bg-indigo-500 animate-ping'
                : recorderStatus?.isRecording 
                ? 'bg-red-500 animate-pulse' 
                : (recorderStatus?.spoolCount > 0)
                ? 'bg-amber-500'
                : 'bg-slate-400'
            }`} />

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                <FiVideo className="w-3.5 h-3.5 text-indigo-500" />
                স্ক্রিন সার্ভিল্যান্স ও ভিডিও স্টোরেজ:
              </span>

              {recorderStatus?.currentUpload ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <FiUploadCloud className="w-3.5 h-3.5 animate-bounce" />
                  আপলোড হচ্ছে: চাংক #{recorderStatus.currentUpload.chunkIndex} ({recorderStatus.currentUpload.percent}%)
                </span>
              ) : recorderStatus?.isRecording ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  সক্রিয় • Full HD 1080p @ 30 FPS (চাংক #{recorderStatus.chunkIndex || 1})
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  রেকর্ড বন্ধ রয়েছে
                </span>
              )}

              {recorderStatus?.spoolCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                  <FiHardDrive className="w-3 h-3 text-amber-500" />
                  {recorderStatus.spoolCount} টি ভিডিও অফলাইনে পেন্ডিং ({((recorderStatus.spoolTotalBytes || 0) / (1024 * 1024)).toFixed(0)} MB)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {recorderStatus?.lastUploadedChunk && !recorderStatus?.currentUpload && (
              <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                সর্বশেষ আপলোড: চাংক #{recorderStatus.lastUploadedChunk.chunkIndex || 'OK'} ({recorderStatus.lastUploadedChunk.time})
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowSpoolModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>স্পুল ও স্টোরেজ বিস্তারিত</span>
              <FiArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Offline Mode & Sync Alert Banner */}
      {(!isOnline || pendingSyncCount > 0 || syncSuccessMsg) && (
        <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg transition-all ${
          !isOnline 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
            : syncSuccessMsg
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              !isOnline 
                ? 'bg-amber-400 animate-ping' 
                : syncSuccessMsg
                ? 'bg-emerald-400'
                : 'bg-sky-400 animate-pulse'
            }`} />
            <div className="leading-tight">
              {!isOnline ? (
                <span>
                  <strong>অফলাইন মোড সক্রিয়:</strong> ইন্টারনেট সংযোগ বিচ্ছিন্ন। আপনি নিশ্চিন্তে অফলাইনে চেক-ইন ও চেক-আউট দিতে পারবেন, নেট কানেকশন পেলে স্বয়ংক্রিয়ভাবে সার্ভারে পুশ হবে।
                </span>
              ) : syncSuccessMsg ? (
                <span>{syncSuccessMsg}</span>
              ) : (
                <span>
                  <strong>অফলাইন পাঞ্চ পেন্ডিং:</strong> {pendingSyncCount}টি পাঞ্চ লোকালি সংরক্ষিত আছে এবং সার্ভারে সিঙ্ক হওয়ার অপেক্ষায় রয়েছে।
                </span>
              )}
            </div>
          </div>

          {isOnline && pendingSyncCount > 0 && (
            <button
              onClick={triggerOfflineSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <FiRefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক করুন'}</span>
            </button>
          )}
        </div>
      )}

      {/* Metrics Dashboard (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiAward />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Total Present</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{presentDays}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiTrendingDown />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Total Leave</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{leaveDays}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiAlertTriangle />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Total Absent</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{absentDays}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiPieChart />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Rate</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{attendanceRate}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiClock />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Total Gap</p>
            <p className="text-base font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalGapSec)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiCheckCircle />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Overtime</p>
            <p className="text-base font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalOvertimeSec)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-lg shrink-0">
            <FiCoffee />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Total Break</p>
            <p className="text-base font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalBreakMinutes * 60)}</p>
          </div>
        </div>

        {/* Watchdog Inactivity Status Card */}
        <button
          type="button"
          onClick={() => setShowIdleDetailsModal(true)}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1 text-left hover:border-amber-400/50 dark:hover:border-slate-600 transition-all cursor-pointer group"
          title="Click to view workstation inactivity log"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
            todayIdleSummary.incidents > 0 ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          }`}>
            <FiShield />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate flex items-center gap-1.5">
              Watchdog
              {todayIdleSummary.incidents > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </p>
            <p className={`text-base font-black leading-none truncate ${
              todayIdleSummary.incidents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {todayIdleSummary.incidents > 0 ? `${todayIdleSummary.incidents} Alert (${todayIdleSummary.totalMinutes}m)` : 'Active (100%)'}
            </p>
          </div>
        </button>
      </div>

      {/* Real-time Inactivity Notice to Staff */}
      {currentIdleStatus.isIdle && todayStatus?.check_in && !todayStatus?.check_out && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-transparent border border-amber-400 dark:border-amber-500/40 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping shrink-0" />
            <div>
              <h4 className="text-sm font-black text-amber-800 dark:text-amber-300">
                Workstation Inactivity Detected ({Math.floor((currentIdleStatus.idleSeconds || 300) / 60)}m+ Idle)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                No mouse or keyboard movement detected. Admin monitoring is active. Move cursor to resume, or select Break if stepping away.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsManualBreak(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-xs"
          >
            Take Official Break ☕
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl mb-6 flex items-start gap-3">
          <FiAlertTriangle className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-400" />
          <p className="text-xs font-semibold">{actionError}</p>
        </div>
      )}

      {/* Main Grid: 3D Analog Clock & Live Shift Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left: 3D Clock & Action Box */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>

          {/* 3D Cyan Analog Clock */}
          <div className="relative mb-5 mt-1">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-300 via-cyan-500 to-cyan-700 shadow-[0_0_25px_rgba(6,182,212,0.4)] p-[7px] relative z-10">
              <div className="w-full h-full bg-white rounded-full shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] relative flex items-center justify-center">
                {/* 60 Minute Ticks */}
                {[...Array(60)].map((_, i) => (
                  <div key={`tick-${i}`} className="absolute inset-[3px] pointer-events-none" style={{ transform: `rotate(${i * 6}deg)` }}>
                    <div className={`mx-auto ${i % 5 === 0 ? 'w-[2px] h-2 bg-slate-800' : 'w-[1px] h-1 bg-slate-400'}`}></div>
                  </div>
                ))}

                {/* 12 Numbers */}
                {[...Array(12)].map((_, i) => {
                  const num = i === 0 ? 12 : i;
                  const angle = i * 30;
                  const radius = 45;
                  const x = Math.sin((angle * Math.PI) / 180) * radius;
                  const y = -Math.cos((angle * Math.PI) / 180) * radius;
                  return (
                    <div key={`num-${num}`} className="absolute top-1/2 left-1/2 text-[12px] font-bold text-slate-800 pointer-events-none flex items-center justify-center leading-none"
                      style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
                      {num}
                    </div>
                  );
                })}

                {/* Logo */}
                <div className="absolute top-[28%] text-[8px] font-black text-cyan-800 tracking-widest uppercase pointer-events-none">
                  CREATIVE
                </div>

                {/* Hour Hand */}
                <div className="absolute top-1/2 left-1/2 w-[4px] h-[26%] bg-cyan-950 rounded-full origin-bottom z-10 shadow-sm"
                  style={{ transform: `translate(-50%, -100%) rotate(${(time.getHours() / 12) * 360 + (time.getMinutes() / 60) * 30}deg)` }}></div>

                {/* Minute Hand */}
                <div className="absolute top-1/2 left-1/2 w-[3px] h-[37%] bg-cyan-900 rounded-full origin-bottom z-20 shadow-sm"
                  style={{ transform: `translate(-50%, -100%) rotate(${(time.getMinutes() / 60) * 360 + (time.getSeconds() / 60) * 6}deg)` }}></div>

                {/* Second Hand */}
                <div className="absolute top-1/2 left-1/2 w-[1.5px] h-[46%] bg-orange-500 rounded-full origin-[50%_80%] z-30 shadow-md"
                  style={{ transform: `translate(-50%, -80%) rotate(${(time.getSeconds() / 60) * 360}deg)` }}></div>

                {/* Center Pin */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center">
                  <div className="w-[2px] h-[2px] bg-slate-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Digital Time & Date */}
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-0.5 tracking-tight font-mono relative z-10">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold mb-6 uppercase tracking-widest text-[11px]">
            {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Action Buttons */}
          <div className="w-full max-w-sm">
            {!todayStatus ? (
              <button
                onClick={handleCheckIn}
                disabled={isPunching}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 text-base uppercase tracking-wider cursor-pointer disabled:opacity-75"
              >
                {isPunching ? (
                  <>
                    <FiLoader size={18} className="animate-spin" />
                    <span className="text-sm">Verifying & Punching...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    <span>{!isOnline ? 'Check In Now (Offline ⚡)' : 'Check In Now'}</span>
                  </>
                )}
              </button>
            ) : !todayStatus.check_out ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-center">
                  <p className="text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider text-xs mb-0.5 flex items-center justify-center gap-1.5">
                    <span>Check In Time</span>
                    {todayStatus.is_offline_pending && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold lowercase">
                        offline ⏳
                      </span>
                    )}
                  </p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-300 font-mono text-sm">at {todayStatus.check_in}</p>
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={isPunching}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black rounded-2xl shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2 text-base uppercase tracking-wider cursor-pointer disabled:opacity-75"
                >
                  {isPunching ? (
                    <>
                      <FiLoader size={18} className="animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiLogOut size={18} />
                      <span>{!isOnline ? 'Check Out (Offline ⚡)' : 'Check Out'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <div className="flex justify-center text-emerald-500 dark:text-emerald-400 mb-2">
                  <FiCheckCircle size={28} />
                </div>
                <p className="text-slate-800 dark:text-white font-black uppercase tracking-wider text-xs mb-0.5 flex items-center justify-center gap-1.5">
                  <span>Workday Completed</span>
                  {todayStatus.is_offline_pending && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold lowercase">
                      offline ⏳
                    </span>
                  )}
                </p>
                <p className="font-bold text-slate-500 dark:text-slate-400 font-mono text-xs">
                  In: {todayStatus.check_in} | Out: {todayStatus.check_out}
                </p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              <FiShield size={12} className="text-emerald-500 dark:text-emerald-400" />
              <span>Office Geofence & Device Protected</span>
            </div>
          </div>
        </div>

        {/* Right: Live Shift Tracker Box */}
        {workTimeData ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-center relative overflow-hidden transition-all duration-300">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              Shift Progress ({shiftHours} Hours)
            </h3>

            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-full bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden shadow-inner mb-3">
                <div
                  className={`h-full transition-all duration-1000 ${workTimeData.barColor}`}
                  style={{ width: `${Math.min(workTimeData.progress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>0h</span>
                <span>{Math.floor(shiftHours / 2)}h</span>
                <span>{shiftHours}h</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Worked</p>
                <p className="text-xl font-black text-slate-800 dark:text-white font-mono">{workTimeData.elapsed}</p>
              </div>
              <div className={`p-4 rounded-2xl border text-center ${workTimeData.bg} ${workTimeData.borderColor}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${workTimeData.color}`}>{workTimeData.label}</p>
                <p className={`text-xl font-black font-mono ${workTimeData.color}`}>{workTimeData.value}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 border-dashed p-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <FiClock size={24} />
            </div>
            <h3 className="text-base font-black text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Shift Tracker Offline</h3>
            <p className="text-slate-400 font-medium text-xs">Check in to start your {shiftHours}-hour live countdown.</p>
          </div>
        )}

      </div>

      {/* Break Widget Section (if manual break) */}
      {(isManualBreak || currentUser?.is_manual_break || currentUser?.has_tiffin_break === 0 || (Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)) && (
        <div className="mb-8">
          <BreakWidget />
        </div>
      )}

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <FiCalendar className="text-sky-500 dark:text-sky-400" /> This Month's History
          </h3>

          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search date or status..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5 font-bold">Date</th>
                <th className="p-3.5 font-bold">Check In</th>
                <th className="p-3.5 font-bold">Check Out</th>
                <th className="p-3.5 font-bold">Work Hours</th>
                <th className="p-3.5 font-bold">Break Time</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {displayHistory.length > 0 ? displayHistory.map((record, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                    {record.check_in || '-'}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                    {record.check_out || '-'}
                  </td>
                  <td className="p-3.5">
                    {record.total_hours ? (
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-800 dark:text-white">{record.total_hours}</span>
                        {record.overtime && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            record.is_short === true ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                            record.is_short === false ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {record.overtime}
                          </span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400 font-medium">
                    {record.total_break_minutes > 0 ? `${record.total_break_minutes}m` : '-'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                      record.status === 'Present' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' :
                      record.status === 'Late' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' :
                      record.status === 'Absent' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => {
                        setSelectedDisputeDate(record.date);
                        setIsDisputeModalOpen(true);
                        setDisputeSuccessMsg('');
                      }}
                      className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Report an issue"
                    >
                      <FiAlertCircle size={15} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No attendance records found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {disputeSuccessMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50 text-xs font-bold">
          <FiCheckCircle size={18} />
          <span>{disputeSuccessMsg}</span>
        </div>
      )}

      <AttendanceDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        selectedDate={selectedDisputeDate}
        onSuccess={(msg) => {
          setDisputeSuccessMsg(msg);
          setTimeout(() => setDisputeSuccessMsg(''), 5000);
        }}
      />

      {/* Staff Inactivity & Watchdog Log Modal */}
      {showIdleDetailsModal && (
        <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FiClock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">Workstation Activity Watchdog</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Automatic 5-minute inactivity tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowIdleDetailsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Today's Idle Incidents</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                    {todayIdleSummary.incidents} times ({todayIdleSummary.totalMinutes}m total)
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  Watchdog Active
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 bg-sky-50 dark:bg-blue-500/10 border border-sky-100 dark:border-blue-500/20 p-3 rounded-xl leading-relaxed">
                💡 <span className="text-slate-800 dark:text-slate-200 font-bold">How it works:</span> If your workstation has no mouse or keyboard movement for 5+ minutes, an idle event is logged for academy management. Always click <span className="text-amber-600 dark:text-amber-300 font-bold">"Break"</span> when stepping away for lunch or personal reasons!
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Today's Inactivity Log</h4>
                {todayIdleSummary.alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 p-4 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    No inactivity events recorded today. Great job keeping active!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                    {todayIdleSummary.alerts.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-white">
                              {new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              Duration: <strong className="text-amber-600 dark:text-amber-400">{Math.floor((item.idle_seconds || 300) / 60)}m {(item.idle_seconds || 300) % 60}s</strong>
                            </span>
                          </div>
                          {item.active_process && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">
                              App: {item.active_process} {item.active_window_title ? `— ${item.active_window_title}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.is_offline_pending && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              অফলাইন ⏳
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            item.status === 'resumed' ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                            item.status === 'acknowledged' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                            'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 animate-pulse'
                          }`}>
                            {item.status === 'resumed' ? 'Resumed' : item.status === 'acknowledged' ? 'Reviewed' : 'Idle Now'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowIdleDetailsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Spool & Storage Visualizer Modal */}
      <VideoSpoolModal isOpen={showSpoolModal} onClose={() => setShowSpoolModal(false)} />
    </div>
  );
};

export default AttendanceView;
