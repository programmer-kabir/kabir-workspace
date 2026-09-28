import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Tag,
  HardDrive,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  Clock,
  ShieldAlert,
  Send,
  Download,
  Flame,
  Zap
} from 'lucide-react';
import { toast } from 'react-toastify';

const REJECTION_PRESETS = [
  { id: 'quality', title: 'Low Quality / Compression Artifacts', note: 'Image or vector quality does not meet our minimum resolution or sharpness standards.' },
  { id: 'source', title: 'Missing or Corrupt Source File', note: 'The uploaded EPS, AI, or source archive is missing, damaged, or uneditable.' },
  { id: 'copyright', title: 'Copyright / Trademark Infringement', note: 'Asset contains recognizable brand logos, trademarks, or copyrighted elements without authorization.' },
  { id: 'metadata', title: 'Incorrect Metadata or Irrelevant Tags', note: 'Title, category, or tags are misleading, stuffed, or improperly categorized.' },
  { id: 'duplicate', title: 'Duplicate / Spam Submission', note: 'This asset or a nearly identical variation has already been submitted.' },
  { id: 'guidelines', title: 'Content Guidelines Violation', note: 'Asset violates DayalStock community standards and submission guidelines.' }
];

const IMG_BASE = import.meta.env.VITE_IMG_KEY || 'https://pub-8d3e60db04cc4bf9bd592995b23acefe.r2.dev';

const getPreviewSrc = (content) => {
  if (!content) return null;
  const path = content.author_preview_url || content.preview_image || content.image_url || content.image;
  if (!path) return null;
  return path.startsWith('http') ? path : `${IMG_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const ReviewInspectionDrawer = ({
  isOpen,
  onClose,
  contents = [],
  currentIndex = 0,
  onNavigate,
  onApprove,
  onReject,
  isActionLoading = false
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(REJECTION_PRESETS[0].title);
  const [reviewerNote, setReviewerNote] = useState(REJECTION_PRESETS[0].note);

  const currentContent = contents[currentIndex] || null;

  // Reset states when content changes
  useEffect(() => {
    setZoomLevel(1);
    setShowRejectBox(false);
    setSelectedPreset(REJECTION_PRESETS[0].title);
    setReviewerNote(REJECTION_PRESETS[0].note);
  }, [currentIndex]);

  const handlePresetChange = (presetTitle) => {
    setSelectedPreset(presetTitle);
    const found = REJECTION_PRESETS.find(p => p.title === presetTitle);
    if (found) {
      setReviewerNote(found.note);
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < contents.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, contents.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleApproveCurrent = useCallback(() => {
    if (!currentContent || isActionLoading) return;
    onApprove(currentContent.id);
  }, [currentContent, isActionLoading, onApprove]);

  const handleRejectCurrent = () => {
    if (!currentContent || isActionLoading) return;
    onReject(currentContent.id, selectedPreset, reviewerNote);
    setShowRejectBox(false);
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Ignore hotkeys if user is typing in a textarea or input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      switch (e.key) {
        case 'a':
        case 'A':
          e.preventDefault();
          handleApproveCurrent();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setShowRejectBox(prev => !prev);
          break;
        case 'j':
        case 'J':
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'k':
        case 'K':
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoomLevel(z => Math.min(2.5, z + 0.25));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setZoomLevel(z => Math.max(0.5, z - 0.25));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleApproveCurrent, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentContent) return null;

  const previewSrc = getPreviewSrc(currentContent);

  // Safely extract tags array (handles array of objects, array of strings, or comma-separated string)
  const rawTags = currentContent.tags;
  const tagsList = (Array.isArray(rawTags) ? rawTags : (typeof rawTags === 'string' ? rawTags.split(',') : []))
    .map(t => {
      if (!t) return '';
      if (typeof t === 'string') return t.trim();
      if (typeof t === 'object') return t.name || t.slug || String(t.id || '');
      return String(t);
    })
    .filter(Boolean);

  // Safely extract category string
  const categoryDisplay = typeof currentContent.category_name === 'string' && currentContent.category_name
    ? currentContent.category_name
    : (typeof currentContent.category === 'object' && currentContent.category !== null
        ? (currentContent.category.name || currentContent.category.slug || 'General')
        : (typeof currentContent.category === 'string' && currentContent.category ? currentContent.category : 'General'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* MAIN INSPECTION DRAWER */}
      <div className="h-full w-full max-w-5xl bg-[#0F0F1A] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* TOP BAR */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
              <Clock size={13} />
              Review Queue ({currentIndex + 1} / {contents.length})
            </span>

            <h2 className="text-sm font-bold text-white truncate max-w-md" title={currentContent.title}>
              {currentContent.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Pagination Controls */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-white/10 p-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                title="Previous (K / ←)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-400 px-2 font-mono">{currentIndex + 1}/{contents.length}</span>
              <button
                onClick={handleNext}
                disabled={currentIndex === contents.length - 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                title="Next (J / →)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MIDDLE CONTENT: 2-COLUMN VIEW */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT: ZOOMABLE PREVIEW CANVAS (7 COLS) */}
          <div className="lg:col-span-7 bg-[#0A0A12] border-r border-white/5 flex flex-col relative overflow-hidden">
            
            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-1 text-xs">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
                title="Zoom Out (-)"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[11px] font-mono font-bold text-gray-300 px-2">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
                title="Zoom In (+)"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-[10px] font-bold px-2"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

            {/* Preview Image / Player Area */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              {previewSrc ? (
                currentContent.content_type === 'video' ? (
                  <video
                    src={previewSrc}
                    controls
                    autoPlay
                    loop
                    className="max-h-[500px] max-w-full rounded-2xl shadow-2xl object-contain"
                  />
                ) : (
                  <img
                    src={previewSrc}
                    alt={currentContent.title}
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}
                    className="max-h-[520px] max-w-full rounded-2xl shadow-2xl object-contain select-none"
                  />
                )
              ) : (
                <div className="text-center text-gray-500 text-xs">No visual preview available for this asset.</div>
              )}
            </div>

            {/* Quick Dimension Pill */}
            <div className="h-10 border-t border-white/5 bg-black/30 px-6 flex items-center justify-between text-xs text-gray-400">
              <span>Format: <strong className="text-white uppercase">{currentContent.content_type || 'VECTOR'}</strong></span>
              <span>License: <strong className="text-amber-400 capitalize">{currentContent.license_type || (currentContent.is_premium ? 'Premium' : 'Free')}</strong></span>
              <span>ID: <strong className="text-gray-300 font-mono">#{currentContent.id}</strong></span>
            </div>
          </div>

          {/* RIGHT: METADATA & REJECTION PRESET PANEL (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col justify-between overflow-y-auto p-6 space-y-6 bg-[#0E0E18]">
            
            <div className="space-y-5">
              
              {/* AUTHOR CARD */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Contributor Details</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
                    {currentContent.author_avatar ? (
                      <img src={currentContent.author_avatar.startsWith('http') ? currentContent.author_avatar : `${IMG_BASE}/${currentContent.author_avatar}`} alt={currentContent.author_name} className="w-full h-full object-cover" />
                    ) : (
                      currentContent.author_name?.charAt(0) || 'C'
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">{currentContent.author_name || 'Contributor'}</span>
                    <span className="text-xs text-gray-400">{currentContent.author_email || 'Verified Author'}</span>
                  </div>
                </div>
              </div>

              {/* ASSET METADATA */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Metadata & Indexing</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-400 text-[11px] block">Category</span>
                    <strong className="text-white">{categoryDisplay}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-400 text-[11px] block">Submitted</span>
                    <strong className="text-white">
                      {new Date(currentContent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                </div>

                {/* TAGS LIST */}
                <div>
                  <span className="text-gray-400 text-[11px] block mb-2 flex items-center gap-1">
                    <Tag size={12} />
                    Tags ({tagsList.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {tagsList.length > 0 ? (
                      tagsList.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-300">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No tags provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* REJECTION REASON PRESET BOX */}
              {showRejectBox && (
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      Select Rejection Reason
                    </span>
                    <button onClick={() => setShowRejectBox(false)} className="text-gray-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full rounded-xl border border-rose-500/30 bg-gray-900 px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
                  >
                    {REJECTION_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.title}>
                        {preset.title}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows="3"
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    placeholder="Provide specific feedback for the creator..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-gray-300 outline-none focus:border-rose-500 resize-none"
                  />

                  <button
                    onClick={handleRejectCurrent}
                    disabled={isActionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    <span>Confirm Reject & Notify Author</span>
                  </button>
                </div>
              )}

            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  disabled={isActionLoading}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition cursor-pointer"
                  title="Reject Asset (R)"
                >
                  <XCircle size={16} />
                  <span>Reject (R)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveCurrent}
                  disabled={isActionLoading}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                  title="Approve Asset (A)"
                >
                  <CheckCircle size={16} />
                  <span>Approve (A)</span>
                </button>
              </div>

              {/* HOTKEYS CHEAT BAR */}
              <div className="flex items-center justify-between text-[10px] text-gray-500 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5 font-mono">
                <span><kbd className="text-gray-300 font-bold bg-black/40 px-1 py-0.5 rounded">A</kbd> Approve</span>
                <span><kbd className="text-gray-300 font-bold bg-black/40 px-1 py-0.5 rounded">R</kbd> Reject</span>
                <span><kbd className="text-gray-300 font-bold bg-black/40 px-1 py-0.5 rounded">J/→</kbd> Next</span>
                <span><kbd className="text-gray-300 font-bold bg-black/40 px-1 py-0.5 rounded">K/←</kbd> Prev</span>
                <span><kbd className="text-gray-300 font-bold bg-black/40 px-1 py-0.5 rounded">Esc</kbd> Close</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ReviewInspectionDrawer;
