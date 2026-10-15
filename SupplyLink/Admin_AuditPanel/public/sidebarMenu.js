// import {
//   HiOutlineHome,
//   HiOutlineCube,
//   HiOutlineUserGroup,
// } from "react-icons/hi2";

// import {
//   FaBuilding,
//   FaUser,
//   FaUserPlus,
//   FaBoxOpen,
//   FaCartShopping,
//   FaCashRegister,
// } from "react-icons/fa6";
// import { FaTasks } from "react-icons/fa";

// import {
//   TbUsers,
//   TbFilePlus,
//   TbShoppingCartPlus,
//   TbCashBanknote,
//   TbClipboardList,
//   TbWallet,
//   TbShoppingCart,
//   TbChartBar,
//   TbReport,
//   TbClock,
// } from "react-icons/tb";

// import { RiBankCardLine, RiBankCard2Line } from "react-icons/ri";
// import { MdDeveloperMode, MdInventory, MdOutlineDashboard, MdOutlineInventory2, MdPayments, MdProductionQuantityLimits, MdShowChart } from "react-icons/md";
// import { GiReceiveMoney, GiPayMoney } from "react-icons/gi";
// import { IoStatsChart } from "react-icons/io5";
// import { BsBank, BsGraphUpArrow, BsClipboardData, BsCashStack } from "react-icons/bs";
// import { AiFillCloseCircle, AiOutlineUserAdd } from "react-icons/ai";

// export const sidebarMenu = [
//   // DASHBOARD
//   {
//     label: "Dashboard",
//     path: "/",
//     icon: MdOutlineDashboard,
//     roles: ["admin", "developer", "manager", "staff"],
//   },

//   // USERS
//   {
//     type: "collapse",
//     label: "Users",
//     icon: TbUsers,
//     roles: ["admin", "developer", "manager", "staff"],
//     children: [
//       {
//         label: "All Users",
//         path: "/all_users",
//         icon: FaUser,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Add User",
//         path: "/add_user",
//         icon: AiOutlineUserAdd,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Add Roles",
//         path: "/add_roles",
//         icon: FaUserPlus,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Assign Guarantor",
//         path: "/customers/customer_guarantor_assign",
//         icon: HiOutlineUserGroup,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//     ],
//   },

//   // CUSTOMERS
//   {
//     type: "collapse",
//     label: "Customers",
//     icon: HiOutlineUserGroup,
//     roles: ["admin", "developer", "manager", "staff"],
//     children: [
//       {
//         label: "Customer List",
//         path: "/customers/all_customer",
//         icon: FaUser,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Installment Cards",
//         path: "/customers/sales_cards",
//         icon: RiBankCardLine,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Create Installment Cards",
//         path: "/customers/create_sales_cards",
//         icon: RiBankCard2Line,
//         roles: ["admin", "developer", "manager"],
//       },
//       {
//         label: "Create Sales Items",
//         path: "/customers/create_sales_items",
//         icon: RiBankCard2Line,
//         roles: ["admin", "developer", "manager"],
//       },
//       {
//         label: "Installment Analytics",
//         path: "/customers/monthly_installment_overviews",
//         icon: MdShowChart,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Monthly Installment Reports",
//         path: "/customers/monthly_installment_reports",
//         icon: TbChartBar,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Monthly Installment Print",
//         path: "/customers/monthly_installment_overview",
//         icon: TbChartBar,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//     ],
//   },
  
//   {
//     type: "collapse",
//     label: "Regular Installments",
//     icon: HiOutlineUserGroup,
//     roles: ["admin", "developer", "manager", "staff"],
//     children: [
//       {
//         label: "Regular Installment  List",
//         path: "/DailyInstallments/daily_installments_users",
//         icon: TbUsers,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Daily Installments Reports",
//         path: "/DailyInstallments/daily_installments_reports",
//         icon: TbReport,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//     ],
//   },



//   // PRODUCTS
//   {
//     type: "collapse",
//     label: "Products",
//     icon: HiOutlineCube,
//     roles: ["admin", "developer", "manager", "staff"],
//     children: [
//       {
//         label: "Products Summary",
//         path: "/products_summery",
//         icon: FaBoxOpen,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       // {
//       //   label: "Sales Product List",
//       //   path: "/products/sales_products",
//       //   icon: FaCartShopping,
//       //   roles: ["admin", "developer", "manager", "staff"],
//       // },
//     ],
//   },
//   {
//     type: "collapse",
//     label: "Stock Inventory",
//     icon: MdInventory,
//     roles: ["admin", "developer", "manager", "staff"],
//     children: [
//       {
//         label: "Inventory List",
//         path: "inventory/inventory_list",
//         icon: MdOutlineInventory2,
//         roles: ["admin", "developer", "manager", "staff"],
//       },
//       {
//         label: "Supplier Payments",
//         path: "inventory/supplier_payments",
//         icon: MdPayments,
//         roles: ["admin", "developer", "manager", "staff"],
//       }
//     ],
//   },

//   // COMPANY
//   {
//     label: "Company Expenses",
//     path: "/company_expenses",
//     icon: FaBuilding,
//     roles: ["admin", "developer", "manager", "staff"],
//   },
//   {
//     label: "Finance Overview",
//     path: "/finance_overview",
//     icon: IoStatsChart,
//     roles: ["admin", "developer", "manager", "staff"],
//   },


// ];
import { HiOutlineUserGroup } from "react-icons/hi2";

import {
  FaUser,
  FaUserPlus,
  FaBoxOpen,
  FaCartShopping,
  FaBuilding,
} from "react-icons/fa6";

import {
  TbUsers,
  TbShoppingCartPlus,
  TbClipboardList,
  TbChartBar,
  TbReport,
  TbWallet,
} from "react-icons/tb";

import {
  RiBankCardLine,
  RiBankCard2Line,
} from "react-icons/ri";

import {
  MdOutlineDashboard,
  MdInventory,
  MdOutlineInventory2,
  MdPayments,
  MdShowChart,
} from "react-icons/md";

import { GiReceiveMoney } from "react-icons/gi";

import { IoStatsChart } from "react-icons/io5";

import {
  BsGraphUpArrow,
  BsCashStack,
} from "react-icons/bs";

import { AiOutlineUserAdd } from "react-icons/ai";
export const sidebarMenu = [
  {
    label: "Dashboard",
    path: "/",
    icon: MdOutlineDashboard,
    roles: ["admin", "developer", "manager", "staff"],
  },

  // USERS
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
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Roles Management",
        path: "/add_roles",
        icon: FaUserPlus,
        roles: ["admin", "developer"],
      },
    ],
  },

  // CUSTOMER MANAGEMENT
  {
    type: "collapse",
    label: "Customer Management",
    icon: HiOutlineUserGroup,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Customer List",
        path: "/customers/all_customer",
        icon: FaUser,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Guarantor Assign",
        path: "/customers/customer_guarantor_assign",
        icon: HiOutlineUserGroup,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // SALES MANAGEMENT
  {
    type: "collapse",
    label: "Sales Management",
    icon: FaCartShopping,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Create Sales Item",
        path: "/customers/create_sales_items",
        icon: TbShoppingCartPlus,
        roles: ["admin", "developer", "manager"],
      },
      {
        label: "Products Summary",
        path: "/sales/sales_products_summary",
        icon: FaBoxOpen,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // INSTALLMENT MANAGEMENT
  {
    type: "collapse",
  label: "Sales Card Management",
    icon: RiBankCardLine,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Sales Cards",
        path: "/customers/sales_cards",
        icon: RiBankCardLine,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Create Sales Card",
        path: "/customers/create_sales_cards",
        icon: RiBankCard2Line,
        roles: ["admin", "developer", "manager"],
      },

      {
        label: "Installment Analytics",
        path: "/customers/monthly_installment_overviews",
        icon: MdShowChart,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Monthly Reports",
        path: "/customers/monthly_installment_reports",
        icon: TbChartBar,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Sales Cards Invoice",
        path: "/customers/sales-card-invoices",
        icon: TbReport,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // DAILY INSTALLMENTS
  {
    type: "collapse",
    label: "Daily Installments",
    icon: TbWallet,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Installment Users",
        path: "/DailyInstallments/daily_installments_users",
        icon: TbUsers,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Daily Reports",
        path: "/DailyInstallments/daily_installments_reports",
        icon: TbReport,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // INVENTORY
  {
    type: "collapse",
    label: "Inventory Management",
    icon: MdInventory,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Inventory List",
        path: "/inventory/inventory_list",
        icon: MdOutlineInventory2,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Supplier Payments",
        path: "/inventory/supplier_payments",
        icon: MdPayments,
        roles: ["admin", "developer", "manager", "staff"],
      },
    ],
  },

  // FINANCE
  {
    type: "collapse",
    label: "Finance",
    icon: IoStatsChart,
    roles: ["admin", "developer", "manager", "staff"],
    children: [
      {
        label: "Finance Overview",
        path: "/finance_overview",
        icon: IoStatsChart,
        roles: ["admin", "developer", "manager", "staff"],
      },
      {
        label: "Company Expenses",
        path: "/company_expenses",
        icon: FaBuilding,
        roles: ["admin", "developer", "manager", "staff"],
      }
    ],
  },
];