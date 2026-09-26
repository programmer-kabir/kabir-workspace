import { useUpload } from "./UploadContext";

const SummaryModal = () => {
  const { uploadSummary, setUploadSummary } = useUpload();
  if (!uploadSummary) return null;

  const { success, failed, total } = uploadSummary;
  const successCount = success.filter(n => !n.endsWith(".jpg") || true).length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F0F1A] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6C4FE0]/20 text-3xl">
            {failed.length === 0 ? "🎉" : failed.length === total ? "❌" : "⚠️"}
          </div>
          <h2 className="text-lg font-bold text-white">Upload Summary</h2>
          <p className="text-xs text-gray-400 mt-1">
            {total} asset(s) processed
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{total - failed.length}</p>
            <p className="text-xs text-gray-400 mt-1">✅ Submitted</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{failed.length}</p>
            <p className="text-xs text-gray-400 mt-1">❌ Failed</p>
          </div>
        </div>

        {/* Failed files list */}
        {failed.length > 0 && (
          <div className="mb-5 rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              Failed Files
            </p>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {failed.map(name => (
                <li key={name} className="flex items-center gap-2 text-xs text-red-400">
                  <span>❌</span>
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success message */}
        {failed.length === 0 && (
          <div className="mb-5 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
            <p className="text-xs text-green-400 font-semibold">
              All assets submitted for review! 🚀
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              You'll be notified once they are reviewed by the team.
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={() => setUploadSummary(null)}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SummaryModal;
