/* =====================================================================
   DATA-STORY-CH5-SCENES.JS — Chapter 5's cinematics, built for your career (CH5S.x(s, ctx) → a CUTSCENES id):
   the arrival, the star at your position, the DNP montage, the star going down, the confrontation with Kai (the
   Rivalry System), the sneaker brand (the Signature Shoe), the falling out with Nia, the trade, the knee, Lou's warning,
   your first series win, the award cinematics, "Next time…" — and the scripted endings: your first start (30 points,
   JAM_SCRIPTS.c5_thirty) and your first playoff series clincher (JAM_SCRIPTS.c5_series).
   The Injury Arc: the knee on national TV (JAM_SCRIPTS.c5_knee_out, no rally), the bed, Kai's visit, Lou's chair (or
   his call), the GET UP rehab montage and the awakening (Slow Burn).
   ===================================================================== */
const CH5S = (() => {
  const T = id => NBL_TEAMS[id] || { name: '', abbr: '', colors: ['#1e3a8a', '#f8fafc', '#facc15'] };
  const SP = (id, x, y, team) => Object.assign({ id, kind: 'sprite', x, y }, team ? { team } : {});
  const def = (id, cs) => { CUTSCENES[id] = cs; return id; };
  const myT = s => T(s.pro ? s.pro.team : s.career.nblTeam);
  const vetLook = s => { const t = myT(s); return { vetstar: Object.assign({}, STORY.characters.vetstar.look, { jersey: t.colors[0], trim: t.colors[1] }) }; };

  function arrival(s, ctx) {
    const t = myT(s);
    return def('_c5_arrival', { name: 'The League', chapter: 'Chapter 5', shots: [
      { d: 2400, scene: 'sky', music: 'build', tr: 'fade', cam: [[0, -20, 0, 1.1], [1, 20, 0, 1.18]], cast: [{ id: 'plane', kind: 'plane', x: 0, y: 10, d: 1 }], title: { text: (t.cityName || t.city || 'THE CITY').toUpperCase(), sub: 'Rookie season', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
      { d: 2600, scene: 'arena_ext', grade: 'night', cam: [[0, -40, -14, 1.06], [1, 20, -10, 1.16, 'lin']], title: { text: t.name.toUpperCase(), sub: 'Your arena now', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'crowd', .8]] },
      { d: 2800, scene: 'locker', grade: 'spot', cam: [[0, 0, 10, 1.15], [1, 0, 14, 1.3, 'io']], cast: [{ id: 'jersey', kind: 'jersey', x: 0, y: 60, s: 3, num: String(s.player.num), d: 1 }], say: ['narrator', 'Your locker. Your number. Spelled right.'], ev: [[300, 'sfx', 'riser', 2]] },
    ] });
  }
  function meetVet(s, ctx) {
    ctx.looks = Object.assign(ctx.looks || {}, vetLook(s));
    return def('_c5_vet', { name: 'Behind Him', chapter: 'Chapter 5', shots: [
      { d: 3000, scene: 'gym', grade: 'blue', music: 'story', cam: [[0, -20, 4, 1.12], [1, 0, 0, 1.22]], cast: [{ id: 'vetstar', kind: 'actor', x: .22, y: 72, s: 2.8, ball: true, face: -1 }, { id: 'you', kind: 'actor', x: -.3, y: 74, s: 2.7, face: 1 }],
        say: ['narrator', 'First practice. The guy at your position has six All-Star jackets in his closet.'] },
      { d: 2800, scene: 'gym', grade: 'blue', cam: [[0, 18, -2, 1.24], [1, 22, 2, 1.34]], cast: [{ id: 'vetstar', kind: 'bust', x: .3, expr: 'smile', rim: '#facc15' }, { id: 'you', kind: 'bust', x: -.7, y: 130, sil: true, rim: '#93c5fd', d: 1.2 }],
        say: ['vetstar', 'You\'re the kid who slid. Good. Hungry guys learn faster.'] },
    ] });
  }
  function dnp(s, ctx) {
    return def('_c5_dnp', { name: 'DNP', chapter: 'Chapter 5', shots: [
      { d: 2800, scene: 'arena', grade: 'night', music: null, cam: [[0, -30, 4, 1.1], [1, 10, 6, 1.18, 'lin']], cast: [{ id: 'bench', kind: 'bench', x: -.05, y: 74, s: 2.8, w: 46, d: 1 }, { id: 'you', kind: 'actor', x: -.08, y: 74, s: 2.8, acts: [[0, 'bench', 99]] }, { id: 'tw', kind: 'towel', x: -.04, y: 2, s: 2.2 }],
        title: { text: 'DNP — COACH\'S DECISION', style: 'line', at: 600 }, ev: [[0, 'cheer']] },
      { d: 2400, scene: 'void', grade: 'blue', bars: 40, cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }], ev: [[0, 'sfx', 'heartbeat']] },
    ] });
  }
  function vetHurt(s, ctx) {
    ctx.looks = Object.assign(ctx.looks || {}, vetLook(s));
    return def('_c5_vethurt', { name: 'The Opening', chapter: 'Chapter 5', shots: [
      { d: 2600, court: '@venue', music: 'build', cam: [[0, 0, 10, 1.6], [1, 0, 6, 1.8]], cast: [SP('vet', 200, 140), SP('d1', 220, 130, 1)], slow: [[600, 2400, .35]],
        say: ['narrator', 'Second quarter. {vetShort} plants on a crossover, and something pops.'], ev: [[900, 'sfx', 'crack'], [900, 'shake', 6], [900, 'drain', .7, 600]],
        play(S2, tm) { const v = S2.sp.vet; v.act = tm > .9 ? { type: 'down', t: Math.min(.9, tm - .9) } : null; v.face = 1; } },
      { d: 2600, scene: 'arena', grade: 'dark', drain: .6, music: null, cam: [[0, 0, 4, 1.2], [1, 0, 8, 1.32]], cast: [{ id: 'vetstar', kind: 'actor', x: .1, y: 74, s: 2.8, acts: [[0, 'down', 99]] }, { id: 'trainer', kind: 'actor', x: -.12, y: 74, s: 2.7, acts: [[0, 'kneel', 99]] }],
        say: ['narrator', 'The arena goes quiet. Every head on the bench turns to you.'] },
      { d: 2400, scene: 'void', grade: 'red', bars: 50, cam: [[0, 0, 8, 1.32], [1, 0, 12, 1.46]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#facc15' }], ev: [[600, 'glint', 'you'], [600, 'sfx', 'sting']] },
    ] });
  }
  function confront(s, ctx) {
    return def('_c5_confront', { name: 'The Tunnel', chapter: 'Chapter 5', shots: [
      { d: 2800, scene: 'tunnel', grade: 'red', music: 'clutch', cam: [[0, -10, 4, 1.14], [1, 6, 4, 1.26]], cast: [{ id: 'kai', kind: 'actor', x: .3, y: 74, s: 2.9, face: -1, path: [[0, .6], [1400, .2]], acts: [[1500, 'argue', 99]] }, { id: 'you', kind: 'actor', x: -.2, y: 74, s: 2.9, face: 1, acts: [[1700, 'argue', 99]] }],
        say: ['narrator', 'Post-game. Kai walks straight past his own bench and finds you in the tunnel.'], ev: flashes(6, 900, 250) },
      { d: 2600, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial', cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'fierce', from: { dx: 160, t: 300, ease: 'back' }, rim: '#fca5a5' }, { id: 'you', kind: 'bust', x: -.55, expr: 'fierce', from: { dx: -160, t: 300, ease: 'back' }, rim: '#93c5fd' }],
        title: { text: 'RIVALRY', sub: 'Every camera got it', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 10]] },
    ] });
  }
  const flashes = (n, t0, gap) => [...Array(n)].map((_, i) => [t0 + i * gap, 'flash', '#ffffff', .18]);
  function shoeMeet(s, ctx) {
    return def('_c5_shoe', { name: 'Strato', chapter: 'Chapter 5', shots: [
      { d: 2600, scene: 'city', grade: 'blue', music: 'build', tr: 'fade', cam: [[0, -30, -10, 1.06], [1, 20, -14, 1.16]], title: { text: 'STRATO ATHLETIC', sub: 'Forty floors up', style: 'loc', at: 300 } },
      { d: 3200, scene: 'locker', grade: 'spot', cam: [[0, 16, -2, 1.2], [1, 20, 2, 1.3]], cast: [{ id: 'brand', kind: 'bust', x: .3, expr: 'smile', rim: '#f472b6' }, { id: 'priya', kind: 'bust', x: -.66, y: 132, expr: 'smile', rim: '#22d3ee', d: 1.1 }],
        say: ['brand', 'Mood boards, foam prototypes, your number on everything.'] },
      { d: 2800, scene: 'title', music: 'victory', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.04, 'snap']], speed: 'radial', cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#f472b6', from: { dy: 50, t: 400, ease: 'back' } }],
        title: { text: 'SIGNATURE SHOE', sub: 'Your name. On a shoe.', style: 'slam', at: 300 }, ev: [[300, 'impact', 150], [300, 'sfx', 'stinger'], [500, 'confetti', 80]] },
    ] });
  }
  function niaFight(s, ctx) {
    return def('_c5_nia', { name: 'Halsey Edition', chapter: 'Chapter 5', shots: [
      { d: 3000, scene: 'home', grade: 'night', music: null, rot: -.05, cam: [[0, 0, 4, 1.16], [1, 0, 8, 1.26]], cast: [{ id: 'nia', kind: 'actor', x: .22, y: 72, s: 2.8, face: -1, acts: [[300, 'argue', 99]] }, { id: 'you', kind: 'actor', x: -.2, y: 72, s: 2.8, face: 1 }],
        say: ['nia', 'You\'re on a billboard on Halsey Street. Did you know that?', 'fierce'], ev: [[0, 'sfx', 'thud', .5]] },
      { d: 2400, scene: 'void', grade: 'blue', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'nia', kind: 'face', x: 0, expr: 'sad', rim: '#c084fc' }], ev: [[0, 'sfx', 'piano']] },
    ] });
  }
  function traded(s, ctx) {
    const t = myT(s);
    return def('_c5_traded', { name: 'Traded', chapter: 'Chapter 5', shots: [
      { d: 2400, scene: 'airport', grade: 'night', music: 'story', tr: 'fade', cam: [[0, -20, 0, 1.1], [1, 10, 0, 1.18]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 2.7, path: [[0, -.5], [2400, .3]] }], title: { text: 'TRADED', sub: t.name, style: 'loc', at: 300 } },
      { d: 2600, scene: 'locker', grade: 'spot', cam: [[0, 0, 10, 1.15], [1, 0, 14, 1.3, 'io']], cast: [{ id: 'jersey', kind: 'jersey', x: 0, y: 60, s: 3, num: String(s.player.num), d: 1 }], say: ['narrator', 'A new jersey. Teammates whose names you\'re still learning.'] },
    ] });
  }
  function knee(s, ctx) {
    return def('_c5_knee', { name: 'The Knee', chapter: 'Chapter 5', minor: true, shots: [
      { d: 2600, scene: 'locker', grade: 'blue', music: null, cam: [[0, 0, 26, 1.2], [1, 0, 30, 1.34]], cast: [{ id: 'you', kind: 'hand', x: 0, y: 150, s: 3.2, curl: .3, tape: '#f8fafc' }], say: ['narrator', 'An ice bag on the left knee. Third night in a row.'], ev: [[300, 'sfx', 'heartbeat']] },
    ] });
  }
  function louWarn(s, ctx) {
    return def('_c5_lou', { name: 'Lou', chapter: 'Chapter 5', shots: [
      { d: 3000, scene: 'street_sunset', sepia: true, music: 'lou', tr: 'fade', cam: [[0, 0, 4, 1.14], [1, 0, 8, 1.24]], cast: [{ id: 'lou', kind: 'bust', x: .3, expr: 'determined', rim: '#fdba74' }],
        say: ['lou', '(years ago, Halsey Street) Highlight players play three. Fundamentals players play fifteen.'] },
      { d: 2400, scene: 'void', grade: 'dark', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'neutral', rim: '#93c5fd' }], title: { text: 'Highlight players play three.', style: 'line', at: 500 }, ev: [[0, 'sfx', 'heartbeat']] },
    ] });
  }
  function seriesWon(s, ctx) {
    return def('_c5_series_won', { name: 'Four Wins', chapter: 'Chapter 5', shots: [
      { d: 3000, scene: 'locker', grade: 'gold', music: 'victory', cam: [[0, 0, 6, 1.14], [1, 0, 10, 1.24]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 2.9, acts: [[0, 'joy', 99]] }, { id: 'pcoach', kind: 'actor', x: .32, y: 74, s: 2.7, acts: [[0, 'clap', 99]] }],
        title: { text: 'FIRST ROUND', sub: 'Series won', style: 'slam', at: 400 }, ev: [[400, 'confetti', 140], [400, 'sfx', 'roar'], [400, 'cheer']] },
      { d: 2400, scene: 'void', grade: 'gold', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'smile', rim: '#fde68a' }], say: ['narrator', 'Sixteen wins to a ring. You\'ve got four.'] },
    ] });
  }
  /* an award cinematic: the spotlight, the trophy, your name */
  function award(s, id, name) {
    return def('_c5_award', { name, chapter: 'Awards', shots: [
      { d: 2200, scene: 'arena', grade: 'spot', music: null, cam: [[0, 0, -6, 1.1], [1, 0, -2, 1.2]], say: ['commish', `And the ${name} goes to…`], ev: [[0, 'sfx', 'heartbeat'], [1200, 'sfx', 'heartbeat']] },
      { d: 3000, scene: 'title', music: 'victory', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.06, 'snap']], speed: 'radial', cast: [{ id: 'you', kind: 'bust', x: -.3, expr: 'smile', rim: '#facc15', from: { dy: 50, t: 400, ease: 'back' } }, { id: 'tr', kind: 'trophy', x: .38, y: 96, s: 3.2, d: 1 }],
        title: { text: name.toUpperCase(), sub: `${s.player.first} ${s.player.last} · Season ${s.pro ? s.pro.n : 1}`, style: 'slam', at: 300 }, ev: [[300, 'impact', 150], [300, 'sfx', 'stinger'], [300, 'flash', '#fde68a', .5], [500, 'confetti', 120], [500, 'cheer']] },
    ] });
  }
  function nextHalf(s, ctx) {
    return def('_c5_next', { name: 'Next time', chapter: 'Chapter 5', shots: [
      { d: 1100, scene: 'void', music: null, title: { text: 'NEXT TIME…', style: 'next', at: 0 }, ev: [[0, 'sfx', 'whoosh']] },
      { d: 2600, scene: 'arena', grade: 'red', tr: 'flash', speed: 'h', drain: .6, cam: [[0, -14, 0, 1.15], [1, 12, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'hand', x: 0, y: 150, s: 3.2, curl: .3, tape: '#f8fafc' }], say: ['narrator', 'A packed arena. A breakaway. A knee that\'s been humming all year.'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 2000, scene: 'void', title: { text: 'The Injury Arc', sub: 'Next time on Hoop Dreams', style: 'next2', at: 80 }, ev: [[80, 'sfx', 'sting']] },
    ] });
  }

  /* ---------- ARC 3 · THE INJURY ARC ---------- */
  const kaiLook = s => { const k = T(s.pro && s.pro.kaiTeam); return { kai: Object.assign({}, STORY.characters.kai.look, { jersey: k.colors[0], trim: k.colors[1] }) }; };
  const youngLou = { skin: '#6b3d25', hair: 'fade', hairColor: '#111', outfit: 'jersey', jersey: '#1d4ed8', trim: '#ef4444', num: 4 };
  function injured(s, ctx) {
    return def('_c5_injured', { name: 'The Bed', chapter: 'Chapter 5', shots: [
      { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'MRI · 2:40 a.m.', style: 'line', at: 300 }, ev: [[200, 'sfx', 'beep'], [800, 'sfx', 'beep'], [1400, 'sfx', 'beep']] },
      { d: 3200, scene: 'hospital', grade: 'blue', drain: .5, music: 'sad', cam: [[0, -20, 8, 1.15], [1, 0, 4, 1.24, 'lin']], cast: [{ id: 'trainer', kind: 'bust', x: .05, y: 128, expr: 'sad', rim: '#93c5fd' }],
        say: ['trainer', 'Torn ACL. The season\'s over.'] },
      { d: 2600, scene: 'hospital', grade: 'blue', drain: .5, cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'crying', rim: '#93c5fd' }], ev: [[0, 'sfx', 'piano']] },
    ] });
  }
  function kaiVisit(s, ctx) {
    ctx.looks = Object.assign(ctx.looks || {}, kaiLook(s));
    return def('_c5_kai_visit', { name: 'Visiting Hours', chapter: 'Chapter 5', shots: [
      { d: 3000, scene: 'hospital', grade: 'night', music: null, tr: 'fade', cam: [[0, -20, 4, 1.12], [1, 0, 6, 1.2]], cast: [{ id: 'kai', kind: 'actor', x: .7, y: 74, s: 2.8, face: -1, path: [[0, .8], [1800, .28]] }],
        say: ['narrator', 'Day three. Visiting hours are over. Somebody walks in anyway.'], ev: [[0, 'sfx', 'thud', .4]] },
      { d: 2800, scene: 'hospital', grade: 'night', music: 'story', cam: [[0, 16, -2, 1.2], [1, 20, 2, 1.3]], cast: [{ id: 'kai', kind: 'bust', x: .3, expr: 'neutral', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.66, y: 132, expr: 'sad', rim: '#93c5fd', d: 1.1 }],
        say: ['kai', 'Kai Sterling. In a hospital. On an off day.'] },
    ] });
  }
  function louVisit(s, ctx) {   // Lou's hospital (Chapter 2), mirrored: this time he's in the chair, you're in the bed
    return def('_c5_lou_visit', { name: 'The Chair', chapter: 'Chapter 5', shots: [
      { d: 3200, scene: 'hospital', grade: 'blue', drain: .4, music: 'lou', tr: 'fade', cam: [[0, 20, 8, 1.15], [1, 0, 4, 1.24, 'lin']], cast: [{ id: 'lou', kind: 'bust', x: -.05, y: 128, expr: 'smile', rim: '#fde68a' }],
        say: ['lou', 'Now you know what that bed feels like.'] },
      { d: 3400, scene: 'hospital', grade: 'blue', drain: .4, cam: [[0, 0, 30, 1.0], [1, 0, 32, 1.05]], cast: [{ id: 'you', kind: 'hand', x: -.2, y: 142, s: 3.2, curl: .3 }, { id: 'lou', kind: 'hand', x: .2, y: 148, s: 3.2, flip: true, curlTo: [[0, 0], [1800, .5]] }],
        say: ['lou', 'Don\'t you dare quit for me. Get up for you.'] },
      { d: 2400, scene: 'street_sunset', sepia: true, tr: 'flash', cam: [[0, 0, 6, 1.2], [1, 0, 2, 1.3]], cast: [{ id: 'younglou', kind: 'actor', x: 0, y: 74, s: 3.1, look: youngLou, acts: [[0, 'down', 99]] }],
        title: { text: '1998', style: 'line', at: 300 }, ev: [[0, 'sfx', 'ring']] },
    ] });
  }
  function louCall(s, ctx) {
    return def('_c5_lou_call', { name: 'The Call', chapter: 'Chapter 5', shots: [
      { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'A phone call, 11:14 p.m.', style: 'line', at: 300 }, ev: [[200, 'sfx', 'beep'], [700, 'sfx', 'beep'], [1200, 'sfx', 'beep']] },
      { d: 3400, scene: 'hospital', grade: 'night', music: 'lou', cam: [[0, 0, 6, 1.2], [1, 0, 8, 1.28]], cast: [{ id: 'ph', kind: 'phone', x: -.35, y: 168, s: 3.4 }, { id: 'lou', kind: 'bust', x: .3, y: 128, expr: 'neutral', rim: '#fdba74' }],
        say: ['lou', '(on the phone) I\'m not coming in there. You\'d hate that.'] },
      { d: 2600, scene: 'hospital', grade: 'night', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'crying', rim: '#93c5fd' }],
        say: ['lou', '(on the phone) I\'ll be in the third row when you\'re back.'] },
    ] });
  }
  /* the rehab montage: GET UP three times, Halsey Park in between, Lou in the third row */
  function rehab(s, ctx) {
    const up = (id, n) => [[500, 'qte', { kind: 'mash', label: 'GET UP', id, n, time: 6500 }], [520, 'act', 'you', 'kneel', 99], [520, 'drain', .3, 900], [520, 'sfx', 'heartbeat'], [1700, 'act', 'you', null], [1700, 'drain', 0, 600]];
    const park = { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 };
    return def('_c5_rehab', { name: 'Get Up', chapter: 'Chapter 5', shots: [
      { d: 4200, music: 'lou', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', tone: true, shot: { scene: 'hospital', grade: 'blue', cast: [{ id: 'you', kind: 'bust', x: 0, y: 128, expr: 'fierce', rim: '#7dd3fc', sweat: true }] }, sfx: ['ICE', .72, .3, '#7dd3fc', 4] },
        { r: [.5, 0, .5, .55], at: 800, from: 'right', shot: { scene: 'gym', empty: true, cam: [[0, 0, 26, 1.3], [1, 0, 26, 1.3]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 3, acts: [[0, 'kneel', 99, { down: true }]] }] }, sfx: ['BEND', .3, .3, '#f8fafc', 3] },
        { r: [0, .55, 1, .45], at: 1600, from: 'bottom', lines: true, shot: { scene: 'gym', empty: true, grade: 'blue', cam: [[0, 0, 20, 1.2], [1, 0, 20, 1.2]], cast: [{ id: 'trainer', kind: 'actor', x: .3, y: 72, s: 2.8, face: -1, acts: [[0, 'clap', 99]] }, { id: 'you', kind: 'actor', x: -.2, y: 72, s: 2.8, acts: [[0, 'kneel', 99]] }] }, sfx: ['AGAIN', .72, .35, '#facc15', 4] },
      ] } },
      { d: 3400, scene: 'gym', empty: true, grade: 'blue', rot: .05, cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 3 }],
        say: ['narrator', 'Month two. The leg won\'t straighten all the way.'], ev: up('up1', 12) },
      { d: 3000, court: park, sepia: true, tr: 'flash', cam: [[0, 0, 10, 1.4], [1, 0, -10, 1.55, 'io']], cast: [SP('you', 200, 150)],
        say: ['lou', '(years ago, Halsey Park) Miss it? Go get it. Again.'], play(S2, tm) { CSK.jumper(S2, S2.sp.you, tm, .5, { made: false, flight: 1.2 }); } },
      { d: 3400, scene: 'gym', empty: true, grade: 'blue', rot: -.05, cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 3 }],
        say: ['narrator', 'Month five. Your first jog. Your first limp.'], ev: up('up2', 14) },
      { d: 3000, scene: 'street_sunset', sepia: true, tr: 'flash', cam: [[0, 0, 30, 1.0], [1, 0, 32, 1.05]], cast: [{ id: 'lou', kind: 'hand', x: .1, y: 150, s: 3.2, flip: true, curl: .1 }],
        say: ['lou', '(years ago) Everybody falls on this court. Get up.'] },
      { d: 3400, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 3 }],
        say: ['narrator', 'Month eight. Six a.m. The first full-speed cut.'], ev: up('up3', 16) },
      { d: 3400, scene: 'gym', empty: true, grade: 'gold', music: 'build', cam: [[0, -10, 0, 1.12], [1, 6, -4, 1.2]], cast: [{ id: 'lou', kind: 'actor', x: .4, y: 44, s: 1.7, face: -1, acts: [[0, 'bench', 99]] }, { id: 'you', kind: 'actor', x: -.25, y: 74, s: 2.9, face: 1, ball: true }],
        say: s.flags.lou_snub ? ['narrator', 'Third row. Lou said he\'d be here. He\'s been here every morning at six.'] : ['narrator', 'Third row. Every morning at six, the same seat. Lou.'] },
      { d: 2400, scene: 'gym', grade: 'gold', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }],
        say: (c, q) => ['up1', 'up2', 'up3'].filter(k => q[k]).length >= 2 ? ['you', 'It holds. Every time, it holds.'] : ['you', 'Not yet. But I keep getting up.'] },
    ] });
  }
  const rehabBonus = () => { const L = Cutscene.lastQte || {}, ids = ['up1', 'up2', 'up3'], n = ids.filter(k => L[k]).length;
    return { id: ids.find(k => L[k]) || 'up1', ok: { attrs: { stam: n, str: n >= 3 ? 1 : 0 }, morale: n * 2 }, okToast: `💪 Got up ${n} of 3: +${n} Stamina` }; };
  /* the awakening: you can't jump over them anymore, so you think past them */
  function awaken(s, ctx) {
    return def('_c5_awaken2', { name: 'Slow Burn', chapter: 'Chapter 5', shots: [
      { d: 3000, scene: 'locker', grade: 'blue', music: null, tr: 'fade', cam: [[0, 0, 10, 1.15], [1, 0, 14, 1.3, 'io']], cast: [{ id: 'you', kind: 'bust', x: -.1, y: 128, expr: 'neutral', rim: '#93c5fd' }],
        say: ['narrator', 'Month nine. You can\'t jump over anybody now. So you watch film, eight hours a day.'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 2600, scene: 'street_sunset', sepia: true, music: 'lou', cam: [[0, 10, -4, 1.18], [1, 14, -8, 1.26]], cast: [{ id: 'lou', kind: 'bust', x: .2, expr: 'smile', rim: '#fde68a' }],
        say: ['lou', '(years ago) Slow down. Make them guess.'] },
      { d: 3600, court: '@venue', music: 'clutch', cam: [[0, 14, 4, 1.7], [1, 6, -16, 1.95, 'io']], slow: [[1100, 2600, .35]], speed: 'radial', focus: [.5, .35], cast: [SP('you', 226, 138), SP('d1', 204, 116, 1)],
        ev: [[1100, 'sfx', 'whoosh'], [1200, 'riser', 1.5]],
        play(S2, tm) { const p = S2.sp.you, d = S2.sp.d1; p.face = -1; d.face = 1; d.stance = tm < .9;
          if (tm < .9) { S2.ball.holder = p; p.act = { type: 'move', id: 'hesi', t: tm % .9, T: .9, f0: -1, f1: -1 }; d.act = tm > .45 ? { type: 'stumble', t: tm - .45, T: 1 } : null; return; }
          if (tm > 1.05) { d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(Math.min(1, (tm - 1.05) / .5) * Math.PI) * 9); }
          CSK.jumper(S2, p, tm, .95, { made: true, flight: 1.1, jump: 13, onMake: () => S2.fx.impact(150) }); const u = Math.min(1, Math.max(0, (tm - 1.1) / .6)); p.x = 226 + 10 * u; p.y = 138 + 6 * u; } },
      { d: 3000, scene: 'title', music: 'victory', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.04, 'snap']], speed: 'radial', cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#fb923c', from: { dy: 50, t: 400, ease: 'back' } }],
        title: { text: 'SMARTER. SLOWER.', sub: 'A new style', style: 'slam', at: 300 }, ev: [[300, 'impact', 150], [300, 'sfx', 'stinger'], [300, 'aura', 'you', '251,146,60']] },
    ] });
  }
  function nextFinals(s, ctx) {
    return def('_c5_next2', { name: 'Next time', chapter: 'Chapter 5', shots: [
      { d: 1100, scene: 'void', music: null, title: { text: 'NEXT TIME…', style: 'next', at: 0 }, ev: [[0, 'sfx', 'whoosh']] },
      { d: 2600, scene: 'arena', grade: 'gold', tr: 'flash', speed: 'h', cam: [[0, -14, 0, 1.15], [1, 12, -4, 1.32, 'io']], cast: [{ id: 'tr', kind: 'trophy', x: 0, y: 96, s: 3.2, d: 1 }], say: ['narrator', 'June. Sixteen wins. A trophy you\'ve only seen on TV.'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 2000, scene: 'void', title: { text: 'The First Finals Arc', sub: 'Next time on Hoop Dreams', style: 'next2', at: 80 }, ev: [[80, 'sfx', 'sting']] },
    ] });
  }
  /* ---------- ARC 4 · THE FIRST FINALS ARC ---------- */
  const oppT = s => T((s.pro && s.pro.finalsOpp || '').replace(/^nbl_/, '') || (s.pro && s.pro.kaiTeam));
  function kaiSeries(s, ctx) {
    ctx.looks = Object.assign(ctx.looks || {}, kaiLook(s));
    return def('_c5_kai_series', { name: 'The Series', chapter: 'Chapter 5', shots: [
      { d: 2600, scene: 'arena', grade: 'red', music: 'clutch', tr: 'fade', cam: [[0, -20, 0, 1.1], [1, 10, -4, 1.2]], title: { text: 'BEST OF SEVEN', sub: `${myT(s).name} vs ${T(s.pro.kaiTeam).name}`, style: 'loc', at: 300 }, ev: [[0, 'sfx', 'crowd', .9], [200, 'cheer']] },
      { d: 2600, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial', cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'fierce', from: { dx: 160, t: 300, ease: 'back' }, rim: '#fca5a5' }, { id: 'you', kind: 'bust', x: -.55, expr: 'determined', from: { dx: -160, t: 300, ease: 'back' }, rim: '#93c5fd' }],
        title: { text: 'THE SERIES', sub: 'Halsey Park, seven games long', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 10]] },
      { d: 2400, scene: 'void', grade: 'red', bars: 50, cam: [[0, 0, 8, 1.32], [1, 0, 12, 1.46]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'smile', rim: '#fca5a5' }], say: ['kai', 'You came back from the knee for this? Good. Me too.'], ev: [[500, 'glint', 'kai']] },
    ] });
  }
  function finals(s, ctx) {
    return def('_c5_finals', { name: 'The Finals', chapter: 'Chapter 5', shots: [
      { d: 2800, scene: 'arena', grade: 'gold', music: 'build', tr: 'fade', cam: [[0, -30, -10, 1.05], [1, 20, -14, 1.16, 'lin']], title: { text: 'THE NBL FINALS', sub: `${myT(s).name} · season ${s.pro ? s.pro.n : 4}`, style: 'loc', at: 300 }, ev: [[0, 'sfx', 'crowd', 1.2], [200, 'cheer']] },
      { d: 2800, scene: 'title', music: 'clutch', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.05, 'snap']], speed: 'radial', cast: [{ id: 'tr', kind: 'trophy', x: 0, y: 96, s: 3.4, d: 1 }], title: { text: 'FOUR MORE', sub: 'Twelve wins down, four to go', style: 'slam', at: 300 }, ev: [[300, 'impact', 150], [300, 'sfx', 'stinger'], [300, 'flash', '#fde68a', .4]] },
      { d: 2400, scene: 'void', grade: 'gold', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }], say: ['narrator', 'The trophy sits on a table by the tunnel. You don\'t look at it.'] },
    ] });
  }
  /* Games 2–6 (Pro.finalsTo already played them): every score, then GAME 7 */
  function finalsMid(s, ctx) {
    const G = (s.career.games || []).filter(g => /NBL Finals · Game [2-6]$/.test(g.label)).slice(-5), at = (g, i) => `G${i + 2} ${g.win ? 'W' : 'L'}`;   // short enough for a third of a phone screen
    const P = (g, i, r) => ({ r, at: i * 650, from: ['left', 'right', 'bottom', 'top', 'left'][i], tone: !g.win, shot: { scene: 'arena', grade: g.win ? 'gold' : 'blue', cast: [{ id: 'you', kind: 'bust', x: 0, y: 128, expr: g.win ? 'fierce' : 'sad', rim: g.win ? '#fde68a' : '#93c5fd' }] }, sfx: [at(g, i), .5, .7, g.win ? '#fde68a' : '#93c5fd', 3] });
    const R = [[0, 0, .34, .5], [.34, 0, .33, .5], [.67, 0, .33, .5], [0, .5, .5, .5], [.5, .5, .5, .5]];
    return def('_c5_finals_mid', { name: 'Games 2 to 6', chapter: 'Chapter 5', shots: [
      { d: 4200, music: 'clutch', manga: { panels: G.map((g, i) => P(g, i, R[i])) } },
      { d: 2600, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.04, 'snap']], speed: 'radial', title: { text: 'GAME 7', sub: 'Three wins each', style: 'slam', at: 300 }, ev: [[300, 'impact', 170], [300, 'sfx', 'impact'], [300, 'shake', 10]] },
    ] });
  }
  /* the low: the confetti falls for someone else, and an hour in the locker room */
  function theLow(s, ctx) {
    const o = oppT(s), kai = !!s.flags.finals_vs_kai; if (kai) ctx.looks = Object.assign(ctx.looks || {}, kaiLook(s));
    ctx.them = { colors: o.colors }; ctx.team = { colors: myT(s).colors };
    return def('_c5_the_low', { name: 'Someone Else\'s Confetti', chapter: 'Chapter 5', shots: [
      { d: 3600, court: 'finals', music: null, drain: .5, cam: [[0, 0, 20, 1.5], [1, 0, 10, 1.7, 'io']], cast: [SP('you', 150, 150), SP('c1', 210, 120, 1), SP('c2', 240, 140, 1), SP('c3', 190, 100, 1)],
        say: ['narrator', `The confetti falls in ${o.name} colors.`], ev: [[0, 'confetti', 200], [0, 'cheer'], [200, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you; p.face = 1; p.act = null; ['c1', 'c2', 'c3'].forEach((k, i) => CSK.cel(S2.sp[k], 'joy', tm + i * .3)); S2.ball.holder = null; S2.ball.z = 0; S2.ball.x = 300; S2.ball.y = 190; } },
      kai ? { d: 2600, scene: 'arena', grade: 'gold', drain: .3, cam: [[0, 0, 4, 1.2], [1, 0, 8, 1.3]], cast: [{ id: 'kai', kind: 'actor', x: .1, y: 74, s: 2.9, acts: [[0, 'joy', 99]] }, { id: 'tr', kind: 'trophy', x: .3, y: 60, s: 2.4, d: 1 }],
        say: ['narrator', 'Kai Sterling, NBL champion. His dad is crying in row two.'] }
        : { d: 2600, scene: 'arena', grade: 'gold', drain: .4, cam: [[0, 0, 4, 1.2], [1, 0, 8, 1.3]], cast: [{ id: 'tr', kind: 'trophy', x: 0, y: 96, s: 3.2, d: 1 }], say: ['narrator', 'Somebody else lifts it. You hear the cheer through the tunnel wall.'] },
      { d: 3400, scene: 'locker', grade: 'dark', music: 'sad', tr: 'fade', cam: [[0, 0, 10, 1.2], [1, 0, 14, 1.32, 'lin']], cast: [{ id: 'bench', kind: 'bench', x: 0, y: 74, s: 3, w: 40, d: 1 }, { id: 'you', kind: 'actor', x: 0, y: 74, s: 3, acts: [[0, 'bench', 99, { down: true }]] }],
        title: { text: 'ONE HOUR LATER', style: 'line', at: 400 } },
      { d: 2600, scene: 'locker', grade: 'dark', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }], ev: [[0, 'sfx', 'heartbeat']] },
    ] });
  }
  /* post-credits: Lou, older now, on Halsey Street — then "Next time…" (Chapter 6) */
  function postCredits(s) {
    const old = Object.assign({}, STORY.characters.lou.look, { hairColor: '#e5e7eb' });
    return def('pc_lou_halsey', { name: 'One More', chapter: 'Chapter 5 · after the credits', shots: [
      { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'Halsey Street Courts · August', style: 'line', at: 300 } },
      { d: 3400, scene: 'street_sunset', grade: 'sunset', music: 'lou', cam: [[0, -30, 0, 1.1], [1, 0, 4, 1.2, 'lin']], cast: [{ id: 'bench', kind: 'bench', x: .32, y: 74, s: 2.7, w: 34, d: 1 }, { id: 'lou', kind: 'actor', x: .3, y: 74, s: 2.7, face: -1, look: old, acts: [[0, 'bench', 99]] }, { id: 'you', kind: 'actor', x: -.9, y: 74, s: 2.8, ball: true, path: [[0, -.9], [2200, -.3]] }],
        say: ['narrator', 'Same cracked court. Same bench. Lou\'s beard went white while you were away.'] },
      { d: 3200, scene: 'street_sunset', grade: 'sunset', cam: [[0, 18, -2, 1.24], [1, 22, 2, 1.34]], cast: [{ id: 'lou', kind: 'bust', x: .3, expr: 'smile', rim: '#fde68a', look: old }, { id: 'you', kind: 'bust', x: -.7, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
        say: ['lou', 'One more, kid. Go get it.'] },
      { d: 1100, scene: 'void', music: null, title: { text: 'NEXT TIME…', style: 'next', at: 0 }, ev: [[0, 'sfx', 'whoosh']] },
      { d: 2600, scene: 'airport', grade: 'night', tr: 'flash', speed: 'h', cam: [[0, -14, 0, 1.15], [1, 12, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'bust', x: .1, sil: true, rim: '#93c5fd' }], say: ['narrator', 'A contract year. A knee that scares teams. A plane ticket, maybe.'] },
      { d: 2000, scene: 'void', title: { text: 'Chapter 6: Far From Home', sub: 'Next time on Hoop Dreams', style: 'next2', at: 80 }, ev: [[80, 'sfx', 'sting']] },
    ] });
  }
  /* JAM_SCRIPTS.c5_g7: Game 7 of the Finals, a fixed loss. Played well (22+ before the end): forty-one in a Game 7 loss. Played badly: the misses */
  function g7Shots(o) {
    const [u, t] = o.score, b = o.box || {}, well = (b.pts || 0) >= 22, hi = Math.max(u, t), fin = well ? [hi + 2, hi + 3] : [hi, hi + 3]; o.fin = fin;   // tied; your bucket (or your miss), then their three
    o.addBox = well ? { pts: Math.max(0, 41 - (b.pts || 0)), fgm: Math.ceil(Math.max(0, 41 - (b.pts || 0)) / 2.4), fga: Math.ceil(Math.max(0, 41 - (b.pts || 0)) / 2) } : { pts: 2, fgm: 1, fga: 5 };
    const S0 = typeof Game !== 'undefined' && Game.state; if (S0) { S0.flags.g7_41 = well; if (S0.flags.finals_vs_kai && o.ctx) o.ctx.looks = Object.assign(o.ctx.looks || {}, kaiLook(S0)); }
    const tie = `${hi}-${hi}`;
    return [
      { d: 3000, court: '@venue', score: true, music: 'clutch', tr: 'fade', cam: [[0, 16, 34, 2.0], [1, 10, 10, 2.2]], cast: [SP('st', 200, 150, 1), SP('you', 230, 120)], say: ['narrator', well ? 'Game 7, under a minute. You have thirty-nine. They can\'t guard you and they know it.' : 'Game 7, under a minute. You\'ve missed eight straight. The ball still finds you.'],
        ev: [[300, 'bug', tie], [300, 'sfx', 'roar']], play(S2, tm) { const p = S2.sp.you; p.face = -1; p.stance = true; CSK.jumper(S2, S2.sp.st, tm, .3, { made: true, flight: 1.1 }); } },
      { d: 3600, court: '@venue', score: true, scoreText: tie, clockText: '0:21', cam: [[0, 8, 24, 2.3], [1, 4, -8, 2.4, 'io']], slow: [[400, 3000, .4]], speed: 'radial', focus: [.5, .35], cast: [SP('you', 196, 128), SP('st', 206, 116, 1)],
        title: well ? { text: '41', sub: 'Forty-one in Game 7', style: 'slam', at: 2300 } : null, ev: well ? [[0, 'riser', 3], [2300, 'bug', `${hi + 2}-${hi}`], [2400, 'cheer'], [2400, 'impact', 160]] : [[0, 'riser', 3], [2300, 'sfx', 'rim'], [2400, 'sfx', 'gasp']],
        play(S2, tm) { const d = S2.sp.st; d.face = 1; d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .35) / .6)) * Math.PI) * 10); CSK.jumper(S2, S2.sp.you, tm, .2, { made: well, flight: 1.25, jump: 15 }); } },
      { d: 3800, court: '@venue', score: true, scoreText: well ? `${hi + 2}-${hi}` : tie, clockText: '0:04', music: null, cam: [[0, -6, 20, 2.2], [1, 0, -6, 2.5, 'io']], slow: [[600, 3400, .35]], speed: 'radial', focus: [.5, .35], cast: [SP('st', 230, 132, 1), SP('you', 214, 120)],
        ev: [[0, 'riser', 3], [2500, 'bug', `${fin[0]}-${fin[1]}`], [2500, 'sfx', 'buzzer'], [2600, 'sfx', 'roar'], [2600, 'drain', .7, 700]],
        play(S2, tm) { const p = S2.sp.you; p.face = 1; p.act = { type: 'block', t: .1 }; p.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .5) / .6)) * Math.PI) * 11); CSK.jumper(S2, S2.sp.st, tm, .3, { made: true, flight: 1.3, jump: 16, arc: 40 }); } },
      { d: 2600, scene: 'arena', grade: 'dark', drain: .7, music: null, cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'shocked', rim: '#93c5fd' }],
        say: ['narrator', well ? 'A three over your outstretched hand. Forty-one points, and it\'s not enough.' : 'A three over your outstretched hand. Your night ends the way it went.'] },
    ];
  }
  const g7 = { moments: 2, at: 0, noRally: true, async run(o) { CUTSCENES._c5_g7 = { name: 'Game 7', chapter: 'Chapter 5', shots: g7Shots(o) }; await Story.cut('_c5_g7', o.ctx, { seenId: 'c5_g7' }); return o.fin; } };

  /* JAM_SCRIPTS.c5_knee_out: national TV, a breakaway, the dunk, the knee. No rally: the story doesn't fix this one */
  function kneeShots(o) {
    const [u, t] = o.score, fin = [u + 2, Math.max(t + 8, u + 5)]; o.fin = fin;   // nobody on your bench can finish it: the lead (if there was one) is gone
    const S0 = typeof Game !== 'undefined' && Game.state;
    if (S0 && o.ctx) o.ctx.looks = Object.assign(o.ctx.looks || {}, kaiLook(S0));
    return [
      { d: 3000, court: '@venue', score: true, music: 'build', tr: 'fade', cam: [[0, -34, 44, 1.7], [1, -4, 6, 1.9]], cast: [SP('you', 150, 176), SP('d1', 120, 186, 1)],
        say: ['narrator', 'Fourth quarter, national TV. A steal, and nobody between you and the rim.'], ev: [[300, 'bug', `${u}-${t}`], [300, 'sfx', 'roar'], [300, 'cheer']],
        play(S2, tm) { const p = S2.sp.you, d = S2.sp.d1; S2.ball.holder = p; p.face = 1; CSK.run(p, tm, 0, 3, 150, 176, 186, 112); CSK.run(d, tm, .2, 3, 120, 186, 160, 132); } },
      { d: 3400, court: '@venue', score: true, scoreText: `${u}-${t}`, music: null, cam: [[0, 0, -30, 2.0], [.4, 0, -36, 2.3, 'io'], [1, 0, -32, 2.45]], speed: 'radial', focus: [.5, .3], cast: [SP('you', 186, 112), SP('d1', 160, 132, 1)],
        ev: [[0, 'riser', 1.2], [1300, 'sfx', 'crack'], [1300, 'impact', 220, ['#000000', '#ef4444']], [1300, 'shake', 12], [1340, 'drain', 1, 500], [1340, 'dim', .35, 900], [1500, 'sfx', 'gasp'], [1900, 'sfx', 'ring']],
        play(S2, tm) { const p = S2.sp.you, d = S2.sp.d1, H = PIX.hoop, B = S2.ball, top = H.z - 12; p.face = 1; CSK.run(d, tm, 0, 1.3, 160, 132, 176, 96);
          if (tm < .45) { B.holder = p; CSK.run(p, tm, 0, .45, 186, 112, H.x - 2, H.y + 14); p.act = null; return; }
          if (tm < 1.3) { const k = 1 - Math.pow(1 - (tm - .45) / .85, 2.4); B.holder = p; p.act = { type: 'dunk', t: Math.min(.6, k * .62), T: 1.05 }; p.x = H.x - 2 + 4 * k; p.y = H.y + 14 - 8 * k; p.z = Math.sin(k * Math.PI / 2) * top; return; }   // a long, slow rise
          const f = tm - 1.3; p.act = { type: 'down', t: f, T: 99 }; p.z = Math.max(0, top * (1 - Math.pow(Math.min(1, f / .42), 2))); p.y = H.y + 6 + Math.min(12, f * 30);   // the knee goes, and he drops
          B.holder = null; B.x = H.x + 8 + f * 26; B.y = H.y + 8 + f * 18; B.z = Math.max(0, H.z - 6 - f * 70) + (f > .5 ? Math.abs(Math.sin(f * 8)) * 7 / (1 + f * 2) : 0); } },
      { d: 3000, scene: 'arena', grade: 'dark', drain: 1, music: null, cam: [[0, 0, 4, 1.2], [1, 0, 8, 1.34]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 2.9, acts: [[0, 'down', 99]] }, { id: 'kai', kind: 'actor', x: .7, y: 74, s: 2.8, face: -1, path: [[0, .7], [1100, .2]], acts: [[1200, 'kneel', 99]] }],
        say: ['narrator', 'Twenty thousand people. Not one of them makes a sound.'] },
      { d: 1800, scene: 'arena', sepia: true, tr: 'flash', cam: [[0, 0, 8, 1.12], [1, 0, 12, 1.2]], cast: [{ id: 'younglou', kind: 'actor', x: 0, y: 74, s: 3.1, look: youngLou, acts: [[0, 'down', 99]] }], title: { text: '1998', style: 'line', at: 200 }, ev: [[0, 'sfx', 'ring']] },
      { d: 2600, scene: 'arena', grade: 'dark', drain: .8, cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }],
        say: ['kai', 'Don\'t move. Hey. HEY. Somebody get out here!'] },
    ];
  }
  const kneeOut = { moments: 2, at: 0, noRally: true, async run(o) { CUTSCENES._c5_knee_out = { name: 'The Knee', chapter: 'Chapter 5', shots: kneeShots(o) }; await Story.cut('_c5_knee_out', o.ctx, { seenId: 'c5_knee_out' }); return o.fin; } };

  /* ---------- the scripted endings ---------- */
  function endShots(o, k) {
    const [u, t] = o.score, down = [u, t], fin = u > t ? [u + 8, t + 3] : [t + 3, t], pts = Math.max(30, (o.box && o.box.pts || 0) + 10); o.fin = fin;   // from the real score
    const L = k === 'thirty' ? { line: 'Your first start. Fourth quarter, and the ball keeps finding you.', title: `${pts} POINTS`, sub: 'In your first career start', crowd: 'The bench is a memory. Every team that passed just watched it.' }
      : k === 'close' ? { line: 'Close it out. Win this one and the next round is yours.', title: 'SERIES WON', sub: 'On to the next round', crowd: 'Handshakes at midcourt. Nobody on your bench sits down.' }
      : k === 'cf' ? { line: 'One more win and you play for a ring.', title: 'CONFERENCE CHAMPIONS', sub: 'You\'re going to the NBL Finals', crowd: 'The building is shaking. Mom is on the phone with Nia, screaming.' }
      : k === 'kai' ? { line: 'Close out Kai\'s team. Halsey Street is watching on one TV in a barbershop.', title: 'SERIES WON', sub: 'Through Kai Sterling', crowd: 'Kai shakes your hand last. He holds it a second too long and says nothing.' }
      : { line: 'Close it out. One more win and it\'s your first playoff series.', title: 'SERIES WON', sub: 'Your first playoff series', crowd: 'The building is shaking. Somebody in the third row is crying, and it might be Mom.' };
    o.addBox = k === 'thirty' ? { pts: Math.max(0, pts - (o.box && o.box.pts || 0)), fgm: Math.ceil(Math.max(0, pts - (o.box && o.box.pts || 0)) / 2.4) } : { pts: 8, fgm: 3, fga: 4, stl: 1 };   // the cinematic's points go in your box score
    if (k === 'kai' && typeof Game !== 'undefined' && Game.state) Game.state.flags.beat_kai_series = true;
    return [
      { d: 3000, court: '@venue', score: true, music: 'build', tr: 'fade', cam: [[0, 16, 34, 2.0], [1, 10, 10, 2.2]], cast: [SP('st', 200, 150, 1), SP('you', 230, 120)], say: ['narrator', L.line], ev: [[300, 'bug', `${down[0]}-${down[1]}`], [300, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you; p.face = -1; p.stance = true; CSK.jumper(S2, S2.sp.st, tm, .3, { made: true, flight: 1.1 }); } },
      { d: 4600, score: true, music: 'clutch', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'arena', cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }], cam: [[0, 0, 22, 1.5], [1, 0, 22, 1.6]] }, sfx: ['STEAL!', .72, .25, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', tone: true, shot: { court: '@venue', cast: [SP('you', 250, 150)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.you, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SPLASH', .3, .3, '#7dd3fc', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', shot: { scene: 'arena', cast: [{ id: 'you', kind: 'bust', x: -.45, expr: 'fierce', rim: '#fde68a' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: ['AND ONE!', .72, .35, '#fde68a', 5, 1900] },
      ] }, ev: [[400, 'bug', `${Math.min(fin[0] - 2, down[0] + 3)}-${down[1]}`], [1300, 'bug', `${Math.min(fin[0] - 2, down[0] + 6)}-${down[1]}`], [2300, 'bug', `${fin[0] - 2}-${fin[1]}`], [2300, 'cheer'], [2400, 'sfx', 'roar']] },
      { d: 3600, court: '@venue', score: true, scoreText: `${fin[0] - 2}-${fin[1]}`, clockText: '0:05', cam: [[0, 8, 24, 2.3], [1, 4, -8, 2.4, 'io']], slow: [[400, 3000, .4]], speed: 'radial', focus: [.5, .35], cast: [SP('you', 196, 128), SP('st', 206, 116, 1)],
        ev: [[0, 'riser', 3], [2300, 'bug', `${fin[0]}-${fin[1]}`], [2300, 'sfx', 'buzzer'], [2400, 'cheer'], [2400, 'impact', 160]],
        play(S2, tm) { const d = S2.sp.st; d.face = 1; d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .35) / .6)) * Math.PI) * 10); CSK.jumper(S2, S2.sp.you, tm, .2, { made: true, flight: 1.25, jump: 17 }); } },
      { d: 3400, court: '@venue', score: true, scoreText: `${fin[0]}-${fin[1]}`, grade: 'gold', music: 'victory', cam: [[0, 0, 20, 1.6], [1, 0, 14, 1.4]], fgHop: true, cast: [SP('you', 192, 140), SP('m1', 150, 160), SP('m2', 236, 164)],
        title: { text: L.title, sub: L.sub, style: 'slam', at: 500 }, ev: [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', 160], [500, 'sfx', 'impact']],
        play(S2, tm) { CSK.cel(S2.sp.you, tm < 1.5 ? 'flex' : 'joy', tm); CSK.cel(S2.sp.m1, 'joy', tm); CSK.cel(S2.sp.m2, 'joy', tm + .3); S2.ball.holder = null; S2.ball.z = 0; S2.ball.x = 180; S2.ball.y = 190; } },
      { d: 2600, scene: 'arena', grade: 'gold', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'smile', rim: '#fde68a' }], say: ['narrator', L.crowd] },
    ];
  }
  const script = k => ({ moments: 2, at: 0, async run(o) { CUTSCENES['_c5_' + k] = { name: k === 'thirty' ? 'Thirty' : 'Series', chapter: 'Chapter 5', shots: endShots(o, k) }; await Story.cut('_c5_' + k, o.ctx, { seenId: 'c5_' + k }); return o.fin; } });
  const scripts = { c5_thirty: script('thirty'), c5_series: script('series'), c5_knee_out: kneeOut, c5_po_close: script('close'), c5_cf_close: script('cf'), c5_kai_close: script('kai'), c5_g7: g7 };

  return { arrival, meetVet, dnp, vetHurt, confront, shoeMeet, niaFight, traded, knee, louWarn, seriesWon, award, nextHalf, injured, kaiVisit, louVisit, louCall, rehab, rehabBonus, awaken, nextFinals, kaiSeries, finals, finalsMid, theLow, postCredits, scripts };
})();
if (typeof JAM_SCRIPTS !== 'undefined') Object.assign(JAM_SCRIPTS, CH5S.scripts);
