import { Camera, ShieldCheck, Sparkles, Zap, Award, Compass } from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";

const features = [
  {
    icon: Camera,
    badge: "Optical Perfection",
    title: "Pure Photography Standard",
    description: "Every photograph is reviewed for optical sharpness, chromatic balance, dynamic range, and authentic composition.",
  },
  {
    icon: ShieldCheck,
    badge: "100% Cleared",
    title: "Universal Commercial License",
    description: "Worry-free commercial & editorial rights with zero attribution requirements. Built for global brand campaigns.",
  },
  {
    icon: Sparkles,
    badge: "Human Curated",
    title: "Transparent & Verified Assets",
    description: "Clear AI vs Camera shot tags, complete EXIF camera parameters, and curated collections by professional visual editors.",
  },
  {
    icon: Zap,
    badge: "Ultra Fast",
    title: "Lossless 8K & RAW Downloads",
    description: "Lightning-speed edge CDN delivery of uncompressed original files ready for massive billboards and 4K displays.",
  },
];

const WhyPikSea = () => {
  return (
    <ScrollReveal>
      <section className="bg-white dark:bg-[#05070D] py-28 relative overflow-hidden transition-colors duration-300">
        
        {/* Geometric Light Cones in Background */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00D4FF]/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#0284C7]/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-4">
              <Award size={14} />
              <span>The PikSea Distinction</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Engineered for Creators Who Demand Perfection.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-4">
              We ditched generic vector graphics and low-res illustrations to focus 100% on pure, world-class stock photography.
            </p>
          </div>

          {/* 4 Architectural Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-3xl p-8 bg-gray-50 dark:bg-[#0A0E1A] border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-950/20 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Icon & Badge */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white group-hover:bg-[#00D4FF] group-hover:text-black group-hover:border-transparent transition-all duration-300 shadow-sm">
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-200/50 dark:bg-white/5">
                        {item.badge}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#00D4FF] transition-colors mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Index Accent */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs text-gray-400 font-mono">
                    <span>STANDARD // 0{idx + 1}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </ScrollReveal>
  );
};

export default WhyPikSea;
