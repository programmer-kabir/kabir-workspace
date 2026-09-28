import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFaqs, createFaq, updateFaq, deleteFaq } from "../../api/faqApi";
import { HelpCircle, Plus, Edit, Trash2 } from "lucide-react";
import Swal from 'sweetalert2';
import DayalLoader from "../../components/Common/DayalLoader";

const Faqs = () => {
  const [filter, setFilter] = useState("faq"); // 'faq' or 'category'
  const queryClient = useQueryClient();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', slug: '', // For Category
    question: '', answer: '', category_id: '' // For FAQ
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["faqs", filter],
    queryFn: () => getFaqs(filter),
  });

  const { data: categories } = useQuery({
    queryKey: ["faqs", "category"],
    queryFn: () => getFaqs("category"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createFaq(data, filter),
    onSuccess: () => {
      Swal.fire({ title: "Success", text: "Item created successfully", icon: "success", background: '#12121E', color: '#fff' });
      queryClient.invalidateQueries(["faqs"]);
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateFaq(data, filter),
    onSuccess: () => {
      Swal.fire({ title: "Success", text: "Item updated successfully", icon: "success", background: '#12121E', color: '#fff' });
      queryClient.invalidateQueries(["faqs"]);
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFaq(id, filter),
    onSuccess: () => {
      Swal.fire({ title: "Deleted", text: "Item deleted successfully", icon: "success", background: '#12121E', color: '#fff' });
      queryClient.invalidateQueries(["faqs"]);
    }
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3f3f46",
      confirmButtonText: "Yes, delete it!",
      background: '#12121E',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ ...formData, id: editingItem.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', slug: '', question: '', answer: '', category_id: '' });
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <HelpCircle className="text-[#6C4FE0]" />
            FAQs Management
          </h1>
          <p className="text-sm text-gray-400">Manage frequently asked questions and categories.</p>
        </div>
        
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#6C4FE0]/50"
          >
            <option value="faq" className="bg-[#12121E]">Questions</option>
            <option value="category" className="bg-[#12121E]">Categories</option>
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#6C4FE0] hover:bg-[#5b3fd4] text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Add New
          </button>
        </div>
      </div>

      {isLoading ? (
        <DayalLoader text="Loading FAQs and categories..." />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-sm text-gray-400">
                  {filter === 'category' ? (
                    <>
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Slug</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 font-medium">Question</th>
                      <th className="p-4 font-medium">Category ID</th>
                    </>
                  )}
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    {filter === 'category' ? (
                      <>
                        <td className="p-4 text-white font-medium">{item.name}</td>
                        <td className="p-4 text-gray-400">{item.slug}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-white font-medium">{item.question}</td>
                        <td className="p-4 text-gray-400">{item.category_id}</td>
                      </>
                    )}
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#12121E] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingItem ? 'Edit' : 'Add New'} {filter === 'category' ? 'Category' : 'FAQ'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {filter === 'category' ? (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                    <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Slug</label>
                    <input type="text" required value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <select required value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]">
                      <option value="" className="bg-[#12121E]">Select Category</option>
                      {categories?.map(c => <option key={c.id} value={c.id} className="bg-[#12121E]">{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Question</label>
                    <input type="text" required value={formData.question || ''} onChange={e => setFormData({...formData, question: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Answer</label>
                    <textarea required rows="4" value={formData.answer || ''} onChange={e => setFormData({...formData, answer: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0] resize-none"></textarea>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 text-gray-400 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-white bg-[#6C4FE0] hover:bg-[#5b3fd4] rounded-xl transition-colors">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faqs;
