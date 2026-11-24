import React from 'react';
import { FiDownload } from 'react-icons/fi';

/**
 * MeetingImagePreviewModal
 * Fullscreen lightbox for previewing shared images in meeting chat with direct download.
 */
export default function MeetingImagePreviewModal({ imageUrl, onClose, onDownload, isBn }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <div className="absolute -top-11 right-0 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => onDownload(imageUrl, 'shared_image.png', e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer shadow-lg"
            title={isBn ? 'ছবি ডাউনলোড করুন' : 'Download image'}
          >
            <FiDownload size={13} />
            <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer shadow-lg"
          >
            ✕ {isBn ? 'বন্ধ' : 'Close'}
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700/60"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
