import { defaultArtPreset, activeArtPreset, renderTechBadge, renderProceduralWatermark, renderMicroAccents, renderDotMatrix } from './artworkGenerator.js';
import { wrapTextToLines } from './textWrapper.js';

export function escapeXml(val) {
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  if (Array.isArray(val)) {
    return val.map(escapeXml);
  }
  if (val !== null && typeof val === 'object') {
    const res = {};
    for (const k of Object.keys(val)) {
      res[k] = escapeXml(val[k]);
    }
    return res;
  }
  return val;
}

export function ensureXmlWellFormed(svgString) {
  if (typeof svgString !== 'string') return '';
  return svgString.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

export function generateVectorLetterheadSVG(spec, includeGuides = true) {
  const p = spec.palette || {};
  const s = spec.document_specs || {};
  const c = escapeXml(spec.content || {});
  const t = spec.typography || {};
  const font = t.font_family || "Inter, sans-serif";
  const layoutStyle = spec.meta?.layout_style || (typeof spec.layout === 'string' ? spec.layout : 'top_wave');
  const pos = spec.positions || {};
  const artRaw = spec._artPreset || spec.art_preset || activeArtPreset;
  const art = {
    ...defaultArtPreset,
    ...(artRaw || {})
  };
  if (!art.headerPrimary) art.headerPrimary = defaultArtPreset.headerPrimary;
  if (!art.headerAccent) art.headerAccent = defaultArtPreset.headerAccent;
  if (!art.headerNeutral) art.headerNeutral = defaultArtPreset.headerNeutral;
  if (!art.footerPrimary) art.footerPrimary = defaultArtPreset.footerPrimary;
  if (!art.footerAccent) art.footerAccent = defaultArtPreset.footerAccent;
  if (!art.footerNeutral) art.footerNeutral = defaultArtPreset.footerNeutral;

  const hiddenElements = Array.isArray(spec.hiddenElements) ? spec.hiddenElements : [];
  const isHidden = (key) => hiddenElements.includes(key);

  const getPos = (key, defX, defY, defW = null, defRot = 0, defScaleX = 1, defScaleY = 1) => {
    const custom = pos[key];
    return {
      x: custom && typeof custom.x === 'number' ? custom.x : defX,
      y: custom && typeof custom.y === 'number' ? custom.y : defY,
      width: custom && typeof custom.width === 'number' ? custom.width : defW,
      rotate: custom && typeof custom.rotate === 'number' ? custom.rotate : defRot,
      scaleX: custom && typeof custom.scaleX === 'number' ? custom.scaleX : defScaleX,
      scaleY: custom && typeof custom.scaleY === 'number' ? custom.scaleY : defScaleY,
      isDeleted: isHidden(key)
    };
  };

  const getTransform = (pObj) => {
    if (pObj.isDeleted) return 'scale(0) translate(-9999, -9999)';
    const rot = pObj.rotate || 0;
    const sx = typeof pObj.scaleX === 'number' ? pObj.scaleX : 1;
    const sy = typeof pObj.scaleY === 'number' ? pObj.scaleY : 1;
    let str = `translate(${pObj.x}, ${pObj.y})`;
    if (rot) str += ` rotate(${rot})`;
    if (sx !== 1 || sy !== 1) str += ` scale(${sx}, ${sy})`;
    return str;
  };

  const getDynamicWrapLines = (pList, startX, customW, fontSize = 10.5, lineHeight = 17, spacing = 14) => {
    // Default width spans across full document trim/bleed width (780 - startX) or customW
    const availableW = customW || Math.max(300, 780 - startX);
    const avgCharW = Math.max(4.0, (fontSize || 10.5) * 0.52);
    const maxChars = Math.max(30, Math.floor(availableW / avgCharW));

    const lines = [];
    let currentY = 0;
    pList.forEach((pText) => {
      const wrapped = wrapTextToLines(pText, maxChars);
      wrapped.forEach((line) => {
        lines.push({ text: line, y: currentY });
        currentY += lineHeight;
      });
      currentY += spacing;
    });
    return lines;
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
    const sb = art.sidebar || { width: 210, accentWidth: 8, watermarkY: 1050 };
    const sidebarWidth = sb.width;
    const contentX = sidebarWidth + 38;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    const sbArtPos = getPos('sidebar_art', 0, 0);
    const bPos = getPos('branding', 36, 68);
    const cPos = getPos('contact', 36, 760);
    const dPos = getPos('date', 748, 72);
    const rPos = getPos('recipient', contentX, 130);
    const bodyPos = getPos('body', contentX, 320, 748 - contentX);
    const sigPos = getPos('signature', contentX, 880);

    const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

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
    ${renderProceduralWatermark(p, art.watermarkType)}

    <!-- Draggable Sidebar Art -->
    <g id="Layer_Sidebar_Art" data-draggable="sidebar_art" data-label="Left Sidebar Graphic" transform="${getTransform(sbArtPos)}" class="draggable-group">
      ${renderSidebarGeometry(p, sb, 'left', sb.shapeType || art.type || 'waves', vbWidth, vbHeight)}

      <g opacity="0.15">
        <circle cx="${sidebarWidth / 2}" cy="${sb.watermarkY || 1050}" r="140" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="8 6" />
        <circle cx="${sidebarWidth / 2}" cy="${sb.watermarkY || 1050}" r="90" fill="none" stroke="#FFFFFF" stroke-width="2" />
      </g>
    </g>

    <!-- Sidebar Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="${getTransform(bPos)}" class="draggable-group">
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
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="${getTransform(cPos)}" class="draggable-group">
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
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
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
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
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
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
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
    const sb = art.sidebar || { width: 210, accentWidth: 8, watermarkY: 1050 };
    const sidebarWidth = sb.width;
    const sidebarX = vbWidth - sidebarWidth;
    const contentX = 68;
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    const sbArtPos = getPos('sidebar_art', 0, 0);
    const bPos = getPos('branding', sidebarX + 32, 68);
    const cPos = getPos('contact', sidebarX + 32, 760);
    const dPos = getPos('date', contentX, 72);
    const rPos = getPos('recipient', contentX, 130);
    const bodyPos = getPos('body', contentX, 320, sidebarX - 40 - contentX);
    const sigPos = getPos('signature', contentX, 880);

    const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

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
    ${renderProceduralWatermark(p, art.watermarkType)}

    <!-- Draggable Sidebar Art -->
    <g id="Layer_Sidebar_Art" data-draggable="sidebar_art" data-label="Right Sidebar Graphic" transform="${getTransform(sbArtPos)}" class="draggable-group">
      ${renderSidebarGeometry(p, sb, 'right', sb.shapeType || art.type || 'waves', vbWidth, vbHeight)}
    </g>

    <!-- Sidebar Logo & Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="${getTransform(bPos)}" class="draggable-group">
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
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="${getTransform(cPos)}" class="draggable-group">
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
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
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
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
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
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
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
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    const hArtPos = getPos('header_art', 0, 0);
    const bPos = getPos('branding', vbWidth / 2, 52);
    const rPos = getPos('recipient', 68, 200);
    const dPos = getPos('date', 748, 200);
    const subPos = getPos('subject', 68, 305);
    const bodyPos = getPos('body', 68, 360, 680);
    const sigPos = getPos('signature', 68, 880);
    const cPos = getPos('contact', vbWidth / 2, 1070);

    const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

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
    ${renderProceduralWatermark(p, art.watermarkType)}

    <!-- Draggable Header / Trim Art -->
    <g id="Layer_2_Header_Art" data-draggable="header_art" data-label="Formal Top/Bottom Trim" transform="${getTransform(hArtPos)}" class="draggable-group">
      ${renderCenterFormalHeader(p, vbWidth, vbHeight, art.type || 'waves')}
    </g>

    <!-- Centered Crest & Brand -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Executive Crest & Branding" transform="${getTransform(bPos)}" text-anchor="middle" class="draggable-group">
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
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="${getTransform(subPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <line x1="0" y1="8" x2="48" y2="8" stroke="${p.gradient_accent[1]}" stroke-width="2" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="${getTransform(cPos)}" text-anchor="middle" class="draggable-group">
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
    const diag = art.diag || {
      topX1: 480, topX2: 540, topX3: 640, topY1: 160, topY2: 120, topY3: 60,
      botX1: 320, botX2: 240, botX3: 130, botY1: 960, botY2: 1010, botY3: 1070
    };
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    const hArtPos = getPos('header_art', 0, 0);
    const fArtPos = getPos('footer_art', 0, 0);
    const bPos = getPos('branding', 68, 54);
    const rPos = getPos('recipient', 68, 180);
    const dPos = getPos('date', 748, 180);
    const subPos = getPos('subject', 68, 280);
    const bodyPos = getPos('body', 68, 336, 680);
    const sigPos = getPos('signature', 68, 880);
    const cPos = getPos('contact', 748, 1020);

    const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

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
    ${renderProceduralWatermark(p, art.watermarkType)}

    <!-- Top-Right Corner Vector Graphic -->
    <g id="Layer_2_Header_Art" data-draggable="header_art" data-label="Top-Right Corner Graphic" transform="${getTransform(hArtPos)}" class="draggable-group">
      ${spec.custom_header_svg ? spec.custom_header_svg : renderDiagonalCornerGeometry(p, diag, diag.shapeType || art.type || 'waves', false, vbWidth, vbHeight, 'header')}
    </g>

    <!-- Bottom-Left Corner Vector Graphic -->
    <g id="Layer_7_Footer_Art" data-draggable="footer_art" data-label="Bottom-Left Corner Graphic" transform="${getTransform(fArtPos)}" class="draggable-group">
      ${spec.custom_footer_svg ? spec.custom_footer_svg : renderDiagonalCornerGeometry(p, diag, diag.shapeType || art.type || 'waves', false, vbWidth, vbHeight, 'footer')}
    </g>

    <!-- Top Left Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="${getTransform(bPos)}" class="draggable-group">
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
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="${getTransform(subPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <rect x="0" y="8" width="46" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Bottom Right Aligned Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="${getTransform(cPos)}" text-anchor="end" class="draggable-group">
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
    const inv = art.inv || {
      topX1: 340, topX2: 260, topX3: 150, topY1: 160, topY2: 120, topY3: 60,
      botX1: 500, botX2: 580, botX3: 670, botY1: 960, botY2: 1010, botY3: 1070
    };
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    const hArtPos = getPos('header_art', 0, 0);
    const fArtPos = getPos('footer_art', 0, 0);
    const bPos = getPos('branding', 480, 54);
    const rPos = getPos('recipient', 68, 180);
    const dPos = getPos('date', 748, 180);
    const subPos = getPos('subject', 68, 280);
    const bodyPos = getPos('body', 68, 336, 680);
    const sigPos = getPos('signature', 68, 880);
    const cPos = getPos('contact', 68, 1020);

    const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

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
    ${renderProceduralWatermark(p, art.watermarkType)}

    <!-- Top-Left Corner Vector Graphic -->
    <g id="Layer_2_Header_Art" data-draggable="header_art" data-label="Top-Left Corner Graphic" transform="${getTransform(hArtPos)}" class="draggable-group">
      ${spec.custom_header_svg ? spec.custom_header_svg : renderDiagonalCornerGeometry(p, inv, inv.shapeType || art.type || 'waves', true, vbWidth, vbHeight, 'header')}
    </g>

    <!-- Bottom-Right Corner Vector Graphic -->
    <g id="Layer_7_Footer_Art" data-draggable="footer_art" data-label="Bottom-Right Corner Graphic" transform="${getTransform(fArtPos)}" class="draggable-group">
      ${spec.custom_footer_svg ? spec.custom_footer_svg : renderDiagonalCornerGeometry(p, inv, inv.shapeType || art.type || 'waves', true, vbWidth, vbHeight, 'footer')}
    </g>

    <!-- Top Right Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="${getTransform(bPos)}" class="draggable-group">
      <text x="268" y="24" text-anchor="end" font-family="${font}" font-size="${t.scale.brand_name.size}" font-weight="800" fill="${p.text_primary}">
        ${c.company.name}
      </text>
      <text x="268" y="40" text-anchor="end" font-family="${font}" font-size="9" font-weight="600" fill="${p.text_secondary}" letter-spacing="2">
        ${c.company.tagline.toUpperCase()}
      </text>
    </g>

    <!-- Recipient Details on Left -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Date -->
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="${getTransform(subPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <rect x="0" y="8" width="46" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Bottom Left Aligned Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="${getTransform(cPos)}" class="draggable-group">
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
    const lineHeight = t.scale.body.line_height || 17;
    const paragraphSpacing = t.scale.body.paragraph_spacing || 14;

    const frameArtPos = getPos('frame_art', 0, 0);
    const bPos = getPos('branding', 68, 62);
    const dPos = getPos('date', 748, 76);
    const rPos = getPos('recipient', 68, 170);
    const subPos = getPos('subject', 68, 280);
    const bodyPos = getPos('body', 68, 340, 680);
    const sigPos = getPos('signature', 68, 880);
    const badgePos = getPos('badge', 680, 890);
    const cPos = getPos('contact', vbWidth / 2, 1070);

    const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

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
    ${renderProceduralWatermark(p, art.watermarkType)}

    <!-- Draggable Frame Borders -->
    <g id="Layer_Frame_Art" data-draggable="frame_art" data-label="Border Frame & Seals" transform="${getTransform(frameArtPos)}" class="draggable-group">
      ${renderFrameBorders(p, vbWidth, vbHeight, art.type || 'waves')}
    </g>

    <!-- Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="${getTransform(bPos)}" class="draggable-group">
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
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">
        ${c.date}
      </text>
    </g>

    <line x1="68" y1="128" x2="748" y2="128" stroke="${p.divider}" stroke-width="1.5" />

    <!-- Recipient Meta -->
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.label.size}" font-weight="600" fill="${p.text_secondary}">${c.recipient.label}</text>
      <text x="0" y="22" font-family="${font}" font-size="${t.scale.recipient_name.size}" font-weight="700" fill="${p.gradient_accent[1]}">${c.recipient.name}</text>
      <text x="0" y="39" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_primary}">${c.recipient.title}</text>
      <text x="0" y="54" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="400" fill="${p.text_secondary}">${c.recipient.address}</text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="${getTransform(subPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <line x1="0" y1="8" x2="52" y2="8" stroke="${p.gradient_accent[1]}" stroke-width="2" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.body.size + 0.5}" font-weight="600" fill="${p.text_primary}">${c.salutation}</text>
      ${bodyLines.map(line => `
        <text x="0" y="${line.y + 24}" font-family="${font}" font-size="${t.scale.body.size}" font-weight="${t.scale.body.weight}" fill="${p.text_secondary}">
          ${line.text}
        </text>
      `).join('')}
    </g>

    <!-- Sign-off -->
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 0 32 Q 18 10 36 34 T 66 20 T 88 44 Q 106 6 120 30 Q 132 50 154 22" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <text x="0" y="66" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="82" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Verified Seal -->
    <g id="Layer_Badge" data-draggable="badge" data-label="Verified Security Seal" transform="${getTransform(badgePos)}" opacity="0.9" class="draggable-group">
      <circle cx="0" cy="0" r="42" fill="none" stroke="${p.gradient_accent[1]}" stroke-width="1.8" stroke-dasharray="4 2" />
      <circle cx="0" cy="0" r="36" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="1.2" />
      <polygon points="0,-16 13,-6 8,11 -8,11 -13,-6" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.5" />
      <text x="0" y="24" text-anchor="middle" font-family="${font}" font-size="6.5" font-weight="700" fill="${p.text_primary}" letter-spacing="1">VERIFIED</text>
    </g>

    <!-- Contact Stack -->
    <g id="Layer_7_Contact" data-draggable="contact" data-label="Contact Stack" transform="${getTransform(cPos)}" text-anchor="middle" class="draggable-group">
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
  const hArtPos = getPos('header_art', 0, 0);
  const fArtPos = getPos('footer_art', 0, 0);
  const bPos = getPos('branding', 68, 58);
  const badgePos = getPos('badge', activeArtPreset.badgePos.x, activeArtPreset.badgePos.y);
  const rPos = getPos('recipient', 68, 232);
  const dPos = getPos('date', 748, 232);
  const subPos = getPos('subject', 68, 338);
  const bodyPos = getPos('body', 68, 378, 680);
  const sigPos = getPos('signature', 68, 880);
  const cPos = getPos('contact', 68, 990);

  const lineHeight = t.scale.body.line_height || 17;
  const paragraphSpacing = t.scale.body.paragraph_spacing || 14;
  const bodyLines = getDynamicWrapLines(paragraphs, bodyPos.x, bodyPos.width, t.scale.body.size, lineHeight, paragraphSpacing);

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.width}" height="${s.height}" xml:space="preserve">
  <defs>
    <clipPath id="BleedClip"><rect x="0" y="0" width="${vbWidth}" height="${vbHeight}" /></clipPath>
    <clipPath id="HeaderClip">
      <rect x="0" y="0" width="${vbWidth}" height="240" />
    </clipPath>
    <clipPath id="FooterClip">
      <rect x="0" y="960" width="${vbWidth}" height="186.5" />
    </clipPath>
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
      ${renderProceduralWatermark(p, art.watermarkType)}
    </g>

    <!-- Draggable Header Art -->
    <g id="Layer_2_Header_Art" data-draggable="header_art" data-label="Header Artwork (Vector)" transform="${getTransform(hArtPos)}" class="draggable-group">
      ${spec.custom_header_svg ? spec.custom_header_svg : `
        <g clip-path="url(#HeaderClip)">
          <path d="${art.headerPrimary}" fill="url(#gradPrimary)" />
          <path d="${art.headerAccent}" fill="url(#gradAccent)" opacity="0.85" />
          <path d="${art.headerNeutral}" fill="${p.neutral_shape}" opacity="0.45" />
          ${renderMicroAccents(p, art.type)}
        </g>
      `}
    </g>

    <!-- Draggable Badge -->
    <g id="Layer_Badge" data-draggable="badge" data-label="Tech Accent Badge" transform="${getTransform(badgePos)}" class="draggable-group">
      ${renderTechBadge(p, { x: 0, y: 0 }, art.badgeType)}
    </g>

    <!-- Branding -->
    <g id="Layer_3_Branding" data-draggable="branding" data-label="Company Branding" transform="${getTransform(bPos)}" class="draggable-group">
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
    <g id="Layer_4_Recipient" data-draggable="recipient" data-label="Recipient Details" transform="${getTransform(rPos)}" class="draggable-group">
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
    <g id="Layer_Date" data-draggable="date" data-label="Date" transform="${getTransform(dPos)}" class="draggable-group">
      <text x="0" y="0" text-anchor="end" font-family="${font}" font-size="${t.scale.meta.size}" font-weight="500" fill="${p.text_secondary}">${c.date}</text>
    </g>

    <!-- Subject -->
    <g id="Layer_Subject" data-draggable="subject" data-label="Subject Line" transform="${getTransform(subPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="${t.scale.subject.size}" font-weight="${t.scale.subject.weight}" fill="${p.text_primary}">${c.subject}</text>
      <rect x="0" y="8" width="46" height="2.5" rx="1.25" fill="url(#gradAccent)" />
    </g>

    <!-- Body -->
    <g id="Layer_5_Body" data-draggable="body" data-label="Letter Body" transform="${getTransform(bodyPos)}" class="draggable-group">
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
    <g id="Layer_6_Signature" data-draggable="signature" data-label="Signature & Sign-off" transform="${getTransform(sigPos)}" class="draggable-group">
      <text x="0" y="0" font-family="${font}" font-size="11" font-weight="500" fill="${p.text_primary}">${c.closing}</text>
      <path d="M 2 36 Q 16 12 34 38 T 64 24 T 86 48 Q 104 8 118 34 Q 130 54 152 26" fill="none" stroke="${p.text_primary}" stroke-width="1.6" stroke-linecap="round" />
      <path d="M 22 44 Q 72 46 130 40" fill="none" stroke="${p.text_primary}" stroke-width="1.2" stroke-linecap="round" />
      <text x="0" y="70" font-family="${font}" font-size="${t.scale.signature_name.size}" font-weight="${t.scale.signature_name.weight}" fill="${p.text_primary}">${c.sender.name}</text>
      <text x="0" y="86" font-family="${font}" font-size="10" font-weight="500" fill="${p.gradient_accent[1]}">${c.sender.title}</text>
    </g>

    <!-- Footer & Contact Stack -->
    <g id="Layer_7_Footer">
      <g id="Layer_7_Footer_Art" data-draggable="footer_art" data-label="Footer Artwork (Vector)" transform="${getTransform(fArtPos)}" class="draggable-group">
        ${spec.custom_footer_svg ? spec.custom_footer_svg : `
          <g clip-path="url(#FooterClip)">
            <path d="${art.footerPrimary}" fill="url(#gradPrimary)" />
            <path d="${art.footerAccent}" fill="url(#gradAccent)" opacity="0.8" />
            <path d="${art.footerNeutral}" fill="${p.neutral_shape}" opacity="0.5" />
          </g>
        `}
      </g>

      <g id="Layer_7_Contact" data-draggable="contact" data-label="Footer Contact Stack" transform="${getTransform(cPos)}" class="draggable-group">
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

function renderSidebarGeometry(p, sb, side = 'left', shapeType = 'waves', vbWidth = 817.7, vbHeight = 1146.5) {
  const w = sb.width || 210;
  const aw = sb.accentWidth || 8;
  const H = vbHeight;
  const isRight = side === 'right';
  const sx = vbWidth - w;

  if (shapeType === 'waves' || shapeType === 'ribbons') {
    if (!isRight) {
      return `
        <!-- Left Curved Wave Sidebar -->
        <path d="M 0 0 L ${w} 0 C ${w + 35} 250, ${w - 35} 550, ${w + 25} 820 C ${w + 45} 960, ${w - 10} 1060, ${w} ${H} L 0 ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${w} 0 C ${w + 35} 250, ${w - 35} 550, ${w + 25} 820 C ${w + 45} 960, ${w - 10} 1060, ${w} ${H} L ${w - aw} ${H} C ${w - aw - 10} 1060, ${w - aw + 45} 960, ${w - aw + 25} 820 C ${w - aw - 35} 550, ${w - aw + 35} 250, ${w - aw} 0 Z" fill="url(#gradAccent)" opacity="0.95" />
        <path d="M 0 0 L ${w - 45} 0 C ${w - 20} 250, ${w - 75} 550, ${w - 30} 820 L 0 820 Z" fill="${p.neutral_shape}" opacity="0.18" />
      `;
    } else {
      return `
        <!-- Right Curved Wave Sidebar -->
        <path d="M ${vbWidth} 0 L ${sx} 0 C ${sx - 35} 250, ${sx + 35} 550, ${sx - 25} 820 C ${sx - 45} 960, ${sx + 10} 1060, ${sx} ${H} L ${vbWidth} ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${sx} 0 C ${sx - 35} 250, ${sx + 35} 550, ${sx - 25} 820 C ${sx - 45} 960, ${sx + 10} 1060, ${sx} ${H} L ${sx + aw} ${H} C ${sx + aw + 10} 1060, ${sx + aw - 45} 960, ${sx + aw - 25} 820 C ${sx + aw + 35} 550, ${sx + aw - 35} 250, ${sx + aw} 0 Z" fill="url(#gradAccent)" opacity="0.95" />
        <path d="M ${vbWidth} 0 L ${sx + 45} 0 C ${sx + 20} 250, ${sx + 75} 550, ${sx + 30} 820 L ${vbWidth} 820 Z" fill="${p.neutral_shape}" opacity="0.18" />
      `;
    }
  } else if (shapeType === 'diagonal_slash' || shapeType === 'origami_folds') {
    if (!isRight) {
      return `
        <!-- Left Slanted Diagonal Blade Sidebar -->
        <polygon points="0,0 ${w + 45},0 ${w - 30},${H} 0,${H}" fill="url(#gradPrimary)" />
        <polygon points="${w + 45},0 ${w + 45 - aw},0 ${w - 30 - aw},${H} ${w - 30},${H}" fill="url(#gradAccent)" opacity="0.95" />
        <polygon points="${w + 65},0 ${w + 45},0 ${w - 30},${H} ${w - 10},${H}" fill="url(#gradAccent)" opacity="0.3" />
      `;
    } else {
      return `
        <!-- Right Slanted Diagonal Blade Sidebar -->
        <polygon points="${vbWidth},0 ${sx - 45},0 ${sx + 30},${H} ${vbWidth},${H}" fill="url(#gradPrimary)" />
        <polygon points="${sx - 45},0 ${sx - 45 + aw},0 ${sx + 30 + aw},${H} ${sx + 30},${H}" fill="url(#gradAccent)" opacity="0.95" />
        <polygon points="${sx - 65},0 ${sx - 45},0 ${sx + 30},${H} ${sx + 10},${H}" fill="url(#gradAccent)" opacity="0.3" />
      `;
    }
  } else if (shapeType === 'tech_angles' || shapeType === 'cyber_mesh') {
    if (!isRight) {
      return `
        <!-- Left Cyber Stepped Notched Sidebar -->
        <path d="M 0 0 L ${w + 24} 0 L ${w + 24} 210 L ${w - 18} 260 L ${w - 18} 690 L ${w + 28} 750 L ${w + 28} 930 L ${w} 970 L ${w} ${H} L 0 ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${w + 24} 0 L ${w + 24 - aw} 0 L ${w + 24 - aw} 210 L ${w - 18 - aw} 260 L ${w - 18 - aw} 690 L ${w + 28 - aw} 750 L ${w + 28 - aw} 930 L ${w - aw} 970 L ${w - aw} ${H} L ${w} ${H} L ${w} 970 L ${w + 28} 930 L ${w + 28} 750 L ${w - 18} 690 L ${w - 18} 260 L ${w + 24} 210 Z" fill="url(#gradAccent)" opacity="0.95" />
        <polygon points="${w - 18},260 ${w + 8},260 ${w + 28},300 ${w + 8},300" fill="${p.neutral_shape}" opacity="0.35" />
      `;
    } else {
      return `
        <!-- Right Cyber Stepped Notched Sidebar -->
        <path d="M ${vbWidth} 0 L ${sx - 24} 0 L ${sx - 24} 210 L ${sx + 18} 260 L ${sx + 18} 690 L ${sx - 28} 750 L ${sx - 28} 930 L ${sx} 970 L ${sx} ${H} L ${vbWidth} ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${sx - 24} 0 L ${sx - 24 + aw} 0 L ${sx - 24 + aw} 210 L ${sx + 18 + aw} 260 L ${sx + 18 + aw} 690 L ${sx - 28 + aw} 750 L ${sx - 28 + aw} 930 L ${sx + aw} 970 L ${sx + aw} ${H} L ${sx} ${H} L ${sx} 970 L ${sx - 28} 930 L ${sx - 28} 750 L ${sx + 18} 690 L ${sx + 18} 260 L ${sx - 24} 210 Z" fill="url(#gradAccent)" opacity="0.95" />
        <polygon points="${sx + 18},260 ${sx - 8},260 ${sx - 28},300 ${sx - 8},300" fill="${p.neutral_shape}" opacity="0.35" />
      `;
    }
  } else if (shapeType === 'bauhaus_arcs' || shapeType === 'minimal_arcs') {
    if (!isRight) {
      return `
        <!-- Left Bauhaus Arc Flare Sidebar -->
        <path d="M 0 0 L ${w + 35} 0 C ${w - 45} 280, ${w - 45} 680, ${w + 35} ${H} L 0 ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${w + 35} 0 C ${w - 45} 280, ${w - 45} 680, ${w + 35} ${H} L ${w + 35 - aw} ${H} C ${w - 45 - aw} 680, ${w - 45 - aw} 280, ${w + 35 - aw} 0 Z" fill="url(#gradAccent)" opacity="0.95" />
        <circle cx="${w - 25}" cy="480" r="32" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" opacity="0.4" stroke-dasharray="6 4" />
      `;
    } else {
      return `
        <!-- Right Bauhaus Arc Flare Sidebar -->
        <path d="M ${vbWidth} 0 L ${sx - 35} 0 C ${sx + 45} 280, ${sx + 45} 680, ${sx - 35} ${H} L ${vbWidth} ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${sx - 35} 0 C ${sx + 45} 280, ${sx + 45} 680, ${sx - 35} ${H} L ${sx - 35 + aw} ${H} C ${sx + 45 + aw} 680, ${sx + 45 + aw} 280, ${sx - 35 + aw} 0 Z" fill="url(#gradAccent)" opacity="0.95" />
        <circle cx="${sx + 25}" cy="480" r="32" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" opacity="0.4" stroke-dasharray="6 4" />
      `;
    }
  } else {
    // Default Clean Sleek Rectangle Strip
    if (!isRight) {
      return `
        <rect x="0" y="0" width="${w}" height="${H}" fill="url(#gradPrimary)" />
        <rect x="${w - aw}" y="0" width="${aw}" height="${H}" fill="url(#gradAccent)" opacity="0.9" />
      `;
    } else {
      return `
        <rect x="${sx}" y="0" width="${w}" height="${H}" fill="url(#gradPrimary)" />
        <rect x="${sx}" y="0" width="${aw}" height="${H}" fill="url(#gradAccent)" opacity="0.9" />
      `;
    }
  }
}

function renderDiagonalCornerGeometry(p, diag, shapeType = 'waves', isInverse = false, vbWidth = 817.7, vbHeight = 1146.5, part = 'both') {
  const H = vbHeight;
  const W = vbWidth;
  const d = diag || {};

  // Standardize coordinate fallbacks
  const topX1 = d.topX1 || 420;
  const topX2 = d.topX2 || 320;
  const topX3 = d.topX3 || 200;
  const topY1 = d.topY1 || 165;
  const topY2 = d.topY2 || 120;
  const topY3 = d.topY3 || 70;

  const botX1 = d.botX1 || 380;
  const botX2 = d.botX2 || 280;
  const botX3 = d.botX3 || 170;
  const botY1Offset = (d.botY1 > 500) ? (H - d.botY1) : (d.botY1 || 165);
  const botY2Offset = (d.botY2 > 500) ? (H - d.botY2) : (d.botY2 || 120);
  const botY3Offset = (d.botY3 > 500) ? (H - d.botY3) : (d.botY3 || 70);

  let topSnippet = '';
  let botSnippet = '';

  if (shapeType === 'waves' || shapeType === 'ribbons') {
    if (!isInverse) {
      topSnippet = `
        <!-- Top-Right Fluid Wave Corner -->
        <path d="M ${W - topX1} 0 C ${W - topX2} ${topY1 * 0.3}, ${W - 120} ${topY1 * 0.15}, ${W} ${topY1} L ${W} 0 Z" fill="url(#gradPrimary)" />
        <path d="M ${W - topX2} 0 C ${W - topX3} ${topY2 * 0.35}, ${W - 80} ${topY2 * 0.18}, ${W} ${topY2} L ${W} 0 Z" fill="url(#gradAccent)" opacity="0.85" />
        <path d="M ${W - topX3} 0 C ${W - 100} 25, ${W - 40} 12, ${W} ${topY3} L ${W} 0 Z" fill="${p.neutral_shape}" opacity="0.4" />
        ${renderDotMatrix(p, 680, 20, 3, 3)}
      `;
      botSnippet = `
        <!-- Bottom-Left Fluid Wave Corner -->
        <path d="M 0 ${H - botY1Offset} C ${botX1 * 0.3} ${H - botY1Offset * 0.18}, ${botX1 * 0.7} ${H - botY1Offset * 0.3}, ${botX1} ${H} L 0 ${H} Z" fill="url(#gradPrimary)" />
        <path d="M 0 ${H - botY2Offset} C ${botX2 * 0.3} ${H - botY2Offset * 0.2}, ${botX2 * 0.65} ${H - botY2Offset * 0.35}, ${botX2} ${H} L 0 ${H} Z" fill="url(#gradAccent)" opacity="0.85" />
        <path d="M 0 ${H - botY3Offset} C 50 ${H - 15}, 110 ${H - 25}, ${botX3} ${H} L 0 ${H} Z" fill="${p.neutral_shape}" opacity="0.4" />
      `;
    } else {
      topSnippet = `
        <!-- Top-Left Fluid Wave Corner -->
        <path d="M 0 ${topY1} C ${topX1 * 0.3} ${topY1 * 0.18}, ${topX1 * 0.7} ${topY1 * 0.3}, ${topX1} 0 L 0 0 Z" fill="url(#gradPrimary)" />
        <path d="M 0 ${topY2} C ${topX2 * 0.3} ${topY2 * 0.2}, ${topX2 * 0.65} ${topY2 * 0.35}, ${topX2} 0 L 0 0 Z" fill="url(#gradAccent)" opacity="0.85" />
        <path d="M 0 ${topY3} C 50 15, 110 25, ${topX3} 0 L 0 0 Z" fill="${p.neutral_shape}" opacity="0.4" />
        ${renderDotMatrix(p, 40, 20, 3, 3)}
      `;
      botSnippet = `
        <!-- Bottom-Right Fluid Wave Corner -->
        <path d="M ${W - botX1} ${H} C ${W - botX1 * 0.7} ${H - botY1Offset * 0.3}, ${W - botX1 * 0.3} ${H - botY1Offset * 0.18}, ${W} ${H - botY1Offset} L ${W} ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${W - botX2} ${H} C ${W - botX2 * 0.65} ${H - botY2Offset * 0.35}, ${W - botX2 * 0.3} ${H - botY2Offset * 0.2}, ${W} ${H - botY2Offset} L ${W} ${H} Z" fill="url(#gradAccent)" opacity="0.85" />
        <path d="M ${W - botX3} ${H} C ${W - 110} ${H - 25}, ${W - 50} ${H - 15}, ${W} ${H - botY3Offset} L ${W} ${H} Z" fill="${p.neutral_shape}" opacity="0.4" />
      `;
    }
  } else if (shapeType === 'tech_angles' || shapeType === 'cyber_mesh') {
    const step = d.stepOffset || 45;
    if (!isInverse) {
      topSnippet = `
        <!-- Top-Right Cyber Stepped Notch Corner -->
        <path d="M ${W - topX1} 0 L ${W} 0 L ${W} ${topY1} L ${W - 110} ${topY1} L ${W - 110 - step} ${topY1 - 50} L ${W - 110 - step * 2.2} ${topY1 - 50} L ${W - topX1 + step} ${step} L ${W - topX1} 0 Z" fill="url(#gradPrimary)" />
        <path d="M ${W - topX2} 0 L ${W} 0 L ${W} ${topY2} L ${W - 90} ${topY2} L ${W - 90 - step * 0.9} ${topY2 - 40} L ${W - 90 - step * 2} ${topY2 - 40} L ${W - topX2 + step * 0.8} ${step * 0.8} L ${W - topX2} 0 Z" fill="url(#gradAccent)" opacity="0.85" />
        <polygon points="${W - 110},${topY1} ${W - 80},${topY1} ${W - 50},${topY2} ${W - 80},${topY2}" fill="${p.neutral_shape}" opacity="0.4" />
        ${renderDotMatrix(p, 680, 20, 3, 3)}
      `;
      botSnippet = `
        <!-- Bottom-Left Cyber Stepped Notch Corner -->
        <path d="M 0 ${H - botY1Offset} L 110 ${H - botY1Offset} L ${110 + step} ${H - botY1Offset + 50} L ${110 + step * 2.2} ${H - botY1Offset + 50} L ${botX1 - step} ${H - step} L ${botX1} ${H} L 0 ${H} Z" fill="url(#gradPrimary)" />
        <path d="M 0 ${H - botY2Offset} L 90 ${H - botY2Offset} L ${90 + step * 0.9} ${H - botY2Offset + 40} L ${90 + step * 2} ${H - botY2Offset + 40} L ${botX2 - step * 0.8} ${H - step * 0.8} L ${botX2} ${H} L 0 ${H} Z" fill="url(#gradAccent)" opacity="0.85" />
        <polygon points="110,${H - botY1Offset} 80,${H - botY1Offset} 50,${H - botY2Offset} 80,${H - botY2Offset}" fill="${p.neutral_shape}" opacity="0.4" />
      `;
    } else {
      topSnippet = `
        <!-- Top-Left Cyber Stepped Notch Corner -->
        <path d="M 0 0 L ${topX1} 0 L ${topX1 - step} ${step} L ${110 + step * 2.2} ${topY1 - 50} L ${110 + step} ${topY1 - 50} L 110 ${topY1} L 0 ${topY1} Z" fill="url(#gradPrimary)" />
        <path d="M 0 0 L ${topX2} 0 L ${topX2 - step * 0.8} ${step * 0.8} L ${90 + step * 2} ${topY2 - 40} L ${90 + step * 0.9} ${topY2 - 40} L 90 ${topY2} L 0 ${topY2} Z" fill="url(#gradAccent)" opacity="0.85" />
        <polygon points="110,${topY1} 80,${topY1} 50,${topY2} 80,${topY2}" fill="${p.neutral_shape}" opacity="0.4" />
        ${renderDotMatrix(p, 40, 20, 3, 3)}
      `;
      botSnippet = `
        <!-- Bottom-Right Cyber Stepped Notch Corner -->
        <path d="M ${W - botX1} ${H} L ${W - botX1 + step} ${H - step} L ${W - 110 - step * 2.2} ${H - botY1Offset + 50} L ${W - 110 - step} ${H - botY1Offset + 50} L ${W - 110} ${H - botY1Offset} L ${W} ${H - botY1Offset} L ${W} ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${W - botX2} ${H} L ${W - botX2 + step * 0.8} ${H - step * 0.8} L ${W - 90 - step * 2} ${H - botY2Offset + 40} L ${W - 90 - step * 0.9} ${H - botY2Offset + 40} L ${W - 90} ${H - botY2Offset} L ${W} ${H - botY2Offset} L ${W} ${H} Z" fill="url(#gradAccent)" opacity="0.85" />
        <polygon points="${W - 110},${H - botY1Offset} ${W - 80},${H - botY1Offset} ${W - 50},${H - botY2Offset} ${W - 80},${H - botY2Offset}" fill="${p.neutral_shape}" opacity="0.4" />
      `;
    }
  } else if (shapeType === 'bauhaus_arcs' || shapeType === 'minimal_arcs') {
    const arcR1 = d.arcRadius || topX1 || 300;
    const arcR2 = arcR1 * 0.72;
    const arcR3 = arcR1 * 0.38;
    const barcR1 = d.arcRadius || botX1 || 300;
    const barcR2 = barcR1 * 0.72;
    const barcR3 = barcR1 * 0.38;

    if (!isInverse) {
      topSnippet = `
        <!-- Top-Right Bauhaus Circular Arc Corner -->
        <path d="M ${W - arcR1} 0 A ${arcR1} ${arcR1} 0 0 1 ${W} ${arcR1} L ${W} 0 Z" fill="url(#gradPrimary)" />
        <path d="M ${W - arcR2} 0 A ${arcR2} ${arcR2} 0 0 1 ${W} ${arcR2} L ${W} 0 Z" fill="url(#gradAccent)" opacity="0.9" />
        <path d="M ${W - arcR3} 0 A ${arcR3} ${arcR3} 0 0 1 ${W} ${arcR3} L ${W} 0 Z" fill="${p.neutral_shape}" opacity="0.4" />
        <circle cx="${W - arcR2 * 0.75}" cy="${arcR2 * 0.75}" r="24" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" stroke-dasharray="6 3" />
      `;
      botSnippet = `
        <!-- Bottom-Left Bauhaus Circular Arc Corner -->
        <path d="M 0 ${H - barcR1} A ${barcR1} ${barcR1} 0 0 1 ${barcR1} ${H} L 0 ${H} Z" fill="url(#gradPrimary)" />
        <path d="M 0 ${H - barcR2} A ${barcR2} ${barcR2} 0 0 1 ${barcR2} ${H} L 0 ${H} Z" fill="url(#gradAccent)" opacity="0.9" />
        <path d="M 0 ${H - barcR3} A ${barcR3} ${barcR3} 0 0 1 ${barcR3} ${H} L 0 ${H} Z" fill="${p.neutral_shape}" opacity="0.4" />
        <circle cx="${barcR2 * 0.75}" cy="${H - barcR2 * 0.75}" r="24" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" stroke-dasharray="6 3" />
      `;
    } else {
      topSnippet = `
        <!-- Top-Left Bauhaus Circular Arc Corner -->
        <path d="M 0 ${arcR1} A ${arcR1} ${arcR1} 0 0 1 ${arcR1} 0 L 0 0 Z" fill="url(#gradPrimary)" />
        <path d="M 0 ${arcR2} A ${arcR2} ${arcR2} 0 0 1 ${arcR2} 0 L 0 0 Z" fill="url(#gradAccent)" opacity="0.9" />
        <path d="M 0 ${arcR3} A ${arcR3} ${arcR3} 0 0 1 ${arcR3} 0 L 0 0 Z" fill="${p.neutral_shape}" opacity="0.4" />
        <circle cx="${arcR2 * 0.75}" cy="${arcR2 * 0.75}" r="24" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" stroke-dasharray="6 3" />
      `;
      botSnippet = `
        <!-- Bottom-Right Bauhaus Circular Arc Corner -->
        <path d="M ${W} ${H - barcR1} A ${barcR1} ${barcR1} 0 0 1 ${W - barcR1} ${H} L ${W} ${H} Z" fill="url(#gradPrimary)" />
        <path d="M ${W} ${H - barcR2} A ${barcR2} ${barcR2} 0 0 1 ${W - barcR2} ${H} L ${W} ${H} Z" fill="url(#gradAccent)" opacity="0.9" />
        <path d="M ${W} ${H - barcR3} A ${barcR3} ${barcR3} 0 0 1 ${W - barcR3} ${H} L ${W} ${H} Z" fill="${p.neutral_shape}" opacity="0.4" />
        <circle cx="${W - barcR2 * 0.75}" cy="${H - barcR2 * 0.75}" r="24" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" stroke-dasharray="6 3" />
      `;
    }
  } else {
    // Default Sharp Angular Slices / Diagonal Blade
    if (!isInverse) {
      topSnippet = `
        <!-- Top-Right Diagonal Angular Slices -->
        <polygon points="${W - topX1},0 ${W},0 ${W},${topY1} ${W - topX2},0" fill="url(#gradAccent)" opacity="0.4" />
        <polygon points="${W - topX2},0 ${W},0 ${W},${topY2}" fill="url(#gradPrimary)" />
        <polygon points="${W - topX3},0 ${W},0 ${W},${topY3}" fill="url(#gradAccent)" />
        ${renderDotMatrix(p, 680, 20, 3, 3)}
      `;
      botSnippet = `
        <!-- Bottom-Left Coordinated Diagonal Cut -->
        <polygon points="0,${H - botY1Offset} 0,${H} ${botX1},${H}" fill="url(#gradAccent)" opacity="0.3" />
        <polygon points="0,${H - botY2Offset} 0,${H} ${botX2},${H}" fill="url(#gradPrimary)" />
        <polygon points="0,${H - botY3Offset} 0,${H} ${botX3},${H}" fill="url(#gradAccent)" />
      `;
    } else {
      topSnippet = `
        <!-- Top-Left Diagonal Angular Slices -->
        <polygon points="0,0 ${topX1},0 0,${topY1}" fill="url(#gradAccent)" opacity="0.4" />
        <polygon points="0,0 ${topX2},0 0,${topY2}" fill="url(#gradPrimary)" />
        <polygon points="0,0 ${topX3},0 0,${topY3}" fill="url(#gradAccent)" />
        ${renderDotMatrix(p, 40, 20, 3, 3)}
      `;
      botSnippet = `
        <!-- Bottom-Right Coordinated Diagonal Cut -->
        <polygon points="${W - botX1},${H} ${W},${H - botY1Offset} ${W},${H}" fill="url(#gradAccent)" opacity="0.3" />
        <polygon points="${W - botX2},${H} ${W},${H - botY2Offset} ${W},${H}" fill="url(#gradPrimary)" />
        <polygon points="${W - botX3},${H} ${W},${H - botY3Offset} ${W},${H}" fill="url(#gradAccent)" />
      `;
    }
  }

  if (part === 'header') return topSnippet;
  if (part === 'footer') return botSnippet;
  return `${topSnippet}\n${botSnippet}`;
}

function renderCenterFormalHeader(p, vbWidth, vbHeight, shapeType = 'waves') {
  if (shapeType === 'waves' || shapeType === 'ribbons') {
    return `
      <!-- Fluid Wave Trim -->
      <path d="M 0 0 L ${vbWidth} 0 L ${vbWidth} 18 C 600 45, 220 5, 0 25 Z" fill="url(#gradPrimary)" />
      <path d="M 0 0 L ${vbWidth} 0 L ${vbWidth} 10 C 600 28, 220 2, 0 14 Z" fill="url(#gradAccent)" opacity="0.85" />
      <path d="M 0 ${vbHeight} L ${vbWidth} ${vbHeight} L ${vbWidth} ${vbHeight - 18} C 600 ${vbHeight - 45}, 220 ${vbHeight - 5}, 0 ${vbHeight - 25} Z" fill="url(#gradPrimary)" />
      <path d="M 0 ${vbHeight} L ${vbWidth} ${vbHeight} L ${vbWidth} ${vbHeight - 10} C 600 ${vbHeight - 28}, 220 ${vbHeight - 2}, 0 ${vbHeight - 14} Z" fill="url(#gradAccent)" opacity="0.85" />
    `;
  } else if (shapeType === 'tech_angles' || shapeType === 'cyber_mesh') {
    return `
      <!-- Tech Stepped Trim -->
      <polygon points="0,0 ${vbWidth},0 ${vbWidth},14 ${vbWidth - 80},14 ${vbWidth - 120},24 120,24 80,14 0,14" fill="url(#gradPrimary)" />
      <polygon points="120,24 ${vbWidth - 120},24 ${vbWidth - 140},30 140,30" fill="url(#gradAccent)" />
      <polygon points="0,${vbHeight} ${vbWidth},${vbHeight} ${vbWidth},${vbHeight - 14} ${vbWidth - 80},${vbHeight - 14} ${vbWidth - 120},${vbHeight - 24} 120,${vbHeight - 24} 80,${vbHeight - 14} 0,${vbHeight - 14}" fill="url(#gradPrimary)" />
    `;
  } else if (shapeType === 'bauhaus_arcs' || shapeType === 'minimal_arcs') {
    return `
      <!-- Bauhaus Arch Trim -->
      <path d="M 0 0 L ${vbWidth} 0 L ${vbWidth} 8 C 550 40, 260 40, 0 8 Z" fill="url(#gradPrimary)" />
      <circle cx="${vbWidth / 2}" cy="18" r="8" fill="url(#gradAccent)" />
      <path d="M 0 ${vbHeight} L ${vbWidth} ${vbHeight} L ${vbWidth} ${vbHeight - 8} C 550 ${vbHeight - 40}, 260 ${vbHeight - 40}, 0 ${vbHeight - 8} Z" fill="url(#gradPrimary)" />
    `;
  } else {
    return `
      <!-- Classic Multi-Stripe -->
      <rect x="0" y="0" width="${vbWidth}" height="10" fill="url(#gradPrimary)" />
      <rect x="0" y="10" width="${vbWidth}" height="3" fill="url(#gradAccent)" />
      <rect x="0" y="${vbHeight - 10}" width="${vbWidth}" height="10" fill="url(#gradPrimary)" />
      <rect x="0" y="${vbHeight - 13}" width="${vbWidth}" height="3" fill="url(#gradAccent)" />
    `;
  }
}

function renderFrameBorders(p, vbWidth, vbHeight, shapeType = 'waves') {
  if (shapeType === 'tech_angles' || shapeType === 'cyber_mesh') {
    return `
      <!-- Cyber Tech Bracket Frame -->
      <rect x="28" y="28" width="${vbWidth - 56}" height="${vbHeight - 56}" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="1.8" />
      <g stroke="${p.gradient_accent[0]}" stroke-width="3" fill="none">
        <path d="M 22 56 L 22 22 L 56 22" />
        <path d="M ${vbWidth - 56} 22 L ${vbWidth - 22} 22 L ${vbWidth - 22} 56" />
        <path d="M 22 ${vbHeight - 56} L 22 ${vbHeight - 22} L 56 ${vbHeight - 22}" />
        <path d="M ${vbWidth - 56} ${vbHeight - 22} L ${vbWidth - 22} ${vbHeight - 22} L ${vbWidth - 22} ${vbHeight - 56}" />
      </g>
      <line x1="${vbWidth / 2 - 40}" y1="28" x2="${vbWidth / 2 + 40}" y2="28" stroke="${p.gradient_accent[0]}" stroke-width="3" />
    `;
  } else if (shapeType === 'waves' || shapeType === 'ribbons') {
    return `
      <!-- Fluid Wave Corner Rosette Frame -->
      <rect x="28" y="28" width="${vbWidth - 56}" height="${vbHeight - 56}" rx="14" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="2.2" />
      <rect x="36" y="36" width="${vbWidth - 72}" height="${vbHeight - 72}" rx="8" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1" stroke-dasharray="6 4" />
      <circle cx="28" cy="28" r="8" fill="${p.gradient_accent[0]}" opacity="0.8" />
      <circle cx="${vbWidth - 28}" cy="28" r="8" fill="${p.gradient_accent[0]}" opacity="0.8" />
      <circle cx="28" cy="${vbHeight - 28}" r="8" fill="${p.gradient_accent[0]}" opacity="0.8" />
      <circle cx="${vbWidth - 28}" cy="${vbHeight - 28}" r="8" fill="${p.gradient_accent[0]}" opacity="0.8" />
    `;
  } else if (shapeType === 'bauhaus_arcs' || shapeType === 'minimal_arcs') {
    return `
      <!-- Bauhaus Circular Inset Frame -->
      <rect x="24" y="24" width="${vbWidth - 48}" height="${vbHeight - 48}" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="1.2" />
      <rect x="32" y="32" width="${vbWidth - 64}" height="${vbHeight - 64}" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" />
      <circle cx="${vbWidth - 32}" cy="32" r="16" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" />
      <circle cx="32" cy="${vbHeight - 32}" r="16" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" />
      <circle cx="${vbWidth - 32}" cy="${vbHeight - 32}" r="16" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="2" />
    `;
  } else {
    // Default Dual Stroke Frame
    return `
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
    `;
  }
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
