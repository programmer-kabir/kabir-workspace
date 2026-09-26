import { useState,useEffect } from "react";
import {
  CreditCard,
  FileText,
  Download,
  Check,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";

const STATUS_STYLES = {
  completed: "bg-green-500/10 text-green-400",
  pending:   "bg-amber-500/10 text-amber-400",
  failed:    "bg-red-500/10 text-red-400",
};

const STATUS_ICONS = {
  completed: <Check size={11} />,
  pending:   <Clock size={11} />,
  failed:    <AlertCircle size={11} />,
};

import useAuth from "../../../utlis/Hooks/useAuth";

const BillingInvoices = () => {
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [billingEmail, setBillingEmail]   = useState("");
  const [saving, setSaving]               = useState(false);
  const [filterYear, setFilterYear]       = useState("2026");

  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/get_author_earnings.php`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setEarningsData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [user]);

  const handleDownloadInvoice = async (month) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/earnings/generate_monthly_invoice_pdf.php?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to download invoice");
      
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
    }
  };

  const wallet = earningsData?.wallet || { balance: 0, total_earned: 0, total_withdrawn: 0 };
  const withdrawals = earningsData?.withdrawals || [];

  const filtered = withdrawals.filter((inv) => inv.requested_at.includes(filterYear));
  const totalPaid = wallet.total_withdrawn;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Billing & Invoices</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage your payment preferences and download your payout invoices
        </p>
      </div>

      {/* ── SUMMARY CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Paid Out</span>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-400"><DollarSign size={15} /></div>
          </div>
          <h3 className="text-2xl font-black text-white">${totalPaid.toFixed(2)}</h3>
          <p className="text-xs text-gray-500">Lifetime earnings received</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Balance</span>
            <div className="rounded-lg bg-[#6C4FE0]/10 p-2 text-[#6C4FE0]"><CreditCard size={15} /></div>
          </div>
          <h3 className="text-2xl font-black text-white">${wallet.balance.toFixed(2)}</h3>
          <p className="text-xs text-gray-500">Pending towards $10 threshold</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Payout</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><Calendar size={15} /></div>
          </div>
          <h3 className="text-2xl font-black text-white">Manual</h3>
          <p className="text-xs text-gray-500">If balance ≥ $10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── INVOICE TABLE ────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#6C4FE0]/10 p-2.5 text-[#6C4FE0]">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Payout Invoices</h3>
                <p className="text-xs text-gray-500">Download PDF receipts for each payout</p>
              </div>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="appearance-none cursor-pointer rounded-xl border border-white/10 bg-black/20 pl-3 pr-8 py-2 text-xs text-gray-300 outline-none"
              >
                <option className="bg-[#0F0F1A]" value="2026">2026</option>
                <option className="bg-[#0F0F1A]" value="2025">2025</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Invoice ID</th>
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filtered.length > 0 ? filtered.map((inv, idx) => {
                  const dateObj = new Date(inv.requested_at);
                  const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                  return (
                  <tr key={idx} className="text-gray-300">
                    <td className="py-4 font-semibold text-white">{inv.invoice_id || `INV-${dateObj.getFullYear()}-${idx.toString().padStart(3, '0')}`}</td>
                    <td className="py-4">{dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
                    <td className="py-4">{dateObj.toLocaleDateString()}</td>
                    <td className="py-4 capitalize">{inv.payment_method || '—'}</td>
                    <td className="py-4 font-bold text-white">${parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[inv.status] || STATUS_STYLES.pending}`}>
                        {STATUS_ICONS[inv.status] || STATUS_ICONS.pending}
                        <span className="capitalize">{inv.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(monthStr)}
                        disabled={inv.status !== "completed"}
                        title={inv.status === "completed" ? "Download Invoice PDF" : "Not available yet"}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          inv.status === "completed"
                            ? "bg-[#6C4FE0]/10 text-[#7b61ff] hover:bg-[#6C4FE0]/20"
                            : "bg-white/5 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        <Download size={12} />
                        PDF
                      </button>
                    </td>
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">
                      No invoices found for {filterYear}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notice */}
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 flex items-center gap-3 text-xs text-gray-500">
            <AlertCircle size={16} className="shrink-0 text-amber-400/60" />
            <span>Invoices are available for completed payouts. Payments require a minimum balance of $10.</span>
          </div>
        </div>

        {/* ── PAYMENT METHOD ───────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payment Method</h3>
              <p className="text-xs text-gray-500">Where we send your earnings</p>
            </div>
          </div>

          <a
            href="#"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ExternalLink size={12} />
            Manage your Payment Methods in the Verification tab.
          </a>
        </div>

      </div>
    </div>
  );
};

export default BillingInvoices;
