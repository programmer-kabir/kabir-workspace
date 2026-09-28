import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVerifications, updateVerificationStatus } from "../../api/verificationApi";
import { ShieldQuestion, Check, X, Image as ImageIcon } from "lucide-react";
import Swal from 'sweetalert2';
import DayalLoader from "../../components/Common/DayalLoader";

const VerificationRequests = () => {
  const [filter, setFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: rawRequests, isLoading, isError } = useQuery({
    queryKey: ["verifications", filter],
    queryFn: () => getVerifications(filter),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }) => updateVerificationStatus(id, status, reason),
    onSuccess: (data, variables) => {
      Swal.fire({ 
        title: variables.status === 'approved' ? "Approved!" : "Rejected!", 
        text: `Request has been ${variables.status}.`, 
        icon: "success", 
        background: '#12121E', 
        color: '#fff' 
      });
      queryClient.invalidateQueries(["verifications"]);
    }
  });

  const handleStatusUpdate = (id, status) => {
    if (status === 'rejected') {
      Swal.fire({
        title: 'Reject Request',
        input: 'text',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'e.g., Blurry image, ID expired',
        showCancelButton: true,
        background: '#12121E',
        color: '#fff',
        confirmButtonColor: '#d33',
        preConfirm: (reason) => {
          if (!reason) {
            Swal.showValidationMessage('Please enter a reason');
          }
          return reason;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          updateMutation.mutate({ id, status, reason: result.value });
        }
      });
    } else {
      Swal.fire({
        title: "Approve Request?",
        text: "This will mark the user's identity as verified.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#6C4FE0",
        cancelButtonColor: "#3f3f46",
        confirmButtonText: "Yes, approve it!",
        background: '#12121E',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          updateMutation.mutate({ id, status });
        }
      });
    }
  };

  const openImage = (url) => {
    if (!url) return;
    setSelectedImage(`${import.meta.env.VITE_IMG_KEY}/${url}`);
  };

  const sortedRequests = rawRequests ? [...rawRequests].sort((a, b) => {
    if (a.status === 'rejected' && b.status !== 'rejected') return 1;
    if (a.status !== 'rejected' && b.status === 'rejected') return -1;
    return 0;
  }) : [];

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ShieldQuestion className="text-[#6C4FE0]" />
            NID Verifications
          </h1>
          <p className="text-sm text-gray-400">Review and approve author identity documents.</p>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#6C4FE0]/50"
        >
          <option value="all" className="bg-[#12121E]">All Status</option>
          <option value="pending" className="bg-[#12121E]">Pending</option>
          <option value="approved" className="bg-[#12121E]">Approved</option>
          <option value="rejected" className="bg-[#12121E]">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <DayalLoader text="Loading ID verification requests..." />
      ) : isError ? (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-center">
          Failed to load requests.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sortedRequests?.map((req) => (
            <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{req.full_name}</h3>
                  <p className="text-sm text-gray-400">@{req.username} | {req.email}</p>
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                  ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                  ${req.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                  ${req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                `}>
                  {req.status}
                </div>
              </div>
              
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Full Name (from ID)</span>
                  <span className="text-sm text-gray-300 font-medium">{req.full_name}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Date of Birth</span>
                  <span className="text-sm text-gray-300 font-medium">{req.date_of_birth}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Document Type</span>
                  <span className="text-sm text-gray-300 capitalize">{req.document_type?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">ID Number</span>
                  <span className="text-sm text-gray-300 font-mono bg-white/5 px-2 py-0.5 rounded">{req.nid_number}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-2 h-24">
                <div onClick={() => openImage(req.front_image_url)} className="flex-1 cursor-pointer group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 flex flex-col justify-center items-center">
                  <img src={`${import.meta.env.VITE_IMG_KEY}/${req.front_image_url}`} alt="Front" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center gap-1">
                    <ImageIcon size={18} className="text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-bold drop-shadow-lg tracking-wide uppercase">Front</span>
                  </div>
                </div>
                {req.back_image_url && (
                  <div onClick={() => openImage(req.back_image_url)} className="flex-1 cursor-pointer group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 flex flex-col justify-center items-center">
                    <img src={`${import.meta.env.VITE_IMG_KEY}/${req.back_image_url}`} alt="Back" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center gap-1">
                      <ImageIcon size={18} className="text-white drop-shadow-lg" />
                      <span className="text-white text-xs font-bold drop-shadow-lg tracking-wide uppercase">Back</span>
                    </div>
                  </div>
                )}
                {req.selfie_image_url && (
                  <div onClick={() => openImage(req.selfie_image_url)} className="flex-1 cursor-pointer group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 flex flex-col justify-center items-center">
                    <img src={`${import.meta.env.VITE_IMG_KEY}/${req.selfie_image_url}`} alt="Selfie" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center gap-1">
                      <ImageIcon size={18} className="text-white drop-shadow-lg" />
                      <span className="text-white text-xs font-bold drop-shadow-lg tracking-wide uppercase">Selfie</span>
                    </div>
                  </div>
                )}
              </div>
              
              {req.status === 'rejected' && req.rejection_reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                  <span className="font-bold">Reason:</span> {req.rejection_reason}
                </div>
              )}

              {req.status === 'pending' && (
                <div className="flex items-center gap-3 mt-2 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                    className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                    className="flex-1 rounded-xl bg-[#6C4FE0]/20 py-2.5 text-sm font-semibold text-[#6C4FE0] hover:bg-[#6C4FE0] hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
          {(!sortedRequests || sortedRequests.length === 0) && (
            <div className="col-span-full text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
              No verification requests found.
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex justify-center">
            <button 
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Verification Document" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;
