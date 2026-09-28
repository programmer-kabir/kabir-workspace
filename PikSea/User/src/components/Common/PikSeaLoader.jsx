import React from "react";
import { motion } from "framer-motion";
import { HeronIcon } from "./PikSeaLogo";

/**
 * PikSeaLoader - Ocean Heron Pulse Brand Loader
 * @param {string} text - Dynamic loading status text
 * @param {string} size - 'sm' | 'md' | 'lg' | 'fullscreen'
 * @param {boolean} isOverlay - Whether to render as frosted glass overlay
 */
const PikSeaLoader = ({ text = "Loading PikSea...", size = "md", isOverlay = false }) => {
  const isSmall = size === "sm";
  const isLarge = size === "lg" || size === "fullscreen";

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Ocean Ring & Heron Container */}
      <div className="relative flex items-center justify-center">
        {/* Ocean Glow Aura */}
        <div 
          className={`absolute rounded-full bg-gradient-to-r from-[#0284C7]/40 via-[#06B6D4]/30 to-[#38BDF8]/40 filter blur-xl animate-pulse ${
            isSmall ? "w-16 h-16" : isLarge ? "w-36 h-36" : "w-24 h-24"
          }`} 
        />

        {/* Outer Orbit Wave Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
          className={`rounded-full border-2 border-transparent border-t-[#0284C7] border-r-[#06B6D4]/50 shadow-[0_0_15px_rgba(2,132,199,0.35)] ${
            isSmall ? "w-12 h-12" : isLarge ? "w-24 h-24 border-[3px]" : "w-18 h-18 border-[2.5px]"
          }`}
        />

        {/* Inner Counter-Orbit Water Ripple */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2.0, repeat: Infinity, ease: "linear" }}
          className={`absolute rounded-full border-2 border-transparent border-b-[#38BDF8] border-l-[#0EA5E9]/50 shadow-[0_0_12px_rgba(56,189,248,0.3)] ${
            isSmall ? "w-8 h-8" : isLarge ? "w-16 h-16 border-[2.5px]" : "w-12 h-12 border-2"
          }`}
        />

        {/* Center Pulsing Heron Icon */}
        <motion.div
          animate={{ scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border border-cyan-500/30 flex items-center justify-center shadow-[0_4px_20px_rgba(6,182,212,0.3)] ${
            isSmall ? "w-7 h-7 rounded-lg" : isLarge ? "w-14 h-14 rounded-2xl" : "w-10 h-10 rounded-xl"
          }`}
        >
          <HeronIcon size={isSmall ? 18 : isLarge ? 36 : 24} theme="dark" />
        </motion.div>
      </div>

      {/* Dynamic Animated Status Text */}
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 flex flex-col items-center gap-1.5"
        >
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight font-outfit text-gray-800 dark:text-gray-100 ${
              isSmall ? "text-xs" : "text-sm sm:text-base"
            }`}>
              {text}
            </span>
            <span className="flex space-x-1 ml-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#0284C7] inline-block"
                />
              ))}
            </span>
          </div>

          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
            PikSea
          </p>
        </motion.div>
      )}

      {/* Shimmering Ocean Wave Bar */}
      <div className="mt-3 w-28 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden relative">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"
        />
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 z-50 rounded-[26px] bg-white/80 dark:bg-[#0B0F17]/85 flex items-center justify-center backdrop-blur-md shadow-2xl"
      >
        {loaderContent}
      </motion.div>
    );
  }

  if (size === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-[#070B12]/95 backdrop-blur-xl">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default PikSeaLoader;
