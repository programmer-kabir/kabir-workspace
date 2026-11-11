import React from "react";

const PendingInvestWithdraw = ({
  investorWithdrawApplications,
}) => {
const pendingApplications = investorWithdrawApplications
  .filter(applications => applications.status === "pending")
  .sort((a, b) => new Date(a.withdraw_date) - new Date(b.withdraw_date));  const totalAmount = pendingApplications.reduce(
  (sum, r) => sum + Number(r.amount || 0),
  0
);
  return (
<div className="w-full py-5">
  <h2 className="text-lg font-semibold text-white mb-3">
    Pending Withdraw Applications ({pendingApplications.length})
  </h2>

  <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0B1220] shadow-lg">
    <table className="min-w-full text-sm">
      
      {/* HEADER */}
      <thead className="bg-white/5 text-white/70">
        <tr>
          <th className="px-4 py-3 text-left">#ID</th>
          <th className="px-4 py-3 text-left">Investor</th>
          <th className="px-4 py-3 text-left">Card</th>
          <th className="px-4 py-3 text-left">Amount</th>
          <th className="px-4 py-3 text-left">Mobile</th>
          <th className="px-4 py-3 text-left">Date</th>
          <th className="px-4 py-3 text-left">Requested By</th>
          <th className="px-4 py-3 text-left">Reason</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="divide-y divide-white/10">
        {pendingApplications.map((r,index) => (
          <tr
            key={r.id}
            className="hover:bg-white/5 transition"
          >
            <td className="px-4 py-3 text-white/80 font-medium">
              #{index +1}
            </td>

            <td className="px-4 py-3">
              <div className="flex flex-col">
                <span className="text-white/90">
                  {r.investor_name}
                </span>
                <span className="text-xs text-white/40">
                  ID: {r.investor_id}
                </span>
              </div>
            </td>

            <td className="px-4 py-3 text-white/80">
              #{r.card_id}
            </td>

            <td className="px-4 py-3 text-emerald-400 font-semibold">
              ৳ {Number(r.amount).toLocaleString()}
            </td>

            {/* 📞 clickable */}
            <td className="px-4 py-3">
              <a
                href={`tel:${r.mobile}`}
                className="text-sky-400 hover:underline"
              >
                {r.mobile}
              </a>
            </td>

            <td className="px-4 py-3 text-white/70">
              {r.withdraw_date}
            </td>

            <td className="px-4 py-3 text-white/70">
              {r.requested_by_name}
            </td>

            <td className="px-4 py-3 max-w-[220px]">
              <div className="truncate text-white/60">
                {r.reason}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-white/5 border-t border-white/10">
  <tr>
    <td colSpan="3" className="px-4 py-3 text-right text-white/70 font-medium">
      Total Amount:
    </td>

    <td className="px-4 py-3 text-emerald-400 font-bold">
      ৳ {totalAmount.toLocaleString()}
    </td>

    <td colSpan="4"></td>
  </tr>
</tfoot>
    </table>
  </div>
</div>
  );
};

export default PendingInvestWithdraw;
