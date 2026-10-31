import React, { useEffect, useState } from "react";
import { FiUsers, FiShoppingBag, FiTrendingUp, FiShield } from "react-icons/fi";

export default function LiveStats() {
  const [stats, setStats] = useState({
    totalUsers: 1020,
    customers: 712,
    investors: 423,
    deliveries: 1250,
  });


  const statItems = [
    {
      icon: <FiUsers className="h-6 w-6 text-indigo-600" />,
      value: stats.totalUsers,
      suffix: "+",
      label: "মোট নিবন্ধিত সদস্য",
      sub: "সুনামগঞ্জ ও আশপাশ অঞ্চল",
    },
    {
      icon: <FiShoppingBag className="h-6 w-6 text-emerald-600" />,
      value: stats.customers,
      suffix: "+",
      label: "সন্তুষ্ট কিস্তি গ্রাহক",
      sub: "স্মার্টফোন, গ্যাজেট ও বাইক",
    },
    {
      icon: <FiTrendingUp className="h-6 w-6 text-purple-600" />,
      value: stats.investors,
      suffix: "+",
      label: "সফল বিনিয়োগকারী",
      sub: "মাসিক নিয়মিত মুনাফা অর্জনকারী",
    },
    {
      icon: <FiShield className="h-6 w-6 text-amber-600" />,
      value: 100,
      suffix: "%",
      label: "বৈধ ও নিরাপদ লেনদেন",
      sub: "লিখিত চুক্তি ও নিশ্চয়তা",
    },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className=" mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 text-center flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mb-3">
                {item.icon}
              </div>

              <div className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {item.value}
                <span className="text-indigo-600">{item.suffix}</span>
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-2">
                {item.label}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
