'use strict';

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
/* eslint-enable @typescript-eslint/no-var-requires */

// Recursively find files matching a pattern
function findFiles(dir, regex) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...findFiles(full, regex));
    } else if (entry.isFile() && regex.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const root = path.resolve(__dirname, '../../src');
const files = [
  ...findFiles(path.join(root, 'models'), /\.(model|entity)\.ts$/),
  ...findFiles(path.join(root, 'entities'), /\.(model|entity)\.ts$/),
];

const words = new Set();
// Match name: 'column_name' or name: "column_name" inside decorators
const NAME_RE = /name:\s*['"]([a-z][a-z0-9_]*)["']/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = NAME_RE.exec(content)) !== null) {
    for (const seg of m[1].split('_').filter(Boolean)) {
      // Accept segments that are all lowercase letters (2+ chars) or end with digits
      if (/^[a-z][a-z0-9]*$/.test(seg)) {
        words.add(seg);
      }
    }
  }
}

const sorted = [...words].sort();
const out = path.resolve(__dirname, '../data/domain-words.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(sorted, null, 2) + '\n');
console.log(`✓ Generated ${sorted.length} domain words → ${path.relative(process.cwd(), out)}`);
