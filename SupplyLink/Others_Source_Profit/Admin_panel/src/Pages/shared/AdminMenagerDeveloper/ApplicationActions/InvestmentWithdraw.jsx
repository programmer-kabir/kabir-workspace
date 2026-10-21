import React, { useMemo, useState } from "react";
import useInvestorWithdrawApplications from "../../../../utils/Investors/useInvestorWithdrawApplications";
import { MONTHS } from "../../../../../public/month"; // তোমার path ঠিক থাকলে ok
import {
  IoCloseCircleOutline,
  IoCashOutline,
  IoPrintOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAuth } from "../../../../Provider/AuthProvider";
import {
  createWithdrawActions,
  handlePrint,
} from "../../../../components/InvestmentWithdraw/InvestWithdrawActions";

/* ---------- helpers ---------- */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatBDT = (n) =>
  toNum(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ymd = (d) => {
  if (!d) return "";
  // supports "YYYY-MM-DD" or datetime
  if (String(d).length >= 10) return String(d).slice(0, 10);
  return "";
};

const getYM = (dateStr) => {
  // returns {y,m} from "YYYY-MM-DD"
  const s = ymd(dateStr);
  if (!s) return { y: "", m: "" };
  return { y: s.slice(0, 4), m: String(Number(s.slice(5, 7))) };
};

const InvestmentWithdraw = () => {
  const {
    investorWithdrawApplications = [],
    isLoading,
    isError,
    refetch,
  } = useInvestorWithdrawApplications();
  const { user } = useAuth();
  // ====== BD today ======
  const todayBD = useMemo(() => {
    const d = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    return d.toISOString().slice(0, 10);
  }, []);
  // ====== year list ======
  const START_YEAR = 2025;
  const CURRENT_YEAR = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = START_YEAR; y <= CURRENT_YEAR; y++) arr.push(y);
    return arr;
  }, [CURRENT_YEAR]);

  // ====== filters ======
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [filterType, setFilterType] = useState("all"); // all | daily | monthly | yearly
  const [selectedDate, setSelectedDate] = useState(todayBD);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [search, setSearch] = useState("");

  // ====== UI classes ======
  const selectCls =
    "h-10 rounded bg-[#071025] px-3 text-sm text-white/90 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-sky-500/40";
  const inputCls =
    "h-10 rounded bg-[#071025] px-3 text-sm text-white/90 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-sky-500/40";
  const thCls = "px-3 py-3 text-left text-xs font-semibold text-white/60";
  const tdCls = "px-3 py-3 text-sm text-white/80";
  const badge = (v) => {
    const s = String(v || "").toLowerCase();
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ring-white/10";
    if (s === "approved")
      return (
        <span className={`${base} bg-emerald-500/10 text-emerald-300`}>
          Approved
        </span>
      );
    if (s === "rejected")
      return (
        <span className={`${base} bg-rose-500/10 text-rose-300`}>Rejected</span>
      );
    if (s === "paid")
      return <span className={`${base} bg-sky-500/10 text-sky-300`}>Paid</span>;
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-300`}>
        Pending
      </span>
    );
  };

  const filtered = useMemo(() => {
    const list = Array.isArray(investorWithdrawApplications)
      ? investorWithdrawApplications
      : [];

    return list
      .filter((r) => {
        // decision/status
        if (decisionFilter !== "all") {
          if (String(r?.status || "").toLowerCase() !== decisionFilter)
            return false;
        }

        // date filters -> requested_at
        const reqDate = ymd(r?.requested_at || r?.created_at);
        if (filterType === "daily") {
          if (reqDate !== selectedDate) return false;
        }
        if (filterType === "monthly") {
          if (!selectedMonth) return true; // month not selected -> allow
          const { m } = getYM(reqDate);
          if (String(m) !== String(selectedMonth)) return false;
        }
        if (filterType === "yearly") {
          if (!selectedYear) return true; // All years
          const { y } = getYM(reqDate);
          if (String(y) !== String(selectedYear)) return false;
        }

        // search
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const hay = [
            r?.id,
            r?.investor_name,
            r?.card_name,
            r?.status,
            r?.reason,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
  }, [
    investorWithdrawApplications,
    decisionFilter,
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
    search,
  ]);

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalText, setReasonModalText] = useState("");
  const [reasonModalTitle, setReasonModalTitle] = useState("");

  const openReasonModal = (row) => {
    setReasonModalTitle(`Note (Request #${row?.id || ""})`);
    setReasonModalText(row?.reason || "-");
    setReasonModalOpen(true);
  };

  const closeReasonModal = () => {
    setReasonModalOpen(false);
    setReasonModalText("");
    setReasonModalTitle("");
  };
  // const updateWithdraw = async (payload) => {
  //   const res = await fetch(
  //     `${import.meta.env.VITE_LOCALHOST_KEY}/withdraw_applications/update_withdraw_request.php`,
  //     {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include",
  //       body: JSON.stringify(payload),
  //     },
  //   );
  //   const data = await res.json();
  //   if (!data?.success) {
  //     throw new Error(data?.message || "Update failed");
  //   }
  //   return data;
  // };

  // const handleReject = async (row) => {
  //   if (!row?.id) return;

  //   const { value: note, isConfirmed } = await Swal.fire({
  //     title: `Reject request #${row.id}?`,
  //     input: "textarea",
  //     inputLabel: "Reject reason (required)",
  //     inputPlaceholder: "Type reject reason...",
  //     inputAttributes: { "aria-label": "Reject reason" },
  //     showCancelButton: true,
  //     confirmButtonText: "Reject",
  //     cancelButtonText: "Cancel",
  //     confirmButtonColor: "#ef4444",
  //     preConfirm: (v) => {
  //       const t = String(v || "").trim();
  //       if (!t) {
  //         Swal.showValidationMessage("Reject reason is required");
  //         return false;
  //       }
  //       return t;
  //     },
  //   });

  //   if (!isConfirmed) return;

  //   try {
  //     await updateWithdraw({
  //       request_id: row.id,
  //       action: "rejected",
  //       reject_reason: note,
  //       reviewed_by: user?.id,
  //     });
  //     refetch();
  //     toast.success(`Request #${row.id} rejected`);
  //   } catch (e) {
  //     toast.error(e.message);
  //   }
  // };

  // const handlePaid = async (row) => {
  //   if (!row?.id) return;

  //   const { value: pm, isConfirmed } = await Swal.fire({
  //     title: `Mark as paid #${row.id}?`,
  //     input: "text",
  //     inputLabel: "Payment method (optional)",
  //     inputPlaceholder: "Cash / bKash / Nagad / Bank ...",
  //     showCancelButton: true,
  //     confirmButtonText: "Mark Paid",
  //     cancelButtonText: "Cancel",
  //     confirmButtonColor: "#22c55e",
  //     preConfirm: (v) => String(v || "").trim(), // optional
  //   });

  //   if (!isConfirmed) return;

  //   try {
  //     await updateWithdraw({
  //       request_id: row.id,
  //       action: "paid",
  //       payment_method: pm || "Cash",
  //       reviewed_by: user?.id,
  //     });
  //     toast.success(`Request #${row.id} marked as paid`);
  //     refetch?.();
  //   } catch (e) {
  //     toast.error(e.message);
  //   }
  // };

  const { handleReject, handlePaid } = useMemo(
    () =>
      createWithdrawActions({
        user,
        refetch,
        baseUrl: import.meta.env.VITE_LOCALHOST_KEY,
      }),
    [user?.id, refetch],
  );
  const totalCols = 12;
  return (
    <div className="w-full p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Investment Withdraw Requests
          </h2>
          <p className="text-xs text-white/50">
            Total: <span className="text-white/80">{filtered.length}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: investor / card / id..."
            className={inputCls + " w-64"}
          />
        </div>
      </div>

      {/* ===== FILTER BAR (তোমার দেওয়া ডিজাইন) ===== */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded bg-[#1A253A] p-4">
        {/* Decision (Status) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Decision</label>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">All</option>
            <option value="pending">Pending Only</option>
            <option value="paid">Paid Only</option>
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
              if (v !== "daily") setSelectedDate(todayBD);
              if (v !== "monthly") setSelectedMonth("");
              if (v !== "yearly")
                setSelectedYear(String(new Date().getFullYear()));
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
              {MONTHS.map((m, idx) => {
                const value = m?.value ?? String(idx + 1);
                const label = m?.label ?? m;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Yearly */}
        {filterType === "yearly" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
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
        )}

        {/* Reset */}
        <button
          onClick={() => {
            setFilterType("all");
            setSelectedDate(todayBD);
            setSelectedMonth("");
            setSelectedYear(String(new Date().getFullYear()));

            setDecisionFilter("all");
            setSearch("");
          }}
          className="h-10 rounded bg-[#071025] px-4 text-sm text-white/80 hover:bg-white/10"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* ===== TABLE ===== */}
      <div className="overflow-hidden rounded border border-white/10 bg-[#0B1220]">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-white/5">
              <tr>
                <th className={thCls}>#ID</th>
                <th className={thCls}>Investor</th>
                <th className={thCls}>Card</th>
                <th className={thCls}>Amount</th>
                <th className={thCls}>Number</th>
                <th className={thCls}>Withdraw Date</th>
                <th className={thCls}>Requested At</th>
                <th className={thCls}>Total Profit</th>
                <th className={thCls}>Payable</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Requested By</th>
                <th className={thCls}>Reviewed By</th>
                <th className={thCls}>Notes</th>
                {decisionFilter === "paid" ? (
                  <th className={thCls}>Payment Method</th>
                ) : decisionFilter === "rejected" ? (
                  <th className={thCls}>Reject Note</th>
                ) : (
                  <th className={thCls}>Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td className={tdCls} colSpan={totalCols}>
                    Loading...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td className={tdCls} colSpan={11}>
                    Failed to load
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className={tdCls} colSpan={11}>
                    No requests found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className={tdCls}>#{r.id}</td>

                    <td className={tdCls}>
                      <div className="flex flex-col">
                        <span className="text-white/90">
                          {r.investor_name || `#${r.investor_id}`}
                        </span>
                        <span className="text-xs text-white/40">
                          investor_id: {r.investor_id}
                        </span>
                      </div>
                    </td>

                    <td className={tdCls}>
                      <div className="flex flex-col">
                        <span className="text-white/90">
                          {r.card_name || `Card #${r.card_id}`}
                        </span>
                        <span className="text-xs text-white/40">
                          card_id: {r.card_id}
                        </span>
                      </div>
                    </td>

                    <td className={tdCls}>{formatBDT(r.amount) || "-"}</td>
      <td className={tdCls}>
  {r.mobile ? (
    <a
      href={`tel:${r.mobile}`}
      className="text-sky-400 hover:underline"
    >
      {r.mobile}
    </a>
  ) : (
    "-"
  )}
</td>
                    <td className={tdCls}>{ymd(r.withdraw_date) || "-"}</td>
                    <td className={tdCls}>
                      {ymd(r.requested_at || r.created_at) || "-"}
                    </td>

                    <td className={tdCls}>{formatBDT(r.total_profit)}</td>
                    <td className={tdCls}>{formatBDT(r.payable_amount)}</td>

                    <td className={tdCls}>{badge(r.status)}</td>

                    <td className={tdCls}>
                      {r.requested_by_name || `#${r.requested_by}`}
                    </td>
                    <td className={tdCls}>
                      {r.reviewed_by_name ||
                        (r.reviewed_by ? `#${r.reviewed_by}` : "-")}
                    </td>

                    <td className={tdCls}>
                      <button
                        type="button"
                        onClick={() => openReasonModal(r)}
                        className="w-full text-left"
                        title="Click to view full note"
                      >
                        <div className="max-w-[120px] truncate text-white/70 hover:text-white/90">
                          {r.reason || "-"}
                        </div>
                      </button>
                    </td>

                    {decisionFilter === "paid" ? (
                      <td className={tdCls}>
                        <button
                          type="button"
                          onClick={() => {
                            setReasonModalTitle(
                              `Payment Method (Request #${r?.id || ""})`,
                            );
                            setReasonModalText(r?.payment_method || "-");
                            setReasonModalOpen(true);
                          }}
                          className="w-full text-left"
                          title="Click to view full payment method"
                        >
                          <div className="max-w-[220px] truncate text-white/70 hover:text-white/90">
                            {r?.payment_method || "-"}
                          </div>
                        </button>
                      </td>
                    ) : decisionFilter === "rejected" ? (
                      <td className={tdCls}>
                        <button
                          type="button"
                          onClick={() => {
                            setReasonModalTitle(
                              `Reject Note (Request #${r?.id || ""})`,
                            );
                            setReasonModalText(r?.reject_reason || "-");
                            setReasonModalOpen(true);
                          }}
                          className="w-full text-left"
                          title="Click to view full reject note"
                        >
                          <div className="max-w-[220px] truncate text-white/70 hover:text-white/90">
                            {r?.reject_reason || "-"}
                          </div>
                        </button>
                      </td>
                    ) : (
                      <td className={tdCls}>
                        <div className="flex gap-2">
                          {/* Reject */}
                          <button
                            disabled={
                              String(r.status).toLowerCase() !== "pending"
                            }
                            onClick={() => handleReject(r)}
                            className={`rounded p-2 text-lg transition ${
                              String(r.status).toLowerCase() === "pending"
                                ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                : "cursor-not-allowed bg-white/5 text-white/20"
                            }`}
                            title="Reject"
                          >
                            <IoCloseCircleOutline />
                          </button>

                          {/* Paid */}
                          <button
                            disabled={
                              String(r.status).toLowerCase() !== "pending"
                            }
                            onClick={() => handlePaid(r)}
                            className={`rounded p-2 text-lg transition ${
                              String(r.status).toLowerCase() === "pending"
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "cursor-not-allowed bg-white/5 text-white/20"
                            }`}
                            title="Mark as Paid"
                          >
                            <IoCashOutline />
                          </button>
                          <button
                            onClick={() => handlePrint(r)}
                            className="rounded p-2 text-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition"
                            title="Print"
                          >
                            <IoPrintOutline />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* footer small */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/50">
          <div>Showing: {filtered.length}</div>
          <div>Sorted: newest first</div>
        </div>
      </div>
      {reasonModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={closeReasonModal}
        >
          <div
            className="w-full max-w-xl rounded-lg border border-white/10 bg-[#0B1220] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/90">
                {reasonModalTitle || "Reason"}
              </h3>
              <button
                type="button"
                onClick={closeReasonModal}
                className="rounded bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded bg-white/5 p-3 text-sm text-white/80">
              {reasonModalText}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(reasonModalText || "");
                }}
                className="rounded bg-sky-500/10 px-3 py-2 text-xs text-sky-300 hover:bg-sky-500/20"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={closeReasonModal}
                className="rounded bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentWithdraw;
