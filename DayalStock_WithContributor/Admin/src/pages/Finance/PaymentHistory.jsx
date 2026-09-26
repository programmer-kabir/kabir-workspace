import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuth from '../../utils/Hooks/useAuth';
import { CreditCard, Search, Calendar, User as UserIcon, Mail } from 'lucide-react';
import { authFetch } from '../../api/authFetch';

const PaymentHistory = () => {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSource, setFilterSource] = useState('');
    const [filterType, setFilterType] = useState('month'); // date, month, year
    const [filterValue, setFilterValue] = useState('');

    useEffect(() => {
        fetchPaymentHistory();
    }, [filterSource, filterType, filterValue]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/get_payment_history.php`);
            if (filterSource) url.searchParams.append('source', filterSource);
            if (filterType && filterValue) {
                url.searchParams.append('filter_type', filterType);
                url.searchParams.append('filter_value', filterValue);
            }

            const res = await authFetch(url.toString());
            const data = await res.json();
            
            if (data.success) {
                setHistory(data.data);
            } else {
                toast.error(data.message || "Failed to load payment history");
            }
        } catch (error) {
            console.error("Error fetching payment history:", error);
            // toast.error("Network error fetching payment history");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-0">
            {/* HEADER SECTION */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(108,79,224,0.15) 0%, transparent 100%)", border: "1px solid rgba(108,79,224,0.2)" }}>
                <div className="absolute top-[-50%] right-[-10%] h-[300px] w-[300px] rounded-full bg-[#6C4FE0]/20 blur-[100px] pointer-events-none" />
                
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6C4FE0]/20 text-[#6C4FE0]">
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">Payment History</h1>
                            <p className="mt-1 text-sm text-gray-400">
                                View all payments made by users across the platform.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 rounded-2xl border border-[#6C4FE0]/30 bg-[#6C4FE0]/10 px-4 py-2 font-semibold text-white">
                        <span className="text-[#6C4FE0] text-lg">{history.length}</span>
                        <span className="text-gray-300 text-sm">Transactions</span>
                    </div>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select 
                        className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none transition-all focus:border-[#6C4FE0]/50"
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                    >
                        <option value="">All Sources</option>
                        <option value="subscription">Subscriptions</option>
                        <option value="exclusive_buyout">Exclusive Buyout</option>
                    </select>

                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12121E] p-1">
                        <select 
                            className="bg-transparent px-3 py-1.5 text-sm font-medium text-gray-300 outline-none border-r border-white/10"
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setFilterValue('');
                            }}
                        >
                            <option value="date">Specific Date</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                        </select>
                        
                        {filterType === 'date' && (
                            <input 
                                type="date"
                                className="bg-transparent px-3 py-1.5 text-sm font-medium text-gray-300 outline-none [color-scheme:dark]"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                            />
                        )}
                        {filterType === 'month' && (
                            <input 
                                type="month"
                                className="bg-transparent px-3 py-1.5 text-sm font-medium text-gray-300 outline-none [color-scheme:dark]"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                            />
                        )}
                        {filterType === 'year' && (
                            <input 
                                type="number"
                                placeholder="YYYY"
                                min="2020"
                                max="2050"
                                className="bg-transparent px-3 py-1.5 text-sm font-medium text-gray-300 outline-none w-24"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                            />
                        )}
                        {filterValue && (
                            <button 
                                onClick={() => setFilterValue('')}
                                className="px-2 text-gray-500 hover:text-white"
                                title="Clear date filter"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-2xl border border-white/5 bg-[#12121E] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium tracking-wider">ID</th>
                                <th className="px-6 py-4 font-medium tracking-wider">User</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Source</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6C4FE0] border-t-transparent"></div>
                                            <p className="text-gray-400">Loading payment history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500 mb-4">
                                            <Search size={24} />
                                        </div>
                                        <p className="text-lg font-medium text-white">No payment history found</p>
                                        <p className="text-gray-500 mt-1">We couldn't find any payments matching your filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                history.map(item => (
                                    <tr key={item.id} className="group transition-colors hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-gray-400">
                                            <span className="font-mono text-xs">#{item.transaction_id || item.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{item.user_name || `User ID: ${item.user_id}`}</div>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                                                <Mail size={12} />
                                                {item.user_email || 'No email available'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                item.payment_source === 'subscription' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            }`}>
                                                {item.payment_source.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-400">
                                            ${parseFloat(item.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                item.status === 'verified' || item.status === 'success' || item.status === 'completed'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                <Calendar size={14} className="text-gray-500" />
                                                <span>{new Date(item.created_at).toLocaleString()}</span>
                                            </div>
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

export default PaymentHistory;
