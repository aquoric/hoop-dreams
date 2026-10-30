/* =====================================================================
   DATA-STORY-CH4.JS — CHAPTER 4 "The Draft" (STORY.md, Chapter 4). Theme: you did everything right, and the phone
   still doesn't ring.
   THE COMBINE ARC (measurements + drills at pro difficulty, the Combine Leaderboard, the 3-on-3 scrimmage, interviews
   with gauges, the medicals and the old ankle; foreshadowing: a scout's whisper) → THE WORKOUT ARC (three played team
   workouts, Priya playing teams against each other, Kai's POV with Silk, the mock draft climbing on the Big Board) →
   THE DRAFT NIGHT ARC (the green room, Kai first, the slide — deeper the worse you played — the call, the awakening:
   Chip on the Shoulder, every team that passed marked for revenge; undrafted is a road: the two-way or overseas) →
   the fixed high: Summer League vs Kai's team → credits, post-credits (Kai's first NBL practice), "Next time…".
   Logic: js/draft.js · scenes: js/data-story-ch4-scenes.js · arcs: js/data-arcs.js · league: js/data-nbl.js
   ===================================================================== */

/* ---------- people ---------- */
Object.assign(STORY.characters, {
  commish: { name: NBL_LEAGUE.commissioner, short: 'The Commissioner', role: 'National Ballers League', color: '#e2e8f0',
             look: { skin: '#f1d0b0', hair: 'bald', hairColor: '#a8a29e', outfit: 'suit', jersey: '#111827', trim: '#e5e7eb' } },
  doc:     { name: 'Dr. Lena Ostrowski', short: 'Dr. Ostrowski', role: 'Combine medical staff', color: '#93c5fd',
             look: { skin: '#e8c19a', hair: 'bun', hairColor: '#7c4a1e', femme: true, outfit: 'polo', jersey: '#f8fafc', trim: '#1e3a8a' } },
  scout_a: { name: 'A scout in a team polo', short: 'Scout', role: 'Combine · second row', color: '#94a3b8',
             look: { skin: '#d9a77e', hair: 'flattop', hairColor: '#3b2416', beard: 'mustache', outfit: 'polo', jersey: '#334155', trim: '#e5e7eb' } },
  scout_b: { name: 'Another scout', short: 'Scout', role: 'Combine · second row', color: '#94a3b8',
             look: { skin: '#6b3d25', hair: 'buzz', hairColor: '#0f0d0c', beard: 'goatee', outfit: 'polo', jersey: '#1f2937', trim: '#e5e7eb' } },
  gm_ruiz: { name: 'Victor Ruiz', short: 'Ruiz', role: 'General manager · a big-market contender', color: '#f59e0b',
             look: { skin: '#c68a5c', hair: 'fade', hairColor: '#57534e', beard: 'full', outfit: 'suit', jersey: '#111827', trim: '#f59e0b' } },
  gm_park: { name: 'Helen Park', short: 'Park', role: 'General manager · a lottery team', color: '#a78bfa',
             look: { skin: '#eac4a6', hair: 'long', hairColor: '#0f0d0c', femme: true, outfit: 'suit', jersey: '#312e81', trim: '#e5e7eb' } },
  gm_cole: { name: 'Ray Cole', short: 'Cole', role: 'General manager · the team that wanted you', color: '#22c55e',
             look: { skin: '#7a4a2c', hair: 'bald', hairColor: '#0f0d0c', beard: 'goatee', outfit: 'suit', jersey: '#14532d', trim: '#e5e7eb' } },
  vet:     { name: 'A veteran star', short: 'Vet', role: 'NBL veteran', color: '#facc15',
             look: { skin: '#6b3d25', hair: 'bald', hairColor: '#0f0d0c', beard: 'full', outfit: 'jersey', jersey: '#1e3a8a', trim: '#facc15', build: 'strong' } },
});
// the veteran in the post-credits is the star of whichever team took Kai
Object.defineProperty(STORY.characters.vet, 'name', { configurable: true, get() { const s = typeof Game !== 'undefined' && Game.state, R = s && s.draft && s.draft.result, t = R && NBL_TEAMS[R.kaiTeam]; return t && t.stars ? t.stars[0] : 'A veteran star'; } });

/* ---------- the awakening: a weapon for every team that passed ---------- */
WEAPONS.chip_shoulder = { name: 'Chip on the Shoulder', rarity: 'legendary', type: 'passive', charge: 0, icon: 'bolt', story: true, learn: true, stats: { iq: .4, clutch: .3, stam: .3 },
  desc: 'Every team that passed on you is on a list. +8% on everything against them (Summer League and your rookie season).' };

/* ---------- interviews (talks with a patience gauge) ---------- */
Object.assign(TALK.personalities, {
  gm_ruiz: { kind: 'coach', char: 'gm_ruiz', trait: 'Big market, big ego. Wants a winner who handles a microphone.', start: 52,
             styles: { team: 18, effort: 16, respect: 12, honest: 10, ego: 4, joke: 2, excuse: -26, argue: -20 },
             good: ['That plays in our market.', 'Good. Now say it on TV.'], bad: ['That answer gets you booed in our building.', 'No. Next question.'] },
  gm_park: { kind: 'coach', char: 'gm_park', trait: 'Analytics, no small talk. Rewards honesty, punishes spin.', start: 50,
             styles: { honest: 26, team: 12, effort: 12, respect: 8, joke: -10, ego: -22, excuse: -30, argue: -16 },
             good: ['That matches the data.', 'Honest. I can work with honest.'], bad: ['That isn\'t what the film says.', 'I asked a real question.'] },
  gm_cole: { kind: 'coach', char: 'gm_cole', trait: 'Small market, long memory. Wants to know who you are when it goes wrong.', start: 56,
             styles: { honest: 22, effort: 20, team: 14, respect: 10, joke: 2, ego: -18, excuse: -26, argue: -14 },
             good: ['That\'s the guy I watched.', 'Yeah. That\'s why I flew out.'], bad: ['Don\'t sell me. I already watched the tape.', 'Hm. Not what I hoped.'] },
});
Object.assign(TALK.scripts, {
  c4_int_ruiz: [
    { say: 'Our city eats rookies alive. What happens when they boo you?', opts: [['effort', 'I give them a reason to stop.'], ['ego', 'They won\'t boo me.'], ['excuse', 'Depends on the coach.']] },
    { say: 'You come off the bench behind an All-Star. Fine with that?', opts: [['team', 'Whatever wins. I\'ll guard his matchup in practice.'], ['argue', 'Not for long.'], ['respect', 'I\'ll learn everything he knows.']] },
    { say: 'Last one. Why should we take you over Kai Sterling?', opts: [['honest', 'Kai\'s great. I\'ve beaten great.'], ['ego', 'Because I\'m better.'], ['team', 'Because I make the guys around me better.']] },
  ],
  c4_int_park: [
    { say: 'Your usage went up and your efficiency went down. Explain.', opts: [['honest', 'I took bad shots when we were losing.'], ['excuse', 'My teammates couldn\'t finish.'], ['joke', 'Math was never my strong subject.']] },
    { say: 'The Summer Jam final. What went wrong?', opts: [['honest', 'I tried to win it alone. Kai didn\'t.'], ['argue', 'Nothing. We got unlucky.'], ['effort', 'I\'ve watched it a hundred times. I fixed it.']] },
    { say: 'What\'s your worst habit on defense?', opts: [['honest', 'I ball-watch on the weak side.'], ['ego', 'I don\'t really have one.'], ['team', 'I talk less than I should. I\'m working on it.']] },
  ],
  c4_int_cole: [
    { say: 'Forget basketball. Who taught you to play?', opts: [['honest', 'An old man named Lou, on a court with no nets.'], ['ego', 'I taught myself.'], ['respect', 'My mom drove me everywhere. Lou did the rest.']] },
    { say: 'Tell me about the worst night of your career.', opts: [['honest', 'I\'ve had a few. I learned the most from the worst one.'], ['excuse', 'Refs took that game from us.'], ['effort', 'I was back in the gym the next morning.']] },
    { say: 'If we take you, it won\'t be pick one. Does that bother you?', opts: [['team', 'Where I go doesn\'t matter. What I do there does.'], ['argue', 'It should bother you.'], ['honest', 'A little. Then I\'ll use it.']] },
  ],
});

/* ---------- the teams on the floor: the combine scrimmage, the team workouts (1-on-1 vs another prospect) ---------- */
Object.assign(LOCAL_TEAMS, {
  combine_navy:  { name: 'Combine Team 4', abbr: 'C4', colors: ['#1e3a8a', '#f8fafc', '#facc15'], logo: { shape: 'circle', icon: 'stars' }, roster: ['Malik Okafor', 'Milo Park', 'Andre "Dre" Castillo'] },
  combine_white: { name: 'Combine Team 1', abbr: 'C1', colors: ['#f8fafc', '#111827', '#dc2626'], logo: { shape: 'circle', icon: 'stars' }, roster: ['Malachi Vance', 'Elias Thorne', 'Jalen "Jet" Brooks'],
                   star: { name: 'Malachi Vance', perD: 66, intD: 54 } },
});
(() => {   // workout opponents: a prospect in the team's practice jersey · you in the team's practice gear
  const opp = ['Elias Thorne', 'Malachi Vance', 'Darius "D-Train" Holt', 'Jalen "Jet" Brooks', 'Isaiah "Big Ike" Grant', 'Malik Okafor'];
  NBL_IDS.forEach((id, i) => { const T = NBL_TEAMS[id];
    LOCAL_TEAMS['wk_' + id] = { name: `${T.name} workout`, abbr: T.abbr, colors: [T.colors[1], T.colors[0], T.colors[2]], logo: T.logo, roster: [opp[i % opp.length]], star: { name: opp[i % opp.length], perD: 64, intD: 56 } };
    LOCAL_TEAMS['wkme_' + id] = { name: `${T.name} practice`, abbr: T.abbr, colors: T.colors, logo: T.logo, roster: [] }; });
})();

/* ---------- the story's checks ---------- */
STORY.tests = Object.assign(STORY.tests || {}, {
  c4_played_well: s => typeof Draft !== 'undefined' && Draft.form(s) >= .55,
  c4_played_badly: s => typeof Draft !== 'undefined' && Draft.form(s) < .35,
  c4_bad_ankle: s => !!s.flags.bad_ankle,
});
const WK_VENUE = k => ({ configurable: true, enumerable: true, get() { const s = typeof Game !== 'undefined' && Game.state; return s && s.draft && s.draft.wk ? 'nbl_' + s.draft.wk[k] : 'combine'; } });
const workoutNode = (k, next) => { const n = { type: 'match', us: '@wkme' + (k + 1), them: '@wk' + (k + 1), pickup: { size: 1, target: 11 }, ratingRel: 3, mateRel: 0, moments: 6, level: 'street', importance: 2, camp: 'pro',
  title: 'Team Workout', sub: 'One-on-one, first to 11', win: next, lose: next, onResult: (s, r) => Draft.workout(s, s.draft.wk[k], r) }; Object.defineProperty(n, 'venue', WK_VENUE(k)); return n; };

STORY.chapters.draft = {
  title: 'Chapter 4', name: 'The Draft', start: 'start', xpBoost: 1.1, cta: 'Chapter 4',
  stage: () => 'Draft Prospect',
  blurb: 'The combine, the workouts and Draft night. You did everything right, and the phone still doesn\'t ring.',
  board: s => s.flags.draft_night && s.draft && s.draft.result && !s.draft.result.undrafted ? NBL_TEAMS[s.draft.result.team].name.toUpperCase() : 'NBL DRAFT',
  nodes: {
    /* ======================= ARC 1: THE COMBINE ARC ======================= */
    start: { type: 'branch', fx: { ageUp: 1 }, branches: [], else: 'c4_open' },
    c4_open: { scene: 'airport', fx: { log: 'Chapter 4: the Draft.' },
      lines: [
        ['priya', 'Chicago, Thursday. Sixty prospects, four hundred scouts, one week.', 'smile'],
        ['mom', 'Eat something that isn\'t from a vending machine. I mean it.', 'smile'],
        ['narrator', 'Kai is on the same flight. Two rows up, headphones on, not looking back.'],
      ], next: 'combine_intro' },
    combine_intro: { scene: 'arena', cutscene: (s, ctx) => CH4S.combineIntro(s, ctx), seenId: 'c4_combine_intro', fx: { unlock: 'combine' },
      lines: [
        ['priya', 'That screen is the only thing they\'ll look at all week. The Combine Leaderboard.', 'smile'],
        ['priya', 'Every event moves you up or down a draft board. So let\'s move up.'],
      ], next: 'c4_measure' },
    c4_measure: { type: 'combine', title: 'DAY 1 · MEASUREMENTS', events: ['sprint', 'lane', 'vert'], next: 'c4_whisper' },
    /* foreshadowing: the attitude, the ankle and the Summer Jam film */
    c4_whisper: { scene: 'arena', cutscene: (s, ctx) => CH4S.whisper(s, ctx), seenId: 'c4_whisper',
      lines: [
        ['narrator', 'You walk past the second row on your way out. Two scouts stop talking, then don\'t.'],
        ['scout_a', 'Talent\'s real. The attitude, I don\'t know.'],
        ['scout_b', 'Pull up the Summer Jam film. And ask the doctors about that ankle.', null, { flag: 'bad_ankle' }],
        ['scout_b', 'Pull up the Summer Jam film. Watch what he does when it goes wrong.', null, { notFlag: 'bad_ankle' }],
      ], next: 'c4_drills' },
    c4_drills: { type: 'combine', title: 'DAY 2 · SHOOTING & STRENGTH', events: ['shoot', 'bench'], next: 'c4_scrim_pre' },
    c4_scrim_pre: { scene: 'gym',
      lines: [
        ['narrator', 'Three-on-three to eleven, live. Malachi Vance, Elias Thorne and Jet on the other side.'],
        ['priya', '(from the baseline) Measurements get you in the room. This gets you picked.'],
      ], next: 'c4_scrim' },
    c4_scrim: { type: 'match', us: 'combine_navy', them: 'combine_white', pickup: { size: 3, target: 11 }, ratingRel: 3, mateRel: 1, moments: 7, level: 'street', importance: 2, venue: 'combine', camp: 'pro',
      title: 'Combine Scrimmage', sub: 'Three-on-three · first to 11', win: 'c4_scrim_win', lose: 'c4_scrim_loss' },
    c4_scrim_win: { scene: 'gym', fx: { flag: 'c4_scrim_won', draftStock: 1, rankBump: 18, rankWhy: 'Combine scrimmage' },
      lines: [['narrator', 'Four hundred pens write at once. That sound is the best sound you\'ve heard all year.'], ['priya', 'That\'s a lottery workout. Maybe two.', 'smile']], next: 'c4_int_pre' },
    c4_scrim_loss: { scene: 'gym', fx: { rankBump: -8, rankWhy: 'Combine scrimmage' },
      lines: [['narrator', 'Vance hits the game-winner over you. The pens don\'t stop.'], ['priya', 'One game. Interviews are tomorrow, and those count too.']], next: 'c4_int_pre' },
    c4_int_pre: { scene: 'locker',
      lines: [
        ['priya', 'Three teams want fifteen minutes each. Hotel ballroom, bad coffee, no ball.'],
        ['priya', 'They\'re not asking about your jumper. They\'re asking who you are.'],
      ], next: 'c4_int1' },
    c4_int1: { type: 'talk', scene: 'locker', who: 'gm_ruiz', look: 'gm_ruiz', script: 'c4_int_ruiz', title: 'INTERVIEW · {wk2}',
      winFx: { flag: 'dt_1', draftStock: 1 }, loseFx: { draftStock: -1 }, next: 'c4_int2' },
    c4_int2: { type: 'talk', scene: 'locker', who: 'gm_park', look: 'gm_park', script: 'c4_int_park', title: 'INTERVIEW · {wk1}',
      winFx: { flag: 'dt_2', draftStock: 1 }, loseFx: { draftStock: -1 }, next: 'c4_int3' },
    c4_int3: { type: 'talk', scene: 'locker', who: 'gm_cole', look: 'gm_cole', script: 'c4_int_cole', title: 'INTERVIEW · {believer}',
      winFx: { flag: ['dt_3', 'cole_believes'], draftStock: 1 }, loseFx: { flag: 'cole_believes' }, next: 'c4_medicals' },
    /* the medicals: the old ankle comes up */
    c4_medicals: { scene: 'hospital', cutscene: (s, ctx) => CH4S.medicals(s, ctx), seenId: 'c4_medicals',
      lines: [
        ['doc', 'Left ankle. Grade two sprain, senior year. It never fully healed, did it?', null, { flag: 'bad_ankle' }],
        ['doc', 'The MRI shows old wear on that left ankle. Ever tell anyone?', null, { notFlag: 'bad_ankle' }],
        ['narrator', 'Thirty teams will read whatever she writes next.'],
      ],
      choices: [
        { t: '"It still swells after doubles. I tape it every day."', fx: { flag: 'ankle_honest', rel: { priya: 2 } }, next: 'c4_med_honest' },
        { t: '"It\'s fine. It\'s always been fine."', fx: { flag: 'ankle_brushed' }, next: 'c4_med_hide' },
      ] },
    c4_med_honest: { type: 'branch', branches: [{ if: { flag: 'bad_ankle' }, next: 'c4_med_flag' }], else: 'c4_med_clear' },
    c4_med_flag: { scene: 'hospital', fx: { flag: 'ankle_flagged' },
      lines: [['doc', 'Honest. I\'ll write "monitor," not "red flag."'], ['priya', 'A yellow flag. Some teams will drop you a few spots for it.']], next: 'c4_combine_end' },
    c4_med_clear: { scene: 'hospital', lines: [['doc', 'Then it\'s wear, not damage. Cleared.', 'smile']], next: 'c4_combine_end' },
    c4_med_hide: { type: 'branch', branches: [{ if: { flag: 'bad_ankle' }, next: 'c4_med_caught' }], else: 'c4_med_clear' },
    c4_med_caught: { scene: 'hospital', fx: { flag: ['ankle_flagged', 'ankle_hidden'], draftStock: -1 },
      lines: [['doc', 'Your high school trainer\'s notes say otherwise.', 'determined'], ['narrator', 'She writes for a long time. Priya stops smiling.']], next: 'c4_combine_end' },
    c4_combine_end: { scene: 'arena',
      lines: [
        ['priya', 'Combine\'s over. Mock drafts have you at {mock}.', 'smile'],
        ['narrator', 'Kai\'s name is above yours on every one of them.'],
      ], next: 'c4_workouts' },

    /* ======================= ARC 2: THE WORKOUT ARC ======================= */
    c4_workouts: { scene: 'home',
      lines: [
        ['priya', 'Three workouts: {wk1}, {wk2} and {believer}. Each one is a job interview with sweat.'],
        ['priya', 'Your Rankings tab is the Big Board now. Watch it move.', 'smile'],
      ], next: 'c4_wk1_pre' },
    c4_wk1_pre: { scene: 'gym', lines: [['gm_park', 'Analytics people hate workouts. I don\'t. Show me something the numbers can\'t.'], ['narrator', 'One-on-one against Elias Thorne, first to eleven. Nobody else in the gym talks.']], next: 'c4_wk1' },
    c4_wk1: workoutNode(0, 'c4_wk1_post'),
    c4_wk1_post: { scene: 'gym',
      lines: [
        ['gm_park', '(writing) Interesting. We pick early, you know.', 'smile', { test: 'c4_played_well' }],
        ['gm_park', '(writing) Noted. Thank you for coming.', null, { notTest: 'c4_played_well' }],
      ], next: 'c4_priya' },
    /* Priya plays teams against each other */
    c4_priya: { scene: 'home',
      lines: [
        ['priya', '{wk2} called. I told them {wk1} loved you. That was a small lie.', 'smile'],
        ['priya', 'Now they all think somebody else wants you. That\'s how this works.'],
      ],
      choices: [
        { t: '"Keep the bidding war going."', check: { a: 'iq', dc: 56 }, fx: { draftStock: 2, rankBump: 14, rankWhy: 'Priya\'s bidding war', rel: { priya: 4 } }, failFx: { draftStock: -1, flag: 'priya_burned' }, next: 'c4_wk2_pre', fail: 'c4_priya_burn' },
        { t: '"Just get me in front of teams that want me."', fx: { rel: { priya: 2 }, flag: 'loyal_prospect' }, next: 'c4_wk2_pre' },
        { t: '"Tell {believer} they\'re my first choice."', fx: { flag: ['loyal_prospect', 'cole_believes'], rel: { priya: -2 } }, next: 'c4_wk2_pre' },
      ] },
    c4_priya_burn: { scene: 'home', lines: [['priya', '{wk2} called {wk1}. They compared notes. I\'m sorry.', 'sad'], ['narrator', 'One workout gets a little quieter. So does your phone.']], next: 'c4_wk2_pre' },
    c4_wk2_pre: { scene: 'gym', lines: [['gm_ruiz', 'Lights, cameras, our owner in the front row. Welcome to {wk2}.'], ['narrator', 'Malachi Vance again, first to eleven. He remembers the combine too.']], next: 'c4_wk2' },
    c4_wk2: workoutNode(1, 'c4_wk2_post'),
    c4_wk2_post: { scene: 'gym',
      lines: [
        ['gm_ruiz', 'The owner liked you. The owner never likes anybody.', 'smile', { test: 'c4_played_well' }],
        ['gm_ruiz', 'We\'ll be in touch. Probably.', null, { notTest: 'c4_played_well' }],
      ], next: 'c4_kai_pov' },
    /* Kai's POV: Silk demands #1, or Kai refuses to report */
    c4_kai_pov: { scene: 'home', cutscene: (s, ctx) => CH4S.kaiPov(s, ctx), seenId: 'c4_kai_pov',
      lines: [['narrator', 'The next morning, a headline: KAI STERLING CAMP: "NUMBER ONE OR NOTHING."']], next: 'c4_wk3_pre' },
    c4_wk3_pre: { scene: 'gym',
      lines: [
        ['gm_cole', '{believerCity}. Small market, cold winters, loud building.', 'smile'],
        ['gm_cole', 'I scouted you at the Summer Jam. Just play.'],
      ], next: 'c4_wk3' },
    c4_wk3: workoutNode(2, 'c4_wk3_post'),
    c4_wk3_post: { scene: 'gym', fx: { flag: 'cole_believes' },
      lines: [
        ['gm_cole', 'Same kid I saw on Halsey Street. Good.', 'smile', { test: 'c4_played_well' }],
        ['gm_cole', 'Rough day. I\'ve seen your good days, son. I remember those.', null, { notTest: 'c4_played_well' }],
        ['narrator', 'He\'s the only GM who shakes Mom\'s hand.'],
      ], next: 'c4_hub' },
    c4_hub: { type: 'hub', title: 'The Week Before the Draft', next: 'c4_mock', intro: 'One more week. Train, rest, check the Big Board — then Draft night.' },
    c4_mock: { scene: 'home',
      lines: [
        ['nia', 'You\'re {mock} on the big mock draft. You were 40-something in April!', 'smile'],
        ['dee', '(text) From last on my list to this. Whatever happens Thursday, I called it.', 'smile', { flag: 'saw_dee' }],
        ['lou', '(on the phone) Don\'t watch the mocks. Mocks don\'t pick anybody.', null, { notFlag: 'lou_snub' }],
      ], next: 'c4_eve' },
    c4_eve: { scene: 'home',
      lines: [
        ['mom', 'I bought a dress. Your sister says it\'s too much. It\'s not too much.', 'smile'],
        ['tariq', '(text) Front row. I mean, the table. You know what I mean.', 'smile', { flag: 'tariq_mended' }],
        ['narrator', 'You don\'t sleep. Neither does Kai, three hotels away.'],
      ], next: 'c4_draft' },

    /* ======================= ARC 3: THE DRAFT NIGHT ARC (climax, fixed setback) ======================= */
    c4_draft: { type: 'draft', cutscene: (s, ctx) => CH4S.greenRoom(s, ctx), seenId: 'c4_greenroom', made: 'c4_drafted', undrafted: 'c4_undrafted' },
    c4_drafted: { scene: 'arena', fx: { rep: 6, fans: 25000, xp: 250, log: 'Drafted {pick} overall by the {believer}.', post: { by: 'ehn', text: '🧢 With the {pick} pick, the {believer} select {name}.' } },
      lines: [
        ['narrator', '{pick} overall. {slideN} picks after your mock. Every one of them hurt.'],
        ['narrator', 'A combine like that, a season like that, and still {passedN} teams said no.', null, { test: 'c4_played_well' }],
        ['narrator', 'You gave them reasons to pass. They took every one.', null, { test: 'c4_played_badly' }],
        ['mom', '(crying into your shoulder) I don\'t care what number. They called your NAME.', 'crying'],
        ['gm_cole', '(on the phone) Told you. We wanted you from the start.', 'smile'],
      ], next: 'c4_awaken' },
    c4_undrafted: { scene: 'arena', fx: { morale: -6, log: 'Undrafted.' },
      lines: [
        ['narrator', 'Sixty names. The cameras pack up around you.'],
        ['narrator', 'A season like that and nobody took you. Some nights there\'s no reason.', null, { test: 'c4_played_well' }],
        ['narrator', 'You disappeared when it mattered. Thirty teams noticed.', null, { test: 'c4_played_badly' }],
        ['priya', 'Undrafted isn\'t an ending. My phone just started ringing.', 'determined'],
        ['gm_cole', '(on Priya\'s speaker) We wanted to pick you. Ownership said no. Two-way deal, tonight?'],
      ],
      choices: [
        { t: 'Sign the two-way with {believer}.', hint: 'NBL team + its Grind League affiliate · Summer League now', fx: { flag: 'two_way', money: 20000, rel: { priya: 3 }, post: { by: 'ehn', text: '✍️ Undrafted {name} signs a two-way deal with the {believer}.' } }, next: 'c4_twoway' },
        { t: 'Take the overseas road: a guaranteed contract in Europe.', hint: 'Real money, real minutes · Summer League first, then the flight', fx: { flag: 'overseas_road', money: 60000, rel: { priya: 2 }, post: { by: 'ehn', text: '✈️ Undrafted {name} turns down two-way offers for a deal overseas.' } }, next: 'c4_overseas' },
      ] },
    c4_twoway: { scene: 'home', lines: [['priya', 'Two-way: fifty days with the big club, the rest in the Grind League. Earn the rest.'], ['nia', 'So you\'re IN the NBL. Kind of. Mostly. I\'m telling everyone.', 'smile']], next: 'c4_awaken' },
    c4_overseas: { scene: 'home', lines: [['priya', 'Guaranteed money, starting minutes, and every NBL team can still watch you.'], ['gm_cole', '(text) Play Summer League for us first. Let them see what they passed on.']], next: 'c4_awaken' },
    /* the awakening: Chip on the Shoulder · every team that passed, marked */
    c4_awaken: { scene: 'rain_night', fx: { weapon: 'chip_shoulder' },
      lines: [
        ['narrator', 'Hotel room, 3 a.m. You write every team that passed on a hotel notepad.'],
        ['narrator', '{passedN} names. You tear the page out and fold it into your shoe.'],
      ], next: 'c4_revenge' },
    c4_revenge: { scene: 'home',
      lines: [
        ['narrator', 'Every team on that page is a marked game now. You\'ll know them on sight.'],
        ['priya', 'Summer League starts Friday. Guess who the schedule gave you first?', 'smile'],
      ], next: 'c4_summer_pre' },
    c4_summer_pre: { scene: 'arena', cutscene: (s, ctx) => CH4S.summerPre(s, ctx), seenId: 'c4_summer_pre',
      lines: [
        ['narrator', 'Summer League. Half-full stands, desert heat, and a GM from every team that passed.'],
        ['kai', '{pick}? Huh. I went {kaiPick}. Just so we\'re clear.', 'smile', { flag: 'drafted' }],
        ['kai', 'Undrafted. Wow. I\'ll go easy on you, Halsey.', 'smile', { flag: 'undrafted' }],
      ], next: 'c4_summer' },
    c4_summer: { type: 'match', us: '@sl_mine', them: '@sl_kai', ratingRel: 3, mateRel: 0, moments: 10, level: 'pro', importance: 3, venue: 'summer_league', script: 'c4_summer', camp: 'pro',
      revenge: { id: 'kai', star: 'Kai Sterling', title: 'SUMMER LEAGUE: THE RECKONING', sub: 'Every team that passed is watching' },
      title: 'Summer League', sub: 'vs {kaiTeam} · Kai Sterling', win: 'c4_summer_win', lose: 'c4_summer_win' },
    c4_summer_win: { scene: 'arena', fx: { flag: 'summer_league_win', rep: 8, fans: 30000, xp: 250, post: { by: 'courtvision', text: '🔥 Summer League isn\'t supposed to matter. Tell that to the {passedN} GMs who watched {name} cook Kai Sterling.' } },
      lines: [
        ['narrator', 'Up in the stands, a GM in a team polo puts his phone away and leaves early.'],
        ['kai', '(at the handshake) It\'s Summer League. It doesn\'t count.', 'fierce'],
        ['gm_cole', 'It counts for us.', 'smile'],
      ], next: 'c4_end_pre' },
    c4_end_pre: { scene: 'home',
      lines: [
        ['mom', 'Wherever you go, we\'re coming. I already looked up the winters.', 'smile'],
        ['narrator', 'Rookie camp opens in September. The page in your shoe is getting soft at the folds.'],
      ], next: 'c4_end' },
    c4_end: { type: 'chapterEnd', nextChapter: 'pro', nextTitle: 'Chapter 5 — The League',
      teaser: 'Next time: The League. Rookie camp, the rookie wall, and every team on that page. (Coming in a later build — your save carries over.)',
      summary: 'You enter the NBL at {ovr} Overall. {round}.',
      recap: [
        { if: { flag: 'lottery_pick' }, t: '🧢 Lottery pick: {pick} overall, {believer}' },
        { if: { flag: 'first_round', notFlag: 'lottery_pick' }, t: '🧢 First round: {pick} overall, {believer}' },
        { if: { flag: 'second_round' }, t: '🧢 Second round: {pick} overall, {believer}' },
        { if: { flag: 'two_way' }, t: '✍️ Undrafted, signed a two-way with the {believer}' },
        { if: { flag: 'overseas_road' }, t: '✈️ Undrafted, took the overseas road' },
        { if: { flag: 'combine_record' }, t: '⏱ Broke a combine record' },
        { if: { flag: 'slid_far' }, t: '📉 Slid on Draft night. You wrote down every team.' },
        { if: { flag: 'summer_league_win' }, t: '🔥 Beat Kai\'s team in Summer League' },
      ] },
  },
  moved: {},
};
