import React from 'react';
import { 
  Play, 
  Sparkles, 
  Flame, 
  Camera, 
  Share2, 
  Globe2, 
  Video, 
  CheckCircle2 
} from 'lucide-react';

export const SupportedSites: React.FC = () => {
  const platforms = [
    {
      name: 'TikTok',
      desc: 'HD MP4 without watermarks',
      tag: 'No Watermark',
      color: 'from-cyan-500 to-blue-500',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      name: 'YouTube',
      desc: '1080p, 720p & MP3 Audio',
      tag: 'Full HD',
      color: 'from-red-500 to-rose-600',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20'
    },
    {
      name: 'Instagram',
      desc: 'Reels, Posts & IGTV Videos',
      tag: 'Reels & Audio',
      color: 'from-pink-500 to-purple-600',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
    },
    {
      name: 'Facebook',
      desc: 'Watch & Public Reels in HD',
      tag: 'HD & SD',
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    {
      name: 'Twitter / X',
      desc: 'Original quality MP4 clips',
      tag: 'Fast Rip',
      color: 'from-sky-400 to-blue-500',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    },
    {
      name: 'Reddit',
      desc: 'Video with synchronized audio',
      tag: 'Audio Merged',
      color: 'from-orange-500 to-red-500',
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    },
    {
      name: 'Pinterest',
      desc: 'Download videos and animated pins',
      tag: 'Direct MP4',
      color: 'from-rose-500 to-pink-600',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    {
      name: '1,500+ Sites',
      desc: 'Vimeo, Dailymotion, Soundcloud & more',
      tag: 'Universal',
      color: 'from-purple-500 to-indigo-500',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
  ];

  return (
    <section id="supported" className="py-16 sm:py-24 border-t border-slate-800/80">
      <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-4">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Universal Compatibility</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Supported Video Platforms
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Save videos seamlessly from all leading social networks and video platforms with a single click.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {platforms.map((platform, idx) => (
            <div
              key={idx}
              className="glass-panel neon-glow-card p-5 rounded-2xl border border-slate-800/80 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${platform.color} flex items-center justify-center text-white font-bold text-base shadow-md group-hover:rotate-3 transition-transform`}>
                  {platform.name[0]}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${platform.badgeColor}`}>
                  {platform.tag}
                </span>
              </div>

              <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                {platform.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {platform.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
