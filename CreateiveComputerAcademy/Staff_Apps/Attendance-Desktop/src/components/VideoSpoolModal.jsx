import React, { useState, useEffect } from 'react';
import { 
  FiVideo, FiHardDrive, FiUploadCloud, FiFolder, FiPlay, 
  FiTrash2, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiX, 
  FiCpu, FiActivity, FiArrowUpRight, FiClock, FiWifi, FiWifiOff 
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import workstationRecorderService from '../services/WorkstationRecorderService';

const VideoSpoolModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(workstationRecorderService.currentStatus);
  const [elapsedCurrentChunkSec, setElapsedCurrentChunkSec] = useState(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'queue'

  useEffect(() => {
    const unsub = workstationRecorderService.subscribeStatus((st) => {
      setStatus({ ...st });
    });
    workstationRecorderService.refreshSpoolInfo();
    return unsub;
  }, []);

  // Live timer for current chunk elapsed duration
  useEffect(() => {
    let timer = null;
    if (status.isRecording && status.chunkStartTime) {
      const updateElapsed = () => {
        const start = new Date(status.chunkStartTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedCurrentChunkSec(diff);
      };
      updateElapsed();
      timer = setInterval(updateElapsed, 1000);
    } else {
      setElapsedCurrentChunkSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status.isRecording, status.chunkStartTime]);

  if (!isOpen) return null;

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenFolder = async () => {
    await workstationRecorderService.openSpoolFolder();
  };

  const handleManualUpload = async () => {
    setIsManualSyncing(true);
    await workstationRecorderService.triggerManualUpload();
    setTimeout(() => {
      setIsManualSyncing(false);
    }, 2000);
  };

  const handleOpenVideo = async (fileName) => {
    await workstationRecorderService.openSpoolVideo(fileName);
  };

  const handleDeleteVideo = async (fileName) => {
    if (window.confirm(`আপনি কি এই ভিডিও ফাইলটি (${fileName}) ড্রাইভ থেকে মুছে ফেলতে চান?`)) {
      await workstationRecorderService.deleteSpoolVideo(fileName);
    }
  };

  const spoolItems = status.spoolItems || [];
  const spoolCount = status.spoolCount || spoolItems.length || 0;
  const spoolBytes = status.spoolTotalBytes || 0;
  const freeDiskBytes = status.freeDiskBytes || 0;
  const currentUpload = status.currentUpload;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Chunk duration progress (0 - 30 min = 1800s)
  const chunkPercent = Math.min(100, Math.round((elapsedCurrentChunkSec / 1800) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <FiVideo className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide">
                  সার্ভিল্যান্স ভিডিও স্পুল ও স্টোরেজ
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Full HD 1080p @ 30 FPS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                অফলাইন অটোমেটেড ভিডিও বাফারিং, লোকাল ডিস্ক অকুপ্যান্সি এবং গুগল ড্রাইভ আপলোড কিউ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-0 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FiActivity className="w-3.5 h-3.5" />
              <span>স্ট্যাটাস ও স্টোরেজ ওভারভিউ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'queue'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FiHardDrive className="w-3.5 h-3.5" />
              <span>পেন্ডিং কিউ তালিকা ({spoolCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleOpenFolder}
              className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="কম্পিউটারে ভিডিও স্পুল ফোল্ডার খুলুন"
            >
              <FiFolder className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">স্পুল ফোল্ডার খুলুন</span>
            </button>
            <button
              type="button"
              onClick={() => workstationRecorderService.refreshSpoolInfo()}
              className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          
          {activeTab === 'overview' ? (
            <>
              {/* Top Grid: 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Live Recorder State */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  status.isRecording 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      লাইভ রেকর্ডার
                    </span>
                    {status.isRecording ? (
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                        REC
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">স্টপ</span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <h4 className="text-xl font-black">
                      {status.isRecording ? `চাংক #${status.chunkIndex || 1}` : 'নিষ্ক্রিয়'}
                    </h4>
                    {status.isRecording && (
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        {formatSeconds(elapsedCurrentChunkSec)} / 30:00
                      </span>
                    )}
                  </div>

                  {status.isRecording && (
                    <div className="mt-2.5">
                      <div className="w-full bg-emerald-200/50 dark:bg-emerald-950/60 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${chunkPercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        পরবর্তী চাংক রোলোভার: {formatSeconds(Math.max(0, 1800 - elapsedCurrentChunkSec))} পর
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Spool Storage Queue */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-950 dark:text-indigo-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      পেন্ডিং স্পুল কিউ
                    </span>
                    <FiHardDrive className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {spoolCount} টি ভিডিও
                    </h4>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      ({formatBytes(spoolBytes)})
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                    {spoolCount > 0 
                      ? 'অফলাইনে ধারণকৃত ফাইল ডিস্কে সুরক্ষিত আছে।' 
                      : 'সব ভিডিও গুগলে ড্রাইভে সিঙ্কড আছে।'}
                  </p>
                </div>

                {/* 3. Disk Space Free */}
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      লোকাল ডিস্ক ফ্রি স্পেস
                    </span>
                    <FiCpu className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h4 className="text-xl font-black text-slate-800 dark:text-white">
                      {freeDiskBytes > 0 ? formatBytes(freeDiskBytes) : 'যথেষ্ট ফ্রি'}
                    </h4>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    সার্ভিল্যান্সের জন্য পর্যাপ্ত ফ্রি স্পেস রয়েছে।
                  </p>
                </div>
              </div>

              {/* Live Upload Progress / Status Panel */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      ক্লাউড আপলোড পাইপলাইন
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      {isOnline ? '(ইন্টারনেট সংযুক্ত)' : '(অফলাইন মোড)'}
                    </span>
                  </div>

                  {spoolCount > 0 && isOnline && !status.isUploading && (
                    <button
                      type="button"
                      onClick={handleManualUpload}
                      disabled={isManualSyncing}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <FiUploadCloud className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-bounce' : ''}`} />
                      <span>{isManualSyncing ? 'সিঙ্ক শুরু হচ্ছে...' : 'এখনই আপলোড করুন'}</span>
                    </button>
                  )}
                </div>

                {/* Upload In-Progress Bar */}
                {currentUpload ? (
                  <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                        <FiUploadCloud className="w-4 h-4 animate-bounce" />
                        <span>আপলোড হচ্ছে: চাংক #{currentUpload.chunkIndex}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {currentUpload.percent}% • {formatBytes(currentUpload.loaded)} / {formatBytes(currentUpload.total)}
                      </span>
                    </div>

                    <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentUpload.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>ফাইল: <code className="font-mono text-[10px]">{currentUpload.fileName}</code></span>
                      <span>স্পিড: {currentUpload.speedMbps || '1.5'} Mbps</span>
                    </div>
                  </div>
                ) : !isOnline ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                    <FiWifiOff className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>ইন্টারনেট বিচ্ছিন্ন। ভিডিওগুলো লোকাল ডিস্কে সংরক্ষিত হচ্ছে এবং কানেকশন ফিরলে স্বয়ংক্রিয়ভাবে আপলোড হবে।</span>
                  </div>
                ) : spoolCount > 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-indigo-500" />
                      <span>{spoolCount} টি ভিডিও ব্যাকগ্রাউন্ড শিডিউল অনুযায়ী আপলোড হবে (প্রতি ২০ সেকেন্ড পর পর যাচাই)।</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>সবগুলো ভিডিও চাংক গুগল ড্রাইভ ও ক্লাউড স্টোরেজে সফলভাবে পৌঁছে গেছে। কিউ খালি।</span>
                  </div>
                )}

                {/* Last Uploaded Info */}
                {status.lastUploadedChunk && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      সর্বশেষ সফল আপলোড: <strong className="text-slate-700 dark:text-slate-300">চাংক #{status.lastUploadedChunk.chunkIndex || 'OK'}</strong> ({status.lastUploadedChunk.time})
                    </span>
                    {status.lastUploadedChunk.viewLink && (
                      <a
                        href={status.lastUploadedChunk.viewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>ড্রাইভে দেখুন</span>
                        <FiArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Technical Recording Specs */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                  <HiSparkles className="w-4 h-4 text-amber-500" />
                  <span>সার্ভিল্যান্স কোয়ালিটি স্পেসিফিকেশন</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">রেজোলিউশন</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">1920 x 1080 (FHD)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">ফ্রেম রেট</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">30 FPS Smooth</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">বিটরেট</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">1.5 Mbps VBR</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">চাংক সাইকেল</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">৩০ মিনিট (~৩৩০ MB)</strong>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Queue Tab: List of Spooled Chunks */
            <div className="space-y-3">
              {spoolItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FiCheckCircle className="w-10 h-10 mx-auto text-emerald-500/70" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    কোনো অফলাইন ভিডিও স্পুল পেন্ডিং নেই
                  </p>
                  <p className="text-xs">
                    প্রতি ৩০ মিনিট পর একটি করে ভিডিও রেকর্ড সম্পন্ন হয়ে এখানে জমা হবে অথবা সরাসরি ড্রাইভে আপলোড হয়ে যাবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-semibold px-1 flex items-center justify-between">
                    <span>লোকাল ড্রাইভে জমা থাকা ভিডিওসমূহ ({spoolItems.length} টি)</span>
                    <span>মোট সাইজ: {formatBytes(spoolBytes)}</span>
                  </div>

                  {spoolItems.map((item, idx) => {
                    const isItemUploading = currentUpload && currentUpload.fileName === item.fileName;
                    return (
                      <div
                        key={item.fileName || idx}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isItemUploading 
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isItemUploading 
                              ? 'bg-indigo-600 text-white animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            <FiVideo className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                চাংক #{item.metadata?.chunk_index || (idx + 1)}
                              </h6>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                                {formatBytes(item.size)}
                              </span>
                              {isItemUploading ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500 text-white animate-pulse">
                                  আপলোড হচ্ছে ({currentUpload.percent}%)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  পেন্ডিং
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
                              {item.metadata?.start_time || '09:00:00'} - {item.metadata?.end_time || '09:30:00'} • {item.fileName}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenVideo(item.fileName)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="কম্পিউটারে ভিডিওটি প্লে করুন"
                          >
                            <FiPlay className="w-3 h-3 text-indigo-500" />
                            <span>প্লে করুন</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(item.fileName)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                            title="ফাইল মুছে ফেলুন"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            লোকাল স্পুল পাথ: <code className="font-mono text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">{status.spoolDir || 'userData/video_spool'}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSpoolModal;
