import { store } from '../state/store.js';
import { generateVectorLetterheadSVG } from '../engines/svgRenderer.js';
import { showToast } from '../services/toastService.js';

export function setupCanvasController() {
  const container = document.getElementById('svgContainer');
  const paper = document.getElementById('paperWrapper');
  const viewport = document.getElementById('canvasViewport');
  const scrollArea = document.getElementById('artboardContainer');
  const zoomDisplay = document.getElementById('zoomLevelDisplay');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoom100Btn = document.getElementById('zoom100Btn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const statusBarTheme = document.getElementById('statusBarTheme');

  const PAPER_WIDTH = 817.7;
  const PAPER_HEIGHT = 1146.5;

  let isAutoFit = true;

  function calculateFitZoom() {
    if (!scrollArea) return 0.55;
    const availW = Math.max(300, scrollArea.clientWidth - 56);
    const availH = Math.max(300, scrollArea.clientHeight - 56);
    const scaleX = availW / PAPER_WIDTH;
    const scaleY = availH / PAPER_HEIGHT;
    const fitScale = Math.min(scaleX, scaleY);
    return Math.round(Math.min(Math.max(0.2, fitScale), 1.5) * 100) / 100;
  }

  function renderCanvas() {
    if (!container || !paper) return;
    const spec = store.getSpec();
    const showGuides = store.getShowGuides();
    const zoom = store.getZoom();

    const svgMarkup = generateVectorLetterheadSVG(spec, showGuides);
    container.innerHTML = svgMarkup;

    // Apply exact dimensions
    paper.style.width = `${PAPER_WIDTH}px`;
    paper.style.height = `${PAPER_HEIGHT}px`;
    paper.style.transform = `scale(${zoom})`;
    paper.style.transformOrigin = 'top center';
    paper.classList.toggle('app-mode-edit', store.getAppMode() === 'edit');

    // Synchronize viewport footprint so parent scrollbar matches exactly
    if (viewport) {
      viewport.style.width = `${PAPER_WIDTH * zoom}px`;
      viewport.style.height = `${PAPER_HEIGHT * zoom}px`;
    }

    if (zoomDisplay) {
      const fitZoom = calculateFitZoom();
      if (Math.abs(zoom - fitZoom) < 0.02 || isAutoFit) {
        zoomDisplay.textContent = `Fit (${Math.round(zoom * 100)}%)`;
      } else {
        zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
      }
    }

    if (statusBarTheme && spec.meta) {
      statusBarTheme.textContent = `Theme: ${spec.meta.style || 'Custom'} (${spec.meta.mood || 'corporate'})`;
    }
  }

  function setFitMode() {
    isAutoFit = true;
    const fitZoom = calculateFitZoom();
    store.setZoom(fitZoom);
    if (scrollArea) {
      scrollArea.scrollTop = 0;
      scrollArea.scrollLeft = 0;
    }
  }

  function zoomIn(step = 0.1) {
    isAutoFit = false;
    store.adjustZoom(step);
  }

  function zoomOut(step = 0.1) {
    isAutoFit = false;
    store.adjustZoom(-step);
  }

  function set100Percent() {
    isAutoFit = false;
    store.setZoom(1.0);
    if (scrollArea) {
      scrollArea.scrollTop = 0;
      scrollArea.scrollLeft = 0;
    }
    showToast('Zoom: 100% Actual Size');
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => zoomIn(0.1));
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => zoomOut(0.1));
  }

  if (zoom100Btn) {
    zoom100Btn.addEventListener('click', () => set100Percent());
  }

  if (zoomFitBtn) {
    zoomFitBtn.addEventListener('click', () => {
      setFitMode();
      showToast('Fit to Screen (Ctrl+0)');
    });
  }

  // Mouse Wheel Zoom (Ctrl + Wheel or Alt + Wheel)
  if (scrollArea) {
    scrollArea.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        isAutoFit = false;
        store.adjustZoom(delta);
      }
    }, { passive: false });
  }

  // Keyboard Shortcuts for Canvas Zoom
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isEditingText = activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable;

    if (isEditingText) return;

    // Ctrl + Plus (Zoom in)
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd')) {
      e.preventDefault();
      zoomIn(0.12);
      return;
    }

    // Ctrl + Minus (Zoom out)
    if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.code === 'NumpadSubtract')) {
      e.preventDefault();
      zoomOut(0.12);
      return;
    }

    // Ctrl + 0 (Fit to screen)
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      setFitMode();
      showToast('Fit to Screen (Ctrl+0)');
      return;
    }

    // Ctrl + 1 (100% actual size)
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
      e.preventDefault();
      set100Percent();
      return;
    }
  });

  // Auto re-calculate fit on window resize if in auto-fit mode
  window.addEventListener('resize', () => {
    if (isAutoFit) {
      const fitZoom = calculateFitZoom();
      store.setZoom(fitZoom);
    }
  });

  store.subscribe(() => {
    renderCanvas();
  });

  // Initial auto fit on mount
  setTimeout(() => {
    setFitMode();
    renderCanvas();
  }, 60);

  return { renderCanvas, setFitMode, zoomIn, zoomOut, set100Percent };
}
