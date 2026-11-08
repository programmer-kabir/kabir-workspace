import React from 'react';
import { FiX } from 'react-icons/fi';

export default function CommunityLightboxModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
      >
        <img
          src={imageUrl}
          alt="Expanded Attachment"
          className="max-w-full max-h-[88vh] object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer"
          title="Close image"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

