import React from "react";
import { Clock, Phone, AlertCircle, CheckCircle2 } from "lucide-react";

const PendingInvestWithdraw = ({ investorWithdrawApplications }) => {
  const apps = Array.isArray(investorWithdrawApplications)
    ? investorWithdrawApplications
    : [];

  const pendingApplications = apps
    .filter((applications) => applications?.status === "pending")
    .sort((a, b) => new Date(a.withdraw_date) - new Date(b.withdraw_date));

  const totalAmount = pendingApplications.reduce(
    (sum, r) => sum + Number(r?.amount || 0),
    0
  );

  return (
    <div className="w-full my-6 rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-5 backdrop-blur-xl shadow-lg">
      {/* Section Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              উত্তোলন আবেদনসমূহ (Pending Withdraw Applications)
            </h2>
            <p className="text-xs text-slate-400">অনুমোদনের অপেক্ষায় থাকা ইনভেস্টরদের উইথড্র আবেদন</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            {pendingApplications.length} টি আবেদন
          </span>
          <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs font-bold text-emerald-400">
            মোট: ৳ {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#060a14]/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            {/* HEADER */}
            <thead className="border-b border-white/[0.08] bg-slate-900/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">#</th>
                <th className="px-4 py-3.5">ইনভেস্টর</th>
                <th className="px-4 py-3.5">কার্ড নং</th>
                <th className="px-4 py-3.5 text-right">আবেদনের পরিমাণ</th>
                <th className="px-4 py-3.5">মোবাইল</th>
                <th className="px-4 py-3.5">তারিখ</th>
                <th className="px-4 py-3.5">অনুরোধকারী</th>
                <th className="px-4 py-3.5">কারণ</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="divide-y divide-white/[0.06]">
              {pendingApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2 opacity-80" />
                      <p className="text-sm font-medium text-slate-300">কোনো পেন্ডিং উইথড্র আবেদন নেই</p>
                      <p className="text-xs text-slate-500">সবগুলো আবেদন সম্পন্ন করা হয়েছে</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingApplications.map((r, index) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                      #{index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {r.investor_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {r.investor_id}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-indigo-300">
                        #{r.card_id}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        ৳ {Number(r.amount || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* 📞 clickable phone */}
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${r.mobile}`}
                        className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{r.mobile}</span>
                      </a>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {r.withdraw_date}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-300 font-medium">
                      {r.requested_by_name}
                    </td>

                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="truncate text-xs text-slate-400" title={r.reason}>
                        {r.reason || "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* FOOTER */}
            {pendingApplications.length > 0 && (
              <tfoot className="border-t border-white/[0.08] bg-slate-900/60 font-semibold text-white">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-xs text-slate-400">
                    মোট পেন্ডিং পরিমাণ:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-400">
                    ৳ {totalAmount.toLocaleString()}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default PendingInvestWithdraw;
