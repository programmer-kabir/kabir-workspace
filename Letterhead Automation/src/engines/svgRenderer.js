import { activeArtPreset, renderTechBadge, renderProceduralWatermark, renderMicroAccents, renderDotMatrix } from './artworkGenerator.js';
import { wrapTextToLines } from './textWrapper.js';

export function generateVectorLetterheadSVG(spec, includeGuides = true) {
  const p = spec.palette;
  const s = spec.document_specs;
  const c = spec.content;
  const t = spec.typography;
  const font = t.font_family;
  const layoutStyle = spec.meta?.layout_style || (typeof spec.layout === 'string' ? spec.layout : 'top_wave');
  const pos = spec.positions || {};

  const getPos = (key, defX, defY) => {
    const custom = pos[key];
    return {
      x: custom && typeof custom.x === 'number' ? custom.x : defX,
      y: custom && typeof custom.y === 'number' ? custom.y : defY
    };
  };

  const vbWidth = 817.7;
  const vbHeight = 1146.5;

  let paragraphs = [];
  if (Array.isArray(c.body?.paragraphs)) {
    paragraphs = c.body.paragraphs;
  } else if (typeof c.body?.text === 'string') {
    paragraphs = [c.body.text];
  } else {
    paragraphs = [
      "We are pleased to submit our formal proposal for the comprehensive redesign of your brand identity and digital collateral system.",
      "Over the past decade, our multidisciplinary team has partnered with ambitious technology firms worldwide.",
      "Enclosed you will find the strategic framework, project milestones, and deliverables outlined in accordance with our initial consultation."
    ];
  }

  // ==========================================
  // LAYOUT 2: Left Sidebar / Vertical Column
  // ==========================================
  if (layoutStyle === 'left_sidebar') {
    const sb = activeArtPreset.sidebar || { width: 210, accentWidth: 8, watermarkY: 1050 };
    const sidebarWidth = sb.width;
    const contentX = sidebarWidth + 38;
    const bodyLines = [];
    let currentY = 0;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    paragraphs.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, 64);
      wrapped.forEach((line) => {
        bodyLines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += paragraphSpacing;
    });

    const bPos = getPos('branding', 36, 68);
    const cPos = getPos('contact', 36, 760);
    const dPos = getPos('date', 748, 72);
    const rPos = getPos('recipient', contentX, 130);
    const bodyPos = getPos('body', contentX, 320);
    const sigPos = getPos('signature', contentX, 880);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />
    ${renderProceduralWatermark(p, activeArtPreset.watermarkType)}

    <rect x="0" y="0" width="${sidebarWidth}" height="${vbHeight}" fill="url(#gradPrimary)" />
    <rect x="${sidebarWidth - sb.accentWidth}" y="0" width="${sb.accentWidth}" height="${vbHeight}" fill="url(#gradAccent)" opacity="0.9" />

    <g opacity="0.15">
      <circle cx="${sidebarWidth / 2}" cy="${sb.watermarkY}" r="140" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="8 6" />
      <circle cx="${sidebarWidth / 2}" cy="${sb.watermarkY}" r="90" fill="none" stroke="#FFFFFF" stroke-width="2" />
    </g>

    <!-- Sidebar Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="translate(${bPos.x}, ${bPos.y})" class="draggable-group">
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#gradAccent)" />
      <path d="M 24 10 L 38 18 L 38 32 L 24 40 L 10 32 L 10 18 Z" fill="none" stroke="#FFFFFF" stroke-width="2.2" />
      <circle cx="24" cy="25" r="4" fill="#FFFFFF" />

      <text x="0" y="80" font-family="${font}" font-size="${t.scale.brand_name.size - 4}" font-weight="800" fill="#FFFFFF" letter-spacing="1">
        ${c.company.name}
      </text>
      <text x="0" y="98" font-family="${font}" font-size="8.5" font-weight="600" fill="${p.gradient_accent[0]}" letter-spacing="2">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Sidebar Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="9" font-weight="700" fill="${p.gradient_accent[0]}" letter-spacing="1.5">CONTACT</text>
      <line x1="0" y1="8" x2="60" y2="8" stroke="${p.gradient_accent[0]}" stroke-width="1.5" />
      
      <text x="0" y="32" font-family="${font}" font-size="9" font-weight="600" fill="#FFFFFF">${(c.contact.phone && c.contact.phone[0]) || ''}</text>
      <text x="0" y="46" font-family="${font}" font-size="8.5" font-weight="400" fill="#CBD5E1">${(c.contact.phone && c.contact.phone[1]) || ''}</text>

      <text x="0" y="78" font-family="${font}" font-size="9" font-weight="600" fill="#FFFFFF">${c.contact.email || ''}</text>
      <text x="0" y="92" font-family="${font}" font-size="8.5" font-weight="400" fill="#CBD5E1">${c.contact.web || ''}</text>

      <text x="0" y="124" font-family="${font}" font-size="8.5" font-weight="500" fill="#CBD5E1">${(c.contact.address && c.contact.address[0]) || ''}</text>
      <text x="0" y="138" font-family="${font}" font-size="8.5" font-weight="400" fill="#94A3B8">${(c.contact.address && c.contact.address[1]) || ''}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="56" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>

      <text x="0" y="110" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">
        ${c.subject}
      </text>
      <rect x="0" y="118" width="48" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">
        ${c.salutation}
      </text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 4 36 Q 24 12 42 38 T 72 24 T 94 48 Q 112 8 126 34 Q 138 54 160 26" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="70" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="86" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
  }

  // ==========================================
  // LAYOUT 7: Right Sidebar / Right Brand Strip
  // ==========================================
  if (layoutStyle === 'right_sidebar') {
    const sb = activeArtPreset.sidebar || { width: 210, accentWidth: 8, watermarkY: 1050 };
    const sidebarWidth = sb.width;
    const sidebarX = vbWidth - sidebarWidth;
    const contentX = 68;
    const bodyLines = [];
    let currentY = 0;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    paragraphs.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, 64);
      wrapped.forEach((line) => {
        bodyLines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += paragraphSpacing;
    });

    const bPos = getPos('branding', sidebarX + 32, 68);
    const cPos = getPos('contact', sidebarX + 32, 760);
    const dPos = getPos('date', contentX, 72);
    const rPos = getPos('recipient', contentX, 130);
    const bodyPos = getPos('body', contentX, 320);
    const sigPos = getPos('signature', contentX, 880);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />
    ${renderProceduralWatermark(p, activeArtPreset.watermarkType)}

    <!-- Right Sidebar Full Bleed Strip -->
    <rect x="${sidebarX}" y="0" width="${sidebarWidth}" height="${vbHeight}" fill="url(#gradPrimary)" />
    <rect x="${sidebarX}" y="0" width="${sb.accentWidth}" height="${vbHeight}" fill="url(#gradAccent)" opacity="0.9" />

    <!-- Sidebar Logo & Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="translate(${bPos.x}, ${bPos.y})" class="draggable-group">
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#gradAccent)" />
      <path d="M 24 10 L 38 18 L 38 32 L 24 40 L 10 32 L 10 18 Z" fill="none" stroke="#FFFFFF" stroke-width="2.2" />
      <circle cx="24" cy="25" r="4" fill="#FFFFFF" />

      <text x="0" y="80" font-family="${font}" font-size="${t.scale.brand_name.size - 4}" font-weight="800" fill="#FFFFFF" letter-spacing="1">
        ${c.company.name}
      </text>
      <text x="0" y="98" font-family="${font}" font-size="8.5" font-weight="600" fill="${p.gradient_accent[0]}" letter-spacing="2">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Sidebar Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="9" font-weight="700" fill="${p.gradient_accent[0]}" letter-spacing="1.5">CONTACT</text>
      <line x1="0" y1="8" x2="60" y2="8" stroke="${p.gradient_accent[0]}" stroke-width="1.5" />
      
      <text x="0" y="32" font-family="${font}" font-size="9" font-weight="600" fill="#FFFFFF">${(c.contact.phone && c.contact.phone[0]) || ''}</text>
      <text x="0" y="46" font-family="${font}" font-size="8.5" font-weight="400" fill="#CBD5E1">${(c.contact.phone && c.contact.phone[1]) || ''}</text>

      <text x="0" y="78" font-family="${font}" font-size="9" font-weight="600" fill="#FFFFFF">${c.contact.email || ''}</text>
      <text x="0" y="92" font-family="${font}" font-size="8.5" font-weight="400" fill="#CBD5E1">${c.contact.web || ''}</text>

      <text x="0" y="124" font-family="${font}" font-size="8.5" font-weight="500" fill="#CBD5E1">${(c.contact.address && c.contact.address[0]) || ''}</text>
      <text x="0" y="138" font-family="${font}" font-size="8.5" font-weight="400" fill="#94A3B8">${(c.contact.address && c.contact.address[1]) || ''}</text>
    </g>

    <!-- Date on Left Top -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="56" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>

      <text x="0" y="110" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">
        ${c.subject}
      </text>
      <rect x="0" y="118" width="48" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">
        ${c.salutation}
      </text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 4 36 Q 24 12 42 38 T 72 24 T 94 48 Q 112 8 126 34 Q 138 54 160 26" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="70" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="86" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
  }

  // ==========================================
  // LAYOUT 3: Centered Formal / Executive Crest
  // ==========================================
  if (layoutStyle === 'center_formal') {
    const bodyLines = [];
    let currentY = 0;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    paragraphs.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, 86);
      wrapped.forEach((line) => {
        bodyLines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += paragraphSpacing;
    });

    const bPos = getPos('branding', vbWidth / 2, 52);
    const rPos = getPos('recipient', 68, 200);
    const dPos = getPos('date', 748, 200);
    const subPos = getPos('subject', 68, 305);
    const bodyPos = getPos('body', 68, 360);
    const sigPos = getPos('signature', 68, 880);
    const cPos = getPos('contact', vbWidth / 2, 1070);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />

    <rect x="0" y="0" width="${vbWidth}" height="8" fill="url(#gradPrimary)" />
    <rect x="0" y="8" width="${vbWidth}" height="3" fill="url(#gradAccent)" />
    <rect x="0" y="${vbHeight - 8}" width="${vbWidth}" height="8" fill="url(#gradPrimary)" />

    <!-- Centered Crest & Brand -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Executive Crest & Branding" transform="translate(${bPos.x}, ${bPos.y})" text-anchor="middle" class="draggable-group">
      <circle cx="0" cy="0" r="22" fill="url(#gradPrimary)" />
      <polygon points="0,-14 12,0 0,14 -12,0" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" />
      <circle cx="0" cy="0" r="3" fill="#FFFFFF" />

      <text x="0" y="44" font-family="${font}" font-size="${t.scale.brand_name.size}" font-weight="800" fill="${p.text_primary}" letter-spacing="2">
        ${c.company.name}
      </text>
      <text x="0" y="60" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_secondary}" letter-spacing="3">
        ${c.company.tagline.toUpperCase()}
      </text>

      <line x1="-300" y1="76" x2="300" y2="76" stroke="${p.divider}" stroke-width="1" />
      <line x1="-120" y1="78" x2="120" y2="78" stroke="${p.gradient_accent[1]}" stroke-width="1.8" />
    </g>

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="translate(${subPos.x}, ${subPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <line x1="0" y1="8" x2="48" y2="8" stroke="${p.gradient_accent[1]}" stroke-width="2" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" text-anchor="middle" class="draggable-group">
      <line x1="-340" y1="0" x2="340" y2="0" stroke="${p.divider}" stroke-width="1" />
      <text x="0" y="24" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_primary}">
        ${(c.contact.phone && c.contact.phone[0]) || ''}  •  ${c.contact.email || ''}  •  ${c.contact.web || ''}
      </text>
      <text x="0" y="40" font-family="${font}" font-size="8.5" font-weight="400" fill="${p.text_secondary}">
        ${(c.contact.address && c.contact.address.join(', ')) || ''}
      </text>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
  }

  // =======================================================
  // LAYOUT 4: Diagonal Corner Cuts (Top-Right & Bottom-Left)
  // =======================================================
  if (layoutStyle === 'diagonal_corner') {
    const diag = activeArtPreset.diag || {
      topX1: 480, topX2: 540, topX3: 640, topY1: 160, topY2: 120, topY3: 60,
      botX1: 320, botX2: 240, botX3: 130, botY1: 960, botY2: 1010, botY3: 1070
    };
    const bodyLines = [];
    let currentY = 0;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    paragraphs.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, 86);
      wrapped.forEach((line) => {
        bodyLines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += paragraphSpacing;
    });

    const bPos = getPos('branding', 68, 54);
    const rPos = getPos('recipient', 68, 180);
    const dPos = getPos('date', 748, 180);
    const subPos = getPos('subject', 68, 280);
    const bodyPos = getPos('body', 68, 336);
    const sigPos = getPos('signature', 68, 880);
    const cPos = getPos('contact', 748, 1020);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />
    ${renderProceduralWatermark(p, activeArtPreset.watermarkType)}

    <!-- Top-Right Diagonal Angular Slices -->
    <polygon points="${diag.topX1},0 ${vbWidth},0 ${vbWidth},${diag.topY1} ${diag.topX2},0" fill="url(#gradAccent)" opacity="0.4" />
    <polygon points="${diag.topX2},0 ${vbWidth},0 ${vbWidth},${diag.topY2}" fill="url(#gradPrimary)" />
    <polygon points="${diag.topX3},0 ${vbWidth},0 ${vbWidth},${diag.topY3}" fill="url(#gradAccent)" />
    ${renderDotMatrix(p, 680, 20, 3, 3)}

    <!-- Bottom-Left Coordinated Diagonal Cut -->
    <polygon points="0,${diag.botY1} 0,${vbHeight} ${diag.botX1},${vbHeight}" fill="url(#gradAccent)" opacity="0.3" />
    <polygon points="0,${diag.botY2} 0,${vbHeight} ${diag.botX2},${vbHeight}" fill="url(#gradPrimary)" />
    <polygon points="0,${diag.botY3} 0,${vbHeight} ${diag.botX3},${vbHeight}" fill="url(#gradAccent)" />

    <!-- Top Left Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="translate(${bPos.x}, ${bPos.y})" class="draggable-group">
      <rect x="0" y="0" width="46" height="46" rx="10" fill="url(#gradPrimary)" />
      <path d="M 23 8 L 37 16 L 37 31 L 23 38 L 9 31 L 9 16 Z" fill="none" stroke="url(#gradAccent)" stroke-width="2" />
      <circle cx="23" cy="23" r="3.5" fill="#FFFFFF" />

      <text x="60" y="26" font-family="${font}" font-size="${t.scale.brand_name.size}" font-weight="800" fill="${p.text_primary}">
        ${c.company.name}
      </text>
      <text x="61" y="42" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_secondary}" letter-spacing="2">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Recipient Details -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="translate(${subPos.x}, ${subPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <rect x="0" y="8" width="46" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Bottom Right Aligned Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" text-anchor="end" class="draggable-group">
      <line x1="-360" y1="0" x2="0" y2="0" stroke="${p.divider}" stroke-width="1" />
      <text x="0" y="24" font-family="${font}" font-size="9.5" font-weight="600" fill="${p.text_primary}">${(c.contact.phone && c.contact.phone[0]) || ''}  |  ${c.contact.email || ''}</text>
      <text x="0" y="40" font-family="${font}" font-size="9" font-weight="400" fill="${p.text_secondary}">${c.contact.web || ''}  |  ${(c.contact.address && c.contact.address.join(', ')) || ''}</text>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
  }

  // =======================================================
  // LAYOUT 6: Diagonal INVERSE (Top-Left & Bottom-Right Cuts)
  // =======================================================
  if (layoutStyle === 'diagonal_inverse') {
    const inv = activeArtPreset.inv || {
      topX1: 340, topX2: 260, topX3: 150, topY1: 160, topY2: 120, topY3: 60,
      botX1: 500, botX2: 580, botX3: 670, botY1: 960, botY2: 1010, botY3: 1070
    };
    const bodyLines = [];
    let currentY = 0;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    paragraphs.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, 86);
      wrapped.forEach((line) => {
        bodyLines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += paragraphSpacing;
    });

    const bPos = getPos('branding', 480, 54);
    const rPos = getPos('recipient', 68, 180);
    const dPos = getPos('date', 748, 180);
    const subPos = getPos('subject', 68, 280);
    const bodyPos = getPos('body', 68, 336);
    const sigPos = getPos('signature', 68, 880);
    const cPos = getPos('contact', 68, 1020);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />
    ${renderProceduralWatermark(p, activeArtPreset.watermarkType)}

    <!-- Top-Left Diagonal Angular Slices -->
    <polygon points="0,0 ${inv.topX1},0 0,${inv.topY1}" fill="url(#gradAccent)" opacity="0.4" />
    <polygon points="0,0 ${inv.topX2},0 0,${inv.topY2}" fill="url(#gradPrimary)" />
    <polygon points="0,0 ${inv.topX3},0 0,${inv.topY3}" fill="url(#gradAccent)" />
    ${renderDotMatrix(p, 40, 20, 3, 3)}

    <!-- Bottom-Right Coordinated Diagonal Cut -->
    <polygon points="${inv.botX1},${vbHeight} ${vbWidth},${inv.botY1} ${vbWidth},${vbHeight}" fill="url(#gradAccent)" opacity="0.3" />
    <polygon points="${inv.botX2},${vbHeight} ${vbWidth},${inv.botY2} ${vbWidth},${vbHeight}" fill="url(#gradPrimary)" />
    <polygon points="${inv.botX3},${vbHeight} ${vbWidth},${inv.botY3} ${vbWidth},${vbHeight}" fill="url(#gradAccent)" />

    <!-- Top Right Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="translate(${bPos.x}, ${bPos.y})" class="draggable-group">
      <text x="268" y="24" text-anchor="end" font-family="${font}" font-size="${t.scale.brand_name.size}" font-weight="800" fill="${p.text_primary}">
        ${c.company.name}
      </text>
      <text x="268" y="40" text-anchor="end" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_secondary}" letter-spacing="2">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Recipient Details on Left -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="translate(${subPos.x}, ${subPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <rect x="0" y="8" width="46" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Bottom Left Aligned Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" class="draggable-group">
      <line x1="0" y1="0" x2="360" y2="0" stroke="${p.divider}" stroke-width="1" />
      <text x="0" y="24" font-family="${font}" font-size="9.5" font-weight="600" fill="${p.text_primary}">${(c.contact.phone && c.contact.phone[0]) || ''}  |  ${c.contact.email || ''}</text>
      <text x="0" y="40" font-family="${font}" font-size="9" font-weight="400" fill="${p.text_secondary}">${c.contact.web || ''}  |  ${(c.contact.address && c.contact.address.join(', ')) || ''}</text>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
  }

  // =======================================================
  // LAYOUT 5: Full Border Frame & Official Seal Stamp
  // =======================================================
  if (layoutStyle === 'full_border_frame') {
    const bodyLines = [];
    let currentY = 0;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    paragraphs.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, 84);
      wrapped.forEach((line) => {
        bodyLines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += paragraphSpacing;
    });

    const bPos = getPos('branding', 68, 62);
    const dPos = getPos('date', 748, 76);
    const rPos = getPos('recipient', 68, 170);
    const subPos = getPos('subject', 68, 280);
    const bodyPos = getPos('body', 68, 340);
    const sigPos = getPos('signature', 68, 880);
    const badgePos = getPos('badge', 680, 890);
    const cPos = getPos('contact', vbWidth / 2, 1070);

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />

    <rect x="28" y="28" width="${vbWidth - 56}" height="${vbHeight - 56}" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="2.5" />
    <rect x="36" y="36" width="${vbWidth - 72}" height="${vbHeight - 72}" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="0.9" stroke-dasharray="8 4" />

    <g stroke="${p.gradient_accent[1]}" stroke-width="2" fill="none">
      <path d="M 22 44 L 22 22 L 44 22" />
      <circle cx="22" cy="22" r="3" fill="${p.gradient_primary[0]}" stroke="none" />
      <path d="M ${vbWidth - 44} 22 L ${vbWidth - 22} 22 L ${vbWidth - 22} 44" />
      <circle cx="${vbWidth - 22}" cy="22" r="3" fill="${p.gradient_primary[0]}" stroke="none" />
      <path d="M 22 ${vbHeight - 44} L 22 ${vbHeight - 22} L 44 ${vbHeight - 22}" />
      <circle cx="22" cy="${vbHeight - 22}" r="3" fill="${p.gradient_primary[0]}" stroke="none" />
      <path d="M ${vbWidth - 44} ${vbHeight - 22} L ${vbWidth - 22} ${vbHeight - 22} L ${vbWidth - 22} ${vbHeight - 44}" />
      <circle cx="${vbWidth - 22}" cy="${vbHeight - 22}" r="3" fill="${p.gradient_primary[0]}" stroke="none" />
    </g>

    <!-- Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="translate(${bPos.x}, ${bPos.y})" class="draggable-group">
      <polygon points="20,0 40,12 40,36 20,48 0,36 0,12" fill="url(#gradPrimary)" />
      <circle cx="20" cy="24" r="7" fill="${p.gradient_accent[0]}" />
      <circle cx="20" cy="24" r="3" fill="#FFFFFF" />

      <text x="54" y="24" font-family="${font}" font-size="${t.scale.brand_name.size}" font-weight="800" fill="${p.text_primary}" letter-spacing="1.5">
        ${c.company.name}
      </text>
      <text x="55" y="40" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_secondary}" letter-spacing="2">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <line x1="68" y1="128" x2="748" y2="128" stroke="${p.divider}" stroke-width="1.5" />

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="translate(${subPos.x}, ${subPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <line x1="0" y1="8" x2="52" y2="8" stroke="${p.gradient_accent[1]}" stroke-width="2" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Verified Seal -->
    <g id="Layer_Badge" data-draggable="badge" data-label="Verified Security Seal" transform="translate(${badgePos.x}, ${badgePos.y})" opacity="0.9" class="draggable-group">
      <circle cx="0" cy="0" r="42" fill="none" stroke="${p.gradient_accent[1]}" stroke-width="1.8" stroke-dasharray="4 2" />
      <circle cx="0" cy="0" r="36" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="1.2" />
      <polygon points="0,-16 13,-6 8,11 -8,11 -13,-6" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.5" />
      <text x="0" y="24" text-anchor="middle" font-family="${font}" font-size="6.5" font-weight="700" fill="${p.text_primary}" letter-spacing="1">VERIFIED</text>
    </g>

    <!-- Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" text-anchor="middle" class="draggable-group">
      <line x1="-320" y1="0" x2="320" y2="0" stroke="${p.divider}" stroke-width="1" />
      <text x="0" y="20" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_primary}">
        ${(c.contact.phone && c.contact.phone[0]) || ''}  •  ${c.contact.email || ''}  •  ${c.contact.web || ''}
      </text>
      <text x="0" y="36" font-family="${font}" font-size="8.5" font-weight="400" fill="${p.text_secondary}">
        ${(c.contact.address && c.contact.address.join(', ')) || ''}
      </text>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
  }

  // =======================================================
  // LAYOUT 1: DEFAULT - Modern Tech Wave (Header & Footer)
  // =======================================================
  const bodyLines = [];
  let currentY = 0;
  const lineHeight = t.scale.body.line_height || 17;
  const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

  paragraphs.forEach((pText) => {
    const wrapped = wrapTextToLines(pText, 86);
    wrapped.forEach((line) => {
      bodyLines.push({ text: line, y: currentY });
      currentY += lineHeight;
    });
    currentY += paragraphSpacing;
  });

  const bPos = getPos('branding', 68, 58);
  const badgePos = getPos('badge', activeArtPreset.badgePos.x, activeArtPreset.badgePos.y);
  const rPos = getPos('recipient', 68, 232);
  const dPos = getPos('date', 748, 232);
  const subPos = getPos('subject', 68, 338);
  const bodyPos = getPos('body', 68, 378);
  const sigPos = getPos('signature', 68, 880);
  const cPos = getPos('contact', 68, 990);

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="${p.gradient_primary[0]}" />
      <stop offset="100%" stop-color="${p.gradient_primary[1]}" />
    </linearGradient>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.gradient_accent[0]}" />
      <stop offset="100%" stop-color="${p.gradient_accent[1]}" />
    </linearGradient>
  </defs>
  <g id="Artwork_Root" clip-path="url(#BleedClip)">
    <g id="Layer_1_Background">
      <rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" fill="${p.background}" />
      ${renderProceduralWatermark(p, activeArtPreset.watermarkType)}
    </g>

    <g id="Layer_2_Header_Art">
      <path d="${activeArtPreset.headerPrimary}" fill="url(#gradPrimary)" />
      <path d="${activeArtPreset.headerAccent}" fill="url(#gradAccent)" opacity="0.85" />
      <path d="${activeArtPreset.headerNeutral}" fill="${p.neutral_shape}" opacity="0.45" />
      ${renderMicroAccents(p, activeArtPreset.type)}
    </g>

    <!-- Draggable Badge -->
    <g id="Layer_Badge" data-draggable="badge" data-label="Tech Accent Badge" transform="translate(0, 0)" class="draggable-group">
      ${renderTechBadge(p, badgePos, activeArtPreset.badgeType)}
    </g>

    <!-- Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="translate(${bPos.x}, ${bPos.y})" class="draggable-group">
      <rect x="0" y="0" width="44" height="44" rx="10" fill="url(#gradPrimary)" />
      <path d="M 22 7 L 36 15 L 36 30 L 22 38 L 8 30 L 8 15 Z" fill="none" stroke="url(#gradAccent)" stroke-width="2" />
      <circle cx="22" cy="22.5" r="3" fill="#FFFFFF" />

      <text x="56" y="26" font-family="${font}" font-size="${t.scale.brand_name.size}" font-weight="${t.scale.brand_name.weight}" letter-spacing="${t.scale.brand_name.letter_spacing}" fill="${p.text_primary}">
        ${c.company.name}
      </text>
      <text x="57" y="42" font-family="${font}" font-size="${t.scale.tagline.size}" font-weight="${t.scale.tagline.weight}" letter-spacing="${t.scale.tagline.letter_spacing}" fill="${p.text_secondary}">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="translate(${rPos.x}, ${rPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="${t.scale.label.weight}" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="${t.scale.recipient_name.weight}" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <g transform="translate(0, 56)">
        <text x="0" y="0" font-family="${font}" font-size="9" font-weight="700" fill="${p.gradient_accent[1]}">A :</text>
        <text x="18" y="0" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
        <text x="0" y="15" font-family="${font}" font-size="9" font-weight="700" fill="${p.gradient_accent[1]}">W :</text>
        <text x="18" y="15" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.email_web}</text>
        <text x="0" y="30" font-family="${font}" font-size="9" font-weight="700" fill="${p.gradient_accent[1]}">P :</text>
        <text x="18" y="30" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.phone}</text>
      </g>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="translate(${dPos.x}, ${dPos.y})" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">${c.date}</text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="translate(${subPos.x}, ${subPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <rect x="0" y="8" width="46" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="translate(${bodyPos.x}, ${bodyPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      <g>
        ${bodyLines.map(line => `
          <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
            ${line.text}
          </text>
        `).join('')}
      </g>
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="translate(${sigPos.x}, ${sigPos.y})" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 2 36 Q 16 12 34 38 T 64 24 T 86 48 Q 104 8 118 34 Q 130 54 152 26" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <path d="M 22 44 Q 72 46 130 40" fill="none" stroke="${p.text_primary}" stroke-width="1.2" stroke-linecap="round" />
      <text x="0" y="70" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="86" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Footer & Contact Stack -->
    <g id="Layer_7_Footer">
      <path d="${activeArtPreset.footerPrimary}" fill="url(#gradPrimary)" />
      <path d="${activeArtPreset.footerAccent}" fill="url(#gradAccent)" opacity="0.8" />
      <path d="${activeArtPreset.footerNeutral}" fill="${p.neutral_shape}" opacity="0.5" />

      <g id="Layer_7_Contact" data-draggable="contact" data-label="Footer Contact Stack" transform="translate(${cPos.x}, ${cPos.y})" class="draggable-group">
        <line x1="0" y1="0" x2="680" y2="0" stroke="${p.divider}" stroke-width="1" />
        <text x="648" y="16" text-anchor="end" font-family="${font}" font-size="${t.scale.footer.size}" font-weight="500" fill="${p.text_primary}">${(c.contact.phone && c.contact.phone[0]) || ''}</text>
        <text x="648" y="30" text-anchor="end" font-family="${font}" font-size="${t.scale.footer.size}" font-weight="400" fill="${p.text_secondary}">${(c.contact.phone && c.contact.phone[1]) || ''}</text>
        <rect x="658" y="12" width="22" height="22" rx="4" fill="${p.gradient_accent[1]}" />
        <path d="M 666 19 C 665.5 19 664 20.5 664 22 C 664 24.5 666 27 668.5 27 C 670 27 671.5 25.5 671.5 25 L 670 23.5 L 668.8 24.3 C 668 23.8 667.2 23 666.7 22.2 L 667.5 21 Z" fill="#FFFFFF" />

        <text x="648" y="52" text-anchor="end" font-family="${font}" font-size="${t.scale.footer.size}" font-weight="500" fill="${p.text_primary}">${c.contact.email || ''}</text>
        <text x="648" y="66" text-anchor="end" font-family="${font}" font-size="${t.scale.footer.size}" font-weight="400" fill="${p.text_secondary}">${c.contact.web || ''}</text>
        <rect x="658" y="48" width="22" height="22" rx="4" fill="${p.gradient_accent[1]}" />
        <circle cx="669" cy="59" r="5" fill="none" stroke="#FFFFFF" stroke-width="1.2" />
        <line x1="664" y1="59" x2="674" y2="59" stroke="#FFFFFF" stroke-width="1" />
        <ellipse cx="669" cy="59" rx="2.4" ry="5" fill="none" stroke="#FFFFFF" stroke-width="1" />

        <text x="648" y="88" text-anchor="end" font-family="${font}" font-size="${t.scale.footer.size}" font-weight="500" fill="${p.text_primary}">${(c.contact.address && c.contact.address[0]) || ''}</text>
        <text x="648" y="102" text-anchor="end" font-family="${font}" font-size="${t.scale.footer.size}" font-weight="400" fill="${p.text_secondary}">${(c.contact.address && c.contact.address[1]) || ''}</text>
        <rect x="658" y="84" width="22" height="22" rx="4" fill="${p.gradient_accent[1]}" />
        <path d="M 669 89 C 666.8 89 665 90.8 665 93 C 665 96 669 101 669 101 C 669 101 673 96 673 93 C 673 90.8 671.2 89 669 89 Z" fill="#FFFFFF" />
      </g>
    </g>

    ${includeGuides ? renderGuideOverlay(s, font) : ''}
  </g>
</svg>`;
}

function renderGuideOverlay(s, font) {
  return `
    <g id="Layer_8_Guides_Hidden" style="display: inline; pointer-events: none;">
      <rect x="0.5" y="0.5" width="816.7" height="1145.5" fill="none" stroke="#F43F5E" stroke-width="1.2" stroke-dasharray="6,4" />
      <text x="6" y="10" font-family="${font}" font-size="8" fill="#F43F5E" font-weight="700">BLEED EDGE (0,0 to 817.7, 1146.5)</text>

      <rect x="${s.trim_box.x}" y="${s.trim_box.y}" width="${s.trim_box.width}" height="${s.trim_box.height}" fill="none" stroke="#2563EB" stroke-width="1.2" />
      <text x="${s.trim_box.x + 4}" y="${s.trim_box.y + 10}" font-family="${font}" font-size="8" fill="#2563EB" font-weight="700">TRIM LINE (A4 CUT)</text>

      <rect x="${s.safe_area.x}" y="${s.safe_area.y}" width="${s.safe_area.width}" height="${s.safe_area.height}" fill="none" stroke="#10B981" stroke-width="1" stroke-dasharray="4,4" />
      <text x="${s.safe_area.x + 4}" y="${s.safe_area.y + 10}" font-family="${font}" font-size="8" fill="#10B981" font-weight="700">SAFE AREA BOUNDARY</text>

      <g stroke="#2563EB" stroke-width="0.8">
        <line x1="0" y1="12" x2="8" y2="12" />
        <line x1="12" y1="0" x2="12" y2="8" />
        <line x1="817.7" y1="12" x2="809.7" y2="12" />
        <line x1="805.7" y1="0" x2="805.7" y2="8" />
        <line x1="0" y1="1134.5" x2="8" y2="1134.5" />
        <line x1="12" y1="1146.5" x2="12" y2="1138.5" />
        <line x1="817.7" y1="1134.5" x2="809.7" y2="1134.5" />
        <line x1="805.7" y1="1146.5" x2="805.7" y2="1138.5" />
      </g>
    </g>
  `;
}
