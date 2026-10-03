import React, { useState, useMemo, useEffect, useCallback } from "react";
import useSupplierPayments from "../../../utils/Hooks/useSupplierPayments";
import {
  FaFileInvoiceDollar,
  FaPlus,
  FaSearch,
  FaCalendarAlt,
  FaSyncAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBuilding,
  FaStore,
  FaThLarge,
  FaListUl,
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import SupplierPaymentsTable from "../../../components/Dashboard/SupplierPayments/SupplierPaymentsTable";
import SupplierPaymentDetailsModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentDetailsModal";
import SupplierPaymentAddModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentAddModal";
import SupplierPaymentEditModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentEditModal";
import SupplierPaymentHistoryModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentHistoryModal";
import ShopCardsList from "../../../components/Dashboard/SupplierPayments/ShopCardsList";
import AddShopModal from "../../../components/Dashboard/SupplierPayments/AddShopModal";
import EditShopModal from "../../../components/Dashboard/SupplierPayments/EditShopModal";
import PayDueModal from "../../../components/Dashboard/SupplierPayments/PayDueModal";
import ShopLedgerModal from "../../../components/Dashboard/SupplierPayments/ShopLedgerModal";

const SupplierPayments = () => {
  const {
    isSupplierPaymentsError,
    isSupplierPaymentsLoading,
    refetch,
    supplierPayments,
  } = useSupplierPayments();

  // Active View Tab: 'shops' (Shop Cards view) or 'memos' (Table view)
  const [activeView, setActiveView] = useState("shops");

  // Shops State
  const [shops, setShops] = useState([]);
  const [isShopsLoading, setIsShopsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals State
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historyModalItem, setHistoryModalItem] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Shop specific Modals
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [isEditShopOpen, setIsEditShopOpen] = useState(false);
  const [isPayDueOpen, setIsPayDueOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  // Fetch Shops with fallback aggregation
  const fetchShops = useCallback(async () => {
    setIsShopsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/getSupplierShops.php`
      );
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setShops(res.data.data);
        setIsShopsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("getSupplierShops API fallback to client aggregation", err);
    }

    // Client-side fallback: aggregate from supplierPayments
    if (Array.isArray(supplierPayments) && supplierPayments.length > 0) {
      const map = {};
      let autoId = 1;
      supplierPayments.forEach((p) => {
        const name = (p.shop_name || p.supplier || "General Supplier").trim();
        const key = name.toLowerCase();
        if (!map[key]) {
          map[key] = {
            id: autoId++,
            shop_name: name,
            category: "Distributor / Dealer",
            owner_name: p.supplier || "-",
            phone: "-",
            address: "-",
            total_bought: 0,
            total_paid: 0,
            current_due: 0,
            total_memos: 0,
          };
        }
        map[key].total_bought += parseFloat(p.total_amount || 0);
        map[key].total_paid += parseFloat(p.paid || 0);
        map[key].current_due += parseFloat(p.due || 0);
        map[key].total_memos += 1;
      });
      setShops(Object.values(map).sort((a, b) => b.current_due - a.current_due));
    }
    setIsShopsLoading(false);
  }, [supplierPayments]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops, supplierPayments]);

  const handleRefetchAll = () => {
    refetch();
    fetchShops();
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  // Filtered Shops List (for Cards view)
  const filteredShops = useMemo(() => {
    if (!shops || !Array.isArray(shops)) return [];
    if (!searchQuery.trim()) return shops;
    const q = searchQuery.toLowerCase().trim();
    return shops.filter((s) => {
      const nameMatch = s.shop_name?.toLowerCase().includes(q);
      const ownerMatch = s.owner_name?.toLowerCase().includes(q);
      const phoneMatch = s.phone?.toLowerCase().includes(q);
      const addressMatch = s.address?.toLowerCase().includes(q);
      const catMatch = s.category?.toLowerCase().includes(q);
      return nameMatch || ownerMatch || phoneMatch || addressMatch || catMatch;
    });
  }, [shops, searchQuery]);

  // Filtered Payments List (for Table view)
  const filteredPayments = useMemo(() => {
    if (!supplierPayments || !Array.isArray(supplierPayments)) return [];

    return supplierPayments.filter((item) => {
      // Date filter
      if (startDate || endDate) {
        const itemDate = new Date(item.date);
        if (startDate && new Date(startDate) > itemDate) return false;
        if (endDate && new Date(endDate) < itemDate) return false;
      }

      // Status filter
      const total = parseFloat(item.total_amount || 0);
      const paid = parseFloat(item.paid || 0);
      const due = parseFloat(item.due || 0);
      const isPaid = due <= 0 && total > 0;
      const isPartial = due > 0 && paid > 0;
      const isFullDue = due > 0 && paid <= 0;

      if (statusFilter === "PAID" && !isPaid) return false;
      if (statusFilter === "PARTIAL" && !isPartial) return false;
      if (statusFilter === "DUE" && !isFullDue && !isPartial) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const memoMatch = item.memo_no?.toLowerCase().includes(q);
        const shopMatch = item.shop_name?.toLowerCase().includes(q);
        const supplierMatch = item.supplier?.toLowerCase().includes(q);
        const brandMatch = item.brand?.toLowerCase().includes(q);
        const remarksMatch = item.remarks?.toLowerCase().includes(q);
        return memoMatch || shopMatch || supplierMatch || brandMatch || remarksMatch;
      }

      return true;
    });
  }, [supplierPayments, startDate, endDate, statusFilter, searchQuery]);

  // Overall KPI Analytics
  const stats = useMemo(() => {
    const list = Array.isArray(supplierPayments) ? supplierPayments : [];
    const totalInvoices = list.length;
    const totalAmount = list.reduce((acc, curr) => acc + (parseFloat(curr?.total_amount) || 0), 0);
    const totalPaid = list.reduce((acc, curr) => acc + (parseFloat(curr?.paid) || 0), 0);
    const totalDue = list.reduce((acc, curr) => acc + (parseFloat(curr?.due) || 0), 0);
    const totalShopsCount = shops?.length || 0;

    return { totalInvoices, totalAmount, totalPaid, totalDue, totalShopsCount };
  }, [supplierPayments, shops]);

  // Handlers for Shop Cards
  const handleCreditPurchase = (shop) => {
    setSelectedShop(shop);
    setIsOpen(true);
  };

  const handlePayDue = (shop) => {
    setSelectedShop(shop);
    setIsPayDueOpen(true);
  };

  const handleViewLedger = (shop) => {
    setSelectedShop(shop);
    setIsLedgerOpen(true);
  };

  const handleEditShop = (shop) => {
    setSelectedShop(shop);
    setIsEditShopOpen(true);
  };

  const handleDeleteShop = async (id, shopName) => {
    const result = await Swal.fire({
      title: `আপনি কি নিশ্চিত?`,
      text: `"${shopName}" দোকান প্রোফাইলটি মুছে ফেলতে চান?`,
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
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/deleteSupplierShop.php?id=${id}`
      );
      if (res.data?.success) {
        Swal.fire({
          title: "মুছে ফেলা হয়েছে!",
          text: "দোকান প্রোফাইল সফলভাবে ডিলিট হয়েছে।",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: "#0f172a",
          color: "#f8fafc",
        });
        handleRefetchAll();
      } else {
        Swal.fire({
          title: "ত্রুটি!",
          text: res.data?.message || "মুছে ফেলা সম্ভব হয়নি",
          icon: "error",
          background: "#0f172a",
          color: "#f8fafc",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "ত্রুটি!",
        text: "Delete failed ❌",
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  };

  // Handlers for Memos
  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "এই সাপ্লায়ার পেমেন্ট রেকর্ডটি মুছে ফেলা হবে!",
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
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/deleteSupplierPayments.php?id=${id}`
      );

      if (res.data?.success) {
        Swal.fire({
          title: "মুছে ফেলা হয়েছে!",
          text: "পেমেন্ট রেকর্ড সফলভাবে ডিলিট হয়েছে।",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: "#0f172a",
          color: "#f8fafc",
        });

        handleRefetchAll();
      } else {
        Swal.fire({
          title: "ত্রুটি!",
          text: res.data?.message || "মুছে ফেলা সম্ভব হয়নি",
          icon: "error",
          background: "#0f172a",
          color: "#f8fafc",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "ত্রুটি!",
        text: "Delete failed ❌",
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-6 space-y-6 select-none">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-600 text-white shadow-xl shadow-orange-500/20">
              <FaStore className="text-2xl md:text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                  সাপ্লায়ার ও দোকানদার খতিয়ান
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Shop Ledger & Accounts
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                ডিলার ও দোকানদারদের প্রোফাইল, বাকিতে পণ্য ক্রয়, বকেয়া পরিশোধ এবং সম্পূর্ণ লেজার হিস্ট্রি
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefetchAll}
              title="রিফ্রেশ করুন"
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition shadow-sm"
            >
              <FaSyncAlt
                className={`text-sm ${
                  isSupplierPaymentsLoading || isShopsLoading ? "animate-spin text-amber-400" : ""
                }`}
              />
            </button>

            {/* + Add New Shop Profile */}
            <button
              onClick={() => setIsAddShopOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition"
            >
              <FaPlus className="text-xs" />
              <span>+ নতুন দোকান/সাপ্লায়ার</span>
            </button>

            {/* + Add New Memo / Invoice */}
            <button
              onClick={() => {
                setSelectedShop(null);
                setIsOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition"
            >
              <FaFileInvoiceDollar className="text-sm" />
              <span>+ মেমো এন্ট্রি</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Shops / Suppliers */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              মোট দোকান / সাপ্লায়ার
            </p>
            <h3 className="text-xl md:text-2xl font-black text-white mt-1">
              {stats.totalShopsCount}{" "}
              <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FaStore className="text-lg" />
          </div>
        </div>

        {/* Total Purchase Amount */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              মোট ক্রয় / বিল
            </p>
            <h3 className="text-lg md:text-xl font-black text-slate-200 mt-1 font-mono">
              ৳ {(stats.totalAmount || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FaFileInvoiceDollar className="text-lg" />
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              পরিশোধিত টাকা (Paid)
            </p>
            <h3 className="text-lg md:text-xl font-black text-emerald-400 mt-1 font-mono">
              ৳ {(stats.totalPaid || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FaCheckCircle className="text-lg" />
          </div>
        </div>

        {/* Total Due */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              বর্তমান মোট বকেয়া (Due)
            </p>
            <h3 className="text-lg md:text-xl font-black text-rose-400 mt-1 font-mono">
              ৳ {(stats.totalDue || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FaMoneyBillWave className="text-lg" />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs & Search Toolbar */}
      <div className="p-4 md:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: View Tabs (Shops vs Memos) */}
        <div className="flex items-center bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 w-full lg:w-auto">
          <button
            onClick={() => setActiveView("shops")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
              activeView === "shops"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FaThLarge className="text-xs" />
            <span>দোকানদার প্রোফাইল কার্ডস (Shop Cards)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {shops?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveView("memos")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
              activeView === "memos"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FaListUl className="text-xs" />
            <span>মেমো ও চালান তালিকা (Invoices Table)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {supplierPayments?.length || 0}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeView === "shops"
                ? "দোকানের নাম, মালিক বা ফোন নম্বর খুঁজুন..."
                : "মেমো নং, ব্র্যান্ড বা সাপ্লায়ার খুঁজুন..."
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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

        {/* Right Filter Controls (For Table view) */}
        {activeView === "memos" && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
              {[
                { id: "ALL", label: "সব" },
                { id: "PAID", label: "পরিশোধিত" },
                { id: "PARTIAL", label: "আংশিক" },
                { id: "DUE", label: "বকেয়া" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === st.id
                      ? st.id === "PAID"
                        ? "bg-emerald-600 text-white"
                        : st.id === "PARTIAL"
                        ? "bg-amber-600 text-white"
                        : st.id === "DUE"
                        ? "bg-rose-600 text-white"
                        : "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-2xl border border-slate-800 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
            >
              রিসেট
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: SHOP CARDS VIEW (MATCHES USER SCREENSHOT) */}
      {activeView === "shops" && (
        <div>
          {isShopsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <FaSyncAlt className="animate-spin text-3xl text-amber-400" />
              <p className="text-sm font-bold">দোকান ও সাপ্লায়ার প্রোফাইল লোড হচ্ছে...</p>
            </div>
          ) : (
            <ShopCardsList
              shops={filteredShops}
              onCreditPurchase={handleCreditPurchase}
              onPayDue={handlePayDue}
              onViewLedger={handleViewLedger}
              onEditShop={handleEditShop}
              onDeleteShop={handleDeleteShop}
              onAddNewShop={() => setIsAddShopOpen(true)}
            />
          )}
        </div>
      )}

      {/* VIEW 2: INVOICES & MEMOS TABLE VIEW */}
      {activeView === "memos" && (
        <SupplierPaymentsTable
          filteredPayments={filteredPayments}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          setSelectedItem={setSelectedItem}
          setIsDetailsOpen={setIsDetailsOpen}
          setHistoryModalItem={setHistoryModalItem}
          setPreviewImageModal={setPreviewImageModal}
          setIsOpen={setIsOpen}
        />
      )}

      {/* ==================================================== */}
      {/* 🌟 MODALS                                            */}
      {/* ==================================================== */}

      {/* Add Shop Profile Modal */}
      <AddShopModal
        isOpen={isAddShopOpen}
        onClose={() => setIsAddShopOpen(false)}
        onSuccess={handleRefetchAll}
      />

      {/* Edit Shop Profile Modal */}
      <EditShopModal
        isOpen={isEditShopOpen}
        onClose={() => setIsEditShopOpen(false)}
        onSuccess={handleRefetchAll}
        shop={selectedShop}
      />

      {/* Pay Due Modal */}
      <PayDueModal
        isOpen={isPayDueOpen}
        onClose={() => setIsPayDueOpen(false)}
        onSuccess={handleRefetchAll}
        shop={selectedShop}
      />

      {/* Shop Ledger / History Modal */}
      <ShopLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        shop={selectedShop}
        onCreditPurchase={(s) => {
          setIsLedgerOpen(false);
          handleCreditPurchase(s);
        }}
        onPayDue={(s) => {
          setIsLedgerOpen(false);
          handlePayDue(s);
        }}
      />

      {/* Details Lightbox Modal */}
      {isDetailsOpen && (
        <SupplierPaymentDetailsModal
          selectedItem={selectedItem}
          setIsDetailsOpen={setIsDetailsOpen}
        />
      )}

      {/* Add Payment / Credit Purchase Modal */}
      <SupplierPaymentAddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleRefetchAll}
        preselectedShop={selectedShop}
      />

      {/* Edit Payment Modal */}
      <SupplierPaymentEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleRefetchAll}
        item={selectedItem}
      />

      {/* Audit History Modal */}
      {historyModalItem && (
        <SupplierPaymentHistoryModal
          paymentItem={historyModalItem}
          onClose={() => setHistoryModalItem(null)}
        />
      )}

      {/* Quick Image Preview Lightbox */}
      {previewImageModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white">মেমো / রসিদের ছবি প্রিভিউ</h3>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImageModal}
              alt="Memo Preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/40"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPayments;
