import React, { useMemo, useState } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import useProfitAnalytics from "../../../utils/Hooks/useProfitAnalytics";
import CustomerCardView from "../../../components/Dashboard/CustomerCardView";
import Loader from "../../../components/Loader/Loader";

import {
  FaPhoneAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaEdit,
  FaEye,
  FaTimes,
  FaBoxOpen,
  FaChartLine,
  FaUserCheck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaLock,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaSearch,
  FaFilter,
  FaUserShield,
} from "react-icons/fa";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";
import { toast } from "react-toastify";

const ROLE_BADGE_STYLES = {
  admin: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  manager: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  staff: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  developer: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  investor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  customer: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  supplier: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  granter: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const FILTER_ROLES = [
  { key: "all", label: "All Users" },
  { key: "customer", label: "Customers" },
  { key: "investor", label: "Investors" },
  { key: "staff", label: "Staff" },
  { key: "manager", label: "Managers" },
  { key: "admin", label: "Admins" },
];

const AllUsers = () => {
  const { isUsersLoading, users, isUsersError, refetch } = useUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // 👁️ User Dashboard View Modal State
  const [viewUser, setViewUser] = useState(null);
  const [userActiveTab, setUserActiveTab] = useState("customer");

  // Hooks for Customer & Investor Data
  const { customerInstallmentCards = [] } = useCustomerInstallmentCards();
  const { customerInstallmentPayments = [] } = useCustomerInstallmentPayments();
  const { investmentCards = [] } = useInvestmentCards();
  const { profitAnalytics = [] } = useProfitAnalytics();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesKeyword =
        !keyword ||
        user.name?.toLowerCase().includes(keyword) ||
        user.mobile?.toLowerCase().includes(keyword) ||
        user.id_number?.toLowerCase().includes(keyword) ||
        String(user.id).includes(keyword) ||
        user.roles?.join(",").toLowerCase().includes(keyword);

      if (!matchesKeyword) return false;

      if (roleFilter !== "all") {
        return user.roles?.includes(roleFilter);
      }

      return true;
    });
  }, [users, search, roleFilter]);

  const handleEdit = (user) => {
    setEditUser(user);
    setOpenModal(true);
  };

  const handleOpenUserView = (user) => {
    setViewUser(user);
    // Auto-select tab according to user's role
    const roles = user.roles || [];
    if (roles.includes("customer")) {
      setUserActiveTab("customer");
    } else if (roles.includes("investor")) {
      setUserActiveTab("investor");
    } else {
      setUserActiveTab("profile");
    }
  };

  // 🚀 Directly open the actual User Dashboard (Port 5176) logged in as this user (No password needed)
  const handleOpenDirectUserDashboard = (targetUser) => {
    if (!targetUser) return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const userAppUrl =
      import.meta.env.VITE_USER_APP_URL ||
      (isLocal ? "http://localhost:5176" : "");

    // Direct passwordless login into the real User Dashboard
    window.open(`${userAppUrl}/login?impersonate_id=${targetUser.id}`, "_blank");
  };

  // 🔹 Customer Cards for the selected user
  const userCustomerCards = useMemo(() => {
    if (!viewUser || !customerInstallmentCards) return [];
    return customerInstallmentCards
      .filter((card) => Number(card.user_id) === Number(viewUser.id))
      .map((card) => {
        const payments = (customerInstallmentPayments || []).filter(
          (p) => Number(p.card_id) === Number(card.id)
        );
        return {
          ...card,
          payments,
        };
      });
  }, [viewUser, customerInstallmentCards, customerInstallmentPayments]);

  // Customer Summary Stats
  const customerStats = useMemo(() => {
    if (!userCustomerCards.length) {
      return { totalCards: 0, runningCards: 0, completedCards: 0, totalDue: 0 };
    }
    const running = userCustomerCards.filter((c) => c.status !== "Fully Paid");
    const completed = userCustomerCards.filter((c) => c.status === "Fully Paid");

    let totalDue = 0;
    userCustomerCards.forEach((c) => {
      const downPayment = (c.payments || []).find(
        (p) => Number(p.installment_no) === 0
      );
      const downAmount = downPayment ? Number(downPayment.due_amount) : 0;
      const regularPaid = (c.payments || [])
        .filter((p) => Number(p.installment_no) > 0 && p.status === "Paid")
        .reduce((sum, p) => sum + Number(p.due_amount || 0), 0);
      const remaining = Math.max(
        0,
        Number(c.sale_price || 0) - downAmount - regularPaid
      );
      totalDue += remaining;
    });

    return {
      totalCards: userCustomerCards.length,
      runningCards: running.length,
      completedCards: completed.length,
      totalDue,
    };
  }, [userCustomerCards]);

  // 🔹 Investor Cards for the selected user
  const userInvestorCards = useMemo(() => {
    if (!viewUser || !investmentCards) return [];
    return investmentCards.filter(
      (card) => Number(card.investor_id) === Number(viewUser.id)
    );
  }, [viewUser, investmentCards]);

  // Investor Profit Analytics
  const userProfitRecords = useMemo(() => {
    if (!viewUser || !profitAnalytics || !userInvestorCards.length) return [];
    const cardIds = userInvestorCards.map((c) => Number(c.id));
    return profitAnalytics.filter((p) => cardIds.includes(Number(p.card_id)));
  }, [viewUser, profitAnalytics, userInvestorCards]);

  const totalInvestedAmount = useMemo(() => {
    return userInvestorCards.reduce(
      (sum, c) => sum + Number(c.investment_amount || 0),
      0
    );
  }, [userInvestorCards]);

  const totalProfitEarned = useMemo(() => {
    return userProfitRecords.reduce(
      (sum, p) => sum + Number(p.profit_amount || 0),
      0
    );
  }, [userProfitRecords]);

  if (isUsersLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  if (isUsersError) {
    return <NoDataFound />;
  }

  const handleUpdateUser = async () => {
    try {
      const formData = new FormData();

      formData.append("id", editUser.id);
      formData.append("name", editUser.name);
      formData.append("mobile", editUser.mobile);
      formData.append("id_number", editUser.id_number);
      formData.append("address", editUser.address);

      if (editUser.photo) {
        formData.append("photo", editUser.photo);
      }

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/update_user.php`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Updated!");
        setOpenModal(false);
        refetch();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server Error");
    }
  };

  return (
    <div className="mx-auto text-gray-200  p-4  space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
            মোট ইউজার: {users?.length || 0} জন
          </span>
        </div>
      </div>

      {/* ===== Header & Search Controls ===== */}
      <div className="card-surface p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FaUserShield size={20} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                All Users & Accounts
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                সিস্টেমের সকল ইউজার তালিকা, রোল ও ডাইরেক্ট পোর্টাল এক্সেস
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-3.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="নাম, মোবাইল নম্বর, আইডি বা রোল দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#091122] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
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
      </div>

      {/* ===== Quick Role Filter Pills ===== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium mr-1">
          <FaFilter size={10} className="text-indigo-400" /> ফিল্টার:
        </span>
        {FILTER_ROLES.map((tab) => {
          const isActive = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                  : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {tab.label}
              {tab.key === "all" ? (
                <span className="ml-1.5 opacity-70">({users?.length || 0})</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ===== Cards Grid ===== */}
      {filteredUsers.length === 0 ? (
        <div className="card-surface p-16 text-center rounded-2xl">
          <span className="text-5xl mb-4 block">🔍</span>
          <h3 className="text-lg font-bold text-slate-200">
            কোনো ইউজার পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            আপনার সার্চ কি-ওয়ার্ড বা রোল ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
          </p>
          {(search || roleFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
              }}
              className="btn-secondary text-xs mt-4"
            >
              সব ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="card-surface group relative overflow-hidden p-5 flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
            >
              <div>
                {/* Top User Info */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative shrink-0">
                    <img
                      src={
                        user.photo
                          ? user.photo.startsWith("http")
                            ? user.photo
                            : `https://api.supplylinkbd.com/${user.photo.replace(/^uploads\//, "uploads/")}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name || "User"
                            )}&background=6366f1&color=fff`
                      }
                      alt={user.name}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all shadow-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || "User"
                        )}&background=6366f1&color=fff`;
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base truncate group-hover:text-indigo-300 transition-colors">
                      {user.name || "No Name"}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                      <FaPhoneAlt className="text-indigo-400/80" size={10} />
                      <span>{user.mobile || "N/A"}</span>
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg shrink-0 font-bold">
                    #{user.id}
                  </span>
                </div>

                {/* Extra Info Box */}
                <div className="space-y-1.5 text-xs text-slate-400 bg-black/30 rounded-xl p-3 border border-white/5">
                  {user.id_number ? (
                    <p className="flex items-center gap-2">
                      <FaIdCard className="text-slate-500 shrink-0" size={12} />
                      <span className="font-mono text-slate-300 truncate">ID: {user.id_number}</span>
                    </p>
                  ) : null}

                  {user.address ? (
                    <p className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-slate-500 shrink-0 mt-0.5" size={12} />
                      <span className="truncate text-slate-300">{user.address}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Roles & Action Buttons */}
              <div className="mt-4 pt-3.5 border-t border-white/[0.08] space-y-3">
                {/* Roles list */}
                <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                  {user.roles?.length > 0 ? (
                    user.roles.map((role, i) => {
                      const badgeClass =
                        ROLE_BADGE_STYLES[role] || "bg-slate-500/15 text-slate-300 border-slate-500/30";
                      return (
                        <span
                          key={i}
                          className={`text-[11px] px-2.5 py-0.5 rounded-full capitalize font-semibold border ${badgeClass}`}
                        >
                          {role}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500 italic">No role</span>
                  )}
                </div>

                {/* Buttons: Direct User Dashboard & Preview & Edit */}
                <div className="flex items-center gap-2">
                  {/* <button
                    onClick={() => handleOpenDirectUserDashboard(user)}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl
                               bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110
                               text-white shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="সরাসরি ইউজারের নিজস্ব ড্যাশবোর্ডে প্রবেশ করুন"
                  >
                    <FaExternalLinkAlt size={10} />
                    <span className="truncate">User Portal</span>
                  </button> */}

                  <button
                    onClick={() => handleOpenUserView(user)}
                    className="w-8 h-8 rounded-xl border border-white/10 hover:border-indigo-500/40 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="কুইক প্রিভিউ মোডাল"
                  >
                    <FaEye size={13} />
                  </button>

                  <button
                    onClick={() => handleEdit(user)}
                    className="w-8 h-8 rounded-xl border border-white/10 hover:border-white/30 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="ইউজার তথ্য এডিট"
                  >
                    <FaEdit size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 USER DASHBOARD PREVIEW MODAL (Viewing as the User without password) 🌟 */}
      {/* ========================================================================= */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
          <div className="card-surface-elevated border border-white/15 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Top Bar */}
            <div className="bg-[#0b132b]/90 border-b border-white/10 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              {/* User Header Summary */}
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    viewUser.photo
                      ? `https://api.supplylinkbd.com/${viewUser.photo.replace(/^uploads\//, "uploads/")}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          viewUser.name || "User"
                        )}&background=6366f1&color=fff`
                  }
                  alt={viewUser.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/50 shadow-md"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      viewUser.name || "User"
                    )}&background=6366f1&color=fff`;
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">
                      {viewUser.name}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                      ID #{viewUser.id}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                      <FaCheckCircle size={10} /> Live User View
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span>📞 {viewUser.mobile}</span>
                    {viewUser.id_number && <span>• NID: {viewUser.id_number}</span>}
                  </p>
                </div>
              </div>

              {/* Role Navigation Tabs & Close */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <div className="flex bg-[#060a14] p-1 rounded-xl border border-white/10">
                  {/* Customer Tab */}
                  <button
                    onClick={() => setUserActiveTab("customer")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      userActiveTab === "customer"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FaBoxOpen size={13} />
                    <span>Customer View ({userCustomerCards.length})</span>
                  </button>

                  {/* Investor Tab */}
                  <button
                    onClick={() => setUserActiveTab("investor")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      userActiveTab === "investor"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FaChartLine size={13} />
                    <span>Investor View ({userInvestorCards.length})</span>
                  </button>

                  {/* Profile Info Tab */}
                  <button
                    onClick={() => setUserActiveTab("profile")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      userActiveTab === "profile"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FaUserCheck size={13} />
                    <span>Profile Info</span>
                  </button>
                </div>

                {/* Direct User Dashboard in real tab */}
                <button
                  onClick={() => handleOpenDirectUserDashboard(viewUser)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  title="আসল ইউজার ড্যাশবোর্ডে নতুন ট্যাবে খুলুন"
                >
                  <FaExternalLinkAlt size={11} />
                  <span>Open in Portal</span>
                </button>

                <button
                  onClick={() => setViewUser(null)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                  title="Close (বন্ধ করুন)"
                >
                  <FaTimes size={15} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[#060a14]/60">
              
              {/* =================================================================== */}
              {/* TAB 1: CUSTOMER VIEW (What a Customer Sees on Their Dashboard)     */}
              {/* =================================================================== */}
              {userActiveTab === "customer" && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                    <div className="card-surface p-4">
                      <p className="text-xs text-slate-400">মোট কিস্তি কার্ড</p>
                      <h4 className="text-xl md:text-2xl font-extrabold text-white mt-1 font-mono">
                        {customerStats.totalCards} টি
                      </h4>
                    </div>

                    <div className="card-surface p-4">
                      <p className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                        <FaClock size={11} /> চলমান কার্ড
                      </p>
                      <h4 className="text-xl md:text-2xl font-extrabold text-amber-400 mt-1 font-mono">
                        {customerStats.runningCards} টি
                      </h4>
                    </div>

                    <div className="card-surface p-4">
                      <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <FaCheckCircle size={11} /> পরিশোধিত কার্ড
                      </p>
                      <h4 className="text-xl md:text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                        {customerStats.completedCards} টি
                      </h4>
                    </div>

                    <div className="card-surface p-4">
                      <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                        <FaMoneyBillWave size={11} /> সর্বমোট বাকি
                      </p>
                      <h4 className="text-xl md:text-2xl font-extrabold text-rose-400 mt-1 font-mono">
                        ৳ {customerStats.totalDue.toLocaleString()}
                      </h4>
                    </div>
                  </div>

                  {/* Customer Installment Cards List */}
                  {userCustomerCards.length === 0 ? (
                    <div className="card-surface p-12 text-center rounded-2xl">
                      <FaBoxOpen className="text-slate-600 text-5xl mx-auto mb-3" />
                      <h4 className="text-lg font-bold text-white">
                        কোনো কিস্তি কার্ড পাওয়া যায়নি
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        এই ইউজারের নামে এখনো কোনো প্রোডাক্ট কিস্তির কার্ড তৈরি করা হয়নি।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <FaBoxOpen className="text-emerald-400" />
                          গ্রাহকের কিস্তি কার্ড সমূহ ({userCustomerCards.length})
                        </h3>
                        <span className="text-xs text-slate-400">
                          (গ্রাহকের ড্যাশবোর্ডের মতো হুবহু ভিউ)
                        </span>
                      </div>

                      {userCustomerCards.map((card) => (
                        <CustomerCardView key={card.id} card={card} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* TAB 2: INVESTOR VIEW (What an Investor Sees on Their Dashboard)     */}
              {/* =================================================================== */}
              {userActiveTab === "investor" && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="card-surface p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <FaMoneyBillWave className="text-emerald-400" /> সর্বমোট বিনিয়োগ
                      </p>
                      <h4 className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-1.5 font-mono">
                        ৳ {totalInvestedAmount.toLocaleString()}
                      </h4>
                    </div>

                    <div className="card-surface p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <FaChartLine className="text-amber-400" /> মোট অর্জিত লাভ
                      </p>
                      <h4 className="text-2xl md:text-3xl font-extrabold text-amber-400 mt-1.5 font-mono">
                        ৳ {totalProfitEarned.toLocaleString()}
                      </h4>
                    </div>

                    <div className="card-surface p-5">
                      <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <FaBoxOpen className="text-indigo-400" /> বিনিয়োগ কার্ড সংখ্যা
                      </p>
                      <h4 className="text-2xl md:text-3xl font-extrabold text-indigo-400 mt-1.5 font-mono">
                        {userInvestorCards.length} টি
                      </h4>
                    </div>
                  </div>

                  {/* Investor Cards List */}
                  {userInvestorCards.length === 0 ? (
                    <div className="card-surface p-12 text-center rounded-2xl">
                      <FaChartLine className="text-slate-600 text-5xl mx-auto mb-3" />
                      <h4 className="text-lg font-bold text-white">
                        কোনো বিনিয়োগ কার্ড পাওয়া যায়নি
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        এই ইউজারের নামে কোনো সক্রিয় বা সম্পন্ন বিনিয়োগ কার্ড নেই।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FaChartLine className="text-indigo-400" />
                        বিনিয়োগ কার্ড ও লাভের বিবরণী
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userInvestorCards.map((card) => {
                          const cardProfits = userProfitRecords.filter(
                            (p) => Number(p.card_id) === Number(card.id)
                          );
                          const totalCardProfit = cardProfits.reduce(
                            (sum, p) => sum + Number(p.profit_amount || 0),
                            0
                          );

                          return (
                            <div
                              key={card.id}
                              className="card-surface p-5 shadow-lg relative overflow-hidden space-y-4"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-xs font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg font-bold">
                                    Card #{card.investment_card_no || card.card_number || card.id}
                                  </span>
                                  <h4 className="text-lg font-bold text-white mt-2">
                                    ৳ {Number(card.investment_amount || 0).toLocaleString()}
                                  </h4>
                                </div>
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize border ${
                                    card.status === "Closed"
                                      ? "bg-slate-700 text-slate-300 border-slate-600"
                                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  }`}
                                >
                                  {card.status || "Active"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-3 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-slate-400">শুরুর তারিখ:</span>
                                  <p className="text-white font-medium mt-0.5 font-mono">
                                    {card.start_date || "-"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-400">মাসিক প্রফিট:</span>
                                  <p className="text-emerald-400 font-bold mt-0.5 font-mono">
                                    ৳ {Number(card.monthly_profit || 0).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-400">মোট লাভ জমা:</span>
                                  <p className="text-amber-400 font-bold mt-0.5 font-mono">
                                    ৳ {totalCardProfit.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-400">কার্ড আইডি:</span>
                                  <p className="text-slate-300 font-mono mt-0.5">
                                    #{card.id}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* TAB 3: PROFILE INFO (User Profile & Credentials in Admin Mode)       */}
              {/* =================================================================== */}
              {userActiveTab === "profile" && (
                <div className="card-surface p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <FaUserCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        ইউজারের সম্পূর্ণ বিবরণ
                      </h3>
                      <p className="text-xs text-slate-400">
                        অ্যাডমিন ও ম্যানেজমেন্টের জন্য ইউজারের সংরক্ষিত তথ্য
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#091122] border border-white/5 p-4 rounded-xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">পূর্ণ নাম</span>
                      <p className="text-base font-bold text-white mt-1">{viewUser.name}</p>
                    </div>

                    <div className="bg-[#091122] border border-white/5 p-4 rounded-xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">মোবাইল নম্বর</span>
                      <p className="text-base font-bold text-white mt-1 font-mono">{viewUser.mobile}</p>
                    </div>

                    <div className="bg-[#091122] border border-white/5 p-4 rounded-xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">ইউজার আইডি</span>
                      <p className="text-base font-bold text-indigo-300 mt-1 font-mono">#{viewUser.id}</p>
                    </div>

                    <div className="bg-[#091122] border border-white/5 p-4 rounded-xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">আইডি নম্বর (NID/Birth Cert)</span>
                      <p className="text-base font-bold text-white mt-1 font-mono">{viewUser.id_number || "-"}</p>
                    </div>

                    <div className="bg-[#091122] border border-white/5 p-4 rounded-xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">অ্যাসাইন করা রোল সমূহ</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {viewUser.roles?.map((r, i) => {
                          const badgeClass =
                            ROLE_BADGE_STYLES[r] || "bg-slate-500/15 text-slate-300 border-slate-500/30";
                          return (
                            <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${badgeClass}`}>
                              {r}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Password display for admin support */}
                    <div className="bg-[#091122] border border-amber-500/30 p-4 rounded-xl">
                      <span className="text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <FaLock size={11} /> ইউজার পাসওয়ার্ড (Admin Access)
                      </span>
                      <p className="text-base font-mono font-bold text-amber-300 mt-1">
                        {viewUser.password || "12345"}
                      </p>
                    </div>

                    <div className="md:col-span-2 bg-[#091122] border border-white/5 p-4 rounded-xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">ঠিকানা</span>
                      <p className="text-sm text-slate-300 mt-1">{viewUser.address || "কোনো ঠিকানা দেওয়া নেই"}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Bar */}
            <div className="bg-[#0b132b]/90 border-t border-white/10 px-5 py-3.5 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 hidden sm:inline">
                💡 আপনি বর্তমানে <strong className="text-white">{viewUser.name}</strong> এর লাইভ ড্যাশবোর্ড মোডে আছেন (পাসওয়ার্ড ছাড়াই অ্যাক্সেসযোগ্য)।
              </span>

              <button
                onClick={() => setViewUser(null)}
                className="btn-secondary text-xs px-5 py-2 rounded-xl transition-all cursor-pointer ml-auto"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ EDIT USER MODAL                                                        */}
      {/* ========================================================================= */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="card-surface-elevated border border-white/15 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaEdit className="text-indigo-400" /> Edit User Information
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">নাম (Name)</label>
                <input
                  className="input-dark"
                  value={editUser?.name || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                />
              </div>

              {/* Mobile */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">মোবাইল (Mobile)</label>
                <input
                  className="input-dark font-mono"
                  value={editUser?.mobile || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, mobile: e.target.value })
                  }
                />
              </div>

              {/* ID Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">আইডি নম্বর (ID Number)</label>
                <input
                  className="input-dark font-mono"
                  value={editUser?.id_number || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, id_number: e.target.value })
                  }
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ঠিকানা (Address)</label>
                <input
                  className="input-dark"
                  value={editUser?.address || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, address: e.target.value })
                  }
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300 block">প্রোফাইল ছবি (Photo)</label>
                <div className="flex items-center gap-4 bg-[#091122] p-3 rounded-2xl border border-white/10">
                  {/* Preview */}
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-500/40 shrink-0">
                    <img
                      src={
                        editUser?.photo instanceof File
                          ? URL.createObjectURL(editUser.photo)
                          : editUser?.photo
                          ? `https://api.supplylinkbd.com/${editUser.photo}`
                          : "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
                      }
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Upload Button */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        setEditUser({ ...editUser, photo: e.target.files[0] })
                      }
                    />

                    <div className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-medium text-slate-200 transition-all cursor-pointer">
                      Choose Photo
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="btn-secondary flex-1 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateUser}
                className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
