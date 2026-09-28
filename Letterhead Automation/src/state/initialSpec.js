export const initialPromptSpec = {
  meta: {
    asset_type: "Corporate Letterhead",
    style: "Modern Tech Wave",
    mood: "innovative, digital, fluid"
  },
  design_theme: "Overlapping fluid gradient waves with a tech polygon badge",
  document_specs: {
    format: "A4 portrait 8.2677 × 11.6929 in + 0.125 in bleed on all sides (Illustrator default)",
    viewBox: "0 0 817.7 1146.5",
    width: "8.5177in",
    height: "11.9427in",
    units: "96 user units per inch",
    bleed: {
      inches: 0.125,
      units: 12,
      edge_box: {
        x: 0,
        y: 0,
        width: 817.7,
        height: 1146.5
      }
    },
    trim_box: {
      x: 12,
      y: 12,
      width: 793.7,
      height: 1122.5
    },
    safe_area: {
      x: 36,
      y: 36,
      width: 745.7,
      height: 1074.5,
      note: "0.25 in inside trim; all text, logo and icons stay inside"
    },
    bleed_rule: "Background and every edge-touching shape must run to the bleed edge (x=0 / 817.7, y=0 / 1146.5), not stop at the trim line",
    clip: "Clip all artwork to the full bleed box 0 0 817.7 1146.5"
  },
  grid: {
    columns: 12,
    margin_left: 68,
    margin_right: 68,
    content_width: 680,
    gutter: 16,
    baseline_px: 6
  },
  palette: {
    gradient_primary: [
      "#0F172A",
      "#1E3A8A"
    ],
    gradient_accent: [
      "#00C6FF",
      "#0072FF"
    ],
    background: "#FFFFFF",
    text_primary: "#0F172A",
    text_secondary: "#64748B",
    neutral_shape: "#E2E8F0",
    divider: "#E2E8F0"
  },
  typography: {
    font_family: "Montserrat, 'Helvetica Neue', Arial, sans-serif",
    note: "Declare font-family as an attribute only; never @import or embed fonts",
    scale: {
      brand_name: { size: 26, weight: 800, letter_spacing: 0.5 },
      tagline: { size: 8.5, weight: 600, letter_spacing: 2.4, transform: "uppercase" },
      label: { size: 9, weight: 600 },
      recipient_name: { size: 17, weight: 700 },
      meta: { size: 9.5, weight: 400, line_height: 15 },
      subject: { size: 11, weight: 700 },
      body: { size: 10.5, weight: 400, line_height: 17, color: "text_secondary", paragraph_spacing: 14 },
      signature_name: { size: 14, weight: 700 },
      footer: { size: 9, weight: 500, line_height: 14 }
    }
  },
  positions: {
    branding: { x: 68, y: 58 },
    recipient: { x: 68, y: 232 },
    date: { x: 748, y: 232 },
    subject: { x: 68, y: 338 },
    body: { x: 68, y: 378 },
    signature: { x: 68, y: 880 },
    contact: { x: 68, y: 990 },
    badge: { x: 720, y: 150 }
  },
  layout: [
    { id: "Layer_1_Background", content: "Full-bleed rect in palette.background, plus one very subtle neutral_shape watermark polygon" },
    { id: "Layer_2_Header_Art", content: "Top edge: three overlapping smooth cubic-bezier waves spanning the full width" },
    { id: "Layer_3_Branding", content: "Logo mark 44×44 at x=68 y=58, brand_name at x=122 baseline y=84, tagline at y=100" },
    { id: "Layer_4_Letter_Meta", content: "Recipient block at x=68 starting y=232, date right-aligned at x=748, subject line at y=338" },
    { id: "Layer_5_Body", content: "Salutation at x=68 y=378, body paragraphs from y=402 within content_width 680" },
    { id: "Layer_6_Signature", content: "Closing at x=68 y=880, hand-drawn style signature stroke, sender name y=950" },
    { id: "Layer_7_Footer", content: "Bottom edge mirrored waves from y=1085 to 1146.5, divider line y=990, contact stack with icon badges" },
    { id: "Layer_8_Guides_Hidden", content: "Guides reserved (bleed, trim, safe area box overlays)" }
  ],
  content: {
    company: {
      name: "CODEXO",
      tagline: "Design Studio"
    },
    recipient: {
      label: "To,",
      name: "John Smeeth",
      title: "Creative Director",
      address: "6598 West Media Sponsor, USA-568",
      email_web: "email@mailid.com, www.myweb.com",
      phone: "+1-222-333-444"
    },
    date: "Date : 14 March, 2027",
    subject: "Subject: Proposal for Brand Identity Partnership",
    salutation: "Dear Mr. Smeeth,",
    body: {
      paragraphs: [
        "We are pleased to submit our formal proposal for the comprehensive redesign of your brand identity and digital collateral system. Our studio combines strategic research with modern engineering to craft systems that build lasting market presence.",
        "Over the past decade, our multidisciplinary team has partnered with ambitious technology firms and creative enterprises worldwide, consistently achieving measurable growth and visual cohesion across print, digital, and mobile touchpoints.",
        "Enclosed you will find the strategic framework, project milestones, and deliverables outlined in accordance with our initial consultation. We look forward to scheduling a review session to address any specific inquiries and commence our collaborative roadmap."
      ]
    },
    closing: "Sincerely,",
    sender: {
      name: "James Smith",
      title: "Manager"
    },
    contact: {
      phone: ["0123-456-7890", "0123-456-7890"],
      email: "your@emailid.com",
      web: "www.example.com",
      address: ["Street Address Here", "Singapore, 2222"]
    }
  },
  export_rules: [
    "Vector only: no <image>, no base64, no external links",
    "No CSS @import, no <style> web fonts; presentation attributes only",
    "Every text stays live and editable",
    "Top-level layer groups exactly as listed, in order",
    "Nothing important outside the safe area; decorative art may bleed and is clipped",
    "Consistent icon badge size and color across the footer"
  ]
};
