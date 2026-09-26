import { useState } from "react";
import {
  XCircle,
  Search,
  ShieldAlert,
  RefreshCw,
  Trash2,
  Calendar,
  UserRound,
  MessageSquareText,
  FileText,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../utlis/Hooks/useAuth";
import useAuthorByEmail from "../../../utlis/Hooks/useAuthorByEmail";
import useAuthorContents from "../../../utlis/Hooks/useAuthorContents";

const IMG_URL = import.meta.env.VITE_IMG_KEY ;
const API_URL = import.meta.env.VITE_LOCALHOST_KEY || "https://api.dayalstock.com/api_v1";

const Rejected = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: author, isLoading: authorLoading } = useAuthorByEmail(
    user?.email
  );
  const {
    data: authorContentsResponse,
    isLoading: contentsLoading,
    isError,
    error,
    refetch,
  } = useAuthorContents(author?.id, "rejected", 1, 50);

  const rejectedFiles = authorContentsResponse?.data || [];

  const filteredFiles = rejectedFiles.filter((file) =>
    file.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getImageUrl = (path) => {
    if (!path) return null;

    if (path.startsWith("http")) return path;

    return `${IMG_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  };

  const getPreviewImage = (file) => {
    return getImageUrl(file.watermarked_preview_video || file.author_preview_url || file.preview_image || file.image_url || file.image);
  };

  const handleResubmit = (file) => {
    setSelectedFile(null);
    navigate(`/dashboard/files/upload?resubmit=${file.id}`);
    toast.info(`Fix "${file.title}" and submit it again for review.`);
  };

  const handleDelete = async (file) => {
    const confirmed = window.confirm(
      `"${file.title}" permanently delete করতে চাও? পরে আর ফেরত আনা যাবে না।`
    );

    if (!confirmed) return;

    try {
      setDeletingId(file.id);
      let headers = {};
      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/author/deleteAuthorContent.php?id=${file.id}&author_id=${author?.id}`,
        {
          method: "POST",
          headers: headers
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete content.");
      }

      toast.success(`"${file.title}" deleted successfully.`);

      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to delete rejected asset.");
    } finally {
      setDeletingId(null);
    }
  };

  if (authorLoading || contentsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-400">Loading rejected files...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400">
        {error?.message || "Failed to load rejected files."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-red-500/15 bg-gradient-to-r from-red-500/[0.07] to-[#0F0F1A] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <XCircle size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Rejected Files
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-400">
                Review the feedback, fix the issues, and submit your file again.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-1.5 text-xs text-red-300">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                {rejectedFiles.length} rejected file
                {rejectedFiles.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

            <input
              type="text"
              placeholder="Search rejected files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-red-500/50"
            />
          </div>
        </div>
      </div>

      {/* REJECTED FILE GRID */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => {
            const previewImage = getPreviewImage(file);
           return (
              <div
                key={file.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition duration-300 hover:border-red-500/30 hover:bg-white/[0.05]"
              >
                {/* CLICKABLE IMAGE */}
                <button
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className="relative block h-48 w-full overflow-hidden bg-[#151522] text-left"
                >
                  {previewImage ? (
                    file.content_type === "video" ? (
                      <video
                        src={previewImage}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={previewImage}
                        alt={file.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-600">
                      <FileText size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        No Preview
                      </span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-red-400/20 bg-[#2a1118]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300">
                    <XCircle size={11} />
                    Rejected
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                    <span className="rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                      Click to view feedback
                    </span>
                  </div>
                </button>

                {/* COMPACT CONTENT */}
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className="w-full text-left"
                  >
                    <h3 className="truncate text-sm font-bold text-white transition hover:text-red-400">
                      {file.title}
                    </h3>
                  </button>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(file.reviewed_at || file.rejected_at)}
                    </span>

                    <span>#{file.id}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-300">
                      {file.content_type || file.type || "Asset"}
                    </span>

                    <span className="rounded-md border border-[#6C4FE0]/20 bg-[#6C4FE0]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#B6A7FF]">
                      {file.license_type || file.license || "Free"}
                    </span>
                  </div>

                  {/* SHORT REASON PREVIEW */}
                  <button
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className="mt-4 w-full rounded-xl border border-red-500/10 bg-red-500/[0.04] p-3 text-left transition hover:bg-red-500/[0.08]"
                  >
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                      <ShieldAlert size={13} />
                      Rejection reason
                    </p>

                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-gray-400">
                      {file.rejection_reason ||
                        file.rejectionReason ||
                        "This file did not meet our current quality guidelines."}
                    </p>
                  </button>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 border-t border-white/5 bg-black/10 p-3">
                  <button
                    type="button"
                    onClick={() => handleResubmit(file)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#6C4FE0] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#5B3FD0]"
                  >
                    <RefreshCw size={14} />
                    Fix & Resubmit
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === file.id}
                    onClick={() => handleDelete(file)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2.5 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
            <XCircle size={30} />
          </div>

          <h3 className="mt-5 text-base font-bold text-white">
            No rejected files
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            You currently have no rejected submissions.
          </p>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedFile && (
        <div
          onClick={() => setSelectedFile(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#12121C] shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div className="min-w-0 pr-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400">
                  <XCircle size={13} />
                  Rejected File Details
                </p>

                <h3 className="mt-2 truncate text-lg font-bold text-white">
                  {selectedFile.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* FULL IMAGE */}
              <div className="overflow-hidden rounded-xl border border-white/5 bg-black/30">
                {getPreviewImage(selectedFile) ? (
                  selectedFile.content_type === "video" ? (
                    <video
                      src={getPreviewImage(selectedFile)}
                      className="max-h-[380px] w-full object-contain"
                      controls
                      autoPlay
                      muted
                    />
                  ) : (
                    <img
                      src={getPreviewImage(selectedFile)}
                      alt={selectedFile.title}
                      className="max-h-[380px] w-full object-contain"
                    />
                  )
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 text-gray-600">
                    <FileText size={35} />
                    <span className="text-xs">No preview image available</span>
                  </div>
                )}
              </div>

              {/* FILE META */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-300">
                  {selectedFile.content_type || selectedFile.type || "Asset"}
                </span>

                <span className="rounded-md border border-[#6C4FE0]/20 bg-[#6C4FE0]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#B6A7FF]">
                  {selectedFile.license_type || selectedFile.license || "Free"}
                </span>

                <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300">
                  Rejected
                </span>
              </div>

              {/* FULL REJECTION REASON */}
              <div className="rounded-xl border border-red-500/15 bg-red-500/[0.06] p-4">
                <div className="flex items-center gap-2 text-red-300">
                  <ShieldAlert size={17} />
                  <p className="text-[11px] font-extrabold uppercase tracking-widest">
                    Rejection Reason
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gray-200">
                  {selectedFile.rejection_reason ||
                    selectedFile.rejectionReason ||
                    "This file did not meet our current quality guidelines."}
                </p>
              </div>

              {/* FULL REVIEWER NOTE */}
              {(selectedFile.reviewer_note || selectedFile.reviewerNote) && (
                <div className="rounded-xl border border-[#6C4FE0]/20 bg-[#6C4FE0]/[0.06] p-4">
                  <div className="flex items-center gap-2 text-[#B6A7FF]">
                    <MessageSquareText size={17} />
                    <p className="text-[11px] font-extrabold uppercase tracking-widest">
                      Reviewer Note
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-gray-200">
                    {selectedFile.reviewer_note || selectedFile.reviewerNote}
                  </p>
                </div>
              )}

              {/* REVIEW INFO */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-black/15 p-4 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    <UserRound size={12} />
                    Reviewed By
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-200">
                    {selectedFile.reviewer_name ||
                      selectedFile.reviewerName ||
                      "DayalStock Review Team"}
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    <Calendar size={12} />
                    Rejected At
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-200">
                    {formatDate(
                      selectedFile.reviewed_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Submitted At
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-200">
                    {formatDate(selectedFile.created_at || selectedFile.date)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    File ID
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-200">
                    #{selectedFile.id}
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={deletingId === selectedFile.id}
                onClick={() => handleDelete(selectedFile)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deletingId === selectedFile.id
                  ? "Deleting..."
                  : "Delete File"}
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:bg-white/5"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleResubmit(selectedFile)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6C4FE0] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#5B3FD0]"
                >
                  <RefreshCw size={14} />
                  Fix & Resubmit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rejected;