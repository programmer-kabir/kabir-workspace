import React, { useState, useMemo } from 'react';
import { 
  FiDownload, FiExternalLink, FiPaperclip, FiImage, 
  FiEye, FiPlay, FiFileText, FiLink, FiPackage, FiMaximize2,
  FiClock, FiZap, FiAlertTriangle, FiLayers, FiCheckCircle
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { downloadFile } from '../utils/fileDownloader';

export default function TaskDeliverablesViewer({ 
  submissions = [], 
  submissionLink = '', 
  onImageClick,
  totalTimeSpent = null,
  submittedAt = null
}) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return '0s';
    const s = parseInt(totalSecs, 10);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getFileBadge = (ext = '') => {
    const extLower = ext.toLowerCase();
    if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    if (['zip', 'rar', '7z'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (['mp4', 'mov', 'webm'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/20 text-red-300 border-red-500/40' };
    return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-white/10 text-white/70 border-white/20' };
  };

  // ── Cluster into Revision Rounds ───────────────────────────────────────────
  const { rounds, allTaggedFiles, isMultiRound } = useMemo(() => {
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return { rounds: [], allTaggedFiles: [], isMultiRound: false };
    }

    const sorted = [...submissions].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    const clusteredRounds = [];
    let currentCluster = [];
    let lastTime = null;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const curTime = item.created_at ? new Date(item.created_at).getTime() : null;

      if (currentCluster.length === 0) {
        currentCluster.push(item);
        lastTime = curTime;
      } else {
        const timeDiff = (curTime && lastTime) ? Math.abs(curTime - lastTime) : 0;
        if (timeDiff > 180 * 1000) { // New round if uploaded > 3 mins apart
          clusteredRounds.push(currentCluster);
          currentCluster = [item];
        } else {
          currentCluster.push(item);
        }
        if (curTime) lastTime = curTime;
      }
    }
    if (currentCluster.length > 0) {
      clusteredRounds.push(currentCluster);
    }

    const totalRounds = clusteredRounds.length;
    const formattedRounds = clusteredRounds.map((filesList, idx) => {
      const roundNum = idx + 1;
      const isLatest = idx === totalRounds - 1;
      const timestamp = filesList.find(f => f.created_at)?.created_at || null;

      filesList.forEach(f => {
        f._revisionNumber = roundNum;
        f._isLatest = isLatest;
        f._roundName = totalRounds === 1 ? 'Initial Submission' : (isLatest ? `Revision ${roundNum} (Latest)` : `Revision ${roundNum}`);
      });

      return {
        roundIndex: idx,
        roundNumber: roundNum,
        label: totalRounds === 1 ? 'Submission #1' : (isLatest ? `✨ Revision ${roundNum} (Latest)` : `🕒 Revision ${roundNum}`),
        shortLabel: totalRounds === 1 ? 'Round 1' : (isLatest ? `Rev ${roundNum} (Latest)` : `Rev ${roundNum}`),
        isLatest,
        timestamp,
        files: filesList
      };
    });

    return {
      rounds: formattedRounds,
      allTaggedFiles: sorted,
      isMultiRound: totalRounds > 1
    };
  }, [submissions]);

  const [activeRoundTab, setActiveRoundTab] = useState('latest');

  const displayedFiles = useMemo(() => {
    if (!isMultiRound || activeRoundTab === 'all') {
      return allTaggedFiles;
    }
    if (activeRoundTab === 'latest') {
      const latest = rounds[rounds.length - 1];
      return latest ? latest.files : allTaggedFiles;
    }
    const target = rounds.find(r => r.roundIndex === activeRoundTab);
    return target ? target.files : allTaggedFiles;
  }, [allTaggedFiles, activeRoundTab, isMultiRound, rounds]);

  const previewFiles = displayedFiles.filter(s => 
    s.file_type === 'preview' || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes((s.file_ext || '').toLowerCase())
  );

  const videoFiles = displayedFiles.filter(s => 
    s.file_type === 'video' || ['mp4', 'mov', 'webm'].includes((s.file_ext || '').toLowerCase())
  );

  const sourceFiles = displayedFiles.filter(s => 
    !previewFiles.includes(s) && !videoFiles.includes(s)
  );

  const hasDeliverables = (submissions && submissions.length > 0) || Boolean(submissionLink);
  const isInstantSubmit = totalTimeSpent !== null && totalTimeSpent !== undefined && Number(totalTimeSpent) > 0 && Number(totalTimeSpent) < 120;

  if (!hasDeliverables) {
    return (
      <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
        <FiPackage className="mx-auto text-white/20 mb-2" size={32} />
        <p className="text-sm font-semibold text-white/50">No deliverables uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Working Duration & Submission Timing Ribbon ── */}
      {totalTimeSpent !== null && totalTimeSpent !== undefined && Number(totalTimeSpent) > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
          isInstantSubmit 
            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-200 shadow-sm' 
            : 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30 text-blue-950 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${isInstantSubmit ? 'bg-amber-500/25 text-amber-800 dark:text-amber-300' : 'bg-blue-500/25 text-blue-800 dark:text-blue-300'}`}>
              {isInstantSubmit ? <FiZap size={20} className="animate-bounce" /> : <FiClock size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {isInstantSubmit ? '⚡ Instant / Fast Submission' : '⏱️ Staff Working Duration'}
                </p>
                {isInstantSubmit && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-[10px] font-black uppercase text-amber-900 dark:text-amber-200 border border-amber-500/40 animate-pulse">
                    Fast Track
                  </span>
                )}
              </div>
              <p className="text-lg font-black tracking-tight mt-0.5 text-amber-950 dark:text-amber-100">
                {formatDuration(totalTimeSpent)}
              </p>
            </div>
          </div>

          {submittedAt && (
            <div className="text-right text-xs">
              <span className="text-white/60 dark:text-white/40 block text-[10px] uppercase font-bold">Submission Timestamp</span>
              <span className="font-bold text-white">
                {new Date(submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Multi-Revision Selector Bar ── */}
      {isMultiRound && (
        <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white/50 px-1">
            <FiLayers size={14} className="text-emerald-400" />
            <span>Submission Revisions:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Latest Only Tab */}
            <button
              type="button"
              onClick={() => setActiveRoundTab('latest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRoundTab === 'latest'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:border-emerald-400 hover:text-white'
              }`}
            >
              <HiSparkles size={12} className={activeRoundTab === 'latest' ? 'text-amber-300' : 'text-emerald-400'} />
              <span>Latest Submission (Current)</span>
            </button>

            {/* Individual Historical Rounds */}
            {rounds.map((r) => {
              const isSelected = activeRoundTab === r.roundIndex;
              return (
                <button
                  key={r.roundIndex}
                  type="button"
                  onClick={() => setActiveRoundTab(r.roundIndex)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:border-blue-400 hover:text-white'
                  }`}
                >
                  <span>{r.isLatest ? `Rev ${r.roundNumber} (Latest)` : `Rev ${r.roundNumber} (History)`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-blue-700 text-white' : 'bg-white/10 text-white/50'}`}>
                    {r.files.length}
                  </span>
                </button>
              );
            })}

            {/* All Files Tab */}
            <button
              type="button"
              onClick={() => setActiveRoundTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRoundTab === 'all'
                  ? 'bg-white text-dark-950 font-black shadow-md'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <span>All Files ({allTaggedFiles.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Visual Previews (Images) */}
      {previewFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiImage size={15} /> Visual Previews & Output ({previewFiles.length})
            </p>
            <span className="text-[11px] text-white/40 font-medium">Click on any image to inspect in full zoom</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {previewFiles.map((file, idx) => (
              <div 
                key={file.id || idx} 
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-lg hover:border-emerald-500/50 transition-all"
              >
                {/* Revision Tag Badge */}
                {isMultiRound && (
                  <div className="absolute top-3 left-3 z-10">
                    {file._isLatest ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md">
                        <HiSparkles size={11} className="text-amber-300" /> Latest Version
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md">
                        <FiClock size={11} /> Rev {file._revisionNumber} (History)
                      </span>
                    )}
                  </div>
                )}

                <div 
                  className="w-full h-56 bg-black flex items-center justify-center cursor-pointer overflow-hidden relative"
                  onClick={() => onImageClick ? onImageClick(file.file_url) : window.open(file.file_url, '_blank')}
                >
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/20">
                      <FiEye size={14} /> Full View & Zoom
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-dark-900/90 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white/90 truncate" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {formatFileSize(file.file_size)} • Preview Image
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.file_url, '_blank');
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      title="Open in New Tab"
                    >
                      <FiExternalLink size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onImageClick) onImageClick(file.file_url);
                        else window.open(file.file_url, '_blank');
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      title="Enlarge Image"
                    >
                      <FiMaximize2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.file_url, file.file_name);
                      }}
                      className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white transition-colors"
                      title="Download Image"
                    >
                      <FiDownload size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Video Files */}
      {videoFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPlay size={15} /> Video Output Deliverables ({videoFiles.length})
          </p>
          <div className="space-y-3">
            {videoFiles.map((file, idx) => (
              <div key={file.id || idx} className="rounded-2xl overflow-hidden border border-white/10 bg-black p-3 shadow-lg relative">
                {isMultiRound && (
                  <div className="mb-2">
                    {file._isLatest ? (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase inline-flex items-center gap-1">
                        <HiSparkles size={10} className="text-amber-300" /> Latest Version
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                        <FiClock size={10} /> Rev {file._revisionNumber} (History)
                      </span>
                    )}
                  </div>
                )}
                <video
                  src={file.file_url}
                  controls
                  className="w-full max-h-[400px] rounded-xl bg-black"
                  preload="metadata"
                />
                <div className="flex items-center justify-between mt-3 px-1 text-xs text-white">
                  <span className="font-semibold truncate">{file.file_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">{formatFileSize(file.file_size)}</span>
                    <button
                      type="button"
                      onClick={() => downloadFile(file.file_url, file.file_name)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <FiDownload size={13} /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Source & Vector Files */}
      {sourceFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPackage size={15} /> Source & Working Files ({sourceFiles.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sourceFiles.map((file, idx) => {
              const badge = getFileBadge(file.file_ext);
              return (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all gap-3 shadow-sm hover:border-blue-500/30"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`px-2.5 py-1.5 text-xs font-black uppercase rounded-xl border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-white/90 truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                        {isMultiRound && (
                          file._isLatest ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase border border-emerald-500/30">
                              Latest
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase border border-amber-500/30">
                              Rev {file._revisionNumber}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {formatFileSize(file.file_size)} • Uploaded Source Asset
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadFile(file.file_url, file.file_name)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-lg shadow-blue-950/40"
                    title="Download File"
                  >
                    <FiDownload size={14} />
                    <span>Download</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. External Folder Link */}
      {submissionLink && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
          <FiLink className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold tracking-wider">External Folder / Cloud Proof Link</p>
            <a
              href={submissionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate block mt-0.5 font-bold"
            >
              {submissionLink}
            </a>
          </div>
          <a
            href={submissionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-xl transition-colors shrink-0"
          >
            <FiExternalLink size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
