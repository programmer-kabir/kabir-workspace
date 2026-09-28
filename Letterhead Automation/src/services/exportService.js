import { generateVectorLetterheadSVG } from '../engines/svgRenderer.js';
import { showToast } from './toastService.js';

export async function copySvgToClipboard(spec) {
  const cleanSvg = generateVectorLetterheadSVG(spec, false);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(cleanSvg);
      showToast('Clean Production SVG copied to clipboard!');
      return;
    }
  } catch (err) {
    console.warn('Navigator clipboard failed, falling back:', err);
  }

  // Fallback for non-https or restricted contexts
  try {
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = cleanSvg;
    tempTextarea.style.position = 'fixed';
    tempTextarea.style.opacity = '0';
    document.body.appendChild(tempTextarea);
    tempTextarea.focus();
    tempTextarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(tempTextarea);
    if (successful) {
      showToast('Clean Production SVG copied to clipboard!');
    } else {
      showToast('Failed to copy SVG');
    }
  } catch (fallbackErr) {
    showToast('Failed to copy SVG');
  }
}

export function downloadSvgFile(spec) {
  try {
    const cleanSvg = generateVectorLetterheadSVG(spec, false);
    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const companyName = (spec.content?.company?.name || 'corporate').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${companyName}_letterhead.svg`;
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    showToast(`Saved ${filename}`);
  } catch (err) {
    console.error('Download SVG error:', err);
    showToast('Failed to download SVG');
  }
}

export function printLetterhead(spec) {
  const cleanSvg = generateVectorLetterheadSVG(spec, false);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Pop-up blocked. Please allow pop-ups to print.');
    return;
  }
  const companyName = spec.content?.company?.name || 'Corporate';
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${companyName} Letterhead</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: white; }
          svg { width: 100vw; height: 100vh; max-width: 100%; max-height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${cleanSvg}
        <script>
          window.onload = function() {
            window.focus();
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
