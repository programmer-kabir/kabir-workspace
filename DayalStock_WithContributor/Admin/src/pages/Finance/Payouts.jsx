import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuth from '../../utils/Hooks/useAuth';
import { DollarSign, Search, Calendar, FileText, Download, Check, X } from 'lucide-react';
import { authFetch } from '../../api/authFetch';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Payouts = () => {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, rejected
    
    // Modal states
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchWithdrawals();
    }, [statusFilter]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/admin_get_withdrawals.php`);
            url.searchParams.append('status', statusFilter);

            const res = await authFetch(url.toString());
            const data = await res.json();
            
            if (data.success) {
                setRequests(data.data);
            } else {
                toast.error(data.message || "Failed to load withdrawal requests");
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, actionStatus) => {
        let reason = null;
        if (actionStatus === 'rejected') {
            reason = prompt("Please enter the reason for rejection:");
            if (reason === null) return; // User cancelled
            if (reason.trim() === '') {
                toast.error("Rejection reason is required.");
                return;
            }
        } else {
            const confirm = window.confirm("Are you sure you want to approve and mark this as paid?");
            if (!confirm) return;
        }

        setProcessingId(id);
        try {
            const res = await authFetch(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/admin_update_withdrawal.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: actionStatus, rejection_reason: reason })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchWithdrawals();
            } else {
                toast.error(data.message || "Failed to update request");
            }
        } catch (error) {
            console.error("Error updating request:", error);
            toast.error("Network error");
        } finally {
            setProcessingId(null);
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Withdrawal Requests Report", 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        let subtitle = `Status Filter: ${statusFilter.toUpperCase()}`;
        doc.text(subtitle, 14, 30);

        const tableColumn = ["Req ID", "Contributor", "Amount", "Method", "Date", "Status"];
        const tableRows = [];

        requests.forEach(req => {
            const rowData = [
                `#${req.id}`,
                req.author_name || req.user_email,
                `$${parseFloat(req.amount).toFixed(2)}`,
                req.payment_method.toUpperCase(),
                new Date(req.requested_at).toLocaleDateString(),
                req.status.toUpperCase()
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [108, 79, 224] }
        });

        doc.save(`withdrawals_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6 p-4 sm:p-0">
            {/* HEADER SECTION */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(108,79,224,0.15) 0%, transparent 100%)", border: "1px solid rgba(108,79,224,0.2)" }}>
                <div className="absolute top-[-50%] right-[-10%] h-[300px] w-[300px] rounded-full bg-[#6C4FE0]/20 blur-[100px] pointer-events-none" />
                
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6C4FE0]/20 text-[#6C4FE0]">
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">Payout Management</h1>
                            <p className="mt-1 text-sm text-gray-400">
                                Approve or reject contributor withdrawal requests and view transaction history.
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={downloadPDF}
                        disabled={requests.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-[#6C4FE0] hover:bg-[#583cc2] px-6 py-3 font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6C4FE0]/20"
                    >
                        <Download size={18} />
                        <span>Download Report</span>
                    </button>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select 
                        className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none transition-all focus:border-[#6C4FE0]/50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed (Paid)</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-2xl border border-white/5 bg-[#12121E] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium tracking-wider">Req ID</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Contributor</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Method & Details</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                                <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6C4FE0] border-t-transparent"></div>
                                            <p className="text-gray-400">Loading requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500 mb-4">
                                            <Search size={24} />
                                        </div>
                                        <p className="text-lg font-medium text-white">No requests found</p>
                                        <p className="text-gray-500 mt-1">We couldn't find any withdrawal requests matching your filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map(item => (
                                    <tr key={item.id} className="group transition-colors hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-gray-400">
                                            <span className="font-mono text-xs">#{item.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{item.author_name}</div>
                                            <div className="mt-0.5 text-xs text-gray-500">{item.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-400">
                                            ${parseFloat(item.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-300 font-medium capitalize">{item.payment_method}</div>
                                            <div className="text-xs text-gray-500 max-w-[200px] truncate" title={item.payment_details}>
                                                {item.payment_details}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                <Calendar size={14} className="text-gray-500" />
                                                <span>{new Date(item.requested_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                item.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                            {item.status === 'rejected' && item.rejection_reason && (
                                                <div className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={item.rejection_reason}>
                                                    {item.rejection_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(item.id, 'completed')}
                                                        disabled={processingId === item.id}
                                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                        title="Approve & Mark as Paid"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(item.id, 'rejected')}
                                                        disabled={processingId === item.id}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                        title="Reject Request"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">-</span>
                                            )}
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

export default Payouts;

