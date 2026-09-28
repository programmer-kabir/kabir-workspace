import { FileText, X, RefreshCw, PlayCircle } from "lucide-react";
import { useUpload } from "./UploadContext";

const FileCard = ({ file, index }) => {
  const {
    activeFileIndex, setActiveFileIndex,
    filesMetadata, previews, draftIds, fileProgress,
    checkedFiles, setCheckedFiles,
    dragOverIndex,
    mainExtensions, previewExtensions, SIZE_WARN_MB,
    selectedFiles, getBaseName, getMetadataStatus,
    handleRemoveFile, retryFile,
    handleCardDragStart, handleCardDragOver, handleCardDrop, handleCardDragEnd,
    pairedPreviews, groupedMainFiles
  } = useUpload();

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
  const isNearMax = sizeMB >= 75;

  // Missing preview warning (non-SVG main file without paired JPG/PNG)
  const isMainFile = mainExtensions.includes(ext);
  const hasPairedPreview = isMainFile
    ? Boolean(previews[file.name]) || selectedFiles.some(
      f => previewExtensions.includes(f.name.split(".").pop().toLowerCase())
        && getBaseName(f.name) === getBaseName(file.name)
    ) || ext === "svg"
    : true;

  const handleClick = () => {
    // Always activate this card's own index so MetadataForm shows
    // THIS file's metadata (including category/subcategory)
    setActiveFileIndex(index);
  };

  return (
    <div
      draggable
      onDragStart={e => handleCardDragStart(e, index)}
      onDragOver={e => handleCardDragOver(e, index)}
      onDrop={e => handleCardDrop(e, index)}
      onDragEnd={handleCardDragEnd}
      onClick={handleClick}
      className={`group relative flex aspect-square cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-white/5 p-3 transition-all duration-300 ${isDragOver
          ? "border-[#6C4FE0] scale-105 bg-[#6C4FE0]/10 shadow-xl shadow-[#6C4FE0]/20"
          : isChecked
            ? "border-[#6C4FE0] bg-[#6C4FE0]/10 shadow-lg shadow-[#6C4FE0]/10"
            : isActive
              ? "border-[#6C4FE0] bg-[#6C4FE0]/5 shadow-lg shadow-[#6C4FE0]/10 scale-[1.02]"
              : "border-white/10 hover:border-white/20"
        }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setCheckedFiles(prev => {
            const n = new Set(prev);
            n.has(file.name) ? n.delete(file.name) : n.add(file.name);
            return n;
          });
        }}
        className={`absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${isChecked ? "border-[#6C4FE0] bg-[#6C4FE0]" : "border-white/30 bg-black/40 opacity-0 group-hover:opacity-100"
          }`}
      >
        {isChecked && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-2.5 h-2.5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>

      {/* Thumbnail */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/20">
        {previews[file.name] ? (
          <>
            <img src={previews[file.name]} alt={file.name} className={`h-full w-full ${ext === 'svg' ? 'object-contain p-2' : 'object-cover'}`} />
            {["mp4", "mov", "webm"].includes(ext) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <PlayCircle size={32} className="text-white opacity-80 shadow-sm rounded-full" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-gray-500">
            <FileText size={24} className={ext === "zip" ? "text-amber-500" : "text-[#6C4FE0]"} />
            <span className="mt-1 text-[10px] uppercase font-bold tracking-wider">{ext}</span>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 rounded-xl">
            <div className="w-[80%] bg-white/20 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#6C4FE0] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white">{progress}%</span>
            <span className="text-[9px] text-gray-300 mt-0.5">⏳ Uploading…</span>
          </div>
        )}

        {/* Draft Saved Badge */}
        {isDraftSaved && (
          <div className="absolute bottom-1 right-1">
            <span className="flex items-center gap-0.5 rounded-full bg-green-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
              ✅ Draft Saved
            </span>
          </div>
        )}

        {/* Error Badge + Retry */}
        {isError && (
          <div className="absolute bottom-1 right-1 flex items-center gap-1">
            <span className="flex items-center gap-0.5 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
              ❌ Failed
            </span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); retryFile(file.name); }}
              className="flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow hover:bg-amber-400 transition-colors"
              title="Retry upload"
            >
              <RefreshCw size={8} /> Retry
            </button>
          </div>
        )}

        {/* File Size Warning */}
        {isLarge && (
          <div className="absolute top-1.5 right-1.5">
            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white shadow ${isNearMax ? "bg-red-500/90" : "bg-orange-500/90"}`}>
              {isNearMax ? "🔴 Near Max" : "⚠ Large"}
            </span>
          </div>
        )}

        {/* Missing Preview Warning */}
        {!hasPairedPreview && (
          <div className="absolute top-1.5 left-1.5">
            <span className="rounded-full bg-amber-600/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow" title="No preview JPG/PNG found for this file">
              ⚠ No Preview
            </span>
          </div>
        )}

        {/* Metadata Completion (top-left, only when no "no preview" warning) */}
        {hasPairedPreview && (
          <div className="absolute top-1.5 left-1.5">
            {isComplete ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-2.5 h-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-md" title={message}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-2.5 h-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Details & Delete */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold text-white" title={file.name}>
            {file.name}
            {(() => {
              const base = getBaseName(file.name);
              const grouped = groupedMainFiles[base] || [];
              const groupNames = grouped.filter(f => f.name !== file.name).map(f => f.name.split('.').pop().toUpperCase());
              const preview = file.pairedPreview || pairedPreviews[base];
              const labels = [...groupNames, preview ? preview.name.split('.').pop().toUpperCase() : null].filter(Boolean);
              return labels.length > 0 ? (
                <span className="text-gray-400 font-normal"> + {labels.join(', ')}</span>
              ) : null;
            })()}
          </p>
          <p className="text-[9px] text-gray-500">
            {meta.title && <span className="block truncate text-gray-300 mb-0.5">{meta.title}</span>}
            {sizeMB < 0.01 ? "Remote" : `${sizeMB.toFixed(2)} MB`}
          </p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); handleRemoveFile(index); }}
          className="rounded-lg bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Remove file"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default FileCard;
