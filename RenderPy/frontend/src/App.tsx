import React, { useEffect, useState } from 'react';
import { Film, Cpu, HardDrive } from 'lucide-react';
import { ScriptMetadata, SystemInfo } from './types/pywebview';
import { studioApi } from './services/api';
import ScriptSelector from './components/ScriptSelector';
import TimelinePreview from './components/TimelinePreview';

export default function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [scriptMeta, setScriptMeta] = useState<ScriptMetadata | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const info = await studioApi.get_system_info();
        setSystemInfo(info);
        setIsReady(true);
      } catch (e) {
        console.error('Failed to load system info:', e);
      }
    };

    init();
    window.addEventListener('pywebviewready', init);
    return () => window.removeEventListener('pywebviewready', init);
  }, []);

  const handleInspectPath = async (filePath: string) => {
    try {
      setIsLoadingScript(true);
      const meta = await studioApi.inspect_script(filePath);
      setScriptMeta(meta);
    } catch (err: any) {
      setScriptMeta({
        success: false,
        error: err?.message || 'Failed to inspect script',
      });
    } finally {
      setIsLoadingScript(false);
    }
  };

  const handleUploadFile = async (filename: string, content: string) => {
    try {
      setIsLoadingScript(true);
      const meta = await studioApi.upload_script(filename, content);
      setScriptMeta(meta);
    } catch (err: any) {
      setScriptMeta({
        success: false,
        error: err?.message || 'Failed to upload script',
      });
    } finally {
      setIsLoadingScript(false);
    }
  };

  const handleSelectNative = async () => {
    try {
      setIsLoadingScript(true);
      const filePath = await studioApi.select_script_dialog();
      if (!filePath) {
        setIsLoadingScript(false);
        return;
      }
      await handleInspectPath(filePath);
    } catch (err: any) {
      setScriptMeta({
        success: false,
        error: err?.message || 'Failed to open file dialog',
      });
      setIsLoadingScript(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-slate-100">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-50 bg-surface-200/80 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-sm shadow-accent/20 ring-1 ring-accent/30">
            <Film className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-slate-100">RenderPy Studio</h1>
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">v1.1</span>
            </div>
            <p className="text-[11px] text-slate-400">4K PyCairo Vector Animation Renderer</p>
          </div>
        </div>

        {/* System Diagnostics Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-surface-50 bg-surface-300/60 px-3 py-1.5">
            <HardDrive className={`h-3.5 w-3.5 ${systemInfo?.ffmpeg_installed ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              {systemInfo?.ffmpeg_installed ? 'FFmpeg Ready' : 'FFmpeg Missing'}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-surface-50 bg-surface-300/60 px-3 py-1.5">
            <Cpu className="h-3.5 w-3.5 text-accent" />
            <span className="text-slate-300 font-mono">
              {systemInfo ? `${systemInfo.cpu_cores} Cores` : 'Detecting...'}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-surface-50 bg-surface-300/80 px-3 py-1 text-[11px]">
            <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">
              {isReady ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Section 1: Script Selector and Info Card */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. Animation Script
              </h2>
              {scriptMeta?.success && (
                <span className="text-xs text-slate-400">
                  {scriptMeta.frames} total frames to render
                </span>
              )}
            </div>

            <ScriptSelector
              metadata={scriptMeta}
              isLoading={isLoadingScript}
              onSelectNative={handleSelectNative}
              onUploadFile={handleUploadFile}
              onSelectSample={handleInspectPath}
            />
          </section>

          {/* Section 2: Live Frame Preview and Timeline Slider */}
          {scriptMeta?.success && (
            <section className="animate-fadeIn">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  2. Interactive Timeline & Frame Preview
                </h2>
                <span className="text-xs text-accent">Scrub slider to preview frame</span>
              </div>

              <TimelinePreview metadata={scriptMeta} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
