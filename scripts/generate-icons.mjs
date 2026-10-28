// Regenerates the PNG/ICO favicons from public/favicon.svg.
// Run once after changing the SVG: `node scripts/generate-icons.mjs`
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg');
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

writeFileSync('public/apple-touch-icon.png', await sharp(svg, { density: 384 }).resize(180, 180).flatten({ background: '#0b2545' }).png().toBuffer());

// ICO file containing a single 32×32 PNG image.
const image = await png(32);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // number of images
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(image.length, 14);
header.writeUInt32LE(22, 18); // offset of image data
writeFileSync('public/favicon.ico', Buffer.concat([header, image]));

console.log('Icons written to public/');
