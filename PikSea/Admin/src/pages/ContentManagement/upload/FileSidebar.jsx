import { Upload, FileSpreadsheet, FileText, X, RefreshCw } from "lucide-react";
import { useUpload } from "./UploadContext";
import BulkBar from "./BulkBar";

const FileSidebar = () => {
  const {
    selectedFiles, activeFileIndex, setActiveFileIndex,
    filesMetadata, previews, draftIds, fileProgress,
    checkedFiles, setCheckedFiles,
    dragOverIndex,
    mainExtensions, previewExtensions, SIZE_WARN_MB,
    getBaseName, getMetadataStatus,
    handleRemoveFile, retryFile, handleCsvUpload, exportCSV,
    handleCardDragStart, handleCardDragOver, handleCardDrop, handleCardDragEnd,
    handleFileChange,
  } = useUpload();

  const countableExts = ["jpg", "jpeg", "png", "webp"];
  const countable = selectedFiles.filter(f => countableExts.includes(f.name.split(".").pop().toLowerCase()));
  const readyCount = countable.filter(f => getMetadataStatus(filesMetadata[f.name] || {}).isComplete).length;
  const uploadingCount = selectedFiles.filter(f => draftIds[f.name] === "uploading").length;
  const failedCount = selectedFiles.filter(f => draftIds[f.name] === "error").length;
  const draftCount = selectedFiles.filter(f => draftIds[f.name] && draftIds[f.name] !== "uploading" && draftIds[f.name] !== "error").length;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

      {/* Top: Status Bar */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-outfit">
            Queue ({selectedFiles.length})
          </span>
          {/* Select All */}
          <button
            type="button"
            onClick={() => {
              if (checkedFiles.size === selectedFiles.length) setCheckedFiles(new Set());
              else setCheckedFiles(new Set(selectedFiles.map(f => f.name)));
            }}
            className="text-[9px] font-bold text-gray-400 hover:text-white transition-colors"
          >
            {checkedFiles.size === selectedFiles.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Mini status pills */}
        <div className="flex flex-wrap gap-1">
          {uploadingCount > 0 && <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 rounded-full px-1.5 py-0.5">⏳ {uploadingCount}</span>}
          {draftCount > 0 && <span className="text-[9px] font-bold text-[#00D4FF] bg-[#00D4FF]/10 rounded-full px-1.5 py-0.5">✅ {draftCount}</span>}
          {failedCount > 0 && <span className="text-[9px] font-bold text-red-400 bg-red-400/10 rounded-full px-1.5 py-0.5">❌ {failedCount}</span>}
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 rounded-full px-1.5 py-0.5">Ready: {readyCount}</span>
        </div>

        {/* CSV tools */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="csv-upload" className="flex-1 cursor-pointer flex items-center justify-center gap-1 bg-black/30 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-gray-300 transition-colors">
            <FileSpreadsheet size={10} className="text-[#00D4FF]" /> Import CSV
          </label>
          <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleCsvUpload} />
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="cursor-pointer flex items-center justify-center gap-1 bg-black/30 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-gray-300 transition-colors"
            >
              📥 CSV
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar inside sidebar */}
      <BulkBar compact />

      {/* Vertical File List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 p-2 space-y-1">
        {selectedFiles.map((file, index) => {
          const ext = file.name.split(".").pop().toLowerCase();
          const meta = filesMetadata[file.name] || {};
          const { isComplete, message } = getMetadataStatus(meta);
          const isActive = index === activeFileIndex;
          const isChecked = checkedFiles.has(file.name);
          const isDragOver = dragOverIndex === index;
          const draftStatus = draftIds[file.name];
          const progress = fileProgress[file.name] ?? 0;
          const isUploading = draftStatus === "uploading";
          const isError = draftStatus === "error";
          const isDraftSaved = draftStatus && !isUploading && !isError;
          const sizeMB = file.size / (1024 * 1024);
          const isLarge = sizeMB >= SIZE_WARN_MB;
          const isMainFile = mainExtensions.includes(ext);
          const hasPairedPreview = isMainFile
            ? Boolean(previews[file.name]) || selectedFiles.some(
              f => previewExtensions.includes(f.name.split(".").pop().toLowerCase())
                && getBaseName(f.name) === getBaseName(file.name)
            ) || ext === "svg" || ["mp4", "mov", "webm"].includes(ext)
            : true;

          return (
            <div
              key={file.name + "-" + index}
              draggable
              onDragStart={e => handleCardDragStart(e, index)}
              onDragOver={e => handleCardDragOver(e, index)}
              onDrop={e => handleCardDrop(e, index)}
              onDragEnd={handleCardDragEnd}
              onClick={() => setActiveFileIndex(index)}
              className={`group flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                isDragOver
                  ? "bg-[#00D4FF]/20 border border-[#00D4FF]"
                  : isActive
                    ? "bg-[#00D4FF]/10 border border-[#00D4FF]/40 shadow-sm"
                    : isChecked
                      ? "bg-white/10"
                      : "hover:bg-white/5"
              }`}
            >
              {/* Mini checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={e => {
                  e.stopPropagation();
                  setCheckedFiles(prev => {
                    const n = new Set(prev);
                    n.has(file.name) ? n.delete(file.name) : n.add(file.name);
                    return n;
                  });
                }}
                className="rounded border-white/30 text-[#00D4FF] focus:ring-0 cursor-pointer h-3.5 w-3.5"
              />

              {/* Mini Thumbnail */}
              <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center">
                {previews[file.name] ? (
                  <img src={previews[file.name]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileText size={16} className="text-gray-500" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{progress}%</span>
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white truncate" title={file.name}>
                  {meta.title || file.name}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                  <span className="uppercase font-bold">{ext}</span>
                  <span>•</span>
                  <span>{sizeMB < 0.01 ? "Draft" : `${sizeMB.toFixed(1)}MB`}</span>
                  {isDraftSaved && <span className="text-[#00D4FF] font-bold">● Ready</span>}
                  {isError && <span className="text-red-400 font-bold">● Error</span>}
                  {!hasPairedPreview && !isUploading && <span className="text-amber-400 font-bold">⚠ No preview</span>}
                  {isLarge && <span className="text-orange-400">⚠ Large</span>}
                </div>
              </div>

              {/* Status icon / Retry / Remove */}
              <div className="flex items-center gap-1 shrink-0">
                {isComplete ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-400" title="Complete" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-400" title={message} />
                )}
                {isError && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); retryFile(file.name); }}
                    className="p-1 text-red-400 hover:text-white"
                  >
                    <RefreshCw size={10} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleRemoveFile(index); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Add more button */}
      <div className="p-2 border-t border-white/10 shrink-0">
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-white/20 hover:border-[#00D4FF] hover:bg-[#00D4FF]/5 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer transition-all"
        >
          <Upload size={12} /> Add More Files
        </label>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.webp"
          multiple
        />
      </div>

    </div>
  );
};

export default FileSidebar;
