import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
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

  const [nidStatus, setNidStatus] = useState(null);
  const [loadingNid, setLoadingNid] = useState(true);

  useEffect(() => {
    const fetchNidStatus = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/verification/get_nid_status.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNidStatus(data.data?.status || 'unverified');
        } else {
          setNidStatus('unverified');
        }
      } catch (err) {
        console.error("Failed to fetch NID status", err);
        setNidStatus('unverified');
      } finally {
        setLoadingNid(false);
      }
    };
    fetchNidStatus();
  }, [user]);

  if (loadingNid) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (nidStatus !== 'verified') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="rounded-full bg-red-500/10 p-4 mb-4">
          <Lock className="text-red-400" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          To maintain the quality and security of our platform, we require all contributors to verify their identity before uploading content.
        </p>
        <Link 
          to="/dashboard/verification" 
          className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white transition-all duration-200"
        >
          Verify Identity Now
        </Link>
      </div>
    );
  }

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
