import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import { AssetResultsBrowser } from '../components/AssetResultsBrowser';
import {
  ImageUploadDropzone,
  type StoredUploadSimilarPayload,
  UPLOAD_SIMILAR_STORAGE_KEY,
} from '../components/ImageUploadDropzone';
import { fetchSimilarById, fetchSimilarByUploadHash } from '../services/api';
import type { SimilarResponse } from '../types/stock';

const SAMPLE_REFERENCE_IDS = ['489201100', '486688871', '354634017'];

export function SimilarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const imageIdParam = (searchParams.get('imageId') ?? '').trim();
  const sourceParam = searchParams.get('source') ?? '';
  const pageParam = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  const [assetIdInput, setAssetIdInput] = useState(imageIdParam);
  const [page, setPage] = useState(pageParam);
  const [data, setData] = useState<SimilarResponse | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLookupKeyRef = useRef<string>('');

  const loadByImageId = async (targetId: string, targetPage: number) => {
    const cleanId = targetId.trim();
    if (!cleanId) {
      setError('Enter an Adobe Stock Asset ID to inspect visually similar items.');
      return;
    }

    const nextParams = new URLSearchParams({ imageId: cleanId });
    if (targetPage > 1) nextParams.set('page', String(targetPage));
    const lookupKey = `id:${cleanId}:p:${targetPage}`;
    lastLookupKeyRef.current = lookupKey;
    setSearchParams(nextParams, { replace: true });

    setLoading(true);
    setError(null);
    setUploadPreviewUrl('');

    try {
      const response = await fetchSimilarById(cleanId, targetPage);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch similar assets.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromUploadHash = async (uploadHash: string, targetPage: number, previewUrl: string) => {
    const lookupKey = `upload:${uploadHash}:p:${targetPage}`;
    lastLookupKeyRef.current = lookupKey;
    setLoading(true);
    setError(null);
    setUploadPreviewUrl(previewUrl);

    try {
      const response = await fetchSimilarByUploadHash(uploadHash, targetPage);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uploaded image session expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAssetIdInput(imageIdParam);
    setPage(pageParam);

    if (sourceParam === 'upload') {
      let stored: StoredUploadSimilarPayload | null = null;
      try {
        const raw = sessionStorage.getItem(UPLOAD_SIMILAR_STORAGE_KEY);
        stored = raw ? (JSON.parse(raw) as StoredUploadSimilarPayload) : null;
      } catch {
        stored = null;
      }

      if (!stored) {
        setData(null);
        setUploadPreviewUrl('');
        return;
      }

      setUploadPreviewUrl(stored.previewDataUrl);
      const hash = stored.response.uploadHash ?? stored.response.uploadMeta?.sha256 ?? '';

      if (pageParam === 1 && stored.response.page === 1) {
        lastLookupKeyRef.current = `upload:${hash}:p:1`;
        setData(stored.response);
        setError(null);
        return;
      }

      if (hash) {
        const key = `upload:${hash}:p:${pageParam}`;
        if (lastLookupKeyRef.current !== key) {
          void loadFromUploadHash(hash, pageParam, stored.previewDataUrl);
        }
      }
      return;
    }

    if (imageIdParam) {
      const key = `id:${imageIdParam}:p:${pageParam}`;
      if (lastLookupKeyRef.current !== key) {
        void loadByImageId(imageIdParam, pageParam);
      }
    } else {
      lastLookupKeyRef.current = '';
      setData(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageIdParam, sourceParam, pageParam]);

  const handleUploadComplete = (stored: StoredUploadSimilarPayload) => {
    setUploadPreviewUrl(stored.previewDataUrl);
    setData(stored.response);
    setError(null);
    setPage(1);
    const hash = stored.response.uploadHash ?? stored.response.uploadMeta?.sha256 ?? '';
    lastLookupKeyRef.current = `upload:${hash}:p:1`;
    setSearchParams({ source: 'upload', page: '1' }, { replace: true });
  };

  const referenceAsset = data?.source === 'imageId' ? data.referenceAsset : null;
  const uploadMeta = data?.source === 'upload' ? data.uploadMeta : null;

  return (
    <section className="mx-auto  px-4 py-8 sm:px-6 max-w-[1600px]">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold text-brand-cyan">
          <Layers className="h-3.5 w-3.5" />
          <span>Fully Enriched Similarity Engine</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Visual Similar &amp; Image Upload Discovery
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Every similar result runs through the full downloads, velocity (~D/M), performance &amp; keyword enrichment pipeline.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/75">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Lookup Similar by Asset ID
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Paste any Adobe Stock Asset ID to inspect visually matched top sellers.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              void loadByImageId(assetIdInput, 1);
            }}
            className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          >
            <input
              id="similar-asset-id-input"
              name="imageId"
              type="text"
              value={assetIdInput}
              onChange={(e) => setAssetIdInput(e.target.value)}
              placeholder="e.g. 489201100"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-brand-indigo dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              <span>Find Similar</span>
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-medium text-slate-500 dark:text-slate-400">Sample IDs:</span>
            {SAMPLE_REFERENCE_IDS.map((sampleId) => (
              <button
                key={sampleId}
                type="button"
                onClick={() => {
                  setAssetIdInput(sampleId);
                  setPage(1);
                  void loadByImageId(sampleId, 1);
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-700 hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                #{sampleId}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/75">
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Reverse Search by Reference Image
          </h2>
          <ImageUploadDropzone compact onSuccess={handleUploadComplete} />
        </div>
      </div>

      {referenceAsset && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand-indigo/30 bg-white/90 p-4 shadow-md dark:border-brand-indigo/30 dark:bg-slate-900/80 sm:flex-row sm:items-center">
          <img
            src={referenceAsset.thumbnailUrl?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '') || referenceAsset.thumbnailUrl}
            alt={referenceAsset.title}
            className="h-28 w-44 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-brand-indigo/15 px-2.5 py-0.5 font-semibold text-brand-indigo dark:text-indigo-300">
                Reference Asset #{referenceAsset.id}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {referenceAsset.mediaType}
              </span>
              {referenceAsset.isAI && (
                <span className="rounded-full bg-brand-purple/15 px-2 py-0.5 font-semibold text-brand-purple">
                  AI Generated
                </span>
              )}
            </div>
            <h2 className="mt-1.5 truncate text-base font-bold text-slate-900 dark:text-white">
              {referenceAsset.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span>{referenceAsset.downloads.toLocaleString()} downloads</span>
              <span>
                Velocity: {referenceAsset.monthlyVelocity === null ? 'N/A' : `~${referenceAsset.monthlyVelocity} D/M`}
              </span>
              <span>Score: {referenceAsset.performanceScore}/100</span>
              <Link
                to={`/tracker?creatorId=${encodeURIComponent(referenceAsset.creatorId)}`}
                className="font-semibold text-brand-indigo hover:underline"
              >
                {referenceAsset.creator} {referenceAsset.creatorCountry?.flag ?? ''}
              </Link>
            </div>
          </div>

          <a
            href={`https://stock.adobe.com/stock-photo/id/${referenceAsset.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>Adobe Stock</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {uploadMeta && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand-cyan/30 bg-white/90 p-4 shadow-md dark:bg-slate-900/80 sm:flex-row sm:items-center">
          {uploadPreviewUrl ? (
            <img
              src={uploadPreviewUrl}
              alt={uploadMeta.fileName}
              className="h-28 w-40 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
            />
          ) : (
            <div className="flex h-28 w-40 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
              <ImageIcon className="h-7 w-7 text-slate-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-cyan/15 px-2.5 py-0.5 font-semibold text-brand-cyan">
                <Sparkles className="h-3 w-3" />
                Uploaded Visual Query
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {uploadMeta.width} × {uploadMeta.height} · {uploadMeta.fileName}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
              {uploadMeta.matchedSignals?.dominantStyle ?? 'Visual Composition Match'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Orientation: {uploadMeta.matchedSignals?.orientation ?? 'Detected'} · Primary Category:{' '}
              {uploadMeta.matchedSignals?.dominantCategory ?? 'General'}
            </p>
            {uploadMeta.matchedSignals?.inferredTags && uploadMeta.matchedSignals.inferredTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {uploadMeta.matchedSignals.inferredTags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-brand-indigo hover:text-white dark:bg-slate-800 dark:text-slate-300"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
          exportSlug={
            data?.source === 'upload'
              ? `similar-upload-${uploadMeta?.fileName ?? 'match'}`
              : `similar-${imageIdParam || 'asset'}`
          }
          page={page}
          hasMore={Boolean(data?.hasMore)}
          resetKey={lastLookupKeyRef.current}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            if (sourceParam === 'upload') {
              const nextParams = new URLSearchParams({ source: 'upload', page: String(nextPage) });
              setSearchParams(nextParams, { replace: true });
            } else if (imageIdParam) {
              void loadByImageId(imageIdParam, nextPage);
            }
          }}
          onClickTag={(tag) => {
            navigate(`/search?q=${encodeURIComponent(tag)}`);
          }}
        />
      )}
    </section>
  );
}
