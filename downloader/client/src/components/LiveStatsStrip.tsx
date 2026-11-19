import React from 'react';
import { Zap, Film, Sparkles, ShieldCheck, Activity } from 'lucide-react';

export const LiveStatsStrip: React.FC = () => {
  const stats = [
    {
      value: '1.2s',
      title: 'Ultra-Fast Extraction',
      subtitle: 'Average speed to resolve media',
      tag: 'Real-Time',
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20 hover:border-amber-500/50',
      glowColor: 'group-hover:shadow-amber-500/20'
    },
    {
      value: '1080p / 4K',
      title: 'Crystal Clear Quality',
      subtitle: 'Original source video bitrate',
      tag: 'Ultra HD',
      icon: Film,
      gradient: 'from-purple-400 to-indigo-500',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20 hover:border-purple-500/50',
      glowColor: 'group-hover:shadow-purple-500/20'
    },
    {
      value: '100%',
      title: 'No Watermark',
      subtitle: 'Clean TikTok & Reels export',
      tag: 'Watermark-Free',
      icon: Sparkles,
      gradient: 'from-cyan-400 to-blue-500',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20 hover:border-cyan-500/50',
      glowColor: 'group-hover:shadow-cyan-500/20'
    },
    {
      value: 'Zero Logs',
      title: 'Private & Secure',
      subtitle: 'No search history or IP stored',
      tag: 'Encrypted',
      icon: ShieldCheck,
      gradient: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
      glowColor: 'group-hover:shadow-emerald-500/20'
    }
  ];

  return (
    <section className="relative max-w-5xl mx-auto px-4 sm:px-6 my-10">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-2xl pointer-events-none" />

      {/* Top Header Tag */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800 shadow-sm backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Real-Time Engine Benchmarks & Trust Metrics</span>
        </span>
      </div>

      {/* 4 Glowing Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`group relative glass-panel rounded-2xl p-5 sm:p-6 border ${item.borderColor} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${item.glowColor} overflow-hidden`}
            >
              {/* Subtle card corner shine */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.03] rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              {/* Icon & Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center text-white border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${item.textColor}`} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.bgColor} ${item.textColor} border border-white/10`}>
                  {item.tag}
                </span>
              </div>

              {/* Number / Value */}
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${item.textColor} mb-1.5 font-mono group-hover:tracking-wider transition-all duration-300`}>
                {item.value}
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {item.subtitle}
              </p>
            </div>
          );
        })}
      </div>

    </section>
  );
};
