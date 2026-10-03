import React, { useState } from "react";
import { FaTimes, FaStore, FaUserTie, FaPhoneAlt, FaMapMarkerAlt, FaTag, FaMoneyBillWave } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const CATEGORIES = [
  "Mobile & Electronics Distributor",
  "Showroom & Brand Dealer",
  "Official Agency / Importer",
  "Accessories Wholesaler",
  "Tea Stall & Snacks",
  "General Supplier",
];

const AddShopModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    shop_name: "",
    category: "Mobile & Electronics Distributor",
    owner_name: "",
    phone: "",
    address: "",
    initial_due: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shop_name.trim()) {
      toast.info("দোকান বা সাপ্লায়ারের নাম দিন!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/addSupplierShop.php`,
        formData
      );

      if (res.data?.success) {
        toast.success("নতুন দোকান/সাপ্লায়ার সফলভাবে যুক্ত হয়েছে! ✅");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || "দোকান যুক্ত করতে সমস্যা হয়েছে ❌");
      }
    } catch (err) {
      toast.error("Error creating shop profile ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-lg border border-slate-700/80 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <FaStore className="text-xl" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                নতুন দোকান / সাপ্লায়ার যুক্ত করুন
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ডিলার বা দোকানদারের নাম ও ঠিকানা সেভ করে লেনদেন শুরু করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Shop Name */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              দোকান বা সাপ্লায়ারের নাম (Shop / Supplier Name) *
            </label>
            <input
              type="text"
              name="shop_name"
              required
              value={formData.shop_name}
              onChange={handleChange}
              placeholder="যেমন: Neyamot Store, Golap Store, Samsung Agency"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              ক্যাটাগরি / ধরন (Category)
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Owner Name */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              মালিকের নাম (Owner Name)
            </label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              placeholder="যেমন: Neyamot Kaka, Golap Hossain"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              মোবাইল নম্বর (Phone)
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="যেমন: +880 13 5267 9621"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              ঠিকানা ও অবস্থান (Address)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="যেমন: New market, Kandigoan Chararpar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Initial Due Opening Balance */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              পূর্বের প্রারম্ভিক বকেয়া (Previous Opening Due ৳ - ঐচ্ছিক)
            </label>
            <input
              type="number"
              name="initial_due"
              value={formData.initial_due}
              onChange={handleChange}
              placeholder="যেমন: 200 বা 5000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-amber-500 focus:outline-none font-mono font-bold"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition"
            >
              {isSubmitting ? "যুক্ত হচ্ছে..." : "+ দোকান সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShopModal;
