/* =====================================================================
   DATA-STORY-CH5-SCENES.JS — Chapter 5's cinematics, built for your career (CH5S.x(s, ctx) → a CUTSCENES id):
   the arrival, the star at your position, the DNP montage, the star going down, the confrontation with Kai (the
   Rivalry System), the sneaker brand (the Signature Shoe), the falling out with Nia, the trade, the knee, Lou's warning,
   your first series win, the award cinematics, "Next time…" — and the scripted endings: your first start (30 points,
   JAM_SCRIPTS.c5_thirty) and your first playoff series clincher (JAM_SCRIPTS.c5_series).
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

  /* ---------- the scripted endings ---------- */
  function endShots(o, k) {
    const [u, t] = o.score, down = [u, t], fin = u > t ? [u + 8, t + 3] : [t + 3, t], pts = Math.max(30, (o.box && o.box.pts || 0) + 10); o.fin = fin;   // from the real score
    const L = k === 'thirty' ? { line: 'Your first start. Fourth quarter, and the ball keeps finding you.', title: `${pts} POINTS`, sub: 'In your first career start', crowd: 'The bench is a memory. Every team that passed just watched it.' }
      : { line: 'Close it out. One more win and it\'s your first playoff series.', title: 'SERIES WON', sub: 'Your first playoff series', crowd: 'The building is shaking. Somebody in the third row is crying, and it might be Mom.' };
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
  const scripts = { c5_thirty: script('thirty'), c5_series: script('series') };

  return { arrival, meetVet, dnp, vetHurt, confront, shoeMeet, niaFight, traded, knee, louWarn, seriesWon, award, nextHalf, scripts };
})();
if (typeof JAM_SCRIPTS !== 'undefined') Object.assign(JAM_SCRIPTS, CH5S.scripts);
