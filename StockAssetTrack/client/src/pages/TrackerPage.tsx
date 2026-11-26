import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Bell,
  BellOff,
  Bookmark,
  ClipboardPaste,
  ExternalLink,
  Layers,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { AssetResultsBrowser } from '../components/AssetResultsBrowser';
import { useSavedItems } from '../hooks/useSavedItems';
import {
  addToWatchlist,
  fetchContributorStats,
  fetchWatchlist,
  removeFromWatchlist,
  searchContributor,
} from '../services/api';
import type {
  ContentTypeFilter,
  ContributorSearchResponse,
  ContributorStatsResponse,
  GenAIFilter,
  SortOption,
  WatchlistEntry,
} from '../types/stock';

const RECENT_KEY = 'sat_recent_contributors_v1';

const FEATURED_CREATORS = [
  { id: '203712637', label: 'natara 🇹🇭' },
  { id: '209884120', label: 'DhakaVectors 🇧🇩' },
  { id: '211509432', label: 'PixelForgeAI 🇺🇸' },
  { id: '204198211', label: 'StudioNord 🇩🇪' },
  { id: '207331904', label: 'KaitoVisuals 🇯🇵' },
  { id: '206112845', label: 'LuminaMotion 🇬🇧' },
];

interface RecentCreatorChip {
  id: string;
  name: string;
}

function readRecentCreators(): RecentCreatorChip[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentCreatorChip[]) : [];
  } catch {
    return [];
  }
}

export function TrackerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialInput = searchParams.get('creatorId') ?? searchParams.get('search') ?? '203712637';
  const initialOrder = (searchParams.get('order') as SortOption) ?? 'nb_downloads';
  const initialType = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
  const initialAi = (searchParams.get('generative_ai') as GenAIFilter) ?? 'all';
  const initialPage = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  const [lookupInput, setLookupInput] = useState(initialInput);
  const [activeQuery, setActiveQuery] = useState(initialInput);
  const [order, setOrder] = useState<SortOption>(initialOrder);
  const [contentType, setContentType] = useState<ContentTypeFilter>(initialType);
  const [generativeAi, setGenerativeAi] = useState<GenAIFilter>(initialAi);
  const [page, setPage] = useState(initialPage);

  const [portfolio, setPortfolio] = useState<ContributorSearchResponse | null>(null);
  const [stats, setStats] = useState<ContributorStatsResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [recentCreators, setRecentCreators] = useState<RecentCreatorChip[]>(() => readRecentCreators());
  const [loading, setLoading] = useState(false);
  const [togglingWatch, setTogglingWatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string>('');

  const { isContributorSaved, toggleContributor } = useSavedItems();

  const refreshWatchlist = async () => {
    try {
      const res = await fetchWatchlist();
      setWatchlist(res.items);
    } catch {
      setWatchlist([]);
    }
  };

  useEffect(() => {
    void refreshWatchlist();
    const syncHandler = () => {
      void refreshWatchlist();
    };
    window.addEventListener('sat:watchlist-changed', syncHandler);
    return () => window.removeEventListener('sat:watchlist-changed', syncHandler);
  }, []);

  const recordRecent = (id: string, name: string) => {
    const next = [{ id, name }, ...readRecentCreators().filter((c) => c.id !== id)].slice(0, 6);
    setRecentCreators(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures
    }
  };

  const loadPortfolio = async (
    rawSearch: string,
    nextOrder: SortOption,
    nextType: ContentTypeFilter,
    nextAi: GenAIFilter,
    nextPage: number
  ) => {
    const cleaned = rawSearch.trim();
    if (!cleaned) {
      setError('Paste an Adobe Stock contributor URL or numeric Creator ID.');
      return;
    }

    const urlParams = new URLSearchParams();
    urlParams.set('creatorId', cleaned);
    if (nextOrder !== 'nb_downloads') urlParams.set('order', nextOrder);
    if (nextType !== 'all') urlParams.set('content_type', nextType);
    if (nextAi !== 'all') urlParams.set('generative_ai', nextAi);
    if (nextPage > 1) urlParams.set('page', String(nextPage));

    const key = urlParams.toString();
    lastKeyRef.current = key;
    setSearchParams(urlParams, { replace: true });

    setLoading(true);
    setError(null);

    try {
      const portfolioRes = await searchContributor({
        search: cleaned,
        order: nextOrder,
        contentType: nextType,
        generativeAi: nextAi,
        page: nextPage,
      });
      setPortfolio(portfolioRes);
      setActiveQuery(portfolioRes.contributor.id);
      recordRecent(portfolioRes.contributor.id, portfolioRes.contributor.name);

      const statsRes = await fetchContributorStats(portfolioRes.contributor.id);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contributor lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const creatorParam = searchParams.get('creatorId') ?? searchParams.get('search') ?? '203712637';
    const ord = (searchParams.get('order') as SortOption) ?? 'nb_downloads';
    const typ = (searchParams.get('content_type') as ContentTypeFilter) ?? 'all';
    const ai = (searchParams.get('generative_ai') as GenAIFilter) ?? 'all';
    const pg = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

    const normalized = new URLSearchParams();
    normalized.set('creatorId', creatorParam);
    if (ord !== 'nb_downloads') normalized.set('order', ord);
    if (typ !== 'all') normalized.set('content_type', typ);
    if (ai !== 'all') normalized.set('generative_ai', ai);
    if (pg > 1) normalized.set('page', String(pg));

    const key = normalized.toString();
    if (lastKeyRef.current === key) {
      return;
    }

    setLookupInput(creatorParam);
    setActiveQuery(creatorParam);
    setOrder(ord);
    setContentType(typ);
    setGenerativeAi(ai);
    setPage(pg);
    void loadPortfolio(creatorParam, ord, typ, ai, pg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const activeCreator = portfolio?.contributor;
  const isWatching = activeCreator
    ? watchlist.some((w) => w.creatorId === activeCreator.id)
    : false;

  const handleToggleWatchlist = async () => {
    if (!activeCreator) return;
    setTogglingWatch(true);
    try {
      if (isWatching) {
        await removeFromWatchlist(activeCreator.id);
        toast.success(`Stopped watching ${activeCreator.name}`);
      } else {
        await addToWatchlist({
          creatorId: activeCreator.id,
          creatorName: activeCreator.name,
          totalAssets: stats?.totalAssets ?? 0,
          totalDownloads: stats?.totalDownloads ?? 0,
          notifyEnabled: true,
        });
        toast.success(`Added ${activeCreator.name} to MySQL Watchlist`);
      }
      await refreshWatchlist();
      window.dispatchEvent(new Event('sat:watchlist-changed'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Watchlist update failed');
    } finally {
      setTogglingWatch(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setLookupInput(text.trim());
        toast.success('Pasted contributor URL or ID');
      }
    } catch {
      toast.error('Clipboard read blocked by browser permission');
    }
  };

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-1 text-[11px] font-semibold text-brand-indigo dark:text-indigo-300">
          <Users className="h-3.5 w-3.5" />
          <span>Contributor Intelligence &amp; Competitor Watchlist</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Contributor Portfolio Tracker
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Paste any Adobe Stock contributor URL or numeric ID to inspect portfolio velocity, AI share, country origin, and track competitors in MySQL.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void loadPortfolio(lookupInput, order, contentType, generativeAi, 1);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-brand-indigo focus-within:ring-2 focus-within:ring-brand-indigo/20 dark:border-slate-700 dark:bg-slate-950">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="tracker-creator-input"
              name="creatorLookup"
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Paste Adobe Stock URL (https://stock.adobe.com/contributor/203712637/natara) or Creator ID..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ClipboardPaste className="h-3 w-3" />
              <span>Paste</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-indigo/25 transition hover:opacity-95 disabled:opacity-60"
          >
            <Activity className="h-4 w-4" />
            <span>{loading ? 'Analyzing...' : 'Inspect Portfolio'}</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="font-medium text-slate-500 dark:text-slate-400">Sort By</span>
            <select
              id="tracker-order-select"
              name="order"
              aria-label="Portfolio Sort By"
              value={order}
              onChange={(e) => {
                const nextOrder = e.target.value as SortOption;
                setOrder(nextOrder);
                setPage(1);
                void loadPortfolio(activeQuery, nextOrder, contentType, generativeAi, 1);
              }}
              className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
            >
              <option value="nb_downloads" className="dark:bg-slate-900">Most Downloaded</option>
              <option value="creation" className="dark:bg-slate-900">Newest</option>
              <option value="featured" className="dark:bg-slate-900">Featured</option>
              <option value="undiscovered" className="dark:bg-slate-900">Undiscovered</option>
              <option value="relevance" className="dark:bg-slate-900">Relevance</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="font-medium text-slate-500 dark:text-slate-400">Content Type</span>
            <select
              id="tracker-type-select"
              name="contentType"
              aria-label="Portfolio Content Type"
              value={contentType}
              onChange={(e) => {
                const nextType = e.target.value as ContentTypeFilter;
                setContentType(nextType);
                setPage(1);
                void loadPortfolio(activeQuery, order, nextType, generativeAi, 1);
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
                  void loadPortfolio(activeQuery, order, contentType, opt.value, 1);
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
            Sample portfolios:
          </span>
          {FEATURED_CREATORS.map((fc) => (
            <button
              key={fc.id}
              type="button"
              onClick={() => {
                setLookupInput(fc.id);
                setPage(1);
                void loadPortfolio(fc.id, order, contentType, generativeAi, 1);
              }}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${activeCreator?.id === fc.id
                  ? 'border-brand-indigo bg-brand-indigo/15 text-brand-indigo dark:text-indigo-300'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
            >
              {fc.label}
            </button>
          ))}

          {recentCreators.length > 0 && (
            <>
              <span className="ml-2 text-[11px] font-medium text-slate-400">Recent:</span>
              {recentCreators.map((rc) => (
                <button
                  key={`recent:${rc.id}`}
                  type="button"
                  onClick={() => {
                    setLookupInput(rc.id);
                    setPage(1);
                    void loadPortfolio(rc.id, order, contentType, generativeAi, 1);
                  }}
                  className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-[11px] font-medium text-brand-cyan hover:bg-brand-cyan/20"
                >
                  {rc.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeCreator && stats && (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/75">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-cyan text-lg font-extrabold text-white shadow">
                  {activeCreator.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeCreator.name}
                    </h2>
                    {activeCreator.country && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {activeCreator.country.flag} {activeCreator.country.name}
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-500">ID #{activeCreator.id}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Stats source: {stats.cached ? 'MySQL 6h Cache' : stats.source} · Computed{' '}
                    {new Date(stats.computedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={togglingWatch}
                  onClick={() => void handleToggleWatchlist()}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${isWatching
                      ? 'border border-brand-cyan/40 bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25'
                      : 'bg-brand-indigo text-white hover:bg-indigo-500'
                    }`}
                >
                  {isWatching ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                  <span>{isWatching ? 'Watching (MySQL)' : 'Watch Competitor'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleContributor({
                      id: activeCreator.id,
                      name: activeCreator.name,
                      country: activeCreator.country?.name,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${isContributorSaved(activeCreator.id)
                      ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo dark:text-indigo-300'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{isContributorSaved(activeCreator.id) ? 'Saved' : 'Save Favorite'}</span>
                </button>

                <a
                  href={activeCreator.adobeProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>Adobe Stock Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-medium text-slate-500">TOTAL ASSETS</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalAssets.toLocaleString()}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-medium text-slate-500">TOTAL DOWNLOADS</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-brand-cyan">
                  {stats.totalDownloads.toLocaleString()}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>AI VS NON-AI SPLIT</span>
                  <span className="font-mono font-bold text-brand-purple">{stats.aiPercent}% AI</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-500/30">
                  <div
                    className="h-full bg-brand-purple transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, stats.aiPercent))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                  <span>{stats.aiCount.toLocaleString()} AI</span>
                  <span>{stats.nonAiCount.toLocaleString()} Non-AI</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-medium text-slate-500">AVG DOWNLOADS / FILE</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-brand-indigo dark:text-indigo-300">
                  {stats.avgDownloads.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-cyan" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    8-Month Download &amp; Portfolio Velocity Trend
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">Monthly Downloads vs Uploads</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trackerDownloadsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
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
                    <Area
                      type="monotone"
                      dataKey="downloads"
                      name="Monthly Downloads"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#trackerDownloadsFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="velocity"
                      name="Velocity Index (~D/M)"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-indigo" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top Portfolio Categories
                </h3>
              </div>
              <div className="space-y-3">
                {stats.topCategories.map((cat) => {
                  const maxDl = Math.max(1, stats.topCategories[0]?.downloads ?? 1);
                  const pct = Math.round((cat.downloads / maxDl) * 100);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(cat.name)}&order=nb_downloads`)}
                      className="block w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-left transition hover:border-brand-indigo dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <span>{cat.name}</span>
                        <span className="font-mono text-brand-cyan">
                          {cat.downloads.toLocaleString()} dl
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="h-full bg-brand-indigo" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-cyan" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Competitor Watchlist (MySQL Persisted)
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {watchlist.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Tracks snapshot deltas across portfolio checks
          </span>
        </div>

        {watchlist.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            No contributors on your MySQL watchlist yet. Click &ldquo;Watch Competitor&rdquo; above to track new uploads &amp; download growth.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {watchlist.map((entry) => (
              <div
                key={entry.creatorId}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                    <span className="truncate">{entry.creatorName}</span>
                    <span>{entry.country?.flag ?? '📍'}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.liveTotalAssets.toLocaleString()} assets ({entry.deltaAssets >= 0 ? `+${entry.deltaAssets}` : entry.deltaAssets}) ·{' '}
                    {entry.liveTotalDownloads.toLocaleString()} dl · {entry.aiPercent}% AI
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLookupInput(entry.creatorId);
                      setPage(1);
                      void loadPortfolio(entry.creatorId, order, contentType, generativeAi, 1);
                    }}
                    className="rounded-lg bg-brand-indigo/10 px-2.5 py-1 font-semibold text-brand-indigo hover:bg-brand-indigo/20 dark:text-indigo-300"
                  >
                    Inspect
                  </button>
                  <button
                    type="button"
                    aria-label={`Unwatch ${entry.creatorName}`}
                    onClick={async () => {
                      await removeFromWatchlist(entry.creatorId);
                      await refreshWatchlist();
                      window.dispatchEvent(new Event('sat:watchlist-changed'));
                      toast.success(`Removed ${entry.creatorName}`);
                    }}
                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(portfolio || loading) && (
        <AssetResultsBrowser
          assets={portfolio?.assets ?? []}
          summary={portfolio?.summary ?? null}
          cached={Boolean(portfolio?.cached)}
          loading={loading}
          exportSlug={`contributor-${activeCreator?.name ?? activeQuery}`}
          page={page}
          hasMore={Boolean(portfolio?.hasMore)}
          resetKey={lastKeyRef.current}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            void loadPortfolio(activeQuery, order, contentType, generativeAi, nextPage);
          }}
          onClickTag={(tag) => navigate(`/search?q=${encodeURIComponent(tag)}`)}
          onSelectTypeFromSummary={(nextType) => {
            setContentType(nextType);
            setPage(1);
            void loadPortfolio(activeQuery, order, nextType, generativeAi, 1);
          }}
        />
      )}
    </section>
  );
}
