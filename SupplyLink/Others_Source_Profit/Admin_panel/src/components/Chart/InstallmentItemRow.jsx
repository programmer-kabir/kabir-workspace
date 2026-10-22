import React from "react";
import { addMonths } from "../../utils/date";
import { calculatePrincipalProfit } from "../../utils/finance";

export const InstallmentItemRow = ({
  index,
  item,
  card,
  bnNumbers,
  costPrice,
  salePrice,
  onAmountChange,
}) => {
  const { principal, profit } = calculatePrincipalProfit(
    item.amount,
    costPrice,
    salePrice,
  );

  return (
    <tr className="hover:bg-slate-800/20 transition-colors">
      {/* 1. Tag with subtle gray dot */}
      <td className="py-1 px-3">
        <div className="flex items-center gap-2.5 font-medium whitespace-nowrap">
          <span className="w-2 h-2 rounded-full shrink-0 bg-slate-500" />
          <span className="text-xs text-slate-300">
            {bnNumbers[index] || index + 1} কিস্তি
          </span>
        </div>
      </td>

      {/* 2. Amount Input */}
      <td className="py-1 px-2">
        <input
          type="number"
          value={item.amount}
          onChange={(e) => onAmountChange(index, e.target.value)}
          className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
        />
      </td>

      {/* 3. Principal */}
      <td className="py-1 px-2">
        <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-emerald-400 font-medium">
          {principal}
        </div>
      </td>

      {/* 4. Profit */}
      <td className="py-1 px-2">
        <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-amber-300 font-medium">
          {profit}
        </div>
      </td>

      {/* 5. Due Date */}
      <td className="py-1 px-2">
        <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-300">
          {addMonths(card?.first_installment_date, index)}
        </div>
      </td>

      {/* 6. Paid Date */}
      <td className="py-1 px-2">
        <div className="w-full rounded-full bg-[#0d1627] border border-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
          <span className="text-slate-500 text-xs">ⓘ</span> Not Paid
        </div>
      </td>

      {/* 7. Payment Method */}
      <td className="py-1 px-2">
        <div className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300 text-center font-medium">
          Cash
        </div>
      </td>

      {/* 8. Receipt */}
      <td className="py-1 px-2">
        <div className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs text-slate-500 text-center font-mono">
          Receipt #
        </div>
      </td>

      {/* 9. Status */}
      <td className="py-1 px-2">
        <div className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 text-slate-300 font-medium px-3 py-1.5 text-xs text-center">
          Unpaid
        </div>
      </td>

      {/* 10. Action */}
      <td className="py-1 px-2 text-center">
        <div className="w-8 h-8 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 flex items-center justify-center mx-auto text-xs opacity-60">
          +
        </div>
      </td>
    </tr>
  );
};
