import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiDownload } from 'react-icons/fi';

export const ImageLightbox = ({ image, onClose, apiBase }) => {
    const [lightboxScale, setLightboxScale] = useState(2);
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    if (!image) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-zoom-out" onClick={onClose} />

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-5 right-5 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg outline-none"
                title="Close Preview"
            >
                <FiX size={24} />
            </button>

            {/* Zoom controls float */}
            <div className="absolute bottom-6 z-10 bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-4 text-white shadow-xl">
                <button
                    onClick={() => setLightboxScale(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors font-bold text-lg w-8 h-8 flex items-center justify-center outline-none"
                    title="Zoom Out"
                >
                    -
                </button>
                <span className="text-xs font-bold font-mono tracking-wider w-12 text-center select-none">
                    {Math.round(lightboxScale * 100)}%
                </span>
                <button
                    onClick={() => setLightboxScale(prev => Math.min(3, prev + 0.25))}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors font-bold text-lg w-8 h-8 flex items-center justify-center outline-none"
                    title="Zoom In"
                >
                    +
                </button>
                <div className="h-4 w-[1px] bg-slate-800" />
                <button
                    onClick={() => setLightboxScale(2)}
                    className="text-xs font-bold hover:text-blue-400 transition-colors outline-none"
                >
                    Reset
                </button>
                <div className="h-4 w-[1px] bg-slate-800" />
                <a
                    href={`${apiBase}api/tasks/download_original.php?file=${encodeURIComponent(image.replace(apiBase, ''))}`}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-400 transition-colors outline-none"
                    title="Download Original File"
                >
                    <FiDownload size={14} />
                    <span>Download</span>
                </a>
            </div>

            {/* Image container - wraps the image with overflow-hidden to clip zoomed areas */}
            <div className="relative max-w-full max-h-[80vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center">
                <img
                    src={image}
                    alt="Reference Zoom View"
                    onMouseMove={(e) => {
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - left) / width) * 100;
                        const y = ((e.clientY - top) / height) * 100;
                        setZoomPos({ x, y });
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => setIsHovered(false)}
                    className="rounded-xl transition-transform duration-100 ease-out select-none cursor-crosshair"
                    style={{
                        transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                        transform: isHovered ? `scale(${lightboxScale})` : 'scale(1)',
                        maxHeight: '75vh',
                        maxWidth: '90vw',
                        objectFit: 'contain'
                    }}
                />
            </div>
        </div>,
        document.body
    );
};
