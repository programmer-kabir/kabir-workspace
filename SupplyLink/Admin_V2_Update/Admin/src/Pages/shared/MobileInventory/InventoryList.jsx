import React, { useState, useMemo } from "react";
import {
  FaBoxes,
  FaPlus,
  FaSearch,
  FaCalendarAlt,
  FaSyncAlt,
  FaEdit,
  FaTrashAlt,
  FaMobileAlt,
  FaTv,
  FaSnowflake,
  FaBatteryFull,
  FaFan,
  FaBoxOpen,
  FaTag,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaHistory,
} from "react-icons/fa";
import useMobileInventory from "../../../utils/Hooks/useMobileInventory";
import AddStockModal, {
  CATEGORIES,
  CATEGORY_BRANDS,
  CATEGORY_VARIANTS,
} from "../../../components/Dashboard/MobileInventory/AddStockModal";
import EditStockModal from "../../../components/Dashboard/MobileInventory/EditStockModal";
import StockHistoryModal from "../../../components/Dashboard/MobileInventory/StockHistoryModal";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const CATEGORY_ICON_MAP = {
  Mobile: FaMobileAlt,
  TV: FaTv,
  Fridge: FaSnowflake,
  IPS: FaBatteryFull,
  AC: FaFan,
  Other: FaBoxOpen,
};

const CATEGORY_BADGE_STYLE = {
  Mobile: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  TV: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Fridge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  IPS: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  AC: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Other: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const InventoryList = () => {
  const { isStockMobilesError, isStockMobilesLoading, refetch, stockMobiles } =
    useMobileInventory();

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [historyModalItem, setHistoryModalItem] = useState(null);

  // Form states for Add modal
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Mobile",
    brand: "",
    model: "",
    variant: "",
    color: "",
    image: "",
    purchase_price: "",
    mrp: "",
    supplier: "",
    status: "available",
  });

  const [brandInput, setBrandInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [variantInput, setVariantInput] = useState("");
  const [showVariantSuggestions, setShowVariantSuggestions] = useState(false);

  const inputClass =
    "bg-slate-900 text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs";

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Filtered stocks list
  const filteredStocks = useMemo(() => {
    if (!stockMobiles || !Array.isArray(stockMobiles)) return [];

    return stockMobiles.filter((item) => {
      // Category filter
      const itemCat = item.category || "Mobile";
      if (selectedCategory !== "ALL" && itemCat.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (startDate || endDate) {
        const itemDate = new Date(item.date);
        if (startDate && new Date(startDate) > itemDate) return false;
        if (endDate && new Date(endDate) < itemDate) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const brandMatch = item.brand?.toLowerCase().includes(q);
        const modelMatch = item.model?.toLowerCase().includes(q);
        const variantMatch = item.variant?.toLowerCase().includes(q);
        const colorMatch = item.color?.toLowerCase().includes(q);
        const supplierMatch = item.supplier?.toLowerCase().includes(q);
        const catMatch = (item.category || "Mobile").toLowerCase().includes(q);
        return brandMatch || modelMatch || variantMatch || colorMatch || supplierMatch || catMatch;
      }

      return true;
    });
  }, [stockMobiles, selectedCategory, statusFilter, startDate, endDate, searchQuery]);

  // Overall & Filtered KPI stats
  const stats = useMemo(() => {
    const list = Array.isArray(stockMobiles) ? stockMobiles : [];
    const totalItems = list.length;
    const availableItems = list.filter((i) => i && i.status === "available").length;
    const soldItems = list.filter((i) => i && i.status === "sold").length;
    const totalPurchase = list.reduce((acc, curr) => acc + (parseFloat(curr?.purchase_price) || 0), 0);
    const totalMRP = list.reduce((acc, curr) => acc + (parseFloat(curr?.mrp) || 0), 0);

    return { totalItems, availableItems, soldItems, totalPurchase, totalMRP };
  }, [stockMobiles]);

  // Handle Add Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.brand ||
      !formData.model ||
      !formData.date ||
      !formData.purchase_price ||
      !formData.variant
    ) {
      toast.info("প্রয়োজনীয় সব তথ্য পূরণ করুন!");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "image") {
          if (formData.image instanceof File) {
            data.append("image", formData.image);
          }
        } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Inventory/addMobileStock.php`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        toast.success("নতুন স্টক সফলভাবে যুক্ত হয়েছে! ✅");
        setIsOpen(false);
        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          category: "Mobile",
          brand: "",
          model: "",
          variant: "",
          color: "",
          image: "",
          purchase_price: "",
          mrp: "",
          supplier: "",
          status: "available",
        });
        setBrandInput("");
        setVariantInput("");
        refetch();
      } else {
        toast.error(res.data?.message || "স্টক যোগ করতে সমস্যা হয়েছে ❌");
      }
    } catch (error) {
      toast.error("Error adding stock ❌");
    }
  };

  // Open Edit modal
  const handleEdit = (item) => {
    setEditData(item);
    setIsEditOpen(true);
  };

  // Handle Update Submit
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      Object.keys(editData).forEach((key) => {
        if (key === "new_image" || key === "image_file") {
          if (editData[key] instanceof File) {
            data.append("image", editData[key]);
          }
        } else if (key !== "image" && editData[key] !== null && editData[key] !== undefined) {
          data.append(key, editData[key]);
        }
      });

      // Pass old image filename
      if (typeof editData.image === "string" && editData.image) {
        data.append("old_image", editData.image);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Inventory/updateMobileStock.php`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        toast.success("স্টকের তথ্য আপডেট সম্পন্ন হয়েছে ✅");
        setIsEditOpen(false);
        refetch();
      } else {
        toast.error(res.data?.message || "Update failed ❌");
      }
    } catch (err) {
      toast.error("Update failed ❌");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "এই স্টকটি চিরতরে মুছে ফেলা হবে!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#475569",
      confirmButtonText: "হ্যাঁ, মুছে ফেলুন!",
      cancelButtonText: "বাতিল",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Inventory/deleteMobileStock.php?id=${id}`
      );

      if (res.data?.success) {
        Swal.fire({
          title: "মুছে ফেলা হয়েছে!",
          text: "স্টক রেকর্ড সফলভাবে ডিলিট হয়েছে।",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: "#0f172a",
          color: "#f8fafc",
        });
        refetch();
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Delete failed ❌",
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (
      imgPath.startsWith("http://") ||
      imgPath.startsWith("https://") ||
      imgPath.startsWith("blob:") ||
      imgPath.startsWith("data:")
    ) {
      return imgPath;
    }
    const cleanPath = imgPath.replace(/^\/+/, "");
    const baseApi = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";
    const serverHost = baseApi.replace(/\/apis\/?.*$/, "");
    return `${serverHost}/${cleanPath}`;
  };

  return (
    <div className="min-h-screen p-3 md:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25">
              <FaBoxes className="text-2xl md:text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                  প্রোডাক্ট ও স্টক ইনভেন্টরি
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Universal Inventory
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                মোবাইল, ফ্রিজ, টিভি, আইপিএস ও ইলেকট্রনিক্স পণ্যের স্টক এবং ইনভেন্টরি পর্যবেক্ষণ
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              title="রিফ্রেশ করুন"
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition shadow-sm"
            >
              <FaSyncAlt className={`text-sm ${isStockMobilesLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={() => {
                setBrandInput("");
                setVariantInput("");
                setIsOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 transition"
            >
              <FaPlus className="text-xs" />
              <span>নতুন স্টক যোগ করুন (+ Add)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total Stock */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">মোট আইটেম</p>
            <h3 className="text-xl md:text-2xl font-black text-white mt-1">
              {stats.totalItems} <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FaBoxes className="text-lg" />
          </div>
        </div>

        {/* Available Items */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">মজুদ আছে (Available)</p>
            <h3 className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
              {stats.availableItems} <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FaCheckCircle className="text-lg" />
          </div>
        </div>

        {/* Sold Items */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">বিক্রিত (Sold)</p>
            <h3 className="text-xl md:text-2xl font-black text-rose-400 mt-1">
              {stats.soldItems} <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FaTimesCircle className="text-lg" />
          </div>
        </div>

        {/* Total Purchase Value */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">মোট ক্রয়মূল্য</p>
            <h3 className="text-lg md:text-xl font-black text-amber-400 mt-1">
              ৳ {(stats.totalPurchase || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FaMoneyBillWave className="text-lg" />
          </div>
        </div>

        {/* Total Expected MRP */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">মোট বিক্রয়মূল্য (MRP)</p>
            <h3 className="text-lg md:text-xl font-black text-cyan-400 mt-1">
              ৳ {(stats.totalMRP || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FaTag className="text-lg" />
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === "ALL"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
          }`}
        >
          <FaBoxes className="text-sm" />
          <span>সব ক্যাটাগরি (All Products)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
            {Array.isArray(stockMobiles) ? stockMobiles.length : 0}
          </span>
        </button>

        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count =
            (Array.isArray(stockMobiles) ? stockMobiles : []).filter(
              (i) => (i?.category || "Mobile").toLowerCase() === cat.id.toLowerCase()
            ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg shadow-indigo-500/25`
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              <Icon className="text-sm" />
              <span>{cat.label}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 md:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ব্র্যান্ড, মডেল, কালার বা সাপ্লায়ার খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right side filter controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            {["ALL", "available", "sold"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? st === "available"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : st === "sold"
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                      : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st === "ALL" ? "সকল স্ট্যাটাস" : st === "available" ? "মজুদ আছে" : "বিক্রিত"}
              </button>
            ))}
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-800">
            <FaCalendarAlt className="text-slate-400 text-xs" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            />
            <span className="text-slate-500 text-xs">থেকে</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
          >
            রিসেট
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">ছবি</th>
                <th className="px-5 py-4">ক্যাটাগরি ও ব্র্যান্ড</th>
                <th className="px-5 py-4">মডেল ও স্পেসিফিকেশন</th>
                <th className="px-5 py-4">কালার / রঙ</th>
                <th className="px-5 py-4">তারিখ</th>
                <th className="px-5 py-4">ক্রয়মূল্য</th>
                <th className="px-5 py-4">এমআরপি (MRP)</th>
                <th className="px-5 py-4">সাপ্লায়ার</th>
                <th className="px-5 py-4">স্ট্যাটাস</th>
                <th className="px-5 py-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/50 text-slate-500">
                        <FaBoxOpen className="text-4xl text-slate-400" />
                      </div>
                      <p className="text-base font-bold text-slate-300">কোনো স্টক ডাটা পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        ফিল্টার অপশন পরিবর্তন করুন অথবা নতুন পণ্য স্টক যুক্ত করতে উপরের বাটনে ক্লিক করুন।
                      </p>
                      <button
                        onClick={() => {
                          setBrandInput("");
                          setVariantInput("");
                          setIsOpen(true);
                        }}
                        className="mt-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition"
                      >
                        + নতুন স্টক যোগ করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => {
                  const categoryName = item?.category || "Mobile";
                  const CatIcon = CATEGORY_ICON_MAP[categoryName] || FaBoxes;
                  const badgeClass = CATEGORY_BADGE_STYLE[categoryName] || CATEGORY_BADGE_STYLE.Other;
                  const imgUrl = getImageUrl(item?.image);

                  return (
                    <tr
                      key={item?.id}
                      className="hover:bg-slate-800/40 transition duration-150 group"
                    >
                      {/* Product Image Thumbnail */}
                      <td className="px-5 py-3.5">
                        {imgUrl ? (
                          <div
                            onClick={() => setPreviewImageModal(imgUrl)}
                            className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 cursor-pointer group-hover:border-cyan-500/50 transition"
                          >
                            <img
                              src={imgUrl}
                              alt={item?.model}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.classList.add("flex", "items-center", "justify-center");
                                e.target.parentElement.innerHTML = '<span class="text-slate-500 text-xs">📷</span>';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-[10px]">
                              <FaEye />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                            <CatIcon className="text-lg text-slate-400" />
                          </div>
                        )}
                      </td>

                      {/* Category & Brand */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${badgeClass}`}
                          >
                            <CatIcon className="text-[10px]" />
                            <span>{categoryName}</span>
                          </span>
                          <span className="font-bold text-white text-sm">
                            {item?.brand || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Model & Variant */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-200 font-bold text-xs">{item?.model}</span>
                          <span className="text-cyan-400 font-mono text-[11px] font-medium">
                            {item?.variant || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Color */}
                      <td className="px-5 py-3.5">
                        {item?.color ? (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium text-[11px]">
                            {item.color}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {item?.date || "N/A"}
                      </td>

                      {/* Purchase Price */}
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                        ৳ {parseFloat(item?.purchase_price || 0).toLocaleString()}
                      </td>

                      {/* MRP */}
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                        ৳ {item?.mrp ? parseFloat(item.mrp).toLocaleString() : "-"}
                      </td>

                      {/* Supplier */}
                      <td className="px-5 py-3.5 text-slate-300 text-[11px]">
                        {item?.supplier || "N/A"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${
                            item?.status === "available"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item?.status === "available" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                            }`}
                          ></span>
                          {item?.status === "available" ? "Available" : "Sold Out"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setHistoryModalItem(item)}
                            title={`${item?.edit_count || 0} বার এডিট করা হয়েছে (View Edit History)`}
                            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 text-indigo-400 hover:text-cyan-300 transition"
                          >
                            <FaHistory className="text-xs" />
                            {(item?.edit_count || 0) > 0 ? (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-mono font-black flex items-center justify-center shadow-lg shadow-indigo-500/50 border border-slate-900">
                                {item.edit_count}
                              </span>
                            ) : (
                              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-slate-700 text-slate-300 text-[8px] font-mono font-semibold flex items-center justify-center border border-slate-900">
                                0
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            title="এডিট করুন"
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700/80 text-blue-400 hover:text-cyan-300 transition"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="ডিলিট করুন"
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600/30 border border-slate-700/80 text-rose-400 hover:text-rose-300 transition"
                          >
                            <FaTrashAlt className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white">প্রোডাক্ট / আইএমইআই ফটো প্রিভিউ</h3>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImageModal}
              alt="Preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/40"
            />
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {isOpen && (
        <AddStockModal
          setIsOpen={setIsOpen}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          formData={formData}
          setFormData={setFormData}
          inputClass={inputClass}
          brandInput={brandInput}
          setBrandInput={setBrandInput}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          variantInput={variantInput}
          setVariantInput={setVariantInput}
          showVariantSuggestions={showVariantSuggestions}
          setShowVariantSuggestions={setShowVariantSuggestions}
          filteredBrands={CATEGORY_BRANDS[formData.category || "Mobile"] || []}
          filteredVariants={CATEGORY_VARIANTS[formData.category || "Mobile"] || []}
        />
      )}

      {/* Edit Stock Modal */}
      {isEditOpen && (
        <EditStockModal
          setIsEditOpen={setIsEditOpen}
          handleUpdate={handleUpdate}
          editData={editData}
          setEditData={setEditData}
          inputClass={inputClass}
          brandInput={brandInput}
          setBrandInput={setBrandInput}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          variantInput={variantInput}
          setVariantInput={setVariantInput}
          showVariantSuggestions={showVariantSuggestions}
          setShowVariantSuggestions={setShowVariantSuggestions}
          filteredBrands={CATEGORY_BRANDS[editData?.category || "Mobile"] || []}
          filteredVariants={CATEGORY_VARIANTS[editData?.category || "Mobile"] || []}
        />
      )}

      {/* Stock History Modal */}
      {historyModalItem && (
        <StockHistoryModal
          stockItem={historyModalItem}
          onClose={() => setHistoryModalItem(null)}
        />
      )}
    </div>
  );
};

export default InventoryList;
