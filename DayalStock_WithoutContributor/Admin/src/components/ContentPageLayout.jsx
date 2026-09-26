import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronRight,
  Inbox,
  CheckSquare,
  Square,
  Users,
  ChevronLeft,
  Zap
} from "lucide-react";
import ContentCard from "./ContentCard";
import { updateContentStatus, getAllContents } from "../api/contentApi";
import { Link } from "react-router-dom";
import useAuthors from "../utils/Hooks/useAuthors";
import ReviewInspectionDrawer from "./Review/ReviewInspectionDrawer";

/**
 * Generic content management page layout
 * @param {object} props
 * @param {string}   props.title         - Page title
 * @param {string}   props.subtitle      - Subtitle / description
 * @param {React.ReactNode} props.icon   - Icon element
 * @param {string}   props.accentColor   - CSS color string
 * @param {Array}    props.contents      - Array of content objects
 * @param {boolean}  props.isLoading     - Loading state
 * @param {boolean}  props.isError       - Error state
 * @param {boolean}  props.showActions   - Show approve/reject buttons
 */
const ContentPageLayout = ({
  title,
  subtitle,
  icon,
  accentColor = "#6C4FE0",
  contents = [],
  isLoading,
  isError,
  showActions = false,
  serverPage,
  setServerPage,
  serverTotalPages,
}) => {
  const queryClient = useQueryClient();
  const { data: authors } = useAuthors();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [loadingId, setLoadingId] = useState(null);
  const [localPage, setLocalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [inspectIndex, setInspectIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const PER_PAGE = 50;

  const isServerPaginated = serverPage !== undefined;
  const currentPage = isServerPaginated ? serverPage : localPage;

  const handleSetPage = (p) => {
    if (isServerPaginated) setServerPage(p);
    else setLocalPage(p);
  };

  const filtered = contents.filter((c) => {
    const searchMatch = [c.title, c.author_name, c.author_email, c.category_name]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const authorMatch = selectedAuthor === "all" || String(c.author_id) === String(selectedAuthor);
    return searchMatch && authorMatch;
  });

  const totalPages = isServerPaginated ? serverTotalPages : Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = isServerPaginated ? filtered : filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length && paginated.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map((c) => c.id));
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      await Promise.all(selectedIds.map(id => updateContentStatus(id, status)));
      toast.success(`Successfully ${status === 'published' ? 'published' : 'rejected'} ${selectedIds.length} items.`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    } catch (err) {
      toast.error(err.message || "Failed to perform bulk action");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleAuthorBulkPublish = async () => {
    if (selectedAuthor === "all") return;
    setIsBulkLoading(true);
    try {
      toast.info("Fetching all pending contents for author...", { autoClose: 2000 });
      const res = await getAllContents({ status: "pending", limit: 5000 });
      const authorContents = res.data.filter(c => String(c.author_id) === String(selectedAuthor));

      if (authorContents.length === 0) {
        toast.info("No pending contents found for this author.");
        setIsBulkLoading(false);
        return;
      }

      toast.info(`Approving ${authorContents.length} items...`);
      await Promise.all(authorContents.map(c => updateContentStatus(c.id, "published")));
      toast.success(`Successfully published all ${authorContents.length} items from this author!`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    } catch (err) {
      toast.error(err.message || "Failed to bulk publish by author");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handlePublish = async (id) => {
    setLoadingId(id);
    try {
      await updateContentStatus(id, "published");
      toast.success("Content published successfully!");

      // Auto-check for author level upgrade
      const publishedContent = contents.find(c => c.id === id);
      if (publishedContent && publishedContent.author_id) {
        try {
          await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/author/check_level_upgrade.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author_id: publishedContent.author_id })
          });
        } catch (err) {
          console.error("Level check failed:", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["contents"] });
    } catch (err) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id, reason, reviewerNote) => {
    setLoadingId(id);
    try {
      await updateContentStatus(id, "rejected", reason, reviewerNote);
      toast.success("Content rejected.");
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    } catch (err) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDrawerApprove = async (id) => {
    await handlePublish(id);
    if (inspectIndex < paginated.length - 1) {
      setInspectIndex(prev => prev + 1);
    } else if (paginated.length <= 1) {
      setIsDrawerOpen(false);
    }
  };

  const handleDrawerReject = async (id, reason, reviewerNote) => {
    await handleReject(id, reason, reviewerNote);
    if (inspectIndex < paginated.length - 1) {
      setInspectIndex(prev => prev + 1);
    } else if (paginated.length <= 1) {
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{
          background: `linear-gradient(135deg, ${accentColor}18 0%, transparent 70%)`,
          border: `1px solid ${accentColor}22`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl text-white"
            style={{ background: `${accentColor}33`, color: accentColor }}
          >
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm mt-0.5" style={{ color: `${accentColor}bb` }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showActions && paginated.length > 0 && (
            <button
              onClick={() => {
                setInspectIndex(0);
                setIsDrawerOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20 cursor-pointer"
              title="Launch Fast Review Drawer with Hotkeys (A / R / J / K)"
            >
              <Zap size={15} />
              <span>Fast Review Mode</span>
            </button>
          )}

          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}33` }}
          >
            <span style={{ color: accentColor }}>{filtered.length}</span>
            <span className="text-gray-300">
              {filtered.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleSetPage(1);
              }}
              placeholder="Search by title, author, category..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#6C4FE0]/50 focus:ring-1 focus:ring-[#6C4FE0]/30 transition"
            />
          </div>
          <div className="relative flex-1">
            <Users
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                handleSetPage(1);
                setSelectedIds([]);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#12121E] pl-9 pr-4 py-2.5 text-sm text-gray-300 outline-none focus:border-[#6C4FE0]/50 transition appearance-none cursor-pointer"
            >
              <option value="all">All Authors</option>
              {authors?.map(author => (
                <option key={author.id || author._id} value={author.id || author.user_id || author._id}>
                  {author.name || author.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {showActions && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition"
            >
              {selectedIds.length === paginated.length && paginated.length > 0 ? (
                <CheckSquare size={16} className="text-[#6C4FE0]" />
              ) : (
                <Square size={16} />
              )}
              <span className="hidden sm:inline">Select All</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["contents"] })}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* View Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setView("grid")}
              className="px-3 py-2.5 transition"
              style={{
                background: view === "grid" ? `${accentColor}33` : "transparent",
                color: view === "grid" ? accentColor : "#6B7280",
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className="px-3 py-2.5 transition"
              style={{
                background: view === "list" ? `${accentColor}33` : "transparent",
                color: view === "list" ? accentColor : "#6B7280",
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden animate-pulse"
              style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#12121E" }}
            >
              <div
                className="bg-white/5"
                style={{ aspectRatio: "4/3" }}
              />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
                <div className="h-8 rounded-xl bg-white/5 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}
        >
          <SlidersHorizontal size={40} className="text-red-400 mb-3" />
          <p className="text-red-400 font-semibold">Failed to load contents</p>
          <p className="text-gray-500 text-sm mt-1">Check your connection and try again</p>
        </div>
      )}

      {/* EMPTY */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#12121E" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: `${accentColor}15` }}
          >
            <Inbox size={30} style={{ color: accentColor }} />
          </div>
          <p className="text-white font-semibold text-lg">No content found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search ? "Try a different search term" : "Nothing here yet"}
          </p>
        </div>
      )}

      {/* GRID / LIST */}
      {!isLoading && !isError && paginated.length > 0 && (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginated.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onPublish={handlePublish}
                  onReject={handleReject}
                  loading={loadingId === content.id}
                  showActions={showActions}
                  authors={authors}
                  isSelected={selectedIds.includes(content.id)}
                  onToggleSelect={() => toggleSelect(content.id)}
                  onQuickInspect={() => {
                    const idx = paginated.findIndex((c) => c.id === content.id);
                    setInspectIndex(idx >= 0 ? idx : 0);
                    setIsDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map((content) => (
                <ListRow
                  key={content.id}
                  content={content}
                  onPublish={handlePublish}
                  onReject={handleReject}
                  loading={loadingId === content.id}
                  showActions={showActions}
                  authors={authors}
                  isSelected={selectedIds.includes(content.id)}
                  onToggleSelect={() => toggleSelect(content.id)}
                  onQuickInspect={() => {
                    const idx = paginated.findIndex((c) => c.id === content.id);
                    setInspectIndex(idx >= 0 ? idx : 0);
                    setIsDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handleSetPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-gray-400 border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={15} />
                Prev
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span key={`dots-${p}`} className="px-2 text-gray-600 self-center">
                          …
                        </span>
                      )}
                      <button
                        onClick={() => handleSetPage(p)}
                        className="w-9 h-9 rounded-xl text-sm font-medium transition"
                        style={{
                          background: currentPage === p ? accentColor : "transparent",
                          color: currentPage === p ? "white" : "#9CA3AF",
                          border: currentPage === p ? "none" : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => handleSetPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-gray-400 border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {/* FLOATING ACTION BAR FOR BULK ACTIONS */}
      {selectedIds.length > 0 && showActions && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-[#12121E] border border-white/10 shadow-2xl rounded-2xl px-6 py-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center bg-[#6C4FE0]/20 text-[#6C4FE0] font-bold h-8 w-8 rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-white font-semibold">Selected</span>
          </div>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("published")}
              disabled={isBulkLoading}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-semibold text-white transition hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#10B981,#059669)",
                opacity: isBulkLoading ? 0.6 : 1,
              }}
            >
              {isBulkLoading ? "Processing..." : "Publish Selected"}
            </button>
            <button
              onClick={() => handleBulkAction("rejected")}
              disabled={isBulkLoading}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-semibold text-white transition hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#EF4444,#B91C1C)",
                opacity: isBulkLoading ? 0.6 : 1,
              }}
            >
              {isBulkLoading ? "Processing..." : "Reject Selected"}
            </button>
          </div>
        </div>
      )}

      {/* AUTHOR BULK APPROVE BUTTON */}
      {selectedAuthor !== "all" && showActions && selectedIds.length === 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-[#12121E] border border-white/10 shadow-2xl rounded-2xl px-6 py-4 animate-in slide-in-from-bottom-5">
          <span className="text-white font-semibold flex items-center gap-2">
            <Users size={18} className="text-[#6C4FE0]" /> Author Bulk Action
          </span>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <button
            onClick={handleAuthorBulkPublish}
            disabled={isBulkLoading}
            className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-semibold text-white transition hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#6C4FE0,#4F35C2)",
              opacity: isBulkLoading ? 0.6 : 1,
            }}
          >
            {isBulkLoading ? "Processing..." : "Publish All by this Author"}
          </button>
        </div>
      )}

      {/* FAST REVIEW INSPECTION DRAWER (Hotkeys: A, R, J, K, Esc) */}
      <ReviewInspectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contents={paginated}
        currentIndex={inspectIndex}
        onNavigate={(newIdx) => setInspectIndex(newIdx)}
        onApprove={handleDrawerApprove}
        onReject={handleDrawerReject}
        isActionLoading={loadingId !== null}
      />
    </div>
  );
};

/* ──────────────────────────────────────────────── */
/*  LIST ROW VIEW                                   */
/* ──────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#F59E0B" },
  published: { label: "Published", color: "#10B981" },
  rejected: { label: "Rejected", color: "#EF4444" },
};

const IMG_BASE = import.meta.env.VITE_IMG_KEY;

const ListRow = ({ content, onPublish, onReject, loading, showActions, authors, isSelected, onToggleSelect }) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const cfg = STATUS_CONFIG[content?.status] || STATUS_CONFIG.pending;
  const src = content?.preview_image
    ? `${IMG_BASE}/${content.preview_image}`
    : content?.image_url
      ? `${IMG_BASE}/${content.image_url}`
      : null;

  const itemAuthor = authors?.find(a => String(a._id) === String(content?.author_id) || String(a.id) === String(content?.author_id) || String(a.user_id) === String(content?.author_id));
  const authorName = itemAuthor?.name || itemAuthor?.username || itemAuthor?.full_name || content?.author_name || content?.author_username || content?.author_email || "Unknown";
  return (
    <>
      <div
        className="flex items-center gap-4 rounded-xl px-4 py-3 border border-white/6 hover:border-white/12 transition-all group"
        style={{ background: "#12121E" }}
      >
        {/* Checkbox */}
        {showActions && (
          <button
            onClick={onToggleSelect}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isSelected ? (
              <CheckSquare size={18} className="text-[#6C4FE0]" />
            ) : (
              <Square size={18} />
            )}
          </button>
        )}
        {/* Thumbnail */}
        <div
          className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 flex-shrink-0"
        >
          {src ? (
            <img
              src={src}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
              No img
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {content?.title || "Untitled"}
          </p>
          <p className="text-gray-500 text-xs truncate">
            <Link to={`/dashboard/author/${itemAuthor?.username || content?.author_username || itemAuthor?.id || content?.author_id}`} className="text-blue-400 hover:underline">{authorName}</Link> ·{" "}
            {content?.category_name || "No category"}
          </p>
        </div>
        {/* Date */}
        <span className="hidden sm:block text-xs text-gray-600 flex-shrink-0">
          {content?.created_at
            ? new Date(content.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "2-digit",
            })
            : ""}
        </span>
        {/* Status */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ color: cfg.color, background: `${cfg.color}18` }}
        >
          {cfg.label}
        </span>
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onPublish(content.id)}
              disabled={loading}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#10B981,#059669)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Publish
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              disabled={loading}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#EF4444,#B91C1C)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Reject
            </button>
          </div>
        )}
      </div>
      {rejectOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        >
          <RejectModalInline
            content={content}
            onClose={() => setRejectOpen(false)}
            onConfirm={(reason) => {
              onReject(content.id, reason);
              setRejectOpen(false);
            }}
            loading={loading}
          />
        </div>
      )}
    </>
  );
};

const RejectModalInline = ({ content, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  return (
    <div
      className="relative w-full max-w-md rounded-2xl border border-red-500/20 p-6 shadow-2xl"
      style={{ background: "#12121E" }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
      >
        <SlidersHorizontal size={18} className="rotate-90" />
      </button>
      <h3 className="text-white font-semibold text-lg mb-1">Reject Content</h3>
      <p className="text-gray-400 text-sm mb-4">&quot;{content?.title}&quot;</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Rejection reason (optional)..."
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/50 transition resize-none"
      />
      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(reason)}
          disabled={loading}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition"
          style={{
            background: loading ? "rgba(239,68,68,0.4)" : "linear-gradient(135deg,#EF4444,#B91C1C)",
          }}
        >
          {loading ? "Rejecting..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default ContentPageLayout;
