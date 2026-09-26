import React from 'react';
import { FINGER_ZONES, KEY_TO_FINGER } from '../../data/typingCurriculum';

const VisualHandGuide = ({ activeChar = 'f', isError = false }) => {
  const targetChar = activeChar === ' ' ? ' ' : activeChar;
  const currentFingerZone = KEY_TO_FINGER[targetChar] || FINGER_ZONES.thumbs;

  const getFingerHighlight = (fingerId) => {
    const isTarget = currentFingerZone?.id === fingerId;
    if (!isTarget) {
      return {
        fill: 'currentColor',
        opacity: 0.15,
        stroke: 'currentColor',
        strokeWidth: 1.5,
        filter: 'none'
      };
    }

    return {
      fill: isError ? '#ef4444' : currentFingerZone.color,
      opacity: 0.95,
      stroke: '#ffffff',
      strokeWidth: 2.5,
      filter: `drop-shadow(0 0 10px ${isError ? '#ef4444' : currentFingerZone.color})`
    };
  };

  return (
    <div className="p-3 sm:p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-md">
      {/* Top Banner Guide Hint */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: isError ? '#ef4444' : currentFingerZone?.color || '#6366f1' }}
          />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            {currentFingerZone?.name}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
            {currentFingerZone?.banglaName}
          </span>
        </div>

        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          Target Key: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            {targetChar === ' ' ? '␣ SPACE' : targetChar.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 10-Finger Hands Illustration Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 items-end max-w-lg mx-auto text-slate-400 dark:text-slate-600">
        {/* ── LEFT HAND ── */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[160px] sm:max-w-[180px] aspect-[4/3] relative">
            <svg viewBox="0 0 200 160" className="w-full h-full transition-all duration-200">
              {/* Palm Base */}
              <path
                d="M 40 150 C 40 105, 55 90, 85 90 C 115 90, 155 105, 155 150 Z"
                fill="currentColor"
                opacity="0.08"
              />

              {/* Left Pinky (A, Q, Z, 1) */}
              <g className="transition-all duration-200">
                <rect
                  x="28" y="55" width="16" height="55" rx="8"
                  style={getFingerHighlight('left_pinky')}
                />
                <text x="36" y="85" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">A</text>
              </g>

              {/* Left Ring (S, W, X, 2) */}
              <g className="transition-all duration-200">
                <rect
                  x="52" y="32" width="17" height="75" rx="8.5"
                  style={getFingerHighlight('left_ring')}
                />
                <text x="60.5" y="70" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">S</text>
              </g>

              {/* Left Middle (D, E, C, 3) */}
              <g className="transition-all duration-200">
                <rect
                  x="77" y="18" width="18" height="88" rx="9"
                  style={getFingerHighlight('left_middle')}
                />
                <text x="86" y="60" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">D</text>
              </g>

              {/* Left Index (F, R, V, T, G, B, 4, 5) */}
              <g className="transition-all duration-200">
                <rect
                  x="103" y="28" width="19" height="80" rx="9.5"
                  style={getFingerHighlight('left_index')}
                />
                <text x="112.5" y="68" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">F</text>
                {/* Home row bump indicator */}
                <circle cx="112.5" cy="80" r="2" fill="#ffffff" />
              </g>

              {/* Left Thumb (Spacebar) */}
              <g className="transition-all duration-200">
                <path
                  d="M 130 110 C 145 95, 165 95, 172 108 C 176 116, 168 130, 148 135 Z"
                  style={getFingerHighlight('thumbs')}
                />
              </g>
            </svg>
          </div>
          <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 mt-1">
            ✋ Left Hand (বাম হাত)
          </p>
          <p className="text-[9px] font-mono text-slate-400">Home: A - S - D - F</p>
        </div>

        {/* ── RIGHT HAND ── */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[160px] sm:max-w-[180px] aspect-[4/3] relative">
            <svg viewBox="0 0 200 160" className="w-full h-full transition-all duration-200">
              {/* Palm Base */}
              <path
                d="M 45 150 C 45 105, 85 90, 115 90 C 145 90, 160 105, 160 150 Z"
                fill="currentColor"
                opacity="0.08"
              />

              {/* Right Thumb (Spacebar) */}
              <g className="transition-all duration-200">
                <path
                  d="M 70 110 C 55 95, 35 95, 28 108 C 24 116, 32 130, 52 135 Z"
                  style={getFingerHighlight('thumbs')}
                />
              </g>

              {/* Right Index (J, U, M, Y, H, N, 6, 7) */}
              <g className="transition-all duration-200">
                <rect
                  x="78" y="28" width="19" height="80" rx="9.5"
                  style={getFingerHighlight('right_index')}
                />
                <text x="87.5" y="68" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">J</text>
                {/* Home row bump indicator */}
                <circle cx="87.5" cy="80" r="2" fill="#ffffff" />
              </g>

              {/* Right Middle (K, I, ,, 8) */}
              <g className="transition-all duration-200">
                <rect
                  x="105" y="18" width="18" height="88" rx="9"
                  style={getFingerHighlight('right_middle')}
                />
                <text x="114" y="60" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">K</text>
              </g>

              {/* Right Ring (L, O, ., 9) */}
              <g className="transition-all duration-200">
                <rect
                  x="131" y="32" width="17" height="75" rx="8.5"
                  style={getFingerHighlight('right_ring')}
                />
                <text x="139.5" y="70" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">L</text>
              </g>

              {/* Right Pinky (; , P, /, 0, Enter) */}
              <g className="transition-all duration-200">
                <rect
                  x="156" y="55" width="16" height="55" rx="8"
                  style={getFingerHighlight('right_pinky')}
                />
                <text x="164" y="85" fontSize="9" fontWeight="900" textAnchor="middle" fill="#ffffff">;</text>
              </g>
            </svg>
          </div>
          <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 mt-1">
            🤚 Right Hand (ডান হাত)
          </p>
          <p className="text-[9px] font-mono text-slate-400">Home: J - K - L - ;</p>
        </div>
      </div>
    </div>
  );
};

export default VisualHandGuide;
