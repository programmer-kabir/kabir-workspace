import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Users 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    { title: "আজকের বিক্রয় (Today's Sales)", value: "৳ ১৪,২৫০", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "আজকের অর্ডার (Total Orders)", value: "১৮ টি", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "পেন্ডিং অর্ডার (Pending Delivery)", value: "৪ টি", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "আজকের নিট লাভ (Net Profit)", value: "৳ ১,৯৫০", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "স্টক কমে যাওয়া পণ্য (Low Stock)", value: "২ টি", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "মোট নিবন্ধিত গ্রাহক (Customers)", value: "১২৪ জন", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Operational Queue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Morning Bazaar Sourcing Queue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">সকালের বাজার সংগ্রহ তালিকা (Local Sourcing)</h3>
              <p className="text-xs text-gray-500">আজকের তাজা মাছ ও সবজির অর্ডার</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              ৩টি সংগ্রহ বাকি
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong className="block text-gray-900">তাজা রুই মাছ (হাওর) — আনুমানিক ২.০ কেজি</strong>
                <span className="text-gray-500">অর্ডার #SS-20261128-001 (হাসন নগর)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">পুরাতন বাজার</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong className="block text-gray-900">দেশি মুরগি (লাইভ কাটা) — ১.৫ কেজি</strong>
                <span className="text-gray-500">অর্ডার #SS-20261128-003 (নতুনপাড়া)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">নতুন বাজার</span>
            </div>
          </div>
        </div>

        {/* Live Delivery Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">ডেলিভারি রাইডার অবস্থান (Rider Status)</h3>
              <p className="text-xs text-gray-500">সুনামগঞ্জ সদর জোন ১ ও জোন ২</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ২ জন রাইডার রাস্তায়
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong className="block text-gray-900">রাইডার শফিক মিয়া</strong>
                <span className="text-gray-500">অর্ডার #002 ডেলিভারি পথে (ষোলঘর)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">ক্যাশ কালেকশন: ৳৫৪০</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong className="block text-gray-900">রাইডার কামাল হোসেন</strong>
                <span className="text-gray-500">হাবে অবস্থান করছেন (পরবর্তী ডেলিভারির অপেক্ষা)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">স্ট্যান্ডবাই</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
