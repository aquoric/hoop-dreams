/* =====================================================================
   DATA-STORY-CH3-OVERSEAS.JS — Chapter 3, route 2: straight to the pros overseas.
   A club abroad (offers depend on your overseas interest — the national team summer raises it), a new city,
   the language, grown men, homesickness, a coach who doesn't trust teenagers, a league title run and the
   Continental Cup. Nodes are added to STORY.chapters.college (js/data-story-ch3.js).
   ===================================================================== */
C3.euroLeague = s => {
  const me = s.career.club || 'istanbul', pac = ['tokyo', 'sydney', 'beijing'].includes(me);
  const list = (pac ? ['tokyo', 'sydney', 'beijing', 'seoul', 'osaka', 'manila', 'auckland', 'taipei'] : ['madrid', 'paris', 'belgrade', 'istanbul', 'athens', 'vilnius', 'munich', 'porto']).filter(id => id !== me);
  return [me].concat(list.slice(0, 7));
};
C3.toughFor = s => { const me = s.career.club, pac = ['tokyo', 'sydney', 'beijing'].includes(me); return pac ? (me === 'beijing' ? 'sydney' : 'beijing') : me === 'belgrade' ? 'paris' : 'belgrade'; };
C3.starFor = s => { const me = s.career.club, pac = ['tokyo', 'sydney', 'beijing'].includes(me); return pac ? (me === 'sydney' ? 'tokyo' : 'sydney') : me === 'paris' ? 'madrid' : 'paris'; };

Object.assign(STORY.chapters.college.nodes, {
  oo_start: { scene: 'home', fx: { overseas: 1, log: 'Chapter 3: overseas.' },
    lines: [
      ['narrator', 'Your agent calls the day you get home. Clubs on three continents want you.'],
      ['priya', 'Priya Shah — I work with guys who skip college. Your national team film made my phone explode.', 'smile', { flag: 'usa_made' }],
      ['priya', 'Priya Shah, agent. Europe doesn\'t care who cut you in June, only what you do in October.', null, { flag: 'usa_cut' }],
      ['priya', 'Priya Shah, agent: going pro at eighteen takes guts. Let\'s get you paid for them.', 'smile', { notFlag: ['usa_made', 'usa_cut'] }],
    ], next: 'oo_offers' },
  oo_offers: { scene: 'home',
    lines: [['priya', 'These are the real offers. Bigger club, smaller role; smaller club, you play.'], ['narrator', 'Six logos on the screen. Six cities you\'ve never been to.']],
    choices: [
      { t: 'Castilla Madrid — the biggest club in Europe.', hint: 'Elite club · Marc Ribera\'s team · fewer minutes', req: { minOverseas: 6 }, fx: { club: 'madrid', money: 120000, rep: 5, trust: -6 }, next: 'oo_goodbye' },
      { t: 'Paris Lumière — Bastien Mbaye\'s team.', hint: 'Teammates with your national-team rival', req: { minOverseas: 4 }, fx: { club: 'paris', money: 90000, rep: 4, rel: { mbaye: 4 } }, next: 'oo_goodbye' },
      { t: 'Danube Belgrade — the loudest gym on earth.', hint: 'A big-man club · Vuk Radenko · tough coach', req: { minOverseas: 2 }, fx: { club: 'belgrade', money: 70000, rep: 3 }, next: 'oo_goodbye' },
      { t: 'Bosphorus Istanbul — a starting spot on day one.', hint: 'Mid-table club · big minutes', fx: { club: 'istanbul', money: 60000, trust: 6 }, next: 'oo_goodbye' },
      { t: 'Tokyo Neon Dragons — Pacific Pro League.', hint: 'Fast league · you\'re the star', fx: { club: 'tokyo', money: 55000, trust: 8, fans: 20000 }, next: 'oo_goodbye' },
      { t: 'Sydney Harbour Sharks — Pacific Pro League.', hint: 'Physical league · Lachie Doyle\'s hometown', fx: { club: 'sydney', money: 55000, trust: 6 }, next: 'oo_goodbye' },
    ] },
  oo_goodbye: { scene: 'airport', fx: { flag: 'signed_pro', post: { by: 'ehn', text: '✈️ SIGNED: {name} turns pro with {club}. Straight from high school to the pros.' } },
    lines: [
      ['mom', 'You call me when you land, when you eat, and when you\'re sad.', 'sad'],
      ['nia', 'I put twelve granola bars in your bag. Ration them, it\'s a long way.', 'smile'],
      ['lou', 'Grown men over there will try to break you. Let them try.', 'determined', { notFlag: 'lou_snub' }],
    ], next: 'oo_arrival' },
  oo_arrival: { scene: 'abroad', cutscene: 'c3_abroad', fx: { age: 18 },
    lines: [['narrator', '{clubCity}. A driver holds up a sign with your name spelled almost right.']], next: 'oo_lena' },
  oo_lena: { scene: 'abroad',
    lines: [
      ['lena', 'Welcome to {clubCity}! I\'m Lena: translator, landlord, emergency contact, mostly translator.', 'smile'],
      ['lena', 'Rule one: practice at nine means eight-forty. Rule two: never sit in the captain\'s chair.'],
    ],
    choices: [
      { t: '"Teach me the important words first."', fx: { rel: { lena: 6 }, attrs: { iq: 1 } }, next: 'oo_apartment' },
      { t: '"Which one\'s the captain\'s chair?"', fx: { rel: { lena: 4 } }, next: 'oo_apartment' },
    ] },
  oo_apartment: { scene: 'abroad',
    lines: [
      ['narrator', 'Your apartment is the size of your bedroom at home. The shower is also the kitchen.'],
      ['narrator', 'The grocery store closes at eight. Everything is labeled in a language you can\'t read.'],
    ],
    choices: [
      { t: 'Point at things and hope.', fx: { morale: -2, fatigue: 4 }, next: 'oo_coach' },
      { t: 'Call Lena for the hundredth time.', fx: { rel: { lena: 3 }, morale: 2 }, next: 'oo_coach' },
      { t: 'Find the street food. Eat what the locals eat.', fx: { morale: 4, attrs: { stam: 1 } }, next: 'oo_coach' },
    ] },
  oo_coach: { scene: 'locker',
    lines: [
      ['ocoach', 'You are eighteen. In this league, eighteen sits.', 'determined'],
      ['ocoach', 'I don\'t care about highlights. I care if you know where to be.'],
    ],
    choices: [
      { t: '"Tell me where to be. I\'ll be there."', fx: { trust: 6, rel: { ocoach: 5 } }, next: 'oo_marko' },
      { t: '"Give me one practice. Then decide."', fx: { trust: 2, morale: 3 }, next: 'oo_marko' },
      { t: '"They didn\'t pay me to sit."', fx: { trust: -6, rel: { ocoach: -5 }, morale: 2 }, next: 'oo_marko' },
    ] },
  oo_marko: { scene: 'gym',
    lines: [
      ['marko', 'So you are the American boy. I have socks older than you.', 'smile'],
      ['marko', 'Fourteen seasons, three knees. Here, the old men teach the young ones — painfully.'],
    ], next: 'oo_practice' },
  oo_practice: { scene: 'gym',
    lines: [
      ['narrator', 'First practice: Marko elbows you on every cut. The coach doesn\'t call anything.'],
      ['narrator', 'These aren\'t kids. They\'re men with mortgages, and you\'re trying to take their minutes.'],
    ],
    choices: [
      { t: 'Elbow him back.', fx: { attrs: { str: 1 }, rel: { marko: 4 }, trust: -2 }, next: 'oo_scrim' },
      { t: 'Beat him with speed instead.', fx: { attrs: { speed: 1 }, rel: { marko: 2 } }, next: 'oo_scrim' },
      { t: 'Ask him how to get through screens.', fx: { attrs: { iq: 1 }, rel: { marko: 8 }, trust: 3 }, next: 'oo_scrim' },
    ] },
  oo_scrim: { type: 'match', us: '@club', them: 'porto', ratingRel: 2, mateRel: 1, moments: 9, level: 'euro', importance: 1,
    title: 'Preseason Friendly', sub: 'Your first game as a pro', win: 'oo_scrim_win', lose: 'oo_scrim_loss' },
  oo_scrim_win: { scene: 'locker', fx: { trust: 4, rep: 2 }, lines: [['marko', 'Not bad, boy. Not good, but not bad.', 'smile'], ['ocoach', 'You fouled twice going for steals. Fix it.']], next: 'oo_language' },
  oo_scrim_loss: { scene: 'locker', fx: { morale: -2 }, lines: [['ocoach', 'Now you know. Everybody here is strong, everybody is smart.'], ['marko', 'Tomorrow you lift with me. Seven a.m.', 'determined']], next: 'oo_language' },
  oo_language: { scene: 'abroad',
    lines: [
      ['narrator', 'Timeout: the coach draws a play, yells, and everybody nods. You understood one word: "you."'],
      ['lena', 'You need words for basketball at least. Screen, switch, help, run. And "sorry."', 'smile'],
    ],
    choices: [
      { t: 'Language app, every night before bed.', fx: { attrs: { iq: 1 }, flag: 'learning_lang', fatigue: 3 }, next: 'oo_kai_news' },
      { t: 'Have Lena sit behind the bench and translate.', fx: { trust: 2, rel: { lena: 4 } }, next: 'oo_kai_news' },
      { t: 'Learn it from teammates — slang first.', fx: { chem: 6, rel: { marko: 4 }, trust: -1 }, next: 'oo_kai_news' },
    ] },
  oo_kai_news: { scene: 'home', fx: { flag: 'kai_blueridge' },
    lines: [
      ['narrator', 'Two in the morning, Kai FaceTimes you from a Blue Ridge dorm. There\'s a shoe deal box on the bed.'],
      ['kai', 'College is easy, Halsey. Sixteen thousand fans, I don\'t even practice hard.', 'smile'],
      ['kai', 'Rumor is there\'s a Global Showcase this spring: my Devils against the best young pros. Don\'t miss it.', 'fierce'],
    ], next: 'oo_hub1' },
  oo_hub1: { type: 'hub', title: 'Before the Season', next: 'oo_season', intro: 'The season starts this week. Train, rest, or find a game at the Old Town Plaza Court.' },
  oo_season: { type: 'season', then: { champion: 'oo_league_champ', eliminated: 'oo_league_out', missed: 'oo_league_out' },
    season: s => {
      const teams = C3.euroLeague(s), me = teams[0], tough = C3.toughFor(s), star = C3.starFor(s), others = teams.filter(t => t !== tough && t !== star && t !== me);
      return { id: 'c3_euro', name: `${LOCAL_TEAMS[me].name} Season`, level: 'euro', user: me, teams, mateRating: LOCAL_TEAMS[me].rating - 3,
        schedule: [
          { opp: others[0], key: true, title: 'Pro Debut', home: true, pre: 'oo_debut_pre' },
          { opp: others[1] },
          { opp: others[2], key: true, away: true, title: 'Road Trip', importance: 2, pre: 'oo_road_pre' },
          { opp: tough, key: true, title: 'The Big Man', importance: 2, moments: 11, pre: 'oo_tough_pre', post: { win: 'oo_tough_win', lose: 'oo_tough_loss' } },
          { opp: others[3] },
          { opp: star, key: true, title: 'Star Matchup', importance: 2, pre: 'oo_star_pre' },
          { opp: others[4] },
          { opp: others[0] === teams[1] ? teams[2] : teams[1], key: true, title: 'Derby', importance: 2, pre: 'oo_derby_pre' },
        ],
        interrupts: { 1: 'oo_bench', 4: 'oo_homesick', 6: 'oo_trust' },
        playoff: { teams: 4, name: 'League Playoffs', rounds: ['Semifinal', 'League Final'], moments: [11, 12], pre: { 1: 'oo_final_pre' } },
        finalVenue: 'ovs_' + (OVERSEAS_CLUBS[me] ? me : 'paris') };
    } },
  oo_debut_pre: { scene: 'arena',
    lines: [['narrator', 'Your pro debut. The home fans have a banner with your face and a word you\'ll learn means "kid."'], ['marko', 'Breathe, the ball is the same. Only the men are bigger.', 'smile']],
    choices: [{ t: 'Let\'s go.', fx: { morale: 3 }, next: '@season' }] },
  oo_bench: { scene: 'locker',
    lines: [['ocoach', 'Tonight you start on the bench, because you gamble on defense. Veterans don\'t gamble.', 'determined'], ['narrator', 'Your name isn\'t in the starting five. Back home, it\'s 4 a.m., and Nia stayed up to watch.']],
    choices: [
      { t: 'Ask him for a film session.', fx: { trust: 8, attrs: { iq: 1 }, rel: { ocoach: 6 } }, next: 'oo_bench_ok' },
      { t: 'Sulk on the bench. Everybody sees it.', fx: { trust: -6, morale: -3 }, next: '@season' },
      { t: 'Be the loudest guy on the bench.', fx: { trust: 4, chem: 6 }, next: 'oo_bench_ok' },
    ] },
  oo_bench_ok: { scene: 'locker', fx: { flag: 'earned_trust' }, lines: [['ocoach', 'Good. Now I can coach you.', 'smile'], ['marko', 'He smiled. I have seen this twice in four years.', 'smile']], next: '@season' },
  oo_road_pre: { scene: 'arena',
    lines: [['narrator', 'A road game. Flares, drums, a man in the front row who screams your name with an extra syllable.'], ['lena', 'Don\'t look at the chants. I will not translate them.', 'smile']], next: '@season' },
  oo_tough_pre: { scene: 'arena',
    lines: [
      ['narrator', 'Tonight: Vuk Radenko. Seven feet, moves like a guard, remembers everything.', null, { notClub: ['tokyo', 'sydney', 'beijing', 'belgrade'] }],
      ['narrator', 'Tonight: the strongest frontcourt in the league. They\'ve been waiting for the American.', null, { club: ['tokyo', 'sydney', 'beijing', 'belgrade'] }],
      ['marko', 'They will put you on the floor many times. Get up every time.'],
    ], next: '@season' },
  oo_tough_win: { scene: 'locker', fx: { trust: 5, rep: 4, overseas: 1 }, lines: [['narrator', 'You won. You also can\'t lift your arms, and your lip is bleeding.'], ['marko', 'They hit you like a man. You played like one.', 'smile']], next: 'oo_wt' },
  oo_tough_loss: { scene: 'locker', fx: { morale: -4 }, lines: [['narrator', 'You went 3-for-14. They took away your drive and then your jumper.'], ['ocoach', 'Two moves are not enough at this level.', 'determined']], next: 'oo_wt' },
  /* Weapon Training: Sal DeLuca, eleven years in Europe, shows up in your gym */
  oo_wt: { cine: true, scene: 'gym', fx: { unlock: 'weapon_training', rel: { sal: 4 } },
    lines: [
      ['narrator', 'After practice, a short American in a team jacket is rebounding for nobody in particular.'],
      ['sal', 'Court two, remember? I\'m scouting this league for a client and I saw your game.', 'smile', { flag: 'jelly_met' }],
      ['sal', 'Sal DeLuca. Played here eleven years, five-nine, never got blocked twice by the same guy.', 'smile', { notFlag: 'jelly_met' }],
      ['sal', 'Every night they\'ll take your favorite move, so we build you new ones. Mornings, before practice.'],
    ], next: 'oo_jelly_check' },
  oo_jelly_check: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: '@season' }], else: 'oo_jelly_pre' },
  oo_jelly_pre: { scene: 'gym',
    lines: [['sal', 'First thing I learned over here: you can\'t go through a seven-footer. You go around him.'], ['sal', 'His arm comes up one side, you flick it off the glass on the other. Watch.', 'smile']], next: 'oo_jelly_lesson' },
  oo_jelly_lesson: { type: 'flick', scene: 'gym', title: 'MORNING SESSION · THE JELLY', coach: 'sal', reps: 6, need: 2, venue: 'euro_plaza', win: 'oo_jelly_done' },
  oo_jelly_done: { scene: 'gym', fx: { flag: 'jelly', unlock: 'jelly', attrs: { finish: 1 }, xp: 120, log: 'Learned the jelly layup from Sal DeLuca.' },
    lines: [['sal', 'That\'s a jelly. The big men in this league are about to hate you.', 'smile']], next: '@season' },
  oo_homesick: { scene: 'home',
    lines: [
      ['narrator', 'Your birthday, and nobody here knows. You eat cereal for dinner and watch Halsey Street videos.'],
      ['nia', '(video call) We made you a cake. Mom is going to eat your slice on camera, sorry.', 'smile'],
      ['mom', 'You can always come home, baby. But I don\'t think you want to.', 'smile'],
    ],
    choices: [
      { t: '"I\'m staying. I\'m getting better every day."', fx: { morale: 4, rel: { mom: 4 } }, next: '@season' },
      { t: 'Go out with Marko and the guys. Make this home.', fx: { chem: 8, rel: { marko: 6 }, morale: 3, fatigue: 5 }, next: '@season' },
      { t: 'Cry a little. Then go shoot.', fx: { attrs: { three: 1 }, morale: 2 }, next: '@season' },
    ] },
  oo_star_pre: { scene: 'arena',
    lines: [
      ['mbaye', 'The American boy came to my league. Brave, not smart.', 'smile', { notClub: ['paris', 'tokyo', 'sydney', 'beijing'] }],
      ['narrator', 'Their star has been in this league since he was sixteen. Everybody in the building knows his name.', null, { club: ['paris', 'tokyo', 'sydney', 'beijing'] }],
    ], next: '@season' },
  oo_trust: { scene: 'locker', fx: { trust: 4 },
    lines: [
      ['ocoach', 'Last four games, you knew where to be. So now you start.', 'smile'],
      ['marko', 'He gave you my spot? Okay, then I will be your coach on the floor.', 'smile'],
    ], next: '@season' },
  oo_derby_pre: { scene: 'arena',
    lines: [['narrator', 'Derby night. Riot police outside, confetti inside, nobody has sat down since the parking lot.'], ['lena', 'For one night, this city has two religions. Win.', 'determined']], next: '@season' },
  oo_final_pre: { scene: 'arena', board: 'LEAGUE FINAL',
    lines: [['narrator', 'The league final. Every seat sold out in four minutes.'], ['marko', 'Fourteen seasons and I never won this. Help an old man.', 'determined']], next: '@season' },
  oo_league_champ: { scene: 'arena', board: 'CHAMPIONS', fx: { flag: 'league_champ', rep: 8, fans: 25000, xp: 200, money: 20000, overseas: 2, draftStock: 3, post: { by: 'courtvision', text: '🏆 Eighteen and a league champion: {name} wins it all with {club}.' } },
    lines: [['narrator', 'Marko lifts you onto his shoulders. A grown man is crying into your jersey.'], ['marko', 'FOURTEEN YEARS! THANK YOU, BOY!', 'smile']], next: 'oo_cup_intro' },
  oo_league_out: { scene: 'locker', fx: { morale: -2 }, lines: [['ocoach', 'Not this year, but you became a professional this season. That\'s the real title.'], ['marko', 'Next year, boy — or not, you\'ll be in the NBL. Then you buy me dinner.', 'smile']], next: 'oo_cup_intro' },
  oo_cup_intro: { scene: 'arena', cutscene: 'c3_eurocup', fx: { draftStock: 1 },
    lines: [['narrator', 'The Continental Cup. The best eight clubs, one weekend, one trophy older than your grandmother.']], next: 'oo_cup' },
  oo_cup: { type: 'season', then: { champion: 'oo_cup_champ', eliminated: 'oo_cup_out', missed: 'oo_cup_out' },
    season: s => {
      const me = s.career.club || 'istanbul', field = ['madrid', 'paris', 'belgrade', 'istanbul', 'athens', 'tokyo', 'sydney', 'beijing'].filter(id => id !== me);
      return { id: 'c3_cup', name: 'Continental Cup', level: 'euro', user: me, teams: [me].concat(field.slice(0, 7)), mateRating: LOCAL_TEAMS[me].rating - 3, schedule: [],
        playoff: { teams: 8, userSeed: s.flags.league_champ ? 2 : 5, name: 'Continental Cup', rounds: ['Quarterfinal', 'Final Four', 'Cup Final'], moments: [11, 12, 13], pre: { 2: 'oo_cup_final_pre' } },
        finalVenue: me === 'istanbul' ? 'ovs_madrid' : 'ovs_istanbul' };
    } },
  oo_cup_final_pre: { scene: 'arena',
    lines: [['narrator', 'The Cup Final. Thirty thousand people and a drum line that hasn\'t stopped in three days.'], ['ocoach', 'Play like you did when nobody knew your name.']], next: '@season' },
  oo_cup_champ: { scene: 'arena', board: 'CUP CHAMPIONS', cutscene: 'c3_champs', fx: { flag: 'cup_champ', rep: 10, fans: 30000, xp: 250, draftStock: 5, overseas: 2, post: { by: 'courtvision', text: '🏆 CONTINENTAL CUP CHAMPIONS! The American teenager {name} brings it home for {club}.' } },
    lines: [['narrator', 'The trophy is heavier than it looks. Marko kisses it, then you, then the trophy again.'], ['lena', 'I translated "champion" for you. You didn\'t need me.', 'smile']], next: 'oo_showcase_pre' },
  oo_cup_out: { scene: 'locker', fx: { morale: -2, xp: 60 }, lines: [['narrator', 'Out of the Cup. The flight home is silent except for Marko\'s snoring.']], next: 'oo_showcase_pre' },
  oo_showcase_pre: { scene: 'arena', cutscene: 'c3_kai',
    lines: [
      ['narrator', 'The Global Showcase. Kai\'s Blue Ridge Devils against a team of the best young pros abroad.'],
      ['kai', 'Look at you, Europe made you serious. Too bad, Halsey.', 'smile'],
      ['kai', 'I watched your games at three in the morning. Don\'t tell anybody.', null, { flag: 'kai_bond' }],
    ], next: 'oo_showcase' },
  oo_showcase: { type: 'match', us: 'world_select', them: 'blueridge_kai', ratingRel: 2, mateRel: 2, moments: 11, level: 'euro', importance: 2, venue: 'tournament',
    title: 'Global Showcase', sub: 'World Select vs Blue Ridge', win: 'oo_show_win', lose: 'oo_show_loss' },
  oo_show_win: { scene: 'arena', fx: { draftStock: 3, rep: 5, fans: 12000, flag: 'beat_kai_c3' },
    lines: [['kai', 'Fine, you got better. I\'ll see you on draft night.', 'fierce'], ['dee', '(to her phone) Lottery. Put him in the lottery.', null, { flag: 'saw_dee' }]], next: 'oo_decide' },
  oo_show_loss: { scene: 'arena', fx: { draftStock: 1 },
    lines: [['kai', 'College guy beats the pro. Write that headline down, Halsey.', 'smile'], ['narrator', 'Twelve scouts write something in their notebooks. You hope it\'s not about the turnover.']], next: 'oo_decide' },
  oo_decide: { scene: 'home',
    lines: [
      ['priya', 'You can opt into the Draft. Your club would want a buyout, but they\'d let you go.', 'smile'],
      ['ocoach', 'Stay one more year and you start. Go, and I\'ll tell every NBL scout you were mine.'],
    ],
    choices: [
      { t: 'Opt into the Draft.', fx: { flag: 'declared', money: -10000, rel: { priya: 5 } }, next: 'c3_declare' },
      { t: 'One more season abroad.', fx: { trust: 8, rel: { ocoach: 6, marko: 4 } }, next: 'oo_stay' },
    ] },
  oo_stay: { scene: 'arena', fx: { ageUp: 1, attrs: { iq: 1, str: 1, perD: 1 }, xp: 250, draftStock: 3, money: 80000, log: 'Played a second season overseas.' },
    lines: [
      ['narrator', 'Year two: you start every game, you curse in the local language, and Marko retires in your arms.'],
      ['lena', 'You don\'t need a translator anymore. I\'m going to miss being needed.', 'smile'],
    ], next: 'oo_stay_end' },
  oo_stay_end: { scene: 'home', fx: { flag: 'declared' }, lines: [['priya', 'First round, maybe the lottery. Your club already agreed on the buyout.', 'smile']], next: 'c3_declare' },
});
