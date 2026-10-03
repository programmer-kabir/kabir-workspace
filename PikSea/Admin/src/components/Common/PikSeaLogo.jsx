import React from "react";
import { Link } from "react-router-dom";

/**
 * HeronIcon - Master transparent Heron Brand Icon
 * Supports light background (black icon) and dark background (white icon)
 * @param {number} size - Icon width/height in px
 * @param {'auto' | 'light' | 'dark'} theme - 'auto' (adapts to Tailwind dark:), 'light' (black for white bg), 'dark' (white for dark bg)
 * @param {string} className - Additional CSS classes
 */
export const HeronIcon = ({ size = 40, theme = "auto", className = "" }) => {
  const themeClass =
    theme === "dark"
      ? "brightness-0 invert"
      : theme === "light"
        ? "brightness-0"
        : "dark:brightness-0 dark:invert transition-all duration-200";

  return (
    <img
      src="/piksea-icon.webp"
      alt="PikSea"
      width={size}
      height={size}
      className={`inline-block object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 select-none ${themeClass} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onError={(e) => {
        e.target.src = "/piksea-icon.png";
      }}
    />
  );
};

export const PikSeaHeronMark = HeronIcon;

/**
 * PikSeaLogo - Master Responsive Brand Logo
 * Automatic White / Black Background Adaptation
 * @param {'sm' | 'md' | 'lg' | 'xl'} size
 * @param {boolean} showText
 * @param {'auto' | 'light' | 'dark'} theme
 * @param {string} subtitle
 * @param {boolean} isLink
 * @param {string} linkTo
 * @param {string} className
 * @param {'full' | 'icon-only'} variant
 */
const PikSeaLogo = ({
  size = "md",
  showText = true,
  theme = "auto",
  className = "",
  isLink = true,
  linkTo = "/dashboard",
  subtitle = "ADMIN CONSOLE",
  variant = "full",
}) => {
  const iconSizes = {
    sm: 34,
    md: 44,
    lg: 56,
    xl: 72,
  };

  const titleSizes = {
    sm: "text-xl",
    md: "text-2xl sm:text-[26px]",
    lg: "text-3xl sm:text-4xl",
    xl: "text-4xl sm:text-5xl",
  };

  const subtitleSizes = {
    sm: "text-[7.5px] tracking-[0.20em]",
    md: "text-[9px] tracking-[0.22em]",
    lg: "text-[11px] tracking-[0.25em]",
    xl: "text-[13px] tracking-[0.28em]",
  };

  const textColorClass =
    theme === "dark"
      ? "text-white"
      : theme === "light"
        ? "text-gray-900"
        : "text-white";

  const subtitleColorClass =
    theme === "dark"
      ? "text-cyan-400"
      : theme === "light"
        ? "text-cyan-600"
        : "text-cyan-400";

  const content = (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
      {/* Heron Master Transparent Brand Icon */}
      <HeronIcon size={iconSizes[size] || 44} theme={theme} />

      {/* Typography */}
      {showText && variant !== "icon-only" && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-black font-outfit tracking-tight transition-colors duration-200 ${textColorClass} ${
                titleSizes[size] || "text-2xl"
              }`}
            >
              Pik
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] via-[#00D4FF] to-[#38BDF8] drop-shadow-[0_0_12px_rgba(0,212,255,0.3)]">
                Sea
              </span>
            </span>
          </div>

          {subtitle && (
            <span
              className={`font-bold font-inter uppercase mt-1 transition-colors duration-200 ${subtitleColorClass} ${
                subtitleSizes[size] || "text-[9px] tracking-[0.22em]"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (isLink) {
    return (
      <Link to={linkTo} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default PikSeaLogo;
