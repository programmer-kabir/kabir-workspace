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

  const isMainFile = mainExtensions.includes(ext);
  const isVideo = ["mp4", "mov", "webm"].includes(ext);
  const hasPairedPreview = isMainFile
    ? Boolean(previews[file.name]) || selectedFiles.some(
      f => previewExtensions.includes(f.name.split(".").pop().toLowerCase())
        && getBaseName(f.name) === getBaseName(file.name)
    ) || ext === "svg" || isVideo
    : true;

  const handleClick = () => {
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
        ? "border-[#00D4FF] scale-105 bg-[#00D4FF]/10 shadow-xl shadow-[#00D4FF]/20"
        : isChecked
          ? "border-[#00D4FF] bg-[#00D4FF]/10 shadow-lg shadow-[#00D4FF]/10"
          : isActive
            ? "border-[#00D4FF] bg-[#00D4FF]/5 shadow-lg shadow-[#00D4FF]/10 scale-[1.02]"
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
        className={`absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${isChecked ? "border-[#00D4FF] bg-[#00D4FF]" : "border-white/30 bg-black/40 opacity-0 group-hover:opacity-100"
          }`}
      >
        {isChecked && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-2.5 h-2.5 text-black">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>

      {/* Thumbnail */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/20">
        {previews[file.name] ? (
          <>
            <img src={previews[file.name]} alt={file.name} className="h-full w-full object-cover" />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayCircle size={28} className="text-white drop-shadow-lg opacity-80" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-gray-500">
            <FileText size={24} className="text-[#00D4FF]" />
            <span className="mt-1 text-[10px] uppercase font-bold tracking-wider">{ext}</span>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl">
            <div className="w-[80%] bg-white/20 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#00D4FF] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white">{progress}%</span>
            <span className="text-[9px] text-gray-300 mt-0.5">⏳ Processing…</span>
          </div>
        )}

        {/* Error Overlay */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-red-300 mb-1">Failed</span>
            <button
              onClick={(e) => { e.stopPropagation(); retryFile(file.name); }}
              className="flex items-center gap-1 rounded bg-red-500/30 px-2 py-1 text-[9px] font-semibold text-white hover:bg-red-500/50"
            >
              <RefreshCw size={9} /> Retry
            </button>
          </div>
        )}

        {/* Missing Preview warning */}
        {!hasPairedPreview && !isUploading && !isError && (
          <div className="absolute bottom-1 left-1 right-1 rounded bg-amber-500/90 px-1 py-0.5 text-center text-[8px] font-bold text-black">
            ⚠ Need preview image
          </div>
        )}

        {/* File Size Warning */}
        {isLarge && (
          <div className="absolute top-1.5 right-1.5">
            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white shadow ${isNearMax ? 'bg-red-500/90' : 'bg-orange-500/90'}`}>
              ⚠ {isNearMax ? 'Max limit' : 'Large'}
            </span>
          </div>
        )}

        {/* Metadata Completion Status Badge */}
        <div className="absolute top-1.5 left-1.5">
          {isComplete ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md" title="Metadata Complete">
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
      </div>

      {/* Details & Delete */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold text-white" title={file.name}>
            {file.name}
          </p>
          <p className="text-[9px] text-gray-500">
            {meta.title && <span className="block truncate text-gray-300 mb-0.5">{meta.title}</span>}
            {sizeMB < 0.01 ? "Draft" : `${sizeMB.toFixed(2)} MB`}
            {isDraftSaved && <span className="ml-1 text-[#00D4FF]">● Draft</span>}
          </p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); handleRemoveFile(index); }}
          className="rounded-lg bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Remove item"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default FileCard;
