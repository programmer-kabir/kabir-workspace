import React from 'react';
import { Copy, Link2, Download, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Copy Video Link',
      desc: 'Open TikTok, YouTube, Instagram, or any site and copy the public video link from your address bar or share sheet.',
      icon: Copy,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      step: '02',
      title: 'Paste URL & Fetch',
      desc: 'Paste the link into the StreamVault input box above. Click the Download button or let our smart paste detect it.',
      icon: Link2,
      color: 'from-indigo-600 to-purple-600'
    },
    {
      step: '03',
      title: 'Choose Quality & Save',
      desc: 'Pick your preferred format (1080p Full HD, 720p HD, or MP3 Audio). Your download begins immediately.',
      icon: Download,
      color: 'from-purple-600 to-pink-500'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            How to Download Any Video
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            No registration, no software installations, and no hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative glass-panel rounded-3xl p-8 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                {/* Step Number */}
                <div className="text-5xl font-black text-slate-800 group-hover:text-slate-700/80 transition-colors mb-4">
                  {item.step}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
