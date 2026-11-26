// admin/src/pages/FaqPage.tsx
import { useEffect, useState } from 'react';
import { getFaqItems, saveAdminFaqItem, deleteAdminFaqItem } from '../lib/api';
import { FAQItem } from '../types/cms';

export default function FaqPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState('General');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadFaqs() {
    setLoading(true);
    try {
      const res = await getFaqItems();
      if (res.success && res.data) {
        setItems(res.data.items);
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load FAQs', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  function openCreate() {
    setEditId(null);
    setFormCategory(categories[0] || 'General');
    setFormQuestion('');
    setFormAnswer('');
    setFormOrder(items.length + 1);
    setFormActive(true);
    setModalOpen(true);
  }

  function openEdit(item: FAQItem) {
    setEditId(item.id);
    setFormCategory(item.category);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormOrder(item.display_order);
    setFormActive((item as unknown as { status?: string }).status === 'published' || Boolean((item as unknown as { is_active?: boolean }).is_active));
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      alert('Question and answer are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await saveAdminFaqItem({
        id: editId || 0,
        category: formCategory.trim(),
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        sort_order: formOrder,
        is_active: formActive,
      });

      if (res.success) {
        setModalOpen(false);
        setMsg({ type: 'success', text: 'FAQ item saved successfully!' });
        setTimeout(() => setMsg(null), 3000);
        loadFaqs();
      } else {
        alert(res.message || 'Failed to save FAQ');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving FAQ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Are you sure you want to delete this FAQ item?');
    if (!confirmed) return;

    try {
      const res = await deleteAdminFaqItem(id);
      if (res.success) {
        setMsg({ type: 'success', text: 'FAQ item deleted.' });
        setTimeout(() => setMsg(null), 3000);
        loadFaqs();
      } else {
        alert(res.message || 'Failed to delete FAQ');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting FAQ');
    }
  }

  const filteredItems = selectedCat === 'all'
    ? items
    : items.filter((i) => i.category === selectedCat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">FAQ Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage frequently asked questions, categorized sections, and live answers for the public /faq route.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add FAQ Item</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            selectedCat === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCat(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedCat === c
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {c} ({items.filter((i) => i.category === c).length})
          </button>
        ))}
      </div>

      {/* FAQ Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {item.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    (item as unknown as { status?: string }).status === 'published' || (item as unknown as { is_active?: boolean }).is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {(item as unknown as { status?: string }).status === 'published' || (item as unknown as { is_active?: boolean }).is_active ? 'Active' : 'Draft'}
                </span>
                <span className="text-xs text-slate-500 font-mono">Order: #{item.display_order}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100">{item.question}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.answer}</p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-start">
              <button
                onClick={() => openEdit(item)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && !loading && (
          <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-500">
            No FAQ items in this category.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editId ? 'Edit FAQ Item' : 'New FAQ Item'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <input
                type="text"
                required
                placeholder="General, Licensing, Billing, Usage"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Question *</label>
              <input
                type="text"
                required
                placeholder="Can I use icons in commercial client projects?"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Answer *</label>
              <textarea
                rows={4}
                required
                placeholder="Detailed response..."
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                  <span>Active / Published</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save FAQ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
