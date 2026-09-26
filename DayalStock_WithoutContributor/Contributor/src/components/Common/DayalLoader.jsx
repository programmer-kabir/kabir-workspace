import React from "react";
import { motion } from "framer-motion";

/**
 * DayalLoader - Ultra-Premium Glowing Brand Loader for Contributor Portal
 * @param {string} text - Dynamic loading status text
 * @param {string} size - 'sm' | 'md' | 'lg' | 'fullscreen'
 * @param {boolean} isOverlay - Whether to render as frosted glass overlay
 */
const DayalLoader = ({ text = "Processing...", size = "md", isOverlay = false }) => {
  const isSmall = size === "sm";
  const isLarge = size === "lg" || size === "fullscreen";

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Orbital Glowing Rings Container */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow Aura */}
        <div 
          className={`absolute rounded-full bg-gradient-to-r from-[#ff7900]/40 via-[#ff9400]/20 to-[#00D4FF]/30 filter blur-xl animate-pulse ${
            isSmall ? "w-16 h-16" : isLarge ? "w-36 h-36" : "w-24 h-24"
          }`} 
        />

        {/* Outer Orbit Ring (Orange -> Amber) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          className={`rounded-full border-2 border-transparent border-t-[#ff7900] border-r-[#ff9400]/40 shadow-[0_0_15px_rgba(255,121,0,0.3)] ${
            isSmall ? "w-12 h-12" : isLarge ? "w-24 h-24 border-[3px]" : "w-18 h-18 border-[2.5px]"
          }`}
        />

        {/* Inner Counter-Orbit Ring (Cyan -> Violet) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          className={`absolute rounded-full border-2 border-transparent border-b-[#00D4FF] border-l-[#8B5CF6]/50 shadow-[0_0_12px_rgba(0,212,255,0.3)] ${
            isSmall ? "w-8 h-8" : isLarge ? "w-16 h-16 border-[2.5px]" : "w-12 h-12 border-2"
          }`}
        />

        {/* Center Pulsing Logo Badge */}
        <motion.div
          animate={{ scale: [0.94, 1.06, 0.94] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute rounded-2xl bg-gradient-to-tr from-[#ff7900] via-[#ff8800] to-[#ffaa00] flex items-center justify-center shadow-[0_4px_20px_rgba(255,121,0,0.4)] ${
            isSmall ? "w-6 h-6 rounded-lg" : isLarge ? "w-12 h-12 rounded-2xl" : "w-8 h-8 rounded-xl"
          }`}
        >
          <span className={`font-black text-white font-outfit ${isSmall ? "text-xs" : isLarge ? "text-xl" : "text-sm"}`}>
            D
          </span>
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
            {/* Animated Loading Dots */}
            <span className="flex space-x-1 ml-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#ff7900] inline-block"
                />
              ))}
            </span>
          </div>

          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
            DayalStock Contributor Gateway
          </p>
        </motion.div>
      )}

      {/* Shimmering Progress Bar Accent */}
      <div className="mt-3 w-28 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden relative">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-[#ff7900] to-transparent"
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
        className="absolute inset-0 z-50 rounded-[26px] bg-white/80 dark:bg-[#0B0B0C]/85 flex items-center justify-center backdrop-blur-md shadow-2xl"
      >
        {loaderContent}
      </motion.div>
    );
  }

  if (size === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-[#050505]/95 backdrop-blur-xl">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default DayalLoader;
