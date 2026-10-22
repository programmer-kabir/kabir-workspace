import React from "react";

export const DownPaymentRow = ({ card, amount, calc, today }) => (
  <tr className="hover:bg-slate-800/20 transition-colors">
    {/* 1. Tag with glowing green dot */}
    <td className="py-1 px-3">
      <div className="flex items-center gap-2.5 font-medium whitespace-nowrap">
        <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span className="text-xs text-slate-100 font-semibold">
          ডাউন পেমেন্ট
        </span>
      </div>
    </td>

    {/* 2. Amount */}
    <td className="py-1 px-2">
      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-100 font-medium">
        {amount}
      </div>
    </td>

    {/* 3. Principal */}
    <td className="py-1 px-2">
      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-emerald-400 font-medium">
        {calc.principal}
      </div>
    </td>

    {/* 4. Profit */}
    <td className="py-1 px-2">
      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-amber-300 font-medium">
        {calc.profit}
      </div>
    </td>

    {/* 5. Due Date */}
    <td className="py-1 px-2">
      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-300">
        {card?.delivery_date || today}
      </div>
    </td>

    {/* 6. Paid Date */}
    <td className="py-1 px-2">
      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-200">
        {card?.delivery_date || today}
      </div>
    </td>

    {/* 7. Payment Method */}
    <td className="py-1 px-2">
      <div className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs text-slate-200 text-center font-medium">
        Cash
      </div>
    </td>

    {/* 8. Receipt */}
    <td className="py-1 px-2">
      <div className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs text-slate-500 text-center font-mono">
        —
      </div>
    </td>

    {/* 9. Status */}
    <td className="py-1 px-2">
      <div className="w-full rounded-full px-3 py-1.5 text-xs font-semibold text-center bg-[#06201b] border border-emerald-500/60 text-emerald-400">
        Paid
      </div>
    </td>

    {/* 10. Action */}
    <td className="py-1 px-2 text-center">
      <div className="w-8 h-8 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 flex items-center justify-center mx-auto text-xs opacity-60">
        ✓
      </div>
    </td>
  </tr>
);
