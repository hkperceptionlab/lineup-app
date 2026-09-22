/*
 * Generates the app icons from one SVG source: `npm run icons`.
 * The mark is the school's gold M on maroon — it stays readable at 48px on a
 * home screen, which the knight-on-horseback crest does not.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(PUBLIC_DIR, { recursive: true });

const MAROON = "#8E2740";
const GOLD = "#F0A81C";

/** @param {number} pad fraction of the canvas left empty around the mark */
const crest = (pad = 0) => {
  const s = 512;
  const inset = s * pad;
  const box = s - inset * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="${MAROON}"/>
  <g transform="translate(${inset} ${inset}) scale(${box / s})">
    <text x="256" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="330"
          font-weight="700" fill="${GOLD}" text-anchor="middle">M</text>
    <text x="256" y="392" font-family="Georgia, 'Times New Roman', serif" font-size="58"
          fill="${GOLD}" text-anchor="middle" letter-spacing="14">PREP</text>
    <rect x="130" y="418" width="252" height="7" fill="${GOLD}"/>
  </g>
</svg>`;
};

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${MAROON}"/>
  <text x="256" y="356" font-family="Georgia, serif" font-size="340" font-weight="700"
        fill="${GOLD}" text-anchor="middle">M</text>
</svg>`;

writeFileSync(join(PUBLIC_DIR, "favicon.svg"), favicon);

const targets = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  // Maskable icons get cropped to a circle on Android, so the mark needs room.
  ["icon-512-maskable.png", 512, 0.14],
  ["apple-touch-icon.png", 180, 0],
];

for (const [name, size, pad] of targets) {
  await sharp(Buffer.from(crest(pad)))
    .resize(size, size)
    .png()
    .toFile(join(PUBLIC_DIR, name));
  console.log("wrote", name, `${size}x${size}`);
}
console.log("wrote favicon.svg");
