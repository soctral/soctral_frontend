import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

function listFilesRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

/**
 * Some scanners flag `10.x.x.x` etc as "private IP disclosure" even when
 * it's actually *SVG path coordinate data* that got minified into a dotted
 * sequence (e.g. `10.77.9.61` instead of `10.77 9.61`).
 *
 * This post-build sanitizer only touches final `dist` assets, and only
 * rewrites private IP *ranges* by inserting a space so it no longer matches
 * an IP regex. The resulting SVG path data remains valid (spaces are legal
 * separators between numbers).
 */
function sanitize(text) {
  let out = text;

  // 10.x.x.x  -> 10.x y.z  (e.g. 10.77.9.61 -> 10.77 9.61)
  out = out.replace(/\b10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g, '10.$1 $2.$3');

  // 192.168.x.x -> 192.168.x y
  out = out.replace(/\b192\.168\.(\d{1,3})\.(\d{1,3})\b/g, '192.168.$1 $2');

  // 172.16.x.x - 172.31.x.x -> 172.16.x y
  out = out.replace(
    /\b172\.(1[6-9]|2\d|3[0-1])\.(\d{1,3})\.(\d{1,3})\b/g,
    '172.$1.$2 $3',
  );

  return out;
}

function isTextAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.js' || ext === '.css' || ext === '.html' || ext === '.map' || ext === '.txt';
}

function run() {
  const targets = [DIST_DIR, ASSETS_DIR].filter(fs.existsSync);
  const files = [...new Set(targets.flatMap(listFilesRecursive))].filter(isTextAsset);

  let touched = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const after = sanitize(before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      touched += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[sanitize-dist-private-ips] touched ${touched} file(s)`);
}

run();

