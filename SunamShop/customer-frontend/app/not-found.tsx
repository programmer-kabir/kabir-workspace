export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-sunam-primary flex items-center justify-center text-3xl font-bold shadow-inner">
        🔍
      </div>
      <h2 className="text-2xl font-bold text-gray-900">পৃষ্ঠাটি পাওয়া যায়নি (404)</h2>
      <p className="text-xs text-gray-500 max-w-sm">
        আপনি যে পৃষ্ঠাটি খুঁজছেন তা বর্তমানে উপলব্ধ নেই অথবা লিঙ্কটি পরিবর্তিত হয়েছে।
      </p>
      <a
        href="/"
        className="px-6 py-2.5 bg-sunam-primary hover:bg-sunam-primaryDark text-white font-semibold rounded-xl text-sm transition shadow-sm"
      >
        হোমপেজে ফিরে যান 🏠
      </a>
    </div>
  );
}
