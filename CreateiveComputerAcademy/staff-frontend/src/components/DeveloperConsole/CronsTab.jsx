import { FiClock, FiPlay, FiList, FiRefreshCw, FiSearch, FiTerminal, FiCopy, FiCode } from 'react-icons/fi';


const CronsTab = ({ setSelectedCronTab, selectedCronTab, cronOutput, setCronOutput, cronHistory, cronLoading, handleRunCron, handleTestPing }) => {
    return (
        <div className="space-y-6">
            {/* Header Automation Deck */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <FiClock className="w-5 h-5 text-purple-500" />
                            <span>Automated Background Jobs & Crons Deck</span>
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Trigger server automation jobs with dual-mode flags or view exact Hostinger cPanel crontab commands.
                        </p>
                    </div>

                    {/* Sub-tab pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedCronTab('triggers')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedCronTab === 'triggers'
                                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <FiPlay className="w-3.5 h-3.5" />
                            <span>Job Runners</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedCronTab('crontab')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedCronTab === 'crontab'
                                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <FiTerminal className="w-3.5 h-3.5" />
                            <span>cPanel Crontab</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedCronTab('history')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${selectedCronTab === 'history'
                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <FiList className="w-3.5 h-3.5" />
                            <span>History ({cronHistory?.length})</span>
                        </button>
                    </div>
                </div>

                {/* TAB CONTENT 1: JOB RUNNERS */}
                {selectedCronTab === 'triggers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Cron 1: Absent Manager */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider">
                                        Daily 08:00 PM & 11:15 PM
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">Asia/Dhaka</span>
                                </div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">Auto-Absent Manager</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Sends late-warning SMS/notifications at 8:00 PM, and automatically marks employees & students absent after 11:15 PM.
                                </p>
                                <div className="text-[10px] font-mono text-purple-500 bg-purple-500/5 px-2 py-1 rounded-lg">
                                    server/api/crons/cron_absent_manager.php
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={cronLoading['absent_manager_warning'] || cronLoading['absent_manager']}
                                    onClick={() => handleRunCron('absent_manager', 'Auto-Absent (Warning Phase)', { action: 'warning', force: '1' })}
                                    className="py-2 px-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Force trigger 8:00 PM Warning SMS notification"
                                >
                                    <FiAlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{cronLoading['absent_manager_warning'] ? 'Running...' : 'Run Warning'}</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={cronLoading['absent_manager_execute'] || cronLoading['absent_manager']}
                                    onClick={() => handleRunCron('absent_manager', 'Auto-Absent (Mark Absent Phase)', { action: 'execute', force: '1' })}
                                    className="py-2 px-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                                    title="Force trigger 11:15 PM Absence recorder"
                                >
                                    <FiPlay className="w-3 h-3 shrink-0" />
                                    <span>{cronLoading['absent_manager_execute'] ? 'Running...' : 'Run Execute'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Cron 2: Auto Checkout */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                        Daily 11:59 PM
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">Nightly Shift</span>
                                </div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">Midnight Auto Check-Out</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Scans unclosed staff attendance shifts and safely clocks them out matching their shift end time with forgot-checkout flag.
                                </p>
                                <div className="text-[10px] font-mono text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded-lg">
                                    server/api/crons/auto_checkout.php
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    disabled={cronLoading['auto_checkout']}
                                    onClick={() => handleRunCron('auto_checkout', 'Midnight Auto Check-Out', { force: '1' })}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    <FiPlay className="w-3.5 h-3.5" />
                                    <span>{cronLoading['auto_checkout'] ? 'Closing Shifts...' : 'Force Auto Check-Out'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Cron 3: Auto Tiffin Break */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                        01:20 PM & 02:00 PM
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">40m Interval</span>
                                </div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">Auto-Tiffin Break Synchronizer</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Automates student & employee 40-minute lunch pause. Broadcasts Pusher event and registers break intervals.
                                </p>
                                <div className="text-[10px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-lg">
                                    server/api/crons/auto_tiffin.php
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={cronLoading['auto_tiffin_start'] || cronLoading['auto_tiffin']}
                                    onClick={() => handleRunCron('auto_tiffin', 'Auto-Tiffin (Start Break)', { action: 'start' })}
                                    className="py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <FiPlay className="w-3 h-3" />
                                    <span>{cronLoading['auto_tiffin_start'] ? 'Starting...' : 'Force Start (1:20)'}</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={cronLoading['auto_tiffin_end'] || cronLoading['auto_tiffin']}
                                    onClick={() => handleRunCron('auto_tiffin', 'Auto-Tiffin (End Break)', { action: 'end' })}
                                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    <FiCheckCircle className="w-3 h-3" />
                                    <span>{cronLoading['auto_tiffin_end'] ? 'Ending...' : 'Force End (2:00)'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Cron 4: Backfill Past Absents */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-wider">
                                        On-Demand Tool
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">Calendar History</span>
                                </div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">Historical Absence Backfiller</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Scans previous calendar working days (excluding Fridays & government holidays) and backfills missing absent logs.
                                </p>
                                <div className="text-[10px] font-mono text-cyan-500 bg-cyan-500/5 px-2 py-1 rounded-lg">
                                    server/api/crons/backfill_past_absents.php
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    disabled={cronLoading['backfill_absents']}
                                    onClick={() => handleRunCron('backfill_absents', 'Historical Absence Backfiller')}
                                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    <FiRefreshCw className={`w-3.5 h-3.5 ${cronLoading['backfill_absents'] ? 'animate-spin' : ''}`} />
                                    <span>{cronLoading['backfill_absents'] ? 'Backfilling...' : 'Run Historical Scan'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Cron 5: Categories Normalizer */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                        Migration Utility
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">Schema Sync</span>
                                </div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">Course Categories Normalizer</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Synchronizes and normalizes course categories, subcategories, and batch assignments across historical tables.
                                </p>
                                <div className="text-[10px] font-mono text-amber-500 bg-amber-500/5 px-2 py-1 rounded-lg">
                                    server/api/crons/migrate_categories.php
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    disabled={cronLoading['migrate_categories']}
                                    onClick={() => handleRunCron('migrate_categories', 'Categories Normalizer')}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    <FiPlay className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{cronLoading['migrate_categories'] ? 'Normalizing...' : 'Run Category Normalizer'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 2: CPANEL CRONTAB STRINGS */}
                {selectedCronTab === 'crontab' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-3">
                            <FiInfo className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <div className="font-bold">Hostinger cPanel / CLI Configuration Guide</div>
                                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-cyan-300">
                                    Copy these exact crontab directives and paste them into your <strong>Hostinger Cron Jobs</strong> manager. Replace <code className="px-1 py-0.5 rounded bg-black/20 font-mono">/home/u123456789/domains/...</code> with your server document root.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                            {[
                                {
                                    label: 'Auto-Absent Warning (8:00 PM)',
                                    schedule: '0 20 * * *',
                                    cmd: '/usr/bin/php /home/username/public_html/server/api/crons/cron_absent_manager.php --action=warning >/dev/null 2>&1'
                                },
                                {
                                    label: 'Auto-Absent Execution (11:15 PM)',
                                    schedule: '15 23 * * *',
                                    cmd: '/usr/bin/php /home/username/public_html/server/api/crons/cron_absent_manager.php --action=execute >/dev/null 2>&1'
                                },
                                {
                                    label: 'Midnight Auto-Checkout (11:59 PM)',
                                    schedule: '59 23 * * *',
                                    cmd: '/usr/bin/php /home/username/public_html/server/api/crons/auto_checkout.php >/dev/null 2>&1'
                                },
                                {
                                    label: 'Auto-Tiffin Break Start (1:20 PM)',
                                    schedule: '20 13 * * *',
                                    cmd: '/usr/bin/php /home/username/public_html/server/api/crons/auto_tiffin.php --action=start >/dev/null 2>&1'
                                },
                                {
                                    label: 'Auto-Tiffin Break End (2:00 PM)',
                                    schedule: '0 14 * * *',
                                    cmd: '/usr/bin/php /home/username/public_html/server/api/crons/auto_tiffin.php --action=end >/dev/null 2>&1'
                                }
                            ].map((cron, idx) => (
                                <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                                        <span className="font-bold text-slate-900 dark:text-white">{cron.label}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                            {cron.schedule}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <code className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate select-all font-mono font-medium">{cron.schedule} {cron.cmd}</code>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${cron.schedule} ${cron.cmd}`);
                                                toast.success(`Copied crontab command for ${cron.label}`);
                                            }}
                                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent transition cursor-pointer shrink-0"
                                            title="Copy command"
                                        >
                                            <FiCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 3: EXECUTION HISTORY */}
                {selectedCronTab === 'history' && (
                    <div className="space-y-3 animate-fadeIn">
                        {cronHistory?.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-xs">
                                No crons have been triggered during this session yet. Run any job from the "Job Runners" tab.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {cronHistory?.map(item => (
                                    <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                                        <div className="space-y-0.5">
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span>{item.title}</span>
                                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono">
                                                    {item.duration_ms ? `${item.duration_ms} ms` : '0ms'}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono">{item.time}</div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setCronOutput(item)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            <FiTerminal className="w-3 h-3 text-purple-500" />
                                            <span>View Terminal</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Live Cron Execution Output Drawer */}
                {cronOutput && (
                    <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-mono space-y-3 animate-fadeIn shadow-sm dark:shadow-2xl">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-slate-900 dark:text-white font-bold">{cronOutput.title}</span>
                                <span className="text-[10px] text-slate-500">at {cronOutput.time}</span>
                                {cronOutput.duration_ms && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px]">
                                        {cronOutput.duration_ms} ms
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(cronOutput.text);
                                        toast.success('Terminal output copied to clipboard');
                                    }}
                                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-sans flex items-center gap-1 transition cursor-pointer"
                                >
                                    <FiCopy className="w-3 h-3" />
                                    <span>Copy</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCronOutput(null)}
                                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-600 text-slate-600 dark:text-slate-400 text-[11px] font-sans transition cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <pre className="text-xs text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl select-all font-mono border border-slate-200 dark:border-slate-800/40">
                            {cronOutput.text}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CronsTab;