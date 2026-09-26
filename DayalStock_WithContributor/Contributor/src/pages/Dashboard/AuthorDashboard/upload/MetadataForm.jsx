import { useUpload } from "./UploadContext";

const MetadataForm = () => {
  const {
    selectedFiles, activeFile, activeMeta, updateActiveField, applyToChecked,
    isLoading, parentCategoriesComputed, subCategories,
    isLoadingTags, tagSuggestions, checkedFiles,
    addTagSuggestion, addAllTagSuggestions,
    fetchRelatedTags, handleSubmit,
    isSubmitting, uploadProgress, uploadSpeed,
    filesMetadata, copyMetaSource, setCopyMetaSource, applyMetadataCopy, applyMetadataToAll,
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
  const tagsColor = tagsCount < MIN_TAGS ? "text-red-400" : tagsCount > IDEAL_TAGS ? "text-amber-400" : "text-green-400";

  // Upload speed display
  const speedKBs = Math.round(uploadSpeed / 1024);
  const progressPct = uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0;
  const formatFileName = (fileName, maxLength = 20) => {
    if (!fileName) return "";

    if (fileName.length <= maxLength) {
      return fileName;
    }

    const start = fileName.slice(0, 15); // প্রথম 30 অক্ষর
    const end = fileName.slice(-8); // যেমন 5004.mp4

    return `${start}..........${end}`;
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
            <h3 className="text-lg font-bold text-white">Asset Details</h3>
            <p className="text-xs text-gray-500 font-medium truncate mt-0.5" title={activeFile?.name}>
              Editing: <span className="text-gray-300 font-bold">  {formatFileName(activeFile?.name)}</span>
            </p>
          </div>
          {/* Copy Metadata to All or from another file */}
          {selectedFiles.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={applyMetadataToAll}
                title="Copy current category, description, tags & license to all files"
                className="h-8 rounded-lg bg-[#6C4FE0]/20 border border-[#6C4FE0]/50 px-2.5 text-[11px] font-bold text-[#9B76FF] hover:bg-[#6C4FE0] hover:text-white transition-all shadow-sm flex items-center gap-1"
              >
                ⚡ Apply to All ({selectedFiles.length})
              </button>
              <select
                value={copyMetaSource}
                onChange={e => setCopyMetaSource(e.target.value)}
                className="h-8 rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-gray-300 outline-none focus:border-[#6C4FE0] max-w-[110px]"
              >
                <option value="">📋 Copy from…</option>
                {selectedFiles.filter(f => f.name !== activeFile?.name).map(f => (
                  <option key={f.name} value={f.name} className="bg-[#0F0F1A]">{f.name}</option>
                ))}
              </select>
              {copyMetaSource && (
                <button
                  type="button"
                  onClick={() => applyMetadataCopy(activeFile?.name)}
                  className="h-8 rounded-lg bg-[#6C4FE0]/80 px-2 text-[10px] font-bold text-white hover:bg-[#6C4FE0] transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                Asset Title *
              </label>
              {checkedFiles.size > 0 && (
                <button type="button" onClick={() => applyToChecked("title")} className="text-[10px] font-bold text-[#6C4FE0] hover:text-[#9B76FF] transition-colors">
                  Apply to {checkedFiles.size} selected
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Vintage Floral Pattern Background"
              value={activeMeta.title || ""}
              minLength={MIN_TITLE_LENGTH}
              maxLength={MAX_TITLE_LENGTH}
              onChange={e => updateActiveField("title", e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] transition-colors"
              required
            />
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>Min {MIN_TITLE_LENGTH} · Max {MAX_TITLE_LENGTH} chars</span>
              <span className={(activeMeta.title || "").length < MIN_TITLE_LENGTH ? "text-red-400" : "text-gray-500"}>
                {(activeMeta.title || "").length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          {/* Description — debounced tag fetch on onChange */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                Description
              </label>
              {checkedFiles.size > 0 && (
                <button type="button" onClick={() => applyToChecked("description")} className="text-[10px] font-bold text-[#6C4FE0] hover:text-[#9B76FF] transition-colors">
                  Apply to {checkedFiles.size} selected
                </button>
              )}
            </div>
            <textarea
              placeholder="Describe your artwork in detail…"
              rows={4}
              value={activeMeta.description || ""}
              minLength={MIN_DESCRIPTION_LENGTH}
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={e => {
                const val = e.target.value;
                updateActiveField("description", val);
                // Debounced tag fetch from description
                clearTimeout(descDebounceRef.current);
                descDebounceRef.current = setTimeout(() => {
                  fetchRelatedTags(activeMeta.title || "", val);
                }, 600);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] transition-colors resize-none"
            />
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>Min {MIN_DESCRIPTION_LENGTH} · Max {MAX_DESCRIPTION_LENGTH} chars</span>
              <span className={
                (activeMeta.description || "").length > 0 && (activeMeta.description || "").length < MIN_DESCRIPTION_LENGTH
                  ? "text-red-400" : "text-gray-500"
              }>
                {(activeMeta.description || "").length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
              Category *
            </label>
            <select
              value={activeMeta.category || ""}
              onChange={e => { updateActiveField("category", e.target.value); updateActiveField("subcategory", ""); }}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-gray-300 outline-none focus:border-[#6C4FE0] transition-colors disabled:opacity-50"
              required
            >
              <option value="" disabled className="bg-[#0F0F1A]">
                {isLoading ? "Loading…" : "Select Category"}
              </option>
              {parentCategoriesComputed?.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0F0F1A]">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          {activeMeta.category && (
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                Sub Category
              </label>
              <select
                value={activeMeta.subcategory || ""}
                onChange={e => updateActiveField("subcategory", e.target.value)}
                disabled={!subCategories?.length}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-gray-300 outline-none focus:border-[#6C4FE0] transition-colors disabled:opacity-50"
              >
                <option value="" disabled className="bg-[#0F0F1A]">
                  {subCategories?.length ? "Select Subcategory" : "No subcategory"}
                </option>
                {subCategories?.map(sc => (
                  <option key={sc.id} value={sc.id} className="bg-[#0F0F1A]">{sc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* License */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { value: "free", label: "Free License", activeClass: "border-[#6C4FE0] bg-[#6C4FE0]/10 text-white" },
              { value: "premium", label: "Pro License", activeClass: "border-[#FF6B6B] bg-[#FF6B6B]/10 text-white" },
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => updateActiveField("license", opt.value)}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-3.5 text-xs font-semibold transition-all duration-200 ${activeMeta.license === opt.value ? opt.activeClass : "border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
              >
                {opt.label}
              </div>
            ))}
          </div>

          {/* Exclusive Price */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                Exclusive Buyout Price ($)
              </label>
              {checkedFiles.size > 0 && (
                <button type="button" onClick={() => applyToChecked("exclusive_price")} className="text-[10px] font-bold text-[#6C4FE0] hover:text-[#9B76FF] transition-colors">
                  Apply to {checkedFiles.size} selected
                </button>
              )}
            </div>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={activeMeta.exclusive_price || ""}
              onChange={e => updateActiveField("exclusive_price", e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] transition-colors"
            />
          </div>

          {/* AI Generated */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
              AI Generated? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "no", label: "No", activeClass: "border-white/20 bg-white/5 text-white" },
                { value: "yes", label: "Yes, AI-Generated", activeClass: "border-purple-500 bg-purple-500/10 text-white" },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => updateActiveField("aiGenerated", opt.value)}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all duration-200 ${activeMeta.aiGenerated === opt.value ? opt.activeClass : "border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Tags */}
          {(isLoadingTags || tagSuggestions.length > 0) && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                  Suggested Tags
                  {isLoadingTags && <span className="ml-2 text-gray-600 normal-case font-normal">Loading…</span>}
                </p>
                {tagSuggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={addAllTagSuggestions}
                    className="text-[10px] font-bold text-[#6C4FE0] hover:text-[#9B76FF] transition-colors"
                  >
                    + Add All ({tagSuggestions.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tagSuggestions.map(tag => {
                  const already = getTagsArray(activeMeta.tags || "").includes(tag.name.toLowerCase());
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTagSuggestion(tag.name)}
                      disabled={already}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${already
                        ? "border-green-500/30 bg-green-500/10 text-green-400 cursor-default opacity-60"
                        : "border-[#6C4FE0]/40 bg-[#6C4FE0]/10 text-[#b9aaff] hover:bg-[#6C4FE0]/25"
                        }`}
                    >
                      {already ? "✓" : "+"} {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                Tags (Comma Separated)
              </label>
              {checkedFiles.size > 0 && (
                <button type="button" onClick={() => applyToChecked("tags")} className="text-[10px] font-bold text-[#6C4FE0] hover:text-[#9B76FF] transition-colors">
                  Apply to {checkedFiles.size} selected
                </button>
              )}
            </div>
            <textarea
              rows={4}
              placeholder="vector, floral, abstract, pattern…"
              value={activeMeta.tags || ""}
              onChange={e => {
                updateActiveField("tags", e.target.value);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#6C4FE0] transition-colors resize-none"
            />
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">Min {MIN_TAGS} · Max {MAX_TAGS} · Ideal {IDEAL_TAGS}</span>
              <span className={tagsColor + " font-bold"}>{tagsCount}/{MAX_TAGS}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-white/10 bg-black/20 p-5 rounded-b-2xl shrink-0 backdrop-blur-md space-y-3">
        {/* Global Progress Bar */}
        {isSubmitting && uploadProgress.total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Asset {uploadProgress.current} of {uploadProgress.total}</span>
              {uploadSpeed > 0 && <span>{speedKBs} KB/s</span>}
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white shadow-lg transition-all duration-200 ${isSubmitting
            ? "cursor-not-allowed bg-[#6C4FE0]/50 opacity-80"
            : "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] shadow-[#6C4FE0]/25 hover:opacity-95 hover:shadow-[#6C4FE0]/40 active:scale-[0.99]"
            }`}
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Uploading {uploadProgress.current}/{uploadProgress.total}…</span>
            </>
          ) : checkedFiles.size > 0 ? (
            <span>Submit Checked ({checkedFiles.size}) for Review</span>
          ) : (
            <span>Submit All ({selectedFiles.length}) for Review</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default MetadataForm;
