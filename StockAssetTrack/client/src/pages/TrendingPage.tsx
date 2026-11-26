import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Flame, Search, Sparkles, TrendingUp } from 'lucide-react';
import { AssetResultsBrowser } from '../components/AssetResultsBrowser';
import { fetchTrending } from '../services/api';
import type {
  ContentTypeFilter,
  GenAIFilter,
  SearchResponse,
  SortOption,
} from '../types/stock';

const TRENDING_NICHES = [
  { label: 'All Breakouts', query: 'all' },
  { label: 'Sustainable Packaging', query: 'sustainable packaging mockup' },
  { label: 'Minimalist 3D Fintech', query: 'minimalist 3d fintech' },
  { label: 'AI Workflow', query: 'ai workflow workspace' },
  { label: 'Solar Energy', query: 'solar clean energy' },
  { label: 'Ramadan Gold', query: 'ramadan lantern gold' },
];

export function TrendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFocus = searchParams.get('q') ?? 'all';
  const initialOrder = (searchParams.get('order') as SortOption) ?? 'velocity';
  const initialType = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
  const initialAi = (searchParams.get('generative_ai') as GenAIFilter) ?? 'all';
  const initialPage = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  const [focusInput, setFocusInput] = useState(initialFocus === 'all' ? '' : initialFocus);
  const [activeFocus, setActiveFocus] = useState(initialFocus);
  const [order, setOrder] = useState<SortOption>(initialOrder);
  const [contentType, setContentType] = useState<ContentTypeFilter>(initialType);
  const [generativeAi, setGenerativeAi] = useState<GenAIFilter>(initialAi);
  const [page, setPage] = useState(initialPage);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string>('');

  const loadTrending = async (
    nextFocus: string,
    nextOrder: SortOption,
    nextType: ContentTypeFilter,
    nextAi: GenAIFilter,
    nextPage: number
  ) => {
    const cleanFocus = nextFocus.trim() || 'all';
    const urlParams = new URLSearchParams();
    if (cleanFocus !== 'all') urlParams.set('q', cleanFocus);
    if (nextOrder !== 'velocity') urlParams.set('order', nextOrder);
    if (nextType !== 'all') urlParams.set('content_type', nextType);
    if (nextAi !== 'all') urlParams.set('generative_ai', nextAi);
    if (nextPage > 1) urlParams.set('page', String(nextPage));

    const key = `trending:${urlParams.toString()}`;
    lastKeyRef.current = key;
    setSearchParams(urlParams, { replace: true });

    setLoading(true);
    setError(null);

    try {
      const response = await fetchTrending({
        q: cleanFocus,
        order: nextOrder,
        contentType: nextType,
        generativeAi: nextAi,
        page: nextPage,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending breakouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') ?? 'all';
    const ord = (searchParams.get('order') as SortOption) ?? 'velocity';
    const typ = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
    const ai = (searchParams.get('generative_ai') as GenAIFilter) ?? 'all';
    const pg = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

    const normalized = new URLSearchParams();
    if (q !== 'all') normalized.set('q', q);
    if (ord !== 'velocity') normalized.set('order', ord);
    if (typ !== 'all') normalized.set('content_type', typ);
    if (ai !== 'all') normalized.set('generative_ai', ai);
    if (pg > 1) normalized.set('page', String(pg));

    const key = `trending:${normalized.toString()}`;
    if (lastKeyRef.current === key) {
      return;
    }

    setActiveFocus(q);
    setFocusInput(q === 'all' ? '' : q);
    setOrder(ord);
    setContentType(typ);
    setGenerativeAi(ai);
    setPage(pg);
    void loadTrending(q, ord, typ, ai, pg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-500">
            <Flame className="h-3.5 w-3.5" />
            <span>Breakout Velocity Feed</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Trending &amp; Fast-Rising Adobe Stock Assets
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Automatically surfaces recent uploads generating rapid monthly download velocity (~D/M) across niches.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-1.5 font-semibold text-brand-cyan">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Top Velocity Leader</span>
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-white">
            {data?.assets[0]?.monthlyVelocity ? `~${data.assets[0].monthlyVelocity} D/M` : '--'}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = focusInput.trim() || 'all';
            setActiveFocus(next);
            setPage(1);
            void loadTrending(next, order, contentType, generativeAi, 1);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-brand-indigo focus-within:ring-2 focus-within:ring-brand-indigo/20 dark:border-slate-700 dark:bg-slate-950">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="trending-focus-input"
              name="trendingFocus"
              type="text"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              placeholder="Filter trending feed by optional niche keyword (leave blank for all breakouts)..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-indigo/20 transition hover:opacity-95 disabled:opacity-60"
          >
            <Flame className="h-4 w-4" />
            <span>{loading ? 'Refreshing...' : 'Update Feed'}</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="font-medium text-slate-500 dark:text-slate-400">Rank By</span>
            <select
              id="trending-order-select"
              name="order"
              aria-label="Rank trending feed by"
              value={order}
              onChange={(e) => {
                const nextOrder = e.target.value as SortOption;
                setOrder(nextOrder);
                setPage(1);
                void loadTrending(activeFocus, nextOrder, contentType, generativeAi, 1);
              }}
              className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
            >
              <option value="velocity" className="dark:bg-slate-900">Highest Velocity (~D/M)</option>
              <option value="creation" className="dark:bg-slate-900">Newest Uploads</option>
              <option value="nb_downloads" className="dark:bg-slate-900">Most Downloaded</option>
              <option value="featured" className="dark:bg-slate-900">Featured Breakouts</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="font-medium text-slate-500 dark:text-slate-400">Content Type</span>
            <select
              id="trending-type-select"
              name="contentType"
              aria-label="Trending Content Type"
              value={contentType}
              onChange={(e) => {
                const nextType = e.target.value as ContentTypeFilter;
                setContentType(nextType);
                setPage(1);
                void loadTrending(activeFocus, order, nextType, generativeAi, 1);
              }}
              className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
            >
              <option value="all" className="dark:bg-slate-900">All Types</option>
              <option value="photo" className="dark:bg-slate-900">Photo</option>
              <option value="illustration" className="dark:bg-slate-900">Illustration</option>
              <option value="vector" className="dark:bg-slate-900">Vector</option>
              <option value="video" className="dark:bg-slate-900">Video</option>
              <option value="template" className="dark:bg-slate-900">Template</option>
              <option value="3d" className="dark:bg-slate-900">3D</option>
            </select>
          </label>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <span className="inline-flex items-center gap-1 px-2 font-medium text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3 w-3 text-brand-purple" />
              AI
            </span>
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'only', label: 'AI Only' },
                { value: 'exclude', label: 'Exclude AI' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setGenerativeAi(opt.value);
                  setPage(1);
                  void loadTrending(activeFocus, order, contentType, opt.value, 1);
                }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${generativeAi === opt.value
                    ? 'bg-brand-indigo text-white'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
          <span className="mr-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Breakout streams:
          </span>
          {TRENDING_NICHES.map((chip) => {
            const selected = activeFocus.toLowerCase() === chip.query;
            return (
              <button
                key={chip.query}
                type="button"
                onClick={() => {
                  setActiveFocus(chip.query);
                  setFocusInput(chip.query === 'all' ? '' : chip.query);
                  setPage(1);
                  void loadTrending(chip.query, order, contentType, generativeAi, 1);
                }}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${selected
                    ? 'border-brand-indigo bg-brand-indigo/15 text-brand-indigo dark:text-indigo-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                  }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {(data || loading) && (
        <AssetResultsBrowser
          assets={data?.assets ?? []}
          summary={data?.summary ?? null}
          cached={Boolean(data?.cached)}
          loading={loading}
          exportSlug={`trending-${activeFocus}`}
          page={page}
          hasMore={Boolean(data?.hasMore)}
          resetKey={lastKeyRef.current}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            void loadTrending(activeFocus, order, contentType, generativeAi, nextPage);
          }}
          onClickTag={(tag) => {
            setFocusInput(tag);
            setActiveFocus(tag);
            setPage(1);
            void loadTrending(tag, order, contentType, generativeAi, 1);
          }}
          onSelectTypeFromSummary={(nextType) => {
            setContentType(nextType);
            setPage(1);
            void loadTrending(activeFocus, order, nextType, generativeAi, 1);
          }}
        />
      )}
    </section>
  );
}
