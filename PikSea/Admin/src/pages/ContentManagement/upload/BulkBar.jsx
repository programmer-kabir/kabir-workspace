import { toast } from "react-toastify";
import { Sparkles, Loader2 } from "lucide-react";
import { useUpload } from "./UploadContext";

const BulkBar = ({ compact = false }) => {
  const {
    checkedFiles, setCheckedFiles,
    bulkCategory, setBulkCategory,
    bulkSubcategory, setBulkSubcategory,
    parentCategoriesComputed, categories,
    setFilesMetadata,
    handleBulkDelete, exportCSV,
    setShowBulkEditModal,
    generateBulkAIMetadata, isGeneratingAI,
  } = useUpload();

  if (checkedFiles.size === 0) return null;
  if (compact) return (
    <div className="text-[9px] font-bold text-[#00D4FF] bg-[#00D4FF]/10 rounded-lg px-2 py-1">
      {checkedFiles.size} file(s) selected
    </div>
  );

  const bulkSubCats = categories?.filter(c => String(c.parent_id) === String(bulkCategory));

  const applyBulkCategory = () => {
    if (!bulkCategory) { toast.warning("Select a category first."); return; }
    setFilesMetadata(prev => {
      const n = { ...prev };
      checkedFiles.forEach(fname => {
        n[fname] = { ...n[fname], category: bulkCategory, subcategory: bulkSubcategory };
      });
      return n;
    });
    toast.success(`Category applied to ${checkedFiles.size} file(s)!`);
    setCheckedFiles(new Set());
    setBulkCategory("");
    setBulkSubcategory("");
  };

  const applyBulkLicense = (license) => {
    setFilesMetadata(prev => {
      const n = { ...prev };
      checkedFiles.forEach(fname => { n[fname] = { ...n[fname], license }; });
      return n;
    });
    toast.success(`License "${license}" applied to ${checkedFiles.size} file(s)!`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/10 p-3">
      <span className="text-xs font-bold text-white whitespace-nowrap">
        {checkedFiles.size} selected
      </span>

      {/* Category */}
      <select
        value={bulkCategory}
        onChange={e => { setBulkCategory(e.target.value); setBulkSubcategory(""); }}
        className="h-8 flex-1 min-w-[120px] rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-gray-300 outline-none focus:border-[#00D4FF]"
      >
        <option value="">Category…</option>
        {parentCategoriesComputed?.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Subcategory */}
      {bulkSubCats?.length > 0 && (
        <select
          value={bulkSubcategory}
          onChange={e => setBulkSubcategory(e.target.value)}
          className="h-8 flex-1 min-w-[120px] rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-gray-300 outline-none focus:border-[#00D4FF]"
        >
          <option value="">Subcategory (opt)…</option>
          {bulkSubCats.map(sc => (
            <option key={sc.id} value={sc.id}>{sc.name}</option>
          ))}
        </select>
      )}

      {/* Apply Category */}
      <button
        type="button"
        onClick={applyBulkCategory}
        className="h-8 rounded-lg bg-[#00D4FF] px-3 text-xs font-bold text-black hover:opacity-90 transition-opacity"
      >
        Apply Cat
      </button>

      {/* Quick License Badges */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => applyBulkLicense("free")}
          className="h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-gray-300 hover:border-white/30 hover:text-white"
        >
          Free
        </button>
        <button
          type="button"
          onClick={() => applyBulkLicense("premium")}
          className="h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
        >
          ★ Premium
        </button>
      </div>

      {/* Bulk AI Fill Trigger */}
      <button
        type="button"
        onClick={generateBulkAIMetadata}
        disabled={isGeneratingAI}
        title="Generate SEO Title, Description, 45-49 Tags & Category using Gemini AI for all selected files"
        className="h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-3 text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
      >
        {isGeneratingAI ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>AI Generating...</span>
          </>
        ) : (
          <>
            <Sparkles size={13} />
            <span>✨ Bulk AI Fill</span>
          </>
        )}
      </button>

      {/* Spreadsheet Edit Modal Trigger */}
      <button
        type="button"
        onClick={() => setShowBulkEditModal(true)}
        className="h-8 rounded-lg border border-[#00D4FF]/40 bg-[#00D4FF]/20 px-3 text-xs font-bold text-[#00D4FF] hover:bg-[#00D4FF]/30 transition-colors flex items-center gap-1.5"
      >
        📑 Spreadsheet Edit
      </button>

      {/* Bulk Delete */}
      <button
        type="button"
        onClick={handleBulkDelete}
        className="h-8 rounded-lg bg-red-500/10 border border-red-500/20 px-3 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors ml-auto"
      >
        Delete ({checkedFiles.size})
      </button>
    </div>
  );
};

export default BulkBar;
