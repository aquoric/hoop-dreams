/* =====================================================================
   DATA-STORY.JS — characters, story chapters, commentary, feed accounts.

   HOW STORY NODES WORK (edit/add freely):
   chapters.<id>.nodes.<nodeId> = {
     scene: 'playground' | 'playground_night' | 'home' | 'rec' | 'party' | 'street_night' | 'hospital',
     lines: [ [speaker, text, expression?, condition?], ... ]
        speaker: a key from STORY.characters, 'narrator', or 'you'
        expression: 'neutral' | 'smile' | 'fierce' | 'sad'
        condition: same format as `req` below — the line only shows if it passes
     fx:   effects applied when the node is entered (see below)
     choices: [ { t:'Button text', fx:{...}, next:'nodeId', req:{...}, hint:'shown tag',
                  check:{ a:'iq' | ['iq','clutch'], dc:50 }, fail:'nodeIdIfCheckFails', failFx:{...} } ]
     next: 'nodeId'      (used when there are no choices -> "Continue")
     type: 'match' | 'hub' | 'branch' | 'ending' | 'chapterEnd'   (default: dialogue)
   }
   EFFECTS (fx): attrs:{three:2}, xp, sp, rep, fans, trust, chem, morale, fatigue, money,
                 rel:{kai:-5}, flag:'x' | ['x','y'], unflag, injury:{games,name}, log:'text',
                 post:{ by:'courtvision', text:'...' }   (adds a social-feed post)
   REQUIREMENTS / CONDITIONS: { flag, notFlag, minOvr, money, minRep, rel:{id:min}, maxRel, attr:{k:min}, arch, pos }
   Text tokens: {first} {last} {name} {hometown} {num} {pos} {posName} {height} {arch} {sig} {ovr}
   ===================================================================== */

const STORY = {};

/* ---------- CHARACTERS (portraits are generated from `look`) ----------
   look.skin 'family' = same skin tone as the player. */
STORY.characters = {
  you:    { name: 'You', short: 'You', role: '' },
  lou:    { name: 'Lou Banks', short: 'Lou', role: 'Mentor · Ex-NBL guard', color: '#f59e0b',
            look: { skin: '#6b3d25', hair: 'bald', beard: 'full', hairColor: '#9ca3af', outfit: 'tracksuit', jersey: '#7f1d1d', trim: '#fde68a' } },
  kai:    { name: 'Kai Sterling', short: 'Kai', role: 'Rival · #1 sophomore in the nation', color: '#3b82f6',
            look: { skin: '#d9a77e', hair: 'fade', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#1e3a8a', trim: '#facc15', num: 1, headband: '#facc15', chain: true, build: 'lean' } },
  tariq:  { name: 'Tariq "T-Bone" Miles', short: 'Tariq', role: 'Best friend since 2nd grade', color: '#22c55e',
            look: { skin: '#8a5233', hair: 'afro', hairColor: '#1c1917', outfit: 'tee', jersey: '#16a34a', trim: '#ffffff', build: 'strong' } },
  mom:    { name: 'Mama Jo', short: 'Mom', role: 'Your mom · Night-shift nurse', color: '#ec4899',
            look: { skin: 'family', hair: 'bun', hairColor: '#1c1917', femme: true, outfit: 'tee', jersey: '#be185d', trim: '#fbcfe8' } },
  nia:    { name: 'Nia', short: 'Nia', role: 'Little sister · Self-appointed manager', color: '#a855f7',
            look: { skin: 'family', hair: 'ponytail', hairColor: '#1c1917', femme: true, outfit: 'hoodie', jersey: '#7c3aed', trim: '#f5d0fe', build: 'lean' } },
  dee:    { name: 'Dee Carter', short: 'Dee', role: 'Scout · Elite Hoops Network', color: '#f97316',
            look: { skin: '#c68a5c', hair: 'long', hairColor: '#3b2416', femme: true, outfit: 'suit', jersey: '#1e293b', trim: '#f97316' } },
  marcus: { name: 'Cousin Marcus', short: 'Marcus', role: 'Family. Trouble.', color: '#ef4444',
            look: { skin: '#a86b43', hair: 'braids', hairColor: '#0f0d0c', beard: 'goatee', outfit: 'hoodie', jersey: '#111827', trim: '#ef4444', chain: true } },
  hammer: { name: 'Hammer Jones', short: 'Hammer', role: 'Southside Bricklayers', color: '#b91c1c',
            look: { skin: '#4a2a19', hair: 'buzz', hairColor: '#0f0d0c', beard: 'full', outfit: 'jersey', jersey: '#b91c1c', trim: '#fbbf24', num: 55, build: 'strong' } },
  mc:     { name: 'Megaphone Ray', short: 'Ray', role: 'Voice of the Summer Jam', color: '#eab308',
            look: { skin: '#eac4a6', hair: 'curly', hairColor: '#6b4423', beard: 'mustache', outfit: 'tee', jersey: '#eab308', trim: '#111827' } },
};

/* ---------- SOCIAL FEED ACCOUNTS ---------- */
STORY.accounts = {
  courtvision: { name: 'CourtVision', handle: '@CourtVisionHoops', verified: true, look: { skin: '#a86b43', hair: 'bald', outfit: 'tee', jersey: '#f97316' } },
  streetball:  { name: 'Streets Talk Hoops', handle: '@StreetsTalk', verified: false, look: { skin: '#6b3d25', hair: 'dreads', outfit: 'hoodie', jersey: '#111827' } },
  ehn:         { name: 'Elite Hoops Network', handle: '@EHNscouting', verified: true, look: { skin: '#c68a5c', hair: 'long', femme: true, outfit: 'suit', jersey: '#1e293b' } },
  kai:         { name: 'Kai Sterling', handle: '@KaiSterling1', verified: true, char: 'kai' },
  nia:         { name: 'Nia 💜', handle: '@niaknowsball', verified: false, char: 'nia' },
  tariq:       { name: 'T-Bone', handle: '@tbone_miles', verified: false, char: 'tariq' },
  fan:         { name: 'Halsey Hooper', handle: '@halsey4life', verified: false, look: { skin: '#d9a77e', hair: 'fade', outfit: 'tee', jersey: '#2563eb' } },
};

/* Post-game feed templates by result. {first} {last} {pts} {opp} tokens. */
STORY.feedTemplates = {
  bigWin:  [['courtvision', '{first} {last} with {pts} and the dub vs {opp}. Remember the name. 📈'], ['fan', 'HALSEY STAND UP 🗣️🗣️ {first} was COOKING'], ['streetball', 'Who is {first} {last} and why is nobody talking about this kid?']],
  win:     [['fan', 'W. {first} looked solid today.'], ['tariq', 'my boy {first} different 😤'], ['nia', 'my brother just did THAT. manager fees are going up']],
  loss:    [['streetball', '{first} {last} showed flashes vs {opp}, but flashes don\'t win games.'], ['fan', 'tough L. bounce back {first}']],
  badLoss: [['streetball', '{first} {last} got cooked by {opp} today. Not ready.'], ['fan', 'yikes 😬']],
};

/* ---------- POST-GAME REACTIONS (mentor/coach quote by grade) ---------- */
STORY.reactions = {
  A: ['lou', ['That\'s what I\'m talking about. Now forget it — tomorrow nobody cares.', 'You played the rim, not the man. Proud of you.', 'See? When you stop forcing it, the game comes to you.']],
  B: ['lou', ['Solid, not special. Special is a choice you make in the gym.', 'Good. But you left points on the floor — I counted.']],
  C: ['lou', ['Average. And average is the most crowded place in this city.', 'You got tired and your feet got lazy. Fix it.']],
  F: ['lou', ['Ugly game. Good — ugly games teach the most, if you\'re listening.', 'Get up off the floor and get back in the gym.']],
};

/* ---------- PLAY-BY-PLAY COMMENTARY ----------
   Tokens: {me} your last name, {def} main defender, {mate} teammate, {att}, {sc} shot clock, {n} */
STORY.commentary = {
  setup_wing: ['You catch it on the wing, {def} closing out hard. {sc} on the shot clock.', 'Swing pass finds you on the right wing. {def} is crowding you — {sc} seconds left.', 'You\'re isolated on the wing against {def}. Clock: {sc}.'],
  setup_pnr: ['{mate} sets the screen and {def} ducks under it. {sc} on the clock.', 'High pick-and-roll with {mate}. Defense switches — {sc} seconds.'],
  setup_post: ['You seal deep on the block and the entry pass is in. {sc} on the clock.', 'Back to the basket, low post. You can feel the double coming.'],
  setup_break: ['STEAL! You\'re out in transition with one man back!', 'Long rebound, you\'re off to the races — {def} is the only one back!'],
  setup_catch: ['{mate} drives and the defense collapses — you\'re wide open on the perimeter!', 'Ball reversal — {mate} swings it to you. Feet set, open look!'],
  setup_iso: ['They clear the side — one-on-one with {def}. Go to work.', 'Isolation at the top. {def} is down in a stance, daring you.'],
  setup_passlane: ['You\'ve got the ball up top. The defense is rotating — find the open man.', 'Drive and kick — their help is scrambling. Who\'s open?'],
  setup_ft: ['You\'re fouled on the floor — two shots at the line.', 'Hacked on the way up! You\'re heading to the stripe.'],
  setup_def: ['{def} has it at the top and is coming right at you. Lock in.', 'They\'re hunting the matchup — {def} isolates on you.'],
  setup_help: ['{att} beats his man baseline. You\'re the help.', '{att} is driving the lane hard and you\'re the last line of defense.'],
  setup_lane: ['They\'re swinging the ball around the perimeter. You\'re reading the passer\'s eyes…', 'Their point guard picks up his dribble. Passing lane is open — do you gamble?'],
  setup_oreb: ['Shot goes up from your teammate — crash the glass!', 'Long jumper from your side — box out and attack the rim!'],
  setup_dreb: ['{def} lets it fly — find a body and box out!', 'Shot\'s up from their side. Rebound battle!'],
  three_make: ['{me} from DOWNTOWN! Bang!', 'SPLASH! {me} buries the three!', '{me} pulls up from deep… GOT IT!', 'Nothing but net from {me}! Three!'],
  three_miss: ['{me}\'s three rattles out.', 'Long, off the back iron from {me}.', '{me} lets it fly… no good.'],
  mid_make: ['{me} with the silky pull-up. Money.', 'Elbow jumper from {me} — wet.', '{me} rises and drains the mid-range J.'],
  mid_miss: ['{me}\'s jumper is short.', 'Contested mid-range from {me}… rims out.'],
  drive_make: ['{me} blows by {def} and lays it in!', '{me} slices to the rim — and finishes!', 'Euro-step, finger roll, {me} makes it look easy.'],
  drive_miss: ['{me} drives, but it\'s off the glass and out.', '{def} walls up and {me}\'s layup won\'t fall.'],
  post_make: ['Drop step, power, {me} scores through contact!', '{me} bullies his way to the rim for two.'],
  post_miss: ['{me} goes up strong… and it\'s stripped!', 'Hook shot from {me} is off.'],
  dunk: ['{me} THROWS IT DOWN!', 'SLAM! {me} with authority!', 'Rim rocking! {me} hammers it home!'],
  poster: ['OH MY! {me} JUST POSTERIZED {def}!', 'PUT IT ON A T-SHIRT! {me} DESTROYS {def}!'],
  dunk_miss: ['{me} rises… and it clangs off the back rim!', 'Too strong! {me}\'s dunk attempt bounces out.'],
  lob: ['{me} lobs it up — {mate} throws it DOWN!', 'Alley-oop! {me} to {mate}!'],
  assist: ['{me} kicks to {mate} — bucket! Great vision.', 'Beautiful dish from {me}, {mate} cashes in.'],
  mate_miss: ['Good pass from {me}, but {mate} can\'t knock it down.', '{mate} misses the open look.'],
  turnover: ['Turnover! The pass from {me} is picked off.', '{me} throws it right to the other team. Ouch.'],
  ankles: ['CROSSOVER! {def} is on the floor — ANKLES!', 'Hesi, cross — {def} fell for EVERYTHING!'],
  ft_all: ['{me} knocks down both free throws.', 'Automatic. {me} is perfect at the line.'],
  ft_split: ['{me} splits the pair, {n} of {of}.'],
  ft_none: ['{me} bricks both free throws. Ugh.'],
  oreb: ['{me} crashes and grabs the offensive board!', 'Second chance — {me} with the tip-out!'],
  dreb: ['{me} secures the defensive rebound.', 'Strong board from {me}.'],
  putback: ['Putback! {me} scores off his own hustle!'],
  putback_miss: ['The putback attempt from {me} rolls off.'],
  lost_board: ['They grab the offensive board and score. Second-chance points.'],
  lost_oreb: ['Their defense secures it.'],
  steal: ['PICKED! {me} with the steal!', '{me} jumps the lane — STOLEN!'],
  breakaway: ['…and {me} finishes the breakaway!'],
  stop: ['{me} stays in front of {def} and forces a miss. Stop!', 'Lockdown D from {me}. {def} has nowhere to go.'],
  scored_on: ['{def} scores on {me}. {n} points.', '{def} gets {me} leaning and buries it.'],
  block: ['REJECTED! {me} sends it into the crowd!', 'GET THAT OUTTA HERE! {me} with the block!'],
  block_fail: ['{me} goes for the block — too late. {att} scores.'],
  charge: ['{me} takes the charge! Offensive foul!'],
  charge_fail: ['Blocking foul on {me}. {att} scores anyway.'],
  help_stay: ['{me} stays disciplined — the drive ends in a tough miss.'],
  gamble_fail: ['{me} gambles and gets burned. Wide-open three — splash.'],
  contest_good: ['{me} gets a hand up — {def} misses!'],
  fouled: ['Foul on the drive! {me} heads to the line.'],
  and1: ['AND ONE! {me} scores through the foul!'],
  sig_make: ['The crowd is on its feet!', 'Absolutely unstoppable!'],
  sig_miss: ['{me} goes for the {sig}… and it doesn\'t fall. So close.'],
};

/* ---------- ENDINGS (early ones; full career endings come later) ---------- */
STORY.endings = {
  crash: { title: 'What Could Have Been', tag: 'EARLY ENDING', scene: 'hospital',
    text: 'You never played organized ball again. Halsey Street still talks about your summer against Kai Sterling, the night it all stopped, and the final you never got to play.' },
};

/* =====================================================================
   CHAPTER 1 — CONCRETE DREAMS (The Playground)
   ===================================================================== */
STORY.chapters = {};
STORY.chapters.street = {
  title: 'Chapter 1', name: 'Concrete Dreams', stage: 'Playground', start: 'start',
  // older saves sitting on a scene that moved
  moved: {},
  nodes: {
    /* ======================= ARC 1: THE HALSEY PARK ARC ======================= */
    start: { scene: 'playground', cutscene: 'opening',
      lines: [
        ['narrator', '{hometown}, Halsey Street Courts. No nets, cracked asphalt, and every kid swears he\'s NBL-bound.'],
        ['narrator', 'You\'re sixteen, {height}, raw and hungry. Nobody\'s even heard of you.'],
        ['tariq', 'Yo, {first}, we got next! Don\'t mess it up.', 'smile'],
        ['tariq', 'Don\'t look, but Old Man Lou is watching from the bench again. Three seasons in the league before his knee exploded.'],
        ['narrator', 'On the bench, Lou coughs into his fist. Nobody looks up.'],
      ],
      choices: [
        { t: 'Then let\'s give him something to watch.', fx: { morale: 5, rel: { tariq: 5 } }, next: 'kai_arrives' },
        { t: 'Go ask Lou what he sees.', fx: { rel: { lou: 6 }, attrs: { iq: 1 } }, next: 'lou_first' },
        { t: 'Don\'t care who\'s watching. I\'m here to work.', fx: { attrs: { clutch: 1 }, rep: 1 }, next: 'kai_arrives' },
      ] },
    lou_first: { scene: 'playground',
      lines: [
        ['you', 'Coach Lou. What do you see when you watch me?'],
        ['lou', 'A jumper like a broken sprinkler. Feet faster than your brain.'],
        ['lou', 'And a kid who stays an hour after everybody leaves. That part you can\'t teach.', 'smile'],
        ['you', 'So you\'ll train me?'],
        ['lou', 'Didn\'t say that. Go play.'],
      ], next: 'kai_arrives' },
    kai_arrives: { scene: 'playground', cutscene: 'kai_showdown',
      lines: [
        ['narrator', 'Kai Sterling. Number three in the class, son of ex-NBL All-Star Marcus "Silk" Sterling.'],
        ['kai', 'My trainer says I need "hostile environments." So who\'s got next?', 'smile'],
        ['tariq', '(whispering) Bro, that\'s Kai Sterling. Four hundred thousand followers.'],
      ],
      choices: [
        { t: 'We got next. Let\'s run it.', fx: { morale: 3, rel: { kai: 2 } }, next: 'pre_m1' },
        { t: '"Hostile? You haven\'t seen hostile yet, rich boy."', fx: { rep: 3, morale: 5, rel: { kai: -8 }, flag: 'trash_kai' }, next: 'kai_trash' },
        { t: 'Ignore him. Keep shooting free throws.', fx: { attrs: { ft: 1, iq: 1 } }, next: 'kai_ignored' },
      ] },
    kai_trash: { scene: 'playground',
      lines: [
        ['kai', 'Rich boy? My dad says talk is for people who can\'t play.', 'fierce'],
        ['kai', 'First to fifteen. Back it up.', 'fierce'],
      ], next: 'pre_m1' },
    kai_ignored: { scene: 'playground',
      lines: [
        ['kai', 'Hey, free-throw guy. I\'m talking to you.'],
        ['narrator', 'You swish another one. The whole court goes quiet.'],
        ['kai', 'Okay, I like that. Now do it with somebody in your face.', 'smile'],
      ], next: 'pre_m1' },
    pre_m1: { scene: 'playground',
      lines: [
        ['narrator', 'Halsey Street vs Sterling Squad. Call your own fouls, winners stay on.'],
        ['tariq', 'Just get me the ball when I\'m open. I\'m always open.', 'smile'],
      ], next: 'm1' },
    m1: { type: 'match', us: 'halsey', them: 'sterling_squad', pickup: { size: 3, target: 15 }, tutorial: true, venue: 'park_day',   // the game's tutorial (js/tutorial.js): played with choices, not full arcade
      rating: 50, mateRating: 40, moments: 8, level: 'street', title: 'Pickup Game', sub: 'Halsey Street Courts', win: 'm1_win', lose: 'm1_loss' },
    m1_win: { scene: 'playground', fx: { flag: 'beat_kai', rep: 6, fans: 150, rel: { kai: 4 }, post: { by: 'fan', text: 'Some kid named {first} {last} just beat KAI STERLING at Halsey Street?? I was there 😭😭' } },
      lines: [
        ['narrator', 'Game point drops through a net that isn\'t there. Halsey Street loses its mind.'],
        ['kai', 'That was luck. Run it back and I drop forty on you.', 'fierce'],
        ['you', '{first} {last}. Remember it.'],
        ['kai', 'Ask around about me, Halsey.', 'smile'],
      ], next: 'kai_pov' },
    m1_loss: { scene: 'playground', fx: { rep: 2, morale: -4, post: { by: 'kai', text: 'Hostile environment ✅ Thanks Halsey St. Shoutout #{num}, you almost had me. Almost. 😴' } },
      lines: [
        ['narrator', 'Kai hits the game-winner over your hand and holds his follow-through for the cameras.'],
        ['tariq', 'Bro, you were right there. RIGHT THERE.', 'sad'],
        ['kai', 'Ask around about me, Halsey.', 'smile'],
      ], next: 'kai_pov' },
    /* Kai's point of view: the ride home (Silk on speakerphone) */
    kai_pov: { scene: 'street_night', cutscene: 'kai_pov_suv',
      lines: [['narrator', 'Back on Halsey Street, the lights flicker on. You\'re still out there, shooting.']], next: 'lou_meet' },

    /* ======================= ARC 2: THE LOU BANKS ARC ======================= */
    lou_meet: { cine: true, scene: 'playground_night',
      lines: [
        ['lou', 'You know what your problem is, kid?'],
        ['lou', 'You play like you owe the guy in front of you something. Kai ain\'t your opponent, the rim is.'],
        ['lou', 'Community center. Leave the phone and the ego at home.'],
      ],
      choices: [
        { t: '"I\'ll be there at 5:45."', fx: { rel: { lou: 10 }, morale: 3 }, next: 'train_lou' },
        { t: '"Why me? You don\'t even know me."', next: 'lou_why' },
        { t: '"I don\'t need a coach. I need a scout."', fx: { rel: { lou: -10 }, rep: 2, flag: 'lou_snub' }, next: 'lou_snub' },
      ] },
    lou_why: { scene: 'playground_night', fx: { rel: { lou: 6 } },
      lines: [
        ['lou', 'I know you missed the bus three times this month and walked here anyway. I know you shoot till they cut the lights.'],
        ['lou', 'I wasted half my talent once. Not watching another kid do it.', 'sad'],
      ], next: 'train_lou' },
    lou_snub: { scene: 'playground_night',
      lines: [
        ['lou', 'Scouts don\'t find kids who can\'t go left, son. Suit yourself.'],
        ['narrator', 'He limps off into the dark.'],
        ['tariq', 'Bro, that man played in the league. You sure?', 'sad'],
      ],
      choices: [
        { t: '"…Fine. Six a.m."', fx: { rel: { lou: 6 }, unflag: 'lou_snub' }, next: 'train_lou' },
        { t: '"I\'m sure. I\'ll do it my way."', fx: { morale: 4, attrs: { handle: 1 } }, next: 'dee_rec' },
      ] },
    train_lou: { scene: 'rec',
      lines: [
        ['narrator', '6:00 a.m. Floor wax and old sweat. Lou\'s already there with a whistle and a thermos.'],
        ['lou', 'Nobody gets better in a game. You get better in rooms like this.'],
        ['lou', 'So what are we building?'],
      ],
      choices: [
        { t: 'My jumper. I want range.', hint: '3PT · MID', fx: { attrs: { three: 3, mid: 2 }, xp: 40, flag: 'focus_shot' }, next: 'train_montage' },
        { t: 'My handle. Nobody stays in front of me.', hint: 'HND · SPD · PAS', fx: { attrs: { handle: 3, speed: 1, pass: 1 }, xp: 40, flag: 'focus_handle' }, next: 'train_montage' },
        { t: 'Footwork. I want to live at the rim.', hint: 'FIN · DNK · STR', fx: { attrs: { finish: 3, dunk: 1, str: 1 }, xp: 40, flag: 'focus_rim' }, next: 'train_montage' },
        { t: 'Defense. I want to lock people up.', hint: 'PER · INT · IQ', fx: { attrs: { perD: 3, intD: 1, iq: 1 }, xp: 40, flag: 'focus_def' }, next: 'train_montage' },
        { t: 'The mental side. Teach me to read the game.', hint: 'IQ · CLU', fx: { attrs: { iq: 3, clutch: 2 }, xp: 40, flag: 'focus_mind' }, next: 'train_montage' },
      ] },
    /* the montage: Lou's drills, a PUSH press, the bars filling */
    train_montage: { scene: 'rec', cutscene: s => CH1.montage(s), seenId: 'lou_montage', qteFx: s => CH1.montageBonus(s), fx: { flag: 'lou_trained' },
      lines: [['narrator', 'Two hours later you\'re flat on your back at half court, lungs on fire.']], next: 'lou_story' },
    lou_story: { scene: 'rec', cutscene: 'lou_flashback',
      lines: [
        ['lou', 'Smart players play fifteen years. Highlight players play three.'],
        ['lou', 'Remember that.'],
      ],
      choices: [
        { t: '"I\'ll be smart. I promise."', fx: { rel: { lou: 5 }, attrs: { iq: 1 } }, next: 'dee_rec' },
        { t: '"…I\'d still take the dunk."', fx: { rel: { lou: 2 }, attrs: { dunk: 1 }, rep: 1 }, next: 'lou_laugh' },
      ] },
    lou_laugh: { scene: 'rec',
      lines: [['lou', 'Ha! Of course you would, me too.', 'smile'], ['lou', 'Now get up. Ten suicides.']], next: 'dee_rec' },
    /* Dee Carter and the list: you're #300 (the Prospect Rankings unlock here, early, so you can climb) */
    dee_rec: { scene: 'rec', cine: true, peaks: { 2: { kind: 'ranks' }, 4: { kind: 'aura', who: 'you' } }, fx: { unlock: 'rankings', flag: 'met_dee' },
      lines: [
        ['narrator', 'A woman in a navy blazer is waiting by the water fountain, tablet in hand.'],
        ['dee', 'Dee Carter, Elite Hoops Network. I saw your tape against Kai Sterling.'],
        ['dee', 'We rank the top three hundred players your age. Kai is number three.'],
        ['narrator', 'She turns the tablet around. The last name on the list is yours.'],
        ['dee', 'Last isn\'t nothing. Last is on the list.', 'smile'],
        ['you', 'Then I\'m coming for every name above me.'],
      ],
      choices: [{ t: '"Write it in pen."', fx: { morale: 4 }, next: 'home1' }, { t: 'Screenshot it. Send it to Kai.', fx: { rel: { kai: -3 }, rep: 1 }, next: 'home1' }] },
    home1: { scene: 'home',
      lines: [
        ['narrator', 'Home: two bedrooms above the laundromat on Fifth Street. Mom just got off a double shift.'],
        ['mom', 'Rice is in the pot. Touch that chicken and you answer to Nia.', 'smile'],
        ['nia', 'You\'re on the EHN list?! Number three hundred, I\'m making you a logo!', 'smile'],
        ['nia', 'Manager fees are ten percent. I googled it.', 'smile'],
        ['narrator', 'On the fridge, under a magnet: a pink envelope. LATE NOTICE.'],
        ['mom', 'Landlord raised the rent again. I\'m picking up Saturdays, so I need you watching Nia.', 'sad'],
      ],
      choices: [
        { t: '"I\'ll get a job at the corner store. I can help."', hint: '+Money, +Fatigue', fx: { money: 200, rel: { mom: 10 }, fatigue: 15, attrs: { stam: 1 }, flag: 'job' }, next: 'home1_end' },
        { t: '"I\'ll watch Nia. She can come to the courts."', fx: { rel: { nia: 10, mom: 6 }, morale: 2, flag: 'nia_courts' }, next: 'home1_end' },
        { t: '"Mom, basketball IS how I help. One day I\'m buying you a house."', fx: { morale: 5, rel: { mom: -4 }, flag: 'promise_house' }, next: 'home1_end' },
      ] },
    home1_end: { scene: 'home',
      lines: [['mom', 'You do your best, {first}. That\'s all I ever ask.', 'smile']], next: 'jam_reg' },
    jam_reg: { scene: 'playground', fx: { money: -20, post: { by: 'streetball', text: 'HALSEY SUMMER JAM registration is OPEN 🏆 Two weeks. Westbrook Elite is the favorite. Any sleepers?' } },
      lines: [
        ['tariq', 'Summer Jam sign-ups! Twenty bucks a head, and I already paid yours.', 'smile'],
        ['tariq', 'Westbrook Elite is in. Kai\'s squad.'],
        ['lou', 'Two weeks. Get your name up that list before then.', null, { notFlag: 'lou_snub' }],
      ], next: 'tut_hub' },
    tut_hub: { type: 'hub', title: 'Summer Grind', next: 'lou_cough',
      intro: 'Your HUB: train, rest, upgrade, or play pickup runs to climb the Prospect Rankings. Crack the top 250 before the Jam, then hit CONTINUE STORY.' },
    /* foreshadowing: Lou's napkin, a scout's whisper */
    lou_cough: { scene: 'playground_night', cutscene: 'lou_cough',
      lines: [['tariq', 'You hear that scout? "Attitude?" Bro, you got the best attitude on the block.', 'smile'], ['you', 'Then I\'ll show him.']], next: 'jam_intro' },

    /* ======================= ARC 3: THE SUMMER JAM ARC ======================= */
    jam_intro: { scene: 'playground', fx: { post: { by: 'streetball', text: 'HALSEY SUMMER JAM brackets are LIVE 🏆 Westbrook Elite is the favorite. Any sleepers?' } },
      lines: [
        ['narrator', 'The Halsey Summer Jam: a DJ on the sideline, grills smoking, three hundred people on the fence.'],
        ['mc', 'WELCOME TO THE JAAAAM! If your car is parked on Fifth, it\'s getting towed!'],
        ['tariq', 'East End Runners first. Then probably Southside, the defending champs.'],
        ['narrator', 'In the front row: Dee Carter, notebook on her knee.'],
      ],
      choices: [
        { t: 'Nod at Dee.', fx: { flag: 'saw_dee', morale: 2 }, next: 'jam_dee' },
        { t: 'Don\'t look. Just hoop.', fx: { attrs: { clutch: 1 } }, next: 'jam_calls' },
      ] },
    jam_dee: { scene: 'playground', fx: { flag: 'saw_dee' },
      lines: [['dee', '(mouthing it) Show me something, #300.', 'smile'], ['tariq', 'Bro. She knows your NUMBER.', 'smile']], next: 'jam_calls' },
    /* street calls, your crew, a game plan each round (live arcade with choice moments) */
    jam_calls: { scene: 'playground', fx: { flag: 'street_calls', unlock: 'street_calls' },
      lines: [
        ['lou', 'Three-on-three is a thinking game. Somebody has to call it.'],
        ['lou', 'Give-and-go, iso, feed the hot hand, clear out. That\'s all you need out here.'],
        ['tariq', 'Wait. We get PLAYS?', 'smile'],
      ], next: 'jam_team' },
    jam_team: { scene: 'playground',
      lines: [['tariq', 'It\'s you, me, and one more. Who\'s the third?'], ['narrator', 'Three guys from the block lean on the fence, waiting.']],
      choices: [
        { t: 'Big Rudy — the big man.', hint: 'Rebounds and finishes inside · ⚔ Sky Hook, Hammer Put-Back', fx: { jam: { mate: 'Big Rudy' }, rel: { tariq: 1 } }, next: 'jam_plan1' },
        { t: 'Smoke — the shooter.', hint: 'Spaces the floor from anywhere · ⚔ Logo Three', fx: { jam: { mate: 'Smoke' } }, next: 'jam_plan1' },
        { t: 'Lil\' Dez — the pest.', hint: 'Quick hands, quick floaters · ⚔ Pickpocket, Floater', fx: { jam: { mate: 'Lil\' Dez' } }, next: 'jam_plan1' },
      ] },
    jam_plan1: { scene: 'playground',
      lines: [['tariq', 'Round one: East End Runners. Flash Gordon Lee is the fastest kid in the city.'], ['lou', 'Quick guards, no size. How do you want them?']],
      choices: [
        { t: 'Run and gun. Beat them at their own game.', hint: 'Easier layups and dunks, a little looser shooting', fx: { jam: { plan: 'run' } }, next: 'm2' },
        { t: 'Slow it down. Make them guard for a while.', hint: 'Better jumpers, fewer cheap points for them', fx: { jam: { plan: 'slow' } }, next: 'm2' },
        { t: 'Lock in. Wall up the paint.', hint: 'Their shots get much harder, yours a bit harder too', fx: { jam: { plan: 'lock' } }, next: 'm2' },
      ] },
    m2: { type: 'match', us: 'halsey', them: 'eastend', pickup: { size: 3, target: 21 }, jam: true, venue: 'cage', rating: 44, mateRating: 41, moments: 9, level: 'street',
      title: 'Halsey Summer Jam', sub: 'Round 1', win: 'm2_win', lose: 'm2_loss' },
    m2_win: { scene: 'playground', fx: { rep: 4, fans: 200, flag: 'jam_r1' },
      lines: [['mc', 'HALSEY STREET MOVES ON! East End is running straight home!'], ['tariq', 'One down. Southside next.', 'smile']], next: 'semi_pre' },
    m2_loss: { scene: 'playground', fx: { fatigue: 15, attrs: { stam: 2 }, morale: -2 },
      lines: [
        ['narrator', 'East End steals it at the end. But the Jam is double elimination.'],
        ['narrator', 'Two more games in the heat, and you crawl back through the loser\'s bracket.'],
      ], next: 'semi_pre' },
    semi_pre: { scene: 'playground',
      lines: [
        ['mc', 'SEMIFINAL! The defending champs, the Southside Bricklayers!'],
        ['tariq', 'Hammer Jones is like 280. He got kicked out of the church league.'],
        ['lou', 'Big, slow, physical. How do you want them?'],
      ],
      choices: [
        { t: 'Run and gun. Make the big man run.', hint: 'Easier layups and dunks, a little looser shooting', fx: { jam: { plan: 'run' } }, next: 'm_semi' },
        { t: 'Slow it down. Work for good jumpers.', hint: 'Better jumpers, fewer cheap points for them', fx: { jam: { plan: 'slow' } }, next: 'm_semi' },
        { t: 'Lock in. Wall up the paint.', hint: 'Their shots get much harder, yours a bit harder too', fx: { jam: { plan: 'lock' } }, next: 'm_semi' },
      ] },
    /* the fixed high: down six to the champs, the comeback, your buzzer-beater (js/data-story-ch1.js JAM_SCRIPTS.semi) */
    m_semi: { type: 'match', us: 'halsey', them: 'southside', pickup: { size: 3, target: 21 }, jam: true, script: 'semi', venue: 'cage', rating: 47, mateRating: 42, moments: 9, level: 'street', importance: 2,
      title: 'Halsey Summer Jam', sub: 'Semifinal', win: 'semi_win', lose: 'semi_win' },
    semi_win: { scene: 'playground', fx: { rep: 6, fans: 400, xp: 60, flag: 'semi_win', rankAt: { to: 200, better: true, why: 'Summer Jam semifinal' } },
      lines: [
        ['mc', 'HALSEY STREET IS IN THE FINAL! Somebody check on Hammer Jones!'],
        ['hammer', 'Respect, little man. You don\'t quit.', 'smile'],
        ['tariq', 'WE\'RE IN THE FINAL! Against KAI!', 'smile'],
      ], next: 'jam_cel_check' },
    /* Celebrations: the block hypes you up after the semifinal and you pick your first one */
    jam_cel_check: { type: 'branch', branches: [{ if: { notFlag: 'feat_celebrations' }, next: 'jam_celebrate' }], else: 'jam_rest' },
    jam_celebrate: { scene: 'playground',
      lines: [
        ['narrator', 'The whole fence is shaking. Kids from the block are chanting your number.'],
        ['tariq', 'They want something! You can\'t just walk off after THAT.', 'smile'],
        ['mc', 'GIVE THE PEOPLE WHAT THEY WANT, NUMBER {num}!'],
      ],
      choices: [
        { t: 'Flex for the fence. Both arms.', fx: { unlock: 'celebrations', celeb: 'flex', fans: 60 }, next: 'jam_rest' },
        { t: 'Point at Nia in the crowd.', fx: { unlock: 'celebrations', celeb: 'point', rel: { nia: 4 } }, next: 'jam_rest' },
        { t: 'Throw your head back and scream.', fx: { unlock: 'celebrations', celeb: 'scream', morale: 3 }, next: 'jam_rest' },
      ] },
    jam_rest: { scene: 'playground',
      lines: [['narrator', 'The final is tomorrow night. Your legs already know it.'], ['lou', 'Rest or work. Pick one and own it.']],
      choices: [
        { t: 'Ice, water, sleep.', hint: 'Fresh legs for the final', fx: { fatigue: -25, morale: 2 }, next: 'hub2' },
        { t: 'Get shots up on the side court.', hint: 'A small boost in the final, but tired legs', fx: { fatigue: 12, jam: { boost: true } }, next: 'hub2' },
      ] },
    hub2: { type: 'hub', title: 'Before the Final', next: 'party_invite',
      intro: 'One night until the Summer Jam final. Train, rest, or gear up. Fatigue carries into the game.' },

    party_invite: { scene: 'street_night',
      lines: [
        ['narrator', 'The night before the final. Your phone buzzes.'],
        ['marcus', 'Cuz! Delancey party tonight, and you\'re kinda famous right now.', 'smile'],
        ['marcus', 'One night. You\'ve been in that gym all summer.'],
      ],
      choices: [
        { t: '"Nah, final\'s tomorrow. Shots up, then bed."', hint: 'Safe', fx: { attrs: { three: 1, mid: 1 }, morale: 2, rel: { lou: 5 }, fatigue: -10 }, next: 'final_morning' },
        { t: '"I\'ll swing by for an hour."', check: { a: 'iq', dc: 42 }, next: 'party_ok', fail: 'party_bad' },
        { t: '"Let\'s go. I deserve a night off."', hint: 'Risky', next: 'party_full' },
      ] },
    party_ok: { scene: 'party', fx: { fans: 150 },
      lines: [
        ['narrator', 'You dap up half of {hometown}, take some pictures, and slip out the back by eleven.'],
        ['narrator', 'In a corner, alone on his phone: Kai Sterling.'],
        ['kai', 'Don\'t tell anyone you saw me. My dad thinks I\'m at film.', 'sad'],
      ],
      choices: [
        { t: '"Your secret\'s safe. See you tomorrow."', fx: { rel: { kai: 10 }, flag: 'kai_secret' }, next: 'final_morning' },
        { t: '"Film session, huh? So the golden boy\'s human."', fx: { rel: { kai: -5 }, morale: 3 }, next: 'final_morning' },
      ] },
    party_bad: { scene: 'party',
      lines: [
        ['narrator', 'One hour turns into three. Somebody\'s cousin starts a fight.'],
        ['narrator', 'Then: red and blue lights through the front window.'],
        ['marcus', 'COPS! Back door, back door!', 'fierce'],
      ],
      choices: [
        { t: 'Sprint for the back fence.', check: { a: 'speed', dc: 42 }, next: 'party_escape', fail: 'party_caught' },
        { t: 'Stay put, hands visible. You didn\'t do anything.', next: 'party_stay' },
      ] },
    party_escape: { scene: 'street_night', fx: { fatigue: 20, morale: -4 },
      lines: [['narrator', 'You\'re over the fence and six blocks gone before anyone sees your face.'], ['narrator', 'You lie awake till 4 a.m., heart pounding.']], next: 'final_morning' },
    party_stay: { scene: 'street_night', fx: { rep: -3, fans: 100, fatigue: 15 },
      lines: [['narrator', 'The officers clear the house and let you go with a warning.'], ['narrator', 'But somebody posts a video of you there.']], next: 'final_morning' },
    party_caught: { scene: 'street_night', fx: { rep: -8, fans: 300, rel: { mom: -10 }, morale: -8, fatigue: 20, flag: ['late_night', 'police_record'], post: { by: 'streetball', text: 'Halsey Street\'s {first} {last} spotted in the back of a cop car at 2am the night before the Summer Jam final. Priorities? 👀' } },
      lines: [
        ['narrator', 'You\'re not arrested. But your name lands in a report, and a photo of you in a cruiser lands online.'],
        ['mom', 'I worked a double. Then I picked my son up from a police station at three in the morning.', 'sad'],
        ['mom', 'I\'m not mad, baby. I\'m scared.', 'sad'],
      ],
      choices: [
        { t: '"I\'m sorry, Mom. It won\'t happen again."', fx: { rel: { mom: 6 }, attrs: { iq: 1 } }, next: 'final_morning' },
        { t: '"I didn\'t even do anything!"', fx: { rel: { mom: -4 }, morale: 2 }, next: 'final_morning' },
      ] },
    party_full: { scene: 'party',
      lines: [
        ['narrator', 'The music is loud and the night is long. At 2 a.m., Marcus jingles keys that aren\'t his.'],
        ['marcus', 'My homie left his Charger. Five-minute spin.', 'smile'],
      ],
      choices: [
        { t: 'Get in the car.', hint: '⚠ Career-defining', next: 'crash' },
        { t: '"Nah, I\'m out. I\'ve got a final tomorrow."', fx: { fatigue: 25, morale: -3, flag: 'late_night' }, next: 'final_morning' },
        { t: 'Take the keys away from him.', check: { a: 'str', dc: 40 }, next: 'keys_ok', fail: 'keys_fail' },
      ] },
    keys_ok: { scene: 'street_night', fx: { fatigue: 20, rep: 2, flag: ['late_night', 'saved_marcus'], rel: { marcus: 15 } },
      lines: [['narrator', 'You twist the keys out of his hand. You call him a cab and walk home at 3 a.m.'], ['marcus', 'You\'re a buzzkill, cuz. But… thanks.', 'sad']], next: 'final_morning' },
    keys_fail: { scene: 'hospital', fx: { morale: -10, fatigue: 20, flag: ['late_night', 'marcus_crash'] },
      lines: [
        ['narrator', 'Marcus shoves you off and peels away. By morning he\'s wrapped the car around a light pole.'],
        ['narrator', 'Broken pelvis. He\'ll live.'],
        ['marcus', '(barely a whisper) Go win it, cuz.', 'sad'],
      ], next: 'final_morning' },
    crash: { scene: 'street_night',
      lines: [['narrator', 'Five minutes turns into ninety miles an hour on the Fifth Avenue overpass.'], ['narrator', 'Headlights, glass, then nothing.']], next: 'crash2' },
    crash2: { scene: 'hospital', cutscene: 'career_end',
      lines: [
        ['narrator', 'When you wake up, Mom is asleep in the chair. Her hand is still holding yours.'],
        ['narrator', 'The doctor says "shattered." You\'ll walk again, but you\'ll never play again.'],
        ['lou', 'Smart players play fifteen years, kid. I\'m so sorry.', 'sad', { notFlag: 'lou_snub' }],
      ],
      choices: [{ t: 'End of the road…', next: 'end_crash' }] },
    end_crash: { type: 'ending', ending: 'crash' },

    final_morning: { scene: 'playground', cutscene: 'tape_ankles',
      lines: [
        ['narrator', 'Summer Jam Final: Halsey Street vs Westbrook Elite. Three hundred people around a court built for forty.'],
        ['narrator', 'Your legs feel like wet sand. Last night is catching up with you.', null, { flag: 'late_night' }],
        ['kai', 'Told you I\'d see you again, Halsey. Hope you slept.', 'fierce', { notFlag: 'kai_secret' }],
        ['kai', '(quietly) Thanks for last night. Doesn\'t mean I\'m going easy.', 'smile', { flag: 'kai_secret' }],
        ['dee', '(scribbling) Number {num}. Okay, show me.', null, { flag: 'saw_dee' }],
      ],
      choices: [
        { t: '"Let\'s finish what we started."', fx: { morale: 4 }, next: 'jam_plan2' },
        { t: '"Hope you brought your dad, Kai. You\'ll need a ride home."', req: { flag: 'trash_kai' }, fx: { rep: 3, rel: { kai: -5 }, morale: 6 }, next: 'jam_plan2' },
        { t: 'Find Tariq. "Whatever happens, it\'s us."', fx: { rel: { tariq: 8 }, chem: 10 }, next: 'jam_plan2' },
      ] },
    jam_plan2: { scene: 'playground',
      lines: [['lou', 'Westbrook pushes the pace and everything runs through Kai.'], ['tariq', 'So what\'s the plan, captain?']],
      choices: [
        { t: 'Run with them. Our legs, our court.', hint: 'Easier layups and dunks, a little looser shooting', fx: { jam: { plan: 'run' } }, next: 'm3' },
        { t: 'Slow it down. Make Kai play half-court.', hint: 'Better jumpers, fewer cheap points for them', fx: { jam: { plan: 'slow' } }, next: 'm3' },
        { t: 'Lock in. Make every shot ugly.', hint: 'Their shots get much harder, yours a bit harder too', fx: { jam: { plan: 'lock' } }, next: 'm3' },
      ] },
    /* THE FINAL (the fixed low): played live, then Kai's late run and the last possession (JAM_SCRIPTS.final) */
    m3: { type: 'match', us: 'halsey', them: 'westbrook_elite', pickup: { size: 3, target: 21 }, jam: true, script: 'final', venue: 'street_night', rating: 54, mateRating: 43, moments: 11, level: 'street', importance: 2,
      title: 'Halsey Summer Jam', sub: 'Championship', win: 'm3_loss', lose: 'm3_loss', gradeFlag: { min: 64, flag: 'good_final' }, leadFlag: { min: 3, flag: 'good_final' } },
    m3_loss: { scene: 'playground_night', cutscene: 'jam_low', fx: { rep: 4, fans: 300, xp: 60, rankAt: { good_final: 280, else: 295, why: 'Summer Jam final' } },
      lines: [
        ['narrator', 'You played the game of your life. The only number anyone saw was his.', null, { flag: 'good_final' }],
        ['narrator', 'In the front row, Dee Carter circles something in her notebook.', null, { flag: 'good_final' }],
        ['narrator', 'You had him. Then you didn\'t.', null, { notFlag: 'good_final' }],
        ['narrator', 'Dee Carter\'s seat is empty. She left before the trophy.', null, { notFlag: 'good_final' }],
        ['kai', 'You\'re annoying, you know that? Most people quit by halftime.'],
      ], next: 'm3_rain' },
    /* night, rain, Halsey Street: GET UP, and Lou under the light */
    m3_rain: { scene: 'rain_night', cutscene: 'rain_getup', next: 'm3_low' },
    // the awakening (your weapon evolves to tier II) + Kai is marked for a revenge game (HALSEY PARK II)
    m3_low: { type: 'branch', fx: { evolve: { tier: 2, intro: false }, mark: { id: 'kai', star: 'Kai Sterling', title: 'HALSEY PARK II', sub: 'The Reckoning' } }, branches: [], else: 'scout_branch' },
    m3_win: { scene: 'playground', fx: { flag: ['summer_champ', 'beat_kai'], rep: 10, fans: 800, xp: 120, money: 100 },   // older saves only (the final is a fixed loss now)
      lines: [['narrator', 'The final buzzer is a guy with an air horn. Best sound you\'ve ever heard.'], ['tariq', 'WE\'RE THE CHAMPS!', 'smile']], next: 'scout_branch' },
    jam_final_cel: { type: 'branch', branches: [], else: 'scout_branch' },
    jam_celebrate2: { type: 'branch', branches: [], else: 'scout_branch' },

    /* scouting: an alternate road, never an ending */
    scout_branch: { type: 'branch',
      branches: [
        { if: { flag: 'summer_champ' }, next: 'dee_offer' },
        { if: { flag: 'good_final' }, next: 'dee_offer' },
        { if: { rel: { lou: 40 }, notFlag: 'lou_snub' }, next: 'lou_calls' },
      ], else: 'no_scout' },
    lou_calls: { scene: 'rec',
      lines: [
        ['lou', 'I made a call. Dee Carter is coming to watch you work Thursday.'],
        ['narrator', 'Thursday, you drain 41 of 50 from deep while Lou rebounds. Dee writes one word and underlines it twice.'],
      ], next: 'dee_offer' },
    no_scout: { scene: 'playground_night', fx: { flag: ['unscouted', 'hs_lincoln'], morale: -3 },
      lines: [
        ['narrator', 'Nobody calls. Not that week, not the next.'],
        ['tariq', 'Forget her. We\'re going to Lincoln together, and we\'ll make them notice.'],
      ],
      choices: [{ t: '"Then we make them notice."', fx: { rel: { tariq: 8 }, attrs: { clutch: 2 } }, next: 'ranks_check' }] },
    dee_offer: { cine: true, scene: 'playground', cutscene: 'scouted', fx: { flag: 'scouted', xp: 50, post: { by: 'ehn', text: 'Scouting note 📋 {first} {last} ({height} {pos}, {hometown}): raw, competitive, gets better when it gets harder.' } },
      lines: [
        ['dee', 'You\'re raw. Your left hand is a rumor.'],
        ['dee', 'But you get better when it gets harder. I can\'t teach that.', 'smile'],
        ['dee', 'Westbrook Academy has a scholarship spot. Full ride, national TV, and Kai Sterling as your teammate.'],
        ['dee', 'Or you stay at Lincoln with your friends. And play Westbrook twice a year.'],
      ],
      choices: [
        { t: '"Westbrook Academy. I want the best."', fx: { flag: 'hs_westbrook', rel: { kai: 3, tariq: -10 }, rep: 3 }, next: 'pick_westbrook' },
        { t: '"Lincoln High. I\'m not joining Kai. I\'m coming for him."', fx: { flag: 'hs_lincoln', rel: { tariq: 8 }, morale: 4 }, next: 'pick_lincoln' },
        { t: '"I need to talk to my mom and Lou first."', next: 'hs_talk' },
      ] },
    hs_talk: { scene: 'home',
      lines: [
        ['mom', 'A full scholarship? Baby, that\'s more than I could ever give you.', 'smile'],
        ['mom', 'Just don\'t forget where you come from.'],
        ['lou', 'Westbrook will polish you. Lincoln will sharpen you.', null, { notFlag: 'lou_snub' }],
        ['nia', 'Westbrook has a TikTok team. For the brand.', 'smile'],
      ],
      choices: [
        { t: 'Choose Westbrook Academy.', fx: { flag: 'hs_westbrook', rel: { kai: 3, tariq: -6, mom: 4 }, rep: 3 }, next: 'pick_westbrook' },
        { t: 'Choose Lincoln High.', fx: { flag: 'hs_lincoln', rel: { tariq: 8, lou: 4 }, morale: 4 }, next: 'pick_lincoln' },
      ] },
    pick_westbrook: { scene: 'playground_night',
      lines: [
        ['tariq', 'Westbrook, huh? Nah, it\'s cool, good look for you.', 'sad'],
        ['narrator', 'He doesn\'t look at you when he says it.'],
        ['kai', '(text) Heard you\'re coming to Westbrook. Don\'t get comfy, that starting spot is mine.', 'fierce'],
      ], next: 'ranks_check' },
    pick_lincoln: { scene: 'playground_night',
      lines: [
        ['tariq', 'LINCOLN LIONS, BABY! Me and you, starting backcourt!', 'smile'],
        ['kai', '(text) Lincoln? Bold, see you in December.', 'fierce'],
      ], next: 'ranks_check' },
    /* older saves that never met Dee at the rec center: she shows them the list now */
    ranks_check: { type: 'branch', branches: [{ if: { notFlag: 'feat_rankings', flag: 'unscouted' }, next: 'dee_list_cold' }, { if: { notFlag: 'feat_rankings' }, next: 'dee_list' }], else: 'ch_end' },
    dee_list_cold: { scene: 'playground_night', cine: true, peaks: { 3: { kind: 'ranks' } }, fx: { unlock: 'rankings' },
      lines: [
        ['narrator', 'Three days later, an email from Elite Hoops Network.'],
        ['dee', '(email) I didn\'t offer you anything. You weren\'t ready.'],
        ['dee', '(email) But I added one name to our top three hundred. Scroll to the bottom.', 'smile'],
        ['narrator', 'Number three hundred: you. Kai Sterling is number three.'],
      ],
      choices: [{ t: 'Print it. Tape it above your bed.', fx: { morale: 5 }, next: 'ch_end' }, { t: 'Screenshot it and send it to Tariq.', fx: { rel: { tariq: 4 } }, next: 'ch_end' }] },
    dee_list: { scene: 'playground', cine: true, peaks: { 2: { kind: 'ranks' }, 4: { kind: 'aura', who: 'you' } }, fx: { unlock: 'rankings' },
      lines: [
        ['dee', 'One more thing. We rank the top three hundred players your age.'],
        ['dee', 'Kai is number three. Want to see number three hundred?'],
        ['narrator', 'She turns the tablet around. The last name on the list is yours.'],
        ['dee', 'Last isn\'t nothing. Last is on the list.', 'smile'],
      ],
      choices: [{ t: '"Write my name in pen."', fx: { morale: 4 }, next: 'ch_end' }, { t: 'Screenshot it. Send it to Kai.', fx: { rel: { kai: -3 }, rep: 1 }, next: 'ch_end' }] },

    ch_end: { type: 'chapterEnd', nextChapter: 'highschool', fx: { develop: 'street' },
      summary: 'Summer\'s over. You came in a nobody and leave a {ovr}-Overall {posName} with a rival who knows your name.',
      recap: [
        { if: { flag: 'summer_champ' }, t: '🏆 Halsey Summer Jam champion' },
        { if: { flag: 'semi_win', notFlag: 'summer_champ' }, t: '🔥 Beat the defending champs at the buzzer' },
        { if: { flag: 'good_final', notFlag: 'summer_champ' }, t: '🥈 Took Kai to the last possession in the final' },
        { if: { notFlag: ['summer_champ', 'good_final'] }, t: 'Lost the Summer Jam final' },
        { if: { flag: 'scouted' }, t: '📋 Scouted by Dee Carter' },
        { if: { notFlag: 'scouted' }, t: '❔ Went unscouted' },
        { if: { flag: 'hs_westbrook' }, t: '🎓 Headed to Westbrook Academy (Kai\'s team)' },
        { if: { flag: 'hs_lincoln' }, t: '🎓 Staying home at Lincoln High' },
        { if: { flag: 'lou_snub' }, t: '🚪 Turned down Lou\'s mentorship' },
        { if: { notFlag: 'lou_snub' }, t: '🧓 Training under Lou Banks' },
        { if: { rel: { kai: 10 } }, t: '🤝 Kai respects you' },
        { if: { maxRel: { kai: 9 } }, t: '😤 Kai can\'t stand you' },
      ] },
  },
};
