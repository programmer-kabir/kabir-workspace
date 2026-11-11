import React, { useMemo, useState } from "react";
import useCustomerApplicationFrom from "../../utils/Hooks/Customers/useCustomerApplicationFrom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useAuth } from "../../Provider/AuthProvider";
import { MONTHS } from "../../../public/month"; // ✅ তোমার path অনুযায়ী adjust করো

import {
  Badge,
  CardTone,
  Chevron,
  DocThumb,
  Field,
  Section,
} from "../../components/ProductPurchaseApplicationFrom/ProductPurchaseApplicationAction";

const money = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString("en-US");
};

const ProductPurchaseApplication = () => {
  const { user } = useAuth();
  const {
    customerApplications = [],
    isCustomerApplicationsError,
    isCustomerApplicationsLoading,
    refetch,
  } = useCustomerApplicationFrom();

  const [openId, setOpenId] = useState(null);

  // ✅ BD today
  const todayBD = useMemo(() => {
    const d = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }, []);

  // ================= YEAR RANGE =================
  const START_YEAR = 2025;
  const RUNNING_YEAR = new Date().getFullYear();
  const END_YEAR = Math.max(RUNNING_YEAR, START_YEAR);

  const years = useMemo(() => {
    const arr = [];
    for (let y = START_YEAR; y <= END_YEAR; y++) arr.push(y);
    return arr;
  }, [END_YEAR]);

  // ================= FILTER STATE (ProfitActionHistory style) =================
  const [filterType, setFilterType] = useState("monthly"); // all | daily | monthly | yearly
  const [selectedDate, setSelectedDate] = useState(todayBD);
  const [selectedMonth, setSelectedMonth] = useState(""); // 1..12
  const [selectedYear, setSelectedYear] = useState(""); // YYYY

  // Action = card filter
  const [actionFilter, setActionFilter] = useState("all"); // all | green | yellow | red | shop

  // Decision = status filter
  const [decisionFilter, setDecisionFilter] = useState("all"); // all | pending | approved | rejected

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

  // ================= LIST =================
  const list = useMemo(() => {
    return Array.isArray(customerApplications) ? customerApplications : [];
  }, [customerApplications]);

  // ================= FILTERED DATA (ProfitActionHistory style) =================
  const filteredList = useMemo(() => {
    const arr = Array.isArray(list) ? list : [];

    return arr
      .filter((app) => {
        // ---------- Action filter (card) ----------
        const card = String(app.application_card || "").toLowerCase();
        if (actionFilter !== "all" && card !== actionFilter) return false;

        // ---------- Decision filter (status) ----------
        const st = String(app.status || "").toLowerCase();
        if (decisionFilter !== "all" && st !== decisionFilter) return false;

        // ---------- View(Request Date) filter ----------
        const rdRaw = app.request_date; // YYYY-MM-DD
        const rd = toDate(rdRaw);
        if (!rd) return false;

        if (filterType === "daily") {
          if (!selectedDate) return true;
          return formatYMD(rd) === selectedDate;
        }

        if (filterType === "monthly") {
          if (!selectedMonth) return true;
          return rd.getMonth() + 1 === Number(selectedMonth);
        }

        if (filterType === "yearly") {
          if (!selectedYear) return true;
          return rd.getFullYear() === Number(selectedYear);
        }

        return true; // all
      })
      .slice()
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [
    list,
    actionFilter,
    decisionFilter,
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
  ]);

  // ================= API =================
  const updateStatus = async ({ id, action, reject_reason, reviewed_by }) => {
    const res = await fetch(
      `${import.meta.env.VITE_LOCALHOST_KEY}/applications/update_customer_application_status.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, action, reject_reason, reviewed_by }),
      },
    );

    const data = await res.json();
    if (!res.ok || !data?.success)
      throw new Error(data?.message || "Request failed");
    return data;
  };

  const handleAccept = async (appId) => {
    try {
      const confirm = await Swal.fire({
        title: "Approve application?",
        text: "Are you sure you want to approve this application?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Approve",
        cancelButtonText: "Cancel",
      });

      if (!confirm.isConfirmed) return;

      await updateStatus({
        id: appId,
        action: "approve",
        reviewed_by: user?.id,
      });

      toast.success("Approved ✅");
      refetch?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleReject = async (appId) => {
    try {
      const { value, isConfirmed } = await Swal.fire({
        title: "Reject reason",
        input: "textarea",
        inputLabel: "Write the reject reason",
        inputPlaceholder: "e.g. NID mismatch / bank doc missing...",
        inputAttributes: { maxlength: 500 },
        showCancelButton: true,
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
        preConfirm: (v) => {
          if (!v || !v.trim()) {
            Swal.showValidationMessage("Reject reason is required");
          }
          return v.trim();
        },
      });

      if (!isConfirmed) return;

      await updateStatus({
        id: appId,
        action: "reject",
        reject_reason: value,
        reviewed_by: user?.id,
      });

      toast.success("Rejected ✅");
      refetch?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // ================= Loading / Error =================
  if (isCustomerApplicationsLoading) {
    return <div className="p-4 text-white">Loading...</div>;
  }
  if (isCustomerApplicationsError) {
    return <div className="p-4 text-red-400">Something went wrong</div>;
  }

  // ================= UI Classes (same as ProfitActionHistory) =================
  const inputCls =
    "h-10 rounded border border-white/10 bg-[#071025] px-3 text-sm text-white " +
    "outline-none placeholder:text-white/40";

  const selectCls =
    inputCls + " pr-8 dark:[color-scheme:dark] [color-scheme:dark]";

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">
        Product Purchase Applications
      </h2>

      {/* ================= FILTER BAR (ProfitActionHistory style) ================= */}
      <div className="flex flex-wrap items-end gap-3 rounded bg-[#1A253A] p-4">
        {/* Action (Card) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">All</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
            <option value="shop">Shop</option>
          </select>
        </div>

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
              // clear relevant selectors
              if (v !== "daily") setSelectedDate(todayBD);
              if (v !== "monthly") setSelectedMonth("");
              if (v !== "yearly") setSelectedYear("");
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
              {/* MONTHS -> show month name */}
              {MONTHS.map((m, idx) => {
                // supports MONTHS as ["January"...] OR [{value,label}]
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
            setFilterType("monthly");
            setSelectedDate(todayBD);
            setSelectedMonth("");
            setSelectedYear("");
            setActionFilter("all");
            setDecisionFilter("all");
          }}
          className="h-10 rounded bg-[#071025] px-4 text-sm text-white/80 hover:bg-white/10"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* ================= COUNT ================= */}
      <div className="text-sm text-white/60">
        Total: <span className="text-white">{list.length}</span>{" "}
        <span className="mx-2">|</span>
        Showing: <span className="text-white">{filteredList.length}</span>
      </div>

      {/* ================= EMPTY ================= */}
      {filteredList.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No applications found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((app) => {
            const open = String(openId) === String(app.id);
            const tone = CardTone(app.application_card);

            const status = String(app.status || "").toLowerCase();
            const statusTone =
              status === "approved"
                ? "green"
                : status === "rejected"
                  ? "red"
                  : status === "pending"
                    ? "yellow"
                    : "slate";

            const isPending = status === "pending";

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm transition hover:bg-white/[0.06]"
              >
                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : app.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-4 p-4 md:p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-base font-semibold text-white">
                          {app.customer_name || "—"}
                        </div>

                        <Badge tone={tone}>
                          {String(app.application_card || "").toUpperCase()}
                        </Badge>

                        <Badge tone={statusTone}>
                          {String(app.status || "").toUpperCase()}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                        <span className="truncate">
                          {app.product_name || "—"}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>
                          ৳{money(app.sales_price)}{" "}
                          <span className="text-slate-500">(Sales)</span>
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>
                          {app.installments || "-"}{" "}
                          <span className="text-slate-500">Installments</span>
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>
                          {app.request_date || "-"}{" "}
                          <span className="text-slate-500">Request</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden md:block text-right">
                        <div className="text-xs text-slate-500">App ID</div>
                        <div className="text-sm font-semibold text-slate-200">
                          #{app.id}
                        </div>
                      </div>
                      <Chevron open={open} />
                    </div>
                  </div>
                </button>

                {/* Details */}
                {open && (
                  <div className="border-t border-white/10 p-4 md:p-5 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Section title="Customer">
                        <Field label="Name" value={app.customer_name} />
                        <Field label="Phone" value={app.customer_phone} />
                        <Field label="Address" value={app.customer_address} />
                        <Field label="Created By" value={app.created_by} />
                      </Section>

                      <Section title="Guarantor">
                        <Field label="Name" value={app.guarantor_name} />
                        <Field label="Phone" value={app.guarantor_phone} />
                        <Field label="Address" value={app.guarantor_address} />
                        <Field label="Status" value={app.status} />
                      </Section>
                    </div>

                    <Section title="Product & Payment">
                      <Field label="Product" value={app.product_name} />
                      <Field label="MRP" value={`৳${money(app.mrp)}`} />
                      <Field
                        label="Sales Price"
                        value={`৳${money(app.sales_price)}`}
                      />
                      <Field
                        label="Down Payment"
                        value={`৳${money(app.down_payment)}`}
                      />
                      <Field label="Installments" value={app.installments} />
                      <Field label="Created At" value={app.created_at} />
                      <Field
                        label="Reviewed At"
                        value={app.reviewed_at || "-"}
                      />
                      <Field
                        label="Reviewed By"
                        value={app.reviewed_by || "-"}
                      />
                    </Section>

                    {status === "rejected" && app.reject_reason && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                        <div className="text-sm font-semibold text-rose-200 mb-1">
                          Reject Reason
                        </div>
                        <div className="text-sm text-rose-100">
                          {app.reject_reason}
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 text-sm font-semibold text-slate-100">
                        Documents
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <DocThumb
                          src={app.customer_photo_url}
                          label="Customer Photo"
                        />
                        <DocThumb
                          src={app.customer_nid_front_url}
                          label="Customer NID Front"
                        />
                        <DocThumb
                          src={app.customer_nid_back_url}
                          label="Customer NID Back"
                        />
                        <DocThumb
                          src={app.customer_bank_check_url}
                          label="Bank Check"
                        />
                        <DocThumb
                          src={app.customer_bank_statement_url}
                          label="Bank Statement"
                        />
                        <DocThumb
                          src={app.guarantor_photo_url}
                          label="Guarantor Photo"
                        />
                        <DocThumb
                          src={app.guarantor_nid_front_url}
                          label="Guarantor NID Front"
                        />
                        <DocThumb
                          src={app.guarantor_nid_back_url}
                          label="Guarantor NID Back"
                        />
                      </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end pt-2">
                      <button
                        className={`w-full md:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold transition
                          ${
                            isPending
                              ? "bg-emerald-600/90 hover:bg-emerald-600 text-white"
                              : "bg-white/5 text-slate-400 cursor-not-allowed border border-white/10"
                          }`}
                        onClick={() => isPending && handleAccept(app.id)}
                        type="button"
                        disabled={!isPending}
                      >
                        Accept
                      </button>

                      <button
                        className={`w-full md:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold transition
                          ${
                            isPending
                              ? "bg-rose-600/90 hover:bg-rose-600 text-white"
                              : "bg-white/5 text-slate-400 cursor-not-allowed border border-white/10"
                          }`}
                        onClick={() => isPending && handleReject(app.id)}
                        type="button"
                        disabled={!isPending}
                      >
                        Reject
                      </button>
                    </div>

                    {!isPending && (
                      <div className="text-xs text-slate-400">
                        This application is already{" "}
                        <span className="text-slate-200 font-semibold">
                          {app.status}
                        </span>
                        .
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductPurchaseApplication;
