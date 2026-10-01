import React from "react";
import {
  FaUser,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaIdCard,
  FaBox,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaShieldAlt,
  FaReceipt,
} from "react-icons/fa";
import useUsers from "../../utils/Hooks/useUsers";
import useCustomerGranter from "../../utils/Granters/useCustomerGranter";

const CustomerOrderInfo = ({ currentCard }) => {
  const { users = [] } = useUsers();
  const { CustomerGranter = [] } = useCustomerGranter();

  const customerUser = users?.find(
    (user) => Number(user?.user_id) === Number(currentCard?.user_id)
  );

  const runningUserGranter = CustomerGranter.find(
    (granter) =>
      Number(granter.customer_user_id) === Number(currentCard?.user_id)
  );

  const granterId = runningUserGranter?.guarantor_user_id;
  const granterUser = users.find(
    (u) => Number(u.user_id) === Number(granterId)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 👤 Customer Info Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800 p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xs">
              <FaUser />
            </div>
            <span>কার্ড মালিকের তথ্য</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
            ID #{customerUser?.user_id || customerUser?.id || currentCard?.user_id}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200 font-semibold">
            <FaUser className="text-slate-500 text-xs shrink-0" />
            <span className="truncate">{customerUser?.name || currentCard?.user_name || "N/A"}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300 font-mono">
            <FaPhoneAlt className="text-cyan-400 text-xs shrink-0" />
            <span>{customerUser?.mobile || currentCard?.user_mobile || "N/A"}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-400">
            <FaIdCard className="text-indigo-400 text-xs shrink-0" />
            <span>NID / Doc: {customerUser?.id_number || "N/A"}</span>
          </div>

          <div className="flex items-start gap-2.5 text-slate-400">
            <FaMapMarkerAlt className="text-rose-400 text-xs shrink-0 mt-0.5" />
            <span className="line-clamp-2">{customerUser?.address || "ঠিকানা দেওয়া নেই"}</span>
          </div>
        </div>
      </div>

      {/* 🛡️ Guarantor Info Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800 p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs">
              <FaShieldAlt />
            </div>
            <span>কার্ড গ্যারান্টার তথ্য</span>
          </div>
          {granterUser && (
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              ID #{granterUser.user_id || granterUser.id}
            </span>
          )}
        </div>

        {granterUser ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-200 font-semibold">
              <FaUser className="text-slate-500 text-xs shrink-0" />
              <span>{granterUser.name}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300 font-mono">
              <FaPhoneAlt className="text-amber-400 text-xs shrink-0" />
              <span>{granterUser.mobile || "N/A"}</span>
            </div>

            <div className="flex items-start gap-2.5 text-slate-400">
              <FaMapMarkerAlt className="text-indigo-400 text-xs shrink-0 mt-0.5" />
              <span className="line-clamp-2">{granterUser.address || "ঠিকানা দেওয়া নেই"}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs text-slate-400 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-slate-400">
              <p className="font-semibold text-slate-300">কোন গ্যারান্টার সংযুক্ত নেই</p>
              <p className="text-[11px] text-slate-500 mt-0.5">গ্যারান্টার তথ্য আপডেট করা হয়নি</p>
            </div>
          </div>
        )}
      </div>

      {/* 📦 Product & Pricing Info Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800 p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs">
              <FaBox />
            </div>
            <span>পণ্যের বিবরণ ও মূল্য</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
            {currentCard?.sale_type || "Installment"}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold truncate">
            <FaBox className="text-slate-500 text-xs shrink-0" />
            <span className="truncate">{currentCard?.product_name || "N/A"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">বিক্রয় মূল্য</span>
              <span className="font-mono font-bold text-white text-xs">
                ৳ {Number(currentCard?.sale_price || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">ক্রয় মূল্য</span>
              <span className="font-mono font-bold text-slate-300 text-xs">
                ৳ {Number(currentCard?.cost_price || currentCard?.purchase_price || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-cyan-400 text-xs" /> ডেলিভারি তারিখ:
            </span>
            <span className="font-mono text-slate-300">{currentCard?.delivery_date || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderInfo;
