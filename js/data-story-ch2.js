/* =====================================================================
   DATA-STORY-CH2.JS — CHAPTER 2: VARSITY BLUES (High School)
   Same node format as data-story.js (see the guide at the top of that file).

   Extra node types used here:
     type:'season'  — runs a full season (see js/season.js). The node's `then` says where the
                      story goes when it ends: { champion, eliminated, missed }.
                      Season pre-game / interrupt nodes return with next:'@season'.
     type:'collegeChoice' — builds one choice per college offer, plus `extra` choices.
   Season defs here use autoSim (non-key games are simmed in stretches with one highlights screen),
   simXp (XP share for those sims) and hubAP (training actions in the weeks you do play).
   `moved` (bottom of the chapter) sends older saves on cut or merged nodes to their replacement.
   Extra fx keys: develop:'stage', recruitOpen, recruit (re-rate), offers (true | 'final'),
                  hs:'teamId', path:'overseas|grind', set:{trust:45}
   Extra conditions: opp:'teamId' (next season opponent), minStars, maxStars, college, hs, path,
                     minTrust, maxTrust
   ===================================================================== */

/* ---------- new characters ---------- */
Object.assign(STORY.characters, {
  brennan: { name: 'Coach Hal Brennan', short: 'Brennan', role: 'Lincoln High head coach · 31 years', color: '#dc2626',
    look: { skin: '#eac4a6', hair: 'buzz', hairColor: '#9ca3af', beard: 'mustache', outfit: 'tee', jersey: '#b91c1c', trim: '#fbbf24', build: 'strong' } },
  graves:  { name: 'Coach Victor Graves', short: 'Graves', role: 'Westbrook Academy head coach', color: '#1d4ed8',
    look: { skin: '#f6d7c3', hair: 'flattop', hairColor: '#3b2416', beard: 'none', outfit: 'suit', jersey: '#1e3a8a', trim: '#facc15' } },
  brick:   { name: 'Darnell "Brick" Hollis', short: 'Brick', role: 'Lincoln senior captain', color: '#b91c1c',
    look: { skin: '#6b3d25', hair: 'braids', hairColor: '#0f0d0c', beard: 'stubble', outfit: 'jersey', jersey: '#b91c1c', trim: '#fbbf24', num: 32, build: 'strong' } },
  vale:    { name: 'Brandon Vale', short: 'Vale', role: 'Westbrook guard · Trust-fund jumper', color: '#60a5fa',
    look: { skin: '#f6d7c3', hair: 'long', hairColor: '#d4a85a', outfit: 'tracksuit', jersey: '#1e3a8a', trim: '#facc15', build: 'lean' } },
  silk:    { name: 'Marcus "Silk" Sterling', short: 'Silk', role: 'Kai\'s father · Former NBL All-Star', color: '#facc15',
    look: { skin: '#c68a5c', hair: 'bald', beard: 'full', hairColor: '#6b7280', outfit: 'suit', jersey: '#0f172a', trim: '#facc15', chain: true, build: 'strong' } },
  holt:    { name: 'Darius "D-Train" Holt', short: 'D-Train', role: 'Northgate star · 5-star forward', color: '#7c3aed',
    look: { skin: '#4a2a19', hair: 'fade', hairColor: '#0f0d0c', outfit: 'jersey', jersey: '#6d28d9', trim: '#d1d5db', num: 23, build: 'strong', headband: '#d1d5db' } },
  vince:   { name: 'Vince Shark', short: 'Vince', role: '"Consultant." Friend of the program.', color: '#a855f7',
    look: { skin: '#d9a77e', hair: 'curly', hairColor: '#0f0d0c', beard: 'goatee', outfit: 'suit', jersey: '#581c87', trim: '#facc15', chain: true } },
  kowalski: { name: 'Coach Mike Kowalski', short: 'Coach K', role: 'Blue Ridge University · 5 national titles', color: '#3b82f6',
    look: { skin: '#f6d7c3', hair: 'fade', hairColor: '#9ca3af', outfit: 'suit', jersey: '#1e3a8a', trim: '#f8fafc' } },
  simmons: { name: 'Coach Earl Simmons', short: 'Coach Simmons', role: 'Magnolia State Tigers', color: '#a855f7',
    look: { skin: '#6b3d25', hair: 'bald', beard: 'chinstrap', hairColor: '#9ca3af', outfit: 'polo', jersey: '#6b21a8', trim: '#facc15', build: 'strong' } },
});
STORY.accounts.recruit = { name: 'Recruiting Wire', handle: '@RecruitWire', verified: true, look: { skin: '#a86b43', hair: 'buzz', outfit: 'suit', jersey: '#0f172a' } };
STORY.accounts.silk = { name: 'Silk Sterling', handle: '@SilkSterling', verified: true, char: 'silk' };

/* ---------- early endings for this chapter ---------- */
Object.assign(STORY.endings, {
  locked: { title: 'Wrong Truck', tag: 'EARLY ENDING', scene: 'street_night',
    text: 'The second run was a setup: senior year in juvenile, and the recruiters stopped calling. Lou still writes monthly, always ending: "It\'s not too late to be somebody."' },
  broken: { title: 'Played Through It', tag: 'EARLY ENDING', scene: 'hospital',
    text: 'The pills hid the pain for a half, then your foot gave way on the first drive of the third. Three surgeries later you walk fine, but your burst and your offers are gone.' },
});

/* ---------- season definitions (shared bits) ---------- */
const METRO = ['lincoln', 'westbrook', 'northgate', 'eastview', 'central', 'stvincent', 'riverside', 'oakmont'];
const CITY_PLAYOFF = { teams: 4, name: 'City Playoffs', rounds: ['City Semifinal', 'City Final'], moments: [10, 12] };
const STATE_PLAYOFF = { teams: 4, name: 'State Tournament', rounds: ['State Semifinal', 'State Championship'], moments: [11, 13] };
/* regular-season games between the big ones are simmed with a highlights screen; more XP per sim and two training actions per played week */
const HS_PACE = { autoSim: true, simXp: .9, hubAP: 2 };
/* the national team summer already happened (older saves played it during or right after high school) */
const USA_DONE = s => !!(s.flags.usa_over || s.flags.usa_done || s.flags.usa_cut || s.flags.usa_skipped || s.flags.usa_missed);

STORY.chapters.highschool = {
  title: 'Chapter 2', name: 'Varsity Blues', stage: 'High School', start: 'start', xpBoost: 1.25,   // fewer played games than before: +25% XP per game keeps the end of the chapter near 58 Overall
  blurb: 'Two seasons, a summer on the AAU circuit, a coach who doubts you, Kai Sterling, recruiting stars and the state championship.',
  nodes: {
    start: { type: 'branch', fx: { recruitOpen: true, age: 17, set: { trust: 45 }, log: 'Started high school varsity.' },
      branches: [{ if: { flag: 'hs_westbrook' }, next: 'W_day1' }], else: 'L_day1' },

    /* ================================================================
       LINCOLN HIGH — JUNIOR YEAR
       ================================================================ */
    L_day1: { scene: 'gym', fx: { hs: 'lincoln' },
      lines: [
        ['narrator', 'Lincoln High: gym built in 1962, roof still leaking over the left corner three. During games, they put a bucket there.'],
        ['tariq', 'Home sweet home, bro — tryouts are Monday. Brennan cut ELEVEN guys last year.', 'smile'],
        ['brennan', 'You\'re {first} {last}. The Summer Jam kid.'],
        ['brennan', 'Playground kids think defense is optional and passing is for cowards. I\'ve buried a dozen of you.', 'fierce'],
      ],
      choices: [
        { t: '"Yes sir. I\'ll earn it."', fx: { trust: 6, rel: { brennan: 5 } }, next: 'L_tryout_pre' },
        { t: '"With respect, Coach — watch the Summer Jam tape."', req: { flag: 'summer_champ' }, fx: { rep: 2, trust: -6, flag: 'c2_tape' }, next: 'L_tryout_pre' },
        { t: '"What do you need from me to start?"', check: { a: 'iq', dc: 46 }, fx: { trust: 8, attrs: { iq: 1 }, flag: 'c2_need' }, failFx: { trust: -2, fatigue: 10, flag: 'c2_need_fail' }, next: 'L_tryout_pre' },
      ] },
    L_tryout_pre: { scene: 'gym',
      lines: [
        ['brennan', 'I watched your tape. Nineteen shots, four teammates: that\'s a solo album, son.', 'fierce', { flag: 'c2_tape' }],
        ['brennan', '…Nobody asks me that. Defend, talk, box out, and I\'ll find you minutes.', null, { flag: 'c2_need' }],
        ['brennan', 'What I need is for you to stop talking. Baseline — go.', 'fierce', { flag: 'c2_need_fail' }],
        ['narrator', 'Tryouts: fifty-one kids, four open spots. Brennan splits the gym — hopefuls against varsity returners.'],
        ['brick', 'Darnell Hollis, senior captain. They call me Brick — that\'s what you\'ll be hitting all day.', 'fierce'],
        ['tariq', 'Let\'s show these dudes what Halsey Street looks like.'],
      ], next: 'L_tryout' },
    L_tryout: { type: 'match', us: 'lincoln_hopefuls', them: 'lincoln_varsity', rating: 49, mateRating: 43, moments: 8, level: 'hs',
      title: 'Varsity Tryouts', sub: 'Hopefuls vs Returners', win: 'L_starter', lose: 'L_bench' },
    L_starter: { scene: 'gym', cutscene: 'varsity', fx: { flag: 'starter', trust: 10, rep: 3, post: { by: 'fan', text: 'heard {first} {last} made Lincoln varsity AS A STARTER over two seniors 👀' } },
      lines: [
        ['brennan', 'Starting five: Hollis, Cole, Pike, Miles.'],
        ['brennan', '…And {last}.'],
        ['narrator', 'Brick Hollis stares at you like you just stole his car. Tariq is trying very hard not to scream.'],
      ], next: 'L_playbook' },
    L_bench: { scene: 'gym', fx: { trust: -4, morale: -3 },
      lines: [
        ['brennan', 'You made varsity — barely. You\'ll come off the bench.'],
        ['brennan', 'Miles — you start.'],
        ['narrator', 'Tariq freezes, then looks at you. Your best friend just took the spot that was supposed to be yours.'],
      ],
      choices: [
        { t: '"Happy for you, T. For real."', fx: { rel: { tariq: 8 }, chem: 6 }, next: 'L_playbook' },
        { t: '"…That should\'ve been me."', fx: { rel: { tariq: -10 }, morale: 3 }, next: 'L_playbook' },
      ] },
    L_playbook: { scene: 'locker', fx: { unlock: 'playbook' },
      lines: [
        ['narrator', 'Locker room. Coach Brennan uncaps a marker that\'s older than you.'],
        ['brennan', 'Thirty-one years, one rule: we run plays. This is the first one.', 'determined'],
        ['narrator', 'Two circles, an X, an arrow curling around a screen. Pick-and-roll.'],
        ['brennan', 'Learn this and I\'ll teach you the next. Ignore it and you\'ll learn the bench.'],
      ], next: 'L_season1' },

    L_season1: { type: 'season', then: { champion: 'c2_jr_champ', eliminated: 'c2_jr_out', missed: 'c2_jr_out' },
      season: Object.assign({
        id: 'junior_lincoln', name: 'Junior Season', level: 'hs', user: 'lincoln', mateRating: 46, teams: METRO, champFlag: 'city_champ',
        schedule: [
          { opp: 'eastview', key: true, title: 'Season Opener', pre: 'c2_opener_pre' },
          { opp: 'central' },
          { opp: 'westbrook', key: true, title: 'Rivalry Night', importance: 2, moments: 11, pre: 'L_kai1_pre', post: { win: 'L_kai1_win', lose: 'L_kai1_loss' } },
          { opp: 'stvincent' },
          { opp: 'northgate' },
        ],
        interrupts: { 1: 'L_brick', 3: 'c2_viral_jr' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 1: 'c2_cityfinal_pre' } }, CITY_PLAYOFF),
      }, HS_PACE) },
    L_brick: { scene: 'locker',
      lines: [
        ['narrator', 'Locker room after practice. Brick Hollis is waiting by your locker.'],
        ['brick', 'Two years I waited for this team to be MINE — senior year, scouts coming. Then you show up shooting like it\'s your audition.', 'fierce'],
        ['brick', 'Some of us need this too, playground.'],
      ],
      choices: [
        { t: '"You\'re right — I\'ll find you more. We win together."', fx: { chem: 10, trust: 5, rep: -1, rel: { brick: 12 }, flag: 'brick_ally' }, next: '@season' },
        { t: '"Then stop missing and I\'ll pass it to you."', fx: { rep: 3, chem: -8, rel: { brick: -12 } }, next: 'L_brick_fight' },
        { t: 'Sit down next to him. "Tell me what the scouts want to see from you."', check: { a: 'iq', dc: 48 }, fx: { chem: 12, rel: { brick: 18 }, flag: 'brick_ally', trust: 4 }, next: '@season', fail: 'L_brick_fight' },
      ] },
    L_brick_fight: { scene: 'locker',
      lines: [
        ['narrator', 'Brick shoves you into the lockers. The whole room goes silent.'],
        ['brick', 'Say it again. Say it again!', 'fierce'],
      ],
      choices: [
        { t: 'Swing on him.', hint: 'Suspended a week', fx: { trust: -15, rep: -3, morale: 3, flag: 'benched_fight', rel: { brick: -20, lou: -6 }, injury: { games: 1, name: 'Suspended (conditioning only)' }, log: 'Suspended a week for fighting a teammate.' }, next: '@season' },
        { t: 'Walk away.', fx: { trust: 4, morale: -3, attrs: { iq: 1 } }, next: '@season' },
      ] },
    L_kai1_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Westbrook comes to Lincoln with a charter bus, a film crew, and Silk Sterling in sunglasses, indoors.'],
        ['kai', 'Lincoln suits you, Halsey. Everything here is old and falling apart.', 'smile', { maxRel: { kai: 9 } }],
        ['kai', 'Hey, good to see you. Let\'s give them a show.', 'smile', { rel: { kai: 10 } }],
      ],
      choices: [
        { t: '"Tonight it\'s personal."', fx: { morale: 5, rel: { kai: -3 } }, next: '@season' },
        { t: 'Shake his hand. "May the best one win."', fx: { rel: { kai: 5 }, attrs: { iq: 1 } }, next: '@season' },
        { t: '"Your dad looks nervous, Kai."', req: { flag: 'trash_kai' }, fx: { rel: { kai: -10 }, rep: 3, morale: 6 }, next: '@season' },
      ] },
    L_kai1_win: { scene: 'gym', fx: { rep: 6, fans: 3000, recruit: true, post: { by: 'courtvision', text: '🚨 UPSET ALERT 🚨 Lincoln High knocks off #1 Westbrook! {first} {last} outplays Kai Sterling on his home floor… wait, Lincoln\'s home floor, you get it.' } },
      lines: [
        ['narrator', 'The buzzer sounds and the Lincoln student section pours onto the court. Somebody\'s little brother hugs you around the waist.'],
        ['narrator', 'Through the crowd, you see Silk Sterling grab Kai by the arm in the hallway. He\'s not yelling — somehow that\'s worse.'],
      ],
      choices: [
        { t: 'Push through the crowd and check on Kai.', fx: { rel: { kai: 10 }, flag: 'saw_silk' }, next: 'L_kai_hall' },
        { t: 'Stay with your team. This is Lincoln\'s night.', fx: { chem: 8, rep: 2 }, next: 'c2_cel_check' },
      ] },
    L_kai_hall: { cine: true, scene: 'locker',
      lines: [
        ['kai', '…What do you want, Halsey? Come to gloat?', 'sad'],
        ['you', 'Your dad always like that?'],
        ['kai', '"Sterlings don\'t lose to public schools." That\'s all he said.', 'sad'],
        ['kai', 'Don\'t tell anyone about this either. You\'re starting a collection.'],
      ], next: '@season' },
    L_kai1_loss: { scene: 'gym', fx: { morale: -3, post: { by: 'kai', text: 'Lincoln was loud tonight, still 1-0 though. See you in the playoffs 😴' } },
      lines: [
        ['narrator', 'Kai finishes with thirty-one. Silk Sterling claps exactly once.'],
        ['kai', 'Good effort, Lincoln. Same time next year?'],
        ['tariq', 'We\'ll get him, bro. We\'re gonna get him.', 'sad'],
      ], next: '@season' },

    /* ================================================================
       WESTBROOK ACADEMY — JUNIOR YEAR
       ================================================================ */
    W_day1: { scene: 'gym', fx: { hs: 'westbrook' },
      lines: [
        ['narrator', 'Westbrook Academy. Three gyms, a cryotherapy chamber, a smoothie bar, and a trophy case longer than your whole apartment.'],
        ['graves', 'You\'re here because Dee Carter vouched for you. Dee has never been wrong — yet.'],
        ['graves', 'This program runs through Kai Sterling, first overall in two years. Your job is to make his life easier.'],
        ['kai', 'Welcome to the big leagues, Halsey. Try not to get lost on the way to the cafeteria.', 'smile'],
      ],
      choices: [
        { t: '"I\'m not here to be anybody\'s backup, Coach."', fx: { rep: 3, trust: -6, rel: { kai: -4 } }, next: 'W_vale' },
        { t: '"Yes, Coach. Where do you need me?"', fx: { trust: 6, rel: { graves: 5 } }, next: 'W_vale' },
        { t: 'Turn to Kai: "We could be unstoppable. Let\'s make this work."', fx: { rel: { kai: 7 }, chem: 4 }, next: 'W_vale' },
      ] },
    W_vale: { scene: 'locker',
      lines: [
        ['vale', 'Yo, scholarship, are those… retail? Like, from a store, with a receipt?', 'smile'],
        ['narrator', 'Half the locker room laughs. Kai doesn\'t — he just watches.'],
      ],
      choices: [
        { t: 'Laugh it off. "They still got buckets this summer."', fx: { chem: 6, morale: 2 }, next: 'W_tryout_pre' },
        { t: '"My shoes cost less than your haircut and they cooked your boy Kai."', fx: { rep: 3, chem: -5, rel: { kai: -3 } }, next: 'W_tryout_pre' },
        { t: '"One-on-one. Loser gives up his shoes."', check: { a: 'handle', dc: 48 }, fx: { chem: 6, rep: 4, money: 150, rel: { vale: 6 }, flag: 'vale_won' }, failFx: { morale: -5, chem: -2, flag: 'vale_lost' }, next: 'W_tryout_pre' },
      ] },
    W_tryout_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Eleven to four. Vale hands over shoes that cost more than your rent — you sell them and give Mom the $150.', null, { flag: 'vale_won' }],
        ['narrator', 'Vale hits a fadeaway at 10-10 and spends the week calling you "Retail."', null, { flag: 'vale_lost' }],
        ['graves', 'Blue is my returning starters, White is everybody else. This scrimmage sets my rotation — no do-overs.'],
        ['kai', 'Don\'t take it personal when I score on you. I score on everybody.', 'fierce'],
      ], next: 'W_tryout' },
    W_tryout: { type: 'match', us: 'westbrook_white', them: 'westbrook_blue', rating: 55, mateRating: 47, moments: 8, level: 'hs',
      title: 'Westbrook Scrimmage', sub: 'White vs Blue', win: 'W_starter', lose: 'W_bench' },
    W_starter: { scene: 'gym', cutscene: 'varsity', fx: { flag: 'starter', trust: 10, rep: 3, rel: { kai: -4 } },
      lines: [
        ['graves', '…Fine. You start, next to Kai.'],
        ['kai', 'Next to me? Cute — don\'t forget whose team it is.', 'fierce'],
      ], next: 'W_playbook' },
    W_bench: { scene: 'gym', fx: { trust: -3 },
      lines: [['graves', 'Sixth man. Earn it.'], ['vale', 'Welcome to the bench, Retail. Snacks are on the left.', 'smile']], next: 'W_playbook' },

    W_playbook: { scene: 'locker', fx: { unlock: 'playbook' },
      lines: [
        ['narrator', 'Film room, 6 a.m. Coach Graves has already filled a whiteboard with diagrams.'],
        ['graves', 'Westbrook runs a system. You will learn it one piece at a time.'],
        ['narrator', 'He draws a screen, a roll, two arrows. Pick-and-roll.'],
        ['kai', '(not looking up from his phone) He\'s gonna mess it up.', 'smile'],
      ], next: 'W_season1' },
    c2_cel_check: { type: 'branch', branches: [{ if: { notFlag: 'feat_celebrations' }, next: 'c2_celebrate' }], else: '@season' },
    c2_celebrate: { scene: 'gym',
      lines: [['narrator', 'The student section spills onto the floor. Somebody hands you a microphone you don\'t want.'], ['tariq', 'First real win in front of a real crowd. Give them something!', 'smile']],
      choices: [
        { t: 'Flex for the student section.', fx: { unlock: 'celebrations', celeb: 'flex' }, next: '@season' },
        { t: 'Point at the scoreboard.', fx: { unlock: 'celebrations', celeb: 'point' }, next: '@season' },
        { t: 'Thump your chest. Twice.', fx: { unlock: 'celebrations', celeb: 'thump' }, next: '@season' },
      ] },
    W_season1: { type: 'season', then: { champion: 'c2_jr_champ', eliminated: 'c2_jr_out', missed: 'c2_jr_out' },
      season: Object.assign({
        id: 'junior_westbrook', name: 'Junior Season', level: 'hs', user: 'westbrook', mateRating: 55, teams: METRO, champFlag: 'city_champ',
        schedule: [
          { opp: 'eastview', key: true, title: 'Season Opener', pre: 'c2_opener_pre' },
          { opp: 'central' },
          { opp: 'lincoln', key: true, title: 'Old Friends', importance: 2, moments: 11, pre: 'W_tariq_pre', post: { win: 'W_tariq_win', lose: 'W_tariq_loss' } },
          { opp: 'stvincent' },
          { opp: 'northgate' },
        ],
        interrupts: { 1: 'W_kai_freeze', 3: 'c2_viral_jr' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 1: 'c2_cityfinal_pre' } }, CITY_PLAYOFF),
      }, HS_PACE) },
    W_kai_freeze: { scene: 'gym',
      lines: [
        ['narrator', 'Three games in, the pattern is obvious: when you\'re open, Kai doesn\'t see you. When he\'s double-teamed, he still doesn\'t see you.'],
        ['vale', 'He\'s freezing you out, bro. Everybody can see it.'],
      ],
      choices: [
        { t: 'Confront him in the huddle, in front of everyone.', fx: { rel: { kai: -8 }, rep: 2, trust: -4, chem: -6 }, next: '@season' },
        { t: 'Find him after practice. Talk one-on-one.', check: { a: 'iq', dc: 44 }, next: 'W_kai_talk_ok', fail: '@season', failFx: { rel: { kai: -5 }, morale: -3 } },
        { t: 'Go to Coach Graves.', fx: { trust: 4, rel: { kai: -10 } }, next: '@season' },
      ] },
    W_kai_talk_ok: { scene: 'gym', fx: { rel: { kai: 12 }, chem: 10, flag: 'kai_ally' },
      lines: [
        ['kai', 'Truth? My dad watches film every night and pauses on every pass that doesn\'t lead to MY bucket.', 'sad'],
        ['kai', 'You secured my secret at that party. So I\'ll trust you with this one.', null, { flag: 'kai_secret' }],
        ['you', 'Then let\'s give him film he can\'t argue with. Two-man game, every night.'],
        ['kai', '…Fine. But I get the last shot.', 'smile'],
      ], next: '@season' },
    W_tariq_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Westbrook at Lincoln. The leaky-roof gym is so packed they open the doors so people can watch from the hallway.'],
        ['narrator', 'The Lincoln student section has a banner: "HALSEY SOLD OUT." Somebody drew your face with a dollar sign for an eye.'],
        ['tariq', 'Don\'t look at the sign, bro, look at me. I\'m about to cook you.', 'smile', { rel: { tariq: 50 } }],
        ['tariq', '…', 'fierce', { maxRel: { tariq: 49 } }],
      ],
      choices: [
        { t: 'Dap Tariq up at center court.', fx: { rel: { tariq: 6 }, morale: 2 }, next: '@season' },
        { t: 'Blow a kiss to the student section.', fx: { rep: 3, rel: { tariq: -4 }, fans: 1500 }, next: '@season' },
      ] },
    W_tariq_win: { scene: 'gym', fx: { rep: 3, recruit: true },
      lines: [
        ['tariq', 'Proud of you, man. Still hate you — mostly proud though.', 'smile', { rel: { tariq: 50 } }],
        ['tariq', 'Hope it was worth it, {first}. Hope Westbrook was worth it.', 'sad', { maxRel: { tariq: 49 } }],
      ], next: 'c2_cel_check' },
    W_tariq_loss: { scene: 'gym', fx: { trust: -6, morale: -4, rel: { tariq: 5 }, post: { by: 'tariq', text: 'LINCOLN OVER WESTBROOK. I hit the game winner over my best friend and I will be talking about it at his wedding.' } },
      lines: [
        ['narrator', 'Lincoln upsets Westbrook. Tariq hits the game-winner — over you.'],
        ['graves', 'We lost to a team with a bucket on the floor. A BUCKET.', 'fierce'],
        ['tariq', '(from across the gym, mouthing) My bad, bro. Not really.', 'smile'],
      ], next: '@season' },

    /* ---------- shared junior-year beats (both schools) ---------- */
    c2_opener_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Your first varsity game. Lincoln hasn\'t had a winning season in six years, but the bleachers are full.', null, { hs: 'lincoln' }],
        ['narrator', 'Season opener, streaming nationally. A camera on a cable is flying over the court.', null, { hs: 'westbrook' }],
        ['nia', '(third row, waving a poster of your face) THAT\'S MY BROTHER, NUMBER {num}!', 'smile', { rel: { nia: 40 } }],
        ['narrator', 'Mom\'s seat is empty. She picked up a shift.', null, { maxRel: { mom: 39 } }],
      ],
      choices: [
        { t: 'Point at Mom and Nia before tip-off.', fx: { rel: { mom: 4, nia: 4 }, morale: 4 }, next: '@season' },
        { t: 'Headphones on. Lock in, no distractions.', fx: { attrs: { clutch: 1 }, morale: 2 }, next: '@season' },
      ] },
    c2_promoted: { scene: 'gym', cutscene: 'varsity', fx: { flag: 'starter', trust: 4, morale: 6 },
      lines: [
        ['brennan', 'You talk on defense now, you box out, you make the extra pass. You start tonight.', null, { hs: 'lincoln' }],
        ['graves', 'You defend, you don\'t complain, and you make Kai better. You start Friday.', null, { hs: 'westbrook' }],
      ], next: '@season' },
    c2_cityfinal_pre: { scene: 'arena',
      lines: [
        ['narrator', 'City Final. Downtown at the Civic Arena — the first time Lincoln has played here in fourteen years.', null, { hs: 'lincoln' }],
        ['brennan', 'Thirty-one years, never won one of these. No speech — just go play.', null, { hs: 'lincoln' }],
        ['graves', 'Westbrook doesn\'t lose city finals — nine of the last ten. Be the tenth.', null, { hs: 'westbrook' }],
        ['kai', '(to you, quiet) Two-man game. Like we practiced.', 'smile', { hs: 'westbrook', flag: 'kai_ally' }],
        ['lou', '(in the stands, nodding at you) The rim, kid. Not the man.', null, { notFlag: 'lou_snub' }],
      ], next: '@season' },
    c2_jr_champ: { scene: 'arena', fx: { trust: 10, rep: 6, fans: 5000, recruit: true, offers: true, post: { by: 'courtvision', text: '🏆 {hs} are City Champions! {name} was the difference all season.' } },
      lines: [
        ['narrator', 'Lincoln High, City Champions. The bucket under the leaky roof is getting a trophy next to it.', null, { hs: 'lincoln' }],
        ['brennan', '…You earned it, {last}. Don\'t let it go to your head.', 'smile', { hs: 'lincoln' }],
        ['tariq', 'WE\'RE CITY CHAMPS! SOMEBODY TELL KAI!', 'smile', { hs: 'lincoln' }],
        ['narrator', 'City Champions. Westbrook hands out the hats like they\'ve done it before — because they have.', null, { hs: 'westbrook' }],
        ['kai', 'Good season, Halsey. You were… useful.', 'smile', { hs: 'westbrook' }],
      ], next: 'c2_summer' },
    c2_jr_out: { scene: 'locker', fx: { morale: -4 },
      lines: [
        ['narrator', 'The season ends with a long, quiet bus ride home.'],
        ['brennan', 'Next year we go further. You hear me — next year.', null, { hs: 'lincoln' }],
        ['graves', 'Westbrook does not lose in the playoffs. Find out why we did and report back in June.', 'fierce', { hs: 'westbrook' }],
      ], next: 'c2_summer' },

    /* ================================================================
       SUMMER — rankings, Nia, Lou, Marcus, the Peach Slam
       ================================================================ */
    c2_viral_jr: { scene: 'home', fx: { flag: 'viral', fans: 8000, rep: 3, recruit: true, unlock: 'mixtape' },
      lines: [
        ['nia', '{first}, wake UP. I made a mixtape of your season and it has four hundred thousand views.', 'smile'],
        ['nia', 'From now on I\'m filming every game. You drop a real tape once a season. Deal?', 'smile'],
      ],
      choices: [
        { t: '"You\'re officially my manager. Ten percent."', fx: { rel: { nia: 12 }, fans: 5000, flag: 'nia_manager' }, next: '@season' },
        { t: 'Post it with a cocky caption: "They not ready."', fx: { rep: 4, fans: 9000, trust: -3, rel: { nia: 3 } }, next: '@season' },
        { t: 'Ask her to take it down. Focus on the season.', fx: { attrs: { iq: 1 }, morale: 3, rel: { nia: -8 } }, next: '@season' },
      ] },
    c2_summer: { scene: 'home', fx: { recruit: true, offers: true },
      lines: [
        ['narrator', 'June. Junior year\'s over, and the national rankings just dropped.'],
        ['nia', 'Recruiting Wire has you at {stars}, national rank {rank}! Kai is number one, obviously.', 'smile'],
        ['narrator', 'Check the Recruiting tab: some programs already sent offers, others are "still watching."'],
      ], next: 'c2_nia_bday' },
    c2_nia_bday: { scene: 'home',
      lines: [
        ['narrator', 'The Elite 100 Camp, every major college coach in one gym, lands on Nia\'s thirteenth birthday.'],
        ['nia', 'It\'s fine, go. I don\'t even want a party. (She absolutely wants a party.)', 'sad'],
      ],
      choices: [
        { t: 'Go to the Elite 100 Camp.', fx: { attrs: { iq: 1, clutch: 1, three: 1, perD: 1 }, rep: 5, recruit: true, rel: { nia: -15, mom: -5 }, flag: 'elite_camp' }, next: 'c2_camp' },
        { t: 'Skip camp. Be there for Nia.', fx: { rel: { nia: 14, mom: 7 }, morale: 6 }, next: 'c2_bday' },
        { t: 'Buy Nia a bus ticket and bring her to camp with you. (−$80)', req: { money: 80 }, fx: { money: -80, rel: { nia: 8, mom: 3 }, rep: 3, flag: ['elite_camp', 'nia_camp'] }, next: 'c2_camp' },
      ] },
    c2_camp: { scene: 'arena',
      lines: [
        ['narrator', 'Elite 100 Camp. You hold Kai to two buckets in the all-star scrimmage, and three coaches ask for Mom\'s number.'],
        ['narrator', 'That night, Nia sends you one text: "happy birthday to me i guess." You stare at it for a long time.', null, { notFlag: 'nia_camp' }],
        ['nia', 'Best birthday ever. I told a Westwood coach you\'re six-eight, so grow, please.', 'smile', { flag: 'nia_camp' }],
        ['kai', 'Hey, Halsey — courts are empty. One-on-one to eleven, no cameras, just us.', 'fierce'],
      ],
      choices: [
        { t: 'Accept. One-on-one with Kai, right now.', hint: '1v1 · first to 11', next: 'c2_kai_1v1' },
        { t: '"Not tonight, Kai."', fx: { rel: { kai: -3 }, fatigue: -10 }, next: 'c2_lou_aau' },
      ] },
    c2_kai_1v1: { type: 'match', us: 'halsey', them: 'kai_solo', rating: 67, mateRating: 50,   // rating 67: Kai 1-on-1 is meant to be lost most of the time (but winnable)
      level: 'street', pickup: { size: 1, target: 11 }, venue: 'rooftop',
      title: 'One-on-One', sub: 'vs Kai Sterling · first to 11', win: 'c2_kai_1v1_win', lose: 'c2_kai_1v1_loss' },
    c2_kai_1v1_win: { scene: 'arena', fx: { rep: 4, rel: { kai: 8 }, flag: 'beat_kai_1v1', recruit: true, post: { by: 'fan', text: 'somebody filmed {first} {last} beating KAI STERLING 1-on-1 in an empty camp gym at midnight. the internet is not okay.' } },
      lines: [['kai', '…Run it back. No, don\'t — I need to sit down.', 'sad'], ['kai', 'You\'re the only person my age who scares me. Don\'t tell anybody that either.']], next: 'c2_lou_aau' },
    c2_kai_1v1_loss: { scene: 'arena', fx: { morale: -3, rel: { kai: 3 } },
      lines: [['kai', 'Eleven, told you. You\'re good, Halsey — you\'re just not me yet.', 'smile']], next: 'c2_lou_aau' },
    c2_bday: { scene: 'home',
      lines: [
        ['narrator', 'Twelve kids from Nia\'s grade, a cake shaped like a basketball, and Tariq DJing from his phone.'],
        ['nia', 'I made you something: your future NBL trading card. Ninety-nine overall.', 'smile'],
        ['nia', 'You can\'t have it until you\'re actually ninety-nine. That\'s the rule.'],
      ], next: 'c2_lou_aau' },
    c2_lou_aau: { type: 'branch', branches: [{ if: { flag: 'lou_snub' }, next: 'c2_lou_return' }], else: 'c2_lou_team' },
    c2_lou_team: { scene: 'rec',
      lines: [
        ['lou', 'I did something stupid: started an AAU team, Halsey Hoops. Tariq\'s on it, plus a couple kids from Eastview and St. Vincent.'],
        ['lou', 'We\'re going to the Peach Slam. Best AAU teams in the country, five hundred college coaches, one week in July.'],
        ['lou', 'Kai\'s daddy runs Sterling Select — they\'ve won it two years straight. I\'d like to ruin that.', 'smile'],
      ],
      choices: [
        { t: '"I\'m in. Let\'s ruin it."', fx: { rel: { lou: 6 }, morale: 4 }, next: 'c2_marcus' },
        { t: '"How\'d you pay for an AAU team, Lou?"', hint: '"…Sold my truck. Now get in the gym."', fx: { rel: { lou: 8 } }, next: 'c2_marcus' },
      ] },
    c2_lou_return: { cine: true, scene: 'playground_night',
      lines: [
        ['narrator', 'Lou Banks is sitting on the bench at Halsey Street when you show up at 6 a.m. He\'s been waiting.'],
        ['lou', 'Still think you don\'t need a coach?'],
        ['lou', 'I\'ve got an AAU team going to the Peach Slam — Tariq\'s on it, and there\'s a spot for you.'],
        ['lou', 'Conditions: you show up, you listen, and you stop acting like you invented basketball.'],
      ],
      choices: [
        { t: '"I was wrong, Lou, I\'m sorry. I\'m in."', fx: { rel: { lou: 22 }, unflag: 'lou_snub', morale: 4 }, next: 'c2_marcus' },
        { t: '"I\'ll play. But I\'ve done fine without you."', fx: { rel: { lou: -4 }, rep: 1 }, next: 'c2_marcus' },
      ] },
    c2_marcus: { scene: 'street_night',
      lines: [
        ['narrator', 'Cousin Marcus is leaning on a car outside your building. He walks with a cane now.', null, { flag: 'marcus_crash' }],
        ['narrator', 'Cousin Marcus is leaning on a car outside your building, grinning.', null, { notFlag: 'marcus_crash' }],
        ['marcus', 'Cuz, I got a play: my man has a truck full of brand-new sneakers. We flip \'em online — two, three hundred profit a pair.', 'smile'],
        ['marcus', 'Don\'t ask where the truck came from and the truck won\'t ask where you came from.'],
      ],
      choices: [
        { t: '"No. And you shouldn\'t either."', fx: { rel: { marcus: -4 }, attrs: { iq: 1 } }, next: 'c2_aau' },
        { t: '"How much could I make?"', next: 'c2_scheme' },
        { t: '"Marcus, Lou needs a team manager for the Peach Slam. Come with us."', check: { a: 'iq', dc: 50 }, fx: { rel: { marcus: 15, lou: 4 }, flag: 'marcus_manager', chem: 5, log: 'Marcus became Halsey Hoops\' team manager.' }, failFx: { rel: { marcus: -2 } }, next: 'c2_aau' },
      ] },
    c2_scheme: { scene: 'street_night', fx: { money: 400, rep: -2, flag: 'scheme_once' },
      lines: [
        ['narrator', 'One drop: a parking garage at midnight, forty boxes, a stranger\'s van. Four hundred cash in an envelope.'],
        ['narrator', 'Your hands are shaking the whole way home.'],
        ['marcus', 'See? Easy money — and next one\'s bigger, a whole trailer Thursday.', 'smile'],
      ],
      choices: [
        { t: '"Never again, Marcus. I\'m out."', fx: { rel: { marcus: -6 }, morale: -2 }, next: 'c2_aau' },
        { t: '"…Thursday. One more, then I\'m done."', hint: '⚠ Career-defining', next: 'c2_scheme2' },
      ] },
    c2_scheme2: { scene: 'street_night', cutscene: 'career_end',
      lines: [
        ['narrator', 'Thursday. The trailer is in a lot behind a closed furniture store.'],
        ['narrator', 'The trailer is empty. The headlights that come on behind you are not.'],
        ['narrator', 'It was a sting. Marcus runs — you don\'t make it to the fence.'],
      ],
      choices: [{ t: 'Hands up…', next: 'end_locked' }] },
    end_locked: { type: 'ending', ending: 'locked' },

    c2_aau: { type: 'season', then: { champion: 'c2_aau_champ', eliminated: 'c2_aau_out', missed: 'c2_aau_out' },
      season: {
        id: 'peach_slam', name: 'Peach Slam', level: 'hs', user: 'halsey_hoops', mateRating: 53, champFlag: 'aau_champ',
        teams: ['halsey_hoops', 'sterling_select', 'atl_heat', 'cali_supreme', 'tx_takeover', 'chi_fire'],
        schedule: [
          { opp: 'atl_heat', key: true, title: 'Pool Play · Game 1', pre: 'c2_aau_pre' },
          { opp: 'cali_supreme', title: 'Pool Play · Game 2' },
        ],
        interrupts: { 1: 'c2_vince' }, autoSim: true, simXp: HS_PACE.simXp, hubAP: HS_PACE.hubAP,
        playoff: { teams: 4, name: 'Peach Slam Bracket', rounds: ['Semifinal', 'Peach Slam Final'], moments: [10, 12], pre: { 1: 'c2_aau_final_pre' } },
      } },
    c2_aau_pre: { scene: 'arena',
      lines: [
        ['narrator', 'The Peach Slam: a convention center turned into eight courts. Five hundred college coaches in polos, all staring at the same twelve kids.'],
        ['lou', 'This is a meat market, kid. Nobody\'s watching the score — they\'re watching your feet, your face when you miss, how you talk to teammates.'],
        ['tariq', 'I\'m gonna get a scholarship off one dunk. Watch.', 'smile'],
      ], next: '@season' },
    c2_vince: { scene: 'street_night',
      lines: [
        ['narrator', 'After pool play, a man in a purple suit is waiting by the team van. He\'s holding a thick envelope and smiling like he owns the parking lot.'],
        ['vince', 'Vince Shark — I help young men make good decisions about their futures. Friends of mine at a few big programs are very interested in you.', 'smile'],
        ['vince', 'This? Just a gift for your mom\'s rent, no strings — well, one: remember who was there for you early.'],
      ],
      choices: [
        { t: 'Take the envelope. ($2,000)', fx: { money: 2000, flag: 'booster', rel: { lou: -4 } }, next: '@season' },
        { t: '"No thanks. My mom raised me better."', fx: { rep: 2, rel: { lou: 6, mom: 4 }, morale: 3 }, next: '@season' },
        { t: 'Take his card — not the money.', fx: { flag: 'vince_card' }, next: '@season' },
      ] },
    c2_aau_final_pre: { scene: 'arena',
      lines: [
        ['silk', 'Sterling Select doesn\'t lose this tournament. Ask anybody.', 'fierce', { opp: 'sterling_select' }],
        ['kai', 'Last summer you got lucky. This is the real Summer Jam, Halsey.', 'fierce', { opp: 'sterling_select' }],
        ['narrator', 'Sterling Select got knocked out in the semis. Silk Sterling is screaming at a referee in the parking lot.', null, { notOpp: 'sterling_select' }],
        ['lou', 'Whatever happens, I\'m proud of this team. Now go break some hearts.', 'smile'],
      ], next: '@season' },
    c2_aau_champ: { scene: 'arena', fx: { rep: 8, fans: 15000, recruit: true, offers: true, rel: { lou: 8 }, post: { by: 'recruit', text: '🍑 PEACH SLAM CHAMPIONS: Lou Banks\' Halsey Hoops AAU stuns the field! {name} is the talk of the event.' } },
      lines: [
        ['narrator', 'Halsey Hoops — a team that drove nine hours in a borrowed church van — wins the Peach Slam.'],
        ['lou', '…Sold my truck for this. Best trade I ever made.', 'smile'],
        ['narrator', 'Your phone has forty-one new notifications. Six of them are head coaches.'],
      ], next: 'c2_coach_visit' },
    c2_aau_out: { scene: 'arena', fx: { rep: 2, recruit: true, offers: true },
      lines: [
        ['narrator', 'Halsey Hoops goes home without the trophy. On the way out, Lou\'s phone rings eleven times — all college coaches, all asking about you.'],
        ['lou', 'Trophies are nice. Phone calls are better.'],
      ], next: 'c2_coach_visit' },
    c2_coach_visit: { scene: 'home', fx: { offers: true, develop: 'hs_junior', recruit: true },
      lines: [
        ['narrator', 'August. A head coach is sitting on your couch, which you vacuumed three times this morning.'],
        ['kowalski', 'Mrs. {last}, five national titles and I\'ve never once promised a young man playing time. I promise opportunity — and a degree.', null, { minStars: 4 }],
        ['simmons', 'Ma\'am, at Magnolia State your son wouldn\'t be one of many. He\'d be THE one — day one, face of the program.', 'smile', { maxStars: 3 }],
        ['mom', 'I just have one question, Coach. When he gets hurt — and they all get hurt — what happens to him then?'],
        ['narrator', 'That summer your body finally cooperates: half an inch taller, nine pounds of muscle, four more inches of vertical.'],
      ],
      choices: [
        { t: 'Let Mom ask every question she has.', fx: { rel: { mom: 10 }, attrs: { iq: 1 } }, next: 'c2_senior_branch' },
        { t: '"Coach, how many minutes would I play as a freshman?"', check: { a: 'iq', dc: 50 }, fx: { rep: 2 }, next: 'c2_senior_branch', failFx: { rep: -1 } },
        { t: '"What kind of NIL money are we talking?"', fx: { money: 300, rel: { mom: -6 }, rep: -1 }, next: 'c2_senior_branch' },
      ] },
    c2_senior_branch: { type: 'branch', fx: { age: 18, set: { fatigue: 10 } }, branches: [{ if: { flag: 'hs_westbrook' }, next: 'W_senior_open' }], else: 'L_senior_open' },

    /* ================================================================
       SENIOR YEAR
       ================================================================ */
    L_senior_open: { scene: 'gym',
      lines: [
        ['narrator', 'Senior year. One last run at Lincoln High.'],
        ['brennan', 'I\'ve been wrong about players maybe twice in thirty-one years. You\'re the third — and my captain.', 'smile', { minTrust: 58 }],
        ['brennan', 'You\'ve got talent, but I still don\'t trust your shot selection. Prove me wrong one more time.', null, { maxTrust: 57 }],
        ['brick', '(on the phone from his college dorm) Run it back, playground. Win the thing I never could.', 'smile', { flag: 'brick_ally' }],
      ],
      choices: [
        { t: '"State championship. That\'s the only goal."', fx: { morale: 5, flag: 'captain' }, next: 'L_season2' },
        { t: '"Let\'s get Tariq a scholarship too."', fx: { rel: { tariq: 8 }, chem: 6 }, next: 'L_season2' },
      ] },
    L_season2: { type: 'season', then: { champion: 'c2_state_champ', eliminated: 'c2_state_out', missed: 'c2_state_missed' },
      season: Object.assign({
        id: 'senior_lincoln', name: 'Senior Season', level: 'hs', user: 'lincoln', mateRating: 49, teams: METRO, champFlag: 'state_champ',
        schedule: [
          { opp: 'stvincent' },
          { opp: 'westbrook', key: true, title: 'Rivalry Night II', importance: 2, moments: 11, pre: 'L_kai2_pre', post: { win: 'L_kai2_win', lose: 'L_kai2_loss' } },
          { opp: 'central' },
          { opp: 'northgate', title: 'Top-5 Showdown' },
          { opp: 'oakmont', key: true, title: 'Senior Night', pre: 'c2_senior_night' },
        ],
        interrupts: { 1: 'c2_tariq_test', 2: 'c2_injury', 3: 'c2_scandal_check', 4: 'c2_mom_hurt' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 0: 'c2_semi_pre', 1: 'c2_final_pre' } }, STATE_PLAYOFF),
      }, HS_PACE) },
    L_kai2_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Westbrook\'s gym looks like a pro arena. Their pregame video has a drone shot.'],
        ['narrator', 'In the hallway before warmups you hear it — Silk Sterling\'s voice, low and cold: "If you lose to that public-school kid again, don\'t bother coming home."'],
        ['kai', '…You heard that, huh.', 'sad'],
      ],
      choices: [
        { t: '"Whatever happens tonight — you\'re more than his son."', fx: { rel: { kai: 12 }, flag: 'kai_bond' }, next: '@season' },
        { t: 'Say nothing. Use it.', fx: { rel: { kai: -6 }, morale: 5, attrs: { clutch: 1 } }, next: '@season' },
      ] },
    L_kai2_win: { scene: 'gym', fx: { rep: 6, fans: 8000, recruit: true },
      lines: [
        ['narrator', 'Lincoln sweeps Westbrook for the first time in school history.'],
        ['kai', 'Two years in a row. You\'re in my head, Halsey, and I hate it.', 'sad', { maxRel: { kai: 19 } }],
        ['kai', 'Good game, seriously. …My dad\'s gonna kill me, but good game.', 'smile', { rel: { kai: 20 } }],
      ], next: '@season' },
    L_kai2_loss: { scene: 'gym', fx: { morale: -3 },
      lines: [['narrator', 'Kai gets his revenge — thirty-four points and a stare-down after the buzzer.'], ['kai', 'One-one. See you in March.', 'fierce']], next: '@season' },
    W_senior_open: { scene: 'gym',
      lines: [
        ['narrator', 'Senior year at Westbrook: you and Kai on the cover of the season preview. He insisted his name go first.'],
        ['graves', 'Co-captains: Sterling and {last}. If either of you pouts, both of you sit.', null, { flag: 'kai_ally' }],
        ['graves', 'Kai is captain. You\'re… important.', null, { notFlag: 'kai_ally' }],
      ],
      choices: [
        { t: '"State championship. That\'s the only goal."', fx: { morale: 5 }, next: 'W_season2' },
        { t: 'Ask Kai to run extra two-man game every morning.', fx: { rel: { kai: 6 }, chem: 6, attrs: { pass: 1 } }, next: 'W_season2' },
      ] },
    W_season2: { type: 'season', then: { champion: 'c2_state_champ', eliminated: 'c2_state_out', missed: 'c2_state_missed' },
      season: Object.assign({
        id: 'senior_westbrook', name: 'Senior Season', level: 'hs', user: 'westbrook', mateRating: 56, teams: METRO, champFlag: 'state_champ',
        schedule: [
          { opp: 'stvincent' },
          { opp: 'lincoln', key: true, title: 'Old Friends II', importance: 2, moments: 11, pre: 'W_lincoln2_pre' },
          { opp: 'central' },
          { opp: 'northgate', title: 'Top-5 Showdown' },
          { opp: 'oakmont', key: true, title: 'Senior Night', pre: 'c2_senior_night' },
        ],
        interrupts: { 0: 'W_silk', 1: 'c2_tariq_test', 2: 'c2_injury', 3: 'c2_scandal_check', 4: 'c2_mom_hurt' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 0: 'c2_semi_pre', 1: 'c2_final_pre' } }, STATE_PLAYOFF),
      }, HS_PACE) },
    W_silk: { scene: 'locker',
      lines: [
        ['silk', 'A word, young man.'],
        ['silk', 'My son is going first overall, and every shot you take is one that isn\'t on his tape. Understand what I\'m telling you?', 'fierce'],
        ['silk', 'You\'re a nice story — a charity case. Don\'t forget it.'],
      ],
      choices: [
        { t: '"With respect, sir — Kai plays better when he\'s not scared of you."', fx: { rel: { kai: 10, silk: -15 }, rep: 2, flag: 'kai_bond' }, next: '@season' },
        { t: '"Yes, sir."', fx: { morale: -5, rel: { silk: 5 } }, next: '@season' },
        { t: 'Walk away and tell Kai what his dad said.', fx: { rel: { kai: 6, silk: -8 }, chem: 4 }, next: '@season' },
      ] },
    W_lincoln2_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Lincoln comes to Westbrook. Their students chant your name and boo you — somehow at the same time.'],
        ['tariq', 'Senior year, bro — last time we ever play each other. Make it count.', 'smile', { rel: { tariq: 45 } }],
        ['tariq', 'Last time I ever have to look at you in that jersey.', 'fierce', { maxRel: { tariq: 44 } }],
      ], next: '@season' },
    c2_tariq_test: { type: 'branch', branches: [{ if: { flag: 'hs_westbrook', maxRel: { tariq: 44 } }, next: 'W_tariq_beef' }], else: 'c2_tariq_grades' },
    c2_tariq_grades: { scene: 'home',
      lines: [
        ['tariq', 'Bro, I\'m failing chemistry — like, failing failing. Flunk the midterm and I\'m ineligible: no season, no scholarship, nothing.', 'sad'],
        ['tariq', 'I\'m not asking you for anything. I\'m just… telling you.', 'sad'],
      ],
      choices: [
        { t: 'Tutor him every night for two weeks.', fx: { rel: { tariq: 16 }, fatigue: 18, attrs: { iq: 1 }, flag: 'tariq_eligible' }, next: '@season' },
        { t: 'Pay for a real tutor. (−$150)', req: { money: 150 }, fx: { money: -150, rel: { tariq: 9 }, flag: 'tariq_eligible' }, next: '@season' },
        { t: '"You\'ll figure it out, T. I\'ve got my own season."', fx: { rel: { tariq: -14 }, flag: 'tariq_failed' }, next: '@season' },
      ] },
    W_tariq_beef: { scene: 'home', fx: { post: { by: 'tariq', text: 'funny how people forget where they came from the second somebody hands them a blazer. #HalseyNeverForgets' } },
      lines: [
        ['narrator', 'Tariq posts a video. He doesn\'t say your name — he doesn\'t have to.'],
        ['nia', '80,000 views and people are taking sides. {first}… what do you want me to do?', 'sad'],
      ],
      choices: [
        { t: 'Call him. Right now.', check: { a: 'iq', dc: 46 }, next: 'W_tariq_call', fail: '@season', failFx: { rel: { tariq: -8 } } },
        { t: 'Reply publicly: "I never forgot. Some people just never left."', fx: { rep: -2, fans: 6000, rel: { tariq: -15 }, flag: 'tariq_failed' }, next: '@season' },
        { t: 'Ignore it.', fx: { rel: { tariq: -5 }, morale: -3 }, next: '@season' },
      ] },
    W_tariq_call: { scene: 'playground_night', fx: { rel: { tariq: 22 }, flag: 'tariq_eligible' },
      lines: [
        ['tariq', '…I\'m failing chemistry and about to lose my season, and you\'re over there on TV. I just got mad.', 'sad'],
        ['you', 'Then I\'m at your place every night till the midterm. I\'m good at chemistry — okay, I\'m okay at chemistry.'],
        ['tariq', '…You still owe me a dap for the game-winner I hit on you.', 'smile'],
      ], next: '@season' },
    c2_injury: { scene: 'gym',
      lines: [
        ['narrator', 'Tuesday practice: you land on a teammate\'s foot and your ankle rolls all the way over. The sound it makes is not a good sound.'],
        ['narrator', 'The trainer says "sprain." The trainer also says "maybe."'],
      ],
      choices: [
        { t: 'Sit out a game. Rest it properly.', fx: { injury: { games: 1, name: 'Sprained ankle' }, trust: -2, fatigue: -20 }, next: '@season' },
        { t: 'Tape it and play through.', check: { a: 'stam', dc: 48 }, fx: { rep: 2, trust: 3, flag: 'tough' }, next: '@season', fail: 'c2_injury_worse' },
      ] },
    c2_injury_worse: { scene: 'hospital', cutscene: 'injury', fx: { injury: { games: 3, name: 'Badly sprained ankle' }, flag: 'bad_ankle', morale: -6 },
      lines: [['narrator', 'Two possessions into Friday\'s game, the ankle goes again. Worse.'], ['narrator', 'Clean X-ray, but the doctor says "high ankle sprain" and "don\'t be a hero." You\'ll play — you just won\'t be you for a few weeks.']], next: '@season' },
    c2_scandal_check: { type: 'branch', branches: [{ if: { flag: 'booster' }, next: 'c2_booster_news' }], else: '@season' },
    c2_booster_news: { scene: 'home', fx: { post: { by: 'recruit', text: '🚨 REPORT: Top recruit {name} allegedly accepted cash from a runner tied to multiple college programs at the Peach Slam.' } },
      lines: [
        ['narrator', 'Somebody had a camera in that parking lot. The photo of you holding Vince Shark\'s envelope is everywhere by lunch.'],
        ['mom', 'Look at me, {first}. Is it true?', 'sad'],
      ],
      choices: [
        { t: 'Tell the truth — to Mom, to your coach, to the compliance people.', fx: { rep: -4, rel: { mom: 8, lou: 8 }, money: -2000, flag: 'booster_admitted', trust: 3 }, next: '@season' },
        { t: 'Deny everything.', check: { a: 'iq', dc: 58 }, fx: { rep: -1 }, next: '@season', failFx: { flag: 'booster_scandal', rep: -8, recruit: true, rel: { mom: -10, lou: -8 }, log: 'Caught lying about Vince Shark\'s envelope. Two big programs stopped calling.' } },
      ] },
    c2_mom_hurt: { cine: true, scene: 'hospital',
      lines: [
        ['narrator', 'Mom hurt her back lifting a patient — six weeks off work, minimum. Rent is due in nine days.'],
        ['mom', 'Don\'t you dare worry about this, baby. You have a season to finish.', 'sad'],
        ['nia', '(quietly, in the hallway) We have $212 in the account. I checked.', 'sad'],
      ],
      choices: [
        { t: 'Pick up night shifts at the warehouse. (+$400, heavy fatigue)', fx: { money: 400, fatigue: 25, rel: { mom: 10 } }, next: '@season' },
        { t: 'Ask Lou for help.', req: { rel: { lou: 30 } }, fx: { money: 300, rel: { lou: 6, mom: 4 } }, next: '@season' },
        { t: 'Let Nia monetize your highlight page. (+$500)', req: { flag: 'nia_manager' }, fx: { money: 500, rel: { nia: 10, mom: 5 }, fans: 3000 }, next: '@season' },
        { t: 'Call Vince Shark. (+$1,500)', req: { flag: 'vince_card' }, fx: { money: 1500, flag: 'booster', rel: { lou: -6 } }, next: '@season' },
      ] },
    c2_senior_night: { scene: 'gym',
      lines: [
        ['narrator', 'Senior Night. They call your name and you walk to center court with your family.'],
        ['mom', '(in a back brace, refusing the wheelchair) I am WALKING out there, {first}. Don\'t you argue with me.', 'smile', { rel: { mom: 50 } }],
        ['nia', '(holding a giant cardboard cutout of your head) Made it myself. Don\'t cry — you\'re crying.', 'smile', { rel: { nia: 50 } }],
        ['lou', '(at the end of the line, in a tie for the first time in twenty years) Proud of you, kid.', 'smile', { rel: { lou: 40 } }],
      ],
      choices: [{ t: 'Hug all of them. Then go to work.', fx: { morale: 8, rel: { mom: 3, nia: 3 } }, next: '@season' }] },
    c2_semi_pre: { type: 'branch', branches: [{ if: { flag: 'bad_ankle' }, next: 'c2_pills' }], else: 'c2_semi_talk' },
    c2_semi_talk: { scene: 'locker',
      lines: [
        ['narrator', 'State Semifinal. You can hear the band through the wall.'],
        ['brennan', 'Win and we play for a state title. I\'ve never said those words out loud in thirty-two years.', null, { hs: 'lincoln' }],
        ['graves', 'Win, and Westbrook plays for its sixth state title. Lose, and you will remember it forever.', null, { hs: 'westbrook' }],
      ], next: '@season' },
    c2_pills: { scene: 'locker',
      lines: [
        ['narrator', 'Your ankle is still the size of a grapefruit. You can barely push off.'],
        ['narrator', 'A guy who "works with athletes" slips you two white pills in the hallway. "You won\'t feel a thing, trust me."'],
      ],
      choices: [
        { t: 'Take the pills and play like nothing\'s wrong.', hint: '⚠ Career-defining', check: { a: 'stam', dc: 60 }, fx: { morale: 4, rep: 2, log: 'Took pills to play through a bad ankle. Never again.' }, next: 'c2_semi_talk', fail: 'c2_broken' },
        { t: 'Play hurt — no pills. Tell the trainer the truth.', fx: { injury: { games: 1, name: 'Bad ankle (playing hurt)' }, trust: 4, rel: { lou: 4 } }, next: 'c2_semi_talk' },
      ] },
    c2_broken: { scene: 'hospital', cutscene: 'career_end',
      lines: [
        ['narrator', 'You don\'t feel it until you hear it: first drive of the third quarter, a crack like a gunshot.'],
        ['narrator', 'It wasn\'t a sprain, it was a stress fracture. Now it\'s a complete one.'],
        ['lou', 'Why didn\'t you tell anybody, kid? Why didn\'t you TELL anybody?', 'sad', { notFlag: 'lou_snub' }],
      ],
      choices: [{ t: 'Stare at the ceiling…', next: 'end_broken' }] },
    end_broken: { type: 'ending', ending: 'broken' },
    c2_final_pre: { scene: 'arena',
      lines: [
        ['narrator', 'The State Championship: twelve thousand people downtown.'],
        ['kai', 'It was always gonna be us, Halsey. Since that first day on your court.', 'fierce', { opp: 'westbrook' }],
        ['tariq', 'Me and you, state final, the whole block\'s here. Loser buys the other one wings for life.', 'smile', { opp: 'lincoln' }],
        ['holt', 'Everybody talks about you and Kai, nobody talks about me. Let\'s fix that tonight.', 'fierce', { opp: 'northgate' }],
        ['lou', '(from the third row) The rim, kid. Not the man — never the man.', 'smile', { notFlag: 'lou_snub' }],
      ], next: '@season' },

    /* ================================================================
       AFTER THE SEASON — results, offers, graduation (the decision waits for Chapter 3)
       ================================================================ */
    c2_state_champ: { scene: 'arena', cutscene: 'state_champ', fx: { rep: 10, fans: 40000, recruit: true, offers: true, flag: 'state_champ', post: { by: 'courtvision', text: '🏆 STATE CHAMPIONS 🏆 {name} and {hs} finish it. What a career, what a kid.' } },
      lines: [
        ['narrator', 'State Champions! Confetti rains down and somebody hands you a piece of the net.'],
        ['brennan', '(holding the trophy like it might break) Thirty-two years. Thirty-two years, {last}.', 'smile', { hs: 'lincoln' }],
        ['graves', 'Westbrook standard. …Good work, {last} — genuinely.', 'smile', { hs: 'westbrook' }],
        ['tariq', 'WE DID IT! FROM HALSEY STREET TO THE STATE TITLE!', 'smile', { hs: 'lincoln' }],
        ['kai', 'Two straight state titles for Westbrook, and one was yours. …Don\'t tell my dad I said that.', 'smile', { hs: 'westbrook', rel: { kai: 15 } }],
        ['mom', 'That\'s my baby! THAT\'S MY BABY!', 'smile'],
      ], next: 'c2_offers' },
    c2_state_out: { scene: 'locker', fx: { morale: -6, recruit: true, offers: true },
      lines: [
        ['narrator', 'The season ends in the state tournament. You sit in the locker room in your jersey for an hour after everyone leaves.'],
        ['lou', 'Most of the greats lost their last high school game, kid. It mattered to every one of them — and it made them.', null, { notFlag: 'lou_snub' }],
      ], next: 'c2_offers' },
    c2_state_missed: { scene: 'gym', fx: { morale: -8, recruit: true, offers: true },
      lines: [['narrator', 'No state tournament. Senior year ends in February with a loss nobody will remember but you.'], ['nia', 'The coaches are still calling, {first}. They\'re still calling.', 'sad']], next: 'c2_offers' },
    c2_offers: { scene: 'gym', fx: { recruit: true, offers: true },
      lines: [
        ['narrator', 'Signing period. Letters stack up on the kitchen table: {stars}, national rank {rank}.'],
        ['kai', '(on a stream from Westbrook) Blue Ridge, obviously. Some of us don\'t need to think about it.', 'smile'],
        ['mom', 'You don\'t have to pick today, baby. Pick it for you, when you\'re ready.'],
        ['nia', 'I made a graphic for every school. Plus one for Europe. Plus one for the Grind League. Just in case.', 'smile'],
        ['lou', 'The national team picks its roster this summer. Play for that jersey first, then decide.', null, { notFlag: 'lou_snub' }],
      ], next: 'c2_graduation' },
    c2_graduation: { scene: 'arena', fx: { xp: 150, morale: 8, log: 'Graduated high school.' },
      lines: [
        ['narrator', 'Graduation: you cross the stage in a gown that\'s too short, because you grew again.'],
        ['mom', 'First one in our family, the very first.', 'sad'],
        ['nia', 'Mom. MOM — we said no crying until the car.', 'smile'],
      ], next: 'ch_end' },

    /* next: the U.S. Youth National Team summer — unless an older save already played it */
    ch_end: { type: 'chapterEnd', nextChapter: s => USA_DONE(s) ? 'college' : 'usa', fx: { develop: 'highschool' },
      summary: 'High school is over. You leave {hs} as a {ovr}-Overall {stars} recruit — ranked {rank} in the nation. The offers can wait: the national team picks its roster this summer.',
      recap: [
        { if: { flag: 'state_champ' }, t: '🏆 State champion' },
        { if: { flag: 'city_champ' }, t: '🥇 City champion (junior year)' },
        { if: { flag: 'aau_champ' }, t: '🍑 Peach Slam AAU champion' },
        { if: { flag: 'starter' }, t: '⭐ Varsity starter' },
        { if: { flag: 'viral' }, t: '📱 Went viral' },
        { if: { flag: 'path_college' }, t: '🎓 Leaning toward {college}' },
        { if: { flag: 'path_overseas' }, t: '✈️ Turning pro overseas' },
        { if: { flag: 'path_grind' }, t: '⚙️ Joining the Grind League' },
        { if: { flag: 'kai_bond' }, t: '🤝 You and Kai understand each other now' },
        { if: { flag: 'tariq_eligible' }, t: '📚 Got Tariq through chemistry' },
        { if: { flag: 'tariq_failed' }, t: '💔 You and Tariq drifted apart' },
        { if: { flag: 'booster_scandal' }, t: '⚠️ Booster scandal' },
        { if: { flag: 'nia_manager' }, t: '💜 Nia runs your brand' },
      ] },
  },
  moved: {
    L_brennan_tape: 'L_tryout_pre', L_brennan_need: 'L_tryout_pre', L_brennan_need_fail: 'L_tryout_pre',
    L_brick_ok: '@season', L_suspended: '@season', L_promoted: 'c2_promoted', W_promoted: 'c2_promoted',
    L_cityfinal_pre: 'c2_cityfinal_pre', W_cityfinal_pre: 'c2_cityfinal_pre',
    L_jr_champ: 'c2_jr_champ', W_jr_champ: 'c2_jr_champ', L_jr_out: 'c2_jr_out', W_jr_out: 'c2_jr_out',
    W_vale_win: 'W_tryout_pre', W_vale_lose: 'W_tryout_pre', W_kai_talk_bad: '@season', W_tariq_text: 'W_playbook',
    c2_usa_early: 'c2_nia_bday', c2_lou_money: 'c2_marcus', c2_marcus_no: 'c2_aau', c2_marcus_save: 'c2_aau', c2_growth: 'c2_senior_branch',
    W_tariq_call_bad: '@season', c2_pills_ok: 'c2_semi_talk', c2_booster_caught: '@season', c2_camp_nia: 'c2_lou_aau',
    L_opener_pre: 'c2_opener_pre', W_opener_pre: 'c2_opener_pre',
    c2_signing_day: 'c2_offers', c2_choose: 'c2_graduation', c2_commit_react: 'c2_graduation', c2_usa_check: 'ch_end',
  },
};
