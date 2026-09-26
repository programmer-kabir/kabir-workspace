import React from 'react';
import { FiX, FiDownload } from 'react-icons/fi';

const ImageLightbox = ({ setLightboxImage, lightboxImage, API_URL }) => {
    return (<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all z-10"
        >
            <FiX size={28} />
        </button>
        <a
            href={`${API_URL}api/chat/download_file.php?file=${encodeURIComponent(lightboxImage)}`}
            download
            className="absolute top-6 right-20 text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all z-10"
            title="Download Image"
        >
            <FiDownload size={26} />
        </a>
        <img src={`${API_URL}${lightboxImage}`} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" alt="Enlarged" />
    </div>)
}
export default ImageLightbox;