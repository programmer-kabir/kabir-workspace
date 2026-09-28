// frontend/src/components/billing/InvoiceModal.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowUpRight, 
  ShieldCheck, 
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { UserPayment } from '@/types/icon';

interface InvoiceModalProps {
  payment: UserPayment;
  customerName: string;
  customerEmail: string;
  userId: number;
  onClose: () => void;
}

export default function InvoiceModal({
  payment,
  customerName,
  customerEmail,
  userId,
  onClose
}: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);

  const orderNum = payment.order_number || `#${payment.lemonsqueezy_order_id || payment.id}`;
  const isTeam = payment.plan_type === 'team' || (payment.team_seats && payment.team_seats > 1);
  const planTitle = isTeam 
    ? `IconBaba Team Plan — ${payment.team_seats || 8} Seats` 
    : 'IconBaba Solo Plan';

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(orderNum.replace(/^#/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Print-specific style tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl my-auto flex flex-col bg-[#141522] border border-white/10 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden">
        {/* Top Control Bar (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0e15]/80">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
              Official Tax Invoice
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-mono">{orderNum}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="size-3.5" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={handleCopyOrder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Copy Order ID"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Container */}
        <div id="printable-invoice" className="p-6 sm:p-10 bg-white text-slate-900 overflow-y-auto max-h-[80vh]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-9 rounded-xl bg-[#7c3aed] flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-500/20">
                  ib
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Icon<span className="text-[#7c3aed]">Baba</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">Premium Vector Icons & UI Assets</p>
              <p className="text-xs text-slate-500 mt-1">Website: https://iconbaba.com</p>
              <p className="text-xs text-slate-500">Email: support@iconbaba.com</p>
            </div>

            <div className="sm:text-right">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                INVOICE
              </h1>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>PAID</span>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div>Invoice / Order No: <strong className="text-slate-900 font-mono">{orderNum}</strong></div>
                <div>Issue Date: <strong>{formatDate(payment.created_at)}</strong></div>
                <div>Payment Method: <span className="capitalize">{payment.card_brand || 'Card'} {payment.card_last_four ? `•••• ${payment.card_last_four}` : ''}</span></div>
              </div>
            </div>
          </div>

          {/* Customer & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">
                Billed To (Customer)
              </span>
              <p className="font-bold text-sm text-slate-900">{customerName}</p>
              <p className="text-slate-600 mt-0.5">{customerEmail}</p>
              <p className="text-slate-500 mt-0.5">User ID: #{userId}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">
                Service Provider
              </span>
              <p className="font-bold text-sm text-slate-900">IconBaba Digital Ltd.</p>
              <p className="text-slate-600 mt-0.5">Global Digital Delivery</p>
              <p className="text-slate-500 mt-0.5">VAT / Tax Registered</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[11px] tracking-wider">
                  <th className="pb-3 w-1/2">Description</th>
                  <th className="pb-3 text-center">Period</th>
                  <th className="pb-3 text-center">Seats</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 pr-3">
                    <p className="font-bold text-sm text-slate-900">{planTitle}</p>
                    <p className="text-slate-500 mt-1">
                      Full commercial license, unlimited vector downloads, SVG source files, standard PNGs, and Figma assets.
                    </p>
                  </td>
                  <td className="py-4 text-center text-slate-600 whitespace-nowrap">
                    1 Year
                    {payment.renews_at && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Until {formatShortDate(payment.renews_at)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-center text-slate-900 font-semibold">
                    {isTeam ? `${payment.team_seats || 8} Users / Seats` : '1 User'}
                  </td>
                  <td className="py-4 text-right font-bold text-slate-900 text-sm whitespace-nowrap">
                    ${Number(payment.amount).toFixed(2)} {payment.currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">${Number(payment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax / VAT (0%):</span>
                <span className="font-medium text-slate-900">$0.00</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Paid:</span>
                <span>${Number(payment.amount).toFixed(2)} {payment.currency}</span>
              </div>
            </div>
          </div>

          {/* Guarantee & License badge */}
          <div className="mt-8 p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-purple-600 shrink-0" />
              <span>Commercial Use License • Verified Electronic Transaction</span>
            </div>
            <span className="font-mono text-[11px] text-purple-700">Ref: {payment.lemonsqueezy_order_id || payment.id}</span>
          </div>

          {/* Footer Notice */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
            <p>Thank you for choosing IconBaba! This electronic invoice is valid without physical signature.</p>
            <p>For questions or assistance regarding this order, please email support@iconbaba.com</p>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden in print) */}
        <div className="no-print p-4 sm:px-8 border-t border-white/10 bg-[#0d0e15] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Want to upgrade seats or change plan?</span>
            <Link
              to="/pricing"
              onClick={onClose}
              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 flex items-center gap-1"
            >
              <span>Upgrade Plan</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {payment.receipt_url && (
              <a
                href={payment.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white underline underline-offset-4 flex items-center gap-1"
              >
                <span>Gateway Receipt</span>
                <ExternalLink className="size-3" />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
