import React, { useState, useEffect } from "react";
import { FaTimes, FaStore } from "react-icons/fa";
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

const EditShopModal = ({ isOpen, onClose, onSuccess, shop }) => {
  const [formData, setFormData] = useState({
    id: "",
    shop_name: "",
    category: "Mobile & Electronics Distributor",
    owner_name: "",
    phone: "",
    address: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shop) {
      setFormData({
        id: shop.id || "",
        shop_name: shop.shop_name || "",
        category: shop.category || "Mobile & Electronics Distributor",
        owner_name: shop.owner_name === "-" ? "" : shop.owner_name || "",
        phone: shop.phone === "-" ? "" : shop.phone || "",
        address: shop.address === "-" ? "" : shop.address || "",
      });
    }
  }, [shop]);

  if (!isOpen || !shop) return null;

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
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/updateSupplierShop.php`,
        formData
      );

      if (res.data?.success) {
        toast.success("দোকানের তথ্য সফলভাবে আপডেট হয়েছে! ✅");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || "আপডেট ব্যর্থ হয়েছে ❌");
      }
    } catch (err) {
      toast.error("Error updating shop profile ❌");
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
            <span className="p-3 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <FaStore className="text-xl" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                দোকান / সাপ্লায়ার তথ্য এডিট
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {shop.shop_name} এর বিবরণ পরিবর্তন করুন
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
              দোকান বা সাপ্লায়ারের নাম *
            </label>
            <input
              type="text"
              name="shop_name"
              required
              value={formData.shop_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              ক্যাটাগরি / ধরন
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
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
              মালিকের নাম
            </label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              মোবাইল নম্বর
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              ঠিকানা ও অবস্থান
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition"
            >
              {isSubmitting ? "আপডেট হচ্ছে..." : "আপডেট সম্পন্ন করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShopModal;
