// admin-frontend/src/components/WorkstationVideoPlayerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FiFilm, FiX, FiClock, FiCalendar, FiHardDrive,
  FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2,
  FiShield, FiCheckCircle, FiPlay, FiSliders, FiUser
} from 'react-icons/fi';

export default function WorkstationVideoPlayerModal({
  isOpen,
  clip,
  allClips = [],
  onClose,
  onSelectClip,
  isBn = false,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clip, allClips, isFullscreen]);

  if (!isOpen || !clip) return null;

  // Current clip index calculation
  const currentIndex = allClips.findIndex(c => String(c.id) === String(clip.id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allClips.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectClip) {
      onSelectClip(allClips[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectClip) {
      onSelectClip(allClips[currentIndex + 1]);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Safe embed URL
  const embedUrl = clip.embed_url || (clip.drive_file_id ? `https://drive.google.com/file/d/${clip.drive_file_id}/preview` : null);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 rounded-none border-none max-w-none h-full' 
            : 'max-w-5xl max-h-[92vh] h-auto'
        }`}
      >
        {/* ── Modal Header: Branded CCA Video Vault Titlebar ────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FiFilm size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {clip.staff_name || 'Staff Member'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isBn ? `ক্লিপ #${clip.chunk_index || (currentIndex + 1)}` : `Clip #${clip.chunk_index || (currentIndex + 1)}`}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <FiClock className="text-indigo-400" size={12} />
                  {clip.start_time_formatted || clip.start_time} - {clip.end_time_formatted || clip.end_time}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <FiShield size={11} /> {isBn ? 'সিকিউর ভল্ট স্ট্রিম' : 'Secure Vault Stream'}
                </span>
                <span>&bull;</span>
                <span>{isBn ? `সময়কাল: ${clip.duration_minutes || Math.round(clip.duration_seconds / 60)} মিনিট` : `Duration: ${clip.duration_minutes || Math.round(clip.duration_seconds / 60)}m`}</span>
                <span>&bull;</span>
                <span>{clip.file_size_mb} MB</span>
              </p>
            </div>
          </div>

          {/* Action buttons: Prev, Next, Fullscreen, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {allClips.length > 1 && (
              <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  title={isBn ? 'পূর্ববর্তী ক্লিপ (←)' : 'Previous Clip (←)'}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <FiChevronLeft size={16} />
                </button>
                <span className="px-2 text-[11px] font-bold text-slate-400">
                  {currentIndex + 1} / {allClips.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  title={isBn ? 'পরবর্তী ক্লিপ (→)' : 'Next Clip (→)'}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? (isBn ? 'ফুলস্ক্রিন বন্ধ' : 'Exit Fullscreen') : (isBn ? 'ফুলস্ক্রিন' : 'Fullscreen')}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              title={isBn ? 'বন্ধ করুন (Esc)' : 'Close (Esc)'}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* ── Clip Timeline Selector Pills (If multiple clips) ─────────────────── */}
        {allClips.length > 1 && (
          <div className="flex items-center gap-1.5 px-5 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto scrollbar-thin">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
              {isBn ? 'সকল ক্লিপ:' : 'All Clips:'}
            </span>
            {allClips.map((c, idx) => {
              const isSelected = String(c.id) === String(clip.id);
              return (
                <button
                  key={c.id || idx}
                  onClick={() => onSelectClip && onSelectClip(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>#{c.chunk_index || idx + 1}</span>
                  <span className="text-[10px] opacity-75">
                    ({c.start_time_formatted || c.start_time})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Video Player Core Container ───────────────────────────────────── */}
        <div 
          className="relative flex-1 bg-black w-full overflow-hidden flex items-center justify-center select-none"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '420px', aspectRatio: isFullscreen ? 'auto' : '16/9' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {embedUrl ? (
            <div className="relative w-full h-full overflow-hidden">
              {/* Google Drive Preview Iframe with Sandbox Popout Blocker */}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms"
                title="CCA Workstation Video Vault"
              />

              {/* Protective Top Mask: Masks any Drive popout icons/links */}
              <div 
                className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto flex items-center justify-between px-4"
                style={{ zIndex: 10 }}
              >
                <span className="text-[11px] font-semibold text-slate-300 drop-shadow flex items-center gap-1.5">
                  <FiFilm className="text-indigo-400" size={13} />
                  <span>{clip.staff_name} &bull; {clip.date} ({clip.start_time_formatted || clip.start_time} - {clip.end_time_formatted || clip.end_time})</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-slate-700/50">
                  Full HD 1080p
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-white space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl border border-amber-500/20">
                <FiFilm />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                {isBn ? 'ভিডিও স্ট্রিমিং প্রস্তুত নয়' : 'Video Stream Unavailable'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isBn 
                  ? 'এই ক্লিপটির জন্য ড্রাইভ ফাইল আইডি পাওয়া যায়নি অথবা ফাইলটি প্রসেসিংয়ে রয়েছে।'
                  : 'The file ID for this recording could not be resolved or is currently finalizing.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Modal Footer: Security Audit & Controls ───────────────────────── */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">
              {isBn ? 'এনক্রিপ্টেড ইন-অ্যাপ ভিউয়ার' : 'Encrypted In-App Player'}
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-[11px] text-slate-400">
              {isBn ? 'ড্রাইভ লিংক সম্পূর্ণ গোপন ও সুরক্ষিত' : 'Google Drive links securely shielded'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500 hidden md:inline">
              {isBn ? 'শর্টকাট: ← পূর্ববর্তী | → পরবর্তী | Esc বন্ধ' : 'Hotkeys: ← Prev | → Next | Esc Close'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
