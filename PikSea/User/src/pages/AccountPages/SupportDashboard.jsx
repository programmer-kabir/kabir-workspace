import React, { useState, useEffect } from 'react';
import useAuth from '../../utlis/Hooks/useAuth';
import SupportTicketDetails from './SupportTicketDetails';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, ChevronRight, Inbox } from 'lucide-react';
import { toast } from 'react-toastify';
import DayalLoader from '../../components/Common/DayalLoader';

const SupportDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicketId, setActiveTicketId] = useState(null);
  
  // For new ticket modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState("General");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/get_my_tickets.php?source=user`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error("Error fetching tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject || !newMessage) {
      toast.error("Subject and message are required");
      return;
    }
    
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/create_ticket.php`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          department: newDepartment,
          subject: newSubject,
          message: newMessage,
          ticket_source: "user"
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Ticket created successfully");
        setIsModalOpen(false);
        setNewDepartment("General");
        setNewSubject("");
        setNewMessage("");
        fetchTickets();
      } else {
        toast.error(data.message || "Failed to create ticket");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 overflow-hidden flex h-[700px] max-h-[85vh] transition-colors">
      
      {/* Left Sidebar - Ticket List */}
      <div className={`w-full md:w-1/3 lg:w-[35%] flex flex-col border-r border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 ${activeTicketId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-transparent shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Support Tickets</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-[#0088b3]/10 dark:bg-[#00D4FF]/10 hover:bg-[#0088b3]/20 dark:hover:bg-[#00D4FF]/20 text-[#0088b3] dark:text-[#00D4FF] rounded-lg transition-colors"
            title="New Ticket"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <DayalLoader size="sm" text="Loading support tickets..." />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-8">
              <Inbox className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No tickets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/5">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${
                    activeTicketId === ticket.id ? 'bg-gray-200 dark:bg-white/10 border-l-4 border-[#0088b3] dark:border-[#00D4FF]' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 pr-2">
                      {ticket.subject}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {getStatusIcon(ticket.status)}
                      {ticket.status?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">#{ticket.id}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Chat Details */}
      <div className={`w-full md:w-2/3 lg:w-[65%] flex flex-col bg-transparent ${!activeTicketId ? 'hidden md:flex' : 'flex'}`}>
        {activeTicketId ? (
          <SupportTicketDetails 
            ticketId={activeTicketId} 
            onBack={() => {
              setActiveTicketId(null);
              fetchTickets(); // Refresh list to get updated status
            }} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-[#0088b3] dark:text-[#00D4FF]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-outfit mb-2">How can we help?</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">
              Select a ticket from the left menu to view your conversation, or create a new ticket to get support.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-6 py-2.5 bg-[#00D4FF] hover:bg-[#33DEFF] text-[#050505] rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              Create New Ticket
            </button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Create New Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#0088b3]/50 dark:focus:border-[#00D4FF]/50 text-gray-900 dark:text-white transition-colors"
                >
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="General">General Inquiry</option>
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="Technical">Technical Support</option>
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="Billing">Billing & Payments</option>
                  <option className="bg-white dark:bg-[#111] text-gray-900 dark:text-white" value="Copyright">Copyright & Legal</option>
                </select>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#0088b3]/50 dark:focus:border-[#00D4FF]/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="E.g. Issue with download or payment"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                <textarea
                  required
                  rows="5"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#0088b3]/50 dark:focus:border-[#00D4FF]/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors resize-none"
                  placeholder="Please describe your issue in detail so we can help you better..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-bold text-[#050505] bg-[#00D4FF] hover:bg-[#33DEFF] rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] disabled:opacity-70 flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
