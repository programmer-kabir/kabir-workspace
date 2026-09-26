import React from 'react';
import { useDynamicPage } from '../../hooks/useDynamicPage';
import DynamicSEO from '../../components/CMS/DynamicSEO';
import SafeRichText from '../../components/CMS/SafeRichText';

const ContributorGuideline = () => {
  const { pageData, loading, error } = useDynamicPage('contributor-guidelines');

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

  const content = pageData.content; // Parsed JSON

  return (
    <>
      <DynamicSEO pageData={pageData} />
      <div className="min-h-screen bg-white dark:bg-[#050505] py-16 px-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-[#111] p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200 dark:border-white/10 transition-colors duration-300">
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{pageData.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 transition-colors">Last Updated: {lastUpdated}</p>

          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg mb-8">
            <strong>Need to know:</strong> This document requires administrative confirmation. Placholders marked with <strong>[PENDING CONFIRMATION]</strong> must be verified by DayalStock management.
          </div>

          <div className="space-y-8 prose prose-lg text-gray-600 dark:text-gray-400 max-w-none transition-colors">
            <p>{content.intro}</p>

            {content.sections && content.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{idx + 1}. {section.title}</h2>
                <SafeRichText content={section.content} />
              </section>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default ContributorGuideline;
