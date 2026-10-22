import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaEdit,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTag,
  FaBuilding,
  FaMotorcycle,
  FaStore,
  FaHome,
  FaTools,
  FaProjectDiagram,
  FaBox,
  FaUser,
  FaIdCard,
  FaPaperPlane,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../Provider/AuthProvider";

const categoryLabels = {
  bike: "বাইক লিজ",
  shop: "দোকান ভাড়া",
  house: "বাসা/ঘর ভাড়া",
  equipment: "যন্ত্রপাতি",
  project: "প্রজেক্ট ইনভেস্টমেন্ট",
  company_share: "কোম্পানি শেয়ার (Equity)",
  other: "অন্যান্য",
};

const AssetEditModal = ({ isOpen, onClose, asset, onSuccess }) => {
  const { user } = useAuth() || {};

  const [formData, setFormData] = useState({
    new_asset_name: "",
    new_category: "bike",
    new_purchase_price: "",
    new_purchase_date: "",
    new_vendor_info: "",
    new_reg_no: "",
    new_contact_person: "",
    new_business_type: "",
    new_share_percentage: "",
    new_share_units: "",
    new_dividend_frequency: "on_demand",
    new_remarks: "",
    request_reason: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        new_asset_name: asset.asset_name || "",
        new_category: asset.category || "bike",
        new_purchase_price: asset.purchase_price || "",
        new_purchase_date: asset.purchase_date || new Date().toISOString().split("T")[0],
        new_vendor_info: asset.vendor_info || "",
        new_reg_no: asset.reg_no || "",
        new_contact_person: asset.contact_person || "",
        new_business_type: asset.business_type || "",
        new_share_percentage: asset.share_percentage !== null ? asset.share_percentage : "",
        new_share_units: asset.share_units !== null ? asset.share_units : "",
        new_dividend_frequency: asset.dividend_frequency || "on_demand",
        new_remarks: asset.remarks || "",
        request_reason: "",
      });
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isCompanyShare = formData.new_category === "company_share";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.new_asset_name.trim()) {
      return toast.error("অ্যাসেটের নাম আবশ্যক!");
    }
    if (!formData.new_purchase_price || Number(formData.new_purchase_price) <= 0) {
      return toast.error("সঠিক ক্রয়মূল্য প্রদান করুন!");
    }
    if (!formData.new_purchase_date) {
      return toast.error("ক্রয়ের তারিখ আবশ্যক!");
    }
    if (!formData.request_reason.trim()) {
      return toast.error("অনুগ্রহ করে সংশোধনের সঠিক কারণ লিখুন!");
    }

    try {
      setSubmitting(true);

      const payload = {
        asset_id: Number(asset.id),
        ...formData,
        new_purchase_price: Number(formData.new_purchase_price),
        requested_by: user?.id,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/other_sources/request_asset_edit.php`,
        payload
      );

      if (res.data?.success) {
        onClose();
        if (onSuccess) {
          onSuccess({
            title: "অনুরোধ পাঠানো হয়েছে! ⏳",
            message:
              res.data.message ||
              "অ্যাসেট সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে তথ্য ও ব্যালেন্স আপডেট হবে।",
            tag: `অ্যাসেট #${asset.id} সংশোধন`,
            amount: Number(formData.new_purchase_price) || 0,
            type: "warning",
          });
        }
      } else {
        toast.error(res.data?.error || "অনুরোধ পাঠানো সম্ভব হয়নি!");
      }
    } catch (err) {
      console.error("Asset edit request error:", err);
      toast.error(err.response?.data?.error || "সার্ভার এরর! পুনরায় চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0f1b2d] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#071025]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <FaEdit size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>অ্যাসেট সংশোধন অনুরোধ</span>
                <span className="text-xs font-mono text-amber-400 font-normal">
                  (আইডি #{asset.id})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                বর্তমান নাম: <strong className="text-slate-200">{asset.asset_name}</strong> | বর্তমান মূল্য: <strong className="text-red-400 font-mono">৳ {Number(asset.purchase_price).toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Info Notice */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-amber-300">
            <FaExclamationTriangle className="text-amber-400 text-sm shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>সতর্কতা:</strong> এটি সরাসরি ডাটাবেসে সেভ হবে না। আপনার অনুরোধটি <strong>অ্যাডমিন</strong> বা <strong>ডেভেলপারের</strong> কাছে অনুমোদনের জন্য যাবে। তারা অনুমোদন করলে অ্যাসেটের তথ্যের সাথে সংশ্লিষ্ট <strong>ক্যাশ আউট (Cash Out)</strong> হিসাবও স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।
            </div>
          </div>

          {/* Asset Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                অ্যাসেটের নাম *
              </label>
              <input
                type="text"
                name="new_asset_name"
                value={formData.new_asset_name}
                onChange={handleChange}
                placeholder="যেমন: Yamaha FZS V3 অথবা শপ নং ৪"
                required
                className="w-full bg-[#071025] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                ক্যাটাগরি
              </label>
              <select
                name="new_category"
                value={formData.new_category}
                onChange={handleChange}
                className="w-full bg-[#071025] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 outline-none"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key} className="bg-slate-900">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white/[0.02] p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="text-amber-400 font-semibold block mb-1 flex items-center gap-1">
                <FaMoneyBillWave size={12} />
                <span>ক্রয় / বিনিয়োগ মূল্য (৳) *</span>
              </label>
              <input
                type="number"
                name="new_purchase_price"
                value={formData.new_purchase_price}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="w-full bg-[#071025] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-bold focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <FaCalendarAlt size={12} className="text-indigo-400" />
                <span>ক্রয়ের তারিখ *</span>
              </label>
              <input
                type="date"
                name="new_purchase_date"
                value={formData.new_purchase_date}
                onChange={handleChange}
                required
                className="w-full bg-[#071025] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* Registration No / Vendor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <FaIdCard size={12} className="text-cyan-400" />
                <span>রেজিস্ট্রেশন / দলিল / ভলিউম নং</span>
              </label>
              <input
                type="text"
                name="new_reg_no"
                value={formData.new_reg_no}
                onChange={handleChange}
                placeholder="যেমন: ঢাকা মেট্রো-হ-১২৩৪৫৬"
                className="w-full bg-[#071025] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <FaUser size={12} className="text-emerald-400" />
                <span>সেলার / শোরুম / ভেন্ডর বিবরণ</span>
              </label>
              <input
                type="text"
                name="new_vendor_info"
                value={formData.new_vendor_info}
                onChange={handleChange}
                placeholder="যার কাছ থেকে ক্রয় করা হয়েছে"
                className="w-full bg-[#071025] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-400 outline-none"
              />
            </div>
          </div>

          {/* Company Share Specific Fields */}
          {isCompanyShare && (
            <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-2xl p-3.5 space-y-3">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1">
                <FaBuilding size={12} /> কোম্পানি ইকুইটি / শেয়ার ডিটেইলস
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    শেয়ার মালিকানা (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="new_share_percentage"
                    value={formData.new_share_percentage}
                    onChange={handleChange}
                    placeholder="যেমন: 15.5"
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    শেয়ার ইউনিট/সংখ্যা
                  </label>
                  <input
                    type="number"
                    name="new_share_units"
                    value={formData.new_share_units}
                    onChange={handleChange}
                    placeholder="যেমন: 500"
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    ডিভিডেন্ড ফ্রিকোয়েন্সি
                  </label>
                  <select
                    name="new_dividend_frequency"
                    value={formData.new_dividend_frequency}
                    onChange={handleChange}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="monthly">মাসিক (Monthly)</option>
                    <option value="quarterly">ত্রৈমাসিক (Quarterly)</option>
                    <option value="yearly">বার্ষিক (Yearly)</option>
                    <option value="on_demand">চাহিবা মাত্র (On Demand)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  ব্যবসার ধরণ ও দায়িত্বশীল ব্যক্তি
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="new_business_type"
                    value={formData.new_business_type}
                    onChange={handleChange}
                    placeholder="ব্যবসার ধরণ (যেমন: রেস্তোরাঁ, ফার্মেসি)"
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-400 outline-none"
                  />
                  <input
                    type="text"
                    name="new_contact_person"
                    value={formData.new_contact_person}
                    onChange={handleChange}
                    placeholder="দায়িত্বশীল ব্যক্তি ও ফোন নং"
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              অতিরিক্ত মন্তব্য (Remarks)
            </label>
            <input
              type="text"
              name="new_remarks"
              value={formData.new_remarks}
              onChange={handleChange}
              placeholder="অতিরিক্ত কোনো তথ্য বা শর্ত থাকলে লিখুন"
              className="w-full bg-[#071025] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:border-slate-400 outline-none"
            />
          </div>

          {/* Reason for Edit (MANDATORY) */}
          <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-3.5">
            <label className="text-amber-300 font-bold block mb-1 flex items-center justify-between">
              <span>সংশোধনের কারণ (Request Reason) *</span>
              <span className="text-[10px] text-amber-400/80 uppercase font-mono">
                বাধ্যতামূলক
              </span>
            </label>
            <textarea
              rows="3"
              name="request_reason"
              value={formData.request_reason}
              onChange={handleChange}
              placeholder="কেন অ্যাসেটের তথ্য বা মূল্য সংশোধন করতে চান? (যেমন: ক্রয়মূল্য টাইপ করতে ভুল হয়েছিল, নতুন কাগজপত্র পাওয়া গেছে ইত্যাদি)..."
              required
              className="w-full bg-[#071025] border border-amber-500/30 rounded-xl p-3 text-white placeholder:text-slate-500 focus:border-amber-400 outline-none leading-relaxed"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <FaPaperPlane className={submitting ? "animate-spin" : ""} />
              <span>{submitting ? "পাঠানো হচ্ছে..." : "অনুরোধ পাঠান"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetEditModal;
