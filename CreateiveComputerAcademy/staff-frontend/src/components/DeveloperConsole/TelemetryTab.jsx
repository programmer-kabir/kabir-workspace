
import { FiDatabase, FiServer, FiZap, FiShield, FiCheckCircle, FiCopy, FiActivity, FiClock,   FiSliders, FiAlertOctagon,  } from 'react-icons/fi';

const TelemetryTab = ({ telemetry, copySpecs, currentUser, maintenanceConfig, handleToggleMaintenance, editMaintenanceMsg, setEditMaintenanceMsg, pusherStatus,maintenanceSaving  }) => {
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
                </div>
            </div>
        </div>
    )
}

export default TelemetryTab;