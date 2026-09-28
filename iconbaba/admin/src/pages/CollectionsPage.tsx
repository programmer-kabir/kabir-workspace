// admin/src/pages/CollectionsPage.tsx
import { useEffect, useState } from 'react';
import { getAdminCollections } from '../lib/api';

interface CollectionItem {
  id: number;
  name: string;
  description?: string;
  username: string;
  email: string;
  item_count: number;
  is_public: boolean;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getAdminCollections(page, 20);
        if (res.success && res.data) {
          setCollections(res.data.items as CollectionItem[]);
          setTotal(res.data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to load collections', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">User Collections</h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect custom user collections, visibility settings, and aggregate item counts.
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Total Collections: <strong className="text-white">{total}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Collection Name</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-center">Visibility</th>
                <th className="py-3 px-4 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {collections.map((col) => (
                <tr key={col.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{col.name}</div>
                    {col.description && (
                      <div className="text-xs text-slate-400 truncate max-w-sm">{col.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200 font-medium">{col.username}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{col.email}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-400">
                    {col.item_count}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        col.is_public
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {col.is_public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-slate-400">
                    {new Date(col.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {collections.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No collections created yet.
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
