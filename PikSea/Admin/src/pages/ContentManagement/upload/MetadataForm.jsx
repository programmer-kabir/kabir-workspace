import { useUpload } from "./UploadContext";
import { Sparkles, Loader2 } from "lucide-react";

const MetadataForm = () => {
  const {
    selectedFiles, activeFile, activeMeta, updateActiveField, applyToChecked,
    isLoading, parentCategoriesComputed, subCategories,
    isLoadingTags, tagSuggestions, checkedFiles,
    addTagSuggestion, addAllTagSuggestions,
    fetchRelatedTags, handleSubmit,
    isSubmitting, uploadProgress, uploadSpeed,
    filesMetadata, copyMetaSource, setCopyMetaSource, applyMetadataCopy, applyMetadataToAll,
    isGeneratingAI, generateSingleAIMetadata, generateBulkAIMetadata,
    MAX_TAGS, MIN_TAGS, IDEAL_TAGS, MAX_TITLE_LENGTH, MIN_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH,
    getTagsArray, descDebounceRef,
  } = useUpload();

  if (!activeFile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center lg:sticky lg:top-6 lg:h-[calc(100vh-140px)]">
        <p className="text-xs text-gray-500 font-medium">Select a file to edit metadata</p>
      </div>
    );
  }

  const tagsCount = getTagsArray(activeMeta.tags || "").length;
  const tagsColor = tagsCount < MIN_TAGS ? "text-red-400" : tagsCount > IDEAL_TAGS ? "text-amber-400" : "text-emerald-400";

  const speedKBs = Math.round(uploadSpeed / 1024);
  const progressPct = uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0;

  const formatFileName = (fileName, maxLength = 24) => {
    if (!fileName) return "";
    if (fileName.length <= maxLength) return fileName;
    const start = fileName.slice(0, 14);
    const end = fileName.slice(-8);
    return `${start}...${end}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 flex flex-col"
    >
      {/* Form Content */}
      <div className="p-6 space-y-5 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>

            <p className="text-xs text-gray-400 font-medium truncate mt-0.5" title={activeFile?.name}>
              Active: <span className="text-[#00D4FF] font-bold">{formatFileName(activeFile?.name)}</span>
            </p>
          </div>

          {/* Copy Metadata to All or from another file */}
          {selectedFiles.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={applyMetadataToAll}
                title="Copy current title, description, category, and tags to all other files in queue"
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 transition-all cursor-pointer shadow-sm"
              >
                ⚡ Apply to All ({selectedFiles.length})
              </button>

              <select
                value={copyMetaSource}
                onChange={(e) => {
                  setCopyMetaSource(e.target.value);
                  if (e.target.value) applyMetadataCopy(activeFile.name);
                }}
                className="text-[11px] rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-gray-300 outline-none focus:border-[#00D4FF] transition-colors max-w-[140px] truncate"
              >
                <option value="">📋 Copy From…</option>
                {selectedFiles
                  .filter((f) => f.name !== activeFile.name)
                  .map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">
              Title <span className="text-red-400">*</span>
            </label>
            <span
              className={`text-[10px] font-semibold ${
                (activeMeta.title?.length || 0) < MIN_TITLE_LENGTH
                  ? "text-red-400"
                  : (activeMeta.title?.length || 0) > MAX_TITLE_LENGTH
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {activeMeta.title?.length || 0}/{MAX_TITLE_LENGTH} chars (min {MIN_TITLE_LENGTH})
            </span>
          </div>
          <input
            type="text"
            required
            value={activeMeta.title || ""}
            onChange={(e) => {
              updateActiveField("title", e.target.value);
              if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
              descDebounceRef.current = setTimeout(() => {
                fetchRelatedTags(e.target.value, activeMeta.description || "");
              }, 600);
            }}
            placeholder="e.g. Modern Abstract Technology Vector Background"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00D4FF] transition-colors"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">Description</label>
            <span
              className={`text-[10px] font-semibold ${
                (activeMeta.description?.length || 0) > 0 &&
                (activeMeta.description?.length || 0) < MIN_DESCRIPTION_LENGTH
                  ? "text-red-400"
                  : (activeMeta.description?.length || 0) > MAX_DESCRIPTION_LENGTH
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {activeMeta.description?.length || 0}/{MAX_DESCRIPTION_LENGTH} chars (min {MIN_DESCRIPTION_LENGTH})
            </span>
          </div>
          <textarea
            rows={3}
            value={activeMeta.description || ""}
            onChange={(e) => {
              updateActiveField("description", e.target.value);
              if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
              descDebounceRef.current = setTimeout(() => {
                fetchRelatedTags(activeMeta.title || "", e.target.value);
              }, 600);
            }}
            placeholder="Detailed description of the asset for search indexing..."
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00D4FF] transition-colors resize-none"
          />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Main Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300">
                Category <span className="text-red-400">*</span>
              </label>
              {checkedFiles.size > 0 && (
                <button
                  type="button"
                  onClick={() => applyToChecked("category")}
                  className="text-[10px] font-bold text-[#00D4FF] hover:underline"
                >
                  Apply to Selected
                </button>
              )}
            </div>
            <select
              required
              value={activeMeta.category || ""}
              onChange={(e) => {
                updateActiveField("category", e.target.value);
                updateActiveField("subcategory", "");
              }}
              className="w-full rounded-xl border border-white/10 bg-[#121824] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
            >
              <option value="" disabled>Select category…</option>
              {isLoading ? (
                <option disabled>Loading categories…</option>
              ) : (
                parentCategoriesComputed?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Subcategory */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Subcategory</label>
            <select
              value={activeMeta.subcategory || ""}
              disabled={!activeMeta.category || subCategories?.length === 0}
              onChange={(e) => updateActiveField("subcategory", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121824] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">None / All</option>
              {subCategories?.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* License & AI Generated & Exclusive Pricing */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* License Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">License</label>
            <select
              value={activeMeta.license || "free"}
              onChange={(e) => updateActiveField("license", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121824] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="editorial">Editorial</option>
            </select>
          </div>

          {/* AI Generated */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">AI Generated?</label>
            <select
              value={activeMeta.aiGenerated || "no"}
              onChange={(e) => updateActiveField("aiGenerated", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121824] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          {/* Exclusive Buyout Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Exclusive Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={activeMeta.exclusive_price || "0.00"}
              onChange={(e) => updateActiveField("exclusive_price", e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300">
              Tags <span className="text-red-400">*</span>
            </label>
            <span className={`text-[10px] font-bold ${tagsColor}`}>
              {tagsCount}/{MAX_TAGS} tags (min {MIN_TAGS}, ideal {IDEAL_TAGS})
            </span>
          </div>

          <textarea
            rows={3}
            value={activeMeta.tags || ""}
            onChange={(e) => updateActiveField("tags", e.target.value)}
            placeholder="vector, background, technology, abstract, pattern (comma separated)"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00D4FF] transition-colors resize-none"
          />

          {/* Tag Suggestions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Suggested Keywords
              </span>
              {tagSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={addAllTagSuggestions}
                  className="text-[10px] font-bold text-[#00D4FF] hover:underline"
                >
                  + Add All ({tagSuggestions.length})
                </button>
              )}
            </div>

            {isLoadingTags ? (
              <div className="flex items-center gap-2 py-1 text-xs text-gray-400">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#00D4FF] border-t-transparent" />
                <span>Finding related keywords…</span>
              </div>
            ) : tagSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag.id || tag.name}
                    type="button"
                    onClick={() => addTagSuggestion(tag.name)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300 hover:border-[#00D4FF] hover:bg-[#00D4FF]/10 hover:text-white transition-all"
                  >
                    <span>+</span>
                    <span>{tag.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                Type in title or description to generate intelligent tags.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Submit Button */}
      <div className="p-6 border-t border-white/10 bg-black/20 rounded-b-2xl space-y-3">
        {isSubmitting && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Publishing assets: {uploadProgress.current}/{uploadProgress.total} ({progressPct}%)</span>
              {speedKBs > 0 && <span>{speedKBs} KB/s</span>}
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00D4FF] to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || selectedFiles.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-cyan-500 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <span>Publishing to Marketplace…</span>
            </>
          ) : (
            <span>🚀 Publish {checkedFiles.size > 0 ? `${checkedFiles.size} Selected` : `All (${selectedFiles.length})`} Assets</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default MetadataForm;
