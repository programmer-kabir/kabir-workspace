import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupCanvaController(onSpecUpdated) {
  const container = document.getElementById('svgContainer');
  const paper = document.getElementById('paperWrapper');

  const elementScaleMap = {
    branding: 'brand_name',
    brand_name: 'brand_name',
    tagline: 'tagline',
    recipient: 'recipient_name',
    recipient_name: 'recipient_name',
    date: 'meta',
    subject: 'subject',
    body: 'body',
    signature: 'signature_name',
    contact: 'footer'
  };

  const elementLabelMap = {
    header_art: 'Header Graphic (Vector)',
    footer_art: 'Footer Graphic (Vector)',
    sidebar_art: 'Sidebar Graphic (Vector)',
    frame_art: 'Border Frame Element',
    badge: 'Security / Tech Badge',
    branding: 'Company Name & Logo',
    brand_name: 'Company Name',
    tagline: 'Brand Tagline',
    recipient: 'Recipient Block',
    recipient_name: 'Recipient Name',
    date: 'Document Date',
    subject: 'Subject Line',
    body: 'Body Text Paragraphs',
    signature: 'Signoff & Sender',
    contact: 'Contact Info Stack'
  };

  const elementIconMap = {
    header_art: '🌊',
    footer_art: '🌊',
    sidebar_art: '📑',
    frame_art: '📜',
    badge: '🛡️',
    branding: '🏢',
    brand_name: '🏢',
    tagline: '✨',
    recipient: '👤',
    recipient_name: '👤',
    date: '📅',
    subject: '📌',
    body: '📄',
    signature: '✍️',
    contact: '📞'
  };

  // Active Type Tool Overlay Container (Lives directly inside #paperWrapper)
  let typeToolLayer = document.getElementById('adobeTypeToolLayer');
  if (!typeToolLayer && paper) {
    typeToolLayer = document.createElement('div');
    typeToolLayer.id = 'adobeTypeToolLayer';
    typeToolLayer.className = 'absolute inset-0 pointer-events-none z-40';
    paper.appendChild(typeToolLayer);
  }

  // Sidebar Tab Elements
  const editLayerIcon = document.getElementById('editLayerIcon');
  const editLayerTitle = document.getElementById('editLayerTitle');
  const editLayerType = document.getElementById('editLayerType');
  const editEmptyPrompt = document.getElementById('editEmptyPrompt');
  const editControlsBody = document.getElementById('editControlsBody');
  const editDeselectBtn = document.getElementById('editDeselectBtn');

  const statPos = document.getElementById('statPos');
  const statSize = document.getElementById('statSize');
  const statRotate = document.getElementById('statRotate');

  const editPosXInput = document.getElementById('editPosXInput');
  const editPosYInput = document.getElementById('editPosYInput');
  const editNudgeLeftBtn = document.getElementById('editNudgeLeftBtn');
  const editNudgeRightBtn = document.getElementById('editNudgeRightBtn');
  const editNudgeUpBtn = document.getElementById('editNudgeUpBtn');
  const editNudgeDownBtn = document.getElementById('editNudgeDownBtn');

  const editRotateSlider = document.getElementById('editRotateSlider');
  const editRotateAngleLabel = document.getElementById('editRotateAngleLabel');
  const editRotateMinus15Btn = document.getElementById('editRotateMinus15Btn');
  const editRotatePlus15Btn = document.getElementById('editRotatePlus15Btn');
  const editRotate90Btn = document.getElementById('editRotate90Btn');
  const editRotateResetBtn = document.getElementById('editRotateResetBtn');

  const editFullWidthBtn = document.getElementById('editFullWidthBtn');
  const editWidthInput = document.getElementById('editWidthInput');
  const editWidthMinusBtn = document.getElementById('editWidthMinusBtn');
  const editWidthPlusBtn = document.getElementById('editWidthPlusBtn');
  const editHeightInput = document.getElementById('editHeightInput');
  const editHeightMinusBtn = document.getElementById('editHeightMinusBtn');
  const editHeightPlusBtn = document.getElementById('editHeightPlusBtn');

  const editTypographyGroup = document.getElementById('editTypographyGroup');
  const editFontSizeDisplay = document.getElementById('editFontSizeDisplay');
  const editFontSizeInput = document.getElementById('editFontSizeInput');
  const editFontMinusBtn = document.getElementById('editFontMinusBtn');
  const editFontPlusBtn = document.getElementById('editFontPlusBtn');
  const editBoldBtn = document.getElementById('editBoldBtn');

  const editColorSwatches = document.querySelectorAll('.edit-color-swatch');
  const editCustomColorInput = document.getElementById('editCustomColorInput');
  const editDeleteElementBtn = document.getElementById('editDeleteElementBtn');
  const editResetElementBtn = document.getElementById('editResetElementBtn');

  function getCurrentElementScaleKey(elemKey) {
    return elementScaleMap[elemKey] || 'body';
  }

  function getCurrentFontSize(elemKey) {
    const spec = store.getSpec();
    const scaleKey = getCurrentElementScaleKey(elemKey);
    return spec.typography?.scale?.[scaleKey]?.size || 12;
  }

  function getCurrentFontWeight(elemKey) {
    const spec = store.getSpec();
    const scaleKey = getCurrentElementScaleKey(elemKey);
    return spec.typography?.scale?.[scaleKey]?.weight || 400;
  }

  function getCurrentElementWidth(elemKey) {
    const spec = store.getSpec();
    const pos = spec.positions?.[elemKey];
    if (pos && typeof pos.width === 'number') return pos.width;
    const elem = container?.querySelector(`[data-draggable="${elemKey}"]`);
    if (elem) {
      try {
        const bbox = elem.getBBox();
        return Math.round(bbox.width);
      } catch (e) {
        return 680;
      }
    }
    return 680;
  }

  function getCurrentElementHeight(elemKey) {
    const spec = store.getSpec();
    const pos = spec.positions?.[elemKey];
    if (pos && typeof pos.height === 'number') return pos.height;
    const elem = container?.querySelector(`[data-draggable="${elemKey}"]`);
    if (elem) {
      try {
        const bbox = elem.getBBox();
        return Math.round(bbox.height);
      } catch (e) {
        return 100;
      }
    }
    return 100;
  }

  function getCurrentElementRotation(elemKey) {
    const spec = store.getSpec();
    const pos = spec.positions?.[elemKey];
    if (pos && typeof pos.rotate === 'number') return pos.rotate;
    const elem = container?.querySelector(`[data-draggable="${elemKey}"]`);
    if (elem) {
      const coords = getElementCoordinates(elem);
      return coords.rotate || 0;
    }
    return 0;
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

  // Update Sidebar Tab Inspector
  function updateSidebarInspector() {
    const selectedKey = store.getSelectedElement();
    const isDeleted = selectedKey ? store.isElementDeleted(selectedKey) : false;

    // Update Layer Navigator Chips Active State
    const layerChips = document.querySelectorAll('.layer-nav-chip');
    layerChips.forEach(chip => {
      const chipLayer = chip.getAttribute('data-select-layer');
      const isActive = chipLayer === selectedKey;
      chip.classList.toggle('bg-cyan-500/20', isActive);
      chip.classList.toggle('border-cyan-400', isActive);
      chip.classList.toggle('text-cyan-300', isActive);
      chip.classList.toggle('bg-slate-950', !isActive);
      chip.classList.toggle('border-slate-800', !isActive);
      chip.classList.toggle('text-slate-300', !isActive);
    });

    const editCenterSnapLabel = document.getElementById('editCenterSnapLabel');
    const editCenterSnapBtn = document.getElementById('editCenterSnapBtn');
    if (editCenterSnapLabel && editCenterSnapBtn) {
      const isSnap = store.getSnapGrid();
      editCenterSnapLabel.textContent = isSnap ? 'Snap: 8px Grid' : 'Snap: Freehand';
      editCenterSnapBtn.classList.toggle('bg-cyan-950', isSnap);
      editCenterSnapBtn.classList.toggle('border-cyan-400', isSnap);
      editCenterSnapBtn.classList.toggle('text-cyan-300', isSnap);
      editCenterSnapBtn.classList.toggle('bg-slate-950', !isSnap);
      editCenterSnapBtn.classList.toggle('border-slate-700', !isSnap);
      editCenterSnapBtn.classList.toggle('text-slate-300', !isSnap);
    }

    if (!selectedKey || isDeleted) {
      if (editLayerIcon) editLayerIcon.textContent = '🗂️';
      if (editLayerTitle) editLayerTitle.textContent = 'No Element Selected';
      if (editLayerType) editLayerType.textContent = 'Select an element on canvas';
      if (editEmptyPrompt) editEmptyPrompt.classList.remove('hidden');
      if (editControlsBody) editControlsBody.classList.add('opacity-40', 'pointer-events-none');
      if (statPos) statPos.textContent = '—, —';
      if (statSize) statSize.textContent = '— × —';
      if (statRotate) statRotate.textContent = '0.0°';
      return;
    }

    if (editEmptyPrompt) editEmptyPrompt.classList.add('hidden');
    if (editControlsBody) editControlsBody.classList.remove('opacity-40', 'pointer-events-none');

    const elem = container?.querySelector(`[data-draggable="${selectedKey}"]`);
    const label = elem?.getAttribute('data-label') || elementLabelMap[selectedKey] || selectedKey;
    const icon = elementIconMap[selectedKey] || '🎨';
    const isGraphic = ['header_art', 'footer_art', 'sidebar_art', 'frame_art', 'badge'].includes(selectedKey);

    if (editLayerIcon) editLayerIcon.textContent = icon;
    if (editLayerTitle) editLayerTitle.textContent = label;
    if (editLayerType) editLayerType.textContent = isGraphic ? 'Vector Graphic Layer' : 'Editable Typography Layer';

    const coords = elem ? getElementCoordinates(elem) : { x: 0, y: 0, rotate: 0 };
    const curW = getCurrentElementWidth(selectedKey);
    const curH = getCurrentElementHeight(selectedKey);
    const curRot = Math.round(getCurrentElementRotation(selectedKey) * 10) / 10;

    // Direct Inputs & Labels
    if (editPosXInput && document.activeElement !== editPosXInput) editPosXInput.value = Math.round(coords.x);
    if (editPosYInput && document.activeElement !== editPosYInput) editPosYInput.value = Math.round(coords.y);
    if (editWidthInput && document.activeElement !== editWidthInput) editWidthInput.value = Math.round(curW);
    if (editHeightInput && document.activeElement !== editHeightInput) editHeightInput.value = Math.round(curH);

    if (editRotateSlider && document.activeElement !== editRotateSlider) editRotateSlider.value = curRot;
    if (editRotateAngleLabel) editRotateAngleLabel.textContent = `${curRot}°`;

    // Stats
    if (statPos) statPos.textContent = `${Math.round(coords.x)}, ${Math.round(coords.y)}`;
    if (statSize) statSize.textContent = `${Math.round(curW)} × ${Math.round(curH)}`;
    if (statRotate) statRotate.textContent = `${curRot}°`;

    // Typography Controls Visibility
    if (editTypographyGroup) {
      editTypographyGroup.style.display = isGraphic ? 'none' : 'block';
    }

    if (!isGraphic) {
      const curSize = getCurrentFontSize(selectedKey);
      if (editFontSizeDisplay) editFontSizeDisplay.textContent = `${Math.round(curSize * 10) / 10}pt`;
      if (editFontSizeInput && document.activeElement !== editFontSizeInput) editFontSizeInput.value = Math.round(curSize);

      const curWeight = getCurrentFontWeight(selectedKey);
      if (editBoldBtn) {
        const isBold = curWeight >= 700;
        editBoldBtn.classList.toggle('bg-cyan-500', isBold);
        editBoldBtn.classList.toggle('text-slate-950', isBold);
        editBoldBtn.classList.toggle('border-cyan-400', isBold);
        editBoldBtn.classList.toggle('bg-slate-800', !isBold);
        editBoldBtn.classList.toggle('text-slate-200', !isBold);
      }
    }
  }

  // Layer Navigator Chip Click
  const layerNavChips = document.querySelectorAll('.layer-nav-chip');
  layerNavChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const layerKey = chip.getAttribute('data-select-layer');
      if (!layerKey) return;
      if (!store.getDragMode()) {
        store.setAppMode('edit');
      }
      store.setSelectedElement(layerKey);
      updateSidebarInspector();
      const elem = container?.querySelector(`[data-draggable="${layerKey}"]`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const label = elementLabelMap[layerKey] || layerKey;
      showToast(`🎯 সিলেক্ট করা হয়েছে: ${label}`);
    });
  });

  // Edit Center Snap Button
  const editCenterSnapBtn = document.getElementById('editCenterSnapBtn');
  if (editCenterSnapBtn) {
    editCenterSnapBtn.addEventListener('click', () => {
      const isSnap = store.toggleSnapGrid();
      updateSidebarInspector();
      showToast(isSnap ? '🧲 গ্রিড স্ন্যাপিং সক্রিয় (8px)' : '🔓 ফ্রি মুভমেন্ট (স্ন্যাপ অফ)');
    });
  }

  // Edit Center Reset All Layout Button
  const editCenterResetAllBtn = document.getElementById('editCenterResetAllBtn');
  if (editCenterResetAllBtn) {
    editCenterResetAllBtn.addEventListener('click', () => {
      store.resetPositions();
      if (onSpecUpdated) onSpecUpdated();
      updateSidebarInspector();
      showToast('🔄 সম্পূর্ণ লেআউটের পজিশন ও সাইজ রিসেট করা হয়েছে');
    });
  }

  // Deselect Button
  if (editDeselectBtn) {
    editDeselectBtn.addEventListener('click', () => {
      deactivateTypeTool();
      store.setSelectedElement(null);
      updateSidebarInspector();
    });
  }

  // Nudge Position Handlers (Up, Down, Left, Right)
  if (editNudgeLeftBtn) {
    editNudgeLeftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      store.nudgeElementPosition(selectedKey, -5, 0, true, true);
      if (onSpecUpdated) onSpecUpdated();
      updateSidebarInspector();
    });
  }

  if (editNudgeRightBtn) {
    editNudgeRightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      store.nudgeElementPosition(selectedKey, 5, 0, true, true);
      if (onSpecUpdated) onSpecUpdated();
      updateSidebarInspector();
    });
  }

  if (editNudgeUpBtn) {
    editNudgeUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      store.nudgeElementPosition(selectedKey, 0, -5, true, true);
      if (onSpecUpdated) onSpecUpdated();
      updateSidebarInspector();
    });
  }

  if (editNudgeDownBtn) {
    editNudgeDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      store.nudgeElementPosition(selectedKey, 0, 5, true, true);
      if (onSpecUpdated) onSpecUpdated();
      updateSidebarInspector();
    });
  }

  // Direct Position Inputs
  if (editPosXInput) {
    editPosXInput.addEventListener('change', () => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const x = parseFloat(editPosXInput.value) || 0;
      store.updateElementPosition(selectedKey, x, null, true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editPosYInput) {
    editPosYInput.addEventListener('change', () => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const y = parseFloat(editPosYInput.value) || 0;
      store.updateElementPosition(selectedKey, null, y, true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  // Rotation Controls
  if (editRotateSlider) {
    editRotateSlider.addEventListener('input', (e) => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const deg = parseFloat(e.target.value) || 0;
      store.updateElementRotation(selectedKey, deg, false, false);
      if (editRotateAngleLabel) editRotateAngleLabel.textContent = `${deg}°`;
      if (statRotate) statRotate.textContent = `${deg}°`;
    });

    editRotateSlider.addEventListener('change', (e) => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const deg = parseFloat(e.target.value) || 0;
      store.updateElementRotation(selectedKey, deg, true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editRotateMinus15Btn) {
    editRotateMinus15Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const cur = getCurrentElementRotation(selectedKey);
      const n = (cur - 15 + 360) % 360;
      store.updateElementRotation(selectedKey, n, true, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`↺ Rotation: ${n}°`);
    });
  }

  if (editRotatePlus15Btn) {
    editRotatePlus15Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const cur = getCurrentElementRotation(selectedKey);
      const n = (cur + 15) % 360;
      store.updateElementRotation(selectedKey, n, true, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`↻ Rotation: ${n}°`);
    });
  }

  if (editRotate90Btn) {
    editRotate90Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const cur = getCurrentElementRotation(selectedKey);
      const n = (cur + 90) % 360;
      store.updateElementRotation(selectedKey, n, true, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`🔄 Rotation: ${n}°`);
    });
  }

  if (editRotateResetBtn) {
    editRotateResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      store.updateElementRotation(selectedKey, 0, true, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`0° Rotation Reset`);
    });
  }

  // Dimensions & Stretch Handlers
  if (editFullWidthBtn) {
    editFullWidthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const spec = store.getSpec();
      const currentPos = spec.positions?.[selectedKey] || {};
      const startX = currentPos.x ?? 68;
      const fullW = Math.max(250, 818 - startX);
      store.updateElementWidth(selectedKey, fullW, true, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`↔ Full Width: ${fullW}pt`);
    });
  }

  if (editWidthMinusBtn) {
    editWidthMinusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const curW = getCurrentElementWidth(selectedKey);
      store.updateElementWidth(selectedKey, Math.max(80, curW - 30), true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editWidthPlusBtn) {
    editWidthPlusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const curW = getCurrentElementWidth(selectedKey);
      store.updateElementWidth(selectedKey, Math.min(818, curW + 30), true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editWidthInput) {
    editWidthInput.addEventListener('change', () => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const w = parseFloat(editWidthInput.value) || 680;
      store.updateElementWidth(selectedKey, Math.max(50, w), true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editHeightMinusBtn) {
    editHeightMinusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const curH = getCurrentElementHeight(selectedKey);
      const spec = store.getSpec();
      const curPos = spec.positions?.[selectedKey] || {};
      store.setElementTransform(selectedKey, {
        ...curPos,
        height: Math.max(20, curH - 20)
      }, true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editHeightPlusBtn) {
    editHeightPlusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const curH = getCurrentElementHeight(selectedKey);
      const spec = store.getSpec();
      const curPos = spec.positions?.[selectedKey] || {};
      store.setElementTransform(selectedKey, {
        ...curPos,
        height: Math.min(1000, curH + 20)
      }, true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editHeightInput) {
    editHeightInput.addEventListener('change', () => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const h = parseFloat(editHeightInput.value) || 100;
      const spec = store.getSpec();
      const curPos = spec.positions?.[selectedKey] || {};
      store.setElementTransform(selectedKey, {
        ...curPos,
        height: Math.max(20, h)
      }, true, true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  // Typography Size & Weight
  if (editFontMinusBtn) {
    editFontMinusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const scaleKey = getCurrentElementScaleKey(selectedKey);
      const cur = getCurrentFontSize(selectedKey);
      const n = Math.max(6, Math.round((cur - 1.5) * 10) / 10);
      store.updateTypographyScale(scaleKey, 'size', n, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`🔤 Font Size: ${n}pt`);
    });
  }

  if (editFontPlusBtn) {
    editFontPlusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const scaleKey = getCurrentElementScaleKey(selectedKey);
      const cur = getCurrentFontSize(selectedKey);
      const n = Math.min(72, Math.round((cur + 1.5) * 10) / 10);
      store.updateTypographyScale(scaleKey, 'size', n, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(`🔤 Font Size: ${n}pt`);
    });
  }

  if (editFontSizeInput) {
    editFontSizeInput.addEventListener('change', () => {
      const selectedKey = store.getSelectedElement() || 'body';
      const scaleKey = getCurrentElementScaleKey(selectedKey);
      const n = parseFloat(editFontSizeInput.value) || 14;
      store.updateTypographyScale(scaleKey, 'size', Math.max(6, Math.min(72, n)), true);
      if (onSpecUpdated) onSpecUpdated();
    });
  }

  if (editBoldBtn) {
    editBoldBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedKey = store.getSelectedElement() || 'body';
      const scaleKey = getCurrentElementScaleKey(selectedKey);
      const cur = getCurrentFontWeight(selectedKey);
      const n = cur >= 700 ? 400 : 800;
      store.updateTypographyScale(scaleKey, 'weight', n, true);
      if (onSpecUpdated) onSpecUpdated();
      showToast(n >= 700 ? '𝐁 Bold Enabled' : 'Normal Weight');
    });
  }

  // Color Swatches & Custom Picker
  editColorSwatches.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = btn.getAttribute('data-color');
      const selectedKey = store.getSelectedElement() || 'branding';
      if (!color) return;
      if (selectedKey === 'body') {
        store.updateCustomColor('text_secondary', color, true);
      } else {
        store.updateCustomColor('text_primary', color, true);
      }
      if (onSpecUpdated) onSpecUpdated();
      showToast(`🎨 Color updated: ${color}`);
    });
  });

  if (editCustomColorInput) {
    editCustomColorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      const selectedKey = store.getSelectedElement() || 'branding';
      if (color) {
        store.updateCustomColor('text_primary', color, true);
        if (onSpecUpdated) onSpecUpdated();
      }
    });
  }

  // Layer Deletion & Reset
  if (editDeleteElementBtn) {
    editDeleteElementBtn.addEventListener('click', () => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      const elem = container?.querySelector(`[data-draggable="${selectedKey}"]`);
      const label = elem?.getAttribute('data-label') || selectedKey;
      store.deleteElement(selectedKey, true, true);
      const selOverlay = document.getElementById('canvasSelectionOverlay');
      if (selOverlay) selOverlay.classList.add('hidden');
      if (onSpecUpdated) onSpecUpdated();
      showToast(`🗑️ "${label}" মুছে ফেলা হয়েছে`);
    });
  }

  if (editResetElementBtn) {
    editResetElementBtn.addEventListener('click', () => {
      const selectedKey = store.getSelectedElement();
      if (!selectedKey) return;
      store.resetPositions();
      if (onSpecUpdated) onSpecUpdated();
      showToast('🔄 লেআউট পজিশন ও সাইজ রিসেট করা হয়েছে');
    });
  }

  // =========================================================================
  // ADOBE PHOTOSHOP & CANVA IN-PLACE 'TYPE TOOL' (T) ENGINE
  // =========================================================================
  let activeEditingKey = null;
  let activeEditorElement = null;

  function deactivateTypeTool() {
    if (activeEditingKey && container) {
      const elem = container.querySelector(`[data-draggable="${activeEditingKey}"]`);
      if (elem) {
        elem.classList.remove('layer-editing-now');
      }
    }
    if (typeToolLayer) {
      typeToolLayer.innerHTML = '';
    }
    const prevKey = activeEditingKey;
    activeEditingKey = null;
    activeEditorElement = null;
    if (prevKey) {
      store.pushHistory();
      store.notify();
    }
  }

  function activateTypeTool(layerKey) {
    if (!typeToolLayer || !layerKey) return;
    const elem = container?.querySelector(`[data-draggable="${layerKey}"]`);
    if (!elem) return;

    if (activeEditingKey && activeEditingKey === layerKey) return;

    deactivateTypeTool();

    activeEditingKey = layerKey;
    elem.classList.add('layer-editing-now');

    const selOverlay = document.getElementById('canvasSelectionOverlay');
    if (selOverlay) selOverlay.classList.add('hidden');

    const spec = store.getSpec();
    const c = spec.content || {};
    const t = spec.typography || {};
    const p = spec.palette || {};
    const font = t.font_family || 'Inter, sans-serif';

    const coords = getElementCoordinates(elem);
    let bbox;
    try {
      bbox = elem.getBBox();
    } catch (e) {
      bbox = { x: 0, y: 0, width: 680, height: 100 };
    }

    const startX = coords.x + bbox.x;
    const startY = coords.y + bbox.y;
    const currentW = Math.max(160, bbox.width + 12);
    const currentH = Math.max(28, bbox.height + 6);

    let editorDom;

    if (layerKey === 'body') {
      const paragraphs = Array.isArray(c.body?.paragraphs) ? c.body.paragraphs.join('\n\n') : (c.body?.text || '');
      const fontSize = t.scale?.body?.size || 10.5;
      const lineHeight = t.scale?.body?.line_height || 17;

      const textarea = document.createElement('textarea');
      textarea.value = paragraphs;
      textarea.className = 'adobe-type-active pointer-events-auto w-full';
      textarea.style.fontFamily = font;
      textarea.style.fontSize = `${fontSize}px`;
      textarea.style.lineHeight = `${lineHeight}px`;
      textarea.style.fontWeight = `${t.scale?.body?.weight || 400}`;
      textarea.style.color = p.text_secondary || '#64748B';
      textarea.style.width = `${Math.max(300, currentW)}px`;
      textarea.style.minHeight = `${Math.max(100, currentH)}px`;

      const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`;
      };

      textarea.addEventListener('input', (e) => {
        autoResize();
        store.updateElementContent('body', e.target.value, false, false);
      });

      textarea.addEventListener('blur', () => {
        deactivateTypeTool();
        if (onSpecUpdated) onSpecUpdated();
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'adobe-type-wrapper';
      wrapper.style.left = `${Math.max(10, startX)}px`;
      wrapper.style.top = `${Math.max(10, startY)}px`;
      wrapper.style.width = `${Math.max(320, currentW)}px`;
      wrapper.appendChild(textarea);
      editorDom = wrapper;

      setTimeout(autoResize, 10);

    } else if (layerKey === 'branding') {
      const wrapper = document.createElement('div');
      wrapper.className = 'adobe-type-wrapper flex flex-col gap-0.5';
      wrapper.style.left = `${Math.max(10, startX)}px`;
      wrapper.style.top = `${Math.max(10, startY)}px`;
      wrapper.style.width = `${Math.max(260, currentW + 10)}px`;

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = c.company?.name || '';
      nameInput.placeholder = 'Company Name';
      nameInput.className = 'adobe-type-active w-full';
      nameInput.style.fontFamily = font;
      nameInput.style.fontSize = `${t.scale?.brand_name?.size || 26}px`;
      nameInput.style.fontWeight = `${t.scale?.brand_name?.weight || 800}`;
      nameInput.style.letterSpacing = `${t.scale?.brand_name?.letter_spacing || 0.5}px`;
      nameInput.style.color = p.text_primary || '#0F172A';

      const tagInput = document.createElement('input');
      tagInput.type = 'text';
      tagInput.value = c.company?.tagline || '';
      tagInput.placeholder = 'Brand Tagline';
      tagInput.className = 'adobe-type-active w-full uppercase';
      tagInput.style.fontFamily = font;
      tagInput.style.fontSize = `${t.scale?.tagline?.size || 8.5}px`;
      tagInput.style.fontWeight = `${t.scale?.tagline?.weight || 600}`;
      tagInput.style.letterSpacing = `${t.scale?.tagline?.letter_spacing || 2.4}px`;
      tagInput.style.color = p.gradient_accent?.[0] || '#00C6FF';

      nameInput.addEventListener('input', (e) => {
        store.updateElementContent('brand_name', e.target.value, false, false);
      });
      tagInput.addEventListener('input', (e) => {
        store.updateElementContent('tagline', e.target.value, false, false);
      });

      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          tagInput.focus();
        }
      });

      wrapper.appendChild(nameInput);
      wrapper.appendChild(tagInput);
      editorDom = wrapper;

    } else if (layerKey === 'recipient') {
      const wrapper = document.createElement('div');
      wrapper.className = 'adobe-type-wrapper flex flex-col gap-0.5';
      wrapper.style.left = `${Math.max(10, startX)}px`;
      wrapper.style.top = `${Math.max(10, startY)}px`;
      wrapper.style.width = `${Math.max(280, currentW + 10)}px`;

      const rName = document.createElement('input');
      rName.type = 'text';
      rName.value = c.recipient?.name || '';
      rName.placeholder = 'Recipient Name';
      rName.className = 'adobe-type-active w-full';
      rName.style.fontFamily = font;
      rName.style.fontSize = `${t.scale?.recipient_name?.size || 17}px`;
      rName.style.fontWeight = `${t.scale?.recipient_name?.weight || 700}`;
      rName.style.color = p.gradient_accent?.[1] || '#0072FF';

      const rTitle = document.createElement('input');
      rTitle.type = 'text';
      rTitle.value = c.recipient?.title || '';
      rTitle.placeholder = 'Designation & Company';
      rTitle.className = 'adobe-type-active w-full';
      rTitle.style.fontFamily = font;
      rTitle.style.fontSize = `${t.scale?.meta?.size || 9.5}px`;
      rTitle.style.fontWeight = `${t.scale?.meta?.weight || 500}`;
      rTitle.style.color = p.text_primary || '#0F172A';

      const rAddr = document.createElement('input');
      rAddr.type = 'text';
      rAddr.value = c.recipient?.address || '';
      rAddr.placeholder = 'Address';
      rAddr.className = 'adobe-type-active w-full';
      rAddr.style.fontFamily = font;
      rAddr.style.fontSize = `${t.scale?.meta?.size || 9.5}px`;
      rAddr.style.color = p.text_secondary || '#64748B';

      rName.addEventListener('input', (e) => store.updateElementContent('recipient_name', e.target.value, false, false));
      rTitle.addEventListener('input', (e) => store.updateElementContent('recipient_title', e.target.value, false, false));
      rAddr.addEventListener('input', (e) => store.updateElementContent('recipient_address', e.target.value, false, false));

      wrapper.appendChild(rName);
      wrapper.appendChild(rTitle);
      wrapper.appendChild(rAddr);
      editorDom = wrapper;

    } else if (layerKey === 'signature') {
      const wrapper = document.createElement('div');
      wrapper.className = 'adobe-type-wrapper flex flex-col gap-0.5';
      wrapper.style.left = `${Math.max(10, startX)}px`;
      wrapper.style.top = `${Math.max(10, startY)}px`;
      wrapper.style.width = `${Math.max(260, currentW + 10)}px`;

      const sClose = document.createElement('input');
      sClose.type = 'text';
      sClose.value = c.closing || 'Sincerely,';
      sClose.className = 'adobe-type-active w-full';
      sClose.style.fontFamily = font;
      sClose.style.fontSize = '11px';
      sClose.style.fontWeight = '500';
      sClose.style.color = p.text_primary || '#0F172A';

      const sName = document.createElement('input');
      sName.type = 'text';
      sName.value = c.sender?.name || '';
      sName.placeholder = 'Signer Full Name';
      sName.className = 'adobe-type-active w-full';
      sName.style.fontFamily = font;
      sName.style.fontSize = `${t.scale?.signature_name?.size || 14}px`;
      sName.style.fontWeight = `${t.scale?.signature_name?.weight || 700}`;
      sName.style.color = p.text_primary || '#0F172A';

      const sTitle = document.createElement('input');
      sTitle.type = 'text';
      sTitle.value = c.sender?.title || '';
      sTitle.placeholder = 'Designation';
      sTitle.className = 'adobe-type-active w-full';
      sTitle.style.fontFamily = font;
      sTitle.style.fontSize = '10px';
      sTitle.style.fontWeight = '500';
      sTitle.style.color = p.gradient_accent?.[1] || '#0072FF';

      sClose.addEventListener('input', (e) => store.updateElementContent('closing', e.target.value, false, false));
      sName.addEventListener('input', (e) => store.updateElementContent('signature_name', e.target.value, false, false));
      sTitle.addEventListener('input', (e) => store.updateElementContent('sender_title', e.target.value, false, false));

      wrapper.appendChild(sClose);
      wrapper.appendChild(sName);
      wrapper.appendChild(sTitle);
      editorDom = wrapper;

    } else {
      let val = '';
      if (layerKey === 'subject') val = c.subject || '';
      else if (layerKey === 'date') val = c.date || '';
      else val = c.company?.name || '';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = val;
      input.placeholder = `Type ${elementLabelMap[layerKey] || layerKey}...`;
      input.className = 'adobe-type-active w-full';
      input.style.fontFamily = font;
      input.style.fontSize = `${getCurrentFontSize(layerKey)}px`;
      input.style.fontWeight = layerKey === 'subject' ? '700' : '500';
      input.style.color = p.text_primary || '#0F172A';

      input.addEventListener('input', (e) => {
        store.updateElementContent(layerKey, e.target.value, false, false);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          deactivateTypeTool();
          if (onSpecUpdated) onSpecUpdated();
        }
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'adobe-type-wrapper';
      wrapper.style.left = `${Math.max(10, startX)}px`;
      wrapper.style.top = `${Math.max(10, startY)}px`;
      wrapper.style.width = `${Math.max(220, currentW + 10)}px`;
      wrapper.appendChild(input);
      editorDom = wrapper;
    }

    typeToolLayer.appendChild(editorDom);
    activeEditorElement = editorDom;

    const firstInput = editorDom.querySelector('input, textarea');
    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
        if (firstInput.setSelectionRange && firstInput.value) {
          firstInput.setSelectionRange(firstInput.value.length, firstInput.value.length);
        }
      }, 30);
    }
  }

  // Double-click on any vector layer activates Type Tool (T)
  if (container) {
    container.addEventListener('dblclick', (e) => {
      const draggableGroup = e.target.closest('[data-draggable]');
      if (draggableGroup) {
        e.preventDefault();
        e.stopPropagation();
        if (!store.getDragMode()) {
          store.setAppMode('edit');
        }
        const key = draggableGroup.getAttribute('data-draggable');
        store.setSelectedElement(key);
        activateTypeTool(key);
        window.dispatchEvent(new CustomEvent('app:switchToEditTab'));
      }
    });
  }

  // Single click on canvas element activates Type Tool & switches tab
  window.addEventListener('canvas:elementClicked', (e) => {
    if (e.detail?.key) {
      activateTypeTool(e.detail.key);
      window.dispatchEvent(new CustomEvent('app:switchToEditTab'));
    }
  });

  // Escape key deactivates Type Tool and commits
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeEditingKey) {
      deactivateTypeTool();
      if (onSpecUpdated) onSpecUpdated();
    }
  });

  // Listen for canvas:activateTypeTool from dragController
  window.addEventListener('canvas:activateTypeTool', (e) => {
    if (e.detail?.key) {
      activateTypeTool(e.detail.key);
      window.dispatchEvent(new CustomEvent('app:switchToEditTab'));
    }
  });

  // Click outside to commit Type Tool
  const artboardContainer = document.getElementById('artboardContainer');
  if (artboardContainer) {
    artboardContainer.addEventListener('mousedown', (e) => {
      if (activeEditingKey && !e.target.closest('#adobeTypeToolLayer')) {
        deactivateTypeTool();
        if (onSpecUpdated) onSpecUpdated();
      }
    });
  }

  // Re-sync Sidebar on Store changes
  store.subscribe(() => {
    if (activeEditingKey && container) {
      const editingElem = container.querySelector(`[data-draggable="${activeEditingKey}"]`);
      if (editingElem) editingElem.classList.add('layer-editing-now');
    }
    updateSidebarInspector();
  });

  updateSidebarInspector();

  return {
    updateSidebarInspector,
    activateTypeTool,
    deactivateTypeTool
  };
}
