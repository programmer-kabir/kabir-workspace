import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaMotorcycle,
  FaStore,
  FaHome,
  FaTools,
  FaProjectDiagram,
  FaBox,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUser,
  FaPhoneAlt,
  FaIdCard,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaChartLine,
  FaTimes,
  FaReceipt,
  FaHandHoldingUsd,
  FaTag,
  FaUndoAlt,
  FaHandshake,
  FaBuilding,
  FaChartPie,
  FaHistory,
  FaCoins,
  FaBriefcase,
  FaFileContract,
} from "react-icons/fa";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";

const API = import.meta.env.VITE_LOCALHOST_KEY;

const categoryIcons = {
  bike: <FaMotorcycle className="text-orange-400" size={18} />,
  shop: <FaStore className="text-blue-400" size={18} />,
  house: <FaHome className="text-emerald-400" size={18} />,
  equipment: <FaTools className="text-amber-400" size={18} />,
  project: <FaProjectDiagram className="text-purple-400" size={18} />,
  company_share: <FaBuilding className="text-cyan-400" size={18} />,
  other: <FaBox className="text-slate-400" size={18} />,
};

const categoryLabels = {
  bike: "বাইক লিজ",
  shop: "দোকান ভাড়া",
  house: "বাসা/ঘর ভাড়া",
  equipment: "যন্ত্রপাতি",
  project: "প্রজেক্ট ইনভেস্টমেন্ট",
  company_share: "কোম্পানি শেয়ার (Equity)",
  other: "অন্যান্য",
};

const OtherSourcesAssets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAssetForAgreement, setSelectedAssetForAgreement] = useState(null);

  // Dividend Modal (For Company Shares / Equity)
  const [showDividendModal, setShowDividendModal] = useState(false);
  const [selectedAssetForDividend, setSelectedAssetForDividend] = useState(null);
  const [dividendForm, setDividendForm] = useState({
    amount: "",
    billing_month: new Date().toISOString().slice(0, 7),
    collection_date: new Date().toISOString().split("T")[0],
    payment_method: "Bank Transfer",
    remarks: "",
    create_cash_in: true,
  });
  const [submittingDividend, setSubmittingDividend] = useState(false);

  // Asset / Dividend History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sell Modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedAssetForSell, setSelectedAssetForSell] = useState(null);
  const [sellForm, setSellForm] = useState({
    selling_price: "",
    sale_date: new Date().toISOString().split("T")[0],
    buyer_name: "",
    buyer_mobile: "",
    payment_method: "Cash",
    remarks: "",
    create_cash_in: true,
  });
  const [submittingSell, setSubmittingSell] = useState(false);

  // Terminate / Repossess Modal
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [selectedAssetForTerminate, setSelectedAssetForTerminate] = useState(null);
  const [terminateForm, setTerminateForm] = useState({
    reason: "ভাড়া পরিশোধ না করায় চুক্তি বাতিল ও সম্পদ অফিসে ফেরত নেওয়া হয়েছে",
    end_date: new Date().toISOString().split("T")[0],
  });
  const [submittingTerminate, setSubmittingTerminate] = useState(false);

  // Add Asset Form
  const [newAsset, setNewAsset] = useState({
    asset_name: "",
    category: "bike",
    purchase_price: "",
    purchase_date: new Date().toISOString().split("T")[0],
    share_percentage: "",
    share_units: "",
    business_type: "",
    reg_no: "",
    contact_person: "",
    dividend_frequency: "on_demand",
    vendor_info: "",
    remarks: "",
    create_cash_out: true,
  });
  const [submittingAsset, setSubmittingAsset] = useState(false);

  // Agreement Form
  const [newAgreement, setNewAgreement] = useState({
    lessee_name: "",
    lessee_mobile: "",
    lessee_nid: "",
    lessee_address: "",
    agreement_type: "rental",
    monthly_rent: "",
    due_day: 5,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    security_deposit: "",
    record_deposit_cash: false,
  });
  const [submittingAgreement, setSubmittingAgreement] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/other_sources/get_assets.php`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data || []);
        setSummary(data.summary || null);
      } else {
        toast.error(data.message || "অ্যাসেট লোড করা যায়নি");
      }
    } catch (err) {
      toast.error("সার্ভার এরর, পরে চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.lessee_name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.lessee_mobile?.includes(search) ||
        asset.vendor_info?.toLowerCase().includes(search.toLowerCase()) ||
        asset.business_type?.toLowerCase().includes(search.toLowerCase()) ||
        asset.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
        asset.reg_no?.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedCategory === "all" || asset.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [assets, search, selectedCategory]);

  // Handle Add Asset Submit
  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.asset_name.trim() || Number(newAsset.purchase_price) <= 0) {
      return toast.error("অ্যাসেটের নাম এবং সঠিক ক্রয়/বিনিয়োগ মূল্য দিন");
    }

    try {
      setSubmittingAsset(true);
      const res = await fetch(`${API}/other_sources/create_asset.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "অ্যাসেট সফলভাবে যুক্ত হয়েছে 🎉");
        setShowAddModal(false);
        setNewAsset({
          asset_name: "",
          category: "bike",
          purchase_price: "",
          purchase_date: new Date().toISOString().split("T")[0],
          share_percentage: "",
          share_units: "",
          business_type: "",
          reg_no: "",
          contact_person: "",
          dividend_frequency: "on_demand",
          vendor_info: "",
          remarks: "",
          create_cash_out: true,
        });
        fetchAssets();
      } else {
        toast.error(data.message || "সংরক্ষণ করা যায়নি");
      }
    } catch (err) {
      toast.error("সার্ভার এরর");
    } finally {
      setSubmittingAsset(false);
    }
  };

  // Open Dividend Modal
  const handleOpenDividendModal = (asset) => {
    setSelectedAssetForDividend(asset);
    setDividendForm({
      amount: "",
      billing_month: new Date().toISOString().slice(0, 7),
      collection_date: new Date().toISOString().split("T")[0],
      payment_method: "Bank Transfer",
      remarks: "",
      create_cash_in: true,
    });
    setShowDividendModal(true);
  };

  // Submit Dividend
  const handleDividendSubmit = async (e) => {
    e.preventDefault();
    if (Number(dividendForm.amount) <= 0) {
      return toast.error("সঠিক লভ্যাংশের পরিমাণ প্রদান করুন");
    }

    try {
      setSubmittingDividend(true);
      const res = await fetch(`${API}/other_sources/collect_dividend.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dividendForm,
          asset_id: selectedAssetForDividend.id,
          amount: Number(dividendForm.amount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "লভ্যাংশ সফলভাবে গ্রহণ করা হয়েছে 🎉");
        setShowDividendModal(false);
        fetchAssets();
      } else {
        toast.error(data.message || "লভ্যাংশ সংরক্ষণ ব্যর্থ");
      }
    } catch (err) {
      toast.error("সার্ভার এরর, পরে চেষ্টা করুন");
    } finally {
      setSubmittingDividend(false);
    }
  };

  // Open History Modal
  const handleOpenHistoryModal = async (asset) => {
    setSelectedAssetForHistory(asset);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `${API}/other_sources/get_asset_history.php?asset_id=${asset.id}`
      );
      const data = await res.json();
      if (data.success) {
        setHistoryData(data);
      } else {
        toast.error(data.message || "হিস্টোরি লোড করা যায়নি");
      }
    } catch (err) {
      toast.error("সার্ভার এরর");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Agreement Modal
  const handleOpenAgreementModal = (asset) => {
    setSelectedAssetForAgreement(asset);
    setNewAgreement({
      lessee_name: asset.lessee_name || "",
      lessee_mobile: asset.lessee_mobile || "",
      lessee_nid: asset.lessee_nid || "",
      lessee_address: "",
      agreement_type: asset.agreement_type || "rental",
      monthly_rent: asset.monthly_rent || "",
      due_day: asset.due_day || 5,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      security_deposit: asset.security_deposit || "",
      record_deposit_cash: false,
    });
    setShowAgreementModal(true);
  };

  // Handle Agreement Submit
  const handleAgreementSubmit = async (e) => {
    e.preventDefault();
    if (
      !newAgreement.lessee_name.trim() ||
      Number(newAgreement.monthly_rent) <= 0
    ) {
      return toast.error("গ্রহীতার নাম এবং মাসিক ভাড়ার পরিমাণ দিন");
    }

    try {
      setSubmittingAgreement(true);
      const payload = {
        ...newAgreement,
        asset_id: selectedAssetForAgreement.id,
      };

      const res = await fetch(`${API}/other_sources/create_agreement.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "চুক্তি সফলভাবে সম্পন্ন হয়েছে 🎉");
        setShowAgreementModal(false);
        fetchAssets();
      } else {
        toast.error(data.message || "চুক্তি সংরক্ষণ ব্যর্থ");
      }
    } catch (err) {
      toast.error("সার্ভার এরর");
    } finally {
      setSubmittingAgreement(false);
    }
  };

  // Open Sell Modal
  const handleOpenSellModal = (asset) => {
    setSelectedAssetForSell(asset);
    setSellForm({
      selling_price: "",
      sale_date: new Date().toISOString().split("T")[0],
      buyer_name: "",
      buyer_mobile: "",
      payment_method: "Cash",
      remarks: "",
      create_cash_in: true,
    });
    setShowSellModal(true);
  };

  // Submit Sell
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    if (Number(sellForm.selling_price) <= 0) {
      return toast.error("সঠিক বিক্রয়মূল্য প্রদান করুন");
    }

    try {
      setSubmittingSell(true);
      const res = await fetch(`${API}/other_sources/sell_asset.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellForm,
          asset_id: selectedAssetForSell.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "অ্যাসেট সফলভাবে বিক্রয় সম্পন্ন হয়েছে!");
        setShowSellModal(false);
        fetchAssets();
      } else {
        toast.error(data.message || "বিক্রয় ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সার্ভার এরর, পরে চেষ্টা করুন");
    } finally {
      setSubmittingSell(false);
    }
  };

  // Open Terminate / Repossess Modal
  const handleOpenTerminateModal = (asset) => {
    setSelectedAssetForTerminate(asset);
    setTerminateForm({
      reason: "ভাড়া পরিশোধ না করায় চুক্তি বাতিল ও সম্পদ অফিসে ফেরত নেওয়া হয়েছে",
      end_date: new Date().toISOString().split("T")[0],
    });
    setShowTerminateModal(true);
  };

  // Submit Terminate / Repossess
  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetForTerminate?.agreement_id) return;

    try {
      setSubmittingTerminate(true);
      const res = await fetch(`${API}/other_sources/terminate_agreement.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreement_id: selectedAssetForTerminate.agreement_id,
          end_date: terminateForm.end_date,
          reason: terminateForm.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "চুক্তি বাতিল ও সম্পদ ফেরত নেওয়া হয়েছে 🎉");
        setShowTerminateModal(false);
        fetchAssets();
      } else {
        toast.error(data.message || "ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সার্ভার এরর");
    } finally {
      setSubmittingTerminate(false);
    }
  };

  if (loading) {
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
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
            <FaChartLine size={13} />
            <span>ASSET REVENUE & CAPITAL TRACKING</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Others Source Assets & Investment
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            কোম্পানির কেনা প্রোডাক্ট/অ্যাসেট (ক্যাশ আউট), চুক্তি ও লাইভ ক্যাপিটাল রিকভারি ট্র্যাকিং
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/other-sources/collections")}
            className="px-4 py-2.5 rounded-xl bg-[#0f1b2d] hover:bg-[#1a2b45] text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <FaReceipt size={14} className="text-orange-400" />
            <span>Monthly Collections</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <FaPlus size={13} />
            <span>Add Asset (Cash Out)</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              মোট অ্যাসেট সংখ্যা
            </span>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              {summary.total_assets} টি
            </h3>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-red-400 uppercase tracking-wider block flex items-center gap-1">
              <FaMoneyBillWave size={12} /> মোট ক্রয় খরচ (Cash Out)
            </span>
            <h3 className="text-2xl font-bold text-red-400 mt-1 font-mono">
              ৳ {Number(summary.total_investment).toLocaleString()}
            </h3>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <FaHandHoldingUsd size={12} /> মোট আদায় (Cash In)
            </span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              ৳ {Number(summary.total_recovery).toLocaleString()}
            </h3>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <FaClock size={12} /> মূলধন বাকি
            </span>
            <h3 className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              ৳ {Number(summary.total_remaining).toLocaleString()}
            </h3>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-orange-400 uppercase tracking-wider block">
              ক্যাপিটাল রিকভারি হার
            </span>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-orange-400 font-mono">
                {summary.overall_roi_pct}%
              </h3>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, summary.overall_roi_pct)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f1b2d] p-3 rounded-2xl border border-white/10">
        <input
          type="text"
          placeholder="অ্যাসেটের নাম, ভাড়াটিয়া বা ফোন নম্বর লিখে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 bg-[#071025] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 outline-none"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-orange-500 text-white"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            সকল ({assets.length})
          </button>
          {Object.keys(categoryLabels).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-16 text-center">
          <FaBox className="text-slate-600 text-5xl mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">কোনো অ্যাসেট পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-400 mt-1">
            "Add Asset (Cash Out)" বাটনে ক্লিক করে নতুন অ্যাসেট যুক্ত করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const hasAgreement = !!asset.agreement_id;
            const isShare = asset.category === "company_share";

            // 🏢 1. COMPANY SHARE / EQUITY CARD
            if (isShare) {
              return (
                <div
                  key={asset.id}
                  className="bg-[#0f1b2d] border border-cyan-500/25 hover:border-cyan-400/50 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Top Bar */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0 text-cyan-400">
                          <FaBuilding size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {asset.asset_name}
                          </h3>
                          <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
                            <FaBriefcase size={10} />
                            <span>{asset.business_type || "কোম্পানি শেয়ার (ইকুইটি পার্টনার)"}</span>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                          asset.status === "sold"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                            : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
                        }`}
                      >
                        {asset.status === "sold" ? "শেয়ার একজিট / বিক্রিত" : "শেয়ার হোল্ডিং (Equity)"}
                      </span>
                    </div>

                    {/* Investment & Shareholding Details */}
                    <div className="bg-[#071025]/80 border border-cyan-500/15 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-slate-400 block">বিনিয়োগকৃত মূলধন:</span>
                        <span className="font-bold text-red-400 font-mono text-sm">
                          ৳ {asset.purchase_price.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">বিনিয়োগের তারিখ:</span>
                        <span className="text-slate-200 font-mono">
                          {asset.purchase_date}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">শেয়ার মালিকানা:</span>
                        <span className="font-bold text-cyan-300 font-mono text-sm">
                          {asset.share_percentage !== null ? `${asset.share_percentage}%` : "অংশীদার"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">শেয়ার সংখ্যা:</span>
                        <span className="text-slate-200 font-mono">
                          {asset.share_units ? `${asset.share_units.toLocaleString()} টি` : "প্রযোজ্য নয়"}
                        </span>
                      </div>

                      {(asset.reg_no || asset.contact_person) && (
                        <div className="col-span-2 pt-1.5 border-t border-white/5 text-[11px] space-y-0.5 text-slate-400">
                          {asset.reg_no && (
                            <div>রেজি/লাইসেন্স: <strong className="text-slate-300 font-mono">{asset.reg_no}</strong></div>
                          )}
                          {asset.contact_person && (
                            <div>পরিচালক/যোগাযোগ: <strong className="text-slate-300">{asset.contact_person}</strong></div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* If Sold: Show Outright Sale Breakdown */}
                    {asset.status === "sold" ? (
                      <div className="bg-purple-950/30 border border-purple-500/25 rounded-xl p-3 text-xs mb-4 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
                          <span className="text-purple-300 font-bold flex items-center gap-1.5">
                            <FaTag size={11} className="text-purple-400" />
                            <span>শেয়ার একজিট / বিক্রয় সম্পন্ন</span>
                          </span>
                          <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700/50">
                            {asset.sale_date}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400 block">বিক্রয়মূল্য (Cash In):</span>
                            <span className="font-bold text-emerald-400 font-mono text-sm">
                              ৳ {Number(asset.selling_price || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">ক্যাপিটাল গেইন প্রফিট:</span>
                            <span className="font-bold text-cyan-300 font-mono text-sm">
                              +৳ {Number(asset.sale_profit || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-purple-500/20 text-[11px] text-slate-300 flex items-center justify-between">
                          <span>ক্রেতা: <strong className="text-white">{asset.buyer_name || "কোম্পানি বাইব্যাক"}</strong></span>
                          {asset.buyer_mobile && (
                            <span className="font-mono text-slate-400">{asset.buyer_mobile}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Dividends Earned & Capital Recovery */
                      <div className="space-y-2 mb-4">
                        <div className="bg-[#071025]/60 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-slate-400 block">মোট প্রাপ্ত লভ্যাংশ:</span>
                            <span className="font-bold text-emerald-400 font-mono text-sm">
                              ৳ {asset.total_collected.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">লভ্যাংশ গ্রহণ:</span>
                            <span className="text-xs font-semibold text-slate-200">
                              {asset.collections_count} বার
                            </span>
                          </div>
                        </div>

                        {/* Recovery Meter */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-400">মূলধন রিকভারি হার:</span>
                            <span className="text-cyan-400 font-mono">
                              {asset.recovery_percentage}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, asset.recovery_percentage)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                            <span>বাকি মূলধন: ৳ {asset.remaining_capital.toLocaleString()}</span>
                            <span className="text-slate-500 text-[10px]">
                              {asset.dividend_frequency === 'monthly' ? 'মাসিক' : asset.dividend_frequency === 'quarterly' ? 'ত্রৈমাসিক' : 'লাভ হলে বণ্টন'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for Company Share */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    {asset.status === "sold" ? (
                      <>
                        <div className="flex-1 py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <FaCheckCircle size={12} className="text-purple-400" />
                          <span>শেয়ার একজিট সম্পন্ন</span>
                        </div>
                        <button
                          onClick={() => handleOpenHistoryModal(asset)}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="লভ্যাংশ হিস্টোরি"
                        >
                          <FaHistory size={11} />
                          <span>হিস্টোরি</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenDividendModal(asset)}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <FaCoins size={12} />
                          <span>লভ্যাংশ গ্রহণ</span>
                        </button>

                        <button
                          onClick={() => handleOpenHistoryModal(asset)}
                          className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="লভ্যাংশ ও আয়ের হিস্টোরি"
                        >
                          <FaHistory size={11} />
                          <span>হিস্টোরি</span>
                        </button>

                        <button
                          onClick={() => handleOpenSellModal(asset)}
                          className="py-2 px-3 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-purple-100 border border-purple-500/30 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                          title="শেয়ার বিক্রি বা একজিট"
                        >
                          <FaTag size={11} />
                          <span>বিক্রি/একজিট</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // 📦 2. REGULAR ASSET CARD (Bike, Shop, House, Equipment, etc.)
            return (
              <div
                key={asset.id}
                className="bg-[#0f1b2d] border border-white/10 hover:border-orange-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#071025] border border-white/10 flex items-center justify-center shrink-0">
                        {categoryIcons[asset.category] || categoryIcons.other}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                          {asset.asset_name}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {categoryLabels[asset.category] || asset.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                        asset.status === "sold"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                          : hasAgreement
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      }`}
                    >
                      {asset.status === "sold"
                        ? "বিক্রিত (Sold)"
                        : hasAgreement
                        ? "ভাড়ায় চলছে (Rented)"
                        : "ইন স্টক (In Stock)"}
                    </span>
                  </div>

                  {/* Purchase & Cash Out Info */}
                  <div className="bg-[#071025]/70 border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block">ক্রয়মূল্য (Cash Out):</span>
                      <span className="font-bold text-red-400 font-mono text-sm">
                        ৳ {asset.purchase_price.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">ক্রয়ের তারিখ:</span>
                      <span className="text-slate-200 font-mono">
                        {asset.purchase_date}
                      </span>
                    </div>

                    {asset.vendor_info && (
                      <div className="col-span-2 pt-1 border-t border-white/5 text-[11px] text-slate-400">
                        সেলার/ভেন্ডর: <span className="text-slate-300">{asset.vendor_info}</span>
                      </div>
                    )}
                  </div>

                  {/* If Sold: Show Outright Sale Breakdown */}
                  {asset.status === "sold" ? (
                    <div className="bg-purple-950/30 border border-purple-500/25 rounded-xl p-3 text-xs mb-4 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
                        <span className="text-purple-300 font-bold flex items-center gap-1.5">
                          <FaTag size={11} className="text-purple-400" />
                          <span>এককালীন বিক্রয় সম্পন্ন</span>
                        </span>
                        <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700/50">
                          {asset.sale_date}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block">বিক্রয়মূল্য (Cash In):</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">
                            ৳ {Number(asset.selling_price || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">নিট প্রফিট পুল:</span>
                          <span className="font-bold text-cyan-300 font-mono text-sm">
                            +৳ {Number(asset.sale_profit || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-purple-500/20 text-[11px] text-slate-300 flex items-center justify-between">
                        <span>ক্রেতা: <strong className="text-white">{asset.buyer_name || "N/A"}</strong></span>
                        {asset.buyer_mobile && (
                          <span className="font-mono text-slate-400">{asset.buyer_mobile}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Agreement / Lessee Details */}
                      <div className="bg-[#071025]/40 border border-white/5 rounded-xl p-3 text-xs mb-4">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                          <span>বর্তমান চুক্তি ও গ্রহীতা</span>
                          {hasAgreement && (
                            <span className="text-orange-400 capitalize">
                              {asset.agreement_type === "hire_purchase"
                                ? "হায়ার পারচেজ"
                                : "ভাড়া/লিজ"}
                            </span>
                          )}
                        </span>

                        {hasAgreement ? (
                          <div className="space-y-1">
                            <p className="text-white font-bold flex items-center gap-1.5">
                              <FaUser size={11} className="text-orange-400" />
                              <span>{asset.lessee_name}</span>
                            </p>
                            <p className="text-slate-400 font-mono flex items-center gap-1.5">
                              <FaPhoneAlt size={10} className="text-slate-500" />
                              <span>{asset.lessee_mobile}</span>
                            </p>
                            <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-2">
                              <span className="text-slate-400">মাসিক প্রদেয়:</span>
                              <span className="font-bold text-emerald-400 font-mono text-sm">
                                ৳ {asset.monthly_rent.toLocaleString()} / মাস
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              প্রদেয় তারিখ: প্রতি মাসের {asset.due_day} তারিখ
                            </p>
                          </div>
                        ) : (
                          <div className="py-2 text-center">
                            <p className="text-cyan-400 text-xs font-medium mb-1">
                              📦 কোনো ভাড়া চুক্তি নেই (অফিস স্টকে আছে)
                            </p>
                            <p className="text-[11px] text-slate-500">
                              আপনি চাইলে এটি কাউকে ভাড়া দিতে পারেন অথবা একবারে বিক্রি করতে পারেন।
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Capital Recovery & ROI Meter */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">মূলধন রিকভারি:</span>
                          <span className="text-orange-400 font-mono">
                            {asset.recovery_percentage}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${asset.recovery_percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>আদায়: ৳ {asset.total_collected.toLocaleString()}</span>
                          <span>বাকি: ৳ {asset.remaining_capital.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  {asset.status === "sold" ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <FaCheckCircle size={12} className="text-purple-400" />
                      <span>এককালীন বিক্রয় সম্পন্ন (মালিকানা হস্তান্তর)</span>
                    </div>
                  ) : hasAgreement ? (
                    <>
                      <button
                        onClick={() => handleOpenAgreementModal(asset)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span>চুক্তি পরিবর্তন</span>
                      </button>

                      <button
                        onClick={() => handleOpenTerminateModal(asset)}
                        className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="ভাড়া না দিলে চুক্তি বাতিল করে সম্পদ অফিসে ফেরত নিন (Repossess)"
                      >
                        <FaUndoAlt size={11} className="text-red-400" />
                        <span>ফেরত নিন</span>
                      </button>

                      <button
                        onClick={() => navigate("/other-sources/collections")}
                        className="py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="চলতি মাসের কালেকশন দেখুন"
                      >
                        <FaReceipt size={12} />
                        <span>কালেকশন</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenAgreementModal(asset)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <FaHandshake size={12} />
                        <span>ভাড়া দিন (চুক্তি)</span>
                      </button>

                      <button
                        onClick={() => handleOpenSellModal(asset)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <FaTag size={11} />
                        <span>একবারে বিক্রি (Sell)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================================= */}
      {/* ➕ ADD ASSET MODAL (Cash Out Entry)                                      */}
      {/* ======================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-white/15 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <FaPlus size={14} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {newAsset.category === "company_share"
                      ? "কোম্পানি শেয়ার / ইকুইটি বিনিয়োগ এন্ট্রি"
                      : "নতুন অ্যাসেট ক্রয় এন্ট্রি"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {newAsset.category === "company_share"
                      ? "অন্যান্য কোম্পানিতে শেয়ার ক্রয় বাবদ মূলধন বিনিয়োগ (ক্যাশ আউট) ও রেকর্ড"
                      : "প্রোডাক্ট কেনা বাবদ খরচ (ক্যাশ আউট) ও রেকর্ড"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  অ্যাসেট / বিনিয়োগের ধরন (ক্যাটাগরি) *
                </label>
                <select
                  value={newAsset.category}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, category: e.target.value })
                  }
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-medium"
                >
                  {Object.keys(categoryLabels).map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {newAsset.category === "company_share" ? (
                /* 🏢 COMPANY SHARE FIELDS */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-slate-300 font-semibold mb-1 block">
                        কোম্পানি / ব্যবসার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: গ্রীন এগ্রো ফার্মস লিমিটেড বা প্রাইম আইটি সলিউশন"
                        value={newAsset.asset_name}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, asset_name: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-cyan-500/30 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        ব্যবসার ধরন / খাত
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: ডেইরি ও কৃষি / আইটি / রেস্টুরেন্ট"
                        value={newAsset.business_type}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, business_type: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        রেজি নং / ট্রেড লাইসেন্স
                      </label>
                      <input
                        type="text"
                        placeholder="C-184920 বা TRAD/DNCC/12345"
                        value={newAsset.reg_no}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, reg_no: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        মোট বিনিয়োগকৃত টাকা *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="যেমন: ৩,০০,০০০"
                        value={newAsset.purchase_price}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, purchase_price: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-red-500/30 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-red-400 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        বিনিয়োগের তারিখ *
                      </label>
                      <input
                        type="date"
                        required
                        value={newAsset.purchase_date}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, purchase_date: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        মালিকানার হার (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="১৫.০০"
                        value={newAsset.share_percentage}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, share_percentage: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        শেয়ার সংখ্যা (টি)
                      </label>
                      <input
                        type="number"
                        placeholder="৩,০০০"
                        value={newAsset.share_units}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, share_units: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        লভ্যাংশ নিয়ম
                      </label>
                      <select
                        value={newAsset.dividend_frequency}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, dividend_frequency: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      >
                        <option value="on_demand">অন-ডিমান্ড (লাভ হলে)</option>
                        <option value="monthly">মাসিক (Monthly)</option>
                        <option value="quarterly">ত্রৈমাসিক (Quarterly)</option>
                        <option value="yearly">বাৎসরিক (Yearly)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        পরিচালক / যোগাযোগের ব্যক্তি
                      </label>
                      <input
                        type="text"
                        placeholder="কামাল হোসেন (এমডি, ০১৭১১-XXXXXX)"
                        value={newAsset.contact_person}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, contact_person: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        হেড অফিস / ঠিকানা
                      </label>
                      <input
                        type="text"
                        placeholder="গুলশান-১, ঢাকা"
                        value={newAsset.vendor_info}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, vendor_info: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      বিনিয়োগ চুক্তি ও শর্তাবলী
                    </label>
                    <textarea
                      rows="2"
                      placeholder="বিনিয়োগ চুক্তিপত্রের নম্বর, মুনাফা বণ্টন বা একজিট শর্তাবলী..."
                      value={newAsset.remarks}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, remarks: e.target.value })
                      }
                      className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 resize-none"
                    />
                  </div>
                </>
              ) : (
                /* 📦 REGULAR ASSET FIELDS */
                <>
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      অ্যাসেটের নাম *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: বাজাজ পালসার ১৫০ (লিজ-০১) বা দোকান অ্যাডভান্স"
                      value={newAsset.asset_name}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, asset_name: e.target.value })
                      }
                      className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        ক্রয়মূল্য (টাকা) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="১,২০,০০০"
                        value={newAsset.purchase_price}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, purchase_price: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">
                        কেনার তারিখ
                      </label>
                      <input
                        type="date"
                        required
                        value={newAsset.purchase_date}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, purchase_date: e.target.value })
                        }
                        className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      সেলার / শোরুমের নাম ও ঠিকানা
                    </label>
                    <input
                      type="text"
                      placeholder="উত্তরা মোটরস / বিক্রেতার নাম"
                      value={newAsset.vendor_info}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, vendor_info: e.target.value })
                      }
                      className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      মন্তব্য / বিবরণ
                    </label>
                    <textarea
                      rows="2"
                      placeholder="রেজিস্ট্রেশন নম্বর, শর্ত বা অন্যান্য বিবরণ..."
                      value={newAsset.remarks}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, remarks: e.target.value })
                      }
                      className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* Automatic Cash Out Checkbox */}
              <div className="bg-[#071025] border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="create_cash_out"
                  checked={newAsset.create_cash_out}
                  onChange={(e) =>
                    setNewAsset({
                      ...newAsset,
                      create_cash_out: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="create_cash_out"
                  className="text-xs text-slate-300 cursor-pointer"
                >
                  <span className="font-bold text-red-400 block">
                    স্বয়ংক্রিয় Cash Out রেকর্ড করুন
                  </span>
                  {newAsset.category === "company_share"
                    ? 'ক্যাশ ম্যানেজমেন্টে এটি সরাসরি "কোম্পানি শেয়ারে বিনিয়োগ" হিসেবে টাকা আউট হয়ে যাবে।'
                    : 'ক্যাশ ম্যানেজমেন্টে এটি সরাসরি "অ্যাসেট ক্রয়" হিসেবে টাকা আউট হয়ে যাবে।'}
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingAsset}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingAsset ? "সংরক্ষণ হচ্ছে..." : "অ্যাসেট সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 📋 ASSIGN AGREEMENT MODAL                                                */}
      {/* ======================================================================= */}
      {showAgreementModal && selectedAssetForAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-white/15 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  লিজ / ভাড়া চুক্তি তৈরি
                </h3>
                <p className="text-xs text-orange-400">
                  অ্যাসেট: {selectedAssetForAgreement.asset_name}
                </p>
              </div>

              <button
                onClick={() => setShowAgreementModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleAgreementSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    গ্রহীতা / ভাড়াটিয়ার নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="করিম মিয়া"
                    value={newAgreement.lessee_name}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        lessee_name: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={newAgreement.lessee_mobile}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        lessee_mobile: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    চুক্তির ধরন
                  </label>
                  <select
                    value={newAgreement.agreement_type}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        agreement_type: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  >
                    <option value="rental">পিওর ভাড়া (Rental)</option>
                    <option value="hire_purchase">হায়ার পারচেজ (Hire Purchase)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    মাসিক ভাড়ার পরিমাণ (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="৮,০০০"
                    value={newAgreement.monthly_rent}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        monthly_rent: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    প্রদেয় তারিখ (Due Day)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newAgreement.due_day}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        due_day: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={newAgreement.start_date}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    জামানত (Deposit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={newAgreement.security_deposit}
                    onChange={(e) =>
                      setNewAgreement({
                        ...newAgreement,
                        security_deposit: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  গ্রহীতার ঠিকানা ও এনআইডি
                </label>
                <input
                  type="text"
                  placeholder="NID নম্বর এবং স্থায়ী ঠিকানা..."
                  value={newAgreement.lessee_address}
                  onChange={(e) =>
                    setNewAgreement({
                      ...newAgreement,
                      lessee_address: e.target.value,
                    })
                  }
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingAgreement}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingAgreement ? "সংরক্ষণ হচ্ছে..." : "চুক্তি সম্পন্ন করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================================= */}
      {/* 🏷️ SELL ASSET MODAL (Outright Sale with Real-Time Profit Calculation)    */}
      {/* ======================================================================= */}
      {showSellModal && selectedAssetForSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-purple-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                  <FaTag size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">এককালীন বিক্রয় (Outright Sale)</h3>
                  <p className="text-xs text-purple-300">
                    মালিকানা স্থায়ীভাবে হস্তান্তর ও নিট মুনাফা আদার্স প্রফিট পুলে বণ্টন
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSellModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSellSubmit} className="space-y-4 text-xs">
              {/* Asset & Price Summary */}
              <div className="bg-[#071025] border border-white/10 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">সম্পদ / অ্যাসেট:</span>
                  <span className="font-bold text-white text-sm">{selectedAssetForSell.asset_name}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">মূল ক্রয়মূল্য (Original Cost):</span>
                  <span className="font-bold text-red-400 font-mono text-sm">
                    ৳ {selectedAssetForSell.purchase_price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Selling Price & Profit Calculation */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  বিক্রয়মূল্য (টাকা) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="যেমন: ১,১৫,০০০"
                  value={sellForm.selling_price}
                  onChange={(e) => setSellForm({ ...sellForm, selling_price: e.target.value })}
                  className="w-full bg-[#071025] border border-purple-500/40 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-base outline-none focus:border-purple-400"
                />

                {Number(sellForm.selling_price) > 0 && (
                  <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">নিট মুনাফা (Net Profit):</span>
                      <span className="text-slate-300 text-[10px]">
                        বিক্রয় ৳{Number(sellForm.selling_price).toLocaleString()} - ক্রয় ৳{selectedAssetForSell.purchase_price.toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`text-base font-extrabold font-mono ${
                        Number(sellForm.selling_price) - selectedAssetForSell.purchase_price >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {Number(sellForm.selling_price) - selectedAssetForSell.purchase_price >= 0 ? "+" : ""}
                      ৳ {(Number(sellForm.selling_price) - selectedAssetForSell.purchase_price).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">বিক্রয়ের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={sellForm.sale_date}
                    onChange={(e) => setSellForm({ ...sellForm, sale_date: e.target.value })}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">পেমেন্ট মাধ্যম</label>
                  <select
                    value={sellForm.payment_method}
                    onChange={(e) => setSellForm({ ...sellForm, payment_method: e.target.value })}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-400"
                  >
                    <option value="Cash">ক্যাশ (Cash)</option>
                    <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                  </select>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ক্রেতার নাম</label>
                  <input
                    type="text"
                    placeholder="নাম..."
                    value={sellForm.buyer_name}
                    onChange={(e) => setSellForm({ ...sellForm, buyer_name: e.target.value })}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ক্রেতার মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={sellForm.buyer_mobile}
                    onChange={(e) => setSellForm({ ...sellForm, buyer_mobile: e.target.value })}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              {/* Cash In Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer bg-[#071025] p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={sellForm.create_cash_in}
                  onChange={(e) => setSellForm({ ...sellForm, create_cash_in: e.target.checked })}
                  className="rounded text-purple-500 focus:ring-purple-400"
                />
                <span className="text-slate-300 text-xs">
                  সম্পূর্ণ বিক্রয়মূল্য অফিসে Cash In হিসেবে জমা করুন
                </span>
              </label>

              {/* Remarks */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">মন্তব্য / নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="বিক্রয় সংক্রান্ত বিবরণ..."
                  value={sellForm.remarks}
                  onChange={(e) => setSellForm({ ...sellForm, remarks: e.target.value })}
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-purple-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingSell}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-900/30"
                >
                  {submittingSell ? "বিক্রয় সম্পন্ন হচ্ছে..." : "বিক্রয় নিশ্চিত করুন (Complete Sale)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🔄 REPOSSESS / TERMINATE MODAL (ভাড়া না দিলে সম্পদ অফিসে ফেরত নিন)      */}
      {/* ======================================================================= */}
      {showTerminateModal && selectedAssetForTerminate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <FaUndoAlt size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">সম্পদ ফেরত গ্রহণ (Repossess)</h3>
                  <p className="text-xs text-red-300">
                    ভাড়া না দিলে চুক্তি বাতিল করে সম্পদ অফিসে ফেরত নিন
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTerminateModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleTerminateSubmit} className="space-y-4 text-xs">
              <div className="bg-[#071025] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">অ্যাসেট:</span>
                  <span className="font-bold text-white text-sm">{selectedAssetForTerminate.asset_name}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">বর্তমান গ্রহীতা:</span>
                  <span className="text-white font-medium">
                    {selectedAssetForTerminate.lessee_name} ({selectedAssetForTerminate.lessee_mobile})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">মাসিক ভাড়া:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ৳ {selectedAssetForTerminate.monthly_rent.toLocaleString()} / মাস
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">ফেরত নেওয়ার তারিখ</label>
                <input
                  type="date"
                  required
                  value={terminateForm.end_date}
                  onChange={(e) => setTerminateForm({ ...terminateForm, end_date: e.target.value })}
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-red-400 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">ফেরত নেওয়ার কারণ *</label>
                <textarea
                  required
                  rows={2}
                  value={terminateForm.reason}
                  onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-red-400 resize-none"
                />
              </div>

              <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200">
                💡 <strong>নোট:</strong> চুক্তি বাতিল করার সাথে সাথে সম্পদটি আবার <strong>In Stock</strong> অবস্থায় ফিরে আসবে। এরপর আপনি চাইলে এটি অন্য কাউকে ভাড়া দিতে পারবেন অথবা একবারে বিক্রি করতে পারবেন।
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTerminateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingTerminate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold cursor-pointer disabled:opacity-50 shadow-lg shadow-red-950/40"
                >
                  {submittingTerminate ? "ফেরত নেওয়া হচ্ছে..." : "ফেরত নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 💰 COLLECT DIVIDEND MODAL (Company Share Variable Profit)                */}
      {/* ======================================================================= */}
      {showDividendModal && selectedAssetForDividend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-emerald-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                  <FaCoins size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">কোম্পানি শেয়ার লভ্যাংশ গ্রহণ</h3>
                  <p className="text-xs text-emerald-400">
                    {selectedAssetForDividend.asset_name}{" "}
                    {selectedAssetForDividend.share_percentage
                      ? `(${selectedAssetForDividend.share_percentage}%)`
                      : ""}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDividendModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleDividendSubmit} className="space-y-4 text-xs">
              <div className="bg-[#071025] border border-white/10 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">বিনিয়োগকৃত মূলধন:</span>
                  <span className="font-bold text-red-400 font-mono">
                    ৳ {selectedAssetForDividend.purchase_price.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">এখন পর্যন্ত প্রাপ্ত মোট লভ্যাংশ:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ৳ {selectedAssetForDividend.total_collected.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-200">
                💡 <strong>ভেরিয়েবল প্রফিট:</strong> কোম্পানি শেয়ারের লভ্যাংশ প্রতি মাসে একই হয় না। লাভ অনুযায়ী এই সময়ে যে পরিমাণ টাকা লভ্যাংশ হিসেবে পেয়েছেন, তা নিচে এন্ট্রি করুন। এটি ক্যাশ-ইন হবে এবং সরাসরি আদার্স প্রফিট পুলে বণ্টনযোগ্য হবে।
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  প্রাপ্ত লভ্যাংশের পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="যেমন: ২৫,০০০"
                  value={dividendForm.amount}
                  onChange={(e) =>
                    setDividendForm({ ...dividendForm, amount: e.target.value })
                  }
                  className="w-full bg-[#071025] border border-emerald-500/40 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-base outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    কোন মাসের/সময়ের লভ্যাংশ
                  </label>
                  <input
                    type="month"
                    required
                    value={dividendForm.billing_month}
                    onChange={(e) =>
                      setDividendForm({
                        ...dividendForm,
                        billing_month: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    টাকা গ্রহণের তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={dividendForm.collection_date}
                    onChange={(e) =>
                      setDividendForm({
                        ...dividendForm,
                        collection_date: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  পেমেন্ট মেথড
                </label>
                <select
                  value={dividendForm.payment_method}
                  onChange={(e) =>
                    setDividendForm({
                      ...dividendForm,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                >
                  <option value="Bank Transfer">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                  <option value="Cheque">চেক (Cheque)</option>
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  বিবরণ / ভাউচার নোট
                </label>
                <input
                  type="text"
                  placeholder="যেমন: কিউ-৩ অন্তর্বর্তীকালীন লভ্যাংশ বণ্টন..."
                  value={dividendForm.remarks}
                  onChange={(e) =>
                    setDividendForm({ ...dividendForm, remarks: e.target.value })
                  }
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-[#071025] p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={dividendForm.create_cash_in}
                  onChange={(e) =>
                    setDividendForm({
                      ...dividendForm,
                      create_cash_in: e.target.checked,
                    })
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-400"
                />
                <span className="text-slate-300 text-xs">
                  স্বয়ংক্রিয় Cash In হিসেবে ক্যাশ ম্যানেজমেন্টে যুক্ত করুন
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDividendModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingDividend}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-900/30"
                >
                  {submittingDividend ? "সংরক্ষণ হচ্ছে..." : "লভ্যাংশ গ্রহণ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 📜 ASSET / DIVIDEND HISTORY MODAL                                       */}
      {/* ======================================================================= */}
      {showHistoryModal && selectedAssetForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-white/15 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
                  <FaHistory size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedAssetForHistory.category === "company_share"
                      ? "লভ্যাংশ ও আয় হিস্টোরি"
                      : "কালেকশন হিস্টোরি"}
                  </h3>
                  <p className="text-xs text-orange-400">
                    {selectedAssetForHistory.asset_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-16 flex justify-center">
                <Loader />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Box */}
                {historyData?.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#071025] p-3 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="text-slate-400 block">মোট মূলধন/বিনিয়োগ:</span>
                      <span className="font-bold text-red-400 font-mono text-sm">
                        ৳ {historyData.summary.total_investment.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">মোট আদায়/লভ্যাংশ:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        ৳ {historyData.summary.total_collected.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">অবশিষ্ট মূলধন:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">
                        ৳ {historyData.summary.remaining_capital.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">রিকভারি হার (ROI):</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">
                        {historyData.summary.roi_pct}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Collections Table */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#071025] text-slate-400 uppercase tracking-wider border-b border-white/10 sticky top-0">
                          <th className="py-2.5 px-3">তারিখ</th>
                          <th className="py-2.5 px-3">মাস / পিরিয়ড</th>
                          <th className="py-2.5 px-3 text-right">পরিমাণ (টাকা)</th>
                          <th className="py-2.5 px-3">পদ্ধতি</th>
                          <th className="py-2.5 px-3">বিবরণ / নোট</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {historyData?.collections?.length > 0 ? (
                          historyData.collections.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="py-2 px-3 font-mono text-slate-300">
                                {item.collection_date}
                              </td>
                              <td className="py-2 px-3 font-mono text-cyan-400">
                                {item.billing_month}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                ৳ {item.amount.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-slate-300">
                                {item.payment_method}
                              </td>
                              <td className="py-2 px-3 text-slate-400">
                                {item.remarks || "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="py-8 text-center text-slate-500"
                            >
                              এখনো কোনো আদায় বা লভ্যাংশ রেকর্ড নেই
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherSourcesAssets;
