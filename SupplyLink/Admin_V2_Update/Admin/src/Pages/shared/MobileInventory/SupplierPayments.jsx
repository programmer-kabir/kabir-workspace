import React, { useState, useMemo } from "react";
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
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import SupplierPaymentsTable from "../../../components/Dashboard/SupplierPayments/SupplierPaymentsTable";
import SupplierPaymentDetailsModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentDetailsModal";
import SupplierPaymentAddModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentAddModal";
import SupplierPaymentEditModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentEditModal";
import SupplierPaymentHistoryModal from "../../../components/Dashboard/SupplierPayments/SupplierPaymentHistoryModal";

const SupplierPayments = () => {
  const {
    isSupplierPaymentsError,
    isSupplierPaymentsLoading,
    refetch,
    supplierPayments,
  } = useSupplierPayments();

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

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  // Filtered Payments List
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

  // KPI Analytics
  const stats = useMemo(() => {
    const list = supplierPayments || [];
    const totalInvoices = list.length;
    const totalAmount = list.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
    const totalPaid = list.reduce((acc, curr) => acc + (parseFloat(curr.paid) || 0), 0);
    const totalDue = list.reduce((acc, curr) => acc + (parseFloat(curr.due) || 0), 0);
    const fullyPaidCount = list.filter((i) => (parseFloat(i.due) || 0) <= 0 && (parseFloat(i.total_amount) || 0) > 0).length;
    const pendingDueCount = list.filter((i) => (parseFloat(i.due) || 0) > 0).length;

    return { totalInvoices, totalAmount, totalPaid, totalDue, fullyPaidCount, pendingDueCount };
  }, [supplierPayments]);

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

        refetch();
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
    <div className="min-h-screen p-3 md:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25">
              <FaFileInvoiceDollar className="text-2xl md:text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                  সাপ্লায়ার পেমেন্ট ও ভাউচার শিট
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Accounts & Billing
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                ডিলার ও সাপ্লায়ারদের বিল, পরিশোধিত ক্যাশ, বকেয়া এবং মেমো রসিদ পর্যবেক্ষণ
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
              <FaSyncAlt
                className={`text-sm ${
                  isSupplierPaymentsLoading ? "animate-spin text-blue-400" : ""
                }`}
              />
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 transition"
            >
              <FaPlus className="text-xs" />
              <span>নতুন পেমেন্ট যোগ করুন (+ Add)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total Invoices */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              মোট মেমো / ভাউচার
            </p>
            <h3 className="text-xl md:text-2xl font-black text-white mt-1">
              {stats.totalInvoices}{" "}
              <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FaFileInvoiceDollar className="text-lg" />
          </div>
        </div>

        {/* Total Purchase Amount */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              মোট বিলের পরিমাণ
            </p>
            <h3 className="text-lg md:text-xl font-black text-amber-400 mt-1 font-mono">
              ৳ {stats.totalAmount.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FaMoneyBillWave className="text-lg" />
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              পরিশোধিত টাকা (Paid)
            </p>
            <h3 className="text-lg md:text-xl font-black text-emerald-400 mt-1 font-mono">
              ৳ {stats.totalPaid.toLocaleString()}
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
              মোট বকেয়া (Total Due)
            </p>
            <h3 className="text-lg md:text-xl font-black text-rose-400 mt-1 font-mono">
              ৳ {stats.totalDue.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FaTimesCircle className="text-lg" />
          </div>
        </div>

        {/* Fully Cleared Count */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              পরিশোধ সম্পন্ন মেমো
            </p>
            <h3 className="text-lg md:text-xl font-black text-cyan-400 mt-1">
              {stats.fullyPaidCount}{" "}
              <span className="text-xs font-normal text-slate-500">টি</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FaClock className="text-lg" />
          </div>
        </div>
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
            placeholder="মেমো নম্বর, সাপ্লায়ার, ব্র্যান্ড বা শপের নাম খুঁজুন..."
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
            {[
              { id: "ALL", label: "সকল পেমেন্ট" },
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
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : st.id === "PARTIAL"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : st.id === "DUE"
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                      : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st.label}
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
            onClick={handleReset}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
          >
            রিসেট
          </button>
        </div>
      </div>

      {/* Main Table */}
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

      {/* Details Lightbox Modal */}
      {isDetailsOpen && (
        <SupplierPaymentDetailsModal
          selectedItem={selectedItem}
          setIsDetailsOpen={setIsDetailsOpen}
        />
      )}

      {/* Add Payment Modal */}
      <SupplierPaymentAddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Payment Modal */}
      <SupplierPaymentEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => refetch()}
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
