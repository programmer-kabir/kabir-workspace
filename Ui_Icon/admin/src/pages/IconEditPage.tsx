// admin/src/pages/IconEditPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getAdminIcon,
  getAdminCategories,
  updateAdminIcon,
  deleteAdminIcon,
} from '../lib/api';
import { AdminCategoryItem, AdminIconItem } from '../types/admin';
import { normalizeSvgToCurrentColor } from '../lib/svg';

export default function IconEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const iconId = Number(params.id);

  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [icon, setIcon] = useState<AdminIconItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [svgOutlined, setSvgOutlined] = useState('');
  const [svgFilled, setSvgFilled] = useState('');

  // Preview & UI
  const [previewBg, setPreviewBg] = useState<'dark' | 'light' | 'grid'>('dark');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, iconRes] = await Promise.all([
          getAdminCategories(),
          getAdminIcon(iconId),
        ]);

        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }

        if (iconRes.success && iconRes.data) {
          const item = iconRes.data;
          setIcon(item);
          setName(item.name);
          setSlug(item.slug);
          setCategoryId(item.category_id);
          setTags(item.tags || '');
          setStatus(item.status);
          setIsPremium(Boolean(item.is_premium));
          setSvgOutlined(item.variants?.outlined || '');
          setSvgFilled(item.variants?.filled || '');
        } else {
          setErrorMsg(iconRes.message || 'Icon not found.');
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Error loading icon data');
      } finally {
        setLoading(false);
      }
    }
    if (iconId > 0) {
      loadData();
    }
  }, [iconId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Icon name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateAdminIcon({
        id: iconId,
        name: name.trim(),
        slug: slug.trim() || undefined,
        category_id: categoryId,
        tags: tags.trim(),
        status,
        is_premium: isPremium,
        svg_outlined: svgOutlined.trim() || undefined,
        svg_filled: svgFilled.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessMsg('Icon updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'Failed to update icon.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving icon');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await deleteAdminIcon(iconId);
      if (res.success) {
        navigate('/icons');
      } else {
        alert(res.message || 'Failed to delete icon');
        setDeleting(false);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting icon');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading icon details...</span>
      </div>
    );
  }

  if (!icon) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-red-400 font-semibold">{errorMsg || 'Icon not found.'}</p>
        <Link
          to="/icons"
          className="mt-4 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl"
        >
          Back to Icons
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/icons" className="hover:text-white transition-colors">
              Icons
            </Link>
            <span>/</span>
            <span className="text-slate-200">Edit #{icon.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Edit Icon: {icon.name}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">slug: {icon.slug}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/80 border border-red-500/30 rounded-xl transition-colors self-start sm:self-auto"
        >
          Delete Icon
        </button>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white">General Information</h2>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Icon Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Slug <span className="text-slate-500 font-normal">(Leave empty to auto-slugify)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tags <span className="text-slate-500 font-normal">(Comma separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['published', 'draft', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                      status === st
                        ? st === 'published'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : st === 'draft'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Tier: Free vs Pro */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Access Tier</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPremium(false)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    !isPremium
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Free Icon
                </button>
                <button
                  type="button"
                  onClick={() => setIsPremium(true)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    isPremium
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>👑</span>
                  <span>Pro (Premium)</span>
                </button>
              </div>
            </div>
          </div>

          {/* SVG Code Editors */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white">SVG Vector Code</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Outlined Variant
              </label>
              <textarea
                rows={5}
                value={svgOutlined}
                onChange={(e) => setSvgOutlined(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Filled Variant
              </label>
              <textarea
                rows={5}
                value={svgFilled}
                onChange={(e) => setSvgFilled(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/icons"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-colors"
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview Canvas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Vector Preview</h2>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-0.5 rounded ${previewBg === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-2 py-0.5 rounded ${previewBg === 'light' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400'}`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('grid')}
                  className={`px-2 py-0.5 rounded ${previewBg === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Grid
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5">Outlined Style</div>
              <div
                className={`h-36 rounded-xl border flex items-center justify-center p-4 transition-colors ${
                  previewBg === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : previewBg === 'light'
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]'
                }`}
              >
                {svgOutlined ? (
                  <div
                    className="w-16 h-16 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: normalizeSvgToCurrentColor(svgOutlined) }}
                  />
                ) : (
                  <span className="text-xs text-slate-500">No outlined variant</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5">Filled Style</div>
              <div
                className={`h-36 rounded-xl border flex items-center justify-center p-4 transition-colors ${
                  previewBg === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : previewBg === 'light'
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]'
                }`}
              >
                {svgFilled ? (
                  <div
                    className="w-16 h-16 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: normalizeSvgToCurrentColor(svgFilled) }}
                  />
                ) : (
                  <span className="text-xs text-slate-500">No filled variant</span>
                )}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Downloads:</span>
                <span className="font-semibold text-slate-200">{icon.downloads_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Favorites:</span>
                <span className="font-semibold text-slate-200">{icon.favorites_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Created At:</span>
                <span className="text-slate-300">{new Date(icon.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">Permanently Delete Icon?</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-bold text-white">"{name}"</span>? This will immediately remove it from the database and public client.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
