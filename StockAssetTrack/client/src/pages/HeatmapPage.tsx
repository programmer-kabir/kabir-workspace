import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Clock,
  Grid2x2,
  RefreshCw,
  Sparkles,
  TrendingUp,
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
import { fetchHeatmap } from '../services/api';
import type {
  ContentTypeFilter,
  HeatmapCategoryTile,
  HeatmapMetric,
  HeatmapResponse,
} from '../types/stock';
import { formatCompactNumber } from '../utils/assetUtils';

const METRIC_OPTIONS: { value: HeatmapMetric; label: string }[] = [
  { value: 'totalDownloads', label: 'Downloads (Top 100)' },
  { value: 'avgDownloads', label: 'Avg Downloads / Asset' },
  { value: 'sampleSize', label: 'Sample Size' },
];

const TIER_STYLES = [
  {
    tier: 1,
    label: 'Very Low',
    swatch: 'bg-slate-200 dark:bg-slate-800',
    tile: 'border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/70',
    valueText: 'text-slate-700 dark:text-slate-300',
  },
  {
    tier: 2,
    label: 'Low',
    swatch: 'bg-sky-400/50',
    tile: 'border-sky-500/25 bg-sky-500/10 dark:border-sky-500/25 dark:bg-sky-950/35',
    valueText: 'text-sky-600 dark:text-sky-300',
  },
  {
    tier: 3,
    label: 'Moderate',
    swatch: 'bg-brand-cyan/70',
    tile: 'border-cyan-500/35 bg-cyan-500/15 dark:border-cyan-500/35 dark:bg-cyan-950/40',
    valueText: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    tier: 4,
    label: 'High',
    swatch: 'bg-brand-indigo/80',
    tile: 'border-indigo-500/40 bg-indigo-500/15 dark:border-indigo-500/45 dark:bg-indigo-950/50',
    valueText: 'text-brand-indigo dark:text-indigo-300',
  },
  {
    tier: 5,
    label: 'Peak Demand',
    swatch: 'bg-emerald-500',
    tile: 'border-emerald-500/50 bg-emerald-500/15 shadow-lg shadow-emerald-500/10 dark:border-emerald-500/50 dark:bg-emerald-950/50',
    valueText: 'text-emerald-600 dark:text-emerald-300',
  },
] as const;

export function HeatmapPage() {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<HeatmapMetric>('totalDownloads');
  const [selectedType, setSelectedType] = useState<ContentTypeFilter>('all');
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = async (nextMetric: HeatmapMetric, nextType: ContentTypeFilter, forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetchHeatmap(nextMetric, nextType, forceRefresh);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category heatmap.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSnapshot(metric, selectedType, false);
    // Initial snapshot load; subsequent metric/type tabs slice cached 6-type payload instantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTiles = useMemo(() => {
    if (!data) return [];
    const list: HeatmapCategoryTile[] =
      selectedType === 'all'
        ? Object.values(data.categoriesByType).flat()
        : data.categoriesByType[selectedType] ?? [];

    return [...list].sort((a, b) => b[metric] - a[metric]);
  }, [data, selectedType, metric]);

  const metricRange = useMemo(() => {
    if (activeTiles.length === 0) return { min: 0, max: 1 };
    const values = activeTiles.map((tile) => tile[metric]);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [activeTiles, metric]);

  const resolveTierStyle = (value: number) => {
    const span = Math.max(1, metricRange.max - metricRange.min);
    const ratio = (value - metricRange.min) / span;
    const tierIndex = Math.min(4, Math.max(0, Math.floor(ratio * 4.99)));
    return TIER_STYLES[tierIndex];
  };

  const chartData = useMemo(() => {
    return (data?.mediaTypes ?? []).map((mt) => ({
      name: mt.label,
      downloadsK: Math.round(mt.totalDownloads / 1000),
      aiPercent: mt.aiPercent,
    }));
  }, [data]);

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-1 text-[11px] font-semibold text-brand-indigo dark:text-indigo-300">
            <Grid2x2 className="h-3.5 w-3.5" />
            <span>6-Type Category Demand Matrix</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Adobe Stock Category Heat Map
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Top-100 downloads sampled across Photo, Illustration, Vector, Video, Template, and 3D. Click any tile to launch Niche Explorer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSnapshot(metric, selectedType, true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:border-brand-indigo hover:text-brand-indigo disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Rebuilding...' : 'Refresh Snapshot'}</span>
        </button>
      </div>

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="text-[11px] font-medium text-slate-500">SAMPLED ASSETS (6 TYPES)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
              {data.summary.totalSampledAssets.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {formatCompactNumber(data.summary.totalSampledDownloads)} cumulative top downloads
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="text-[11px] font-medium text-slate-500">PEAK VOLUME CATEGORY</div>
            <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {data.summary.topCategory.name}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {data.summary.topCategory.mediaType} ·{' '}
              {formatCompactNumber(data.summary.topCategory.totalDownloads)} downloads
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-brand-cyan" />
              <span>FASTEST VELOCITY NICHE</span>
            </div>
            <div className="mt-1 text-lg font-bold text-brand-cyan">
              {data.summary.topVelocityCategory.name}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {data.summary.topVelocityCategory.mediaType} · ~{data.summary.topVelocityCategory.avgVelocity} D/M
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5 text-brand-indigo" />
              <span>SNAPSHOT &amp; AI SHARE</span>
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono text-lg font-bold text-slate-900 dark:text-white">
              <span>{data.summary.overallAiPercent}% AI</span>
              <span className="rounded-full bg-brand-indigo/15 px-2 py-0.5 text-[10px] font-semibold text-brand-indigo dark:text-indigo-300">
                {data.cached ? 'MySQL Cached' : data.triggerSource}
              </span>
            </div>
            <div className="mt-1 truncate text-[11px] text-slate-500">
              Updated {new Date(data.generatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/75">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedType === 'all'
                  ? 'bg-brand-indigo text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
            >
              All 6 Types ({data?.summary.totalSampledAssets ?? 600})
            </button>

            {(data?.mediaTypes ?? []).map((mt) => (
              <button
                key={mt.key}
                type="button"
                onClick={() => setSelectedType(mt.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedType === mt.key
                    ? 'bg-brand-indigo text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
              >
                {mt.label} ({mt.sampledAssets})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-950">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMetric(opt.value)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${metric === opt.value
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 text-[11px] dark:border-slate-800/80">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            5-Tier Intensity Scale ({METRIC_OPTIONS.find((m) => m.value === metric)?.label}):
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {TIER_STYLES.map((tier) => (
              <span key={tier.tier} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className={`h-3 w-3 rounded ${tier.swatch}`} />
                <span>{tier.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeTiles.map((tile) => {
              const primaryValue = tile[metric];
              const style = resolveTierStyle(primaryValue);
              return (
                <button
                  key={`${tile.mediaTypeKey}:${tile.name}`}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/search?q=${encodeURIComponent(tile.name)}&order=nb_downloads&content_type=${encodeURIComponent(tile.mediaTypeKey)}`
                    )
                  }
                  className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${style.tile}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-950/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {tile.mediaType}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        <Sparkles className="h-3 w-3 text-brand-purple" />
                        {tile.aiPercent}% AI
                      </span>
                    </div>

                    <h2 className="mt-2.5 text-sm font-bold text-slate-900 group-hover:text-brand-indigo dark:text-white dark:group-hover:text-indigo-300">
                      {tile.name}
                    </h2>
                  </div>

                  <div className="mt-3">
                    <div className={`font-mono text-2xl font-extrabold ${style.valueText}`}>
                      {metric === 'sampleSize'
                        ? `${primaryValue} assets`
                        : primaryValue.toLocaleString()}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Avg ~{tile.avgVelocity} D/M</span>
                      <span>{tile.sampleSize} in Top 100</span>
                    </div>

                    {tile.topKeywords.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {tile.topKeywords.slice(0, 3).map((kw) => (
                          <span
                            key={kw}
                            className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-950/70 dark:text-slate-300"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {chartData.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-cyan" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Media Type Download Volume (K) vs AI Share (%)
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Across Top 100 Sampled Assets per Type
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
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
                    <Bar dataKey="downloadsK" name="Downloads (K)" fill="#6366F1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="aiPercent" name="AI Share %" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
