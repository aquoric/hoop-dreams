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
  nodes: {
    start: { scene: 'playground', cutscene: 'opening',
      lines: [
        ['narrator', '{hometown}, Halsey Street Courts. No nets, cracked asphalt, and every kid on the block swears they\'re NBL-bound.'],
        ['narrator', 'You\'re sixteen, {height}, raw and hungry. Nobody\'s ranking you — nobody\'s even heard of you.'],
        ['tariq', 'Yo, {first}! We got next, winners stay on — don\'t mess it up.', 'smile'],
        ['tariq', 'Don\'t look, but Old Man Lou is scouting from the bench again. Dude did three seasons in the league with the Pistonz before his knee exploded.'],
      ],
      choices: [
        { t: 'Then let\'s give him something to watch.', fx: { morale: 5, rel: { tariq: 5 } }, next: 'kai_arrives' },
        { t: 'Lou\'s watching? I\'m going to go ask him what he sees.', fx: { rel: { lou: 6 }, attrs: { iq: 1 } }, next: 'lou_first' },
        { t: 'Don\'t care who\'s watching. I\'m here to work.', fx: { attrs: { clutch: 1 }, rep: 1 }, next: 'kai_arrives' },
      ] },

    lou_first: { scene: 'playground',
      lines: [
        ['you', 'Coach Lou. What do you see when you watch me?'],
        ['lou', 'What do I see? I see a jumper like a broken sprinkler and feet faster than your brain.'],
        ['lou', '…And I see a kid who stays an hour after everybody else goes home. That part you can\'t teach.', 'smile'],
        ['you', 'So you\'ll train me?'],
        ['lou', 'Didn\'t say that. Go play — I\'ll be watching.'],
      ], next: 'kai_arrives' },

    kai_arrives: { scene: 'playground', cutscene: 'kai_showdown',
      lines: [
        ['narrator', 'A black SUV rolls up to the curb. Nobody drives an SUV like that on Halsey Street.'],
        ['narrator', 'Out steps Kai Sterling: #1 sophomore in the country, son of ex-NBL All-Star Marcus "Silk" Sterling. Three kids in matching Westbrook warmups trail him like an entourage.'],
        ['kai', 'So this is the famous Halsey Street. Smaller than it looks on the internet.', 'smile'],
        ['kai', 'My trainer says I need to play in "hostile environments." So… who\'s got next?'],
        ['tariq', '(whispering) Bro, that\'s Kai Sterling. 400K followers, been dunking since eighth grade.'],
      ],
      choices: [
        { t: 'We got next. Let\'s run it.', fx: { morale: 3, rel: { kai: 2 } }, next: 'pre_m1' },
        { t: '"Hostile? You haven\'t seen hostile yet, rich boy."', fx: { rep: 3, morale: 5, rel: { kai: -8 }, flag: 'trash_kai' }, next: 'kai_trash' },
        { t: 'Ignore him. Keep shooting free throws.', fx: { attrs: { ft: 1, iq: 1 } }, next: 'kai_ignored' },
      ] },
    kai_trash: { scene: 'playground',
      lines: [
        ['kai', 'Rich boy? Cute — my dad says talk is for people who can\'t play.', 'fierce'],
        ['kai', 'Full court, two halves. Let\'s see if you can back it up.', 'fierce'],
      ], next: 'pre_m1' },
    kai_ignored: { scene: 'playground',
      lines: [
        ['kai', 'Hey, free-throw guy. I\'m talking to you.'],
        ['narrator', 'You swish another one. The whole court goes quiet.'],
        ['kai', '…Okay, I like that. Let\'s see you do it with somebody in your face.', 'smile'],
      ], next: 'pre_m1' },

    pre_m1: { scene: 'playground',
      lines: [
        ['narrator', 'Halsey Street vs. Sterling Squad — call your own fouls, winners stay on. Half the block is already filming.'],
        ['tariq', 'Just get me the ball when I\'m open. And I\'m always open.', 'smile'],
      ], next: 'm1' },
    m1: { type: 'match', us: 'halsey', them: 'sterling_squad', pickup: { size: 3, target: 15 }, tutorial: true, venue: 'park_day',   // the game's tutorial (js/tutorial.js): played with choices, not full arcade rating: 50, mateRating: 40, moments: 8, level: 'street',
      title: 'Pickup Game', sub: 'Halsey Street Courts', win: 'm1_win', lose: 'm1_loss' },
    m1_win: { scene: 'playground', fx: { flag: 'beat_kai', rep: 6, fans: 150, rel: { kai: 4 }, post: { by: 'fan', text: 'Some kid named {first} {last} just beat KAI STERLING at Halsey Street?? I was there 😭😭' } },
      lines: [
        ['narrator', 'Game point drops through a net that isn\'t there. Halsey Street loses its mind.'],
        ['kai', 'That was luck, nothing else. Run it back next summer and I\'ll drop forty on you.', 'fierce'],
        ['kai', '…What\'s your name?'],
        ['you', '{first}… {first} {last}. Remember it.'],
        ['kai', 'We\'ll see.'],
      ], next: 'lou_meet' },
    m1_loss: { scene: 'playground', fx: { rep: 2, morale: -4, post: { by: 'kai', text: 'Hostile environment ✅ Thanks Halsey St. Shoutout #{num}, you almost had me. Almost. 😴' } },
      lines: [
        ['narrator', 'Kai hits the game-winner over your outstretched hand and holds his follow-through for the phone cameras.'],
        ['kai', 'Good run, Halsey. You almost made me sweat — almost.', 'smile'],
        ['tariq', 'Bro, you were right there. RIGHT THERE.', 'sad'],
      ], next: 'lou_meet' },

    lou_meet: { cine: true, scene: 'playground_night',
      lines: [
        ['narrator', 'Streetlights flicker on and everyone\'s gone home. You\'re still shooting.'],
        ['lou', 'You know what your problem is, kid?'],
        ['lou', 'You play like you owe the guy in front of you something. Kai Sterling ain\'t your opponent — that rim is, and so is your own laziness.'],
        ['lou', 'Six a.m., community center. Don\'t be late, and leave the phone and the ego at home.'],
      ],
      choices: [
        { t: '"I\'ll be there at 5:45."', fx: { rel: { lou: 10 }, morale: 3 }, next: 'train_lou' },
        { t: '"Why me? You don\'t even know me."', next: 'lou_why' },
        { t: '"I don\'t need a coach. I need a scout."', fx: { rel: { lou: -10 }, rep: 2, flag: 'lou_snub' }, next: 'lou_snub' },
      ] },
    lou_why: { scene: 'playground_night', fx: { rel: { lou: 6 } },
      lines: [
        ['lou', 'I know you missed the bus three times this month and walked here anyway. I know you shoot until they cut the lights.'],
        ['lou', 'I had all the talent in the world once and wasted half of it. Not watching another kid do the same.', 'sad'],
      ], next: 'train_lou' },
    lou_snub: { scene: 'playground_night',
      lines: [
        ['lou', 'Scouts don\'t find kids who can\'t go left, son. But suit yourself.'],
        ['narrator', 'He limps off into the dark. Tariq lets out a low whistle.'],
        ['tariq', 'Bro… that man played in the league. You sure about that?', 'sad'],
      ],
      choices: [
        { t: '"…Fine. Six a.m."', fx: { rel: { lou: 6 }, unflag: 'lou_snub' }, next: 'train_lou' },
        { t: '"I\'m sure. I\'ll do it my way."', fx: { morale: 4, attrs: { handle: 1 } }, next: 'tut_hub' },
      ] },

    train_lou: { scene: 'rec',
      lines: [
        ['narrator', '6:00 a.m., Halsey Community Center: floor wax and old sweat. Lou\'s already there — folding chair, whistle, thermos.'],
        ['lou', 'First rule: nobody gets better in a game. You get better in rooms like this one, when nobody\'s watching.'],
        ['lou', 'So. What are we building today?'],
      ],
      choices: [
        { t: 'My jumper. I want range.', hint: '3PT · MID', fx: { attrs: { three: 3, mid: 2 }, xp: 40 }, next: 'lou_story' },
        { t: 'My handle. Nobody stays in front of me.', hint: 'HND · SPD · PAS', fx: { attrs: { handle: 3, speed: 1, pass: 1 }, xp: 40 }, next: 'lou_story' },
        { t: 'Footwork. I want to live at the rim.', hint: 'FIN · DNK · STR', fx: { attrs: { finish: 3, dunk: 1, str: 1 }, xp: 40 }, next: 'lou_story' },
        { t: 'Defense. I want to lock people up.', hint: 'PER · INT · IQ', fx: { attrs: { perD: 3, intD: 1, iq: 1 }, xp: 40 }, next: 'lou_story' },
        { t: 'The mental side. Teach me to read the game.', hint: 'IQ · CLU', fx: { attrs: { iq: 3, clutch: 2 }, xp: 40 }, next: 'lou_story' },
      ] },
    lou_story: { scene: 'rec',
      lines: [
        ['narrator', 'Two hours later you\'re on your back at half court, lungs on fire.'],
        ['lou', 'Know why I limp? 1998, Pistonz-Fakers, down twenty in the fourth — and I try to dunk on a seven-footer for the highlights.'],
        ['lou', 'Tore everything in my knee. Never played another minute in the league.', 'sad'],
        ['lou', 'Smart players play fifteen years, highlight players play three. Remember that.'],
      ],
      choices: [
        { t: '"I\'ll be smart. I promise."', fx: { rel: { lou: 5 }, attrs: { iq: 1 } }, next: 'tut_hub' },
        { t: '"…I\'d still take the dunk."', fx: { rel: { lou: 2 }, attrs: { dunk: 1 }, rep: 1 }, next: 'lou_laugh' },
      ] },
    lou_laugh: { scene: 'rec',
      lines: [['lou', 'Ha! Of course you would — me too, kid.', 'smile'], ['lou', 'Now get up — suicides, ten of \'em.']], next: 'tut_hub' },

    tut_hub: { type: 'hub', title: 'Summer Grind', next: 'home1',
      intro: 'Your HUB: a couple of actions between story beats — train (attribute minigames), rest, spend Skill Points in UPGRADE, check BADGES, or shop. Then hit CONTINUE STORY.' },

    home1: { scene: 'home',
      lines: [
        ['narrator', 'Home: a two-bedroom above the laundromat on Fifth Street. Mom just got off a double at the hospital.'],
        ['mom', 'There\'s my baby — rice is in the pot. Touch that chicken and you answer to Nia, it\'s her lunch.', 'smile'],
        ['nia', '{first}! You\'re on CourtVision and the comments say you COOKED Kai Sterling!', 'smile', { flag: 'beat_kai' }],
        ['nia', '{first}! Your Kai Sterling game is online, and half the comments say you\'re trash.', 'smile', { notFlag: 'beat_kai' }],
        ['nia', 'The other half say "raw but interesting." That\'s good, right?', 'smile', { notFlag: 'beat_kai' }],
        ['mom', 'Baby, the landlord raised the rent again. I\'m picking up Saturdays, so I need you watching Nia after school.', 'sad'],
        ['mom', 'I know you got your basketball. But this family needs you too.'],
      ],
      choices: [
        { t: '"I\'ll get a job at the corner store. I can help."', hint: '+Money, +Fatigue', fx: { money: 200, rel: { mom: 10 }, fatigue: 15, attrs: { stam: 1 }, flag: 'job' }, next: 'home1_end' },
        { t: '"I\'ll watch Nia. She can come to the courts with me."', fx: { rel: { nia: 10, mom: 6 }, morale: 2, flag: 'nia_courts' }, next: 'home1_end' },
        { t: '"Mom, basketball IS how I help. One day I\'m buying you a house."', fx: { morale: 5, rel: { mom: -4 }, flag: 'promise_house' }, next: 'home1_end' },
      ] },
    home1_end: { scene: 'home',
      lines: [
        ['mom', 'Mm-hm. You do your best, {first} — that\'s all I ever ask.', 'smile'],
        ['nia', 'And when you\'re famous, I\'m your manager — ten percent. I googled it.', 'smile'],
      ], next: 'jam_intro' },

    jam_intro: { scene: 'playground', fx: { post: { by: 'streetball', text: 'HALSEY SUMMER JAM brackets are LIVE 🏆 Westbrook Elite is the favorite. Any sleepers?' } },
      lines: [
        ['narrator', 'Two weeks later: the Halsey Summer Jam, biggest streetball tournament in {hometown}. DJ on the sideline, grills smoking, a guy with a megaphone calling play-by-play.'],
        ['mc', 'LADIES AND GENTLEMEN, WELCOME TO THE JAAAAM! Hydrate, tip your DJ, and if your car is parked on Fifth — it\'s getting towed!'],
        ['tariq', 'Brackets are up — Southside Bricklayers first! Their big man Hammer Jones is like 280 and got kicked out of the church league.'],
        ['tariq', 'And guess who\'s in the other bracket? Westbrook Elite — Kai\'s squad.'],
        ['narrator', 'A woman in a pressed navy blazer sits in the front row of the bleachers, notebook on her knee. She doesn\'t look like she\'s here for the burgers.'],
      ],
      choices: [
        { t: '"Who\'s the lady with the notebook?"', next: 'jam_dee' },
        { t: '"Doesn\'t matter who\'s watching. Let\'s eat."', fx: { morale: 3 }, next: 'jam_calls' },
      ] },
    jam_dee: { scene: 'playground', fx: { flag: 'saw_dee' },
      lines: [
        ['tariq', 'That\'s Dee Carter, Elite Hoops Network. She\'s the scout who found Kai at twelve.'],
        ['tariq', 'If she writes your name in that notebook, bro, your life changes.'],
      ],
      choices: [
        { t: 'Feel the pressure. Lock in.', fx: { attrs: { clutch: 1 }, morale: -2 }, next: 'jam_calls' },
        { t: 'Smile. Let her watch.', fx: { morale: 4 }, next: 'jam_calls' },
      ] },
    /* ---- the Summer Jam: street calls, your crew, a game plan each round (the games mix live arcade with choice moments) ---- */
    jam_calls: { scene: 'playground', fx: { flag: 'street_calls', unlock: 'street_calls' },
      lines: [
        ['lou', 'Three-on-three is a thinking game, kid. Somebody has to call it.'],
        ['lou', 'Give-and-go. Iso. Feed the hot hand. Clear out. Four calls — that\'s all you need out here.'],
        ['tariq', 'Wait. We get PLAYS? Like real ones?', 'smile'],
        ['lou', 'Street plays. The fancy stuff comes when somebody pays you to run it.', 'smile'],
      ], next: 'jam_team' },
    jam_team: { scene: 'playground',
      lines: [
        ['tariq', 'It\'s you, me, and one more. Who\'s the third?'],
        ['narrator', 'Three guys from the block are leaning on the fence, waiting to be picked.'],
      ],
      choices: [
        { t: 'Big Rudy — the big man.', hint: 'Rebounds and finishes inside · ⚔ Sky Hook, Hammer Put-Back', fx: { jam: { mate: 'Big Rudy' }, rel: { tariq: 1 } }, next: 'jam_plan1' },
        { t: 'Smoke — the shooter.', hint: 'Spaces the floor from anywhere · ⚔ Logo Three', fx: { jam: { mate: 'Smoke' } }, next: 'jam_plan1' },
        { t: 'Lil\' Dez — the pest.', hint: 'Quick hands, quick floaters · ⚔ Pickpocket, Floater', fx: { jam: { mate: 'Lil\' Dez' } }, next: 'jam_plan1' },
      ] },
    jam_plan1: { scene: 'playground',
      lines: [
        ['tariq', 'Round one: Southside Bricklayers. Hammer Jones lives in the paint and loves a poster.'],
        ['lou', 'Big, slow, physical. So how do you want to play them?'],
      ],
      choices: [
        { t: 'Run and gun. Make the big man run.', hint: 'Easier layups and dunks, a little looser shooting', fx: { jam: { plan: 'run' } }, next: 'm2' },
        { t: 'Slow it down. Work for good jumpers.', hint: 'Better jumpers, fewer cheap points for them', fx: { jam: { plan: 'slow' } }, next: 'm2' },
        { t: 'Lock in on defense. Wall up the paint.', hint: 'Their shots get much harder, yours a bit harder too', fx: { jam: { plan: 'lock' } }, next: 'm2' },
      ] },
    m2: { type: 'match', us: 'halsey', them: 'southside', pickup: { size: 3, target: 21 }, jam: true, venue: 'cage', rating: 45, mateRating: 41, moments: 9, level: 'street',
      title: 'Halsey Summer Jam', sub: 'Round 1', win: 'm2_win', lose: 'm2_loss' },
    m2_win: { scene: 'playground', fx: { rep: 4, fans: 200 },
      lines: [
        ['mc', 'HALSEY STREET MOVES ON! Somebody check on Hammer Jones, he\'s been posterized emotionally!'],
        ['hammer', 'Respect, little man. You\'re tougher than you look.', 'smile'],
      ], next: 'jam_cel_check' },
    /* Celebrations: the block hypes you up after your first big win and you pick your first one */
    jam_cel_check: { type: 'branch', branches: [{ if: { notFlag: 'feat_celebrations' }, next: 'jam_celebrate' }], else: 'jam_rest' },
    jam_celebrate: { scene: 'playground',
      lines: [
        ['narrator', 'The whole fence is shaking. Kids from the block are chanting your number.'],
        ['tariq', 'Bro, they want something! You can\'t just walk off after THAT.', 'smile'],
        ['mc', 'GIVE THE PEOPLE WHAT THEY WANT, NUMBER {num}!'],
      ],
      choices: [
        { t: 'Flex for the fence. Both arms.', fx: { unlock: 'celebrations', celeb: 'flex', fans: 60 }, next: 'jam_rest' },
        { t: 'Point at Nia in the crowd.', fx: { unlock: 'celebrations', celeb: 'point', rel: { nia: 4 } }, next: 'jam_rest' },
        { t: 'Throw your head back and scream.', fx: { unlock: 'celebrations', celeb: 'scream', morale: 3 }, next: 'jam_rest' },
      ] },
    m2_loss: { scene: 'playground', fx: { fatigue: 15, attrs: { stam: 2 }, morale: -2 },
      lines: [
        ['narrator', 'Hammer Jones puts you on the asphalt on the final possession. No call — pickup rules.'],
        ['narrator', 'But the Jam is double-elimination. You fight back through the loser\'s bracket — three games in the heat — and sneak into the final on dead legs.'],
        ['hammer', 'You don\'t quit, huh? Respect.'],
      ], next: 'jam_rest' },
    jam_rest: { scene: 'playground',
      lines: [['narrator', 'Two hours until the final. The sun is brutal and your legs know it.'], ['lou', 'Rest or work. Pick one and own it.']],
      choices: [
        { t: 'Find some shade. Ice, water, nap.', hint: 'Fresh legs for the final', fx: { fatigue: -25, morale: 2 }, next: 'hub2' },
        { t: 'Get shots up on the side court.', hint: 'A small boost in the final, but tired legs', fx: { fatigue: 12, jam: { boost: true } }, next: 'hub2' },
      ] },
    hub2: { type: 'hub', title: 'Before the Final', next: 'party_invite',
      intro: 'One night until the Summer Jam final. Train, rest, or gear up — fatigue carries into the next game.' },

    party_invite: { scene: 'street_night',
      lines: [
        ['narrator', 'The night before the Summer Jam final. Your phone buzzes.'],
        ['marcus', 'Cuz! Delancey party tonight — Westbrook kids, Eastview girls, everybody, and you\'re kinda famous right now.', 'smile'],
        ['marcus', 'Come on, one night. You\'ve been in that gym all summer.'],
      ],
      choices: [
        { t: '"Nah, final\'s tomorrow. Shots up, then bed."', hint: 'Safe', fx: { attrs: { three: 1, mid: 1 }, morale: 2, rel: { lou: 5 }, fatigue: -10 }, next: 'final_morning' },
        { t: '"I\'ll swing by for an hour. Just to show my face."', check: { a: 'iq', dc: 42 }, next: 'party_ok', fail: 'party_bad' },
        { t: '"Let\'s go. I deserve a night off."', hint: 'Risky', next: 'party_full' },
      ] },
    party_ok: { scene: 'party', fx: { fans: 150 },
      lines: [
        ['narrator', 'You show up, dap up half of {hometown}, take some pictures, and slip out the back by eleven.'],
        ['narrator', 'On the way out you spot Kai Sterling in a corner — alone, on his phone, looking like he\'d rather be anywhere else.'],
        ['kai', '…Don\'t tell anyone you saw me here. My dad thinks I\'m at a film session.', 'sad'],
      ],
      choices: [
        { t: '"Your secret\'s safe. See you tomorrow."', fx: { rel: { kai: 10 }, flag: 'kai_secret' }, next: 'final_morning' },
        { t: '"Film session, huh? Good to know the golden boy\'s human."', fx: { rel: { kai: -5 }, morale: 3 }, next: 'final_morning' },
      ] },
    party_bad: { scene: 'party',
      lines: [
        ['narrator', 'One hour turns into three, the speakers get louder, and somebody\'s cousin starts a fight.'],
        ['narrator', 'Then: red and blue lights through the front window.'],
        ['marcus', 'COPS! Back door, back door!', 'fierce'],
      ],
      choices: [
        { t: 'Sprint for the back fence.', check: { a: 'speed', dc: 42 }, next: 'party_escape', fail: 'party_caught' },
        { t: 'Stay put, hands visible. You didn\'t do anything.', next: 'party_stay' },
      ] },
    party_escape: { scene: 'street_night', fx: { fatigue: 20, morale: -4 },
      lines: [['narrator', 'You\'re over the fence before anyone sees your face, six blocks at a dead sprint. Then you lie awake till 4 a.m., heart pounding.']], next: 'final_morning' },
    party_stay: { scene: 'street_night', fx: { rep: -3, fans: 100, fatigue: 15 },
      lines: [['narrator', 'You sit on the couch with your hands where everyone can see them. The officers clear the house and let you go with a warning… but someone posts a video of you there.']], next: 'final_morning' },
    party_caught: { scene: 'street_night', fx: { rep: -8, fans: 300, rel: { mom: -10 }, morale: -8, fatigue: 20, flag: ['late_night', 'police_record'], post: { by: 'streetball', text: 'Halsey Street\'s {first} {last} spotted in the back of a cop car at 2am the night before the Summer Jam final. Priorities? 👀' } },
      lines: [
        ['narrator', 'A flashlight hits your face. You\'re not arrested — but your name lands in an incident report, and a photo of you in the back of a cruiser lands on CourtVision.'],
        ['mom', 'I worked a double, and I had to come get my son from a police station at three in the morning.', 'sad'],
        ['mom', 'I\'m not mad, baby — I\'m scared. You know how fast this city takes boys like you?', 'sad'],
      ],
      choices: [
        { t: '"I\'m sorry, Mom. It won\'t happen again."', fx: { rel: { mom: 6 }, attrs: { iq: 1 } }, next: 'final_morning' },
        { t: '"I didn\'t even do anything!"', fx: { rel: { mom: -4 }, morale: 2 }, next: 'final_morning' },
      ] },
    party_full: { scene: 'party',
      lines: [
        ['narrator', 'The music is loud and the night is long. At 2 a.m., Marcus jingles a set of keys that are definitely not his.'],
        ['marcus', 'Yo, my homie left his Charger — five-minute spin. Nobody\'ll know.', 'smile'],
      ],
      choices: [
        { t: 'Get in the car.', hint: '⚠ Career-defining', next: 'crash' },
        { t: '"Nah, I\'m out. I\'ve got a final tomorrow."', fx: { fatigue: 25, morale: -3, flag: 'late_night' }, next: 'final_morning' },
        { t: 'Take the keys away from him.', check: { a: 'str', dc: 40 }, next: 'keys_ok', fail: 'keys_fail' },
      ] },
    keys_ok: { scene: 'street_night', fx: { fatigue: 20, rep: 2, flag: ['late_night', 'saved_marcus'], rel: { marcus: 15 } },
      lines: [
        ['narrator', 'You twist the keys out of Marcus\'s hand — he curses but doesn\'t fight. You call him a cab and walk home at 3 a.m.'],
        ['marcus', '…You\'re a buzzkill, cuz. But… thanks.', 'sad'],
      ], next: 'final_morning' },
    keys_fail: { scene: 'hospital', fx: { morale: -10, fatigue: 20, flag: ['late_night', 'marcus_crash'] },
      lines: [
        ['narrator', 'Marcus shoves you off and peels away. You stand on the curb screaming at taillights.'],
        ['narrator', 'By morning you hear he wrapped the car around a light pole. Alive, broken pelvis — he\'ll be okay… eventually.'],
        ['narrator', 'You visit him before the final. He can barely talk, but he squeezes your hand and says: "Go win it, cuz."'],
      ], next: 'final_morning' },

    crash: { scene: 'street_night',
      lines: [
        ['narrator', 'Five minutes turns into ninety miles an hour on the Fifth Avenue overpass.'],
        ['narrator', 'You remember headlights, glass… then nothing.'],
      ], next: 'crash2' },
    crash2: { scene: 'hospital', cutscene: 'career_end',
      lines: [
        ['narrator', 'When you wake up, Mom is asleep in the chair beside your bed. Her hand is still holding yours.'],
        ['narrator', 'The doctor says "shattered" and "multiple surgeries." You\'ll walk again — you\'ll never play basketball again.'],
        ['lou', '…Smart players play fifteen years, kid. I\'m so sorry.', 'sad', { notFlag: 'lou_snub' }],
      ],
      choices: [{ t: 'End of the road…', next: 'end_crash' }] },
    end_crash: { type: 'ending', ending: 'crash' },

    final_morning: { scene: 'playground',
      lines: [
        ['narrator', 'Summer Jam Final: Halsey Street vs. Westbrook Elite. Three hundred people crammed around a court built for forty.'],
        ['narrator', 'Your legs feel like wet sand. Last night is catching up with you.', null, { flag: 'late_night' }],
        ['kai', 'Told you I\'d see you again, Halsey. Hope you got some sleep.', 'fierce', { notFlag: 'kai_secret' }],
        ['kai', '(quietly) Thanks for last night. Doesn\'t mean I\'m taking it easy on you.', 'smile', { flag: 'kai_secret' }],
        ['dee', '(to herself, scribbling) Number {num}. Okay — show me something.', null, { flag: 'saw_dee' }],
        ['lou', 'Remember: the rim, not the man.', null, { notFlag: 'lou_snub' }],
      ],
      choices: [
        { t: '"Let\'s finish what we started."', fx: { morale: 4 }, next: 'jam_plan2' },
        { t: '"Hope you brought your dad, Kai. You\'re gonna need a ride home."', req: { flag: 'trash_kai' }, fx: { rep: 3, rel: { kai: -5 }, morale: 6 }, next: 'jam_plan2' },
        { t: 'Find Tariq. "Whatever happens, it\'s us — Halsey."', fx: { rel: { tariq: 8 }, chem: 10 }, next: 'jam_plan2' },
      ] },
    jam_plan2: { scene: 'playground',
      lines: [
        ['lou', 'Westbrook pushes the pace and everything runs through Kai. He breaks ankles for fun.'],
        ['tariq', 'So… what\'s the plan, captain?'],
      ],
      choices: [
        { t: 'Run with them. Our legs, our court.', hint: 'Easier layups and dunks, a little looser shooting', fx: { jam: { plan: 'run' } }, next: 'm3' },
        { t: 'Slow it down. Make Kai play half-court.', hint: 'Better jumpers, fewer cheap points for them', fx: { jam: { plan: 'slow' } }, next: 'm3' },
        { t: 'Lock in. Make every shot ugly.', hint: 'Their shots get much harder, yours a bit harder too', fx: { jam: { plan: 'lock' } }, next: 'm3' },
      ] },
    m3: { type: 'match', us: 'halsey', them: 'westbrook_elite', pickup: { size: 3, target: 21 }, jam: true, venue: 'street_night', rating: 54, mateRating: 43, moments: 11, level: 'street', importance: 2,
      title: 'Halsey Summer Jam', sub: 'Championship', win: 'm3_win', lose: 'm3_loss', gradeFlag: { min: 68, flag: 'good_final' } },
    m3_win: { scene: 'playground', fx: { flag: ['summer_champ', 'beat_kai'], rep: 10, fans: 800, xp: 120, money: 100, post: { by: 'courtvision', text: '🏆 HALSEY SUMMER JAM CHAMPIONS: Halsey Street! {first} {last} outplays #1 sophomore Kai Sterling — a star is born on Fifth Street.' } },
      lines: [
        ['narrator', 'The final buzzer is a guy with an air horn. It\'s the best sound you\'ve ever heard.'],
        ['tariq', 'WE\'RE THE CHAMPS! HALSEY STREEEEET!', 'smile'],
        ['mc', 'Your Summer Jam champion and MVP… number {num}… {FIRST}… {LAST}!'],
        ['kai', '…Good game. For real this time.'],
      ],
      choices: [
        { t: 'Dap him up: "Good game. See you at the next level."', fx: { rel: { kai: 12 }, flag: 'kai_respect' }, next: 'jam_final_cel' },
        { t: '"Tell your dad I said hi."', fx: { rel: { kai: -10 }, rep: 4, fans: 200 }, next: 'jam_final_cel' },
      ] },
    jam_final_cel: { type: 'branch', branches: [{ if: { notFlag: 'feat_celebrations' }, next: 'jam_celebrate2' }], else: 'scout_branch' },
    jam_celebrate2: { scene: 'playground',
      lines: [
        ['narrator', 'Somebody\'s little brother is on your shoulders. You don\'t remember picking him up.'],
        ['tariq', 'CHAMPIONS! Do something! Anything! They\'re filming!', 'smile'],
      ],
      choices: [
        { t: 'Flex. Every muscle you have.', fx: { unlock: 'celebrations', celeb: 'flex' }, next: 'scout_branch' },
        { t: 'Point to the sky.', fx: { unlock: 'celebrations', celeb: 'point' }, next: 'scout_branch' },
        { t: 'Scream until your voice goes.', fx: { unlock: 'celebrations', celeb: 'scream' }, next: 'scout_branch' },
      ] },
    m3_loss: { scene: 'playground', fx: { rep: 4, fans: 300, xp: 60 },
      lines: [
        ['narrator', 'You lose by a bucket. Kai walks off with the trophy and a microphone in his face.'],
        ['narrator', 'But three hundred people saw you take the #1 sophomore in America to the final possession.'],
        ['kai', 'You\'re annoying, you know that? Most people quit by the second half.'],
      ], next: 'scout_branch' },

    scout_branch: { type: 'branch',
      branches: [
        { if: { flag: 'summer_champ' }, next: 'dee_offer' },
        { if: { flag: 'good_final' }, next: 'dee_offer' },
        { if: { rel: { lou: 40 } }, next: 'lou_calls' },
      ], else: 'no_scout' },
    lou_calls: { scene: 'rec',
      lines: [
        ['lou', 'Made a call to an old friend, Dee Carter. She\'s coming to watch you work out Thursday.'],
        ['narrator', 'Thursday, you drain 41 of 50 from deep while Lou rebounds. Dee Carter writes one word in her notebook and underlines it twice.'],
      ], next: 'dee_offer' },
    no_scout: { scene: 'playground_night', fx: { flag: ['unscouted', 'hs_lincoln'], morale: -3 },
      lines: [
        ['narrator', 'The scout leaves before the trophy ceremony. Nobody calls — not that week, not the next.'],
        ['tariq', 'Forget her, bro — we\'re going to Lincoln High together. We\'ll make them notice.'],
      ],
      choices: [{ t: '"Then we make them notice."', fx: { rel: { tariq: 8 }, attrs: { clutch: 2 } }, next: 'dee_list_cold' }] },
    /* the Prospect Rankings: Dee shows you the list (js/rankings.js) — your name is the last one */
    dee_list_cold: { scene: 'playground_night', cine: true, peaks: { 3: { kind: 'ranks' } }, fx: { unlock: 'rankings' },
      lines: [
        ['narrator', 'Three days after the Summer Jam, an email from Elite Hoops Network.'],
        ['dee', '(email) I didn\'t offer you anything. You weren\'t ready.'],
        ['dee', '(email) But I added one name to our top three hundred this morning. Scroll to the bottom.', 'smile'],
        ['narrator', 'Number three hundred: you. Kai Sterling is number three.'],
      ],
      choices: [{ t: 'Print it. Tape it above your bed.', fx: { morale: 5 }, next: 'ch_end' }, { t: 'Screenshot it and send it to Tariq.', fx: { rel: { tariq: 4 } }, next: 'ch_end' }] },
    dee_list: { scene: 'playground', cine: true, peaks: { 2: { kind: 'ranks' }, 4: { kind: 'aura', who: 'you' } }, fx: { unlock: 'rankings' },
      lines: [
        ['dee', 'One more thing. Elite Hoops Network ranks the top three hundred players your age.'],
        ['dee', 'Kai Sterling is number three. Want to see number three hundred?'],
        ['narrator', 'She turns the tablet around. The last name on the list is yours.'],
        ['dee', 'I put you there myself this morning. Last isn\'t nothing — last is on the list.', 'smile'],
        ['you', 'Then I\'m coming for every name above me.'],
      ],
      choices: [{ t: '"Write my name in pen."', fx: { morale: 4 }, next: 'ch_end' }, { t: 'Screenshot it. Send it to Kai.', fx: { rel: { kai: -3 }, rep: 1 }, next: 'ch_end' }] },

    dee_offer: { cine: true, scene: 'playground', cutscene: 'scouted', fx: { flag: 'scouted', xp: 50, post: { by: 'ehn', text: 'Scouting note 📋 {first} {last} ({height} {pos}, {hometown}): raw, competitive, gets better when it gets harder. Unranked — for now.' } },
      lines: [
        ['dee', '{first} {last}? Dee Carter, Elite Hoops Network — nineteen years in this business.'],
        ['dee', 'You\'re raw. Your left hand is a rumor and your shot selection gave me a headache.'],
        ['dee', 'But you have the one thing I can\'t teach: you get better when it gets harder.', 'smile'],
        ['dee', 'Westbrook Academy has a scholarship spot open. Full ride, best facilities in the state, national TV games… and yes, you\'d be Kai Sterling\'s teammate.'],
        ['dee', 'Or you stay at Lincoln High with your friends, start from day one — and play against Westbrook twice a year.'],
      ],
      choices: [
        { t: '"Westbrook Academy. I want the best."', fx: { flag: 'hs_westbrook', rel: { kai: 3, tariq: -10 }, rep: 3 }, next: 'pick_westbrook' },
        { t: '"Lincoln High. I\'m not joining Kai — I\'m coming for him."', fx: { flag: 'hs_lincoln', rel: { tariq: 8 }, morale: 4 }, next: 'pick_lincoln' },
        { t: '"I need to talk to my mom and Lou first."', next: 'hs_talk' },
      ] },
    hs_talk: { scene: 'home',
      lines: [
        ['mom', 'A full scholarship? Baby, that\'s… that\'s more than I could ever give you.', 'smile'],
        ['mom', 'But I\'ve seen those Westbrook kids. Make sure you don\'t forget where you come from.'],
        ['lou', 'Westbrook will polish you, Lincoln will sharpen you. Different tools, same goal.', null, { notFlag: 'lou_snub' }],
        ['nia', 'Westbrook has a TikTok team. Just saying — for the brand.', 'smile'],
      ],
      choices: [
        { t: 'Choose Westbrook Academy.', fx: { flag: 'hs_westbrook', rel: { kai: 3, tariq: -6, mom: 4 }, rep: 3 }, next: 'pick_westbrook' },
        { t: 'Choose Lincoln High.', fx: { flag: 'hs_lincoln', rel: { tariq: 8, lou: 4 }, morale: 4 }, next: 'pick_lincoln' },
      ] },
    pick_westbrook: { scene: 'playground_night',
      lines: [
        ['tariq', 'Westbrook, huh? …Nah, it\'s cool — good look for you, really.', 'sad'],
        ['narrator', 'He doesn\'t look at you when he says it.'],
        ['kai', '(text message) Heard you\'re coming to Westbrook. Don\'t get comfy — that starting spot is mine.', 'fierce'],
      ], next: 'dee_list' },
    pick_lincoln: { scene: 'playground_night',
      lines: [
        ['tariq', 'LINCOLN LIONS, BABY! Me and you, starting backcourt — Kai\'s gonna HATE this!', 'smile'],
        ['kai', '(text message) Lincoln? Bold — see you in December, bring tissues.', 'fierce'],
      ], next: 'dee_list' },

    ch_end: { type: 'chapterEnd', nextChapter: 'highschool', fx: { develop: 'street' },
      summary: 'Summer\'s over. You came in a nobody and leave a {ovr}-Overall {posName} with a rival who knows your name.',
      recap: [
        { if: { flag: 'summer_champ' }, t: '🏆 Halsey Summer Jam champion' },
        { if: { flag: 'good_final', notFlag: 'summer_champ' }, t: '🥈 Took Westbrook Elite to the wire in the Summer Jam final' },
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
