const fs = require('fs');
const path = require('path');

const root = path.resolve('f:/Project/Minisoccer');
const patterns = [
  [/text-[color:var(--muted)]/g, 'text-[color:var(--muted)]'],
  [/text-[color:var(--muted)]/g, 'text-[color:var(--muted)]'],
  [/text-[color:var(--foreground)]/g, 'text-[color:var(--foreground)]'],
];

const exts = ['.tsx', '.ts', '.jsx', '.js'];
let updated = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.includes(path.extname(name.name))) continue;
    let content = fs.readFileSync(full, 'utf8');
    let next = content;
    for (const [pattern, replacement] of patterns) {
      next = next.replace(pattern, replacement);
    }
    if (next !== content) {
      fs.writeFileSync(full, next, 'utf8');
      updated += 1;
    }
  }
}

walk(root);
console.log(`updated ${updated} files`);
