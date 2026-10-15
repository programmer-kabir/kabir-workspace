import React from "react";

const colorMap = {
  "Total Users": "from-cyan-500 to-blue-500",
  Customers: "from-emerald-500 to-green-500",
  Investors: "from-yellow-500 to-orange-500",
  Staff: "from-pink-500 to-rose-500",
  Managers: "from-purple-500 to-indigo-500",
  Admins: "from-red-500 to-pink-500",
  Developers: "from-sky-500 to-cyan-500",
};

const StateCardCopy = ({ title, value }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#111A2E] p-4 shadow-lg hover:shadow-xl transition-all duration-300">

      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition"></div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-xs text-white/60">{title}</p>

        <h2 className="text-2xl font-bold mt-1 text-white">
          {value}
        </h2>
      </div>

      {/* ✅ Only ONE gradient line */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r ${
          colorMap[title] || "from-blue-500 to-indigo-500"
        }`}
      ></div>
    </div>
  );
};

export default StateCardCopy;