import { Flame, Gauge, ShieldAlert, TrendingUp } from 'lucide-react';
import type { ContentTypeFilter, SearchSummary } from '../types/stock';
import { formatCompactNumber } from '../utils/assetUtils';

interface MarketSummaryBarProps {
  summary: SearchSummary;
  onSelectType: (type: ContentTypeFilter) => void;
}

export function MarketSummaryBar({ summary, onSelectType }: MarketSummaryBarProps) {
  const competitionStyle =
    summary.competitionLevel === 'Low'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : summary.competitionLevel === 'Medium'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';

  const typeEntries: { key: 'photo' | 'illustration' | 'vector' | 'video'; label: string }[] = [
    { key: 'photo', label: 'Photos' },
    { key: 'illustration', label: 'Illust' },
    { key: 'vector', label: 'Vectors' },
    { key: 'video', label: 'Videos' },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/75">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {summary.totalResults.toLocaleString()} results for &ldquo;{summary.query}&rdquo;
            </h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${competitionStyle}`}>
              {summary.competitionLevel} Competition
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan">
              <TrendingUp className="h-3 w-3" />
              {summary.trendType}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {typeEntries.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onSelectType(key)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {label}:{' '}
                <span className="font-mono font-semibold">
                  {formatCompactNumber(summary.typeCounts[key])}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ScorePill icon={Flame} label="Demand" score={summary.demandScore} tone="text-brand-cyan" />
          <ScorePill icon={ShieldAlert} label="Saturation" score={summary.competitionScore} tone="text-amber-400" />
          <ScorePill icon={Gauge} label="Opportunity" score={summary.opportunityIndex} tone="text-brand-indigo" />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-600 dark:text-slate-300">
            AI vs Real Split: <strong className="text-brand-purple">{summary.aiSplit.aiPercent}% AI</strong>
          </span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {formatCompactNumber(summary.aiSplit.aiCount)} AI /{' '}
            {formatCompactNumber(summary.aiSplit.realCount)} Real
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all"
            style={{ width: `${summary.aiSplit.aiPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ScorePill({
  icon: Icon,
  label,
  score,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  score: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <Icon className={`h-3 w-3 ${tone}`} />
        <span>{label}</span>
      </div>
      <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
        {score}
        <span className="text-[11px] font-normal text-slate-400">/100</span>
      </div>
    </div>
  );
}
