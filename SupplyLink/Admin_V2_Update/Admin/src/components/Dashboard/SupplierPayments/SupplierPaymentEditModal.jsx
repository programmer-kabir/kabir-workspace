import axios from "axios";
import React, { useEffect, useState } from "react";
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

const SupplierPaymentEditModal = ({ isOpen, onClose, onSuccess, item }) => {
  const [formData, setFormData] = useState({
    memo_no: "",
    date: "",
    shop_name: "",
    supplier: "",
    brand: "",
    total_amount: "",
    paid: "",
    due: "",
    remarks: "",
    image: "",
    image_file: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync data when modal opens
  useEffect(() => {
    if (item) {
      setFormData({
        memo_no: item.memo_no || "",
        date: item.date || "",
        shop_name: item.shop_name || "",
        supplier: item.supplier || "",
        brand: item.brand || "",
        total_amount: item.total_amount ?? "",
        paid: item.paid ?? "",
        due: item.due ?? "",
        remarks: item.remarks || "",
        image: item.image || "",
        image_file: null,
      });

      if (item.image) {
        if (
          item.image.startsWith("http://") ||
          item.image.startsWith("https://") ||
          item.image.startsWith("blob:") ||
          item.image.startsWith("data:")
        ) {
          setImagePreview(item.image);
        } else {
          const cleanPath = item.image.replace(/^\/+/, "");
          const baseApi = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";
          const serverHost = baseApi.replace(/\/apis\/?.*$/, "");
          setImagePreview(`${serverHost}/${cleanPath}`);
        }
      } else {
        setImagePreview(null);
      }
    }
  }, [item]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0];
      if (file) {
        setImagePreview(URL.createObjectURL(file));
        setFormData((prev) => ({
          ...prev,
          image_file: file,
        }));
      }
    } else {
      const updatedData = { ...formData, [name]: value };

      // Auto due
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
    setFormData((prev) => ({
      ...prev,
      image: "",
      image_file: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.memo_no || !formData.date || formData.total_amount === "") {
      toast.info("মেমো নম্বর, তারিখ এবং মোট টাকার পরিমাণ পূরণ করুন!");
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("id", item.id);
      form.append("memo_no", formData.memo_no);
      form.append("date", formData.date);
      form.append("shop_name", formData.shop_name);
      form.append("supplier", formData.supplier);
      form.append("brand", formData.brand);
      form.append("total_amount", formData.total_amount);
      form.append("paid", formData.paid || 0);
      form.append("due", formData.due !== "" ? formData.due : Math.max(0, (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.paid) || 0)));
      form.append("remarks", formData.remarks);
      form.append("old_image", formData.image || "");

      if (formData.image_file instanceof File) {
        form.append("image", formData.image_file);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/updateSupplierPayments.php`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        toast.success(res.data?.message || "পেমেন্ট তথ্য আপডেট সম্পন্ন হয়েছে ✅");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || "আপডেট ফেইলড ❌");
      }
    } catch (err) {
      toast.error("আপডেট করা সম্ভব হয়নি ❌");
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
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <FaFileInvoiceDollar className="text-xl" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  পেমেন্ট এডিট করুন (Edit Payment)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  #{item?.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                সাপ্লায়ার বা ডিলার ভাউচারের তথ্য ও রসিদের ছবি সংশোধন করুন
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
                <span>টেলিকম / শপের নাম (Shop)</span>
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
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
                readOnly
                className={`${inputClass} font-mono font-bold text-rose-400 bg-slate-900/60`}
              />
            </div>

            {/* Image Upload / Update */}
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
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600/30 file:text-cyan-300 hover:file:bg-cyan-600/50 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ছবি পরিবর্তন করতে নতুন ফাইল সিলেক্ট করুন
                  </p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaComments className="text-slate-400 text-[11px]" />
                <span>মন্তব্য / বিবরণ (Remarks)</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="2"
                className={inputClass}
              />
            </div>
          </div>

          {/* Buttons */}
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "আপডেট হচ্ছে..." : "আপডেট সম্পন্ন করুন (Save Changes)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierPaymentEditModal;
