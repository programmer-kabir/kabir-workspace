import React from "react";
import { 
  Building2, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  CreditCard,
  Wifi,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

const PaymentMethodShow = ({ paymentMethods, setIsBankModalOpen, onEditClick }) => {
  const hasBank =
    paymentMethods?.bank &&
    (paymentMethods.bank.bank_name ||
      paymentMethods.bank.bank_account_number ||
      paymentMethods.bank.bank_account_name);

  const hasWallet =
    paymentMethods?.mobile_wallet &&
    (paymentMethods.mobile_wallet.bkash ||
      paymentMethods.mobile_wallet.nagad ||
      paymentMethods.mobile_wallet.rocket);

  const getReviewBadge = (review) => {
    switch (review) {
      case "approved":
        return {
          text: "ভেরিফাইড (Approved)",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          dot: "bg-emerald-500",
        };
      case "rejected":
        return {
          text: "প্রত্যাখ্যাত (Rejected)",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertCircle,
          dot: "bg-rose-500",
        };
      case "pending":
      default:
        return {
          text: "অনুমোদন অপেক্ষমান (Pending)",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: Clock,
          dot: "bg-amber-500 animate-pulse",
        };
    }
  };

  const reviewBadge = getReviewBadge(paymentMethods?.review);
  const StatusIcon = reviewBadge.icon;

  return (
    <div className="space-y-4">
      {/* 💳 1. ATM / Smart Card Style Display for Bank Transfer */}
      {hasBank ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg border border-slate-700/50">
          {/* Subtle card sheen decoration */}
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

          {/* Card Top: Bank & Wireless / Status */}
          <div className="flex items-start justify-between relative z-10 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Building2 className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-200/80 font-medium">
                  উত্তোলন ব্যাংক অ্যাকাউন্ট
                </p>
                <h4 className="text-base md:text-lg font-bold tracking-tight text-white">
                  {paymentMethods.bank.bank_name || "বাণিজ্যিক ব্যাংক"}
                </h4>
              </div>
            </div>

            {/* Verification Status Pill */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
              paymentMethods?.review === "approved" 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
                : paymentMethods?.review === "rejected"
                ? "bg-rose-500/20 text-rose-300 border-rose-400/30"
                : "bg-amber-500/20 text-amber-300 border-amber-400/30"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${reviewBadge.dot}`} />
              {paymentMethods?.review === "approved" ? "ভেরিফাইড" : (paymentMethods?.review === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমান")}
            </span>
          </div>

          {/* EMV Chip & Contactless Visuals */}
          <div className="flex items-center gap-3 relative z-10 mb-6">
            <div className="w-11 h-8 rounded-md bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 border border-amber-300/60 shadow-inner flex items-center justify-center">
              <div className="w-8 h-5 border border-amber-600/30 rounded-sm opacity-60" />
            </div>
            <Wifi className="w-5 h-5 text-white/50 rotate-90" />
          </div>

          {/* Card Number (Masked) */}
          <div className="relative z-10 mb-5">
            <p className="font-mono text-lg md:text-xl tracking-[0.2em] font-semibold text-slate-100 tabular-nums">
              •••• •••• •••• {paymentMethods.bank.bank_account_number ? String(paymentMethods.bank.bank_account_number).slice(-4) : "••••"}
            </p>
          </div>

          {/* Card Bottom: Holder Name, Branch & Action */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3 border-t border-white/10 relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                অ্যাকাউন্ট হোল্ডার
              </p>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">
                {paymentMethods.bank.bank_account_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                শাখা (Branch)
              </p>
              <p className="text-sm font-medium text-slate-200">
                {paymentMethods.bank.bank_branch || "প্রধান শাখা"}
              </p>
            </div>

            {paymentMethods?.bank?.bank_statement_image && (
              <button
                type="button"
                onClick={() => setIsBankModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/15 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                ডকুমেন্ট দেখুন
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 📱 2. Mobile Wallets (bKash, Nagad, Rocket) */}
      {hasWallet && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-slate-500" />
              সংযুক্ত মোবাইল ওয়ালেট
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ইনস্ট্যান্ট ক্যাশ আউট সাপোর্ট
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {paymentMethods.mobile_wallet.bkash && (
              <div className="bg-white border border-pink-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 font-bold text-xs flex items-center justify-center border border-pink-100">
                  bK
                </div>
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-medium">bKash নম্বর</p>
                  <p className="text-xs font-bold text-slate-800 font-mono">
                    {paymentMethods.mobile_wallet.bkash}
                  </p>
                </div>
              </div>
            )}

            {paymentMethods.mobile_wallet.nagad && (
              <div className="bg-white border border-orange-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 font-bold text-xs flex items-center justify-center border border-orange-100">
                  নগদ
                </div>
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-medium">Nagad নম্বর</p>
                  <p className="text-xs font-bold text-slate-800 font-mono">
                    {paymentMethods.mobile_wallet.nagad}
                  </p>
                </div>
              </div>
            )}

            {paymentMethods.mobile_wallet.rocket && (
              <div className="bg-white border border-purple-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center border border-purple-100">
                  রকেট
                </div>
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-medium">Rocket নম্বর</p>
                  <p className="text-xs font-bold text-slate-800 font-mono">
                    {paymentMethods.mobile_wallet.rocket}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💵 3. Hand Cash Fallback */}
      {!hasBank && !hasWallet && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">হাতেকলমে পেমেন্ট (Cash)</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            আপনার কোনো ব্যাংক অ্যাকাউন্ট বা ওয়ালেট সংযুক্ত নেই। অফিস থেকে সরাসরি ক্যাশে মুনাফা দেওয়া হবে।
          </p>
        </div>
      )}

      {/* ⚠️ 4. Rejection Alert (If Any) */}
      {paymentMethods?.review === "rejected" && paymentMethods?.remarks && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">বাতিল হওয়ার কারণ: </span>
            {paymentMethods.remarks}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodShow;
