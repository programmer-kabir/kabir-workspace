import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiCheck, FiUpload, FiImage, FiDroplet } from 'react-icons/fi';
import { toast } from 'sonner';

/**
 * MeetingVirtualBackgroundModal
 * Allows attendees to blur their camera background or apply CCA branded studio backgrounds.
 */
export default function MeetingVirtualBackgroundModal({
  isOpen,
  onClose,
  isBn,
  virtualBg,
  isVideoOff,
}) {
  if (!isOpen) return null;

  const {
    selectedBgId,
    customBgUrl,
    isLoadingModel,
    applyBackground,
    presets,
  } = virtualBg;

  const [activeSelectId, setActiveSelectId] = useState(selectedBgId);
  const [activeCustomUrl, setActiveCustomUrl] = useState(customBgUrl);
  const fileInputRef = useRef(null);

  // Sync state whenever modal opens or background changes
  useEffect(() => {
    if (isOpen) {
      setActiveSelectId(selectedBgId);
      setActiveCustomUrl(customBgUrl);
    }
  }, [isOpen, selectedBgId, customBgUrl]);

  // Handle custom image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isBn ? 'অনুগ্রহ করে একটি ছবি ফাইল সিলেক্ট করুন।' : 'Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(isBn ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।' : 'Image size cannot exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      setActiveCustomUrl(url);
      setActiveSelectId('custom');
    };
    reader.readAsDataURL(file);
  };

  // Confirm and apply background
  const handleApply = () => {
    applyBackground(activeSelectId, activeCustomUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FiImage size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {isBn ? 'ভার্চুয়াল ব্যাকগ্রাউন্ড ও ব্লার' : 'Virtual Background & Blur'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'আপনার পেছনের পরিবেশ ব্লার করুন অথবা CCA অফিস সিলেক্ট করুন'
                  : 'Blur your room background or select a CCA branded office'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body / Presets Grid */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLoadingModel && (
            <div className="flex items-center gap-3 p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-cyan-300 text-xs">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>{isBn ? '⚡ AI সেগমেন্টেশন মডেল লোড হচ্ছে, এক মুহূর্ত অপেক্ষা করুন...' : '⚡ Loading AI segmentation model, please wait a moment...'}</span>
            </div>
          )}

          {isVideoOff && (
            <div className="flex items-center gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs">
              <span className="text-base">💡</span>
              <span>
                {isBn
                  ? 'আপনার ক্যামেরা বর্তমানে বন্ধ রয়েছে। ব্যাকগ্রাউন্ড প্রয়োগ করলে ক্যামেরা স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।'
                  : 'Your camera is currently turned off. Applying a background will automatically turn on your camera.'}
              </span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              {isBn ? 'ব্যাকগ্রাউন্ড নির্বাচন করুন' : 'Select a Background'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presets.map((preset) => {
                const isSelected = activeSelectId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setActiveSelectId(preset.id)}
                    className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer overflow-hidden ${isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="w-full h-20 rounded-xl mb-2 flex items-center justify-center overflow-hidden bg-slate-950 relative border border-slate-700/50">
                      {preset.type === 'none' ? (
                        <span className="text-2xl">🚫</span>
                      ) : preset.type.startsWith('blur') ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <FiDroplet className={preset.type === 'blur-heavy' ? 'text-cyan-400 text-2xl' : 'text-slate-400 text-xl'} />
                          <span className="text-[10px] text-slate-400 font-medium">
                            {preset.type === 'blur-heavy' ? '18px Blur' : '7px Blur'}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={preset.url}
                          alt={preset.labelEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      )}

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                          <FiCheck size={12} />
                        </div>
                      )}
                    </div>

                    <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {isBn ? preset.labelBn : preset.labelEn}
                    </span>
                  </button>
                );
              })}

              {/* Custom Upload Card */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer overflow-hidden ${activeSelectId === 'custom'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-full h-20 rounded-xl mb-2 flex items-center justify-center overflow-hidden bg-slate-950 relative border border-slate-700/50">
                  {activeCustomUrl ? (
                    <img
                      src={activeCustomUrl}
                      alt="Custom"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                      <FiUpload size={20} className="text-cyan-400" />
                      <span className="text-[10px] text-slate-400">Max 5MB</span>
                    </div>
                  )}

                  {activeSelectId === 'custom' && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                      <FiCheck size={12} />
                    </div>
                  )}
                </div>

                <span className={`text-xs font-semibold ${activeSelectId === 'custom' ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {isBn ? 'নিজের ছবি আপলোড' : 'Custom Upload'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={() => {
              setActiveSelectId('none');
              applyBackground('none');
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            {isBn ? 'রিসেট / বন্ধ করুন' : 'Reset / Turn Off'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              disabled={isLoadingModel}
              className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <FiCheck size={14} />
              <span>{isBn ? 'প্রয়োগ করুন' : 'Apply & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
