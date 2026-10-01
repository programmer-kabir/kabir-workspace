function randomRange(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const defaultArtPreset = {
  type: "waves",
  headerPrimary: "M 0 0 L 817.7 0 L 817.7 85 C 680 135 520 70 380 92 C 240 114 120 148 0 105 Z",
  headerAccent: "M 0 0 L 817.7 0 L 817.7 58 C 710 112 590 62 460 76 C 310 92 180 132 0 88 Z",
  headerNeutral: "M 0 0 L 817.7 0 L 817.7 32 C 690 68 590 35 480 44 C 330 56 160 88 0 52 Z",
  headerExtra: "",
  footerPrimary: "M 0 1146.5 L 817.7 1146.5 L 817.7 1095 C 670 1080 540 1130 380 1110 C 230 1092 120 1125 0 1098 Z",
  footerAccent: "M 0 1146.5 L 817.7 1146.5 L 817.7 1115 C 690 1095 560 1138 410 1120 C 260 1104 140 1135 0 1122 Z",
  footerNeutral: "M 0 1146.5 L 817.7 1146.5 L 817.7 1135 C 720 1125 580 1146.5 450 1138 C 300 1130 160 1144 0 1136 Z",
  badgeType: "hexagon",
  badgePos: { x: 720, y: 150 },
  watermarkType: "shield_crest",
  gradAngle: 45
};

export let activeArtPreset = JSON.parse(JSON.stringify(defaultArtPreset));

export function generateNewArtwork(preferredStyle = "random") {
  const styles = [
    "waves", 
    "tech_angles", 
    "ribbons", 
    "minimal_arcs", 
    "origami_folds", 
    "cyber_mesh",
    "diagonal_slash",
    "chevron_cuts",
    "bauhaus_arcs"
  ];
  const style = preferredStyle === "random" ? randomChoice(styles) : preferredStyle;
  const badges = ["hexagon", "diamond", "cyber_circles", "quad_cross", "quantum_star", "shield_badge"];
  const chosenBadge = randomChoice(badges);
  const watermarks = ["shield_crest", "tech_rings", "diamond_crest", "monogram_circle", "geometric_flower"];
  const chosenWatermark = randomChoice(watermarks);

  const W = 817.7;
  const H = 1146.5;

  let headerPrimary, headerAccent, headerNeutral, headerExtra = "";
  let footerPrimary, footerAccent, footerNeutral;

  if (style === "tech_angles") {
    // Dynamic polygonal faceted cuts
    const h1R = randomRange(80, 135);
    const h1Mid = randomRange(360, 540);
    const h1MidY = randomRange(65, 115);
    const h1L = randomRange(55, 105);

    const h2R = h1R - randomRange(20, 35);
    const h2Mid = h1Mid + randomRange(-40, 50);
    const h2MidY = h1MidY - randomRange(18, 30);
    const h2L = h1L - randomRange(15, 28);

    const h3R = h2R - randomRange(15, 25);
    const h3Mid = h2Mid + randomRange(-30, 40);
    const h3MidY = h2MidY - randomRange(12, 22);
    const h3L = Math.max(15, h2L - randomRange(15, 25));

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${h1R} L ${h1Mid} ${h1MidY} L 0 ${h1L} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${h2R} L ${h2Mid} ${h2MidY} L 0 ${h2L} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} ${h3R} L ${h3Mid} ${h3MidY} L 0 ${h3L} Z`;

    const f1R = H - randomRange(50, 85);
    const f1Mid = randomRange(350, 510);
    const f1MidY = H - randomRange(30, 65);
    const f1L = H - randomRange(45, 80);

    const f2R = f1R + randomRange(18, 30);
    const f2Mid = f1Mid - randomRange(20, 40);
    const f2MidY = f1MidY + randomRange(15, 25);
    const f2L = f1L + randomRange(15, 28);

    const f3R = f2R + randomRange(12, 20);
    const f3Mid = f2Mid + randomRange(30, 50);
    const f3MidY = f2MidY + randomRange(10, 18);
    const f3L = Math.min(H - 8, f2L + randomRange(12, 20));

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${f1R} L ${f1Mid} ${f1MidY} L 0 ${f1L} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${f2R} L ${f2Mid} ${f2MidY} L 0 ${f2L} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${f3R} L ${f3Mid} ${f3MidY} L 0 ${f3L} Z`;
  }
  else if (style === "diagonal_slash") {
    // Sharp blade angular diagonal slashes
    const cutY1 = randomRange(95, 145);
    const cutY2 = randomRange(35, 75);
    const cutY3 = randomRange(120, 165);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${cutY2} L 0 ${cutY1} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${cutY2 + 25} L 0 ${cutY3} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} ${cutY2 + 45} L 0 ${cutY3 + 20} Z`;

    const fCutY1 = H - randomRange(40, 75);
    const fCutY2 = H - randomRange(80, 120);

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${fCutY2} L 0 ${fCutY1} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${fCutY2 - 20} L 0 ${fCutY1 - 25} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 14} L 0 ${H - 20} Z`;
  }
  else if (style === "chevron_cuts") {
    // Futuristic chevron notch cuts
    const midX = randomRange(380, 480);
    const tipY = randomRange(110, 155);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${randomRange(55, 85)} L ${midX} ${tipY} L 0 ${randomRange(55, 85)} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${randomRange(30, 55)} L ${midX} ${tipY - 25} L 0 ${randomRange(30, 55)} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} 20 L ${midX} ${tipY - 50} L 0 20 Z`;

    const fTipY = H - randomRange(55, 95);
    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(40, 70)} L ${midX} ${fTipY} L 0 ${H - randomRange(40, 70)} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(20, 40)} L ${midX} ${fTipY + 22} L 0 ${H - randomRange(20, 40)} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 12} L ${midX} ${H - 20} L 0 ${H - 12} Z`;
  }
  else if (style === "origami_folds") {
    // Sharp layered origami folds with steep dynamic diagonals
    const slantX1 = randomRange(420, 580);
    const slantY1 = randomRange(110, 150);
    const slantX2 = randomRange(240, 380);
    const slantY2 = randomRange(70, 105);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${randomRange(90, 130)} L ${slantX1} ${slantY1} L ${slantX2} ${slantY2} L 0 ${randomRange(40, 80)} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${randomRange(60, 85)} L ${slantX1 + 40} ${slantY1 - 25} L ${slantX2 + 30} ${slantY2 - 20} L 0 ${randomRange(25, 45)} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} ${randomRange(30, 50)} L ${slantX1 - 50} ${slantY1 - 45} L 0 20 Z`;

    const fSlantX1 = randomRange(380, 540);
    const fSlantY1 = H - randomRange(55, 95);

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(60, 90)} L ${fSlantX1} ${fSlantY1} L 0 ${H - randomRange(40, 75)} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(35, 55)} L ${fSlantX1 + 50} ${fSlantY1 + 20} L 0 ${H - randomRange(20, 40)} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 15} L ${fSlantX1 - 40} ${fSlantY1 + 35} L 0 ${H - 12} Z`;
  }
  else if (style === "ribbons") {
    // Intersecting smooth cubic ribbon swooshes
    const r1cp1x = randomRange(580, 720);
    const r1cp1y = randomRange(120, 160);
    const r1cp2x = randomRange(180, 320);
    const r1cp2y = randomRange(50, 95);
    const r1end = randomRange(95, 135);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${randomRange(75, 105)} C ${r1cp1x} ${r1cp1y} ${r1cp2x} ${r1cp2y} 0 ${r1end} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${randomRange(50, 75)} C ${r1cp1x - 40} ${r1cp1y - 30} ${r1cp2x + 40} ${r1cp2y - 20} 0 ${r1end - 25} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} ${randomRange(25, 45)} C ${r1cp1x - 90} ${r1cp1y - 65} ${r1cp2x + 80} ${r1cp2y - 40} 0 ${r1end - 50} Z`;

    const f1cp1x = randomRange(560, 700);
    const f1cp1y = H - randomRange(50, 85);
    const f1cp2x = randomRange(190, 330);
    const f1cp2y = H - randomRange(65, 105);

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(45, 75)} C ${f1cp1x} ${f1cp1y} ${f1cp2x} ${f1cp2y} 0 ${H - randomRange(55, 85)} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(25, 45)} C ${f1cp1x - 30} ${f1cp1y + 15} ${f1cp2x + 30} ${f1cp2y + 20} 0 ${H - randomRange(35, 55)} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 15} C 520 ${H - 22} 260 ${H - 12} 0 ${H - 18} Z`;
  }
  else if (style === "minimal_arcs" || style === "bauhaus_arcs") {
    // Bauhaus geometric clean arc curves
    const arcDepth1 = randomRange(85, 135);
    const arcDepth2 = arcDepth1 - randomRange(22, 35);
    const arcDepth3 = arcDepth2 - randomRange(18, 28);
    const inflectionX = randomRange(380, 520);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${arcDepth1 - 15} Q ${inflectionX} ${arcDepth1 + 45} 0 ${arcDepth1} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${arcDepth2 - 12} Q ${inflectionX + 30} ${arcDepth2 + 35} 0 ${arcDepth2} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} ${arcDepth3 - 10} Q ${inflectionX - 40} ${arcDepth3 + 25} 0 ${arcDepth3} Z`;

    const fDepth1 = randomRange(55, 85);
    const fDepth2 = fDepth1 - randomRange(18, 28);

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${H - fDepth1 + 10} Q ${inflectionX} ${H - fDepth1 - 35} 0 ${H - fDepth1} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${H - fDepth2 + 8} Q ${inflectionX - 30} ${H - fDepth2 - 25} 0 ${H - fDepth2} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 16} Q 400 ${H - 26} 0 ${H - 18} Z`;
  }
  else if (style === "cyber_mesh") {
    // High-tech stepped matrix cuts with laser accents
    const step1X = randomRange(460, 560);
    const step1Y = randomRange(75, 110);
    const step2X = randomRange(220, 320);
    const step2Y = randomRange(110, 145);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${randomRange(60, 85)} L ${step1X} ${step1Y} L ${step2X} ${step2Y} L 0 ${randomRange(85, 125)} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${randomRange(40, 60)} L ${step1X + 40} ${step1Y - 18} L ${step2X + 30} ${step2Y - 22} L 0 ${randomRange(60, 90)} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} 25 L ${step1X - 30} 45 L 0 35 Z`;

    const fStepX = randomRange(360, 480);
    const fStepY = H - randomRange(45, 75);

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(40, 70)} L ${fStepX} ${fStepY} L 0 ${H - randomRange(55, 85)} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${H - randomRange(20, 40)} L ${fStepX - 30} ${fStepY + 20} L 0 ${H - randomRange(30, 50)} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 12} L ${fStepX + 40} ${H - 22} L 0 ${H - 16} Z`;
  }
  else {
    // Organic Multi-Harmonic Waves with randomized control points
    const rightY1 = randomRange(75, 115);
    const leftY1 = randomRange(85, 130);
    const w1 = randomRange(640, 720);
    const w1y = randomRange(120, 165);
    const w2 = randomRange(470, 540);
    const w2y = randomRange(55, 95);
    const w3 = randomRange(320, 390);
    const w3y = randomRange(80, 125);
    const w4 = randomRange(160, 230);
    const w4y = randomRange(110, 155);

    headerPrimary = `M 0 0 L ${W} 0 L ${W} ${rightY1} C ${w1} ${w1y} ${w2} ${w2y} ${w3} ${w3y} C ${w4} ${w4y} 100 ${w1y - 15} 0 ${leftY1} Z`;
    headerAccent = `M 0 0 L ${W} 0 L ${W} ${rightY1 - 28} C ${w1 - 20} ${w1y - 28} ${w2 + 20} ${w2y} ${w3 + 15} ${w3y - 22} C ${w4 - 15} ${w4y - 25} 120 ${w1y - 35} 0 ${leftY1 - 26} Z`;
    headerNeutral = `M 0 0 L ${W} 0 L ${W} ${Math.max(20, rightY1 - 50)} C ${w1 - 40} ${w1y - 58} ${w2} 32 ${w3} 45 C ${w4} 52 140 68 0 ${Math.max(24, leftY1 - 52)} Z`;

    const fRightY = H - randomRange(45, 80);
    const fLeftY = H - randomRange(50, 90);
    const fw1y = H - randomRange(60, 100);
    const fw2y = H - randomRange(35, 70);
    const fw3y = H - randomRange(55, 90);

    footerPrimary = `M 0 ${H} L ${W} ${H} L ${W} ${fRightY} C ${w1} ${fw1y} ${w2} ${fw2y} ${w3} ${fw3y} C ${w4} ${fw1y - 10} 110 ${fw2y - 10} 0 ${fLeftY} Z`;
    footerAccent = `M 0 ${H} L ${W} ${H} L ${W} ${fRightY + 22} C ${w1} ${fw1y + 22} ${w2} ${fw2y + 18} ${w3} ${fw3y + 20} C ${w4} ${fw1y + 15} 110 ${fw2y + 12} 0 ${fLeftY + 24} Z`;
    footerNeutral = `M 0 ${H} L ${W} ${H} L ${W} ${H - 15} C 620 ${H - 25} 380 ${H - 12} 0 ${H - 18} Z`;
  }

  // Layout-specific procedural parameters
  const diagTopX1 = randomRange(420, 520);
  const diagTopX2 = randomRange(520, 620);
  const diagTopX3 = randomRange(620, 710);
  const diagTopY1 = randomRange(140, 200);
  const diagTopY2 = randomRange(90, 140);
  const diagTopY3 = randomRange(45, 85);

  const diagBotX1 = randomRange(260, 360);
  const diagBotX2 = randomRange(180, 260);
  const diagBotX3 = randomRange(100, 170);
  const diagBotY1 = H - randomRange(140, 200);
  const diagBotY2 = H - randomRange(90, 140);
  const diagBotY3 = H - randomRange(45, 85);

  const invTopX1 = randomRange(300, 420);
  const invTopX2 = randomRange(200, 300);
  const invTopX3 = randomRange(110, 190);
  const invTopY1 = randomRange(140, 200);
  const invTopY2 = randomRange(90, 140);
  const invTopY3 = randomRange(45, 85);

  const invBotX1 = randomRange(460, 560);
  const invBotX2 = randomRange(560, 650);
  const invBotX3 = randomRange(650, 720);
  const invBotY1 = H - randomRange(140, 200);
  const invBotY2 = H - randomRange(90, 140);
  const invBotY3 = H - randomRange(45, 85);

  const sidebarW = randomRange(195, 230);
  const sidebarAccentW = randomRange(6, 12);
  const frameMargin = randomRange(26, 36);
  const cornerSize = randomRange(35, 55);

  const preset = {
    type: style,
    headerPrimary,
    headerAccent,
    headerNeutral,
    headerExtra,
    footerPrimary,
    footerAccent,
    footerNeutral,
    badgeType: chosenBadge,
    badgePos: { x: randomRange(695, 738), y: randomRange(135, 165) },
    watermarkType: chosenWatermark,
    gradAngle: randomChoice([30, 45, 60, 120, 135, 150]),
    // Multi-layout parameters
    diag: {
      shapeType: style,
      topX1: diagTopX1, topX2: diagTopX2, topX3: diagTopX3,
      topY1: diagTopY1, topY2: diagTopY2, topY3: diagTopY3,
      botX1: diagBotX1, botX2: diagBotX2, botX3: diagBotX3,
      botY1: diagBotY1, botY2: diagBotY2, botY3: diagBotY3,
      arcRadius: randomRange(260, 360),
      stepOffset: randomRange(35, 65)
    },
    inv: {
      shapeType: style,
      topX1: invTopX1, topX2: invTopX2, topX3: invTopX3,
      topY1: invTopY1, topY2: invTopY2, topY3: invTopY3,
      botX1: invBotX1, botX2: invBotX2, botX3: invBotX3,
      botY1: invBotY1, botY2: invBotY2, botY3: invBotY3,
      arcRadius: randomRange(260, 360),
      stepOffset: randomRange(35, 65)
    },
    sidebar: {
      width: sidebarW,
      accentWidth: sidebarAccentW,
      shapeType: style,
      watermarkY: randomRange(850, 1020)
    },
    frame: {
      margin: frameMargin,
      cornerSize: cornerSize
    }
  };

  activeArtPreset = preset;
  return { activeArtPreset: preset, preset, style, chosenBadge, chosenWatermark };
}

export function createArtworkPreset(preferredStyle = "random", customOptions = {}) {
  const result = generateNewArtwork(preferredStyle);
  const presetCopy = JSON.parse(JSON.stringify(result.preset));
  if (customOptions.diag) Object.assign(presetCopy.diag, customOptions.diag);
  if (customOptions.inv) Object.assign(presetCopy.inv, customOptions.inv);
  if (customOptions.sidebar) Object.assign(presetCopy.sidebar, customOptions.sidebar);
  if (customOptions.frame) Object.assign(presetCopy.frame, customOptions.frame);
  return presetCopy;
}

export function renderTechBadge(p, pos, type) {
  const x = pos.x;
  const y = pos.y;
  if (type === "diamond") {
    return `
      <g transform="translate(${x}, ${y})">
        <polygon points="0,-22 22,0 0,22 -22,0" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" />
        <polygon points="0,-12 12,0 0,12 -12,0" fill="${p.gradient_accent[1]}" opacity="0.3" />
        <circle cx="0" cy="0" r="3.5" fill="${p.gradient_accent[0]}" />
        <line x1="28" y1="0" x2="38" y2="0" stroke="${p.gradient_accent[0]}" stroke-width="1.2" opacity="0.6" />
        <line x1="-38" y1="0" x2="-28" y2="0" stroke="${p.gradient_accent[0]}" stroke-width="1.2" opacity="0.6" />
      </g>`;
  } else if (type === "cyber_circles") {
    return `
      <g transform="translate(${x}, ${y})">
        <circle cx="0" cy="0" r="18" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.6" stroke-dasharray="6 3" />
        <circle cx="0" cy="0" r="11" fill="none" stroke="${p.gradient_accent[1]}" stroke-width="1.2" />
        <circle cx="0" cy="0" r="4.5" fill="${p.gradient_accent[0]}" />
        <circle cx="26" cy="0" r="2" fill="${p.gradient_accent[1]}" opacity="0.8" />
        <circle cx="-26" cy="0" r="2" fill="${p.gradient_accent[1]}" opacity="0.8" />
      </g>`;
  } else if (type === "quad_cross") {
    return `
      <g transform="translate(${x}, ${y})">
        <rect x="-14" y="-14" width="28" height="28" rx="6" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" transform="rotate(45)" />
        <circle cx="0" cy="0" r="4" fill="${p.gradient_accent[1]}" />
        <line x1="0" y1="-26" x2="0" y2="-18" stroke="${p.gradient_accent[0]}" stroke-width="1.4" />
        <line x1="0" y1="18" x2="0" y2="26" stroke="${p.gradient_accent[0]}" stroke-width="1.4" />
        <line x1="-26" y1="0" x2="-18" y2="0" stroke="${p.gradient_accent[0]}" stroke-width="1.4" />
        <line x1="18" y1="0" x2="26" y2="0" stroke="${p.gradient_accent[0]}" stroke-width="1.4" />
      </g>`;
  } else if (type === "quantum_star") {
    return `
      <g transform="translate(${x}, ${y})">
        <polygon points="0,-24 7,-8 24,-7 12,5 16,22 0,13 -16,22 -12,5 -24,-7 -7,-8" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.6" />
        <circle cx="0" cy="0" r="5" fill="${p.gradient_accent[1]}" opacity="0.85" />
        <circle cx="0" cy="0" r="18" fill="none" stroke="${p.gradient_accent[1]}" stroke-width="1" stroke-dasharray="3 3" opacity="0.6" />
      </g>`;
  } else {
    // Default Hexagon
    return `
      <g transform="translate(${x}, ${y})">
        <polygon points="0,-24 20.8,-12 20.8,12 0,24 -20.8,12 -20.8,-12" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="1.8" />
        <polygon points="0,-14 12.1,-7 12.1,7 0,14 -12.1,7 -12.1,-7" fill="${p.gradient_accent[1]}" opacity="0.25" />
        <circle cx="0" cy="0" r="4" fill="${p.gradient_accent[1]}" />
        <line x1="28" y1="0" x2="36" y2="0" stroke="${p.gradient_accent[0]}" stroke-width="1.2" opacity="0.6" />
        <line x1="-36" y1="0" x2="-28" y2="0" stroke="${p.gradient_accent[0]}" stroke-width="1.2" opacity="0.6" />
      </g>`;
  }
}

export function renderDotMatrix(p, x = 620, y = 80, cols = 5, rows = 3) {
  let dots = [];
  const spacing = 10;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(`<circle cx="${x + c * spacing}" cy="${y + r * spacing}" r="1.5" fill="${p.gradient_accent[0]}" opacity="0.4" />`);
    }
  }
  return `<g id="Micro_Dot_Matrix" opacity="0.85">${dots.join('')}</g>`;
}

export function renderMicroAccents(p, style = 'waves') {
  if (style === 'tech_angles' || style === 'cyber_mesh' || style === 'origami_folds') {
    return `
      <g id="Tech_Accents" opacity="0.6">
        <line x1="68" y1="130" x2="140" y2="130" stroke="${p.gradient_accent[0]}" stroke-width="1.5" stroke-dasharray="8 4" />
        <circle cx="146" cy="130" r="2" fill="${p.gradient_accent[0]}" />
        ${renderDotMatrix(p, 620, 50, 4, 3)}
      </g>`;
  } else {
    return `
      <g id="Organic_Accents" opacity="0.5">
        ${renderDotMatrix(p, 630, 45, 4, 3)}
      </g>`;
  }
}


export function renderProceduralWatermark(p, type = activeArtPreset.watermarkType || 'shield_crest') {
  const cx = 408.85;
  const cy = 573.25;

  if (type === 'tech_rings') {
    return `
      <g id="Watermark_TechRings" opacity="0.04" transform="translate(${cx}, ${cy})">
        <circle cx="0" cy="0" r="160" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="14" stroke-dasharray="24 16" />
        <circle cx="0" cy="0" r="120" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="8" stroke-dasharray="12 8" />
        <circle cx="0" cy="0" r="75" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="5" />
        <polygon points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="6" />
      </g>`;
  } else if (type === 'diamond_crest') {
    return `
      <g id="Watermark_DiamondCrest" opacity="0.04" transform="translate(${cx}, ${cy})">
        <polygon points="0,-160 160,0 0,160 -160,0" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="14" />
        <polygon points="0,-110 110,0 0,110 -110,0" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="8" stroke-dasharray="14 10" />
        <circle cx="0" cy="0" r="45" fill="${p.gradient_primary[0]}" />
      </g>`;
  } else if (type === 'monogram_circle') {
    return `
      <g id="Watermark_Monogram" opacity="0.045" transform="translate(${cx}, ${cy})">
        <circle cx="0" cy="0" r="150" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="12" />
        <circle cx="0" cy="0" r="135" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="4" stroke-dasharray="8 6" />
        <path d="M -60 -60 L 0 -110 L 60 -60 L 60 60 L 0 110 L -60 60 Z" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="8" />
      </g>`;
  } else if (type === 'geometric_flower') {
    return `
      <g id="Watermark_GeometricFlower" opacity="0.04" transform="translate(${cx}, ${cy})">
        <circle cx="0" cy="0" r="140" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="10" />
        <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="6" transform="rotate(0)" />
        <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="6" transform="rotate(60)" />
        <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="6" transform="rotate(120)" />
      </g>`;
  } else {
    // Default Shield Crest
    return `
      <g id="Watermark_Shield" opacity="0.04" transform="translate(${cx}, ${cy})">
        <path d="M 0 -160 L 130 -100 L 130 30 C 130 115 0 170 0 170 C 0 170 -130 115 -130 30 L -130 -100 Z" fill="none" stroke="${p.gradient_primary[0]}" stroke-width="14" />
        <path d="M 0 -115 L 90 -70 L 90 20 C 90 85 0 125 0 125 C 0 125 -90 85 -90 20 L -90 -70 Z" fill="none" stroke="${p.gradient_accent[0]}" stroke-width="6" stroke-dasharray="10 8" />
        <circle cx="0" cy="15" r="30" fill="${p.gradient_primary[0]}" />
      </g>`;
  }
}

