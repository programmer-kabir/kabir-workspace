import React, { useState } from 'react';
import {
    FiDatabase,
    FiDownload,
    FiRefreshCw,
    FiZap,
    FiCheckCircle,
    FiShield,
    FiTool,
    FiHardDrive,
    FiTrash2,
    FiAlertTriangle,
    FiCheck,
    FiTable,
    FiTerminal,
    FiCloud,
    FiServer
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

import { useDatabaseManager } from '../../hooks/useDatabaseManager';
import TableExplorerTab from '../DatabaseManager/TableExplorerTab';
import SqlRunnerTab from '../DatabaseManager/SqlRunnerTab';
import SystemOverviewTab from '../DatabaseManager/SystemOverviewTab';
import JsonCellModal from '../DatabaseManager/modals/JsonCellModal';
import InsertRowModal from '../DatabaseManager/modals/InsertRowModal';
import EditRowModal from '../DatabaseManager/modals/EditRowModal';
import DeleteConfirmModal from '../DatabaseManager/modals/DeleteConfirmModal';

const DatabaseTab = ({
    backupLoading = false,
    fullBackupLoading = false,
    handleDownloadSnapshot,
    handleDownloadFullSystemSnapshot,
    lastBackup,
    janitorStats,
    janitorLoading = false,
    janitorCleaning = false,
    janitorScope = 'full',
    fetchJanitorStats,
    handleRunJanitorClean,
    telemetry
}) => {
    const dbManager = useDatabaseManager();
    const [subTab, setSubTab] = useState('explorer'); // 'explorer' | 'sql' | 'overview' | 'backups' | 'janitor'

    const DB_SUB_TABS = [
        { id: 'explorer', label: 'Table Explorer & CRUD', icon: FiTable, count: dbManager.tables?.length || null },
        { id: 'sql', label: 'SQL Query Console', icon: FiTerminal },
        { id: 'overview', label: 'Cloud Storage & R2', icon: FiCloud },
        { id: 'backups', label: 'Disaster Backups', icon: FiShield },
        { id: 'janitor', label: 'Hygiene & Janitor', icon: FiTool, badge: (janitorStats?.tokens?.expired || 0) > 0 ? `${janitorStats.tokens.expired}` : null },
    ];

    return (
        <div className="space-y-6">
            {/* ── Sub Navigation Bar for Database Suite ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {DB_SUB_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = subTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSubTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 font-black'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-500'}`} />
                                <span>{tab.label}</span>
                                {tab.count !== null && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                                {tab.badge && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <strong className="text-slate-700 dark:text-slate-200">MariaDB</strong> Active
                    </span>
                    <span>&bull;</span>
                    <span>Full Developer Privileges</span>
                </div>
            </div>

            {/* ── 1. TABLE EXPLORER & LIVE CRUD ── */}
            {subTab === 'explorer' && (
                <div className="space-y-6">
                    <TableExplorerTab {...dbManager} />
                </div>
            )}

            {/* ── 2. SQL QUERY RUNNER CONSOLE ── */}
            {subTab === 'sql' && (
                <div className="space-y-6">
                    <SqlRunnerTab {...dbManager} />
                </div>
            )}

            {/* ── 3. CLOUD STORAGE & HEALTH OVERVIEW ── */}
            {subTab === 'overview' && (
                <div className="space-y-6">
                    <SystemOverviewTab {...dbManager} />
                </div>
            )}

            {/* ── 4. DISASTER RECOVERY & FULL SYSTEM BACKUPS ── */}
            {subTab === 'backups' && (
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
                        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-2 max-w-2xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                                        <HiSparkles className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Zero-Loss Architecture &bull; Full PHP Codebase + MySQL Dump</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <FiDatabase className="w-6 h-6 text-cyan-400" />
                                        <span>Disaster Recovery: Full System & Database Backups</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        Protect against server crashes or data corruption. Download a complete <strong>Full System Archive (.zip)</strong> containing all PHP backend endpoints, configurations, and the live MySQL dump, or take a lightweight <strong>Database-Only Snapshot (.sql.gz)</strong>. Redundant mirror saved in <code className="px-1.5 py-0.5 rounded bg-black/40 text-emerald-300 font-mono text-xs">/server/backups/</code>.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 shrink-0">
                                    {/* Button 1: Full System Backup (PHP Codebase + Database .zip) */}
                                    <button
                                        type="button"
                                        disabled={fullBackupLoading || backupLoading}
                                        onClick={handleDownloadFullSystemSnapshot}
                                        className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Includes complete PHP source code, configs, and live database SQL"
                                    >
                                        {fullBackupLoading ? (
                                            <>
                                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Packaging PHP & Database (.zip)...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiShield className="w-4 h-4" />
                                                <span>Full System Backup (PHP + DB .zip)</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Button 2: Fast Database Snapshot Only (.sql.gz) */}
                                    <button
                                        type="button"
                                        disabled={backupLoading || fullBackupLoading}
                                        onClick={handleDownloadSnapshot}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Instant Gzip compressed MySQL database dump only"
                                    >
                                        {backupLoading ? (
                                            <>
                                                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>Compacting Database...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiDownload className="w-3.5 h-3.5" />
                                                <span>Database Snapshot Only (.sql.gz)</span>
                                            </>
                                        )}
                                    </button>

                                    <span className="text-[10px] text-slate-400 text-center font-mono">
                                        Protected by server-side .htaccess
                                    </span>
                                </div>
                            </div>

                            {/* Last backup summary pill if downloaded */}
                            {lastBackup && (
                                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                            <FiCheckCircle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-black text-emerald-300">
                                                {lastBackup.type || 'Database Snapshot'} Generated Successfully
                                            </div>
                                            <div className="text-slate-300 font-mono text-[11px]">
                                                File: {lastBackup.filename} ({lastBackup.size}) &bull; At {lastBackup.time}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase self-start sm:self-auto">
                                        Verified Mirror in /server/backups
                                    </span>
                                </div>
                            )}

                            {/* 3 Pillars of Safety */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/20 text-xs">
                                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <FiShield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold text-white text-[11px]">100% PHP Codebase Preservation</div>
                                        <div className="text-[10px] text-slate-400 leading-relaxed">
                                            Packages all APIs, configs, email templates, and cron scripts into the disaster zip.
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <FiZap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold text-white text-[11px]">Chunked Memory Safety</div>
                                        <div className="text-[10px] text-slate-400 leading-relaxed">
                                            100-row batching ensures zero memory exhaustion even with large activity and fee tables.
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <FiCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold text-white text-[11px]">phpMyAdmin & CLI Compatible</div>
                                        <div className="text-[10px] text-slate-400 leading-relaxed">
                                            Standard DDL statements for instant 1-step import directly through cPanel / phpMyAdmin.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Restoration Playbook */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <FiShield className="w-4 h-4 text-emerald-500" />
                            <span>Disaster Recovery Restoration Playbook</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center">1</span>
                                    <span>Option A: Full System Restore (.zip)</span>
                                </div>
                                <ol className="list-decimal list-inside space-y-1 text-slate-500 leading-relaxed text-[11px]">
                                    <li>Extract the downloaded <code className="font-mono text-emerald-500">.zip</code> archive.</li>
                                    <li>Upload the extracted files to your server's root or <code className="font-mono text-emerald-500">/server</code> folder.</li>
                                    <li>Import <code className="font-mono text-cyan-500">DATABASE_BACKUP/*.sql</code> into MySQL via phpMyAdmin.</li>
                                    <li>Update <code className="font-mono text-slate-400">config/database.php</code> credentials if migrating host.</li>
                                </ol>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-black flex items-center justify-center">2</span>
                                    <span>Option B: Hostinger phpMyAdmin (GUI)</span>
                                </div>
                                <ol className="list-decimal list-inside space-y-1 text-slate-500 leading-relaxed text-[11px]">
                                    <li>Log into Hostinger cPanel / hPanel &rarr; phpMyAdmin.</li>
                                    <li>Select database (<code className="font-mono text-cyan-600 dark:text-cyan-400">{telemetry?.database_name || 'cca_manage_db'}</code>).</li>
                                    <li>Navigate to the <strong>Import</strong> tab.</li>
                                    <li>Choose your <code className="font-mono text-cyan-600 dark:text-cyan-400">.sql.gz</code> or <code className="font-mono text-cyan-600 dark:text-cyan-400">.sql</code> file.</li>
                                    <li>Click <strong>Go</strong> to complete full database restore.</li>
                                </ol>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black flex items-center justify-center">3</span>
                                    <span>Option C: SSH / Terminal Fast Restore</span>
                                </div>
                                <p className="text-slate-500 text-[11px] leading-relaxed">
                                    Direct terminal pipe into MySQL:
                                </p>
                                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[10px] sm:text-[11px] text-slate-800 dark:text-emerald-400 border border-slate-200 dark:border-slate-800/80 overflow-x-auto select-all shadow-inner font-semibold">
                                    gzip -dc cca_db_snapshot_*.sql.gz | mysql -u DB_USER -p DB_NAME
                                </div>
                                <p className="text-[10px] text-slate-400">
                                    Preserves foreign keys, tables, and Bangladesh (+06:00) timestamps seamlessly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 5. DATABASE JANITOR & DEFRAGMENTER SUITE ── */}
            {subTab === 'janitor' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                <FiTool className="w-3 h-3" />
                                <span>Phase 4 &bull; 1-Click Database Janitor & Hygiene Suite</span>
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <FiHardDrive className="w-5 h-5 text-emerald-500" />
                                <span>Database Garbage Collector & Table Defragmenter</span>
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                                Eliminates abandoned authentication tokens, reclaims unallocated fragmentation space via <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] text-emerald-500">OPTIMIZE TABLE</code>, and prevents server disk exhaustion.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                disabled={janitorLoading || janitorCleaning}
                                onClick={() => fetchJanitorStats && fetchJanitorStats(false)}
                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Refresh statistics"
                            >
                                <FiRefreshCw className={`w-3.5 h-3.5 ${janitorLoading ? 'animate-spin' : ''}`} />
                                <span>{janitorLoading ? 'Analyzing...' : 'Refresh Stats'}</span>
                            </button>

                            <button
                                type="button"
                                disabled={janitorCleaning || janitorLoading}
                                onClick={() => handleRunJanitorClean && handleRunJanitorClean('full')}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                title="Run all hygiene routines at once"
                            >
                                <FiZap className="w-3.5 h-3.5" />
                                <span>{janitorCleaning && janitorScope === 'full' ? 'Cleaning System...' : 'Run All Janitors'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Live Janitor Diagnostic Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Metric 1: Token Hygiene */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Session Auth Tokens</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${(janitorStats?.tokens?.expired || 0) > 0
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                        {(janitorStats?.tokens?.expired || 0) > 0 ? `${janitorStats?.tokens?.expired} Dangling` : 'Clean'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                        {janitorStats ? `${janitorStats.tokens?.expired || 0} Expired` : '0 Expired'}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>Total: <strong className="text-slate-700 dark:text-slate-300">{janitorStats?.tokens?.total || 0}</strong></span>
                                        <span>&bull;</span>
                                        <span>Active: <strong className="text-emerald-500">{janitorStats?.tokens?.active || 0}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={janitorCleaning || (janitorStats?.tokens?.expired || 0) === 0}
                                onClick={() => handleRunJanitorClean && handleRunJanitorClean('tokens')}
                                className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>{janitorCleaning && janitorScope === 'tokens' ? 'Purging...' : 'Purge Dead Tokens'}</span>
                            </button>
                        </div>

                        {/* Metric 2: Table Defragmentation */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MySQL Defragmentation</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${(janitorStats?.tables?.fragmented_count || 0) > 0
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                        {(janitorStats?.tables?.fragmented_count || 0) > 0 ? `${janitorStats?.tables?.fragmented_count} Fragmented` : 'Optimized'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                        {janitorStats ? `${janitorStats.tables?.fragmented_count || 0} Tables` : '0 Tables'}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>Total Tables: <strong className="text-slate-700 dark:text-slate-300">{janitorStats?.tables?.total || dbManager.tables?.length || 0}</strong></span>
                                        <span>&bull;</span>
                                        <span>Reclaimable: <strong className="text-cyan-500">{janitorStats?.tables?.total_fragmentation_kb || 0} KB</strong></span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={janitorCleaning}
                                onClick={() => handleRunJanitorClean && handleRunJanitorClean('tables')}
                                className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                            >
                                <FiZap className="w-3.5 h-3.5 text-amber-500" />
                                <span>{janitorCleaning && janitorScope === 'tables' ? 'Optimizing Tables...' : 'Defragment Tables'}</span>
                            </button>
                        </div>

                        {/* Metric 3: Cron Log File Trimming */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Automation Cron Logs</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        Auto-Managed
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                        {janitorStats ? `${janitorStats.logs?.total_size_kb || 0} KB` : '0 KB'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        <span>Tracked log files: <strong className="text-slate-700 dark:text-slate-300">{janitorStats?.logs?.files_count || 3}</strong> (auto-trimmed at &gt;30KB)</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={janitorCleaning}
                                onClick={() => handleRunJanitorClean && handleRunJanitorClean('logs')}
                                className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                            >
                                <FiHardDrive className="w-3.5 h-3.5 text-cyan-500" />
                                <span>{janitorCleaning && janitorScope === 'logs' ? 'Trimming...' : 'Trim Excess Logs'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Global Action Modals for Table Explorer & SQL Console ── */}
            {dbManager.jsonViewModal?.isOpen && <JsonCellModal {...dbManager} />}
            {dbManager.insertModal?.isOpen && <InsertRowModal {...dbManager} />}
            {dbManager.editModal?.isOpen && <EditRowModal {...dbManager} />}
            {dbManager.deleteModal?.isOpen && <DeleteConfirmModal {...dbManager} />}
        </div>
    );
};

export default DatabaseTab;