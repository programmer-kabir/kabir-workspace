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
    if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    if (['zip', 'rar', '7z'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (['mp4', 'mov', 'webm'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
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

  if (!hasDeliverables) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
        <FiPackage className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No deliverables uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time & Submission Meta Bar */}
      {(totalTimeSpent || submittedAt) && (
        <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
          {totalTimeSpent && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <FiClock size={13} />
              <span>Time Spent: <strong>{formatDuration(totalTimeSpent)}</strong></span>
            </div>
          )}
          {submittedAt && (
            <div className="text-slate-400 text-[11px]">
              Submitted on: <span className="text-slate-600 dark:text-slate-200">{new Date(submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Multi-Revision Selector Bar ── */}
      {isMultiRound && (
        <div className="p-3 bg-slate-50 dark:bg-[#0e172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 px-1">
            <FiLayers size={14} className="text-emerald-500" />
            <span>Submission Revisions:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Latest Only Tab */}
            <button
              type="button"
              onClick={() => setActiveRoundTab('latest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRoundTab === 'latest'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              <HiSparkles size={12} className={activeRoundTab === 'latest' ? 'text-amber-300' : 'text-emerald-500'} />
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
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <span>{r.isLatest ? `Rev ${r.roundNumber} (Latest)` : `Rev ${r.roundNumber} (History)`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
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
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-[#131d31] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
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
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiImage size={15} /> Deliverable Images ({previewFiles.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {previewFiles.map((file, idx) => (
              <div 
                key={file.id || idx} 
                className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black shadow-sm hover:border-emerald-500 transition-all"
              >
                {/* Revision Tag Badge */}
                {isMultiRound && (
                  <div className="absolute top-3 left-3 z-10">
                    {file._isLatest ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md">
                        <HiSparkles size={11} className="text-amber-300" /> Latest Version
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md">
                        <FiClock size={11} /> Rev {file._revisionNumber} (History)
                      </span>
                    )}
                  </div>
                )}

                <div 
                  className="w-full h-52 bg-black flex items-center justify-center cursor-pointer overflow-hidden relative"
                  onClick={() => onImageClick ? onImageClick(file.file_url) : window.open(file.file_url, '_blank')}
                >
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                      <FiEye size={14} /> Click to View
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatFileSize(file.file_size)} • Preview Ready
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.file_url, '_blank');
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Open in New Tab"
                    >
                      <FiExternalLink size={13} />
                      <span>New Tab</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onImageClick) onImageClick(file.file_url);
                        else window.open(file.file_url, '_blank');
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Enlarge Image"
                    >
                      <FiMaximize2 size={13} />
                      <span>Zoom</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.file_url, file.file_name);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 transition-colors"
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
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPlay size={15} /> Video Output ({videoFiles.length})
          </p>
          <div className="space-y-3">
            {videoFiles.map((file, idx) => (
              <div key={file.id || idx} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black p-3 shadow-md relative">
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
                    <span className="text-white/60">{formatFileSize(file.file_size)}</span>
                    <button
                      type="button"
                      onClick={() => downloadFile(file.file_url, file.file_name)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FiDownload size={12} /> Download
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
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPackage size={15} /> Source & Vector Files ({sourceFiles.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sourceFiles.map((file, idx) => {
              const badge = getFileBadge(file.file_ext);
              return (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-blue-400 transition-all gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`px-2.5 py-1.5 text-xs font-black uppercase rounded-xl border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                        {isMultiRound && (
                          file._isLatest ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase border border-emerald-500/30">
                              Latest
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase border border-amber-500/30">
                              Rev {file._revisionNumber}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(file.file_size)} • Source Asset
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadFile(file.file_url, file.file_name)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
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
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center gap-3">
          <FiLink className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-emerald-800 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider">External Folder / Proof Link</p>
            <a
              href={submissionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate block mt-0.5 font-medium"
            >
              {submissionLink}
            </a>
          </div>
          <a
            href={submissionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors shrink-0"
          >
            <FiExternalLink size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
