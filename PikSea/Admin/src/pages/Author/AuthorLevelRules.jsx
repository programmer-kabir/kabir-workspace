import React, { useState, useEffect } from 'react';
import { authFetch } from '../../api/authFetch';
import { Award, Plus, Edit, Trash2, CheckCircle, XCircle, History, Sparkles, RefreshCw, X, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#6B7280', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#10B981'
];

const AuthorLevelRules = () => {
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'history'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    level_number: 0,
    level_name: '',
    min_published_files: 0,
    min_total_downloads: 0,
    badge_color: '#3B82F6',
    benefits: '',
    is_active: 1
  });

  const apiUrl = import.meta.env.VITE_LOCALHOST_KEY;

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${apiUrl}/author/get_level_rules.php`);
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.level_rules || []);
        setRules(list);
      } else {
        toast.error(data.message || 'Failed to fetch level rules');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await authFetch(`${apiUrl}/author/get_level_history.php`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchHistory();
  }, []);

  const handleOpenAdd = () => {
    const nextLevelNum = rules.length > 0 ? Math.max(...rules.map(r => r.level_number)) + 1 : 1;
    setFormData({
      id: 0,
      level_number: nextLevelNum,
      level_name: '',
      min_published_files: 0,
      min_total_downloads: 0,
      badge_color: '#3B82F6',
      benefits: '',
      is_active: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setFormData({
      id: rule.id,
      level_number: rule.level_number,
      level_name: rule.level_name,
      min_published_files: rule.min_published_files,
      min_total_downloads: rule.min_total_downloads,
      badge_color: rule.badge_color || '#3B82F6',
      benefits: rule.benefits || '',
      is_active: rule.is_active ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.level_name.trim()) {
      toast.error('Please provide a level name');
      return;
    }

    try {
      setFormLoading(true);
      const res = await authFetch(`${apiUrl}/author/save_level_rule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Saved successfully');
        setIsModalOpen(false);
        fetchRules();
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving rule');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`${apiUrl}/author/delete_level_rule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Level rule deleted successfully');
        setIsDeleting(null);
        fetchRules();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error deleting rule');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-900/60 p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Award className="text-amber-400" />
            Author Level Rules & Gamification
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Configure author progression milestones, download thresholds, level badges, and review upgrade history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchRules(); fetchHistory(); }}
            className="p-2.5 rounded-xl border border-gray-700 bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Level Rule</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'rules'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Award size={15} />
          <span>Active Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <History size={15} />
          <span>Upgrade History Log ({history.length})</span>
        </button>
      </div>

      {/* TAB 1: RULES TABLE */}
      {activeTab === 'rules' && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading author level rules...</div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No author level rules found. Click &quot;Add New Level Rule&quot; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Level #</th>
                    <th className="py-3.5 px-4">Level Name & Badge</th>
                    <th className="py-3.5 px-4">Min Published Files</th>
                    <th className="py-3.5 px-4">Min Downloads</th>
                    <th className="py-3.5 px-4">Benefits & Perks</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-xs">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-4 font-bold text-white">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 text-amber-400">
                          {rule.level_number}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: rule.badge_color || '#3B82F6' }}
                          >
                            <Sparkles size={12} />
                            {rule.level_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-200">
                        {rule.min_published_files} files
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-200">
                        {rule.min_total_downloads} dl
                      </td>

                      <td className="py-4 px-4 text-gray-400 max-w-xs truncate" title={rule.benefits}>
                        {rule.benefits || '—'}
                      </td>

                      <td className="py-4 px-4">
                        {rule.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-indigo-400 hover:border-indigo-500/40 transition"
                            title="Edit rule"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => setIsDeleting(rule.id)}
                            className="p-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-rose-400 hover:border-rose-500/40 transition"
                            title="Delete rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEVEL HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden shadow-xl">
          {historyLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading author upgrade history...</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No level upgrade logs recorded yet. Upgrades are logged automatically as authors reach milestones.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Level Transition</th>
                    <th className="py-3.5 px-4">Published Files</th>
                    <th className="py-3.5 px-4">Downloads</th>
                    <th className="py-3.5 px-4">Trigger / Reason</th>
                    <th className="py-3.5 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-xs">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-xs">
                            {log.author_avatar ? (
                              <img src={log.author_avatar.startsWith('http') ? log.author_avatar : `${import.meta.env.VITE_IMG_KEY || 'https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/'}/${log.author_avatar}`} alt={log.author_name} className="w-full h-full object-cover" />
                            ) : (
                              log.author_name?.charAt(0) || 'A'
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{log.author_name}</span>
                            <span className="text-[10px] text-gray-400">{log.author_email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: log.old_badge_color || '#6B7280' }}
                          >
                            {log.old_level_name}
                          </span>
                          <ArrowRight size={13} className="text-gray-500" />
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: log.new_badge_color || '#22C55E' }}
                          >
                            {log.new_level_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-200">
                        {log.published_files_at_change} files
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-200">
                        {log.downloads_at_change} dl
                      </td>

                      <td className="py-4 px-4 text-gray-400 max-w-xs truncate">
                        {log.changed_reason || 'Automatic milestone check'}
                      </td>

                      <td className="py-4 px-4 text-right text-gray-400">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              {formData.id > 0 ? 'Edit Level Rule' : 'Create New Level Rule'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 mb-5">
              Set the eligibility criteria, badge color, and perks for this contributor rank.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Level Number</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.level_number}
                    onChange={(e) => setFormData({ ...formData, level_number: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Level Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pro Artist"
                    value={formData.level_name}
                    onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Min Published Files</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_published_files}
                    onChange={(e) => setFormData({ ...formData, min_published_files: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Min Total Downloads</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_total_downloads}
                    onChange={(e) => setFormData({ ...formData, min_total_downloads: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1.5">Badge Color</label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, badge_color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition ${formData.badge_color === c ? 'border-white scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Benefits & Perks (Comma-separated)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Priority Review, Fast-track Payouts, Featured Creator Badge"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_active" className="font-bold text-gray-300 cursor-pointer">
                  Activate this level rule
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Level Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h4 className="text-base font-black text-white">Delete Level Rule?</h4>
            <p className="text-xs text-gray-400">
              Are you sure you want to permanently delete this level rule? Contributor milestone calculations will update automatically.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(isDeleting)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthorLevelRules;
