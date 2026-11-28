import React, { useState, useEffect, useRef } from 'react';
import {
  FileCode2,
  FolderOpen,
  Monitor,
  Activity,
  Clock,
  Layers,
  Music,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ScriptMetadata } from '../types/pywebview';
import { studioApi, SampleScript } from '../services/api';

interface ScriptSelectorProps {
  metadata: ScriptMetadata | null;
  isLoading: boolean;
  onSelectNative: () => void;
  onUploadFile: (filename: string, content: string) => void;
  onSelectSample: (path: string) => void;
}

export default function ScriptSelector({
  metadata,
  isLoading,
  onSelectNative,
  onUploadFile,
  onSelectSample,
}: ScriptSelectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [samples, setSamples] = useState<SampleScript[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    studioApi.get_sample_scripts().then(setSamples).catch(() => {});
  }, []);

  const handleBrowseClick = () => {
    if (studioApi.hasPyWebView) {
      onSelectNative();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onUploadFile(file.name, text);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    onUploadFile(file.name, text);
  };

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".py"
      className="hidden"
      onChange={handleFileInputChange}
    />
  );

  // 1. Error State
  if (metadata && !metadata.success) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 backdrop-blur">
        {hiddenInput}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/30">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-200">Script Contract Error</h3>
            <p className="mt-1 text-xs text-red-300/80 leading-relaxed break-words font-mono">
              {metadata.error || 'Failed to import script.'}
            </p>
            <button
              onClick={handleBrowseClick}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/30 ring-1 ring-red-500/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Select Different Script
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Loaded State
  if (metadata && metadata.success) {
    const is4K = (metadata.width || 0) >= 3840;
    const isFHD = (metadata.width || 0) >= 1920 && !is4K;

    return (
      <div className="rounded-2xl border border-surface-50 bg-surface-200/90 p-5 shadow-xl backdrop-blur transition hover:border-surface-50/80">
        {hiddenInput}
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-surface-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/25 shadow-sm shadow-accent/20">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {metadata.filename}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate" title={metadata.script_path}>
                {metadata.script_path}
              </p>
            </div>
          </div>

          <button
            onClick={handleBrowseClick}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-surface-50 bg-surface-100 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-surface-50 hover:text-slate-100 disabled:opacity-50 shrink-0 shadow-sm"
          >
            <FolderOpen className="h-3.5 w-3.5 text-accent" />
            <span>Change File</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Resolution */}
          <div className="rounded-xl border border-surface-50/80 bg-surface-300/60 p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Monitor className="h-3.5 w-3.5 text-accent" />
              <span>Resolution</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-sm font-bold text-slate-100">
                {metadata.width}×{metadata.height}
              </span>
              <span className="text-[10px] font-semibold text-accent/80">
                {is4K ? '4K' : isFHD ? '1080p' : 'Custom'}
              </span>
            </div>
          </div>

          {/* Framerate */}
          <div className="rounded-xl border border-surface-50/80 bg-surface-300/60 p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
              <span>Framerate</span>
            </div>
            <div className="mt-1">
              <span className="font-mono text-sm font-bold text-slate-100">
                {metadata.fps} <span className="text-xs font-normal text-slate-400">FPS</span>
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="rounded-xl border border-surface-50/80 bg-surface-300/60 p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Duration</span>
            </div>
            <div className="mt-1">
              <span className="font-mono text-sm font-bold text-slate-100">
                {metadata.duration}s
              </span>
            </div>
          </div>

          {/* Total Frames */}
          <div className="rounded-xl border border-surface-50/80 bg-surface-300/60 p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Total Frames</span>
            </div>
            <div className="mt-1">
              <span className="font-mono text-sm font-bold text-slate-100">
                {metadata.frames}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Track Badge (if defined) */}
        {metadata.audio && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-300/40 px-3 py-1.5 border border-surface-50/50 text-xs text-slate-300">
            <Music className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-slate-400">Audio Track:</span>
            <span className="font-mono text-slate-200 truncate">{metadata.audio}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. Empty State (Dropzone)
  return (
    <div className="space-y-3">
      {hiddenInput}
      <div
        onClick={handleBrowseClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200 ${
          isHovered || isDragging
            ? 'border-accent/60 bg-surface-200/80 shadow-lg shadow-accent/5'
            : 'border-surface-50 bg-surface-200/40 hover:border-slate-600 hover:bg-surface-200/60'
        }`}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 ${
            isHovered || isDragging
              ? 'bg-accent/20 text-accent scale-105 shadow-md shadow-accent/20'
              : 'bg-surface-100 text-slate-400 group-hover:text-slate-200'
          }`}
        >
          <FolderOpen className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-200 group-hover:text-white">
          {isLoading ? 'Inspecting Animation Script...' : 'Select or Drop PyCairo Animation Script'}
        </h3>

        <p className="mt-1 text-center text-xs text-slate-400 max-w-sm">
          Click to browse or drag & drop a <span className="font-mono text-accent">.py</span> animation script containing{' '}
          <span className="font-mono text-slate-300">render(t)</span>
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-surface-50 bg-surface-100/60 px-3 py-1 text-[11px] font-medium text-slate-400">
          <span>Supported: 4K, 1080p, 60fps, MP4/WebM</span>
        </div>
      </div>

      {/* Quick Sample Selector */}
      {samples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-accent" /> Quick test sample:
          </span>
          {samples.map((s) => (
            <button
              key={s.path}
              onClick={() => onSelectSample(s.path)}
              className="rounded-lg border border-surface-50 bg-surface-200 px-2.5 py-1 text-xs font-mono text-accent hover:bg-surface-100 hover:border-accent/40 transition"
            >
              {s.filename}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
