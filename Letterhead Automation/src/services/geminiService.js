import { store } from '../state/store.js';
import { generateNewArtwork } from '../engines/artworkGenerator.js';

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

export async function generateDesignFromPrompt(userPrompt, apiKey = getStoredApiKey(), options = { keepCurrentLayout: true }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API Key is missing. Please enter your API Key.');
  }

  const currentSpec = JSON.parse(JSON.stringify(store.getSpec()));
  const activeLayout = currentSpec.meta?.layout_style || 'top_wave';

  const layoutInstruction = options.keepCurrentLayout
    ? `The user has explicitly chosen the layout '${activeLayout}'. You MUST set "layout_style": "${activeLayout}".`
    : `Choose the most fitting layout_style from: top_wave, left_sidebar, right_sidebar, center_formal, diagonal_corner, diagonal_inverse, full_border_frame.`;

  const systemInstruction = `
You are a world-class Corporate Brand Designer and Vector Graphic Engine.
Given a prompt or brand description, return a COMPLETE, VALID JSON object with tailored corporate identity, colors, typography, and professional letter content.

${layoutInstruction}

Return JSON matching this schema:
{
  "meta": {
    "asset_type": "Corporate Letterhead",
    "style": "<e.g. Modern Tech Slate, Cyber Cobalt, Luxury Emerald, Minimalist Swiss>",
    "mood": "<3-4 descriptive mood words, e.g. authoritative, sleek, futuristic>",
    "layout_style": "${options.keepCurrentLayout ? activeLayout : '<chosen layout>'}"
  },
  "design_theme": "<Theme & branding rationale summary>",
  "palette": {
    "gradient_primary": ["#HEX1", "#HEX2"],
    "gradient_accent": ["#HEX3", "#HEX4"],
    "background": "#FFFFFF",
    "text_primary": "#HEX (dark readable text)",
    "text_secondary": "#HEX (medium muted text)",
    "neutral_shape": "#HEX (light background shape)",
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
    "date": "<Formatted current or formal date>",
    "subject": "Subject: <Compelling Subject Line>",
    "salutation": "Dear <Name>,",
    "body": {
      "paragraphs": [
        "<Paragraph 1: Professional greeting and context for the industry/request>",
        "<Paragraph 2: Strategic value proposition, milestones, or core details>",
        "<Paragraph 3: Confident closing, deliverables, and next steps>"
      ]
    },
    "closing": "Sincerely,",
    "sender": {
      "name": "<Signer Full Name>",
      "title": "<Executive Designation / CEO / Director>"
    },
    "contact": {
      "phone": ["<Main Phone>", "<Alt Phone>"],
      "email": "<official@brand.com>",
      "web": "<www.branddomain.com>",
      "address": ["<Suite / Floor / Street>", "<City, State, Postal Code>"]
    }
  },
  "art_style_recommendation": "<one of: tech_angles, waves, ribbons, minimal_arcs>"
}

RULES:
1. ONLY return raw valid JSON. Do not include markdown codeblocks or unescaped strings.
2. Select high-end, premium hex color palettes tailored specifically to the prompt.
3. Keep body paragraphs concise, impactful, and realistic.
`;

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: `Design request: "${userPrompt}"` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };

  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
  let rawText = null;
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const result = await response.json();
        rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) break;
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

  // Parse JSON with robust sanitizer
  const parsedData = extractAndParseJson(rawText);

  // Merge with base spec structure to preserve full document specs & grid rules
  const finalSpec = deepMerge(currentSpec, parsedData);

  // If user requested to lock/keep current layout, strictly retain it
  if (options.keepCurrentLayout) {
    finalSpec.layout = activeLayout;
    finalSpec.meta = finalSpec.meta || {};
    finalSpec.meta.layout_style = activeLayout;
  } else if (parsedData.meta?.layout_style) {
    finalSpec.layout = parsedData.meta.layout_style;
  }

  // Trigger artwork generator with the recommended style
  const recommendedStyle = parsedData.art_style_recommendation || 'random';
  generateNewArtwork(recommendedStyle);

  return finalSpec;
}
