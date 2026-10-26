/* =====================================================================
   RANKINGS.JS — Prospect Rankings (Elite Hoops Network top 300, inspired by Blue Lock's rankings).
   You start at #300 the day Dee Carter shows you the list (Chapter 1). Games, results, story choices and your Overall
   move you; the other 329 prospects drift, break out and fall off on their own. Numbers: BALANCE.rankings (js/balance.js),
   the class: js/data-prospects.js. State lives in save.rank.

   Rankings.afterGame(s, r)   after a played game → { from, to, passed, dropped, delta } (also used by sims and pickups)
   Rankings.onFlag(s, flag)   story results (titles, getting cut, scandals…) — once per flag
   Rankings.bump(s, pts, why) anything else (mixtape drops)
   Rankings.list(s)           the full sorted list · Rankings.rankOf(s) your spot · Rankings.infoFor(name) a ranked player
   Rankings.playQueue()       milestone cutscenes (top 100 / 50 / 10, passing Kai, #1) — played after the post-game screen
   ===================================================================== */
const Rankings = (() => {
  const C = () => BALANCE.rankings, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a);
  const ptsAt = r => r >= C().size ? C().start - 8 - (r - C().size) * 2 :   /* just off the list: below where you start (#300) */ C().bottom + (C().top - C().bottom) * Math.pow(1 - (r - 1) / (C().size - 1), C().curve);
  const on = s => !!(s && s.rank && s.rank.npc);
  const KAI = () => PROSPECT_BY_NAME.get('Kai Sterling');
  const growth = s => { const a = (s.player && s.player.age) || 16; return a <= 16 ? 0 : a === 17 ? 7 : a === 18 ? 13 : a === 19 ? 20 : 24; };   // the class grows up with you

  /* ---------- setup: #300 from the story scene, or a fair spot for a career that was already going ---------- */
  function init(s, fair) {
    const R = s.rank = { me: C().start, ovr: Engine.ovr(s), npc: {}, last: {}, prev: null, best: 999, ms: {}, hist: [], q: [], flags: {}, n: 0 };
    PROSPECTS.forEach(p => { R.npc[p.id] = Math.round(ptsAt(p.rank0) + rnd(-3, 3)); });
    if (fair) {   // older saves: Overall, wins, grades and the results already in the story
      const c = s.counters, gp = Math.max(c.games || 0, (c.wins || 0) + (c.losses || 0)), avg = c.gradeN ? c.gradePts / c.gradeN : 2.5, G = C().game;
      const perGame = (avg >= 3 ? G.grade.B + (avg - 3) * 7 : avg >= 2 ? G.grade.C + (avg - 2) * 7 : G.grade.D + (avg - 1) * 7) + (gp ? ((c.wins || 0) * G.win + (c.losses || 0) * G.loss) / gp : 0) + 2;   // what a played game is worth on average
      let pts = C().start + (Engine.ovr(s) - 40) * C().perOvr + gp * perGame * .5;
      for (const f in C().flags) if (s.flags[f]) { pts += C().flags[f]; R.flags[f] = 1; }
      R.me = Math.round(clamp(pts, C().start, ptsAt(12)));   // a fair spot, but the top 10 / passing Kai / #1 are earned live (with their cutscenes)
      for (let i = 0; i < 4; i++) tick(s);   // the class has moved on a little too
      const r = rankOf(s); C().milestones.forEach(m => { if (r <= m) R.ms[m] = 1; }); if (kaiPassed(s)) R.ms.kai = 1;
    }
    R.prev = R.best = rankOf(s); R.hist.push({ label: fair ? 'Start' : 'Day one', rank: R.prev });
    snapshot(s); return R;
  }
  function ensure(s) { if (!on(s)) init(s, !!(s.flags.done_street || (s.story && s.story.chapter !== 'street'))); return s.rank; }

  /* ---------- the list ---------- */
  function list(s) {
    const R = s.rank, P = s.player;
    const rows = PROSPECTS.map(p => ({ id: p.id, p, pts: R.npc[p.id] }));
    rows.push({ id: 'me', me: true, pts: R.me, p: { name: `${P.first} ${P.last}`, pos: P.pos, home: Engine.text('{hometown}', s), weapon: null } });
    rows.sort((a, b) => b.pts - a.pts || (a.me ? 1 : -1));
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  }
  function rankMap(s) { const m = {}; list(s).forEach(r => { m[r.id] = r.rank; }); return m; }
  function rankOf(s) { if (!on(s)) return null; let n = 1; const me = s.rank.me; for (const id in s.rank.npc) if (s.rank.npc[id] >= me) n++; return n; }
  const snapshot = s => { s.rank.last = rankMap(s); };
  function ovrOf(s, p) { return Math.round(p.ovr0 + growth(s) + (s.rank.npc[p.id] - ptsAt(p.rank0)) / 45); }
  function infoFor(s, name) { if (!on(s)) return null; const p = PROSPECT_BY_NAME.get(name); if (!p) return null; const m = rankMap(s); return { p, rank: m[p.id], ovr: ovrOf(s, p) }; }
  const kaiPassed = s => { const k = KAI(); return !!k && s.rank.me > s.rank.npc[k.id]; };

  /* ---------- the rest of the class moves (every update) ---------- */
  function tick(s) {
    const R = s.rank, out = [];
    PROSPECTS.forEach(p => {
      let v = R.npc[p.id] + p.trend * C().trend + (rnd(-1, 1) + rnd(-1, 1)) * C().drift * .7;
      if (Math.random() < C().breakout[0]) { const d = rnd(C().breakout[1], C().breakout[2]); v += d; out.push({ p, kind: 'breakout', d }); }
      else if (Math.random() < C().falloff[0]) { const d = rnd(C().falloff[1], C().falloff[2]); v -= d; out.push({ p, kind: 'falloff', d }); }
      R.npc[p.id] = Math.round(clamp(v, C().min, C().max));
    });
    return out;
  }

  /* ---------- your move: points + your Overall, then the list re-sorts ---------- */
  function apply(s, delta, why, o = {}) {
    if (!on(s)) return null;
    const R = s.rank, before = R.last && Object.keys(R.last).length ? R.last : rankMap(s), from = rankOf(s);
    const o2 = Engine.ovr(s), grow = Math.max(0, o2 - (R.ovr || o2)) * C().perOvr; R.ovr = Math.max(R.ovr || 0, o2);
    R.me = Math.round(clamp(R.me + delta + grow, C().min, C().max));
    if (o.vs) R.npc[o.vs.id] = Math.round(clamp(R.npc[o.vs.id] - delta * C().vs.transfer, C().min, C().max));   // a head-to-head moves both of you
    const moves = o.noTick ? [] : tick(s), after = rankMap(s), to = after.me; R.n++;
    const passed = [], dropped = [];
    for (const id in after) { if (id === 'me') continue; if (before[id] < from && after[id] > to) passed.push({ id, p: PROSPECT_BY_ID[id], rank: after[id] }); if (before[id] > from && after[id] < to) dropped.push({ id, p: PROSPECT_BY_ID[id], rank: after[id] }); }
    passed.sort((a, b) => a.rank - b.rank); dropped.sort((a, b) => a.rank - b.rank);
    R.prev = from; R.best = Math.min(R.best || 999, to); R.prevMap = before; R.last = after;
    if (to !== from) { R.hist.push({ label: why || 'Game', rank: to }); if (R.hist.length > 80) R.hist.splice(1, 1); }
    const res = { from, to, delta: Math.round(delta + grow), why, passed, dropped, moves };
    milestones(s, res); notify(s, res);
    return res;
  }
  function milestones(s, res) {
    const R = s.rank, fx = C().milestoneFx;
    C().milestones.forEach(m => { if (res.to <= m && !R.ms[m]) { R.ms[m] = 1; R.q.push({ kind: m === 1 ? 'one' : 'top', n: m, rank: res.to }); give(s, fx[m]); } });
    if (!R.ms.kai && kaiPassed(s)) { R.ms.kai = 1; R.q.push({ kind: 'kai', rank: res.to }); give(s, fx.kai); }
  }
  function give(s, f) { if (!f) return; if (f.draftStock) s.meta.draftStock = (s.meta.draftStock || 0) + f.draftStock; if (f.overseas) s.meta.overseas = (s.meta.overseas || 0) + f.overseas; if (f.rep) s.meta.rep = clamp(s.meta.rep + f.rep, 0, 100); }
  function notify(s, res) {
    if (typeof UI === 'undefined') return;
    const big = res.passed.filter(x => x.p.named || x.rank <= 120).slice(0, 2);
    big.forEach((x, i) => setTimeout(() => UI.toast(`📈 You passed <b>${x.p.name}</b> (#${x.rank})`, 'ach', 3600), 900 + i * 700));
    if (res.dropped.length && res.to - res.from >= 6) setTimeout(() => UI.toast(`📉 <b>${res.dropped[0].p.name}</b> moved past you (#${res.dropped[0].rank}). You're #${res.to}.`, 'bad', 3600), 900);
    if (res.from - res.to >= 15) Engine.post(s, { by: 'ehn', text: `📈 RANKINGS: {name} jumps ${res.from - res.to} spots to #${res.to} in the class.` });
    else if (res.to - res.from >= 15) Engine.post(s, { by: 'ehn', text: `📉 RANKINGS: {name} slides to #${res.to}. Rough stretch.` });
    const bo = res.moves.find(m => m.kind === 'breakout' && s.rank.last[m.p.id] <= 100);
    if (bo && Math.random() < .5) Engine.post(s, { by: 'ehn', text: `🚀 BREAKOUT: ${bo.p.name} (${bo.p.pos}, ${bo.p.home}) rockets up to #${s.rank.last[bo.p.id]}.` });
  }

  /* ---------- what moves you ---------- */
  function afterGame(s, r, o = {}) {
    if (!on(s)) return null;
    const G = C().game, b = r.box || {}, imp = G.importance[clamp((r.importance || 1) - 1, 0, 3)];
    let d = (G.grade[r.grade] != null ? G.grade[r.grade] : G.grade[(r.grade || 'C')[0]] || 0) + (r.win ? G.win : G.loss) + Math.floor((b.pts || 0) / 10) * G.per10pts;
    if ((b.ast || 0) >= G.assists[0]) d += G.assists[1];
    if ((b.fga || 0) >= G.efficient[1] && b.fgm / b.fga >= G.efficient[0]) d += G.efficient[2];
    const c = r.counters || {}; d += Math.min(2, c.jellies || 0) * G.jelly + (r.gameWinner ? G.gameWinner : 0) + Math.min(2, r.posterizers || 0) * G.poster;
    d *= imp * (o.pickup ? G.pickup : o.sim ? G.sim : 1);
    // a ranked star on the other side: beating someone above you counts a lot, losing to someone below you hurts
    const star = r.cfg && r.cfg.them && r.cfg.them.star, info = star && infoFor(s, star.name), mine = rankOf(s); let vs = null;
    if (info && info.rank !== mine) {
      if (r.win && info.rank < mine) { d += Math.min(C().vs.beatHigher[2], C().vs.beatHigher[0] + (mine - info.rank) * C().vs.beatHigher[1]); vs = info.p; }
      else if (!r.win && info.rank > mine) { d -= Math.min(C().vs.loseLower[2], C().vs.loseLower[0] + (info.rank - mine) * C().vs.loseLower[1]); vs = info.p; }
    }
    return apply(s, Math.round(d), o.why || (r.cfg && (r.cfg.sub || r.cfg.title)) || 'Game', { vs });
  }
  function onFlag(s, f) {
    if (!on(s) || s.rank.flags[f] || C().flags[f] == null) return null;
    s.rank.flags[f] = 1; const v = C().flags[f], res = apply(s, v, FLAG_LABEL[f] || 'Story');
    if (res && res.to !== res.from && typeof UI !== 'undefined') setTimeout(() => UI.toast(`${res.to < res.from ? '📈' : '📉'} Prospect rank <b>#${res.from} → #${res.to}</b> · ${FLAG_LABEL[f] || 'Story'}`, res.to < res.from ? 'ach' : 'bad', 3800), 600);
    return res;
  }
  const FLAG_LABEL = { summer_champ: 'Summer Jam champion', beat_kai: 'Beat Kai', beat_kai_1v1: 'Beat Kai 1-on-1', city_champ: 'City champion', aau_champ: 'Peach Slam champion', state_champ: 'State champion', usa_made: 'Made the national team', usa_gold: 'World Youth gold', usa_medal: 'World Youth medal', usa_cut: 'Cut by the national team', usa_missed: 'Missed the national team', booster_scandal: 'Booster scandal', police_record: 'Police record', benched_fight: 'Locker-room fight', viral: 'Went viral', national_champ: 'National champion', conf_champ: 'Conference champion', league_champ: 'League champion', cup_champ: 'Continental Cup', gl_champ: 'Grind League champion', called_up: 'NBL call-up', beat_kai_c3: 'Beat Kai again', elite_camp: 'Elite 100 Camp', starter: 'Varsity starter', good_final: 'Summer Jam final', scheme_once: 'Bad decision', academic_probation: 'Academic probation' };
  function bump(s, v, why) { return apply(s, Math.round(v), why || 'Story', { noTick: true }); }
  /* the story puts you at a spot on the list (the Summer Jam final's crash, the semifinal's climb); o.better: only if that's higher than now */
  function setRank(s, n, why, o = {}) {
    if (!on(s)) return null; const cur = rankOf(s); if (o.better && cur <= n) return null;
    const pts = Object.values(s.rank.npc).sort((a, b) => b - a), hi = pts[n - 2] != null ? pts[n - 2] : pts[0] + 6, lo = pts[n - 1] != null ? pts[n - 1] : hi - 6;
    s.rank.ovr = Engine.ovr(s);   // no Overall growth folded into this move
    return apply(s, Math.round((hi + lo) / 2 - s.rank.me), why || 'Story', { noTick: true });
  }

  /* ---------- effects elsewhere: recruiting, the national team invite, the Draft Big Board ---------- */
  const tier = (s, table) => { const r = rankOf(s); if (!r) return 0; const t = table.find(([at]) => r <= at); return t ? t[1] : 0; };
  const recruitBonus = s => on(s) ? tier(s, C().recruit) : 0;
  const inviteBonus = s => on(s) ? tier(s, C().invite) : 0;
  const bigBoard = s => !!(s.flags.declared || (s.story && s.story.chapter === 'draft'));

  /* ---------- ranked prospects in pickups: a crew around your spot (opponents a little above you, teammates a little below) ---------- */
  function crew(s, n, above) {
    if (!on(s)) return [];
    const L = list(s), me = L.findIndex(r => r.me), pool = above ? L.slice(Math.max(0, me - 45), me).reverse() : L.slice(me + 1, me + 40);
    const out = []; pool.filter(r => !/Kai Sterling/.test(r.p.name)).forEach(r => { if (out.length < n && Math.random() < .55) out.push(r); });
    while (out.length < n && pool.length > out.length) out.push(pool[out.length]);
    return out.map(r => ({ name: r.p.name, rank: r.rank, ovr: ovrOf(s, r.p), p: r.p }));
  }

  /* ---------- milestone cutscenes (top 100 / 50 / 10, passing Kai, #1), after the post-game screen ---------- */
  async function playQueue() {
    const s = Game.state; if (!on(s) || !s.rank.q.length || typeof Cutscene === 'undefined') return;
    while (s.rank.q.length) { const m = s.rank.q.shift(); Game.save(); try { await milestoneCine(s, m); } catch (e) { console.warn('rank cutscene', e); } }
  }
  function rowsAround(s, to, n = 14) { const L = list(s), i = L.findIndex(r => r.me); return L.slice(Math.max(0, i - n + 4), Math.max(0, i - n + 4) + n).map(r => ({ rank: r.rank, name: r.p.name, me: !!r.me })); }
  function milestoneCine(s, m) {
    const rows = rowsAround(s, m.rank), kai = KAI(), kr = kai ? rankMap(s)[kai.id] : null, name = `${s.player.first} ${s.player.last}`.toUpperCase();
    const ctx = { rankRows: rows, myRank: m.rank, night: true };
    const T = m.kind === 'one' ? { text: '#1', sub: 'THE TOP PROSPECT IN AMERICA' } : m.kind === 'kai' ? { text: 'PASSED KAI', sub: `#${m.rank} ${name} · #${kr} KAI STERLING` } : { text: `TOP ${m.n}`, sub: `#${m.rank} IN THE NATION` };
    const line = m.kind === 'one' ? 'Three hundred names. Yours is the first one now.' : m.kind === 'kai' ? 'For the first time in your life, his name is under yours.' : m.n === 100 ? 'Dee\'s list. Two hundred names ago, you were the last one.' : m.n === 50 ? 'Top fifty. Coaches who never called are calling now.' : 'Ten names left above you. Then nobody.';
    const shots = [
      { d: 2600, scene: 'ranks', music: null, tr: 'fade', grade: 'blue', cam: [[0, 0, 30, 1.1], [1, 0, -6, 1.35, 'io']], say: ['narrator', line], ev: [[0, 'sfx', 'heartbeat'], [1100, 'sfx', 'heartbeat'], [1900, 'sfx', 'riser', 1]] },
      { d: 2600, scene: 'ranks', grade: m.kind === 'kai' ? 'red' : 'gold', speed: 'radial', music: 'clutch', cam: [[0, 0, 0, 1.3], [1, 0, -4, 1.06, 'snap']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'fierce', rim: '#facc15', from: { dy: 40, t: 400, ease: 'back' } }],
        title: Object.assign({ style: 'slam', at: 260 }, T), ev: [[260, 'impact', 160], [260, 'sfx', 'stinger'], [260, 'shake', 9], [500, 'sfx', 'roar'], [600, 'confetti', m.kind === 'one' ? 160 : 60]] },
    ];
    if (m.kind === 'kai' && kai) shots.push({ d: 2400, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial', cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'shocked', rim: '#fca5a5', from: { dx: 160, t: 300, ease: 'back' } }, { id: 'you', kind: 'bust', x: -.55, expr: 'smile', rim: '#93c5fd', from: { dx: -160, t: 300, ease: 'back' } }],
      say: ['kai', pick(['(text) Enjoy it. It won\'t last.', '(text) Ranked above me? Must be a typo.', '(text) Fine. Now I have something to chase.'])], ev: [[320, 'impact', 150], [320, 'sfx', 'impact']] });
    CUTSCENES._rank = { name: 'Rankings', shots };
    return Cutscene.play('_rank', ctx, { skippable: true });
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  return { init, ensure, on, list, rankOf, rankMap, infoFor, ovrOf, afterGame, onFlag, bump, setRank, apply, tick, recruitBonus, inviteBonus, bigBoard, crew, playQueue, kai: KAI, ptsAt };
})();
