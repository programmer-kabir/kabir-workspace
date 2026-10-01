import { store } from '../state/store.js';
import { generateNewArtwork } from '../engines/artworkGenerator.js';
import { copySvgToClipboard, downloadSvgFile, printLetterhead } from '../services/exportService.js';
import { showToast } from '../services/toastService.js';

export function setupHeaderActions(onSpecUpdated) {
  // Regenerate Art Logic
  const triggerRegenerateArt = () => {
    const styleSelect = document.getElementById('artStyleSelect');
    const selectedStyle = styleSelect ? styleSelect.value : 'random';
    const { activeArtPreset, style, chosenBadge } = generateNewArtwork(selectedStyle);

    // Update badge UI
    const badge = document.getElementById('artStyleBadge');
    if (badge) {
      const labels = {
        waves: "Fluid Waves",
        tech_angles: "Tech Polygonal",
        origami_folds: "Origami Dynamic",
        cyber_mesh: "Cyber Stepped",
        ribbons: "Curved Ribbons",
        minimal_arcs: "Minimal Arcs"
      };
      badge.textContent = labels[style] || style;
    }

    const spec = JSON.parse(JSON.stringify(store.getSpec()));
    if (Array.isArray(spec.layout)) {
      const l2 = spec.layout.find(l => l.id === "Layer_2_Header_Art");
      if (l2) l2.content = `Procedural ${style} header spanning full bleed (max y ≈ 140pt) with a tech ${chosenBadge} badge at x=${Math.round(activeArtPreset.badgePos.x)} y=${Math.round(activeArtPreset.badgePos.y)}`;
      const l7 = spec.layout.find(l => l.id === "Layer_7_Footer");
      if (l7) l7.content = `Mirrored ${style} footer curves from y≈1085 to 1146.5 with contact stack and glyph badges`;
    }

    store.setSpec(spec);
    if (onSpecUpdated) onSpecUpdated();
    showToast('🎨 নতুন হেডার এবং ফুটার আর্ট তৈরি করা হয়েছে!');
  };

  const regenArtTopBtn = document.getElementById('regenArtTopBtn');
  if (regenArtTopBtn) regenArtTopBtn.addEventListener('click', triggerRegenerateArt);

  const regenArtFormBtn = document.getElementById('regenArtFormBtn');
  if (regenArtFormBtn) regenArtFormBtn.addEventListener('click', triggerRegenerateArt);

  const artStyleSelect = document.getElementById('artStyleSelect');
  if (artStyleSelect) {
    artStyleSelect.addEventListener('change', () => {
      triggerRegenerateArt();
    });
  }

  // Layout Style Selector
  const layoutSelect = document.getElementById('layoutSelect');
  if (layoutSelect) {
    const currentSpec = store.getSpec();
    layoutSelect.value = currentSpec.meta?.layout_style || 'top_wave';

    layoutSelect.addEventListener('change', () => {
      const spec = JSON.parse(JSON.stringify(store.getSpec()));
      spec.meta = spec.meta || {};
      spec.meta.layout_style = layoutSelect.value;
      spec.layout = layoutSelect.value;
      store.setSpec(spec);
      if (onSpecUpdated) onSpecUpdated();
      const layoutNames = {
        top_wave: "Top Wave Header",
        left_sidebar: "Left Brand Strip",
        right_sidebar: "Right Brand Strip",
        center_formal: "Classic Executive",
        diagonal_corner: "Diagonal Cut (Top-Right / Bot-Left)",
        diagonal_inverse: "Diagonal Cut (Top-Left / Bot-Right)",
        full_border_frame: "Certificate & Seal Frame"
      };
      showToast(`📐 লেআউট পরিবর্তন করা হয়েছে: ${layoutNames[layoutSelect.value] || layoutSelect.value}`);
    });

    // Auto sync layout dropdown when spec changes via AI or theme
    store.subscribe((spec) => {
      const targetLayout = spec?.meta?.layout_style || (typeof spec?.layout === 'string' ? spec.layout : null);
      if (targetLayout && layoutSelect.value !== targetLayout) {
        layoutSelect.value = targetLayout;
      }
    });
  }



  // Undo / Redo Actions
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const topModeBadge = document.getElementById('topModeBadge');

  function updateUndoRedoUi() {
    if (undoBtn) undoBtn.disabled = !store.canUndo();
    if (redoBtn) redoBtn.disabled = !store.canRedo();
    if (topModeBadge) {
      const isEdit = store.getAppMode() === 'edit';
      topModeBadge.classList.toggle('hidden', !isEdit);
      topModeBadge.classList.toggle('flex', !isEdit ? false : true);
    }
  }

  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (store.undo()) {
        if (onSpecUpdated) onSpecUpdated();
        updateUndoRedoUi();
        showToast('↩️ পূর্বের অবস্থায় ফিরে যাওয়া হয়েছে (Undo)');
      }
    });
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      if (store.redo()) {
        if (onSpecUpdated) onSpecUpdated();
        updateUndoRedoUi();
        showToast('↪️ পুনরায় প্রয়োগ করা হয়েছে (Redo)');
      }
    });
  }

  // Global Keyboard Shortcuts (Ctrl+Z for Undo, Ctrl+Y / Ctrl+Shift+Z for Redo)
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (store.undo()) {
          if (onSpecUpdated) onSpecUpdated();
          updateUndoRedoUi();
          showToast('↩️ Undo (Ctrl+Z)');
        }
      } else if ((e.key === 'y' && !e.shiftKey) || ((e.key === 'z' || e.key === 'Z') && e.shiftKey)) {
        e.preventDefault();
        if (store.redo()) {
          if (onSpecUpdated) onSpecUpdated();
          updateUndoRedoUi();
          showToast('↪️ Redo (Ctrl+Y)');
        }
      }
    }
  });

  store.subscribe(() => {
    updateUndoRedoUi();
  });

  updateUndoRedoUi();

  // Copy SVG Button
  const copySvgBtn = document.getElementById('copySvgBtn');
  if (copySvgBtn) {
    copySvgBtn.addEventListener('click', () => {
      copySvgToClipboard(store.getSpec());
    });
  }

  // Download SVG Button
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      downloadSvgFile(store.getSpec());
    });
  }

  // Print / PDF Button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printLetterhead(store.getSpec());
    });
  }

  // Tab switching
  const tabAiBtn = document.getElementById('tabAiBtn');
  const tabFormBtn = document.getElementById('tabFormBtn');
  const tabJsonBtn = document.getElementById('tabJsonBtn');
  const tabThemesBtn = document.getElementById('tabThemesBtn');
  const tabEditBtn = document.getElementById('tabEditBtn');
  
  const tabAi = document.getElementById('tabContentAi');
  const tabForm = document.getElementById('tabContentForm');
  const tabJson = document.getElementById('tabContentJson');
  const tabThemes = document.getElementById('tabContentThemes');
  const tabEdit = document.getElementById('tabContentEdit');

  function switchTab(activeBtn, activeContent) {
    [tabAiBtn, tabFormBtn, tabJsonBtn, tabThemesBtn, tabEditBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('border-cyan-400', 'text-cyan-400', 'font-semibold');
        btn.classList.add('border-transparent', 'text-slate-400');
      }
    });
    [tabAi, tabForm, tabJson, tabThemes, tabEdit].forEach(content => {
      if (content) {
        content.classList.add('hidden');
        content.classList.remove('flex');
      }
    });
    if (activeBtn) {
      activeBtn.classList.remove('border-transparent', 'text-slate-400');
      activeBtn.classList.add('border-cyan-400', 'text-cyan-400', 'font-semibold');
    }
    if (activeContent) {
      activeContent.classList.remove('hidden');
      if (activeContent === tabJson) activeContent.classList.add('flex');
    }
  }

  function syncTabVisibility() {
    const isEdit = store.getAppMode() === 'edit';
    if (tabEditBtn) {
      tabEditBtn.classList.toggle('hidden', !isEdit);
      tabEditBtn.classList.toggle('flex', isEdit);
    }
    if (!isEdit && tabEdit && !tabEdit.classList.contains('hidden')) {
      switchTab(tabAiBtn, tabAi);
    }
  }

  if (tabAiBtn && tabAi) tabAiBtn.addEventListener('click', () => switchTab(tabAiBtn, tabAi));
  if (tabFormBtn && tabForm) tabFormBtn.addEventListener('click', () => switchTab(tabFormBtn, tabForm));
  if (tabJsonBtn && tabJson) tabJsonBtn.addEventListener('click', () => switchTab(tabJsonBtn, tabJson));
  if (tabThemesBtn && tabThemes) tabThemesBtn.addEventListener('click', () => switchTab(tabThemesBtn, tabThemes));
  if (tabEditBtn && tabEdit) tabEditBtn.addEventListener('click', () => switchTab(tabEditBtn, tabEdit));

  window.addEventListener('app:switchToEditTab', () => {
    syncTabVisibility();
    if (tabEditBtn && tabEdit) switchTab(tabEditBtn, tabEdit);
  });

  store.subscribe(() => {
    syncTabVisibility();
  });

  syncTabVisibility();
}
