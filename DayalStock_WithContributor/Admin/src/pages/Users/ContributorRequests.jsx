import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContributorApplications, updateApplicationStatus } from "../../api/authorApi";;
import { ExternalLink, Mail, User } from "lucide-react";
import Swal from 'sweetalert2';

const ContributorRequests = () => {
  const [filter, setFilter] = useState("all");
  const [expandedMotivations, setExpandedMotivations] = useState({});
  const queryClient = useQueryClient();

  const { data: applications, isLoading, isError } = useQuery({
    queryKey: ["contributor_applications", filter],
    queryFn: () => getContributorApplications(filter),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateApplicationStatus(id, status),
    onSuccess: (data, variables) => {
      const isApproved = variables.status === 'approved';
      Swal.fire({
        title: isApproved ? "Approved!" : "Rejected!",
        text: isApproved 
          ? "The user is now an Author and has been notified."
          : "The user's application has been rejected and they have been notified.",
        icon: "success",
        background: '#12121E',
        color: '#fff',
        confirmButtonColor: '#6C4FE0'
      });
      queryClient.invalidateQueries(["contributor_applications"]);
    },
    onError: (error) => {
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to update status",
        icon: "error",
        background: '#12121E',
        color: '#fff',
        confirmButtonColor: '#6C4FE0'
      });
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const toggleMotivation = (id) => {
    setExpandedMotivations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Contributor Requests</h1>
          <p className="text-sm text-gray-400">Manage incoming applications to become a contributor.</p>
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

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#6C4FE0] border-t-transparent rounded-full"></div>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-center">
          Failed to load applications.
        </div>
      )}

      {!isLoading && !isError && applications?.length === 0 && (
        <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
          No applications found.
        </div>
      )}

      {!isLoading && !isError && applications?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-[#6C4FE0]/30 transition-all">
              
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                ${app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                ${app.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                ${app.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
              `}>
                {app.status}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1 pr-16">{app.full_name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                  <User size={14} /> @{app.username}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={14} /> {app.email}
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-2">
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Content Type</span>
                  <span className="text-sm text-gray-300 capitalize">{app.content_type}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Motivation</span>
                  <p 
                    className={`text-sm text-gray-300 cursor-pointer transition-all ${expandedMotivations[app.id] ? '' : 'line-clamp-2'}`} 
                    title={expandedMotivations[app.id] ? "Click to collapse" : "Click to expand"}
                    onClick={() => toggleMotivation(app.id)}
                  >
                    {app.motivation}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between">
                <a 
                  href={app.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#6C4FE0] hover:text-[#5b3fd4] text-sm font-medium flex items-center gap-1"
                >
                  <ExternalLink size={14} /> Portfolio
                </a>
                
                <span className="text-xs text-gray-500">
                  {formatDate(app.created_at)}
                </span>
              </div>

              {/* Action Buttons for Pending */}
              {app.status === 'pending' && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      Swal.fire({
                        title: "Are you sure?",
                        text: "Do you really want to reject this application?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#d33",
                        cancelButtonColor: "#3f3f46",
                        confirmButtonText: "Yes, reject it!",
                        background: '#12121E',
                        color: '#fff'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          statusMutation.mutate({ id: app.id, status: 'rejected' });
                        }
                      });
                    }}
                    disabled={statusMutation.isPending}
                    className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => {
                      Swal.fire({
                        title: "Approve Application?",
                        text: "This will immediately grant the user the Author role.",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonColor: "#6C4FE0",
                        cancelButtonColor: "#3f3f46",
                        confirmButtonText: "Yes, approve it!",
                        background: '#12121E',
                        color: '#fff'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          statusMutation.mutate({ id: app.id, status: 'approved' });
                        }
                      });
                    }}
                    disabled={statusMutation.isPending}
                    className="flex-1 rounded-xl bg-[#6C4FE0]/20 py-2.5 text-sm font-semibold text-[#6C4FE0] hover:bg-[#6C4FE0] hover:text-white transition-colors"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContributorRequests;
