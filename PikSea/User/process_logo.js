import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputImagePath = 'C:\\Users\\DAYALGURU\\.gemini\\antigravity-ide\\brain\\3f73a9bd-4bb0-4f0d-be2e-6bcb6fc6b255\\.user_uploaded\\media_1790490201473.jpg';

async function generateTransparentLogo() {
  console.log('Loading input image...');
  const { data, info } = await sharp(inputImagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Dimensions: ${width}x${height}, channels: ${channels}`);

  // Create transparent RGBA buffer
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  // Background sample color from corners (dark navy/black: ~ r:7, g:11, b:18)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];

    // Calculate brightness and color saturation
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

    // If it's the dark background
    let alpha = 255;
    if (brightness < 20) {
      alpha = 0;
    } else if (brightness < 45) {
      // Smooth feathering on dark background threshold
      alpha = Math.round(((brightness - 20) / 25) * 255);
    }

    rgbaBuffer[i * 4] = r;
    rgbaBuffer[i * 4 + 1] = g;
    rgbaBuffer[i * 4 + 2] = b;
    rgbaBuffer[i * 4 + 3] = alpha;
  }

  const transparentImage = sharp(rgbaBuffer, {
    raw: { width, height, channels: 4 }
  });

  // Save full transparent logo (Dark mode - white text)
  const fullLogoDark = await transparentImage.png().toBuffer();
  
  // Crop the bird emblem only (top 68% of image)
  const birdIconBuffer = await sharp(rgbaBuffer, {
    raw: { width, height, channels: 4 }
  })
    .extract({
      left: Math.round(width * 0.15),
      top: Math.round(height * 0.08),
      width: Math.round(width * 0.70),
      height: Math.round(height * 0.60)
    })
    .trim()
    .png()
    .toBuffer();

  const targetDirs = [
    'c:\\Users\\DAYALGURU\\Desktop\\KABIR\\PikSea\\User\\public',
    'c:\\Users\\DAYALGURU\\Desktop\\KABIR\\PikSea\\Admin\\public',
    'c:\\Users\\DAYALGURU\\Desktop\\KABIR\\PikSea\\Contributor\\public'
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Save master full logo
    await sharp(fullLogoDark).toFile(path.join(dir, 'piksea-logo.png'));
    await sharp(fullLogoDark).webp({ quality: 95 }).toFile(path.join(dir, 'piksea-logo.webp'));

    // Save bird icon mark
    await sharp(birdIconBuffer).toFile(path.join(dir, 'piksea-icon.png'));
    await sharp(birdIconBuffer).webp({ quality: 95 }).toFile(path.join(dir, 'piksea-icon.webp'));

    // Save favicon sizes
    await sharp(birdIconBuffer).resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(dir, 'favicon.png'));
    await sharp(birdIconBuffer).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(dir, 'favicon-32x32.png'));
  }

  console.log('All transparent PNG and WebP logos generated and saved successfully across User, Admin, and Contributor!');
}

generateTransparentLogo().catch(err => {
  console.error('Error generating logo:', err);
});
