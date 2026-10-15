/**
 * Desktop Device & Location Profiler for CCA Attendance Security
 */

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function getDesktopCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'desktop_canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('CCA Desktop App Security', 4, 15);
    return hashString(canvas.toDataURL());
  } catch (e) {
    return 'desktop_hw_hash';
  }
}

export async function parseDesktopDeviceInfo() {
  const canvasHash = getDesktopCanvasFingerprint();
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  const rawId = `DESKTOP_WIN_${cores}C_${mem}GB_${screenRes}_${canvasHash}`;

  return {
    device_type: 'Desktop',
    device_brand: 'Windows Workstation',
    device_model: `PC (${cores} Cores, ${screenRes})`,
    os_name: 'Windows',
    browser_name: 'CCA Attendance Desktop',
    screen_res: screenRes,
    device_fingerprint: hashString(rawId)
  };
}

export function getDesktopLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: position.coords.accuracy || 10
        });
      },
      (err) => {
        console.debug('Geolocation fallback to office IP', err.message);
        resolve({});
      },
      { timeout: 5000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}
