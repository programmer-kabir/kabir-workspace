import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";
import { toast } from "react-toastify";
import {
  FaPhoneAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaSearch,
  FaUserPlus,
  FaTimes,
  FaCheck,
  FaCopy,
  FaUser,
  FaUsers,
  FaArrowRight,
  FaCreditCard,
} from "react-icons/fa";

const Customers = () => {
  const { isUsersLoading, users, isUsersError } = useUsers();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'with_mobile' | 'with_nid' | 'with_address'
  const [copiedId, setCopiedId] = useState(null);

  // Filter only customers
  const customers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => u.roles?.includes("customer"));
  }, [users]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: customers.length,
      withMobile: customers.filter((c) => c.mobile && c.mobile.trim() !== "").length,
      withNid: customers.filter((c) => c.id_number && c.id_number.trim() !== "").length,
      withAddress: customers.filter((c) => c.address && c.address.trim() !== "").length,
    };
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return customers.filter((user) => {
      const matchSearch =
        !keyword ||
        user.name?.toLowerCase().includes(keyword) ||
        user.mobile?.toLowerCase().includes(keyword) ||
        user.id_number?.toLowerCase().includes(keyword) ||
        user.address?.toLowerCase().includes(keyword) ||
        String(user.user_id).includes(keyword) ||
        String(user.id).includes(keyword);

      let matchFilter = true;
      if (filterType === "with_mobile") matchFilter = Boolean(user.mobile);
      if (filterType === "with_nid") matchFilter = Boolean(user.id_number);
      if (filterType === "with_address") matchFilter = Boolean(user.address);

      return matchSearch && matchFilter;
    });
  }, [customers, search, filterType]);

  const handleCopyPhone = (mobile, id, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!mobile) return;
    navigator.clipboard.writeText(mobile);
    setCopiedId(id);
    toast.success(`Copied: ${mobile}`, { theme: "dark" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isUsersLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isUsersError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <NoDataFound
          message="Failed to load customers"
          subMessage="Please verify backend connection and try again"
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen  py-3 space-y-5 sm:space-y-6 mx-auto text-slate-200">

      {/* 🚀 Top Header Navigation Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/95 via-[#0c1427]/90 to-slate-900/95 border border-slate-800/90 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 sm:w-64 h-48 sm:h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton text="Dashboard" to="/" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Customer Directory
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {customers.length} Customers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Browse customer profiles, verify documents, and view installment cards
              </p>
            </div>
          </div>

          <Link
            to="/users/add_user"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all cursor-pointer active:scale-95"
          >
            <FaUserPlus className="text-sm" />
            <span>Add New Customer</span>
          </Link>
        </div>
      </div>

      {/* 📊 KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-900/80 border border-cyan-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <FaUsers className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <p className="text-xl sm:text-2xl font-black text-cyan-300">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/80 border border-emerald-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <FaPhoneAlt className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">With Mobile</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-300">{stats.withMobile}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/80 border border-amber-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <FaIdCard className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">NID Verified</p>
            <p className="text-xl sm:text-2xl font-black text-amber-300">{stats.withNid}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <FaMapMarkerAlt className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">With Address</p>
            <p className="text-xl sm:text-2xl font-black text-indigo-300">{stats.withAddress}</p>
          </div>
        </div>
      </div>

      {/* 🔍 Search & Quick Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0B132B]/80 border border-slate-800/90 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-xl">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by Name, Mobile, ID #, NID, Address..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-500/80 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 sl-scroll">
          {[
            { id: "all", label: "All Customers" },
            { id: "with_mobile", label: "With Mobile" },
            { id: "with_nid", label: "With NID/Doc" },
            { id: "with_address", label: "With Address" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filterType === pill.id
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/30 border border-cyan-400/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 👥 Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FaUsers className="text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-white">No Customers Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            No customer matching &quot;{search}&quot; found. Please try a different search keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredCustomers.map((user) => (
            <div
              key={user.id}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800/90 hover:border-cyan-500/40 backdrop-blur-xl p-5 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              {/* Decorative Top Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Top: Avatar, Name, Role & Prominent ID Badge */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 shrink-0 shadow-md">
                      <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center">
                        {user.photo ? (
                          <img
                            src={`https://management.supplylinkbd.com/${user.photo}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "C")}&background=082f49&color=38bdf8`;
                            }}
                          />
                        ) : (
                          <span className="font-extrabold text-base text-cyan-300">
                            {user.name?.charAt(0).toUpperCase() || "C"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Only Customer Role */}
                    <div className="min-w-0">
                      <h3
                        className="text-sm font-bold text-white tracking-wide truncate group-hover:text-cyan-300 transition-colors"
                        title={user.name}
                      >
                        {user.name || "Unnamed Customer"}
                      </h3>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <FaUser className="text-[10px]" />
                          Customer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🌟 Prominent High-Visibility ID Badge */}
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-black text-xs sm:text-sm font-mono shadow-[0_0_14px_rgba(6,182,212,0.25)] tracking-wider">
                      <span className="text-cyan-400 font-semibold text-[10px] uppercase">ID</span>
                      <span className="text-white">#{user.user_id}</span>
                    </span>
                  </div>
                </div>

                {/* Details Card Block */}
                <div className="bg-[#070D1E]/70 border border-slate-800/80 rounded-2xl p-3 space-y-2 text-xs">
                  {/* Mobile with Copy Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <FaPhoneAlt className="text-emerald-400 text-[10px]" /> Mobile
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyPhone(user.mobile, user.id, e)}
                      className="inline-flex items-center gap-1 font-mono font-bold text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer group/btn"
                      title="Click to copy phone number"
                    >
                      <span>{user.mobile || "N/A"}</span>
                      {copiedId === user.id ? (
                        <FaCheck className="text-[10px] text-emerald-400 ml-1" />
                      ) : (
                        <FaCopy className="text-[9px] text-slate-500 group-hover/btn:text-cyan-400 ml-1 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                  {/* ID Document */}
                  {user.id_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <FaIdCard className="text-amber-400 text-[10px]" /> NID/Doc
                      </span>
                      <span className="font-mono text-slate-300 text-[11px] truncate max-w-[140px]">
                        {user.id_number}
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {user.address && (
                    <div className="pt-1 border-t border-slate-800/60">
                      <p className="text-[11px] text-slate-400 flex items-start gap-1.5 line-clamp-1 leading-relaxed">
                        <FaMapMarkerAlt className="text-rose-400 text-[10px] shrink-0 mt-0.5" />
                        <span className="truncate">{user.address}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/80">
                <Link
                  to={`/customers/all_customer/customer_details?userId=${user.user_id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-cyan-600 text-slate-200 hover:text-white text-xs font-bold border border-slate-700/80 hover:border-cyan-500 shadow-sm transition-all cursor-pointer active:scale-95 group/link"
                >
                  <FaCreditCard className="text-xs text-cyan-400 group-hover/link:text-white transition-colors" />
                  <span>View Customer Profile & Cards</span>
                  <FaArrowRight className="text-[10px] opacity-60 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
