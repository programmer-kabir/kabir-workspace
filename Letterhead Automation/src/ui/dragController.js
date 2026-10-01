import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupDragController(onSpecUpdated) {
  const container = document.getElementById('svgContainer');
  const paper = document.getElementById('paperWrapper');
  const modePreviewBtn = document.getElementById('modePreviewBtn');
  const modeEditBtn = document.getElementById('modeEditBtn');
  const canvasToolbar = document.getElementById('canvasToolbar');
  const toggleSnapBtn = document.getElementById('toggleSnapGridBtn');
  const snapBtnLabel = document.getElementById('snapBtnLabel');
  const resetPosBtn = document.getElementById('resetPositionsBtn');
  const selectedElementBadge = document.getElementById('selectedElementBadge');
  const selectedElementText = document.getElementById('selectedElementText');

  let activeElement = null;
  let activeKey = null;
  let activeZone = null; // 'move' | 'rotate' | 'edge-n' | 'edge-s' | 'edge-e' | 'edge-w' | 'corner-nw' | 'corner-ne' | 'corner-sw' | 'corner-se'
  let isTransforming = false;

  let startPointerX = 0;
  let startPointerY = 0;
  let startAngle = 0;
  let centerX = 0;
  let centerY = 0;

  let initialElemPos = {
    x: 0,
    y: 0,
    width: 680,
    height: 100,
    rotate: 0,
    scaleX: 1,
    scaleY: 1,
    baseBBoxWidth: 680,
    baseBBoxHeight: 100
  };

  let currentX = 0;
  let currentY = 0;
  let currentWidth = 680;
  let currentHeight = 100;
  let currentRotate = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  let rafId = null;

  // Floating Coordinate & Info HUD Tooltip
  let hudTooltip = document.getElementById('canvasDragHud');
  if (!hudTooltip) {
    hudTooltip = document.createElement('div');
    hudTooltip.id = 'canvasDragHud';
    hudTooltip.className = 'fixed pointer-events-none z-50 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-cyan-400 text-cyan-200 text-xs font-mono shadow-2xl backdrop-blur-md transform -translate-x-1/2 -translate-y-full mb-3 hidden flex items-center gap-2 transition-opacity duration-75 select-none';
    document.body.appendChild(hudTooltip);
  }

  // Canva / Photoshop Dynamic Direct-Manipulation Selection & Transform Overlay
  let selectionBox = document.getElementById('canvasSelectionOverlay');
  if (!selectionBox) {
    selectionBox = document.createElement('div');
    selectionBox.id = 'canvasSelectionOverlay';
    selectionBox.className = 'absolute pointer-events-auto border-2 border-cyan-400 rounded-sm bg-cyan-400/5 hidden z-30 transition-none select-none shadow-lg shadow-cyan-500/10 cursor-move';
    selectionBox.innerHTML = `
      <!-- Rotation Stalk & Circular Handle (Canva / Photoshop Style) -->
      <div class="absolute -top-7 left-1/2 -translate-x-1/2 w-0.5 h-7 bg-cyan-400 pointer-events-none"></div>
      <div class="canva-transform-zone absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-cyan-500 shadow-xl flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform" data-zone="rotate" title="Drag to Rotate Freely (0–360°)">
        <svg class="w-3.5 h-3.5 text-cyan-600 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
      </div>

      <!-- Edge Hitbars for Independent Width / Height Stretching -->
      <div class="canva-transform-zone absolute -top-1.5 left-2 right-2 h-3 cursor-ns-resize hover:bg-cyan-400/20" data-zone="edge-n" title="Stretch Height Top"></div>
      <div class="canva-transform-zone absolute -bottom-1.5 left-2 right-2 h-3 cursor-ns-resize hover:bg-cyan-400/20" data-zone="edge-s" title="Stretch Height Bottom"></div>
      <div class="canva-transform-zone absolute top-2 bottom-2 -left-1.5 w-3 cursor-ew-resize hover:bg-cyan-400/20" data-zone="edge-w" title="Stretch Width Left"></div>
      <div class="canva-transform-zone absolute top-2 bottom-2 -right-1.5 w-3 cursor-ew-resize hover:bg-cyan-400/20" data-zone="edge-e" title="Stretch Width Right"></div>

      <!-- Corner Hit Points for Free Scale -->
      <div class="canva-transform-zone absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full border-2 border-cyan-500 shadow-md cursor-nwse-resize hover:scale-125 transition-transform" data-zone="corner-nw" title="Scale Corner"></div>
      <div class="canva-transform-zone absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full border-2 border-cyan-500 shadow-md cursor-nesw-resize hover:scale-125 transition-transform" data-zone="corner-ne" title="Scale Corner"></div>
      <div class="canva-transform-zone absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full border-2 border-cyan-500 shadow-md cursor-nesw-resize hover:scale-125 transition-transform" data-zone="corner-sw" title="Scale Corner"></div>
      <div class="canva-transform-zone absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full border-2 border-cyan-500 shadow-md cursor-nwse-resize hover:scale-125 transition-transform" data-zone="corner-se" title="Scale Corner"></div>

      <!-- Center Move Grip Anchor -->
      <div class="canva-transform-zone absolute inset-2 cursor-move" data-zone="move" title="Drag to Move Freely"></div>
    `;
    if (paper) paper.appendChild(selectionBox);
  }

  function getElementCoordinates(elem) {
    const transformAttr = elem?.getAttribute('transform') || '';
    const transMatch = /translate\(\s*([-\d.]+)\s*[, ]\s*([-\d.]+)\s*\)/.exec(transformAttr);
    const rotMatch = /rotate\(\s*([-\d.]+)/.exec(transformAttr);
    const scaleMatch = /scale\(\s*([-\d.]+)\s*(?:[, ]\s*([-\d.]+))?\s*\)/.exec(transformAttr);
    return {
      x: transMatch ? parseFloat(transMatch[1]) : 0,
      y: transMatch ? parseFloat(transMatch[2]) : 0,
      rotate: rotMatch ? parseFloat(rotMatch[1]) : 0,
      scaleX: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
      scaleY: scaleMatch ? (scaleMatch[2] ? parseFloat(scaleMatch[2]) : parseFloat(scaleMatch[1])) : 1
    };
  }

  function updateSelectionBoxFromState(x, y, w, h, rotate = 0) {
    if (!selectionBox || !paper || !store.getDragMode()) {
      if (selectionBox) selectionBox.classList.add('hidden');
      return;
    }

    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${w}px`;
    selectionBox.style.height = `${h}px`;
    selectionBox.style.transformOrigin = '50% 50%';
    selectionBox.style.transform = `rotate(${rotate}deg)`;
    selectionBox.classList.remove('hidden');
  }

  function updateSelectionBox(elem) {
    if (!elem || !paper || !store.getDragMode() || store.isElementDeleted(store.getSelectedElement())) {
      if (selectionBox) selectionBox.classList.add('hidden');
      return;
    }

    try {
      const selectedKey = elem.getAttribute('data-draggable');
      const spec = store.getSpec();
      const pos = spec.positions?.[selectedKey] || {};
      const coords = getElementCoordinates(elem);
      const bbox = elem.getBBox();

      const w = pos.width || Math.max(30, Math.round(bbox.width * (coords.scaleX || 1)));
      const h = pos.height || Math.max(20, Math.round(bbox.height * (coords.scaleY || 1)));
      const x = coords.x;
      const y = coords.y;
      const rot = coords.rotate || 0;

      updateSelectionBoxFromState(x, y, w, h, rot);
    } catch (err) {
      if (selectionBox) selectionBox.classList.add('hidden');
    }
  }

  function updateToolbarState() {
    const isDrag = store.getDragMode();
    const appMode = store.getAppMode();
    const isSnap = store.getSnapGrid();
    const selectedKey = store.getSelectedElement();

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

    if (canvasToolbar) {
      const isEdit = appMode === 'edit';
      canvasToolbar.classList.toggle('hidden', !isEdit);
      canvasToolbar.classList.toggle('flex', isEdit);
    }

    if (toggleSnapBtn && snapBtnLabel) {
      snapBtnLabel.textContent = isSnap ? '🧲 Snap Grid: ON' : '🔓 Freehand: ON';
      toggleSnapBtn.classList.toggle('bg-cyan-500/20', isSnap);
      toggleSnapBtn.classList.toggle('border-cyan-400/80', isSnap);
      toggleSnapBtn.classList.toggle('text-cyan-300', isSnap);
      toggleSnapBtn.classList.toggle('text-slate-400', !isSnap);
    }

    if (selectedElementBadge && selectedElementText) {
      if (selectedKey && isDrag && !store.isElementDeleted(selectedKey)) {
        const elem = container?.querySelector(`[data-draggable="${selectedKey}"]`);
        const label = elem?.getAttribute('data-label') || selectedKey;
        selectedElementText.textContent = label;
        selectedElementBadge.classList.remove('hidden');
        selectedElementBadge.classList.add('flex');
      } else {
        selectedElementBadge.classList.add('hidden');
        selectedElementBadge.classList.remove('flex');
      }
    }

    if (container) {
      container.classList.toggle('interactive-drag-enabled', isDrag);
    }

    if (!isDrag && selectionBox) {
      selectionBox.classList.add('hidden');
    }
  }

  // Pointer Down on Transform Overlay or SVG Element
  function handleTransformPointerDown(e) {
    if (e.button !== 0) return; // Left mouse button only

    const zoneElem = e.target.closest('.canva-transform-zone');
    const draggableGroup = e.target.closest('[data-draggable]');

    if (!zoneElem && !draggableGroup) {
      store.setSelectedElement(null);
      if (selectionBox) selectionBox.classList.add('hidden');
      return;
    }

    if (!store.getDragMode()) {
      store.setAppMode('edit');
    }

    e.preventDefault();
    e.stopPropagation();

    if (draggableGroup && !zoneElem) {
      activeKey = draggableGroup.getAttribute('data-draggable');
      activeElement = draggableGroup;
      activeZone = 'move';
    } else if (zoneElem) {
      activeZone = zoneElem.getAttribute('data-zone') || 'move';
      activeKey = store.getSelectedElement();
      activeElement = container?.querySelector(`[data-draggable="${activeKey}"]`);
    }

    if (!activeElement || !activeKey) return;
    store.setSelectedElement(activeKey);
    window.dispatchEvent(new CustomEvent('app:switchToEditTab'));

    const spec = store.getSpec();
    const pos = spec.positions?.[activeKey] || {};
    const coords = getElementCoordinates(activeElement);
    const bbox = activeElement.getBBox();

    const baseW = Math.max(20, Math.round(bbox.width));
    const baseH = Math.max(20, Math.round(bbox.height));
    const w = pos.width || Math.max(30, Math.round(baseW * (coords.scaleX || 1)));
    const h = pos.height || Math.max(20, Math.round(baseH * (coords.scaleY || 1)));

    initialElemPos = {
      x: coords.x,
      y: coords.y,
      width: w,
      height: h,
      rotate: coords.rotate || 0,
      scaleX: coords.scaleX || 1,
      scaleY: coords.scaleY || 1,
      baseBBoxWidth: baseW,
      baseBBoxHeight: baseH
    };

    currentX = initialElemPos.x;
    currentY = initialElemPos.y;
    currentWidth = initialElemPos.width;
    currentHeight = initialElemPos.height;
    currentRotate = initialElemPos.rotate;
    currentScaleX = initialElemPos.scaleX;
    currentScaleY = initialElemPos.scaleY;

    startPointerX = e.clientX;
    startPointerY = e.clientY;

    // Center coordinates for rotation
    const rect = selectionBox.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    isTransforming = true;
    activeElement.classList.add('is-dragging');

    // Show Live HUD
    const label = activeElement.getAttribute('data-label') || activeKey;
    hudTooltip.innerHTML = `<span class="font-semibold text-white">${label}</span> <span class="text-cyan-400 font-mono">W:${Math.round(currentWidth)} | H:${Math.round(currentHeight)} | ∡${Math.round(currentRotate)}°</span>`;
    hudTooltip.style.left = `${e.clientX}px`;
    hudTooltip.style.top = `${e.clientY - 14}px`;
    hudTooltip.classList.remove('hidden');

    window.addEventListener('pointermove', handleTransformPointerMove);
    window.addEventListener('pointerup', handleTransformPointerUp);
  }

  // Real-time 60FPS Pointer Move with Local Axis Projection
  function handleTransformPointerMove(e) {
    if (!isTransforming || !activeElement) return;
    e.preventDefault();

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const zoom = store.getZoom() || 1.0;

      if (activeZone === 'rotate') {
        // Continuous Trigonometric Rotation around Center (0–360°+)
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        let angleDiff = currentAngle - startAngle;
        let newRot = initialElemPos.rotate + angleDiff;

        // Shift key: Snap to 15°
        if (e.shiftKey) {
          newRot = Math.round(newRot / 15) * 15;
        }

        currentRotate = Math.round((((newRot % 360) + 360) % 360) * 10) / 10;
        activeElement.setAttribute('transform', `translate(${currentX}, ${currentY}) rotate(${currentRotate}) scale(${currentScaleX}, ${currentScaleY})`);
        updateSelectionBoxFromState(currentX, currentY, currentWidth, currentHeight, currentRotate);
      } else if (activeZone === 'move') {
        // Freeform Move across & beyond Canvas
        let dx = (e.clientX - startPointerX) / zoom;
        let dy = (e.clientY - startPointerY) / zoom;

        // Shift key: Axis Constraint
        if (e.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }

        let targetX = initialElemPos.x + dx;
        let targetY = initialElemPos.y + dy;

        if (store.getSnapGrid()) {
          targetX = Math.round(targetX / 8) * 8;
          targetY = Math.round(targetY / 8) * 8;
        }

        currentX = Math.round(targetX * 10) / 10;
        currentY = Math.round(targetY * 10) / 10;

        activeElement.setAttribute('transform', `translate(${currentX}, ${currentY}) rotate(${currentRotate}) scale(${currentScaleX}, ${currentScaleY})`);
        updateSelectionBoxFromState(currentX, currentY, currentWidth, currentHeight, currentRotate);
      } else {
        // Freeform Edge Stretch & Corner Scale in Element's Local Rotated Coordinate Space
        const globalDx = (e.clientX - startPointerX) / zoom;
        const globalDy = (e.clientY - startPointerY) / zoom;
        const rad = -(initialElemPos.rotate || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Project mouse delta into local unrotated element coordinate space
        const localDx = globalDx * cos - globalDy * sin;
        const localDy = globalDx * sin + globalDy * cos;

        let newW = initialElemPos.width;
        let newH = initialElemPos.height;
        let newX = initialElemPos.x;
        let newY = initialElemPos.y;

        if (activeZone === 'edge-e') {
          newW = Math.max(15, initialElemPos.width + localDx);
        } else if (activeZone === 'edge-w') {
          newW = Math.max(15, initialElemPos.width - localDx);
          const shiftDist = initialElemPos.width - newW;
          const forwardRad = (initialElemPos.rotate || 0) * (Math.PI / 180);
          newX = initialElemPos.x + shiftDist * Math.cos(forwardRad);
          newY = initialElemPos.y + shiftDist * Math.sin(forwardRad);
        } else if (activeZone === 'edge-s') {
          newH = Math.max(15, initialElemPos.height + localDy);
        } else if (activeZone === 'edge-n') {
          newH = Math.max(15, initialElemPos.height - localDy);
          const shiftDist = initialElemPos.height - newH;
          const forwardRad = ((initialElemPos.rotate || 0) + 90) * (Math.PI / 180);
          newX = initialElemPos.x + shiftDist * Math.cos(forwardRad);
          newY = initialElemPos.y + shiftDist * Math.sin(forwardRad);
        } else if (activeZone === 'corner-se') {
          newW = Math.max(15, initialElemPos.width + localDx);
          newH = Math.max(15, initialElemPos.height + localDy);
        } else if (activeZone === 'corner-ne') {
          newW = Math.max(15, initialElemPos.width + localDx);
          newH = Math.max(15, initialElemPos.height - localDy);
          const shiftDist = initialElemPos.height - newH;
          const forwardRad = ((initialElemPos.rotate || 0) + 90) * (Math.PI / 180);
          newX = initialElemPos.x + shiftDist * Math.cos(forwardRad);
          newY = initialElemPos.y + shiftDist * Math.sin(forwardRad);
        } else if (activeZone === 'corner-sw') {
          newW = Math.max(15, initialElemPos.width - localDx);
          newH = Math.max(15, initialElemPos.height + localDy);
          const shiftDist = initialElemPos.width - newW;
          const forwardRad = (initialElemPos.rotate || 0) * (Math.PI / 180);
          newX = initialElemPos.x + shiftDist * Math.cos(forwardRad);
          newY = initialElemPos.y + shiftDist * Math.sin(forwardRad);
        } else if (activeZone === 'corner-nw') {
          newW = Math.max(15, initialElemPos.width - localDx);
          newH = Math.max(15, initialElemPos.height - localDy);
          const shiftDistX = initialElemPos.width - newW;
          const shiftDistY = initialElemPos.height - newH;
          const radX = (initialElemPos.rotate || 0) * (Math.PI / 180);
          const radY = ((initialElemPos.rotate || 0) + 90) * (Math.PI / 180);
          newX = initialElemPos.x + shiftDistX * Math.cos(radX) + shiftDistY * Math.cos(radY);
          newY = initialElemPos.y + shiftDistX * Math.sin(radX) + shiftDistY * Math.sin(radY);
        }

        currentX = Math.round(newX * 10) / 10;
        currentY = Math.round(newY * 10) / 10;
        currentWidth = Math.round(newW * 10) / 10;
        currentHeight = Math.round(newH * 10) / 10;

        const baseBBoxW = initialElemPos.baseBBoxWidth || 100;
        const baseBBoxH = initialElemPos.baseBBoxHeight || 50;
        currentScaleX = Math.round((currentWidth / baseBBoxW) * 1000) / 1000;
        currentScaleY = Math.round((currentHeight / baseBBoxH) * 1000) / 1000;

        activeElement.setAttribute('transform', `translate(${currentX}, ${currentY}) rotate(${currentRotate}) scale(${currentScaleX}, ${currentScaleY})`);
        updateSelectionBoxFromState(currentX, currentY, currentWidth, currentHeight, currentRotate);
      }

      // Update Live HUD
      const label = activeElement.getAttribute('data-label') || activeKey;
      hudTooltip.innerHTML = `<span class="font-semibold text-white">${label}</span> <span class="text-cyan-400 font-mono">W:${Math.round(currentWidth)} | H:${Math.round(currentHeight)} | ∡${currentRotate}° | (${Math.round(currentX)}, ${Math.round(currentY)})</span>`;
      hudTooltip.style.left = `${e.clientX}px`;
      hudTooltip.style.top = `${e.clientY - 14}px`;
    });
  }

  // Pointer Up Handler
  function handleTransformPointerUp(e) {
    if (!isTransforming) return;

    window.removeEventListener('pointermove', handleTransformPointerMove);
    window.removeEventListener('pointerup', handleTransformPointerUp);
    if (rafId) cancelAnimationFrame(rafId);

    if (activeElement && activeKey) {
      activeElement.classList.remove('is-dragging');
      const label = activeElement.getAttribute('data-label') || activeKey;

      const hasChanged = Math.abs(currentX - initialElemPos.x) > 0.5 ||
                         Math.abs(currentY - initialElemPos.y) > 0.5 ||
                         Math.abs(currentWidth - initialElemPos.width) > 0.5 ||
                         Math.abs(currentHeight - initialElemPos.height) > 0.5 ||
                         Math.abs(currentRotate - initialElemPos.rotate) > 0.5;

      if (hasChanged) {
        // Record undo/redo history snapshot for the complete transform
        store.setElementTransform(activeKey, {
          x: currentX,
          y: currentY,
          width: currentWidth,
          height: currentHeight,
          rotate: currentRotate,
          scaleX: currentScaleX,
          scaleY: currentScaleY
        }, true, true);

        if (onSpecUpdated) onSpecUpdated();
        showToast(`✨ "${label}" transformed: (${Math.round(currentX)}, ${Math.round(currentY)}) | ∡${currentRotate}°`);
      } else if (activeZone === 'move') {
        window.dispatchEvent(new CustomEvent('canvas:elementClicked', { detail: { key: activeKey } }));
      }
    }

    isTransforming = false;
    activeZone = null;
    hudTooltip.classList.add('hidden');
  }

  // Hover Tooltip / Mouseover Preview
  function handlePointerOver(e) {
    if (!store.getDragMode() || isTransforming) return;
    const draggableGroup = e.target.closest('[data-draggable]');
    if (draggableGroup) {
      draggableGroup.classList.add('draggable-hover');
    }
  }

  function handlePointerOut(e) {
    if (isTransforming) return;
    const draggableGroup = e.target.closest('[data-draggable]');
    if (draggableGroup) {
      draggableGroup.classList.remove('draggable-hover');
    }
  }

  // Keyboard Shortcuts (Delete/Backspace, Undo/Redo, Arrow Nudging)
  window.addEventListener('keydown', (e) => {
    const selectedKey = store.getSelectedElement();
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

    // Global Undo / Redo Shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Cmd+Z)
    if (!isTyping && (e.ctrlKey || e.metaKey)) {
      if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        const success = store.undo();
        if (success) {
          if (onSpecUpdated) onSpecUpdated();
          showToast('↩️ Undo');
        }
        return;
      } else if ((e.key === 'z' || e.key === 'Z' && e.shiftKey) || e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        const success = store.redo();
        if (success) {
          if (onSpecUpdated) onSpecUpdated();
          showToast('↪️ Redo');
        }
        return;
      }
    }

    if (!selectedKey || !store.getDragMode() || isTyping) return;

    // Delete / Backspace -> Remove Selected Layer
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const elem = container?.querySelector(`[data-draggable="${selectedKey}"]`);
      const label = elem?.getAttribute('data-label') || selectedKey;
      store.deleteElement(selectedKey, true, true);
      if (selectionBox) selectionBox.classList.add('hidden');
      if (onSpecUpdated) onSpecUpdated();
      showToast(`🗑️ "${label}" removed (Press Ctrl+Z to Undo)`);
      return;
    }

    // Enter key: In-Place Text Edit Tool
    if (e.key === 'Enter') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('canvas:activateTypeTool', { detail: { key: selectedKey } }));
      return;
    }

    // Arrow keys: Fine positioning
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      store.nudgeElementPosition(selectedKey, dx, dy, true, true);
      if (onSpecUpdated) onSpecUpdated();
    } else if (e.key === 'Escape') {
      store.setSelectedElement(null);
      if (selectionBox) selectionBox.classList.add('hidden');
    }
  });

  // Attach Event Listeners
  if (container) {
    container.addEventListener('pointerdown', handleTransformPointerDown);
    container.addEventListener('mouseover', handlePointerOver);
    container.addEventListener('mouseout', handlePointerOut);
  }

  if (selectionBox) {
    selectionBox.addEventListener('pointerdown', handleTransformPointerDown);
  }

  if (modePreviewBtn) {
    modePreviewBtn.addEventListener('click', () => {
      store.setAppMode('preview');
      showToast('👁️ Preview Mode: Clean document view');
    });
  }

  if (modeEditBtn) {
    modeEditBtn.addEventListener('click', () => {
      store.setAppMode('edit');
      window.dispatchEvent(new CustomEvent('app:switchToEditTab'));
      showToast('✏️ Edit Mode: Edit Center opened');
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
      store.resetPositions(true);
      if (onSpecUpdated) onSpecUpdated();
      if (selectionBox) selectionBox.classList.add('hidden');
      showToast('🔄 সব উপাদানের পজিশন ডিফল্ট গ্রিডে রিসেট করা হয়েছে!');
    });
  }

  // Subscribe to store changes to keep selection box aligned
  store.subscribe(() => {
    updateToolbarState();
    const selKey = store.getSelectedElement();
    if (selKey && container && !store.isElementDeleted(selKey)) {
      const elem = container.querySelector(`[data-draggable="${selKey}"]`);
      if (elem) updateSelectionBox(elem);
    } else if (selectionBox) {
      selectionBox.classList.add('hidden');
    }
  });

  updateToolbarState();

  return {
    updateSelectionBox,
    updateToolbarState
  };
}
