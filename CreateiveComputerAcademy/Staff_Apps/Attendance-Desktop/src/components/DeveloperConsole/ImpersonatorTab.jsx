import React from 'react';
import {
    FiUsers,
    FiSearch,
    FiUserCheck,
    FiRefreshCw,
} from 'react-icons/fi';

const ImpersonatorTab = ({
    users,
    usersLoading,
    userSearch,
    setUserSearch,
    selectedRoleFilter,
    setSelectedRoleFilter,
    impersonatingId,
    handleImpersonate,
    fetchUsers,
    currentUser,
    API_BASE,
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <FiUsers className="w-5 h-5 text-cyan-500" />
                            <span>User Impersonator & Shadow Login</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Securely test features and debug user-specific issues by signing in as any staff, instructor, or student without knowing their password.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchUsers}
                        disabled={usersLoading}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                        <span>Reload Users</span>
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
                    <div className="relative flex-1">
                        <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search by name, email, employee code, username..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30"
                        />
                    </div>

                    {/* Role Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {['all', 'staff', 'instructor', 'admin', 'manager', 'reviewer', 'student'].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setSelectedRoleFilter(r)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap cursor-pointer ${selectedRoleFilter === r
                                    ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Cards Grid */}
            {usersLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <FiRefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Loading user profiles...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users
                        .filter((u) => {
                            const matchSearch =
                                !userSearch ||
                                (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
                                (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
                                (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())) ||
                                (u.employee_code && u.employee_code.toLowerCase().includes(userSearch.toLowerCase())) ||
                                (u.phone && u.phone.includes(userSearch));

                            const matchRole =
                                selectedRoleFilter === 'all' ||
                                (u.roles && u.roles.includes(selectedRoleFilter));

                            return matchSearch && matchRole;
                        })
                        .slice(0, 60)
                        .map((u) => {
                            const isCurrent = currentUser?.id === u.id;
                            const isBusy = impersonatingId === u.id;
                            return (
                                <div
                                    key={u.id}
                                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-black uppercase text-sm shrink-0 border border-cyan-200 dark:border-cyan-800 overflow-hidden">
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

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                                    {u.name}
                                                </h3>
                                                {isCurrent && (
                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {u.email || u.username || 'No email'}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                                                <span>ID: {u.id}</span>
                                                {u.employee_code && (
                                                    <>
                                                        <span>&bull;</span>
                                                        <span>{u.employee_code}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details & Roles */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 font-semibold">Department:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                                {u.department_name || u.designation || 'General'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 flex-wrap">
                                            {(u.roles || []).map((r) => (
                                                <span
                                                    key={r}
                                                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                                >
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleImpersonate(u)}
                                        disabled={isCurrent || isBusy}
                                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${isCurrent
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20 active:scale-98'
                                            }`}
                                    >
                                        {isBusy ? (
                                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <FiUserCheck className="w-3.5 h-3.5" />
                                        )}
                                        <span>{isCurrent ? 'Current Session' : `Login As ${u.name.split(' ')[0]}`}</span>
                                    </button>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    )
}

export default ImpersonatorTab;