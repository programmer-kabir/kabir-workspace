import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaymentVerifications, updatePaymentVerificationStatus } from "../../api/verificationApi";
import { CreditCard, Check, X, Mail, User } from "lucide-react";
import Swal from 'sweetalert2';

const PaymentVerification = () => {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: rawRequests, isLoading, isError } = useQuery({
    queryKey: ["payment_verifications", filter],
    queryFn: () => getPaymentVerifications(filter),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }) => updatePaymentVerificationStatus(id, status, reason),
    onSuccess: (data, variables) => {
      Swal.fire({ 
        title: variables.status === 'verified' ? "Verified!" : "Rejected!", 
        text: `Payment method has been ${variables.status}.`, 
        icon: "success", 
        background: '#12121E', 
        color: '#fff' 
      });
      queryClient.invalidateQueries(["payment_verifications"]);
    }
  });

  const handleStatusUpdate = (id, status) => {
    if (status === 'rejected') {
      Swal.fire({
        title: 'Reject Payment Method',
        input: 'text',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'e.g., Invalid account details, mismatching name',
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
        title: "Approve Payment Method?",
        text: "This will allow the author to request withdrawals using this method.",
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

  const sortedRequests = rawRequests ? [...rawRequests].sort((a, b) => {
    if (a.status === 'rejected' && b.status !== 'rejected') return 1;
    if (a.status !== 'rejected' && b.status === 'rejected') return -1;
    return 0;
  }) : [];

  const groupedAuthors = sortedRequests.reduce((acc, req) => {
    if (!acc[req.author_id]) {
      acc[req.author_id] = {
        id: req.author_id,
        author_name: req.author_name,
        username: req.username,
        user_email: req.user_email,
        methods: []
      };
    }
    acc[req.author_id].methods.push(req);
    return acc;
  }, {});

  const authorGroups = Object.values(groupedAuthors);

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <CreditCard className="text-[#6C4FE0]" />
            Payment Verifications
          </h1>
          <p className="text-sm text-gray-400">Review and approve payout methods for contributors.</p>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#6C4FE0]/50"
        >
          <option value="all" className="bg-[#12121E]">All Status</option>
          <option value="pending" className="bg-[#12121E]">Pending</option>
          <option value="verified" className="bg-[#12121E]">Verified</option>
          <option value="rejected" className="bg-[#12121E]">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#6C4FE0] border-t-transparent rounded-full"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-center">
          Failed to load payment verification requests.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {authorGroups?.map((authorGroup) => (
            <div key={authorGroup.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{authorGroup.author_name}</h3>
                  <p className="text-sm text-gray-400">@{authorGroup.username} | {authorGroup.user_email}</p>
                </div>
                <div className="bg-[#6C4FE0]/10 text-[#6C4FE0] text-xs font-bold px-2 py-1 rounded-lg">
                  {authorGroup.methods.length} {authorGroup.methods.length === 1 ? 'Method' : 'Methods'}
                </div>
              </div>
              
              <div className="flex flex-col gap-4 mt-2">
                {authorGroup.methods.map((method, index) => (
                  <div key={method.id} className={`flex flex-col gap-3 ${index > 0 ? 'pt-4 border-t border-white/5' : ''}`}>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Method #{index + 1}</span>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${method.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                        ${method.status === 'verified' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                        ${method.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                      `}>
                        {method.status}
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-full">
                        <span className="text-xs text-gray-500 block mb-1">Payment Provider</span>
                        <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 capitalize font-medium">
                          {method.payment_method}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg text-gray-400"><User size={16} /></div>
                        <div>
                          <span className="text-xs text-gray-500 block">Account Name</span>
                          <span className="text-sm text-gray-200 font-medium">{method.account_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg text-gray-400"><Mail size={16} /></div>
                        <div>
                          <span className="text-xs text-gray-500 block">Account Email</span>
                          <span className="text-sm text-gray-200 font-medium break-all">{method.account_email}</span>
                        </div>
                      </div>
                    </div>

                    {method.status === 'rejected' && method.rejection_reason && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 mt-2">
                        <span className="font-bold">Reason:</span> {method.rejection_reason}
                      </div>
                    )}

                    {method.status === 'pending' && (
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => handleStatusUpdate(method.id, 'rejected')}
                          className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                        >
                          <X size={16} /> Reject
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(method.id, 'verified')}
                          className="flex-1 rounded-xl bg-[#6C4FE0]/20 py-2.5 text-sm font-semibold text-[#6C4FE0] hover:bg-[#6C4FE0] hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <Check size={16} /> Verify
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!authorGroups || authorGroups.length === 0) && (
            <div className="col-span-full text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
              No payment verifications found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;
