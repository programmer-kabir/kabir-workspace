import { useMemo, useState } from "react";
import InvestmentCardLayout from "../../InvestmentCardLayout";
import Loader from "../../Loader/Loader";
import { FaChevronDown } from "react-icons/fa";
import { 
  TrendingUp, 
  Coins, 
  Building2, 
  ArrowUpRight, 
  Lock, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Calendar, 
  Filter,
  Layers,
  Award
} from "lucide-react";
import useProfitAnalytics from "../../../Utils/Hooks/useProfitAnalytics";
import useProfitStatus from "../../../Utils/Hooks/useProfitStatus";
import usePaymentMethod from "../../../Utils/Hooks/usePaymentMethod";
import { getPaymentOptions } from "../../../Utils/getPaymentOptions";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import ProfitChart from "./ProfitChart";
import useCurrentUser from "../../../Utils/currentUser";
import useInvestInstallmentCards from "../../../Utils/Hooks/useInvestInstallmentCards";
import CompanyProfitChart from "./CompanyProfitChart";
import { monthOptions } from "../../../../public/months";
import useInvestorProfitHistory from "../../../Utils/Hooks/useInvestorProfitHistory";
import useCustomerInstallmentPayments from "../../../Utils/Hooks/useCustomerInstallmentPayments";
import useInvestInstallment from "../../../Utils/Hooks/useInvestInstallments";
import useAllInvestInstalments from "../../../Utils/Hooks/useAllInvestInstalments";
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const Profit = () => {
  const [selectedCardForSummary, setSelectedCardForSummary] = useState(null);

  const { investInstallmentCards, isInvestInstallmentsCardsLoading } =
    useInvestInstallmentCards();
  const {
    allInvestInstallments,
    isAllInvestInstallmentsLoading,
    isAllInvestInstallmentsError,
  } = useAllInvestInstalments();
  const runningUser = useCurrentUser();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  // =======================
  // 🔎 Filter State
  // =======================
  // const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  // 2021 → running year
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years = Array.from(
      { length: current - 2025 + 1 },
      (_, i) => 2025 + i,
    );

    return ["all", ...years]; 
  }, []);
  const { isProfitAnalyticsLoading, profitAnalytics = [] } =
    useProfitAnalytics();
  // ✅ MUST return ALL profit_history rows for this card (withdraw decisions etc.)
const rawTotal = profitAnalytics.reduce((sum, item) => {
  return sum + parseFloat(item.profit_amount || 0);
}, 0);

  const {
    profitHistory = [],
    isProfitHistoryLoading,
    refetch: refetchProfitStatus,
  } = useProfitStatus({
    cardId: selectedCardForSummary?.id,
  });


  const { paymentMethods } = usePaymentMethod(
    selectedCardForSummary?.investor_id,
  );

  const currentCardAnalytics = useMemo(() => {
    if (!selectedCardForSummary?.id) return [];
    return (profitAnalytics || []).filter(
      (p) => Number(p.card_id) === Number(selectedCardForSummary.id),
    );
  }, [profitAnalytics, selectedCardForSummary?.id]);
  const filteredAnalytics = useMemo(() => {
    return (currentCardAnalytics || []).filter((p) => {
      const yearMatch =
        filterYear === "all"
          ? true
          : Number(p.profit_year) === Number(filterYear);

      const monthMatch =
        filterMonth === "" || filterMonth === "all"
          ? true
          : Number(p.profit_month) === Number(filterMonth);

      return yearMatch && monthMatch;
    });
  }, [currentCardAnalytics, filterYear, filterMonth]);

  const totalWeightedValue = useMemo(() => {
    return (currentCardAnalytics  || []).reduce(
      (acc, inst) => acc + toNumber(inst.weight_value),
      0,
    );
  }, [profitAnalytics]);
  const yourWeight = useMemo(() => {
    return (filteredAnalytics || []).reduce(
      (acc, inst) => acc + toNumber(inst.weight_value),
      0,
    );
  }, [filteredAnalytics]);

  const yourAllProfit = useMemo(() => {
    return (filteredAnalytics || []).reduce(
      (acc, inst) => acc + toNumber(inst.profit_amount),
      0,
    );
  }, [filteredAnalytics]);

  // ✅ PreviousProfit = only APPROVED withdraw amounts
  const PreviousProfit = useMemo(() => {
    return (profitHistory || [])
      .filter(
        (inst) =>
          String(inst.status || "").toLowerCase() === "withdraw" &&
          String(inst.action_name || "").toLowerCase() === "approved",
      )
      .reduce((acc, inst) => acc + toNumber(inst.amount), 0);
  }, [profitHistory]);

  const yourProfit = Number(yourAllProfit.toFixed(2)) - Number(PreviousProfit);

  // 🔹 Dual Source Breakdown (Card Installments vs Others Asset Lease)
  const profitSources = useMemo(() => {
    let cardSum = 0;
    let othersSum = 0;
    (filteredAnalytics || []).forEach((item) => {
      const note = item.note || "";
      const cardMatch = note.match(/কার্ড প্রফিট:\s*৳([\d.]+)/);
      const othersMatch = note.match(/আদার্স প্রফিট:\s*৳([\d.]+)/);
      if (cardMatch && othersMatch) {
        cardSum += parseFloat(cardMatch[1]);
        othersSum += parseFloat(othersMatch[1]);
      } else {
        cardSum += parseFloat(item.profit_amount || 0);
      }
    });
    return {
      cardProfit: Math.round(cardSum * 100) / 100,
      othersProfit: Math.round(othersSum * 100) / 100,
      hasOthers: othersSum > 0,
    };
  }, [filteredAnalytics]);

  const yourPercent = useMemo(() => {
    if (!totalWeightedValue) return 0;
    const rawPercent = (yourWeight / totalWeightedValue) * 100;
    return Math.round(rawPercent * 100) / 100;
  }, [yourWeight, totalWeightedValue]);

  const formatNumber = (n) =>
    n != null
      ? Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })
      : "-";
  // Date range badge
  // =======================
  const start = selectedCardForSummary?.start_date || null;
  const end = selectedCardForSummary
    ? selectedCardForSummary.maturity_date || today
    : null;

  // Decision window (after maturity)
  // =======================
  const isDecisionWindow = useMemo(() => {
    const md = selectedCardForSummary?.maturity_date;
    if (!md || md === "0000-00-00") return false;

    const m = new Date(md);
    if (isNaN(m.getTime())) return false;

    const now = new Date();
    const mOnly = new Date(m.getFullYear(), m.getMonth(), m.getDate());
    const tOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tOnly >= mOnly;
  }, [selectedCardForSummary?.maturity_date]);

  // =======================
  // ✅ Period key (monthly/yearly)
  // =======================
  // Rule: shorttime => monthly, otherwise yearly (change here if needed)
  const periodType = useMemo(() => {
    return selectedCardForSummary?.payment_type === "shorttime"
      ? "monthly"
      : "yearly";
  }, [selectedCardForSummary?.payment_type]);

  // Use END date for period (same as backend)
  const periodYear = useMemo(() => {
    const d = new Date(end || today);
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  }, [end, today]);

  const periodMonth = useMemo(() => {
    if (periodType !== "monthly") return 0;
    const d = new Date(end || today);
    return isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  }, [end, today, periodType]);

  // =======================
  // ✅ latest withdraw record for this period
  // =======================
  const latestWithdrawRecord = useMemo(() => {
    if (!selectedCardForSummary?.id) return null;

    const list = (profitHistory || [])
      .filter((p) => {
        const sameCard =
          Number(p.card_id) === Number(selectedCardForSummary.id);
        const sameYear = Number(p.profit_year) === Number(periodYear);
        const sameMonth = Number(p.profit_month || 0) === Number(periodMonth);
        const isWithdraw = String(p.status || "").toLowerCase() === "withdraw";
        return sameCard && sameYear && sameMonth && isWithdraw;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));

    return list[0] || null;
  }, [profitHistory, selectedCardForSummary?.id, periodYear, periodMonth]);

  // ✅ decision is action_name
  const decisionStatus = useMemo(() => {
    return (
      String(latestWithdrawRecord?.action_name || "").toLowerCase() || null
    );
  }, [latestWithdrawRecord]);

  const isPending = decisionStatus === "pending";
  const isApproved = decisionStatus === "approved";

  const isProfitLoading = isProfitHistoryLoading || isProfitAnalyticsLoading;

  const canWithdraw =
    !isProfitLoading &&
    !!selectedCardForSummary &&
    yourProfit > 0 &&
    isDecisionWindow &&
    !isPending &&
    !isApproved;

  // =======================
  // Withdraw handler
  // =======================
  const handleWithdraw = async () => {
    if (!selectedCardForSummary || !yourProfit) return;

    if (paymentMethods?.review === "pending") {
      Swal.fire({
        icon: "warning",
        title: "Payment Method Pending",
        text: "আপনার পেমেন্ট মেথড এখনো যাচাই করা হয়নি। অনুগ্রহ করে অনুমোদনের জন্য অপেক্ষা করুন।",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    if (paymentMethods?.review === "rejected") {
      Swal.fire({
        icon: "error",
        title: "Payment Method Rejected",
        text: "আপনার পেমেন্ট মেথডটি বাতিল করা হয়েছে। অনুগ্রহ করে নতুন করে আপডেট করুন।",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    // min rule for non-shorttime
    if (
      selectedCardForSummary?.payment_type !== "shorttime" &&
      yourProfit < 10
    ) {
      toast.info("উইথড্র করার জন্য ন্যূনতম ১০ টাকা প্রয়োজন।");
      return;
    }

    if (!isDecisionWindow) {
      toast.info("Withdraw window এখনো আসেনি (maturity date হয়নি)।");
      return;
    }

    // frontend safety
    if (isPending) {
      toast.info("আপনার আগের Withdraw request এখনো Pending আছে।");
      return;
    }

    if (isApproved) {
      toast.info("আপনার Withdraw request ইতিমধ্যে Approved হয়েছে।");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "আপনি কি আপনার প্রাপ্য লাভের সম্পূর্ণ অর্থ উত্তোলন (Withdraw) করতে চান? এই সিদ্ধান্তটি পরে পরিবর্তন করা যাবে না।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "হ্যাঁ, Withdraw করবো",
      cancelButtonText: "না, এখনই না",
    });

    if (!confirmResult.isConfirmed) return;

    // Select payment method
    const paymentOptions = getPaymentOptions(paymentMethods);
    let selectedPaymentMethod = "cash";

    if (paymentOptions.length > 0) {
      const optionsHtml = paymentOptions
        .map((op) => `<option value="${op.value}">${op.label}</option>`)
        .join("");

      const methodResult = await Swal.fire({
        title: "Payment Method নির্বাচন করুন",
        html: `
          <label class="block text-sm font-medium text-left mb-1">Payment Method</label>
          <select id="payment_method" class="swal2-input">
            <option value="">Select method</option>
            ${optionsHtml}
          </select>
        `,
        showCancelButton: true,
        confirmButtonText: "Confirm Withdraw",
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#dc2626",
        preConfirm: () => {
          const payment_method =
            document.getElementById("payment_method")?.value;
          if (!payment_method) {
            Swal.showValidationMessage("Payment method নির্বাচন করুন");
            return false;
          }
          return { payment_method };
        },
      });

      if (!methodResult.isConfirmed) return;
      selectedPaymentMethod = methodResult.value.payment_method;
    }

    try {
      const body = new URLSearchParams({
        investor_id: String(selectedCardForSummary.investor_id),
        card_id: String(selectedCardForSummary.id),
        status: "withdraw",
        action_name: "pending",
        period_type: periodType, // ✅ IMPORTANT
        payment_method: selectedPaymentMethod,
        amount: String(yourProfit),
        start_date: start || "",
        end_date: end || "",
        requested_at: today,
      });

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/investor_apis/save_profit_action.php`,
        {
          method: "POST",
          body,
        },
      );

      const data = await res.json();

      if (!data?.success) {
        Swal.fire(
          "ভুল হয়েছে",
          data?.message || "Withdraw করা যায়নি",
          "error",
        );
        return;
      }

      Swal.fire({
        title: "Request Sent",
        text: "আপনার withdraw request admin review এর জন্য পাঠানো হয়েছে।",
        icon: "success",
        confirmButtonColor: "#16a34a",
      });

      refetchProfitStatus?.();
    } catch (error) {
      Swal.fire("সমস্যা হয়েছে", "অনুগ্রহ করে পরে আবার চেষ্টা করুন।", "error");
    }
  };

  // =======================
  // Company cards
  // =======================
  const companyCards = useMemo(() => {
    return (investInstallmentCards || []).filter(
      (c) => Number(c.investor_id) === Number(runningUser?.id),
    );
  }, [investInstallmentCards, runningUser?.id]);

  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsError,
  } = useCustomerInstallmentPayments();

  const companyProfitHistory = useMemo(() => {
    const map = {};

    (customerInstallmentPayments || []).forEach((p) => {
      if (!p.paid_date) return; // unpaid বাদ
      if (p.status !== "Paid") return;

      const d = new Date(p.paid_date);

      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12

      const key = `${year}-${month}`;

      if (!map[key]) {
        map[key] = {
          year,
          month,
          companyProfit: 0,
        };
      }
      map[key].companyProfit += Number(p.profit_amount || 0);
    });
 
    return Object.values(map);
  }, [customerInstallmentPayments, allInvestInstallments]);

  const filteredCompanyProfitHistory = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return (companyProfitHistory || []).filter((p) => {
      const yearMatch =
        filterYear === "all" ? true : Number(p.year) === Number(filterYear);

      const monthMatch =
        filterMonth === "" || filterMonth === "all"
          ? true
          : Number(p.month) === Number(filterMonth);

      // ✅ ALWAYS block running month (even in ALL mode)
      const isRunningMonth =
        Number(p.year) === currentYear && Number(p.month) === currentMonth;

      return yearMatch && monthMatch && !isRunningMonth;
    });
  }, [companyProfitHistory, filterYear, filterMonth]);

  const totalCompanyProfit = useMemo(() => {
    return (filteredCompanyProfitHistory || []).reduce(
      (sum, p) => sum + Number(p.companyProfit || 0),
      0,
    );
  }, [filteredCompanyProfitHistory]);

  // const chartCompanyProfit = useMemo(() => {
  //   return (filteredCompanyProfitHistory || []).map((p) => ({
  //     year: p.year,
  //     month: p.month,
  //     companyProfit: Number(p.companyProfit || 0),
  //     totalWeight: Number(p.totalWeight || 0),
  //   }));
  // }, [filteredCompanyProfitHistory]);
const chartCompanyProfit = useMemo(() => {

  return (filteredCompanyProfitHistory || []).map((p) => ({
    year: p.year,
    month: p.month,
    companyProfit: Number(p.companyProfit || 0),
    totalWeight: 0,
  }));

}, [filteredCompanyProfitHistory]);
  // const monthlyTotalWeight = useMemo(() => {
  //   const map = {};
  //   const now = new Date();
  //   const currentYear = now.getFullYear();
  //   const currentMonth = now.getMonth() + 1;

  //   (profitAnalytics || []).forEach((item) => {
  //     const year = Number(item.profit_year);
  //     const month = Number(item.profit_month);
  //     const weight = toNumber(item.weight_value);

  //     if (!year || !month) return;

  //     // ✅ running month skip
  //     if (year === currentYear && month === currentMonth) return;

  //     const key = `${year}-${month}`;

  //     if (!map[key]) {
  //       map[key] = {
  //         year,
  //         month,
  //         totalWeight: 0,
  //       };
  //     }

  //     map[key].totalWeight += weight;
  //   });

  //   return Object.values(map).sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.month - b.month;
  //   });
  // }, [profitAnalytics]);
const monthlyTotalWeight = useMemo(() => {

  if (!selectedCardForSummary?.id) {
    return [];
  }

  const map = {};

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  (currentCardAnalytics || []).forEach((item) => {

    const year =
      Number(item.profit_year);

    const month =
      Number(item.profit_month);

    const weight =
      toNumber(item.weight_value);

    if (!year || !month) return;

    // ✅ running month skip
    if (
      year === currentYear &&
      month === currentMonth
    ) {
      return;
    }

    const key = `${year}-${month}`;

    if (!map[key]) {

      map[key] = {
        year,
        month,
        totalWeight: 0,
      };

    }

    map[key].totalWeight += weight;

  });

  return Object.values(map).sort((a, b) => {

    if (a.year !== b.year) {
      return a.year - b.year;
    }

    return a.month - b.month;

  });

}, [
  currentCardAnalytics,
  selectedCardForSummary?.id
]);
  return (
    <div className="space-y-6">
      <InvestmentCardLayout onSelectedCardChange={setSelectedCardForSummary}>
        {() => null}
      </InvestmentCardLayout>

      {isProfitLoading ? (
        <div className="flex items-center justify-center"><Loader /> </div>
      ) : (
        <>
          {/* 🔍 FILTER TOOLBAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                ফিল্টার:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Year Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">বছর:</span>
                <select
                  value={filterYear}
                  onChange={(e) =>
                    setFilterYear(
                      e.target.value === "all" ? "all" : Number(e.target.value),
                    )
                  }
                  className="border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">সকল বছর</option>
                  {yearOptions
                    .filter((y) => y !== "all")
                    .map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                </select>
              </div>

              {/* Month Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">মাস:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  setFilterMonth("");
                  setFilterYear("all");
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                রিসেট
              </button>
            </div>
          </div>

          {/* 🏛️ HERO PROFIT OVERVIEW & WITHDRAWAL HUB */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    মুনাফা ও উত্তোলন হাব (Profit & Payout Hub)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    নির্বাচিত কার্ড অনুযায়ী আপনার অর্জিত লভ্যাংশ, টাইম-ওয়েটেড মান ও উইথড্রল স্ট্যাটাস
                  </p>
                </div>
              </div>

              {selectedCardForSummary && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-3 py-1 text-xs text-slate-600 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{start || "-"}</span>
                    <span className="text-slate-300">→</span>
                    <span>{end || "-"}</span>
                  </div>

                  {canWithdraw ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      উত্তোলন সক্রিয় (Matured)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      উত্তোলন সক্রিয় নয় / লকড
                    </span>
                  )}
                </div>
              )}
            </div>

            {!selectedCardForSummary ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                <p className="text-sm text-slate-500">
                  উপরে থাকা ইনভেস্টমেন্ট কার্ডগুলোর মধ্য থেকে যেকোনো একটি সিলেক্ট করুন, তারপর এখানে বিস্তারিত প্রফিট ও উত্তোলনের হিসাব দেখতে পারবেন।
                </p>
              </div>
            ) : (
              <>
                {/* 📊 3-Bento Profit Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {/* Metric 1: Time-Weighted Value */}
                  <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        আপনার মোট ওজন (TWV)
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                      {formatNumber(yourWeight)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      এই কার্ডে আপনার মোট বিনিয়োগের টাইম-ওয়েটেড মান।
                    </p>
                  </div>

                  {/* Metric 2: Company Profit */}
                  <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        কোম্পানির সংগৃহীত লাভ
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-slate-400">৳</span>
                      <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                        {formatNumber(totalCompanyProfit)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      এখন পর্যন্ত বিনিয়োগকারীদের মোট আদায়কৃত লাভ
                    </p>
                  </div>

                  {/* Metric 3: YOUR PROFIT (HERO CARD WITH WITHDRAWAL HUB) */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/90 p-5 shadow-xs xl:col-span-3 md:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          আপনার প্রাপ্য নিট লাভ (Distributable Profit)
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base font-bold text-emerald-600">৳</span>
                          <span className="text-3xl md:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                            {formatNumber(yourProfit)}
                          </span>
                        </div>
                      </div>

                      {/* Withdrawal Action Button */}
                      <div className="flex flex-col sm:items-end gap-1">
                        <button
                          type="button"
                          onClick={handleWithdraw}
                          disabled={!canWithdraw}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            canWithdraw
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 cursor-pointer shadow-emerald-200"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
                          }`}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          মুনাফা উত্তোলন আবেদন করুন
                        </button>
                      </div>
                    </div>

                    {/* Dual Source Breakdown */}
                    {profitSources.hasOthers && (
                      <div className="mt-4 pt-3 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-emerald-100 shadow-xs">
                          <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                            <span>📦</span> পণ্য কিস্তি লাভ:
                          </span>
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            ৳{formatNumber(profitSources.cardProfit)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-purple-50/80 rounded-xl px-4 py-2.5 border border-purple-200 shadow-xs">
                          <span className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                            <span>🚴</span> সম্পদ লিজ/ভাড়া লাভ:
                          </span>
                          <span className="text-sm font-bold text-purple-900 font-mono">
                            ৳{formatNumber(profitSources.othersProfit)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Decision Notices */}
                    {decisionStatus === "pending" && (
                      <div className="mt-3.5 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2 text-xs font-medium text-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                        <span>আপনার উত্তোলনের আবেদনটি অ্যাডমিন রিভিউয়ে রয়েছে (Pending Approval)।</span>
                      </div>
                    )}

                    {decisionStatus === "approved" && (
                      <div className="mt-3.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>আপনার উত্তোলনের আবেদনটি অনুমোদিত হয়েছে (Approved) ✅</span>
                      </div>
                    )}

                    {decisionStatus === "rejected" && (
                      <div className="mt-3.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>উত্তোলনের আবেদনটি বাতিল করা হয়েছে — আপনি পুনরায় আবেদন করতে পারবেন।</span>
                        </div>
                        {latestWithdrawRecord?.remarks && (
                          <p className="text-rose-700 pl-6">কারণ: {latestWithdrawRecord.remarks}</p>
                        )}
                      </div>
                    )}

                    {!isDecisionWindow && (
                      <div className="mt-3.5 rounded-xl bg-slate-100/80 border border-slate-200 p-3 flex items-center gap-2 text-xs text-slate-500">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>১ বছরের ম্যাচুরিটি মেয়াদ পূর্ণ হওয়ার পর এই কার্ড থেকে সরাসরি মূলধন ও মুনাফা উত্তোলনের সুযোগ তৈরি হবে।</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 📋 Selected Card Details Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-medium">কার্ড নাম</p>
                    <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                      {selectedCardForSummary.card_name}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-medium">টাইম-ওয়েটেড মান</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5 tabular-nums">
                      {formatNumber(selectedCardForSummary.total_time_wighted_value)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-medium">শুরুর তারিখ</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono mt-0.5">
                      {selectedCardForSummary.start_date || "-"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-medium">ম্যাচুরিটি তারিখ</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono mt-0.5">
                      {selectedCardForSummary.maturity_date || "নির্ধারিত নয়"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {Number(runningUser?.id) > 1 && (
        <ProfitChart
          profits={currentCardAnalytics}
          companyOverview={chartCompanyProfit}
          monthlyTotalWeight={monthlyTotalWeight}
          filterYear={filterYear}
          filterMonth={filterMonth}
           payments = {allInvestInstallments}
           selectedCard={selectedCardForSummary}
        />
      )}


      {runningUser?.id === 1 && (
        <CompanyProfitChart
          profitAnalytics={profitAnalytics}
          companyCards={companyCards}
          selectedCardForSummary={selectedCardForSummary}
        />
      )}
            {Number(runningUser?.id) === 1 && (
        <ProfitChart
          profits={currentCardAnalytics}
          companyOverview={chartCompanyProfit}
          monthlyTotalWeight={monthlyTotalWeight}
          filterYear={filterYear}
          filterMonth={filterMonth}
           payments = {allInvestInstallments}
           selectedCard={selectedCardForSummary}
        />
      )}
    </div>
  );
};

export default Profit;
