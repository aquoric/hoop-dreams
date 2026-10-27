/* =====================================================================
   DATA-STORY-CH3.JS — CHAPTER 3 "The Next Level" (STORY.md, Chapter 3): one year after high school.
   Three roads, picked at the crossroads (career.path): college (this file — junior college at Metro CC when the offers
   are weak), overseas (js/data-story-ch3-overseas.js) and the NBL Grind League (js/data-story-ch3-dev.js).
   Every road: THE DECISION ARC → a setback arc (The New Coach / The Unpaid / The Stolen Call-Up) with foreshadowing,
   played-well and played-badly versions, Weapon Training with Scoop, the awakening, Kai's POV and a revenge game →
   a climax arc (The March / The Cup / The Call-Up) with the Tariq falling out, a Kai showdown, the top-10 push and a
   fixed high. Scenes + scripts: js/data-story-ch3-scenes.js · world: js/data-ch3-world.js · arcs: js/data-arcs.js.
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
const C3_PACE = { autoSim: true, simXp: .9, hubAP: 2 };   // filler games are simmed with a highlights screen; the key games are played

STORY.chapters.college = {
  title: 'Chapter 3', name: 'The Next Level', start: 'start', xpBoost: 1.1,
  stage: s => ({ college: 'College', overseas: 'Overseas Pro', grind: 'Grind League' })[s.career.path] || 'College',
  blurb: 'College, overseas or the Grind League. One year, one setback, one shot at the Draft.',
  board: s => { const t = LOCAL_TEAMS[s.career.path === 'overseas' ? s.career.club : s.career.path === 'grind' ? (s.career.glTeam || 'gl_ignition') : s.career.college]; return t ? t.name.toUpperCase() : 'GAME NIGHT'; },   // arena jumbotron in story scenes
  nodes: {
    /* ======================= ARC 1: THE DECISION ARC ======================= */
    /* older saves already picked a path in Chapter 2; everyone else decides here, after the national team summer */
    start: { type: 'branch', fx: { age: 18 }, branches: [{ if: { path: 'overseas' }, next: 'oo_start' }, { if: { path: 'grind' }, next: 'gg_start' }, { if: { path: 'college' }, next: 'cc_start' }], else: 'c3_crossroads' },
    c3_crossroads: { scene: 'home', fx: { recruit: true, offers: true },
      lines: [
        ['narrator', 'August. Three roads lead out of Halsey Street, and the kitchen table is covered in paper.'],
        ['nia', 'Every school that saw you in Riga called. Even the ones that never called before.', 'smile', { flag: 'usa_made' }],
        ['nia', 'You were on TV in a pro-am all summer. The big schools still didn\'t call.', 'sad', { flag: 'usa_proam' }],
        ['narrator', 'Three letters. Two of them are form letters.', null, { weakOffers: true }],
        ['priya', 'Priya Shah, agent. Europe and the Grind League both want you, and college is the safe road.', null, { minOvr: 54, weakOffers: false }],
        ['dee', '(text) Weak offers aren\'t the end. Juco and the Grind have both made pros.', null, { weakOffers: true, flag: 'saw_dee' }],
        ['mom', 'Whatever you pick, baby, pick it for you.'],
      ],
      choices: [
        { t: 'Go to college. Pick from your offers.', hint: 'Season · March Madness · NIL', req: { weakOffers: false }, fx: { path: 'college' }, next: 'cc_start' },
        { t: 'Junior college: Metro City College.', hint: 'Small gym · every minute is yours · prove them wrong', req: { weakOffers: true }, fx: { path: 'college', college: 'metrocc', flag: ['path_college', 'path_juco'] }, next: 'cc_juco' },
        { t: 'Skip college: sign with a club overseas.', hint: 'Pro money · grown men', req: { minOvr: 54 }, fx: { path: 'overseas', flag: 'path_overseas', money: 25000, rep: 3, post: { by: 'recruit', text: '✈️ {name} is skipping college to turn pro overseas.' } }, next: 'oo_start' },
        { t: 'Skip college: join the Grind League\'s Ignition program.', hint: 'Develop vs. pros · paid', req: { minStars: 4 }, fx: { path: 'grind', flag: 'path_grind', money: 50000, rep: 3, post: { by: 'recruit', text: '⚙️ {name} signs with the Grind League Ignition program.' } }, next: 'gg_start' },
        { t: 'The Grind League: earn a spot at Ignition\'s open tryout.', hint: 'Low pay · grown men · a call-up clause', req: { weakOffers: true, maxStars: 3 }, fx: { path: 'grind', flag: ['path_grind', 'gl_walkon'], money: 30000, rep: 1, post: { by: 'recruit', text: '⚙️ Overlooked {name} walks on at the Grind League.' } }, next: 'gg_start' },
      ] },

    /* ---------------- COLLEGE: signing day ---------------- */
    cc_start: { scene: 'home', fx: { recruit: true, offers: 'final', log: 'Chapter 3: college.' },
      lines: [
        ['narrator', 'Your letter of intent is due Friday. The phone won\'t stop ringing.'],
        ['nia', 'Blue Ridge called TWICE. They saw the gold medal.', 'smile', { flag: 'usa_gold' }],
        ['nia', 'Coaches who never called before are calling now. The national team did that.', 'smile', { flag: 'usa_made', notFlag: 'usa_gold' }],
        ['mom', 'One more decision, baby. Then you just play.'],
      ], next: 'cc_offers_talk' },
    cc_offers_talk: { scene: 'home',
      lines: [
        ['lou', 'Minutes and a coach who develops guards. Not the logo.', 'determined', { notFlag: 'lou_snub' }],
        ['narrator', 'You spread every letter across the kitchen table.'],
      ], next: 'cc_choose' },
    cc_choose: { type: 'collegeChoice', scene: 'home', next: 'cc_signing',
      lines: [['narrator', 'August 1st. Final answer.']] },
    /* junior college: the weak-offers road */
    cc_juco: { scene: 'gym', fx: { log: 'Chapter 3: junior college at Metro City College.' },
      lines: [
        ['narrator', 'Metro City College. A commuter campus, a gym with a bucket under the leak.'],
        ['ccoach', 'Every kid in here got passed over. That\'s the whole recruiting pitch.'],
        ['lou', 'Juco built half the guards I ever respected. Go take it.', 'determined', { notFlag: 'lou_snub' }],
      ], next: 'cc_signing' },
    cc_signing: { scene: 'gym', cutscene: 'c3_signing', fx: { flag: 'signed_nli', rep: 2, post: { by: 'ehn', text: '✍️ SIGNED: {name} is officially a member of {college}.' } },
      lines: [
        ['narrator', 'The ink is dry. You\'re a {nick} now.'],
        ['narrator', 'No camera crew. Just Mom, Nia, and a guy from the local paper.', null, { college: 'metrocc' }],
        ['mom', 'I\'m framing the pen. Don\'t argue.', 'smile'],
      ], next: 'cc_kai_news' },
    cc_kai_news: { scene: 'home', fx: { flag: 'kai_ignition', post: { by: 'kai', text: 'College was never the plan. Grind League Ignition. Getting paid to get better. See you, Halsey.' } },
      lines: [
        ['narrator', 'That night your phone lights up: Kai Sterling decommits from Blue Ridge.'],
        ['nia', 'He\'s skipping college. Grind League Ignition, six figures, a camera crew.'],
        ['kai', '(text) Somebody had to go straight to the pros. See you in March.', 'smile'],
      ], next: 'cc_movein' },
    cc_movein: { scene: 'arena', cutscene: 'c3_campus', fx: { age: 18, money: 200 },
      lines: [
        ['narrator', 'Move-in day. A cinderblock dorm, a lofted bed, a roommate already asleep.'],
        ['narrator', 'No dorm at Metro. You take two buses to campus and one to the gym.', null, { college: 'metrocc' }],
        ['mom', 'Eat one vegetable per week. I\'m begging.', 'smile'],
      ], next: 'cc_roommate' },
    cc_roommate: { scene: 'locker',
      lines: [
        ['rook', 'I\'m Danny, the walk-on who made it by diving on everything.', 'smile'],
        ['rook', 'I\'ll guard you in practice every day. Fair warning: I foul.'],
      ],
      choices: [
        { t: '"Good. Foul me hard. I need it."', fx: { rel: { rook: 8 }, attrs: { str: 1 } }, next: 'cc_usa_mate' },
        { t: '"Just don\'t get in my way, walk-on."', fx: { rel: { rook: -8 }, morale: 2 }, next: 'cc_usa_mate' },
        { t: '"Teach me the dining-hall cheat codes."', fx: { rel: { rook: 6 }, fatigue: -5 }, next: 'cc_usa_mate' },
      ] },
    cc_usa_mate: { scene: 'gym',
      lines: [
        ['milo', 'ROOMIE! Okay, teammate, I take what I can get.', 'smile', { college: 'westwood' }],
        ['jet', 'Bro, you came to Commonwealth? We\'re running everybody off the floor.', 'smile', { college: 'commonwealth' }],
        ['okafor', 'You know what this means. Every lob comes to me.', 'smile', { college: 'tobacco' }],
        ['dre', 'Prairie State, huh? Give-and-go, round two.', 'smile', { college: 'prairie' }],
        ['narrator', 'The national team chat is still alive. Every one of them is on your schedule.', null, { flag: 'usa_made' }],
      ], next: 'cc_coach' },
    cc_coach: { scene: 'locker',
      lines: [
        ['ccoach', 'I recruited you for what you\'ll be in March. Not what you were in high school.'],
        ['ccoach', 'Freshmen earn minutes in practice. Nobody gets gifted anything.'],
      ],
      choices: [
        { t: '"Then I\'ll earn them. Starting tomorrow."', fx: { trust: 5, rel: { ccoach: 4 } }, next: 'cc_first_practice' },
        { t: '"With respect, I didn\'t come here to sit."', fx: { trust: -3, morale: 3, rel: { ccoach: -3 } }, next: 'cc_first_practice' },
        { t: '"What do you need from me that I\'m not doing?"', fx: { trust: 6, attrs: { iq: 1 }, rel: { ccoach: 5 } }, next: 'cc_first_practice' },
      ] },
    cc_first_practice: { scene: 'gym',
      lines: [
        ['narrator', 'First practice. The seniors are grown men with beards and car payments.'],
        ['rook', '(helping you up) Welcome to college. It gets worse, then better.', 'smile'],
      ],
      choices: [
        { t: 'Set a harder screen on him next trip.', fx: { attrs: { str: 1 }, trust: 3, chem: -2 }, next: 'cc_class' },
        { t: 'Take the charge on the next drill.', fx: { trust: 4, chem: 3, fatigue: 6 }, next: 'cc_class' },
        { t: 'Hit three straight jumpers over him.', fx: { attrs: { mid: 1 }, rep: 1 }, next: 'cc_class' },
      ] },
    cc_class: { scene: 'home',
      lines: [['advisor', 'You\'re a student first, or you\'re ineligible second. What do you want to study?']],
      choices: [
        { t: 'Business. "I want to understand my own contracts."', fx: { attrs: { iq: 1 }, flag: 'major_business', fatigue: 4 }, next: 'cc_media_day' },
        { t: 'Kinesiology. "Learn how the body works."', fx: { attrs: { stam: 1 }, flag: 'major_kin' }, next: 'cc_media_day' },
        { t: '"Whatever keeps me eligible."', fx: { flag: 'major_easy', morale: 2, rel: { advisor: -6 } }, next: 'cc_media_day' },
      ] },
    cc_media_day: { scene: 'arena', fx: { fans: 1500 },
      lines: [['narrator', 'Media day. Your face goes up on the jumbotron next to the words FRESHMAN PHENOM.']],
      choices: [
        { t: 'Point at the camera: "March. Write it down."', fx: { rep: 3, fans: 2000, trust: -2 }, next: 'cc_hub1' },
        { t: '"I\'m just here to work."', fx: { trust: 3 }, next: 'cc_hub1' },
        { t: 'Shout out Halsey Street.', fx: { fans: 1200, rel: { lou: 3, tariq: 3 } }, next: 'cc_hub1' },
      ] },
    cc_hub1: { type: 'hub', title: 'Preseason', next: 'cc_season',
      intro: 'Preseason. Train, rest, or find a run at the Campus Rec Center before the opener.' },

    /* ======================= ARC 2: THE NEW COACH ARC ======================= */
    cc_season: { type: 'season', then: { champion: 'cc_conf_champ', eliminated: 'cc_conf_out', missed: 'cc_conf_out' },
      season: s => {
        const teams = C3.confTeams(s), me = teams[0], top = C3.strongest(s), old = C3.oldCoachTo(s), road = top === me ? teams[1] : top;
        const rival = teams.find(id => ['commonwealth', 'tobacco', 'westwood', 'prairie', 'magnolia', 'motorcity'].includes(id) && ![me, road, old].includes(id)) || teams[2];
        const rest = teams.filter(id => ![me, road, old, rival].includes(id)), oldStar = (LOCAL_TEAMS[old].star || {}).name;
        return Object.assign({ id: 'c3_college', name: `${LOCAL_TEAMS[me].name.replace(/ [A-Z][\w-]+$/, '')} Season`, level: 'college', user: me, teams, mateRating: LOCAL_TEAMS[me].rating - 2,
          schedule: [
            { opp: rest[0], key: true, title: 'Season Opener', pre: 'cc_opener_pre' },
            { opp: rest[1] },
            { opp: road, key: true, away: true, title: 'Road Trip', importance: 2, venue: 'col_' + road, pre: 'cc_road_pre', post: { win: 'cc_road_win', lose: 'cc_road_loss' } },
            { opp: rest[2] },
            { opp: rest[3] || rest[0] },
            { opp: rival, key: true, title: 'Rivalry Game', importance: 2, pre: 'cc_rival_pre' },
            { opp: rest[1] },
            { opp: old, key: true, title: 'The Coach Who Left', importance: 2, moments: 11, pre: 'cc_oldcoach_pre', post: { win: 'cc_oldcoach_win', lose: 'cc_oldcoach_loss' },
              revenge: { id: 'ccoach', star: oldStar, title: 'THE COACH WHO LEFT', sub: `${LOCAL_TEAMS[old].name} · his new school` } },
          ],
          interrupts: { 1: 'cc_nil', 2: 'cc_phone', 3: 'cc_news', 4: 'cc_fired', 5: 'cc_squad_pre', 6: 'c3_kai_pov' },
          playoff: { teams: 8, name: 'Conference Tournament', rounds: ['Quarterfinal', 'Semifinal', 'Conference Final'], moments: [10, 11, 12], pre: { 0: 'cc_march_open', 2: 'cc_conf_final_pre' } },
          finalVenue: 'nbl_man' }, C3_PACE);
      } },
    cc_opener_pre: { scene: 'arena',
      lines: [
        ['narrator', 'Opening night. Sixteen kids in the student section spell your name on their chests.'],
        ['narrator', 'Opening night at Metro: four hundred people, and all of them know your mom.', null, { college: 'metrocc' }],
        ['ccoach', 'Breathe and play hard for forty minutes. The rest takes care of itself.'],
      ],
      choices: [{ t: 'Let\'s go.', fx: { morale: 3 }, next: '@season' }] },
    cc_nil: { scene: 'home',
      lines: [['nia', 'Three NIL offers: a car dealership, a sneaker shop and an energy drink. I made a spreadsheet.', 'smile']],
      choices: [
        { t: 'The dealership: cash and a car.', hint: '+Money', fx: { money: 6000, flag: 'nil_car', post: { by: 'fan', text: 'saw {first} {last} on a billboard for a car dealership lmaooo 🚗' } }, next: '@season' },
        { t: 'The local sneaker shop: a collab drop.', hint: '+Fans, +Rep', fx: { money: 2500, fans: 6000, rep: 2, flag: 'nil_shoes' }, next: '@season' },
        { t: 'Turn them all down. Focus.', hint: '+Coach Trust', fx: { trust: 6, morale: 2 }, next: '@season' },
      ] },
    cc_road_pre: { scene: 'arena',
      lines: [['narrator', 'First true road game. Their student section printed your yearbook photo.'], ['rook', 'They found the braces picture. I\'m so sorry.', 'smile']],
      choices: [{ t: 'Block it out.', fx: { morale: 2 }, next: '@season' }, { t: 'Wave at them in warmups.', fx: { morale: 4, rep: 1 }, next: '@season' }] },
    cc_road_win: { scene: 'locker', fx: { rep: 3, trust: 3 }, lines: [['ccoach', 'That\'s how you win on the road. Quiet them early.']], next: '@season' },
    cc_road_loss: { scene: 'locker', fx: { morale: -3 }, lines: [['ccoach', 'Road games are won in the first five minutes. We lost them.']], next: '@season' },
    /* foreshadowing: the closed door, then the news */
    cc_phone: { scene: 'locker',
      lines: [
        ['narrator', 'Film session, 7 a.m. Coach\'s office door is shut. He\'s on the phone, yelling, then whispering.'],
        ['ccoach', '(through the door) I don\'t know how much he gave them. I never touched it.', 'angry'],
        ['rook', 'That\'s the third time this week. Something\'s up.', 'sad'],
      ], next: '@season' },
    cc_news: { scene: 'home',
      lines: [
        ['narrator', 'The evening news: a booster, a duffel bag of cash, and your school\'s logo behind the anchor.'],
        ['nia', '(text) Is your coach in trouble?? It\'s on every channel.'],
      ],
      choices: [
        { t: 'Text back: "Not my business. I just play."', fx: { morale: 2 }, next: '@season' },
        { t: 'Knock on Coach\'s door tomorrow.', fx: { rel: { ccoach: 4 }, trust: 2 }, next: '@season' },
      ] },
    /* the setback (fixed): the coach is fired live on TV, the new coach benches you */
    cc_fired: { scene: 'locker', cutscene: 'c3_fired', fx: { flag: 'coach_fired', post: { by: 'ehn', text: '🚨 {college} fires its head coach amid a booster investigation. Rick Vance takes over.' }, log: 'Your coach was fired. The new coach benched you.' },
      lines: [['narrator', 'Coach Vance\'s first practice: his transfers get the pinnies. You get a towel.']], next: 'cc_fired_how' },
    cc_fired_how: { type: 'branch', branches: [{ if: { test: 'c3_well' }, next: 'cc_benched_well' }], else: 'cc_benched_bad' },
    cc_benched_well: { scene: 'locker', fx: { set: { trust: 30 }, morale: -6, rankBump: -8, rankWhy: 'Benched by the new coach' },
      lines: [
        ['narrator', 'Twenty a game, and he still sat you.'],
        ['vance', 'Stats aren\'t trust. You don\'t know my system.'],
        ['dee', '(text) Scouts saw the numbers. Keep your head down and keep working.', null, { flag: 'saw_dee' }],
      ], next: 'cc_wt' },
    cc_benched_bad: { scene: 'locker', fx: { set: { trust: 20 }, morale: -10, rankBump: -18, rankWhy: 'Benched by the new coach' },
      lines: [
        ['narrator', 'You disappeared when it mattered. The new coach noticed first.'],
        ['vance', 'I watched your film. I\'ve seen enough of it.'],
      ], next: 'cc_wt' },
    /* Weapon Training: Scoop after the low (unlocks the Mentor tab) */
    cc_wt: { scene: 'gym', cutscene: 'c3_scoop', fx: { unlock: 'weapon_training', rel: { sal: 4 } },
      lines: [
        ['sal', 'Court two, remember? Told you I\'d see you again.', 'smile', { flag: 'jelly_met' }],
        ['sal', 'Sal DeLuca, eleven years overseas at five-nine. I fix scorers.', 'smile', { notFlag: 'jelly_met' }],
        ['sal', 'Your new coach doesn\'t know you yet. So we make you impossible to sit.', 'determined', { flag: 'coach_fired' }],
        ['sal', 'He took away your two best moves tonight. So you need more than two.', 'determined', { notFlag: 'coach_fired' }],
      ], next: 'cc_jelly_check' },
    cc_jelly_check: { type: 'branch', branches: [{ if: { flag: 'jelly' }, next: 'cc_climb' }], else: 'cc_jelly_pre' },
    cc_jelly_pre: { scene: 'gym',
      lines: [['sal', 'First lesson: the big man jumps at the ball. So you hide the ball.'], ['sal', 'His arm comes up one side, you flick it off the glass on the other.', 'smile']], next: 'cc_jelly_lesson' },
    cc_jelly_lesson: { type: 'flick', scene: 'gym', title: 'SIX A.M. · THE JELLY', coach: 'sal', reps: 6, need: 2, venue: 'campus_rec', win: 'cc_jelly_done' },
    cc_jelly_done: { scene: 'gym', fx: { flag: 'jelly', unlock: 'jelly', attrs: { finish: 1 }, xp: 120, log: 'Learned the jelly layup from Sal DeLuca.' },
      lines: [['sal', 'There it is. Every shot blocker in your conference just got dumber.', 'smile']], next: 'cc_climb' },
    cc_climb: { scene: 'gym', cutscene: 'c3_climb', qteFx: { id: 'push', ok: { trust: 4, attrs: { iq: 1 } }, okToast: '💪 +1 Basketball IQ, +4 Coach Trust' },
      lines: [['narrator', 'Goal on the whiteboard in Sal\'s handwriting: WIN YOUR SPOT BACK.']], next: '@season' },
    /* redemption: practice-squad games against the starters, the trust gauge, the awakening */
    cc_squad_pre: { scene: 'gym',
      lines: [
        ['vance', 'Scout team versus my starters, ten minutes. Show me something I can use.'],
        ['rook', 'We\'re the scout team, we\'re SUPPOSED to lose. Let\'s not.', 'smile'],
      ], next: 'cc_squad' },
    cc_squad: { type: 'match', us: 'c3_scout', them: 'c3_first', ratingRel: 2, mateRel: -2, moments: 7, level: 'college', importance: 1, venue: 'campus_rec',
      title: 'Practice Squad', sub: 'Scout team vs Vance\'s starters', win: 'cc_squad_win', lose: 'cc_squad_loss' },
    cc_squad_win: { scene: 'gym', fx: { trust: 22, flag: 'squad_won' }, lines: [['vance', '…Run that again. Same five.'], ['narrator', 'He writes your name on the whiteboard. Second string, for now.']], next: 'cc_awaken' },
    cc_squad_loss: { scene: 'gym', fx: { trust: 10 }, lines: [['vance', 'You lost, but you didn\'t quit. Tomorrow, same time.']], next: 'cc_awaken' },
    cc_awaken: { scene: 'gym', fx: { evolve: { line: 'Most guys transfer here.', scene: 'gym' } },
      lines: [
        ['sal', 'That move in the scout game? I never taught you that, you found it.', 'smile'],
        ['vance', 'Saturday you play. Earn the next one.', null, { minTrust: 45 }],
        ['vance', 'You\'re closer. Not there.', null, { maxTrust: 44 }],
      ], next: '@season' },
    cc_rival_pre: { scene: 'arena',
      lines: [['narrator', 'Rivalry week. Somebody spray-painted their mascot on the student union.'], ['jet', '(text) Your gym or mine, I\'m dunking on your whole bench.', 'smile', { notCollege: 'commonwealth', flag: 'usa_made' }]], next: '@season' },
    /* revenge game: your old coach's new school */
    cc_oldcoach_pre: { scene: 'arena',
      lines: [
        ['narrator', 'Two weeks after the firing, your old coach took an assistant job. At {opp}.'],
        ['ccoach', '(at center court) No hard feelings, kid. Play well, just not tonight.'],
      ],
      choices: [
        { t: 'Shake his hand. Then go to work.', fx: { morale: 3, rel: { ccoach: 3 } }, next: '@season' },
        { t: '"You left without a word. I won\'t."', fx: { morale: 5, rel: { ccoach: -5 } }, next: '@season' },
      ] },
    cc_oldcoach_win: { scene: 'arena', fx: { flag: 'beat_oldcoach', rep: 4, trust: 8, rankBump: 12, rankWhy: 'Beat your old coach' },
      lines: [['ccoach', '(at the handshake) Good. I recruited the right kid.', 'smile'], ['vance', 'You start the tournament. Don\'t make me regret it.']], next: '@season' },
    cc_oldcoach_loss: { scene: 'arena', fx: { morale: -4, trust: 3 }, lines: [['ccoach', 'March is a different season, kid. Go get it.']], next: '@season' },

    /* ======================= ARC 3: THE MARCH ARC ======================= */
    cc_march_open: { scene: 'arena', fx: { draftStock: 1 },
      lines: [['narrator', 'March, and one week off before the conference tournament. You take the bus home.']], next: 'c3_home' },
    /* the showdown with Kai: an exhibition against Ignition (a marked revenge game) */
    cc_kai_show_pre: { scene: 'arena', cutscene: 'c3_kai',
      lines: [
        ['narrator', 'A charity exhibition before the tournament: your school against Grind League Ignition.'],
        ['kai', 'They benched me in January, you heard? Nobody benches me twice.', 'fierce', { flag: 'c3_kai_pov_seen' }],
        ['kai', 'You get a meal plan, I get a paycheck. Let\'s see who\'s better.', 'smile'],
      ], next: 'cc_kai_show' },
    cc_kai_show: { type: 'match', us: '@college', them: 'gl_ignition_kai', ratingRel: 2, mateRel: 1, moments: 11, level: 'college', importance: 2, title: 'Exhibition', sub: 'vs Ignition · Kai Sterling',
      revenge: { id: 'kai', star: 'Kai Sterling', title: 'ROUND FIVE', sub: 'College vs the Grind' }, win: 'cc_kai_show_win', lose: 'cc_kai_show_loss' },
    cc_kai_show_win: { scene: 'arena', fx: { flag: 'beat_kai_c3', rep: 6, fans: 8000, draftStock: 2, rankBump: 25, rankWhy: 'Beat Kai Sterling', post: { by: 'courtvision', text: '🔥 College freshman {name} outplays Grind League phenom Kai Sterling. The rivalry is BACK.' } },
      lines: [['kai', 'One exhibition. They don\'t count those, Halsey.', 'fierce'], ['narrator', 'He walks off without his headphones. That tells you everything.']], next: '@season' },
    cc_kai_show_loss: { scene: 'arena', fx: { morale: -4, post: { by: 'kai', text: 'Exhibition W. Some things don\'t change. 😴' } },
      lines: [['narrator', 'Kai went for 31. Every time you closed out, he was already gone.'], ['kai', 'You\'re good, Halsey. I\'m paid, and there\'s a difference.', 'smile']], next: '@season' },
    cc_conf_final_pre: { scene: 'arena',
      lines: [['narrator', 'Conference final in the big city. The arena is split down the middle by color.'], ['vance', 'Win and we choose our seed. Lose and we hope.']], next: '@season' },
    cc_conf_champ: { scene: 'arena', board: 'CONFERENCE CHAMPS', fx: { flag: 'conf_champ', rep: 5, fans: 6000, draftStock: 2, xp: 120, post: { by: 'courtvision', text: '✂️ {college} cuts down the nets! {name} is the conference tournament MVP.' } },
      lines: [['narrator', 'You cut down a piece of the net. It goes in your wallet and stays there.'], ['rook', 'I played four seconds and I\'m framing my piece!', 'smile']], next: 'cc_selection' },
    cc_conf_out: { scene: 'locker', fx: { morale: -3 },
      lines: [['vance', 'We find out Sunday if anybody believes in us.'], ['narrator', 'You watch the rest of the tournament from your room, sick to your stomach.']], next: 'cc_selection' },
    cc_selection: { scene: 'locker', fx: { marchSeed: true },
      lines: [['narrator', 'Selection Sunday: thirty guys around one TV. Somebody\'s praying out loud.']], next: 'cc_selection_show' },
    cc_selection_show: { scene: 'locker', cutscene: 'c3_selection', fx: { rep: 3, fans: 4000 },
      lines: [['narrator', 'Your school flashes on the screen: seed #{seed}. The locker room explodes.'], ['narrator', 'A juco in the Big Dance. Every bracket in America just broke a little.', null, { college: 'metrocc' }]], next: 'cc_first_weekend' },
    cc_first_weekend: { scene: 'arena', fx: { xp: 120, fans: 5000, draftStock: 1 },
      lines: [['narrator', 'The first weekend is a blur of hotel ballrooms and buzzer horns. You survive it.'], ['narrator', 'Sweet 16. Next up: the No. 1 team in the country.']], next: 'cc_upset_pre' },
    /* the fixed high: knocking off No. 1 */
    cc_upset_pre: { scene: 'arena', board: 'SWEET 16',
      lines: [
        ['narrator', 'They\'re 34-1. Their coach already booked the Final Four hotel.'],
        ['lou', '(text) Third row, kid, two buses and a plane. Don\'t make me watch you float.', null, { notFlag: 'lou_snub' }],
        ['vance', 'Every expert in America picked them. Good, nobody in here is an expert.', 'determined'],
      ], next: 'cc_upset' },
    cc_upset: { type: 'match', us: '@college', them: '@no1', ratingRel: 3, mateRel: 1, moments: 11, level: 'college', importance: 3, script: 'c3_upset', venue: 'tournament',
      title: 'March Mayhem', sub: 'Sweet 16 · vs the No. 1 team in the country', win: 'cc_upset_win', lose: 'cc_upset_win' },
    cc_upset_win: { scene: 'arena', board: 'UPSET', fx: { flag: 'beat_no1', rep: 8, fans: 20000, draftStock: 3, xp: 200, rankAt: { to: 14, better: true, why: 'Knocked off No. 1' }, post: { by: 'courtvision', text: '🚨 NO. 1 IS DOWN. {name} and {college} bust every bracket in America.' } },
      lines: [['narrator', 'Your phone has 412 notifications. One of them is from Kai.'], ['kai', '(text) Lucky. Do it again.', 'fierce']], next: 'c3_mend_check' },
    cc_hub2: { type: 'hub', title: 'The Elite 8', next: 'cc_march', intro: 'Eight teams left. One more chance to train or rest before the regional final.' },
    cc_march: { type: 'season', then: { champion: 'cc_title_win', eliminated: 'cc_march_out', missed: 'cc_march_out' },
      season: s => {
        const me = s.career.college || 'metrocc', no1 = C3.number1(s), field = Object.keys(LOCAL_TEAMS).filter(id => LOCAL_TEAMS[id].college && ![me, no1, 'blueridge_kai'].includes(id));
        return { id: 'c3_march', name: 'March Mayhem', level: 'college', user: me, teams: [me].concat(field.slice(0, 7)), mateRating: LOCAL_TEAMS[me].rating - 2, schedule: [],
          playoff: { teams: 8, userSeed: Math.min(4, s.career.marchSeed || 4), name: 'March Mayhem', rounds: ['Elite 8', 'Final Four', 'National Championship'], moments: [11, 12, 13], pre: { 1: 'cc_final_four_pre', 2: 'cc_title_pre' } },
          finalVenue: 'tournament' };
      } },
    cc_final_four_pre: { scene: 'arena', board: 'FINAL FOUR', cutscene: 'c3_bigdance', fx: { draftStock: 2, fans: 8000 },
      lines: [['narrator', 'The Final Four. Your mom is in a hotel ballroom with four hundred parents, all crying.'], ['vance', 'Whatever happens, you belong here. Prove it.']], next: '@season' },
    cc_title_pre: { scene: 'arena', board: 'CHAMPIONSHIP',
      lines: [['narrator', 'Monday night. One game left in the whole country.'], ['rook', 'If we win, I\'m getting a tattoo of you. On my back.', 'smile']], next: '@season' },
    cc_title_win: { scene: 'arena', board: 'NATIONAL CHAMPIONS', cutscene: 'c3_champs', fx: { flag: 'national_champ', rep: 12, fans: 40000, xp: 300, draftStock: 6, money: 500, rankAt: { to: 8, better: true, why: 'National champions' }, post: { by: 'courtvision', text: '🏆 NATIONAL CHAMPIONS! {college} wins it all and {name} is the Most Outstanding Player.' } },
      lines: [['narrator', 'Confetti in your mouth, a ladder, and the last strand of net.'], ['mom', 'THAT\'S MY BABY! THAT\'S MY BABY!', 'smile'], ['tariq', '(in the stands, screaming) THAT\'S MY BROTHER!', 'smile', { flag: 'tariq_mended' }]], next: 'cc_decide' },
    cc_march_out: { scene: 'locker', fx: { morale: -2, xp: 80 },
      lines: [['narrator', 'The buzzer. Your season ends in a locker room that smells like Gatorade.'], ['vance', 'Hold your head up. You gave this place a March it\'ll remember.']], next: 'cc_decide' },
    cc_decide: { scene: 'home', fx: { draftStock: 1 },
      lines: [
        ['priya', 'Priya Shah, agent. Mock drafts have you in the first round.', 'smile', { minDraft: 8 }],
        ['priya', 'Priya Shah, agent. Second round today, maybe first with another year.', null, { maxDraft: 7 }],
        ['narrator', 'Juco to the Draft. Nobody at Metro has ever done it.', null, { college: 'metrocc' }],
      ],
      choices: [
        { t: 'Declare for the Draft.', fx: { flag: 'declared', rel: { priya: 5 } }, next: 'c3_declare' },
        { t: 'Stay one more year. Get better first.', fx: { trust: 6, rel: { ccoach: 6 } }, next: 'cc_soph' },
      ] },
    cc_soph: { scene: 'gym', fx: { ageUp: 1, attrs: { iq: 1, three: 1, perD: 1 }, xp: 250, draftStock: 3, log: 'Stayed for a sophomore season.' },
      lines: [['narrator', 'Sophomore year flies by: more minutes, more film, more scouts.'], ['sal', 'Six every morning, and you never missed one. That\'s the real stat.', 'smile', { flag: 'feat_weapon_training' }]], next: 'cc_soph_end' },
    cc_soph_end: { scene: 'home', fx: { flag: 'declared' },
      lines: [['priya', 'First round now, lottery if the workouts go well. Ready?', 'smile']], next: 'c3_declare' },

    /* ======================= EVERY ROAD ======================= */
    /* Kai's POV: benched by his own coach, Silk in the stands */
    c3_kai_pov: { scene: 'arena', cutscene: s => CH3.play('c3_kai_benched')(s), seenId: 'c3_kai_benched', fx: { flag: 'c3_kai_pov_seen' },
      lines: [['narrator', 'Somewhere else, the same week, Kai Sterling learns what a bench feels like.']], next: '@season' },
    /* the Tariq falling out (home for a week, a fight in the rain on Halsey Street) */
    c3_home: { scene: 'street_night',
      lines: [
        ['narrator', 'Home for one week. Halsey Street looks smaller than you remember.'],
        ['nia', 'Bayside cut Tariq in October, and he\'s been home since. He doesn\'t talk about it.', 'sad', { flag: 'tariq_eligible' }],
        ['nia', 'Tariq still works at the tire shop. He watches every one of your games.', 'sad', { notFlag: 'tariq_eligible' }],
        ['tariq', '(post) Some people get famous and forget who carried their bags. 🙃', 'angry'],
      ], next: 'c3_tariq' },
    c3_tariq: { scene: 'street_night', cutscene: 'c3_tariq_rain', fx: { flag: 'tariq_fallout', rel: { tariq: -25 }, morale: -6, log: 'Fell out with Tariq on Halsey Street.' },
      lines: [['narrator', 'Your phone buzzes. A clip of the fight is already online.']],
      choices: [
        { t: 'Go after him.', fx: { rel: { tariq: 6 } }, next: 'c3_tariq_door' },
        { t: 'Let him go. You have a tournament.', fx: { morale: 2 }, next: 'c3_home_after' },
      ] },
    c3_tariq_door: { scene: 'rain_night',
      lines: [['narrator', 'You knock on his door until his mom turns off the porch light.'], ['narrator', 'Not tonight. Maybe not this year.']], next: 'c3_home_after' },
    c3_home_after: { type: 'branch', branches: [{ if: { path: 'college' }, next: 'cc_kai_show_pre' }, { if: { path: 'overseas' }, next: 'oo_derby2_pre' }], else: 'gg_kai2_pre' },
    /* the chance to mend it, in the climax arc */
    c3_mend_check: { type: 'branch', branches: [{ if: { flag: 'tariq_fallout', notFlag: ['tariq_mended', 'tariq_lost'] }, next: 'c3_mend' }], else: 'c3_mend_after' },   // older saves never had the falling out
    c3_mend: { scene: 'home',
      lines: [
        ['narrator', 'After the biggest night of your life, one name you want to call isn\'t answering.'],
        ['nia', 'He watched the whole game at the shop. He told everybody "that\'s my brother." Then he left.', 'sad'],
      ],
      choices: [
        { t: 'Go home for one night. Knock on his door.', hint: 'Costs a practice', fx: { trust: -4, fatigue: 10, flag: 'tariq_mended', rel: { tariq: 30 }, log: 'Made it right with Tariq.' }, next: 'c3_mend_hug' },
        { t: 'Send him two tickets and a note: "You carried my bags. Now carry my banner."', check: { a: 'iq', dc: 50 }, fx: { flag: 'tariq_mended', rel: { tariq: 20 }, log: 'Made it right with Tariq.' }, failFx: { rel: { tariq: -4 } }, next: 'c3_mend_hug', fail: 'c3_mend_no' },
        { t: 'Post about him: "Day one."', fx: { fans: 2000, rel: { tariq: -6 } }, next: 'c3_mend_no' },
        { t: 'Leave it. Some things end.', fx: { flag: 'tariq_lost', morale: -2 }, next: 'c3_mend_after' },
      ] },
    c3_mend_hug: { scene: 'street_sunset', cutscene: 'c3_tariq_hug', fx: { morale: 8 },
      lines: [['tariq', 'I was jealous, man. That\'s all it was.', 'sad'], ['you', 'I was gone. That\'s on me.']], next: 'c3_mend_after' },
    c3_mend_no: { scene: 'home', fx: { flag: 'tariq_lost' },
      lines: [['narrator', 'The seat stays empty. He reads it and doesn\'t answer.']], next: 'c3_mend_after' },
    c3_mend_after: { type: 'branch', branches: [{ if: { path: 'college' }, next: 'cc_hub2' }, { if: { path: 'overseas' }, next: 'oo_post_derby' }], else: 'gg_back' },

    /* declaring for the Draft, the chapter end */
    c3_declare: { scene: 'arena', cutscene: 'c3_declare', fx: { flag: 'declared', fans: 15000, rep: 4, post: { by: 'ehn', text: '📣 {name} has declared for the NBL Draft.' } },
      lines: [
        ['narrator', 'You read a statement you rewrote nine times. Your voice only cracks once.'],
        ['mom', 'Whatever pick, wherever they send you. We\'re coming.', 'smile'],
        ['tariq', '(front row, next to Mom) Don\'t cry. Okay, cry a little.', 'smile', { flag: 'tariq_mended' }],
        ['kai', '(text) Declared too, Halsey. Let\'s see who goes first.', 'fierce'],
      ], next: 'c3_end' },
    c3_end: { type: 'chapterEnd', nextChapter: 'draft', nextTitle: 'Chapter 4 — The Draft', fx: { develop: 'college' },
      teaser: 'The combine, workouts, and Draft night. (Coming in a later build — your save carries over.)',
      summary: 'You enter the Draft at {ovr} Overall. Draft stock: {draft}.',
      recap: [
        { if: { path: 'college', notFlag: 'path_juco' }, t: '🎓 Played college ball at {college}' },
        { if: { flag: 'path_juco' }, t: '🎓 Juco to the Draft: Metro City College' },
        { if: { path: 'overseas' }, t: '✈️ Turned pro overseas with {club}' },
        { if: { path: 'grind' }, t: '⚙️ Ground it out in the Grind League' },
        { if: { flag: 'coach_fired' }, t: '📺 Your coach was fired. You won your spot back.' },
        { if: { flag: 'club_unpaid' }, t: '💸 Played on when the club stopped paying' },
        { if: { flag: 'gl_waived' }, t: '✂️ Waived, then earned your way back' },
        { if: { flag: 'beat_no1' }, t: '🚨 Knocked off the No. 1 team in March' },
        { if: { flag: 'derby_win' }, t: '🔥 Won the derby in front of 15,000' },
        { if: { flag: 'nbl_win' }, t: '📞 Won your first NBL game' },
        { if: { flag: 'national_champ' }, t: '🏆 National champion' },
        { if: { flag: 'league_champ' }, t: '🏆 League champion' },
        { if: { flag: 'cup_champ' }, t: '🏆 Continental Cup champion' },
        { if: { flag: 'gl_champ' }, t: '🏆 Grind League champion' },
        { if: { flag: 'beat_kai_c3' }, t: '⚔ Beat Kai again' },
        { if: { flag: 'tariq_mended' }, t: '🤝 Made it right with Tariq' },
        { if: { flag: 'tariq_lost' }, t: '💔 Lost Tariq' },
      ] },

    /* ---------------- older saves only (the earlier Chapter 3) ---------------- */
    cc_kai_pre: { scene: 'arena', cutscene: 'c3_kai',
      lines: [['kai', 'They pay me to play now, Halsey. You get a meal plan.', 'smile']],
      choices: [{ t: '"Then quit talking and play."', fx: { morale: 4, rel: { kai: -3 } }, next: '@season' }] },
    cc_kai_win: { scene: 'arena', fx: { rep: 6, fans: 8000, draftStock: 2, flag: 'beat_kai_c3' }, lines: [['kai', 'One exhibition. They don\'t count those, Halsey.', 'fierce']], next: 'cc_wt' },
    cc_kai_loss: { scene: 'arena', fx: { morale: -4 }, lines: [['narrator', 'Kai went for 31. Every time you closed out, he was already gone.']], next: 'cc_wt' },
    cc_midterms: { scene: 'home',
      lines: [['advisor', 'Midterms are Thursday, the road trip is Wednesday. You see the problem.']],
      choices: [
        { t: 'Study on the bus with Danny.', check: { a: 'iq', dc: 52 }, fx: { attrs: { iq: 1 }, rel: { advisor: 4, rook: 3 }, fatigue: 5 }, failFx: { trust: -4, flag: 'academic_probation' }, next: '@season', fail: 'cc_midterms_fail' },
        { t: 'Ask the advisor for a tutor.', fx: { money: -100, rel: { advisor: 6 }, fatigue: 3 }, next: '@season' },
      ] },
    cc_midterms_fail: { scene: 'home', fx: { morale: -5 }, lines: [['advisor', 'Academic probation. One more slip and you sit for the tournament.', 'determined']], next: '@season' },
    cc_lou_visit: { scene: 'arena', fx: { rel: { lou: 6 }, morale: 4 }, lines: [['narrator', 'Third row, behind the bench, in a Halsey Street hoodie: Lou.', null, { notFlag: 'lou_snub' }]], next: '@season' },
    cc_homesick: { scene: 'home', lines: [['mom', 'We watch every game and I yell at the TV. The neighbors know your name now.', 'smile']],
      choices: [{ t: '"I miss you guys. A lot."', fx: { rel: { mom: 6, nia: 6 }, morale: 4 }, next: '@season' }] },
    cc_top5_pre: { scene: 'arena', fx: { draftStock: 1 }, lines: [['narrator', 'A top-ten matchup on national TV. Twelve NBL scouts in the second row.']], next: '@season' },
  },
  moved: {},   // removed scenes → where older saves continue (filled in by the road files)
};
