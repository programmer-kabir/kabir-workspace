import { useState } from "react";
import {
  FiSliders,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiHelpCircle,
} from "react-icons/fi";

export default function SidebarFilters({
  licenseType,
  setLicenseType,
  aiGenerated,
  setAiGenerated,
  orientation,
  setOrientation,
  hexColor,
  setHexColor,
  baseColor,
  setBaseColor,
  colorIntensity,
  setColorIntensity,
  colorPosition,
  setColorPosition,
  isOpen,
  setIsOpen,
}) {
  const [isLicenseTypeOpen, setIsLicenseTypeOpen] = useState(true);
  const [isAiGeneratedOpen, setIsAiGeneratedOpen] = useState(true);
  const [isOrientationOpen, setIsOrientationOpen] = useState(true);
  const [isColorOpen, setIsColorOpen] = useState(true);

  const handleMobileClose = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleSetLicenseType = (val) => {
    setLicenseType(val);
    handleMobileClose();
  };

  const handleSetAiGenerated = (val) => {
    setAiGenerated(val);
    handleMobileClose();
  };

  const handleSetOrientation = (val) => {
    setOrientation(val);
    handleMobileClose();
  };

  const applyColorIntensity = (hex, intensity) => {
    const cleanHex = hex.replace("#", "");

    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return "#FFFFFF";
    }

    const red = parseInt(cleanHex.slice(0, 2), 16);
    const green = parseInt(cleanHex.slice(2, 4), 16);
    const blue = parseInt(cleanHex.slice(4, 6), 16);
    const ratio = intensity / 100;

    const toHex = (number) =>
      Math.round(number)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase();

    return `#${toHex(red * ratio)}${toHex(green * ratio)}${toHex(
      blue * ratio,
    )}`;
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - chroma / 2;

    let red, green, blue;

    if (h < 60) [red, green, blue] = [chroma, x, 0];
    else if (h < 120) [red, green, blue] = [x, chroma, 0];
    else if (h < 180) [red, green, blue] = [0, chroma, x];
    else if (h < 240) [red, green, blue] = [0, x, chroma];
    else if (h < 300) [red, green, blue] = [x, 0, chroma];
    else [red, green, blue] = [chroma, 0, x];

    const toHex = (number) =>
      Math.round((number + m) * 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase();

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  };



  const handleColorWheelClick = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const radius = box.width / 2;

    const x = event.clientX - box.left - radius;
    const y = event.clientY - box.top - radius;
    const distance = Math.sqrt(x * x + y * y);

    if (distance > radius) return;

    const positionX = ((x + radius) / (radius * 2)) * 100;
    const positionY = ((y + radius) / (radius * 2)) * 100;

    setColorPosition({
      x: positionX,
      y: positionY,
    });

    let hue = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (hue < 0) hue += 360;

    const saturation = Math.min(100, (distance / radius) * 100);
    const selectedBaseColor = hslToHex(hue, saturation, 50);

    setBaseColor(selectedBaseColor);
    setHexColor(applyColorIntensity(selectedBaseColor, colorIntensity));
  };

  const handleIntensityChange = (event) => {
    const newIntensity = Number(event.target.value);

    setColorIntensity(newIntensity);
    setHexColor(applyColorIntensity(baseColor, newIntensity));
  };

  const handleHexChange = (event) => {
    const typedColor = event.target.value.toUpperCase();

    setHexColor(typedColor);

    if (/^#[0-9A-F]{6}$/.test(typedColor)) {
      setBaseColor(typedColor);
      setColorIntensity(100);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 h-screen overflow-y-auto border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#050505] transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:shrink-0 ${
        isOpen
          ? "translate-x-0 w-full opacity-100 visible lg:w-[300px]"
          : "-translate-x-full w-full opacity-0 invisible lg:w-0 lg:translate-x-0 lg:border-none"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3 px-7 py-4">
          <FiSliders className="text-[21px] text-gray-900 dark:text-gray-200" />
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white font-outfit tracking-wide">Filters</h3>
        </div>

        <button 
          onClick={() => setIsOpen(false)}
          className="flex h-[53px] w-8 items-center justify-center border-l border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiChevronLeft className="text-xl" />
        </button>
      </div>

      <FilterSection
        title="License Type"
        isOpen={isLicenseTypeOpen}
        onToggle={() => setIsLicenseTypeOpen((previous) => !previous)}
      >
        <RadioItem
          name="licenseType"
          label="All"
          value="all"
          selected={licenseType}
          setSelected={handleSetLicenseType}
        />
        <RadioItem
          name="licenseType"
          label="Free License"
          value="free"
          selected={licenseType}
          setSelected={handleSetLicenseType}
          helpText="Free to use content"
        />
        <RadioItem
          name="licenseType"
          label="Premium"
          value="premium"
          selected={licenseType}
          setSelected={handleSetLicenseType}
          helpText="Premium licensed content"
        />
        <RadioItem
          name="licenseType"
          label="Editorial Use Only"
          value="editorial"
          selected={licenseType}
          setSelected={handleSetLicenseType}
          helpText="Only for editorial use"
        />
      </FilterSection>

      <FilterSection
        title="AI Generated"
        isOpen={isAiGeneratedOpen}
        onToggle={() => setIsAiGeneratedOpen((previous) => !previous)}
      >
        <RadioItem
          name="aiGenerated"
          label="All"
          value="all"
          selected={aiGenerated}
          setSelected={handleSetAiGenerated}
        />
        <RadioItem
          name="aiGenerated"
          label="Only AI Images"
          value="only-ai"
          selected={aiGenerated}
          setSelected={handleSetAiGenerated}
        />
        <RadioItem
          name="aiGenerated"
          label="Non-AI Images"
          value="non-ai"
          selected={aiGenerated}
          setSelected={handleSetAiGenerated}
        />
      </FilterSection>

      <FilterSection
        title="Orientation"
        isOpen={isOrientationOpen}
        onToggle={() => setIsOrientationOpen((previous) => !previous)}
      >
        <SquareRadioItem
          label="Horizontal"
          value="horizontal"
          selected={orientation}
          setSelected={handleSetOrientation}
        />
        <SquareRadioItem
          label="Vertical"
          value="vertical"
          selected={orientation}
          setSelected={handleSetOrientation}
        />
        <SquareRadioItem
          label="Square"
          value="square"
          selected={orientation}
          setSelected={handleSetOrientation}
        />
        <SquareRadioItem
          label="Panoramic"
          value="panoramic"
          selected={orientation}
          setSelected={handleSetOrientation}
        />
      </FilterSection>

      <div className="border-b border-gray-200 dark:border-white/5">
        <button
          onClick={() => setIsColorOpen((previous) => !previous)}
          className="flex w-full items-center justify-between px-7 py-6 text-left"
        >
          <span className="text-[14px] font-bold text-gray-900 dark:text-gray-200">Color</span>
          {isColorOpen ? (
            <FiChevronUp className="text-lg text-gray-500" />
          ) : (
            <FiChevronDown className="text-lg text-gray-500" />
          )}
        </button>

        {isColorOpen && (
          <div className="px-7 pb-7">
            <div
              className="relative mx-auto h-[208px] w-[208px] cursor-crosshair rounded-full"
              onClick={handleColorWheelClick}
            >
              <div className="color-wheel h-full w-full rounded-full" />

              <div
                className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#111] shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{
                  left: `${colorPosition?.x ?? 50}%`,
                  top: `${colorPosition?.y ?? 50}%`,
                  backgroundColor: hexColor || "#FFFFFF",
                }}
              />
            </div>

            <div
              className="mt-5 h-[22px] w-full rounded-full p-[2px]"
              style={{
                background: `linear-gradient(to right, #000000, ${
                  baseColor || "#FFFFFF"
                })`,
              }}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={colorIntensity}
                onChange={handleIntensityChange}
                className="color-range h-full w-full cursor-pointer appearance-none rounded-full bg-transparent"
              />
            </div>

            <div className="relative mt-4">
              <div
                className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded border border-gray-200 dark:border-white/20 shadow-sm"
                style={{ backgroundColor: hexColor || "#FFFFFF" }}
              />

              <input
                value={hexColor}
                onChange={handleHexChange}
                placeholder="#Hex color code"
                className="h-10 w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] pl-11 pr-3 text-sm text-gray-900 dark:text-gray-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-[#00D4FF]/50 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .color-wheel {
          background: conic-gradient(
            #ff0000,
            #ff8a00,
            #ffff00,
            #50ff00,
            #00d84a,
            #00dfff,
            #0066ff,
            #3d00ff,
            #9c00ff,
            #ff00bb,
            #ff0062,
            #ff0000
          );
          position: relative;
        }

        .color-wheel::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(5, 5, 5, 1) 0%,
            rgba(5, 5, 5, 0.08) 52%,
            rgba(5, 5, 5, 0) 72%
          );
        }

        .color-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111;
          border: 2px solid #333;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }

        .color-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111;
          border: 2px solid #333;
          cursor: pointer;
        }
      `}</style>
    </aside>
  );
}

function FilterSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-gray-200 dark:border-white/5">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-7 py-6 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <span className="text-[14px] font-bold text-gray-900 dark:text-gray-200">{title}</span>

        {isOpen ? (
          <FiChevronUp className="text-lg text-gray-500" />
        ) : (
          <FiChevronDown className="text-lg text-gray-500" />
        )}
      </button>

      {isOpen && <div className="space-y-3 px-7 pb-6">{children}</div>}
    </div>
  );
}

function RadioItem({ name, label, value, selected, setSelected, helpText }) {
  const active = selected === value;

  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        onChange={() => setSelected(value)}
        className="sr-only"
      />

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          active ? "border-[#00D4FF]" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5"
        }`}
      >
        {active && <span className="h-3 w-3 rounded-full bg-[#00D4FF]" />}
      </span>

      <span className="flex items-center gap-1 text-[14px] text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
        {label}
        {helpText && (
          <span title={helpText}>
            <FiHelpCircle className="text-[16px] text-gray-600" />
          </span>
        )}
      </span>
    </label>
  );
}

function SquareRadioItem({ label, value, selected, setSelected }) {
  const active = selected === value;

  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="radio"
        name="orientation"
        value={value}
        checked={active}
        onChange={() => setSelected(value)}
        className="sr-only"
      />

      <span
        className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
          active
            ? "border-[#00D4FF] bg-[#00D4FF]"
            : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 group-hover:border-gray-400 dark:group-hover:border-gray-500"
        }`}
      >
        {active && (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 fill-none stroke-white dark:stroke-[#050505] stroke-[3]"
          >
            <path d="M5 12.5l4.2 4.2L19.5 6.8" />
          </svg>
        )}
      </span>

      <span className="text-[14px] text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">{label}</span>
    </label>
  );
}