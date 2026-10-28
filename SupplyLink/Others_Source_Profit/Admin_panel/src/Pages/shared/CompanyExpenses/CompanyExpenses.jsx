import React, { useMemo, useState, useEffect, useRef } from "react";
import useCashReports from "../../../utils/Hooks/cash/useCashReports";
import useCashCategories from "../../../utils/Hooks/cash/useCashCategories";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import CashOutModal from "../../../components/cash/CashOutModal";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaRedoAlt,
  FaTimes,
  FaReceipt,
  FaTag,
  FaCheckCircle,
  FaClock,
  FaBuilding,
  FaFilter,
  FaChevronDown,
  FaCheck,
  FaLayerGroup,
  FaCalendarDay,
  FaCalendarWeek,
  FaArrowsAltH,
} from "react-icons/fa";
import { ChevronLeft, ChevronRight, SlidersHorizontal, CalendarDays } from "lucide-react";

const formatMoney = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(Number(n || 0));

// Normalize category slugs to prevent duplicate "অন্যান্য" or aliases
const normalizeCategory = (raw) => {
  if (!raw) return "other";
  const s = String(raw).toLowerCase().trim();
  if (s === "other" || s === "others" || s === "general" || s === "অন্যান্য") return "other";
  return s;
};

export default function CompanyExpenses() {
  const { CashReports, isCashReportsLoading, refetch } = useCashReports();
  const { getCategoryName, getCategoryStyle } = useCashCategories();

  // Search & Filters
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const dropdownRef = useRef(null);
  const [openAddModal, setOpenAddModal] = useState(false);

  // 🌟 Date Modes: 'all' | 'day' | 'month' | 'year' | 'range'
  const [dateMode, setDateMode] = useState("all");
  const [singleDate, setSingleDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Strictly Company Expenses ONLY
  const companyExpenses = useMemo(() => {
    if (!Array.isArray(CashReports)) return [];
    return CashReports.filter((c) => c.source === "company-expense");
  }, [CashReports]);

  // 2. Extract Available Years dynamically from data
  const availableYears = useMemo(() => {
    const set = new Set();
    const currentYear = String(new Date().getFullYear());
    set.add(currentYear);
    companyExpenses.forEach((x) => {
      if (x.date) {
        const y = String(x.date).split("-")[0];
        if (y && y.length === 4) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [companyExpenses]);

  // 3. Dynamically extract unique categories with normalized slugs
  const availableCategories = useMemo(() => {
    const counts = {};
    companyExpenses.forEach((x) => {
      const cat = normalizeCategory(x.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([slug, count]) => ({
        slug,
        name: getCategoryName(slug),
        count,
        style: getCategoryStyle(slug),
      }))
      .sort((a, b) => b.count - a.count);
  }, [companyExpenses, getCategoryName, getCategoryStyle]);

  // Categories filtered by live search inside the dropdown
  const filteredCategoriesForDropdown = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    const term = categorySearch.trim().toLowerCase();
    return availableCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term)
    );
  }, [availableCategories, categorySearch]);

  // Quick 1-click Date Preset Handlers
  const handleSetToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setDateMode("day");
    setSingleDate(todayStr);
    setCurrentPage(1);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setDateMode("month");
    setSelectedMonth(monthStr);
    setCurrentPage(1);
  };

  const handleSetThisYear = () => {
    const yearStr = String(new Date().getFullYear());
    setDateMode("year");
    setSelectedYear(yearStr);
    setCurrentPage(1);
  };

  // 4. Dynamic Metrics Calculation
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let totalSum = 0;
    let thisMonthSum = 0;
    let todaySum = 0;

    companyExpenses.forEach((x) => {
      const amt = Number(x.amount || 0);
      totalSum += amt;
      if (x.date && x.date.startsWith(currentYearMonth)) {
        thisMonthSum += amt;
      }
      if (x.date && x.date.startsWith(todayStr)) {
        todaySum += amt;
      }
    });

    return {
      totalSum,
      thisMonthSum,
      todaySum,
      totalCount: companyExpenses.length,
    };
  }, [companyExpenses]);

  // 5. Filtered expenses based on search & multi-mode date & category
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return companyExpenses.filter((x) => {
      // Search
      const matchSearch =
        !s ||
        String(x.id).includes(s) ||
        (x.purpose || "").toLowerCase().includes(s) ||
        (x.remarks || "").toLowerCase().includes(s) ||
        (x.category || "").toLowerCase().includes(s) ||
        (x.date || "").toLowerCase().includes(s);

      // Category
      const itemCat = normalizeCategory(x.category);
      const matchCategory =
        selectedCategory === "all" || itemCat === selectedCategory;

      // 🌟 Date Filtering by Mode
      let matchDate = true;
      if (dateMode === "day" && singleDate) {
        matchDate = x.date === singleDate;
      } else if (dateMode === "month" && selectedMonth) {
        matchDate = x.date && x.date.startsWith(selectedMonth);
      } else if (dateMode === "year" && selectedYear) {
        matchDate = x.date && x.date.startsWith(selectedYear);
      } else if (dateMode === "range") {
        const matchStart = !startDate || (x.date && x.date >= startDate);
        const matchEnd = !endDate || (x.date && x.date <= endDate);
        matchDate = matchStart && matchEnd;
      }

      return matchSearch && matchCategory && matchDate;
    });
  }, [
    companyExpenses,
    q,
    selectedCategory,
    dateMode,
    singleDate,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
  ]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, x) => sum + Number(x.amount || 0), 0),
    [filtered]
  );

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleClearFilters = () => {
    setQ("");
    setSelectedCategory("all");
    setDateMode("all");
    setSingleDate("");
    setSelectedMonth("");
    setSelectedYear("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const selectedCategoryObj = useMemo(() => {
    if (selectedCategory === "all") return null;
    return availableCategories.find((c) => c.slug === selectedCategory);
  }, [selectedCategory, availableCategories]);

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* 🌟 PURE WHITE CALENDAR PICKER INDICATOR STYLES 🌟 */}
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="month"]::-webkit-calendar-picker-indicator,
        .white-calendar-icon::-webkit-calendar-picker-indicator {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") !important;
          background-size: 20px 20px !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          width: 24px !important;
          height: 24px !important;
          cursor: pointer !important;
          opacity: 1 !important;
          filter: none !important;
          -webkit-filter: none !important;
          transition: transform 0.15s ease !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover,
        input[type="month"]::-webkit-calendar-picker-indicator:hover,
        .white-calendar-icon::-webkit-calendar-picker-indicator:hover {
          transform: scale(1.18) !important;
        }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <FaReceipt size={18} />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Company Expenses Tracking
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              কোম্পানির অফিসিয়াল রানিং খরচ (অফিস ভাড়া, বিল, বেতন, আপ্যায়ন, পরিবহন ইত্যাদি)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FaPlus size={11} />
            <span>নতুন খরচ যুক্ত করুন</span>
          </button>
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="রিফ্রেশ"
          >
            <FaRedoAlt size={12} className={isCashReportsLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Company Expenses */}
        <div className="bg-[#0b1329]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <FaMoneyBillWave size={12} className="text-rose-400" /> মোট কোম্পানি খরচ
          </span>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-rose-400 mt-1.5 font-mono">
            {formatMoney(metrics.totalSum)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            মোট {metrics.totalCount} টি খরচের হিসাব
          </p>
        </div>

        {/* This Month's Expenses */}
        <div className="bg-[#0b1329]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
          <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
            <FaCalendarAlt size={12} /> চলতি মাসের খরচ
          </span>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-300 mt-1.5 font-mono">
            {formatMoney(metrics.thisMonthSum)}
          </h3>
          <p className="text-[11px] text-amber-500/80 mt-1">বর্তমান মাসের ব্যয়</p>
        </div>

        {/* Today's Expenses */}
        <div className="bg-[#0b1329]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
          <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
            <FaClock size={12} /> আজকের খরচ
          </span>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-cyan-300 mt-1.5 font-mono">
            {formatMoney(metrics.todaySum)}
          </h3>
          <p className="text-[11px] text-cyan-500/80 mt-1">আজকের পরিশোধিত খরচ</p>
        </div>

        {/* Filtered Total / Items */}
        <div className="bg-[#0b1329]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
          <span className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider block flex items-center gap-1.5">
            <FaFilter size={12} /> ফিল্টারকৃত খরচের যোগফল
          </span>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-1.5 font-mono">
            {formatMoney(filteredTotal)}
          </h3>
          <p className="text-[11px] text-indigo-400 mt-1">
            {filtered.length} টি আইটেম প্রদর্শিত
          </p>
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => {
            setSelectedCategory("all");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === "all"
            ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
            : "bg-[#0b1329]/90 text-slate-400 border border-white/[0.08] hover:text-white hover:bg-white/[0.05]"
            }`}
        >
          <FaLayerGroup size={11} />
          <span>সকল ক্যাটাগরি ({companyExpenses.length})</span>
        </button>

        {availableCategories.slice(0, 8).map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${isSelected
                ? "bg-rose-500/25 border-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-[#0b1329]/90 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? "bg-rose-500 text-white font-bold" : "bg-white/10 text-slate-400"
                  }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Filter & Advanced Controls */}
      <div className={`bg-[#0b1329]/95 border border-white/[0.1] rounded-2xl p-4 space-y-4 backdrop-blur-md shadow-2xl relative ${dropdownOpen ? "z-40" : "z-20"}`}>
        {/* Top row: Search and Category Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Live Search Box */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              অনুসন্ধান (Search)
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="খরচের বিবরণ, মন্তব্য বা আইডি দিয়ে খুঁজুন..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-[#0e172a] border border-white/20 hover:border-white/40 focus:border-rose-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 🌟 Refined High-Contrast Category Dropdown */}
          <div className={`relative ${dropdownOpen ? "z-50" : "z-0"}`} ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>ক্যাটাগরি নির্বাচন (Category)</span>
              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setCurrentPage(1);
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                >
                  রিসেট
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full px-3.5 py-2.5 bg-[#101b33] hover:bg-[#162342] border-2 border-white/20 hover:border-white/40 focus:border-rose-500 rounded-xl text-xs text-white flex items-center justify-between transition-all cursor-pointer shadow-lg active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 truncate">
                <FaTag size={12} className="text-rose-400 shrink-0" />
                <span className="truncate font-bold text-sm text-white">
                  {selectedCategory === "all"
                    ? "সকল ক্যাটাগরি"
                    : selectedCategoryObj?.name || selectedCategory}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-500/50 text-rose-200 font-mono font-bold shrink-0">
                  {selectedCategory === "all"
                    ? `${companyExpenses.length} টি`
                    : `${selectedCategoryObj?.count || 0} টি`}
                </span>
              </div>
              <FaChevronDown
                size={11}
                className={`text-slate-300 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-rose-400" : ""
                  }`}
              />
            </button>

            {/* Dropdown Menu - Sleek Glassmorphic with Category Search */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 sm:min-w-[320px] mt-1.5 z-[9999] bg-[#0d1527] border-2 border-slate-600/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 max-h-[380px] overflow-y-auto custom-scrollbar backdrop-blur-2xl">
                {/* Search inside Category */}
                <div className="relative mb-1.5">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="ক্যাটাগরি খুঁজুন..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#17233d] border border-white/15 focus:border-rose-500 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    autoFocus
                  />
                  {categorySearch && (
                    <button
                      type="button"
                      onClick={() => setCategorySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>

                {/* Option: All Categories */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all mb-1 ${selectedCategory === "all"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/40"
                    : "text-slate-200 hover:bg-white/10"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <FaLayerGroup size={12} className={selectedCategory === "all" ? "text-white" : "text-slate-400"} />
                    <span>সকল ক্যাটাগরি</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/30 text-white font-mono font-bold">
                      {companyExpenses.length} টি
                    </span>
                    {selectedCategory === "all" && <FaCheck size={11} className="text-white" />}
                  </div>
                </button>

                <div className="my-1 border-t border-white/10" />

                {/* Category Items List */}
                <div className="space-y-0.5">
                  {filteredCategoriesForDropdown.length === 0 ? (
                    <div className="py-3 text-center text-xs text-slate-400">
                      কোনো ক্যাটাগরি পাওয়া যায়নি
                    </div>
                  ) : (
                    filteredCategoriesForDropdown.map((cat) => {
                      const isCurrent = selectedCategory === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${isCurrent
                            ? "bg-rose-500/20 border-2 border-rose-500 text-white font-bold shadow-md shadow-rose-500/20"
                            : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${cat.style}`}
                            >
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-200 font-mono font-bold shrink-0">
                              {cat.count} টি
                            </span>
                            {isCurrent && <FaCheck size={10} className="text-rose-400" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Clear Filter Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99]"
            >
              <FaRedoAlt size={11} />
              <span>সব ফিল্টার ক্লিয়ার করুন</span>
            </button>
          </div>
        </div>

        {/* 🌟 HIGH-CONTRAST DARK DATE FILTER SYSTEM (Dark background with bright white calendar icon) */}
        <div className="pt-3 border-t border-white/[0.08] space-y-3">
          {/* Header Row: Title & Quick Date Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FaCalendarAlt size={13} />
              </span>
              <div>
                <span className="text-white font-bold">তারিখ নির্বাচন (Date Filter)</span>
              </div>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">কুইক সিলেক্ট:</span>
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold transition cursor-pointer"
              >
                ⚡ আজকের খরচ
              </button>
              <button
                type="button"
                onClick={handleSetThisMonth}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition cursor-pointer"
              >
                ⚡ চলতি মাস
              </button>
              <button
                type="button"
                onClick={handleSetThisYear}
                className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-[11px] font-bold transition cursor-pointer"
              >
                ⚡ চলতি বছর
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateMode("all");
                  setSingleDate("");
                  setSelectedMonth("");
                  setSelectedYear("");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold transition cursor-pointer"
              >
                🌐 সব সময়
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#080d19] p-1.5 rounded-xl border border-white/15">
            {[
              { id: "all", label: "সব সময় (All Time)", icon: FaLayerGroup },
              { id: "day", label: "নির্দিষ্ট দিন (Single Date)", icon: FaCalendarDay },
              { id: "month", label: "নির্দিষ্ট মাস (Month)", icon: FaCalendarAlt },
              { id: "year", label: "নির্দিষ্ট বছর (Year)", icon: FaClock },
              { id: "range", label: "তারিখ পরিসীমা (Range)", icon: FaArrowsAltH },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = dateMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setDateMode(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-[1.02]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                >
                  <TabIcon size={12} className={isActive ? "text-white" : "text-slate-400"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 🌟 DARK INPUT CARD WITH WHITE CALENDAR ICONS 🌟 */}
          <div className="p-4 bg-gradient-to-r from-[#0d1629] via-[#0f1b34] to-[#0d1629] border-2 border-rose-500/40 rounded-2xl shadow-2xl">
            {/* Mode 1: All Time Info */}
            {dateMode === "all" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-200 font-semibold">
                    বর্তমানে <strong>সব সময়ের</strong> খরচের তালিকা প্রদর্শিত হচ্ছে (মোট{" "}
                    <strong className="text-rose-400 font-mono text-sm">{filtered.length}</strong> টি রেকর্ড)।
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  নির্দিষ্ট দিন, মাস, বছর বা পরিসীমা দেখতে উপরের বাটনে ক্লিক করুন।
                </div>
              </div>
            )}

            {/* Mode 2: Single Day Picker (DARK INPUT + WHITE CALENDAR ICON) */}
            {dateMode === "day" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white">
                    <FaCalendarDay className="text-rose-400" />
                    <span>যেকোনো একটি নির্দিষ্ট দিন নির্বাচন করুন (Click to pick date):</span>
                  </label>
                  {singleDate && (
                    <button
                      type="button"
                      onClick={() => setSingleDate("")}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-bold"
                    >
                      ক্লিয়ার করুন
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => {
                      setSingleDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ colorScheme: "dark" }}
                    className="w-full sm:w-80 px-4 py-2.5 bg-[#0e172a] text-white border-2 border-white/20 hover:border-white/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 rounded-xl text-sm font-mono font-bold shadow-xl cursor-pointer outline-none transition-all white-calendar-icon"
                  />
                  {singleDate ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl">
                      ✓ নির্বাচিত দিন: <strong className="font-mono text-white">{singleDate}</strong>
                    </span>
                  ) : (
                    <span className="text-xs text-amber-300 font-medium">
                      ← ক্যালেন্ডার আইকনে ক্লিক করে দিন নির্বাচন করুন
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Month Picker (DARK INPUT + WHITE CALENDAR ICON) */}
            {dateMode === "month" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white">
                    <FaCalendarAlt className="text-amber-400" />
                    <span>যেকোনো নির্দিষ্ট মাস নির্বাচন করুন (Click to pick month):</span>
                  </label>
                  {selectedMonth && (
                    <button
                      type="button"
                      onClick={() => setSelectedMonth("")}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-bold "
                    >
                      ক্লিয়ার করুন
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ colorScheme: "dark" }}
                    className="w-full  sm:w-80 px-4 py-2.5 bg-[#0e172a] text-white border-2 border-white/20 hover:border-white/40 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 rounded-xl text-sm font-mono font-bold shadow-xl cursor-pointer outline-none transition-all white-calendar-icon"
                  />
                  {selectedMonth ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl">
                      ✓ নির্বাচিত মাস: <strong className="font-mono text-white">{selectedMonth}</strong>
                    </span>
                  ) : (
                    <span className="text-xs text-amber-300 font-medium">
                      ← ক্যালেন্ডার আইকনে ক্লিক করে মাস নির্বাচন করুন
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mode 4: Year Picker (DARK INPUT + WHITE CHEVRON) */}
            {dateMode === "year" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white">
                    <FaClock className="text-cyan-400" />
                    <span>কোন বছরের খরচ দেখতে চান নির্বাচন করুন:</span>
                  </label>
                  {selectedYear && (
                    <button
                      type="button"
                      onClick={() => setSelectedYear("")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline font-bold"
                    >
                      ক্লিয়ার করুন
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ colorScheme: "dark" }}
                    className="w-full sm:w-80 px-4 py-2.5 bg-[#0e172a] text-white border-2 border-white/20 hover:border-white/40 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 rounded-xl text-sm font-bold shadow-xl cursor-pointer outline-none transition-all"
                  >
                    <option value="" className="bg-[#0e172a] text-slate-300">সকল বছর (All Years)</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr} className="bg-[#0e172a] text-white font-bold">
                        {yr} সাল
                      </option>
                    ))}
                  </select>
                  {selectedYear ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl">
                      ✓ নির্বাচিত বছর: <strong className="font-mono text-white">{selectedYear}</strong> সাল
                    </span>
                  ) : (
                    <span className="text-xs text-cyan-300 font-medium">
                      ← ড্রপডাউন থেকে বছর নির্বাচন করুন
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mode 5: Custom Range Picker (DARK INPUTS + WHITE CALENDAR ICONS) */}
            {dateMode === "range" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white">
                    <FaArrowsAltH className="text-emerald-400" />
                    <span>শুরুর তারিখ ও শেষ তারিখ নির্বাচন করুন (Date Range):</span>
                  </label>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline font-bold"
                    >
                      ক্লিয়ার করুন
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-300">হতে (From):</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ colorScheme: "dark" }}
                      className="w-full px-3.5 py-2 bg-[#0e172a] text-white border-2 border-white/20 hover:border-white/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-mono font-bold shadow-xl cursor-pointer outline-none transition-all white-calendar-icon"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-300">পর্যন্ত (To):</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ colorScheme: "dark" }}
                      className="w-full px-3.5 py-2 bg-[#0e172a] text-white border-2 border-white/20 hover:border-white/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-mono font-bold shadow-xl cursor-pointer outline-none transition-all white-calendar-icon"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {(selectedCategory !== "all" || q || dateMode !== "all") && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.08] text-xs">
            <span className="text-slate-400 font-semibold">সক্রিয় ফিল্টার:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">
                ক্যাটাগরি: {selectedCategoryObj?.name || selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="hover:text-white ml-1">
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {dateMode === "day" && singleDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold font-mono">
                দিন: {singleDate}
                <button onClick={() => setSingleDate("")} className="hover:text-white ml-1">
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {dateMode === "month" && selectedMonth && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold font-mono">
                মাস: {selectedMonth}
                <button onClick={() => setSelectedMonth("")} className="hover:text-white ml-1">
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {dateMode === "year" && selectedYear && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold font-mono">
                বছর: {selectedYear}
                <button onClick={() => setSelectedYear("")} className="hover:text-white ml-1">
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {dateMode === "range" && (startDate || endDate) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold font-mono">
                পরিসীমা: {startDate || "শুরু"} থেকে {endDate || "বর্তমান"}
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="hover:text-white ml-1"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white font-semibold">
                সার্চ: "{q}"
                <button onClick={() => setQ("")} className="hover:text-white ml-1">
                  <FaTimes size={10} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-[#0b1329]/95 border border-white/[0.1] rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative z-10">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              কোম্পানি খরচের তালিকা ({filtered.length})
            </h2>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            ফিল্টারকৃত যোগফল: <strong className="text-rose-400 text-sm">{formatMoney(filteredTotal)}</strong>
          </span>
        </div>

        {isCashReportsLoading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500">
              <FaReceipt size={24} />
            </div>
            <p className="text-slate-200 font-bold text-base">কোনো খরচের রেকর্ড পাওয়া যায়নি</p>
            <p className="text-slate-400 text-xs">
              সার্চ, তারিখ বা ক্যাটাগরি ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/[0.04] text-slate-300 border-b border-white/[0.08] font-bold">
                  <th className="py-3.5 px-3 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 w-28 whitespace-nowrap">তারিখ (Date)</th>
                  <th className="py-3.5 px-3 w-36 whitespace-nowrap">ক্যাটাগরি</th>
                  <th className="py-3.5 px-3 min-w-[200px]">খরচের পূর্ণ বিবরণ (Purpose)</th>
                  <th className="py-3.5 px-3 min-w-[150px]">মন্তব্য (Remarks)</th>
                  <th className="py-3.5 px-3 w-28 text-center whitespace-nowrap">অনুমোদন অবস্থা</th>
                  <th className="py-3.5 px-3 w-36 text-right whitespace-nowrap">পরিমাণ (Amount)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.05]">
                {paginatedRows.map((row, idx) => {
                  const isApproved =
                    !row.approval_status ||
                    row.approval_status.toLowerCase() === "approved";
                  const serial = (currentPage - 1) * pageSize + idx + 1;
                  const itemCat = normalizeCategory(row.category);

                  return (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* # SL & ID */}
                      <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                        <span className="font-bold text-white text-xs">{serial}</span>
                        <div className="text-[10px] text-slate-400 font-semibold">#{row.id}</div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-200">
                        <div className="flex items-center gap-1.5 font-bold">
                          <FaCalendarAlt size={11} className="text-slate-400" />
                          <span>{row.date}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getCategoryStyle(
                            itemCat
                          )}`}
                        >
                          {getCategoryName(itemCat)}
                        </span>
                      </td>

                      {/* Purpose - FULL TEXT VISIBLE (No 15-char cut off!) */}
                      <td className="py-4 px-4">
                        <p className="text-white font-medium text-xs sm:text-[13px] leading-relaxed break-words">
                          {row.purpose || "—"}
                        </p>
                      </td>

                      {/* Remarks - FULL TEXT VISIBLE */}
                      <td className="py-4 px-4">
                        {row.remarks ? (
                          <p className="text-slate-300 text-xs leading-relaxed break-words">
                            {row.remarks}
                          </p>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <FaCheckCircle size={9} />
                            <span>অনুমোদিত</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <FaClock size={9} />
                            <span>অপেক্ষমান</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-xl shadow-sm">
                          {formatMoney(row.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filtered.length > pageSize && (
          <div className="px-5 py-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-300 font-mono">
              মোট <strong className="text-white font-bold">{filtered.length}</strong> টির মধ্যে{" "}
              <strong className="text-white font-bold">{(currentPage - 1) * pageSize + 1}</strong> থেকে{" "}
              <strong className="text-white font-bold">
                {Math.min(currentPage * pageSize, filtered.length)}
              </strong>{" "}
              প্রদর্শিত হচ্ছে
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>পূর্ববর্তী</span>
              </button>

              <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>পরবর্তী</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Company Expense Modal */}
      {openAddModal && (
        <CashOutModal
          isOpen={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSuccess={() => {
            setOpenAddModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
