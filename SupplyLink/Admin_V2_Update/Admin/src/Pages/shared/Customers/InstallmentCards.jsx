import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import useUsers from "../../../utils/Hooks/useUsers";
import {
  FaUser,
  FaPhoneAlt,
  FaBoxOpen,
  FaCalendarAlt,
  FaSearch,
  FaChartLine,
  FaArrowRight,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaMoneyBillWave,
  FaReceipt,
  FaTimes,
  FaLayerGroup,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import Pagination from "../../../components/Pagination";
import { useAuth } from "../../../Provider/AuthProvider";

const PAGE_SIZE = 24;

const InstallmentCards = () => {
  const { user } = useAuth();

  // Persistent search, filter, and pagination from sessionStorage
  const [search, setSearch] = useState(
    () => sessionStorage.getItem("installment_cards_search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    () => sessionStorage.getItem("installment_cards_status") || "all"
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("installment_cards_page");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [cards, setCards] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCount, setStatusCount] = useState({
    running: 0,
    fullyPaid: 0,
    overdue: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const { users } = useUsers();

  // Reset to page 1 whenever search or filter changes
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    sessionStorage.setItem("installment_cards_search", val);
    setCurrentPage(1);
    sessionStorage.setItem("installment_cards_page", "1");
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    sessionStorage.setItem("installment_cards_status", status);
    setCurrentPage(1);
    sessionStorage.setItem("installment_cards_page", "1");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    sessionStorage.setItem("installment_cards_page", String(page));
  };

  const rememberCardPosition = (cardId) => {
    sessionStorage.setItem("installment_cards_last_card", String(cardId));
  };

  // Fetch cards from server with server-side pagination, status filter & search
  useEffect(() => {
    let isMounted = true;

    const fetchCards = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_installment_cards.php`,
          {
            params: {
              page: currentPage,
              limit: PAGE_SIZE,
              search: search.trim(),
              status: statusFilter === "all" ? "" : statusFilter,
            },
          }
        );

        if (isMounted && response.data?.success) {
          setCards(response.data.data || []);
          setTotalPages(response.data.total_pages || 1);
          setTotalCount(response.data.total || 0);
          if (response.data.status_counts) {
            setStatusCount({
              running: response.data.status_counts.running || 0,
              fullyPaid: response.data.status_counts.fullyPaid || 0,
              overdue: response.data.status_counts.overdue || 0,
              total: response.data.status_counts.total || 0,
            });
          }
        }
      } catch (err) {
        if (isMounted) setIsError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCards();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentPage, search, statusFilter]);

  // Scroll restoration: when returning back from details/chart, smoothly scroll to last viewed card
  useEffect(() => {
    if (!isLoading && cards.length > 0) {
      const lastCardId = sessionStorage.getItem("installment_cards_last_card");
      if (lastCardId) {
        const targetElement = document.getElementById(`installment-card-${lastCardId}`);
        if (targetElement) {
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
            targetElement.classList.add(
              "ring-2",
              "ring-cyan-400",
              "shadow-[0_0_35px_rgba(6,182,212,0.4)]"
            );
            setTimeout(() => {
              targetElement.classList.remove(
                "ring-2",
                "ring-cyan-400",
                "shadow-[0_0_35px_rgba(6,182,212,0.4)]"
              );
            }, 3000);
          }, 150);
        }
      }
    }
  }, [isLoading, cards]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  const currentUser = users?.find((u) => u.id === user?.id);

  return (
    <div className="w-full space-y-6 pb-12 pt-2">
      {/* ===== Header & Title Banner ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
              <FaCreditCard className="text-lg" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Installment Cards Directory
              </h1>
              <p className="text-xs text-slate-400">
                Track customer installment plans, due calculations, and payment records
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <Link
          to="/customers/create_installment_cards"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-200 self-start md:self-auto"
        >
          <FaPlus className="text-xs" />
          <span>Create New Card</span>
        </Link>
      </div>

      {/* ===== KPI Metrics Bar ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => handleStatusChange("all")}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${statusFilter === "all"
              ? "bg-[#0C1427] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
              : "bg-[#070D1E]/80 border-slate-800 hover:border-slate-700"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Cards
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-xs">
              <FaLayerGroup />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            {statusCount.total || totalCount}
          </p>
        </div>

        <div
          onClick={() => handleStatusChange("Running")}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${statusFilter === "Running"
              ? "bg-[#0C1427] border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/40"
              : "bg-[#070D1E]/80 border-slate-800 hover:border-slate-700"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Running
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs">
              <FaClock />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-300 mt-1 font-mono">
            {statusCount.running}
          </p>
        </div>

        <div
          onClick={() => handleStatusChange("Fully Paid")}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${statusFilter === "Fully Paid"
              ? "bg-[#0C1427] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40"
              : "bg-[#070D1E]/80 border-slate-800 hover:border-slate-700"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Fully Paid
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
              <FaCheckCircle />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 font-mono">
            {statusCount.fullyPaid}
          </p>
        </div>

        <div
          onClick={() => handleStatusChange("Overdue")}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${statusFilter === "Overdue"
              ? "bg-[#0C1427] border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/40"
              : "bg-[#070D1E]/80 border-slate-800 hover:border-slate-700"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Overdue
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs">
              <FaExclamationTriangle />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-300 mt-1 font-mono">
            {statusCount.overdue}
          </p>
        </div>
      </div>

      {/* ===== Filters & Search Controls ===== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-xl">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sl-scroll">
          {[
            { key: "all", label: "All Cards", count: statusCount.total || totalCount },
            { key: "Running", label: "Running", count: statusCount.running },
            { key: "Fully Paid", label: "Fully Paid", count: statusCount.fullyPaid },
            { key: "Overdue", label: "Overdue", count: statusCount.overdue },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusChange(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${isActive
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                    : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/40"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isActive ? "bg-black/30 text-white" : "bg-slate-900/80 text-slate-400"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80 shrink-0">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search Card ID, Customer, Phone, Product..."
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#070D1E] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                sessionStorage.removeItem("installment_cards_search");
                setCurrentPage(1);
                sessionStorage.setItem("installment_cards_page", "1");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* ===== Cards Grid Content ===== */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader />
          </div>
        ) : isError ? (
          <NoDataFound message="Error Loading Cards" subMessage="Please check connection and try again" />
        ) : cards.length === 0 ? (
          <NoDataFound
            message="No Matching Cards Found"
            subMessage="Try adjusting your search query or filter"
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((item) => {
                const isPaid = item.status === "Fully Paid";
                const isOverdue = item.status === "Overdue";
                const cardDisplayId = item.card_id || item.id;
                const customerUid = item.customer_user_id || item.user_id;

                return (
                  <div
                    key={item.id}
                    id={`installment-card-${item.id}`}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800/90 hover:border-cyan-500/50 hover:shadow-[0_10px_35px_rgba(6,182,212,0.18)] transition-all duration-300 p-5 flex flex-col justify-between group"
                  >
                    {/* Top Accent Gradient Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 via-indigo-500/50 to-transparent group-hover:from-cyan-400 group-hover:to-indigo-400 transition-all"></div>

                      {/* Top Header Row */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        {/* 💳 Card ID Badge */}
                        <Link
                          to={`/customers/installment_cards/card_Details?cardId=${cardDisplayId}`}
                          onClick={() => rememberCardPosition(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 font-mono font-black text-xs shadow-sm transition"
                        >
                          <FaCreditCard className="text-[11px] text-cyan-400" />
                          <span>Card #{cardDisplayId}</span>
                        </Link>

                        {/* Status Chip */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${isPaid
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : isOverdue
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                            }`}
                        >
                          {isPaid ? (
                            <>
                              <FaCheckCircle className="text-[10px]" /> Paid
                            </>
                          ) : isOverdue ? (
                            <>
                              <FaExclamationTriangle className="text-[10px]" /> Overdue
                            </>
                          ) : (
                            <>
                              <FaClock className="text-[10px]" /> Running
                            </>
                          )}
                        </span>
                      </div>

                      {/* Product Info */}
                      <Link
                        to={`/customers/installment_cards/card_Details?cardId=${cardDisplayId}`}
                        onClick={() => rememberCardPosition(item.id)}
                        className="block group/title mb-3.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5 group-hover/title:border-cyan-500/50 transition">
                            <FaBoxOpen className="text-sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover/title:text-cyan-300 transition">
                              {!item.product_name || item.product_name.includes("?")
                                ? `Installment Product #${cardDisplayId}`
                                : item.product_name}
                            </h3>
                            <span className="inline-block text-[10px] text-slate-400 font-medium bg-slate-800/60 px-2 py-0.5 rounded-md mt-1 border border-slate-700/40">
                              {item.sale_type || "Installment"}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Customer Info Card */}
                      <div className="rounded-2xl bg-[#070D1E]/90 border border-slate-800/90 p-3 space-y-1.5 mb-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/customers/all_customer/customer_details?userId=${customerUid}`}
                            onClick={() => rememberCardPosition(item.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-cyan-300 transition truncate"
                          >
                            <FaUser className="text-[10px] text-indigo-400 shrink-0" />
                            <span className="truncate">{item.user_name || "Unnamed Customer"}</span>
                          </Link>
                          <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                            ID #{customerUid}
                          </span>
                        </div>

                        {item.user_mobile && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                            <FaPhoneAlt className="text-[9px] text-slate-500" />
                            <span>{item.user_mobile}</span>
                          </p>
                        )}
                      </div>

                      {/* Financial Mini Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3.5">
                        <div className="bg-[#070D1E]/60 rounded-xl p-2 border border-slate-800/60 space-y-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FaMoneyBillWave className="text-[10px] text-indigo-400" /> Sale
                          </span>
                          <p className="text-xs font-bold text-white font-mono">
                            ৳ {Number(item.sale_price || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="bg-[#070D1E]/60 rounded-xl p-2 border border-slate-800/60 space-y-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FaReceipt className="text-[10px] text-rose-400" /> Due
                          </span>
                          <p className="text-xs font-bold text-rose-300 font-mono">
                            ৳ {Number(item.total_due_amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Dates Info */}
                      <div className="space-y-1 text-[11px] text-slate-400 bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40 mb-3.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <FaCalendarAlt className="text-[10px]" /> Delivery:
                          </span>
                          <span className="font-mono text-slate-300">
                            {item.delivery_date || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <FaCalendarAlt className="text-[10px]" /> 1st Installment:
                          </span>
                          <span className="font-mono text-slate-300">
                            {item.first_installment_date || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2 border-t border-slate-800/70 space-y-2">
                      {currentUser?.role !== "staff" && item.status !== "Fully Paid" ? (
                        <Link
                          to={
                            item.has_chart
                              ? `/customer/update_installment_chart?cardId=${cardDisplayId}`
                              : `/customer/create_installment_chart?cardId=${cardDisplayId}`
                          }
                          onClick={() => rememberCardPosition(item.id)}
                          className="w-full block"
                        >
                          <button className="group/btn w-full flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all">
                            <FaChartLine className="text-xs text-cyan-200" />
                            <span>
                              {item.has_chart ? "Update Installment Chart" : "Create Installment Chart"}
                            </span>
                            <FaArrowRight className="text-[10px] group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </Link>
                      ) : (
                        <Link
                          to={`/customers/installment_cards/card_Details?cardId=${cardDisplayId}`}
                          onClick={() => rememberCardPosition(item.id)}
                          className="w-full block"
                        >
                          <button className="w-full flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white border border-slate-700 transition">
                            <FaCreditCard className="text-xs text-cyan-400" />
                            <span>View Full Card Details</span>
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 mb-4">
              <Pagination
                reportData={{ length: totalCount }}
                currentPage={currentPage}
                totalPages={totalPages}
                PAGE_SIZE={PAGE_SIZE}
                pageNumbers={pageNumbers}
                setCurrentPage={handlePageChange}
                storageKey="installment_cards_page"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstallmentCards;
