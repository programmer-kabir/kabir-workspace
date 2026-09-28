import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuth from '../../utils/Hooks/useAuth';
import { CreditCard, Search, Calendar, FileText, Download, User as UserIcon } from 'lucide-react';
import { authFetch } from '../../api/authFetch';
import DayalLoader from '../../components/Common/DayalLoader';

const BillingInvoices = () => {
    const { token } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/get_payment_history.php`);
            const res = await authFetch(url.toString());
            const data = await res.json();
            
            if (data.success) {
                setInvoices(data.data || []);
            } else {
                setInvoices([]);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.user_name && item.user_name.toLowerCase().includes(term)) ||
            (item.user_email && item.user_email.toLowerCase().includes(term)) ||
            (item.transaction_id && item.transaction_id.toLowerCase().includes(term)) ||
            (item.plan_name && item.plan_name.toLowerCase().includes(term))
        );
    });

    return (
        <div className="space-y-6 p-4 sm:p-0">
            {/* HEADER SECTION */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(108,79,224,0.15) 0%, transparent 100%)", border: "1px solid rgba(108,79,224,0.2)" }}>
                <div className="absolute top-[-50%] right-[-10%] h-[300px] w-[300px] rounded-full bg-[#6C4FE0]/20 blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <FileText className="w-8 h-8 text-[#6C4FE0]" />
                            Billing & Invoices
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Manage user transactions, invoices, and billing records
                        </p>
                    </div>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="bg-[#131320] border border-white/10 rounded-xl p-4">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by user, email, transaction ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#0A0A12] border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#6C4FE0]"
                    />
                </div>
            </div>

            {/* INVOICES TABLE */}
            <div className="bg-[#131320] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#181828] text-xs uppercase text-gray-400 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4">Transaction / ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Item / Plan</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Payment Method</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12">
                                        <DayalLoader size="sm" text="Loading invoices..." />
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-500">
                                        No billing records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv, idx) => (
                                    <tr key={inv.id || idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-purple-400">
                                            {inv.transaction_id || inv.id || `TXN-${idx + 1}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{inv.user_name || inv.user_email || 'Customer'}</div>
                                            {inv.user_email && <div className="text-xs text-gray-500">{inv.user_email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#6C4FE0]/20 text-[#A58BFF]">
                                                {inv.plan_name || inv.type || 'Subscription / Credits'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-emerald-400">
                                            ${parseFloat(inv.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {inv.payment_method || 'Online'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Completed
                                            </span>
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

export default BillingInvoices;
