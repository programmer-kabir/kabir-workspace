import React, { useEffect, useState, useMemo } from "react";
import {
  FaUniversity,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaUpload,
  FaReceipt,
  FaTimes,
  FaEye,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUserCheck,
  FaCamera,
  FaInfoCircle,
  FaSlidersH,
  FaTags,
  FaLayerGroup,
  FaCheckSquare,
  FaSquare,
  FaMinusCircle,
  FaRobot,
  FaMagic,
} from "react-icons/fa";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { useAuth } from "../../../Provider/AuthProvider";
import useUserRole from "../../../utils/Hooks/useUserRole";

const API = import.meta.env.VITE_LOCALHOST_KEY;

const popularBanks = [
  "BRAC Bank PLC",
  "Islami Bank Bangladesh",
  "Dutch-Bangla Bank (DBBL)",
  "City Bank PLC",
  "Eastern Bank PLC (EBL)",
  "Sonali Bank PLC",
  "Mutual Trust Bank (MTB)",
  "Pubali Bank PLC",
  "Prime Bank PLC",
  "Bank Asia PLC",
  "Other / নগদ এজেন্ট",
];

export default function BankReconciliation() {
  const { user } = useAuth();
  const { isAdmin, isDev, isAdminOrDev, isManager, isStaff } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [luxuryToast, setLuxuryToast] = useState(null);

  // Deposit Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositForm, setDepositForm] = useState({
    deposit_date: new Date().toISOString().split("T")[0],
    bank_name: "BRAC Bank PLC",
    account_no: "",
    deposited_amount: "",
    discrepancy_reason: "",
    slip_file: null,
    slip_preview: null,
  });

  // Slip Preview / Verification Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Granular Expense Picker Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTarget, setExpenseTarget] = useState(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState(new Set());
  const [savingExpensePolicy, setSavingExpensePolicy] = useState(false);

  // AI Slip Verification & Toggle states
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiDetectedData, setAiDetectedData] = useState(null);
  const [togglingAi, setTogglingAi] = useState(false);

  const handleOpenExpenseModal = (item) => {
    setExpenseTarget(item);
    const items = item.cash_out_items || [];
    if (item.adjustment_mode === "gross_full") {
      setSelectedExpenseIds(new Set());
    } else if (item.adjustment_mode === "custom" && Array.isArray(item.deducted_expense_ids)) {
      setSelectedExpenseIds(new Set(item.deducted_expense_ids.map(Number)));
    } else {
      // Default net_deduct
      setSelectedExpenseIds(new Set(items.map((x) => Number(x.id))));
    }
    setShowExpenseModal(true);
  };

  const handleToggleExpense = (id) => {
    const numId = Number(id);
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (next.has(numId)) {
        next.delete(numId);
      } else {
        next.add(numId);
      }
      return next;
    });
  };

  const handleSelectAllExpenses = () => {
    if (!expenseTarget?.cash_out_items) return;
    const all = expenseTarget.cash_out_items.map((x) => Number(x.id));
    setSelectedExpenseIds(new Set(all));
  };

  const handleDeselectAllExpenses = () => {
    setSelectedExpenseIds(new Set());
  };

  const handleSelectCompanyExpensesOnly = () => {
    if (!expenseTarget?.cash_out_items) return;
    const comp = expenseTarget.cash_out_items
      .filter(
        (x) =>
          x.is_company_expense === 1 ||
          x.source === "company-expense" ||
          x.category === "office-expense" ||
          x.category === "bill" ||
          x.category === "rent" ||
          x.category === "purchase"
      )
      .map((x) => Number(x.id));
    setSelectedExpenseIds(new Set(comp));
  };

  const currentSelectedExpenseSum = useMemo(() => {
    if (!expenseTarget?.cash_out_items) return 0;
    return expenseTarget.cash_out_items.reduce((sum, item) => {
      return selectedExpenseIds.has(Number(item.id)) ? sum + Number(item.amount || 0) : sum;
    }, 0);
  }, [expenseTarget, selectedExpenseIds]);

  const calculatedTargetAmount = useMemo(() => {
    if (!expenseTarget) return 0;
    return Math.max(0, Number(expenseTarget.total_cash_in || 0) - currentSelectedExpenseSum);
  }, [expenseTarget, currentSelectedExpenseSum]);

  const handleSaveCustomExpensePolicy = async () => {
    if (!expenseTarget) return;
    try {
      setSavingExpensePolicy(true);
      const selectedArray = Array.from(selectedExpenseIds);
      let modeToSave = "custom";
      if (selectedArray.length === 0) {
        modeToSave = "gross_full";
      } else if (selectedArray.length === (expenseTarget.cash_out_items?.length || 0)) {
        modeToSave = "net_deduct";
      }

      const res = await fetch(`${API}/bank_reconciliation/update_adjustment_mode.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit_id: expenseTarget.id,
          adjustment_mode: modeToSave,
          selected_expense_ids: selectedArray,
          admin_id: user?.id || 290,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLuxuryToast({
          title: "খরচ বাছাই ও পলিসি সেভ হয়েছে ✅",
          message: `${expenseTarget.collection_date} তারিখের জন্য ${selectedArray.length} টি খরচ সমন্বয় করে টার্গেট হিসাব করা হয়েছে।`,
          amount: result.data?.expected_amount,
          type: "success",
        });
        setShowExpenseModal(false);
        fetchReconciliationList();
        if (verifyTarget && verifyTarget.id === expenseTarget.id) {
          setVerifyTarget((prev) => ({
            ...prev,
            adjustment_mode: modeToSave,
            expected_amount: result.data?.expected_amount,
            shortage_amount: result.data?.shortage_amount,
            deducted_expense_ids: selectedArray,
            deducted_expense_amount: result.data?.deducted_expense_amount,
          }));
        }
      } else {
        setLuxuryToast({
          title: "ব্যর্থ হয়েছে ❌",
          message: result.message || "পলিসি সেভ করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভার এরর",
        type: "error",
      });
    } finally {
      setSavingExpensePolicy(false);
    }
  };

  // Fetch reconciliation list
  const fetchReconciliationList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/bank_reconciliation/get_reconciliation_list.php`);
      const result = await res.json();
      if (result.success) {
        setData(result.data || []);
        setSummary(result.summary || null);
      } else {
        setLuxuryToast({
          title: "লোড ব্যর্থ ❌",
          message: result.message || "ব্যাংক রিকনসিলিয়েশন তথ্য লোড করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভার এরর, পরে চেষ্টা করুন।",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI Mode Settings
  const fetchAiSettings = async () => {
    try {
      const res = await fetch(`${API}/bank_reconciliation/manage_ai_settings.php`);
      const result = await res.json();
      if (result.success) {
        setAiEnabled(Boolean(result.ai_enabled));
      }
    } catch (e) {
      console.log("AI setting load error", e);
    }
  };

  // Toggle AI Master Mode (Admin only)
  const handleToggleAiMode = async () => {
    if (!isAdminOrDev) return;
    try {
      setTogglingAi(true);
      const res = await fetch(`${API}/bank_reconciliation/manage_ai_settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", enabled: !aiEnabled }),
      });
      const result = await res.json();
      if (result.success) {
        setAiEnabled(result.ai_enabled);
        setLuxuryToast({
          title: result.ai_enabled ? "AI মোড সক্রিয় 🟢" : "ম্যানুয়াল মোড সক্রিয় ⚪",
          message: result.message,
          type: result.ai_enabled ? "success" : "info",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "এরর ❌",
        message: "AI সেটিং পরিবর্তন ব্যর্থ হয়েছে",
        type: "error",
      });
    } finally {
      setTogglingAi(false);
    }
  };

  // Scan Slip with Gemini Vision AI
  const scanSlipWithAi = async (file) => {
    if (!file) return;
    try {
      setIsAiScanning(true);
      setAiDetectedData(null);
      const fd = new FormData();
      fd.append("slip_image", file);

      const res = await fetch(`${API}/bank_reconciliation/scan_deposit_slip.php`, {
        method: "POST",
        body: fd,
      });
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setAiDetectedData(d);

        // Auto-fill form fields
        setDepositForm((prev) => ({
          ...prev,
          deposited_amount: d.deposited_amount > 0 ? d.deposited_amount : prev.deposited_amount,
          bank_name: d.bank_name ? d.bank_name : prev.bank_name,
          account_no: d.account_no ? d.account_no : prev.account_no,
          deposit_date: d.deposit_date ? d.deposit_date : prev.deposit_date,
        }));

        setLuxuryToast({
          title: "AI স্ক্যান সফল 🎉",
          message: `স্লিপ থেকে ৳ ${Number(d.deposited_amount || 0).toLocaleString()} ও ${d.bank_name || "ব্যাংক"} সনাক্ত হয়েছে।`,
          type: "success",
        });
      } else if (result.fallback_manual) {
        console.log("AI Fallback:", result.message);
      }
    } catch (err) {
      console.error("AI Scan Error:", err);
    } finally {
      setIsAiScanning(false);
    }
  };

  useEffect(() => {
    fetchReconciliationList();
    fetchAiSettings();
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.collection_date?.includes(searchTerm) ||
        item.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account_no?.includes(searchTerm) ||
        item.day_name?.includes(searchTerm) ||
        item.submitted_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === "pending") return item.status === "pending_deposit";
      if (activeTab === "submitted") return item.status === "submitted";
      if (activeTab === "verified") return item.status === "verified";
      if (activeTab === "shortage") return Number(item.shortage_amount) > 0 || item.is_overdue;

      return true;
    });
  }, [data, searchTerm, activeTab]);

  // Open Submit Deposit Modal
  const handleOpenSubmitModal = (item) => {
    if (isAdminOrDev) {
      return setLuxuryToast({
        title: "এডমিন নোটিশ ℹ️",
        message: "এডমিন ডিপোজিট জমা দেবেন না। এটি ফিল্ড স্টাফ বা ব্রাঞ্চ ম্যানেজারের দায়িত্ব। এডমিন শুধুমাত্র অডিট ও অনুমোদন করবেন।",
        type: "warning",
      });
    }
    setSelectedRecord(item);
    setAiDetectedData(null);
    setDepositForm({
      deposit_date: new Date().toISOString().split("T")[0],
      bank_name: item.bank_name || "BRAC Bank PLC",
      account_no: item.account_no || "",
      deposited_amount: item.deposited_amount > 0 ? item.deposited_amount : item.expected_amount,
      discrepancy_reason: item.discrepancy_reason || "",
      slip_file: null,
      slip_preview: item.slip_image ? `${API}/../${item.slip_image}` : null,
    });
    setShowSubmitModal(true);
  };

  // Handle Slip File Selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setDepositForm((prev) => ({
        ...prev,
        slip_file: file,
        slip_preview: URL.createObjectURL(file),
      }));

      // If AI mode is enabled, trigger smart AI scan automatically
      if (aiEnabled && file.type && file.type.startsWith("image/")) {
        await scanSlipWithAi(file);
      }
    }
  };

  // Submit Deposit Form
  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    if (isAdminOrDev) {
      return setLuxuryToast({
        title: "অননুমোদিত অ্যাকশন ⚠️",
        message: "এডমিন ডিপোজিট জমা দেবেন না। এটি ফিল্ড স্টাফ বা ব্রাঞ্চ ম্যানেজারের দায়িত্ব।",
        type: "warning",
      });
    }

    const deposited = Number(depositForm.deposited_amount || 0);
    const expected = Number(selectedRecord?.expected_amount || 0);
    const shortage = expected - deposited;

    if (deposited <= 0) {
      return setLuxuryToast({
        title: "সঠিক পরিমাণ দিন ⚠️",
        message: "ব্যাংকে জমা দেওয়া টাকার পরিমাণ উল্লেখ করুন।",
        type: "warning",
      });
    }

    if (shortage > 0 && !depositForm.discrepancy_reason.trim()) {
      return setLuxuryToast({
        title: "কৈফিয়ত আবশ্যক ⚠️",
        message: `আদায়ের চেয়ে ৳ ${shortage.toLocaleString()} টাকা কম জমা হচ্ছে! ক্যাশ কম জমার কারণ উল্লেখ করুন।`,
        type: "warning",
      });
    }

    try {
      setSubmittingDeposit(true);
      const formData = new FormData();
      formData.append("deposit_id", selectedRecord.id);
      formData.append("deposit_date", depositForm.deposit_date);
      formData.append("bank_name", depositForm.bank_name);
      formData.append("account_no", depositForm.account_no);
      formData.append("deposited_amount", deposited);
      formData.append("discrepancy_reason", depositForm.discrepancy_reason);
      formData.append("submitted_by", user?.id || 290);
      formData.append("user_role", isAdminOrDev ? "admin" : "staff");

      if (depositForm.slip_file) {
        formData.append("slip_image", depositForm.slip_file);
      }

      const res = await fetch(`${API}/bank_reconciliation/submit_deposit.php`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setLuxuryToast({
          title: "ব্যাংক জমা স্লিপ আপলোড সম্পন্ন 🎉",
          message: `${selectedRecord.collection_date} তারিখের আদায়কৃত ক্যাশ বাবদ ৳ ${deposited.toLocaleString()} ব্যাংকে জমার তথ্য নথিভুক্ত হয়েছে।`,
          tag: depositForm.bank_name,
          amount: deposited,
          type: "success",
        });
        setShowSubmitModal(false);
        fetchReconciliationList();
      } else {
        setLuxuryToast({
          title: "জমা ব্যর্থ ❌",
          message: result.message || "সংরক্ষণ করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
        type: "error",
      });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Open Verify Modal
  const handleOpenVerifyModal = (item) => {
    setVerifyTarget(item);
    setAdminNotes(item.admin_notes || "");
    setShowVerifyModal(true);
  };

  // Perform Admin Verification
  const handleVerifyAction = async (action) => {
    if (!verifyTarget) return;

    if (action === "reject" && !adminNotes.trim()) {
      return setLuxuryToast({
        title: "কারণ আবশ্যক ⚠️",
        message: "বাতিল করার কারণ বা আপত্তি উল্লেখ করুন।",
        type: "warning",
      });
    }

    try {
      setVerifying(true);
      const res = await fetch(`${API}/bank_reconciliation/verify_deposit.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit_id: verifyTarget.id,
          action: action,
          verified_by: user?.id || 290,
          admin_notes: adminNotes,
        }),
      });
      const result = await res.json();

      if (result.success) {
        setLuxuryToast({
          title: action === "verify" ? "সমন্বয় ও অনুমোদন সম্পন্ন ✅" : "জমা বাতিল ও আপত্তিপত্র পাঠানো হয়েছে 🛑",
          message: result.message,
          tag: verifyTarget.bank_name || "Bank Deposit",
          amount: Number(verifyTarget.deposited_amount),
          type: action === "verify" ? "success" : "warning",
        });
        setShowVerifyModal(false);
        fetchReconciliationList();
      } else {
        setLuxuryToast({
          title: "ব্যর্থ হয়েছে ❌",
          message: result.message || "ভেরিফিকেশন সম্পন্ন হয়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
        type: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Update Policy Mode (Gross vs Net vs Custom) by Admin
  const handleUpdatePolicy = async (item, mode, customTarget = null) => {
    try {
      const res = await fetch(`${API}/bank_reconciliation/update_adjustment_mode.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit_id: item.id,
          adjustment_mode: mode,
          custom_target_amount: customTarget,
          admin_id: user?.id || 290,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLuxuryToast({
          title: "ডিপোজিট পলিসি পরিবর্তন সম্পন্ন ✅",
          message: `${item.collection_date} তারিখের জন্য ${
            mode === "gross_full"
              ? "সম্পূর্ণ কালেকশন জমার পলিসি (Gross)"
              : mode === "net_deduct"
              ? "ক্যাশ আউট বাদ দিয়ে নিট জমার পলিসি (Net)"
              : "কাস্টম জমার পলিসি"
          } সেট হয়েছে।`,
          amount: result.data?.expected_amount,
          type: "success",
        });
        fetchReconciliationList();
        if (verifyTarget && verifyTarget.id === item.id) {
          setVerifyTarget((prev) => ({
            ...prev,
            adjustment_mode: mode,
            expected_amount: result.data?.expected_amount,
            shortage_amount: result.data?.shortage_amount,
          }));
        }
      } else {
        setLuxuryToast({
          title: "পরিবর্তন ব্যর্থ ❌",
          message: result.message || "পলিসি আপডেট করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভার এরর",
        type: "error",
      });
    }
  };

  if (loading && !data.length) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 text-slate-200">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <FaUniversity size={14} />
            <span>DAILY CASH-TO-BANK RECONCILIATION & AUDIT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            ব্যাংক জমা ও দৈনিক ক্যাশ রিকনসিলিয়েশন
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            দৈনিক আদায়কৃত সম্পূর্ণ ক্যাশ পরদিন দুপুর ১২টার মধ্যে (বৃহস্পতিবারের ক্যাশ শনিবার) ব্যাংকে জমা ও স্লিপ মেলানো
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdminOrDev ? (
            <span className="px-3 py-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <FaUserCheck size={13} className="text-purple-400" />
              <span>এডমিন অডিট ও অনুমোদন ডেস্ক</span>
            </span>
          ) : (
            <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <FaUpload size={13} className="text-emerald-400" />
              <span>স্টাফ মোড (ডিপোজিট সাবমিশন)</span>
            </span>
          )}

          {isAdminOrDev && (
            <button
              onClick={handleToggleAiMode}
              disabled={togglingAi}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer shadow-sm ${
                aiEnabled
                  ? "bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/40 shadow-cyan-950/40"
                  : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-400 border-slate-700 opacity-80"
              }`}
              title="ক্লিক করে AI অটো-অডিট চালু বা বন্ধ করুন"
            >
              <FaRobot size={14} className={aiEnabled ? "text-cyan-400 animate-pulse" : "text-slate-500"} />
              <span>{aiEnabled ? "AI অটো-অডিট: চালু 🟢" : "AI অটো-অডিট: বন্ধ ⚪"}</span>
            </button>
          )}

          <button
            onClick={fetchReconciliationList}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <FaReceipt size={13} className="text-emerald-400" />
            <span>রিফ্রেশ অডিট</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Cash In */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224]/80 border border-emerald-500/25 p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">মোট ক্যাশ ইন (আদায়)</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <FaMoneyBillWave size={14} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-emerald-300 font-mono mt-1.5">
              ৳ {(summary.total_cash_in || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-400 font-medium mt-0.5 block">
              ১ অক্টোবর থেকে আদায়
            </span>
          </div>

          {/* Card 2: Total Cash Out */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224]/80 border border-rose-500/25 p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">মোট ক্যাশ আউট (খরচ)</span>
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                <FaExclamationTriangle size={14} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-rose-300 font-mono mt-1.5">
              ৳ {(summary.total_cash_out || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-rose-400 font-medium mt-0.5 block">
              ১ অক্টোবর থেকে খরচ
            </span>
          </div>

          {/* Card 3: Target Bank Deposit */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224]/80 border border-blue-500/30 p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">টার্গেট ব্যাংক জমা (নিট)</span>
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <FaUniversity size={14} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-white font-mono mt-1.5">
              ৳ {summary.total_expected.toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-300 font-medium mt-0.5 block">
              এডমিন পলিসি অনুসারে টার্গেট
            </span>
          </div>

          {/* Card 4: Deposited */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224]/80 border border-cyan-500/25 p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">ব্যাংকে জমাকৃত টাকা</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                <FaCheckCircle size={14} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-cyan-300 font-mono mt-1.5">
              ৳ {summary.total_deposited.toLocaleString()}
            </p>
            <span className="text-[10px] text-cyan-400 font-medium mt-0.5 block">
              {summary.verified_count} টি দিনের ভেরিফাইড জমা
            </span>
          </div>

          {/* Card 5: Shortage & Alerts */}
          <div className={`relative overflow-hidden rounded-2xl bg-[#091224]/80 border p-3.5 shadow-lg ${
            summary.total_shortage > 0 ? "border-amber-500/40 bg-amber-950/15" : "border-slate-800"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">ঘাটতি / পেন্ডিং</span>
              <div className={`p-1.5 rounded-lg ${summary.total_shortage > 0 ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-500"}`}>
                <FaClock size={14} />
              </div>
            </div>
            <p className={`text-xl font-extrabold font-mono mt-1.5 ${summary.total_shortage > 0 ? "text-amber-400" : "text-white"}`}>
              ৳ {summary.total_shortage.toLocaleString()}
            </p>
            <span className={`text-[10px] font-medium mt-0.5 block ${summary.overdue_count > 0 ? "text-amber-400" : "text-slate-400"}`}>
              {summary.overdue_count > 0 ? `🚨 ${summary.overdue_count} দিনের জমা বাকি!` : "সব ঠিক আছে"}
            </span>
          </div>
        </div>
      )}

      {/* Rule Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/20 via-[#0a1426] to-[#0a1426] border border-blue-500/25 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 shrink-0 mt-0.5">
          <FaInfoCircle size={14} />
        </div>
        <div className="text-xs space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-blue-300">ব্যাংক জমা নীতি ও সময়সীমা (১ নভেম্বর ২০২৬ থেকে কার্যকর):</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ১ নভেম্বরের পূর্বের সমস্ত ক্যাশ এককালীন চেক দিয়ে সমন্বিত
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            প্রতিদিনের মোট আদায়কৃত ক্যাশ <strong>পরদিন দুপুর ১২:০০ টার মধ্যে</strong> ব্যাংকে জমা দিয়ে স্লিপ আপলোড করতে হবে। 
            <strong>বৃহস্পতিবারের আদায়কৃত ক্যাশ</strong> শুক্রবার ব্যাংক বন্ধ থাকায় <strong>শনিবার দুপুর ১২:০০ টার মধ্যে</strong> ব্যাংকে জমা দিতে হবে। 
            পূর্বে এই ব্যাংকিং নিয়ম না থাকায় <strong>১ নভেম্বর ২০২৬ এর পূর্ববর্তী সমস্ত দিনের সম্পূর্ণ ক্যাশ</strong> একটি এককালীন সমন্বিত চেক দ্বারা নিষ্পত্তি করা হয়েছে।
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-[#091224] p-1 rounded-xl border border-white/5 overflow-x-auto">
          {[
            { id: "all", label: "সকল দিন", count: data.length },
            { id: "pending", label: "পেন্ডিং জমা", count: summary?.pending_count || 0 },
            { id: "submitted", label: "স্লিপ জমাকৃত", count: data.filter((d) => d.status === "submitted").length },
            { id: "verified", label: "অনুমোদিত / ভেরিফাইড", count: summary?.verified_count || 0 },
            { id: "shortage", label: "ঘাটতি / ওভারডিউ", count: (summary?.overdue_count || 0) + data.filter((d) => Number(d.shortage_amount) > 0).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            placeholder="তারিখ, ব্যাংক, অ্যাকাউন্ট দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#091224] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#091224]/80 shadow-2xl backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#050b17] border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            <tr>
              <th className="py-3.5 px-4">তারিখ & বার</th>
              <th className="py-3.5 px-4">ক্যাশ ইন ও আউট</th>
              <th className="py-3.5 px-4">এডমিন ডিপোজিট পলিসি</th>
              <th className="py-3.5 px-4">জমার ডেডলাইন</th>
              <th className="py-3.5 px-4 text-right">টার্গেট জমা</th>
              <th className="py-3.5 px-4 text-right">ব্যাংকে জমা</th>
              <th className="py-3.5 px-4 text-right">ঘাটতি</th>
              <th className="py-3.5 px-4">ব্যাংক বিবরণ</th>
              <th className="py-3.5 px-4 text-center">স্লিপ</th>
              <th className="py-3.5 px-4 text-center">অবস্থা</th>
              <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-slate-500">
                  <FaUniversity size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">কোনো ব্যাংক জমার রেকর্ড পাওয়া যায়নি</p>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const isShort = Number(item.shortage_amount) > 0;
                const isPending = item.status === "pending_deposit";
                const isSubmitted = item.status === "submitted";
                const isVerified = item.status === "verified";
                const isRejected = item.status === "rejected";
                const isHistorical = item.collection_date === "2026-09-30" || item.account_no === "HISTORICAL-CHECK";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isHistorical
                        ? "bg-amber-950/25 border-l-4 border-amber-500"
                        : item.is_overdue
                        ? "bg-amber-950/10"
                        : isShort
                        ? "bg-rose-950/10"
                        : ""
                    }`}
                  >
                    {/* Collection Date & Day */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className={isHistorical ? "text-amber-300 font-extrabold" : ""}>
                          {item.collection_date}
                        </span>
                        {isHistorical && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
                            পূর্ববর্তী পুঞ্জীভূত চেক
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isHistorical ? "১ তারিখের পূর্বের সর্বমোট ক্যাশ" : item.day_name}
                      </span>
                    </td>

                    {/* Cash In vs Cash Out */}
                    <td className="py-3 px-4 font-mono text-xs">
                      {isHistorical ? (
                        <span className="text-slate-400 text-[11px] italic">ঐতিহাসিক ব্যালেন্স</span>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                            <span className="text-[10px] text-slate-400 font-normal">ইন:</span>
                            <span>৳ {item.total_cash_in.toLocaleString()}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-semibold text-xs ${item.total_cash_out > 0 ? "text-rose-400" : "text-slate-500 text-[10px]"}`}>
                            <span className="text-[10px] text-slate-400 font-normal">আউট:</span>
                            <span>{item.total_cash_out > 0 ? `৳ ${item.total_cash_out.toLocaleString()}` : "৳ ০"}</span>
                          </div>
                          {item.cash_out_items && item.cash_out_items.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenExpenseModal(item)}
                              className="inline-flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer mt-0.5 underline"
                              title="আজকের খরচের আইটেম তালিকা দেখুন ও বাছাই করুন"
                            >
                              <FaTags size={8} />
                              <span>{item.cash_out_items.length} টি খরচ দেখুন</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Admin Policy Switch */}
                    <td className="py-3 px-4 text-xs">
                      {isHistorical ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          এককালীন চেক
                        </span>
                      ) : isAdminOrDev ? (
                        <div className="space-y-1">
                          <div className="inline-flex rounded-lg bg-[#050b17] border border-white/10 p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleUpdatePolicy(item, "net_deduct")}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                item.adjustment_mode === "net_deduct"
                                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                              title="সব ক্যাশ আউট বাদ দিয়ে নিট ক্যাশ জমা দিন"
                            >
                              খরচ বাদ (Net)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePolicy(item, "gross_full")}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                item.adjustment_mode === "gross_full"
                                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                              title="খরচ ব্যাংক থেকে হয়েছে, সম্পূর্ণ ক্যাশ ইন জমা দিতে হবে"
                            >
                              ফুল ইন (Gross)
                            </button>
                            {item.total_cash_out > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenExpenseModal(item)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  item.adjustment_mode === "custom"
                                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/50 shadow-sm"
                                    : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                }`}
                                title="কোন কোন খরচ ড্রয়ার থেকে বাদ যাবে সিলেক্ট করুন"
                              >
                                <FaSlidersH size={10} />
                                <span>{item.adjustment_mode === "custom" ? "বাছাইকৃত" : "বাছাই"}</span>
                              </button>
                            )}
                          </div>
                          {item.adjustment_mode === "custom" && (
                            <div className="text-[10px] font-semibold text-violet-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                              <span>
                                {item.deducted_expense_ids?.length || 0}টি খরচ বাদ (৳ {(item.deducted_expense_amount || 0).toLocaleString()})
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.adjustment_mode === "gross_full"
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                              : item.adjustment_mode === "custom"
                              ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {item.adjustment_mode === "gross_full"
                            ? "ফুল ইন জমা"
                            : item.adjustment_mode === "custom"
                            ? "বাছাইকৃত খরচ সমন্বয়"
                            : "খরচ বাদ দিয়ে জমা"}
                        </span>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="py-3 px-4 text-[11px]">
                      {isHistorical ? (
                        <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                          <FaCheckCircle size={11} /> এককালীন নিষ্পত্তি
                        </span>
                      ) : (
                        <>
                          <div className="font-mono text-slate-300">
                            {item.deadline_datetime ? item.deadline_datetime.slice(0, 16) : "N/A"}
                          </div>
                          {item.is_overdue && isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md mt-0.5">
                              <FaClock size={9} /> ওভারডিউ (সময় পার)
                            </span>
                          )}
                        </>
                      )}
                    </td>

                    {/* Target Expected Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      {item.expected_amount > 0 ? (
                        <span className="text-white">৳ {item.expected_amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-semibold">৳ ০ (খরচ সমন্বিত)</span>
                      )}
                    </td>

                    {/* Deposited Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300 text-sm">
                      {item.deposited_amount > 0 ? (
                        `৳ ${item.deposited_amount.toLocaleString()}`
                      ) : (
                        <span className="text-slate-500 font-normal">অপেক্ষমাণ</span>
                      )}
                    </td>

                    {/* Shortage */}
                    <td className="py-3 px-4 text-right font-mono">
                      {isShort ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-lg text-xs">
                          -৳ {item.shortage_amount.toLocaleString()}
                        </span>
                      ) : item.deposited_amount > 0 ? (
                        <span className="text-emerald-400 font-semibold text-xs flex items-center justify-end gap-1">
                          <FaCheckCircle size={11} /> ৳ ০ (মিলেছে)
                        </span>
                      ) : item.expected_amount === 0 ? (
                        <span className="text-emerald-400 text-xs font-semibold">৳ ০ (মিলেছে)</span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>

                    {/* Bank & Account */}
                    <td className="py-3 px-4 text-xs">
                      {item.bank_name ? (
                        <div>
                          <div className="font-semibold text-white">{item.bank_name}</div>
                          {item.account_no && (
                            <div className="text-[10px] font-mono text-slate-400">
                              A/C: {item.account_no}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">জমা হয়নি</span>
                      )}
                    </td>

                    {/* Slip Image Thumbnail */}
                    <td className="py-3 px-4 text-center">
                      {item.slip_image ? (
                        <button
                          type="button"
                          onClick={() => handleOpenVerifyModal(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition text-[11px] font-semibold cursor-pointer"
                        >
                          <FaCamera size={11} />
                          <span>স্লিপ দেখুন</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">ছবি নেই</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <FaCheckCircle size={9} /> ভেরিফাইড
                        </span>
                      )}
                      {isSubmitted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          <FaClock size={9} /> স্লিপ জমাকৃত
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          পেন্ডিং জমা
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          আপত্তি / বাতিল
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Admin View: Only Audit, Remarks & Verification */}
                        {isAdminOrDev ? (
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                              isSubmitted
                                ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/50 animate-pulse"
                                : isVerified
                                ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                                : isRejected
                                ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            }`}
                            title="স্লিপ ও কালেকশন স্টেটমেন্ট দেখে অনুমোদন বা মন্তব্য করুন"
                          >
                            <FaUserCheck size={11} />
                            <span>
                              {isSubmitted
                                ? "ভেরিফাই ও অনুমোদন"
                                : isVerified
                                ? "অডিট বিবরণী"
                                : isRejected
                                ? "আপত্তিকৃত (রিভিউ)"
                                : "স্টেটমেন্ট ও অডিট"}
                            </span>
                          </button>
                        ) : isHistorical ? (
                          /* Historical record for staff */
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer flex items-center gap-1"
                            title="১ তারিখের পূর্বের পুঞ্জীভূত ক্যাশ চেক বিবরণী"
                          >
                            <FaReceipt size={10} />
                            <span>ঐতিহাসিক চেক</span>
                          </button>
                        ) : (
                          /* Field Staff / Manager View: Submit Deposit & Slip */
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenSubmitModal(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1"
                              title="ব্যাংক জমার স্লিপ আপলোড করুন"
                            >
                              <FaUpload size={10} />
                              <span>{item.deposited_amount > 0 ? "সংশোধন" : "জমা দিন"}</span>
                            </button>

                            {item.slip_image && (
                              <button
                                type="button"
                                onClick={() => handleOpenVerifyModal(item)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                title="জমার স্লিপ দেখুন"
                              >
                                <FaEye size={11} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================================= */}
      {/* 📤 MODAL 1: SUBMIT BANK DEPOSIT (Slip & Amount Submission)                */}
      {/* ======================================================================= */}
      {showSubmitModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#091224] border border-emerald-500/30 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FaUniversity size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ব্যাংক জমার স্লিপ ও তথ্য এন্ট্রি</h3>
                  <p className="text-xs text-emerald-400">
                    কালেকশন তারিখ: {selectedRecord.collection_date} ({selectedRecord.day_name})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4 text-xs">
              {/* Expected vs Target Box */}
              <div className="bg-[#050b17] border border-white/10 rounded-2xl p-3.5 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">সংগৃহীত মোট ক্যাশ (Target):</span>
                  <span className="font-extrabold text-white text-base font-mono">
                    ৳ {selectedRecord.expected_amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">জমার ডেডলাইন:</span>
                  <span className="font-mono text-slate-300 text-xs">
                    {selectedRecord.deadline_datetime ? selectedRecord.deadline_datetime.slice(0, 16) : "N/A"}
                  </span>
                </div>
              </div>

              {/* Bank Name & Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ব্যাংকের নাম *</label>
                  <select
                    value={depositForm.bank_name}
                    onChange={(e) => setDepositForm({ ...depositForm, bank_name: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    {popularBanks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">অ্যাকাউন্ট নম্বর / ব্রাঞ্চ</label>
                  <input
                    type="text"
                    placeholder="যেমন: ১৫১২০... বা গুলশান ব্রাঞ্চ"
                    value={depositForm.account_no}
                    onChange={(e) => setDepositForm({ ...depositForm, account_no: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Deposit Date & Deposited Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ব্যাংকে জমার তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={depositForm.deposit_date}
                    onChange={(e) => setDepositForm({ ...depositForm, deposit_date: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ব্যাংকে জমা টাকার পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="যেমন: ৫০,০০০"
                    value={depositForm.deposited_amount}
                    onChange={(e) => setDepositForm({ ...depositForm, deposited_amount: e.target.value })}
                    className="w-full bg-[#050b17] border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-base outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Live Shortage Warning & Discrepancy Reason (Only when money doesn't match) */}
              {Number(depositForm.deposited_amount || 0) > 0 &&
                selectedRecord.expected_amount - Number(depositForm.deposited_amount || 0) > 0 ? (
                <>
                  <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <FaExclamationTriangle className="text-rose-400" size={13} />
                      <span>
                        ঘাটতি: ৳ {(selectedRecord.expected_amount - Number(depositForm.deposited_amount)).toLocaleString()} টাকা কম জমা হচ্ছে!
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      আদায়কৃত ক্যাশের সম্পূর্ণ টাকা জমা না দিলে ঘাটতির কারণ বা কৈফিয়ত উল্লেখ করা বাধ্যতামূলক।
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>ক্যাশ না মেলার কারণ / কৈফিয়ত</span>
                      <span className="text-[10px] text-rose-400 font-bold">* বাধ্যতামূলক (ঘাটতি থাকায়)</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="যেমন: একজন গ্রাহক বিকেলে কিস্তির টাকা ফেরত চেয়েছেন বা নোটের গরমিল..."
                      value={depositForm.discrepancy_reason}
                      onChange={(e) => setDepositForm({ ...depositForm, discrepancy_reason: e.target.value })}
                      className="w-full bg-[#050b17] border border-rose-500/40 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-rose-400 resize-none font-medium"
                    />
                  </div>
                </>
              ) : Number(depositForm.deposited_amount || 0) > 0 ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <FaCheckCircle size={14} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    টাকা সম্পূর্ণ মিলেছে (কোনো ঘাটতি নেই)
                  </span>
                </div>
              ) : null}

              {/* Slip Image Upload & AI Auto-Scan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block">
                    ব্যাংক জমার সিলযুক্ত স্লিপ বা রসিদের ছবি
                  </label>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    aiEnabled ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    <FaRobot size={10} className={aiEnabled ? "text-cyan-400" : ""} />
                    <span>{aiEnabled ? "AI অটো-স্ক্যান সক্রিয়" : "ম্যানুয়াল মোড"}</span>
                  </span>
                </div>

                {/* AI Scanning Indicator */}
                {isAiScanning && (
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 flex items-center gap-3 animate-pulse shadow-lg">
                    <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                      <span className="font-bold block text-xs text-white">🤖 Google Gemini AI স্লিপ স্ক্যান করছে...</span>
                      <span className="text-[10px] text-cyan-400">স্লিপের লেখা ও সিল যাচাই করে তথ্য অটো-ফিল করা হচ্ছে</span>
                    </div>
                  </div>
                )}

                {/* AI Extraction Success Card */}
                {aiDetectedData && (
                  <div className="p-3 rounded-2xl bg-[#041a29] border border-cyan-500/40 text-cyan-200 space-y-1.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                        <FaMagic className="text-cyan-400" size={12} />
                        <span>AI স্লিপ সনাক্তকরণ ফলাফল:</span>
                      </div>
                      {depositForm.slip_file && (
                        <button
                          type="button"
                          onClick={() => scanSlipWithAi(depositForm.slip_file)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                        >
                          পুনরায় স্ক্যান
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] font-mono grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/20">
                      <div>টাকা: <strong className="text-white font-bold">৳ {Number(aiDetectedData.deposited_amount || 0).toLocaleString()}</strong></div>
                      <div>ব্যাংক: <strong className="text-white">{aiDetectedData.bank_name || "N/A"}</strong></div>
                      {aiDetectedData.reference_no && (
                        <div className="col-span-2 text-slate-300">Trx / Ref: <span className="text-cyan-300 font-bold">{aiDetectedData.reference_no}</span></div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-3 flex items-center justify-center gap-2 cursor-pointer transition bg-[#050b17] group">
                    <FaCamera size={14} className="text-slate-400 group-hover:text-emerald-400 transition" />
                    <span className="text-slate-300 text-xs font-medium group-hover:text-emerald-300">
                      {depositForm.slip_file ? depositForm.slip_file.name : "স্লিপের ছবি আপলোড করুন"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {depositForm.slip_preview && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0 relative group">
                      <img
                        src={depositForm.slip_preview}
                        alt="Slip preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {depositForm.slip_file && !isAiScanning && !aiDetectedData && aiEnabled && (
                  <button
                    type="button"
                    onClick={() => scanSlipWithAi(depositForm.slip_file)}
                    className="w-full py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FaMagic size={12} className="text-cyan-400" />
                    <span>ছবিটি AI দিয়ে স্ক্যান করুন</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingDeposit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  {submittingDeposit ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>জমা ও স্লিপ নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🔍 MODAL 2: VERIFY & AUDIT (Admin Slip Review & Reconciliation)           */}
      {/* ======================================================================= */}
      {showVerifyModal && verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#091224] border border-cyan-500/30 w-full max-w-xl rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <FaUserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ব্যাংক ডিপোজিট অডিট ও রিকনসিলিয়েশন</h3>
                  <p className="text-xs text-cyan-400">
                    কালেকশন: {verifyTarget.collection_date} | জমাকৃত: ৳ {verifyTarget.deposited_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Slip Image Full Preview */}
              {verifyTarget.slip_image ? (
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#050b17] p-2 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">ব্যাংক জমার রসিদ / সিলযুক্ত স্লিপ:</span>
                  <a
                    href={`${API}/../${verifyTarget.slip_image}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl max-h-72 cursor-zoom-in"
                  >
                    <img
                      src={`${API}/../${verifyTarget.slip_image}`}
                      alt="Bank Slip"
                      className="w-full object-contain mx-auto max-h-72 hover:scale-105 transition-transform"
                    />
                  </a>
                  <span className="text-[10px] text-cyan-400 underline mt-1 block">
                    (বড় করে দেখতে ছবিতে ক্লিক করুন)
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-center text-slate-500">
                  কোনো স্লিপের ছবি আপলোড করা হয়নি।
                </div>
              )}

              {/* Inflow vs Outflow vs Policy Box */}
              <div className="bg-[#050b17] border border-white/10 rounded-2xl p-3.5 space-y-3">
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="border-r border-white/5">
                    <span className="text-slate-400 text-[10px] block">ক্যাশ ইন</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      ৳ {(verifyTarget.total_cash_in || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-r border-white/5">
                    <span className="text-slate-400 text-[10px] block">ক্যাশ আউট</span>
                    <span className="font-extrabold text-rose-400 text-sm">
                      ৳ {(verifyTarget.total_cash_out || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-r border-white/5">
                    <span className="text-slate-400 text-[10px] block">টার্গেট জমা</span>
                    <span className="font-extrabold text-white text-sm">
                      ৳ {(verifyTarget.expected_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">ব্যাংকে জমা</span>
                    <span className="font-extrabold text-cyan-300 text-sm">
                      ৳ {(verifyTarget.deposited_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isAdminOrDev && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">ডিপোজিট হিসাব পলিসি:</span>
                    <div className="inline-flex rounded-lg bg-black/40 border border-white/10 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdatePolicy(verifyTarget, "net_deduct")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                          verifyTarget.adjustment_mode === "net_deduct"
                            ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        খরচ বাদ (Net)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePolicy(verifyTarget, "gross_full")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                          verifyTarget.adjustment_mode === "gross_full"
                            ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        ফুল ইন (Gross)
                      </button>
                      {verifyTarget.total_cash_out > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenExpenseModal(verifyTarget)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                            verifyTarget.adjustment_mode === "custom"
                              ? "bg-violet-500/30 text-violet-300 border border-violet-500/50"
                              : "text-amber-400 hover:text-amber-300"
                          }`}
                        >
                          <FaSlidersH size={10} />
                          <span>খরচ বাছাই</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Worker Explanation Alert */}
              {verifyTarget.discrepancy_reason && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                  <span className="font-bold text-xs block mb-1">
                    ক্যাশ কম জমার কৈফিয়ত (কর্মীর বক্তব্য):
                  </span>
                  <p className="text-xs text-slate-200 italic">
                    "{verifyTarget.discrepancy_reason}"
                  </p>
                  {verifyTarget.submitted_by_name && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      প্রদানকারী: {verifyTarget.submitted_by_name} ({verifyTarget.submitted_at})
                    </span>
                  )}
                </div>
              )}

              {/* Admin Notes Section */}
              {isAdminOrDev ? (
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    অ্যাডমিন মন্তব্য / রিকনসিলিয়েশন নোট (অনুমোদন বা আপত্তির বিবরণ)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ব্যাংক স্টেটমেন্ট চেক করে অনুমোদন করা হলো / অমুক কারণে বাতিল করা হলো..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * আপত্তি/বাতিল করতে চাইলে কারণ উল্লেখ করা বাধ্যতামূলক।
                  </span>
                </div>
              ) : (
                verifyTarget.admin_notes && (
                  <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                    <span className="font-bold text-xs block mb-1">অ্যাডমিনের মন্তব্য / নির্দেশ:</span>
                    <p className="text-xs text-slate-200 italic">"{verifyTarget.admin_notes}"</p>
                  </div>
                )
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  বন্ধ করুন
                </button>

                {/* Only Admin / Dev can Approve or Reject */}
                {isAdminOrDev && (
                  <>
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => handleVerifyAction("reject")}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <FaTimes size={11} />
                      <span>আপত্তি / বাতিল</span>
                    </button>
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => handleVerifyAction("verify")}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                    >
                      <FaCheckCircle size={12} />
                      <span>অনুমোদন ও রিকনসাইল (Match)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================================= */}
      {/* ⚙️ MODAL 3: GRANULAR EXPENSE PICKER & POLICY CONTROL                     */}
      {/* ======================================================================= */}
      {showExpenseModal && expenseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#091224] border border-violet-500/30 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center">
                  <FaSlidersH size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>দৈনিক ক্যাশ আউট বাছাই ও ব্যাংক জমা সমন্বয়</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                      ফুল কন্ট্রোল
                    </span>
                  </h3>
                  <p className="text-xs text-violet-300">
                    তারিখ: <strong className="text-white">{expenseTarget.collection_date}</strong> ({expenseTarget.day_name}) | কোন খরচ ক্যাশ থেকে বাদ যাবে তা নির্ধারণ করুন
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExpenseModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="bg-[#050b17] border border-violet-500/25 rounded-2xl p-4 mb-4 shadow-inner">
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="border-r border-white/5">
                  <span className="text-slate-400 text-[10px] block font-sans">মোট ক্যাশ ইন (আদায়)</span>
                  <span className="font-extrabold text-emerald-400 text-base">
                    ৳ {Number(expenseTarget.total_cash_in || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-r border-white/5">
                  <span className="text-slate-400 text-[10px] block font-sans">বাদ যাবে (ড্রয়ার খরচ)</span>
                  <span className="font-extrabold text-rose-400 text-base">
                    -৳ {currentSelectedExpenseSum.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-sans">
                    ({selectedExpenseIds.size} টি খরচ নির্বাচিত)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">টার্গেট ব্যাংক জমা</span>
                  <span className="font-extrabold text-cyan-300 text-lg">
                    ৳ {calculatedTargetAmount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-cyan-400 block font-sans font-medium">
                    স্টাফের কাছে প্রত্যাশিত জমা
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <FaLayerGroup size={12} className="text-violet-400" />
                <span>আজকের খরচের তালিকা ({expenseTarget.cash_out_items?.length || 0} টি):</span>
              </span>

              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAllExpenses}
                  className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer font-medium"
                >
                  সব খরচ বাদ (Net)
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllExpenses}
                  className="px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition cursor-pointer font-medium"
                >
                  কোনোটিই নয় (Gross)
                </button>
                <button
                  type="button"
                  onClick={handleSelectCompanyExpensesOnly}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer font-medium"
                  title="শুধুমাত্র অফিস ও দৈনন্দিন খরচগুলো সিলেক্ট করুন"
                >
                  অফিস খরচ বাছাই
                </button>
              </div>
            </div>

            {/* Expenses List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 mb-4">
              {expenseTarget.cash_out_items && expenseTarget.cash_out_items.length > 0 ? (
                expenseTarget.cash_out_items.map((item) => {
                  const isChecked = selectedExpenseIds.has(Number(item.id));
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleExpense(item.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? "bg-violet-950/25 border-violet-500/40 shadow-sm"
                          : "bg-[#050b17] border-white/5 opacity-70 hover:opacity-100 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-base ${isChecked ? "text-violet-400" : "text-slate-600"}`}>
                          {isChecked ? <FaCheckSquare /> : <FaSquare />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                item.color_bg || "bg-slate-500/15"
                              } ${item.color_text || "text-slate-300"} ${
                                item.color_border || "border-slate-500/30"
                              }`}
                            >
                              {item.name_bn || item.category}
                            </span>
                            {item.is_company_expense === 1 && (
                              <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                                কোম্পানি খরচ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 mt-1 font-medium">
                            {item.purpose || "উদ্দেশ্য উল্লেখ নেই"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className={`text-sm font-bold ${isChecked ? "text-rose-400" : "text-slate-400"}`}>
                          ৳ {Number(item.amount).toLocaleString()}
                        </span>
                        <span className="block text-[9px] text-slate-500 font-sans">
                          {isChecked ? "ক্যাশ থেকে বাদ যাবে" : "ব্যাংক/অন্যান্য খাত"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-2xl bg-[#050b17] border border-white/5 text-center text-slate-500 text-xs">
                  এই তারিখে কোনো ক্যাশ আউট রেকর্ড নেই।
                </div>
              )}
            </div>

            {/* Instruction Tip */}
            <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-2 mb-4 text-[11px] text-slate-300">
              <FaInfoCircle size={13} className="text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>পলিসি গাইড:</strong> যে খরচগুলোতে টিক চিহ্ন থাকবে, সেগুলো ক্যাশ ইন থেকে বাদ দিয়ে নিট টাকা ব্যাংকে জমা দেওয়ার টার্গেট তৈরি হবে। যে খরচগুলো ব্যাংক অ্যাকাউন্ট বা চেক দিয়ে মেটানো হয়েছে, সেগুলোর টিক তুলে দিন।
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={savingExpensePolicy}
                onClick={handleSaveCustomExpensePolicy}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-violet-950/50"
              >
                {savingExpensePolicy ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle size={12} />
                    <span>পলিসি সেভ ও টার্গেট নির্ধারণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Toast */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} duration={4500} />
    </div>
  );
}
