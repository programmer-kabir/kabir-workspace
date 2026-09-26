import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiPlay, FiPause, FiRefreshCw, FiBook, FiHome,
  FiZap, FiAward, FiVolume2, FiVolumeX, FiCheck,
  FiTrendingUp, FiFlag, FiChevronRight, FiSliders,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { HiSparkles, HiBolt } from 'react-icons/hi2';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Web Audio API Synthesizer for Space Waves
const createSynthAudio = () => {
  let ctx = null;
  const getContext = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  };

  return {
    playWaveTone: (isGoingUp, soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        const targetFreq = isGoingUp ? 520 : 380;
        osc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch (e) {}
    },
    playCrash: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        // Low rumble bass drop
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {}
    },
    playCheckpoint: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}
    },
    playWin: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.15, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.25);
        });
      } catch (e) {}
    }
  };
};

const synth = createSynthAudio();

// Pre-built level maps with geometric obstacles matching Space Waves
const LEVEL_CONFIGS = {
  1: {
    id: 1,
    name: 'Level 1: Neon Valley',
    subTitle: 'Smooth Glides & Gentle Slopes',
    difficulty: 'Easy',
    themeColor: '#06b6d4', // Cyan
    accentColor: '#3b82f6', // Blue
    bgColor: '#080e22',
    gridColor: 'rgba(6, 182, 212, 0.08)',
    speed: 3.8,
    length: 6800, // Long duration
    obstacles: [
      // Section 1: Intro wave slopes
      { type: 'spike_up', x: 600, y: 340, w: 32, h: 36 },
      { type: 'spike_down', x: 950, y: 40, w: 32, h: 36 },
      { type: 'block', x: 1200, y: 280, w: 180, h: 100 },
      { type: 'spike_up', x: 1270, y: 244, w: 32, h: 36 },
      { type: 'block', x: 1600, y: 40, w: 200, h: 90 },
      { type: 'spike_down', x: 1680, y: 130, w: 32, h: 36 },
      
      // Section 2: Gentle Zig-Zag Corridor (Wide clearance)
      { type: 'block', x: 2050, y: 260, w: 280, h: 120 },
      { type: 'block', x: 2500, y: 40, w: 280, h: 120 },
      { type: 'spike_down', x: 2620, y: 160, w: 32, h: 36 },
      { type: 'spike_up', x: 2950, y: 340, w: 32, h: 36 },
      { type: 'spike_up', x: 3100, y: 340, w: 32, h: 36 },
      
      // Section 3: Mid-stage spacious flight
      { type: 'block', x: 3450, y: 40, w: 350, h: 90 },
      { type: 'block', x: 3450, y: 290, w: 350, h: 90 },
      { type: 'spike_up', x: 3600, y: 254, w: 30, h: 36 },
      
      // Section 4: Floating stepping blocks
      { type: 'block', x: 4100, y: 180, w: 120, h: 50 },
      { type: 'spike_up', x: 4400, y: 340, w: 34, h: 38 },
      { type: 'spike_down', x: 4650, y: 40, w: 34, h: 38 },
      { type: 'block', x: 4950, y: 250, w: 300, h: 130 },
      { type: 'block', x: 5400, y: 40, w: 300, h: 130 },
      
      // Final smooth glide
      { type: 'spike_up', x: 5900, y: 340, w: 34, h: 38 },
      { type: 'spike_down', x: 6150, y: 40, w: 34, h: 38 },
      { type: 'spike_up', x: 6400, y: 340, w: 34, h: 38 }
    ]
  },
  2: {
    id: 2,
    name: 'Level 2: Magenta Pulse',
    subTitle: 'Classic Cyber Wave Challenge',
    difficulty: 'Medium',
    themeColor: '#d946ef', // Fuchsia / Magenta (like user's screenshot)
    accentColor: '#ec4899', // Pink
    bgColor: '#16041c',
    gridColor: 'rgba(217, 70, 239, 0.08)',
    speed: 4.4,
    length: 9500, // Extended duration
    obstacles: [
      // Warm-up wave rhythm
      { type: 'spike_up', x: 550, y: 340, w: 32, h: 36 },
      { type: 'spike_down', x: 850, y: 40, w: 32, h: 36 },
      { type: 'spike_up', x: 1150, y: 340, w: 32, h: 36 },
      { type: 'spike_down', x: 1450, y: 40, w: 32, h: 36 },

      // Stepped Blocks (Matching screenshot aesthetic)
      { type: 'block', x: 1750, y: 40, w: 300, h: 100 },
      { type: 'spike_down', x: 1880, y: 140, w: 30, h: 34 },
      { type: 'block', x: 2200, y: 260, w: 320, h: 120 },
      { type: 'spike_up', x: 2340, y: 226, w: 30, h: 34 },

      // Rhythmic Wave Corridor
      { type: 'block', x: 2750, y: 40, w: 450, h: 90 },
      { type: 'block', x: 2750, y: 280, w: 450, h: 100 },
      { type: 'spike_up', x: 2950, y: 246, w: 28, h: 34 },
      { type: 'spike_down', x: 3100, y: 130, w: 28, h: 34 },

      // Diagonal Wave Flow
      { type: 'block', x: 3450, y: 40, w: 240, h: 140 },
      { type: 'block', x: 3800, y: 220, w: 240, h: 160 },
      { type: 'block', x: 4150, y: 40, w: 240, h: 140 },
      { type: 'spike_up', x: 4500, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 4700, y: 40, w: 32, h: 38 },

      // Mid-Stage Cyber Zone
      { type: 'block', x: 5050, y: 260, w: 350, h: 120 },
      { type: 'block', x: 5500, y: 40, w: 350, h: 120 },
      { type: 'spike_up', x: 5950, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 6200, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 6450, y: 340, w: 32, h: 38 },

      // Extended Slalom Corridor
      { type: 'block', x: 6800, y: 240, w: 400, h: 140 },
      { type: 'block', x: 7300, y: 40, w: 400, h: 140 },
      { type: 'spike_up', x: 7850, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 8100, y: 40, w: 32, h: 38 },
      { type: 'block', x: 8400, y: 180, w: 160, h: 60 },
      { type: 'spike_up', x: 8850, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 9100, y: 40, w: 32, h: 38 }
    ]
  },
  3: {
    id: 3,
    name: 'Level 3: Cyber Glide',
    subTitle: 'Rhythmic Wave Mastery & Long Flow',
    difficulty: 'Advanced & Balanced',
    themeColor: '#8b5cf6', // Electric Purple
    accentColor: '#ec4899', // Pink
    bgColor: '#110522',
    gridColor: 'rgba(139, 92, 246, 0.08)',
    speed: 4.8, // Balanced fair speed
    length: 12500, // Long grand journey
    obstacles: [
      // 1. Alternating rhythmic spikes (fair spacing)
      { type: 'spike_up', x: 600, y: 340, w: 30, h: 36 },
      { type: 'spike_down', x: 850, y: 40, w: 30, h: 36 },
      { type: 'spike_up', x: 1100, y: 340, w: 30, h: 36 },
      { type: 'spike_down', x: 1350, y: 40, w: 30, h: 36 },

      // 2. Comfortable Wave Tunnel (Wider & Rhythmic)
      { type: 'block', x: 1650, y: 40, w: 450, h: 90 },
      { type: 'block', x: 1650, y: 280, w: 450, h: 100 },
      { type: 'spike_up', x: 1850, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 2000, y: 130, w: 28, h: 34 },

      // 3. Floating Island Steps
      { type: 'block', x: 2350, y: 180, w: 160, h: 50 },
      { type: 'spike_up', x: 2390, y: 144, w: 28, h: 34 },
      { type: 'spike_down', x: 2460, y: 230, w: 28, h: 34 },
      
      { type: 'block', x: 2750, y: 40, w: 280, h: 130 },
      { type: 'block', x: 3150, y: 230, w: 280, h: 150 },
      { type: 'block', x: 3550, y: 40, w: 280, h: 130 },
      { type: 'block', x: 3950, y: 230, w: 280, h: 150 },

      // 4. Smooth Double-Wave Corridor
      { type: 'block', x: 4450, y: 40, w: 500, h: 90 },
      { type: 'block', x: 4450, y: 280, w: 500, h: 100 },
      { type: 'spike_up', x: 4650, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 4800, y: 130, w: 28, h: 34 },

      // 5. Extended Mid-Stage Glides
      { type: 'spike_up', x: 5200, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 5450, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 5700, y: 340, w: 32, h: 38 },
      { type: 'block', x: 6050, y: 240, w: 350, h: 140 },
      { type: 'block', x: 6500, y: 40, w: 350, h: 140 },

      // 6. Stepped Pyramid Wave
      { type: 'block', x: 7050, y: 220, w: 180, h: 160 },
      { type: 'block', x: 7300, y: 150, w: 180, h: 230 },
      { type: 'block', x: 7550, y: 40, w: 180, h: 150 },
      { type: 'spike_up', x: 7950, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 8200, y: 40, w: 32, h: 38 },

      // 7. Long Rhythm Gauntlet
      { type: 'block', x: 8650, y: 40, w: 600, h: 90 },
      { type: 'block', x: 8650, y: 280, w: 600, h: 100 },
      { type: 'spike_up', x: 8900, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 9100, y: 130, w: 28, h: 34 },
      
      { type: 'spike_up', x: 9550, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 9800, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 10050, y: 340, w: 32, h: 38 },
      { type: 'block', x: 10400, y: 180, w: 180, h: 60 },
      { type: 'spike_up', x: 10800, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 11150, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 11500, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 11850, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 12150, y: 340, w: 32, h: 38 }
    ]
  },
  4: {
    id: 4,
    name: 'Level 4: Starry Abyss',
    subTitle: 'Deep Space High Flow Flight',
    difficulty: 'Expert Flow',
    themeColor: '#10b981', // Emerald
    accentColor: '#06b6d4', // Cyan
    bgColor: '#021812',
    gridColor: 'rgba(16, 185, 129, 0.08)',
    speed: 5.1,
    length: 15500, // Epic Duration
    obstacles: [
      { type: 'spike_up', x: 600, y: 340, w: 30, h: 36 },
      { type: 'spike_down', x: 850, y: 40, w: 30, h: 36 },
      { type: 'spike_up', x: 1100, y: 340, w: 30, h: 36 },
      { type: 'block', x: 1400, y: 250, w: 350, h: 130 },
      { type: 'block', x: 1850, y: 40, w: 350, h: 130 },
      { type: 'block', x: 2300, y: 40, w: 500, h: 90 },
      { type: 'block', x: 2300, y: 280, w: 500, h: 100 },
      { type: 'spike_up', x: 2500, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 2680, y: 130, w: 28, h: 34 },
      { type: 'block', x: 3000, y: 180, w: 180, h: 60 },
      { type: 'spike_up', x: 3400, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 3700, y: 40, w: 32, h: 38 },
      { type: 'block', x: 4100, y: 240, w: 350, h: 140 },
      { type: 'block', x: 4550, y: 40, w: 350, h: 140 },
      { type: 'spike_up', x: 5100, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 5400, y: 40, w: 32, h: 38 },
      { type: 'block', x: 5800, y: 40, w: 550, h: 90 },
      { type: 'block', x: 5800, y: 280, w: 550, h: 100 },
      { type: 'spike_up', x: 6050, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 6250, y: 130, w: 28, h: 34 },
      { type: 'spike_up', x: 6650, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 7000, y: 40, w: 32, h: 38 },
      { type: 'block', x: 7400, y: 220, w: 400, h: 160 },
      { type: 'block', x: 7900, y: 40, w: 400, h: 160 },
      { type: 'spike_up', x: 8500, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 8850, y: 40, w: 32, h: 38 },
      { type: 'block', x: 9300, y: 40, w: 600, h: 90 },
      { type: 'block', x: 9300, y: 280, w: 600, h: 100 },
      { type: 'spike_up', x: 9600, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 9800, y: 130, w: 28, h: 34 },
      { type: 'spike_up', x: 10250, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 10600, y: 40, w: 32, h: 38 },
      { type: 'block', x: 11100, y: 180, w: 200, h: 60 },
      { type: 'spike_up', x: 11600, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 12000, y: 40, w: 32, h: 38 },
      { type: 'block', x: 12500, y: 250, w: 380, h: 130 },
      { type: 'block', x: 13000, y: 40, w: 380, h: 130 },
      { type: 'spike_up', x: 13600, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 14000, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 14450, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 14850, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 15150, y: 340, w: 32, h: 38 }
    ]
  },
  5: {
    id: 5,
    name: 'Level 5: Demon Galaxy',
    subTitle: 'The Ultimate Wave Grandmaster Gauntlet',
    difficulty: 'Grandmaster',
    themeColor: '#f59e0b', // Amber / Gold
    accentColor: '#ef4444', // Red
    bgColor: '#1c0a05',
    gridColor: 'rgba(245, 158, 11, 0.08)',
    speed: 5.4,
    length: 19000, // Grand Finale
    obstacles: [
      { type: 'spike_up', x: 500, y: 340, w: 30, h: 36 },
      { type: 'spike_down', x: 750, y: 40, w: 30, h: 36 },
      { type: 'spike_up', x: 1000, y: 340, w: 30, h: 36 },
      { type: 'spike_down', x: 1250, y: 40, w: 30, h: 36 },
      { type: 'block', x: 1550, y: 40, w: 500, h: 90 },
      { type: 'block', x: 1550, y: 280, w: 500, h: 100 },
      { type: 'spike_up', x: 1750, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 1900, y: 130, w: 28, h: 34 },
      { type: 'block', x: 2250, y: 180, w: 160, h: 50 },
      { type: 'block', x: 2600, y: 240, w: 300, h: 140 },
      { type: 'block', x: 3000, y: 40, w: 300, h: 140 },
      { type: 'spike_up', x: 3450, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 3750, y: 40, w: 32, h: 38 },
      { type: 'block', x: 4150, y: 40, w: 550, h: 90 },
      { type: 'block', x: 4150, y: 280, w: 550, h: 100 },
      { type: 'spike_up', x: 4400, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 4600, y: 130, w: 28, h: 34 },
      { type: 'spike_up', x: 5000, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 5300, y: 40, w: 32, h: 38 },
      { type: 'block', x: 5700, y: 220, w: 350, h: 160 },
      { type: 'block', x: 6150, y: 40, w: 350, h: 160 },
      { type: 'spike_up', x: 6650, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 6950, y: 40, w: 32, h: 38 },
      { type: 'block', x: 7400, y: 40, w: 600, h: 90 },
      { type: 'block', x: 7400, y: 280, w: 600, h: 100 },
      { type: 'spike_up', x: 7650, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 7850, y: 130, w: 28, h: 34 },
      { type: 'spike_up', x: 8250, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 8550, y: 40, w: 32, h: 38 },
      { type: 'block', x: 9000, y: 180, w: 180, h: 60 },
      { type: 'spike_up', x: 9400, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 9750, y: 40, w: 32, h: 38 },
      { type: 'block', x: 10200, y: 240, w: 350, h: 140 },
      { type: 'block', x: 10650, y: 40, w: 350, h: 140 },
      { type: 'spike_up', x: 11200, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 11550, y: 40, w: 32, h: 38 },
      { type: 'block', x: 12050, y: 40, w: 600, h: 90 },
      { type: 'block', x: 12050, y: 280, w: 600, h: 100 },
      { type: 'spike_up', x: 12350, y: 244, w: 28, h: 34 },
      { type: 'spike_down', x: 12550, y: 130, w: 28, h: 34 },
      { type: 'spike_up', x: 13000, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 13350, y: 40, w: 32, h: 38 },
      { type: 'block', x: 13800, y: 180, w: 200, h: 60 },
      { type: 'spike_up', x: 14300, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 14650, y: 40, w: 32, h: 38 },
      { type: 'block', x: 15150, y: 250, w: 400, h: 130 },
      { type: 'block', x: 15650, y: 40, w: 400, h: 130 },
      { type: 'spike_up', x: 16250, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 16600, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 17000, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 17350, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 17750, y: 340, w: 32, h: 38 },
      { type: 'spike_down', x: 18150, y: 40, w: 32, h: 38 },
      { type: 'spike_up', x: 18550, y: 340, w: 32, h: 38 }
    ]
  }
};

const SpaceWavesGame = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [selectedLevelId, setSelectedLevelId] = useState(2); // Level 2 default (like screenshot)
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'paused' | 'crashed' | 'completed'
  const [progressPercent, setProgressPercent] = useState(0);
  const [bestScores, setBestScores] = useState({ 1: 0, 2: 0, 3: 0 });
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [checkpointsCount, setCheckpointsCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const isCurrentlyFullscreen = isMasterFullscreen || isFullscreen;

  // Toggle Full Screen / Theater Mode
  const handleToggleFullscreen = () => {
    if (toggleMasterFullscreen) {
      toggleMasterFullscreen();
    } else {
      if (!isFullscreen) {
        setIsFullscreen(true);
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Engine Physics State
  const engineStateRef = useRef({
    running: false,
    isHolding: false,
    player: {
      x: 80,
      y: 190,
      size: 14,
      trail: [],
      alive: true
    },
    cameraX: 0,
    shake: 0,
    checkpoints: [],
    sparks: [],
    lastToneTime: 0
  });

  const activeLevel = LEVEL_CONFIGS[selectedLevelId];

  // Draw background honeycomb grid
  const drawHoneycombBackground = (ctx, width, height, cameraX, theme) => {
    ctx.fillStyle = theme.bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1.2;

    const hexSize = 32;
    const hexHeight = hexSize * Math.sqrt(3);
    const offsetX = -(cameraX * 0.4) % (hexSize * 3);

    for (let x = offsetX - hexSize * 2; x < width + hexSize * 2; x += hexSize * 3) {
      for (let y = -hexHeight; y < height + hexHeight; y += hexHeight) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = x + hexSize * Math.cos(angle);
          const hy = y + hexSize * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();

        // Staggered row
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = x + hexSize * 1.5 + hexSize * Math.cos(angle);
          const hy = y + hexHeight / 2 + hexSize * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Top and Bottom Neon Boundary Bars
    const boundaryHeight = 36;
    ctx.fillStyle = '#0b0212';
    ctx.fillRect(0, 0, width, boundaryHeight);
    ctx.fillRect(0, height - boundaryHeight, width, boundaryHeight);

    // Glowing boundary neon line
    ctx.strokeStyle = theme.themeColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.themeColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, boundaryHeight);
    ctx.lineTo(width, boundaryHeight);
    ctx.moveTo(0, height - boundaryHeight);
    ctx.lineTo(width, height - boundaryHeight);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Main Game Loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const eng = engineStateRef.current;
    const level = LEVEL_CONFIGS[selectedLevelId];

    if (!eng.running) return;

    // Camera shake calculation
    let shakeX = 0;
    let shakeY = 0;
    if (eng.shake > 0) {
      shakeX = (Math.random() - 0.5) * eng.shake;
      shakeY = (Math.random() - 0.5) * eng.shake;
      eng.shake *= 0.88;
      if (eng.shake < 0.5) eng.shake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Update Player Physics
    if (eng.player.alive) {
      // Wave Movement: 45-degree angle
      // When holding: move UP at 'speed'
      // When released: move DOWN at 'speed'
      const speed = level.speed;
      eng.player.x += speed;
      const verticalSpeed = eng.isHolding ? -speed : speed;
      eng.player.y += verticalSpeed;

      // Camera follows player horizontally
      eng.cameraX = eng.player.x - 140;

      // Audio Tone while flying
      const now = Date.now();
      if (now - eng.lastToneTime > 140) {
        synth.playWaveTone(eng.isHolding, soundEnabled);
        eng.lastToneTime = now;
      }

      // Add trail point
      eng.player.trail.push({
        x: eng.player.x,
        y: eng.player.y,
        time: now
      });

      // Keep trail optimal
      if (eng.player.trail.length > 50) {
        eng.player.trail.shift();
      }

      // Calculate Progress
      const pct = Math.min(100, Math.floor((eng.player.x / level.length) * 100));
      setProgressPercent(pct);

      // Check Victory Condition
      if (eng.player.x >= level.length) {
        eng.player.alive = false;
        eng.running = false;
        setGameState('completed');
        synth.playWin(soundEnabled);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

        // Update Best Score
        setBestScores(prev => ({
          ...prev,
          [selectedLevelId]: 100
        }));

        toast.success(`🎉 Level ${selectedLevelId} Completed 100%! Incredible Wave Mastery!`);
        return;
      }

      // Collision Detection
      const topBound = 36 + eng.player.size;
      const bottomBound = height - 36 - eng.player.size;

      // 1. Ceiling & Floor Collision
      if (eng.player.y <= topBound || eng.player.y >= bottomBound) {
        handleCrash(eng, level);
      }

      // 2. Obstacles Collision
      const px = eng.player.x;
      const py = eng.player.y;
      const pSize = eng.player.size * 0.52; // Refined, fair and forgiving hitbox

      for (const obs of level.obstacles) {
        // Only check obstacles near the camera view
        if (obs.x + (obs.w || 40) < eng.cameraX || obs.x > eng.cameraX + width + 50) {
          continue;
        }

        if (obs.type === 'spike_up') {
          // Triangle at floor pointing UP
          const tx = obs.x;
          const ty = obs.y; // bottom
          const tw = obs.w;
          const th = obs.h;
          // Point is at (tx + tw/2, ty - th)
          if (
            px >= tx - pSize &&
            px <= tx + tw + pSize &&
            py >= ty - th - pSize &&
            py <= ty + pSize
          ) {
            handleCrash(eng, level);
            break;
          }
        } else if (obs.type === 'spike_down') {
          // Triangle at ceiling pointing DOWN
          const tx = obs.x;
          const ty = obs.y; // top
          const tw = obs.w;
          const th = obs.h;
          // Point is at (tx + tw/2, ty + th)
          if (
            px >= tx - pSize &&
            px <= tx + tw + pSize &&
            py >= ty - pSize &&
            py <= ty + th + pSize
          ) {
            handleCrash(eng, level);
            break;
          }
        } else if (obs.type === 'block') {
          // Solid Block AABB
          if (
            px + pSize >= obs.x &&
            px - pSize <= obs.x + obs.w &&
            py + pSize >= obs.y &&
            py - pSize <= obs.y + obs.h
          ) {
            handleCrash(eng, level);
            break;
          }
        }
      }
    }

    // ── RENDER SCENE ────────────────────────────────────────────────────────
    drawHoneycombBackground(ctx, width, height, eng.cameraX, level);

    // Draw Obstacles
    const relCamX = eng.cameraX;

    level.obstacles.forEach((obs) => {
      const screenX = obs.x - relCamX;
      if (screenX < -100 || screenX > width + 100) return;

      if (obs.type === 'spike_up') {
        // Glowing Pink/Cyan Upward Spike
        ctx.fillStyle = level.themeColor;
        ctx.shadowColor = level.themeColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(screenX, obs.y);
        ctx.lineTo(screenX + obs.w / 2, obs.y - obs.h);
        ctx.lineTo(screenX + obs.w, obs.y);
        ctx.closePath();
        ctx.fill();

        // Inner darker core
        ctx.fillStyle = '#16041c';
        ctx.beginPath();
        ctx.moveTo(screenX + 5, obs.y - 1);
        ctx.lineTo(screenX + obs.w / 2, obs.y - obs.h + 6);
        ctx.lineTo(screenX + obs.w - 5, obs.y - 1);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'spike_down') {
        // Glowing Downward Spike
        ctx.fillStyle = level.themeColor;
        ctx.shadowColor = level.themeColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(screenX, obs.y);
        ctx.lineTo(screenX + obs.w / 2, obs.y + obs.h);
        ctx.lineTo(screenX + obs.w, obs.y);
        ctx.closePath();
        ctx.fill();

        // Inner darker core
        ctx.fillStyle = '#16041c';
        ctx.beginPath();
        ctx.moveTo(screenX + 5, obs.y + 1);
        ctx.lineTo(screenX + obs.w / 2, obs.y + obs.h - 6);
        ctx.lineTo(screenX + obs.w - 5, obs.y + 1);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'block') {
        // Neon Bordered Block (Matching screenshot aesthetic)
        ctx.fillStyle = '#1e0524';
        ctx.strokeStyle = level.themeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = level.themeColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(screenX, obs.y, obs.w, obs.h);
        ctx.strokeRect(screenX, obs.y, obs.w, obs.h);

        // Inner decorative grid
        ctx.strokeStyle = level.gridColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 6, obs.y + 6, obs.w - 12, obs.h - 12);
        ctx.shadowBlur = 0;
      }
    });

    // Draw Checkpoints in Practice Mode
    if (isPracticeMode && eng.checkpoints.length > 0) {
      eng.checkpoints.forEach((cp, idx) => {
        const cx = cp.x - relCamX;
        if (cx >= -20 && cx <= width + 20) {
          ctx.fillStyle = '#10b981'; // Green Diamond
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(cx, cp.y - 12);
          ctx.lineTo(cx + 10, cp.y);
          ctx.lineTo(cx, cp.y + 12);
          ctx.lineTo(cx - 10, cp.y);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }

    // Draw Wave Trail
    if (eng.player.trail.length > 1) {
      ctx.strokeStyle = level.themeColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = level.themeColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();

      eng.player.trail.forEach((p, idx) => {
        const tx = p.x - relCamX;
        if (idx === 0) ctx.moveTo(tx, p.y);
        else ctx.lineTo(tx, p.y);
      });
      ctx.stroke();

      // Core white laser line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Player Wave Arrow
    if (eng.player.alive) {
      const px = eng.player.x - relCamX;
      const py = eng.player.y;
      const angle = eng.isHolding ? -Math.PI / 4 : Math.PI / 4; // -45 deg (up) vs +45 deg (down)

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      // Glowing Neon Arrow Triangle
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = level.themeColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = level.themeColor;
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.moveTo(14, 0); // Tip pointing right
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Draw Sparks on Crash
    if (eng.sparks.length > 0) {
      eng.sparks.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.03;
        if (s.life > 0) {
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(s.x - relCamX, s.y, s.size, s.size);
        }
      });
      eng.sparks = eng.sparks.filter(s => s.life > 0);
    }

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [selectedLevelId, isPracticeMode, soundEnabled]);

  // Crash Handler
  const handleCrash = (eng, level) => {
    eng.player.alive = false;
    eng.running = false;
    eng.shake = 18;
    synth.playCrash(soundEnabled);

    // Spawn explosion particles
    const sparks = [];
    for (let i = 0; i < 35; i++) {
      sparks.push({
        x: eng.player.x,
        y: eng.player.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color: Math.random() > 0.4 ? level.themeColor : '#ffffff',
        size: Math.random() * 4 + 2,
        life: 1.0
      });
    }
    eng.sparks = sparks;

    // Calculate current run percentage
    const currentPct = Math.min(100, Math.floor((eng.player.x / level.length) * 100));

    // Update Best
    setBestScores(prev => ({
      ...prev,
      [selectedLevelId]: Math.max(prev[selectedLevelId] || 0, currentPct)
    }));

    setGameState('crashed');
  };

  // Start / Restart Game Run
  const startRun = (fromCheckpoint = false) => {
    const eng = engineStateRef.current;
    const level = LEVEL_CONFIGS[selectedLevelId];

    if (fromCheckpoint && isPracticeMode && eng.checkpoints.length > 0) {
      const lastCp = eng.checkpoints[eng.checkpoints.length - 1];
      eng.player = {
        x: lastCp.x,
        y: lastCp.y,
        size: 14,
        trail: [],
        alive: true
      };
      eng.cameraX = lastCp.x - 140;
    } else {
      eng.player = {
        x: 80,
        y: 190,
        size: 14,
        trail: [],
        alive: true
      };
      eng.cameraX = 0;
      if (!isPracticeMode) {
        eng.checkpoints = [];
        setCheckpointsCount(0);
      }
    }

    eng.isHolding = false;
    eng.shake = 0;
    eng.sparks = [];
    eng.running = true;
    setGameState('playing');
  };

  // Place Practice Checkpoint
  const placeCheckpoint = () => {
    if (!isPracticeMode) return;
    const eng = engineStateRef.current;
    if (!eng.player.alive) return;

    eng.checkpoints.push({
      x: eng.player.x,
      y: eng.player.y
    });
    setCheckpointsCount(eng.checkpoints.length);
    synth.playCheckpoint(soundEnabled);
    toast.success('📍 Checkpoint placed!');
  };

  // Remove Last Checkpoint
  const removeCheckpoint = () => {
    const eng = engineStateRef.current;
    if (eng.checkpoints.length > 0) {
      eng.checkpoints.pop();
      setCheckpointsCount(eng.checkpoints.length);
      toast.info('Checkpoint removed');
    }
  };

  // User Mouse & Keyboard Event Handlers
  const handleMouseDown = (e) => {
    if (gameState === 'playing') {
      engineStateRef.current.isHolding = true;
    } else if (gameState === 'crashed') {
      startRun(isPracticeMode);
    }
  };

  const handleMouseUp = (e) => {
    engineStateRef.current.isHolding = false;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') {
          engineStateRef.current.isHolding = true;
        } else if (gameState === 'crashed') {
          startRun(isPracticeMode);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (isPracticeMode && gameState === 'playing') {
          placeCheckpoint();
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        if (isPracticeMode) {
          removeCheckpoint();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        engineStateRef.current.isHolding = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isPracticeMode]);

  // Main Loop Manager
  useEffect(() => {
    if (gameState === 'playing') {
      engineStateRef.current.running = true;
      animFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      engineStateRef.current.running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gameLoop]);

  return (
    <div
      ref={containerRef}
      className={`select-none transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0c0211] p-3 sm:p-6 flex flex-col justify-center items-center overflow-y-auto w-screen h-screen'
          : 'space-y-4'
      }`}
    >
      {/* Level Select & Settings Strip */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md ${isFullscreen ? 'w-full max-w-6xl' : ''}`}>
        {/* Level Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(LEVEL_CONFIGS).map(Number).map((lvlId) => {
            const lvl = LEVEL_CONFIGS[lvlId];
            const isSel = selectedLevelId === lvlId;
            return (
              <button
                key={lvlId}
                onClick={() => {
                  setSelectedLevelId(lvlId);
                  setGameState('idle');
                  setProgressPercent(0);
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30 scale-105'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>Level {lvlId}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/30 font-semibold">
                  {bestScores[lvlId] || 0}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Practice Mode & Sound Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPracticeMode(!isPracticeMode);
              toast.info(isPracticeMode ? 'Practice Mode Disabled' : 'Practice Mode Enabled (Tap P to drop checkpoint)');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              isPracticeMode
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FiBook size={14} />
            <span>Practice Mode {isPracticeMode && `(${checkpointsCount})`}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>

          {/* Full Screen Toggle Button in Strip */}
          <button
            onClick={handleToggleFullscreen}
            title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-fuchsia-600 text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
          >
            {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Game Stage Container (With Exact Space Waves Aesthetic) */}
      <div className={`relative rounded-3xl overflow-hidden border-2 border-fuchsia-900/60 shadow-2xl bg-[#16041c] ${isCurrentlyFullscreen ? 'w-full max-w-6xl my-auto shadow-fuchsia-950/80' : ''}`}>
        {/* Floating Corner Fullscreen Toggle Button */}
        <button
          onClick={handleToggleFullscreen}
          title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Screen / Full Page"}
          className="absolute top-4 right-4 z-30 p-2 sm:p-2.5 rounded-2xl bg-black/60 hover:bg-fuchsia-600 text-white/80 hover:text-white border border-fuchsia-500/30 hover:border-fuchsia-400 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center gap-1.5 pointer-events-auto"
        >
          {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          <span className="text-[10px] font-black uppercase hidden sm:inline">{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
        </button>

        {/* Top HUD: LEVEL HEADER & 0-100% NEON PROGRESS BAR (MATCHING SCREENSHOT) */}
        <div className="absolute top-4 inset-x-0 z-20 flex flex-col items-center pointer-events-none">
          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white drop-shadow-[0_2px_10px_rgba(217,70,239,0.8)] uppercase">
            LEVEL {selectedLevelId}
          </h2>

          {/* Neon Pink Progress Bar */}
          <div className="mt-2 w-72 sm:w-96 h-6 rounded-lg bg-[#2a0836] border border-fuchsia-500/40 p-0.5 shadow-lg shadow-fuchsia-950/80 relative overflow-hidden flex items-center">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-md bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-400 shadow-[0_0_12px_rgba(236,72,153,0.8)] transition-all duration-75"
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* CANVAS ARENA */}
        <canvas
          ref={canvasRef}
          width={isFullscreen ? 1100 : 720}
          height={isFullscreen ? 520 : 400}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={`w-full cursor-pointer block ${isFullscreen ? 'h-[520px]' : 'h-[400px]'}`}
        />

        {/* IDLE OVERLAY */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white flex items-center justify-center text-4xl shadow-2xl shadow-fuchsia-600/40 animate-pulse">
              🚀
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                {activeLevel.name}
              </h3>
              <p className="text-xs sm:text-sm text-fuchsia-300/80 font-medium max-w-md mt-1">
                {activeLevel.subTitle} • Master 45° angle hold and release wave reflexes!
              </p>
            </div>

            {/* Quick Instruction Banner */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl">
              <span className="flex items-center gap-1.5 text-pink-400">
                <HiBolt size={16} /> Hold Left-Click = Fly UP ↗
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                Release = Fly DOWN ↘
              </span>
            </div>

            <button
              onClick={() => startRun(false)}
              className="px-10 py-3.5 bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-500 hover:to-pink-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-fuchsia-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
            >
              Start Level {selectedLevelId}
            </button>
          </div>
        )}

        {/* CRASHED / PAUSE OVERLAY (MATCHING SCREENSHOT WITH RESUME & PRACTICE) */}
        {gameState === 'crashed' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-6 text-center space-y-5 animate-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(244,63,94,0.6)]">
                CRASHED!
              </h3>
              <p className="text-sm font-bold text-fuchsia-300">
                Progress: <span className="text-white font-black">{progressPercent}%</span>
                {bestScores[selectedLevelId] > 0 && ` • Best: ${bestScores[selectedLevelId]}%`}
              </p>
            </div>

            {/* Big Center Action Buttons (Identical to user's screenshot) */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => startRun(isPracticeMode)}
                className="px-8 py-3.5 bg-white text-slate-950 font-black text-sm rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wide"
              >
                <FiPlay size={18} className="fill-current text-fuchsia-600" />
                <span>Retry (Or Click Screen)</span>
              </button>

              <button
                onClick={() => {
                  setIsPracticeMode(!isPracticeMode);
                  toast.info(!isPracticeMode ? 'Practice Mode Enabled' : 'Normal Mode');
                }}
                className="px-6 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-fuchsia-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wide"
              >
                <FiBook size={18} />
                <span>{isPracticeMode ? 'Exit Practice' : 'Practice Mode'}</span>
              </button>
            </div>
          </div>
        )}

        {/* VICTORY 100% COMPLETE MODAL */}
        {gameState === 'completed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-4xl shadow-2xl shadow-amber-400/40 animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white tracking-wider uppercase text-emerald-400">
                100% COMPLETED!
              </h3>
              <p className="text-sm font-bold text-slate-300">
                You fully mastered <span className="text-fuchsia-400 font-black">{activeLevel.name}</span>!
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => startRun(false)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Replay Level
              </button>
              {selectedLevelId < Object.keys(LEVEL_CONFIGS).length && (
                <button
                  onClick={() => {
                    setSelectedLevelId(prev => prev + 1);
                    setGameState('idle');
                    setProgressPercent(0);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-black text-xs rounded-xl shadow-lg shadow-fuchsia-600/40 hover:scale-105 cursor-pointer uppercase flex items-center gap-2"
                >
                  <span>Next Level {selectedLevelId + 1}</span>
                  <FiChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Help Bar */}
        <div className="p-3 bg-[#0d0211] border-t border-fuchsia-900/40 flex flex-wrap items-center justify-between text-[11px] font-mono text-fuchsia-300/80 px-4">
          <div className="flex items-center gap-3">
            <span>🖱️ Hold Left-Click = ↗ Wave Up</span>
            <span>•</span>
            <span>Release = ↘ Wave Down</span>
          </div>
          {isPracticeMode && (
            <div className="flex items-center gap-2 text-emerald-400">
              <span>⌨️ Tap [P] = Drop Checkpoint</span>
              <span>•</span>
              <span>[Z] = Undo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceWavesGame;
