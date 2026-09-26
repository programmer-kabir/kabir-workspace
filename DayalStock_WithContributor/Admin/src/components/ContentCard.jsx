import React, { useState } from "react";
import { toast } from "react-toastify";
import { authFetch, getAuthToken } from "../api/authFetch";
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  Calendar,
  Tag,
  X,
  ZoomIn,
  Clock,
  BadgeCheck,
  FileX2,
  AlertCircle,
  Download,
  FileText,
  Image,
  Film,
  Archive,
  Maximize2,
  FileType,
  CheckSquare,
  Square
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    icon: Clock,
  },
  published: {
    label: "Published",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: BadgeCheck,
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    icon: FileX2,
  },
};

const IMG_BASE = import.meta.env.VITE_IMG_KEY;

// Admin sees the clean preview_image.
// Falls back to image_url (from content_files) if preview_image is not set.
const getAdminSrc = (content) => {
  const path = content?.preview_image || content?.image_url;
  return path ? `${IMG_BASE}/${path}` : null;
};

// Format bytes to KB/MB
const formatSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Icon for file type
const FileIcon = ({ type, size = 16 }) => {
  const t = (type || "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(t))
    return <Image size={size} />;
  if (["mp4", "mov", "avi", "webm"].includes(t)) return <Film size={size} />;
  if (["zip", "rar", "7z"].includes(t)) return <Archive size={size} />;
  if (["eps", "ai", "psd", "pdf"].includes(t)) return <FileType size={size} />;
  return <FileText size={size} />;
};

/* ──────────────────────────────────────────────── */
/*  REJECT MODAL                                    */
/* ──────────────────────────────────────────────── */
const RejectModal = ({ content, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  const [noteItems, setNoteItems] = useState([]);
  const [currentNote, setCurrentNote] = useState("");

  const addNoteItem = () => {
    if (currentNote.trim()) {
      setNoteItems([...noteItems, currentNote.trim()]);
      setCurrentNote("");
    }
  };

  const removeNoteItem = (index) => {
    setNoteItems(noteItems.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNoteItem();
    }
  };

  const handleSubmit = () => {
    // Format the note items as a bulleted string if there are any
    const formattedNote = noteItems.length > 0
      ? noteItems.map(item => `• ${item}`).join("\n")
      : "";

    onConfirm(reason, formattedNote);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-red-500/20 p-6 shadow-2xl flex flex-col max-h-[90vh]"
        style={{ background: "#12121E" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)" }}
          >
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-lg">Reject Content</h3>
            <p className="text-gray-400 text-sm truncate">
              &quot;{content?.title}&quot;
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-5">
          {/* Main Reason */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">
              Primary Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Copyright violation, low quality..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition resize-none"
            />
          </div>

          {/* Bullet List Note Editor */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium flex items-center justify-between">
              <span>Reviewer Note / Tips <span className="text-gray-500 font-normal">(optional)</span></span>
              <span className="text-xs text-[#6C4FE0] bg-[#6C4FE0]/10 px-2 py-0.5 rounded-full">List Format</span>
            </label>

            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:border-[#6C4FE0]/50 focus-within:ring-1 focus-within:ring-[#6C4FE0]/30 transition">
              {/* Bullet Items Display */}
              {noteItems.length > 0 && (
                <div className="p-3 border-b border-white/10 bg-black/20 space-y-2">
                  {noteItems.map((item, index) => (
                    <div key={index} className="flex gap-2 group">
                      <span className="text-[#6C4FE0] mt-0.5">•</span>
                      <span className="text-gray-300 text-sm flex-1 break-words">{item}</span>
                      <button
                        onClick={() => removeNoteItem(index)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input field */}
              <div className="flex items-center px-3 py-2">
                <span className="text-gray-600 mr-2">•</span>
                <input
                  type="text"
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a point and press Enter..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none py-1"
                />
                <button
                  onClick={addNoteItem}
                  disabled={!currentNote.trim()}
                  className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2.5 py-1 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: (loading || !reason.trim())
                ? "rgba(239,68,68,0.4)"
                : "linear-gradient(135deg,#EF4444,#B91C1C)",
              boxShadow: (!loading && reason.trim()) ? "0 4px 20px rgba(239,68,68,0.3)" : "none",
            }}
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <XCircle size={16} />
            )}
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────── */
/*  PREVIEW MODAL                                   */
/* ──────────────────────────────────────────────── */
const PreviewModal = ({ content, onClose, onPublish, onReject, loading, showActions, authorName }) => {
  const [imgZoomed, setImgZoomed] = useState(false);

  // Admin sees the clean preview_image (no watermark)
  const previewSrc = getAdminSrc(content);

  const status = content?.status || "pending";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  // Separate main (original) files from preview files
  const allFiles = content?.files || [];
  const mainFiles = allFiles.filter((f) => !f.is_main_file); // downloadable originals
  const hasMainFiles = mainFiles.length > 0;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{
          background: "#0D0D1A",
          maxHeight: "92vh",
          maxWidth: imgZoomed ? "95vw" : "900px",
          transition: "max-width 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: Image / Video */}
        <div
          className="relative flex items-center justify-center bg-black/50 overflow-hidden"
          style={{
            minHeight: 300,
            width: imgZoomed ? "100%" : undefined,
            flex: imgZoomed ? "1 1 100%" : "0 0 58%",
            transition: "flex 0.3s ease",
          }}
        >
          {content?.watermarked_preview_video ? (
            <>
              <video
                src={`${IMG_BASE}/${content.watermarked_preview_video}`}
                controls
                autoPlay
                muted
                loop
                className="object-contain"
                style={{
                  maxHeight: imgZoomed ? "88vh" : 500,
                  maxWidth: "100%",
                  transition: "max-height 0.3s ease",
                }}
              />
              <button
                onClick={() => setImgZoomed((z) => !z)}
                className="absolute top-3 right-3 rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
                title={imgZoomed ? "Shrink" : "Expand video"}
              >
                <Maximize2 size={16} />
              </button>
            </>
          ) : previewSrc ? (
            <>
              <img
                src={previewSrc}
                alt={content.title}
                className="object-contain"
                style={{
                  maxHeight: imgZoomed ? "88vh" : 500,
                  maxWidth: "100%",
                  transition: "max-height 0.3s ease",
                }}
              />
              {/* Zoom toggle */}
              <button
                onClick={() => setImgZoomed((z) => !z)}
                className="absolute top-3 right-3 rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
                title={imgZoomed ? "Shrink" : "Expand image"}
              >
                <Maximize2 size={16} />
              </button>
            </>
          ) : (
            <div className="text-gray-600 flex flex-col items-center gap-2 py-16">
              <Eye size={40} />
              <span className="text-sm">No preview</span>
            </div>
          )}
        </div>

        {/* RIGHT: Details panel */}
        {!imgZoomed && (
          <div
            className="flex-1 flex flex-col overflow-y-auto"
            style={{ minWidth: 0, maxHeight: "92vh" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                <StatusIcon size={12} />
                {cfg.label}
              </span>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Title + Description */}
              <div>
                <h2 className="text-white text-lg font-bold leading-snug">
                  {content?.title || "Untitled"}
                </h2>
                {content?.description && (
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed line-clamp-3">
                    {content.description}
                  </p>
                )}
              </div>

              {/* Meta info */}
              <div
                className="rounded-xl p-3 space-y-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-[#6C4FE0] flex-shrink-0" />
                  <span className="text-gray-400">Contributor:</span>
                  <span className="text-gray-200 truncate">
                    <Link to={`/dashboard/author/${content?.author_username || content?.author_id}`} className="text-blue-400 hover:underline">{authorName || content?.author_name || "Unknown"}</Link>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[#6C4FE0] flex-shrink-0" />
                  <span className="text-gray-400">Uploaded:</span>
                  <span className="text-gray-200">
                    {content?.created_at
                      ? new Date(content.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      : "Unknown"}
                  </span>
                </div>
                {content?.content_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag size={14} className="text-[#6C4FE0] flex-shrink-0" />
                    <span className="text-gray-400">Type:</span>
                    <span className="text-gray-200 capitalize">{content.content_type}</span>
                  </div>
                )}
                {(content?.width && content?.height) ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Maximize2 size={14} className="text-[#6C4FE0] flex-shrink-0" />
                    <span className="text-gray-400">Dimensions:</span>
                    <span className="text-gray-200">{content.width} × {content.height}px</span>
                  </div>
                ) : null}
              </div>


              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  📂 Download Files
                </h3>
                {allFiles.length === 0 ? (
                  <p className="text-gray-600 text-xs">No files attached.</p>
                ) : (
                  <div className="space-y-2">
                    {allFiles.map((file) => {
                      const downloadUrl = `${IMG_BASE}/${file.file_url}`;
                      const isPreview = file.is_main_file;

                      const handleDownload = async (e) => {
                        e.preventDefault();
                        
                        try {
                          const token = await getAuthToken();
                          // Append the token to the URL so auth.php can read it from $_GET['token']
                          const forceDownloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/downloadFile.php?file=${encodeURIComponent(file.file_url)}&token=${token}`;
                          
                          // Use the browser's native download mechanism
                          const a = document.createElement('a');
                          a.style.display = 'none';
                          a.href = forceDownloadUrl;
                          document.body.appendChild(a);
                          a.click();
                          
                          setTimeout(() => {
                            document.body.removeChild(a);
                          }, 1000);
                        } catch (err) {
                          console.error("Download failed:", err);
                          toast.error("Download setup failed: " + err.message);
                        }
                      };

                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group"
                          style={{
                            background: isPreview
                              ? "rgba(108,79,224,0.08)"
                              : "rgba(16,185,129,0.08)",
                            border: isPreview
                              ? "1px solid rgba(108,79,224,0.2)"
                              : "1px solid rgba(16,185,129,0.2)",
                          }}
                        >
                          {/* File icon */}
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isPreview
                                ? "rgba(108,79,224,0.2)"
                                : "rgba(16,185,129,0.2)",
                              color: isPreview ? "#6C4FE0" : "#10B981",
                            }}
                          >
                            <FileIcon type={file.file_type} size={16} />
                          </div>

                          {/* File info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">
                              {file.file_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  color: isPreview ? "#6C4FE0" : "#10B981",
                                  background: isPreview
                                    ? "rgba(108,79,224,0.15)"
                                    : "rgba(16,185,129,0.15)",
                                }}
                              >
                                {file.file_type?.toUpperCase() || "FILE"}
                              </span>
                              {file.file_size && (
                                <span className="text-gray-500 text-[10px]">
                                  {formatSize(file.file_size)}
                                </span>
                              )}
                              {isPreview && (
                                <span className="text-gray-600 text-[10px]">Preview</span>
                              )}
                              {!isPreview && (
                                <span
                                  className="text-[10px] font-semibold"
                                  style={{ color: "#10B981" }}
                                >
                                  Main File
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Download arrow */}
                          <button
                            onClick={handleDownload}
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 cursor-pointer"
                            style={{
                              background: isPreview
                                ? "rgba(108,79,224,0.2)"
                                : "rgba(16,185,129,0.2)",
                              color: isPreview ? "#6C4FE0" : "#10B981",
                              border: "none",
                            }}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rejection reason if any */}
              {(content?.rejection_reason || content?.reason) && (
                <div
                  className="rounded-xl p-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <span className="text-red-400 font-semibold block mb-1 text-xs uppercase tracking-wide">
                    ❌ Primary Rejection Reason
                  </span>
                  <span className="text-gray-300 text-sm">
                    {content.rejection_reason || content.reason}
                  </span>
                </div>
              )}

              {/* Reviewer Note / Tips if any */}
              {content?.reviewer_note && (
                <div
                  className="rounded-xl p-3 text-sm"
                  style={{
                    background: "rgba(108,79,224,0.08)",
                    border: "1px solid rgba(108,79,224,0.2)",
                  }}
                >
                  <span className="text-[#6C4FE0] font-semibold block mb-1.5 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    💡 Reviewer Note / Tips
                  </span>
                  <div className="space-y-1.5">
                    {content.reviewer_note.split("\n").map((line, idx) => (
                      <p key={idx} className="text-gray-300 text-sm pl-2 break-words">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── ACTION BUTTONS ── */}
            {showActions && (
              <div
                className="px-5 py-4 border-t space-y-2"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                {!hasMainFiles && !['photo', 'png'].includes(content?.content_type?.toLowerCase()) && (
                  <p className="text-amber-400/70 text-xs text-center mb-1">
                    ⚠️ No original main file attached — review preview only
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={onPublish}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg,#10B981,#059669)",
                      boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? (
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Publish
                  </button>
                  <button
                    onClick={onReject}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg,#EF4444,#B91C1C)",
                      boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* View-only mode footer */}
            {!showActions && (
              <div
                className="px-5 py-3 border-t"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p className="text-center text-gray-600 text-xs">
                  This content is {status}. No actions available here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────── */
/*  MAIN CARD                                       */
/* ──────────────────────────────────────────────── */
const ContentCard = ({ content, onPublish, onReject, loading, showActions = true, authors, isSelected, onToggleSelect }) => {
  const [hovered, setHovered] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const src = getAdminSrc(content);
  const status = content?.status || "pending";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const itemAuthor = authors?.find(a => String(a._id) === String(content?.author_id) || String(a.id) === String(content?.author_id) || String(a.user_id) === String(content?.author_id));
  const authorName = itemAuthor?.name || itemAuthor?.username || itemAuthor?.full_name || content?.author_name || content?.author_username || content?.author_email || "Unknown";
  const authorAvatar = itemAuthor?.avatar || itemAuthor?.avater || itemAuthor?.photo || content?.author_avatar;
  const authorImgUrl = authorAvatar ? (authorAvatar.startsWith('http') ? authorAvatar : `${import.meta.env.VITE_IMG_KEY}/${authorAvatar.startsWith('/') ? authorAvatar.slice(1) : authorAvatar}`) : null;
  const mainFileCount = (content?.files || []).filter((f) => !f.is_main_file).length;

  const handlePublish = () => {
    setPreviewOpen(false);
    onPublish(content.id);
  };

  const handleRejectOpen = () => {
    setPreviewOpen(false);
    setRejectOpen(true);
  };

  const handleRejectConfirm = (reason, note) => {
    onReject(content.id, reason, note);
    setRejectOpen(false);
  };

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered
            ? "linear-gradient(145deg,#1A1A2E,#14142A)"
            : "linear-gradient(145deg,#12121E,#0F0F1A)",
          border: `1px solid ${hovered ? "rgba(108,79,224,0.3)" : "rgba(255,255,255,0.06)"}`,
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,79,224,0.2)"
            : "0 4px 16px rgba(0,0,0,0.3)",
          transition: "all 0.3s ease",
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* Image */}
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: "4/3", background: "#080810" }}
          onClick={(e) => {
            // Prevent preview if clicking on checkbox area
            if (e.target.closest('.bulk-select-btn')) return;
            setPreviewOpen(true);
          }}
        >
          {showActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleSelect) onToggleSelect();
              }}
              className="bulk-select-btn absolute top-3 right-3 z-10 text-white drop-shadow-md hover:scale-110 transition-transform"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-[#6C4FE0] fill-white" />
              ) : (
                <Square size={20} className="text-white fill-black/30" />
              )}
            </button>
          )}
          {src ? (
            <img
              src={src}
              alt={content.title}
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: hovered ? "scale(1.07)" : "scale(1)" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700">
              <Eye size={32} />
            </div>
          )}
          {/* Overlay on hover */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{
              background: "rgba(0,0,0,0.55)",
              opacity: hovered ? 1 : 0,
            }}
          >
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "rgba(108,79,224,0.8)", backdropFilter: "blur(8px)" }}
            >
              <ZoomIn size={16} />
              Preview & Files
            </div>
          </div>
          {/* Status pill */}
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              color: cfg.color,
              background: cfg.bg,
              backdropFilter: "blur(8px)",
              border: `1px solid ${cfg.color}33`,
            }}
          >
            <StatusIcon size={11} />
            {cfg.label}
          </span>
          {/* File count badge */}
          {mainFileCount > 0 && (
            <span
              className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                color: "#10B981",
                background: "rgba(16,185,129,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <Download size={9} />
              {mainFileCount} file{mainFileCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm truncate mb-1">
            {content?.title || "Untitled"}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#6C4FE0,#FF6B6B)" }}
            >
              {authorImgUrl ? (
                <img src={authorImgUrl} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                authorName[0]?.toUpperCase() || "U"
              )}
            </div>
            <span className="text-gray-400 text-xs truncate">
              By <Link to={`/dashboard/author/${itemAuthor?.username || content?.author_username || itemAuthor?.id || content?.author_id}`} className="text-blue-400 hover:underline">{authorName}</Link>
            </span>
            <span className="ml-auto text-gray-600 text-xs flex-shrink-0">
              {content?.created_at
                ? new Date(content.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
                : ""}
            </span>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewOpen(true);
                }}
                title="Preview & Review"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#6C4FE0,#4F35C2)",
                  boxShadow: "0 2px 8px rgba(108,79,224,0.3)",
                }}
              >
                <Eye size={13} />
                Review
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(content.id);
                }}
                disabled={loading}
                title="Quick Publish"
                className="flex items-center justify-center gap-1 rounded-xl py-2 px-3 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#10B981,#059669)",
                  boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <CheckCircle size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRejectOpen(true);
                }}
                disabled={loading}
                title="Quick Reject"
                className="flex items-center justify-center gap-1 rounded-xl py-2 px-3 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#EF4444,#B91C1C)",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <XCircle size={13} />
              </button>
            </div>
          )}

          {/* View detail button when no actions */}
          {!showActions && (
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-[#6C4FE0] border border-[#6C4FE0]/30 hover:bg-[#6C4FE0]/10 transition"
            >
              <Eye size={14} />
              View Details & Files
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {previewOpen && (
        <PreviewModal
          content={content}
          onClose={() => setPreviewOpen(false)}
          onPublish={handlePublish}
          onReject={handleRejectOpen}
          loading={loading}
          showActions={showActions}
          authorName={authorName}
        />
      )}
      {rejectOpen && (
        <RejectModal
          content={content}
          onClose={() => setRejectOpen(false)}
          onConfirm={handleRejectConfirm}
          loading={loading}
        />
      )}
    </>
  );
};

export default ContentCard;
