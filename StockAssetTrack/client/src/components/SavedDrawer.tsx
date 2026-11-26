import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Bookmark, ExternalLink, Images, Search, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSavedItems } from '../hooks/useSavedItems';
import { fetchWatchlist, removeFromWatchlist } from '../services/api';
import type { WatchlistEntry } from '../types/stock';

interface SavedDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SavedDrawer({ open, onClose }: SavedDrawerProps) {
  const [tab, setTab] = useState<'images' | 'contributors'>('images');
  const [filter, setFilter] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const { savedImages, savedContributors, toggleImage, toggleContributor } = useSavedItems();

  useEffect(() => {
    if (!open) return;
    let active = true;

    const loadWatchlist = () => {
      fetchWatchlist()
        .then((res) => {
          if (active) setWatchlist(res.items);
        })
        .catch(() => {
          if (active) setWatchlist([]);
        });
    };

    loadWatchlist();
    window.addEventListener('sat:watchlist-changed', loadWatchlist);
    return () => {
      active = false;
      window.removeEventListener('sat:watchlist-changed', loadWatchlist);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const normalized = filter.trim().toLowerCase();
  const visibleImages = savedImages.filter(
    (img) =>
      !normalized ||
      img.title.toLowerCase().includes(normalized) ||
      img.id.includes(normalized)
  );

  // Merge MySQL watchlist items with localStorage favorite contributors cleanly without duplicates
  const mergedContributors = [
    ...watchlist.map((w) => ({
      id: w.creatorId,
      name: w.creatorName,
      country: w.country ? `${w.country.flag} ${w.country.name}` : undefined,
      isWatchlist: true,
      liveTotalAssets: w.liveTotalAssets,
      liveTotalDownloads: w.liveTotalDownloads,
    })),
    ...savedContributors
      .filter((c) => !watchlist.some((w) => w.creatorId === c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        country: c.country,
        isWatchlist: false,
        liveTotalAssets: undefined,
        liveTotalDownloads: undefined,
      })),
  ];

  const visibleContributors = mergedContributors.filter(
    (c) =>
      !normalized ||
      c.name.toLowerCase().includes(normalized) ||
      c.id.includes(normalized)
  );

  const handleRemoveContributor = async (entry: (typeof mergedContributors)[number]) => {
    if (entry.isWatchlist) {
      try {
        await removeFromWatchlist(entry.id);
        setWatchlist((prev) => prev.filter((item) => item.creatorId !== entry.id));
        window.dispatchEvent(new Event('sat:watchlist-changed'));
        toast.success(`Removed ${entry.name} from watchlist`);
      } catch {
        toast.error('Failed to remove from watchlist');
      }
    }
    const existingLocal = savedContributors.find((c) => c.id === entry.id);
    if (existingLocal) {
      toggleContributor(existingLocal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Bookmark className="h-4 w-4 text-brand-indigo" />
            <span>Saved Items</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved drawer"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('images')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
              tab === 'images'
                ? 'bg-brand-indigo text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Images className="h-3.5 w-3.5" />
            <span>Images ({savedImages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('contributors')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
              tab === 'contributors'
                ? 'bg-brand-indigo text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Contributors ({mergedContributors.length})</span>
          </button>
        </div>

        <div className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              id="saved-drawer-filter"
              name="savedFilter"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by title, name, or ID..."
              className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'images' ? (
            visibleImages.length === 0 ? (
              <EmptyState label="assets" />
            ) : (
              <div className="space-y-2.5">
                {visibleImages.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.title}
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {asset.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        ID #{asset.id} · {asset.downloads.toLocaleString()} dl
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/search?q=${encodeURIComponent(asset.keywords[0] ?? asset.id)}`}
                        onClick={onClose}
                        aria-label="Inspect asset"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleImage(asset)}
                        aria-label="Remove saved asset"
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : visibleContributors.length === 0 ? (
            <EmptyState label="contributors" />
          ) : (
            <div className="space-y-2">
              {visibleContributors.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </p>
                      {c.isWatchlist && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-cyan/15 px-1.5 py-0.5 text-[9px] font-semibold text-brand-cyan">
                          <Bell className="h-2.5 w-2.5" />
                          MySQL
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      ID #{c.id} {c.country ? `· ${c.country}` : ''}
                    </p>
                    {c.liveTotalAssets !== undefined && (
                      <p className="text-[10px] font-mono text-slate-500">
                        {c.liveTotalAssets.toLocaleString()} assets · {(c.liveTotalDownloads ?? 0).toLocaleString()} dl
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      to={`/tracker?creatorId=${encodeURIComponent(c.id)}`}
                      onClick={onClose}
                      className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-indigo hover:bg-brand-indigo/10"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRemoveContributor(c)}
                      aria-label="Remove saved contributor"
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
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-dashed border-slate-300 p-6 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-900 dark:text-white">No saved {label} yet</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Save assets or watch competitors from Portfolio Tracker to see them here.
        </p>
      </div>
    </div>
  );
}
