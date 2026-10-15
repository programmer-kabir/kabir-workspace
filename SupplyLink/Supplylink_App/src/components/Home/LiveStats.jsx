import React, { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

const Counter = ({ value, suffix }) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      onUpdate: (latest) => {
        setDisplay(latest.toFixed(0));
      },
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
};

const LiveStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    investors: 0,
  });

  useEffect(() => {
    fetch("https://app.supplylinkbd.com/apis/users/users.php")
      .then((res) => res.json())
      .then((data) => {
        const users = data?.data || [];

        const total = users.length;

        const customers = users.filter(
          (u) => u.roles && u.roles.includes("customer")
        ).length;

        const investors = users.filter(
          (u) => u.roles && u.roles.includes("investor")
        ).length;

        setStats({ total, customers, investors });
      })
      .catch((err) => console.log(err));
  }, []);

  const displayStats = [
    { number: stats.total, label: "মোট ব্যবহারকারী", icon: "👥" },
    { number: stats.customers, label: "মোট গ্রাহক", icon: "🛍️" },
    { number: stats.investors, label: "মোট বিনিয়োগকারী", icon: "📈" },
    { number: 99.9, suffix: "%", label: "সিস্টেম আপটাইম", icon: "⚡" },
  ];

  return (
    <section className="py-20 px-6 border-y border-gray-200 bg-white/50">
      <div className="max-width mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {displayStats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{s.icon}</div>

              <p className="text-3xl md:text-4xl font-extrabold gradient-text font-mono">
                <Counter
                  value={Number(s.number) || 0}
                  suffix={s.suffix || ""}
                />
              </p>

              <p className="text-sm text-gray-600 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStats;