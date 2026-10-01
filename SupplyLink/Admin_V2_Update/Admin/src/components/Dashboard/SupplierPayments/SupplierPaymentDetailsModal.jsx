import React, { useState } from "react";
import {
  FaTimes,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaStore,
  FaBuilding,
  FaTag,
  FaMoneyBillWave,
  FaComments,
  FaCheckCircle,
  FaTimesCircle,
  FaSearchPlus,
} from "react-icons/fa";

const SupplierPaymentDetailsModal = ({ selectedItem, setIsDetailsOpen }) => {
  const [zoomImage, setZoomImage] = useState(false);

  if (!selectedItem) return null;

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

  const imgUrl = getImageUrl(selectedItem?.image);
  const total = parseFloat(selectedItem?.total_amount || 0);
  const paid = parseFloat(selectedItem?.paid || 0);
  const due = parseFloat(selectedItem?.due || 0);
  const isFullyPaid = due <= 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={() => setIsDetailsOpen(false)}></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-4xl border border-slate-700/80 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
              <FaFileInvoiceDollar className="text-xl" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  সাপ্লায়ার পেমেন্ট বিবরণ (Payment Details)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  Memo: {selectedItem?.memo_no}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedItem?.shop_name || "সাপ্লায়ার ভাউচার ও পেমেন্ট রসিদ"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDetailsOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Body Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Image / Voucher */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 group shadow-xl">
              {imgUrl ? (
                <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                  <img
                    src={imgUrl}
                    alt="Memo Receipt"
                    className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setZoomImage(true)}
                  />
                  <div
                    onClick={() => setZoomImage(true)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white text-xs cursor-pointer transition"
                  >
                    <FaSearchPlus className="text-xl text-cyan-400" />
                    <span>ক্লিক করে বড় ছবি দেখুন</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-900/50 rounded-xl">
                  <FaFileInvoiceDollar className="text-4xl text-slate-600" />
                  <span className="text-xs">কোনো রসিদের ছবি সংযুক্ত নেই</span>
                </div>
              )}
            </div>

            {/* Status Pill below image */}
            <div className="w-full mt-3">
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isFullyPaid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isFullyPaid ? (
                    <FaCheckCircle className="text-base text-emerald-400" />
                  ) : (
                    <FaTimesCircle className="text-base text-rose-400" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isFullyPaid ? "পরিশোধ সম্পন্ন (Fully Paid)" : "বকেয়া বিদ্যমান (Due Pending)"}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold">
                  {isFullyPaid ? "Cleared" : `৳ ${due.toLocaleString()} Due`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown & Details */}
          <div className="md:col-span-7 space-y-4">
            {/* KPI Amount Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">মোট টাকা</span>
                <p className="text-sm sm:text-base font-black font-mono text-amber-400 mt-0.5">
                  ৳ {total.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 block">পরিশোধিত</span>
                <p className="text-sm sm:text-base font-black font-mono text-emerald-400 mt-0.5">
                  ৳ {paid.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/90 block">বকেয়া</span>
                <p className="text-sm sm:text-base font-black font-mono text-rose-400 mt-0.5">
                  ৳ {due.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FaTag className="text-cyan-400 text-[11px]" />
                  মেমো নম্বর (Memo):
                </span>
                <span className="font-bold text-white font-mono">{selectedItem?.memo_no || "-"}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-blue-400 text-[11px]" />
                  তারিখ (Date):
                </span>
                <span className="font-bold text-slate-200 font-mono">{selectedItem?.date || "-"}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FaStore className="text-purple-400 text-[11px]" />
                  শপ / টেলিকম:
                </span>
                <span className="font-bold text-slate-200">{selectedItem?.shop_name || "-"}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FaBuilding className="text-teal-400 text-[11px]" />
                  সাপ্লায়ার:
                </span>
                <span className="font-bold text-slate-200">{selectedItem?.supplier || "-"}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FaTag className="text-indigo-400 text-[11px]" />
                  ব্র্যান্ড (Brand):
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                  {selectedItem?.brand || "-"}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                  <FaComments className="text-slate-400 text-[11px]" />
                  মন্তব্য / নোট:
                </span>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed text-xs">
                  {selectedItem?.remarks || "কোনো বিশেষ মন্তব্য সংযুক্ত নেই।"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-5 mt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsDetailsOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImage && imgUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
          onClick={() => setZoomImage(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(false)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 text-xl font-bold p-2"
            >
              ✕
            </button>
            <img
              src={imgUrl}
              alt="Memo Voucher Full View"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPaymentDetailsModal;