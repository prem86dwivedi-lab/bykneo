const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const resDir = path.join(__dirname, '../android/app/src/main/res');

// SVG for Square App Icon
const getSquareIconSvg = (size) => Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#FFC800"/>
  <text x="256" y="230" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="110" text-anchor="middle" fill="#000000">Rider</text>
  <text x="256" y="350" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="125" text-anchor="middle" letter-spacing="2" fill="#000000">XO</text>
</svg>
`);

// SVG for Round App Icon
const getRoundIconSvg = (size) => Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="256" fill="#FFC800"/>
  <text x="256" y="230" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="110" text-anchor="middle" fill="#000000">Rider</text>
  <text x="256" y="350" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="125" text-anchor="middle" letter-spacing="2" fill="#000000">XO</text>
</svg>
`);

// SVG for Adaptive Foreground (Centered in safe zone for Android Adaptive Launcher)
const getForegroundSvg = (size) => Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <text x="256" y="230" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="110" text-anchor="middle" fill="#000000">Rider</text>
  <text x="256" y="350" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="125" text-anchor="middle" letter-spacing="2" fill="#000000">XO</text>
</svg>
`);

// SVG for Splash Screen
const getSplashSvg = (w, h) => Buffer.from(`
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#09090b"/>
  <g transform="translate(${w/2 - 180}, ${h/2 - 75})">
    <rect width="360" height="150" rx="30" fill="#121622" stroke="#FFC800" stroke-width="2.5" stroke-opacity="0.4"/>
    <text x="180" y="75" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="46" text-anchor="middle" fill="#FFFFFF">Rider</text>
    <text x="180" y="125" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="52" text-anchor="middle" fill="#FFC800" letter-spacing="2">XO</text>
  </g>
</svg>
`);

async function generate() {
  const densities = [
    { name: 'mdpi', size: 48, fg: 108 },
    { name: 'hdpi', size: 72, fg: 162 },
    { name: 'xhdpi', size: 96, fg: 216 },
    { name: 'xxhdpi', size: 144, fg: 324 },
    { name: 'xxxhdpi', size: 192, fg: 432 }
  ];

  for (const d of densities) {
    const dir = path.join(resDir, 'mipmap-' + d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(getSquareIconSvg(d.size)).resize(d.size, d.size).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(getRoundIconSvg(d.size)).resize(d.size, d.size).png().toFile(path.join(dir, 'ic_launcher_round.png'));
    await sharp(getForegroundSvg(d.fg)).resize(d.fg, d.fg).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
    console.log('✅ Generated icons for mipmap-' + d.name);
  }

  // Splash screens
  const splashDirs = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 }
  ];

  for (const s of splashDirs) {
    const dir = path.join(resDir, s.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await sharp(getSplashSvg(s.w, s.h)).resize(s.w, s.h).png().toFile(path.join(dir, 'splash.png'));
    console.log('✅ Generated splash for ' + s.dir);
  }

  // Also generate for public web
  const publicDir = path.join(__dirname, '../public');
  await sharp(getSquareIconSvg(512)).resize(512, 512).png().toFile(path.join(publicDir, 'logo.png'));
  await sharp(getSquareIconSvg(192)).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(getSquareIconSvg(512)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(getSquareIconSvg(180)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(getSquareIconSvg(64)).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('✨ ALL RIDERXO ICONS & SPLASH SCREENS GENERATED SUCCESSFULLY!');
}

generate().catch(console.error);
