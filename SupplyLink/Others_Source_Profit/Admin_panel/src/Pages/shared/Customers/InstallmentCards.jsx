import React, { useMemo, useState } from "react";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useUsers from "../../../utils/Hooks/useUsers";
import {
  FaUser,
  FaPhoneAlt,
  FaBoxOpen,
  FaCalendarAlt,
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaFilter,
} from "react-icons/fa";
import { RiBankCardLine } from "react-icons/ri";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import { Link } from "react-router-dom";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import { useAuth } from "../../../Provider/AuthProvider";
import BackButton from "../../../components/BackButton/BackButton";

const STATUS_STYLES = {
  Running: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Fully Paid": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Overdue: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const InstallmentCards = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();

  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsError,
  } = useCustomerInstallmentPayments();

  const { isUsersLoading, users, isUsersError } = useUsers();

  const cardsWithCustomer = useMemo(() => {
    if (!customerInstallmentCards || !users) return [];

    return customerInstallmentCards.map((card) => {
      const customer = users.find((u) => u?.id === card?.user_id);
      return {
        ...card,
        customer: customer || null,
      };
    });
  }, [customerInstallmentCards, users]);

  const paymentCardMap = useMemo(() => {
    if (!customerInstallmentPayments?.length) return {};

    return customerInstallmentPayments.reduce((acc, payment) => {
      const cardId = String(payment?.card_id);
      acc[cardId] = true;
      return acc;
    }, {});
  }, [customerInstallmentPayments]);

  const filteredCards = useMemo(() => {
    let list = cardsWithCustomer;

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter((item) => {
      return (
        item.card_number?.toLowerCase().includes(q) ||
        item.product_name?.toLowerCase().includes(q) ||
        String(item.customer?.id || "").includes(q) ||
        item.customer?.name?.toLowerCase().includes(q) ||
        item.customer?.mobile?.toLowerCase().includes(q)
      );
    });
  }, [search, cardsWithCustomer, statusFilter]);

  const statusPriority = {
    Running: 1,
    Overdue: 2,
    "Fully Paid": 3,
  };

  const sortedCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
      return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
    });
  }, [filteredCards]);

  const statusCount = useMemo(() => {
    return cardsWithCustomer.reduce(
      (acc, item) => {
        if (item.status === "Running") acc.running++;
        if (item.status === "Fully Paid") acc.fullyPaid++;
        return acc;
      },
      { running: 0, fullyPaid: 0 }
    );
  }, [cardsWithCustomer]);

  if (
    isCustomerInstallmentsCardsLoading ||
    isUsersLoading ||
    isCustomerInstallmentsPaymentsLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (
    isCustomerInstallmentsCardsError ||
    isUsersError ||
    isCustomerInstallmentsPaymentsError
  ) {
    return (
      <NoDataFound message="No Card Found" subMessage="Please Try again later" />
    );
  }

  const currentUser = users?.find((u) => u.id === user?.id);

  return (
    <div className="mx-auto text-gray-200 max-w-[1600px] p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* ===== Top Navigation & Counter Badges ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <BackButton />
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full text-slate-300">
            মোট কার্ড: {cardsWithCustomer.length} টি
          </span>
          <span className="text-xs font-mono bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full text-blue-300 font-medium">
            চলমান (Running): {statusCount.running}
          </span>
          <span className="text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-300 font-medium">
            পরিশোধিত (Fully Paid): {statusCount.fullyPaid}
          </span>
        </div>
      </div>

      {/* ===== Header & Search Controls ===== */}
      <div className="card-surface p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <RiBankCardLine size={22} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Customer Installment Cards
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              সকল কিস্তি কার্ডের বিবরণী, গ্রাহক তথ্য ও কিস্তি শিডিউল চার্ট
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-96 relative flex items-center">
          <FaSearch className="absolute left-3.5 text-slate-400" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="কার্ড নং, গ্রাহক নাম বা প্রোডাক্ট খুঁজুন..."
            className="w-full bg-[#091122] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ===== Quick Status Filters ===== */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium mr-1">
          <FaFilter size={10} className="text-indigo-400" /> ফিল্টার:
        </span>
        {[
          { key: "all", label: "সব কার্ড", count: cardsWithCustomer.length },
          { key: "Running", label: "চলমান (Running)", count: statusCount.running },
          { key: "Fully Paid", label: "পরিশোধিত (Fully Paid)", count: statusCount.fullyPaid },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                  : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {tab.label} <span className="opacity-70 font-mono">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* ===== Cards Grid ===== */}
      {sortedCards.length === 0 ? (
        <div className="card-surface p-16 text-center rounded-2xl">
          <span className="text-5xl mb-4 block">💳</span>
          <h3 className="text-lg font-bold text-slate-200">
            কোনো কিস্তি কার্ড পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            আপনার সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
          </p>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="btn-secondary text-xs mt-4"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedCards.map((item) => (
            <div
              key={item.id}
              className="card-surface group relative overflow-hidden p-5 flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 rounded-2xl"
            >
              <div>
                {/* Header Link to Card Details */}
                <Link
                  to={`/customers/installment_cards/card_Details?cardId=${item?.id}`}
                  className="block group-hover:opacity-95"
                >
                  <div className="flex items-start justify-between mb-3.5">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        Card Number
                      </p>
                      <p className="font-mono font-extrabold text-white text-base tracking-tight mt-0.5 group-hover:text-indigo-300 transition-colors">
                        {item.card_number}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        STATUS_STYLES[item.status] || "bg-slate-500/15 text-slate-300 border-slate-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="mb-3.5 space-y-1 bg-black/25 p-3 rounded-xl border border-white/5">
                    <p className="flex items-center gap-2 text-white font-medium text-sm truncate">
                      <FaBoxOpen className="text-indigo-400 shrink-0" size={14} />
                      <span className="truncate">{item.product_name}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>বিক্রির ধরণ:</span>
                      <span className="text-slate-200 font-semibold px-2 py-0.5 rounded bg-white/[0.04]">
                        {item.sale_type}
                      </span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/[0.06] pt-3">
                    <p className="flex items-center gap-2 truncate">
                      <FaUser className="text-slate-500 shrink-0" size={12} />
                      <span className="font-bold text-indigo-300 font-mono">
                        #{item.customer?.id}
                      </span>
                      <span className="truncate font-medium">{item.customer?.name || "Unknown"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-400 font-mono">
                      <FaPhoneAlt className="text-slate-500 shrink-0" size={11} />
                      <span>{item.customer?.mobile || "N/A"}</span>
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 space-y-1 text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <p className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-slate-500" size={10} /> ডেলিভারি:
                      </span>
                      <span className="font-mono text-slate-300">{item.delivery_date || "—"}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-slate-500" size={10} /> ১ম কিস্তি:
                      </span>
                      <span className="font-mono text-slate-300">{item.first_installment_date || "—"}</span>
                    </p>
                  </div>
                </Link>
              </div>

              {/* Action Area */}
              <div className="mt-4 pt-3 border-t border-white/[0.08]">
                {currentUser?.role !== "staff" && item.status !== "Fully Paid" ? (
                  <Link
                    to={`/customer/create_installment_chart?cardId=${item.id}`}
                    className="block w-full"
                  >
                    <button
                      className="w-full py-2.5 px-3 rounded-xl
                                 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110
                                 text-xs font-bold text-white shadow-md shadow-indigo-500/20
                                 flex items-center justify-center gap-2 transition-all cursor-pointer group/btn"
                    >
                      <FaChartLine size={13} />
                      <span>
                        {paymentCardMap[String(item.id)]
                          ? "Update Installment Chart"
                          : "Create Installment Chart"}
                      </span>
                      <FaArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                ) : item.status === "Fully Paid" ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <FaCheckCircle size={12} />
                    <span>পরিশোধ সম্পন্ন (Completed)</span>
                  </div>
                ) : (
                  <Link
                    to={`/customers/installment_cards/card_Details?cardId=${item?.id}`}
                    className="block w-full"
                  >
                    <button className="btn-secondary w-full py-2 text-xs font-medium flex items-center justify-center gap-1.5">
                      <span>কার্ড বিবরণী দেখুন</span>
                      <FaArrowRight size={10} />
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstallmentCards;
