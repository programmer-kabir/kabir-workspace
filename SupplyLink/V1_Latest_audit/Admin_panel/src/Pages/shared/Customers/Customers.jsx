import React, { useMemo, useState } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import {
  FaPhoneAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaUsers,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";

const Customers = () => {
  const { isUsersLoading, users, isUsersError } = useUsers();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    const keyword = search.trim().toLowerCase();

    return (
      users
        // 🔥 only customers
        .filter((user) => user.roles?.includes("customer"))
        // 🔍 search inside customers
        .filter(
          (user) =>
            !keyword ||
            user.name?.toLowerCase().includes(keyword) ||
            user.mobile?.toLowerCase().includes(keyword) ||
            String(user.id).includes(keyword)
        )
    );
  }, [users, search]);

  if (isUsersLoading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isUsersError) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <NoDataFound
          message="Failed to load customers"
          subMessage="Please try again later"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto text-gray-200 max-w-[1600px] p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* ===== Top Navigation ===== */}
      <div className="flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
          Customer Directory • মোট গ্রাহক: {filteredUsers.length} জন
        </span>
      </div>

      {/* ===== Header & Search Card ===== */}
      <div className="card-surface p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <FaUsers size={20} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              All Customers
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              নিবন্ধিত গ্রাহক তালিকা, ব্যক্তিগত প্রোফাইল ও কিস্তি কার্ডের বিবরণী
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-96 relative flex items-center">
          <FaSearch className="absolute left-3.5 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, মোবাইল বা আইডি খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#091122] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
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

      {/* ===== Customer Cards Grid ===== */}
      {filteredUsers.length === 0 ? (
        <div className="card-surface p-16 text-center rounded-2xl">
          <span className="text-5xl mb-4 block">👥</span>
          <h3 className="text-lg font-bold text-slate-200">
            কোনো গ্রাহক পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            আপনার সার্চ কি-ওয়ার্ড পরিবর্তন করে আবার চেষ্টা করুন
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="btn-secondary text-xs mt-4"
            >
              সার্চ ক্লিয়ার করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => (
            <Link
              key={user.id}
              to={`/customers/all_customer/customer_details?userId=${user?.id}`}
              className="block group"
            >
              <div className="card-surface h-full p-5 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-2xl">
                <div>
                  {/* Top Customer Info */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={
                        user.photo
                          ? user.photo.startsWith("http")
                            ? user.photo
                            : `https://api.supplylinkbd.com/${user.photo.replace(/^uploads\//, "uploads/")}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name || "Customer"
                            )}&background=10b981&color=fff`
                      }
                      alt={user.name}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-emerald-500/50 transition-all shadow-md shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || "Customer"
                        )}&background=10b981&color=fff`;
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base truncate group-hover:text-emerald-300 transition-colors">
                        {user.name || "No Name"}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                        <FaPhoneAlt className="text-emerald-400/80" size={10} />
                        <span>{user.mobile || "N/A"}</span>
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0 font-bold">
                      #{user.id}
                    </span>
                  </div>

                  {/* Extra Details Box */}
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
                    ) : (
                      <p className="text-slate-500 italic">ঠিকানা যুক্ত করা হয়নি</p>
                    )}
                  </div>
                </div>

                {/* Footer Link Prompt */}
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
                  <span className="font-medium">বিস্তারিত কিস্তি কার্ড দেখুন</span>
                  <FaArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
