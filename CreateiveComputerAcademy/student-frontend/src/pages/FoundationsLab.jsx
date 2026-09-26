import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  FiMousePointer, FiZap, FiBookOpen, FiCommand,
  FiAward, FiTrendingUp, FiActivity, FiMaximize2, FiMinimize2
} from 'react-icons/fi';

import MouseTrainer from '../components/foundations/MouseTrainer';
import MouseArcadeGames from '../components/foundations/MouseArcadeGames';
import ShortcutsTrainer from '../components/foundations/ShortcutsTrainer';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const FoundationsLab = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mouse'); // 'mouse' | 'arcade' | 'shortcuts'
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  const toggleFullscreen = () => {
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
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const fetchProgress = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/student/foundations/get_progress.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setProgressData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  const tabs = [
    {
      id: 'mouse',
      label: '🎯 মাউস ট্রেনিং (Skill Drills)',
      desc: 'Aim, Click, Double Click, Drag & Drop, Scroll',
      icon: '🎯'
    },
    {
      id: 'arcade',
      label: '🎮 মাউস আর্কেড (Arcade Games)',
      desc: 'Space Waves, Pen Tool Master, Canyon Glider & Magic Path',
      icon: '🎮'
    },
    {
      id: 'shortcuts',
      label: '⚡ ওএস শর্টকাটস (OS Shortcuts)',
      desc: 'Ctrl+C, Ctrl+V, Pro Keys & Window Commands',
      icon: '⚡'
    }
  ];

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-3 sm:p-6 overflow-y-auto w-screen h-screen flex flex-col space-y-4'
          : 'space-y-6 mx-auto pb-12 p-2 sm:p-4'
      }`}
    >
      {/* Top Banner */}
      <div className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white shadow-xl relative overflow-hidden transition-all ${isFullscreen ? 'py-3.5 sm:py-4.5' : ''}`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-cyan-200 text-xs font-bold">
              <span>🖱️ মাউস ও ফান্ডামেন্টালস ট্রেনিং ল্যাব</span>
              {isFullscreen && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 text-[10px] font-black animate-pulse">
                  FULLSCREEN MODE
                </span>
              )}
            </div>
            <h1 className={`${isFullscreen ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black tracking-tight`}>
              Mouse Control & Foundation Games
            </h1>
            {!isFullscreen && (
              <p className="text-xs sm:text-sm text-cyan-100 font-medium">
                মাউসের গতি, ক্লিকের নির্ভুলতা, ড্র্যাগ-অ্যান্ড-ড্রপ ও ওএস শর্টকাটসের বাস্তবসম্মত ট্রেনিং।
              </p>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen (F11)"}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border ${
                isFullscreen
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-300'
                  : 'bg-white/20 hover:bg-white text-white hover:text-indigo-950 border-white/30 backdrop-blur-md'
              }`}
            >
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              <span>{isFullscreen ? 'স্বাভাবিক স্ক্রিন' : 'ফুল স্ক্রিন ল্যাব'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-black scale-101'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{tab.icon}</span>
                <p className="text-xs sm:text-sm font-bold truncate">{tab.label}</p>
              </div>
              <p className={`text-[10px] sm:text-xs truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Stage */}
      <div className="w-full mx-auto flex-1 animate-in fade-in duration-200">
        {activeTab === 'mouse' && (
          <MouseTrainer
            user={user}
            onProgressUpdate={fetchProgress}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}

        {activeTab === 'arcade' && (
          <MouseArcadeGames
            user={user}
            onProgressUpdate={fetchProgress}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}

        {activeTab === 'shortcuts' && (
          <ShortcutsTrainer
            user={user}
            onProgressUpdate={fetchProgress}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}
      </div>
    </div>
  );
};

export default FoundationsLab;
