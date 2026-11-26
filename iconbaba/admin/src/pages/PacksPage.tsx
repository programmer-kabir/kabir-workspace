// admin/src/pages/PacksPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  Sparkles,
  CheckCircle,
  Clock,
  Archive,
  X,
  AlertCircle
} from 'lucide-react';
import { getAdminPacks, getAdminCategories, createAdminPack, deleteAdminPack } from '../lib/api';
import { AdminPackItem, AdminCategoryItem } from '../types/admin';

export default function PacksPage() {
  const [packs, setPacks] = useState<AdminPackItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Pack Form State
  const [newName, setNewName] = useState<string>('');
  const [newCategoryId, setNewCategoryId] = useState<number>(0);
  const [newDesc, setNewDesc] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [newPrimaryStyle, setNewPrimaryStyle] = useState<string>('outlined');
  const [newAuthor, setNewAuthor] = useState<string>('IconBaba Studio');
  const [newIsPremium, setNewIsPremium] = useState<boolean>(false);
  const [newIsFeatured, setNewIsFeatured] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<'published' | 'draft' | 'archived'>('published');

  const fetchCategories = async () => {
    const res = await getAdminCategories();
    if (res.success && res.data) {
      setCategories(res.data);
      if (res.data.length > 0 && newCategoryId === 0) {
        setNewCategoryId(res.data[0].id);
      }
    }
  };

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await getAdminPacks({
        page,
        limit: 20,
        search: search.trim() || undefined,
        category_id: selectedCategory > 0 ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });

      if (res.success && res.data) {
        setPacks(res.data.packs);
        setTotalPages(res.data.pagination.total_pages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load admin packs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPacks();
  }, [page, selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPacks();
  };

  const handleDelete = async (pack: AdminPackItem) => {
    if (!window.confirm(`Are you sure you want to delete pack "${pack.name}"? Its icons will not be deleted, but detached.`)) {
      return;
    }
    const res = await deleteAdminPack(pack.id);
    if (res.success) {
      fetchPacks();
    } else {
      alert(res.message || 'Failed to delete pack.');
    }
  };

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Pack name is required.');
      return;
    }
    if (newCategoryId <= 0) {
      setFormError('Please select a valid category.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const res = await createAdminPack({
      name: newName.trim(),
      category_id: newCategoryId,
      description: newDesc.trim() || undefined,
      tags: newTags.trim() || undefined,
      primary_style: newPrimaryStyle,
      author_name: newAuthor.trim() || 'IconBaba Studio',
      is_premium: newIsPremium,
      is_featured: newIsFeatured,
      status: newStatus,
    });

    setSaving(false);

    if (res.success) {
      setCreateModalOpen(false);
      // Reset form
      setNewName('');
      setNewDesc('');
      setNewTags('');
      fetchPacks();
    } else {
      setFormError(res.message || 'Failed to create pack.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Icon Packs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-500/30">
              {totalCount} total
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage Flaticon-style icon packs, theme bundles, and multi-variant sets.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-md shadow-purple-600/20"
        >
          <Plus className="size-4" />
          <span>Create New Pack</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packs by title, tags, or slug..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 focus:outline-none"
            >
              <option value="0">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Packs Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Pack Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Icons</th>
                <th className="px-4 py-3.5">Primary Style</th>
                <th className="px-4 py-3.5">Tier</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Downloads</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Loading packs...
                  </td>
                </tr>
              ) : packs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No packs found matching your query.
                  </td>
                </tr>
              ) : (
                packs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/packs/edit/${p.id}`}
                            className="font-bold text-white hover:text-purple-400 transition-colors"
                          >
                            {p.name}
                          </Link>
                          {p.is_featured && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-900/30 text-amber-300 border border-amber-500/30">
                              Featured
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">/{p.slug}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category_name}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-200">{p.icon_count}</span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap capitalize text-slate-300">
                      {p.primary_style.replace('-', ' ')}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {p.is_premium ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <Sparkles className="size-3" />
                          <span>PRO</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-400">
                          Free
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          p.status === 'published'
                            ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
                            : p.status === 'draft'
                            ? 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-300">
                      {p.downloads_count}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`http://localhost:3000/pack/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Preview on frontend"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                        <Link
                          to={`/packs/edit/${p.id}`}
                          title="Edit Pack"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 transition-colors"
                        >
                          <Edit className="size-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete Pack"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Pack Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="size-5 text-purple-400" />
                <span>Create New Icon Pack</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePack} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-900/20 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Pack Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Finance & Accounting 3D"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Primary Style
                  </label>
                  <select
                    value={newPrimaryStyle}
                    onChange={(e) => setNewPrimaryStyle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
                  >
                    <option value="outlined">Outlined (Lineal)</option>
                    <option value="filled">Filled (Solid)</option>
                    <option value="lineal-color">Lineal Color</option>
                    <option value="flat">Flat Color</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short description of this icon collection..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="finance, money, business, bank"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPremium}
                    onChange={(e) => setNewIsPremium(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Pro / Premium Only
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsFeatured}
                    onChange={(e) => setNewIsFeatured(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Featured Pack
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Pack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
