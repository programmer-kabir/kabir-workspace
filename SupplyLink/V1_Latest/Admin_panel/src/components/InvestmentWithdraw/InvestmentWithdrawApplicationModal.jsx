import React from "react";
import {
  X,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const money = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const Field = ({ label, value, highlight = false, isStatus = false }) => (
  <div className="rounded-xl border border-white/5 bg-slate-900/60 p-2.5 sm:p-3">
    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-[11px]">
      {label}
    </div>
    <div
      className={`mt-0.5 truncate text-xs font-semibold sm:mt-1 sm:text-sm ${
        highlight
          ? "text-sm font-bold text-emerald-400 sm:text-base"
          : isStatus
            ? value?.toLowerCase() === "active"
              ? "text-emerald-400"
              : "text-rose-400"
            : "text-slate-100"
      }`}
    >
      {value ?? "—"}
    </div>
  </div>
);

export const InvestmentWithdrawApplicationModal = ({
  open,
  onClose,
  investorId,
  investor,
  cardId,
  card,
  withdrawDate,
  sumOfCardProfit,
  payableAmount,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2.5 backdrop-blur-md transition-all sm:p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0b1329] via-slate-950 to-slate-950 shadow-2xl sm:rounded-3xl">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl sm:h-56 sm:w-56" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl sm:h-56 sm:w-56" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 px-4 py-3.5 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/20 sm:h-10 sm:w-10">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="truncate text-sm font-bold text-white sm:text-lg">
                  Withdraw Application Preview
                </h3>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 sm:px-2.5 sm:text-[11px]">
                  Verification
                </span>
              </div>
              <p className="text-[11px] text-slate-400 sm:text-xs">
                Please verify all investor and card parameters before final submission
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="relative max-h-[75vh] space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6">
          {/* Quick Meta Stats */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 sm:rounded-2xl sm:p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                <User className="h-3 w-3 text-cyan-400 sm:h-3.5 sm:w-3.5" />
                Investor ID
              </div>
              <div className="mt-0.5 text-sm font-bold text-white sm:mt-1 sm:text-base">
                #{investorId || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 sm:rounded-2xl sm:p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                <CreditCard className="h-3 w-3 text-blue-400 sm:h-3.5 sm:w-3.5" />
                Card ID
              </div>
              <div className="mt-0.5 text-sm font-bold text-white sm:mt-1 sm:text-base">
                #{cardId || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 sm:rounded-2xl sm:p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                <Calendar className="h-3 w-3 text-amber-400 sm:h-3.5 sm:w-3.5" />
                Effective Date
              </div>
              <div className="mt-0.5 text-xs font-bold text-amber-300 sm:mt-1 sm:text-sm">
                {withdrawDate || "—"}
              </div>
            </div>
          </div>

          {/* Investor & Card Panels */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {/* Investor Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 sm:rounded-2xl sm:p-4">
              <div className="mb-2.5 flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
                <User className="h-3.5 w-3.5 text-cyan-400 sm:h-4 sm:w-4" />
                Investor Information
              </div>
              <div className="grid gap-2">
                <Field
                  label="Full Name"
                  value={investor?.name || "Demo Investor Name"}
                />
                <Field
                  label="Phone Number"
                  value={investor?.mobile || "01XXXXXXXXX"}
                />
                <Field label="Address" value={investor?.address || "—"} />
                <Field
                  label="System ID"
                  value={`#${investor?.id || investorId || "—"}`}
                />
              </div>
            </div>

            {/* Card Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 sm:rounded-2xl sm:p-4">
              <div className="mb-2.5 flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
                <CreditCard className="h-3.5 w-3.5 text-blue-400 sm:h-4 sm:w-4" />
                Card Details
              </div>
              <div className="grid gap-2">
                <Field
                  label="Card Name"
                  value={card?.card_name || "Demo Card Name"}
                />
                <Field
                  label="Investment Amount"
                  value={`৳ ${money(card?.investment_amount ?? 100000)}`}
                  highlight
                />
                <Field
                  label="Card Status"
                  value={(card?.status || "active").toUpperCase()}
                  isStatus
                />
                <Field
                  label="Maturity Date"
                  value={card?.maturity_date || "2026-12-31"}
                />
              </div>
            </div>
          </div>

          {/* Profit & Calculation Summary */}
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900/70 to-blue-950/30 p-4 shadow-lg sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-white sm:text-sm">
              <Coins className="h-3.5 w-3.5 text-cyan-400 sm:h-4 sm:w-4" />
              Financial Calculation Breakdown
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-slate-950/50 px-3.5 py-2 sm:px-4 sm:py-2.5">
                <span className="text-xs font-medium text-slate-400 sm:text-sm">
                  Total Accrued Profit
                </span>
                <span className="text-sm font-bold text-white sm:text-base">
                  ৳ {money(sumOfCardProfit)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl border border-white/5 bg-slate-950/70 px-3.5 py-2.5 sm:px-4 sm:py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200 sm:text-sm">
                    Payable Profit Amount
                  </span>
                  {card?.payment_type === "flexible" && (
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 sm:text-[10px]">
                      Flexible
                    </span>
                  )}
                </div>

                <span
                  className={`text-base font-extrabold sm:text-lg ${
                    payableAmount === 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  ৳ {money(payableAmount)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-200 sm:mt-3.5 sm:p-3">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400 sm:h-4 sm:w-4" />
              <span>
                <strong>Policy Reminder:</strong> If withdrawal occurs prior to
                the eligibility/maturity date, payable profit may be reduced to
                ৳ 0 as per agreement rules.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800/80 bg-slate-900/40 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-slate-700 sm:w-auto sm:px-6"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Confirm & Close Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
