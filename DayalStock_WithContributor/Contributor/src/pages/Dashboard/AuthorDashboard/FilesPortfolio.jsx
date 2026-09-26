import { useState } from "react";
import { Search, Eye, Download, CheckCircle, Clock, XCircle, FileEdit, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

const FilesPortfolio = () => {
  const [activeTab, setActiveTab] = useState("published");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock list of files based on database contents
  const mockFiles = [
    {
      id: 1,
      title: "Abstract Blue Leaf Floral Illustration",
      type: "vector",
      license: "free",
      downloads: 412,
      views: 1205,
      date: "2026-07-04",
      status: "published",
      thumbnail: "https://dayalstock.com/images/contents/abstract-blue-leaf-floral-illustration.png",
    },
    {
      id: 2,
      title: "Red Rose Flower Clipart Illustration",
      type: "vector",
      license: "free",
      downloads: 245,
      views: 780,
      date: "2026-07-04",
      status: "published",
      thumbnail: "https://dayalstock.com/images/contents/red-rose-flower-clipart-illustration.png",
    },
    {
      id: 3,
      title: "White Water Lily Flower on Pond",
      type: "photo",
      license: "free",
      downloads: 128,
      views: 520,
      date: "2026-07-04",
      status: "published",
      thumbnail: "https://dayalstock.com/images/contents/white-water-lily-flower-on-pond.jpg",
    },
    {
      id: 4,
      title: "Black and White Sports Car Crash Silhouette Vector",
      type: "vector",
      license: "free",
      downloads: 84,
      views: 310,
      date: "2026-07-05",
      status: "published",
      thumbnail: "https://dayalstock.com/images/contents/black-white-sports-car-crash-silhouette-preview.jpg",
    },
    {
      id: 5,
      title: "Abstract Geometric Neon Background",
      type: "vector",
      license: "premium",
      downloads: 0,
      views: 12,
      date: "2026-07-06",
      status: "pending",
      thumbnail: "",
    },
    {
      id: 6,
      title: "Vintage Coffee Banner Vector Layout",
      type: "vector",
      license: "free",
      downloads: 0,
      views: 0,
      date: "2026-07-05",
      status: "draft",
      thumbnail: "",
    },
  ];

  const filteredFiles = mockFiles.filter(
    (file) =>
      file.status === activeTab &&
      file.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "published", name: "Published", count: 4, icon: <CheckCircle size={16} /> },
    { id: "pending", name: "Under Revision", count: 1, icon: <Clock size={16} /> },
    { id: "draft", name: "Drafts", count: 1, icon: <FileEdit size={16} /> },
    { id: "rejected", name: "Rejected", count: 0, icon: <XCircle size={16} /> },
  ];

  const handleDelete = (id, title) => {
    toast.info(`Delete requested for "${title}"`);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Portfolio</h2>
          <p className="text-sm text-gray-400">Manage your uploaded designs and check their review status</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-[#0F0F1A] pl-11 pr-4 text-xs text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0]"
          />
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
              activeTab === tab.id
                ? "border-[#6C4FE0] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === tab.id ? "bg-[#6C4FE0] text-white" : "bg-white/5 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* FILES LIST GRID */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-[#0F0F1A]"
            >
              
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-[#1A1A2E]/50">
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-gray-600">
                    <ShieldAlert size={28} className="mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No Preview Yet</span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className={`rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm text-white ${
                    file.license === "premium" ? "bg-[#FF6B6B]" : "bg-[#6C4FE0]"
                  }`}>
                    {file.license}
                  </span>
                  
                  <span className="rounded-lg bg-black/40 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-md">
                    {file.type}
                  </span>
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="line-clamp-1 text-sm font-bold text-white group-hover:text-[#6C4FE0] transition-colors">
                    {file.title}
                  </h4>
                  <p className="text-[11px] text-gray-500">Uploaded on {file.date}</p>
                </div>

                {/* Stats */}
                {file.status === "published" && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-3.5 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Eye size={14} className="text-gray-500" />
                      <span>{file.views} views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Download size={14} className="text-gray-500" />
                      <span className="font-semibold text-white">{file.downloads} DLs</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons for non-published / management */}
                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3.5">
                  <button className="flex-1 rounded-xl bg-white/5 py-2 text-center text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.title)}
                    className="rounded-xl bg-red-500/5 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-500">
          <Clock size={40} className="mb-3 text-gray-600" />
          <p className="text-sm font-semibold text-white">No assets found</p>
          <p className="mt-1 text-xs">Upload some files or change tabs to see files.</p>
        </div>
      )}

    </div>
  );
};

export default FilesPortfolio;
