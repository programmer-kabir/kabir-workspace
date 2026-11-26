import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSavedItems } from '../hooks/useSavedItems';
import type {
  ClientSortKey,
  ContentTypeFilter,
  MediaType,
  SearchSummary,
  StockAsset,
} from '../types/stock';
import {
  exportAdobeSubmissionCsv,
  exportAnalyticsCsv,
  sortAndFilterAssets,
} from '../utils/assetUtils';
import { AssetCard } from './AssetCard';
import { LightboxModal } from './LightboxModal';
import { MarketSummaryBar } from './MarketSummaryBar';
import { ResultsToolbar } from './ResultsToolbar';

interface AssetResultsBrowserProps {
  assets: StockAsset[];
  summary?: SearchSummary | null;
  cached: boolean;
  loading: boolean;
  exportSlug: string;
  page: number;
  hasMore: boolean;
  resetKey: string;
  onPageChange: (nextPage: number) => void;
  onClickTag: (tag: string) => void;
  onSelectTypeFromSummary?: (nextType: ContentTypeFilter) => void;
  emptyMessage?: string;
}

export function AssetResultsBrowser({
  assets,
  summary = null,
  cached,
  loading,
  exportSlug,
  page,
  hasMore,
  resetKey,
  onPageChange,
  onClickTag,
  onSelectTypeFromSummary,
  emptyMessage = 'No assets match the selected filters. Try resetting Content Type or Generative AI filters.',
}: AssetResultsBrowserProps) {
  const [clientSort, setClientSort] = useState<ClientSortKey>('default');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [jumpPage, setJumpPage] = useState(String(page));

  const { isImageSaved, toggleImage } = useSavedItems();

  useEffect(() => {
    setSelectedIds(new Set());
    setMediaFilter('all');
    setClientSort('default');
    setLightboxIndex(null);
  }, [resetKey]);

  useEffect(() => {
    setJumpPage(String(page));
  }, [page]);

  const visibleAssets = useMemo(() => {
    return sortAndFilterAssets(assets, clientSort, mediaFilter);
  }, [assets, clientSort, mediaFilter]);

  const allSelected =
    visibleAssets.length > 0 && visibleAssets.every((asset) => selectedIds.has(asset.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleAssets.map((asset) => asset.id)));
    }
  };

  const exportTargets =
    selectedIds.size > 0
      ? visibleAssets.filter((asset) => selectedIds.has(asset.id))
      : visibleAssets;

  return (
    <>
      {!loading && (assets.length > 0 || summary) && (
        <>
          {summary && (
            <MarketSummaryBar
              summary={summary}
              onSelectType={(nextType) => {
                if (onSelectTypeFromSummary) {
                  onSelectTypeFromSummary(nextType);
                } else {
                  const typeLabelMap: Record<ContentTypeFilter, 'all' | MediaType> = {
                    all: 'all',
                    photo: 'Photo',
                    illustration: 'Illustration',
                    vector: 'Vector',
                    video: 'Video',
                    template: 'Template',
                    '3d': '3D',
                  };
                  setMediaFilter(typeLabelMap[nextType]);
                }
              }}
            />
          )}

          <ResultsToolbar
            totalShown={visibleAssets.length}
            selectedCount={selectedIds.size}
            allSelected={allSelected}
            cached={cached}
            clientSort={clientSort}
            mediaFilter={mediaFilter}
            onClientSortChange={setClientSort}
            onMediaFilterChange={setMediaFilter}
            onToggleSelectAll={toggleSelectAll}
            onExportAnalyticsCsv={() => exportAnalyticsCsv(exportTargets, exportSlug)}
            onExportAdobeCsv={() => exportAdobeSubmissionCsv(exportTargets, exportSlug)}
          />
        </>
      )}

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70"
            />
          ))}
        </div>
      ) : visibleAssets.length > 0 ? (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleAssets.map((asset, idx) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                saved={isImageSaved(asset.id)}
                onToggleSelect={toggleSelect}
                onToggleSave={toggleImage}
                onOpenLightbox={() => setLightboxIndex(idx)}
                onClickTag={onClickTag}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900/70">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onPageChange(Math.max(1, Number(jumpPage) || 1));
              }}
              className="flex items-center gap-2"
            >
              <span className="text-slate-500 dark:text-slate-400">Page {page}</span>
              <input
                id="results-jump-page"
                name="page"
                type="number"
                min={1}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                aria-label="Page number"
                className="w-16 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-center font-mono dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-2.5 py-1 font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Go
              </button>
            </form>

            <button
              type="button"
              disabled={!hasMore}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        !loading && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {emptyMessage}
          </div>
        )
      )}

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className="fixed bottom-5 right-5 z-30 rounded-full bg-brand-indigo p-3 text-white shadow-lg shadow-brand-indigo/30 transition hover:bg-indigo-500"
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {lightboxIndex !== null && (
        <LightboxModal
          assets={visibleAssets}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
