import React, { useState } from 'react';
import {
  FiDownloadCloud, FiLock, FiAlertTriangle, FiCheckCircle,
  FiRefreshCw, FiExternalLink, FiX, FiShield, FiArrowRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import updateService from '../services/UpdateService';

export default function ForceUpdateModal({ updateInfo, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, transferred: 0, total: 0, completed: false });
  const [error, setError] = useState('');

  if (!updateInfo || !updateInfo.has_update) return null;

  const isMandatory = !!updateInfo.is_mandatory;
  const release = updateInfo.release || {};
  const currentVer = updateInfo.current_version || '1.0.0';
  const latestVer = updateInfo.latest_version || release.version || '1.0.1';
  const downloadUrl = release.download_url || '';

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleStartUpdate = async () => {
    if (!downloadUrl) {
      setError('Installer download URL is missing from server. Please contact Admin.');
      return;
    }

    try {
      setDownloading(true);
      setError('');
      setProgress({ percent: 0, transferred: 0, total: 0, completed: false });

      await updateService.downloadAndInstall(downloadUrl, (p) => {
        if (p) {
          setProgress({
            percent: p.percent || 0,
            transferred: p.transferred || 0,
            total: p.total || 0,
            completed: !!p.completed
          });
        }
      });
    } catch (err) {
      console.error('Update install error:', err);
      setDownloading(false);
      setError(err?.message || 'Failed to download or launch update. You can try manual download.');
    }
  };

  const handleOpenManual = () => {
    if (downloadUrl) {
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(downloadUrl);
      } else {
        window.open(downloadUrl, '_blank');
      }
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'security':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">Security Patch</span>;
      case 'major':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">Major Upgrade</span>;
      case 'bugfix':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">Bug Fix</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">New Feature</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 overflow-hidden ring-1 ring-white/10">
        {/* Glow Accent Backdrop */}
        <div className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-30 pointer-events-none ${isMandatory ? 'bg-rose-600' : 'bg-indigo-600'}`} />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none bg-violet-600" />

        {/* Optional Close Button */}
        {!isMandatory && onClose && !downloading && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
          >
            <FiX size={18} />
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="relative flex items-center gap-4 mb-5">
          <div className={`p-3.5 rounded-2xl text-white shadow-xl ${
            isMandatory
              ? 'bg-gradient-to-tr from-rose-600 to-orange-500 shadow-rose-500/25 ring-2 ring-rose-500/30'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/25 ring-2 ring-indigo-500/30'
          }`}>
            {isMandatory ? <FiLock size={26} /> : <FiDownloadCloud size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                {isMandatory ? 'Action Required: Update App' : 'New Update Available'}
              </h2>
              {getCategoryBadge(release.category)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isMandatory
                ? 'এটেন্ডেন্স ও কাজ শুরু করার পূর্বে নতুন ভার্সন আপডেট করা বাধ্যতামূলক'
                : 'নতুন ফিচার ও পারফরম্যান্স সুবিধার জন্য অ্যাপটি আপডেট করে নিন'}
            </p>
          </div>
        </div>

        {/* Version Comparison Pill */}
        <div className="relative flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 mb-5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current:</span>
            <span className="font-mono font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-800">
              v{currentVer}
            </span>
          </div>

          <FiArrowRight className="text-slate-500" size={16} />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-semibold">Latest:</span>
            <span className="font-mono font-black text-emerald-300 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
              v{latestVer}
            </span>
          </div>
        </div>

        {/* Changelog Card */}
        {release.release_notes && (
          <div className="relative mb-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <HiSparkles className="text-indigo-400" size={14} />
                What's New in v{latestVer}
              </span>
              {release.file_size > 0 && (
                <span className="text-slate-500 font-mono font-normal">
                  {formatBytes(release.file_size)}
                </span>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans scrollbar-thin scrollbar-thumb-slate-700">
              {release.release_notes}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <FiAlertTriangle className="flex-shrink-0 mt-0.5" size={15} />
            <div>{error}</div>
          </div>
        )}

        {/* Download & Progress State */}
        {downloading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <FiRefreshCw className="animate-spin text-indigo-400" size={14} />
                {progress.completed ? 'Launching Installer...' : 'Downloading update package...'}
              </span>
              <span className="font-mono text-indigo-400 font-bold">
                {progress.percent}% {progress.total > 0 && `(${formatBytes(progress.transferred)} / ${formatBytes(progress.total)})`}
              </span>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
                style={{ width: `${Math.max(5, progress.percent)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              {progress.completed
                ? 'ডাউনলোড সম্পন্ন! অ্যাপ রিস্টার্ট নিয়ে স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।'
                : 'দয়া করে অপেক্ষা করুন। ক্লাউডফ্লেয়ার ফাস্ট সিডিএন থেকে ফাইল নামানো হচ্ছে...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleStartUpdate}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-xl transition active:scale-[0.98] ${
                isMandatory
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 shadow-rose-500/25 ring-1 ring-white/20'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 ring-1 ring-white/20'
              }`}
            >
              <FiDownloadCloud size={18} />
              {isMandatory ? 'Update Now & Continue' : 'Download & Install Update'}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleOpenManual}
                className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
              >
                <FiExternalLink size={12} />
                Direct Browser Download (.exe)
              </button>

              {!isMandatory && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
                >
                  Remind Me Later
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
