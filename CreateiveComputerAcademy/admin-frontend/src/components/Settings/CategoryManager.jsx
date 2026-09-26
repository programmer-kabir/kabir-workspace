import React, { useState, useEffect } from 'react';
import { 
  FiFolder, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiCheck, 
  FiX, 
  FiChevronRight, 
  FiChevronDown, 
  FiList, 
  FiClock, 
  FiTag, 
  FiRefreshCw, 
  FiSliders,
  FiLayers
} from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'sonner';

export const CategoryManager = ({ apiBase = '' }) => {
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [modalTarget, setModalTarget] = useState({
    id: null,
    name: '',
    parent_id: null,
    level: 'category', // 'category' | 'subcategory' | 'child'
    icon: '🎨',
    color: 'from-blue-500 to-indigo-600',
    estimated_minutes: 90,
    credit: 5,
    checklists: []
  });
  const [newChecklistText, setNewChecklistText] = useState('');
  const [saving, setSaving] = useState(false);

  const resolvedApiBase = (apiBase || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/';

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${resolvedApiBase}api/categories/get_categories.php`);
      if (res.data && res.data.status === 'success' && res.data.data?.tree) {
        setCategoriesTree(res.data.data.tree);
        // Expand first category by default
        if (res.data.data.tree.length > 0) {
          setExpandedCats({ [res.data.data.tree[0].id]: true });
          if (res.data.data.tree[0].subcategories?.length > 0) {
            setExpandedSubs({ [res.data.data.tree[0].subcategories[0].id]: true });
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [apiBase]);

  const toggleCat = (id) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSub = (id) => setExpandedSubs(prev => ({ ...prev, [id]: !prev[id] }));

  // Open Create Modal
  const openCreateModal = (level = 'category', parentId = null, parentName = '') => {
    setModalMode('create');
    setModalTarget({
      id: null,
      name: '',
      parent_id: parentId,
      parent_name: parentName,
      level: level,
      icon: level === 'category' ? '🎨' : level === 'subcategory' ? '📁' : '🏷️',
      color: 'from-blue-500 to-indigo-600',
      estimated_minutes: 90,
      credit: 5,
      checklists: []
    });
    setNewChecklistText('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item, level) => {
    setModalMode('edit');
    setModalTarget({
      id: item.id,
      name: item.name,
      parent_id: item.parent_id || null,
      level: level,
      icon: item.icon || '🏷️',
      color: item.color || 'from-blue-500 to-indigo-600',
      estimated_minutes: item.estimated_minutes || 90,
      credit: item.credit || 5,
      checklists: Array.isArray(item.default_checklists) ? item.default_checklists : []
    });
    setNewChecklistText('');
    setModalOpen(true);
  };

  // Save Modal (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!modalTarget.name.trim()) {
      toast.error('Name is required!');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        const res = await axios.post(`${resolvedApiBase}api/categories/create_category.php`, {
          name: modalTarget.name.trim(),
          parent_id: modalTarget.parent_id,
          level: modalTarget.level,
          icon: modalTarget.icon,
          color: modalTarget.color,
          estimated_minutes: Number(modalTarget.estimated_minutes) || 90,
          credit: Number(modalTarget.credit) || 5,
          checklists: modalTarget.checklists
        });
        if (res.data.status === 'success') {
          toast.success('Category created successfully!');
          setModalOpen(false);
          await fetchCategories();
        } else {
          toast.error(res.data.message || 'Error creating category');
        }
      } else {
        const res = await axios.post(`${resolvedApiBase}api/categories/update_category.php`, {
          id: modalTarget.id,
          name: modalTarget.name.trim(),
          icon: modalTarget.icon,
          color: modalTarget.color,
          estimated_minutes: Number(modalTarget.estimated_minutes) || 90,
          credit: Number(modalTarget.credit) || 5,
          checklists: modalTarget.checklists
        });
        if (res.data.status === 'success') {
          toast.success('Category updated successfully!');
          setModalOpen(false);
          await fetchCategories();
        } else {
          toast.error(res.data.message || 'Error updating category');
        }
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete / deactivate "${name}"?`)) return;
    try {
      const res = await axios.post(`${resolvedApiBase}api/categories/delete_category.php`, { id });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Category deleted');
        await fetchCategories();
      } else {
        toast.error(res.data.message || 'Error deleting category');
      }
    } catch (err) {
      toast.error('Error deleting category.');
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setModalTarget(prev => ({
      ...prev,
      checklists: [...prev.checklists, newChecklistText.trim()]
    }));
    setNewChecklistText('');
  };

  const removeChecklistItem = (idx) => {
    setModalTarget(prev => ({
      ...prev,
      checklists: prev.checklists.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <FiLayers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Task Categories & Smart Presets Manager
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              Manage 3-tier hierarchy (Category › Subcategory › Child Type) and default task checklists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Categories"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('category', null, '')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FiPlus size={14} /> Add Main Category
          </button>
        </div>
      </div>

      {/* Tree Content */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading categories...</span>
        </div>
      ) : categoriesTree.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs font-medium">
          No categories found. Click "Add Main Category" to start.
        </div>
      ) : (
        <div className="space-y-3">
          {categoriesTree.map((mainCat) => {
            const isCatOpen = expandedCats[mainCat.id];
            return (
              <div 
                key={mainCat.id} 
                className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/30 transition-all"
              >
                {/* Main Category Row */}
                <div className="p-4 flex items-center justify-between gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer" onClick={() => toggleCat(mainCat.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button type="button" className="text-slate-400 hover:text-slate-600">
                      {isCatOpen ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                    </button>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${mainCat.color || 'from-pink-500 to-rose-600'} text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0`}>
                      {mainCat.icon || '🎨'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                          {mainCat.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold flex items-center gap-0.5 shrink-0">
                          🪙 {mainCat.credit || 5} Credits
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Level 1 • {mainCat.subcategories?.length || 0} Subcategories
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openCreateModal('subcategory', mainCat.id, mainCat.name)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <FiPlus size={12} /> Add Subcategory
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(mainCat, 'category')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit Category"
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(mainCat.id, mainCat.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete Category"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Container */}
                {isCatOpen && (
                  <div className="p-3 pl-8 sm:pl-10 space-y-2 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/50">
                    {mainCat.subcategories?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No subcategories yet. Click "+ Add Subcategory" above.</p>
                    ) : (
                      mainCat.subcategories?.map((subCat) => {
                        const isSubOpen = expandedSubs[subCat.id];
                        return (
                          <div 
                            key={subCat.id} 
                            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800"
                          >
                            {/* Subcategory Row */}
                            <div 
                              className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                              onClick={() => toggleSub(subCat.id)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button type="button" className="text-slate-400">
                                  {isSubOpen ? <FiChevronDown size={15} /> : <FiChevronRight size={15} />}
                                </button>
                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {subCat.icon || '💳'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                      {subCat.name}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[9px] font-extrabold flex items-center gap-0.5 shrink-0">
                                      🪙 {subCat.credit || mainCat.credit || 5} Credits
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-semibold text-slate-400">
                                    Level 2 • {subCat.children?.length || 0} Specific Types
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openCreateModal('child', subCat.id, `${mainCat.name} › ${subCat.name}`)}
                                  className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                >
                                  <FiPlus size={11} /> Add Type
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(subCat, 'subcategory')}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                >
                                  <FiEdit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(subCat.id, subCat.name)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Level 3: Child Categories List */}
                            {isSubOpen && (
                              <div className="p-2.5 pl-8 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40">
                                {subCat.children?.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 py-1">No specific types yet. Click "+ Add Type".</p>
                                ) : (
                                  subCat.children?.map((child) => (
                                    <div
                                      key={child.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs group hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-xs">{child.icon || '🏷️'}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                          {child.name}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[9px] font-extrabold flex items-center gap-0.5 shrink-0">
                                          🪙 {child.credit || subCat.credit || mainCat.credit || 5} Credits
                                        </span>
                                        {child.default_checklists?.length > 0 && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold flex items-center gap-1">
                                            <FiList size={9} /> {child.default_checklists.length} Checklist Items
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(child, 'child')}
                                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                          title="Edit Type & Checklist"
                                        >
                                          <FiEdit2 size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDelete(child.id, child.name)}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                                          title="Delete Type"
                                        >
                                          <FiTrash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for Category / Subcategory / Child Type */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                  {modalMode === 'create' ? `Add New ${modalTarget.level === 'category' ? 'Main Category' : modalTarget.level === 'subcategory' ? 'Subcategory' : 'Specific Type'}` : `Edit ${modalTarget.name}`}
                </h3>
                {modalTarget.parent_name && (
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Under: {modalTarget.parent_name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Name & Icon */}
              <div className="flex gap-2">
                <div className="w-16 flex-shrink-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Icon</label>
                  <input
                    type="text"
                    value={modalTarget.icon}
                    onChange={e => setModalTarget({ ...modalTarget, icon: e.target.value })}
                    className="w-full text-center h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-base"
                    placeholder="🎨"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={modalTarget.name}
                    onChange={e => setModalTarget({ ...modalTarget, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. Doctor / Medical"
                  />
                </div>
              </div>

              {/* Task Reward Credits & Estimated Minutes */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <span>🪙</span> Task Reward Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalTarget.credit}
                    onChange={e => setModalTarget({ ...modalTarget, credit: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-bold text-amber-900 dark:text-amber-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <FiClock size={12} className="text-blue-500" /> Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={modalTarget.estimated_minutes}
                    onChange={e => setModalTarget({ ...modalTarget, estimated_minutes: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="90"
                  />
                </div>
              </div>

              {/* Default Checklists (Smart Preset) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  <FiList size={12} className="text-emerald-500" /> Default Task Checklists (Auto-injected into new tasks)
                </label>
                <div className="space-y-1.5 mb-2">
                  {modalTarget.checklists?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="flex-1 text-slate-700 dark:text-slate-200 text-xs">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(idx)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Checklist Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }}}
                    placeholder="Type a standard checklist requirement & press Add..."
                    className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="px-3 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default CategoryManager;
