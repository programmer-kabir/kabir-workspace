import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is StreamVault completely free to use?',
      a: 'Yes, StreamVault is 100% free with unlimited downloads. You do not need to register an account or install any third-party browser extensions.'
    },
    {
      q: 'Does it download TikTok videos without a watermark?',
      a: 'Yes! StreamVault extracts the original clean video stream directly from TikTok, so your downloaded MP4 file will be completely free of watermarks and logos.'
    },
    {
      q: 'How do I download videos on iPhone or Android?',
      a: 'Simply copy the video link from your social media app (TikTok, Instagram, YouTube, etc.), open your mobile browser (Safari or Chrome), paste the URL into StreamVault, and tap Download. On iOS Safari, tap the download icon in the URL bar to save it to your Photos or Files app.'
    },
    {
      q: 'Can I extract MP3 audio only?',
      a: 'Yes. When the video details appear, switch to the "Audio (MP3)" tab and click "Download MP3". Our backend converts the highest quality audio stream to MP3 format for you.'
    },
    {
      q: 'Where are the downloaded files saved on my device?',
      a: 'Files are automatically saved to your default system "Downloads" folder, or the location configured in your browser settings.'
    },
    {
      q: 'What type of content can I download?',
      a: 'StreamVault is intended for public content that users are authorized to download, such as your own uploaded media, creative commons videos, or open educational resources. We strictly prohibit downloading private accounts, DRM-protected media, or content violating copyright regulations.'
    }
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Find answers to commonly asked questions about video downloading and compatibility.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-indigo-300 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-indigo-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
