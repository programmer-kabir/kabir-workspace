import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Headset, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { authFetch } from '../../api/authFetch';

const SupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({ total: 0, open: 0, unanswered: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_LOCALHOST_KEY}/support/admin_get_tickets.php`);
            url.searchParams.append('status', statusFilter);
            url.searchParams.append('priority', priorityFilter);

            const res = await authFetch(url.toString());
            const data = await res.json();
            
            if (data.success) {
                setTickets(data.data);
                setStats(data.stats);
            } else {
                toast.error(data.message || "Failed to load tickets");
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-0">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, transparent 100%)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="absolute top-[-50%] right-[-10%] h-[300px] w-[300px] rounded-full bg-red-500/20 blur-[100px] pointer-events-none" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-500">
                            <Headset size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">Support Desk</h1>
                            <p className="mt-1 text-sm text-gray-400">
                                Manage user inquiries, copyright claims, and technical issues.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5">
                    <div className="text-gray-400 text-sm font-medium">Total Tickets</div>
                    <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="text-emerald-400 text-sm font-medium flex items-center gap-2"><Clock size={16}/> Open</div>
                    <div className="text-2xl font-bold text-emerald-500 mt-1">{stats.open}</div>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <div className="text-amber-400 text-sm font-medium flex items-center gap-2"><AlertCircle size={16}/> Unanswered</div>
                    <div className="text-2xl font-bold text-amber-500 mt-1">{stats.unanswered}</div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-[#12121E] p-5">
                    <div className="text-gray-400 text-sm font-medium flex items-center gap-2"><CheckCircle size={16}/> Closed</div>
                    <div className="text-2xl font-bold text-gray-300 mt-1">{stats.closed}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <select 
                    className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="Pending_Reply">Pending Reply</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                </select>
                <select 
                    className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                >
                    <option value="all">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/5 bg-[#12121E] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Ticket ID</th>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Subject</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Priority</th>
                                <th className="px-6 py-4 font-medium">Updated</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center">
                                        <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div></div>
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No tickets found.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className={`group transition-colors hover:bg-white/[0.02] ${ticket.priority === 'Urgent' && ticket.status !== 'Closed' ? 'bg-red-500/5' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-xs">{ticket.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{ticket.user_name}</div>
                                            <div className="text-xs text-gray-500">{ticket.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-200">{ticket.subject}</div>
                                            <div className="text-xs text-gray-500">{ticket.department}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                ticket.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400' :
                                                ticket.status === 'Pending_Reply' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-gray-500/10 text-gray-400'
                                            }`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                ticket.priority === 'Urgent' ? 'bg-red-500 text-white' :
                                                ticket.priority === 'High' ? 'text-orange-400' :
                                                ticket.priority === 'Medium' ? 'text-blue-400' : 'text-gray-400'
                                            }`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {new Date(ticket.updated_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                to={`/dashboard/support-tickets/${ticket.id}`}
                                                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
                                            >
                                                View Ticket
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupportTickets;
