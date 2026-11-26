import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Calendar,
  Database,
  Flame,
  Grid2x2,
  Layers,
  Search,
  Sparkles,
  Tags,
  Users,
} from 'lucide-react';
import type { HealthResponse } from '../types/stock';

const MODULES = [
  {
    to: '/search',
    title: 'Niche & Market Explorer',
    desc: 'Opportunity Index (1-100), Demand vs Competition, AI vs Real split & 12 instant sorts.',
    icon: Search,
  },
  {
    to: '/similar',
    title: 'Visual Similar & Image Spy',
    desc: 'Reverse-match by Asset ID or reference image upload with full download & tag enrichment.',
    icon: Layers,
  },
  {
    to: '/trending',
    title: 'Trending Velocity Spy',
    desc: 'Surface recent uploads achieving breakout monthly download velocity (~D/M).',
    icon: Flame,
  },
  {
    to: '/tracker',
    title: 'Portfolio Tracker',
    desc: 'Inspect any contributor portfolio, country flags, AI ratios & Recharts velocity.',
    icon: Users,
  },
  {
    to: '/heatmap',
    title: 'Category Heat Map',
    desc: '6-type category demand density across Photo, Illustration, Vector, Video, Template & 3D.',
    icon: Grid2x2,
  },
  {
    to: '/tags',
    title: 'Top-10 Tag Cluster Studio',
    desc: 'Aggregate winning tags from top sellers and export Adobe Stock CSV submissions.',
    icon: Tags,
  },
  {
    to: '/prompts',
    title: 'AI Prompt Reverse Engineer',
    desc: 'Reconstruct Midjourney v6, Flux 1.1 Pro & Stable Diffusion prompts from top sellers.',
    icon: Sparkles,
  },
  {
    to: '/calendar',
    title: 'Seasonal Trend Calendar',
    desc: '60-90 day predictive upload calendar linked straight to Niche Explorer.',
    icon: Calendar,
  },
];

export function LandingPage({ health }: { health: HealthResponse | null }) {
  return (
    <div className="mx-auto  px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-indigo/30 bg-brand-indigo/10 px-3.5 py-1 text-xs font-medium text-brand-indigo dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Built for Adobe Stock Contributors &amp; AI Creators</span>
        </div>

        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-brand-indigo to-brand-cyan bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-indigo-300 dark:to-cyan-300 sm:text-6xl">
          Stop Guessing. Track What Sells on Adobe Stock.
        </h1>

        <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
          Discover low-competition niches, track top contributor portfolios, inspect category
          heat maps, extract high-intent tag clusters, and reverse-engineer winning AI prompts.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-indigo/25 transition hover:opacity-95"
          >
            <span>Open Niche Explorer</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <span>View Plans</span>
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span>Backend Runtime</span>
          </div>
          <p className="mt-2 font-mono text-sm font-semibold text-slate-900 dark:text-white">
            {health ? `PHP ${health.phpVersion} (${health.environment})` : 'Connecting to :5001...'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Database className="h-4 w-4 text-brand-cyan" />
            <span>MySQL / MariaDB Status</span>
          </div>
          <p className="mt-2 font-mono text-sm font-semibold text-slate-900 dark:text-white">
            {health ? health.database.status : 'Checking...'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Search className="h-4 w-4 text-brand-purple" />
            <span>Adobe Data Adapter</span>
          </div>
          <p className="mt-2 font-mono text-sm font-semibold text-slate-900 dark:text-white">
            {health ? `mode=${health.adobeDataMode}` : 'demo (swappable)'}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map(({ to, title, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-slate-200 bg-white/80 p-6 transition hover:-translate-y-0.5 hover:border-brand-indigo/60 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-indigo/60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-indigo/10 text-brand-indigo dark:text-indigo-300">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-brand-indigo dark:text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
