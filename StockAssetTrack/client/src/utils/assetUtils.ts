import { toast } from 'sonner';
import { buildImageProxyUrl } from '../services/api';
import type { ClientSortKey, MediaType, StockAsset } from '../types/stock';

export const CLIENT_SORT_OPTIONS: { value: ClientSortKey; label: string }[] = [
  { value: 'default', label: 'Default Results' },
  { value: 'most_downloads', label: 'Most Downloads' },
  { value: 'least_downloads', label: 'Least Downloads' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'best_performance', label: 'Best Performance' },
  { value: 'ai_first', label: 'AI Generated First' },
  { value: 'non_ai_first', label: 'Non-AI First' },
  { value: 'most_keywords', label: 'Most Keywords' },
  { value: 'least_keywords', label: 'Least Keywords' },
  { value: 'shortest_title', label: 'Shortest Title' },
  { value: 'longest_title', label: 'Longest Title' },
];

export function sortAndFilterAssets(
  assets: StockAsset[],
  sortKey: ClientSortKey,
  mediaFilter: 'all' | MediaType
): StockAsset[] {
  const filtered =
    mediaFilter === 'all'
      ? [...assets]
      : assets.filter((item) => item.mediaType === mediaFilter);

  if (sortKey === 'default') {
    return filtered;
  }

  const parseTime = (date: string | null): number | null => {
    if (!date) return null;
    const parsed = Date.parse(date);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return filtered.sort((a, b) => {
    switch (sortKey) {
      case 'most_downloads':
        return b.downloads - a.downloads;
      case 'least_downloads':
        return a.downloads - b.downloads;
      case 'newest': {
        const ta = parseTime(a.creationDate) ?? -Infinity;
        const tb = parseTime(b.creationDate) ?? -Infinity;
        return tb - ta;
      }
      case 'oldest': {
        const ta = parseTime(a.creationDate) ?? Infinity;
        const tb = parseTime(b.creationDate) ?? Infinity;
        return ta - tb;
      }
      case 'best_performance':
        return b.performanceScore - a.performanceScore || b.downloads - a.downloads;
      case 'ai_first':
        return Number(b.isAI) - Number(a.isAI) || b.downloads - a.downloads;
      case 'non_ai_first':
        return Number(a.isAI) - Number(b.isAI) || b.downloads - a.downloads;
      case 'most_keywords':
        return b.keywords.length - a.keywords.length;
      case 'least_keywords':
        return a.keywords.length - b.keywords.length;
      case 'shortest_title':
        return a.title.length - b.title.length;
      case 'longest_title':
        return b.title.length - a.title.length;
      default:
        return 0;
    }
  });
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatAssetDate(creationDate: string | null): string {
  if (!creationDate) {
    return 'Date N/A';
  }
  const ts = Date.parse(creationDate);
  if (Number.isNaN(ts)) {
    return 'Date N/A';
  }

  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(ts);

  const days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  if (days < 30) {
    return `${formatted} (${days}d ago)`;
  }
  const months = Math.floor(days / 30.4375);
  if (months < 12) {
    return `${formatted} (${months}mo ago)`;
  }
  const years = Math.floor(months / 12);
  return `${formatted} (${years}y ago)`;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerCsvDownload(filename: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportAnalyticsCsv(assets: StockAsset[], query: string): void {
  const header = [
    'Asset ID',
    'Title',
    'Media Type',
    'Is AI',
    'Downloads',
    'Monthly Velocity (D/M)',
    'Performance Score',
    'Dimensions',
    'Category',
    'Creator',
    'Creator ID',
    'Country',
    'Creation Date',
    'Keywords',
    'Adobe Stock URL',
  ];

  const rows = assets.map((asset) => [
    asset.id,
    asset.title,
    asset.mediaType,
    asset.isAI ? 'Yes' : 'No',
    String(asset.downloads),
    asset.monthlyVelocity === null ? 'N/A' : String(asset.monthlyVelocity),
    String(asset.performanceScore),
    asset.dimensions,
    asset.category,
    asset.creator,
    asset.creatorId,
    asset.creatorCountry?.name ?? '',
    asset.creationDate ?? 'N/A',
    asset.keywords.join(', '),
    `https://stock.adobe.com/stock-photo/id/${asset.id}`,
  ]);

  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'assets';
  triggerCsvDownload(`stockassettrack-${slug}-analytics.csv`, [header, ...rows]);
  toast.success(`Exported ${assets.length} assets to Analytics CSV`);
}

export function exportAdobeSubmissionCsv(assets: StockAsset[], query: string): void {
  const header = ['Filename', 'Title', 'Keywords', 'Category', 'Releases'];
  const rows = assets.map((asset) => [
    `asset_${asset.id}.${asset.mediaType === 'Vector' ? 'svg' : 'jpg'}`,
    asset.title.slice(0, 200),
    asset.keywords.slice(0, 49).join(', '),
    asset.category,
    '',
  ]);

  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'submission';
  triggerCsvDownload(`stockassettrack-${slug}-adobe-upload.csv`, [header, ...rows]);
  toast.success(`Exported ${assets.length} assets to Adobe Stock CSV`);
}

export function exportAdobeDraftCsv(params: {
  filename: string;
  title: string;
  keywords: string[];
  category: string;
  slug: string;
}): void {
  const header = ['Filename', 'Title', 'Keywords', 'Category', 'Releases'];
  const row = [
    params.filename || 'submission_asset.jpg',
    params.title.slice(0, 200),
    params.keywords.slice(0, 49).join(', '),
    params.category || 'Business',
    '',
  ];

  const cleanSlug = params.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tags';
  triggerCsvDownload(`stockassettrack-${cleanSlug}-metadata.csv`, [header, row]);
  toast.success(`Exported ${Math.min(49, params.keywords.length)} ranked tags to Adobe Stock CSV`);
}

export async function copyText(text: string, label: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
}

async function fetchImageBlobWithFallback(imageUrl: string): Promise<Blob> {
  try {
    const direct = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
    if (direct.ok) {
      return await direct.blob();
    }
  } catch {
    // Fall through to ftcdn.net proxy when direct CORS fetch fails.
  }

  const parsed = new URL(imageUrl, window.location.origin);
  if (parsed.hostname.endsWith('ftcdn.net')) {
    const proxied = await fetch(buildImageProxyUrl(imageUrl));
    if (proxied.ok) {
      return await proxied.blob();
    }
  }

  throw new Error('Image could not be fetched for clipboard export');
}

function blobToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 540;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);

      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) resolve(pngBlob);
        else reject(new Error('PNG conversion failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode preview image'));
    };
    img.src = objectUrl;
  });
}

export async function copyImageToClipboard(imageUrl: string): Promise<void> {
  try {
    const blob = await fetchImageBlobWithFallback(imageUrl);
    const pngBlob = await blobToPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    toast.success('Image preview copied to clipboard');
  } catch {
    await navigator.clipboard.writeText(imageUrl);
    toast.info('Clipboard image blocked by browser; preview URL copied instead');
  }
}
