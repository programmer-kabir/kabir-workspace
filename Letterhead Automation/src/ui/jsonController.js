import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupJsonController(onSpecChangeFromEditor) {
  const jsonEditor = document.getElementById('jsonCodeEditor');
  const errorBar = document.getElementById('jsonErrorBar');
  const resetJsonBtn = document.getElementById('resetJsonBtn');

  function syncSpecToJson() {
    if (!jsonEditor) return;
    jsonEditor.value = JSON.stringify(store.getSpec(), null, 2);
    if (errorBar) errorBar.classList.add('hidden');
  }

  if (jsonEditor) {
    jsonEditor.addEventListener('input', () => {
      try {
        const parsed = JSON.parse(jsonEditor.value);
        if (errorBar) errorBar.classList.add('hidden');
        store.setSpec(parsed, false);
        if (onSpecChangeFromEditor) onSpecChangeFromEditor();
        store.notify();
      } catch (err) {
        if (errorBar) {
          errorBar.textContent = 'JSON Syntax Error: ' + err.message;
          errorBar.classList.remove('hidden');
        }
      }
    });
  }

  if (resetJsonBtn) {
    resetJsonBtn.addEventListener('click', () => {
      store.resetSpec();
      syncSpecToJson();
      if (onSpecChangeFromEditor) onSpecChangeFromEditor();
      showToast('Reset to original specification');
    });
  }

  syncSpecToJson();

  return { syncSpecToJson };
}
