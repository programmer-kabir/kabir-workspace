import React from "react";

const CashStateCard = ({
  title,
  amount,
  icon,
  border,
  text,
  bg,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-3.5 md:p-4 backdrop-blur-xl shadow-lg cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] select-none`}
    >
      {/* Top light reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <p className={`text-[11px] font-semibold uppercase tracking-wider truncate ${text || "text-slate-400"}`}>
            {title}
          </p>

          <h2 className="font-mono text-base md:text-xl font-bold mt-1 text-white truncate group-hover:scale-[1.02] transition-transform origin-left">
            ৳ {Number(amount || 0).toLocaleString()}
          </h2>
        </div>

        <div
          className={`shrink-0 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-base md:text-lg shadow-inner group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default CashStateCard;