import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFaqs } from '../../hooks/useFaqs';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import DayalLoader from '../../components/Common/DayalLoader';
import { 
  Search, ChevronDown, HelpCircle, Sparkles, 
  MessageSquare, ArrowRight, ShieldCheck, CreditCard, Camera 
} from 'lucide-react';

const categoryIcons = {
  'general': Camera,
  'licensing': ShieldCheck,
  'subscriptions': Sparkles,
  'billing': CreditCard,
};

const FaqPage = () => {
  const { faqs, loading, error } = useFaqs();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [openItems, setOpenItems] = useState({});

  const toggleAccordion = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter FAQs based on active category and search query
  const filteredFaqs = useMemo(() => {
    if (!faqs) return [];

    return faqs
      .filter((cat) => {
        if (activeCategorySlug === 'all') return true;
        return cat.slug === activeCategorySlug || String(cat.id) === String(activeCategorySlug);
      })
      .map((cat) => {
        const filteredItems = (cat.items || []).filter((item) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
        });

        return {
          ...cat,
          items: filteredItems
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [faqs, activeCategorySlug, searchQuery]);

  const totalResults = useMemo(() => {
    return filteredFaqs.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
  }, [filteredFaqs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <DayalLoader text="Loading FAQs..." />
      </div>
    );
  }

  if (error || !faqs) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col items-center justify-center gap-4 px-4 transition-colors duration-300">
        <p className="text-xl text-gray-700 dark:text-gray-300 font-semibold font-outfit">Unable to load FAQs</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center">
          We encountered an issue fetching the latest questions. Please refresh or contact our support team.
        </p>
        <Link to="/contact-us" className="px-6 py-2.5 bg-[#00D4FF] text-gray-950 font-bold rounded-xl text-sm hover:bg-[#00b8e6] transition-all">
          Contact Support
        </Link>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Frequently Asked Questions — PikSea Help Center</title>
        <meta name="description" content="Find answers to common questions about PikSea stock photography, photo licensing, commercial usage, Pro subscriptions, and downloads." />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-[#050505] relative pt-28 pb-24 overflow-hidden transition-colors duration-300">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#00D4FF]/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Hero Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-full text-xs font-semibold tracking-widest uppercase mb-5 border border-[#00D4FF]/20">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Knowledge Base &amp; FAQ</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight font-outfit mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Everything you need to know about PikSea high-resolution stock photography, commercial licensing, and Pro subscriptions.
            </p>

            {/* Live Search Bar inside FAQs */}
            <div className="mt-8 max-w-xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0284C7]/20 to-[#00D4FF]/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative flex items-center bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-lg focus-within:border-[#00D4FF] transition-all">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 ml-3 shrink-0 group-focus-within:text-[#00D4FF] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g. licensing, refunds, downloads)..."
                  className="w-full bg-transparent px-3 py-2 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mr-2 text-xs font-semibold px-2 py-1 bg-gray-200 dark:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-12">
            <button
              onClick={() => setActiveCategorySlug('all')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategorySlug === 'all'
                  ? 'bg-[#00D4FF] text-gray-950 shadow-lg shadow-[#00D4FF]/20 font-bold'
                  : 'bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Topics
            </button>
            {faqs.map((cat) => {
              const IconComp = categoryIcons[cat.slug] || HelpCircle;
              const isActive = activeCategorySlug === cat.slug || String(activeCategorySlug) === String(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategorySlug(cat.slug || cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00D4FF] text-gray-950 shadow-lg shadow-[#00D4FF]/20 font-bold'
                      : 'bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion Groups */}
          {filteredFaqs.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-16 px-6 bg-gray-50 dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10">
              <HelpCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-outfit mb-2">No matching questions found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                We couldn't find any questions matching "{searchQuery}". Try using different keywords or ask our team.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10">
              {filteredFaqs.map((catGroup) => {
                const IconComp = categoryIcons[catGroup.slug] || HelpCircle;
                return (
                  <div key={catGroup.id} className="space-y-4">
                    {/* Category Title & Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-outfit">
                          {catGroup.name}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-white/5">
                        {catGroup.items.length} {catGroup.items.length === 1 ? 'Question' : 'Questions'}
                      </span>
                    </div>

                    {/* Accordion Items List */}
                    <div className="space-y-3">
                      {catGroup.items.map((faq) => {
                        const isOpen = !!openItems[faq.id];
                        return (
                          <div
                            key={faq.id}
                            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                              isOpen
                                ? 'bg-gray-50 dark:bg-[#111] border-[#00D4FF]/40 shadow-md shadow-cyan-500/5'
                                : 'bg-gray-50/60 dark:bg-[#111]/60 hover:bg-gray-50 dark:hover:bg-[#111] border-gray-200 dark:border-white/10'
                            }`}
                          >
                            <button
                              onClick={() => toggleAccordion(faq.id)}
                              className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                            >
                              <span className={`text-base sm:text-lg font-semibold font-outfit transition-colors ${
                                isOpen ? 'text-[#0284C7] dark:text-[#00D4FF]' : 'text-gray-900 dark:text-white'
                              }`}>
                                {faq.question}
                              </span>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                isOpen ? 'bg-[#00D4FF]/10 text-[#00D4FF] rotate-180' : 'bg-gray-200/60 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                              }`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </button>

                            {isOpen && (
                              <div className="px-6 pb-6 pt-1 text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed border-t border-gray-200/60 dark:border-white/5 font-inter">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Help Desk & Contact Card */}
          <div className="max-w-4xl mx-auto mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-gray-50 via-gray-50 to-[#00D4FF]/5 dark:from-[#111] dark:via-[#111] dark:to-[#00D4FF]/10 border border-gray-200 dark:border-white/10 shadow-lg text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] mx-auto mb-4">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit mb-2">
              Still have questions about PikSea?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-lg mx-auto mb-6">
              Our dedicated customer support team is available to answer any questions about commercial photo licensing, billing, or custom plans.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact-us"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#00D4FF] hover:bg-[#00b8e6] text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#00D4FF]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:support@piksea.com"
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-200/70 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold rounded-xl text-sm transition-all border border-gray-300 dark:border-white/10"
              >
                support@piksea.com
              </a>
            </div>
          </div>

        </div>
      </div>
    </HelmetProvider>
  );
};

export default FaqPage;
