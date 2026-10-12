const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT_DIR = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT_DIR, 'public', 'assets', 'vfx', 'player-ship-original.svg');
const ICONS_DIR = path.join(ROOT_DIR, 'public', 'icons');

const BG_COLOR = '#07090c';

const TARGETS = [
  { name: 'icon-192.png', size: 192, scale: 0.82 },
  { name: 'icon-512.png', size: 512, scale: 0.82 },
  { name: 'icon-512-maskable.png', size: 512, scale: 0.68 }
];

function verifyPng(filePath, expectedSize) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24) {
    throw new Error(`File ${filePath} is too small to be a valid PNG`);
  }
  const magic = buf.subarray(0, 8);
  const expectedMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!magic.equals(expectedMagic)) {
    throw new Error(`File ${filePath} does not start with PNG magic bytes`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width !== expectedSize || height !== expectedSize) {
    throw new Error(`File ${filePath} dimensions ${width}x${height} do not match expected ${expectedSize}x${expectedSize}`);
  }
  return { width, height, bytes: buf.length };
}

async function renderIcons() {
  if (!fs.existsSync(SVG_PATH)) {
    throw new Error(`SVG file not found at ${SVG_PATH}`);
  }

  const svgContent = fs.readFileSync(SVG_PATH, 'utf-8');
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const target of TARGETS) {
    const outputPath = path.join(ICONS_DIR, target.name);
    await page.setViewportSize({ width: target.size, height: target.size });

    const svgHeight = Math.round(target.size * target.scale);
    const svgWidth = Math.round(svgHeight * (120 / 160));

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${target.size}px;
      height: ${target.size}px;
      background-color: ${BG_COLOR};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    svg {
      width: ${svgWidth}px;
      height: ${svgHeight}px;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outputPath, type: 'png', omitBackground: false });

    const info = verifyPng(outputPath, target.size);
    console.log(`Generated ${target.name}: ${info.width}x${info.height} (${info.bytes} bytes)`);
  }

  await browser.close();
  console.log('All icons successfully rendered and verified.');
}

renderIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
