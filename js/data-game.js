/* =====================================================================
   DATA-GAME.JS — core rules data. Edit freely.
   Attributes, positions, archetypes, badges, difficulty, achievements.
   ===================================================================== */

/* ---------- ATTRIBUTES (0–99) ---------- */
const ATTRS = [
  { k: 'three',  n: 'Three-Point',   s: '3PT', g: 'Shooting' },
  { k: 'mid',    n: 'Mid-Range',     s: 'MID', g: 'Shooting' },
  { k: 'ft',     n: 'Free Throw',    s: 'FT',  g: 'Shooting' },
  { k: 'finish', n: 'Finishing',     s: 'FIN', g: 'Inside' },
  { k: 'dunk',   n: 'Dunking',       s: 'DNK', g: 'Inside' },
  { k: 'handle', n: 'Ball Handling', s: 'HND', g: 'Playmaking' },
  { k: 'pass',   n: 'Passing',       s: 'PAS', g: 'Playmaking' },
  { k: 'speed',  n: 'Speed',         s: 'SPD', g: 'Athleticism' },
  { k: 'vert',   n: 'Vertical',      s: 'VRT', g: 'Athleticism' },
  { k: 'str',    n: 'Strength',      s: 'STR', g: 'Athleticism' },
  { k: 'stam',   n: 'Stamina',       s: 'STA', g: 'Athleticism' },
  { k: 'perD',   n: 'Perimeter D',   s: 'PER', g: 'Defense' },
  { k: 'intD',   n: 'Interior D',    s: 'INT', g: 'Defense' },
  { k: 'reb',    n: 'Rebounding',    s: 'REB', g: 'Defense' },
  { k: 'iq',     n: 'Basketball IQ', s: 'IQ',  g: 'Mental' },
  { k: 'clutch', n: 'Clutch',        s: 'CLU', g: 'Mental' },
];
const ATTR_BY_KEY = Object.fromEntries(ATTRS.map(a => [a.k, a]));

/* Radar chart groups (6 axes) */
const RADAR = [
  { n: 'Shooting',    keys: ['three', 'mid', 'ft'], w: { three: .45, mid: .4, ft: .15 } },   // free throws count for less
  { n: 'Inside',      keys: ['finish', 'dunk'] },
  { n: 'Playmaking',  keys: ['handle', 'pass', 'iq'] },
  { n: 'Defense',     keys: ['perD', 'intD'] },
  { n: 'Rebounding',  keys: ['reb', 'str'] },
  { n: 'Athleticism', keys: ['speed', 'vert', 'stam'] },
];

/* ---------- POSITIONS ----------
   h: [min, max, default] height in inches.
   w: Overall weights per attribute.
   adj: starting attribute adjustments. */
const POSITIONS = {
  PG: { name: 'Point Guard', h: [70, 77, 74],
    w: { three: 1.2, mid: .8, ft: .2, finish: .8, dunk: .2, handle: 1.5, pass: 1.5, speed: 1.1, vert: .3, str: .2, stam: .5, perD: .8, intD: .1, reb: .2, iq: 1.2, clutch: .7 },
    adj: { handle: 8, pass: 8, speed: 7, three: 3, iq: 4, reb: -6, intD: -8, str: -6, dunk: -4 } },
  SG: { name: 'Shooting Guard', h: [73, 79, 77],
    w: { three: 1.5, mid: 1.1, ft: .25, finish: .9, dunk: .4, handle: 1.0, pass: .7, speed: 1.0, vert: .4, str: .3, stam: .5, perD: .9, intD: .15, reb: .3, iq: .8, clutch: .8 },
    adj: { three: 7, mid: 6, handle: 4, speed: 5, ft: 4, intD: -6, reb: -5, str: -3 } },
  SF: { name: 'Small Forward', h: [77, 82, 80],
    w: { three: 1.0, mid: 1.0, ft: .2, finish: 1.0, dunk: .6, handle: .7, pass: .6, speed: .8, vert: .6, str: .6, stam: .5, perD: 1.0, intD: .5, reb: .6, iq: .8, clutch: .7 },
    adj: { finish: 3, perD: 3, three: 2, vert: 2 } },
  PF: { name: 'Power Forward', h: [79, 84, 81],
    w: { three: .6, mid: .8, ft: .15, finish: 1.1, dunk: .8, handle: .3, pass: .4, speed: .5, vert: .7, str: 1.0, stam: .5, perD: .6, intD: 1.0, reb: 1.1, iq: .7, clutch: .5 },
    adj: { reb: 8, str: 7, intD: 7, finish: 4, dunk: 3, speed: -4, handle: -6, three: -4 } },
  C:  { name: 'Center', h: [81, 87, 84],
    w: { three: .3, mid: .5, ft: .15, finish: 1.3, dunk: 1.0, handle: .15, pass: .4, speed: .3, vert: .7, str: 1.3, stam: .5, perD: .3, intD: 1.5, reb: 1.5, iq: .7, clutch: .4 },
    adj: { reb: 10, intD: 10, str: 10, finish: 5, dunk: 5, speed: -8, handle: -10, three: -8, pass: -4 } },
};

/* Height-based attribute caps. hn = 0 (5'10") .. 1 (7'5").
   Guards get higher speed/handle caps, bigs get higher rebounding/inside caps. */
const CAP_RULES = {
  speed:  hn => 99 - 22 * hn,
  handle: hn => 99 - 24 * hn,
  perD:   hn => 99 - 14 * hn,
  three:  hn => 99 - 8 * hn,
  pass:   hn => 99 - 10 * hn,
  vert:   hn => 99 - 6 * hn,
  reb:    hn => 78 + 21 * hn,
  intD:   hn => 76 + 23 * hn,
  str:    hn => 80 + 19 * hn,
  dunk:   hn => 75 + 24 * hn,
};

/* ---------- RARITY + ROLLING ----------
   Archetype and Weapon are ROLLED at character creation (like a gacha).
   odds: chance per roll. spins: re-rolls allowed per category, by difficulty. */
const RARITY = {
  common:    { name: 'Common',    color: '#94a3b8', odds: 0.42 },
  rare:      { name: 'Rare',      color: '#38bdf8', odds: 0.30 },
  epic:      { name: 'Epic',      color: '#a855f7', odds: 0.17 },
  legendary: { name: 'Legendary', color: '#f59e0b', odds: 0.08 },
  mythic:    { name: 'Mythic',    color: '#ef4444', odds: 0.03 },
};
const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];
const ROLL_SPINS = { pro: 5, hof: 3 };

/* ---------- ARCHETYPES (rolled) ----------
   Play styles inspired by Kuroko no Basket's "Generation of Miracles"-era techniques.
   bonus:   starting attribute boosts (bigger at higher rarity).
   passive: an always-on ability in games.
     mods  — extra success % on actions (keys: three, mid, finish, dunk, str, pass, intD, iq, perD, steal, clutch3)
     mg    — minigame multipliers (green = shot meter window, ftZone, comboTime, dunkTol, defWindow, rebZone, passWindow)
     special — scripted ability handled in match.js:
       misdirection: +12% on everything for your first 3 moments, before they notice you
       mirror:       every defensive stop copies their move: +3% offense, stacks to +12%
       formless:     your Weapon recharges after use (two uses per game)
       postpone:     one failed post move per game gets a second attempt
       ankles:       dribble combos break ankles far more often
       stealer:      successful on-ball defense turns into a steal much more often */
const ARCHETYPES = {
  /* ---- COMMON ---- */
  lightning: { name: 'Lightning Dribbler', rarity: 'common', icon: 'bolt', color: '#facc15',
    desc: 'Hands so fast the ball looks like it\'s strobing. Five-finger dribble that freezes defenders.',
    bonus: { handle: 9, speed: 7, finish: 3, iq: 2 },
    passive: { name: 'Five-Finger Thunder', desc: 'Dribble combos give 30% more time per move. +5% on drives.', mods: { finish: 5 }, mg: { comboTime: 1.3 } } },
  bruiser: { name: 'Rebound Hammer', rarity: 'common', icon: 'fist', color: '#b45309',
    desc: 'A wall of muscle that owns the glass. Every miss is a possession.',
    bonus: { reb: 10, str: 9, intD: 3 },
    passive: { name: 'Hammer Box-Out', desc: 'Box-out zone 35% bigger. +6% on power post moves.', mods: { str: 6 }, mg: { rebZone: 1.35 } } },
  barrier: { name: 'Barrier Jumper', rarity: 'common', icon: 'target', color: '#22d3ee',
    desc: 'A step-back fadeaway that leans away from even the biggest contest. Lives for late-game threes.',
    bonus: { three: 8, mid: 6, clutch: 7 },
    passive: { name: 'Clutch Gene', desc: '+12% on threes in clutch time. Shot meter green 15% wider.', mods: { clutch3: 12 }, mg: { green: 1.15 } } },
  /* ---- RARE ---- */
  sky: { name: 'Sky Ace', rarity: 'rare', icon: 'wing', color: '#ef4444',
    desc: 'Jumps out of the gym. Plays above the rim like gravity is a suggestion.',
    bonus: { vert: 11, dunk: 10, finish: 4, reb: 3 },
    passive: { name: 'Flight Path', desc: 'Dunk timing 30% more forgiving. +6% on dunks.', mods: { dunk: 6 }, mg: { dunkTol: 1.3 } } },
  hawkeye: { name: 'Hawk-Eye Floor General', rarity: 'rare', icon: 'eye', color: '#60a5fa',
    desc: 'Sees the whole floor from above. Knows where everyone will be two passes from now.',
    bonus: { pass: 11, iq: 9, handle: 6 },
    passive: { name: 'Hawk Eye', desc: 'Passing-lane windows 40% longer. +8% on passes and kick-outs.', mods: { pass: 8 }, mg: { passWindow: 1.4 } } },
  ironheart: { name: 'Iron Heart', rarity: 'rare', icon: 'anchor', color: '#16a34a',
    desc: 'A big with a guard\'s hands. Holds the ball in the air and decides late — shoot, pass, or wait.',
    bonus: { finish: 9, str: 7, pass: 6, reb: 5 },
    passive: { name: 'Right of Postponement', desc: 'Once per game, a failed post move gets a second attempt. +5% in the post.', mods: { str: 5, finish: 3 }, special: 'postpone' } },
  thief: { name: 'Steal Artist', rarity: 'rare', icon: 'claw', color: '#64748b',
    desc: 'Reads dribbles like sheet music. Takes your move, then takes your ball.',
    bonus: { perD: 11, speed: 7, iq: 5, handle: 3 },
    passive: { name: 'Plunder', desc: 'Stops turn into steals far more often. +12% when gambling for steals.', mods: { steal: 12, perD: 4 }, special: 'stealer' } },
  /* ---- EPIC ---- */
  phantom: { name: 'Phantom Sixth Man', rarity: 'epic', icon: 'ghost', color: '#cbd5e1',
    desc: 'So unremarkable that defenders forget you exist — until the ball is already past them.',
    bonus: { pass: 14, iq: 10, perD: 4, speed: 4 },
    passive: { name: 'Misdirection', desc: '+12% on EVERYTHING for your first 3 moments, before the defense notices you. Passing +8%.', mods: { pass: 8 }, special: 'misdirection' } },
  sniper: { name: 'Full-Court Sniper', rarity: 'epic', icon: 'target', color: '#22c55e',
    desc: 'If you\'re past half court, you\'re in range. High-arc threes that never seem to come down.',
    bonus: { three: 15, mid: 7, ft: 7, clutch: 3 },
    passive: { name: 'Infinite Range', desc: 'Shot meter green 35% wider. +8% on threes, no shot-clock penalty.', mods: { three: 8 }, mg: { green: 1.35, ftZone: 1.15 } } },
  titan: { name: 'Titan Wall', rarity: 'epic', icon: 'hand', color: '#7c3aed',
    desc: 'Too big, too long, too lazy to care — and nothing gets to the rim.',
    bonus: { intD: 14, reb: 9, str: 8, dunk: 4 },
    passive: { name: 'Destroyer', desc: '+10% on block attempts. Box-out zone 30% bigger.', mods: { intD: 10 }, mg: { rebZone: 1.3 } } },
  /* ---- LEGENDARY ---- */
  copycat: { name: 'Perfect Mirror', rarity: 'legendary', icon: 'mirror', color: '#fbbf24',
    desc: 'Watch a move once, do it better. Copies the best player on the floor in real time.',
    bonus: { mid: 7, finish: 7, perD: 7, handle: 6, iq: 6 },
    passive: { name: 'Perfect Copy', desc: 'Every defensive stop copies their move: +3% on offense, stacking to +12% per game.', mods: { mid: 3, finish: 3 }, special: 'mirror' } },
  formless: { name: 'Formless Ace', rarity: 'legendary', icon: 'zigzag', color: '#1d4ed8',
    desc: 'Street-ball instincts at full speed. Shoots from anywhere, from any angle, off any foot.',
    bonus: { finish: 9, speed: 8, handle: 8, mid: 7 },
    passive: { name: 'No Form, No Answer', desc: '+6% on drives and jumpers. Your Weapon recharges after use (two uses per game).', mods: { finish: 6, mid: 6 }, special: 'formless' } },
  /* ---- MYTHIC ---- */
  emperor: { name: 'The Emperor', rarity: 'mythic', icon: 'crown', color: '#dc2626',
    desc: 'One eye sees the future. Absolute. Nobody who looks down on the Emperor wins.',
    bonus: { iq: 13, handle: 10, pass: 9, perD: 6, clutch: 5 },
    passive: { name: 'Emperor Eye', desc: 'Sees moves before they happen: defense windows 35% longer, dribble combos 25% longer, ankle breaks far more often. +5% on everything.', mods: { all: 5 }, mg: { defWindow: 1.35, comboTime: 1.25 }, special: 'ankles' } },
};
/* Old saves used the original 8 archetypes: map them onto the new ones. */
const ARCH_MIGRATE = { sharpshooter: 'sniper', slasher: 'lightning', playmaker: 'hawkeye', lockdown: 'thief', twoway: 'copycat', stretch: 'barrier', post: 'ironheart', rimrunner: 'sky' };

/* ---------- WEAPONS (signature moves) ----------
   Like Blue Lock: every notable player has 1–2 "weapons". Yours are rolled at creation, more unlock as you
   level up (Upgrade tab), and every weapon has ranks you upgrade with Skill Points.
   type:  the play it creates — three | mid | drive | dunk | pass | post | steal | block | stop | zone
   stats: the ONLY stats its success % uses (weights). The formula is in js/balance.js (BALANCE.weapons).
   charge: good moments needed to charge it in a game. learn: true = can't be rolled, only unlocked later. */
const WEAPONS = {
  /* ---- COMMON ---- */
  lightning_dribble: { name: 'Lightning Dribble', rarity: 'common', type: 'drive', charge: 3, icon: 'bolt', stats: { handle: .5, speed: .3, finish: .2 }, desc: 'A blur of crossovers and straight to the rim.' },
  barrier_jumper:    { name: 'Barrier Jumper', rarity: 'common', type: 'three', charge: 3, icon: 'target', stats: { three: .7, mid: .2, clutch: .1 }, desc: 'Step back, lean away, splash it over the contest.' },
  hammer_board:      { name: 'Hammer Put-Back', rarity: 'common', type: 'dunk', charge: 3, icon: 'fist', stats: { reb: .4, dunk: .3, str: .3 }, desc: 'Rip the rebound and hammer it back down.' },
  /* ---- RARE ---- */
  vanishing_drive:   { name: 'Vanishing Drive', rarity: 'rare', type: 'drive', charge: 3, icon: 'ghost', stats: { speed: .4, handle: .4, finish: .2 }, desc: 'Your defender blinks — and you\'re gone.' },
  ignite_pass:       { name: 'Ignite Pass', rarity: 'rare', type: 'pass', charge: 3, icon: 'pass', stats: { pass: .7, iq: .3 }, desc: 'A palm-strike pass so fast it burns the hands that catch it.' },
  postponement:      { name: 'Right of Postponement', rarity: 'rare', type: 'post', charge: 3, icon: 'anchor', stats: { str: .4, finish: .4, iq: .2 }, desc: 'Hang in the air, wait out the block, then decide.' },
  robbery:           { name: 'Robbery', rarity: 'rare', type: 'steal', charge: 3, icon: 'claw', stats: { perD: .5, speed: .3, iq: .2 }, desc: 'Pick the pocket at half court and finish the other way.' },
  /* ---- EPIC ---- */
  phantom_shot:      { name: 'Phantom Shot', rarity: 'epic', type: 'mid', charge: 3, icon: 'eye', stats: { mid: .7, iq: .3 }, desc: 'A low-release jumper the defender can\'t even see leave your hands.' },
  heaven_shot:       { name: 'Heaven · Earth · Void', rarity: 'epic', type: 'mid', charge: 3, icon: 'yin', stats: { mid: .6, handle: .2, clutch: .2 }, desc: 'Three different jump shots. They can\'t guard all of them.' },
  thors_hammer:      { name: 'Thor\'s Hammer', rarity: 'epic', type: 'dunk', charge: 3, icon: 'dunk', stats: { dunk: .5, vert: .3, str: .2 }, desc: 'Full spin, two hands, rim nearly torn down.' },
  destroyer:         { name: 'Destroyer Block', rarity: 'epic', type: 'block', charge: 3, icon: 'hand', stats: { intD: .6, vert: .4 }, desc: 'Swat it into the third row, start the break.' },
  /* ---- LEGENDARY ---- */
  meteor_jam:        { name: 'Meteor Jam', rarity: 'legendary', type: 'dunk', charge: 4, icon: 'flame', stats: { dunk: .4, vert: .5, speed: .1 }, desc: 'Take off from the free-throw line and fall on the rim like a meteor.' },
  sky_three:         { name: 'Sky-High Three', rarity: 'legendary', type: 'three', charge: 4, icon: 'star', stats: { three: .8, clutch: .2 }, desc: 'A full-court rainbow so high it scrapes the ceiling.' },
  ankle_break:       { name: 'Emperor\'s Ankle Break', rarity: 'legendary', type: 'drive', charge: 4, icon: 'crown', stats: { handle: .6, iq: .2, speed: .2 }, desc: 'See the defender\'s next step and send them to the floor.' },
  /* ---- MYTHIC ---- */
  formless_shot:     { name: 'Formless Shot', rarity: 'mythic', type: 'mid', charge: 4, icon: 'zigzag', stats: { mid: .5, finish: .3, handle: .2 }, desc: 'Behind the backboard, falling sideways, one hand. Still money.' },
  the_zone:          { name: 'The Zone', rarity: 'mythic', type: 'zone', charge: 4, icon: 'bolt', stats: { iq: .4, clutch: .3, stam: .3 }, desc: 'Enter the Zone: the game slows down. +12% on everything and wider timing windows for the rest of the game.' },
  /* ---- LEARNABLE (unlock as you level up — and what the rest of the league uses) ---- */
  logo_three:   { name: 'Logo Three', rarity: 'rare', type: 'three', charge: 3, icon: 'target', learn: true, stats: { three: .85, clutch: .15 }, desc: 'Pull up from the half-court logo. Range is a state of mind.' },
  step_back:    { name: 'Step-Back Three', rarity: 'rare', type: 'three', charge: 3, icon: 'zigzag', learn: true, stats: { three: .55, handle: .35, iq: .1 }, desc: 'One hard dribble, a step back, and a clean look.' },
  spin_fade:    { name: 'Spin Fadeaway', rarity: 'epic', type: 'mid', charge: 3, icon: 'yin', learn: true, stats: { mid: .55, handle: .25, str: .2 }, desc: 'Spin baseline, fade away, release over the top.' },
  poster_dunk:  { name: 'Poster Dunk', rarity: 'rare', type: 'dunk', charge: 3, icon: 'dunk', learn: true, stats: { dunk: .5, vert: .3, str: .2 }, desc: 'Go right at the shot blocker and put him on a poster.' },
  no_look:      { name: 'No-Look Dime', rarity: 'rare', type: 'pass', charge: 3, icon: 'pass', learn: true, stats: { pass: .65, iq: .35 }, desc: 'Look one way, pass the other. The defense never sees it.' },
  lockdown:     { name: 'Lockdown Stance', rarity: 'rare', type: 'stop', charge: 3, icon: 'lock', learn: true, stats: { perD: .7, speed: .2, iq: .1 }, desc: 'Low, wide, mirroring every step. Nothing gets by.' },
  chase_block:  { name: 'Chase-Down Block', rarity: 'epic', type: 'block', charge: 3, icon: 'hand', learn: true, stats: { intD: .4, vert: .35, speed: .25 }, desc: 'Run him down from behind and pin it on the glass.' },
  post_fade:    { name: 'Post Fadeaway', rarity: 'rare', type: 'post', charge: 3, icon: 'anchor', learn: true, stats: { mid: .5, str: .3, finish: .2 }, desc: 'Back him down, turn, fade, splash.' },
  euro_step:    { name: 'Euro Step', rarity: 'common', type: 'drive', charge: 3, icon: 'zigzag', learn: true, stats: { finish: .55, handle: .25, speed: .2 }, desc: 'Left, then right, then past the help.' },
  floater:      { name: 'Teardrop Floater', rarity: 'common', type: 'drive', charge: 3, icon: 'star', learn: true, stats: { finish: .6, mid: .4 }, desc: 'Too small to finish over the bigs? Go over them.' },
  sky_hook:     { name: 'Sky Hook', rarity: 'epic', type: 'post', charge: 3, icon: 'anchor', learn: true, stats: { finish: .6, str: .2, iq: .2 }, desc: 'A hook shot released from the rafters. Unblockable.' },
  pickpocket:   { name: 'Pickpocket', rarity: 'common', type: 'steal', charge: 3, icon: 'claw', learn: true, stats: { perD: .6, speed: .3, iq: .1 }, desc: 'Quick hands on the dribble. Take it and go.' },
  lob_threat:   { name: 'Lob Threat', rarity: 'common', type: 'dunk', charge: 3, icon: 'wing', learn: true, stats: { vert: .5, dunk: .4, iq: .1 }, desc: 'Throw it anywhere near the rim. He\'ll go get it.' },
  dream_shake:  { name: 'Dream Shake', rarity: 'legendary', type: 'post', charge: 4, icon: 'yin', learn: true, stats: { str: .35, handle: .35, finish: .3 }, desc: 'Fake, pivot, fake again — the defender is already in the air.' },
};
/* WEAPON EVOLUTION — every big low in the story ends with an awakening: your weapon gains a tier (II → III → IV) with a new name.
   "Ignite Pass" → "Ignite Pass II: Overdrive". Names by weapon (id) or by type; the bonus % per tier is in js/balance.js (BALANCE.weapons.evo). */
const WEAPON_EVO = {
  type: { drive: ['Overdrive', 'Afterimage', 'Thunder God'], three: ['Long Range', 'Sky Piercer', 'Infinite Range'], mid: ['Silent', 'Phantom', 'Absolute'], dunk: ['Overdrive', 'Meteor Fall', 'Cataclysm'],
    pass: ['Overdrive', 'Wildfire', 'Supernova'], post: ['Anchor', 'Fortress', 'Monolith'], steal: ['Shadow Hands', 'Phantom Thief', 'Grand Larceny'], block: ['Wall', 'Fortress', 'Judgment'],
    stop: ['Mirror', 'Prison', 'Absolute Zero'], zone: ['Deeper', 'Flow State', 'Godspeed'] },
  id: { ignite_pass: ['Overdrive', 'Wildfire', 'Supernova'], lightning_dribble: ['Overdrive', 'Storm Step', 'Thunder God'], barrier_jumper: ['Fortress', 'Iron Curtain', 'Infinite Wall'],
    vanishing_drive: ['Afterimage', 'Phantom Step', 'Nothingness'], phantom_shot: ['Silent', 'Ghost Release', 'Absolute'], meteor_jam: ['Comet', 'Meteor Shower', 'Extinction'],
    sky_three: ['Stratosphere', 'Orbit', 'Infinite Range'], ankle_break: ['Emperor\'s Eye', 'Absolute Reign', 'Heavenly Decree'], the_zone: ['Deeper', 'Flow State', 'Godspeed'] },
};
/* Every named player's weapons (1–2, fitting their position and style). Anyone not listed gets
   1–2 weapons picked from their name + role (Weapons.forName), so every key player has them. */
const PLAYER_WEAPONS = {
  // Halsey Street + Lincoln (your teammates)
  'Tariq "T-Bone" Miles': ['no_look', 'post_fade'], 'Big Rudy': ['sky_hook', 'hammer_board'], 'Smoke': ['logo_three'], 'Lil\' Dez': ['pickpocket', 'floater'],
  'Darnell "Brick" Hollis': ['post_fade', 'chase_block'], 'Jordan Pike': ['step_back'], 'Andre Cole': ['euro_step', 'lockdown'],
  // rivals
  'Kai Sterling': ['step_back', 'ankle_break'], 'Brandon Vale': ['logo_three'], 'Theo "Tank" Marsh': ['poster_dunk', 'destroyer'], 'Jules Okafor': ['lockdown', 'lob_threat'], 'Preston Ames': ['no_look'],
  'Hammer Jones': ['thors_hammer', 'post_fade'], 'Q-Tip': ['floater'], 'Marlon Cross': ['pickpocket'], 'Big Shoes': ['sky_hook'],
  'Flash Gordon Lee': ['vanishing_drive', 'euro_step'], 'Ricky Two-Times': ['step_back'], 'Mo Bamba-ish': ['chase_block'],
  'Darius "D-Train" Holt': ['poster_dunk', 'spin_fade'], 'Quincy Fields': ['logo_three', 'step_back'], 'Isaiah Grant': ['euro_step'], 'Chidi Eze': ['destroyer', 'sky_hook'], 'Deshawn Price': ['pickpocket', 'floater'], 'Elijah Ross': ['spin_fade', 'lockdown'],
  'Marcus "Silk" Sterling': ['dream_shake', 'spin_fade'],
};
const WEAPON_MIGRATE = { splash: 'sky_three', lightning: 'vanishing_drive', nolook: 'ignite_pass', clamp: 'robbery', takeover: 'thors_hammer', popbomb: 'barrier_jumper', dream: 'postponement', skyscraper: 'meteor_jam' };

/* ---------- WINGSPAN ----------
   Chosen relative to height: from 3" shorter to 8" longer ("ape index").
   Long arms: better defense, rebounding, finishing at the rim, blocks and steals.
   Very long arms make tight handles and pure shooting a little harder. */
const WINGSPAN = { min: -3, max: 8, def: 2 };

/* ---------- BADGES ----------
   Tier = max(attribute tier, achievement-counter tier).
   at: attribute thresholds [Bronze, Silver, Gold, Hall of Fame]
   ct: counter thresholds (career totals tracked in state.counters)
   boosts: which in-game actions get +2% per tier. */
const BADGE_TIERS = ['None', 'Bronze', 'Silver', 'Gold', 'Hall of Fame'];
const BADGES = [
  { id: 'icev',    name: 'Ice Veins',        icon: 'snow',   attr: 'clutch', at: [60, 72, 84, 93], counter: 'clutchMakes', ct: [2, 8, 20, 45],   boosts: ['clutch'], desc: 'Clutch shots fall more often.' },
  { id: 'poster',  name: 'Posterizer',       icon: 'dunk',   attr: 'dunk',   at: [60, 72, 84, 93], counter: 'dunks',       ct: [5, 20, 60, 140],  boosts: ['dunk'], desc: 'Dunk on anyone, anywhere.' },
  { id: 'range',   name: 'Limitless Range',  icon: 'target', attr: 'three',  at: [60, 72, 84, 93], counter: 'threes',      ct: [10, 40, 120, 300], boosts: ['three'], desc: 'Deep threes, no penalty.' },
  { id: 'deadeye', name: 'Deadeye',          icon: 'eye',    attr: 'mid',    at: [60, 72, 84, 93], counter: 'mids',        ct: [10, 40, 110, 250], boosts: ['mid'], desc: 'Contests barely bother you.' },
  { id: 'ankle',   name: 'Ankle Breaker',    icon: 'zigzag', attr: 'handle', at: [60, 72, 84, 93], counter: 'crosses',     ct: [5, 20, 60, 140],  boosts: ['handle'], desc: 'Crossovers send defenders to the floor.' },
  { id: 'dimer',   name: 'Dimer',            icon: 'pass',   attr: 'pass',   at: [60, 72, 84, 93], counter: 'assists',     ct: [10, 50, 150, 400], boosts: ['pass'], desc: 'Teammates shoot better off your passes.' },
  { id: 'clamps',  name: 'Clamps',           icon: 'lock',   attr: 'perD',   at: [60, 72, 84, 93], counter: 'stops',       ct: [8, 30, 90, 200],  boosts: ['perD'], desc: 'Stay in front of anyone.' },
  { id: 'rimpro',  name: 'Rim Protector',    icon: 'hand',   attr: 'intD',   at: [60, 72, 84, 93], counter: 'blocks',      ct: [5, 20, 60, 150],  boosts: ['intD'], desc: 'Nothing easy at the rim.' },
  { id: 'glass',   name: 'Glass Cleaner',    icon: 'board',  attr: 'reb',    at: [60, 72, 84, 93], counter: 'rebounds',    ct: [10, 50, 150, 400], boosts: ['reb'], desc: 'Every miss is yours.' },
  { id: 'contact', name: 'Contact Finisher', icon: 'fist',   attr: 'finish', at: [60, 72, 84, 93], counter: 'layups',      ct: [10, 40, 120, 280], boosts: ['finish'], desc: 'Finish through traffic.' },
  { id: 'bully',   name: 'Bully Ball',       icon: 'anchor', attr: 'str',    at: [60, 72, 84, 93], counter: 'posts',       ct: [5, 20, 60, 140],  boosts: ['str'], desc: 'Move bodies in the post.' },
  { id: 'speedy',  name: 'Speed Demon',      icon: 'bolt',   attr: 'speed',  at: [60, 72, 84, 93], counter: 'fastbreaks',  ct: [5, 20, 60, 140],  boosts: ['speed'], desc: 'Nobody beats you down the floor.' },
  { id: 'general', name: 'Floor General',    icon: 'crown',  attr: 'iq',     at: [60, 72, 84, 93], counter: 'wins',        ct: [5, 25, 80, 200],  boosts: ['iq'], desc: 'You see the game in slow motion.' },
  { id: 'ironman', name: 'Iron Man',         icon: 'heart',  attr: 'stam',   at: [60, 72, 84, 93], counter: 'games',       ct: [10, 50, 150, 400], boosts: ['stam'], desc: 'Fatigue hits you slower.' },
  { id: 'charity', name: 'Charity Stripe',   icon: 'ft',     attr: 'ft',     at: [60, 72, 84, 93], counter: 'ftMade',      ct: [10, 50, 150, 400], boosts: ['ft'], desc: 'Steadier aim at the line.' },
  { id: 'pickpocket', name: 'Pickpocket',    icon: 'claw',   attr: 'perD',   at: [66, 78, 88, 96], counter: 'steals',      ct: [5, 20, 60, 150],  boosts: ['steal'], desc: 'Quick hands in the passing lanes.' },
];

/* ---------- DIFFICULTY ---------- */
const DIFFICULTY = {
  // numbers (pct/window/xp/opp) are set from BALANCE.difficulty in js/balance.js
  pro:    { name: 'Pro',          pct: 2,  window: 1.08, xp: 1.0,  opp: -1, desc: 'The intended experience. Fair windows, fair defenders.' },
  hof:    { name: 'Hall of Fame', pct: -7, window: 0.8,  xp: 0.85, opp: 4,  desc: 'Sharper defenders, tight windows, smarter AI. Every bucket is earned.' },
};

/* ---------- PROGRESSION TUNING ----------
   Overall comes from three sources:
   1) Skill Points (levels from XP) spent in UPGRADE — cost rises at 60/75/87, so growth slows as you get good.
   2) Training drills in the hub (minigame quality → 0–3 attribute points per session).
   3) DEVELOPMENT at the end of each career stage: natural growth that closes part of the gap to
      the stage's target Overall. How much of the gap closes depends on how well you played that
      stage (wins, game grades, training) — a great run lands near the target, a poor one well below.
   CURVE = rough Overall targets for a *good* run (not caps — players who grind can beat them). */
const PROGRESSION = {
  xpForLevel: lvl => 80 + 22 * lvl,   // XP needed to go from lvl -> lvl+1
  spPerLevel: 2,                      // skill points per level-up
  upgradeCost: v => (v < 60 ? 1 : v < 75 ? 2 : v < 87 ? 3 : 4), // SP to raise an attribute by +1
  hubActions: 2,                      // training/rest actions per story hub visit
  seasonHubActions: 1,                // actions per week during a season
  trainPoints: 3,                     // max attribute points from one perfect training session
  simXpFactor: 0.4,                   // simulated games give this share of a played game's XP
  CURVE: {
    street: 48,       // end of Chapter 1 (age 16)
    hs_junior: 53,    // after junior year + summer
    highschool: 58,   // end of high school (age 18)
    college: 68,      // end of college / overseas / development league
    rookie: 74,       // end of rookie pro season
    prime: 90,        // prime years: 85–95 for a strong career
    goat: 99,         // only a GOAT-level run (titles, MVPs, elite grades) should touch this
  },
  devMaxGain: { street: 7, hs_junior: 7, highschool: 8, college: 9, rookie: 7, prime: 6, goat: 3 },
  devMinPerf: 0.2,                    // even a bad stage closes 20% of the gap (you still grow up)
};

/* ---------- RECRUITING (high school) ----------
   score → stars. Offers arrive from COLLEGES whose prestige <= your stars. */
const RECRUITING = {
  starAt: [0, 25, 42, 58, 74],        // score needed for 1..5 stars
  // score = (OVR-40)*2.2 + rep*0.15 + season PPG*0.6 + bonuses below
  bonus: { summer_champ: 3, beat_kai: 3, aau_champ: 6, state_champ: 9, city_champ: 4, viral: 4, starter: 3, usa_made: 6, usa_medal: 3, usa_gold: 6 },   // national team results move your Chapter 3 offers
  penalty: { police_record: -5, booster_scandal: -10, benched_fight: -4, usa_cut: -4 },
};

/* ---------- TRAINING DRILLS ----------
   mg: which minigame is played. keys: attributes trained. */
const TRAINING = [
  { id: 'shooting',   name: 'Shooting Drills',   mg: 'shotMeter',     keys: ['three', 'mid', 'ft'],      icon: 'target', desc: 'Spot-up reps until your arms fall off.' },
  { id: 'finishing',  name: 'Finishing at the Rim', mg: 'dunkChain',  keys: ['finish', 'dunk', 'vert'],  icon: 'dunk',   desc: 'Mikan drill, contact layups, dunk lines.' },
  { id: 'handles',    name: 'Handles & Vision',  mg: 'dribbleCombo',  keys: ['handle', 'pass', 'iq'],    icon: 'zigzag', desc: 'Two-ball, cone weaves, reads.' },
  { id: 'defense',    name: 'Defensive Slides',  mg: 'defenseReact',  keys: ['perD', 'intD', 'speed'],   icon: 'lock',   desc: 'Slide, contest, recover. Repeat.' },
  { id: 'strength',   name: 'Weight Room',       mg: 'rebound',       keys: ['str', 'reb', 'stam'],      icon: 'fist',   desc: 'Squats, box-outs, conditioning.' },
  { id: 'film',       name: 'Film & Free Throws', mg: 'freeThrow',    keys: ['iq', 'ft', 'clutch'],      icon: 'eye',    desc: 'Study tendencies. Shoot 100 at the line.' },
];

/* ---------- ACHIEVEMENTS ----------
   check(state) returns true when earned. Checked after games and events. */
const ACHIEVEMENTS = [
  { id: 'first_win',   name: 'First Dub',         desc: 'Win your first game.',                     check: s => s.counters.wins >= 1 },
  { id: 'first_dunk',  name: 'Lift Off',          desc: 'Throw down your first dunk.',              check: s => s.counters.dunks >= 1 },
  { id: 'posterizer',  name: 'Poster Child',      desc: 'Posterize 5 defenders.',                   check: s => s.counters.posterizers >= 5 },
  { id: 'clutch_gene', name: 'Clutch Gene',       desc: 'Hit a game-winning shot.',                 check: s => s.counters.gameWinners >= 1 },
  { id: 'perfect',     name: 'Perfect Release',   desc: 'Hit 10 perfect-release shots.',            check: s => s.counters.perfects >= 10 },
  { id: 'aplus',       name: 'Masterclass',       desc: 'Earn an A+ game grade.',                   check: s => s.counters.aPlus >= 1 },
  { id: 'thirty',      name: 'Thirty Bomb',       desc: 'Score 30+ in a single game.',              check: s => s.counters.best >= 30 },
  { id: 'rival_beat',  name: 'Kai Who?',          desc: 'Beat your rival head-to-head.',            check: s => !!s.flags.beat_kai },
  { id: 'summer_jam',  name: 'Summer Jam Champ',  desc: 'Win the Halsey Summer Jam.',               check: s => !!s.flags.summer_champ },
  { id: 'scouted',     name: 'On the Radar',      desc: 'Get noticed by a scout.',                  check: s => !!s.flags.scouted },
  { id: 'ovr50',       name: 'Rising',            desc: 'Reach 50 Overall.',                        check: s => Engine.ovr(s) >= 50 },
  { id: 'ovr60',       name: 'Somebody',          desc: 'Reach 60 Overall.',                        check: s => Engine.ovr(s) >= 60 },
  { id: 'ovr70',       name: 'Pro Ready',         desc: 'Reach 70 Overall.',                        check: s => Engine.ovr(s) >= 70 },
  { id: 'ovr80',       name: 'Star Power',        desc: 'Reach 80 Overall.',                        check: s => Engine.ovr(s) >= 80 },
  { id: 'ovr90',       name: 'Superstar',         desc: 'Reach 90 Overall.',                        check: s => Engine.ovr(s) >= 90 },
  { id: 'ovr99',       name: 'GOAT Status',       desc: 'Reach 99 Overall.',                        check: s => Engine.ovr(s) >= 99 },
  { id: 'badge_gold',  name: 'Gold Standard',     desc: 'Own a Gold badge.',                        check: s => Engine.badges(s).some(b => b.tier >= 3) },
  { id: 'badge5',      name: 'Badge Collector',   desc: 'Own 5 badges.',                            check: s => Engine.badges(s).length >= 5 },
  { id: 'gym_rat',     name: 'Gym Rat',           desc: 'Complete 15 training sessions.',           check: s => s.counters.trainings >= 15 },
  { id: 'varsity',     name: 'Varsity',           desc: 'Earn a varsity starting spot.',             check: s => !!s.flags.starter },
  { id: 'offer1',      name: 'First Offer',       desc: 'Receive your first college offer.',        check: s => !!(s.recruit && s.recruit.offers.length) },
  { id: 'fourstar',    name: 'Blue Chip',         desc: 'Become a 4-star recruit.',                 check: s => !!(s.recruit && s.recruit.stars >= 4) },
  { id: 'fivestar',    name: 'Five-Star',         desc: 'Become a 5-star recruit.',                 check: s => !!(s.recruit && s.recruit.stars >= 5) },
  { id: 'viral',       name: 'Gone Viral',        desc: 'Have a highlight go viral.',               check: s => !!s.flags.viral },
  { id: 'aau_champ',   name: 'Peach Slam Champ',  desc: 'Win the Peach Slam AAU title.',            check: s => !!s.flags.aau_champ },
  { id: 'city_champ',  name: 'City Champs',       desc: 'Win the junior-year City Playoffs.',       check: s => !!s.flags.city_champ },
  { id: 'state_champ', name: 'State Champion',    desc: 'Win the state championship.',              check: s => !!s.flags.state_champ },
  { id: 'loyal',       name: 'Ride or Die',       desc: 'Max out your friendship with Tariq.',      check: s => (s.rel.tariq || 0) >= 90 },
];

/* ---------- SHOP ----------
   slot items are equippable cosmetics (shown on your avatar). boost = small attribute bonus while equipped.
   consumables apply fx immediately. */
const SHOP = [
  { id: 'hb_red',     cat: 'Accessories', slot: 'headband', name: 'Red Headband',        price: 25,  look: { headband: '#ef4444' } },
  { id: 'hb_white',   cat: 'Accessories', slot: 'headband', name: 'White Headband',      price: 25,  look: { headband: '#f8fafc' } },
  { id: 'hb_black',   cat: 'Accessories', slot: 'headband', name: 'Black Headband',      price: 25,  look: { headband: '#111827' } },
  { id: 'sl_black',   cat: 'Accessories', slot: 'sleeve',   name: 'Black Arm Sleeve',    price: 40,  look: { sleeve: '#111827' } },
  { id: 'sl_white',   cat: 'Accessories', slot: 'sleeve',   name: 'White Arm Sleeve',    price: 40,  look: { sleeve: '#f1f5f9' } },
  { id: 'wr_gold',    cat: 'Accessories', slot: 'wrist',    name: 'Gold Wristbands',     price: 30,  look: { wrist: '#facc15' } },
  { id: 'wr_red',     cat: 'Accessories', slot: 'wrist',    name: 'Red Wristbands',      price: 30,  look: { wrist: '#dc2626' } },
  { id: 'goggles',    cat: 'Accessories', slot: 'goggles',  name: 'Sport Goggles',       price: 80,  look: { goggles: true }, boost: { three: 1 } },
  { id: 'chain',      cat: 'Accessories', slot: 'chain',    name: '"Gold" Chain (fake)', price: 60,  look: { chain: true } },
  { id: 'sh_low_wht', cat: 'Shoes', slot: 'shoes', name: 'Court Lows — Cloud',    price: 90,  look: { shoes: 'low', shoeColor: '#f8fafc' }, boost: { speed: 1 } },
  { id: 'sh_hi_red',  cat: 'Shoes', slot: 'shoes', name: 'Hi-Tops — "Bred"',      price: 120, look: { shoes: 'high', shoeColor: '#dc2626' }, boost: { vert: 1 } },
  { id: 'sh_mid_blk', cat: 'Shoes', slot: 'shoes', name: 'Mids — Shadow',         price: 100, look: { shoes: 'mid', shoeColor: '#1f2937' }, boost: { handle: 1 } },
  { id: 'sh_mid_vlt', cat: 'Shoes', slot: 'shoes', name: 'Mids — Volt',           price: 110, look: { shoes: 'mid', shoeColor: '#a3e635' }, boost: { finish: 1 } },
  { id: 'ice',        cat: 'Recovery', consumable: true, name: 'Ice Bath',               price: 20, fx: { fatigue: -30 }, desc: '−30 Fatigue' },
  { id: 'protein',    cat: 'Recovery', consumable: true, name: 'Protein Shakes (week)',  price: 35, fx: { fatigue: -10, attrs: { str: 1 } }, desc: '−10 Fatigue, +1 Strength' },
  { id: 'film',       cat: 'Recovery', consumable: true, name: 'Pro Game Film Pack',     price: 50, fx: { attrs: { iq: 1 }, xp: 40 }, desc: '+1 IQ, +40 XP' },
];
const SHOP_BY_ID = Object.fromEntries(SHOP.map(i => [i.id, i]));
