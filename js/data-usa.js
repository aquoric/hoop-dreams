/* =====================================================================
   DATA-USA.JS — INTERLUDE: THE U.S. YOUTH NATIONAL TEAM
   The summer after high school (before Chapter 3) — or, for top-ranked recruits, the summer before senior year.
   Same node format as data-story.js. Extra node types (js/usa.js):
     type:'drill'  — a drill session in the gym: runs minigames (drills:[...]), scores each 0–100 and ranks you
                     against the other campers; adds camp points. { title, drills, next }
     type:'board'  — the staff's ranking board ("on the bubble"). mode:'status' just shows it;
                     mode:'cut' reads the cuts out loud, then goes to `made` or `cut`. keep: how many survive.
     type:'talk'   — a conversation with a gauge outside a game (same cutscene as in-game talks).
                     { who: TALK personality, script: TALK.scripts key, look: STORY character, win, lose, winFx, loseFx }
   Match nodes here also use: ratingRel / mateRel (ratings relative to your Overall), camp:true (the grade counts
   toward camp points), winFx / loseFx, csTeam (cutscene jersey colours).
   Extra fx: camp:n (camp points), count:{k:n}, medal:'gold|silver|bronze', gear:'shopItemId', draftStock:n, overseas:n
   Extra conditions: usaInvite (good enough for an invite), maxRank:n (recruit rank ≤ n), minCount:{k:n}, campMade
   ===================================================================== */

/* ---------- people ---------- */
Object.assign(STORY.characters, {
  reyes:  { name: 'Coach Dana Reyes', short: 'Coach Reyes', role: 'Head coach · U.S. Youth National Team', color: '#3b82f6',
            look: { skin: '#c68a5c', hair: 'bun', hairColor: '#1c1917', femme: true, outfit: 'polo', jersey: '#1e3a8a', trim: '#dc2626' } },
  moreno: { name: 'Gil Moreno', short: 'Moreno', role: 'Assistant coach · Film & scouting', color: '#60a5fa',
            look: { skin: '#d9a77e', hair: 'flattop', hairColor: '#3b2416', beard: 'goatee', outfit: 'tracksuit', jersey: '#1e3a8a', trim: '#f8fafc' } },
  jet:    { name: 'Jalen "Jet" Brooks', short: 'Jet', role: 'Atlanta · fastest guard in the class', color: '#f97316',
            look: { skin: '#6b3d25', hair: 'fade', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#1e3a8a', trim: '#dc2626', num: 3, build: 'lean', headband: '#dc2626' } },
  okafor: { name: 'Malik Okafor', short: 'Malik', role: 'Houston · 7-foot rim protector', color: '#22c55e',
            look: { skin: '#4a2a19', hair: 'buzz', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#1e3a8a', trim: '#dc2626', num: 34, build: 'strong' } },
  milo:   { name: 'Milo Park', short: 'Milo', role: 'Seattle · pure shooter, your roommate', color: '#a855f7',
            look: { skin: '#eac4a6', hair: 'curly', hairColor: '#1c1917', outfit: 'tee', jersey: '#1e3a8a', trim: '#f8fafc', num: 11, sleeve: '#f8fafc' } },
  dre:    { name: 'Andre "Dre" Castillo', short: 'Dre', role: 'Chicago · floor general', color: '#eab308',
            look: { skin: '#a86b43', hair: 'braids', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#1e3a8a', trim: '#dc2626', num: 5 } },
  mbaye:  { name: 'Bastien Mbaye', short: 'Mbaye', role: 'France U19 · 6\'10" wing, "Le Prodige"', color: '#60a5fa',
            look: { skin: '#4a2a19', hair: 'dreads', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#1d4ed8', trim: '#f8fafc', num: 7, build: 'lean' } },
});
STORY.accounts.usab = { name: 'USA Youth Hoops', handle: '@USAYouthHoops', verified: true, look: { skin: '#a86b43', hair: 'buzz', outfit: 'polo', jersey: '#1e3a8a' } };

/* ---------- teams: camp squads, the national team, and the world ---------- */
const USA_FLAG = ['#1e3a8a', '#dc2626', '#f8fafc'];
Object.assign(LOCAL_TEAMS, {
  usa:       { name: 'USA Youth', abbr: 'USA', colors: ['#1e3a8a', '#dc2626', '#f8fafc'], logo: { shape: 'shield', icon: 'stars' }, roster: ['Kai Sterling', 'Jalen "Jet" Brooks', 'Malik Okafor', 'Milo Park', 'Andre "Dre" Castillo'] },
  usa_red:   { name: 'Camp Red', abbr: 'RED', colors: ['#dc2626', '#f8fafc', '#1e3a8a'], logo: { shape: 'circle', icon: 'stars' }, roster: ['Milo Park', 'Malik Okafor', 'Andre "Dre" Castillo', 'Cam Rivers'] },
  usa_white: { name: 'Camp White', abbr: 'WHT', colors: ['#f8fafc', '#1e3a8a', '#dc2626'], logo: { shape: 'circle', icon: 'stars' }, roster: ['Kai Sterling', 'Jalen "Jet" Brooks', 'Darius "D-Train" Holt', 'Isaiah "Big Ike" Grant'], star: { name: 'Kai Sterling', perD: 66, intD: 52 } },
  usa_kai3:  { name: 'Kai\'s Crew', abbr: 'KAI', colors: ['#1e3a8a', '#facc15', '#ffffff'], logo: { shape: 'diamond', icon: 'crown' }, roster: ['Kai Sterling', 'Jalen "Jet" Brooks', 'Isaiah "Big Ike" Grant'], star: { name: 'Kai Sterling', perD: 66, intD: 52 } },
  usa_open:  { name: 'Open Tryout Squad', abbr: 'OPN', colors: ['#334155', '#f8fafc', '#0f172a'], logo: { shape: 'circle', icon: 'ball' }, roster: ['Zeke Monroe', 'Luis Ortega', 'Devin Shaw'] },
  /* the World Youth Championship field — fictional players, national styles */
  aus_u19: { name: 'Australia U19', abbr: 'AUS', colors: ['#15803d', '#facc15', '#ffffff'], logo: { shape: 'roundel', icon: 'bolt' }, pace: .25,     // fast-paced
             roster: ['Lachie Doyle', 'Bailey Moana', 'Cooper Vance', 'Jett Harlow'], star: { name: 'Lachie Doyle', perD: 60, intD: 50 } },
  ltu_u19: { name: 'Lithuania U19', abbr: 'LTU', colors: ['#facc15', '#15803d', '#b91c1c'], logo: { shape: 'shield', icon: 'flame' },
             roster: ['Rokas Valaitis', 'Mantas Girdz', 'Tadas Brazys', 'Ignas Kurka'], star: { name: 'Rokas Valaitis', perD: 58, intD: 55 } },
  can_u19: { name: 'Canada U19', abbr: 'CAN', colors: ['#dc2626', '#f8fafc', '#111827'], logo: { shape: 'circle', icon: 'tree' },
             roster: ['Dion Achebe', 'Mathis Leclair', 'Owen Pratt', 'Kofi Mensah'], star: { name: 'Dion Achebe', perD: 62, intD: 52 } },
  arg_u19: { name: 'Argentina U19', abbr: 'ARG', colors: ['#7dd3fc', '#f8fafc', '#facc15'], logo: { shape: 'roundel', icon: 'sun' },
             roster: ['Tomás Ferraro', 'Nico Albornoz', 'Santi Rufino', 'Bruno Iriarte'], star: { name: 'Tomás Ferraro', perD: 60, intD: 50 } },
  srb_u19: { name: 'Serbia U19', abbr: 'SRB', colors: ['#b91c1c', '#1e3a8a', '#f8fafc'], logo: { shape: 'shield', icon: 'mountain' },              // the big-man team
             roster: ['Vuk Radenko', 'Lazar Petrak', 'Ognjen Milas', 'Dušan Krsto'], star: { name: 'Vuk Radenko', perD: 52, intD: 72 } },
  esp_u19: { name: 'Spain U19', abbr: 'ESP', colors: ['#b91c1c', '#facc15', '#111827'], logo: { shape: 'shield', icon: 'sun' },                // tough, smart Europeans
             roster: ['Marc Ribera', 'Iker Solana', 'Pau Castells', 'Hugo Arnau'], star: { name: 'Marc Ribera', perD: 64, intD: 58 } },
  fra_u19: { name: 'France U19', abbr: 'FRA', colors: ['#1d4ed8', '#f8fafc', '#dc2626'], logo: { shape: 'diamond', icon: 'crown' },           // the rival nation
             roster: ['Bastien Mbaye', 'Yanis Bakari', 'Enzo Lacaze', 'Louis Ferrand'], star: { name: 'Bastien Mbaye', perD: 70, intD: 64 } },
});
Object.assign(PLAYER_WEAPONS, {
  'Jalen "Jet" Brooks': ['lightning_dribble', 'floater'], 'Malik Okafor': ['destroyer', 'hammer_board'], 'Milo Park': ['logo_three', 'barrier_jumper'], 'Andre "Dre" Castillo': ['no_look', 'pickpocket'],
  'Darius "D-Train" Holt': ['poster_dunk', 'post_fade'], 'Tyrese Whitlock': ['chase_block'], 'Cam Rivers': ['step_back'], 'Isaiah "Big Ike" Grant': ['destroyer', 'sky_hook'], 'Yanis Bakari': ['destroyer', 'hammer_board'],
  'Lachie Doyle': ['lightning_dribble', 'euro_step'], 'Bailey Moana': ['floater'], 'Rokas Valaitis': ['barrier_jumper', 'step_back'], 'Mantas Girdz': ['logo_three'],
  'Dion Achebe': ['vanishing_drive', 'poster_dunk'], 'Tomás Ferraro': ['step_back', 'no_look'], 'Vuk Radenko': ['sky_hook', 'destroyer'], 'Lazar Petrak': ['post_fade', 'hammer_board'],
  'Marc Ribera': ['no_look', 'post_fade'], 'Iker Solana': ['lockdown'], 'Bastien Mbaye': ['sky_three', 'chase_block'], 'Enzo Lacaze': ['robbery'],
});

/* ---------- courts ---------- */
Object.assign(VENUES, {
  usa_center: { name: 'National Training Center', group: 'Training', desc: 'Flags from the rafters, a stopwatch on every coach, and twelve jerseys hanging in a glass case.', style: 'practice', floor: 'wood', team: 'usa', crowd: .12, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'practice' },
  wyhc_arena: { name: 'Riga Youth Arena', group: 'Overseas', desc: 'World Youth Championship. Drums in the upper deck, flags from forty countries.', style: 'arena', floor: 'wood_pro', theme: 'tournament', team: 'usa', crowd: .9, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'chant' },
});

/* ---------- the selection camp field (offsets from your Overall when the camp starts; the board adds daily form) ---------- */
const USA_CAMP = {
  campers: [
    { name: 'Kai Sterling', off: 9 }, { name: 'Jalen "Jet" Brooks', off: 7 }, { name: 'Darius "D-Train" Holt', off: 6 }, { name: 'Malik Okafor', off: 5 },
    { name: 'Andre "Dre" Castillo', off: 4 }, { name: 'Milo Park', off: 3 }, { name: 'Tyrese Whitlock', off: 2 }, { name: 'Cam Rivers', off: 1 },
    { name: 'Isaiah "Big Ike" Grant', off: 0 }, { name: 'Nate Holloway', off: -1 }, { name: 'Brandon Vale', off: -2 }, { name: 'Zeke Monroe', off: -3 },
    { name: 'Luis Ortega', off: -4 }, { name: 'Devin Shaw', off: -5 }, { name: 'Corey Banks', off: -6 }, { name: 'Ty Morales', off: -8 },
  ],
  scale: 2,           // camp points per rating point of offset
  form: 4,            // ± daily form for everyone else
  invite: 76,         // invite score: Overall + 4 × recruit stars + Reputation × .2
  grade: { A: 6, B: 3, C: 0, D: -3, F: -6 }, win: 2,   // scrimmage → camp points
  talk: { win: 4, lose: -3 },
  drillScale: 9,      // drill score 0–100 → (score − 55) / drillScale camp points
};

/* ---------- talks (coach evaluations with a patience gauge) ---------- */
Object.assign(TALK.personalities, {
  reyes: { kind: 'coach', char: 'reyes', trait: 'Calm, exact, allergic to excuses. Rewards players who listen.', start: 55,
           styles: { honest: 22, team: 22, respect: 14, effort: 14, joke: -6, ego: -22, excuse: -26, argue: -20 },
           good: ['That\'s the answer I wanted.', 'Good. Now show me.'], bad: ['That\'s an excuse wearing a jersey.', 'No. Try again.'] },
});
Object.assign(TALK.scripts, {
  usa_film: [
    { say: 'Pause it. Who\'s your man on this possession, {first}?', opts: [['honest', 'Mine. I lost him on the screen.'], ['excuse', 'Milo was supposed to switch.'], ['joke', 'The guy who scored, apparently.']] },
    { say: 'Why does it matter at this level?', opts: [['team', 'One lazy rotation and the whole defense breaks.'], ['ego', 'It doesn\'t if I score on the other end.'], ['effort', 'Because everyone here can punish it.']] },
    { say: 'What\'s the fix?', opts: [['honest', 'Talk early, top-lock, and stay attached.'], ['argue', 'Different coverage, honestly.'], ['respect', 'Whatever you teach, Coach. I\'ll run it.']] },
  ],
  usa_eval: [
    { say: 'Last night of camp. Tell me what you bring that the other fourteen don\'t.', opts: [['honest', 'I make the hard play when it\'s tight.'], ['ego', 'I\'m better than most of them.'], ['team', 'I make whoever\'s next to me better.']] },
    { say: 'And if your role is ten minutes off the bench?', opts: [['team', 'Then they\'ll be the best ten minutes on the floor.'], ['argue', 'Then you\'re wasting me.'], ['effort', 'I\'ll guard the best player for all ten.']] },
    { say: 'Last one. What would you change about your camp?', opts: [['honest', 'Day one. I forced too much.'], ['excuse', 'The refs in the scrimmage were rough.'], ['respect', 'Nothing. I listened and I competed.']] },
  ],
});

/* ---------- national-team jersey (unlocked when you make the team) ---------- */
SHOP.push({ id: 'usa_jersey', cat: 'Jerseys', slot: 'jersey', name: 'National Team Jersey', price: 0, unlock: true, look: { jersey: '#1e3a8a', trim: '#dc2626', outfit: 'jersey' }, desc: 'Unlocked: you made the national team' });
SHOP_BY_ID.usa_jersey = SHOP[SHOP.length - 1];

/* ---------- trophies + recruiting ---------- */
ACHIEVEMENTS.push(
  { id: 'usa_camp',   name: 'Invited',          desc: 'Get invited to the national team selection camp.', check: s => !!s.flags.usa_camp },
  { id: 'usa_roster', name: 'Red, White & You', desc: 'Make the U.S. Youth National Team.',               check: s => !!s.flags.usa_made },
  { id: 'usa_medal',  name: 'On the Podium',    desc: 'Win a medal at the World Youth Championship.',     check: s => (s.career.medals || []).length > 0 },
  { id: 'usa_gold',   name: 'World Champion',   desc: 'Win gold at the World Youth Championship.',        check: s => (s.career.medals || []).some(m => m.medal === 'gold') },
);
if (typeof RECRUITING !== 'undefined') Object.assign(RECRUITING.bonus, { usa_camp: 4, usa_made: 12, usa_medal: 5, usa_gold: 8 });

/* ---------- cinematics (merged into CUTSCENES by js/cutscene.js) ---------- */
window.EXTRA_CUTSCENES = Object.assign(window.EXTRA_CUTSCENES || {}, {
  usa_arrival: { name: 'Selection Camp', chapter: 'Interlude', shots: [
    { d: 2600, scene: 'highway', cam: [[0, -30, -6, 1.15], [1, 20, -4, 1.2]], grade: 'sunset', music: 'build', tr: 'fade', cast: [{ id: 'bus', kind: 'bus', x: 0, y: 66, d: 1 }],
      title: { text: 'NATIONAL TRAINING CENTER', sub: 'Selection camp · 18 invited · 12 make it', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 2600, scene: 'gym', cam: [[0, -40, 0, 1.12], [1, -10, -4, 1.22]], cast: [{ id: 'you', kind: 'full', x: -.4, y: 98, from: { dx: 90, t: 1700, ease: 'out' }, walk: true, rim: '#93c5fd' }],
      say: ['narrator', 'Flags hang from the rafters. Every kid in this gym was the best player in his state.'] },
    { d: 2600, scene: 'locker', cam: [[0, 10, 0, 1.15], [1, 20, 6, 1.28, 'io']], cast: [{ id: 'reyes', kind: 'bust', x: .3, expr: 'neutral', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
      say: ['reyes', 'Eighteen of you, twelve jerseys. Nobody here is owed one.'] },
    { d: 2300, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial', music: 'clutch',
      cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'smile', from: { dx: 160, t: 300, ease: 'back' }, rim: '#fca5a5' }, { id: 'you', kind: 'bust', x: -.55, expr: 'determined', from: { dx: -160, t: 300, ease: 'back' }, rim: '#93c5fd' }],
      title: { text: 'SAME GYM AGAIN', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 8]] },
  ] },
  usa_cutday: { name: 'Cut Day', chapter: 'Interlude', shots: [
    { d: 2800, scene: 'locker', grade: 'dark', music: null, cam: [[0, 0, 0, 1.1], [1, 0, 0, 1.2]], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'sad', rim: '#93c5fd' }],
      say: ['narrator', '8 a.m. The list goes on the door. Nobody slept.'], ev: [[0, 'sfx', 'heartbeat'], [1400, 'sfx', 'heartbeat']] },
    { d: 2000, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], title: { text: 'CUT DAY', sub: 'Twelve names', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'shake', 6]] },
  ] },
  usa_abroad: { name: 'Abroad', chapter: 'Interlude', shots: [
    { d: 2400, scene: 'sky', cam: [[0, -20, 0, 1.1], [1, 20, 0, 1.18]], music: 'build', tr: 'fade', cast: [{ id: 'plane', kind: 'plane', x: 0, y: 10, d: 1 }],
      title: { text: 'WHEELS UP', sub: 'Next stop: Riga, Latvia', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 2400, scene: 'city', cam: [[0, -40, -10, 1.05], [1, 30, -14, 1.14]], grade: 'night', tr: 'fade', title: { text: 'RIGA', sub: 'World Youth Championship · 16 nations', style: 'loc', at: 250 } },
    { d: 2400, scene: 'tunnel', cam: [[0, 0, 0, 1], [1, 0, -6, 1.25, 'in']], cast: [{ id: 'you', kind: 'full', x: 0, y: 104, sil: true, rim: '#fde68a', d: 1 }],
      say: ['narrator', 'Different language on the signs. Same ten feet on the rim.'], ev: [[0, 'sfx', 'crowd', 1.2]] },
  ] },
  usa_anthem: { name: 'The Anthem', chapter: 'Interlude', shots: [
    { d: 2600, scene: 'locker', cam: [[0, 0, 4, 1.15], [1, 0, 10, 1.32, 'io']], music: null, cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#fde68a' }],
      say: ['narrator', 'Your name on the back. Three letters on the front that matter more.'], ev: [[300, 'sfx', 'riser', 2]] },
    { d: 2800, scene: 'arena', grade: 'spot', cam: [[0, 0, -10, 1.2], [1, 0, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'bust', x: -.35, expr: 'determined', rim: '#93c5fd' }, { id: 'kai', kind: 'bust', x: .4, expr: 'neutral', rim: '#fca5a5', d: 1.1 }],
      title: { text: 'THE ANTHEM', sub: 'Hand on heart', style: 'rise', at: 400 }, ev: [[0, 'cheer'], [400, 'sfx', 'stinger']] },
  ] },
  usa_gold:   { name: 'Gold', chapter: 'Interlude', shots: [{ d: 3600, scene: 'arena', grade: 'gold', music: 'victory', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.35, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fde68a' }],
    title: { text: 'GOLD MEDAL', sub: 'World Youth Champions', style: 'slam', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'confetti', 160], [300, 'cheer'], [600, 'sfx', 'roar']] }] },
  usa_silver: { name: 'Silver', chapter: 'Interlude', shots: [{ d: 3200, scene: 'arena', grade: 'blue', music: 'story', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.3, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#e2e8f0' }],
    title: { text: 'SILVER MEDAL', sub: 'One game from gold', style: 'rise', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'cheer']] }] },
  usa_bronze: { name: 'Bronze', chapter: 'Interlude', shots: [{ d: 3200, scene: 'arena', grade: 'sunset', music: 'story', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.3, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fdba74' }],
    title: { text: 'BRONZE MEDAL', sub: 'On the podium', style: 'rise', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'cheer']] }] },
});

/* =====================================================================
   THE ARC
   ===================================================================== */
const USA_GAME = (them, title, sub, o = {}) => Object.assign({ type: 'match', us: 'usa', them, ratingRel: 2, mateRel: 2, moments: 10, level: 'hs', importance: 2, venue: 'wyhc_arena', venueSide: 'away', title, sub }, o);
STORY.chapters.usa = {
  title: 'Interlude', name: 'Red, White & Hoops', stage: 'National Team', start: 'invite_check',
  blurb: 'Selection camp, cut days, Kai Sterling as a teammate, and the World Youth Championship.',
  nodes: {
    /* ---------------- getting in ---------------- */
    early_offer: { scene: 'home', fx: { flag: 'usa_early' },
      lines: [
        ['narrator', 'A number you don\'t know. A voice that sounds like it\'s never wasted a word.'],
        ['reyes', 'This is Dana Reyes, U.S. Youth National Team. We want you at selection camp this month.'],
        ['nia', '(mouthing) WHO IS IT. WHO. IS. IT.', 'smile'],
      ],
      choices: [
        { t: '"I\'ll be there, Coach."', fx: { rel: { reyes: 4 }, flag: 'usa_camp', log: 'Invited to the national team camp (junior summer).' }, next: 'invite_home' },
        { t: '"Not this summer — I need to get stronger first."', fx: { unflag: 'usa_early', morale: -2 }, next: 'decline' },
      ] },
    decline: { scene: 'home', lines: [['reyes', 'Respect. The door stays open — be ready next year.'], ['narrator', 'You hang up and stare at the phone for a long time.']], next: 'highschool:c2_nia_bday' },
    second_chance: { scene: 'home', fx: { unflag: ['usa_early', 'usa_cut', 'usa_done', 'usa_made'], flag: 'usa_returned', log: 'Invited back to the national team camp.' },
      lines: [
        ['reyes', '(on the phone) Told you we keep a list. You got better — I watched.'],
        ['reyes', 'Camp starts in two weeks. Same rules: eighteen names, twelve jerseys.'],
        ['lou', 'Second chances are rare, kid. Don\'t knock politely this time.', 'fierce'],
      ], next: 'arrive' },
    invite_check: { type: 'branch', branches: [{ if: { usaInvite: true }, next: 'invite' }], else: 'no_invite' },
    invite: { scene: 'home', fx: { flag: 'usa_camp', log: 'Invited to the national team camp.' },
      lines: [
        ['narrator', 'A thick envelope. Navy blue. A seal with stars on it.'],
        ['mom', 'Baby… it says "United States of America." On the envelope.', 'smile'],
        ['nia', 'Selection camp! Eighteen players, twelve spots. Kai\'s on the list too, obviously.', 'smile'],
      ], next: 'invite_home' },
    invite_home: { scene: 'home',
      lines: [
        ['lou', '(on the phone) I played against kids who wore that jersey. They never forgot it. Neither will you.'],
        ['lou', 'Go take one of those twelve. Don\'t wait to be handed it.', 'fierce'],
      ], next: 'arrive' },
    no_invite: { scene: 'home',
      lines: [
        ['narrator', 'The national team camp list drops at noon. You scroll it twice.'],
        ['nia', 'Your name isn\'t… there\'s an open regional tryout Saturday, though. One late invite.', 'sad'],
        ['dee', '(text) Go. Coaches love a kid who shows up uninvited and takes the gym.'],
      ],
      choices: [
        { t: 'Go to the open tryout.', fx: { morale: 2 }, next: 'tryout_pre' },
        { t: 'Skip it. Rest up for next season.', fx: { flag: 'usa_skipped' }, next: 'return_home' },
      ] },
    tryout_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Ninety kids, one gym, one assistant coach with a clipboard and no expression.'],
        ['moreno', 'Three-on-three to fifteen. Winners stay. Impress me.'],
      ], next: 'tryout_game' },
    tryout_game: { type: 'match', us: 'halsey', them: 'usa_open', pickup: { size: 3, target: 15 }, ratingRel: 1, mateRel: -3, moments: 7, level: 'street', venue: 'usa_center',
      title: 'Open Tryout', sub: 'One late invite', win: 'late_invite', lose: 'tryout_last' },
    tryout_last: { scene: 'gym',
      lines: [['moreno', 'You lost. But I saw something. Last rep: show me why I should care.']],
      choices: [
        { t: 'Lock up their best scorer, full court.', check: { a: ['perD', 'speed'], dc: 52 }, next: 'late_invite', fail: 'not_this_year' },
        { t: 'Call for the ball and go get a bucket.', check: { a: ['finish', 'handle'], dc: 52 }, next: 'late_invite', fail: 'not_this_year' },
      ] },
    not_this_year: { scene: 'street_night', fx: { flag: 'usa_missed', morale: -3, log: 'Missed the national team camp.' },
      lines: [
        ['moreno', 'Not this year. Get stronger. We keep a list.'],
        ['narrator', 'Halsey Street, after dark. You shoot until the lights go out. Next summer, then.'],
      ], next: 'return_home' },
    late_invite: { scene: 'gym', fx: { flag: 'usa_camp', rep: 2, log: 'Earned a late invite to the national team camp.' },
      lines: [
        ['moreno', 'Pack a bag. Camp starts Monday — you\'re the eighteenth name.'],
        ['narrator', 'The last guy in. Which means nobody expects anything. Good.'],
      ], next: 'arrive' },

    /* ---------------- selection camp ---------------- */
    arrive: { scene: 'gym', cutscene: 'usa_arrival', fx: { campStart: true },
      lines: [['narrator', 'Selection camp, day one. Your name tag is already on a locker — for now.']], next: 'meet_staff' },
    meet_staff: { scene: 'gym',
      lines: [
        ['reyes', 'Two cut days. A board on the wall with your name and a number. It changes every night.'],
        ['moreno', 'We film everything. Every closeout, every sulk on the bench.'],
      ],
      choices: [
        { t: '"Good. I want to be coached hard."', fx: { rel: { reyes: 4 }, camp: 1 }, next: 'meet_campers' },
        { t: '"Just tell me where to go to win."', fx: { rel: { reyes: 2 } }, next: 'meet_campers' },
        { t: '"I\'ll make it easy — I\'m on the team."', fx: { rel: { reyes: -3 }, camp: -1 }, next: 'meet_campers' },
      ] },
    meet_campers: { scene: 'locker',
      lines: [
        ['jet', 'Jalen. Jet. Atlanta. I\'m the fastest guy here — ask anybody.', 'smile'],
        ['okafor', 'Malik. I block shots. That\'s the whole introduction.'],
        ['milo', 'Milo Park, your roommate. I snore, but I also hit 47% from three.', 'smile'],
        ['dre', 'Dre Castillo. I run the point. You get open, I find you.'],
      ], next: 'kai_camp' },
    kai_camp: { scene: 'locker',
      lines: [
        ['kai', 'Look who made the list. Did they mail yours to the wrong house first?', 'smile'],
        ['kai', 'Twelve spots, {first}. One of us is probably taking the other\'s.', 'fierce'],
      ],
      choices: [
        { t: '"Then it\'s not going to be mine."', fx: { rel: { kai: -2 }, morale: 2 }, next: 'board_intro' },
        { t: '"Or we both make it and win something."', fx: { rel: { kai: 4 }, chem: 3 }, next: 'board_intro' },
      ] },
    board_intro: { type: 'board', mode: 'status', title: 'THE BOARD · DAY 1', note: 'Where the staff has you before a single drill.', next: 'day1_drills' },
    day1_drills: { type: 'drill', title: 'DAY 1 · SKILLS TESTING', drills: ['shotMeter', 'dribbleCombo', 'freeThrow'], next: 'day1_dorm' },
    day1_dorm: { scene: 'dorm',
      lines: [
        ['milo', 'Lights out in ten. You eat? You need to eat. Day two is the scrimmage, they say it decides half the board.'],
        ['milo', 'Real question: what are you doing if you get cut?'],
      ],
      choices: [
        { t: '"I\'m not getting cut. Neither are you."', fx: { rel: { milo: 4 }, chem: 3 }, next: 'day1_film' },
        { t: '"Going back home and getting better. Same as always."', fx: { rel: { milo: 3 }, morale: 2 }, next: 'day1_film' },
        { t: '"Not your problem, roomie."', fx: { rel: { milo: -4 } }, next: 'day1_film' },
      ] },
    day1_film: { type: 'talk', scene: 'locker', who: 'reyes', look: 'reyes', script: 'usa_film', title: 'FILM ROOM · COACH REYES',
      winFx: { camp: 4, rel: { reyes: 4 } }, loseFx: { camp: -3, rel: { reyes: -2 } }, next: 'day1_board' },
    day1_board: { type: 'board', mode: 'status', title: 'THE BOARD · AFTER DAY 1', next: 'day2_scrim_pre' },
    day2_scrim_pre: { scene: 'gym',
      lines: [
        ['reyes', 'Red versus White, full court, refs, clock. Kai, Jet, D-Train — White.'],
        ['dre', '(to you) They\'re stacked. We share it, we win it.'],
      ], next: 'day2_scrim' },
    day2_scrim: { type: 'match', us: 'usa_red', them: 'usa_white', ratingRel: 3, mateRel: 1, moments: 9, level: 'hs', importance: 2, venue: 'usa_center', camp: true,
      title: 'Camp Scrimmage', sub: 'Red vs White', win: 'day2_scrim_win', lose: 'day2_scrim_loss' },
    day2_scrim_win: { scene: 'gym', fx: { camp: 2 }, lines: [['reyes', 'Red wins. Somebody on White just lost a few spots on that board.'], ['kai', '(walking past) Enjoy it.', 'fierce']], next: 'cut1_pre' },
    day2_scrim_loss: { scene: 'gym', lines: [['reyes', 'White wins. A loss isn\'t a cut — what you did in it is what we graded.'], ['jet', 'Good run though. You made me work.', 'smile']], next: 'cut1_pre' },
    cut1_pre: { scene: 'dorm',
      lines: [
        ['narrator', 'Your phone buzzes at midnight. Mom.'],
        ['mom', 'Whatever that list says tomorrow, you\'re still my baby. Now go to sleep.', 'smile'],
      ], next: 'cut1' },
    cut1: { type: 'board', mode: 'cut', keep: 14, cutscene: 'usa_cutday', title: 'FIRST CUT · 14 STAY', made: 'cut1_safe', cut: 'cut_home' },
    cut1_safe: { scene: 'locker', fx: { morale: 4, log: 'Survived the first cut.' },
      lines: [
        ['narrator', 'Your name\'s still on the door. Ty Morales is packing his bag two lockers down.'],
        ['milo', 'Hey. We\'re still here. Don\'t look at the board, look at the next drill.'],
      ], next: 'day3_drills' },
    day3_drills: { type: 'drill', title: 'DAY 3 · GAME SKILLS', drills: ['drive', 'passLane', 'defenseReact'], next: 'day3_dorm' },
    day3_dorm: { scene: 'dorm',
      lines: [
        ['narrator', 'Rec room, 10 p.m. Kai and Malik are nose to nose over a ping-pong game.'],
        ['okafor', 'Say it again, Sterling. Say "big men can\'t shoot" again.', 'fierce'],
        ['kai', 'Big men can\'t— (Jet steps between them)', 'smile'],
      ],
      choices: [
        { t: 'Step in and break it up. "Save it for France."', fx: { chem: 5, rel: { okafor: 4, kai: 2, reyes: 2 }, camp: 2 }, next: 'day3_3v3_pre' },
        { t: 'Grab a paddle: "Winner plays me."', check: { a: 'iq', dc: 50 }, fx: { chem: 6, rel: { kai: 4, okafor: 3 } }, next: 'day3_3v3_pre', fail: 'day3_dorm_bad', failFx: { chem: -2 } },
        { t: 'Stay out of it. Sleep.', fx: { fatigue: -10 }, next: 'day3_3v3_pre' },
      ] },
    day3_dorm_bad: { scene: 'dorm', fx: { camp: -1 },
      lines: [['narrator', 'You lose 21–4 to Malik, he laughs, Kai laughs harder, and somehow the fight is now about you.'], ['moreno', '(at the door) Lights. Out. All of you.']], next: 'day3_3v3_pre' },
    day3_3v3_pre: { scene: 'gym',
      lines: [['reyes', 'King of the court, three-on-three. First to fifteen. Your crew against Kai\'s.'], ['kai', 'I\'ve been waiting all camp for this one.', 'fierce']], next: 'day3_3v3' },
    day3_3v3: { type: 'match', us: 'usa_red', them: 'usa_kai3', pickup: { size: 3, target: 15 }, ratingRel: 4, mateRel: 1, moments: 7, level: 'street', importance: 2, venue: 'usa_center', camp: true,
      title: 'King of the Court', sub: 'Your crew vs Kai\'s', win: 'day3_3v3_win', lose: 'day3_3v3_loss' },
    day3_3v3_win: { scene: 'gym', fx: { camp: 3, rel: { kai: -1 } }, lines: [['kai', 'Fine. You\'re good. Don\'t make it weird.', 'neutral'], ['moreno', '(writing) Noted.']], next: 'eval' },
    day3_3v3_loss: { scene: 'gym', lines: [['kai', 'Some things don\'t change.', 'smile'], ['reyes', 'Shake hands. Both of you competed.']], next: 'eval' },
    eval: { type: 'talk', scene: 'locker', who: 'reyes', look: 'reyes', script: 'usa_eval', title: 'FINAL EVALUATION · COACH REYES',
      winFx: { camp: 4, rel: { reyes: 5 } }, loseFx: { camp: -3 }, next: 'final_cut_pre' },
    final_cut_pre: { scene: 'dorm',
      lines: [
        ['milo', 'Fourteen of us. Twelve jerseys. I keep doing the math and it doesn\'t get better.', 'sad'],
        ['narrator', 'You stare at the ceiling. Somewhere down the hall, somebody is already packing.'],
      ], next: 'final_cut' },
    final_cut: { type: 'board', mode: 'cut', keep: 12, title: 'FINAL ROSTER · 12 JERSEYS', made: 'made_team', cut: 'cut_home' },

    /* ---------------- made it / cut ---------------- */
    made_team: { scene: 'gym', fx: { flag: 'usa_made', rep: 6, fans: 4000, morale: 8, xp: 200, recruit: true, offers: true, draftStock: 4, overseas: 3, log: 'Made the U.S. Youth National Team.',
        post: { by: 'usab', text: '🇺🇸 Your U.S. Youth National Team roster is set. Welcome, {first} {last}.' } },
      lines: [
        ['reyes', 'Congratulations. You earned it — every drill, every film session.', 'smile'],
        ['narrator', 'Kai\'s name is on the list too. Of course it is.'],
      ], next: 'kai_teammates' },
    kai_teammates: { scene: 'locker',
      lines: [
        ['kai', 'So. Teammates.', 'neutral'],
        ['kai', 'If we\'re doing this, I need you to set screens for me. Real ones.'],
      ],
      choices: [
        { t: '"I\'ll screen. You pass back when they double."', fx: { rel: { kai: 6 }, chem: 6, flag: 'kai_teammate' }, next: 'jersey' },
        { t: '"We\'ll see who\'s screening for who."', fx: { rel: { kai: -2 }, chem: -2 }, next: 'jersey' },
      ] },
    jersey: { scene: 'locker', fx: { gear: 'usa_jersey' },
      lines: [
        ['narrator', 'The equipment manager hands you a jersey with your name on the back. Navy, red trim, stars at the collar.'],
        ['narrator', 'It\'s yours now — find it in your Shop tab, under Jerseys.'],
      ], next: 'travel' },
    cut_home: { scene: 'locker', fx: { flag: 'usa_cut', morale: -6, log: 'Cut from the national team camp.' },
      lines: [
        ['reyes', 'You\'re not on the twelve. It was close. Close is still a no.'],
        ['reyes', 'Here\'s what I need to see next time: be the same player on day three as on day one.'],
        ['narrator', 'On your way out you pass the list. "STERLING, K." is on it.'],
      ], next: 'cut_lou' },
    cut_lou: { scene: 'street_night',
      lines: [
        ['lou', 'Got cut? Good. Michael got cut once too. Every one of them got told no.'],
        ['lou', 'Write their twelve names on your wall. Look at it every morning.', 'fierce'],
      ],
      choices: [
        { t: 'Write the names on the wall.', fx: { flag: 'usa_motivated', attrs: { iq: 1 }, morale: 4 }, next: 'cut_watch' },
        { t: 'Throw the list away. Just work.', fx: { attrs: { str: 1 }, morale: 2 }, next: 'cut_watch' },
      ] },
    cut_watch: { scene: 'home',
      lines: [
        ['narrator', 'Two weeks later you watch Kai on TV, in the jersey you wanted, in a gym in Latvia.'],
        ['reyes', '(text) We keep a list. Get better and stay on it.'],
      ], next: 'return_home' },

    /* ---------------- the World Youth Championship ---------------- */
    travel: { scene: 'airport', cutscene: 'usa_abroad',
      lines: [
        ['narrator', 'Riga, Latvia. Sixteen nations, a hotel full of tall teenagers, and food nobody can pronounce.'],
        ['jet', 'Bro, the breakfast has fish. At breakfast.', 'smile'],
      ], next: 'hotel' },
    hotel: { scene: 'abroad',
      lines: [
        ['moreno', 'Group C: Australia, Lithuania, Canada. Win two and we\'re in the quarters.'],
        ['moreno', 'Australia runs. Lithuania shoots. Canada has Dion Achebe, who dunks on everybody.'],
      ], next: 'anthem' },
    anthem: { scene: 'arena', cutscene: 'usa_anthem', csTeam: 'usa', fx: { log: 'Wore the national team jersey for the first time.' },
      lines: [['narrator', 'The anthem ends. The crowd roars. Your hands won\'t stop shaking until the tip.']], next: 'g1' },
    g1: USA_GAME('aus_u19', 'World Youth Championship', 'Group C · vs Australia', { win: 'g1_win', lose: 'g1_loss', winFx: { count: { usa_gw: 1 } } }),
    g1_win: { scene: 'abroad', lines: [['dre', 'They wanted to run? We ran them off the floor.', 'smile']], next: 'g2' },
    g1_loss: { scene: 'abroad', lines: [['reyes', 'They were faster than us tonight. That won\'t happen twice.']], next: 'g2' },
    g2: USA_GAME('ltu_u19', 'World Youth Championship', 'Group C · vs Lithuania', { win: 'g2_post', lose: 'g2_post', winFx: { count: { usa_gw: 1 } } }),
    g2_post: { scene: 'abroad', lines: [['milo', 'They hit nine threes on us. Nine. I\'m taking it personally.'], ['moreno', 'Canada next. Achebe. Somebody has to keep him off the rim.']], next: 'g3' },
    g3: USA_GAME('can_u19', 'World Youth Championship', 'Group C · vs Canada', { win: 'group_check', lose: 'group_check', winFx: { count: { usa_gw: 1 } } }),
    group_check: { type: 'branch', branches: [{ if: { minCount: { usa_gw: 2 } }, next: 'qf_pre' }], else: 'out_group' },
    out_group: { scene: 'abroad', fx: { morale: -6, log: 'Out in the group stage of the World Youth Championship.' },
      lines: [['reyes', 'One win. Not enough. We fly home tomorrow.'], ['kai', 'This one\'s going to bother me for a long time.', 'sad']], next: 'tour_end' },
    qf_pre: { scene: 'abroad', fx: { rep: 2 },
      lines: [['moreno', 'Quarterfinal: Argentina. Ferraro\'s step-back is the best shot in the tournament.'], ['reyes', 'Lose and go home. Win and you\'re playing for a medal.']], next: 'qf' },
    qf: USA_GAME('arg_u19', 'World Youth Championship', 'Quarterfinal · vs Argentina', { importance: 3, win: 'sf_pre', lose: 'out_qf' }),
    out_qf: { scene: 'abroad', fx: { morale: -4, log: 'Lost in the World Youth Championship quarterfinals.' },
      lines: [['narrator', 'Ferraro hits the step-back with four seconds left. The Argentine bench empties.'], ['reyes', 'Hold onto this feeling. It\'s the most useful thing you\'ll take home.']], next: 'tour_end' },
    sf_pre: { scene: 'abroad',
      lines: [
        ['moreno', 'Semifinal: Serbia. Radenko is seven feet and moves like a guard.'],
        ['okafor', 'Seven feet? I\'m seven feet. Let\'s see who blinks.', 'fierce'],
      ], next: 'sf' },
    sf: USA_GAME('srb_u19', 'World Youth Championship', 'Semifinal · vs Serbia', { importance: 3, win: 'final_pre', lose: 'bronze_pre' }),
    bronze_pre: { scene: 'abroad',
      lines: [['reyes', 'Nobody wants the bronze game. Play it anyway. You don\'t fly home empty-handed.'], ['dre', 'Spain beat us in a scrimmage two years ago. I remember.', 'fierce']], next: 'bronze' },
    bronze: USA_GAME('esp_u19', 'World Youth Championship', 'Bronze-medal game · vs Spain', { importance: 3, win: 'medal_bronze', lose: 'fourth' }),
    final_pre: { scene: 'abroad',
      lines: [
        ['moreno', 'Final: France. Bastien Mbaye — 6-10, shoots from the logo, chases down blocks.'],
        ['mbaye', '(in the hallway) Americans always think the final is theirs. Not this year.', 'smile'],
        ['kai', '(to you) You take Mbaye. I\'ll take everybody else.', 'fierce'],
      ],
      choices: [
        { t: '"Done. He doesn\'t get a clean look."', fx: { rel: { kai: 3 }, morale: 3 }, next: 'final' },
        { t: '"We take him together. Switch everything."', fx: { chem: 4, rel: { kai: 2, reyes: 2 } }, next: 'final' },
      ] },
    final: USA_GAME('fra_u19', 'World Youth Championship', 'FINAL · vs France', { importance: 3, ratingRel: 4, moments: 11, win: 'medal_gold', lose: 'medal_silver' }),
    medal_gold: { scene: 'podium', cutscene: 'usa_gold', csTeam: 'usa', fx: { medal: 'gold', flag: 'usa_gold', rep: 10, fans: 20000, xp: 400, recruit: true, offers: true, draftStock: 8, overseas: 6, rel: { reyes: 5, kai: 4 },
        log: 'Won gold at the World Youth Championship.', post: { by: 'usab', text: '🥇 WORLD CHAMPIONS. {first} {last} and the U.S. Youth National Team beat France for gold!' } },
      lines: [['reyes', 'Gold. Look up at that flag — you put it there.', 'smile'], ['kai', '(holding the medal up next to yours) Told you. One of us was taking the other\'s spot? Nah.', 'smile']], next: 'tour_end' },
    medal_silver: { scene: 'podium', cutscene: 'usa_silver', csTeam: 'usa', fx: { medal: 'silver', flag: 'usa_medal', rep: 6, fans: 10000, xp: 260, recruit: true, offers: true, draftStock: 5, overseas: 4, rel: { reyes: 3 },
        log: 'Won silver at the World Youth Championship.', post: { by: 'usab', text: '🥈 Silver at the World Youth Championship. Proud of this group.' } },
      lines: [['mbaye', '(at the handshake line) You were the only one who bothered me all tournament.'], ['reyes', 'Silver hurts today. In a year it\'ll fuel you.']], next: 'tour_end' },
    medal_bronze: { scene: 'podium', cutscene: 'usa_bronze', csTeam: 'usa', fx: { medal: 'bronze', flag: 'usa_medal', rep: 4, fans: 6000, xp: 200, recruit: true, draftStock: 3, overseas: 3,
        log: 'Won bronze at the World Youth Championship.', post: { by: 'usab', text: '🥉 Bronze in Riga. The U.S. Youth National Team finishes on the podium.' } },
      lines: [['dre', 'Not the medal we wanted. Still a medal. I\'m wearing it to breakfast.', 'smile']], next: 'tour_end' },
    fourth: { scene: 'abroad', fx: { rep: 1, log: 'Finished fourth at the World Youth Championship.' },
      lines: [['narrator', 'Fourth. No medal, no podium, a long flight home.'], ['milo', 'Next time.', 'sad']], next: 'tour_end' },
    tour_end: { scene: 'airport', fx: { flag: 'usa_done', recruit: true },
      lines: [
        ['reyes', 'You\'ll hear from me again. Coaches like me keep lists — you\'re on mine now.'],
        ['kai', '(at the gate) See you on the other side, teammate.', 'neutral', { flag: 'kai_teammate' }],
        ['narrator', 'The flight home is twelve hours. You sleep for eleven of them.'],
      ], next: 'return_home' },
    return_home: { type: 'branch', branches: [{ if: { flag: 'usa_early', notFlag: 'usa_returned' }, next: 'highschool:c2_nia_bday' }], else: 'highschool:ch_end' },
  },
};
