import { UploadProvider, useUpload } from "./upload/UploadContext";
import UploadDropzone from "./upload/UploadDropzone";
import FileGrid from "./upload/FileGrid";
import MetadataForm from "./upload/MetadataForm";
import SummaryModal from "./upload/SummaryModal";
import BulkEditModal from "./upload/BulkEditModal";
import useUploadLimit from "../../../utlis/Hooks/useUploadLimit";
import useAuth from "../../../utlis/Hooks/useAuth";

// Inner layout reads from context
const UploadLayout = () => {
  const { selectedFiles, handleFileChange } = useUpload();
  const { user } = useAuth();
  const { data: uploadLimit } = useUploadLimit(user?.email);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Your Creative Assets</h2>
          <p className="text-sm text-gray-400 font-medium">
            Batch upload vectors, photos, graphics, and zip bundles
          </p>
        </div>
        
        {uploadLimit && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-xs text-blue-400">
            <span className="font-semibold uppercase tracking-wider">Upload Limit:</span>
            <span>
              {uploadLimit.permission_type === 'unlimited' 
                ? 'Unlimited' 
                : `${uploadLimit.weekly_upload_limit - uploadLimit.uploads_this_week} uploads left this week`}
            </span>
          </div>
        )}
      </div>

      {selectedFiles.length === 0 ? (
        // ── Empty state ────────────────────────────────────────────
        <UploadDropzone />
      ) : (
        // ── Workspace ──────────────────────────────────────────────
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Hidden file input (shared) */}
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".svg,.eps,.ai,.psd,.jpg,.jpeg,.png,.webp,.zip"
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

// Public export wraps with context provider
const UploadFiles = () => (
  <UploadProvider>
    <UploadLayout />
  </UploadProvider>
);

export default UploadFiles;
