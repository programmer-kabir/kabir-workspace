import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  RotateCcw,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { HistoryItem } from '../../types';
import {
  fetchHistory,
  deleteHistoryItem,
  bulkDeleteHistoryItems,
  retryHistoryItem
} from '../../services/api';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [type, setType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  // Selected items for bulk operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory({
        page,
        limit: 10,
        search,
        platform,
        type,
        dateFrom,
        dateTo,
        sort
      });
      setHistory(data.history || []);
      setPlatforms(data.platforms || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, platform, type, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHistory();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map((h) => h.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this history record?')) return;
    try {
      await deleteHistoryItem(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      loadHistory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected records?`)) return;

    setBulkDeleting(true);
    try {
      await bulkDeleteHistoryItems(selectedIds);
      setSelectedIds([]);
      loadHistory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await retryHistoryItem(id);
      alert('Download re-submitted to background queue!');
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
            <History className="w-6 h-6 text-indigo-400" />
            <span>Download History</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, re-download, or delete your previous downloads.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by video title or source URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Platform Filter */}
            <select
              value={platform}
              onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Platforms</option>
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Media Type Filter */}
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Types</option>
              <option value="video">Video (MP4)</option>
              <option value="audio">Audio (MP3)</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as any); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* History Items Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading download history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
          <History className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No download history found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Downloads processed while logged in will automatically appear here with 1-click re-download.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs uppercase font-semibold">
                <th className="p-4 w-12 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedIds.length === history.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Media Item</th>
                <th className="p-4 hidden md:table-cell">Platform</th>
                <th className="p-4 hidden sm:table-cell">Format</th>
                <th className="p-4 hidden lg:table-cell">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {history.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <button onClick={() => toggleSelect(item.id)} className="text-slate-400 hover:text-white">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Media Details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                            <Download className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-sm">
                          <h4 className="font-semibold text-white truncate">{item.title}</h4>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-slate-500 hover:text-indigo-400 truncate flex items-center gap-1 mt-0.5"
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="p-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {item.platform}
                      </span>
                    </td>

                    {/* Format */}
                    <td className="p-4 hidden sm:table-cell text-slate-300">
                      <div>
                        <span className="capitalize font-semibold">{item.type}</span>
                        {item.resolution && <span className="text-slate-500"> • {item.resolution}</span>}
                      </div>
                      {item.file_size && <div className="text-[10px] text-slate-500">{item.file_size}</div>}
                    </td>

                    {/* Date */}
                    <td className="p-4 hidden lg:table-cell text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/download?url=${encodeURIComponent(item.url)}&formatId=${encodeURIComponent(item.format_id || '')}&type=${item.type}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Direct Download"
                          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleRetry(item.id)}
                          title="Re-queue Download"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Delete Record"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Toolbar */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {history.length} of {total} total records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
