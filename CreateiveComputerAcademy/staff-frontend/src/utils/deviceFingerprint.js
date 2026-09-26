// deviceFingerprint.js - Client-Side Hardware, Browser, GPU, Model Code, and Geolocation Profiler

/**
 * Generate a fast hash from a string
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

/**
 * Generate Canvas Fingerprint
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'nocanvas';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('CCA Security, 🔒 #1', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('CCA Security, 🔒 #1', 4, 17);
    
    return hashString(canvas.toDataURL());
  } catch (e) {
    return 'canvas_err';
  }
}

/**
 * Extract WebGL GPU Renderer
 */
function getGpuRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return renderer.replace(/Direct3D[^\)]+\)/i, '').replace(/OpenGL Engine/i, '').trim();
  } catch (e) {
    return '';
  }
}

/**
 * Format GPU Chipset into human friendly description
 */
function formatChipset(gpu) {
  if (!gpu) return { brand: 'Android Smartphone', model: 'Android Phone' };
  
  const cleaned = gpu
    .replace(/ANGLE\s*\(/i, '')
    .replace(/\,\s*OpenGL[^\)]+\)/i, '')
    .replace(/\(TM\)/gi, '')
    .replace(/Qualcomm\,\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Qualcomm Adreno GPUs
  if (/618/i.test(cleaned)) {
    return { brand: 'Qualcomm Snapdragon', model: 'Snapdragon 732G/720G Phone (Adreno 618)' };
  }
  if (/619/i.test(cleaned)) {
    return { brand: 'Qualcomm Snapdragon', model: 'Snapdragon 695 5G Phone (Adreno 619)' };
  }
  if (/610/i.test(cleaned)) {
    return { brand: 'Qualcomm Snapdragon', model: 'Snapdragon 680/665 Phone (Adreno 610)' };
  }
  if (/640|642|650|660/i.test(cleaned)) {
    return { brand: 'Qualcomm Snapdragon', model: `Snapdragon Flagship (${cleaned})` };
  }
  if (/730|740|Adreno/i.test(cleaned)) {
    return { brand: 'Qualcomm Snapdragon', model: `Snapdragon Phone (${cleaned})` };
  }

  // MediaTek Mali GPUs
  if (/G57/i.test(cleaned)) {
    return { brand: 'MediaTek Dimensity/Helio', model: 'MediaTek G57 Phone (Dimensity/G96)' };
  }
  if (/G52/i.test(cleaned)) {
    return { brand: 'MediaTek Helio G85/G80', model: 'MediaTek G52 Phone (Helio G85/G80)' };
  }
  if (/G68|G77|G78|G710|G720/i.test(cleaned)) {
    return { brand: 'MediaTek Dimensity', model: `MediaTek Dimensity 5G (${cleaned})` };
  }
  if (/Mali/i.test(cleaned)) {
    return { brand: 'MediaTek / Exynos', model: `Android Phone (${cleaned})` };
  }

  // PowerVR GPUs
  if (/PowerVR|GE8320/i.test(cleaned)) {
    return { brand: 'MediaTek Helio G35/P35', model: 'MediaTek Helio Phone (PowerVR)' };
  }

  return { brand: 'Android Smartphone', model: `Android Device (${cleaned})` };
}

/**
 * Map raw model strings (e.g. CPH2269, V2027, SM-A135F, M2101K6G) to Brand & Friendly Name
 */
function resolveBrandAndModel(rawModel, rawBrand, ua, gpu) {
  let brand = rawBrand || '';
  let model = rawModel || '';

  const check = (rawModel + ' ' + ua).toUpperCase();

  // Check explicit model codes from UA or Hints
  if (/CPH[0-9]+|PCH[0-9]+/i.test(check)) {
    brand = 'OPPO';
    const m = check.match(/CPH[0-9]+/i);
    model = m ? `OPPO (${m[0]})` : (rawModel || 'OPPO Mobile');
  }
  else if (/V[0-9]{4}[A-Z]?|PD[0-9]+/i.test(check) && !/WINDOWS|CHROME|VERSION/i.test(check)) {
    brand = 'Vivo';
    const m = check.match(/V[0-9]{4}[A-Z]?/i);
    model = m ? `Vivo (${m[0]})` : (rawModel || 'Vivo Mobile');
  }
  else if (/REDMI|POCO|XIAOMI|MI\s|2[0-9]{3}[A-Z0-9]+|M2[0-9]{3}/i.test(check)) {
    brand = 'Xiaomi';
    const m = check.match(/(REDMI[^\;\)]+|POCO[^\;\)]+|2[0-9]{3}[A-Z0-9]+|M2[0-9]{3}[A-Z0-9]+)/i);
    model = m ? m[0].trim() : (rawModel || 'Xiaomi Device');
  }
  else if (/SM-[A-Z0-9]+|GT-[A-Z0-9]+|GALAXY/i.test(check)) {
    brand = 'Samsung';
    const m = check.match(/SM-[A-Z0-9]+/i);
    model = m ? `Samsung Galaxy (${m[0]})` : (rawModel || 'Samsung Galaxy');
  }
  else if (/RMX[0-9]+|REALME|NARZO/i.test(check)) {
    brand = 'Realme';
    const m = check.match(/RMX[0-9]+/i);
    model = m ? `Realme (${m[0]})` : (rawModel || 'Realme Mobile');
  }
  else if (/X[0-9]{3,4}[A-Z]?|INFINIX/i.test(check)) {
    brand = 'Infinix';
    const m = check.match(/X[0-9]{3,4}[A-Z]?/i);
    model = m ? `Infinix (${m[0]})` : (rawModel || 'Infinix Phone');
  }
  else if (/KG[0-9]+|CK[0-9]+|LH[0-9]+|BD[0-9]+|TECNO/i.test(check)) {
    brand = 'Tecno';
    const m = check.match(/(KG|CK|LH|BD)[0-9]+/i);
    model = m ? `Tecno (${m[0]})` : (rawModel || 'Tecno Phone');
  }
  else if (/PIXEL/i.test(check)) {
    brand = 'Google';
    const m = check.match(/PIXEL\s?[0-9A-Z\s]+/i);
    model = m ? m[0].trim() : 'Google Pixel';
  }
  else if (/ONEPLUS|IN20[0-9]+|NE22[0-9]+/i.test(check)) {
    brand = 'OnePlus';
    model = rawModel || 'OnePlus Phone';
  }
  else if (/IPHONE/i.test(check)) {
    brand = 'Apple';
    model = 'iPhone';
  } else if (/IPAD/i.test(check)) {
    brand = 'Apple';
    model = 'iPad';
  }

  // If specific rawModel code was provided (e.g. from Client Hints), KEEP and show it!
  if (rawModel && rawModel !== 'Standard PC' && rawModel !== 'Desktop Computer' && rawModel !== 'Android Smartphone' && rawModel !== 'Android Phone') {
    model = rawModel;
    if (!brand || brand === 'Android Phone') {
      if (/SM-|GT-|Galaxy/i.test(rawModel)) brand = 'Samsung';
      else if (/CPH|PCH|OPPO/i.test(rawModel)) brand = 'OPPO';
      else if (/V[0-9]{4}|Vivo|PD[0-9]/i.test(rawModel)) brand = 'Vivo';
      else if (/Redmi|POCO|Xiaomi|2[0-9]{3}|M2[0-9]{3}/i.test(rawModel)) brand = 'Xiaomi';
      else if (/RMX|Realme/i.test(rawModel)) brand = 'Realme';
      else if (/X[0-9]{3,4}|Infinix/i.test(rawModel)) brand = 'Infinix';
      else if (/KG|CK|LH|BD|Tecno/i.test(rawModel)) brand = 'Tecno';
      else if (/Pixel/i.test(rawModel)) brand = 'Google';
      else if (/iPhone|iPad/i.test(rawModel)) brand = 'Apple';
      else brand = 'Android Device';
    }
  } else if (!brand || brand === 'Android Phone' || brand === 'Generic PC' || brand === 'Unknown Brand') {
    const chipsetInfo = formatChipset(gpu);
    brand = chipsetInfo.brand;
    model = chipsetInfo.model;
  }

  return { brand: brand || 'Android Smartphone', model: model || 'Android Phone' };
}

/**
 * Parse Device Model, Brand, OS, GPU and Browser
 */
export async function parseDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  let deviceBrand = '';
  let deviceModel = '';
  let osName = 'Unknown OS';
  let browserName = 'Unknown Browser';

  const gpu = getGpuRenderer();

  // 1. Detect Touch & Mobile Indicators
  const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
                  ('ontouchstart' in window) || 
                  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const minDimension = Math.min(window.screen.width, window.screen.height);
  const maxDimension = Math.max(window.screen.width, window.screen.height);
  
  const isMobileUA = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/i.test(ua);
  const isTabletUA = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);

  if (isTabletUA || (isTouch && !isMobileUA && minDimension > 600 && maxDimension <= 1366)) {
    deviceType = 'Tablet';
  } else if (isMobileUA || (isTouch && minDimension <= 850) || (navigator.userAgentData && navigator.userAgentData.mobile)) {
    deviceType = 'Mobile';
  }

  // 2. High-Entropy Client Hints (model, platform, architecture)
  if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    try {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'model', 
        'platform', 
        'platformVersion', 
        'architecture', 
        'bitness', 
        'uaFullVersion'
      ]);
      if (hints.model) {
        deviceModel = hints.model;
      }
      if (hints.platform) {
        osName = hints.platform + (hints.platformVersion ? ` ${hints.platformVersion.split('.')[0]}` : '');
      }
      if (navigator.userAgentData.mobile) {
        deviceType = 'Mobile';
      }
    } catch (e) {
      // Fallback
    }
  }

  // 3. Fallback OS & Build Parsing from UA
  if (osName === 'Unknown OS' || osName === 'Linux') {
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android\s([0-9\.]+)/i);
      osName = match ? `Android ${match[1]}` : 'Android';
      deviceType = 'Mobile';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      const match = ua.match(/OS\s([0-9\_]+)/i);
      osName = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
      deviceType = 'Mobile';
    } else if (/Windows NT 10.0/i.test(ua)) osName = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(ua)) osName = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(ua)) osName = 'Windows 7';
    else if (/Mac OS X/i.test(ua)) osName = 'macOS';
    else if (/Linux/i.test(ua)) {
      if (isTouch || deviceType === 'Mobile') {
        osName = 'Android';
        deviceType = 'Mobile';
      } else {
        osName = 'Linux';
      }
    }
  }

  // Check for Android Build Code in UA if model is still empty
  if (!deviceModel || deviceModel === 'Standard PC') {
    const buildMatch = ua.match(/Build\/([A-Z0-9\.\_]+)/i);
    if (buildMatch) {
      deviceModel = `Build ${buildMatch[1]}`;
    }
  }

  // 4. Resolve Brand and Model with Comprehensive Mapping & GPU
  if (deviceType === 'Mobile' || deviceType === 'Tablet') {
    const resolved = resolveBrandAndModel(deviceModel, deviceBrand, ua, gpu);
    deviceBrand = resolved.brand;
    deviceModel = resolved.model;
  } else {
    deviceBrand = osName.includes('Windows') ? 'Windows PC' : (osName.includes('macOS') ? 'Apple Mac' : 'Linux PC');
    deviceModel = `${osName} (${navigator.platform || 'x64'})`;
  }

  // 5. Detect Browser
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/([0-9\.]+)/i);
    browserName = match ? `Edge ${match[1].split('.')[0]}` : 'Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) {
    const match = ua.match(/Chrome\/([0-9\.]+)/i);
    browserName = match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/([0-9\.]+)/i);
    browserName = match ? `Safari ${match[1].split('.')[0]}` : 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/([0-9\.]+)/i);
    browserName = match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
  } else if (/OPR\//i.test(ua)) {
    browserName = 'Opera';
  }

  // 6. Network Type Probe
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const networkType = connection ? (connection.effectiveType || connection.type || (deviceType === 'Mobile' ? 'mobile_network' : 'wifi/broadband')) : (deviceType === 'Mobile' ? 'mobile_network' : 'wifi/broadband');

  // 7. Device Fingerprint
  const canvasHash = getCanvasFingerprint();
  const screenSpec = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const rawFingerprint = `${ua}|${screenSpec}|${deviceModel}|${gpu}|${navigator.language}|${canvasHash}`;
  const deviceFingerprint = 'dev_' + hashString(rawFingerprint) + hashString(screenSpec + canvasHash);

  return {
    device_type: deviceType,
    device_brand: deviceBrand,
    device_model: deviceModel,
    os_name: osName,
    browser_name: browserName,
    screen_res: `${window.screen.width}x${window.screen.height}`,
    network_type: networkType,
    device_fingerprint: deviceFingerprint,
    user_agent: ua
  };
}

/**
 * Retrieve User GPS Location with Promise
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 15
        });
      },
      (err) => {
        console.warn('Geolocation probe notice:', err.message);
        resolve(null);
      },
      options
    );
  });
}
