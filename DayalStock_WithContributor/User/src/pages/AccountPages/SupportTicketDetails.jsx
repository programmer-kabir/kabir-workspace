import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../../utlis/Hooks/useAuth';
import { ArrowLeft, Send, Paperclip, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const SupportTicketDetails = ({ ticketId, onBack }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminLastActive, setAdminLastActive] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/get_ticket_details.php?id=${ticketId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket);
        setMessages(data.messages || []);
        setAdminOnline(data.is_admin_online);
        setAdminLastActive(data.admin_last_active);
      } else {
        toast.error(data.message || "Failed to load ticket details");
        onBack();
      }
    } catch (err) {
      console.error("Error fetching ticket details", err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ticketId) {
      fetchTicketDetails();
    }
  }, [user, ticketId]);

  // Ping the server to stay online
  useEffect(() => {
    let intervalId;
    
    const pingServer = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/ping.php`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error("Failed to ping server", err);
      }
    };

    if (user) {
      pingServer(); // Ping immediately on mount
      intervalId = setInterval(pingServer, 2 * 60 * 1000); // Ping every 2 mins
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/reply_ticket.php`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          message: replyMessage
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setReplyMessage("");
        fetchTicketDetails(); // Refresh messages
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = () => {
    setShowCloseConfirm(true);
  };

  const confirmCloseTicket = async () => {
    setLoading(true);
    setShowCloseConfirm(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/user_close_ticket.php`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ticket_id: ticketId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ticket closed successfully");
        fetchTicketDetails();
      } else {
        toast.error(data.message || "Failed to close ticket");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to close ticket");
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved':
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (loading && !ticket) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status?.toLowerCase() === 'closed';

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-transparent shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Back button is only visible on mobile, since on desktop we show side-by-side */}
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate font-outfit">
              #{ticket.id} - {ticket.subject}
            </h2>
            <div className="flex items-center gap-3 text-xs mt-0.5">
              <span className="flex items-center gap-1 font-medium capitalize text-gray-600 dark:text-gray-400">
                {getStatusIcon(ticket.status)}
                {ticket.status?.replace('_', ' ')}
              </span>
              <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">
                Created: {new Date(ticket.created_at).toLocaleDateString()}
              </span>
              <span className="text-gray-400 dark:text-gray-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  {adminOnline ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400"></span>
                  )}
                </span>
                <span className={`text-xs ${adminOnline ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {adminOnline ? 'Support Online' : (adminLastActive ? `Support last seen: ${new Date(adminLastActive).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : 'Support Offline')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isClosed && (
            <button
              onClick={handleCloseTicket}
              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
            >
              Close Ticket
            </button>
          )}
          <button 
            onClick={fetchTicketDetails}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
            title="Refresh Messages"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full mb-4">
              Ticket Created on {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>

          {messages.map((msg, idx) => {
            const isAdmin = parseInt(msg.is_admin_reply) === 1;
            
            return (
              <div key={msg.id || idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] ${
                  isAdmin 
                    ? 'bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-300 rounded-tl-sm' 
                    : 'bg-[#0088b3] dark:bg-[#00D4FF] text-white dark:text-[#050505] rounded-tr-sm'
                }`}>
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#0088b3] dark:text-[#00D4FF]">DayalStock Support</span>
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                    {msg.message}
                  </div>
                  
                  {msg.attachment_url && (
                    <div className="mt-2.5">
                      {msg.attachment_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <a href={`${import.meta.env.VITE_IMG_KEY}/${msg.attachment_url}`} target="_blank" rel="noreferrer">
                          <img 
                            src={`${import.meta.env.VITE_IMG_KEY}/${msg.attachment_url}`} 
                            alt="Attachment" 
                            className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-white/10 object-contain bg-white dark:bg-[#111]"
                          />
                        </a>
                      ) : (
                        <a 
                          href={`${import.meta.env.VITE_IMG_KEY}/${msg.attachment_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors w-fit ${
                            isAdmin ? 'bg-white dark:bg-white/5 text-[#0088b3] dark:text-[#00D4FF] hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5' : 'bg-black/10 dark:bg-[#050505]/20 text-white dark:text-[#050505] hover:bg-black/20 dark:hover:bg-[#050505]/30'
                          }`}
                        >
                          <Paperclip className="w-4 h-4" />
                          View Attachment
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className={`text-[10px] mt-1.5 text-right font-medium ${isAdmin ? 'text-gray-500' : 'text-white/80 dark:text-[#050505]/70'}`}>
                    {new Date(msg.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Input Area */}
      <div className="p-3 sm:p-4 bg-transparent border-t border-gray-200 dark:border-white/5 shrink-0">
        {isClosed ? (
          <div className="text-center p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-400 text-sm font-medium">
            This ticket is closed. You cannot send new messages.
          </div>
        ) : (
          <form onSubmit={handleReply} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-full focus:outline-none focus:border-[#0088b3]/50 dark:focus:border-[#00D4FF]/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className="w-12 h-12 shrink-0 bg-[#0088b3] dark:bg-[#00D4FF] hover:bg-[#00a3cc] dark:hover:bg-[#33DEFF] text-white dark:text-[#050505] rounded-full flex items-center justify-center transition-all shadow-sm dark:shadow-[0_0_15px_rgba(0,212,255,0.2)] disabled:opacity-50 disabled:hover:bg-[#0088b3] dark:disabled:hover:bg-[#00D4FF]"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-1" />
              )}
            </button>
          </form>
        )}
      </div>

      {/* Close Ticket Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 transition-colors">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">Close Ticket?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Are you sure you want to close this ticket? Once closed, you won't be able to send any new messages.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCloseTicket}
                  className="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Yes, Close It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketDetails;
