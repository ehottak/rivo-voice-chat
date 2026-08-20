import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import toIco from 'to-ico';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function generateIcons() {
  const svgPath = path.join(projectRoot, 'public', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Generate 512x512 PNG
  const png512Buffer = await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(projectRoot, 'public', 'icon.png'), png512Buffer);
  console.log('✅ Generated public/icon.png (512x512)');

  // 2. Generate multi-size buffers for ICO
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await toIco(pngBuffers);
  fs.writeFileSync(path.join(projectRoot, 'public', 'icon.ico'), icoBuffer);
  console.log('✅ Generated public/icon.ico (16, 32, 48, 64, 128, 256)');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
