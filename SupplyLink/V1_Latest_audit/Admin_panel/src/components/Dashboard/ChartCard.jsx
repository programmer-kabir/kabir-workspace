import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#060a14]/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="font-mono text-sm font-bold text-emerald-400">
          ৳ {Number(payload[0].value || 0).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const ChartCard = ({ title, data }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-white/15">
      {/* Top light reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>

      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10b981", strokeWidth: 1, stroke: "#060a14" }}
              activeDot={{ r: 5, fill: "#34d399", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;