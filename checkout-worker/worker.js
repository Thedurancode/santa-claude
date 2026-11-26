/* Santa Claude checkout and server-side conversion tracking.

   POST /           bag → Stripe Checkout session (returns { url })
   POST /webhook    Stripe "checkout.session.completed" → Purchase sent to
                    Meta Conversions API, TikTok Events API and GA4, using the
                    Stripe session ID as the event ID so the browser pixel and
                    the server copy are counted once.

   Settings (Cloudflare → Worker → Settings → Variables; mark keys as Secret):
     STRIPE_SECRET_KEY       required  sk_test_… or sk_live_…
     SITE_URL                required  https://thedurancode.github.io/santa-claude/
     STRIPE_WEBHOOK_SECRET   for tracking  whsec_… from the Stripe webhook you create
     META_PIXEL_ID, META_CAPI_TOKEN            Meta Conversions API (Events Manager → Settings)
     META_TEST_EVENT_CODE                      optional, shows server events in Test Events
     TIKTOK_PIXEL_ID, TIKTOK_EVENTS_TOKEN      TikTok Events API (Events Manager → pixel → Settings)
     GA4_ID, GA4_API_SECRET                    GA4 Measurement Protocol (Admin → Data streams)

   Prices come from the CATALOG below, never from the browser. After changing
   prices in js/shop-config.js, run `python3 tools/build_worker.py` and redeploy. */

const CATALOG = {
  "currency": "usd",
  "sizes": [
    "S",
    "M",
    "L",
    "XL",
    "2XL"
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
    }
  },
  "bundle": {
    "qty": 2,
    "percentOff": 15.0
  },
  "freeShippingOver": 100.0,
  "shippingCents": 800
};

const cors = origin => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin'
});
const json = (body, status, headers) => new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}) });
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => s ? hex(await crypto.subtle.digest('SHA-256', enc.encode(String(s).trim().toLowerCase()))) : undefined;
const clip = (s, n) => String(s || '').slice(0, n || 400);

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.replace(/\/$/, '') === '/webhook') return webhook(req, env, ctx);
    return createSession(req, env);
  }
};

/* ───────── checkout session ───────── */
async function createSession(req, env) {
  const site = new URL(env.SITE_URL);
  const origin = req.headers.get('Origin') || '';
  const allowed = origin === site.origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const h = cors(allowed ? origin : site.origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405, h);
  if (!allowed) return json({ error: 'Not allowed' }, 403, h);

  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'Bad request' }, 400, h); }
  const email = clip(body.email, 200).trim();
  const name = clip(body.name, 120).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email' }, 400, h);

  const lines = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map(l => ({
    p: CATALOG.products[l.id], id: l.id, size: String(l.size), qty: Math.max(1, Math.min(10, parseInt(l.qty, 10) || 1))
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

  // Everything the webhook needs to report the sale to the ad platforms later.
  const meta = {
    name,
    cart: lines.map(l => `${l.id}-${l.size}:${l.qty}:${Math.round(l.p.price * 100 * (1 - off))}`).join(','),
    ip: req.headers.get('CF-Connecting-IP') || '',
    ua: req.headers.get('User-Agent') || ''
  };
  const ids = body.ids && typeof body.ids === 'object' ? body.ids : {};
  ['fbp', 'fbc', 'ttp', 'ttclid', 'ga_client_id', 'gclid', 'page'].forEach(k => { if (ids[k]) meta[k] = ids[k]; });
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

/* ───────── Stripe webhook → server-side Purchase ───────── */
async function verifyStripe(raw, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const t = parts.t, sigs = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${raw}`)));
  return sigs.includes(expected);
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
  const items = String(m.cart || '').split(',').filter(Boolean).map(x => { const [sku, qty, cents] = x.split(':'); return { sku, id: sku.replace(/-[^-]+$/, ''), qty: Number(qty), price: Number(cents) / 100 }; });
  const order = {
    id: ses.id, value: (ses.amount_total || 0) / 100, currency: String(ses.currency || 'usd').toUpperCase(),
    time: Math.floor((ses.created || Date.now() / 1000)), items,
    email: cd.email || ses.customer_email, phone: String(cd.phone || '').replace(/[^\d]/g, ''),
    fn: nameParts[0], ln: nameParts.slice(1).join(' '),
    city: String(addr.city || '').replace(/\s+/g, '').toLowerCase(), state: String(addr.state || '').toLowerCase(),
    zip: String(addr.postal_code || '').slice(0, 5), country: String(addr.country || '').toLowerCase(),
    ip: m.ip, ua: m.ua, page: m.page || env.SITE_URL, m
  };
  const jobs = [sendMeta(order, env), sendTikTok(order, env), sendGA4(order, env)];
  const results = await Promise.allSettled(jobs);
  return json({ ok: true, sent: results.map(r => r.status === 'fulfilled' ? r.value : String(r.reason)) });
}

async function sendMeta(o, env) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return 'meta: not configured';
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
  if (env.META_TEST_EVENT_CODE) body.test_event_code = env.META_TEST_EVENT_CODE;
  const r = await fetch(`https://graph.facebook.com/v21.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return `meta: ${r.status}`;
}

async function sendTikTok(o, env) {
  if (!env.TIKTOK_PIXEL_ID || !env.TIKTOK_EVENTS_TOKEN) return 'tiktok: not configured';
  const body = {
    event_source: 'web', event_source_id: env.TIKTOK_PIXEL_ID,
    data: [{
      event: 'CompletePayment', event_time: o.time, event_id: o.id,
      user: { email: await sha256(o.email), phone: o.phone ? await sha256('+' + o.phone) : undefined, external_id: await sha256(o.email), ttclid: o.m.ttclid || undefined, ttp: o.m.ttp || undefined, ip: o.ip || undefined, user_agent: o.ua || undefined },
      page: { url: o.page },
      properties: { currency: o.currency, value: o.value, order_id: o.id, content_type: 'product', contents: o.items.map(i => ({ content_id: i.sku, quantity: i.qty, price: i.price })) }
    }]
  };
  const r = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Access-Token': env.TIKTOK_EVENTS_TOKEN }, body: JSON.stringify(body) });
  return `tiktok: ${r.status}`;
}

async function sendGA4(o, env) {
  if (!env.GA4_ID || !env.GA4_API_SECRET) return 'ga4: not configured';
  const body = {
    client_id: o.m.ga_client_id || `${Math.floor(Math.random() * 1e9)}.${o.time}`,
    user_data: { sha256_email_address: await sha256(o.email) },
    events: [{ name: 'purchase', params: { transaction_id: o.id, currency: o.currency, value: o.value, items: o.items.map(i => ({ item_id: i.id, item_variant: i.sku, price: i.price, quantity: i.qty })) } }]
  };
  const r = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_ID}&api_secret=${env.GA4_API_SECRET}`, { method: 'POST', body: JSON.stringify(body) });
  return `ga4: ${r.status}`;
}
