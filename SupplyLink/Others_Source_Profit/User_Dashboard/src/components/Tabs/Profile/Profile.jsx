import React, { useState } from "react";
import currentUser from "../../../Utils/currentUser";
import useInvestInstallmentCards from "../../../Utils/Hooks/useInvestInstallmentCards";
import { formatCurrency } from "../../formatCurrency";
import usePaymentMethod from "../../../Utils/Hooks/usePaymentMethod";
import { toast } from "react-toastify";
import PaymentMethodShow from "./PaymentMethodShow";
import { 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Edit3, 
  ShieldCheck, 
  FileText, 
  Building2, 
  Smartphone,
  Lock,
  X,
  Upload,
  CheckCircle2,
  Calendar
} from "lucide-react";

const Profile = () => {
  const { investInstallmentCards = [] } = useInvestInstallmentCards();
  const runningUser = currentUser();
  const { paymentMethods, isPaymentMethodsLoading } = usePaymentMethod(runningUser?.id);

  const userInstallmentsCards = (investInstallmentCards || []).filter(
    (userCard) => String(userCard.investor_id) === String(runningUser?.id)
  );

  const totalAmount = userInstallmentsCards.reduce(
    (sum, card) => sum + Number(card.investment_amount || 0),
    0
  );

  const activeCardsCount = userInstallmentsCards.filter(
    (card) => card.status === "running"
  ).length;

  const getInvestorBadge = (amount) => {
    if (amount >= 1000000) {
      return {
        label: "প্লাটিনাম সদস্য",
        icon: "🏆",
        chipBg: "bg-purple-50 text-purple-700 border-purple-200/80",
      };
    } else if (amount >= 500000) {
      return {
        label: "গোল্ড সদস্য",
        icon: "🥇",
        chipBg: "bg-amber-50 text-amber-700 border-amber-200/80",
      };
    } else if (amount >= 200000) {
      return {
        label: "সিলভার সদস্য",
        icon: "🥈",
        chipBg: "bg-slate-50 text-slate-700 border-slate-200/80",
      };
    } else if (amount >= 50000) {
      return {
        label: "ব্রোঞ্জ সদস্য",
        icon: "🥉",
        chipBg: "bg-orange-50 text-orange-700 border-orange-200/80",
      };
    }
    return {
      label: "সাধারণ সদস্য",
      icon: "🌱",
      chipBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    };
  };

  const badge = getInvestorBadge(totalAmount);

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank");

  const [bankInfo, setBankInfo] = useState({
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    bank_branch: "",
    bank_statement_image: null,
  });

  const [walletNumbers, setWalletNumbers] = useState({
    bkash: "",
    nagad: "",
    rocket: "",
  });

  const handleProfileDetails = async () => {
    if (paymentMethod === "bank") {
      if (
        !bankInfo.bank_name ||
        !bankInfo.bank_account_name ||
        !bankInfo.bank_account_number ||
        !bankInfo.bank_branch
      ) {
        toast.error("ব্যাংকের সব তথ্য পূরণ করা বাধ্যতামূলক ❌");
        return;
      }
    }
    if (paymentMethod === "mobileWallet") {
      const hasAnyWallet =
        walletNumbers.bkash || walletNumbers.nagad || walletNumbers.rocket;

      if (!hasAnyWallet) {
        toast.error("মোবাইল ওয়ালেটের কমপক্ষে একটি নাম্বার দিতে হবে ❌");
        return;
      }
    }

    const formData = new FormData();
    formData.append("user_id", runningUser?.id);
    formData.append("payment_method", paymentMethod);
    formData.append("review", "pending");

    // ===== BANK =====
    if (paymentMethod === "bank") {
      formData.append("bank_name", bankInfo.bank_name);
      formData.append("bank_account_name", bankInfo.bank_account_name);
      formData.append("bank_account_number", bankInfo.bank_account_number);
      formData.append("bank_branch", bankInfo.bank_branch);

      if (bankInfo.bank_statement_image) {
        formData.append("bank_statement_image", bankInfo.bank_statement_image);
      }
    }

    // ===== MOBILE WALLET =====
    if (paymentMethod === "mobileWallet") {
      formData.append("bkash_number", walletNumbers.bkash || "");
      formData.append("nagad_number", walletNumbers.nagad || "");
      formData.append("rocket_number", walletNumbers.rocket || "");
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY || "https://api.supplylinkbd.com/apis"}/investor_apis/update_payment_method.php`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data?.success) {
        toast.success("পেমেন্ট তথ্য সফলভাবে আপডেট হয়েছে ✅");
        setIsEditOpen(false);
      } else {
        toast.error(data?.message || "কিছু একটা সমস্যা হয়েছে ❌");
      }
    } catch (e) {
      toast.error("সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
  };

  return (
    <div className="space-y-6">
      {/* 🏛️ 2-Column Clean White Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 👤 LEFT COLUMN (5 Cols): Personal Info & Member Details */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  ব্যক্তিগত ও মেম্বার প্রোফাইল
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.chipBg}`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            </div>

            {/* Profile Fields List */}
            <div className="divide-y divide-slate-100 mt-2">
              <div className="py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs text-slate-400 font-medium">পুরো নাম</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {runningUser?.name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">মোবাইল নম্বর</p>
                  <p className="text-sm font-semibold text-slate-800 font-mono">
                    {runningUser?.mobile || "N/A"}
                  </p>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">স্থায়ী ঠিকানা</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {runningUser?.address || "ঠিকানা অন্তর্ভুক্ত নেই"}
                  </p>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">জাতীয় পরিচয়পত্র / আইডি</p>
                  <p className="text-sm font-semibold text-slate-800 font-mono">
                    {runningUser?.id_number || `SL-INV-${runningUser?.id || "00"}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Verification Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 bg-slate-50/80 p-3 rounded-xl">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>আপনার অ্যাকাউন্টটি সাপ্লাইলিঙ্ক এনক্রিপ্টেড সিকিউরিটির আওতাভুক্ত।</span>
          </div>
        </div>

        {/* 💳 RIGHT COLUMN (7 Cols): Payment Gateway & Payout Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    পে-আউট ও ব্যাংক গেটওয়ে
                  </h3>
                  <p className="text-xs text-slate-400">
                    লভ্যাংশ সরাসরি প্রাপ্তির মাধ্যম
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                পেমেন্ট তথ্য আপডেট
              </button>
            </div>

            {/* Smart / ATM Card View */}
            <PaymentMethodShow
              paymentMethods={paymentMethods}
              setIsBankModalOpen={setIsBankModalOpen}
            />
          </div>

          <p className="mt-4 text-[11px] text-slate-400 text-center">
            * ব্যাংক বা ওয়ালেট নম্বর পরিবর্তন করলে অ্যাডমিন রিভিউয়ের পর তা কার্যকর হবে।
          </p>
        </div>
      </div>

      {/* 📝 EDIT PAYMENT METHOD MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  পেমেন্ট মাধ্যম আপডেট করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  পেমেন্ট গ্রহণের মাধ্যম সিলেক্ট করুন
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="bank">🏦 ব্যাংক ট্রান্সফার (সুপারিশকৃত)</option>
                  <option value="mobileWallet">📱 মোবাইল ওয়ালেট (বিকাশ / নগদ / রকেট)</option>
                  <option value="handCash">💵 হাতেকলমে (ক্যাশ)</option>
                </select>
              </div>

              {/* BANK INFO FIELDS */}
              {paymentMethod === "bank" && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ব্যাংক অ্যাকাউন্টের তথ্যাবলী
                  </p>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ব্যাংকের নাম</label>
                    <input
                      placeholder="যেমন: Islami Bank Bangladesh Ltd"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.bank?.bank_name}
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">অ্যাকাউন্ট হোল্ডারের নাম</label>
                    <input
                      placeholder="যেমন: MD. RAFIQUL ISLAM"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.bank?.bank_account_name}
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_account_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">অ্যাকাউন্ট নাম্বার</label>
                    <input
                      placeholder="যেমন: 20501234567890"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.bank?.bank_account_number}
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_account_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ব্রাঞ্চ (Branch)</label>
                    <input
                      placeholder="যেমন: ধানমন্ডি শাখা, ঢাকা"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.bank?.bank_branch}
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_branch: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ব্যাংক চেক / স্টেটমেন্টের ছবি (ঐচ্ছিক)</label>
                    <input
                      type="file"
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_statement_image: e.target.files[0] })}
                    />
                  </div>
                </div>
              )}

              {/* MOBILE WALLET FIELDS */}
              {paymentMethod === "mobileWallet" && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    মোবাইল ওয়ালেট নম্বরসমূহ
                  </p>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">bKash নম্বর</label>
                    <input
                      placeholder="017XXXXXXXX"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.mobile_wallet?.bkash}
                      onChange={(e) => setWalletNumbers({ ...walletNumbers, bkash: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nagad নম্বর</label>
                    <input
                      placeholder="018XXXXXXXX"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.mobile_wallet?.nagad}
                      onChange={(e) => setWalletNumbers({ ...walletNumbers, nagad: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Rocket নম্বর</label>
                    <input
                      placeholder="019XXXXXXXX"
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                      defaultValue={paymentMethods?.mobile_wallet?.rocket}
                      onChange={(e) => setWalletNumbers({ ...walletNumbers, rocket: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleProfileDetails}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                তথ্য সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 BANK DOCUMENT MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  ব্যাংক স্টেটমেন্ট ও চেক ডকুমেন্ট
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex justify-center items-center max-h-[60vh] overflow-auto">
                <img
                  src={`https://api.supplylinkbd.com/${paymentMethods?.bank?.bank_statement_image}`}
                  alt="Bank Document"
                  className="max-h-[55vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
