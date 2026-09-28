import ScrollReveal from "../FramerMotion/ScrollReveal";
import {
  Camera,
  BadgeCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import useSiteSettings from "../../utlis/Hooks/useSiteSettings";

const iconMap = { Camera, BadgeCheck, Sparkles, Zap };

const features = [
  {
    icon: Camera,
    title: "Pure Stock Photography",
    description:
      "Curated high-resolution stock photos captured by world-class photographers with crystal clear sharpness.",
  },
  {
    icon: BadgeCheck,
    title: "Commercial Licensing",
    description:
      "Simple, royalty-free commercial and editorial licenses for marketing, ads, and digital publishing.",
  },
  {
    icon: Sparkles,
    title: "Fresh Daily Shots",
    description:
      "Authentic, unposed photography and diverse perspectives added daily across every category.",
  },
  {
    icon: Zap,
    title: "Instant 4K & 8K Downloads",
    description:
      "High-speed CDN delivery of full-resolution original image files with complete EXIF camera data.",
  },
];

const WhyPikSea = () => {
  const { data: settings = {} } = useSiteSettings();
  const activeFeatures = settings?.why_ds_features || features;
  return (
    <ScrollReveal>
      <section className="bg-gray-50 dark:bg-[#070B12] py-24 relative overflow-hidden transition-colors duration-300">
        {/* Ocean Decorative background circle */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#0284C7]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative mx-auto max-w-[1600px] px-4 lg:px-8 z-10">
          {/* Heading */}
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border border-[#0284C7]/30 bg-[#0284C7]/10 px-4 py-1.5 text-xs font-outfit font-bold text-[#0284C7] mb-6 uppercase tracking-widest">
              {settings?.why_ds_badge || "Why Choose PikSea"}
            </span>
            <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl tracking-tight">
              {settings?.why_ds_title || "Pure Photography. Infinite Inspiration."}
            </h2>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {activeFeatures.map((feature, index) => {
              const Icon = typeof feature.icon === "string" ? iconMap[feature.icon] || Camera : feature.icon;

              return (
                <div
                  key={index}
                  className="group relative rounded-3xl bg-white dark:bg-[#0F172A] p-8 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(2,132,199,0.15)] hover:-translate-y-2 text-center border border-gray-200 dark:border-white/5 hover:border-[#0284C7]/40"
                >
                  <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50 dark:bg-[#070B12] border border-gray-200 dark:border-white/10 transition-colors duration-500 group-hover:border-[#0284C7]/50 group-hover:bg-[#0284C7]/10">
                    <Icon
                      size={36}
                      className="text-gray-400 transition-colors duration-500 group-hover:text-[#0284C7]"
                    />
                  </div>

                  <h3 className="mb-4 text-xl font-outfit font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-[#0284C7]">
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

export default WhyPikSea;
