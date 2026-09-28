import ScrollReveal from "../FramerMotion/ScrollReveal";
import { CheckCircle } from "lucide-react";
import shape from "../../assets/shape.svg";
import { Link } from "react-router-dom";
import useSiteSettings from "../../utlis/Hooks/useSiteSettings";

const JoinProSection = () => {
  const { data: settings = {} } = useSiteSettings();
  
  const features = settings?.join_pro_features || [
    "Millions of curated high-resolution photos",
    "Unlimited 4K & 8K full-res downloads",
    "Commercial & editorial rights included",
    "No attribution required",
    "Save to unlimited custom collections",
    "Instant CDN downloads with zero wait",
    "Priority 24/7 creator support",
    "Exclusive raw camera EXIF metadata",
  ];

  return (
    <ScrollReveal>
    <section className="relative overflow-hidden py-24 bg-white dark:bg-[#070B12] transition-colors duration-300">
      {/* Decorative Glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0284C7]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-[1600px] px-4 lg:px-8 relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Side */}
          <div className="relative group">
            {/* Background Shape */}
            <img
              src={shape}
              alt=""
              className="absolute -left-120 top-1/6 w-[750px] -translate-y-1/2 pointer-events-none select-none opacity-10 filter blur-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0284C7]/20 to-[#06B6D4]/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-0 group-hover:opacity-100" />

            {/* Main Image */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0F172A]">
              <img
                src={settings?.join_pro_image ? `https://api.dayalstock.com/${settings.join_pro_image}` : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200"}
                alt="PikSea Pro"
                className="relative z-10 h-[440px] w-full object-cover shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] to-transparent opacity-60 z-20" />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-5 py-2 backdrop-blur-md w-fit">
              <span className="text-xl">📸</span>
              <span className="font-outfit font-bold bg-gradient-to-r from-[#0284C7] via-[#06B6D4] to-[#38BDF8] bg-clip-text text-transparent uppercase tracking-wider">
                {settings?.join_pro_badge || "PikSea Pro"}
              </span>
            </div>
            
            <h2 className="mb-8 text-4xl font-outfit font-bold tracking-tight text-gray-900 dark:text-white lg:text-5xl leading-[1.2]">
              {settings?.join_pro_title || "Unlock Unlimited Photography"}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
              {features.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 p-4 transition-all duration-300 hover:border-[#00D4FF]/30 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <CheckCircle
                    size={22}
                    className="shrink-0 text-[#00D4FF] mt-0.5"
                  />
                  <span className="text-sm font-inter text-gray-700 dark:text-gray-300 leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 flex">
              <Link to={settings?.join_pro_btn_link || "/join-pro"} className="rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] px-10 py-4 text-base font-outfit font-bold text-[#050505] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                {settings?.join_pro_btn_text || "Start Your Free Trial"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    </ScrollReveal>
  );
};

export default JoinProSection;
