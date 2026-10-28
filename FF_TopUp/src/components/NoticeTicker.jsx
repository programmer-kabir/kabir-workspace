import React from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const NoticeTicker = () => {
  const { notice } = useApp();
  const [muted, setMuted] = React.useState(sounds.muted);

  const toggleSound = () => {
    sounds.muted = !sounds.muted;
    setMuted(sounds.muted);
    if (!sounds.muted) sounds.playClick();
  };

  return (
    <div className="notice-marquee-wrapper">
      <div className="notice-badge">
        <span className="pulse-dot"></span>
        <Megaphone size={12} />
        <span>নোটিশ</span>
      </div>

      <div className="notice-content-track">
        <div className="notice-scroller">
          {notice}
        </div>
      </div>

      <button 
        onClick={toggleSound}
        style={{
          padding: '0 12px',
          color: muted ? '#64748b' : 'var(--primary)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          background: 'rgba(16, 22, 38, 0.9)'
        }}
        title={muted ? "সাউন্ড অন করুন" : "সাউন্ড মিউট করুন"}
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  );
};
