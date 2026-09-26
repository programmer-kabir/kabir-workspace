import React from 'react';
import { useDynamicPage } from '../../hooks/useDynamicPage';
import DynamicSEO from '../../components/CMS/DynamicSEO';
import SafeRichText from '../../components/CMS/SafeRichText';

const AboutUs = () => {
  const { pageData, loading, error } = useDynamicPage('about-us');

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF]"></div>
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

  const lastUpdated = pageData.updated_at ? new Date(pageData.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  return (
    <>
      <DynamicSEO pageData={pageData} />
      <div className="min-h-screen bg-white dark:bg-[#050505] relative pt-28 pb-20 px-4 overflow-hidden transition-colors duration-300">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D4FF]/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-[#111] p-8 md:p-12 lg:p-14 rounded-3xl shadow-lg border border-gray-200 dark:border-white/10 relative z-10 transition-colors duration-300">
          <div className="mb-10 pb-8 border-b border-gray-200 dark:border-white/10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-md text-xs font-semibold tracking-widest uppercase mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]"></span>
              </span>
              About Us
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight font-outfit leading-tight">
              {pageData.title}
            </h1>
            {lastUpdated && (
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base flex items-center gap-2 font-inter">
                <svg className="w-4 h-4 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Last Updated: <span className="text-gray-900 dark:text-white font-medium ml-1">{lastUpdated}</span>
              </p>
            )}
          </div>

          <div className="relative">
            <SafeRichText content={pageData.content} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
