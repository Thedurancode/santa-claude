/* Ad pixels and analytics for the shop.

   Pixel IDs come from the admin panel (admin/), falling back to the ones typed
   into js/shop-config.js. Only platforms with an ID are loaded. One set of shop
   events is mapped onto each platform's standard names:

     view     → Meta ViewContent · TikTok ViewContent · GA4 view_item · Pinterest pagevisit · Snap VIEW_CONTENT
     add      → AddToCart · AddToCart · add_to_cart · addtocart · ADD_CART
     checkout → InitiateCheckout · InitiateCheckout · begin_checkout · checkout · START_CHECKOUT
     lead     → Lead · SubmitForm · generate_lead · lead · SIGN_UP
     purchase → Purchase · CompletePayment · purchase (+ Google Ads conversion) · checkout · PURCHASE

   A product can also have its own Meta pixel, TikTok pixel and Google Ads
   conversion label (set in the admin panel). Events about that product go to
   those as well as to the store-wide ones.

   Every event is also sent to the store server (SHOP.api) for the admin panel:
   visitors, where they came from, their country and city, and what they did.

   Purchases are sent from the server too (Stripe's payment webhook), with the
   same event ID, so a sale still counts when an ad blocker eats the browser
   pixel, and the platforms de-duplicate the two copies.

   Add ?debug=tracking to any page URL to log every event to the console. */
(function () {
  var S = window.SHOP = window.SHOP || { products: [] };
  var C = S.pixels = S.pixels || {};
  var CUR = S.currency || 'USD';
  var API = (S.api || '').replace(/\/+$/, '');
  var DEBUG = /[?&]debug=tracking/.test(location.search);
  window.dataLayer = window.dataLayer || [];
  var load = function (src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var cookie = function (n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; };
  var rid = function () { return (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/g, '').slice(0, 22); };
  var uniq = function (a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); };

  /* Attribution: remember the ad click and campaign for 90 days (last click wins). */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'epik', 'ScCid'];
  var hit = {};
  try {
    var q = new URLSearchParams(location.search);
    KEYS.forEach(function (k) { if (q.get(k)) hit[k] = q.get(k).slice(0, 200); });
    if (Object.keys(hit).length) { var h2 = JSON.parse(JSON.stringify(hit)); h2._at = Date.now(); h2.landing = location.href.split('#')[0]; store.set('sc-attr', h2); }
    var a0 = store.get('sc-attr');
    if (a0 && Date.now() - a0._at > 90 * 864e5) { localStorage.removeItem('sc-attr'); }
    if (hit.fbclid) store.set('sc-fbc', 'fb.1.' + Date.now() + '.' + hit.fbclid);
  } catch (e) {}
  window.shopAttribution = function () {
    var a = store.get('sc-attr') || {}, out = {};
    KEYS.forEach(function (k) { if (a[k]) out[k] = a[k]; });
    return out;
  };

  /* Visitor and visit IDs for the admin panel. Random, not personal. A visit
     ends after 30 minutes without activity, or when a new ad click arrives. */
  var vid = store.get('sc-vid');
  if (!vid || !/^[a-z0-9]{6,32}$/.test(vid)) { vid = rid(); store.set('sc-vid', vid); }
  var ses = store.get('sc-ses');
  var ref = ''; try { ref = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer.slice(0, 300) : ''; } catch (e) {}
  if (!ses || !ses.id || Date.now() - ses.last > 30 * 6e4 || Object.keys(hit).length) ses = { id: rid(), a: hit, r: ref };
  var touch = function () { ses.last = Date.now(); store.set('sc-ses', ses); };
  touch();

  /* Browser IDs the server needs so its copy of a purchase matches this visitor. */
  window.shopClientIds = function () {
    var ga = cookie('_ga').split('.').slice(-2).join('.');
    return {
      fbp: cookie('_fbp'), fbc: cookie('_fbc') || store.get('sc-fbc') || '',
      ttp: cookie('_ttp'), ttclid: (store.get('sc-attr') || {}).ttclid || '',
      ga_client_id: /^\d+\.\d+$/.test(ga) ? ga : '', gclid: (store.get('sc-attr') || {}).gclid || '',
      page: location.href.split('#')[0], vid: vid, sid: ses.id
    };
  };

  var beacon = function (t, extra) {
    if (!API) return;
    touch();
    var body = { t: t, vid: vid, sid: ses.id, p: location.pathname + location.hash, a: ses.a, r: ses.r };
    Object.keys(extra || {}).forEach(function (k) { if (extra[k] !== undefined) body[k] = extra[k]; });
    var data = JSON.stringify(body);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(API + '/e', new Blob([data], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(API + '/e', { method: 'POST', body: data, keepalive: true, mode: 'cors', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
  };

  /* Settings from the admin panel: pixel IDs, prices, badges, hidden designs,
     per-product pixels. Used from the last visit straight away; a first-time
     visitor waits for them up to 1.5 seconds. */
  var applyCfg = function (cfg) {
    if (!cfg) return;
    var px = cfg.pixels || {}, po = cfg.products || {};
    Object.keys(px).forEach(function (k) { if (px[k]) C[k] = px[k]; });
    S.products = (S.products || []).filter(function (p) {
      var o = po[p.id]; if (!o) return true;
      if (o.hidden) return false;
      if (o.price) p.price = o.price;
      if (o.badge) p.badge = o.badge === '-' ? '' : o.badge;
      p.px = { meta: o.metaPixelId || '', tiktok: o.tiktokPixelId || '', ads: o.googleAdsLabel || '' };
      return true;
    });
  };
  var pxOf = function (id) { for (var i = 0; i < S.products.length; i++) if (S.products[i].id === id) return S.products[i].px || {}; return {}; };
  var metaIds = [], ttIds = [];

  var initPixels = function () {
    var all = S.products || [];
    metaIds = uniq([C.metaPixelId].concat(all.map(function (p) { return (p.px || {}).meta; })));
    ttIds = uniq([C.tiktokPixelId].concat(all.map(function (p) { return (p.px || {}).tiktok; })));
    if (metaIds.length) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      var me = store.get('sc-me') || {};
      metaIds.forEach(function (id) { fbq('init', id, me.email ? { em: String(me.email).toLowerCase() } : {}); });
      fbq('track', 'PageView');
    }
    if (ttIds.length) {
      !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; }; ttq.load = function (e, n) { var i = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = i + '?sdkid=' + e + '&lib=' + t; var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a); }; ttIds.forEach(function (id) { ttq.load(id); }); ttq.page(); }(window, document, 'ttq');
    }
    if (C.ga4Id || C.googleAdsId) {
      load('https://www.googletagmanager.com/gtag/js?id=' + (C.ga4Id || C.googleAdsId));
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      if (C.ga4Id) gtag('config', C.ga4Id);
      if (C.googleAdsId) gtag('config', C.googleAdsId, { allow_enhanced_conversions: true });
    }
    if (C.gtmId) {
      dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      load('https://www.googletagmanager.com/gtm.js?id=' + C.gtmId);
    }
    if (C.pinterestTagId) {
      !function (e) { if (!window.pintrk) { window.pintrk = function () { window.pintrk.queue.push(Array.prototype.slice.call(arguments)); }; var n = window.pintrk; n.queue = []; n.version = '3.0'; var t = document.createElement('script'); t.async = !0; t.src = e; var r = document.getElementsByTagName('script')[0]; r.parentNode.insertBefore(t, r); } }('https://s.pinimg.com/ct/core.js');
      pintrk('load', C.pinterestTagId); pintrk('page');
    }
    if (C.snapPixelId) {
      (function (e, t, n) { if (e.snaptr) return; var a = e.snaptr = function () { a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments); }; a.queue = []; var s = 'script', r = t.createElement(s); r.async = !0; r.src = n; var u = t.getElementsByTagName(s)[0]; u.parentNode.insertBefore(r, u); })(window, document, 'https://sc-static.net/scevent.min.js');
      snaptr('init', C.snapPixelId); snaptr('track', 'PAGE_VIEW');
    }
  };

  var NAMES = {
    view: ['ViewContent', 'ViewContent', 'view_item', 'pagevisit', 'VIEW_CONTENT'],
    add: ['AddToCart', 'AddToCart', 'add_to_cart', 'addtocart', 'ADD_CART'],
    checkout: ['InitiateCheckout', 'InitiateCheckout', 'begin_checkout', 'checkout', 'START_CHECKOUT'],
    lead: ['Lead', 'SubmitForm', 'generate_lead', 'lead', 'SIGN_UP'],
    purchase: ['Purchase', 'CompletePayment', 'purchase', 'checkout', 'PURCHASE']
  };
  var sent = store.get('sc-sent-orders') || [];
  var who = null;

  /* items: [{ id, name, variant, price, qty }]   extra: { value, eventId, orderId } */
  window.shopTrack = function (type, items, extra) {
    var n = NAMES[type]; if (!n) return;
    items = items || []; extra = extra || {};
    if (type === 'purchase' && extra.orderId) { // never count the same order twice (refreshes, back button)
      if (sent.indexOf(extra.orderId) > -1) return;
      sent.push(extra.orderId); store.set('sc-sent-orders', sent.slice(-50));
    }
    var value = typeof extra.value === 'number' ? extra.value : items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    value = Math.round(value * 100) / 100;
    var eid = extra.eventId || type + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var sku = function (i) { return i.id + (i.variant ? '-' + i.variant : ''); };
    var numItems = items.reduce(function (s, i) { return s + i.qty; }, 0);
    // the store-wide pixel, plus the pixel of any product in this event
    var metaTo = uniq([C.metaPixelId].concat(items.map(function (i) { return pxOf(i.id).meta; })));
    var ttTo = uniq([C.tiktokPixelId].concat(items.map(function (i) { return pxOf(i.id).tiktok; })));
    try {
      if (window.fbq) {
        var fd = { content_ids: items.map(sku), content_type: 'product', contents: items.map(function (i) { return { id: sku(i), quantity: i.qty, item_price: i.price }; }), value: value, currency: CUR, num_items: numItems, order_id: extra.orderId };
        if (metaIds.length === 1) fbq('track', n[0], fd, { eventID: eid });
        else metaTo.forEach(function (id) { fbq('trackSingle', id, n[0], fd, { eventID: eid }); });
      }
      if (window.ttq) {
        var td = { contents: items.map(function (i) { return { content_id: sku(i), content_type: 'product', content_name: i.name, quantity: i.qty, price: i.price }; }), value: value, currency: CUR, order_id: extra.orderId };
        if (ttIds.length === 1) ttq.track(n[1], td, { event_id: eid });
        else ttTo.forEach(function (id) { ttq.instance(id).track(n[1], td, { event_id: eid }); });
      }
      if (window.gtag && C.ga4Id) gtag('event', n[2], { currency: CUR, value: value, transaction_id: extra.orderId, items: items.map(function (i) { return { item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty }; }) });
      if (window.gtag && C.googleAdsId && type === 'purchase') {
        if (C.googleAdsPurchaseLabel) gtag('event', 'conversion', { send_to: C.googleAdsId + '/' + C.googleAdsPurchaseLabel, value: value, currency: CUR, transaction_id: extra.orderId || eid });
        items.forEach(function (i) { var l = pxOf(i.id).ads; if (l) gtag('event', 'conversion', { send_to: C.googleAdsId + '/' + l, value: Math.round(i.price * i.qty * 100) / 100, currency: CUR, transaction_id: (extra.orderId || eid) + '-' + i.id }); });
      }
      if (window.pintrk) pintrk('track', n[3], { value: value, currency: CUR, order_id: extra.orderId, event_id: eid, line_items: items.map(function (i) { return { product_id: sku(i), product_name: i.name, product_price: i.price, product_quantity: i.qty }; }) });
      if (window.snaptr) snaptr('track', n[4], { price: value, currency: CUR, item_ids: items.map(sku), number_items: numItems, transaction_id: extra.orderId, client_dedup_id: eid });
    } catch (e) {}
    dataLayer.push({ ecommerce: null });
    dataLayer.push({ event: n[2], event_id: eid, ecommerce: { currency: CUR, value: value, transaction_id: extra.orderId, items: items.map(function (i) { return { item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty }; }) } });
    // Paid orders reach the admin panel from Stripe's webhook, so the browser copy isn't sent.
    if (type !== 'purchase') beacon(type, { i: items.map(function (i) { return { id: i.id, variant: i.variant, price: i.price, qty: i.qty }; }), who: type === 'lead' ? who : undefined, hold: type === 'lead' && !(S.checkout && S.checkout.stripeEndpoint) });
    if (DEBUG) console.log('%c[tracking] ' + type, 'color:#E5323B;font-weight:bold', { value: value, currency: CUR, event_id: eid, order_id: extra.orderId, items: items, platforms: { meta: metaTo, tiktok: ttTo, ga4: !!(window.gtag && C.ga4Id), googleAds: !!C.googleAdsId, pinterest: !!window.pintrk, snap: !!window.snaptr, admin: !!API } });
  };

  /* Once the shopper gives name and email, share them with the pixels for better
     ad matching. Meta, TikTok, Google and Pinterest hash them before sending. */
  window.shopIdentify = function (email, name) {
    try {
      var em = String(email).trim().toLowerCase(), parts = String(name || '').trim().toLowerCase().split(/\s+/);
      who = { email: em, name: String(name || '').trim() };
      if (window.fbq) metaIds.forEach(function (id) { fbq('init', id, { em: em, fn: parts[0] || '', ln: parts.slice(1).join(' ') }); });
      if (window.ttq) ttq.identify({ email: em });
      if (window.gtag) gtag('set', 'user_data', { email: em, address: { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') } });
      if (window.pintrk) pintrk('set', { em: em });
      if (window.snaptr && C.snapPixelId) snaptr('init', C.snapPixelId, { user_email: em });
      dataLayer.push({ event: 'shop_identify', user_email: em });
      if (DEBUG) console.log('[tracking] identify', em);
    } catch (e) {}
  };

  /* Page views for the admin panel: the home page and each product page. */
  var lastPage = '';
  var page = function () {
    var id = location.hash.slice(1), isProduct = S.products.some(function (p) { return p.id === id; });
    if (id && !isProduct && lastPage) return; // #faq and other in-page links
    var key = location.pathname + (isProduct ? '#' + id : '');
    if (key === lastPage) return;
    lastPage = key; beacon('page');
  };

  /* Start: apply settings, load pixels, then let the shop draw itself. */
  var waiting = [], isReady = false;
  window.shopReady = function (cb) { if (isReady) cb(); else waiting.push(cb); };
  var go = function (cfg) {
    if (isReady) return;
    applyCfg(cfg); initPixels(); isReady = true;
    waiting.splice(0).forEach(function (cb) { try { cb(); } catch (e) { setTimeout(function () { throw e; }); } });
    page(); window.addEventListener('hashchange', page);
    if (DEBUG) console.log('[tracking] ready', { fromAdmin: !!cfg, pixels: C, server: API || 'not connected' });
  };
  if (!API) go(null);
  else {
    var cached = store.get('sc-cfg');
    if (cached) go(cached);
    else setTimeout(function () { go(null); }, 1500);
    // Fresh settings: used now on a first visit, saved for the next page load otherwise.
    fetch(API + '/config', { mode: 'cors' }).then(function (r) { return r.json(); })
      .then(function (c) { if (c && c.pixels) { store.set('sc-cfg', c); go(c); } else go(null); })
      .catch(function () { go(null); });
  }
})();
