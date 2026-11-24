import React from 'react';
import { FiMic } from 'react-icons/fi';

/**
 * 🎙️ UnmutePromptModal
 * Modal displayed when meeting Host or Co-Host requests participant to unmute microphone
 */
export default function UnmutePromptModal({
  open = false,
  requestedBy = '',
  isBn = false,
  onClose,
  onUnmute
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 text-white">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
          <FiMic size={24} className="animate-bounce" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">
            {isBn ? 'কথা বলার অনুরোধ' : 'Speaking Request'}
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            {isBn
              ? `হোস্ট (${requestedBy}) আপনাকে মাইক্রোফোন চালু করে কথা বলতে অনুরোধ করেছেন।`
              : `Host (${requestedBy}) would like you to unmute your microphone to speak.`}
          </p>
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            {isBn ? 'মিউট থাকুন' : 'Stay Muted'}
          </button>
          <button
            type="button"
            onClick={onUnmute}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
          >
            <FiMic size={14} />
            <span>{isBn ? 'আনমিউট করুন' : 'Unmute Mic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
