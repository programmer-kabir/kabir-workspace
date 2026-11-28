import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Image as ImageIcon, X } from 'lucide-react';
import type { StockAsset } from '../types/stock';
import { copyImageToClipboard, copyText, formatAssetDate } from '../utils/assetUtils';

interface LightboxModalProps {
  assets: StockAsset[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export function LightboxModal({ assets, currentIndex, onClose, onNavigate }: LightboxModalProps) {
  const asset = assets[currentIndex];

  useEffect(() => {
    if (!asset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        // Guard against video timeline collision by handling gallery navigation explicitly
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex < assets.length - 1) onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [asset, assets.length, currentIndex, onClose, onNavigate]);

  if (!asset) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-800 px-2.5 py-1 font-mono font-semibold">
              {currentIndex + 1} / {assets.length}
            </span>
            <span className="truncate font-semibold text-slate-200">ID: {asset.id}</span>
            <span className="text-slate-400">· {asset.creator}</span>
            <span className="font-mono text-brand-cyan">{asset.downloads.toLocaleString()} dl</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void copyImageToClipboard(asset.preview1000Url)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium hover:bg-slate-800"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Copy Image</span>
            </button>
            <button
              type="button"
              onClick={() => void copyText(asset.keywords.join(', '), 'Keywords')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Tags</span>
            </button>
            <a
              href={`https://stock.adobe.com/stock-photo/id/${asset.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-indigo px-3 py-1.5 font-semibold hover:bg-indigo-500"
            >
              <span>Adobe Stock</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lightbox"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/60 p-4">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={() => onNavigate(currentIndex - 1)}
            aria-label="Previous asset"
            className="absolute left-3 z-10 rounded-full bg-slate-900/80 p-2 text-white hover:bg-brand-indigo disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {asset.videoPreviewUrl ? (
            <video
              src={asset.videoPreviewUrl}
              controls
              autoPlay
              className="max-h-[62vh] max-w-full rounded-xl"
            />
          ) : (
            <img
              src={asset.preview1000Url?.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '') || asset.preview1000Url}
              alt={asset.title}
              className="max-h-[62vh] max-w-full rounded-xl object-contain"
            />
          )}

          <button
            type="button"
            disabled={currentIndex >= assets.length - 1}
            onClick={() => onNavigate(currentIndex + 1)}
            aria-label="Next asset"
            className="absolute right-3 z-10 rounded-full bg-slate-900/80 p-2 text-white hover:bg-brand-indigo disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="border-t border-slate-800 px-5 py-3 text-xs">
          <p className="font-semibold text-white">{asset.title}</p>
          <p className="mt-1 text-slate-400">
            {asset.mediaType} · {asset.dimensions} · {formatAssetDate(asset.creationDate)} · Performance{' '}
            {asset.performanceScore}/100
          </p>
        </div>
      </div>
    </div>
  );
}
