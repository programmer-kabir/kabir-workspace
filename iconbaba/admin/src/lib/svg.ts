// admin/src/lib/svg.ts

/**
 * Converts all hardcoded dark/black/colored fills and strokes to 'currentColor',
 * allowing the SVG to adapt to whatever text color its parent container specifies.
 */
export function normalizeSvgToCurrentColor(svgStr?: string): string {
  if (!svgStr) return '';
  let svg = svgStr.trim();

  // 1. Remove XML declaration or DOCTYPE
  svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();

  // 2. Remove any white background artboards (e.g. <rect fill="white"/> or fill="#fff")
  svg = svg.replace(/<rect\b[^>]*(width=["']100%["']|height=["']100%["'])[^>]*fill=["'](white|#fff|#ffffff)["'][^>]*\/?>/gi, '');

  // 3. Process <style> blocks if present
  if (svg.includes('<style')) {
    svg = svg.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
      const updatedCss = css
        .replace(/fill\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'fill: currentColor')
        .replace(/stroke\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'stroke: currentColor');
      return `<style>${updatedCss}</style>`;
    });
  }

  // 4. Replace hardcoded dark/black/colored fills (except fill="none" and fill="transparent")
  svg = svg.replace(/(?<![a-zA-Z-])fill=(["'])(?!none\b|transparent\b)[^"']*["']/gi, 'fill="currentColor"');

  // 5. Replace hardcoded strokes (except stroke="none" and stroke="transparent")
  svg = svg.replace(/(?<![a-zA-Z-])stroke=(["'])(?!none\b|transparent\b)[^"']*["']/gi, 'stroke="currentColor"');

  // 6. Replace inline styles
  svg = svg.replace(/fill\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'fill: currentColor');
  svg = svg.replace(/stroke\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'stroke: currentColor');

  // 7. Check if this is an outline-only SVG
  const isOutline =
    /(?<![a-zA-Z-])fill=["']none["']/i.test(svg) &&
    (/(?<![a-zA-Z-])stroke=/i.test(svg) || /stroke-width/i.test(svg));

  // 8. Ensure root <svg> has currentColor
  if (!isOutline) {
    if (!/(?<![a-zA-Z-])fill=/i.test(svg)) {
      svg = svg.replace('<svg', '<svg fill="currentColor"');
    }
  } else {
    if (!/(?<![a-zA-Z-])stroke=/i.test(svg)) {
      svg = svg.replace('<svg', '<svg stroke="currentColor"');
    }
  }

  return svg;
}

/**
 * Normalizes any SVG XML string so it renders in crisp pure white (#ffffff)
 * on dark admin backgrounds, converting hardcoded black/dark colors to currentColor.
 */
export function formatSvgForDarkPreview(svgStr?: string, color: string = '#ffffff'): string {
  if (!svgStr) return '';
  let svg = normalizeSvgToCurrentColor(svgStr);

  // Inject color style on root SVG element so currentColor is guaranteed to take this color
  if (/style="[^"]*"/.test(svg)) {
    svg = svg.replace(/style="([^"]*)"/, (_, styles) => {
      const cleaned = styles.replace(/color\s*:[^;]+;?/gi, '').trim();
      return `style="color: ${color}; ${cleaned}"`;
    });
  } else {
    svg = svg.replace('<svg', `<svg style="color: ${color};"`);
  }

  return svg;
}
