import React, { useEffect, useState } from "react";
import CashCard from "./CashCard";
import {
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaMoneyBillWave,
} from "react-icons/fa6";
import { AiOutlineCreditCard } from "react-icons/ai";
import useCashMonthlyReports from "../../utils/Hooks/cash/useCashMontlyReports";

const MonthlyReport = () => {
  const [month, setMonth] = useState("");

  const { CashMonthlyReports, refetch } = useCashMonthlyReports(month);
  // default current month
  useEffect(() => {
    const now = new Date();
    const m = now.toISOString().slice(0, 7);
    setMonth(m);
  }, []);

  const report = CashMonthlyReports || {};
console.log(report)
  return (
    <div className="min-h-screen bg-[#0b1120] p-6 text-white">
      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-[#111827] border border-white/10 px-4 py-2 rounded-xl date-fix"
        />

        <button onClick={refetch} className="bg-blue-600 px-4 py-2 rounded-xl">
          Load
        </button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {" "}
        <CashCard
          title="মোট জমা"
          value={`৳ ${report.totalIn || 0}`}
          icon={FaMoneyBillWave}
          accent="text-green-400"
        />
        <CashCard
          title="মোট খরচ"
          value={`৳ ${report.totalOut || 0}`}
          icon={AiOutlineCreditCard}
          accent="text-red-400"
        />
        <CashCard
          title="নেট ব্যালেন্স"
          subtitle="এই মাস"
          value={`৳ ${report.net || 0}`}
          icon={FaChartLine}
          accent="text-blue-400"
        />
        <CashCard
          title="পূর্বের ব্যালেন্স"
          subtitle="carry"
          value={`৳ ${report.finalBalance || 0}`}
          icon={FaChartLine}
          accent="text-yellow-400"
        />
      </div>
      {/* Cash In Table */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-green-400 mb-2">
          <FaArrowDown /> ক্যাশ ইন লিস্ট
        </h3>

        <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-[#111827] text-gray-300">
              <tr>
                <th className="p-3 text-left">Serial</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Ref ID</th>
                <th className="p-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {report.cashInList?.length > 0 ? (
                report.cashInList
                  ?.slice()
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((item, index) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{item.date}</td>
                      <td className="p-3">{item.source}</td>
                      <td className="p-3">৳ {item.amount}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{item.ref_id}</td>
                      <td className="p-3">{item.remarks}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    কোনো ক্যাশ ইন ডাটা নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Out Table */}
      <div>
        <h3 className="flex items-center gap-2 text-red-400 mb-2">
          <FaArrowUp /> ক্যাশ আউট লিস্ট
        </h3>

        <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-[#111827] text-gray-300">
              <tr>
                <th className="p-3 text-left">Serial</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Purpose</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {/* {report.cashOutList?.length > 0 ? (
                report.cashOutList.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="p-3">{item.purpose}</td>
                    <td className="p-3">৳ {item.amount}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.remarks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    কোনো ক্যাশ আউট ডাটা নেই
                  </td>
                </tr>
              )} */}
              {report.cashOutList?.length > 0 ? (
                report.cashOutList
                  ?.slice()
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((item, index) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{item.date}</td>
                      <td className="p-3">{item.purpose}</td>
                      <td className="p-3">৳ {item.amount}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{item.remarks}</td>
                      <td className="p-3">{item.remarks}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    কোনো ক্যাশ ইন ডাটা নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
