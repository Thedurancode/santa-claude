/* Ad pixels and analytics for the shop.

   Loads only the platforms whose IDs are filled in js/shop-config.js, then maps
   one set of shop events onto each platform's standard names:

     view     → Meta ViewContent · TikTok ViewContent · GA4 view_item · Pinterest pagevisit · Snap VIEW_CONTENT
     add      → AddToCart · AddToCart · add_to_cart · addtocart · ADD_CART
     checkout → InitiateCheckout · InitiateCheckout · begin_checkout · checkout · START_CHECKOUT
     lead     → Lead · SubmitForm · generate_lead · lead · SIGN_UP
     purchase → Purchase · CompletePayment · purchase (+ Google Ads conversion) · checkout · PURCHASE

   Purchases are also sent from the server (checkout-worker, on Stripe's
   payment webhook) to Meta, TikTok and GA4 with the same event ID, so a sale
   still counts when an ad blocker eats the browser pixel or the shopper
   closes the tab, and the platforms de-duplicate the two copies.

   Add ?debug=tracking to any page URL to log every event to the console. */
(function () {
  var C = (window.SHOP && window.SHOP.pixels) || {};
  var CUR = (window.SHOP && window.SHOP.currency) || 'USD';
  var DEBUG = /[?&]debug=tracking/.test(location.search);
  window.dataLayer = window.dataLayer || [];
  var load = function (src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var cookie = function (n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; };

  /* Attribution: remember the ad click and campaign for 90 days (last click wins). */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'epik', 'ScCid'];
  try {
    var q = new URLSearchParams(location.search), hit = {};
    KEYS.forEach(function (k) { if (q.get(k)) hit[k] = q.get(k); });
    if (Object.keys(hit).length) { hit._at = Date.now(); hit.landing = location.href.split('#')[0]; store.set('sc-attr', hit); }
    var a = store.get('sc-attr');
    if (a && Date.now() - a._at > 90 * 864e5) { localStorage.removeItem('sc-attr'); }
    if (hit.fbclid) store.set('sc-fbc', 'fb.1.' + Date.now() + '.' + hit.fbclid);
  } catch (e) {}
  window.shopAttribution = function () {
    var a = store.get('sc-attr') || {}, out = {};
    KEYS.forEach(function (k) { if (a[k]) out[k] = a[k]; });
    return out;
  };
  /* Browser IDs the server needs so its copy of a purchase matches this visitor. */
  window.shopClientIds = function () {
    var ga = cookie('_ga').split('.').slice(-2).join('.');
    return {
      fbp: cookie('_fbp'), fbc: cookie('_fbc') || store.get('sc-fbc') || '',
      ttp: cookie('_ttp'), ttclid: (store.get('sc-attr') || {}).ttclid || '',
      ga_client_id: /^\d+\.\d+$/.test(ga) ? ga : '', gclid: (store.get('sc-attr') || {}).gclid || '',
      page: location.href.split('#')[0]
    };
  };

  if (C.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    var me = store.get('sc-me') || {};
    fbq('init', C.metaPixelId, me.email ? { em: String(me.email).toLowerCase() } : {});
    fbq('track', 'PageView');
  }
  if (C.tiktokPixelId) {
    !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; }; ttq.load = function (e, n) { var i = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = i + '?sdkid=' + e + '&lib=' + t; var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a); }; ttq.load(C.tiktokPixelId); ttq.page(); }(window, document, 'ttq');
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

  var NAMES = {
    view: ['ViewContent', 'ViewContent', 'view_item', 'pagevisit', 'VIEW_CONTENT'],
    add: ['AddToCart', 'AddToCart', 'add_to_cart', 'addtocart', 'ADD_CART'],
    checkout: ['InitiateCheckout', 'InitiateCheckout', 'begin_checkout', 'checkout', 'START_CHECKOUT'],
    lead: ['Lead', 'SubmitForm', 'generate_lead', 'lead', 'SIGN_UP'],
    purchase: ['Purchase', 'CompletePayment', 'purchase', 'checkout', 'PURCHASE']
  };
  var sent = store.get('sc-sent-orders') || [];

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
    try {
      if (window.fbq) fbq('track', n[0], { content_ids: items.map(sku), content_type: 'product', contents: items.map(function (i) { return { id: sku(i), quantity: i.qty, item_price: i.price }; }), value: value, currency: CUR, num_items: numItems, order_id: extra.orderId }, { eventID: eid });
      if (window.ttq) ttq.track(n[1], { contents: items.map(function (i) { return { content_id: sku(i), content_type: 'product', content_name: i.name, quantity: i.qty, price: i.price }; }), value: value, currency: CUR, order_id: extra.orderId }, { event_id: eid });
      if (window.gtag && C.ga4Id) gtag('event', n[2], { currency: CUR, value: value, transaction_id: extra.orderId, items: items.map(function (i) { return { item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty }; }) });
      if (window.gtag && C.googleAdsId && type === 'purchase' && C.googleAdsPurchaseLabel) gtag('event', 'conversion', { send_to: C.googleAdsId + '/' + C.googleAdsPurchaseLabel, value: value, currency: CUR, transaction_id: extra.orderId || eid });
      if (window.pintrk) pintrk('track', n[3], { value: value, currency: CUR, order_id: extra.orderId, event_id: eid, line_items: items.map(function (i) { return { product_id: sku(i), product_name: i.name, product_price: i.price, product_quantity: i.qty }; }) });
      if (window.snaptr) snaptr('track', n[4], { price: value, currency: CUR, item_ids: items.map(sku), number_items: numItems, transaction_id: extra.orderId, client_dedup_id: eid });
    } catch (e) {}
    dataLayer.push({ ecommerce: null });
    dataLayer.push({ event: n[2], event_id: eid, ecommerce: { currency: CUR, value: value, transaction_id: extra.orderId, items: items.map(function (i) { return { item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty }; }) } });
    if (DEBUG) console.log('%c[tracking] ' + type, 'color:#E5323B;font-weight:bold', { value: value, currency: CUR, event_id: eid, order_id: extra.orderId, items: items, platforms: { meta: !!window.fbq, tiktok: !!window.ttq, ga4: !!(window.gtag && C.ga4Id), googleAds: !!C.googleAdsId, pinterest: !!window.pintrk, snap: !!window.snaptr } });
  };

  /* Once the shopper gives name and email, share them with the pixels for better
     ad matching. Meta, TikTok, Google and Pinterest hash them before sending. */
  window.shopIdentify = function (email, name) {
    try {
      var em = String(email).trim().toLowerCase(), parts = String(name || '').trim().toLowerCase().split(/\s+/);
      if (window.fbq && C.metaPixelId) fbq('init', C.metaPixelId, { em: em, fn: parts[0] || '', ln: parts.slice(1).join(' ') });
      if (window.ttq) ttq.identify({ email: em });
      if (window.gtag) gtag('set', 'user_data', { email: em, address: { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') } });
      if (window.pintrk) pintrk('set', { em: em });
      if (window.snaptr && C.snapPixelId) snaptr('init', C.snapPixelId, { user_email: em });
      dataLayer.push({ event: 'shop_identify', user_email: em });
      if (DEBUG) console.log('[tracking] identify', em);
    } catch (e) {}
  };
})();
