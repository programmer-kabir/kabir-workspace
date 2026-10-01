import { useUpload } from "./UploadContext";
import { X, FileText } from "lucide-react";

const BulkEditModal = () => {
  const {
    showBulkEditModal, setShowBulkEditModal,
    checkedFiles, selectedFiles,
    filesMetadata, setFilesMetadata,
    previews, getTagsArray, MAX_TAGS,
    parentCategoriesComputed, subCategories
  } = useUpload();

  if (!showBulkEditModal) return null;

  const filesToEdit = checkedFiles.size > 0 
    ? selectedFiles.filter(f => checkedFiles.has(f.name))
    : selectedFiles;

  if (filesToEdit.length === 0) return null;

  const updateField = (filename, field, value) => {
    setFilesMetadata(prev => ({
      ...prev,
      [filename]: { ...prev[filename], [field]: value }
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl h-[85vh] rounded-2xl border border-white/10 bg-[#0c1017] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-black/30">
          <div>
            <h2 className="text-lg font-bold text-white font-outfit">Bulk Edit Spreadsheet</h2>
            <p className="text-xs text-gray-400 mt-0.5">Editing {filesToEdit.length} asset(s)</p>
          </div>
          <button
            onClick={() => setShowBulkEditModal(false)}
            className="rounded-lg bg-white/5 p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto custom-scrollbar px-4 pb-4">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-30 shadow-md">
              <tr className="border-b border-white/10 bg-[#121824] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">Preview</th>
                <th className="py-3 px-3 min-w-[200px]">File & Title</th>
                <th className="py-3 px-3 min-w-[220px]">Description</th>
                <th className="py-3 px-3 min-w-[140px]">Category</th>
                <th className="py-3 px-3 min-w-[110px]">License</th>
                <th className="py-3 px-3 min-w-[90px]">AI Gen</th>
                <th className="py-3 px-3 min-w-[100px]">Price ($)</th>
                <th className="py-3 px-3 min-w-[240px]">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {filesToEdit.map((file, idx) => {
                const meta = filesMetadata[file.name] || {};
                const tagsCount = getTagsArray(meta.tags || "").length;
                const ext = file.name.split(".").pop().toLowerCase();

                return (
                  <tr key={file.name + idx} className="hover:bg-white/[0.02] transition-colors">
                    {/* Preview Thumbnail */}
                    <td className="py-2.5 px-3 text-center align-top">
                      <div className="h-10 w-10 mx-auto rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                        {previews[file.name] ? (
                          <img src={previews[file.name]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{ext}</span>
                        )}
                      </div>
                    </td>

                    {/* File & Title */}
                    <td className="py-2.5 px-3 align-top space-y-1">
                      <span className="block text-[10px] text-gray-400 font-mono truncate max-w-[180px]" title={file.name}>
                        {file.name}
                      </span>
                      <input
                        type="text"
                        value={meta.title || ""}
                        onChange={(e) => updateField(file.name, "title", e.target.value)}
                        placeholder="Title..."
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00D4FF]"
                      />
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-3 align-top">
                      <textarea
                        rows={2}
                        value={meta.description || ""}
                        onChange={(e) => updateField(file.name, "description", e.target.value)}
                        placeholder="Description..."
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00D4FF] resize-none"
                      />
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 align-top">
                      <select
                        value={meta.category || ""}
                        onChange={(e) => updateField(file.name, "category", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]"
                      >
                        <option value="">Select…</option>
                        {parentCategoriesComputed?.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* License */}
                    <td className="py-2.5 px-3 align-top">
                      <select
                        value={meta.license || "free"}
                        onChange={(e) => updateField(file.name, "license", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="editorial">Editorial</option>
                      </select>
                    </td>

                    {/* AI Gen */}
                    <td className="py-2.5 px-3 align-top">
                      <select
                        value={meta.aiGenerated || "no"}
                        onChange={(e) => updateField(file.name, "aiGenerated", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={meta.exclusive_price || "0.00"}
                        onChange={(e) => updateField(file.name, "exclusive_price", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]"
                      />
                    </td>

                    {/* Tags */}
                    <td className="py-2.5 px-3 align-top space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={tagsCount < 5 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                          {tagsCount}/{MAX_TAGS} tags
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={meta.tags || ""}
                        onChange={(e) => updateField(file.name, "tags", e.target.value)}
                        placeholder="Tags comma separated..."
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00D4FF] resize-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/30 shrink-0">
          <span className="text-xs text-gray-400 font-medium">Changes are saved to draft automatically</span>
          <button
            type="button"
            onClick={() => setShowBulkEditModal(false)}
            className="rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-500 px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 transition-opacity"
          >
            Done Editing
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkEditModal;
