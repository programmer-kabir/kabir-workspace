import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FiEdit2, FiSquare, FiCircle, FiArrowRight, FiType,
  FiTrash2, FiRotateCcw, FiDownload, FiX, FiLock,
  FiUnlock, FiEye
} from 'react-icons/fi';
import { toast } from 'sonner';

const COLOR_PALETTE = [
  { label: 'White', value: '#ffffff' },
  { label: 'Sky', value: '#38bdf8' },
  { label: 'Emerald', value: '#34d399' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Violet', value: '#a855f7' }
];

const STROKE_SIZES = [
  { label: 'Thin', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Thick', size: 8 }
];

export default function InteractiveWhiteboard({
  isHost = false,
  canDraw = false,
  sharedBy = null,
  allowOthers = false,
  onToggleAllowOthers,
  onClose,
  history = [],
  onBroadcastAction,
  onBroadcastUndo,
  onBroadcastClear,
  currentUser
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text'
  const [selectedColor, setSelectedColor] = useState('#38bdf8');
  const [selectedSize, setSelectedSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textModal, setTextModal] = useState(null); // { x, y, normX, normY }
  const [textInput, setTextInput] = useState('');

  // Current stroke / shape draft
  const currentActionRef = useRef(null);

  // Redraw complete canvas from history stack
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Fill background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Render all actions in history
    history.forEach((action) => {
      renderAction(ctx, action, width, height);
    });
  }, [history]);

  // Helper to render a single action
  const renderAction = (ctx, action, width, height) => {
    if (!action) return;

    if (action.tool === 'pen' || action.tool === 'eraser') {
      if (!action.points || action.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = action.tool === 'eraser' ? '#0f172a' : action.color;
      ctx.lineWidth = action.tool === 'eraser' ? action.size * 3 : action.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      action.points.forEach((pt, i) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    } else if (action.tool === 'rect') {
      if (!action.start || !action.end) return;
      ctx.save();
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const x = Math.min(action.start.x, action.end.x) * width;
      const y = Math.min(action.start.y, action.end.y) * height;
      const w = Math.abs(action.end.x - action.start.x) * width;
      const h = Math.abs(action.end.y - action.start.y) * height;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    } else if (action.tool === 'circle') {
      if (!action.start || !action.end) return;
      ctx.save();
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.size;
      const sx = action.start.x * width;
      const sy = action.start.y * height;
      const ex = action.end.x * width;
      const ey = action.end.y * height;
      const radiusX = Math.abs(ex - sx) / 2;
      const radiusY = Math.abs(ey - sy) / 2;
      const centerX = Math.min(sx, ex) + radiusX;
      const centerY = Math.min(sy, ey) + radiusY;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    } else if (action.tool === 'arrow') {
      if (!action.start || !action.end) return;
      ctx.save();
      ctx.strokeStyle = action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = action.size;
      ctx.lineCap = 'round';

      const sx = action.start.x * width;
      const sy = action.start.y * height;
      const ex = action.end.x * width;
      const ey = action.end.y * height;

      // Draw main line
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(ey - sy, ex - sx);
      const headLen = Math.max(12, action.size * 3);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (action.tool === 'text') {
      if (!action.point || !action.text) return;
      ctx.save();
      ctx.fillStyle = action.color;
      const fontSize = Math.max(14, action.size * 4);
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillText(action.text, action.point.x * width, action.point.y * height);
      ctx.restore();
    }
  };

  // Resize canvas to fill container with proper pixel ratio
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width;
    canvas.height = rect.height;
    redraw();
  }, [redraw]);

  useEffect(() => {
    handleResize();
    const ro = new ResizeObserver(() => handleResize());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [handleResize]);

  // Redraw when history changes
  useEffect(() => {
    redraw();
  }, [history, redraw]);

  // Pointer coordinate calculation (Normalized 0.0 to 1.0)
  const getNormPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { normX: 0, normY: 0, px: 0, py: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const normX = Math.max(0, Math.min(1, px / rect.width));
    const normY = Math.max(0, Math.min(1, py / rect.height));
    return { normX, normY, px, py };
  };

  // Start Drawing
  const handlePointerDown = (e) => {
    if (!canDraw) {
      toast.warning('🔒 You are in View-Only mode.');
      return;
    }
    const { normX, normY, px, py } = getNormPos(e);

    // If text tool, open inline input
    if (activeTool === 'text') {
      setTextModal({ x: px, y: py, normX, normY });
      setTextInput('');
      return;
    }

    setIsDrawing(true);
    e.target.setPointerCapture?.(e.pointerId);

    if (activeTool === 'pen' || activeTool === 'eraser') {
      currentActionRef.current = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tool: activeTool,
        color: selectedColor,
        size: selectedSize,
        points: [{ x: normX, y: normY }]
      };
    } else if (['rect', 'circle', 'arrow'].includes(activeTool)) {
      currentActionRef.current = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tool: activeTool,
        color: selectedColor,
        size: selectedSize,
        start: { x: normX, y: normY },
        end: { x: normX, y: normY }
      };
    }
  };

  // Pointer Move (Drawing drag)
  const handlePointerMove = (e) => {
    if (!isDrawing || !currentActionRef.current || !canvasRef.current) return;
    const { normX, normY } = getNormPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      currentActionRef.current.points.push({ x: normX, y: normY });
      // Redraw history + current active stroke
      redraw();
      renderAction(ctx, currentActionRef.current, width, height);
    } else if (['rect', 'circle', 'arrow'].includes(activeTool)) {
      currentActionRef.current.end = { x: normX, y: normY };
      // Live preview
      redraw();
      renderAction(ctx, currentActionRef.current, width, height);
    }
  };

  // Pointer Up (Finalize Action)
  const handlePointerUp = (e) => {
    if (!isDrawing || !currentActionRef.current) return;
    setIsDrawing(false);
    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch (err) {}

    const finishedAction = currentActionRef.current;
    currentActionRef.current = null;

    // Validate action
    if (finishedAction.tool === 'pen' || finishedAction.tool === 'eraser') {
      if (finishedAction.points.length < 2) return;
    }

    // Broadcast action to all participants
    if (onBroadcastAction) {
      onBroadcastAction(finishedAction);
    }
  };

  // Submit Text Action
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || !textModal) {
      setTextModal(null);
      return;
    }
    const action = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tool: 'text',
      color: selectedColor,
      size: selectedSize,
      point: { x: textModal.normX, y: textModal.normY },
      text: textInput.trim()
    };
    setTextModal(null);
    setTextInput('');
    if (onBroadcastAction) {
      onBroadcastAction(action);
    }
  };

  // Download Canvas as PNG Snapshot
  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cca-whiteboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('📸 Whiteboard snapshot downloaded!');
  };

  return (
    <div className="relative w-full h-full flex flex-col rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 border border-purple-500/40 shadow-2xl">
      
      {/* 🌟 TOP CONTROL HEADER */}
      <div className="h-12 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20 text-white select-none">
        
        {/* Left: Presenter & Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-sm">
            <span className="text-sm">🎨</span>
            <span>Interactive Whiteboard</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-300 text-[11px] border border-slate-700">
            <span>Presenter:</span>
            <span className="font-bold text-white">{sharedBy?.userName || 'Host'}</span>
          </div>

          {!canDraw && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 text-[11px] font-bold border border-amber-500/30">
              <FiEye size={12} />
              <span>View-Only</span>
            </div>
          )}
        </div>

        {/* Right: Collaboration Toggle, Download, Close */}
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={onToggleAllowOthers}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-sm ${
                allowOthers
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={allowOthers 
                ? 'Lock drawing for participants' 
                : 'Allow participants to draw'}
            >
              {allowOthers ? <FiUnlock size={12} className="text-emerald-400" /> : <FiLock size={12} />}
              <span>{allowOthers ? 'Drawing Unlocked' : 'Host Only'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadSnapshot}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-slate-700"
            title="Download Snapshot"
          >
            <FiDownload size={13} />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 hover:text-white border border-rose-500/40 transition cursor-pointer"
            title="Close Whiteboard"
          >
            <FiX size={15} />
          </button>
        </div>
      </div>

      {/* 🌟 CANVAS DRAWING AREA */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden select-none cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Inline Text Box Popup */}
        {textModal && (
          <form
            onSubmit={handleTextSubmit}
            style={{ left: `${textModal.x}px`, top: `${textModal.y}px` }}
            className="absolute z-50 bg-slate-900 border border-purple-500 rounded-xl p-2 shadow-2xl flex items-center gap-2 animate-in zoom-in-95 duration-100"
          >
            <input
              type="text"
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type text..."
              style={{ color: selectedColor }}
              className="bg-transparent border-b border-slate-700 px-2 py-1 text-sm font-semibold outline-none focus:border-purple-400 min-w-[160px]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setTextModal(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* 🌟 BOTTOM FLOATING TOOLBAR (When user has draw permission) */}
      {canDraw && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 shadow-2xl max-w-[95%] overflow-x-auto text-white">
          
          {/* Tool Selection Group */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Pen Tool"
            >
              <FiEdit2 size={15} />
            </button>

            <button
              onClick={() => setActiveTool('rect')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'rect'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Rectangle Tool"
            >
              <FiSquare size={15} />
            </button>

            <button
              onClick={() => setActiveTool('circle')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'circle'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Circle Tool"
            >
              <FiCircle size={15} />
            </button>

            <button
              onClick={() => setActiveTool('arrow')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'arrow'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Arrow Tool"
            >
              <FiArrowRight size={15} />
            </button>

            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Text Tool"
            >
              <FiType size={15} />
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Eraser Tool"
            >
              <span className="text-sm">🧽</span>
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 px-1 border-r border-slate-800">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-slate-700 ${
                  selectedColor === c.value ? 'scale-125 ring-2 ring-purple-400' : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                title={c.label}
              />
            ))}
          </div>

          {/* Stroke Size Selector */}
          <div className="flex items-center gap-1 px-1 border-r border-slate-800">
            {STROKE_SIZES.map((s) => (
              <button
                key={s.size}
                onClick={() => setSelectedSize(s.size)}
                className={`w-7 h-7 rounded-xl text-[11px] font-bold flex items-center justify-center transition cursor-pointer ${
                  selectedSize === s.size
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={`${s.label} (${s.size}px)`}
              >
                {s.size}
              </button>
            ))}
          </div>

          {/* Undo & Clear Action Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={onBroadcastUndo}
              disabled={history.length === 0}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition cursor-pointer"
              title="Undo Action"
            >
              <FiRotateCcw size={15} />
            </button>

            <button
              onClick={onBroadcastClear}
              disabled={history.length === 0}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-40 transition cursor-pointer"
              title="Clear Whiteboard"
            >
              <FiTrash2 size={15} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
