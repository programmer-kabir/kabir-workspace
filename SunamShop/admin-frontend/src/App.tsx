import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabTitles: Record<string, string> = {
    dashboard: 'অপারেশনস ড্যাশবোর্ড (Overview)',
    orders: 'লাইভ অর্ডার ব্যবস্থাপনা (Orders)',
    products: 'পণ্য ক্যাটালগ ও স্টক (Catalog)',
    sourcing: 'লোকাল বাজার সংগ্রহ (Local Market Sourcing)',
    inventory: 'ইনভেন্টরি ও ওয়্যারহাউজ (Inventory)',
    delivery: 'ডেলিভারি জোন ও রাইডার (Logistics)',
    finance: 'আয়-ব্যয় ও আর্থিক হিসাব (Finance & PnL)',
    settings: 'সিস্টেম ও স্টোর কনফিগারেশন (Settings)',
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={tabTitles[activeTab] || 'ড্যাশবোর্ড'} />
        
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab !== 'dashboard' && (
            <div className="p-8 text-center text-gray-500 text-sm">
              <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm max-w-lg mx-auto">
                <span className="text-4xl block mb-2">🚧</span>
                <h3 className="font-bold text-gray-800 text-base mb-1">
                  {tabTitles[activeTab]}
                </h3>
                <p className="text-xs text-gray-500">
                  Phase 1 সম্পন্ন হয়েছে। Phase 4-এ এই মডিউলের বিস্তারিত লাইভ ফাংশনালিটি সংযুক্ত করা হবে।
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
