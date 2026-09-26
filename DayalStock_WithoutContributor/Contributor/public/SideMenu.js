import {
  LayoutDashboard,
  UploadCloud,
  FolderOpen,
  DollarSign,
  Clock3,
  
  FileX2,
  BadgeCheck,

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
    ],
  },
  {
    name: "Earnings",
    path: "/dashboard/earnings",
    icon: DollarSign,
  }
];