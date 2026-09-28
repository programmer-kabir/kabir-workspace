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

  // Edit checked files, or all files if none checked
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
      <div className="w-full max-w-7xl h-[85vh] rounded-2xl border border-white/10 bg-[#0F0F1A] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-black/20">
          <div>
            <h2 className="text-lg font-bold text-white">Bulk Edit Spreadsheet</h2>
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
              <tr>
                <th className="bg-[#0F0F1A] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 border-b border-white/10 w-20">Preview</th>
                <th className="bg-[#0F0F1A] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 border-b border-white/10 w-48">Filename</th>
                <th className="bg-[#0F0F1A] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 border-b border-white/10">Title & Desc</th>
                <th className="bg-[#0F0F1A] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 border-b border-white/10 w-40">Classification</th>
                <th className="bg-[#0F0F1A] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 border-b border-white/10 w-40">Options</th>
                <th className="bg-[#0F0F1A] px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 border-b border-white/10">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filesToEdit.map(file => {
                const meta = filesMetadata[file.name] || {};
                const ext = file.name.split(".").pop().toLowerCase();
                const tagsCount = getTagsArray(meta.tags).length;
                const categoriesForFile = subCategories?.filter(sc => String(sc.parent_id) === String(meta.category)) || [];

                return (
                  <tr key={file.name} className="hover:bg-white/5 transition-colors border-b border-white/5 group">
                    <td className="px-3 py-3">
                      <div className="h-12 w-12 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center">
                        {previews[file.name] ? (
                          <img src={previews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                        ) : (
                          <FileText size={16} className="text-gray-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[11px] font-bold text-gray-200 truncate max-w-[150px]" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase">{ext}</p>
                    </td>
                    <td className="px-3 py-3 space-y-2 align-top">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Title</label>
                        <input
                          type="text"
                          value={meta.title || ""}
                          onChange={e => updateField(file.name, "title", e.target.value)}
                          placeholder="Title..."
                          className="w-full rounded-lg border border-transparent bg-black/20 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] focus:bg-black/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Description</label>
                        <textarea
                          rows={2}
                          value={meta.description || ""}
                          onChange={e => updateField(file.name, "description", e.target.value)}
                          placeholder="Description..."
                          className="w-full rounded-lg border border-transparent bg-black/20 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] focus:bg-black/40 transition-colors resize-none custom-scrollbar"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 space-y-2 align-top">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Category</label>
                        <select
                          value={meta.category || ""}
                          onChange={e => {
                            setFilesMetadata(prev => ({
                              ...prev,
                              [file.name]: { ...prev[file.name], category: e.target.value, subcategory: "" }
                            }));
                          }}
                          className="w-full rounded-lg border border-transparent bg-black/20 px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-[#6C4FE0]"
                        >
                          <option value="">Category...</option>
                          {parentCategoriesComputed?.map(c => <option key={c.id} value={c.id} className="bg-[#0F0F1A]">{c.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Subcategory</label>
                        <select
                          value={meta.subcategory || ""}
                          onChange={e => updateField(file.name, "subcategory", e.target.value)}
                          className="w-full rounded-lg border border-transparent bg-black/20 px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-[#6C4FE0]"
                          disabled={!meta.category}
                        >
                          <option value="">Subcategory...</option>
                          {categoriesForFile?.map(sc => <option key={sc.id} value={sc.id} className="bg-[#0F0F1A]">{sc.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-3 space-y-2 align-top">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Content Type</label>
                        <select
                          value={meta.content_type || "vector"}
                          onChange={e => updateField(file.name, "content_type", e.target.value)}
                          className="w-full rounded-lg border border-transparent bg-black/20 px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-[#6C4FE0]"
                        >
                          <option value="vector" className="bg-[#0F0F1A]">Vector</option>
                          <option value="photo" className="bg-[#0F0F1A]">Photo</option>
                          <option value="png" className="bg-[#0F0F1A]">PNG/PSD</option>
                          <option value="video" className="bg-[#0F0F1A]">Video</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">License Type</label>
                        <select
                          value={meta.license || "free"}
                          onChange={e => updateField(file.name, "license", e.target.value)}
                          className="w-full rounded-lg border border-transparent bg-black/20 px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-[#6C4FE0]"
                        >
                          <option value="free" className="bg-[#0F0F1A]">Free License</option>
                          <option value="premium" className="bg-[#0F0F1A]">Premium</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">AI Generated?</label>
                        <select
                          value={meta.aiGenerated || "no"}
                          onChange={e => updateField(file.name, "aiGenerated", e.target.value)}
                          className="w-full rounded-lg border border-transparent bg-black/20 px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-[#6C4FE0]"
                        >
                          <option value="no" className="bg-[#0F0F1A]">Not AI Generated</option>
                          <option value="yes" className="bg-[#0F0F1A]">AI Generated</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Tags (comma separated)</label>
                        <textarea
                        rows={2}
                        value={meta.tags || ""}
                        onChange={e => {
                          const arr = [...new Set(e.target.value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean))];
                          if (arr.length > MAX_TAGS) return;
                          updateField(file.name, "tags", e.target.value);
                        }}
                        placeholder="Tags separated by commas..."
                        className="w-full rounded-lg border border-transparent bg-black/20 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] focus:bg-black/40 transition-colors resize-none custom-scrollbar"
                      />
                      <p className={`text-[9px] mt-1 text-right font-bold ${tagsCount < 5 ? "text-red-400" : "text-green-400"}`}>
                        {tagsCount}/50 tags
                      </p>
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 flex justify-end bg-black/20">
          <button
            onClick={() => setShowBulkEditModal(false)}
            className="rounded-xl bg-[#6C4FE0] px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#5a3dd6] transition-colors"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;
