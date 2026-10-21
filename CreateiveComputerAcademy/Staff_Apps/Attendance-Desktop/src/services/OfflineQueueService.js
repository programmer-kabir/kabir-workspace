// Attendance-Desktop/src/services/OfflineQueueService.js
import axios from 'axios';

const QUEUE_KEY = 'cca_offline_punch_queue';
const VAULT_KEY = 'cca_offline_vault';
const ATTENDANCE_CACHE_KEY = 'cca_local_attendance_cache';
const BREAKS_QUEUE_KEY = 'cca_offline_breaks_queue';
const ACTIVE_BREAK_KEY = 'cca_offline_active_break';
const TASKS_CACHE_PREFIX = 'cca_tasks_cache_';
const TASKS_QUEUE_KEY = 'cca_offline_task_actions_queue';
const IDLE_QUEUE_KEY = 'cca_offline_idle_queue';
const IDLE_SUMMARY_PREFIX = 'cca_idle_summary_';

// Simple fast SHA-256 hash helper using Web Crypto API
async function hashCredential(text) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + '_cca_salt_v1');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback if subtle crypto is unavailable
    return btoa(unescape(encodeURIComponent(text)));
  }
}

class OfflineQueueService {
  /**
   * Get all pending punches from local storage
   */
  getQueue() {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[OfflineQueueService] Error reading queue:', e);
      return [];
    }
  }

  /**
   * Save array of punches to local storage
   */
  saveQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue || []));
    } catch (e) {
      console.error('[OfflineQueueService] Error saving queue:', e);
    }
  }

  /**
   * Add a new punch to the offline queue and update local today attendance
   */
  async enqueuePunch({
    userId,
    type, // 'check_in' or 'check_out'
    punchDate, // 'YYYY-MM-DD'
    punchTime, // 'HH:MM:SS'
    deviceInfo = {},
    location = {}
  }) {
    if (!userId || !type) return null;

    let bootUptime = 0;
    if (window.electronAPI?.getSystemUptime) {
      try {
        bootUptime = await window.electronAPI.getSystemUptime();
      } catch (e) {}
    }

    const punchId = 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const item = {
      id: punchId,
      user_id: userId,
      type: type,
      punch_date: punchDate,
      punch_time: punchTime,
      device_info: deviceInfo,
      location: location,
      boot_uptime: bootUptime,
      created_at: new Date().toISOString(),
      status: 'pending_sync'
    };

    const queue = this.getQueue();
    queue.push(item);
    this.saveQueue(queue);

    // Update local attendance cache immediately so UI reflects punch in real time
    this.updateLocalAttendance(userId, punchDate, type, punchTime);

    console.log('[OfflineQueueService] Punch enqueued successfully:', item);
    return item;
  }

  /**
   * Remove specified punch ID from queue
   */
  dequeuePunch(punchId) {
    const queue = this.getQueue().filter(p => p.id !== punchId);
    this.saveQueue(queue);
  }

  /**
   * Remove multiple punch IDs from queue
   */
  removePunches(punchIds = []) {
    if (!punchIds || punchIds.length === 0) return;
    const idSet = new Set(punchIds);
    const queue = this.getQueue().filter(p => !idSet.has(p.id));
    this.saveQueue(queue);
  }

  /**
   * Get pending punches count for a specific user
   */
  getPendingCount(userId) {
    const queue = this.getQueue();
    if (!userId) return queue.length;
    return queue.filter(p => p.user_id === userId).length;
  }

  /**
   * Get pending punches list for a specific user
   */
  getUserPendingPunches(userId) {
    const queue = this.getQueue();
    if (!userId) return queue;
    return queue.filter(p => p.user_id === userId);
  }

  /**
   * Update local today attendance cache
   */
  updateLocalAttendance(userId, dateStr, type, punchTime) {
    try {
      const cache = this.getLocalAttendanceMap();
      const userKey = `${userId}_${dateStr}`;
      const current = cache[userKey] || {
        date: dateStr,
        check_in: null,
        check_out: null,
        status: 'Present',
        is_offline_pending: true
      };

      if (type === 'check_in') {
        current.check_in = punchTime;
        current.status = 'Present';
      } else if (type === 'check_out') {
        current.check_out = punchTime;
      }
      current.is_offline_pending = true;
      current.last_updated = new Date().toISOString();

      cache[userKey] = current;
      localStorage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('[OfflineQueueService] Error updating local attendance:', e);
    }
  }

  /**
   * Get local attendance map
   */
  getLocalAttendanceMap() {
    try {
      const data = localStorage.getItem(ATTENDANCE_CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Get local attendance for user on a specific date
   */
  getLocalAttendance(userId, dateStr) {
    if (!userId || !dateStr) return null;
    const map = this.getLocalAttendanceMap();
    return map[`${userId}_${dateStr}`] || null;
  }

  /**
   * Mark local attendance as synced
   */
  markLocalAttendanceSynced(userId, dateStr) {
    try {
      const cache = this.getLocalAttendanceMap();
      const userKey = `${userId}_${dateStr}`;
      if (cache[userKey]) {
        cache[userKey].is_offline_pending = false;
        cache[userKey].synced_at = new Date().toISOString();
        localStorage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(cache));
      }
    } catch (e) {}
  }

  /**
   * Cache user credentials securely into offline vault when online login succeeds
   */
  async saveOfflineVault(user, identifier, password) {
    if (!user || !user.id || !password) return;
    try {
      const passHash = await hashCredential(password);
      const vaultData = localStorage.getItem(VAULT_KEY);
      const vault = vaultData ? JSON.parse(vaultData) : {};

      const cleanIdentifier = String(identifier || user.email || user.username || '').trim().toLowerCase();
      
      vault[cleanIdentifier] = {
        user: user,
        passHash: passHash,
        last_online_login: new Date().toISOString()
      };

      // Also key by user.id and user.email for resilient lookup
      if (user.email) {
        vault[user.email.toLowerCase()] = vault[cleanIdentifier];
      }
      if (user.username) {
        vault[user.username.toLowerCase()] = vault[cleanIdentifier];
      }

      localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
      console.log('[OfflineQueueService] User credentials cached in offline vault.');
    } catch (e) {
      console.warn('[OfflineQueueService] Failed to cache credentials in vault:', e);
    }
  }

  /**
   * Verify user credentials against offline vault when offline
   */
  async verifyOfflineVault(identifier, password) {
    try {
      const cleanIdentifier = String(identifier || '').trim().toLowerCase();
      const vaultData = localStorage.getItem(VAULT_KEY);
      if (!vaultData) {
        return { success: false, message: 'অফলাইন লগইনের জন্য পূর্বে এই ডিভাইসে অন্তত একবার অনলাইনে লগইন করা আবশ্যক।' };
      }

      const vault = JSON.parse(vaultData);
      const entry = vault[cleanIdentifier];
      if (!entry || !entry.user || !entry.passHash) {
        return { success: false, message: 'এই আইডেন্টিফায়ারের কোনো অফলাইন প্রোফাইল পাওয়া যায়নি।' };
      }

      const inputHash = await hashCredential(password);
      if (inputHash === entry.passHash) {
        return {
          success: true,
          user: entry.user,
          message: 'অফলাইন ক্রেডেনশিয়াল সফলভাবে যাচাই হয়েছে।'
        };
      } else {
        return { success: false, message: 'পাসওয়ার্ড সঠিক নয় (অফলাইন ভেরিফিকেশন)।' };
      }
    } catch (e) {
      console.error('[OfflineQueueService] Offline vault check error:', e);
      return { success: false, message: 'অফলাইন ক্রেডেনশিয়াল ভেরিফিকেশনে সমস্যা হয়েছে।' };
    }
  }

  /**
   * Sync all pending punches to the server
   */
  async syncPendingPunches(userId, apiBase) {
    if (!navigator.onLine) {
      return { success: false, message: 'ডিভাইস বর্তমানে অফলাইনে রয়েছে।' };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { success: true, synced_count: 0, message: 'সিঙ্ক করার মতো কোনো অফলাইন পাঞ্চ নেই।' };
    }

    // Filter punches for this user if provided, or take all
    const userPunches = userId ? queue.filter(p => p.user_id === userId) : queue;
    if (userPunches.length === 0) {
      return { success: true, synced_count: 0, message: 'এই ইউজারের কোনো পেন্ডিং পাঞ্চ নেই।' };
    }

    try {
      console.log(`[OfflineQueueService] Pushing ${userPunches.length} punch(es) to server...`);
      const baseUrl = apiBase.endsWith('/') ? apiBase : apiBase + '/';
      
      const payload = {
        user_id: userId || userPunches[0].user_id,
        punches: userPunches
      };

      const res = await axios.post(`${baseUrl}api/attendance/sync_offline.php`, payload, {
        timeout: 15000
      });

      if (res.data?.status === 'success') {
        const syncedItems = res.data.synced || [];
        const syncedIds = syncedItems.map(s => s.id).filter(Boolean);

        // If backend returned specific synced IDs, remove them; otherwise remove all userPunches
        if (syncedIds.length > 0) {
          this.removePunches(syncedIds);
        } else {
          this.removePunches(userPunches.map(p => p.id));
        }

        // Mark local attendance as synced
        userPunches.forEach(p => {
          this.markLocalAttendanceSynced(p.user_id, p.punch_date);
        });

        console.log(`[OfflineQueueService] Successfully synced ${res.data.synced_count || userPunches.length} punch(es).`);
        return {
          success: true,
          synced_count: res.data.synced_count || userPunches.length,
          data: res.data
        };
      } else {
        return {
          success: false,
          message: res.data?.message || 'সার্ভার সিঙ্ক সম্পন্ন করতে পারেনি।'
        };
      }
    } catch (err) {
      console.warn('[OfflineQueueService] Sync push error (network or server error):', err.message);
      return {
        success: false,
        message: err.message || 'সিঙ্ক রিকোয়েস্টে নেটওয়ার্ক সমস্যা হয়েছে।'
      };
    }
  }

  // ── Offline Break & Tiffin Queue Handlers ────────────────────────────────────
  getBreaksQueue() {
    try {
      const data = localStorage.getItem(BREAKS_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[OfflineQueueService] Error reading breaks queue:', e);
      return [];
    }
  }

  saveBreaksQueue(queue) {
    try {
      localStorage.setItem(BREAKS_QUEUE_KEY, JSON.stringify(queue || []));
    } catch (e) {
      console.error('[OfflineQueueService] Error saving breaks queue:', e);
    }
  }

  getActiveOfflineBreak(userId) {
    try {
      const data = localStorage.getItem(ACTIVE_BREAK_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (!userId || parsed.user_id === userId) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  enqueueBreakStart({ userId, breakType = 'Tiffin', purpose = 'Tiffin', reason = '', startTime }) {
    if (!userId) return null;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const dateFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const breakId = 'off_brk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const item = {
      id: breakId,
      user_id: userId,
      date: dateFormatted,
      break_type: breakType,
      purpose: purpose || breakType,
      reason: reason || 'Offline break',
      start_time: startTime || timeFormatted,
      end_time: null,
      duration_minutes: 0,
      tiffin_delta: 0,
      status: 'Active',
      is_offline: true,
      created_at: new Date().toISOString()
    };

    // Save as currently active offline break
    localStorage.setItem(ACTIVE_BREAK_KEY, JSON.stringify(item));

    // Save into queue
    const queue = this.getBreaksQueue();
    queue.push(item);
    this.saveBreaksQueue(queue);

    console.log('[OfflineQueueService] Offline break started and enqueued:', item);
    return item;
  }

  enqueueBreakEnd({ userId, breakId, endTime }) {
    if (!userId) return null;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    let active = this.getActiveOfflineBreak(userId);
    const queue = this.getBreaksQueue();

    let targetIdx = -1;
    if (breakId) {
      targetIdx = queue.findIndex(b => b.id === breakId && b.user_id === userId);
    }
    if (targetIdx === -1) {
      targetIdx = queue.findIndex(b => b.user_id === userId && b.status === 'Active');
    }

    let endTs = now.getTime();
    let startTs = active?.start_time ? new Date(active.start_time.replace(' ', 'T')).getTime() : endTs;
    let durationMins = Math.max(1, Math.round(Math.abs(endTs - startTs) / 60000));
    let tiffinDelta = 0;
    const bType = active?.break_type || (targetIdx >= 0 ? queue[targetIdx].break_type : 'Tiffin');

    if (bType === 'Tiffin') {
      tiffinDelta = 40 - durationMins;
    }

    if (targetIdx >= 0) {
      queue[targetIdx].end_time = endTime || timeFormatted;
      queue[targetIdx].duration_minutes = durationMins;
      queue[targetIdx].tiffin_delta = tiffinDelta;
      queue[targetIdx].status = 'Completed';
      queue[targetIdx].updated_at = new Date().toISOString();
      this.saveBreaksQueue(queue);
    }

    // Clear active offline break
    localStorage.removeItem(ACTIVE_BREAK_KEY);

    const result = {
      id: breakId || active?.id,
      user_id: userId,
      break_type: bType,
      duration_minutes: durationMins,
      tiffin_delta: tiffinDelta,
      status: 'Completed',
      is_offline: true
    };

    console.log('[OfflineQueueService] Offline break ended and queued for sync:', result);
    return result;
  }

  getPendingBreaksCount(userId) {
    const queue = this.getBreaksQueue();
    if (!userId) return queue.length;
    return queue.filter(b => b.user_id === userId).length;
  }

  async syncPendingBreaks(userId, apiBase) {
    if (!navigator.onLine) {
      return { success: false, message: 'Device is offline.' };
    }

    const queue = this.getBreaksQueue();
    if (queue.length === 0) {
      return { success: true, synced_count: 0, message: 'No offline breaks to sync.' };
    }

    const userBreaks = userId ? queue.filter(b => b.user_id === userId) : queue;
    if (userBreaks.length === 0) {
      return { success: true, synced_count: 0 };
    }

    try {
      console.log(`[OfflineQueueService] Syncing ${userBreaks.length} offline break(s) to server...`);
      const baseUrl = apiBase.endsWith('/') ? apiBase : apiBase + '/';

      const payload = {
        user_id: userId || userBreaks[0].user_id,
        breaks: userBreaks
      };

      const res = await axios.post(`${baseUrl}api/breaks/sync_offline_breaks.php`, payload, {
        timeout: 15000
      });

      if (res.data?.status === 'success') {
        const syncedItems = res.data.synced || [];
        const syncedClientIds = syncedItems.map(s => s.client_id).filter(Boolean);

        // Remove synced completed breaks from local queue
        const remaining = queue.filter(b => !syncedClientIds.includes(b.id) && !userBreaks.some(ub => ub.id === b.id && ub.status === 'Completed'));
        this.saveBreaksQueue(remaining);

        console.log(`[OfflineQueueService] Successfully synced ${res.data.synced_count || userBreaks.length} break(s).`);
        return {
          success: true,
          synced_count: res.data.synced_count || userBreaks.length,
          data: res.data
        };
      } else {
        return {
          success: false,
          message: res.data?.message || 'Server failed to sync offline breaks.'
        };
      }
    } catch (err) {
      console.warn('[OfflineQueueService] Break sync failed (network error):', err.message);
      return { success: false, message: err.message };
    }
  }

  // ── Offline Tasks Cache & Workflow Action Queue Handlers ───────────────────
  getTasksCache(userId) {
    if (!userId) return [];
    try {
      const data = localStorage.getItem(TASKS_CACHE_PREFIX + userId);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[OfflineQueueService] Error reading tasks cache:', e);
      return [];
    }
  }

  saveTasksCache(userId, tasks) {
    if (!userId) return;
    try {
      localStorage.setItem(TASKS_CACHE_PREFIX + userId, JSON.stringify(tasks || []));
    } catch (e) {
      console.error('[OfflineQueueService] Error saving tasks cache:', e);
    }
  }

  getTasksQueue() {
    try {
      const data = localStorage.getItem(TASKS_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveTasksQueue(queue) {
    try {
      localStorage.setItem(TASKS_QUEUE_KEY, JSON.stringify(queue || []));
    } catch (e) {}
  }

  getPendingTasksCount(userId) {
    const queue = this.getTasksQueue();
    if (!userId) return queue.length;
    return queue.filter(a => a.user_id === userId).length;
  }

  enqueueTaskAction({ userId, taskId, type, status, submissionLink, checklists, timestamp }) {
    if (!userId || !taskId) return null;

    const actionId = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const action = {
      id: actionId,
      user_id: userId,
      task_id: taskId,
      type,
      status: status || null,
      submission_link: submissionLink || null,
      checklists: checklists || null,
      timestamp: timestamp || new Date().toISOString()
    };

    // 1. Append to queue
    const queue = this.getTasksQueue();
    queue.push(action);
    this.saveTasksQueue(queue);

    // 2. Optimistically update local task in cache
    try {
      const cachedTasks = this.getTasksCache(userId);
      const targetIdx = cachedTasks.findIndex(t => t.id === taskId);
      if (targetIdx >= 0) {
        const task = { ...cachedTasks[targetIdx] };

        if (type === 'start_task') {
          // Pause any other in-progress task in cache
          cachedTasks.forEach(t => {
            if (t.id !== taskId && t.status === 'In Progress') {
              t.timer_status = 'Paused';
            }
          });
          task.status = 'In Progress';
          task.timer_status = 'Running';
          task.session_start_time = action.timestamp;
          task.is_offline_pending = true;
        } else if (type === 'pause_timer') {
          task.timer_status = 'Paused';
          task.is_offline_pending = true;
        } else if (type === 'submit_work' || type === 'update_status') {
          task.status = status || 'In Review';
          task.timer_status = 'Stopped';
          if (submissionLink) task.submission_link = submissionLink;
          task.submitted_at = action.timestamp;
          task.is_offline_pending = true;
        } else if (type === 'update_checklist' && checklists) {
          task.checklists = checklists;
          task.is_offline_pending = true;
        }

        cachedTasks[targetIdx] = task;
        this.saveTasksCache(userId, cachedTasks);
      }
    } catch (e) {
      console.warn('[OfflineQueueService] Optimistic task update failed:', e);
    }

    console.log('[OfflineQueueService] Enqueued offline task action:', action);
    return action;
  }

  async syncPendingTaskActions(userId, apiBase) {
    if (!navigator.onLine) {
      return { success: false, message: 'ডিভাইস বর্তমানে অফলাইনে রয়েছে।' };
    }

    const queue = this.getTasksQueue();
    if (queue.length === 0) {
      return { success: true, synced_count: 0 };
    }

    const userActions = userId ? queue.filter(a => a.user_id === userId) : queue;
    if (userActions.length === 0) {
      return { success: true, synced_count: 0 };
    }

    try {
      console.log(`[OfflineQueueService] Syncing ${userActions.length} offline task action(s)...`);
      const baseUrl = apiBase.endsWith('/') ? apiBase : apiBase + '/';

      const res = await axios.post(`${baseUrl}api/tasks/sync_offline_tasks.php`, {
        user_id: userId || userActions[0].user_id,
        actions: userActions
      }, { timeout: 15000 });

      if (res.data?.status === 'success') {
        const syncedIds = (res.data.synced || []).map(s => s.action_id).filter(Boolean);
        const remaining = queue.filter(a => !syncedIds.includes(a.id) && !userActions.some(ua => ua.id === a.id));
        this.saveTasksQueue(remaining);

        // Clear offline pending flags in cache
        try {
          const cached = this.getTasksCache(userId);
          cached.forEach(t => { t.is_offline_pending = false; });
          this.saveTasksCache(userId, cached);
        } catch (e) {}

        console.log(`[OfflineQueueService] Successfully synced ${res.data.synced_count || userActions.length} task action(s).`);
        return {
          success: true,
          synced_count: res.data.synced_count || userActions.length,
          data: res.data
        };
      } else {
        return {
          success: false,
          message: res.data?.message || 'Server failed to sync task actions.'
        };
      }
    } catch (err) {
      console.warn('[OfflineQueueService] Task action sync failed:', err.message);
      return { success: false, message: err.message };
    }
  }

  // ── Offline Idle Incidents Queue ──────────────────────────────────────────
  getIdleQueue() {
    try {
      const data = localStorage.getItem(IDLE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveIdleQueue(queue) {
    try {
      localStorage.setItem(IDLE_QUEUE_KEY, JSON.stringify(queue || []));
    } catch (e) {
      console.error('[OfflineQueueService] Error saving idle queue:', e);
    }
  }

  getPendingIdleCount(userId) {
    const queue = this.getIdleQueue();
    if (!userId) return queue.length;
    return queue.filter(item => item.user_id === userId).length;
  }

  enqueueIdleAlert({ userId, startedAt, resumedAt, idleSeconds, activeProcess, activeWindowTitle }) {
    if (!userId) return { success: false, message: 'Missing userId' };
    const queue = this.getIdleQueue();

    const alertItem = {
      id: `idle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: userId,
      started_at: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
      resumed_at: resumedAt ? new Date(resumedAt).toISOString() : new Date().toISOString(),
      idle_seconds: Math.max(300, Number(idleSeconds) || 300),
      active_process: activeProcess || '',
      active_window_title: activeWindowTitle || '',
      queued_at: new Date().toISOString()
    };

    queue.push(alertItem);
    this.saveIdleQueue(queue);

    // Update local cached summary immediately so UI updates without server
    try {
      const summary = this.getLocalIdleSummary(userId);
      const incMinutes = Math.max(5, Math.round(alertItem.idle_seconds / 60));
      const updatedSummary = {
        incidents: (summary.incidents || 0) + 1,
        totalMinutes: (summary.totalMinutes || 0) + incMinutes,
        alerts: [
          {
            id: alertItem.id,
            user_id: userId,
            idle_seconds: alertItem.idle_seconds,
            active_process: alertItem.active_process,
            active_window_title: alertItem.active_window_title,
            status: 'resumed',
            started_at: alertItem.started_at,
            resumed_at: alertItem.resumed_at,
            is_offline_pending: true
          },
          ...(summary.alerts || [])
        ]
      };
      this.saveLocalIdleSummary(userId, updatedSummary);
    } catch (e) {
      console.warn('[OfflineQueueService] Failed to update local idle summary cache:', e);
    }

    console.log(`[OfflineQueueService] Enqueued offline idle alert (${alertItem.idle_seconds}s). Total in queue: ${queue.length}`);
    return { success: true, alert: alertItem, totalQueued: queue.length };
  }

  getLocalIdleSummary(userId) {
    if (!userId) return { incidents: 0, totalMinutes: 0, alerts: [] };
    try {
      const data = localStorage.getItem(`${IDLE_SUMMARY_PREFIX}${userId}`);
      return data ? JSON.parse(data) : { incidents: 0, totalMinutes: 0, alerts: [] };
    } catch (e) {
      return { incidents: 0, totalMinutes: 0, alerts: [] };
    }
  }

  saveLocalIdleSummary(userId, summary) {
    if (!userId) return;
    try {
      localStorage.setItem(`${IDLE_SUMMARY_PREFIX}${userId}`, JSON.stringify(summary || { incidents: 0, totalMinutes: 0, alerts: [] }));
    } catch (e) {}
  }

  async syncPendingIdle(userId, apiBase = '') {
    if (!navigator.onLine) {
      return { success: false, message: 'Offline' };
    }

    const queue = this.getIdleQueue();
    const userAlerts = userId ? queue.filter(a => a.user_id === userId) : queue;
    if (userAlerts.length === 0) {
      return { success: true, synced_count: 0 };
    }

    try {
      console.log(`[OfflineQueueService] Syncing ${userAlerts.length} offline idle alert(s)...`);
      const baseUrl = (apiBase || '').endsWith('/') ? apiBase : (apiBase ? apiBase + '/' : '');

      const res = await axios.post(`${baseUrl}api/attendance/sync_offline_idle.php`, {
        user_id: userId || userAlerts[0].user_id,
        alerts: userAlerts
      }, { timeout: 15000 });

      if (res.data?.status === 'success') {
        const remaining = queue.filter(a => !userAlerts.some(ua => ua.id === a.id));
        this.saveIdleQueue(remaining);

        // Update offline pending flag in local idle summary
        try {
          const summary = this.getLocalIdleSummary(userId);
          if (summary.alerts) {
            summary.alerts.forEach(al => { al.is_offline_pending = false; });
            this.saveLocalIdleSummary(userId, summary);
          }
        } catch (e) {}

        console.log(`[OfflineQueueService] Successfully synced ${res.data.synced_count || userAlerts.length} idle alert(s).`);
        return {
          success: true,
          synced_count: res.data.synced_count || userAlerts.length,
          data: res.data
        };
      } else {
        return {
          success: false,
          message: res.data?.message || 'Server failed to sync idle alerts.'
        };
      }
    } catch (err) {
      console.warn('[OfflineQueueService] Idle alert sync failed:', err.message);
      return { success: false, message: err.message };
    }
  }
}

const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;
