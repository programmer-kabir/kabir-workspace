import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWithdrawalRequests, updateWithdrawalStatus } from '../../api/verificationApi';
import { CreditCard, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

const WithdrawalRequests = () => {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['withdrawal_requests', filter, page],
    queryFn: () => getWithdrawalRequests(filter, page),
  });

  const rawRequests = response?.data || [];
  const pagination = response?.pagination || { total_pages: 1, current_page: 1 };

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }) => updateWithdrawalStatus(id, status, reason),
    onSuccess: (data, variables) => {
      Swal.fire({ 
        title: variables.status === 'completed' ? 'Completed!' : 'Rejected!', 
        text: `Withdrawal has been ${variables.status}.`, 
        icon: 'success', 
        background: '#12121E', 
        color: '#fff' 
      });
      queryClient.invalidateQueries(['withdrawal_requests']);
    }
  });

  const handleStatusUpdate = (id, status) => {
    if (status === 'rejected') {
      Swal.fire({
        title: 'Reject Withdrawal',
        input: 'text',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'e.g., Invalid account details',
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
        title: 'Mark Withdrawal as Paid?',
        text: 'This will mark the withdrawal as completed and deducted from their wallet.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6C4FE0',
        cancelButtonColor: '#3f3f46',
        confirmButtonText: 'Yes, mark as paid',
        background: '#12121E',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          updateMutation.mutate({ id, status });
        }
      });
    }
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <CreditCard className="text-[#6C4FE0]" />
            Withdrawal Requests
          </h1>
          <p className="text-sm text-gray-400">Review and approve withdrawal requests for contributors.</p>
        </div>
        
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#6C4FE0]/50"
        >
          <option value="all" className="bg-[#12121E]">All Status</option>
          <option value="pending" className="bg-[#12121E]">Pending</option>
          <option value="completed" className="bg-[#12121E]">Completed</option>
          <option value="rejected" className="bg-[#12121E]">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#6C4FE0] border-t-transparent rounded-full"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-center">
          Failed to load withdrawal requests.
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-gray-300 uppercase font-semibold text-xs">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">#</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Author</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Method</th>
                  <th className="px-4 py-4">Details</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rawRequests.map((req, index) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-center text-gray-500 font-medium">
                      {(page - 1) * 100 + index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(req.requested_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(req.requested_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{req.author_name}</div>
                      <div className="text-xs text-gray-500">@{req.username}</div>
                      <div className="text-xs text-gray-500">{req.user_email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-green-400 font-bold text-lg">${parseFloat(req.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-200 capitalize font-medium">
                        {req.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-xs truncate" title={req.payment_details}>
                      {req.payment_details}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                        ${req.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                        ${req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                      `}>
                        {req.status}
                      </span>
                      {req.status === 'rejected' && req.rejection_reason && (
                        <div className="text-[10px] text-red-400 mt-1 truncate max-w-[120px]" title={req.rejection_reason}>
                          {req.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(req.id, 'completed')}
                            title="Mark Paid"
                            className="p-2 rounded-lg bg-[#6C4FE0]/20 text-[#6C4FE0] hover:bg-[#6C4FE0] hover:text-white transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                            title="Reject"
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rawRequests.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No withdrawal requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page <span className="font-medium text-white">{pagination.current_page}</span> of <span className="font-medium text-white">{pagination.total_pages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.current_page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={pagination.current_page === pagination.total_pages}
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequests;
