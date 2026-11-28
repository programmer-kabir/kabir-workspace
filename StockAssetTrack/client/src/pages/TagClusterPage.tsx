import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Check,
  Copy,
  FileSpreadsheet,
  Filter,
  Search,
  Sparkles,
  Tags,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchKeywordClusters } from '../services/api';
import type { ContentTypeFilter, TagClusterResponse } from '../types/stock';
import { copyText, exportAdobeDraftCsv } from '../utils/assetUtils';

const QUICK_TAG_NICHES = [
  'sustainable packaging mockup',
  'vintage brass compass macro',
  'ai workflow workspace',
  'eid al-adha',
  'minimalist 3d fintech',
  'nature',
];

const INTENT_FILTERS = ['All', 'Buyer Intent', 'Style & Mood', 'Subject Core'] as const;

export function TagClusterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? 'sustainable packaging mockup';
  const initialTopN = Math.max(5, Math.min(20, Number(searchParams.get('topN') ?? 10) || 10));
  const initialType = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [topN, setTopN] = useState(initialTopN);
  const [contentType, setContentType] = useState<ContentTypeFilter>(initialType);
  const [excludeNoise, setExcludeNoise] = useState(true);
  const [intentFilter, setIntentFilter] = useState<(typeof INTENT_FILTERS)[number]>('All');

  const [data, setData] = useState<TagClusterResponse | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('Business');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef('');

  const runExtraction = async (
    nextQuery: string,
    nextTopN: number,
    nextType: ContentTypeFilter,
    nextExcludeNoise: boolean
  ) => {
    const clean = nextQuery.trim() || 'sustainable packaging mockup';
    const nextParams = new URLSearchParams({ q: clean });
    if (nextTopN !== 10) nextParams.set('topN', String(nextTopN));
    if (nextType !== 'all') nextParams.set('content_type', nextType);
    const key = `${nextParams.toString()}:noise=${nextExcludeNoise ? 1 : 0}`;
    lastKeyRef.current = key;
    setSearchParams(nextParams, { replace: true });

    setLoading(true);
    setError(null);
    try {
      const res = await fetchKeywordClusters({
        query: clean,
        topN: nextTopN,
        contentType: nextType,
        excludeNoise: nextExcludeNoise,
      });
      setData(res);
      setSelectedTags(res.recommendedTags.slice(0, 35));
      setDraftTitle(res.recommendedTitle);
      setDraftCategory(res.recommendedCategory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract tag clusters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') ?? 'sustainable packaging mockup';
    const n = Math.max(5, Math.min(20, Number(searchParams.get('topN') ?? 10) || 10));
    const typ = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
    const norm = new URLSearchParams({ q });
    if (n !== 10) norm.set('topN', String(n));
    if (typ !== 'all') norm.set('content_type', typ);
    const key = `${norm.toString()}:noise=${excludeNoise ? 1 : 0}`;

    if (lastKeyRef.current === key) return;
    setQueryInput(q);
    setTopN(n);
    setContentType(typ);
    void runExtraction(q, n, typ, excludeNoise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filteredClusters = useMemo(() => {
    const clusters = data?.clusters ?? [];
    if (intentFilter === 'All') return clusters;
    return clusters.filter((c) => c.intent === intentFilter);
  }, [data?.clusters, intentFilter]);

  const topChartData = useMemo(() => {
    return (data?.clusters ?? []).slice(0, 10).map((c) => ({
      tag: c.tag.length > 14 ? `${c.tag.slice(0, 13)}…` : c.tag,
      relevance: c.relevanceScore,
      coverage: c.coveragePercent,
    }));
  }, [data?.clusters]);

  const toggleTagSelection = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }
      if (prev.length >= 49) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-1 text-[11px] font-semibold text-brand-indigo dark:text-indigo-300">
          <Tags className="h-3.5 w-3.5" />
          <span>Metadata Aggregation &amp; CSV Studio</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Top-10 Tag Cluster Extractor
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Aggregate winning keywords across top-selling Adobe Stock assets, strip low-value stopwords, and export ready-to-upload Adobe Stock Contributor CSVs.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runExtraction(queryInput, topN, contentType, excludeNoise);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-brand-indigo focus-within:ring-2 focus-within:ring-brand-indigo/20 dark:border-slate-700 dark:bg-slate-950">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="tags-query-input"
              name="tagQuery"
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter target niche keyword (e.g., sustainable packaging mockup)..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-indigo/25 transition hover:opacity-95 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? 'Extracting...' : 'Extract Clusters'}</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="font-medium text-slate-500 dark:text-slate-400">Sample Size</span>
            <select
              id="tags-topn-select"
              name="topN"
              aria-label="Top sellers sample count"
              value={topN}
              onChange={(e) => {
                const nextN = Number(e.target.value);
                setTopN(nextN);
                void runExtraction(queryInput, nextN, contentType, excludeNoise);
              }}
              className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
            >
              <option value={10} className="dark:bg-slate-900">Top 10 Sellers</option>
              <option value={15} className="dark:bg-slate-900">Top 15 Sellers</option>
              <option value={20} className="dark:bg-slate-900">Top 20 Sellers</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="font-medium text-slate-500 dark:text-slate-400">Content Type</span>
            <select
              id="tags-type-select"
              name="contentType"
              aria-label="Tag studio content type"
              value={contentType}
              onChange={(e) => {
                const nextType = e.target.value as ContentTypeFilter;
                setContentType(nextType);
                void runExtraction(queryInput, topN, nextType, excludeNoise);
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

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <input
              id="tags-noise-toggle"
              name="excludeNoise"
              type="checkbox"
              checked={excludeNoise}
              onChange={(e) => {
                const nextNoise = e.target.checked;
                setExcludeNoise(nextNoise);
                void runExtraction(queryInput, topN, contentType, nextNoise);
              }}
              className="accent-brand-indigo"
            />
            <span>Filter Filler &amp; Stopwords</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
          <span className="mr-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Quick niches:
          </span>
          {QUICK_TAG_NICHES.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setQueryInput(chip);
                void runExtraction(chip, topN, contentType, excludeNoise);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
              <div className="text-[11px] font-medium text-slate-500">SAMPLED TOP SELLERS</div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                {data.sampledCount}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {data.cached ? 'Cluster Cache' : 'Fresh Aggregation'}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
              <div className="text-[11px] font-medium text-slate-500">UNIQUE RANKED TAGS</div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-brand-indigo dark:text-indigo-300">
                {data.totalUniqueTags}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Ranked by frequency + buyer weight</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
              <div className="text-[11px] font-medium text-slate-500">BUYER INTENT SHARE</div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-brand-cyan">
                {data.buyerIntentShare}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Commercial &amp; placement tags</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
              <div className="text-[11px] font-medium text-slate-500">ADOBE SUBMISSION SLOTS</div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {selectedTags.length} / 49
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Adobe Stock 49-keyword ceiling</div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ranked Winning Tags (Click to Toggle Selection)
                </h2>
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[11px] dark:border-slate-800 dark:bg-slate-950">
                  <Filter className="mx-1.5 h-3 w-3 text-slate-400" />
                  {INTENT_FILTERS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setIntentFilter(tab)}
                      className={`rounded-md px-2.5 py-1 font-semibold transition ${intentFilter === tab
                          ? 'bg-brand-indigo text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {filteredClusters.map((item) => {
                  const active = selectedTags.includes(item.tag);
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => toggleTagSelection(item.tag)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${active
                          ? 'border-brand-indigo bg-brand-indigo/15 font-semibold text-brand-indigo dark:text-indigo-200'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                        }`}
                    >
                      {active && <Check className="h-3 w-3 shrink-0" />}
                      <span>{item.tag}</span>
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.frequency}/{data.sampledCount} · {item.relevanceScore}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Adobe Stock CSV Submission Builder
              </h2>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Customize metadata header and download in official Adobe Contributor upload order.
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label htmlFor="tags-draft-title" className="block font-medium text-slate-600 dark:text-slate-300">
                    Submission Title ({draftTitle.length}/200)
                  </label>
                  <input
                    id="tags-draft-title"
                    name="draftTitle"
                    type="text"
                    maxLength={200}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="tags-draft-category" className="block font-medium text-slate-600 dark:text-slate-300">
                    Recommended Category
                  </label>
                  <input
                    id="tags-draft-category"
                    name="draftCategory"
                    type="text"
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-medium text-slate-600 dark:text-slate-300">
                    <span>Selected Keywords ({selectedTags.length})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTags(data.recommendedTags.slice(0, 49))}
                      className="text-[11px] font-semibold text-brand-cyan hover:underline"
                    >
                      Select Top 49
                    </button>
                  </div>
                  <div className="mt-1 max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {selectedTags.join(', ') || 'No tags selected'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={selectedTags.length === 0}
                    onClick={() => void copyText(selectedTags.join(', '), `${selectedTags.length} tags`)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Tags</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedTags.length === 0}
                    onClick={() =>
                      exportAdobeDraftCsv({
                        filename: `${queryInput.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'asset'}.jpg`,
                        title: draftTitle,
                        keywords: selectedTags,
                        category: draftCategory,
                        slug: data.query,
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-cyan px-3 py-2.5 font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Adobe CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {topChartData.length > 0 && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-indigo" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Top-10 Keyword Relevance &amp; Coverage (%)
                  </h2>
                </div>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis dataKey="tag" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="relevance" name="Relevance Score" fill="#6366F1" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="coverage" name="Seller Coverage %" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sampled Source Sellers ({data.sourceAssets.length})
                  </h2>
                  <Link
                    to={`/search?q=${encodeURIComponent(queryInput)}`}
                    className="text-xs font-semibold text-brand-indigo hover:underline"
                  >
                    Open in Search &rarr;
                  </Link>
                </div>
                <div className="grid max-h-60 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {data.sourceAssets.map((item) => (
                    <Link
                      key={item.id}
                      to={`/similar?imageId=${encodeURIComponent(item.id)}`}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 transition hover:border-brand-indigo dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <img
                        src={item.thumbnailUrl?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '') || item.thumbnailUrl}
                        alt={item.title}
                        className="h-12 w-16 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {item.downloads.toLocaleString()} dl · {item.keywordsCount} tags
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
