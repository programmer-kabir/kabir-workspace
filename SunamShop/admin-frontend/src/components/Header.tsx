import React from 'react';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
        <p className="text-xs text-gray-500">সুনামগঞ্জ সদর সেন্ট্রাল হাব অপারেশনস</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="অর্ডার নম্বর বা কাস্টমার ফোন..."
            className="w-64 pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
          <Bell size={18} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white"></span>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-700">সিস্টেম একটিভ</span>
        </div>
      </div>
    </header>
  );
};
