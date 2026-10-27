/* =====================================================================
   DATA-STORY-CH3-SCENES.JS — Chapter 3's cinematic scenes (STORY.md, Chapter 3: The Next Level), its new people and
   the three fixed-high scripts (knocking off #1 in March, the derby, the first NBL win). Story nodes:
   js/data-story-ch3.js (decision, college, every road), -overseas.js, -dev.js (Grind League). Arcs: js/data-arcs.js.
   Major scenes are unskippable the first time (js/story-fx.js); minor: true can always be skipped.
   ===================================================================== */
Object.assign(STORY.characters, {
  vance: { name: 'Coach Rick Vance', short: 'Coach Vance', role: 'The new head coach · brought his own guys', color: '#94a3b8',
           look: { skin: '#f1d0b5', hair: 'flattop', hairColor: '#1c1917', beard: 'none', outfit: 'suit', jersey: '#111827', trim: '#94a3b8' } },
  gm:    { name: 'An NBL general manager', short: 'GM', role: 'Lottery night · second row', color: '#e2e8f0',
           look: { skin: '#d9a77e', hair: 'buzz', hairColor: '#9ca3af', outfit: 'suit', jersey: '#0f172a', trim: '#e2e8f0' } },
});

/* the setback rivals: the school your fired coach lands at, the rich club that lowballed you, the Grind team you sign with after the waiver */
C3.oldCoachTo = s => { const conf = C3.confTeams(s); return conf.find(id => id !== s.career.college && ['westwood', 'prairie', 'magnolia', 'motorcity', 'gulfcoast', 'desert'].includes(id)) || conf[3]; };
C3.richFor = s => { const me = s.career.club, pac = ['tokyo', 'sydney', 'beijing'].includes(me); return pac ? (me === 'beijing' ? 'tokyo' : 'beijing') : me === 'madrid' ? 'paris' : 'madrid'; };
C3.number1 = s => { const me = s.career.college; return ['blueridge', 'commonwealth', 'tobacco'].find(id => id !== me); };
/* how your season went before the low: "played well" = 18+ a game and a winning record in this chapter's games */
C3.playedWell = s => { const from = (s.arcs && s.arcs.gamesAt && s.arcs.gamesAt.college) || 0, G = (s.career.games || []).slice(from).filter(g => !/Pickup|Tutorial/i.test(g.label || ''));
  if (G.length < 2) return (s.meta.trust || 0) >= 55; const ppg = G.reduce((t, g) => t + (g.pts || 0), 0) / G.length, w = G.filter(g => g.win).length; return ppg >= 18 || (ppg >= 14 && w * 2 >= G.length); };

STORY.tests = Object.assign(STORY.tests || {}, { c3_well: s => C3.playedWell(s) });
STORY.refs = Object.assign(STORY.refs || {}, { '@no1': s => C3.number1(s), '@rich': s => C3.richFor(s), '@derby': s => C3.euroLeague(s)[1], '@oldcoach': s => C3.oldCoachTo(s) });
/* practice teams: the college scout team vs the new coach's starters, the loan club, the Warehouse run */
Object.assign(LOCAL_TEAMS, {
  c3_scout:    { name: 'Scout Team', abbr: 'SCT', colors: ['#64748b', '#f8fafc', '#111827'], logo: { shape: 'circle', icon: 'ball' }, rating: 58, roster: ['Danny Okoye', 'Walk-On Wes', 'Grad Transfer Gus', 'Redshirt Rory'] },
  c3_first:    { name: 'First Unit', abbr: '1ST', colors: ['#111827', '#94a3b8', '#f8fafc'], logo: { shape: 'shield', icon: 'stars' }, rating: 64, roster: ['Transfer Tre Banks', 'Vance\'s Guy Mike', 'Senior Sam Pruitt', 'Big Chuck Odom'], star: { name: 'Transfer Tre Banks', perD: 60, intD: 58 } },
  warehouse_crew: { name: 'Warehouse Pros', abbr: 'WHS', colors: ['#78350f', '#f8fafc', '#111827'], logo: { shape: 'circle', icon: 'ball' }, rating: 63, roster: ['Overseas Ollie', 'Ex-NBL Rashid', 'Two-Way Terry'], star: { name: 'Ex-NBL Rashid', perD: 60, intD: 56 } },
  warehouse_you: { name: 'Couch Crew', abbr: 'YOU', colors: ['#f97316', '#111827', '#f8fafc'], logo: { shape: 'circle', icon: 'flame' }, rating: 58, roster: ['Isaiah "Big Ike" Grant', 'Pooh Jeter Jr.'] },
});

const CH3 = (() => {
  const S = () => Game.state, SP = (id, x, y, team, look) => Object.assign({ id, kind: 'sprite', x, y }, team ? { team } : {}, look ? { look } : {});
  const kaiCoach = s => s.flags.kai_ignition ? 'gcoach' : 'kowalski';

  /* ---------- the setback: three different floors ---------- */
  const scenes = {
    /* college: the coach fired live on the lounge TV, then the new man who didn't recruit you */
    c3_fired: { name: 'Breaking News', chapter: 'Chapter 3', shots: [
      { d: 3000, scene: 'locker', grade: 'blue', music: null, tr: 'fade', cam: [[0, -10, 0, 1.1], [1, 0, 2, 1.2]],
        cast: [{ id: 'rook', kind: 'bust', x: .38, expr: 'shocked', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.38, expr: 'shocked', rim: '#93c5fd' }],
        say: ['narrator', 'The players\' lounge, 9 p.m. Somebody turns the TV up.'], ev: [[300, 'flicker', 600], [1400, 'flicker', 500]] },
      { d: 2600, scene: 'title', grade: 'red', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], title: { text: 'BREAKING', sub: 'Head coach fired amid a booster investigation', style: 'slam', at: 150 },
        ev: [[150, 'sfx', 'sting'], [150, 'flash', '#ffffff', .6], [150, 'shake', 6]] },
      { d: 3000, scene: 'locker', grade: 'dark', drain: .5, cam: [[0, 0, 8, 1.2], [1, 0, 12, 1.32]], cast: [{ id: 'ccoach', kind: 'bust', x: 0, expr: 'sad', rim: '#94a3b8' }],
        say: ['narrator', 'He doesn\'t call or say goodbye. His office is empty by morning.'], ev: [[0, 'sfx', 'piano']] },
      { d: 3200, scene: 'locker', grade: 'dark', rot: .07, cam: [[0, 10, -4, 1.2], [1, 14, -8, 1.32]], cast: [{ id: 'vance', kind: 'bust', x: .3, expr: 'neutral', rim: '#94a3b8' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#93c5fd', d: 1.2 }],
        say: ['vance', 'I didn\'t recruit you. My guys start.'], ev: [[1600, 'sfx', 'thud', .7]] },
    ] },
    /* overseas: the club stops paying. A cold apartment, Mom on a video call */
    c3_unpaid: { name: 'Unpaid', chapter: 'Chapter 3', shots: [
      { d: 3000, scene: 'locker', grade: 'dark', music: null, tr: 'fade', cam: [[0, 0, 0, 1.1], [1, 0, 4, 1.2]], cast: [{ id: 'marko', kind: 'bust', x: .3, expr: 'sad', rim: '#a78bfa' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#93c5fd', d: 1.2 }],
        say: ['marko', 'No money this month, not for anyone. The owner stopped answering.'] },
      { d: 3400, scene: 'street_night', grade: 'blue', drain: .6, weather: 'rain', cam: [[0, 0, 10, 1.2], [1, 0, 14, 1.3]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 70, s: 3, acts: [[0, 'slump', 99]] }],
        say: ['narrator', 'The heat in your apartment goes off in November. You sleep in your warmup jacket.'], ev: [[0, 'sfx', 'rumble', .5]] },
      { d: 3600, scene: 'void', grade: 'blue', cam: [[0, 0, 6, 1.2], [1, 0, 8, 1.3]], cast: [{ id: 'mom', kind: 'bust', x: .3, y: 128, expr: 'sad', rim: '#93c5fd' }, { id: 'ph', kind: 'phone', x: -.35, y: 168, s: 3.4 }],
        say: ['mom', '(on video) You eating, baby? Don\'t lie to me.'], ev: [[0, 'sfx', 'ring'], [400, 'sfx', 'piano']] },
      { d: 2400, scene: 'void', music: null, title: { text: 'Fourteen thousand miles from home. Forty dollars left.', style: 'line', at: 200 } },
    ] },
    /* the Grind League: the call-up you earned goes to Dez, then the roster crunch and the waiver */
    c3_waived: { name: 'Waived', chapter: 'Chapter 3', shots: [
      { d: 3000, scene: 'locker', grade: 'gold', music: null, tr: 'fade', cam: [[0, 0, 0, 1.1], [1, 10, 0, 1.2]], cast: [{ id: 'dez', kind: 'bust', x: .3, expr: 'smile', rim: '#fbbf24' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
        say: ['narrator', 'The locker room phone rings. It\'s the NBL, and it\'s for Dez.'], ev: [[200, 'sfx', 'ring']] },
      { d: 3000, scene: 'locker', grade: 'dark', drain: .7, rot: -.08, cam: [[0, 0, 8, 1.25], [1, 0, 12, 1.36]], cast: [{ id: 'gcoach', kind: 'bust', x: .25, expr: 'neutral', rim: '#94a3b8' }],
        say: ['gcoach', 'Roster crunch, we need the spot. You\'re waived, effective today.'], ev: [[1400, 'sfx', 'thud', .8]] },
      { d: 3000, scene: 'locker', grade: 'dark', drain: .9, empty: true, cam: [[0, 0, 16, 1.4], [1, 0, 20, 1.55]], cast: [{ id: 'you', kind: 'hand', x: 0, y: 150, s: 3.2, curl: .5, shake: .3 }],
        say: ['narrator', 'They peel your nameplate off the locker before you\'ve packed.'], ev: [[300, 'sfx', 'tape']] },
      { d: 2600, scene: 'street_night', grade: 'night', drain: .6, cam: [[0, 0, 0, 1.1], [1, 10, -2, 1.18]], cast: [{ id: 'you', kind: 'actor', x: -.2, y: 70, s: 2.8, path: [[0, -.6], [2400, .4]] }],
        say: ['narrator', 'Big Ike\'s couch. Your whole career fits in one duffel bag.'] },
    ] },
    /* Weapon Training: Scoop finds you after the low (one scene, three places) */
    c3_scoop: { name: 'Scoop', chapter: 'Chapter 3', shots: [
      { d: 3000, scene: 'gym', grade: 'spot', empty: true, dim: .5, music: 'lou', tr: 'fade', cam: [[0, -20, 20, 1.15], [1, 10, 16, 1.25]],
        cast: [{ id: 'you', kind: 'actor', x: -.1, y: 70, s: 2.8, ball: true, acts: [[0, 'shoot', 1.2], [1400, 'slump', 99]] }],
        say: ['narrator', 'Midnight. The only light in the building is over your basket.'], ev: [[900, 'sfx', 'rim'], [1600, 'sfx', 'bounce', .6]] },
      { d: 3000, scene: 'gym', grade: 'spot', empty: true, dim: .4, cam: [[0, 0, 20, 1.15], [1, -10, 18, 1.22]],
        cast: [{ id: 'sal', kind: 'actor', x: .9, y: 70, s: 2.8, path: [[0, .9], [2200, .25]] }, { id: 'you', kind: 'actor', x: -.1, y: 70, s: 2.8, acts: [[0, 'slump', 99], [1800, 'lookup', 99]] }],
        say: ['narrator', 'A side door opens. A short man in a tracksuit walks in like he owns the place.'], ev: [[100, 'sfx', 'thud', .4]] },
      { d: 3000, scene: 'gym', grade: 'spot', cam: [[0, 10, -4, 1.2], [1, 14, -8, 1.3]], cast: [{ id: 'sal', kind: 'bust', x: .3, expr: 'smile', rim: '#f59e0b' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
        say: ['sal', 'They took your two moves away. So we build you new ones.'] },
      { d: 2200, scene: 'title', music: 'build', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], title: { text: 'WEAPON TRAINING', sub: 'Six a.m. Every day.', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'shake', 5]] },
    ] },
    /* the climb back's goal on screen: a montage of the work (PUSH on the last rep) */
    c3_climb: { name: 'The Climb', chapter: 'Chapter 3', shots: [
      { d: 4200, music: 'build', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', tone: true, shot: { scene: 'gym', empty: true, cam: [[0, 0, 26, 1.3], [1, 0, 26, 1.3]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 74, s: 3, path: [[0, -.8], [900, .8], [1800, -.8], [2700, .8]] }] }, sfx: ['SQUEAK', .72, .3, '#f8fafc', 4] },
        { r: [.5, 0, .5, .55], at: 800, from: 'right', shot: { scene: 'gym', empty: true, cam: [[0, 0, 26, 1.3], [1, 0, 26, 1.3]], cast: [{ id: 'sal', kind: 'actor', x: .3, y: 74, s: 3, acts: [[0, 'point', 99]] }, { id: 'you', kind: 'actor', x: -.2, y: 74, s: 3, ball: true }] }, sfx: ['AGAIN!', .3, .3, '#f59e0b', 4] },
        { r: [0, .55, 1, .45], at: 1600, from: 'bottom', lines: true, shot: { scene: 'street_night', dim: .4, cam: [[0, 0, 20, 1.2], [1, 0, 20, 1.2]], cast: [{ id: 'you', kind: 'actor', y: 72, s: 2.8, path: [[0, -1.1], [2400, 1.1]] }] }, sfx: ['5:58 A.M.', .72, .35, '#facc15', 4] },
      ] } },
      { d: 3400, scene: 'gym', empty: true, grade: 'gold', rot: .06, cam: [[0, 0, 20, 1.35], [1, 0, 16, 1.45]], cast: [{ id: 'you', kind: 'actor', x: 0, y: 72, s: 3, acts: [[0, 'kneel', 99, { down: true }]] }],
        say: ['narrator', 'Last rep. Sal hasn\'t let you skip one yet.'], ev: [[700, 'qte', { kind: 'timed', label: 'PUSH', id: 'push', time: 7000 }], [720, 'act', 'you', null]] },
      { d: 2400, scene: 'gym', empty: true, grade: 'gold', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#fde68a' }],
        say: (ctx, q) => q.push ? ['sal', 'THERE it is. Now we go get your spot back.'] : ['sal', 'Again tomorrow. Six a.m.'] },
    ] },
    /* ---------- Kai's POV: benched by his own coach for the first time, Silk in the stands ---------- */
    c3_kai_benched: s => ({ name: 'First Time', chapter: 'Chapter 3', shots: [
      { d: 2400, scene: 'void', music: null, tr: 'fade', title: { text: s.flags.kai_ignition ? 'Ignition · second half' : 'Blue Ridge · second half', style: 'line', at: 300 } },
      { d: 3400, scene: 'arena', grade: 'blue', music: 'kai', cam: [[0, -20, 6, 1.15], [1, 0, 2, 1.25]],
        cast: [{ id: 'bench', kind: 'bench', x: -.1, y: 70, s: 2.8, d: 1 }, { id: 'kai', kind: 'actor', x: -.1, y: 70, s: 2.8, acts: [[0, 'bench', 99]] }, { id: kaiCoach(s), kind: 'actor', x: .5, y: 72, s: 2.8, face: -1, acts: [[0, 'argue', 99]] }],
        say: [kaiCoach(s), 'Sit down. You don\'t play when you don\'t pass.'], ev: [[300, 'sfx', 'whistle']] },
      { d: 3000, scene: 'arena', grade: 'dark', cam: [[0, 0, -6, 1.2], [1, 0, -10, 1.3]], cast: [{ id: 'silk', kind: 'bust', x: .2, expr: 'neutral', rim: '#facc15' }],
        say: ['narrator', 'Silk Sterling, row two, doesn\'t clap or frown. He stands up and leaves.'], ev: [[1800, 'sfx', 'thud', .4]] },
      { d: 3000, scene: 'arena', grade: 'dark', drain: .5, cam: [[0, 0, 8, 1.32], [1, 0, 12, 1.44]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd' }],
        say: ['narrator', 'First time in his life Kai Sterling sits for a whole half.'], ev: [[1200, 'glint', 'kai']] },
      { d: 2400, scene: 'void', grade: 'dark', title: { text: 'He watches your highlights on the bus home.', style: 'line', at: 300 } },
    ] }),
    /* ---------- Tariq: the falling out in the rain on Halsey Street ---------- */
    c3_tariq_rain: { name: 'Halsey Street', chapter: 'Chapter 3', shots: [
      { d: 3000, scene: 'rain_night', weather: 'rain', grade: 'night', music: null, tr: 'fade', cam: [[0, -20, 6, 1.1], [1, 0, 2, 1.2]],
        cast: [{ id: 'tariq', kind: 'actor', x: .3, y: 70, s: 2.8, face: -1 }, { id: 'you', kind: 'actor', x: -.9, y: 70, s: 2.8, path: [[0, -.9], [1800, -.25]] }],
        say: ['narrator', 'Halsey Street, after midnight. Tariq is waiting under the broken streetlight.'], ev: [[0, 'sfx', 'rumble', .6], [1600, 'flicker', 600]] },
      { d: 3400, scene: 'rain_night', weather: 'rain', grade: 'night', cam: [[0, 0, 10, 1.3], [1, 0, 12, 1.42]],
        cast: [{ id: 'tariq', kind: 'actor', x: .22, y: 70, s: 3, face: -1, acts: [[0, 'argue', 99]], path: [[0, .28], [900, .14]] }, { id: 'you', kind: 'actor', x: -.25, y: 70, s: 3, acts: [[0, 'lookup', 99]] }],
        say: ['tariq', 'You on TV every week, and you can\'t answer one text?'], ev: [[900, 'sfx', 'thud', .5]] },
      { d: 3200, scene: 'rain_night', weather: 'rain', grade: 'night', rot: -.1, cam: [[0, 0, 10, 1.32], [1, 0, 12, 1.42]],
        cast: [{ id: 'tariq', kind: 'actor', x: .14, y: 70, s: 3, face: -1, acts: [[0, 'slump', 99]] }, { id: 'you', kind: 'actor', x: -.25, y: 70, s: 3, acts: [[0, 'point', 99]], path: [[0, -.25], [700, -.1]] }],
        say: ['you', 'You think it\'s easy out there? I don\'t get a day off!'], ev: [[0, 'sfx', 'whoosh'], [700, 'sfx', 'impact', .6]] },
      { d: 3000, scene: 'void', grade: 'blue', bars: 58, cam: [[0, 0, 24, 2.1], [1, 0, 22, 2.4]], cast: [{ id: 'tariq', kind: 'face', x: 0, expr: 'angry', rim: '#93c5fd' }],
        say: ['tariq', 'I posted your mixtape before anybody knew you. Now I\'m "some guy from home."'], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 3400, scene: 'rain_night', weather: 'storm', grade: 'night', drain: .8, cam: [[0, 0, 4, 1.15], [1, 0, 0, 1.2]],
        cast: [{ id: 'tariq', kind: 'actor', x: .1, y: 70, s: 2.8, face: 1, path: [[0, .1], [3000, 1.2]] }, { id: 'you', kind: 'actor', x: -.25, y: 70, s: 2.8, acts: [[0, 'slump', 99]] }],
        say: ['narrator', 'He walks away. He doesn\'t look back.'], ev: [[300, 'sfx', 'rumble'], [1200, 'flicker', 400]] },
      { d: 2600, scene: 'void', music: null, title: { text: 'Some losses don\'t show up in the box score.', style: 'line', at: 200 }, ev: [[0, 'sfx', 'piano']] },
    ] },
    c3_tariq_hug: { name: 'Halsey Street, Again', chapter: 'Chapter 3', shots: [
      { d: 3200, scene: 'street_sunset', grade: 'sunset', music: 'lou', tr: 'fade', cam: [[0, -10, 6, 1.1], [1, 0, 2, 1.2]],
        cast: [{ id: 'tariq', kind: 'actor', x: .4, y: 70, s: 2.8, face: -1, ball: true }, { id: 'you', kind: 'actor', x: -1, y: 70, s: 2.8, path: [[0, -1], [2200, -.08]] }],
        say: ['narrator', 'Halsey Park at sunset. Same court, same broken net.'] },
      { d: 3200, scene: 'street_sunset', grade: 'sunset', cam: [[0, 0, 10, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'tariq', kind: 'actor', x: .1, y: 70, s: 3, face: -1, acts: [[0, 'hug', 99]] }, { id: 'you', kind: 'actor', x: -.1, y: 70, s: 3, acts: [[0, 'hug', 99]] }],
        say: ['tariq', 'Took you long enough. Check ball.'], ev: [[400, 'sfx', 'piano']] },
    ] },
    /* ---------- post-credits: the draft lottery ---------- */
    pc_lottery: { name: 'The Lottery', chapter: 'Chapter 3 · after the credits', shots: [
      { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'NBL Draft Lottery · Secaucus · 8:14 p.m.', style: 'line', at: 300 } },
      { d: 3200, scene: 'arena', grade: 'spot', cam: [[0, 0, 10, 1.25], [1, 0, 6, 1.35]],
        cast: [{ id: 'b1', kind: 'ball', x: -.3, y: 120, s: 2, phys: { z: 30, vx: 40, vz: 60, e: .7, f: .9, at: 0 } }, { id: 'b2', kind: 'ball', x: .1, y: 120, s: 2, phys: { z: 40, vx: -30, vz: 50, e: .7, f: .9, at: 200 } }, { id: 'b3', kind: 'ball', x: .35, y: 120, s: 2, phys: { z: 20, vx: -20, vz: 70, e: .7, f: .9, at: 400 } }],
        say: ['narrator', 'Fourteen ping-pong balls, fourteen teams. A room full of men pretending to be calm.'], ev: [[0, 'sfx', 'bounce', .6], [500, 'sfx', 'bounce', .5]] },
      { d: 3400, scene: 'arena', grade: 'dark', cam: [[0, 10, -4, 1.2], [1, 14, -8, 1.3]], cast: [{ id: 'gm', kind: 'bust', x: .3, expr: 'neutral', rim: '#e2e8f0' }],
        say: ['gm', '(on the phone) Projected top five. Kai\'s projected higher.'] },
      { d: 2800, scene: 'arena', grade: 'dark', cam: [[0, 0, -10, 1.32], [1, 0, -14, 1.44]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'smile', rim: '#93c5fd' }], ev: [[700, 'glint', 'kai'], [700, 'sfx', 'sting']] },
      { d: 2400, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1.05, 'snap']], speed: 'radial', title: { text: 'CHAPTER 4', sub: 'The Draft', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'flash', '#ffffff', .6]] },
    ] },
  };

  /* ---------- the fixed highs: scripted endings (cfg.script, like Halsey Park II) ---------- */
  function highShots(o, k) {
    const s = S(), [u, t] = o.score, base = Math.max(u, t), down = [base - 5, base + 2], fin = [base + 5 + (o.counters && o.counters.jellies ? 1 : 0), base + 3];
    o.fin = fin;
    const them = o.cfg && o.cfg.them, star = (them && them.star && them.star.name) || 'their star', starShort = star.replace(/^.*"(.+)".*$/, '$1').split(' ').slice(-1)[0];
    const T = { upset: { title: 'NO. 1 IS DOWN', sub: '{college} shocks the country', line: `Down five to the No. 1 team in the country. Twelve minutes left.`, crowd: 'The whole arena is wearing the other team\'s colors.' },
      derby: { title: 'DERBY WIN', sub: 'Fifteen thousand on their feet', line: 'Derby night. Down five, fifteen thousand people, flares in the upper deck.', crowd: 'Marko is screaming something you don\'t need translated.' },
      nbl: { title: 'FIRST NBL WIN', sub: 'Earned back after the waiver', line: 'Your NBL debut. Down five, fourth quarter, and coach just looked at you.', crowd: 'Somewhere a Grind League bus is watching this on a phone.' } }[k];
    const w = Engine.weapons(s)[0], wName = (w && w.w.name) || 'Your weapon';
    return [
      { d: 3000, court: '@venue', score: true, music: 'build', tr: 'fade', cam: [[0, 16, 34, 2.0], [1, 10, 10, 2.2]], cast: [SP('st', 200, 150, 1), SP('you', 230, 120)],
        say: ['narrator', T.line], ev: [[300, 'bug', `${down[0]}-${down[1]}`], [300, 'sfx', 'roar']],
        play(S2, tm) { const p = S2.sp.you; p.face = -1; p.stance = true; CSK.jumper(S2, S2.sp.st, tm, .3, { made: true, flight: 1.1 }); } },
      { d: 2600, scene: 'void', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.5]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }],
        title: { text: wName.toUpperCase(), sub: `On ${starShort}`, style: 'slam', at: 900 }, ev: [[300, 'glint', 'you'], [700, 'aura', 'you'], [700, 'sfx', 'sig'], [900, 'impact', 140]] },
      { d: 4600, score: true, music: 'clutch', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'arena', cast: [{ id: 'you', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }], cam: [[0, 0, 22, 1.5], [1, 0, 22, 1.6]] }, sfx: ['STEAL!', .72, .25, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', tone: true, shot: { court: '@venue', cast: [SP('you', 250, 150)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.you, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SPLASH', .3, .3, '#7dd3fc', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', shot: { scene: 'arena', cast: [{ id: 'you', kind: 'bust', x: -.45, expr: 'fierce', rim: '#fde68a' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: ['AND ONE!', .72, .35, '#fde68a', 5, 1900] },
      ] }, ev: [[400, 'bug', `${down[0] + 3}-${down[1]}`], [1300, 'bug', `${down[0] + 6}-${down[1]}`], [2300, 'bug', `${fin[0] - 2}-${fin[1]}`], [2300, 'cheer'], [2400, 'sfx', 'roar']] },
      { d: 3600, court: '@venue', score: true, scoreText: `${fin[0] - 2}-${fin[1]}`, clockText: '0:03', cam: [[0, 8, 24, 2.3], [1, 4, -8, 2.4, 'io']], slow: [[400, 3000, .4]], speed: 'radial', focus: [.5, .35], cast: [SP('you', 196, 128), SP('st', 206, 116, 1)],
        ev: [[0, 'riser', 3], [2300, 'bug', `${fin[0]}-${fin[1]}`], [2300, 'sfx', 'buzzer'], [2400, 'cheer'], [2400, 'impact', 160]],
        play(S2, tm) { const d = S2.sp.st; d.face = 1; d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .35) / .6)) * Math.PI) * 10); CSK.jumper(S2, S2.sp.you, tm, .2, { made: true, flight: 1.25, jump: 17 }); } },
      { d: 3400, court: '@venue', score: true, scoreText: `${fin[0]}-${fin[1]}`, grade: 'gold', music: 'victory', cam: [[0, 0, 20, 1.6], [1, 0, 14, 1.4]], fgHop: true,
        cast: [SP('you', 192, 140), SP('m1', 150, 160), SP('m2', 236, 164)], title: { text: T.title, sub: T.sub, style: 'slam', at: 500 },
        ev: [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', 160], [500, 'sfx', 'impact']],
        play(S2, tm) { CSK.cel(S2.sp.you, tm < 1.5 ? 'flex' : 'joy', tm); CSK.cel(S2.sp.m1, 'joy', tm); CSK.cel(S2.sp.m2, 'joy', tm + .3); S2.ball.holder = null; S2.ball.z = 0; S2.ball.x = 180; S2.ball.y = 190; } },
      { d: 2600, scene: 'arena', grade: 'gold', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.42]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'smile', rim: '#fde68a' }], say: ['narrator', T.crowd] },
    ];
  }
  const script = k => ({ moments: 2, at: 0, async run(o) { const shots = highShots(o, k); CUTSCENES['_' + k] = { name: { upset: 'No. 1', derby: 'The Derby', nbl: 'First Win' }[k], chapter: 'Chapter 3', shots }; await Story.cut('_' + k, o.ctx, { seenId: 'c3_' + k }); return o.fin; } });
  const scripts = { c3_upset: script('upset'), c3_derby: script('derby'), c3_nbl: script('nbl') };

  /* scene functions for node.cutscene(s, ctx) */
  const play = id => s => { const def = scenes[id]; CUTSCENES['_' + id] = typeof def === 'function' ? def(s) : def; return '_' + id; };
  return { scenes, scripts, play };
})();
if (typeof JAM_SCRIPTS !== 'undefined') Object.assign(JAM_SCRIPTS, CH3.scripts);
window.EXTRA_CUTSCENES = Object.assign(window.EXTRA_CUTSCENES || {}, Object.fromEntries(Object.entries(CH3.scenes).filter(([, v]) => typeof v !== 'function')));
