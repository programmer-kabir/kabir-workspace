import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaHashtag,
  FaBuilding,
  FaShieldAlt,
} from "react-icons/fa";
import { MdCategory, MdNotes } from "react-icons/md";
import { toast } from "react-toastify";
import useUserRole from "../../utils/Hooks/useUserRole";
import useCashCategories from "../../utils/Hooks/cash/useCashCategories";

const getTodayDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());
};

const CashOutModal = ({ openCashOutModal, isOpen, onClose, onSuccess }) => {
  const { isAdminOrDev } = useUserRole();
  const { cashOutCategories } = useCashCategories();
  const [loading, setLoading] = useState(false);
  const [isCompanyExpense, setIsCompanyExpense] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    source: "",
    amount: "",
    category: "purchase",
    purpose: "",
  });

  const selectableCategories = React.useMemo(() => {
    if (!isAdminOrDev) {
      return cashOutCategories.filter((c) => c.is_company_expense);
    }
    return cashOutCategories;
  }, [cashOutCategories, isAdminOrDev]);

  // auto date & role enforcement
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: getTodayDate(),
      category: !isAdminOrDev ? "office-expense" : prev.category || "purchase",
    }));

    if (!isAdminOrDev) {
      setIsCompanyExpense(true);
    }
  }, [isAdminOrDev]);

  const isModalOpen = openCashOutModal || isOpen;
  if (!isModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.purpose) {
      toast.error("পরিমাণ (Amount) এবং খরচের বিবরণ (Purpose) পূরণ করুন!");
      return;
    }

    if (Number(formData.amount) <= 0) {
      toast.error("সঠিক টাকার পরিমাণ দিন!");
      return;
    }

    // Role-based validation
    if (!isAdminOrDev) {
      const allowedCategories = cashOutCategories
        .filter((c) => c.is_company_expense)
        .map((c) => c.slug);

      if (allowedCategories.length > 0 && !allowedCategories.includes(formData.category)) {
        toast.error("আপনার শুধুমাত্র কোম্পানি খরচ (Company Expense) এন্ট্রি করার অনুমতি রয়েছে!");
        return;
      }
    }

    try {
      setLoading(true);

      // Non-admin/dev is strictly forced to 'company-expense'
      const finalSource = (!isAdminOrDev || isCompanyExpense) ? "company-expense" : "";
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        source: finalSource,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/cashOut.php`,
        payload
      );

      if (!res.data?.success) {
        toast.error(res.data?.message || "Failed!");
        return;
      }

      const toastPayload = {
        title: "ক্যাশ আউট সফল হয়েছে! 💸",
        message: `${formData.purpose ? `${formData.purpose} বাবদ ` : ""}৳ ${Number(formData.amount).toLocaleString()} ক্যাশ আউট সম্পন্ন হয়েছে।`,
        tag: formData.category || (isCompanyExpense ? "Company Expense" : "Cash Out"),
        amount: formData.amount,
        type: "success",
      };

      // Reset form
      setFormData({
        date: getTodayDate(),
        source: !isAdminOrDev ? "company-expense" : "",
        amount: "",
        category: !isAdminOrDev ? "office-expense" : "purchase",
        purpose: "",
      });
      setIsCompanyExpense(!isAdminOrDev);

      onClose();
      if (onSuccess) {
        onSuccess(toastPayload);
      } else {
        toast.success("Cash Out Success ✅");
      }
    } catch (err) {
      toast.error("Error submitting!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div
        className="w-full max-w-xl bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl 
                      max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-white text-lg font-semibold flex items-center gap-2">
              <span>ক্যাশ আউট (Cash Out)</span>
              {!isAdminOrDev && (
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-normal">
                  কোম্পানি খরচ মোড
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {!isAdminOrDev
                ? "আপনার রোলের জন্য শুধুমাত্র কোম্পানির ব্যয় এন্ট্রি সীমাবদ্ধ"
                : "সকল ধরনের ক্যাশ আউট ও কোম্পানি ব্যয় এন্ট্রি"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGroup
              label="তারিখ"
              icon={<FaCalendarAlt className="text-red-400" />}
            >
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-dark date-fix"
              />
            </FormGroup>

            <FormGroup
              label="পরিমাণ (Amount)"
              icon={<FaMoneyBillWave className="text-red-400" />}
            >
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="উদাহরণ: 1500"
                className="input-dark"
              />
            </FormGroup>

            {/* Company Expense Checkbox or Enforced Banner */}
            {!isAdminOrDev ? (
              <div className="bg-[#111827] border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                    <FaBuilding className="text-amber-400" />
                    <span>কোম্পানি খরচ (Company Expense)</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    স্টাফ ও সাধারণ অ্যাকাউন্টের জন্য শুধুমাত্র কোম্পানির ব্যয় এন্ট্রি প্রযোজ্য।
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <FaShieldAlt className="text-[10px]" />
                  বাধ্যতামূলক
                </span>
              </div>
            ) : (
              <div className="bg-[#111827] border border-gray-700 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCompanyExpense}
                    onChange={(e) => setIsCompanyExpense(e.target.checked)}
                    className="w-5 h-5 accent-red-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-1.5">
                      <FaBuilding className="text-slate-400 text-xs" />
                      Company Expense
                    </p>
                    <p className="text-xs text-gray-400">
                      এটি কোম্পানির প্রাতিষ্ঠানিক খরচ হলে টিক দিন
                    </p>
                  </div>
                </label>
              </div>
            )}

            <FormGroup
              label="ক্যাটাগরি"
              icon={<MdCategory className="text-orange-400" />}
            >
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-dark"
              >
                {selectableCategories.map((cat) => (
                  <option key={cat.slug} className="bg-[#0F172A]" value={cat.slug}>
                    {cat.name_bn} ({cat.name_en})
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup
              label="খরচের বিবরণ (Purpose)"
              icon={<MdNotes className="text-pink-400" />}
            >
              <textarea
                rows="3"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="যেমন: অফিস খরচ, বাজার..."
                className="input-dark resize-none"
              />
            </FormGroup>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl"
            >
              {loading ? "Saving..." : "⬇ খরচ সেভ করুন"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CashOutModal;

/* 🔹 FormGroup */

const FormGroup = ({ label, icon, children }) => {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
};
