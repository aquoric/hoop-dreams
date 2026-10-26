/* =====================================================================
   DATA-STORY-CH1.JS — Chapter 1's cinematic scenes (STORY.md, Chapter 1: Concrete Dreams) and the Summer Jam scripts.
   The story nodes are in js/data-story.js; the arcs, teasers and post-credits are in js/data-arcs.js.

   Major scenes are unskippable the first time (js/story-fx.js); scenes marked minor: true can always be skipped.
   JAM_SCRIPTS: late in a Summer Jam game the story takes over (js/match.js runScript): its cinematic plays,
   then it returns the final score. The semifinal is the fixed high (a comeback and your buzzer-beater),
   the final is the fixed low (Kai's late run and the last possession you lose).
   ===================================================================== */
const CH1 = (() => {
  const S = () => Game.state;
  const kaiLook = () => (typeof UI !== 'undefined' && UI.charLook ? UI.charLook('kai') : null);
  /* the focus you picked with Lou: which attributes the montage fills */
  const FOCUS = { focus_shot: [['THREE', 'three'], ['MID', 'mid']], focus_handle: [['HANDLE', 'handle'], ['SPEED', 'speed']], focus_rim: [['FINISH', 'finish'], ['DUNK', 'dunk']],
    focus_def: [['PER. D', 'perD'], ['INT. D', 'intD']], focus_mind: [['IQ', 'iq'], ['CLUTCH', 'clutch']] };
  const focusOf = s => Object.keys(FOCUS).find(f => s.flags[f]) || 'focus_shot';
  /* Lou's first session: a montage built around what you chose to work on (stat bars fill, PUSH press) */
  function montage(s) {
    const F = FOCUS[focusOf(s)], gain = { three: 3, mid: 2, handle: 3, speed: 1, finish: 3, dunk: 1, perD: 3, intD: 1, iq: 3, clutch: 2 };
    const rows = F.map(([l, k]) => { const now = Math.round(Engine.attr(s, k)); return [l, Math.max(20, now - (gain[k] || 1)), now]; });
    CUTSCENES._montage = { name: 'Six A.M.', chapter: 'Chapter 1', shots: [
      { d: 2600, scene: 'gym', empty: true, grade: 'gold', dim: .25, music: 'lou', tr: 'fade', cam: [[0, -60, 10, 1.1], [1, 10, 6, 1.18, 'lin']],
        cast: [{ id: 'bench', kind: 'bench', x: .4, y: 66, s: 2.6, d: 1 }, { id: 'lou', kind: 'actor', x: .4, y: 66, s: 2.6, face: -1, acts: [[0, 'bench', 99]] }, { id: 'you', kind: 'actor', y: 70, s: 2.6, path: [[0, -1.1], [2200, -.2]] }],
        title: { text: 'Halsey Community Center', sub: '6:00 a.m.', style: 'loc', at: 300 } },
      { d: 4200, manga: { panels: [
        { r: [0, 0, .42, .55], at: 0, from: 'left', tone: true, shot: { scene: 'gym', empty: true, cast: [{ id: 'lou', kind: 'bust', x: 0, expr: 'fierce', rim: '#fde68a' }], cam: [[0, 0, 10, 1.2], [1, 0, 6, 1.3]] }, sfx: ['TWEET!', .7, .25, '#facc15', 4], snd: 'whistle' },
        { r: [.42, 0, .58, .55], at: 700, from: 'right', lines: true, shot: { scene: 'gym', empty: true, cam: [[0, 0, 30, 1.3], [1, 0, 30, 1.3]], cast: [{ id: 'you', kind: 'actor', y: 74, s: 3, path: [[0, -.8], [900, .8], [1800, -.8], [2700, .8], [3600, -.8]] }] }, sfx: ['SQUEAK', .3, .3, '#f8fafc', 3], snd: 'squeak' },
        { r: [0, .55, 1, .45], at: 1500, from: 'bottom', shot: { court: { base: 'street_night', sky: 'night', lights: null, crowd: 0 }, cam: [[0, 0, 0, 1.4], [1, 0, -20, 1.5]], cast: [{ id: 'you', kind: 'sprite', x: 192, y: 150 }], play(S2, t) { CSK.jumper(S2, S2.sp.you, t, .15, { made: true, flight: 1 }); } }, sfx: ['SWISH', .72, .45, '#facc15', 5, 1200] },
      ] } },
      { d: 3400, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], rot: -.06,
        cast: [{ id: 'lou', kind: 'actor', x: .3, y: 70, s: 3, face: -1, acts: [[0, 'argue', 99]] }, { id: 'you', kind: 'actor', x: -.2, y: 72, s: 3, acts: [[0, 'kneel', 99, { down: true }]] }],
        say: ['lou', 'Again. Push!'], ev: [[700, 'qte', { kind: 'timed', label: 'PUSH', id: 'push', time: 7000 }], [720, 'act', 'you', null]] },
      { d: 3200, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 0, 1.1], [1, 0, -4, 1.18]], cast: [{ id: 'you', kind: 'bust', x: -.42, expr: 'determined', rim: '#fde68a' }],
        say: (ctx, q) => q.push ? ['lou', 'There it is. That\'s the kid I saw.'] : ['lou', 'Sloppy. We go again tomorrow.'],
        ev: [[200, 'stats', rows, 'Day one with Lou']] },
    ] };
    return '_montage';
  }
  /* the PUSH press: get it and the session sticks (+1 on your main focus) */
  function montageBonus(s) { const k = FOCUS[focusOf(s)][0][1]; return { id: 'push', ok: { attrs: { [k]: 1 } }, okToast: '💪 Pushed through: one more point from Lou\'s session' }; }

  /* ---------- court choreography for the Summer Jam scripts ---------- */
  const SP = (id, x, y, team, look) => Object.assign({ id, kind: 'sprite', x, y }, team ? { team } : {}, look ? { look } : {});
  function semiShots(o) {
    const [u, t] = o.score, gw = CUTSCENES.game_winner.shots, down = [12, 18];
    return [
      { d: 3200, court: '@venue', score: true, cam: [[0, 16, 34, 2.0], [1, 10, 4, 2.2]], music: 'build', tr: 'fade', cast: [SP('def', 200, 150, 1), SP('you', 230, 120)],
        say: ['mc', 'SOUTHSIDE ON A RUN! THE DEFENDING CHAMPS WOKE UP!'], ev: [[300, 'bug', `${Math.min(u, down[0])}-${Math.max(t, down[0] + 2)}`], [1500, 'bug', `${down[0]}-${down[1]}`], [1500, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you; p.face = -1; p.stance = true; CSK.jumper(S2, S2.sp.def, tm, .3, { made: true, flight: 1.1 }); } },
      { d: 2600, scene: 'street_night', grade: 'spot', music: null, cam: [[0, 0, 8, 1.3], [1, 0, 14, 1.5, 'io']], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a', sweat: true }],
        say: ['you', 'Down six. Forty seconds. Okay.'], ev: [[0, 'sfx', 'heartbeat'], [900, 'sfx', 'heartbeat'], [1600, 'glint', 'you']] },
      { d: 4600, score: true, music: 'clutch', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'street_night', cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }], cam: [[0, 0, 20, 1.5], [1, 0, 20, 1.6]] }, sfx: ['SNATCH!', .72, .25, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', shot: { court: '@venue', cast: [SP('m1', 250, 150)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.m1, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SPLASH', .3, .3, '#7dd3fc', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', tone: true, shot: { scene: 'street_night', cast: [{ id: 'you', kind: 'bust', x: -.3, expr: 'fierce', rim: '#fde68a' }, { id: 'tariq', kind: 'bust', x: .45, expr: 'smile', rim: '#86efac' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: ['AND ONE!', .75, .35, '#facc15', 5], snd: 'impact' },
      ] }, ev: [[200, 'bug', '14-18'], [1100, 'bug', '16-18'], [2100, 'bug', '18-18'], [2100, 'cheer'], [2200, 'sfx', 'roar']] },
      Object.assign({}, gw[1], { scoreText: '18-18', clockText: '0:03', music: 'clutch' }),
      Object.assign({}, gw[3], { scoreText: '18-18', ev: (gw[3].ev || []).concat([[1800, 'bug', '20-18'], [1800, 'score', '0.0']]) }),
      Object.assign({}, gw[4], { scoreText: '20-18', title: { text: 'BUZZER-BEATER', sub: '{name} · Halsey Street 20-18', style: 'slam', at: 600 } }),
    ];
  }
  function finalShots(o) {
    const s = S(), [u, t] = o.score, K = kaiLook(), rudy = s.jam && s.jam.mate === 'Big Rudy', ko = SP('kai', 0, 0, 1, K);
    const hurt = rudy
      ? { d: 3400, scene: 'street_night', grade: 'night', cam: [[0, 0, 10, 1.15], [1, 0, 6, 1.25]], cast: [{ id: 'mc', kind: 'bust', x: .35, expr: 'shocked', rim: '#fde68a' }, { id: 'you', kind: 'bust', x: -.62, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
          say: ['mc', 'THAT\'S SIX! BIG RUDY HAS FOULED OUT!'], ev: [[0, 'sfx', 'whistle'], [400, 'sfx', 'boo', .6]] }
      : { d: 3600, scene: 'street_night', grade: 'night', cam: [[0, 0, 26, 1.35], [1, 0, 22, 1.5]],
          cast: [{ id: 'tariq', kind: 'actor', x: .05, y: 70, s: 3, acts: [[0, 'down', 99]] }, { id: 'you', kind: 'actor', x: -.22, y: 72, s: 3, face: 1, acts: [[0, 'kneel', 99]] }],
          say: ['tariq', 'My calf. It\'s locked up, bro.'], ev: [[0, 'sfx', 'groan'], [300, 'sfx', 'gasp']] };
    const kaiS = (x, y) => Object.assign({}, ko, { x, y });
    return [
      { d: 3000, court: '@venue', score: true, music: null, tr: 'fade', cam: [[0, 26, 36, 2.2], [1, 22, 30, 2.45]], cast: [SP('you', 230, 150), kaiS(205, 130)],
        say: ['narrator', 'Then Kai stops talking.'], ev: [[0, 'drain', .45, 1400], [0, 'sfx', 'heartbeat'], [1400, 'sfx', 'heartbeat']],
        play(S2) { const k = S2.sp.kai, p = S2.sp.you; k.face = 1; k.stance = true; p.face = -1; S2.ball.holder = p; } },
      { d: 2800, scene: 'void', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.5]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'determined', rim: '#93c5fd' }],
        title: { text: 'THE ZONE', sub: 'Kai Sterling', style: 'slam', at: 1100 }, ev: [[300, 'glint', 'kai'], [700, 'aura', 'kai', '96,165,250'], [700, 'sfx', 'riser', 1], [1100, 'impact', 140], [1100, 'sfx', 'stinger']] },
      hurt,
      { d: 4600, score: true, scoreText: `${u}-${t}`, music: 'kai', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'street_night', cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'smile', rim: '#93c5fd' }], cam: [[0, 0, 22, 1.5], [1, 0, 22, 1.6]] }, sfx: ['SNATCH', .72, .25, '#93c5fd', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', tone: true, shot: { court: '@venue', cast: [kaiS(200, 140)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.kai, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SWISH', .3, .3, '#93c5fd', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', shot: { scene: 'street_night', cast: [{ id: 'kai', kind: 'bust', x: .35, expr: 'fierce', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.45, expr: 'shocked', rim: '#fdba74' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: ['BOOM', .3, .35, '#ef4444', 5], snd: 'impact' },
      ] }, ev: [[400, 'bug', `${Math.min(u, 17)}-${Math.max(t, 15)}`], [1300, 'bug', `${Math.min(u, 18)}-${Math.max(t, 17)}`], [2300, 'bug', '19-19'], [2300, 'sfx', 'roar']] },
      { d: 2400, scene: 'street_night', grade: 'spot', music: 'clutch', cam: [[0, 0, 8, 1.3], [1, 0, 14, 1.5, 'io']], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fdba74', sweat: true }],
        say: ['narrator', 'Nineteen all. Next bucket wins.'], ev: [[0, 'sfx', 'heartbeat'], [800, 'sfx', 'heartbeat']] },
      // the last possession: your drive gets stuffed…
      { d: 3600, court: '@venue', score: true, scoreText: '19-19', cam: [[0, 30, 30, 2.1], [1, 12, 2, 2.5, 'io']], slow: [[1100, 2200, .35]], cast: [SP('you', 232, 150), kaiS(206, 118)],
        ev: [[1250, 'impact', 160, ['#ffffff', '#1e3a8a']], [1250, 'sfx', 'impact'], [1250, 'shake', 10], [1300, 'sfx', 'gasp'], [1400, 'title', 'STUFFED', 'Kai Sterling', 'slam']],
        play(S2, tm) { const p = S2.sp.you, k = S2.sp.kai, B = S2.ball; k.face = 1;
          if (tm < 1.1) { CSK.run(p, tm, .2, 1.1, 232, 150, 206, 100); p.face = -1; B.holder = p; k.stance = true; return; }
          const u2 = tm - 1.1; p.z = Math.max(0, Math.sin(Math.min(1, u2 / .7) * Math.PI) * 16); p.act = u2 < .7 ? { type: 'layup', t: .3, T: .7, released: u2 > .15 } : { type: 'land', t: u2 - .7, T: .25 };
          k.act = { type: 'block', t: .1 }; k.z = Math.max(0, Math.sin(Math.min(1, u2 / .7) * Math.PI) * 18);
          if (u2 < .15) { B.holder = p; return; } B.holder = null; const v = Math.min(1, (u2 - .15) / .8); B.x = 200 - v * 70; B.y = 92 + v * 80; B.z = Math.max(0, 34 + v * 30 - v * v * 64); B.spin = u2 * 20; } },
      // …he crosses you, you fall…
      { d: 3600, court: '@venue', score: true, scoreText: '19-19', cam: [[0, 26, 42, 2.4], [1, 14, 30, 2.75, 'io']], slow: [[900, 2400, .3]], cast: [kaiS(232, 158), SP('you', 206, 140)],
        ev: [[1150, 'sfx', 'ooh'], [1300, 'impact', 120, ['#ffffff', '#0a0a12']], [1300, 'shake', 6]],
        play(S2, tm) { const k = S2.sp.kai, p = S2.sp.you; S2.ball.holder = k; k.face = -1; p.face = 1; p.stance = tm < .9;
          if (tm > .8 && tm < 1.15) k.act = { type: 'move', id: 'cross', t: tm - .8, T: .35, f0: -1, f1: 1 }; else k.act = null;
          if (tm > 1.1) { p.stance = false; p.act = { type: tm < 1.5 ? 'stumble' : 'sit', t: tm < 1.5 ? tm - 1.1 : tm - 1.5 + .3, T: 9 }; CSK.run(k, tm, 1.2, 2.2, 232, 158, 196, 128); } } },
      // …and he hits it over you
      { d: 3600, court: '@venue', score: true, scoreText: '19-19', cam: [[0, 8, 24, 2.3], [1, 4, -8, 2.4, 'io']], slow: [[400, 3000, .4]], speed: 'radial', focus: [.5, .35], cast: [kaiS(196, 128), SP('you', 204, 140)],
        ev: [[0, 'riser', 3], [2300, 'bug', '19-21'], [2300, 'sfx', 'buzzer'], [2400, 'cheer']],
        play(S2, tm) { const p = S2.sp.you; p.face = 1; p.act = { type: 'sit', t: 1, T: 99 }; CSK.jumper(S2, S2.sp.kai, tm, .2, { made: true, flight: 1.25, jump: 17 }); } },
      // he stands over you
      { d: 3400, court: '@venue', score: true, scoreText: '19-21', cam: [[0, 16, 26, 2.9], [1, 16, 22, 3.1]], rot: .12, music: 'kai', cast: [SP('you', 200, 140), kaiS(214, 132)],
        say: ['kai', 'Told you. Ask around.'], ev: [[0, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you, k = S2.sp.kai; p.face = 1; p.act = { type: 'sit', t: 1, T: 99 }; k.face = -1; k.act = { type: 'point', t: tm, T: 99 }; S2.ball.holder = null; S2.ball.x = 236; S2.ball.y = 150; S2.ball.z = 0; } },
      { d: 2800, scene: 'street_night', grade: 'mono', drain: 1, music: null, cam: [[0, 0, 10, 1.4], [1, 0, 14, 1.55]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }],
        ev: [[0, 'sfx', 'ring']] },
    ];
  }
  /* the Summer Jam scripts (js/match.js runScript): the cinematic, then the final score */
  const scripts = {
    semi: { at: 12, async run(o) { CUTSCENES._semi = { name: 'The Comeback', chapter: 'Chapter 1', shots: semiShots(o) }; await Story.cut('_semi', o.ctx, { seenId: 'jam_semi' }); return [20, 18]; } },
    final: { at: 13, async run(o) { CUTSCENES._final = { name: 'The Last Possession', chapter: 'Chapter 1', shots: finalShots(o) }; await Story.cut('_final', o.ctx, { seenId: 'jam_final' }); return [19, 21]; } },
  };
  return { montage, montageBonus, focusOf, scripts };
})();
const JAM_SCRIPTS = CH1.scripts;

window.EXTRA_CUTSCENES = Object.assign(window.EXTRA_CUTSCENES || {}, {
  /* ---- the dawn time-lapse over Halsey Street, the cracked rim, you shooting alone ---- */
  opening: { name: 'Concrete Dreams', chapter: 'Chapter 1', shots: [
    { d: 4400, scene: 'street_night', grade: 'night', dim: .9, music: 'story', tr: 'fade', cam: [[0, -100, -30, 1.05], [1, 40, -14, 1.14, 'lin']],
      title: { text: '{hometown}', sub: 'Halsey Street Courts · 5:52 a.m.', style: 'loc', at: 600 }, ev: [[300, 'dim', 0, 3800], [1600, 'light', 'sunset', 2400], [0, 'sfx', 'crowd', .2]] },
    { d: 3200, scene: 'street_sunset', grade: 'sunset', cam: [[0, 196, -30, 2.2], [1, 200, -32, 2.45]], say: ['narrator', 'No net. A rim bent from a thousand dunks that never happened.'] },
    { d: 3600, court: { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 }, grade: 'sunset', cam: [[0, 0, -8, 1.1], [1, 0, 26, 1.45]],
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 168 }], say: ['narrator', 'Sixteen, unranked, nobody. Out here before anyone else.'],
      play(S, t) { const p = S.sp.you; p.face = 1; S.ball.holder = p; p.holdBall = false; if (t > 1.6 && t < 1.95) p.act = { type: 'move', id: 'btl', t: t - 1.6, T: .35, f0: 1, f1: -1 }; else if (t >= 1.95 && t < 2.3) p.act = { type: 'move', id: 'cross', t: t - 1.95, T: .35, f0: -1, f1: 1 }; else p.act = null; } },
    { d: 2600, scene: 'street_sunset', cam: [[0, 0, 8, 1.2], [1, 0, 14, 1.42, 'io']], grade: 'sunset', music: null,
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fdba74' }], say: ['you', 'One day, everybody\'s gonna know my name.'], ev: [[200, 'sfx', 'heartbeat']] },
    { d: 2800, court: { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 }, grade: 'sunset', cam: [[0, 0, 40, 1.35], [.45, 0, 0, 1.25], [1, 0, -60, 1.6, 'io']],
      cast: [{ id: 'you', kind: 'sprite', x: 192, y: 160 }], slow: [[700, 2800, .4]], speed: 'radial', focus: [.5, .3], music: 'build',
      ev: [[0, 'riser', 2.6]], play(S, t) { CSK.jumper(S, S.sp.you, t, .25, { made: true, flight: 1.4, onMake: () => S.fx.impact(170) }); } },
  ] },
  /* ---- Kai arrives (~30s): the SUV, the court goes quiet, the crowd parts, a slow walk, his eyes, the ball on one finger ---- */
  kai_showdown: { name: 'The Rival', chapter: 'Chapter 1', shots: [
    { d: 3400, scene: 'street_sunset', cam: [[0, -60, -10, 1.1], [1, 30, -6, 1.15]], grade: 'sunset', music: null, tr: 'fade',
      cast: [{ id: 'car', kind: 'car', x: 1.6, y: 58, move: [[0, 1.8], [2200, .45]] }],
      say: ['narrator', 'A black SUV pulls up. Nobody on Halsey Street drives an SUV like that.'], ev: [[0, 'sfx', 'engine'], [2300, 'sfx', 'thud', .6]] },
    { d: 5200, scene: 'street_sunset', grade: 'sunset', cam: [[0, 30, 20, 1.15], [1, 0, 16, 1.22]], slow: [[1500, 5200, .55]],
      cast: [{ id: 'kai', kind: 'actor', x: .04, y: 36, s: 2.4, d: .9, ball: true, hold: true, path: [[1000, .04, 36], [5000, .04, 66]] },
        { id: 'kid1', kind: 'actor', x: -.04, y: 66, s: 2.6, path: [[300, -.04], [1300, -.4]] }, { id: 'tariq', kind: 'actor', x: -.16, y: 72, s: 2.6, path: [[200, -.16], [1300, -.66]] },
        { id: 'kid2', kind: 'actor', x: .1, y: 70, s: 2.6, path: [[400, .1], [1500, .5]] }],
      say: ['narrator', 'The whole court goes quiet. The crowd splits down the middle.'], ev: [[0, 'sfx', 'heartbeat'], [1600, 'sfx', 'heartbeat'], [3200, 'sfx', 'heartbeat']] },
    { d: 2400, scene: 'street_sunset', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.45]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'smile', rim: '#facc15' }],
      ev: [[500, 'glint', 'kai'], [500, 'sfx', 'stinger']] },
    { d: 3400, scene: 'street_sunset', grade: 'sunset', cam: [[0, 0, 0, 1.4], [1, 0, -12, 1.7, 'io']], cast: [{ id: 'kai', kind: 'actor', x: 0, y: 70, s: 3.4, ball: true, acts: [[0, 'spin', 99]] }],
      ev: [[200, 'sfx', 'whoosh'], [1200, 'freeze', 1600, { name: 'KAI STERLING', sub: '#3 in the class · Westbrook Academy', stats: [['SPD', 91], ['HND', 94], ['SHT', 88], ['ATH', 93]] }], [1200, 'sfx', 'stinger']] },
    { d: 3200, scene: 'street_sunset', cam: [[0, 20, -10, 1.15], [1, 0, -16, 1.25]], grade: 'sunset',
      cast: [{ id: 'kai', kind: 'bust', x: .25, expr: 'smile', rim: '#facc15' }, { id: 'you', kind: 'bust', x: -.62, y: 130, sil: true, rim: '#fdba74', d: 1.25 }],
      say: ['kai', 'So this is the famous Halsey Street. Smaller than it looks on the internet.'] },
    { d: 2200, scene: 'street_sunset', music: 'clutch', cam: [[0, 0, 6, 1.15], [1, 0, 12, 1.35, 'snap']], grade: 'sunset',
      cast: [{ id: 'you', kind: 'face', x: 0, expr: 'angry', rim: '#fdba74' }], say: ['you', 'We got next. You and me.'], ev: [[0, 'shake', 3]] },
    { d: 2400, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial',
      cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'smile', from: { dx: 160, t: 300, ease: 'back' }, rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.55, expr: 'determined', from: { dx: -160, t: 300, ease: 'back' }, rim: '#fca5a5' }],
      title: { text: 'VS', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 10]] },
  ] },
  /* ---- Kai's POV: the SUV ride home, Silk on speakerphone ---- */
  kai_pov_suv: { name: 'The Ride Home', chapter: 'Chapter 1 · Kai', shots: [
    { d: 3000, scene: 'highway', grade: 'night', music: 'kai', tr: 'fade', cam: [[0, -20, -6, 1.1], [1, 20, -4, 1.18]], cast: [{ id: 'car', kind: 'car', x: 0, y: 66, lights: true, d: 1 }],
      title: { text: 'Westbrook Hills', sub: '9:40 p.m.', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 3800, scene: 'city', grade: 'blue', cam: [[0, 30, 0, 1.15], [1, 40, -4, 1.24]], cast: [{ id: 'kai', kind: 'bust', x: .3, expr: 'neutral', rim: '#93c5fd' }],
      say: () => Game.state && Game.state.flags.beat_kai ? ['silk', '(speakerphone) You lost to a nobody? On a playground?'] : ['silk', '(speakerphone) You let a nobody score on you?'],
      ev: [[600, 'flash', '#fde68a', .12], [1700, 'flash', '#fde68a', .12], [2800, 'flash', '#fde68a', .12]] },
    { d: 2800, scene: 'city', grade: 'blue', bars: 40, cam: [[0, 0, 4, 1.3], [1, 0, 8, 1.42]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'neutral', rim: '#93c5fd' }],
      say: ['narrator', 'Kai stares out the window. He doesn\'t answer.'], ev: [[1200, 'flash', '#fde68a', .1]] },
    { d: 2600, scene: 'city', grade: 'blue', cam: [[0, 0, 30, 1.0], [1, 0, 34, 1.06]], cast: [{ id: 'kai', kind: 'hand', x: 0, y: 160, s: 3.2, curlTo: [[300, 0], [1800, 1]], shake: .4 }],
      say: ['silk', 'Sterlings don\'t lose to nobodies.'] },
  ] },
  /* ---- Lou's knee, 1998 (a faded flashback) ---- */
  lou_flashback: { name: '1998', chapter: 'Chapter 1 · Lou', shots: [
    { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'Pistonz vs Fakers · 1998', style: 'line', at: 300 }, ev: [[200, 'sfx', 'piano']] },
    { d: 3600, scene: 'arena', sepia: true, cam: [[0, -40, 16, 1.2], [1, 20, 10, 1.3, 'lin']],
      cast: [{ id: 'big', kind: 'actor', x: .32, y: 72, s: 3.3, face: -1, acts: [[0, 'block', 99]] },
        { id: 'younglou', kind: 'actor', x: -1, y: 74, s: 2.8, ball: true, look: { skin: '#6b3d25', hair: 'fade', hairColor: '#111', outfit: 'jersey', jersey: '#1d4ed8', trim: '#ef4444', num: 4 }, path: [[0, -1], [2600, .12]] }],
      say: ['lou', 'Down twenty in the fourth. And I want the highlight.'], ev: [[0, 'cheer'], [300, 'sfx', 'roar']] },
    { d: 3000, scene: 'arena', sepia: true, slow: [[0, 2200, .4]], cam: [[0, 10, 6, 1.6], [1, 10, 0, 1.8, 'io']],
      cast: [{ id: 'big', kind: 'actor', x: .18, y: 72, s: 3.6, face: -1, acts: [[0, 'block', 99]], zs: [[300, 0], [900, 10], [1500, 6], [1700, 0]] },
        { id: 'younglou', kind: 'actor', x: .02, y: 74, s: 3.1, look: { skin: '#6b3d25', hair: 'fade', hairColor: '#111', outfit: 'jersey', jersey: '#1d4ed8', trim: '#ef4444', num: 4 }, acts: [[0, 'dunk', 1.2], [1500, 'down', 99]], zs: [[0, 0], [600, 14], [1300, 16], [1550, 0]] }],
      ev: [[1500, 'impact', 220, ['#000000', '#ef4444']], [1500, 'sfx', 'crack'], [1500, 'shake', 12], [1600, 'sfx', 'gasp']] },
    { d: 2600, scene: 'arena', sepia: true, drain: 1, music: null, cam: [[0, 0, 30, 1.5], [1, 0, 34, 1.6]],
      cast: [{ id: 'younglou', kind: 'actor', x: 0, y: 74, s: 3.1, look: { skin: '#6b3d25', hair: 'fade', hairColor: '#111', outfit: 'jersey', jersey: '#1d4ed8', trim: '#ef4444', num: 4 }, acts: [[0, 'down', 99]] }],
      say: ['narrator', 'Eighteen thousand people. Not one of them makes a sound.'], ev: [[0, 'sfx', 'ring']] },
    { d: 2600, scene: 'gym', empty: true, grade: 'gold', tr: 'flash', music: 'lou', cam: [[0, 0, -2, 1.18], [1, 0, 4, 1.26]], cast: [{ id: 'lou', kind: 'bust', x: .1, expr: 'sad', rim: '#fde68a' }],
      say: ['lou', 'Tore everything in my knee. Never played another minute.'] },
  ] },
  /* ---- foreshadowing: Lou's napkin, a scout's whisper (minor) ---- */
  lou_cough: { name: 'The Napkin', chapter: 'Chapter 1', minor: true, shots: [
    { d: 3400, scene: 'street_night', grade: 'night', music: 'lou', tr: 'fade', cam: [[0, 30, 20, 1.3], [1, 40, 16, 1.42]],
      cast: [{ id: 'bench', kind: 'bench', x: .2, y: 66, s: 2.8, d: 1 }, { id: 'lou', kind: 'actor', x: .2, y: 66, s: 2.8, acts: [[0, 'bench', 99, { down: true }]] }],
      say: ['narrator', 'Lou coughs into a napkin. He folds it fast and shoves it in his pocket.'], ev: [[500, 'sfx', 'cough'], [1500, 'sfx', 'cough'], [2200, 'flicker', 600]] },
    { d: 3200, scene: 'street_night', grade: 'night', cam: [[0, 0, 10, 1.15], [1, 0, 6, 1.24]], cast: [{ id: 'scout', kind: 'bust', x: .4, sil: true, rim: '#94a3b8' }, { id: 'scout2', kind: 'bust', x: .7, sil: true, rim: '#94a3b8', d: .85 }],
      say: ['narrator', 'By the fence, a scout whispers: "Talented. Shoots too much. Attitude?"'] },
  ] },
  /* ---- final morning: silence, a heartbeat, Lou tapes your ankles (minor) ---- */
  tape_ankles: { name: 'Final Day', chapter: 'Chapter 1', minor: true, shots: [
    { d: 2000, scene: 'void', music: null, tr: 'fade', title: { text: 'Final day.', style: 'line', at: 200 }, ev: [[300, 'sfx', 'heartbeat'], [1200, 'sfx', 'heartbeat']] },
    { d: 3600, scene: 'street_sunset', grade: 'sunset', dim: .3, cam: [[0, -10, 24, 1.35], [1, 0, 20, 1.45]],
      cast: [{ id: 'bench', kind: 'bench', x: -.12, y: 68, s: 2.8, d: 1 }, { id: 'you', kind: 'actor', x: -.12, y: 68, s: 2.8, acts: [[0, 'bench', 99]] }, { id: 'lou', kind: 'actor', x: .1, y: 72, s: 2.8, face: -1, acts: [[0, 'kneel', 99, { down: true }]] }],
      say: ['narrator', 'Lou tapes your ankles. Neither of you says a word.'], ev: [[500, 'sfx', 'tape'], [1500, 'sfx', 'tape'], [2600, 'sfx', 'tape']] },
    { d: 2400, scene: 'street_sunset', grade: 'sunset', cam: [[0, 0, 30, 1.0], [1, 0, 34, 1.05]], cast: [{ id: 'lou', kind: 'hand', x: 0, y: 160, s: 3.2, curlTo: [[0, .2], [1600, .65]], tape: '#f8fafc' }],
      say: ['lou', 'The rim, not the man.'], ev: [[200, 'sfx', 'tape']] },
  ] },
  /* ---- the low: the color drains, the noise rings out, one ball rolls to a stop against your hand ---- */
  jam_low: { name: 'Silence', chapter: 'Chapter 1', shots: [
    { d: 4200, scene: 'street_night', grade: 'night', drain: 1, music: null, tr: 'fade', cam: [[0, 0, 40, 1.4], [1, 10, 42, 1.5]],
      cast: [{ id: 'you', kind: 'hand', x: .3, y: 114, s: 2.2, curl: .35 }, { id: 'ball', kind: 'ball', x: -1.1, y: 108, s: 4, phys: { z: 0, vx: 190, vz: 0, e: .5, f: .86, at: 300 } }],
      say: ['narrator', 'The ball rolls to a stop against your hand.'], ev: [[0, 'sfx', 'ring']] },
    { d: 3200, scene: 'street_night', grade: 'night', drain: 1, cam: [[0, 0, 16, 1.1], [1, 0, 12, 1.16]],
      cast: [{ id: 'kai', kind: 'actor', x: .55, y: 56, s: 2.2, d: .85, acts: [[0, 'joy', 99]] }, { id: 'kid1', kind: 'actor', x: -.3, y: 66, s: 2.4, path: [[0, -.3], [3200, -1.1]] }, { id: 'you', kind: 'actor', x: 0, y: 74, s: 2.8, acts: [[0, 'sit', 9, { t: 1 }]] }] },
  ] },
  /* ---- night, rain, Halsey Street: GET UP, and Lou under the light ---- */
  rain_getup: { name: 'What It Costs', chapter: 'Chapter 1', shots: [
    { d: 2400, scene: 'void', music: null, tr: 'fade', title: { text: 'Most people quit here.', style: 'line', at: 300 }, ev: [[200, 'sfx', 'piano']] },
    { d: 3600, scene: 'rain_night', weather: 'rain', drain: .6, cam: [[0, 0, 26, 1.3], [1, 0, 22, 1.4]],
      cast: [{ id: 'bench', kind: 'bench', x: .55, y: 58, s: 2.4, d: .9 }, { id: 'lou', kind: 'actor', x: .55, y: 58, s: 2.4, d: .9, face: -1, acts: [[0, 'bench', 99]] }, { id: 'you', kind: 'actor', x: -.1, y: 74, s: 3, acts: [[0, 'down', 99]] }],
      ev: [[200, 'flicker', 900], [500, 'qte', { kind: 'mash', label: 'GET UP', id: 'getup', n: 12, time: 6500 }], [520, 'act', 'you', 'kneel', 99], [520, 'drain', .25, 900], [1600, 'act', 'you', null], [1600, 'sfx', 'heartbeat']] },
    { d: 3400, scene: 'rain_night', weather: 'rain', grade: 'night', cam: [[0, 10, -4, 1.2], [1, 10, 0, 1.3]], cast: [{ id: 'lou', kind: 'bust', x: .2, expr: 'neutral', rim: '#fde68a' }],
      say: (ctx, q) => q.getup ? ['lou', 'Good. Now you know what it costs.'] : ['lou', 'Took you long enough. Now you know what it costs.'], ev: [[0, 'flicker', 400]] },
    { d: 2600, scene: 'rain_night', weather: 'rain', grade: 'night', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }],
      say: ['lou', 'Five-thirty tomorrow. Don\'t be late.'] },
  ] },
});
