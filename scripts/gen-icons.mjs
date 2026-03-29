import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/scout-icon.svg');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`./public/icons/icon-${size}x${size}.png`);
  console.log(`Generated ${size}x${size}`);
}

// Apple touch icon (180x180)
await sharp(svg).resize(180, 180).png().toFile('./public/apple-touch-icon.png');
console.log('Generated apple-touch-icon');
