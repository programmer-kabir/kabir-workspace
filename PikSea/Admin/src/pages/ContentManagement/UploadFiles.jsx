import { UploadProvider, useUpload } from "./upload/UploadContext";
import UploadDropzone from "./upload/UploadDropzone";
import FileGrid from "./upload/FileGrid";
import MetadataForm from "./upload/MetadataForm";
import SummaryModal from "./upload/SummaryModal";
import BulkEditModal from "./upload/BulkEditModal";
import { Sparkles, Loader2 } from "lucide-react";

const UploadLayout = () => {
  const { selectedFiles, handleFileChange, generateBulkAIMetadata, isGeneratingAI } = useUpload();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-outfit">Direct Asset Publishing Center</h2>
          <p className="text-sm text-gray-400 font-medium">
            Batch upload high-resolution stock photos and images (JPG, JPEG, PNG, WebP) directly to PikSea
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={generateBulkAIMetadata}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>AI Processing All...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>AI Auto-Fill All ({selectedFiles.length})</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5 text-xs text-[#00D4FF]">
            <span className="font-semibold uppercase tracking-wider font-outfit">Admin Authority:</span>
            <span>Instant Publishing</span>
          </div>
        </div>
      </div>

      {selectedFiles.length === 0 ? (
        <UploadDropzone />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp"
            multiple
          />

          {/* Left: File Grid */}
          <div className="lg:col-span-2 space-y-6">
            <FileGrid />
          </div>

          {/* Right: Metadata Form */}
          <MetadataForm />
        </div>
      )}

      {/* Upload Summary Modal */}
      <SummaryModal />
      {/* Spreadsheet Bulk Edit Modal */}
      <BulkEditModal />
    </div>
  );
};

const UploadFiles = () => (
  <UploadProvider>
    <UploadLayout />
  </UploadProvider>
);

export default UploadFiles;
