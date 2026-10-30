/* =====================================================================
   DATA-STORY-CH5.JS — CHAPTER 5 "The League" (STORY.md, Chapter 5), first half. Theme: the top is lonelier, and it can
   all be taken in one play.
   THE ROOKIE WALL ARC (fixed setback): stuck behind the star at your position ({vet}, your mentor and your obstacle),
   DNPs and garbage time, the rookie revenge games (every team that passed, with the boxing poster and Chip on the
   Shoulder) → the star goes down, your first start, thirty points, your weapon evolves to tier IV.
   THE BREAKOUT ARC: the rivalry unlock (Kai, now in the league: a post-game confrontation), the signature shoe unlock
   (the sneaker brand), the falling out with Nia over the brand and the money (mended by your choices), All-Star votes
   and the weekend, the trade deadline, the sore knee you hide, Lou's warning echoing, and the fixed high: your first
   playoff series win. The season, the offseason (aging), awards and free agency run in js/pro.js; the second half
   (the Injury and First Finals arcs) continues from c5a_hold in a later build.
   C5_SEASONS[n]: the story's beats inside season n (game index → story node), its key games, the fixed playoff round.
   ===================================================================== */

/* ---------- people ---------- */
Object.assign(STORY.characters, {
  vetstar: { name: 'The star at your position', short: 'The Vet', role: 'Six-time All-Star · your mentor, your obstacle', color: '#facc15',
             look: { skin: '#5c3a21', hair: 'fade', hairColor: '#57534e', beard: 'full', outfit: 'jersey', jersey: '#1e3a8a', trim: '#facc15', build: 'strong', headband: '#f8fafc' } },
  pcoach:  { name: 'Coach Marv Dellinger', short: 'Coach Dellinger', role: 'Head coach · thirty years, three rings as an assistant', color: '#94a3b8',
             look: { skin: '#e8c19a', hair: 'flattop', hairColor: '#a8a29e', beard: 'mustache', outfit: 'suit', jersey: '#1f2937', trim: '#e5e7eb' } },
  trainer: { name: 'Gabe Ortiz', short: 'Gabe', role: 'Head athletic trainer', color: '#22d3ee',
             look: { skin: '#c68a5c', hair: 'buzz', hairColor: '#0f0d0c', outfit: 'polo', jersey: '#0f766e', trim: '#f8fafc' } },
  brand:   { name: 'Simone Achterberg', short: 'Simone', role: 'Strato Athletic · VP, signature line', color: '#f472b6',
             look: { skin: '#f1d0b0', hair: 'bun', hairColor: '#facc15', femme: true, outfit: 'suit', jersey: '#111827', trim: '#f472b6' } },
  gm_fa:   { name: 'A front office across the table', short: 'The GM', role: 'Free agency · the negotiation', color: '#e2e8f0',
             look: { skin: '#a86b43', hair: 'fade', hairColor: '#57534e', beard: 'goatee', outfit: 'suit', jersey: '#111827', trim: '#e5e7eb' } },
});
// the star at your position has a name for every position (js/pro.js), and the team's colors
Object.defineProperty(STORY.characters.vetstar, 'name', { configurable: true, get() { const s = typeof Game !== 'undefined' && Game.state; return s && typeof Pro !== 'undefined' ? Pro.vetName(s) : 'The star at your position'; } });

/* ---------- free agency: the negotiation (a patience gauge) ---------- */
Object.assign(TALK.personalities, {
  gm_fa: { kind: 'coach', char: 'gm_fa', trait: 'Polite, patient, counting every dollar. Rewards leverage and honesty, hates bluffing.', start: 54,
           styles: { honest: 18, team: 16, effort: 14, respect: 10, ego: -8, joke: -4, excuse: -24, argue: -16 },
           good: ['That\'s a fair point.', 'Okay. We can move on that.'], bad: ['That number isn\'t real.', 'We\'re done if that\'s the ask.'] },
});
Object.assign(TALK.scripts, {
  c5_fa: [
    { say: 'Tell me why you\'re worth the max.', opts: [['honest', 'I\'m not yet. I will be, and it\'s cheaper now.'], ['ego', 'Because I\'m the best player you\'ll talk to all summer.'], ['effort', 'Look at what I did when the star went down.']] },
    { say: 'Two other teams called your agent. Are you using us?', opts: [['honest', 'Yes. And I\'d still rather be here.'], ['argue', 'That\'s the business. Match them or don\'t.'], ['team', 'I want the team that wants to win. Is that you?']] },
    { say: 'Last thing. What do you need from us besides money?', opts: [['team', 'A coach who plays the hot hand, and teammates who pass.'], ['excuse', 'Better trainers. Last year wasn\'t my fault.'], ['respect', 'Your word that I\'ll get the ball late.']] },
  ],
});

/* ---------- the story's beats inside each season (game index → node; js/pro.js seasonDef) ---------- */
const C5_SEASONS = {
  1: { interrupts: { 3: 'c5_dnp', 12: 'c5_mentor', 26: 'c5_star_hurt', 44: 'c5_deadline1', 62: 'c5_rookie_kai' },
       keys: { 0: { title: 'Game 1 · Opening Night' }, 27: { title: 'Game 28 · Your first start', script: 'c5_thirty', importance: 3, post: { win: 'c5_awaken', lose: 'c5_awaken' } } },
       scriptAt: 27, wallUntil: 27, revenge: 4, kaiAt: 18 },
  2: { interrupts: { 14: 'c5_shoe', 24: 'c5_nia1', 36: 'c5_votes', 44: 'c5_deadline2', 50: 'c5_allstar', 58: 'c5_knee', 68: 'c5_nia2', 76: 'c5_lou_warn' },
       keys: { 0: { title: 'Game 1 · Opening Night' } }, revenge: 2, kaiAt: 9, kaiPost: { win: 'c5_rival', lose: 'c5_rival' },
       fixedWin: 0, seriesScript: 'c5_series', playoffPre: { 0: 'c5_po_pre', 1: 'c5_series_won' } },
  generic: { revenge: 1, kaiAt: 20 },   // later seasons (the second half and Chapters 6–7 add their own beats)
};

STORY.tests = Object.assign(STORY.tests || {}, {
  c5_pre_well: s => !!s.flags.c5_pre_good,
  c5_s1_well: s => ((s.career.seasons || []).slice(-1)[0] || {}).ppg >= 11,
  c5_s1_badly: s => ((s.career.seasons || []).slice(-1)[0] || {}).ppg < 7,
  c5_trade_forced: s => s.meta.trust < 30,
  c5_contract_up: s => !!(s.pro && s.pro.contract && s.pro.contract.years <= 0),
});
STORY.refs = Object.assign(STORY.refs || {}, { '@myteam': s => 'nbl_' + (s.pro ? s.pro.team : s.career.nblTeam || 'tnl'), '@preopp': s => 'nbl_' + ((s.pro && s.pro.kaiTeam) || 'las') });

STORY.chapters.pro = {
  title: 'Chapter 5', name: 'The League', start: 'start', xpBoost: 1, cta: 'Chapter 5',
  stage: s => s.pro ? Season.role(s) === 'Franchise Star' ? 'Franchise Star' : 'NBL ' + Season.role(s) : 'NBL Rookie',
  blurb: 'Rookie to prime. The top is lonelier, and it can all be taken in one play.',
  board: s => s.pro && NBL_TEAMS[s.pro.team] ? NBL_TEAMS[s.pro.team].name.toUpperCase() : 'NBL',
  nodes: {
    /* ======================= ARC 1: THE ROOKIE WALL ARC (fixed setback) ======================= */
    start: { type: 'branch', fx: { proInit: true, proSeason: true }, branches: [{ if: { flag: 'overseas_road' }, next: 'c5_overseas_year' }], else: 'c5_open' },
    c5_overseas_year: { scene: 'city', fx: { attrs: { iq: 2, str: 1 }, money: 120000, log: 'A year overseas, then the call.' },
      lines: [['narrator', 'One season overseas. Grown men, real money, and a highlight reel that wouldn\'t stop.'], ['gm_cole', '(on the phone) Told you we\'d keep watching. Come home. Standard deal.', 'smile']], next: 'c5_open' },
    c5_open: { scene: 'arena', cutscene: (s, ctx) => CH5S.arrival(s, ctx), seenId: 'c5_arrival', fx: { log: 'Chapter 5: the NBL. Season one, the {team}.' },
      lines: [
        ['narrator', '{teamCity}. Your name above a locker, your number on a jersey that costs $140.'],
        ['gm_cole', 'Welcome to the league. Now the hard part starts.', 'smile'],
      ], next: 'c5_camp' },
    c5_camp: { scene: 'gym', cutscene: (s, ctx) => CH5S.meetVet(s, ctx), seenId: 'c5_meet_vet',
      lines: [
        ['pcoach', 'Same position as {vetShort}. He\'s a six-time All-Star. You\'ll learn a lot from the bench.'],
        ['vetstar', 'Rookie. You\'re behind me. Watch everything I do, and maybe you won\'t be forever.', 'smile'],
      ],
      choices: [
        { t: '"Then teach me."', fx: { trust: 3, rel: { vetstar: 6 } }, next: 'c5_pre_pre' },
        { t: '"Not for long."', fx: { morale: 3, trust: -2, rel: { vetstar: -3 } }, next: 'c5_pre_pre' },
      ] },
    c5_pre_pre: { scene: 'locker', lines: [['pcoach', 'Preseason. The rookies get the fourth quarter. Show me something.']], next: 'c5_preseason' },
    c5_preseason: { type: 'match', us: '@myteam', them: '@preopp', ratingRel: 2, mateRel: 3, moments: 7, level: 'pro', importance: 1, lateEntry: { at: .72, title: 'The fourth quarter', text: 'Preseason. The starters sit, and Coach finally points at you.' },
      gradeFlag: { min: 64, flag: 'c5_pre_good' }, title: 'Preseason', sub: 'vs {kaiNick}', win: 'c5_pre_post', lose: 'c5_pre_post' },
    c5_pre_post: { scene: 'locker',
      lines: [
        ['pcoach', 'Good fourth quarter. You\'re still eleventh on my list.', null, { test: 'c5_pre_well' }],
        ['pcoach', 'You looked like a rookie. Because you are one.', null, { notTest: 'c5_pre_well' }],
        ['narrator', 'Eighty-two games, and you\'re about to watch most of them.'],
      ], next: 'c5_season1' },
    c5_season1: { type: 'season', season: s => Pro.seasonDef(s), then: { done: 'c5_s1_end' } },
    /* the beats of season one */
    c5_dnp: { scene: 'arena', cutscene: (s, ctx) => CH5S.dnp(s, ctx), seenId: 'c5_dnp',
      lines: [
        ['narrator', 'DNP: Coach\'s decision. Three games, three times.'],
        ['narrator', 'A great preseason, and still a warmup jacket. That\'s the part that stings.', null, { test: 'c5_pre_well' }],
        ['narrator', 'You looked lost in the preseason. Coach noticed. Everybody noticed.', null, { notTest: 'c5_pre_well' }],
        ['vetstar', '(passing your seat) Everybody sits first. Some guys learn from it.'],
      ], next: '@season' },
    c5_mentor: { scene: 'gym', fx: { flag: 'c5_mentored' },
      lines: [['vetstar', 'Film room, 7 a.m. I\'ll show you how I\'m going to beat you in practice.', 'smile'], ['narrator', 'He\'s the reason you don\'t play. He\'s also the best teacher you\'ve had since Lou.']],
      choices: [
        { t: 'Be there at 6:45.', fx: { attrs: { iq: 2 }, trust: 4, rel: { vetstar: 6 } }, next: '@season' },
        { t: 'Skip it. Get shots up alone.', fx: { attrs: { three: 1 }, morale: 2, rel: { vetstar: -4 } }, next: '@season' },
      ] },
    c5_star_hurt: { scene: 'arena', cutscene: (s, ctx) => CH5S.vetHurt(s, ctx), seenId: 'c5_vet_hurt', fx: { flag: ['vet_hurt', 'vet_hurt_out'] },
      lines: [
        ['trainer', 'Hamstring. Four weeks, maybe six.'],
        ['vetstar', '(on the trainer\'s table, to you) Don\'t you dare waste this.', 'determined'],
        ['pcoach', 'You\'re starting Friday. Everything you watched, use it.'],
      ], next: '@season' },
    c5_awaken: { scene: 'arena', fx: { flag: 'starter', proWall: false, trust: 25, rep: 6, fans: 60000, evolve: { tier: 4, scene: 'arena', line: 'Twenty-seven games on the bench. One start.' },
        post: { by: 'courtvision', text: '🚨 Rookie {name} drops 30 in his first career start. Every team that passed just watched it.' } },
      lines: [['narrator', 'Thirty points in your first start. The bench is a memory.'], ['vetstar', '(text, from the injury list) Okay. Now I\'m worried.', 'smile']], next: '@season' },
    c5_deadline1: { scene: 'locker',
      lines: [['narrator', 'Trade deadline. Your name is in three rumors and one podcast.'], ['priya', 'Want me to ask for a trade? Rookies don\'t usually get one.']],
      choices: [
        { t: '"Ask. I want to play."', fx: { flag: 'trade_requested' }, next: 'c5_deadline1_no' },
        { t: '"No. I\'m earning it here."', fx: { trust: 4, rel: { gm_cole: 4 } }, next: '@season' },
      ] },
    c5_deadline1_no: { scene: 'locker', lines: [['gm_cole', 'Request denied. I didn\'t wait all draft night to trade you in February.', 'smile']], next: '@season' },
    c5_rookie_kai: { scene: 'home', lines: [['narrator', 'Rookie of the Year ladder: Kai Sterling, number one, for the ninth straight week.'], ['kai', '(text) How\'s the bench, Halsey? I hear it\'s comfy.', 'smile']], next: '@season' },
    c5_s1_end: { scene: 'locker',
      lines: [
        ['narrator', 'Season one is over. You finished it as a starter.', null, { flag: 'starter' }],
        ['narrator', 'Half a season on the bench, half a season you\'ll remember.', null, { test: 'c5_s1_well' }],
        ['narrator', 'The numbers say rookie. You know you left points out there.', null, { test: 'c5_s1_badly' }],
      ], next: 'c5_awards1' },
    c5_awards1: { type: 'awards', next: 'c5_off1' },
    c5_off1: { scene: 'street_sunset', fx: { proOff: true },
      lines: [['lou', 'Summer workouts on Halsey Street, same as always. You\'re not a rookie anymore, act like it.', 'determined', { notFlag: 'lou_snub' }], ['narrator', 'A year older. The league got a year of film on you.']], next: 'c5_fa1' },
    c5_fa1: { type: 'freeagency', next: 'c5_s2_start' },

    /* ======================= ARC 2: THE BREAKOUT ARC ======================= */
    c5_s2_start: { scene: 'arena', fx: { proSeason: true },
      lines: [['pcoach', 'Season two. Nobody hands you minutes now. You keep them.', null], ['narrator', 'Kai\'s team is on the schedule in October. Somebody already circled it for you.']], next: 'c5_season2' },
    c5_season2: { type: 'season', season: s => Pro.seasonDef(s), then: { done: 'c5_s2_end' } },
    /* the rivalry: a heated post-game confrontation with Kai (the Rivalry System) */
    c5_rival: { scene: 'arena', cutscene: (s, ctx) => CH5S.confront(s, ctx), seenId: 'c5_confront', fx: { unlock: 'rivalry', rel: { kai: -3 }, fans: 30000 },
      lines: [['kai', 'Enjoy it. Next time it\'s different.', 'fierce'], ['narrator', 'Every camera in the tunnel got it. It\'s on every phone by midnight.']], next: '@season' },
    /* the signature shoe: a meeting with a sneaker brand */
    c5_shoe: { scene: 'city', cutscene: (s, ctx) => CH5S.shoeMeet(s, ctx), seenId: 'c5_shoe', fx: { unlock: 'shoe', money: 250000, flag: 'strato_deal' },
      lines: [['brand', 'We don\'t sign players. We sign stories. Let\'s build your shoe.', 'smile'], ['priya', 'Design it in the Shoe tab. They want it on shelves by spring.', 'smile']], next: '@season' },
    /* the falling out with Nia: the brand and the money */
    c5_nia1: { scene: 'home', cutscene: (s, ctx) => CH5S.niaFight(s, ctx), seenId: 'c5_nia_fight',
      lines: [
        ['nia', 'Strato put "Halsey Street" on a shoe that costs $210. Nobody on Halsey Street can buy it.', 'fierce'],
        ['nia', 'And you put me on payroll like I\'m staff. I\'m your SISTER.', 'sad'],
      ],
      choices: [
        { t: '"It\'s business, Nia. You don\'t get it."', fx: { flag: 'nia_hurt', rel: { nia: -10 } }, next: 'c5_nia1_after' },
        { t: '"You\'re right. Help me fix it: a version for Halsey Street."', fx: { flag: 'nia_mended', rel: { nia: 8 }, money: -50000 }, next: 'c5_nia1_mend' },
        { t: '"I don\'t have time for this right now."', fx: { flag: 'nia_hurt', rel: { nia: -6 }, morale: -2 }, next: 'c5_nia1_after' },
      ] },
    c5_nia1_after: { scene: 'home', lines: [['narrator', 'She leaves without slamming the door. That\'s worse.']], next: '@season' },
    c5_nia1_mend: { scene: 'home', lines: [['nia', 'Forty dollars. A Halsey edition. And I pick the colorway.', 'smile']], next: '@season' },
    c5_votes: { scene: 'arena',
      lines: [['narrator', 'All-Star fan voting, second returns: you\'re {votesNow} in the conference.'], ['nia', '(text) I voted 400 times. Don\'t make it weird.', 'smile', { flag: 'nia_mended' }], ['nia', '(text) still voted for you. don\'t read into it', null, { flag: 'nia_hurt', notFlag: 'nia_mended' }]], next: '@season' },
    /* the trade deadline: a contender calls (requested), or a team that's lost faith (forced) */
    c5_deadline2: { type: 'branch', branches: [{ if: { test: 'c5_trade_forced' }, next: 'c5_trade_forced' }], else: 'c5_trade_offer' },
    c5_trade_offer: { scene: 'locker',
      lines: [['gm_cole', 'A contender wants you. I said no twice. They called a third time.'], ['gm_cole', 'Your call. I mean that.']],
      choices: [
        { t: '"Make the trade. I want to win now."', fx: { proTrade: 'contender', flag: 'traded' }, next: 'c5_traded' },
        { t: '"I\'m staying. We\'re building something."', fx: { trust: 6, rel: { gm_cole: 6 }, flag: 'stayed_loyal' }, next: '@season' },
      ] },
    c5_trade_forced: { scene: 'locker', fx: { proTrade: 'forced', flag: ['traded', 'traded_forced'], morale: -6 },
      lines: [['gm_cole', 'I\'m sorry. Ownership made the call. You were the price.', 'sad'], ['narrator', 'You played badly enough for long enough. That\'s how it goes in February.']], next: 'c5_traded' },
    c5_traded: { scene: 'airport', cutscene: (s, ctx) => CH5S.traded(s, ctx), seenId: 'c5_traded',
      lines: [['narrator', 'New city, new locker, new teammates who don\'t know your spots yet.'], ['narrator', 'Chemistry starts from scratch. Every game you play together, it grows.']], next: '@season' },
    /* All-Star weekend */
    c5_allstar: { type: 'allstar', next: 'c5_asg_check' },
    c5_asg_check: { type: 'branch', branches: [{ if: { flag: 'allstar_sel' }, next: 'c5_asg_pre' }], else: 'c5_asg_watch' },
    c5_asg_pre: { scene: 'arena', lines: [['narrator', 'The All-Star Game. Nobody plays defense until the fourth quarter.'], ['kai', '(other bench) Don\'t embarrass the rookie class, Halsey.', 'smile', { flag: 'kai_allstar' }]], next: 'c5_asg' },
    c5_asg: { type: 'match', us: 'asg_us', them: 'asg_them', ratingRel: 6, mateRel: 8, moments: 7, level: 'pro', importance: 2, venue: 'allstar', title: 'All-Star Game', sub: 'Conference vs conference', win: 'c5_asg_post', lose: 'c5_asg_post' },
    c5_asg_post: { scene: 'arena', fx: { rep: 6, fans: 80000 }, lines: [['narrator', 'An All-Star. Lou watched it on a TV in the barbershop and didn\'t say a word for an hour.']], next: '@season' },
    c5_asg_watch: { scene: 'home', lines: [['narrator', 'You watch the All-Star Game from your couch. Next year, you said that out loud.']], next: '@season' },
    /* foreshadowing: the knee, and Lou's warning */
    c5_knee: { scene: 'locker', cutscene: (s, ctx) => CH5S.knee(s, ctx), seenId: 'c5_knee',
      lines: [['trainer', 'You\'re favoring the left knee. How long has it been sore?'], ['narrator', 'Three weeks. It swells after back-to-backs.']],
      choices: [
        { t: '"It\'s nothing. I\'m good."', fx: { flag: 'knee_hidden', morale: 2 }, next: '@season' },
        { t: '"Since the All-Star break. Check it."', fx: { flag: 'knee_told', fatigue: -15, trust: -2 }, next: 'c5_knee_told' },
      ] },
    c5_knee_told: { scene: 'locker', lines: [['trainer', 'Tendinitis. Ice, rest days, and you tell me if it changes.'], ['narrator', 'It doesn\'t feel like tendinitis. You don\'t say that part.']], next: '@season' },
    c5_nia2: { type: 'branch', branches: [{ if: { flag: 'nia_hurt', notFlag: 'nia_mended' }, next: 'c5_nia_mend' }], else: 'c5_nia_ok' },
    c5_nia_mend: { scene: 'home',
      lines: [['narrator', 'Nia hasn\'t texted in six weeks. Mom keeps setting the table for four.']],
      choices: [
        { t: 'Fly home on the off day. Show up at her door with dumplings.', fx: { flag: 'nia_mended', rel: { nia: 10 }, fatigue: 10 }, next: 'c5_nia_mended' },
        { t: 'Send money and a long text.', fx: { money: -20000, rel: { nia: 2 } }, next: 'c5_nia_text' },
      ] },
    c5_nia_mended: { scene: 'home', lines: [['nia', 'You flew here to say sorry with DUMPLINGS?', 'smile'], ['nia', 'Okay. Okay. Halsey edition. I pick the colorway.', 'smile']], next: '@season' },
    c5_nia_text: { scene: 'home', lines: [['nia', '(text) thanks for the money. that wasn\'t the point.', 'sad']], next: '@season' },
    c5_nia_ok: { scene: 'home', lines: [['nia', '(text) Halsey edition sold out in nine minutes. I told you.', 'smile']], next: '@season' },
    c5_lou_warn: { scene: 'street_night', cutscene: (s, ctx) => CH5S.louWarn(s, ctx), seenId: 'c5_lou_warn',
      lines: [['narrator', 'You catch your reflection in the arena glass after a 40-minute night. The knee hums.']], next: '@season' },
    /* the playoffs: the fixed high is your first series win */
    c5_po_pre: { scene: 'arena', lines: [['narrator', 'Your first playoffs. The building sounds different in April.'], ['pcoach', 'Sixteen wins. Start with four.']], next: '@season' },
    c5_series_won: { scene: 'locker', cutscene: (s, ctx) => CH5S.seriesWon(s, ctx), seenId: 'c5_series_won', fx: { flag: 'first_series_win', rep: 10, fans: 120000 },
      lines: [['narrator', 'Your first playoff series win. The locker room smells like champagne nobody paid for.'], ['mom', '(on the phone, crying) Your grandmother would have screamed.', 'crying']], next: '@season' },
    c5_s2_end: { scene: 'locker',
      lines: [['narrator', 'Season two. A playoff series won, a shoe on shelves, and a knee that hums when it rains.', null, { flag: 'first_series_win' }], ['narrator', 'Season two is in the books.', null, { notFlag: 'first_series_win' }]], next: 'c5_awards2' },
    c5_awards2: { type: 'awards', next: 'c5_off2' },
    c5_off2: { scene: 'street_sunset', fx: { proOff: true }, lines: [['narrator', 'Another summer, another birthday. Your rookie deal is up.', null, { test: 'c5_contract_up' }], ['narrator', 'Another summer, another birthday.', null, { notTest: 'c5_contract_up' }]], next: 'c5_fa2' },
    c5_fa2: { type: 'freeagency', next: 'c5a_next' },
    /* the end of the first half: "Next time…" and a hold until the second half is built */
    c5a_next: { scene: 'arena', cutscene: (s, ctx) => CH5S.nextHalf(s, ctx), seenId: 'c5a_next', fx: { log: 'Two seasons in the NBL.' },
      lines: [['narrator', 'Season three. Everything is going right.'], ['narrator', 'That\'s usually when it happens.']], next: 'c5a_hold' },
    c5a_hold: { type: 'hub', locked: true, title: 'The Offseason', intro: 'To be continued: THE INJURY ARC and THE FIRST FINALS ARC arrive in a later build. Your career is saved and will continue right here.' },
  },
  moved: {},
};
