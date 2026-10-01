import React from "react";
import {
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaHistory,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaTag,
  FaStore,
} from "react-icons/fa";

const SupplierPaymentsTable = ({
  filteredPayments,
  handleDelete,
  handleEdit,
  setSelectedItem,
  setIsDetailsOpen,
  setHistoryModalItem,
  setPreviewImageModal,
  setIsOpen,
}) => {
  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (
      imgPath.startsWith("http://") ||
      imgPath.startsWith("https://") ||
      imgPath.startsWith("blob:") ||
      imgPath.startsWith("data:")
    ) {
      return imgPath;
    }
    const cleanPath = imgPath.replace(/^\/+/, "");
    const baseApi = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";
    const serverHost = baseApi.replace(/\/apis\/?.*$/, "");
    return `${serverHost}/${cleanPath}`;
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="px-5 py-4">ছবি / রসিদ</th>
              <th className="px-5 py-4">মেমো ও তারিখ</th>
              <th className="px-5 py-4">শপ / প্রতিষ্ঠান</th>
              <th className="px-5 py-4">সাপ্লায়ার ও ব্র্যান্ড</th>
              <th className="px-5 py-4 text-right">মোট টাকা (৳)</th>
              <th className="px-5 py-4 text-right">পরিশোধিত (৳)</th>
              <th className="px-5 py-4 text-right">বকেয়া (৳)</th>
              <th className="px-5 py-4 text-center">স্ট্যাটাস</th>
              <th className="px-5 py-4 text-center">অ্যাকশন</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {filteredPayments?.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-slate-500">
                      <FaFileInvoiceDollar className="text-4xl text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-300">
                      কোনো সাপ্লায়ার পেমেন্ট ডাটা পাওয়া যায়নি
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      ফিল্টার অপশন পরিবর্তন করুন অথবা নতুন পেমেন্ট রেকর্ড যুক্ত করতে নিচের বাটনে ক্লিক করুন।
                    </p>
                    <button
                      onClick={() => setIsOpen(true)}
                      className="mt-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition"
                    >
                      + নতুন পেমেন্ট যোগ করুন
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPayments?.map((item, index) => {
                const imgUrl = getImageUrl(item?.image);
                const total = parseFloat(item?.total_amount || 0);
                const paid = parseFloat(item?.paid || 0);
                const due = parseFloat(item?.due || 0);
                const isPaid = due <= 0 && total > 0;
                const isPartial = due > 0 && paid > 0;

                return (
                  <tr
                    key={item?.id || index}
                    className="hover:bg-slate-800/40 transition duration-150 group"
                  >
                    {/* Memo Voucher Thumbnail */}
                    <td className="px-5 py-3.5">
                      {imgUrl ? (
                        <div
                          onClick={() => setPreviewImageModal(imgUrl)}
                          className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 cursor-pointer group-hover:border-cyan-500/50 transition shadow-sm"
                        >
                          <img
                            src={imgUrl}
                            alt="Memo"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.classList.add(
                                "flex",
                                "items-center",
                                "justify-center"
                              );
                              e.target.parentElement.innerHTML =
                                '<span class="text-slate-500 text-xs">🧾</span>';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-[10px]">
                            <FaEye />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                          <FaFileInvoiceDollar className="text-lg text-slate-400" />
                        </div>
                      )}
                    </td>

                    {/* Memo & Date */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
                          <FaTag className="text-cyan-400 text-[10px]" />
                          {item?.memo_no || "N/A"}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {item?.date || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Shop Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <FaStore className="text-purple-400 text-[11px] shrink-0" />
                        <span className="text-slate-200 font-medium text-xs truncate max-w-[160px]">
                          {item?.shop_name || "Official / Counter"}
                        </span>
                      </div>
                    </td>

                    {/* Supplier & Brand */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-200 text-xs">
                          {item?.supplier || "N/A"}
                        </span>
                        {item?.brand && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 w-fit">
                            {item.brand}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-400 text-xs">
                      ৳ {total.toLocaleString()}
                    </td>

                    {/* Paid Amount */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400 text-xs">
                      ৳ {paid.toLocaleString()}
                    </td>

                    {/* Due Amount */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-400 text-xs">
                      ৳ {due.toLocaleString()}
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isPartial
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPaid
                              ? "bg-emerald-400"
                              : isPartial
                              ? "bg-amber-400 animate-pulse"
                              : "bg-rose-400 animate-pulse"
                          }`}
                        ></span>
                        {isPaid ? "Paid" : isPartial ? "Partial" : "Due"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details */}
                        <button
                          title="বিস্তারিত বিবরণ দেখুন"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailsOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 transition"
                        >
                          <FaEye className="text-xs" />
                        </button>

                        {/* Audit History */}
                        <button
                          onClick={() => setHistoryModalItem(item)}
                          title={`${item?.edit_count || 0} বার এডিট করা হয়েছে (View Edit History)`}
                          className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 text-indigo-400 hover:text-cyan-300 transition"
                        >
                          <FaHistory className="text-xs" />
                          {(item?.edit_count || 0) > 0 ? (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-mono font-black flex items-center justify-center shadow-lg shadow-indigo-500/50 border border-slate-900">
                              {item.edit_count}
                            </span>
                          ) : (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-slate-700 text-slate-300 text-[8px] font-mono font-semibold flex items-center justify-center border border-slate-900">
                              0
                            </span>
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          title="পেমেন্ট এডিট করুন"
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700/80 text-blue-400 hover:text-cyan-300 transition"
                        >
                          <FaEdit className="text-xs" />
                        </button>

                        {/* Delete */}
                        <button
                          title="পেমেন্ট মুছে ফেলুন"
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600/30 border border-slate-700/80 text-rose-400 hover:text-rose-300 transition"
                        >
                          <FaTrashAlt className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierPaymentsTable;
