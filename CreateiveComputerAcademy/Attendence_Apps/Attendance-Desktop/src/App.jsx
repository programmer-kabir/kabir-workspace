import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import TitleBar from './components/TitleBar';
import Login from './components/Login';
import AttendanceView from './components/AttendanceView';
import ForceUpdateModal from './components/ForceUpdateModal';
import updateService from './services/UpdateService';

function App() {
  const { currentUser, logout } = useAuth();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      const res = await updateService.checkForUpdates();
      if (res && res.has_update) {
        setUpdateInfo(res);
        setShowUpdateModal(true);
      }
    } catch (e) {
      console.warn('Update check routine error:', e);
    }
  }, []);

  // Listen for forced update requirements triggered during Check-In
  useEffect(() => {
    const handleForceRequired = (e) => {
      const detail = e?.detail || {};
      const releaseData = detail.release || {
        version: detail.required_version,
        download_url: detail.download_url,
        release_notes: detail.message
      };

      setUpdateInfo(prev => ({
        ...(prev || {}),
        has_update: true,
        is_mandatory: true,
        latest_version: detail.required_version || prev?.latest_version,
        release: releaseData
      }));
      setShowUpdateModal(true);
    };

    window.addEventListener('cca-force-update-required', handleForceRequired);
    return () => window.removeEventListener('cca-force-update-required', handleForceRequired);
  }, []);

  // Startup update check & periodic check every 30 minutes
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Log workstation heartbeat telemetry when staff is active
  useEffect(() => {
    if (!currentUser?.id) return;

    updateService.logHeartbeat(currentUser);
    const heartbeatInterval = setInterval(() => {
      updateService.logHeartbeat(currentUser);
    }, 15 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none border border-slate-800 shadow-2xl">
      {/* Sleek Frameless Desktop Titlebar */}
      <TitleBar onLogout={currentUser ? logout : null} user={currentUser} />

      {/* Main App Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentUser ? (
          <AttendanceView />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
              <Login />
            </div>
          </div>
        )}
      </main>

      {/* Version Control & Force Update Lockout Modal */}
      {showUpdateModal && updateInfo && (
        <ForceUpdateModal
          updateInfo={updateInfo}
          onClose={() => {
            if (!updateInfo.is_mandatory) {
              setShowUpdateModal(false);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
