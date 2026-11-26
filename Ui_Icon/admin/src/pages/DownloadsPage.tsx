// admin/src/pages/DownloadsPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDownloads } from '../lib/api';
import { formatSvgForDarkPreview } from '../lib/svg';

interface DownloadItem {
  id: number;
  icon_id: number;
  icon_name?: string;
  svg_content?: string;
  format: string;
  size?: number;
  username?: string;
  email?: string;
  created_at: string;
}

interface TopDownloadIcon {
  id: number;
  name: string;
  svg_content?: string;
  downloads_count: number;
}

interface DownloadsData {
  stats: { total: number; svg: number; png: number; today: number };
  top_icons: TopDownloadIcon[];
  items: DownloadItem[];
  pagination: { total: number; page: number; limit: number; total_pages: number };
}

export default function DownloadsPage() {
  const [data, setData] = useState<DownloadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getAdminDownloads(page, 25);
        if (res.success && res.data) {
          setData(res.data as DownloadsData);
        }
      } catch (err) {
        console.error('Failed to load downloads', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Downloads & Usage</h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed metrics on SVG & PNG export requests, format distributions, and recent events.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Downloads</div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {data?.stats.total.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">All recorded export events</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SVG Downloads</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">
            {data?.stats.svg.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Vector format exports</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PNG Downloads</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {data?.stats.png.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Raster format exports</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Downloads</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {data?.stats.today.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Past 24 hours</div>
        </div>
      </div>

      {/* Top 5 Downloaded Icons */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">Top Downloaded Icons</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {data?.top_icons.map((icon) => (
            <Link
              key={icon.id}
              to={`/icons/edit/${icon.id}`}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 flex items-center justify-center text-slate-200 group-hover:text-indigo-400 transition-colors mb-2">
                {icon.svg_content ? (
                  <div
                    className="w-7 h-7 svg-preview-white text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: formatSvgForDarkPreview(icon.svg_content) }}
                  />
                ) : (
                  <span className="text-xs font-mono text-slate-500">SVG</span>
                )}
              </div>
              <div className="font-semibold text-xs text-slate-200 truncate w-full">{icon.name}</div>
              <div className="mt-2 text-xs font-bold text-indigo-400">
                {icon.downloads_count.toLocaleString()} downloads
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Download Activity Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <h2 className="text-base font-bold text-white">Download Event Log</h2>
          <span>Total Log Entries: {data?.pagination.total.toLocaleString()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 w-12">Icon</th>
                <th className="py-3 px-4">Icon Name</th>
                <th className="py-3 px-4 text-center">Format</th>
                <th className="py-3 px-4 text-center">Resolution</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.items.map((dl) => (
                <tr key={dl.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 text-slate-300">
                      {dl.svg_content ? (
                        <div
                          className="w-5 h-5 svg-preview-white text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: formatSvgForDarkPreview(dl.svg_content) }}
                        />
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono">SVG</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-100">
                    <Link
                      to={`/icons/edit/${dl.icon_id}`}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {dl.icon_name || 'Icon'}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        dl.format === 'svg'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {dl.format}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs text-slate-400">
                    {dl.size ? `${dl.size}px` : 'Vector'}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-slate-200 font-medium">{dl.username || 'Anonymous'}</div>
                    {dl.email && <div className="text-[11px] text-slate-500 font-mono">{dl.email}</div>}
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs text-slate-400 whitespace-nowrap">
                    {new Date(dl.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}

              {data?.items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No download logs recorded yet.
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
