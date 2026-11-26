/* Santa Claude — hoodies for developers.
   Product pictures are drawn as SVG from each product's colours in
   shop-config.js, so a new colourway needs no photo shoot. Swap in real
   photos later by adding `photos: ['front.jpg', 'back.jpg']` to a product. */
(function () {
  var S = window.SHOP, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = window.shopTrack || function () {};
  var byId = {}; S.products.forEach(function (p) { byId[p.id] = p; });
  var money = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ───────── hoodie drawing ───────── */
  var seal = function (cx, cy, r, fill, extra) {
    var pts = [];
    for (var k = 0; k < 32; k++) { var a = (-90 + k * 11.25) * Math.PI / 180, rr = k % 2 ? r * .924 : r; pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"' + (extra || '') + '/>';
  };
  var PIX = 'Silkscreen, monospace', MONO = 'JetBrains Mono, ui-monospace, monospace';
  var T = function (x, y, size, txt, fill, w, font, anchor) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '" font-family="' + (font || PIX) + '" font-weight="700"' + (w ? ' textLength="' + w + '" lengthAdjust="spacingAndGlyphs"' : '') + '>' + txt + '</text>';
  };
  // pixel art: rows of characters, '#' = ink, 'g' = second ink, 'r' = candy red, 'w' = snow
  var pix = function (rows, x0, y0, size, c) {
    var out = '';
    rows.forEach(function (row, j) {
      for (var i = 0; i < row.length; i++) { var k = row[i]; if (c[k]) out += '<rect x="' + (x0 + i * size).toFixed(1) + '" y="' + (y0 + j * size).toFixed(1) + '" width="' + (size + .3).toFixed(1) + '" height="' + (size + .3).toFixed(1) + '" fill="' + c[k] + '"/>'; }
    });
    return out;
  };
  var FLAKE = ['#..#..#', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '#..#..#'];
  var TREE7 = ['...#...', '..###..', '.#####.', '..###..', '.#####.', '#######', '...#...'];
  var KNIT = (function () {
    var rows = ['rrrrrrrrrrrrrrrr', '.r.r.r.r.r.r.r.r', '................'];
    for (var i = 0; i < 7; i++) rows.push(FLAKE[i] + '.' + TREE7[i] + '.');
    return rows.concat(['................', '.r.r.r.r.r.r.r.r', 'rrrrrrrrrrrrrrrr']);
  })();
  var knit = function (x0, y0, cols, size, c) { return pix(KNIT.map(function (r) { var o = ''; for (var i = 0; i < cols; i++) o += r[i % r.length]; return o; }), x0, y0, size, c); };
  window.knitSVG = function (ink, red, size) { // one repeat of the knit band, for page decoration
    size = size || 6;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + 16 * size + '" height="' + KNIT.length * size + '" shape-rendering="crispEdges">' + pix(KNIT, 0, 0, size, { '#': ink, r: red }) + '</svg>';
  };
  var TREE = ['......g......', '.....ggg.....', '......#......', '.....###.....', '....##r##....', '...#######...', '....#####....', '...##r####...', '..#########..', '...####r##...', '..#########..', '.##r#####r##.', '#############', '.....###.....', '.....###.....'];
  var HAT = ['.......ww.', '......rww.', '.....rr...', '....rrrr..', '...rrrrr..', '..rrrrrrr.', 'wwwwwwwwww', 'wwwwwwwwww'];
  var BOX = ['..r...r..', '...r.r...', '####r####', '####r####', '.###r###.', '.###r###.', '.###r###.', '.###r###.'];
  var RED = '#E5323B', SNOW = '#F3F5FA';
  var PRINTS = {
    sweater: {
      front: function (ink, body, ink2) { return knit(155, 232, 38, 5, { '#': ink, r: ink2 }) + T(250, 322, 12, 'UGLY SWEATER.EXE', ink, 120); },
      back: function (ink, body, ink2) { return pix(TREE, 185, 172, 10, { '#': ink, r: ink2, g: '#F4C542' }) + T(250, 366, 22, 'DEPLOY FREEZE', ink, 172); }
    },
    sleigh: {
      front: function (ink) { return pix(HAT, 194, 230, 3.6, { r: RED, w: SNOW }); },
      back: function (ink, body, ink2) { return pix(HAT, 232, 168, 3.6, { r: RED, w: SNOW }) + T(250, 236, 32, 'IT WORKS', ink, 168) + T(250, 284, 32, 'ON MY', ink, 104) + T(250, 344, 44, 'SLEIGH', ink2, 172); }
    },
    hotfix: {
      front: function (ink, body, ink2) { return T(250, 256, 22, 'HO HO', ink, 100) + T(250, 284, 22, 'HOTFIX', ink2, 112); },
      back: function (ink, body, ink2) { return T(170, 226, 15, '$ git commit -m', ink, 150, MONO, 'start') + T(170, 262, 25, '"ho ho ho"', ink2, 160, MONO, 'start') + T(170, 306, 15, '$ git push origin', ink, 160, MONO, 'start') + T(170, 338, 24, 'north-pole', ink, 160, MONO, 'start'); }
    },
    gift: {
      front: function (ink, body, ink2) { return T(250, 250, 13, 'git push --gift', ink, 118, MONO) + pix(BOX, 232, 262, 4, { '#': ink, r: ink2 }); },
      back: function (ink, body, ink2) { return T(172, 222, 20, 'if (nice) {', ink, 140, MONO, 'start') + T(196, 256, 20, 'ship(gift);', ink, 140, MONO, 'start') + T(172, 290, 20, '} else {', ink, 100, MONO, 'start') + T(196, 324, 20, 'ship(coal);', ink2, 140, MONO, 'start') + T(172, 358, 20, '}', ink, 0, MONO, 'start'); }
    }
  };
  var uid = 0;
  var hoodie = function (p, view) {
    var id = 'h' + (uid++), b = p.body, ink = p.ink, back = view === 'back';
    var rgb = parseInt(b.slice(1), 16), light = (0.299 * (rgb >> 16) + 0.587 * (rgb >> 8 & 255) + 0.114 * (rgb & 255)) > 170;
    var line = light ? 'rgba(22,28,64,.16)' : 'rgba(0,0,0,.28)';
    var sleeves = 'M168,118 C138,124 118,142 110,178 L84,430 L134,438 L158,236 Z M332,118 C362,124 382,142 390,178 L416,430 L366,438 L342,236 Z';
    var cuffs = 'M84,430 L134,438 L131,476 L81,470 Z M416,430 L366,438 L369,476 L419,470 Z';
    var torso = 'M168,118 C184,104 204,98 214,96 L286,96 C296,98 316,104 332,118 C340,150 346,200 348,250 L352,468 L148,468 L152,250 C154,200 160,150 168,118 Z';
    var band = 'M148,468 L352,468 L351,504 L149,504 Z';
    var hood = back ? 'M180,114 C176,52 212,24 250,24 C288,24 324,52 320,114 C306,152 194,152 180,114 Z'
                    : 'M176,120 C170,72 204,42 250,42 C296,42 330,72 324,120 C318,132 300,140 288,142 L250,176 L212,142 C200,140 182,132 176,120 Z';
    var ribs = '';
    for (var x = 156; x < 350; x += 7) ribs += 'M' + x + ',471 L' + x + ',501 ';
    for (var c = 0; c < 6; c++) ribs += 'M' + (88 + c * 7.5) + ',' + (433 + c * 1.2) + ' L' + (85 + c * 7.5) + ',' + (471 + c * 1) + ' M' + (412 - c * 7.5) + ',' + (433 + c * 1.2) + ' L' + (415 - c * 7.5) + ',' + (471 + c * 1) + ' ';
    var s = '<svg class="hoodie-svg" viewBox="40 10 420 510" role="img" aria-label="' + esc(p.name) + ', ' + (back ? 'back' : 'front') + '">' +
      '<defs><linearGradient id="' + id + 's" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>' +
      '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>' +
      '<ellipse cx="250" cy="512" rx="190" ry="10" fill="#000" opacity=".12"/>' +
      '<g fill="' + b + '" stroke="' + line + '" stroke-width="1.4" stroke-linejoin="round">' +
        '<path d="' + sleeves + '"/><path d="' + cuffs + '"/><path d="' + torso + '"/><path d="' + band + '"/></g>' +
      '<path d="' + ribs + '" stroke="' + line + '" stroke-width="1" fill="none"/>' +
      '<path d="M120,250 C128,262 132,276 128,292 M380,250 C372,262 368,276 372,292 M104,330 C112,338 116,350 112,362 M396,330 C388,338 384,350 388,362" stroke="' + line + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    if (!back) {
      s += '<path d="M182,372 L318,372 C322,400 330,430 334,458 L166,458 C170,430 178,400 182,372 Z" fill="' + b + '" stroke="' + line + '" stroke-width="1.6"/>' +
           '<path d="M188,378 L312,378" stroke="' + line + '" stroke-width="1" stroke-dasharray="3 3"/>';
    }
    s += (back ? PRINTS[p.art].back(ink, b, p.ink2) : PRINTS[p.art].front(ink, b, p.ink2));
    s += '<path d="' + hood + '" fill="' + b + '" stroke="' + line + '" stroke-width="1.4"/>';
    if (back) {
      s += '<path d="M250,26 L250,144" stroke="' + line + '" stroke-width="1.4"/>';
    } else {
      s += '<path d="M198,116 C198,82 222,62 250,62 C278,62 302,82 302,116 C294,128 280,134 268,136 L250,158 L232,136 C220,134 206,128 198,116 Z" fill="#000" fill-opacity=".36"/>' +
           '<path d="M212,142 L250,176 L288,142 M232,136 L250,158 L268,136" stroke="' + line + '" stroke-width="1.3" fill="none" stroke-linejoin="round"/>' +
           '<path d="M238,156 C237,178 232,198 230,218 M262,156 C263,178 268,198 270,218" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
           '<rect x="225.5" y="216" width="7" height="14" rx="2.5" fill="' + ink + '"/><rect x="267.5" y="216" width="7" height="14" rx="2.5" fill="' + ink + '"/>';
    }
    s += '<path d="' + sleeves + ' ' + torso + ' ' + band + ' ' + cuffs + '" fill="url(#' + id + 's)" style="mix-blend-mode:multiply" pointer-events="none"/>' +
         '<path d="' + hood + ' ' + torso + '" fill="url(#' + id + 'v)" pointer-events="none"/>';
    return s + '</svg>';
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
      return '<button class="swatch" type="button" role="radio" aria-checked="' + (p === cur) + '" data-id="' + p.id + '" style="--c:' + p.body + '" aria-label="' + esc(p.name) + '">' + (p.photos ? '<img src="' + p.photos[0] + '" alt="" loading="lazy" decoding="async">' : '') + '</button>';
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
  $('.cut-note', pdp).textContent = S.holidayCutoff; $('.cutoff').textContent = S.holidayCutoff + '.';
  // knit decoration
  var knitUrl = function (ink, red, size) { return 'url("data:image/svg+xml,' + encodeURIComponent(window.knitSVG(ink, red, size)) + '")'; };
  $('.knit-band').style.backgroundImage = knitUrl('#F3F5FA', '#E5323B', 4);
  $('.about-art').style.backgroundImage = knitUrl('#F3F5FA', '#E5323B', 10);
  $('.top-hat').innerHTML = '<svg viewBox="0 0 10 8" width="26" height="21" shape-rendering="crispEdges">' + pix(HAT, 0, 0, 1, { r: RED, w: '#161C40' }) + '</svg>';
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
      '<div class="card-row"><h3>' + esc(p.name) + '</h3><p>' + money(p.price) + '</p></div>' +
      '<div class="quick" role="group" aria-label="Quick add ' + esc(p.name) + '">' + S.sizes.map(function (s) { return '<button type="button" data-size="' + s + '" aria-label="Add ' + esc(p.name) + ', size ' + s + '">' + s + '</button>'; }).join('') + '</div>' +
      '</article>';
  }).join('');
  // filter chips
  var types = {}; S.products.forEach(function (p) { types[p.type || 'hoodie'] = (types[p.type || 'hoodie'] || 0) + 1; });
  var LABEL = { hoodie: 'Hoodies', sweater: 'Knit sweaters' };
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
    var q = e.target.closest('.quick button');
    if (q) { add(card.dataset.id, q.dataset.size, 1); q.classList.add('done'); setTimeout(function () { q.classList.remove('done'); }, 900); openBag(); return; }
    if (e.target.closest('.card-pic')) choose(byId[card.dataset.id], true);
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

  /* ───────── checkout ───────── */
  var C = S.checkout, live = function () { return !!C.shopifyDomain && bag.every(function (l) { return byId[l.id].variants && byId[l.id].variants[l.size]; }); };
  var checkout = function () {
    if (!count()) return;
    track('checkout', items(bag));
    if (live()) {
      var url = 'https://' + C.shopifyDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') + '/cart/' + bag.map(function (l) { return byId[l.id].variants[l.size] + ':' + l.qty; }).join(',');
      var qs = [];
      if (C.discountCode) qs.push('discount=' + encodeURIComponent(C.discountCode));
      try { var utm = JSON.parse(sessionStorage.getItem('shop-utm') || '{}'); Object.keys(utm).forEach(function (k) { qs.push(k.indexOf('utm_') === 0 ? k + '=' + encodeURIComponent(utm[k]) : 'attributes[' + k + ']=' + encodeURIComponent(utm[k])); }); } catch (e) {}
      location.href = url + (qs.length ? '?' + qs.join('&') : '');
      return;
    }
    // Not connected to a store yet: take a hold request instead of payment.
    if (drawer.hidden) openBag();
    $('.bag-main', drawer).hidden = true;
    var hold = $('.hold', drawer); hold.hidden = false;
    $('.hold-form', hold).hidden = false; $('.hold-done', hold).hidden = true;
    $('.hold-sum', hold).textContent = bag.map(function (l) { return l.qty + ' × ' + byId[l.id].name + ' (' + l.size + ')'; }).join(', ') + '. Total ' + money(total());
    setTimeout(function () { $('input[name="email"]', hold).focus(); }, 60);
  };
  $('.checkout-btn', drawer).addEventListener('click', checkout);
  $('.hold-back', drawer).addEventListener('click', function () { $('.hold', drawer).hidden = true; $('.bag-main', drawer).hidden = false; });
  $('.hold-form', drawer).addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button[type="submit"]', f), err = $('.hold-err', f);
    if (!f.reportValidity()) return;
    btn.disabled = true; btn.textContent = 'Sending…'; err.hidden = true;
    var order = bag.map(function (l) { return l.qty + ' x ' + byId[l.id].name + ' size ' + l.size; }).join('\n');
    var data = { _subject: 'Santa Claude order hold: ' + count() + ' item(s), ' + money(total()), _template: 'table', _captcha: 'false', name: f.name.value, email: f.email.value, phone: f.phone.value, zip: f.zip.value, order: order, total: money(total()) };
    try { var utm = JSON.parse(sessionStorage.getItem('shop-utm') || '{}'); Object.keys(utm).forEach(function (k) { data[k] = utm[k]; }); } catch (x) {}
    fetch('https://formsubmit.co/ajax/' + C.holdEmail, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function () {
        track('lead', items(bag));
        $('.hold-done-name', drawer).textContent = f.name.value.split(' ')[0];
        f.hidden = true; $('.hold-done', drawer).hidden = false;
        bag = []; save(); drawBag(); f.reset();
      })
      .catch(function () { err.hidden = false; })
      .then(function () { btn.disabled = false; btn.textContent = 'Hold my order'; });
  });

  /* ───────── size guide ───────── */
  var guide = $('#size-guide');
  $('tbody', guide).innerHTML = S.sizeChart.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '″</td><td>' + r[2] + '″</td></tr>'; }).join('');
  $('.guide-link', pdp).addEventListener('click', function () { guide.showModal ? guide.showModal() : guide.setAttribute('open', ''); });
  guide.addEventListener('click', function (e) { if (e.target === guide || e.target.closest('[data-close]')) guide.close ? guide.close() : guide.removeAttribute('open'); });

  /* ───────── go ───────── */
  if (S.freeShippingOver > 0) $('.announce-text').textContent = 'Free US shipping over ' + money(S.freeShippingOver) + '. Buy ' + S.bundle.qty + ', save ' + S.bundle.percentOff + '%.';
  drawStage(); drawInfo(); drawBag();
  track('view', [{ id: cur.id, name: cur.name, price: cur.price, qty: 1 }]);
  // Product data for Google Shopping / rich results
  var ld = { '@context': 'https://schema.org', '@graph': S.products.map(function (p) { return { '@type': 'Product', name: p.name, description: p.blurb, brand: { '@type': 'Brand', name: S.brand }, image: new URL(p.photos ? p.photos[0] : 'assets/og.jpg', location.href).href, offers: { '@type': 'Offer', price: p.price, priceCurrency: S.currency, availability: 'https://schema.org/InStock', url: location.href.split('#')[0] + '#' + p.id } }; }) };
  var sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
})();
