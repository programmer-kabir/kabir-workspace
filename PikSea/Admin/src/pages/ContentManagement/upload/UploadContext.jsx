import { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import useCategories from "../../../utils/Hooks/useCategories";
import useAuth from "../../../utils/Hooks/useAuth";
import exifr from "exifr";
import * as musicMetadata from "music-metadata-browser";
import Papa from "papaparse";
import axios from "axios";

const UploadContext = createContext(null);
export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [pairedPreviews, setPairedPreviews] = useState({});
  const [groupedMainFiles, setGroupedMainFiles] = useState({});
  const [filesMetadata, setFilesMetadata] = useState(() => {
    try { return JSON.parse(localStorage.getItem("piksea_admin_draft_metadata") || "{}"); }
    catch { return {}; }
  });
  const [previews, setPreviews] = useState({});
  const [fileProgress, setFileProgress] = useState({});
  const [draftIds, setDraftIds] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [checkedFiles, setCheckedFiles] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubcategory, setBulkSubcategory] = useState("");
  const [uploadSummary, setUploadSummary] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [copyMetaSource, setCopyMetaSource] = useState("");
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });

  const descDebounceRef = useRef(null);
  const dragSrcIndexRef = useRef(null);

  // ─── Constants & Formats ─────────────────────────────────────────
  const MAX_TAGS = 50, MIN_TAGS = 5, IDEAL_TAGS = 20;
  const MAX_TITLE_LENGTH = 200, MIN_TITLE_LENGTH = 50;
  const MAX_DESCRIPTION_LENGTH = 500, MIN_DESCRIPTION_LENGTH = 100;
  const mainExtensions = ["jpg", "jpeg", "png", "webp"];
  const previewExtensions = ["jpg", "jpeg", "png", "webp"];
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
  const SIZE_WARN_MB = 50;
  const SIZE_MAX_MB = 80;

  // ─── Hooks ──────────────────────────────────────────────────────
  const { data: categories, isLoading } = useCategories();
  const { user } = useAuth();

  // ─── Auto-save ──────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem("piksea_admin_draft_metadata", JSON.stringify(filesMetadata)); }
    catch { }
  }, [filesMetadata]);

  // ─── Helpers ────────────────────────────────────────────────────
  const getBaseName = (n) => n.replace(/\.[^/.]+$/, "").toLowerCase();
  const getTagsArray = (tags = "") =>
    [...new Set(tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean))];

  const dataURLtoFile = (dataurl, filename) => {
    if (!dataurl || !dataurl.startsWith("data:")) return null;
    let arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    let mime = mimeMatch[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
  };

  const getMetadataStatus = (meta = {}) => {
    const tl = meta.title?.trim().length || 0;
    const dl = meta.description?.trim().length || 0;
    const tc = getTagsArray(meta.tags).length;
    const errors = [];
    if (tl < MIN_TITLE_LENGTH) errors.push(`Title min ${MIN_TITLE_LENGTH} chars`);
    if (tl > MAX_TITLE_LENGTH) errors.push(`Title max ${MAX_TITLE_LENGTH} chars`);
    if (dl > 0 && dl < MIN_DESCRIPTION_LENGTH) errors.push(`Desc min ${MIN_DESCRIPTION_LENGTH} chars`);
    if (dl > MAX_DESCRIPTION_LENGTH) errors.push(`Desc max ${MAX_DESCRIPTION_LENGTH} chars`);
    if (tc < MIN_TAGS) errors.push(`Min ${MIN_TAGS} tags`);
    if (tc > MAX_TAGS) errors.push(`Max ${MAX_TAGS} tags`);
    if (!meta.category) errors.push("Category required");
    return { isComplete: errors.length === 0, message: errors.join(" • ") };
  };

  // ─── Drag & Drop ────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length > 0) handleFilesAdded(e.dataTransfer.files);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) handleFilesAdded(e.target.files);
  };

  // ─── Generate Video Thumbnail ────────────────────────────────────
  const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");

      const createFallback = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1280; canvas.height = 720;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1e1e2f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 100px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("VIDEO", canvas.width / 2, canvas.height / 2);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };

      let timeout = setTimeout(() => {
        video.onerror = null; video.onloadeddata = null; video.onseeked = null;
        URL.revokeObjectURL(url);
        createFallback();
      }, 5000);

      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        const seekTime = (video.duration && isFinite(video.duration)) ? Math.min(1, video.duration / 2) : 1;
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } catch (e) {
          URL.revokeObjectURL(url);
          createFallback();
        }
      };

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        createFallback();
      };
    });
  };

  const cleanTitleFromFilename = (filename) => {
    if (!filename) return "";
    const base = filename.replace(/\.[^/.]+$/, "");
    const clean = base
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean.replace(/\b\w/g, c => c.toUpperCase());
  };

  const extractTagsFromFilename = (filename) => {
    if (!filename) return "";
    const base = filename.replace(/\.[^/.]+$/, "").toLowerCase();
    const stopWords = ["the", "and", "for", "with", "file", "main", "preview", "copy", "set", "bundle", "v1", "v2", "hd", "vector", "png", "jpg", "jpeg", "eps", "psd", "ai"];
    const words = base.split(/[-_\s]+/).filter(w => w.length >= 3 && !stopWords.includes(w));
    return [...new Set(words)].join(", ");
  };

  const generateAutoDescription = (title, contentType = "vector") => {
    if (!title) return "";
    const typeLabel = contentType === "video" ? "stock video footage" : contentType === "photo" ? "high resolution stock photograph" : contentType === "png" ? "transparent PNG element" : "vector graphic illustration";
    return `High quality ${typeLabel} of ${title}. Isolated design element suitable for banners, posters, social media graphics, web design, print templates, and creative projects. High resolution file included.`;
  };

  const handleFilesAdded = (filesList) => {
    const MAX_IMAGE_SIZE = SIZE_MAX_MB * 1024 * 1024;
    const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
    const newFiles = [], newMeta = { ...filesMetadata }, newPrev = { ...previews };
    const videoThumbnails = [];
    const newGrouped = { ...groupedMainFiles };
    const incomingArr = Array.from(filesList);

    const vectorOrArchiveExts = ["eps", "ai", "psd", "zip"];
    const strictPreviewExtensions = ["jpg", "jpeg", "webp"];

    selectedFiles.forEach(f => {
      const base = getBaseName(f.name);
      if (!newGrouped[base]) newGrouped[base] = [f];
    });

    const newPaired = { ...pairedPreviews };

    const sortedIncoming = [...incomingArr].sort((a, b) => {
      const aBase = getBaseName(a.name).toLowerCase();
      const bBase = getBaseName(b.name).toLowerCase();
      const aIsPreviewVideo = ["mp4", "mov", "webm"].includes(a.name.split(".").pop().toLowerCase()) && aBase.includes("preview");
      const bIsPreviewVideo = ["mp4", "mov", "webm"].includes(b.name.split(".").pop().toLowerCase()) && bBase.includes("preview");
      if (aIsPreviewVideo && !bIsPreviewVideo) return 1;
      if (!aIsPreviewVideo && bIsPreviewVideo) return -1;
      return 0;
    });

    sortedIncoming.forEach((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) { toast.error(`"${file.name}" — invalid format.`); return; }

      const isVideo = ["mp4", "mov", "webm"].includes(ext);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

      if (file.size > maxSize) { toast.error(`"${file.name}" exceeds ${isVideo ? 500 : 80} MB.`); return; }

      const base = getBaseName(file.name);
      const autoTitle = cleanTitleFromFilename(file.name);
      const autoTags = extractTagsFromFilename(file.name);
      const autoType = isVideo ? "video" : (["jpg", "jpeg", "webp"].includes(ext) ? "photo" : (ext === "png" ? "png" : "vector"));
      const autoDesc = generateAutoDescription(autoTitle, autoType);

      // Check if this image is a preview for an existing or incoming vector/archive file
      const hasVectorMain = vectorOrArchiveExts.some(vExt =>
        (newGrouped[base] && newGrouped[base].some(f => f.name.toLowerCase().endsWith("." + vExt))) ||
        incomingArr.some(f => getBaseName(f.name) === base && f.name.toLowerCase().endsWith("." + vExt))
      );

      if (strictPreviewExtensions.includes(ext) && hasVectorMain) {
        newPaired[base] = file;
        try {
          const url = URL.createObjectURL(file);
          const primaryFile = (newGrouped[base] && newGrouped[base].find(f => vectorOrArchiveExts.includes(f.name.split(".").pop().toLowerCase()))) || incomingArr.find(f => getBaseName(f.name) === base && vectorOrArchiveExts.includes(f.name.split(".").pop().toLowerCase()));
          if (primaryFile) {
            newPrev[primaryFile.name] = url;
            primaryFile.pairedPreview = file;
          }
        } catch { }
        return;
      }

      // Check if file already exists in selected files
      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        toast.warning(`"${file.name}" already in queue.`);
        return;
      }

      if (mainExtensions.includes(ext)) {
        if (!newGrouped[base]) newGrouped[base] = [];
        if (!newGrouped[base].some(f => f.name === file.name && f.size === file.size)) {
          const existingVideo = newGrouped[base].find(f => ["mp4", "mov", "webm"].includes(f.name.split(".").pop().toLowerCase()));
          if (existingVideo && isVideo) {
            newPaired[base] = file;
            toast.info(`🎬 "${file.name}" set as preview video for "${existingVideo.name}"`);
            return;
          }

          if (isVideo && base.includes("preview")) {
            const mainVideoBases = Object.keys(newGrouped).filter(b => {
              const videoInGroup = newGrouped[b].find(f => ["mp4", "mov", "webm"].includes(f.name.split(".").pop().toLowerCase()));
              return videoInGroup && !newPaired[b];
            });
            const incomingMainVideos = incomingArr.filter(f => {
              const fExt = f.name.split(".").pop().toLowerCase();
              return ["mp4", "mov", "webm"].includes(fExt) && !getBaseName(f.name).includes("preview") && f !== file;
            });

            const targetBase = mainVideoBases[0] || (incomingMainVideos.length === 1 ? getBaseName(incomingMainVideos[0].name) : null);
            if (targetBase) {
              newPaired[targetBase] = file;
              toast.info(`🎬 "${file.name}" set as preview video`);
              return;
            }
          }

          newGrouped[base].push(file);
        }
      }

      newFiles.push(file);

      newMeta[file.name] = {
        title: newMeta[file.name]?.title?.trim() ? newMeta[file.name].title : autoTitle,
        description: newMeta[file.name]?.description?.trim() ? newMeta[file.name].description : autoDesc,
        category: newMeta[file.name]?.category || "",
        subcategory: newMeta[file.name]?.subcategory || "",
        license: newMeta[file.name]?.license || "free",
        aiGenerated: newMeta[file.name]?.aiGenerated || "no",
        tags: newMeta[file.name]?.tags?.trim() ? newMeta[file.name].tags : autoTags,
        content_type: autoType,
        exclusive_price: newMeta[file.name]?.exclusive_price || "0.00"
      };

      if (["jpg", "jpeg", "png", "svg", "webp"].includes(ext)) {
        try { newPrev[file.name] = URL.createObjectURL(file); } catch { }
      } else if (isVideo) {
        videoThumbnails.push(file);
      }
    });

    if (newFiles.length === 0) return;
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPairedPreviews(newPaired);
    setGroupedMainFiles(newGrouped);
    setFilesMetadata(prev => ({ ...prev, ...newMeta }));
    setPreviews(prev => ({ ...prev, ...newPrev }));
    if (selectedFiles.length === 0 && newFiles.length > 0) setActiveFileIndex(0);
    if (newFiles.length > 0) toast.success(`✅ Added ${newFiles.length} item(s).`);

    // Asynchronous background chunked processing for metadata
    const queue = [...newFiles];
    const processQueue = () => {
      if (queue.length === 0) return;
      const batch = queue.splice(0, 5);
      batch.forEach(f => {
        const ext = f.name.split(".").pop().toLowerCase();
        if (["mp4", "mov", "webm"].includes(ext)) {
          parseVideoMetadata(f);
        } else if (previewExtensions.includes(ext) || ext === "svg") {
          parseImageMetadata(f);
        }
      });
      if (queue.length > 0) {
        setTimeout(processQueue, 30);
      }
    };
    setTimeout(processQueue, 10);

    // Asynchronous video thumbnails
    if (videoThumbnails.length > 0) {
      const vQueue = [...videoThumbnails];
      const processVQueue = () => {
        if (vQueue.length === 0) return;
        const vf = vQueue.shift();
        generateVideoThumbnail(vf).then(thumb => {
          if (thumb) {
            setPreviews(prev => ({ ...prev, [vf.name]: thumb }));
          }
          if (vQueue.length > 0) setTimeout(processVQueue, 50);
        });
      };
      setTimeout(processVQueue, 50);
    }
  };

  const handleRemoveFile = async (index) => {
    const file = selectedFiles[index];
    const remoteId = draftIds[file.name];
    const isRealDraft = remoteId && remoteId !== "uploading" && remoteId !== "error";

    if (isRealDraft) {
      try {
        const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";
        const headers = {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026"
        };
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = "Bearer " + token;
        }
        await fetch(`${API_BASE}/contents/deleteDraft.php`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content_id: remoteId }),
        });
      } catch (e) {
        console.warn("Could not delete draft from server:", e);
      }
    }

    if (previews[file.name]) URL.revokeObjectURL(previews[file.name]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilesMetadata(prev => { const n = { ...prev }; delete n[file.name]; return n; });
    setPreviews(prev => { const n = { ...prev }; delete n[file.name]; return n; });
    setFileProgress(prev => { const n = { ...prev }; delete n[file.name]; return n; });
    setDraftIds(prev => { const n = { ...prev }; delete n[file.name]; return n; });
    setCheckedFiles(prev => { const n = new Set(prev); n.delete(file.name); return n; });
    if (activeFileIndex >= selectedFiles.length - 1)
      setActiveFileIndex(Math.max(0, selectedFiles.length - 2));
  };

  const handleBulkDelete = async () => {
    if (checkedFiles.size === 0) return;
    let token = null;
    if (user) {
      try { token = await user.getIdToken(); } catch (e) { }
    }
    const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";

    checkedFiles.forEach(name => {
      const remoteId = draftIds[name];
      const isRealDraft = remoteId && remoteId !== "uploading" && remoteId !== "error";
      if (isRealDraft) {
        const headers = {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026"
        };
        if (token) headers["Authorization"] = "Bearer " + token;

        fetch(`${API_BASE}/contents/deleteDraft.php`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content_id: remoteId }),
        }).catch(e => console.warn("Could not delete bulk draft:", e));
      }
      if (previews[name]) URL.revokeObjectURL(previews[name]);
    });

    setSelectedFiles(prev => prev.filter(f => !checkedFiles.has(f.name)));
    setFilesMetadata(prev => { const n = { ...prev }; checkedFiles.forEach(k => delete n[k]); return n; });
    setPreviews(prev => { const n = { ...prev }; checkedFiles.forEach(k => delete n[k]); return n; });
    setFileProgress(prev => { const n = { ...prev }; checkedFiles.forEach(k => delete n[k]); return n; });
    setDraftIds(prev => { const n = { ...prev }; checkedFiles.forEach(k => delete n[k]); return n; });
    setPairedPreviews(prev => {
      const n = { ...prev };
      checkedFiles.forEach(k => { const b = getBaseName(k); delete n[b]; });
      return n;
    });

    toast.success(`🗑 Deleted ${checkedFiles.size} file(s).`);
    setCheckedFiles(new Set());
    setActiveFileIndex(0);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        let matchCount = 0;
        setFilesMetadata(prev => {
          const newMeta = { ...prev };
          results.data.forEach(row => {
            const filename = row.Filename || row.filename || row.name || row.Name;
            if (!filename) return;
            const csvBase = getBaseName(filename).toLowerCase();
            const matched = selectedFiles.filter(f => getBaseName(f.name).toLowerCase() === csvBase);
            if (matched.length === 0) return;
            let catId = "", subId = "";
            if (row.Category) {
              const pc = parentCategoriesComputed?.find(c => c.name.toLowerCase() === row.Category.trim().toLowerCase());
              if (pc) {
                catId = String(pc.id);
                const sub = (row.Subcategory || row["Sub Category"] || "").trim();
                if (sub) {
                  const sc = categories?.find(c => String(c.parent_id) === catId && c.name.toLowerCase() === sub.toLowerCase());
                  if (sc) subId = String(sc.id);
                }
              }
            }
            matched.forEach(mf => {
              newMeta[mf.name] = {
                ...newMeta[mf.name],
                title: (row.Title || row.title || "").trim() || newMeta[mf.name]?.title || "",
                description: (row.Description || row.description || "").trim() || newMeta[mf.name]?.description || "",
                category: catId || prev[mf.name]?.category || "",
                subcategory: subId || prev[mf.name]?.subcategory || "",
                tags: (row.Tags || row.tags || row.Keywords || row.keywords || "").trim() || newMeta[mf.name]?.tags || "",
              };
            });
            matchCount++;
          });
          return newMeta;
        });
        if (matchCount > 0) toast.success(`✅ Applied metadata to ${matchCount} group(s).`);
        else toast.warning("No matching files. Check Filename column.");
      },
      error: (err) => toast.error("CSV parse error: " + err.message),
    });
    e.target.value = null;
  };

  const exportCSV = () => {
    const countable = ["jpg", "jpeg", "png", "webp", "svg"];
    const rows = selectedFiles
      .filter(f => countable.includes(f.name.split(".").pop().toLowerCase()))
      .map(f => {
        const m = filesMetadata[f.name] || {};
        const pc = parentCategoriesComputed?.find(c => String(c.id) === String(m.category));
        const sc = categories?.find(c => String(c.id) === String(m.subcategory));
        return { Filename: f.name, Title: m.title || "", Description: m.description || "", Category: pc?.name || "", Subcategory: sc?.name || "", Tags: m.tags || "", License: m.license || "free", AIGenerated: m.aiGenerated || "no" };
      });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "piksea_metadata.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("📥 CSV exported!");
  };

  const parseImageMetadata = async (file) => {
    try {
      let title = "";
      let desc = "";
      let tags = [];

      let meta;
      try {
        meta = await exifr.parse(file, { xmp: true, tiff: true, iptc: true, exif: true });
      } catch (e) { }

      if (meta) {
        const decode = (s) => {
          if (!s || typeof s !== "string") return "";
          return new DOMParser().parseFromString(s, "text/html").documentElement.textContent || s;
        };
        const extract = (v) => {
          if (!v) return "";
          if (typeof v === "string") return v;
          if (typeof v === "object" && v.value) return v.value;
          if (Array.isArray(v) && v.length > 0) return extract(v[0]);
          return String(v);
        };
        const extractTags = (td) => {
          if (!td) return [];
          if (Array.isArray(td)) return td;
          if (typeof td === "string") return td.split(/[,;\n]/).map(t => t.trim()).filter(Boolean);
          return [];
        };

        const mTitle = decode(extract(meta.XPTitle || meta.title || meta.Title || meta.ObjectName || meta.Headline || ""));
        const mDesc = decode(extract(meta.XPSubject || meta.subject || meta.Subject || meta.ImageDescription || meta.description || meta.Description || meta.Caption || meta.CaptionAbstract || meta.XPComment || ""));

        let tagsArr = [];
        if (meta.XPKeywords) tagsArr = extractTags(meta.XPKeywords);
        else if (meta.Keywords) tagsArr = extractTags(meta.Keywords);
        else if (meta.keywords) tagsArr = extractTags(meta.keywords);
        else if (meta.Tags) tagsArr = extractTags(meta.Tags);

        if (mTitle && mTitle.length > 2) title = mTitle;
        if (mDesc && mDesc.length > 2) desc = mDesc;
        if (tagsArr.length > 0) tags = tagsArr.map(t => decode(t)).filter(Boolean);
      }

      if (title || desc || tags.length > 0) {
        setFilesMetadata(prev => {
          const ut = title || prev[file.name]?.title || "";
          const ud = desc || prev[file.name]?.description || "";
          return {
            ...prev,
            [file.name]: {
              ...prev[file.name],
              title: ut,
              description: ud,
              tags: tags.length > 0 ? tags.join(", ") : prev[file.name]?.tags || ""
            }
          };
        });
      }
    } catch (e) {
      console.warn("Fast image metadata parse skipped for:", file.name, e);
    }
  };

  const parseVideoMetadata = async (file) => {
    try {
      let title = "", desc = "", tags = [];

      const looksLikeTagList = (text) => {
        if (!text || typeof text !== "string" || text.length < 5) return false;
        const parts = text.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        if (parts.length < 4) return false;
        const avg = parts.reduce((a, b) => a + b.length, 0) / parts.length;
        return avg < 25;
      };
      const splitTags = (str) => str.split(/[,;\n]/).map(t => t.trim()).filter(Boolean);

      let mmeta;
      try { mmeta = await musicMetadata.parseBlob(file); } catch (_) { }

      if (mmeta?.common) {
        const { title: mT, subtitle, description, comment, keywords, lyrics, album } = mmeta.common;
        if (mT) title = mT;

        const descCandidates = [
          subtitle?.[0],
          lyrics?.[0]?.text,
          description?.[0],
          album,
        ].filter(v => v && typeof v === "string" && v.length > 10);

        for (const c of descCandidates) {
          if (!looksLikeTagList(c)) { desc = c; break; }
        }

        const tagPool = [];
        if (keywords?.length) tagPool.push(...keywords);
        comment?.forEach(c => { if (typeof c === "string") tagPool.push(...splitTags(c)); });
        description?.forEach(d => { if (typeof d === "string" && looksLikeTagList(d)) tagPool.push(...splitTags(d)); });
        if (tagPool.length) tags = [...new Set(tagPool)];
      }

      const CHUNK = 5 * 1024 * 1024;
      const headBuf = await file.slice(0, CHUNK).arrayBuffer();
      const tailBuf = await file.slice(Math.max(0, file.size - CHUNK)).arrayBuffer();

      const parseXtra = (buf) => {
        const view = new DataView(buf); const bytes = new Uint8Array(buf);
        let off = -1;
        for (let i = 0; i < bytes.length - 16; i++) {
          if (bytes[i] === 0x5a && bytes[i + 1] === 0x04 && bytes[i + 2] === 0x97 && bytes[i + 3] === 0xf5 &&
            bytes[i + 4] === 0x46 && bytes[i + 5] === 0x62 && bytes[i + 6] === 0xce && bytes[i + 7] === 0x11 &&
            bytes[i + 8] === 0x8f && bytes[i + 9] === 0xb2 && bytes[i + 10] === 0x00 && bytes[i + 11] === 0x20) {
            off = i + 16; break;
          }
        }
        if (off === -1) return {};
        const out = {}; const dec16 = new TextDecoder("utf-16le"); let pos = off;
        while (pos + 8 < bytes.length) {
          const sz = view.getUint32(pos, true); if (sz < 16 || pos + sz > bytes.length) break;
          const nl = view.getUint32(pos + 4, true); if (pos + 8 + nl > bytes.length) break;
          let name = "";
          for (let i = 0; i < nl; i++) if (bytes[pos + 8 + i] !== 0) name += String.fromCharCode(bytes[pos + 8 + i]);
          let vp = pos + 8 + nl; const vc = view.getUint32(vp, true); vp += 4;
          if (vc > 0 && vp + 8 <= bytes.length) {
            const vals = [];
            for (let v = 0; v < vc; v++) {
              if (vp + 8 > bytes.length) break;
              const vsz = view.getUint32(vp, true); const vt = view.getUint32(vp + 4, true); vp += 8;
              if (vt === 8 && vsz >= 2) vals.push(dec16.decode(bytes.slice(vp, vp + vsz - 2)));
              vp += vsz - 8;
            }
            if (vals.length) out[name] = vals.join(", ");
          }
          pos += sz;
        }
        return out;
      };
      const xtra = { ...parseXtra(headBuf), ...parseXtra(tailBuf) };
      const getX = (...keys) => {
        for (const k of keys) {
          const f = Object.keys(xtra).find(xk => xk.toLowerCase() === k.toLowerCase() || xk.toLowerCase() === `wm/${k.toLowerCase()}`);
          if (f) return xtra[f];
        }
        return null;
      };

      if (!title) { const v = getX("title"); if (v) title = v; }
      if (!desc) {
        const xSub = getX("subtitle"); const xDes = getX("description");
        if (xSub && !looksLikeTagList(xSub)) desc = xSub;
        else if (xDes && !looksLikeTagList(xDes)) desc = xDes;
      }
      if (tags.length === 0) {
        const xT = getX("keywords", "keyword", "tags", "tag", "comments", "comment");
        if (xT) tags = splitTags(xT);
      }

      if (title.length <= 2) title = "";
      if (desc.length <= 2) desc = "";
      tags = [...new Set(tags.filter(t => t.length > 1))];
      if (desc && tags.length === 0 && looksLikeTagList(desc)) { tags = splitTags(desc); desc = ""; }

      if (title || desc || tags.length > 0) {
        setFilesMetadata(prev => {
          const ut = title || prev[file.name]?.title || "";
          const ud = desc || prev[file.name]?.description || "";
          if (ut || ud) fetchRelatedTags(ut, ud);
          return { ...prev, [file.name]: { ...prev[file.name], title: ut, description: ud, tags: tags.length > 0 ? tags.join(", ") : prev[file.name]?.tags || "" } };
        });
        toast.info(`✨ Metadata auto-filled for "${file.name}"!`);
      }
    } catch (e) {
      console.error("Video parsing error:", e);
    }
  };

  const updateActiveField = (field, value) => {
    const af = selectedFiles[activeFileIndex];
    if (!af) return;
    setFilesMetadata(prev => ({ ...prev, [af.name]: { ...prev[af.name], [field]: value } }));
  };

  const applyToChecked = (field) => {
    if (checkedFiles.size === 0) return;
    const af = selectedFiles[activeFileIndex];
    if (!af) return;
    const val = filesMetadata[af.name]?.[field];

    setFilesMetadata(prev => {
      const n = { ...prev };
      checkedFiles.forEach(fname => {
        n[fname] = { ...n[fname], [field]: val };
      });
      return n;
    });
    toast.success(`Applied to ${checkedFiles.size} selected files!`);
  };

  const applyMetadataCopy = (targetFileName) => {
    if (!copyMetaSource || !targetFileName) return;
    const src = filesMetadata[copyMetaSource];
    if (!src) return;
    setFilesMetadata(prev => ({ ...prev, [targetFileName]: { ...prev[targetFileName], title: src.title, description: src.description, category: src.category, subcategory: src.subcategory, license: src.license, aiGenerated: src.aiGenerated, tags: src.tags, exclusive_price: src.exclusive_price } }));
    toast.success(`📋 Metadata copied from "${copyMetaSource}"!`);
  };

  const applyMetadataToAll = () => {
    const af = selectedFiles[activeFileIndex];
    if (!af) return;
    const src = filesMetadata[af.name];
    if (!src) return;

    setFilesMetadata(prev => {
      const n = { ...prev };
      selectedFiles.forEach(f => {
        if (f.name !== af.name) {
          const autoTitle = cleanTitleFromFilename(f.name);
          const autoTags = extractTagsFromFilename(f.name);
          n[f.name] = {
            ...n[f.name],
            title: (n[f.name]?.title && n[f.name].title.trim() !== "") ? n[f.name].title : autoTitle,
            description: src.description || n[f.name]?.description || "",
            category: src.category || n[f.name]?.category || "",
            subcategory: src.subcategory || n[f.name]?.subcategory || "",
            license: src.license || "free",
            aiGenerated: src.aiGenerated || "no",
            tags: (src.tags && src.tags.trim() !== "") ? src.tags : (n[f.name]?.tags || autoTags),
            exclusive_price: src.exclusive_price || n[f.name]?.exclusive_price || "0.00"
          };
        }
      });
      return n;
    });
    toast.success(`⚡ Applied metadata to all ${selectedFiles.length} file(s)!`);
  };

  const fetchRelatedTags = async (titleValue = "", descriptionValue = "") => {
    const text = `${descriptionValue} ${titleValue}`.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
    const stopWords = ["the", "and", "for", "with", "from", "this", "that", "these", "those", "into", "onto", "over", "under", "near", "high", "quality", "beautiful", "image", "photo", "vector", "background", "illustration", "design", "artwork", "graphic", "isolated", "white", "black", "modern", "creative", "digital"];
    const words = [...new Set(text.split(/\s+/))].filter(w => w.length >= 3 && !stopWords.includes(w)).slice(0, 8);
    if (words.length === 0) { setTagSuggestions([]); return; }
    try {
      setIsLoadingTags(true);
      const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";
      const results = await Promise.all(
        words.map(w => fetch(`${API_BASE}/tags/getTags.php?search=${encodeURIComponent(w)}&limit=8`).then(r => r.json()))
      );
      const merged = results.filter(r => r.success).flatMap(r => r.data || []);
      setTagSuggestions([...new Map(merged.map(t => [t.name.toLowerCase(), t])).values()].slice(0, 20));
    } catch { setTagSuggestions([]); }
    finally { setIsLoadingTags(false); }
  };

  const addTagSuggestion = (tagName) => {
    const current = getTagsArray(filesMetadata[selectedFiles[activeFileIndex]?.name]?.tags || "");
    if (current.some(t => t === tagName.toLowerCase())) { toast.info(`"${tagName}" already added.`); return; }
    if (current.length >= MAX_TAGS) { toast.warning(`Max ${MAX_TAGS} tags allowed.`); return; }
    updateActiveField("tags", [...current, tagName].join(", "));
  };

  const addAllTagSuggestions = () => {
    const current = getTagsArray(filesMetadata[selectedFiles[activeFileIndex]?.name]?.tags || "");
    const newTags = tagSuggestions.map(t => t.name.toLowerCase()).filter(t => !current.includes(t));
    const combined = [...current, ...newTags].slice(0, MAX_TAGS);
    updateActiveField("tags", combined.join(", "));
    toast.success(`Added ${Math.min(newTags.length, MAX_TAGS - current.length)} suggested tags!`);
  };

  const handleCardDragStart = (e, index) => {
    dragSrcIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("card-reorder", String(index));
  };

  const handleCardDragOver = (e, index) => {
    if (!e.dataTransfer.types.includes("card-reorder")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleCardDrop = (e, toIndex) => {
    if (!e.dataTransfer.types.includes("card-reorder")) return;
    e.preventDefault();
    const fromIndex = dragSrcIndexRef.current;
    if (fromIndex === null || fromIndex === toIndex) { setDragOverIndex(null); return; }
    setSelectedFiles(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
    setActiveFileIndex(toIndex);
    dragSrcIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleCardDragEnd = () => {
    dragSrcIndexRef.current = null;
    setDragOverIndex(null);
  };

  const generateSvgPreview = (svgFile) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgFile);
    const img = new Image();
    img.onload = () => {
      const TARGET_SIZE = 1200;
      let w = img.width || TARGET_SIZE;
      let h = img.height || TARGET_SIZE;

      if (w < TARGET_SIZE && h < TARGET_SIZE) {
        const scale = Math.max(TARGET_SIZE / w, TARGET_SIZE / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        blob ? resolve(new File([blob], svgFile.name.replace(/\.svg$/i, ".png"), { type: "image/png" }))
          : reject(new Error("Canvas to Blob failed"));
      }, "image/png", 0.9);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG load failed")); };
    img.src = url;
  });

  const doUploadAsset = async (asset, metaKey) => {
    setDraftIds(prev => ({ ...prev, [metaKey]: "uploading" }));
    try {
      const formData = new FormData();
      formData.append("is_draft", "true");

      const ext = asset.mainFile.name.split(".").pop().toLowerCase();
      let contentType = "image";
      if (ext === "png") contentType = "png";

      formData.append("content_type", contentType);
      formData.append("preview_file", asset.previewFile);
      if (asset.previewVideo) {
        formData.append("preview_video", asset.previewVideo);
      }
      if (asset.groupedFiles && asset.groupedFiles.length > 0) {
        asset.groupedFiles.forEach(f => formData.append("main_files[]", f));
      } else if (asset.mainFile !== asset.previewFile) {
        formData.append("main_files[]", asset.mainFile);
      }

      const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";
      const headers = {
        "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026"
      };
      if (user) { const token = await user.getIdToken(); headers["Authorization"] = "Bearer " + token; }
      const start = Date.now();
      const res = await axios.post(API_BASE + "/contents/uploadContent.php", formData, {
        headers,
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setFileProgress(prev => ({ ...prev, [metaKey]: pct }));
          const elapsed = (Date.now() - start) / 1000;
          if (elapsed > 0) setUploadSpeed(Math.round(e.loaded / elapsed));
        },
      });
      if (res.data.success && res.data.content_id) {
        setDraftIds(prev => ({ ...prev, [metaKey]: res.data.content_id }));
        const baseUrl = import.meta.env.VITE_IMG_KEY || "";
        const serverPreview = res.data.thumbnail_url || res.data.preview_image;
        if (serverPreview) {
          const fullUrl = serverPreview.startsWith("http") ? serverPreview : `${baseUrl}/${serverPreview}`;
          setPreviews(prev => ({ ...prev, [metaKey]: fullUrl }));
        }
        if (res.data.extracted_title || res.data.extracted_description || res.data.extracted_tags) {
          setFilesMetadata(prev => {
            const current = prev[metaKey] || {};
            return {
              ...prev,
              [metaKey]: {
                ...current,
                title: current.title || res.data.extracted_title || "",
                description: current.description || res.data.extracted_description || "",
                tags: current.tags || res.data.extracted_tags || ""
              }
            };
          });
        }
      } else {
        setDraftIds(prev => ({ ...prev, [metaKey]: "error" }));
        toast.error(`Upload failed: ${res.data.message || "Unknown error"}`);
      }
    } catch (err) {
      setDraftIds(prev => ({ ...prev, [metaKey]: "error" }));
      toast.error(`Upload error: ${err.response?.data?.message || err.message}`);
    }
  };

  // ─── AI Metadata Generation ──────────────────────────────────────
  const generateSingleAIMetadata = async (fileObj) => {
    const file = fileObj || activeFile;
    if (!file) return;
    const metaKey = file.name;
    const base = getBaseName(file.name);
    const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";

    setIsGeneratingAI(true);
    const toastId = toast.loading(`✨ Generating AI metadata for ${file.name}...`);

    try {
      const headers = {
        "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026",
      };
      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      const fd = new FormData();
      const remoteId = draftIds[metaKey];
      if (remoteId && typeof remoteId === "number") {
        fd.append("content_id", remoteId);
      }

      const previewSrc = previews[metaKey];
      if (previewSrc && typeof previewSrc === "string" && previewSrc.startsWith("data:")) {
        fd.append("base64_image", previewSrc);
      } else if (pairedPreviews[base]) {
        fd.append("preview_file", pairedPreviews[base]);
      } else {
        fd.append("preview_file", file);
      }

      const res = await axios.post(`${API_BASE}/ai/generate_metadata.php`, fd, { headers });

      if (res.data?.success && res.data?.data) {
        const aiData = res.data.data;
        setFilesMetadata((prev) => {
          const curr = prev[metaKey] || {};
          return {
            ...prev,
            [metaKey]: {
              ...curr,
              title: aiData.title || curr.title || "",
              description: aiData.description || curr.description || "",
              tags: aiData.tags || curr.tags || "",
              category: aiData.category_id ? String(aiData.category_id) : curr.category || "",
              subcategory: aiData.subcategory_id ? String(aiData.subcategory_id) : curr.subcategory || "",
              contentType: aiData.content_type || curr.contentType || "vector",
              aiGenerated: "yes",
            },
          };
        });
        toast.update(toastId, {
          render: `✨ AI generated Title, Description & ${aiData.tags_count} Tags!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        throw new Error(res.data?.message || "Failed to generate metadata");
      }
    } catch (err) {
      toast.update(toastId, {
        render: `AI Error: ${err.response?.data?.message || err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateBulkAIMetadata = async () => {
    const targets =
      checkedFiles.size > 0
        ? selectedFiles.filter((f) => checkedFiles.has(f.name))
        : selectedFiles;

    if (targets.length === 0) {
      toast.info("No files selected for AI metadata generation.");
      return;
    }

    const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";
    setIsGeneratingAI(true);
    setAiProgress({ current: 0, total: targets.length });
    const toastId = toast.loading(`✨ AI processing 1 of ${targets.length} files...`);

    let successCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const file = targets[i];
      setAiProgress({ current: i + 1, total: targets.length });
      toast.update(toastId, {
        render: `✨ AI processing (${i + 1}/${targets.length}): ${file.name}...`,
        isLoading: true,
      });

      try {
        const headers = {
          "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026",
        };
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }

        const fd = new FormData();
        const metaKey = file.name;
        const base = getBaseName(file.name);
        const remoteId = draftIds[metaKey];
        if (remoteId && typeof remoteId === "number") {
          fd.append("content_id", remoteId);
        }

        const previewSrc = previews[metaKey];
        if (previewSrc && typeof previewSrc === "string" && previewSrc.startsWith("data:")) {
          fd.append("base64_image", previewSrc);
        } else if (pairedPreviews[base]) {
          fd.append("preview_file", pairedPreviews[base]);
        } else {
          fd.append("preview_file", file);
        }

        const res = await axios.post(`${API_BASE}/ai/generate_metadata.php`, fd, { headers });
        if (res.data?.success && res.data?.data) {
          const aiData = res.data.data;
          setFilesMetadata((prev) => {
            const curr = prev[metaKey] || {};
            return {
              ...prev,
              [metaKey]: {
                ...curr,
                title: aiData.title || curr.title || "",
                description: aiData.description || curr.description || "",
                tags: aiData.tags || curr.tags || "",
                category: aiData.category_id ? String(aiData.category_id) : curr.category || "",
                subcategory: aiData.subcategory_id ? String(aiData.subcategory_id) : curr.subcategory || "",
                contentType: aiData.content_type || curr.contentType || "vector",
                aiGenerated: "yes",
              },
            };
          });
          successCount++;
        }
      } catch (err) {
        console.error(`AI generation error for ${file.name}:`, err);
      }
    }

    setIsGeneratingAI(false);
    setAiProgress({ current: 0, total: 0 });
    toast.update(toastId, {
      render: `🎉 AI Generated metadata for ${successCount} of ${targets.length} assets!`,
      type: "success",
      isLoading: false,
      autoClose: 4000,
    });
  };

  useEffect(() => {
    if (selectedFiles.length === 0) return;
    const autoUpload = async () => {
      const mainFiles = selectedFiles.filter(f => mainExtensions.includes(f.name.split(".").pop().toLowerCase()));
      const imageFiles = selectedFiles.filter(f => previewExtensions.includes(f.name.split(".").pop().toLowerCase()));
      const assets = [];
      const usedPreviews = new Set();
      for (const mf of mainFiles) {
        if (draftIds[mf.name]) continue;
        const base = getBaseName(mf.name);
        const ext = mf.name.split(".").pop().toLowerCase();
        const isVideo = ["mp4", "mov", "webm"].includes(ext);
        const isStandaloneImage = ["jpg", "jpeg", "png", "webp"].includes(ext);

        let pf = null;
        let generated = false;

        if (isVideo) {
          const thumb = previews[mf.name];
          if (thumb && typeof thumb === "string" && thumb.startsWith("data:")) {
            pf = dataURLtoFile(thumb, base + "-preview.jpg");
            generated = true;
          } else if (thumb && typeof thumb === "string" && thumb.startsWith("blob:")) {
            try {
              const resp = await fetch(thumb);
              const blob = await resp.blob();
              pf = new File([blob], base + "-preview.jpg", { type: "image/jpeg" });
              generated = true;
            } catch {
              continue;
            }
          } else {
            continue;
          }
        } else if (isStandaloneImage) {
          pf = mf;
        } else {
          pf = pairedPreviews[base];
          if (!pf) {
            const groupFiles = groupedMainFiles[base] || [mf];
            const svgFile = groupFiles.find(f => f.name.toLowerCase().endsWith(".svg"));
            if (svgFile) {
              try { pf = await generateSvgPreview(svgFile); generated = true; } catch { continue; }
            } else {
              pf = mf;
            }
          }
        }
        if (!generated && pf && pf.name) usedPreviews.add(pf.name);

        const pairedPreviewVideo = pairedPreviews[base];
        const hasPreviewVideo = pairedPreviewVideo && ["mp4", "mov", "webm"].includes(
          pairedPreviewVideo.name.split(".").pop().toLowerCase()
        );

        assets.push({
          mainFile: mf,
          groupedFiles: groupedMainFiles[base] || [mf],
          previewFile: pf,
          previewVideo: hasPreviewVideo ? pairedPreviewVideo : null
        });
      }
      for (const img of imageFiles) {
        if (usedPreviews.has(img.name) || draftIds[img.name]) continue;
        assets.push({ mainFile: img, previewFile: img });
      }
      for (const asset of assets) await doUploadAsset(asset, asset.mainFile.name);
    };
    autoUpload();
  }, [selectedFiles, pairedPreviews, user]); // eslint-disable-line

  const retryFile = async (fileName) => {
    const mainFile = selectedFiles.find(f => f.name === fileName);
    if (!mainFile) return;
    const ext = fileName.split(".").pop().toLowerCase();
    let previewFile = mainFile;
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      previewFile = mainFile;
    } else if (["mp4", "mov", "webm"].includes(ext)) {
      if (previews[mainFile.name] && typeof previews[mainFile.name] === "string" && previews[mainFile.name].startsWith("data:")) {
        previewFile = dataURLtoFile(previews[mainFile.name], getBaseName(fileName) + "-preview.jpg");
      } else {
        toast.error("Video thumbnail not ready for retry."); return;
      }
    } else if (ext === "svg") {
      try { previewFile = await generateSvgPreview(mainFile); }
      catch { toast.error("Cannot generate SVG preview for retry."); return; }
    } else {
      const base = getBaseName(fileName);
      const found = pairedPreviews[base] || selectedFiles.find(f => previewExtensions.includes(f.name.split(".").pop().toLowerCase()) && getBaseName(f.name) === base);
      if (found) previewFile = found;
      else { toast.error("No preview file found for retry."); return; }
    }
    await doUploadAsset({ mainFile, previewFile }, fileName);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const filesToSubmit = checkedFiles.size > 0
      ? selectedFiles.filter(f => checkedFiles.has(f.name))
      : selectedFiles;

    const mainFiles = filesToSubmit.filter(f => mainExtensions.includes(f.name.split(".").pop().toLowerCase()));
    const imageFiles = filesToSubmit.filter(f => previewExtensions.includes(f.name.split(".").pop().toLowerCase()));
    if (mainFiles.length === 0 && imageFiles.length === 0) { toast.error("At least one file required."); return; }

    const uploadAssets = [], usedPreviews = new Set();

    for (const mf of mainFiles) {
      const base = getBaseName(mf.name);
      const ext = mf.name.split(".").pop().toLowerCase();
      let pf = null;
      let generated = false;

      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        pf = mf;
      } else if (["mp4", "mov", "webm"].includes(ext)) {
        const thumb = previews[mf.name];
        if (thumb && typeof thumb === "string" && thumb.startsWith("data:")) {
          pf = dataURLtoFile(thumb, base + "-preview.jpg");
          generated = true;
        } else if (thumb && typeof thumb === "string" && thumb.startsWith("blob:")) {
          try {
            const resp = await fetch(thumb);
            const blob = await resp.blob();
            pf = new File([blob], base + "-preview.jpg", { type: "image/jpeg" });
            generated = true;
          } catch {
            toast.error(`Could not use video thumbnail for "${mf.name}".`); return;
          }
        } else {
          toast.info(`⏳ Generating thumbnail for "${mf.name}"...`);
          try {
            const thumbDataUrl = await generateVideoThumbnail(mf);
            if (thumbDataUrl && thumbDataUrl.startsWith("data:")) {
              pf = dataURLtoFile(thumbDataUrl, base + "-preview.jpg");
              generated = true;
            } else {
              toast.error(`Could not generate thumbnail for "${mf.name}".`); return;
            }
          } catch {
            toast.error(`Thumbnail generation failed for "${mf.name}".`); return;
          }
        }
      } else {
        pf = pairedPreviews[base];
        if (!pf) {
          const groupFiles = groupedMainFiles[base] || [mf];
          const svgFile = groupFiles.find(f => f.name.toLowerCase().endsWith(".svg"));

          if (svgFile) {
            try { toast.info(`Generating preview from ${svgFile.name}...`); pf = await generateSvgPreview(svgFile); generated = true; }
            catch { pf = null; }
          } else {
            pf = mf;
          }
        }
      }
      const metaKey = (generated || !pf) ? mf.name : pf.name;
      const m = filesMetadata[metaKey] || filesMetadata[mf.name] || {};
      if (!m.title?.trim()) { toast.error(`Title missing for "${mf.name}"`); setActiveFileIndex(selectedFiles.findIndex(f => f.name === mf.name)); return; }
      if (!m.category) { toast.error(`Category missing for "${mf.name}"`); setActiveFileIndex(selectedFiles.findIndex(f => f.name === mf.name)); return; }
      if (pf && !generated) usedPreviews.add(pf.name);

      const cType = ["mp4", "mov", "webm"].includes(ext) ? "video" : (["jpg", "jpeg", "webp"].includes(ext) ? "photo" : (ext === "png" ? "png" : "vector"));
      const pairedPreviewVideo = pairedPreviews[base];
      const hasPreviewVideo = pairedPreviewVideo && ["mp4", "mov", "webm"].includes(
        pairedPreviewVideo.name.split(".").pop().toLowerCase()
      );
      uploadAssets.push({
        mainFile: mf,
        groupedFiles: groupedMainFiles[base] || [mf],
        previewFile: pf,
        previewVideo: hasPreviewVideo ? pairedPreviewVideo : null,
        contentType: m.content_type || cType,
        ...m
      });
    }

    for (const img of imageFiles) {
      if (usedPreviews.has(img.name)) continue;
      const m = filesMetadata[img.name] || {};
      if (!m.title?.trim()) { toast.error(`Title missing for "${img.name}"`); setActiveFileIndex(selectedFiles.findIndex(f => f.name === img.name)); return; }
      if (!m.category) { toast.error(`Category missing for "${img.name}"`); setActiveFileIndex(selectedFiles.findIndex(f => f.name === img.name)); return; }
      const ext = img.name.split(".").pop().toLowerCase();
      uploadAssets.push({ mainFile: img, previewFile: img, contentType: ext === "png" ? "png" : "photo", ...m });
    }

    if (uploadAssets.length === 0) { toast.error("No valid asset found."); return; }

    setIsSubmitting(true);
    setUploadProgress({ current: 0, total: uploadAssets.length });

    const API_BASE = import.meta.env.VITE_LOCALHOST_KEY || "https://api.piksea.com/api_v1";

    const submitOne = async (asset) => {
      const metaKey = asset.mainFile.name;
      const remoteId = draftIds[metaKey];
      if (remoteId === "uploading") throw new Error("Still uploading, wait.");
      const fd = new FormData();
      fd.append("title", asset.title || ""); fd.append("description", asset.description || "");
      fd.append("category_id", asset.category || ""); fd.append("subcategory_id", asset.subcategory || "");
      fd.append("content_type", asset.contentType); fd.append("license_type", asset.license || "free");
      fd.append("is_premium", asset.license === "premium" ? "1" : "0");
      fd.append("ai_generated", asset.aiGenerated || "no"); fd.append("tags", asset.tags || "");
      fd.append("exclusive_price", asset.exclusive_price || "0.00");
      const headers = {
        "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026"
      };
      if (user) { const token = await user.getIdToken(); headers["Authorization"] = `Bearer ${token}`; }
      if (remoteId) {
        fd.append("content_id", remoteId);
        const res = await fetch(`${API_BASE}/contents/updateMetadata.php`, { method: "POST", headers, body: fd });
        const raw = await res.text();
        let result; try { result = JSON.parse(raw); } catch { throw new Error("Server JSON Error"); }
        if (!res.ok || !result.success) throw new Error(result.message || "Submit failed");
        return result;
      } else {
        if (asset.previewFile) {
          fd.append("preview_file", asset.previewFile);
          if (asset.mainFile && asset.mainFile !== asset.previewFile) {
            fd.append("main_file", asset.mainFile);
          }
        } else if (asset.mainFile) {
          fd.append("main_file", asset.mainFile);
          fd.append("preview_file", asset.mainFile);
        }
        if (asset.previewVideo) {
          fd.append("preview_video", asset.previewVideo);
        }
        const res = await fetch(`${API_BASE}/contents/uploadContent.php`, { method: "POST", headers, body: fd });
        const raw = await res.text();
        let result; try { result = JSON.parse(raw); } catch { throw new Error("Server JSON Error"); }
        if (!res.ok || !result.success) throw new Error(result.message || "Upload failed");
        return result;
      }
    };

    const successNames = new Set(), failedNames = [];

    for (let i = 0; i < uploadAssets.length; i++) {
      const asset = uploadAssets[i];
      setUploadProgress({ current: i + 1, total: uploadAssets.length });
      try { await submitOne(asset); successNames.add(asset.mainFile.name); if (asset.previewFile) successNames.add(asset.previewFile.name); }
      catch { failedNames.push(asset.mainFile.name); }
    }

    const stillFailed = [];
    if (failedNames.length > 0) {
      toast.info(`Retrying ${failedNames.length} failed...`);
      setUploadProgress({ current: 0, total: failedNames.length });
      for (let i = 0; i < failedNames.length; i++) {
        setUploadProgress({ current: i + 1, total: failedNames.length });
        const name = failedNames[i];
        const asset = uploadAssets.find(a => a.mainFile.name === name);
        if (!asset) continue;
        try { await submitOne(asset); successNames.add(asset.mainFile.name); if (asset.previewFile) successNames.add(asset.previewFile.name); }
        catch { stillFailed.push(name); }
      }
    }

    setUploadSummary({ success: [...successNames], failed: stillFailed, total: uploadAssets.length });

    successNames.forEach(name => { if (previews[name]) URL.revokeObjectURL(previews[name]); });
    setSelectedFiles(prev => prev.filter(f => !successNames.has(f.name)));
    setFilesMetadata(prev => {
      const n = { ...prev };
      successNames.forEach(name => {
        delete n[name];
        setFileProgress(fp => { const nfp = { ...fp }; delete nfp[name]; return nfp; });
        setDraftIds(d => { const nd = { ...d }; delete nd[name]; return nd; });
      });
      return n;
    });
    setPreviews(prev => { const n = { ...prev }; successNames.forEach(k => delete n[k]); return n; });
    setCheckedFiles(prev => { const n = new Set(prev); successNames.forEach(k => n.delete(k)); return n; });
    setActiveFileIndex(0);
    setIsSubmitting(false);
    setUploadProgress({ current: 0, total: 0 });
    setUploadSpeed(0);

    if (successNames.size > 0) {
      toast.success(`🎉 Successfully published ${successNames.size} asset(s) to PikSea!`);
    }
  };

  const parentCategoriesComputed = categories?.filter(c => c.parent_id === null || c.parent_id === 0 || c.parent_id === "0");
  const activeFile = selectedFiles[activeFileIndex];
  const activeMeta = activeFile ? filesMetadata[activeFile.name] || {} : {};
  const selectedParentCat = parentCategoriesComputed?.find(c => String(c.id) === String(activeMeta.category));
  const subCategories = categories?.filter(c => String(c.parent_id) === String(selectedParentCat?.id || activeMeta.category));

  const value = {
    dragActive, isSubmitting, uploadProgress, uploadSpeed,
    selectedFiles, setSelectedFiles, activeFileIndex, setActiveFileIndex,
    filesMetadata, setFilesMetadata, previews, setPreviews,
    fileProgress, draftIds, setDraftIds,
    tagSuggestions, isLoadingTags,
    checkedFiles, setCheckedFiles,
    bulkCategory, setBulkCategory, bulkSubcategory, setBulkSubcategory,
    uploadSummary, setUploadSummary,
    dragOverIndex, copyMetaSource, setCopyMetaSource,
    showBulkEditModal, setShowBulkEditModal,
    pairedPreviews, setPairedPreviews, groupedMainFiles, setGroupedMainFiles,
    categories, isLoading, user,
    activeFile, activeMeta, parentCategoriesComputed, subCategories,
    MAX_TAGS, MIN_TAGS, IDEAL_TAGS, MAX_TITLE_LENGTH, MIN_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH,
    mainExtensions, previewExtensions, allowedExtensions, SIZE_WARN_MB, SIZE_MAX_MB,
    getBaseName, getTagsArray, getMetadataStatus,
    handleDrag, handleDrop, handleFileChange, handleFilesAdded,
    handleCsvUpload, handleRemoveFile, handleBulkDelete,
    updateActiveField, applyToChecked, applyMetadataCopy, applyMetadataToAll,
    fetchRelatedTags, addTagSuggestion, addAllTagSuggestions,
    isGeneratingAI, aiProgress, generateSingleAIMetadata, generateBulkAIMetadata,
    handleSubmit, retryFile, exportCSV,
    handleCardDragStart, handleCardDragOver, handleCardDrop, handleCardDragEnd,
    descDebounceRef,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};
