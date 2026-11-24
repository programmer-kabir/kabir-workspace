import React from 'react';

/**
 * 😊 FloatingReactionsOverlay
 * Renders rising physics-based emoji bubbles over the meeting viewport
 */
export default function FloatingReactionsOverlay({ floatingReactions = [] }) {
  if (!floatingReactions || floatingReactions.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes floatUpDrift {
          0% {
            transform: translateY(0px) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            transform: translateY(-50px) scale(1.15) rotate(-3deg);
            opacity: 1;
          }
          75% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-420px) scale(0.8) rotate(8deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            style={{
              left: `${reaction.leftPercent}%`,
              bottom: '16px',
              animation: `floatUpDrift ${reaction.duration || 3200}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`
            }}
            className="absolute pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl select-none"
          >
            <span className="text-2xl drop-shadow-md">{reaction.emoji}</span>
            <span className="text-[11px] font-bold text-white max-w-[110px] truncate drop-shadow">
              {reaction.senderName}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
