import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width (4), height (4), bit depth (1), color type 6 (RGBA), compression 0, filter 0, interlace 0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw uncompressed bitmap data: each row starts with filter type 0 followed by size * 4 RGBA bytes
  const rowLen = 1 + size * 4;
  const rawData = Buffer.alloc(rowLen * size);

  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.22;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Gradient from Indigo (#4f46e5) to Violet (#7c3aed)
        const t = (x + y) / (size * 2);
        const r = Math.round(79 * (1 - t) + 124 * t);
        const g = Math.round(70 * (1 - t) + 58 * t);
        const b = Math.round(229 * (1 - t) + 237 * t);

        // Center compass/star highlight
        const angle = Math.atan2(dy, dx);
        const starFactor = Math.abs(Math.sin(angle * 2));
        if (dist <= innerRadius * (0.8 + 0.4 * starFactor)) {
          // Inner icon shape: White / bright cyan
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('extension/icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const pngBuf = generatePng(size);
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated ${outPath} (${pngBuf.length} bytes)`);
}
