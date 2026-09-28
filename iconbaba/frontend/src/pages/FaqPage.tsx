// frontend/src/pages/FaqPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, HelpCircle, MessageSquare, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import { getFaqItems, getContentPage } from '@/lib/api';
import { FAQItem, ContentPage } from '@/types/cms';

export default function FAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pageInfo, setPageInfo] = useState<ContentPage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [faqRes, pageRes] = await Promise.all([
          getFaqItems(),
          getContentPage('faq'),
        ]);

        if (faqRes.success && faqRes.data) {
          setItems(faqRes.data.items || []);
          setCategories(faqRes.data.categories || []);
          // Open first 2 items by default
          if (faqRes.data.items?.length > 0) {
            setOpenItems({
              [faqRes.data.items[0].id]: true,
              ...(faqRes.data.items[1] ? { [faqRes.data.items[1].id]: true } : {}),
            });
          }
        }
        if (pageRes.success && pageRes.data) {
          setPageInfo(pageRes.data);
        }
      } catch (err) {
        console.error('Failed to load FAQ data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15]">
      <SiteHeader />

      <main className="flex-1 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-4">
            <Sparkles className="size-3.5 text-purple-400" />
            Got Questions? We&apos;ve Got Answers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {pageInfo?.title || 'Frequently Asked Questions'}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            {pageInfo?.meta_description ||
              'Everything you need to know about IconBaba licensing, downloads, team seats, commercial use, and vector formats.'}
          </p>

          {/* Search Bar */}
          <div className="mt-8 relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions (e.g. licensing, figma, team)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141522] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              selectedCategory === 'All'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            All Questions ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white/[0.02] border border-white/10"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10">
            <HelpCircle className="size-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No matching questions found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;. Feel free to reach out to our team directly.
            </p>
            <Link
              to="/contact"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <MessageSquare className="size-3.5" />
              Contact Support
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isOpen = Boolean(openItems[item.id]);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-[#141522] border-purple-500/40 shadow-xl shadow-purple-500/5'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`size-4 text-purple-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 animate-in fade-in duration-150">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still Have Questions CTA */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-tr from-purple-950/30 to-indigo-950/20 border border-purple-500/20 text-center max-w-2xl mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Can&apos;t find what you&apos;re looking for? Please contact our friendly support team.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            <MessageSquare className="size-4" />
            Get in Touch
          </Link>
        </div>
      </main>
    </div>
  );
}
