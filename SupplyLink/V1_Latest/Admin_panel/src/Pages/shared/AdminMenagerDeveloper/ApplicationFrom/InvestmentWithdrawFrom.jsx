import React, { useMemo, useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import LuxuryToast from "../../../../components/Modal/LuxuryToast";
import {
  User,
  CreditCard,
  Calendar,
  RotateCcw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Sparkles,
  ShieldCheck,
  Lock,
  Info,
  Clock,
  ArrowRight,
  Search,
  ChevronDown,
  X,
  Check,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../../Provider/AuthProvider";
import { InvestmentWithdrawApplicationModal } from "../../../../components/InvestmentWithdraw/InvestmentWithdrawApplicationModal";
import useUsers from "../../../../utils/Hooks/useUsers";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import useProfitAnalytics from "../../../../utils/Hooks/useProfitAnalytics";

/* ================= helpers ================= */
const bdTodayYMD = () => {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );
  return d.toISOString().slice(0, 10);
};

const cn = (...s) => s.filter(Boolean).join(" ");

const money = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const getAvatarUrl = (u) => {
  if (!u) return "";
  if (u.photo) {
    return `https://api.supplylinkbd.com/${u.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`;
  }
  if (u.image) {
    return u.image.startsWith("http")
      ? u.image
      : `https://api.supplylinkbd.com/${u.image.replace(/^\/?(uploads\/)?/, "uploads/")}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=0284c7&color=fff&bold=true`;
};

const InvestmentWithdrawFrom = () => {
  const { user } = useAuth();

  const { users = [] } = useUsers();
  const { investmentCards = [] } = useInvestmentCards();
  const {
    isProfitAnalyticsLoading,
    profitAnalytics,
    isUProfitAnalyticsError,
    refetch,
  } = useProfitAnalytics();

  const [investorId, setInvestorId] = useState("");
  const [cardId, setCardId] = useState("");
  const [withdrawDate, setWithdrawDate] = useState(bdTodayYMD());
  const [reason, setReason] = useState("");

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);

  // Luxury Toast State
  const [luxuryToast, setLuxuryToast] = useState(null);

  const notify = (type, title, message, meta = {}) => {
    setLuxuryToast({ type, title, message, ...meta });
  };

  // Search & Combobox states for Investors
  const [investorSearch, setInvestorSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Custom Card Dropdown state
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState(false);
  const cardDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        cardDropdownRef.current &&
        !cardDropdownRef.current.contains(event.target)
      ) {
        setIsCardDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter users to get all investors (or those who hold investment cards)
  const investorList = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter((u) => {
      const hasInvestorRole = Array.isArray(u?.roles)
        ? u.roles.includes("investor")
        : typeof u?.roles === "string"
          ? u.roles.includes("investor")
          : u?.role === "investor";
      const hasCards = investmentCards.some(
        (c) => Number(c.investor_id) === Number(u.id),
      );
      return hasInvestorRole || hasCards;
    });
  }, [users, investmentCards]);

  // Search filter for investor dropdown
  const filteredInvestors = useMemo(() => {
    const q = investorSearch.toLowerCase().trim();
    if (!q) return investorList;
    return investorList.filter((u) => {
      const idStr = String(u.id || "");
      const nameStr = (u.name || "").toLowerCase();
      const phoneStr = (u.mobile || "").toLowerCase();
      const nidStr = (u.id_number || "").toLowerCase();
      return (
        idStr.includes(q) ||
        nameStr.includes(q) ||
        phoneStr.includes(q) ||
        nidStr.includes(q)
      );
    });
  }, [investorList, investorSearch]);

  // ===== find investor by id =====
  const investor = useMemo(() => {
    const id = Number(investorId);
    if (!id) return null;
    return users.find((u) => Number(u.id) === id) || null;
  }, [users, investorId]);

  // ===== investor's cards (filter) =====
  const investorCards = useMemo(() => {
    const id = Number(investorId);
    if (!id) return [];
    return investmentCards
      .filter((c) => Number(c.investor_id) === id)
      .slice()
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [investmentCards, investorId]);

  // ===== Active Cards for this investor =====
  const activeInvestorCards = useMemo(() => {
    return investorCards.filter(
      (c) => (c.status || "").toLowerCase() === "active",
    );
  }, [investorCards]);

  // ⚡ AUTO-SELECT LOGIC:
  // If the investor has exactly 1 active card, automatically select it!
  // If there are multiple active cards, keep it unselected so the user can choose.
  // If 0 active cards, do not select anything.
  useEffect(() => {
    if (!investorId) {
      setCardId("");
      return;
    }

    const activeCards = investorCards.filter(
      (c) => (c.status || "").toLowerCase() === "active",
    );

    if (activeCards.length === 1) {
      setCardId(String(activeCards[0].id));
    } else {
      setCardId("");
    }
  }, [investorId, investorCards]);

  // ===== selected card =====
  const selectedCard = useMemo(() => {
    const cid = Number(cardId);
    if (!cid) return null;
    return investorCards.find((c) => Number(c.id) === cid) || null;
  }, [investorCards, cardId]);

  const selectedCardProfitRows = useMemo(() => {
    const cid = Number(cardId);
    if (!cid) return [];
    return (profitAnalytics || []).filter((r) => Number(r.card_id) === cid);
  }, [profitAnalytics, cardId]);

  const sumOfCardProfit = useMemo(() => {
    return selectedCardProfitRows.reduce(
      (sum, r) => sum + Number(r.profit_amount || 0),
      0,
    );
  }, [selectedCardProfitRows]);

  // ✅ fetchPreview: demo modal open
  const canFetchPreview = Boolean(investorId.trim() && cardId.trim());

  const fetchPreview = async () => {
    if (!investorId.trim())
      return notify("error", "ইনভেস্টর প্রয়োজন", "অনুগ্রহ করে ইনভেস্টর নির্বাচন করুন (Investor ID required)");
    if (!cardId.trim())
      return notify("error", "কার্ড প্রয়োজন", "অনুগ্রহ করে ইনভেস্টমেন্ট কার্ড নির্বাচন করুন (Card ID required)");
    if (!investor)
      return notify("error", "ইনভেস্টর পাওয়া যায়নি", "নির্বাচিত ইনভেস্টর পাওয়া যায়নি (Investor not found)");
    if (!selectedCard)
      return notify("error", "কার্ড পাওয়া যায়নি", "এই ইনভেস্টরের জন্য কার্ডটি খুঁজে পাওয়া যায়নি");
    if ((selectedCard?.status || "").toLowerCase() === "closed") {
      return notify("warning", "কার্ডটি বন্ধ রয়েছে", "এই ইনভেস্টমেন্ট কার্ডটি ইতিমধ্যে ক্লোজড (Closed)");
    }
    try {
      setLoadingPreview(true);
      setPreview(null);

      // ✅ demo open modal
      setOpenPreviewModal(true);
      setPreview({ demo: true });
    } catch (e) {
      notify("error", "প্রিভিউ লোড ব্যর্থ", e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const totalProfit = useMemo(() => {
    return Number(sumOfCardProfit || 0);
  }, [sumOfCardProfit]);

  const payableAmount = useMemo(() => {
    if (!selectedCard) return 0;

    const today = bdTodayYMD();
    const maturity = selectedCard.maturity_date;

    // 🟢 short time card → always profit
    if (selectedCard.payment_type === "shorttime") {
      return Number(sumOfCardProfit || 0);
    }

    // 🟡 flexible card
    if (selectedCard.payment_type === "flexible") {
      // maturity date today or passed
      if (maturity && maturity <= today) {
        return Number(sumOfCardProfit || 0);
      }
      // maturity not reached
      return 0;
    }

    // fallback
    return 0;
  }, [selectedCard, sumOfCardProfit]);

  const submitRequest = async () => {
    if (!preview)
      return notify("warning", "প্রিভিউ প্রয়োজন", "আগে 'Load Preview & Verify' বাটনে ক্লিক করে প্রিভিউ যাচাই করুন");
    if (!withdrawDate)
      return notify("warning", "তারিখ প্রয়োজন", "উইথড্র তারিখ নির্বাচন করা আবশ্যক");
    if (!reason.trim())
      return notify("warning", "কারণ প্রয়োজন", "উইথড্র করার কারণ উল্লেখ করুন (Reason required)");

    const confirm = await Swal.fire({
      title: "Submit withdraw request?",
      text: "Are you sure you want to submit this withdraw request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/withdraw_applications/create_withdraw_request.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            investor_id: investorId,
            card_id: cardId,
            withdraw_date: withdrawDate,
            reason: reason.trim(),
            requested_by: user?.id,
            total_profit: Number(totalProfit || 0),
            payable_amount: Number(payableAmount || 0),
            amount: selectedCard?.investment_amount,
            mobile: investor?.mobile,
            maturity_date: selectedCard?.maturity_date || null,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Submit failed");

      notify(
        "success",
        "উইথড্র আবেদন সফল হয়েছে!",
        "উইথড্র রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে এবং ইমেইল নোটিফিকেশন পাঠানো হয়েছে ✅",
        {
          tag: `#Req-${data?.request_id || ""}`,
          amount: payableAmount > 0 ? payableAmount : selectedCard?.investment_amount,
        },
      );
      setReason("");
      setPreview(null);
    } catch (e) {
      notify("error", "সাবমিট ব্যর্থ হয়েছে", e.message);
    }
  };

  const handleSelectInvestor = (selected) => {
    setInvestorId(String(selected.id));
    setPreview(null);
    setIsDropdownOpen(false);
    setInvestorSearch("");
    setIsCardDropdownOpen(false);
  };

  return (
    <div className="relative w-full space-y-4 pb-8 sm:space-y-5">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl sm:h-72 sm:w-72" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl sm:h-80 sm:w-80" />

      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-[#071025] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/25 sm:h-14 sm:w-14 sm:rounded-2xl">
              <CreditCard className="h-5 w-5 sm:h-7 sm:w-7" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900 sm:h-4 sm:w-4">
                <Sparkles className="h-2 w-2 text-white sm:h-2.5 sm:w-2.5" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
                  Investment{" "}
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Withdraw Request
                  </span>
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                  <ShieldCheck className="h-3 w-3" />
                  Formal Gateway
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Enter Investor ID or select from Investor list, review real-time profit analytics, preview and submit.
              </p>
            </div>
          </div>

          {/* Step Progress Pills */}
          <div className="w-full overflow-x-auto pb-1 lg:w-auto lg:overflow-visible lg:pb-0">
            <div className="inline-flex min-w-max items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-1 text-xs backdrop-blur-md sm:gap-2 sm:rounded-2xl sm:p-1.5">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs",
                  investor && selectedCard
                    ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
                )}
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-current/20 text-[9px] font-bold sm:h-4 sm:w-4 sm:text-[10px]">
                  1
                </span>
                <span>Select Card</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-600 sm:h-3.5 sm:w-3.5" />
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs",
                  preview
                    ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "text-slate-500",
                )}
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-current/20 text-[9px] font-bold sm:h-4 sm:w-4 sm:text-[10px]">
                  2
                </span>
                <span>Preview</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-600 sm:h-3.5 sm:w-3.5" />
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs",
                  preview && reason.trim()
                    ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "text-slate-500",
                )}
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-current/20 text-[9px] font-bold sm:h-4 sm:w-4 sm:text-[10px]">
                  3
                </span>
                <span>Submit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0b1329]/95 via-slate-950 to-slate-950 shadow-2xl backdrop-blur-2xl sm:rounded-3xl">
        {/* Form Subheader */}
        <div className="flex flex-col gap-2.5 border-b border-slate-800/80 bg-slate-900/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 sm:h-8 sm:w-8">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white sm:text-base">
                Withdrawal Application Form
              </h2>
              <p className="text-[11px] text-slate-400 sm:text-xs">
                Fill the required fields below to proceed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {preview ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 sm:text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Preview Loaded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 sm:text-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Form Ready
              </span>
            )}
          </div>
        </div>

        <div className="space-y-5 p-4 sm:space-y-6 sm:p-5 md:p-6">
          {/* Section 1 & 2: Identification & Schedule Grid */}
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            {/* Left 2 Cols: Identification */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700/80 sm:rounded-2xl sm:p-5 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 sm:mb-5 sm:pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Investor & Card Identification
                    </h3>
                    <p className="text-xs text-slate-400">
                      ইনভেস্টর সিলেক্ট করলে সক্রিয় কার্ড থাকলে স্বয়ংক্রিয়ভাবে চলে আসবে
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                    {investorList.length} Investors
                  </span>
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-400">
                    Required
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                {/* 🔹 1. Investor Selector with Photo, ID, Search & List */}
                <div className="space-y-1.5 sm:space-y-2 relative" ref={dropdownRef}>
                  <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                    <span>Investor (ছবি ও ID সহ)</span>
                    {investor && (
                      <span className="text-[11px] font-medium text-emerald-400">
                        ✓ Selected (#{investor.id})
                      </span>
                    )}
                  </label>

                  {/* Selected Investor Display Card */}
                  {investor && !isDropdownOpen ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-slate-900/80 p-2.5 shadow-sm transition">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={getAvatarUrl(investor)}
                          alt={investor.name || "Investor"}
                          className="h-10 w-10 shrink-0 rounded-full border border-emerald-500/40 object-cover bg-slate-800"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || "User")}&background=0284c7&color=fff&bold=true`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-bold text-white">
                              {investor.name || "Investor"}
                            </span>
                            <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-emerald-300">
                              #{investor.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {investor.mobile || "No Mobile"}
                            {investorCards.length > 0 && (
                              <span className="ml-1 text-cyan-300 font-medium">
                                • {investorCards.length} {investorCards.length === 1 ? "card" : "cards"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(true);
                            setInvestorSearch("");
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInvestorId("");
                            setCardId("");
                            setPreview(null);
                            setInvestorSearch("");
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                          title="Clear selection"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Search Input / Combobox Trigger */
                    <div className="relative">
                      <div
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border bg-slate-950/70 px-3 py-2 transition sm:gap-3 sm:px-3.5 sm:py-2.5",
                          isDropdownOpen
                            ? "border-cyan-500/70 ring-2 ring-cyan-500/20"
                            : "border-slate-800 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20",
                        )}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-cyan-400 sm:h-8 sm:w-8">
                          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <input
                          value={investorSearch}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInvestorSearch(val);
                            setIsDropdownOpen(true);
                            if (/^\d+$/.test(val.trim())) {
                              const found = users.find(
                                (u) => Number(u.id) === Number(val.trim()),
                              );
                              if (found) {
                                setInvestorId(String(found.id));
                                setPreview(null);
                              }
                            }
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && filteredInvestors.length > 0) {
                              e.preventDefault();
                              handleSelectInvestor(filteredInvestors[0]);
                            }
                          }}
                          className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
                          placeholder="Search by ID (e.g. 360), Name, Phone..."
                        />
                        {investorSearch && (
                          <button
                            type="button"
                            onClick={() => setInvestorSearch("")}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen((prev) => !prev)}
                          className="text-slate-400 hover:text-white"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isDropdownOpen && "rotate-180",
                            )}
                          />
                        </button>
                      </div>

                      {/* 📋 Dropdown List with Investor Photos, Names & IDs */}
                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/98 shadow-2xl backdrop-blur-xl divide-y divide-white/5 scrollbar-thin scrollbar-thumb-slate-700">
                          {filteredInvestors.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              <p className="font-semibold text-slate-300">
                                কোনো ইনভেস্টর পাওয়া যায়নি
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                &quot;{investorSearch}&quot; আইডি বা নাম দিয়ে কোনো তথ্য মেলেনি
                              </p>
                            </div>
                          ) : (
                            filteredInvestors.slice(0, 30).map((inv) => {
                              const isSelected = String(inv.id) === String(investorId);
                              const cardsCount = investmentCards.filter(
                                (c) => Number(c.investor_id) === Number(inv.id),
                              ).length;

                              return (
                                <div
                                  key={inv.id}
                                  onClick={() => handleSelectInvestor(inv)}
                                  className={cn(
                                    "flex items-center justify-between p-2.5 sm:p-3 transition cursor-pointer hover:bg-cyan-500/10",
                                    isSelected && "bg-cyan-500/15 border-l-2 border-cyan-400",
                                  )}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <img
                                      src={getAvatarUrl(inv)}
                                      alt={inv.name || "Investor"}
                                      className="h-9 w-9 shrink-0 rounded-full border border-slate-700 object-cover bg-slate-800"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name || "User")}&background=0284c7&color=fff&bold=true`;
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="truncate text-xs font-bold text-white sm:text-sm">
                                          {inv.name || "Investor"}
                                        </span>
                                        <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-cyan-300">
                                          ID: #{inv.id}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {inv.mobile || "No Mobile"}
                                        {cardsCount > 0 && (
                                          <span className="ml-1 text-emerald-400 font-medium">
                                            • {cardsCount} {cardsCount === 1 ? "card" : "cards"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <Check className="h-4 w-4 text-cyan-400 shrink-0 ml-2" />
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="pt-0.5 text-[11px] text-slate-500">
                    {investor
                      ? `Selected: ${investor.name} (ID: #${investor.id})`
                      : "Type an ID directly (e.g. 360) or pick from the list with picture"}
                  </p>
                </div>

                {/* 🔹 2. Custom Investment Card Selector Dropdown */}
                <div className="space-y-1.5 sm:space-y-2 relative" ref={cardDropdownRef}>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                    <span>Investment Card</span>
                    {investorCards.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-300">
                        {activeInvestorCards.length === 1 && selectedCard && (
                          <span className="flex items-center gap-0.5 text-emerald-400">
                            <Zap className="h-3 w-3" /> Auto Active
                          </span>
                        )}
                        <span>({activeInvestorCards.length} active / {investorCards.length} total)</span>
                      </span>
                    )}
                  </div>

                  {/* Custom Card Trigger Box */}
                  <div
                    onClick={() => {
                      if (investorId && investorCards.length > 0) {
                        setIsCardDropdownOpen((prev) => !prev);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2.5 transition sm:p-3",
                      !investorId || investorCards.length === 0
                        ? "cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-60"
                        : selectedCard
                          ? "cursor-pointer border-cyan-500/50 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-blue-950/40 shadow-sm hover:border-cyan-400"
                          : isCardDropdownOpen
                            ? "cursor-pointer border-cyan-500/70 bg-slate-950/90 ring-2 ring-cyan-500/20"
                            : "cursor-pointer border-slate-800 bg-slate-950/70 hover:border-slate-700",
                    )}
                  >
                    {selectedCard ? (
                      /* Display Selected Card Info */
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/20 text-cyan-300">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-bold text-white sm:text-sm">
                              {selectedCard.card_name || "Investment Card"}
                            </span>
                            <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-cyan-300">
                              #{selectedCard.id}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.2 text-[10px] font-semibold uppercase",
                                (selectedCard.status || "").toLowerCase() === "active"
                                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                                  : "border border-rose-500/30 bg-rose-500/20 text-rose-300",
                              )}
                            >
                              {selectedCard.status || "ACTIVE"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-emerald-400">
                              ৳ {money(selectedCard.investment_amount)}
                            </span>
                            <span>•</span>
                            <span className="capitalize text-slate-300">
                              {selectedCard.payment_type || "Standard"}
                            </span>
                            {selectedCard.maturity_date && (
                              <>
                                <span>•</span>
                                <span>Mat: {selectedCard.maturity_date}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Placeholder state */
                      <div className="flex items-center gap-2.5 text-slate-400">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">
                          {!investorId
                            ? "Select an investor first"
                            : !investor
                              ? "Investor not found"
                              : investorCards.length === 0
                                ? "No cards for this investor"
                                : activeInvestorCards.length > 1
                                  ? `Choose from ${activeInvestorCards.length} active cards...`
                                  : "Select an investment card"}
                        </span>
                      </div>
                    )}

                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform ml-2",
                        isCardDropdownOpen && "rotate-180",
                      )}
                    />
                  </div>

                  {/* 📋 Floating Card Dropdown List with Gorgeous Looks */}
                  {isCardDropdownOpen && investorCards.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/98 p-2 shadow-2xl backdrop-blur-2xl space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-white/5 pb-1.5">
                        <span>Available Investment Cards</span>
                        <span>{investorCards.length} Cards</span>
                      </div>

                      {investorCards.map((c) => {
                        const isSelected = String(c.id) === String(cardId);
                        const isClosed = (c.status || "").toLowerCase() === "closed";

                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (isClosed) {
                                notify(
                                  "warning",
                                  "কার্ড বন্ধ রয়েছে",
                                  "এই ইনভেস্টমেন্ট কার্ডটি ইতিমধ্যে ক্লোজড (Closed)",
                                );
                                return;
                              }
                              setCardId(String(c.id));
                              setPreview(null);
                              setIsCardDropdownOpen(false);
                            }}
                            className={cn(
                              "rounded-xl border p-2.5 sm:p-3 transition",
                              isClosed
                                ? "cursor-not-allowed border-white/5 bg-slate-950/30 opacity-50"
                                : isSelected
                                  ? "cursor-pointer border-cyan-500/60 bg-gradient-to-r from-cyan-950/40 to-slate-900 shadow-md"
                                  : "cursor-pointer border-white/5 bg-slate-950/60 hover:border-cyan-500/30 hover:bg-slate-800/60",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 text-[10px] font-mono font-bold text-cyan-300">
                                  #{c.id}
                                </span>
                                <span className="text-xs font-bold text-white sm:text-sm">
                                  {c.card_name || "Investment Card"}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.2 text-[10px] font-semibold uppercase",
                                    isClosed
                                      ? "border border-rose-500/30 bg-rose-500/20 text-rose-300"
                                      : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
                                  )}
                                >
                                  {c.status || "ACTIVE"}
                                  {isClosed ? " (Closed)" : ""}
                                </span>
                              </div>

                              {isSelected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] border-t border-white/5 pt-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Amount:</span>
                                <span className="font-bold text-emerald-400">
                                  ৳ {money(c.investment_amount)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-300">
                                <span className="capitalize rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                                  {c.payment_type || "Standard"}
                                </span>
                                {c.maturity_date && (
                                  <span className="text-slate-400 text-[10px]">
                                    Mat: {c.maturity_date}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="pt-0.5 text-[11px] text-slate-500">
                    {selectedCard ? (
                      activeInvestorCards.length === 1 ? (
                        <span className="text-emerald-400">
                          ⚡ Auto-selected single active card (#{selectedCard.id})
                        </span>
                      ) : (
                        <span>Selected card: #{selectedCard.id} — {selectedCard.card_name}</span>
                      )
                    ) : investorCards.length === 0 ? (
                      "Card list dynamically loaded based on selected Investor"
                    ) : (
                      "Click to choose an active card from the list"
                    )}
                  </p>
                </div>
              </div>

              {/* Selected Card Rich Preview Card */}
              {selectedCard && (
                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30 p-3.5 transition sm:mt-5 sm:rounded-2xl sm:p-4">
                  <div className="flex flex-col gap-2 border-b border-white/5 pb-2.5 sm:flex-row sm:items-center sm:justify-between sm:pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500/20 text-[11px] font-bold text-cyan-300 sm:h-6 sm:w-6 sm:text-xs">
                        #{selectedCard.id}
                      </span>
                      <span className="text-xs font-bold text-white sm:text-sm">
                        {selectedCard.card_name || "Investment Card"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          (selectedCard.status || "").toLowerCase() === "active"
                            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                            : "border border-rose-500/30 bg-rose-500/15 text-rose-400",
                        )}
                      >
                        {selectedCard.status || "ACTIVE"}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                        Card Type:
                      </span>{" "}
                      <span className="text-xs font-semibold capitalize text-cyan-300">
                        {selectedCard.payment_type || "Standard"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    <div className="rounded-lg bg-slate-950/40 p-2 sm:rounded-xl sm:p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        Invest Amount
                      </div>
                      <div className="mt-0.5 truncate text-xs font-bold text-emerald-400 sm:text-sm">
                        ৳ {money(selectedCard?.investment_amount)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-950/40 p-2 sm:rounded-xl sm:p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        Maturity Date
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-200">
                        {selectedCard?.maturity_date || "N/A"}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-950/40 p-2 sm:rounded-xl sm:p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        Accrued Profit
                      </div>
                      <div className="mt-0.5 truncate text-xs font-bold text-cyan-300 sm:text-sm">
                        ৳ {money(sumOfCardProfit)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-950/40 p-2 sm:rounded-xl sm:p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        Payable Status
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 truncate text-xs font-bold",
                          payableAmount > 0
                            ? "text-emerald-400"
                            : "text-amber-400",
                        )}
                      >
                        {payableAmount > 0
                          ? `৳ ${money(payableAmount)} Eligible`
                          : "Pending Eligibility"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Withdraw Schedule */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700/80 sm:rounded-2xl sm:p-5">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3 sm:mb-5 sm:pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Withdraw Schedule
                      </h3>
                      <p className="text-xs text-slate-400">
                        Select effective date
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                    Schedule
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs font-medium text-slate-300">
                    Withdrawal Date
                  </label>

                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 transition focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 sm:gap-3 sm:px-3.5 sm:py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-amber-400 sm:h-8 sm:w-8">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      type="date"
                      value={withdrawDate}
                      onChange={(e) => setWithdrawDate(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-white outline-none dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Policy note */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90 sm:mt-5 sm:p-3.5">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Profit eligibility and calculations are verified dynamically
                    against this withdrawal date.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: Load Preview & Reset */}
          <div className="flex flex-col items-stretch gap-3 border-y border-slate-800/80 py-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={fetchPreview}
              disabled={!canFetchPreview || loadingPreview}
              className={cn(
                "group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold shadow-md transition sm:w-auto sm:px-7",
                !canFetchPreview || loadingPreview
                  ? "cursor-not-allowed border border-slate-800 bg-slate-800/40 text-slate-500"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 active:scale-[0.98]",
              )}
            >
              {loadingPreview ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Loading Preview...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 transition group-hover:scale-110" />
                  <span>Load Preview & Verify</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setInvestorId("");
                setInvestorSearch("");
                setIsDropdownOpen(false);
                setCardId("");
                setIsCardDropdownOpen(false);
                setWithdrawDate(bdTodayYMD());
                setReason("");
                setPreview(null);
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/80 hover:text-white active:scale-[0.98] sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Fields</span>
            </button>

            {/* Quick status message */}
            {!canFetchPreview ? (
              <span className="text-center text-xs text-slate-500 sm:ml-auto sm:text-right">
                *Select an Investor and Card to unlock preview
              </span>
            ) : preview ? (
              <span className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-400 sm:ml-auto sm:justify-end">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Preview verified — you can now submit the request
              </span>
            ) : (
              <span className="text-center text-xs text-cyan-400 sm:ml-auto sm:text-right">
                Ready to review withdraw calculation
              </span>
            )}
          </div>

          {/* Section 3: Reason Textarea & Warning */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700/80 sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">
                    Withdrawal Reason / Purpose
                  </label>
                  <p className="text-xs text-slate-400">
                    Explain why this withdraw is being requested
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500">
                {reason.length} characters
              </span>
            </div>

            <div className="relative">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={cn(
                  "w-full resize-none rounded-xl border border-slate-800 bg-slate-950/80",
                  "px-3.5 py-2.5 text-sm text-white outline-none sm:px-4 sm:py-3",
                  "placeholder-slate-600",
                  "focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20",
                  "leading-relaxed transition",
                )}
                placeholder="Write withdraw reason in short (e.g. urgent cash need, early exit, capital restructuring, etc.)"
              />
            </div>

            {/* Alert banner */}
            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 sm:mt-4 sm:gap-3 sm:p-3.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 sm:h-5 sm:w-5" />
              <div className="text-xs leading-relaxed text-amber-200">
                <span className="font-semibold text-amber-300">
                  Policy Notice:{" "}
                </span>
                If the withdraw date is earlier than the eligible maturity date,
                <span className="font-semibold text-white">
                  {" "}
                  profit may be calculated as ৳ 0
                </span>{" "}
                according to company policy.
              </div>
            </div>
          </div>

          {/* Submit Final Button */}
          <div className="space-y-2 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={submitRequest}
              disabled={!preview}
              className={cn(
                "group relative flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-bold shadow-xl transition sm:h-14 sm:gap-3 sm:rounded-2xl sm:text-base",
                !preview
                  ? "cursor-not-allowed border border-slate-800 bg-slate-900/60 text-slate-500"
                  : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-emerald-500/25 hover:brightness-110 hover:shadow-emerald-500/40 active:scale-[0.99]",
              )}
            >
              {!preview ? (
                <>
                  <Lock className="h-4 w-4 opacity-50 sm:h-5 sm:w-5" />
                  <span className="truncate">
                    Submit Withdraw Request (Load Preview First)
                  </span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 transition group-hover:translate-x-1 sm:h-5 sm:w-5" />
                  <span>Submit Withdraw Request</span>
                </>
              )}
            </button>

            {!preview && (
              <p className="text-center text-[11px] text-slate-500 sm:text-xs">
                *The submission button unlocks after clicking &quot;Load Preview
                &amp; Verify&quot; above
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <InvestmentWithdrawApplicationModal
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        investorId={investorId}
        investor={investor}
        cardId={cardId}
        card={selectedCard}
        withdrawDate={withdrawDate}
        sumOfCardProfit={sumOfCardProfit}
        payableAmount={payableAmount}
      />

      {/* Luxury Toast Notification */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} />
    </div>
  );
};

export default InvestmentWithdrawFrom;
