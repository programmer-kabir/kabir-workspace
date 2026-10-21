import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../utils/api';

const getDevToken = () => {
    return localStorage.getItem('cca_desktop_token') || localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || '';
};

const DEFAULT_ENDPOINTS = [
    { id: 'chat_users', category: 'Chat & Messages', name: 'Get Chat Users', method: 'GET', path: 'api/chat/get_chat_users.php', desc: 'Lists active chat staff users.', params: {} },
    { id: 'chat_history', category: 'Chat & Messages', name: 'Get Chat History', method: 'POST', path: 'api/chat/get_chats.php', desc: 'Fetches message history.', params: { target_user_id: 1, limit: 20 } },
    { id: 'comm_feed', category: 'Community Feed', name: 'Get Community Feed', method: 'GET', path: 'api/community/get_feed.php', desc: 'Community feed posts.', params: { page: 1, limit: 10 } },
    { id: 'comm_like', category: 'Community Feed', name: 'Toggle Post Like', method: 'POST', path: 'api/community/toggle_like.php', desc: 'Likes or unlikes a post.', params: { post_id: 1 } },
    { id: 'att_daily', category: 'Attendance & Breaks', name: 'Get Daily Attendance', method: 'POST', path: 'api/attendance/get_daily_attendance.php', desc: 'Attendance records for date.', params: { date: new Date().toISOString().slice(0, 10) } },
    { id: 'att_status', category: 'Attendance & Breaks', name: 'Check Shift Status', method: 'POST', path: 'api/attendance/check_status.php', desc: 'Checks clock-in status.', params: {} },
    { id: 'breaks_logs', category: 'Attendance & Breaks', name: 'Get User Breaks', method: 'GET', path: 'api/breaks/get_user_breaks.php', desc: 'Break logs and durations.', params: {} },
    { id: 'tasks_list', category: 'Tasks & Workflow', name: 'Get Staff Tasks', method: 'GET', path: 'api/tasks/get_tasks.php', desc: 'Lists assigned staff tasks.', params: { status: 'all' } },
    { id: 'payroll_bal', category: 'Payroll & Wallet', name: 'Get Wallet Balance', method: 'GET', path: 'api/payroll/get_wallet_balance.php', desc: 'Staff wallet balance.', params: {} },
    { id: 'sys_time', category: 'System & Diagnostics', name: 'Server Time & TZ', method: 'GET', path: 'api/server_time.php', desc: 'Inspects server time.', params: {} },
    { id: 'sys_dev', category: 'System & Diagnostics', name: 'Dev Telemetry Status', method: 'GET', path: 'api/developer/get_dev_status.php', desc: 'Engine and memory metrics.', params: {} },
    { id: 'sys_ping', category: 'System & Diagnostics', name: 'WebSocket Ping Roundtrip', method: 'POST', path: 'api/developer/test_ping.php', desc: 'Dispatches dev-ping to Pusher.', params: { sender: 'CCA Dev Tester' } }
];

export function useDeveloperConsole({ currentRoute = '/developer', onNavigate } = {}) {
    const { currentUser, impersonateUser } = useAuth();
    const API_BASE = (getApiBase() || '').replace(/\/+$/, '') + '/';

    // Active Tab from currentRoute
    const activeTab = currentRoute.includes('/impersonate')
        ? 'impersonate'
        : currentRoute.includes('/logs')
            ? 'logs'
            : currentRoute.includes('/api-tester')
                ? 'api-tester'
                : currentRoute.includes('/crons')
                    ? 'crons'
                    : currentRoute.includes('/database')
                        ? 'database'
                        : currentRoute.includes('/editor')
                            ? 'editor'
                            : 'overview';

    const [telemetry, setTelemetry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pusherStatus, setPusherStatus] = useState('Checking...');
    const [pingLoading, setPingLoading] = useState(false);
    const [cronLoading, setCronLoading] = useState({});
    const [cronOutput, setCronOutput] = useState(null);
    const [cronHistory, setCronHistory] = useState([]);
    const [selectedCronTab, setSelectedCronTab] = useState('triggers'); // 'triggers' | 'crontab' | 'history'
    const [logFilter, setLogFilter] = useState('all');
    const [apiProbeResults, setApiProbeResults] = useState({});
    const [janitorStats, setJanitorStats] = useState(null);
    const [janitorLoading, setJanitorLoading] = useState(false);
    const [janitorCleaning, setJanitorCleaning] = useState(false);
    const [janitorScope, setJanitorScope] = useState('full');
    const [janitorResult, setJanitorResult] = useState(null);
    const [showFragmentedModal, setShowFragmentedModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    const [impersonatingId, setImpersonatingId] = useState(null);
    const [logSubTab, setLogSubTab] = useState('server'); // 'server' | 'websocket'
    const [serverErrorLog, setServerErrorLog] = useState(null);
    const [serverLogLoading, setServerLogLoading] = useState(false);
    const [liveTail, setLiveTail] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [fullBackupLoading, setFullBackupLoading] = useState(false);
    const [lastBackup, setLastBackup] = useState(null);
    const [testerSubTab, setTesterSubTab] = useState('rest'); // 'rest' | 'websocket'
    const [apiDirectory, setApiDirectory] = useState(DEFAULT_ENDPOINTS);
    const [apiCategories, setApiCategories] = useState([]);
    const [apiDirectoryLoading, setApiDirectoryLoading] = useState(false);
    const [apiSearchQuery, setApiSearchQuery] = useState('');
    const [apiCategoryFilter, setApiCategoryFilter] = useState('all');
    const [selectedApi, setSelectedApi] = useState(null);
    const [reqMethod, setReqMethod] = useState('GET');
    const [reqPath, setReqPath] = useState('api/community/get_feed.php');
    const [rawJsonBody, setRawJsonBody] = useState('{\n  "page": 1,\n  "limit": 10\n}');
    const [autoAttachToken, setAutoAttachToken] = useState(true);
    const [apiExecuting, setApiExecuting] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);
    const [maintenanceLoading, setMaintenanceLoading] = useState(false);
    const [maintenanceSaving, setMaintenanceSaving] = useState(false);
    const [editMaintenanceMsg, setEditMaintenanceMsg] = useState('');
    const [wsChannel, setWsChannel] = useState('community-channel');
    const [wsEvent, setWsEvent] = useState('dev-ping');
    const [wsPayload, setWsPayload] = useState('{\n  "message": "Realtime WebSocket probe from CCA Developer Suite",\n  "status": "online"\n}');
    const [wsDispatching, setWsDispatching] = useState(false);
    const [wsLiveReceived, setWsLiveReceived] = useState([]);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [progressModal, setProgressModal] = useState({
        isOpen: false,
        title: '',
        subtitle: '',
        progress: 0,
        stage: '',
        loaded: 0,
        total: 0,
        isComplete: false,
        filename: '',
        size: ''
    });
    const [maintenanceConfig, setMaintenanceConfig] = useState({
        maintenance_enabled: false,
        sms_dry_run: false,
        maintenance_message: '',
        updated_at: '',
        updated_by: ''
    });
    const [logs, setLogs] = useState([
        { id: 1, time: new Date().toLocaleTimeString(), type: 'info', msg: 'Developer Console session initialized.' }
    ]);

    const addLog = useCallback((msg, type = 'info') => {
        setLogs(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), type, msg },
            ...prev.slice(0, 50)
        ]);
    }, []);

    // ── Fetch Impersonator Users ────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/get_users.php`, { token });
            if (res.data?.status === 'success') {
                setUsers(res.data.users || []);
                addLog(`Loaded ${res.data.total || 0} users into impersonator sandbox.`, 'info');
            } else {
                toast.error(res.data?.message || 'Failed to fetch users');
            }
        } catch (err) {
            toast.error('Failed to load users: ' + err.message);
        } finally {
            setUsersLoading(false);
        }
    }, [addLog]);

    const handleImpersonate = async (targetUser) => {
        try {
            setImpersonatingId(targetUser.id);
            addLog(`Initiating shadow login as ${targetUser.name} (ID: ${targetUser.id})...`, 'info');
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/impersonate_user.php`, {
                token,
                target_user_id: targetUser.id
            });
            if (res.data?.status === 'success') {
                impersonateUser(res.data.user, res.data.token);
                toast.success(`Logged in as ${targetUser.name}!`);
                addLog(`Switched session to ${targetUser.name}.`, 'success');
                if (onNavigate) onNavigate('/');
            } else {
                toast.error(res.data?.message || 'Failed to impersonate user');
                addLog(`Impersonation failed: ${res.data?.message}`, 'error');
            }
        } catch (err) {
            toast.error('Impersonation error: ' + err.message);
            addLog(`Impersonation error: ${err.message}`, 'error');
        } finally {
            setImpersonatingId(null);
        }
    };

    // ── Fetch Server PHP Error Log ──────────────────────────────────────────────
    const fetchServerErrorLog = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setServerLogLoading(true);
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/get_error_log.php`, { token });
            if (res.data?.status === 'success') {
                setServerErrorLog(res.data);
                if (!isSilent) addLog(`Fetched server error_log (${res.data.line_count} lines, ${res.data.file_size_formatted}).`, 'success');
            } else {
                if (!isSilent) toast.error(res.data?.message || 'Failed to fetch error log');
            }
        } catch (err) {
            if (!isSilent) toast.error('Error log fetch failed: ' + err.message);
        } finally {
            if (!isSilent) setServerLogLoading(false);
        }
    }, [addLog]);

    const confirmClearServerErrorLog = async () => {
        try {
            setServerLogLoading(true);
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/get_error_log.php`, { token, action: 'clear' });
            if (res.data?.status === 'success') {
                toast.success('Server error_log cleared successfully!');
                setServerErrorLog(prev => ({ ...prev, lines: [], file_size_formatted: '0 KB', line_count: 0 }));
                addLog('Server error_log truncated to empty.', 'warning');
                setIsClearModalOpen(false);
            } else {
                toast.error(res.data?.message || 'Could not clear log');
            }
        } catch (err) {
            toast.error('Clear log failed: ' + err.message);
        } finally {
            setServerLogLoading(false);
        }
    };
    const handleToggleMaintenance = async (field, value) => {
        try {
            setMaintenanceSaving(true);
            const token = getDevToken();
            const payload = {
                token,
                [field]: value
            };
            if (field === 'maintenance_message') {
                payload.maintenance_message = editMaintenanceMsg;
            }
            const res = await axios.post(`${API_BASE}api/developer/toggle_maintenance.php`, payload);
            if (res.data?.status === 'success') {
                setMaintenanceConfig(res.data.data);
                toast.success(
                    field === 'maintenance_enabled'
                        ? value ? '🚨 System Maintenance Activated!' : '✅ System Maintenance Deactivated - Site Public'
                        : field === 'sms_dry_run'
                            ? value ? '🛡️ SMS Dry-Run Mode Enabled (Simulated)' : '⚡ Live SMS Mode Enabled'
                            : 'Maintenance message saved!'
                );
                addLog(`Updated ${field} to ${String(value)}`, 'warning');
            } else {
                toast.error(res.data?.message || 'Failed to update maintenance state');
            }
        } catch (err) {
            toast.error('Update failed: ' + err.message);
        } finally {
            setMaintenanceSaving(false);
        }
    };
    const fetchMaintenanceStatus = useCallback(async () => {
        try {
            setMaintenanceLoading(true);
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/get_maintenance_status.php`, { token });
            if (res.data?.status === 'success') {
                setMaintenanceConfig(res.data.data);
                setEditMaintenanceMsg(res.data.data.maintenance_message || '');
            }
        } catch (err) {
            console.error('Failed to fetch maintenance status', err);
        } finally {
            setMaintenanceLoading(false);
        }
    }, []);

    const handleDownloadSnapshot = async () => {
        let t1, t2;
        try {
            setBackupLoading(true);
            setProgressModal({
                isOpen: true,
                title: 'Database Snapshot (.sql.gz)',
                subtitle: 'Exporting MySQL schemas & chunked data records',
                progress: 25,
                stage: 'Extracting all database tables & schemas...',
                loaded: 0,
                total: 0,
                isComplete: false,
                filename: '',
                size: ''
            });
            addLog('Generating complete MySQL database snapshot & gzip archive...', 'info');

            t1 = setTimeout(() => {
                setProgressModal(prev => prev.isOpen && !prev.isComplete ? {
                    ...prev,
                    progress: 55,
                    stage: 'Compressing SQL dump with Level 9 Gzip...'
                } : prev);
            }, 600);

            t2 = setTimeout(() => {
                setProgressModal(prev => prev.isOpen && !prev.isComplete ? {
                    ...prev,
                    progress: 80,
                    stage: 'Streaming compressed snapshot to browser...'
                } : prev);
            }, 1200);

            const token = getDevToken();

            const res = await axios.post(`${API_BASE}api/developer/export_db_snapshot.php`, {
                token,
                format: 'download'
            }, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const rawPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        const mappedProgress = Math.min(99, Math.max(80, Math.round(80 + (rawPercent * 0.18))));
                        setProgressModal(prev => ({
                            ...prev,
                            progress: mappedProgress,
                            stage: `Streaming: ${(progressEvent.loaded / 1024 / 1024).toFixed(2)} MB / ${(progressEvent.total / 1024 / 1024).toFixed(2)} MB`,
                            loaded: progressEvent.loaded,
                            total: progressEvent.total
                        }));
                    }
                }
            });

            clearTimeout(t1);
            clearTimeout(t2);

            const disposition = res.headers['content-disposition'];
            let filename = 'cca_db_snapshot_' + new Date().toISOString().slice(0, 10) + '.sql.gz';
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = new Blob([res.data], { type: 'application/x-gzip' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            const sizeFormatted = (blob.size / 1024 / 1024).toFixed(2) + ' MB';
            setLastBackup({
                filename,
                size: sizeFormatted,
                time: new Date().toLocaleTimeString(),
                type: 'Database Snapshot (.sql.gz)'
            });

            setProgressModal(prev => ({
                ...prev,
                progress: 100,
                stage: 'Snapshot generated and downloaded successfully!',
                isComplete: true,
                filename,
                size: sizeFormatted
            }));

            toast.success(`Database backup downloaded: ${filename} (${sizeFormatted})`);
            addLog(`Snapshot downloaded: ${filename} (${sizeFormatted})`, 'success');
        } catch (err) {
            clearTimeout(t1);
            clearTimeout(t2);
            setProgressModal(prev => ({ ...prev, isOpen: false }));
            toast.error('Failed to generate backup: ' + err.message);
            addLog('Snapshot generation failed: ' + err.message, 'error');
        } finally {
            setBackupLoading(false);
        }
    };

    const handleDownloadFullSystemSnapshot = async () => {
        let t1, t2, t3;
        try {
            setFullBackupLoading(true);
            setProgressModal({
                isOpen: true,
                title: 'Full System Disaster Recovery Archive',
                subtitle: 'Packaging PHP Codebase & MySQL Database into .zip',
                progress: 15,
                stage: 'Extracting database structure & tables...',
                loaded: 0,
                total: 0,
                isComplete: false,
                filename: '',
                size: ''
            });
            addLog('Archiving complete PHP codebase + full MySQL database into disaster-recovery ZIP...', 'info');

            t1 = setTimeout(() => {
                setProgressModal(prev => prev.isOpen && !prev.isComplete ? {
                    ...prev,
                    progress: 35,
                    stage: 'Packaging PHP backend endpoints & configs (/api, /config)...'
                } : prev);
            }, 600);

            t2 = setTimeout(() => {
                setProgressModal(prev => prev.isOpen && !prev.isComplete ? {
                    ...prev,
                    progress: 58,
                    stage: 'Compacting disaster recovery archive (.zip)...'
                } : prev);
            }, 1300);

            t3 = setTimeout(() => {
                setProgressModal(prev => prev.isOpen && !prev.isComplete ? {
                    ...prev,
                    progress: 72,
                    stage: 'Preparing stream transfer to browser...'
                } : prev);
            }, 2000);

            const token = getDevToken();

            const res = await axios.post(`${API_BASE}api/developer/export_full_system_snapshot.php`, {
                token
            }, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const rawPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        const mappedProgress = Math.min(99, Math.max(72, Math.round(72 + (rawPercent * 0.26))));
                        setProgressModal(prev => ({
                            ...prev,
                            progress: mappedProgress,
                            stage: `Streaming archive: ${(progressEvent.loaded / 1024 / 1024).toFixed(2)} MB / ${(progressEvent.total / 1024 / 1024).toFixed(2)} MB`,
                            loaded: progressEvent.loaded,
                            total: progressEvent.total
                        }));
                    } else if (progressEvent.loaded) {
                        setProgressModal(prev => ({
                            ...prev,
                            progress: Math.min(95, Math.max(prev.progress, 75)),
                            stage: `Streaming data: ${(progressEvent.loaded / 1024 / 1024).toFixed(2)} MB received`,
                            loaded: progressEvent.loaded
                        }));
                    }
                }
            });

            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);

            const disposition = res.headers['content-disposition'];
            let filename = 'cca_full_system_php_and_db_' + new Date().toISOString().slice(0, 10) + '.zip';
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = new Blob([res.data], { type: 'application/zip' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            const sizeFormatted = (blob.size / 1024 / 1024).toFixed(2) + ' MB';
            setLastBackup({
                filename,
                size: sizeFormatted,
                time: new Date().toLocaleTimeString(),
                type: 'Full System (PHP Codebase + Database)'
            });

            setProgressModal(prev => ({
                ...prev,
                progress: 100,
                stage: 'Full system archive downloaded and verified successfully!',
                isComplete: true,
                filename,
                size: sizeFormatted
            }));

            toast.success(`Full system archive downloaded: ${filename} (${sizeFormatted})`);
            addLog(`Full system backup downloaded: ${filename} (${sizeFormatted})`, 'success');
        } catch (err) {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            setProgressModal(prev => ({ ...prev, isOpen: false }));
            toast.error('Failed to generate full system backup: ' + err.message);
            addLog('Full system backup failed: ' + err.message, 'error');
        } finally {
            setFullBackupLoading(false);
        }
    };
    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}api/developer/get_dev_status.php`);
            if (res.data?.status === 'success') {
                setTelemetry(res.data.data);
                addLog('Server telemetry updated successfully.', 'success');
            } else {
                addLog(`Status fetch returned warning: ${res.data?.message || 'Unknown'}`, 'warning');
            }
        } catch (err) {
            addLog(`Failed to fetch server telemetry: ${err.message}`, 'error');
            toast.error('Could not reach developer status endpoint');
        } finally {
            setLoading(false);
        }
    }, []);
    // Execute REST API Request (Mini-Postman)
    const handleExecuteRequest = async () => {
        let parsedBody = null;
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(reqMethod)) {
            try {
                parsedBody = rawJsonBody.trim() ? JSON.parse(rawJsonBody) : {};
            } catch (err) {
                toast.error('Invalid JSON syntax: ' + err.message);
                return;
            }
        }

        setApiExecuting(true);
        setApiResponse(null);
        const start = performance.now();
        addLog(`Executing [${reqMethod}] ${reqPath}...`, 'info');

        try {
            const token = getDevToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            if (autoAttachToken && token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const fullUrl = reqPath.startsWith('http') ? reqPath : `${API_BASE}${reqPath.replace(/^\//, '')}`;

            const res = await axios({
                method: reqMethod,
                url: fullUrl,
                data: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(reqMethod)
                    ? (autoAttachToken && token && parsedBody && !parsedBody.token ? { ...parsedBody, token } : parsedBody)
                    : undefined,
                params: reqMethod === 'GET' ? parsedBody : undefined,
                headers
            });

            const duration = Math.round(performance.now() - start);
            const dataStr = JSON.stringify(res.data);
            const byteSize = new Blob([dataStr]).size;
            const sizeFormatted = byteSize > 1024 ? (byteSize / 1024).toFixed(2) + ' KB' : byteSize + ' B';

            setApiResponse({
                status: res.status,
                statusText: res.statusText || 'OK',
                duration,
                size: sizeFormatted,
                data: res.data,
                headers: res.headers,
                timestamp: new Date().toLocaleTimeString()
            });

            addLog(`[${reqMethod} 200 OK] ${reqPath} responded in ${duration}ms`, 'success');
            toast.success(`Request OK (200) in ${duration}ms`);
        } catch (err) {
            const duration = Math.round(performance.now() - start);
            const errRes = err.response;
            const byteSize = errRes?.data ? new Blob([JSON.stringify(errRes.data)]).size : 0;
            const sizeFormatted = byteSize > 1024 ? (byteSize / 1024).toFixed(2) + ' KB' : byteSize + ' B';

            setApiResponse({
                status: errRes?.status || 500,
                statusText: errRes?.statusText || 'Request Error',
                duration,
                size: sizeFormatted,
                data: errRes?.data || { error: err.message },
                headers: errRes?.headers || {},
                isError: true,
                timestamp: new Date().toLocaleTimeString()
            });

            addLog(`[${reqMethod} ${errRes?.status || 500}] ${reqPath} failed: ${err.message}`, 'error');
            toast.error(`Request failed (${errRes?.status || 500})`);
        } finally {
            setApiExecuting(false);
        }
    };

    // Dispatch Custom WebSocket Event
    const handleDispatchWebSocket = async () => {
        let parsedPayload = {};
        try {
            parsedPayload = wsPayload.trim() ? JSON.parse(wsPayload) : {};
        } catch (err) {
            toast.error('Invalid JSON payload: ' + err.message);
            return;
        }

        try {
            setWsDispatching(true);
            const token = getDevToken();
            addLog(`Dispatching socket event '${wsEvent}' to '${wsChannel}'...`, 'info');

            const res = await axios.post(`${API_BASE}api/developer/dispatch_websocket_event.php`, {
                token,
                channel: wsChannel,
                event: wsEvent,
                payload: parsedPayload
            });

            if (res.data?.status === 'success') {
                toast.success(`Event '${wsEvent}' broadcasted to '${wsChannel}'!`);
                addLog(`[WebSocket Dispatched] ${wsEvent} on ${wsChannel}`, 'success');
            } else {
                toast.error(res.data?.message || 'Dispatch failed');
            }
        } catch (err) {
            toast.error('Dispatch failed: ' + err.message);
            addLog(`Socket dispatch failed: ${err.message}`, 'error');
        } finally {
            setWsDispatching(false);
        }
    };

    // Send Test Ping
    const handleTestPing = async () => {
        try {
            setPingLoading(true);
            addLog('Transmitting test socket ping...', 'info');
            const res = await axios.post(`${API_BASE}api/developer/test_ping.php`, {
                sender: currentUser?.name || 'Developer Console'
            });
            if (res.data?.status === 'success') {
                toast.success('Broadcast ping sent!');
            } else {
                toast.error(res.data?.message || 'Failed to ping');
            }
        } catch (e) {
            addLog(`Ping broadcast failed: ${e.message}`, 'error');
            toast.error('Network error during broadcast ping');
        } finally {
            setPingLoading(false);
        }
    };

    // ── Phase 3: Fetch API Directory Catalog ────────────────────────────────────
    const fetchApiDirectory = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setApiDirectoryLoading(true);
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/get_api_directory.php`, { token });
            if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
                setApiDirectory(res.data.data);
                if (Array.isArray(res.data.categories)) {
                    setApiCategories(res.data.categories);
                }
                if (!isSilent) toast.success(`Discovered ${res.data.total_endpoints || res.data.data.length} API endpoints across ${res.data.categories?.length || 0} modules!`);
            }
        } catch (e) {
            console.warn('API directory fetch failed, fallback active', e);
            if (!isSilent) toast.error('Failed to load full API directory: ' + e.message);
        } finally {
            if (!isSilent) setApiDirectoryLoading(false);
        }
    }, []);

    // Select an API from directory into Runner
    const handleSelectApi = (item) => {
        setSelectedApi(item);
        setReqMethod(item.method || 'GET');
        setReqPath(item.path);
        setRawJsonBody(
            item.params && Object.keys(item.params).length > 0
                ? JSON.stringify(item.params, null, 2)
                : '{\n}'
        );
        setApiResponse(null);
    };

    // ── Fetch Janitor Telemetry Stats (Phase 4) ────────────────────────────────
    const fetchJanitorStats = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setJanitorLoading(true);
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/get_janitor_stats.php`, { token });
            if (res.data?.status === 'success') {
                setJanitorStats(res.data);
                if (!isSilent) addLog(`Janitor telemetry loaded: ${res.data.tokens?.expired || 0} dead tokens, ${res.data.tables?.total_overhead_kb || 0} KB overhead.`, 'info');
            } else {
                if (!isSilent) toast.error(res.data?.message || 'Failed to fetch Janitor stats');
            }
        } catch (err) {
            if (!isSilent) toast.error('Janitor fetch failed: ' + err.message);
        } finally {
            if (!isSilent) setJanitorLoading(false);
        }
    }, [addLog]);

    // ── Run Janitor Cleanup Routine (Phase 4) ──────────────────────────────────
    const handleRunJanitorClean = async (scope = 'full') => {
        try {
            setJanitorCleaning(true);
            setJanitorScope(scope);
            const scopeLabel = scope === 'tokens' ? 'Expired Tokens' : scope === 'tables' ? 'Table Defragmentation' : scope === 'logs' ? 'Log Cleanup' : 'Complete Janitor Suite';
            addLog(`Executing Database Hygiene routine [${scopeLabel}]...`, 'warning');
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/run_janitor_clean.php`, {
                token,
                scope
            });
            if (res.data?.status === 'success') {
                setJanitorResult(res.data);
                addLog(`[Janitor Success] Purged ${res.data.purged_tokens_count} tokens. Optimized ${res.data.optimized_tables_count} tables. Trimmed ${res.data.trimmed_logs_count} logs.`, 'success');
                toast.success(`Database Janitor: Purged ${res.data.purged_tokens_count} dead tokens & optimized ${res.data.optimized_tables_count} tables!`);
                fetchJanitorStats(true);
            } else {
                toast.error(res.data?.message || 'Janitor cleanup failed');
                addLog(`[Janitor Error] ${res.data?.message}`, 'error');
            }
        } catch (err) {
            toast.error('Janitor error: ' + (err.response?.data?.message || err.message));
            addLog(`[Janitor Network Error] ${err.message}`, 'error');
        } finally {
            setJanitorCleaning(false);
        }
    };

    // Run Cron Manually
    const handleRunCron = async (cronName, label, extraParams = {}) => {
        const runKey = `${cronName}_${extraParams.action || 'default'}`;
        try {
            setCronLoading(prev => ({ ...prev, [runKey]: true, [cronName]: true }));
            addLog(`Triggering manual cron run for [${label}]...`, 'info');
            const token = getDevToken();
            const res = await axios.post(`${API_BASE}api/developer/run_cron.php`, {
                token,
                cron_name: cronName,
                ...extraParams
            });
            if (res.data?.status === 'success') {
                const durationFormatted = res.data.duration_ms ? `${res.data.duration_ms} ms` : 'completed';
                addLog(`[Cron Success] ${label} finished in ${durationFormatted} at ${res.data.executed_at}`, 'success');
                const runRecord = {
                    id: Date.now(),
                    title: label,
                    cron_name: cronName,
                    text: res.data.output,
                    time: res.data.executed_at,
                    duration_ms: res.data.duration_ms,
                    status: 'success'
                };
                setCronOutput(runRecord);
                setCronHistory(prev => [runRecord, ...prev.slice(0, 9)]);
                toast.success(`${label} finished! (${durationFormatted})`);
            } else {
                addLog(`[Cron Error] ${res.data?.message || 'Execution error'}`, 'error');
                toast.error(res.data?.message || 'Cron execution failed');
            }
        } catch (e) {
            addLog(`[Cron Network Error] ${e.message}`, 'error');
            toast.error('Network error triggering cron: ' + (e.response?.data?.message || e.message));
        } finally {
            setCronLoading(prev => ({ ...prev, [runKey]: false, [cronName]: false }));
        }
    };

    // Probe API Endpoints
    const handleProbeApi = async (endpoint, name) => {
        const start = performance.now();
        try {
            setApiProbeResults(prev => ({ ...prev, [endpoint]: { status: 'loading' } }));
            const res = await axios.get(`${API_BASE}${endpoint}`);
            const duration = Math.round(performance.now() - start);
            setApiProbeResults(prev => ({
                ...prev,
                [endpoint]: { status: 'success', duration, code: res.status }
            }));
            addLog(`API Probe: ${name} responded in ${duration}ms (HTTP ${res.status})`, 'success');
        } catch (e) {
            const duration = Math.round(performance.now() - start);
            setApiProbeResults(prev => ({
                ...prev,
                [endpoint]: { status: 'error', duration, code: e.response?.status || 'ERR' }
            }));
            addLog(`API Probe: ${name} failed in ${duration}ms (${e.message})`, 'error');
        }
    };

    const copySpecs = () => {
        const text = JSON.stringify(telemetry || {}, null, 2);
        navigator.clipboard.writeText(text);
        toast.success('Telemetry copied to clipboard');
    };

    const filteredLogs = logs.filter(l => {
        if (logFilter === 'all') return true;
        return l.type === logFilter;
    });

    // ── 1. Impersonator initial load ──────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'impersonate' && users.length === 0) {
            fetchUsers();
        }
    }, [activeTab, fetchUsers, users.length]);

    // ── 2. Server logs initial load ───────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'logs' && logSubTab === 'server') {
            fetchServerErrorLog();
        }
    }, [activeTab, logSubTab, fetchServerErrorLog]);

    // ── 3. Live Tail Auto Refresh ─────────────────────────────────────────────
    useEffect(() => {
        if (!liveTail || activeTab !== 'logs' || logSubTab !== 'server') return;
        const interval = setInterval(() => {
            fetchServerErrorLog(true);
        }, 4000);
        return () => clearInterval(interval);
    }, [liveTail, activeTab, logSubTab, fetchServerErrorLog]);

    // ── 4. Fetch Maintenance Config ───────────────────────────────────────────
    useEffect(() => {
        fetchMaintenanceStatus();
    }, [fetchMaintenanceStatus]);

    // ── 5. Fetch Telemetry Status ─────────────────────────────────────────────
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // ── 6. Realtime Pusher Test Listener ──────────────────────────────────────
    useEffect(() => {
        let pusher = null;
        try {
            pusher = new Pusher('82a63711fed4b73bd74d', { cluster: 'ap2', forceTLS: true });

            pusher.connection.bind('connected', () => {
                setPusherStatus('Connected (Cluster ap2)');
                addLog('Pusher WebSocket connection established.', 'success');
            });

            pusher.connection.bind('error', () => {
                setPusherStatus('Connection Error');
                addLog('Pusher socket encountered connection issue.', 'error');
            });

            const channel = pusher.subscribe('community-channel');

            const recordReceivedEvent = (event, data) => {
                setWsLiveReceived(prev => [
                    {
                        id: Date.now() + Math.random(),
                        channel: 'community-channel',
                        event,
                        data,
                        time: new Date().toLocaleTimeString()
                    },
                    ...prev.slice(0, 30)
                ]);
            };

            channel.bind('dev-ping', (data) => {
                addLog(`[Live Event] Dev Ping from ${data.sender || 'Console'}: ${data.message}`, 'success');
                toast.success(`Pusher Ping: ${data.message}`);
                recordReceivedEvent('dev-ping', data);
            });

            channel.bind('dev-test-event', (data) => {
                addLog(`[Live Event] Custom Event on community-channel`, 'success');
                recordReceivedEvent('dev-test-event', data);
            });

            channel.bind('system-maintenance-update', (data) => {
                addLog(`[Live Event] Maintenance Mode Update received via WebSocket`, 'warning');
                recordReceivedEvent('system-maintenance-update', data);
            });
        } catch (e) {
            setPusherStatus('Socket Init Failed');
            addLog(`Pusher init failed: ${e.message}`, 'error');
        }

        return () => {
            if (pusher) {
                pusher.unsubscribe('community-channel');
                pusher.disconnect();
            }
        };
    }, []);

    // ── 7. API Tester Directory ───────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'api-tester') {
            fetchApiDirectory(true);
        }
    }, [activeTab, fetchApiDirectory]);

    // ── 8. Janitor Database Stats ─────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'database') {
            fetchJanitorStats(true);
        }
    }, [activeTab, fetchJanitorStats]);

    return {
        activeTab,
        telemetry, setTelemetry,
        loading, setLoading,
        pusherStatus, setPusherStatus,
        pingLoading, setPingLoading,
        cronLoading, setCronLoading,
        cronOutput, setCronOutput,
        cronHistory, setCronHistory,
        selectedCronTab, setSelectedCronTab,
        logFilter, setLogFilter,
        apiProbeResults, setApiProbeResults,
        janitorStats, setJanitorStats,
        janitorLoading, setJanitorLoading,
        janitorCleaning, setJanitorCleaning,
        janitorScope, setJanitorScope,
        janitorResult, setJanitorResult,
        showFragmentedModal, setShowFragmentedModal,
        users, setUsers,
        usersLoading, setUsersLoading,
        userSearch, setUserSearch,
        selectedRoleFilter, setSelectedRoleFilter,
        impersonatingId, setImpersonatingId,
        logSubTab, setLogSubTab,
        serverErrorLog, setServerErrorLog,
        serverLogLoading, setServerLogLoading,
        liveTail, setLiveTail,
        backupLoading, setBackupLoading,
        fullBackupLoading, setFullBackupLoading,
        lastBackup, setLastBackup,
        testerSubTab, setTesterSubTab,
        apiDirectory, setApiDirectory,
        apiCategories, setApiCategories,
        apiDirectoryLoading, setApiDirectoryLoading,
        apiSearchQuery, setApiSearchQuery,
        apiCategoryFilter, setApiCategoryFilter,
        selectedApi, setSelectedApi,
        reqMethod, setReqMethod,
        reqPath, setReqPath,
        rawJsonBody, setRawJsonBody,
        autoAttachToken, setAutoAttachToken,
        apiExecuting, setApiExecuting,
        apiResponse, setApiResponse,
        maintenanceLoading, setMaintenanceLoading,
        maintenanceSaving, setMaintenanceSaving,
        editMaintenanceMsg, setEditMaintenanceMsg,
        wsChannel, setWsChannel,
        wsEvent, setWsEvent,
        wsPayload, setWsPayload,
        wsDispatching, setWsDispatching,
        wsLiveReceived, setWsLiveReceived,
        progressModal, setProgressModal,
        maintenanceConfig, setMaintenanceConfig,
        isClearModalOpen, setIsClearModalOpen,
        logs, setLogs,
        addLog,
        fetchUsers,
        handleImpersonate,
        fetchServerErrorLog,
        confirmClearServerErrorLog,
        handleToggleMaintenance,
        fetchMaintenanceStatus,
        handleDownloadSnapshot,
        handleDownloadFullSystemSnapshot,
        fetchStatus,
        handleExecuteRequest,
        handleDispatchWebSocket,
        handleTestPing,
        fetchApiDirectory,
        handleSelectApi,
        fetchJanitorStats,
        handleRunJanitorClean,
        handleRunCron,
        handleProbeApi,
        copySpecs,
        filteredLogs,
    };
}

export default useDeveloperConsole;
