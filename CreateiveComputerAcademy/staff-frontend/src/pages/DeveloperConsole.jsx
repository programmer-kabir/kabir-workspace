import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiTerminal,
  FiServer,
  FiDatabase,
  FiActivity,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiCpu,
  FiClock,
  FiZap,
  FiCopy,
  FiShield,
  FiRadio,
  FiFileText,
  FiPlay,
  FiTrash2,
  FiCheck,
  FiCornerDownRight,
  FiUsers,
  FiSearch,
  FiUserCheck,
  FiExternalLink,
  FiFilter,
  FiDownload,
  FiSliders,
  FiAlertOctagon,
  FiSend,
  FiCode,
  FiLayers,
  FiPlus,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiHardDrive,
  FiTool,
  FiList,
  FiInfo
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import { useDeveloperConsole } from '../hooks/useDeveloperConsole';
import DeveloperHeader from '../components/DeveloperConsole/DeveloperHeader';
import TelemetryTab from '../components/DeveloperConsole/TelemetryTab';
import ImpersonatorTab from '../components/DeveloperConsole/ImpersonatorTab';
import SystemLogsTab from '../components/DeveloperConsole/SystemLogsTab';
import ApiTesterTab from '../components/DeveloperConsole/ApiTesterTab';
import CronsTab from '../components/DeveloperConsole/CronsTab';
import DatabaseTab from '../components/DeveloperConsole/DatabaseTab';
import ServerCodeEditorTab from '../components/DeveloperConsole/ServerCodeEditorTab';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const TABS = [
  { id: 'overview', label: 'Telemetry Overview', path: '/developer', icon: FiActivity },
  { id: 'impersonate', label: 'User Impersonator', path: '/developer/impersonate', icon: FiUsers },
  { id: 'logs', label: 'System Logs', path: '/developer/logs', icon: FiFileText },
  { id: 'api-tester', label: 'API & Socket Tester', path: '/developer/api-tester', icon: FiRadio },
  { id: 'crons', label: 'Crons & Automation', path: '/developer/crons', icon: FiClock },
  { id: 'database', label: 'Database & Cache', path: '/developer/database', icon: FiDatabase },
  { id: 'editor', label: 'Server Code Editor', path: '/developer/editor', icon: FiCode },
];



export default function DeveloperConsole() {
  const { currentUser, impersonateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
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
    editUserMaintenanceMsg, setEditUserMaintenanceMsg,
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
    handleSetUserRouteRestriction,
    handleRemoveUserRouteRestriction,
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
  } = useDeveloperConsole();

  return (
    <div className="space-y-6 animate-fadeIn pb-16 select-text mx-auto">
      {/* 1. Header Banner */}

      <DeveloperHeader />

      {/* 2. Modern Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${isActive
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* === TAB 1: TELEMETRY OVERVIEW === */}
      {activeTab === 'overview' && (
        <TelemetryTab
          telemetry={telemetry}
          copySpecs={copySpecs}
          currentUser={currentUser}
          users={users}
          usersLoading={usersLoading}
          fetchUsers={fetchUsers}
          maintenanceConfig={maintenanceConfig}
          handleToggleMaintenance={handleToggleMaintenance}
          handleSetUserRouteRestriction={handleSetUserRouteRestriction}
          handleRemoveUserRouteRestriction={handleRemoveUserRouteRestriction}
          editMaintenanceMsg={editMaintenanceMsg}
          setEditMaintenanceMsg={setEditMaintenanceMsg}
          editUserMaintenanceMsg={editUserMaintenanceMsg}
          setEditUserMaintenanceMsg={setEditUserMaintenanceMsg}
          pusherStatus={pusherStatus}
          maintenanceSaving={maintenanceSaving}
        />
      )}

      {/* === TAB 1.5: USER IMPERSONATOR === */}
      {activeTab === 'impersonate' && (
        <ImpersonatorTab
          users={users}
          usersLoading={usersLoading}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          selectedRoleFilter={selectedRoleFilter}
          setSelectedRoleFilter={setSelectedRoleFilter}
          impersonatingId={impersonatingId}
          handleImpersonate={handleImpersonate}
          fetchUsers={fetchUsers}
          currentUser={currentUser}
          API_BASE={API_BASE} />
      )}

      {/* === TAB 2: SYSTEM LOGS === */}
      {activeTab === 'logs' && (
        <SystemLogsTab setLogSubTab={setLogSubTab} logSubTab={logSubTab} serverErrorLog={serverErrorLog} serverLogLoading={serverLogLoading} setLiveTail={setLiveTail} liveTail={liveTail} fetchServerErrorLog={fetchServerErrorLog} setIsClearModalOpen={setIsClearModalOpen} filteredLogs={filteredLogs} setLogFilter={setLogFilter} logFilter={logFilter} setLogs={setLogs} />
      )}

      {/* === TAB 3: API & SOCKET TESTER (PHASE 3) === */}
      {activeTab === 'api-tester' && (
        <ApiTesterTab state={{
          testerSubTab,
          setTesterSubTab,
          apiDirectory,
          wsLiveReceived,
          pusherStatus,
          apiSearchQuery,
          setApiSearchQuery,
          apiCategoryFilter,
          setApiCategoryFilter,
          apiCategories,
          apiDirectoryLoading,
          handleSelectApi,
          selectedApi,
          reqMethod,
          setReqMethod,
          reqPath,
          setReqPath,
          rawJsonBody,
          setRawJsonBody,
          autoAttachToken,
          setAutoAttachToken,
          apiExecuting,
          apiResponse,
          handleExecuteRequest,
          fetchApiDirectory,
        }} />
      )}

      {/* === TAB 4: CRONS & AUTOMATION (Phase 4 Deep Dive) === */}
      {activeTab === 'crons' && (
        <CronsTab state={{
          selectedCronTab,
          setSelectedCronTab,
          cronOutput,
          setCronOutput,
          cronHistory,
          cronLoading,
          handleRunCron,
          handleTestPing,
        }} />
      )}

      {/* === TAB 5: DATABASE & CACHE === */}
      {activeTab === 'database' && (
        <DatabaseTab
          backupLoading={backupLoading}
          fullBackupLoading={fullBackupLoading}
          handleDownloadSnapshot={handleDownloadSnapshot}
          handleDownloadFullSystemSnapshot={handleDownloadFullSystemSnapshot}
          lastBackup={lastBackup}
          janitorStats={janitorStats}
          janitorLoading={janitorLoading}
          janitorCleaning={janitorCleaning}
          janitorScope={janitorScope}
          fetchJanitorStats={fetchJanitorStats}
          handleRunJanitorClean={handleRunJanitorClean}
          telemetry={telemetry}
        />
      )}

      {/* === TAB 6: SERVER FILE MANAGER & CODE EDITOR === */}
      {activeTab === 'editor' && (
        <ServerCodeEditorTab />
      )}

      {/* ── Beautiful Clear Log Confirmation Modal ── */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-inner">
                <FiTrash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Clear Server Error Log?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to clear <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-500 font-mono text-[11px]">{serverErrorLog?.log_file || 'error_log'}</code>?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-1.5 text-rose-800 dark:text-rose-300">
              <div className="font-bold flex items-center gap-1.5">
                <FiAlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Permanent Truncation</span>
              </div>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                This will wipe all <strong>{serverErrorLog?.line_count || 0} historical error lines</strong> ({serverErrorLog?.file_size_formatted || '0 KB'}) on the Hostinger server. Future PHP errors will continue to be logged automatically.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={serverLogLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearServerErrorLog}
                disabled={serverLogLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {serverLogLoading ? (
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FiTrash2 className="w-3.5 h-3.5" />
                )}
                <span>Yes, Clear Server Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stunning Animated Backup & Disaster Recovery Progress Modal ── */}
      {progressModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative overflow-hidden bg-slate-900 border border-cyan-500/30 rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-6 text-white text-center">
            {/* Ambient glowing blobs */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Icon & Title */}
            <div className="relative z-10 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-inner">
                {progressModal.isComplete ? (
                  <FiCheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
                ) : (
                  <FiDatabase className="w-8 h-8 text-cyan-400 animate-pulse" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {progressModal.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {progressModal.subtitle}
                </p>
              </div>
            </div>

            {/* Glowing Big Percentage Counter */}
            <div className="relative z-10 space-y-2">
              <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent font-mono tracking-tighter">
                {progressModal.progress}%
              </div>
              <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
                {!progressModal.isComplete && (
                  <FiRefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                )}
                <span>{progressModal.stage}</span>
              </div>
            </div>

            {/* Liquid Multi-color Progress Bar */}
            <div className="relative z-10 w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-slate-700/80 shadow-inner overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-300 ease-out relative"
                style={{ width: `${progressModal.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
              </div>
            </div>

            {/* File info pill on complete */}
            {progressModal.isComplete && progressModal.filename && (
              <div className="relative z-10 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-1.5 text-xs">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>Archive Ready & Verified</span>
                </div>
                <div className="font-mono text-slate-200 text-[11px] truncate select-all">
                  {progressModal.filename}
                </div>
                <div className="text-slate-400 text-[10px]">
                  Archive Size: <span className="font-bold text-emerald-300">{progressModal.size}</span> &bull; Redundant server mirror saved in <code className="text-cyan-400 font-mono">/server/backups</code>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="relative z-10 pt-2 flex items-center justify-center gap-3">
              {progressModal.isComplete ? (
                <button
                  type="button"
                  onClick={() => setProgressModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                >
                  Done & Close
                </button>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  🛡️ Zero data loss guaranteed &bull; Please keep this tab open until compression finishes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
