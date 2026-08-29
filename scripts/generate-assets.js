import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateAssets() {
  console.log('Generating VOX App Icon, Logo, and Splash screen assets with new brand identity...');

  // 1. App Icon SVG (1024x1024)
  const appIconSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="1024" height="1024" fill="#000000" />

    <!-- Centered Logo Group -->
    <g transform="translate(100, 360)">
      <!-- Dual Emerald Pillar Bars (||) -->
      <rect x="0" y="24" width="76" height="240" rx="38" fill="#20DE92"/>
      <rect x="110" y="24" width="76" height="240" rx="38" fill="#20DE92"/>

      <!-- VOX Wordmark -->
      <text 
        x="250" 
        y="230" 
        fill="#FFFFFF" 
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-weight="900" 
        font-size="252" 
        letter-spacing="-8"
      >VOX</text>

      <!-- Underline -->
      <line 
        x1="270" 
        y1="284" 
        x2="615" 
        y2="284" 
        stroke="#20DE92" 
        stroke-width="9" 
        stroke-linecap="round"
      />

      <!-- OZET Subtitle -->
      <text 
        x="630" 
        y="302" 
        fill="#20DE92" 
        font-family="Georgia, 'Times New Roman', 'Playfair Display', serif" 
        font-weight="900" 
        font-size="70" 
        letter-spacing="1"
      >OZET</text>
    </g>
  </svg>
  `;

  // 2. Splash Screen SVG (2732x2732)
  const splashSvg = `
  <svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="#20DE92" stop-opacity="0.16" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <!-- Background -->
    <rect width="2732" height="2732" fill="#000000" />
    <circle cx="1366" cy="1366" r="1200" fill="url(#bgGlow)" />

    <!-- Center Logo -->
    <g transform="translate(620, 1150)">
      <!-- Dual Emerald Pillar Bars (||) -->
      <rect x="0" y="32" width="128" height="400" rx="64" fill="#20DE92"/>
      <rect x="186" y="32" width="128" height="400" rx="64" fill="#20DE92"/>

      <!-- VOX Wordmark -->
      <text 
        x="420" 
        y="380" 
        fill="#FFFFFF" 
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-weight="900" 
        font-size="420" 
        letter-spacing="-14"
      >VOX</text>

      <!-- Underline -->
      <line 
        x1="450" 
        y1="470" 
        x2="1030" 
        y2="470" 
        stroke="#20DE92" 
        stroke-width="15" 
        stroke-linecap="round"
      />

      <!-- OZET Subtitle -->
      <text 
        x="1055" 
        y="500" 
        fill="#20DE92" 
        font-family="Georgia, 'Times New Roman', 'Playfair Display', serif" 
        font-weight="900" 
        font-size="116" 
        letter-spacing="2"
      >OZET</text>
    </g>

    <!-- Subtitle tagline -->
    <text 
      x="1366" 
      y="1900" 
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
      font-size="48" 
      font-weight="700" 
      fill="#94A3B8" 
      text-anchor="middle" 
      letter-spacing="3"
    >YAPAY ZEKA İLE KİŞİSELLEŞTİRİLMİŞ SESLİ HABER VE BÜLTEN</text>
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
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), splashBuffer);
  fs.writeFileSync(path.join(publicDir, 'vox_splash_1.png'), splashBuffer);
  fs.writeFileSync(path.join(publicDir, 'vox_splash_2.png'), splashBuffer);

  console.log('Successfully generated iOS AppIcon, Splash screens, and public web assets with new logo!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
