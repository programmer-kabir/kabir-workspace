import React, { useMemo } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";

const getRole = (roles = []) => {
  if (!Array.isArray(roles)) return "User";
  if (roles.includes("manager")) return "Manager";
  if (roles.includes("staff")) return "Staff";
  if (roles.includes("developer")) return "Developer";
  return roles[0] || "User";
};

const badgeClass = (role) => {
  if (role === "Manager")
    return "bg-amber-500/15 text-amber-300 border-amber-400/20";
  if (role === "Staff")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
  if (role === "Developer")
    return "bg-indigo-500/15 text-indigo-300 border-indigo-400/20";
  return "bg-slate-500/15 text-slate-200 border-white/10";
};

// ✅ demo summary (later replace with real activity API)
const demoSummary = (userId) => {
  const seed = Number(userId || 1);
  const sales = seed % 7; // 0-6
  const inv = (seed * 3) % 12;
  const amount = (seed * 1270) % 90000;
  const profit = Math.round(amount * 0.12);
  const last = ["10 min ago", "1 hour ago", "Yesterday", "2 days ago"][
    seed % 4
  ];

  return {
    sales,
    investors: inv,
    amount,
    profit,
    last,
  };
};

const money = (n) => Number(n || 0).toLocaleString("en-US");

const StaffActivity = () => {
  const { users = [], isUsersLoading, isUsersError } = useUsers();

  const staffAndManagers = useMemo(() => {
    return users.filter(
      (u) =>
        Array.isArray(u?.roles) &&
        (u.roles.includes("staff") || u.roles.includes("manager"))
    );
  }, [users]);

  if (isUsersLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isUsersError) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200">
        Failed to load users
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">
            Staff & Manager Activity
          </h1>
          <p className="text-xs md:text-sm text-white/50">
            Demo overview (later activity API connect করলে real data দেখাবে)
          </p>
        </div>

        <div className="text-xs text-white/50">
          Total: <span className="text-white">{staffAndManagers.length}</span>
        </div>
      </div>

      {/* Cards */}
      {staffAndManagers.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
          No staff or manager found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {staffAndManagers.map((u) => {
            const role = getRole(u.roles);
            const s = demoSummary(u.id);

            const initials = (u?.name || "U")
              .trim()
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={u.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.03] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
              >
                {/* Top */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative">
                      {u?.photo_url ? (
                        <img
                          src={u.photo_url}
                          alt={u.name}
                          className="h-12 w-12 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                          {initials}
                        </div>
                      )}

                      {/* online dot (demo) */}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {u?.name || "-"}
                      </p>
                      <p className="text-xs text-white/50">
                        ID: <span className="text-white/70">{u.id}</span>
                        {"  "}•{"  "}
                        <span className="text-white/50">
                          {u?.mobile || "No mobile"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Badge */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${badgeClass(
                      role
                    )}`}
                  >
                    {role}
                  </span>
                </div>

                {/* Mini KPIs (demo) */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <KPI label="Sales" value={s.sales} />
                  <KPI label="Investors" value={s.investors} />
                  <KPI label="Amount" value={`৳${money(s.amount)}`} />
                  <KPI label="Profit" value={`৳${money(s.profit)}`} />
                </div>

                {/* Last activity line */}
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] text-white/50">Last activity</p>
                  <p className="text-sm text-white/80">
                    {s.last} <span className="text-white/40">— demo data</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition active:scale-[0.99]"
                    onClick={() => {
                      // later: navigate(`/developer/staff_activity/details?staffId=${u.id}`)
                    }}
                  >
                    View Activity
                  </button>

                  <button
                    className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition"
                    title="More"
                  >
                    ⋯
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const KPI = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
    <p className="text-[11px] text-white/50">{label}</p>
    <p className="text-base font-semibold text-white">{value}</p>
  </div>
);

export default StaffActivity;
