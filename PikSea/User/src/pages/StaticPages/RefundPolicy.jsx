import React from 'react';
import { useDynamicPage } from '../../hooks/useDynamicPage';
import DynamicSEO from '../../components/CMS/DynamicSEO';
import SafeRichText from '../../components/CMS/SafeRichText';
import { Link } from 'react-router-dom';
import DayalLoader from '../../components/Common/DayalLoader';

const RefundPolicy = () => {
  const { pageData, loading, error } = useDynamicPage('refund-policy');

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <DayalLoader text="Loading Refund Policy..." />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <p className="text-xl text-gray-600 dark:text-gray-400">Error loading page content. Please try again later.</p>
      </div>
    );
  }

  const lastUpdated = new Date(pageData.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <DynamicSEO pageData={pageData} />
      <div className="min-h-screen bg-white dark:bg-[#050505] relative pt-24 pb-20 overflow-hidden transition-colors duration-300">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D4FF]/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Sidebar Navigation (Visible on Large Screens) */}
          <div className="hidden lg:block w-full lg:w-64 shrink-0 sticky top-32">
            <h3 className="text-gray-900 dark:text-white font-bold font-outfit text-xl mb-6 tracking-wide">Legal & Policies</h3>
            <ul className="space-y-5 border-l border-gray-200 dark:border-white/5 pl-4">
              <li>
                <Link to="/terms-of-use" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">Terms of Use</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">Privacy Policy</Link>
              </li>
              <li className="relative">
                <span className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[2px] h-6 bg-[#00D4FF] rounded-r-md"></span>
                <Link to="/refund-policy" className="text-[#00D4FF] font-medium inline-block font-inter">Refund Policy</Link>
              </li>
              <li>
                <Link to="/licensing" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">Licensing Agreement</Link>
              </li>
              <li>
                <Link to="/dmca" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">DMCA</Link>
              </li>
            </ul>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full max-w-4xl">
            
            <div className="mb-14 pb-10 border-b border-gray-200 dark:border-white/10 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-md text-xs font-semibold tracking-widest uppercase mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]"></span>
                </span>
                Policy Document
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-[64px] font-bold text-gray-900 dark:text-white mb-8 tracking-tight font-outfit leading-tight">{pageData.title}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-base flex items-center gap-2 font-inter">
                <svg className="w-4 h-4 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Last Updated: <span className="text-gray-900 dark:text-white font-medium ml-1">{lastUpdated}</span>
              </p>
            </div>

            <div className="relative">
              <SafeRichText content={pageData.content} />
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default RefundPolicy;
