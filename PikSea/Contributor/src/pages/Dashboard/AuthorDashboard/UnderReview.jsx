import { useState } from "react";
import {
  Clock,
  Search,
  Calendar,
  FileText,
  UploadCloud,
} from "lucide-react";
import useAuth from "../../../utlis/Hooks/useAuth";
import useAuthorByEmail from "../../../utlis/Hooks/useAuthorByEmail";
import useAuthorContents from "../../../utlis/Hooks/useAuthorContents";

const IMG_URL = import.meta.env.VITE_IMG_KEY || "https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev";

const UnderReview = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useAuth();
  const { data: author, isLoading: authorLoading } = useAuthorByEmail(user?.email);

  const {
    data: authorContentsResponse,
    isLoading: contentsLoading,
    isError,
    error,
  } = useAuthorContents(author?.id, "pending", 1, 50);

  const pendingFiles = authorContentsResponse?.data || [];
  const filteredFiles = pendingFiles.filter((file) =>
    file.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return "Recently submitted";

    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authorLoading || contentsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-gray-400">Loading submissions...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400">
        {error?.message || "Failed to load under review files."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#171326] to-[#0F0F1A] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <Clock size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Under Review
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
                Your files are currently being reviewed for quality, metadata,
                copyright and technical requirements.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} waiting for review
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search under review files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#6C4FE0]"
            />
          </div>
        </div>
      </div>

      {/* IMPORTANT NOTICE */}
      {pendingFiles.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-[#6C4FE0]/20 bg-[#6C4FE0]/5 p-4">
          <FileText size={18} className="mt-0.5 shrink-0 text-[#9B87F5]" />

          <p className="text-xs leading-6 text-gray-400">
            <span className="font-semibold text-white">Editing is unavailable while under review.</span>{" "}
            To avoid interrupting the review process, file details and metadata
            cannot be changed. You may cancel the submission if necessary.
          </p>
        </div>
      )}

      {/* FILE LIST */}
      {filteredFiles.length > 0 ? (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-[#6C4FE0]/30"
            >
              <div className="flex flex-col gap-5 p-4 sm:flex-row sm:p-5">
                {/* PREVIEW */}
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#151522] sm:h-28 sm:w-40">
                  {file.content_type === "video" && (file.watermarked_preview_video || file.author_preview_url || file.preview_image || file.image_url) ? (
                    <video
                      src={`${IMG_URL}/${file.watermarked_preview_video || file.author_preview_url || file.preview_image || file.image_url}`}
                      className="h-full w-full object-cover"
                      controls
                      muted
                    />
                  ) : file.author_preview_url || file.preview_image || file.image_url ? (
                    <img
                      src={`${IMG_URL}/${file.author_preview_url || file.preview_image || file.image_url}`}
                      alt={file.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-600">
                      <FileText size={26} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        No Preview
                      </span>
                    </div>
                  )}

                  <div className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-md border border-amber-400/20 bg-[#16111a]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    Under Review
                  </div>
                </div>

                {/* CONTENT */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-white transition group-hover:text-[#A995FF]">
                        {file.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          Submitted {formatDate(file.created_at || file.date)}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <FileText size={13} />
                          File ID: #{file.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-300">
                        {file.content_type || file.type || "Asset"}
                      </span>

                      <span className="rounded-md border border-[#6C4FE0]/20 bg-[#6C4FE0]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#B6A7FF]">
                        {file.license_type || file.license || "Free"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-white/5 bg-black/15 p-3">
                    <div className="flex items-start gap-2.5">
                      <Clock size={16} className="mt-0.5 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-200">
                          Review in progress
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Our moderation team is checking your file. You will see
                          the result here once the review is complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C4FE0]/10 text-[#A995FF]">
            <UploadCloud size={30} />
          </div>

          <h3 className="mt-5 text-base font-bold text-white">
            No files under review
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Files you submit for publishing will appear here while our team
            reviews them.
          </p>
        </div>
      )}
    </div>
  );
};

export default UnderReview;