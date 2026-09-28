import React from "react";
import { Link } from "react-router-dom";

export const HeronIcon = ({ size = 38, className = "" }) => (
  <img
    src="/piksea-icon.webp"
    alt="PikSea"
    width={size}
    height={size}
    className={`inline-block object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 select-none ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
    onError={(e) => {
      e.target.src = "/piksea-icon.png";
    }}
  />
);

export const PikSeaHeronMark = HeronIcon;

const PikSeaLogo = ({
  size = "md",
  showText = true,
  className = "",
  isLink = true,
  subtitle = "Creator Studio",
  variant = "full",
}) => {
  const iconSizes = {
    sm: 30,
    md: 40,
    lg: 52,
    xl: 66,
  };

  const titleSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const subtitleSizes = {
    sm: "text-[7.5px] tracking-[0.18em]",
    md: "text-[9px] tracking-[0.22em]",
    lg: "text-[11px] tracking-[0.25em]",
    xl: "text-[13px] tracking-[0.28em]",
  };

  const content = (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      <HeronIcon size={iconSizes[size] || 40} />

      {showText && variant !== "icon-only" && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-black font-outfit tracking-tight text-gray-900 dark:text-white transition-colors duration-200 ${
                titleSizes[size] || "text-2xl"
              }`}
            >
              Pik
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] via-[#00D4FF] to-[#38BDF8]">
                Sea
              </span>
            </span>
          </div>

          {subtitle && (
            <span
              className={`font-bold font-inter uppercase text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200 ${
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
      <Link to="/" className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default PikSeaLogo;
