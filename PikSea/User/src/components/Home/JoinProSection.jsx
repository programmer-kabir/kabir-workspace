import { Link } from "react-router-dom";
import { Check, Sparkles, Zap, Shield, Crown, ArrowRight } from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";

const perks = [
  "Unlimited 4K & 8K full-resolution photo downloads",
  "Universal commercial clearance for client & brand projects",
  "Complete RAW camera EXIF metadata & color profiles",
  "Unlimited private & public photo moodboards / collections",
  "Zero download speed limits or daily countdown timers",
  "Early access to exclusive weekly editorial drops",
];

const JoinProSection = () => {
  return (
    <ScrollReveal>
      <section className="relative overflow-hidden py-28 bg-gray-50 dark:bg-[#06080F] transition-colors duration-300">
        
        {/* Ambient Backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-[#00D4FF]/10 via-[#0284C7]/10 to-[#00D4FF]/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
          
          <div className="relative rounded-[36px] overflow-hidden bg-white dark:bg-[#0A0E1A] border border-gray-200 dark:border-white/10 shadow-2xl p-8 sm:p-12 lg:p-16">
            
            {/* Subtle Matrix Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              {/* Left Column: Heading & Perks */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#00D4FF]/15 to-[#0284C7]/15 border border-[#00D4FF]/30 text-[#00D4FF] text-xs font-black uppercase tracking-widest mb-6">
                  <Crown size={14} />
                  <span>PikSea Pro Studio Pass</span>
                </div>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                  Elevate Your Visuals with Unlimited Pro Access.
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                  Join creative agencies, global art directors, and visionaries who build with PikSea Pro photography every day.
                </p>

                {/* 2-column Perks Grid */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {perks.map((perk, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00D4FF]/20 text-[#00D4FF] mt-0.5">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    to="/join-pro"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#0284C7] text-black font-black text-sm hover:brightness-110 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                  >
                    <span>Get PikSea Pro Pass</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/search"
                    className="inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold text-sm transition-all"
                  >
                    Browse Free Photos
                  </Link>
                </div>
              </div>

              {/* Right Column: Holographic Pro Pass Visual Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm aspect-[1.586/1] rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white/15 via-white/5 to-white/0 dark:from-[#131A2B] dark:via-[#0E1524] dark:to-[#070B14] border border-white/20 dark:border-white/15 shadow-2xl backdrop-blur-2xl text-white flex flex-col justify-between overflow-hidden group hover:scale-105 transition-transform duration-500">
                  
                  {/* Holographic Shimmer Accent */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00D4FF]/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-[#00D4FF] flex items-center justify-center text-black font-black text-xs">
                        P
                      </div>
                      <span className="font-black text-lg tracking-wider">PIKSEA</span>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-[#00D4FF] bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full uppercase">
                      STUDIO PASS
                    </span>
                  </div>

                  {/* Card Middle: Chip & Details */}
                  <div className="my-6 z-10">
                    <div className="h-9 w-12 rounded-lg bg-gradient-to-br from-amber-200/80 to-amber-500/60 border border-amber-300/40 mb-3" />
                    <p className="text-xs text-gray-400 font-mono tracking-widest">
                      UNLIMITED COMMERCIAL LICENSE
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-end justify-between z-10 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">MEMBER</p>
                      <p className="text-xs font-bold tracking-wider">GLOBAL CREATOR</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">ACCESS</p>
                      <p className="text-xs font-bold text-[#00D4FF]">8K UNRESTRICTED</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>
    </ScrollReveal>
  );
};

export default JoinProSection;
