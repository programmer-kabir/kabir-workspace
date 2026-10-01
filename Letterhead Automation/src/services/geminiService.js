import { store } from '../state/store.js';
import { generateNewArtwork, createArtworkPreset } from '../engines/artworkGenerator.js';

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
const DEFAULT_API_KEY = 'AIzaSyB48jliTWQy7oGgMbN8Hkmi3uSkMMZrSS4';

export function getStoredApiKey() {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE) || DEFAULT_API_KEY;
}

export function setStoredApiKey(key) {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
}

/**
 * Robust JSON extraction helper
 */
function extractAndParseJson(text) {
  if (!text) throw new Error('Empty response from AI');

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Attempt to locate first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced);
      } catch (e2) {
        // Remove trailing commas before closing braces/brackets
        const sanitized = sliced
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F]+/g, ' ');
        return JSON.parse(sanitized);
      }
    }
    throw e1;
  }
}

/**
 * Deep merge utility to ensure spec integrity
 */
function deepMerge(target, source) {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Sanitize and validate SVG path strings from AI
 */
function sanitizeSvgSnippet(svgStr, fallback = '') {
  if (!svgStr || typeof svgStr !== 'string') return fallback;
  const trimmed = svgStr.trim();
  if (!trimmed.includes('<path') && !trimmed.includes('<polygon') && !trimmed.includes('<rect')) {
    return fallback;
  }
  return trimmed;
}

async function queryGeminiModels(requestPayload, apiKey) {
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite'
  ];

  let rawText = null;
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const result = await response.json();
        rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          console.log(`[Gemini AI] Successfully generated with model: ${model}`);
          break;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData.error?.message || `HTTP ${response.status}`;
      }
    } catch (netErr) {
      lastError = netErr.message;
    }
  }

  if (!rawText) {
    throw new Error(lastError || 'No content returned from Gemini AI.');
  }

  return extractAndParseJson(rawText);
}

/**
 * Generate Complete Letterhead Design & Content
 */
export async function generateDesignFromPrompt(userPrompt, apiKey = getStoredApiKey(), options = { keepCurrentLayout: true }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API Key is missing. Please enter your API Key.');
  }

  const currentSpec = JSON.parse(JSON.stringify(store.getSpec()));
  const activeLayout = currentSpec.meta?.layout_style || 'top_wave';

  const randomStyles = [
    "Steep Asymmetric Cyber Polygonal cuts and faceted geometric wedges",
    "Triple Layered Fluid Wave curves with varied undulating crests",
    "Bauhaus Geometric Intersecting Arcs with clean modern styling",
    "Sharp Origami Dynamic Diagonal slashes and layered folded sheets",
    "Curved Satin Ribbon swooshes with smooth cubic bezier transitions",
    "Futuristic Stepped Grid Matrix with high-tech laser notches",
    "Dual Diagonal Blade slashes with high-contrast accent trims",
    "Floating Tech Hexagonal and Prismatic vector overlays"
  ];
  const chosenArchetype = randomStyles[Math.floor(Math.random() * randomStyles.length)];
  const randomSeed = Math.floor(Math.random() * 1000000);

  let layoutCoordInstruction = "";
  if (activeLayout === 'diagonal_corner') {
    layoutCoordInstruction = `
COORDINATE RULES FOR DIAGONAL CORNER:
1. "custom_header_svg": TOP-RIGHT corner artwork. Occupies X: 350 to 817.7, Y: 0 to 220. Begin along top (Y=0) and right edge (X=817.7), create artistic overlapping curved/angled vector paths with fill='url(#gradPrimary)' and fill='url(#gradAccent)', closing with Z.
2. "custom_footer_svg": BOTTOM-LEFT corner artwork. Occupies X: 0 to 480, Y: 920 to 1146.5. Begin along bottom (Y=1146.5) and left edge (X=0), create coordinating overlapping vector paths.`;
  } else if (activeLayout === 'diagonal_inverse') {
    layoutCoordInstruction = `
COORDINATE RULES FOR INVERSE DIAGONAL:
1. "custom_header_svg": TOP-LEFT corner artwork. Occupies X: 0 to 480, Y: 0 to 220. Begin along top (Y=0) and left edge (X=0), create artistic overlapping vector paths with fill='url(#gradPrimary)' and fill='url(#gradAccent)', closing with Z.
2. "custom_footer_svg": BOTTOM-RIGHT corner artwork. Occupies X: 350 to 817.7, Y: 920 to 1146.5. Begin along bottom (Y=1146.5) and right edge (X=817.7), create coordinating overlapping vector paths.`;
  } else {
    layoutCoordInstruction = `
COORDINATE RULES FOR HEADER & FOOTER:
1. "custom_header_svg": MUST ONLY occupy the top region (Y = 0 to max 175). Begins at (0,0) to (817.7,0), followed by creative Bezier curves (C/S/Q) or polygon cuts (L), closing with Z.
2. "custom_footer_svg": MUST ONLY occupy the bottom edge region (Y = 1010 to 1146.5). Begins at (0,1146.5) to (817.7,1146.5), closing with Z.`;
  }

  const systemInstruction = `
You are a world-class Corporate Brand Designer and Vector Graphic Engine for high-end Letterheads (Canvas: W=817.7, H=1146.5).
Creatively design an UNIQUE, HIGHLY CUSTOM letterhead based on the prompt.

CREATIVE DIRECTION FOR THIS GENERATION (Seed #${randomSeed}):
- Vector Aesthetic Theme: ${chosenArchetype}
- Active Letterhead Layout: "${activeLayout}"
- Strive for distinct geometry, unique curve depths, and bold modern branding.

${layoutCoordInstruction}
- NEVER place header or footer SVG paths in the middle (Y = 220 to 920).

Return JSON matching this schema:
{
  "meta": {
    "asset_type": "Corporate Letterhead",
    "style": "<e.g. Modern Tech Slate, Cyber Cobalt, Luxury Emerald, Minimalist Swiss>",
    "mood": "<3-4 descriptive mood words>",
    "layout_style": "${options.keepCurrentLayout ? activeLayout : 'top_wave'}"
  },
  "design_theme": "<Theme & branding rationale summary>",
  "palette": {
    "gradient_primary": ["#HEX1", "#HEX2"],
    "gradient_accent": ["#HEX3", "#HEX4"],
    "background": "#FFFFFF",
    "text_primary": "#HEX (dark readable text)",
    "text_secondary": "#HEX (medium muted text)",
    "neutral_shape": "#HEX (light background accent shape)",
    "divider": "#HEX (border line color)"
  },
  "content": {
    "company": {
      "name": "<Creative Brand Name>",
      "tagline": "<Industry Tagline / Slogan>"
    },
    "recipient": {
      "label": "To,",
      "name": "<Recipient Full Name>",
      "title": "<Recipient Designation>",
      "address": "<Address line, City, Country>",
      "email_web": "<contact@client.com>",
      "phone": "<+1 (555) 019-2834>"
    },
    "date": "<Formatted formal date>",
    "subject": "Subject: <Compelling Subject Line>",
    "salutation": "Dear <Name>,",
    "body": {
      "paragraphs": [
        "<Paragraph 1: Professional greeting and context>",
        "<Paragraph 2: Strategic value proposition and core details>",
        "<Paragraph 3: Confident closing, deliverables, and next steps>"
      ]
    },
    "closing": "Sincerely,",
    "sender": {
      "name": "<Signer Full Name>",
      "title": "<Executive Designation / CEO>"
    },
    "contact": {
      "phone": ["<Main Phone>", "<Alt Phone>"],
      "email": "<official@brand.com>",
      "web": "<www.branddomain.com>",
      "address": ["<Suite / Street>", "<City, State, Postal Code>"]
    }
  },
  "custom_header_svg": "<2-3 layered SVG path tags matching the active layout coordinates>",
  "custom_footer_svg": "<2-3 layered SVG path tags matching the active layout coordinates>",
  "art_style_recommendation": "<one of: tech_angles, waves, ribbons, minimal_arcs, origami_folds, cyber_mesh>"
}

RULES:
- ONLY return raw valid JSON.
- Every generation MUST be structurally fresh and uniquely crafted.
`;

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: `Design request: "${userPrompt}". Random variation token: [${randomSeed}]` }
        ]
      }
    ],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };

  const parsedData = await queryGeminiModels(requestPayload, apiKey);

  if (parsedData.custom_header_svg) {
    parsedData.custom_header_svg = sanitizeSvgSnippet(parsedData.custom_header_svg);
  }
  if (parsedData.custom_footer_svg) {
    parsedData.custom_footer_svg = sanitizeSvgSnippet(parsedData.custom_footer_svg);
  }

  const finalSpec = deepMerge(currentSpec, parsedData);

  if (options.keepCurrentLayout) {
    finalSpec.layout = activeLayout;
    finalSpec.meta = finalSpec.meta || {};
    finalSpec.meta.layout_style = activeLayout;
  } else if (parsedData.meta?.layout_style) {
    finalSpec.layout = parsedData.meta.layout_style;
  }

  const recommendedStyle = parsedData.art_style_recommendation || 'random';
  const preset = createArtworkPreset(recommendedStyle);
  finalSpec.art_preset = preset;

  if (finalSpec.layout !== 'top_wave' && finalSpec.layout !== 'diagonal_corner' && finalSpec.layout !== 'diagonal_inverse') {
    delete finalSpec.custom_header_svg;
    delete finalSpec.custom_footer_svg;
  }

  return finalSpec;
}

/**
 * Regenerate Header & Footer Artwork ONLY (Preserves 100% of colors, typography and letter text)
 */
export async function generateHeaderFooterOnly(userPrompt, apiKey = getStoredApiKey()) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API Key is missing. Please enter your API Key.');
  }

  const currentSpec = JSON.parse(JSON.stringify(store.getSpec()));
  const existingNeutral = currentSpec.palette?.neutral_shape || '#E2E8F0';

  const randomVarieties = [
    "Dynamic layered sharp angled chevron polygon cuts",
    "Flowing multi-curved asymmetric organic bezier waves",
    "Minimalist Bauhaus dual intersecting arcs with bold accents",
    "Origami 3D folded geometry with steep diagonal edges",
    "Silky flowing layered ribbon swooshes",
    "Futuristic stepped cyber matrix with laser accents",
    "Dual-angle diagonal blade cuts with accent trims"
  ];
  const chosenStyle = randomVarieties[Math.floor(Math.random() * randomVarieties.length)];
  const randomSeed = Math.floor(Math.random() * 1000000);

  const systemInstruction = `
You are a Vector Art Specialist for Corporate Letterheads (Canvas: W=817.7, H=1146.5).
Your mission is to generate a COMPLETELY UNIQUE, NEVER-SEEN-BEFORE vector Header and Footer artwork.
IMPORTANT: Do NOT change brand colors or text. The letterhead uses predefined SVG gradients 'url(#gradPrimary)' and 'url(#gradAccent)'.

RANDOM VARIATION INSTRUCTION (Seed #${randomSeed}):
- Theme Archetype: ${chosenStyle}
- Ensure path coordinates are distinct, inventive, and visually striking.

STRICT COORDINATE & VECTOR RULES:
1. "custom_header_svg": MUST start at top (0,0) to (817.7,0) and stay strictly within Y=0 to Y=175. Generate 2-3 layered SVG <path> elements with fill='url(#gradPrimary)', fill='url(#gradAccent)', and fill='${existingNeutral}'.
2. "custom_footer_svg": MUST start at bottom (0,1146.5) to (817.7,1146.5) and stay strictly within Y=1010 to Y=1146.5. Generate 2-3 layered SVG <path> elements with fill='url(#gradPrimary)' and fill='url(#gradAccent)'.
3. All paths must be closed with 'Z'.
4. NEVER output paths in the middle content area (Y: 200 to 1000).

Return ONLY this JSON schema:
{
  "custom_header_svg": "<2-3 layered SVG path elements inside Y: 0 to 175>",
  "custom_footer_svg": "<2-3 layered SVG path elements inside Y: 1010 to 1146.5>",
  "art_style_recommendation": "<one of: tech_angles, waves, ribbons, minimal_arcs, origami_folds, cyber_mesh>"
}
`;

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: `Header & Footer shape request: "${userPrompt}". Target Style: ${chosenStyle}. Seed: ${randomSeed}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  };

  const parsedData = await queryGeminiModels(requestPayload, apiKey);

  if (parsedData.custom_header_svg) {
    currentSpec.custom_header_svg = sanitizeSvgSnippet(parsedData.custom_header_svg);
  }
  if (parsedData.custom_footer_svg) {
    currentSpec.custom_footer_svg = sanitizeSvgSnippet(parsedData.custom_footer_svg);
  }

  const recommendedStyle = parsedData.art_style_recommendation || 'random';
  generateNewArtwork(recommendedStyle);

  return currentSpec;
}

/**
 * Generate 4 Distinct Design Variants simultaneously (4-Board Mode)
 */
export async function generate4DesignVariants(userPrompt, apiKey = getStoredApiKey()) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API Key is missing. Please enter your API Key.');
  }

  const baseSpec = JSON.parse(JSON.stringify(store.getSpec()));
  const activeLayout = baseSpec.meta?.layout_style || (typeof baseSpec.layout === 'string' ? baseSpec.layout : 'top_wave');
  const existingNeutral = baseSpec.palette?.neutral_shape || '#E2E8F0';
  const randomSeed = Math.floor(Math.random() * 1000000);

  let layoutCoordInstruction4 = "";
  if (activeLayout === 'diagonal_corner') {
    layoutCoordInstruction4 = `
COORDINATE RULES FOR DIAGONAL CORNER:
- "custom_header_svg": TOP-RIGHT corner artwork (X: 320..817.7, Y: 0..240). Must begin at Y=0 and X=817.7.
- "custom_footer_svg": BOTTOM-LEFT corner artwork (X: 0..500, Y: 900..1146.5). Must begin at Y=1146.5 and X=0.
Provide 4 completely different geometric concepts (e.g. sharp polygonal cuts, undulating multi-swoosh waves, bold circular Bauhaus arcs, multi-layered origami blades).`;
  } else if (activeLayout === 'diagonal_inverse') {
    layoutCoordInstruction4 = `
COORDINATE RULES FOR INVERSE DIAGONAL:
- "custom_header_svg": TOP-LEFT corner artwork (X: 0..500, Y: 0..240). Must begin at Y=0 and X=0.
- "custom_footer_svg": BOTTOM-RIGHT corner artwork (X: 320..817.7, Y: 900..1146.5). Must begin at Y=1146.5 and X=817.7.
Provide 4 completely different geometric concepts.`;
  } else {
    layoutCoordInstruction4 = `
COORDINATE RULES:
- "custom_header_svg": Full-width top header (Y: 0..175).
- "custom_footer_svg": Full-width bottom footer (Y: 1010..1146.5).`;
  }

  const systemInstruction = `
You are a Vector Art and Color Palette Specialist for Corporate Letterheads (Canvas: W=817.7, H=1146.5).
The current letterhead layout is: "${activeLayout}".
Your mission is to return 4 DISTINCTLY DIFFERENT design, color theme, and vector art style variants for the 4-Board Preview.
Keep the existing company details and body text intact.

Archetypes for the 4 variants:
- Variant 1: "Tech Polygonal Cuts" (Cybernetic sharp angled geometric slices, tech gradient)
- Variant 2: "Organic Flowing Waves" (Multi-layered smooth undulating curves, fluid gradient)
- Variant 3: "Minimalist Bauhaus Arcs" (Bold geometric curves and modern lines, contrasting gradient)
- Variant 4: "Sharp Diagonal Blades" (Steep dynamic diagonal wedges and chevron notches, bold gradient)

${layoutCoordInstruction4}
- Layer 2-3 paths per header/footer with fill='url(#gradPrimary)' and fill='url(#gradAccent)'.
- All paths closed with 'Z'. NEVER intersect middle content area (Y: 240 to 900).

Return ONLY this JSON format:
{
  "variants": [
    {
      "id": 1,
      "title": "Tech Polygonal",
      "style": "tech_angles",
      "palette": {
        "gradient_primary": ["#HEX1", "#HEX2"],
        "gradient_accent": ["#HEX3", "#HEX4"]
      },
      "custom_header_svg": "<2-3 layered SVG path elements>",
      "custom_footer_svg": "<2-3 layered SVG path elements>"
    },
    {
      "id": 2,
      "title": "Organic Waves",
      "style": "waves",
      "palette": {
        "gradient_primary": ["#HEX1", "#HEX2"],
        "gradient_accent": ["#HEX3", "#HEX4"]
      },
      "custom_header_svg": "<2-3 layered SVG path elements>",
      "custom_footer_svg": "<2-3 layered SVG path elements>"
    },
    {
      "id": 3,
      "title": "Bauhaus Arcs",
      "style": "bauhaus_arcs",
      "palette": {
        "gradient_primary": ["#HEX1", "#HEX2"],
        "gradient_accent": ["#HEX3", "#HEX4"]
      },
      "custom_header_svg": "<2-3 layered SVG path elements>",
      "custom_footer_svg": "<2-3 layered SVG path elements>"
    },
    {
      "id": 4,
      "title": "Diagonal Blade",
      "style": "diagonal_slash",
      "palette": {
        "gradient_primary": ["#HEX1", "#HEX2"],
        "gradient_accent": ["#HEX3", "#HEX4"]
      },
      "custom_header_svg": "<2-3 layered SVG path elements>",
      "custom_footer_svg": "<2-3 layered SVG path elements>"
    }
  ]
}
`;

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: `4-Board design request for layout '${activeLayout}': "${userPrompt}". Seed: ${randomSeed}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };

  const parsedData = await queryGeminiModels(requestPayload, apiKey);
  const rawVariants = parsedData.variants || [];

  const fourSpecs = rawVariants.slice(0, 4).map((v, idx) => {
    const specCopy = JSON.parse(JSON.stringify(baseSpec));
    const variantStyle = v.style || (idx === 0 ? 'tech_angles' : idx === 1 ? 'waves' : idx === 2 ? 'bauhaus_arcs' : 'diagonal_slash');
    const preset = createArtworkPreset(variantStyle);
    
    if (v.palette?.gradient_primary && v.palette?.gradient_accent) {
      specCopy.palette = specCopy.palette || {};
      specCopy.palette.gradient_primary = v.palette.gradient_primary;
      specCopy.palette.gradient_accent = v.palette.gradient_accent;
    }

    if (activeLayout === 'top_wave' || activeLayout === 'diagonal_corner' || activeLayout === 'diagonal_inverse') {
      if (v.custom_header_svg) {
        specCopy.custom_header_svg = sanitizeSvgSnippet(v.custom_header_svg);
      }
      if (v.custom_footer_svg) {
        specCopy.custom_footer_svg = sanitizeSvgSnippet(v.custom_footer_svg);
      }
    } else {
      delete specCopy.custom_header_svg;
      delete specCopy.custom_footer_svg;
    }

    specCopy.layout = activeLayout;
    specCopy.meta = specCopy.meta || {};
    specCopy.meta.layout_style = activeLayout;

    specCopy._variantTitle = v.title || `Variant ${idx + 1}`;
    specCopy._variantStyle = variantStyle;
    specCopy._artPreset = preset;
    return specCopy;
  });

  // If AI returned fewer than 4, fill remaining with procedural
  if (fourSpecs.length < 4) {
    const fallbackList = generate4ProceduralVariants(baseSpec);
    while (fourSpecs.length < 4) {
      fourSpecs.push(fallbackList[fourSpecs.length]);
    }
  }

  return fourSpecs;
}

/**
 * Instant 4-Board Procedural Generation (Works in 0.05 seconds offline)
 */
export function generate4ProceduralVariants(baseSpec = store.getSpec()) {
  const currentLayout = baseSpec.meta?.layout_style || (typeof baseSpec.layout === 'string' ? baseSpec.layout : 'top_wave');
  
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  let variantDefs = [];
  if (currentLayout === 'diagonal_corner') {
    const tX1 = rand(410, 520), tY1 = rand(150, 210), bX1 = rand(360, 470), bY1 = rand(150, 210);
    const bx1 = rand(360, 480), bx2 = rand(260, 360), bx3 = rand(150, 240);
    const by1 = rand(180, 240), by2 = rand(120, 180), by3 = rand(70, 120);
    const stepW = rand(340, 440), stepH = rand(160, 220), step = rand(45, 65);
    const arcR = rand(280, 370);

    variantDefs = [
      {
        title: "Fluid Wave Swoosh",
        style: "waves",
        badge: "cyber_circles",
        watermark: "tech_rings",
        custom_header_svg: `
          <path d="M ${817.7 - tX1} 0 C ${817.7 - tX1 * 0.7} ${tY1 * 0.35}, ${817.7 - 100} ${tY1 * 0.15}, 817.7 ${tY1} L 817.7 0 Z" fill="url(#gradPrimary)" />
          <path d="M ${817.7 - tX1 * 0.75} 0 C ${817.7 - tX1 * 0.45} ${tY1 * 0.4}, ${817.7 - 60} ${tY1 * 0.2}, 817.7 ${tY1 * 0.75} L 817.7 0 Z" fill="url(#gradAccent)" opacity="0.85" />
          <path d="M ${817.7 - tX1 * 0.45} 0 C ${817.7 - 80} 30, ${817.7 - 30} 15, 817.7 ${tY1 * 0.45} L 817.7 0 Z" fill="${baseSpec.palette?.neutral_shape || '#E2E8F0'}" opacity="0.4" />
        `,
        custom_footer_svg: `
          <path d="M 0 ${1146.5 - bY1} C ${bX1 * 0.3} ${1146.5 - bY1 * 0.15}, ${bX1 * 0.7} ${1146.5 - bY1 * 0.35}, ${bX1} 1146.5 L 0 1146.5 Z" fill="url(#gradPrimary)" />
          <path d="M 0 ${1146.5 - bY1 * 0.75} C ${bX1 * 0.2} ${1146.5 - bY1 * 0.2}, ${bX1 * 0.45} ${1146.5 - bY1 * 0.4}, ${bX1 * 0.75} 1146.5 L 0 1146.5 Z" fill="url(#gradAccent)" opacity="0.85" />
        `
      },
      {
        title: "Origami Blade Slices",
        style: "diagonal_slash",
        badge: "quantum_star",
        watermark: "diamond_crest",
        custom_header_svg: `
          <polygon points="${817.7 - bx1},0 817.7,0 817.7,${by1} ${817.7 - bx2},0" fill="url(#gradAccent)" opacity="0.4" />
          <polygon points="${817.7 - bx2},0 817.7,0 817.7,${by2}" fill="url(#gradPrimary)" />
          <polygon points="${817.7 - bx3},0 817.7,0 817.7,${by3}" fill="url(#gradAccent)" />
        `,
        custom_footer_svg: `
          <polygon points="0,${1146.5 - by1} 0,1146.5 ${bx1},1146.5" fill="url(#gradAccent)" opacity="0.3" />
          <polygon points="0,${1146.5 - by2} 0,1146.5 ${bx2},1146.5" fill="url(#gradPrimary)" />
          <polygon points="0,${1146.5 - by3} 0,1146.5 ${bx3},1146.5" fill="url(#gradAccent)" />
        `
      },
      {
        title: "Cyber Stepped Notch",
        style: "tech_angles",
        badge: "diamond",
        watermark: "shield_crest",
        custom_header_svg: `
          <path d="M ${817.7 - stepW} 0 L 817.7 0 L 817.7 ${stepH} L ${817.7 - 110} ${stepH} L ${817.7 - 110 - step} ${stepH - 50} L ${817.7 - 110 - step * 2} ${stepH - 50} L ${817.7 - stepW + step} ${step} L ${817.7 - stepW} 0 Z" fill="url(#gradPrimary)" />
          <path d="M ${817.7 - stepW * 0.8} 0 L 817.7 0 L 817.7 ${stepH * 0.75} L ${817.7 - 90} ${stepH * 0.75} L ${817.7 - 90 - step * 0.9} ${stepH * 0.75 - 40} L ${817.7 - 90 - step * 1.8} ${stepH * 0.75 - 40} L ${817.7 - stepW * 0.8 + step * 0.8} ${step * 0.8} L ${817.7 - stepW * 0.8} 0 Z" fill="url(#gradAccent)" opacity="0.85" />
        `,
        custom_footer_svg: `
          <path d="M 0 ${1146.5 - stepH} L 110 ${1146.5 - stepH} L ${110 + step} ${1146.5 - stepH + 50} L ${110 + step * 2} ${1146.5 - stepH + 50} L ${stepW - step} ${1146.5 - step} L ${stepW} 1146.5 L 0 1146.5 Z" fill="url(#gradPrimary)" />
          <path d="M 0 ${1146.5 - stepH * 0.75} L 90 ${1146.5 - stepH * 0.75} L ${90 + step * 0.9} ${1146.5 - stepH * 0.75 + 40} L ${90 + step * 1.8} ${1146.5 - stepH * 0.75 + 40} L ${stepW * 0.8 - step * 0.8} ${1146.5 - step * 0.8} L ${stepW * 0.8} 1146.5 L 0 1146.5 Z" fill="url(#gradAccent)" opacity="0.85" />
        `
      },
      {
        title: "Bauhaus Circular Arcs",
        style: "bauhaus_arcs",
        badge: "shield_badge",
        watermark: "monogram_circle",
        custom_header_svg: `
          <path d="M ${817.7 - arcR} 0 A ${arcR} ${arcR} 0 0 1 817.7 ${arcR} L 817.7 0 Z" fill="url(#gradPrimary)" />
          <path d="M ${817.7 - arcR * 0.72} 0 A ${arcR * 0.72} ${arcR * 0.72} 0 0 1 817.7 ${arcR * 0.72} L 817.7 0 Z" fill="url(#gradAccent)" opacity="0.9" />
          <circle cx="${817.7 - arcR * 0.55}" cy="${arcR * 0.55}" r="${rand(18, 26)}" fill="none" stroke="${baseSpec.palette?.gradient_accent?.[0] || '#38BDF8'}" stroke-width="2" stroke-dasharray="6 3" />
        `,
        custom_footer_svg: `
          <path d="M 0 ${1146.5 - arcR} A ${arcR} ${arcR} 0 0 1 ${arcR} 1146.5 L 0 1146.5 Z" fill="url(#gradPrimary)" />
          <path d="M 0 ${1146.5 - arcR * 0.72} A ${arcR * 0.72} ${arcR * 0.72} 0 0 1 ${arcR * 0.72} 1146.5 L 0 1146.5 Z" fill="url(#gradAccent)" opacity="0.9" />
          <circle cx="${arcR * 0.55}" cy="${1146.5 - arcR * 0.55}" r="${rand(18, 26)}" fill="none" stroke="${baseSpec.palette?.gradient_accent?.[0] || '#38BDF8'}" stroke-width="2" stroke-dasharray="6 3" />
        `
      }
    ];
  } else if (currentLayout === 'diagonal_inverse') {
    const tX1 = rand(410, 520), tY1 = rand(150, 210), bX1 = rand(360, 470), bY1 = rand(150, 210);
    const bx1 = rand(360, 480), bx2 = rand(260, 360), bx3 = rand(150, 240);
    const by1 = rand(180, 240), by2 = rand(120, 180), by3 = rand(70, 120);
    const stepW = rand(340, 440), stepH = rand(160, 220), step = rand(45, 65);
    const arcR = rand(280, 370);

    variantDefs = [
      {
        title: "Inverse Wave Swoosh",
        style: "waves",
        badge: "cyber_circles",
        watermark: "tech_rings",
        custom_header_svg: `
          <path d="M 0 ${tY1} C ${tX1 * 0.3} ${tY1 * 0.15}, ${tX1 * 0.7} ${tY1 * 0.35}, ${tX1} 0 L 0 0 Z" fill="url(#gradPrimary)" />
          <path d="M 0 ${tY1 * 0.75} C ${tX1 * 0.2} ${tY1 * 0.2}, ${tX1 * 0.45} ${tY1 * 0.4}, ${tX1 * 0.75} 0 L 0 0 Z" fill="url(#gradAccent)" opacity="0.85" />
        `,
        custom_footer_svg: `
          <path d="M ${817.7 - bX1} 1146.5 C ${817.7 - bX1 * 0.7} ${1146.5 - bY1 * 0.35}, ${817.7 - 100} ${1146.5 - bY1 * 0.15}, 817.7 ${1146.5 - bY1} L 817.7 1146.5 Z" fill="url(#gradPrimary)" />
          <path d="M ${817.7 - bX1 * 0.75} 1146.5 C ${817.7 - bX1 * 0.45} ${1146.5 - bY1 * 0.4}, ${817.7 - 60} ${1146.5 - bY1 * 0.2}, 817.7 ${1146.5 - bY1 * 0.75} L 817.7 1146.5 Z" fill="url(#gradAccent)" opacity="0.85" />
        `
      },
      {
        title: "Inverse Blade Slices",
        style: "diagonal_slash",
        badge: "quantum_star",
        watermark: "diamond_crest",
        custom_header_svg: `
          <polygon points="0,0 ${bx1},0 0,${by1}" fill="url(#gradAccent)" opacity="0.4" />
          <polygon points="0,0 ${bx2},0 0,${by2}" fill="url(#gradPrimary)" />
          <polygon points="0,0 ${bx3},0 0,${by3}" fill="url(#gradAccent)" />
        `,
        custom_footer_svg: `
          <polygon points="${817.7 - bx1},1146.5 817.7,${1146.5 - by1} 817.7,1146.5" fill="url(#gradAccent)" opacity="0.3" />
          <polygon points="${817.7 - bx2},1146.5 817.7,${1146.5 - by2} 817.7,1146.5" fill="url(#gradPrimary)" />
          <polygon points="${817.7 - bx3},1146.5 817.7,${1146.5 - by3} 817.7,1146.5" fill="url(#gradAccent)" />
        `
      },
      {
        title: "Inverse Cyber Notches",
        style: "tech_angles",
        badge: "diamond",
        watermark: "shield_crest",
        custom_header_svg: `
          <path d="M 0 0 L ${stepW} 0 L ${stepW - step} ${step} L ${110 + step * 2} ${stepH - 50} L ${110 + step} ${stepH - 50} L 110 ${stepH} L 0 ${stepH} Z" fill="url(#gradPrimary)" />
          <path d="M 0 0 L ${stepW * 0.8} 0 L ${stepW * 0.8 - step * 0.8} ${step * 0.8} L ${90 + step * 1.8} ${stepH * 0.75 - 40} L ${90 + step * 0.9} ${stepH * 0.75 - 40} L 90 ${stepH * 0.75} L 0 ${stepH * 0.75} Z" fill="url(#gradAccent)" opacity="0.85" />
        `,
        custom_footer_svg: `
          <path d="M ${817.7 - stepW} 1146.5 L ${817.7 - stepW + step} ${1146.5 - step} L ${817.7 - 110 - step * 2} ${1146.5 - stepH + 50} L ${817.7 - 110 - step} ${1146.5 - stepH + 50} L ${817.7 - 110} ${1146.5 - stepH} L 817.7 ${1146.5 - stepH} L 817.7 1146.5 Z" fill="url(#gradPrimary)" />
          <path d="M ${817.7 - stepW * 0.8} 1146.5 L ${817.7 - stepW * 0.8 + step * 0.8} ${1146.5 - step * 0.8} L ${817.7 - 90 - step * 1.8} ${1146.5 - stepH * 0.75 + 40} L ${817.7 - 90 - step * 0.9} ${1146.5 - stepH * 0.75 + 40} L ${817.7 - 90} ${1146.5 - stepH * 0.75} L 817.7 ${1146.5 - stepH * 0.75} L 817.7 1146.5 Z" fill="url(#gradAccent)" opacity="0.85" />
        `
      },
      {
        title: "Inverse Circular Arcs",
        style: "bauhaus_arcs",
        badge: "shield_badge",
        watermark: "monogram_circle",
        custom_header_svg: `
          <path d="M 0 ${arcR} A ${arcR} ${arcR} 0 0 1 ${arcR} 0 L 0 0 Z" fill="url(#gradPrimary)" />
          <path d="M 0 ${arcR * 0.72} A ${arcR * 0.72} ${arcR * 0.72} 0 0 1 ${arcR * 0.72} 0 L 0 0 Z" fill="url(#gradAccent)" opacity="0.9" />
          <circle cx="${arcR * 0.55}" cy="${arcR * 0.55}" r="${rand(18, 26)}" fill="none" stroke="${baseSpec.palette?.gradient_accent?.[0] || '#38BDF8'}" stroke-width="2" stroke-dasharray="6 3" />
        `,
        custom_footer_svg: `
          <path d="M 817.7 ${1146.5 - arcR} A ${arcR} ${arcR} 0 0 1 ${817.7 - arcR} 1146.5 L 817.7 1146.5 Z" fill="url(#gradPrimary)" />
          <path d="M 817.7 ${1146.5 - arcR * 0.72} A ${arcR * 0.72} ${arcR * 0.72} 0 0 1 ${817.7 - arcR * 0.72} 1146.5 L 817.7 1146.5 Z" fill="url(#gradAccent)" opacity="0.9" />
          <circle cx="${817.7 - arcR * 0.55}" cy="${1146.5 - arcR * 0.55}" r="${rand(18, 26)}" fill="none" stroke="${baseSpec.palette?.gradient_accent?.[0] || '#38BDF8'}" stroke-width="2" stroke-dasharray="6 3" />
        `
      }
    ];
  } else if (currentLayout === 'left_sidebar' || currentLayout === 'right_sidebar') {
    variantDefs = [
      {
        title: "Fluid Wave Contour",
        style: "waves",
        badge: "cyber_circles",
        watermark: "tech_rings",
        customOptions: { sidebar: { width: rand(195, 230), accentWidth: rand(8, 14), shapeType: "waves", watermarkY: rand(920, 1000) } }
      },
      {
        title: "Slanted Blade Cut",
        style: "diagonal_slash",
        badge: "quantum_star",
        watermark: "diamond_crest",
        customOptions: { sidebar: { width: rand(195, 225), accentWidth: rand(6, 12), shapeType: "diagonal_slash", watermarkY: rand(980, 1040) } }
      },
      {
        title: "Cyber Stepped Notch",
        style: "tech_angles",
        badge: "diamond",
        watermark: "shield_crest",
        customOptions: { sidebar: { width: rand(205, 240), accentWidth: rand(10, 16), shapeType: "tech_angles", watermarkY: rand(860, 940) } }
      },
      {
        title: "Bauhaus Arc Flare",
        style: "bauhaus_arcs",
        badge: "shield_badge",
        watermark: "monogram_circle",
        customOptions: { sidebar: { width: rand(200, 235), accentWidth: rand(7, 12), shapeType: "bauhaus_arcs", watermarkY: rand(940, 1020) } }
      }
    ];
  } else if (currentLayout === 'center_formal') {
    variantDefs = [
      { title: "Fluid Wave Trim", style: "waves", badge: "cyber_circles", watermark: "shield_crest" },
      { title: "Cyber Stepped Trim", style: "tech_angles", badge: "diamond", watermark: "tech_rings" },
      { title: "Bauhaus Arch Trim", style: "bauhaus_arcs", badge: "quad_cross", watermark: "monogram_circle" },
      { title: "Classic Executive Multi-Stripe", style: "diagonal_slash", badge: "shield_badge", watermark: "diamond_crest" }
    ];
  } else if (currentLayout === 'full_border_frame') {
    variantDefs = [
      { title: "Wave Rosette Frame", style: "waves", badge: "cyber_circles", watermark: "shield_crest" },
      { title: "Cyber Bracket Frame", style: "tech_angles", badge: "diamond", watermark: "tech_rings" },
      { title: "Bauhaus Circular Inset", style: "bauhaus_arcs", badge: "quad_cross", watermark: "monogram_circle" },
      { title: "Classic Dual-Stroke Frame", style: "diagonal_slash", badge: "shield_badge", watermark: "diamond_crest" }
    ];
  } else {
    // top_wave
    variantDefs = [
      { title: "Tech Polygonal Cuts", style: "tech_angles", badge: "diamond", watermark: "tech_rings" },
      { title: "Fluid Organic Waves", style: "waves", badge: "cyber_circles", watermark: "shield_crest" },
      { title: "Sharp Diagonal Blade", style: "diagonal_slash", badge: "quantum_star", watermark: "diamond_crest" },
      { title: "Bauhaus Modern Arcs", style: "bauhaus_arcs", badge: "quad_cross", watermark: "monogram_circle" }
    ];
  }

  return variantDefs.map((def, idx) => {
    const preset = createArtworkPreset(def.style, def.customOptions || {});
    if (def.badge) preset.badgeType = def.badge;
    if (def.watermark) preset.watermarkType = def.watermark;

    const specCopy = JSON.parse(JSON.stringify(baseSpec));
    
    if (def.custom_header_svg) {
      specCopy.custom_header_svg = def.custom_header_svg;
    } else {
      delete specCopy.custom_header_svg;
    }

    if (def.custom_footer_svg) {
      specCopy.custom_footer_svg = def.custom_footer_svg;
    } else {
      delete specCopy.custom_footer_svg;
    }

    specCopy.layout = currentLayout;
    specCopy.meta = specCopy.meta || {};
    specCopy.meta.layout_style = currentLayout;

    specCopy._variantTitle = def.title;
    specCopy._variantStyle = def.style;
    specCopy._artPreset = preset;
    return specCopy;
  });
}

