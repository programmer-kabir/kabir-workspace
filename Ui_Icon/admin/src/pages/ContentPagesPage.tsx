// admin/src/pages/ContentPagesPage.tsx
import { useEffect, useState } from 'react';
import { getContentPagesList, updateContentPage, getPageRevisions } from '../lib/api';
import { ContentPage, ContentPageRevision } from '../types/cms';

export default function ContentPagesPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  const [revisions, setRevisions] = useState<ContentPageRevision[]>([]);
  const [, setLoadingRevisions] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMetaTitle, setEditMetaTitle] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('published');
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await getContentPagesList();
      if (res.success && res.data?.pages) {
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error('Failed to load CMS pages', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  function openEdit(page: ContentPage) {
    setSelectedPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
    setEditMetaTitle(page.meta_title || '');
    setEditMetaDesc(page.meta_description || '');
    setEditStatus(page.status);
    setSaveSuccess(false);
    setEditModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPage) return;

    setSubmitting(true);
    try {
      const res = await updateContentPage({
        id: selectedPage.id,
        title: editTitle,
        content: editContent,
        meta_title: editMetaTitle,
        meta_description: editMetaDesc,
        status: editStatus,
      });

      if (res.success && res.data) {
        setSaveSuccess(true);
        loadPages();
        setTimeout(() => {
          setEditModalOpen(false);
        }, 1000);
      } else {
        alert(res.message || 'Failed to update page');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating page');
    } finally {
      setSubmitting(false);
    }
  }

  async function viewRevisions(page: ContentPage) {
    setSelectedPage(page);
    setLoadingRevisions(true);
    try {
      const res = await getPageRevisions(page.id);
      if (res.success && res.data?.revisions) {
        setRevisions(res.data.revisions);
      }
    } catch (err) {
      console.error('Failed to load revisions', err);
    } finally {
      setLoadingRevisions(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Content CMS</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage legal, policy, and information pages. Preserves full revision history and SEO meta tags.
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Page Title</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-100">{page.title}</td>
                  <td className="py-3 px-4 font-mono text-xs text-indigo-400">/{page.slug}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        page.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`http://localhost:3000/${page.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => openEdit(page)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => viewRevisions(page)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700 transition-colors"
                      >
                        Revisions
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit CMS Page: {selectedPage?.title}</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold">
                Page updated successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Page Title *</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={editMetaTitle}
                  onChange={(e) => setEditMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={editMetaDesc}
                onChange={(e) => setEditMetaDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Markdown / HTML Content
              </label>
              <textarea
                rows={10}
                required
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save & Publish Revision'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Revisions Drawer / Modal */}
      {revisions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                Revision History: {selectedPage?.title}
              </h3>
              <button
                onClick={() => setRevisions([])}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">Revision #{rev.id}</div>
                    <div className="text-[11px] text-slate-400">{rev.title}</div>
                    <div className="text-[10px] text-slate-500">
                      By {rev.updater_username || 'System'} on {new Date(rev.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
