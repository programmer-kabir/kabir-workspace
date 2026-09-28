import { generateDesignFromPrompt, getStoredApiKey, setStoredApiKey } from '../services/geminiService.js';
import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupAiController(onSpecGenerated) {
  const promptInput = document.getElementById('aiPromptInput');
  const generateBtn = document.getElementById('aiGenerateBtn');
  const apiKeyInput = document.getElementById('aiApiKeyInput');
  const toggleKeyBtn = document.getElementById('toggleApiKeyBtn');
  const keyContainer = document.getElementById('apiKeyContainer');
  const chipButtons = document.querySelectorAll('.ai-prompt-chip');
  const aiStatusBox = document.getElementById('aiStatusBox');
  const lockLayoutCheck = document.getElementById('aiLockLayoutCheck');
  const activeLayoutBadge = document.getElementById('activeLayoutBadge');

  const layoutNames = {
    top_wave: "Top Wave",
    left_sidebar: "Left Strip",
    right_sidebar: "Right Strip",
    center_formal: "Executive",
    diagonal_corner: "Diagonal Cut",
    diagonal_inverse: "Diagonal Inv",
    full_border_frame: "Cert Frame"
  };

  const syncLayoutBadge = (spec) => {
    if (activeLayoutBadge) {
      const curLayout = spec.meta?.layout_style || 'top_wave';
      activeLayoutBadge.textContent = layoutNames[curLayout] || curLayout;
    }
  };

  // Initial sync
  syncLayoutBadge(store.getSpec());
  store.subscribe(syncLayoutBadge);

  // Load API Key
  if (apiKeyInput) {
    apiKeyInput.value = getStoredApiKey();
    apiKeyInput.addEventListener('change', () => {
      setStoredApiKey(apiKeyInput.value);
      showToast('Gemini API Key saved locally');
    });
  }

  if (toggleKeyBtn && keyContainer) {
    toggleKeyBtn.addEventListener('click', () => {
      keyContainer.classList.toggle('hidden');
    });
  }

  // Quick Prompt Chips
  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      if (promptInput) {
        promptInput.value = chip.getAttribute('data-prompt') || chip.textContent.trim();
        promptInput.focus();
      }
    });
  });

  async function handleAiGeneration() {
    if (!promptInput) return;
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showToast('⚠️ অনুগ্রহ করে একটি ডিজাইন প্রম্পট লিখুন!');
      promptInput.focus();
      return;
    }

    const key = apiKeyInput ? apiKeyInput.value.trim() : getStoredApiKey();
    if (!key) {
      showToast('⚠️ Gemini API Key প্রদান করুন!');
      if (keyContainer) keyContainer.classList.remove('hidden');
      return;
    }

    const keepLayout = lockLayoutCheck ? lockLayoutCheck.checked : true;

    // Set UI loading state
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Gemini AI ডিজাইন তৈরি করছে...</span>
      `;
    }

    if (aiStatusBox) {
      aiStatusBox.classList.remove('hidden');
      aiStatusBox.innerHTML = `
        <div class="flex items-center gap-2 text-cyan-400 text-xs">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>${keepLayout ? 'বর্তমান লেআউটে কালার ও কন্টেন্ট সাজানো হচ্ছে...' : 'নতুন লেআউট, কালার ও কন্টেন্ট তৈরি হচ্ছে...'}</span>
        </div>
      `;
    }

    try {
      const newSpec = await generateDesignFromPrompt(prompt, key, { keepCurrentLayout: keepLayout });
      store.setSpec(newSpec);
      
      if (onSpecGenerated) {
        onSpecGenerated();
      }

      showToast(`✨ নতুন AI ডিজাইন তৈরি সম্পন্ন: ${newSpec.meta?.style || 'Custom'}`);

      if (aiStatusBox) {
        aiStatusBox.innerHTML = `
          <div class="flex items-center gap-1.5 text-emerald-400 text-xs">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>সফলভাবে নতুন টেমপ্লেট লোড হয়েছে! (${newSpec.content?.company?.name || 'Company'})</span>
          </div>
        `;
        setTimeout(() => {
          aiStatusBox.classList.add('hidden');
        }, 4000);
      }
    } catch (err) {
      console.error('Gemini AI Generation failed:', err);
      showToast(`❌ Error: ${err.message}`);
      if (aiStatusBox) {
        aiStatusBox.innerHTML = `
          <div class="text-rose-400 text-xs">
            <strong>AI ত্রুটি:</strong> ${err.message}
          </div>
        `;
      }
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
          <svg class="w-4 h-4 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>✨ Generate Design with AI</span>
        `;
      }
    }
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', handleAiGeneration);
  }

  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAiGeneration();
      }
    });
  }
}
