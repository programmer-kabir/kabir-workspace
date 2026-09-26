import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, User, ShieldAlert, Clock, Paperclip, X } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../../utlis/Hooks/useAuth";

const STATUS_STYLES = {
  Open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Pending_Reply: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  Closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const SupportTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticketData, setTicketData] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchTicketData();
      
      // Auto-refresh messages every 5 seconds
      const interval = setInterval(() => {
        fetchTicketData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user, id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticketData]);

  const fetchTicketData = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/get_ticket_details.php?id=${id}&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTicketData(data);
      } else {
        toast.error(data.message || "Failed to load ticket details");
        navigate("/dashboard/support");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading ticket");
      navigate("/dashboard/support");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() && selectedFiles.length === 0) return;
    setIsReplying(true);
    try {
      const token = await user.getIdToken();
      let attachmentUrl = null;

      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("attachment", file);

          const uploadRes = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/upload_attachment.php`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          return uploadRes.json();
        });

        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter(r => r.success).map(r => r.url);
        
        if (successfulUploads.length > 0) {
          attachmentUrl = successfulUploads.join(',');
        }

        if (uploadResults.some(r => !r.success)) {
          toast.warning("Some files failed to upload");
        }
      }

      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/reply_ticket.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticket_id: id, message: replyMessage, attachment_url: attachmentUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage("");
        setSelectedFiles([]);
        fetchTicketData(); // Refresh messages
      } else {
        toast.error(data.message || "Failed to send reply");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-135px)] w-full rounded-2xl border border-white/10 bg-[#0F0F1A] shadow-xl">
        <div className="w-10 h-10 border-4 border-[#6C4FE0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticketData) return null;

  const ticket = ticketData.ticket;
  const messages = ticketData.messages;

  return (
    <div className="flex flex-col h-[calc(100vh-135px)] w-full rounded-2xl border border-white/10 bg-[#0F0F1A] shadow-xl overflow-hidden">
      {/* Header with back button */}
      <div className="border-b border-white/10 p-5 bg-[#161625] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/support")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
              <span
                className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded border ${
                  STATUS_STYLES[ticket.status] || STATUS_STYLES.Open
                }`}
              >
                {ticket.status.replace("_", " ")}
              </span>
              {ticketData?.is_admin_online ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Support Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/20 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                  Support Offline
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 font-medium">
              <span className="text-[#6C4FE0] font-bold">#{ticket.id}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {new Date(ticket.created_at).toLocaleString()}
              </span>
              <span>Department: <strong className="text-gray-300">{ticket.department}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative"
        style={{
          backgroundColor: '#0a0a12',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'32\' height=\'56\' viewBox=\'0 0 32 56\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%236c4fe0\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M16 26.2V11.8l-12-7v14.4l12 7zm0 2.4l12-7V7.2l-12 7v14.4zm-13.6-8.8l-2.4-1.4V4.4L16 .8l16 9.2v14.4l-2.4 1.4-13.6-7.8-13.6 7.8zm0 26.4v-14.4l12 7v14.4l-12-7zm15.2 0l12-7V29.8l-12 7v14.4zM0 48.6l16 9.2 16-9.2v-14.4l-2.4 1.4-13.6-7.8-13.6 7.8-2.4-1.4v14.4z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex justify-center py-20">
            <p className="text-gray-500 text-sm">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.is_admin_reply === 1;
            return (
              <div
                key={msg.id}
                className={`flex w-full items-end gap-3 ${isAdmin ? "justify-start" : "justify-end"}`}
              >
                {isAdmin && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C4FE0] to-[#FF6B6B] shadow-lg">
                    <ShieldAlert size={18} className="text-white" />
                  </div>
                )}
                
                <div className={`flex flex-col ${isAdmin ? "items-start" : "items-end"} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className={`text-[11px] font-bold ${isAdmin ? "text-gray-300" : "text-[#6C4FE0]"}`}>
                      {isAdmin ? "Support Team" : "You"}
                    </span>
                    <span className="text-[10px] font-medium text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                      isAdmin
                        ? "bg-white/5 border border-white/10 rounded-bl-sm text-gray-200"
                        : "bg-[#252538] border border-white/5 rounded-br-sm text-gray-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                    {msg.attachment_url && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachment_url.split(',').map((url, idx) => (
                          <div key={idx} className="rounded bg-black/20 p-2 border border-white/5 w-fit max-w-full">
                            <a href={`${import.meta.env.VITE_IMG_KEY}/${url}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
                              <img 
                                src={`${import.meta.env.VITE_IMG_KEY}/${url}`} 
                                alt="Attachment" 
                                className="max-h-40 rounded-lg object-contain"
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!isAdmin && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/5 shadow-inner">
                    <User size={18} className="text-gray-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* <div ref={messagesEndRef} /> */}
      </div>

      {/* Reply Box */}
      {ticket.status !== "Closed" && ticket.status !== "Resolved" ? (
        <div className="border-t border-white/5 p-5 bg-[#161625] shrink-0">
          
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-xl w-fit pr-4">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C4FE0]/20 text-[#6C4FE0]">
                      <Paperclip size={14} />
                    </div>
                    <span className="max-w-[150px] truncate">{file.name}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                    className="ml-4 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleReply} className="flex items-end gap-4 bg-black/20 p-2 rounded-2xl border border-white/5 focus-within:border-[#6C4FE0]/50 focus-within:bg-black/40 transition-all relative">
            <input 
              type="file" 
              multiple
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const filesArray = Array.from(e.target.files);
                  if (selectedFiles.length + filesArray.length > 3) {
                    toast.warning("You can only attach up to 3 files.");
                    const allowedFiles = filesArray.slice(0, 3 - selectedFiles.length);
                    setSelectedFiles(prev => [...prev, ...allowedFiles]);
                  } else {
                    setSelectedFiles(prev => [...prev, ...filesArray]);
                  }
                  // Reset input value so same files can be selected again if removed
                  e.target.value = null;
                }
              }}
              className="hidden" 
            />
            
            <div className="flex-1 relative">
              <textarea
                rows={1}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply to support..."
                className="w-full bg-transparent pl-4 pr-12 py-3 text-sm text-white outline-none resize-none custom-scrollbar"
                style={{ minHeight: "44px", maxHeight: "150px" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 bottom-3 text-gray-400 hover:text-white transition-colors"
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isReplying || (!replyMessage.trim() && selectedFiles.length === 0)}
              className="flex h-11 px-6 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6C4FE0] text-white shadow-lg transition-all hover:bg-[#5a40c2] disabled:opacity-50 disabled:hover:bg-[#6C4FE0] font-bold text-sm"
            >
              <Send size={16} className={replyMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              Send
            </button>
          </form>
        </div>
      ) : (
          <div className="border-t border-white/5 p-5 bg-[#161625] text-center shrink-0">
            <p className="text-sm font-medium text-gray-500 bg-white/5 py-3 rounded-xl border border-white/5">This ticket is closed. You cannot send replies.</p>
          </div>
      )}
    </div>
  );
};

export default SupportTicket;
