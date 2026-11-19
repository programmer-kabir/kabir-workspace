import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Clock, 
  User, 
  Eye, 
  Check, 
  ExternalLink,
  Sparkles,
  Volume2,
  QrCode,
  X,
  Share2,
  Copy,
  Smartphone,
  Wifi,
  Camera,
  Play,
  Loader2
} from 'lucide-react';
import { VideoMetadata, VideoFormat } from '../types';
import { getDownloadUrl } from '../services/api';

interface VideoCardProps {
  data: VideoMetadata;
}

export const VideoCard: React.FC<VideoCardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'thumbnail'>('video');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);
  const [qrType, setQrType] = useState<'video' | 'audio'>('video');
  const [effectiveBaseUrl, setEffectiveBaseUrl] = useState<string>(window.location.origin);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);

  // Fetch local LAN IP or effective domain from backend
  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((net) => {
        if (net?.effectiveBaseUrl) {
          setEffectiveBaseUrl(net.effectiveBaseUrl);
        }
      })
      .catch((err) => {
        console.warn('Network info lookup fell back to origin:', err);
      });
  }, []);

  const handleDownload = (format?: VideoFormat, isAudio = false) => {
    const idKey = isAudio ? 'audio' : format?.formatId || 'default';
    setDownloadingId(idKey);

    const downloadLink = getDownloadUrl({
      url: data.originalUrl,
      formatId: isAudio ? undefined : format?.formatId,
      type: isAudio ? 'audio' : 'video',
      title: data.title
    });

    const anchor = document.createElement('a');
    anchor.href = downloadLink;
    anchor.setAttribute('download', `${data.title || 'media'}.${isAudio ? 'mp3' : 'mp4'}`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      setDownloadingId(null);
    }, 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.originalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleThumbnailDownload = () => {
    if (!data.thumbnail) return;
    window.open(data.thumbnail, '_blank');
  };

  // Direct download link generated for mobile phones
  const directMobileDownloadUrl = `${effectiveBaseUrl}/api/download?url=${encodeURIComponent(
    data.originalUrl
  )}&type=${qrType}&title=${encodeURIComponent(data.title)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    directMobileDownloadUrl
  )}`;

  const handleCopyMobileLink = () => {
    navigator.clipboard.writeText(directMobileDownloadUrl);
    setCopiedMobileLink(true);
    setTimeout(() => setCopiedMobileLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-20 animate-fade-in">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Thumbnail & Live Preview Player */}
          <div className="md:col-span-5 relative group">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-lg">
              {isPlayingPreview ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  {/* Loading spinner while stream buffers */}
                  {previewLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 gap-2">
                      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                      <span className="text-xs font-semibold text-slate-300">Loading stream preview...</span>
                    </div>
                  )}

                  {data.platform.id === 'youtube' && data.id ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${data.id}?autoplay=1&rel=0`}
                      title={data.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => setPreviewLoading(false)}
                      className="w-full h-full border-0 rounded-2xl"
                    />
                  ) : (
                    <video
                      src={`/api/preview?url=${encodeURIComponent(data.originalUrl)}`}
                      controls
                      autoPlay
                      playsInline
                      onLoadedData={() => setPreviewLoading(false)}
                      onPlaying={() => setPreviewLoading(false)}
                      onWaiting={() => setPreviewLoading(true)}
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  )}

                  {/* Close Preview Button */}
                  <button
                    onClick={() => {
                      setIsPlayingPreview(false);
                      setPreviewLoading(true);
                    }}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-rose-600 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1 transition-colors z-20 shadow-lg"
                    title="Close preview"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {data.thumbnail ? (
                    <img
                      src={data.thumbnail}
                      alt={data.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Film className="w-12 h-12" />
                    </div>
                  )}

                  {/* Center Glowing "Play Preview" Button */}
                  <button
                    onClick={() => setIsPlayingPreview(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/50 transition-colors z-10"
                    title="Watch live preview before downloading"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-indigo-600 text-white font-bold text-xs backdrop-blur-md border border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200">
                      <Play className="w-4 h-4 text-indigo-400 fill-indigo-400 hover:text-white hover:fill-white transition-colors" />
                      <span>Live Preview</span>
                    </div>
                  </button>

                  {/* Duration Badge */}
                  {data.duration && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-1 z-10 pointer-events-none">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{data.duration}</span>
                    </div>
                  )}

                  {/* Platform Badge */}
                  <div 
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-md backdrop-blur-md z-10 pointer-events-none"
                    style={{ backgroundColor: data.platform.color }}
                  >
                    {data.platform.name}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action buttons below thumbnail */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {/* Send to Phone QR button */}
              <button
                onClick={() => setShowQrModal(true)}
                className="group py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                <span>Save to Phone</span>
              </button>

              {/* Copy URL */}
              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* View Full-Res Thumbnail */}
            {data.thumbnail && (
              <button
                onClick={handleThumbnailDownload}
                className="mt-2 w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Full-Res Thumbnail</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          {/* Right Column: Video Details & Format Choices */}
          <div className="md:col-span-7 flex flex-col justify-between">
            
            {/* Title & Creator */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2 mb-3">
                {data.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 mb-6">
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>{data.uploader}</span>
                </div>

                {data.viewCount && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>{data.viewCount} views</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'video'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Video Options</span>
              </button>

              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'audio'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Audio (MP3)</span>
              </button>
            </div>

            {/* Tab Contents: Video Formats */}
            {activeTab === 'video' && (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {data.videoFormats && data.videoFormats.length > 0 ? (
                  data.videoFormats.map((format, idx) => (
                    <div
                      key={format.formatId || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          format.height >= 1080 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : format.height >= 720
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {format.resolution}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            MP4 Video {format.qualityName ? `(${format.qualityName})` : ''}
                          </p>
                          <p className="text-xs text-slate-400">
                            {format.size ? `Approx. ${format.size}` : 'Standard size'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(format, false)}
                        disabled={downloadingId === format.formatId}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                      >
                        {downloadingId === format.formatId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Starting...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Best Available MP4</p>
                      <p className="text-xs text-slate-400">Standard High Quality stream</p>
                    </div>
                    <button
                      onClick={() => handleDownload()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab Contents: Audio Formats */}
            {activeTab === 'audio' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">MP3 High Quality Audio</p>
                      <p className="text-xs text-slate-400">320kbps stereo audio rip</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(undefined, true)}
                    disabled={downloadingId === 'audio'}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all active:scale-95"
                  >
                    {downloadingId === 'audio' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Music className="w-3.5 h-3.5" />
                        <span>Download MP3</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 📱 Interactive QR Code Modal for Instant Phone Download */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl max-w-sm w-full border border-slate-700 text-center relative shadow-2xl">
            
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/25">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Download to Phone
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Scan with your iPhone or Android camera to download directly.
            </p>

            {/* Format Selection Toggle */}
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setQrType('video')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  qrType === 'video'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎬 Video (MP4)
              </button>
              <button
                type="button"
                onClick={() => setQrType('audio')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  qrType === 'audio'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎵 Audio (MP3)
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl inline-block shadow-xl mx-auto mb-4 border-2 border-indigo-500/20">
              <img
                src={qrImageUrl}
                alt="Scan to Download on Phone"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            {/* Quick 3-step guide */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-left text-[11px] text-slate-400 space-y-1.5 mb-4">
              <p className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">1</span>
                <span>Open your phone's default <b>Camera</b></span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">2</span>
                <span>Point at this QR Code</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">3</span>
                <span>Tap the link banner to save directly</span>
              </p>
            </div>

            {/* Copy direct link button */}
            <button
              onClick={handleCopyMobileLink}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedMobileLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Mobile link copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Copy Direct Download Link</span>
                </>
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
