import axios from 'axios';
import { getApiBase } from '../utils/api';

class UpdateService {
  constructor() {
    this.currentVersion = '2.0.0';
    this.initVersion();
  }

  async initVersion() {
    try {
      if (window.electronAPI?.getAppVersion) {
        this.currentVersion = await window.electronAPI.getAppVersion();
      }
    } catch (e) {
      console.warn('Could not read electron app version:', e);
    }
  }

  async getVersion() {
    if (window.electronAPI?.getAppVersion) {
      try {
        const v = await window.electronAPI.getAppVersion();
        if (v) this.currentVersion = v;
      } catch (e) {}
    }
    return this.currentVersion;
  }

  /**
   * Check for app updates against the central API
   * @returns {Promise<{has_update: boolean, is_mandatory: boolean, latest_version: string, release: object, current_version: string}>}
   */
  async checkForUpdates() {
    try {
      const currentVer = await this.getVersion();
      const apiBase = getApiBase();

      const response = await axios.get(`${apiBase}api/app_version/check_update.php`, {
        params: { client_version: currentVer },
        timeout: 8000
      });

      if (response.data && response.data.status === 'success') {
        return {
          ...response.data,
          current_version: currentVer
        };
      }

      return { has_update: false, is_mandatory: false, current_version: currentVer };
    } catch (error) {
      console.warn('Update check failed (continuing offline/gracefully):', error?.message || error);
      return { has_update: false, is_mandatory: false, current_version: this.currentVersion };
    }
  }

  /**
   * Send heartbeat to register this workstation's app version in the fleet DB
   */
  async logHeartbeat(user) {
    if (!user || !user.id) return;
    try {
      const currentVer = await this.getVersion();
      let deviceMeta = { hostname: 'Workstation', platform: 'Windows' };

      if (window.electronAPI?.getDeviceMetadata) {
        try {
          const meta = await window.electronAPI.getDeviceMetadata();
          if (meta) {
            deviceMeta = {
              hostname: meta.hostname || 'Workstation',
              platform: `${meta.platform || 'win32'} ${meta.arch || 'x64'}`
            };
          }
        } catch (e) {}
      }

      const apiBase = getApiBase();
      await axios.post(`${apiBase}api/app_version/log_version.php`, {
        user_id: user.id,
        current_version: currentVer,
        workstation_name: deviceMeta.hostname,
        os_platform: deviceMeta.platform
      }, { timeout: 6000 });
    } catch (err) {
      // Non-blocking background telemetry
      console.warn('Version telemetry heartbeat skipped:', err?.message || err);
    }
  }

  /**
   * Download and launch installer
   */
  async downloadAndInstall(downloadUrl, onProgress) {
    if (!downloadUrl) throw new Error('Missing download URL');

    if (window.electronAPI?.installUpdate) {
      let unsubscribe = null;
      if (onProgress && window.electronAPI.onUpdateProgress) {
        unsubscribe = window.electronAPI.onUpdateProgress(onProgress);
      }
      try {
        const result = await window.electronAPI.installUpdate(downloadUrl);
        return result;
      } finally {
        if (unsubscribe) unsubscribe();
      }
    } else {
      // Web / Dev mode fallback
      window.open(downloadUrl, '_blank');
      return { success: true, mode: 'browser_fallback' };
    }
  }
}

export const updateService = new UpdateService();
export default updateService;
