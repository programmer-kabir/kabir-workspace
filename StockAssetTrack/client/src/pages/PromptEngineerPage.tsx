import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  Copy,
  Layers,
  Palette,
  Sparkles,
  SunMedium,
  Tags,
  Wand2,
} from 'lucide-react';
import { reconstructAiPrompt } from '../services/api';
import type { PromptReconstructResponse } from '../types/stock';
import { copyText } from '../utils/assetUtils';

const STYLE_PRESETS = [
  'Commercial Editorial',
  'Minimalist Studio Product',
  'Isometric 3D Diorama',
  'Editorial Flat Vector',
  'Cinematic Golden Hour',
];

const SAMPLE_AI_ASSETS = [
  { id: '489201100', label: '#489201100 · Abstract Scene' },
  { id: '805638007', label: '#805638007 · Lifestyle Concept' },
  { id: '486060497', label: '#486060497 · Flat Modern Design' },
];

export function PromptEngineerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAssetId = (searchParams.get('assetId') ?? '').trim();

  const [assetIdInput, setAssetIdInput] = useState(initialAssetId || '489201100');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[0]);
  const [activePromptTab, setActivePromptTab] = useState<'midjourney' | 'flux' | 'sd'>('midjourney');

  const [data, setData] = useState<PromptReconstructResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRunRef = useRef('');

  const runReconstruct = async (opts: { assetId?: string; title?: string; preset: string }) => {
    const cleanId = opts.assetId?.trim() ?? '';
    const cleanTitle = opts.title?.trim() ?? '';

    if (!cleanId && !cleanTitle) {
      setError('Enter an Adobe Stock Asset ID or a custom visual concept title.');
      return;
    }

    const params = new URLSearchParams();
    if (cleanId) params.set('assetId', cleanId);
    const key = `${cleanId}|${cleanTitle}|${opts.preset}`;
    lastRunRef.current = key;
    if (cleanId) {
      setSearchParams(params, { replace: true });
    }

    setLoading(true);
    setError(null);
    try {
      const res = await reconstructAiPrompt({
        assetId: cleanId || undefined,
        title: cleanTitle || undefined,
        stylePreset: opts.preset,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prompt reconstruction failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlId = (searchParams.get('assetId') ?? '489201100').trim();
    const key = `${urlId}||${stylePreset}`;
    if (lastRunRef.current === key) return;
    setAssetIdInput(urlId);
    void runReconstruct({ assetId: urlId, preset: stylePreset });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-[11px] font-semibold text-brand-purple">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Multimodal Prompt Engineering Studio</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            AI Prompt Reverse Engineer
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Deconstruct top-selling AI &amp; commercial Adobe Stock visuals into Midjourney v6, Flux 1.1 Pro, and Stable Diffusion prompts.
          </p>
        </div>

        {data && (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Engine: {data.provider === 'local_heuristic' ? 'Visual Spec Compiler' : data.provider}{' '}
            {data.cached ? '· Cached' : ''}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runReconstruct({
              assetId: customTitleInput.trim() ? '' : assetIdInput,
              title: customTitleInput.trim() || undefined,
              preset: stylePreset,
            });
          }}
          className="grid gap-3 md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <label htmlFor="prompt-asset-id" className="block text-[11px] font-semibold text-slate-500">
              Adobe Stock Asset ID
            </label>
            <input
              id="prompt-asset-id"
              name="assetId"
              type="text"
              value={assetIdInput}
              onChange={(e) => setAssetIdInput(e.target.value)}
              placeholder="e.g. 489201100"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="prompt-concept-title" className="block text-[11px] font-semibold text-slate-500">
              Or Custom Concept Override
            </label>
            <input
              id="prompt-concept-title"
              name="conceptTitle"
              type="text"
              value={customTitleInput}
              onChange={(e) => setCustomTitleInput(e.target.value)}
              placeholder="Optional: e.g. Solar glass capsule in minimalist studio"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-purple/20 transition hover:opacity-95 disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" />
              <span>{loading ? 'Analyzing...' : 'Reconstruct'}</span>
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Style Preset:</span>
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setStylePreset(preset);
                void runReconstruct({
                  assetId: customTitleInput.trim() ? '' : assetIdInput,
                  title: customTitleInput.trim() || undefined,
                  preset,
                });
              }}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${stylePreset === preset
                  ? 'border-brand-purple bg-brand-purple/15 text-brand-purple'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-purple dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
          <span className="mr-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Sample top sellers:
          </span>
          {SAMPLE_AI_ASSETS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setAssetIdInput(sample.id);
                setCustomTitleInput('');
                void runReconstruct({ assetId: sample.id, preset: stylePreset });
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              {sample.label}
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
          {data.referenceAsset && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand-purple/30 bg-white/90 p-4 dark:bg-slate-900/80 sm:flex-row sm:items-center">
              <img
                src={data.referenceAsset.thumbnailUrl}
                alt={data.referenceAsset.title}
                className="h-28 w-44 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-brand-purple/15 px-2.5 py-0.5 font-semibold text-brand-purple">
                    Reference #{data.referenceAsset.id}
                  </span>
                  <span className="text-slate-500">
                    {data.referenceAsset.mediaType} · {data.referenceAsset.category}
                  </span>
                </div>
                <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                  {data.referenceAsset.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {data.referenceAsset.downloads.toLocaleString()} downloads ·{' '}
                  {data.referenceAsset.monthlyVelocity === null
                    ? 'N/A'
                    : `~${data.referenceAsset.monthlyVelocity} D/M`}{' '}
                  · {data.referenceAsset.creator}
                </p>
              </div>
              <Link
                to={`/similar?imageId=${encodeURIComponent(data.referenceAsset.id)}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Find Similar</span>
              </Link>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Sparkles, label: 'Subject Core', val: data.visualBreakdown.subject },
              { icon: Layers, label: 'Composition & Copy Space', val: data.visualBreakdown.composition },
              { icon: SunMedium, label: 'Lighting & Mood', val: data.visualBreakdown.lighting },
              { icon: Palette, label: 'Color Palette', val: data.visualBreakdown.colorPalette },
              { icon: Camera, label: 'Lens & Render Specs', val: data.visualBreakdown.lensAndCamera },
              { icon: Wand2, label: 'Commercial Viability', val: data.visualBreakdown.commercialAppeal },
            ].map(({ icon: Icon, label, val }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/75"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-cyan">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{val}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/75">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { key: 'midjourney', label: 'Midjourney v6.1' },
                  { key: 'flux', label: 'Flux 1.1 Pro' },
                  { key: 'sd', label: 'Stable Diffusion / SDXL' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePromptTab(tab.key as 'midjourney' | 'flux' | 'sd')}
                    className={`rounded-lg px-3.5 py-2 font-semibold transition ${activePromptTab === tab.key
                        ? 'bg-brand-indigo text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const activeText =
                    activePromptTab === 'midjourney'
                      ? data.prompts.midjourneyV6
                      : activePromptTab === 'flux'
                        ? data.prompts.fluxPro
                        : data.prompts.stableDiffusion;
                  void copyText(activeText, `${activePromptTab.toUpperCase()} prompt`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-2 text-xs font-semibold text-slate-950 transition hover:opacity-90"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Active Prompt</span>
              </button>
            </div>

            <div className="mt-4">
              {activePromptTab === 'midjourney' && (
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-indigo-200 dark:border-slate-800">
                  {data.prompts.midjourneyV6}
                </div>
              )}

              {activePromptTab === 'flux' && (
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-cyan-200 dark:border-slate-800">
                  {data.prompts.fluxPro}
                </div>
              )}

              {activePromptTab === 'sd' && (
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-emerald-500">POSITIVE PROMPT</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-200 dark:border-slate-800">
                      {data.prompts.stableDiffusion}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-rose-400">
                      <span>NEGATIVE PROMPT</span>
                      <button
                        type="button"
                        onClick={() => void copyText(data.prompts.negativePrompt, 'Negative prompt')}
                        className="text-slate-400 hover:text-white"
                      >
                        Copy negative
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-rose-200 dark:border-slate-800">
                      {data.prompts.negativePrompt}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Suggested Title: {data.suggestedTitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.suggestedTags.slice(0, 14).map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-brand-indigo hover:text-white dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                to={`/tags?q=${encodeURIComponent(data.visualBreakdown.subject)}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-indigo/30 bg-brand-indigo/10 px-3.5 py-2 font-semibold text-brand-indigo hover:bg-brand-indigo/20 dark:text-indigo-300"
              >
                <Tags className="h-3.5 w-3.5" />
                <span>Build Submission CSV</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
