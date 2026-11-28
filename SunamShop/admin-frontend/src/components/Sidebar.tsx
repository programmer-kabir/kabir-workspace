import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Store, 
  Warehouse, 
  Truck, 
  Receipt, 
  Sliders 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড (Dashboard)', icon: LayoutDashboard },
    { id: 'orders', label: 'লাইভ অর্ডার (Live Orders)', icon: ShoppingBag, badge: '4' },
    { id: 'products', label: 'পণ্য পরিচালনা (Products)', icon: Layers },
    { id: 'sourcing', label: 'বাজার সোর্সিং (Sourcing)', icon: Store },
    { id: 'inventory', label: 'ইনভেন্টরি ও স্টক (Stock)', icon: Warehouse },
    { id: 'delivery', label: 'ডেলিভারি ও রাইডার (Delivery)', icon: Truck },
    { id: 'finance', label: 'আয়-ব্যয় ও প্রফিট (Finance)', icon: Receipt },
    { id: 'settings', label: 'স্টোর সেটিংস (Settings)', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
          স
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block leading-tight">
            সুনাম শপ <span className="text-emerald-400 text-xs">Admin</span>
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">
            Sunamganj Operations
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white text-emerald-700' : 'bg-amber-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin User Info Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
          SA
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">সুনাম শপ অ্যাডমিন</p>
          <p className="text-[10px] text-slate-400 truncate">SUPER_ADMIN (01700-000000)</p>
        </div>
      </div>
    </aside>
  );
};
