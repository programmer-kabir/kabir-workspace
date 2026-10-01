import { useState, useEffect } from "react";
import { Quote, Star, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";
import useTestimonials from "../../utlis/Hooks/useTestimonials";

const defaultTestimonials = [
  {
    id: 1,
    name: "Marcus Vance",
    designation: "Art Director, Studio Nine",
    message: "PikSea has fundamentally replaced our previous stock subscriptions. The dynamic range, optical sharpness, and EXIF authenticity are unmatched in the industry.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
  },
  {
    id: 2,
    name: "Elena Rostova",
    designation: "Lead Brand Designer, Mono",
    message: "Zero vector clutter, zero cheap mockups — just pure, breathtaking photographic art. Finding 8K uncompressed assets for billboard campaigns has never been this seamless.",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200"
  },
  {
    id: 3,
    name: "Julian Brooks",
    designation: "Editorial Director, Aperture Magazine",
    message: "The curation standards here are exemplary. Every portrait and landscape feels like it was commissioned specifically for our print issues.",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200"
  },
  {
    id: 4,
    name: "Sarah Chen",
    designation: "Creative Producer, VisualPulse",
    message: "The commercial licensing peace-of-mind combined with instant unthrottled CDN downloads makes PikSea our agency's daily go-to platform.",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"
  }
];

const TestimonialSection = () => {
  const { data: dbTestimonials = [] } = useTestimonials();
  const testimonials = dbTestimonials.length > 0 ? dbTestimonials : defaultTestimonials;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setVisibleCount(1);
      else if (window.innerWidth < 1280) setVisibleCount(2);
      else setVisibleCount(3);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, testimonials.length - visibleCount);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <ScrollReveal>
      <section className="bg-white dark:bg-[#05070D] py-28 relative overflow-hidden transition-colors duration-300">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-[#00D4FF]/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-3">
                <CheckCircle2 size={14} />
                <span>Verified Creator Feedback</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Trusted by Visionary Visual Artists
              </h2>
            </div>

            {/* Slider Controls */}
            {testimonials.length > visibleCount && (
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF] hover:text-[#00D4FF] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={currentIndex === maxIndex}
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF] hover:text-[#00D4FF] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Testimonial Cards Slider */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full shrink-0 px-3"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <div className="group relative flex flex-col justify-between h-full rounded-3xl bg-gray-50 dark:bg-[#0A0E1A] p-8 sm:p-10 border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/40 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-950/20">
                    
                    <div className="relative z-10">
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={15} className="fill-[#00D4FF] text-[#00D4FF]" />
                        ))}
                      </div>

                      {/* Quote Text */}
                      <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-8">
                        "{testimonial.message}"
                      </p>
                    </div>

                    {/* Author Profile */}
                    <div className="relative z-10 flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-white/10 mt-auto">
                      <img
                        src={testimonial.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-white/20 shadow-sm"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                          {testimonial.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {testimonial.designation}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </ScrollReveal>
  );
};

export default TestimonialSection;
