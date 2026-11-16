// Tests for worker.js. Run: node test.mjs   (Node 22 or later)
// A small in-memory stand-in gives the KV calls that worker.js uses: get, put, list (with prefix and cursor).
import assert from 'node:assert/strict';
import worker from './worker.js';

function memoryKV(pageSize = 2) {
  const store = new Map();
  return {
    store,
    async get(key, type) { const v = store.has(key) ? store.get(key) : null; return v !== null && type === 'json' ? JSON.parse(v) : v; },
    async put(key, value) { store.set(key, String(value)); },
    async list({ prefix = '', cursor } = {}) {
      const names = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const keys = names.slice(start, start + pageSize).map((name) => ({ name }));
      const done = start + pageSize >= names.length;
      return { keys, list_complete: done, cursor: done ? undefined : String(start + pageSize) };
    },
  };
}

const kv = memoryKV();
const env = { CLICKS: kv, SALT: 'test-salt', STATS_TOKEN: 'secret-token', ALLOWED_ORIGINS: 'https://mariyaholic.github.io' };
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
await check('a third visitor makes the unique list span more than one page', async () => {
  assert.equal((await hit('cubic-acute-sets/pdf', { ip: '198.51.100.21' })).status, 204);
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
  assert.equal(pdf.clicks, 4);
  assert.equal(pdf.unique_visitors, 3);
  assert.equal(zip.clicks, 1);
  assert.equal(zip.unique_visitors, 1);
  assert.equal(links.length, 2);
});
await check('no raw IP address or user agent is stored', async () => {
  const dump = JSON.stringify([...kv.store]);
  assert.ok(!dump.includes('203.0.113.7') && !dump.includes('Mozilla'));
});

console.log(`${passed} checks passed`);
