import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuth from '../../utils/Hooks/useAuth';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { authFetch } from '../../api/authFetch';

const CompanyEarnings = () => {
    const { token } = useAuth();
    const [earnings, setEarnings] = useState([]);
    const [totalEarned, setTotalEarned] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [filterType, setFilterType] = useState('month'); // date, month, year
    const [filterValue, setFilterValue] = useState('');
    const [transactionType, setTransactionType] = useState('');

    useEffect(() => {
        fetchEarnings();
    }, [filterType, filterValue, transactionType]);

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/get_company_earnings.php`);
            if (transactionType) url.searchParams.append('type', transactionType);
            if (filterType && filterValue) {
                url.searchParams.append('filter_type', filterType);
                url.searchParams.append('filter_value', filterValue);
            }

            const res = await authFetch(url.toString());
            const data = await res.json();
            
            if (data.success) {
                setEarnings(data.data);
                setTotalEarned(data.total_earned);
            } else {
                toast.error(data.message || "Failed to load company earnings");
            }
        } catch (error) {
            console.error("Error fetching earnings:", error);
            // toast.error("Network error fetching earnings");
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
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">Company Earnings</h1>
                            <p className="mt-1 text-sm text-gray-400">
                                Monitor company revenue from subscriptions, buyouts, and expired plans.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#12121E] p-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Revenue (Filtered)</p>
                            <h3 className="text-2xl font-bold text-white">${parseFloat(totalEarned).toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#12121E] p-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6C4FE0]/10 text-[#6C4FE0] border border-[#6C4FE0]/20">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-white">{earnings.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select 
                        className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none transition-all focus:border-[#6C4FE0]/50"
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="subscription">Subscription (30%)</option>
                        <option value="buyout">Exclusive Buyout (30%)</option>
                        <option value="expired_sub">Expired Sub (70%)</option>
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
                                <th className="px-6 py-4 font-medium tracking-wider">Type</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Total Amount</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Company Earned</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Month</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6C4FE0] border-t-transparent"></div>
                                            <p className="text-gray-400">Loading earnings...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : earnings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500 mb-4">
                                            <DollarSign size={24} />
                                        </div>
                                        <p className="text-lg font-medium text-white">No earnings found</p>
                                        <p className="text-gray-500 mt-1">We couldn't find any earnings matching your filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                earnings.map(item => (
                                    <tr key={item.id} className="group transition-colors hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-gray-400">#{item.id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                item.transaction_type === 'subscription' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                item.transaction_type === 'buyout' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                                {item.transaction_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-300">
                                            ${parseFloat(item.total_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-400">
                                            +${parseFloat(item.company_earned).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar size={14} className="text-gray-500" />
                                                <span>{item.earning_month}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(item.created_at).toLocaleString()}
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

export default CompanyEarnings;
