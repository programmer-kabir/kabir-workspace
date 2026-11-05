import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import {
  FaBuilding,
  FaUser,
  FaUserPlus,
  FaBoxOpen,
  FaCartShopping,
  FaCashRegister,
} from "react-icons/fa6";
import { FaTasks, FaHistory } from "react-icons/fa";

import {
  TbUsers,
  TbFilePlus,
  TbShoppingCartPlus,
  TbCashBanknote,
  TbClipboardList,
  TbWallet,
  TbShoppingCart,
  TbChartBar,
  TbReport,
  TbClock,
  TbFiles,
  TbFileUpload,
  TbShieldCheck,
  TbClipboardCheck,
  TbReceipt,
  TbCalendarTime,
  TbCoins,
  TbBook2,
  TbServer,
} from "react-icons/tb";

import { RiBankCardLine, RiBankCard2Line, RiMailSendLine } from "react-icons/ri";
import { MdDeveloperMode, MdInventory, MdOutlineDashboard, MdOutlineInventory2, MdPayments, MdProductionQuantityLimits, MdShowChart } from "react-icons/md";
import { GiReceiveMoney, GiPayMoney } from "react-icons/gi";
import { IoStatsChart } from "react-icons/io5";
import { BsBank, BsGraphUpArrow, BsClipboardData, BsCashStack } from "react-icons/bs";
import { AiFillCloseCircle, AiOutlineUserAdd } from "react-icons/ai";
import { FiFile, FiUser } from "react-icons/fi";

export const sidebarMenu = [
  // DASHBOARD
  {
    label: "Dashboard",
    path: "/",
    icon: MdOutlineDashboard,
    roles: ["admin", "developer", "manager", "staff", "data_entry"],
  },
  // SUPPLYLINK REPORTS (PDF ARCHIVE)
  {
    label: "SupplyLink Reports",
    path: "/supplylink-reports",
    icon: TbReport,
    roles: ["admin", "developer", "manager", "staff", "audit", "data_entry"],
  },
  // REQUESTS & APPROVALS
  {
    label: "Requests & Approvals",
    path: "/approval-center",
    icon: TbClipboardList,
    roles: ["admin", "developer", "manager", "staff", "data_entry"],
  },

  {
    type: "collapse",
    label: "Cash Management",
    icon: BsCashStack,
    roles: ["admin", "developer", "manager", "staff", "data_entry"],
    children: [
      {
        label: "Cash In",
        path: "/cash/cash_in",
        icon: GiReceiveMoney,
        roles: ["admin", "developer", "manager", "staff", "data_entry"]
    },
      {
        label: "Cash Out",
        path: "/cash/cash_out",
        icon: GiPayMoney,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "রিপোর্ট",
        path: "/cash/cash_reports",
        icon: TbReport,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "রিপোর্ট প্রিন্ট",
        path: "/cash/cash_reports_print",
        icon: TbReport,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "অনুদান অনুমোদন",
        path: "/cash/cash-report-approval",
        icon: TbCashBanknote,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "ব্যাংক জমা ও রিকনসিলিয়েশন",
        path: "/cash/bank-reconciliation",
        icon: BsBank,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "ক্যাশ ঘাটতি ও রিকভারি",
        path: "/cash/gap-tracker",
        icon: FaHistory,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
    ],
  },

  {
    type: "collapse",
    label: "Users",
    icon: TbUsers,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "All Users",
        path: "/all_users",
        icon: FaUser,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Add User",
        path: "/add_user",
        icon: AiOutlineUserAdd,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Add Roles",
        path: "/add_roles",
        icon: FaUserPlus,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Assign Guarantor",
        path: "/customers/customer_guarantor_assign",
        icon: HiOutlineUserGroup,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // CUSTOMERS
  {
    type: "collapse",
    label: "Customers",
    icon: HiOutlineUserGroup,
    roles: ["admin", "developer", "manager", "staff", "data_entry"],
    children: [
      {
        label: "Customer List",
        path: "/customers/all_customer",
        icon: FaUser,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Installment Cards",
        path: "/customers/installment_cards",
        icon: RiBankCardLine,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Create Installment Cards",
        path: "/customers/create_installment_cards",
        icon: RiBankCard2Line,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Installment Analytics",
        path: "/customers/monthly_installment_overviews",
        icon: MdShowChart,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Installment Analytics Test",
        path: "/customers/monthly_installment_overviews_test",
        icon: MdShowChart,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },

      {
        label: "Monthly Installment Reports",
        path: "/customers/monthly_installment_reports",
        icon: TbChartBar,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Monthly Installment Print",
        path: "/customers/monthly_installment_overview",
        icon: TbChartBar,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
    ],
  },
  {
    type: "collapse",
    label: "Regular Installments",
    icon: HiOutlineUserGroup,
    roles: ["admin", "developer", "manager", "staff", "data_entry"],
    children: [
      {
        label: "Regular Installment  List",
        path: "/DailyInstallments/daily_installments_users",
        icon: TbUsers,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Collection Report",
        path: "/DailyInstallments/daily_installments_reports",
        icon: TbClipboardList,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Full Paid Report",
        path: "/DailyInstallments/daily_installments_PaidReport",
        icon: TbCashBanknote,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Daily Installments Reports Print",
        path: "/DailyInstallments/daily_installments_report_print",
        icon: FiFile,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
    ],
  },

  // INVESTORS
  {
    type: "collapse",
    label: "Investors",
    icon: GiReceiveMoney,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Investor List",
        path: "/investors/all_investors",
        icon: TbUsers,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Investment Cards",
        path: "/investors/investment_cards",
        icon: RiBankCardLine,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Create Investment Cards",
        path: "/investor/create_investment_card",
        icon: RiBankCard2Line,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Daily Investment Summary",
        path: "/investors/daily_investment_reports",
        icon: TbChartBar,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Monthly Investment Summary",
        path: "/investors/monthly_investment_reports",
        icon: TbReport,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Up Coming Close Card",
        path: "/investors/upComingCloseCard",
        icon: AiFillCloseCircle,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // PROFIT
  {
    type: "collapse",
    label: "Profit History",
    icon: BsGraphUpArrow,
    roles: ["admin", "developer", "manager", "data_entry"],
    children: [
      {
        label: "Card Close History",
        path: "/profit/card-close-history",
        icon: MdShowChart,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Profit Analytics",
        path: "/profit/profit-analytics",
        icon: MdShowChart,
        roles: ["admin", "developer", "manager", "data_entry"],
      },
      {
        label: "Monthly Profit Distributor",
        path: "/profit/monthly_profit_distributor",
        icon: TbCashBanknote,
        roles: ["admin", "developer", "manager", "data_entry"],
      },
    ],
  },

  // OTHERS SOURCE PROFIT / ASSET REVENUE
  {
    type: "collapse",
    label: "Others Profit",
    icon: FaBuilding,
    roles: ["admin", "developer", "manager"],
    children: [
      {
        label: "Assets & Purchase",
        path: "/other-sources/assets",
        icon: FaBoxOpen,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Monthly Collections",
        path: "/other-sources/collections",
        icon: TbCashBanknote,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Email History (Logs)",
        path: "/email-logs",
        icon: RiMailSendLine,
        roles: ["admin", "developer", "manager"],
      },
    ],
  },

  // WITHDRAW
  {
    type: "collapse",
    label: "Withdraw",
    icon: BsBank,
    roles: ["admin", "developer", "manager"],
    children: [
      {
        label: "Withdraw Action",
        path: "/profit/withdraw-action",
        icon: GiPayMoney,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Profit Action History",
        path: "/profit/profit_action_history",
        icon: TbClipboardList,
        roles: ["admin", "developer", "manager"],
      },
    ],
  },

  // MANAGER
  {
    type: "collapse",
    label: "Manager",
    icon: BsClipboardData,
    roles: ["manager", "developer"],
    children: [
      {
        label: "Manager Reports",
        path: "/manager/staff_reports",
        icon: TbReport,
        roles: ["manager", "developer"],
      },
    ],
  },

  // PRODUCTS
  {
    type: "collapse",
    label: "Products",
    icon: HiOutlineCube,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Products Summary",
        path: "/products_summery",
        icon: FaBoxOpen,
        roles: ["admin", "developer", "manager", "staff"],
      },
      // {
      //   label: "Sales Product List",
      //   path: "/products/sales_products",
      //   icon: FaCartShopping,
      //   roles: ["admin", "developer", "manager", "staff"],
      // },
    ],
  },


  // COMPANY

  {
    type: "collapse",
    label: "Finance",
    icon: IoStatsChart,
    roles: ["admin", "developer", "manager"],
    children: [
      {
        label: "Finance Overview",
        path: "/finance/finance_overview",
        icon: IoStatsChart,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Company Health",
        path: "/finance/company-health",
        icon: BsGraphUpArrow,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "ক্লোজিং সিমুলেটর",
        path: "/finance/company-settlement-simulator",
        icon: BsClipboardData,
        roles: ["admin", "developer", "manager"],
      },
    ],
  },
  {
    label: "Company Expenses",
    path: "/company_expenses",
    icon: FaBuilding,
    roles: ["admin", "developer", "manager", "staff"],
  },
  // AUDIT PANEL (Admin & Developer Only)
  {
    type: "collapse",
    label: "Audit Panel",
    icon: TbShieldCheck,
    roles: ["admin", "developer"],
    children: [
      {
        label: "মাসিক কিস্তি ও ক্যাশ অডিট",
        path: "/audit/monthly-installments",
        icon: TbClipboardCheck,
        roles: ["admin", "developer"],
      },
      {
        label: "ডাউন পেমেন্ট ও ক্যাশ অডিট",
        path: "/audit/downpayments",
        icon: TbReceipt,
        roles: ["admin", "developer"],
      },
      {
        label: "দৈনিক কিস্তি ও ক্যাশ অডিট",
        path: "/audit/daily-installments",
        icon: TbCalendarTime,
        roles: ["admin", "developer"],
      },
      {
        label: "ইনভেস্টমেন্ট ও ক্যাশ অডিট",
        path: "/audit/investments",
        icon: TbCoins,
        roles: ["admin", "developer"],
      },
      {
        label: "কাস্টমার খাতা রিকনসিলিয়েশন",
        path: "/audit/customer-khata-reconciliation",
        icon: TbBook2,
        roles: ["admin", "developer", "manager", "audit"],
      },
    ],
  },

  // DEVELOPER & SERVER STUDIO
  {
    type: "collapse",
    label: "Developer",
    icon: MdDeveloperMode,
    roles: ["developer", "admin"],
    children: [
      {
        label: "Dev & Server Studio",
        path: "/developer/dev_studio",
        icon: TbServer,
        roles: ["developer", "admin"],
      },
      {
        label: "Staff Activity",
        path: "/developer/staff_activity",
        icon: TbClock,
        roles: ["developer"],
      },
    ],
  },

  // SUBMITTED APPLICATIONS
  {
    type: "collapse",
    label: "Submitted Applications",
    icon: TbClipboardList,
    roles: ["admin", "developer", "manager"],
    children: [
      {
        label: "Investment Withdraw Request",
        path: "/applications/invest_withdraw_request",
        icon: TbCashBanknote,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Investment Withdraw Applications",
        path: "/applications/all_invest_withdraw",
        icon: TbWallet,
        roles: ["admin", "developer", "manager"],
      },
    ],
  },
  {
    type: "collapse",
    label: "Installment Files",
    icon: TbFiles,
    roles: ["admin", "developer", "manager", "staff", "data_entry"],
    children: [
      {
        label: "Installment File Records",
        path: "/installment_file_record",
        icon: TbFiles,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },
      {
        label: "Add Installment File",
        path: "/add_installment_file",
        icon: TbFileUpload,
        roles: ["admin", "developer", "manager", "staff", "data_entry"],
      },

    ],
  },

  {
    label: "Profile",
    path: "/account",
    icon: FiUser,
    roles: ["admin", "developer", "manager", "staff"],
  },
];
