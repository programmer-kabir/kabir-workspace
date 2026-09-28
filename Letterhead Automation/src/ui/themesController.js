import { presetThemes } from '../data/presetThemes.js';
import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupThemesController(onThemeChanged) {
  const list = document.getElementById('presetsList');
  if (!list) return;

  list.innerHTML = '';
  presetThemes.forEach(theme => {
    const item = document.createElement('div');
    item.className = 'p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group';
    item.innerHTML = `
      <div>
        <div class="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">${theme.name}</div>
        <div class="text-[10px] text-slate-400 capitalize">${theme.mood}</div>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-4 h-4 rounded-full border border-white/20" style="background:${theme.palette.gradient_primary[1]}"></span>
        <span class="w-4 h-4 rounded-full border border-white/20" style="background:${theme.palette.gradient_accent[0]}"></span>
        <span class="w-4 h-4 rounded-full border border-white/20" style="background:${theme.palette.gradient_accent[1]}"></span>
      </div>
    `;
    item.addEventListener('click', () => {
      const spec = store.getSpec();
      spec.palette = JSON.parse(JSON.stringify(theme.palette));
      spec.meta = spec.meta || {};
      spec.meta.style = theme.name;
      spec.meta.mood = theme.mood;
      store.setSpec(spec);
      if (onThemeChanged) onThemeChanged();
      showToast(`Switched theme to ${theme.name}`);
    });
    list.appendChild(item);
  });
}
