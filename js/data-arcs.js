/* =====================================================================
   DATA-ARCS.JS — the story's structure (the story overhaul, STORY.md section 0). Logic: js/story-fx.js

   STORY.chapters.<id>.arcs = [{ id, name, goal, nodes: 'id id …', order, route, climax, next, goals }]
     name / goal: text or s => text · nodes: every scene of the arc (older saves find their arc here)
     order: arcs only move forward (default: position in the list) · route: Chapter 3 road ('college' | 'overseas' | 'grind')
     next: the "Next time…" teaser played when the arc ends { who, line, scene, grade, cast } (or s => that)
     goals: redemption goals shown in the hub [{ t, done: condition }] (conditions: see js/data-story.js)
   STORY.chapters.<id>.cast: who rolls in the credits · postCredits: cutscene id (or s => id) after the credits
   STORY.openings.<chapter>: the chapter opening sequence (changes as the story moves)
   STORY.recapLines: the narrator line for each big cutscene in "Previously…"
   STORY.monologue: in-match inner monologue lines (1 short sentence each) + their visual metaphor
   ===================================================================== */
(() => {
  const C = STORY.chapters, A = (ch, list) => { if (C[ch]) C[ch].arcs = list; };

  /* ---------------- CHAPTER 1: Concrete Dreams ---------------- */
  A('street', [
    { id: 'halsey', name: 'The Halsey Park Arc', goal: 'Prove you belong on your own court.',
      nodes: 'start lou_first kai_arrives kai_trash kai_ignored pre_m1 m1 m1_win m1_loss kai_pov',
      goals: [{ t: 'Run with Kai Sterling', done: { flag: 'tutorial_done' } }, { t: 'Beat Kai', done: { flag: 'beat_kai' } }],
      next: { who: 'lou', line: 'Kid. Six a.m. Don\'t be late.', scene: 'street_night', grade: 'night', cast: [{ id: 'lou', kind: 'bust', x: .1, expr: 'neutral', rim: '#fdba74' }] } },
    { id: 'lou', name: 'The Lou Banks Arc', goal: 'Get Lou to train you. Learn the game the right way.',
      nodes: 'lou_meet lou_why lou_snub train_lou train_montage lou_story lou_laugh dee_rec home1 home1_end jam_reg tut_hub lou_cough',
      goals: [{ t: 'Train with Lou', done: { flag: 'lou_trained' } }, { t: 'Get on the list', done: { flag: 'feat_rankings' } }, { t: 'Crack the top 250', done: { rank: 250 } }],
      next: { who: 'narrator', line: 'The Summer Jam bracket goes up. Westbrook Elite, circled in red.', scene: 'poster', grade: 'red', cast: [{ id: 'kai', kind: 'bust', x: .45, sil: true, rim: '#ef4444' }] } },
    { id: 'jam', name: 'The Summer Jam Arc', goal: 'Win the Halsey Summer Jam.', climax: true,
      nodes: 'jam_intro jam_dee jam_calls jam_team jam_plan1 m2 m2_win m2_loss semi_pre m_semi semi_win jam_cel_check jam_celebrate jam_rest hub2 party_invite party_ok party_bad party_escape party_stay party_caught party_full keys_ok keys_fail crash crash2 end_crash final_morning jam_plan2 m3 m3_win jam_final_cel jam_celebrate2 m3_loss m3_rain m3_low scout_branch lou_calls no_scout dee_list_cold dee_list dee_offer hs_talk pick_westbrook pick_lincoln ranks_check ch_end',
      goals: [{ t: 'Win Round 1', done: { flag: 'jam_r1' } }, { t: 'Beat the champs', done: { flag: 'semi_win' } }, { t: 'Beat Kai in the final', done: { flag: 'summer_champ' } }] },
  ]);
  if (C.street) { C.street.cast = ['you', 'lou', 'tariq', 'kai', 'mom', 'nia', 'dee', 'silk', 'marcus', 'hammer', 'mc']; C.street.postCredits = 'pc_kai_gym'; }

  /* ---------------- CHAPTER 2: Varsity Blues ---------------- */
  /* JV goals: average 20 in the JV games · beat the JV rivals · climb back above your Summer Jam rank */
  const jvAvg = s => { const G = (s.career.games || []).filter(g => /JV Season/.test(g.label || '')); return G.length > 0 && G.reduce((t, g) => t + (g.pts || 0), 0) / G.length >= 20; };
  const jamRank = s => { const h = ((s.rank && s.rank.hist) || []).filter(x => /Summer Jam semifinal/.test(x.label || '')).pop(); return h ? h.rank : 200; };
  A('highschool', [
    { id: 'cut', name: 'The Cut Arc', goal: 'Make varsity.',
      nodes: 'start L_day1 L_tryout_pre L_tryout W_day1 W_vale W_tryout_pre W_tryout c2_cut c2_cut_after',
      goals: [{ t: 'Make varsity', done: { flag: 'called_up_v' } }],
      next: { who: 'lou', line: 'Good. Now you\'re hungry.', scene: 'locker', grade: 'dark', cast: [{ id: 'jersey', kind: 'jersey', x: .1, y: 60, s: 3, num: '00', d: 1 }] } },
    { id: 'jv', name: 'The JV Arc', goal: 'Win your spot back. Get called up.',
      nodes: 'c2_jv c2_jv1_pre c2_jv1 c2_jv1_post c2_jv2 c2_jv2_win c2_jv2_loss c2_callup c2_callup_wpn L_playbook W_playbook L_hp2_pre L_hp2 W_hp2_pre W_hp2 c2_hp2_win L_kai_hall c2_kai_pov c2_junior_branch',
      goals: [{ t: 'Average 20 in JV', test: jvAvg }, { t: 'Beat the JV rivals', done: { flag: 'jv_rivals' } }, { t: 'Climb back above your Summer Jam rank', test: s => Rankings.on(s) && Rankings.rankOf(s) <= jamRank(s) }, { t: 'Get called up', done: { flag: 'called_up_v' } }],
      next: { who: 'narrator', line: 'The Peach Slam. Five hundred coaches. And a man in a purple suit.', scene: 'arena', grade: 'gold', cast: [{ id: 'vince', kind: 'bust', x: .35, expr: 'smile', rim: '#a855f7' }] } },
    { id: 'peach', name: 'The Peach Slam Arc', goal: 'Get seen by the country.',
      nodes: 'L_season1 W_season1 L_brick L_brick_fight W_kai_freeze W_kai_talk_ok W_tariq_pre W_tariq_win W_tariq_loss c2_opener_pre c2_promoted c2_cityfinal_pre c2_jr_champ c2_jr_out c2_viral_jr L_kai1_pre L_kai1_win L_kai1_loss c2_cel_check c2_money c2_summer c2_nia_bday c2_camp c2_kai_1v1 c2_kai_1v1_win c2_kai_1v1_loss c2_kai_mark c2_kai_marked c2_bday c2_lou_aau c2_lou_team c2_lou_return c2_marcus c2_scheme c2_scheme2 end_locked c2_aau c2_aau_pre c2_vince c2_aau_final_pre c2_aau_champ c2_aau_out c2_coach_visit',
      goals: [{ t: 'Win the city', done: { flag: 'city_champ' } }, { t: 'Win the Peach Slam', done: { flag: 'aau_champ' } }, { t: 'Crack the top 100', done: { rank: 100 } }],
      next: { who: 'narrator', line: 'Senior Night banners. And a trainer, wrapping an ankle.', scene: 'gym', grade: 'blue', cast: [{ id: 'you', kind: 'hand', x: 0, y: 168, s: 3, curl: .2, tape: '#f8fafc' }] } },
    { id: 'state', name: 'The State Arc', goal: 'Win the state championship.', climax: true,
      nodes: 'c2_senior_branch L_senior_open L_season2 L_kai2_pre L_kai2_win L_kai2_loss W_senior_open W_season2 W_silk W_lincoln2_pre c2_tariq_test c2_tariq_grades c2_lou_cough c2_lou_hosp c2_scandal_check c2_booster_news c2_senior_night c2_ankle c2_rehab c2_pills c2_semi_pre c2_injury c2_injury_worse c2_mom_hurt c2_semi_talk c2_broken end_broken c2_final_pre c2_state_champ c2_trophy c2_state_out c2_state_missed c2_offers c2_graduation ch_end',
      goals: [{ t: 'Win the state championship', done: { flag: 'state_champ' } }] },
  ]);
  if (C.highschool) { C.highschool.cast = ['you', 'lou', 'tariq', 'kai', 'mom', 'nia', 'brennan', 'graves', 'brick', 'vale', 'silk', 'vince', 'marcus']; C.highschool.postCredits = 'pc_reyes'; }

  /* ---------------- INTERLUDE: Red, White & Hoops ---------------- */
  A('usa', [
    { id: 'camp', name: 'The Selection Camp Arc', goal: 'Make the national team.',
      nodes: 'second_chance invite_check invite invite_home no_invite tryout_pre tryout_game tryout_last not_this_year late_invite arrive meet_staff meet_campers kai_camp board_intro day1_drills day1_dorm day1_film day1_board day2_scrim_pre day2_scrim day2_scrim_win day2_scrim_loss cut1_pre cut1 cut1_safe day3_drills day3_dorm day3_dorm_bad day3_3v3_pre day3_3v3 day3_3v3_win day3_3v3_loss eval final_cut_pre final_cut made_team kai_teammates jersey cut_home cut_lou cut_watch chem_dre jelly_stuffed jelly_meet jelly_meet2 jelly_lesson_pre jelly_lesson jelly_learned jelly_scrim_pre jelly_scrim jelly_check jelly_drop jelly_notyet jelly_cut_check jelly_cut_lesson_pre jelly_cut_lesson jelly_cut_learned jelly_cut_bye',
      next: { who: 'narrator', line: 'Twelve countries. Twelve flags. One gold medal.', scene: 'arena', grade: 'gold', cast: [{ id: 'kai', kind: 'bust', x: .3, expr: 'determined', rim: '#93c5fd' }] } },
    { id: 'world', name: 'The World Youth Arc', goal: 'Bring home the gold.', climax: true,
      nodes: 'travel hotel anthem g1 g1_win g1_loss g2 g2_post g3 group_check out_group qf_pre qf out_qf sf_pre sf bronze_pre bronze final_pre final medal_gold medal_silver medal_bronze fourth tour_end return_home usa_end' },
  ]);
  if (C.usa) C.usa.cast = ['you', 'kai', 'lou', 'dee', 'mom', 'tariq'];

  /* ---------------- CHAPTER 3: The Next Level (three roads) ---------------- */
  const END3 = ' c3_declare c3_end';
  A('college', [
    { id: 'decision', name: 'The Decision Arc', goal: 'Pick your road: college, overseas or the Grind League.',
      nodes: 'start c3_crossroads cc_start cc_offers_talk cc_choose cc_signing oo_start oo_offers oo_goodbye gg_start',
      next: s => ({ college: { who: 'narrator', line: 'A campus, a dorm room and twenty thousand strangers in the stands.', scene: 'arena', grade: 'gold' },
        overseas: { who: 'narrator', line: 'A new city. A language you don\'t speak. A club that pays you to win.', scene: 'city', grade: 'night' },
        grind: { who: 'narrator', line: 'Bus rides, motel rooms and a call-up that might never come.', scene: 'highway', grade: 'night' } })[s.career.path] || null },
    { id: 'freshman', route: 'college', order: 2, name: 'The Freshman Arc', goal: 'Earn minutes. Earn the coach.',
      nodes: 'cc_kai_news cc_movein cc_roommate cc_usa_mate cc_coach cc_first_practice cc_class cc_media_day cc_hub1 cc_season cc_opener_pre cc_nil cc_road_pre cc_road_win cc_road_loss cc_kai_pre cc_kai_win cc_kai_loss cc_wt cc_jelly_check cc_jelly_pre cc_jelly_lesson cc_jelly_done cc_midterms cc_midterms_fail cc_rival_pre cc_lou_visit cc_homesick cc_top5_pre cc_conf_final_pre cc_conf_champ cc_conf_out',
      next: { who: 'narrator', line: 'Sixty-eight teams. Six wins. One shining moment.', scene: 'arena', grade: 'gold' } },
    { id: 'import', route: 'overseas', order: 2, name: 'The Import Arc', goal: 'Win the locker room. Win the city.',
      nodes: 'oo_arrival oo_lena oo_apartment oo_coach oo_marko oo_practice oo_scrim oo_scrim_win oo_scrim_loss oo_language oo_kai_news oo_hub1 oo_season oo_debut_pre oo_bench oo_bench_ok oo_road_pre oo_tough_pre oo_tough_win oo_tough_loss oo_wt oo_jelly_check oo_jelly_pre oo_jelly_lesson oo_jelly_done oo_homesick oo_star_pre oo_trust oo_derby_pre oo_final_pre oo_league_champ oo_league_out',
      next: { who: 'narrator', line: 'The Cup. Every club on the continent wants it.', scene: 'arena', grade: 'gold' } },
    { id: 'grind', route: 'grind', order: 2, name: 'The Grind Arc', goal: 'Survive the Grind League. Get seen.',
      nodes: 'gg_bus gg_contract gg_coach gg_dez gg_ike gg_kai_news gg_motel gg_scrim gg_scrim_win gg_scrim_loss gg_hub1 gg_season gg_opener_pre gg_paycheck gg_vets_pre gg_vets_win gg_vets_loss gg_wt gg_jelly_check gg_jelly_pre gg_jelly_lesson gg_jelly_done gg_breakdown gg_kai_pre gg_kai_win gg_kai_loss gg_scouts gg_road_pre gg_showcase_pre gg_final_pre gg_champ gg_out',
      next: { who: 'narrator', line: 'One phone call. That\'s all it takes.', scene: 'highway', grade: 'night' } },
    { id: 'march', route: 'college', order: 3, name: 'The March Arc', goal: 'Win six straight in March.', climax: true,
      nodes: 'cc_selection cc_selection_show cc_first_weekend cc_hub2 cc_march cc_final_four_pre cc_title_pre cc_title_win cc_march_out cc_decide cc_soph cc_soph_end' + END3 },
    { id: 'cup', route: 'overseas', order: 3, name: 'The Cup Arc', goal: 'Lift the Cup.', climax: true,
      nodes: 'oo_cup_intro oo_cup oo_cup_final_pre oo_cup_champ oo_cup_out oo_showcase_pre oo_showcase oo_show_win oo_show_loss oo_decide oo_stay oo_stay_end' + END3 },
    { id: 'callup', route: 'grind', order: 3, name: 'The Call-Up Arc', goal: 'Get the call. Make it count.', climax: true,
      nodes: 'gg_callup_check gg_callup gg_callup_pre gg_callup_game gg_callup_win gg_callup_loss gg_back gg_no_callup gg_decide' + END3 },
  ]);
  if (C.college) C.college.cast = ['you', 'lou', 'tariq', 'kai', 'mom', 'nia', 'dee'];

  /* ---------------- CHAPTER OPENINGS (20–30s: theme, the cast as silhouettes, Kai turning, your number, your silhouette) ----------------
     you: how much of your silhouette is still shadow (1 = all shadow; it sharpens chapter by chapter) */
  STORY.openings = {
    street: { scene: 'street_sunset', grade: 'sunset', place: '{hometown}', sub: 'Halsey Street Courts', cast: ['mom', 'nia', 'tariq', 'lou'], rivals: [], you: 1, rim: '#fdba74',
      court: { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 } },
    highschool: { scene: 'gym', grade: 'blue', place: '{hs}', sub: 'Sophomore year', cast: ['mom', 'nia', 'tariq', 'lou', 'dee'], rivals: ['vale', 'holt', 'silk'], you: .62, rim: '#93c5fd', night: true, court: '@venue' },
    usa: { scene: 'arena', grade: 'gold', place: 'USA Basketball', sub: 'Selection camp', cast: ['mom', 'lou', 'dee', 'tariq'], rivals: ['dre', 'jet', 'ike'], you: .32, rim: '#fde68a', night: true, court: 'college_arena' },
    college: { scene: 'arena', grade: 'red', place: 'The Next Level', sub: 'One year to prove it', cast: ['mom', 'nia', 'lou', 'tariq', 'dee'], rivals: ['dez', 'vance'], you: .1, rim: '#fca5a5', night: true, court: 'college_arena' },
  };

  /* ---------------- "PREVIOUSLY…" narrator lines for the big cutscenes ---------------- */
  STORY.recapLines = {
    kai_showdown: 'Kai Sterling came to Halsey Street and called it small.',
    scouted: 'Dee Carter wrote your name in her notebook.',
    varsity: 'Your name went up on the varsity list.',
    state_champ: 'State champions. Twelve thousand people saw it.',
    injury: 'Then you heard the sound. Everything stopped.',
    usa_arrival: 'Selection camp. The best in the country, all in one gym.',
    usa_cutday: 'Cut day. Not everyone got to stay.',
    usa_anthem: 'You wore the red, white and blue.',
    usa_gold: 'Gold. The whole world watched.',
    usa_silver: 'Silver. So close it still hurts.',
    usa_bronze: 'Bronze. You fought for every inch of it.',
    c3_signing: 'You signed your name and picked your road.',
    c3_campus: 'A new campus. A new start.',
    c3_abroad: 'A new city, half a world from home.',
    c3_bus: 'The Grind League. Long bus rides. Short paychecks.',
    c3_kai: 'Kai Sterling, again.',
    c3_selection: 'Selection Sunday. Your name came up.',
    c3_champs: 'Champions. One shining moment.',
    c3_callup: 'The call came.',
    _cut: 'Your name wasn\'t on the varsity list.', _callup: 'Then the coach came to the JV gym. "Varsity. Friday."', _hp2: 'Halsey Park II. You beat Kai in front of Silk.',
    mom_money: 'Mom got hurt at work. Rent was due.', lou_hospital: 'Lou went into the hospital.', ankle: 'Then your ankle went. The week before the tournament.', trophy_lou: 'You carried the trophy to Lou\'s room.', pc_reyes: 'Coach Reyes signed a letter.',
    pc_kai_gym: 'Kai Sterling, alone in a gym at 2 a.m.',
  };

  /* ---------------- IN-MATCH INNER MONOLOGUE (big plays: the final possession, the jelly moment, the Jam's clutch) ---------------- */
  STORY.monologue = {
    final: [
      { lines: ['Everybody in here knows who takes this.', 'Good.', 'Let them watch.'], metaphor: 'eyes' },
      { lines: ['He thinks I\'m going left.', 'I went left the last three times.', 'Not this one.'], metaphor: 'puzzle' },
      { lines: ['The noise is gone.', 'It\'s just me and him now.', 'Same as Halsey Street.'], metaphor: 'void' },
      { lines: ['Breathe.', 'You\'ve taken this shot ten thousand times.', 'Take it once more.'], metaphor: 'void' },
    ],
    final_def: [
      { lines: ['He wants the last shot.', 'He has to go through me.'], metaphor: 'void' },
      { lines: ['Watch his hips, not the ball.', 'He always looks before he goes.', 'There.'], metaphor: 'puzzle' },
    ],
    jelly: [
      { lines: ['The big man\'s waiting at the rim.', 'Around him. Not through him.', 'Soft hands.'], metaphor: 'puzzle' },
      { lines: ['He\'s already jumping.', 'Too early.'], metaphor: 'eyes' },
    ],
    jam: [
      { lines: ['Halsey Street is watching.', 'Every one of them.', 'Make it count.'], metaphor: 'eyes' },
      { lines: ['This is your court.', 'Nobody takes it from you.'], metaphor: 'void' },
    ],
  };
})();

/* ---------------- POST-CREDITS: Chapter 1 — Kai, alone in Westbrook's gym at 2 a.m. ---------------- */
window.EXTRA_CUTSCENES = Object.assign(window.EXTRA_CUTSCENES || {}, { pc_kai_gym: { name: '2 A.M.', chapter: 'Chapter 1 · after the credits', shots: [
  { d: 2200, scene: 'void', music: null, tr: 'fade', title: { text: 'Westbrook Prep · 2:04 a.m.', style: 'line', at: 300 }, ev: [[0, 'sfx', 'heartbeat']] },
  { d: 3400, scene: 'gym', grade: 'spot', dim: .95, empty: true, cam: [[0, -40, -6, 1.15], [1, 10, -2, 1.28, 'lin']], music: 'kai',
    cast: [{ id: 'kai', kind: 'actor', x: -.1, y: 72, s: 2.4, ball: true, path: [[0, -.25], [1600, .05], [3400, .05]] }],
    ev: [[1700, 'act', 'kai', 'spin', 99], [1700, 'sfx', 'whoosh']] },
  { d: 2600, scene: 'gym', grade: 'spot', dim: .9, empty: true, cam: [[0, 0, 30, 1.0], [1, 0, 34, 1.08]],
    cast: [{ id: 'kai', kind: 'hand', x: 0, y: 160, s: 3.2, ball: true, shake: .5, tape: '#dc2626' }],
    say: ['narrator', 'His hands are taped. The tape is red.'], ev: [[300, 'sfx', 'bounce', .7], [1300, 'sfx', 'bounce', .7]] },
  { d: 3000, scene: 'gym', grade: 'spot', dim: .9, empty: true, cam: [[0, 0, -10, 1.2], [1, 0, -4, 1.32, 'io']], rot: .08,
    cast: [{ id: 'kai', kind: 'bust', x: .1, expr: 'determined', rim: '#93c5fd' }],
    say: ['silk', 'Again tomorrow.'], ev: [[1800, 'flicker', 700], [2300, 'dim', 1, 500], [2300, 'sfx', 'thud', .6]] },
  { d: 2600, scene: 'gym', grade: 'dark', dim: 1, empty: true, cam: [[0, 0, -6, 1.32], [1, 0, -10, 1.42]],
    cast: [{ id: 'kai', kind: 'face', x: 0, expr: 'determined', rim: '#93c5fd' }],
    ev: [[700, 'glint', 'kai'], [1600, 'sfx', 'bounce', .5]], title: { text: 'Kai doesn\'t move.', style: 'line', at: 900 } },
] } });
