import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  Flame,
  Sparkles,
  Tags,
} from 'lucide-react';
import { fetchSeasonalCalendar } from '../services/api';
import type { CalendarResponse } from '../types/stock';

const HORIZON_OPTIONS = [
  { days: 60, label: '60 Days' },
  { days: 90, label: '90 Days (Recommended)' },
  { days: 180, label: '180 Days' },
  { days: 365, label: 'Full 12 Months' },
];

const CATEGORY_TABS = [
  { value: 'all', label: 'All Events' },
  { value: 'holidays', label: 'Holidays & Festivals' },
  { value: 'business', label: 'Business & Retail' },
  { value: 'seasonal', label: 'Seasonal & Wellness' },
];

export function CalendarPage() {
  const [daysAhead, setDaysAhead] = useState(90);
  const [category, setCategory] = useState('all');
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchSeasonalCalendar(daysAhead, category)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load seasonal calendar.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [daysAhead, category]);

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-500">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>60-90 Day Predictive Upload Roadmap</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Seasonal Trend &amp; Upload Calendar
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Upload assets 60-90 days ahead of seasonal search peaks so Adobe Stock indexes your titles and keywords before buyers arrive.
        </p>
      </div>

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="text-[11px] font-medium text-slate-500">PLANNING HORIZON</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
              {data.daysAhead} Days
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Anchored to {data.referenceDate}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="text-[11px] font-medium text-slate-500">EVENTS IN WINDOW</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-brand-indigo dark:text-indigo-300">
              {data.totalEvents}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {data.cached ? 'Seasonal Cache' : 'Fresh Schedule'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span>PRIME UPLOAD SWEET SPOT</span>
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-500">
              {data.primeWindowCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Ideal 21-90 day indexing runway</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Flame className="h-3.5 w-3.5 text-brand-cyan" />
              <span>PEAK DEMAND EVENT</span>
            </div>
            <div className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
              {data.topEvent}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Highest seasonal buyer volume</div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {HORIZON_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDaysAhead(opt.days)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${daysAhead === opt.days
                  ? 'bg-brand-indigo text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${category === tab.value
                  ? 'bg-brand-cyan text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
            >
              {tab.label}
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

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70"
            />
          ))}
        </div>
      ) : data && data.events.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {data.events.map((evt) => {
            const compStyle =
              evt.competitionLevel === 'Low'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : evt.competitionLevel === 'Medium'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-500';

            return (
              <article
                key={evt.slug}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-brand-indigo/50 dark:border-slate-800 dark:bg-slate-900/75"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-semibold ${evt.isPrimeWindow
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-500'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                        }`}
                    >
                      {evt.urgency}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 font-semibold ${compStyle}`}>
                      {evt.competitionLevel} Competition
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    {evt.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Event Date: {evt.eventDate}</span>
                    <span className="font-mono font-semibold text-brand-cyan">
                      {evt.daysUntilEvent}d away
                    </span>
                    <span>Recommended Start: {evt.uploadWindowStart}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="font-medium text-slate-500">Demand Score:</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
                        style={{ width: `${evt.demandScore}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {evt.demandScore}/100
                    </span>
                  </div>

                  <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-purple" />
                    <span>{evt.aiNote}</span>
                  </p>

                  <div className="mt-3">
                    <div className="text-[11px] font-medium text-slate-500">
                      Recommended Sub-Niches:
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {evt.subNiches.map((niche) => (
                        <Link
                          key={niche}
                          to={`/search?q=${encodeURIComponent(niche)}&order=nb_downloads`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                        >
                          {niche}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-xs dark:border-slate-800/80">
                  <Link
                    to={`/tags?q=${encodeURIComponent(evt.primaryQuery)}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-brand-cyan hover:underline"
                  >
                    <Tags className="h-3.5 w-3.5" />
                    <span>Extract Tags</span>
                  </Link>

                  <Link
                    to={`/search?q=${encodeURIComponent(evt.primaryQuery)}&order=nb_downloads`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-indigo px-3.5 py-1.5 font-semibold text-white transition hover:bg-indigo-500"
                  >
                    <span>Explore Niche</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-800">
          No seasonal events found in this filter range. Try expanding to 180 Days or All Events.
        </div>
      )}
    </section>
  );
}
