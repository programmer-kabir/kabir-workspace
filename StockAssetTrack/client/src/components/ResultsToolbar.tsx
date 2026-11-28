import { ArrowUpDown, CheckSquare, Download, FileSpreadsheet, Filter, Square } from 'lucide-react';
import type { ClientSortKey, MediaType } from '../types/stock';
import { CLIENT_SORT_OPTIONS } from '../utils/assetUtils';

interface ResultsToolbarProps {
  totalShown: number;
  selectedCount: number;
  allSelected: boolean;
  cached: boolean;
  clientSort: ClientSortKey;
  mediaFilter: 'all' | MediaType;
  onClientSortChange: (val: ClientSortKey) => void;
  onMediaFilterChange: (val: 'all' | MediaType) => void;
  onToggleSelectAll: () => void;
  onExportAnalyticsCsv: () => void;
  onExportAdobeCsv: () => void;
}

const MEDIA_FILTERS: ('all' | MediaType)[] = [
  'all',
  'Photo',
  'Illustration',
  'Vector',
  'Video',
  'Template',
  '3D',
];

export function ResultsToolbar({
  totalShown,
  selectedCount,
  allSelected,
  cached,
  clientSort,
  mediaFilter,
  onClientSortChange,
  onMediaFilterChange,
  onToggleSelectAll,
  onExportAnalyticsCsv,
  onExportAdobeCsv,
}: ResultsToolbarProps) {
  const exportLabelCount = selectedCount > 0 ? selectedCount : totalShown;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-slate-900 dark:text-white">{totalShown} Results</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            cached
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-brand-indigo/10 text-brand-indigo dark:text-indigo-300'
          }`}
        >
          {cached ? 'Cached Analysis' : 'Live Sync'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-950">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            id="toolbar-client-sort"
            name="clientSort"
            aria-label="Client sort results"
            value={clientSort}
            onChange={(e) => onClientSortChange(e.target.value as ClientSortKey)}
            className="bg-transparent font-medium text-slate-800 outline-none dark:text-slate-100"
          >
            {CLIENT_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-950">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            id="toolbar-type-filter"
            name="mediaFilter"
            aria-label="Filter loaded results by type"
            value={mediaFilter}
            onChange={(e) => onMediaFilterChange(e.target.value as 'all' | MediaType)}
            className="bg-transparent font-medium text-slate-800 outline-none dark:text-slate-100"
          >
            {MEDIA_FILTERS.map((type) => (
              <option key={type} value={type} className="dark:bg-slate-900">
                {type === 'all' ? 'All Loaded Types' : type}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onToggleSelectAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {allSelected ? (
            <CheckSquare className="h-3.5 w-3.5 text-brand-indigo" />
          ) : (
            <Square className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
        </button>

        <button
          type="button"
          onClick={onExportAnalyticsCsv}
          disabled={totalShown === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-indigo px-3 py-1.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV ({exportLabelCount})</span>
        </button>

        <button
          type="button"
          onClick={onExportAdobeCsv}
          disabled={totalShown === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1.5 font-semibold text-brand-cyan transition hover:bg-brand-cyan/20 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Adobe CSV</span>
        </button>
      </div>
    </div>
  );
}
