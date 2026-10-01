import { Upload, HelpCircle } from "lucide-react";
import { useUpload } from "./UploadContext";

const UploadDropzone = () => {
  const { dragActive, handleDrag, handleDrop, handleFileChange } = useUpload();
  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex min-h-[380px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          dragActive ? "border-[#00D4FF] bg-[#00D4FF]/5" : "border-white/10 hover:border-white/20 bg-white/5"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".svg,.eps,.ai,.psd,.jpg,.jpeg,.png,.webp,.zip,.mp4,.mov,.webm"
          multiple
        />
        <label htmlFor="file-upload" className="cursor-pointer space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-gray-400 transition-colors hover:text-[#00D4FF]">
            <Upload size={32} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">
              Drag and drop creative assets here, or{" "}
              <span className="text-[#00D4FF] hover:underline font-bold">browse</span>
            </p>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Supports Vectors (SVG, EPS, AI), Photos (JPG, PNG, WebP), PSD, ZIP (up to 80MB)<br />
              and Videos: MP4, MOV, WEBM (up to 500MB)
            </p>
          </div>
        </label>
      </div>

      {/* Technical Guidelines */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white font-outfit">
          <HelpCircle size={16} className="text-[#00D4FF]" />
          <span>Admin Asset Guidelines</span>
        </h3>
        <ul className="mt-4 list-disc pl-5 text-xs text-gray-400 space-y-2 font-medium">
          <li><strong>Vectors & Templates:</strong> Must be in <strong>EPS, SVG, AI, or PSD</strong>. Auto-generates JPG preview.</li>
          <li><strong>Photos & Graphics:</strong> High quality <strong>JPEG, PNG, WebP</strong>. Automatic IPTC/EXIF metadata extraction.</li>
          <li><strong>Video Footage:</strong> Supported formats <strong>MP4, MOV, WEBM</strong> up to 500MB. Auto thumbnail generated.</li>
          <li><strong>ZIP Bundles:</strong> Can be uploaded alongside preview images for 3D assets, fonts, or graphic packs.</li>
          <li><strong>Direct Publishing:</strong> Assets uploaded by admin will be available directly on the marketplace.</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadDropzone;
