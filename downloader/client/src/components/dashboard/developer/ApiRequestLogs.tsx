import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { ApiLog } from '../../../types';
import { fetchApiLogs } from '../../../services/api';

export const ApiRequestLogs: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [endpoint, setEndpoint] = useState('all');

  // Selected Log Details Modal
  const [inspectLog, setInspectLog] = useState<ApiLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchApiLogs({
        page,
        limit: 20,
        search,
        status,
        endpoint: endpoint === 'all' ? undefined : endpoint
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load API logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, status, endpoint]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          {code} OK
        </span>
      );
    } else if (code === 429) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          429 Rate Limited
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" />
          {code} Error
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>API Request Logs</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of every REST API call processed by your developer keys.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by endpoint (/api/v1/...) or IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">2xx Success</option>
              <option value="error">4xx / 5xx Errors</option>
            </select>

            <select
              value={endpoint}
              onChange={(e) => { setEndpoint(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Endpoints</option>
              <option value="extract">/api/v1/extract</option>
              <option value="download">/api/v1/download</option>
              <option value="jobs">/api/v1/jobs</option>
              <option value="usage">/api/v1/usage</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Fetching request logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Terminal className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No API logs found</h4>
          <p className="text-xs text-slate-500 mt-1">
            Requests sent to `/api/v1/*` using your API keys will be streamed and recorded here in real-time.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs uppercase font-semibold">
                <th className="p-3.5">Method & Endpoint</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 hidden sm:table-cell">Latency</th>
                <th className="p-3.5 hidden md:table-cell">Client IP</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold text-[10px] mr-2">
                      {log.method}
                    </span>
                    <span className="text-white font-medium">{log.endpoint}</span>
                  </td>

                  <td className="p-3.5">
                    {getStatusBadge(log.status_code)}
                  </td>

                  <td className="p-3.5 hidden sm:table-cell font-mono text-slate-300">
                    {log.response_time_ms}ms
                  </td>

                  <td className="p-3.5 hidden md:table-cell font-mono text-slate-500">
                    {log.ip_address || '127.0.0.1'}
                  </td>

                  <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()} • {new Date(log.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setInspectLog(log)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Inspect Log"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Toolbar */}
          <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {logs.length} of {total} request logs
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Log Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2 font-mono">
                <span>{inspectLog.method}</span>
                <span className="text-indigo-400">{inspectLog.endpoint}</span>
              </h3>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Status:</span>
                <div>{getStatusBadge(inspectLog.status_code)}</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Response Duration:</span>
                <span className="font-mono text-white">{inspectLog.response_time_ms} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Client IP Address:</span>
                <span className="font-mono text-white">{inspectLog.ip_address || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-white">{new Date(inspectLog.created_at).toISOString()}</span>
              </div>
              {inspectLog.error_message && (
                <div className="py-2 text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <strong>Error Message:</strong> {inspectLog.error_message}
                </div>
              )}
            </div>

            <button
              onClick={() => setInspectLog(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
