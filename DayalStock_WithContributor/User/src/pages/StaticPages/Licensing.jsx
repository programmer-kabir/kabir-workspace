import React from 'react';
import { Link } from 'react-router-dom';
import { useDynamicPage } from '../../hooks/useDynamicPage';
import DynamicSEO from '../../components/CMS/DynamicSEO';

const Licensing = () => {
  const { pageData, loading, error } = useDynamicPage('licensing');

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF]"></div>
      </div>
    );
  }

  if (error || !pageData || !pageData.content) {
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

  const content = pageData.content; // It is already parsed in useDynamicPage

  return (
    <>
      <DynamicSEO pageData={pageData} />
      <div className="min-h-screen bg-white dark:bg-[#050505] relative pt-24 pb-20 overflow-hidden transition-colors duration-300">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D4FF]/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-full lg:w-64 shrink-0 sticky top-32">
            <h3 className="text-gray-900 dark:text-white font-bold font-outfit text-xl mb-6 tracking-wide">Legal & Policies</h3>
            <ul className="space-y-5 border-l border-gray-200 dark:border-white/5 pl-4">
              <li>
                <Link to="/terms-of-use" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">Terms of Use</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1 transition-all inline-block font-inter">Refund Policy</Link>
              </li>
              <li className="relative">
                <span className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[2px] h-6 bg-[#00D4FF] rounded-r-md"></span>
                <Link to="/licensing" className="text-[#00D4FF] font-medium inline-block font-inter">Licensing Agreement</Link>
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

          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg mb-8">
            <strong>Need to know:</strong> This document requires administrative confirmation for all licensing terms. Placholders marked with <strong>[PENDING CONFIRMATION]</strong> must be verified by DayalStock management.
          </div>

          <div className="space-y-12">
            {/* Section 1: Free vs Premium */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/10">1. Standard vs. Commercial Licenses</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{content.intro}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {content.licenses && content.licenses.map((license, idx) => (
                  <div key={idx} className={`border rounded-xl p-6 ${license.style === 'free' ? 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#050505]' : 'border-orange-200 bg-orange-50/30'}`}>
                    <h3 className={`text-xl font-bold mb-3 ${license.style === 'free' ? 'text-gray-900 dark:text-white' : 'text-orange-600'}`}>
                      {license.type}
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                      {license.points.map((pt, i) => (
                        <li key={i}><strong className="text-gray-800 dark:text-gray-200">{pt.label}:</strong> {pt.value}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Permitted Uses */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/10">2. Permitted Usage</h2>
              <div className="prose prose-lg text-gray-600 dark:text-gray-400 max-w-none">
                <p>Under a valid license, you are generally permitted to use the assets for:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 list-none pl-0">
                  {content.permitted && content.permitted.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Section 3: Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/10">3. Strictly Prohibited Usage</h2>
              <div className="prose prose-lg text-gray-600 dark:text-gray-400 max-w-none">
                <p>Regardless of your license type, the following actions are strictly prohibited:</p>
                <ul className="space-y-2 mt-4 list-none pl-0">
                  {content.prohibited && content.prohibited.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold mt-1">✗</span> 
                      <span><strong>{item.title}:</strong> {item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Contact Support */}
            <div className="bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-transparent p-6 rounded-xl text-center mt-12">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Have specific licensing questions?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">If your use-case isn't covered here, please reach out to our support team.</p>
              <Link to="/contact-us" className="inline-block px-6 py-2 bg-[#00D4FF] text-white font-medium rounded-lg hover:bg-[#00b8e6] transition-colors">
                Contact Support
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Licensing;
