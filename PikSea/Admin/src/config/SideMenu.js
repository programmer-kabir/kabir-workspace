import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileX2,
  BadgeCheck,
  Files,
  Tags,
  FolderTree,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  MessageSquareWarning,
  Mail,
  FileText,
  Star,
  Coins,
  Bell,
  HelpCircle,
  Globe,
  Layers,
  Headset,
  UploadCloud,
  Sparkles
} from "lucide-react";

export const AdminNavMenu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "Notifications",
    path: "/dashboard/notifications",
    icon: Bell,
  },

  {
    name: "Content Management",
    icon: FolderOpen,
    children: [
      {
        name: "Upload Assets",
        path: "/dashboard/content/upload",
        icon: UploadCloud,
      },
      {
        name: "All Contents",
        path: "/dashboard/allcontent",
        icon: Files,
      },
      {
        name: "Exclusive Buyout",
        path: "/dashboard/content/exclusive-buyout",
        icon: Star,
      },
      {
        name: "Collections",
        path: "/dashboard/content/collections",
        icon: Layers,
      },
    ],
  },

  {
    name: "User Management",
    path: "/dashboard/allusers",
    icon: Users,
  },

  {
    name: "Categories & Tags",
    icon: FolderTree,
    children: [
      {
        name: "Categories",
        path: "/dashboard/categories",
        icon: FolderTree,
      },
      {
        name: "Tags",
        path: "/dashboard/tags",
        icon: Tags,
      },
    ],
  },

  {
    name: "Finance",
    icon: DollarSign,
    children: [
      {
        name: "Company Earnings",
        path: "/dashboard/finance/company-earnings",
        icon: DollarSign,
      },
      {
        name: "Payment History",
        path: "/dashboard/finance/payment-history",
        icon: CreditCard,
      },
    ],
  },

  {
    name: "Reports",
    icon: BarChart3,
    children: [
      {
        name: "Content Reports",
        path: "/dashboard/reports/content",
        icon: BarChart3,
      },
      {
        name: "User Reports",
        path: "/dashboard/reports/users",
        icon: MessageSquareWarning,
      },
      {
        name: "Email Logs",
        path: "/dashboard/reports/email-logs",
        icon: Mail,
      },
    ],
  },

  {
    name: "Memberships",
    icon: CreditCard,
    children: [
      {
        name: "Subscriptions",
        path: "/dashboard/subscriptions",
        icon: CreditCard,
      },
      {
        name: "Credit Packages",
        path: "/dashboard/credit-packages",
        icon: Coins,
      },
    ],
  },
  {
    name: "Pages",
    icon: FileText,
    children: [
      {
        name: "All Pages",
        path: "/dashboard/pages",
        icon: FileText,
      },
      {
        name: "FAQs",
        path: "/dashboard/pages/faqs",
        icon: HelpCircle,
      },
    ],
  },
  {
    name: "Settings",
    icon: Settings,
    children: [
      {
        name: "General Settings",
        path: "/dashboard/settings",
        icon: Settings,
      },
      {
        name: "AI API Keys",
        path: "/dashboard/settings/ai-keys",
        icon: Sparkles,
      },
      {
        name: "SEO Management",
        path: "/dashboard/settings/seo",
        icon: Globe,
      },
      {
        name: "System Health",
        path: "/dashboard/system-health",
        icon: Settings,
      }
    ],
  },
  {
    name: "Support Tickets",
    path: "/dashboard/support-tickets",
    icon: Headset,
  },
  {
    name: "Testimonials",
    path: "/dashboard/testimonials",
    icon: MessageSquareWarning,
  },
];
