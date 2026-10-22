import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaGoogleDrive,
} from "react-icons/fa";
import { MdOutlineAttachMoney } from "react-icons/md";
import { AiOutlineCreditCard } from "react-icons/ai";
import CashCard from "../../../components/cash/CashCard";
import CashButton from "../../../components/cash/CashButton";
import CashOutModal from "../../../components/cash/CashOutModal";
import CashInModal from "../../../components/cash/CashInModal";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { Link } from "react-router-dom";

const CashManage = () => {
  const [openIn, setOpenIn] = useState(false);
  const [openOut, setOpenOut] = useState(false);
  const [luxuryToast, setLuxuryToast] = useState(null);
  const [isDriveSaving, setIsDriveSaving] = useState(false);
  const [data, setData] = useState({
    todayIn: 0,
    todayOut: 0,
    net: 0,
    totalCash: 0,
  });

  const loadData = () => {
    fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/cash/dashboard_today.php`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveToDrive = async () => {
    try {
      setIsDriveSaving(true);
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/save_daily_report_drive.php`
      );

      if (res.data?.success) {
        setLuxuryToast({
          title: "গুগল ড্রাইভে সংরক্ষিত! 📁",
          message: `আজকের দৈনিক রিপোর্টটি সফলভাবে Google Drive-এ সেভ হয়েছে (${res.data.file_name})।`,
          tag: "Google Drive Sync",
          amount: data?.todayNet,
          type: "success",
        });
      } else {
        setLuxuryToast({
          title: "ড্রাইভ আপলোড ব্যর্থ! ⚠",
          message:
            res.data?.error ||
            "ড্রাইভে সেভ করা যায়নি। অনুগ্রহ করে ফোল্ডার পারমিশন চেক করুন।",
          tag: "Drive Error",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "ড্রাইভ আপলোড ব্যর্থ! ⚠",
        message:
          err.response?.data?.error ||
          err.message ||
          "ড্রাইভে ফাইল সেভ করতে সমস্যা হয়েছে।",
        tag: "Drive Error",
        type: "error",
      });
    } finally {
      setIsDriveSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[#0B1120] min-h-screen">
      {/* Top Header & Save to Drive Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            ক্যাশ ড্যাশবোর্ড ও রিপোর্ট
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            আজকের সার্বিক আয়-ব্যয় এবং রিয়েল-টাইম ক্যাশ ব্যালেন্স সারাংশ
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveToDrive}
          disabled={isDriveSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-900/30 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-center"
        >
          {isDriveSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Google Drive-এ আপলোড হচ্ছে...</span>
            </>
          ) : (
            <>
              <FaGoogleDrive className="text-base text-emerald-200" />
              <span>Google Drive-এ আজকের রিপোর্ট সেভ করুন</span>
            </>
          )}
        </button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <CashCard
          title="আজকের জমা"
          subtitle={"আজকের সারাংশ"}
          value={`৳ ${data.todayDeposit}`}
          icon={FaMoneyBillWave}
          accent="text-green-400"
        />
        <CashCard
          title="আজকের খরচ"
          subtitle={"আজকের সারাংশ"}
          value={`৳ ${data.todayWithdraw}`}
          icon={AiOutlineCreditCard}
          accent="text-red-400"
        />
        <CashCard
          title="নেট ব্যালেন্স"
          subtitle={"আজকের সারাংশ"}
          value={`৳ ${data?.todayNet}`}
          icon={FaChartLine}
          accent="text-blue-400"
        />
        <CashCard
          title="মোট ক্যাশ"
          subtitle={"আজকের সারাংশ"}
          value={`৳ ${data.handCash}`}
          icon={FaWallet}
          accent="text-orange-400"
        />
      </div>

      {/* Buttons */}
      <div className="grid md:grid-cols-2 gap-5 mt-6">
        <CashButton
          text="ক্যাশ ইন"
          icon={MdOutlineAttachMoney}
          accent="text-green-400"
          onClick={() => setOpenIn(true)}
        />
        <CashButton
          text="ক্যাশ আউট"
          icon={AiOutlineCreditCard}
          accent="text-red-400"
          onClick={() => setOpenOut(true)}
        />
        <CashButton
          link={"../cash/daily_reports"}
          text="দৈনিক রিপোর্ট"
          icon={FaCalendarAlt}
          accent="text-blue-400"
        />
        <CashButton
          link={"../cash/monthly_reports"}
          text="মাসিক রিপোর্ট"
          icon={FaCalendarAlt}
          accent="text-indigo-400"
        />
      </div>

      {/* Yearly */}
      <div className="mt-6">
        <Link
          to={"/cash/yearly_reports"}
          className="w-full p-4 rounded-xl bg-[#111827] border border-white/10 text-white hover:bg-[#1f2937] flex items-center justify-center gap-2 transition"
        >
          <FaChartLine className="text-purple-400" />
          বার্ষিক রিপোর্ট
        </Link>
      </div>

      {/* Modals */}
      <CashInModal
        isOpen={openIn}
        onClose={() => setOpenIn(false)}
        onSuccess={(toastPayload) => {
          loadData();
          if (toastPayload) setLuxuryToast(toastPayload);
        }}
      />
      <CashOutModal
        isOpen={openOut}
        onClose={() => setOpenOut(false)}
        onSuccess={(toastPayload) => {
          loadData();
          if (toastPayload) setLuxuryToast(toastPayload);
        }}
      />

      <LuxuryToast
        toast={luxuryToast}
        onClose={() => setLuxuryToast(null)}
        duration={4500}
      />
    </div>
  );
};

export default CashManage;
