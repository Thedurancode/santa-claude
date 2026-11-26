/* Ad pixels and analytics for the shop.
   Loads only the pixels whose IDs are filled in js/shop-config.js, then maps
   one set of shop events onto each platform's standard event names:

     view     → Meta ViewContent · TikTok ViewContent · GA4 view_item
     add      → AddToCart · AddToCart · add_to_cart
     checkout → InitiateCheckout · InitiateCheckout · begin_checkout
     lead     → Lead · SubmitForm · generate_lead     (hold request sent)
     purchase → Purchase · CompletePayment · purchase

   Every event also goes to window.dataLayer for Google Tag Manager, with a
   shared event_id so Meta can de-duplicate it against a Conversions API feed. */
(function () {
  var C = (window.SHOP && window.SHOP.pixels) || {};
  var CUR = (window.SHOP && window.SHOP.currency) || 'USD';
  window.dataLayer = window.dataLayer || [];
  var load = function (src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };

  // Remember where the visitor came from so it can ride along to checkout.
  try {
    var q = new URLSearchParams(location.search), keep = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid'].forEach(function (k) { if (q.get(k)) keep[k] = q.get(k); });
    if (Object.keys(keep).length) sessionStorage.setItem('shop-utm', JSON.stringify(keep));
  } catch (e) {}

  if (C.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', C.metaPixelId); fbq('track', 'PageView');
  }
  if (C.tiktokPixelId) {
    !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; }; ttq.load = function (e, n) { var i = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = i + '?sdkid=' + e + '&lib=' + t; var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a); }; ttq.load(C.tiktokPixelId); ttq.page(); }(window, document, 'ttq');
  }
  if (C.ga4Id) {
    load('https://www.googletagmanager.com/gtag/js?id=' + C.ga4Id);
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', C.ga4Id);
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

  /* items: [{ id, name, variant, price, qty }] */
  window.shopTrack = function (type, items, extra) {
    var n = NAMES[type]; if (!n) return;
    items = items || [];
    var value = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    if (extra && typeof extra.value === 'number') value = extra.value;
    value = Math.round(value * 100) / 100;
    var eid = (extra && extra.eventId) || type + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var ids = items.map(function (i) { return i.id + (i.variant ? '-' + i.variant : ''); });
    try {
      if (window.fbq) fbq('track', n[0], { content_ids: ids, content_type: 'product', contents: items.map(function (i) { return { id: i.id + (i.variant ? '-' + i.variant : ''), quantity: i.qty, item_price: i.price }; }), value: value, currency: CUR, num_items: items.reduce(function (s, i) { return s + i.qty; }, 0) }, { eventID: eid });
      if (window.ttq) ttq.track(n[1], { contents: items.map(function (i) { return { content_id: i.id + (i.variant ? '-' + i.variant : ''), content_type: 'product', content_name: i.name, quantity: i.qty, price: i.price }; }), value: value, currency: CUR }, { event_id: eid });
      if (window.gtag && C.ga4Id) gtag('event', n[2], { currency: CUR, value: value, items: items.map(function (i) { return { item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty }; }) });
      if (window.pintrk) pintrk('track', n[3], { value: value, currency: CUR, line_items: items.map(function (i) { return { product_id: i.id, product_name: i.name, product_price: i.price, product_quantity: i.qty }; }) });
      if (window.snaptr) snaptr('track', n[4], { price: value, currency: CUR, item_ids: ids });
    } catch (e) {}
    dataLayer.push({ event: 'shop_' + type, event_id: eid, ecommerce: { currency: CUR, value: value, items: items } });
  };
})();

/* Once the shopper gives name and email, pass them to the pixels for better
   ad matching. Meta and TikTok hash the values in the browser before sending. */
window.shopIdentify = function (email, name) {
  try {
    var C = (window.SHOP && window.SHOP.pixels) || {};
    var parts = String(name || '').toLowerCase().split(' ');
    if (window.fbq && C.metaPixelId) fbq('init', C.metaPixelId, { em: String(email).toLowerCase(), fn: parts[0] || '', ln: parts.slice(1).join(' ') });
    if (window.ttq) ttq.identify({ email: String(email).toLowerCase() });
    if (window.gtag && C.ga4Id) gtag('set', 'user_data', { email: String(email).toLowerCase() });
    if (window.pintrk) pintrk('set', { em: String(email).toLowerCase() });
    (window.dataLayer = window.dataLayer || []).push({ event: 'shop_identify', user_email: String(email).toLowerCase() });
  } catch (e) {}
};
