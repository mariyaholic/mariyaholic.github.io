#!/usr/bin/env node
// Sync release versions from GitHub into the HTML pages.
//
// Mark a version in a page like this:
//   <!--ver:yozora-->v0.2.2<!--/ver-->
// The slug is the repository name under github.com/mariyaholic. The script
// replaces every version number between the markers with the tag of the
// latest GitHub release, so links such as .../releases/tag/v0.2.2 update too.
// A repository with no release is left unchanged.
//
// Usage: node scripts/sync-versions.mjs [--check]
//   --check  Report stale versions and exit 1 without writing files.
// Set GITHUB_TOKEN to raise the API rate limit.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNER = 'mariyaholic';
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SKIP = new Set(['.git', 'node_modules', 'gallery', 'proposals', 'studies']);
const MARKER = /<!--ver:([\w.-]+)-->([\s\S]*?)<!--\/ver-->/g;
const VERSION = /v?\d+\.\d+\.\d+(?:-[\w.]+)?/g;
const check = process.argv.includes('--check');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'sync-versions' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const cache = new Map();
async function latestTag(repo) {
  if (!cache.has(repo)) {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases/latest`, { headers });
    if (res.status === 404) cache.set(repo, null);
    else if (!res.ok) throw new Error(`${repo}: GitHub API returned ${res.status}`);
    else cache.set(repo, (await res.json()).tag_name);
  }
  return cache.get(repo);
}

let stale = 0;
for (const file of htmlFiles(ROOT)) {
  const src = readFileSync(file, 'utf8');
  const slugs = [...new Set([...src.matchAll(MARKER)].map((m) => m[1]))];
  if (!slugs.length) continue;
  for (const slug of slugs) await latestTag(slug);
  const out = src.replace(MARKER, (block, slug, body) => {
    const tag = cache.get(slug);
    if (!tag) return block;
    return `<!--ver:${slug}-->${body.replace(VERSION, tag)}<!--/ver-->`;
  });
  if (out === src) continue;
  stale++;
  console.log(`${check ? 'stale' : 'updated'}: ${relative(ROOT, file)}`);
  if (!check) writeFileSync(file, out);
}

for (const [repo, tag] of cache) console.log(`${repo}: ${tag ?? 'no release'}`);
if (check && stale) process.exit(1);
