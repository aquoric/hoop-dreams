/* =====================================================================
   DRAFT.JS — Chapter 4 "The Draft" (story: js/data-story-ch4.js, scenes: js/data-story-ch4-scenes.js).
   Numbers: BALANCE.draft + BALANCE.pro (js/balance.js) · the league: js/data-nbl.js · combine events: COMBINE (js/data-features.js)

   Node types (js/main.js):
     type:'combine'  { title, events:[COMBINE event ids], next } — each event is a minigame at pro difficulty; the result
                     becomes a measurement, ranked against the draft class, saved to the Combine Leaderboard (Features)
     type:'draft'    { made, undrafted } — draft night: the board, pick by pick (yours last), the call
   Save field s.draft: { believer, wk:[3 team ids], order:[30], combine:{id:score 0..1}, workouts:{id:0..1}, mock0,
                         result:{ proj, pick, round, team, kaiPick, kaiTeam, passed:[], picks:[…], undrafted } }
   Draft.form(s): how well you played this chapter (0..1) → how far you slide.
   ===================================================================== */
const Draft = (() => {
  const $ = id => document.getElementById(id), sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const esc = t => (typeof UI !== 'undefined' ? UI.esc(t) : String(t));
  const B = () => BALANCE.draft;
  const team = id => NBL_TEAMS[id] || { name: id, abbr: '???', colors: ['#334155', '#fff', '#000'] };
  const short = n => String(n || '').replace(/"[^"]*"\s*/, '').trim();

  /* ---------- state: the teams in your draft (picked once per career, from a seed) ---------- */
  function st(s) {
    if (s.draft && s.draft.order) return s.draft;
    const D = s.draft = Object.assign({ combine: {}, workouts: {}, talks: {} }, s.draft || {});
    const R = Art.seeded('draft|' + (s.id || s.player.first + s.player.last)), sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    D.order = sh(NBL_IDS);                                                     // the lottery: who picks first
    const big = ['las', 'bos', 'man', 'bay', 'mia', 'chw'].filter(id => D.order.indexOf(id) > 6);
    D.believer = sh(D.order.slice(10, 24).filter(id => !big.includes(id)))[0];   // the team that wanted you from the start (a mid-market team picking mid-round)
    D.wk = [D.order[Math.floor(R() * 4)], big[0] || D.order[20], D.believer];     // workouts: a lottery team, a big market, the believer
    if (D.wk[1] === D.wk[0]) D.wk[1] = D.order[25];
    return D;
  }

  /* ---------- the mock draft (your Big Board rank) ---------- */
  function mock(s) {
    const r = typeof Rankings !== 'undefined' && Rankings.on(s) ? Rankings.rankOf(s) : 90;
    return clamp(Math.round(r * B().mock[0] + B().mock[1]), 1, B().picks + 1);   // picks + 1 = projected undrafted
  }
  const mockStr = n => n > B().picks ? 'undrafted' : '#' + n;
  function kaiMock(s) { const k = typeof Rankings !== 'undefined' && Rankings.on(s) ? Rankings.infoFor(s, 'Kai Sterling') : null; return clamp(Math.round((k ? k.rank : 3) * B().mock[0]), 1, 30); }
  /* a toast when the mock draft moves */
  function noteMock(s, why) {
    const D = st(s), now = mock(s), was = D.mockLast || D.mock0 || now; D.mockLast = now;
    if (now !== was && typeof UI !== 'undefined') UI.toast(`📋 Mock draft <b>${mockStr(was)} → ${mockStr(now)}</b>${why ? ' · ' + esc(why) : ''}`, now < was ? 'ach' : 'bad', 4200);
  }

  /* ---------- how well you played (0..1): combine, workouts, interviews, the season before; the ankle at the medicals ---------- */
  function form(s) {
    const D = st(s), W = B().w, avg = (o, d) => { const v = Object.values(o || {}); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : d; };
    const talks = ['dt_1', 'dt_2', 'dt_3'].filter(f => s.flags[f]).length / 3;
    const stock = clamp(((s.meta.draftStock || 0) - B().stock[0]) / (B().stock[1] - B().stock[0]), 0, 1);
    const ankle = s.flags.ankle_hidden ? B().ankle * 2 : s.flags.ankle_flagged ? B().ankle : 0;
    return clamp(avg(D.combine, .45) * W.combine + avg(D.workouts, .45) * W.workouts + talks * W.talks + stock * W.stock - ankle, 0, 1);
  }

  /* ---------- draft night: every pick, decided once (so a reload replays the same night) ---------- */
  function decide(s) {
    const D = st(s); if (D.result) return D.result;
    const P = B().picks, f = form(s), proj = mock(s);
    const kaiPick = clamp(Math.min(kaiMock(s), proj - 1), 1, P - 1);   // Kai goes before you, wherever you're projected
    const slide = Math.round(lerp(B().slide[1], B().slide[0], f) + Math.random() * B().jitter);
    let pick = Math.max(proj, kaiPick + 1) + slide; if ((pick - 1) % 30 === (kaiPick - 1) % 30) pick++;   // (never the team that took Kai)
    const undrafted = pick > P; if (undrafted) pick = P + 1;
    // the order (two rounds of the same 30) with the believer at your pick
    const order = D.order.slice(), slot = (pick - 1) % 30, bi = order.indexOf(D.believer);
    if (!undrafted) [order[bi], order[slot]] = [order[slot], order[bi]];
    else if (bi === (kaiPick - 1) % 30) [order[bi], order[(bi + 1) % 30]] = [order[(bi + 1) % 30], order[bi]];
    const teamAt = n => order[(n - 1) % 30], kaiTeam = teamAt(kaiPick);
    // the class: the Big Board in order (a little shuffled: teams draft for need), Kai at his pick, you at yours
    const board = (typeof Rankings !== 'undefined' && Rankings.on(s) ? Rankings.list(s) : []).filter(r => !r.me && !/Kai Sterling/.test(r.p.name)).map(r => r.p.name);
    const names = board.slice(0, P + 6).map((n, i) => ({ n, k: i + (Math.random() - .5) * 6 })).sort((a, b) => a.k - b.k).map(x => x.n);
    const picks = []; let ni = 0;
    for (let n = 1; n <= P; n++) picks.push({ n, team: teamAt(n), name: n === kaiPick ? 'Kai Sterling' : !undrafted && n === pick ? 'YOU' : names[ni++] || 'A prospect', kai: n === kaiPick, me: !undrafted && n === pick });
    const passed = [...new Set(picks.filter(p => (undrafted || p.n >= proj) && p.n < pick && p.team !== D.believer).map(p => p.team))];   // every team that could have taken you and didn't (undrafted: all of them)
    D.result = { proj, pick: undrafted ? null : pick, round: undrafted ? 0 : pick <= 30 ? 1 : 2, team: D.believer, kaiPick, kaiTeam, passed, picks, slide: pick - Math.max(proj, kaiPick + 1), form: Math.round(f * 100) / 100, undrafted };
    return D.result;
  }
  /* after the draft: career fields, flags, the revenge marks, the Summer League squads */
  function settle(s) {
    const D = st(s), R = decide(s); if (D.settled) return R; D.settled = true;
    Object.assign(s.career, { nblTeam: R.team, draftPick: R.pick, draftRound: R.round });
    const F = s.flags; F.draft_night = true;
    if (R.undrafted) F.undrafted = true; else { F.drafted = true; F[R.round === 1 ? 'first_round' : 'second_round'] = true; if (R.pick <= 14) F.lottery_pick = true; }
    if (R.slide >= 12 || R.undrafted) F.slid_far = true;
    R.passed.forEach(id => { const t = team(id), star = (t.stars || [])[0]; if (star && typeof Story !== 'undefined') Story.mark(s, { id: 'pass_' + id, star, title: `${t.nick ? t.nick.toUpperCase() : t.abbr} PASSED ON YOU`, sub: `Draft night · ${t.name}` }); });
    if (typeof Story !== 'undefined') Story.mark(s, { id: 'kai', star: 'Kai Sterling', title: 'SUMMER LEAGUE: THE RECKONING', sub: `Kai went #${R.kaiPick}` });
    buildSummer(s);
    return R;
  }
  /* the Summer League squads: yours (the believer) and Kai's */
  function buildSummer(s) {
    const R = decide(s), mine = LOCAL_TEAMS['sl_' + R.team], his = LOCAL_TEAMS['sl_' + R.kaiTeam]; if (!mine || !his) return;
    LOCAL_TEAMS.sl_mine = Object.assign({}, mine, { id: 'sl_' + R.team, roster: mine.roster.slice(0, 4) });
    LOCAL_TEAMS.sl_kai = Object.assign({}, his, { id: 'sl_' + R.kaiTeam, roster: ['Kai Sterling'].concat(his.roster.slice(0, 3)), star: { name: 'Kai Sterling', perD: 70, intD: 54 } });
  }
  if (typeof STORY !== 'undefined') STORY.refs = Object.assign(STORY.refs || {}, {
    '@sl_mine': s => { buildSummer(s); return LOCAL_TEAMS.sl_mine ? 'sl_mine' : 'sl_' + st(s).believer; },
    '@sl_kai': s => { buildSummer(s); return LOCAL_TEAMS.sl_kai ? 'sl_kai' : 'sl_' + (st(s).wk[0]); },
    '@wk1': s => 'wk_' + st(s).wk[0], '@wk2': s => 'wk_' + st(s).wk[1], '@wk3': s => 'wk_' + st(s).wk[2],
    '@wkme1': s => 'wkme_' + st(s).wk[0], '@wkme2': s => 'wkme_' + st(s).wk[1], '@wkme3': s => 'wkme_' + st(s).wk[2],
  });

  /* ---------- Chip on the Shoulder: a bonus vs every team that passed on you ---------- */
  let opp = null;
  const setOpp = t => { opp = t || null; };
  function chipNow(s) {
    const D = s && s.draft, R = D && D.result; if (!R || !opp || !Engine.weapons(s).some(w => w.id === 'chip_shoulder')) return 0;
    const m = String(opp.id || '').match(/^(?:nbl|sl|wk|wkme)_([a-z]{3})$/), id = m ? m[1] : null, kai = (opp.roster || []).includes('Kai Sterling') && R.passed.includes(R.kaiTeam);
    return id && (R.passed.includes(id) || kai) ? B().chip : 0;
  }

  /* ---------- text tokens for the story ({mock}, {believer}, {kaiTeam}, {pick}…) ---------- */
  function tokens(s) {
    if (!s || !(s.story && s.story.chapter === 'draft') && !s.draft) return {};
    const D = st(s), R = D.result, T = id => team(id).name, ord = n => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
    return { mock: mockStr(mock(s)), wk1: T(D.wk[0]), wk2: T(D.wk[1]), believer: T(D.believer), believerNick: team(D.believer).nick || T(D.believer), believerCity: team(D.believer).cityName || team(D.believer).city,
      kaiTeam: R ? T(R.kaiTeam) : 'a lottery team', kaiPick: R ? ord(R.kaiPick) : 'top three', pick: R && R.pick ? ord(R.pick) : 'undrafted', pickN: R && R.pick ? R.pick : '—',
      round: R ? (R.round === 1 ? 'First-round pick' : R.round === 2 ? 'Second-round pick' : 'Undrafted') : '', passedN: R ? R.passed.length : 0, slideN: R ? R.slide : 0, proj: R ? ord(R.proj) : mockStr(mock(s)) };
  }

  /* =================================================================
     THE COMBINE: measurements and drills (the minigames at pro difficulty), ranked against the class
     ================================================================= */
  const Phi = z => 1 / (1 + Math.exp(-1.702 * z));
  const EV = {   // each event's minigame (Overall-fair windows, then BALANCE.pro makes it harder)
    sprint: (L, ME, W) => Match.MG.dribbleCombo(L, { title: '3/4 COURT SPRINT', len: 5, time: (.7 + Balance.eff(ME.speed) / 99 * .6) * W }).then(r => (r.hits || 0) / (r.total || 5)),
    lane: (L, ME, W) => Match.MG.defenseReact(L, { title: 'LANE AGILITY', window: (520 + Balance.eff(ME.speed) / 99 * 420) * W }).then(r => r.success ? .5 + r.quality * .5 : .15),
    vert: (L, ME, W) => Match.MG.dunkChain(L, { title: 'MAX VERTICAL', rings: 3, tol: (7 + Balance.eff(ME.vert) / 99 * 6) * W, labels: ['LOAD', 'EXPLODE', 'TOUCH'] }).then(r => r.perfect ? 1 : (r.quality || 0) * (r.hits || 0) / 3),
    shoot: (L, ME, W) => Match.MG.shotMeter(L, { title: 'SPOT-UP SHOOTING', green: (.06 + Balance.eff(ME.three) / 99 * .14) * W, dur: 1, sub: `Three-Point ${ME.three}` }).then(r => r.perfect ? 1 : r.good ? .6 + r.quality * .3 : r.quality * .45),
    bench: (L, ME) => Match.MG.strengthPush(L, { title: 'BENCH PRESS · 185 LB', mine: ME.str, theirs: 62 }).then(r => r.quality || 0),
  };
  function measure(e, q, stat) {
    const z = clamp((q - .55) * 2.4 + (Balance.eff(stat || 60) - 62) / 18, -2.6, 3.6), raw = e.better === 'low' ? e.avg - z * e.sd : e.avg + z * e.sd;
    const v = e.unit === 's' ? Math.round(raw * 100) / 100 : e.unit === '"' ? Math.round(raw * 2) / 2 : Math.max(0, Math.round(raw));
    const N = COMBINE.draftClass, rank = clamp(Math.round(1 + (N - 1) * (1 - Phi(z))), 1, N);
    const rec = e.better === 'low' ? v < e.record.v : v > e.record.v;
    return { v: e.unit === '/25' ? Math.min(25, v) : v, rank, z, rec };
  }
  async function combine(G, node) {
    const s = G.state, D = st(s), ME = Balance.userStats(s), W = (DIFFICULTY[s.difficulty] || {}).window || 1, list = node.events || ['sprint'];
    const F = typeof Features !== 'undefined' ? (s.features || {}) : {}; F.combine = F.combine || {};
    if (D.mock0 == null) D.mock0 = D.mockLast = mock(s);
    UI.setBg('gym');
    UI.showScreen(`<div class="usa-drill combine">
      <div class="ud-head glass"><b>${esc(node.title || 'THE COMBINE')}</b><small>Every rep is ranked against the other ${COMBINE.draftClass - 1} prospects. Pro difficulty.</small></div>
      <div class="ud-main"><div class="ud-stage" id="udStage"><div class="ud-card" id="udCard"></div><div class="mg-layer" id="mg"></div></div>
      <div class="ud-side glass" id="udSide"><h4>COMBINE LEADERBOARD</h4><div id="udRes"></div></div></div></div>`, 'usadrill');
    SFX.music('build'); const res = $('udRes'); let sum = 0;
    for (let i = 0; i < list.length; i++) {
      const e = COMBINE.events.find(x => x.id === list[i]); if (!e) continue;
      const card = $('udCard');
      card.innerHTML = `<small>EVENT ${i + 1} / ${list.length}</small><b>${esc(e.name)}</b><span>All-time record: ${e.record.v}${esc(e.unit)} · ${esc(e.record.by)}</span><button class="btn primary" id="udGo">Start ›</button>`; card.hidden = false;
      await new Promise(r => { $('udGo').onclick = r; const k = ev => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); removeEventListener('keydown', k); r(); } }; addEventListener('keydown', k); });
      card.hidden = true; await sleep(200);
      let q = .4; Match.MG.camp(BALANCE.pro);   // pro difficulty: harder than the national team camp
      try { q = clamp(await EV[e.id]($('mg'), ME, W), 0, 1); } catch (err) { console.error('combine', err); } finally { Match.MG.camp(false); }
      const m = measure(e, q, ME[e.stat]), score = 1 - (m.rank - 1) / (COMBINE.draftClass - 1);
      D.combine[e.id] = Math.round(score * 100) / 100; sum += score;
      if (typeof Features !== 'undefined') { const FS = s.features || {}; (FS.combine || (FS.combine = {}))[e.id] = { v: m.v, rank: m.rank }; }
      res.insertAdjacentHTML('beforeend', `<div class="ud-r"><b>${esc(e.name)}</b><span><i class="${m.rank <= 15 ? 'g' : m.rank > 40 ? 'b' : ''}">${m.v}${esc(e.unit)}</i> · #${m.rank} of ${COMBINE.draftClass}${m.rec ? ' · <em class="g">RECORD!</em>' : ''}</span></div>`);
      SFX.play(m.rank <= 10 ? 'good' : m.rank <= 35 ? 'click' : 'bad');
      if (m.rec) { SFX.play('roar'); UI.toast(`🏆 <b>Combine record!</b> ${esc(e.name)}: ${m.v}${esc(e.unit)}`, 'ach', 5000); Engine.post(s, { by: 'ehn', text: `⏱ COMBINE RECORD: {name} just broke ${e.record.by}'s ${e.name} mark. ${m.v}${e.unit}.` }); s.flags.combine_record = true; }
      await sleep(400);
    }
    const avg = sum / Math.max(1, list.length), bump = Math.round((avg - .5) * 60);   // the Big Board reacts
    if (typeof Rankings !== 'undefined' && Rankings.on(s) && bump) Rankings.bump(s, bump, 'Combine');
    if (avg >= .75) s.meta.draftStock = (s.meta.draftStock || 0) + 1; else if (avg < .3) s.meta.draftStock = Math.max(0, (s.meta.draftStock || 0) - 1);
    G.save();
    const card = $('udCard'); card.hidden = false;
    card.innerHTML = `<small>SESSION OVER</small><b class="${avg >= .5 ? 'g' : 'b'}">Average class rank: #${Math.round(1 + (1 - avg) * (COMBINE.draftClass - 1))}</b><span>Mock draft: ${mockStr(mock(s))}</span><button class="btn primary" id="udGo">Continue ›</button>`;
    noteMock(s, 'Combine');
    await new Promise(r => $('udGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, node.next);
  }
  /* a played team workout: how it went (0..1) */
  function workout(s, id, r) { const D = st(s); D.workouts[id] = clamp(((r.gradeScore || 50) - 30) / 60 + (r.win ? .1 : -.05), 0, 1); const bump = Math.round((D.workouts[id] - .5) * 40); if (bump && Rankings.on(s)) Rankings.bump(s, bump, 'Team workout'); noteMock(s, team(id).name + ' workout'); }

  /* =================================================================
     DRAFT NIGHT: the board, pick by pick (Kai before you, the slide, the call)
     ================================================================= */
  async function night(G, node) {
    const s = G.state, D = st(s), R = decide(s), P = B().picks, ctx = (() => { try { return G.csCtx(s.story.node); } catch (e) { return {}; } })();
    const seen = typeof Story !== 'undefined' && Story.seen('draft_night'); let fast = false;
    UI.setBg('arena');
    const logo = id => Art.logo(Object.assign({ id }, team(id)), 26);
    UI.showScreen(`<div class="dn glass">
      <div class="dn-head"><b>NBL DRAFT</b><span id="dnRound">ROUND 1</span><small>${esc(NBL_LEAGUE.commissioner)} at the podium · the green room</small></div>
      <div class="dn-clock" id="dnClock"></div>
      <div class="dn-list" id="dnList"></div>
      <div class="dn-foot"><span class="dn-phone" id="dnPhone">📱 <i>silent</i></span><span class="dn-read" id="dnRead"></span>
        <button class="btn ghost sm" id="dnFast" ${seen ? '' : 'hidden'}>▸▸ Faster</button><button class="btn primary" id="dnGo" hidden>Continue ›</button></div></div>`, 'draftnight');
    $('dnFast').onclick = () => { fast = true; $('dnFast').hidden = true; };
    SFX.music('build');
    const read = $('dnRead'), list = $('dnList'), clock = $('dnClock');
    const scene = async id => { if (typeof Story === 'undefined' || typeof CH4S === 'undefined' || !CH4S[id]) return; const cs = CH4S[id](s, ctx, R); if (cs) await Story.cut(cs, ctx, { seenId: 'draft_' + id }); };
    const onClock = p => { clock.innerHTML = `${logo(p.team)}<div><small>ON THE CLOCK · PICK ${p.n}</small><b>${esc(team(p.team).name)}</b></div>`; };
    const add = p => { const el = document.createElement('div'); el.className = 'dn-row' + (p.kai ? ' kai' : '') + (p.me ? ' me' : '') + (p.n >= R.proj && !p.me && p.n < (R.pick || 99) ? ' pass' : '');
      el.innerHTML = `<span class="dn-n">${p.n}</span>${logo(p.team)}<span class="dn-t">${esc(team(p.team).abbr)}</span><span class="dn-name">${esc(p.me ? `${s.player.first} ${s.player.last}` : short(p.name))}</span>${p.n === R.proj && !p.me ? '<em>your mock</em>' : ''}`;
      list.prepend(el); };
    const last = R.undrafted ? P : R.pick - 1;
    await sleep(900);
    for (let i = 0; i < last; i++) {
      const p = R.picks[i]; if (p.n === 31) { $('dnRound').textContent = 'ROUND 2'; read.textContent = 'The first round is over. You\'re still in your chair.'; SFX.play('heartbeat'); await sleep(fast ? 300 : 2200); await scene('chairs'); }
      onClock(p); const slow = p.n <= 3 || p.kai || p.n === R.proj;
      await sleep(fast ? 120 : slow ? 1300 : 420);
      if (p.kai) { read.textContent = `With the ${p.n === 1 ? 'first' : p.n === 2 ? 'second' : p.n === 3 ? 'third' : p.n + 'th'} pick, the ${team(p.team).name} select… Kai Sterling.`; SFX.play('roar'); add(p); await sleep(fast ? 300 : 1400); await scene('kai'); continue; }
      read.textContent = `${p.n}. ${team(p.team).name}: ${short(p.name)}`; add(p); SFX.play(p.n === R.proj ? 'bad' : 'tick');
      if (p.n === R.proj) { read.textContent = `Pick ${p.n}. Your mock. Your phone doesn't move.`; SFX.play('heartbeat'); await sleep(fast ? 300 : 1800); }
      if (p.n === R.proj + 3) await scene('slide');   // the phone silent, Mom squeezing your hand
      await sleep(fast ? 80 : slow ? 700 : 300);
    }
    if (R.undrafted) {
      clock.innerHTML = '<div><small>THE DRAFT IS OVER</small><b>Sixty names. None of them yours.</b></div>'; read.textContent = 'The lights go down in the green room.';
      SFX.music(null); SFX.play('piano'); await sleep(1600); await scene('undrafted');
    } else {
      const p = R.picks[R.pick - 1]; onClock(p); read.textContent = ''; SFX.music(null); await sleep(900);
      await scene('call');   // the phone rings: the team that wanted you all along
      add(p); list.firstChild.classList.add('pop');
      read.innerHTML = `<b class="ok">PICK ${R.pick}: ${esc(team(R.team).name.toUpperCase())}</b> select ${esc(s.player.first + ' ' + s.player.last)}`;
      $('dnPhone').innerHTML = '📱 <b>ringing</b>'; SFX.play('stinger'); SFX.music('victory'); UI.confetti && UI.confetti();
    }
    if (typeof Story !== 'undefined') Story.markSeen('draft_night');
    settle(s); G.save();
    $('dnGo').hidden = false; $('dnFast').hidden = true;
    await new Promise(r => $('dnGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, R.undrafted ? node.undrafted : node.made);
  }

  return { st, mock, mockStr, kaiMock, noteMock, form, decide, settle, buildSummer, setOpp, chipNow, tokens, combine, workout, night, team };
})();
