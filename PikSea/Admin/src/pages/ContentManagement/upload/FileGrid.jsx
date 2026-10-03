import { useState, useMemo, useEffect } from "react";
import { Upload, FileSpreadsheet, HelpCircle, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useUpload } from "./UploadContext";
import FileCard from "./FileCard";
import BulkBar from "./BulkBar";

const FileGrid = () => {
  const {
    selectedFiles, checkedFiles, setCheckedFiles,
    filesMetadata, activeFileIndex, setActiveFileIndex,
    getMetadataStatus, handleCsvUpload, exportCSV,
    draftIds,
  } = useUpload();

  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  const countableExts = ["jpg", "jpeg", "png", "webp"];
  const countable = selectedFiles.filter(f => countableExts.includes(f.name.split(".").pop().toLowerCase()));
  const readyCount = countable.filter(f => getMetadataStatus(filesMetadata[f.name] || {}).isComplete).length;
  const errorCount = countable.length - readyCount;

  const uploadingCount = selectedFiles.filter(f => draftIds[f.name] === "uploading").length;
  const draftSavedCount = selectedFiles.filter(f => draftIds[f.name] && draftIds[f.name] !== "uploading" && draftIds[f.name] !== "error").length;
  const failedCount = selectedFiles.filter(f => draftIds[f.name] === "error").length;

  const totalPages = Math.max(1, Math.ceil(selectedFiles.length / pageSize));

  // Keep currentPage within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // If activeFileIndex changes outside current page, sync current page
  useEffect(() => {
    if (activeFileIndex >= 0 && selectedFiles.length > 0) {
      const targetPage = Math.floor(activeFileIndex / pageSize) + 1;
      if (targetPage !== currentPage && targetPage <= totalPages) {
        setCurrentPage(targetPage);
      }
    }
  }, [activeFileIndex, pageSize, totalPages]);

  const pagedFiles = useMemo(() => {
    if (pageSize >= 9999) return selectedFiles.map((file, originalIndex) => ({ file, originalIndex }));
    const start = (currentPage - 1) * pageSize;
    return selectedFiles.slice(start, start + pageSize).map((file, idx) => ({
      file,
      originalIndex: start + idx,
    }));
  }, [selectedFiles, currentPage, pageSize]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* Status Summary Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit flex items-center gap-1.5">
            <Layers size={16} className="text-[#00D4FF]" />
            Files Queue ({selectedFiles.length})
          </h3>
          {/* Select All */}
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (checkedFiles.size === selectedFiles.length) setCheckedFiles(new Set());
                else setCheckedFiles(new Set(selectedFiles.map(f => f.name)));
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
            >
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border-2 transition-colors ${checkedFiles.size === selectedFiles.length ? "border-[#00D4FF] bg-[#00D4FF]" : "border-white/30"}`}>
                {checkedFiles.size === selectedFiles.length && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-2 h-2 text-black">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              {checkedFiles.size === selectedFiles.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        {/* Right: status badges + tools */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {uploadingCount > 0 && <span className="text-blue-400">⏳ {uploadingCount} uploading</span>}
          {draftSavedCount > 0 && <span className="text-[#00D4FF]">✅ {draftSavedCount} ready</span>}
          {failedCount > 0 && <span className="text-red-400">❌ {failedCount} failed</span>}
          {selectedFiles.length > 0 && (
            <>
              <span className="text-white/20">|</span>
              <span className="text-emerald-400">✅ Ready: {readyCount}</span>
              <span className="text-white/20">|</span>
              <span className="text-amber-400">⚠ Incomplete: {errorCount}</span>
            </>
          )}
          {/* CSV tools */}
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex items-center gap-1.5 bg-[#121824] hover:bg-[#1C2538] border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors"
          >
            <FileSpreadsheet size={12} className="text-[#00D4FF]" />
            Import CSV
          </label>
          <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleCsvUpload} />
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 bg-[#121824] hover:bg-[#1C2538] border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors"
            >
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkBar />

      {/* Pagination Controls Bar (if more than 24 items) */}
      {selectedFiles.length > 24 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-gray-400 font-medium">
            <span>Showing</span>
            <span className="text-white font-bold">
              {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, selectedFiles.length)}
            </span>
            <span>of</span>
            <span className="text-white font-bold">{selectedFiles.length}</span>
            <span>assets</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Size selector */}
            <div className="flex items-center gap-1 mr-2">
              <span className="text-gray-400 text-[11px]">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-white/10 bg-[#121824] px-2 py-1 text-[11px] font-bold text-white focus:outline-none focus:border-[#00D4FF]"
              >
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
                <option value={9999}>All ({selectedFiles.length})</option>
              </select>
            </div>

            {/* Pagination buttons */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="text-[11px] font-bold text-gray-300 px-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pagedFiles.map(({ file, originalIndex }) => (
          <FileCard key={file.name + "-" + originalIndex} file={file} index={originalIndex} />
        ))}

        {/* Add More Card */}
        <label
          htmlFor="file-upload"
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-4 text-center hover:border-[#00D4FF] hover:bg-[#00D4FF]/5 transition-all duration-300"
        >
          <Upload size={24} className="text-gray-400 mb-1" />
          <span className="text-[10px] font-bold text-gray-400">Add Assets</span>
        </label>
      </div>

      {/* Technical Guidelines */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white font-outfit">
          <HelpCircle size={16} className="text-[#00D4FF]" />
          <span>Upload Queue Guidelines</span>
        </h3>
        <ul className="mt-3 list-disc pl-5 text-xs text-gray-400 space-y-1.5 font-medium">
          <li>Supports bulk multi-format selection (Vectors, Photos, Videos, ZIP packs).</li>
          <li>Optimized for fast concurrent batch processing (100+ assets supported with zero lag).</li>
          <li>Click any item to inspect and fine-tune tags, category, license, and pricing.</li>
          <li>Use <strong>Import CSV</strong> or <strong>Auto Metadata</strong> to fill title, description, and keywords in seconds.</li>
        </ul>
      </div>
    </div>
  );
};

export default FileGrid;
