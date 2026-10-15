import React, { useEffect, useState, useMemo } from "react";
import useUsers from "../../../utils/Hooks/useUsers";

const DailyInstallmentsReports = () => {
  const { users } = useUsers();

  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // 🔥 FETCH DATA
  useEffect(() => {
    fetch(
      "https://app.supplylinkbd.com/apis/DailyInstallments/getDailyInstallments.php",
    )
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
      });
  }, []);

  // 🔥 FILTER BY DATE
  const filteredData = useMemo(() => {
    return data.filter((item) => item.date === selectedDate);
  }, [data, selectedDate]);

  // 🔥 MERGE USER + CARD
  const reportData = useMemo(() => {
    return filteredData.map((item) => {
      const user = users.find((u) => u.id == item.userId);
    const receiverUser = users.find((u) => u.id == item.receiver);
      return {
        ...item,
        userName: user?.name || "Unknown",
        receiverName: receiverUser?.name || item.receiver, 
      };
    });
  }, [filteredData, users]);
const cleanName = (name) => {
  return name
    ?.replace(/^মোঃ?\s*/g, "") // "মোঃ " বা "মো " remove
    .trim();
};
  // 🔥 TOTAL
  const total = useMemo(() => {
    return reportData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [reportData]);

  return (
    <div className="p-6 bg-[#020617] min-h-screen text-white">
      {/* 🔥 HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
            📢 দৈনিক কিস্তি সংগ্রহ রিপোর্ট
          </h1>
          <p className="text-gray-400 text-sm">
            প্রদর্শিত তারিখ: {selectedDate}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#0f172a] border border-gray-700 px-3 py-2 rounded-lg text-sm date-fix"
          />

          <button
            onClick={() =>
              setSelectedDate(new Date().toISOString().slice(0, 10))
            }
            className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm"
          >
            আজ
          </button>

          <button
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm"
          >
            🖨 প্রিন্ট
          </button>
        </div>
      </div>

      {/* 🔥 TABLE */}
      <div className="overflow-x-auto border border-gray-800 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0f172a] text-gray-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">গ্রাহকের নাম (আইডি)</th>
              <th className="px-4 py-3">কার্ড আইডি</th> {/* NEW */}
              <th className="px-4 py-3">টাকা (৳)</th>
              <th className="px-4 py-3">সংগ্রাহক</th>
            </tr>
          </thead>

          <tbody>
            {reportData.map((item, index) => (
              <tr
                key={item.id}
                className="border-t border-gray-800 hover:bg-[#0f172a]"
              >
                <td className="px-4 py-3 text-gray-400">{index + 1}</td>

                <td className="px-4 py-3">
                  {item.userName} ({item.userId})
                </td>
                <td className="px-4 py-3 text-yellow-400 font-medium">
                  {item.cardId} {/* NEW */}
                </td>
               

                <td className="px-4 py-3 text-indigo-400 font-semibold">
                  ৳{Number(item.amount).toLocaleString()}
                </td>

               <td className="px-4 py-3 text-gray-300">
  {item.receiverName
    ? cleanName(item.receiverName)
    : item.receiver}
</td>
              </tr>
            ))}
          </tbody>

          {/* 🔥 FOOTER */}
          <tfoot>
            <tr className="border-t border-gray-700 bg-[#020617]">
              <td colSpan="4" className="px-4 py-3 text-center font-semibold">
                মোট
              </td>

              <td className="px-4 py-3 text-green-400 font-bold">
                ৳{total.toLocaleString()}
              </td>

              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {reportData.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No data found 😔</p>
      )}
    </div>
  );
};

export default DailyInstallmentsReports;
