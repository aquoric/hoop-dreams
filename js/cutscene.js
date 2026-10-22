/* =====================================================================
   CUTSCENE.JS — a small 16-bit "anime episode" engine, all drawn in code.

   Cutscene.play(id, ctx) -> Promise   Unskippable. ctx: { score, usAbbr, themAbbr, team:{colors}, them:{colors}, venue, ending, injury }
   Cutscene.highlight(o)  -> Promise   2–3s in-game mini cutscene, tap to skip (arcade + match court): { kind, look, name, caption, colors, look2… }
   Cutscene.prep(look) / ready(look)   preload the player's highlight portrait

   Rendering: one low-res canvas (W×216, W = 240–432 by screen shape), scaled up with crisp pixels.
     • Parallax scenes: sky / far / mid / ground / foreground layers that move at different speeds.
     • Portraits: Art.avatar SVGs pixelated into outlined sprites with blink + talk frames, rim light,
       tears, sweat, shock lines and anger marks. Kinds: 'face' (close-up), 'bust', 'full' (full body).
     • Court shots: the real game venue + game sprites, choreographed by a shot's play(S, t) function.
     • Effects: speed lines, 2-tone impact frames, freeze frames with a name/stats card, flashes,
       shake, slow motion, confetti, rain, lightning, camera flashes, spotlights, color grading.
     • Typewriter dialogue with name tags and a voice blip per character; music cues + silences.

   SHOT FORMAT
   { d: ms (shot clock),  scene: 'street_sunset'|'street_night'|'rain_night'|'gym'|'locker'|'arena'|'hospital'|'list'|'notebook'|'title'|'void'|'vs'
     court: venue id, '@venue' (the game's venue) or a def object { base, sky, … } (instead of scene) for gameplay shots,
     cam: [[0, x, y, zoom], [1, x, y, zoom, ease]]  (world px from scene center; ease: lin io out in back snap),
     cast: [{ id, kind:'face'|'bust'|'full'|'sprite'|'car'|'ball', x (view units −1..1, or venue px for sprites), y, expr, flip,
              d (parallax depth), from:{dx,dy,t,ease} (entrance), move:[[ms,x],[ms,x]], sil (silhouette), rim (rim-light color), team (sprites) }],
     say: [who, text], title: { text, sub, style:'slam'|'rise'|'loc', at }, grade: 'sunset'|'night'|'gold'|'red'|'blue'|'spot'|'dark'|'mono',
     speed: 'radial'|'h', focus:[fx,fy], slow: k or [[t0,t1,k]], tr: 'cut'|'fade'|'flash'|'wipe', music: mood | null (silence),
     score: true, play(S, t, dt) for choreography, ev: [[ms, type, ...args]] — sfx, music, impact, flash, shake, freeze,
     expr, title, speed, confetti, cheer, lightning, stop, riser, score }
   ===================================================================== */

/* per-character voice blips (pitch + wave) */
const CS_VOICE = {
  narrator: { f: 170, w: 'sine', g: .03 }, you: { f: 280, w: 'square', g: .03 }, tariq: { f: 205, w: 'square', g: .03 }, lou: { f: 125, w: 'triangle', g: .05 },
  kai: { f: 340, w: 'square', g: .028 }, mom: { f: 470, w: 'triangle', g: .045 }, nia: { f: 640, w: 'triangle', g: .04 }, dee: { f: 410, w: 'triangle', g: .045 },
  brennan: { f: 150, w: 'sawtooth', g: .022 }, marcus: { f: 185, w: 'sawtooth', g: .022 },
};

/* choreography kit for court shots (functions of shot time t in seconds) */
const CSK = {
  ease: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  span: (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a))),
  run(p, t, a, b, x0, y0, x1, y1) { const k = CSK.ease(CSK.span(t, a, b)); p.x = x0 + (x1 - x0) * k; p.y = y0 + (y1 - y0) * k; },
  /* gather (crouch) → rise → release at the top → follow-through → land; the ball flies to the rim */
  jumper(S, p, t, t0, o = {}) {
    const u = t - t0, H = PIX.hoop, J = o.jump || 15, F = o.flight || 1.05, rel = .44;
    if (u < 0) return;
    if (u < rel) { p.face = H.x >= p.x ? 1 : -1; S.ball.holder = p; }
    if (u < .18) { p.act = { type: 'shoot', t: u, air: false }; p.z = 0; return; }
    if (u < rel) { const k = (u - .18) / (rel - .18); p.act = { type: 'shoot', t: u, air: true, released: false }; p.z = Math.sin(k * Math.PI / 2) * J; return; }
    const r = u - rel; if (!p._rel) { p._rel = { x: p.x + p.face * 2, y: p.y, z: J + 30 }; SFX.play('whoosh'); }
    p.z = Math.max(0, J * (1 - Math.pow(Math.min(1, r / .4), 2)));
    p.act = r < .45 ? { type: 'shoot', t: u, air: true, released: true } : r < .65 ? { type: 'land', t: r - .45, T: .2 } : (o.after ? o.after(u) : null);
    S.ball.holder = null;
    const k = Math.min(1, r / F), R = p._rel, B = S.ball;
    if (k < 1) { B.x = R.x + (H.x - R.x) * k; B.y = R.y + (H.y - R.y) * k; B.z = R.z + (H.z + 1 - R.z) * k + (o.arc || 26) * 4 * k * (1 - k); B.spin = r * 14; return; }
    const a = r - F;
    if (o.made !== false) {
      if (!p._sw) { p._sw = 1; S.R.E.net.swish = 1; SFX.play('swish'); SFX.play('net'); o.onMake && o.onMake(); }
      B.x = H.x; B.y = H.y + Math.min(6, a * 30); B.z = Math.max(0, H.z - a * 70); if (B.z === 0 && !p._bn) { p._bn = 1; SFX.play('bounce', .6); }
    } else {
      if (!p._sw) { p._sw = 1; SFX.play('rim'); S.R.E.rim = .8; o.onMiss && o.onMiss(); }
      B.x = H.x + a * 50; B.y = H.y + a * 40; B.z = Math.max(0, H.z + 2 + a * 40 - a * a * 160);
    }
  },
  cel(p, type, u) { p.act = { type, t: u, T: 99, hop: true }; },
};

const CUTSCENES = {
  /* ------------------------------------------------------------------ */
  opening: { name: 'Concrete Dreams', chapter: 'Chapter 1', shots: [
    { d: 3000, scene: 'street_sunset', cam: [[0, -90, -30, 1.05], [1, 40, -10, 1.12]], grade: 'sunset', music: 'build', tr: 'fade',
      title: { text: '{hometown}', sub: 'Halsey Street Courts · Summer', style: 'loc', at: 500 }, ev: [[0, 'sfx', 'crowd', .3]] },
    { d: 3600, court: { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 }, grade: 'sunset', cam: [[0, 0, -8, 1.1], [1, 0, 26, 1.45]],
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 168 }],
      say: ['narrator', 'Sixteen, unranked, nobody. Just a cracked court and a rim with no net.'],
      play(S, t) { const p = S.sp.you; p.face = 1; S.ball.holder = p; p.holdBall = false; if (t > 1.6 && t < 1.95) p.act = { type: 'move', id: 'btl', t: t - 1.6, T: .35, f0: 1, f1: -1 }; else if (t >= 1.95 && t < 2.3) p.act = { type: 'move', id: 'cross', t: t - 1.95, T: .35, f0: -1, f1: 1 }; else p.act = null; } },
    { d: 2600, scene: 'street_sunset', cam: [[0, 0, 8, 1.2], [1, 0, 14, 1.42, 'io']], grade: 'sunset', music: null,
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fdba74' }],
      say: ['you', 'One day, everybody\'s gonna know my name.'], ev: [[200, 'sfx', 'heartbeat']] },
    { d: 2600, court: { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 }, grade: 'sunset', cam: [[0, 0, 40, 1.35], [.45, 0, 0, 1.25], [1, 0, -60, 1.6, 'io']],
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 160 }], slow: [[700, 2600, .4]], speed: 'radial', focus: [.5, .3],
      ev: [[0, 'riser', 2.6]], play(S, t) { CSK.jumper(S, S.sp.you, t, .25, { made: true, flight: 1.4, onMake: () => S.fx.impact(170) }); } },
    { d: 3200, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], speed: 'radial', music: 'menu',
      title: { text: 'HOOP DREAMS', sub: 'From nobody to the GOAT', style: 'slam', at: 80 }, ev: [[80, 'sfx', 'stinger'], [80, 'flash', '#ffffff', .9], [80, 'shake', 8], [300, 'sfx', 'roar']] },
  ] },
  /* ------------------------------------------------------------------ */
  kai_showdown: { name: 'The Rival', chapter: 'Chapter 1', shots: [
    { d: 3200, scene: 'street_sunset', cam: [[0, -60, -10, 1.1], [1, 30, -6, 1.15]], grade: 'sunset', music: null, tr: 'fade',
      cast: [{ id: 'car', kind: 'car', x: 1.6, y: 58, move: [[0, 1.8], [2200, .45]] }],
      say: ['narrator', 'A black SUV pulls up, and a kid in a gold headband steps out. The whole court goes quiet.'], ev: [[0, 'sfx', 'engine'], [2300, 'sfx', 'thud', .6]] },
    { d: 2800, scene: 'street_sunset', cam: [[0, 20, -10, 1.15], [1, 0, -16, 1.25]], grade: 'sunset',
      cast: [{ id: 'kai', kind: 'full', x: .25, y: 62, d: .85, expr: 'smile', from: { dx: 70, t: 1600, ease: 'out' }, walk: true }, { id: 'you', kind: 'bust', x: -.62, y: 120, sil: true, rim: '#fdba74', d: 1.25 }],
      say: ['kai', 'So this is the famous Halsey Street. Smaller than it looks on the internet.'] },
    { d: 2200, scene: 'street_sunset', cam: [[0, 0, 6, 1.2], [1, 0, 14, 1.5, 'io']], grade: 'red', speed: 'h',
      cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'smile', rim: '#facc15' }],
      ev: [[900, 'freeze', 1500, { name: 'KAI STERLING', sub: '#1 sophomore in the country', stats: [['SPD', 91], ['HND', 94], ['SHT', 88], ['ATH', 93]] }], [900, 'sfx', 'stinger']] },
    { d: 2200, scene: 'street_sunset', music: 'clutch', cam: [[0, 0, 6, 1.15], [1, 0, 12, 1.35, 'snap']], grade: 'sunset',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'angry', rim: '#fdba74' }],
      say: ['you', 'We got next. You and me.'], ev: [[0, 'shake', 3]] },
    { d: 2400, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial',
      cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'smile', from: { dx: 160, t: 300, ease: 'back' }, rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.55, expr: 'determined', from: { dx: -160, t: 300, ease: 'back' }, rim: '#fca5a5' }],
      title: { text: 'VS', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 10]] },
  ] },
  /* ------------------------------------------------------------------ */
  scouted: { name: 'The Notebook', chapter: 'Chapter 1', shots: [
    { d: 3200, scene: 'street_sunset', cam: [[0, -40, -14, 1.08], [1, 10, -10, 1.14]], grade: 'sunset', music: 'story', tr: 'fade',
      cast: [{ id: 'you', kind: 'full', x: -.4, y: 96, expr: 'neutral', sweat: true }, { id: 'dee', kind: 'full', x: .5, y: 92, d: .95, from: { dx: 130, t: 2200, ease: 'out' }, walk: true }],
      say: ['narrator', 'A woman in a navy blazer walks straight across the court toward you.'] },
    { d: 2600, scene: 'street_sunset', cam: [[0, 30, -2, 1.2], [1, 30, 4, 1.32, 'io']], grade: 'gold',
      cast: [{ id: 'dee', kind: 'bust', x: .28, expr: 'smile', rim: '#fde68a' }, { id: 'you', kind: 'bust', x: -.75, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
      say: ['dee', 'You get better when it gets harder. I can\'t teach that.'] },
    { d: 3600, scene: 'notebook', cam: [[0, 0, -22, 1.1], [1, 0, 0, 1.18, 'io']], ev: [[200, 'sfx', 'write'], [900, 'sfx', 'write'], [1600, 'sfx', 'write'], [2300, 'sfx', 'write'], [3000, 'sfx', 'page']] },
    { d: 1900, scene: 'street_sunset', cam: [[0, 0, 8, 1.3], [1, 0, 14, 1.4]], grade: 'sunset', music: null,
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'shocked', rim: '#fdba74' }], ev: [[0, 'sfx', 'heartbeat'], [1150, 'expr', 'you', 'smile'], [1150, 'sfx', 'good']] },
    { d: 2800, scene: 'title', cam: [[0, 0, 0, 1.2], [1, 0, 0, 1.05, 'snap']], speed: 'radial', music: 'menu',
      cast: [{ id: 'you', kind: 'bust', x: -.45, expr: 'smile', rim: '#fde68a', from: { dy: 60, t: 400, ease: 'back' } }],
      title: { text: 'SCOUTED', sub: 'Elite Hoops Network · {name}', style: 'slam', at: 150 },
      ev: [[150, 'sfx', 'impact'], [150, 'flash', '#fde68a', .7], [150, 'shake', 6], [700, 'sfx', 'levelup'], [1300, 'freeze', 1300, 'you']] },
  ] },
  /* ------------------------------------------------------------------ */
  varsity: { name: 'Varsity', chapter: 'Chapter 2', shots: [
    { d: 3000, scene: 'locker', cam: [[0, -50, -10, 1.08], [1, 0, -16, 1.18]], music: 'story', tr: 'fade',
      cast: [{ id: 'mate1', kind: 'full', x: -.6, y: 96, d: .95 }, { id: 'mate2', kind: 'full', x: -.15, y: 92, d: .9 }, { id: 'mate3', kind: 'full', x: .35, y: 98, d: .95 }],
      say: ['narrator', 'The list goes up on the locker room door. Everybody crowds around it.'] },
    { d: 3400, scene: 'list', cam: [[0, 0, -50, 1.3], [1, 0, 30, 1.3, 'io']], music: null, ev: [[0, 'sfx', 'heartbeat'], [1000, 'sfx', 'heartbeat'], [2000, 'sfx', 'heartbeat'], [2800, 'sfx', 'heartbeat']] },
    { d: 1800, scene: 'locker', cam: [[0, 0, 8, 1.25], [1, 0, 14, 1.4, 'snap']], speed: 'radial',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'shocked' }], ev: [[0, 'sfx', 'whoosh'], [0, 'shake', 4]] },
    { d: 2600, scene: 'locker', cam: [[0, 0, -2, 1.2], [1, 0, 4, 1.26]], grade: 'gold',
      cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fde68a' }], say: ['you', 'Number {num}, starting five. That\'s me.'] },
    { d: 3000, scene: 'gym', cam: [[0, 0, -20, 1.35], [1, 0, -10, 1.05, 'snap']], speed: 'radial', music: 'menu',
      cast: [{ id: 'you', kind: 'full', x: 0, y: 104, expr: 'determined', rim: '#fde68a', from: { dy: 40, t: 350, ease: 'back' } }],
      title: { text: 'VARSITY', sub: '{hs}', style: 'slam', at: 150 }, ev: [[150, 'sfx', 'stinger'], [150, 'flash', '#ffffff', .8], [150, 'shake', 8], [300, 'cheer'], [400, 'sfx', 'roar']] },
  ] },
  /* ------------------------------------------------------------------ */
  game_winner: { name: 'Game-Winner', chapter: 'Any big game', shots: [
    { d: 2600, scene: 'arena', cam: [[0, 0, -40, 1.0], [1, 0, -30, 1.12]], grade: 'dark', score: true, music: 'build', tr: 'fade',
      say: ['narrator', 'Final seconds. {scoreline}.'], ev: [[0, 'sfx', 'heartbeat'], [1200, 'sfx', 'heartbeat']] },
    { d: 2600, court: '@venue', cam: [[0, 70, 30, 1.4], [1, 60, 20, 1.55]], score: true,
      cast: [{ id: 'you', kind: 'sprite', x: 296, y: 128 }, { id: 'def', kind: 'sprite', team: 1, x: 276, y: 118 }],
      play(S, t) { const p = S.sp.you, d = S.sp.def; S.ball.holder = p; p.face = -1; d.face = 1; d.stance = true; d.x = p.x - 18 + Math.sin(t * 6) * 2;
        if (t > .9 && t < 1.25) p.act = { type: 'move', id: 'cross', t: t - .9, T: .35, f0: -1, f1: 1 }; else if (t > 1.5 && t < 1.85) p.act = { type: 'move', id: 'hesi', t: t - 1.5, T: .35 }; else p.act = null;
        if (t > 1.8) { d.act = { type: 'stumble', t: t - 1.8, T: 2 }; CSK.run(p, t, 1.8, 2.4, 296, 128, 306, 140); } } },
    { d: 1800, scene: 'arena', cam: [[0, 0, 10, 1.5], [1, 0, 16, 1.8, 'io']], grade: 'spot', music: null, speed: 'h',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }], ev: [[100, 'sfx', 'heartbeat'], [900, 'sfx', 'heartbeat']] },
    { d: 3000, court: '@venue', cam: [[0, 100, 30, 1.5], [.4, 70, 0, 1.4], [1, 0, -50, 1.7, 'io']], slow: [[500, 3000, .38]], speed: 'radial', focus: [.5, .35], score: true,
      cast: [{ id: 'you', kind: 'sprite', x: 306, y: 140 }, { id: 'def', kind: 'sprite', team: 1, x: 285, y: 128 }],
      ev: [[0, 'riser', 3], [1800, 'sfx', 'buzzer'], [1800, 'flash', '#ef4444', .4]],
      play(S, t) { const d = S.sp.def; d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - .35) / .6)) * Math.PI) * 10); CSK.jumper(S, S.sp.you, t, .2, { made: true, flight: 1.3, jump: 17, onMake: () => S.fx.impact(170) }); } },
    { d: 3400, court: '@venue', cam: [[0, 70, 10, 1.3], [1, 40, 0, 1.15]], grade: 'gold', score: true, music: 'victory',
      cast: [{ id: 'you', kind: 'sprite', x: 260, y: 130 }, { id: 'm1', kind: 'sprite', x: 200, y: 150 }, { id: 'm2', kind: 'sprite', x: 320, y: 160 }, { id: 'def', kind: 'sprite', team: 1, x: 160, y: 110 }],
      title: { text: 'GAME-WINNER', sub: '{name} · {scoreline}', style: 'slam', at: 600 },
      ev: [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', 160], [600, 'sfx', 'impact'], [1600, 'sfx', 'slap']],
      play(S, t) { const p = S.sp.you, a = S.sp.m1, b = S.sp.m2; S.ball.holder = null; S.ball.z = 0; S.ball.x = 192; S.ball.y = 76;
        CSK.cel(p, t < 1.5 ? 'flex' : 'point', t); CSK.run(a, t, 0, 1.4, 200, 150, 250, 134); CSK.run(b, t, 0, 1.4, 320, 160, 272, 136);
        if (t > 1.5 && t < 2.1) { a.act = { type: 'chestbump', t: t - 1.5, T: .55 }; a.face = 1; } else CSK.cel(a, 'joy', t); CSK.cel(b, 'joy', t + .3); S.sp.def.act = { type: 'hang', t, T: 99 }; } },
  ] },
  /* ------------------------------------------------------------------ */
  state_champ: { name: 'State Champions', chapter: 'Chapter 2', shots: [
    { d: 2600, scene: 'arena', cam: [[0, -40, -40, 1.0], [1, 30, -30, 1.1]], grade: 'dark', score: true, music: 'build', tr: 'fade',
      say: ['narrator', 'Twelve thousand people. One buzzer.'] },
    { d: 3000, court: '@venue', cam: [[0, 0, 60, 1.35], [1, 0, 50, 1.5]], score: true,
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 196 }, { id: 'def', kind: 'sprite', team: 1, x: 192, y: 180 }],
      ev: [[0, 'score', '0:03'], [1000, 'score', '0:02'], [2000, 'score', '0:01'], [0, 'sfx', 'tick'], [1000, 'sfx', 'tick'], [2000, 'sfx', 'tick']],
      play(S, t) { const p = S.sp.you, d = S.sp.def; S.ball.holder = p; p.face = 1; d.face = -1; d.stance = true; p.x = 192 + Math.sin(t * 2) * 10; d.x = p.x + 12; d.y = 186; } },
    { d: 1400, court: '@venue', cam: [[0, 0, 50, 1.5], [1, 0, 50, 1.2, 'snap']], score: true, music: null,
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 196 }], ev: [[0, 'score', '0:00'], [0, 'sfx', 'buzzer'], [150, 'impact', 160], [150, 'shake', 10], [200, 'sfx', 'roar'], [200, 'cheer']],
      play(S, t) { const p = S.sp.you; S.ball.holder = t < .3 ? p : null; S.ball.x = 200; S.ball.y = 200; S.ball.z = Math.max(0, 40 * Math.sin(Math.min(1, t) * Math.PI)); p.act = t < .3 ? null : { type: 'joy', t, T: 99 }; } },
    { d: 3000, court: '@venue', cam: [[0, 0, 30, 1.25], [1, 0, 20, 1.15]], grade: 'gold', music: 'victory',
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 150 }, { id: 'm1', kind: 'sprite', x: 120, y: 170 }, { id: 'm2', kind: 'sprite', x: 270, y: 176 }, { id: 'm3', kind: 'sprite', x: 150, y: 110 }, { id: 'def', kind: 'sprite', team: 1, x: 310, y: 120 }],
      title: { text: 'CHAMPIONS', style: 'slam', at: 300 }, ev: [[0, 'confetti', 200], [300, 'sfx', 'impact'], [1200, 'sfx', 'slap'], [0, 'cheer']],
      play(S, t) { const p = S.sp.you, m1 = S.sp.m1, m2 = S.sp.m2; S.ball.holder = null; S.ball.z = 0; S.ball.x = 230; S.ball.y = 190;
        CSK.run(m1, t, 0, 1.1, 120, 170, 178, 152); CSK.run(m2, t, 0, 1.1, 270, 176, 206, 154);
        if (t > 1.1 && t < 1.7) { p.act = { type: 'chestbump', t: t - 1.1, T: .55 }; m1.act = { type: 'chestbump', t: t - 1.1, T: .55 }; p.face = -1; m1.face = 1; } else { CSK.cel(p, t < 1.1 ? 'joy' : 'flex', t); CSK.cel(m1, 'joy', t + .2); }
        CSK.cel(m2, 'joy', t + .4); CSK.cel(S.sp.m3, 'clap', t); S.sp.def.act = { type: 'hang', t, T: 99 }; } },
    { d: 2800, scene: 'arena', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.45]], grade: 'gold',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'crying', rim: '#fde68a' }], ev: [[0, 'confetti', 90]], say: ['you', 'We did it… We actually did it.'] },
    { d: 3400, scene: 'arena', cam: [[0, 0, 22, 1.18], [1, 0, 16, 1.06, 'io']], grade: 'gold',
      cast: [{ id: 'mom', kind: 'full', x: -.5, y: 100, expr: 'crying', d: .95 }, { id: 'you', kind: 'full', x: 0, y: 106, expr: 'smile' }, { id: 'lou', kind: 'full', x: .5, y: 100, expr: 'smile', d: .95 }],
      title: { text: 'STATE CHAMPIONS', sub: '{hs}', style: 'rise', at: 300 }, ev: [[0, 'confetti', 160], [0, 'cheer'], [300, 'sfx', 'levelup']] },
  ] },
  /* ------------------------------------------------------------------ */
  injury: { name: 'The Sound', chapter: 'Any chapter', shots: [
    { d: 2800, court: '@venue', cam: [[0, 40, 40, 1.3], [1, 10, 0, 1.5, 'io']], music: null, tr: 'fade', slow: [[1500, 2800, .35]],
      cast: [{ id: 'you', kind: 'sprite', x: 260, y: 170 }, { id: 'def', kind: 'sprite', team: 1, x: 196, y: 90 }],
      play(S, t) { const p = S.sp.you, d = S.sp.def; d.stance = true; d.face = 1;
        if (t < 1.1) { CSK.run(p, t, 0, 1.1, 260, 170, 214, 98); S.ball.holder = p; p.face = -1; p.act = null; }
        else { const u = t - 1.1, k = Math.min(1, u / .7); p.face = -1; S.ball.holder = null; p.x = 214 - k * 10; p.y = 98 + k * 8; p.z = Math.sin(k * Math.PI) * 18;
          p.act = u < .7 ? { type: 'layup', t: .3, T: .7, released: true } : { type: 'down', t: u - .7, T: 99 }; if (u > .1) { d.act = { type: 'block', t: .1 }; d.z = Math.sin(Math.min(1, (u - .1) / .5) * Math.PI) * 12; }
          S.ball.x = 200 + u * 20; S.ball.y = 100 + u * 30; S.ball.z = Math.max(0, 40 - u * 60);
          if (u > .7 && !p._cr) { p._cr = 1; S.fx.impact(220, ['#000000', '#ef4444']); SFX.play('crack'); S.fx.shake(10); } } } },
    { d: 2600, court: '@venue', cam: [[0, 10, -4, 1.6], [1, 10, -8, 1.9, 'io']], grade: 'mono',
      cast: [{ id: 'you', kind: 'sprite', x: 204, y: 106 }],
      say: ['narrator', 'You land wrong. You hear it before you feel it.'], ev: [[0, 'sfx', 'groan'], [600, 'sfx', 'heartbeat'], [1600, 'sfx', 'heartbeat']],
      play(S, t) { const p = S.sp.you; p.face = -1; p.act = { type: 'down', t: 1 + t, T: 99 }; S.ball.holder = null; S.ball.x = 240; S.ball.y = 140; S.ball.z = 0; } },
    { d: 2400, scene: 'hospital', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], grade: 'blue',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'crying', rim: '#93c5fd' }], ev: [[0, 'music', 'sad']] },
    { d: 3200, scene: 'hospital', cam: [[0, -30, 10, 1.12], [1, 10, 6, 1.04, 'io']], grade: 'blue',
      cast: [{ id: 'you', kind: 'bust', x: -.15, y: 150, expr: 'sad', rim: '#93c5fd' }],
      title: { text: 'INJURED', sub: '{injury}', style: 'rise', at: 200 }, say: ['narrator', 'Everything you built suddenly feels very far away.'] },
  ] },
  /* ------------------------------------------------------------------ */
  career_end: { name: 'The End of the Road', chapter: 'Early ending', shots: [
    { d: 3000, scene: 'rain_night', cam: [[0, -50, 4, 1.05], [1, 30, 10, 1.14]], grade: 'red', music: null, tr: 'fade',
      cast: [{ id: 'car', kind: 'car', x: -1.8, y: 66, lights: true, move: [[0, -1.9], [3000, 1.6]] }],
      say: ['narrator', 'Some nights change everything.'], ev: [[0, 'sfx', 'amb_rain'], [600, 'lightning'], [600, 'sfx', 'thunder'], [1800, 'sfx', 'engine']] },
    { d: 900, scene: 'void', cam: [[0, 0, 0, 1.2], [1, 0, 0, 1, 'snap']], ev: [[0, 'flash', '#ffffff', 1], [0, 'sfx', 'crash'], [0, 'shake', 14]], speed: 'radial' },
    { d: 3200, scene: 'hospital', cam: [[0, 0, -2, 1.2], [1, 0, 4, 1.32]], grade: 'blue', music: 'sad', tr: 'fade',
      cast: [{ id: 'mom', kind: 'bust', x: 0, expr: 'crying', rim: '#93c5fd' }], say: ['narrator', 'Mom doesn\'t let go of your hand.'] },
    { d: 2200, scene: 'hospital', cam: [[0, 0, 10, 1.35], [1, 0, 14, 1.45]], grade: 'blue',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }] },
    { d: 3800, scene: 'street_night', cam: [[0, 60, 10, 1.25], [1, 60, 0, 1.0, 'io']], grade: 'blue', tr: 'fade',
      cast: [{ id: 'ball', kind: 'ball', x: -.2, y: 84, move: [[0, -.6], [3000, .1]] }],
      title: { text: '{ending}', sub: 'Your career is over', style: 'rise', at: 900 } },
  ] },
};

const Cutscene = (() => {
  const H = 216, WW = 640, OUT = '#0a0a12';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const EASE = { lin: t => t, io: CSK.ease, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }, snap: t => 1 - Math.pow(1 - t, 6) };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; return [cv, g]; };
  const P = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const shade = (c, a) => Pixel.shade(c, a);
  let playing = false;

  /* ---------- text + characters ---------- */
  function fill(t, ctx) {
    const s = Game.state;
    const map = Object.assign({ scoreline: ctx.score ? `${ctx.usAbbr || 'US'} ${ctx.score} ${ctx.themAbbr || 'THEM'}` : '', injury: ctx.injury || 'Out indefinitely', ending: ctx.ending || 'The End' }, ctx);
    const out = String(t || '').replace(/\{(scoreline|injury|ending|score|opp)\}/g, (m, k) => map[k] != null ? map[k] : m);
    return s ? Engine.text(out, s) : out;
  }
  const you = () => Game.state && Game.state.player;
  function nameOf(who) { if (who === 'you') return you() ? `${you().first} ${you().last}` : 'You'; const ch = STORY.characters[who]; return ch ? ch.name : who; }
  function colorOf(who) { if (who === 'you') return '#facc15'; const ch = STORY.characters[who]; return (ch && ch.color) || '#e2e8f0'; }
  const teamCols = ctx => (ctx.team && ctx.team.colors) || (Game.state && Game.state.career && Game.state.career.hs && LOCAL_TEAMS[Game.state.career.hs] && LOCAL_TEAMS[Game.state.career.hs].colors) || ['#f97316', '#111827'];
  function lookFor(who, ctx) {
    if (who === 'you') { const L = Object.assign({}, Game.state ? Engine.look(Game.state) : Art.DEFAULT_LOOK); if (ctx.team) { L.jersey = ctx.team.colors[0]; L.trim = ctx.team.colors[1]; } return L; }
    if (STORY.characters[who] && STORY.characters[who].look) return UI.charLook(who);
    const L = Art.lookFromSeed('cs-' + who), c = teamCols(ctx); return Object.assign(L, { jersey: c[0], trim: c[1], outfit: 'jersey' });
  }

  /* =================================================================
     PORTRAITS — avatar SVG → outlined pixel sprite, with blink + talk frames and rim-light masks
     ================================================================= */
  const VB = { face: [58, 8, 84, 104], bust: [40, 4, 120, 196], full: [20, 0, 160, 320] }, AVM = { face: 'portrait', bust: 'bust', full: 'full' };
  const BASE_H = { face: 196, bust: 150, full: 118 };
  const PORT = new Map(), DONE = new Map();
  function spriteize(src) {
    const w = src.width + 2, h = src.height + 2, [cv, g] = mk(w, h); g.drawImage(src, 1, 1);
    const [rR, gR] = mk(w, h), [rL, gL] = mk(w, h);
    try {
      const im = g.getImageData(0, 0, w, h), d = im.data, solid = new Uint8Array(w * h), mR = gR.createImageData(w, h), mL = gL.createImageData(w, h);
      for (let i = 0; i < w * h; i++) { solid[i] = d[i * 4 + 3] > 120 ? 1 : 0; d[i * 4 + 3] = solid[i] ? 255 : 0; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!solid[i]) { if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) { d[i * 4] = 10; d[i * 4 + 1] = 10; d[i * 4 + 2] = 18; d[i * 4 + 3] = 255; } continue; }
        if (x < w - 2 && (!solid[i + 1] || !solid[i + 2])) mR.data[i * 4 + 3] = 255;
        if (x > 1 && (!solid[i - 1] || !solid[i - 2])) mL.data[i * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0); gR.putImageData(mR, 0, 0); gL.putImageData(mL, 0, 0);
    } catch (e) { /* canvas not readable (very old browsers): plain sprite, no outline / rim light */ }
    return { cv, rimR: rR, rimL: rL };
  }
  function tint(src, col) { src._t = src._t || {}; if (src._t[col]) return src._t[col]; const [c, g] = mk(src.width, src.height); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return (src._t[col] = c); }
  const pkey = (look, expr, kind, h) => Art.hashStr(JSON.stringify(look)) + '|' + expr + '|' + kind + '|' + h;
  function portrait(look, expr, kind, h) {
    const key = pkey(look, expr, kind, h); if (PORT.has(key)) return PORT.get(key);
    const vb = VB[kind], w = Math.round(h * vb[2] / vb[3]), L = Object.assign({}, look, { expr });
    const one = o => Pixel.pixelate(Art.avatar(L, Object.assign({ mode: AVM[kind] }, o)), w, h).then(spriteize);
    const pr = Promise.all([one({}), one({ blink: true }), one({ talk: true })]).then(([base, blink, talk]) => {
      const at = (X, Y) => [1 + (X - vb[0]) / vb[2] * w, 1 + (Y - vb[1]) / vb[3] * h];
      const v = { base, blink, talk, w: w + 2, h: h + 2, eyes: [at(90, 64), at(110, 64)], temple: at(124, 50), head: at(100, 28), k: h / vb[3] }; DONE.set(key, v); return v;
    });
    PORT.set(key, pr); return pr;
  }
  const HL_H = 196;
  function prep(look) { if (!look || typeof Pixel === 'undefined') return Promise.resolve(); return Promise.all(['fierce', 'smile'].map(e => portrait(look, e, 'bust', HL_H))).catch(() => { }); }
  function ready(look) { return !!look && DONE.has(pkey(look, 'fierce', 'bust', HL_H)) && DONE.has(pkey(look, 'smile', 'bust', HL_H)); }

  /* =================================================================
     SCENES — parallax layers (WW × 216 each; world (0,0) = layer center)
     ================================================================= */
  const SCN = new Map();
  function layer(fn) { const [cv, g] = mk(WW, H); fn(g, (x, y, w, h, col) => P(g, x, y, w, h, col)); return cv; }
  function gradRows(px, y0, y1, stops) { for (let y = y0; y < y1; y++) { const k = (y - y0) / Math.max(1, y1 - y0) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(k)), f = k - i, A = stops[i], B = stops[i + 1]; px(0, y, WW, 1, `rgb(${Math.round(lerp(A[0], B[0], f))},${Math.round(lerp(A[1], B[1], f))},${Math.round(lerp(A[2], B[2], f))})`); } }
  function skyline(px, R, base, hmin, hmax, cols, lit, litCol = '#fbbf24') {
    for (let x = -6; x < WW;) { const w = 16 + R() * 34, h = hmin + R() * (hmax - hmin), col = cols[Math.floor(R() * cols.length)]; px(x, base - h, w, h, col);
      if (R() < .25) px(x + w / 2 - 1, base - h - 8, 2, 8, col);
      if (R() < .15) { px(x + 4, base - h - 10, 10, 8, col); px(x + 5, base - h - 2, 1, 2, col); px(x + 12, base - h - 2, 1, 2, col); }
      for (let wy = base - h + 4; wy < base - 4; wy += 5) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (R() < lit) px(wx, wy, 2, 2, R() < .85 ? litCol : '#7dd3fc');
      x += w + 1; }
  }
  /* a court floor seen from a low camera: perspective lines, paint, 3pt arc, light falloff */
  function courtFloor(px, g, HZ, cols, lineCol, opts = {}) {
    for (let y = HZ; y < H; y++) { const k = (y - HZ) / (H - HZ); px(0, y, WW, 1, k < .5 ? cols[0] : cols[1]); if (opts.wood && y % 3 === 0) for (let x = (y * 13) % 29; x < WW; x += 29 + (y % 7)) px(x, y, 1, 3, shade(cols[0], -.12)); }
    const vx = WW / 2, vy = HZ - 60;
    if (opts.paint) { g.fillStyle = opts.paint; g.globalAlpha = .55; g.beginPath(); g.moveTo(vx - 50, HZ + 7); g.lineTo(vx + 50, HZ + 7); g.lineTo(vx + 120, H); g.lineTo(vx - 120, H); g.fill(); g.globalAlpha = 1; }
    g.fillStyle = lineCol;
    [-700, -260, 260, 900].forEach(dx => { for (let y = HZ + 6; y < H; y++) { const k = (y - vy) / (H - vy); g.fillRect(Math.round(vx + dx * k), y, 1, 1); } });
    g.fillRect(0, HZ + 6, WW, 1);
    for (let a = Math.PI; a < Math.PI * 2; a += .006) { const x = vx + Math.cos(a) * 250, y = H + 30 + Math.sin(a) * 70; if (y > HZ + 6) g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    const lg = g.createLinearGradient(0, HZ, 0, H); lg.addColorStop(0, 'rgba(0,0,0,.25)'); lg.addColorStop(.4, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = lg; g.fillRect(0, HZ, WW, H - HZ);
  }
  function sideHoop(px, x, top, base, metal, net) {
    px(x, top, 4, base - top, '#1f2937'); px(x + 1, top, 1, base - top, '#475569'); px(x - 22, top + 4, 24, 3, '#1f2937');
    px(x - 27, top - 11, 6, 32, OUT); px(x - 26, top - 10, 4, 30, metal ? '#64748b' : '#e2e8f0');
    px(x - 46, top + 10, 20, 2, '#ea580c'); px(x - 46, top + 12, 20, 1, '#9a3412');
    if (net) for (let i = 0; i < 5; i++) px(x - 44 + i * 4, top + 13, 1, 9 - i % 2, '#e2e8f0');
  }
  function street(v) {
    const R = Art.seeded('cs-street-' + v), HZ = 150, night = v !== 'sunset';
    const sky = layer((g, px) => {
      if (v === 'sunset') gradRows(px, 0, HZ + 4, [[38, 22, 78], [118, 42, 108], [232, 92, 112], [255, 160, 104], [255, 214, 150]]);
      else if (v === 'rain') gradRows(px, 0, HZ + 4, [[6, 8, 16], [18, 22, 36], [34, 38, 56]]);
      else gradRows(px, 0, HZ + 4, [[5, 7, 24], [16, 20, 56], [56, 34, 88]]);
      if (v === 'sunset') {
        const cx = 400, cy = 132, r = 34;     // striped retro sun
        for (let dy = -r; dy <= 0; dy++) { const hw = Math.sqrt(r * r - dy * dy), y = cy + dy; if (dy > -14 && ((y - cy) % 5 + 5) % 5 < 2) continue; px(cx - hw, y, hw * 2, 1, dy < -22 ? '#fff4c2' : dy < -10 ? '#ffd97a' : '#ffb15c'); }
        for (let i = 0; i < 7; i++) { const x = R() * WW, y = 20 + R() * 70, w = 40 + R() * 80; px(x, y, w, 3, '#f9a8d4'); px(x + 8, y - 2, w - 24, 2, '#fbcfe8'); px(x + 4, y + 3, w - 10, 2, '#c2547e'); }
      } else if (v === 'night') {
        for (let i = 0; i < 160; i++) px(R() * WW, R() * 110, 1, 1, R() < .2 ? '#fde68a' : '#cbd5e1');
        px(470, 28, 14, 14, '#f1f5f9'); px(468, 30, 18, 10, '#f1f5f9'); px(474, 32, 3, 3, '#cbd5e1'); px(479, 37, 2, 2, '#cbd5e1');
      } else for (let i = 0; i < 12; i++) { const x = R() * WW, y = R() * 70; px(x, y, 120 + R() * 120, 10 + R() * 14, i % 2 ? '#141826' : '#1c2233'); }
    });
    const far = layer((g, px) => skyline(px, R, HZ, 26, 86, v === 'sunset' ? ['#3a1d4c', '#2f1842', '#44204f'] : ['#0a0f20', '#0f162e', '#121a36'], v === 'sunset' ? .06 : .32));
    const mid = layer((g, px) => {
      const top = 92;
      g.fillStyle = v === 'sunset' ? 'rgba(60,30,60,.55)' : 'rgba(120,140,170,.38)';
      for (let y = top; y < HZ + 2; y++) for (let x = 0; x < WW; x++) if ((x + y) % 7 === 0 || ((x - y) % 7 + 7) % 7 === 0) g.fillRect(x, y, 1, 1);
      px(0, top, WW, 2, v === 'sunset' ? '#4a2a4a' : '#64748b');
      for (let x = 10; x < WW; x += 70) px(x, top, 3, HZ - top + 2, v === 'sunset' ? '#3b2140' : '#475569');
      for (const lx of [150, 500]) { px(lx, 30, 3, HZ - 28, v === 'sunset' ? '#2a1830' : '#334155'); px(lx - 8, 28, 18, 4, '#1f2937'); px(lx - 6, 32, 14, 2, night ? '#fef3c7' : '#57534e'); }
      for (const tx of [40, 600]) { px(tx - 2, 70, 5, HZ - 68, '#2a1a1a'); for (let i = 0; i < 26; i++) px(tx - 20 + R() * 40, 40 + R() * 40, 10, 8, v === 'sunset' ? (R() < .5 ? '#3f1d3a' : '#4b2346') : (R() < .5 ? '#0b1a14' : '#0e2219')); }
    });
    const ground = layer((g, px) => {
      courtFloor(px, g, HZ, v === 'sunset' ? ['#6b4d5c', '#4a3846'] : v === 'rain' ? ['#1e232c', '#151920'] : ['#2b2f38', '#22252c'], v === 'sunset' ? 'rgba(255,226,200,.55)' : 'rgba(226,232,240,.4)');
      for (let i = 0; i < 9; i++) { let x = R() * WW, y = HZ + 8 + R() * 60; for (let k = 0; k < 26; k++) { px(x, y, 1, 1, 'rgba(0,0,0,.45)'); x += R() * 2.6 - 1; y += R() * 1.4 - .6; } }
      for (let i = 0; i < 700; i++) px(R() * WW, HZ + R() * (H - HZ), 1, 1, R() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.06)');
      if (v === 'rain') for (let i = 0; i < 10; i++) { const x = R() * WW, y = HZ + 14 + R() * 50, w = 20 + R() * 40; g.fillStyle = 'rgba(80,110,160,.35)'; g.beginPath(); g.ellipse(x, y, w, w * .16, 0, 0, 7); g.fill(); }
      sideHoop(px, 560, 68, HZ + 28, true, v === 'night');
    });
    const birds = [...Array(4)].map((_, i) => ({ x: -200 - i * 60, y: -70 + i * 9, s: 20 + i * 4 }));
    const motes = [...Array(30)].map(() => ({ x: rnd(-200, 200), y: rnd(-100, 100), s: rnd(3, 8), ph: rnd(0, 6) }));
    const rain = [...Array(150)].map(() => ({ x: rnd(0, 480), y: rnd(0, H), s: rnd(300, 420) }));
    return { layers: [[sky, .04], [far, .18], [mid, .5], [ground, 1]], HZ,
      back(c, S, at) {
        if (v === 'sunset') {   // god rays + birds
          at(.04); c.save(); c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .32 + Math.sin(S.t * .3 + i) * .05; c.fillStyle = `rgba(255,190,120,${.05 + .02 * Math.sin(S.t + i)})`; c.beginPath(); c.moveTo(80, 24); c.lineTo(80 + Math.cos(a - .06) * 400, 24 + Math.sin(a - .06) * 400); c.lineTo(80 + Math.cos(a + .06) * 400, 24 + Math.sin(a + .06) * 400); c.fill(); }
          c.restore();
          at(.1); birds.forEach(b => { const x = ((b.x + S.t * b.s) % 700) - 200, f = Math.floor(S.t * 6 + b.y) % 2; P(c, x, b.y, 1, 1, '#2a1830'); P(c, x - 2, b.y - f, 2, 1, '#2a1830'); P(c, x + 1, b.y - f, 2, 1, '#2a1830'); });
        }
        if (night) { at(.5); for (const lx of [150, 500]) { const x = lx - 320 + 1, fl = .85 + Math.sin(S.t * 30 + lx) * .05 + (Math.random() < .02 ? -.4 : 0), gr = c.createRadialGradient(x, -76, 2, x, -40, 120); gr.addColorStop(0, `rgba(255,236,170,${.35 * fl})`); gr.addColorStop(1, 'rgba(255,236,170,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.moveTo(x - 6, -76); c.lineTo(x + 70, 60); c.lineTo(x - 70, 60); c.fill(); c.restore(); for (let i = 0; i < 3; i++) P(c, x + Math.cos(S.t * 4 + i * 2) * 8, -70 + Math.sin(S.t * 5 + i) * 5, 1, 1, '#fef3c7'); } }
      },
      front(c, S, at) {
        if (v === 'sunset') { at(1); motes.forEach(m => { const x = m.x + Math.sin(S.t * .6 + m.ph) * 8, y = ((m.y - S.t * m.s + 300) % 216) - 108; P(c, x, y, 1, 1, 'rgba(255,230,180,.7)'); }); }
        if (v === 'rain') { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(186,210,240,.5)'; rain.forEach(r => { const y = (r.y + S.t * r.s) % (H + 10) - 5, x = ((r.x - S.t * r.s * .2) % (S.W + 40) + S.W + 40) % (S.W + 40) - 20; c.fillRect(Math.round(x), Math.round(y), 1, 5); if (y > 190 && Math.random() < .08) c.fillRect(Math.round(x) - 1, 210, 3, 1); }); }
      } };
  }
  function gym(ctx) {
    const R = Art.seeded('cs-gym'), HZ = 132, [c0, c1] = teamCols(ctx);
    const wall = layer((g, px) => {
      for (let y = 0; y < HZ; y += 5) for (let x = (y / 5 % 2) * 7 - 7; x < WW; x += 14) px(x, y, 13, 4, R() < .5 ? '#7c2d12' : '#8a3415');
      px(0, 0, WW, HZ, 'rgba(0,0,0,.25)');
      for (let i = 0; i < 5; i++) { const x = 60 + i * 120; px(x, 6, 70, 22, '#bfdbfe'); px(x + 2, 8, 66, 18, '#93c5fd'); for (let k = 0; k < 4; k++) px(x + k * 17 + 2, 8, 1, 18, '#64748b'); }
      for (let i = 0; i < 9; i++) { const x = 20 + i * 70; g.fillStyle = i % 2 ? c0 : c1; g.beginPath(); g.moveTo(x, 34); g.lineTo(x + 22, 34); g.lineTo(x + 11, 54); g.fill(); }
      px(286, 36, 68, 26, '#0b0f1c'); px(288, 38, 64, 22, '#111827'); Pixel.text(g, 'HOME', 296, 41, '#f87171'); Pixel.text(g, 'GUEST', 322, 41, '#f87171'); Pixel.text(g, '00', 299, 50, '#facc15'); Pixel.text(g, '00', 327, 50, '#facc15');
    });
    const crowd = []; for (let r = 0; r < 5; r++) for (let x = 6 + (r % 2) * 4; x < WW - 6; x += 7 + R() * 3) if (R() < .8) crowd.push({ x, y: 72 + r * 12, c: pick([c0, c0, c1, '#e5e7eb', '#475569', '#1f2937']), sk: pick(Art.SKINS), ph: R() * 6 });
    const bleach = layer((g, px) => { for (let r = 0; r < 5; r++) { const y = 74 + r * 12; px(0, y, WW, 3, '#a16207'); px(0, y + 3, WW, 1, '#713f12'); px(0, y + 4, WW, 8, '#3f2a14'); } });
    const floor = layer((g, px) => courtFloor(px, g, HZ, ['#d39a5d', '#c4874a'], 'rgba(254,243,199,.85)', { wood: true, paint: c0 }));
    const fg = layer((g, px) => { px(604, 0, 40, 216, shade(c0, -.3)); px(600, 0, 6, 216, c0); px(608, 30, 30, 4, c1); });
    return { layers: [[wall, .3], [bleach, .5], [floor, 1]], fg: [[fg, 1.5]], HZ,
      back(c, S, at) {
        at(.5); const ch = S.cheer;
        crowd.forEach(d => { const b = Math.max(0, Math.sin(S.t * (5 + ch * 6) + d.ph)) * (1 + ch * 3), x = d.x - 320, y = d.y - 108 - b; P(c, x - 2, y - 3, 5, 5, d.c); P(c, x - 1, y - 7, 3, 3, d.sk); if (ch > .3 && d.ph > 2) { P(c, x - 3, y - 9, 1, 3, d.sk); P(c, x + 3, y - 9, 1, 3, d.sk); } });
        at(.3); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = 60 + i * 120 - 320 + 35; c.fillStyle = 'rgba(191,219,254,.07)'; c.beginPath(); c.moveTo(x - 30, -100); c.lineTo(x + 30, -100); c.lineTo(x + 90, 40); c.lineTo(x + 10, 40); c.fill(); } c.restore();
      } };
  }
  function locker(ctx) {
    const HZ = 150, [c0, c1] = teamCols(ctx);
    const wall = layer((g, px) => {
      px(0, 0, WW, HZ, '#1f2937'); px(0, 0, WW, 16, '#111827'); for (let x = 30; x < WW; x += 120) px(x, 4, 60, 4, '#fef9c3');
      for (let x = 0; x < WW; x += 34) { px(x, 26, 32, HZ - 30, shade(c0, -.25)); px(x + 1, 27, 30, HZ - 32, c0); for (let k = 0; k < 4; k++) px(x + 8, 34 + k * 3, 16, 1, shade(c0, -.4)); px(x + 25, 80, 3, 8, '#cbd5e1'); Pixel.text(g, String(10 + x / 34 | 0), x + 12, 100, c1); }
      px(300, 52, 40, 52, '#f8fafc'); for (let k = 0; k < 8; k++) px(304, 62 + k * 5, 26 - (k % 3) * 5, 1, '#64748b'); px(318, 50, 4, 4, '#ef4444');
    });
    const floor = layer((g, px) => { for (let y = HZ; y < H; y += 6) for (let x = (y / 6 % 2) * 10; x < WW; x += 20) px(x, y, 19, 5, (x + y) % 3 ? '#475569' : '#3f4b5c'); px(0, HZ, WW, 2, '#0f172a');
      px(60, HZ + 26, 520, 6, '#a16207'); px(60, HZ + 32, 520, 2, '#713f12'); for (const x of [90, 320, 550]) px(x, HZ + 34, 4, 20, '#334155'); });
    return { layers: [[wall, .55], [floor, 1]], HZ };
  }
  function arena(ctx) {
    const R = Art.seeded('cs-arena'), HZ = 124, [c0, c1] = teamCols(ctx);
    const bowl = layer((g, px) => { px(0, 0, WW, HZ, '#04060c'); for (let t = 0; t < 4; t++) px(0, 38 + t * 26, WW, 2, '#1e293b');
      for (let i = 0; i < 8; i++) { const x = 30 + i * 80; px(x, 2, 16, 12, i % 2 ? c0 : '#e5e7eb'); Pixel.text(g, String(R() * 40 + 1 | 0), x + 8, 6, i % 2 ? c1 : c0, 1, 'center'); } });
    const crowd = []; for (let t = 0; t < 4; t++) for (let x = 2; x < WW; x += 4 + R() * 2) if (R() < .9) crowd.push({ x, y: 36 + t * 26, c: pick([c0, c0, c0, c1, '#e5e7eb', '#334155']), ph: R() * 6, sk: pick(Art.SKINS) });
    const floor = layer((g, px) => { courtFloor(px, g, HZ, ['#d6a066', '#c88e52'], 'rgba(254,243,199,.9)', { wood: true, paint: c0 });
      g.fillStyle = 'rgba(255,255,255,.10)'; for (const x of [140, 320, 500]) { g.beginPath(); g.ellipse(x, HZ + 30, 40, 6, 0, 0, 7); g.fill(); } });
    const fg = layer((g, px) => { for (let x = -4; x < WW; x += 13) { const h = 18 + (x * 7 % 9); g.fillStyle = '#05070d'; g.beginPath(); g.ellipse(x + 6, H - h + 10, 9, 12, 0, 0, 7); g.fill(); px(x, H - h + 14, 14, h, '#05070d'); } });
    return { layers: [[bowl, .25], [floor, 1]], fg: [[fg, 1.6]], HZ,
      back(c, S, at) {
        at(.25); const ch = S.cheer;
        crowd.forEach(d => { const b = Math.max(0, Math.sin(S.t * (4 + ch * 8) + d.ph)) * (.6 + ch * 3), x = d.x - 320, y = d.y - 108 - b; P(c, x, y, 3, 4, d.c); P(c, x + .5, y - 2, 2, 2, d.sk); if (ch > .4 && d.ph > 3) P(c, x - 1, y - 4, 1, 2, d.sk); });
        for (let i = 0; i < 2 + ch * 10; i++) if (Math.random() < .5) { const d = pick(crowd); P(c, d.x - 320, d.y - 112, 2, 2, '#ffffff'); if (Math.random() < .3) P(c, d.x - 321, d.y - 113, 4, 4, 'rgba(255,255,255,.5)'); if (ch > .3 && Math.random() < .05) SFX.play('shutter', .4); }   // camera flashes
        P(c, -40, -104, 80, 22, '#0b1220'); P(c, -38, -102, 76, 18, '#020617'); Pixel.text(c, S.ctx.score ? fill('{scoreline}', S.ctx) : 'DEFENSE!', 0, -96, Math.floor(S.t * 3) % 2 ? '#facc15' : '#f87171', 1, 'center');
        at(1); c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { const x = -260 + i * 170 + Math.sin(S.t * (.6 + ch) + i * 2) * 90, gr = c.createLinearGradient(0, -120, 0, 100); gr.addColorStop(0, `rgba(${i % 2 ? '200,220,255' : '255,230,170'},${.18 + ch * .1})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x - 6, -120); c.lineTo(x + 6, -120); c.lineTo(x + 60, 100); c.lineTo(x - 60, 100); c.fill(); }
        c.restore();
      } };
  }
  function hospital() {
    const R = Art.seeded('cs-hosp'), HZ = 160;
    const wall = layer((g, px) => { gradRows(px, 0, HZ, [[176, 196, 214], [140, 162, 184]]); px(0, HZ - 6, WW, 6, '#64748b');
      px(380, 26, 150, 92, '#1e293b'); px(384, 30, 142, 84, '#0b1226'); for (let i = 0; i < 40; i++) px(384 + R() * 142, 30 + R() * 50, 1, 1, '#fde68a'); for (let y = 30; y < 114; y += 6) px(384, y, 142, 2, 'rgba(148,163,184,.6)');
      px(200, 40, 50, 36, '#78350f'); px(203, 43, 44, 30, '#7dd3fc'); px(213, 55, 24, 18, '#16a34a'); });
    const kit = layer((g, px) => { px(130, 70, 70, 44, '#334155'); px(134, 74, 62, 32, '#020617'); px(150, 114, 4, 50, '#475569'); px(100, 20, 3, 150, '#94a3b8'); px(92, 24, 18, 26, 'rgba(186,230,253,.7)'); });
    const bed = layer((g, px) => { px(0, HZ, WW, H - HZ, '#94a3b8'); for (let x = 0; x < WW; x += 24) px(x, HZ, 1, H - HZ, '#a8b4c4');
      px(150, 140, 360, 60, '#e2e8f0'); px(150, 140, 360, 4, '#f8fafc'); px(160, 132, 90, 20, '#f1f5f9'); px(150, 196, 360, 6, '#64748b'); for (let x = 260; x < 500; x += 20) px(x, 128, 2, 14, '#cbd5e1'); px(260, 126, 240, 3, '#cbd5e1'); });
    const rain = [...Array(40)].map(() => ({ x: rnd(0, 142), y: rnd(0, 84), s: rnd(80, 120) }));
    return { layers: [[wall, .45], [kit, .7], [bed, 1]], HZ,
      back(c, S, at) {
        at(.45); c.fillStyle = 'rgba(147,197,253,.55)'; rain.forEach(r => c.fillRect(Math.round(r.x + 64), Math.round((r.y + S.t * r.s) % 84 - 78), 1, 3));
        at(.7); const ox = 134 - 320, oy = 74 - 108, ph = (S.t * 1.1) % 1; let lastY = 16;    // ECG on the monitor (beeps on each beat)
        for (let x = 0; x < 62; x++) { const u = (x / 62 + ph) % 1, y = u > .45 && u < .5 ? 16 - (u - .45) * 260 : u >= .5 && u < .55 ? 3 + (u - .5) * 400 : 16; P(c, ox + x, oy + Math.min(lastY, y), 1, Math.abs(lastY - y) + 1, x > 58 ? '#bbf7d0' : '#22c55e'); lastY = y; }
        if (Math.floor(S.t * 1.1) !== S._beat) { S._beat = Math.floor(S.t * 1.1); if (S.t > .2) SFX.play('beep'); }
      } };
  }
  function paper(kind, ctx) {
    const s = Game.state, last = s ? s.player.last.toUpperCase() : 'YOU', first = s ? s.player.first.toUpperCase() : '', [c0] = teamCols(ctx);
    const bg = layer((g, px) => { if (kind === 'list') { for (let x = 0; x < WW; x += 40) { px(x, 0, 38, H, shade(c0, -.2)); px(x + 2, 0, 34, H, c0); for (let k = 0; k < 5; k++) px(x + 10, 20 + k * 4, 18, 1, shade(c0, -.45)); } }
      else { px(0, 0, WW, H, '#5b3a1f'); for (let y = 0; y < H; y += 4) px(0, y, WW, 1, '#53351c'); } });
    const lines = kind === 'list' ? ['VARSITY ROSTER', '', 'HOLLIS', 'COLE', 'PIKE', 'MILES', last + (s ? ' #' + s.player.num : '')] : ['EHN SCOUT NOTES', '', `${first} ${last}`, 'RAW. COMPETITIVE.', 'LEFT HAND: A RUMOR', 'GETS BETTER WHEN', 'IT GETS HARDER'];
    return { layers: [[bg, .6]], HZ: 200,
      back(c, S, at) {
        at(1); const pw = 230, ph = 200, x0 = -pw / 2, y0 = -ph / 2; let pen = null;
        P(c, x0 + 4, y0 + 4, pw, ph, 'rgba(0,0,0,.4)'); P(c, x0, y0, pw, ph, kind === 'list' ? '#f8fafc' : '#fef08a');
        if (kind !== 'list') { for (let y = y0 + 30; y < y0 + ph; y += 16) P(c, x0, y, pw, 1, '#93c5fd'); P(c, x0 + 22, y0, 1, ph, '#f87171'); P(c, x0, y0, pw, 12, '#b45309'); }
        else P(c, -3, y0 - 4, 6, 6, '#ef4444');
        lines.forEach((ln, i) => { const t0 = i * .42 + .2, n = Math.floor(clamp((S.t - t0) / .03, 0, ln.length)), y = y0 + 18 + i * 16, x = x0 + 30;
          if (!n) return; const isMe = kind === 'list' ? i === lines.length - 1 : i === 2;
          if (isMe && n === ln.length) { const w = Pixel.textWidth(ln, 2); P(c, x - 3, y - 3, w + 6, 15, 'rgba(250,204,21,.7)'); }
          Pixel.text(c, ln.slice(0, n), x, y, i === 0 ? (kind === 'list' ? '#b91c1c' : '#7c2d12') : '#1e293b', 2); if (n < ln.length) pen = [x + Pixel.textWidth(ln.slice(0, n), 2) + 2, y + 6]; });
        if (kind !== 'list' && S.t > 3.1) { c.strokeStyle = '#dc2626'; c.lineWidth = 2; c.beginPath(); c.ellipse(x0 + 30 + 60, y0 + 18 + 5.5 * 16 + 4, 96, 24, -.05, 0, Math.min(1, (S.t - 3.1) * 2.5) * Math.PI * 2); c.stroke(); }
        if (pen && kind !== 'list') { P(c, pen[0], pen[1] - 22, 3, 22, '#1d4ed8'); P(c, pen[0], pen[1], 3, 3, '#0f172a'); }
      } };
  }
  function titleScene() { return { layers: [], HZ: 216, back(c, S) { c.setTransform(1, 0, 0, 1, 0, 0); const g = c.createRadialGradient(S.W / 2, H / 2, 10, S.W / 2, H / 2, S.W * .7); g.addColorStop(0, '#7c2d12'); g.addColorStop(.5, '#2a0f06'); g.addColorStop(1, '#05070d'); c.fillStyle = g; c.fillRect(0, 0, S.W, H);
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(S.W / 2, H / 2); c.rotate(S.t * .25); for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.fillStyle = i % 2 ? 'rgba(249,115,22,.10)' : 'rgba(250,204,21,.06)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(400, -40); c.lineTo(400, 40); c.fill(); } c.restore();
    for (let i = 0; i < 30; i++) { const a = i * 2.4 + S.t * .6, r = ((i * 37 + S.t * 60) % 260); P(c, S.W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r * .6, 1, 1, '#fde68a'); } } }; }
  function voidScene(col = '#05070d') { return { layers: [], HZ: 216, back(c, S) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = col; c.fillRect(0, 0, S.W, H); } }; }
  function vsScene() { return { layers: [], HZ: 216, back(c, S) { c.setTransform(1, 0, 0, 1, 0, 0); const W = S.W, sl = 30;
    c.fillStyle = '#7f1d1d'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W / 2 + sl, 0); c.lineTo(W / 2 - sl, H); c.lineTo(0, H); c.fill();
    c.fillStyle = '#1e3a8a'; c.beginPath(); c.moveTo(W / 2 + sl, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W / 2 - sl, H); c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = (S.t * 60) % 6; y < H; y += 6) c.fillRect(0, Math.round(y), W, 2);
    c.fillStyle = '#fde68a'; c.beginPath(); c.moveTo(W / 2 + sl + 3, 0); c.lineTo(W / 2 + sl + 7, 0); c.lineTo(W / 2 - sl + 7, H); c.lineTo(W / 2 - sl + 3, H); c.fill(); } }; }
  function sceneFor(id, ctx) {
    const key = id + '|' + teamCols(ctx).join(',');
    if (SCN.has(key)) return SCN.get(key);
    const S = id === 'street_sunset' ? street('sunset') : id === 'street_night' ? street('night') : id === 'rain_night' ? street('rain') : id === 'gym' ? gym(ctx) : id === 'locker' ? locker(ctx)
      : id === 'arena' ? arena(ctx) : id === 'hospital' ? hospital() : id === 'list' || id === 'notebook' ? paper(id, ctx) : id === 'title' ? titleScene() : id === 'vs' ? vsScene() : voidScene();
    if (!/list|notebook/.test(id)) SCN.set(key, S);     // the paper scenes use the player's name: always fresh
    return S;
  }
  /* court shots: the real 16-bit venue (cached) */
  const VEN = new Map();
  function courtVenue(def, ctx) {
    const d = def === '@venue' ? (ctx.venue && VENUES[ctx.venue] ? ctx.venue : 'college_arena') : def, us = { colors: teamCols(ctx), abbr: ctx.usAbbr || '', name: '' }, them = { colors: (ctx.them && ctx.them.colors) || ['#1e3a8a', '#e5e7eb'], abbr: ctx.themAbbr || '' };
    const key = JSON.stringify(d) + us.colors + them.colors; if (VEN.has(key)) return VEN.get(key);
    const V = Pixel.venue(d, us, them, 384); VEN.set(key, V); return V;
  }

  /* =================================================================
     SHOT STATE + DRAWING
     ================================================================= */
  function camAt(sh, k) {
    const K = sh.cam || [[0, 0, 0, 1], [1, 0, 0, 1]]; if (k <= K[0][0]) return { x: K[0][1], y: K[0][2], z: K[0][3] };
    for (let i = 1; i < K.length; i++) if (k <= K[i][0] || i === K.length - 1) { const A = K[i - 1], B = K[i], u = EASE[B[4] || 'io'](clamp((k - A[0]) / Math.max(.001, B[0] - A[0]), 0, 1)); return { x: lerp(A[1], B[1], u), y: lerp(A[2], B[2], u), z: lerp(A[3], B[3], u) }; }
  }
  function makeShot(sh, ctx, W, c) {
    const S = { sh, ctx, W, c, T: 0, t: 0, cam: { x: 0, y: 0, z: 1 }, shx: 0, shy: 0, shake: 0, flash: 0, flashCol: '#fff', impactUntil: -1, impCols: null, freezeUntil: -1, stopUntil: -1, cheer: 0, tr: 0,
      speed: sh.speed || null, grade: sh.grade || null, parts: [], evi: 0, actors: [], sp: {}, ball: { x: 192, y: 160, z: 0, holder: null, spin: 0 }, lightning: 0, now: 0, expr: {}, lastBlip: -999 };
    if (sh.court) { S.V = courtVenue(sh.court, ctx); S.R = Pixel.renderer(c, S.V); S.R.E.hype = .5; }
    else { S.scn = sceneFor(sh.scene || 'void', ctx); S.R = Pixel.renderer(c, { def: {}, crowd: [], lights: [], flags: [], W: 384, H: 216, street: true }); }
    S.fx = { impact: (ms = 160, cols) => { S.impactUntil = S.now + ms; S.impCols = cols || null; }, shake: n => { S.shake = Math.max(S.shake, n); }, flash: (col, a) => { S.flashCol = col; S.flash = a; } };
    (sh.cast || []).forEach(a => {
      const A = Object.assign({ blinkAt: rnd(.8, 2.4) }, a);
      if (a.kind === 'sprite') { const look = a.id === 'you' ? lookFor('you', ctx) : Art.lookFromSeed('cs-' + a.id + (a.team || 0)), cols = a.team ? ((ctx.them && ctx.them.colors) || ['#1e3a8a', '#e5e7eb']) : teamCols(ctx);
        const sp = Pixel.sprite(Object.assign({}, look, { num: a.id === 'you' && you() ? you().num : look.num }), cols, { x: a.x, y: a.y, i: S.actors.length }); sp.face = 1; S.sp[a.id] = sp; A.sp = sp; }
      S.actors.push(A);
    });
    return S;
  }
  const portH = (kind, W) => Math.round(BASE_H[kind] * (W < 300 ? .82 : 1));
  function needs(C, ctx, W) {   // every portrait frame a cutscene uses (preloaded before it starts)
    const out = [];
    C.shots.forEach(sh => (sh.cast || []).forEach(a => { if (!VB[a.kind]) return; const ex = new Set([a.expr || 'neutral']); (sh.ev || []).forEach(e => { if (e[1] === 'expr' && e[2] === a.id) ex.add(e[3]); }); ex.forEach(e => out.push([lookFor(a.id, ctx), e, a.kind, portH(a.kind, W)])); }));
    return out;
  }
  function at(S, d) {
    const z = 1 + (S.cam.z - 1) * d, zc = z * (S.V ? Math.max(1, S.W / 384) : 1);
    let cx = S.cam.x * d, cy = S.cam.y * d;
    if (S.V) { const hx = Math.max(0, 192 - S.W / 2 / zc), hy = Math.max(0, 108 - H / 2 / zc); cx = clamp(cx, -hx, hx); cy = clamp(cy, -hy, hy); }   // court shots never show past the venue edge
    S.c.setTransform(zc, 0, 0, zc, Math.round(S.W / 2 - cx * zc + S.shx * d), Math.round(H / 2 - cy * zc + S.shy * d));
  }
  const viewX = (S, A) => { let ux = A.x; if (A.move) { const [[t0, x0], [t1, x1]] = A.move; ux = lerp(x0, x1, EASE.io(clamp((S.T - t0) / (t1 - t0), 0, 1))); } return ux; };
  function drawPortrait(c, S, A) {
    const kind = A.kind, look = lookFor(A.id, S.ctx), expr = S.expr[A.id] || A.expr || 'neutral', P0 = DONE.get(pkey(look, expr, kind, portH(kind, S.W))); if (!P0) return;
    const t = S.t, blink = t > A.blinkAt && t < A.blinkAt + .12; if (t > A.blinkAt + .12) A.blinkAt = t + rnd(1.6, 3.6);
    const talk = S.talker === A.id && S.now - S.lastBlip < 80, F = talk ? P0.talk : blink ? P0.blink : P0.base;
    let ox = 0, oy = 0; if (A.from) { const k = EASE[A.from.ease || 'out'](clamp(S.T / (A.from.t || 500), 0, 1)); ox = (A.from.dx || 0) * (1 - k); oy = (A.from.dy || 0) * (1 - k); }
    const walking = A.walk && A.from && S.T < (A.from.t || 500), bob = walking ? (Math.floor(S.t * 7) % 2) : Math.round(Math.sin(S.t * 2 + A.x * 3) * .6);
    const x = Math.round(viewX(S, A) * S.W / 2 + ox - P0.w / 2), y = Math.round((A.y != null ? A.y : 109) + oy - P0.h + bob);
    at(S, A.d || 1);
    c.save(); if (A.flip) { c.translate(x * 2 + P0.w, 0); c.scale(-1, 1); }
    c.drawImage(A.sil ? tint(F.cv, '#0b0f1c') : F.cv, x, y);
    if (A.rim) c.drawImage(tint(A.sil ? F.rimL : F.rimR, A.rim), x, y);
    c.restore();
    if (A.sil) return;
    const fx = p => [A.flip ? x + P0.w - p[0] : x + p[0], y + p[1]], k = P0.k;
    if (expr === 'crying') for (let i = 0; i < 2; i++) { const [ex0, ey0] = fx(P0.eyes[i]), u = ((S.t * 1.3 + i * .45) % 1), sz = Math.max(2, Math.round(2 * k)); P(c, ex0 - sz / 2, ey0 + 3 * k + u * 40 * k, sz, sz + 1, '#7dd3fc'); }
    if (expr === 'shocked') { const [hx, hy] = fx(P0.head); for (let i = -1; i <= 1; i++) { const len = Math.round((7 - Math.abs(i) * 2) * Math.max(1, k)); P(c, hx + i * 12 * k, hy - 4 * k - len - Math.abs(i) * 3 * k, Math.max(1, Math.round(k)), len, '#f8fafc'); } }
    if (expr === 'angry') { const [tx, ty] = fx(P0.temple), s2 = Math.max(2, Math.round(2.5 * k)), pu = Math.sin(S.t * 10) > 0 ? 1 : 0;
      P(c, tx - s2 * 2 - pu, ty, s2 * 1.5, s2 * .6 + 1, '#ef4444'); P(c, tx + s2 * .5 + pu, ty, s2 * 1.5, s2 * .6 + 1, '#ef4444'); P(c, tx - s2 * .25, ty - s2 * 2 - pu, s2 * .6 + 1, s2 * 1.5, '#ef4444'); P(c, tx - s2 * .25, ty + s2 * .5 + pu, s2 * .6 + 1, s2 * 1.5, '#ef4444'); }
    if (A.sweat) { const [tx, ty] = fx(P0.temple); P(c, tx, ty + (S.t * 20 % 12), 2, 3, '#bae6fd'); }
  }
  function drawProp(c, S, A) {
    at(S, A.d || .9); const x = Math.round(viewX(S, A) * S.W / 2), y = A.y || 60;
    if (A.kind === 'car') { P(c, x - 52, y - 24, 104, 20, '#0b0b10'); P(c, x - 34, y - 38, 62, 16, '#0b0b10'); P(c, x - 30, y - 35, 26, 10, '#1e293b'); P(c, x, y - 35, 24, 10, '#1e293b'); P(c, x - 52, y - 12, 104, 2, '#334155');
      for (const wx of [-30, 30]) { P(c, x + wx - 9, y - 9, 18, 14, '#020203'); P(c, x + wx - 4, y - 4, 8, 4, '#64748b'); }
      P(c, x - 54, y - 20, 4, 4, '#fef3c7'); P(c, x + 50, y - 20, 3, 4, '#ef4444');
      if (A.lights) { c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(x - 54, y - 18, 2, x - 54, y - 18, 160); gr.addColorStop(0, 'rgba(255,248,220,.6)'); gr.addColorStop(1, 'rgba(255,248,220,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x - 54, y - 20); c.lineTo(x - 220, y - 60); c.lineTo(x - 220, y + 40); c.fill(); c.restore(); } }
    if (A.kind === 'ball') { S.R.ball(x, y - 3, false, viewX(S, A) * 30, 0); P(c, x - 3, y + 1, 7, 1, 'rgba(0,0,0,.4)'); }
  }
  function drawCourt(c, S, dt) {
    const R = S.R, V = S.V; R.E.t = S.t; R.E.cheer = Math.max(R.E.cheer, S.cheer);
    at(S, 1); c.translate(-192, -108); c.drawImage(V.bg, 0, 0); R.crowd(); R.hoop(false);
    const sps = S.actors.filter(a => a.sp).map(a => a.sp);
    sps.forEach(p => { p.hasBall = S.ball.holder === p; if (dt > 0) { if (p._lx != null) { p.vx = (p.x - p._lx) / dt; p.vy = (p.y - p._ly) / dt; } p._lx = p.x; p._ly = p.y; const sp = Math.hypot(p.vx, p.vy); p.phase += sp * dt * .21;
      if (p.hasBall) { const prev = p.dribT % 1; p.dribT += dt / (sp > 12 ? .38 : .5); if (prev < .5 && p.dribT % 1 >= .5 && !p.holdBall && (!p.act || p.act.type === 'move')) SFX.play('bounce', .7); } } });
    const items = sps.map(p => ({ y: p.y, d: () => R.player(p, {}) }));
    if (!S.ball.holder) items.push({ y: S.ball.y + .5, d: () => R.freeBall(S.ball, false) });
    items.sort((a, b) => a.y - b.y).forEach(i => i.d());
    R.hoop(true);
    const hang = sps.find(p => p.act && p.act.type === 'dunk' && p.act.t > .62); if (hang) R.player(hang, {});
    R.fx(dt); R.weather(dt); R.lights(); c.drawImage(V.vg, 0, 0);
  }
  const GRADE = { sunset: ['rgba(251,146,60,.16)', 'rgba(124,45,110,.18)'], night: ['rgba(30,58,138,.25)'], gold: ['rgba(250,204,21,.12)'], blue: ['rgba(30,64,175,.22)', 'rgba(2,6,23,.25)'], dark: ['rgba(0,0,0,.4)'], red: ['rgba(127,29,29,.3)'] };
  function grade(c, S) {
    c.setTransform(1, 0, 0, 1, 0, 0); const W = S.W, g = S.grade, frozen = S.now < S.freezeUntil;
    if (g === 'mono' || frozen) { c.globalCompositeOperation = 'saturation'; c.fillStyle = '#808080'; c.globalAlpha = g === 'mono' ? .85 : 1; c.fillRect(0, 0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    if (frozen) { c.globalCompositeOperation = 'color'; c.fillStyle = '#b45309'; c.globalAlpha = .45; c.fillRect(0, 0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 3) for (let x = (y / 3 % 2) * 2; x < W; x += 4) c.fillRect(x, y, 1, 1); }
    (GRADE[g] || []).forEach((col, i) => { if (i) { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; } else c.fillStyle = col; c.fillRect(0, 0, W, H); });
    if (g === 'red' || g === 'spot') { const gr = c.createRadialGradient(W / 2, H * .45, H * .2, W / 2, H * .45, W * .6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, g === 'red' ? 'rgba(127,29,29,.75)' : 'rgba(0,0,0,.85)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
    const vg = c.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  function speedLines(c, S) {
    c.setTransform(1, 0, 0, 1, 0, 0); const W = S.W, f = S.sh.focus || [.5, .45], mx = W * f[0], my = H * f[1], R = Art.seeded('sl' + Math.floor(S.now / 45));
    if (S.speed === 'h') { for (let i = 0; i < 26; i++) { const y = R() * H, x = R() * W, l = 30 + R() * 90; P(c, x, y, l, 1, `rgba(255,255,255,${.15 + R() * .3})`); } return; }
    c.strokeStyle = '#ffffff'; for (let i = 0; i < 46; i++) { const a = R() * 6.283, r1 = Math.min(W, H) * (.32 + R() * .25); c.globalAlpha = .2 + R() * .45; c.lineWidth = R() < .3 ? 2 : 1; c.beginPath(); c.moveTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); c.lineTo(mx + Math.cos(a) * W, my + Math.sin(a) * W); c.stroke(); }
    c.globalAlpha = 1;
  }
  /* 2-tone manga impact frame made from the current image (alternates every ~55ms) */
  function impactFrame(c, S) {
    c.setTransform(1, 0, 0, 1, 0, 0); const W = S.W, flip = Math.floor(S.now / 55) % 2, cols = S.impCols || ['#ffffff', '#0a0a12'];
    try {
      const im = c.getImageData(0, 0, W, H), d = im.data, [A, B] = cols.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
      for (let i = 0; i < d.length; i += 4) { const on = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11 > 96) !== !!flip, C = on ? A : B; d[i] = C[0]; d[i + 1] = C[1]; d[i + 2] = C[2]; }
      c.putImageData(im, 0, 0);
    } catch (e) { c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    const R = Art.seeded('imp' + Math.floor(S.now / 55)); c.fillStyle = flip ? cols[0] : cols[1];
    for (let i = 0; i < 30; i++) { const a = R() * 6.283, r = W * .3 + R() * W * .2; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); c.lineTo(W / 2 + Math.cos(a + .02) * W, H / 2 + Math.sin(a + .02) * W); c.lineTo(W / 2 + Math.cos(a - .02) * W, H / 2 + Math.sin(a - .02) * W); c.fill(); }
  }
  function particles(c, S, dt) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    S.parts.forEach(p => { p.x += p.vx * dt + Math.sin(S.t * 4 + p.ph) * 14 * dt; p.y += p.vy * dt; p.life -= dt; P(c, p.x, p.y, Math.sin(S.t * 8 + p.ph) > 0 ? 3 : 1, 2, p.col); });
    S.parts = S.parts.filter(p => p.life > 0 && p.y < H + 6);
  }
  function drawFrame(S, dt) {
    const c = S.c, sh = S.sh; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, S.W, H);
    if (S.V) drawCourt(c, S, dt);
    else { const sc = S.scn; sc.layers.forEach(([cv, d]) => { at(S, d); c.drawImage(cv, -WW / 2, -H / 2); }); if (sc.back) sc.back(c, S, d => at(S, d));
      S.R.E.t = S.t; S.actors.forEach(A => { if (VB[A.kind]) drawPortrait(c, S, A); else drawProp(c, S, A); });
      (sc.fg || []).forEach(([cv, d]) => { at(S, d); c.drawImage(cv, -WW / 2, -H / 2); }); if (sc.front) sc.front(c, S, d => at(S, d)); }
    if (S.lightning > .02) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(226,232,255,${S.lightning * .8})`; c.fillRect(0, 0, S.W, H); }
    particles(c, S, dt);
    grade(c, S);
    if (S.speed) speedLines(c, S);
    if (S.now < S.impactUntil) impactFrame(c, S);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (S.flash > .02) { c.globalAlpha = Math.min(1, S.flash); c.fillStyle = S.flashCol; c.fillRect(0, 0, S.W, H); c.globalAlpha = 1; }
    if (S.tr > .01) { const k = S.tr; if (sh.tr === 'flash') { c.fillStyle = `rgba(255,255,255,${k})`; c.fillRect(0, 0, S.W, H); } else if (sh.tr === 'wipe') { c.fillStyle = '#fff'; const x = (1 - k) * (S.W + 120) - 60; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x, H); c.lineTo(x - 60, H); c.fill(); } else { c.fillStyle = `rgba(0,0,0,${k})`; c.fillRect(0, 0, S.W, H); } }
    c.fillStyle = '#000'; c.fillRect(0, 0, S.W, 18); c.fillRect(0, H - 18, S.W, 18);   // letterbox
  }

  /* =================================================================
     PLAYER
     ================================================================= */
  const viewW = () => clamp(Math.round(H * innerWidth / Math.max(1, innerHeight) / 2) * 2, 240, 432);
  function mount(cls, W) {
    const root = document.createElement('div'); root.className = cls;
    root.innerHTML = `<canvas class="cs-cv" width="${W}" height="${H}"></canvas><div class="cs-title"></div><div class="cs-card"></div><div class="cs-score"></div><div class="cs-dialog"><b></b><p></p></div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const fit = () => { const k = Math.min(innerWidth / W, innerHeight / H), w = W * k, h = H * k, top = (innerHeight - h) / 2; Object.assign(cv.style, { width: w + 'px', height: h + 'px', left: (innerWidth - w) / 2 + 'px', top: top + 'px' });
      root.style.setProperty('--ct', top + 'px'); root.style.setProperty('--cb', (innerHeight - top - h) + 'px'); root.style.setProperty('--cl', (innerWidth - w) / 2 + 'px'); root.style.setProperty('--cw', w + 'px'); root.style.setProperty('--lb', (18 * k) + 'px');
      root.classList.toggle('below', innerHeight - (top + h) > 130); };
    fit(); addEventListener('resize', fit);
    return { root, c, fit, off: () => removeEventListener('resize', fit) };
  }
  async function play(id, ctx = {}) {
    const C = CUTSCENES[id]; if (!C || playing) return; playing = true;
    const s = Game.state;
    const W = viewW(), M = mount('cs', W), root = M.root, c = M.c, $ = q => root.querySelector(q);
    const block = e => { e.preventDefault(); e.stopPropagation(); }; addEventListener('keydown', block, true);   // unskippable: swallow keys while it plays
    requestAnimationFrame(() => root.classList.add('in'));
    await Promise.all(needs(C, ctx, W).map(n => portrait(...n))).catch(() => { });
    const dlg = $('.cs-dialog'), title = $('.cs-title'), card = $('.cs-card'), bug = $('.cs-score');
    try {
      for (const sh of C.shots) {
        const S = makeShot(sh, ctx, W, c);
        S.tr = sh.tr && sh.tr !== 'cut' ? 1 : 0;
        if (sh.music !== undefined) SFX.music(sh.music);
        // dialogue
        const line = sh.say ? fill(sh.say[1], ctx) : '', who = sh.say ? sh.say[0] : null, voice = who ? (CS_VOICE[who] || CS_VOICE.you) : null;
        let typed = 0, typedAt = 0; S.talker = who;
        if (sh.say) { dlg.className = 'cs-dialog on' + (who === 'narrator' ? ' narr' : ''); const b = dlg.querySelector('b'); b.textContent = who === 'narrator' ? '' : nameOf(who); b.style.setProperty('--nc', colorOf(who)); dlg.querySelector('p').textContent = ''; }
        else dlg.className = 'cs-dialog';
        title.className = 'cs-title'; title.innerHTML = ''; card.className = 'cs-card';
        const showTitle = T => { title.innerHTML = `<span>${esc(fill(T.text, ctx))}</span>${T.sub ? `<small>${esc(fill(T.sub, ctx))}</small>` : ''}`; title.className = 'cs-title ' + (T.style || 'slam'); void title.offsetWidth; title.classList.add('on'); };
        if (sh.score && ctx.score) { bug.innerHTML = `<span>${esc(ctx.usAbbr || 'US')}</span><b>${esc(ctx.score)}</b><span>${esc(ctx.themAbbr || 'THEM')}</span><i></i>`; bug.classList.add('on'); } else bug.classList.remove('on');
        const ev = (sh.ev || []).slice().sort((a, b) => a[0] - b[0]); let titled = !sh.title;
        const fire = e => { const [, k, a1, a2, a3] = e;
          if (k === 'sfx') SFX.play(a1, a2); else if (k === 'music') SFX.music(a1); else if (k === 'impact') S.fx.impact(a1, a2); else if (k === 'flash') S.fx.flash(a1, a2); else if (k === 'shake') S.fx.shake(a1);
          else if (k === 'expr') S.expr[a1] = a2; else if (k === 'title') showTitle({ text: a1, sub: a2, style: a3 }); else if (k === 'speed') S.speed = a1; else if (k === 'riser') SFX.play('riser', a1);
          else if (k === 'cheer') { S.cheer = 1; S.R.cheer(1, true); } else if (k === 'lightning') S.lightning = 1; else if (k === 'stop') S.stopUntil = S.now + a1;
          else if (k === 'confetti') { const cols = ['#f97316', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#fff'].concat(teamCols(ctx)); for (let i = 0; i < a1; i++) S.parts.push({ x: rnd(0, W), y: rnd(-H * .7, 0), vx: rnd(-14, 14), vy: rnd(24, 52), life: 6, col: pick(cols), ph: rnd(0, 6) }); }
          else if (k === 'score') { const i = bug.querySelector('i'); if (i) i.textContent = a1; }
          else if (k === 'freeze') { S.freezeUntil = S.now + a1; const o = a2 === 'you' ? youCard() : a2; card.innerHTML = `<small>${esc(fill(o.sub || '', ctx))}</small><b>${esc(fill(o.name, ctx))}</b><div>${(o.stats || []).map(([l, v]) => `<span><i>${esc(l)}</i><em style="--v:${v / 99}"></em><u>${v}</u></span>`).join('')}</div>`; card.className = 'cs-card'; void card.offsetWidth; card.classList.add('on'); SFX.play('whoosh'); setTimeout(() => card.classList.remove('on'), a1); } };
        let last = performance.now();
        await new Promise(res => {
          const tick = now => {
            const rdt = Math.min(.05, (now - last) / 1000); last = now; S.now = now;
            let k = now < S.freezeUntil || now < S.stopUntil ? 0 : typeof sh.slow === 'number' ? sh.slow : 1;
            if (Array.isArray(sh.slow)) sh.slow.forEach(([a, b, v]) => { if (S.T >= a && S.T < b && k) k = v; });
            const dt = rdt * k; S.T += dt * 1000; S.t = S.T / 1000;
            while (S.evi < ev.length && ev[S.evi][0] <= S.T) fire(ev[S.evi++]);
            if (!titled && S.T >= (sh.title.at || 0)) { titled = true; showTitle(sh.title); }
            S.cam = camAt(sh, clamp(S.T / sh.d, 0, 1));
            S.shake *= Math.pow(.01, rdt); S.flash *= Math.pow(.02, rdt); S.tr = Math.max(0, S.tr - rdt * 3.5); S.lightning *= Math.pow(.003, rdt); S.cheer = Math.max(0, S.cheer - rdt * .25);
            S.shx = S.shake > .3 ? Math.round(rnd(-1, 1) * S.shake) : 0; S.shy = S.shake > .3 ? Math.round(rnd(-1, 1) * S.shake) : 0;
            if (sh.play) sh.play(S, S.t, dt);
            drawFrame(S, dt);
            // typewriter + voice blips (real time)
            if (sh.say && typed < line.length) { const want = Math.min(line.length, typed + Math.max(1, Math.round(rdt * (who === 'narrator' ? 34 : 40)))); for (let i = typed; i < want; i++) if (i % 2 === 0 && /[a-z0-9]/i.test(line[i])) { SFX.play('blip', voice); S.lastBlip = now; } typed = want; dlg.querySelector('p').textContent = line.slice(0, typed); if (typed >= line.length) typedAt = now; }
            const readOk = !sh.say || (typed >= line.length && now - typedAt > Math.max(900, line.length * 18));
            if (S.T >= sh.d && readOk && now >= S.freezeUntil) return res();
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }
    } finally {
      M.off(); removeEventListener('keydown', block, true);
      root.classList.remove('in'); await sleep(450); root.remove(); playing = false;
    }
  }
  function youCard() {
    const s = Game.state; if (!s) return { name: 'YOU', stats: [] };
    const top = ATTRS.map(a => [a.s, Math.round(Engine.attr(s, a.k))]).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { name: `${s.player.first} ${s.player.last}`, sub: `${s.player.pos} · OVR ${Engine.ovrLabel ? Engine.ovrLabel(s) : Engine.ovr(s)}`, stats: top };
  }

  /* =================================================================
     MINI CUTSCENES — 2–3s anime cuts during games (tap / key to skip)
     o: { kind, look, name, caption, colors, look2, name2, colors2, sub, big }
     kinds: dunk · ankles · block · weapon · andone · three · buzzer · winner · run · huddle · faceoff
     ================================================================= */
  const MINI = { dunk: 2000, ankles: 2000, block: 1900, weapon: 2100, andone: 2000, three: 2000, buzzer: 2500, winner: 2300, run: 2300, huddle: 2400, faceoff: 2500 };
  let hlOn = false;
  async function highlight(o) {
    if (hlOn || playing || !o.look || !ready(o.look) || (o.look2 && !ready(o.look2))) return false; hlOn = true;
    const kind = o.kind || 'dunk', W = viewW(), M = mount('cs cs-hl in', W), c = M.c, title = M.root.querySelector('.cs-title');
    title.innerHTML = `<span>${esc(o.caption || '')}</span><small>${esc(o.name || '')}</small>`; title.className = 'cs-title slam hl' + (kind === 'faceoff' || kind === 'run' || kind === 'buzzer' ? ' mid' : '');
    setTimeout(() => title.classList.add('on'), kind === 'faceoff' ? 420 : 170);
    const skip = document.createElement('div'); skip.className = 'cs-tap'; skip.textContent = 'TAP TO SKIP'; M.root.appendChild(skip);
    const expr = kind === 'winner' || kind === 'run' || kind === 'andone' ? 'smile' : 'fierce';
    const Pt = DONE.get(pkey(o.look, expr, 'bust', HL_H)) || DONE.get(pkey(o.look, 'fierce', 'bust', HL_H)), P2 = o.look2 ? DONE.get(pkey(o.look2, 'fierce', 'bust', HL_H)) : null;
    const [c0, c1] = o.colors || ['#f97316', '#111827'], [d0] = o.colors2 || ['#1e3a8a', '#e5e7eb'];
    const T0 = performance.now(), DUR = MINI[kind] || 2000, S = { W, now: T0, sh: { focus: [.62, .45] }, speed: kind === 'block' ? 'h' : 'radial', impCols: kind === 'faceoff' ? ['#ffffff', '#7f1d1d'] : ['#ffffff', '#0a0a12'], c };
    SFX.play('whoosh'); setTimeout(() => SFX.play(kind === 'andone' ? 'whistle' : kind === 'buzzer' ? 'buzzer' : kind === 'huddle' ? 'page' : 'impact'), 150);
    if (kind === 'run' || kind === 'winner') setTimeout(() => SFX.play('roar'), 300); if (kind === 'faceoff') setTimeout(() => SFX.play('stinger'), 380);
    const bench = [...Array(6)].map((_, i) => ({ x: (i + .5) / 6, ph: i * 1.3 })), benchCol = Pixel.lum(c1) > .85 ? shade(c0, -.6) : c1;
    let end = false; const stop = e => { if (performance.now() - T0 > 250) { end = true; if (e) { e.preventDefault(); e.stopPropagation(); } } };
    M.root.addEventListener('pointerdown', stop); addEventListener('keydown', stop, true);
    const drawPort = (pt, x, y, flip, rim) => { c.save(); if (flip) { c.translate(x * 2 + pt.w, 0); c.scale(-1, 1); } c.drawImage(pt.base.cv, x, y); c.drawImage(tint(pt.base.rimR, rim), x, y); c.restore(); };
    await new Promise(res => {
      const tick = now => {
        const t = (now - T0) / 1000, k = t * 1000 / DUR; S.now = now;
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (kind === 'faceoff') {   // split screen: you vs them
          const sl = 30; c.fillStyle = shade(c0, -.3); c.beginPath(); c.moveTo(0, 0); c.lineTo(W / 2 + sl, 0); c.lineTo(W / 2 - sl, H); c.lineTo(0, H); c.fill();
          c.fillStyle = shade(d0, -.3); c.beginPath(); c.moveTo(W / 2 + sl, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W / 2 - sl, H); c.fill();
          if (Math.floor(t * 12) % 5 === 0) { c.strokeStyle = '#fde68a'; c.lineWidth = 2; c.beginPath(); let x = W / 2 + 10, y = 0; c.moveTo(x, y); while (y < H) { x += rnd(-14, 14); y += 18; c.lineTo(x, y); } c.stroke(); }
        } else if (kind === 'huddle') { c.fillStyle = '#0b1220'; c.fillRect(0, 0, W, H); c.fillStyle = shade(c0, -.5); c.fillRect(0, H * .62, W, H); c.fillStyle = '#e2e8f0'; c.fillRect(W * .08, H * .2, W * .26, H * .34); c.strokeStyle = '#ef4444'; c.lineWidth = 2; c.beginPath(); c.arc(W * .16, H * .34, 6, 0, 7); c.moveTo(W * .2, H * .3); c.lineTo(W * .28, H * .42); c.stroke(); c.fillStyle = '#2563eb'; c.fillRect(W * .25, H * .26, 4, 4); }
        else { c.fillStyle = shade(c0, -.45); c.fillRect(0, 0, W, H); c.fillStyle = c0; c.beginPath(); c.moveTo(W * .35, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W * .15, H); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = (t * 120) % 8; y < H; y += 8) c.fillRect(0, Math.round(y), W, 2);
        if (kind !== 'huddle') speedLines(c, S);
        if (kind === 'weapon') { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const r = ((t * 140 + i * 40) % 160); c.strokeStyle = `rgba(${o.mine === false ? '239,68,68' : '250,204,21'},${.5 - r / 340})`; c.lineWidth = 3; c.beginPath(); c.ellipse(W * .62, H * .55, r * 1.3, r * .7, 0, 0, 7); c.stroke(); } c.restore(); }
        if (kind === 'three') { c.strokeStyle = '#fde68a'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); const e = clamp(t / 1.1, 0, 1); for (let u = 0; u <= e; u += .02) { const x = W * .05 + u * W * .85, y = H * .85 - Math.sin(u * Math.PI) * H * .7; u ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.setLineDash([]); P(c, W * .88, H * .2, 20, 2, '#ea580c'); P(c, W * .92, H * .08, 2, 14, '#e2e8f0'); if (e < 1) { const x = W * .05 + e * W * .85, y = H * .85 - Math.sin(e * Math.PI) * H * .7; S.R0 = S.R0 || Pixel.renderer(c, { def: {}, crowd: [], lights: [], flags: [], W: 384, H: 216, street: true }); S.R0.ball(x, y, false, t * 20, 0); } }
        if (kind === 'buzzer' || kind === 'winner') { const blink = Math.floor(t * 6) % 2; P(c, 14, 22, 70, 34, '#020617'); Pixel.text(c, '0.0', 49, 28, blink ? '#ef4444' : '#7f1d1d', 4, 'center'); }
        if (kind === 'run') { Pixel.text(c, o.sub || 'RUN', W * .3, H * .18, '#fde68a', 5, 'center', '#000'); }
        if (kind === 'ankles' && t < 1.6) { S.R0 = S.R0 || Pixel.renderer(c, { def: {}, crowd: [], lights: [], flags: [], W: 384, H: 216, street: true }); const sp = S.vic = S.vic || Pixel.sprite(Art.lookFromSeed(o.name2 || 'defender'), o.colors2 || ['#1e3a8a', '#e5e7eb'], { x: 0, y: 0 }); sp.act = { type: t < .5 ? 'stumble' : 'sit', t: t < .5 ? t : t - .5, T: 2 }; S.R0.E.t = t; c.save(); c.translate(W * .2, H * .82); c.scale(3, 3); sp.x = 0; sp.y = 0; S.R0.player(sp, {}); c.restore(); }
        if (kind === 'faceoff') { if (Pt) { const e = EASE.back(clamp(t / .3, 0, 1)); drawPort(Pt, Math.round(W * .25 - Pt.w / 2 - (1 - e) * 160), H - Pt.h + 6, false, '#fde68a'); } if (P2) { const e = EASE.back(clamp((t - .12) / .3, 0, 1)); drawPort(P2, Math.round(W * .75 - P2.w / 2 + (1 - e) * 160), H - P2.h + 6, false, '#fca5a5'); } if (t > .38) Pixel.text(c, 'VS', W / 2, H * .38, '#fde68a', 5, 'center', '#000'); }
        else if (kind === 'huddle') { if (Pt) drawPort(Pt, Math.round(W * .62 - Pt.w / 2), H - Pt.h + 6 + Math.round(Math.sin(t * 2)), false, '#93c5fd'); for (let i = 0; i < 4; i++) { const x = W * (.1 + i * .27), y = H - 26; P(c, x - 9, y, 18, 30, c0); P(c, x - 6, y - 12, 12, 12, '#1f2937'); } }
        else {
          if (kind === 'dunk' || kind === 'run' || kind === 'winner' || kind === 'andone') bench.forEach(b => { const hop = Math.abs(Math.sin(t * 9 + b.ph)) * 10, x = b.x * W, y = H - 30 - hop; P(c, x - 7, y, 14, 30, benchCol); P(c, x - 5, y - 10, 10, 10, '#1f2937'); P(c, x - 10, y - 14, 3, 12, '#1f2937'); P(c, x + 7, y - 14, 3, 12, '#1f2937'); });
          if (Pt) {   // camera: slide in, then a quick cut to a close-up on the face
            const cut = k > .55 && kind !== 'run', ent = EASE.back(clamp(t / .28, 0, 1)), x = Math.round(W * .62 - Pt.w / 2 + (1 - ent) * 200), y = H - Pt.h + 6 + Math.round(Math.sin(t * 3));
            if (cut) { c.save(); const z = 1.6 + (k - .55) * .4, fx = W * .62, fy = y + Pt.h * .3; c.translate(fx, H * .48); c.scale(z, z); c.translate(-fx, -fy); drawPort(Pt, x, y, false, '#fde68a'); c.restore(); if (k < .6) { c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(0, 0, W, H); } }
            else drawPort(Pt, x, y, false, kind === 'block' ? '#bae6fd' : '#fde68a');
          }
        }
        if ((t > .14 && t < .26) || (kind === 'faceoff' && t > .4 && t < .5)) impactFrame(c, S);
        const out = (DUR - 140) / 1000;
        if (t < .12 || t > out || end) { const k2 = t < .12 ? 1 - t / .12 : end ? 1 : (t - out) / .14, x = W * (t < .12 ? 1 - k2 : k2) * 1.4 - W * .2; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - 80, 0); c.lineTo(x + 80, 0); c.lineTo(x - 20, H); c.lineTo(x - 180, H); c.fill(); }
        c.fillStyle = '#000'; c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14);
        if (end || t * 1000 >= DUR) return res(); requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    removeEventListener('keydown', stop, true); M.off(); M.root.remove(); hlOn = false; return true;
  }

  return { play, highlight, prep, ready, get playing() { return playing; } };
})();
