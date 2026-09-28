// frontend/src/components/common/ProtectedCanvasPreview.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface ProtectedCanvasPreviewProps {
  svgContent: string;
  size?: number;
  className?: string;
}

/**
 * Layer 3 Security Component:
 * Renders vector paths onto an HTML5 <canvas> element instead of directly injecting raw <svg> DOM nodes.
 * 
 * Benefits:
 * 1. Blocks Chrome extensions like "SVG Grabber" from scraping (they query for document.querySelectorAll('svg')).
 * 2. Blocks DevTools "Inspect Element -> Copy outerHTML" as there are no <svg> or <path> nodes in the DOM tree.
 * 3. Retina display crisp rendering using window.devicePixelRatio scaling.
 * 4. Disables right-click, selection, and drag operations.
 */
export default function ProtectedCanvasPreview({
  svgContent,
  size = 32,
  className = '',
}: ProtectedCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
    const displaySize = Math.max(16, size);

    // High DPI Retina scaling
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displaySize, displaySize);

    if (!svgContent) return;

    // Ensure valid SVG namespace for canvas Image loading
    const cleanSvg = svgContent.includes('xmlns="http://www.w3.org/2000/svg"')
      ? svgContent
      : svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

    const img = new Image();
    const encodedSvg = encodeURIComponent(cleanSvg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');

    img.onload = () => {
      ctx.clearRect(0, 0, displaySize, displaySize);
      ctx.drawImage(img, 0, 0, displaySize, displaySize);
    };

    img.src = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  }, [svgContent, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none block shrink-0 ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      draggable={false}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    />
  );
}
