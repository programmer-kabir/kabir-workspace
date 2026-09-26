import ScrollReveal from "../FramerMotion/ScrollReveal";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import useTestimonials from "../../utlis/Hooks/useTestimonials";

const TestimonialSection = () => {
  const { data: testimonials = [] } = useTestimonials();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else if (window.innerWidth < 1280) setVisibleCount(3);
      else setVisibleCount(4);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (testimonials.length === 0) return null;

  const maxIndex = Math.max(0, testimonials.length - visibleCount);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <ScrollReveal>
    <section className="bg-gray-50 dark:bg-[#0A0A0A] py-24 relative overflow-hidden transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-[120px]" />
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-[#00D4FF]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8 z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 text-xs font-outfit font-bold text-[#8B5CF6] mb-6 uppercase tracking-widest">
              <Star size={14} className="fill-[#8B5CF6] text-[#8B5CF6]" />
              Success Stories
            </span>
            <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl tracking-tight">
              Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6]">Creators</span>
            </h2>
          </div>

          {/* Slider Controls */}
          {testimonials.length > visibleCount && (
            <div className="flex items-center gap-3">
              <button 
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shadow-sm text-gray-500 dark:text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/50 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-white/10 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextSlide}
                disabled={currentIndex === maxIndex}
                className="p-3 rounded-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shadow-sm text-gray-500 dark:text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/50 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-white/10 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Testimonials Slider */}
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
                <div
                  className="group relative flex flex-col justify-between h-full rounded-3xl bg-white dark:bg-[#111] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)] border border-gray-200 dark:border-white/5 hover:border-[#00D4FF]/30 magnetic-hover"
                >
                  {/* Quote Icon Background */}
                  <div className="absolute -top-6 -right-2 opacity-[0.03] dark:opacity-5 transition-opacity duration-500 group-hover:opacity-10">
                    <Quote size={120} className="text-gray-900 dark:text-white rotate-180" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* 5 Stars */}
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-[#00D4FF] text-[#00D4FF]" />
                      ))}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 font-inter text-base leading-relaxed mb-10 line-clamp-4">
                      "{testimonial.message}"
                    </p>
                  </div>

                  {/* Author Info */}
                  <div className="relative z-10 flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00D4FF] to-[#8B5CF6] rounded-full blur opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                      <img
                        src={testimonial.avatar_url ? `https://api.dayalstock.com/${testimonial.avatar_url}` : "https://api.dayalstock.com/images/logo/dayalstock.png"}
                        alt={testimonial.name}
                        className="relative w-12 h-12 rounded-full object-cover border-[3px] border-white dark:border-[#111] shadow-md bg-white dark:bg-[#111]"
                      />
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-gray-900 dark:text-white text-base tracking-tight group-hover:text-[#00D4FF] transition-colors">
                        {testimonial.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-500 font-inter text-xs uppercase tracking-wider mt-1">
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
