import { useState, useEffect } from "react";
import {
  LifeBuoy,
  Plus,
  X,
  Send,
  MessageSquare,
  ArrowLeft,
  User,
  ShieldAlert,
  Clock 
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../utlis/Hooks/useAuth";
import DayalLoader from "../../../components/Common/DayalLoader";

const STATUS_STYLES = {
  Open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Pending_Reply: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  Closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const PRIORITY_STYLES = {
  Low: "text-gray-400",
  Medium: "text-blue-400",
  High: "text-amber-400",
  Urgent: "text-red-400 font-bold",
};

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ subject: "", department: "General", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/get_my_tickets.php?source=contributor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/create_ticket.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...createData, ticket_source: "contributor" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ticket created successfully");
        setShowCreateModal(false);
        setCreateData({ subject: "", department: "General", message: "" });
        fetchTickets();
      } else {
        toast.error(data.message || "Failed to create ticket");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <LifeBuoy className="text-[#6C4FE0]" /> Help & Support
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Need help? Open a ticket to contact our support team.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        {loading ? (
          <DayalLoader text="Loading support tickets..." />
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Ticket ID</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/dashboard/support/${ticket.id}`)}
                    className="cursor-pointer text-gray-300 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 font-semibold text-[#6C4FE0] group-hover:text-[#8066ef]">{ticket.id}</td>
                    <td className="py-4 font-medium text-white">
                      {ticket.subject}
                      <div className="text-[10px] text-gray-500 mt-1">Dept: {ticket.department}</div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                          STATUS_STYLES[ticket.status] || STATUS_STYLES.Open
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className={`py-4 ${PRIORITY_STYLES[ticket.priority]}`}>{ticket.priority}</td>
                    <td className="py-4 text-xs text-gray-400 text-right">
                      {new Date(ticket.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <MessageSquare size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Support Tickets</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              You haven't opened any support tickets yet. If you have an issue, feel free to create one!
            </p>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0F0F1A] shadow-[0_0_50px_-12px_rgba(108,79,224,0.3)] overflow-hidden">
            {/* Header */}
            <div className="relative border-b border-white/5 bg-white/[0.02] p-6 pb-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4FE0]/20 to-[#FF6B6B]/20 text-[#FF6B6B]">
                    <LifeBuoy size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">
                      Create Ticket
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">We usually respond within 24 hours.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full bg-black/20 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <form onSubmit={handleCreateTicket}>
              <div className="p-6 space-y-5 bg-[#0F0F1A]">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Subject
                  </label>
                  <input
                    required
                    type="text"
                    value={createData.subject}
                    onChange={(e) => setCreateData({ ...createData, subject: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#161625] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-[#6C4FE0]/50 focus:bg-black/40 focus:ring-1 focus:ring-[#6C4FE0]/50 shadow-inner"
                    placeholder="Briefly describe your issue..."
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Department</label>
                  <select
                    value={createData.department}
                    onChange={(e) => setCreateData({ ...createData, department: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0F0F1A] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#6C4FE0]"
                  >
                    <option value="General">General Query</option>
                    <option value="Billing">Billing & Payouts</option>
                    <option value="Technical">Technical Issue</option>
                    <option value="Copyright">Copyright / Legal</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={createData.message}
                    onChange={(e) => setCreateData({ ...createData, message: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#161625] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-[#6C4FE0]/50 focus:bg-black/40 focus:ring-1 focus:ring-[#6C4FE0]/50 resize-none shadow-inner custom-scrollbar"
                    placeholder="Provide all details here..."
                  ></textarea>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-black/20 p-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-[#6C4FE0]/25 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? "Submitting..." : (
                    <>
                      <Send size={16} /> Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Support;
