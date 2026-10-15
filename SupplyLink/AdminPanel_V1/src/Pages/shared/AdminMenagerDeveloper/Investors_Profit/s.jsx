import React, { useEffect, useMemo, useState } from "react";
import useProfitAnalytics from "../../../utils/Hooks/useProfitAnalytics";
import { MONTHS } from "../../../../public/month";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import useUsers from "../../../utils/Hooks/useUsers";
import { toast } from "react-toastify";

const money = (n) => `৳ ${Number(n || 0).toLocaleString()}`;

const getMonthLabel = (m) => {
  const mm = MONTHS.find((x) => Number(x.value) === Number(m));
  return mm?.label || `Month ${m}`;
};

const ProfitAnalytics = () => {
  const { users, isUsersLoading } = useUsers();
  const {
    isProfitAnalyticsLoading,
    profitAnalytics,
    isUProfitAnalyticsError,
    refetch,
  } = useProfitAnalytics();

  const { investmentCards, isInvestmentCardsError, isInvestmentCardsLoading } =
    useInvestmentCards();

  const rows = Array.isArray(profitAnalytics) ? profitAnalytics : [];
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  // ✅ Disable while transferring (prevent double click)
  const [transferringCardIds, setTransferringCardIds] = useState(new Set());

  // ✅ Build Monthly + Yearly summary from rows
  const { monthly, yearly, years, monthsByYear } = useMemo(() => {
    const monthlyMap = new Map();
    const yearlyMap = new Map();
    const yearsSet = new Set();
    const monthsByYearMap = new Map(); // year -> Set(month)

    for (const r of rows) {
      const y = Number(r.profit_year || 0);
      const m = Number(r.profit_month || 0);
      if (!y) continue;

      yearsSet.add(y);

      // months list per year
      if (!monthsByYearMap.has(y)) monthsByYearMap.set(y, new Set());
      if (m >= 1 && m <= 12) monthsByYearMap.get(y).add(m);

      const st = String(r.status || "pending");

      // ---------------- YEARLY accumulate ----------------
      if (!yearlyMap.has(y)) {
        yearlyMap.set(y, {
          profit_year: y,
          total_invest_amount: 0,
          total_profit_amount: 0,
          pending_count: 0,
          withdraw_count: 0,
          auto_reinvest_count: 0,
          user_reinvest_count: 0,
          monthsSet: new Set(),
        });
      }
      const yy = yearlyMap.get(y);

      yy.total_invest_amount += Number(r.amount || 0);
      yy.total_profit_amount += Number(r.profit_amount || 0);

      if (st === "pending") yy.pending_count += 1;
      else if (st === "withdraw") yy.withdraw_count += 1;
      else if (st === "auto_reinvest") yy.auto_reinvest_count += 1;
      else if (st === "user_reinvest") yy.user_reinvest_count += 1;

      if (m >= 1 && m <= 12) yy.monthsSet.add(m);

      // ---------------- MONTHLY accumulate ----------------
      if (m >= 1 && m <= 12) {
        const key = `${y}-${String(m).padStart(2, "0")}`;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            profit_year: y,
            profit_month: m,
            total_invest_amount: 0,
            total_profit_amount: 0,
            row_count: 0,
            pending_count: 0,
            withdraw_count: 0,
            auto_reinvest_count: 0,
            user_reinvest_count: 0,
          });
        }

        const mm = monthlyMap.get(key);
        mm.total_invest_amount += Number(r.amount || 0);
        mm.total_profit_amount += Number(r.profit_amount || 0);
        mm.row_count += 1;

        if (st === "pending") mm.pending_count += 1;
        else if (st === "withdraw") mm.withdraw_count += 1;
        else if (st === "auto_reinvest") mm.auto_reinvest_count += 1;
        else if (st === "user_reinvest") mm.user_reinvest_count += 1;
      }
    }

    // finalize yearly
    const yearlyArr = Array.from(yearlyMap.values()).map((x) => ({
      ...x,
      months_count: x.monthsSet.size,
    }));
    yearlyArr.sort((a, b) => b.profit_year - a.profit_year);

    // finalize monthly
    const monthlyArr = Array.from(monthlyMap.values());
    monthlyArr.sort((a, b) => {
      if (a.profit_year !== b.profit_year) return b.profit_year - a.profit_year;
      return b.profit_month - a.profit_month;
    });

    const yearsArr = Array.from(yearsSet).sort((a, b) => b - a);

    const monthsObj = {};
    for (const [yy, set] of monthsByYearMap.entries()) {
      monthsObj[yy] = Array.from(set).sort((a, b) => b - a);
    }

    return {
      monthly: monthlyArr,
      yearly: yearlyArr,
      years: yearsArr,
      monthsByYear: monthsObj,
    };
  }, [rows]);

  // ✅ Year change হলে month reset
  const onChangeYear = (val) => {
    setYearFilter(val);
    setMonthFilter("All");
  };

  // ✅ Available months (selected year অনুযায়ী)
  const availableMonths = useMemo(() => {
    if (yearFilter === "All") return MONTHS.map((m) => Number(m.value));
    return monthsByYear?.[Number(yearFilter)] || [];
  }, [yearFilter, monthsByYear]);

  // ✅ Individual rows filter
  const filteredRows = useMemo(() => {
    let data = rows;

    if (yearFilter !== "All") {
      data = data.filter((r) => String(r.profit_year) === String(yearFilter));
    }
    if (monthFilter !== "All") {
      data = data.filter((r) => String(r.profit_month) === String(monthFilter));
    }

    return data;
  }, [rows, yearFilter, monthFilter]);

  const cardById = useMemo(() => {
    const m = new Map();
    (investmentCards || []).forEach((c) => m.set(Number(c.id), c));
    return m;
  }, [investmentCards]);

  const isForfeitEligible = (card) => {
    if (!card) return false;
    if (String(card.status) !== "closed") return false;
    if (!card.end_date || card.end_date === "0000-00-00") return false;
    if (!card.maturity_date || card.maturity_date === "0000-00-00")
      return false;
    return String(card.end_date) < String(card.maturity_date);
  };

  // ✅ Transfer note modal state
  // ✅ Transfer note modal state
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteMeta, setNoteMeta] = useState({
    cardId: null,
    month: null,
    year: null,
  });

  const openTransferNoteModal = (r) => {
    setNoteMeta({
      cardId: Number(r.card_id),
      month: Number(r.profit_month),
      year: Number(r.profit_year),
    });
    setNoteText("");
    setOpenNoteModal(true);
  };

  const handleTransferToCompany = async (
    cardId,
    profit_month,
    profit_year,
    note = "",
  ) => {
    const id = Number(cardId);
    const card = cardById.get(id);
    if (!card) return toast.info("Card not found");

    setTransferringCardIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/profit_generator/transfer_closed_card_profit_to_company.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            card_id: id,
            investor_id: card.investor_id,
            end_date: card.end_date,
            profit_month,
            profit_year,
            note: String(note || "").trim(),
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      toast.success("Your Credit and Profit Amount Transferred");
      refetch();
    } finally {
      setTransferringCardIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleConfirmTransfer = async () => {
    const { cardId, month, year } = noteMeta;
    if (!cardId || !month || !year)
      return toast.error("Invalid Month/Year/Card");

    await handleTransferToCompany(cardId, month, year, noteText);

    setOpenNoteModal(false);
    setNoteMeta({ cardId: null, month: null, year: null });
    setNoteText("");
  };
  // ✅ Yearly summary filter
  const filteredYearly = useMemo(() => {
    if (yearFilter === "All") return yearly;
    return yearly.filter((r) => String(r.profit_year) === String(yearFilter));
  }, [yearly, yearFilter]);

  // ✅ Monthly summary filter (grouped)
  const filteredMonthly = useMemo(() => {
    let data = monthly;
    if (yearFilter !== "All") {
      data = data.filter((r) => String(r.profit_year) === String(yearFilter));
    }
    if (monthFilter !== "All") {
      data = data.filter((r) => String(r.profit_month) === String(monthFilter));
    }
    return data;
  }, [monthly, yearFilter, monthFilter]);

  const isYearSum = monthFilter === "YEAR_SUM";

  // ✅ Year Sum rows (group by card_id)  <-- Card base
  const yearSumRows = useMemo(() => {
    // Year must be specific (All হলে meaningful না)
    if (yearFilter === "All") return [];

    const y = Number(yearFilter);

    // ঐ বছরের সব data
    const data = rows.filter((r) => Number(r.profit_year) === y);

    // card_id -> aggregated row
    const map = new Map();

    for (const r of data) {
      const cardId = Number(r.card_id);
      if (!cardId) continue;

      if (!map.has(cardId)) {
        map.set(cardId, {
          card_id: cardId,
          investor_id: Number(r.investor_id) || null,
          total_amount: 0,
          total_profit: 0,
          total_weight: 0,
          rows_count: 0,
        });
      }

      const item = map.get(cardId);
      item.total_amount += Number(r.amount || 0);
      item.total_profit += Number(r.profit_amount || 0);
      item.total_weight += Number(r.weight_value || 0);
      item.rows_count += 1;

      // যদি investor_id না থাকে, পরে পাওয়া গেলে সেট করো
      if (!item.investor_id && r.investor_id)
        item.investor_id = Number(r.investor_id);
    }

    // sort: investor_id তারপর card_id
    return Array.from(map.values()).sort((a, b) => {
      const ai = Number(a.investor_id || 0);
      const bi = Number(b.investor_id || 0);
      if (ai !== bi) return ai - bi;
      return Number(a.card_id) - Number(b.card_id);
    });
  }, [rows, yearFilter]);

  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  const investorLabel = (investorId) => {
    const u = userById.get(Number(investorId));
    if (!u) return `ID: ${investorId}`;
    // তোমার users table এর field নাম অনুযায়ী বদলাবে (name/phone/user_name ইত্যাদি)
    const name = u.name || u.full_name || u.username || `User ${u.id}`;
    const phone = u.phone || u.mobile || "";
    return phone ? `${name} (${phone})` : name;
  };
  const showRowSelection = monthFilter !== "All" && monthFilter !== "YEAR_SUM";

  const [selectedIds, setSelectedIds] = useState(new Set());
  useEffect(() => {
    setSelectedIds(new Set());
  }, [yearFilter, monthFilter]);
  const toggleSelect = (rowId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const handleReinvest = async () => {
    if (selectedIds.size === 0) {
      return toast.info("No rows selected");
    }
    const selectedRows = filteredRows.filter((r) => selectedIds.has(r.id));

    try {
      toast.info("Bulk reinvest started...");
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/profit_generator/reinvest/Admin_auto_reinvest.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            rows: selectedRows.map((r) => ({
              id: r.id,
              card_id: r.card_id,
              investor_id: r.investor_id,
              profit_month: r.profit_month,
              profit_year: r.profit_year,
            })),
          }),
        },
      );

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success("Selected profits reinvested");
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      toast.error("Bulk reinvest failed");
    }
  };
  if (isProfitAnalyticsLoading)
    return <div className="p-6 text-white">Loading...</div>;

  if (isUProfitAnalyticsError)
    return (
      <div className="p-6 text-red-400">
        Failed to load Profit Analytics{" "}
        <button
          onClick={refetch}
          className="ml-2 rounded bg-slate-700 px-3 py-1 text-white hover:bg-slate-600"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6 text-white">
      {/* HEADER */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Profit Analytics</h2>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => onChangeYear(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white"
          >
            {" "}
            <option value="All">All Years</option>{" "}
            {years.map((y) => (
              <option key={y} value={y}>
                {" "}
                {y}{" "}
              </option>
            ))}{" "}
          </select>
          {/* MONTH */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white"
          >
            <option value="All">All Months</option>
            <option value="YEAR_SUM">Sum of Year</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>

          <button
            onClick={refetch}
            className="rounded bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500"
          >
            Refresh
          </button>
          <button
            onClick={handleReinvest}
            className="rounded bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
          >
            Reinvest Selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* ✅ YEARLY + MONTHLY SUMMARY (CARDS) */}
      <div
        className={`grid gap-4 ${
          monthFilter === "All" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        }`}
      >
        {/* YEARLY SUMMARY */}
        <div className="rounded-xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 p-4 text-slate-300">
            Yearly Summary
            <span className="ml-2 text-xs text-slate-400">
              Rows: {filteredYearly.length}
            </span>
          </div>

          <div className="p-4">
            {filteredYearly.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No yearly summary
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredYearly.map((y) => (
                  <div
                    key={y.profit_year}
                    className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 hover:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-lg font-semibold text-white">
                        {y.profit_year}
                      </div>

                      <div className="text-xs text-slate-400">
                        Months:{" "}
                        <span className="text-slate-200">
                          {y.months_count || 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Invest</div>
                        <div className="mt-1 font-semibold text-white">
                          {money(y.total_invest_amount)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Profit</div>
                        <div className="mt-1 font-semibold text-emerald-400">
                          {money(y.total_profit_amount)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Pending</div>
                        <div className="mt-1 font-semibold text-white">
                          {y.pending_count || 0}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Withdraw</div>
                        <div className="mt-1 font-semibold text-white">
                          {y.withdraw_count || 0}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">
                          Auto Reinvest
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {y.auto_reinvest_count || 0}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">
                          User Reinvest
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {y.user_reinvest_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MONTHLY SUMMARY */}
        <div className="rounded-xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 p-4 text-slate-300">
            Monthly Summary
            <span className="ml-2 text-xs text-slate-400">
              Rows: {filteredMonthly.length}
            </span>
          </div>

          <div className="p-4">
            {filteredMonthly.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No monthly summary
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  monthFilter === "All" ? "grid-cols-4" : "grid-cols-1"
                }`}
              >
                {filteredMonthly.map((m) => (
                  <div
                    key={`${m.profit_year}-${m.profit_month}`}
                    className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 hover:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-lg font-semibold text-white">
                        {getMonthLabel(m.profit_month)} {m.profit_year}
                      </div>

                      <div className="text-xs text-slate-400">
                        Rows:{" "}
                        <span className="text-slate-200">
                          {m.row_count || 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Invest</div>
                        <div className="mt-1 font-semibold text-white">
                          {money(m.total_invest_amount)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Profit</div>
                        <div className="mt-1 font-semibold text-emerald-400">
                          {money(m.total_profit_amount)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Pending</div>
                        <div className="mt-1 font-semibold text-white">
                          {m.pending_count || 0}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">Withdraw</div>
                        <div className="mt-1 font-semibold text-white">
                          {m.withdraw_count || 0}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">
                          Auto Reinvest
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {m.auto_reinvest_count || 0}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/40 p-3">
                        <div className="text-xs text-slate-400">
                          User Reinvest
                        </div>
                        <div className="mt-1 font-semibold text-white">
                          {m.user_reinvest_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILS TABLE */}
      <div className="mt-6 rounded-xl border border-white/10 bg-slate-900">
        <div className="border-b border-white/10 p-4 text-slate-300">
          Selected Month Details (All rows)
          <span className="ml-2 text-xs text-slate-400">
            Rows: {filteredRows.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-white">
            <thead className="bg-slate-800 text-sm text-slate-300">
              {isYearSum ? (
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Investor</th>
                  <th className="px-4 py-3 text-left">Card</th>
                  <th className="px-4 py-3 text-right">Year Invest</th>
                  <th className="px-4 py-3 text-right">Year Profit</th>
                  <th className="px-4 py-3 text-right">Year Weight</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-3 text-left">#</th>

                  <th className="px-4 py-3 text-left">Investor</th>
                  <th className="px-4 py-3 text-left">Card</th>
                  <th className="px-4 py-3 text-right">Percent</th>
                  <th className="px-4 py-3 text-right">Invest</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-right">Weight Value</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  {showRowSelection && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-800 
               text-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              new Set(filteredRows.map((r) => r.id)),
                            );
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </th>
                  )}
                </tr>
              )}
            </thead>

            <tbody>
              {isYearSum ? (
                yearFilter === "All" ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Please select a specific Year to see Year Sum.
                    </td>
                  </tr>
                ) : yearSumRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No data found for Year {yearFilter}
                    </td>
                  </tr>
                ) : (
                  yearSumRows.map((r, idx) => (
                    <tr
                      key={r.investor_id}
                      className="border-t border-white/5 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3">
                        {investorLabel(r.investor_id)}
                      </td>

                      <td className="px-4 py-3">{r.card_id ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {money(r.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        {money(r.total_profit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(r.total_weight || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No rows found for selected Year/Month
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const card = cardById.get(Number(r.card_id));
                  const eligible = isForfeitEligible(card);

                  const isAlreadyTransferred = String(r.status) === "forfeited";
                  const isTransferring = transferringCardIds.has(
                    Number(r.card_id),
                  );
                  const disabled = isAlreadyTransferred || isTransferring;

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-white/5 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">{idx + 1}</td>

                      <td className="px-4 py-3">{r.investor_id}</td>
                      <td className="px-4 py-3">{r.card_id}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(r.percent || 0).toFixed(4)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        {money(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        {money(r.profit_amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(r.weight_value || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{r.status}</td>
                      <td className="px-4 py-3">{r.created_at || "-"}</td>

                      <td className="px-4 py-3">
                        {eligible ? (
                          <button
                            disabled={disabled}
                            onClick={() => openTransferNoteModal(r)}
                            className={`rounded-lg px-3 py-1.5 text-xs text-white ${
                              disabled
                                ? "cursor-not-allowed bg-slate-600 opacity-60"
                                : "bg-red-600 hover:bg-red-500"
                            }`}
                          >
                            {isTransferring
                              ? "Transferring..."
                              : isAlreadyTransferred
                                ? "Transferred"
                                : "Transfer to Company"}
                          </button>
                        ) : null}
                      </td>
                      {showRowSelection && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-800 
               text-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {openNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white">
                Transfer Note
              </h3>

              <button
                onClick={() => {
                  setOpenNoteModal(false);
                  setNoteMeta({ cardId: null, month: null, year: null });
                  setNoteText("");
                }}
                className="rounded-lg px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="mb-2 text-sm text-slate-300">
                Card ID: <span className="text-white">{noteMeta.cardId}</span>
                <span className="ml-3 text-slate-400">
                  Month/Year: {noteMeta.month}/{noteMeta.year}
                </span>
              </div>

              <label className="mb-1 block text-sm text-slate-300">Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-indigo-500"
                placeholder="Write a note (optional)..."
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setOpenNoteModal(false);
                    setNoteMeta({ cardId: null, month: null, year: null });
                    setNoteText("");
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                >
                  Cancel
                </button>

                {(() => {
                  const id = Number(noteMeta.cardId);
                  const isTransferring = transferringCardIds.has(id);

                  return (
                    <button
                      disabled={isTransferring}
                      onClick={handleConfirmTransfer}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                        isTransferring
                          ? "cursor-not-allowed bg-slate-600 opacity-60"
                          : "bg-red-600 hover:bg-red-500"
                      }`}
                    >
                      {isTransferring ? "Transferring..." : "Save & Transfer"}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitAnalytics;
