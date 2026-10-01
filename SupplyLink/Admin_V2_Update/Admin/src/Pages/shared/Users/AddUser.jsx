import React, { useEffect, useRef, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ID_TYPES, ROLES } from "./UsersType";
import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaLock,
  FaUserTag,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaTimes,
  FaCheckCircle,
  FaShieldAlt,
  FaIdBadge,
  FaUndo,
  FaCloudUploadAlt,
  FaCheck,
  FaInfoCircle,
  FaChevronDown,
  FaPassport,
  FaAddressCard,
  FaArrowRight,
  FaCopy,
} from "react-icons/fa";
import {
  MdAdminPanelSettings,
  MdSupervisorAccount,
  MdBadge,
  MdAccountBalanceWallet,
  MdOutlineStorefront,
} from "react-icons/md";
import { HiOutlineSparkles, HiOutlineDocumentText } from "react-icons/hi2";
import BackButton from "../../../components/BackButton/BackButton";

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
};

const AddUser = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      id_type: "",
      id_number: "",
      mobile: "",
      address: "",
      start_date: new Date().toISOString().split("T")[0],
      password: "12345",
      role: "customer",
    },
  });

  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("form"); // "form" | "preview"
  const [successModalData, setSuccessModalData] = useState(null); // stores created user details for popup modal
  
  // Custom dropdown states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isIdTypeDropdownOpen, setIsIdTypeDropdownOpen] = useState(false);

  const roleDropdownRef = useRef(null);
  const idTypeDropdownRef = useRef(null);
  const fileRef = useRef(null);
  const photoReg = register("photo");

  // Watch fields for dynamic real-time live ID Card preview
  const watchedName = watch("name");
  const watchedRole = watch("role");
  const watchedMobile = watch("mobile");
  const watchedIdType = watch("id_type");
  const watchedIdNumber = watch("id_number");
  const watchedAddress = watch("address");
  const watchedStartDate = watch("start_date");

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (idTypeDropdownRef.current && !idTypeDropdownRef.current.contains(e.target)) {
        setIsIdTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImageFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB", { theme: "dark" });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  };

  const handleClearPhoto = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Completion calculation for live card progress bar
  const formProgress = useMemo(() => {
    let count = 0;
    if (watchedName?.trim()) count++;
    if (watchedMobile?.trim()) count++;
    if (watchedIdType?.trim()) count++;
    if (watchedIdNumber?.trim()) count++;
    if (watchedRole?.trim()) count++;
    if (watchedAddress?.trim()) count++;
    return Math.round((count / 6) * 100);
  }, [watchedName, watchedMobile, watchedIdType, watchedIdNumber, watchedRole, watchedAddress]);

  const onSubmit = async (data) => {
    const requiredFields = [
      { key: "name", message: "Full name is required" },
      { key: "id_type", message: "ID type is required" },
      { key: "id_number", message: "ID number is required" },
      { key: "mobile", message: "Mobile number is required" },
      { key: "address", message: "Address is required" },
      { key: "role", message: "Role selection is required" },
    ];

    for (let field of requiredFields) {
      if (!data[field.key]) {
        toast.error(field.message, { theme: "dark" });
        setActiveMobileTab("form");
        return;
      }
    }

    try {
      const submissionData = {
        ...data,
        password: data.password?.trim() ? data.password.trim() : "12345",
      };

      const formData = new FormData();
      Object.entries(submissionData).forEach(([k, v]) => {
        if (k !== "photo") formData.append(k, v ?? "");
      });

      if (data.photo && data.photo[0]) {
        formData.append("photo", data.photo[0]);
      }

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/create_user.php`,
        {
          credentials: "include",
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to create user", { theme: "dark" });
        return;
      }

      // ✨ Open beautiful custom success modal with user details
      setSuccessModalData({
        ...submissionData,
        photoPreview: preview,
      });

      handleClearPhoto();
      reset({
        name: "",
        id_type: "",
        id_number: "",
        mobile: "",
        address: "",
        start_date: new Date().toISOString().split("T")[0],
        password: "12345",
        role: "customer",
      });
      setActiveMobileTab("form");
    } catch (error) {
      toast.error("Server error occurred! Please try again.", { theme: "dark" });
    }
  };

  const activeRoleData = ROLE_META[watchedRole] || {
    label: "User",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    icon: FaUser,
  };
  const RoleIcon = activeRoleData.icon;

  const activeIdTypeData = ID_TYPE_META[watchedIdType];

  return (
    <div className="w-full min-h-screen .5 py-3  space-y-4 sm:space-y-6 max-w-[1600px] mx-auto pb-24 lg:pb-8">
      
      {/* 🚀 Top Header Navigation Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/95 via-[#0c1427]/90 to-slate-900/95 border border-slate-800/90 backdrop-blur-2xl p-3.5 sm:p-5 lg:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          {/* Top Bar: Navigation + Live Progress Pill */}
          <div className="flex items-center justify-between gap-2">
            <BackButton text="All Users" to="/users/all_sers" />
            
            {/* Clean Compact Progress Badge */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/90 px-3 py-1.5 rounded-full shadow-inner">
              <span className="text-[11px] font-medium text-slate-400">Progress:</span>
              <span className="text-xs font-bold text-indigo-300">{formProgress}%</span>
              <div className="w-12 sm:w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${formProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Main Title Section */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 pt-0.5">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <FaUserPlus className="text-sm sm:text-lg" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Add New User</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold hidden sm:inline-block">
                  Registration
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 truncate">
                Create user profile for staff, customers, investors or suppliers
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Micro Gradient Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 📱 Mobile Tab Switcher (Visible only on screens < lg) */}
      <div className="flex lg:hidden items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => setActiveMobileTab("form")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMobileTab === "form"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HiOutlineDocumentText className="text-base" /> Fill Details
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMobileTab === "preview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HiOutlineSparkles className="text-base text-amber-300" /> Live ID Card
          {watchedName && (
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* 🌟 2-Column Responsive Layout: Left Form (7 Cols) + Right Live Preview Card (5 Cols) */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* ================= LEFT COLUMN: Form Inputs (7 Cols) ================= */}
          <div className={`lg:col-span-7 space-y-4 sm:space-y-6 ${activeMobileTab === "preview" ? "hidden lg:block" : "block"}`}>
            
            {/* 1. Personal Information Card */}
            <div className={`rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-4 sm:p-6 md:p-7 shadow-xl space-y-4 sm:space-y-5 transition-all duration-150 ${isIdTypeDropdownOpen ? "relative z-30 ring-1 ring-indigo-500/20" : "relative z-20"}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <span className="h-2.5 w-2.5 rounded-md bg-indigo-500 ring-4 ring-indigo-500/20"></span>
                  Personal Information
                </div>
                <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
                  <FaInfoCircle className="text-indigo-400" /> Required Fields
                </span>
              </div>

              {/* Name */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <FaUser className="text-indigo-400 text-xs" />
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="group relative flex items-center bg-[#0B132B]/90 border border-slate-700/80 hover:border-slate-600 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="e.g. John Doe"
                    className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-slate-500 font-medium"
                  />
                </div>
              </div>

              {/* Mobile & Date of Joining in 2 Cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    <FaPhone className="text-emerald-400 text-xs" />
                    Mobile Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="group relative flex items-center bg-[#0B132B]/90 border border-slate-700/80 hover:border-slate-600 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
                    <input
                      type="tel"
                      {...register("mobile")}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-slate-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    <FaCalendarAlt className="text-purple-400 text-xs" />
                    Joining Date (Start Date)
                  </label>
                  <div className="group relative flex items-center bg-[#0B132B]/90 border border-slate-700/80 hover:border-slate-600 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
                    <input
                      type="date"
                      {...register("start_date")}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-transparent text-white text-sm sm:text-base outline-none cursor-pointer font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* ✨ Custom ID Type Dropdown & ID Number in 2 Cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Custom ID Type Dropdown */}
                <div className={`space-y-1 sm:space-y-1.5 ${isIdTypeDropdownOpen ? "relative z-50" : "relative z-10"}`} ref={idTypeDropdownRef}>
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    <FaIdCard className="text-amber-400 text-xs" />
                    ID Document Type <span className="text-rose-400">*</span>
                  </label>
                  
                  {/* Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsIdTypeDropdownOpen(!isIdTypeDropdownOpen);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between bg-[#0B132B]/90 border rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 cursor-pointer ${
                      isIdTypeDropdownOpen
                        ? "border-indigo-500 ring-4 ring-indigo-500/15 shadow-lg shadow-indigo-500/10"
                        : "border-slate-700/80 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {activeIdTypeData ? (
                        <>
                          <activeIdTypeData.icon className="text-amber-400 text-sm shrink-0" />
                          <span className="text-white text-xs sm:text-sm font-medium truncate">
                            {activeIdTypeData.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 text-xs sm:text-sm">
                          Select ID Document
                        </span>
                      )}
                    </div>
                    <FaChevronDown
                      className={`text-xs text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                        isIdTypeDropdownOpen ? "rotate-180 text-indigo-400" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Popup Menu */}
                  {isIdTypeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#090F20] border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      {ID_TYPES.map((t) => {
                        const meta = ID_TYPE_META[t] || { label: t, sub: "", icon: FaIdCard };
                        const isSelected = watchedIdType === t;
                        const Icon = meta.icon;

                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setValue("id_type", t, { shouldValidate: true });
                              setIsIdTypeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/25 text-white border border-indigo-500/40 shadow-sm"
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"}`}>
                                <Icon className="text-sm" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
                                  {meta.label}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {meta.sub}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <FaCheck className="text-indigo-400 text-xs shrink-0 mr-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ID Number Input */}
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    <FaIdBadge className="text-amber-400 text-xs" />
                    ID Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="group relative flex items-center bg-[#0B132B]/90 border border-slate-700/80 hover:border-slate-600 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
                    <input
                      type="text"
                      {...register("id_number")}
                      placeholder="Enter NID or Document Number"
                      className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-slate-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-rose-400 text-xs" />
                  Address (Present & Permanent) <span className="text-rose-400">*</span>
                </label>
                <div className="group relative bg-[#0B132B]/90 border border-slate-700/80 hover:border-slate-600 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
                  <textarea
                    {...register("address")}
                    rows={3}
                    placeholder="Enter full address (Road/Village, City, District)..."
                    className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-slate-500 resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 2. Role & Security Configuration */}
            <div className={`rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-4 sm:p-6 md:p-7 shadow-xl space-y-4 sm:space-y-5 transition-all duration-150 ${isRoleDropdownOpen ? "relative z-30 ring-1 ring-indigo-500/20" : "relative z-10"}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <span className="h-2.5 w-2.5 rounded-md bg-purple-500 ring-4 ring-purple-500/20"></span>
                  Role & Security
                </div>
              </div>

              {/* ✨ Custom Role Dropdown */}
              <div className={`space-y-1.5 ${isRoleDropdownOpen ? "relative z-50" : "relative z-10"}`} ref={roleDropdownRef}>
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FaUserTag className="text-purple-400 text-xs" />
                    Select User Role <span className="text-rose-400">*</span>
                  </span>
                  {watchedRole && (
                    <span className="text-[11px] sm:text-xs text-indigo-400 font-bold uppercase">
                      Selected: {watchedRole}
                    </span>
                  )}
                </label>

                {/* Role Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsRoleDropdownOpen(!isRoleDropdownOpen);
                    setIsIdTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between bg-[#0B132B]/90 border rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 transition-all duration-200 cursor-pointer ${
                    isRoleDropdownOpen
                      ? "border-indigo-500 ring-4 ring-indigo-500/15 shadow-lg shadow-indigo-500/10"
                      : "border-slate-700/80 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {watchedRole && ROLE_META[watchedRole] ? (
                      <>
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                          <RoleIcon className="text-base" />
                        </div>
                        <div className="text-left truncate">
                          <span className="text-white text-xs sm:text-sm font-bold uppercase block leading-tight">
                            {ROLE_META[watchedRole].label}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {ROLE_META[watchedRole].desc}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2.5 text-slate-400 text-xs sm:text-sm">
                        <FaUserTag className="text-slate-500" />
                        <span>Click to choose a role (Admin, Staff, Customer, etc.)</span>
                      </div>
                    )}
                  </div>
                  <FaChevronDown
                    className={`text-xs text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                      isRoleDropdownOpen ? "rotate-180 text-indigo-400" : ""
                    }`}
                  />
                </button>

                {/* Role Dropdown Popup Menu */}
                {isRoleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#090F20] border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-2.5 max-h-72 overflow-y-auto sl-scroll space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                      System Roles
                    </div>
                    {ROLES.map((r) => {
                      const meta = ROLE_META[r] || { label: r, desc: "", icon: FaUser };
                      const isSelected = watchedRole === r;
                      const Icon = meta.icon;

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setValue("role", r, { shouldValidate: true });
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600/25 text-white border border-indigo-500/40 shadow-sm"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"}`}>
                              <Icon className="text-base" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                                {meta.label}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {meta.desc}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <FaCheck className="text-indigo-400 text-xs shrink-0 mr-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1 sm:space-y-1.5 pt-1 sm:pt-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FaLock className="text-rose-400 text-xs" />
                    Login Password
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    Default: <code className="text-indigo-300 font-bold">12345</code>
                  </span>
                </label>
                <div className="group relative flex items-center bg-[#0B132B]/90 border border-slate-700/80 hover:border-slate-600 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter password (Default: 12345)"
                    className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-slate-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white transition-colors ml-2 cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Photo Upload Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-4 sm:p-6 md:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <span className="h-2.5 w-2.5 rounded-md bg-emerald-500 ring-4 ring-emerald-500/20"></span>
                  Profile Photo (Avatar Upload)
                </div>
                {preview && (
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all font-medium cursor-pointer"
                  >
                    <FaTimes className="text-[10px]" /> Remove Photo
                  </button>
                )}
              </div>

              {/* Upload Drag & Drop Area */}
              <label
                htmlFor="user_photo_upload_input"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className={`relative flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-pointer group ${
                  isDragOver
                    ? "border-indigo-400 bg-indigo-500/15 scale-[1.01]"
                    : preview
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                    : "border-slate-700/80 bg-[#0B132B]/50 hover:border-indigo-500/50 hover:bg-slate-850"
                }`}
              >
                {preview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-xl shadow-black/50 shrink-0">
                      <img src={preview} alt="User Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        Change Photo
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-1">
                        <FaCheckCircle className="text-[10px]" /> Photo Selected
                      </span>
                      <p className="text-xs text-white font-medium truncate max-w-[200px] sm:max-w-[240px]">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tap or drag new image to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2 py-1 sm:py-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shadow-indigo-500/10">
                      <FaCloudUploadAlt className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-200">
                        Click to upload photo
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                        or drag and drop here
                      </p>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800">
                      JPG, PNG, WEBP (Max 2MB)
                    </span>
                  </div>
                )}

                <input
                  id="user_photo_upload_input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...photoReg}
                  ref={(el) => {
                    photoReg.ref(el);
                    fileRef.current = el;
                  }}
                  onChange={(e) => {
                    photoReg.onChange(e);
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Live User ID / Profile Badge Preview (5 Cols) ================= */}
          <div className={`lg:col-span-5 space-y-4 sm:space-y-6 lg:sticky lg:top-6 ${activeMobileTab === "form" ? "hidden lg:block" : "block"}`}>
            
            {/* 🪪 High-Tech User Profile Preview Card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0D152A]/90 to-slate-950/95 border border-slate-700/80 backdrop-blur-2xl shadow-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
              
              {/* Decorative top ribbon */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"></div>

              {/* Card Header & Live Tag */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live ID Card Preview
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-[11px] font-bold">
                  SupplyLink ID
                </div>
              </div>

              {/* Avatar & Main Identity */}
              <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                {/* Avatar with Glow Ring */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 shadow-2xl shadow-indigo-500/25">
                    <div className="w-full h-full rounded-[20px] sm:rounded-[22px] bg-slate-900 overflow-hidden flex items-center justify-center">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Live Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900/80 to-slate-900 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-indigo-300">
                          {watchedName?.trim() ? (
                            watchedName.trim().charAt(0).toUpperCase()
                          ) : (
                            <FaUser className="text-slate-600 text-2xl sm:text-3xl" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Online / Active indicator */}
                  <span className="absolute bottom-1 right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md"></span>
                </div>

                {/* Name & Role */}
                <div className="space-y-1">
                  <h3 className="text-base sm:text-xl font-extrabold text-white tracking-wide">
                    {watchedName?.trim() || "User Name"}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase px-2.5 sm:px-3 py-1 rounded-xl border shadow-sm ${
                        activeRoleData.badge || "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      <RoleIcon className="text-xs" />
                      {watchedRole ? watchedRole.toUpperCase() : "Select Role"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Info Grid on ID Card */}
              <div className="space-y-2.5 sm:space-y-3 bg-[#070D1E]/80 border border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs font-medium">
                {/* Phone */}
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <FaPhone className="text-emerald-400 text-[10px]" /> Mobile
                  </span>
                  <span className="text-slate-200 font-mono font-bold">
                    {watchedMobile?.trim() || "—"}
                  </span>
                </div>

                {/* ID Type & No */}
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <FaIdCard className="text-amber-400 text-[10px]" /> ID Document
                  </span>
                  <div className="text-right">
                    <span className="text-slate-200 font-semibold block uppercase text-[11px] sm:text-xs">
                      {activeIdTypeData ? activeIdTypeData.label : (watchedIdType ? watchedIdType.replace("_", " ") : "—")}
                    </span>
                    {watchedIdNumber && (
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                        {watchedIdNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Joining Date */}
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <FaCalendarAlt className="text-purple-400 text-[10px]" /> Joining Date
                  </span>
                  <span className="text-slate-200 font-mono">
                    {watchedStartDate || "—"}
                  </span>
                </div>

                {/* Address */}
                <div className="py-1">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] sm:text-xs">
                    <FaMapMarkerAlt className="text-rose-400 text-[10px]" /> Address
                  </span>
                  <p className="text-slate-300 leading-relaxed line-clamp-2 text-[11px] sm:text-xs">
                    {watchedAddress?.trim() || "No address provided yet"}
                  </p>
                </div>
              </div>

              {/* Status Alert Badge */}
              <div className="flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-slate-400">Account Status:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>

            {/* Quick Tips Helper Box */}
            <div className="rounded-2xl sm:rounded-3xl bg-indigo-950/30 border border-indigo-500/20 p-4 sm:p-5 backdrop-blur-xl text-xs space-y-2 text-indigo-200">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <FaInfoCircle className="text-sm" /> Important Guidelines
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px] sm:text-xs">
                <li>Provide an active mobile number for system alerts and communication.</li>
                <li>Valid National ID (NID) or official document number is recommended.</li>
                <li>Default login password is set to <span className="text-indigo-400 font-mono font-bold">12345</span> unless customized.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 📱 Sticky / Floating Action Bar on Mobile & Desktop */}
        <div className="fixed lg:static bottom-0 left-0 right-0 z-30 p-3 sm:p-4 lg:p-0 bg-slate-950/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-t border-slate-800 lg:border-t-0 shadow-2xl lg:shadow-none flex items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              handleClearPhoto();
              reset({
                name: "",
                id_type: "",
                id_number: "",
                mobile: "",
                address: "",
                start_date: new Date().toISOString().split("T")[0],
                password: "12345",
                role: "customer",
              });
              setActiveMobileTab("form");
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer shadow-md"
          >
            <FaUndo className="text-xs" /> Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 sm:px-9 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
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
                Creating User...
              </>
            ) : (
              <>
                <FaCheckCircle className="text-sm" /> Create User
              </>
            )}
          </button>
        </div>
      </form>

      {/* 🎉 Ultra-Premium Glassmorphic Success Modal */}
      {successModalData && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 border border-slate-700/90 shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-6 sm:p-7 text-center space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Top Glowing Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500"></div>

            {/* Close Cross Button */}
            <button
              type="button"
              onClick={() => setSuccessModalData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>

            {/* Glowing Success Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <FaCheckCircle className="text-3xl" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                User Created Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                The account has been created with active system credentials.
              </p>
            </div>

            {/* Created User Summary Card */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-extrabold text-lg shrink-0 overflow-hidden">
                  {successModalData.photoPreview ? (
                    <img
                      src={successModalData.photoPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    successModalData.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {successModalData.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {successModalData.mobile}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {successModalData.role}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Default Password:</span>
                <span className="text-indigo-300 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {successModalData.password || "12345"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer shadow-md"
              >
                <FaUserPlus className="text-xs" /> Add Another
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  navigate("/users/all_sers");
                }}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
              >
                <span>View All Users</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
