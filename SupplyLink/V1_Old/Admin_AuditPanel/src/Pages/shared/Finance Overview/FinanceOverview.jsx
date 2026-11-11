import React, { useMemo, useState } from "react";
import Loader from "../../../components/Loader/Loader";
import { FinanceModal } from "./FinanceModal";
import useCompanyExpenses from "../../../utils/Hooks/Expenses/useCompanyExpenses";
import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";

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

const StatCard = ({
  title,
  value,
  accent = "emerald",
  icon = "💠",
  subtitle,
}) => {
  const accentMap = {
    emerald: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
    indigo: "border-indigo-500/40 bg-indigo-500/5 text-indigo-300",
    amber: "border-amber-500/40 bg-amber-500/5 text-amber-300",
    rose: "border-rose-500/40 bg-rose-500/5 text-rose-300",
    red: "border-red-500/40 bg-red-500/5 text-red-300",
    sky: "border-sky-500/40 bg-sky-500/5 text-sky-300",
    slate: "border-slate-500/40 bg-slate-500/5 text-slate-200",
  };

  const accentCls = accentMap[accent] || accentMap.emerald;

  return (
    <div
      className={[
        "group relative rounded-2xl border p-4 shadow-sm",
        "bg-white/5 backdrop-blur",
        "hover:bg-white/7 hover:border-white/20 transition",
        "h-full flex flex-col justify-between", // ✅ height fix
        // "min-h-[150px]", // ✅ (optional) hard lock height
        accentCls,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200/90">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-400 leading-snug">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-2.5 py-1.5 text-sm">
          <span className="opacity-90">{icon}</span>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-bold tracking-tight text-slate-50">
          ৳ {formatBDT(value)}
        </p>
      </div>
    </div>
  );
};

const Section = ({ title, hint, children }) => (
  <section className="space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {hint ? <p className="text-xs text-slate-400 mt-0.5">{hint}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const FinanceOverview = () => {
  const { isSalesCardError, isSalesCardLoading, salesCards } = useSalesCard();
const {isSalesItemsError,salesItems,isSalesItemsLoading} = useSalesItems()
  const { isSalesPaymentsError, isSalesPaymentsLoading, salesPayments } =
    useSalesPayments();

  const { companyExpenses, isCompanyExpensesError, isCompanyExpensesLoading } =
    useCompanyExpenses();
  const loading = isSalesCardLoading || isSalesPaymentsLoading;
   isCompanyExpensesLoading;
  const hasError = isSalesPaymentsError || isSalesCardError;

  isCompanyExpensesError;

  const cards = salesCards || [];
  const items  = salesItems || [];
  const payments = salesPayments || [];
  const Expenses = companyExpenses || [];
  /* ---------- metrics ---------- */
  const {
    totalCostPrice,
    totalSalePrice,
    totalProfit,
    WithdrawnProfit,
    totalDuePaid,
    totalPaidPrincipal,
    paidProfit,

    totalDueUnPaid,
    totalUnPaidPrincipal,
    totalUnPaidProfit,
    currentCash,
    totalCompanyExpenses,
  } = useMemo(() => {

const totalCostPrice = salesItems.reduce(
  (sum, c) =>
    sum +
    toNum(c.purchase_price) +
    toNum(c.additional_cost),
  0
);

    const totalSalePrice = cards.reduce(
      (sum, c) => sum + toNum(c.sale_price),
      0,
    );
const totalProfit = items.reduce(
  (sum, item) =>
    sum +
    (
      toNum(item.sale_price) -
      (
        toNum(item.purchase_price) +
        toNum(item.additional_cost)
      )
    ),
  0
);
    // paid_date based collected (safe)
    const totalDuePaid = payments.reduce(
      (sum, p) => (p.paid_date ? sum + toNum(p.due_amount) : sum),
      0,
    );
    const totalPaidPrincipal = payments.reduce(
      (sum, p) => (p.paid_date ? sum + toNum(p.principal_amount) : sum),
      0,
    );
    const paidProfit = payments.reduce(
      (sum, p) => (p.paid_date ? sum + toNum(p.profit_amount) : sum),
      0,
    );

    const unpaidPayments = payments.filter(
      (p) => String(p.status) === "Unpaid",
    );
    const totalDueUnPaid = unpaidPayments.reduce(
      (sum, p) => sum + toNum(p.due_amount),
      0,
    );
    const totalUnPaidPrincipal = unpaidPayments.reduce(
      (sum, p) => sum + toNum(p.principal_amount),
      0,
    );
    const totalUnPaidProfit = unpaidPayments.reduce(
      (sum, p) => sum + toNum(p.profit_amount),
      0,
    );

    const totalCompanyExpenses = Expenses.reduce(
      (sum, r) => sum + toNum(r.amount),
      0,
    );

    const currentCash = totalDuePaid - totalCostPrice - totalCompanyExpenses;
    return {
      totalCostPrice,
      totalSalePrice,
      totalProfit,
      totalDuePaid,
      totalPaidPrincipal,
      paidProfit,

      totalDueUnPaid,
      totalUnPaidPrincipal,
      totalUnPaidProfit,

      currentCash,
      totalCompanyExpenses,
    };
  }, [cards, payments, Expenses,items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-24">
        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/30">
                <span className="text-lg">👁️</span>
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Financial Snapshot
                </h2>
                <p className="text-sm text-slate-400">
                  এক নজরে সামগ্রিক আর্থিক চিত্র (Sales • Collections • Dues •
                  Cash)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                Updated: Live
              </span>
              {hasError ? (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                  Data error (check API)
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* KPI Row (top 3) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Cost Price"
            subtitle="সকল কাস্টমার কার্ডের ক্রয়মূল্য"
            value={totalCostPrice}
            accent="emerald"
            icon="🧾"
          />
          <StatCard
            title="Total Sale Price"
            subtitle="সকল কাস্টমার কার্ডের বিক্রয়মূল্য"
            value={totalSalePrice}
            accent="indigo"
            icon="🏷️"
          />
          <StatCard
            title="Total Profit"
            subtitle="Profit = Sale - Cost"
            value={totalProfit}
            accent="amber"
            icon="📈"
          />
        </div>

        {/* Collections */}
        <div className="mt-6">
          <Section title="Collections" hint="Paid date অনুযায়ী আদায়কৃত হিসাব">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Collected Sale (Total)"
                subtitle="মোট আদায়কৃত বিক্রয় মূল্য"
                value={totalDuePaid}
                accent="sky"
                icon="✅"
              />
              <StatCard
                title="Collected Principal"
                subtitle="মোট আদায়কৃত মূলধন"
                value={totalPaidPrincipal}
                accent="slate"
                icon="💰"
              />
              <StatCard
                title="Collected Profit"
                subtitle="মোট আদায়কৃত লাভ"
                value={paidProfit}
                accent="emerald"
                icon="✨"
              />
            </div>
          </Section>
        </div>

        {/* Dues */}
        <div className="mt-6">
          <Section title="Dues" hint="Unpaid status অনুযায়ী বকেয়া হিসাব">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Total Due"
                subtitle="মোট বকেয়া"
                value={totalDueUnPaid}
                accent="red"
                icon="⏳"
              />
              <StatCard
                title="Due Principal"
                subtitle="মোট বকেয়া মূলধন"
                value={totalUnPaidPrincipal}
                accent="rose"
                icon="📌"
              />
              <StatCard
                title="Due Profit"
                subtitle="মোট বকেয়া লাভ"
                value={totalUnPaidProfit}
                accent="red"
                icon="⚠️"
              />
            </div>
          </Section>
        </div>
        {/* Expenses */}
        <div className="mt-6">
          <Section title="Expenses" hint="কোম্পানির মোট খরছ">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Total Expenses"
                subtitle="মোট খরছ"
                value={totalCompanyExpenses}
                accent="red"
                icon="⏳"
              />
            </div>
          </Section>
        </div>

        {/* Investment & Cash */}
        <div className="mt-6">
          <Section title=" Cash" hint="cash">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Current Cash"
                subtitle="Collected Sale - Cost - Total Company Expenses"
                value={currentCash}
                accent="emerald"
                icon="💵"
              />
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
};

export default FinanceOverview;
