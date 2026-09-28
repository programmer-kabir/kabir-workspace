import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, FileText, Loader, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { authFetch } from "../../api/authFetch";
import DayalLoader from "../../components/Common/DayalLoader";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY;

const PagesList = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/cms/pages/admin.php`);
      const data = await res.json();
      if (data.success) {
        setPages(data.data || []);
      } else {
        toast.error(data.message || "Failed to load pages");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const defaultRequiredPages = [
    { title: "About Us", slug: "about-us" },
    { title: "Contact Us", slug: "contact-us" },
    { title: "FAQs", slug: "faqs" },
    { title: "Licensing", slug: "licensing" },
    { title: "Privacy Policy", slug: "privacy-policy" },
    { title: "Terms of Use", slug: "terms-of-use" },
    { title: "Contributor Guidelines", slug: "contributor-guidelines" },
    { title: "DMCA Policy", slug: "dmca" }
  ];

  // Combine database pages first, then append any uncreated default pages
  const displayList = [...pages];

  defaultRequiredPages.forEach((defPage) => {
    if (!displayList.some((p) => p.slug === defPage.slug)) {
      displayList.push({
        id: null,
        title: defPage.title,
        slug: defPage.slug,
        status: "missing"
      });
    }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pages Management</h1>
          <p className="text-gray-400">Manage content and statuses for static and dynamic pages.</p>
        </div>

        <button
          onClick={fetchPages}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-[#12121E] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <DayalLoader text="Loading dynamic pages..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">Page Title</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Slug / URL</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayList.map((item) => {
                  const status = item.status || "missing";

                  let badgeStyle = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                  let statusText = "Not Created";

                  if (status === "published") {
                    badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    statusText = "Published";
                  } else if (status === "draft") {
                    badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    statusText = "Draft";
                  } else if (status === "archived") {
                    badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                    statusText = "Archived";
                  }

                  return (
                    <tr key={item.slug} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#6C4FE0]/10 border border-[#6C4FE0]/20 flex items-center justify-center text-[#6C4FE0]">
                            <FileText size={18} />
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{item.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">/{item.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/dashboard/pages/edit/${item.slug}?title=${encodeURIComponent(item.title)}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6C4FE0] hover:text-white hover:border-[#6C4FE0] text-gray-300 transition-all shadow-md"
                          title="Edit Page"
                        >
                          <Edit size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagesList;
