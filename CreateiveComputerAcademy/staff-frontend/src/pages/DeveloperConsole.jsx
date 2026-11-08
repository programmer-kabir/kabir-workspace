import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeveloperConsole } from '../hooks/useDeveloperConsole';
import DeveloperHeader from '../components/DeveloperConsole/DeveloperHeader';
import TelemetryTab from '../components/DeveloperConsole/TelemetryTab';
import ImpersonatorTab from '../components/DeveloperConsole/ImpersonatorTab';
import SystemLogsTab from '../components/DeveloperConsole/SystemLogsTab';
import ApiTesterTab from '../components/DeveloperConsole/ApiTesterTab';
import CronsTab from '../components/DeveloperConsole/CronsTab';
import DatabaseTab from '../components/DeveloperConsole/DatabaseTab';
import ServerCodeEditorTab from '../components/DeveloperConsole/ServerCodeEditorTab';
import ClearServerErrorLogModal from '../components/DeveloperConsole/ClearServerErrorLogModal';
import BackupProgressModal from '../components/DeveloperConsole/BackupProgressModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function DeveloperConsole() {
  const { currentUser, impersonateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    activeTab,
    telemetry, setTelemetry,
    pusherStatus, setPusherStatus,
    cronLoading, setCronLoading,
    cronOutput, setCronOutput,
    cronHistory, setCronHistory,
    selectedCronTab, setSelectedCronTab,
    logFilter, setLogFilter,
    janitorStats, setJanitorStats,
    janitorLoading, setJanitorLoading,
    janitorCleaning, setJanitorCleaning,
    janitorScope, setJanitorScope,
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
    maintenanceSaving, setMaintenanceSaving,
    editMaintenanceMsg, setEditMaintenanceMsg,
    editUserMaintenanceMsg, setEditUserMaintenanceMsg,
    wsLiveReceived, setWsLiveReceived,
    progressModal, setProgressModal,
    maintenanceConfig, setMaintenanceConfig,
    isClearModalOpen, setIsClearModalOpen,
    logs, setLogs,
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
    copySpecs,
    filteredLogs,
  } = useDeveloperConsole();

  return (
    <div className="space-y-6 animate-fadeIn  select-text mx-auto">
      {/* 1. Overview Header Banner (Only on Overview page) */}
      {activeTab === 'overview' && <DeveloperHeader />}

      {/* 2. Standalone Page Content */}

      {/* === PAGE 1: TELEMETRY OVERVIEW === */}
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

      {/* ── Clear Server Error Log Modal ── */}
      <ClearServerErrorLogModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={confirmClearServerErrorLog}
        serverErrorLog={serverErrorLog}
        loading={serverLogLoading}
      />

      {/* ── Backup & Disaster Recovery Progress Modal ── */}
      <BackupProgressModal
        progressModal={progressModal}
        onClose={() => setProgressModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
