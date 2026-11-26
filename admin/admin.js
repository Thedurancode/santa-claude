/* Santa Claude admin panel. Talks to the store server (SHOP.api in js/shop-config.js).
   Without a server, "Preview with sample data" shows the panel filled with made-up numbers. */
(function () {
  var S = window.SHOP || { products: [] };
  var API = (S.api || '').replace(/\/+$/, '');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
  var nf = new Intl.NumberFormat('en-US');
  var num = function (n) { return nf.format(Math.round(n || 0)); };
  var money = function (n) { n = n || 0; return '$' + (Math.abs(n) >= 1000 || n % 1 === 0 ? nf.format(Math.round(n)) : n.toFixed(2)); };
  var pct = function (a, b) { return b ? (a / b * 100) : 0; };
  var pctTxt = function (v) { return (v >= 10 || v === 0 ? Math.round(v) : v.toFixed(1)) + '%'; };
  var regions = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  var country = function (cc) { try { return cc ? regions.of(cc) : 'Unknown'; } catch (e) { return cc; } };
  // country code tag rather than a flag emoji: Windows shows emoji flags as plain letters anyway
  var flag = function (cc) { return '<span class="cc">' + (cc && /^[A-Z]{2}$/i.test(cc) ? cc.toUpperCase() : '··') + '</span>'; };
  var byId = {}; (S.products || []).forEach(function (p) { byId[p.id] = p; });
  var pname = function (id) { return byId[id] ? byId[id].name : id; };
  var short = function (id) { return pname(id).replace(/\s+(hoodie|knit sweater|sweater)$/i, ''); };
  var ago = function (ts) { var s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  var MEDIUM = { paid: 'Paid ads', cpc: 'Paid ads', organic: 'Search', social: 'Social', referral: 'Other sites', none: 'Typed in or bookmarked', email: 'Email', campaign: 'Campaign link' };
  var SRC = { 'hacker news': 'Hacker News', x: 'X', github: 'GitHub', tiktok: 'TikTok', linkedin: 'LinkedIn', youtube: 'YouTube' };
  var srcName = function (s) { return SRC[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown'); };

  var demo = /[?&]demo\b/.test(location.search);
  var auth = store.get('sc-admin');
  if (auth && auth.exp < Date.now()) { auth = null; store.del('sc-admin'); }

  /* ───────── server ───────── */
  var call = function (path, opts) {
    if (demo) return Promise.resolve(DEMO.route(path, opts));
    opts = opts || {};
    return fetch(API + path, { method: opts.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + (auth && auth.token) }, opts.body ? { 'Content-Type': 'application/json' } : {}), body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401) { signOut(); throw new Error('Signed out'); }
          if (!r.ok) throw new Error(j.error || 'The server said ' + r.status);
          return j;
        });
      });
  };

  /* ───────── sign in ───────── */
  var gate = $('#gate'), app = $('#app');
  var showGate = function () {
    app.hidden = true; gate.hidden = false;
    $('#gate-live').hidden = !API; $('#gate-off').hidden = !!API;
    if (API) setTimeout(function () { $('#pw').focus(); }, 30);
  };
  var signOut = function () { auth = null; store.del('sc-admin'); if (demo) { location.href = location.pathname; return; } showGate(); };
  $('#gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!API) return;
    var btn = $('button[type=submit]', e.target), err = $('#gate-err');
    btn.disabled = true; err.hidden = true;
    fetch(API + '/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Sign-in failed'); return j; }); })
      .then(function (j) { auth = j; store.set('sc-admin', j); $('#pw').value = ''; start(); })
      .catch(function (x) { err.textContent = x.message === 'Failed to fetch' ? 'Can’t reach the store server. Check the api URL in shop-config.js.' : x.message; err.hidden = false; })
      .then(function () { btn.disabled = false; });
  });
  $('#demo-btn').addEventListener('click', function () { location.search = '?demo'; });
  $('#sign-out').addEventListener('click', signOut);

  /* ───────── tabs ───────── */
  var TABS = ['overview', 'live', 'orders', 'products', 'pixels'];
  var loaded = {};
  var showTab = function (t) {
    if (TABS.indexOf(t) < 0) t = 'overview';
    $$('.tabs button').forEach(function (b) { if (b.dataset.tab === t) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    TABS.forEach(function (x) { $('#v-' + x).hidden = x !== t; });
    if (t === 'overview') loadOverview();
    if (t === 'live') loadLive();
    if (t === 'orders' && !loaded.orders) loadOrders();
    if ((t === 'products' || t === 'pixels') && !loaded.settings) loadSettings();
    clearInterval(liveTimer); if (t === 'live') liveTimer = setInterval(loadLive, 15000);
  };
  $('.tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { history.replaceState(null, '', '#' + b.dataset.tab + (demo ? '' : '')); showTab(b.dataset.tab); } });

  /* ───────── tooltip ───────── */
  var tip = $('#tip');
  var showTip = function (html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)), top = y - h - 12;
    if (top < 8) top = y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  };
  var hideTip = function () { tip.hidden = true; };
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ───────── charts ───────── */
  var dayLabel = function (d, long) { var dt = new Date(d * 864e5); return dt.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', weekday: long ? 'short' : undefined }); };
  var noChart = function (el, msg) { el.innerHTML = '<div class="empty">' + msg + '</div>'; };
  var frame = function (el) {
    var w = el.clientWidth || 600, h = el.clientHeight || 220, m = { t: 10, r: 8, b: 26, l: 44 };
    return { w: w, h: h, m: m, iw: w - m.l - m.r, ih: h - m.t - m.b };
  };
  var axes = function (svg, f, y, fmtY, xs, labels) {
    var ticks = y.ticks(4);
    svg.append('g').selectAll('line').data(ticks).join('line').attr('class', function (t) { return t === 0 ? 'baseline' : 'gridline'; })
      .attr('x1', f.m.l).attr('x2', f.w - f.m.r).attr('y1', function (t) { return y(t); }).attr('y2', function (t) { return y(t); });
    svg.append('g').attr('class', 'axis').selectAll('text').data(ticks).join('text').attr('x', f.m.l - 8).attr('y', function (t) { return y(t) + 4; }).attr('text-anchor', 'end').text(fmtY);
    svg.append('g').attr('class', 'axis').selectAll('text').data(labels).join('text').attr('x', function (d) { return xs(d.i); }).attr('y', f.h - 6).attr('text-anchor', 'middle').text(function (d) { return d.t; });
  };
  var xLabels = function (pts, f) {
    var n = pts.length, every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(f.iw / 70))));
    return pts.map(function (p, i) { return { i: i, t: dayLabel(p.d) }; }).filter(function (d) { return (n - 1 - d.i) % every === 0; });
  };
  var lineChart = function (el, pts, name, fmtY) {
    if (!window.d3) return noChart(el, 'Charts couldn’t load. Check your connection.');
    if (pts.length < 2) return noChart(el, 'Pick 7 days or more to see the trend.');
    var f = frame(el), max = d3.max(pts, function (p) { return p.y; }) || 1;
    var x = d3.scaleLinear().domain([0, pts.length - 1]).range([f.m.l, f.w - f.m.r]);
    var y = d3.scaleLinear().domain([0, max]).nice(4).range([f.h - f.m.b, f.m.t]);
    el.innerHTML = '';
    var svg = d3.select(el).append('svg').attr('viewBox', '0 0 ' + f.w + ' ' + f.h).attr('role', 'img').attr('aria-label', name + ' per day');
    axes(svg, f, y, function (t) { return fmtY(t, true); }, x, xLabels(pts, f));
    svg.append('path').attr('class', 'area').attr('d', d3.area().x(function (p, i) { return x(i); }).y0(y(0)).y1(function (p) { return y(p.y); }).curve(d3.curveMonotoneX)(pts));
    svg.append('path').attr('class', 'line').attr('d', d3.line().x(function (p, i) { return x(i); }).y(function (p) { return y(p.y); }).curve(d3.curveMonotoneX)(pts));
    var cross = svg.append('line').attr('class', 'cross').attr('y1', f.m.t).attr('y2', f.h - f.m.b).style('display', 'none');
    var mark = svg.append('circle').attr('class', 'marker').attr('r', 5).style('display', 'none');
    svg.append('rect').attr('x', f.m.l).attr('y', 0).attr('width', f.iw).attr('height', f.h).attr('fill', 'transparent')
      .on('pointermove', function (ev) {
        var r = el.getBoundingClientRect(), sx = (ev.clientX - r.left) * f.w / r.width;
        var i = Math.max(0, Math.min(pts.length - 1, Math.round(x.invert(sx)))), p = pts[i];
        cross.attr('x1', x(i)).attr('x2', x(i)).style('display', null);
        mark.attr('cx', x(i)).attr('cy', y(p.y)).style('display', null);
        showTip('<b>' + dayLabel(p.d, true) + '</b><br>' + fmtY(p.y) + ' ' + name.toLowerCase(), r.left + x(i) * r.width / f.w, r.top + y(p.y) * r.height / f.h);
      })
      .on('pointerleave', function () { cross.style('display', 'none'); mark.style('display', 'none'); hideTip(); });
  };
  var barChart = function (el, pts, fmtY, tipFn) {
    if (!window.d3) return noChart(el, 'Charts couldn’t load. Check your connection.');
    if (pts.length < 2) return noChart(el, 'Pick 7 days or more to see the trend.');
    if (!pts.some(function (p) { return p.y; })) return noChart(el, 'No sales in this period yet.');
    var f = frame(el), max = d3.max(pts, function (p) { return p.y; }) || 1;
    var step = f.iw / pts.length, bw = Math.max(2, Math.min(24, step - 2));
    var x = function (i) { return f.m.l + step * i + step / 2; };
    var y = d3.scaleLinear().domain([0, max]).nice(4).range([f.h - f.m.b, f.m.t]);
    el.innerHTML = '';
    var svg = d3.select(el).append('svg').attr('viewBox', '0 0 ' + f.w + ' ' + f.h).attr('role', 'img').attr('aria-label', 'Sales per day');
    axes(svg, f, y, function (t) { return fmtY(t, true); }, x, xLabels(pts, f));
    var g = svg.append('g');
    pts.forEach(function (p, i) {
      var top = y(p.y), base = y(0), hgt = base - top, r = Math.min(4, bw / 2, hgt);
      var cx = x(i) - bw / 2;
      var hit = g.append('rect').attr('class', 'hit').attr('x', f.m.l + step * i).attr('y', f.m.t).attr('width', step).attr('height', f.ih).attr('fill', 'transparent');
      if (hgt > 0) g.append('path').attr('class', 'bar').attr('d', 'M' + cx + ',' + base + 'V' + (top + r) + 'Q' + cx + ',' + top + ' ' + (cx + r) + ',' + top + 'H' + (cx + bw - r) + 'Q' + (cx + bw) + ',' + top + ' ' + (cx + bw) + ',' + (top + r) + 'V' + base + 'Z');
      var bar = g.node().lastChild;
      hit.on('pointermove', function () { var rr = el.getBoundingClientRect(); if (bar.classList) bar.classList.add('on'); showTip(tipFn(p), rr.left + x(i) * rr.width / f.w, rr.top + top * rr.height / f.h); })
        .on('pointerleave', function () { if (bar.classList) bar.classList.remove('on'); hideTip(); });
    });
  };

  /* ───────── world map ───────── */
  var land = null, landP = null;
  var getLand = function () {
    if (land) return Promise.resolve(land);
    if (!landP) landP = fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json').then(function (r) { return r.json(); }).then(function (t) { land = topojson.feature(t, t.objects.land); return land; });
    return landP;
  };
  var drawMap = function (el, places, opts) {
    opts = opts || {};
    if (!window.d3 || !window.topojson) return noChart(el, 'The map couldn’t load. Check your connection.');
    getLand().then(function (geo) {
      var w = el.clientWidth || 800, h = el.clientHeight || 400;
      // world fills the width; the box is cut short so Antarctica falls off the bottom
      var proj = d3.geoEqualEarth().fitWidth(w, { type: 'Sphere' });
      var path = d3.geoPath(proj);
      h = Math.ceil(path.bounds({ type: 'Sphere' })[1][1]);
      el.innerHTML = '';
      var svg = d3.select(el).append('svg').attr('viewBox', '0 0 ' + w + ' ' + h).attr('role', 'img').attr('aria-label', 'World map of visitors by city');
      svg.append('path').attr('class', 'land').attr('d', path(geo));
      var pl = places.filter(function (p) { return p.lat != null && p.lon != null; });
      var max = d3.max(pl, function (p) { return p.visitors; }) || 1;
      var r = d3.scaleSqrt().domain([0, max]).range([0, Math.max(10, Math.min(26, w / 40))]);
      svg.append('g').selectAll('circle').data(pl.sort(function (a, b) { return b.visitors - a.visitors; })).join('circle')
        .attr('class', function (p) { return 'city' + (opts.fresh && p.last && Date.now() - p.last < 2 * 6e4 ? ' fresh' : ''); })
        .attr('cx', function (p) { return proj([p.lon, p.lat])[0]; }).attr('cy', function (p) { return proj([p.lon, p.lat])[1]; })
        .attr('r', function (p) { return Math.max(3.5, r(p.visitors)); })
        .on('pointermove', function (ev, p) {
          showTip('<b>' + esc(p.city || 'Unknown city') + '</b><br>' + esc([p.region, country(p.country)].filter(Boolean).join(', ')) + '<br>' + num(p.visitors) + ' visitor' + (p.visitors === 1 ? '' : 's') + (p.orders ? ' · ' + num(p.orders) + ' order' + (p.orders === 1 ? '' : 's') : ''), ev.clientX, ev.clientY);
        })
        .on('pointerleave', hideTip);
      if (!pl.length) svg.append('text').attr('x', w / 2).attr('y', h / 2).attr('text-anchor', 'middle').attr('class', 'axis').text(opts.empty || 'No visitors yet');
    }).catch(function () { noChart(el, 'The map couldn’t load. Check your connection.'); });
  };

  /* ───────── tables ───────── */
  var table = function (el, cols, rows, empty) {
    if (!rows.length) { el.innerHTML = '<tbody><tr><td class="t-empty">' + empty + '</td></tr></tbody>'; return; }
    el.innerHTML = '<thead><tr>' + cols.map(function (c) { return '<th scope="col"' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + c.h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + c.f(r) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
  };
  var meter = function (v, max) { return '<span class="meter" style="width:' + Math.max(1, v / (max || 1) * 100).toFixed(1) + '%"></span>'; };

  /* ───────── overview ───────── */
  var days = store.get('sc-admin-days') || 7, ovBusy = false, lastStats = null;
  $$('#v-overview .range button').forEach(function (b) { b.setAttribute('aria-checked', +b.dataset.days === days); });
  $('#v-overview .range').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    days = +b.dataset.days; store.set('sc-admin-days', days);
    $$('button', e.currentTarget).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
    loadOverview();
  });
  var loadOverview = function () {
    if (ovBusy) return; ovBusy = true;
    call('/admin/stats?days=' + days + '&tz=' + (-new Date().getTimezoneOffset()))
      .then(function (s) { lastStats = s; drawOverview(s); })
      .catch(function (x) { $('#tiles').innerHTML = '<p class="muted">Couldn’t load the numbers: ' + esc(x.message) + '</p>'; })
      .then(function () { ovBusy = false; });
  };
  var delta = function (cur, prev, isRate) {
    if (!prev && !cur) return '<span>No change</span>';
    if (!prev) return '<span>New this period</span>';
    var d = isRate ? cur - prev : (cur - prev) / prev * 100;
    var up = d >= 0, txt = (up ? '▲ ' : '▼ ') + (isRate ? Math.abs(d).toFixed(1) + ' pts' : pctTxt(Math.abs(d)));
    return '<b class="' + (Math.abs(d) < .05 ? '' : up ? 'up' : 'down') + '">' + txt + '</b> vs previous ' + (days === 1 ? 'day' : days + ' days');
  };
  var drawOverview = function (s) {
    var t = s.totals || {}, p = s.previous || {};
    var conv = pct(t.orders, t.visitors), pconv = pct(p.orders, p.visitors);
    var addR = pct(t.added, t.sessions), paddR = pct(p.added, p.sessions);
    var aov = t.orders ? t.revenue / t.orders : 0, paov = p.orders ? p.revenue / p.orders : 0;
    var tiles = [
      ['Visitors', num(t.visitors), delta(t.visitors, p.visitors)],
      ['Orders', num(t.orders), delta(t.orders, p.orders)],
      ['Revenue', money(t.revenue), delta(t.revenue, p.revenue)],
      ['Conversion rate', pctTxt(conv), delta(conv, pconv, true)],
      ['Average order', t.orders ? money(aov) : '–', delta(aov, paov)],
      ['Added to bag', pctTxt(addR), delta(addR, paddR, true)]
    ];
    $('#tiles').innerHTML = tiles.map(function (x) { return '<div class="tile"><p>' + x[0] + '</p><p class="v">' + x[1] + '</p><p class="d">' + x[2] + '</p></div>'; }).join('');

    // days with no visits still get a point
    var byDay = {}, byDayO = {};
    (s.daily || []).forEach(function (r) { byDay[r.d] = r; });
    (s.dailyOrders || []).forEach(function (r) { byDayO[r.d] = r; });
    var pts = [], opts = [];
    for (var i = 0; i < s.days; i++) { var d = s.startDay + i; pts.push({ d: d, y: (byDay[d] || {}).visitors || 0 }); opts.push({ d: d, y: (byDayO[d] || {}).revenue || 0, o: (byDayO[d] || {}).orders || 0 }); }
    lineChart($('#c-visitors'), pts, 'Visitors', function (v) { return num(v); });
    barChart($('#c-revenue'), opts, function (v, axis) { return axis && v >= 1000 ? '$' + (v / 1000) + 'k' : money(v); }, function (p) { return '<b>' + dayLabel(p.d, true) + '</b><br>' + money(p.y) + ' from ' + p.o + ' order' + (p.o === 1 ? '' : 's'); });

    var steps = [['Visits', t.sessions], ['Viewed a design', t.viewed], ['Added to bag', t.added], ['Started checkout', t.checkout], ['Entered name and email', t.details], ['Paid', t.bought]];
    $('#funnel').innerHTML = steps.map(function (x, k) {
      var share = pct(x[1], t.sessions), fromPrev = k ? pct(x[1], steps[k - 1][1]) : 100;
      return '<div class="fstep"><p class="lab">' + x[0] + '</p><div class="track" title="' + pctTxt(share) + ' of visits"><div class="fill" style="width:' + Math.max(.4, share).toFixed(2) + '%"></div></div>' +
        '<p class="num"><b>' + num(x[1]) + '</b><span>' + (k ? pctTxt(fromPrev) + ' of previous' : '') + '</span></p></div>';
    }).join('');

    drawMap($('#map'), s.cities || []);
    var cmax = d3max(s.countries, 'visitors');
    table($('#t-countries'), [
      { h: 'Country', f: function (r) { return '<div class="name">' + flag(r.country) + '<div>' + esc(country(r.country)) + meter(r.visitors, cmax) + '</div></div>'; } },
      { h: 'Visitors', f: function (r) { return num(r.visitors); } },
      { h: 'Share', f: function (r) { return pctTxt(pct(r.visitors, t.visitors)); } },
      { h: 'Added to bag', f: function (r) { return num(r.added); } },
      { h: 'Orders', f: function (r) { return num(r.orders); } },
      { h: 'Revenue', f: function (r) { return money(r.revenue); } },
      { h: 'Conv. rate', f: function (r) { return pctTxt(pct(r.orders, r.visitors)); } }
    ], (s.countries || []).slice(0, 15), 'No visitors in this period yet.');

    var smax = d3max(s.sources, 'visitors');
    table($('#t-sources'), [
      { h: 'Source', f: function (r) { return '<div><b>' + esc(srcName(r.source)) + '</b> <small class="muted">' + esc(MEDIUM[r.medium] || r.medium) + '</small>' + meter(r.visitors, smax) + '</div>'; } },
      { h: 'Visitors', f: function (r) { return num(r.visitors); } },
      { h: 'Added to bag', f: function (r) { return num(r.added); } },
      { h: 'Checkouts', f: function (r) { return num(r.checkout); } },
      { h: 'Orders', f: function (r) { return num(r.orders); } },
      { h: 'Revenue', f: function (r) { return money(r.revenue); } },
      { h: 'Conv. rate', f: function (r) { return pctTxt(pct(r.orders, r.visitors)); } }
    ], s.sources || [], 'No visitors in this period yet.');

    table($('#t-campaigns'), [
      { h: 'Campaign', f: function (r) { return '<div><b>' + esc(r.campaign) + '</b><br><small class="muted">' + esc(srcName(r.source)) + '</small></div>'; } },
      { h: 'Visitors', f: function (r) { return num(r.visitors); } },
      { h: 'Orders', f: function (r) { return num(r.orders); } },
      { h: 'Revenue', f: function (r) { return money(r.revenue); } }
    ], s.campaigns || [], 'No tagged campaigns yet. Build a tagged link under Pixels & tracking.');

    var dv = s.devices || [], dsum = dv.reduce(function (a, r) { return a + r.visitors; }, 0) || 1, NAMES = { mobile: 'Phone', desktop: 'Computer', tablet: 'Tablet' };
    $('#devices').innerHTML = dv.length ? '<div class="seg" role="img" aria-label="' + dv.map(function (r) { return (NAMES[r.device] || r.device) + ' ' + pctTxt(pct(r.visitors, dsum)); }).join(', ') + '">' + dv.map(function (r) { return '<span style="flex:' + r.visitors + '"></span>'; }).join('') + '</div><p class="seg-legend">' + dv.map(function (r) { return '<span><i></i>' + (NAMES[r.device] || r.device) + ' <b>' + pctTxt(pct(r.visitors, dsum)) + '</b></span>'; }).join('') + '</p>' : '<p class="t-empty">No visitors in this period yet.</p>';
    var rmax = d3max(s.referrers, 'visitors');
    table($('#t-refs'), [
      { h: 'Site', f: function (r) { return esc(r.ref) + meter(r.visitors, rmax); } },
      { h: 'Visitors', f: function (r) { return num(r.visitors); } }
    ], (s.referrers || []).slice(0, 8), 'No visits from other sites yet.');

    var pr = {}; (s.products || []).forEach(function (r) { pr[r.product] = r; });
    var rows = (S.products || []).map(function (x) { var r = pr[x.id] || {}; return { id: x.id, viewed: r.viewed || 0, added: r.added || 0, sold: r.sold || 0, revenue: r.revenue || 0 }; })
      .sort(function (a, b) { return b.revenue - a.revenue || b.viewed - a.viewed; });
    var vmax = d3max(rows, 'viewed');
    table($('#t-products'), [
      { h: 'Design', f: function (r) { var p = byId[r.id] || {}; return '<div class="name">' + (p.photos ? '<img class="thumb" src="../' + esc(p.photos[0]) + '" alt="" loading="lazy">' : '') + '<div>' + esc(short(r.id)) + '<small>' + (p.type === 'sweater' ? 'Knit sweater' : 'Hoodie') + '</small></div></div>'; } },
      { h: 'Views', f: function (r) { return num(r.viewed) + meter(r.viewed, vmax); } },
      { h: 'Added to bag', f: function (r) { return num(r.added); } },
      { h: 'Add rate', f: function (r) { return pctTxt(pct(r.added, r.viewed)); } },
      { h: 'Sold', f: function (r) { return num(r.sold); } },
      { h: 'Revenue', f: function (r) { return money(r.revenue); } }
    ], rows, 'No products.');
  };
  var d3max = function (rows, k) { return (rows || []).reduce(function (m, r) { return Math.max(m, r[k] || 0); }, 0); };

  /* ───────── live ───────── */
  var liveTimer = null;
  var VERB = function (e) {
    var name = e.product ? '<b>' + esc(short(e.product)) + '</b>' : '';
    if (e.type === 'page') return /#/.test(e.path || '') ? 'opened ' + (byId[(e.path || '').split('#')[1]] ? '<b>' + esc(short(e.path.split('#')[1])) + '</b>' : 'a page') : 'is on the home page';
    if (e.type === 'view') return 'is looking at ' + name;
    if (e.type === 'add') return 'added ' + name + ' to the bag';
    if (e.type === 'checkout') return 'started checkout' + (name ? ' with ' + name : '');
    if (e.type === 'lead') return 'entered their name and email' + (name ? ' for ' + name : '');
    if (e.type === 'purchase') return '<b>paid ' + money(e.value) + '</b>';
    return esc(e.type);
  };
  var loadLive = function () {
    call('/admin/live').then(function (l) {
      $('#live-n').textContent = num(l.online); $('#live-big').textContent = num(l.online);
      $('#live-updated').textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ', refreshes every 15 seconds';
      if (!$('#v-live').hidden) {
        drawMap($('#live-map'), l.places || [], { fresh: true, empty: 'Nobody in the last 30 minutes' });
        // collapse repeats from the same visitor doing the same thing
        var seen = {}, rows = (l.feed || []).filter(function (e) { var k = e.vid + e.type + e.product + e.path; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 40);
        $('#feed').innerHTML = rows.length ? rows.map(function (e) {
          var where = [e.city, e.region && e.region !== e.city ? e.region : '', country(e.country)].filter(Boolean).join(', ');
          return '<li>' + flag(e.country) + '<div><p class="what">Someone in ' + esc(where || 'an unknown place') + ' ' + VERB(e) + '</p><p class="meta">' + esc(srcName(e.source)) + (e.campaign ? ', ' + esc(e.campaign) : '') + ' · ' + esc({ mobile: 'phone', desktop: 'computer', tablet: 'tablet' }[e.device] || e.device || '') + '</p></div><time datetime="' + new Date(e.ts).toISOString() + '">' + ago(e.ts) + '</time></li>';
        }).join('') : '<li class="t-empty">No activity in the last 24 hours.</li>';
      }
    }).catch(function () {});
  };
  setInterval(function () { if ($('#v-live').hidden && !app.hidden) call('/admin/live').then(function (l) { $('#live-n').textContent = num(l.online); }).catch(function () {}); }, 30000);

  /* ───────── orders ───────── */
  var allOrders = [], kind = 'paid';
  var KIND_NOTE = {
    paid: 'Paid through Stripe. Each order is booked to the visit and ad it came from.',
    hold: 'Shoppers who left their name and email to hold their sizes while online payment was off. Email them a payment link.',
    started: 'Shoppers who went to payment but didn’t finish. Worth a friendly reminder email.'
  };
  $('#order-kind').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    kind = b.dataset.kind; $$('button', e.currentTarget).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
    drawOrders();
  });
  var loadOrders = function () {
    call('/admin/orders').then(function (j) { loaded.orders = true; allOrders = j.orders || []; drawOrders(); })
      .catch(function (x) { $('#t-orders').innerHTML = '<tbody><tr><td class="t-empty">Couldn’t load orders: ' + esc(x.message) + '</td></tr></tbody>'; });
  };
  var drawOrders = function () {
    $('#kind-note').textContent = KIND_NOTE[kind];
    var counts = {}; allOrders.forEach(function (o) { counts[o.kind] = (counts[o.kind] || 0) + 1; });
    $$('#order-kind button').forEach(function (b) { var n = counts[b.dataset.kind] || 0; b.textContent = b.textContent.replace(/\s\(\d+\)$/, '') + (n ? ' (' + n + ')' : ''); });
    table($('#t-orders'), [
      { h: 'Date', f: function (o) { return new Date(o.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } },
      { h: 'Customer', cls: 'left', f: function (o) { return '<b>' + esc(o.name || '–') + '</b><br><a href="mailto:' + esc(o.email) + '">' + esc(o.email) + '</a>'; } },
      { h: 'Items', cls: 'left wrap', f: function (o) { return (o.items || []).map(function (i) { return esc(short(i.id)) + ', ' + esc(i.size) + (i.qty > 1 ? ' × ' + i.qty : ''); }).join('<br>'); } },
      { h: 'Total', f: function (o) { return '<b>' + money(o.value) + '</b>'; } },
      { h: 'Came from', cls: 'left', f: function (o) { return esc(srcName(o.source)) + (o.campaign ? '<br><small class="muted">' + esc(o.campaign) + '</small>' : ''); } },
      { h: 'Place', cls: 'left', f: function (o) { return flag(o.country) + ' ' + esc([o.city, country(o.country)].filter(Boolean).join(', ')); } }
    ], allOrders.filter(function (o) { return o.kind === kind; }), kind === 'paid' ? 'No paid orders yet.' : 'Nothing here yet.');
  };

  /* ───────── settings: products and pixels ───────── */
  var settings = null;
  var loadSettings = function () {
    call('/admin/settings').then(function (j) { loaded.settings = true; settings = j; drawProducts(); drawPixels(); })
      .catch(function (x) { $('#plist').innerHTML = $('#px-form').innerHTML = '<p class="muted">Couldn’t load settings: ' + esc(x.message) + '</p>'; });
  };
  var drawProducts = function () {
    var po = settings.products || {};
    $('#plist').innerHTML = (S.products || []).map(function (p) {
      var o = po[p.id] || {};
      return '<div class="prow' + (o.hidden ? ' off' : '') + '" data-id="' + esc(p.id) + '">' +
        (p.photos ? '<img src="../' + esc(p.photos[0]) + '" alt="" loading="lazy">' : '<span></span>') +
        '<p class="pname">' + esc(short(p.id)) + '<small>' + (p.type === 'sweater' ? 'Knit sweater' : 'Hoodie') + ', usually ' + money(p.price) + '</small></p>' +
        '<label>Price ($)<input name="price" inputmode="decimal" placeholder="' + p.price + '" value="' + esc(o.price || '') + '"></label>' +
        '<label class="badge-f">Badge<input name="badge" maxlength="24" placeholder="' + esc(p.badge || 'None') + '" value="' + esc(o.badge || '') + '"></label>' +
        '<label class="toggle"><input type="checkbox" name="show"' + (o.hidden ? '' : ' checked') + '> On the shop</label>' +
        '<details' + (o.metaPixelId || o.tiktokPixelId || o.googleAdsLabel ? ' open' : '') + '><summary>Pixels just for this design</summary><div class="px3">' +
          '<label>Meta pixel ID<input name="metaPixelId" placeholder="Optional" value="' + esc(o.metaPixelId || '') + '"></label>' +
          '<label>TikTok pixel ID<input name="tiktokPixelId" placeholder="Optional" value="' + esc(o.tiktokPixelId || '') + '"></label>' +
          '<label>Google Ads conversion label<input name="googleAdsLabel" placeholder="Optional" value="' + esc(o.googleAdsLabel || '') + '"></label>' +
        '</div></details></div>';
    }).join('');
  };
  $('#plist').addEventListener('change', function (e) { if (e.target.name === 'show') e.target.closest('.prow').classList.toggle('off', !e.target.checked); });
  var ID = /^[A-Za-z0-9_\-]*$/;
  var msg = function (el, text, bad) { el.textContent = text; el.classList.toggle('err', !!bad); };
  $('#p-save').addEventListener('click', function () {
    var out = {}, bad = [];
    $$('.prow').forEach(function (row) {
      var g = function (n) { return $('[name=' + n + ']', row).value.trim(); };
      var o = { price: g('price'), badge: g('badge'), hidden: !$('[name=show]', row).checked, metaPixelId: g('metaPixelId'), tiktokPixelId: g('tiktokPixelId'), googleAdsLabel: g('googleAdsLabel') };
      if (o.price && !(parseFloat(o.price) > 0)) bad.push(short(row.dataset.id) + ' price');
      ['metaPixelId', 'tiktokPixelId', 'googleAdsLabel'].forEach(function (k) { if (!ID.test(o[k])) bad.push(short(row.dataset.id)); });
      out[row.dataset.id] = o;
    });
    if (bad.length) return msg($('#p-msg'), 'Check: ' + bad.join(', '), true);
    save({ products: out }, $('#p-msg'), $('#p-save'));
  });
  var save = function (body, m, btn) {
    btn.disabled = true; msg(m, 'Saving…');
    call('/admin/settings', { method: 'PUT', body: body })
      .then(function (j) { settings = j; drawPixels(); msg(m, demo ? 'Saved in this preview only.' : 'Saved. The shop picks it up within a minute.'); })
      .catch(function (x) { msg(m, x.message, true); })
      .then(function () { btn.disabled = false; });
  };

  var PX = [
    ['metaPixelId', 'Meta pixel ID', 'Facebook and Instagram. Events Manager → Data sources', '1234567890123456'],
    ['tiktokPixelId', 'TikTok pixel ID', 'TikTok Ads Manager → Events → Web events', 'C1A2B3C4D5E6F7G8H9'],
    ['ga4Id', 'Google Analytics 4 ID', 'Admin → Data streams → Measurement ID', 'G-XXXXXXXXXX'],
    ['googleAdsId', 'Google Ads ID', 'Goals → Conversions → Tag setup', 'AW-123456789'],
    ['googleAdsPurchaseLabel', 'Google Ads purchase label', 'The label of your Purchase conversion', 'AbC-D_efG-h12_34-567'],
    ['gtmId', 'Google Tag Manager ID', 'Optional', 'GTM-XXXXXXX'],
    ['pinterestTagId', 'Pinterest tag ID', 'Optional', '2612345678901'],
    ['snapPixelId', 'Snapchat pixel ID', 'Optional', 'a1b2c3d4-…']
  ];
  var SV = [
    ['metaCapiToken', 'Meta Conversions API token', 'Events Manager → your pixel → Settings → Generate access token'],
    ['metaTestEventCode', 'Meta test event code', 'Optional. Shows server sales in Test Events while you check'],
    ['tiktokEventsToken', 'TikTok Events API token', 'Events → your pixel → Settings → Generate access token'],
    ['ga4ApiSecret', 'GA4 Measurement Protocol secret', 'Admin → Data streams → Measurement Protocol API secrets']
  ];
  var drawPixels = function () {
    var px = settings.pixels || {}, sv = settings.server || {}, f = $('#px-form');
    var base = location.href.replace(/admin\/.*$/, '');
    f.innerHTML =
      '<fieldset><legend>Ad pixels</legend><p class="lead">Loaded on every page of the shop. Views, adds to bag, checkouts and sales are sent to each one.</p><div class="frow">' +
      PX.map(function (x) { var v = px[x[0]] || ''; return '<label>' + x[1] + ' <span class="state' + (v ? '' : ' off') + '">' + (v ? 'On' : 'Off') + '</span><input name="' + x[0] + '" value="' + esc(v) + '" placeholder="' + esc(x[3]) + '" spellcheck="false"><span class="hint">' + x[2] + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<fieldset><legend>Sales reported from the server</legend><p class="lead">Every paid order is also sent straight from the store server, so ad blockers can’t hide a sale. Saved tokens are never shown again. Type a dash (-) to remove one.</p><div class="frow">' +
      SV.map(function (x) { var v = sv[x[0]] || ''; return '<label>' + x[1] + ' <span class="state' + (v ? '' : ' off') + '">' + (v ? 'Saved' : 'Not set') + '</span><input type="password" name="' + x[0] + '" placeholder="' + (v ? esc(v) + ' (type to replace)' : 'Paste here') + '" autocomplete="new-password" spellcheck="false"><span class="hint">' + x[2] + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<fieldset><legend>Tracking link builder</legend><p class="lead">Use these links in your ads and posts so the Overview shows exactly which one brought each sale.</p><div class="frow">' +
      '<label>Source<input name="u_source" placeholder="facebook, tiktok, instagram, newsletter"></label>' +
      '<label>Type<select name="u_medium"><option value="paid">Paid ad</option><option value="social">Post</option><option value="email">Email</option><option value="influencer">Influencer</option></select></label>' +
      '<label>Campaign name<input name="u_campaign" placeholder="xmas-launch"></label>' +
      '<label>Lands on<select name="u_page"><option value="">Home page</option>' + (S.products || []).map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('') + '</select></label>' +
      '</div><div class="frow"><label style="grid-column:1/-1">Your link<input name="u_out" readonly></label></div><p><button class="btn ghost small" type="button" id="u-copy">Copy link</button></p></fieldset>';
    var build = function () {
      var g = function (n) { return f.elements[n].value.trim(); }, q = [];
      var slug = function (v) { return encodeURIComponent(v.toLowerCase().replace(/\s+/g, '-')); };
      if (g('u_source')) q.push('utm_source=' + slug(g('u_source')));
      if (g('u_source')) q.push('utm_medium=' + slug(g('u_medium')));
      if (g('u_campaign')) q.push('utm_campaign=' + slug(g('u_campaign')));
      f.elements.u_out.value = base + (q.length ? '?' + q.join('&') : '') + (g('u_page') ? '#' + g('u_page') : '');
    };
    f.addEventListener('input', build); f.addEventListener('change', build); build();
    $('#u-copy').addEventListener('click', function () { var o = f.elements.u_out; o.select(); try { navigator.clipboard.writeText(o.value); } catch (e) { document.execCommand('copy'); } this.textContent = 'Copied'; var b = this; setTimeout(function () { b.textContent = 'Copy link'; }, 1500); });
  };
  $('#px-save').addEventListener('click', function () {
    var f = $('#px-form'), pixels = {}, server = {}, bad = [];
    PX.forEach(function (x) { var v = f.elements[x[0]].value.trim(); if (!ID.test(v)) bad.push(x[1]); pixels[x[0]] = v; });
    SV.forEach(function (x) { server[x[0]] = f.elements[x[0]].value.trim(); });
    if (bad.length) return msg($('#px-msg'), 'Only letters, numbers, dashes and underscores in: ' + bad.join(', '), true);
    save({ pixels: pixels, server: server }, $('#px-msg'), $('#px-save'));
  });

  /* ───────── start ───────── */
  var start = function () {
    gate.hidden = true; app.hidden = false;
    $('#demo-bar').hidden = !demo;
    $('#sign-out').textContent = demo ? 'Leave preview' : 'Sign out';
    showTab((location.hash || '#overview').slice(1));
    call('/admin/live').then(function (l) { $('#live-n').textContent = num(l.online); }).catch(function () {});
  };
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { if (lastStats && !$('#v-overview').hidden) drawOverview(lastStats); }, 200); });

  /* ───────── sample data for the preview ───────── */
  var DEMO = (function () {
    if (!demo) return null;
    var seed = 20261126, rnd = function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    var pick = function (list) { var tot = list.reduce(function (s, x) { return s + x[x.length - 1]; }, 0), r = rnd() * tot; for (var i = 0; i < list.length; i++) { r -= list[i][list[i].length - 1]; if (r <= 0) return list[i]; } return list[0]; };
    var CITIES = [['New York', 'New York', 'US', 40.71, -74.01, 10], ['San Francisco', 'California', 'US', 37.77, -122.42, 9], ['Seattle', 'Washington', 'US', 47.61, -122.33, 6], ['Los Angeles', 'California', 'US', 34.05, -118.24, 6], ['Austin', 'Texas', 'US', 30.27, -97.74, 5], ['Chicago', 'Illinois', 'US', 41.88, -87.63, 5], ['Boston', 'Massachusetts', 'US', 42.36, -71.06, 4], ['Denver', 'Colorado', 'US', 39.74, -104.99, 3], ['Miami', 'Florida', 'US', 25.76, -80.19, 2], ['Toronto', 'Ontario', 'CA', 43.65, -79.38, 4], ['Vancouver', 'British Columbia', 'CA', 49.28, -123.12, 2], ['London', 'England', 'GB', 51.51, -0.13, 6], ['Berlin', 'Berlin', 'DE', 52.52, 13.4, 4], ['Amsterdam', 'North Holland', 'NL', 52.37, 4.9, 3], ['Paris', 'Île-de-France', 'FR', 48.86, 2.35, 3], ['Stockholm', 'Stockholm', 'SE', 59.33, 18.07, 2], ['Dublin', 'Leinster', 'IE', 53.35, -6.26, 2], ['Warsaw', 'Masovia', 'PL', 52.23, 21.01, 1], ['Tel Aviv', 'Tel Aviv', 'IL', 32.09, 34.78, 1], ['Bengaluru', 'Karnataka', 'IN', 12.97, 77.59, 4], ['Singapore', 'Singapore', 'SG', 1.35, 103.82, 2], ['Tokyo', 'Tokyo', 'JP', 35.68, 139.69, 2], ['Sydney', 'New South Wales', 'AU', -33.87, 151.21, 3], ['São Paulo', 'São Paulo', 'BR', -23.55, -46.63, 2], ['Mexico City', 'CDMX', 'MX', 19.43, -99.13, 1]];
    var SOURCES = [['facebook', 'paid', ['xmas-launch', 'retarget-bag'], '', 1.3, 22], ['instagram', 'paid', ['xmas-launch'], '', 1.1, 12], ['tiktok', 'paid', ['ugly-sweater-ugc'], '', .7, 10], ['google', 'paid', ['brand-search', 'shopping'], '', 1.6, 9], ['google', 'organic', [''], 'google.com', 1, 12], ['direct', 'none', [''], '', 1.2, 14], ['x', 'social', [''], 'x.com', .8, 6], ['reddit', 'social', [''], 'reddit.com', .9, 5], ['hacker news', 'social', [''], 'news.ycombinator.com', .6, 4], ['github', 'social', [''], 'github.com', 1, 2], ['newsletter', 'email', ['december-drop'], '', 2, 3]];
    var DEV = [['mobile', 64], ['desktop', 31], ['tablet', 5]];
    var P = (S.products || []).map(function (p, i) { return [p.id, p.price, 16 - i * .6]; });
    var now = Date.now(), dayMs = 864e5, sessions = [], vids = [];
    for (var d = 120; d >= 0; d--) {
      var n = Math.round((90 + (120 - d) * 2.2) * (0.8 + rnd() * .4) * ((new Date(now - d * dayMs).getDay() % 6) ? 1 : 1.2));
      for (var k = 0; k < n; k++) {
        var ts = now - d * dayMs - Math.floor(rnd() * dayMs); if (ts > now) continue;
        var c = pick(CITIES), src = pick(SOURCES), dev = pick(DEV), boost = src[4];
        var vid = vids.length && rnd() < .14 ? vids[Math.floor(rnd() * vids.length)] : 'v' + sessions.length; vids.push(vid);
        var s = { ts: ts, vid: vid, sid: 's' + sessions.length, city: c[0], region: c[1], country: c[2], lat: c[3] + (rnd() - .5) * .3, lon: c[4] + (rnd() - .5) * .3, source: src[0], medium: src[1], campaign: src[2][Math.floor(rnd() * src[2].length)], ref: src[3], device: dev[0], views: [], adds: [], checkout: false, details: false, paid: false, items: [], value: 0 };
        if (rnd() < .64) { var nv = 1 + Math.floor(rnd() * 3); for (var j = 0; j < nv; j++) s.views.push(pick(P)); }
        if (s.views.length && rnd() < .2 * boost) { s.adds.push(s.views[0]); if (rnd() < .22) s.adds.push(s.views[s.views.length - 1]); }
        if (s.adds.length && rnd() < .62) s.checkout = true;
        if (s.checkout && rnd() < .82) s.details = true;
        if (s.details && rnd() < .66 * Math.min(1.2, boost)) {
          s.paid = true;
          var off = s.adds.length >= 2 ? .85 : 1;
          s.items = s.adds.map(function (p) { return { id: p[0], size: ['S', 'M', 'L', 'XL', '2XL'][Math.floor(rnd() * 5)], qty: 1, price: Math.round(p[1] * off * 100) / 100 }; });
          s.value = s.items.reduce(function (a, i) { return a + i.price; }, 0) + (s.items.length >= 2 ? 0 : 8);
        }
        sessions.push(s);
      }
    }
    var FIRST = ['Alex', 'Sam', 'Jordan', 'Priya', 'Chen', 'Maya', 'Leo', 'Ines', 'Noah', 'Kofi', 'Hana', 'Elena', 'Omar', 'Ravi', 'Zoe'], LAST = ['Kim', 'Patel', 'Garcia', 'Novak', 'Okafor', 'Silva', 'Berg', 'Tanaka', 'Murphy', 'Haddad', 'Rossi', 'Nguyen'];
    sessions.forEach(function (s, i) { var f = FIRST[i % FIRST.length], l = LAST[(i * 7) % LAST.length]; s.name = f + ' ' + l; s.email = (f + '.' + l).toLowerCase() + '@example.com'; });
    var inRange = function (a, b) { return sessions.filter(function (s) { return s.ts >= a && s.ts < b; }); };
    var distinct = function (list, f) { var o = {}; list.forEach(function (s) { if (f(s)) o[s.vid] = 1; }); return Object.keys(o).length; };
    var group = function (list, keyF, extra) {
      var g = {};
      list.forEach(function (s) { var k = keyF(s); if (k == null) return; var r = g[k] || (g[k] = { _v: {}, added: 0, checkout: 0, orders: 0, revenue: 0, _s: s }); r._v[s.vid] = 1; if (s.adds.length) r.added++; if (s.checkout) r.checkout++; if (s.paid) { r.orders++; r.revenue += s.value; } });
      return Object.keys(g).map(function (k) { var r = g[k]; var o = extra(r._s); o.visitors = Object.keys(r._v).length; o.added = r.added; o.checkout = r.checkout; o.orders = r.orders; o.revenue = Math.round(r.revenue * 100) / 100; return o; }).sort(function (a, b) { return b.visitors - a.visitors; });
    };
    var totals = function (list) {
      var paid = list.filter(function (s) { return s.paid; });
      return { visitors: distinct(list, function () { return 1; }), sessions: list.length, pageviews: list.length + list.reduce(function (a, s) { return a + s.views.length; }, 0), viewed: list.filter(function (s) { return s.views.length; }).length, added: list.filter(function (s) { return s.adds.length; }).length, checkout: list.filter(function (s) { return s.checkout; }).length, details: list.filter(function (s) { return s.details; }).length, bought: paid.length, orders: paid.length, revenue: Math.round(paid.reduce(function (a, s) { return a + s.value; }, 0) * 100) / 100 };
    };
    var stats = function (days, tz) {
      var off = tz * 60000, from = Math.floor((now + off) / dayMs) * dayMs - off - (days - 1) * dayMs, list = inRange(from, now), prev = inRange(from - days * dayMs, from);
      var dayOf = function (s) { return Math.floor((s.ts + off) / dayMs); };
      var daily = {}, dailyO = {};
      list.forEach(function (s) { var d = dayOf(s); (daily[d] = daily[d] || { d: d, _v: {}, added: 0 })._v[s.vid] = 1; if (s.adds.length) daily[d].added++; if (s.paid) { var o = dailyO[d] = dailyO[d] || { d: d, orders: 0, revenue: 0 }; o.orders++; o.revenue += s.value; } });
      var prod = {};
      list.forEach(function (s) {
        s.views.forEach(function (p) { (prod[p[0]] = prod[p[0]] || { product: p[0], viewed: 0, added: 0, sold: 0, revenue: 0 }).viewed++; });
        s.adds.forEach(function (p) { prod[p[0]].added++; });
        s.items.forEach(function (i) { prod[i.id].sold += i.qty; prod[i.id].revenue += i.price; });
      });
      var devs = {}; list.forEach(function (s) { (devs[s.device] = devs[s.device] || {})[s.vid] = 1; });
      return {
        days: days, from: from, to: now, startDay: Math.floor((from + off) / dayMs),
        totals: totals(list), previous: totals(prev),
        daily: Object.keys(daily).map(function (k) { return { d: +k, visitors: Object.keys(daily[k]._v).length, added: daily[k].added }; }),
        dailyOrders: Object.keys(dailyO).map(function (k) { return dailyO[k]; }),
        countries: group(list, function (s) { return s.country; }, function (s) { return { country: s.country }; }),
        cities: group(list, function (s) { return s.country + s.city; }, function (s) { return { city: s.city, region: s.region, country: s.country, lat: s.lat, lon: s.lon }; }),
        sources: group(list, function (s) { return s.source + '|' + s.medium; }, function (s) { return { source: s.source, medium: s.medium }; }),
        campaigns: group(list, function (s) { return s.campaign ? s.source + '|' + s.campaign : null; }, function (s) { return { source: s.source, campaign: s.campaign }; }),
        products: Object.keys(prod).map(function (k) { return prod[k]; }),
        devices: Object.keys(devs).map(function (k) { return { device: k, visitors: Object.keys(devs[k]).length }; }).sort(function (a, b) { return b.visitors - a.visitors; }),
        referrers: group(list, function (s) { return s.ref || null; }, function (s) { return { ref: s.ref }; }).slice(0, 20)
      };
    };
    // a few people on the site right now
    var liveNow = function () {
      var t = Date.now(), recent = [];
      for (var i = 0; i < 11; i++) { var s = sessions[sessions.length - 1 - i * 3]; recent.push(Object.assign({}, s, { ts: t - Math.floor(i * i * 9000 + rnd() * 20000) })); }
      var feed = [];
      recent.concat(inRange(t - 864e5, t - 30 * 6e4).slice(-30)).forEach(function (s) {
        var at = s.ts;
        feed.push({ ts: at, vid: s.vid, type: 'page', path: '/', city: s.city, region: s.region, country: s.country, source: s.source, campaign: s.campaign, device: s.device });
        s.views.forEach(function (p, j) { feed.push({ ts: at + (j + 1) * 25000, vid: s.vid, type: 'view', product: p[0], city: s.city, region: s.region, country: s.country, source: s.source, campaign: s.campaign, device: s.device }); });
        s.adds.forEach(function (p) { feed.push({ ts: at + 120000, vid: s.vid, type: 'add', product: p[0], city: s.city, region: s.region, country: s.country, source: s.source, campaign: s.campaign, device: s.device }); });
        if (s.paid) feed.push({ ts: at + 260000, vid: s.vid, type: 'purchase', value: s.value, city: s.city, region: s.region, country: s.country, source: s.source, campaign: s.campaign, device: s.device });
      });
      feed = feed.filter(function (e) { return e.ts <= t; }).sort(function (a, b) { return b.ts - a.ts; });
      var places = {}; recent.forEach(function (s) { var k = s.country + s.city, p = places[k] = places[k] || { city: s.city, region: s.region, country: s.country, lat: s.lat, lon: s.lon, visitors: 0, last: 0 }; p.visitors++; p.last = Math.max(p.last, s.ts); });
      return { now: t, online: recent.filter(function (s) { return t - s.ts < 5 * 6e4; }).length, places: Object.keys(places).map(function (k) { return places[k]; }), feed: feed.slice(0, 60) };
    };
    var orders = sessions.filter(function (s) { return s.paid || s.details; }).slice(-160).reverse().map(function (s, i) {
      var kind = s.paid ? 'paid' : (i % 3 ? 'started' : 'hold');
      var items = s.paid ? s.items : s.adds.map(function (p) { return { id: p[0], size: 'M', qty: 1, price: p[1] }; });
      return { id: 'o' + s.sid, ts: s.ts + 260000, kind: kind, name: s.name, email: s.email, value: s.paid ? s.value : items.reduce(function (a, x) { return a + x.price; }, 0), currency: 'USD', items: items, country: s.country, city: s.city, source: s.source, medium: s.medium, campaign: s.campaign };
    });
    var demoSettings = { pixels: { metaPixelId: '1234567890123456', tiktokPixelId: '', ga4Id: 'G-SANTA2026', googleAdsId: '', googleAdsPurchaseLabel: '', gtmId: '', pinterestTagId: '', snapPixelId: '' }, server: { metaCapiToken: '•••• a9F2', metaTestEventCode: '', tiktokEventsToken: '', ga4ApiSecret: '' }, products: { 'santa-hoodie': { badge: 'Bestseller' } } };
    return {
      route: function (path, opts) {
        var u = new URL(path, 'https://x');
        if (u.pathname === '/admin/stats') return stats(+u.searchParams.get('days') || 7, +u.searchParams.get('tz') || 0);
        if (u.pathname === '/admin/live') return liveNow();
        if (u.pathname === '/admin/orders') return { orders: orders };
        if (u.pathname === '/admin/settings') {
          if (opts && opts.method === 'PUT') {
            var b = opts.body;
            if (b.pixels) demoSettings.pixels = b.pixels;
            if (b.server) Object.keys(b.server).forEach(function (k) { var v = b.server[k]; if (v === '-') demoSettings.server[k] = ''; else if (v) demoSettings.server[k] = '•••• ' + v.slice(-4); });
            if (b.products) { var p = {}; Object.keys(b.products).forEach(function (id) { var x = b.products[id], o = {}; if (x.price) o.price = +x.price; if (x.badge) o.badge = x.badge; if (x.hidden) o.hidden = true; ['metaPixelId', 'tiktokPixelId', 'googleAdsLabel'].forEach(function (k) { if (x[k]) o[k] = x[k]; }); if (Object.keys(o).length) p[id] = o; }); demoSettings.products = p; }
          }
          return JSON.parse(JSON.stringify(demoSettings));
        }
        return {};
      }
    };
  })();

  if (demo || auth) start(); else showGate();
})();
