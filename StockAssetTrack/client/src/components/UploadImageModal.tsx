import { useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { ImageUploadDropzone, type StoredUploadSimilarPayload } from './ImageUploadDropzone';

interface UploadImageModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (stored: StoredUploadSimilarPayload) => void;
}

export function UploadImageModal({ open, onClose, onComplete }: UploadImageModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/15 text-brand-cyan">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Search Adobe Stock by Image
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload any reference design or photo to extract visually similar top sellers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close image upload modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ImageUploadDropzone
          onSuccess={(stored) => {
            onClose();
            onComplete(stored);
          }}
        />
      </div>
    </div>
  );
}
