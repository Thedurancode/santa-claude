/* Santa Claude checkout: turns the bag into a Stripe Checkout session.

   Deploy as a Cloudflare Worker (free plan is plenty) with two settings:
     STRIPE_SECRET_KEY  your Stripe secret key (sk_live_… or sk_test_…), stored as a secret
     SITE_URL           https://thedurancode.github.io/santa-claude/

   Prices come from the CATALOG below, never from the browser, so nobody can
   change what they pay. After changing prices in js/shop-config.js, run
   `python3 tools/build_worker.py` and redeploy.

   Apple Pay, Google Pay and Link show up on Stripe Checkout automatically when
   they are switched on in Stripe → Settings → Payment methods. Because the
   shopper's email is passed in, Link recognises returning shoppers and pays in one tap. */

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

const json = (body, status, origin) => new Response(JSON.stringify(body), {
  status: status || 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  }
});

export default {
  async fetch(req, env) {
    const site = new URL(env.SITE_URL);
    const origin = req.headers.get('Origin') || '';
    const allowed = origin === site.origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const allow = allowed ? origin : site.origin;
    if (req.method === 'OPTIONS') return json({}, 204, allow);
    if (req.method !== 'POST') return json({ error: 'Use POST' }, 405, allow);
    if (!allowed) return json({ error: 'Not allowed' }, 403, allow);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'Bad request' }, 400, allow); }
    const email = String(body.email || '').trim().slice(0, 200);
    const name = String(body.name || '').trim().slice(0, 120);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email' }, 400, allow);

    const lines = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map(l => ({
      p: CATALOG.products[l.id], id: l.id, size: String(l.size), qty: Math.max(1, Math.min(10, parseInt(l.qty, 10) || 1))
    })).filter(l => l.p && CATALOG.sizes.includes(l.size));
    if (!lines.length) return json({ error: 'Your bag is empty' }, 400, allow);

    const count = lines.reduce((s, l) => s + l.qty, 0);
    const off = count >= CATALOG.bundle.qty ? CATALOG.bundle.percentOff / 100 : 0;
    const f = new URLSearchParams();
    f.set('mode', 'payment');
    f.set('customer_email', email);
    f.set('success_url', new URL('?order=success&session_id={CHECKOUT_SESSION_ID}', site).href.replace('%7B', '{').replace('%7D', '}'));
    f.set('cancel_url', new URL('?order=cancel', site).href);
    f.set('allow_promotion_codes', 'true');
    f.set('billing_address_collection', 'auto');
    f.set('shipping_address_collection[allowed_countries][0]', 'US');
    f.set('metadata[name]', name);
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
    const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};
    Object.keys(utm).slice(0, 10).forEach(k => { if (/^[a-z_]{2,20}$/.test(k)) f.set(`metadata[${k}]`, String(utm[k]).slice(0, 200)); });

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: f
    });
    const out = await r.json();
    if (!r.ok) return json({ error: (out.error && out.error.message) || 'Stripe error' }, 502, allow);
    return json({ url: out.url, id: out.id }, 200, allow);
  }
};
