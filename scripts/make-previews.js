const sharp = require('sharp');

async function makePreviews() {
  const bgSvg = Buffer.from(
    '<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">' +
    '  <defs>' +
    '    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '      <stop offset="0%" stop-color="#4f46e5" />' +
    '      <stop offset="50%" stop-color="#7c3aed" />' +
    '      <stop offset="100%" stop-color="#06b6d4" />' +
    '    </linearGradient>' +
    '  </defs>' +
    '  <rect width="128" height="128" rx="28" fill="url(#g)" />' +
    '</svg>'
  );

  const shieldResized = await sharp('public/converza-shield-white.png')
    .resize(80, 82, { fit: 'inside' })
    .toBuffer();

  await sharp(bgSvg)
    .composite([{ input: shieldResized, gravity: 'centre' }])
    .png()
    .toFile('public/converza-shield-badge.png');

  console.log('converza-shield-badge.png created successfully!');
}

makePreviews().catch(console.error);
