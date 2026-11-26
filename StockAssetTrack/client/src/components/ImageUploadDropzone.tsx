import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadSimilarImage } from '../services/api';
import type { SimilarResponse } from '../types/stock';

export const UPLOAD_SIMILAR_STORAGE_KEY = 'sat_upload_similar';

export interface StoredUploadSimilarPayload {
  previewDataUrl: string;
  response: SimilarResponse;
  storedAt: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function createCompactPreviewDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxEdge = 360;
      const scale = Math.min(1, maxEdge / Math.max(img.width || 1, img.height || 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);

      if (!ctx) {
        resolve('');
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('');
    };
    img.src = objectUrl;
  });
}

interface ImageUploadDropzoneProps {
  onSuccess: (stored: StoredUploadSimilarPayload) => void;
  compact?: boolean;
}

export function ImageUploadDropzone({ onSuccess, compact = false }: ImageUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image size exceeds the 10 MB limit.');
      return;
    }

    setUploading(true);
    try {
      const [previewDataUrl, response] = await Promise.all([
        createCompactPreviewDataUrl(file),
        uploadSimilarImage(file, 1),
      ]);

      const stored: StoredUploadSimilarPayload = {
        previewDataUrl,
        response,
        storedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(UPLOAD_SIMILAR_STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // Ignore sessionStorage quota issues if another domain data fills storage
      }

      toast.success(`Found ${response.assets.length} visual matches`);
      onSuccess(stored);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image similarity upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-label="Upload reference image for visual similarity search"
      className={`cursor-pointer rounded-2xl border-2 border-dashed text-center transition ${
        compact ? 'p-5' : 'p-8'
      } ${
        dragging
          ? 'border-brand-cyan bg-brand-cyan/10'
          : 'border-slate-300 bg-slate-50/80 hover:border-brand-indigo dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-brand-indigo'
      }`}
    >
      <input
        ref={inputRef}
        id="upload-similar-file-input"
        name="similarImage"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
        className="sr-only"
      />

      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-indigo/15 text-brand-indigo">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
        {uploading ? 'Analyzing image & matching Adobe Stock...' : 'Drop a reference image or click to upload'}
      </p>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Upload className="h-3.5 w-3.5" />
        <span>JPG, PNG, GIF, or WebP up to 10 MB</span>
      </p>
    </div>
  );
}
