/* =====================================================================
   ART.JS — all original procedural art (SVG strings).
   Avatars, team logos, icons/badges, story scene backgrounds.
   No external images: nothing can ever show as "broken".
   ===================================================================== */
const Art = (() => {
  let _uid = 0;
  const uid = p => `${p}${++_uid}`;

  /* ---------- color helpers ---------- */
  function shade(hex, amt) { // amt -1..1 (negative = darker)
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { let x = hashStr(seed) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; }

  /* ---------- avatar option lists (used by the avatar builder) ---------- */
  const SKINS = ['#f6d7c3', '#eac4a6', '#d9a77e', '#c68a5c', '#a86b43', '#8a5233', '#6b3d25', '#4a2a19'];
  const HAIRS = ['bald', 'buzz', 'fade', 'flattop', 'afro', 'curly', 'braids', 'dreads', 'mohawk', 'long', 'bun', 'ponytail'];
  const HAIR_COLORS = ['#0f0d0c', '#3b2416', '#6b4423', '#a0703a', '#d4a85a', '#b83a1c', '#9ca3af', '#f5f5f4'];
  const BEARDS = ['none', 'stubble', 'mustache', 'goatee', 'chinstrap', 'full'];
  const ACCENTS = ['', '#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#111827'];
  const SHOES = ['low', 'mid', 'high'];

  const DEFAULT_LOOK = {
    skin: SKINS[4], hair: 'fade', hairColor: HAIR_COLORS[0], beard: 'none', headband: '', sleeve: '', wrist: '',
    goggles: false, chain: false, jersey: '#f97316', trim: '#111827', num: 0, shoes: 'mid', shoeColor: '#ffffff',
    outfit: 'jersey', expr: 'neutral', build: 'normal', femme: false,
  };

  /* ---------- AVATAR ----------
     look: see DEFAULT_LOOK. opts.mode: 'full' | 'portrait' | 'bust'. */
  function avatar(lookIn, opts = {}) {
    const L = Object.assign({}, DEFAULT_LOOK, lookIn || {});
    const mode = opts.mode || 'full';
    const skin = L.skin, skinD = shade(skin, -0.18), skinL = shade(skin, 0.12);
    const hc = L.hairColor;
    const bw = L.build === 'strong' ? 8 : L.build === 'lean' ? -5 : 0; // shoulder width delta
    const jc = L.jersey, jt = L.trim;
    const out = [];

    // ---------- BACK HAIR (behind head) ----------
    if (L.hair === 'afro') out.push(`<ellipse cx="100" cy="46" rx="42" ry="35" fill="${hc}"/>`);
    if (L.hair === 'long') out.push(`<path d="M70 50 Q66 100 74 128 L126 128 Q134 100 130 50 Z" fill="${hc}"/>`);
    if (L.hair === 'dreads') for (let i = 0; i < 9; i++) { const x = 74 + i * 6.5; out.push(`<rect x="${x}" y="50" width="5.5" height="${52 + (i % 3) * 8}" rx="2.7" fill="${hc}"/>`); }
    if (L.hair === 'braids') for (let i = 0; i < 6; i++) { const x = 80 + i * 8; out.push(`<rect x="${x}" y="60" width="4" height="${44 + (i % 2) * 6}" rx="2" fill="${hc}"/>`); }
    if (L.hair === 'ponytail') out.push(`<path d="M118 40 Q146 52 138 96 Q130 70 120 56 Z" fill="${hc}"/>`);

    // ---------- BODY (full / bust) ----------
    const bodyFull = mode !== 'portrait' || true; // always draw torso; portrait crops it
    if (bodyFull) {
      const sw = 32 + bw; // half shoulder width
      // arms (skin), drawn behind torso
      const arm = (side) => {
        const s = side, cx = 100 + s * (sw + 2);
        return `<path d="M${100 + s * (sw - 6)} 108 Q${cx + s * 14} 112 ${cx + s * 14} 150 L${cx + s * 12} 196 Q${cx + s * 8} 204 ${cx + s * 4} 196 L${cx + s * 4} 154 Q${cx} 134 ${100 + s * (sw - 8)} 126 Z" fill="${skin}"/>`;
      };
      if (L.outfit === 'jersey' || L.outfit === 'tank') { out.push(arm(-1), arm(1)); }
      // neck
      out.push(`<rect x="90" y="84" width="20" height="24" rx="6" fill="${skinD}"/>`);
      // torso by outfit
      const torso = `M${100 - sw} 106 Q${100 - sw - 6} 150 ${100 - sw + 2} 198 L${100 + sw - 2} 198 Q${100 + sw + 6} 150 ${100 + sw} 106`;
      if (L.outfit === 'jersey' || L.outfit === 'tank') {
        out.push(`<path d="${torso} L114 104 Q100 124 86 104 Z" fill="${jc}"/>`);
        out.push(`<path d="M86 104 Q100 124 114 104" fill="none" stroke="${jt}" stroke-width="4"/>`);
        out.push(`<path d="M${100 - sw} 106 Q${100 - sw + 10} 130 ${100 - sw + 4} 150" fill="none" stroke="${jt}" stroke-width="3"/>`);
        out.push(`<path d="M${100 + sw} 106 Q${100 + sw - 10} 130 ${100 + sw - 4} 150" fill="none" stroke="${jt}" stroke-width="3"/>`);
        out.push(`<text x="100" y="170" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="38" fill="${jt}" stroke="${shade(jc, 0.5)}" stroke-width="1">${L.num}</text>`);
      } else if (L.outfit === 'hoodie') {
        out.push(`<path d="M${100 - sw - 14} 116 Q${100 - sw - 20} 160 ${100 - sw - 16} 200 L${100 + sw + 16} 200 Q${100 + sw + 20} 160 ${100 + sw + 14} 116 Q${100 + sw} 104 112 102 L100 112 L88 102 Q${100 - sw} 104 ${100 - sw - 14} 116 Z" fill="${jc}"/>`);
        out.push(`<path d="M78 104 Q100 124 122 104 Q118 96 100 98 Q82 96 78 104 Z" fill="${shade(jc, -0.25)}"/>`);
        out.push(`<line x1="95" y1="114" x2="93" y2="138" stroke="${jt}" stroke-width="2"/><line x1="105" y1="114" x2="107" y2="138" stroke="${jt}" stroke-width="2"/>`);
        out.push(`<rect x="80" y="158" width="40" height="18" rx="5" fill="${shade(jc, -0.15)}"/>`);
      } else if (L.outfit === 'suit') {
        out.push(`<path d="M${100 - sw - 12} 114 Q${100 - sw - 18} 160 ${100 - sw - 14} 200 L${100 + sw + 14} 200 Q${100 + sw + 18} 160 ${100 + sw + 12} 114 Q${100 + sw} 104 112 102 L100 110 L88 102 Q${100 - sw} 104 ${100 - sw - 12} 114 Z" fill="${jc}"/>`);
        out.push(`<path d="M88 102 L100 150 L112 102 Z" fill="#f8fafc"/>`);
        out.push(`<path d="M97 110 L103 110 L105 140 L100 148 L95 140 Z" fill="${jt}"/>`);
        out.push(`<path d="M88 102 L96 132 L84 120 Z M112 102 L104 132 L116 120 Z" fill="${shade(jc, -0.3)}"/>`);
      } else { // tee / tracksuit
        out.push(`<path d="M${100 - sw - 16} 112 L${100 - sw - 22} 140 L${100 - sw - 8} 144 L${100 - sw - 2} 130 L${100 - sw} 198 L${100 + sw} 198 L${100 + sw + 2} 130 L${100 + sw + 8} 144 L${100 + sw + 22} 140 L${100 + sw + 16} 112 Q${100 + sw} 102 112 102 Q100 112 88 102 Q${100 - sw} 102 ${100 - sw - 16} 112 Z" fill="${jc}"/>`);
        out.push(`<path d="M88 102 Q100 112 112 102" fill="none" stroke="${jt}" stroke-width="3"/>`);
        if (L.outfit === 'tracksuit') out.push(`<line x1="100" y1="108" x2="100" y2="198" stroke="${jt}" stroke-width="2"/><path d="M${100 - sw - 18} 120 L${100 - sw - 6} 140" stroke="${jt}" stroke-width="3"/><path d="M${100 + sw + 18} 120 L${100 + sw + 6} 140" stroke="${jt}" stroke-width="3"/>`);
        // forearms
        out.push(`<path d="M${100 - sw - 20} 142 L${100 - sw - 16} 196 L${100 - sw - 6} 196 L${100 - sw - 8} 144 Z" fill="${skin}"/><path d="M${100 + sw + 20} 142 L${100 + sw + 16} 196 L${100 + sw + 6} 196 L${100 + sw + 8} 144 Z" fill="${skin}"/>`);
      }
      // arm sleeve + wristbands
      if (L.sleeve && (L.outfit === 'jersey' || L.outfit === 'tank')) out.push(`<path d="M${100 + sw + 6} 122 Q${100 + sw + 16} 130 ${100 + sw + 16} 150 L${100 + sw + 14} 190 L${100 + sw + 6} 190 L${100 + sw + 5} 152 Q${100 + sw + 2} 136 ${100 + sw - 2} 128 Z" fill="${L.sleeve}" opacity=".95"/>`);
      if (L.wrist) out.push(`<rect x="${100 - sw - 18}" y="184" width="14" height="8" rx="2" fill="${L.wrist}"/><rect x="${100 + sw + 4}" y="184" width="14" height="8" rx="2" fill="${L.wrist}"/>`);
      // hands
      out.push(`<circle cx="${100 - sw - 11}" cy="200" r="7" fill="${skin}"/><circle cx="${100 + sw + 11}" cy="200" r="7" fill="${skin}"/>`);
      // shorts / pants
      const sc = (L.outfit === 'suit') ? shade(jc, -0.1) : (L.outfit === 'jersey' || L.outfit === 'tank') ? jc : '#1f2937';
      if (L.outfit === 'suit' || L.outfit === 'tracksuit' || L.outfit === 'hoodie') {
        out.push(`<path d="M68 196 L132 196 L130 296 L106 296 L100 230 L94 296 L70 296 Z" fill="${L.outfit === 'suit' ? shade(jc, -0.1) : '#1f2937'}"/>`);
      } else {
        out.push(`<path d="M66 192 L134 192 L138 250 L104 252 L100 232 L96 252 L62 250 Z" fill="${sc}"/>`);
        out.push(`<path d="M62 244 L96 246 M104 246 L138 244" stroke="${jt}" stroke-width="3"/>`);
        // legs + socks
        out.push(`<rect x="70" y="250" width="20" height="40" rx="6" fill="${skin}"/><rect x="110" y="250" width="20" height="40" rx="6" fill="${skin}"/>`);
        out.push(`<rect x="70" y="280" width="20" height="14" fill="#f8fafc"/><rect x="110" y="280" width="20" height="14" fill="#f8fafc"/>`);
      }
      // shoes
      const sh = L.shoes === 'high' ? 16 : L.shoes === 'mid' ? 11 : 7;
      const shc = L.shoeColor, sho = shade(shc, -0.35);
      [[66, 1], [106, 1]].forEach(([x]) => {
        out.push(`<path d="M${x} ${304 - sh} L${x + 26} ${304 - sh} Q${x + 34} 300 ${x + 36} 306 L${x + 36} 310 L${x - 2} 310 L${x - 2} ${306 - sh} Z" fill="${shc}"/>`);
        out.push(`<rect x="${x - 2}" y="307" width="38" height="4" rx="2" fill="${sho}"/>`);
        out.push(`<path d="M${x + 6} ${306 - sh / 2} Q${x + 16} ${302 - sh / 2} ${x + 28} ${306 - sh / 3}" fill="none" stroke="${L.trim}" stroke-width="2.5"/>`);
      });
    }

    // ---------- HEAD ----------
    out.push(`<ellipse cx="75" cy="66" rx="5" ry="8" fill="${skinD}"/><ellipse cx="125" cy="66" rx="5" ry="8" fill="${skinD}"/>`);
    const jaw = L.femme ? 'M75 58 Q75 90 100 94 Q125 90 125 58 Q125 30 100 30 Q75 30 75 58 Z' : 'M75 58 Q74 88 92 94 L108 94 Q126 88 125 58 Q125 30 100 30 Q75 30 75 58 Z';
    out.push(`<path d="${jaw}" fill="${skin}"/>`);
    out.push(`<path d="M80 80 Q100 98 120 80 Q118 92 108 94 L92 94 Q82 92 80 80 Z" fill="${skinD}" opacity=".35"/>`);
    // beard
    if (!L.femme) {
      if (L.beard === 'stubble') out.push(`<path d="${jaw}" fill="${hc}" opacity=".18"/>`);
      if (L.beard === 'full') out.push(`<path d="M76 62 Q76 92 94 97 L106 97 Q124 92 124 62 L118 66 Q116 82 100 84 Q84 82 82 66 Z" fill="${hc}"/>`);
      if (L.beard === 'chinstrap') out.push(`<path d="M76 62 Q76 92 94 97 L106 97 Q124 92 124 62 L121 64 Q120 88 100 91 Q80 88 79 64 Z" fill="${hc}"/>`);
      if (L.beard === 'goatee') out.push(`<path d="M92 82 Q100 79 108 82 L106 94 Q100 97 94 94 Z" fill="${hc}"/>`);
      if (L.beard === 'mustache' || L.beard === 'goatee' || L.beard === 'full') out.push(`<path d="M89 77 Q100 72 111 77 Q100 76 89 77 Z" fill="${hc}" stroke="${hc}" stroke-width="3" stroke-linejoin="round"/>`);
    }
    // eyes / brows by expression
    const ex = L.expr;
    const browY = ex === 'fierce' ? 54 : ex === 'sad' ? 52 : 52;
    const bl = ex === 'fierce' ? `M84 ${browY - 3} L96 ${browY + 2}` : ex === 'sad' ? `M84 ${browY + 2} L96 ${browY - 2}` : `M84 ${browY} Q90 ${browY - 3} 96 ${browY}`;
    const br = ex === 'fierce' ? `M116 ${browY - 3} L104 ${browY + 2}` : ex === 'sad' ? `M116 ${browY + 2} L104 ${browY - 2}` : `M116 ${browY} Q110 ${browY - 3} 104 ${browY}`;
    out.push(`<path d="${bl} M${br.slice(1)}" stroke="${shade(hc, 0.05)}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`);
    out.push(`<ellipse cx="90" cy="62" rx="5" ry="${ex === 'smile' ? 3.2 : 3.8}" fill="#fff"/><ellipse cx="110" cy="62" rx="5" ry="${ex === 'smile' ? 3.2 : 3.8}" fill="#fff"/>`);
    out.push(`<circle cx="91" cy="62" r="2.6" fill="#1c1917"/><circle cx="111" cy="62" r="2.6" fill="#1c1917"/>`);
    if (L.femme) out.push(`<path d="M84 59 L86 57 M116 59 L114 57" stroke="#1c1917" stroke-width="1.6"/>`);
    // nose
    out.push(`<path d="M100 64 Q97 74 95 76 Q100 79 105 76" fill="none" stroke="${skinD}" stroke-width="2.2" stroke-linecap="round"/>`);
    // mouth
    const mouth = ex === 'smile' ? `<path d="M90 83 Q100 91 110 83 Q100 87 90 83 Z" fill="#7f1d1d" stroke="#7f1d1d" stroke-width="1.5" stroke-linejoin="round"/>`
      : ex === 'fierce' ? `<path d="M91 85 Q100 82 109 85" stroke="#5b1a1a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : ex === 'sad' ? `<path d="M92 87 Q100 82 108 87" stroke="#5b1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : `<path d="M92 85 Q100 88 108 85" stroke="#5b1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    out.push(mouth);
    if (L.femme) out.push(`<path d="M93 85 Q100 89 107 85" stroke="#b4535a" stroke-width="2.5" fill="none" opacity=".6"/>`);

    // ---------- FRONT HAIR ----------
    const cap = (top, side) => `<path d="M75 ${side} Q74 ${top} 100 ${top} Q126 ${top} 125 ${side} Q120 ${top + 16} 100 ${top + 14} Q80 ${top + 16} 75 ${side} Z" fill="${hc}"/>`;
    switch (L.hair) {
      case 'buzz': out.push(cap(30, 56).replace('<path', '<path opacity=".85"')); break;
      case 'fade': out.push(cap(25, 54)); out.push(`<path d="M75 56 L75 66 M125 56 L125 66" stroke="${hc}" stroke-width="3" opacity=".4"/>`); break;
      case 'flattop': out.push(`<path d="M76 58 L76 22 L124 22 L124 58 Q120 40 100 40 Q80 40 76 58 Z" fill="${hc}"/>`); break;
      case 'afro': out.push(`<path d="M74 58 Q70 26 100 24 Q130 26 126 58 Q120 40 100 40 Q80 40 74 58 Z" fill="${hc}"/>`); break;
      case 'curly': out.push(cap(28, 54)); for (let i = 0; i < 7; i++) out.push(`<circle cx="${78 + i * 7.3}" cy="${32 + (i % 2) * 4}" r="7" fill="${hc}"/>`); break;
      case 'braids': out.push(cap(29, 56)); for (let i = 0; i < 5; i++) out.push(`<path d="M${84 + i * 8} 31 L${82 + i * 9} 46" stroke="${shade(hc, 0.2)}" stroke-width="2"/>`); break;
      case 'dreads': out.push(cap(26, 56)); for (let i = 0; i < 6; i++) out.push(`<rect x="${78 + i * 8}" y="28" width="6" height="18" rx="3" fill="${shade(hc, 0.1)}"/>`); break;
      case 'mohawk': out.push(cap(32, 56).replace('<path', '<path opacity=".35"')); out.push(`<path d="M92 44 Q92 12 100 10 Q108 12 108 44 Q100 40 92 44 Z" fill="${hc}"/>`); break;
      case 'long': out.push(`<path d="M74 66 Q70 26 100 26 Q130 26 126 66 Q122 40 106 38 Q98 46 80 46 Q76 52 74 66 Z" fill="${hc}"/>`); break;
      case 'bun': out.push(cap(28, 56)); out.push(`<circle cx="100" cy="20" r="12" fill="${hc}"/>`); break;
      case 'ponytail': out.push(cap(27, 56)); break;
      default: out.push(`<ellipse cx="92" cy="38" rx="9" ry="4" fill="#fff" opacity=".18"/>`); // bald shine
    }
    // headband
    if (L.headband) out.push(`<path d="M75 46 Q100 36 125 46 L125 54 Q100 44 75 54 Z" fill="${L.headband}"/><path d="M125 48 L134 60 L128 62 Z" fill="${L.headband}"/>`);
    // goggles
    if (L.goggles) out.push(`<path d="M75 60 L125 60" stroke="#111" stroke-width="3"/><circle cx="90" cy="62" r="9" fill="#93c5fd" opacity=".35" stroke="#111827" stroke-width="3"/><circle cx="110" cy="62" r="9" fill="#93c5fd" opacity=".35" stroke="#111827" stroke-width="3"/>`);
    // chain
    if (L.chain) out.push(`<path d="M86 104 Q100 140 114 104" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="3 1.5"/><circle cx="100" cy="128" r="5" fill="#facc15" stroke="#a16207"/>`);

    const vb = mode === 'portrait' ? '58 8 84 104' : mode === 'bust' ? '40 4 120 196' : '20 0 160 320';
    const cls = opts.cls ? ` class="${opts.cls}"` : '';
    return `<svg${cls} viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${out.join('')}</svg>`;
  }

  /* Random but stable look for NPCs (by name). */
  function lookFromSeed(seed, over = {}) {
    const r = seeded(seed);
    const pick = a => a[Math.floor(r() * a.length)];
    return Object.assign({
      skin: pick(SKINS), hair: pick(['buzz', 'fade', 'afro', 'curly', 'braids', 'dreads', 'flattop', 'bald']), hairColor: pick(HAIR_COLORS.slice(0, 5)),
      beard: pick(BEARDS), jersey: pick(['#2563eb', '#dc2626', '#16a34a', '#7c3aed', '#0f172a', '#f59e0b']), trim: '#ffffff', num: Math.floor(r() * 55),
      outfit: 'jersey', expr: 'neutral', headband: r() < 0.15 ? pick(ACCENTS.slice(1)) : '',
    }, over);
  }

  /* ---------- ICON GLYPHS (100x100 space). c = main color, d = detail color ---------- */
  function starPts(cx, cy, R, r, n = 5) { const p = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); } return p.join(' '); }
  function gearPath(cx, cy, R, r, n) { let d = ''; for (let i = 0; i < n * 2; i++) { const a0 = i * Math.PI / n, a1 = (i + 1) * Math.PI / n, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a0) * rr).toFixed(1) + ' ' + (cy + Math.sin(a0) * rr).toFixed(1) + 'L' + (cx + Math.cos(a1) * rr).toFixed(1) + ' ' + (cy + Math.sin(a1) * rr).toFixed(1); } return d + 'Z'; }
  const GLYPHS = {
    ball: (c, d) => `<circle cx="50" cy="50" r="26" fill="${c}"/><path d="M24 50 H76 M50 24 V76 M31 31 Q44 50 31 69 M69 31 Q56 50 69 69" stroke="${d}" stroke-width="3" fill="none"/>`,
    crown: (c, d) => `<path d="M24 66 L20 34 L37 48 L50 26 L63 48 L80 34 L76 66 Z" fill="${c}"/><rect x="24" y="68" width="52" height="7" rx="2" fill="${c}"/><circle cx="50" cy="52" r="5" fill="${d}"/>`,
    gear: (c, d) => `<path d="${gearPath(50, 50, 30, 23, 10)}" fill="${c}"/><circle cx="50" cy="50" r="10" fill="${d}"/>`,
    bolt: (c) => `<path d="M56 16 L30 54 L47 54 L40 84 L70 42 L53 42 L62 16 Z" fill="${c}"/>`,
    wing: (c, d) => `<path d="M18 64 Q26 30 82 22 Q68 32 74 36 Q60 40 68 46 Q52 50 58 56 Q40 60 18 64 Z" fill="${c}"/><circle cx="30" cy="58" r="3" fill="${d}"/>`,
    flame: (c, d) => `<path d="M50 14 Q64 32 62 44 Q70 38 68 28 Q84 48 76 66 Q66 84 50 84 Q32 84 25 66 Q18 48 34 34 Q34 46 41 49 Q36 30 50 14 Z" fill="${c}"/><path d="M50 50 Q60 60 56 72 Q50 80 44 72 Q40 62 50 50 Z" fill="${d}"/>`,
    star: (c) => `<polygon points="${starPts(50, 52, 32, 13)}" fill="${c}"/>`,
    stars: (c) => [0, 1, 2, 3, 4].map(i => `<polygon points="${starPts(50 + Math.cos(-Math.PI / 2 + i * 1.2566) * 22, 52 + Math.sin(-Math.PI / 2 + i * 1.2566) * 22, 10, 4)}" fill="${c}"/>`).join(''),
    horns: (c, d) => `<path d="M14 30 Q20 56 40 56 L60 56 Q80 56 86 30 Q74 46 60 44 L40 44 Q26 46 14 30 Z" fill="${c}"/><path d="M38 52 L62 52 L58 80 Q50 86 42 80 Z" fill="${c}"/><circle cx="44" cy="62" r="3" fill="${d}"/><circle cx="56" cy="62" r="3" fill="${d}"/>`,
    claw: (c) => `<path d="M26 22 Q36 50 30 80 L38 80 Q44 50 34 22 Z M46 18 Q56 48 50 82 L58 82 Q64 48 54 18 Z M66 22 Q76 50 70 80 L78 80 Q84 50 74 22 Z" fill="${c}"/>`,
    paw: (c) => `<ellipse cx="50" cy="62" rx="18" ry="15" fill="${c}"/><circle cx="30" cy="42" r="8" fill="${c}"/><circle cx="43" cy="31" r="8" fill="${c}"/><circle cx="57" cy="31" r="8" fill="${c}"/><circle cx="70" cy="42" r="8" fill="${c}"/>`,
    sun: (c, d) => `<circle cx="50" cy="50" r="17" fill="${c}"/>` + [...Array(12)].map((_, i) => { const a = i * Math.PI / 6; return `<line x1="${50 + Math.cos(a) * 22}" y1="${50 + Math.sin(a) * 22}" x2="${50 + Math.cos(a) * 33}" y2="${50 + Math.sin(a) * 33}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`; }).join('') + `<circle cx="50" cy="50" r="8" fill="${d}"/>`,
    mountain: (c, d) => `<path d="M12 78 L38 34 L50 52 L62 30 L88 78 Z" fill="${c}"/><path d="M62 30 L70 44 L62 42 L56 46 Z M38 34 L44 44 L36 42 Z" fill="${d}"/>`,
    note: (c) => `<path d="M40 24 L74 18 L74 62 A10 8 0 1 1 66 54 L66 32 L48 36 L48 70 A10 8 0 1 1 40 62 Z" fill="${c}"/>`,
    rocket: (c, d) => `<path d="M50 12 Q68 30 64 62 L36 62 Q32 30 50 12 Z" fill="${c}"/><circle cx="50" cy="38" r="6" fill="${d}"/><path d="M36 52 L24 70 L38 64 Z M64 52 L76 70 L62 64 Z" fill="${c}"/><path d="M42 64 L50 86 L58 64 Z" fill="${d}"/>`,
    antler: (c) => `<path d="M48 84 L48 50 Q30 46 24 24 L30 24 Q34 38 44 42 Q36 30 38 16 L44 18 Q42 32 48 40 L48 30 L52 30 L52 40 Q58 32 56 18 L62 16 Q64 30 56 42 Q66 38 70 24 L76 24 Q70 46 52 50 L52 84 Z" fill="${c}"/>`,
    clover: (c) => `<circle cx="38" cy="40" r="13" fill="${c}"/><circle cx="62" cy="40" r="13" fill="${c}"/><circle cx="50" cy="60" r="13" fill="${c}"/><circle cx="50" cy="46" r="10" fill="${c}"/><path d="M50 64 Q54 78 64 84" stroke="${c}" stroke-width="5" fill="none"/>`,
    sail: (c, d) => `<path d="M48 16 L48 66 L18 66 Z" fill="${c}"/><path d="M54 24 L54 66 L80 66 Z" fill="${c}"/><path d="M14 72 L86 72 L76 84 L24 84 Z" fill="${d}"/>`,
    hat: (c, d) => `<path d="M50 10 L72 70 L28 70 Z" fill="${c}"/><ellipse cx="50" cy="72" rx="34" ry="8" fill="${c}"/><polygon points="${starPts(52, 44, 8, 3)}" fill="${d}"/>`,
    stinger: (c, d) => `<ellipse cx="50" cy="48" rx="20" ry="26" fill="${c}"/><path d="M32 40 H68 M30 52 H70 M34 64 H66" stroke="${d}" stroke-width="5"/><path d="M44 72 L50 90 L56 72 Z" fill="${c}"/>`,
    tree: (c, d) => `<path d="M50 12 L72 42 L60 42 L78 64 L22 64 L40 42 L28 42 Z" fill="${c}"/><rect x="45" y="64" width="10" height="18" fill="${d}"/>`,
    pinwheel: (c) => [0, 1, 2, 3, 4].map(i => `<rect x="47" y="14" width="6" height="36" rx="3" fill="${c}" transform="rotate(${i * 72} 50 50)"/>`).join(''),
    rowel: (c, d) => `<polygon points="${starPts(50, 50, 34, 10, 8)}" fill="${c}"/><circle cx="50" cy="50" r="8" fill="${d}"/>`,
    bridge: (c) => `<path d="M10 64 H90" stroke="${c}" stroke-width="5"/><path d="M28 20 V70 M72 20 V70" stroke="${c}" stroke-width="6"/><path d="M10 40 Q28 64 50 64 Q72 64 90 40 M28 20 Q40 60 50 64 Q60 60 72 20" stroke="${c}" stroke-width="3" fill="none"/>`,
    bird: (c, d) => `<path d="M20 56 Q30 30 56 30 Q72 30 78 40 L92 44 L78 50 Q74 70 50 72 Q34 72 20 56 Z" fill="${c}"/><circle cx="66" cy="40" r="3" fill="${d}"/>`,
    chevrons: (c) => `<path d="M22 24 L48 50 L22 76 L34 76 L60 50 L34 24 Z M48 24 L74 50 L48 76 L60 76 L86 50 L60 24 Z" fill="${c}"/>`,
    sword: (c, d) => `<path d="M48 10 L52 10 L54 62 L46 62 Z" fill="${c}"/><rect x="34" y="60" width="32" height="6" rx="2" fill="${d}"/><rect x="47" y="66" width="6" height="16" fill="${d}"/><circle cx="50" cy="86" r="4" fill="${d}"/>`,
    ghost: (c, d) => `<path d="M24 86 V44 Q24 16 50 16 Q76 16 76 44 V86 L67 77 L58 86 L50 77 L42 86 L33 77 Z" fill="${c}"/><circle cx="40" cy="44" r="6" fill="${d}"/><circle cx="60" cy="44" r="6" fill="${d}"/>`,
    mirror: (c, d) => `<path d="M14 50 L36 22 L36 78 Z M86 50 L64 22 L64 78 Z" fill="${c}"/><rect x="47" y="14" width="6" height="72" rx="3" fill="${c}"/><path d="M22 50 L32 38 L32 62 Z" fill="${d}"/>`,
    // ---- badge / UI glyphs ----
    snow: (c) => [0, 60, 120].map(a => `<g transform="rotate(${a} 50 50)"><line x1="50" y1="16" x2="50" y2="84" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M40 24 L50 32 L60 24 M40 76 L50 68 L60 76" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`).join(''),
    dunk: (c) => `<rect x="24" y="18" width="52" height="8" rx="2" fill="${c}"/><ellipse cx="50" cy="34" rx="16" ry="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M36 36 L42 52 M64 36 L58 52 M50 38 V52" stroke="${c}" stroke-width="3"/><circle cx="50" cy="72" r="13" fill="${c}"/>`,
    target: (c) => `<circle cx="50" cy="50" r="32" fill="none" stroke="${c}" stroke-width="6"/><circle cx="50" cy="50" r="18" fill="none" stroke="${c}" stroke-width="6"/><circle cx="50" cy="50" r="6" fill="${c}"/>`,
    eye: (c) => `<path d="M10 50 Q50 10 90 50 Q50 90 10 50 Z" fill="none" stroke="${c}" stroke-width="6"/><circle cx="50" cy="50" r="13" fill="${c}"/>`,
    zigzag: (c) => `<path d="M18 28 L42 48 L30 56 L60 80 M60 80 L48 80 M60 80 L60 68" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="30" r="10" fill="${c}"/>`,
    pass: (c) => `<circle cx="24" cy="50" r="10" fill="${c}"/><path d="M38 50 H78 M66 36 L80 50 L66 64" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    lock: (c) => `<rect x="24" y="44" width="52" height="40" rx="6" fill="${c}"/><path d="M34 46 V34 Q34 16 50 16 Q66 16 66 34 V46" stroke="${c}" stroke-width="7" fill="none"/>`,
    hand: (c) => `<path d="M30 86 L28 50 Q28 44 34 44 L34 24 Q34 18 40 18 Q46 18 46 24 L46 18 Q46 12 52 12 Q58 12 58 18 L58 22 Q58 16 64 16 Q70 16 70 24 L70 44 Q76 42 78 48 L72 86 Z" fill="${c}"/>`,
    board: (c) => `<rect x="18" y="16" width="64" height="44" rx="3" fill="none" stroke="${c}" stroke-width="6"/><rect x="38" y="34" width="24" height="16" fill="none" stroke="${c}" stroke-width="4"/><path d="M36 62 H64 L58 82 H42 Z" fill="${c}"/>`,
    fist: (c) => `<rect x="24" y="30" width="52" height="34" rx="10" fill="${c}"/><rect x="30" y="62" width="40" height="22" rx="4" fill="${c}"/><path d="M37 30 V46 M50 30 V46 M63 30 V46" stroke="#0007" stroke-width="3"/>`,
    anchor: (c) => `<circle cx="50" cy="20" r="7" fill="none" stroke="${c}" stroke-width="5"/><path d="M50 27 V84 M32 40 H68 M20 60 Q24 84 50 84 Q76 84 80 60" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    heart: (c) => `<path d="M50 84 L18 50 Q6 34 20 22 Q36 12 50 30 Q64 12 80 22 Q94 34 82 50 Z" fill="${c}"/>`,
    ft: (c) => `<path d="M20 80 H80" stroke="${c}" stroke-width="6"/><circle cx="50" cy="40" r="18" fill="none" stroke="${c}" stroke-width="6"/><path d="M32 40 H68" stroke="${c}" stroke-width="3"/>`,
    yin: (c) => `<circle cx="50" cy="50" r="32" fill="none" stroke="${c}" stroke-width="6"/><path d="M50 18 A16 16 0 0 1 50 50 A16 16 0 0 0 50 82 A32 32 0 0 1 50 18 Z" fill="${c}"/>`,
    arrows: (c) => `<path d="M14 50 H86 M28 36 L14 50 L28 64 M72 36 L86 50 L72 64" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  function icon(name, c = '#fff', d = '#0008', size = 24) {
    const g = (GLYPHS[name] || GLYPHS.star)(c, d);
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
  }

  /* ---------- TEAM LOGO ---------- */
  const SHAPES = {
    shield: 'M50 4 L92 16 L88 58 Q82 84 50 97 Q18 84 12 58 L8 16 Z',
    circle: 'M50 3 A47 47 0 1 1 49.9 3 Z',
    roundel: 'M50 3 A47 47 0 1 1 49.9 3 Z',
    hex: 'M50 3 L93 27 L93 73 L50 97 L7 73 L7 27 Z',
    diamond: 'M50 2 L98 50 L50 98 L2 50 Z',
  };
  function logo(team, size = 64) {
    const [c1, c2, c3] = team.colors;
    const shape = (team.logo && team.logo.shape) || 'circle', ic = (team.logo && team.logo.icon) || 'ball';
    const id = uid('lg');
    const inner = shape === 'roundel' ? `<circle cx="50" cy="50" r="38" fill="none" stroke="${c3 || '#fff'}" stroke-width="2.5" opacity=".8"/>` : '';
    return `<svg class="logo" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c1, 0.15)}"/><stop offset="1" stop-color="${shade(c1, -0.25)}"/></linearGradient></defs>
      <path d="${SHAPES[shape] || SHAPES.circle}" fill="url(#${id})" stroke="${c2}" stroke-width="5"/>${inner}
      <g transform="translate(17 10) scale(.66)">${(GLYPHS[ic] || GLYPHS.ball)(c2, c3 || shade(c1, -0.4))}</g>
      <text x="50" y="86" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="17" fill="${c3 && c3 !== c1 ? c3 : '#fff'}" letter-spacing="1">${team.abbr}</text>
    </svg>`;
  }

  /* ---------- BADGE ICON (tier-colored hex) ---------- */
  const TIER_COLORS = ['#334155', '#cd7f32', '#c9d1d9', '#fbbf24', '#c084fc'];
  function badge(b, tier, size = 54) {
    const id = uid('bd'), col = TIER_COLORS[tier] || TIER_COLORS[0];
    return `<svg class="badge-ico t${tier}" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(col, 0.35)}"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -0.4)}"/></linearGradient></defs>
      <path d="${SHAPES.hex}" fill="url(#${id})" stroke="${shade(col, -0.5)}" stroke-width="4"/>
      <g transform="translate(22 22) scale(.56)">${(GLYPHS[b.icon] || GLYPHS.star)(tier ? '#111827' : '#64748b', '#0004')}</g>
    </svg>`;
  }

  /* ---------- SCENE BACKGROUNDS ----------
     Each returns an <svg> that fills its container (slice). */
  function skyline(r, baseY, color, winColor, count = 26, maxH = 260) {
    let s = '', x = -20;
    for (let i = 0; i < count && x < 1640; i++) {
      const w = 40 + r() * 90, h = 80 + r() * maxH;
      s += `<rect x="${x.toFixed(0)}" y="${(baseY - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${color}"/>`;
      if (winColor) for (let wy = baseY - h + 14; wy < baseY - 10; wy += 18) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (r() < 0.32) s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="8" fill="${winColor}" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
      x += w + r() * 8;
    }
    return s;
  }
  function hoopSilhouette(x, y, s, col) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${col}"><rect x="-6" y="0" width="12" height="320"/><rect x="-70" y="-10" width="80" height="12"/><rect x="-150" y="-80" width="110" height="80" rx="3" fill="none" stroke="${col}" stroke-width="7"/><rect x="-118" y="-50" width="46" height="30" fill="none" stroke="${col}" stroke-width="4"/><ellipse cx="-95" cy="6" rx="28" ry="5" fill="none" stroke="${col}" stroke-width="5"/><path d="M-120 8 L-108 50 L-82 50 L-70 8" fill="none" stroke="${col}" stroke-width="2" opacity=".7"/></g>`;
  }
  function courtLines(y0, col, op = 0.5) {
    return `<g stroke="${col}" stroke-width="4" fill="none" opacity="${op}"><path d="M-100 900 L500 ${y0} L1100 ${y0} L1700 900"/><path d="M560 ${y0} L470 900 M1040 ${y0} L1130 900"/><ellipse cx="800" cy="${y0 + 120}" rx="200" ry="40"/></g>`;
  }

  const SCENES = {
    playground(r) {
      const g = uid('g');
      return `<defs>
        <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset=".38" stop-color="#7c2d92"/><stop offset=".66" stop-color="#f97316"/><stop offset=".82" stop-color="#fbbf24"/></linearGradient>
        <radialGradient id="${g}sun"><stop offset="0" stop-color="#fff7d6"/><stop offset=".35" stop-color="#fde047"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
        <linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f3f46"/><stop offset="1" stop-color="#18181b"/></linearGradient>
        <pattern id="${g}f" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="26" height="26" fill="none" stroke="#0b0b10" stroke-width="2"/></pattern>
      </defs>
      <rect width="1600" height="900" fill="url(#${g}s)"/>
      <circle cx="980" cy="560" r="260" fill="url(#${g}sun)"/><circle cx="980" cy="560" r="80" fill="#fff1c1" opacity=".9"/>
      <g opacity=".55">${skyline(r, 640, '#3b1d4a', '#fde68a', 30, 300)}</g>
      <g>${skyline(r, 650, '#1c1027', '#fbbf24', 26, 200)}</g>
      <rect y="420" width="1600" height="250" fill="url(#${g}f)" opacity=".55"/>
      <rect y="418" width="1600" height="6" fill="#0b0b10" opacity=".6"/>
      <rect y="650" width="1600" height="250" fill="url(#${g}a)"/>
      ${courtLines(650, '#fde68a', .35)}
      ${hoopSilhouette(1420, 380, 1.1, '#0b0b10')}
      <g fill="#0b0b10" opacity=".7"><path d="M300 200 q10 -8 20 0 q10 -8 20 0" stroke="#0b0b10" stroke-width="3" fill="none"/><path d="M380 160 q8 -6 16 0 q8 -6 16 0" stroke="#0b0b10" stroke-width="3" fill="none"/></g>`;
    },
    playground_night(r) {
      const g = uid('g');
      let stars = ''; for (let i = 0; i < 90; i++) stars += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 400).toFixed(0)}" r="${(r() * 1.8 + .4).toFixed(1)}" fill="#fff" opacity="${(r() * .8 + .2).toFixed(2)}"/>`;
      return `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset=".7" stop-color="#1e1b4b"/><stop offset="1" stop-color="#312e81"/></linearGradient>
        <radialGradient id="${g}l" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fef9c3" stop-opacity=".55"/><stop offset="1" stop-color="#fef9c3" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="900" fill="url(#${g}s)"/>${stars}<circle cx="1300" cy="140" r="46" fill="#f1f5f9"/><circle cx="1318" cy="128" r="44" fill="#1e1b4b" opacity=".2"/>
      <g>${skyline(r, 640, '#0b1026', '#facc15', 30, 280)}</g>
      <rect y="640" width="1600" height="260" fill="#111827"/>${courtLines(640, '#94a3b8', .3)}
      <rect x="320" y="200" width="10" height="440" fill="#0b0b10"/><path d="M290 200 h70 l-10 18 h-50 z" fill="#1f2937"/><path d="M200 218 L450 218 L700 900 L-60 900 Z" fill="url(#${g}l)"/>
      ${hoopSilhouette(1420, 380, 1.1, '#000')}`;
    },
    home(r) {
      const g = uid('g');
      return `<defs><linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2f2a"/><stop offset="1" stop-color="#1c1512"/></linearGradient>
        <linearGradient id="${g}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#7c2d12"/></linearGradient>
        <radialGradient id="${g}lamp" cx=".2" cy=".2" r=".6"><stop offset="0" stop-color="#fbbf24" stop-opacity=".35"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="900" fill="url(#${g}w)"/>
      <rect x="900" y="140" width="520" height="380" fill="url(#${g}n)" stroke="#0c0a09" stroke-width="18"/>
      <g>${skyline(r, 520, '#020617', '#fde68a', 14, 220).replace(/x="(-?\d+)"/g, (m, x) => `x="${900 + (+x) * 0.33}"`).replace(/width="(\d+)"/g, (m, w) => `width="${w * 0.33}"`)}</g>
      <path d="M1160 140 V520 M900 330 H1420" stroke="#0c0a09" stroke-width="10"/>
      <rect x="160" y="160" width="200" height="280" fill="#f97316" opacity=".85" transform="rotate(-4 260 300)"/><circle cx="255" cy="270" r="50" fill="#1f2937" opacity=".85" transform="rotate(-4 260 300)"/><text x="255" y="410" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="44" fill="#1f2937" transform="rotate(-4 260 300)">BALL IS LIFE</text>
      <rect x="440" y="200" width="160" height="220" fill="#2563eb" opacity=".8" transform="rotate(3 520 310)"/>
      <rect y="700" width="1600" height="200" fill="#1c1512"/><rect x="0" y="690" width="1600" height="14" fill="#0c0a09"/>
      <rect x="120" y="560" width="520" height="150" rx="10" fill="#57534e"/><rect x="100" y="530" width="560" height="50" rx="16" fill="#78716c"/>
      <rect width="1600" height="900" fill="url(#${g}lamp)"/>`;
    },
    party(r) {
      const g = uid('g'); let lights = '';
      for (let i = 0; i < 40; i++) lights += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 500).toFixed(0)}" r="${(10 + r() * 40).toFixed(0)}" fill="${['#ec4899', '#a855f7', '#22d3ee', '#f43f5e'][i % 4]}" opacity="${(0.08 + r() * 0.2).toFixed(2)}"/>`;
      let crowd = ''; for (let i = 0; i < 26; i++) { const x = i * 64 + r() * 20, h = 160 + r() * 90; crowd += `<g fill="#0a0612"><circle cx="${x}" cy="${900 - h}" r="26"/><rect x="${x - 32}" y="${900 - h + 22}" width="64" height="${h}" rx="26"/></g>`; }
      return `<defs><linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e1065"/><stop offset=".5" stop-color="#701a75"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#${g}b)"/>${lights}
      <path d="M0 80 Q400 140 800 80 T1600 80" stroke="#fde68a" stroke-width="3" fill="none" stroke-dasharray="2 22" stroke-linecap="round"/>${crowd}`;
    },
    rec(r) { // indoor rec center gym
      const g = uid('g'); let lights = '';
      for (let i = 0; i < 6; i++) lights += `<rect x="${120 + i * 250}" y="40" width="140" height="16" rx="6" fill="#f8fafc"/><path d="M${120 + i * 250} 56 h140 l60 300 h-260 z" fill="#f8fafc" opacity=".05"/>`;
      return `<defs><linearGradient id="${g}fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#78350f"/></linearGradient></defs>
      <rect width="1600" height="900" fill="#1f2937"/><rect width="1600" height="560" fill="#334155"/>
      ${[...Array(9)].map((_, i) => `<rect x="0" y="${i * 60 + 70}" width="1600" height="2" fill="#475569"/>`).join('')}
      <rect x="560" y="120" width="480" height="70" fill="#7f1d1d"/><text x="800" y="170" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="52" fill="#fde68a">HALSEY COMMUNITY CENTER</text>
      ${lights}<rect y="560" width="1600" height="340" fill="url(#${g}fl)"/>
      ${[...Array(30)].map((_, i) => `<line x1="${i * 60 - 200}" y1="560" x2="${i * 80 - 600}" y2="900" stroke="#92400e" stroke-width="2" opacity=".6"/>`).join('')}
      ${courtLines(560, '#fef3c7', .55)}${hoopSilhouette(1400, 300, 1, '#0f172a')}`;
    },
    hospital() {
      const g = uid('g');
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbd5e1"/><stop offset="1" stop-color="#64748b"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#${g})"/><rect x="980" y="140" width="420" height="320" fill="#0ea5e9" opacity=".35" stroke="#e2e8f0" stroke-width="16"/>
      <rect x="200" y="560" width="760" height="140" rx="20" fill="#f8fafc"/><rect x="200" y="520" width="200" height="80" rx="20" fill="#e2e8f0"/>
      <rect x="1080" y="520" width="20" height="300" fill="#94a3b8"/><rect x="1040" y="500" width="100" height="70" rx="8" fill="#1e293b"/><path d="M1050 540 l20 0 l8 -16 l10 30 l8 -14 l30 0" stroke="#22c55e" stroke-width="4" fill="none"/>
      <rect y="760" width="1600" height="140" fill="#475569"/>`;
    },
    street_night(r) {
      const g = uid('g');
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset="1" stop-color="#1e293b"/></linearGradient>
        <radialGradient id="${g}r"><stop offset="0" stop-color="#ef4444" stop-opacity=".6"/><stop offset="1" stop-color="#ef4444" stop-opacity="0"/></radialGradient>
        <radialGradient id="${g}b"><stop offset="0" stop-color="#3b82f6" stop-opacity=".6"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="900" fill="url(#${g})"/>${skyline(r, 620, '#0b1220', '#fbbf24', 30, 300)}
      <rect y="620" width="1600" height="280" fill="#0f172a"/><path d="M0 760 H1600" stroke="#facc15" stroke-width="6" stroke-dasharray="60 40" opacity=".6"/>
      <circle cx="420" cy="600" r="260" fill="url(#${g}r)"/><circle cx="1180" cy="600" r="260" fill="url(#${g}b)"/>`;
    },
    gym(r) { // high-school gym, banners in your school's colors
      const g = uid('g'), st = (typeof Game !== 'undefined' && Game.state) || null;
      const t = st && st.career && st.career.hs && LOCAL_TEAMS[st.career.hs] || { colors: ['#b91c1c', '#fbbf24', '#111827'], abbr: 'HS' };
      const [c1, c2] = t.colors; let bleach = '', crowd = '';
      for (let i = 0; i < 7; i++) bleach += `<rect x="0" y="${300 + i * 34}" width="1600" height="30" fill="${i % 2 ? '#3f3f46' : '#52525b'}"/>`;
      for (let i = 0; i < 260; i++) crowd += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(310 + r() * 220).toFixed(0)}" r="${(5 + r() * 4).toFixed(1)}" fill="${[c1, c2, '#e5e7eb', '#1f2937', '#94a3b8'][Math.floor(r() * 5)]}" opacity=".85"/>`;
      let banners = ''; for (let i = 0; i < 6; i++) { const x = 120 + i * 240; banners += `<path d="M${x} 60 h90 v120 l-45 26 l-45 -26 z" fill="${i % 2 ? c2 : c1}" stroke="#0007" stroke-width="3"/><text x="${x + 45}" y="130" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="34" fill="${i % 2 ? c1 : c2}">${['CITY', 'STATE', t.abbr, 'REGION', 'CHAMPS', 'METRO'][i]}</text>`; }
      return `<defs><linearGradient id="${g}fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2803f"/><stop offset="1" stop-color="#7c4a1e"/></linearGradient>
        <radialGradient id="${g}lt" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="900" fill="#27272a"/><rect width="1600" height="300" fill="#3f3f46"/>
      ${[...Array(12)].map((_, i) => `<rect x="${i * 140}" y="0" width="4" height="300" fill="#52525b"/>`).join('')}
      ${banners}<rect x="700" y="200" width="200" height="80" rx="6" fill="#0a0a0a" stroke="${c1}" stroke-width="4"/><text x="800" y="252" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="40" fill="#ef4444">HOME 00 · 00</text>
      ${bleach}${crowd}<rect y="540" width="1600" height="360" fill="url(#${g}fl)"/>
      ${[...Array(30)].map((_, i) => `<line x1="${i * 60 - 200}" y1="540" x2="${i * 80 - 600}" y2="900" stroke="#6b3d14" stroke-width="2" opacity=".5"/>`).join('')}
      ${courtLines(540, '#fff', .5)}<ellipse cx="800" cy="660" rx="130" ry="26" fill="${c1}" opacity=".7"/>
      <rect width="1600" height="900" fill="url(#${g}lt)"/>`;
    },
    locker(r) {
      const g = uid('g'); let lockers = '';
      for (let i = 0; i < 14; i++) { const x = i * 118; lockers += `<rect x="${x + 6}" y="120" width="106" height="440" fill="#1e3a5f" stroke="#0b1d33" stroke-width="6"/>${[0, 1, 2].map(k => `<rect x="${x + 26}" y="${150 + k * 12}" width="66" height="4" fill="#0b1d33"/>`).join('')}<rect x="${x + 90}" y="330" width="8" height="40" rx="3" fill="#94a3b8"/><rect x="${x + 30}" y="420" width="56" height="70" fill="${['#b91c1c', '#f8fafc', '#1e3a8a', '#facc15'][i % 4]}" opacity=".85"/>`; }
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#${g})"/>${lockers}<rect y="560" width="1600" height="340" fill="#334155"/>
      <rect x="0" y="620" width="1600" height="60" fill="#78350f"/><rect x="0" y="680" width="1600" height="18" fill="#451a03"/>
      ${[...Array(5)].map((_, i) => `<rect x="${200 + i * 300}" y="20" width="160" height="14" rx="6" fill="#f8fafc" opacity=".8"/>`).join('')}`;
    },
    arena(r) { // big arena for finals / camps
      const g = uid('g'); let crowd = '';
      for (let i = 0; i < 700; i++) { const y = 260 + r() * 300; crowd += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + (y - 260) / 90).toFixed(1)}" fill="${['#1e293b', '#334155', '#475569', '#f97316', '#e5e7eb'][Math.floor(r() * 5)]}" opacity=".85"/>`; }
      let flashes = ''; for (let i = 0; i < 30; i++) flashes += `<circle class="flash" style="animation-delay:${(r() * 4).toFixed(2)}s" cx="${(r() * 1600).toFixed(0)}" cy="${(270 + r() * 280).toFixed(0)}" r="3" fill="#fff"/>`;
      return `<defs><radialGradient id="${g}c" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".55" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/></radialGradient>
        <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4a373"/><stop offset="1" stop-color="#7c4a1e"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#${g}c)"/>${crowd}${flashes}
      <rect x="560" y="30" width="480" height="170" rx="12" fill="#020617" stroke="#38bdf8" stroke-width="4"/><rect x="580" y="50" width="440" height="130" fill="#0b1220"/><text x="800" y="135" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="64" fill="#38bdf8">CHAMPIONSHIP</text>
      <path d="M0 570 H1600 V900 H0 Z" fill="url(#${g}f)"/>${courtLines(570, '#fff', .55)}
      <path class="beam b1" d="M260 0 L340 0 L660 900 L40 900 Z" fill="url(#${g}b)"/><path class="beam b2" d="M1260 0 L1340 0 L1560 900 L940 900 Z" fill="url(#${g}b)"/>`;
    },
    matchbg(r) { // plain dark arena behind the match screen (no signage that could show through)
      const g = uid('g'); let crowd = '';
      for (let i = 0; i < 380; i++) crowd += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 900).toFixed(0)}" r="${(1.5 + r() * 2.5).toFixed(1)}" fill="${['#1e293b', '#334155', '#0f172a'][Math.floor(r() * 3)]}"/>`;
      return `<defs><radialGradient id="${g}" cx=".5" cy=".55" r=".8"><stop offset="0" stop-color="#151c2c"/><stop offset="1" stop-color="#05070d"/></radialGradient></defs><rect width="1600" height="900" fill="url(#${g})"/><g opacity=".5">${crowd}</g>`;
    },
    title(r) { // main menu: arena with spotlights
      const g = uid('g'); let crowd = '';
      for (let i = 0; i < 520; i++) { const x = r() * 1600, y = 300 + r() * 260; crowd += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 3).toFixed(1)}" fill="${['#1e293b', '#334155', '#475569', '#f97316'][Math.floor(r() * 3.2)]}" opacity=".8"/>`; }
      let flashes = ''; for (let i = 0; i < 26; i++) flashes += `<circle class="flash" style="animation-delay:${(r() * 4).toFixed(2)}s" cx="${(r() * 1600).toFixed(0)}" cy="${(320 + r() * 230).toFixed(0)}" r="3" fill="#fff"/>`;
      return `<defs><radialGradient id="${g}c" cx=".5" cy=".9" r=".8"><stop offset="0" stop-color="#7c2d12"/><stop offset=".5" stop-color="#1c1917"/><stop offset="1" stop-color="#05060a"/></radialGradient>
        <linearGradient id="${g}beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${g}fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2410c"/><stop offset="1" stop-color="#431407"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#${g}c)"/>${crowd}${flashes}
      <path d="M0 580 L1600 580 L1600 900 L0 900 Z" fill="url(#${g}fl)"/>${courtLines(580, '#fed7aa', .4)}
      <path class="beam b1" d="M300 0 L380 0 L700 900 L80 900 Z" fill="url(#${g}beam)"/><path class="beam b2" d="M1220 0 L1300 0 L1520 900 L900 900 Z" fill="url(#${g}beam)"/>
      <rect x="640" y="40" width="320" height="150" rx="10" fill="#0b0f19" stroke="#f97316" stroke-width="3"/><text x="800" y="135" text-anchor="middle" font-family="Bebas Neue, Impact" font-size="60" fill="#f97316" opacity=".9">HOME 00  ·  AWAY 00</text>`;
    },
  };
  function scene(name, seed) {
    const r = seeded((seed || name) + '');
    const fn = SCENES[name] || SCENES.title;
    return `<svg class="scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${fn(r)}</svg>`;
  }

  return { avatar, lookFromSeed, logo, badge, icon, scene, shade, seeded, hashStr, SKINS, HAIRS, HAIR_COLORS, BEARDS, ACCENTS, SHOES, DEFAULT_LOOK, GLYPHS, TIER_COLORS };
})();
