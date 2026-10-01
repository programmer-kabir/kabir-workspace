import { generateDesignFromPrompt, generateHeaderFooterOnly, generate4DesignVariants, generate4ProceduralVariants, getStoredApiKey, setStoredApiKey } from '../services/geminiService.js';
import { generateVectorLetterheadSVG } from '../engines/svgRenderer.js';
import { activeArtPreset } from '../engines/artworkGenerator.js';
import { store } from '../state/store.js';
import { showToast } from '../services/toastService.js';

export function setupAiController(onSpecGenerated) {
  const promptInput = document.getElementById('aiPromptInput');
  const generateBtn = document.getElementById('aiGenerateBtn');
  const generate4VariantsBtn = document.getElementById('aiGenerate4VariantsBtn');
  const instant4VariantsBtn = document.getElementById('instant4VariantsBtn');
  const apiKeyInput = document.getElementById('aiApiKeyInput');
  const toggleKeyBtn = document.getElementById('toggleApiKeyBtn');
  const keyContainer = document.getElementById('apiKeyContainer');
  const chipButtons = document.querySelectorAll('.ai-prompt-chip');
  const aiStatusBox = document.getElementById('aiStatusBox');
  const lockLayoutCheck = document.getElementById('aiLockLayoutCheck');
  const activeLayoutBadge = document.getElementById('activeLayoutBadge');
  const fourBoardGrid = document.getElementById('fourBoardGrid');
  const variantCountBadge = document.getElementById('variantCountBadge');

  let currentVariants = [];
  let selectedBoardIndex = null;

  const layoutNames = {
    top_wave: "Top Wave",
    left_sidebar: "Left Strip",
    right_sidebar: "Right Strip",
    center_formal: "Executive",
    diagonal_corner: "Diagonal Cut",
    diagonal_inverse: "Diagonal Inv",
    full_border_frame: "Cert Frame"
  };

  let lastLayout = store.getSpec().meta?.layout_style || (typeof store.getSpec().layout === 'string' ? store.getSpec().layout : 'top_wave');
  const syncLayoutBadge = (spec) => {
    const curLayout = spec.meta?.layout_style || (typeof spec.layout === 'string' ? spec.layout : 'top_wave');
    if (activeLayoutBadge) {
      activeLayoutBadge.textContent = layoutNames[curLayout] || curLayout;
    }
    if (curLayout !== lastLayout) {
      lastLayout = curLayout;
      originalBaseSpec = JSON.parse(JSON.stringify(spec));
      try {
        const freshVariants = generate4ProceduralVariants(spec);
        renderFourBoards(freshVariants);
      } catch (e) {
        console.warn('Failed to refresh 4 boards on layout switch:', e);
      }
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

  const originalBoardCard = document.getElementById('originalBoardCard');
  let originalBaseSpec = JSON.parse(JSON.stringify(store.getSpec()));

  /**
   * Render the Original Base Board Card
   */
  function renderOriginalBoard() {
    if (!originalBoardCard) return;
    const previewEl = originalBoardCard.querySelector('.board-preview');
    if (previewEl) {
      const miniSvg = generateVectorLetterheadSVG(originalBaseSpec, false);
      previewEl.innerHTML = miniSvg;
      const svgElement = previewEl.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.pointerEvents = 'none';
      }
    }

    if (selectedBoardIndex === 'original') {
      originalBoardCard.classList.add('ring-2', 'ring-emerald-400', 'border-emerald-400', 'bg-slate-900');
    } else {
      originalBoardCard.classList.remove('ring-2', 'ring-emerald-400', 'border-emerald-400', 'bg-slate-900');
    }

    originalBoardCard.onclick = () => {
      applyOriginalBase();
    };
  }

  function applyOriginalBase() {
    selectedBoardIndex = 'original';
    store.setSpec(JSON.parse(JSON.stringify(originalBaseSpec)));

    if (onSpecGenerated) {
      onSpecGenerated();
    }

    // Update active rings
    if (originalBoardCard) {
      originalBoardCard.classList.add('ring-2', 'ring-emerald-400', 'border-emerald-400', 'bg-slate-900');
    }
    if (fourBoardGrid) {
      const cards = fourBoardGrid.querySelectorAll('.four-board-card');
      cards.forEach(c => c.classList.remove('ring-2', 'ring-cyan-400', 'border-cyan-400', 'bg-slate-900'));
    }

    showToast('📌 মূল অপরিবর্তিত ডিজাইন (Original Base) ক্যানভাসে রিস্টোর করা হয়েছে!');
  }

  /**
   * Render the 4 miniature preview boards
   */
  function renderFourBoards(variantsList) {
    currentVariants = variantsList;
    renderOriginalBoard();

    if (!fourBoardGrid) return;

    const cards = fourBoardGrid.querySelectorAll('.four-board-card');
    cards.forEach((card, idx) => {
      const variant = variantsList[idx];
      if (!variant) return;

      const titleEl = card.querySelector('.board-title');
      const styleEl = card.querySelector('.board-style');
      const previewEl = card.querySelector('.board-preview');
      const btnEl = card.querySelector('button');

      if (titleEl) titleEl.textContent = variant._variantTitle || `Variant ${idx + 1}`;
      if (styleEl) styleEl.textContent = (variant._variantStyle || '').toUpperCase();

      // Pass art preset in variant object cleanly
      const variantWithArt = {
        ...variant,
        art_preset: variant._artPreset || variant.art_preset
      };

      // Render clean preview SVG without editing guides
      const miniSvg = generateVectorLetterheadSVG(variantWithArt, false);

      if (previewEl) {
        previewEl.innerHTML = miniSvg;
        const svgElement = previewEl.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.pointerEvents = 'none';
        }
      }

      if (btnEl) {
        btnEl.textContent = `Apply Variant ${idx + 1}`;
      }

      // Highlight if this is the active board
      if (selectedBoardIndex === idx) {
        card.classList.add('ring-2', 'ring-cyan-400', 'border-cyan-400', 'bg-slate-900');
      } else {
        card.classList.remove('ring-2', 'ring-cyan-400', 'border-cyan-400', 'bg-slate-900');
      }

      // Click handler
      card.onclick = () => {
        applyBoardVariant(idx);
      };
    });

    if (variantCountBadge) {
      variantCountBadge.textContent = '1 Base + 4 Variants Ready';
    }
  }

  function applyBoardVariant(index) {
    const chosen = currentVariants[index];
    if (!chosen) return;

    selectedBoardIndex = index;

    const appliedSpec = JSON.parse(JSON.stringify(chosen));

    if (chosen._artPreset) {
      Object.assign(activeArtPreset, chosen._artPreset);
      appliedSpec.art_preset = JSON.parse(JSON.stringify(chosen._artPreset));
    }

    delete appliedSpec._variantTitle;
    delete appliedSpec._variantStyle;
    delete appliedSpec._artPreset;

    store.setSpec(appliedSpec);

    if (onSpecGenerated) {
      onSpecGenerated();
    }

    // Update active ring on cards
    if (originalBoardCard) {
      originalBoardCard.classList.remove('ring-2', 'ring-emerald-400', 'border-emerald-400', 'bg-slate-900');
    }
    if (fourBoardGrid) {
      const cards = fourBoardGrid.querySelectorAll('.four-board-card');
      cards.forEach((c, i) => {
        if (i === index) {
          c.classList.add('ring-2', 'ring-cyan-400', 'border-cyan-400', 'bg-slate-900');
        } else {
          c.classList.remove('ring-2', 'ring-cyan-400', 'border-cyan-400', 'bg-slate-900');
        }
      });
    }

    showToast(`✨ ক্যানভাসে Variant ${index + 1} (${chosen._variantTitle || 'Design'}) লোড হয়েছে!`);
  }

  // Load initial 4 procedural boards on startup
  try {
    const initialFour = generate4ProceduralVariants(store.getSpec());
    renderFourBoards(initialFour);
  } catch (initErr) {
    console.warn('Initial 4 boards load warning:', initErr);
  }

  /**
   * Handle 4-Board AI Generation
   */
  async function handleGenerate4Variants() {
    if (!promptInput) return;
    const prompt = promptInput.value.trim() || 'Modern sleek corporate brand letterhead';
    const key = apiKeyInput ? apiKeyInput.value.trim() : getStoredApiKey();

    if (!key) {
      showToast('⚠️ Gemini API Key প্রদান করুন!');
      if (keyContainer) keyContainer.classList.remove('hidden');
      return;
    }

    if (generate4VariantsBtn) {
      generate4VariantsBtn.disabled = true;
      generate4VariantsBtn.innerHTML = `
        <svg class="w-4 h-4 animate-spin text-purple-300" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>৪টি ভ্যারিয়েন্ট তৈরি হচ্ছে (Gemini AI)...</span>
      `;
    }

    if (aiStatusBox) {
      aiStatusBox.classList.remove('hidden');
      aiStatusBox.innerHTML = `
        <div class="flex items-center gap-2 text-purple-300 text-xs">
          <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          <span>একসাথে ৪টি ভিন্ন ভেক্টর ডিজাইন বোর্ড তৈরি করা হচ্ছে...</span>
        </div>
      `;
    }

    try {
      const fourVariants = await generate4DesignVariants(prompt, key);
      renderFourBoards(fourVariants);

      // Auto-apply board 1
      applyBoardVariant(0);

      showToast('🎯 ৪টি ভিন্ন ডিজাইন বোর্ড সফলভাবে লোড হয়েছে! পছন্দমতো ক্লিক করুন।');

      if (aiStatusBox) {
        aiStatusBox.innerHTML = `
          <div class="flex items-center gap-1.5 text-emerald-400 text-xs">
            <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>৪টি বোর্ড প্রস্তুত! নিচের যেকোনো বোর্ডে ক্লিক করে ক্যানভাসে প্রয়োগ করুন।</span>
          </div>
        `;
        setTimeout(() => {
          aiStatusBox.classList.add('hidden');
        }, 5000);
      }
    } catch (err) {
      console.error('4-Board AI Generation failed:', err);
      showToast(`❌ Error: ${err.message}. Procedural 4 boards loaded.`);
      const fallbackList = generate4ProceduralVariants(store.getSpec());
      renderFourBoards(fallbackList);
      applyBoardVariant(0);
    } finally {
      if (generate4VariantsBtn) {
        generate4VariantsBtn.disabled = false;
        generate4VariantsBtn.innerHTML = `
          <svg class="w-4 h-4 text-purple-200 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>🎯 Suggest 4 Design Variants (4-Board AI)</span>
        `;
      }
    }
  }

  /**
   * Handle Instant 4-Board Shuffle (No API wait)
   */
  function handleInstant4Shuffle() {
    const fourVariants = generate4ProceduralVariants(store.getSpec());
    renderFourBoards(fourVariants);
    applyBoardVariant(0);
    showToast('⚡ ৪টি নতুন প্রসিডিউরাল বোর্ড রেন্ডার হয়েছে!');
  }

  /**
   * Handle Single AI Generation
   */
  async function handleSingleAiGeneration() {
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
          <span>${keepLayout ? 'বর্তমান লেআউটে নতুন ডিজাইন তৈরি হচ্ছে...' : 'সম্পূর্ণ নতুন ব্র্যান্ড ও ডিজাইন তৈরি হচ্ছে...'}</span>
        </div>
      `;
    }

    try {
      const newSpec = await generateDesignFromPrompt(prompt, key, { keepCurrentLayout: keepLayout });
      store.setSpec(newSpec);

      originalBaseSpec = JSON.parse(JSON.stringify(newSpec));
      selectedBoardIndex = 'original';

      if (onSpecGenerated) {
        onSpecGenerated();
      }

      showToast(`✨ নতুন AI ডিজাইন সম্পন্ন: ${newSpec.meta?.style || 'Custom'}`);

      // Refresh 4 boards based on the new spec
      const freshFour = generate4ProceduralVariants(newSpec);
      renderFourBoards(freshFour);
      renderOriginalBoard();

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
          <span>✨ Generate Full Letterhead (AI)</span>
        `;
      }
    }
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', handleSingleAiGeneration);
  }

  if (generate4VariantsBtn) {
    generate4VariantsBtn.addEventListener('click', handleGenerate4Variants);
  }

  if (instant4VariantsBtn) {
    instant4VariantsBtn.addEventListener('click', handleInstant4Shuffle);
  }

  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleGenerate4Variants();
      }
    });
  }
}
