import ScrollReveal from "../FramerMotion/ScrollReveal";
import {
  Images,
  BadgeCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import useSiteSettings from "../../utlis/Hooks/useSiteSettings";

const iconMap = { Images, BadgeCheck, Sparkles, Wallet };

const features = [
  {
    icon: Images,
    title: "Huge Content Library",
    description:
      "Download thousands of premium vectors, photos, illustrations and design assets.",
  },
  {
    icon: BadgeCheck,
    title: "Simple Licensing",
    description:
      "Easy licensing for personal and commercial projects with peace of mind.",
  },
  {
    icon: Sparkles,
    title: "Fresh Content",
    description:
      "New high-quality resources are added regularly for creators and businesses.",
  },
  {
    icon: Wallet,
    title: "Affordable Plans",
    description:
      "Flexible pricing plans designed for freelancers, agencies and teams.",
  },
];

const WhyDayalStock = () => {
  const { data: settings = {} } = useSiteSettings();
  const activeFeatures = settings?.why_ds_features || features;
  return (
    <ScrollReveal>
    <section className="bg-gray-50 dark:bg-[#0A0A0A] py-24 relative overflow-hidden transition-colors duration-300">
      {/* Decorative background circle */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="relative mx-auto max-w-[1600px] px-4 lg:px-8 z-10">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-4 py-1.5 text-xs font-outfit font-bold text-[#00D4FF] mb-6 uppercase tracking-widest">
            {settings?.why_ds_badge || "Our Features"}
          </span>
          <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl tracking-tight">
            {settings?.why_ds_title || "Why DayalStock?"}
          </h2>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {activeFeatures.map((feature, index) => {
            const Icon = typeof feature.icon === "string" ? iconMap[feature.icon] || Images : feature.icon;

            return (
              <div
                key={index}
                className="group relative rounded-3xl bg-white dark:bg-[#111] p-8 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,212,255,0.1)] hover:-translate-y-2 text-center border border-gray-200 dark:border-white/5 hover:border-[#00D4FF]/30 magnetic-hover"
              >
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-white/10 transition-colors duration-500 group-hover:border-[#00D4FF]/50 group-hover:bg-[#00D4FF]/10">
                  <Icon
                    size={36}
                    className="text-gray-400 transition-colors duration-500 group-hover:text-[#00D4FF]"
                  />
                </div>

                <h3 className="mb-4 text-xl font-outfit font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-[#00D4FF]">
                  {feature.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 font-inter leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </ScrollReveal>
  );
};

export default WhyDayalStock;
