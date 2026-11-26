// admin/src/pages/PackEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
  Plus,
  Layers,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { getAdminPack, getAdminCategories, updateAdminPack, deleteAdminPack } from '../lib/api';
import { AdminPackItem, AdminCategoryItem } from '../types/admin';

export default function PackEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [pack, setPack] = useState<AdminPackItem | null>(null);
  const [icons, setIcons] = useState<Array<{ id: number; name: string; slug: string; status: string; default_style: string; is_premium: boolean; svg: string }>>([]);

  // Form State
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [primaryStyle, setPrimaryStyle] = useState<string>('outlined');
  const [authorName, setAuthorName] = useState<string>('IconBaba Studio');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [catsRes, packRes] = await Promise.all([
          getAdminCategories(),
          getAdminPack(parseInt(id, 10)),
        ]);

        if (catsRes.success && catsRes.data) {
          setCategories(catsRes.data);
        }

        if (packRes.success && packRes.data) {
          const p = packRes.data.pack;
          setPack(p);
          setName(p.name);
          setSlug(p.slug);
          setCategoryId(p.category_id);
          setDescription(p.description || '');
          setTags(p.tags || '');
          setPrimaryStyle(p.primary_style || 'outlined');
          setAuthorName(p.author_name || 'IconBaba Studio');
          setIsPremium(Boolean(p.is_premium));
          setIsFeatured(Boolean(p.is_featured));
          setStatus(p.status || 'published');
          setIcons(packRes.data.icons || []);
        } else {
          setError(packRes.message || 'Pack not found.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load pack details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await updateAdminPack({
      id: parseInt(id, 10),
      name,
      slug: slug.trim() || undefined,
      category_id: categoryId,
      description,
      tags,
      primary_style: primaryStyle,
      author_name: authorName,
      is_premium: isPremium,
      is_featured: isFeatured,
      status,
    });

    setSaving(false);
    if (res.success) {
      setSuccess('Pack updated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.message || 'Failed to update pack.');
    }
  };

  const handleDelete = async () => {
    if (!pack || !window.confirm(`Delete pack "${pack.name}"? Icons will be detached, not deleted.`)) return;
    const res = await deleteAdminPack(pack.id);
    if (res.success) {
      navigate('/packs');
    } else {
      alert(res.message || 'Failed to delete pack.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="size-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading pack details...</p>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pack Not Found</h2>
        <Link to="/packs" className="text-purple-600 hover:underline text-sm font-semibold">
          Return to Packs List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/packs"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>{pack.name}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {icons.length} icons
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Slug: /{pack.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`http://localhost:3000/pack/${pack.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors border border-slate-700"
          >
            <span>View Public Pack</span>
            <ExternalLink className="size-3.5" />
          </a>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-900/20 transition-colors"
            title="Delete Pack"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-900/20 border border-rose-800/40 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/40 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="size-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="size-4.5 text-purple-400" />
          <span>Pack Settings</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Pack Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Custom Slug (optional)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
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
              value={primaryStyle}
              onChange={(e) => setPrimaryStyle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
            >
              <option value="outlined">Outlined (Lineal)</option>
              <option value="filled">Filled (Solid)</option>
              <option value="lineal-color">Lineal Color</option>
              <option value="flat">Flat Color</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Author
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
            />
            <span className="text-xs font-bold text-slate-300">
              Pro / Premium Only
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
            />
            <span className="text-xs font-bold text-slate-300">
              Featured Pack
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>{saving ? 'Saving...' : 'Save Pack Settings'}</span>
          </button>
        </div>
      </form>

      {/* Icons In Pack */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Icons In This Pack ({icons.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Icons assigned to this pack. Edit each icon to add style variants.
            </p>
          </div>

          <Link
            to={`/icons/upload?pack_id=${pack.id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-xs font-bold text-purple-300 border border-purple-500/30 transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Upload Icons to Pack</span>
          </Link>
        </div>

        {icons.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No icons are currently assigned to this pack.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {icons.map((ico) => (
              <Link
                key={ico.id}
                to={`/icons/edit/${ico.id}`}
                className="group flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-purple-500 transition-all text-center"
              >
                <div
                  className="size-10 text-slate-200 group-hover:scale-110 transition-transform [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: ico.svg || '' }}
                />
                <span className="text-xs font-semibold text-slate-300 mt-2 truncate max-w-full">
                  {ico.name}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {ico.default_style}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
