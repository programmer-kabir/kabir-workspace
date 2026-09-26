import { useState } from "react";
import {
  Search,
  ExternalLink,
  Calendar,
  CheckCircle2,
  FileText,
  Eye,
  X,
  Loader2,
  BadgeCheck,
  Download,
  Heart,
} from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../../utlis/Hooks/useAuth";
import useAuthorByEmail from "../../../utlis/Hooks/useAuthorByEmail";
import useAuthorContents from "../../../utlis/Hooks/useAuthorContents";

const IMAGE_BASE_URL = import.meta.env.VITE_IMG_KEY || "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev/";

const Published = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const { user } = useAuth();

  const { data: author, isLoading: authorLoading } = useAuthorByEmail(
    user?.email
  );

  const {
    data: authorContentsResponse,
    isLoading: contentsLoading,
    isError,
    error,
  } = useAuthorContents(author?.id, "published", 1, 50);

  const publishedFiles = authorContentsResponse?.data || [];

  const filteredFiles = publishedFiles.filter((file) =>
    file.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;

    return `${IMAGE_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  };

  const getPreviewImage = (file) => {
    return getImageUrl(file.watermarked_preview_video || file.author_preview_url || file.preview_image || file.image_url || file.image);
  };

  const handleViewLive = (file) => {
    if (!file.slug) {
      toast.error("Public page link is not available for this asset.");
      return;
    }

    window.open(`https://dayalstock.com/${file.content_type}/content/${file.slug}`, "_blank");
  };


  if (authorLoading || contentsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#8E7AF2]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400">
        {error?.message || "Failed to load published files."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-green-500/15 bg-gradient-to-r from-green-500/[0.07] to-[#0F0F1A] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
              <CheckCircle2 size={25} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Published Files
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-400">
                Your approved assets are now live on the DayalStock marketplace.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-green-500/15 bg-green-500/5 px-3 py-1.5 text-xs text-green-300">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {publishedFiles.length} live file
                {publishedFiles.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

            <input
              type="text"
              placeholder="Search published files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-green-500/50"
            />
          </div>
        </div>
      </div>

      {/* PUBLISHED GRID */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const previewImage = getPreviewImage(file);
            const isPremium = Boolean(file.is_premium) || file.license_type === "premium";

            return (
              <div
                key={file.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition duration-300 hover:border-green-500/30 hover:bg-white/[0.055]"
              >
                {/* IMAGE */}
                <button
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-[#151522] text-left"
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

                  <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    <span className="inline-flex w-fit items-center gap-1 rounded-md border border-green-400/20 bg-[#10261b]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-300">
                      <CheckCircle2 size={11} />
                      Live
                    </span>

                    <span
                      className={`w-fit rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isPremium
                          ? "bg-[#FF6B6B]/90 text-white"
                          : "bg-[#6C4FE0]/90 text-white"
                        }`}
                    >
                      {file.license_type || (isPremium ? "Premium" : "Free")}
                    </span>
                  </div>

                  <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {file.content_type || "Asset"}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                      <Eye size={14} />
                      View details
                    </span>
                  </div>
                </button>

                {/* DETAILS */}
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className="w-full text-left"
                  >
                    <h3 className="truncate text-sm font-bold text-white transition hover:text-green-300">
                      {file.title}
                    </h3>
                  </button>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Calendar size={12} />
                    Published {formatDate(file.published_at || file.created_at)}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5" title="Views">
                      <Eye size={12} className="text-gray-500" />
                      <span>{file.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Downloads">
                      <Download size={12} className="text-green-500/80" />
                      <span>{file.downloads_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Likes">
                      <Heart size={12} className="text-red-500/80" />
                      <span>{file.likes_count || 0}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewLive(file)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink size={14} />
                      View Live
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFile(file)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-500/15 bg-green-500/5 px-3 py-2.5 text-xs font-semibold text-green-300 transition hover:bg-green-500/10"
                    >
                      <Eye size={14} />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
            <CheckCircle2 size={30} />
          </div>

          <h3 className="mt-5 text-base font-bold text-white">
            No published files
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            When your submissions are approved, they will appear here as live marketplace assets.
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
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div className="min-w-0 pr-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-400">
                  <BadgeCheck size={14} />
                  Live Marketplace Asset
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
              <div className="overflow-hidden rounded-xl border border-white/5 bg-black/30">
                {getPreviewImage(selectedFile) ? (
                  selectedFile.content_type === "video" ? (
                    <video
                      src={getPreviewImage(selectedFile)}
                      className="max-h-[400px] w-full object-contain"
                      controls
                      autoPlay
                      muted
                    />
                  ) : (
                    <img
                      src={getPreviewImage(selectedFile)}
                      alt={selectedFile.title}
                      className="max-h-[400px] w-full object-contain"
                    />
                  )
                ) : (
                  <div className="flex h-56 items-center justify-center text-gray-600">
                    <FileText size={35} />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-300">
                  Published
                </span>

                <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-300">
                  {selectedFile.content_type || "Asset"}
                </span>

                <span className="rounded-md border border-[#6C4FE0]/20 bg-[#6C4FE0]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#B6A7FF]">
                  {selectedFile.license_type || "Free"}
                </span>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/15 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  Description
                </p>

                <p className="mt-2 text-sm leading-7 text-gray-300">
                  {selectedFile.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-black/15 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Published At
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-200">
                    {formatDate(selectedFile.published_at || selectedFile.created_at)}
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

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Dimensions
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-200">
                    {selectedFile.width && selectedFile.height
                      ? `${selectedFile.width} × ${selectedFile.height}`
                      : "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Orientation
                  </p>
                  <p className="mt-1 text-sm font-medium capitalize text-gray-200">
                    {selectedFile.orientation || "Not available"}
                  </p>
                </div>
              </div>

              {selectedFile.tags?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Tags
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFile.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">


              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:bg-white/5"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleViewLive(selectedFile)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-600"
                >
                  <ExternalLink size={14} />
                  View Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Published;