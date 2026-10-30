/* =====================================================================
   SEASON.JS — reusable season engine (pure logic, no DOM).
   Schedule → simulated league results → standings → playoff bracket.
   Used by high school now; built to be reused by college / pro / overseas.

   A season is defined in story data (node type 'season'):
   season: {
     id, name, level:'hs', user:'lincoln', teams:[team ids], mateRating,
     ratings:{ teamId: rating },                    // optional overrides of LOCAL_TEAMS[id].rating
     schedule:[ { opp, key, title, importance, moments, pre:'node', post:{win,lose} } ],  // one per week
     interrupts:{ 3:'nodeId' },                       // story beat before week N (0-based)
     playoff:{ teams:4|8, name:'City Playoffs', rounds:['Semifinal','Final'], moments:[10,12], pre:{ roundIndex:'node' } },
   }
   The pros (Chapter 5, js/pro.js) add: confs:{ teamId:'East'|'West' } (standings by conference, 8 seeds a side),
   playoff.bestOf:7 (series: every game is played or simmed, sa/sb = wins), playoff.fixedWin: a round index the story
   always wins (its clincher is played with playoff.script) · playoff.forceIn: the user always makes the field.
   ===================================================================== */
const Season = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LEVEL_AVG = { street: 42, hs: 50, aau: 55, college: 62, euro: 64, dev: 62, pro: 76 };

  /* ---------- ratings ---------- */
  function baseRating(se, id) { return (se.ratings && se.ratings[id]) || (LOCAL_TEAMS[id] && LOCAL_TEAMS[id].rating) || 50; }
  function userRating(s, se) { const pro = se.level === 'pro'; return pro ? baseRating(se, se.user) + (role(s) === 'Bench' ? 0 : (Engine.ovr(s) - 70) * .15) + ((s.meta.chem || 50) - 50) * .04   // the pros: your team's rating, a little of you, chemistry
    : baseRating(se, se.user) * 0.5 + Engine.ovr(s) * 0.5 + (role(s) === 'Starter' ? 1.5 : 0); }
  function rating(s, se, id) { return id === se.user ? userRating(s, se) : baseRating(se, id) + DIFFICULTY[s.difficulty].opp * 0.5; }
  function winProb(ra, rb) { return 1 / (1 + Math.pow(10, -(ra - rb) / 14)); }
  /* Player role from coach trust (affects minutes, moments and sim stats) */
  function role(s) { const t = s.meta.trust; return s.flags.franchise ? 'Franchise Star' : s.flags.starter || t >= 60 ? 'Starter' : t >= 40 ? 'Sixth Man' : 'Bench'; }
  function roleFactor(s) { return { 'Franchise Star': 1.15, Starter: 1, 'Sixth Man': 0.8, Bench: 0.6 }[role(s)]; }

  function score(level, ra, rb, aWins) {
    const base = (Match.LEVELS[level] || Match.LEVELS.hs).pts;
    let a = Math.round(base + rnd(-9, 9) + (ra - rb) * 0.25), b = Math.round(base + rnd(-9, 9) - (ra - rb) * 0.25);
    if (aWins && a <= b) a = b + Math.ceil(rnd(1, 9)); if (!aWins && b <= a) b = a + Math.ceil(rnd(1, 9));
    return [a, b];
  }

  /* ---------- creation ---------- */
  function create(s, def) {
    const se = {
      id: def.id, name: def.name, level: def.level || 'hs', user: def.user, teams: def.teams.slice(), ratings: def.ratings || null,
      def, week: 0, phase: 'regular', shown: {}, standings: {}, results: [], playoffs: null, result: null,
      stats: { gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, w: 0, l: 0 },
    };
    se.teams.forEach(id => se.standings[id] = { w: 0, l: 0, pf: 0, pa: 0, last: [] });
    return se;
  }

  /* ---------- results bookkeeping ---------- */
  function record(se, a, b, sa, sb, week, user) {
    const A = se.standings[a], B = se.standings[b];
    if (A && B) {
      A.pf += sa; A.pa += sb; B.pf += sb; B.pa += sa;
      if (sa > sb) { A.w++; B.l++; A.last.push('W'); B.last.push('L'); } else { B.w++; A.l++; A.last.push('L'); B.last.push('W'); }
      A.last = A.last.slice(-5); B.last = B.last.slice(-5);
    }
    se.results.push({ week, a, b, sa, sb, user: !!user });
  }
  function simGame(s, se, a, b) {
    const ra = rating(s, se, a), rb = rating(s, se, b), aw = Math.random() < winProb(ra, rb);
    return score(se.level, ra, rb, aw);
  }
  /* Simulate every other game this week (round-robin style random pairings). */
  function simOthers(s, se) {
    const g = se.def.schedule[se.week];
    const pool = se.teams.filter(t => t !== se.user && t !== (g && g.opp)).sort(() => Math.random() - 0.5);
    for (let i = 0; i + 1 < pool.length; i += 2) { const [x, y] = simGame(s, se, pool[i], pool[i + 1]); record(se, pool[i], pool[i + 1], x, y, se.week); }
  }
  /* User game finished (played or simmed). box = user stat line. */
  function finishUserWeek(s, se, us, them, box) {
    const g = se.def.schedule[se.week];
    record(se, se.user, g.opp, us, them, se.week, true);
    addStats(se, box, us > them);
    simOthers(s, se);
    se.week++;
  }
  function addStats(se, box, win) { const t = se.stats; t.gp++; ['pts', 'reb', 'ast', 'stl', 'blk'].forEach(k => t[k] += box[k] || 0); win ? t.w++ : t.l++; }

  /* ---------- simulated user game (short summary instead of a full match) ---------- */
  function simUserGame(s, se, oppId) {
    const ur = userRating(s, se), orr = rating(s, se, oppId), win = Math.random() < winProb(ur, orr);
    const [us, them] = score(se.level, ur, orr, win);
    const box = statLine(s, se.level, win);
    const gs = box.pts * 1.2 + box.reb + box.ast * 1.3 + (win ? 10 : 0) - (se.level === 'pro' ? { 'Franchise Star': 22, Starter: 14, 'Sixth Man': 10, Bench: 4 }[role(s)] : (LEVEL_AVG[se.level] || 50) * 0.25);
    const grade = box.dnp ? 'C' : gs >= 30 ? 'A' : gs >= 22 ? 'B+' : gs >= 16 ? 'B' : gs >= 10 ? 'C' : 'D';   // (a DNP is the coach's decision, not a bad game)
    return { win, us, them, box, grade, sim: true };
  }
  function statLine(s, level, win) {
    const A = k => Engine.attr(s, k), rf = roleFactor(s), o = Engine.ovr(s), avg = LEVEL_AVG[level] || 50;
    if (level === 'pro') {   // the pros: minutes by role; behind the star (the rookie wall) it's DNPs and garbage time
      const R = role(s), wall = s.flags.c5_wall && !s.flags.starter;
      if (wall && Math.random() < .45) return { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, to: 0, dnp: true };
      const base = { 'Franchise Star': 24, Starter: 15, 'Sixth Man': 11, Bench: 5 }[R] * (wall ? .45 : 1), k = wall ? .35 : R === 'Bench' ? .5 : 1;
      const sc = (A('three') + A('mid') + A('finish')) / 3, pts = Math.max(0, Math.round(base + (o - 66) * .55 * k + (sc - o) * .2 + rnd(-5, 6) + (win ? 1 : 0)));
      const reb = Math.max(0, Math.round(((A('reb') - 30) / 6 + rnd(-2, 3)) * k * rf)), ast = Math.max(0, Math.round(((A('pass') - 30) / 6.5 + rnd(-2, 2)) * k * rf));
      const stl = Math.max(0, Math.round(((A('perD') - 40) / 20 + rnd(-1, 1.4)) * k)), blk = Math.max(0, Math.round(((A('intD') - 42) / 17 + rnd(-1, 1.2)) * k));
      const fgm = Math.round(pts / 2.3), fga = Math.max(fgm, Math.round(fgm / rnd(.42, .55)));
      return { pts, reb, ast, stl, blk, fgm, fga, tpm: 0, tpa: 0, ftm: 0, fta: 0, to: Math.round(rnd(0, 3) * k) };
    }
    const scorer = (A('three') + A('mid') + A('finish')) / 3, fat = s.meta.fatigue / 100;
    const pts = Math.max(0, Math.round((11 + (o - avg) * 1.1 + (scorer - o) * 0.25 + rnd(-6, 7) + (win ? 2 : 0)) * rf * (1 - fat * 0.2)));
    const reb = Math.max(0, Math.round(((A('reb') - 28) / 5.5 + rnd(-2, 3)) * rf));
    const ast = Math.max(0, Math.round(((A('pass') - 28) / 6 + rnd(-2, 2)) * rf));
    const stl = Math.max(0, Math.round((A('perD') - 35) / 18 + rnd(-1, 1.5)));
    const blk = Math.max(0, Math.round((A('intD') - 38) / 15 + rnd(-1, 1.2)));
    const fgm = Math.round(pts / 2.3), fga = Math.round(fgm / rnd(.42, .55));
    return { pts, reb, ast, stl, blk, fgm, fga, tpm: 0, tpa: 0, ftm: 0, fta: 0, to: Math.round(rnd(0, 3)) };
  }

  /* ---------- standings + playoffs ---------- */
  function table(se, conf) {
    return se.teams.filter(id => !conf || !se.def.confs || se.def.confs[id] === conf).map(id => Object.assign({ id }, se.standings[id]))
      .sort((x, y) => (y.w - x.w) || ((y.pf - y.pa) - (x.pf - x.pa)));
  }
  function buildPlayoffs(s, se) {
    const P = se.def.playoff;
    if (se.def.confs) {   // the pros: 8 seeds a side (East first), the conference champions meet in the Finals
      const side = c => { let L = table(se, c).slice(0, P.teams / 2).map(t => t.id); if (P.forceIn && se.def.confs[se.user] === c && !L.includes(se.user)) L[L.length - 1] = se.user; return L; };
      const E = side('East'), W = side('West'), pairs = [[0, 7], [3, 4], [1, 6], [2, 5]];
      const r0 = [E, W].flatMap(L => pairs.map(([i, j]) => ({ a: L[i], b: L[j], sa: 0, sb: 0, winner: null, seedA: i + 1, seedB: j + 1 })));
      se.playoffs = { seeds: E.concat(W), rounds: [r0], round: 0, names: P.rounds }; se.phase = 'playoffs';
      if (!se.playoffs.seeds.includes(se.user)) { simRestOfPlayoffs(s, se); se.result = 'missed'; se.phase = 'done'; }
      return;
    }
    let seeds = table(se).slice(0, P.teams).map(t => t.id);
    if (P.userSeed) { const others = se.teams.filter(t => t !== se.user).sort((x, y) => baseRating(se, y) - baseRating(se, x)).slice(0, P.teams - 1); others.splice(Math.min(P.teams, P.userSeed) - 1, 0, se.user); seeds = others; }   // a seeded field (the March bracket)
    const order = P.teams === 16 ? [[0, 15], [7, 8], [3, 12], [4, 11], [1, 14], [6, 9], [2, 13], [5, 10]] : P.teams === 8 ? [[0, 7], [3, 4], [1, 6], [2, 5]] : P.teams === 4 ? [[0, 3], [1, 2]] : [[0, 1]];
    const r0 = order.map(([i, j]) => ({ a: seeds[i], b: seeds[j], sa: null, sb: null, winner: null, seedA: i + 1, seedB: j + 1 }));
    se.playoffs = { seeds, rounds: [r0], round: 0, names: P.rounds };
    se.phase = 'playoffs';
    if (!seeds.includes(se.user)) { simRestOfPlayoffs(s, se); se.result = 'missed'; se.phase = 'done'; }
  }
  function userMatch(se) { const P = se.playoffs; return P && P.rounds[P.round] && P.rounds[P.round].find(m => (m.a === se.user || m.b === se.user) && !m.winner); }
  function oppOf(se, m) { return m.a === se.user ? m.b : m.a; }
  function setResult(m, a, b, sa, sb) { if (m.a === a) { m.sa = sa; m.sb = sb; } else { m.sa = sb; m.sb = sa; } m.winner = (m.sa > m.sb) ? m.a : m.b; }
  const need = se => Math.ceil((se.def.playoff.bestOf || 1) / 2);
  function simRound(s, se) {
    const P = se.playoffs, bo = se.def.playoff.bestOf;
    P.rounds[P.round].forEach(m => { if (m.winner) return;
      if (!bo) { const [x, y] = simGame(s, se, m.a, m.b); setResult(m, m.a, m.b, x, y); return; }
      while (m.sa < need(se) && m.sb < need(se)) { const [x, y] = simGame(s, se, m.a, m.b); x > y ? m.sa++ : m.sb++; }   // a whole series
      m.winner = m.sa > m.sb ? m.a : m.b; });
  }
  /* the user's series right now: { w, l, game } */
  function series(se) { const m = userMatch(se); if (!m) return null; const me = m.a === se.user, w = me ? m.sa : m.sb, l = me ? m.sb : m.sa; return { w, l, game: w + l + 1, need: need(se) }; }
  function advance(se) {
    const P = se.playoffs, cur = P.rounds[P.round];
    if (cur.length === 1) return false; // final done
    const z = se.def.playoff.bestOf ? 0 : null, next = []; for (let i = 0; i < cur.length; i += 2) next.push({ a: cur[i].winner, b: cur[i + 1].winner, sa: z, sb: z, winner: null });
    P.rounds.push(next); P.round++; return true;
  }
  function simRestOfPlayoffs(s, se) { do { simRound(s, se); } while (advance(se)); }
  /* User playoff game finished. Returns 'champion' | 'eliminated' | 'advanced'. */
  function finishUserPlayoff(s, se, us, them, box) {
    const m = userMatch(se), opp = oppOf(se, m);
    if (se.def.playoff.bestOf) {   // one game of a series: the series goes on until somebody has 4
      const me = m.a === se.user; if ((us > them) === me) m.sa++; else m.sb++; addStats(se, box, us > them);
      if (m.sa < need(se) && m.sb < need(se)) return 'game';
      m.winner = m.sa > m.sb ? m.a : m.b; us = m.winner === se.user ? 1 : 0; them = 1 - us;
    } else setResult(m, se.user, opp, us, them);
    if (!se.def.playoff.bestOf) addStats(se, box, us > them);
    simRound(s, se);
    if (us < them) { se.outRound = se.playoffs.round; simRestOfPlayoffs(s, se); se.result = 'eliminated'; se.phase = 'done'; return 'eliminated'; }
    if (!advance(se)) { se.result = 'champion'; se.phase = 'done'; return 'champion'; }
    return 'advanced';
  }
  function roundName(se) { const P = se.playoffs; const n = P.names || []; return n[P.round] || `Round ${P.round + 1}`; }
  function champion(se) { const P = se.playoffs; if (!P) return null; const last = P.rounds[P.rounds.length - 1]; return last.length === 1 && last[0].winner; }

  return { create, simUserGame, finishUserWeek, finishUserPlayoff, buildPlayoffs, userMatch, oppOf, table, roundName, champion, role, roleFactor, rating, statLine, series, LEVEL_AVG };
})();
