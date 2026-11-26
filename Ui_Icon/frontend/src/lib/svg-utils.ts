// frontend/lib/svg-utils.ts
import { IconCustomization } from '@/types/icon';

const VECTOR_OBFUSCATION_KEY = 'ib_vector_sec_2026';

/**
 * Decodes obfuscated vector payload into clean standard SVG XML
 */
export function deobfuscateVector(encoded?: string): string {
  if (!encoded) return '';
  const trimmed = encoded.trim();
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
    return encoded;
  }
  try {
    const binary = atob(trimmed);
    let decoded = '';
    const kLen = VECTOR_OBFUSCATION_KEY.length;
    for (let i = 0; i < binary.length; i++) {
      decoded += String.fromCharCode(binary.charCodeAt(i) ^ VECTOR_OBFUSCATION_KEY.charCodeAt(i % kLen));
    }
    return decoded;
  } catch {
    return encoded;
  }
}

/**
 * Dynamically applies user customization (color, size, stroke-width, linecap, linejoin) to an SVG string.
 */
export function applyCustomizationToSvg(
  svgStr: string,
  custom: IconCustomization,
  style: 'outlined' | 'filled' = 'outlined'
): string {
  if (!svgStr) return '';

  let customized = svgStr;

  // 1. Inject or replace width & height
  if (/(?<![a-zA-Z-])width=/.test(customized)) {
    customized = customized.replace(/(?<![a-zA-Z-])width="[^"]*"/g, `width="${custom.size}"`);
  } else {
    customized = customized.replace('<svg', `<svg width="${custom.size}"`);
  }

  if (/(?<![a-zA-Z-])height=/.test(customized)) {
    customized = customized.replace(/(?<![a-zA-Z-])height="[^"]*"/g, `height="${custom.size}"`);
  } else {
    customized = customized.replace('<svg', `<svg height="${custom.size}"`);
  }

  // 2. Inject CSS style="color: ${custom.color};" on root <svg>
  // This guarantees that any currentColor inside the SVG instantly takes custom.color!
  if (/style="[^"]*"/.test(customized)) {
    customized = customized.replace(/style="([^"]*)"/, (_, styles) => {
      const cleaned = styles.replace(/color\s*:[^;]+;?/gi, '').trim();
      return `style="color: ${custom.color}; ${cleaned}"`;
    });
  } else {
    customized = customized.replace('<svg', `<svg style="color: ${custom.color};"`);
  }

  // 3. Handle <style> tags (e.g. Illustrator CSS classes like .st0 { fill: #231F20; })
  if (customized.includes('<style')) {
    customized = customized.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
      const updatedCss = css
        .replace(/fill\s*:\s*(?!none)[^;}"']+/gi, `fill: ${custom.color}`)
        .replace(/stroke\s*:\s*(?!none)[^;}"']+/gi, `stroke: ${custom.color}`);
      return `<style>${updatedCss}</style>`;
    });
  }

  // 4. Handle style: 'filled' vs 'outlined'
  if (style === 'filled') {
    // Check if this SVG is inherently an outline-only SVG (has fill="none" and stroke)
    const isInherentlyOutline =
      /(?<![a-zA-Z-])fill=["']none["']/i.test(customized) &&
      (/(?<![a-zA-Z-])stroke=/i.test(customized) || /stroke-width/i.test(customized));

    if (isInherentlyOutline) {
      // NEVER force fill on an outline-only SVG because open stroke paths will deform into solid polygon blobs!
      // Keep fill="none" and color the strokes properly.
      customized = customized.replace(/(?<![a-zA-Z-])stroke=(["'])(?!none\b|transparent\b)[^"']*\1/gi, `stroke="${custom.color}"`);
      if (!/(?<![a-zA-Z-])stroke=/.test(customized)) {
        customized = customized.replace('<svg', `<svg stroke="${custom.color}"`);
      }
      if (customized.includes('stroke-width=')) {
        customized = customized.replace(/stroke-width="[^"]*"/g, `stroke-width="${custom.strokeWidth}"`);
      }
    } else {
      // Genuine filled SVG (solid shapes)
      // Replace all fills (currentColor, hex, rgb, or named) with custom.color (EXCEPT fill="none" and fill="transparent")
      customized = customized.replace(/(?<![a-zA-Z-])fill=(["'])(?!none\b|transparent\b)[^"']*\1/gi, `fill="${custom.color}"`);
      
      // Also replace inline style="...fill: ..."
      customized = customized.replace(/fill\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, `fill: ${custom.color}`);

      // If root <svg fill="..."> is present, update it
      if (/(<svg\b[^>]*?)\s+fill=(["'])[^"']*\2/gi.test(customized)) {
        customized = customized.replace(/(<svg\b[^>]*?)\s+fill=(["'])[^"']*\2/gi, `$1 fill="${custom.color}"`);
      } else {
        customized = customized.replace('<svg', `<svg fill="${custom.color}"`);
      }

      // If strokes exist with currentColor or hardcoded color, match them to custom.color
      customized = customized.replace(/(?<![a-zA-Z-])stroke=(["'])(?!none\b|transparent\b)[^"']*\1/gi, `stroke="${custom.color}"`);
    }
  } else {
    // style === 'outlined'
    // Replace all strokes with custom.color (EXCEPT stroke="none" and stroke="transparent")
    customized = customized.replace(/(?<![a-zA-Z-])stroke=(["'])(?!none\b|transparent\b)[^"']*\1/gi, `stroke="${custom.color}"`);
    
    // If root <svg> has NO stroke attribute, add stroke="${custom.color}"
    if (!/(?<![a-zA-Z-])stroke=/.test(customized)) {
      customized = customized.replace('<svg', `<svg stroke="${custom.color}"`);
    }

    // Stroke width, linecap, linejoin
    if (customized.includes('stroke-width=')) {
      customized = customized.replace(/stroke-width="[^"]*"/g, `stroke-width="${custom.strokeWidth}"`);
    } else {
      customized = customized.replace('<svg', `<svg stroke-width="${custom.strokeWidth}"`);
    }

    if (customized.includes('stroke-linecap=')) {
      customized = customized.replace(/stroke-linecap="[^"]*"/g, `stroke-linecap="${custom.strokeLinecap}"`);
    } else {
      customized = customized.replace('<svg', `<svg stroke-linecap="${custom.strokeLinecap}"`);
    }

    if (customized.includes('stroke-linejoin=')) {
      customized = customized.replace(/stroke-linejoin="[^"]*"/g, `stroke-linejoin="${custom.strokeLinejoin}"`);
    } else {
      customized = customized.replace('<svg', `<svg stroke-linejoin="${custom.strokeLinejoin}"`);
    }

    // In outlined mode, ensure root <svg> has fill="none"
    if (/(?<![a-zA-Z-])fill=/.test(customized)) {
      customized = customized.replace(/(<svg\b[^>]*?)\s+fill=(["'])[^"']*\2/gi, '$1 fill="none"');
    } else {
      customized = customized.replace('<svg', '<svg fill="none"');
    }
  }

  return customized;
}

/**
 * Converts an SVG string into clean, formatted React JSX component code.
 */
export function svgToJsx(svgStr: string, componentName = 'Icon'): string {
  if (!svgStr) return '';

  let jsx = svgStr
    .replace(/class=/g, 'className=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/clip-path=/g, 'clipPath=');

  return `import React from 'react';

export default function ${componentName}(props: React.SVGProps<SVGSVGElement>) {
  return (
    ${jsx.replace('<svg', '<svg {...props}')}
  );
}`;
}

/**
 * Downloads a customized SVG string as a .svg file.
 */
export function downloadSvg(svgContent: string, filename: string) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders an SVG string to a canvas at a given size and downloads it as a .png file.
 */
export function downloadPng(svgContent: string, filename: string, size = 512): Promise<void> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error('PNG export failed'));
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, 'image/png');
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}

/**
 * Copy text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    document.body.removeChild(textArea);
    return false;
  }
}
