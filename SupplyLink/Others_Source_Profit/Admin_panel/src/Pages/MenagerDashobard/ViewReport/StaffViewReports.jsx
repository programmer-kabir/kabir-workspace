import React, { useMemo, useState } from "react";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";

// ✅ MONTHS import করো (পথটা তোমার প্রজেক্ট অনুযায়ী ঠিক করো)
import { MONTHS } from "../../../../public/month";

const ALLOWED_ROLES = ["admin", "manager", "staff", "developer"];

const pickName = (u) =>
  u?.name ?? u?.full_name ?? u?.username ?? `User#${u?.id}`;

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (n) =>
  toNum(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const toYMD = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isOfficialStaff = (u) => {
  if (!u) return false;

  if (Array.isArray(u.roles)) {
    return u.roles.some((r) =>
      ALLOWED_ROLES.includes(String(r).toLowerCase().trim())
    );
  }

  const role =
    u?.role_name ?? u?.role ?? u?.user_role ?? u?.userType ?? u?.type ?? "";
  return ALLOWED_ROLES.includes(String(role).toLowerCase().trim());
};

// ✅ Filter matcher (by created_at)
const matchByMode = ({ mode, day, month, year }, rowDateValue) => {
  const ymd = toYMD(rowDateValue);
  if (!ymd) return false;

  if (mode === "all") return true;

  if (mode === "day") {
    return day ? ymd === day : true;
  }

  const [yy, mm] = ymd.split("-");

  if (mode === "month") {
    if (!year || !month) return true;
    return String(year) === yy && String(month).padStart(2, "0") === mm;
  }

  if (mode === "year") {
    if (!year) return true;
    return String(year) === yy;
  }

  return true;
};

const StaffViewReports = () => {
  const [searchParams] = useSearchParams();
  const staffIdRaw = searchParams.get("staffId");
  const staffId = Number(staffIdRaw);

  const { users = [], isUsersLoading, isUsersError } = useUsers();
  const {
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsLoading,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();

  const {
    investmentCards = [],
    isInvestmentCardsLoading,
    isInvestmentCardsError,
  } = useInvestmentCards();

  // ✅ Filters
  const today = toYMD(new Date());

  const NOW = new Date();
  const CURRENT_YEAR = NOW.getFullYear();
  const START_YEAR = 2025;

  // ✅ year dropdown list: 2025 ... currentYear
  const YEAR_OPTIONS = useMemo(() => {
    const arr = [];
    for (let y = START_YEAR; y <= CURRENT_YEAR; y++) arr.push(String(y));
    return arr;
  }, [CURRENT_YEAR]);

  const [mode, setMode] = useState("all"); // all | day | month | year
  const [day, setDay] = useState(today);

  // month state "01".."12"
  const [month, setMonth] = useState(
    String(NOW.getMonth() + 1).padStart(2, "0")
  );

  // year state string (dropdown value)
  const [year, setYear] = useState(String(CURRENT_YEAR));

  const filterState = useMemo(
    () => ({ mode, day, month, year }),
    [mode, day, month, year]
  );

  // ✅ loading / error first (hooks order ঠিক রাখা)
  const isLoading =
    isUsersLoading ||
    isCustomerInstallmentsCardsLoading ||
    isInvestmentCardsLoading;

  const isError =
    isUsersError || isCustomerInstallmentsCardsError || isInvestmentCardsError;
  const staff = useMemo(
    () => users?.find((u) => Number(u?.id) === staffId),
    [users, staffId]
  );

  // ✅ Filtered lists
  const filteredCustomerCards = useMemo(() => {
    return (customerInstallmentCards || []).filter((c) => {
      if (Number(c?.reference_user_id) !== staffId) return false;
      return matchByMode(
        filterState,
        c?.created_at ?? c?.delivery_date ?? c?.first_installment_date
      );
    });
  }, [customerInstallmentCards, staffId, filterState]);

  const filteredInvestorCards = useMemo(() => {
    return (investmentCards || []).filter((ic) => {
      if (Number(ic?.reference_user_id) !== staffId) return false;
      return matchByMode(filterState, ic?.created_at ?? ic?.start_date);
    });
  }, [investmentCards, staffId, filterState]);

  // ✅ Customer stats (unique customer count, sales count, profit sum)
  const customerStats = useMemo(() => {
    const customerSet = new Set();
    let profitSum = 0;

    filteredCustomerCards.forEach((c) => {
      const uid = Number(c?.user_id);
      if (uid) customerSet.add(uid);
      profitSum += toNum(c?.profit);
    });

    return {
      totalCustomers: String(customerSet.size),
      totalSalesCards: String(filteredCustomerCards.length),
      totalProfit: money(profitSum),
    };
  }, [filteredCustomerCards]);

  // ✅ Investor stats (unique investor count, total committed sum)
  const investorStats = useMemo(() => {
    const investorSet = new Set();
    let committed = 0;

    filteredInvestorCards.forEach((ic) => {
      const iid = Number(ic?.investor_id);
      if (iid) investorSet.add(iid);
      committed += toNum(ic?.investment_amount);
    });

    return {
      totalInvestors: String(investorSet.size),
      totalCommitted: money(committed),
      totalCards: String(filteredInvestorCards.length),
    };
  }, [filteredInvestorCards]);
  // invalid staffId
  if (!staffId || Number.isNaN(staffId)) {
    return <Navigate to="/*" replace />;
  }
  if (isLoading) {
    return (
      <div className="p-6 text-white">
        <Loader />
      </div>
    );
  }
  // ⚠️ staff validate AFTER loading end

  if (isError) {
    return (
      <div className="p-6">
        <NoDataFound />
      </div>
    );
  }
  const usersReady = Array.isArray(users) && users.length > 0;

if (!isLoading && usersReady) {
  if (!staff || !isOfficialStaff(staff)) {
    return <Navigate to="/*" replace />;
  }}

  // if (!isLoading) {
  //   if (!staff || !isOfficialStaff(staff)) {
  //     return <Navigate to="/error" replace />;
  //   }
  // }
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Staff Report: {pickName(staff)}
          </h2>
          <p className="text-sm text-white/60 mt-1">Staff ID: {staffId}</p>
        </div>

        <Link
          to="/manager_reports"
          className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white px-4 py-2 text-sm transition"
        >
          Back to Staff List
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-white/60">Filter Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mt-1 w-44 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All</option>
              <option value="day">Day</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          {mode === "day" && (
            <div>
              <label className="text-xs text-white/60">Date</label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1 w-44 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          )}

          {mode === "month" && (
            <>
              {/* ✅ Year dropdown (2025..currentYear) */}
              <div>
                <label className="text-xs text-white/60">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1 w-32 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
                >
                  {YEAR_OPTIONS?.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Month dropdown using MONTHS labels */}
              <div>
                <label className="text-xs text-white/60">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-1 w-40 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
                >
                  {MONTHS.map((m) => {
                    const mm = String(m.value).padStart(2, "0");
                    return (
                      <option key={mm} value={mm}>
                        {m.label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}

          {mode === "year" && (
            <div>
              <label className="text-xs text-white/60">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 w-32 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
              >
                {YEAR_OPTIONS?.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const curYear = String(now.getFullYear());
              const curMonth = String(now.getMonth() + 1).padStart(2, "0");

              setMode("all");
              setDay(today);
              setMonth(curMonth);
              setYear(curYear);
            }}
            className="ml-auto rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white px-4 py-2 text-sm transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-white/70 font-semibold">Customers</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Total Customers</p>
              <p className="text-white font-semibold mt-1">
                {customerStats?.totalCustomers}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Sales (Cards)</p>
              <p className="text-white font-semibold mt-1">
                {customerStats?.totalSalesCards}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Profit (Sum)</p>
              <p className="text-white font-semibold mt-1">
                {customerStats?.totalProfit}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-white/70 font-semibold">Investors</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Total Investors</p>
              <p className="text-white font-semibold mt-1">
                {investorStats?.totalInvestors}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Cards</p>
              <p className="text-white font-semibold mt-1">
                {investorStats?.totalCards}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Committed Amount</p>
              <p className="text-white font-semibold mt-1">
                {investorStats?.totalCommitted}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Cards Table */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Customer Cards</h3>
          <span className="text-sm text-slate-300">
            Total: {filteredCustomerCards?.length}
          </span>
        </div>

        {filteredCustomerCards.length === 0 ? (
          <div className="mt-4 text-slate-300">No customer cards found.</div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-300">
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-3">Card</th>
                  <th className="text-left py-2 pr-3">Customer ID</th>
                  <th className="text-left py-2 pr-3">Product</th>
                  <th className="text-left py-2 pr-3">Sale Price</th>
                  <th className="text-left py-2 pr-3">Profit</th>
                  <th className="text-left py-2 pr-3">Date</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {filteredCustomerCards.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{c?.card_number ?? c?.id}</td>
                    <td className="py-2 pr-3">{c?.user_id}</td>
                    <td className="py-2 pr-3">{c?.product_name}</td>
                    <td className="py-2 pr-3">{money(c?.sale_price)}</td>
                    <td className="py-2 pr-3">{money(c?.profit)}</td>
                    <td className="py-2 pr-3">{toYMD(c?.delivery_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investor Cards Table */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Investor Cards</h3>
          <span className="text-sm text-slate-300">
            Total: {filteredInvestorCards?.length}
          </span>
        </div>

        {filteredInvestorCards?.length === 0 ? (
          <div className="mt-4 text-slate-300">No investor cards found.</div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-300">
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-3">Card</th>
                  <th className="text-left py-2 pr-3">Investor ID</th>
                  <th className="text-left py-2 pr-3">Payment Type</th>
                  <th className="text-left py-2 pr-3">Committed</th>
                  <th className="text-left py-2 pr-3">Start</th>
                  <th className="text-left py-2 pr-3">Created</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {filteredInvestorCards.map((ic) => (
                  <tr key={ic.id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{ic?.card_name ?? ic?.id}</td>
                    <td className="py-2 pr-3">{ic?.investor_id}</td>
                    <td className="py-2 pr-3">{ic?.payment_type}</td>
                    <td className="py-2 pr-3">
                      {money(ic?.investment_amount)}
                    </td>
                    <td className="py-2 pr-3">{toYMD(ic?.start_date)}</td>
                    <td className="py-2 pr-3">{toYMD(ic?.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffViewReports;
