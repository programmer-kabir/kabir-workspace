import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    'Connecting to video platform...',
    'Extracting high-resolution stream...',
    'Analyzing audio & video tracks...',
    'Preparing download links...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1550px] mx-auto px-6 sm:px-10 lg:px-16 mb-20 animate-pulse">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Skeleton Thumbnail */}
          <div className="md:col-span-5 aspect-video rounded-2xl bg-slate-800/60 relative overflow-hidden flex items-center justify-center border border-slate-700/50">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>

          {/* Skeleton Details */}
          <div className="md:col-span-7 space-y-4">
            <div className="h-6 bg-slate-800/80 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
            
            <div className="pt-4 border-t border-slate-800/60 space-y-3">
              <div className="h-12 bg-slate-800/60 rounded-xl w-full" />
              <div className="h-12 bg-slate-800/40 rounded-xl w-full" />
            </div>

            {/* Dynamic Status Progress */}
            <div className="flex items-center gap-2 pt-2 text-xs font-medium text-indigo-400">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{steps[stepIndex]}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};