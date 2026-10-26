/* =====================================================================
   DATA-STORY-CH2-SCENES.JS — Chapter 2's cinematic scenes (STORY.md, Chapter 2: Varsity Blues), its JV teams and the
   "Halsey Park II" script. The story nodes are in js/data-story-ch2.js; arcs and teasers in js/data-arcs.js.
   Major scenes are unskippable the first time (js/story-fx.js); minor: true can always be skipped.
   ===================================================================== */
/* JV squads (your school's JV is '@jv' in a match node) and the JV opponents */
Object.assign(LOCAL_TEAMS, {
  lincoln_jv: { name: 'Lincoln JV', abbr: 'LJV', colors: ['#b91c1c', '#fbbf24', '#111827'], rating: 42, logo: { shape: 'shield', icon: 'paw' }, roster: ['Freshman Ty', 'Kid from Algebra', 'Sean Platt', 'Marcus Webb'] },
  westbrook_jv: { name: 'Westbrook JV', abbr: 'WJV', colors: ['#1e3a8a', '#facc15', '#ffffff'], rating: 46, logo: { shape: 'shield', icon: 'wing' }, roster: ['Walk-on Will', 'Lucas Bell', 'Rich Kid Carter', 'Preston Ames'] },
  eastview_jv: { name: 'Eastview JV', abbr: 'EJV', colors: ['#0f766e', '#111827', '#5eead4'], rating: 41, logo: { shape: 'circle', icon: 'claw' }, roster: ['Kyle Ng', 'Ray Delgado Jr.', 'Benny Ortiz', 'Sol Harper'], star: { name: 'Kyle Ng', perD: 40, intD: 38 } },
  northgate_jv: { name: 'Northgate JV', abbr: 'NJV', colors: ['#6d28d9', '#d1d5db', '#1e1b4b'], rating: 45, logo: { shape: 'hex', icon: 'sword' }, roster: ['Mikey Lau', 'Dre Okoro', 'Tommy Vance', 'Jax Rourke'], star: { name: 'Mikey Lau', perD: 44, intD: 42 } },
});

const CH2 = (() => {
  const S = () => Game.state, hs = () => (S() && S().career.hs) || 'lincoln', coach = () => hs() === 'westbrook' ? 'graves' : 'brennan';
  const SP = (id, x, y, team, look) => Object.assign({ id, kind: 'sprite', x, y }, team ? { team } : {}, look ? { look } : {});
  /* the cut list: the posted names, your finger running down them, yours isn't there, the hallway empties */
  function cutList(s) {
    const names = hs() === 'westbrook' ? ['STERLING', 'VALE', 'MARSH', 'OKAFOR', 'AMES'] : ['HOLLIS', 'COLE', 'PIKE', 'MILES', 'PLATT'], good = !!s.flags.good_tryout;
    CUTSCENES._cut = { name: 'The List', chapter: 'Chapter 2', shots: [
      { d: 3200, scene: 'locker', music: 'story', tr: 'fade', cam: [[0, -40, 10, 1.1], [1, 0, 6, 1.2]],
        cast: [{ id: 'mate1', kind: 'actor', x: -.1, y: 70, s: 2.5, face: 1 }, { id: 'mate2', kind: 'actor', x: .08, y: 72, s: 2.5, face: 1 }, { id: 'tariq', kind: 'actor', x: .25, y: 70, s: 2.5, face: -1, acts: [[1800, 'joy', 99]] }, { id: 'you', kind: 'actor', y: 76, s: 2.6, path: [[0, -1.1], [1600, -.4]] }],
        say: ['narrator', 'The list goes up at 3:05. Everybody crowds the door.'] },
      { d: 4600, scene: 'cutlist', music: null, listNames: names, cam: [[0, 0, -30, 1.3], [1, 0, 20, 1.3, 'io']], cast: [{ id: 'you', kind: 'hand', x: .38, y: 40, s: 2.4, curl: .15, yMove: [[400, 0], [3600, 130]] }],
        ev: [[0, 'sfx', 'heartbeat'], [1100, 'sfx', 'heartbeat'], [2200, 'sfx', 'heartbeat'], [3300, 'sfx', 'heartbeat']] },
      { d: 2400, scene: 'locker', grade: 'blue', cam: [[0, 0, 8, 1.3], [1, 0, 14, 1.5, 'snap']], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'shocked', rim: '#93c5fd' }], ev: [[0, 'drain', .8, 1600], [0, 'sfx', 'whoosh'], [0, 'shake', 3]] },
      { d: 3800, scene: 'locker', drain: .8, dim: .3, cam: [[0, 0, 10, 1.15], [1, 0, 12, 1.22]],
        cast: [{ id: 'mate1', kind: 'actor', x: -.1, y: 70, s: 2.5, path: [[200, -.1], [2600, -1.2]] }, { id: 'mate2', kind: 'actor', x: .08, y: 72, s: 2.5, path: [[500, .08], [3000, 1.2]] }, { id: 'you', kind: 'actor', x: 0, y: 76, s: 2.6, acts: [[0, 'slump', 99]] }],
        say: ['narrator', 'Your name isn\'t there. The hallway empties around you.'], ev: [[0, 'sfx', 'ring']] },
      { d: 3200, scene: 'locker', grade: 'blue', cam: [[0, 20, -2, 1.18], [1, 24, 2, 1.26]], cast: [{ id: coach(), kind: 'bust', x: .3, expr: 'neutral', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.7, y: 130, sil: true, rim: '#93c5fd', d: 1.2 }],
        say: good ? [coach(), 'You were the best player in that gym. Sophomores don\'t start here.'] : [coach(), 'You played for yourself. Come back when you can play for us.'] },
    ] };
    return '_cut';
  }
  /* the JV grind: 6 a.m. runs, stat bars, PUSH */
  function jvMontage(s) {
    const rows = [['HANDLE', 'handle'], ['DEFENSE', 'perD'], ['STAMINA', 'stam']].map(([l, k]) => { const v = Math.round(Engine.attr(s, k)); return [l, Math.max(20, v - 2), v]; });
    CUTSCENES._jv = { name: 'JV', chapter: 'Chapter 2', shots: [
      { d: 2600, scene: 'street_night', dim: .6, grade: 'night', music: 'lou', tr: 'fade', cam: [[0, -60, 20, 1.1], [1, 20, 16, 1.18, 'lin']],
        cast: [{ id: 'you', kind: 'actor', y: 72, s: 2.6, path: [[0, -1.2], [2600, 1.2]] }], title: { text: 'Fifth Street', sub: '5:40 a.m.', style: 'loc', at: 300 } },
      { d: 4200, manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', tone: true, shot: { scene: 'gym', empty: true, cam: [[0, 0, 26, 1.3], [1, 0, 26, 1.3]], cast: [{ id: 'you', kind: 'actor', y: 74, s: 3, path: [[0, -.8], [800, .8], [1600, -.8], [2400, .8]] }] }, sfx: ['SQUEAK', .3, .3, '#f8fafc', 3], snd: 'squeak' },
        { r: [.5, 0, .5, .55], at: 700, from: 'right', shot: { scene: 'locker', cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'fierce', rim: '#fde68a', sweat: true }], cam: [[0, 0, 10, 1.3], [1, 0, 10, 1.4]] }, sfx: ['00', .75, .3, '#fde68a', 5] },
        { r: [0, .55, 1, .45], at: 1500, from: 'bottom', lines: true, shot: { court: { base: 'street_night', sky: 'night', lights: null, crowd: 0 }, cam: [[0, 0, 0, 1.4], [1, 0, -20, 1.5]], cast: [{ id: 'you', kind: 'sprite', x: 192, y: 150 }], play(S2, t) { CSK.jumper(S2, S2.sp.you, t, .15, { made: true, flight: 1 }); } }, sfx: ['SWISH', .72, .45, '#facc15', 5, 1200] },
      ] } },
      { d: 3400, scene: 'gym', empty: true, grade: 'gold', rot: -.06, cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 3, acts: [[0, 'kneel', 99, { down: true }]] }],
        say: ['narrator', 'Last suicide. Nobody\'s watching.'], ev: [[700, 'qte', { kind: 'timed', label: 'PUSH', id: 'push', time: 7000 }], [720, 'act', 'you', null]] },
      { d: 3000, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 0, 1.1], [1, 0, -4, 1.18]], cast: [{ id: 'you', kind: 'bust', x: -.42, expr: 'determined', rim: '#fde68a' }],
        say: (ctx, q) => q.push ? ['you', 'Again.'] : ['you', 'Again. Tomorrow, again.'], ev: [[200, 'stats', rows, 'JV · six weeks']] },
    ] };
    return '_jv';
  }
  /* the call-up: the coach in the doorway */
  function callup() {
    CUTSCENES._callup = { name: 'Varsity. Friday.', chapter: 'Chapter 2', shots: [
      { d: 2600, scene: 'gym', empty: true, grade: 'gold', music: null, tr: 'fade', cam: [[0, -20, 20, 1.3], [1, 0, 16, 1.4]], cast: [{ id: 'you', kind: 'actor', x: -.1, y: 72, s: 2.8, ball: true }],
        say: ['narrator', 'JV practice. The gym door opens.'], ev: [[1400, 'sfx', 'thud', .5]] },
      { d: 2800, scene: 'gym', empty: true, grade: 'spot', cam: [[0, 20, -4, 1.2], [1, 24, -8, 1.35, 'io']], cast: [{ id: coach(), kind: 'bust', x: .3, expr: 'neutral', rim: '#fde68a' }, { id: 'you', kind: 'bust', x: -.66, y: 136, sil: true, rim: '#fdba74', d: 1.2 }],
        say: [coach(), 'Varsity. Friday.'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 2400, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 8, 1.3], [1, 0, 14, 1.5, 'snap']], speed: 'radial', music: 'clutch', cast: [{ id: 'you', kind: 'face', x: 0, expr: 'smile', rim: '#facc15' }],
        ev: [[0, 'flash', '#ffffff', .6], [0, 'sfx', 'stinger'], [0, 'shake', 6]] },
    ] };
    return '_callup';
  }
  /* Kai's POV: Silk takes the film apart, frame by frame */
  function kaiFilm() {
    const K = typeof UI !== 'undefined' && UI.charLook ? UI.charLook('kai') : null, kaiS = (x, y) => SP('kai', x, y, 1, K);
    const screen = (from, at) => ({ r: [.08, .1, .84, .62], at, from, tone: false, shot: { court: 'gym_' + (hs() === 'westbrook' ? 'westbrook' : 'lincoln'), grade: 'mono', cam: [[0, 16, 30, 2.0], [1, 16, 30, 2.0]], slow: .25, cast: [SP('you', 232, 150), kaiS(206, 128)],
      play(S2, t) { const p = S2.sp.you, k = S2.sp.kai; S2.ball.holder = p; p.face = -1; k.face = 1; k.stance = true; if (t > .2 && t < .6) p.act = { type: 'move', id: 'cross', t: t - .2, T: .4, f0: -1, f1: 1 }; else p.act = null; if (t > .5) { k.stance = false; k.act = { type: 'stumble', t: t - .5, T: 2 }; } } } });
    CUTSCENES._kaifilm = { name: 'Film', chapter: 'Chapter 2 · Kai', shots: [
      { d: 2200, scene: 'void', music: 'kai', tr: 'fade', title: { text: 'Sterling house · film room · 11:52 p.m.', style: 'line', at: 300 } },
      { d: 3600, scene: 'void', manga: { bg: '#05070d', panels: [screen('top', 0)] }, say: ['silk', 'Pause. Look at your feet.'], ev: [[1400, 'sfx', 'tick'], [2600, 'sfx', 'tick']] },
      { d: 3000, scene: 'void', grade: 'dark', cam: [[0, 10, -4, 1.2], [1, 14, -8, 1.3]], cast: [{ id: 'silk', kind: 'bust', x: .25, expr: 'neutral', rim: '#f8fafc' }], say: ['silk', 'Again.'], ev: [[1200, 'sfx', 'tick']] },
      { d: 3400, scene: 'void', manga: { bg: '#05070d', panels: [screen('left', 0)] }, say: ['silk', 'A nobody from Halsey Street. Again.'], ev: [[900, 'flash', '#ffffff', .15], [2100, 'flash', '#ffffff', .15]] },
      { d: 2800, scene: 'void', grade: 'blue', bars: 40, cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }], say: ['narrator', 'Kai doesn\'t look away from the screen.'] },
    ] };
    return '_kaifilm';
  }
  /* HALSEY PARK II (the fixed high): down late, your weapon on Kai, the comeback, the students on the floor */
  function hp2Shots(o) {
    const s = S(), K = typeof UI !== 'undefined' && UI.charLook ? UI.charLook('kai') : null, kaiS = (x, y) => SP('kai', x, y, 1, K), w = Engine.weapons(s)[0], wName = (w && w.w.name) || 'Your weapon';
    const [u, t] = o.score, base = Math.max(u, t), down = [base - 6, base + 3], fin = [base + 6, base + 4];
    o.fin = fin;
    return [
      { d: 3000, court: '@venue', score: true, music: 'build', tr: 'fade', cam: [[0, 16, 34, 2.0], [1, 10, 10, 2.2]], cast: [kaiS(200, 150), SP('you', 230, 120)],
        say: ['narrator', 'Fourth quarter. Kai has hit six straight.'], ev: [[300, 'bug', `${down[0]}-${down[1]}`], [300, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you; p.face = -1; p.stance = true; CSK.jumper(S2, S2.sp.kai, tm, .3, { made: true, flight: 1.1 }); } },
      { d: 2800, scene: 'arena', grade: 'spot', cam: [[0, 0, -4, 1.2], [1, 0, -8, 1.3]], cast: [{ id: 'silk', kind: 'bust', x: .35, expr: 'neutral', rim: '#facc15' }],
        say: ['narrator', 'In the front row, Silk Sterling hasn\'t moved in an hour.'] },
      { d: 2600, scene: 'void', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.5]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }],
        title: { text: wName.toUpperCase(), sub: 'On Kai Sterling', style: 'slam', at: 900 }, ev: [[300, 'glint', 'you'], [700, 'aura', 'you'], [700, 'sfx', 'sig'], [900, 'impact', 140]] },
      { d: 3600, court: '@venue', score: true, cam: [[0, 26, 42, 2.4], [1, 14, 30, 2.75, 'io']], slow: [[900, 2400, .3]], cast: [SP('you', 232, 158), kaiS(206, 140)],
        ev: [[1150, 'sfx', 'ooh'], [1300, 'impact', 120], [1300, 'shake', 6], [1900, 'bug', `${down[0] + 2}-${down[1]}`]],
        play(S2, tm) { const p = S2.sp.you, k = S2.sp.kai; S2.ball.holder = p; p.face = -1; k.face = 1; k.stance = tm < .9;
          if (tm > .8 && tm < 1.15) p.act = { type: 'move', id: 'cross', t: tm - .8, T: .35, f0: -1, f1: 1 }; else p.act = null;
          if (tm > 1.1) { k.stance = false; k.act = { type: tm < 1.5 ? 'stumble' : 'sit', t: tm < 1.5 ? tm - 1.1 : tm - 1.5 + .3, T: 9 }; CSK.run(p, tm, 1.2, 2.2, 232, 158, 196, 128); } } },
      { d: 4600, score: true, music: 'clutch', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'arena', cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }], cam: [[0, 0, 22, 1.5], [1, 0, 22, 1.6]] }, sfx: ['STEAL!', .72, .25, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', tone: true, shot: { court: '@venue', cast: [SP('m1', 250, 150)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.m1, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SPLASH', .3, .3, '#7dd3fc', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', shot: { scene: 'arena', cast: [{ id: 'kai', kind: 'bust', x: .35, expr: 'shocked', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.45, expr: 'fierce', rim: '#fde68a' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: ['AND ONE!', .72, .35, '#facc15', 5], snd: 'impact' },
      ] }, ev: [[400, 'bug', `${down[0] + 4}-${down[1]}`], [1300, 'bug', `${down[0] + 7}-${down[1]}`], [2300, 'bug', `${fin[0] - 2}-${fin[1]}`], [2300, 'cheer'], [2400, 'sfx', 'roar']] },
      { d: 3600, court: '@venue', score: true, scoreText: `${fin[0] - 2}-${fin[1]}`, clockText: '0:02', cam: [[0, 8, 24, 2.3], [1, 4, -8, 2.4, 'io']], slow: [[400, 3000, .4]], speed: 'radial', focus: [.5, .35], cast: [SP('you', 196, 128), kaiS(206, 116)],
        ev: [[0, 'riser', 3], [2300, 'bug', `${fin[0]}-${fin[1]}`], [2300, 'sfx', 'buzzer'], [2400, 'cheer'], [2400, 'impact', 160]],
        play(S2, tm) { const k = S2.sp.kai; k.face = 1; k.act = { type: 'block', t: .1 }; k.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .35) / .6)) * Math.PI) * 10); CSK.jumper(S2, S2.sp.you, tm, .2, { made: true, flight: 1.25, jump: 17 }); } },
      { d: 3600, court: '@venue', score: true, scoreText: `${fin[0]}-${fin[1]}`, grade: 'gold', music: 'victory', cam: [[0, 0, 20, 1.6], [1, 0, 14, 1.4]], fgCrowd: [s.career.hs === 'westbrook' ? '#f8fafc' : '#b91c1c', '#fbbf24', '#111827'], fgHop: true,
        cast: [SP('you', 192, 140), SP('m1', 150, 160), SP('m2', 236, 164), kaiS(260, 110)], title: { text: 'HALSEY PARK II', sub: 'Kai Sterling\'s first loss to {name}', style: 'slam', at: 500 },
        ev: [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', 160], [500, 'sfx', 'impact']],
        play(S2, tm) { CSK.cel(S2.sp.you, tm < 1.5 ? 'flex' : 'joy', tm); CSK.cel(S2.sp.m1, 'joy', tm); CSK.cel(S2.sp.m2, 'joy', tm + .3); S2.sp.kai.act = { type: 'hang', t: tm, T: 99 }; S2.ball.holder = null; S2.ball.z = 0; S2.ball.x = 180; S2.ball.y = 190; } },
      { d: 2800, scene: 'arena', grade: 'blue', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'kai', kind: 'face', x: .1, expr: 'sad', rim: '#93c5fd' }, { id: 'silk', kind: 'bust', x: -.7, y: 140, sil: true, rim: '#facc15', d: 1.2 }],
        say: ['narrator', 'Silk stands up and walks out before the handshake line.'] },
    ];
  }
  const scripts = {
    hp2: { moments: 2, at: 0, async run(o) { const shots = hp2Shots(o); CUTSCENES._hp2 = { name: 'Halsey Park II', chapter: 'Chapter 2', shots }; await Story.cut('_hp2', o.ctx, { seenId: 'hp2' }); return o.fin; } },
  };
  return { cutList, jvMontage, jvBonus: () => ({ id: 'push', ok: { attrs: { stam: 1 } }, okToast: '💪 Pushed through: +1 Stamina' }), callup, kaiFilm, scripts };
})();
if (typeof JAM_SCRIPTS !== 'undefined') Object.assign(JAM_SCRIPTS, CH2.scripts);

window.EXTRA_CUTSCENES = Object.assign(window.EXTRA_CUTSCENES || {}, {
  /* ---- Mom's money low ---- */
  mom_money: { name: 'Rent', chapter: 'Chapter 2', shots: [
    { d: 3200, scene: 'hospital', grade: 'blue', drain: .4, music: 'sad', tr: 'fade', cam: [[0, -20, 6, 1.15], [1, 0, 2, 1.22]], cast: [{ id: 'mom', kind: 'bust', x: 0, y: 128, expr: 'sad', rim: '#93c5fd' }],
      say: ['narrator', 'Mom hurt her back lifting a patient. Six weeks off, minimum.'] },
    { d: 3000, scene: 'hospital', grade: 'night', dim: .4, drain: .4, cam: [[0, 0, 0, 1.15], [1, 0, -4, 1.24]], cast: [{ id: 'nia', kind: 'bust', x: .1, expr: 'sad', rim: '#c4b5fd' }],
      say: ['nia', '(quietly) Rent is due Friday. We have $212.'] },
    { d: 3200, scene: 'street_night', grade: 'night', cam: [[0, 10, -4, 1.18], [1, 18, -8, 1.28, 'io']], cast: [{ id: 'vince', kind: 'bust', x: .3, expr: 'smile', rim: '#a855f7' }, { id: 'you', kind: 'bust', x: -.66, y: 136, sil: true, rim: '#a855f7', d: 1.2 }],
      say: ['vince', 'Heard about your mom. I can make Friday go away.'] },
  ] },
  /* ---- foreshadowing: Lou's cough is worse, he leaves practice early (minor) ---- */
  lou_cough2: { name: 'Early', chapter: 'Chapter 2', minor: true, shots: [
    { d: 3400, scene: 'gym', empty: true, grade: 'night', music: 'lou', tr: 'fade', cam: [[0, 0, 20, 1.2], [1, 10, 16, 1.3]],
      cast: [{ id: 'lou', kind: 'actor', x: .2, y: 70, s: 2.6, face: 1, path: [[1600, .2], [3400, 1.2]], acts: [[0, 'slump', 99], [1500, null]] }],
      say: ['narrator', 'Lou coughs until he has to sit down. Then he leaves practice early.'], ev: [[300, 'sfx', 'cough'], [900, 'sfx', 'cough']] },
    { d: 2400, scene: 'gym', empty: true, grade: 'night', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'neutral', rim: '#93c5fd' }],
      say: ['narrator', 'Lou never leaves early.'] },
  ] },
  /* ---- Lou steps away: the phone call, the hospital ---- */
  lou_hospital: { name: 'Play for You', chapter: 'Chapter 2', shots: [
    { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'A phone call, 11:14 p.m.', style: 'line', at: 300 }, ev: [[200, 'sfx', 'beep'], [700, 'sfx', 'beep'], [1200, 'sfx', 'beep']] },
    { d: 3600, scene: 'hospital', grade: 'blue', drain: .5, music: 'sad', cam: [[0, -20, 8, 1.15], [1, 0, 4, 1.24, 'lin']], cast: [{ id: 'lou', kind: 'bust', x: .05, y: 128, expr: 'sad', rim: '#93c5fd' }],
      say: ['lou', 'They say it\'s my lungs. Forty years of gym dust and stubbornness.'] },
    { d: 3400, scene: 'hospital', grade: 'blue', drain: .5, cam: [[0, 0, 30, 1.0], [1, 0, 32, 1.05]], cast: [{ id: 'lou', kind: 'hand', x: .2, y: 142, s: 3.2, flip: true, curl: .3 }, { id: 'you', kind: 'hand', x: -.2, y: 148, s: 3.2, curlTo: [[0, 0], [1800, .5]] }],
      say: ['lou', 'Don\'t you dare play for me. Play for you.'] },
    { d: 2600, scene: 'hospital', grade: 'blue', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'crying', rim: '#93c5fd' }], ev: [[0, 'sfx', 'piano']] },
  ] },
  /* ---- the ankle (fixed setback): practice, a sickening roll, the sound before the pain ---- */
  ankle: { name: 'The Sound', chapter: 'Chapter 2', shots: [
    { d: 3000, scene: 'gym', empty: true, grade: 'gold', music: 'game', tr: 'fade', cam: [[0, -30, 20, 1.2], [1, 10, 16, 1.3, 'lin']],
      cast: [{ id: 'mate1', kind: 'actor', x: .3, y: 66, s: 2.6, face: -1, acts: [[0, 'block', 99]] }, { id: 'you', kind: 'actor', y: 72, s: 2.8, ball: true, path: [[0, -1], [2400, .1]] }],
      say: ctx => ['narrator', ctx.late ? 'March. An empty gym, a spring workout, nobody watching.' : 'Tuesday practice. The week before the state tournament.'] },
    { d: 3200, scene: 'gym', empty: true, grade: 'gold', slow: [[0, 2600, .35]], music: null, cam: [[0, 10, 20, 1.6], [1, 10, 26, 1.8, 'io']],
      cast: [{ id: 'mate1', kind: 'actor', x: .18, y: 70, s: 3, face: -1, acts: [[0, 'block', 99]], zs: [[0, 0], [500, 8], [900, 0]] }, { id: 'you', kind: 'actor', x: .05, y: 72, s: 3, acts: [[0, 'layup', 1.2], [1500, 'down', 99]], zs: [[0, 0], [600, 14], [1400, 4], [1500, 0]] }],
      ev: [[1500, 'sfx', 'crack'], [1500, 'impact', 200, ['#000000', '#ef4444']], [1500, 'shake', 10], [1550, 'drain', 1, 300], [1600, 'sfx', 'ring']] },
    { d: 2400, scene: 'void', music: null, title: { text: 'You hear it before you feel it.', style: 'line', at: 200 } },
    { d: 3400, scene: 'hospital', grade: 'blue', drain: .6, music: 'sad', cam: [[0, 0, 8, 1.2], [1, 0, 12, 1.3]], cast: [{ id: 'you', kind: 'bust', x: -.1, y: 128, expr: 'sad', rim: '#93c5fd' }],
      say: ctx => ['narrator', ctx.late ? 'High ankle sprain. Every scout who calls asks about it.' : 'High ankle sprain. Out a week, doubtful for the tournament.'] },
  ] },
  /* ---- the fight back: ice baths, bands, stairs, PUSH ---- */
  rehab: { name: 'The Fight Back', chapter: 'Chapter 2', shots: [
    { d: 4200, music: 'lou', manga: { panels: [
      { r: [0, 0, .5, .55], at: 0, from: 'left', tone: true, shot: { scene: 'hospital', grade: 'blue', cast: [{ id: 'you', kind: 'bust', x: 0, y: 128, expr: 'fierce', rim: '#7dd3fc', sweat: true }] }, sfx: ['BRRR', .72, .3, '#7dd3fc', 4] },
      { r: [.5, 0, .5, .55], at: 800, from: 'right', shot: { scene: 'gym', empty: true, cam: [[0, 0, 26, 1.3], [1, 0, 26, 1.3]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 3, acts: [[0, 'kneel', 99]] }] }, sfx: ['STRETCH', .3, .3, '#f8fafc', 3] },
      { r: [0, .55, 1, .45], at: 1600, from: 'bottom', lines: true, shot: { scene: 'street_night', dim: .5, cam: [[0, 0, 20, 1.2], [1, 0, 20, 1.2]], cast: [{ id: 'you', kind: 'actor', y: 72, s: 2.8, path: [[0, -1.1], [2400, 1.1]] }] }, sfx: ['STAIRS', .72, .35, '#facc15', 4] },
    ] } },
    { d: 3400, scene: 'gym', empty: true, grade: 'gold', rot: .06, cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 3, acts: [[0, 'kneel', 99, { down: true }]] }],
      say: ['narrator', 'One more rep on one good leg.'], ev: [[700, 'qte', { kind: 'timed', label: 'PUSH', id: 'push', time: 7000 }], [720, 'act', 'you', null]] },
    { d: 2600, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }],
      say: (ctx, q) => q.push ? ['you', 'It holds. It actually holds.'] : ['you', 'Not yet. But close.'] },
  ] },
  /* ---- the state final, halftime: Lou's voice (a faded flashback to Halsey Park) ---- */
  lou_voice: { name: 'Halftime', chapter: 'Chapter 2', shots: [
    { d: 2800, scene: 'locker', grade: 'dark', music: null, tr: 'fade', cam: [[0, 0, 10, 1.25], [1, 0, 14, 1.35]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 3, acts: [[0, 'bench', 99, { down: true }]] }, { id: 'bench', kind: 'bench', x: 0, y: 74, s: 3, d: 1 }],
      say: ['narrator', 'Halftime. You can\'t feel your ankle anymore.'] },
    { d: 3200, scene: 'street_sunset', sepia: true, cam: [[0, 10, -4, 1.18], [1, 14, -8, 1.26]], cast: [{ id: 'lou', kind: 'bust', x: .2, expr: 'smile', rim: '#fde68a' }],
      say: ['lou', 'The rim, kid. Not the man.'] },
    { d: 2400, scene: 'locker', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.45]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#facc15' }], music: 'clutch',
      ev: [[500, 'glint', 'you'], [500, 'sfx', 'stinger']] },
  ] },
  /* ---- state champions: the trophy goes to Lou's hospital room ---- */
  trophy_lou: { name: 'For You', chapter: 'Chapter 2', shots: [
    { d: 3400, scene: 'hospital', grade: 'gold', music: 'victory', tr: 'fade', cam: [[0, -10, 6, 1.15], [1, 0, 2, 1.22]],
      cast: [{ id: 'lou', kind: 'bust', x: .35, y: 128, expr: 'smile', rim: '#fde68a' }, { id: 'you', kind: 'bust', x: -.4, expr: 'smile', rim: '#fde68a' }, { id: 'cup', kind: 'trophy', x: -.02, y: 70, s: 2.6 }],
      say: ['narrator', 'You carry the trophy straight to Lou\'s hospital room. Still in your jersey.'], ev: [[0, 'confetti', 60]] },
    { d: 3000, scene: 'hospital', grade: 'gold', cam: [[0, 20, 0, 1.2], [1, 24, -4, 1.28]], cast: [{ id: 'lou', kind: 'bust', x: .2, y: 128, expr: 'smile', rim: '#fde68a' }, { id: 'cup', kind: 'trophy', x: -.3, y: 70, s: 2.6 }], say: ['lou', 'Told you. Play for you.'] },
  ] },
  /* ---- post-credits: Coach Reyes and a letter ---- */
  pc_reyes: { name: 'The Letter', chapter: 'Chapter 2 · after the credits', shots: [
    { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'USA Basketball · Colorado Springs · 1:14 a.m.', style: 'line', at: 300 } },
    { d: 3400, scene: 'locker', grade: 'night', dim: .5, cam: [[0, 10, -4, 1.15], [1, 14, -8, 1.24]], cast: [{ id: 'reyes', kind: 'bust', x: .25, expr: 'neutral', rim: '#93c5fd' }],
      say: ['reyes', '(signing a letter) National team. Get him in.'], ev: [[1400, 'sfx', 'write']] },
    { d: 2400, scene: 'title', cam: [[0, 0, 0, 1.2], [1, 0, 0, 1.05, 'snap']], speed: 'radial', title: { text: 'RED, WHITE & HOOPS', sub: 'Interlude', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'flash', '#ffffff', .7]] },
  ] },
});
