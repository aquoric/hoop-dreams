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
  /* return_home / usa_end belong to no arc: the pro-am road ends without the World Youth card */
  A('usa', [
    { id: 'camp', name: 'The Selection Camp Arc', goal: 'Make the twelve.',
      nodes: 'invite_check invite invite_home no_invite tryout_pre tryout_game tryout_last late_invite not_this_year proam_pre proam_game proam_win proam_loss kai_tv second_chance arrive meet_staff meet_campers kai_camp board_intro board_cam day1_drills day1_dorm day1_film day1_board day2_scrim_pre day2_scrim day2_scrim_win day2_scrim_loss ike_after chem_dre scoop_intro scoop_intro2 jelly_lesson_pre jelly_lesson jelly_learned jelly_learned_next cut1_pre cut1 cut1_safe jelly_after_cut jelly_scrim_pre jelly_scrim jelly_check jelly_drop jelly_notyet day3_drills day3_dorm day3_dorm_bad day3_3v3_pre day3_3v3 day3_3v3_win day3_3v3_loss eval final_cut_pre final_cut final_cut_after cam_bye made_team kai_teammates jersey cut_home jelly_cut_check jelly_cut_lesson_pre jelly_cut_lesson jelly_cut_learned jelly_cut_bye cut_lou cut_watch',
      goals: [{ t: 'Get the invite', done: { flag: 'usa_camp' } }, { t: 'Learn the jelly', done: { flag: 'jelly' } }, { t: 'Make the twelve', done: { flag: 'usa_made' } }],
      next: { who: 'narrator', line: 'Riga. Flags in the rafters. And you, in a warmup jacket, sitting.', scene: 'arena', grade: 'night',
        cast: [{ id: 'bench', kind: 'bench', x: 0, y: 72, s: 2.8, w: 30, d: 1 }, { id: 'you', kind: 'actor', x: 0, y: 72, s: 2.8, acts: [[0, 'bench', 99]] }] } },
    { id: 'world', name: 'The World Youth Arc', goal: 'Get on the floor.', climax: true,
      nodes: 'travel hotel anthem wy_group wy_group_post wy_qf wy_sf wy_kai_pov final_pre wy_final_open wy_final wy_gold out_group out_qf bronze_pre bronze medal_gold medal_silver medal_bronze fourth tour_end',
      goals: [{ t: 'Get on the floor', done: { flag: 'usa_final_in' } }, { t: 'Win gold', done: { flag: 'usa_gold' } }] },
  ]);
  if (C.usa) { C.usa.cast = ['you', 'reyes', 'sal', 'kai', 'dre', 'ike', 'milo', 'cam', 'jet', 'okafor', 'mbaye', 'bakari', 'lou', 'mom']; C.usa.postCredits = 'pc_kai_airport'; }

  /* ---------------- CHAPTER 3: The Next Level (three roads; route arcs only show on their road) ---------------- */
  const END3 = ' c3_declare c3_end';
  const HOME3 = ' c3_home c3_tariq c3_tariq_door c3_home_after';
  const MEND3 = ' c3_mend_check c3_mend c3_mend_hug c3_mend_no c3_mend_after';
  const evolved = s => Engine.weapons(s).some(w => w.evo > 1);
  const sharedClimax = [{ t: 'Beat Kai Sterling', done: { flag: 'beat_kai_c3' } }, { t: 'Crack the top 10', done: { rank: 10 } }, { t: 'Make it right with Tariq', done: { flag: 'tariq_mended' } }];
  A('college', [
    { id: 'decision', name: 'The Decision Arc', goal: 'Pick your road. Make it to opening night.',
      nodes: 'start c3_crossroads cc_start cc_offers_talk cc_choose cc_juco cc_signing cc_kai_news cc_movein cc_roommate cc_usa_mate cc_coach cc_first_practice cc_class cc_media_day cc_hub1 ' +
        'oo_start oo_offers oo_goodbye oo_arrival oo_lena oo_apartment oo_coach oo_marko oo_practice oo_scrim oo_scrim_win oo_scrim_loss oo_language oo_kai_news oo_hub1 ' +
        'gg_start gg_bus gg_contract gg_coach gg_dez gg_ike gg_kai_news gg_motel gg_scrim gg_scrim_win gg_scrim_loss gg_hub1',
      goals: s => [{ t: 'Pick your road', done: { flag: s.career.path === 'overseas' ? 'signed_pro' : s.career.path === 'grind' ? 'gl_v2' : 'signed_nli' } }],
      next: s => ({ college: { who: 'narrator', line: 'A door that stays closed. A booster on the evening news.', scene: 'locker', grade: 'dark', cast: [{ id: 'ccoach', kind: 'bust', x: .3, sil: true, rim: '#94a3b8' }] },
        overseas: { who: 'narrator', line: 'A paycheck that doesn\'t come. Teammates whispering in a language you don\'t speak.', scene: 'city', grade: 'night', cast: [{ id: 'marko', kind: 'bust', x: .3, sil: true, rim: '#a78bfa' }] },
        grind: { who: 'narrator', line: 'Dez goes quiet. A scout walks right past you to shake his hand.', scene: 'highway', grade: 'night', cast: [{ id: 'dez', kind: 'bust', x: .3, sil: true, rim: '#fbbf24' }] } })[s.career.path] || null },
    /* the setback arcs */
    { id: 'newcoach', route: 'college', order: 2, name: 'The New Coach Arc', goal: 'Win your spot back.',
      nodes: 'cc_season cc_opener_pre cc_nil cc_road_pre cc_road_win cc_road_loss cc_phone cc_news cc_fired cc_fired_how cc_benched_well cc_benched_bad cc_wt cc_jelly_check cc_jelly_pre cc_jelly_lesson cc_jelly_done cc_climb ' +
        'cc_squad_pre cc_squad cc_squad_win cc_squad_loss cc_awaken cc_rival_pre cc_oldcoach_pre cc_oldcoach_win cc_oldcoach_loss c3_kai_pov cc_kai_pre cc_kai_win cc_kai_loss cc_midterms cc_midterms_fail cc_lou_visit cc_homesick cc_top5_pre',
      goals: [{ t: 'Beat the starters in practice', done: { flag: 'squad_won' } }, { t: 'Evolve your weapon', test: evolved }, { t: 'Win back the coach\'s trust', done: { minTrust: 60 } }, { t: 'Beat your old coach\'s new school', done: { flag: 'beat_oldcoach' } }],
      next: { who: 'narrator', line: 'March. A bus home, a broken streetlight, and an old friend waiting under it.', scene: 'rain_night', grade: 'night', cast: [{ id: 'tariq', kind: 'bust', x: .35, sil: true, rim: '#93c5fd' }] } },
    { id: 'unpaid', route: 'overseas', order: 2, name: 'The Unpaid Arc', goal: 'Keep playing when nobody pays you.',
      nodes: 'oo_season oo_debut_pre oo_bench oo_bench_ok oo_road_pre oo_late_pay oo_whispers oo_unpaid oo_unpaid_how oo_unpaid_well oo_unpaid_bad oo_choice oo_stay_unpaid oo_loan_pre oo_loan oo_loan_back ' +
        'oo_wt oo_jelly_check oo_jelly_pre oo_jelly_lesson oo_jelly_done oo_climb oo_tough_pre oo_tough_win oo_tough_loss oo_tough_after oo_awaken oo_rich_pre oo_rich_win oo_rich_loss c3_kai_pov oo_homesick oo_star_pre oo_trust oo_derby_pre',
      goals: [{ t: 'Stay on the floor', test: s => !!(s.flags.unpaid_stayed || s.flags.loan_move) }, { t: 'Evolve your weapon', test: evolved }, { t: 'Beat the club that lowballed you', done: { flag: 'beat_rich' } }],
      next: { who: 'narrator', line: 'Fifteen thousand people. Flares in the upper deck. A city split in two.', scene: 'arena', grade: 'red' } },
    { id: 'stolen', route: 'grind', order: 2, name: 'The Stolen Call-Up Arc', goal: 'Get a jersey back.',
      nodes: 'gg_season gg_opener_pre gg_paycheck gg_vets_pre gg_vets_win gg_vets_loss gg_vets_after gg_quiet gg_quiet_ask gg_scout_dez gg_stolen gg_stolen_how gg_waived_well gg_waived_bad gg_couch gg_wt2 gg_jelly_check2 gg_jelly_pre gg_jelly_lesson gg_jelly_done gg_jelly_after gg_climb gg_hub_w ' +
        'gg_warehouse_pre gg_warehouse gg_warehouse_win gg_warehouse_loss gg_dez_notes gg_tryout_pre gg_tryout gg_signed_late gg_signed gg_awaken gg_kai_pov gg_season2 gg_hustle_pre gg_wt gg_jelly_check gg_breakdown gg_kai_pre gg_kai_win gg_kai_loss gg_scouts gg_road_pre gg_showcase_pre',
      goals: [{ t: 'Win at the Warehouse', done: { flag: 'dez_notes' } }, { t: 'Sign a new contract', done: { flag: 'gl_resigned' } }, { t: 'Evolve your weapon', test: evolved }],
      next: { who: 'narrator', line: 'The playoff bracket goes up. First round: the team that cut you.', scene: 'gym', grade: 'red', cast: [{ id: 'gcoach', kind: 'bust', x: .35, sil: true, rim: '#ef4444' }] } },
    /* the climax arcs */
    { id: 'march', route: 'college', order: 3, name: 'The March Arc', goal: 'Knock off No. 1. Survive March.', climax: true,
      nodes: 'cc_march_open' + HOME3 + ' cc_kai_show_pre cc_kai_show cc_kai_show_win cc_kai_show_loss cc_conf_final_pre cc_conf_champ cc_conf_out cc_selection cc_selection_show cc_first_weekend cc_upset_pre cc_upset cc_upset_win' + MEND3 +
        ' cc_hub2 cc_march cc_final_four_pre cc_title_pre cc_title_win cc_march_out cc_decide cc_soph cc_soph_end' + END3,
      goals: [{ t: 'Knock off the No. 1 team', done: { flag: 'beat_no1' } }].concat(sharedClimax, [{ t: 'Win it all', done: { flag: 'national_champ' } }]) },
    { id: 'cup', route: 'overseas', order: 3, name: 'The Cup Arc', goal: 'Win the derby. Lift the Cup.', climax: true,
      nodes: 'oo_arc3' + HOME3 + ' oo_derby2_pre oo_derby oo_derby_win' + MEND3 + ' oo_post_derby oo_final_pre oo_league_champ oo_league_out oo_cup_intro oo_cup oo_cup_final_pre oo_cup_champ oo_cup_out oo_showcase_pre oo_showcase oo_show_win oo_show_loss oo_decide oo_stay oo_stay_end' + END3,
      goals: [{ t: 'Win the derby', done: { flag: 'derby_win' } }].concat(sharedClimax, [{ t: 'Lift the Continental Cup', done: { flag: 'cup_champ' } }]) },
    { id: 'callup', route: 'grind', order: 3, name: 'The Call-Up Arc', goal: 'Earn the call-up back. Win in the NBL.', climax: true,
      nodes: 'gg_arc3' + HOME3 + ' gg_kai2_pre gg_kai2 gg_kai2_win gg_kai2_loss gg_final_pre gg_champ gg_out gg_callup_check gg_callup gg_callup_pre gg_callup_game gg_callup_win gg_callup_loss' + MEND3 + ' gg_back gg_no_callup gg_decide' + END3,
      goals: [{ t: 'Earn the call-up back', done: { flag: 'called_up' } }, { t: 'Win an NBL game', done: { flag: 'nbl_win' } }].concat(sharedClimax) },
  ]);
  if (C.college) { Object.defineProperty(C.college, 'cast', { configurable: true, get() { const s = typeof Game !== 'undefined' && Game.state, p = s && s.career.path;
      return ['you', 'sal', 'kai', 'tariq', 'mom', 'nia', 'lou'].concat(p === 'overseas' ? ['marko', 'lena', 'ocoach', 'priya'] : p === 'grind' ? ['dez', 'ike', 'gcoach', 'priya'] : ['ccoach', 'vance', 'rook', 'advisor']); } });
    C.college.postCredits = 'pc_lottery'; }

  /* ---------------- CHAPTER 4: The Draft ---------------- */
  const mockAt = n => s => typeof Draft !== 'undefined' && Draft.mock(s) <= n;
  A('draft', [
    { id: 'combine', name: 'The Combine Arc', goal: 'Climb the Combine Leaderboard. Pass the interviews and the medicals.',
      nodes: 'start c4_open combine_intro c4_measure c4_whisper c4_drills c4_scrim_pre c4_scrim c4_scrim_win c4_scrim_loss c4_int_pre c4_int1 c4_int2 c4_int3 c4_medicals c4_med_honest c4_med_flag c4_med_clear c4_med_hide c4_med_caught c4_combine_end',
      goals: [{ t: 'Run the combine', test: s => !!(s.draft && Object.keys(s.draft.combine || {}).length >= 5) }, { t: 'Win the combine scrimmage', done: { flag: 'c4_scrim_won' } }, { t: 'Win over two GMs in interviews', test: s => ['dt_1', 'dt_2', 'dt_3'].filter(f => s.flags[f]).length >= 2 }],
      next: { who: 'priya', line: 'Three teams, three gyms, three chances. And one of them is lying to us.', scene: 'gym', grade: 'blue', cast: [{ id: 'priya', kind: 'bust', x: .3, expr: 'smile', rim: '#22d3ee' }] } },
    { id: 'workout', name: 'The Workout Arc', goal: 'Win your workouts. Climb the mock draft.',
      nodes: 'c4_workouts c4_wk1_pre c4_wk1 c4_wk1_post c4_priya c4_priya_burn c4_wk2_pre c4_wk2 c4_wk2_post c4_kai_pov c4_wk3_pre c4_wk3 c4_wk3_post c4_hub c4_mock c4_eve',
      goals: [{ t: 'Play three team workouts', test: s => !!(s.draft && Object.keys(s.draft.workouts || {}).length >= 3) }, { t: 'Crack the first round of the mock draft', test: mockAt(30) }, { t: 'Crack the lottery', test: mockAt(14) }],
      next: { who: 'narrator', line: 'A green room. A dress Mom bought for one night. And a phone that won\'t ring.', scene: 'arena', grade: 'dark', cast: [{ id: 'ph', kind: 'phone', x: 0, y: 70, s: 4 }] } },
    { id: 'night', name: 'The Draft Night Arc', goal: 'Hear your name called.', climax: true,
      nodes: 'c4_draft c4_drafted c4_undrafted c4_twoway c4_overseas c4_awaken c4_revenge c4_summer_pre c4_summer c4_summer_win c4_end_pre c4_end',
      goals: [{ t: 'Get drafted (or find another road)', test: s => !!(s.flags.drafted || s.flags.two_way || s.flags.overseas_road) }, { t: 'Beat Kai\'s team in Summer League', done: { flag: 'summer_league_win' } }] },
  ]);
  if (C.draft) { C.draft.cast = ['you', 'priya', 'kai', 'silk', 'mom', 'nia', 'gm_cole', 'gm_park', 'gm_ruiz', 'doc', 'commish', 'lou', 'dee']; C.draft.postCredits = s => CH4S.postCredits(s); }

  /* ---------------- CHAPTER OPENINGS (20–30s: theme, the cast as silhouettes, Kai turning, your number, your silhouette) ----------------
     you: how much of your silhouette is still shadow (1 = all shadow; it sharpens chapter by chapter) */
  STORY.openings = {
    street: { scene: 'street_sunset', grade: 'sunset', place: '{hometown}', sub: 'Halsey Street Courts', cast: ['mom', 'nia', 'tariq', 'lou'], rivals: [], you: 1, rim: '#fdba74',
      court: { base: 'street_night', sky: 'sunset', lights: null, crowd: 0 } },
    highschool: { scene: 'gym', grade: 'blue', place: '{hs}', sub: 'Sophomore year', cast: ['mom', 'nia', 'tariq', 'lou', 'dee'], rivals: ['vale', 'holt', 'silk'], you: .62, rim: '#93c5fd', night: true, court: '@venue' },
    usa: { scene: 'arena', grade: 'gold', place: 'USA Basketball', sub: 'Selection camp', cast: ['mom', 'lou', 'dee', 'tariq'], rivals: ['mbaye', 'ike', 'jet'], you: .32, rim: '#fde68a', night: true, court: 'college_arena' },
    college: { scene: 'arena', grade: 'red', place: 'The Next Level', sub: 'One year to prove it', cast: ['mom', 'nia', 'lou', 'tariq', 'dee'], rivals: ['dez', 'vance'], you: .1, rim: '#fca5a5', night: true, court: 'college_arena' },
    draft: { scene: 'arena', grade: 'gold', place: 'The NBL Draft', sub: 'Sixty names', cast: ['mom', 'nia', 'priya', 'lou', 'tariq'], rivals: ['vance', 'silk'], you: .04, rim: '#fde68a', night: true, court: 'combine' },
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
    _usa_roster: 'Twelve names on one sheet. Yours was one of them.', _wy_group: 'Three games in Riga. Your warmup never came off.', wy_kai_call: 'Silk called Kai at 1 a.m.',
    _wy_final_open: 'Then Reyes turned around. "You. Now."', _wy_gold: 'The jelly over Bakari. Gold.', _usa_kai_tv: 'Kai won gold. You watched it on TV.', pc_kai_airport: 'Kai, alone at the gate, watching your highlight.',
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
    c3_fired: 'Your coach got fired on live TV. The new one benched you.', c3_unpaid: 'The club stopped paying. The heat went off.', c3_waived: 'The call-up went to Dez. Then they waived you.',
    c3_scoop: 'Scoop found you at midnight and handed you homework.', _c3_kai_benched: 'Kai Sterling sat a whole half for the first time.', c3_tariq_rain: 'Tariq walked away in the rain.',
    _c4_combine: 'The combine. Four hundred scouts and one leaderboard.', _c4_kai: 'Silk told Kai: number one, or don\'t report.', _c4_green: 'Draft night. Table nine.', _c4_dn_slide: 'The phone never rang. Pick after pick.',
    _c4_dn_call: 'Then it did.', _c4_dn_undrafted: 'Sixty names. None of them yours.', _c4_summer: 'Summer League. Kai, and every team that passed.', pc_kai_practice: 'Kai\'s first practice. Rebounds and water.',
    c3_tariq_hug: 'You made it right with Tariq.', _upset: 'You knocked off No. 1.', _derby: 'You won the derby in front of 15,000.', _nbl: 'Your first NBL win.', pc_lottery: 'A GM at the lottery said your name. Then Kai\'s.',
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
    jelly_void: [
      { lines: ['The noise drops out.', 'Just you and the seven-footer.', 'He\'s already in the air.'], metaphor: 'void' },
      { lines: ['Three quarters on the bench.', 'None of that matters now.', 'Only him, only the rim.'], metaphor: 'void' },
    ],
    jelly_puzzle: [
      { lines: ['His arm comes up on the left.', 'Scoop\'s voice: around him.', 'Right side, soft.'], metaphor: 'puzzle' },
      { lines: ['Hide the ball.', 'Wait for the jump.', 'Kiss it off the glass.'], metaphor: 'puzzle' },
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
