import {
  LayoutDashboard,
  UploadCloud,
  FolderOpen,
  DollarSign,
  Settings as SettingsIcon,
  Clock3,
  FileX2,
  BadgeCheck,
  BarChart2,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";

export const NavMenu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "Files",
    icon: FolderOpen,
    children: [
      {
        name: "Upload Content",
        path: "/dashboard/files/upload",
        icon: UploadCloud,
      },
      {
        name: "Under Review",
        path: "/dashboard/files/review",
        icon: Clock3,
      },
      {
        name: "Rejected Content",
        path: "/dashboard/files/rejected",
        icon: FileX2,
      },
      {
        name: "Published Content",
        path: "/dashboard/files/published",
        icon: BadgeCheck,
      },
      {
        name: "Exclusive Buyout",
        path: "/dashboard/files/exclusive-buyout",
        icon: BadgeCheck,
      },
    ],
  },
  {
    name: "Downloads",
    path: "/dashboard/downloads",
    icon: BarChart2,
  },
  {
    name: "Earnings",
    path: "/dashboard/earnings",
    icon: DollarSign,
  },
  {
    name: "Verification",
    path: "/dashboard/verification",
    icon: ShieldCheck,
  },
  {
    name: "Support",
    path: "/dashboard/support",
    icon: LifeBuoy,
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    icon: SettingsIcon,
  },
];
