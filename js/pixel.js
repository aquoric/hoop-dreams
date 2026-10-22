/* =====================================================================
   PIXEL.JS — the shared 16-bit renderer.
   Used by the arcade (js/arcade.js), the match court in choices mode (js/match.js),
   training drills and cutscenes, so every view looks the same.

   World = the half court in canvas pixels (PIX.W × PIX.H = 384 × 216, hoop at the top).
   A venue can be built wider than 384 (wide screens); the court is centered at V.ox.

   Pixel.venue(id, home, away, width) -> V          prerendered backdrop + floor for a VENUES entry
   Pixel.renderer(ctx, V)             -> R          draws players, ball, hoop, crowd, lights, weather
   Pixel.text(ctx, str, x, y, color, scale, align)  crisp bitmap-font text
   Pixel.pixelate(svg, w, h)          -> Promise<canvas>   any SVG (avatars, logos) as pixel art
   ===================================================================== */
const PIX = { W: 384, H: 216, hoop: { x: 192, y: 60, z: 32 }, three: { rx: 116, ry: 84 }, court: { x0: 18, x1: 366, y0: 46, y1: 212 } };

const Pixel = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const SH = new Map();
  function shade(hex, amt) {
    const key = hex + amt; if (SH.has(key)) return SH.get(key);
    let h = String(hex || '#888').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16) || 0, t = amt < 0 ? 0 : 255, k = Math.abs(amt);
    const ch = s => Math.round(lerp((n >> s) & 255, t, k)).toString(16).padStart(2, '0');
    const out = '#' + ch(16) + ch(8) + ch(0); SH.set(key, out); return out;
  }
  const lum = hex => { const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16) || 0; return ((n >> 16 & 255) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) / 255; };

  /* ---------- 3×5 bitmap font ---------- */
  const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001010010', '111101111101111', '111101111001111'];
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '1000111011101011000110001', N: '10011101101110011001', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '1000110001101011101110001', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
    '!': '11101', '?': '110001010000010', '.': '00001', ',': '00011', '-': '000000111000000', '+': '000010111010000', "'": '11000', ':': '01010', '#': '101111101111101', '&': '010101010101011', '/': '001001010100100', '%': '101001010100101', '(': '0110101001', ')': '1001010110', '*': '000101010101000' };
  DIG.forEach((g, i) => F[i] = g);
  const glyphW = ch => { const g = F[ch]; if (!g) return 3; return g.length / 5; };
  function textWidth(str, sc = 1) { let w = 0; for (const ch of norm(str)) w += (ch === ' ' ? 2 : glyphW(ch) + 1) * sc; return Math.max(0, w - sc); }
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  function text(c, str, x, y, col = '#fff', sc = 1, align = 'left', outline = null) {
    str = norm(str); const w = textWidth(str, sc); let cx = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x); y = Math.round(y);
    const draw = (dx, dy, color) => { let xx = cx + dx; c.fillStyle = color; for (const ch of str) { if (ch === ' ') { xx += 2 * sc; continue; } const g = F[ch]; if (!g) { xx += 4 * sc; continue; } const gw = g.length / 5; for (let i = 0; i < g.length; i++) if (g[i] === '1') c.fillRect(xx + (i % gw) * sc, y + dy + Math.floor(i / gw) * sc, sc, sc); xx += (gw + 1) * sc; } };
    if (outline) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) draw(dx * Math.max(1, sc / 2 | 0), dy * Math.max(1, sc / 2 | 0), outline); }
    draw(0, 0, col); return w;
  }

  /* ---------- SVG -> pixel art ---------- */
  const PXC = new Map();
  function pixelate(svg, w, h) {
    const key = svg.length + ':' + w + 'x' + h + ':' + svg.slice(0, 80) + svg.slice(-200);
    if (PXC.has(key)) return PXC.get(key);
    const p = new Promise(res => {
      const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(im, 0, 0, w, h); res(cv); };
      im.onerror = () => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; res(cv); };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    PXC.set(key, p); return p;
  }

  /* =================================================================
     VENUES — static backdrop + floor prerendered, animated parts listed
     ================================================================= */
  function venue(id, home, away, width = 384) {
    const def = Venues.get(id), W = Math.max(384, Math.round(width)), H = PIX.H, ox = Math.round((W - 384) / 2), top = PIX.court.y0, HX = PIX.hoop.x + ox, HY = PIX.hoop.y;
    const team = def.team && Venues.team(def.team), tc = team ? team.colors : home.colors;
    const c0 = tc[0], c1 = tc[1] || '#ffffff', a0 = away.colors[0], h0 = home.colors[0];
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H; const g = bg.getContext('2d');
    const R = Art.seeded('venue' + def.id + W);
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const V = { def, W, H, ox, bg, crowd: [], lights: [], flags: [], c0, c1, a0, team, led: null, line: '#fef3c7', paint: c0, night: def.sky === 'night' || def.sky === 'dusk', street: def.style === 'street' };
    const SK = (typeof Art !== 'undefined' && Art.SKINS) || ['#a86b43'];
    const fan = (x, y, kind, h, col) => V.crowd.push({ x, y, kind, h: h || 6, c: col || pick([c0, c0, c1, '#e5e7eb', '#475569', a0, '#1f2937']), skin: SK[Math.floor(R() * SK.length)], ph: R() * 6 });

    /* ---- sky (street) ---- */
    const sky = (y0, y1) => {
      const P = { night: [[10, 14, 38], [46, 26, 72]], day: [[96, 170, 240], [190, 228, 255]], dusk: [[52, 36, 92], [240, 128, 96]], sunset: [[251, 113, 72], [254, 205, 120]] }[def.sky || 'night'];
      for (let y = y0; y < y1; y++) { const k = (y - y0) / Math.max(1, y1 - y0); px(0, y, W, 1, `rgb(${Math.round(lerp(P[0][0], P[1][0], k))},${Math.round(lerp(P[0][1], P[1][1], k))},${Math.round(lerp(P[0][2], P[1][2], k))})`); }
      if (def.sky === 'night') for (let i = 0; i < W / 9; i++) px(R() * W, R() * 20, 1, 1, R() < .3 ? '#fde68a' : '#cbd5e1');
      if (def.sky === 'day') for (let i = 0; i < 5; i++) { const x = R() * W, y = 3 + R() * 10; px(x, y, 18, 3, '#fff'); px(x + 4, y - 2, 10, 2, '#fff'); px(x + 2, y + 3, 14, 1, '#e0f2fe'); }
    };
    const buildings = (yb, hmin, hmax, lit, cols) => { for (let x = -10; x < W;) { const w = 14 + R() * 26, h = hmin + R() * (hmax - hmin); px(x, yb - h, w, h, pick(cols));
      if (lit) for (let wy = yb - h + 3; wy < yb - 4; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (R() < lit) px(wx, wy, 2, 2, R() < .8 ? '#fbbf24' : '#7dd3fc');
      x += w + 1; } };
    const chain = (y0, y1, x0 = 0, x1 = W, a = .42) => { g.fillStyle = `rgba(148,163,184,${a})`; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if ((x + y) % 6 === 0 || ((x - y) % 6 + 6) % 6 === 0) g.fillRect(x, y, 1, 1); };

    /* ---- backdrop by style ---- */
    if (def.style === 'street') {
      sky(0, top);
      const bd = def.backdrop;
      if (bd === 'city') buildings(top, 12, 38, V.night ? .35 : 0, ['#111827', '#1e1b3a']);
      else if (bd === 'park') { buildings(top - 8, 6, 18, 0, ['#93c5fd', '#a5b4fc']); for (let x = -6; x < W; x += 14 + R() * 10) { px(x + 5, top - 12, 3, 10, '#5b3a1a'); px(x, top - 22, 14, 11, R() < .5 ? '#15803d' : '#166534'); px(x + 2, top - 26, 10, 5, '#22c55e'); } px(0, top - 3, W, 3, '#4d7c0f'); }
      else if (bd === 'cage') { for (let y = 2; y < top; y += 4) for (let x = (y / 4 % 2) * 6; x < W; x += 12) px(x, y, 11, 3, R() < .5 ? '#7c2d12' : '#92400e'); for (let i = 0; i < 6; i++) { const x = R() * (W - 40); px(x, 12 + R() * 14, 24 + R() * 20, 6 + R() * 6, pick(['#db2777', '#22d3ee', '#a3e635', '#facc15', '#7c3aed'])); } }
      else if (bd === 'rooftop') { buildings(top - 2, 14, top + 6, .45, ['#0b1226', '#111a33', '#1a1f3d']); for (let i = 0; i < 4; i++) { const x = R() * W; px(x, 2, 1, 4, '#ef4444'); } px(W * .78, top - 20, 12, 10, '#3f2a1d'); px(W * .78 + 2, top - 10, 2, 8, '#3f2a1d'); px(W * .78 + 8, top - 10, 2, 8, '#3f2a1d'); }
      else if (bd === 'beach') { const sy = 24; g.fillStyle = '#fde68a'; g.beginPath(); g.arc(W * .7, sy + 2, 10, Math.PI, 0); g.fill(); px(0, sy + 2, W, top - sy - 8, '#0e7490'); for (let y = sy + 4; y < top - 6; y += 3) for (let x = (y * 7) % 11; x < W; x += 11 + R() * 9) px(x, y, 5, 1, y < sy + 8 ? '#fdba74' : '#67e8f9'); px(0, top - 6, W, 6, '#e9cf98');
        for (const x of [W * .1, W * .88, W * .2]) { px(x, top - 26, 2, 22, '#7c4a1e'); for (let k = -1; k <= 1; k += 2) { px(x + k * 3, top - 28, 7 * k < 0 ? 7 : 7, 2, '#15803d'); px(x + (k < 0 ? -8 : 2), top - 26, 8, 2, '#166534'); } } }
      // fences
      if (def.fence === 'chain' || def.fence === 'cage') { chain(11, top, 0, W, def.fence === 'cage' ? .55 : .42); px(0, 11, W, 2, '#64748b'); for (let x = 6; x < W; x += 48) px(x, 11, 2, top - 11, '#475569'); }
      if (def.fence === 'low') { px(0, top - 6, W, 1, '#94a3b8'); for (let x = 0; x < W; x += 8) px(x, top - 6, 1, 6, '#94a3b8'); }
      if (def.fence === 'rail') { px(0, top - 8, W, 2, '#9ca3af'); px(0, top - 4, W, 1, '#6b7280'); for (let x = 0; x < W; x += 10) px(x, top - 8, 1, 8, '#6b7280'); }
      if (def.lights === 'lamps') [ox + 40, ox + 344].forEach(x => { px(x, 0, 2, top, '#334155'); px(x - 4, 2, 10, 3, '#1f2937'); V.lights.push({ kind: 'cone', x: x + 1, y: 5, r: 70, col: '255,228,150' }); });
      if (def.lights === 'strings') V.lights.push({ kind: 'strings' });
      for (let i = 0; i < (def.crowd || 0); i++) fan(8 + R() * (W - 16), top - (def.backdrop === 'beach' ? 3 : 1), 'stand', 13 + R() * 4, pick([h0, a0, '#334155', '#7c3aed', '#16a34a', '#e5e7eb', '#f472b6']));
    } else if (def.style === 'gym' || def.style === 'practice') {
      const wl = def.walls || 'paint';
      if (wl === 'brick') for (let y = 0; y < top; y += 4) for (let x = (y / 4 % 2) * 6 - 6; x < W; x += 12) px(x, y, 11, 3, R() < .5 ? '#7c2d12' : '#9a3412');
      else if (wl === 'wood') { for (let x = 0; x < W; x += 6) px(x, 0, 6, top, x / 6 % 2 ? '#5b3a1f' : '#6b4524'); px(0, 18, W, 2, '#3b2414'); }
      else if (wl === 'block') { px(0, 0, W, top, '#9ca3af'); for (let y = 0; y < top; y += 5) { px(0, y, W, 1, '#6b7280'); for (let x = (y / 5 % 2) * 8; x < W; x += 16) px(x, y, 1, 5, '#6b7280'); } }
      else { px(0, 0, W, top, shade(c0, -.55)); px(0, 14, W, 3, c0); px(0, 17, W, 1, c1); }
      px(0, 0, W, top, 'rgba(0,0,0,.22)');
      if (def.style === 'gym') {
        for (let i = 0; i < Math.ceil(W / 52); i++) { const x = 18 + i * 52; g.fillStyle = i % 2 ? c0 : c1; g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 14, 1); g.lineTo(x + 7, 12); g.fill(); }
        px(HX - 30, 1, 60, 11, '#0b0f1c'); px(HX - 29, 2, 58, 9, '#111827'); if (team) text(g, team.abbr || '', HX, 4, '#f87171', 1, 'center');
        const rows = 4; for (let r = 0; r < rows; r++) { const y = 17 + r * 7.2; px(0, y + 6, W, 2, '#a16207'); px(0, y + 8, W, 1, '#713f12');
          for (let x = 4 + (r % 2) * 4; x < W - 4; x += 7 + R() * 3) if (R() < (def.crowd || .6)) fan(x, y + 6, 'sit', 6); }
        if (def.theme === 'showcase') for (let i = 0; i < 3; i++) { const x = ox + 40 + i * 120; px(x, 2, 44, 8, '#0f172a'); text(g, i === 1 ? 'SHOWCASE' : 'SCOUTS', x + 22, 4, '#facc15', 1, 'center'); }
        else if (team) { px(4, 2, 40, 9, c0); text(g, team.abbr || '', 24, 4, c1, 1, 'center'); px(W - 44, 2, 40, 9, c0); text(g, '2011', W - 24, 4, c1, 1, 'center'); }
      } else {   // practice / combine
        px(0, top - 14, W, 14, '#c8a06a'); for (let x = 0; x < W; x += 9) px(x, top - 14, 1, 14, '#a07a48');
        const msg = def.theme === 'combine' ? 'NBL DRAFT COMBINE' : 'OUTWORK EVERYBODY';
        px(HX - 70, 3, 140, 11, def.theme === 'combine' ? '#111827' : c0); text(g, msg, HX, 6, def.theme === 'combine' ? '#facc15' : c1, 1, 'center');
        for (const rx of [ox + 26, ox + 330]) { px(rx, top - 12, 26, 2, '#475569'); px(rx, top - 5, 26, 2, '#475569'); for (let i = 0; i < 6; i++) { px(rx + 1 + i * 4, top - 16, 3, 3, '#ea580c'); px(rx + 1 + i * 4, top - 9, 3, 3, '#ea580c'); } }
        for (let i = 0; i < Math.round((def.crowd || 0) * 40); i++) fan(ox + 60 + R() * 264, top - 2, 'stand', 12, pick(['#1f2937', '#334155', '#e5e7eb']));
      }
      V.lights.push({ kind: 'cone', x: W * .25, y: -4, r: 120, col: '255,245,220' }, { kind: 'cone', x: W * .75, y: -4, r: 120, col: '255,245,220' });
    } else {   // arena
      px(0, 0, W, top, '#05070d');
      const th = def.theme, dens = def.crowd != null ? def.crowd : .9;
      for (let r = th === 'overseas' ? 2 : 0; r < 6; r++) { const y = 2 + r * 6.4;
        for (let x = 2 + (r % 2) * 3; x < W - 2; x += 5 + R() * 2) {
          if (R() > dens) continue;
          let col = pick([c0, c0, c0, c1, '#1f2937', '#334155', a0, '#e5e7eb']);
          if (th === 'college' && x > W * .3 && x < W * .7) col = r % 2 ? c0 : c1;          // student section
          if (th === 'allstar') col = pick(['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#e5e7eb', '#a855f7']);
          if (th === 'finals') col = pick([c0, c1, '#d4a017', '#d4a017', '#1f2937']);
          fan(x, y + 5, 'tier', 4 + r * .4, col);
        } }
      if (th === 'overseas') { const L = def.landmark; px(0, 0, W, 14, shade(c0, -.6)); g.fillStyle = shade(c1, -.1); g.globalAlpha = .85; drawLandmark(g, L, HX - 110, 14, W); drawLandmark(g, L, HX + 110, 14, W); g.globalAlpha = 1; text(g, team ? team.city.toUpperCase() : '', HX, 4, c1, 1, 'center'); for (let i = 0; i < 8; i++) V.flags.push({ x: 12 + i * (W - 24) / 7, y: 2, w: 12, h: 8, a: c0, b: c1 }); }
      if (th === 'tournament') { g.strokeStyle = '#f8fafc'; g.globalAlpha = .55; for (let k = 0; k < 4; k++) { const y = 4 + k * 4; px(8, y, 18, 1, '#f8fafc'); px(26, y, 1, 3, '#f8fafc'); px(W - 26, y, 18, 1, '#f8fafc'); px(W - 27, y, 1, 3, '#f8fafc'); } g.globalAlpha = 1; }
      if (th === 'finals') { px(0, top - 8, W, 1, '#d4a017'); for (let i = 0; i < 6; i++) V.flags.push({ x: 20 + i * (W - 40) / 5, y: 1, w: 10, h: 12, a: '#d4a017', b: c0 }); }
      if (th === 'college') for (let i = 0; i < 5; i++) px(ox + 120 + i * 30, top - 7, 4, 3, '#facc15');   // band brass
      // jumbotron
      if (th === 'pro' || th === 'finals' || th === 'allstar' || th === 'overseas' || th === 'tournament') { px(HX - 26, 0, 52, 6, '#111827'); px(HX - 25, 0, 50, 5, '#0b1a33'); }
      V.led = { text: (def.chant || { college: `GO ${team ? team.abbr : ''}`, tournament: 'MARCH MAYHEM', summer: 'SUMMER LEAGUE', allstar: 'ALL-STAR WEEKEND', finals: 'NBL FINALS' }[th] || (team ? team.name : 'HOOP DREAMS')).toUpperCase(), a: c0, b: c1 };
      V.lights.push({ kind: 'spot', x: W * .16, y: -10, r: 150, col: '200,220,255', sweep: 1 }, { kind: 'spot', x: W * .84, y: -10, r: 150, col: '255,220,200', sweep: -1 });
      if (th === 'finals') V.lights.push({ kind: 'spot', x: W * .4, y: -10, r: 130, col: '255,230,160', sweep: .7 }, { kind: 'spot', x: W * .6, y: -10, r: 130, col: '255,230,160', sweep: -.7 });
      if (def.lights === 'lasers') V.lights.push({ kind: 'lasers' });
      if (th === 'summer') px(0, 0, W, top, 'rgba(251,146,60,.08)');
    }

    /* ---- floor ---- */
    const FL = { asphalt: ['#3a3f47', '#40454e'], wet: ['#24282f', '#272c34'], park: ['#2f6f4a', '#33774f'], cage: ['#8f3b2c', '#963f2f'], rooftop: ['#1d4f86', '#205590'], beach: ['#c7b597', '#cdbb9d'], wood: ['#d49a5c', '#dca468'], wood_dark: ['#a4683a', '#ad7041'], wood_pro: ['#c8894f', '#d0915a'] }[def.floor || 'asphalt'];
    const wood = /wood/.test(def.floor || '');
    for (let y = top; y < H; y += 3) { px(0, y, W, 3, FL[(y / 3) % 2 | 0]); if (wood) for (let x = (y * 7) % 37; x < W; x += 37 + (y % 5) * 3) px(x, y, 1, 3, shade(FL[0], -.12)); }
    if (!wood) { for (let i = 0; i < W * 2.3; i++) px(R() * W, top + R() * (H - top), 1, 1, R() < .5 ? shade(FL[0], -.15) : shade(FL[0], .12)); }
    if (def.floor === 'asphalt' || def.floor === 'wet') for (let i = 0; i < 6; i++) { let x = R() * W, y = top + R() * (H - top); for (let k = 0; k < 30; k++) { px(x, y, 1, 1, '#1d2026'); x += rnd(-1, 1.5); y += rnd(-1, 1); } }
    if (def.floor === 'rooftop') { for (let x = ox + 18; x < ox + 366; x += 12) px(x, top, 1, H - top, '#2563a8'); for (let y = top; y < H; y += 12) px(0, y, W, 1, '#2563a8'); px(0, top, ox + 18, H - top, '#4b5563'); px(ox + 366, top, W, H - top, '#4b5563'); }
    if (def.floor === 'park') { px(0, top, ox + 14, H - top, '#3f7d3a'); px(ox + 370, top, W, H - top, '#3f7d3a'); }
    if (def.floor === 'beach') for (let i = 0; i < 14; i++) { const x = R() < .5 ? R() * (ox + 30) : ox + 340 + R() * (W - ox - 340); px(x, top + R() * (H - top), 10 + R() * 14, 3, '#e6cf9a'); }
    if (def.floor === 'wet') for (let i = 0; i < 9; i++) { const x = ox + 20 + R() * 340, y = top + 20 + R() * (H - top - 30), w = 14 + R() * 30; g.fillStyle = 'rgba(56,90,140,.35)'; g.beginPath(); g.ellipse(x, y, w, w * .22, 0, 0, 7); g.fill(); V.flags.push({ puddle: true, x, y, w }); }
    if (def.floor === 'wood_pro') { const ap = shade(c0, -.15); px(0, top, ox + 18, H - top, ap); px(ox + 366, top, W, H - top, ap); px(0, top, W, 5, ap); }
    if (def.style === 'arena' && def.floor !== 'wood_pro') px(0, top, W, 4, c0);
    // paint + lines
    const street = def.style === 'street';
    V.line = street ? 'rgba(241,245,249,.78)' : '#fef3c7';
    V.paint = def.floor === 'park' ? '#2563eb' : def.floor === 'rooftop' ? '#f97316' : def.floor === 'beach' ? '#0ea5e9' : street ? shade(h0, -.25) : c0;
    g.fillStyle = V.paint + (street ? 'aa' : 'cc'); g.fillRect(HX - 30, top, 60, 118 - top);
    const L = (x, y, w, h) => px(x, y, w, h, V.line);
    L(ox + PIX.court.x0, top, 348, 1); L(ox + PIX.court.x0, top, 1, H - top); L(ox + PIX.court.x1, top, 1, H - top); L(ox + PIX.court.x0, H - 4, 348, 1);
    L(HX - 30, top, 1, 118 - top); L(HX + 30, top, 1, 118 - top); L(HX - 30, 118, 61, 1);
    const ell = (cx, cy, rx, ry, a0_, a1_, step = .01) => { for (let a = a0_; a <= a1_; a += step) L(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1, 1); };
    ell(HX, 118, 30, 13, 0, Math.PI); ell(HX, 118, 30, 13, Math.PI, Math.PI * 2, .08);
    ell(HX, HY, PIX.three.rx, PIX.three.ry, 0, Math.PI, .004); L(HX - PIX.three.rx, top, 1, HY - top); L(HX + PIX.three.rx, top, 1, HY - top);
    ell(HX, HY, 14, 7, 0, Math.PI); ell(HX, H - 4, 32, 14, Math.PI, Math.PI * 2, .006);
    if (!street) { g.fillStyle = c0 + '66'; g.beginPath(); g.ellipse(HX, H - 4, 31, 13, 0, Math.PI, Math.PI * 2); g.fill(); }
    if (def.floor === 'wood_pro' && team) { text(g, (team.city || team.name).toUpperCase(), ox + 9, 120, c1, 1, 'center'); }
    // lighting baked into the floor
    const lgr = g.createRadialGradient(HX, 120, 20, HX, 120, W * .7); lgr.addColorStop(0, def.sky === 'day' ? 'rgba(255,255,255,.08)' : street ? 'rgba(255,230,160,.1)' : 'rgba(255,255,255,.12)'); lgr.addColorStop(1, def.sky === 'day' ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.42)');
    g.fillStyle = lgr; g.fillRect(0, top, W, H - top);
    if (!street) { g.fillStyle = 'rgba(255,255,255,.07)'; [[W * .25, 120], [W * .75, 120], [HX, 170]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 40, 9, 0, 0, 7); g.fill(); }); }
    if (def.sky === 'sunset' || def.sky === 'dusk') { g.fillStyle = 'rgba(251,146,60,.1)'; g.fillRect(0, top, W, H - top); }
    // team logo at center court (async: drawn when ready)
    if (team && team.logo && !street) pixelate(Art.logo(Object.assign({}, team), 64), 30, 30).then(cv => { g.globalAlpha = .9; g.drawImage(cv, HX - 15, H - 20); g.globalAlpha = 1; });
    /* ---- vignette ---- */
    const vg = document.createElement('canvas'); vg.width = W; vg.height = H; const v = vg.getContext('2d');
    const vgr = v.createRadialGradient(W / 2, H * .55, H * .45, W / 2, H * .55, W * .7); vgr.addColorStop(0, 'rgba(0,0,0,0)'); vgr.addColorStop(1, def.sky === 'day' ? 'rgba(0,0,0,.15)' : street ? 'rgba(0,0,8,.55)' : 'rgba(0,0,0,.4)');
    v.fillStyle = vgr; v.fillRect(0, 0, W, H);
    V.vg = vg;
    if (def.weather === 'rain') V.rain = [...Array(110)].map(() => ({ x: R() * W, y: R() * H, s: 140 + R() * 80 }));
    return V;
  }
  function drawLandmark(g, L, cx, by, W) {   // city silhouettes above the stands (overseas arenas)
    const r = (x, y, w, h) => g.fillRect(Math.round(x), Math.round(y), w, h);
    if (L === 'arches') for (let i = -3; i <= 3; i++) { r(cx + i * 16 - 6, by - 10, 2, 10); r(cx + i * 16 + 6, by - 10, 2, 10); r(cx + i * 16 - 6, by - 12, 14, 2); }
    else if (L === 'domes') { for (const dx of [-60, 0, 60]) { g.beginPath(); g.arc(cx + dx, by, 12, Math.PI, 0); g.fill(); } for (const dx of [-90, -30, 30, 90]) r(cx + dx, by - 20, 2, 20); }
    else if (L === 'columns') { r(cx - 60, by - 14, 120, 2); for (let i = 0; i < 9; i++) r(cx - 56 + i * 14, by - 12, 3, 12); g.beginPath(); g.moveTo(cx - 62, by - 14); g.lineTo(cx, by - 20); g.lineTo(cx + 62, by - 14); g.fill(); }
    else if (L === 'fortress') { r(cx - 70, by - 8, 140, 8); for (let i = 0; i < 8; i++) r(cx - 70 + i * 20, by - 12, 8, 4); r(cx - 10, by - 18, 20, 10); }
    else if (L === 'tower') { g.beginPath(); g.moveTo(cx - 14, by); g.lineTo(cx, by - 22); g.lineTo(cx + 14, by); g.fill(); r(cx - 8, by - 9, 16, 2); }
    else if (L === 'tokyotower') { g.beginPath(); g.moveTo(cx - 10, by); g.lineTo(cx, by - 22); g.lineTo(cx + 10, by); g.fill(); for (let i = 0; i < 12; i++) r(cx - 100 + i * 18, by - 6 - (i % 3) * 3, 10, 6 + (i % 3) * 3); }
    else if (L === 'opera') for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 40 + i * 20, by); g.quadraticCurveTo(cx - 30 + i * 20, by - 18, cx - 22 + i * 20, by); g.fill(); }
    else if (L === 'pagoda') for (let i = 0; i < 4; i++) { const w = 40 - i * 8; r(cx - w / 2, by - 4 - i * 5, w, 2); r(cx - w / 2 + 4, by - 3 - i * 5, w - 8, 3); }
  }

  /* =================================================================
     RENDERER
     ================================================================= */
  const SKL = { thigh: 6, shin: 6, torso: 10, ua: 5, fa: 5 };
  const OUT = '#0a0a12';
  function renderer(c, V) {
    const E = { t: 0, hype: .3, net: { swish: 0, sway: 0 }, rim: 0, shatter: false, fx: [], glass: [] };
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
    function seg(x1, y1, x2, y2, w, col) { const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1))); c.fillStyle = col; const hw = w / 2; for (let i = 0; i <= n; i++) { const t = i / n; c.fillRect(Math.round(x1 + (x2 - x1) * t - hw), Math.round(y1 + (y2 - y1) * t - hw), w, w); } }
    function limb(a, b, cc, w, col) { seg(a[0], a[1], b[0], b[1], w + 2, OUT); seg(a[0], a[1], b[0], b[1], w, col); seg(b[0], b[1], cc[0], cc[1], w + 2, OUT); seg(b[0], b[1], cc[0], cc[1], w, col); }

    /* pose from the player's current action (p.act) and state */
    function poseOf(p) {
      const a = p.act, t = E.t, sp = Math.hypot(p.vx || 0, p.vy || 0), air = p.z > .5, hasBall = !!p.hasBall;
      const o = { lean: 0, rot: 0, hip: null, legs: [[.1, -.18], [-.08, -.18]], arms: [[-.15, .45], [.25, .5]], ball: hasBall ? (p.holdBall ? 'chest' : 'dribble') : null, layer: 'front' };
      const br = Math.sin(t * 3 + (p.i || 0) * 1.7) * .07; o.legs[0][1] -= br; o.legs[1][1] -= br;
      const s = Math.sin(p.phase || 0), c2 = Math.cos(p.phase || 0);
      if (p.stance && !hasBall && !air) {
        o.legs = [[.42 + (sp > 8 ? s * .2 : 0), -.62], [-.42 - (sp > 8 ? s * .2 : 0), -.62]]; o.arms = [[1.35, .25], [1.05, .3]]; o.lean = .12;
        if (sp > 8) o.arms = [[1.45 + s * .1, .2], [.95, .3]];
      } else if (sp > 8 && !air) {
        o.legs = [[s * .8, -(.25 + Math.max(0, c2) * 1.25)], [-s * .8, -(.25 + Math.max(0, -c2) * 1.25)]];
        o.arms = [[-s * .75, 1.25], [s * .75, 1.25]]; o.lean = .2 + (p.burst > 0 ? .15 : 0);
      }
      if (hasBall && !p.holdBall && (!a || a.type === 'catch')) { const u = (p.dribT || 0) % 1, b = 1 - Math.abs(1 - 2 * u); o.arms[1] = [.62 + b * .2, .15 + (1 - b) * .35]; }
      if (air && (!a || a.type === 'jump')) { o.legs = [[.55, -1.15], [.15, -.65]]; o.arms = [[2.2, .4], [2.45, .3]]; }
      if (!a) return o;
      const k = a.T ? clamp(a.t / a.T, 0, 1) : 0;
      switch (a.type) {
        case 'catch': o.arms = [[1.3, .5], [1.4, .4]]; o.ball = 'chest'; break;
        case 'shoot':
          if (!a.air) { o.legs = [[.5, -1.1], [-.22, -1.0]]; o.arms = [[.95, 1.7], [1.05, 1.75]]; o.ball = 'chest'; o.lean = .05; }
          else if (!a.released) { o.legs = [[.22, -.4], [-.06, -.45]]; o.arms = [[2.15, 1.25], [2.3, 1.15]]; o.ball = 'set'; }
          else { o.legs = [[.15, -.2], [-.05, -.3]]; o.arms = [[2.1, .7], [2.55, .2]]; o.ball = null; o.flick = true; }
          break;
        case 'layup':
          o.legs = a.t < .18 ? [[.5, -.9], [-.3, -.5]] : [[1.5, -1.65], [-.15, -.2]]; o.lean = .15;
          o.arms = a.released ? [[1.6, .4], [2.6, 0]] : a.t < .18 ? [[1.0, 1.6], [1.1, 1.6]] : [[1.8, .6], [2.45 + Math.min(.15, a.t * .3), .15]];
          o.ball = a.released ? null : a.t < .18 ? 'chest' : 'hand'; break;
        case 'dunk':
          if (a.t < .22) { o.legs = [[.55, -1.2], [-.25, -1.0]]; o.arms = [[1.0, 1.6], [1.1, 1.7]]; o.ball = 'chest'; o.lean = .1; }
          else if (a.t < .64) { o.legs = [[.65, -1.35], [.05, -.55]]; o.arms = [[2.5, .6], [3.75, .7]]; o.ball = 'hand'; o.lean = -.05; }
          else if (a.made && a.t < .9) { o.legs = [[.12, -.15], [-.1, -.2]]; o.arms = [[2.6, 0], [2.7, 0]]; o.ball = null; }
          else { o.legs = [[.3, -.6], [-.1, -.4]]; o.arms = [[2.4, .3], [2.0, .3]]; o.ball = null; }
          if (a.stuffed) o.ball = null; break;
        case 'pass': o.arms = a.t < .1 ? [[1.0, 1.5], [1.1, 1.5]] : [[1.45, .1], [1.55, 0]]; o.lean = .12; o.ball = a.thrown ? null : 'chest'; break;
        case 'reach': o.lean = .45; o.arms = [[.5, .3], [1.15, 0]]; o.legs = [[-.55, -.2], [.85, -.7]]; break;
        case 'block': o.arms = [[2.3, .2], [2.6, 0]]; o.legs = [[.3, -.6], [-.1, -.4]]; break;
        case 'reb': o.arms = [[2.45, .2], [2.6, .15]]; o.legs = [[.45, -1.0], [.1, -.5]]; if (hasBall) o.ball = 'over'; break;
        case 'celebrate': o.arms = [[2.5, .4], [2.65, .3]]; break;
        case 'stumble': o.lean = -.4; o.legs = [[-.35, -.2], [.4, -.5]]; o.arms = [[2.2, .6], [1.3, .3]]; break;
        case 'down': { const up = a.T - a.t < .45, r = up ? (a.T - a.t) / .45 : Math.min(1, a.t / .15); o.rot = -1.5 * r; o.hip = 2 + (1 - r) * 10; o.legs = [[.25, -.1], [-.05, -.25]]; o.arms = [[2.6, .2], [2.0, .4]]; if (up) o.hip = null; break; }
        case 'sit':
          if (a.t < .2) { o.lean = -.5; o.legs = [[-.4, -.3], [.6, -.6]]; o.arms = [[2.4, .4], [1.8, .3]]; }
          else { o.hip = 3; o.legs = [[1.45, -.05], [1.3, .1]]; o.lean = -.4; o.arms = [[-.6, 0], [-.35, 0]]; o.stars = true; }
          break;
        case 'move': {
          const id = a.id;
          o.ball = id === 'hesi' ? (k < .55 ? 'hip' : 'dribble') : id === 'spin' ? 'chest' : id;
          if (id === 'hesi') { if (k < .55) { o.legs = [[.38, -.3], [-.38, -.3]]; o.lean = -.14; o.arms[1] = [.7, .9]; } else o.lean = .32; }
          else if (id === 'cross') { o.legs = [[.5, -.75], [-.5, -.75]]; o.lean = .12; o.arms = [[.6, .4], [.4 + k * .4, .3]]; }
          else if (id === 'btl') { o.legs = [[-.65, -.35], [.95, -.55]]; o.lean = .15; o.arms = [[.5, .5], [.3, .3]]; o.layer = 'mid'; }
          else if (id === 'btb') { o.legs = [[.45, -.65], [-.45, -.65]]; o.arms = [[-.9, .4], [-.7 + k * .5, .3]]; o.layer = 'back'; }
          else if (id === 'spin') { o.legs = [[.4, -.9], [-.4, -.9]]; o.arms = [[.9, 1.5], [.85, 1.45]]; o.lean = .1; }
          break;
        }
      }
      return o;
    }
    function skeleton(p) {
      const o = poseOf(p), f = p.face || 1, r = o.rot || 0;
      const Vv = (a, l) => [Math.sin(a) * l * f, Math.cos(a) * l];
      const lr = o.legs.map(([a1, a2]) => { const kk = Vv(a1 + r, SKL.thigh), ff = Vv(a1 + a2 + r, SKL.shin); return { knee: kk, foot: [kk[0] + ff[0], kk[1] + ff[1]] }; });
      const drop = o.hip != null ? o.hip : Math.max(lr[0].foot[1], lr[1].foot[1], 4);
      const hip = [p.x, p.y - p.z - drop];
      const tv = Vv(Math.PI - (o.lean || 0) + r, SKL.torso), neck = [hip[0] + tv[0], hip[1] + tv[1]];
      const hv = Vv(Math.PI - (o.lean || 0) + r, 4.5), head = [neck[0] + hv[0], neck[1] + hv[1]];
      const legs = lr.map(L => ({ knee: [hip[0] + L.knee[0], hip[1] + L.knee[1]], foot: [hip[0] + L.foot[0], hip[1] + L.foot[1]] }));
      const sh = [neck[0] - tv[0] * .12, neck[1] - tv[1] * .12 + 1];
      const shs = [[sh[0] - f * 3 * Math.cos(r), sh[1]], [sh[0] + f * 2 * Math.cos(r), sh[1] + 1]];
      const arms = o.arms.map(([a1, a2], i) => { const S = shs[i], e = Vv(a1 + r, SKL.ua), h = Vv(a1 + a2 + r, SKL.fa); return { sh: S, elbow: [S[0] + e[0], S[1] + e[1]], hand: [S[0] + e[0] + h[0], S[1] + e[1] + h[1]] }; });
      return { o, f, hip, neck, head, legs, arms };
    }
    function drawShoe(ft, f, col) { const x = Math.round(ft[0]) - 2 + (f > 0 ? 1 : -1), y = Math.round(ft[1]) - 1; px(x - 1, y - 1, 6, 4, OUT); px(x, y, 4, 2, col); px(x + (f > 0 ? 3 : 0), y + 1, 1, 1, '#0f172a'); }
    function drawHair(p, hx, hy, f) {
      const hc = p.hairC || '#111', s = p.hair || 'fade', back = f > 0 ? hx - 1 : hx + 6;
      if (s === 'bald') { px(hx + 2, hy, 2, 1, shade(p.skin, .3)); return; }
      if (s === 'afro') { px(hx - 2, hy - 3, 10, 5, OUT); px(hx - 1, hy - 3, 8, 5, hc); px(hx - 2, hy - 2, 10, 3, hc); return; }
      if (s === 'flattop') { px(hx, hy - 3, 6, 4, hc); px(hx, hy - 4, 6, 1, OUT); return; }
      if (s === 'curly') { px(hx - 1, hy - 2, 8, 3, hc); for (let i = 0; i < 4; i++) px(hx - 1 + i * 2, hy - 3, 1, 1, hc); return; }
      if (s === 'braids' || s === 'dreads' || s === 'long' || s === 'ponytail') { px(hx, hy - 1, 6, 2, hc); px(back, hy, 1, s === 'ponytail' ? 3 : 7, hc); px(back + (f > 0 ? -1 : 1), hy + 2, 1, s === 'ponytail' ? 5 : 6, hc); return; }
      px(hx, hy - 1, 6, s === 'buzz' ? 1 : 2, hc); px(back + (f > 0 ? 1 : -1), hy, 1, 2, hc);
    }
    function ballAt(p, K) {
      const o = K.o, f = K.f, hand = K.arms[1].hand, a = p.act, k = a && a.T ? clamp(a.t / a.T, 0, 1) : 0, floorY = p.y + 1;
      switch (o.ball) {
        case 'dribble': { const u = (p.dribT || 0) % 1, b = 1 - Math.abs(1 - 2 * u); return [hand[0] + f * 1.5, lerp(hand[1] + 2, floorY - 2, b * b * (3 - 2 * b))]; }
        case 'chest': return [K.neck[0] + f * 4, K.neck[1] + 4];
        case 'set': return [hand[0] - f, hand[1] - 3];
        case 'hand': return [hand[0], hand[1] - 2];
        case 'over': return [K.head[0] + f, K.head[1] - 7];
        case 'hip': return [hand[0] + f, hand[1]];
        case 'cross': return [lerp(p.x + a.f0 * 6, p.x + a.f1 * 6, k), lerp(hand[1], floorY - 2, Math.sin(k * Math.PI))];
        case 'btl': return [lerp(p.x + a.f0 * 6, p.x + a.f1 * 6, k), k < .5 ? lerp(hand[1], floorY - 3, k * 2) : lerp(floorY - 3, hand[1], (k - .5) * 2)];
        case 'btb': return [p.x + Math.cos(k * Math.PI) * 6 * a.f0, K.hip[1] + 2];
      }
      return [hand[0], hand[1]];
    }
    function ball(x, y, fire, spin) {
      x = Math.round(x - 2); y = Math.round(y - 2);
      const base = fire ? '#fbbf24' : '#e8651b', hi = fire ? '#fef08a' : '#fb923c', sm = '#7c2d12';
      px(x, y + 1, 5, 3, OUT); px(x + 1, y, 3, 5, OUT); px(x, y + 1, 5, 3, base); px(x + 1, y, 3, 5, base); px(x + 1, y + 1, 1, 1, hi);
      const fr = Math.floor((spin || 0) * 2) % 4;
      if (fr === 0) px(x + 2, y, 1, 5, sm); else if (fr === 1) { px(x + 1, y + 1, 1, 1, sm); px(x + 2, y + 2, 1, 1, sm); px(x + 3, y + 3, 1, 1, sm); } else if (fr === 2) px(x, y + 2, 5, 1, sm); else { px(x + 3, y + 1, 1, 1, sm); px(x + 2, y + 2, 1, 1, sm); px(x + 1, y + 3, 1, 1, sm); }
      if (fire) E.fx.push({ x: x + 2 + rnd(-2, 2), y: y + 2, vx: rnd(-6, 6), vy: -rnd(10, 30), life: .22, col: pick(['#f97316', '#ef4444']) });
    }
    function freeBall(b, fire) { const ss = Math.max(2, 5 - b.z * .05); px(b.x - ss / 2, b.y, ss, 1, 'rgba(0,0,0,.35)'); ball(b.x, b.y - b.z - 2, fire, b.spin || E.t * 8); }
    /* o: { me, mate, meCol } */
    function player(p, o = {}) {
      const K = skeleton(p), po = K.o, f = K.f, z = p.z;
      p.hand = { x: K.arms[1].hand[0], y: K.arms[1].hand[1] }; p.headY = K.head[1];
      const sw = Math.max(6, 13 - z * .12);
      px(p.x - sw / 2, p.y - 1, sw, 3, 'rgba(0,0,0,.38)'); px(p.x - sw / 2 + 2, p.y - 2, sw - 4, 5, 'rgba(0,0,0,.18)');
      if (o.me) { c.strokeStyle = o.fire ? '#f97316' : '#facc15'; c.lineWidth = 1; c.beginPath(); c.ellipse(Math.round(p.x) + .5, Math.round(p.y) + .5, 9, 3.5, 0, 0, 7); c.stroke(); }
      else if (o.mate) { c.strokeStyle = p.col + 'aa'; c.lineWidth = 1; c.beginPath(); c.ellipse(Math.round(p.x) + .5, Math.round(p.y) + .5, 8, 3, 0, 0, 7); c.stroke(); }
      const held = () => { const [x, y] = ballAt(p, K); ball(x, y, p.fire, p.hasBall ? (p.dribT || 0) * 6 : 0); px(x - 2, p.y, 4, 1, 'rgba(0,0,0,.3)'); };
      if (po.ball && po.layer === 'back') held();
      limb(K.hip, K.legs[0].knee, K.legs[0].foot, 3, p.skinD); px(K.legs[0].foot[0] - 1, K.legs[0].foot[1] - 3, 3, 2, '#e2e8f0'); drawShoe(K.legs[0].foot, f, shade(p.shoe || '#fff', -.25));
      limb(K.arms[0].sh, K.arms[0].elbow, K.arms[0].hand, 2, p.skinD);
      const sv = [lerp(K.legs[0].knee[0], K.legs[1].knee[0], .5), lerp(K.legs[0].knee[1], K.legs[1].knee[1], .5)], sb = [lerp(K.hip[0], sv[0], .55), lerp(K.hip[1], sv[1], .55)];
      seg(K.hip[0], K.hip[1], sb[0], sb[1], 9, OUT); seg(K.hip[0], K.hip[1], sb[0], sb[1], 7, p.colD);
      seg(K.hip[0], K.hip[1] - 1, K.neck[0], K.neck[1] + 1, 11, OUT); seg(K.hip[0], K.hip[1] - 1, K.neck[0], K.neck[1] + 1, 9, p.col);
      seg(K.hip[0] - f * 3, K.hip[1] - 1, K.neck[0] - f * 3, K.neck[1] + 1, 2, p.colD);
      seg(K.hip[0] + f * 2, K.hip[1] - 2, K.neck[0] + f * 2, K.neck[1] + 2, 1, p.colL);
      px(K.neck[0] - 2, K.neck[1] - 1, 4, 1, p.col2);
      if (Math.abs(po.rot) < .5 && p.num != null) {
        const ds = String(p.num % 100).split('').map(Number), w = ds.length * 4 - 1, nx = Math.round(lerp(K.hip[0], K.neck[0], .55) - w / 2), ny = Math.round(lerp(K.hip[1], K.neck[1], .62) - 2);
        c.fillStyle = p.col2; ds.forEach((d, i) => { const gl = DIG[d]; for (let j = 0; j < 15; j++) if (gl[j] === '1') c.fillRect(nx + i * 4 + j % 3, ny + Math.floor(j / 3), 1, 1); });
      }
      if (po.ball && po.layer === 'mid') held();
      limb(K.hip, K.legs[1].knee, K.legs[1].foot, 3, p.skin); px(K.legs[1].foot[0] - 1, K.legs[1].foot[1] - 3, 3, 2, '#f8fafc'); drawShoe(K.legs[1].foot, f, p.shoe || '#fff');
      const high = ['set', 'over', 'hand'].includes(po.ball);
      if (po.ball && po.layer === 'front' && !high) held();
      limb(K.arms[1].sh, K.arms[1].elbow, K.arms[1].hand, 2, p.skin); px(K.arms[1].sh[0] - 1, K.arms[1].sh[1] - 1, 3, 2, p.col);
      if (po.flick) px(K.arms[1].hand[0] + f, K.arms[1].hand[1] - 1, 2, 2, p.skin);
      const hx = Math.round(K.head[0] - 3), hy = Math.round(K.head[1] - 3);
      px(hx - 1, hy - 1, 8, 8, OUT); px(hx, hy, 6, 6, p.skin); px(hx + (f > 0 ? 0 : 4), hy + 3, 2, 3, p.skinD);
      px(hx + (f > 0 ? 4 : 1), hy + 2, 1, 1, '#111'); px(hx + (f > 0 ? 5 : 0), hy + 4, 1, 1, shade(p.skin, -.4));
      drawHair(p, hx, hy, f);
      if (p.band) { px(hx - 1, hy + 1, 8, 1, p.band); px(hx + (f > 0 ? -2 : 7), hy + 1, 1, 3, p.band); }
      if (po.ball && high) held();
      if (po.stars) for (let i = 0; i < 3; i++) { const a = E.t * 6 + i * 2.1; px(K.head[0] + Math.cos(a) * 6, K.head[1] - 7 + Math.sin(a) * 2, 2, 2, '#fde047'); }
      if (o.me) { const by = Math.round(K.head[1] - 12 + Math.sin(E.t * 5) * 1.5), bx = Math.round(K.head[0]), col = o.fire ? '#f97316' : '#facc15'; px(bx - 3, by, 7, 1, col); px(bx - 2, by + 1, 5, 1, col); px(bx - 1, by + 2, 3, 1, col); px(bx, by + 3, 1, 1, col); }
      if (o.tag) text(c, o.tag, K.head[0], K.head[1] - 13, '#e2e8f0', 1, 'center', OUT);
      if (p.fire && Math.random() < .5) E.fx.push({ x: p.x + rnd(-4, 4), y: p.y - z - rnd(6, 28), vx: rnd(-8, 8), vy: -rnd(20, 40), life: .3, col: pick(['#f97316', '#facc15', '#ef4444']) });
      if (p.burst > 0 && Math.hypot(p.vx || 0, p.vy || 0) > 40) E.fx.push({ x: p.x - p.vx * .05 + rnd(-2, 2), y: p.y - rnd(4, 24), vx: -p.vx * .4, vy: 0, life: .15, col: 'rgba(255,255,255,.55)' });
      return K;
    }
    function reflection(p, o) { if (!V.def.reflect) return; c.save(); c.globalAlpha = .18; c.translate(0, p.y * 2 + 2); c.scale(1, -1); const fx = E.fx.length; player(p, {}); E.fx.length = fx; c.restore(); }
    function hoop(front) {
      const H0 = PIX.hoop, rx = H0.x, ry = H0.y - H0.z + Math.round(Math.sin(E.t * 60) * E.rim * 1.5), metal = V.def.backboard === 'metal';
      if (!front) {
        px(rx - 1, ry - 22, 3, 30, metal ? '#475569' : '#1f2937');
        if (!E.shatter) {
          if (metal) { px(rx - 20, ry - 23, 40, 21, '#0b0b12'); px(rx - 19, ry - 22, 38, 19, '#64748b'); px(rx - 8, ry - 12, 16, 10, '#e2e8f0'); px(rx - 7, ry - 11, 14, 8, '#64748b'); }
          else { px(rx - 20, ry - 23, 40, 21, '#e2e8f0'); c.fillStyle = 'rgba(186,230,253,.35)'; c.fillRect(rx - 19, ry - 22, 38, 19); px(rx - 7, ry - 11, 14, 1, '#f8fafc'); px(rx - 7, ry - 11, 1, 9, '#f8fafc'); px(rx + 6, ry - 11, 1, 9, '#f8fafc'); px(rx - 19, ry - 4, 38, 1, '#f97316'); }
        } else px(rx - 20, ry - 23, 40, 2, '#94a3b8');
        px(rx - 6, ry - 1, 12, 1, '#c2410c');
        return;
      }
      const Ln = 9 + E.net.swish * 5, sway = Math.sin(E.t * 18) * E.net.sway * 2, nc = V.def.net === 'chain' ? '#94a3b8' : '#f1f5f9';
      for (let i = 0; i < 5; i++) seg(rx - 6 + i * 3, ry + 1, rx - 3 + i * 1.5 + sway, ry + Ln, 1, nc);
      for (let j = 3; j < Ln; j += 3) { const w = lerp(12, 6, j / Ln); px(rx - w / 2 + sway * j / Ln, ry + j, w, 1, nc + '99'); }
      px(rx - 7, ry, 14, 2, '#ea580c'); px(rx - 7, ry + 1, 14, 1, '#9a3412');
    }
    function crowd() {
      const t = E.t, amp = 1 + E.hype * 2;
      V.crowd.forEach(d => {
        const bob = Math.max(0, Math.sin(t * (4 + E.hype * 6) + d.ph)) * amp * (E.hype > .5 || d.ph > 3 ? 1 : .4), x = Math.round(d.x), y = Math.round(d.y - bob);
        if (d.kind === 'stand') { px(x - 2, y - d.h + 5, 5, d.h - 8, d.c); px(x - 1, y - d.h + 1, 3, 4, d.skin); px(x - 2, y - 3, 2, 3, '#1f2937'); px(x + 1, y - 3, 2, 3, '#1f2937'); if (E.hype > .6) px(x - 3, y - d.h + 2 - bob, 1, 3, d.skin); }
        else { px(x - 1, y - 3, 4, 3, d.c); px(x, y - 5 - (d.h > 5 ? 1 : 0), 2, 2, d.skin); if (E.hype > .7 && d.ph > 4.5) px(x - 1, y - 8, 1, 3, d.skin); }
      });
      if (!V.street && V.crowd.length && Math.random() < .08 + E.hype * .25) { const d = pick(V.crowd); E.fx.push({ x: d.x, y: d.y - 5, vx: 0, vy: 0, life: .06, col: '#ffffff', flash: 1 }); }
      if (V.led) { const y = PIX.court.y0 - 6; px(0, y, V.W, 5, '#05070d'); const msg = (V.led.text + '   ').repeat(4), w = textWidth(msg); c.save(); c.beginPath(); c.rect(0, y, V.W, 5); c.clip(); text(c, msg + msg, -((t * 22) % w), y, (Math.floor(t * 2) % 2) ? V.led.a : (V.led.b || '#fff')); c.restore(); }
      V.flags.forEach(fl => { if (fl.puddle) return; const wv = Math.round(Math.sin(t * 3 + fl.x) * 1); px(fl.x, fl.y, 1, fl.h + 4, '#94a3b8'); px(fl.x + 1, fl.y + wv, fl.w, fl.h / 2, fl.a); px(fl.x + 1, fl.y + fl.h / 2 + wv, fl.w, fl.h / 2, fl.b); });
    }
    function lights() {
      const t = E.t;
      c.save(); c.globalCompositeOperation = 'lighter';
      V.lights.forEach(L => {
        if (L.kind === 'strings') { for (let i = 0; i < 2; i++) for (let x = 0; x < V.W; x += 8) { const y = 8 + i * 14 + Math.sin(x / V.W * Math.PI) * 10; const on = (Math.floor(t * 2 + x / 8) % 5) !== 0; c.fillStyle = on ? 'rgba(253,224,71,.9)' : 'rgba(253,224,71,.3)'; c.fillRect(x, y, 2, 2); if (on) { c.fillStyle = 'rgba(253,224,71,.12)'; c.fillRect(x - 2, y - 2, 6, 6); } } return; }
        if (L.kind === 'lasers') { const cols = ['255,60,60', '60,140,255', '250,204,21', '168,85,247']; for (let i = 0; i < 4; i++) { const a = Math.sin(t * .8 + i) * .9 + (i % 2 ? .6 : -.6), x0 = i % 2 ? V.W : 0; c.strokeStyle = `rgba(${cols[i]},.35)`; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + Math.sin(a) * 400 * (i % 2 ? -1 : 1), Math.cos(a) * 400); c.stroke(); } return; }
        const x = L.sweep ? L.x + Math.sin(t * .5 * L.sweep) * 80 : L.x, fl = V.street ? .85 + Math.random() * .15 : 1;
        const gr = c.createRadialGradient(x, L.y, 2, x, L.y + 60, L.r); gr.addColorStop(0, `rgba(${L.col},${.22 * fl})`); gr.addColorStop(1, `rgba(${L.col},0)`);
        c.fillStyle = gr; c.beginPath(); c.moveTo(x - 4, L.y); c.lineTo(x + L.r * .55, L.y + L.r * 1.4); c.lineTo(x - L.r * .55, L.y + L.r * 1.4); c.fill();
      });
      c.restore();
    }
    function weather(dt) {
      if (V.rain) { c.fillStyle = 'rgba(186,230,253,.55)'; V.rain.forEach(r => { r.y += r.s * dt; r.x -= r.s * .25 * dt; if (r.y > V.H) { r.y = -6; r.x = Math.random() * (V.W + 40); if (Math.random() < .5) E.fx.push({ x: r.x - 20, y: PIX.court.y0 + Math.random() * 160, vx: 0, vy: -10, life: .15, col: 'rgba(186,230,253,.7)', flash: 1 }); } c.fillRect(Math.round(r.x), Math.round(r.y), 1, 4); }); }
      if (V.def.theme === 'finals' || V.def.theme === 'allstar') { if (Math.random() < .3 + E.hype * .5) E.fx.push({ x: Math.random() * V.W, y: -4, vx: rnd(-10, 10), vy: rnd(20, 40), life: 3, col: pick(['#d4a017', '#facc15', '#f8fafc', V.c0, V.c1]), conf: 1 }); }
    }
    function fx(dt) {
      E.fx.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; if (!f.conf) f.vy += 120 * dt; f.life -= dt; }); E.fx = E.fx.filter(f => f.life > 0 && f.y < V.H + 10);
      E.glass.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 160 * dt; f.life -= dt; }); E.glass = E.glass.filter(f => f.life > 0);
      E.fx.forEach(f => px(f.x, f.y, f.flash ? 1 : 2, f.flash ? 1 : f.conf ? 1 : 2, f.col)); E.glass.forEach(f => px(f.x, f.y, 2, 1, '#bae6fd'));
      E.net.swish = Math.max(0, E.net.swish - dt * 2.2); E.net.sway *= Math.pow(.05, dt); E.rim *= Math.pow(.01, dt); E.hype = Math.max(.25, E.hype - dt * .06);
    }
    function burst(x, y, col, n = 14, sp = 60) { for (let i = 0; i < n; i++) E.fx.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.3, sp * .2), life: rnd(.4, .8), col }); }
    return { E, V, c, player, reflection, ball, freeBall, hoop, crowd, lights, weather, fx, burst, text: (s, x, y, col, sc, al, ol) => text(c, s, x, y, col, sc, al, ol), px, skeleton };
  }

  /* sprite fields for a player from a look + team colors */
  function sprite(look, colors, extra = {}) {
    const L = look || {}, skin = L.skin || '#a86b43', col = colors[0] || '#f97316';
    return Object.assign({ skin, skinD: shade(skin, -.28), hair: L.hair || 'fade', hairC: L.hairColor || '#111', band: L.headband || '', shoe: L.shoeColor || '#f8fafc',
      col, colD: shade(col, -.32), colL: shade(col, .18), col2: colors[1] || '#ffffff', num: L.num != null ? L.num : 0,
      x: 192, y: 160, z: 0, vx: 0, vy: 0, face: 1, phase: Math.random() * 6, dribT: Math.random(), act: null }, extra);
  }
  /* readable ink color on a background */
  const ink = bg => lum(bg) > .6 ? '#111827' : '#ffffff';
  /* ambient sound for a venue (called every few seconds) */
  function ambient(V, hype = .3) { const a = V && V.def.ambient; if (typeof SFX === 'undefined') return; if (a && SFX.has && SFX.has('amb_' + a)) SFX.play('amb_' + a, hype); else SFX.play('crowd', .4 + hype * .5); }
  /* a still frame of a venue (cutscenes, thumbnails) */
  function snapshot(id, home, away) {
    const V = venue(id, home, away, 384), cv = document.createElement('canvas'); cv.width = 384; cv.height = 216; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(V.bg, 0, 0); const R = renderer(g, V); R.E.t = 1; R.crowd(); R.hoop(false); R.hoop(true); R.lights(); g.drawImage(V.vg, 0, 0); return cv;
  }
  /* replace every inline <svg> inside an element with a pixel-art canvas (scale = pixels per SVG unit) */
  function pixelateEl(el, scale = .25, cls = 'pxc') {
    return Promise.all([...el.querySelectorAll('svg')].map(svg => {
      const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number), w = Math.max(8, Math.round(vb[2] * scale)), h = Math.max(8, Math.round(vb[3] * scale));
      return pixelate(svg.outerHTML, w, h).then(cv => { const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; c2.getContext('2d').drawImage(cv, 0, 0); c2.className = cls; svg.replaceWith(c2); });
    }));
  }
  return { venue, renderer, sprite, text, textWidth, pixelate, pixelateEl, snapshot, shade, lum, ink, drawLandmark, ambient };
})();
