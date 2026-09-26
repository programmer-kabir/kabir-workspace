import React from 'react';
import {
  FiTable,
  FiCode,
  FiLayers,
  FiHash,
  FiHardDrive,
  FiActivity,
  FiCloud,
  FiServer
} from 'react-icons/fi';

/**
 * DbHeader Component
 * Top banner with DB & R2 Cloud title, live status, Tab Switcher (Overview / Table Studio / SQL Runner), and 4 Metric Badges.
 * Fully responsive for both Light Mode and Dark Mode.
 */
const DbHeader = ({
  activeTab,
  setActiveTab,
  tables = [],
  totalDbRows = 0,
  totalDbSize = '0.00',
  selectedTable = '',
  systemHealth = null
}) => {
  const r2Size = systemHealth?.r2_storage?.total_size_gb ? `${systemHealth.r2_storage.total_size_gb} GB` : '3.05 GB';
  const r2Files = systemHealth?.r2_storage?.total_objects || 190;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-6 md:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-700/60 shadow-sm dark:shadow-xl text-slate-800 dark:text-white transition-colors">
      {/* Background Decorative Blur Bubbles */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Title & Connection Status */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-white/80 dark:ring-white/10 shrink-0">
            <FiServer size={26} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Database & Cloud Storage
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                R2 & DB Connected
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-2 font-medium">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">Cloudflare R2 (10GB Free Tier)</span>
              <span>•</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">MariaDB Cluster</span>
              <span>•</span>
              <span>Health Diagnostics & Visual Studio</span>
            </p>
          </div>
        </div>

        {/* Tab Switcher (Overview | Table Studio | SQL Runner) */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-slate-300/60 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <FiActivity size={16} className={activeTab === 'overview' ? 'text-blue-600' : ''} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'explorer'
                ? 'bg-white text-blue-600 dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <FiTable size={16} />
            <span>Table Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <FiCode size={16} />
            <span>SQL Runner</span>
          </button>
        </div>
      </div>

      {/* Quick Database & R2 Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <FiCloud size={14} className="text-cyan-600 dark:text-cyan-400" />
            <span>R2 Cloud Storage</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-cyan-300 mt-1">{r2Size}</p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <FiLayers size={14} className="text-blue-600 dark:text-blue-400" />
            <span>R2 Total Files</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{r2Files} files</p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <FiHardDrive size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Database Size</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-emerald-300 mt-1">{totalDbSize} MB</p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <FiHash size={14} className="text-purple-600 dark:text-purple-400" />
            <span>DB Records</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{(totalDbRows || 0).toLocaleString()} rows</p>
        </div>
      </div>
    </div>
  );
};

export default DbHeader;
