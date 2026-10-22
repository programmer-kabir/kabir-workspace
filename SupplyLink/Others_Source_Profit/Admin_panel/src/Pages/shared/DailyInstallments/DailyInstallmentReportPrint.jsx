import React, { useEffect, useMemo, useState } from "react";
import BackButton from "../../../components/BackButton/BackButton";
import {
  FiCalendar,
  FiPrinter,
  FiUser,
  FiDollarSign,
  FiTrendingUp,
  FiCreditCard,
  FiRefreshCw
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

const DailyInstallmentReportPrint = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    setLoading(true);
    fetch(
      `${
        import.meta.env.VITE_LOCALHOST_KEY ||
        "https://api.supplylinkbd.com/apis"
      }/DailyInstallments/getDailyInstallments.php`
    )
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = useMemo(() => {
    const filtered = data.filter((item) =>
      item.date?.startsWith(selectedMonth)
    );

    const grouped = {};

    filtered.forEach((item) => {
      const date = item.date;

      if (!grouped[date]) {
        grouped[date] = {
          date,
          totalAmount: 0,
          customers: new Set(),
        };
      }

      grouped[date].totalAmount += Number(item.amount || 0);
      grouped[date].customers.add(item.userId);
    });

    let runningTotal = 0;

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((row, index) => {
        runningTotal += row.totalAmount;

        return {
          serial: index + 1,
          date: row.date,
          customerCount: row.customers.size,
          dailyCollection: row.totalAmount,
          runningTotal,
        };
      });
  }, [data, selectedMonth]);

  const totalCollection = useMemo(() => {
    return monthlyData.reduce(
      (sum, item) => sum + item.dailyCollection,
      0
    );
  }, [monthlyData]);

  const totalCustomers = useMemo(() => {
    const allCustomers = new Set();
    data
      .filter((item) => item.date?.startsWith(selectedMonth))
      .forEach((item) => {
        allCustomers.add(item.userId);
      });
    return allCustomers.size;
  }, [data, selectedMonth]);

  const avgDaily = monthlyData.length > 0
    ? Math.round(totalCollection / monthlyData.length)
    : 0;

  return (
    <>
      <div id="print-area">
        <div className="report-container bg-[#020617] text-white p-4 min-h-screen">
          {/* PRINT-ONLY HEADER */}
          <div className="print-header hidden text-center border-b pb-4 mb-4">
            <h1 className="text-xl font-bold text-black uppercase tracking-wider">
              SupplyLink Enterprise
            </h1>
            <h2 className="text-base font-semibold text-gray-800 mt-1">
              মাসিক কিস্তি সংগ্রহ বিবরণী
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">মাস: {selectedMonth}</p>
          </div>

          {/* SCREEN HEADER */}
          <div className="no-print space-y-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <BackButton />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    মাসিক কিস্তি সংগ্রহ বিবরণী
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                      {selectedMonth}
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    প্রতিদিনের মোট আদায়, সক্রিয় গ্রাহক এবং ক্রমবর্ধমান ব্যালেন্স পর্যবেক্ষণ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#090f20] border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPrinter className="text-xs" />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
            </div>

            {/* SCREEN KPI TILES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
                <p className="text-slate-400 text-xs flex items-center justify-between">
                  <span>মাসের মোট আদায়</span>
                  <FaMoneyBillWave className="text-emerald-400" />
                </p>
                <h2 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  ৳{totalCollection.toLocaleString("en-IN")}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">ক্যাশ ইনভুক্ত মোট অর্থ</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
                <p className="text-slate-400 text-xs flex items-center justify-between">
                  <span>আদায়কৃত দিন</span>
                  <FiCalendar className="text-cyan-400" />
                </p>
                <h2 className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                  {monthlyData.length} দিন
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">সক্রিয় আদায়ের দিন</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
                <p className="text-slate-400 text-xs flex items-center justify-between">
                  <span>মোট স্বতন্ত্র গ্রাহক</span>
                  <FiUser className="text-indigo-400" />
                </p>
                <h2 className="text-2xl font-bold font-mono text-indigo-300 mt-1">
                  {totalCustomers} জন
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">মাসে কিস্তি প্রদানকারী</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
                <p className="text-slate-400 text-xs flex items-center justify-between">
                  <span>দৈনিক গড় আদায়</span>
                  <FiTrendingUp className="text-amber-400" />
                </p>
                <h2 className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  ৳{avgDaily.toLocaleString("en-IN")}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">প্রতিদিনের গড় সংগ্রহ</p>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070b16] shadow-2xl print:border-black print:bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#0a1020] text-slate-400 font-semibold text-[11px] print:bg-gray-100 print:text-black print:border-black">
                    <th className="py-3.5 px-4 min-w-[50px]">ক্রমিক</th>
                    <th className="py-3.5 px-4 min-w-[120px]">আদায়ের তারিখ</th>
                    <th className="py-3.5 px-4 min-w-[130px] text-center">গ্রাহক সংখ্যা</th>
                    <th className="py-3.5 px-4 min-w-[150px] text-right">দৈনিক সংগ্রহ (৳)</th>
                    <th className="py-3.5 px-4 min-w-[160px] text-right">ক্রমপুঞ্জিত মোট (৳)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-slate-200 print:text-black print:divide-gray-300">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FiRefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                          <span className="text-xs">মাসিক ডাটা লোড হচ্ছে...</span>
                        </div>
                      </td>
                    </tr>
                  ) : monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-slate-500">
                        এই মাসে কোনো কিস্তি আদায়ের তথ্য পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row) => (
                      <tr
                        key={row.date}
                        className="hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 print:text-black">
                          {row.serial}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-300 print:text-black">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-cyan-300 print:text-black">
                          {row.customerCount} জন
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                          ৳{row.dailyCollection.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-300 print:text-black">
                          ৳{row.runningTotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {monthlyData.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-[#0a1020] print:bg-gray-100 print:text-black print:border-black font-semibold text-xs">
                      <td colSpan="3" className="py-3 px-4 text-center text-slate-400 print:text-black font-bold">
                        সর্বমোট সংগৃহীত অর্থ
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                        ৳{totalCollection.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400 print:text-black">
                        ৳{totalCollection.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          html,
          body,
          #root,
          #print-area {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }

          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body * {
            visibility: hidden;
          }

          #print-area,
          #print-area * {
            visibility: visible;
          }

          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .no-print {
            display: none !important;
          }

          .print-header {
            display: block !important;
          }

          .report-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }

          th,
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 8px !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  );
};

export default DailyInstallmentReportPrint;