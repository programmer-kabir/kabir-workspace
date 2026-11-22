import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  RotateCcw,
  XCircle,
  ExternalLink,
  List
} from 'lucide-react';
import { detectLocalPlatform } from '../../services/api';
import { bulkAddQueueApi, bulkCancelQueueApi, bulkRetryQueueApi } from '../../services/api';

export const BulkDownloaderView: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [type, setType] = useState<'video' | 'audio'>('video');
  const [submitting, setSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parse lines
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const validatedLines = lines.map((url) => {
    const isValid = url.startsWith('http://') || url.startsWith('https://');
    const platform = isValid ? detectLocalPlatform(url) : null;
    return { url, isValid, platform };
  });

  const validCount = validatedLines.filter((l) => l.isValid).length;
  const invalidCount = validatedLines.filter((l) => !l.isValid).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validCount === 0) {
      setErrorMsg('Please provide at least one valid video URL starting with http:// or https://');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const urlsToSubmit = validatedLines.filter((l) => l.isValid).map((l) => l.url);
      const res = await bulkAddQueueApi(urlsToSubmit, type);
      setBulkResult(res.data);
      setRawText('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCancel = async () => {
    if (!bulkResult?.results) return;
    const jobIds = bulkResult.results
      .filter((r: any) => r.job)
      .map((r: any) => r.job.id);

    if (jobIds.length === 0) return;
    try {
      await bulkCancelQueueApi(jobIds);
      alert('Bulk jobs cancelled.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkRetry = async () => {
    if (!bulkResult?.results) return;
    const jobIds = bulkResult.results
      .filter((r: any) => r.job)
      .map((r: any) => r.job.id);

    if (jobIds.length === 0) return;
    try {
      await bulkRetryQueueApi(jobIds);
      alert('Bulk jobs re-queued.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>High-Speed Bulk Downloader</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Submit batches of URLs simultaneously. Validated line-by-line and processed concurrently.
          </p>
        </div>

        {bulkResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRetry}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Batch</span>
            </button>
            <button
              onClick={handleBulkCancel}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Batch</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Textarea & Options */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <List className="w-4 h-4 text-indigo-400" />
                  <span>Paste URLs (One URL per line)</span>
                </label>
                <span className="text-xs text-slate-500">
                  {lines.length} lines detected
                </span>
              </div>

              <textarea
                rows={7}
                placeholder="https://www.youtube.com/watch?v=...&#10;https://www.tiktok.com/@user/video/...&#10;https://www.instagram.com/reel/...&#10;https://www.facebook.com/watch/?v=..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-100 placeholder:text-slate-600 font-mono transition-all resize-y"
              />
            </div>

            {/* Format Selection */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400 font-medium">Download Type:</span>
                <button
                  type="button"
                  onClick={() => setType('video')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    type === 'video'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Video (1080p MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setType('audio')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    type === 'audio'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Audio (320kbps MP3)
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || validCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit {validCount} URLs to Queue</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right 1 Col: Live URL Validation Inspector */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white mb-3">Batch Validation</h3>

            {/* Validation Counts */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-xl font-extrabold text-emerald-400">{validCount}</div>
                <div className="text-[11px] text-emerald-300 font-medium">Valid URLs</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <div className="text-xl font-extrabold text-rose-400">{invalidCount}</div>
                <div className="text-[11px] text-rose-300 font-medium">Invalid Lines</div>
              </div>
            </div>

            {/* Preview of Validated Lines */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {validatedLines.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Paste links on the left to see live format validation and platform detection.
                </div>
              ) : (
                validatedLines.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl text-[11px] flex items-center justify-between gap-2 border ${
                      item.isValid
                        ? 'bg-slate-950/40 border-slate-800'
                        : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
                    }`}
                  >
                    <span className="truncate max-w-[180px] font-mono text-slate-300">{item.url}</span>
                    {item.isValid && item.platform ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold shrink-0"
                        style={{ backgroundColor: `${item.platform.color}20`, color: item.platform.color }}
                      >
                        {item.platform.name}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold shrink-0">Invalid</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Free accounts allow up to 5 URLs per bulk batch. Pro accounts support 25 concurrent jobs.
          </div>
        </div>

      </div>

      {/* Batch Results Overview if Submitted */}
      {bulkResult && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Batch Queue Status ({bulkResult.summary?.total} Total Submitted)</span>
            </h3>
            <span className="text-xs text-slate-400">
              {bulkResult.summary?.added} Queued • {bulkResult.summary?.duplicates} Cached Duplicates • {bulkResult.summary?.invalid} Skipped
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-950/50 border border-slate-800 overflow-hidden">
            {bulkResult.results?.map((res: any, idx: number) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0 flex items-center gap-3">
                  {res.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate max-w-lg">{res.url}</div>
                    <div className="text-[11px] text-slate-400">
                      {res.valid ? res.message || 'Queued for background worker' : res.error}
                    </div>
                  </div>
                </div>

                {res.job && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Job #{res.job.id.slice(-6)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
