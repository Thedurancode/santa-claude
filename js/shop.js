/* Stack Threads: hoodies and tees for people who write code.
   Products are drawn as SVG from shop-config.js, so a new design needs no
   photo shoot. To use real photos instead, add `photos: ['front.jpg', 'back.jpg']`. */
// Runs once js/pixels.js has the admin panel's settings (prices, hidden designs, pixels).
(window.shopReady || function (f) { f(); })(function () {
  var S = window.SHOP, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = window.shopTrack || function () {};
  var byId = {}; S.products.forEach(function (p) { byId[p.id] = p; });
  var money = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ───────── garment drawing ─────────
     Hoodies and tees are drawn as SVG from each product's colours, with its
     quote set to fill the print area. */
  var MONO = '"JetBrains Mono", ui-monospace, monospace', SANS = 'Archivo, system-ui, sans-serif', PIX = 'Silkscreen, monospace';
  var FONT = { mono: [MONO, 700, .6], sans: [SANS, 900, .64], pix: [PIX, 700, .72] };
  // lines: strings, '^' prefix = accent colour. box: centre x, top y, width, height.
  var quote = function (lines, box, font, ink, ink2) {
    var f = FONT[font] || FONT.mono, cw = f[2], code = font !== 'sans';
    var L = lines.map(function (l) { return { t: l.replace(/^\^/, ''), c: l.charAt(0) === '^' ? ink2 : ink }; });
    var longest = Math.max.apply(null, L.map(function (l) { return l.t.length; }));
    var sizes, gap;
    if (code) { // code: one size, so columns line up; left-aligned when there is indentation
      var one = Math.min(box.w / (longest * cw), box.h / (L.length * 1.3), 40);
      sizes = L.map(function () { return one; }); gap = .3;
    } else { // block type: each line as wide as the box allows, like a poster
      sizes = L.map(function (l) { return Math.min(box.w / (Math.max(l.t.length, 2) * cw), box.h / L.length * 1.05); }); gap = .04;
    }
    var total = sizes.reduce(function (a, z) { return a + z * (1 + gap); }, 0) - sizes[sizes.length - 1] * gap;
    if (total > box.h) { var k = box.h / total; sizes = sizes.map(function (z) { return z * k; }); total = box.h; }
    var indent = code && L.some(function (l) { return /^\s/.test(l.t); });
    var x = indent ? box.x - longest * cw * sizes[0] / 2 : box.x, y = box.y + (box.h - total) / 2, out = '';
    L.forEach(function (l, i) {
      y += sizes[i] * .8;
      out += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + sizes[i].toFixed(1) + '" fill="' + l.c + '" text-anchor="' + (indent ? 'start' : 'middle') + '" font-family=\'' + f[0] + '\' font-weight="' + f[1] + '" xml:space="preserve" style="white-space:pre">' + esc(l.t) + '</text>';
      y += sizes[i] * (.2 + gap);
    });
    return out;
  };
  var shade = function (b) { var rgb = parseInt(b.slice(1), 16); return (0.299 * (rgb >> 16) + 0.587 * (rgb >> 8 & 255) + 0.114 * (rgb & 255)) > 170; };
  var uid = 0;
  var finish = function (id, paths) { // fabric light and shadow over the whole garment
    return '<path d="' + paths + '" fill="url(#' + id + 's)" style="mix-blend-mode:multiply" pointer-events="none"/><path d="' + paths + '" fill="url(#' + id + 'v)" pointer-events="none"/>';
  };
  var defs = function (id) {
    return '<defs><linearGradient id="' + id + 's" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>' +
      '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>';
  };
  var tee = function (p, view) {
    var id = 'g' + (uid++), b = p.body, back = view === 'back';
    var line = shade(b) ? 'rgba(22,28,40,.18)' : 'rgba(0,0,0,.3)';
    var body = 'M182,58 C204,70 228,76 250,76 C272,76 296,70 318,58 L390,86 C404,110 420,150 432,188 L374,212 L354,178 C352,260 352,380 356,490 L144,490 C148,380 148,260 146,178 L126,212 L68,188 C80,150 96,110 110,86 Z';
    var neck = back ? 'M182,58 C206,72 294,72 318,58' : 'M182,58 C200,98 300,98 318,58';
    var s = '<svg class="hoodie-svg" viewBox="40 10 420 510" role="img" aria-label="' + esc(p.name) + ', ' + (back ? 'back' : 'front') + '">' + defs(id) +
      '<ellipse cx="250" cy="500" rx="180" ry="9" fill="#000" opacity=".12"/>' +
      '<path d="' + body + '" fill="' + b + '" stroke="' + line + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M126,212 L68,188 M374,212 L432,188" stroke="' + line + '" stroke-width="1.2" fill="none"/>' +
      '<path d="M128,203 L72,180 M372,203 L428,180 M146,478 L354,478" stroke="' + line + '" stroke-width="1" stroke-dasharray="3 3" fill="none"/>' +
      '<path d="' + neck + '" stroke="' + line + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<path d="' + neck + '" stroke="' + b + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>';
    s += back ? quote(p.back || p.front, { x: 250, y: 112, w: 200, h: 230 }, p.font, p.ink, p.ink2)
              : quote(p.front, { x: 250, y: 124, w: 178, h: 150 }, p.font, p.ink, p.ink2);
    return s + finish(id, body) + '</svg>';
  };
  // Knit sweater: crew neck, rib texture, and knitted bands of pixel binary digits.
  var DIG = { '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'] };
  var px = function (x, y, s, c) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (s + .3).toFixed(1) + '" height="' + (s + .3).toFixed(1) + '" fill="' + c + '"/>'; };
  var knitBand = function (y, s, bits, c, c2) { // checker row, a row of binary digits, checker row
    var out = '', x, i;
    for (x = 120, i = 0; x < 380; x += s, i++) { if (i % 2 === 0) { out += px(x, y, s, c2); out += px(x + s, y + 8 * s, s, c2); } }
    x = 250 - (bits.length * 4 * s - s) / 2;
    bits.split('').forEach(function (b) { DIG[b].forEach(function (row, j) { for (var k = 0; k < 3; k++) if (row[k] === '#') out += px(x + k * s, y + 2 * s + j * s, s, c); }); x += 4 * s; });
    return out;
  };
  var sweater = function (p, view) {
    var id = 'k' + (uid++), b = p.body, back = view === 'back';
    var line = shade(b) ? 'rgba(22,28,40,.16)' : 'rgba(0,0,0,.28)';
    var sleeves = 'M168,104 C138,112 118,132 110,170 L84,430 L134,438 L158,236 Z M332,104 C362,112 382,132 390,170 L416,430 L366,438 L342,236 Z';
    var cuffs = 'M84,430 L134,438 L131,476 L81,470 Z M416,430 L366,438 L369,476 L419,470 Z';
    var torso = 'M168,104 C186,92 204,86 214,84 C230,96 270,96 286,84 C296,86 314,92 332,104 C340,140 346,200 348,250 L352,468 L148,468 L152,250 C154,200 160,140 168,104 Z';
    var band = 'M148,468 L352,468 L351,504 L149,504 Z';
    var neck = back ? 'M214,84 C232,92 268,92 286,84' : 'M214,84 C228,106 272,106 286,84';
    var ribs = '';
    for (var x = 156; x < 350; x += 6) ribs += 'M' + x + ',471 L' + x + ',501 ';
    for (var c = 0; c < 6; c++) ribs += 'M' + (88 + c * 7.5) + ',' + (433 + c * 1.2) + ' L' + (85 + c * 7.5) + ',' + (471 + c * 1) + ' M' + (412 - c * 7.5) + ',' + (433 + c * 1.2) + ' L' + (415 - c * 7.5) + ',' + (471 + c * 1) + ' ';
    var knitTex = ''; // faint vertical knit columns
    for (x = 152; x < 350; x += 7) knitTex += 'M' + x + ',96 L' + x + ',466 ';
    var bits = p.bits || '0110100001101001';
    var s = '<svg class="hoodie-svg" viewBox="40 10 420 510" role="img" aria-label="' + esc(p.name) + ', ' + (back ? 'back' : 'front') + '">' + defs(id) +
      '<clipPath id="' + id + 'c"><path d="' + torso + '"/></clipPath>' +
      '<ellipse cx="250" cy="512" rx="190" ry="10" fill="#000" opacity=".12"/>' +
      '<g fill="' + b + '" stroke="' + line + '" stroke-width="1.4" stroke-linejoin="round"><path d="' + sleeves + '"/><path d="' + cuffs + '"/><path d="' + torso + '"/><path d="' + band + '"/></g>' +
      '<path d="' + ribs + '" stroke="' + line + '" stroke-width="1" fill="none"/>' +
      '<g clip-path="url(#' + id + 'c)"><path d="' + knitTex + '" stroke="' + line + '" stroke-width=".8" stroke-dasharray="2 3" fill="none" opacity=".7"/>' +
        knitBand(back ? 114 : 126, 2.8, bits, p.ink, p.ink2) + knitBand(414, 2.8, bits.split('').reverse().join(''), p.ink, p.ink2) + '</g>' +
      '<path d="' + neck + '" stroke="' + line + '" stroke-width="9" fill="none" stroke-linecap="round"/><path d="' + neck + '" stroke="' + b + '" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>';
    s += back ? quote(p.back || p.front, { x: 250, y: 172, w: 170, h: 214 }, p.font, p.ink, p.ink2)
              : quote(p.front, { x: 250, y: 190, w: 170, h: 196 }, p.font, p.ink, p.ink2);
    return s + finish(id, sleeves + ' ' + torso + ' ' + band + ' ' + cuffs) + '</svg>';
  };
  var hoodie = function (p, view) {
    if (p.type === 'tee') return tee(p, view);
    if (p.type === 'sweater') return sweater(p, view);
    var id = 'h' + (uid++), b = p.body, ink = p.ink, back = view === 'back';
    var line = shade(b) ? 'rgba(22,28,64,.16)' : 'rgba(0,0,0,.28)';
    var sleeves = 'M168,118 C138,124 118,142 110,178 L84,430 L134,438 L158,236 Z M332,118 C362,124 382,142 390,178 L416,430 L366,438 L342,236 Z';
    var cuffs = 'M84,430 L134,438 L131,476 L81,470 Z M416,430 L366,438 L369,476 L419,470 Z';
    var torso = 'M168,118 C184,104 204,98 214,96 L286,96 C296,98 316,104 332,118 C340,150 346,200 348,250 L352,468 L148,468 L152,250 C154,200 160,150 168,118 Z';
    var band = 'M148,468 L352,468 L351,504 L149,504 Z';
    var hood = back ? 'M180,114 C176,52 212,24 250,24 C288,24 324,52 320,114 C306,152 194,152 180,114 Z'
                    : 'M176,120 C170,72 204,42 250,42 C296,42 330,72 324,120 C318,132 300,140 288,142 L250,176 L212,142 C200,140 182,132 176,120 Z';
    var ribs = '';
    for (var x = 156; x < 350; x += 7) ribs += 'M' + x + ',471 L' + x + ',501 ';
    for (var c = 0; c < 6; c++) ribs += 'M' + (88 + c * 7.5) + ',' + (433 + c * 1.2) + ' L' + (85 + c * 7.5) + ',' + (471 + c * 1) + ' M' + (412 - c * 7.5) + ',' + (433 + c * 1.2) + ' L' + (415 - c * 7.5) + ',' + (471 + c * 1) + ' ';
    var s = '<svg class="hoodie-svg" viewBox="40 10 420 510" role="img" aria-label="' + esc(p.name) + ', ' + (back ? 'back' : 'front') + '">' + defs(id) +
      '<ellipse cx="250" cy="512" rx="190" ry="10" fill="#000" opacity=".12"/>' +
      '<g fill="' + b + '" stroke="' + line + '" stroke-width="1.4" stroke-linejoin="round">' +
        '<path d="' + sleeves + '"/><path d="' + cuffs + '"/><path d="' + torso + '"/><path d="' + band + '"/></g>' +
      '<path d="' + ribs + '" stroke="' + line + '" stroke-width="1" fill="none"/>' +
      '<path d="M120,250 C128,262 132,276 128,292 M380,250 C372,262 368,276 372,292 M104,330 C112,338 116,350 112,362 M396,330 C388,338 384,350 388,362" stroke="' + line + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    if (!back) {
      s += '<path d="M182,372 L318,372 C322,400 330,430 334,458 L166,458 C170,430 178,400 182,372 Z" fill="' + b + '" stroke="' + line + '" stroke-width="1.6"/>' +
           '<path d="M188,378 L312,378" stroke="' + line + '" stroke-width="1" stroke-dasharray="3 3"/>';
    }
    s += back ? quote(p.back || p.front, { x: 250, y: 164, w: 186, h: 226 }, p.font, ink, p.ink2)
              : quote(p.front, { x: 250, y: 238, w: 172, h: 118 }, p.font, ink, p.ink2);
    s += '<path d="' + hood + '" fill="' + b + '" stroke="' + line + '" stroke-width="1.4"/>';
    if (back) {
      s += '<path d="M250,26 L250,144" stroke="' + line + '" stroke-width="1.4"/>';
    } else {
      var cord = shade(b) ? '#15181D' : '#F2F4F7';
      s += '<path d="M198,116 C198,82 222,62 250,62 C278,62 302,82 302,116 C294,128 280,134 268,136 L250,158 L232,136 C220,134 206,128 198,116 Z" fill="#000" fill-opacity=".36"/>' +
           '<path d="M212,142 L250,176 L288,142 M232,136 L250,158 L268,136" stroke="' + line + '" stroke-width="1.3" fill="none" stroke-linejoin="round"/>' +
           '<path d="M238,156 C237,178 232,198 230,218 M262,156 C263,178 268,198 270,218" stroke="' + cord + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
           '<rect x="225.5" y="216" width="7" height="14" rx="2.5" fill="' + cord + '"/><rect x="267.5" y="216" width="7" height="14" rx="2.5" fill="' + cord + '"/>';
    }
    return s + finish(id, sleeves + ' ' + torso + ' ' + band + ' ' + cuffs + ' ' + hood) + '</svg>';
  };
  window.shopHoodie = hoodie;
  var picture = function (p, view) {
    if (p.photos && p.photos.length) return '<img src="' + p.photos[view === 'back' && p.photos[1] ? 1 : 0] + '" alt="' + esc(p.name) + (view === 'back' ? ', back' : '') + '" loading="' + (p === cur ? 'eager' : 'lazy') + '" decoding="async">';
    return hoodie(p, view);
  };

  /* ───────── bag ───────── */
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem('sc-bag') || '[]').filter(function (l) { return byId[l.id] && S.sizes.indexOf(l.size) > -1 && l.qty > 0; }); } catch (e) { bag = []; }
  var save = function () { try { localStorage.setItem('sc-bag', JSON.stringify(bag)); } catch (e) {} };
  var count = function () { return bag.reduce(function (s, l) { return s + l.qty; }, 0); };
  var unitPrice = function (l) { var p = byId[l.id]; return count() >= S.bundle.qty ? p.price * (1 - S.bundle.percentOff / 100) : p.price; };
  var subtotal = function () { return bag.reduce(function (s, l) { return s + byId[l.id].price * l.qty; }, 0); };
  var total = function () { return bag.reduce(function (s, l) { return s + unitPrice(l) * l.qty; }, 0); };
  var items = function (lines) { return lines.map(function (l) { var p = byId[l.id]; return { id: p.id, name: p.name, variant: l.size, price: unitPrice(l), qty: l.qty }; }); };
  var add = function (id, size, qty) {
    var l = bag.filter(function (x) { return x.id === id && x.size === size; })[0];
    if (l) l.qty += qty || 1; else bag.push({ id: id, size: size, qty: qty || 1 });
    save(); drawBag();
    track('add', [{ id: id, name: byId[id].name, variant: size, price: byId[id].price, qty: qty || 1 }]);
  };

  /* ───────── product page ───────── */
  var cur = byId[(location.hash || '').slice(1)] || S.products[0], view = 'front', size = null;
  var hasBack = function (p) { return !p.photos || p.photos.length > 1; };
  var pdp = $('#pdp');
  var stage = $('.stage', pdp), stageArt = $('.stage-art', pdp);
  var drawStage = function (animate) {
    stage.style.setProperty('--tint', cur.body); stage.style.setProperty('--ink', cur.ink);
    if (!hasBack(cur)) view = 'front';
    stage.classList.toggle('photo', !!cur.photos);
    stage.classList.toggle('one-side', !hasBack(cur));
    stage.setAttribute('aria-label', hasBack(cur) ? 'Turn it around' : cur.name);
    $('.views', pdp).hidden = !hasBack(cur);
    stageArt.innerHTML = picture(cur, view);
    $$('.view-btn', pdp).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === view); b.innerHTML = picture(cur, b.dataset.view) + '<span>' + (b.dataset.view === 'back' ? 'Back' : 'Front') + '</span>'; });
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) { stageArt.classList.remove('swap'); void stageArt.offsetWidth; stageArt.classList.add('swap'); }
  };
  var drawInfo = function () {
    $('.pdp-name', pdp).textContent = cur.name;
    $('.pdp-price', pdp).textContent = money(cur.price);
    $('.pdp-blurb', pdp).textContent = cur.blurb;
    $('.pdp-badge', pdp).textContent = cur.badge || '';
    $('.pdp-badge', pdp).hidden = !cur.badge;
    $('.sticky-name').textContent = cur.name;
    $('.sticky-price').textContent = money(cur.price);
    var row = $('.swatches', pdp), keep = row.scrollLeft;
    row.innerHTML = S.products.map(function (p) {
      return '<button class="swatch" type="button" role="radio" aria-checked="' + (p === cur) + '" data-id="' + p.id + '" style="--c:' + p.body + '" aria-label="' + esc(p.name) + '">' + (p.photos ? '<img src="' + p.photos[0] + '" alt="" loading="lazy" decoding="async">' : hoodie(p, 'front')) + '</button>';
    }).join('');
    row.scrollLeft = keep;
    $('.details', pdp).innerHTML = ((S.details[cur.type] || S.details.hoodie) || []).map(function (d, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(d[0]) + '</summary><p>' + esc(d[1]) + '</p></details>'; }).join('');
    $('.swatch-name', pdp).textContent = cur.name;
  };
  var setSize = function (s) {
    size = s;
    $$('.size', pdp).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.size === s); });
    $('.size-hint', pdp).hidden = true;
    $('.add-btn .add-label', pdp).textContent = s ? 'Add size ' + s + ' to bag' : 'Add to bag';
  };
  var choose = function (p, scroll) {
    if (p === cur) return;
    cur = p; drawStage(true); drawInfo();
    try { history.replaceState(null, '', '#' + p.id); } catch (e) {}
    track('view', [{ id: p.id, name: p.name, price: p.price, qty: 1 }]);
    $$('.card').forEach(function (c) { c.classList.toggle('is-current', c.dataset.id === p.id); });
    if (scroll) pdp.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  $('.sizes', pdp).innerHTML = S.sizes.map(function (s) { return '<button class="size" type="button" role="radio" aria-checked="false" data-size="' + s + '">' + s + '</button>'; }).join('');
  $('.ship-note', pdp).textContent = S.shipsIn;
  $('.ret-note', pdp).textContent = S.returns;
  // the quote ticker: every product's quote, twice over so the loop is seamless
  var tick = S.products.filter(function (p) { return p.front; }).map(function (p) { return '<span>' + esc((p.back || p.front).map(function (l) { return l.replace(/^\^/, '').trim(); }).join(' ')) + '</span>'; }).join('');
  $$('.ticker-run').forEach(function (t) { t.innerHTML = tick + tick; });
  // home: four designs, mixing fronts and backs, hoodies and tees
  var heroPicks = ['santa-hoodie', 'vibe-xmas', 'wishlist-hoodie', 'santa-knit'].map(function (id) { return byId[id]; }).filter(Boolean);
  S.products.forEach(function (p) { if (heroPicks.length < 4 && heroPicks.indexOf(p) < 0) heroPicks.push(p); });
  $('.hero-pics').innerHTML = heroPicks.map(function (p, i) { return '<a href="#' + p.id + '" tabindex="-1" style="--tint:' + p.body + '">' + picture(p, !p.photos && i === 2 ? 'back' : 'front') + '</a>'; }).join('');
  $('.foot-guide').addEventListener('click', function () { drawGuide(); var g = $('#size-guide'); g.showModal ? g.showModal() : g.setAttribute('open', ''); });
  $$('[data-filter]').forEach(function (a) { a.addEventListener('click', function () { var b = $('.filters button[data-f="' + a.dataset.filter + '"]'); if (b) b.click(); }); });
  $('.bundle-note', pdp).textContent = 'Buy ' + S.bundle.qty + ', save ' + S.bundle.percentOff + '% on each';

  pdp.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.classList.contains('swatch')) choose(byId[t.dataset.id]);
    else if (t.classList.contains('size')) setSize(t.dataset.size);
    else if (t.classList.contains('view-btn')) { if (view !== t.dataset.view) { view = t.dataset.view; drawStage(true); } }
  });
  var flip = function () { if (!hasBack(cur)) return; view = view === 'front' ? 'back' : 'front'; drawStage(true); };
  stage.addEventListener('click', flip);
  // swipe the stage on phones to turn the hoodie
  var sx = null;
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) { if (hasBack(cur)) return flip(); var i = S.products.indexOf(cur), n = S.products.length; choose(S.products[(i + (dx < 0 ? 1 : -1) + n) % n]); } });

  var needSize = function () {
    var h = $('.size-hint', pdp); h.hidden = false;
    var row = $('.sizes', pdp); row.classList.remove('nudge'); void row.offsetWidth; row.classList.add('nudge');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('.size', pdp).focus({ preventScroll: true });
  };
  var doAdd = function () { if (!size) return needSize(); add(cur.id, size, 1); openBag(); };
  $('.add-btn', pdp).addEventListener('click', doAdd);
  $('.sticky-add').addEventListener('click', doAdd);
  $('.buy-now', pdp).addEventListener('click', function () {
    if (!size) return needSize();
    add(cur.id, size, 1); checkout();
  });

  // sticky add-to-bag bar once the main button scrolls away
  var sticky = $('.sticky');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { var e = en[0]; sticky.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0); }, { threshold: 0 }).observe($('.add-row', pdp));
  }

  /* ───────── collection ───────── */
  $('.grid').innerHTML = S.products.map(function (p) {
    return '<article class="card' + (p === cur ? ' is-current' : '') + (p.photos ? ' photo' : '') + '" data-id="' + p.id + '" data-type="' + (p.type || 'hoodie') + '" style="--tint:' + p.body + '">' +
      '<button class="card-pic" type="button" aria-label="See the ' + esc(p.name) + '">' + '<span class="card-front">' + picture(p, 'front') + '</span>' + (hasBack(p) ? '<span class="card-back">' + picture(p, 'back') + '</span>' : '') + (p.badge ? '<span class="card-badge">' + esc(p.badge) + '</span>' : '') + '</button>' +
      '<div class="card-row"><h3>' + esc(p.name.replace(/\s+(hoodie|tee|t-shirt|knit sweater|sweater)$/i, '')) + '</h3><p>' + money(p.price) + '</p></div>' +
      '</article>';
  }).join('');
  // filter chips
  var types = {}; S.products.forEach(function (p) { types[p.type || 'hoodie'] = (types[p.type || 'hoodie'] || 0) + 1; });
  var LABEL = { hoodie: 'Hoodies', tee: 'Tees', sweater: 'Knit sweaters' };
  var filters = $('.filters');
  if (Object.keys(types).length > 1) {
    filters.innerHTML = '<button type="button" aria-pressed="true" data-f="all">All <span>' + S.products.length + '</span></button>' + Object.keys(types).map(function (t) { return '<button type="button" aria-pressed="false" data-f="' + t + '">' + (LABEL[t] || t) + ' <span>' + types[t] + '</span></button>'; }).join('');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', filters).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('.card').forEach(function (c) { c.hidden = b.dataset.f !== 'all' && c.dataset.type !== b.dataset.f; });
    });
  } else filters.hidden = true;
  $('.grid').addEventListener('click', function (e) {
    var card = e.target.closest('.card'); if (!card) return;
    location.hash = card.dataset.id;
  });

  /* ───────── bag drawer ───────── */
  var drawer = $('#bag'), body = $('.bag-lines', drawer);
  var drawBag = function () {
    var n = count();
    $$('.bag-count').forEach(function (el) { el.textContent = n; el.hidden = !n; });
    $('.bag-title', drawer).textContent = n ? 'Your bag (' + n + ')' : 'Your bag';
    // free shipping progress
    var bar = $('.freeship', drawer), sub = total();
    if (S.freeShippingOver > 0 && n) {
      var left = S.freeShippingOver - sub;
      bar.hidden = false;
      $('.freeship-text', bar).textContent = left > 0 ? money(left) + ' away from free shipping' : 'You’ve got free shipping';
      $('.freeship-fill', bar).style.width = Math.min(100, sub / S.freeShippingOver * 100) + '%';
      bar.classList.toggle('done', left <= 0);
    } else bar.hidden = true;
    if (!n) {
      body.innerHTML = '<div class="bag-empty"><p>Your bag is empty.</p><button class="pill-btn ghost" type="button" data-close>Pick a hoodie</button></div>';
    } else {
      body.innerHTML = bag.map(function (l, i) {
        var p = byId[l.id], u = unitPrice(l), off = u < p.price;
        return '<div class="line" style="--tint:' + p.body + '"><div class="line-pic">' + picture(p, 'front') + '</div>' +
          '<div class="line-info"><p class="line-name">' + esc(p.name) + '</p><p class="line-meta">Size ' + l.size + '</p>' +
          '<div class="stepper"><button type="button" data-step="-1" data-i="' + i + '" aria-label="One fewer">−</button><span aria-live="polite">' + l.qty + '</span><button type="button" data-step="1" data-i="' + i + '" aria-label="One more">+</button></div></div>' +
          '<div class="line-price">' + (off ? '<s>' + money(p.price * l.qty) + '</s>' : '') + '<b>' + money(u * l.qty) + '</b><button type="button" class="line-rm" data-rm="' + i + '">Remove</button></div></div>';
      }).join('');
      // nudge toward the bundle
      if (n < S.bundle.qty) {
        var others = S.products.filter(function (p) { return !bag.some(function (l) { return l.id === p.id; }); });
        var pick = others[0] || S.products[0], lastSize = bag[bag.length - 1].size;
        body.innerHTML += '<div class="upsell" style="--tint:' + pick.body + '"><div class="line-pic">' + picture(pick, 'front') + '</div><div><p><b>Add a second hoodie and save ' + S.bundle.percentOff + '% on both.</b></p><p class="line-meta">' + esc(pick.name) + ', size ' + lastSize + ', ' + money(pick.price * (1 - S.bundle.percentOff / 100)) + '</p></div><button type="button" class="pill-btn small" data-upsell="' + pick.id + '" data-size="' + lastSize + '">Add</button></div>';
      }
    }
    var saved = subtotal() - total();
    $('.bag-saved', drawer).hidden = saved <= 0;
    $('.bag-saved b', drawer).textContent = '−' + money(saved);
    $('.bag-total', drawer).textContent = money(total());
    $('.bag-foot', drawer).hidden = !n;
  };
  var lastFocus = null;
  var openBag = function () {
    lastFocus = document.activeElement;
    drawBag(); drawer.hidden = false; document.documentElement.classList.add('locked');
    requestAnimationFrame(function () { drawer.classList.add('open'); $('.bag-panel', drawer).focus({ preventScroll: true }); });
  };
  var closeBag = function () {
    drawer.classList.remove('open'); document.documentElement.classList.remove('locked');
    setTimeout(function () { drawer.hidden = true; $('.hold', drawer).hidden = true; $('.bag-main', drawer).hidden = false; }, 320);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  $$('[data-open-bag]').forEach(function (b) { b.addEventListener('click', openBag); });
  drawer.addEventListener('click', function (e) {
    var t = e.target;
    if (t === drawer || t.closest('[data-close]')) return closeBag();
    var b = t.closest('button'); if (!b) return;
    if (b.dataset.step) { var l = bag[+b.dataset.i]; l.qty += +b.dataset.step; if (l.qty < 1) bag.splice(+b.dataset.i, 1); else if (+b.dataset.step > 0) track('add', items([{ id: l.id, size: l.size, qty: 1 }])); save(); drawBag(); }
    else if (b.dataset.rm) { bag.splice(+b.dataset.rm, 1); save(); drawBag(); }
    else if (b.dataset.upsell) add(b.dataset.upsell, b.dataset.size, 1);
  });
  document.addEventListener('keydown', function (e) {
    if (drawer.hidden) return;
    if (e.key === 'Escape') closeBag();
    if (e.key === 'Tab') { // keep focus inside the drawer
      var f = $$('button, a[href], input, textarea', $('.bag-panel', drawer)).filter(function (x) { return x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ───────── checkout ─────────
     Step 1, inside the bag: full name and email (remembered for next time).
     Step 2: Stripe Checkout with the email already filled in, where Apple Pay,
     Google Pay and Link make paying one tap. Until a Stripe endpoint is set,
     step 1 sends a "hold my order" request instead. */
  var C = S.checkout;
  var utm = function () { return window.shopAttribution ? window.shopAttribution() : {}; };
  var shopifyLive = function () { return !!C.shopifyDomain && bag.every(function (l) { return byId[l.id].variants && byId[l.id].variants[l.size]; }); };
  var stripeLive = function () { return !!C.stripeEndpoint; };
  var me = {}; try { me = JSON.parse(localStorage.getItem('sc-me') || '{}'); } catch (e) {}
  var hold = $('.hold', drawer), form = $('.hold-form', hold), err = $('.hold-err', form), submitBtn = $('.hold-submit', form);
  var orderText = function () { return bag.map(function (l) { return l.qty + ' x ' + byId[l.id].name + ' size ' + l.size; }).join('\n'); };
  var inbox = function (subject, extra) { // fire-and-forget email to the shop inbox
    if (!C.holdEmail) return Promise.resolve();
    var data = { _subject: subject, _template: 'table', _captcha: 'false', order: orderText(), total: money(total()) };
    Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });
    var u = utm(); Object.keys(u).forEach(function (k) { data[k] = u[k]; });
    return fetch('https://formsubmit.co/ajax/' + C.holdEmail, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  };
  var thanks = $('.thanks');
  var showThanks = function (o) {
    if (!drawer.hidden) { drawer.classList.remove('open'); document.documentElement.classList.remove('locked'); drawer.hidden = true; }
    $('.thanks-kicker', thanks).innerHTML = o.kicker;
    $('#thanks-h', thanks).textContent = o.title;
    $('.thanks-lead', thanks).innerHTML = o.lead;
    $('.thanks-items', thanks).innerHTML = (o.items || []).map(function (i) {
      var p = byId[i.id] || {};
      return '<li>' + (p.photos ? '<img src="' + p.photos[0] + '" alt="">' : '<span></span>') + '<p>' + esc(i.name) + '<span>Size ' + esc(i.variant) + (i.qty > 1 ? ' · Qty ' + i.qty : '') + '</span></p><b>' + money(i.price * i.qty) + '</b></li>';
    }).join('');
    $('.thanks-total-label', thanks).textContent = o.totalLabel;
    $('.thanks-total-value', thanks).textContent = money(o.total || 0);
    $('.thanks-total', thanks).hidden = !o.items || !o.items.length;
    $('.thanks-steps', thanks).innerHTML = o.steps.map(function (s, k) { return '<li' + (k === 0 ? ' class="done"' : '') + '><b>' + s[0] + '</b><span>' + s[1] + '</span></li>'; }).join('');
    thanks.hidden = false; document.documentElement.classList.add('locked');
    setTimeout(function () { $('#thanks-h', thanks).focus({ preventScroll: true }); }, 50);
  };
  $('.thanks-close').addEventListener('click', function () { thanks.hidden = true; document.documentElement.classList.remove('locked'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !thanks.hidden) $('.thanks-close').click(); });
  var checkout = function () {
    if (!count()) return;
    track('checkout', items(bag));
    if (shopifyLive()) {
      var url = 'https://' + C.shopifyDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') + '/cart/' + bag.map(function (l) { return byId[l.id].variants[l.size] + ':' + l.qty; }).join(',');
      var qs = [], u = utm();
      if (C.discountCode) qs.push('discount=' + encodeURIComponent(C.discountCode));
      if (me.email) qs.push('checkout[email]=' + encodeURIComponent(me.email));
      Object.keys(u).forEach(function (k) { qs.push(k.indexOf('utm_') === 0 ? k + '=' + encodeURIComponent(u[k]) : 'attributes[' + k + ']=' + encodeURIComponent(u[k])); });
      location.href = url + (qs.length ? '?' + qs.join('&') : '');
      return;
    }
    if (drawer.hidden) openBag();
    var stripe = stripeLive();
    $('.bag-main', drawer).hidden = true; hold.hidden = false; form.hidden = false; $('.hold-done', hold).hidden = true; err.hidden = true;
    $('.steps', form).hidden = !stripe;
    $('.hold-express', form).hidden = !stripe;
    $('.hold-title', form).textContent = stripe ? 'Your details' : 'Hold your order';
    $('.hold-intro', form).textContent = stripe ? 'Next you’ll pay securely on Stripe, with your email already filled in.' : 'Online payment opens shortly. Leave your name and email and we’ll hold your sizes, then email you a payment link.';
    $('.hold-submit-label', form).textContent = stripe ? 'Continue to payment' : 'Hold my order';
    $('.hold-sum', form).textContent = bag.map(function (l) { return l.qty + ' × ' + byId[l.id].name + ' (' + l.size + ')'; }).join(', ') + '. Total ' + money(total());
    if (me.name && !form.name.value) form.name.value = me.name;
    if (me.email && !form.email.value) form.email.value = me.email;
    setTimeout(function () { (form.name.value && form.email.value ? submitBtn : form.name.value ? form.email : form.name).focus(); }, 80);
  };
  $('.checkout-btn', drawer).addEventListener('click', checkout);
  $('.hold-back', drawer).addEventListener('click', function () { hold.hidden = true; $('.bag-main', drawer).hidden = false; });
  var busy = function (on, label) { submitBtn.disabled = on; $('.hold-submit-label', form).textContent = label; };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var name = form.name.value.trim().replace(/\s+/g, ' '), email = form.email.value.trim();
    me = { name: name, email: email };
    try { localStorage.setItem('sc-me', JSON.stringify(me)); } catch (x) {}
    if (window.shopIdentify) window.shopIdentify(email, name);
    track('lead', items(bag));
    err.hidden = true;

    if (stripeLive()) {
      busy(true, 'Opening secure checkout…');
      var redirect = $('.redirect'); redirect.hidden = false;
      if (C.captureLeads) inbox('Checkout started: ' + name + ', ' + money(total()), { name: name, email: email }).catch(function () {});
      fetch(C.stripeEndpoint.replace(/\/$/, ''), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, name: name, utm: utm(), ids: window.shopClientIds ? window.shopClientIds() : {}, items: bag.map(function (l) { return { id: l.id, size: l.size, qty: l.qty }; }) })
      })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || r.status); return j; }); })
        .then(function (j) {
          try { localStorage.setItem('sc-pending', JSON.stringify({ name: name, email: email, value: Math.round(total() * 100) / 100, items: items(bag), id: j.id })); } catch (x) {}
          location.href = j.url;
        })
        .catch(function (x) {
          redirect.hidden = true; busy(false, 'Continue to payment');
          err.textContent = 'Checkout didn’t open. ' + (x && x.message && !/^\d+$/.test(x.message) ? x.message + '. ' : '') + 'Please try again.';
          err.hidden = false;
        });
      return;
    }

    // Show the thank-you at once; the email goes out in the background and is
    // retried later (even on the next visit) if the connection drops.
    var held = items(bag), heldTotal = total();
    queueHold({ subject: S.brand + ' order hold: ' + count() + ' item(s), ' + money(total()), order: orderText(), total: money(total()), name: name, email: email, utm: utm(), at: Date.now() });
    bag = []; save(); drawBag();
    showThanks({
      kicker: 'Order <b>held</b>',
      title: 'Thanks, ' + name.split(' ')[0] + '. Your sizes are saved.',
      lead: 'We’ll email <b>' + esc(email) + '</b> a secure payment link within one business day. Nothing is charged until you pay.',
      items: held, total: heldTotal, totalLabel: 'Order total',
      steps: [['Order held', 'Your sizes are set aside'], ['Payment link', 'Sent to your email within one business day'], ['On its way', 'Ships 2–3 business days after payment, with tracking']]
    });
  });

  // Outbox for hold requests: send now, keep until the inbox service confirms.
  var OUT = 'sc-outbox';
  var readOut = function () { try { return JSON.parse(localStorage.getItem(OUT) || '[]'); } catch (x) { return []; } };
  var writeOut = function (list) { try { localStorage.setItem(OUT, JSON.stringify(list)); } catch (x) {} };
  var flushing = false;
  var flushHolds = function () {
    if (flushing || !C.holdEmail) return;
    var list = readOut(); if (!list.length) return;
    flushing = true;
    var h = list[0], data = { _subject: h.subject, _template: 'table', _captcha: 'false', name: h.name, email: h.email, _replyto: h.email, order: h.order, total: h.total };
    Object.keys(h.utm || {}).forEach(function (k) { data[k] = h.utm[k]; });
    fetch('https://formsubmit.co/ajax/' + C.holdEmail, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); writeOut(readOut().filter(function (x) { return x.at !== h.at; })); flushing = false; flushHolds(); })
      .catch(function () { flushing = false; setTimeout(flushHolds, 15000); });
  };
  var queueHold = function (h) { var list = readOut(); list.push(h); writeOut(list.slice(-20)); flushHolds(); };
  flushHolds();
  window.addEventListener('online', flushHolds);

  // Coming back from Stripe
  (function () {
    var q = new URLSearchParams(location.search), state = q.get('order');
    if (!state) return;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (x) {}
    if (state === 'success') {
      var pend = {}; try { pend = JSON.parse(localStorage.getItem('sc-pending') || '{}'); localStorage.removeItem('sc-pending'); } catch (x) {}
      var sid = q.get('session_id') || pend.id || '';
      if (pend.items) track('purchase', pend.items, { value: pend.value, eventId: sid, orderId: sid });
      bag = []; save(); drawBag();
      var first = (pend.name || me.name || '').split(' ')[0];
      var num = sid ? 'SC-' + sid.replace(/^cs_(test|live)_/, '').slice(-8).toUpperCase() : '';
      setTimeout(function () {
        showThanks({
          kicker: num ? 'Order <b>' + num + '</b> confirmed' : 'Order confirmed',
          title: first ? 'Thanks, ' + first + '! It’s on the way.' : 'Thanks! It’s on the way.',
          lead: 'A receipt is headed to <b>' + esc(pend.email || me.email || 'your inbox') + '</b>.',
          items: pend.items, total: pend.value, totalLabel: 'Total paid',
          steps: [['Payment confirmed', 'Receipt sent to your email'], ['Packing your order', 'Ships in 2–3 business days'], ['On its way', 'Tracking link by email as soon as it ships']]
        });
      }, 120);
    } else if (state === 'cancel') {
      setTimeout(function () { if (count()) { openBag(); } }, 150);
    }
  })();

  /* ───────── size guide ───────── */
  var guide = $('#size-guide');
  var drawGuide = function () {
    var chart = Array.isArray(S.sizeChart) ? S.sizeChart : (S.sizeChart[cur.type] || S.sizeChart.hoodie);
    $('#guide-h').textContent = 'Size guide: ' + ({ tee: 'tees', sweater: 'knit sweaters' }[cur.type] || 'hoodies');
    $('tbody', guide).innerHTML = chart.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '″</td><td>' + r[2] + '″</td></tr>'; }).join('');
  };
  drawGuide();
  $('.guide-link', pdp).addEventListener('click', function () { drawGuide(); guide.showModal ? guide.showModal() : guide.setAttribute('open', ''); });
  guide.addEventListener('click', function (e) { if (e.target === guide || e.target.closest('[data-close]')) guide.close ? guide.close() : guide.removeAttribute('open'); });

  /* ───────── go ───────── */
  if (S.freeShippingOver > 0) $('.announce-text').textContent = 'Free US shipping over ' + money(S.freeShippingOver) + '. Buy ' + S.bundle.qty + ', save ' + S.bundle.percentOff + '%.';
  drawStage(); drawInfo(); drawBag();
  // Home shows the hero and the collection; a product opens only when one is picked (#product-id).
  var hero = $('#home'), moreHead = $('#all-h');
  var route = function (first) {
    var p = byId[(location.hash || '').slice(1)];
    if (p) {
      hero.hidden = true; pdp.hidden = false;
      moreHead.textContent = 'More designs';
      if (p !== cur) choose(p); else track('view', [{ id: p.id, name: p.name, price: p.price, qty: 1 }]);
      document.title = p.name + ' · ' + S.brand;
      window.scrollTo(0, 0);
    } else {
      hero.hidden = false; pdp.hidden = true; sticky.classList.remove('on');
      moreHead.textContent = 'All designs';
      document.title = S.brand + ': ' + S.tagline.toLowerCase();
      $$('.card').forEach(function (c) { c.classList.remove('is-current'); });
      var t = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (t && !first) t.scrollIntoView();
    }
  };
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
  // Product data for Google Shopping / rich results
  var ld = { '@context': 'https://schema.org', '@graph': S.products.map(function (p) { return { '@type': 'Product', name: p.name, description: p.blurb, brand: { '@type': 'Brand', name: S.brand }, image: new URL(p.image || (p.photos ? p.photos[0] : 'assets/og.png'), location.href).href, offers: { '@type': 'Offer', price: p.price, priceCurrency: S.currency, availability: 'https://schema.org/InStock', url: location.href.split('#')[0] + '#' + p.id } }; }) };
  var sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
});
