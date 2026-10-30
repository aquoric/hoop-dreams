/* =====================================================================
   DATA-STORY-CH4-SCENES.JS — Chapter 4's cinematics, built for your career (CH4S.x(s, ctx) → a CUTSCENES id):
   the combine intro (the Combine Leaderboard), the scouts' whisper, the medicals, Kai's POV with Silk, the green room,
   draft night (Kai's pick, the slide, the empty chairs, the call, undrafted), Summer League (the fixed high, a
   scripted ending: JAM_SCRIPTS.c4_summer) and the post-credits (Kai's first NBL practice) with "Next time…".
   Major scenes are unskippable the first time (Story.cut + seenId); minor ones are marked minor.
   ===================================================================== */
const CH4S = (() => {
  const S = () => Game.state, T = id => NBL_TEAMS[id] || { name: '', abbr: '', colors: ['#1e3a8a', '#f8fafc', '#facc15'] };
  const SP = (id, x, y, team, lk) => Object.assign({ id, kind: 'sprite', x, y }, team ? { team } : {}, lk ? { look: lk } : {});
  const R = s => (s.draft && s.draft.result) || null;
  const def = (id, cs) => { CUTSCENES[id] = cs; return id; };
  const flashes = (n, t0, gap) => [...Array(n)].map((_, i) => [t0 + i * gap, 'flash', '#ffffff', .18]);

  /* the Combine Leaderboard on the big screen: Priya turns her tablet around */
  function combineIntro(s, ctx) {
    if (typeof Rankings !== 'undefined' && Rankings.on(s)) { const L = Rankings.list(s), i = L.findIndex(r => r.me); ctx.rankRows = L.slice(Math.max(0, i - 7), i + 5).map(r => ({ rank: r.rank, name: r.p.name, me: !!r.me })); ctx.myRank = Rankings.rankOf(s); }
    return def('_c4_combine', { name: 'The Combine', chapter: 'Chapter 4', shots: [
      { d: 2600, scene: 'arena', grade: 'blue', music: 'build', tr: 'fade', cam: [[0, -40, -10, 1.08], [1, 20, -6, 1.18]], title: { text: 'NBL DRAFT COMBINE', sub: 'Chicago · 60 prospects · 400 scouts', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'crowd', .6]] },
      { d: 2800, scene: 'ranks', grade: 'blue', cam: [[0, 0, 24, 1.1], [1, 0, -4, 1.3, 'io']], say: ['priya', 'The Combine Leaderboard. Every number you put up this week lands here.'], ev: [[300, 'sfx', 'page']] },
      { d: 2600, scene: 'arena', grade: 'blue', cam: [[0, 16, -2, 1.2], [1, 20, 2, 1.3]], cast: [{ id: 'priya', kind: 'bust', x: .3, expr: 'smile', rim: '#22d3ee' }, { id: 'you', kind: 'bust', x: -.7, y: 130, sil: true, rim: '#fde68a', d: 1.2 }],
        say: ['priya', 'Kai\'s name is already at the top. Go take it down.'] },
    ] });
  }
  /* foreshadowing: two scouts whisper about your attitude, the ankle and the Summer Jam film (a minor scene) */
  function whisper(s, ctx) {
    return def('_c4_whisper', { name: 'Second Row', chapter: 'Chapter 4', minor: true, shots: [
      { d: 2600, scene: 'arena', grade: 'dark', music: null, cam: [[0, 0, 4, 1.2], [1, 0, 8, 1.32]], cast: [{ id: 'scout_a', kind: 'bust', x: -.32, expr: 'neutral', rim: '#94a3b8' }, { id: 'scout_b', kind: 'bust', x: .34, expr: 'neutral', rim: '#94a3b8', flip: true }],
        say: ['scout_a', '(low) Talent\'s real. The attitude, I don\'t know.'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 2400, scene: 'void', grade: 'dark', sepia: true, cam: [[0, 0, 10, 1.3], [1, 0, 12, 1.4]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }],
        say: ['scout_b', s.flags.bad_ankle ? 'The Summer Jam film. And that ankle.' : 'The Summer Jam film. Watch him when it goes wrong.'], ev: [[300, 'sfx', 'page']] },
    ] });
  }
  /* the medicals: the old ankle on the light box */
  function medicals(s, ctx) {
    return def('_c4_med', { name: 'The Medicals', chapter: 'Chapter 4', minor: true, shots: [
      { d: 2400, scene: 'hospital', grade: 'blue', music: null, cam: [[0, 0, 0, 1.12], [1, 0, 4, 1.2]], title: { text: 'MEDICALS', sub: 'Thirty teams read this report', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'beep']] },
      { d: 2600, scene: 'hospital', grade: 'blue', cam: [[0, 0, 26, 1.2], [1, 0, 30, 1.34]], cast: [{ id: 'you', kind: 'hand', x: 0, y: 150, s: 3.2, curl: .2, tape: '#f8fafc' }], ev: [[400, 'sfx', 'heartbeat'], [1500, 'sfx', 'heartbeat']] },
      { d: 2400, scene: 'hospital', grade: 'blue', cam: [[0, 18, -2, 1.2], [1, 22, 2, 1.3]], cast: [{ id: 'doc', kind: 'bust', x: .3, expr: 'neutral', rim: '#93c5fd' }], say: ['doc', 'Left ankle. Let\'s talk about it.'] },
    ] });
  }
  /* Kai's POV: Silk demands #1, or Kai refuses to report */
  function kaiPov(s, ctx) {
    return def('_c4_kai', { name: 'Number One', chapter: 'Chapter 4 · Kai', shots: [
      { d: 2200, scene: 'void', music: 'kai', tr: 'fade', title: { text: 'Westbrook Hills · the Sterling house · 11:40 p.m.', style: 'line', at: 300 } },
      { d: 3200, scene: 'home', grade: 'night', cam: [[0, -20, 0, 1.12], [1, 0, 4, 1.24]], cast: [{ id: 'silk', kind: 'actor', x: .22, y: 72, s: 2.7, face: -1, acts: [[300, 'argue', 99]] }, { id: 'kai', kind: 'actor', x: -.2, y: 72, s: 2.7, face: 1, acts: [[0, 'sit', 99]] }],
        say: ['silk', 'Number one. Anything else, you don\'t report.'] },
      { d: 2800, scene: 'void', grade: 'blue', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.4]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'neutral', rim: '#93c5fd' }], say: ['kai', 'And if the team that wants me picks second?'] },
      { d: 3000, scene: 'home', grade: 'night', rot: -.06, cam: [[0, 20, -2, 1.26], [1, 24, 2, 1.36]], cast: [{ id: 'silk', kind: 'bust', x: .3, expr: 'fierce', rim: '#facc15' }],
        say: ['silk', 'Then they trade for you. I went fourth in \'04. I still hear about it.'], ev: [[1800, 'sfx', 'thud', .6]] },
      { d: 2800, scene: 'void', grade: 'dark', cam: [[0, 0, 8, 1.36], [1, 0, 12, 1.46]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'determined', rim: '#93c5fd' }],
        title: { text: 'Kai doesn\'t argue. He never does.', style: 'line', at: 900 }, ev: [[700, 'glint', 'kai']] },
    ] });
  }
  /* the green room: family at the table, the cameras, the commissioner at the podium (fully animated) */
  function greenRoom(s, ctx) {
    const D = Draft.st(s), first = T(D.order[0]), K = (s.draft && s.draft.kaiTable) || 'across the room';
    const fam = [{ id: 'mom', kind: 'actor', x: -.36, y: 74, s: 2.7, face: 1, acts: [[0, 'sit', 99]] }, { id: 'you', kind: 'actor', x: -.08, y: 74, s: 2.7, face: 1, acts: [[0, 'sit', 99]] }, { id: 'nia', kind: 'actor', x: .2, y: 74, s: 2.5, face: -1, acts: [[0, 'sit', 99]] }];
    if (s.flags.tariq_mended) fam.push({ id: 'tariq', kind: 'actor', x: .44, y: 74, s: 2.6, face: -1, acts: [[0, 'sit', 99]] });
    return def('_c4_green', { name: 'The Green Room', chapter: 'Chapter 4', shots: [
      { d: 3200, scene: 'arena_ext', grade: 'night', music: 'build', tr: 'fade', cam: [[0, -50, -16, 1.06], [1, 30, -10, 1.16, 'lin']], title: { text: 'THE NBL DRAFT', sub: 'Draft night · the green room', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'crowd', 1.2]] },
      { d: 3600, scene: 'arena', grade: 'spot', cam: [[0, -30, 6, 1.16], [1, 0, 2, 1.26, 'io']], cast: fam,
        say: ['narrator', 'Table nine. Mom bought a dress for this. Nia is filming everything.'], ev: flashes(5, 200, 600) },
      { d: 3000, scene: 'arena', grade: 'spot', cam: [[0, 0, 28, 1.14], [1, 0, 30, 1.24]], cast: [{ id: 'mom', kind: 'hand', x: -.1, y: 150, s: 3.1, curl: .7 }, { id: 'you', kind: 'hand', x: .12, y: 156, s: 3.1, curl: .35, flip: true }],
        say: ['mom', 'Whatever happens, baby. Whatever happens.', 'smile'], ev: [[400, 'sfx', 'heartbeat']] },
      { d: 3000, scene: 'arena', grade: 'gold', cam: [[0, 12, -14, 1.2], [1, 18, -10, 1.34, 'io']], cast: [{ id: 'commish', kind: 'bust', x: .3, expr: 'smile', rim: '#e2e8f0' }],
        say: ['commish', `Welcome to the NBL Draft. The ${first.name} are on the clock.`], ev: [[0, 'cheer'], [200, 'sfx', 'roar']].concat(flashes(4, 400, 500)) },
      { d: 3000, scene: 'arena', grade: 'spot', cam: [[0, 0, 4, 1.16], [1, 6, 8, 1.28]], cast: [{ id: 'kai', kind: 'bust', x: .3, expr: 'smile', rim: '#93c5fd' }, { id: 'silk', kind: 'bust', x: .66, y: 132, expr: 'neutral', rim: '#facc15', d: 1.15 }],
        say: ['narrator', `Kai's table is ${K}. Silk hasn't sat down once.`], ev: [[1400, 'glint', 'kai']] },
      { d: 2800, scene: 'void', grade: 'dark', bars: 40, cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.44]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }],
        say: ['priya', '(leaning in) Breathe. Tonight your name gets called.'], ev: [[0, 'sfx', 'heartbeat'], [1100, 'sfx', 'heartbeat']] },
    ] });
  }

  /* ---------- draft night beats (js/draft.js night()): (s, ctx, result) → cutscene id ---------- */
  function kai(s, ctx, r) {
    return def('_c4_dn_kai', { name: 'Kai Goes First', chapter: 'Chapter 4', shots: [
      { d: 3000, scene: 'arena', grade: 'gold', music: 'kai', cam: [[0, -10, 4, 1.14], [1, 10, 0, 1.24]], cast: [{ id: 'kai', kind: 'actor', x: -.5, y: 74, s: 2.7, path: [[0, -.5], [2600, .32]] }, { id: 'silk', kind: 'actor', x: -.6, y: 76, s: 2.7, acts: [[0, 'clap', 99]] }],
        title: { text: `#${r.kaiPick} · KAI STERLING`, sub: T(r.kaiTeam).name, style: 'slam', at: 500 }, ev: [[0, 'cheer'], [500, 'sfx', 'stinger']].concat(flashes(6, 300, 380)) },
      { d: 2600, scene: 'arena', grade: 'spot', cam: [[0, 0, 6, 1.28], [1, 0, 10, 1.4]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'smile', rim: '#93c5fd' }],
        say: ['kai', '(walking past your table) See you in Summer League, Halsey.'], ev: [[800, 'glint', 'kai']] },
    ] });
  }
  function slide(s, ctx, r) {
    const well = r.form >= .55;
    return def('_c4_dn_slide', { name: 'The Slide', chapter: 'Chapter 4', shots: [
      { d: 2800, scene: 'arena', grade: 'dark', drain: .5, music: null, cam: [[0, 0, 24, 1.14], [1, 0, 26, 1.24]], cast: [{ id: 'you', kind: 'hand', x: .02, y: 104, s: 3.2, curl: .55 }, { id: 'ph', kind: 'phone', x: 0, y: 70, s: 4 }],
        say: ['narrator', 'Your phone, face up on the table. Nothing.'], ev: [[300, 'sfx', 'heartbeat'], [1400, 'sfx', 'heartbeat']] },
      { d: 2800, scene: 'arena', grade: 'dark', drain: .5, cam: [[0, 0, 28, 1.16], [1, 0, 30, 1.28]], cast: [{ id: 'mom', kind: 'hand', x: -.06, y: 150, s: 3.1, curlTo: [[0, .4], [1200, .95]], shake: .4 }, { id: 'you', kind: 'hand', x: .1, y: 156, s: 3.1, curl: .3, flip: true }],
        say: ['narrator', 'Mom squeezes your hand. Harder every pick.'], ev: [[600, 'sfx', 'heartbeat']] },
      { d: 3000, scene: 'void', grade: 'dark', rot: -.08, bars: 50, cam: [[0, 0, 8, 1.34], [1, 0, 12, 1.46]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }],
        title: { text: well ? 'You did everything right.' : 'You gave them reasons.', style: 'line', at: 600 }, ev: [[0, 'sfx', 'piano']] },
    ] });
  }
  function chairs(s, ctx, r) {
    return def('_c4_dn_chairs', { name: 'Empty Chairs', chapter: 'Chapter 4', shots: [
      { d: 3400, scene: 'arena', grade: 'dark', drain: .7, music: null, cam: [[0, -40, 0, 1.08], [1, 20, 0, 1.16, 'lin']], cast: [{ id: 'bench', kind: 'bench', x: -.4, y: 74, s: 2.6, w: 30, d: 1 }, { id: 'bench2', kind: 'bench', x: .42, y: 74, s: 2.6, w: 30, d: 1 },
          { id: 'you', kind: 'actor', x: 0, y: 74, s: 2.7, acts: [[0, 'slump', 99]] }, { id: 'mom', kind: 'actor', x: -.16, y: 74, s: 2.7, face: 1, acts: [[0, 'sit', 99]] }],
        say: ['narrator', 'The tables around you empty, one by one. The cameras stopped coming by an hour ago.'], ev: [[0, 'sfx', 'piano']] },
    ] });
  }
  function call(s, ctx, r) {
    const t = T(r.team);
    return def('_c4_dn_call', { name: 'The Call', chapter: 'Chapter 4', shots: [
      { d: 2200, scene: 'arena', grade: 'dark', music: null, cam: [[0, 0, 24, 1.16], [1, 0, 24, 1.3, 'snap']], cast: [{ id: 'you', kind: 'hand', x: .02, y: 104, s: 3.2, curl: .55, shake: 1 }, { id: 'ph', kind: 'phone', x: 0, y: 70, s: 4 }],
        say: ['narrator', 'The phone buzzes. Area code: ' + (t.cityName || t.city) + '.'], ev: [[200, 'sfx', 'ring'], [1100, 'sfx', 'ring'], [200, 'shake', 3]] },
      { d: 3200, scene: 'arena', grade: 'blue', cam: [[0, 18, -2, 1.22], [1, 22, 2, 1.32]], cast: [{ id: 'gm_cole', kind: 'bust', x: .3, expr: 'smile', rim: '#22c55e' }],
        say: ['gm_cole', `It's Ray Cole. We've wanted you from the start. Still want us?`], ev: [[0, 'music', 'build']] },
      { d: 3000, scene: 'arena', grade: 'gold', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'mom', kind: 'face', x: 0, expr: 'crying', rim: '#fde68a' }], say: ['mom', 'That\'s my baby. THAT\'S MY BABY.', 'crying'], ev: [[0, 'riser', 2.6]] },
      { d: 3200, scene: 'title', music: 'victory', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.04, 'snap']], speed: 'radial', cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: t.colors[1] || '#facc15', from: { dy: 50, t: 400, ease: 'back' } }],
        title: { text: `PICK #${r.pick}`, sub: t.name, style: 'slam', at: 300 }, ev: [[300, 'impact', 160], [300, 'sfx', 'stinger'], [300, 'shake', 9], [500, 'confetti', 140], [500, 'cheer']] },
    ] });
  }
  function undrafted(s, ctx, r) {
    return def('_c4_dn_undrafted', { name: 'Undrafted', chapter: 'Chapter 4', shots: [
      { d: 3200, scene: 'arena', grade: 'dark', drain: .9, music: null, cam: [[0, 0, 4, 1.1], [1, 0, 8, 1.2]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 2.8, acts: [[0, 'slump', 99]] }, { id: 'mom', kind: 'actor', x: -.2, y: 74, s: 2.7, face: 1, acts: [[0, 'hug', 99]] }],
        say: ['narrator', 'The sixtieth name is read. Then the lights over the green room go off.'], ev: [[0, 'sfx', 'piano'], [1600, 'dim', .8, 700]] },
      { d: 2600, scene: 'void', grade: 'dark', cam: [[0, 0, 24, 1.2], [1, 0, 26, 1.3]], cast: [{ id: 'you', kind: 'hand', x: .02, y: 104, s: 3.2, curl: .55 }, { id: 'ph', kind: 'phone', x: 0, y: 70, s: 4 }],
        title: { text: 'Silent.', style: 'line', at: 700 } },
      { d: 2600, scene: 'void', grade: 'dark', cam: [[0, 0, 24, 1.2], [1, 0, 26, 1.34, 'snap']], cast: [{ id: 'you', kind: 'hand', x: .02, y: 104, s: 3.2, curl: .55, shake: 1 }, { id: 'ph', kind: 'phone', x: 0, y: 70, s: 4 }],
        say: ['priya', '(her phone, not yours) Wait. Wait, wait, wait.'], ev: [[600, 'sfx', 'ring'], [600, 'flash', '#ffffff', .2]] },
    ] });
  }
  /* Summer League: every team that passed, in the stands */
  function summerPre(s, ctx) {
    const r = R(s), passed = r ? r.passed.slice(0, 4) : [];
    return def('_c4_summer_pre', { name: 'Summer League', chapter: 'Chapter 4', shots: [
      { d: 2600, scene: 'arena', grade: 'sunset', music: 'build', tr: 'fade', cam: [[0, -40, -10, 1.06], [1, 20, -6, 1.16]], title: { text: 'SUMMER LEAGUE', sub: `${r ? T(r.team).name : ''} vs ${r ? T(r.kaiTeam).name : ''}`, style: 'loc', at: 300 } },
      { d: 3200, scene: 'arena', grade: 'sunset', cam: [[0, 0, -8, 1.16], [1, 10, -4, 1.26]], cast: passed.map((id, i) => ({ id: 'g' + i, kind: 'bust', x: -.66 + i * .44, y: 130, d: .9, sil: true, rim: T(id).colors[0] })),
        say: ['narrator', r && r.passed.length ? `${r.passed.length} teams passed on you. Their GMs are in the second row, pretending not to look.` : 'Every GM in the league is in the second row.'] },
      { d: 2600, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial', music: 'clutch',
        cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'smile', from: { dx: 160, t: 300, ease: 'back' }, rim: '#fca5a5' }, { id: 'you', kind: 'bust', x: -.55, expr: 'fierce', from: { dx: -160, t: 300, ease: 'back' }, rim: '#93c5fd' }],
        title: { text: 'IT DOESN\'T COUNT', sub: 'It counts', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 8]] },
    ] });
  }

  /* ---------- the fixed high: Summer League vs Kai's team (a scripted ending, like the Chapter 3 highs) ---------- */
  function summerShots(o) {
    const [u, t] = o.score, base = Math.max(u, t), down = [base - 4, base + 3], fin = [base + 6, base + 2], pts = (o.box && o.box.pts || 20) + 9; o.fin = fin;
    return [
      { d: 3000, court: '@venue', score: true, music: 'build', tr: 'fade', cam: [[0, 16, 34, 2.0], [1, 10, 10, 2.2]], cast: [SP('kai', 200, 150, 1), SP('you', 230, 120)],
        say: ['narrator', 'Down seven, five minutes left. Kai just hit three in a row and looked at the second row.'], ev: [[300, 'bug', `${down[0]}-${down[1]}`], [300, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you; p.face = -1; p.stance = true; CSK.jumper(S2, S2.sp.kai, tm, .3, { made: true, flight: 1.1 }); } },
      { d: 2600, scene: 'void', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.5]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }],
        title: { text: 'CHIP ON THE SHOULDER', sub: 'Every name on the page', style: 'slam', at: 900 }, ev: [[300, 'glint', 'you'], [700, 'aura', 'you'], [700, 'sfx', 'sig'], [900, 'impact', 140]] },
      { d: 4600, score: true, music: 'clutch', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'arena', cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }], cam: [[0, 0, 22, 1.5], [1, 0, 22, 1.6]] }, sfx: ['STRIPPED!', .72, .25, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', tone: true, shot: { court: '@venue', cast: [SP('you', 250, 150)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.you, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SPLASH', .3, .3, '#7dd3fc', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', shot: { scene: 'arena', cast: [{ id: 'kai', kind: 'bust', x: .45, expr: 'shocked', rim: '#93c5fd' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: ['AND ONE!', .3, .35, '#fde68a', 5, 1900] },
      ] }, ev: [[400, 'bug', `${down[0] + 3}-${down[1]}`], [1300, 'bug', `${down[0] + 6}-${down[1]}`], [2300, 'bug', `${fin[0] - 2}-${fin[1]}`], [2300, 'cheer'], [2400, 'sfx', 'roar']] },
      { d: 3600, court: '@venue', score: true, scoreText: `${fin[0] - 2}-${fin[1]}`, clockText: '0:04', cam: [[0, 8, 24, 2.3], [1, 4, -8, 2.4, 'io']], slow: [[400, 3000, .4]], speed: 'radial', focus: [.5, .35], cast: [SP('you', 196, 128), SP('kai', 206, 116, 1)],
        ev: [[0, 'riser', 3], [2300, 'bug', `${fin[0]}-${fin[1]}`], [2300, 'sfx', 'buzzer'], [2400, 'cheer'], [2400, 'impact', 160]],
        play(S2, tm) { const d = S2.sp.kai; d.face = 1; d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .35) / .6)) * Math.PI) * 10); CSK.jumper(S2, S2.sp.you, tm, .2, { made: true, flight: 1.25, jump: 17 }); } },
      { d: 3400, court: '@venue', score: true, scoreText: `${fin[0]}-${fin[1]}`, grade: 'gold', music: 'victory', cam: [[0, 0, 20, 1.6], [1, 0, 14, 1.4]], fgHop: true,
        cast: [SP('you', 192, 140), SP('m1', 150, 160), SP('m2', 236, 164)], title: { text: `${pts} POINTS`, sub: 'Over Kai Sterling, in front of every team that passed', style: 'slam', at: 500 },
        ev: [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', 160], [500, 'sfx', 'impact']],
        play(S2, tm) { CSK.cel(S2.sp.you, tm < 1.5 ? 'flex' : 'joy', tm); CSK.cel(S2.sp.m1, 'joy', tm); CSK.cel(S2.sp.m2, 'joy', tm + .3); S2.ball.holder = null; S2.ball.z = 0; S2.ball.x = 180; S2.ball.y = 190; } },
      { d: 2600, scene: 'arena', grade: 'gold', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'smile', rim: '#fde68a' }], say: ['narrator', 'In the second row, a GM puts his phone away and leaves early.'] },
    ];
  }
  const scripts = { c4_summer: { moments: 2, at: 0, async run(o) { const shots = summerShots(o); CUTSCENES._c4_summer = { name: 'Summer League', chapter: 'Chapter 4', shots }; await Story.cut('_c4_summer', o.ctx, { seenId: 'c4_summer' }); return o.fin; } } };

  /* ---------- post-credits: Kai's first NBL practice + "Next time…" (Chapter 5) ---------- */
  function postCredits(s) {
    const r = R(s), t = r ? T(r.kaiTeam) : T('las'), star = (t.stars || ['A veteran star'])[0], st = NBL_LEAGUE.stars[star], lk = st && LOCAL_TEAMS['nbl_' + st.team] && LOCAL_TEAMS['nbl_' + st.team].looks[star];
    if (lk) STORY.characters.vet.look = Object.assign({}, lk);
    return def('pc_kai_practice', { name: 'Rookie', chapter: 'Chapter 4 · after the credits', shots: [
      { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: `${t.name} practice facility · 8:02 a.m.`, style: 'line', at: 300 } },
      { d: 3400, scene: 'gym', grade: 'blue', music: 'kai', cam: [[0, -30, -4, 1.1], [1, 10, 0, 1.2, 'lin']], cast: [{ id: 'kai', kind: 'actor', x: -.1, y: 72, s: 2.6, ball: true, path: [[0, -.35], [2400, -.05]] }, { id: 'vet', kind: 'actor', x: .34, y: 72, s: 2.8, face: -1 }],
        say: ['narrator', 'Kai Sterling, pick number ' + (r ? r.kaiPick : 1) + ', first one in the building.'] },
      { d: 3200, scene: 'gym', grade: 'blue', cam: [[0, 18, -2, 1.24], [1, 22, 2, 1.34]], cast: [{ id: 'vet', kind: 'bust', x: .3, expr: 'neutral', rim: '#facc15' }, { id: 'kai', kind: 'bust', x: -.7, y: 130, sil: true, rim: '#93c5fd', d: 1.2 }],
        say: ['vet', 'Rookie. Rebounds and water. That\'s your job.'] },
      { d: 2600, scene: 'void', grade: 'dark', cam: [[0, 0, 6, 1.32], [1, 0, 10, 1.42]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'determined', rim: '#93c5fd' }], ev: [[900, 'glint', 'kai']], title: { text: 'For the first time in his life, Kai is nobody.', style: 'line', at: 700 } },
      { d: 1100, scene: 'void', music: null, title: { text: 'NEXT TIME…', style: 'next', at: 0 }, ev: [[0, 'sfx', 'whoosh']] },
      { d: 2400, scene: 'arena', grade: 'red', tr: 'flash', speed: 'h', cam: [[0, -14, 0, 1.15], [1, 12, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'bust', x: .1, sil: true, rim: '#ef4444' }], say: ['narrator', 'Rookie camp. Eighty-two games. And a page in your shoe with thirty names on it.'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 2000, scene: 'void', title: { text: 'Chapter 5: The League', sub: 'Next time on Hoop Dreams', style: 'next2', at: 80 }, ev: [[80, 'sfx', 'sting']] },
    ] });
  }

  return { combineIntro, whisper, medicals, kaiPov, greenRoom, kai, slide, chairs, call, undrafted, summerPre, scripts, postCredits };
})();
if (typeof JAM_SCRIPTS !== 'undefined') Object.assign(JAM_SCRIPTS, CH4S.scripts);
