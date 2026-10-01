import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin,  LayoutGrid, UserCheck, Search, ThumbsUp, CreditCard, History, FileText, LogOut, User, Settings, HelpCircle, Star } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../utlis/Hooks/useAuth";
import CollectionsDashboard from "../AccountPages/CollectionsDashboard";
import Account from "../AccountPages/Account";
import Billing from "../AccountPages/Billing";
import PaymentHistory from "../AccountPages/PaymentHistory";
import LicensesHistory from "../AccountPages/LicensesHistory";
import useUserSubscription from "../../utlis/Hooks/useUserSubscription";
import useUserDownloads from "../../utlis/Hooks/useUserDownloads";
import useDownloadLimit from "../../utlis/Hooks/useDownloadLimit";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SettingsPage from "../AccountPages/Settings";
import SupportDashboard from "../AccountPages/SupportDashboard";
import ExclusiveAssets from "../AccountPages/ExclusiveAssets";

const AccountPage = () => {
  const { user, loading, logOut } = useAuth();
  const { data: userSUbscriptionData, isLoading: subLoading } = useUserSubscription();
  const { data: downloadsData, isLoading: downloadsLoading } = useUserDownloads();
  const { data: limitData, isLoading: limitLoading } = useDownloadLimit();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "account";
  
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "account" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const [userData, setUserData] = useState(null);
  const subscription = userSUbscriptionData?.subscription;
  const billingHistory = userSUbscriptionData?.billing_history || [];
  const downloadsHistory = downloadsData || [];
  console.log(billingHistory)
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('dayalstock_token');
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/users/get_user_details_by_email.php`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-api-key": import.meta.env.VITE_APP_SECRET
          }
        });
        const data = await res.json();

        if (data.success && data.data) {
          setUserData(data.data);
        } else if (user) {
          setUserData(user);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (user) {
          setUserData(user);
        }
      }
    };
    fetchUserData();
  }, [user]);


  const avatarUrl = userData?.photo
    ? (userData.photo.startsWith('http') ? userData.photo : `${import.meta.env.VITE_IMG_KEY}/${userData.photo}`)
    : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  const generateInvoicePDF = (invoice) => {
    const doc = new jsPDF();
    
    // Add Company Logo/Name
    doc.setFontSize(22);
    doc.setTextColor(0, 212, 255); // #00D4FF
    doc.text("PikSea", 14, 20);
    
    // Add Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("INVOICE", 14, 30);
    
    // Add Invoice Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice ID: #${invoice.transaction_id}`, 14, 40);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 14, 45);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 50);
    
    // Add User Details
    doc.text("Billed To:", 14, 60);
    doc.setTextColor(40, 40, 40);
    doc.text(userData?.name || "Customer", 14, 65);
    doc.text(userData?.email || "", 14, 70);
    
    // Add Table for Items
    autoTable(doc, {
      startY: 80,
      head: [['Description', 'Payment Method', 'Amount']],
      body: [
        [`${invoice.plan_name} Plan`, invoice.payment_method.replace('_', ' ').toUpperCase(), `$${invoice.amount} ${invoice.currency}`],
      ],
      headStyles: { fillColor: [0, 212, 255] },
      theme: 'striped',
    });
    
    // Add Total
    const finalY = doc.lastAutoTable.finalY || 80;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Paid: $${invoice.amount} ${invoice.currency}`, 14, finalY + 10);
    
    // Save PDF
    doc.save(`invoice_${invoice.transaction_id}.pdf`);
  };


  const tabs = [
    { id: "collections", label: "Collections", icon: LayoutGrid },
    // { id: "recommendations", label: "Recommendations", icon: ThumbsUp },
    { id: "account", label: "Account", icon: User },
    { id: "billing", label: "Plan & Billing", icon: CreditCard },
    { id: "payment", label: "Payment History", icon: History },
    { id: "licenses", label: "License History", icon: FileText },
    { id: "exclusive", label: "Exclusive Assets", icon: Star },
    { id: "support", label: "Support Tickets", icon: HelpCircle },
    // { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors pt-24 pb-12">
      <div className="mx-auto px-5 lg:px-10">

        <div className="flex items-center gap-6 md:gap-8 mb-12">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shrink-0 shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <img
              src={avatarUrl}
              alt={userData?.name || "User"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-outfit">
                {userData?.name || user?.name || user?.displayName || "Member"}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-sm font-medium">
              <MapPin size={16} className="text-[#00D4FF]" />
              <span>{userData?.country && userData.country !== 'NULL' ? userData.country : (userData?.email || user?.email || 'Active Member')}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-semibold text-[15px] transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? "border-[#0088b3] dark:border-[#00D4FF] text-[#0088b3] dark:text-[#00D4FF]"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="py-8">
          {activeTab === "collections" && (
            <CollectionsDashboard />
          )}
          {activeTab === 'account' && (
            <Account userData={userData} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'billing' && (
            <Billing subLoading={subLoading} subscription={subscription} limitData={limitData} limitLoading={limitLoading} />
          )}

          {activeTab === 'payment' && (
            <PaymentHistory billingHistory={billingHistory} generateInvoicePDF={generateInvoicePDF} />
          )}

          {activeTab === 'licenses' && (
            <LicensesHistory downloadsHistory={downloadsHistory} downloadsLoading={downloadsLoading} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}

          { activeTab === 'support' && (
            <SupportDashboard />
          )}

          {activeTab === 'exclusive' && (
            <ExclusiveAssets />
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountPage;