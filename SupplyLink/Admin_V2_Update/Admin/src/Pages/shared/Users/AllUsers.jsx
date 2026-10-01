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
  FaEdit,
  FaSearch,
  FaUserPlus,
  FaTimes,
  FaCheck,
  FaCopy,
  FaUser,
  FaShieldAlt,
  FaUsers,
  FaCamera,
  FaCheckCircle,
  FaChevronDown,
  FaKey,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaAddressCard,
  FaPassport,
  FaIdBadge,
} from "react-icons/fa";
import {
  MdAdminPanelSettings,
  MdSupervisorAccount,
  MdBadge,
  MdAccountBalanceWallet,
  MdOutlineStorefront,
} from "react-icons/md";

const ROLE_META = {
  admin: {
    label: "Admin",
    desc: "Full system access & management control",
    color: "from-rose-500/20 to-red-600/20 border-rose-500/40 text-rose-300",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    icon: MdAdminPanelSettings,
  },
  manager: {
    label: "Manager",
    desc: "Operations & inventory oversight",
    color: "from-purple-500/20 to-indigo-600/20 border-purple-500/40 text-purple-300",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    icon: MdSupervisorAccount,
  },
  staff: {
    label: "Staff",
    desc: "Daily collection & customer support",
    color: "from-emerald-500/20 to-teal-600/20 border-emerald-500/40 text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: MdBadge,
  },
  investor: {
    label: "Investor",
    desc: "Investments & dividend returns",
    color: "from-amber-500/20 to-orange-600/20 border-amber-500/40 text-amber-300",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: MdAccountBalanceWallet,
  },
  supplier: {
    label: "Supplier",
    desc: "Product supply & inventory accounts",
    color: "from-blue-500/20 to-cyan-600/20 border-blue-500/40 text-blue-300",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    icon: MdOutlineStorefront,
  },
  customer: {
    label: "Customer",
    desc: "Installment buyer & client",
    color: "from-cyan-500/20 to-sky-600/20 border-cyan-500/40 text-cyan-300",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    icon: FaUser,
  },
  granter: {
    label: "Granter",
    desc: "Customer verification guarantor",
    color: "from-violet-500/20 to-purple-600/20 border-violet-500/40 text-violet-300",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    icon: FaShieldAlt,
  },
  developer: {
    label: "Developer",
    desc: "System developer & technical config",
    color: "from-pink-500/20 to-rose-600/20 border-pink-500/40 text-pink-300",
    badge: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    icon: MdAdminPanelSettings,
  },
};

const ID_TYPE_META = {
  smart_nid: {
    label: "Smart NID Card",
    sub: "National Smart Identity Card",
    icon: FaIdCard,
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  voter_id: {
    label: "National Voter ID",
    sub: "Standard National Identity (NID)",
    icon: FaAddressCard,
    badge: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  birthday_certificate: {
    label: "Birth Certificate",
    sub: "Digital Birth Registration Certificate",
    icon: FaIdBadge,
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  passport: {
    label: "International Passport",
    sub: "MRP or E-Passport Document",
    icon: FaPassport,
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  nid: {
    label: "National ID (NID)",
    sub: "National Identity Document",
    icon: FaIdCard,
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
};

const AllUsers = () => {
  const { isUsersLoading, users, isUsersError, refetch } = useUsers();
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Edit Modal State
  const [activeModalTab, setActiveModalTab] = useState("edit"); // 'edit' | 'history'
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [idTypeDropdownOpen, setIdTypeDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Quick statistics
  const stats = useMemo(() => {
    if (!users) return { total: 0, customers: 0, staff: 0, investors: 0, admins: 0 };
    return {
      total: users.length,
      customers: users.filter((u) => u.roles?.includes("customer")).length,
      staff: users.filter((u) => u.roles?.includes("staff") || u.roles?.includes("manager")).length,
      investors: users.filter((u) => u.roles?.includes("investor") || u.roles?.includes("supplier")).length,
      admins: users.filter((u) => u.roles?.includes("admin") || u.roles?.includes("developer")).length,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const keyword = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchSearch =
        !keyword ||
        user.name?.toLowerCase().includes(keyword) ||
        user.mobile?.toLowerCase().includes(keyword) ||
        user.id_number?.toLowerCase().includes(keyword) ||
        user.roles?.join(",").toLowerCase().includes(keyword) ||
        String(user.user_id).includes(keyword);

      const matchRole =
        selectedRoleFilter === "all" ||
        user.roles?.includes(selectedRoleFilter);

      return matchSearch && matchRole;
    });
  }, [users, search, selectedRoleFilter]);

  const fetchUserHistory = async (userId) => {
    if (!userId) return;
    try {
      setIsHistoryLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/user_history.php?user_id=${userId}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserHistory(json.data);
      } else {
        setUserHistory([]);
      }
    } catch (e) {
      setUserHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleEdit = (user) => {
    const rawRoles = Array.isArray(user.roles) && user.roles.length > 0 
      ? user.roles.map((r) => r.toLowerCase()) 
      : ["customer"];
    const rawIdType = user.id_type || "smart_nid";

    setEditUser({
      ...user,
      roles: rawRoles,
      id_type: rawIdType,
      id_number: user.id_number || "",
      address: user.address || "",
      start_date: user.start_date || "",
      password: user.password || "12345",
      photoFile: null,
      photoPreview: user.photo ? `https://management.supplylinkbd.com/${user.photo}` : "",
    });
    setActiveModalTab("edit");
    setRoleDropdownOpen(false);
    setIdTypeDropdownOpen(false);
    setShowPassword(false);
    setUserHistory([]);
    fetchUserHistory(user.user_id);
    setOpenModal(true);
  };

  const handleCopyPhone = (mobile, id) => {
    if (!mobile) return;
    navigator.clipboard.writeText(mobile);
    setCopiedId(id);
    toast.success(`Copied: ${mobile}`, { theme: "dark" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateUser = async () => {
    if (!editUser?.name?.trim() || !editUser?.mobile?.trim()) {
      toast.error("Name and Mobile are required", { theme: "dark" });
      return;
    }
    try {
      setIsUpdating(true);
      const formData = new FormData();

      formData.append("id", editUser.id);
      formData.append("name", editUser.name.trim());
      formData.append("mobile", editUser.mobile.trim());
      formData.append("roles", (editUser.roles || ["customer"]).join(","));
      formData.append("id_type", editUser.id_type || "smart_nid");
      formData.append("id_number", editUser.id_number || "");
      formData.append("address", editUser.address || "");
      formData.append("start_date", editUser.start_date || "");
      formData.append("password", editUser.password || "12345");

      if (editUser.photoFile instanceof File) {
        formData.append("photo", editUser.photoFile);
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
        toast.success(data.message || "User details updated successfully! 🎉", { theme: "dark" });
        setOpenModal(false);
        refetch();
      } else {
        toast.error(data.message || "Update failed", { theme: "dark" });
      }
    } catch (err) {
      toast.error("Server Error occurred! Please try again.", { theme: "dark" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUsersLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isUsersError) {
    return <NoDataFound />;
  }

  return (
    <div className="w-full min-h-screen  py-3 space-y-5 sm:space-y-6 mx-auto text-slate-200">
      
      {/* 🚀 Top Header Navigation Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/95 via-[#0c1427]/90 to-slate-900/95 border border-slate-800/90 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton text="Dashboard" to="/" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  User Directory
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {users?.length || 0} Total
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Manage, search, edit and view user profiles across all roles
              </p>
            </div>
          </div>

          <Link
            to="/users/add"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition-all cursor-pointer active:scale-95"
          >
            <FaUserPlus className="text-sm" />
            <span>Create New User</span>
          </Link>
        </div>
      </div>

      {/* 📊 KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="col-span-2 lg:col-span-1 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <FaUsers className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-xl sm:text-2xl font-black text-white">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-900/80 border border-cyan-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <FaUser className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customers</p>
            <p className="text-xl sm:text-2xl font-black text-cyan-300">{stats.customers}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/80 border border-emerald-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <MdBadge className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Staff & Mgr</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-300">{stats.staff}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/80 border border-amber-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <MdAccountBalanceWallet className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Investors</p>
            <p className="text-xl sm:text-2xl font-black text-amber-300">{stats.investors}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-900/80 border border-rose-500/30 p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <MdAdminPanelSettings className="text-xl" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admins</p>
            <p className="text-xl sm:text-2xl font-black text-rose-300">{stats.admins}</p>
          </div>
        </div>
      </div>

      {/* 🔍 Search and Role Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0B132B]/80 border border-slate-800/90 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-xl">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Mobile, ID #, NID, Role..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500/80 transition-colors"
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

        {/* Role Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 sl-scroll">
          {[
            { id: "all", label: "All Roles" },
            { id: "customer", label: "Customer" },
            { id: "staff", label: "Staff" },
            { id: "investor", label: "Investor" },
            { id: "manager", label: "Manager" },
            { id: "admin", label: "Admin" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedRoleFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoleFilter === pill.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 👥 Users Cards Grid */}
      {filteredUsers.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FaUsers className="text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-white">No Users Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            No user matching &quot;{search}&quot; with selected filters. Try searching with a different term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredUsers.map((user) => {
            const primaryRole = user.roles?.[0]?.toLowerCase() || "customer";
            const roleMeta = ROLE_META[primaryRole] || ROLE_META.customer;
            const RoleIcon = roleMeta.icon || FaUser;

            return (
              <div
                key={user.id}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800/90 hover:border-indigo-500/40 backdrop-blur-xl p-5 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Top: Avatar, Name, Role & Prominent ID Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 shrink-0 shadow-md">
                        <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center">
                          {user.photo ? (
                            <img
                              src={`https://management.supplylinkbd.com/${user.photo}`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=0f172a&color=818cf8`;
                              }}
                            />
                          ) : (
                            <span className="font-extrabold text-base text-indigo-300">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name & Role */}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-indigo-300 transition-colors" title={user.name}>
                          {user.name || "Unknown User"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {user.roles?.length > 0 ? (
                            user.roles.map((r, rIdx) => {
                              const rMeta = ROLE_META[r.toLowerCase()] || ROLE_META.customer;
                              const RIcon = rMeta.icon || FaUser;
                              return (
                                <span
                                  key={rIdx}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                    rMeta.badge || "bg-slate-800 text-slate-300 border-slate-700"
                                  }`}
                                >
                                  <RIcon className="text-[10px]" />
                                  {r}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                              Customer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 🌟 Prominent High-Visibility ID Badge */}
                    <div className="shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-500/25 border border-indigo-400/50 text-indigo-200 font-black text-xs sm:text-sm font-mono shadow-[0_0_14px_rgba(99,102,241,0.3)] tracking-wider">
                          <span className="text-indigo-400 font-semibold text-[10px] uppercase">ID</span>
                          <span className="text-white">#{user.user_id}</span>
                        </span>
                      </div>
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
                        onClick={() => handleCopyPhone(user.mobile, user.id)}
                        className="inline-flex items-center gap-1 font-mono font-bold text-slate-200 hover:text-indigo-300 transition-colors cursor-pointer group/btn"
                        title="Click to copy phone number"
                      >
                        <span>{user.mobile || "N/A"}</span>
                        {copiedId === user.id ? (
                          <FaCheck className="text-[10px] text-emerald-400 ml-1" />
                        ) : (
                          <FaCopy className="text-[9px] text-slate-500 group-hover/btn:text-indigo-400 ml-1 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
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
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                  <button
                    onClick={() => handleEdit(user)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold border border-slate-700/80 hover:border-indigo-500 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <FaEdit className="text-xs" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✏️ Full Details & History Edit User Glassmorphic Modal */}
      {openModal && editUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 border border-slate-700/90 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-4 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto sl-scroll">
            
            {/* Top Glowing Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-md">
                  <FaEdit className="text-lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Edit User Profile
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-mono text-xs font-bold">
                      ID #{editUser.user_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {editUser.name || "Manage account details and roles"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Modal Tabs Switcher */}
            <div className="flex items-center gap-2 bg-[#070D1E]/90 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalTab("edit")}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeModalTab === "edit"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FaEdit className="text-xs" />
                <span>Full Edit Form</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab("history")}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeModalTab === "history"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FaHistory className="text-xs" />
                <span>History & Overview</span>
              </button>
            </div>

            {/* TAB 1: FULL EDIT FORM */}
            {activeModalTab === "edit" && (
              <div className="space-y-4">
                
                {/* Photo Upload in Edit Modal */}
                <div className="flex items-center gap-4 bg-[#070D1E]/90 border border-slate-800 p-4 rounded-2xl">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-lg shrink-0">
                    <img
                      src={
                        editUser.photoPreview ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(editUser.name || "U")}&background=0f172a&color=818cf8`
                      }
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer shadow-sm active:scale-95">
                      <FaCamera className="text-xs" /> Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("Image size must be less than 2MB", { theme: "dark" });
                              return;
                            }
                            setEditUser({
                              ...editUser,
                              photoFile: file,
                              photoPreview: URL.createObjectURL(file),
                            });
                          }
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 font-mono">
                      JPG, PNG, WEBP (Max 2MB)
                    </p>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <FaUser className="text-indigo-400 text-xs" /> Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editUser.name || ""}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                      placeholder="e.g. Kabir Ahmed"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 font-medium transition-colors"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <FaPhoneAlt className="text-emerald-400 text-xs" /> Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editUser.mobile || ""}
                      onChange={(e) => setEditUser({ ...editUser, mobile: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 font-mono transition-colors"
                    />
                  </div>

                  {/* User Multi-Role Selection */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FaShieldAlt className="text-purple-400 text-xs" /> Assigned Roles <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-indigo-300">
                        {editUser.roles?.length || 0} assigned
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(ROLE_META).map(([key, meta]) => {
                        const Icon = meta.icon || FaUser;
                        const isSelected = editUser.roles?.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const current = editUser.roles || ["customer"];
                              let updated = [];
                              if (isSelected) {
                                if (current.length > 1) {
                                  updated = current.filter((r) => r !== key);
                                } else {
                                  toast.info("A user must have at least one role", { theme: "dark" });
                                  return;
                                }
                              } else {
                                updated = [...current, key];
                              }
                              setEditUser({ ...editUser, roles: updated });
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/20"
                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`text-sm shrink-0 ${isSelected ? "text-indigo-300" : "text-slate-500"}`} />
                              <span className="text-xs font-bold truncate">{meta.label}</span>
                            </div>
                            {isSelected && <FaCheck className="text-xs text-emerald-400 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Click any role to toggle ON/OFF. Users can have multiple roles simultaneously (e.g., Customer + Investor).
                    </p>
                  </div>

                  {/* ID Document Type Custom Dropdown */}
                  <div className="space-y-1.5 relative z-20">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <FaIdCard className="text-amber-400 text-xs" /> ID Document Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setIdTypeDropdownOpen(!idTypeDropdownOpen)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 hover:border-indigo-500 text-white text-sm flex items-center justify-between font-medium transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        {(() => {
                          const meta = ID_TYPE_META[editUser.id_type] || ID_TYPE_META.smart_nid;
                          const Icon = meta.icon || FaIdCard;
                          return (
                            <>
                              <Icon className="text-amber-400 text-sm" />
                              <span>{meta.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      <FaChevronDown className={`text-xs text-slate-400 transition-transform ${idTypeDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {idTypeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-1 z-50 max-h-56 overflow-y-auto sl-scroll">
                        {Object.entries(ID_TYPE_META).map(([key, meta]) => {
                          const Icon = meta.icon || FaIdCard;
                          const isSelected = editUser.id_type === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setEditUser({ ...editUser, id_type: key });
                                setIdTypeDropdownOpen(false);
                              }}
                              className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                                isSelected ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="text-sm" />
                                <span>{meta.label}</span>
                              </div>
                              {isSelected && <FaCheck className="text-xs" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ID Document Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <FaIdBadge className="text-amber-400 text-xs" /> Document / NID Number
                    </label>
                    <input
                      type="text"
                      value={editUser.id_number || ""}
                      onChange={(e) => setEditUser({ ...editUser, id_number: e.target.value })}
                      placeholder="e.g. 19958291829"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 font-mono transition-colors"
                    />
                  </div>

                  {/* Start / Joining Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <FaCalendarAlt className="text-cyan-400 text-xs" /> Joining / Start Date
                    </label>
                    <input
                      type="date"
                      value={editUser.start_date || ""}
                      onChange={(e) => setEditUser({ ...editUser, start_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <FaKey className="text-rose-400 text-xs" /> Account Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editUser.password || ""}
                      onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                      placeholder="Enter password (default: 12345)"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                    </button>
                  </div>
                </div>

                {/* Address Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-rose-400 text-xs" /> Full Address
                  </label>
                  <textarea
                    rows={2}
                    value={editUser.address || ""}
                    onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                    placeholder="Village / Road, Post Office, Police Station, District..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E]/90 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 resize-none font-medium transition-colors"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: REAL EDIT HISTORY & AUDIT LOGS */}
            {activeModalTab === "history" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Header Summary */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                      #{editUser.user_id}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{editUser.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Registration Date: {editUser.start_date || "Original Record"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    {userHistory.length} Total {userHistory.length === 1 ? "Edit" : "Edits"}
                  </span>
                </div>

                {isHistoryLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-400">Loading audit history...</p>
                  </div>
                ) : userHistory.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl bg-[#070D1E]/80 border border-slate-800/80 p-6 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <FaCheckCircle className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">No Edit History Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        This user profile has not been edited or modified since its creation. All information matches the original registration record.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>Original Role: <b className="text-indigo-300 uppercase">{editUser.role || "Customer"}</b></span>
                      <span>•</span>
                      <span>Mobile: <b className="text-slate-300">{editUser.mobile}</b></span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto sl-scroll pr-1">
                    {userHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="rounded-2xl bg-[#070D1E]/90 border border-slate-800 p-3.5 space-y-2.5 shadow-md"
                      >
                        {/* Edit Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            <span className="text-xs font-bold text-indigo-300">
                              Edit #{userHistory.length - idx}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.created_at})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                            By {item.edited_by || "Admin"}
                          </span>
                        </div>

                        {/* List of Changes */}
                        <div className="space-y-1.5">
                          {Array.isArray(item.changes) ? (
                            item.changes.map((ch, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs"
                              >
                                <span className="font-bold text-indigo-300 sm:w-28 shrink-0">
                                  {ch.field}:
                                </span>
                                <div className="flex items-center gap-1.5 font-mono text-[11px] min-w-0 flex-1">
                                  <span className="text-rose-300/80 line-through truncate max-w-[140px]" title={String(ch.old)}>
                                    {String(ch.old)}
                                  </span>
                                  <span className="text-slate-500 font-bold">➔</span>
                                  <span className="text-emerald-300 font-bold truncate max-w-[160px]" title={String(ch.new)}>
                                    {String(ch.new)}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 font-mono">
                              {JSON.stringify(item.changes)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                disabled={isUpdating}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isUpdating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="text-sm" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
