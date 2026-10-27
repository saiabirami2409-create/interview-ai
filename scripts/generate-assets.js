const sharp = require('sharp');
const fs = require('fs');

async function generateAllAssets() {
  // Base SVG gradient with subtle inner bevel / radial sheen
  const createSvgBadge = (size, rx) => Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="purpleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="35%" stop-color="#6366f1" />
          <stop offset="70%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
        <radialGradient id="highlight" cx="30%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${rx}" fill="url(#purpleBlue)" />
      <rect width="${size}" height="${size}" rx="${rx}" fill="url(#highlight)" />
    </svg>
  `);

  // 1. High-res badge (512x512)
  const bg512 = createSvgBadge(512, 116);
  const logo360 = await sharp('public/converza-white-trimmed.png')
    .resize(370, 370, { fit: 'inside' })
    .toBuffer();
  await sharp(bg512)
    .composite([{ input: logo360, gravity: 'centre' }])
    .png()
    .toFile('public/converza-badge.png');

  // 2. Medium badge (128x128)
  const bg128 = createSvgBadge(128, 28);
  const logo92 = await sharp('public/converza-white-trimmed.png')
    .resize(92, 92, { fit: 'inside' })
    .toBuffer();
  await sharp(bg128)
    .composite([{ input: logo92, gravity: 'centre' }])
    .png()
    .toFile('public/converza-badge-md.png');

  // 3. Small badge (64x64)
  const bg64 = createSvgBadge(64, 15);
  const logo46 = await sharp('public/converza-white-trimmed.png')
    .resize(48, 48, { fit: 'inside' })
    .toBuffer();
  await sharp(bg64)
    .composite([{ input: logo46, gravity: 'centre' }])
    .png()
    .toFile('public/converza-badge-sm.png');

  // 4. Update public/icon.png
  await sharp('public/converza-badge-sm.png')
    .resize(32, 32)
    .png()
    .toFile('public/icon.png');

  console.log('All Converza brand assets generated successfully!');
}

generateAllAssets().catch(console.error);
