import React from "react";
import {
  TrendingUp,
  CreditCard,
  Wallet,
  CalendarCheck,
  Receipt,
  Clock,
  Coins,
  DollarSign,
} from "lucide-react";

const statMetaMap = {
  "Total Sales": {
    icon: TrendingUp,
    accent: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    bar: "from-sky-500 to-blue-600",
  },
  "Total Installments": {
    icon: CreditCard,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    bar: "from-emerald-500 to-teal-600",
  },
  "Total Investment": {
    icon: Wallet,
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    bar: "from-indigo-500 to-purple-600",
  },
  "Total Daily Installments": {
    icon: CalendarCheck,
    accent: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    bar: "from-teal-500 to-emerald-600",
  },
  "Total Company Expense": {
    icon: Receipt,
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    bar: "from-rose-500 to-red-600",
  },
  "Total Investment Payable": {
    icon: Clock,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    bar: "from-amber-500 to-orange-600",
  },
  "Total Profit Payable": {
    icon: Coins,
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    bar: "from-purple-500 to-indigo-600",
  },
};

const StatCard = ({ title, value = 0 }) => {
  const meta = statMetaMap[title] || {
    icon: DollarSign,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    bar: "from-emerald-500 to-teal-500",
  };
  const IconComponent = meta.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-4 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5">
      {/* Top light reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} ${meta.accent} border ${meta.border}`}>
          <IconComponent className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-3">
        <h2 className="font-mono text-lg font-bold tracking-tight text-white group-hover:scale-[1.02] transition-transform origin-left">
          ৳ {Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>
      </div>

      {/* Subtle bottom accent line */}
      <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r ${meta.bar} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
    </div>
  );
};

export default StatCard;