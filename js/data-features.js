/* =====================================================================
   DATA-FEATURES.JS — every unlockable feature, when it switches on, and its data.
   Logic + screens: js/features.js. Numbers that change success % live in js/balance.js.

   FEATURES: one entry per feature, in unlock order.
     id, name, icon (emoji), chapter (label), tab (hub tab id, or null), color
     when:  conditions, ALL must hold (an empty object = always):
            chapter:'id'     — you've reached that chapter (CHAPTER_ORDER). A chapter that isn't in the game yet
                               never matches, so future-chapter features switch on by themselves once it's built.
            flag:'x'|[..]    — story flags · anyFlag:[..] — at least one
            minLevel:n · minCount:{counter:n} · minFans:n · usaCamp:true (you're at the national team camp)
            anyOf:[{..},{..}] — any one of these condition sets
     what:  the one-screen explanation for the "NEW FEATURE UNLOCKED" cinematic: [title line, ...3 bullets]
   ===================================================================== */
const CHAPTER_ORDER = ['street', 'highschool', 'usa', 'college', 'draft', 'pro'];   // 'usa' is the optional interlude; 'college', 'draft', 'pro' = Chapters 3–5

const FEATURES = [
  { id: 'rep_map', name: 'Court Rep Map', icon: '🗺', chapter: 'Chapter 1', tab: 'repmap', color: '#f97316',
    when: { minCount: { games: 1 } },
    what: ['Every court has a legend. Take his crown.', 'Challenge a court legend to 1-on-1, first to 11 (uses 1 action).', 'Beat him for Rep and fans, and the next court on the map opens up.', 'Six courts, six legends. Find them in the Rep Map tab.'] },
  { id: 'celebrations', name: 'Celebrations', icon: '🕺', chapter: 'All chapters', tab: 'celebs', color: '#ec4899',
    when: { anyOf: [{ minLevel: 3 }, { minCount: { wins: 2 } }] },
    what: ['Make a play? Let them know.', 'Pick your celebration in the Celebrations tab.', 'It plays after your big buckets in matches and arcade games.', 'Unlock more by leveling up and winning big games.'] },
  { id: 'playbook', name: 'Playbook', icon: '📋', chapter: 'Chapter 2', tab: 'playbook', color: '#38bdf8',
    when: { chapter: 'highschool' },
    what: ['Your coach has a playbook. Learn it.', 'Practice with Coach in the hub (1 action) to learn one set play at a time.', 'Learned plays show up as new options when you have the ball.', 'Each play has its own % and its own animation.'] },
  { id: 'mixtape', name: 'Highlight Mixtape', icon: '📼', chapter: 'Chapter 2', tab: 'mixtape', color: '#a855f7',
    when: { chapter: 'highschool', minCount: { games: 4 } },
    what: ['The cameras are rolling. Every game.', 'Your best plays are saved to your mixtape on their own.', 'Release it once a season from the Mixtape tab.', 'Better clips = a bigger jump in recruit ranking, followers and Rep.'] },
  { id: 'chemistry', name: 'Chemistry Links', icon: '🔗', chapter: 'Youth National Team', tab: 'chem', color: '#22c55e',
    when: { usaCamp: true },
    what: ['Some teammates just get you.', 'Play with them and build a link (matches, assists, story choices).', 'Max a link to unlock a duo move with that teammate.', 'Duo moves show up in matches and arcade games when he\'s on the floor.'] },
  { id: 'jelly', name: 'Jelly Layups', icon: '🍯', chapter: 'Youth National Team', tab: 'playbook', color: '#facc15',
    when: { flag: 'jelly' },
    what: ['You can\'t go through him. Go around him.', 'After you beat your man, pick JELLY when help or a big is coming.', 'In the air: flick it to the side AWAY from his arm (← / →), then tap at the glass.', 'Arcade: drive at the rim with a defender close, hold MOVE and shoot.'] },
  { id: 'weapon_training', name: 'Weapon Training', icon: '🥋', chapter: 'Chapter 3', tab: 'mentor', color: '#f43f5e',
    when: { chapter: 'college' },
    what: ['Scoop DeLuca is back. And he brought homework.', 'Mentor missions teach you new weapons and upgrade the ones you have.', 'Level up the jelly: Reverse Jelly, then Under-the-Arm.', 'Find your missions in the Mentor tab.'] },
  { id: 'combine', name: 'Combine Leaderboard', icon: '⏱', chapter: 'Chapter 4', tab: 'combine', color: '#eab308',
    when: { chapter: 'draft' },
    what: ['Every scout in the league is holding a stopwatch.', 'Run the combine events: sprint, vertical, shooting, agility.', 'See where you rank against this draft class.', 'Beat an all-time record and the whole league hears about it.'] },
  { id: 'shoe', name: 'Signature Shoe', icon: '👟', chapter: 'Chapter 5', tab: 'shoe', color: '#14b8a6',
    when: { chapter: 'pro' },
    what: ['A shoe company wants your name on a sneaker.', 'Design it: silhouette, colors, logo, name.', 'Wear it on your avatar and in the media.', 'Sales bring money and fans every season — so play like a star.'] },
  { id: 'rivalry', name: 'Rivalry System', icon: '⚔', chapter: 'Chapter 5', tab: 'rivals', color: '#ef4444',
    when: { chapter: 'pro' },
    what: ['Some games are personal.', 'Rivals build heat from trash talk, big games and how you play them.', 'Grudge matches open with a face-off and get their own story beats.', 'Track every rivalry in the Rivals tab.'] },
];
const FEATURE_BY_ID = Object.fromEntries(FEATURES.map(f => [f.id, f]));

/* ---------- Chapter 1 · COURT REP MAP ----------
   Courts in order; beat the legend to open the next one. rel = his rating relative to your Overall when you play him.
   rep / fans / xp = the prize. The 1-on-1 is a full arcade game (first to `to`). */
const COURT_LEGENDS = [
  { court: 'street_night', id: 'lg_riggs', name: 'Old Man Riggs', title: 'King of Halsey Street', rel: -2, to: 11, rep: 3, fans: 400, xp: 70,
    look: { skin: '#5a3420', hair: 'bald', hairColor: '#d6d3d1', beard: 'full', build: 'strong', jersey: '#57534e', trim: '#facc15', num: 0 }, weapons: ['post_fade'],
    intro: 'Forty-nine years old. Never lost on this court.', taunt: 'Young legs. Old tricks. Ball\'s yours, rookie.', beat: 'Hm. Tell \'em Riggs said you\'re alright.' },
  { court: 'park_day', id: 'lg_sunny', name: 'Sunny Diaz', title: 'The Park\'s Sharpshooter', rel: 0, to: 11, rep: 3, fans: 600, xp: 80,
    look: { skin: '#c68a5c', hair: 'ponytail', hairColor: '#1c1917', headband: '#f97316', jersey: '#f97316', trim: '#f8fafc', num: 30 }, weapons: ['logo_three'],
    intro: 'Shoots from the parking lot. Makes it.', taunt: 'Stay close. Doesn\'t matter.', beat: 'Okay, you can guard. Respect.' },
  { court: 'cage', id: 'lg_warden', name: 'The Warden', title: 'Nobody Leaves the Cage', rel: 2, to: 11, rep: 4, fans: 900, xp: 95,
    look: { skin: '#8d5a3b', hair: 'buzz', hairColor: '#0f0d0c', build: 'strong', jersey: '#111827', trim: '#ef4444', num: 99 }, weapons: ['destroyer', 'hammer_board'],
    intro: 'Six-nine. No fouls in the Cage. Bring a mouthguard.', taunt: 'In here, I make the rules.', beat: 'Get out of my cage. …Come back tomorrow.' },
  { court: 'rooftop', id: 'lg_shay', name: 'Skyline Shay', title: 'Forty Floors Up', rel: 3, to: 11, rep: 4, fans: 1400, xp: 110,
    look: { skin: '#6b3d25', hair: 'braids', hairColor: '#0f0d0c', jersey: '#7c3aed', trim: '#f8fafc', num: 1, build: 'lean' }, weapons: ['lightning_dribble', 'step_back'],
    intro: 'Handles like a magician. Twelve million views.', taunt: 'Smile — you\'re about to be in my next video.', beat: 'Delete that. Delete all of that.' },
  { court: 'beach', id: 'lg_benny', name: 'Boardwalk Benny', title: 'Sand King', rel: 4, to: 11, rep: 5, fans: 2000, xp: 125,
    look: { skin: '#eac4a6', hair: 'curly', hairColor: '#facc15', jersey: '#0ea5e9', trim: '#facc15', num: 8, sleeve: '#f8fafc' }, weapons: ['floater', 'euro_step'],
    intro: 'Plays barefoot. Has never once been tired.', taunt: 'Sand\'s slow, bro. I\'m not.', beat: 'The tide always turns. Today it turned on me.' },
  { court: 'rain_night', id: 'lg_vane', name: '"Monsoon" Marcus Vane', title: 'The Last Legend', rel: 6, to: 11, rep: 7, fans: 4000, xp: 160,
    look: { skin: '#4a2a19', hair: 'dreads', hairColor: '#0f0d0c', beard: 'goatee', jersey: '#0f172a', trim: '#38bdf8', num: 23, build: 'strong' }, weapons: ['vanishing_drive', 'chase_block'],
    intro: 'Played overseas ten years. Came home to run the rain games.', taunt: 'Rain don\'t stop. Neither do I.', beat: 'The city\'s yours now. Don\'t waste it.' },
];

COURT_LEGENDS.forEach(g => { PLAYER_WEAPONS[g.name] = g.weapons; });

/* ---------- Chapter 2 · PLAYBOOK ----------
   Set plays your coach teaches one at a time (hub: Practice with Coach). Each is a new option on offense.
   action = how the shot is graded (BALANCE.actions) · bonus = the play's built-in edge (%)
   contest = the look it creates · anim = the court animation · fit = positions it suits (+2% for them) */
const PLAYBOOK = [
  { id: 'pnr', name: 'Pick-and-Roll', icon: '🧱', action: 'layup', bonus: 5, contest: 'normal', anim: 'screen', fit: ['PG', 'SG'],
    desc: 'The big sets a screen. Turn the corner and attack the switch.', coach: 'Use the screen. Shoulder to hip, then go.' },
  { id: 'backdoor', name: 'Backdoor Cut', icon: '🚪', action: 'layup', bonus: 8, contest: 'open', anim: 'backdoor', fit: ['SG', 'SF'],
    desc: 'Your man overplays the pass. Cut behind him for the bounce pass.', coach: 'He\'s denying you? Good. Go behind him.' },
  { id: 'iso', name: 'Isolation', icon: '🎯', action: 'pull3', bonus: 3, contest: 'normal', anim: 'clear', fit: ['SG', 'SF', 'PG'],
    desc: 'Everybody clears out. You, him and a whole side of the floor.', coach: 'Clear it out. Your best move, one on one.' },
  { id: 'post_entry', name: 'Post Entry', icon: '⚓', action: 'hook', bonus: 6, contest: 'normal', anim: 'post', fit: ['PF', 'C', 'SF'],
    desc: 'Seal him on the block and call for the entry pass.', coach: 'Wide base. Arm bar. Show the passer a target.' },
  { id: 'flare', name: 'Flare Screen', icon: '↗', action: 'catch3', bonus: 6, contest: 'open', anim: 'flare', fit: ['SG', 'SF'],
    desc: 'A screen away from the ball. Fade to the wing for an open three.', coach: 'Set him up, then drift. The ball will find you.' },
  { id: 'horns', name: 'Horns', icon: '🐂', action: 'catchMid', bonus: 7, contest: 'open', anim: 'horns', fit: ['PF', 'C', 'PG'],
    desc: 'Two bigs at the elbows. Pick a side — someone\'s open.', coach: 'Horns is a read. Make the right one.' },
];

/* ---------- Youth National Team · CHEMISTRY LINKS ----------
   Link points: +2 per game together, +1 per assist to him (max 3 a game), story choices (rel). Unlock at `need`.
   move = the duo play: action (how it's graded), bonus (%), arcade = what happens in arcade games. */
const CHEM_DUOS = [
  { id: 'dre', name: 'Andre "Dre" Castillo', short: 'Dre', need: 8, move: 'Give-and-Go', icon: '🔁', action: 'layup', bonus: 9, arcade: 'giveandgo',
    desc: 'Hit Dre, cut hard, get it right back at the rim.' },
  { id: 'jet', name: 'Jalen "Jet" Brooks', short: 'Jet', need: 8, move: 'Jet Lob', icon: '🚀', action: 'dunk', bonus: 8, arcade: 'alleyoop',
    desc: 'Throw it up anywhere near the rim. Jet goes and gets it.' },
  { id: 'okafor', name: 'Malik Okafor', short: 'Malik', need: 9, move: 'High-Low', icon: '⬇', action: 'dunk', bonus: 10, arcade: 'alleyoop',
    desc: 'Flash to the high post, drop it to Malik sealing under the rim.' },
  { id: 'milo', name: 'Milo Park', short: 'Milo', need: 8, move: 'Drive & Kick', icon: '🎯', action: 'catch3', bonus: 5, arcade: 'kick',
    desc: 'Collapse the defense, kick it to your roommate in the corner.' },
  { id: 'kai', name: 'Kai Sterling', short: 'Kai', need: 12, move: 'Two-Man Game', icon: '👑', action: 'pull3', bonus: 11, arcade: 'giveandgo',
    desc: 'The two best players in the class, finally on the same side.' },
];

/* ---------- All chapters · CELEBRATIONS ----------
   pose = sprite animation (js/pixel.js) · when = unlock conditions (same format as FEATURES.when) */
const CELEBRATIONS = [
  { id: 'flex', name: 'The Flex', pose: 'flex', when: {}, desc: 'Both arms. Every muscle.' },
  { id: 'point', name: 'Point to the Crowd', pose: 'point', when: {}, desc: 'That one was for them.' },
  { id: 'thump', name: 'Chest Thump', pose: 'thump', when: { minLevel: 5 }, desc: 'Heart of a champion. Loudly.' },
  { id: 'clap', name: 'Slow Clap', pose: 'clap', when: { minCount: { wins: 6 } }, desc: 'Applauding yourself. Bold.' },
  { id: 'joy', name: 'Leap of Joy', pose: 'joy', when: { minCount: { gameWinners: 1 } }, desc: 'Unlocked by hitting a game-winner.' },
  { id: 'chestbump', name: 'Air Chest Bump', pose: 'chestbump', when: { minCount: { posterizers: 2 } }, desc: 'Unlocked by posterizing two defenders.' },
  { id: 'scream', name: 'The Scream', pose: 'celebrate', when: { anyFlag: ['summer_champ', 'city_champ', 'state_champ', 'beat_kai', 'usa_made'] }, desc: 'Unlocked by a title, beating Kai or making the national team.' },
  { id: 'jelly_wave', name: 'The Jelly Wave', pose: 'point', jelly: true, when: { minCount: { jellies: 3 } }, desc: 'Wave goodbye. Unlocked by hitting three jellies.' },
];

/* ---------- Chapter 2 · MIXTAPE ----------
   Clips are saved automatically after every game (best 12 kept). Release once per season:
   score = sum of the best 8 clips; boosts scale with it. */
const MIXTAPE = {
  keep: 12, release: 8, minClips: 3,
  clipValue: { poster: 9, gameWinner: 10, jelly: 8, dunk: 5, three: 3, deep: 6, ankles: 6, block: 5, alleyoop: 6, buzzer: 9, halfcourt: 12, duo: 6, legend: 7, weapon: 5, bigGame: 4 },
  boost: { recruit: .18, fans: 900, rep: .12 },   // × mixtape score
  titles: ['Certified', 'Day One', 'No Days Off', 'Concrete to Hardwood', 'Built Different', 'The Proof', 'Film Don\'t Lie', 'Main Character'],
};

/* ---------- Chapter 3 · WEAPON TRAINING (ready for when Chapter 3 is built) ----------
   mentor = Scoop DeLuca. Each mission is a drill node the mentor runs; a pass teaches / ranks up a weapon or levels the jelly. */
const WEAPON_TRAINING = {
  mentor: 'sal',
  missions: [
    { id: 'wt_jelly1', name: 'Hands of Silk', teaches: 'jelly', level: 0, need: { minLevel: 1 }, drill: 'flick', desc: 'Learn the jelly (if the national team never taught you).' },
    { id: 'wt_floater', name: 'The Teardrop', teaches: 'floater', need: { minLevel: 8 }, drill: 'drive', desc: 'Float it over the help before he leaves the floor.' },
    { id: 'wt_euro', name: 'Two-Step Euro', teaches: 'euro_step', need: { minLevel: 10 }, drill: 'drive', desc: 'Sell one way, step the other, finish soft.' },
    { id: 'wt_jelly2', name: 'Reverse Jelly', teaches: 'jelly', level: 1, need: { minCount: { jellies: 5 } }, drill: 'flick', desc: 'Go under the rim and flick it back up the other side.' },
    { id: 'wt_rank', name: 'Sharpen the Blade', upgrades: true, need: { minLevel: 12 }, drill: 'shotMeter', desc: 'Rank up any weapon for free.' },
    { id: 'wt_jelly3', name: 'Under-the-Arm Jelly', teaches: 'jelly', level: 2, need: { minCount: { jellies: 12 } }, drill: 'flick', desc: 'Through the smallest window in basketball.' },
  ],
};

/* ---------- Chapter 4 · COMBINE LEADERBOARD (ready for Chapter 4) ----------
   unit / better: 'low' (times) or 'high'. draftClass = how many prospects you're ranked against. record = all-time best. */
const COMBINE = {
  draftClass: 60,
  events: [
    { id: 'sprint', name: '3/4 Court Sprint', unit: 's', better: 'low', avg: 3.30, sd: .12, record: { v: 2.98, by: 'D. Swift (2009)' }, mg: 'dribbleCombo', stat: 'speed' },
    { id: 'lane', name: 'Lane Agility', unit: 's', better: 'low', avg: 11.2, sd: .45, record: { v: 9.65, by: 'J. Vale (2014)' }, mg: 'defenseReact', stat: 'speed' },
    { id: 'vert', name: 'Max Vertical', unit: '"', better: 'high', avg: 35, sd: 3, record: { v: 46.5, by: 'K. Archer (2001)' }, mg: 'dunkChain', stat: 'vert' },
    { id: 'shoot', name: 'Spot-Up Shooting', unit: '/25', better: 'high', avg: 15, sd: 3, record: { v: 25, by: 'M. Reyes (1998)' }, mg: 'shotMeter', stat: 'three' },
    { id: 'bench', name: 'Bench Press (185 lb)', unit: ' reps', better: 'high', avg: 9, sd: 4, record: { v: 27, by: 'T. Banks (2006)' }, mg: 'strengthPush', stat: 'str' },
  ],
};

/* ---------- Chapter 5 · SIGNATURE SHOE (ready for Chapter 5) ---------- */
const SHOE = {
  silhouettes: [{ id: 'low', name: 'Low-Top Runner' }, { id: 'mid', name: 'Mid Court' }, { id: 'high', name: 'High-Top Classic' }],
  logos: ['bolt', 'crown', 'flame', 'star', 'wing'],
  baseSales: 40000, perFan: .02, perOvr: 900, price: 12,   // pairs a season = base + fans × perFan + (Overall − 70) × perOvr · money = pairs × price
  fansPer: .15,                                            // new fans per pair sold
};

/* ---------- Chapter 5 · RIVALRIES (ready for Chapter 5) ---------- */
const RIVALRY = {
  heat: { trash: 8, loss: 12, win: 6, poster: 10, blocked: 10, choke: 15 },   // heat added per event
  grudge: 40,                                                                  // heat that turns the next meeting into a grudge match
  faceOff: true,                                                               // grudge matches open with a face-off cutscene
  bonus: { win: { rep: 6, fans: 5000 }, loss: { morale: -6 } },
};

/* ---------- JELLY LAYUP: commentary, feed, NPC weapon ---------- */
WEAPONS.jelly_layup = { name: 'Jelly Layup', rarity: 'epic', type: 'drive', charge: 3, icon: 'yin', learn: true, story: true, stats: { finish: .55, handle: .3, vert: .15 }, desc: 'Flick it off the glass, away from the shot blocker\'s arm.' };
Object.assign(PLAYER_WEAPONS, {
  'Kai Sterling': (PLAYER_WEAPONS['Kai Sterling'] || ['step_back']).filter(id => id !== 'jelly_layup').concat('jelly_layup'),   // the class's best player has one too
  'Lachie Doyle': ['lightning_dribble', 'jelly_layup'], 'Tomás Ferraro': ['step_back', 'jelly_layup'], 'Marc Ribera': ['no_look', 'jelly_layup'],
  'Skyline Shay': ['lightning_dribble', 'jelly_layup'],
});
STORY.commentary.jelly_make = [
  'JELLY! {me} flicks it off the glass and the big man swats air!',
  'Oh, that is FILTHY. {me} with the jelly — wrong hand, right side.',
  'He went around him! {me} kisses it off the glass. Unreal.',
  'JELLY! The whole bench is on the floor!',
];
STORY.commentary.jelly_miss = ['{me} tries to get cute with the jelly — rolls off.', 'The flick is a hair too strong. Off the rim.'];
STORY.commentary.jelly_block = ['{me} flicks it right into his hand. Rejected.', 'Wrong side! He reads the jelly and swats it.'];
STORY.feedTemplates.jelly = [
  ['courtvision', '🍯 JELLY ALERT. {name} just made a 7-footer look silly. Run it back.'],
  ['nia', 'my brother does the JELLY now?? who taught him that 😭'],
  ['streetball', 'The {name} jelly is the smoothest finish in the class. Not close.'],
];

/* ---------- JELLY STORY (spliced into the national team camp, js/data-usa.js) ---------- */
Object.assign(STORY.characters, {
  sal: { name: 'Sal "Scoop" DeLuca', short: 'Scoop', role: 'Assistant coach · 5\'9" point guard, 11 years overseas', color: '#f59e0b',
         look: { skin: '#e0b48a', hair: 'bald', hairColor: '#a8a29e', beard: 'goatee', outfit: 'tracksuit', jersey: '#1e3a8a', trim: '#f59e0b' } },
  ike: { name: 'Isaiah "Big Ike" Grant', short: 'Big Ike', role: 'Memphis · 7\'1" rim protector', color: '#64748b',
         look: { skin: '#3b2416', hair: 'buzz', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#f8fafc', trim: '#1e3a8a', num: 50, build: 'strong' } },
  bakari: { name: 'Yanis Bakari', short: 'Bakari', role: 'France U19 · 7\'0" shot blocker', color: '#1d4ed8',
         look: { skin: '#4a2a19', hair: 'fade', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#1d4ed8', trim: '#f8fafc', num: 15, build: 'strong' } },
});
if (STORY.chapters.usa) {
  const N = STORY.chapters.usa.nodes;
  Object.assign(N, {
    jelly_stuffed: { scene: 'gym',
      lines: [
        ['narrator', 'Third quarter. You blow past Jet and rise for the layup —'],
        ['ike', 'GET THAT OUTTA HERE!', 'fierce'],
        ['narrator', 'Big Ike sends it into the bleachers. Two trips later, he does it again.'],
        ['kai', '(laughing) Seven-one, bro. What was the plan?', 'smile'],
      ], next: 'jelly_meet' },
    jelly_meet: { scene: 'gym', fx: { flag: 'jelly_met' },
      lines: [
        ['sal', 'Hey. Number {num}. C\'mere.'],
        ['sal', 'You can\'t go through him. Go around him.'],
        ['sal', 'I was five-nine and played eleven years in Europe. Find me tonight. Court two.', 'smile'],
      ],
      choices: [
        { t: '"I\'ll be there."', fx: { rel: { sal: 4 }, camp: 1 }, next: 'cut1_pre' },
        { t: '"Next time I\'m dunking on him."', fx: { rel: { sal: -1 }, morale: 2 }, next: 'jelly_meet2' },
      ] },
    jelly_meet2: { scene: 'gym',
      lines: [['sal', 'Sure you are. Court two. Eleven o\'clock.', 'smile']], next: 'cut1_pre' },
    jelly_lesson_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Eleven p.m. Court two. One light on, one ball, one old man.'],
        ['sal', 'A shot blocker jumps at the ball. So you hide the ball.'],
        ['sal', 'His arm comes up one side. You flick it off the glass on the OTHER side. Soft.'],
      ], next: 'jelly_lesson' },
    jelly_lesson: { type: 'flick', scene: 'gym', title: 'COURT TWO · THE JELLY', coach: 'sal', reps: 6, need: 2, win: 'jelly_learned' },
    jelly_learned: { scene: 'gym', fx: { flag: 'jelly', rel: { sal: 5 }, attrs: { finish: 1 }, xp: 120, log: 'Learned the jelly layup from Scoop DeLuca.' },
      lines: [
        ['sal', 'THERE it is. Feel that? That\'s a jelly.', 'smile'],
        ['sal', 'Don\'t show it yet. Wait till the big man commits.'],
      ], next: 'jelly_scrim_pre' },
    jelly_scrim_pre: { scene: 'gym',
      lines: [['reyes', 'Morning run. Ten minutes, live. Ike, you\'re protecting the rim.'], ['ike', '(to you) Back for more?', 'fierce']], next: 'jelly_scrim' },
    jelly_scrim: { type: 'match', us: 'usa_red', them: 'usa_white', ratingRel: 3, mateRel: 1, moments: 5, level: 'hs', importance: 1, venue: 'usa_center', camp: true,
      jellyMoment: { text: 'You turn the corner. Big Ike is waiting at the rim — arms up, eyes on the ball.', by: 'Isaiah "Big Ike" Grant', first: true },
      title: 'Morning Run', sub: 'Red vs White · 10 minutes', win: 'jelly_check', lose: 'jelly_check' },
    jelly_check: { type: 'branch', branches: [{ if: { flag: 'jelly_dropped' }, next: 'jelly_drop' }], else: 'jelly_notyet' },
    jelly_drop: { scene: 'gym', fx: { camp: 2, rep: 2, rel: { sal: 3 } },
      lines: [
        ['narrator', 'The gym goes silent for a second. Then the whole Red bench is on the floor.'],
        ['ike', '…Where did the ball GO?', 'sad'],
        ['jet', 'BRO. BRO. Do it again!', 'smile'],
        ['sal', '(from the sideline, not looking up) Told you. Around him.', 'smile'],
      ], next: 'day3_drills' },
    jelly_notyet: { scene: 'gym',
      lines: [['sal', 'You had it and didn\'t pull it. Or you pulled it and missed. Either way — again.'], ['sal', 'Next time the big man comes, you flick it. No thinking.']], next: 'day3_drills' },
    /* cut path: Scoop catches you in the parking lot */
    jelly_cut_check: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: 'jelly_cut_bye' }, { if: { flag: 'jelly_met' }, next: 'jelly_cut_lesson_pre' }], else: 'cut_lou' },
    jelly_cut_lesson_pre: { scene: 'street_night',
      lines: [
        ['narrator', 'Parking lot, 6 a.m. Your bag\'s in the trunk. Somebody\'s dribbling on the outdoor hoop.'],
        ['sal', 'You were gonna leave without your lesson? Ten minutes. Grab a ball.', 'smile'],
      ], next: 'jelly_cut_lesson' },
    jelly_cut_lesson: { type: 'flick', scene: 'street_night', title: 'PARKING LOT · THE JELLY', coach: 'sal', reps: 6, need: 2, venue: 'street_night', win: 'jelly_cut_learned' },
    jelly_cut_learned: { scene: 'street_night', fx: { flag: ['jelly', 'jelly_payoff'], rel: { sal: 6 }, attrs: { finish: 1 }, xp: 120, log: 'Scoop DeLuca taught you the jelly before you left camp.' },
      lines: [
        ['sal', 'That\'s it. Now you\'ve got something they don\'t.', 'smile'],
        ['sal', 'Next big game, a big man\'s gonna jump at you. Make him remember your name.'],
      ], next: 'cut_lou' },
    jelly_cut_bye: { scene: 'street_night', fx: { flag: 'jelly_payoff', rel: { sal: 3 } },
      lines: [['sal', '(a text) Cut\'s not the end. You\'ve got the jelly. Next big game — use it.']], next: 'cut_lou' },
  });
  // splice: Ike stuffs you in the day-2 scrimmage → the lesson after the first cut → the morning run → day 3; cut → parking-lot lesson
  N.day2_scrim_win.next = 'jelly_stuffed'; N.day2_scrim_loss.next = 'jelly_stuffed';
  N.cut1_safe.next = 'jelly_lesson_pre';
  N.cut_home.next = 'jelly_cut_check';
  // the tournament payoff: a key jelly over France's 7-footer in the final
  if (N.final) N.final.jellyMoment = { text: 'Fourth quarter. You turn the corner and Yanis Bakari — seven feet of French wingspan — leaves his man to meet you.', by: 'Yanis Bakari', late: true, payoff: true };
}
