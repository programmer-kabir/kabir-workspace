// admin/src/pages/IconsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminIcons,
  getAdminCategories,
  deleteAdminIcon,
  bulkAdminIcons,
  updateAdminIcon,
} from '@/lib/api';
import { formatSvgForDarkPreview } from '@/lib/svg';
import { AdminIconItem, AdminCategoryItem } from '@/types/admin';

export default function IconsPage() {
  // State
  const [icons, setIcons] = useState<AdminIconItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<number | undefined>(undefined);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);

  // Single delete modal
  const [deleteTarget, setDeleteTarget] = useState<AdminIconItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCats() {
      const res = await getAdminCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    loadCats();
  }, []);

  // Fetch icons
  const fetchIcons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminIcons({
        page,
        limit: 20,
        q: search.trim(),
        category_id: selectedCategory,
        status: selectedStatus,
        tier: selectedTier,
        sort: sortBy,
      });

      if (res.success && res.data) {
        setIcons(res.data.items);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Error fetching admin icons:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedStatus, selectedTier, sortBy]);

  useEffect(() => {
    fetchIcons();
  }, [fetchIcons]);

  // Bulk selection toggles
  function toggleSelectAll() {
    if (selectedIds.length === icons.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(icons.map((i) => i.id));
    }
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Handle bulk action execution
  async function handleBulkAction(action: 'publish' | 'unpublish' | 'archive' | 'delete' | 'assign_category', catId?: number) {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      const confirmed = window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} icons?`);
      if (!confirmed) return;
    }

    setBulkActionLoading(true);
    try {
      const res = await bulkAdminIcons(action, selectedIds, catId);
      if (res.success) {
        setSelectedIds([]);
        setShowBulkCategoryModal(false);
        fetchIcons();
      } else {
        alert(res.message || 'Bulk operation failed');
      }
    } catch (err: any) {
      alert(err?.message || 'Bulk action error');
    } finally {
      setBulkActionLoading(false);
    }
  }

  // Quick toggle status
  async function toggleStatus(icon: AdminIconItem) {
    const nextStatus = icon.status === 'published' ? 'draft' : 'published';
    try {
      const res = await updateAdminIcon({ id: icon.id, status: nextStatus });
      if (res.success) {
        setIcons((prev) =>
          prev.map((i) => (i.id === icon.id ? { ...i, status: nextStatus } : i))
        );
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  }

  async function togglePremium(icon: AdminIconItem) {
    const nextPremium = !icon.is_premium;
    try {
      const res = await updateAdminIcon({ id: icon.id, is_premium: nextPremium });
      if (res.success) {
        setIcons((prev) =>
          prev.map((i) => (i.id === icon.id ? { ...i, is_premium: nextPremium } : i))
        );
      }
    } catch (err) {
      console.error('Toggle premium error:', err);
    }
  }

  // Handle single delete
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deleteAdminIcon(deleteTarget.id);
      if (res.success) {
        setIcons((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setTotal((prev) => Math.max(0, prev - 1));
        setDeleteTarget(null);
      } else {
        alert(res.message || 'Failed to delete icon');
      }
    } catch (err: any) {
      alert(err?.message || 'Delete error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Icon Library</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, organize, publish, and bulk edit all {total.toLocaleString()} icons
          </p>
        </div>
        <Link
          to="/icons/upload"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Icon</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search icons, tags, slugs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.total_icons})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Tier Filter (Free vs Pro) */}
          <div>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-amber-300 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">All Tiers (Free & Pro)</option>
              <option value="free">Free Icons Only</option>
              <option value="pro">👑 Pro Icons Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="downloads">Most Downloaded</option>
              <option value="favorites">Most Favorited</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                {selectedIds.length}
              </span>
              <span>Selected Icons</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={bulkActionLoading}
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Publish All
              </button>
              <button
                disabled={bulkActionLoading}
                onClick={() => handleBulkAction('unpublish')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Unpublish (Draft)
              </button>
              <button
                disabled={bulkActionLoading}
                onClick={() => setShowBulkCategoryModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Assign Category...
              </button>
              <button
                disabled={bulkActionLoading}
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Delete Selected
              </button>
              <button
                disabled={bulkActionLoading}
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-slate-400 hover:text-white text-xs transition-colors"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Icons Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={icons.length > 0 && selectedIds.length === icons.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3 px-4 w-16">Icon</th>
                <th className="py-3 px-4">Name & Slug</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Downloads</th>
                <th className="py-3 px-4 text-center">Favorites</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {icons.map((icon) => {
                const isSelected = selectedIds.includes(icon.id);
                const svgCode = icon.variants?.outlined || icon.variants?.filled;

                return (
                  <tr
                    key={icon.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(icon.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 text-white shadow-inner">
                        {svgCode ? (
                          <div
                            className="w-6 h-6 svg-preview-white text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{ __html: formatSvgForDarkPreview(svgCode) }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">SVG</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                        <span>{icon.name}</span>
                        <button
                          onClick={() => togglePremium(icon)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            icon.is_premium
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-amber-300 hover:border-amber-500/40'
                          }`}
                          title={`Click to set as ${icon.is_premium ? 'Free' : 'Pro'}`}
                        >
                          {icon.is_premium ? '👑 PRO' : 'FREE'}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{icon.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {icon.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus(icon)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                          icon.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : icon.status === 'draft'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            icon.status === 'published'
                              ? 'bg-emerald-400'
                              : icon.status === 'draft'
                              ? 'bg-amber-400'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span className="capitalize">{icon.status}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {icon.downloads_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {icon.favorites_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(icon.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/icons/edit/${icon.id}`}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit Icon"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(icon)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Delete Icon"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {icons.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No icons match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{icons.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{total}</span> icons (Page{' '}
            <span className="font-semibold text-slate-200">{page}</span> of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Category Modal */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">Assign Category to {selectedIds.length} Icons</h3>
            <p className="text-sm text-slate-400">
              Choose the target category to reassign all selected icons.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Category</label>
              <select
                value={bulkCategoryTarget || ''}
                onChange={(e) => setBulkCategoryTarget(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkCategoryModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!bulkCategoryTarget || bulkActionLoading}
                onClick={() => handleBulkAction('assign_category', bulkCategoryTarget)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {bulkActionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">Delete Icon</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteTarget.name}"</span>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Icon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
