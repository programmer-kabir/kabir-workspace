import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { 
  FiX, FiCheck, FiRotateCw, FiZoomIn, FiZoomOut, FiMaximize2, FiImage 
} from 'react-icons/fi';
import getCroppedImg from '../utils/cropImage';

/**
 * ImageCropperModal
 * Facebook / Instagram style interactive crop modal with zoom, pan, rotate, and aspect ratio handling.
 *
 * @param {boolean} isOpen
 * @param {string} imageSrc - Object URL or Base64 of the selected file
 * @param {string} type - 'profile' | 'cover'
 * @param {function} onClose - Closes the modal without applying
 * @param {function} onCropComplete - Callback receiving (croppedBlob, croppedFile)
 */
export default function ImageCropperModal({
  isOpen,
  imageSrc,
  type = 'profile',
  onClose,
  onApplyCrop,
}) {
  const isProfile = type === 'profile';
  const defaultAspect = isProfile ? 1 : 16 / 9;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspect, setAspect] = useState(defaultAspect);

  const handleCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(defaultAspect);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      
      const fileName = `${type}_${Date.now()}.jpg`;
      const croppedFile = new File([croppedBlob], fileName, {
        type: 'image/jpeg',
      });

      await onApplyCrop(croppedBlob, croppedFile);
      handleReset();
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiImage className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {isProfile ? 'Adjust Profile Picture' : 'Adjust Cover Picture'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isProfile 
                  ? 'Drag to reposition, use slider to zoom in or crop' 
                  : 'Position and crop your banner for optimal display'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-80 sm:h-96 bg-slate-950 select-none overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={isProfile ? 'round' : 'rect'}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            classes={{
              containerClassName: 'relative w-full h-full',
              cropAreaClassName: isProfile 
                ? 'rounded-full border-2 border-emerald-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]' 
                : 'rounded-lg border-2 border-emerald-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]'
            }}
          />
          {/* Subtle watermark / guideline overlay */}
          <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] font-medium text-white/60 bg-black/40 px-2 py-0.5 rounded">
            {isProfile ? 'Circular Preview' : 'Banner Aspect'}
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 space-y-3">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <FiZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Secondary Controls (Rotate, Aspect, Reset) */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-xs"
              >
                <FiRotateCw className="w-3.5 h-3.5" />
                Rotate 90°
              </button>

              {!isProfile && (
                <div className="inline-flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAspect(16 / 9)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      aspect === 16 / 9
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    16:9
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspect(3 / 1)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      aspect === 3 / 1
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    3:1 Banner
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline underline-offset-2"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>Crop & Save</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

