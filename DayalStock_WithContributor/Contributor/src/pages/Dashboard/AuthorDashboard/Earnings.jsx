import { useState, useEffect } from "react";
import { DollarSign, ArrowUpRight, TrendingUp, Calendar, Check, AlertCircle, CreditCard, Loader2, Download, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../../utlis/Hooks/useAuth";

const Earnings = () => {
  const { user } = useAuth();
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const verifiedMethods = payoutMethods.filter(m => m.status === 'verified');

  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("All"); // "All" or "01", "02", etc.
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  const years = Array.from({ length: Math.max(1, currentYear - 2026 + 1) }, (_, i) => 2026 + i);

  const monthNames = [
    { value: "All", label: "All Months" },
    { value: "01", label: "January" }, { value: "02", label: "February" },
    { value: "03", label: "March" }, { value: "04", label: "April" },
    { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" },
    { value: "09", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  useEffect(() => {
    const fetchPayoutMethods = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/payout/get_payout_methods.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setPayoutMethods(data.methods || []);
          const verified = (data.methods || []).filter(m => m.status === 'verified');
          if (verified.length > 0) {
            setSelectedMethodId(verified[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load payout methods", err);
      }
    };
    fetchPayoutMethods();
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/get_author_earnings.php`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setEarningsData(data);
      } else {
        toast.error(data.message || "Failed to load earnings");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  const handleWithdraw = async (invoiceId) => {
    if (!invoiceId) return;

    if (!selectedMethodId) {
      toast.error("Please select a verified payout method from the Preferences box.");
      return;
    }

    const selectedMethod = verifiedMethods.find(m => m.id.toString() === selectedMethodId);
    if (!selectedMethod) return;

    try {
      setWithdrawing(true);
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/request_withdrawal.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          payment_method: selectedMethod.payment_method,
          payment_details: selectedMethod.account_email
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchEarnings(); // Refresh data
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to request withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDownloadInvoice = async (month) => {
    try {
      setDownloadingInvoice(month);
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/generate_monthly_invoice_pdf.php?month=${month}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DayalStock_Earnings_Statement_${month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[#6C4FE0]" size={32} />
      </div>
    );
  }

  const wallet = earningsData?.wallet || { balance: 0, total_earned: 0, total_withdrawn: 0 };
  const payouts = earningsData?.withdrawals || [];
  const items = earningsData?.items || [];
  const monthlyData = earningsData?.invoices || [];

  const filteredMonthlyData = monthlyData.filter(item => {
    const yearMatch = item.earning_month.startsWith(selectedYear.toString());
    const monthMatch = selectedMonth === "All" || item.earning_month.endsWith(`-${selectedMonth}`);
    return yearMatch && monthMatch;
  });

  // Calculate threshold percentage
  const threshold = 100;
  const progressPercent = Math.min((wallet.balance / threshold) * 100, 100).toFixed(1);

  const isInvoiceExpired = (createdAtStr) => {
    if (!createdAtStr) return false;
    const createdDate = new Date(createdAtStr);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 5;
  };

  return (
    <div className="space-y-6">

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">Earnings & Payouts</h2>
        <p className="text-sm text-gray-400">Track your referral income, downloads royalty, and retrieve payments</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

        {/* TOTAL EARNINGS */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Earnings</span>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">${wallet.total_earned.toFixed(2)}</h3>
          </div>
        </div>

        {/* CURRENT BALANCE */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unpaid Balance</span>
            <div className="rounded-lg bg-[#6C4FE0]/10 p-2 text-[#6C4FE0]">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">${wallet.balance.toFixed(2)}</h3>
          </div>
        </div>

        {/* TOTAL WITHDRAWN */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Withdrawn</span>
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">${wallet.total_withdrawn.toFixed(2)}</h3>
          </div>
        </div>

        {/* THRESHOLD METER */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payout Threshold</span>
            <div className="rounded-lg bg-white/5 p-2 text-gray-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">${wallet.balance.toFixed(2)} / ${threshold}</span>
              <span className="text-[#FF6B6B] font-bold">{progressPercent}%</span>
            </div>
            {/* PROGRESS BAR */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* LEFT COLUMN: MONTHLY EARNINGS & PAYOUT DETAILS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Monthly Earnings Table */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white">Monthly Invoices</h3>
              <div className="flex items-center gap-2">
                {/* Year Dropdown */}
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="appearance-none cursor-pointer bg-[#1A1A27] border border-white/5 text-gray-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 outline-none transition-colors hover:text-white"
                  >
                    {years.map(y => (
                      <option key={y} value={y} className="bg-[#14141E]">{y}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                {/* Month Dropdown */}
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none cursor-pointer bg-[#1A1A27] border border-white/5 text-gray-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 outline-none transition-colors hover:text-white"
                  >
                    {monthNames.map(m => (
                      <option key={m.value} value={m.value} className="bg-[#14141E]">{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Month</th>
                    <th className="pb-3">Downloads</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Revenue</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredMonthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-500">No monthly earnings found for {selectedYear}</td>
                    </tr>
                  ) : (
                    filteredMonthlyData.map((item, idx) => {
                      const isExpired = item.status === 'unpaid' && isInvoiceExpired(item.created_at);
                      const displayStatus = isExpired ? 'expired' : item.status;
                      
                      return (
                      <tr key={idx} className="text-gray-300">
                        <td className="py-4 font-semibold text-white">{item.earning_month}</td>
                        <td className="py-4">{item.total_downloads}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            displayStatus === 'withdrawn' ? 'bg-green-500/10 text-green-400' :
                            displayStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                            displayStatus === 'expired' ? 'bg-red-500/10 text-red-400' :
                            displayStatus === 'rolled_over' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {displayStatus === 'expired' ? 'Expired (Will Rollover)' : displayStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold text-[#6C4FE0]">${item.total_revenue.toFixed(2)}</td>
                        <td className="py-4 text-right flex items-center justify-end gap-2">
                          {item.status === 'unpaid' && !isExpired && item.total_revenue >= 10 ? (
                            <button
                              onClick={() => handleWithdraw(item.invoice_id)}
                              disabled={withdrawing}
                              className="inline-flex items-center justify-center rounded-lg bg-[#6C4FE0] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5a40c0] disabled:opacity-50"
                            >
                              Withdraw
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleDownloadInvoice(item.earning_month)}
                            disabled={downloadingInvoice === item.earning_month}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                          >
                            {downloadingInvoice === item.earning_month ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payout History Table */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Payout History</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-gray-500">No payouts found</td>
                    </tr>
                  ) : (
                    payouts.map((payout, idx) => (
                      <tr key={idx} className="text-gray-300">
                        <td className="py-4">{new Date(payout.requested_at).toLocaleDateString()}</td>
                        <td className="py-4 capitalize">{payout.payment_method}</td>
                        <td className="py-4 font-semibold text-white">${parseFloat(payout.amount).toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${payout.status === 'completed' || payout.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                              payout.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                'bg-yellow-500/10 text-yellow-400'
                            }`}>
                            <Check size={12} />
                            <span>{payout.status}</span>
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

        {/* RIGHT COLUMN: PREFERENCES */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <h3 className="text-lg font-bold text-white">Withdrawal Preferences</h3>

          <div className="space-y-4">
            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-gray-400 uppercase">Select Payout Method *</label>

              {verifiedMethods.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedMethodId}
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                    className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#6C4FE0]"
                    required
                  >
                    {verifiedMethods.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#14141E]">
                        {m.payment_method.toUpperCase()} - {m.account_email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              ) : (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
                  You don't have any <b>Verified</b> payout methods. Please add a payout method in Settings and wait for Admin verification.
                </div>
              )}
            </div>

            <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 flex gap-3 text-xs text-blue-400 leading-relaxed">
              <AlertCircle size={28} className="flex-shrink-0" />
              <span>
                <strong>How to withdraw:</strong> Withdrawals are now processed on an invoice-by-invoice basis. 
                Simply click the <b>"Withdraw"</b> button next to any unpaid invoice in the Monthly Invoices table. 
                You can only withdraw invoices that exceed $10.
              </span>
            </div>
            
            {withdrawing && (
              <div className="flex items-center justify-center pt-2">
                <Loader2 className="animate-spin text-[#6C4FE0]" size={24} />
                <span className="ml-2 text-sm text-gray-400">Processing withdrawal...</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Earnings;
