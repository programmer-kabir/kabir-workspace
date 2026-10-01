import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupDragController(onSpecUpdated) {
  const container = document.getElementById('svgContainer');
  const paper = document.getElementById('paperWrapper');
  const modePreviewBtn = document.getElementById('modePreviewBtn');
  const modeEditBtn = document.getElementById('modeEditBtn');
  const resetPosBtn = document.getElementById('resetPositionsBtn');

  let activeElement = null;
  let activeKey = null;
  let startPointerX = 0;
  let startPointerY = 0;
  let initialElemX = 0;
  let initialElemY = 0;
  let currentElemX = 0;
  let currentElemY = 0;
  let isDragging = false;

  // Floating Coordinate & Label Tooltip
  let hudTooltip = document.getElementById('canvasDragHud');
  if (!hudTooltip) {
    hudTooltip = document.createElement('div');
    hudTooltip.id = 'canvasDragHud';
    hudTooltip.className = 'fixed pointer-events-none z-50 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-cyan-400 text-cyan-200 text-[11px] font-mono shadow-2xl backdrop-blur transform -translate-x-1/2 -translate-y-full mb-2 hidden flex items-center gap-1.5 transition-opacity duration-75';
    document.body.appendChild(hudTooltip);
  }

  // Floating Selection Overlay Box
  let selectionBox = document.getElementById('canvasSelectionOverlay');
  if (!selectionBox) {
    selectionBox = document.createElement('div');
    selectionBox.id = 'canvasSelectionOverlay';
    selectionBox.className = 'absolute pointer-events-none border border-cyan-400 border-dashed rounded bg-cyan-400/5 hidden z-30 transition-all duration-75';
    selectionBox.innerHTML = `
      <div class="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-sm border border-slate-900"></div>
      <div class="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-sm border border-slate-900"></div>
      <div class="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-sm border border-slate-900"></div>
      <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-sm border border-slate-900"></div>
    `;
    if (paper) paper.appendChild(selectionBox);
  }

  function getElementCoordinates(elem) {
    const transformAttr = elem.getAttribute('transform') || '';
    const match = /translate\(\s*([-\d.]+)\s*[, ]\s*([-\d.]+)\s*\)/.exec(transformAttr);
    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    }
    return { x: 0, y: 0 };
  }

  function updateSelectionBox(elem) {
    if (!elem || !paper || !store.getDragMode()) {
      if (selectionBox) selectionBox.classList.add('hidden');
      return;
    }

    try {
      const bbox = elem.getBBox();
      const coords = getElementCoordinates(elem);

      // Position relative to paperWrapper
      const left = coords.x + bbox.x - 4;
      const top = coords.y + bbox.y - 4;
      const width = bbox.width + 8;
      const height = bbox.height + 8;

      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
      selectionBox.classList.remove('hidden');
    } catch (err) {
      if (selectionBox) selectionBox.classList.add('hidden');
    }
  }

  function updateToolbarState() {
    const isDrag = store.getDragMode();
    const appMode = store.getAppMode();

    if (modePreviewBtn) {
      const isPreview = appMode === 'preview';
      modePreviewBtn.classList.toggle('bg-cyan-500', isPreview);
      modePreviewBtn.classList.toggle('text-slate-950', isPreview);
      modePreviewBtn.classList.toggle('font-bold', isPreview);
      modePreviewBtn.classList.toggle('shadow-sm', isPreview);
      modePreviewBtn.classList.toggle('text-slate-400', !isPreview);
      modePreviewBtn.classList.toggle('hover:text-slate-200', !isPreview);
    }

    if (modeEditBtn) {
      const isEdit = appMode === 'edit';
      modeEditBtn.classList.toggle('bg-gradient-to-r', isEdit);
      modeEditBtn.classList.toggle('from-cyan-400', isEdit);
      modeEditBtn.classList.toggle('to-blue-500', isEdit);
      modeEditBtn.classList.toggle('text-slate-950', isEdit);
      modeEditBtn.classList.toggle('font-bold', isEdit);
      modeEditBtn.classList.toggle('shadow-md', isEdit);
      modeEditBtn.classList.toggle('text-slate-400', !isEdit);
      modeEditBtn.classList.toggle('hover:text-slate-200', !isEdit);
    }

    // Toggle pointer styling on svg
    if (container) {
      container.classList.toggle('interactive-drag-enabled', isDrag);
    }

    if (!isDrag && selectionBox) {
      selectionBox.classList.add('hidden');
    }
  }

  // Pointer Down Handler
  function handlePointerDown(e) {
    if (!store.getDragMode()) return;
    if (e.button !== 0) return; // Left mouse button only

    const draggableGroup = e.target.closest('[data-draggable]');
    if (!draggableGroup) {
      store.setSelectedElement(null);
      if (selectionBox) selectionBox.classList.add('hidden');
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    activeElement = draggableGroup;
    activeKey = draggableGroup.getAttribute('data-draggable');
    store.setSelectedElement(activeKey);

    const coords = getElementCoordinates(activeElement);
    initialElemX = coords.x;
    initialElemY = coords.y;
    currentElemX = coords.x;
    currentElemY = coords.y;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    isDragging = true;

    activeElement.classList.add('is-dragging');
    updateSelectionBox(activeElement);

    // Show initial HUD
    const label = activeElement.getAttribute('data-label') || activeKey;
    hudTooltip.innerHTML = `<span class="font-semibold text-white">${label}</span> <span class="text-cyan-400 font-mono">X:${Math.round(initialElemX)}, Y:${Math.round(initialElemY)}</span>`;
    hudTooltip.style.left = `${e.clientX}px`;
    hudTooltip.style.top = `${e.clientY - 12}px`;
    hudTooltip.classList.remove('hidden');

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  // Pointer Move Handler
  function handlePointerMove(e) {
    if (!isDragging || !activeElement) return;

    e.preventDefault();
    const zoom = store.getZoom() || 1.0;
    let dx = (e.clientX - startPointerX) / zoom;
    let dy = (e.clientY - startPointerY) / zoom;

    // Shift key: Axis Constraint (Horizontal or Vertical lock)
    if (e.shiftKey) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    let targetX = initialElemX + dx;
    let targetY = initialElemY + dy;

    // Snap to 8px Grid
    if (store.getSnapGrid()) {
      targetX = Math.round(targetX / 8) * 8;
      targetY = Math.round(targetY / 8) * 8;
    }

    currentElemX = Math.round(targetX * 10) / 10;
    currentElemY = Math.round(targetY * 10) / 10;

    // Fast 60FPS DOM Transform
    activeElement.setAttribute('transform', `translate(${currentElemX}, ${currentElemY})`);
    updateSelectionBox(activeElement);

    // Update HUD Pill
    const label = activeElement.getAttribute('data-label') || activeKey;
    hudTooltip.innerHTML = `<span class="font-semibold text-white">${label}</span> <span class="text-cyan-400 font-mono">X:${Math.round(currentElemX)}, Y:${Math.round(currentElemY)}</span>`;
    hudTooltip.style.left = `${e.clientX}px`;
    hudTooltip.style.top = `${e.clientY - 12}px`;
  }

  // Pointer Up Handler
  function handlePointerUp(e) {
    if (!isDragging) return;

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    if (activeElement) {
      activeElement.classList.remove('is-dragging');
      const label = activeElement.getAttribute('data-label') || activeKey;

      const hasMoved = Math.abs(currentElemX - initialElemX) > 0.5 || Math.abs(currentElemY - initialElemY) > 0.5;
      if (hasMoved && activeKey) {
        store.updateElementPosition(activeKey, currentElemX, currentElemY, true);
        if (onSpecUpdated) onSpecUpdated();
        showToast(`📍 "${label}" moved to (${Math.round(currentElemX)}, ${Math.round(currentElemY)})`);
      }
    }

    isDragging = false;
    activeElement = null;
    hudTooltip.classList.add('hidden');
  }

  // Hover Tooltip / Mouseover Preview
  function handlePointerOver(e) {
    if (!store.getDragMode() || isDragging) return;
    const draggableGroup = e.target.closest('[data-draggable]');
    if (draggableGroup) {
      draggableGroup.classList.add('draggable-hover');
    }
  }

  function handlePointerOut(e) {
    if (isDragging) return;
    const draggableGroup = e.target.closest('[data-draggable]');
    if (draggableGroup) {
      draggableGroup.classList.remove('draggable-hover');
    }
  }

  // Keyboard Nudging for Selected Element (Arrow keys: 1px, Shift + Arrow: 10px)
  window.addEventListener('keydown', (e) => {
    const selectedKey = store.getSelectedElement();
    if (!selectedKey || !store.getDragMode()) return;

    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const elem = container.querySelector(`[data-draggable="${selectedKey}"]`);
      if (!elem) return;

      const step = e.shiftKey ? 10 : 1;
      const coords = getElementCoordinates(elem);
      let newX = coords.x;
      let newY = coords.y;

      if (e.key === 'ArrowLeft') newX -= step;
      if (e.key === 'ArrowRight') newX += step;
      if (e.key === 'ArrowUp') newY -= step;
      if (e.key === 'ArrowDown') newY += step;

      elem.setAttribute('transform', `translate(${newX}, ${newY})`);
      updateSelectionBox(elem);
      store.updateElementPosition(selectedKey, newX, newY, true);
      if (onSpecUpdated) onSpecUpdated();
    } else if (e.key === 'Escape') {
      store.setSelectedElement(null);
      if (selectionBox) selectionBox.classList.add('hidden');
    }
  });

  // Attach Event Listeners
  if (container) {
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('mouseover', handlePointerOver);
    container.addEventListener('mouseout', handlePointerOut);
  }

  if (toggleDragBtn) {
    toggleDragBtn.addEventListener('click', () => {
      const isDrag = store.toggleDragMode();
      updateToolbarState();
      showToast(isDrag ? '🖐️ ক্যানভাস ড্র্যাগ অ্যান্ড ড্রপ এডিট সক্রিয়' : '🔒 ড্র্যাগ মোড বন্ধ করা হয়েছে');
      if (!isDrag && selectionBox) selectionBox.classList.add('hidden');
    });
  }

  if (toggleSnapBtn) {
    toggleSnapBtn.addEventListener('click', () => {
      const isSnap = store.toggleSnapGrid();
      updateToolbarState();
      showToast(isSnap ? '🧲 গ্রিড স্ন্যাপিং (8px) সক্রিয়' : '🔓 ফ্রি মুভমেন্ট (স্ন্যাপ অফ)');
    });
  }

  if (resetPosBtn) {
    resetPosBtn.addEventListener('click', () => {
      store.resetPositions();
      if (onSpecUpdated) onSpecUpdated();
      if (selectionBox) selectionBox.classList.add('hidden');
      showToast('🔄 সব উপাদানের পজিশন ডিফল্ট গ্রিডে রিসেট করা হয়েছে!');
    });
  }

  // Subscribe to re-renders to re-sync selection box
  store.subscribe(() => {
    updateToolbarState();
    const selKey = store.getSelectedElement();
    if (selKey && container) {
      const elem = container.querySelector(`[data-draggable="${selKey}"]`);
      if (elem) updateSelectionBox(elem);
    }
  });

  updateToolbarState();

  return {
    updateSelectionBox,
    updateToolbarState
  };
}
