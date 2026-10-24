/* =====================================================================
   DATA-STORY-CH3.JS — CHAPTER 3 "The Next Level": the year(s) after high school and the national team summer.
   Three routes, chosen at the end of Chapter 2 (career.path): college (this file), overseas
   (js/data-story-ch3-overseas.js) and the NBL Grind League (js/data-story-ch3-dev.js). All three lead into the Draft.
   World (teams, arenas, people, cinematics): js/data-ch3-world.js.
   Seasons here are built per career: node.season can be a function of the state (your school / club).
   ===================================================================== */
const C3 = {
  /* the conference you play in: power programs if your school is one, mid-majors otherwise */
  confTeams(s) {
    const me = s.career.college || 'metrocc', power = ['blueridge', 'commonwealth', 'tobacco', 'westwood', 'prairie', 'spokane', 'magnolia', 'motorcity'];
    const mid = ['magnolia', 'motorcity', 'gulfcoast', 'desert', 'metrocc', 'bayou', 'granite', 'sierra'];
    const list = (COLLEGES[me] && COLLEGES[me].prestige >= 4 ? power : mid).filter(id => id !== me).slice(0, 7);
    return [me].concat(list);
  },
  strongest(s, not) { return ['blueridge', 'commonwealth', 'tobacco', 'westwood'].find(id => id !== s.career.college && !(not || []).includes(id)); },
};
STORY.chapters.college = {
  title: 'Chapter 3', name: 'The Next Level', start: 'start',
  stage: s => ({ college: 'College', overseas: 'Overseas Pro', grind: 'Grind League' })[s.career.path] || 'College',
  blurb: 'College, overseas or the Grind League — one year to prove you belong in the Draft.',
  board: s => { const t = LOCAL_TEAMS[s.career.path === 'overseas' ? s.career.club : s.career.path === 'grind' ? 'gl_ignition' : s.career.college]; return t ? t.name.toUpperCase() : 'GAME NIGHT'; },   // arena jumbotron in story scenes
  nodes: {
    /* older saves already picked a path in Chapter 2; everyone else decides here, after the national team summer */
    start: { type: 'branch', fx: { age: 18 }, branches: [{ if: { path: 'overseas' }, next: 'oo_start' }, { if: { path: 'grind' }, next: 'gg_start' }, { if: { path: 'college' }, next: 'cc_start' }], else: 'c3_crossroads' },
    c3_crossroads: { scene: 'home', fx: { recruit: true, offers: true },
      lines: [
        ['narrator', 'August. The offer letters cover the kitchen table, and three roads lead out of Halsey Street.'],
        ['nia', 'Every school that saw you in Riga called. Even the ones that never called before.', 'smile', { flag: 'usa_made' }],
        ['nia', 'A couple of schools went quiet after the cut. I wrote their names down for you.', 'sad', { flag: 'usa_cut' }],
        ['priya', 'Priya Shah, agent. Europe wants you, and so does the Grind League. College is the safe road.', null, { minOvr: 54 }],
        ['mom', 'Whatever you pick, baby, pick it for you.'],
      ],
      choices: [
        { t: 'Go to college. Pick from your offers.', hint: 'Season · March Madness · NIL', fx: { path: 'college' }, next: 'cc_start' },
        { t: 'Skip college: sign with a club overseas.', hint: 'Pro money · grown men', req: { minOvr: 54 }, fx: { path: 'overseas', flag: 'path_overseas', money: 25000, rep: 3, post: { by: 'recruit', text: '✈️ {name} is skipping college to turn pro overseas. Bold.' } }, next: 'oo_start' },
        { t: 'Skip college: join the Grind League\'s Ignition program.', hint: 'Develop vs. pros · paid', req: { minStars: 4 }, fx: { path: 'grind', flag: 'path_grind', money: 50000, rep: 3, post: { by: 'recruit', text: '⚙️ {name} signs with the Grind League\'s Ignition program. Straight to the pros.' } }, next: 'gg_start' },
      ] },

    /* ================================================================
       COLLEGE
       ================================================================ */
    cc_start: { scene: 'home', fx: { recruit: true, offers: 'final', log: 'Chapter 3: college.' },
      lines: [
        ['narrator', 'Your letter of intent is due Friday, and the phone won\'t stop ringing.'],
        ['nia', 'Blue Ridge called TWICE — they saw the gold medal.', 'smile', { flag: 'usa_gold' }],
        ['nia', 'Coaches who never called before are calling now. The national team did that.', 'smile', { flag: 'usa_made', notFlag: 'usa_gold' }],
        ['narrator', 'The national team cut you, and some schools stopped calling. You wrote their names down.', null, { flag: 'usa_cut' }],
        ['mom', 'One more decision, baby. Then you just play.'],
      ], next: 'cc_offers_talk' },
    cc_offers_talk: { scene: 'home',
      lines: [
        ['lou', 'Your offer list changed this summer. Look at it again before you sign.', null, { notFlag: 'lou_snub' }],
        ['lou', 'Minutes and a coach who develops guards. Not the logo.', 'determined', { notFlag: 'lou_snub' }],
        ['narrator', 'You spread every letter across the kitchen table.'],
      ], next: 'cc_choose' },
    cc_choose: { type: 'collegeChoice', scene: 'home', next: 'cc_signing',
      lines: [['narrator', 'August 1st. Final answer.']] },
    cc_signing: { scene: 'gym', cutscene: 'c3_signing', fx: { flag: 'signed_nli', rep: 2, post: { by: 'ehn', text: '✍️ SIGNED: {name} is officially a member of {college}.' } },
      lines: [
        ['narrator', 'The ink is dry. You\'re a {nick} now.'],
        ['mom', 'I\'m framing the pen. Don\'t argue.', 'smile'],
      ], next: 'cc_kai_news' },
    cc_kai_news: { scene: 'home', fx: { flag: 'kai_ignition', post: { by: 'kai', text: 'College was never the plan. Grind League Ignition. Getting paid to get better. See you, Halsey.' } },
      lines: [
        ['narrator', 'That night your phone lights up: Kai Sterling decommits from Blue Ridge.'],
        ['nia', 'He\'s skipping college. Grind League Ignition, six figures, a camera crew.', 'smile'],
        ['kai', '(text) Don\'t look so surprised. Somebody had to go straight to the pros.', 'smile'],
        ['kai', '(text) Your school plays Ignition in an exhibition this winter. Circle it.', 'fierce'],
      ], next: 'cc_movein' },
    cc_movein: { scene: 'arena', cutscene: 'c3_campus', fx: { age: 18, money: 200 },
      lines: [
        ['narrator', 'Move-in day. A cinderblock dorm, a lofted bed, and a roommate already asleep.'],
        ['mom', 'Eat one vegetable per week. I\'m begging.', 'smile'],
      ], next: 'cc_roommate' },
    cc_roommate: { scene: 'locker',
      lines: [
        ['rook', 'You\'re the recruit, right? I\'m Danny, the walk-on who made it by diving on everything.', 'smile'],
        ['rook', 'I\'ll guard you in practice every day. Fair warning: I foul.'],
      ],
      choices: [
        { t: '"Good. Foul me hard. I need it."', fx: { rel: { rook: 8 }, attrs: { str: 1 } }, next: 'cc_usa_mate' },
        { t: '"Just don\'t get in my way, walk-on."', fx: { rel: { rook: -8 }, morale: 2 }, next: 'cc_usa_mate' },
        { t: '"Teach me the dining-hall cheat codes and we\'re even."', fx: { rel: { rook: 6 }, fatigue: -5 }, next: 'cc_usa_mate' },
      ] },
    cc_usa_mate: { scene: 'gym',
      lines: [
        ['milo', 'ROOMIE! Okay, teammate — I take what I can get.', 'smile', { college: 'westwood' }],
        ['jet', 'Bro, you came to Commonwealth? We\'re gonna run everybody off the floor.', 'smile', { college: 'commonwealth' }],
        ['okafor', 'You know what this means. Every single lob comes to me.', 'smile', { college: 'tobacco' }],
        ['dre', 'Prairie State, huh? Give-and-go, round two — I kept the timing.', 'smile', { college: 'prairie' }],
        ['narrator', 'The national team group chat is still alive. Jet is at Commonwealth, Malik at Tobacco Road, Milo at Westwood, Dre at Prairie State.'],
        ['narrator', 'Every one of them is on your schedule.'],
      ], next: 'cc_coach' },
    cc_coach: { scene: 'locker',
      lines: [
        ['ccoach', 'I recruited you for what you\'ll be in March, not what you were in high school.'],
        ['ccoach', 'Freshmen here earn minutes in practice. Nobody gets gifted anything.'],
      ],
      choices: [
        { t: '"Then I\'ll earn them. Starting tomorrow."', fx: { trust: 5, rel: { ccoach: 4 } }, next: 'cc_first_practice' },
        { t: '"With respect, I didn\'t come here to sit."', fx: { trust: -3, morale: 3, rel: { ccoach: -3 } }, next: 'cc_first_practice' },
        { t: '"What do you need from me that I\'m not doing?"', fx: { trust: 6, attrs: { iq: 1 }, rel: { ccoach: 5 } }, next: 'cc_first_practice' },
      ] },
    cc_first_practice: { scene: 'gym',
      lines: [
        ['narrator', 'First practice: the seniors are grown men with beards and mortgages. Or close to it.'],
        ['narrator', 'On the first drill you get screened so hard your ears ring.'],
        ['rook', '(helping you up) Welcome to college. It gets worse, then better.', 'smile'],
      ],
      choices: [
        { t: 'Set a harder screen on him next trip.', fx: { attrs: { str: 1 }, trust: 3, chem: -2 }, next: 'cc_class' },
        { t: 'Take the charge on the next drill.', fx: { trust: 4, chem: 3, fatigue: 6 }, next: 'cc_class' },
        { t: 'Hit three straight jumpers over him.', fx: { attrs: { mid: 1 }, rep: 1 }, next: 'cc_class' },
      ] },
    cc_class: { scene: 'home',
      lines: [
        ['advisor', 'Athletes in my office get the same rule: you\'re a student first, or you\'re ineligible second.'],
        ['advisor', 'So. What do you want to study?'],
      ],
      choices: [
        { t: 'Business. "I want to understand my own contracts."', fx: { attrs: { iq: 1 }, flag: 'major_business', fatigue: 4 }, next: 'cc_media_day' },
        { t: 'Kinesiology. "Learn how the body works."', fx: { attrs: { stam: 1 }, flag: 'major_kin' }, next: 'cc_media_day' },
        { t: '"Whatever keeps me eligible."', fx: { flag: 'major_easy', morale: 2, rel: { advisor: -6 } }, next: 'cc_media_day' },
      ] },
    cc_media_day: { scene: 'arena', fx: { fans: 1500 },
      lines: [
        ['narrator', 'Media day. A guy with a ring light asks you to "do something hype."'],
        ['narrator', 'Your face goes up on the jumbotron next to the words FRESHMAN PHENOM.'],
      ],
      choices: [
        { t: 'Point at the camera: "March. Write it down."', fx: { rep: 3, fans: 2000, trust: -2 }, next: 'cc_hub1' },
        { t: '"I\'m just here to work."', fx: { trust: 3 }, next: 'cc_hub1' },
        { t: 'Shout out Halsey Street.', fx: { fans: 1200, rel: { lou: 3, tariq: 3 } }, next: 'cc_hub1' },
      ] },
    cc_hub1: { type: 'hub', title: 'Preseason', next: 'cc_season',
      intro: 'Preseason. Train, rest, or find a run at the Campus Rec Center before the opener.' },
    cc_season: { type: 'season', then: { champion: 'cc_conf_champ', eliminated: 'cc_conf_out', missed: 'cc_conf_out' },
      season: s => {
        const teams = C3.confTeams(s), me = teams[0], top = C3.strongest(s), rival = teams.find(id => ['commonwealth', 'tobacco', 'westwood', 'prairie'].includes(id) && id !== top) || teams[2];
        return { id: 'c3_college', name: `${LOCAL_TEAMS[me].name.replace(/ [A-Z][\w-]+$/, '')} Season`, level: 'college', user: me, teams, mateRating: LOCAL_TEAMS[me].rating - 2,
          schedule: [
            { opp: teams[7], key: true, title: 'Season Opener', pre: 'cc_opener_pre' },
            { opp: teams[6] },
            { opp: top === me ? teams[1] : top, key: true, away: true, title: 'Road Trip', importance: 2, venue: 'col_' + (top === me ? teams[1] : top), pre: 'cc_road_pre', post: { win: 'cc_road_win', lose: 'cc_road_loss' } },
            { opp: 'gl_ignition_kai', key: true, title: 'Exhibition: vs Ignition', importance: 2, moments: 11, venue: 'col_' + me, pre: 'cc_kai_pre', post: { win: 'cc_kai_win', lose: 'cc_kai_loss' } },
            { opp: teams[5] },
            { opp: rival, key: true, title: 'Rivalry Game', importance: 2, pre: 'cc_rival_pre' },
            { opp: teams[4] },
            { opp: teams[3] === rival ? teams[1] : teams[3], key: true, title: 'Top-10 Showdown', importance: 2, pre: 'cc_top5_pre' },
          ],
          interrupts: { 1: 'cc_nil', 4: 'cc_midterms', 5: 'cc_lou_visit', 6: 'cc_homesick' },
          playoff: { teams: 8, name: 'Conference Tournament', rounds: ['Quarterfinal', 'Semifinal', 'Conference Final'], moments: [10, 11, 12], pre: { 2: 'cc_conf_final_pre' } },
          finalVenue: 'nbl_man' };
      } },
    cc_opener_pre: { scene: 'arena',
      lines: [
        ['narrator', 'Opening night: the student section painted your number on their chests. Sixteen of them spell your name.'],
        ['ccoach', 'Breathe and play hard for forty minutes. The rest takes care of itself.'],
      ],
      choices: [{ t: 'Let\'s go.', fx: { morale: 3 }, next: '@season' }] },
    cc_nil: { scene: 'home',
      lines: [
        ['narrator', 'Your inbox has three NIL offers. Everybody wants a piece of the freshman.'],
        ['nia', 'A car dealership, a sneaker shop and an energy drink. I made a spreadsheet.', 'smile'],
      ],
      choices: [
        { t: 'The dealership: cash and a car.', hint: '+Money', fx: { money: 6000, flag: 'nil_car', post: { by: 'fan', text: 'saw {first} {last} on a billboard for a car dealership lmaooo 🚗' } }, next: '@season' },
        { t: 'The local sneaker shop: a collab drop.', hint: '+Fans, +Rep', fx: { money: 2500, fans: 6000, rep: 2, flag: 'nil_shoes' }, next: '@season' },
        { t: 'The energy drink: biggest check.', hint: '+Money, +Fatigue', fx: { money: 9000, fatigue: 10, trust: -2, flag: 'nil_drink' }, next: '@season' },
        { t: 'Turn them all down. Focus.', hint: '+Coach Trust', fx: { trust: 6, morale: 2 }, next: '@season' },
      ] },
    cc_road_pre: { scene: 'arena',
      lines: [['narrator', 'First true road game. Their student section has printed your high school yearbook photo.'], ['rook', 'They found the braces picture. I\'m so sorry.', 'smile']],
      choices: [{ t: 'Block it out.', fx: { morale: 2 }, next: '@season' }, { t: 'Wave at them in warmups.', fx: { morale: 4, rep: 1 }, next: '@season' }] },
    cc_road_win: { scene: 'locker', fx: { rep: 3, trust: 3 }, lines: [['ccoach', 'That\'s how you win on the road. Quiet them early, stay quiet yourself.'], ['narrator', 'The bus ride home is the loudest one all year.']], next: '@season' },
    cc_road_loss: { scene: 'locker', fx: { morale: -3 }, lines: [['ccoach', 'Road games are won in the first five minutes. We lost them.'], ['rook', 'They chanted "OVER-RATED" for an hour. My ears hurt and I didn\'t even play.', 'sad']], next: '@season' },
    cc_kai_pre: { scene: 'arena', cutscene: 'c3_kai',
      lines: [
        ['narrator', 'Exhibition night. Ignition rolls in with a camera crew and Kai in a pair of shoes that aren\'t out yet.'],
        ['kai', 'They pay me to play now, Halsey. You get a meal plan.', 'smile'],
        ['kai', 'Remember Halsey Park? I watch it every night, and tonight I fix it.', 'fierce', { flag: 'beat_kai' }],
      ],
      choices: [
        { t: '"Then quit talking and fix it."', fx: { morale: 4, rel: { kai: -3 } }, next: '@season' },
        { t: '"Nice shoes. Hope they come with defense."', fx: { rep: 2, rel: { kai: -6 } }, next: '@season' },
      ] },
    cc_kai_win: { scene: 'arena', fx: { rep: 6, fans: 8000, draftStock: 2, flag: 'beat_kai_c3', post: { by: 'courtvision', text: '🔥 College freshman {name} outplays Grind League phenom Kai Sterling. The rivalry is BACK.' } },
      lines: [['kai', 'One exhibition. They don\'t count those, Halsey.', 'fierce'], ['narrator', 'Then he walks off without his headphones, and that tells you everything.']], next: 'cc_wt' },
    cc_kai_loss: { scene: 'arena', fx: { morale: -4, post: { by: 'kai', text: 'Exhibition W. Some things don\'t change. 😴' } },
      lines: [['narrator', 'Kai went for 31. Every time you closed out, he was already gone.'], ['kai', 'You\'re good, Halsey. I\'m paid — there\'s a difference.', 'smile']], next: 'cc_wt' },
    /* Weapon Training: Scoop DeLuca after a rough night (unlocks the Mentor tab) */
    cc_wt: { scene: 'gym', fx: { unlock: 'weapon_training', rel: { sal: 4 } },
      lines: [
        ['narrator', 'Midnight, practice gym. You\'re still shooting when the side door opens.'],
        ['sal', 'Kid, remember me from court two? Told you I\'d see you again.', 'smile', { flag: 'jelly_met' }],
        ['sal', 'Sal DeLuca — eleven years overseas, now I fix scorers for a living. Your coach called me.', 'smile', { notFlag: 'jelly_met' }],
        ['sal', 'He took away your two best moves tonight. So you need more than two.'],
        ['sal', 'Six every morning: I teach, you sweat. Deal?', 'determined'],
      ], next: 'cc_jelly_check' },
    cc_jelly_check: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: '@season' }], else: 'cc_jelly_pre' },
    cc_jelly_pre: { scene: 'gym',
      lines: [
        ['sal', 'First lesson: the big man jumps at the ball, so you hide the ball.'],
        ['sal', 'His arm comes up one side, you flick it off the glass on the other. It\'s called a jelly.', 'smile'],
      ], next: 'cc_jelly_lesson' },
    cc_jelly_lesson: { type: 'flick', scene: 'gym', title: 'SIX A.M. · THE JELLY', coach: 'sal', reps: 6, need: 2, venue: 'campus_rec', win: 'cc_jelly_done' },
    cc_jelly_done: { scene: 'gym', fx: { flag: 'jelly', unlock: 'jelly', attrs: { finish: 1 }, xp: 120, log: 'Learned the jelly layup from Sal DeLuca.' },
      lines: [['sal', 'There it is. Every shot blocker in your conference just got a little dumber.', 'smile']], next: '@season' },
    cc_midterms: { scene: 'home',
      lines: [['advisor', 'Midterms are Thursday, the road trip is Wednesday. You see the problem.'], ['narrator', 'Your statistics professor does not care about your rebounding numbers.']],
      choices: [
        { t: 'Study on the bus with Danny.', check: { a: 'iq', dc: 52 }, fx: { attrs: { iq: 1 }, rel: { advisor: 4, rook: 3 }, fatigue: 5 }, failFx: { trust: -4, flag: 'academic_probation' }, next: '@season', fail: 'cc_midterms_fail' },
        { t: 'Ask the advisor for a tutor.', fx: { money: -100, rel: { advisor: 6 }, fatigue: 3 }, next: '@season' },
        { t: 'Wing it.', check: { a: 'clutch', dc: 60 }, fx: { morale: 3 }, failFx: { trust: -6, flag: 'academic_probation' }, next: '@season', fail: 'cc_midterms_fail' },
      ] },
    cc_midterms_fail: { scene: 'home', fx: { morale: -5 },
      lines: [['advisor', 'Academic probation. One more slip and you sit for the tournament.', 'determined'], ['ccoach', 'Fix it, I don\'t care how. Library at seven, every night.', 'angry']], next: '@season' },
    cc_rival_pre: { scene: 'arena',
      lines: [
        ['narrator', 'Rivalry week: somebody spray-painted the other school\'s mascot on the student union. Nobody\'s admitting anything.'],
        ['jet', '(text) Your gym or mine, I\'m dunking on your whole bench.', 'smile', { notCollege: 'commonwealth' }],
      ], next: '@season' },
    cc_lou_visit: { scene: 'arena', fx: { rel: { lou: 6 }, morale: 4 },
      lines: [
        ['narrator', 'Third row, behind the bench, in a Halsey Street hoodie: Lou.', null, { notFlag: 'lou_snub' }],
        ['lou', 'Two buses and a train, kid. Don\'t make me watch you float on defense.', 'smile', { notFlag: 'lou_snub' }],
        ['narrator', 'Tariq is next to him, wearing a Bayside State hat and a huge grin.', null, { flag: 'tariq_eligible' }],
      ], next: '@season' },
    cc_homesick: { scene: 'home',
      lines: [
        ['narrator', 'Sunday night, and the dorm is quiet. You FaceTime home.'],
        ['nia', 'Mom made the big pot of chili and nobody\'s here to eat it. It\'s tragic.', 'smile'],
        ['mom', 'We watch every game and I yell at the TV. The neighbors know your name now.', 'smile'],
      ],
      choices: [
        { t: '"I miss you guys. A lot."', fx: { rel: { mom: 6, nia: 6 }, morale: 4 }, next: '@season' },
        { t: 'Keep it short. Film session at nine.', fx: { attrs: { iq: 1 }, rel: { mom: -3 } }, next: '@season' },
      ] },
    cc_top5_pre: { scene: 'arena', fx: { draftStock: 1 },
      lines: [['narrator', 'A top-ten matchup on national TV. Twelve NBL scouts in the second row.'], ['dee', '(on the broadcast) Keep your eye on the freshman. He\'s why I\'m here.', null, { flag: 'saw_dee' }]], next: '@season' },
    cc_conf_final_pre: { scene: 'arena',
      lines: [['narrator', 'Conference final in the big city. The arena is split down the middle by color.'], ['ccoach', 'Win and we choose our seed. Lose and we hope.']], next: '@season' },
    cc_conf_champ: { scene: 'arena', board: 'CONFERENCE CHAMPS', fx: { flag: 'conf_champ', rep: 5, fans: 6000, draftStock: 2, xp: 120, post: { by: 'courtvision', text: '✂️ {college} cuts down the nets! {name} is the conference tournament MVP.' } },
      lines: [['narrator', 'You cut down a piece of the net. It goes in your wallet and stays there.'], ['rook', 'I got to cut one too! I played four seconds and I\'m framing it!', 'smile']], next: 'cc_selection' },
    cc_conf_out: { scene: 'locker', fx: { morale: -3 },
      lines: [['ccoach', 'We\'re not done. We\'ll find out Sunday if anybody believes in us.'], ['narrator', 'You watch the rest of the tournament from your dorm, sick to your stomach.']], next: 'cc_selection' },
    cc_selection: { scene: 'locker', fx: { marchSeed: true },
      lines: [['narrator', 'Selection Sunday: thirty guys around one TV. Somebody\'s praying out loud.']], next: 'cc_selection_show' },
    cc_selection_show: { scene: 'locker', cutscene: 'c3_selection', fx: { rep: 3, fans: 4000 },
      lines: [['narrator', 'Your school flashes on the screen: seed #{seed}. The locker room explodes.'], ['ccoach', 'Enjoy it tonight. Tomorrow we get to work.', 'smile']], next: 'cc_first_weekend' },
    cc_first_weekend: { scene: 'arena', fx: { xp: 120, fans: 5000, draftStock: 1 },
      lines: [
        ['narrator', 'The first weekend is a blur of hotel ballrooms and buzzer horns. You survive it.'],
        ['narrator', 'Sixteen teams left. Every game is on national TV now.'],
      ], next: 'cc_hub2' },
    cc_hub2: { type: 'hub', title: 'The Sweet 16', next: 'cc_march', intro: 'Sixteen teams left. One more chance to train or rest before the second weekend.' },
    cc_march: { type: 'season', then: { champion: 'cc_title_win', eliminated: 'cc_march_out', missed: 'cc_march_out' },
      season: s => {
        const me = s.career.college || 'metrocc', field = Object.keys(LOCAL_TEAMS).filter(id => LOCAL_TEAMS[id].college && id !== me && id !== 'blueridge_kai');
        return { id: 'c3_march', name: 'March Mayhem', level: 'college', user: me, teams: [me].concat(field.slice(0, 15)), mateRating: LOCAL_TEAMS[me].rating - 2, schedule: [],
          playoff: { teams: 16, userSeed: s.career.marchSeed || 8, name: 'March Mayhem', rounds: ['Sweet 16', 'Elite 8', 'Final Four', 'National Championship'], moments: [11, 11, 12, 13], pre: { 2: 'cc_final_four_pre', 3: 'cc_title_pre' } },
          finalVenue: 'tournament' };
      } },
    cc_final_four_pre: { scene: 'arena', board: 'FINAL FOUR', cutscene: 'c3_bigdance', fx: { draftStock: 2, fans: 8000 },
      lines: [['narrator', 'The Final Four. Your mom is in a hotel ballroom with four hundred other parents, all crying.'], ['ccoach', 'Whatever happens, you belong here. Now go prove it.']], next: '@season' },
    cc_title_pre: { scene: 'arena', board: 'CHAMPIONSHIP',
      lines: [['narrator', 'Monday night, one game. The last one of the college season, for everybody in the country.'], ['rook', 'If we win, I\'m getting a tattoo of you. On my back.', 'smile']], next: '@season' },
    cc_title_win: { scene: 'arena', board: 'NATIONAL CHAMPIONS', cutscene: 'c3_champs', fx: { flag: 'national_champ', rep: 12, fans: 40000, xp: 300, draftStock: 6, money: 500, post: { by: 'courtvision', text: '🏆 NATIONAL CHAMPIONS! {college} wins it all and {name} is the Most Outstanding Player.' } },
      lines: [['narrator', 'Confetti in your mouth, a ladder, a pair of scissors, and the last strand of net.'], ['mom', 'THAT\'S MY BABY! THAT\'S MY BABY!', 'smile'], ['lou', 'Hmph. Not bad, kid.', 'smile', { notFlag: 'lou_snub' }]], next: 'cc_decide' },
    cc_march_out: { scene: 'locker', fx: { morale: -2, xp: 80 },
      lines: [['narrator', 'The buzzer. Your season is over in a locker room that smells like disappointment and Gatorade.'], ['ccoach', 'Hold your head up. You gave this program a March it\'ll remember.']], next: 'cc_decide' },
    cc_decide: { scene: 'home', fx: { draftStock: 1 },
      lines: [
        ['narrator', 'April. A woman in a sharp blazer knocks on your door with a binder.'],
        ['priya', 'Priya Shah — I represent players, not schools. Mock drafts have you in the first round.', 'smile', { minDraft: 8 }],
        ['priya', 'Priya Shah, agent. You\'re a second-round pick today, maybe a first-rounder with another year.', null, { maxDraft: 7 }],
        ['ccoach', 'Whatever you decide, decide it for the right reasons. My door\'s open either way.'],
      ],
      choices: [
        { t: 'Declare for the Draft.', fx: { flag: 'declared', rel: { priya: 5 } }, next: 'c3_declare' },
        { t: 'Stay one more year. Get better first.', fx: { trust: 6, rel: { ccoach: 6 } }, next: 'cc_soph' },
      ] },
    cc_soph: { scene: 'gym', fx: { ageUp: 1, attrs: { iq: 1, three: 1, perD: 1 }, xp: 250, draftStock: 3, log: 'Stayed for a sophomore season.' },
      lines: [
        ['narrator', 'Sophomore year flies by: more minutes, more film, more scouts.'],
        ['narrator', 'You lead the conference in scoring and stop being "the freshman."'],
        ['sal', 'Six every morning, and you never missed one. That\'s the real stat.', 'smile', { flag: 'feat_weapon_training' }],
      ], next: 'cc_soph_end' },
    cc_soph_end: { scene: 'home', fx: { flag: 'declared' },
      lines: [['priya', 'First round now, lottery if the workouts go well. Ready?', 'smile'], ['narrator', 'This time, you don\'t hesitate.']], next: 'c3_declare' },

    /* ================================================================
       ALL ROUTES — declaring for the Draft, chapter end
       ================================================================ */
    c3_declare: { scene: 'arena', cutscene: 'c3_declare', fx: { flag: 'declared', fans: 15000, rep: 4, post: { by: 'ehn', text: '📣 {name} has declared for the NBL Draft.' } },
      lines: [
        ['narrator', 'You read a statement you rewrote nine times. Your voice only cracks once.'],
        ['mom', 'Whatever pick, wherever they send you. We\'re coming.', 'smile'],
        ['kai', '(text) Declared too, Halsey. Let\'s see who goes first.', 'fierce'],
      ], next: 'c3_end' },
    c3_end: { type: 'chapterEnd', nextChapter: 'draft', nextTitle: 'Chapter 4 — The Draft', fx: { develop: 'college' },
      teaser: 'The combine, workouts, and Draft night. (Coming in a later build — your save carries over.)',
      summary: 'You enter the Draft at {ovr} Overall. Draft stock: {draft}.',
      recap: [
        { if: { path: 'college' }, t: '🎓 Played college ball at {college}' },
        { if: { path: 'overseas' }, t: '✈️ Turned pro overseas with {club}' },
        { if: { path: 'grind' }, t: '⚙️ Ground it out in the Grind League' },
        { if: { flag: 'national_champ' }, t: '🏆 National champion' },
        { if: { flag: 'conf_champ' }, t: '✂️ Conference tournament champion' },
        { if: { flag: 'league_champ' }, t: '🏆 League champion' },
        { if: { flag: 'cup_champ' }, t: '🏆 Continental Cup champion' },
        { if: { flag: 'gl_champ' }, t: '🏆 Grind League champion' },
        { if: { flag: 'called_up' }, t: '📞 Called up to the NBL' },
        { if: { flag: 'beat_kai_c3' }, t: '⚔ Beat Kai again' },
        { if: { flag: 'feat_weapon_training' }, t: '🥋 Trained with Sal DeLuca' },
      ] },
  },
};
