import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ModuleSpec {
  phase: string;
  title: string;
  subtitle: string;
  endpoints: string[];
  capabilities: string[];
}

export function ModulePlaceholder({ spec }: { spec: ModuleSpec }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-1 text-xs font-semibold text-brand-indigo dark:text-indigo-300">
          <Layers className="h-3.5 w-3.5" />
          <span>{spec.phase} Ready in Blueprint</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {spec.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{spec.subtitle}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Planned Capabilities
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-700 dark:text-slate-200">
              {spec.capabilities.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pure PHP Endpoints Mapped
            </h2>
            <ul className="mt-3 space-y-2 font-mono text-xs text-brand-indigo dark:text-cyan-300">
              {spec.endpoints.map((ep) => (
                <li
                  key={ep}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  {ep}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Scaffold verified in Phase 1 · Swappable Demo/Official Adobe Adapter ready
          </span>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-indigo px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            <span>Back to Overview</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
