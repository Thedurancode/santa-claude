/* Stack Threads store server: checkout, analytics and the admin panel's API.

   POST /                 bag → Stripe Checkout session (returns { url })
   POST /webhook          Stripe "checkout.session.completed" → order saved, and the
                          Purchase sent to Meta Conversions API, TikTok Events API and
                          GA4 with the Stripe session ID as the event ID, so the browser
                          pixel and the server copy are counted once.
   POST /e                one visitor event from the shop (page, view, add, checkout, lead)
   GET  /config           pixel IDs and product changes saved in the admin panel
   POST /admin/login      password → admin token
   GET  /admin/stats      traffic, sources, countries, products, funnel (?days=7)
   GET  /admin/live       visitors on the site right now
   GET  /admin/orders     paid orders and held orders
   GET  /admin/settings   pixels, server tokens and product changes
   PUT  /admin/settings
   POST /mcp              MCP server (Streamable HTTP) so AI agents can read stats and change
                          prices, products and pixels. Needs the MCP_TOKEN secret; send it as
                          "Authorization: Bearer <token>" or as ?key=<token> on the URL.

   Bindings and settings (Cloudflare → Worker → Settings; mark keys as Secret):
     DB                      D1 database binding (stores visits, orders, settings)
     ADMIN_PASSWORD          password for the admin panel
     MCP_TOKEN               key for AI agents using /mcp (long and random)
     STRIPE_SECRET_KEY       sk_test_… or sk_live_…
     SITE_URL                https://thedurancode.github.io/santa-claude/ (the shop's address)
     STRIPE_WEBHOOK_SECRET   whsec_… from the Stripe webhook you create
   Pixel IDs and conversion tokens are entered in the admin panel. The old
   variables (META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_EVENT_CODE,
   TIKTOK_PIXEL_ID, TIKTOK_EVENTS_TOKEN, GA4_ID, GA4_API_SECRET) still work and
   are used when the admin field is empty.

   Prices come from the CATALOG below, or from a price set in the admin panel,
   never from the browser. */

const CATALOG = {
  "currency": "usd",
  "sizes": [
    "M",
    "L",
    "XL"
  ],
  "products": {
    "santa-hoodie": {
      "name": "Santa Claude hoodie",
      "price": 68.0,
      "photo": "assets/p/santa-hoodie.jpg"
    },
    "compact-hoodie": {
      "name": "Claude /compact hoodie",
      "price": 68.0,
      "photo": "assets/p/compact-hoodie.jpg"
    },
    "wishlist-hoodie": {
      "name": "Claude Wrote My Wishlist hoodie",
      "price": 68.0,
      "photo": "assets/p/wishlist-hoodie.jpg"
    },
    "snow-hoodie": {
      "name": "let it snow hoodie",
      "price": 68.0,
      "photo": "assets/p/snow-hoodie.jpg"
    },
    "prompt-actually": {
      "name": "Prompt Actually hoodie",
      "price": 68.0,
      "photo": "assets/p/prompt-actually.jpg"
    },
    "ship-friday": {
      "name": "Ship It on Friday hoodie",
      "price": 68.0,
      "photo": "assets/p/ship-friday.jpg"
    },
    "silent-night": {
      "name": "Silent Night, Loud Bugs hoodie",
      "price": 68.0,
      "photo": "assets/p/silent-night.jpg"
    },
    "vibe-xmas": {
      "name": "Vibe Coding Till Xmas hoodie",
      "price": 68.0,
      "photo": "assets/p/vibe-xmas.jpg"
    },
    "one-more-prompt": {
      "name": "Just One More Prompt hoodie",
      "price": 68.0,
      "photo": "assets/p/one-more-prompt.jpg"
    },
    "context-full": {
      "name": "Context Window Full hoodie",
      "price": 68.0,
      "photo": "assets/p/context-full.jpg"
    },
    "agent-workshop": {
      "name": "Agent Workshop hoodie",
      "price": 68.0,
      "photo": "assets/p/agent-workshop.jpg"
    },
    "green-build": {
      "name": "All I Want Is One Green Build hoodie",
      "price": 68.0,
      "photo": "assets/p/green-build.jpg"
    },
    "santa-knit": {
      "name": "Santa Claude knit sweater",
      "price": 84.0,
      "photo": "assets/p/santa-knit.jpg"
    },
    "compact-knit": {
      "name": "Claude /compact knit sweater",
      "price": 84.0,
      "photo": "assets/p/compact-knit.jpg"
    },
    "wishlist-knit": {
      "name": "Claude Wrote My Wishlist knit sweater",
      "price": 84.0,
      "photo": "assets/p/wishlist-knit.jpg"
    },
    "snow-knit": {
      "name": "let it snow knit sweater",
      "price": 84.0,
      "photo": "assets/p/snow-knit.jpg"
    },
    "works-on-my-machine": {
      "name": "It Works On My Machine hoodie",
      "price": 64.0,
      "photo": "assets/p/works-on-my-machine.png"
    },
    "localhost": {
      "name": "No Place Like 127.0.0.1 hoodie",
      "price": 64.0,
      "photo": "assets/p/localhost.png"
    },
    "not-a-bug": {
      "name": "Not A Bug hoodie",
      "price": 64.0,
      "photo": "assets/p/not-a-bug.png"
    },
    "touch-grass": {
      "name": "TODO: Touch Grass hoodie",
      "price": 64.0,
      "photo": "assets/p/touch-grass.png"
    },
    "merge-conflicts": {
      "name": "Merge Conflicts Build Character hoodie",
      "price": 64.0,
      "photo": "assets/p/merge-conflicts.png"
    },
    "deploy-friday": {
      "name": "I Deploy On Fridays hoodie",
      "price": 64.0,
      "photo": "assets/p/deploy-friday.png"
    },
    "exit-zero": {
      "name": "Exit 0 hoodie",
      "price": 64.0,
      "photo": "assets/p/exit-zero.png"
    },
    "while-alive": {
      "name": "while (alive) hoodie",
      "price": 64.0,
      "photo": "assets/p/while-alive.png"
    },
    "hello-world": {
      "name": "Hello, World. tee",
      "price": 32.0,
      "photo": "assets/p/hello-world.png"
    },
    "sleep-not-found": {
      "name": "404 Sleep Not Found tee",
      "price": 32.0,
      "photo": "assets/p/sleep-not-found.png"
    },
    "code-coffee-repeat": {
      "name": "Code. Coffee. Repeat. tee",
      "price": 32.0,
      "photo": "assets/p/code-coffee-repeat.png"
    },
    "dark-mode": {
      "name": "Dark Mode Only tee",
      "price": 32.0,
      "photo": "assets/p/dark-mode.png"
    },
    "ctrl-z-knit": {
      "name": "Ctrl+Z knit sweater",
      "price": 84.0,
      "photo": "assets/p/ctrl-z-knit.png"
    },
    "cozy-mode-knit": {
      "name": "Cozy Mode knit sweater",
      "price": 84.0,
      "photo": "assets/p/cozy-mode-knit.png"
    },
    "out-of-office-knit": {
      "name": "Out Of Office knit sweater",
      "price": 84.0,
      "photo": "assets/p/out-of-office-knit.png"
    },
    "binary-hi-knit": {
      "name": "Binary Hi knit sweater",
      "price": 84.0,
      "photo": "assets/p/binary-hi-knit.png"
    }
  },
  "bundle": {
    "qty": 2,
    "percentOff": 15.0
  },
  "freeShippingOver": 100.0,
  "shippingCents": 800
};

const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => s ? hex(await crypto.subtle.digest('SHA-256', enc.encode(String(s).trim().toLowerCase()))) : undefined;
const clip = (s, n) => String(s == null ? '' : s).slice(0, n || 400);
const json = (body, status, headers) => new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, headers || {}) });

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/webhook') return webhook(req, env, ctx);
    if (path === '/mcp') return mcp(req, env);

    const site = new URL(env.SITE_URL);
    const origin = req.headers.get('Origin') || '';
    const allowed = origin === site.origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const h = {
      'Access-Control-Allow-Origin': allowed ? origin : site.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    try {
      if (path === '/e') return await collect(req, env, allowed);
      if (path === '/config') return await publicConfig(env, h);
      if (path === '/admin/login') return await login(req, env, h);
      if (path.startsWith('/admin/')) {
        if (!(await authed(req, env))) return json({ error: 'Sign in again' }, 401, h);
        if (path === '/admin/stats') return await stats(url, env, h);
        if (path === '/admin/live') return await live(env, h);
        if (path === '/admin/orders') return await orders(env, h);
        if (path === '/admin/settings') return req.method === 'PUT' ? await saveSettings(req, env, h) : json(redact(await getSettings(env)), 200, h);
        return json({ error: 'Not found' }, 404, h);
      }
      if (path === '/') {
        if (req.method !== 'POST') return json({ ok: true, service: 'Stack Threads store server' }, 200, h);
        if (!allowed) return json({ error: 'Not allowed' }, 403, h);
        return await createSession(req, env, h);
      }
      return json({ error: 'Not found' }, 404, h);
    } catch (e) {
      return json({ error: 'Server error', detail: String(e && e.message || e) }, 500, h);
    }
  }
};

/* ───────── database ───────── */
let ready = null;
const ensure = env => {
  if (!env.DB) return Promise.resolve(false);
  if (!ready) ready = env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, vid TEXT, sid TEXT, type TEXT, path TEXT, product TEXT, qty INTEGER, value REAL,
      country TEXT, region TEXT, city TEXT, lat REAL, lon REAL, source TEXT, medium TEXT, campaign TEXT, ref TEXT, device TEXT)`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS events_ts ON events(ts)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS events_sid ON events(sid)'),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, ts INTEGER, kind TEXT, name TEXT, email TEXT, value REAL, currency TEXT, items TEXT,
      country TEXT, city TEXT, source TEXT, medium TEXT, campaign TEXT, sid TEXT)`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS orders_ts ON orders(ts)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT)')
  ]).then(() => true).catch(e => { ready = null; throw e; });
  return ready;
};

const DEFAULTS = {
  pixels: { metaPixelId: '', tiktokPixelId: '', ga4Id: '', googleAdsId: '', googleAdsPurchaseLabel: '', gtmId: '', pinterestTagId: '', snapPixelId: '' },
  server: { metaCapiToken: '', metaTestEventCode: '', tiktokEventsToken: '', ga4ApiSecret: '' },
  products: {}
};
async function getSettings(env) {
  const out = JSON.parse(JSON.stringify(DEFAULTS));
  if (!(await ensure(env))) return out;
  const row = await env.DB.prepare("SELECT v FROM settings WHERE k = 'site'").first();
  if (row) { try { const v = JSON.parse(row.v); ['pixels', 'server', 'products'].forEach(k => Object.assign(out[k], v[k] || {})); } catch (e) {} }
  return out;
}
const ID = /^[A-Za-z0-9_\-]{0,80}$/;
async function saveSettings(req, env, h) {
  if (!(await ensure(env))) return json({ error: 'Database not connected' }, 500, h);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'Bad request' }, 400, h); }
  const r = await writeSettings(env, b);
  return r.error ? json({ error: r.error }, 400, h) : json(Object.assign({ saved: true }, redact(r.settings)), 200, h);
}
// Shared by the admin panel and the MCP tools.
async function writeSettings(env, b) {
  const cur = await getSettings(env);
  const bad = [];
  const pick = (src, keys, max, rx) => { const o = {}; keys.forEach(k => { const v = clip(src && src[k], max).trim(); if (rx && v && !rx.test(v)) bad.push(k); o[k] = v; }); return o; };
  if (b.pixels) cur.pixels = pick(b.pixels, Object.keys(DEFAULTS.pixels), 80, ID);
  if (b.server) { // empty means "keep the saved value"; send "-" to clear
    const s = pick(b.server, Object.keys(DEFAULTS.server), 600);
    Object.keys(s).forEach(k => { if (s[k] === '-') cur.server[k] = ''; else if (s[k]) cur.server[k] = s[k]; });
  }
  if (b.products && typeof b.products === 'object') {
    const p = {};
    Object.keys(b.products).forEach(id => {
      if (!CATALOG.products[id]) return;
      const x = b.products[id] || {}, o = {};
      const price = parseFloat(x.price);
      if (x.price !== '' && x.price != null) { if (isFinite(price) && price > 0 && price < 10000) o.price = Math.round(price * 100) / 100; else bad.push(id + ' price'); }
      if (x.badge) o.badge = clip(x.badge, 24).trim();
      if (x.hidden) o.hidden = true;
      ['metaPixelId', 'tiktokPixelId', 'googleAdsLabel'].forEach(k => { const v = clip(x[k], 80).trim(); if (v && !ID.test(v)) bad.push(id + ' ' + k); else if (v) o[k] = v; });
      if (Object.keys(o).length) p[id] = o;
    });
    cur.products = p;
  }
  if (bad.length) return { error: 'Check these fields: ' + bad.join(', ') };
  await env.DB.prepare("INSERT INTO settings (k, v) VALUES ('site', ?1) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(cur)).run();
  return { settings: cur };
}
// Tokens are write-only from the admin panel: it sees whether one is set, never the value.
const redact = s => Object.assign({}, s, { server: Object.fromEntries(Object.entries(s.server).map(([k, v]) => [k, v ? '•••• ' + v.slice(-4) : ''])) });

async function publicConfig(env, h) {
  const s = await getSettings(env);
  return json({ pixels: s.pixels, products: s.products, at: Date.now() }, 200, Object.assign({}, h, { 'Cache-Control': 'public, max-age=30' }));
}

/* ───────── visitor events ───────── */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|facebookexternalhit|bingpreview|embedly|python-requests|curl|wget/i;
const TYPES = ['page', 'view', 'add', 'checkout', 'lead'];
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|brave|startpage|kagi)\./;
const SOCIAL = { 'facebook': 'facebook', 'fb.': 'facebook', 'instagram': 'instagram', 't.co': 'x', 'twitter': 'x', 'x.com': 'x', 'tiktok': 'tiktok', 'reddit': 'reddit', 'linkedin': 'linkedin', 'lnkd': 'linkedin', 'youtube': 'youtube', 'pinterest': 'pinterest', 'snapchat': 'snapchat', 'threads': 'threads', 'news.ycombinator': 'hacker news', 'bsky': 'bluesky', 'github': 'github', 'discord': 'discord' };

// Where the visit came from: campaign tags first, then ad click IDs, then the referring site.
function classify(a, ref, siteHost) {
  a = a || {};
  let host = '';
  try { host = ref ? new URL(ref).hostname.replace(/^(www|m|l|lm)\./, '') : ''; } catch (e) {}
  if (host === siteHost) host = '';
  const lc = s => clip(s, 80).trim().toLowerCase();
  if (a.utm_source) return { source: lc(a.utm_source), medium: lc(a.utm_medium) || (a.fbclid || a.ttclid || a.gclid ? 'paid' : 'campaign'), campaign: clip(a.utm_campaign, 120).trim(), ref: host };
  if (a.gclid || a.gbraid || a.wbraid) return { source: 'google', medium: 'paid', campaign: '', ref: host };
  if (a.fbclid) return { source: host.includes('instagram') ? 'instagram' : 'facebook', medium: 'paid', campaign: '', ref: host };
  if (a.ttclid) return { source: 'tiktok', medium: 'paid', campaign: '', ref: host };
  if (a.msclkid) return { source: 'bing', medium: 'paid', campaign: '', ref: host };
  if (a.epik) return { source: 'pinterest', medium: 'paid', campaign: '', ref: host };
  if (a.ScCid) return { source: 'snapchat', medium: 'paid', campaign: '', ref: host };
  if (!host) return { source: 'direct', medium: 'none', campaign: '', ref: '' };
  if (SEARCH.test('.' + host)) return { source: host.split('.').slice(-2)[0], medium: 'organic', campaign: '', ref: host };
  const k = Object.keys(SOCIAL).find(s => host.includes(s));
  if (k) return { source: SOCIAL[k], medium: 'social', campaign: '', ref: host };
  return { source: host, medium: 'referral', campaign: '', ref: host };
}
const device = ua => /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) ? 'tablet' : /Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(ua) ? 'mobile' : 'desktop';
const geo = req => {
  const cf = req.cf || {};
  const n = v => { const x = parseFloat(v); return isFinite(x) ? Math.round(x * 100) / 100 : null; };
  return { country: clip(cf.country, 2) || '', region: clip(cf.region, 80), city: clip(cf.city, 80), lat: n(cf.latitude), lon: n(cf.longitude) };
};

async function collect(req, env, allowed) {
  const ok = new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  if (req.method !== 'POST' || !allowed) return ok;
  const ua = req.headers.get('User-Agent') || '';
  if (BOT.test(ua) || !(await ensure(env))) return ok;
  let b; try { b = JSON.parse(await req.text()); } catch (e) { return ok; }
  if (!b || !TYPES.includes(b.t) || !/^[a-z0-9]{6,32}$/i.test(b.vid || '') || !/^[a-z0-9]{6,32}$/i.test(b.sid || '')) return ok;
  const g = geo(req), src = classify(b.a, b.r, new URL(env.SITE_URL).hostname.replace(/^www\./, ''));
  const items = (Array.isArray(b.i) ? b.i : []).slice(0, 20).filter(i => i && CATALOG.products[i.id]);
  const row = [Date.now(), b.vid, b.sid, b.t, clip(b.p, 200), '', 0, 0, g.country, g.region, g.city, g.lat, g.lon, src.source, src.medium, src.campaign, src.ref, device(ua)];
  const ins = 'INSERT INTO events (ts, vid, sid, type, path, product, qty, value, country, region, city, lat, lon, source, medium, campaign, ref, device) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)';
  const stmts = [];
  if (b.t === 'page' || !items.length) stmts.push(env.DB.prepare(ins).bind(...row));
  else items.forEach(i => { const r = row.slice(); r[5] = i.id; r[6] = Math.max(1, Math.min(10, parseInt(i.qty, 10) || 1)); r[7] = Math.round((parseFloat(i.price) || 0) * r[6] * 100) / 100; stmts.push(env.DB.prepare(ins).bind(...r)); });
  if (b.t === 'lead' && b.who && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.who.email || '')) {
    const value = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.qty, 10) || 1), 0);
    stmts.push(env.DB.prepare('INSERT OR REPLACE INTO orders (id, ts, kind, name, email, value, currency, items, country, city, source, medium, campaign, sid) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)')
      .bind('lead-' + b.sid, Date.now(), b.hold ? 'hold' : 'started', clip(b.who.name, 120), clip(b.who.email, 200), Math.round(value * 100) / 100, CATALOG.currency.toUpperCase(),
        JSON.stringify(items.map(i => ({ id: i.id, size: clip(i.variant, 8), qty: parseInt(i.qty, 10) || 1, price: parseFloat(i.price) || 0 }))), g.country, g.city, src.source, src.medium, src.campaign, b.sid));
  }
  await env.DB.batch(stmts);
  return ok;
}

/* ───────── admin sign-in ───────── */
const hmac = async (key, msg) => hex(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(msg)));
async function login(req, env, h) {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405, h);
  if (!env.ADMIN_PASSWORD) return json({ error: 'Set ADMIN_PASSWORD on the server first' }, 500, h);
  let b; try { b = await req.json(); } catch (e) { b = {}; }
  // Compare HMACs rather than the raw strings, so timing says nothing about the password.
  const [a, c] = await Promise.all([hmac('pw', String(b.password || '')), hmac('pw', env.ADMIN_PASSWORD)]);
  if (a !== c) { await new Promise(r => setTimeout(r, 700)); return json({ error: 'That password isn’t right' }, 401, h); }
  const exp = Date.now() + 14 * 864e5;
  return json({ token: exp + '.' + await hmac(env.ADMIN_PASSWORD, 'admin.' + exp), exp }, 200, h);
}
async function authed(req, env) {
  const t = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/, '');
  const [exp, sig] = t.split('.');
  if (!env.ADMIN_PASSWORD || !exp || !sig || Number(exp) < Date.now()) return false;
  return sig === await hmac(env.ADMIN_PASSWORD, 'admin.' + exp);
}

/* ───────── admin numbers ───────── */
async function stats(url, env, h) {
  if (!(await ensure(env))) return json({ error: 'Database not connected' }, 500, h);
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get('days'), 10) || 7));
  const off = Math.max(-840, Math.min(840, parseInt(url.searchParams.get('tz'), 10) || 0)) * 60; // browser offset in minutes → seconds
  const now = Date.now();
  // "Today" starts at local midnight; longer ranges are whole local days ending today.
  const dayMs = 864e5, localNow = now + off * 1000;
  const from = Math.floor(localNow / dayMs) * dayMs - off * 1000 - (days - 1) * dayMs;
  const prevFrom = from - days * dayMs;
  const D = env.DB, R = 'ts >= ?1 AND ts < ?2';
  const totalsSql = `SELECT COUNT(DISTINCT vid) visitors, COUNT(DISTINCT sid) sessions, COALESCE(SUM(type = 'page'), 0) pageviews,
      COUNT(DISTINCT CASE WHEN type = 'view' THEN sid END) viewed, COUNT(DISTINCT CASE WHEN type = 'add' THEN sid END) added,
      COUNT(DISTINCT CASE WHEN type = 'checkout' THEN sid END) checkout, COUNT(DISTINCT CASE WHEN type = 'lead' THEN sid END) details,
      COUNT(DISTINCT CASE WHEN type = 'purchase' THEN sid END) bought FROM events WHERE ${R} AND type != 'sold'`;
  const orderSql = `SELECT COUNT(*) orders, COALESCE(SUM(value), 0) revenue FROM orders WHERE kind = 'paid' AND ${R}`;
  const q = (sql, a, b) => D.prepare(sql).bind(a, b);
  const [cur, prev, ord, prevOrd, daily, dailyOrd, countries, cities, sources, campaigns, products, sold, devices, refs] = await D.batch([
    q(totalsSql, from, now), q(totalsSql, prevFrom, from), q(orderSql, from, now), q(orderSql, prevFrom, from),
    D.prepare(`SELECT CAST((ts / 1000 + ?3) / 86400 AS INTEGER) d, COUNT(DISTINCT vid) visitors, COUNT(DISTINCT CASE WHEN type = 'add' THEN sid END) added FROM events WHERE ${R} AND type != 'sold' GROUP BY d`).bind(from, now, off),
    D.prepare(`SELECT CAST((ts / 1000 + ?3) / 86400 AS INTEGER) d, COUNT(*) orders, SUM(value) revenue FROM orders WHERE kind = 'paid' AND ${R} GROUP BY d`).bind(from, now, off),
    q(`SELECT country, COUNT(DISTINCT vid) visitors, COUNT(DISTINCT CASE WHEN type = 'add' THEN sid END) added, COUNT(DISTINCT CASE WHEN type = 'purchase' THEN sid END) orders, COALESCE(SUM(CASE WHEN type = 'purchase' THEN value END), 0) revenue FROM events WHERE ${R} AND country != '' GROUP BY country ORDER BY visitors DESC LIMIT 60`, from, now),
    q(`SELECT city, region, country, ROUND(AVG(lat), 2) lat, ROUND(AVG(lon), 2) lon, COUNT(DISTINCT vid) visitors, COUNT(DISTINCT CASE WHEN type = 'purchase' THEN sid END) orders FROM events WHERE ${R} AND lat IS NOT NULL GROUP BY country, city ORDER BY visitors DESC LIMIT 400`, from, now),
    q(`SELECT source, medium, COUNT(DISTINCT vid) visitors, COUNT(DISTINCT CASE WHEN type = 'add' THEN sid END) added, COUNT(DISTINCT CASE WHEN type = 'checkout' THEN sid END) checkout, COUNT(DISTINCT CASE WHEN type = 'purchase' THEN sid END) orders, COALESCE(SUM(CASE WHEN type = 'purchase' THEN value END), 0) revenue FROM events WHERE ${R} GROUP BY source, medium ORDER BY visitors DESC LIMIT 40`, from, now),
    q(`SELECT source, campaign, COUNT(DISTINCT vid) visitors, COUNT(DISTINCT CASE WHEN type = 'add' THEN sid END) added, COUNT(DISTINCT CASE WHEN type = 'purchase' THEN sid END) orders, COALESCE(SUM(CASE WHEN type = 'purchase' THEN value END), 0) revenue FROM events WHERE ${R} AND campaign != '' GROUP BY source, campaign ORDER BY visitors DESC LIMIT 40`, from, now),
    q(`SELECT product, COUNT(DISTINCT CASE WHEN type = 'view' THEN sid END) viewed, COALESCE(SUM(CASE WHEN type = 'add' THEN qty END), 0) added FROM events WHERE ${R} AND product != '' GROUP BY product`, from, now),
    q(`SELECT product, COALESCE(SUM(qty), 0) sold, COALESCE(SUM(value), 0) revenue FROM events WHERE ${R} AND type = 'sold' GROUP BY product`, from, now),
    q(`SELECT device, COUNT(DISTINCT vid) visitors FROM events WHERE ${R} GROUP BY device ORDER BY visitors DESC`, from, now),
    q(`SELECT ref, COUNT(DISTINCT vid) visitors FROM events WHERE ${R} AND ref != '' GROUP BY ref ORDER BY visitors DESC LIMIT 20`, from, now)
  ]);
  const one = r => (r.results && r.results[0]) || {};
  const soldBy = Object.fromEntries(sold.results.map(r => [r.product, r]));
  const prods = products.results;
  sold.results.forEach(r => { if (!prods.some(p => p.product === r.product)) prods.push({ product: r.product, viewed: 0, added: 0 }); });
  return json({
    days, from, to: now, tz: off / 60, startDay: Math.floor((from / 1000 + off) / 86400),
    totals: Object.assign(one(cur), one(ord)), previous: Object.assign(one(prev), one(prevOrd)),
    daily: daily.results, dailyOrders: dailyOrd.results,
    countries: countries.results, cities: cities.results, sources: sources.results, campaigns: campaigns.results,
    products: prods.map(r => Object.assign(r, { sold: (soldBy[r.product] || {}).sold || 0, revenue: (soldBy[r.product] || {}).revenue || 0 })),
    devices: devices.results, referrers: refs.results
  }, 200, h);
}

async function live(env, h) {
  if (!(await ensure(env))) return json({ error: 'Database not connected' }, 500, h);
  const now = Date.now(), D = env.DB;
  const [on, map, feed] = await D.batch([
    D.prepare('SELECT COUNT(DISTINCT vid) n FROM events WHERE ts >= ?1').bind(now - 5 * 6e4),
    D.prepare("SELECT city, country, ROUND(AVG(lat), 2) lat, ROUND(AVG(lon), 2) lon, COUNT(DISTINCT vid) visitors, MAX(ts) last FROM events WHERE ts >= ?1 AND lat IS NOT NULL GROUP BY country, city").bind(now - 30 * 6e4),
    D.prepare("SELECT ts, vid, type, path, product, qty, value, country, region, city, source, medium, campaign, device FROM events WHERE ts >= ?1 AND type != 'sold' ORDER BY ts DESC LIMIT 60").bind(now - 24 * 36e5)
  ]);
  return json({ now, online: (on.results[0] || {}).n || 0, places: map.results, feed: feed.results }, 200, h);
}

async function orders(env, h) {
  if (!(await ensure(env))) return json({ error: 'Database not connected' }, 500, h);
  const r = await env.DB.prepare('SELECT * FROM orders ORDER BY ts DESC LIMIT 300').all();
  return json({ orders: r.results.map(o => Object.assign(o, { items: (() => { try { return JSON.parse(o.items || '[]'); } catch (e) { return []; } })() })) }, 200, h);
}

/* ───────── MCP server for AI agents ─────────
   JSON-RPC over Streamable HTTP (plain JSON responses, no streaming). Tools
   reuse the same code as the admin panel, so an agent sees and changes exactly
   what the panel does. */
const MCP_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const PIXEL_PROPS = {
  metaPixelId: 'Meta (Facebook/Instagram) pixel ID', tiktokPixelId: 'TikTok pixel ID', ga4Id: 'Google Analytics 4 measurement ID, G-…',
  googleAdsId: 'Google Ads ID, AW-…', googleAdsPurchaseLabel: 'Google Ads purchase conversion label', gtmId: 'Google Tag Manager ID, GTM-…',
  pinterestTagId: 'Pinterest tag ID', snapPixelId: 'Snapchat pixel ID'
};
const SERVER_PROPS = {
  metaCapiToken: 'Meta Conversions API access token', metaTestEventCode: 'Meta test event code',
  tiktokEventsToken: 'TikTok Events API access token', ga4ApiSecret: 'GA4 Measurement Protocol API secret'
};
const str = d => ({ type: 'string', description: d });
const MCP_TOOLS = () => [
  { name: 'get_overview', title: 'Store overview',
    description: 'Sales and traffic for a period: visitors, orders, revenue, conversion rate, the visit-to-sale funnel, countries, cities (with coordinates), traffic sources, campaigns, devices, referring sites and views/adds/sales per design. Includes the previous period for comparison. Revenue is in USD.',
    annotations: { readOnlyHint: true },
    inputSchema: { type: 'object', properties: { days: { type: 'integer', minimum: 1, maximum: 365, description: '1 = today so far, 7 = last 7 days (default), 30, 90…' }, timezone_offset_minutes: { type: 'integer', description: 'Minutes east of UTC for day boundaries, e.g. -300 for US Eastern in winter. Default 0 (UTC).' } } } },
  { name: 'get_live', title: 'Live visitors',
    description: 'Visitors on the shop in the last 5 minutes, the cities they are in (last 30 minutes), and the latest 60 visitor events from the past 24 hours (page views, design views, adds to bag, checkouts, purchases) with source and place.',
    annotations: { readOnlyHint: true }, inputSchema: { type: 'object', properties: {} } },
  { name: 'list_orders', title: 'List orders',
    description: 'Orders, newest first. kind "paid" = paid through Stripe; "hold" = shopper left name and email to hold sizes while payment was off; "started" = went to payment but did not finish (good for follow-up emails). Includes name, email, items, total, traffic source and place.',
    annotations: { readOnlyHint: true },
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['paid', 'hold', 'started', 'all'], description: 'Default "all"' }, limit: { type: 'integer', minimum: 1, maximum: 300, description: 'Default 50' } } } },
  { name: 'list_products', title: 'List products',
    description: 'Every design in the shop: id, name, type, default price, current price, badge, whether it is shown on the shop, and any pixels set just for that design. Use the id with update_product.',
    annotations: { readOnlyHint: true }, inputSchema: { type: 'object', properties: {} } },
  { name: 'update_product', title: 'Update a product',
    description: 'Change one design. Only the fields you pass change. The shop shows the change within about a minute, and checkout charges the new price. Pass price null to go back to the default price; badge "" for the default badge or "-" for no badge; empty string clears a pixel.',
    annotations: { destructiveHint: false, idempotentHint: true },
    inputSchema: { type: 'object', required: ['id'], properties: {
      id: { type: 'string', enum: Object.keys(CATALOG.products), description: 'Design id from list_products' },
      price: { type: ['number', 'null'], exclusiveMinimum: 0, description: 'Price in USD' },
      badge: { type: 'string', maxLength: 24, description: 'Short label on the product card, e.g. "Bestseller"' },
      hidden: { type: 'boolean', description: 'true hides the design from the shop and blocks checkout for it' },
      metaPixelId: str('Extra Meta pixel that gets this design\'s events'), tiktokPixelId: str('Extra TikTok pixel for this design'), googleAdsLabel: str('Google Ads conversion label for sales of this design')
    } } },
  { name: 'get_tracking_settings', title: 'Tracking settings',
    description: 'The ad pixel IDs loaded on the shop, and which server-side conversion tokens are saved (tokens are never revealed, only their last 4 characters).',
    annotations: { readOnlyHint: true }, inputSchema: { type: 'object', properties: {} } },
  { name: 'update_tracking_settings', title: 'Update tracking settings',
    description: 'Set ad pixel IDs and server-side conversion tokens. Only the fields you pass change. Empty string switches a pixel off; for tokens pass "-" to remove one. The shop picks up pixel changes within about a minute.',
    annotations: { destructiveHint: false, idempotentHint: true },
    inputSchema: { type: 'object', properties: Object.assign(
      Object.fromEntries(Object.entries(PIXEL_PROPS).map(([k, d]) => [k, str(d)])),
      Object.fromEntries(Object.entries(SERVER_PROPS).map(([k, d]) => [k, str(d + ' (write-only)')]))) } },
  { name: 'build_tracking_link', title: 'Build a tracking link',
    description: 'Make a shop link tagged with UTM parameters for an ad, post or email, so its visitors and sales show up under that campaign in get_overview.',
    annotations: { readOnlyHint: true },
    inputSchema: { type: 'object', required: ['source', 'campaign'], properties: {
      source: str('Where the link is posted, e.g. facebook, tiktok, instagram, newsletter'),
      medium: { type: 'string', description: 'paid (default), social, email or influencer' },
      campaign: str('Campaign name, e.g. xmas-launch'),
      product: { type: 'string', enum: Object.keys(CATALOG.products), description: 'Land on this design instead of the home page' }
    } } }
];

async function mcpCall(name, a, env) {
  a = a || {};
  const site = new URL(env.SITE_URL);
  const viaAdmin = async fn => { const r = await fn; const j = await r.json(); if (r.status >= 400) throw new Error(j.error || 'Failed'); return j; };
  if (name === 'get_overview') {
    const u = new URL('https://x/admin/stats'); u.searchParams.set('days', a.days || 7); u.searchParams.set('tz', a.timezone_offset_minutes || 0);
    return viaAdmin(stats(u, env, {}));
  }
  if (name === 'get_live') return viaAdmin(live(env, {}));
  if (name === 'list_orders') {
    const all = (await viaAdmin(orders(env, {}))).orders;
    const k = a.kind && a.kind !== 'all' ? a.kind : null;
    const list = all.filter(o => !k || o.kind === k).slice(0, Math.max(1, Math.min(300, a.limit || 50)));
    return { count: list.length, orders: list.map(o => Object.assign({}, o, { date: new Date(o.ts).toISOString() })) };
  }
  const s = await getSettings(env);
  const productList = st => Object.entries(CATALOG.products).map(([id, p]) => {
    const o = st.products[id] || {};
    return { id, name: p.name, default_price: p.price, price: o.price || p.price, badge: o.badge || null, shown_on_shop: !o.hidden, pixels: { metaPixelId: o.metaPixelId || '', tiktokPixelId: o.tiktokPixelId || '', googleAdsLabel: o.googleAdsLabel || '' }, url: new URL('#' + id, site).href };
  });
  if (name === 'list_products') return { currency: CATALOG.currency.toUpperCase(), products: productList(s) };
  if (name === 'get_tracking_settings') return { pixels: s.pixels, server_tokens: redact(s).server };
  if (name === 'update_product') {
    if (!CATALOG.products[a.id]) throw new Error('Unknown product id. Use list_products.');
    const next = JSON.parse(JSON.stringify(s.products)), o = next[a.id] || {};
    if ('price' in a) { if (a.price == null || a.price === '') delete o.price; else o.price = a.price; }
    if ('badge' in a) { if (a.badge) o.badge = a.badge; else delete o.badge; }
    if ('hidden' in a) { if (a.hidden) o.hidden = true; else delete o.hidden; }
    ['metaPixelId', 'tiktokPixelId', 'googleAdsLabel'].forEach(k => { if (k in a) { if (a[k]) o[k] = a[k]; else delete o[k]; } });
    next[a.id] = o;
    const r = await writeSettings(env, { products: next });
    if (r.error) throw new Error(r.error);
    return { saved: true, product: productList(r.settings).find(p => p.id === a.id) };
  }
  if (name === 'update_tracking_settings') {
    const pixels = Object.assign({}, s.pixels), server = {};
    Object.keys(PIXEL_PROPS).forEach(k => { if (k in a) pixels[k] = String(a[k] || ''); });
    Object.keys(SERVER_PROPS).forEach(k => { if (k in a) server[k] = String(a[k] || ''); });
    const r = await writeSettings(env, { pixels, server });
    if (r.error) throw new Error(r.error);
    return { saved: true, pixels: r.settings.pixels, server_tokens: redact(r.settings).server };
  }
  if (name === 'build_tracking_link') {
    const slug = v => String(v || '').trim().toLowerCase().replace(/\s+/g, '-');
    const u = new URL(site.href);
    u.searchParams.set('utm_source', slug(a.source)); u.searchParams.set('utm_medium', slug(a.medium || 'paid')); u.searchParams.set('utm_campaign', slug(a.campaign));
    if (a.product && CATALOG.products[a.product]) u.hash = a.product;
    return { url: u.href };
  }
  throw new Error('Unknown tool: ' + name);
}

async function mcp(req, env) {
  const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version', 'Access-Control-Expose-Headers': 'Mcp-Session-Id' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });
  if (!env.MCP_TOKEN) return json({ error: 'Set the MCP_TOKEN secret on the server to switch on agent access' }, 503, H);
  const given = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || new URL(req.url).searchParams.get('key') || '';
  const [g, w] = await Promise.all([hmac('mcp', given), hmac('mcp', env.MCP_TOKEN)]);
  if (!given || g !== w) return json({ error: 'Missing or wrong MCP token' }, 401, Object.assign({ 'WWW-Authenticate': 'Bearer realm="stack-threads"' }, H));
  if (req.method === 'DELETE') return new Response(null, { status: 204, headers: H });
  if (req.method !== 'POST') return new Response('This MCP server answers POST requests only', { status: 405, headers: Object.assign({ Allow: 'POST' }, H) });
  let body; try { body = await req.json(); } catch (e) { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400, H); }
  await ensure(env);
  const one = async m => {
    if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return { jsonrpc: '2.0', id: m && m.id != null ? m.id : null, error: { code: -32600, message: 'Invalid request' } };
    if (m.id === undefined || m.id === null) return null; // notification
    const ok = result => ({ jsonrpc: '2.0', id: m.id, result });
    const p = m.params || {};
    switch (m.method) {
      case 'initialize': return ok({
        protocolVersion: MCP_VERSIONS.includes(p.protocolVersion) ? p.protocolVersion : MCP_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'stack-threads-store', title: 'Stack Threads store', version: '1.1.0' },
        instructions: 'Stack Threads sells hoodies and tees printed with developer quotes. Use get_overview for sales and traffic, get_live for who is on the site now, list_orders for orders and abandoned checkouts, list_products / update_product to change prices, badges and visibility, and get_tracking_settings / update_tracking_settings for ad pixels. Changes go live on the shop within about a minute. Money is USD.'
      });
      case 'ping': return ok({});
      case 'tools/list': return ok({ tools: MCP_TOOLS() });
      case 'tools/call': {
        if (!MCP_TOOLS().some(t => t.name === p.name)) return { jsonrpc: '2.0', id: m.id, error: { code: -32602, message: 'Unknown tool: ' + p.name } };
        try {
          const data = await mcpCall(p.name, p.arguments, env);
          return ok({ content: [{ type: 'text', text: JSON.stringify(data, null, 1) }], structuredContent: data });
        } catch (e) {
          return ok({ content: [{ type: 'text', text: 'Error: ' + (e && e.message || e) }], isError: true });
        }
      }
      default: return { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Method not found: ' + m.method } };
    }
  };
  const out = Array.isArray(body) ? (await Promise.all(body.map(one))).filter(Boolean) : await one(body);
  if (!out || (Array.isArray(out) && !out.length)) return new Response(null, { status: 202, headers: H });
  return json(out, 200, H);
}

/* ───────── checkout session ───────── */
async function createSession(req, env, h) {
  const site = new URL(env.SITE_URL);
  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'Bad request' }, 400, h); }
  const email = clip(body.email, 200).trim();
  const name = clip(body.name, 120).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email' }, 400, h);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments aren’t switched on yet' }, 503, h);

  const over = (await getSettings(env)).products;
  const product = id => { const p = CATALOG.products[id], o = over[id] || {}; return p && !o.hidden ? Object.assign({}, p, o.price ? { price: o.price } : {}) : null; };
  const lines = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map(l => ({
    p: product(l.id), id: l.id, size: String(l.size), qty: Math.max(1, Math.min(10, parseInt(l.qty, 10) || 1))
  })).filter(l => l.p && CATALOG.sizes.includes(l.size));
  if (!lines.length) return json({ error: 'Your bag is empty' }, 400, h);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const off = count >= CATALOG.bundle.qty ? CATALOG.bundle.percentOff / 100 : 0;
  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('customer_email', email);
  f.set('customer_creation', 'always');
  f.set('success_url', new URL('?order=success&session_id={CHECKOUT_SESSION_ID}', site).href.replace('%7B', '{').replace('%7D', '}'));
  f.set('cancel_url', new URL('?order=cancel', site).href);
  f.set('allow_promotion_codes', 'true');
  f.set('billing_address_collection', 'auto');
  f.set('phone_number_collection[enabled]', 'true');
  f.set('shipping_address_collection[allowed_countries][0]', 'US');
  let subtotal = 0;
  lines.forEach((l, i) => {
    const unit = Math.round(l.p.price * 100 * (1 - off));
    subtotal += unit * l.qty;
    f.set(`line_items[${i}][quantity]`, l.qty);
    f.set(`line_items[${i}][price_data][currency]`, CATALOG.currency);
    f.set(`line_items[${i}][price_data][unit_amount]`, unit);
    f.set(`line_items[${i}][price_data][product_data][name]`, `${l.p.name}, size ${l.size}`);
    f.set(`line_items[${i}][price_data][product_data][images][0]`, new URL(l.p.photo, site).href);
    f.set(`line_items[${i}][price_data][product_data][metadata][sku]`, `${l.id}-${l.size}`);
  });
  const free = CATALOG.freeShippingOver > 0 && subtotal >= CATALOG.freeShippingOver * 100;
  const s = 'shipping_options[0][shipping_rate_data]';
  f.set(`${s}[type]`, 'fixed_amount');
  f.set(`${s}[display_name]`, free ? 'Free shipping' : 'Standard shipping');
  f.set(`${s}[fixed_amount][amount]`, free ? 0 : CATALOG.shippingCents);
  f.set(`${s}[fixed_amount][currency]`, CATALOG.currency);
  f.set(`${s}[delivery_estimate][minimum][unit]`, 'business_day');
  f.set(`${s}[delivery_estimate][minimum][value]`, 4);
  f.set(`${s}[delivery_estimate][maximum][unit]`, 'business_day');
  f.set(`${s}[delivery_estimate][maximum][value]`, 8);

  // Everything the webhook needs to report the sale to the ad platforms and the admin panel later.
  const meta = {
    name,
    cart: lines.map(l => `${l.id}-${l.size}:${l.qty}:${Math.round(l.p.price * 100 * (1 - off))}`).join(','),
    ip: req.headers.get('CF-Connecting-IP') || '',
    ua: req.headers.get('User-Agent') || ''
  };
  const ids = body.ids && typeof body.ids === 'object' ? body.ids : {};
  ['fbp', 'fbc', 'ttp', 'ttclid', 'ga_client_id', 'gclid', 'page', 'vid', 'sid'].forEach(k => { if (ids[k]) meta[k] = ids[k]; });
  const attr = body.utm && typeof body.utm === 'object' ? body.utm : {};
  Object.keys(attr).slice(0, 15).forEach(k => { if (/^[A-Za-z_]{2,20}$/.test(k)) meta[k] = attr[k]; });
  Object.keys(meta).slice(0, 45).forEach(k => f.set(`metadata[${k}]`, clip(meta[k], 490)));

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: f
  });
  const out = await r.json();
  if (!r.ok) return json({ error: (out.error && out.error.message) || 'Stripe error' }, 502, h);
  return json({ url: out.url, id: out.id }, 200, h);
}

/* ───────── Stripe webhook → order saved + server-side Purchase ───────── */
async function verifyStripe(raw, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const t = parts.t, sigs = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  return sigs.includes(await hmac(secret, `${t}.${raw}`));
}

async function webhook(req, env, ctx) {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  const raw = await req.text();
  if (!(await verifyStripe(raw, req.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET))) return json({ error: 'Bad signature' }, 400);
  const evt = JSON.parse(raw);
  if (evt.type !== 'checkout.session.completed' && evt.type !== 'checkout.session.async_payment_succeeded') return json({ ignored: evt.type });
  const ses = evt.data.object;
  if (ses.payment_status !== 'paid' && evt.type === 'checkout.session.completed') return json({ waiting: ses.payment_status });

  const m = ses.metadata || {};
  const cd = ses.customer_details || {};
  const addr = (ses.shipping_details && ses.shipping_details.address) || cd.address || {};
  const nameParts = String(cd.name || m.name || '').trim().toLowerCase().split(/\s+/);
  const items = String(m.cart || '').split(',').filter(Boolean).map(x => { const [sku, qty, cents] = x.split(':'); return { sku, id: sku.replace(/-[^-]+$/, ''), size: sku.split('-').pop(), qty: Number(qty), price: Number(cents) / 100 }; });
  const order = {
    id: ses.id, value: (ses.amount_total || 0) / 100, currency: String(ses.currency || 'usd').toUpperCase(),
    time: Math.floor((ses.created || Date.now() / 1000)), items,
    email: cd.email || ses.customer_email, phone: String(cd.phone || '').replace(/[^\d]/g, ''),
    fn: nameParts[0], ln: nameParts.slice(1).join(' '), fullName: cd.name || m.name || '',
    city: String(addr.city || '').replace(/\s+/g, '').toLowerCase(), state: String(addr.state || '').toLowerCase(),
    zip: String(addr.postal_code || '').slice(0, 5), country: String(addr.country || '').toLowerCase(),
    ip: m.ip, ua: m.ua, page: m.page || env.SITE_URL, m
  };
  const fresh = await saveOrder(order, addr, env);
  if (!fresh) return json({ ok: true, duplicate: true }); // Stripe retried; already reported
  const s = await getSettings(env);
  const cfg = {
    metaPixel: s.pixels.metaPixelId || env.META_PIXEL_ID, metaToken: s.server.metaCapiToken || env.META_CAPI_TOKEN, metaTest: s.server.metaTestEventCode || env.META_TEST_EVENT_CODE,
    ttPixel: s.pixels.tiktokPixelId || env.TIKTOK_PIXEL_ID, ttToken: s.server.tiktokEventsToken || env.TIKTOK_EVENTS_TOKEN,
    ga4: s.pixels.ga4Id || env.GA4_ID, ga4Secret: s.server.ga4ApiSecret || env.GA4_API_SECRET
  };
  const results = await Promise.allSettled([sendMeta(order, cfg), sendTikTok(order, cfg), sendGA4(order, cfg)]);
  return json({ ok: true, sent: results.map(r => r.status === 'fulfilled' ? r.value : String(r.reason)) });
}

// Saves the order and books it to the visit it came from (source, campaign, place).
// Returns false when the order was already saved, so a Stripe retry isn't counted twice.
async function saveOrder(o, addr, env) {
  if (!(await ensure(env))) return true;
  const D = env.DB, sid = clip(o.m.sid, 32), vid = clip(o.m.vid, 32);
  const visit = sid ? await D.prepare("SELECT country, region, city, lat, lon, source, medium, campaign, ref, device FROM events WHERE sid = ?1 ORDER BY ts LIMIT 1").bind(sid).first() : null;
  const v = visit || { country: String(addr.country || '').toUpperCase(), region: addr.state || '', city: addr.city || '', lat: null, lon: null, source: o.m.utm_source || 'unknown', medium: o.m.utm_medium || '', campaign: o.m.utm_campaign || '', ref: '', device: device(o.ua || '') };
  const res = await D.prepare('INSERT OR IGNORE INTO orders (id, ts, kind, name, email, value, currency, items, country, city, source, medium, campaign, sid) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)')
    .bind(o.id, o.time * 1000, 'paid', clip(o.fullName, 120), clip(o.email, 200), o.value, o.currency, JSON.stringify(o.items.map(i => ({ id: i.id, size: i.size, qty: i.qty, price: i.price }))), v.country, v.city, v.source, v.medium, v.campaign, sid).run();
  if (!res.meta || !res.meta.changes) return false;
  const ins = 'INSERT INTO events (ts, vid, sid, type, path, product, qty, value, country, region, city, lat, lon, source, medium, campaign, ref, device) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)';
  const base = [o.time * 1000, vid || 'server', sid || o.id.slice(-24), 'purchase', '', '', 0, o.value, v.country, v.region, v.city, v.lat, v.lon, v.source, v.medium, v.campaign, v.ref, v.device];
  const stmts = [D.prepare(ins).bind(...base)];
  o.items.forEach(i => { const r = base.slice(); r[3] = 'sold'; r[5] = i.id; r[6] = i.qty; r[7] = Math.round(i.price * i.qty * 100) / 100; stmts.push(D.prepare(ins).bind(...r)); });
  if (sid) stmts.push(D.prepare('DELETE FROM orders WHERE id = ?1').bind('lead-' + sid)); // the held / started checkout became a paid order
  await D.batch(stmts);
  return true;
}

async function sendMeta(o, c) {
  if (!c.metaPixel || !c.metaToken) return 'meta: not configured';
  const user = {
    em: [await sha256(o.email)], ph: o.phone ? [await sha256(o.phone)] : undefined,
    fn: [await sha256(o.fn)], ln: o.ln ? [await sha256(o.ln)] : undefined,
    ct: o.city ? [await sha256(o.city)] : undefined, st: o.state ? [await sha256(o.state)] : undefined,
    zp: o.zip ? [await sha256(o.zip)] : undefined, country: o.country ? [await sha256(o.country)] : undefined,
    external_id: [await sha256(o.email)],
    client_ip_address: o.ip || undefined, client_user_agent: o.ua || undefined,
    fbp: o.m.fbp || undefined, fbc: o.m.fbc || undefined
  };
  const body = {
    data: [{
      event_name: 'Purchase', event_time: o.time, event_id: o.id, action_source: 'website', event_source_url: o.page,
      user_data: user,
      custom_data: { currency: o.currency, value: o.value, order_id: o.id, content_type: 'product', content_ids: o.items.map(i => i.sku), contents: o.items.map(i => ({ id: i.sku, quantity: i.qty, item_price: i.price })), num_items: o.items.reduce((s, i) => s + i.qty, 0) }
    }]
  };
  if (c.metaTest) body.test_event_code = c.metaTest;
  const r = await fetch(`https://graph.facebook.com/v21.0/${c.metaPixel}/events?access_token=${encodeURIComponent(c.metaToken)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return `meta: ${r.status}`;
}

async function sendTikTok(o, c) {
  if (!c.ttPixel || !c.ttToken) return 'tiktok: not configured';
  const body = {
    event_source: 'web', event_source_id: c.ttPixel,
    data: [{
      event: 'CompletePayment', event_time: o.time, event_id: o.id,
      user: { email: await sha256(o.email), phone: o.phone ? await sha256('+' + o.phone) : undefined, external_id: await sha256(o.email), ttclid: o.m.ttclid || undefined, ttp: o.m.ttp || undefined, ip: o.ip || undefined, user_agent: o.ua || undefined },
      page: { url: o.page },
      properties: { currency: o.currency, value: o.value, order_id: o.id, content_type: 'product', contents: o.items.map(i => ({ content_id: i.sku, quantity: i.qty, price: i.price })) }
    }]
  };
  const r = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Access-Token': c.ttToken }, body: JSON.stringify(body) });
  return `tiktok: ${r.status}`;
}

async function sendGA4(o, c) {
  if (!c.ga4 || !c.ga4Secret) return 'ga4: not configured';
  const body = {
    client_id: o.m.ga_client_id || `${Math.floor(Math.random() * 1e9)}.${o.time}`,
    user_data: { sha256_email_address: await sha256(o.email) },
    events: [{ name: 'purchase', params: { transaction_id: o.id, currency: o.currency, value: o.value, items: o.items.map(i => ({ item_id: i.id, item_variant: i.sku, price: i.price, quantity: i.qty })) } }]
  };
  const r = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${c.ga4}&api_secret=${c.ga4Secret}`, { method: 'POST', body: JSON.stringify(body) });
  return `ga4: ${r.status}`;
}
