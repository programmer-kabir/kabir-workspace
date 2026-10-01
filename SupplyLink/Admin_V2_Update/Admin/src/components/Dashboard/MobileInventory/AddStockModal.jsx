import React, { useState } from "react";
import {
  FaTimes,
  FaMobileAlt,
  FaTv,
  FaSnowflake,
  FaBatteryFull,
  FaFan,
  FaBoxOpen,
  FaCloudUploadAlt,
  FaCalendarAlt,
  FaTag,
  FaMoneyBillWave,
  FaBuilding,
  FaPalette,
  FaLayerGroup,
} from "react-icons/fa";

export const CATEGORIES = [
  { id: "Mobile", label: "মোবাইল (Mobile)", icon: FaMobileAlt, color: "from-blue-600 to-indigo-600", border: "border-blue-500/50" },
  { id: "TV", label: "টেলিভিশন (TV)", icon: FaTv, color: "from-purple-600 to-pink-600", border: "border-purple-500/50" },
  { id: "Fridge", label: "ফ্রিজ (Refrigerator)", icon: FaSnowflake, color: "from-cyan-600 to-teal-600", border: "border-cyan-500/50" },
  { id: "IPS", label: "আইপিএস ও ব্যাটারি (IPS)", icon: FaBatteryFull, color: "from-amber-600 to-orange-600", border: "border-amber-500/50" },
  { id: "AC", label: "এসি ও অ্যাপ্লায়েন্স (AC)", icon: FaFan, color: "from-emerald-600 to-green-600", border: "border-emerald-500/50" },
  { id: "Other", label: "অন্যান্য (Others)", icon: FaBoxOpen, color: "from-slate-600 to-slate-800", border: "border-slate-500/50" },
];

export const CATEGORY_BRANDS = {
  Mobile: ["Samsung", "Vivo", "Xiaomi", "Realme", "Oppo", "Tecno", "Infinix", "iPhone", "Symphony", "Walton", "Honor"],
  TV: ["Walton", "Samsung", "Sony", "Singer", "LG", "Vision", "Xiaomi", "Haier", "Minister"],
  Fridge: ["Walton", "Singer", "Vision", "Haier", "Samsung", "LG", "Marcel", "Minister", "Hitachi"],
  IPS: ["Luminous", "Sukam", "Rahimafrooz", "Hamko", "Microtek", "Lucas", "Voltas", "Navana"],
  AC: ["Gree", "Walton", "General", "Midea", "Singer", "Haier", "Carrier", "LG"],
  Other: ["Walton", "Vision", "Singer", "Panasonic", "Philips", "Havells"],
};

export const CATEGORY_VARIANTS = {
  Mobile: [
    "3GB + 32GB",
    "3GB + 64GB",
    "4GB + 64GB",
    "4GB + 128GB",
    "6GB + 128GB",
    "6GB + 256GB",
    "8GB + 128GB",
    "8GB + 256GB",
    "8GB + 512GB",
    "12GB + 256GB",
    "12GB + 512GB",
  ],
  TV: [
    "24 Inch LED",
    "32 Inch Smart HD",
    "40 Inch Smart FHD",
    "43 Inch 4K Google TV",
    "50 Inch 4K UHD",
    "55 Inch 4K OLED",
    "65 Inch 4K Smart TV",
  ],
  Fridge: [
    "150 Litre Direct Cool",
    "175 Litre Glass Door",
    "213 Litre Inverter",
    "250 Litre Direct Cool",
    "300 Litre Non-Frost",
    "Deep Freezer 150L",
    "Deep Freezer 200L",
    "Side-by-Side 550L",
  ],
  IPS: [
    "600VA Pure Sine Wave",
    "850VA Solar IPS",
    "1050VA Eco Volt Neo",
    "1500VA Heavy Duty",
    "130Ah Tubular Battery",
    "150Ah Tall Tubular",
    "200Ah Heavy Duty Battery",
  ],
  AC: [
    "1.0 Ton Non-Inverter",
    "1.0 Ton Dual Inverter",
    "1.5 Ton Inverter (Eco)",
    "1.5 Ton Heavy Cooling",
    "2.0 Ton Dual Inverter",
  ],
  Other: ["Standard", "Compact", "Heavy Duty", "Premium Edition"],
};

const AddStockModal = ({
  setIsOpen,
  handleSubmit,
  handleChange,
  formData,
  setFormData,
  inputClass,
  brandInput,
  setBrandInput,
  showSuggestions,
  setShowSuggestions,
  filteredBrands,
  showVariantSuggestions,
  setShowVariantSuggestions,
  filteredVariants,
  variantInput,
  setVariantInput,
}) => {
  const selectedCategory = formData.category || "Mobile";
  const [imagePreview, setImagePreview] = useState(null);

  const handleCategorySelect = (catId) => {
    setFormData((prev) => ({
      ...prev,
      category: catId,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const currentBrands = CATEGORY_BRANDS[selectedCategory] || CATEGORY_BRANDS.Other;
  const currentVariants = CATEGORY_VARIANTS[selectedCategory] || CATEGORY_VARIANTS.Other;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={() => setIsOpen(false)}
      ></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-3xl border border-slate-700/80 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <FaLayerGroup className="text-xl" />
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                নতুন প্রোডাক্ট স্টক এন্ট্রি (Add Product Stock)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                মোবাইল, ফ্রিজ, টিভি, আইপিএস ও অন্যান্য ইলেকট্রনিক্স পণ্যের তথ্য যুক্ত করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-5">
          {/* Category Selector Cards */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <FaTag className="text-cyan-400 text-[11px]" />
              <span>প্রোডাক্ট ক্যাটাগরি নির্বাচন করুন (Category) *</span>
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
                <span>ক্রয়ের তারিখ (Purchase Date) *</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Brand with Smart Suggestions */}
            <div className="relative">
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaTag className="text-indigo-400 text-[11px]" />
                <span>ব্র্যান্ড (Brand) *</span>
              </label>
              <input
                type="text"
                name="brand"
                value={brandInput}
                placeholder={`যেমন: ${currentBrands[0] || "Samsung"}`}
                onChange={(e) => {
                  setBrandInput(e.target.value);
                  setShowSuggestions(true);
                  setFormData({
                    ...formData,
                    brand: e.target.value,
                  });
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
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
                          setFormData({
                            ...formData,
                            brand: b,
                          });
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
                <span>মডেল / প্রোডাক্টের নাম (Model Name) *</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                placeholder={
                  selectedCategory === "Mobile"
                    ? "যেমন: Galaxy A15, Vivo Y05e"
                    : selectedCategory === "Fridge"
                    ? "যেমন: 213L Glass Door, Direct Cool"
                    : selectedCategory === "TV"
                    ? "যেমন: 43 Inch 4K Android Google TV"
                    : selectedCategory === "IPS"
                    ? "যেমন: 1050VA Eco Volt + 150Ah"
                    : "যেমন: 1.5 Ton Split Inverter"
                }
                onChange={handleChange}
                required
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Variant / Capacity / Size */}
            <div className="relative">
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <span>
                  {selectedCategory === "Mobile"
                    ? "ভেরিয়েন্ট / র্যাম-রম (RAM + Storage) *"
                    : selectedCategory === "Fridge"
                    ? "ক্যাপাসিটি / ধারণক্ষমতা (Capacity) *"
                    : selectedCategory === "TV"
                    ? "স্ক্রিন সাইজ ও ডিসপ্লে (Size / Display) *"
                    : selectedCategory === "IPS"
                    ? "পাওয়ার / ব্যাটারি সাইজ (Specs) *"
                    : "সাইজ / টাইপ / স্পেসিফিকেশন *"}
                </span>
              </label>
              <input
                type="text"
                name="variant"
                value={variantInput}
                placeholder={`যেমন: ${currentVariants[0] || "8GB + 128GB"}`}
                onChange={(e) => {
                  setVariantInput(e.target.value);
                  setShowVariantSuggestions(true);
                  setFormData({
                    ...formData,
                    variant: e.target.value,
                  });
                }}
                onFocus={() => setShowVariantSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVariantSuggestions(false), 200)}
                required
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
                          setFormData({
                            ...formData,
                            variant: v,
                          });
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
                value={formData.color}
                placeholder="যেমন: Black, Blue, Silver, Golden, Maroon"
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
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
                placeholder="যেমন: Official Distributor, Showroom, Dhaka Dealer"
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500`}
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-amber-400 text-[11px]" />
                <span>ক্রয়মূল্য (Purchase Price ৳) *</span>
              </label>
              <input
                type="number"
                step="any"
                name="purchase_price"
                value={formData.purchase_price}
                placeholder="যেমন: 15000"
                onChange={handleChange}
                required
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500 font-mono font-bold`}
              />
            </div>

            {/* MRP / Sale Price */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FaMoneyBillWave className="text-emerald-400 text-[11px]" />
                <span>এমআরপি / সম্ভাব্য বিক্রয়মূল্য (MRP ৳)</span>
              </label>
              <input
                type="number"
                step="any"
                name="mrp"
                value={formData.mrp}
                placeholder="যেমন: 18500"
                onChange={handleChange}
                className={`${inputClass} w-full rounded-xl bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-500 font-mono font-bold`}
              />
            </div>

            {/* Product / IMEI Image Upload */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                প্রোডাক্ট / আইএমইআই / রসিদের ছবি (Product Image / IMEI Photo)
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
                        setFormData((prev) => ({ ...prev, image: "" }));
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
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600/30 file:text-indigo-300 hover:file:bg-indigo-600/50 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    PNG, JPG, WEBP ফাইল সর্বোচ্চ 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition active:scale-95"
            >
              স্টক যোগ করুন (Save Product Stock)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;
