import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import FoundationsAnalytics from '../components/foundations/FoundationsAnalytics';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SkillReport = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`transition-all duration-300 ${
      isFullscreen
        ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-8 overflow-y-auto w-screen h-screen flex flex-col space-y-6'
        : 'p-4 sm:p-6 md:p-8 space-y-6 mx-auto'
    }`}>
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl bg-gradient-to-r from-amber-900 via-purple-900 to-indigo-900 text-white shadow-xl relative overflow-hidden transition-all ${isFullscreen ? 'py-4' : ''}`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-amber-200 text-xs font-bold">
              <span>🏆 স্কিল প্রগ্রেস ও অ্যানালিটিক্স</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black">
                VERIFIED CERTIFICATE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Skill Analytics & Official Certificate
            </h1>
            <p className="text-xs sm:text-sm text-amber-200 font-medium max-w-2xl">
              আপনার মাউস স্কিল, টাইপিং স্পিড, নির্ভুলতা ও আনলক করা ব্যাজের বিস্তারিত অ্যানালিটিক্স ও সার্টিফিকেট।
            </p>
          </div>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white text-white hover:text-indigo-950 border border-white/30 backdrop-blur-md font-black text-xs shadow-xl cursor-pointer transition-all flex items-center gap-2 self-start md:self-auto"
          >
            {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            <span>{isFullscreen ? 'স্বাভাবিক স্ক্রিন' : 'ফুল স্ক্রিন রিপোর্ট'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="animate-in fade-in duration-200">
        <FoundationsAnalytics
          progressData={progressData}
          user={user}
          isMasterFullscreen={isFullscreen}
          toggleMasterFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
};

export default SkillReport;
