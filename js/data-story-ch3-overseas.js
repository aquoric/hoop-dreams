/* =====================================================================
   DATA-STORY-CH3-OVERSEAS.JS — Chapter 3, road 2: straight to the pros overseas (STORY.md, Chapter 3).
   THE DECISION ARC (the offers, a one-way ticket, a new city) → THE UNPAID ARC (late paychecks, whispers, the club stops
   paying everyone; stay for nothing or go on loan; Scoop; the awakening; revenge on the rich club that lowballed you) →
   THE CUP ARC (home for a week and the Tariq falling out, the derby in front of 15,000 as the fixed high, the league
   playoffs, the Continental Cup, and Kai at the Global Showcase). Nodes go into STORY.chapters.college.
   ===================================================================== */
C3.euroLeague = s => {
  const me = s.career.club || 'istanbul', pac = ['tokyo', 'sydney', 'beijing'].includes(me);
  const list = (pac ? ['tokyo', 'sydney', 'beijing', 'seoul', 'osaka', 'manila', 'auckland', 'taipei'] : ['madrid', 'paris', 'belgrade', 'istanbul', 'athens', 'vilnius', 'munich', 'porto']).filter(id => id !== me);
  return [me].concat(list.slice(0, 7));
};
C3.toughFor = s => { const me = s.career.club, pac = ['tokyo', 'sydney', 'beijing'].includes(me); return pac ? (me === 'beijing' ? 'sydney' : 'beijing') : me === 'belgrade' ? 'paris' : 'belgrade'; };
C3.starFor = s => { const me = s.career.club, pac = ['tokyo', 'sydney', 'beijing'].includes(me); return pac ? (me === 'sydney' ? 'tokyo' : 'sydney') : me === 'paris' ? 'madrid' : 'paris'; };

Object.assign(STORY.chapters.college.nodes, {
  /* ======================= ARC 1: THE DECISION ARC ======================= */
  oo_start: { scene: 'home', fx: { overseas: 1, log: 'Chapter 3: overseas.' },
    lines: [
      ['narrator', 'Your agent calls the day you get home. Clubs on three continents want you.'],
      ['priya', 'Priya Shah. Your national team film made my phone explode.', 'smile', { flag: 'usa_made' }],
      ['priya', 'Priya Shah, agent. Europe doesn\'t care about June, only October.', null, { notFlag: 'usa_made' }],
    ], next: 'oo_offers' },
  oo_offers: { scene: 'home', fx: { flag: 'lowballed' },
    lines: [
      ['priya', 'Bigger club, smaller role. Smaller club, you play.'],
      ['priya', 'The richest club on the list offered half. "For the experience." I hung up.', 'angry'],
    ],
    choices: [
      { t: 'Castilla Madrid: the biggest club in Europe.', hint: 'Elite club · fewer minutes', req: { minOverseas: 6 }, fx: { club: 'madrid', money: 120000, rep: 5, trust: -6 }, next: 'oo_goodbye' },
      { t: 'Paris Lumière: Bastien Mbaye\'s team.', hint: 'Teammates with your national-team rival', req: { minOverseas: 4 }, fx: { club: 'paris', money: 90000, rep: 4, rel: { mbaye: 4 } }, next: 'oo_goodbye' },
      { t: 'Danube Belgrade: the loudest gym on earth.', hint: 'A big-man club · tough coach', req: { minOverseas: 2 }, fx: { club: 'belgrade', money: 70000, rep: 3 }, next: 'oo_goodbye' },
      { t: 'Bosphorus Istanbul: a starting spot on day one.', hint: 'Mid-table club · big minutes', fx: { club: 'istanbul', money: 60000, trust: 6 }, next: 'oo_goodbye' },
      { t: 'Tokyo Neon Dragons: Pacific Pro League.', hint: 'Fast league · you\'re the star', fx: { club: 'tokyo', money: 55000, trust: 8, fans: 20000 }, next: 'oo_goodbye' },
      { t: 'Sydney Harbour Sharks: Pacific Pro League.', hint: 'Physical league', fx: { club: 'sydney', money: 55000, trust: 6 }, next: 'oo_goodbye' },
    ] },
  oo_goodbye: { scene: 'airport', fx: { flag: 'signed_pro', post: { by: 'ehn', text: '✈️ SIGNED: {name} turns pro with {club}. Straight from high school to the pros.' } },
    lines: [
      ['mom', 'You call me when you land, when you eat, and when you\'re sad.', 'sad'],
      ['nia', 'Twelve granola bars in your bag. Ration them.', 'smile'],
      ['lou', 'Grown men over there will try to break you. Let them try.', 'determined', { notFlag: 'lou_snub' }],
    ], next: 'oo_arrival' },
  oo_arrival: { scene: 'abroad', cutscene: 'c3_abroad', fx: { age: 18 },
    lines: [['narrator', '{clubCity}. A driver holds a sign with your name spelled almost right.']], next: 'oo_lena' },
  oo_lena: { scene: 'abroad',
    lines: [
      ['lena', 'Welcome to {clubCity}! I\'m Lena: translator, landlord, emergency contact.', 'smile'],
      ['lena', 'Rule one: practice at nine means eight-forty. Rule two: never sit in the captain\'s chair.'],
    ],
    choices: [
      { t: '"Teach me the important words first."', fx: { rel: { lena: 6 }, attrs: { iq: 1 } }, next: 'oo_apartment' },
      { t: '"Which one\'s the captain\'s chair?"', fx: { rel: { lena: 4 } }, next: 'oo_apartment' },
    ] },
  oo_apartment: { scene: 'abroad',
    lines: [['narrator', 'Your apartment is the size of your bedroom at home. The shower is also the kitchen.']],
    choices: [
      { t: 'Call Lena for the hundredth time.', fx: { rel: { lena: 3 }, morale: 2 }, next: 'oo_coach' },
      { t: 'Find the street food. Eat what the locals eat.', fx: { morale: 4, attrs: { stam: 1 } }, next: 'oo_coach' },
    ] },
  oo_coach: { scene: 'locker',
    lines: [['ocoach', 'You are eighteen. In this league, eighteen sits.', 'determined'], ['ocoach', 'I don\'t care about highlights. I care if you know where to be.']],
    choices: [
      { t: '"Tell me where to be. I\'ll be there."', fx: { trust: 6, rel: { ocoach: 5 } }, next: 'oo_marko' },
      { t: '"Give me one practice. Then decide."', fx: { trust: 2, morale: 3 }, next: 'oo_marko' },
      { t: '"They didn\'t pay me to sit."', fx: { trust: -6, rel: { ocoach: -5 }, morale: 2 }, next: 'oo_marko' },
    ] },
  oo_marko: { scene: 'gym',
    lines: [['marko', 'So you are the American boy. I have socks older than you.', 'smile'], ['marko', 'Fourteen seasons, three knees. Here, the old men teach the young ones, painfully.']], next: 'oo_practice' },
  oo_practice: { scene: 'gym',
    lines: [['narrator', 'First practice. Marko elbows you on every cut, and nobody calls anything.']],
    choices: [
      { t: 'Elbow him back.', fx: { attrs: { str: 1 }, rel: { marko: 4 }, trust: -2 }, next: 'oo_scrim' },
      { t: 'Beat him with speed instead.', fx: { attrs: { speed: 1 }, rel: { marko: 2 } }, next: 'oo_scrim' },
      { t: 'Ask him how to get through screens.', fx: { attrs: { iq: 1 }, rel: { marko: 8 }, trust: 3 }, next: 'oo_scrim' },
    ] },
  oo_scrim: { type: 'match', us: '@club', them: 'porto', ratingRel: 2, mateRel: 1, moments: 9, level: 'euro', importance: 1,
    title: 'Preseason Friendly', sub: 'Your first game as a pro', win: 'oo_scrim_win', lose: 'oo_scrim_loss' },
  oo_scrim_win: { scene: 'locker', fx: { trust: 4, rep: 2 }, lines: [['marko', 'Not bad, boy. Not good, but not bad.', 'smile']], next: 'oo_language' },
  oo_scrim_loss: { scene: 'locker', fx: { morale: -2 }, lines: [['ocoach', 'Now you know. Everybody here is strong, and everybody is smart.'], ['marko', 'Tomorrow you lift with me. Seven a.m.', 'determined']], next: 'oo_language' },
  oo_language: { scene: 'abroad',
    lines: [['lena', 'You need basketball words at least. Screen, switch, help, run. And "sorry."', 'smile']],
    choices: [
      { t: 'Language app, every night before bed.', fx: { attrs: { iq: 1 }, flag: 'learning_lang', fatigue: 3 }, next: 'oo_kai_news' },
      { t: 'Learn it from teammates. Slang first.', fx: { chem: 6, rel: { marko: 4 }, trust: -1 }, next: 'oo_kai_news' },
    ] },
  oo_kai_news: { scene: 'home', fx: { flag: 'kai_blueridge' },
    lines: [
      ['narrator', 'Two in the morning, Kai FaceTimes you from a Blue Ridge dorm. A shoe deal box sits on the bed.'],
      ['kai', 'Global Showcase in the spring: my Devils against the best young pros. Don\'t miss it.', 'fierce'],
    ], next: 'oo_hub1' },
  oo_hub1: { type: 'hub', title: 'Before the Season', next: 'oo_season', intro: 'The season starts this week. Train, rest, or find a game at the Old Town Plaza Court.' },

  /* ======================= ARC 2: THE UNPAID ARC ======================= */
  oo_season: { type: 'season', then: { champion: 'oo_league_champ', eliminated: 'oo_league_out', missed: 'oo_league_out' },
    season: s => {
      const teams = C3.euroLeague(s), me = teams[0], tough = C3.toughFor(s), rich = C3.richFor(s), others = teams.filter(t => ![me, tough, rich].includes(t)), richStar = (LOCAL_TEAMS[rich].star || {}).name;
      return Object.assign({ id: 'c3_euro', name: `${LOCAL_TEAMS[me].name} Season`, level: 'euro', user: me, teams, mateRating: LOCAL_TEAMS[me].rating - 3,
        schedule: [
          { opp: others[0], key: true, title: 'Pro Debut', home: true, pre: 'oo_debut_pre' },
          { opp: others[1] },
          { opp: others[2], key: true, away: true, title: 'Road Trip', importance: 2, pre: 'oo_road_pre' },
          { opp: others[3] },
          { opp: others[4] || others[0] },
          { opp: tough, key: true, title: 'The Big Man', importance: 2, moments: 11, pre: 'oo_tough_pre', post: { win: 'oo_tough_win', lose: 'oo_tough_loss' } },
          { opp: others[1] },
          { opp: rich, key: true, title: 'The Club That Lowballed You', importance: 2, moments: 11, pre: 'oo_rich_pre', post: { win: 'oo_rich_win', lose: 'oo_rich_loss' },
            revenge: { star: richStar, title: 'HALF PRICE', sub: `${LOCAL_TEAMS[rich].name} · the club that lowballed you` } },
        ],
        interrupts: { 1: 'oo_bench', 2: 'oo_late_pay', 3: 'oo_whispers', 4: 'oo_unpaid', 6: 'c3_kai_pov' },
        playoff: { teams: 4, name: 'League Playoffs', rounds: ['Semifinal', 'League Final'], moments: [11, 12], pre: { 0: 'oo_arc3', 1: 'oo_final_pre' } },
        finalVenue: 'ovs_' + (OVERSEAS_CLUBS[me] ? me : 'paris') }, C3_PACE);
    } },
  oo_debut_pre: { scene: 'arena',
    lines: [['narrator', 'Your pro debut. The home fans have a banner with your face on it.'], ['marko', 'Breathe. The ball is the same, only the men are bigger.', 'smile']],
    choices: [{ t: 'Let\'s go.', fx: { morale: 3 }, next: '@season' }] },
  oo_bench: { scene: 'locker',
    lines: [['ocoach', 'Tonight you start on the bench, because you gamble on defense. Veterans don\'t gamble.', 'determined']],
    choices: [
      { t: 'Ask him for a film session.', fx: { trust: 8, attrs: { iq: 1 }, rel: { ocoach: 6 } }, next: 'oo_bench_ok' },
      { t: 'Be the loudest guy on the bench.', fx: { trust: 4, chem: 6 }, next: 'oo_bench_ok' },
      { t: 'Sulk. Everybody sees it.', fx: { trust: -6, morale: -3 }, next: '@season' },
    ] },
  oo_bench_ok: { scene: 'locker', fx: { flag: 'earned_trust' }, lines: [['ocoach', 'Good. Now I can coach you.', 'smile']], next: '@season' },
  oo_road_pre: { scene: 'arena',
    lines: [['narrator', 'A road game. Flares, drums, a man who screams your name with an extra syllable.'], ['lena', 'Don\'t look at the chants. I will not translate them.', 'smile']], next: '@season' },
  /* foreshadowing: the late paycheck, then the whispers */
  oo_late_pay: { scene: 'locker',
    lines: [
      ['narrator', 'Payday. Your account says the same number it said yesterday.'],
      ['lena', 'The office says the bank is slow this month. The office says that a lot.', 'sad'],
    ], next: '@season' },
  oo_whispers: { scene: 'locker',
    lines: [
      ['narrator', 'The locker room goes quiet when the club president walks through. Then the whispering starts.'],
      ['marko', '(in English, for you) Twenty-two years ago, a club did this to me. Keep your passport close.', 'sad'],
    ],
    choices: [
      { t: 'Ask Marko what happened.', fx: { rel: { marko: 6 }, attrs: { iq: 1 } }, next: '@season' },
      { t: 'Call Priya. Tonight.', fx: { rel: { priya: 4 } }, next: '@season' },
    ] },
  /* the setback (fixed): the club stops paying everyone */
  oo_unpaid: { scene: 'abroad', cutscene: 'c3_unpaid', fx: { flag: 'club_unpaid', post: { by: 'ehn', text: '💸 {club} misses payroll for the third straight month. Players are unpaid.' }, log: 'The club stopped paying everyone.' },
    lines: [['narrator', 'No money, no heat, a fridge with one yogurt in it.']], next: 'oo_unpaid_how' },
  oo_unpaid_how: { type: 'branch', branches: [{ if: { test: 'c3_well' }, next: 'oo_unpaid_well' }], else: 'oo_unpaid_bad' },
  oo_unpaid_well: { scene: 'abroad', fx: { morale: -6, rankBump: -8, rankWhy: 'Unpaid overseas' },
    lines: [['narrator', 'Eighteen a game in a men\'s league, and you\'re eating cereal for dinner.'], ['priya', 'Scouts saw the numbers. A rich club already called, with another lowball.', 'angry']], next: 'oo_choice' },
  oo_unpaid_bad: { scene: 'abroad', fx: { morale: -10, rankBump: -18, rankWhy: 'Unpaid overseas' },
    lines: [['narrator', 'You weren\'t playing well before the money stopped. Now you\'re not sleeping either.'], ['priya', 'Nobody\'s calling. Let\'s fix your game first.', 'sad']], next: 'oo_choice' },
  oo_choice: { scene: 'locker',
    lines: [['marko', 'Some of us stay and play for nothing. For the name on the front.'], ['priya', '(phone) A smaller club will take you on loan. They pay, barely.']],
    choices: [
      { t: 'Stay. Play for the guys, not the paycheck.', fx: { chem: 10, rel: { marko: 10, lena: 4 }, trust: 8, flag: 'unpaid_stayed' }, next: 'oo_stay_unpaid' },
      { t: 'Take the loan move. Keep playing, keep eating.', fx: { money: 4000, flag: 'loan_move', rel: { marko: -2 } }, next: 'oo_loan_pre' },
    ] },
  oo_stay_unpaid: { scene: 'gym',
    lines: [['narrator', 'Practice in winter coats. Marko brings soup from his mother\'s kitchen.'], ['marko', 'This is a team now. Before, it was a payroll.', 'smile']], next: 'oo_wt' },
  oo_loan_pre: { scene: 'arena',
    lines: [['narrator', 'Porto Atlântico. A gym by the harbor and a coach who\'s happy you exist.'], ['narrator', 'Two weeks on loan. Then the league decides what happens to your old club.']], next: 'oo_loan' },
  oo_loan: { type: 'match', us: 'porto', them: 'munich', ratingRel: 2, mateRel: 0, moments: 9, level: 'euro', importance: 1, venue: 'harbor_court',
    title: 'On Loan', sub: 'Porto Atlântico vs Munich Alpen', win: 'oo_loan_back', lose: 'oo_loan_back' },
  oo_loan_back: { scene: 'airport', fx: { trust: 4 },
    lines: [['narrator', 'New owners buy your old club in March and pay everyone back. You fly home to them.'], ['marko', 'The boy returns. Good, I missed being elbowed.', 'smile']], next: 'oo_wt' },
  /* Weapon Training: Scoop finds you after the low */
  oo_wt: { scene: 'gym', cutscene: 'c3_scoop', fx: { unlock: 'weapon_training', rel: { sal: 4 } },
    lines: [
      ['sal', 'Court two, remember? I\'m scouting this league for a client.', 'smile', { flag: 'jelly_met' }],
      ['sal', 'Sal DeLuca. Played here eleven years at five-nine.', 'smile', { notFlag: 'jelly_met' }],
      ['sal', 'Unpaid, cold, homesick: I\'ve been there. We train anyway, mornings.', 'determined', { flag: 'club_unpaid' }],
      ['sal', 'Every night they take your favorite move. So we build you new ones.', 'determined', { notFlag: 'club_unpaid' }],
    ], next: 'oo_jelly_check' },
  oo_jelly_check: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: 'oo_climb' }], else: 'oo_jelly_pre' },
  oo_jelly_pre: { scene: 'gym',
    lines: [['sal', 'You can\'t go through a seven-footer. You go around him.'], ['sal', 'His arm comes up one side. Flick it off the glass on the other.', 'smile']], next: 'oo_jelly_lesson' },
  oo_jelly_lesson: { type: 'flick', scene: 'gym', title: 'MORNING SESSION · THE JELLY', coach: 'sal', reps: 6, need: 2, venue: 'euro_plaza', win: 'oo_jelly_done' },
  oo_jelly_done: { scene: 'gym', fx: { flag: 'jelly', unlock: 'jelly', attrs: { finish: 1 }, xp: 120, log: 'Learned the jelly layup from Sal DeLuca.' },
    lines: [['sal', 'That\'s a jelly. The big men in this league are about to hate you.', 'smile']], next: 'oo_climb' },
  oo_climb: { scene: 'gym', cutscene: 'c3_climb', qteFx: { id: 'push', ok: { trust: 4, attrs: { str: 1 } }, okToast: '💪 +1 Strength, +4 Coach Trust' },
    lines: [['narrator', 'On the fridge, in Sal\'s handwriting: GET BETTER FIRST. GET PAID SECOND.']], next: '@season' },
  oo_tough_pre: { scene: 'arena',
    lines: [
      ['narrator', 'Tonight: the strongest frontcourt in the league. They\'ve waited for the American.'],
      ['marko', 'They will put you on the floor many times. Get up every time.'],
    ], next: '@season' },
  oo_tough_win: { scene: 'locker', fx: { trust: 5, rep: 4, overseas: 1 }, lines: [['narrator', 'You won. Your lip is bleeding and you can\'t lift your arms.'], ['marko', 'They hit you like a man. You played like one.', 'smile']], next: 'oo_tough_after' },
  oo_tough_loss: { scene: 'locker', fx: { morale: -4 }, lines: [['ocoach', 'Two moves are not enough at this level.', 'determined']], next: 'oo_tough_after' },
  oo_tough_after: { type: 'branch', branches: [{ if: { flag: 'club_unpaid' }, next: 'oo_awaken' }], else: 'oo_wt' },   // older saves met Scoop here
  oo_awaken: { scene: 'gym', fx: { evolve: { line: 'Nobody was paying you to get up.', scene: 'rain_night' } },
    lines: [['sal', 'You found a new gear in there. Nobody paid you for it.', 'smile']], next: '@season' },
  /* revenge game: the rich club that tried to sign you cheap */
  oo_rich_pre: { scene: 'arena',
    lines: [
      ['narrator', '{opp}. The club that offered you half. "For the experience."'],
      ['priya', '(text) Their GM is courtside. Make him pay full price.', 'smile'],
    ],
    choices: [
      { t: 'Wave at the GM in warmups.', fx: { morale: 4, rep: 2 }, next: '@season' },
      { t: 'Say nothing. Let the box score talk.', fx: { morale: 3, trust: 2 }, next: '@season' },
    ] },
  oo_rich_win: { scene: 'locker', fx: { flag: 'beat_rich', rep: 5, overseas: 2, rankBump: 12, rankWhy: 'Beat the club that lowballed you' },
    lines: [['priya', 'Their GM just called me with double the offer. I said we\'re busy.', 'smile']], next: '@season' },
  oo_rich_loss: { scene: 'locker', fx: { morale: -3 }, lines: [['marko', 'Rich clubs win in November. We\'ll see in May.', 'determined']], next: '@season' },

  /* ======================= ARC 3: THE CUP ARC ======================= */
  oo_arc3: { scene: 'abroad', fx: { draftStock: 1 },
    lines: [['narrator', 'The league breaks for a week before the playoffs. You fly home for six days.']], next: 'c3_home' },
  /* the fixed high: the derby in front of 15,000 */
  oo_derby2_pre: { scene: 'arena', board: 'DERBY',
    lines: [
      ['narrator', 'Back in {clubCity}. Derby night: riot police outside, flares inside, fifteen thousand standing.'],
      ['lena', 'For one night, this city has two religions. Win.', 'determined'],
      ['marko', 'They didn\'t pay us for four months. We play this one for the city.', 'determined', { flag: 'unpaid_stayed' }],
    ], next: 'oo_derby' },
  oo_derby: { type: 'match', us: '@club', them: '@derby', ratingRel: 3, mateRel: 1, moments: 11, level: 'euro', importance: 3, script: 'c3_derby',
    title: 'The Derby', sub: 'Fifteen thousand · nobody sitting', win: 'oo_derby_win', lose: 'oo_derby_win' },
  oo_derby_win: { scene: 'arena', board: 'DERBY WIN', fx: { flag: 'derby_win', rep: 8, fans: 25000, draftStock: 3, overseas: 2, xp: 200, rankAt: { to: 14, better: true, why: 'Won the derby' }, post: { by: 'courtvision', text: '🔥 Eighteen years old and the king of the derby: {name} takes over in front of 15,000.' } },
    lines: [['narrator', 'They carry you off the floor and somebody hands you a flare. Lena takes it away.'], ['marko', 'Now you are from here, forever. Sorry.', 'smile']], next: 'c3_mend_check' },
  oo_post_derby: { scene: 'arena', lines: [['ocoach', 'Playoffs: same men, bigger stakes. Keep your head.']], next: '@season' },
  oo_final_pre: { scene: 'arena', board: 'LEAGUE FINAL',
    lines: [['narrator', 'The league final. Every seat sold out in four minutes.'], ['marko', 'Fourteen seasons and I never won this. Help an old man.', 'determined']], next: '@season' },
  oo_league_champ: { scene: 'arena', board: 'CHAMPIONS', fx: { flag: 'league_champ', rep: 8, fans: 25000, xp: 200, money: 20000, overseas: 2, draftStock: 3, post: { by: 'courtvision', text: '🏆 Eighteen and a league champion: {name} wins it all with {club}.' } },
    lines: [['narrator', 'Marko lifts you onto his shoulders. A grown man is crying into your jersey.'], ['marko', 'FOURTEEN YEARS! THANK YOU, BOY!', 'smile']], next: 'oo_cup_intro' },
  oo_league_out: { scene: 'locker', fx: { morale: -2 }, lines: [['ocoach', 'Not this year. But you became a professional this season.']], next: 'oo_cup_intro' },
  oo_cup_intro: { scene: 'arena', cutscene: 'c3_eurocup', fx: { draftStock: 1 },
    lines: [['narrator', 'The Continental Cup. Eight clubs, one weekend, one trophy older than your grandmother.']], next: 'oo_cup' },
  oo_cup: { type: 'season', then: { champion: 'oo_cup_champ', eliminated: 'oo_cup_out', missed: 'oo_cup_out' },
    season: s => {
      const me = s.career.club || 'istanbul', field = ['madrid', 'paris', 'belgrade', 'istanbul', 'athens', 'tokyo', 'sydney', 'beijing'].filter(id => id !== me);
      return { id: 'c3_cup', name: 'Continental Cup', level: 'euro', user: me, teams: [me].concat(field.slice(0, 7)), mateRating: LOCAL_TEAMS[me].rating - 3, schedule: [],
        playoff: { teams: 8, userSeed: s.flags.league_champ ? 2 : 5, name: 'Continental Cup', rounds: ['Quarterfinal', 'Final Four', 'Cup Final'], moments: [11, 12, 13], pre: { 2: 'oo_cup_final_pre' } },
        finalVenue: me === 'istanbul' ? 'ovs_madrid' : 'ovs_istanbul' };
    } },
  oo_cup_final_pre: { scene: 'arena',
    lines: [['narrator', 'The Cup Final. Thirty thousand people, and a drum line that hasn\'t stopped in three days.'], ['ocoach', 'Play like you did when nobody knew your name.']], next: '@season' },
  oo_cup_champ: { scene: 'arena', board: 'CUP CHAMPIONS', cutscene: 'c3_champs', fx: { flag: 'cup_champ', rep: 10, fans: 30000, xp: 250, draftStock: 5, overseas: 2, rankAt: { to: 8, better: true, why: 'Continental Cup champions' }, post: { by: 'courtvision', text: '🏆 CONTINENTAL CUP CHAMPIONS! The American teenager {name} brings it home for {club}.' } },
    lines: [['narrator', 'The trophy is heavier than it looks. Marko kisses it, then you, then the trophy again.'], ['tariq', '(video call, 4 a.m. his time) I\'M STILL UP! I\'M STILL UP!', 'smile', { flag: 'tariq_mended' }]], next: 'oo_showcase_pre' },
  oo_cup_out: { scene: 'locker', fx: { morale: -2, xp: 60 }, lines: [['narrator', 'Out of the Cup. The flight home is silent except for Marko\'s snoring.']], next: 'oo_showcase_pre' },
  /* the showdown with Kai: the Global Showcase (a marked revenge game) */
  oo_showcase_pre: { scene: 'arena', cutscene: 'c3_kai',
    lines: [
      ['narrator', 'The Global Showcase. Kai\'s Blue Ridge Devils against the best young pros abroad.'],
      ['kai', 'They benched me this year, first time ever. Not happening tonight.', 'fierce', { flag: 'c3_kai_pov_seen' }],
      ['kai', 'Look at you, Europe made you serious. Too bad, Halsey.', 'smile'],
    ], next: 'oo_showcase' },
  oo_showcase: { type: 'match', us: 'world_select', them: 'blueridge_kai', ratingRel: 2, mateRel: 2, moments: 11, level: 'euro', importance: 2, venue: 'tournament',
    revenge: { id: 'kai', star: 'Kai Sterling', title: 'ROUND FIVE', sub: 'The pros vs Blue Ridge' },
    title: 'Global Showcase', sub: 'World Select vs Blue Ridge', win: 'oo_show_win', lose: 'oo_show_loss' },
  oo_show_win: { scene: 'arena', fx: { draftStock: 3, rep: 5, fans: 12000, flag: 'beat_kai_c3', rankBump: 25, rankWhy: 'Beat Kai Sterling' },
    lines: [['kai', 'Fine, you got better. I\'ll see you on draft night.', 'fierce'], ['dee', '(to her phone) Lottery. Put him in the lottery.', null, { flag: 'saw_dee' }]], next: 'oo_decide' },
  oo_show_loss: { scene: 'arena', fx: { draftStock: 1 },
    lines: [['kai', 'College guy beats the pro. Write that headline down, Halsey.', 'smile']], next: 'oo_decide' },
  oo_decide: { scene: 'home',
    lines: [['priya', 'You can opt into the Draft. Your club wants a buyout, but they\'d let you go.', 'smile'], ['ocoach', 'Stay and you start. Go, and I tell every scout you were mine.']],
    choices: [
      { t: 'Opt into the Draft.', fx: { flag: 'declared', money: -10000, rel: { priya: 5 } }, next: 'c3_declare' },
      { t: 'One more season abroad.', fx: { trust: 8, rel: { ocoach: 6, marko: 4 } }, next: 'oo_stay' },
    ] },
  oo_stay: { scene: 'arena', fx: { ageUp: 1, attrs: { iq: 1, str: 1, perD: 1 }, xp: 250, draftStock: 3, money: 80000, log: 'Played a second season overseas.' },
    lines: [['narrator', 'Year two: you start every game, and Marko retires in your arms.'], ['lena', 'You don\'t need a translator anymore. I\'ll miss being needed.', 'smile']], next: 'oo_stay_end' },
  oo_stay_end: { scene: 'home', fx: { flag: 'declared' }, lines: [['priya', 'First round, maybe the lottery. The buyout is done.', 'smile']], next: 'c3_declare' },

  /* ---------------- older saves only (the earlier Chapter 3) ---------------- */
  oo_homesick: { scene: 'home', lines: [['mom', 'You can always come home, baby. But I don\'t think you want to.', 'smile']],
    choices: [{ t: '"I\'m staying. I\'m getting better every day."', fx: { morale: 4, rel: { mom: 4 } }, next: '@season' }] },
  oo_star_pre: { scene: 'arena', lines: [['narrator', 'Their star has played in this league since he was sixteen.']], next: '@season' },
  oo_trust: { scene: 'locker', fx: { trust: 4 }, lines: [['ocoach', 'Last four games, you knew where to be. So now you start.', 'smile']], next: '@season' },
  oo_derby_pre: { scene: 'arena', lines: [['narrator', 'Derby night. Nobody has sat down since the parking lot.'], ['lena', 'For one night, this city has two religions. Win.', 'determined']], next: '@season' },
});
