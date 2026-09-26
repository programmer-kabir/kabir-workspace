import { useState } from "react";
import useCategories from "../../utils/Hooks/useCategories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCategory, updateCategory, deleteCategory } from "../../api/categoryApi";
import DayalLoader from "../../components/Common/DayalLoader";
import { toast } from "react-toastify";
import {
  FolderTree,
  Plus,
  Search,
  Layers,
  Image as ImageIcon,
  Edit2,
  Trash2,
  FolderPlus,
  X,
  AlertTriangle
} from "lucide-react";

const IMG_BASE = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const Categories = () => {
  const queryClient = useQueryClient();
  const { data: allCategories, isLoading, isError } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [formData, setFormData] = useState({ name: "", slug: "", image: null });

  const addMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      toast.success("Category added successfully! 🎉");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add category.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      toast.success("Category updated successfully! ✨");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      toast.success("Category deleted successfully! 🗑️");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete category.");
    }
  });

  const openAddModal = (parentId = null) => {
    setFormData({ name: "", slug: "", image: null });
    setModalState({ type: "ADD", data: { parentId } });
  };

  const openEditModal = (category) => {
    setFormData({ name: category.name, slug: category.slug, image: null });
    setModalState({ type: "EDIT", data: category });
  };

  const openDeleteModal = (category) => {
    setModalState({ type: "DELETE", data: category });
  };

  const closeModal = () => {
    setModalState({ type: null, data: null });
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    if (modalState.data?.parentId) data.append("parent_id", modalState.data.parentId);
    if (formData.image) data.append("image", formData.image);
    
    addMutation.mutate(data);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("id", modalState.data?.id);
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    if (formData.image) data.append("image", formData.image);
    
    updateMutation.mutate(data);
  };

  const handleConfirmDelete = () => {
    if (modalState.data?.id) {
      deleteMutation.mutate(modalState.data.id);
    }
  };

  // Process categories to build a tree
  const buildTree = (cats = []) => {
    const parentCats = cats.filter(c => c.parent_id === null || c.parent_id === "0");
    return parentCats.map(parent => ({
      ...parent,
      subcategories: cats.filter(c => String(c.parent_id) === String(parent.id))
    }));
  };

  const categoryTree = buildTree(allCategories || []);

  const filteredTree = categoryTree.filter(cat => 
    (cat.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    cat.subcategories.some(sub => (sub.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[#12121E] border border-white/5 shadow-2xl">
        <div className="absolute top-[-20%] left-[-10%] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-[100px] pointer-events-none" />
        
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <FolderTree size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 tracking-wide">
                Categories
              </h1>
              <p className="mt-2 text-base text-gray-400 max-w-lg">
                Organize your assets into categories and subcategories.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => openAddModal(null)}
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-400 transition-all hover:bg-blue-500 hover:text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            >
              <Plus size={18} strokeWidth={3} />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-xl">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search categories or subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      {/* STATES */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <DayalLoader text="Loading categories..." />
        </div>
      )}
      
      {isError && (
        <div className="text-center py-20 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          Failed to load categories. Please try again.
        </div>
      )}

      {/* CATEGORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {!isLoading && !isError && filteredTree.map((category) => (
          <div 
            key={category.id} 
            className="group flex flex-col rounded-3xl border border-white/5 bg-[#12121E] overflow-hidden hover:border-blue-500/30 transition-all duration-300 shadow-xl"
          >
            {/* Category Header with Image */}
            <div className="relative h-40 w-full bg-[#1a1a2e] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#12121E] via-[#12121E]/60 to-transparent z-10" />
              {category.image ? (
                <img 
                  src={category.image.startsWith('http') ? category.image : `${IMG_BASE}${category.image.startsWith('/') ? '' : '/'}${category.image}`} 
                  alt={category.name}
                  className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center opacity-20">
                  <ImageIcon size={64} />
                </div>
              )}
              
              <div className="absolute bottom-4 left-6 right-6 z-20 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-wide drop-shadow-md">{category.name}</h3>
                  <p className="text-xs font-medium text-blue-300/80 mt-1 uppercase tracking-wider">{category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(category)}
                    className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-blue-500 transition-colors backdrop-blur-md"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(category)}
                    className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-colors backdrop-blur-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Subcategories List */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <Layers size={16} /> 
                  Subcategories ({category.subcategories?.length || 0})
                </span>
                <button 
                  onClick={() => openAddModal(category.id)}
                  className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                >
                  <Plus size={12} strokeWidth={3}/> Add
                </button>
              </div>

              {category.subcategories && category.subcategories.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {category.subcategories.map(sub => (
                    <div 
                      key={sub.id}
                      className="group/sub relative flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm font-medium text-gray-300 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors"
                    >
                      <span className="truncate max-w-[120px]">{sub.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                         <button onClick={() => openEditModal(sub)} className="text-gray-500 hover:text-blue-400"><Edit2 size={12}/></button>
                         <button onClick={() => openDeleteModal(sub)} className="text-gray-500 hover:text-red-400"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-gray-500 opacity-60 border-2 border-dashed border-white/5 rounded-xl">
                  <FolderPlus size={24} className="mb-2" />
                  <p className="text-sm font-medium">No subcategories</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {modalState.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12121E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* DELETE MODAL */}
            {modalState.type === "DELETE" && (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Category?</h3>
                <p className="text-gray-400 text-sm mb-8">
                  Are you sure you want to delete <span className="text-white font-bold">"{modalState.data?.name}"</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}

            {/* ADD / EDIT MODAL */}
            {(modalState.type === "ADD" || modalState.type === "EDIT") && (
              <form onSubmit={modalState.type === "ADD" ? handleSubmitAdd : handleSubmitEdit}>
                <div className="flex items-center justify-between border-b border-white/5 p-6 bg-white/[0.02]">
                  <h3 className="text-xl font-bold text-white">
                    {modalState.type === "ADD" ? (modalState.data?.parentId ? "Add Subcategory" : "Add Category") : "Edit Category"}
                  </h3>
                  <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="e.g., 3D Models"
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Slug (URL friendly)</label>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      required
                      placeholder="e.g., 3d-models"
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Image Cover</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-gray-400 outline-none file:mr-4 file:rounded-md file:border-0 file:bg-blue-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-gray-500">Optional. Only for visual representation.</p>
                  </div>
                </div>

                <div className="border-t border-white/5 p-6 flex justify-end gap-3 bg-white/[0.02]">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
