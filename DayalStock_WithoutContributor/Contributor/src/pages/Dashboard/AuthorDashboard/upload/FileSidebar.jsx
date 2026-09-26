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
    handleFileChange, draftIds: di,
  } = useUpload();

  const countableExts = ["jpg","jpeg","png","webp","svg"];
  const countable      = selectedFiles.filter(f => countableExts.includes(f.name.split(".").pop().toLowerCase()));
  const readyCount     = countable.filter(f => getMetadataStatus(filesMetadata[f.name] || {}).isComplete).length;
  const uploadingCount = selectedFiles.filter(f => draftIds[f.name] === "uploading").length;
  const failedCount    = selectedFiles.filter(f => draftIds[f.name] === "error").length;
  const draftCount     = selectedFiles.filter(f => draftIds[f.name] && draftIds[f.name] !== "uploading" && draftIds[f.name] !== "error").length;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

      {/* ── Top: Status Bar ───────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
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
          {draftCount     > 0 && <span className="text-[9px] font-bold text-green-400 bg-green-400/10 rounded-full px-1.5 py-0.5">✅ {draftCount}</span>}
          {failedCount    > 0 && <span className="text-[9px] font-bold text-red-400 bg-red-400/10 rounded-full px-1.5 py-0.5">❌ {failedCount}</span>}
          <span className="text-[9px] font-bold text-green-300 bg-green-300/10 rounded-full px-1.5 py-0.5">Ready: {readyCount}</span>
        </div>

        {/* CSV tools */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="csv-upload" className="flex-1 cursor-pointer flex items-center justify-center gap-1 bg-black/30 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-gray-300 transition-colors">
            <FileSpreadsheet size={10} className="text-[#6C4FE0]" /> Import CSV
          </label>
          <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleCsvUpload} />
          <button
            type="button"
            onClick={exportCSV}
            className="flex-1 flex items-center justify-center gap-1 bg-black/30 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-gray-300 transition-colors"
          >
            📥 Export
          </button>
        </div>

        {/* Bulk Bar (when files selected) */}
        <BulkBar compact />
      </div>

      {/* ── File List (scrollable) ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1.5">
        {selectedFiles.map((file, index) => {
          const ext          = file.name.split(".").pop().toLowerCase();
          const meta         = filesMetadata[file.name] || {};
          const { isComplete, message } = getMetadataStatus(meta);
          const isActive     = index === activeFileIndex;
          const isChecked    = checkedFiles.has(file.name);
          const isDragOver   = dragOverIndex === index;
          const draftStatus  = draftIds[file.name];
          const progress     = fileProgress[file.name] ?? 0;
          const isUploading  = draftStatus === "uploading";
          const isError      = draftStatus === "error";
          const isDraftSaved = draftStatus && !isUploading && !isError;
          const sizeMB       = file.size / (1024 * 1024);
          const isLarge      = sizeMB >= SIZE_WARN_MB;
          const isMainFile   = mainExtensions.includes(ext);
          const hasPaired    = isMainFile
            ? selectedFiles.some(f => previewExtensions.includes(f.name.split(".").pop().toLowerCase()) && getBaseName(f.name) === getBaseName(file.name)) || ext === "svg"
            : true;

          const handleClick = () => {
            if (isMainFile) {
              const idx = selectedFiles.findIndex(f => previewExtensions.includes(f.name.split(".").pop().toLowerCase()) && getBaseName(f.name) === getBaseName(file.name));
              if (idx !== -1) { setActiveFileIndex(idx); return; }
            }
            setActiveFileIndex(index);
          };

          return (
            <div
              key={file.name + index}
              draggable
              onDragStart={e => handleCardDragStart(e, index)}
              onDragOver={e => handleCardDragOver(e, index)}
              onDrop={e => handleCardDrop(e, index)}
              onDragEnd={handleCardDragEnd}
              onClick={handleClick}
              className={`group relative flex items-center gap-2.5 rounded-xl border p-2 cursor-pointer transition-all duration-200 ${
                isDragOver  ? "border-[#6C4FE0] scale-[1.02] bg-[#6C4FE0]/15 shadow-lg"
                : isChecked ? "border-[#6C4FE0] bg-[#6C4FE0]/10"
                : isActive  ? "border-[#6C4FE0] bg-[#6C4FE0]/8 shadow-md"
                : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setCheckedFiles(prev => { const n = new Set(prev); n.has(file.name) ? n.delete(file.name) : n.add(file.name); return n; }); }}
                className={`shrink-0 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${isChecked ? "border-[#6C4FE0] bg-[#6C4FE0]" : "border-white/20 opacity-0 group-hover:opacity-100"}`}
              >
                {isChecked && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-2 h-2 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              </button>

              {/* Thumbnail */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/30">
                {previews[file.name] ? (
                  <img src={previews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText size={14} className={ext === "zip" ? "text-amber-500" : "text-[#6C4FE0]"} />
                  </div>
                )}
                {/* Progress mini overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                    <span className="text-[8px] font-bold text-white">{progress}%</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-white leading-tight" title={file.name}>{file.name}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  {/* Status */}
                  {isUploading  && <span className="text-[8px] text-blue-400">⏳ {progress}%</span>}
                  {isDraftSaved && <span className="text-[8px] text-green-400">✅ Draft</span>}
                  {isError      && (
                    <button type="button" onClick={e => { e.stopPropagation(); retryFile(file.name); }}
                      className="flex items-center gap-0.5 text-[8px] text-amber-400 hover:text-amber-300">
                      <RefreshCw size={7} />Retry
                    </button>
                  )}
                  {!isUploading && !isDraftSaved && !isError && (
                    <span className={`text-[8px] ${isComplete ? "text-green-400" : "text-amber-400"}`} title={message}>
                      {isComplete ? "✅ Ready" : "⚠ Incomplete"}
                    </span>
                  )}
                  {isLarge && <span className="text-[8px] text-orange-400">⚠ Large</span>}
                  {!hasPaired && <span className="text-[8px] text-red-400">No Preview</span>}
                </div>
                {/* Upload progress bar */}
                {isUploading && (
                  <div className="mt-1 w-full bg-white/10 rounded-full h-0.5 overflow-hidden">
                    <div className="h-full bg-[#6C4FE0] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemoveFile(index); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 rounded-md bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Add Files button ──────────────────────────────────────── */}
      <div className="shrink-0 p-2 border-t border-white/10">
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/3 py-2.5 text-[10px] font-bold text-gray-400 hover:border-[#6C4FE0] hover:text-white transition-all duration-200"
        >
          <Upload size={12} /> Add Files
        </label>
        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept=".svg,.eps,.ai,.psd,.jpg,.jpeg,.png,.webp,.zip" multiple />
      </div>
    </div>
  );
};

export default FileSidebar;
