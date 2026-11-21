import React from 'react';
import { Zap, ShieldCheck, Sparkles, Smartphone, Music, CheckCircle } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      title: 'Ultra-Fast Cloud Extraction',
      desc: 'Our optimized media engine parses and resolves direct high-speed streams within 1-2 seconds.',
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500'
    },
    {
      title: 'No Watermark Downloads',
      desc: 'Clean TikTok and short-form videos with zero platform watermarks or annoying logos.',
      icon: Sparkles,
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      title: 'High Definition up to 1080p',
      desc: 'Download videos in crystal clear 1080p Full HD with synchronized high-bitrate audio.',
      icon: CheckCircle,
      gradient: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Direct MP3 Audio Extractor',
      desc: 'Rip audio directly from music videos, podcasts, and talks in 320kbps stereo quality.',
      icon: Music,
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      title: 'Mobile & Desktop Friendly',
      desc: 'Fully responsive UI optimized for iPhones, Android devices, tablets, and desktop browsers.',
      icon: Smartphone,
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      title: '100% Safe & Private',
      desc: 'We never store your personal data, logs, or search history. Direct encrypted connections.',
      icon: ShieldCheck,
      gradient: 'from-rose-400 to-red-500'
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-24 border-t border-slate-800/80">
      <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Why Choose StreamVault
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            Engineered for Speed & Quality
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Everything you need for effortless video downloads in one lightweight web tool.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-panel neon-glow-card p-6 sm:p-7 rounded-2xl border border-slate-800/80 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.gradient} flex items-center justify-center text-white mb-5 shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
