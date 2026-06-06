// Generates the PWA icons (no external deps) so the manifest + service worker
// have real assets to point at. Run: `node tools/gen-icons.mjs`
//
// Draws an hourglass — the classic "memento mori" symbol — in the app's
// accent green on the dark brand background, rendered with 4x supersampling
// for clean anti-aliased edges. Emits a normal icon and a "maskable" variant
// (extra safe-area padding) at 192px and 512px.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

const BG = [0x11, 0x11, 0x11];   // brand background
const FG = [0x7f, 0xff, 0x7f];   // accent green
const FRAME = [0xe8, 0xe8, 0xe8]; // hourglass frame

// Encode RGBA pixel buffer into a PNG.
function toPng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

// Signed coverage of the hourglass shape at a point in the unit square [0,1].
// Returns 0..1 where 1 = solid sand/frame. `pad` shrinks the glyph for maskable.
function sample(u, v, pad) {
  // Map into a centered design box that leaves margin around the glyph.
  const m = pad;                       // outer margin (fraction)
  const x = (u - 0.5) / (0.5 - m);     // -1..1 across glyph
  const y = (v - 0.5) / (0.5 - m);     // -1..1 down glyph
  if (Math.abs(x) > 1 || Math.abs(y) > 1) return 0;

  const ax = Math.abs(x), ay = Math.abs(y);
  // Two triangles meeting at the waist: width tapers linearly toward center.
  const halfWidth = 0.16 + 0.62 * ay;  // wide at top/bottom, narrow at waist
  const inBulb = ax <= halfWidth && ay <= 0.92;

  // End caps (top and bottom bars of the frame).
  const cap = ay >= 0.82 && ay <= 0.96 && ax <= 0.82;
  return inBulb || cap ? 1 : 0;
}

function render(size, pad) {
  const SS = 4; // supersampling factor
  const big = size * SS;
  const rgba = Buffer.alloc(big * big * 4);
  for (let py = 0; py < big; py++) {
    for (let px = 0; px < big; px++) {
      const u = (px + 0.5) / big;
      const v = (py + 0.5) / big;
      const onGlyph = sample(u, v, pad);
      // Frame uses the cap/edge band; interior uses sand color.
      let color = BG;
      if (onGlyph) {
        const ay = Math.abs((v - 0.5) / (0.5 - pad));
        color = ay >= 0.8 ? FRAME : FG;
      }
      const i = (py * big + px) * 4;
      rgba[i] = color[0]; rgba[i + 1] = color[1]; rgba[i + 2] = color[2]; rgba[i + 3] = 255;
    }
  }
  // Downsample (box filter) to target size for anti-aliasing.
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * big + (x * SS + sx)) * 4;
          r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = 255;
    }
  }
  return toPng(size, size, out);
}

for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), render(size, 0.14));
  writeFileSync(join(OUT, `icon-${size}-maskable.png`), render(size, 0.24));
}
console.log('Wrote icons to', OUT);
