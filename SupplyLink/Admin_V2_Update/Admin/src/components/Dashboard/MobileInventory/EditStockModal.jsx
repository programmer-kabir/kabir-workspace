import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaCalendarAlt,
  FaTag,
  FaMoneyBillWave,
  FaBuilding,
  FaPalette,
  FaLayerGroup,
  FaCloudUploadAlt,
  FaMobileAlt,
  FaTv,
  FaSnowflake,
  FaBatteryFull,
  FaFan,
  FaBoxOpen,
} from "react-icons/fa";
import { CATEGORIES, CATEGORY_BRANDS, CATEGORY_VARIANTS } from "./AddStockModal";

const EditStockModal = ({
  setIsEditOpen,
  handleUpdate,
  editData,
  setEditData,
  inputClass,
  brandInput,
  setBrandInput,
  showSuggestions,
  setShowSuggestions,
  filteredBrands,
  variantInput,
  setVariantInput,
  showVariantSuggestions,
  setShowVariantSuggestions,
  filteredVariants,
}) => {
  const [imagePreview, setImagePreview] = useState(null);

  // Sync editData to inputs
  useEffect(() => {
    if (editData) {
      setBrandInput(editData.brand || "");
      setVariantInput(editData.variant || "");
      if (editData.image && typeof editData.image === "string") {
        if (
          editData.image.startsWith("http://") ||
          editData.image.startsWith("https://") ||
          editData.image.startsWith("blob:") ||
          editData.image.startsWith("data:")
        ) {
          setImagePreview(editData.image);
        } else {
          const cleanPath = editData.image.replace(/^\/+/, "");
          const baseApi = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";
          const serverHost = baseApi.replace(/\/apis\/?.*$/, "");
          setImagePreview(`${serverHost}/${cleanPath}`);
        }
      } else {
        setImagePreview(null);
      }
    }
  }, [editData, setBrandInput, setVariantInput]);

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategorySelect = (catId) => {
    setEditData((prev) => ({
      ...prev,
      category: catId,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setEditData((prev) => ({
        ...prev,
        image_file: file,
        new_image: file,
      }));
    }
  };

  const selectedCategory = editData?.category || "Mobile";
  const currentBrands = CATEGORY_BRANDS[selectedCategory] || CATEGORY_BRANDS.Other;
  const currentVariants = CATEGORY_VARIANTS[selectedCategory] || CATEGORY_VARIANTS.Other;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={() => setIsEditOpen(false)}
      ></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-3xl border border-slate-700/80 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <FaLayerGroup className="text-xl" />
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                প্রোডাক্ট স্টক এডিট করুন (Edit Stock #{editData?.id})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                প্রোডাক্টের বিবরণ, মূল্য বা স্ট্যাটাস পরিবর্তন করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6 mt-5">
          {/* Category Selector Cards */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <FaTag className="text-cyan-400 text-[11px]" />
              <span>প্রোডাক্ট ক্যাটাগরি (Category)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-lg shadow-indigo-500/25 scale-[1.03]`
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span className="text-[11px] font-bold truncate max-w-full">
                      {cat.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Purchase Date */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaCalendarAlt className="text-blue-400 text-[11px]" />
                <span>ক্রয়ের তারিখ (Purchase Date)</span>
              </label>
              <input
                type="date"
                name="date"
                value={editData?.date || ""}
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Brand with Suggestions */}
            <div className="relative">
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaTag className="text-indigo-400 text-[11px]" />
                <span>ব্র্যান্ড (Brand)</span>
              </label>
              <input
                type="text"
                name="brand"
                value={brandInput}
                onChange={(e) => {
                  setBrandInput(e.target.value);
                  setShowSuggestions(true);
                  setEditData({
                    ...editData,
                    brand: e.target.value,
                  });
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />

              {showSuggestions && (
                <div className="absolute left-0 right-0 bg-slate-900 border border-slate-700 mt-1 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {currentBrands
                    .filter((b) =>
                      b.toLowerCase().includes((brandInput || "").toLowerCase())
                    )
                    .map((b, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setBrandInput(b);
                          setEditData({ ...editData, brand: b });
                          setShowSuggestions(false);
                        }}
                        className="px-3 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-cyan-300 rounded-xl cursor-pointer transition flex items-center justify-between"
                      >
                        <span>{b}</span>
                        <span className="text-[10px] text-slate-500">ব্র্যান্ড</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Model Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <span>মডেল / প্রোডাক্টের নাম (Model Name)</span>
              </label>
              <input
                type="text"
                name="model"
                value={editData?.model || ""}
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Variant / Capacity */}
            <div className="relative">
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <span>স্পেসিফিকেশন / ক্যাপাসিটি (Variant / Capacity)</span>
              </label>
              <input
                type="text"
                name="variant"
                value={variantInput}
                onChange={(e) => {
                  setVariantInput(e.target.value);
                  setShowVariantSuggestions(true);
                  setEditData({
                    ...editData,
                    variant: e.target.value,
                  });
                }}
                onFocus={() => setShowVariantSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVariantSuggestions(false), 200)}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />

              {showVariantSuggestions && (
                <div className="absolute left-0 right-0 bg-slate-900 border border-slate-700 mt-1 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {currentVariants
                    .filter((v) =>
                      v.toLowerCase().includes((variantInput || "").toLowerCase())
                    )
                    .map((v, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setVariantInput(v);
                          setEditData({ ...editData, variant: v });
                          setShowVariantSuggestions(false);
                        }}
                        className="px-3 py-2 text-xs text-slate-200 hover:bg-cyan-600/30 hover:text-cyan-300 rounded-xl cursor-pointer transition flex items-center justify-between"
                      >
                        <span>{v}</span>
                        <span className="text-[10px] text-slate-500">স্পেস</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaPalette className="text-purple-400 text-[11px]" />
                <span>কালার / রঙ (Color)</span>
              </label>
              <input
                type="text"
                name="color"
                value={editData?.color || ""}
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaBuilding className="text-teal-400 text-[11px]" />
                <span>সাপ্লায়ার (Supplier)</span>
              </label>
              <input
                type="text"
                name="supplier"
                value={editData?.supplier || ""}
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-amber-400 text-[11px]" />
                <span>ক্রয়মূল্য (Purchase Price ৳)</span>
              </label>
              <input
                type="number"
                step="any"
                name="purchase_price"
                value={editData?.purchase_price ?? ""}
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500 font-mono font-bold`}
              />
            </div>

            {/* MRP */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-emerald-400 text-[11px]" />
                <span>এমআরপি / বিক্রয়মূল্য (MRP ৳)</span>
              </label>
              <input
                type="number"
                step="any"
                name="mrp"
                value={editData?.mrp ?? ""}
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500 font-mono font-bold`}
              />
            </div>

            {/* Stock Status Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">
                স্টক স্ট্যাটাস (Stock Status)
              </label>
              <select
                name="status"
                value={editData?.status || "available"}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 font-bold"
              >
                <option value="available" className="bg-slate-900 text-emerald-400">
                  🟢 Available (মজুদ আছে)
                </option>
                <option value="sold" className="bg-slate-900 text-rose-400">
                  🔴 Sold (বিক্রিত)
                </option>
              </select>
            </div>

            {/* Product Image Update */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                প্রোডাক্ট / আইএমইআই ছবি (Image)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-dashed border-slate-700 hover:border-cyan-500/50 transition">
                {imagePreview ? (
                  <div className="relative group shrink-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setEditData((prev) => ({
                          ...prev,
                          image: "",
                          image_file: null,
                          new_image: null,
                        }));
                      }}
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
                    onChange={handleImageChange}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600/30 file:text-cyan-300 hover:file:bg-cyan-600/50 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ছবি পরিবর্তন করতে নতুন ফাইল সিলেক্ট করুন
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              আপডেট সম্পন্ন করুন (Save Changes)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStockModal;