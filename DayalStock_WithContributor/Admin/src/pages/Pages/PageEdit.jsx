import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Save, Loader, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { authFetch } from "../../api/authFetch";
import RichTextEditor from "../../components/RichTextEditor";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY;

const PageEdit = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const defaultTitle = searchParams.get("title") || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  
  const navigate = useNavigate();
  
  const [pageId, setPageId] = useState(null);
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("published");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await authFetch(`${BASE_URL}/cms/pages/admin.php?slug=${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          setPageId(data.data.id);
          setTitle(data.data.title || defaultTitle);
          setContent(data.data.content || "");
          setStatus(data.data.status || "published");
        }
      } catch (err) {
        // Not created yet, fine
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, defaultTitle]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    
    setSaving(true);
    
    const payload = {
      title,
      slug,
      content,
      content_format: "html",
      status
    };

    if (pageId) payload.id = pageId;

    const method = "POST";

    try {
      const res = await authFetch(`${BASE_URL}/cms/pages/admin.php`, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || `Page ${pageId ? "updated" : "created"} successfully!`);
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: data.message || "Page updated successfully",
          timer: 1800,
          showConfirmButton: false,
          background: "#12121E",
          color: "#ffffff"
        });
        if (data.id) {
          setPageId(data.id);
        }
      } else {
        toast.error(data.message || "Failed to save page");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to save page",
          background: "#12121E",
          color: "#ffffff"
        });
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 max-w-6xl mx-auto flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-[#6C4FE0]" size={32} />
        <p className="text-gray-400 text-sm">Loading page content...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard/pages")}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Edit Page: {title}</h1>
            <p className="text-sm font-mono text-[#6C4FE0]">/{slug}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#6C4FE0] hover:bg-[#5b3fd4] text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#6C4FE0]/20 disabled:opacity-50"
        >
          {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
          Save Page
        </button>
      </div>

      <div className="bg-[#12121E] rounded-2xl border border-white/5 p-6 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Page Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#6C4FE0]/50" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="w-full bg-[#12121E] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#6C4FE0]/50"
            >
              <option value="published" className="bg-[#12121E]">Published</option>
              <option value="draft" className="bg-[#12121E]">Draft</option>
              <option value="archived" className="bg-[#12121E]">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Page Content</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
};

export default PageEdit;
