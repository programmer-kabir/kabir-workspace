// admin/src/pages/FavoritesPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminFavorites } from '../lib/api';
import { formatSvgForDarkPreview } from '../lib/svg';

interface TopIcon {
  id: number;
  name: string;
  category_name?: string;
  svg_content?: string;
  favorites_count: number;
}

interface RecentFavorite {
  id: number;
  icon_id: number;
  icon_name: string;
  category_name?: string;
  svg_content?: string;
  username: string;
  email: string;
  created_at: string;
}

interface FavoritesData {
  top_icons: TopIcon[];
  recent: RecentFavorite[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export default function FavoritesPage() {
  const [data, setData] = useState<FavoritesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getAdminFavorites(page, 20);
        if (res.success && res.data) {
          setData(res.data as FavoritesData);
        }
      } catch (err) {
        console.error('Failed to load favorites', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  if (loading && !data) {
    return (
      <div className="min-h-[300px] flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading favorites analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Favorites & Bookmarks</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor user engagement, identify trending icons, and view recent favorite activity.
        </p>
      </div>

      {/* Top 10 Most Favorited Icons */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>Top Favorited Icons</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data?.top_icons.map((icon) => (
            <Link
              key={icon.id}
              to={`/icons/edit/${icon.id}`}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-pink-500/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 flex items-center justify-center text-slate-200 group-hover:text-pink-400 transition-colors mb-2">
                {icon.svg_content ? (
                  <div
                    className="w-8 h-8 svg-preview-white text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: formatSvgForDarkPreview(icon.svg_content) }}
                  />
                ) : (
                  <span className="text-xs font-mono text-slate-500">SVG</span>
                )}
              </div>
              <div className="font-semibold text-xs text-slate-200 truncate w-full">{icon.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{icon.category_name}</div>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{icon.favorites_count}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Favorites Activity Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Favorite Actions</h2>
          <span className="text-xs text-slate-400">
            Total: {data?.pagination.total.toLocaleString()} favorites
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 w-14">Icon</th>
                <th className="py-3 px-4">Icon Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 text-right">Favorited Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 text-slate-300">
                      {item.svg_content ? (
                        <div
                          className="w-5 h-5 svg-preview-white text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: formatSvgForDarkPreview(item.svg_content) }}
                        />
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono">SVG</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-100">
                    <Link
                      to={`/icons/edit/${item.icon_id}`}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {item.icon_name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{item.category_name || 'General'}</td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-200">{item.username}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.email}</div>
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data?.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No favorites recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
