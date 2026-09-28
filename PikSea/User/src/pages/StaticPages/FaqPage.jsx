import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFaqs } from '../../hooks/useFaqs';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import DayalLoader from '../../components/Common/DayalLoader';

const FaqPage = () => {
  const { faqs, loading, error } = useFaqs();
  const [openCategory, setOpenCategory] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (catIdx, itemIdx) => {
    if (openCategory === catIdx && openIndex === itemIdx) {
      setOpenIndex(null);
    } else {
      setOpenCategory(catIdx);
      setOpenIndex(itemIdx);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <DayalLoader text="Loading FAQs..." />
      </div>
    );
  }

  if (error || !faqs) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col items-center justify-center gap-4 transition-colors duration-300">
        <p className="text-xl text-gray-600 dark:text-gray-400">Error loading FAQs. Please try again later.</p>
        <p className="text-sm text-red-500 dark:text-red-400 max-w-lg text-center break-words">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Frequently Asked Questions — PikSea</title>
        <meta name="description" content="Find answers to common questions about PikSea stock photography, licensing, and creator accounts." />
      </Helmet>
      <div className="min-h-screen bg-white dark:bg-[#050505] py-16 px-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-[#111] p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200 dark:border-white/10 transition-colors duration-300">
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 text-center transition-colors">Frequently Asked Questions</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center transition-colors">Find answers to common questions about PikSea.</p>

          <div className="space-y-12">
            {faqs.map((categoryGroup, catIdx) => (
              <div key={categoryGroup.id || catIdx}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-white/10 transition-colors">{categoryGroup.name}</h2>
                <div className="space-y-4">
                  {categoryGroup.items && categoryGroup.items.map((faq, itemIdx) => {
                    const isOpen = openCategory === catIdx && openIndex === itemIdx;
                    return (
                      <div key={faq.id || itemIdx} className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-200">
                        <button 
                          onClick={() => toggleFaq(catIdx, itemIdx)}
                          className={`w-full px-6 py-4 text-left font-semibold flex justify-between items-center transition-colors ${isOpen ? 'bg-[#00D4FF] text-white' : 'bg-white dark:bg-[#050505] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#111]'}`}
                        >
                          {faq.question}
                          <span className="text-xl shrink-0 ml-4">{isOpen ? '−' : '+'}</span>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 py-4 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#111] border-t border-gray-200 dark:border-white/10 transition-colors">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-transparent p-6 rounded-xl text-center mt-12 transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors">Still have questions?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors">If you cannot find the answer to your question, please contact our support team.</p>
            <Link to="/contact-us" className="inline-block px-6 py-2 bg-[#00D4FF] text-white font-medium rounded-lg hover:bg-[#00b8e6] transition-colors">
              Contact Support
            </Link>
          </div>

        </div>
      </div>
    </HelmetProvider>
  );
};

export default FaqPage;
