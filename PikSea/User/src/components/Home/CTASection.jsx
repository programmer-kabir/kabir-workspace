import { Link } from "react-router-dom";
import { Sparkles, Camera, ArrowRight } from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";

const CTASection = () => {
  return (
    <ScrollReveal>
      <section className="relative overflow-hidden py-32 bg-gray-50 dark:bg-[#05070D] text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
        
        {/* Background Visual Texture */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-5 dark:opacity-15 filter blur-[2px] scale-105"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2000&q=80')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-gray-50 dark:from-[#05070D] dark:via-[#05070D]/80 dark:to-[#05070D]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#00D4FF]/10 rounded-full blur-[160px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-xs">
            <Camera size={14} className="text-[#00D4FF]" />
            <span>Join The Movement</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Ready to Build with World-Class Visuals?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
            Whether you're crafting the next viral brand campaign, editorial layout, or modern web app — start downloading pure photography today.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/join-pro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-black font-black text-sm hover:brightness-110 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <span>Get Started with Pro</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white font-bold text-sm backdrop-blur-md transition-all shadow-xs"
            >
              Explore Free Library
            </Link>
          </div>

          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Commercial rights included • No attribution needed • Instant 8K access
          </p>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default CTASection;
