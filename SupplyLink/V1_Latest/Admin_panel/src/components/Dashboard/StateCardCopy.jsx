import React from "react";
import {
  Users,
  UserCheck,
  TrendingUp,
  Briefcase,
  Shield,
  Crown,
  Code,
} from "lucide-react";

const colorMap = {
  "Total Users": {
    gradient: "from-cyan-500 to-blue-500",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: Users,
  },
  Customers: {
    gradient: "from-emerald-500 to-green-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: UserCheck,
  },
  Investors: {
    gradient: "from-amber-500 to-orange-500",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: TrendingUp,
  },
  Staff: {
    gradient: "from-pink-500 to-rose-500",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: Briefcase,
  },
  Managers: {
    gradient: "from-purple-500 to-indigo-500",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: Shield,
  },
  Admins: {
    gradient: "from-red-500 to-rose-600",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: Crown,
  },
  Developers: {
    gradient: "from-sky-500 to-cyan-500",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon: Code,
  },
};

const StateCardCopy = ({ title, value }) => {
  const meta = colorMap[title] || {
    gradient: "from-indigo-500 to-purple-500",
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    icon: Users,
  };
  const IconComponent = meta.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1426]/70 p-3.5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-indigo-500/5 hover:-translate-y-0.5">
      {/* Top light reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} ${meta.text} border ${meta.border}`}>
          <IconComponent className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-1">
        <h2 className="font-mono text-xl font-bold tracking-tight text-white group-hover:scale-105 transition-transform origin-left">
          {Number(value || 0).toLocaleString()}
        </h2>
      </div>

      {/* Sleek bottom gradient accent line */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[2.5px] bg-gradient-to-r ${meta.gradient}`}
      ></div>
    </div>
  );
};

export default StateCardCopy;