import React from "react";
import {
  FaStore,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaUserTie,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaMoneyBillWave,
  FaHistory,
  FaChevronRight,
  FaFileInvoiceDollar,
  FaCheckCircle,
} from "react-icons/fa";

const ShopCardsList = ({
  shops = [],
  onCreditPurchase,
  onPayDue,
  onViewLedger,
  onEditShop,
  onDeleteShop,
  onAddNewShop,
}) => {
  if (!shops || shops.length === 0) {
    return (
      <div className="py-16 text-center rounded-3xl bg-slate-900/80 border border-slate-800 p-8">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
          <FaStore className="text-3xl text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          কোনো দোকান বা সাপ্লায়ার পাওয়া যায়নি
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          নতুন দোকানদার বা সাপ্লায়ার প্রোফাইল যুক্ত করুন যাতে তাদের সাথে বাকিতে পণ্য ক্রয় ও বকেয়া খতিয়ান ট্র্যাক করা যায়।
        </p>
        <button
          onClick={onAddNewShop}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition"
        >
          + নতুন দোকানদার / সাপ্লায়ার যুক্ত করুন
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {shops.map((shop) => {
        const due = parseFloat(shop.current_due || 0);
        const bought = parseFloat(shop.total_bought || 0);
        const paid = parseFloat(shop.total_paid || 0);

        return (
          <div
            key={shop.id}
            className="relative rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0B132B]/95 to-slate-950/95 border border-slate-800/90 p-5 shadow-2xl hover:border-slate-700 transition duration-200 flex flex-col justify-between group"
          >
            {/* Top Bar: Icon, Shop Name, Category & Action Icons */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                    <FaStore className="text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-white truncate group-hover:text-amber-300 transition">
                      {shop.shop_name}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400 block truncate">
                      {shop.category || "General Supplier"}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Top Icons */}
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <button
                    onClick={() => onEditShop(shop)}
                    title="দোকানের তথ্য এডিট করুন"
                    className="p-2 rounded-xl hover:bg-slate-800 hover:text-cyan-300 transition text-xs"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => onDeleteShop(shop.id, shop.shop_name)}
                    title="দোকান মুছে ফেলুন"
                    className="p-2 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition text-xs"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>

              {/* Owner, Phone & Location details */}
              <div className="space-y-1 text-xs text-slate-400 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Owner:</span>
                  <span className="text-slate-200 font-bold">{shop.owner_name || "-"}</span>
                </div>
                {shop.phone && shop.phone !== "-" && (
                  <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                    <FaPhoneAlt className="text-[10px] text-slate-500 shrink-0" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.address && shop.address !== "-" && (
                  <div className="flex items-start gap-2 text-slate-400 text-[11px]">
                    <FaMapMarkerAlt className="text-[10px] text-slate-500 shrink-0 mt-0.5" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                )}
              </div>

              {/* Balance Summary Box (Matches Screenshot) */}
              <div className="my-4 p-3.5 rounded-2xl bg-[#060B18] border border-slate-800/90 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    CURRENT DUE
                  </span>
                  <div className="text-xl font-black font-mono text-rose-400 mt-0.5">
                    ৳ {due.toLocaleString()}
                  </div>
                </div>

                <div className="text-right text-xs space-y-0.5">
                  <div className="flex items-center justify-end gap-1.5 text-slate-400">
                    <span>Bought:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      ৳ {bought.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-medium">
                    <span>Paid:</span>
                    <span className="font-bold font-mono">
                      ৳ {paid.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: + Credit Purchase, Pay Due, and View Shop Ledger */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {/* + Credit Purchase */}
                <button
                  onClick={() => onCreditPurchase(shop)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <FaPlus className="text-[10px]" />
                  <span>+ Credit Purchase</span>
                </button>

                {/* Pay Due */}
                <button
                  onClick={() => onPayDue(shop)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <FaMoneyBillWave className="text-xs" />
                  <span>Pay Due</span>
                </button>
              </div>

              {/* View Shop Ledger / History */}
              <button
                onClick={() => onViewLedger(shop)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2 group/btn"
              >
                <FaFileInvoiceDollar className="text-xs text-amber-400" />
                <span>View Shop Ledger / History</span>
                <FaChevronRight className="text-[10px] group-hover/btn:translate-x-1 transition" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShopCardsList;
