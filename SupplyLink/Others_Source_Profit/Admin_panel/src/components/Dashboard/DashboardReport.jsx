import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { MONTHS } from "../../../public/month";
import ReportTable from "../ReportTable/ReportTable";
import { FaCloudUploadAlt, FaPrint, FaSyncAlt } from "react-icons/fa";
import LuxuryToast from "../Modal/LuxuryToast";

const DashboardReport = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
    }).format(new Date());
  });

  const [reportData, setReportData] = useState({
    openingCash: 0,
    totalIn: 0,
    totalOut: 0,
    net: 0,
    closingBalance: 0,
    cashInList: [],
    cashOutList: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDriveSaving, setIsDriveSaving] = useState(false);
  const [luxuryToast, setLuxuryToast] = useState(null);

  const printRef = useRef(null);

  // Fetch Cash Data based on selected date
  const fetchDailyCashData = async (dateStr) => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/report_daily.php?date=${dateStr}`
      );
      if (res.data?.success) {
        setReportData({
          openingCash: Number(res.data.openingCash || 0),
          totalIn: Number(res.data.totalIn || 0),
          totalOut: Number(res.data.totalOut || 0),
          net: Number(res.data.net || 0),
          closingBalance: Number(res.data.closingBalance || 0),
          cashInList: res.data.cashInList || [],
          cashOutList: res.data.cashOutList || [],
        });
      }
    } catch (err) {
      console.error("Error fetching daily cash report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyCashData(selectedDate);
  }, [selectedDate]);

  const [year, month, day] = (selectedDate || "").split("-");
  const monthObj = MONTHS.find((m) => m.value === Number(month));
  const formattedDate = `${monthObj?.label || month} ${Number(day)}, ${year}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daily_Cash_Report_${selectedDate}`,
  });

  const handleSaveToServer = async () => {
    try {
      setIsDriveSaving(true);
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/save_daily_report_drive.php`
      );

      if (res.data?.success) {
        setLuxuryToast({
          title: "সার্ভারে সংরক্ষিত! 📁",
          message: `আজকের দৈনিক রিপোর্টটি সফলভাবে সার্ভারে সেভ হয়েছে (${res.data.file_path || res.data.file_name})।`,
          tag: "Server Saved",
          amount: reportData.net,
          type: "success",
        });
      } else {
        setLuxuryToast({
          title: "সংরক্ষণ ব্যর্থ! ⚠",
          message:
            res.data?.error ||
            "সার্ভারে সেভ করা যায়নি। অনুগ্রহ করে ফোল্ডার পারমিশন চেক করুন।",
          tag: "Save Error",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সংরক্ষণ ব্যর্থ! ⚠",
        message:
          err.response?.data?.error ||
          err.message ||
          "সার্ভারে ফাইল সেভ করতে সমস্যা হয়েছে।",
        tag: "Save Error",
        type: "error",
      });
    } finally {
      setIsDriveSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white text-black p-6 print:p-2 min-h-screen">
        {/* Top Header & Actions Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">তারিখ নির্বাচন:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => fetchDailyCashData(selectedDate)}
              title="রিফ্রেশ করুন"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FaSyncAlt className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveToServer}
              disabled={isDriveSaving || isLoading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isDriveSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>সার্ভারে সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-base" />
                  <span>Save Daily Report</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
            >
              <FaPrint className="text-sm" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Printable Audit Document Container */}
        <div ref={printRef} className="dashboard-report-print">
          <div className="px-8 pt-4">
            {/* Report Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                SupplyLink Operational System
              </h1>
              <p className="text-base font-semibold text-gray-600 mt-1">
                Daily Cash Ledger & Audit Report
              </p>
              <p className="text-sm text-gray-500 mt-0.5">তারিখ: {formattedDate}</p>
            </div>

            {/* Executive Cash Summary Box */}
            <div className="border-2 border-black rounded-lg p-6 mb-8 bg-gray-50/50">
              <h2 className="text-xl font-bold text-center mb-5 pb-2 border-b border-gray-300">
                {formattedDate} Cash Summary
              </h2>

              <div className="space-y-3.5 text-base">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">💰 1. Opening Cash Balance</span>
                  <span className="font-bold text-gray-900">
                    ৳ {reportData.openingCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">🟢 2. Today Approved Cash In</span>
                  <span className="font-bold text-emerald-600">
                    ৳ {reportData.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">🔴 3. Today Approved Cash Out</span>
                  <span className="font-bold text-rose-600">
                    ৳ {reportData.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 text-lg">
                  <span className="font-bold text-gray-900">💵 4. Closing Hand Cash Balance</span>
                  <span
                    className={`font-bold ${
                      reportData.closingBalance >= 0 ? "text-blue-700" : "text-rose-600"
                    }`}
                  >
                    ৳ {reportData.closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Table 1: Approved Cash In Transactions */}
            <div className="mb-10">
              <ReportTable
                title="1. Approved Cash In Transactions (আজকের মোট জমা)"
                columns={[
                  "#",
                  "Voucher",
                  "Source / Depositor",
                  "Purpose / Particulars",
                  "Category",
                  "Amount (৳)",
                ]}
                data={reportData.cashInList}
                total={reportData.totalIn}
                totalColSpan={5}
                renderRow={(item, index) => [
                  index + 1,
                  `V-${item.id}`,
                  item.source || "Cash In",
                  item.purpose || item.remarks || "-",
                  item.category || "Regular",
                  Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                ]}
              />

              {!reportData.cashInList?.length && !isLoading && (
                <div className="px-10 -mt-6 mb-8 text-center py-4 border border-gray-300 rounded-b text-gray-500 text-sm italic">
                  আজকের জন্য কোনো অনুমোদিত জমা (Cash In) পাওয়া যায়নি।
                </div>
              )}
            </div>

            {/* Table 2: Approved Cash Out Transactions */}
            <div className="mb-10">
              <ReportTable
                title="2. Approved Cash Out Transactions (আজকের মোট খরচ ও প্রদান)"
                columns={[
                  "#",
                  "Voucher",
                  "Expense Head / Source",
                  "Purpose / Particulars",
                  "Category",
                  "Amount (৳)",
                ]}
                data={reportData.cashOutList}
                total={reportData.totalOut}
                totalColSpan={5}
                renderRow={(item, index) => [
                  index + 1,
                  `V-${item.id}`,
                  item.source || "Expense",
                  item.purpose || item.remarks || "-",
                  item.category || "Expense",
                  Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                ]}
              />

              {!reportData.cashOutList?.length && !isLoading && (
                <div className="px-10 -mt-6 mb-8 text-center py-4 border border-gray-300 rounded-b text-gray-500 text-sm italic">
                  আজকের জন্য কোনো অনুমোদিত খরচ (Cash Out) পাওয়া যায়নি।
                </div>
              )}
            </div>

            {/* Signature Block for Official Print */}
            <div className="mt-16 pt-8 border-t border-gray-300 grid grid-cols-3 gap-8 text-center text-sm font-semibold text-gray-700">
              <div>
                <div className="border-t border-gray-400 w-3/4 mx-auto mb-2" />
                Prepared By
              </div>
              <div>
                <div className="border-t border-gray-400 w-3/4 mx-auto mb-2" />
                Checked By
              </div>
              <div>
                <div className="border-t border-gray-400 w-3/4 mx-auto mb-2" />
                Approved By (Manager / Director)
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-report-print {
          background: #fff;
          color: #000;
          width: 100%;
        }

        .dashboard-report-print table {
          width: 100%;
          border-collapse: collapse;
        }

        .dashboard-report-print th,
        .dashboard-report-print td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 13px;
        }

        .dashboard-report-print thead {
          background: #f3f4f6;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .dashboard-report-print {
            padding: 0 !important;
          }

          .dashboard-report-print table {
            page-break-inside: auto;
          }

          .dashboard-report-print tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {luxuryToast && (
        <LuxuryToast
          title={luxuryToast.title}
          message={luxuryToast.message}
          tag={luxuryToast.tag}
          amount={luxuryToast.amount}
          type={luxuryToast.type}
          onClose={() => setLuxuryToast(null)}
        />
      )}
    </>
  );
};

export default DashboardReport;
