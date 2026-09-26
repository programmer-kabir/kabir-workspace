import { useState, useEffect } from "react";
import { Save, Loader } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY; // Using same env pattern

const Settings = () => {
  const [activeTab, setActiveTab] = useState("global");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({}); // To hold uploaded files

  const defaultSettings = {
    footer_text: "Dayal Stock",
    footer_copyright: "© 2026 Dayal Stock. All rights reserved",
    hero_title: "Create without limits.",
    hero_highlight_text: "High-quality",
    hero_subtitle: "stock media.",
    hero_description: "Download millions of professional vectors, stock photos, and videos to bring your ideas to life faster.",
    cta_title: "Ready to Elevate Your Projects?",
    cta_description: "Join thousands of creators using our premium stock assets to build beautiful websites, apps, and designs faster.",
    cta_primary_btn_text: "Create Free Account",
    cta_primary_btn_link: "/register",
    cta_secondary_btn_text: "Explore Pro Plans",
    cta_secondary_btn_link: "/pricing",
    cta_footer_text: "No credit card required for free accounts.",
    join_pro_title: "Unlock Unlimited Creativity",
    join_pro_badge: "Dayal Stock Pro",
    join_pro_btn_text: "Start Your Free Trial",
    join_pro_btn_link: "/join-pro"
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/cms/settings/getSettings.php`);
      const data = await res.json();
      if (data.success) {
        const fetchedData = data.data || {};
        setFormData({ ...defaultSettings, ...fetchedData });
      }
    } catch {
      toast.error("Failed to fetch settings");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token"); // Assuming admin uses token
    const formDataToSend = new FormData();

    // Append text data
    for (const key in formData) {
      if (typeof formData[key] === "object") {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }

    // Append files
    for (const key in files) {
      formDataToSend.append(key, files[key]);
    }

    try {
      const res = await fetch(`${BASE_URL}/cms/settings/updateSettings.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Settings updated successfully!");
        setFiles({}); // clear local files
        fetchSettings(); // re-fetch to get new image paths
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "global", label: "Global & Footer" },
    { id: "hero", label: "Hero Banner" },
    { id: "cta", label: "CTA Section" },
    { id: "join_pro", label: "Join Pro" },
  ];

  if (fetching) {
    return <div className="p-6 text-white flex items-center gap-2"><Loader className="animate-spin" /> Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Site Settings</h1>
          <p className="text-gray-400">Manage dynamic marketing content and global settings.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg"
        >
          {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
          Save Changes
        </button>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#161616]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-orange-500 border-b-2 border-orange-500 bg-[#1e1e1e]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Form */}
        <form className="p-6" onSubmit={handleSave}>
          {activeTab === "global" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Site Logo (Current: {formData.site_logo || 'Default'})</label>
                <input type="file" name="site_logo" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Website Name (Site Title)</label>
                <input type="text" name="site_title" value={formData.site_title || ""} onChange={handleChange} placeholder="e.g. Dayal Stock" className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color Theme</label>
                <div className="flex items-center gap-3">
                  <input type="color" name="primary_color" value={formData.primary_color || "#ff7900"} onChange={handleChange} className="w-12 h-12 bg-transparent border-0 cursor-pointer rounded-lg" />
                  <input type="text" name="primary_color" value={formData.primary_color || "#ff7900"} onChange={handleChange} className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white uppercase" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Footer Text</label>
                <input type="text" name="footer_text" value={formData.footer_text || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Copyright Text</label>
                <input type="text" name="footer_copyright" value={formData.footer_copyright || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              {/* Note: In a full implementation, you'd add JSON parsing for social_links here. For brevity, it is skipped. */}
            </div>
          )}

          {activeTab === "hero" && (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hero Title</label>
                <input type="text" name="hero_title" value={formData.hero_title || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hero Highlighted Word</label>
                <input type="text" name="hero_highlight_text" value={formData.hero_highlight_text || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hero Subtitle</label>
                <input type="text" name="hero_subtitle" value={formData.hero_subtitle || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hero Description</label>
                <textarea name="hero_description" rows={3} value={formData.hero_description || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hero Background Image</label>
                <input type="file" name="hero_bg_image" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-500" />
              </div>
            </div>
          )}

          {activeTab === "cta" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">CTA Title</label>
                <input type="text" name="cta_title" value={formData.cta_title || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">CTA Description</label>
                <textarea name="cta_description" rows={3} value={formData.cta_description || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Button Text</label>
                <input type="text" name="cta_primary_btn_text" value={formData.cta_primary_btn_text || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Button Link</label>
                <input type="text" name="cta_primary_btn_link" value={formData.cta_primary_btn_link || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Button Text</label>
                <input type="text" name="cta_secondary_btn_text" value={formData.cta_secondary_btn_text || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Button Link</label>
                <input type="text" name="cta_secondary_btn_link" value={formData.cta_secondary_btn_link || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Footer Note</label>
                <input type="text" name="cta_footer_text" value={formData.cta_footer_text || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
          )}

          {activeTab === "join_pro" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Join Pro Title</label>
                <input type="text" name="join_pro_title" value={formData.join_pro_title || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Join Pro Badge</label>
                <input type="text" name="join_pro_badge" value={formData.join_pro_badge || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
                <input type="text" name="join_pro_btn_text" value={formData.join_pro_btn_text || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Button Link</label>
                <input type="text" name="join_pro_btn_link" value={formData.join_pro_btn_link || ""} onChange={handleChange} className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Section Image</label>
                <input type="file" name="join_pro_image" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-500" />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Settings;
