const sharp = require('sharp');

async function testComposite() {
  const bgSvg = Buffer.from(`
    <svg width="160" height="160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="purpleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#purpleBlue)" />
    </svg>
  `);

  const logoResized = await sharp('public/converza-white-trimmed.png')
    .resize(110, 110, { fit: 'inside' })
    .toBuffer();

  await sharp(bgSvg)
    .composite([{ input: logoResized, gravity: 'centre' }])
    .toFile('public/converza-preview-badge.png');

  console.log('Badge preview generated!');
}

testComposite().catch(console.error);
