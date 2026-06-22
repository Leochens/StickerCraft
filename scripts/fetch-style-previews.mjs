/**
 * Style preview thumbnails live in public/style-previews/.
 * They are curated per-style sticker illustrations (not random stock photos).
 *
 * To regenerate all 16 previews, recreate images matching each style's promptModifier
 * and save as {style-id}.jpg in public/style-previews/.
 */
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('public/style-previews');
const expected = [
  'classic-cartoon',
  'kawaii-chibi',
  '3d-glossy',
  'vintage-badge',
  'pixel-art',
  'watercolor',
  'neon-cyberpunk',
  'paper-cutout',
  'graffiti',
  'holographic',
  'sketch',
  'anime',
  'flat-emoji',
  'impressionist',
  'stained-glass',
  'psychedelic',
];

const files = await readdir(outDir);
const missing = expected.filter((id) => !files.includes(`${id}.jpg`));

if (missing.length) {
  console.error('Missing preview files:', missing.join(', '));
  process.exit(1);
}

console.log(`All ${expected.length} style previews present in ${outDir}`);
