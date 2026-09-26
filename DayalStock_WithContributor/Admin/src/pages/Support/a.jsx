import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft, Send, Paperclip, Lock, User, Clock,
    CheckCircle, MoreVertical, AlertCircle, Calendar,
    DollarSign, Shield, X
} from 'lucide-react';
import { authFetch } from '../../api/authFetch';

const TicketConversation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [attachment, setAttachment] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTicketDetails();
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTicketDetails = async () => {
        try {
            const res = await authFetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/get_ticket_details.php?id=${id}`);
            const data = await res.json();

            if (data.success) {
                setTicket(data.ticket);
                setMessages(data.messages);
            } else {
                toast.error(data.message || "Failed to load ticket");
                navigate('/dashboard/support-tickets');
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            const res = await authFetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/reply_ticket.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: id,
                    message: replyText,
                    attachment_url: attachment || null,
                    is_internal_note: isInternal ? 1 : 0
                })
            });
            const data = await res.json();
            if (data.success) {
                setReplyText('');
                setAttachment('');
                setIsInternal(false);
                fetchTicketDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!window.confirm("Are you sure you want to close this ticket?")) return;
        try {
            const res = await authFetch(`${import.meta.env.VITE_LOCALHOST_KEY}/support/update_ticket_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: id, status: 'Closed' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Ticket closed");
                fetchTicketDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to close ticket");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6C4FE0] border-t-transparent"></div>
                    <p className="text-gray-400 font-medium tracking-wide">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <>
            <style>
                {`
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.02);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(108, 79, 224, 0.5);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(108, 79, 224, 0.8);
            }
            `}
            </style>
            <div className="flex flex-col lg:flex-row gap-6 flex-1 w-full overflow-hidden">

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-[#12121E] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">

                    {/* Header (Sticky) */}
                    <div className="flex items-center justify-between p-4 sm:p-6 bg-[#1A1A2E] border-b border-white/5 z-10 sticky top-0">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard/support-tickets"
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all hover:-translate-x-1"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white tracking-tight">{ticket?.subject}</h2>
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${ticket?.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        ticket?.status === 'Closed' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {ticket?.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 font-medium">
                                    <span className="text-indigo-400">#{ticket?.id}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(ticket?.created_at).toLocaleString()}</span>
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                                        Department: <span className="text-white">{ticket?.department}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        {ticket?.status !== 'Closed' && (
                            <button
                                onClick={handleCloseTicket}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-red-500/20"
                            >
                                <CheckCircle size={18} /> Mark as Resolved
                            </button>
                        )}
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 relative overflow-hidden bg-[#0B0B13]">
                        {/* Fixed Background Texture (Visible) */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-30 pointer-events-none"></div>

                        {/* Scrollable Area */}
                        <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6">
                            <div className="relative z-10 flex flex-col space-y-6 min-h-full">
                                {messages?.map((msg, idx) => {
                                    const isAdmin = msg?.is_admin_reply == 1;
                                    const isNote = msg?.is_internal_note == 1;

                                    return (
                                        <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>

                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border ${isAdmin ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/30 text-white'
                                                    : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600/30 text-gray-300'
                                                    }`}>
                                                    {isAdmin ? <Shield size={18} /> : <User size={18} />}
                                                </div>

                                                {/* Bubble */}
                                                <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                                    <div className={`flex items-baseline gap-2 mb-1.5 px-1 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <span className="font-bold text-sm text-gray-200">
                                                            {isAdmin ? 'Support Team' : msg?.sender_name}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 font-medium">
                                                            {new Date(msg?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <div className={`p-4 rounded-2xl shadow-md relative text-sm leading-relaxed ${isNote ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tr-sm' :
                                                        isAdmin ? 'bg-indigo-600 border border-indigo-500 text-white rounded-tr-sm' :
                                                            'bg-[#1E1E2E] border border-white/5 text-gray-200 rounded-tl-sm'
                                                        }`}>
                                                        {isNote && (
                                                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-400 mb-2 bg-amber-500/10 inline-flex px-2 py-1 rounded-md">
                                                                <Lock size={12} /> Internal Note
                                                            </div>
                                                        )}

                                                        <div className="whitespace-pre-wrap">{msg?.message}</div>

                                                        {msg?.attachment_url && (
                                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                                <a
                                                                    href={msg.attachment_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-2 text-xs font-semibold bg-black/30 hover:bg-black/50 px-4 py-2.5 rounded-xl transition-colors"
                                                                >
                                                                    <Paperclip size={16} className={isAdmin ? "text-indigo-300" : "text-gray-400"} />
                                                                    View Attachment
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>
                        </div>
                    </div>




                    {/* Reply Footer (Sticky) */}
                    {ticket.status !== 'Closed' ? (
                        <div className="p-4 sm:p-5 bg-[#1A1A2E] border-t border-white/5 sticky bottom-0 z-10 mt-auto">

                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 cursor-pointer hover:text-amber-400 transition-colors group">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isInternal ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-500 group-hover:border-amber-400'}`}>
                                        {isInternal && <CheckCircle size={14} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                                    <Lock size={14} className={isInternal ? 'text-amber-500' : ''} />
                                    Internal Note (Hidden from user)
                                </label>

                                {attachment && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                                        <Paperclip size={12} /> Attachment added
                                        <button onClick={() => setAttachment('')} className="p-1 hover:bg-indigo-500/20 rounded-md text-red-400 transition-colors"><X size={12} /></button>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="flex items-end gap-3">
                                <div className="flex-1 relative bg-[#0B0B13] border border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={isInternal ? "Type a private note for admins only..." : "Type your reply to the user..."}
                                        className={`w-full max-h-[200px] min-h-[80px] p-4 pr-12 bg-transparent text-sm text-white resize-y outline-none placeholder-gray-500 ${isInternal ? 'placeholder-amber-700/50' : ''}`}
                                    />
                                    <button
                                        onClick={() => {
                                            const url = prompt("Enter Image/File URL (Mock Attachment):");
                                            if (url) setAttachment(url);
                                        }}
                                        className="absolute bottom-3 right-3 p-2 rounded-xl text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                        title="Attach File"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleSendReply}
                                    disabled={sending || !replyText.trim()}
                                    className={`h-14 px-6 rounded-2xl flex items-center justify-center font-bold gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isInternal
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25'
                                        : 'bg-gradient-to-r from-[#6C4FE0] to-[#583cc2] hover:from-[#583cc2] hover:to-[#4a32a8] text-white shadow-lg shadow-[#6C4FE0]/25'
                                        }`}
                                >
                                    {sending ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <Send size={18} className={isInternal ? '' : 'rotate-12'} />
                                            <span className="hidden sm:inline">{isInternal ? 'Save Note' : 'Send'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-[#1A1A2E] border-t border-white/5 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-500/10 text-gray-400 text-sm font-medium">
                                <Lock size={16} /> This ticket is closed and cannot receive new replies.
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (User Info) */}
                <div className="w-full lg:w-[320px] flex flex-col gap-6 overflow-y-auto pr-2 pb-4 custom-scrollbar">

                    {/* User Card */}
                    <div className="bg-[#12121E] rounded-2xl border border-white/5 p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <User size={16} /> Customer Details
                        </h3>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-[2px]">
                                <div className="w-full h-full bg-[#12121E] rounded-full flex items-center justify-center">
                                    <span className="text-xl font-bold text-emerald-400">
                                        {ticket.user_name ? ticket.user_name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-white text-lg">{ticket.user_name}</div>
                                <div className="text-sm text-gray-500">{ticket.user_email}</div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400 flex items-center gap-2"><Calendar size={14} /> Member Since</span>
                                <span className="text-sm font-medium text-white">Jan 2026</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400 flex items-center gap-2"><DollarSign size={14} /> Total Spent</span>
                                <span className="text-sm font-bold text-emerald-400">$249.00</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400 flex items-center gap-2"><AlertCircle size={14} /> Open Tickets</span>
                                <span className="text-sm font-medium text-white">2</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-colors">
                            View Full Profile
                        </button>
                    </div>

                    {/* Ticket Meta */}
                    <div className="bg-[#12121E] rounded-2xl border border-white/5 p-6 shadow-xl flex-1">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Shield size={16} /> Ticket Meta
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Priority</label>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${ticket.priority === 'Urgent' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
                                    ticket.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                        'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                    }`}>
                                    {ticket.priority.toUpperCase()}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Department</label>
                                <div className="text-sm font-medium text-white bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                    {ticket.department}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Assigned To</label>
                                <div className="text-sm font-medium text-gray-400 italic px-3 py-2">
                                    Unassigned
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default TicketConversation;

