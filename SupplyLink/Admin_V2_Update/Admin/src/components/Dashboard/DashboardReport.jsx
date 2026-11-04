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

  // ক্যাশ রিপোর্ট লিস্ট (সার্ভার সামারি লিস্ট অগ্রাধিকার পাবে)
  const allCash = (cashSummary && Array.isArray(cashSummary.cash_in_list) && Array.isArray(cashSummary.cash_out_list))
    ? [...cashSummary.cash_in_list, ...cashSummary.cash_out_list]
    : (approvedCashReports || cashReports || []);

  // 🔹 ফিল্টার্ড ট্রানজেকশন তালিকা
  const monthlyInstallments = customerInstallmentPayments?.filter((item) => {
    const card = customerInstallmentCards?.find(
      (c) => Number(c.card_id) === Number(item.card_id)
    );
    const isDaily = (card?.installment_type || card?.remarks || "").trim().toLowerCase() === "daily";
    return (
      item.status === "Paid" &&
      item.paid_date?.split(" ")[0] === activeDate &&
      !isDaily
    );
  }) || [];

  const todayInvestments = investInstallments?.filter(
    (item) => item.investment_date?.split(" ")[0] === activeDate
  ) || [];

  const todayDailyInstallments = dailyInstallments?.filter(
    (item) => item.date?.split(" ")[0] === activeDate
  ) || [];

  const todayExpenses = companyExpenses?.filter(
    (item) => item.date?.split(" ")[0] === activeDate
  ) || [];

  const todayProductPurchase = customerInstallmentCards?.filter(
    (item) => item.delivery_date?.split(" ")[0] === activeDate
  ) || [];

  const todayCompleteInvestorReturnAmount = investorWithdrawApplications?.filter(
    (item) => item.reviewed_at?.split(" ")[0] === activeDate
  ) || [];

  // Loan & Cash In/Out Filters
  const todayLoansTaken = allCash.filter(
    (item) =>
      (item.date?.split(" ")[0] === activeDate || item.date === activeDate) &&
      item.type === "in" &&
      item.category?.toLowerCase()?.trim() === "loan"
  );

  const todayLoanReturns = allCash.filter(
    (item) =>
      (item.date?.split(" ")[0] === activeDate || item.date === activeDate) &&
      item.type === "in" &&
      item.category?.toLowerCase()?.trim() === "loan-return"
  );

  const todayLoansGiven = allCash.filter(
    (item) =>
      (item.date?.split(" ")[0] === activeDate || item.date === activeDate) &&
      item.type === "out" &&
      item.category?.toLowerCase()?.trim() === "loan-given"
  );

  const todayLoanRepayments = allCash.filter(
    (item) =>
      (item.date?.split(" ")[0] === activeDate || item.date === activeDate) &&
      item.type === "out" &&
      item.category?.toLowerCase()?.trim() === "loan-repayment"
  );

  const todayOtherCashIn = allCash.filter(
    (item) =>
      (item.date?.split(" ")[0] === activeDate || item.date === activeDate) &&
      item.type === "in" &&
      !["invest", "installment", "downpayment", "daily-installment", "loan", "loan-return"].includes(
        item.category?.toLowerCase()?.trim()
      )
  );

  const todayProfitWithdrawals = allCash.filter(
    (item) =>
      (item.date?.split(" ")[0] === activeDate || item.date === activeDate) &&
      item.type === "out" &&
      (item.category?.toLowerCase()?.trim() === "profit-withdraw" ||
        item.category?.toLowerCase()?.trim() === "profit-payout")
  );

  const dailyMonthlyInstallments = customerInstallmentPayments?.filter((item) => {
    const card = customerInstallmentCards?.find(
      (c) => Number(c.card_id) === Number(item.card_id)
    );
    const isDaily = (card?.installment_type || card?.remarks || "").trim().toLowerCase() === "daily";
    return (
      item.status === "Paid" &&
      item.paid_date?.split(" ")[0] === activeDate &&
      isDaily
    );
  }) || [];

  // 🔹 মোট যোগফল হিসাব
  const totalInstallmentCollection = monthlyInstallments.reduce(
    (sum, item) => sum + Number(item.due_amount || item.paid_amount || 0), 0
  );
  const totalInvestment = todayInvestments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDailyCollection = todayDailyInstallments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDailyMonthlyInstallmentCollection = dailyMonthlyInstallments.reduce(
    (sum, item) => sum + Number(item.due_amount || 0), 0
  );
  const totalExpense = todayExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalProductPurchase = todayProductPurchase.reduce((sum, item) => sum + Number(item.cost_price || 0), 0);
  const totalInvestorWithdraw = todayCompleteInvestorReturnAmount.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalLoanTaken = todayLoansTaken.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanReturn = todayLoanReturns.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanGiven = todayLoansGiven.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalLoanRepaid = todayLoanRepayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalProfitWithdraw = todayProfitWithdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOtherCashIn = todayOtherCashIn.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 🔹 ক্যাশ সামারি (সার্ভার রেসপন্স সরাসরি ব্যবহৃত হবে)
  const openingCash = cashSummary?.opening_cash ?? 0;
  const cashIn = cashSummary?.today_in ?? (
    totalInstallmentCollection +
    totalInvestment +
    totalDailyCollection +
    totalDailyMonthlyInstallmentCollection +
    totalLoanTaken +
    totalLoanReturn +
    totalOtherCashIn
  );
  const cashOut = cashSummary?.today_out ?? (
    totalExpense +
    totalProductPurchase +
    totalInvestorWithdraw +
    totalLoanGiven +
    totalLoanRepaid +
    totalProfitWithdraw
  );
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

            <div className="relative flex items-center">
              <FaCalendarAlt className="absolute left-3 text-indigo-400 text-sm pointer-events-none" />
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition shadow-inner"
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

          {/* বিস্তারিত টেবিলসমূহ */}
          <div className="report-tables-container space-y-6">
            {/* 🔹 ১. Cash Table থেকে আজকের সকল ক্যাশ ইন */}
            {cashSummary?.cash_in_list?.length > 0 && (
              <ReportTable
                title="আজকের সকল ক্যাশ ইন লেনদেন (Cash In Details)"
                columns={["#", "উৎস / গ্রাহক (Source)", "ক্যাটাগরি", "রেফারেন্স / রসিদ", "বিবরণ (Remarks)", "পরিমাণ"]}
                data={cashSummary.cash_in_list}
                total={cashSummary.today_in}
                totalColSpan={5}
                renderRow={(item, index) => [
                  index + 1,
                  item?.source || "-",
                  item?.category || "-",
                  item?.refId || "-",
                  item?.remarks || "-",
                  Number(item.amount).toLocaleString(),
                ]}
              />
            )}

            {/* 🔹 ২. Cash Table থেকে আজকের সকল ক্যাশ আউট */}
            {cashSummary?.cash_out_list?.length > 0 && (
              <ReportTable
                title="আজকের সকল ক্যাশ আউট লেনদেন (Cash Out Details)"
                columns={["#", "ব্যয়ের খাত / উদ্দেশ্য (Purpose)", "উৎস (Source)", "ক্যাটাগরি", "বিবরণ (Remarks)", "পরিমাণ"]}
                data={cashSummary.cash_out_list}
                total={cashSummary.today_out}
                totalColSpan={5}
                renderRow={(item, index) => [
                  index + 1,
                  item?.purpose || item?.source || "-",
                  item?.source || "-",
                  item?.category || "-",
                  item?.remarks || "-",
                  Number(item.amount).toLocaleString(),
                ]}
              />
            )}

            {/* Investment Collection */}
            <ReportTable
              title="Today's Investment Collection Report"
              columns={["#", "Investor", "Investor Id", "Card No", "Amount"]}
              data={todayInvestments}
              total={totalInvestment}
              totalColSpan={4}
              renderRow={(item, index) => {
                const user = users.find(
                  (u) => Number(u.id) === Number(item.investor_id) || Number(u.user_id) === Number(item.investor_id)
                );
                return [
                  index + 1,
                  user?.name || "-",
                  user?.user_id || user?.id || item.investor_id || "-",
                  item.investment_card_no,
                  Number(item.amount).toLocaleString(),
                ];
              }}
            />

            {/* Daily Installment Collection */}
            <ReportTable
              title="Today's Daily Installment Collection Report"
              columns={["#", "Customer", "Customer Id", "Card No", "Amount"]}
              data={todayDailyInstallments}
              total={totalDailyCollection}
              totalColSpan={4}
              renderRow={(item, index) => {
                const user = users.find(
                  (u) => Number(u.id) === Number(item.userId) || Number(u.user_id) === Number(item.userId)
                );
                return [
                  index + 1,
                  user?.name || "-",
                  user?.user_id || user?.id || item.userId || "-",
                  item.cardId,
                  Number(item.amount).toLocaleString(),
                ];
              }}
            />

            {/* Daily Installment Complete Monthly */}
            <ReportTable
              title="Today's Daily Card Installment Collection Report"
              columns={["#", "Customer", "Customer Id", "Card No", "Installment", "Amount"]}
              data={dailyMonthlyInstallments}
              total={totalDailyMonthlyInstallmentCollection}
              totalColSpan={5}
              renderRow={(item, index) => {
                const card = customerInstallmentCards?.find(
                  (c) => Number(c.card_id) === Number(item.card_id)
                );
                const user = users?.find((u) => Number(u.user_id) === Number(card?.user_id));
                return [
                  index + 1,
                  user?.name || "-",
                  user?.user_id || card?.user_id || "-",
                  card?.card_id || item.card_id || "-",
                  item?.tag || "-",
                  Number(item.due_amount).toLocaleString(),
                ];
              }}
            />

            {/* Monthly Installment Report */}
            <ReportTable
              title="Today's Monthly Installment Collection Report"
              columns={["#", "Customer", "Customer Id", "Card No", "Installment", "Method", "Amount"]}
              data={monthlyInstallments}
              total={totalInstallmentCollection}
              totalColSpan={6}
              renderRow={(item, index) => {
                const card = customerInstallmentCards?.find(
                  (c) => Number(c.card_id) === Number(item.card_id)
                );
                const user = users?.find((u) => Number(u.user_id) === Number(card?.user_id));
                return [
                  index + 1,
                  user?.name || "-",
                  user?.user_id || card?.user_id || "-",
                  card?.card_id || item.card_id || "-",
                  item?.tag || "-",
                  item?.payment_method || "-",
                  Number(item.due_amount).toLocaleString(),
                ];
              }}
            />

            {/* Loan Taken Report */}
            <ReportTable
              title="Today's Loan Taken Report (ঋণ গ্রহণ)"
              columns={["#", "Date", "Source / কার থেকে নেওয়া", "Ref ID", "Remarks / বিবরণ", "Amount"]}
              data={todayLoansTaken}
              total={totalLoanTaken}
              totalColSpan={5}
              renderRow={(item, index) => [
                index + 1,
                item?.date || "-",
                item?.source || "-",
                item?.refId || "-",
                item?.remarks || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Loan Return Received Report */}
            <ReportTable
              title="Today's Loan Return Report (ঋণ ফেরত আদায়)"
              columns={["#", "Date", "Source / কে ফেরত দিয়েছে", "Ref ID", "Remarks / বিবরণ", "Amount"]}
              data={todayLoanReturns}
              total={totalLoanReturn}
              totalColSpan={5}
              renderRow={(item, index) => [
                index + 1,
                item?.date || "-",
                item?.source || "-",
                item?.refId || "-",
                item?.remarks || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Other Cash In */}
            <ReportTable
              title="Today's Other Cash In Report (অন্যান্য ক্যাশ ইন)"
              columns={["#", "Date", "Source / উৎস", "Category", "Remarks / বিবরণ", "Amount"]}
              data={todayOtherCashIn}
              total={totalOtherCashIn}
              totalColSpan={5}
              renderRow={(item, index) => [
                index + 1,
                item?.date || "-",
                item?.source || "-",
                item?.category || "-",
                item?.remarks || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Company Expenses */}
            <ReportTable
              title="Today's Expenses Report (কোম্পানি ও অফিস খরচ)"
              columns={["#", "Date", "Purpose", "Remarks", "Amount"]}
              data={todayExpenses}
              total={totalExpense}
              totalColSpan={4}
              renderRow={(item, index) => [
                index + 1,
                item?.date || "-",
                item?.purpose || "-",
                item?.remarks || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Product Purchase */}
            <ReportTable
              title="Today's Product Purchase Report (পণ্য ক্রয় / ডেলিভারি)"
              columns={["#", "Date", "Product Name", "Amount"]}
              data={todayProductPurchase}
              total={totalProductPurchase}
              totalColSpan={3}
              renderRow={(item, index) => [
                index + 1,
                item?.delivery_date || "-",
                item?.product_name || "-",
                Number(item.cost_price).toLocaleString(),
              ]}
            />

            {/* Loan Given */}
            <ReportTable
              title="Today's Loan Given Report (ঋণ প্রদান)"
              columns={["#", "Date", "Recipient / কাকে দেওয়া হয়েছে", "Remarks / বিবরণ", "Amount"]}
              data={todayLoansGiven}
              total={totalLoanGiven}
              totalColSpan={4}
              renderRow={(item, index) => [
                index + 1,
                item?.date || "-",
                item?.purpose || item?.source || "-",
                item?.remarks || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Loan Repayments */}
            <ReportTable
              title="Today's Loan Repayment Report (ঋণ পরিশোধ)"
              columns={["#", "Date", "Paid To / কার ঋণ ক্লিয়ার করা হয়েছে", "Remarks / বিবরণ", "Amount"]}
              data={todayLoanRepayments}
              total={totalLoanRepaid}
              totalColSpan={4}
              renderRow={(item, index) => [
                index + 1,
                item?.date || "-",
                item?.purpose || item?.source || "-",
                item?.remarks || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Investor Amount Withdraw */}
            <ReportTable
              title="Today's Investor Amount Withdraw Report"
              columns={["#", "Name", "User Id", "Card Id", "Request Date", "Approved Date", "Reason", "Amount"]}
              data={todayCompleteInvestorReturnAmount}
              total={totalInvestorWithdraw}
              totalColSpan={7}
              renderRow={(item, index) => [
                index + 1,
                item?.investor_name || "-",
                item?.investor_id || "-",
                item?.card_id || "-",
                item?.requested_at?.split(" ")[0] || "-",
                item?.reviewed_at?.split(" ")[0] || "-",
                item.reason || "-",
                Number(item.amount).toLocaleString(),
              ]}
            />

            {/* Profit Withdrawals */}
            {todayProfitWithdrawals.length > 0 && (
              <ReportTable
                title="Today's Profit Withdraw Report (লভ্যাংশ উত্তোলন)"
                columns={["#", "Date", "Purpose", "Source", "Remarks", "Amount"]}
                data={todayProfitWithdrawals}
                total={totalProfitWithdraw}
                totalColSpan={5}
                renderRow={(item, index) => [
                  index + 1,
                  item?.date || "-",
                  item?.purpose || "-",
                  item?.source || "-",
                  item?.remarks || "-",
                  Number(item.amount).toLocaleString(),
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* 🔹 প্রিন্ট স্টাইল */}
      <style>{`
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
