import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AssetResultsBrowser } from '../components/AssetResultsBrowser';
import { SearchControls } from '../components/SearchControls';
import { UploadImageModal } from '../components/UploadImageModal';
import { searchAssets } from '../services/api';
import type {
  ContentTypeFilter,
  GenAIFilter,
  SearchResponse,
  SortOption,
} from '../types/stock';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? 'nature';
  const initialOrder = (searchParams.get('order') as SortOption) ?? 'nb_downloads';
  const initialType = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
  const initialAi = (searchParams.get('generative_ai') as GenAIFilter) ?? 'all';
  const initialPage = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [order, setOrder] = useState<SortOption>(initialOrder);
  const [contentType, setContentType] = useState<ContentTypeFilter>(initialType);
  const [generativeAi, setGenerativeAi] = useState<GenAIFilter>(initialAi);
  const [page, setPage] = useState(initialPage);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const lastSearchKeyRef = useRef<string>('');

  const runSearch = async (
    nextQuery: string,
    nextOrder: SortOption,
    nextType: ContentTypeFilter,
    nextAi: GenAIFilter,
    nextPage: number
  ) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      setError('Please enter a keyword or Asset ID to search.');
      return;
    }

    const urlParams = new URLSearchParams();
    urlParams.set('q', trimmed);
    if (nextOrder !== 'relevance') urlParams.set('order', nextOrder);
    if (nextType !== 'all') urlParams.set('content_type', nextType);
    if (nextAi !== 'all') urlParams.set('generative_ai', nextAi);
    if (nextPage > 1) urlParams.set('page', String(nextPage));
    const searchKey = urlParams.toString();
    lastSearchKeyRef.current = searchKey;
    setSearchParams(urlParams, { replace: true });

    setLoading(true);
    setError(null);

    try {
      const response = await searchAssets({
        q: trimmed,
        order: nextOrder,
        contentType: nextType,
        generativeAi: nextAi,
        page: nextPage,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') ?? 'nature';
    const ord = (searchParams.get('order') as SortOption) ?? 'nb_downloads';
    const typ = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
    const ai = (searchParams.get('generative_ai') as GenAIFilter) ?? 'all';
    const pg = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

    const normalized = new URLSearchParams();
    normalized.set('q', q);
    if (ord !== 'relevance') normalized.set('order', ord);
    if (typ !== 'all') normalized.set('content_type', typ);
    if (ai !== 'all') normalized.set('generative_ai', ai);
    if (pg > 1) normalized.set('page', String(pg));

    const key = normalized.toString();
    if (lastSearchKeyRef.current === key) {
      return;
    }

    setQueryInput(q);
    setOrder(ord);
    setContentType(typ);
    setGenerativeAi(ai);
    setPage(pg);
    void runSearch(q, ord, typ, ai, pg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Keyword, Niche &amp; Market Explorer
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Inspect demand, competition, AI vs Real splits, velocity (~D/M), and export Adobe Stock CSVs.
        </p>
      </div>

      <SearchControls
        query={queryInput}
        order={order}
        contentType={contentType}
        generativeAi={generativeAi}
        loading={loading}
        onQueryChange={setQueryInput}
        onOrderChange={(nextOrder) => {
          setOrder(nextOrder);
          setPage(1);
          void runSearch(queryInput, nextOrder, contentType, generativeAi, 1);
        }}
        onContentTypeChange={(nextType) => {
          setContentType(nextType);
          setPage(1);
          void runSearch(queryInput, order, nextType, generativeAi, 1);
        }}
        onGenerativeAiChange={(nextAi) => {
          setGenerativeAi(nextAi);
          setPage(1);
          void runSearch(queryInput, order, contentType, nextAi, 1);
        }}
        onSubmit={(overrideQuery) => {
          const activeQuery = overrideQuery ?? queryInput;
          setPage(1);
          void runSearch(activeQuery, order, contentType, generativeAi, 1);
        }}
        onOpenImageSearch={() => setUploadModalOpen(true)}
      />

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
          exportSlug={data?.summary.query ?? queryInput}
          page={page}
          hasMore={Boolean(data?.hasMore)}
          resetKey={lastSearchKeyRef.current}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            void runSearch(queryInput, order, contentType, generativeAi, nextPage);
          }}
          onClickTag={(tag) => {
            setQueryInput(tag);
            setPage(1);
            void runSearch(tag, order, contentType, generativeAi, 1);
          }}
          onSelectTypeFromSummary={(nextType) => {
            setContentType(nextType);
            setPage(1);
            void runSearch(queryInput, order, nextType, generativeAi, 1);
          }}
        />
      )}

      <UploadImageModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onComplete={() => {
          navigate('/similar?source=upload&page=1');
        }}
      />
    </section>
  );
}
