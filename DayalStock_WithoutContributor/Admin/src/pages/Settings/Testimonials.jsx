import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import DayalLoader from "../../components/Common/DayalLoader";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY;

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    message: "",
    status: "active",
  });
  const [avatarFile, setAvatarFile] = useState(null);



  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${BASE_URL}/cms/testimonials/getTestimonials.php`);
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.data || []);
      }
    } catch {
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTestimonials();
  }, []);
  const handleOpenModal = (testimonial = null) => {
    setCurrentTestimonial(testimonial);
    if (testimonial) {
      setFormData({
        name: testimonial.name || "",
        designation: testimonial.designation || "",
        message: testimonial.message || "",
        status: testimonial.status || "active",
      });
    } else {
      setFormData({ name: "", designation: "", message: "", status: "active" });
    }
    setAvatarFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("action", "delete");
      fd.append("id", id);

      const res = await fetch(`${BASE_URL}/cms/testimonials/manageTestimonials.php`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted successfully");
        fetchTestimonials();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting testimonial");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("action", currentTestimonial ? "update" : "add");
      if (currentTestimonial) fd.append("id", currentTestimonial.id);

      fd.append("name", formData.name);
      fd.append("designation", formData.designation);
      fd.append("message", formData.message);
      fd.append("status", formData.status);
      if (avatarFile) fd.append("avatar", avatarFile);

      const res = await fetch(`${BASE_URL}/cms/testimonials/manageTestimonials.php`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsModalOpen(false);
        fetchTestimonials();
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Error saving testimonial");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DayalLoader text="Loading testimonials..." />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Testimonials</h1>
          <p className="text-gray-400">Manage user testimonials and reviews.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg"
        >
          <Plus size={20} />
          Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-[#1e1e1e] border border-gray-800 rounded-xl p-6 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(t)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(t.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={t.avatar_url ? `https://api.dayalstock.com/${t.avatar_url}` : "https://api.dayalstock.com/images/logo/dayalstock.png"}
                alt={t.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-700 bg-gray-800"
              />
              <div>
                <h3 className="text-white font-semibold">{t.name}</h3>
                <p className="text-sm text-gray-400">{t.designation}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm line-clamp-3">"{t.message}"</p>
            <div className="mt-4 inline-block px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 capitalize border border-gray-700">
              {t.status}
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
            No testimonials found. Create one to get started.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              {currentTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Avatar Image (Optional)</label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files.length > 0) setAvatarFile(e.target.files[0]);
                  }}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                disabled={saving}
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-medium transition-all"
              >
                {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? "Saving..." : "Save Testimonial"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Testimonials;
