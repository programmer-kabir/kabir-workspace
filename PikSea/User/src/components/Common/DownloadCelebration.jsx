import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, Sparkles, X, ShieldCheck } from "lucide-react";

const DownloadCelebration = ({ isVisible, assetTitle, assetType, onClose }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isVisible) {
      // Generate 24 floating colorful confetti particle positions
      const colors = ["#00D4FF", "#6C4FE0", "#FF6B6B", "#10B981", "#F59E0B", "#EC4899"];
      const newParticles = Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: -(Math.random() * 150 + 50),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2,
      }));
      setParticles(newParticles);

      // Auto close after 4.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[120] max-w-md w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Particle Canvas / CSS Emitters */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full animate-ping opacity-75"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
                animationDuration: "1.2s",
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Ultra-Premium Glass Toast */}
        <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0c0c14]/95 border border-[#00D4FF]/40 p-4.5 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl text-gray-900 dark:text-white">
          {/* Top Gradient Ambient Beam */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00D4FF] via-[#6C4FE0] to-[#FF6B6B]" />

          <div className="flex items-start gap-3.5">
            {/* Animated Icon */}
            <div className="relative shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-[#6C4FE0]/30 border border-[#00D4FF]/40 flex items-center justify-center text-[#0088b3] dark:text-[#00D4FF]">
              <Download size={20} className="animate-bounce" />
              <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-500 dark:text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0088b3] dark:text-[#00D4FF] flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" />
                  Download Started!
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 uppercase">
                  {assetType || "Asset"}
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-0.5">
                {assetTitle || "Stock Template Package"}
              </p>

              <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck size={12} />
                  Commercial License Active
                </span>
                <span>•</span>
                <span>Ready to use in projects</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadCelebration;
