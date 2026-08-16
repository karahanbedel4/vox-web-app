import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateAssets() {
  console.log('Generating VOX App Icon and Splash screen assets...');

  // 1. App Icon SVG (1024x1024)
  const appIconSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#000000" />
    <g transform="translate(512, 512)">
      <!-- Main VOX text -->
      <text 
        x="-110" 
        y="30" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="360" 
        font-weight="900" 
        letter-spacing="-12" 
        fill="#FFFFFF" 
        text-anchor="center"
      >VOX</text>
      <!-- Subtitle ÖZETLE -->
      <text 
        x="130" 
        y="160" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="120" 
        font-style="italic" 
        font-weight="800" 
        fill="#4ADE80" 
        letter-spacing="-2"
      >ÖZETLE</text>
    </g>
  </svg>
  `;

  // 2. Splash Screen SVG (2732x2732)
  const splashSvg = `
  <svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="#4ADE80" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#090A0F" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0F1117" />
        <stop offset="100%" stop-color="#07080B" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="2732" height="2732" fill="url(#bgGrad)" />
    <circle cx="1366" cy="1366" r="1000" fill="url(#bgGlow)" />

    <!-- Center Logo -->
    <g transform="translate(1366, 1300)">
      <text 
        x="-260" 
        y="50" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="520" 
        font-weight="900" 
        letter-spacing="-18" 
        fill="#FFFFFF"
      >VOX</text>
      <text 
        x="110" 
        y="230" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="180" 
        font-style="italic" 
        font-weight="800" 
        fill="#4ADE80" 
        letter-spacing="-3"
      >ÖZETLE</text>
    </g>

    <!-- Subtitle tagline -->
    <text 
      x="1366" 
      y="1800" 
      font-family="system-ui, -apple-system, sans-serif" 
      font-size="54" 
      font-weight="600" 
      fill="#A1A1AA" 
      text-anchor="middle" 
      letter-spacing="2"
    >YAPAY ZEKA İLE KİŞİSELLEŞTİRİLMİŞ SESLİ BÜLTENLER</text>
  </svg>
  `;

  // Output paths
  const appIconBuffer = await sharp(Buffer.from(appIconSvg)).png().toBuffer();
  const splashBuffer = await sharp(Buffer.from(splashSvg)).png().toBuffer();

  // Save iOS AppIcon
  const iosIconDir = path.join(process.cwd(), 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if (!fs.existsSync(iosIconDir)) {
    fs.mkdirSync(iosIconDir, { recursive: true });
  }
  fs.writeFileSync(path.join(iosIconDir, 'AppIcon-512@2x.png'), appIconBuffer);

  // Save iOS Splash screens
  const iosSplashDir = path.join(process.cwd(), 'ios/App/App/Assets.xcassets/Splash.imageset');
  if (!fs.existsSync(iosSplashDir)) {
    fs.mkdirSync(iosSplashDir, { recursive: true });
  }
  fs.writeFileSync(path.join(iosSplashDir, 'splash-2732x2732.png'), splashBuffer);
  fs.writeFileSync(path.join(iosSplashDir, 'splash-2732x2732-1.png'), splashBuffer);
  fs.writeFileSync(path.join(iosSplashDir, 'splash-2732x2732-2.png'), splashBuffer);

  // Save Public Web Assets
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'logo.png'), appIconBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appIconBuffer);
  fs.writeFileSync(path.join(publicDir, 'vox_splash_1.png'), splashBuffer);
  fs.writeFileSync(path.join(publicDir, 'vox_splash_2.png'), splashBuffer);

  console.log('Successfully generated iOS AppIcon, Splash screens, and public web assets!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
