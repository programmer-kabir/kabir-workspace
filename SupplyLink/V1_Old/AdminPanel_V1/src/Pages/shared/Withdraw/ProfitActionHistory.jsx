import React, { useMemo, useState } from "react";
// import useProfitHistory from "../../../utils/Hooks/useProfitHistory";
import useUsers from "../../../utils/Hooks/useUsers";
import { MONTHS } from "../../../../public/month";
import useProfitHistory from "../../../utils/Investors/useProfitHistory";

const ProfitActionHistory = () => {

const {
    profitHistory,
    isProfitHistoryLoading,
    isProfitHistoryError,
    refetch, // ✅ must exist in hook (react-query হলে থাকেই)
  } = useProfitHistory({});

  const { users, isUsersLoading, isUsersError } = useUsers();

  // ================= YEAR RANGE =================
  const START_YEAR = 2025;
  const RUNNING_YEAR = new Date().getFullYear();
  const END_YEAR = Math.max(RUNNING_YEAR, START_YEAR);

  const years = useMemo(() => {
    const arr = [];
    for (let y = START_YEAR; y <= END_YEAR; y++) arr.push(y);
    return arr;
  }, [END_YEAR]);

  // ================= STATE =================
  const [filterType, setFilterType] = useState("monthly"); // all | daily | monthly | yearly
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [profitYear, setProfitYear] = useState("");

  const [openRemarksModal, setOpenRemarksModal] = useState(false);
  const [remarksText, setRemarksText] = useState("");

  const [actionFilter, setActionFilter] = useState("withdraw"); // all | withdraw | reinvest
  const [decisionFilter, setDecisionFilter] = useState("all"); // all | approved | rejected

  // ================= Users Map =================
  const userMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});
  }, [users]);

  // ================= helpers =================
  const toDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatYMD = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const dateOnly = (v) => {
    const d = toDate(v);
    return d ? formatYMD(d) : "-";
  };

  const monthLabel = (mNum) => {
    const found = MONTHS.find((m) => Number(m.value) === Number(mNum));
    return found?.label || (mNum ? `Month ${mNum}` : "-");
  };

  // ================= FILTERED DATA =================
  const filtered = useMemo(() => {
    if (!profitHistory) return [];

    return profitHistory.filter((row) => {
      const actionName = String(row.action_name || "").toLowerCase(); // approved/rejected
      const actionType = String(row.status || "").toLowerCase(); // withdraw/reinvest/...

      // ✅ Request Date: this is what you want to filter by
      const requestAtRaw = row.created_at; // prefer requested_at
      const requestAt = toDate(requestAtRaw);
      if (!requestAt) return false;
      // ✅ action type filter
      if (actionFilter !== "all" && actionType !== actionFilter) return false;

      // ✅ decision filter
      if (decisionFilter !== "all") {
        if (actionName !== decisionFilter) return false;
      } else {
        if (actionName !== "approved" && actionName !== "rejected")
          return false;
      }

      // ✅ Profit Year filter (DB field)
      if (profitYear && Number(row.profit_year) !== Number(profitYear)) {
        return false;
      }

      // ✅ View filters based on REQUEST DATE
      if (filterType === "daily") {
        if (!selectedDate) return true;
        return formatYMD(requestAt) === selectedDate;
      }

      if (filterType === "monthly") {
        if (!selectedMonth) return true;
        return requestAt.getMonth() + 1 === Number(selectedMonth);
      }

      if (filterType === "yearly") return true;

      return true; // all
    });
  }, [
    profitHistory,
    filterType,
    selectedDate,
    selectedMonth,
    profitYear,
    actionFilter,
    decisionFilter,
  ]);

  // ================= Loading / Error =================
  if (isProfitHistoryLoading || isUsersLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (isProfitHistoryError || isUsersError) {
    return <div className="p-4 text-red-500">Something went wrong</div>;
  }

  // ================= UI Classes =================
  const inputCls =
    "h-10 rounded border border-white/10 bg-[#071025] px-3 text-sm text-white " +
    "outline-none placeholder:text-white/40";

  const selectCls =
    inputCls + " pr-8 dark:[color-scheme:dark] [color-scheme:dark]";

  const REMARK_LIMIT = 20;
  const isLongText = (text = "") => text.length > REMARK_LIMIT;
  const shortText = (text = "") =>
    text.length > REMARK_LIMIT ? text.slice(0, REMARK_LIMIT) + "…" : text;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">
        Profit Action / Decision History
      </h2>

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-wrap items-end gap-3 rounded bg-[#1A253A] p-4">
        {/* Action Type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={selectCls}
          >
            <option value="withdraw">Withdraw</option>
            <option value="reinvest">Reinvest</option>
            <option value="all">All Actions</option>
          </select>
        </div>

        {/* Decision */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Decision</label>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">Approved + Rejected</option>
            <option value="approved">Approved Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
        </div>

        {/* View */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">View (Request Date)</label>
          <select
            value={filterType}
            onChange={(e) => {
              const v = e.target.value;
              setFilterType(v);
              setSelectedDate("");
              setSelectedMonth("");
            }}
            className={selectCls}
          >
            <option value="all">All</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Daily */}
        {filterType === "daily" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={inputCls + " dark:[color-scheme:dark]"}
            />
          </div>
        )}

        {/* Monthly */}
        {filterType === "monthly" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={selectCls}
            >
              <option value="">Select month</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Profit Year */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Profit Year</label>
          <select
            value={profitYear}
            onChange={(e) => setProfitYear(e.target.value)}
            className={selectCls}
          >
            <option value="">All</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setFilterType("monthly");
            setSelectedDate("");
            setSelectedMonth("");
            setProfitYear("");
            setActionFilter("withdraw");
            setDecisionFilter("all");
          }}
          className="h-10 rounded bg-[#071025] px-4 text-sm text-white/80 hover:bg-white/10"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* ================= EMPTY ================= */}
      {filtered.length === 0 && (
        <div className="text-gray-400 mt-2">No records found</div>
      )}

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto rounded border border-white/10">
        <table className="min-w-full text-white">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-3 py-5 text-left">ID</th>
              <th className="px-3 py-5 text-left">Investor</th>
              <th className="px-3 py-5 text-right">Amount</th>
              <th className="px-3 py-5 text-left">Action</th>
              <th className="px-3 py-5 text-left">Decision</th>
              <th className="px-3 py-5 text-left">Decision By</th>
              <th className="px-3 py-5 text-left">Profit Month</th>
              <th className="px-3 py-5 text-left">Profit Year</th>
              <th className="px-3 py-5 text-left">Card</th>
              <th className="px-3 py-5 text-left">Decision Date</th>
              <th className="px-3 py-5 text-left">Request Date</th>
              <th className="px-3 py-5 text-left">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((row) => {
              const decision = String(row.action_name || "").toLowerCase();
              const isApproved = decision === "approved";

              // ✅ Decision By (from DB)
              const actorId = row.decision_by;
              return (
                <tr
                  key={row.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="px-3 py-5">{row.id}</td>

                  <td className="px-3 py-5">
                    {userMap[row.investor_id]?.name} ({[row.investor_id]})
                  </td>

                  <td className="px-3 py-5 text-right">
                    {Number(row.amount || 0).toLocaleString("en-US")}
                  </td>

                  <td className="px-3 py-5">
                    <span className="rounded-full bg-sky-600/20 px-2 py-1 text-sky-300">
                      {String(row.status || "-")}
                    </span>
                  </td>

                  <td className="px-3 py-5">
                    {isApproved ? (
                      <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-emerald-300">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-600/20 px-2 py-1 text-rose-300">
                        Rejected
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-5">
                    {actorId ? (
                      <>{userMap[actorId]?.name || `#${actorId}`}</>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-3 py-5">
                    {row.profit_month ? monthLabel(row.profit_month) : "-"}
                  </td>

                  <td className="px-3 py-5">{row.profit_year || "-"}</td>

                  <td className="px-3 py-5">{row.card_id}</td>

                  {/* ✅ Decision Date: show ONLY date (no time) */}
                  <td className="px-3 py-5">{dateOnly(row.decision_at)}</td>

                  {/* ✅ Request Date: show ONLY date (no time) */}
                  <td className="px-3 py-5">{dateOnly(row.created_at)}</td>

                  <td className="px-3 py-5 max-w-[260px]">
                    {row.remarks ? (
                      isLongText(row.remarks) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRemarksText(row.remarks);
                            setOpenRemarksModal(true);
                          }}
                          className="block w-full text-left text-white/80 hover:text-white underline-offset-2 hover:underline"
                          title="Click to view full remarks"
                        >
                          {shortText(row.remarks)}
                        </button>
                      ) : (
                        <span className="text-white/80">{row.remarks}</span>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {openRemarksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Remarks</h3>
              <button
                onClick={() => setOpenRemarksModal(false)}
                className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-white/80 leading-relaxed">
              {remarksText}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setOpenRemarksModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitActionHistory;
