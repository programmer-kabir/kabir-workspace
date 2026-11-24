import React from 'react';
import {
  FiDownload, FiTrash2, FiX, FiClock, FiHardDrive, FiUploadCloud, FiCheckCircle
} from 'react-icons/fi';

/**
 * MeetingRecordingModal Component
 * Step 4: Displays recording review modal when host stops meeting recording:
 * - HTML5 local video playback preview
 * - Metadata (duration, estimated file size, HD format)
 * - 💾 Direct 1-Click offline download to user's PC (.webm)
 * - ☁️ Google Drive cloud save trigger button (with progress indicator)
 * - 🗑️ Discard & clear memory
 */
export default function MeetingRecordingModal({
  isOpen = false,
  onClose,
  isBn = false,
  meetingTitle = '',
  recordedBlobUrl,
  formattedDuration = '00:00',
  formattedFileSize = '0 MB',
  onDownload,
  onDiscard,
  onUploadToDrive,
  isUploading = false,
  uploadProgress = 0,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <span className="text-base leading-none">🎬</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isBn ? 'মিটিং রেকর্ডিং সমাপ্ত হয়েছে' : 'Meeting Recording Finished'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  {isBn ? 'প্রস্তুত' : 'Ready'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                {meetingTitle || (isBn ? 'সিসিএ লাইভ কনফারেন্স' : 'CCA Live Conference')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Video Playback Preview Card */}
        <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video relative flex items-center justify-center shadow-inner">
          {recordedBlobUrl ? (
            <video
              src={recordedBlobUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-4 text-slate-500 text-xs">
              <p>{isBn ? 'ভিডিও প্রিভিউ লোড হচ্ছে...' : 'Loading video preview...'}</p>
            </div>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold mb-0.5">
              <FiClock size={12} className="text-rose-400" />
              <span>{isBn ? 'সময়কাল' : 'Duration'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-white">{formattedDuration}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold mb-0.5">
              <FiHardDrive size={12} className="text-indigo-400" />
              <span>{isBn ? 'সাইজ' : 'File Size'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-white">{formattedFileSize}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold mb-0.5">
              <span className="text-[11px]">🎞️</span>
              <span>{isBn ? 'কোয়ালিটি' : 'Quality'}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">1080p HD</span>
          </div>
        </div>

        {/* Upload Progress Bar (When Step 5 Cloud Upload is in progress) */}
        {isUploading && (
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <FiUploadCloud className="animate-bounce" size={14} />
                <span>{isBn ? 'Google Drive-এ আপলোড হচ্ছে...' : 'Uploading to Google Drive...'}</span>
              </span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2.5">
            {/* Primary Action 1: Local PC Download */}
            <button
              type="button"
              onClick={onDownload}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer active:scale-[0.98]"
              title={isBn ? 'পিসিতে সরাসরি সেভ করুন' : 'Download to PC'}
            >
              <FiDownload size={15} />
              <span>{isBn ? 'পিসিতে ডাউনলোড করুন (WebM)' : 'Download Video (WebM)'}</span>
            </button>

            {/* Discard Button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isBn ? 'আপনি কি নিশ্চিত যে রেকর্ডিংটি মুছে ফেলতে চান?' : 'Are you sure you want to discard this recording?')) {
                  onDiscard?.();
                }
              }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition cursor-pointer"
              title={isBn ? 'মুছে ফেলুন' : 'Discard Recording'}
            >
              <FiTrash2 size={16} />
            </button>
          </div>

          {/* Primary Action 2: Cloud Google Drive Save (Prepared for Step 5) */}
          <button
            type="button"
            onClick={onUploadToDrive}
            disabled={isUploading}
            className={`w-full py-2.5 px-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              isUploading
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 hover:text-white shadow-md'
            }`}
            title={isBn ? 'সিসিএ ক্লাউড ড্রাইভে স্বয়ংক্রিয়ভাবে সেভ করুন' : 'Save to CCA Google Drive'}
          >
            <FiUploadCloud size={15} />
            <span>{isBn ? 'Google Drive-এ ক্লাউড সেভ করুন (অটোমেটিক)' : 'Save to Google Drive (Cloud Vault)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
