import React, { useState, useRef } from "react";
import useDashboardData from "../../utils/Hooks/dashboard/useDashboardData";
import useTodayCashReport from "../../utils/Hooks/cash/useTodayCashReport";
import { useReactToPrint } from "react-to-print";
import { MONTHS } from "../../../public/month";
import ReportTable from "../ReportTable/ReportTable";
import { FaCalendarAlt, FaPrint, FaArrowLeft, FaChevronLeft, FaChevronRight, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const getDhakaToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());
};

const DashboardReport = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getDhakaToday());

  // 🔹 ১. সার্ভার থেকে সরাসরি ক্যাশ সামারি (Direct from server `cash` table)
  const {
    cashSummary,
    isLoading: isServerCashLoading,
    refetch: refetchServerCash,
  } = useTodayCashReport(selectedDate);

  // 🔹 ২. ড্যাশবোর্ড সাপোর্টিং ডাটা (কাস্টমার, ইনভেস্টর নাম ইত্যাদি এনরিচমেন্টের জন্য)
  const {
    customerInstallmentCards,
    customerInstallmentPayments,
    investInstallments,
    companyExpenses,
    approvedCashReports,
    cashReports,
    dailyInstallments,
    investorWithdrawApplications,
    users = [],
    isLoading: isHookLoading,
  } = useDashboardData(selectedDate);

  const activeDate = selectedDate || getDhakaToday();

  // ক্যাশ রিপোর্ট লিস্ট (সার্ভার সামারি লিস্ট ১০০% অগ্রাধিকার পাবে)
  const allCashIn = (cashSummary && Array.isArray(cashSummary.cash_in_list))
    ? cashSummary.cash_in_list
    : (approvedCashReports || cashReports || []).filter((item) => {
        const itemDate = (item.date?.split(" ")[0] || item.date);
        return itemDate === activeDate && item.type === "in";
      });

  const allCashOut = (cashSummary && Array.isArray(cashSummary.cash_out_list))
    ? cashSummary.cash_out_list
    : (approvedCashReports || cashReports || []).filter((item) => {
        const itemDate = (item.date?.split(" ")[0] || item.date);
        return itemDate === activeDate && item.type === "out";
      });

  // 🔹 ক্যাশ ইন (Cash In) ক্যাটাগরি ভিত্তিক গ্রুপ - ১০০% ক্যাশ টেবিল থেকে
  const todayDownpayments = allCashIn.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    return cat === "downpayment" || src.includes("down payment") || src.includes("ডাউন পেমেন্ট");
  });

  const todayDailyInstallments = allCashIn.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    const isDP = cat === "downpayment" || src.includes("down payment") || src.includes("ডাউন পেমেন্ট");
    return !isDP && (cat === "daily-installment" || src.includes("daily"));
  });

  const todayMonthlyInstallments = allCashIn.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    const isDP = cat === "downpayment" || src.includes("down payment") || src.includes("ডাউন পেমেন্ট");
    const isDaily = cat === "daily-installment" || src.includes("daily");
    return !isDP && !isDaily && (cat === "installment" || src.includes("installment") || src.includes("কিস্তি"));
  });

  const todayInvestments = allCashIn.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    return cat === "invest" || src.includes("investment") || src.includes("বিনিয়োগ");
  });

  const todayLoansTaken = allCashIn.filter((item) => {
    return item.category?.toLowerCase()?.trim() === "loan";
  });

  const todayLoanReturns = allCashIn.filter((item) => {
    return item.category?.toLowerCase()?.trim() === "loan-return";
  });

  const todayOtherCashIn = allCashIn.filter((item) => {
    const isKnown = 
      todayDownpayments.some((i) => i.id === item.id) ||
      todayDailyInstallments.some((i) => i.id === item.id) ||
      todayMonthlyInstallments.some((i) => i.id === item.id) ||
      todayInvestments.some((i) => i.id === item.id) ||
      todayLoansTaken.some((i) => i.id === item.id) ||
      todayLoanReturns.some((i) => i.id === item.id);
    return !isKnown;
  });

  // 🔹 ক্যাশ আউট (Cash Out) ক্যাটাগরি ভিত্তিক গ্রুপ - ১০০% ক্যাশ টেবিল থেকে
  const todayProductPurchases = allCashOut.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    return cat === "purchase" || cat === "product-purchase" || src === "purchase" || src === "product-purchase";
  });

  const todayExpenses = allCashOut.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    const isPurchase = cat === "purchase" || cat === "product-purchase" || src === "purchase" || src === "product-purchase";
    if (isPurchase) return false;
    return (
      src === "company-expense" ||
      ["salary", "rent", "bill", "office-expense", "maintenance", "utility", "marketing", "transport", "food", "internet", "expense"].includes(cat)
    );
  });

  const todayLoansGiven = allCashOut.filter((item) => {
    return item.category?.toLowerCase()?.trim() === "loan-given";
  });

  const todayLoanRepayments = allCashOut.filter((item) => {
    return item.category?.toLowerCase()?.trim() === "loan-repayment";
  });

  const todayInvestorWithdraw = allCashOut.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    const src = item.source?.toLowerCase()?.trim() || "";
    return cat === "investor-withdraw" || cat === "investor-return" || src === "investor-withdraw";
  });

  const todayProfitWithdrawals = allCashOut.filter((item) => {
    const cat = item.category?.toLowerCase()?.trim() || "";
    return cat === "profit-withdraw" || cat === "profit-payout";
  });

  const todayOtherCashOut = allCashOut.filter((item) => {
    const isKnown =
      todayProductPurchases.some((i) => i.id === item.id) ||
      todayExpenses.some((i) => i.id === item.id) ||
      todayLoansGiven.some((i) => i.id === item.id) ||
      todayLoanRepayments.some((i) => i.id === item.id) ||
      todayInvestorWithdraw.some((i) => i.id === item.id) ||
      todayProfitWithdrawals.some((i) => i.id === item.id);
    return !isKnown;
  });

  // 🔹 মোট যোগফল হিসাব (সরাসরি ক্যাশ টেবিল থেকে)
  const totalDownpayment = todayDownpayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalMonthlyInstallment = todayMonthlyInstallments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDailyCollection = todayDailyInstallments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalInvestment = todayInvestments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanTaken = todayLoansTaken.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanReturn = todayLoanReturns.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOtherCashIn = todayOtherCashIn.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalProductPurchase = todayProductPurchases.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = todayExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanGiven = todayLoansGiven.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanRepaid = todayLoanRepayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalInvestorWithdraw = todayInvestorWithdraw.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalProfitWithdraw = todayProfitWithdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOtherCashOut = todayOtherCashOut.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const calculatedCashIn =
    totalDownpayment +
    totalMonthlyInstallment +
    totalDailyCollection +
    totalInvestment +
    totalLoanTaken +
    totalLoanReturn +
    totalOtherCashIn;

  const calculatedCashOut =
    totalProductPurchase +
    totalExpense +
    totalLoanGiven +
    totalLoanRepaid +
    totalInvestorWithdraw +
    totalProfitWithdraw +
    totalOtherCashOut;

  // 🔹 ক্যাশ সামারি (সার্ভার রেসপন্স সরাসরি ব্যবহৃত হবে)
  const openingCash = cashSummary?.opening_cash ?? 0;
  const cashIn = cashSummary?.today_in ?? calculatedCashIn;
  const cashOut = cashSummary?.today_out ?? calculatedCashOut;
  const totalCash = cashSummary?.net_cash ?? (openingCash + cashIn - cashOut);

  // 🔹 তারিখ ফরম্যাটিং
  const [year, month, day] = (activeDate || getDhakaToday()).split("-");
  const monthLabel = MONTHS.find((m) => m.value === Number(month))?.label || month;
  const formattedDate = `${monthLabel} ${Number(day)}, ${year}`;

  // 🔹 তারিখ পরিবর্তন হ্যান্ডলার (Timezone-safe)
  const handleShiftDate = (days) => {
    const [y, m, d] = (activeDate || getDhakaToday()).split("-").map(Number);
    const dt = new Date(y, m - 1, d + days);
    const newYear = dt.getFullYear();
    const newMonth = String(dt.getMonth() + 1).padStart(2, "0");
    const newDay = String(dt.getDate()).padStart(2, "0");
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `SupplyLink_Cash_Report_${activeDate}`,
  });

  const isLoading = isServerCashLoading || isHookLoading;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 print:p-0 print:bg-white print:text-black">
      {/* 🔹 টপ নেভিগেশন ও ডেট কন্ট্রোল বার (প্রিন্টে লুকানো থাকবে) */}
      <div className=" mx-auto mb-6 print:hidden">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          {/* ব্যাক বাটন ও টাইটেল */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="পিছনে যান"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
                দৈনিক ক্যাশ ও অপারেশন্স রিপোর্ট
              </h1>
              <p className="text-xs text-slate-400">
                সার্ভার ক্যাশ টেবিল থেকে লাইভ ও ব্যাক-ডেট অডিট
              </p>
            </div>
          </div>

          {/* ডেট সিলেক্টর ও কুইক কন্ট্রোলস */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
              title="পূর্ববর্তী দিন"
            >
              <FaChevronLeft className="text-xs" /> আগের দিন
            </button>

            <div className="relative flex items-center shadow-lg rounded-xl">
              <FaCalendarAlt className="absolute left-3 text-indigo-600 text-sm pointer-events-none z-10" />
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white text-slate-900 border-2 border-indigo-400 hover:border-indigo-600 focus:border-indigo-600 rounded-xl pl-9 pr-3 py-1.5 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md cursor-pointer transition"
              />
            </div>

            <button
              onClick={() => handleShiftDate(1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
              title="পরবর্তী দিন"
            >
              পরের দিন <FaChevronRight className="text-xs" />
            </button>

            <button
              onClick={() => setSelectedDate(getDhakaToday())}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeDate === getDhakaToday()
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              আজ (Today)
            </button>

            <button
              onClick={() => refetchServerCash()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="রিফ্রেশ"
            >
              <FaSyncAlt className={`text-xs ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            {/* প্রিন্ট বাটন */}
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <FaPrint />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 প্রিন্টেবল রিপোর্ট কনটেইনার */}
      <div className=" mx-auto bg-white text-black p-6 rounded-2xl shadow-2xl print:p-0 print:shadow-none print:rounded-none">
        <div ref={printRef} className="dashboard-report-print">
          {/* কভার / প্রথম পেইজ ক্যাশ সামারি */}
          <div className="report-first-page px-6 md:px-10 pt-4">
            <div className="border border-slate-900 rounded-2xl p-6 mb-8 bg-slate-50/50 cash-summary shadow-sm">
              <div className="text-center mb-6">
                <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500">
                  SupplyLink Management
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                  {formattedDate} Cash Summary
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Report Date: {activeDate}
                </p>
              </div>

              <div className="space-y-4 text-base md:text-lg">
                <div className="flex justify-between border-b border-slate-300 pb-2.5">
                  <span className="font-semibold text-slate-700">💰 Opening Cash</span>
                  <span className="font-bold font-mono text-emerald-700">
                    ৳ {openingCash.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-300 pb-2.5">
                  <span className="font-semibold text-slate-700">📥 Cash In</span>
                  <span className="font-bold font-mono text-emerald-700">
                    ৳ {cashIn.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-300 pb-2.5">
                  <span className="font-semibold text-slate-700">📤 Cash Out</span>
                  <span className="font-bold font-mono text-rose-700">
                    ৳ {cashOut.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pt-3 text-xl md:text-2xl font-black">
                  <span className="text-slate-900">💵 Net Cash</span>
                  <span
                    className={`font-mono ${
                      totalCash >= 0 ? "text-blue-700" : "text-rose-700"
                    }`}
                  >
                    ৳ {totalCash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* বিস্তারিত টেবিলসমূহ (১০০% ক্যাশ লেজার ভাউচার ভিত্তিক) */}
          <div className="report-tables-container space-y-6">

            {/* 1. Down Payment Collection */}
            {todayDownpayments.length > 0 && (
              <ReportTable
                title="Today's Down Payment Collection Report (ডাউন পেমেন্ট আদায়)"
                columns={["#", "উৎস / গ্রাহক (Source / Customer)",  "উদ্দেশ্য (Purpose)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayDownpayments}
                total={totalDownpayment}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                  
                  item?.purpose || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 2. Monthly Installment Collection */}
            {todayMonthlyInstallments.length > 0 && (
              <ReportTable
                title="Today's Monthly Installment Collection Report (মাসিক কিস্তি আদায়)"
                columns={["#", "উৎস / গ্রাহক (Customer / Source)",  "উদ্দেশ্য (Purpose)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayMonthlyInstallments}
                total={totalMonthlyInstallment}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                 
                  item?.purpose || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 3. Daily Installment Collection */}
            {todayDailyInstallments.length > 0 && (
              <ReportTable
                title="Today's Daily Installment Collection Report (দৈনিক কিস্তি আদায়)"
                columns={["#", "উৎস / গ্রাহক (Customer / Source)", "উদ্দেশ্য (Purpose)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayDailyInstallments}
                total={totalDailyCollection}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                
                  item?.purpose || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 4. Investment Collection */}
            {todayInvestments.length > 0 && (
              <ReportTable
                title="Today's Investment Collection Report (বিনিয়োগ জমা)"
                columns={["#", "বিনিয়োগকারী / উৎস (Investor)",  "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayInvestments}
                total={totalInvestment}
                totalColSpan={3}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                  
                  item?.remarks || item?.purpose || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 5. Loan Taken Report */}
            {todayLoansTaken.length > 0 && (
              <ReportTable
                title="Today's Loan Taken Report (ঋণ গ্রহণ)"
                columns={["#", "কার থেকে নেওয়া (Source)",  "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayLoansTaken}
                total={totalLoanTaken}
                totalColSpan={3}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                 
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 6. Loan Return Received Report */}
            {todayLoanReturns.length > 0 && (
              <ReportTable
                title="Today's Loan Return Report (ঋণ ফেরত আদায়)"
                columns={["#", "কে ফেরত দিয়েছে (Source)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayLoanReturns}
                total={totalLoanReturn}
                totalColSpan={3}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                  
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 7. Other Cash In */}
            {todayOtherCashIn.length > 0 && (
              <ReportTable
                title="Today's Other Cash In Report (অন্যান্য ক্যাশ ইন)"
                columns={["#", "উৎস (Source)", "খাত (Category)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayOtherCashIn}
                total={totalOtherCashIn}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                  item?.category || "-",
                  item?.remarks || item?.purpose || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 8. Product Purchase & Supplier Payment */}
            {todayProductPurchases.length > 0 && (
              <ReportTable
                title="Today's Product Purchase Report (পণ্য ক্রয় ও মহাজন পেমেন্ট)"
                columns={["#", "পণ্য / উদ্দেশ্য (Product / Purpose)", "মহাজন / মাধ্যম (Source)",  "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayProductPurchases}
                total={totalProductPurchase}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || item?.remarks || "পণ্য ক্রয়",
                  item?.source || "-",
                  
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 9. Company Expenses */}
            {todayExpenses.length > 0 && (
              <ReportTable
                title="Today's Expenses Report (কোম্পানি ও অফিস খরচ)"
                columns={["#", "খরচের খাত / উদ্দেশ্য (Purpose)", "ক্যাটাগরি (Category)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayExpenses}
                total={totalExpense}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || item?.remarks || "-",
                  item?.category || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 10. Loan Given */}
            {todayLoansGiven.length > 0 && (
              <ReportTable
                title="Today's Loan Given Report (ঋণ প্রদান)"
                columns={["#", "কাকে দেওয়া হয়েছে (Recipient)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayLoansGiven}
                total={totalLoanGiven}
                totalColSpan={3}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || item?.source || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 11. Loan Repayments */}
            {todayLoanRepayments.length > 0 && (
              <ReportTable
                title="Today's Loan Repayment Report (ঋণ পরিশোধ)"
                columns={["#", "কার ঋণ ক্লিয়ার করা হয়েছে (Paid To)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayLoanRepayments}
                total={totalLoanRepaid}
                totalColSpan={3}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || item?.source || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 12. Investor Amount Withdraw */}
            {todayInvestorWithdraw.length > 0 && (
              <ReportTable
                title="Today's Investor Amount Withdraw Report (বিনিয়োগকারী উত্তোলন)"
                columns={["#", "বিনিয়োগকারী (Investor)", "উদ্দেশ্য (Purpose)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayInvestorWithdraw}
                total={totalInvestorWithdraw}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || item?.purpose || "-",
                  item?.purpose || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 13. Profit Withdrawals */}
            {todayProfitWithdrawals.length > 0 && (
              <ReportTable
                title="Today's Profit Withdraw Report (লভ্যাংশ উত্তোলন)"
                columns={["#", "উদ্দেশ্য (Purpose)", "মাধ্যম / প্রাপক (Source)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayProfitWithdrawals}
                total={totalProfitWithdraw}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || "-",
                  item?.source || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}

            {/* 14. Other Cash Out */}
            {todayOtherCashOut.length > 0 && (
              <ReportTable
                title="Today's Other Cash Out Report (অন্যান্য ক্যাশ আউট)"
                columns={["#", "খরচের উদ্দেশ্য (Purpose)", "ক্যাটাগরি (Category)", "বিবরণ (Remarks)", "পরিমাণ (Amount)"]}
                data={todayOtherCashOut}
                total={totalOtherCashOut}
                totalColSpan={4}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || item?.remarks || "অন্যান্য ব্যয়",
                  item?.category || "-",
                  item?.remarks || "-",
                  Number(item?.amount || 0).toLocaleString(),
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* 🔹 প্রিন্ট ও ডেটপিকার স্টাইল */}
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
          opacity: 0.85;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
          transform: scale(1.15);
        }

        .dashboard-report-print {
          background: #fff;
          color: #000;
          width: 100%;
        }

        .report-table-title {
          font-size: 15px !important;
          font-weight: 700 !important;
          margin-bottom: 6px !important;
          color: #0f172a !important;
        }

        .dashboard-report-print table {
          width: 100%;
          border-collapse: collapse;
        }

        .dashboard-report-print th,
        .dashboard-report-print td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font-size: 13px;
        }

        .dashboard-report-print thead {
          background: #f1f5f9;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body {
            background: #fff !important;
            color: #000 !important;
          }

          .dashboard-report-print {
            padding: 0 !important;
            margin: 0 !important;
          }

          .report-table-title {
            font-size: 13px !important;
            font-weight: 700 !important;
            margin-bottom: 4px !important;
            margin-top: 10px !important;
          }

          .report-first-page {
            page-break-after: always;
            break-after: page;
            min-height: calc(100vh - 20mm);
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .report-tables-container {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardReport;
