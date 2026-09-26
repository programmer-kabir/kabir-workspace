import { Upload, FileSpreadsheet, HelpCircle } from "lucide-react";
import { useUpload } from "./UploadContext";
import FileCard from "./FileCard";
import BulkBar from "./BulkBar";

const FileGrid = () => {
  const {
    selectedFiles, checkedFiles, setCheckedFiles,
    activeFileIndex, filesMetadata,
    getMetadataStatus, handleCsvUpload, exportCSV,
    draftIds,
  } = useUpload();

  // Count files that "own" metadata
  const countableExts = ["jpg","jpeg","png","webp","svg"];
  const countable = selectedFiles.filter(f => countableExts.includes(f.name.split(".").pop().toLowerCase()));
  const readyCount = countable.filter(f => getMetadataStatus(filesMetadata[f.name] || {}).isComplete).length;
  const errorCount = countable.length - readyCount;

  // Count upload states
  const uploadingCount = selectedFiles.filter(f => draftIds[f.name] === "uploading").length;
  const draftSavedCount = selectedFiles.filter(f => draftIds[f.name] && draftIds[f.name] !== "uploading" && draftIds[f.name] !== "error").length;
  const failedCount = selectedFiles.filter(f => draftIds[f.name] === "error").length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* Status Summary Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
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
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border-2 transition-colors ${checkedFiles.size === selectedFiles.length ? "border-[#6C4FE0] bg-[#6C4FE0]" : "border-white/30"}`}>
                {checkedFiles.size === selectedFiles.length && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-2 h-2 text-white">
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
          {draftSavedCount > 0 && <span className="text-green-400">✅ {draftSavedCount} draft</span>}
          {failedCount > 0 && <span className="text-red-400">❌ {failedCount} failed</span>}
          {selectedFiles.length > 0 && (
            <>
              <span className="text-white/20">|</span>
              <span className="text-green-400">✅ Ready: {readyCount}</span>
              <span className="text-white/20">|</span>
              <span className="text-amber-400">⚠ Incomplete: {errorCount}</span>
            </>
          )}
          {/* CSV tools */}
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex items-center gap-1.5 bg-[#1A1A24] hover:bg-[#2A2A35] border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors"
          >
            <FileSpreadsheet size={12} className="text-[#6C4FE0]" />
            Import CSV
          </label>
          <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleCsvUpload} />
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 bg-[#1A1A24] hover:bg-[#2A2A35] border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors"
            >
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkBar />

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {selectedFiles.map((file, index) => (
          <FileCard key={file.name + "-" + index} file={file} index={index} />
        ))}

        {/* Add More Card */}
        <label
          htmlFor="file-upload"
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-4 text-center hover:border-[#6C4FE0] hover:bg-[#6C4FE0]/5 transition-all duration-300"
        >
          <Upload size={24} className="text-gray-400 mb-1" />
          <span className="text-[10px] font-bold text-gray-400">Add Files</span>
        </label>
      </div>

      {/* Technical Guidelines */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <HelpCircle size={16} className="text-[#6C4FE0]" />
          <span>Technical Guidelines</span>
        </h3>
        <ul className="mt-3 list-disc pl-5 text-xs text-gray-400 space-y-1.5 font-medium">
          <li>Vectors must be in <strong>EPS or SVG</strong> format. Always group layers.</li>
          <li>Photos must be high quality <strong>JPEG</strong>, minimum 4 MP resolution.</li>
          <li>All metadata (titles, tags) must be written in <strong>English</strong>.</li>
          <li>Drag cards to <strong>reorder</strong> the upload queue.</li>
        </ul>
      </div>
    </div>
  );
};

export default FileGrid;
