import ScrollReveal from "../FramerMotion/ScrollReveal";
import { Link } from "react-router-dom";
import useSiteSettings from "../../utlis/Hooks/useSiteSettings";

const CTASection = () => {
  const { data: settings = {} } = useSiteSettings();

  return (
    <ScrollReveal>
      <section className="relative overflow-hidden py-32 bg-white dark:bg-[#050505] transition-colors duration-300">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00D4FF]/5" />

        {/* Shapes for premium feel */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#00D4FF]/20 to-[#8B5CF6]/20 rounded-[100%] blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-7xl leading-tight tracking-tight">
            {settings?.cta_title || "Ready to Elevate Your Projects?"}
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-inter text-gray-600 dark:text-gray-400 sm:text-xl">
            {settings?.cta_description || "Join thousands of creators using our premium stock assets to build beautiful websites, apps, and designs faster."}
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to={settings?.cta_primary_btn_link || "/login"} className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] px-10 py-4 text-lg font-outfit font-semibold text-[#050505] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] inline-block">
              {settings?.cta_primary_btn_text || "Create Free Account"}
            </Link>
            <Link to={settings?.cta_secondary_btn_link || "/join-pro"} className="w-full sm:w-auto rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-10 py-4 text-lg font-outfit font-semibold text-gray-900 dark:text-white backdrop-blur-md transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-[#00D4FF]/50 dark:hover:border-[#00D4FF]/50 hover:scale-105 inline-block">
              {settings?.cta_secondary_btn_text || "Explore Pro Plans"}
            </Link>
          </div>

          <p className="mt-10 text-sm font-inter text-gray-500 uppercase tracking-widest">
            {settings?.cta_footer_text || "No credit card required for free accounts."}
          </p>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default CTASection;
