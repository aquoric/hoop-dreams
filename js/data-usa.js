/* =====================================================================
   DATA-USA.JS — INTERLUDE: RED, WHITE & HOOPS (STORY.md, Interlude)
   Always the summer after high school: Chapter 2 → this interlude → Chapter 3 (where you pick college, overseas or
   the Grind League — so the results here move your offers). Ends with its own chapter-complete screen (usa_end).
   Two arcs (js/data-arcs.js): THE SELECTION CAMP ARC — the top-100 invite (or the open tryout, or the pro-am road),
   camp, and the final board (everyone invited makes the twelve; your place decides rotation or the end of the bench);
   THE WORLD YOUTH ARC — the bench montages, Kai's call with Silk, the final (one moment, played live) and gold.
   Same node format as data-story.js. Extra node types (js/usa.js):
     type:'drill'  — a drill session in the gym: runs minigames (drills:[...]), scores each 0–100 and ranks you
                     against the other campers; adds camp points. { title, drills, next }
     type:'board'  — the staff's ranking board ("on the bubble"). mode:'status' just shows it;
                     mode:'cut' reads the cuts out loud, then goes to `made` or `cut`. keep: how many survive;
                     safe:true — you always survive (on the bubble, you squeak in).
                     mode:'roster' — the final twelve (always with you); place ≤ rotation → flag usa_rotation, else usa_bench.
     type:'talk'   — a conversation with a gauge outside a game (same cutscene as in-game talks).
                     { who: TALK personality, script: TALK.scripts key, look: STORY character, win, lose, winFx, loseFx }
   Match nodes here also use: ratingRel / mateRel (ratings relative to your Overall), camp:true (the grade counts
   toward camp points), winFx / loseFx, csTeam (cutscene jersey colours), lateEntry:{ at, score, title, text } (you check in
   late: the game starts there), script (a scripted ending, JAM_SCRIPTS), jellyMoment.mono (its inner monologue kinds).
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
  proam_crew: { name: 'Dee\'s Pro-Am Crew', abbr: 'DEE', colors: ['#f97316', '#111827', '#f8fafc'], logo: { shape: 'circle', icon: 'ball' }, roster: ['Rome Carter', 'Old Man Pete', 'Marcus Hill'] },
  proam_vets: { name: 'Kingdom Vets', abbr: 'KNG', colors: ['#a16207', '#0f172a', '#fde68a'], logo: { shape: 'shield', icon: 'crown' },   // grown men: overseas pros, ex-college stars
                roster: ['Reggie Walsh', 'Big Sal Okoro', 'DeShawn Price', 'Tony Ruiz'], star: { name: 'Reggie Walsh', perD: 62, intD: 56 } },
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
  kingdom_proam: { name: 'The Kingdom Pro-Am', group: 'Training', desc: 'A sweatbox rec gym. Grown men, overseas pros, and nobody cares who you are.', style: 'practice', floor: 'wood', crowd: .5, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'chant' },
  wyhc_arena: { name: 'Riga Youth Arena', group: 'Overseas', desc: 'World Youth Championship. Drums in the upper deck, flags from forty countries.', style: 'arena', floor: 'wood_pro', theme: 'tournament', team: 'usa', crowd: .9, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'chant' },
});

/* ---------- the selection camp field (offsets from your Overall when the camp starts; the board adds daily form) ---------- */
const USA_CAMP = {
  campers: [
    { name: 'Kai Sterling', off: 9 }, { name: 'Jalen "Jet" Brooks', off: 7 }, { name: 'Darius "D-Train" Holt', off: 6 }, { name: 'Malik Okafor', off: 5 },
    { name: 'Andre "Dre" Castillo', off: 4 }, { name: 'Milo Park', off: 3 }, { name: 'Tyrese Whitlock', off: 2 }, { name: 'Cam Rivers', off: 1 },
    { name: 'Isaiah "Big Ike" Grant', off: 0 }, { name: 'Nate Holloway', off: -1 }, { name: 'Brandon Vale', off: -2 }, { name: 'Zeke Monroe', off: -3 },
    { name: 'Luis Ortega', off: -4 }, { name: 'Devin Shaw', off: -5 }, { name: 'Corey Banks', off: -6 }, { name: 'Rashad Price', off: -7 }, { name: 'Ty Morales', off: -8 },
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
    { d: 2000, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], title: { text: 'CUT DAY', sub: 'Fourteen stay', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'shake', 6]] },
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
  /* older saves only (the medal games they already played) */
  usa_gold:   { name: 'Gold', chapter: 'Interlude', shots: [{ d: 3600, scene: 'arena', grade: 'gold', music: 'victory', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.35, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fde68a' }],
    title: { text: 'GOLD MEDAL', sub: 'World Youth Champions', style: 'slam', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'confetti', 160], [300, 'cheer'], [600, 'sfx', 'roar']] }] },
  usa_silver: { name: 'Silver', chapter: 'Interlude', shots: [{ d: 3200, scene: 'arena', grade: 'blue', music: 'story', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.3, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#e2e8f0' }],
    title: { text: 'SILVER MEDAL', sub: 'One game from gold', style: 'rise', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'cheer']] }] },
  usa_bronze: { name: 'Bronze', chapter: 'Interlude', shots: [{ d: 3200, scene: 'arena', grade: 'sunset', music: 'story', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.3, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fdba74' }],
    title: { text: 'BRONZE MEDAL', sub: 'On the podium', style: 'rise', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'cheer']] }] },
  /* Kai's POV: the video call with Silk after the semifinal */
  wy_kai_call: { name: 'The Call', chapter: 'Interlude · Kai', shots: [
    { d: 2200, scene: 'void', music: 'kai', tr: 'fade', title: { text: 'Team hotel · Riga · 1:12 a.m.', style: 'line', at: 300 }, ev: [[1200, 'sfx', 'ring']] },
    { d: 3200, scene: 'void', manga: { bg: '#05070d', panels: [{ r: [.28, .08, .44, .72], at: 0, from: 'top', shot: { scene: 'locker', grade: 'night', cam: [[0, 0, -4, 1.2], [1, 0, -6, 1.26]], cast: [{ id: 'silk', kind: 'bust', x: 0, expr: 'neutral', rim: '#facc15' }] } }] },
      say: ['silk', 'Thirty-one on Serbia. Fine.'] },
    { d: 3200, scene: 'void', grade: 'blue', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.4]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'neutral', rim: '#93c5fd' }],
      say: ['silk', 'Four GMs flew in for the final. They\'re watching you, not your team.'] },
    { d: 3200, scene: 'void', manga: { bg: '#05070d', panels: [{ r: [.28, .08, .44, .72], at: 0, from: 'right', shot: { scene: 'locker', grade: 'night', cam: [[0, 0, -6, 1.26], [1, 0, -8, 1.32]], cast: [{ id: 'silk', kind: 'bust', x: 0, expr: 'fierce', rim: '#facc15' }] } }] },
      say: ['silk', 'And keep the ball away from that Halsey kid.'] },
    { d: 2800, scene: 'void', grade: 'blue', bars: 40, cam: [[0, 0, 8, 1.36], [1, 0, 12, 1.46]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'fierce', rim: '#93c5fd' }],
      title: { text: 'Kai hangs up.', style: 'line', at: 1100 }, ev: [[900, 'sfx', 'beep'], [900, 'flash', '#93c5fd', .2], [900, 'dim', .6, 400]] },
  ] },
  /* post-credits: Kai alone at the gate, watching your highlight; Silk's text */
  pc_kai_airport: { name: 'Gate 14', chapter: 'Interlude · after the credits', shots: [
    { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'Riga International · Gate 14 · 6:05 a.m.', style: 'line', at: 300 } },
    { d: 3400, scene: 'airport', music: 'kai', cam: [[0, -40, -4, 1.1], [1, 10, 0, 1.2, 'lin']], cast: [{ id: 'kai', kind: 'actor', x: .05, y: 64, s: 2.6, acts: [[0, 'sit', 99]] }],
      say: ['narrator', 'The team bus left an hour ago. Kai took a cab, alone.'] },
    { d: 3800, scene: 'airport', dim: .55, cam: [[0, 0, 24, 1.15], [1, 0, 26, 1.24]], cast: [{ id: 'kai', kind: 'hand', x: .02, y: 104, s: 3.2, curl: .55 }, { id: 'ph', kind: 'phone', x: 0, y: 70, s: 4 }],
      say: () => Game.state && Game.state.flags.usa_proam ? ['narrator', 'On his phone: your pro-am highlights. He watches them twice.'] : ['narrator', 'On his phone: your jelly over Bakari. On loop.'], ev: [[300, 'sfx', 'tick'], [1800, 'sfx', 'tick']] },
    { d: 3000, scene: 'void', grade: 'dark', cam: [[0, 0, 6, 1.32], [1, 0, 10, 1.42]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'determined', rim: '#93c5fd' }],
      say: ['silk', '(a text) Next time it\'s you or me.'], ev: [[200, 'sfx', 'beep'], [1500, 'glint', 'kai']] },
  ] },
});

/* =====================================================================
   THE INTERLUDE'S SCENES (built for your career): the roster board reveal, the bench montages,
   the final's opening, the gold-medal script, the podium and the pro-am road's TV
   ===================================================================== */
const USA4 = (() => {
  const S = () => Game.state, look = id => (typeof UI !== 'undefined' && UI.charLook ? UI.charLook(id) : null);
  const SP = (id, x, y, team, lk) => Object.assign({ id, kind: 'sprite', x, y }, team ? { team } : {}, lk ? { look: lk } : {});
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  const last = s => s.player.last.toUpperCase(), rotation = s => !!s.flags.usa_rotation;
  const surname = n => n.replace(/"[^"]*"\s*/, '').split(' ').slice(-1)[0].toUpperCase();
  const vs = (ctx, team) => { ctx.venue = 'wyhc_arena'; ctx.usAbbr = 'USA'; ctx.team = { colors: LOCAL_TEAMS.usa.colors }; if (team && LOCAL_TEAMS[team]) { ctx.them = { colors: LOCAL_TEAMS[team].colors }; ctx.themAbbr = LOCAL_TEAMS[team].abbr; } return ctx; };
  /* the twelve, best first (you always make it: on the bubble, you squeak in) */
  function twelve(s) { const L = USA.field(s), i = L.findIndex(x => x.me); if (i >= 12) L.splice(11, 0, L.splice(i, 1)[0]); return L.slice(0, 12); }

  /* the final cut: the sheet on the board, your finger down the names, your number */
  function roster(s) {
    const L = twelve(s), me = L.findIndex(x => x.me), rot = me < 8, w0 = Math.max(0, me - 6);   // seven names on the paper, yours among them
    const names = L.slice(w0, w0 + 7).map((x, i) => `${String(w0 + i + 1).padStart(2, ' ')}. ${x.me ? last(s) : surname(x.name)}`);
    CUTSCENES._usa_roster = { name: 'Twelve Names', chapter: 'Interlude', shots: [
      { d: 2800, scene: 'locker', grade: 'dark', music: null, tr: 'fade', cam: [[0, 0, 0, 1.1], [1, 0, 0, 1.2]], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'sad', rim: '#93c5fd' }],
        say: ['narrator', 'Final cut, 7 a.m. Reyes tapes one sheet to the board.'], ev: [[0, 'sfx', 'heartbeat'], [1400, 'sfx', 'heartbeat']] },
      { d: 3200, scene: 'gym', music: 'story', cam: [[0, -40, 10, 1.1], [1, 0, 6, 1.2]],
        cast: [{ id: 'milo', kind: 'actor', x: -.12, y: 70, s: 2.5, face: 1 }, { id: 'dre', kind: 'actor', x: .06, y: 72, s: 2.5, face: 1 }, { id: 'kai', kind: 'actor', x: .28, y: 70, s: 2.5, face: -1, acts: [[1600, 'flex', 99]] }, { id: 'you', kind: 'actor', y: 76, s: 2.6, path: [[0, -1.1], [1600, -.42]] }],
        say: ['narrator', 'Eighteen came. Twelve names on one sheet of paper.'] },
      { d: 5200, scene: 'cutlist', music: null, listTitle: 'USA · FINAL ROSTER', listNames: names, listMe: me - w0, cam: [[0, 0, -30, 1.3], [1, 0, 16, 1.3, 'io']],
        cast: [{ id: 'you', kind: 'hand', x: .44, y: 40, s: 2.4, curl: .15, yMove: [[400, 0], [3800, 22 + (me - w0) * 16]] }],
        ev: [[0, 'sfx', 'heartbeat'], [1100, 'sfx', 'heartbeat'], [2200, 'sfx', 'heartbeat'], [3300, 'sfx', 'heartbeat'], [4300, 'sfx', 'stinger']] },
      { d: 2600, scene: 'gym', grade: rot ? 'gold' : 'blue', cam: [[0, 0, 8, 1.3], [1, 0, 14, 1.5, 'snap']], speed: 'radial', music: 'clutch', cast: [{ id: 'you', kind: 'face', x: 0, expr: rot ? 'smile' : 'determined', rim: rot ? '#facc15' : '#93c5fd' }],
        title: { text: `#${me + 1} OF 12`, sub: rot ? 'In the rotation' : 'The end of the bench', style: 'slam', at: 300 }, ev: [[300, 'flash', '#ffffff', .5], [300, 'sfx', 'impact'], [300, 'shake', 5]] },
      { d: 3000, scene: 'gym', grade: 'blue', cam: [[0, 20, -2, 1.18], [1, 24, 2, 1.26]], cast: [{ id: 'reyes', kind: 'bust', x: .3, expr: 'neutral', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.7, y: 130, sil: true, rim: '#93c5fd', d: 1.2 }],
        say: rot ? ['reyes', 'You\'re in my eight. Don\'t make me regret it.'] : ['reyes', 'Twelfth man. Stay ready anyway, finals get weird.'] },
    ] };
    return '_usa_roster';
  }

  /* riding the bench: each knockout stage as a montage (Kai starring, towels, DNP) with one 30-second cameo */
  const BENCH = {
    group: { opp: 'can_u19', title: 'GROUP C · 3-0', sub: 'Australia · Lithuania · Canada', score: [74, 58], kai: 27, star: 'Kai drops 27 on Canada.',
      qte: { kind: 'timed', label: 'SHOOT', id: 'cameo', time: 6500 }, pts: 3, ok: 'Corner three. Your first points in the red, white and blue.', miss: 'Short. The buzzer beats you to the rebound.' },
    qf: { opp: 'arg_u19', title: 'QUARTERFINAL · W 68-61', sub: 'vs Argentina', score: [68, 61], kai: 22, star: 'Ferraro hits five threes. Kai answers every one.',
      qte: { kind: 'hold', label: 'BREATHE', id: 'cameo', hold: 1500, time: 6500 }, pts: 2, ok: 'Two free throws, both pure. Nobody but Scoop notices.', miss: 'One of two. Reyes doesn\'t look up.' },
    sf: { opp: 'srb_u19', title: 'SEMIFINAL · W 74-66', sub: 'vs Serbia', score: [74, 66], kai: 31, star: 'Thirty-one for Kai. Radenko fouls out trying to stop him.',
      qte: { kind: 'mash', label: 'HUSTLE', id: 'cameo', n: 10, time: 5500 }, pts: 0, ok: 'You dive on a loose ball. The whole bench loses it.', miss: 'Loose ball. Radenko gets there first.' },
  };
  function bench(s, ctx, stage) {
    const D = BENCH[stage], K = look('kai'), rot = rotation(s); vs(ctx, D.opp);
    const benchRow = [{ id: 'bench', kind: 'bench', x: -.05, y: 74, s: 2.8, w: 46, d: 1 }, { id: 'milo', kind: 'actor', x: -.36, y: 74, s: 2.8, acts: [[0, 'bench', 99]] }, { id: 'you', kind: 'actor', x: -.08, y: 74, s: 2.8, acts: [[0, 'bench', 99]] },
      { id: 'jet', kind: 'actor', x: .2, y: 74, s: 2.8, acts: [[0, 'bench', 99]] }, { id: 'tw1', kind: 'towel', x: -.32, y: 2, s: 2.2 }, { id: 'tw2', kind: 'towel', x: -.04, y: 2, s: 2.2, ph: 1.7, col: '#1e3a8a' }];
    const line = stage === 'group' ? (rot ? 'Reyes trusts you. She just doesn\'t need you yet.' : 'You\'re here to watch and learn.')
      : stage === 'qf' ? (rot ? 'Knockout rounds: Reyes shortens the bench to seven. You were eighth.' : 'Knockout rounds. Reyes shortens the bench to eight.')
      : 'One more win and it\'s the final. Your warmup jacket hasn\'t come off.';
    CUTSCENES['_wy_' + stage] = { name: D.title, chapter: 'Interlude', shots: [
      { d: 2400, scene: 'arena', grade: 'night', music: 'build', tr: 'fade', cam: [[0, -30, -8, 1.08], [1, 20, -4, 1.16]], title: { text: D.title, sub: D.sub, style: 'loc', at: 250 }, ev: [[0, 'cheer']] },
      { d: 4400, score: true, manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { court: 'wyhc_arena', cam: [[0, 0, 0, 1.3], [1, 0, -16, 1.4]], cast: [SP('kai', 236, 140, null, K), SP('d1', 214, 128, 1)],
          play(S2, tm) { S2.sp.d1.face = 1; S2.sp.d1.stance = true; CSK.jumper(S2, S2.sp.kai, tm, .15, { made: true, flight: 1 }); } }, sfx: ['SWISH', .72, .3, '#facc15', 4, 1100], snd: 'swish' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', shot: { scene: 'arena', grade: 'night', cam: [[0, 0, 14, 1.3], [1, 0, 12, 1.4]], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'neutral', rim: '#93c5fd' }] }, sfx: ['DNP', .3, .72, '#94a3b8', 5] },
        { r: [0, .55, 1, .45], at: 1800, from: 'bottom', tone: true, shot: { scene: 'arena', grade: 'night', cam: [[0, 0, 26, 1.25], [1, 0, 24, 1.3]], cast: benchRow }, sfx: ['WAVE!', .72, .3, '#f8fafc', 4], snd: 'cheer' },
      ] }, say: ['narrator', D.star] },
      { d: 3000, scene: 'arena', grade: 'night', cam: [[0, 0, 22, 1.2], [1, 0, 20, 1.28]], cast: benchRow, say: ['narrator', line] },
      { d: 4200, court: 'wyhc_arena', score: true, scoreText: `${D.score[0] - D.pts}-${D.score[1]}`, clockText: '0:31', grade: 'dark', music: 'clutch', cam: [[0, 16, 30, 1.9], [1, 10, 16, 2.1]], cast: [SP('you', 232, 132), SP('d2', 214, 122, 1)],
        say: ['narrator', 'Garbage time. Reyes points down the bench at you.'], ev: [[600, 'qte', D.qte]],
        play(S2) { const p = S2.sp.you, d = S2.sp.d2; S2.ball.holder = p; p.face = -1; d.face = 1; d.stance = true; } },
      { d: 2800, court: 'wyhc_arena', score: true, scoreText: `${D.score[0]}-${D.score[1]}`, clockText: '0:00', grade: 'dark', cam: [[0, 16, 24, 1.9], [1, 12, 20, 2.0]], cast: [SP('you', 228, 134), SP('d2', 214, 122, 1)],
        say: (c, q) => ['narrator', q.cameo ? D.ok : D.miss], ev: [[300, 'sfx', 'buzzer']], play(S2, tm) { CSK.cel(S2.sp.you, 'clap', tm); } },
      { d: 2600, scene: 'void', cam: [[0, 0, 0, 1.1], [1, 0, 0, 1.15]], say: (c, q) => ['narrator', `Box score: Sterling ${D.kai}. ${s.player.last}, one minute, ${q.cameo ? D.pts : 0} points.`] },
    ] };
    return '_wy_' + stage;
  }

  /* the final: three quarters from the bench, then Kai's ankle (the mirror of yours) or the guards foul out, then "You. Now." */
  function finalOpen(s, ctx) {
    const K = look('kai'), M = look('mbaye'), mirror = !!s.flags.bad_ankle; vs(ctx, 'fra_u19');
    const kaiDown = mirror ? [
      { d: 3400, scene: 'arena', grade: 'gold', slow: [[0, 2400, .35]], music: null, cam: [[0, 10, 20, 1.5], [1, 10, 26, 1.75, 'io']],
        cast: [{ id: 'bakari', kind: 'actor', x: .18, y: 70, s: 3, face: -1, acts: [[0, 'block', 99]], zs: [[0, 0], [500, 9], [900, 0]] }, { id: 'kai', kind: 'actor', x: .02, y: 72, s: 3, acts: [[0, 'layup', 1.2], [1500, 'down', 99]], zs: [[0, 0], [600, 14], [1400, 4], [1500, 0]] }],
        ev: [[1500, 'sfx', 'crack'], [1500, 'impact', 200, ['#000000', '#ef4444']], [1500, 'shake', 10], [1550, 'drain', 1, 300], [1600, 'sfx', 'ring']] },
      { d: 2200, scene: 'void', music: null, title: { text: 'He hears it before he feels it.', style: 'line', at: 200 } },
      { d: 3000, scene: 'arena', grade: 'blue', drain: .5, cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.4]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'crying', rim: '#93c5fd' }],
        say: ['narrator', 'Same ankle, same sound. You know exactly what he\'s feeling.'] },
    ] : [
      { d: 3000, court: 'wyhc_arena', score: true, scoreText: '55-61', clockText: '5:02', cam: [[0, 0, 10, 1.6], [1, 0, 6, 1.7]], cast: [SP('m1', 200, 140), SP('d1', 220, 130, 1)],
        say: ['narrator', 'Dre fouls out with five minutes left. Jet follows him two trips later.'], ev: [[300, 'sfx', 'whistle'], [1800, 'sfx', 'whistle']],
        play(S2) { S2.sp.m1.act = { type: 'hang', t: 0, T: 99 }; } },
      { d: 3000, scene: 'arena', grade: 'blue', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.4]], cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'sad', rim: '#93c5fd', sweat: true }],
        say: ['narrator', 'Kai is out of legs. Mbaye can smell it.'] },
    ];
    CUTSCENES._wy_final_open = { name: 'The Final', chapter: 'Interlude', shots: [
      { d: 2400, scene: 'arena', grade: 'night', music: 'build', tr: 'fade', cam: [[0, -30, -8, 1.08], [1, 20, -4, 1.18]], title: { text: 'THE FINAL', sub: 'USA vs France · Riga Youth Arena', style: 'loc', at: 250 }, ev: [[0, 'cheer'], [300, 'sfx', 'roar']] },
      { d: 3400, court: 'wyhc_arena', score: true, scoreText: '44-52', clockText: '6:40', cam: [[0, 16, 34, 2.0], [1, 10, 12, 2.2]], cast: [SP('mbaye', 200, 150, 1, M), SP('kai', 222, 126, null, K)],
        say: ['narrator', 'Mbaye has twenty-four. France by eight.'], play(S2, tm) { const k = S2.sp.kai; k.face = 1; k.stance = true; CSK.jumper(S2, S2.sp.mbaye, tm, .3, { made: true, flight: 1.1, arc: 40 }); } },
      { d: 3000, scene: 'arena', grade: 'night', cam: [[0, 0, 22, 1.2], [1, 0, 20, 1.28]], cast: [{ id: 'bench', kind: 'bench', x: 0, y: 74, s: 2.8, w: 30, d: 1 }, { id: 'you', kind: 'actor', x: 0, y: 74, s: 2.8, acts: [[0, 'bench', 99]] }],
        say: ['narrator', 'Three quarters on the bench. Your legs are cold, your hands aren\'t.'] },
      ...kaiDown,
      { d: 3000, scene: 'arena', grade: 'spot', music: null, cam: [[0, 20, -4, 1.2], [1, 24, -8, 1.4, 'snap']], cast: [{ id: 'reyes', kind: 'bust', x: .3, expr: 'fierce', rim: '#fde68a' }, { id: 'you', kind: 'bust', x: -.66, y: 136, sil: true, rim: '#fdba74', d: 1.2 }],
        say: ['reyes', 'You. Now.'], ev: [[0, 'sfx', 'heartbeat'], [1200, 'impact', 120], [1200, 'shake', 5]] },
      { d: 2800, scene: 'void', grade: 'red', bars: 58, music: 'clutch', cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.45]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#facc15' }],
        say: ['sal', '(from the end of the bench) Seven-footer. Around him, not through him.'], ev: [[0, 'sfx', 'heartbeat'], [900, 'glint', 'you']] },
    ] };
    return '_wy_final_open';
  }

  /* the awakening in the final: your weapon to tier III, or (already there / no weapon) the jelly levels up. Once. */
  function awaken(s) {
    if (s.usaAwaken) return s.usaAwaken;
    let A = null; const W = Engine.weapons(s)[0];
    if (W && (W.evo || 1) < 3) { const e = Story.evolve(s, { tier: 3 }); delete s.pendingAwaken; if (e) { let after = 50; try { after = Engine.weaponPct(s, e.id).pct; } catch (er) { } A = { kind: 'weapon', title: `${e.base} ${ROMAN[e.to]}`, sub: e.suffix, row: ['SUCCESS %', Math.max(5, after - e.bonus), after, after + '%'], note: `Weapon evolved · Tier ${ROMAN[e.to]}`, toast: `⚔ Weapon evolved: <b>${e.name}</b> (+${e.bonus}% success)` }; } }
    if (!A && typeof Features !== 'undefined' && Features.jellyOn(s)) {
      const J = (s.features || (s.features = {})).jelly || (s.features.jelly = {}), JL = BALANCE.jelly.levels, from = Features.jellyLevel(s);
      if (from < JL.length - 1) { J.lvl = from + 1; const L = JL[J.lvl]; A = { kind: 'jelly', title: L.name.toUpperCase(), sub: 'The jelly evolved', row: ['JELLY BONUS', JL[from].bonus, L.bonus, '+' + L.bonus + '%'], note: 'Jelly evolved', toast: `🍯 Jelly evolved: <b>${L.name}</b> (+${L.bonus}%)` }; }
    }
    s.usaAwaken = A || { kind: 'none' }; return s.usaAwaken;
  }
  const awakenShots = A => A && A.kind !== 'none' ? [
    { d: 3400, scene: 'title', music: 'clutch', cam: [[0, 0, 10, 1.3], [1, 0, 0, 1.1, 'out']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'fierce', rim: '#facc15' }],
      ev: [[200, 'shake', 3], [500, 'sfx', 'crack'], [800, 'shatter'], [850, 'aura', 'you'], [850, 'flash', '#fde68a', .8], [850, 'sfx', 'sig'], [900, 'speed', 'radial'], [1050, 'title', A.title, A.sub, 'slam'], [1050, 'impact', 150]] },
    { d: 2800, scene: 'title', cam: [[0, 0, 0, 1.1], [1, 0, -4, 1.16]], cast: [{ id: 'you', kind: 'bust', x: -.42, expr: 'determined', rim: '#facc15' }],
      ev: [[0, 'aura', 'you'], [200, 'stats', [A.row], A.note]], title: { text: 'AWAKENING', sub: 'In a World Youth final', style: 'rise', at: 100 } },
  ] : [];

  /* GOLD (the fixed high): your jelly replayed, the awakening, the run, the horn, the dogpile */
  function goldShots(o) {
    const s = S(), K = look('kai'), rot = rotation(s), c = o.counters || {}, jelly = !!(c.jellyPayoff || c.jellies), A = awaken(s);
    const base = Math.max(o.score[0], o.score[1]), fin = [base + 3 + (jelly ? 2 : 0) + (rot ? 1 : 0), base]; o.fin = fin;
    const part = (rot ? 1 : 0) + (jelly ? 1 : 0) + ((o.box && o.box.pts) >= 6 ? 1 : 0);
    s.flags[part >= 2 ? 'usa_part_big' : 'usa_part_small'] = true; if (jelly) s.flags.usa_jelly_final = true;
    let replay = [];
    if (jelly && Cutscene.playShots) { try { replay = Cutscene.playShots({ side: 'us', kind: 'jelly', by: { name: `${s.player.first} ${s.player.last}`, short: s.player.last, look: Engine.look(s), num: s.player.num, isUser: true },
      def: { name: 'Yanis Bakari', short: 'Bakari', look: look('bakari'), num: 15 }, px: PIX.hoop.x + 44, py: PIX.hoop.y + 40, clock: 190, pts: 2 }, o.ctx, { replay: true }).slice(0, 2); } catch (e) { console.warn('jelly replay', e); replay = []; } }
    return [
      ...(replay.length ? [{ d: 1800, scene: 'void', music: null, title: { text: 'THE JELLY', sub: 'Over Yanis Bakari, seven feet tall', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger']] }, ...replay] : []),
      ...awakenShots(A),
      { d: 4600, score: true, music: 'clutch', manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { scene: 'arena', cast: [{ id: 'dre', kind: 'face', x: 0, expr: 'fierce', rim: '#facc15' }], cam: [[0, 0, 22, 1.5], [1, 0, 22, 1.6]] }, sfx: ['STEAL!', .72, .25, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 900, from: 'right', tone: true, shot: { court: 'wyhc_arena', cast: [SP('you', 232, 150)], cam: [[0, 0, 0, 1.3], [1, 0, -20, 1.4]], play(S2, tm) { CSK.jumper(S2, S2.sp.you, tm, .1, { made: true, flight: .9 }); } }, sfx: ['SPLASH', .3, .3, '#7dd3fc', 4, 900] },
        { r: [0, .55, 1, .45], at: 1900, from: 'bottom', shot: { scene: 'arena', cast: [{ id: 'kai', kind: 'bust', x: .4, expr: 'smile', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.45, expr: 'fierce', rim: '#fde68a' }], cam: [[0, 0, 20, 1.3], [1, 0, 16, 1.4]] }, sfx: [s.flags.bad_ankle ? 'KAI\'S UP!' : 'AND ONE!', .72, .35, '#facc15', 5], snd: 'impact' },
      ] }, say: ['narrator', s.flags.bad_ankle ? 'Kai is standing on the bench on one leg, screaming.' : 'The bench is on its feet. Kai is screaming your name.'],
        ev: [[400, 'bug', `${fin[0] - 6}-${fin[1]}`], [1300, 'bug', `${fin[0] - 3}-${fin[1]}`], [2300, 'bug', `${fin[0] - 1}-${fin[1]}`], [2300, 'cheer'], [2400, 'sfx', 'roar']] },
      { d: 3400, court: 'wyhc_arena', score: true, scoreText: `${fin[0]}-${fin[1]}`, clockText: '0:03', cam: [[0, 8, 24, 2.2], [1, 4, -4, 2.3, 'io']], slow: [[300, 2600, .4]], cast: [SP('mbaye', 196, 140, 1, look('mbaye')), SP('you', 206, 126)],
        ev: [[0, 'riser', 3], [2300, 'sfx', 'buzzer'], [2400, 'cheer'], [2400, 'impact', 160]],
        play(S2, tm) { const y = S2.sp.you; y.face = 1; y.act = { type: 'block', t: .1 }; y.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .35) / .6)) * Math.PI) * 10); CSK.jumper(S2, S2.sp.mbaye, tm, .2, { made: false, flight: 1.25, jump: 17, arc: 40 }); } },
      { d: 3800, court: 'wyhc_arena', score: true, scoreText: `${fin[0]}-${fin[1]}`, grade: 'gold', music: 'victory', cam: [[0, 0, 20, 1.6], [1, 0, 14, 1.4]], fgCrowd: ['#1e3a8a', '#dc2626', '#f8fafc'], fgHop: true,
        cast: [SP('you', 192, 140), SP('m1', 150, 160), SP('m2', 236, 164), SP('kai', 214, 150, null, K)], title: { text: 'WORLD CHAMPIONS', sub: `USA ${fin[0]} · France ${fin[1]}`, style: 'slam', at: 500 },
        ev: [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', 180], [500, 'sfx', 'impact']],
        play(S2, tm) { CSK.cel(S2.sp.you, tm < 1.5 ? 'flex' : 'joy', tm); CSK.cel(S2.sp.m1, 'joy', tm); CSK.cel(S2.sp.m2, 'joy', tm + .3); CSK.cel(S2.sp.kai, 'joy', tm + .5); S2.ball.holder = null; S2.ball.z = 0; S2.ball.x = 180; S2.ball.y = 190; } },
    ];
  }
  const scripts = {
    wy_gold: { moments: 2, at: 0, async run(o) {
      const shots = goldShots(o); CUTSCENES._wy_gold = { name: 'Gold', chapter: 'Interlude', shots };
      await Story.cut('_wy_gold', o.ctx, { seenId: 'wy_gold' });
      const A = S().usaAwaken; if (A && A.toast && typeof UI !== 'undefined') UI.toast(A.toast, 'ach', 5000);
      return o.fin; } },
  };

  /* the podium: the medal, the anthem, the jersey */
  function podium(s, ctx) {
    vs(ctx);
    CUTSCENES._wy_podium = { name: 'The Podium', chapter: 'Interlude', shots: [
      { d: 3200, scene: 'arena', grade: 'gold', music: 'victory', tr: 'fade', cam: [[0, 0, -6, 1.15], [1, 0, -2, 1.28, 'io']],
        cast: [{ id: 'kai', kind: 'bust', x: -.55, y: 128, expr: 'smile', rim: '#fde68a' }, { id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fde68a' }, { id: 'dre', kind: 'bust', x: .55, y: 128, expr: 'smile', rim: '#fde68a' }],
        title: { text: 'THE PODIUM', sub: 'World Youth Championship · Riga', style: 'loc', at: 300 }, ev: [[0, 'confetti', 120], [0, 'cheer']] },
      { d: 3000, scene: 'arena', grade: 'gold', cam: [[0, 0, 10, 1.3], [1, 0, 6, 1.42]], cast: [{ id: 'medal', kind: 'medal', x: 0, y: 64, s: 5 }],
        say: ['narrator', 'The medal is heavier than it looks.'], ev: [[200, 'sfx', 'bell']] },
      { d: 3400, scene: 'arena', grade: 'spot', music: null, cam: [[0, 0, -10, 1.2], [1, 0, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'bust', x: -.35, expr: 'determined', rim: '#93c5fd' }, { id: 'kai', kind: 'bust', x: .4, expr: 'neutral', rim: '#fca5a5', d: 1.1 }],
        title: { text: 'THE ANTHEM', sub: 'Hand on heart · gold around your neck', style: 'rise', at: 400 }, ev: [[300, 'sfx', 'riser', 2]] },
      { d: 3000, scene: 'locker', grade: 'gold', cam: [[0, 0, 4, 1.12], [1, 0, 0, 1.2]], cast: [{ id: 'jersey', kind: 'jersey', x: .1, y: 60, s: 3, num: String(s.player.num), col: '#1e3a8a', trim: '#dc2626', d: 1 }],
        say: ['narrator', 'Your jersey goes in a frame. Mom already picked the wall.'] },
    ] };
    return '_wy_podium';
  }

  /* the pro-am road: Riga on a laptop on the couch */
  function kaiTv(s, ctx) {
    const K = look('kai'); vs(ctx, 'fra_u19');
    CUTSCENES._usa_kai_tv = { name: 'On TV', chapter: 'Interlude', shots: [
      { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'Your couch · 2:40 p.m.', style: 'line', at: 300 } },
      { d: 3800, scene: 'void', manga: { bg: '#020617', panels: [{ r: [.1, .1, .8, .62], at: 0, from: 'top', shot: { court: 'wyhc_arena', score: true, scoreText: '78-71', grade: 'gold', cam: [[0, 0, 20, 1.5], [1, 0, 14, 1.4]],
        cast: [SP('kai', 192, 140, null, K), SP('m1', 150, 160), SP('m2', 236, 164)], play(S2, tm) { CSK.cel(S2.sp.kai, 'flex', tm); CSK.cel(S2.sp.m1, 'joy', tm); CSK.cel(S2.sp.m2, 'joy', tm + .3); } } }] },
        say: ['narrator', 'USA wins gold in Riga. Kai Sterling, tournament MVP.'], ev: [[0, 'cheer'], [300, 'sfx', 'roar']] },
      { d: 3000, scene: 'void', grade: 'blue', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.4]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#93c5fd' }], ev: [[400, 'flicker', 600]],
        say: ['narrator', 'You don\'t change the channel.'] },
    ] };
    return '_usa_kai_tv';
  }
  /* camp: Dre's give-and-go (the Chemistry Links scene) and Big Ike sending your layups into the bleachers */
  function giveGo(s, ctx) {
    const DR = look('dre'); ctx.venue = 'usa_center'; ctx.team = { colors: LOCAL_TEAMS.usa_red.colors }; ctx.them = { colors: LOCAL_TEAMS.usa_white.colors };
    CUTSCENES._usa_givego = { name: 'Give & Go', chapter: 'Interlude', shots: [
      { d: 4600, manga: { panels: [
        { r: [0, 0, .5, .55], at: 0, from: 'left', lines: true, shot: { court: 'usa_center', cam: [[0, 10, 10, 1.6], [1, 10, 6, 1.7]], cast: [SP('dre', 180, 160, null, DR), SP('you', 236, 140)],
          play(S2, tm) { S2.ball.holder = tm < .7 ? S2.sp.dre : S2.sp.you; S2.sp.you.face = -1; } }, sfx: ['GIVE', .3, .3, '#facc15', 4], snd: 'whoosh' },
        { r: [.5, 0, .5, .55], at: 1000, from: 'right', lines: true, shot: { court: 'usa_center', cam: [[0, 10, 10, 1.6], [1, 10, 6, 1.7]], cast: [SP('dre', 180, 160, null, DR), SP('you', 236, 140)],
          play(S2, tm) { S2.ball.holder = tm < .3 ? S2.sp.you : S2.sp.dre; CSK.run(S2.sp.you, tm, .3, 1.2, 236, 140, 206, 118); } }, sfx: ['CUT', .7, .3, '#7dd3fc', 4], snd: 'squeak' },
        { r: [0, .55, 1, .45], at: 2000, from: 'bottom', shot: { court: 'usa_center', cam: [[0, 0, 0, 1.4], [1, 0, -16, 1.5]], cast: [SP('you', 206, 124)],
          play(S2, tm) { CSK.jumper(S2, S2.sp.you, tm, .1, { made: true, flight: .7, jump: 12, arc: 12 }); } }, sfx: ['GO!', .72, .4, '#facc15', 5, 900] },
      ] }, title: { text: 'GIVE & GO', sub: 'Dre Castillo to {name}', style: 'rise', at: 3200 } },
    ] };
    return '_usa_givego';
  }
  function ikeBlocks(s, ctx) {
    const IK = look('ike'); ctx.venue = 'usa_center'; ctx.team = { colors: LOCAL_TEAMS.usa_red.colors }; ctx.them = { colors: LOCAL_TEAMS.usa_white.colors };
    const block = (tm, ike, you) => { ike.face = 1; ike.act = { type: 'block', t: .1 }; ike.z = Math.max(0, Math.sin(Math.min(1, Math.max(0, (tm - .3) / .6)) * Math.PI) * 14); CSK.jumper(you._S, you, tm, .15, { made: false, flight: 1, jump: 12, arc: 10 }); };
    CUTSCENES._usa_ike = { name: 'Big Ike', chapter: 'Interlude', shots: [
      { d: 3200, court: 'usa_center', slow: [[400, 2200, .4]], cam: [[0, 10, 20, 2.0], [1, 6, 10, 2.2, 'io']], cast: [SP('you', 214, 128), SP('ike', 196, 116, 1, IK)],
        ev: [[1200, 'sfx', 'impact'], [1200, 'impact', 140], [1200, 'shake', 6]], title: { text: 'GET THAT OUTTA HERE', style: 'slam', at: 1300 },
        play(S2, tm) { S2.sp.you._S = S2; block(tm, S2.sp.ike, S2.sp.you); } },
      { d: 2600, scene: 'gym', cam: [[0, 0, 8, 1.3], [1, 0, 12, 1.42]], cast: [{ id: 'ike', kind: 'bust', x: .3, expr: 'fierce', rim: '#94a3b8' }, { id: 'you', kind: 'bust', x: -.66, y: 136, sil: true, rim: '#93c5fd', d: 1.2 }],
        title: { text: 'Two trips later: again.', style: 'line', at: 900 }, ev: [[900, 'sfx', 'impact']] },
    ] };
    return '_usa_ike';
  }
  return { roster, bench, finalOpen, awaken, scripts, podium, kaiTv, giveGo, ikeBlocks };
})();
if (typeof JAM_SCRIPTS !== 'undefined') Object.assign(JAM_SCRIPTS, USA4.scripts);

/* =====================================================================
   THE STORY (two arcs, see js/data-arcs.js): THE SELECTION CAMP ARC (make the twelve) → THE WORLD YOUTH ARC (get on the floor)
   ===================================================================== */
const BENCH_NODE = (stage, next, o = {}) => Object.assign({ scene: 'arena', csTeam: 'usa', cutscene: (s, ctx) => USA4.bench(s, ctx, stage), seenId: 'wy_' + stage, next }, o);
STORY.chapters.usa = {
  title: 'Interlude', name: 'Red, White & Hoops', stage: 'National Team', start: 'invite_check', cta: 'the National Team',
  blurb: 'The summer after high school: the selection camp, the twelfth man, a bench in Riga and one moment in the final.',
  nodes: {
    /* ======================= ARC 1: THE SELECTION CAMP ARC ======================= */
    /* the invite: top 100 on the national list (older saves without the rankings: the old invite score) */
    invite_check: { type: 'branch', branches: [{ if: { rank: 100 }, next: 'invite' }, { if: { notFlag: 'feat_rankings', usaInvite: true }, next: 'invite' }], else: 'no_invite' },
    invite: { scene: 'home', fx: { flag: 'usa_camp', log: 'Invited to the national team camp.' },
      lines: [
        ['narrator', 'A thick envelope. Navy blue, with stars on the seal.'],
        ['mom', 'Baby, it says "United States of America." On the envelope.', 'smile'],
        ['nia', 'Top 100 in the country gets a letter. You\'re #{rank}.', 'smile', { flag: 'feat_rankings' }],
        ['nia', 'Eighteen players, twelve spots. Kai\'s on the list too, obviously.', 'smile'],
      ], next: 'invite_home' },
    invite_home: { scene: 'home',
      lines: [
        ['lou', '(on the phone) I played against kids who wore that jersey. They never forgot it.'],
        ['lou', 'Go take one of those twelve. Don\'t wait to be handed it.', 'fierce'],
      ], next: 'arrive' },
    no_invite: { scene: 'home',
      lines: [
        ['narrator', 'The camp list drops at noon, top 100 only. You scroll it twice.'],
        ['nia', 'There\'s an open tryout Saturday, though. One late invite.', 'sad'],
        ['dee', '(text) Go. Coaches love a kid who walks in uninvited and takes the gym.'],
      ],
      choices: [
        { t: 'Go to the open tryout.', fx: { morale: 2 }, next: 'tryout_pre' },
        { t: 'Skip it. Play the summer pro-am against grown men.', fx: { flag: 'usa_skipped' }, next: 'proam_pre' },
      ] },
    tryout_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Ninety kids, one gym, one assistant coach with a clipboard and no expression.'],
        ['moreno', 'Three-on-three to fifteen, winners stay. Impress me.'],
      ], next: 'tryout_game' },
    tryout_game: { type: 'match', us: 'halsey', them: 'usa_open', pickup: { size: 3, target: 15 }, ratingRel: 1, mateRel: -3, moments: 7, level: 'street', venue: 'usa_center',
      title: 'Open Tryout', sub: 'One late invite', win: 'late_invite', lose: 'tryout_last' },
    tryout_last: { scene: 'gym',
      lines: [['moreno', 'You lost, but I saw something. Last rep: show me why I should care.']],
      choices: [
        { t: 'Lock up their best scorer, full court.', check: { a: ['perD', 'speed'], dc: 52 }, next: 'late_invite', fail: 'not_this_year' },
        { t: 'Call for the ball and go get a bucket.', check: { a: ['finish', 'handle'], dc: 52 }, next: 'late_invite', fail: 'not_this_year' },
      ] },
    late_invite: { scene: 'gym', fx: { flag: 'usa_camp', rep: 2, log: 'Earned a late invite to the national team camp.' },
      lines: [
        ['moreno', 'Pack a bag, camp starts Monday. You\'re the eighteenth name.'],
        ['narrator', 'The last guy in, so nobody expects anything. Good.'],
      ], next: 'arrive' },
    /* the alternate road: no camp, a summer pro-am against grown men, Kai's gold on your TV */
    not_this_year: { scene: 'street_night', fx: { flag: 'usa_missed', morale: -3, log: 'Missed the national team camp.' },
      lines: [
        ['moreno', 'Not this year. Get stronger, we keep a list.'],
        ['narrator', 'Halsey Street, after dark. You shoot until the lights go out.'],
      ], next: 'proam_pre' },
    proam_pre: { scene: 'gym',
      lines: [
        ['dee', 'The Kingdom Pro-Am runs all summer. Overseas pros, ex-college stars, guys with mortgages.'],
        ['dee', 'Nobody in that gym cares about your ranking. Good.', 'smile'],
        ['narrator', 'The guy guarding you is thirty-one and played six years in Spain.'],
      ], next: 'proam_game' },
    proam_game: { type: 'match', us: 'proam_crew', them: 'proam_vets', ratingRel: 3, mateRel: 0, moments: 8, level: 'hs', importance: 2, venue: 'kingdom_proam',
      title: 'Kingdom Pro-Am', sub: 'Against grown men', win: 'proam_win', lose: 'proam_loss' },
    proam_win: { scene: 'gym', fx: { rankBump: 22, rankWhy: 'Kingdom Pro-Am', rep: 3, xp: 140, attrs: { str: 1 }, flag: 'proam_win', log: 'Beat the grown men at the Kingdom Pro-Am.' },
      lines: [
        ['narrator', 'Reggie Walsh, the guy from Spain, finds you after. He doesn\'t smile.'],
        ['narrator', '"Two more summers and they\'ll pay you for that." Then he leaves.'],
      ], next: 'kai_tv' },
    proam_loss: { scene: 'gym', fx: { rankBump: 12, rankWhy: 'Kingdom Pro-Am', xp: 100, attrs: { str: 1 }, log: 'Lost to the grown men at the Kingdom Pro-Am. Learned plenty.' },
      lines: [
        ['narrator', 'Grown men hit harder. They also don\'t care how you feel about it.'],
        ['dee', 'You held your own. In two years they\'ll be scared of you.'],
      ], next: 'kai_tv' },
    kai_tv: { scene: 'home', cutscene: (s, ctx) => USA4.kaiTv(s, ctx), seenId: 'usa_kai_tv', fx: { flag: 'usa_proam' },
      lines: [['mom', 'That boy. Every time I turn on the TV, that boy.', 'sad']],
      choices: [
        { t: 'Watch every second of it.', fx: { flag: 'usa_motivated', attrs: { iq: 1 }, morale: -1 }, next: 'return_home' },
        { t: 'Close the laptop. Go shoot.', fx: { attrs: { three: 1 }, morale: 2 }, next: 'return_home' },
      ] },

    /* ---------------- selection camp ---------------- */
    arrive: { scene: 'gym', cutscene: 'usa_arrival', fx: { campStart: true },
      lines: [['narrator', 'Selection camp, day one. Your name tag is already on a locker, for now.']], next: 'meet_staff' },
    meet_staff: { scene: 'gym',
      lines: [
        ['reyes', 'A board on the wall: your name and a number. It changes every night.'],
        ['moreno', 'We film everything. Every closeout, every sulk on the bench.'],
      ],
      choices: [
        { t: '"Good. I want to be coached hard."', fx: { rel: { reyes: 4 }, camp: 1 }, next: 'meet_campers' },
        { t: '"Just tell me where to go to win."', fx: { rel: { reyes: 2 } }, next: 'meet_campers' },
        { t: '"I\'ll make it easy. I\'m on the team."', fx: { rel: { reyes: -3 }, camp: -1 }, next: 'meet_campers' },
      ] },
    meet_campers: { scene: 'locker',
      lines: [
        ['jet', 'Jalen "Jet" Brooks, Atlanta. Fastest guy here, ask anybody.', 'smile'],
        ['ike', 'Isaiah Grant, Big Ike. Anything near the rim is mine.', 'fierce'],
        ['milo', 'Milo Park, your roommate. I snore, but I hit 47% from three.', 'smile'],
        ['dre', 'Dre Castillo, I run the point. You get open, I find you.'],
      ], next: 'kai_camp' },
    kai_camp: { scene: 'locker',
      lines: [
        ['kai', 'Look who made the list. Did they mail yours to the wrong house first?', 'smile'],
        ['kai', 'Twelve spots, {first}. Don\'t take it personally when I get the first one.', 'fierce'],
      ],
      choices: [
        { t: '"Save me a seat next to you."', fx: { rel: { kai: -2 }, morale: 2 }, next: 'board_intro' },
        { t: '"Or we both make it and win something."', fx: { rel: { kai: 4 }, chem: 3 }, next: 'board_intro' },
      ] },
    board_intro: { type: 'board', mode: 'status', title: 'THE BOARD · DAY 1', note: 'Where the staff has you before a single drill.', next: 'day1_drills' },
    day1_drills: { type: 'drill', title: 'DAY 1 · SKILLS TESTING', drills: ['shotMeter', 'dribbleCombo', 'freeThrow'], next: 'day1_dorm' },
    day1_dorm: { scene: 'dorm',
      lines: [
        ['milo', 'Lights out in ten. Day two is the scrimmage, and they say it decides half the board.'],
        ['milo', 'Real question: what are you doing if you\'re the twelfth guy?'],
      ],
      choices: [
        { t: '"Being the loudest twelfth guy they\'ve ever had."', fx: { rel: { milo: 4 }, chem: 3 }, next: 'day1_film' },
        { t: '"Getting better. Same as always."', fx: { rel: { milo: 3 }, morale: 2 }, next: 'day1_film' },
        { t: '"Not your problem, roomie."', fx: { rel: { milo: -4 } }, next: 'day1_film' },
      ] },
    day1_film: { type: 'talk', scene: 'locker', who: 'reyes', look: 'reyes', script: 'usa_film', title: 'FILM ROOM · COACH REYES',
      winFx: { camp: 4, rel: { reyes: 4 } }, loseFx: { camp: -3, rel: { reyes: -2 } }, next: 'day1_board' },
    day1_board: { type: 'board', mode: 'status', title: 'THE BOARD · AFTER DAY 1', next: 'day2_scrim_pre' },
    day2_scrim_pre: { scene: 'gym',
      lines: [
        ['reyes', 'Red versus White, full court, refs, clock. Kai, Jet, Ike: White.'],
        ['dre', '(to you) They\'re stacked. We share it, we win it.'],
      ], next: 'day2_scrim' },
    day2_scrim: { type: 'match', us: 'usa_red', them: 'usa_white', ratingRel: 3, mateRel: 1, moments: 9, level: 'hs', importance: 2, venue: 'usa_center', camp: true, coach: 'reyes',
      title: 'Camp Scrimmage', sub: 'Red vs White', win: 'day2_scrim_win', lose: 'day2_scrim_loss' },
    day2_scrim_win: { scene: 'gym', fx: { camp: 2 }, lines: [['reyes', 'Red wins. Somebody on White just lost a few spots on that board.'], ['kai', '(walking past) Enjoy it.', 'fierce']], next: 'cut1_pre' },
    day2_scrim_loss: { scene: 'gym', lines: [['reyes', 'White wins, but a loss isn\'t a cut. What you did in it is what we graded.'], ['jet', 'Good run though. You made me work.', 'smile']], next: 'cut1_pre' },
    cut1_pre: { scene: 'dorm',
      lines: [
        ['narrator', 'Your phone buzzes at midnight. Mom.'],
        ['mom', 'Whatever that list says tomorrow, you\'re still my baby. Now go to sleep.', 'smile'],
      ], next: 'cut1' },
    cut1: { type: 'board', mode: 'cut', keep: 14, safe: true, cutscene: 'usa_cutday', title: 'FIRST CUT · 14 STAY', made: 'cut1_safe', cut: 'cut_home' },
    cut1_safe: { scene: 'locker', fx: { morale: 4, log: 'Survived the first cut.' },
      lines: [
        ['narrator', 'Your name\'s still on the door. Ty Morales is packing his bag two lockers down.'],
        ['milo', 'Hey, we\'re still here. Don\'t look at the board, look at the next drill.'],
      ], next: 'day3_drills' },
    day3_drills: { type: 'drill', title: 'DAY 3 · GAME SKILLS', drills: ['drive', 'passLane', 'defenseReact'], next: 'day3_dorm' },
    day3_dorm: { scene: 'dorm',
      lines: [
        ['narrator', 'Rec room, 10 p.m. Kai and Malik are nose to nose over a ping-pong table.'],
        ['okafor', 'Say it again, Sterling. Say "big men can\'t shoot" again.', 'fierce'],
        ['kai', 'Big men can\'t— (Jet steps between them)', 'smile'],
      ],
      choices: [
        { t: 'Break it up. "Save it for France."', fx: { chem: 5, rel: { okafor: 4, kai: 2, reyes: 2 }, camp: 2 }, next: 'day3_3v3_pre' },
        { t: 'Grab a paddle: "Winner plays me."', check: { a: 'iq', dc: 50 }, fx: { chem: 6, rel: { kai: 4, okafor: 3 } }, next: 'day3_3v3_pre', fail: 'day3_dorm_bad', failFx: { chem: -2 } },
        { t: 'Stay out of it. Sleep.', fx: { fatigue: -10 }, next: 'day3_3v3_pre' },
      ] },
    day3_dorm_bad: { scene: 'dorm', fx: { camp: -1 },
      lines: [['narrator', 'You lose 21–4 to Malik. Somehow the fight is now about you.'], ['moreno', '(at the door) Lights out. All of you.']], next: 'day3_3v3_pre' },
    day3_3v3_pre: { scene: 'gym',
      lines: [['reyes', 'King of the Court, three-on-three, first to fifteen. Your crew against Kai\'s.'], ['kai', 'I\'ve been waiting all camp for this one.', 'fierce']], next: 'day3_3v3' },
    day3_3v3: { type: 'match', us: 'usa_red', them: 'usa_kai3', pickup: { size: 3, target: 15 }, ratingRel: 4, mateRel: 1, moments: 7, level: 'street', importance: 2, venue: 'usa_center', camp: true,
      title: 'King of the Court', sub: 'Your crew vs Kai\'s', win: 'day3_3v3_win', lose: 'day3_3v3_loss' },
    day3_3v3_win: { scene: 'gym', fx: { camp: 3, rel: { kai: -1 } }, lines: [['kai', 'Fine, you\'re good. Don\'t make it weird.', 'neutral'], ['moreno', '(writing) Noted.']], next: 'eval' },
    day3_3v3_loss: { scene: 'gym', lines: [['kai', 'Some things don\'t change.', 'smile'], ['reyes', 'Shake hands. Both of you competed.']], next: 'eval' },
    eval: { type: 'talk', scene: 'locker', who: 'reyes', look: 'reyes', script: 'usa_eval', title: 'FINAL EVALUATION · COACH REYES',
      winFx: { camp: 4, rel: { reyes: 5 } }, loseFx: { camp: -3 }, next: 'final_cut_pre' },
    final_cut_pre: { scene: 'dorm',
      lines: [
        ['milo', 'Fourteen of us, twelve jerseys. I keep doing the math and it doesn\'t get better.', 'sad'],
        ['narrator', 'You stare at the ceiling. Down the hall, somebody is already packing.'],
      ], next: 'final_cut' },
    /* the final cut: always on the roster now; your place on the board decides your role (rotation or the end of the bench) */
    final_cut: { type: 'board', mode: 'roster', keep: 12, rotation: 8, cutscene: (s, ctx) => USA4.roster(s, ctx), seenId: 'usa_roster', title: 'FINAL ROSTER · 12 JERSEYS', made: 'made_team', cut: 'made_team' },
    made_team: { scene: 'gym', fx: { flag: 'usa_made', rep: 6, fans: 4000, morale: 8, xp: 200, recruit: true, offers: true, draftStock: 4, overseas: 3, log: 'Made the U.S. Youth National Team.',
        post: { by: 'usab', text: '🇺🇸 Your U.S. Youth National Team roster is set. Welcome, {first} {last}.' } },
      lines: [
        ['reyes', 'You earned it. Every drill, every film session.', 'smile', { flag: 'usa_rotation' }],
        ['reyes', 'You made it by a hair. The twelfth man still gets a jersey.', null, { notFlag: 'usa_rotation' }],
        ['narrator', 'Kai\'s name is at the top of the sheet. Of course it is.'],
      ], next: 'kai_teammates' },
    kai_teammates: { scene: 'locker',
      lines: [
        ['kai', 'So. Teammates.', 'neutral'],
        ['kai', 'If we\'re doing this, set real screens for me.'],
      ],
      choices: [
        { t: '"I\'ll screen. You pass back when they double."', fx: { rel: { kai: 6 }, chem: 6, flag: 'kai_teammate' }, next: 'jersey' },
        { t: '"We\'ll see who\'s screening for who."', fx: { rel: { kai: -2 }, chem: -2 }, next: 'jersey' },
      ] },
    jersey: { scene: 'locker', fx: { gear: 'usa_jersey' },
      lines: [
        ['narrator', 'The equipment manager hands you a jersey. Navy, red trim, your name on the back.'],
        ['narrator', 'It\'s yours now. Find it in your Shop tab, under Jerseys.'],
      ], next: 'travel' },
    /* older saves only: cut at camp (the old version cut people; now everyone who's invited makes the twelve) */
    second_chance: { scene: 'home', fx: { unflag: ['usa_early', 'usa_cut', 'usa_done', 'usa_made'], flag: 'usa_returned', log: 'Invited back to the national team camp.' },
      lines: [
        ['reyes', '(on the phone) Told you we keep a list. You got better, and I watched.'],
        ['lou', 'Second chances are rare, kid. Don\'t knock politely this time.', 'fierce'],
      ], next: 'arrive' },
    cut_home: { scene: 'locker', fx: { flag: 'usa_cut', morale: -6, recruit: true, trimOffers: true, log: 'Cut from the national team camp.' },
      lines: [
        ['reyes', 'You\'re not on the twelve. It was close, but close is still a no.'],
        ['narrator', 'On your way out you pass the list. "STERLING, K." is on it.'],
      ], next: 'cut_lou' },
    cut_lou: { cine: true, scene: 'street_night',
      lines: [
        ['lou', 'Got cut? Good, every great one got told no once.'],
        ['lou', 'Write their twelve names on your wall. Look at it every morning.', 'fierce'],
      ],
      choices: [
        { t: 'Write the names on the wall.', fx: { flag: 'usa_motivated', attrs: { iq: 1 }, morale: 4 }, next: 'cut_watch' },
        { t: 'Throw the list away. Just work.', fx: { attrs: { str: 1 }, morale: 2 }, next: 'cut_watch' },
      ] },
    cut_watch: { scene: 'home',
      lines: [
        ['narrator', 'Two weeks later you watch Kai on TV, in the jersey you wanted.'],
        ['reyes', '(text) We keep a list. Get better and stay on it.'],
      ], next: 'return_home' },

    /* ======================= ARC 2: THE WORLD YOUTH ARC ======================= */
    travel: { scene: 'airport', cutscene: 'usa_abroad',
      lines: [
        ['narrator', 'Riga, Latvia. Sixteen nations and a hotel full of tall teenagers.'],
        ['jet', 'Bro, the breakfast has fish. At breakfast.', 'smile'],
      ], next: 'hotel' },
    hotel: { scene: 'abroad',
      lines: [
        ['moreno', 'Group C: Australia, Lithuania, Canada. Win two and we\'re in the quarters.'],
        ['reyes', 'My rotation is eight deep. Everybody else: be ready, be loud.'],
        ['sal', '(to you) The twelfth man in Riga can still be a pro in Spain. Ask me how I know.', 'smile', { notFlag: 'usa_rotation' }],
      ], next: 'anthem' },
    anthem: { scene: 'arena', cutscene: 'usa_anthem', csTeam: 'usa', fx: { log: 'Wore the national team jersey for the first time.' },
      lines: [['narrator', 'The anthem ends and everybody else peels off their warmups. You sit down.']], next: 'wy_group' },
    /* riding the bench (the fixed setback): group stage, quarterfinal, semifinal as montages, each with a 30-second cameo */
    wy_group: BENCH_NODE('group', 'wy_group_post', { fx: { log: 'Group stage in Riga: 3-0. Rode the bench.' }, qteFx: { id: 'cameo', ok: { morale: 3, xp: 40 }, okToast: '🏀 First points in the red, white and blue' } }),
    wy_group_post: { scene: 'abroad',
      lines: [
        ['milo', 'Three wins. I\'ve played nine minutes total.', 'sad'],
        ['milo', 'Kai has played ninety. Not that I\'m counting.'],
      ],
      choices: [
        { t: 'Stay ready. Shoot after every practice.', fx: { attrs: { three: 1 }, rel: { sal: 3 }, flag: 'usa_ready' }, next: 'wy_qf' },
        { t: 'Ask Reyes what you need to do.', fx: { rel: { reyes: 3 }, attrs: { iq: 1 } }, next: 'wy_qf' },
        { t: 'Sulk on the bus.', fx: { morale: -3, rel: { reyes: -3 } }, next: 'wy_qf' },
      ] },
    wy_qf: BENCH_NODE('qf', 'wy_sf', { qteFx: { id: 'cameo', ok: { morale: 3 }, okToast: '🏀 Two free throws, both pure' },
      lines: [['sal', '(walking past) Keep your legs warm. Finals get weird.']] }),
    wy_sf: BENCH_NODE('sf', 'wy_kai_pov', { qteFx: { id: 'cameo', ok: { rel: { reyes: 3 }, morale: 2 }, okToast: '🏀 Reyes saw that dive' },
      lines: [['kai', '(in the tunnel) Final. Don\'t fall asleep over there.', 'smile']] }),
    wy_kai_pov: { scene: 'abroad', cutscene: 'wy_kai_call', lines: [['narrator', 'Down the hall, Kai\'s light stays on until four.']], next: 'final_pre' },
    final_pre: { scene: 'abroad',
      lines: [
        ['moreno', 'France. Mbaye shoots from the logo, and Bakari is seven feet of rim.'],
        ['mbaye', '(in the hallway) Americans always think the final is theirs. Not this year.', 'smile'],
        ['sal', '(to you, quietly) Seven-footer. You know what to do if you get the call.', 'smile', { flag: 'jelly' }],
      ], next: 'wy_final_open' },
    wy_final_open: { scene: 'arena', csTeam: 'usa', cutscene: (s, ctx) => USA4.finalOpen(s, ctx), seenId: 'wy_final_open', fx: { flag: 'usa_final_in' },
      lines: [['narrator', 'Under four minutes, down five. You pull off the warmup.']], next: 'wy_final' },
    /* the one moment, played live: late entry, the jelly over the seven-footer, then the gold (scripted) */
    wy_final: { type: 'match', us: 'usa', them: 'fra_u19', ratingRel: 3, mateRel: 2, moments: 4, level: 'hs', importance: 3, venue: 'wyhc_arena', venueSide: 'away', csTeam: 'usa', coach: 'reyes',
      title: 'World Youth Championship', sub: 'FINAL · vs France', script: 'wy_gold',
      lateEntry: { at: .82, score: [56, 61], title: 'YOU. NOW.', text: 'You check in. Down five, 3:40 left, and Bakari is waiting.' },
      jellyMoment: { text: 'You turn the corner. Yanis Bakari, seven feet of French wingspan, leaves his man to meet you.', by: 'Yanis Bakari', first: true, payoff: true, mono: ['jelly_void', 'jelly_puzzle'] },
      win: 'wy_gold', lose: 'wy_gold' },
    /* gold (the fixed high): the podium, the anthem, the jersey */
    wy_gold: { scene: 'podium', csTeam: 'usa', cutscene: (s, ctx) => USA4.podium(s, ctx), seenId: 'wy_podium',
      fx: { medal: 'gold', flag: ['usa_gold', 'usa_medal'], rep: 10, fans: 20000, xp: 400, recruit: true, offers: true, draftStock: 8, overseas: 6, rel: { reyes: 5, kai: 4, sal: 4 },
        log: 'Won gold at the World Youth Championship.', post: { by: 'usab', text: '🥇 WORLD CHAMPIONS. The U.S. Youth National Team beats France for gold!' } },
      lines: [
        ['reyes', 'Gold. Look at that flag, you put it there.', 'smile', { flag: 'usa_part_big' }],
        ['reyes', 'Three minutes and one play. Sometimes that\'s all a final needs.', 'smile', { notFlag: 'usa_part_big' }],
        ['sal', '(in the tunnel) Around him. Told you.', 'smile', { flag: 'usa_jelly_final' }],
        ['kai', '(holding his medal next to yours) Don\'t get used to it, Halsey.', 'smile'],
      ], next: 'tour_end' },
    /* older saves only: they played their tournament games live, and those results stay */
    out_group: { scene: 'abroad', fx: { morale: -6, log: 'Out in the group stage of the World Youth Championship.' },
      lines: [['reyes', 'One win isn\'t enough. We fly home tomorrow.'], ['kai', 'This one\'s going to bother me for a long time.', 'sad']], next: 'tour_end' },
    out_qf: { scene: 'abroad', fx: { morale: -4, log: 'Lost in the World Youth Championship quarterfinals.' },
      lines: [['narrator', 'Ferraro hits the step-back with four seconds left.'], ['reyes', 'Hold onto this feeling. It\'s the most useful thing you\'ll take home.']], next: 'tour_end' },
    bronze_pre: { scene: 'abroad',
      lines: [['reyes', 'Nobody wants the bronze game. Play it anyway.'], ['dre', 'Spain beat us in a scrimmage two years ago. I remember.', 'fierce']], next: 'bronze' },
    bronze: { type: 'match', us: 'usa', them: 'esp_u19', ratingRel: 2, mateRel: 2, moments: 10, level: 'hs', importance: 3, venue: 'wyhc_arena', venueSide: 'away', coach: 'reyes',
      title: 'World Youth Championship', sub: 'Bronze-medal game · vs Spain', win: 'medal_bronze', lose: 'fourth' },
    medal_gold: { scene: 'podium', cutscene: 'usa_gold', csTeam: 'usa', fx: { medal: 'gold', flag: ['usa_gold', 'usa_medal'], rep: 10, fans: 20000, xp: 400, recruit: true, offers: true, draftStock: 8, overseas: 6, rel: { reyes: 5, kai: 4 },
        log: 'Won gold at the World Youth Championship.' },
      lines: [['reyes', 'Gold. Look up at that flag, you put it there.', 'smile']], next: 'tour_end' },
    medal_silver: { scene: 'podium', cutscene: 'usa_silver', csTeam: 'usa', fx: { medal: 'silver', flag: 'usa_medal', rep: 6, fans: 10000, xp: 260, recruit: true, offers: true, draftStock: 5, overseas: 4, rel: { reyes: 3 },
        log: 'Won silver at the World Youth Championship.' },
      lines: [['mbaye', '(at the handshake line) You were the only one who bothered me all tournament.'], ['reyes', 'Silver hurts today. In a year it\'ll fuel you.']], next: 'tour_end' },
    medal_bronze: { scene: 'podium', cutscene: 'usa_bronze', csTeam: 'usa', fx: { medal: 'bronze', flag: 'usa_medal', rep: 4, fans: 6000, xp: 200, recruit: true, draftStock: 3, overseas: 3,
        log: 'Won bronze at the World Youth Championship.' },
      lines: [['dre', 'Not the medal we wanted, but still a medal. I\'m wearing it to breakfast.', 'smile']], next: 'tour_end' },
    fourth: { scene: 'abroad', fx: { rep: 1, log: 'Finished fourth at the World Youth Championship.' },
      lines: [['narrator', 'Fourth. No medal, no podium, a long flight home.'], ['milo', 'Next time.', 'sad']], next: 'tour_end' },
    tour_end: { scene: 'airport', fx: { flag: 'usa_done', recruit: true },
      lines: [
        ['reyes', 'You\'ll hear from me again. Coaches like me keep lists, and you\'re on mine.'],
        ['kai', '(at the gate) See you on the other side, teammate.', 'neutral', { flag: 'kai_teammate' }],
        ['narrator', 'The flight home is twelve hours. You sleep for eleven of them.'],
      ], next: 'return_home' },
    /* older saves: a junior-summer camp goes back to high school; one that started after graduation still owes the Chapter 2 ending */
    return_home: { type: 'branch', fx: { flag: 'usa_over' }, branches: [{ if: { flag: 'usa_early', notFlag: ['usa_returned', 'done_highschool'] }, next: 'highschool:c2_nia_bday' }, { if: { notFlag: 'done_highschool' }, next: 'highschool:ch_end' }], else: 'usa_end' },
    usa_end: { type: 'chapterEnd', nextChapter: 'college', fx: { recruit: true },
      summary: 'The national team summer is over. Now the real decision: college, overseas, or the Grind League.',
      recap: [
        { if: { flag: 'usa_gold' }, t: '🥇 World Youth Championship gold' },
        { if: { flag: 'usa_jelly_final' }, t: '🍯 The jelly over Bakari turned the final' },
        { if: { flag: 'usa_rotation' }, t: '🇺🇸 Made the twelve: in the rotation' },
        { if: { flag: 'usa_bench' }, t: '🇺🇸 Made the twelve: the end of the bench' },
        { if: { flag: 'usa_medal', notFlag: 'usa_gold' }, t: '🏅 Medal at the World Youth Championship' },
        { if: { flag: 'usa_made', notFlag: ['usa_rotation', 'usa_bench'] }, t: '🇺🇸 Made the U.S. Youth National Team' },
        { if: { flag: 'usa_cut' }, t: '✂️ Cut at selection camp: some schools stopped calling' },
        { if: { flag: 'usa_proam' }, t: '🏀 A summer of grown men at the Kingdom Pro-Am' },
        { if: { flag: 'usa_motivated' }, t: '🔥 Kai\'s gold on your TV: a chip on your shoulder' },
        { if: { flag: 'kai_teammate' }, t: '🤝 Set screens for Kai Sterling' },
        { if: { flag: 'jelly' }, t: '🍯 Learned the jelly from Scoop DeLuca' },
      ] },
  },
  /* older saves on a node that's gone: the junior-summer invite, and tournament games now played as bench montages */
  moved: { early_offer: 'highschool:c2_nia_bday', decline: 'highschool:c2_nia_bday',
    g1: 'wy_qf', g1_win: 'wy_qf', g1_loss: 'wy_qf', g2: 'wy_qf', g2_post: 'wy_qf', g3: 'wy_qf', group_check: 'wy_qf', qf_pre: 'wy_qf', qf: 'wy_qf',
    sf_pre: 'wy_sf', sf: 'wy_sf', final: 'wy_final_open' },
};
