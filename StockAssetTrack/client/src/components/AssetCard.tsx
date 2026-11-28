import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  Play,
  Sparkles,
  Tag,
} from 'lucide-react';
import type { StockAsset } from '../types/stock';
import { copyImageToClipboard, copyText, formatAssetDate } from '../utils/assetUtils';

interface AssetCardProps {
  asset: StockAsset;
  selected: boolean;
  saved: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSave: (asset: StockAsset) => void;
  onOpenLightbox: (asset: StockAsset) => void;
  onClickTag: (tag: string) => void;
}

export function AssetCard({
  asset,
  selected,
  saved,
  onToggleSelect,
  onToggleSave,
  onOpenLightbox,
  onClickTag,
}: AssetCardProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const visibleTags = showAllTags ? asset.keywords : asset.keywords.slice(0, 6);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition dark:bg-slate-900/75 ${
        selected
          ? 'border-brand-indigo ring-2 ring-brand-indigo/30'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={asset.thumbnailUrl?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '') || asset.thumbnailUrl}
          alt={asset.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        <button
          type="button"
          onClick={() => onToggleSelect(asset.id)}
          aria-label={`Select asset ${asset.id}`}
          className={`absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md border transition ${
            selected
              ? 'border-brand-indigo bg-brand-indigo text-white'
              : 'border-white/40 bg-slate-950/60 text-transparent hover:border-white'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          {asset.isAI && (
            <span className="rounded-full bg-brand-purple/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
              AI
            </span>
          )}
          <span className="rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-semibold text-slate-100">
            {asset.mediaType}
          </span>
        </div>

        {asset.videoPreviewUrl && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white">
              <Play className="h-4 w-4 fill-current" />
            </span>
          </div>
        )}

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            title="View full size"
            onClick={() => onOpenLightbox(asset)}
            className="rounded-lg bg-slate-950/80 p-1.5 text-white hover:bg-brand-indigo"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Copy image to clipboard"
            onClick={() => void copyImageToClipboard(asset.preview1000Url)}
            className="rounded-lg bg-slate-950/80 p-1.5 text-white hover:bg-brand-indigo"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={saved ? 'Remove from saved' : 'Save to favorites'}
            onClick={() => onToggleSave(asset)}
            className={`rounded-lg p-1.5 text-white ${
              saved ? 'bg-brand-cyan' : 'bg-slate-950/80 hover:bg-brand-indigo'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
          <a
            href={`https://stock.adobe.com/stock-photo/id/${asset.id}`}
            target="_blank"
            rel="noreferrer"
            title="Open on Adobe Stock"
            className="rounded-lg bg-slate-950/80 p-1.5 text-white hover:bg-brand-indigo"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-white">
            {asset.title}
          </h3>
          <button
            type="button"
            title="Copy title"
            onClick={() => void copyText(asset.title, 'Title')}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950">
          <div>
            <div className="text-[10px] font-medium text-slate-500">DOWNLOADS</div>
            <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
              {asset.downloads.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500">PERF</div>
            <div className="font-mono text-xs font-bold text-brand-indigo dark:text-indigo-300">
              {asset.performanceScore}/100
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500">VELOCITY</div>
            <div className="font-mono text-xs font-bold text-brand-cyan">
              {asset.monthlyVelocity === null ? 'N/A' : `~${asset.monthlyVelocity} D/M`}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              Creator:{' '}
              <Link
                to={`/tracker?creatorId=${encodeURIComponent(asset.creatorId)}`}
                className="font-medium text-slate-800 hover:text-brand-indigo dark:text-slate-200"
              >
                {asset.creator}
              </Link>{' '}
              {asset.creatorCountry?.flag ?? ''}
            </span>
            <span className="font-mono text-[10px]">#{asset.id}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onClickTag(asset.category)}
              className="truncate text-left font-medium text-brand-indigo hover:underline dark:text-indigo-300"
            >
              {asset.category}
            </button>
            <span className="shrink-0">{formatAssetDate(asset.creationDate)}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <Tag className="h-3 w-3 text-slate-400" />
              {asset.keywords.length} keywords
            </span>
            <div className="flex items-center gap-2">
              {asset.keywords.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllTags((prev) => !prev)}
                  className="font-semibold text-brand-indigo hover:underline"
                >
                  {showAllTags ? 'Less' : 'All'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void copyText(asset.keywords.join(', '), 'Keywords')}
                className="font-semibold text-brand-cyan hover:underline"
              >
                Copy tags
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onClickTag(tag)}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-brand-indigo hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-indigo"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-1 text-[11px]">
          <Link
            to={`/similar?imageId=${encodeURIComponent(asset.id)}`}
            className="font-semibold text-slate-600 hover:text-brand-indigo dark:text-slate-300"
          >
            Find Similar &rarr;
          </Link>
          {asset.isAI && (
            <Link
              to={`/prompts?assetId=${encodeURIComponent(asset.id)}`}
              className="inline-flex items-center gap-1 font-semibold text-brand-purple hover:underline"
            >
              <Sparkles className="h-3 w-3" />
              <span>Reverse Prompt</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
