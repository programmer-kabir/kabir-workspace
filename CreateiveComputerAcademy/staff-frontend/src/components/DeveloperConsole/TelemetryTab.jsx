
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    FiDatabase, FiServer, FiZap, FiShield, FiCheckCircle, FiCopy,
    FiActivity, FiClock, FiSliders, FiAlertOctagon, FiUserCheck,
    FiUserX, FiPlus, FiX, FiUser, FiSearch, FiChevronDown, FiRefreshCw,
    FiCheck, FiUsers, FiLayers, FiEdit2, FiAlertTriangle
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function StaffSearchSelect({
    users = [],
    usersLoading = false,
    fetchUsers,
    onAddUser,
    disabled = false,
    theme = 'emerald', // 'emerald' | 'rose' | 'violet' | 'amber'
    placeholder = 'Search & select staff member...',
    actionLabel = 'Add',
    excludeIds = []
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const dropdownRef = useRef(null);

    // Auto close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtered users excluding already selected / added ones
    const availableUsers = useMemo(() => {
        return (users || []).filter(u => {
            if (excludeIds.includes(Number(u.id))) return false;

            const q = search.trim().toLowerCase();
            const matchSearch = !q ||
                u.name?.toLowerCase().includes(q) ||
                String(u.id).includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.username?.toLowerCase().includes(q) ||
                u.employee_code?.toLowerCase().includes(q) ||
                u.designation?.toLowerCase().includes(q) ||
                u.department_name?.toLowerCase().includes(q) ||
                (u.roles && u.roles.some(r => r.toLowerCase().includes(q)));

            const matchRole = roleFilter === 'all' || (u.roles && u.roles.includes(roleFilter));

            return matchSearch && matchRole;
        });
    }, [users, excludeIds, search, roleFilter]);

    const isEmerald = theme === 'emerald';
    const isViolet = theme === 'violet';
    const isAmber = theme === 'amber';

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
            case 'developer':
                return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
            case 'instructor':
                return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
            case 'reviewer':
                return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            case 'student':
                return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30';
            default:
                return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Custom Trigger Bar */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        setIsOpen(prev => !prev);
                        if (!users || users.length === 0) {
                            if (typeof fetchUsers === 'function') fetchUsers();
                        }
                    }}
                    className={`flex-1 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-left cursor-pointer shadow-xs ${isOpen
                        ? isEmerald
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : isViolet
                                ? 'border-violet-500 ring-2 ring-violet-500/20'
                                : isAmber
                                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                                    : 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-xl shrink-0 ${isEmerald
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : isViolet
                                ? 'bg-violet-500/15 text-violet-500'
                                : isAmber
                                    ? 'bg-amber-500/15 text-amber-500'
                                    : 'bg-rose-500/15 text-rose-500'
                            }`}>
                            <FiSearch className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {placeholder}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            {availableUsers.length} Staff Available
                        </span>
                        <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>
            </div>

            {/* Custom Popover Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 space-y-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Sticky Search Input */}
                    <div className="relative">
                        <FiSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type staff name, ID (#3), email, designation..."
                            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Quick Role Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                        {[
                            { id: 'all', label: `All Staff (${(users || []).length})` },
                            { id: 'staff', label: 'General Staff' },
                            { id: 'reviewer', label: 'Reviewers' },
                            { id: 'instructor', label: 'Instructors' },
                        ].map(rf => (
                            <button
                                key={rf.id}
                                type="button"
                                onClick={() => setRoleFilter(rf.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${roleFilter === rf.id
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {rf.label}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable User List */}
                    <div className="max-h-60 sm:max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {usersLoading ? (
                            <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <FiRefreshCw className="w-4 h-4 animate-spin text-cyan-500" />
                                <span>Loading staff roster from database...</span>
                            </div>
                        ) : availableUsers.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                                <p className="font-bold text-slate-500 dark:text-slate-400">No staff found</p>
                                <p className="text-[11px] text-slate-400">
                                    {search ? `No results matching "${search}"` : 'All available staff have already been added.'}
                                </p>
                            </div>
                        ) : (
                            availableUsers.map(u => {
                                const role = u.roles?.[0] || 'staff';
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => {
                                            onAddUser(u.id);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black uppercase text-xs shrink-0 overflow-hidden">
                                                {u.profile_picture ? (
                                                    <img
                                                        src={`${API_BASE}${u.profile_picture}`}
                                                        alt={u.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    u.name?.charAt(0) || 'U'
                                                )}
                                            </div>

                                            {/* User Details */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                                                        {u.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                                        #{u.id}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                    {u.designation ? (
                                                        <span>{u.designation} {u.department_name ? `• ${u.department_name}` : ''}</span>
                                                    ) : (
                                                        <span>{u.email || u.username}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Badges & One-Click Button */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getRoleColor(role)}`}>
                                                {role}
                                            </span>
                                            <button
                                                type="button"
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition cursor-pointer shadow-xs ${isEmerald
                                                    ? 'bg-emerald-600 hover:bg-emerald-500'
                                                    : isViolet
                                                        ? 'bg-violet-600 hover:bg-violet-500'
                                                        : isAmber
                                                            ? 'bg-amber-600 hover:bg-amber-500'
                                                            : 'bg-rose-600 hover:bg-rose-500'
                                                    }`}
                                            >
                                                + {actionLabel}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer count & Reload */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        <span>Showing {availableUsers.length} of {users.length} total staff</span>
                        {typeof fetchUsers === 'function' && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchUsers();
                                }}
                                disabled={usersLoading}
                                className="flex items-center gap-1 hover:text-cyan-400 transition cursor-pointer"
                            >
                                <FiRefreshCw className={`w-3 h-3 ${usersLoading ? 'animate-spin' : ''}`} />
                                <span>Reload Roster</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const RESTRICTABLE_MODULES = [
    { id: '/payroll', name: 'Work Wallet & Payroll', bn: 'পেরোল ও স্যালারি ওয়ালেট', icon: '💼' },
    { id: '/tasks', name: 'Tasks Management', bn: 'টাস্ক ম্যানেজমেন্ট', icon: '📋' },
    { id: '/mango-tree', name: 'Mango Break Tree', bn: 'ম্যাংগো ব্রেক ট্রি', icon: '🥭' },
    { id: '/breaks', name: 'Breaks Log & Shift', bn: 'ব্রেকস হিস্টোরি', icon: '☕' },
    { id: '/attendance', name: 'Attendance System', bn: 'হাজিরা ও শিফট', icon: '⏰' },
    { id: '/leave', name: 'Leave Applications', bn: 'ছুটির আবেদন', icon: '📅' },
    { id: '/community', name: 'Community Wall', bn: 'কমিউনিটি ওয়াল', icon: '👥' },
    { id: '/messages', name: 'Messages & Chat', bn: 'চ্যাট ও মেসেজিং', icon: '💬' },
    { id: '/credits', name: 'Credit Wallet', bn: 'ক্রেডিট ওয়ালেট', icon: '🪙' },
    { id: '/reports', name: 'Reports & Stats', bn: 'রিপোর্টস ও অ্যানালিটিক্স', icon: '📊' },
    { id: '/content-studio', name: 'Content Studio', bn: 'কনটেন্ট স্টুডিও', icon: '🎬' },
    { id: '/feed', name: 'Academy Feed', bn: 'একাডেমি ফিড', icon: '📖' },
    { id: '/desktop-app', name: 'Desktop App Download', bn: 'ডেস্কটপ অ্যাপ ডাউনলোড', icon: '💻' }
];

const TelemetryTab = ({
    telemetry,
    copySpecs,
    currentUser,
    users = [],
    usersLoading = false,
    fetchUsers,
    maintenanceConfig = {},
    handleToggleMaintenance,
    handleSetUserRouteRestriction,
    handleRemoveUserRouteRestriction,
    editMaintenanceMsg,
    setEditMaintenanceMsg,
    editUserMaintenanceMsg,
    setEditUserMaintenanceMsg,
    pusherStatus,
    maintenanceSaving
}) => {
    const [selectedRouteUserId, setSelectedRouteUserId] = useState(null);
    const [selectedModules, setSelectedModules] = useState([]);
    const [routeNoticeMsg, setRouteNoticeMsg] = useState('');

    useEffect(() => {
        if ((!users || users.length === 0) && typeof fetchUsers === 'function') {
            fetchUsers();
        }
    }, [users, fetchUsers]);

    const handleAddAllowedUser = (idToAdd) => {
        const id = Number(idToAdd);
        if (!id) return;
        const current = (maintenanceConfig.allowed_user_ids || []).map(Number);
        if (!current.includes(id)) {
            handleToggleMaintenance('allowed_user_ids', [...current, id]);
        }
    };

    const handleRemoveAllowedUser = (idToRemove) => {
        const current = (maintenanceConfig.allowed_user_ids || []).map(Number);
        handleToggleMaintenance('allowed_user_ids', current.filter(id => id !== Number(idToRemove)));
    };

    const handleAddBlockedUser = (idToAdd) => {
        const id = Number(idToAdd);
        if (!id) return;
        const current = (maintenanceConfig.blocked_user_ids || []).map(Number);
        if (!current.includes(id)) {
            handleToggleMaintenance('blocked_user_ids', [...current, id]);
        }
    };

    const handleRemoveBlockedUser = (idToRemove) => {
        const current = (maintenanceConfig.blocked_user_ids || []).map(Number);
        handleToggleMaintenance('blocked_user_ids', current.filter(id => id !== Number(idToRemove)));
    };

    const handlePickUserForRoute = (userId) => {
        const id = Number(userId);
        if (!id) return;
        setSelectedRouteUserId(id);

        const userRules = maintenanceConfig.user_restricted_routes || {};
        const existingRule = userRules[String(id)] || userRules[id];
        if (existingRule) {
            setSelectedModules(Array.isArray(existingRule.routes) ? existingRule.routes : []);
            setRouteNoticeMsg(existingRule.message || '');
        } else {
            setSelectedModules([]);
            setRouteNoticeMsg('');
        }
    };

    const handleToggleModule = (routeId) => {
        setSelectedModules(prev => {
            if (prev.includes(routeId)) {
                return prev.filter(r => r !== routeId);
            } else {
                return [...prev, routeId];
            }
        });
    };

    const handleSaveRouteRule = async () => {
        if (!selectedRouteUserId) return;
        if (selectedModules.length === 0) {
            if (typeof handleRemoveUserRouteRestriction === 'function') {
                await handleRemoveUserRouteRestriction(selectedRouteUserId);
            }
        } else {
            if (typeof handleSetUserRouteRestriction === 'function') {
                await handleSetUserRouteRestriction(selectedRouteUserId, selectedModules, routeNoticeMsg);
            }
        }
        setSelectedRouteUserId(null);
        setSelectedModules([]);
        setRouteNoticeMsg('');
    };

    const handleCancelRouteRule = () => {
        setSelectedRouteUserId(null);
        setSelectedModules([]);
        setRouteNoticeMsg('');
    };

    const getUserLabel = (id) => {
        const found = (users || []).find(u => Number(u.id) === Number(id));
        if (found) {
            const role = found.roles?.[0] || 'staff';
            return `${found.name} (#${found.id} • ${role})`;
        }
        return `User #${id}`;
    };

    const allowedList = (maintenanceConfig.allowed_user_ids || []).map(Number);
    const blockedList = (maintenanceConfig.blocked_user_ids || []).map(Number);
    const restrictedRouteRules = maintenanceConfig.user_restricted_routes || {};
    const restrictedUserIds = Object.keys(restrictedRouteRules).map(Number).filter(id => id > 0);
    return (
        <div className="space-y-6">
            {/* Telemetry Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PHP Engine</span>
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
                            <FiServer className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                        {telemetry?.php_version ? `PHP ${telemetry.php_version}` : 'Loading...'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                        {telemetry?.server_software || 'Web Engine Active'}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Status</span>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500">
                            <FiDatabase className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Connected</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                        {telemetry?.database_name || 'cca_manage_db'}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realtime Socket</span>
                        <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-500">
                            <FiZap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 truncate">
                        Pusher ap2
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span>{pusherStatus}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Staff & Sessions</span>
                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500">
                            <FiActivity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                        {telemetry?.active_users !== undefined ? `${telemetry.active_users} Users` : '...'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {telemetry?.active_sessions !== undefined ? `${telemetry.active_sessions} Active Auth Tokens` : 'Checking tokens...'}
                    </div>
                </div>
            </div>

            {/* Session & Permission Inspector */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <FiShield className="w-5 h-5 text-cyan-500" />
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Identity & Role Permissions</h2>
                    </div>
                    <button
                        type="button"
                        onClick={copySpecs}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition cursor-pointer"
                    >
                        <FiCopy className="w-3.5 h-3.5" />
                        <span>Copy Telemetry JSON</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Authenticated User</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{currentUser?.name}</div>
                        <div className="text-xs text-indigo-500 font-bold">@{currentUser?.username || 'user'} (ID: {currentUser?.id})</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Assigned Roles</div>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {(currentUser?.roles || ['staff']).map(r => (
                                <span
                                    key={r}
                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${r === 'developer'
                                        ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800'
                                        : r === 'admin'
                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                        }`}
                                >
                                    {r}
                                </span>
                            ))}
                        </div>
                        <div className="text-[11px] text-slate-500">Hybrid Staff-Developer execution mode enabled</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Server Local Time (Bangladesh)</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <FiClock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{telemetry?.server_time_bd || new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Timezone: Asia/Dhaka (+06:00)</div>
                    </div>
                </div>
            </div>

            {/* System Maintenance & Safety Guards (Phase 2) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <FiSliders className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            System Maintenance & Safety Guards
                        </h2>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Phase 2 &bull; Disaster Recovery
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {/* Card 1: Maintenance Mode Toggle */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-4 ${maintenanceConfig.maintenance_enabled
                        ? 'bg-rose-500/10 border-rose-500/40 dark:bg-rose-950/30'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${maintenanceConfig.maintenance_enabled
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    <FiAlertOctagon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        Site Maintenance Mode
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        {maintenanceConfig.maintenance_enabled ? 'Regular access blocked' : 'Site is live & public'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={maintenanceSaving}
                                onClick={() => handleToggleMaintenance('maintenance_enabled', !maintenanceConfig.maintenance_enabled)}
                                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${maintenanceConfig.maintenance_enabled ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${maintenanceConfig.maintenance_enabled ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                Maintenance Announcement Banner:
                            </label>
                            <textarea
                                rows={2}
                                value={editMaintenanceMsg}
                                onChange={(e) => setEditMaintenanceMsg(e.target.value)}
                                placeholder="Enter message for staff/students during downtime..."
                                className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 resize-none font-sans"
                            />
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-slate-400">
                                    Bypass: Developer & Admin roles only
                                </span>
                                <button
                                    type="button"
                                    disabled={maintenanceSaving}
                                    onClick={() => handleToggleMaintenance('maintenance_message', editMaintenanceMsg)}
                                    className="px-3 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                                >
                                    Save Message
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: SMS Dry-Run Simulator */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-4 ${maintenanceConfig.sms_dry_run
                        ? 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/30'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${maintenanceConfig.sms_dry_run
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    <FiShield className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        SMS & Gateway Dry-Run
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        {maintenanceConfig.sms_dry_run ? 'Simulated (Zero balance cost)' : 'Live delivery enabled'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={maintenanceSaving}
                                onClick={() => handleToggleMaintenance('sms_dry_run', !maintenanceConfig.sms_dry_run)}
                                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${maintenanceConfig.sms_dry_run ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${maintenanceConfig.sms_dry_run ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span>Safe Testing Sandbox</span>
                            </div>
                            <p>
                                When Dry-Run is active, automated attendance alerts and payment SMS requests to Greenweb / Elitbuzz will be simulated and logged without deducting account credits.
                            </p>
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono">
                            Last updated by: {maintenanceConfig.updated_by || 'Developer'} ({maintenanceConfig.updated_at})
                        </div>
                    </div>

                    {/* Card 3: Allowed Users during Downtime (Emergency Whitelist) */}
                    <div className="p-5 rounded-2xl border transition-all space-y-4 bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                    <FiUserCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Allowed Users (Bypass Whitelist)
                                        </h3>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                            {allowedList.length} Whitelisted
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        মেইনটেনেন্সে সাইট বন্ধ থাকা অবস্থায় শুধুমাত্র এই ইউজাররা সম্পূর্ণ সাইটে প্রবেশ করতে পারবে
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Add User Custom Combobox */}
                        <StaffSearchSelect
                            users={users}
                            usersLoading={usersLoading}
                            fetchUsers={fetchUsers}
                            onAddUser={handleAddAllowedUser}
                            disabled={maintenanceSaving}
                            theme="emerald"
                            placeholder="Search staff to whitelist by name, ID (#3), email, role..."
                            actionLabel="Whitelist"
                            excludeIds={allowedList}
                        />

                        {/* Whitelisted Users Chip Badges */}
                        <div className="min-h-12 p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Currently Allowed Users (Bypass Active):
                            </div>
                            {allowedList.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
                                    কোনো সাধারণ ইউজার অ্যালাও করা নেই (শুধুমাত্র Admin ও Developer বাইপাস সক্রিয়)।
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {allowedList.map(id => (
                                        <span
                                            key={id}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                                        >
                                            <FiUser className="w-3 h-3" />
                                            <span>{getUserLabel(id)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAllowedUser(id)}
                                                className="hover:bg-emerald-500/30 p-0.5 rounded text-emerald-500 hover:text-emerald-700 dark:hover:text-white transition cursor-pointer"
                                                title="Remove access"
                                            >
                                                <FiX className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 4: Targeted Maintenance (Specific User Blocklist) */}
                    <div className="p-5 rounded-2xl border transition-all space-y-4 bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                    <FiUserX className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Targeted User Maintenance (একক ইউজার লক)
                                        </h3>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                                            {blockedList.length} Blocked
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        সাইট সবার জন্য লাইভ থাকা সত্ত্বেও, শুধুমাত্র এই নির্দিষ্ট ইউজারদের জন্য সাইট মেইনটেনেন্সে থাকবে
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Add User Custom Combobox */}
                        <StaffSearchSelect
                            users={users}
                            usersLoading={usersLoading}
                            fetchUsers={fetchUsers}
                            onAddUser={handleAddBlockedUser}
                            disabled={maintenanceSaving}
                            theme="rose"
                            placeholder="Search staff to lock by name, ID (#3), email, role..."
                            actionLabel="Lock"
                            excludeIds={blockedList}
                        />

                        {/* Blocked Users Chip Badges */}
                        <div className="min-h-12 p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Currently Targeted Users (Maintenance Screen Active):
                            </div>
                            {blockedList.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
                                    কোনো নির্দিষ্ট ইউজার ব্লক করা নেই। সবার জন্য অ্যাকাউন্ট উন্মুক্ত রয়েছে।
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {blockedList.map(id => (
                                        <span
                                            key={id}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium"
                                        >
                                            <FiUser className="w-3 h-3" />
                                            <span>{getUserLabel(id)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBlockedUser(id)}
                                                className="hover:bg-rose-500/30 p-0.5 rounded text-rose-500 hover:text-rose-700 dark:hover:text-white transition cursor-pointer"
                                                title="Unlock user"
                                            >
                                                <FiX className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Targeted User Notice Message */}
                        <div className="space-y-2 pt-1">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                Notice for Targeted Users (লক হওয়া ইউজারদের নোটিশ):
                            </label>
                            <textarea
                                rows={2}
                                value={editUserMaintenanceMsg}
                                onChange={(e) => setEditUserMaintenanceMsg(e.target.value)}
                                placeholder="Enter specific notice for targeted users..."
                                className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 resize-none font-sans"
                            />
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    disabled={maintenanceSaving}
                                    onClick={() => handleToggleMaintenance('user_maintenance_message', editUserMaintenanceMsg)}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                                >
                                    Save User Notice
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 5: Route & Module Restrictions per User */}
                    <div className="p-5 rounded-2xl border transition-all space-y-5 bg-violet-500/5 dark:bg-violet-950/20 border-violet-500/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-violet-500/20 text-violet-500 border border-violet-500/30">
                                    <FiLayers className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Route & Module Restrictions (ইউজারভিত্তিক নির্দিষ্ট মডিউল লক)
                                        </h3>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold">
                                            {restrictedUserIds.length} Users Restricted
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        কোনো স্টাফের জন্য নির্দিষ্ট মডিউল (যেমন: পেরোল, ম্যাংগো ট্রি, টাস্ক) সাময়িকভাবে বন্ধ রাখুন, বাকি সাইট সচল থাকবে
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* User Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                <span>Select Staff Member to Restrict Modules (ইউজার নির্বাচন করুন):</span>
                                {selectedRouteUserId && (
                                    <span className="text-violet-500 dark:text-violet-400 font-bold">
                                        Editing: {getUserLabel(selectedRouteUserId)}
                                    </span>
                                )}
                            </label>
                            <StaffSearchSelect
                                users={users}
                                usersLoading={usersLoading}
                                fetchUsers={fetchUsers}
                                onAddUser={handlePickUserForRoute}
                                disabled={maintenanceSaving}
                                theme="violet"
                                placeholder="Search staff to configure module restrictions by name, ID (#3), email, role..."
                                actionLabel="Configure"
                                excludeIds={[]}
                            />
                        </div>

                        {/* Configuration Panel for Selected User */}
                        {selectedRouteUserId && (
                            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-violet-500/30 space-y-4 shadow-sm animate-in fade-in duration-200">
                                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500/30 to-indigo-500/30 text-violet-500 flex items-center justify-center font-black text-sm border border-violet-500/30">
                                            <FiUser className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <span>{getUserLabel(selectedRouteUserId)}</span>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-bold">
                                                    {selectedModules.length} Modules Selected
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                যে যে মডিউলগুলোতে টিক দেবেন, শুধুমাত্র সেই মডিউলে প্রবেশ করলে মেইনটেন্যান্স নোটিশ দেখাবে।
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedModules(RESTRICTABLE_MODULES.map(m => m.id))}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedModules([])}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                        >
                                            Clear Selection
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelRouteRule}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>

                                {/* Module Selection Pills Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                    {RESTRICTABLE_MODULES.map(m => {
                                        const isChecked = selectedModules.includes(m.id);
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => handleToggleModule(m.id)}
                                                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer relative ${isChecked
                                                    ? 'bg-violet-500/15 border-violet-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-violet-500/30'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                <span className="text-xl shrink-0 mt-0.5">{m.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-xs font-black truncate">{m.bn}</span>
                                                        {isChecked && (
                                                            <span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                                                                <FiCheck className="w-2.5 h-2.5" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                                                        {m.id}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom Notice for this user's module restriction */}
                                <div className="space-y-1.5 pt-1">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                        Custom Notice for {getUserLabel(selectedRouteUserId)} (ঐচ্ছিক মেসেজ):
                                    </label>
                                    <input
                                        type="text"
                                        value={routeNoticeMsg}
                                        onChange={(e) => setRouteNoticeMsg(e.target.value)}
                                        placeholder="যেমন: পেরোল মডিউলে ডাটা রিকনসিলিয়েশন চলছে। দুপুর ২টায় সচল হবে।"
                                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 font-sans"
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={handleCancelRouteRule}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={maintenanceSaving}
                                        onClick={handleSaveRouteRule}
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        <FiCheck className="w-3.5 h-3.5" />
                                        <span>{selectedModules.length === 0 ? 'Clear All Restrictions' : 'Save Route Restrictions'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Active Restrictions List */}
                        <div className="space-y-2.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Active Module-Level Restrictions List (বর্তমানে রেস্ট্রিক্টেড স্টাফ তালিকা):
                            </div>

                            {restrictedUserIds.length === 0 ? (
                                <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 italic">
                                    কোনো ইউজারের জন্য নির্দিষ্ট মডিউল লক করা নেই। সবার জন্য সকল রুট উন্মুক্ত রয়েছে।
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {restrictedUserIds.map(uid => {
                                        const rule = restrictedRouteRules[String(uid)] || restrictedRouteRules[uid] || {};
                                        const routes = Array.isArray(rule.routes) ? rule.routes : [];
                                        return (
                                            <div
                                                key={uid}
                                                className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-violet-500/20 hover:border-violet-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                                            >
                                                <div className="space-y-1.5 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {getUserLabel(uid)}
                                                        </span>
                                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold">
                                                            {routes.length} Modules Locked
                                                        </span>
                                                    </div>

                                                    {/* Restricted Route Badges */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {routes.map(r => {
                                                            const foundMod = RESTRICTABLE_MODULES.find(m => m.id === r);
                                                            return (
                                                                <span
                                                                    key={r}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                                                                >
                                                                    <span>{foundMod?.icon || '🔒'}</span>
                                                                    <span>{foundMod?.bn || r}</span>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>

                                                    {rule.message && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                            "{rule.message}"
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePickUserForRoute(uid)}
                                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <FiEdit2 className="w-3 h-3 text-violet-500" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={maintenanceSaving}
                                                        onClick={() => {
                                                            if (typeof handleRemoveUserRouteRestriction === 'function') {
                                                                handleRemoveUserRouteRestriction(uid);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <FiX className="w-3.5 h-3.5" />
                                                        <span>Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TelemetryTab;