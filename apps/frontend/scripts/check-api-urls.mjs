#!/usr/bin/env node
/**
 * Guard: no hard-coded backend URLs in the frontend source.
 *
 * Every API/WS call must resolve its base through src/config/api.ts
 * (`apiUrl()` / `API_BASE_URL` / `WS_BASE_URL`). This keeps a single
 * environment variable in control of where the app talks to.
 *
 * Runs on `npm run check:urls` and as part of `prebuild`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(root, 'src');
const ALLOWLIST = new Set(['src/config/api.ts']);
const PATTERN = /\b(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/;

/** @type {{file:string,line:number,text:string}[]} */
const hits = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue;
    const rel = relative(root, full).replace(/\\/g, '/');
    if (ALLOWLIST.has(rel)) continue;
    readFileSync(full, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        if (PATTERN.test(text)) hits.push({ file: rel, line: i + 1, text: text.trim() });
      });
  }
}

walk(SRC);

if (hits.length) {
  console.error('✗ Hard-coded backend URL(s) found. Use apiUrl()/API_BASE_URL from src/config/api.ts:\n');
  for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
  console.error(`\n${hits.length} occurrence(s).`);
  process.exit(1);
}

console.log('✓ No hard-coded backend URLs in src/.');
