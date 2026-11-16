// Paper click counter: a Cloudflare Worker with a Workers KV namespace.
//
//   POST /hit    body {"link":"cubic-acute-sets/pdf"}  -> 204. Counts one click.
//   GET  /stats  header "Authorization: Bearer <STATS_TOKEN>" -> JSON counts.
//
// Keys in the CLICKS namespace:
//   t:<link>            {"clicks": n, "first_seen": iso, "last_seen": iso}
//   u:<link>:<visitor>  first click time of one visitor on one link
//
// A unique visitor is a keyed hash (HMAC-SHA-256 with the SALT secret) of the client IP address and user agent.
// The raw IP address and user agent are never stored. The same person on a new network or browser counts again,
// so "unique" is an approximation. KV is eventually consistent, so two clicks at the same moment can count as one.
// See README.md.

const LINK_PATTERN = /^[a-z0-9-]{1,40}\/[a-z0-9-]{1,20}$/;
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|fetch|headless|monitor/i;
const MAX_BODY = 200;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/hit' && request.method === 'POST') return hit(request, env, cors);
    if (url.pathname === '/stats' && request.method === 'GET') return stats(request, env);
    return new Response('Not found', { status: 404 });
  },
};

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const headers = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (allowedOrigins(env).includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

async function hit(request, env, cors) {
  const done = () => new Response(null, { status: 204, headers: cors });

  // Only count clicks that come from the site's own pages.
  const origin = request.headers.get('Origin') || '';
  if (!allowedOrigins(env).includes(origin)) return new Response(null, { status: 403, headers: cors });

  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT_PATTERN.test(ua)) return done();

  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors });
  let link;
  try { link = JSON.parse(text).link; } catch { return new Response(null, { status: 400, headers: cors }); }
  if (typeof link !== 'string' || !LINK_PATTERN.test(link)) return new Response(null, { status: 400, headers: cors });

  if (!env.SALT) return new Response('SALT secret is not set', { status: 500, headers: cors });
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const visitor = await keyedHash(env.SALT, `${ip}\n${ua}`);
  const now = new Date().toISOString();

  const uKey = `u:${link}:${visitor}`;
  const tKey = `t:${link}`;
  const [seen, total] = await Promise.all([env.CLICKS.get(uKey), env.CLICKS.get(tKey, 'json')]);
  const next = total
    ? { clicks: total.clicks + 1, first_seen: total.first_seen, last_seen: now }
    : { clicks: 1, first_seen: now, last_seen: now };
  const writes = [env.CLICKS.put(tKey, JSON.stringify(next))];
  if (seen === null) writes.push(env.CLICKS.put(uKey, now));
  await Promise.all(writes);
  return done();
}

async function stats(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.STATS_TOKEN || !(await sameText(auth, `Bearer ${env.STATS_TOKEN}`))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const links = [];
  for (const key of await listAll(env.CLICKS, 't:')) {
    const link = key.slice(2);
    const total = (await env.CLICKS.get(key, 'json')) || { clicks: 0 };
    const uniques = (await listAll(env.CLICKS, `u:${link}:`)).length;
    links.push({ link, clicks: total.clicks, unique_visitors: uniques, first_seen: total.first_seen, last_seen: total.last_seen });
  }
  links.sort((a, b) => a.link.localeCompare(b.link));
  return new Response(JSON.stringify({ generated_at: new Date().toISOString(), links }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function listAll(kv, prefix) {
  const names = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor });
    for (const k of page.keys) names.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return names;
}

async function keyedHash(secret, text) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Compare two strings in time that does not depend on where they differ.
async function sameText(a, b) {
  const [ha, hb] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
