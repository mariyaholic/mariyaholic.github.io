// Tests for worker.js. Run: node test.mjs   (Node 22.13 or later; uses the built-in node:sqlite)
// A small adapter gives node:sqlite the D1 calls that worker.js uses: prepare, bind, run, all, batch.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import worker from './worker.js';

function d1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    run: async () => db.prepare(sql).run(...args),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
  });
  return { prepare: (sql) => stmt(sql), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const env = { DB: d1(db), SALT: 'test-salt', STATS_TOKEN: 'secret-token', ALLOWED_ORIGINS: 'https://mariyaholic.github.io' };
const SITE = 'https://mariyaholic.github.io';
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

const hit = (link, { origin = SITE, ip = '203.0.113.7', ua = BROWSER, body } = {}) =>
  worker.fetch(new Request('https://counter.example/hit', {
    method: 'POST',
    headers: { Origin: origin, 'CF-Connecting-IP': ip, 'User-Agent': ua, 'Content-Type': 'text/plain' },
    body: body ?? JSON.stringify({ link }),
  }), env);
const stats = (token = 'secret-token') =>
  worker.fetch(new Request('https://counter.example/stats', { headers: { Authorization: `Bearer ${token}` } }), env);

let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log('ok', name); }

await check('a click from the site counts', async () => {
  const r = await hit('cubic-acute-sets/pdf');
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), SITE);
});
await check('the same visitor again adds a click, not a unique visitor', async () => {
  assert.equal((await hit('cubic-acute-sets/pdf')).status, 204);
});
await check('a second visitor adds a unique visitor', async () => {
  assert.equal((await hit('cubic-acute-sets/pdf', { ip: '198.51.100.20' })).status, 204);
});
await check('a different link is counted separately', async () => {
  assert.equal((await hit('cubic-acute-sets/archive')).status, 204);
});
await check('another origin is refused', async () => {
  assert.equal((await hit('cubic-acute-sets/pdf', { origin: 'https://evil.example' })).status, 403);
});
await check('a bad link name is refused', async () => {
  assert.equal((await hit('../../etc')).status, 400);
  assert.equal((await hit('x', { body: 'not json' })).status, 400);
  assert.equal((await hit('x', { body: 'a'.repeat(500) })).status, 413);
});
await check('a crawler is not counted', async () => {
  assert.equal((await hit('cubic-acute-sets/pdf', { ua: 'Googlebot/2.1', ip: '192.0.2.1' })).status, 204);
});
await check('stats need the token', async () => {
  assert.equal((await stats('wrong')).status, 401);
});
await check('stats give clicks and unique visitors per link', async () => {
  const r = await stats();
  assert.equal(r.status, 200);
  const { links } = await r.json();
  const pdf = links.find((l) => l.link === 'cubic-acute-sets/pdf');
  const zip = links.find((l) => l.link === 'cubic-acute-sets/archive');
  assert.equal(pdf.clicks, 3);
  assert.equal(pdf.unique_visitors, 2);
  assert.equal(zip.clicks, 1);
  assert.equal(zip.unique_visitors, 1);
  assert.equal(links.length, 2);
});
await check('no raw IP address or user agent is stored', async () => {
  const dump = JSON.stringify(db.prepare('SELECT * FROM uniques').all());
  assert.ok(!dump.includes('203.0.113.7') && !dump.includes('Mozilla'));
});

console.log(`${passed} checks passed`);
