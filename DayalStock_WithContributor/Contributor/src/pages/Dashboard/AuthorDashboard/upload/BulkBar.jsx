import { toast } from "react-toastify";
import { useUpload } from "./UploadContext";

const BulkBar = ({ compact = false }) => {
  const {
    checkedFiles, setCheckedFiles,
    bulkCategory, setBulkCategory,
    bulkSubcategory, setBulkSubcategory,
    parentCategoriesComputed, categories,
    filesMetadata, setFilesMetadata,
    handleBulkDelete, exportCSV,
    selectedFiles, setShowBulkEditModal,
  } = useUpload();

  if (checkedFiles.size === 0) return null;
  if (compact) return (
    <div className="text-[9px] font-bold text-[#b9aaff] bg-[#6C4FE0]/10 rounded-lg px-2 py-1">
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
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#6C4FE0]/40 bg-[#6C4FE0]/10 p-3">
      <span className="text-xs font-bold text-white whitespace-nowrap">
        {checkedFiles.size} selected
      </span>

      {/* Category */}
      <select
        value={bulkCategory}
        onChange={e => { setBulkCategory(e.target.value); setBulkSubcategory(""); }}
        className="h-8 flex-1 min-w-[110px] rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-gray-300 outline-none focus:border-[#6C4FE0]"
      >
        <option value="">Category…</option>
        {parentCategoriesComputed?.map(c => <option key={c.id} value={c.id} className="bg-[#0F0F1A]">{c.name}</option>)}
      </select>

      {/* Subcategory */}
      {bulkCategory && bulkSubCats?.length > 0 && (
        <select
          value={bulkSubcategory}
          onChange={e => setBulkSubcategory(e.target.value)}
          className="h-8 flex-1 min-w-[110px] rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-gray-300 outline-none focus:border-[#6C4FE0]"
        >
          <option value="">Subcategory…</option>
          {bulkSubCats.map(sc => <option key={sc.id} value={sc.id} className="bg-[#0F0F1A]">{sc.name}</option>)}
        </select>
      )}

      <button
        type="button"
        disabled={!bulkCategory}
        onClick={applyBulkCategory}
        className="h-8 rounded-lg bg-[#6C4FE0] px-3 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        Apply Category
      </button>

      {/* Bulk License */}
      <select
        defaultValue=""
        onChange={e => { if (e.target.value) applyBulkLicense(e.target.value); e.target.value = ""; }}
        className="h-8 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-gray-300 outline-none focus:border-[#6C4FE0]"
      >
        <option value="">License…</option>
        <option value="free" className="bg-[#0F0F1A]">Free</option>
        <option value="premium" className="bg-[#0F0F1A]">Premium</option>
      </select>

      {/* Bulk Edit Modal Trigger */}
      <button
        type="button"
        onClick={() => setShowBulkEditModal(true)}
        className="h-8 rounded-lg border border-[#6C4FE0]/50 bg-[#6C4FE0]/20 px-3 text-xs font-bold text-[#b9aaff] hover:bg-[#6C4FE0]/30 transition-colors"
        title="Open Spreadsheet Editor for selected files"
      >
        📝 Bulk Edit
      </button>

      {/* Bulk Delete */}
      <button
        type="button"
        onClick={handleBulkDelete}
        className="h-8 rounded-lg bg-red-500/20 border border-red-500/30 px-3 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
      >
        🗑 Delete
      </button>

      {/* Cancel */}
      <button
        type="button"
        onClick={() => { setCheckedFiles(new Set()); setBulkCategory(""); setBulkSubcategory(""); }}
        className="h-8 rounded-lg border border-white/10 px-3 text-xs font-bold text-gray-400 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default BulkBar;
