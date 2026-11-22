import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { QueueJob } from '../../types';
import {
  fetchQueueList,
  pauseJobApi,
  resumeJobApi,
  cancelJobApi,
  retryJobApi
} from '../../services/api';

export const QueueView: React.FC = () => {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const data = await fetchQueueList(filter);
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // Auto refresh every 3 seconds if active jobs exist
    const timer = setInterval(() => {
      loadJobs();
    }, 3000);
    return () => clearInterval(timer);
  }, [filter]);

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await pauseJobApi(id);
      await loadJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(id);
    try {
      await resumeJobApi(id);
      await loadJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this download?')) return;
    setActionLoading(id);
    try {
      await cancelJobApi(id);
      await loadJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await retryJobApi(id);
      await loadJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Processing
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/40 text-slate-400 border border-slate-600/30">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            <span>Persistent Download Queue</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Jobs are managed by the background worker pool and automatically survive server restarts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium">
            {['all', 'processing', 'queued', 'completed', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filter === st
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={loadJobs}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Job List */}
      {loading && jobs.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Fetching queue status...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
          <Clock className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Queue is currently idle</h3>
          <p className="text-xs text-slate-500 mt-1">
            Submit a video URL from the Overview or Bulk Downloader to see it process live here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {job.thumbnail ? (
                    <img
                      src={job.thumbnail}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                      <Download className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate max-w-lg">
                      {job.title || job.url}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {job.platform}
                      </span>
                      <span className="capitalize">{job.type}</span>
                      {job.file_size && <span>• {job.file_size}</span>}
                      {job.attempts > 1 && (
                        <span className="text-amber-400">Attempt {job.attempts}/{job.max_attempts}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(job.status)}

                  {/* Contextual Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {job.status === 'processing' && (
                      <button
                        onClick={() => handlePause(job.id)}
                        disabled={actionLoading === job.id}
                        title="Pause"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}

                    {job.status === 'paused' && (
                      <button
                        onClick={() => handleResume(job.id)}
                        disabled={actionLoading === job.id}
                        title="Resume"
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(job.id)}
                        disabled={actionLoading === job.id}
                        title="Retry Failed Download"
                        className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1 text-xs font-semibold px-3"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    )}

                    {(job.status === 'queued' || job.status === 'processing' || job.status === 'paused') && (
                      <button
                        onClick={() => handleCancel(job.id)}
                        disabled={actionLoading === job.id}
                        title="Cancel Job"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {job.status === 'completed' && (
                      <a
                        href={`/api/download?url=${encodeURIComponent(job.url)}&formatId=${encodeURIComponent(job.format_id || '')}&type=${job.type}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save File</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar for In-Progress or Queued Jobs */}
              {(job.status === 'processing' || job.status === 'queued') && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>
                      {job.status === 'queued'
                        ? 'Waiting for available worker slot...'
                        : 'Resolving stream formats & media chunks...'}
                    </span>
                    <span className="font-semibold text-indigo-400">{job.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${Math.max(5, job.progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error message strip if failed */}
              {job.error_message && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{job.error_message}</span>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
