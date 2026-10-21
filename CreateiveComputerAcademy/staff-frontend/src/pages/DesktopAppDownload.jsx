import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiDownload, FiMonitor, FiCheckCircle, FiShield, FiCpu, 
  FiZap, FiClock, FiHelpCircle, FiChevronRight, FiRefreshCw, 
  FiInfo, FiExternalLink, FiLayers, FiAlertTriangle 
} from 'react-icons/fi';
import { FaWindows } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';

const DesktopAppDownload = () => {
  const { currentUser } = useAuth();
  const [releaseInfo, setReleaseInfo] = useState({
    version: '1.0.0',
    title: 'CCA Staff Desktop App (Windows)',
    releaseNotes: [
      '⚡ Zero-Prompt Instant Check-In: All media, location, and screen permissions are granted 100% silently upon clicking Check In.',
      '🖥️ Crisp 24 FPS Live Surveillance: Optimized 3.0 Mbps WebRTC screen streaming with detail contentHint for crystal-clear monitoring.',
      '⏱️ 5-Minute Inactivity Watchdog: Tracks native mouse & workstation idle state without locking up on acknowledge/resume.',
      '🥭 Mango Break & Tiffin Integration: Real-time countdown clock and instant tray punch action.',
      '🚀 Auto-Start on System Boot: Silently boots with Windows and stays accessible in the System Tray.'
    ],
    fileSize: '4545 MB',
    releaseDate: 'October 2025',
    downloadUrl: 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/releases/v1.0.0/CCA-Attendance-Setup.exe',
    portableUrl: 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/releases/v1.0.0/CCA-Attendance-Standalone.exe'
  });
  const [downloadingType, setDownloadingType] = useState(null);

  // Fetch real-time release status from backend if available
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const rawBase = import.meta.env.VITE_API_BASE_URL || '';
        const apiBase = rawBase ? (rawBase.endsWith('/') ? rawBase : rawBase + '/') : '';
        const res = await axios.get(apiBase + 'api/app_version/get_latest_release.php');
        if (res.data?.status === 'success' && res.data?.latest) {
          const l = res.data.latest;
          setReleaseInfo(prev => ({
            ...prev,
            version: l.version || prev.version,
            title: l.release_title || prev.title,
            releaseNotes: l.release_notes ? l.release_notes.split('\n').filter(Boolean) : prev.releaseNotes,
            downloadUrl: l.download_url || prev.downloadUrl,
            fileSize: l.file_size ? `${Math.round(l.file_size / (1024 * 1024))} MB` : prev.fileSize
          }));
        }
      } catch (e) {
        // Fallback to embedded production v1.0.0
      }
    };
    fetchLatest();
  }, []);

  const handleDownload = (type) => {
    setDownloadingType(type);
    const targetUrl = type === 'portable' 
      ? releaseInfo.portableUrl 
      : releaseInfo.downloadUrl;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = type === 'portable' ? 'CCA-Staff-App-Standalone.exe' : 'CCA-Staff-App-Setup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingType(null);
    }, 2500);
  };

  return (
    <div className="mx-auto space-y-8 animate-fadeIn">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-black tracking-wider uppercase backdrop-blur-sm">
              <FaWindows size={13} className="text-cyan-400" />
              <span>Official Windows App &bull; v{releaseInfo.version}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              CCA Staff <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Desktop Workstation App
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              অফিস থেকে হাজিরা দেওয়ার জন্য অফিসিয়াল উইন্ডোজ ডেসকটপ অ্যাপ। অ্যাপ চালু করে <strong>"Check In Now"</strong> বাটনে ক্লিক করলেই স্বয়ংক্রিয়ভাবে পারমিশন নিয়ে সেকেন্ডেই হাজিরা নিশ্চিত করবে এবং ব্যাকগ্রাউন্ডে সার্বক্ষণিক প্রেজেন্স সিঙ্ক রাখবে।
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-400" /> Windows 10 & 11 (64-bit)
              </div>
              <div className="flex items-center gap-1.5">
                <FiZap className="text-amber-400" /> 1-Click Zero-Prompt Punch
              </div>
              <div className="flex items-center gap-1.5">
                <FiShield className="text-cyan-400" /> Automated Inactivity Watchdog
              </div>
            </div>
          </div>

          {/* Quick Download Card */}
          <div className="shrink-0 w-full lg:w-80 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Release Status</span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LATEST STABLE
              </span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleDownload('setup')}
                disabled={downloadingType === 'setup'}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-cyan-500/25 cursor-pointer transition-all duration-200 transform active:scale-95 disabled:opacity-75"
              >
                <FiDownload size={18} />
                <span>{downloadingType === 'setup' ? 'Downloading...' : 'Download Setup (.exe)'}</span>
              </button>

              {/* Portable edition hidden for future release */}
              {/* <button
                type="button"
                onClick={() => handleDownload('portable')}
                disabled={downloadingType === 'portable'}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-bold text-xs border border-white/10 cursor-pointer transition-all duration-200"
              >
                <FiCpu size={16} className="text-cyan-400" />
                <span>{downloadingType === 'portable' ? 'Downloading...' : 'Download Portable (.exe)'}</span>
              </button> */}
            </div>

            <div className="text-[11px] text-center text-slate-400 space-y-1">
              <p>Setup File Size: ~{releaseInfo.fileSize}</p>
              <p className="text-slate-500">Includes auto-startup & system tray integration</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Installation & Quick Setup Guide */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FiLayers className="text-cyan-500" />
          <span>সহজ ৩ ধাপে সেটআপ গাইড</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
            <span className="absolute -top-3 -right-3 text-7xl font-black text-slate-100 dark:text-slate-700/30 select-none">1</span>
            <div className="relative z-10 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black">
                <FiDownload size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">১. অ্যাপ ডাউনলোড করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                উপরের <strong>"Download Setup (.exe)"</strong> বাটনে ক্লিক করে ফাইলটি আপনার পিসিতে সেভ করুন।
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
            <span className="absolute -top-3 -right-3 text-7xl font-black text-slate-100 dark:text-slate-700/30 select-none">2</span>
            <div className="relative z-10 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <FiMonitor size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">২. ইনস্টল ও লগইন করুন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                ডাউনলোড করা ফাইলটি ডাবল ক্লিক করে ইনস্টল করুন এবং আপনার স্টাফ ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden">
            <span className="absolute -top-3 -right-3 text-7xl font-black text-slate-100 dark:text-slate-700/30 select-none">3</span>
            <div className="relative z-10 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                <FiCheckCircle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">৩. এক ক্লিকে চেক-ইন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                <strong>Check In Now</strong> বাটনে ক্লিক করুন। যাবতীয় পারমিশন অটোমেটিক সক্রিয় হবে এবং কাজ শুরু করতে পারবেন।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Release Notes & Changelog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                রিলিজ নোট ও নতুন ফিচারসমূহ (v{releaseInfo.version})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{releaseInfo.releaseDate}</span>
          </div>

          <div className="space-y-3 pt-1">
            {releaseInfo.releaseNotes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <FiCheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workstation Compatibility & FAQ Card */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FiShield className="text-cyan-500" />
              <span>সিস্টেম রিকোয়ারমেন্টস</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <span className="font-semibold text-slate-400">অপারেটিং সিস্টেম</span>
                <span className="font-bold text-slate-800 dark:text-white">Windows 10 / 11 (64-bit)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <span className="font-semibold text-slate-400">র‍্যাম (RAM)</span>
                <span className="font-bold text-slate-800 dark:text-white">4 GB বা ততোধিক</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <span className="font-semibold text-slate-400">ডিস্ক স্পেস</span>
                <span className="font-bold text-slate-800 dark:text-white">~200 MB ফ্রি স্পেস</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-semibold text-slate-400">নেটওয়ার্ক</span>
                <span className="font-bold text-emerald-500">CCA Office WiFi / LAN</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
              <FiAlertTriangle size={15} />
              <span>SmartScreen সিকিউরিটি প্রম্পট আসলে:</span>
            </div>
            <p className="leading-relaxed opacity-90">
              Windows Defender যদি <em>"Windows protected your PC"</em> মেসেজ দেখায়, তবে <strong>"More info"</strong>-তে ক্লিক করে <strong>"Run anyway"</strong> চাপুন। এটি CCA-এর অভ্যন্তরীণ অফিসিয়াল সিকিউর অ্যাপ।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopAppDownload;
