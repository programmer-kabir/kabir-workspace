import React, { useEffect, useState } from "react";
import { FaSearch, FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa";
import CashCard from "./CashCard";
import { FaChartLine, FaMoneyBillWave } from "react-icons/fa6";
import { AiOutlineCreditCard } from "react-icons/ai";
import useCashDailyReports from "../../utils/Hooks/cash/useCashDailyReports";
import { FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const DailyReport = () => {
  const [date, setDate] = useState("");
  const [editData, setEditData] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const { DailyCashReports, refetch } = useCashDailyReports(date);
  // ✅ default today date set
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // ✅ date change হলে auto fetch
  useEffect(() => {
    if (date) {
      refetch();
    }
  }, [date]);

  const data = DailyCashReports || {};
  const handleEdit = (row) => {
    setEditData(row);
    setOpenEditModal(true);
  };
  const handleUpdate = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_LOCALHOST_KEY}/cash/update_cash.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      },
    );

    const data = await res.json();

    if (data.success) {
      toast.success("Updated!");
      setOpenEditModal(false);
      refetch();
    } else {
      alert(data.message);
    }
  };
const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/cash/delete_cash.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("Delete Success");
      refetch();
    } else {
      toast.error(data.message);
    }
  } catch (err) {
    toast.error("Failed")
  }
};
  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-200 p-6">
      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-[#111827] border border-white/10 text-white px-4 py-2 rounded-xl outline-none date-fix"
        />

        <button
          onClick={refetch}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl"
        >
          <FaSearch /> খুঁজুন
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4 mb-6 grid grid-cols-3 gap-5 justify-between">
        <CashCard
          title="মোট আয়"
          subtitle="আজকের সারাংশ"
          value={`৳ ${data.totalIn || 0}`}
          icon={FaMoneyBillWave}
          accent="text-green-400"
        />

        <CashCard
          title="মোট খরচ"
          subtitle="আজকের সারাংশ"
          value={`৳ ${data.totalOut || 0}`}
          icon={AiOutlineCreditCard}
          accent="text-red-400"
        />

        <CashCard
          title="নেট ব্যালেন্স"
          subtitle="আজকের সারাংশ"
          value={`৳ ${data.net || 0}`}
          icon={FaChartLine}
          accent="text-blue-400"
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
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Ref ID</th>
                <th className="p-3 text-left">Remarks</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.cashInList?.length > 0 ? (
                data.cashInList.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="p-3">{item.source}</td>
                    <td className="p-3">৳ {item.amount}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.ref_id}</td>
                    <td className="p-3">{item.remarks}</td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="border border-gray-300 p-1 rounded cursor-pointer"
                      >
                        <FaEdit />{" "}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="border border-gray-300 p-1 rounded cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </td>
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
                <th className="p-3 text-left">Purpose</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Remarks</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.cashOutList?.length > 0 ? (
                data.cashOutList.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="p-3">{item.purpose}</td>
                    <td className="p-3">৳ {item.amount}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.remarks}</td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="border border-gray-300 p-1 rounded cursor-pointer"
                      >
                        <FaEdit />{" "}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="border border-gray-300 p-1 rounded cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    কোনো ক্যাশ আউট ডাটা নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
              এডিট করুন ({editData?.type === "in" ? "ক্যাশ ইন" : "ক্যাশ আউট"})
            </h2>

            <div className="space-y-3">
              {/* common fields */}
              <div>
                <label className="text-sm text-gray-400">Amount</label>
                <input
                  className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500"
                  value={editData.amount || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, amount: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">Date</label>
                <input
                  type="date"
                  className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500 date-fix"
                  value={editData.date || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, date: e.target.value })
                  }
                />
              </div>

              {/* <div>
          <label className="text-sm text-gray-400">Category</label>
          <input
            className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500"
            value={editData.category || ""}
            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
          />
        </div> */}

              {/* type ভিত্তিক field */}
              {editData?.type === "in" && (
                <>
                  <div>
                    <label className="text-sm text-gray-400">Source</label>
                    <input
                      className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500"
                      value={editData.source || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, source: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Ref ID</label>
                    <input
                      className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500"
                      value={editData.ref_id || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, ref_id: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Category</label>
                    <select
                      className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500 text-gray-200"
                      value={editData.category || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, category: e.target.value })
                      }
                    >
                      <option className="bg-[#0F172A]" value="invest">
                        বিনিয়োগ
                      </option>
                      <option className="bg-[#0F172A]" value="installment">
                        কিস্তি
                      </option>
                      <option className="bg-[#0F172A]" value="downpayment">
                        ডাউন পেমেন্ট
                      </option>
                      <option className="bg-[#0F172A]" value="others">
                        অন্যান্য
                      </option>
                    </select>
                  </div>
                </>
              )}

              {editData?.type === "out" && (
                <div>
                  {/* Category Section */}
                  <div>
                    <label className="text-sm text-gray-400">Category</label>
                    <select
                      className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500 text-gray-200"
                      value={editData.category || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, category: e.target.value })
                      }
                    >
                      <option className="bg-[#0F172A]" value="salary">
                        বেতন
                      </option>
                      <option className="bg-[#0F172A]" value="purchase">
                        কেনাকাটা
                      </option>
                      <option className="bg-[#0F172A]" value="rent">
                        ভাড়া
                      </option>
                      <option className="bg-[#0F172A]" value="bill">
                        বিল (বিদ্যুৎ/ইন্টারনেট)
                      </option>
                      <option className="bg-[#0F172A]" value="office-expense">
                        অফিস খরচ
                      </option>
                      <option className="bg-[#0F172A]" value="others">
                        অন্যান্য
                      </option>
                    </select>
                  </div>
                  <label className="text-sm text-gray-400">Purpose</label>
                  <input
                    className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500"
                    value={editData.purpose || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, purpose: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400">Remarks</label>
                <input
                  className="w-full bg-[#0f172a] border border-white/10 p-2 rounded-lg outline-none focus:border-blue-500"
                  value={editData.remarks || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, remarks: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setOpenEditModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-xl transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-xl transition text-white"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
