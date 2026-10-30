/* =====================================================================
   DATA-STORY-CH3-DEV.JS — Chapter 3, road 3: the NBL Grind League (STORY.md, Chapter 3).
   THE DECISION ARC (the contract, the bus) → THE STOLEN CALL-UP ARC (Dez goes quiet, a scout talks to him instead of
   you, the call-up you earned goes to Dez, a roster crunch and you're waived; a teammate's couch, Scoop, open runs at
   the Warehouse, Dez's notes from the NBL, a tryout contract with the Capital Hustle, the awakening) → THE CALL-UP ARC
   (the Tariq falling out, Kai at College vs Pros, the playoffs against the team that waived you, and the ten-day
   call-up, earned back, with your first NBL win as the fixed high). Nodes go into STORY.chapters.college.
   ===================================================================== */
C3.glTeams = () => ['gl_ignition', 'gl_ropers', 'gl_thunder', 'gl_gators', 'gl_vipers', 'gl_herd', 'gl_hustle', 'gl_cruisers'];

Object.assign(STORY.chapters.college.nodes, {
  /* ======================= ARC 1: THE DECISION ARC ======================= */
  gg_start: { scene: 'home', fx: { flag: 'gl_v2', log: 'Chapter 3: the Grind League.' },
    lines: [
      ['narrator', 'Your first paycheck comes in August. After taxes it buys groceries and half a car payment.'],
      ['narrator', 'Ignition: a team of teenagers in a league of grown men who want your spot.'],
      ['narrator', 'No guaranteed deal: an open tryout, ninety players, four spots. You got one.', null, { flag: 'gl_walkon' }],
      ['nia', 'Fun fact: Kai\'s NIL deal at Blue Ridge pays more than your whole team. I checked.', 'smile'],
    ], next: 'gg_bus' },
  gg_bus: { scene: 'street_night', cutscene: 'c3_bus', fx: { age: 18 },
    lines: [['narrator', 'Nine-hour bus ride to training camp. The wifi works for eleven minutes.']], next: 'gg_contract' },
  gg_contract: { scene: 'home',
    lines: [
      ['narrator', 'Forty thousand a year, a per diem for road meals, and a clause about a ten-day call-up.'],
      ['priya', 'Priya Shah. I took you on because of that call-up clause.', 'smile'],
    ],
    choices: [
      { t: 'Send half of every check home.', fx: { money: 2000, rel: { mom: 10 }, morale: 4 }, next: 'gg_coach' },
      { t: 'Save it. Every dollar.', fx: { money: 8000 }, next: 'gg_coach' },
      { t: 'Buy a used car. You\'re a pro now.', fx: { money: 1000, morale: 6, rep: 1 }, next: 'gg_coach' },
    ] },
  gg_coach: { scene: 'gym',
    lines: [['gcoach', 'Twenty years in this league, a hundred kids like you. Six made it.'], ['gcoach', 'The six never complained about the bus. Not once.', 'determined']],
    choices: [
      { t: '"Then I won\'t either."', fx: { trust: 6, rel: { gcoach: 5 } }, next: 'gg_dez' },
      { t: '"What did the six do that the others didn\'t?"', fx: { trust: 5, attrs: { iq: 1 }, rel: { gcoach: 6 } }, next: 'gg_dez' },
      { t: '"I\'m not here long. Just get me seen."', fx: { trust: -5, morale: 2 }, next: 'gg_dez' },
    ] },
  gg_dez: { scene: 'locker',
    lines: [
      ['dez', 'So you\'re the prospect. I\'m the guy they keep around so prospects have someone to beat.', 'smile'],
      ['dez', 'Two call-ups, nine NBL games, twenty-nine years old. You\'re taking my minutes, rook.'],
    ],
    choices: [
      { t: '"Then teach me how to take them."', fx: { rel: { dez: 10 }, attrs: { iq: 1 } }, next: 'gg_ike' },
      { t: '"Nothing personal. I\'m here to win."', fx: { rel: { dez: -4 }, morale: 3 }, next: 'gg_ike' },
      { t: '"Let\'s both get called up."', fx: { rel: { dez: 6 }, chem: 6 }, next: 'gg_ike' },
    ] },
  gg_ike: { scene: 'locker',
    lines: [
      ['ike', 'Back for more? Same team now, so I only block you in practice.', 'smile', { flag: 'jelly_met' }],
      ['narrator', 'Big Ike Grant skipped college too. Seven-one, eighteen, already sick of motel pillows.', null, { notFlag: 'jelly_met' }],
      ['ike', 'It\'s lobs every night. Throw it high.', 'smile'],
    ], next: 'gg_kai_news' },
  gg_kai_news: { scene: 'home', fx: { flag: 'kai_blueridge' },
    lines: [['narrator', 'Kai went to Blue Ridge after all: a private jet to road games.'], ['kai', '(text) How\'s the bus, Halsey? See you at College vs Pros.', 'smile']], next: 'gg_motel' },
  gg_motel: { scene: 'street_night',
    lines: [['narrator', 'Road trip one. Motel 9, two queen beds, a roommate who snores like a leaf blower.'], ['dez', 'Never trust the ice machine. Always trust the waffle maker.', 'smile']],
    choices: [
      { t: 'Shoot at the court behind the motel until midnight.', fx: { attrs: { three: 1 }, fatigue: 6 }, next: 'gg_scrim' },
      { t: 'Film study on your phone with Dez.', fx: { attrs: { iq: 1 }, rel: { dez: 4 } }, next: 'gg_scrim' },
      { t: 'Sleep in your headphones.', fx: { fatigue: -4 }, next: 'gg_scrim' },
    ] },
  gg_scrim: { type: 'match', us: '@gl', them: 'gl_vipers', ratingRel: 2, mateRel: 0, moments: 9, level: 'dev', importance: 1, venue: 'warehouse_run',
    title: 'Preseason Showcase', sub: 'Ignition vs Desert Vipers', win: 'gg_scrim_win', lose: 'gg_scrim_loss' },
  gg_scrim_win: { scene: 'locker', fx: { trust: 4, draftStock: 1 }, lines: [['gcoach', 'Good. Now do it after nine hours on a bus.'], ['dez', 'He means that literally. Thursday.', 'smile']], next: 'gg_hub1' },
  gg_scrim_loss: { scene: 'locker', fx: { morale: -2 }, lines: [['ike', 'I got dunked on by a guy with a mortgage. Humbling.', 'sad']], next: 'gg_hub1' },
  gg_hub1: { type: 'hub', title: 'Training Camp', next: 'gg_season', intro: 'Camp is over. Train, rest, or find a run at Motel 9 before the opener.' },

  /* ======================= ARC 2: THE STOLEN CALL-UP ARC ======================= */
  gg_season: { type: 'season', then: { champion: 'gg_champ', eliminated: 'gg_out', missed: 'gg_out' },
    season: s => Object.assign({ id: 'c3_gl', name: 'Grind League Season', level: 'dev', user: 'gl_ignition', teams: C3.glTeams(), mateRating: 58,
      schedule: [
        { opp: 'gl_herd', key: true, title: 'Season Opener', home: true, pre: 'gg_opener_pre' },
        { opp: 'gl_gators' },
        { opp: 'gl_thunder', key: true, title: 'The Veterans', importance: 2, moments: 11, pre: 'gg_vets_pre', post: { win: 'gg_vets_win', lose: 'gg_vets_loss' } },
        { opp: 'gl_cruisers' },
        { opp: 'gl_ropers', key: true, title: 'Scouts\' Night', importance: 2, pre: 'gg_showcase_pre' },
        { opp: 'gl_vipers' },
        { opp: 'gl_hustle', key: true, away: true, title: 'Road Trip', importance: 2, pre: 'gg_road_pre' },
        { opp: 'gl_gators' },
      ],
      interrupts: { 1: 'gg_paycheck', 3: 'gg_quiet', 4: 'gg_scout_dez', 5: 'gg_stolen' },
      playoff: { teams: 4, name: 'Grind League Playoffs', rounds: ['Semifinal', 'Grind League Final'], moments: [11, 12], pre: { 1: 'gg_final_pre' } },
      finalVenue: 'gl_gl_hustle' }, C3_PACE) },
  gg_opener_pre: { scene: 'gym',
    lines: [['narrator', 'Opening night: 2,400 fans, a mascot dressed as a spark plug, and nine NBL scouts.'], ['gcoach', 'They\'re not here for the spark plug. Go.']],
    choices: [{ t: 'Let\'s go.', fx: { morale: 3 }, next: '@season' }] },
  gg_paycheck: { scene: 'home',
    lines: [['narrator', 'Your per diem is twenty-eight dollars. Dinner is a gas station burrito.'], ['dez', 'Hotel breakfast is free. Take four bananas, every day.', 'smile']],
    choices: [
      { t: 'Bank the per diem, eat bananas.', fx: { money: 600, fatigue: 4 }, next: '@season' },
      { t: 'Pay for a real dinner for the rookies.', fx: { money: -200, chem: 8, rel: { ike: 4 } }, next: '@season' },
    ] },
  gg_vets_pre: { scene: 'gym',
    lines: [['narrator', 'Prairie Thunder: four guys who\'ve been called up and sent back down. They hate prospects.'], ['dez', 'They will hit you on purpose. The refs know, and nobody cares.']], next: '@season' },
  gg_vets_win: { scene: 'locker', fx: { trust: 4, draftStock: 2 }, lines: [['narrator', 'You won. You also have a black eye shaped like an elbow.'], ['gcoach', 'First time this year they looked scared of a kid.', 'smile']], next: 'gg_vets_after' },
  gg_vets_loss: { scene: 'locker', fx: { morale: -4 }, lines: [['dez', 'They\'ve seen every move you have. You need new ones.']], next: 'gg_vets_after' },
  gg_vets_after: { type: 'branch', branches: [{ if: { flag: 'gl_v2' }, next: '@season' }], else: 'gg_wt' },   // older saves met Scoop here
  /* foreshadowing: Dez goes quiet, a scout talks to him instead of you */
  gg_quiet: { scene: 'street_night',
    lines: [
      ['narrator', 'Dez stops talking on the bus, no waffle jokes. He stares at his phone all night.'],
      ['ike', 'Something\'s up with him. He hasn\'t stolen a banana in a week.', 'sad'],
    ],
    choices: [
      { t: 'Sit next to him. Ask.', fx: { rel: { dez: 4 } }, next: 'gg_quiet_ask' },
      { t: 'Leave him alone. Focus on your game.', fx: { morale: 2 }, next: '@season' },
    ] },
  gg_quiet_ask: { scene: 'street_night', lines: [['dez', 'Nothing, rook. Just thinking about being thirty.', 'sad']], next: '@season' },
  gg_scout_dez: { scene: 'gym',
    lines: [
      ['narrator', 'After shootaround an NBL scout walks right past you to shake Dez\'s hand. They talk for twenty minutes.'],
      ['gcoach', 'Scouts\' Night. Don\'t play for them, play for the win.'],
    ],
    choices: [
      { t: 'Play for the win.', fx: { trust: 4, chem: 4 }, next: '@season' },
      { t: 'Hunt your shot. This is your audition.', fx: { draftStock: 1, trust: -3, rep: 2 }, next: '@season' },
    ] },
  /* the setback (fixed): the call-up goes to Dez, the roster crunch, the waiver */
  gg_stolen: { scene: 'locker', cutscene: 'c3_waived', fx: { flag: 'gl_waived', set: { trust: 20 }, post: { by: 'ehn', text: '📞 Ignition\'s Desmond Rollins gets a ten-day NBL call-up. Ignition waives prospect {name} to make room.' }, log: 'The call-up went to Dez. You were waived.' },
    lines: [['narrator', 'The call you earned went to Dez. Then came the roster crunch, and your name on a waiver wire.']], next: 'gg_stolen_how' },
  gg_stolen_how: { type: 'branch', branches: [{ if: { test: 'c3_well' }, next: 'gg_waived_well' }], else: 'gg_waived_bad' },
  gg_waived_well: { scene: 'street_night', fx: { morale: -6, rankBump: -10, rankWhy: 'Waived by Ignition' },
    lines: [['narrator', 'Nineteen a game, and they waived you anyway. Numbers don\'t sign contracts.'], ['priya', 'Three teams asked about you. Let\'s get you back in shape and back in a jersey.', 'determined']], next: 'gg_couch' },
  gg_waived_bad: { scene: 'street_night', fx: { morale: -10, rankBump: -20, rankWhy: 'Waived by Ignition' },
    lines: [['narrator', 'You disappeared when it mattered. The waiver was the easy decision.'], ['priya', 'Nobody\'s calling yet. We make them call.', 'sad']], next: 'gg_couch' },
  gg_couch: { scene: 'street_night',
    lines: [
      ['ike', 'Couch is yours, man, as long as you need. The left cushion is haunted.', 'smile'],
      ['dez', '(text) It wasn\'t supposed to go like this, rook. I\'m sorry.', 'sad'],
    ],
    choices: [
      { t: 'Text back: "Go play. Don\'t come back."', fx: { rel: { dez: 8 }, morale: 2 }, next: 'gg_wt2' },
      { t: 'Don\'t answer.', fx: { rel: { dez: -6 } }, next: 'gg_wt2' },
    ] },
  /* Weapon Training: Scoop after the low */
  gg_wt2: { scene: 'gym', cutscene: 'c3_scoop', fx: { unlock: 'weapon_training', rel: { sal: 4 } },
    lines: [
      ['sal', 'Ignition fired you, not me. I work for you now.', 'smile', { flag: 'jelly_met' }],
      ['sal', 'Sal DeLuca, eleven years overseas at five-nine. I don\'t work for Ignition, I work for you.', 'smile', { notFlag: 'jelly_met' }],
      ['sal', 'Mornings at the Warehouse. Six a.m. Bring Ike to rebound.', 'determined'],
    ], next: 'gg_jelly_check2' },
  gg_jelly_check2: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: 'gg_climb' }], else: 'gg_jelly_pre' },
  gg_jelly_pre: { scene: 'gym',
    lines: [['sal', 'You can\'t go through the big man. You go around him.'], ['ike', 'Practice it on me. I promise to jump way too early.', 'smile']], next: 'gg_jelly_lesson' },
  gg_jelly_lesson: { type: 'flick', scene: 'gym', title: 'THE WAREHOUSE · THE JELLY', coach: 'sal', reps: 6, need: 2, venue: 'warehouse_run', win: 'gg_jelly_done' },
  gg_jelly_done: { scene: 'gym', fx: { flag: 'jelly', unlock: 'jelly', attrs: { finish: 1 }, xp: 120, log: 'Learned the jelly layup from Sal DeLuca.' },
    lines: [['sal', 'That\'s a jelly. Big Ike\'s face is the review.', 'smile'], ['ike', 'I hate it. Teach me how to stop it.', 'sad']], next: 'gg_jelly_after' },
  gg_jelly_after: { type: 'branch', branches: [{ if: { flag: 'gl_waived' }, next: 'gg_climb' }], else: '@season' },   // older saves learned it mid-season
  gg_climb: { scene: 'gym', cutscene: 'c3_climb', qteFx: { id: 'push', ok: { attrs: { speed: 1 }, morale: 4 }, okToast: '💪 +1 Speed' },
    lines: [['narrator', 'Taped to Ike\'s fridge: GET A JERSEY BACK.']], next: 'gg_hub_w' },
  gg_hub_w: { type: 'hub', title: 'Waived', next: 'gg_warehouse_pre', intro: 'No team, no paycheck. Train with Sal, rest on Ike\'s couch, or run with the pros at the Warehouse.' },
  /* redemption: open runs at the Warehouse, Dez's notes, a tryout contract */
  gg_warehouse_pre: { scene: 'gym',
    lines: [['narrator', 'The Warehouse Run: ex-NBL guys, overseas guys, guys between contracts. Like you.'], ['ike', 'I\'m on your team. Don\'t pass me the ball on the perimeter.', 'smile']], next: 'gg_warehouse' },
  gg_warehouse: { type: 'match', us: 'warehouse_you', them: 'warehouse_crew', pickup: { size: 3, target: 15 }, ratingRel: 2, mateRel: -1, moments: 7, level: 'street', importance: 1, venue: 'warehouse_run',
    title: 'The Warehouse Run', sub: 'Open run · winners stay', win: 'gg_warehouse_win', lose: 'gg_warehouse_loss' },
  gg_warehouse_win: { scene: 'gym', fx: { rep: 2, draftStock: 1 }, lines: [['narrator', 'Winners stay. You stay for six games.'], ['narrator', 'A man in a Capital Hustle polo writes something down.']], next: 'gg_dez_notes' },
  gg_warehouse_loss: { scene: 'gym', fx: { morale: -2 }, lines: [['narrator', 'You lose the first one. You win the next four.'], ['narrator', 'A man in a Capital Hustle polo writes something down.']], next: 'gg_dez_notes' },
  gg_dez_notes: { scene: 'home', fx: { flag: 'dez_notes', attrs: { iq: 1 }, rel: { dez: 6 } },
    lines: [
      ['narrator', 'A package from an NBL hotel. Forty pages of Dez\'s handwriting.'],
      ['dez', '(note) Every set they ran on me, every coverage. Go take my spot back, rook.', 'smile'],
    ], next: 'gg_tryout_pre' },
  gg_tryout_pre: { scene: 'gym',
    lines: [['narrator', 'A tryout contract with the Capital Hustle. One practice to earn it.'], ['narrator', 'Their first unit, full speed. The coach doesn\'t blink.']], next: 'gg_tryout' },
  gg_tryout: { type: 'match', us: 'c3_scout', them: 'gl_hustle', ratingRel: 2, mateRel: -2, moments: 7, level: 'dev', importance: 1, venue: 'gl_gl_hustle',
    title: 'Tryout', sub: 'Capital Hustle practice', win: 'gg_signed', lose: 'gg_signed_late' },
  gg_signed_late: { scene: 'gym', fx: { trust: -5 }, lines: [['narrator', 'You lose the scrimmage. The coach asks you back the next day anyway.'], ['narrator', 'Day two, you don\'t miss.']], next: 'gg_signed' },
  gg_signed: { scene: 'locker', fx: { glTeam: 'gl_hustle', set: { trust: 45 }, flag: 'gl_resigned', post: { by: 'ehn', text: '✍️ Capital Hustle sign {name}, three weeks after Ignition waived him.' }, log: 'Signed with the Capital Hustle.' },
    lines: [['narrator', 'A Capital Hustle jersey with your name on it. Spelled right.']], next: 'gg_awaken' },
  gg_awaken: { scene: 'gym', fx: { evolve: { line: 'Waived. Couch. Warehouse.', scene: 'gym' } },
    lines: [['sal', 'You came back better than you left. That\'s the only revenge that lasts.', 'smile']], next: 'gg_kai_pov' },
  gg_kai_pov: { scene: 'arena', cutscene: s => CH3.play('c3_kai_benched')(s), seenId: 'c3_kai_benched', fx: { flag: 'c3_kai_pov_seen' },
    lines: [['narrator', 'Somewhere else, the same week, Kai Sterling learns what a bench feels like.']], next: 'gg_season2' },
  gg_season2: { type: 'season', then: { champion: 'gg_champ', eliminated: 'gg_out', missed: 'gg_out' },
    season: s => Object.assign({ id: 'c3_gl2', name: 'Capital Hustle', level: 'dev', user: 'gl_hustle', teams: ['gl_hustle', 'gl_thunder', 'gl_ropers', 'gl_ignition'], mateRating: 59,
      schedule: [
        { opp: 'gl_thunder', key: true, title: 'Hustle Debut', pre: 'gg_hustle_pre' },
        { opp: 'gl_ropers' },
        { opp: 'gl_thunder' },
      ],
      playoff: { teams: 4, userSeed: 1, name: 'Grind League Playoffs', rounds: ['Semifinal', 'Grind League Final'], moments: [11, 12], pre: { 0: 'gg_arc3', 1: 'gg_final_pre' } },
      finalVenue: 'gl_gl_hustle' }, C3_PACE) },
  gg_hustle_pre: { scene: 'gym',
    lines: [['narrator', 'Your Hustle debut. Big Ike drove four hours to sit behind the bench.'], ['ike', 'You owe me gas money and a playoff win.', 'smile']],
    choices: [{ t: 'Let\'s go.', fx: { morale: 4 }, next: '@season' }] },

  /* ======================= ARC 3: THE CALL-UP ARC ======================= */
  gg_arc3: { scene: 'gym', fx: { mark: { id: 'gcoach', star: 'Isaiah "Big Ike" Grant', title: 'THE TEAM THAT CUT YOU', sub: 'Grind League Playoffs · vs Ignition' } },
    lines: [['narrator', 'The playoff bracket goes up. First round: Ignition.'], ['narrator', 'Three days off first. You take the bus home.']], next: 'c3_home' },
  /* the showdown with Kai: College vs Pros (a marked revenge game) */
  gg_kai2_pre: { scene: 'arena', cutscene: 'c3_kai',
    lines: [
      ['kai', 'Heard they cut you, and they benched me. Look at us, Halsey.', 'smile', { flag: 'c3_kai_pov_seen' }],
      ['kai', 'They let the bus league in here? Cute.', 'smile'],
    ], next: 'gg_kai2' },
  gg_kai2: { type: 'match', us: '@gl', them: 'blueridge_kai', ratingRel: 2, mateRel: 1, moments: 11, level: 'dev', importance: 2, venue: 'tournament',
    revenge: { id: 'kai', star: 'Kai Sterling', title: 'ROUND FIVE', sub: 'College vs Pros' }, title: 'College vs Pros', sub: 'vs Blue Ridge · Kai Sterling', win: 'gg_kai2_win', lose: 'gg_kai2_loss' },
  gg_kai2_win: { scene: 'arena', fx: { draftStock: 3, rep: 6, fans: 9000, flag: 'beat_kai_c3', rankBump: 25, rankWhy: 'Beat Kai Sterling', post: { by: 'courtvision', text: '🔥 Bus league 1, Blue Ridge 0: waived-and-back {name} outplays Kai Sterling.' } },
    lines: [['kai', 'One exhibition. Don\'t frame it.', 'fierce'], ['ike', 'Frame it. Frame it twice.', 'smile']], next: '@season' },
  gg_kai2_loss: { scene: 'arena', fx: { morale: -3 }, lines: [['kai', 'Back on the bus, Halsey. Safe travels.', 'smile']], next: '@season' },
  gg_final_pre: { scene: 'gym', lines: [['narrator', 'The Grind League Final: not glamorous. Absolutely everything to the guys in this room.']], next: '@season' },
  gg_champ: { scene: 'arena', board: 'CHAMPIONS', fx: { flag: 'gl_champ', rep: 6, fans: 12000, xp: 200, draftStock: 3, money: 5000, post: { by: 'courtvision', text: '🏆 Grind League champions! {name} wins it all, months after being waived.' } },
    lines: [['narrator', 'A trophy from a hardware store, champagne from a gas station. Best night of your life.']], next: 'gg_callup_check' },
  gg_out: { scene: 'locker', fx: { morale: -2 }, lines: [['narrator', 'The season\'s over. Your phone isn\'t.']], next: 'gg_callup_check' },
  /* the fixed high: the call-up, earned back, and your first NBL win */
  gg_callup_check: { type: 'branch', branches: [{ if: { flag: 'gl_waived' }, next: 'gg_callup' }, { if: { minDraft: 7 }, next: 'gg_callup' }, { if: { minOvr: 63 }, next: 'gg_callup' }, { if: { flag: 'gl_champ' }, next: 'gg_callup' }], else: 'gg_no_callup' },
  gg_callup: { scene: 'airport', cutscene: 'c3_callup', fx: { flag: 'called_up', money: 15000, draftStock: 2, post: { by: 'ehn', text: '📞 CALL-UP: {name} signs a 10-day contract with the Oklahoma City Blunder.' } },
    lines: [
      ['priya', 'Ten-day contract with the Oklahoma City Blunder. Your flight is in four hours, GO.', 'smile'],
      ['dez', '(text) Don\'t come back, rook. That\'s the nicest thing I\'ll ever say.', 'smile', { flag: 'gl_waived' }],
    ], next: 'gg_callup_pre' },
  gg_callup_pre: { scene: 'locker',
    lines: [['narrator', 'An NBL locker room. Your name above a locker, spelled right.'], ['narrator', 'Coach looks at you once: "Defend. Don\'t shoot first. Welcome."']], next: 'gg_callup_game' },
  gg_callup_game: { type: 'match', us: 'nbl_okc_cu', them: 'nbl_den_cu', ratingRel: 9, mateRel: 8, moments: 10, level: 'pro', importance: 3, venue: 'nbl_okc', script: 'c3_nbl',
    title: 'NBL Debut', sub: 'Ten-day contract · vs the Denver Nougats', win: 'gg_callup_win', lose: 'gg_callup_win' },
  gg_callup_win: { scene: 'arena', fx: { flag: 'nbl_win', draftStock: 3, rep: 8, fans: 20000, xp: 200, rankAt: { to: 12, better: true, why: 'First NBL win' }, post: { by: 'courtvision', text: '👀 Waived in January, an NBL winner in April: {name} helps the Blunder beat Denver.' } },
    lines: [['narrator', 'Your first NBL win. A veteran hands you the game ball without a word.'], ['narrator', 'You text a photo of it to one person first: Big Ike.']], next: 'c3_mend_check' },
  gg_callup_loss: { scene: 'arena', fx: { draftStock: 1, xp: 120 }, lines: [['narrator', 'A loss, but you didn\'t look out of place.']], next: 'gg_back' },   // older saves
  gg_back: { scene: 'home', lines: [['priya', 'The ten days are up. They want you in the Draft first.', 'smile']], next: 'gg_decide' },
  gg_no_callup: { scene: 'home', fx: { morale: -2 }, lines: [['narrator', 'No call this year.'], ['dez', '(text) You\'re next, I can feel it.', 'smile']], next: 'gg_decide' },
  gg_decide: { scene: 'home',
    lines: [
      ['priya', 'Mock drafts have you in the first round. Some have you in the lottery.', 'smile', { minDraft: 10 }],
      ['priya', 'Second round today. The workouts could change that.', null, { maxDraft: 9 }],
      ['gcoach', '(text) I was wrong about the waiver. Go prove it on draft night.', null, { flag: 'gl_waived' }],
    ],
    choices: [{ t: 'Declare for the Draft.', fx: { flag: 'declared', rel: { priya: 4 } }, next: 'c3_declare' }] },

  /* ---------------- older saves only (the earlier Chapter 3) ---------------- */
  gg_wt: { cine: true, scene: 'gym', fx: { unlock: 'weapon_training', rel: { sal: 4 } },
    lines: [['sal', 'Sal DeLuca, skills coach. They scouted you out of two moves, so we add weapons.', 'determined']], next: 'gg_jelly_check' },
  gg_jelly_check: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: '@season' }], else: 'gg_jelly_pre' },
  gg_breakdown: { scene: 'street_night', lines: [['narrator', 'The bus breaks down two hours from the arena, in the snow.']],
    choices: [{ t: 'Lead a sing-along.', fx: { chem: 10, morale: 3 }, next: '@season' }, { t: 'Sleep. Tomorrow is a back-to-back.', fx: { fatigue: -10 }, next: '@season' }] },
  gg_kai_pre: { scene: 'arena', cutscene: 'c3_kai', lines: [['kai', 'They let the bus league in here? Cute.', 'smile']], choices: [{ t: 'Say nothing. Just play.', fx: { morale: 4 }, next: '@season' }] },
  gg_kai_win: { scene: 'arena', fx: { draftStock: 3, rep: 6, fans: 9000, flag: 'beat_kai_c3' }, lines: [['kai', 'One exhibition. Don\'t frame it.', 'fierce']], next: '@season' },
  gg_kai_loss: { scene: 'arena', fx: { morale: -3 }, lines: [['kai', 'Back on the bus, Halsey. Safe travels.', 'smile']], next: '@season' },
  gg_scouts: { scene: 'gym', fx: { draftStock: 1 }, lines: [['narrator', 'Two NBL general managers in the front row tonight.']], choices: [{ t: 'Play for the win.', fx: { trust: 4, chem: 4 }, next: '@season' }] },
  gg_road_pre: { scene: 'gym', lines: [['narrator', 'A dawn flight with two connections and a seat that doesn\'t recline.']], next: '@season' },
  gg_showcase_pre: { scene: 'gym', fx: { draftStock: 1 }, lines: [['narrator', 'Scouts\' Night. Every NBL team has someone in the building.']], next: '@season' },
});
