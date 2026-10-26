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
  title: 'Chapter 2', name: 'Varsity Blues', stage: 'High School', start: 'start', xpBoost: 1.12,   // JV + the big games are played, filler games are simmed
  blurb: 'Cut as a sophomore, JV, the call-up, Halsey Park II, the Peach Slam, Lou in the hospital, the ankle and the state championship.',
  nodes: {
    start: { type: 'branch', fx: { recruitOpen: true, age: 16, set: { trust: 45 }, log: 'Started high school.' },
      branches: [{ if: { flag: 'hs_westbrook' }, next: 'W_day1' }], else: 'L_day1' },

    /* ======================= ARC 1: THE CUT ARC ======================= */
    L_day1: { scene: 'gym', fx: { hs: 'lincoln' },
      lines: [
        ['narrator', 'Lincoln High: built in 1962, roof still leaking over the left corner three. During games they put a bucket there.'],
        ['tariq', 'Tryouts are Monday, bro. Brennan cut ELEVEN guys last year.', 'smile'],
        ['brennan', 'You\'re the Summer Jam kid. Playground kids think defense is optional.', 'fierce'],
      ],
      choices: [
        { t: '"Yes sir. I\'ll earn it."', fx: { trust: 6, rel: { brennan: 5 } }, next: 'L_tryout_pre' },
        { t: '"With respect, Coach. Watch the Summer Jam tape."', fx: { rep: 2, trust: -6, flag: 'c2_tape' }, next: 'L_tryout_pre' },
        { t: '"What do you need from me?"', check: { a: 'iq', dc: 46 }, fx: { trust: 8, attrs: { iq: 1 }, flag: 'c2_need' }, failFx: { trust: -2, fatigue: 10, flag: 'c2_need_fail' }, next: 'L_tryout_pre' },
      ] },
    L_tryout_pre: { scene: 'gym',
      lines: [
        ['brennan', 'I watched your tape: nineteen shots, four teammates. That\'s a solo album, son.', 'fierce', { flag: 'c2_tape' }],
        ['brennan', 'Nobody asks me that. Defend, talk, box out.', null, { flag: 'c2_need' }],
        ['brennan', 'What I need is for you to stop talking. Baseline, go.', 'fierce', { flag: 'c2_need_fail' }],
        ['narrator', 'Fifty-one kids, four open spots. Hopefuls against the varsity returners.'],
        ['brick', 'Darnell Hollis, senior captain. They call me Brick.', 'fierce'],
      ], next: 'L_tryout' },
    L_tryout: { type: 'match', us: 'lincoln_hopefuls', them: 'lincoln_varsity', rating: 49, mateRating: 43, moments: 8, level: 'hs',
      title: 'Varsity Tryouts', sub: 'Hopefuls vs Returners', win: 'c2_cut', lose: 'c2_cut', winFx: { flag: 'good_tryout' }, gradeFlag: { min: 68, flag: 'good_tryout' } },
    W_day1: { scene: 'gym', fx: { hs: 'westbrook' },
      lines: [
        ['narrator', 'Westbrook Academy: three gyms, a cryotherapy chamber, and a smoothie bar.'],
        ['graves', 'Dee Carter vouched for you. Dee has never been wrong, yet.'],
        ['kai', 'Welcome to the big leagues, Halsey. Try not to get lost on the way to the cafeteria.', 'smile'],
      ],
      choices: [
        { t: '"I\'m not here to be anybody\'s backup, Coach."', fx: { rep: 3, trust: -6, rel: { kai: -4 } }, next: 'W_vale' },
        { t: '"Yes, Coach. Where do you need me?"', fx: { trust: 6, rel: { graves: 5 } }, next: 'W_vale' },
        { t: 'To Kai: "We could be unstoppable."', fx: { rel: { kai: 7 }, chem: 4 }, next: 'W_vale' },
      ] },
    W_vale: { scene: 'locker',
      lines: [['vale', 'Yo, scholarship, are those shoes… from a store?', 'smile'], ['narrator', 'Half the locker room laughs. Kai just watches.']],
      choices: [
        { t: 'Laugh it off. "They got buckets this summer."', fx: { chem: 6, morale: 2 }, next: 'W_tryout_pre' },
        { t: '"My shoes cost less than your haircut and they cooked Kai."', fx: { rep: 3, chem: -5, rel: { kai: -3 } }, next: 'W_tryout_pre' },
        { t: '"One-on-one. Loser gives up his shoes."', check: { a: 'handle', dc: 48 }, fx: { chem: 6, rep: 4, money: 150, rel: { vale: 6 }, flag: 'vale_won' }, failFx: { morale: -5, chem: -2, flag: 'vale_lost' }, next: 'W_tryout_pre' },
      ] },
    W_tryout_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Eleven to four. You sell Vale\'s shoes and give Mom the $150.', null, { flag: 'vale_won' }],
        ['narrator', 'Vale hits a fadeaway at 10-10 and calls you "Retail" all week.', null, { flag: 'vale_lost' }],
        ['graves', 'Blue is my starters, White is everybody else. This scrimmage sets the roster.'],
      ], next: 'W_tryout' },
    W_tryout: { type: 'match', us: 'westbrook_white', them: 'westbrook_blue', rating: 55, mateRating: 47, moments: 8, level: 'hs',
      title: 'Westbrook Scrimmage', sub: 'White vs Blue', win: 'c2_cut', lose: 'c2_cut', winFx: { flag: 'good_tryout' }, gradeFlag: { min: 68, flag: 'good_tryout' } },
    /* the cut (fixed setback): the list, your finger running down it, your name isn't there */
    c2_cut: { scene: 'locker', cutscene: s => CH2.cutList(s), seenId: 'c2_cut', fx: { rankBump: -12, rankWhy: 'Cut from varsity', morale: -6, log: 'Cut from varsity as a sophomore.' },
      lines: [
        ['narrator', 'JV. The bus with the broken heater and the freshmen.'],
        ['narrator', 'Coach respects you. He still held you back.', null, { flag: 'good_tryout' }],
      ], next: 'c2_cut_after' },
    c2_cut_after: { scene: 'playground_night',
      lines: [
        ['tariq', 'I made it, bro. I don\'t even know how.', 'sad', { hs: 'lincoln' }],
        ['tariq', 'You\'ll be up by Christmas. Everybody knows it.', 'smile', { hs: 'lincoln' }],
        ['narrator', 'He\'s kind about it. That almost makes it worse.', null, { hs: 'lincoln' }],
        ['narrator', 'Kai made varsity as a sophomore. Of course he did.', null, { hs: 'westbrook' }],
        ['tariq', '(text from Lincoln) Westbrook cut YOU? Their loss, bro, facts.', 'smile', { hs: 'westbrook' }],
      ],
      choices: [
        { t: '"Proud of you, T. For real."', req: { hs: 'lincoln' }, fx: { rel: { tariq: 8 }, chem: 4 }, next: 'c2_jv' },
        { t: 'Shoot alone at Halsey Street until the lights go out.', fx: { attrs: { three: 1 }, fatigue: 10, morale: 2 }, next: 'c2_jv' },
        { t: 'Call Lou.', req: { notFlag: 'lou_snub' }, fx: { rel: { lou: 6 }, morale: 3 }, next: 'c2_jv' },
      ] },

    /* ======================= ARC 2: THE JV ARC ======================= */
    c2_jv: { scene: 'gym', cutscene: s => CH2.jvMontage(s), seenId: 'c2_jv', qteFx: () => CH2.jvBonus(),
      lines: [
        ['narrator', 'Six weeks of 5:40 a.m. runs. Number 00 on a JV jersey nobody else wanted.'],
        ['lou', 'Good. Now you\'re hungry.', 'smile', { notFlag: 'lou_snub' }],
      ], next: 'c2_jv1_pre' },
    c2_jv1_pre: { scene: 'gym',
      lines: [['narrator', 'JV opener. Forty people in the stands, half of them parents.'], ['narrator', 'Redemption goals: average 20, beat the JV rivals, climb back up the list.']], next: 'c2_jv1' },
    c2_jv1: { type: 'match', us: '@jv', them: 'eastview_jv', rating: 41, mateRating: 40, moments: 7, level: 'hs', title: 'JV Season', sub: 'vs Eastview JV', win: 'c2_jv1_post', lose: 'c2_jv1_post' },
    c2_jv1_post: { scene: 'gym',
      lines: [['narrator', 'Somebody\'s dad films the whole thing on an iPad. It gets nineteen views.'], ['narrator', 'Next: Northgate JV. Mikey Lau has been talking.']], next: 'c2_jv2' },
    c2_jv2: { type: 'match', us: '@jv', them: 'northgate_jv', rating: 45, mateRating: 41, moments: 8, level: 'hs', title: 'JV Season', sub: 'Rivalry · vs Northgate JV', win: 'c2_jv2_win', lose: 'c2_jv2_loss', winFx: { flag: 'jv_rivals' } },
    c2_jv2_win: { scene: 'gym', fx: { rep: 2 }, lines: [['narrator', 'Mikey Lau stops talking around the third quarter.']], next: 'c2_callup' },
    c2_jv2_loss: { scene: 'gym', lines: [['narrator', 'Northgate JV wins it late. You take every rep in practice the next day anyway.']], next: 'c2_callup' },
    /* the call-up (awakening): "Varsity. Friday." and a new weapon */
    c2_callup: { scene: 'gym', cutscene: () => CH2.callup(), seenId: 'c2_callup', fx: { flag: ['starter', 'called_up_v'], trust: 6, morale: 8, log: 'Called up to varsity.' },
      lines: [['you', 'Friday.'], ['narrator', 'Something in you that went quiet on the cut list wakes back up.']], next: 'c2_callup_wpn' },
    c2_callup_wpn: { type: 'branch', fx: { giftWeapon: true }, branches: [{ if: { flag: 'hs_westbrook' }, next: 'W_playbook' }], else: 'L_playbook' },
    L_playbook: { scene: 'locker', fx: { unlock: 'playbook' },
      lines: [
        ['brennan', 'Thirty-one years, one rule: we run plays. This is the first one.', 'determined'],
        ['narrator', 'Two circles, an X, an arrow curling around a screen. Pick-and-roll.'],
        ['brennan', 'Learn this and I\'ll teach you the next. Ignore it and you\'ll learn the bench.'],
      ], next: 'L_hp2_pre' },
    W_playbook: { scene: 'locker', fx: { unlock: 'playbook' },
      lines: [
        ['graves', 'Westbrook runs a system. You\'ll learn it one piece at a time.'],
        ['narrator', 'He draws a screen, a roll, two arrows. Pick-and-roll.'],
        ['kai', '(not looking up) He\'s gonna mess it up.', 'smile'],
      ], next: 'W_hp2_pre' },
    /* HALSEY PARK II (the fixed high, a revenge game): the poster, a scripted comeback, a huge finish */
    L_hp2_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Friday. Westbrook comes to Lincoln with a charter bus, a film crew, and Silk Sterling.'],
        ['kai', 'They let you up from JV? Cute.', 'smile', { maxRel: { kai: 9 } }],
        ['kai', 'Good to see you up here. Let\'s give them a show.', 'smile', { rel: { kai: 10 } }],
      ],
      choices: [
        { t: '"Tonight it\'s personal."', fx: { morale: 5, rel: { kai: -3 } }, next: 'L_hp2' },
        { t: 'Shake his hand. "May the best one win."', fx: { rel: { kai: 5 }, attrs: { iq: 1 } }, next: 'L_hp2' },
        { t: '"Your dad looks nervous, Kai."', req: { flag: 'trash_kai' }, fx: { rel: { kai: -10 }, rep: 3, morale: 6 }, next: 'L_hp2' },
      ] },
    L_hp2: { type: 'match', us: 'lincoln', them: 'westbrook', rating: 56, mateRating: 47, moments: 10, level: 'hs', importance: 2, script: 'hp2', venueSide: 'home',
      revenge: { id: 'kai', star: 'Kai Sterling', title: 'HALSEY PARK II', sub: 'The Reckoning' },
      title: 'Rivalry Night', sub: 'Lincoln vs Westbrook', win: 'c2_hp2_win', lose: 'c2_hp2_win' },
    W_hp2_pre: { scene: 'gym',
      lines: [
        ['graves', 'Blue-White Game: you lead White, Kai has Blue.'],
        ['narrator', 'Silk Sterling has invited half the coaches in the state. It\'s supposed to be Kai\'s night.'],
        ['kai', 'Don\'t take it personal, Halsey. I score on everybody.', 'fierce'],
      ],
      choices: [
        { t: '"Tonight it\'s personal."', fx: { morale: 5, rel: { kai: -3 } }, next: 'W_hp2' },
        { t: '"Let\'s give them a show."', fx: { rel: { kai: 4 } }, next: 'W_hp2' },
      ] },
    W_hp2: { type: 'match', us: 'westbrook_white', them: 'westbrook_blue', rating: 57, mateRating: 49, moments: 10, level: 'hs', importance: 2, script: 'hp2',
      revenge: { id: 'kai', star: 'Kai Sterling', title: 'HALSEY PARK II', sub: 'Blue vs White' },
      title: 'Blue-White Game', sub: 'White vs Blue', win: 'c2_hp2_win', lose: 'c2_hp2_win' },
    c2_hp2_win: { scene: 'gym', fx: { flag: ['beat_kai', 'hp2_won'], rep: 6, fans: 3000, recruit: true, rankBump: 25, rankWhy: 'Halsey Park II', post: { by: 'courtvision', text: '🚨 {first} {last} just beat KAI STERLING in front of Silk Sterling. The comeback was ridiculous.' } },
      lines: [
        ['narrator', 'The student section is on the floor. Somebody\'s little brother is hanging off your neck.'],
        ['narrator', 'Through the crowd, Silk grabs Kai by the arm. He isn\'t yelling, which is worse.'],
      ],
      choices: [
        { t: 'Push through the crowd and check on Kai.', fx: { rel: { kai: 10 }, flag: 'saw_silk' }, next: 'L_kai_hall' },
        { t: 'Stay with your team. This is your night.', fx: { chem: 8, rep: 2 }, next: 'c2_kai_pov' },
      ] },
    L_kai_hall: { cine: true, scene: 'locker',
      lines: [
        ['kai', 'What do you want, Halsey? Come to gloat?', 'sad'],
        ['you', 'Your dad always like that?'],
        ['kai', '"Sterlings don\'t lose to nobodies." That\'s all he said.', 'sad'],
        ['kai', 'Don\'t tell anyone about this either.'],
      ], next: 'c2_kai_pov' },
    /* Kai's POV: Silk dissecting the film */
    c2_kai_pov: { scene: 'home', cutscene: () => CH2.kaiFilm(), seenId: 'c2_kai_film', fx: { age: 17 },
      lines: [['narrator', 'Summer comes and goes. Junior year starts with your name on the varsity roster.']], next: 'c2_junior_branch' },
    c2_junior_branch: { type: 'branch', branches: [{ if: { flag: 'hs_westbrook' }, next: 'W_season1' }], else: 'L_season1' },

    /* ======================= ARC 3: THE PEACH SLAM ARC ======================= */
    L_season1: { type: 'season', then: { champion: 'c2_jr_champ', eliminated: 'c2_jr_out', missed: 'c2_jr_out' },
      season: Object.assign({
        id: 'junior_lincoln', name: 'Junior Season', level: 'hs', user: 'lincoln', mateRating: 47, teams: METRO, champFlag: 'city_champ',
        schedule: [
          { opp: 'eastview', key: true, title: 'Season Opener', pre: 'c2_opener_pre' },
          { opp: 'central' },
          { opp: 'northgate', key: true, title: 'Top-5 Showdown', importance: 2, moments: 10 },
          { opp: 'stvincent' },
          { opp: 'oakmont' },
        ],
        interrupts: { 1: 'L_brick', 3: 'c2_viral_jr' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 1: 'c2_cityfinal_pre' } }, CITY_PLAYOFF),
      }, HS_PACE) },
    W_season1: { type: 'season', then: { champion: 'c2_jr_champ', eliminated: 'c2_jr_out', missed: 'c2_jr_out' },
      season: Object.assign({
        id: 'junior_westbrook', name: 'Junior Season', level: 'hs', user: 'westbrook', mateRating: 55, teams: METRO, champFlag: 'city_champ',
        schedule: [
          { opp: 'eastview', key: true, title: 'Season Opener', pre: 'c2_opener_pre' },
          { opp: 'central' },
          { opp: 'lincoln', key: true, title: 'Old Friends', importance: 2, moments: 10, pre: 'W_tariq_pre', post: { win: 'W_tariq_win', lose: 'W_tariq_loss' } },
          { opp: 'stvincent' },
          { opp: 'northgate' },
        ],
        interrupts: { 1: 'W_kai_freeze', 3: 'c2_viral_jr' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 1: 'c2_cityfinal_pre' } }, CITY_PLAYOFF),
      }, HS_PACE) },
    L_brick: { scene: 'locker',
      lines: [
        ['brick', 'Two years I waited for this team to be MINE. Then you show up shooting like it\'s your audition.', 'fierce'],
        ['brick', 'Some of us need this too, playground.'],
      ],
      choices: [
        { t: '"You\'re right. I\'ll find you more."', fx: { chem: 10, trust: 5, rep: -1, rel: { brick: 12 }, flag: 'brick_ally' }, next: '@season' },
        { t: '"Then stop missing and I\'ll pass it to you."', fx: { rep: 3, chem: -8, rel: { brick: -12 } }, next: 'L_brick_fight' },
        { t: 'Sit next to him. "What do the scouts want from you?"', check: { a: 'iq', dc: 48 }, fx: { chem: 12, rel: { brick: 18 }, flag: 'brick_ally', trust: 4 }, next: '@season', fail: 'L_brick_fight' },
      ] },
    L_brick_fight: { scene: 'locker',
      lines: [['narrator', 'Brick shoves you into the lockers. The room goes silent.'], ['brick', 'Say it again!', 'fierce']],
      choices: [
        { t: 'Swing on him.', hint: 'Suspended a week', fx: { trust: -15, rep: -3, morale: 3, flag: 'benched_fight', rel: { brick: -20, lou: -6 }, injury: { games: 1, name: 'Suspended (conditioning only)' }, log: 'Suspended a week for fighting a teammate.' }, next: '@season' },
        { t: 'Walk away.', fx: { trust: 4, morale: -3, attrs: { iq: 1 } }, next: '@season' },
      ] },
    W_kai_freeze: { scene: 'gym',
      lines: [['narrator', 'Three games in, the pattern is obvious. When you\'re open, Kai doesn\'t see you.'], ['vale', 'He\'s freezing you out, bro. Everybody can see it.']],
      choices: [
        { t: 'Confront him in the huddle.', fx: { rel: { kai: -8 }, rep: 2, trust: -4, chem: -6 }, next: '@season' },
        { t: 'Find him after practice. Talk one-on-one.', check: { a: 'iq', dc: 44 }, next: 'W_kai_talk_ok', fail: '@season', failFx: { rel: { kai: -5 }, morale: -3 } },
        { t: 'Go to Coach Graves.', fx: { trust: 4, rel: { kai: -10 } }, next: '@season' },
      ] },
    W_kai_talk_ok: { scene: 'gym', fx: { rel: { kai: 12 }, chem: 10, flag: 'kai_ally' },
      lines: [
        ['kai', 'My dad pauses on every pass that doesn\'t lead to MY bucket.', 'sad'],
        ['you', 'Then let\'s give him film he can\'t argue with.'],
        ['kai', 'Fine. But I get the last shot.', 'smile'],
      ], next: '@season' },
    W_tariq_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Westbrook at Lincoln. They open the doors so people can watch from the hallway.'],
        ['tariq', 'Don\'t look at the signs, bro, look at me. I\'m about to cook you.', 'smile'],
      ],
      choices: [
        { t: 'Dap Tariq up at center court.', fx: { rel: { tariq: 6 }, morale: 2 }, next: '@season' },
        { t: 'Blow a kiss to the student section.', fx: { rep: 3, fans: 1500 }, next: '@season' },
      ] },
    W_tariq_win: { scene: 'gym', fx: { rep: 3, recruit: true }, lines: [['tariq', 'Proud of you, man. Still hate you, mostly proud.', 'smile']], next: '@season' },
    W_tariq_loss: { scene: 'gym', fx: { trust: -6, morale: -4, rel: { tariq: 5 }, post: { by: 'tariq', text: 'LINCOLN OVER WESTBROOK. I hit the game winner over my best friend and I will be talking about it at his wedding.' } },
      lines: [['narrator', 'Lincoln upsets Westbrook. Tariq hits the game-winner over you.'], ['tariq', '(mouthing) My bad, bro. Not really.', 'smile']], next: '@season' },
    c2_opener_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Junior year opener. The bleachers are full for once.', null, { hs: 'lincoln' }],
        ['narrator', 'Season opener, streaming nationally. A camera on a cable flies over the court.', null, { hs: 'westbrook' }],
        ['nia', '(waving a poster of your face) THAT\'S MY BROTHER!', 'smile'],
      ],
      choices: [
        { t: 'Point at Mom and Nia before tip-off.', fx: { rel: { mom: 4, nia: 4 }, morale: 4 }, next: '@season' },
        { t: 'Headphones on. Lock in.', fx: { attrs: { clutch: 1 }, morale: 2 }, next: '@season' },
      ] },
    c2_promoted: { scene: 'gym', fx: { flag: 'starter', trust: 4, morale: 6 },
      lines: [
        ['brennan', 'You talk on defense now. You start tonight.', null, { hs: 'lincoln' }],
        ['graves', 'You make Kai better. You start Friday.', null, { hs: 'westbrook' }],
      ], next: '@season' },
    c2_cityfinal_pre: { scene: 'arena',
      lines: [
        ['narrator', 'City Final, downtown at the Civic Arena.'],
        ['brennan', 'Thirty-one years, never won one of these. No speech, go play.', null, { hs: 'lincoln' }],
        ['graves', 'Westbrook has won nine of the last ten. Be the tenth.', null, { hs: 'westbrook' }],
        ['lou', '(in the stands) The rim, kid. Not the man.', null, { notFlag: 'lou_snub' }],
      ], next: '@season' },
    c2_jr_champ: { scene: 'arena', fx: { trust: 10, rep: 6, fans: 5000, recruit: true, offers: true, post: { by: 'courtvision', text: '🏆 {hs} are City Champions! {name} was the difference all season.' } },
      lines: [
        ['narrator', 'City Champions. The bucket under the leaky roof is getting a trophy next to it.', null, { hs: 'lincoln' }],
        ['tariq', 'WE\'RE CITY CHAMPS! SOMEBODY TELL KAI!', 'smile', { hs: 'lincoln' }],
        ['narrator', 'City Champions. Westbrook hands out the hats like they\'ve done it before.', null, { hs: 'westbrook' }],
      ], next: 'c2_money' },
    c2_jr_out: { scene: 'locker', fx: { morale: -4 },
      lines: [['narrator', 'The season ends with a long, quiet bus ride home.'], ['brennan', 'Next year we go further. You hear me?', null, { hs: 'lincoln' }]], next: 'c2_money' },
    c2_viral_jr: { scene: 'home', fx: { flag: 'viral', fans: 8000, rep: 3, recruit: true, unlock: 'mixtape' },
      lines: [
        ['nia', 'WAKE UP. I made a mixtape of your season and it has four hundred thousand views.', 'smile'],
        ['nia', 'From now on I film every game, and you drop a real tape once a season. Deal?', 'smile'],
      ],
      choices: [
        { t: '"You\'re officially my manager. Ten percent."', fx: { rel: { nia: 12 }, fans: 5000, flag: 'nia_manager' }, next: '@season' },
        { t: 'Post it: "They not ready."', fx: { rep: 4, fans: 9000, trust: -3, rel: { nia: 3 } }, next: '@season' },
        { t: 'Ask her to take it down. Focus.', fx: { attrs: { iq: 1 }, morale: 3, rel: { nia: -8 } }, next: '@season' },
      ] },
    /* Mom's money low: she gets hurt at work, rent is due */
    c2_money: { cine: true, scene: 'hospital', cutscene: 'mom_money',
      lines: [
        ['mom', 'Don\'t you dare worry about this, baby. You have a summer to play.', 'sad'],
        ['narrator', 'Rent is due Friday.'],
      ],
      choices: [
        { t: 'Night shifts at the warehouse. (+$400, heavy fatigue)', fx: { money: 400, fatigue: 25, rel: { mom: 10 } }, next: 'c2_summer' },
        { t: 'Ask Lou for help.', req: { rel: { lou: 30 } }, fx: { money: 300, rel: { lou: 6, mom: 4 } }, next: 'c2_summer' },
        { t: 'Let Nia monetize your page. (+$500)', req: { flag: 'nia_manager' }, fx: { money: 500, rel: { nia: 10, mom: 5 }, fans: 3000 }, next: 'c2_summer' },
        { t: 'Take Vince\'s envelope. (+$1,500)', hint: '⚠ A booster', fx: { money: 1500, flag: ['booster', 'vince_card'], rel: { lou: -6 } }, next: 'c2_summer' },
      ] },
    c2_summer: { scene: 'home', fx: { recruit: true, offers: true },
      lines: [['narrator', 'June. Junior year is over and the national rankings just dropped.'], ['nia', 'Recruiting Wire has you at {stars}, national rank {rank}!', 'smile']], next: 'c2_nia_bday' },
    c2_nia_bday: { scene: 'home',
      lines: [['narrator', 'The Elite 100 Camp lands on Nia\'s thirteenth birthday.'], ['nia', 'It\'s fine, go. I don\'t even want a party.', 'sad']],
      choices: [
        { t: 'Go to the Elite 100 Camp.', fx: { attrs: { iq: 1, clutch: 1, three: 1, perD: 1 }, rep: 5, recruit: true, rel: { nia: -15, mom: -5 }, flag: 'elite_camp' }, next: 'c2_camp' },
        { t: 'Skip camp. Be there for Nia.', fx: { rel: { nia: 14, mom: 7 }, morale: 6 }, next: 'c2_bday' },
        { t: 'Bring Nia to camp with you. (−$80)', req: { money: 80 }, fx: { money: -80, rel: { nia: 8, mom: 3 }, rep: 3, flag: ['elite_camp', 'nia_camp'] }, next: 'c2_camp' },
      ] },
    c2_camp: { scene: 'arena',
      lines: [
        ['narrator', 'Elite 100 Camp. Three coaches ask for Mom\'s number.'],
        ['narrator', 'Nia texts: "happy birthday to me i guess."', null, { notFlag: 'nia_camp' }],
        ['nia', 'Best birthday ever. I told a coach you\'re six-eight, so grow, please.', 'smile', { flag: 'nia_camp' }],
        ['kai', 'Courts are empty, Halsey. One-on-one to eleven, no cameras.', 'fierce'],
      ],
      choices: [
        { t: 'Accept. One-on-one with Kai.', hint: '1v1 · first to 11', next: 'c2_kai_1v1' },
        { t: '"Not tonight, Kai."', fx: { rel: { kai: -3 }, fatigue: -10 }, next: 'c2_lou_aau' },
      ] },
    c2_kai_1v1: { type: 'match', us: 'halsey', them: 'kai_solo', rating: 67, mateRating: 50, level: 'street', pickup: { size: 1, target: 11 }, venue: 'rooftop',
      title: 'One-on-One', sub: 'vs Kai Sterling · first to 11', win: 'c2_kai_1v1_win', lose: 'c2_kai_1v1_loss' },
    c2_kai_1v1_win: { scene: 'arena', fx: { rep: 4, rel: { kai: 8 }, flag: 'beat_kai_1v1', recruit: true },
      lines: [['kai', 'Run it back. No, don\'t, I need to sit down.', 'sad'], ['kai', 'You\'re the only person my age who scares me.']], next: 'c2_lou_aau' },
    c2_kai_1v1_loss: { scene: 'arena', fx: { morale: -3, rel: { kai: 3 } },
      lines: [['kai', 'Eleven. You\'re good, Halsey, you\'re just not me yet.', 'smile']], next: 'c2_kai_mark' },
    /* he beat you last: the senior-year rivalry game is marked (Lincoln) */
    c2_kai_mark: { type: 'branch', branches: [{ if: { hs: 'lincoln' }, next: 'c2_kai_marked' }], else: 'c2_lou_aau' },
    c2_kai_marked: { type: 'branch', fx: { mark: { id: 'kai', star: 'Kai Sterling', title: 'RIVALRY NIGHT II', sub: 'He beat you last' } }, branches: [], else: 'c2_lou_aau' },
    c2_bday: { scene: 'home',
      lines: [['narrator', 'A cake shaped like a basketball. Tariq DJs from his phone.'], ['nia', 'I made you your future trading card. Ninety-nine overall.', 'smile']], next: 'c2_lou_aau' },
    c2_lou_aau: { type: 'branch', branches: [{ if: { flag: 'lou_snub' }, next: 'c2_lou_return' }], else: 'c2_lou_team' },
    c2_lou_team: { scene: 'rec',
      lines: [
        ['lou', 'I did something stupid. Started an AAU team, Halsey Hoops.'],
        ['lou', 'We\'re going to the Peach Slam, where Silk\'s team has won two straight. I\'d like to ruin that.', 'smile'],
      ],
      choices: [
        { t: '"I\'m in. Let\'s ruin it."', fx: { rel: { lou: 6 }, morale: 4 }, next: 'c2_marcus' },
        { t: '"How\'d you pay for an AAU team, Lou?"', hint: '"Sold my truck. Now get in the gym."', fx: { rel: { lou: 8 } }, next: 'c2_marcus' },
      ] },
    c2_lou_return: { cine: true, scene: 'playground_night',
      lines: [
        ['narrator', 'Lou Banks is on the bench at Halsey Street at 6 a.m. Waiting.'],
        ['lou', 'Still think you don\'t need a coach?'],
        ['lou', 'I\'ve got an AAU team going to the Peach Slam. There\'s a spot for you.'],
      ],
      choices: [
        { t: '"I was wrong, Lou. I\'m sorry. I\'m in."', fx: { rel: { lou: 22 }, unflag: 'lou_snub', morale: 4 }, next: 'c2_marcus' },
        { t: '"I\'ll play. But I\'ve done fine without you."', fx: { rel: { lou: -4 }, rep: 1 }, next: 'c2_marcus' },
      ] },
    c2_marcus: { scene: 'street_night',
      lines: [
        ['narrator', 'Cousin Marcus is leaning on a car outside your building. He walks with a cane now.', null, { flag: 'marcus_crash' }],
        ['narrator', 'Cousin Marcus is leaning on a car outside your building, grinning.', null, { notFlag: 'marcus_crash' }],
        ['marcus', 'Cuz, my man has a truck full of brand-new sneakers. We flip \'em, three hundred a pair.', 'smile'],
      ],
      choices: [
        { t: '"No. And you shouldn\'t either."', fx: { rel: { marcus: -4 }, attrs: { iq: 1 } }, next: 'c2_aau' },
        { t: '"How much could I make?"', next: 'c2_scheme' },
        { t: '"Lou needs a team manager. Come with us."', check: { a: 'iq', dc: 50 }, fx: { rel: { marcus: 15, lou: 4 }, flag: 'marcus_manager', chem: 5 }, failFx: { rel: { marcus: -2 } }, next: 'c2_aau' },
      ] },
    c2_scheme: { scene: 'street_night', fx: { money: 400, rep: -2, flag: 'scheme_once' },
      lines: [
        ['narrator', 'A parking garage at midnight, forty boxes, four hundred cash in an envelope.'],
        ['marcus', 'See? Easy, and next one\'s a whole trailer on Thursday.', 'smile'],
      ],
      choices: [
        { t: '"Never again, Marcus. I\'m out."', fx: { rel: { marcus: -6 }, morale: -2 }, next: 'c2_aau' },
        { t: '"…Thursday. One more, then I\'m done."', hint: '⚠ Career-defining', next: 'c2_scheme2' },
      ] },
    c2_scheme2: { scene: 'street_night', cutscene: 'career_end',
      lines: [['narrator', 'Thursday. The trailer is empty.'], ['narrator', 'The headlights behind you are not. It was a sting.']],
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
        autoSim: true, simXp: HS_PACE.simXp, hubAP: HS_PACE.hubAP,
        playoff: { teams: 4, name: 'Peach Slam Bracket', rounds: ['Semifinal', 'Peach Slam Final'], moments: [10, 12], pre: { 1: 'c2_aau_final_pre' } },
      } },
    c2_aau_pre: { scene: 'arena',
      lines: [
        ['narrator', 'The Peach Slam: eight courts and five hundred college coaches in polos.'],
        ['lou', 'Nobody\'s watching the score. They\'re watching your face when you miss.'],
        ['vince', '(courtside, purple suit) Good luck, kid. I\'m rooting for you.', 'smile', { flag: 'booster' }],
      ], next: '@season' },
    c2_vince: { scene: 'street_night',   // older saves only (Vince now shows up at Mom's money low)
      lines: [['vince', 'Vince Shark. Friends of mine at big programs are very interested in you.', 'smile']],
      choices: [
        { t: 'Take the envelope. ($2,000)', fx: { money: 2000, flag: 'booster', rel: { lou: -4 } }, next: '@season' },
        { t: '"No thanks."', fx: { rep: 2, rel: { lou: 6, mom: 4 }, morale: 3 }, next: '@season' },
      ] },
    c2_aau_final_pre: { scene: 'arena',
      lines: [
        ['silk', 'Sterling Select doesn\'t lose this tournament. Ask anybody.', 'fierce', { opp: 'sterling_select' }],
        ['narrator', 'Sterling Select went out in the semis. Silk is screaming at a referee in the parking lot.', null, { notOpp: 'sterling_select' }],
        ['lou', 'Whatever happens, I\'m proud of this team. Now go break some hearts.', 'smile'],
      ], next: '@season' },
    c2_aau_champ: { scene: 'arena', fx: { rep: 8, fans: 15000, recruit: true, offers: true, rel: { lou: 8 }, post: { by: 'recruit', text: '🍑 PEACH SLAM CHAMPIONS: Lou Banks\' Halsey Hoops stuns the field! {name} is the talk of the event.' } },
      lines: [['narrator', 'A team that drove nine hours in a borrowed church van wins the Peach Slam.'], ['lou', 'Sold my truck for this. Best trade I ever made.', 'smile']], next: 'c2_coach_visit' },
    c2_aau_out: { scene: 'arena', fx: { rep: 2, recruit: true, offers: true },
      lines: [['narrator', 'No trophy. On the way out, Lou\'s phone rings eleven times, all coaches asking about you.'], ['lou', 'Trophies are nice. Phone calls are better.']], next: 'c2_coach_visit' },
    c2_coach_visit: { scene: 'home', fx: { offers: true, develop: 'hs_junior', recruit: true, rankAt: { to: 120, better: true, why: 'Recruiting heats up' } },
      lines: [
        ['narrator', 'August. A head coach is sitting on your couch, vacuumed three times this morning.'],
        ['kowalski', 'Five national titles. I\'ve never promised anyone playing time, only opportunity.', null, { minStars: 4 }],
        ['simmons', 'At Magnolia State your son wouldn\'t be one of many. He\'d be THE one.', 'smile', { maxStars: 3 }],
        ['mom', 'One question, Coach. When he gets hurt, what happens to him then?'],
      ],
      choices: [
        { t: 'Let Mom ask every question she has.', fx: { rel: { mom: 10 }, attrs: { iq: 1 } }, next: 'c2_senior_branch' },
        { t: '"Coach, how many minutes as a freshman?"', check: { a: 'iq', dc: 50 }, fx: { rep: 2 }, next: 'c2_senior_branch', failFx: { rep: -1 } },
        { t: '"What kind of NIL money are we talking?"', fx: { money: 300, rel: { mom: -6 }, rep: -1 }, next: 'c2_senior_branch' },
      ] },

    /* ======================= ARC 4: THE STATE ARC (climax) ======================= */
    c2_senior_branch: { type: 'branch', fx: { age: 18, set: { fatigue: 10 } }, branches: [{ if: { flag: 'hs_westbrook' }, next: 'W_senior_open' }], else: 'L_senior_open' },
    L_senior_open: { scene: 'gym',
      lines: [
        ['narrator', 'Senior year. One last run at Lincoln High.'],
        ['brennan', 'I\'ve been wrong about players maybe twice in thirty-one years. You\'re the third, and my captain.', 'smile', { minTrust: 58 }],
        ['brennan', 'I still don\'t trust your shot selection. Prove me wrong one more time.', null, { maxTrust: 57 }],
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
        interrupts: { 1: 'c2_tariq_grades', 2: 'c2_lou_cough', 3: 'c2_scandal_check', 4: 'c2_lou_hosp' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 0: 'c2_ankle', 1: 'c2_final_pre' }, halftime: 'lou_voice' }, STATE_PLAYOFF),
      }, HS_PACE) },
    L_kai2_pre: { scene: 'gym',
      lines: [
        ['narrator', 'In the hallway before warmups you hear Silk: "Lose to that kid again and don\'t come home."'],
        ['kai', 'You heard that, huh.', 'sad'],
      ],
      choices: [
        { t: '"Whatever happens, you\'re more than his son."', fx: { rel: { kai: 12 }, flag: 'kai_bond' }, next: '@season' },
        { t: 'Say nothing. Use it.', fx: { rel: { kai: -6 }, morale: 5, attrs: { clutch: 1 } }, next: '@season' },
      ] },
    L_kai2_win: { scene: 'gym', fx: { rep: 6, fans: 8000, recruit: true },
      lines: [['narrator', 'Lincoln sweeps Westbrook for the first time in school history.'], ['kai', 'You\'re in my head, Halsey. I hate it.', 'sad']], next: '@season' },
    L_kai2_loss: { scene: 'gym', fx: { morale: -3 }, lines: [['narrator', 'Kai gets his revenge: thirty-four points and a stare-down.'], ['kai', 'See you in March.', 'fierce']], next: '@season' },
    W_senior_open: { scene: 'gym',
      lines: [
        ['narrator', 'Senior year: you and Kai on the cover of the season preview. He insisted his name go first.'],
        ['graves', 'Co-captains. If either of you pouts, both of you sit.', null, { flag: 'kai_ally' }],
        ['graves', 'Kai is captain. You\'re… important.', null, { notFlag: 'kai_ally' }],
      ],
      choices: [
        { t: '"State championship. That\'s the only goal."', fx: { morale: 5 }, next: 'W_season2' },
        { t: 'Ask Kai to run two-man game every morning.', fx: { rel: { kai: 6 }, chem: 6, attrs: { pass: 1 } }, next: 'W_season2' },
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
        interrupts: { 0: 'W_silk', 1: 'c2_tariq_grades', 2: 'c2_lou_cough', 3: 'c2_scandal_check', 4: 'c2_lou_hosp' }, promote: 'c2_promoted',
        playoff: Object.assign({ pre: { 0: 'c2_ankle', 1: 'c2_final_pre' }, halftime: 'lou_voice' }, STATE_PLAYOFF),
      }, HS_PACE) },
    W_silk: { scene: 'locker',
      lines: [['silk', 'A word, young man.'], ['silk', 'Every shot you take is one that isn\'t on my son\'s tape. Understand?', 'fierce']],
      choices: [
        { t: '"With respect, sir. Kai plays better when he\'s not scared of you."', fx: { rel: { kai: 10, silk: -15 }, rep: 2, flag: 'kai_bond' }, next: '@season' },
        { t: '"Yes, sir."', fx: { morale: -5, rel: { silk: 5 } }, next: '@season' },
        { t: 'Walk away and tell Kai what his dad said.', fx: { rel: { kai: 6, silk: -8 }, chem: 4 }, next: '@season' },
      ] },
    W_lincoln2_pre: { scene: 'gym', lines: [['tariq', 'Senior year, bro. Last time we ever play each other.', 'smile']], next: '@season' },
    c2_tariq_test: { type: 'branch', branches: [], else: 'c2_tariq_grades' },   // older saves (the Tariq falling out is Chapter 3 now)
    c2_tariq_grades: { scene: 'home',
      lines: [['tariq', 'Bro, I\'m failing chemistry. Flunk the midterm and I\'m ineligible.', 'sad'], ['tariq', 'I\'m not asking you for anything. I\'m just telling you.', 'sad']],
      choices: [
        { t: 'Tutor him every night for two weeks.', fx: { rel: { tariq: 16 }, fatigue: 18, attrs: { iq: 1 }, flag: 'tariq_eligible' }, next: '@season' },
        { t: 'Pay for a real tutor. (−$150)', req: { money: 150 }, fx: { money: -150, rel: { tariq: 9 }, flag: 'tariq_eligible' }, next: '@season' },
        { t: '"You\'ll figure it out, T. I\'ve got my own season."', fx: { rel: { tariq: -10 } }, next: '@season' },
      ] },
    /* foreshadowing, then Lou steps away */
    c2_lou_cough: { scene: 'gym', cutscene: 'lou_cough2', lines: [['tariq', 'Lou okay? He looked gray, bro.', 'sad']], next: '@season' },
    c2_lou_hosp: { scene: 'hospital', cutscene: 'lou_hospital', fx: { flag: 'lou_hospital', morale: -6 },
      lines: [['narrator', 'Lou won\'t be at the state tournament. The doctors say he\'s not going anywhere for a while.']], next: '@season' },
    c2_scandal_check: { type: 'branch', branches: [{ if: { flag: 'booster' }, next: 'c2_booster_news' }], else: '@season' },
    c2_booster_news: { scene: 'home', fx: { post: { by: 'recruit', text: '🚨 REPORT: Top recruit {name} allegedly accepted cash from a runner tied to multiple college programs.' } },
      lines: [['narrator', 'Somebody had a camera. The photo of you with Vince Shark\'s envelope is everywhere by lunch.'], ['mom', 'Look at me, {first}. Is it true?', 'sad']],
      choices: [
        { t: 'Tell the truth. To Mom, your coach, the compliance people.', fx: { rep: -4, rel: { mom: 8, lou: 8 }, money: -1500, flag: 'booster_admitted', trust: 3 }, next: '@season' },
        { t: 'Deny everything.', check: { a: 'iq', dc: 58 }, fx: { rep: -1 }, next: '@season', failFx: { flag: 'booster_scandal', rep: -8, recruit: true, rel: { mom: -10, lou: -8 }, log: 'Caught lying about Vince Shark\'s envelope. Two big programs stopped calling.' } },
      ] },
    c2_senior_night: { scene: 'gym',
      lines: [
        ['narrator', 'Senior Night. They call your name and you walk out with your family.'],
        ['mom', '(in a back brace, refusing the wheelchair) I am WALKING out there.', 'smile'],
        ['nia', 'Made you a giant cardboard head. Don\'t cry, you\'re crying.', 'smile'],
        ['narrator', 'There\'s a chair with Lou\'s name taped to it.', null, { flag: 'lou_hospital' }],
      ],
      choices: [{ t: 'Hug all of them. Then go to work.', fx: { morale: 8, rel: { mom: 3, nia: 3 } }, next: '@season' }] },
    /* the ankle (fixed setback), the fight back, the pills choice */
    c2_ankle: { scene: 'gym', cutscene: 'ankle', fx: { flag: 'bad_ankle', injury: { games: 1, name: 'High ankle sprain' }, morale: -6, log: 'High ankle sprain the week before the state tournament.' },
      lines: [['narrator', 'Doubtful for the tournament. You go to rehab at six the next morning anyway.']], next: 'c2_rehab' },
    c2_rehab: { scene: 'gym', cutscene: 'rehab', qteFx: { id: 'push', ok: { morale: 4, fatigue: -10 }, okToast: '💪 The ankle holds' }, next: 'c2_pills' },
    c2_pills: { scene: 'locker',
      lines: [
        ['narrator', 'Game day. Your ankle is still the size of a grapefruit.'],
        ['narrator', 'A guy who "works with athletes" slips you two white pills. "You won\'t feel a thing."'],
      ],
      choices: [
        { t: 'Take the pills and play like nothing\'s wrong.', hint: '⚠ Career-defining', check: { a: 'stam', dc: 60 }, fx: { morale: 4, rep: 2, log: 'Took pills to play through a bad ankle.' }, next: 'c2_semi_talk', fail: 'c2_broken' },
        { t: 'Play hurt, no pills. Tell the trainer the truth.', hint: 'A small penalty while it heals', fx: { injury: { games: 2, name: 'Bad ankle (playing hurt)' }, trust: 4, rel: { lou: 4 } }, next: 'c2_semi_talk' },
      ] },
    c2_semi_pre: { type: 'branch', branches: [{ if: { flag: 'bad_ankle' }, next: 'c2_pills' }], else: 'c2_semi_talk' },   // older saves
    c2_injury: { scene: 'gym',   // older saves only
      lines: [['narrator', 'You land on a teammate\'s foot and your ankle rolls all the way over.']],
      choices: [{ t: 'Sit out a game.', fx: { injury: { games: 1, name: 'Sprained ankle' }, fatigue: -20 }, next: '@season' }, { t: 'Tape it and play.', fx: { flag: 'tough' }, next: '@season' }] },
    c2_injury_worse: { scene: 'hospital', fx: { injury: { games: 3, name: 'Badly sprained ankle' }, flag: 'bad_ankle' }, lines: [['narrator', 'The ankle goes again. Worse.']], next: '@season' },   // older saves only
    c2_mom_hurt: { scene: 'hospital',   // older saves only
      lines: [['narrator', 'Mom hurt her back at work. Rent is due in nine days.']],
      choices: [{ t: 'Pick up night shifts. (+$400)', fx: { money: 400, fatigue: 25 }, next: '@season' }, { t: 'Ask Lou for help.', req: { rel: { lou: 30 } }, fx: { money: 300 }, next: '@season' }] },
    c2_semi_talk: { scene: 'locker',
      lines: [
        ['narrator', 'State Semifinal. You can hear the band through the wall.'],
        ['brennan', 'Win and we play for a state title. I\'ve never said those words out loud.', null, { hs: 'lincoln' }],
        ['graves', 'Win, and Westbrook plays for its sixth state title.', null, { hs: 'westbrook' }],
      ], next: '@season' },
    c2_broken: { scene: 'hospital', cutscene: 'career_end',
      lines: [
        ['narrator', 'First drive of the third quarter. A crack like a gunshot.'],
        ['narrator', 'It wasn\'t a sprain. It was a stress fracture, and now it\'s a complete one.'],
        ['lou', '(on the phone from his hospital bed) Why didn\'t you TELL anybody, kid?', 'sad', { notFlag: 'lou_snub' }],
      ],
      choices: [{ t: 'Stare at the ceiling…', next: 'end_broken' }] },
    end_broken: { type: 'ending', ending: 'broken' },
    c2_final_pre: { scene: 'arena',
      lines: [
        ['narrator', 'The State Championship. Twelve thousand people downtown.'],
        ['narrator', 'Lou\'s seat in the third row is empty. He\'s watching from a hospital bed.'],
        ['kai', 'It was always gonna be us, Halsey. Since that first day on your court.', 'fierce', { opp: 'westbrook' }],
        ['tariq', 'Me and you, state final. Loser buys wings for life.', 'smile', { opp: 'lincoln' }],
        ['holt', 'Everybody talks about you and Kai. Let\'s fix that tonight.', 'fierce', { opp: 'northgate' }],
      ], next: '@season' },

    /* ---------- after the season ---------- */
    c2_state_champ: { scene: 'arena', cutscene: 'state_champ', fx: { rep: 10, fans: 40000, recruit: true, offers: true, flag: 'state_champ', post: { by: 'courtvision', text: '🏆 STATE CHAMPIONS 🏆 {name} and {hs} finish it on one good ankle.' } },
      lines: [
        ['brennan', '(holding the trophy like it might break) Thirty-two years, {last}.', 'smile', { hs: 'lincoln' }],
        ['graves', 'Westbrook standard. Good work, {last}, genuinely.', 'smile', { hs: 'westbrook' }],
        ['mom', 'That\'s my baby! THAT\'S MY BABY!', 'smile'],
      ], next: 'c2_trophy' },
    c2_trophy: { scene: 'hospital', cutscene: 'trophy_lou', lines: [['narrator', 'The nurses pretend not to see the confetti on the floor.']], next: 'c2_offers' },
    c2_state_out: { scene: 'locker', fx: { morale: -6, recruit: true, offers: true },
      lines: [
        ['narrator', 'You gave it everything on one leg.', null, { flag: 'bad_ankle' }],
        ['narrator', 'In the stands, three scouts write the same thing down.', null, { flag: 'bad_ankle' }],
        ['narrator', 'The season ends in the state tournament. You sit in your jersey for an hour.', null, { notFlag: 'bad_ankle' }],
      ], next: 'c2_offers' },
    c2_state_missed: { scene: 'gym', fx: { morale: -8, recruit: true, offers: true },
      lines: [['narrator', 'No state tournament. Senior year ends in February.'], ['nia', 'The coaches are still calling, {first}.', 'sad']], next: 'c2_ankle_late' },
    /* the ankle is a fixed setback: with no state tournament it comes in a spring workout instead */
    c2_ankle_late: { scene: 'gym', cutscene: (s, ctx) => { ctx.late = true; return 'ankle'; }, seenId: 'ankle', fx: { flag: 'bad_ankle', morale: -6, log: 'High ankle sprain in a spring workout.' },
      lines: [['narrator', 'Rehab starts at six the next morning. You\'re there at 5:40.']], next: 'c2_rehab_late' },
    c2_rehab_late: { scene: 'gym', cutscene: 'rehab', qteFx: { id: 'push', ok: { morale: 4, rep: 2 }, okToast: '💪 The ankle holds' },
      lines: [['narrator', 'By signing day you\'re running again. The scouts noticed that too.']], next: 'c2_offers' },
    c2_offers: { scene: 'gym', fx: { recruit: true, offers: true },
      lines: [
        ['narrator', 'Signing period. Letters stack up on the kitchen table: {stars}, national rank {rank}.'],
        ['mom', 'You don\'t have to pick today, baby. Pick it for you.'],
        ['nia', 'I made a graphic for every school. Plus Europe, plus the Grind League.', 'smile'],
      ], next: 'c2_graduation' },
    c2_graduation: { scene: 'arena', fx: { xp: 150, morale: 8, log: 'Graduated high school.' },
      lines: [
        ['narrator', 'Graduation. Your gown is too short because you grew again.'],
        ['mom', 'First one in our family. The very first.', 'sad'],
        ['nia', 'Mom. We said no crying until the car.', 'smile'],
      ], next: 'ch_end' },

    /* next: the U.S. Youth National Team summer, unless an older save already played it */
    ch_end: { type: 'chapterEnd', nextChapter: s => USA_DONE(s) ? 'college' : 'usa', fx: { develop: 'highschool' },
      summary: 'High school is over. You leave {hs} as a {ovr}-Overall {stars} recruit, ranked {rank} in the nation. The offers can wait: the national team picks its roster this summer.',
      recap: [
        { if: { flag: 'state_champ' }, t: '🏆 State champion' },
        { if: { flag: 'hp2_won' }, t: '🥊 Won Halsey Park II' },
        { if: { flag: 'city_champ' }, t: '🥇 City champion (junior year)' },
        { if: { flag: 'aau_champ' }, t: '🍑 Peach Slam champion' },
        { if: { flag: 'called_up_v' }, t: '⬆️ Cut, then called up from JV' },
        { if: { flag: 'viral' }, t: '📱 Went viral' },
        { if: { flag: 'kai_bond' }, t: '🤝 You and Kai understand each other now' },
        { if: { flag: 'tariq_eligible' }, t: '📚 Got Tariq through chemistry' },
        { if: { flag: 'booster_scandal' }, t: '⚠️ Booster scandal' },
        { if: { flag: 'nia_manager' }, t: '💜 Nia runs your brand' },
      ] },

    /* ---------- older saves only: scenes the rebuild replaced ---------- */
    L_kai1_pre: { scene: 'gym', lines: [['narrator', 'Westbrook comes to Lincoln with a charter bus and Silk Sterling.']], next: '@season' },
    L_kai1_win: { scene: 'gym', fx: { rep: 6, recruit: true, flag: 'beat_kai' }, lines: [['narrator', 'The Lincoln student section pours onto the court.']], next: '@season' },
    L_kai1_loss: { scene: 'gym', fx: { morale: -3 }, lines: [['narrator', 'Kai finishes with thirty-one. Silk claps exactly once.']], next: '@season' },
    c2_cel_check: { type: 'branch', branches: [], else: '@season' },
  },
  moved: {
    L_brennan_tape: 'L_tryout_pre', L_brennan_need: 'L_tryout_pre', L_brennan_need_fail: 'L_tryout_pre',
    L_starter: 'L_playbook', L_bench: 'L_playbook', W_starter: 'W_playbook', W_bench: 'W_playbook',
    L_brick_ok: '@season', L_suspended: '@season', L_promoted: 'c2_promoted', W_promoted: 'c2_promoted',
    L_cityfinal_pre: 'c2_cityfinal_pre', W_cityfinal_pre: 'c2_cityfinal_pre',
    L_jr_champ: 'c2_jr_champ', W_jr_champ: 'c2_jr_champ', L_jr_out: 'c2_jr_out', W_jr_out: 'c2_jr_out',
    W_vale_win: 'W_tryout_pre', W_vale_lose: 'W_tryout_pre', W_kai_talk_bad: '@season', W_tariq_text: 'W_playbook',
    W_tariq_beef: '@season', W_tariq_call: '@season', W_tariq_call_bad: '@season', c2_celebrate: '@season',
    c2_usa_early: 'c2_nia_bday', c2_lou_money: 'c2_marcus', c2_marcus_no: 'c2_aau', c2_marcus_save: 'c2_aau', c2_growth: 'c2_senior_branch',
    c2_pills_ok: 'c2_semi_talk', c2_booster_caught: '@season', c2_camp_nia: 'c2_lou_aau',
    L_opener_pre: 'c2_opener_pre', W_opener_pre: 'c2_opener_pre', L_kai_hall_old: 'L_kai_hall',
    c2_signing_day: 'c2_offers', c2_choose: 'c2_graduation', c2_commit_react: 'c2_graduation', c2_usa_check: 'ch_end',
  },
};
