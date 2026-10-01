import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaStore,
  FaBuilding,
  FaTag,
  FaMoneyBillWave,
  FaCloudUploadAlt,
  FaComments,
} from "react-icons/fa";

const SupplierPaymentAddModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    memo_no: "",
    date: new Date().toISOString().split("T")[0],
    shop_name: "",
    supplier: "",
    brand: "",
    total_amount: "",
    paid: "",
    due: "",
    remarks: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0];
      if (file) {
        setImagePreview(URL.createObjectURL(file));
        setFormData((prev) => ({ ...prev, image: file }));
      }
    } else {
      const updatedData = { ...formData, [name]: value };

      // Auto calculate due
      if (name === "total_amount" || name === "paid") {
        const total = parseFloat(name === "total_amount" ? value : updatedData.total_amount) || 0;
        const paid = parseFloat(name === "paid" ? value : updatedData.paid) || 0;
        updatedData.due = Math.max(0, total - paid);
      }

      setFormData(updatedData);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.memo_no || !formData.date || !formData.total_amount) {
      toast.info("মেমো নম্বর, তারিখ এবং মোট টাকার পরিমাণ দেওয়া আবশ্যক!");
      return;
    }

    setIsSubmitting(true);
    const form = new FormData();
    form.append("memo_no", formData.memo_no);
    form.append("date", formData.date);
    form.append("shop_name", formData.shop_name);
    form.append("supplier", formData.supplier);
    form.append("brand", formData.brand);
    form.append("total_amount", formData.total_amount);
    form.append("paid", formData.paid || 0);
    form.append("due", formData.due !== "" ? formData.due : Math.max(0, (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.paid) || 0)));
    form.append("remarks", formData.remarks);

    if (formData.image instanceof File) {
      form.append("image", formData.image);
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/addSupplierPayments.php`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res?.data?.success) {
        toast.success(res?.data?.message || "সাপ্লায়ার পেমেন্ট সফলভাবে যুক্ত হয়েছে! ✅");
        onSuccess && onSuccess();
        onClose();
        // Reset form
        setFormData({
          memo_no: "",
          date: new Date().toISOString().split("T")[0],
          shop_name: "",
          supplier: "",
          brand: "",
          total_amount: "",
          paid: "",
          due: "",
          remarks: "",
          image: null,
        });
        setImagePreview(null);
      } else {
        toast.error(res?.data?.message || "পেমেন্ট যোগ করতে সমস্যা হয়েছে ❌");
      }
    } catch (err) {
      toast.error("সার্ভার এরর: পেমেন্ট যুক্ত করা যায়নি ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/90 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-3xl border border-slate-700/80 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <FaFileInvoiceDollar className="text-xl" />
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                নতুন সাপ্লায়ার পেমেন্ট (Add Supplier Payment)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ডিলার / সাপ্লায়ারের পণ্য ক্রয় ও পেমেন্ট রসিদের তথ্য যোগ করুন
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memo No */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaTag className="text-cyan-400 text-[11px]" />
                <span>মেমো নম্বর (Memo No) *</span>
              </label>
              <input
                type="text"
                name="memo_no"
                value={formData.memo_no}
                placeholder="যেমন: MEMO-9821 / 1024"
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaCalendarAlt className="text-blue-400 text-[11px]" />
                <span>তারিখ (Date) *</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Shop Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaStore className="text-purple-400 text-[11px]" />
                <span>টেলিকম / শপের নাম (Shop / Telecom)</span>
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                placeholder="যেমন: SupplyLink Electronics, Dhaka"
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaBuilding className="text-teal-400 text-[11px]" />
                <span>সাপ্লায়ার / ডিলার (Supplier)</span>
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                placeholder="যেমন: Walton Plaza, Official Distributor"
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Brand */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaTag className="text-indigo-400 text-[11px]" />
                <span>ব্র্যান্ড (Brand)</span>
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                placeholder="যেমন: Samsung, Walton, Singer, Vivo"
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-amber-400 text-[11px]" />
                <span>মোট টাকার পরিমাণ (Total ৳) *</span>
              </label>
              <input
                type="number"
                step="any"
                name="total_amount"
                value={formData.total_amount}
                placeholder="যেমন: 50000"
                onChange={handleChange}
                required
                className={`${inputClass} font-mono font-bold text-amber-400`}
              />
            </div>

            {/* Paid */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-emerald-400 text-[11px]" />
                <span>পরিশোধিত টাকা (Paid ৳)</span>
              </label>
              <input
                type="number"
                step="any"
                name="paid"
                value={formData.paid}
                placeholder="যেমন: 30000"
                onChange={handleChange}
                className={`${inputClass} font-mono font-bold text-emerald-400`}
              />
            </div>

            {/* Due */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-rose-400 text-[11px]" />
                <span>বকেয়া টাকা (Due ৳ - Auto)</span>
              </label>
              <input
                type="number"
                step="any"
                name="due"
                value={formData.due}
                placeholder="0"
                onChange={handleChange}
                className={`${inputClass} font-mono font-bold text-rose-400 bg-slate-900/60`}
              />
            </div>

            {/* Image / Memo Receipt Upload */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                মেমো / রসিদের ছবি (Receipt / Voucher Image)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-dashed border-slate-700 hover:border-cyan-500/50 transition">
                {imagePreview ? (
                  <div className="relative group shrink-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-700 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow"
                      title="ছবি মুছুন"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <FaCloudUploadAlt className="text-2xl text-cyan-400" />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600/30 file:text-indigo-300 hover:file:bg-indigo-600/50 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    PNG, JPG, WEBP ফাইল আপলোড করুন (সর্বোচ্চ 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaComments className="text-slate-400 text-[11px]" />
                <span>মন্তব্য / নোট (Remarks)</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="প্রয়োজনে অতিরিক্ত কোনো নোট বা বিবরণ লিখুন..."
                rows="2"
                className={inputClass}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "পেমেন্ট সংরক্ষণ করুন (Save)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierPaymentAddModal;
