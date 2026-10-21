import React, { useState, useEffect } from 'react';
import { FiVideo, FiUploadCloud, FiHardDrive } from 'react-icons/fi';
import workstationRecorderService from '../services/WorkstationRecorderService';
import VideoSpoolModal from './VideoSpoolModal';

const HeaderVideoSpoolBadge = () => {
  const [status, setStatus] = useState(workstationRecorderService.currentStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = workstationRecorderService.subscribeStatus((st) => {
      setStatus({ ...st });
    });
    return unsub;
  }, []);

  const formatSize = (bytes) => {
    if (!bytes) return '0MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)}GB`;
    return `${Math.round(mb)}MB`;
  };

  const isUploading = Boolean(status.currentUpload);
  const hasSpool = (status.spoolCount || 0) > 0;
  const isRecording = status.isRecording;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer titlebar-no-drag ${
          isUploading
            ? 'bg-indigo-600 text-white shadow-indigo-600/30 shadow-md animate-pulse'
            : hasSpool
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
            : isRecording
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        }`}
        title="সার্ভিল্যান্স ভিডিও স্পুল ও ক্লাউড স্টোরেজ স্ট্যাটাস দেখুন"
      >
        {isUploading ? (
          <>
            <FiUploadCloud className="w-3.5 h-3.5 animate-bounce shrink-0" />
            <span className="font-mono">{status.currentUpload.percent}% আপলোড</span>
          </>
        ) : hasSpool ? (
          <>
            <FiHardDrive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {status.spoolCount} স্পুল ({formatSize(status.spoolTotalBytes)})
            </span>
          </>
        ) : isRecording ? (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="hidden sm:inline">REC (30 FPS)</span>
            <span className="sm:hidden font-mono">REC</span>
          </>
        ) : (
          <>
            <FiVideo className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">সার্ভিল্যান্স</span>
          </>
        )}
      </button>

      {/* Spool & Surveillance Visualizer Modal */}
      <VideoSpoolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default HeaderVideoSpoolBadge;
