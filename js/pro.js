/* =====================================================================
   PRO.JS — the NBL career (Chapter 5 and on). Story: js/data-story-ch5.js · scenes: js/data-story-ch5-scenes.js
   Numbers: BALANCE.pro2 (js/balance.js) · the league: js/data-nbl.js · the season engine: js/season.js

   s.pro = { n (season number, 1 = rookie), team, kaiTeam, vetTeam, contract:{ team, years, salary, kind }, trophies:[{ id, name, n }],
             seasons:[summaries], revW (revenge wins), allstar:{ [n]: { votes, rank, sel, three, dunk } } }
   A career can run 10–20 seasons: Pro.seasonDef(s) builds season n (82 games, two conferences, best-of-7 playoffs) from
   the story's per-season beats (C5_SEASONS[n], or the generic one), Pro.offseason(s) ages you (growth → peak → decline).
   Node types: 'awards' (the season's awards night), 'freeagency' (offers + a negotiation), 'allstar' (votes, the
   three-point contest, the dunk contest). Fx (via Game.applyFx): proInit, proSeason (start season n+1), proOff (the
   offseason), proTrade: 'contender' | 'forced' | team id.
   ===================================================================== */
const Pro = (() => {
  const $ = id => document.getElementById(id), sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a);
  const esc = t => (typeof UI !== 'undefined' ? UI.esc(t) : String(t));
  const B = () => BALANCE.pro2, T = id => NBL_TEAMS[id] || { name: id, abbr: '?', colors: ['#334155', '#fff', '#000'] };
  const money = n => '$' + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'K');

  /* the star at your position on your rookie team: your mentor and your obstacle */
  const VET = { PG: 'Darius "Clock" Whitfield', SG: 'Marcus "Buckets" Reed', SF: 'Andre "Wing" Collins', PF: 'Terrell "Bully" Banks', C: 'Victor "Tower" Mensah' };
  const vetName = s => VET[(s && s.player.pos) || 'SG'] || VET.SG;

  /* ---------- state ---------- */
  function init(s) {
    if (s.pro) return s.pro;
    const R = s.draft && s.draft.result, team = s.career.nblTeam || (R && R.team) || 'tnl', round = s.career.draftRound || 0, pick = s.career.draftPick || 61;
    const kind = s.flags.two_way ? 'two-way' : round ? 'rookie' : 'standard', C = B().contract;
    const salary = round === 1 ? Math.round(C.firstTop - (pick - 1) * C.perPick) : round === 2 ? C.second : s.flags.two_way ? C.twoWay : C.minimum;
    s.pro = { n: 0, team, kaiTeam: (R && R.kaiTeam !== team && R.kaiTeam) || NBL_IDS.find(id => id !== team), vetTeam: team, trophies: [], seasons: [], revW: 0, allstar: {},
      contract: { team, years: round === 1 ? C.firstYears : 1, salary, kind } };
    s.meta.trust = B().trust0; s.meta.chem = 55; s.flags.c5_wall = true;
    return s.pro;
  }

  /* ---------- rosters for this career: the star at your position, Kai on his team, the All-Star teams ---------- */
  const BASE = {};
  function sync(s) {
    const P = s.pro; if (!P) return;
    NBL_IDS.forEach(id => { const L = LOCAL_TEAMS['nbl_' + id]; if (!BASE[id]) BASE[id] = { roster: L.roster.slice(), star: Object.assign({}, L.star) }; L.roster = BASE[id].roster.slice(); L.star = Object.assign({}, BASE[id].star); });
    const me = LOCAL_TEAMS['nbl_' + P.team], vet = vetName(s);
    if (me && P.team === P.vetTeam && !s.flags.vet_hurt_out) { me.roster = [vet].concat(me.roster).slice(0, 4); me.looks[vet] = Object.assign({ outfit: 'jersey', jersey: me.colors[0], trim: me.colors[1] }, STORY.characters.vetstar ? STORY.characters.vetstar.look : {}); }
    else if (me) me.roster = me.roster.slice(0, 4);
    const k = LOCAL_TEAMS['nbl_' + P.kaiTeam]; if (k && P.kaiTeam !== P.team) { k.roster = ['Kai Sterling'].concat(k.roster).slice(0, 5); k.star = { name: 'Kai Sterling', perD: 72, intD: 56 }; }
    // the All-Star teams: each conference's best (you're on yours if you made it)
    const conf = c => Object.values(NBL_LEAGUE.stars).filter(x => NBL_TEAMS[x.team].conf === c).sort((a, b) => b.ovr - a.ovr).map(x => x.name);
    const myConf = T(P.team).conf || 'East', mine = conf(myConf), theirs = conf(myConf === 'East' ? 'West' : 'East');
    LOCAL_TEAMS.asg_us = { name: `${myConf} All-Stars`, abbr: myConf === 'East' ? 'EST' : 'WST', colors: myConf === 'East' ? ['#1d4ed8', '#f8fafc', '#facc15'] : ['#b91c1c', '#f8fafc', '#facc15'], logo: { shape: 'shield', icon: 'stars' }, rating: 90, roster: mine.slice(0, 4) };
    LOCAL_TEAMS.asg_them = { name: `${myConf === 'East' ? 'West' : 'East'} All-Stars`, abbr: myConf === 'East' ? 'WST' : 'EST', colors: myConf === 'East' ? ['#b91c1c', '#f8fafc', '#facc15'] : ['#1d4ed8', '#f8fafc', '#facc15'], logo: { shape: 'shield', icon: 'stars' }, rating: 92,
      roster: theirs.slice(0, 5), star: { name: theirs[0], perD: 70, intD: 66 } };
  }

  /* ---------- a season: 82 games, two conferences, best-of-7 playoffs, the story's beats ---------- */
  function seasonDef(s) {
    const P = init(s), n = Math.max(1, P.n), S = (typeof C5_SEASONS !== 'undefined' && (C5_SEASONS[n] || C5_SEASONS.generic)) || {}, me = 'nbl_' + P.team;
    const R = Art.seeded(`pro|${s.id}|${n}`), others = NBL_IDS.filter(id => id !== P.team);
    const opps = []; while (opps.length < 82) others.slice().sort(() => R() - .5).forEach(id => { if (opps.length < 82) opps.push(id); });
    const passed = ((s.draft && s.draft.result && s.draft.result.passed) || []).filter(id => id !== P.team);
    const at = (i, id) => { const j = opps.indexOf(id, i); if (j >= 0 && j !== i) [opps[i], opps[j]] = [opps[j], opps[i]]; };
    // the story's games: Kai's team, the revenge games (the first meetings with teams that passed), the scripted nights
    if (S.kaiAt != null && P.kaiTeam !== P.team) at(S.kaiAt, P.kaiTeam);
    if (S.scriptAt != null && passed.length) at(S.scriptAt, passed[0]);
    const schedule = opps.map((id, i) => ({ opp: 'nbl_' + id, title: `Game ${i + 1}`, away: i % 2 === 1 }));
    const firstMeet = id => opps.indexOf(id);
    passed.slice(0, S.revenge || 0).forEach(id => { const i = firstMeet(id); if (i >= 0) Object.assign(schedule[i], { key: true, title: `Game ${i + 1} · They passed on you` }); });
    if (S.kaiAt != null && P.kaiTeam !== P.team) Object.assign(schedule[S.kaiAt], { key: true, title: `Game ${S.kaiAt + 1} · Kai Sterling`, post: S.kaiPost || null });
    Object.entries(S.keys || {}).forEach(([i, g]) => { if (schedule[i]) Object.assign(schedule[i], g, { key: true }); });
    if (S.wallUntil) schedule.forEach((g, i) => { if (g.key && i < S.wallUntil && !g.script) g.lateEntry = { at: .62, title: 'Garbage time', text: 'Coach finally points at you. Mid-third quarter, the game\'s already decided.' }; });   // behind the star: you check in late
    const confs = {}; NBL_IDS.forEach(id => confs['nbl_' + id] = T(id).conf || 'East');
    return {
      id: 'pro' + n, name: `NBL Season ${n}`, level: 'pro', user: me, teams: NBL_IDS.map(id => 'nbl_' + id), confs, mateRating: LOCAL_TEAMS[me].rating,
      autoSim: true, simXp: B().simXp, hubAP: 1, schedule, interrupts: S.interrupts || {},
      playoff: { teams: 16, name: 'NBL Playoffs', rounds: ['First Round', 'Conference Semifinals', 'Conference Finals', 'NBL Finals'], bestOf: 7, simOk: true, moments: [9, 10, 11, 12],
        fixedWin: S.fixedWin != null ? S.fixedWin : null, forceIn: S.fixedWin != null, script: S.seriesScript || null, pre: S.playoffPre || {} },
      finalVenue: 'finals',
    };
  }

  /* ---------- the offseason: you get older (growth → peak → decline), your contract runs down, the shoe sells ---------- */
  function offseason(s) {
    const P = init(s), A = B().age, age = s.player.age, out = { age: age + 1 };
    s.player.age = age + 1;
    const before = Engine.ovr(s);
    if (P.n <= 1) Engine.develop(s, 'rookie');
    else if (age < A.peak[0]) Engine.develop(s, 'prime');
    else if (age > A.peak[1]) {   // decline: the legs go first
      const n = Math.round(A.decline[0] + (age - A.peak[1]) * A.decline[1]); for (let i = 0; i < n; i++) { const k = ['speed', 'vert', 'stam', 'speed', 'vert', 'perD', 'str'][Math.floor(Math.random() * 7)]; s.player.attrs[k] = Math.max(25, s.player.attrs[k] - 1); }
    }
    out.ovr = [before, Engine.ovr(s)];
    if (P.contract) P.contract.years = Math.max(0, P.contract.years - 1);
    if (s.shoe && s.shoe.name) { const S2 = SHOE, pairs = Math.round(S2.baseSales + (s.meta.fans || 0) * S2.perFan + (Engine.ovr(s) - 70) * S2.perOvr); s.shoe.sold = (s.shoe.sold || 0) + Math.max(0, pairs); Engine.applyFx(s, { money: Math.max(0, pairs) * S2.price, fans: Math.round(Math.max(0, pairs) * S2.fansPer) }); out.shoe = pairs; }
    Engine.applyFx(s, { money: (P.contract && P.contract.salary) || 0 });
    s.meta.fatigue = 0; P.lastOff = out;
    return out;
  }

  /* ---------- trades (requested or forced) and moving teams: new teammates, chemistry from scratch ---------- */
  function move(s, id, why) {
    const P = init(s), old = P.team; if (!id || id === old) return null;
    P.team = id; s.career.nblTeam = id; P.contract.team = id; s.meta.chem = B().chemNew; s.meta.trust = Math.max(s.meta.trust, 40);
    if (P.kaiTeam === id) P.kaiTeam = old;   // (never on the same team as Kai: his old team gets him)
    const se = s.season; if (se && se.level === 'pro') { const was = se.user; se.user = 'nbl_' + id; se.def.user = se.user; se.def.mateRating = LOCAL_TEAMS[se.user].rating; se.def.schedule.forEach(g => { if (g.opp === se.user) g.opp = was; }); }
    (P.moves || (P.moves = [])).push({ from: old, to: id, n: P.n, why });
    sync(s); Engine.post(s, { by: 'ehn', text: `🔁 ${why === 'forced' ? 'TRADED' : why === 'fa' ? 'SIGNED' : 'TRADE'}: {name} is headed to the ${T(id).name}.` });
    return id;
  }
  function tradeTarget(s, kind) {
    const P = init(s), by = NBL_IDS.filter(id => id !== P.team && id !== P.kaiTeam).sort((a, b) => T(b).rating - T(a).rating);
    return kind === 'contender' ? by[Math.floor(Math.random() * 4)] : kind === 'forced' ? by[by.length - 1 - Math.floor(Math.random() * 5)] : NBL_TEAMS[kind] ? kind : by[10];
  }

  /* the revenge games: the first win over each team that passed on you (played or simmed) */
  function revenge(s, r) {
    const P = s.pro, R = s.draft && s.draft.result, m = r && r.win && r.cfg && r.cfg.them && String(r.cfg.them.id || '').match(/^nbl_([a-z]{3})$/); if (!P || !R || !m || !R.passed.includes(m[1])) return;
    const D = P.revDone || (P.revDone = {}); if (D[m[1]]) return; D[m[1]] = 1; P.revW = (P.revW || 0) + 1;
    if (typeof UI !== 'undefined') UI.toast(`🥊 Revenge: <b>${esc(T(m[1]).name)}</b> passed on you. Not anymore.`, 'ach', 4000);
  }

  /* ---------- Game.applyFx hook ---------- */
  function fx(s, f, changes) {
    if (f.proInit) init(s);
    if (f.proSeason) { const P = init(s); P.n++; s.season = null; changes.push({ label: `NBL Season ${P.n}`, v: 1 }); }
    if (f.proOff) { const P = init(s), last = (s.career.seasons || []).slice(-1)[0]; if (last && !P.seasons.some(x => x.n === P.n)) P.seasons.push({ n: P.n, team: T(P.team).name, w: last.w, l: last.l, ppg: last.ppg, result: last.resText || last.result });
      if (last && last.ppg >= B().franchisePpg && s.flags.starter && !s.flags.franchise) { s.flags.franchise = true; changes.push({ label: '⭐ Role: Franchise Star', v: 1, special: 'grow' }); }   // the role ladder's top rung
      const o = offseason(s); changes.push({ label: `Offseason · age ${o.age}`, v: o.ovr[1] - o.ovr[0], special: o.ovr[1] >= o.ovr[0] ? 'grow' : null }); }
    if (f.proTrade) { const id = move(s, tradeTarget(s, f.proTrade), f.proTrade === 'forced' ? 'forced' : 'request'); if (id) changes.push({ label: `🔁 Traded to the ${T(id).name}`, v: 1 }); }
    if (f.proWall === false) s.flags.c5_wall = false;
  }

  /* =================================================================
     AWARDS NIGHT (every season): the league's awards, yours get a cinematic and a spot in the trophy room
     ================================================================= */
  const AW = { roy: 'Rookie of the Year', smoy: 'Sixth Man of the Year', mip: 'Most Improved Player', dpoy: 'Defensive Player of the Year', nbl1: 'All-NBL First Team', nbl2: 'All-NBL Second Team', nbl3: 'All-NBL Third Team', mvp: 'Most Valuable Player', fmvp: 'Finals MVP', champ: 'NBL Champion', allstar: 'All-Star', dunk: 'Dunk Contest Champion', three: 'Three-Point Contest Champion' };
  function decideAwards(s) {
    const P = init(s), sum = (s.career.seasons || []).slice(-1)[0] || {}, prev = P.seasons.slice(-1)[0], A = B().awards, me = [], role = Season.role(s);
    const ppg = sum.ppg || 0, def = (sum.spg || 0) + (sum.bpg || 0), w = sum.w || 0;
    if (P.n === 1 && ppg >= A.roy) me.push('roy');
    if (role === 'Sixth Man' && ppg >= A.smoy) me.push('smoy');
    if (prev && ppg - prev.ppg >= A.mip) me.push('mip');
    if (def >= A.dpoy) me.push('dpoy');
    if (ppg >= A.mvp[0] && w >= A.mvp[1]) me.push('mvp');
    const tm = ppg >= A.nbl[0] ? 'nbl1' : ppg >= A.nbl[1] ? 'nbl2' : ppg >= A.nbl[2] ? 'nbl3' : null; if (tm) me.push(tm);
    if (sum.result === 'champion') { me.push('champ'); if (ppg >= A.fmvp) me.push('fmvp'); }
    // everyone else's: the league's best (Kai takes Rookie of the Year when you don't)
    const stars = Object.values(NBL_LEAGUE.stars).sort((a, b) => b.ovr - a.ovr), pickStar = (i, f) => (stars.filter(f || (() => true))[i] || stars[0]).name;
    const league = { roy: me.includes('roy') ? 'YOU' : 'Kai Sterling', smoy: me.includes('smoy') ? 'YOU' : pickStar(6, x => x.ovr < 88), mip: me.includes('mip') ? 'YOU' : pickStar(3, x => x.ovr < 87),
      dpoy: me.includes('dpoy') ? 'YOU' : pickStar(0, x => x.intD >= 84), mvp: me.includes('mvp') ? 'YOU' : pickStar(Math.floor(Math.random() * 3)) };
    return { mine: me, league, ppg, n: P.n };
  }
  async function awardsNight(G, node) {
    const s = G.state, P = init(s), key = 'aw' + P.n;
    const D = P.awardsSeen === key ? P.awardsLast : decideAwards(s);
    if (P.awardsSeen !== key) { P.awardsSeen = key; P.awardsLast = D; D.mine.forEach(id => { if (!P.trophies.some(t => t.id === id && t.n === P.n)) P.trophies.push({ id, name: AW[id], n: P.n }); }); s.flags['aw_' + P.n] = true; D.mine.forEach(id => s.flags['won_' + id] = true); G.save();
      for (const id of D.mine) { if (typeof CH5S !== 'undefined') { const cs = CH5S.award(s, id, AW[id]); await Story.cut(cs, G.csCtx(s.story.node), { seenId: 'award_' + id }); } } }
    UI.setBg('arena');
    UI.showScreen(`<div class="usa-board glass aw">
      <div class="ub-head"><b>NBL AWARDS · SEASON ${P.n}</b><small>${D.mine.length ? `You won ${D.mine.length === 1 ? 'one' : D.mine.length}. They go in the trophy room.` : 'Your name wasn\'t called tonight. Next year.'}</small></div>
      <div class="ub-list">${['roy', 'smoy', 'mip', 'dpoy', 'mvp'].map(id => `<div class="ub-row ${D.league[id] === 'YOU' ? 'me safe' : ''}"><span class="ub-rank">🏆</span><span class="ub-name">${esc(AW[id])}</span><span class="ub-mv"></span><span class="ub-sc">${esc(D.league[id] === 'YOU' ? `${s.player.first} ${s.player.last}` : D.league[id])}</span></div>`).join('')}
        ${D.mine.filter(id => !['roy', 'smoy', 'mip', 'dpoy', 'mvp'].includes(id)).map(id => `<div class="ub-row me safe"><span class="ub-rank">🏆</span><span class="ub-name">${esc(AW[id])}</span><span class="ub-mv"></span><span class="ub-sc">${esc(s.player.first + ' ' + s.player.last)}</span></div>`).join('')}</div>
      <div class="ub-foot"><span class="ub-read">${trophyRow(s, P.n)}</span><button class="btn primary" id="ubGo">Continue ›</button></div></div>`, 'usaboard');
    SFX.music(D.mine.length ? 'victory' : 'story');
    await new Promise(r => $('ubGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, node.next);
  }
  const ICON = { roy: '🌟', smoy: '🪑', mip: '📈', dpoy: '🛡', nbl1: '🥇', nbl2: '🥈', nbl3: '🥉', mvp: '👑', fmvp: '💍', champ: '🏆', allstar: '⭐', dunk: '💥', three: '🎯' };
  const trophyRow = (s, n) => (init(s).trophies.filter(t => n == null || t.n === n).map(t => `<i title="${esc(t.name)}">${ICON[t.id] || '🏆'}</i>`).join(' ')) || '';
  /* the trophy room (hub: Achievements tab) */
  function trophyRoom(s) {
    const P = s.pro; if (!P) return '';
    const shelf = P.trophies.map(t => `<div class="tro"><canvas class="tro-cv" width="48" height="56" data-tro="${t.id}"></canvas><b>${esc(t.name)}</b><small>Season ${t.n}</small></div>`).join('');
    setTimeout(() => document.querySelectorAll('canvas.tro-cv').forEach(drawTrophy), 30);
    return `<div class="glass panel trophy-room"><h4>🏆 Trophy Room</h4>${shelf ? `<div class="tro-shelf">${shelf}</div>` : '<p class="muted">Empty shelves. Every award you win in the NBL lands here.</p>'}</div>`;
  }
  function drawTrophy(cv) {   // a little 16-bit trophy per award
    const g = cv.getContext('2d'), id = cv.dataset.tro, gold = ['mvp', 'fmvp', 'champ', 'nbl1', 'roy'].includes(id), col = gold ? ['#facc15', '#a16207', '#fef08a'] : id === 'nbl2' ? ['#cbd5e1', '#64748b', '#f8fafc'] : id === 'nbl3' ? ['#d97706', '#78350f', '#fdba74'] : ['#38bdf8', '#0369a1', '#e0f2fe'];
    const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    g.clearRect(0, 0, 48, 56); P(14, 46, 20, 6, '#1f2937'); P(12, 50, 24, 4, '#111827'); P(21, 34, 6, 12, col[1]); P(12, 8, 24, 20, col[0]); P(14, 26, 20, 6, col[0]); P(16, 10, 4, 14, col[2]);
    P(6, 10, 6, 10, col[1]); P(36, 10, 6, 10, col[1]); P(8, 12, 3, 6, '#0000'); if (id === 'champ' || id === 'fmvp') { P(20, 2, 8, 6, col[0]); P(22, 0, 4, 2, col[2]); }
  }

  /* =================================================================
     ALL-STAR WEEKEND: the votes, the three-point contest, the dunk contest (the game itself is a story match)
     ================================================================= */
  function votes(s) {
    const P = init(s), se = s.season, st = se ? se.stats : { gp: 1, pts: 0 }, ppg = st.pts / Math.max(1, st.gp), rec = se ? se.standings[se.user] : { w: 0 };
    const mine = Math.round(B().votes.base + ppg * B().votes.ppg + (rec.w || 0) * B().votes.win + (s.meta.fans || 0) * B().votes.fan);
    const conf = T(P.team).conf || 'East', field = Object.values(NBL_LEAGUE.stars).filter(x => NBL_TEAMS[x.team].conf === conf).map(x => ({ name: x.name, v: Math.round((x.ovr - 70) * 95000 + Art.seeded(x.name + P.n)() * 300000) }));
    field.push({ name: `${s.player.first} ${s.player.last}`, v: mine, me: true }); field.sort((a, b) => b.v - a.v);
    const rank = field.findIndex(x => x.me) + 1; return { field, rank, mine, sel: rank <= B().votes.spots, conf };
  }
  async function allStar(G, node) {
    const s = G.state, P = init(s), A = P.allstar[P.n] || (P.allstar[P.n] = {}), V = votes(s); A.votes = V.mine; A.rank = V.rank; A.sel = V.sel; s.flags.allstar_sel = V.sel;
    if (V.sel && !P.trophies.some(t => t.id === 'allstar' && t.n === P.n)) P.trophies.push({ id: 'allstar', name: AW.allstar, n: P.n });
    UI.setBg('arena');
    UI.showScreen(`<div class="usa-drill allstar">
      <div class="ud-head glass"><b>ALL-STAR WEEKEND</b><small>Lasers, celebrities courtside, and two contests with your name on the list.</small></div>
      <div class="ud-main"><div class="ud-stage" id="udStage"><div class="ud-card" id="udCard"></div><div class="mg-layer" id="mg"></div></div>
      <div class="ud-side glass" id="udSide"><h4>${esc(V.conf.toUpperCase())} · FAN VOTES</h4><div id="udRes">${V.field.slice(0, 12).map((x, i) => `<div class="ud-r ${x.me ? 'g' : ''}"><b>#${i + 1}${i < B().votes.spots ? ' · ALL-STAR' : ''}</b><span>${esc(x.me ? 'YOU · ' + x.name : x.name)} <i>${(x.v / 1e6).toFixed(2)}M</i></span></div>`).join('')}${V.rank > 12 ? `<div class="ud-r g"><b>#${V.rank}</b><span>YOU <i>${(V.mine / 1e6).toFixed(2)}M</i></span></div>` : ''}</div></div></div></div>`, 'usadrill');
    SFX.music('build'); G.save();
    const card = $('udCard'), step = (small, big, line) => new Promise(r => { card.hidden = false; card.innerHTML = `<small>${small}</small><b>${big}</b><span>${line}</span><button class="btn primary" id="udGo">Start ›</button>`; $('udGo').onclick = r; });
    await step('THE VOTES', V.sel ? 'YOU\'RE AN ALL-STAR' : `#${V.rank} IN THE ${V.conf.toUpperCase()}`, V.sel ? `${(V.mine / 1e6).toFixed(1)} million votes. Halsey Street voted twice.` : `${(V.mine / 1e6).toFixed(1)} million votes. Not enough this year, but you're in both contests.`);
    if (V.sel) { SFX.play('levelup'); UI.confetti && UI.confetti(); }
    // the three-point contest: five racks, the last ball of each is the money ball
    await step('THREE-POINT CONTEST', 'FIVE RACKS', 'Release at the top. Perfect = 5 + the money ball.'); card.hidden = true;
    const ME = Balance.userStats(s); let three = 0;
    for (let i = 0; i < 5; i++) { let r = { result: 'late' }; try { r = await Match.MG.shotMeter($('mg'), { title: `RACK ${i + 1} / 5`, green: (.06 + Balance.eff(ME.three) / 99 * .14), dur: .95, sub: 'Money ball last' }); } catch (e) { }
      three += r.perfect ? 6 : r.good ? 3 + Math.round((r.quality || 0) * 1.5) : Math.round((r.quality || 0) * 2); }
    const T3 = Object.values(NBL_LEAGUE.stars).filter(x => x.weapons.some(w => /three/.test(w))).slice(0, 3).map(x => ({ name: x.name, v: 16 + Math.floor(Art.seeded(x.name + P.n + '3')() * 11) }));
    const won3 = T3.every(x => three > x.v); A.three = three; if (won3) P.trophies.push({ id: 'three', name: AW.three, n: P.n });
    await step('THREE-POINT CONTEST', won3 ? `CHAMPION · ${three} POINTS` : `${three} POINTS`, T3.map(x => `${esc(x.name.split(' ').slice(-1)[0])} ${x.v}`).join(' · '));
    // the dunk contest: two dunks, five judges, 50 a dunk
    await step('DUNK CONTEST', 'TWO DUNKS', 'Hit every ring. The judges want something they\'ve never seen.'); card.hidden = true;
    let dunk = 0;
    for (let i = 0; i < 2; i++) { let r = { hits: 0, quality: 0 }; try { r = await Match.MG.dunkChain($('mg'), { title: `DUNK ${i + 1} / 2`, rings: 3, tol: 6 + Balance.eff(ME.vert) / 99 * 6, labels: ['TOSS', 'CATCH', 'SLAM'] }); } catch (e) { }
      dunk += Math.round(30 + (r.quality || 0) * (r.hits || 0) / 3 * 18 + (r.perfect ? 2 : 0)); }
    const TD = Object.values(NBL_LEAGUE.stars).filter(x => x.weapons.some(w => /meteor|poster|lob/.test(w))).slice(0, 2).map(x => ({ name: x.name, v: 84 + Math.floor(Art.seeded(x.name + P.n + 'd')() * 12) }));
    const wonD = TD.every(x => dunk > x.v); A.dunk = dunk; if (wonD) P.trophies.push({ id: 'dunk', name: AW.dunk, n: P.n });
    await step('DUNK CONTEST', wonD ? `CHAMPION · ${dunk}` : `${dunk} FROM THE JUDGES`, TD.map(x => `${esc(x.name.split(' ').slice(-1)[0])} ${x.v}`).join(' · '));
    if (won3 || wonD) { SFX.play('roar'); UI.confetti && UI.confetti(); Engine.applyFx(s, { fans: 40000, rep: 3 }); }
    G.save();
    return G.goto(s.story.chapter, node.next);
  }

  /* =================================================================
     FREE AGENCY: offers from around the league, then a negotiation (the talk system's patience gauge)
     ================================================================= */
  function offers(s) {
    const P = init(s), sum = (s.career.seasons || []).slice(-1)[0] || { ppg: 8 }, o = Engine.ovr(s), C = B().contract;
    const base = Math.max(C.minimum, C.faBase + (o - 60) * C.faPerOvr + (sum.ppg || 0) * C.faPerPpg + P.trophies.length * C.faPerTrophy);
    const others = NBL_IDS.filter(id => id !== P.team && id !== P.kaiTeam).sort(() => Math.random() - .5);
    const pick = (f) => others.find(id => f(T(id)) && !L.some(x => x.team === id)) || others.find(id => !L.some(x => x.team === id));
    const L = [{ team: P.team, salary: Math.round(base), years: 3, role: Season.role(s) === 'Bench' ? 'Sixth man' : 'Starter', note: 'Your team. Loyalty, and the minutes you earned.' }];
    L.push({ team: pick(t => t.rating >= 79), salary: Math.round(base * .9), years: 2, role: 'Sixth man on a contender', note: 'A real shot at a ring. Fewer shots for you.' });
    L.push({ team: pick(t => t.rating <= 70), salary: Math.round(base * 1.35), years: 4, role: 'Franchise star', note: 'The most money and the ball. A rebuild around you.' });
    return L;
  }
  async function freeAgency(G, node) {
    const s = G.state, P = init(s);
    if (P.contract.years > 0) return G.goto(s.story.chapter, node.next);   // still under contract
    const L = P.faOffers || (P.faOffers = offers(s)); G.save();
    UI.setBg('home');
    UI.showScreen(`<div class="usa-board glass fa">
      <div class="ub-head"><b>FREE AGENCY</b><small>Your contract is up. Priya's phone hasn't stopped since midnight.</small></div>
      <div class="ub-list">${L.map((o, i) => `<button class="fa-offer" data-o="${i}">${Art.logo(Object.assign({ id: o.team }, T(o.team)), 34)}<div><b>${esc(T(o.team).name)}</b><small>${esc(o.role)} · ${esc(o.note)}</small></div><span><b>${money(o.salary)}</b><small>× ${o.years} years</small></span></button>`).join('')}</div>
      <div class="ub-foot"><span class="ub-read" id="faRead">Pick an offer. Then Priya gets you in the room to negotiate.</span></div></div>`, 'usaboard');
    SFX.music('build');
    const o = L[await new Promise(r => document.querySelectorAll('.fa-offer').forEach(b => b.onclick = () => r(+b.dataset.o)))]; SFX.play('click');
    let win = true; try { const ch = STORY.characters.gm_fa; win = (await Match.talk({ who: 'gm_fa', script: 'c5_fa', look: UI.charLook('gm_fa'), name: ch.name, title: `NEGOTIATION · ${T(o.team).name}`, colors: T(o.team).colors })).win; } catch (e) { console.error('fa talk', e); }
    const salary = Math.round(o.salary * (win ? B().contract.winK : B().contract.loseK)), years = o.years + (win ? 1 : 0);
    UI.toast(win ? `✍️ Negotiation won: <b>${money(salary)}</b> × ${years}` : `✍️ They held firm: <b>${money(salary)}</b> × ${years}`, win ? 'ach' : 'bad', 4500);
    if (o.team !== P.team) move(s, o.team, 'fa');
    P.contract = { team: o.team, years, salary, kind: 'standard' }; P.faOffers = null; s.flags.signed_fa = true; s.flags.fa_team_new = o.team !== P.vetTeam;
    Engine.post(s, { by: 'ehn', text: `✍️ {name} signs with the ${T(o.team).name}: ${years} years, ${money(salary * years)}.` }); G.save();
    return G.goto(s.story.chapter, node.next);
  }

  /* ---------- hub: the contract tab · rankings: the NBL's top players ---------- */
  function contractHtml(s) {
    const P = init(s), c = P.contract, t = T(P.team);
    return `<div class="recruit-grid"><div class="glass panel rec-head"><div class="rec-stars">${Art.logo(Object.assign({ id: P.team }, t), 56)}</div><div><b>${esc(t.name)} · ${esc(Season.role(s))}</b><span>${esc(t.conf || '')}ern Conference · Season ${P.n || 1} · age ${s.player.age}</span></div></div>
      <div class="glass panel"><h4>Contract</h4><div class="statboxes">${[['Salary', money(c.salary)], ['Years left', c.years], ['Type', c.kind], ['Coach Trust', s.meta.trust], ['Chemistry', s.meta.chem], ['Revenge wins', P.revW || 0]].map(([k, v]) => `<div class="sb"><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join('')}</div>
      <p class="muted small">Role: Bench → Sixth Man (Coach Trust 40) → Starter (60) → Franchise Star. New teammates start with low chemistry; it grows with every game and win.</p></div>
      ${(P.seasons || []).length ? `<div class="glass panel"><h4>NBL Seasons</h4>${P.seasons.map(x => `<p class="small"><b>Season ${x.n}</b> · ${esc(x.team)} · ${x.w}-${x.l} · ${x.ppg} PPG · ${esc(x.result)}</p>`).join('')}</div>` : ''}</div>`;
  }
  /* the NBL player rankings: every star, Kai, and you (Overall, production, hardware) */
  function rankRows(s) {
    const P = init(s), sum = s.season && s.season.stats.gp ? s.season.stats : null, ppg = sum ? sum.pts / sum.gp : ((s.career.seasons || []).slice(-1)[0] || {}).ppg || 0;
    const mine = Engine.ovr(s) + ppg * .5 + P.trophies.length * 1.5, rows = Object.values(NBL_LEAGUE.stars).map(x => ({ name: x.name, team: x.team, v: x.ovr + 8 - (P.n || 1) * .2 * (x.ovr > 92 ? 1 : 0) }));
    if (P.kaiTeam) rows.push({ name: 'Kai Sterling', team: P.kaiTeam, v: 74 + (P.n || 1) * 4 });
    rows.push({ name: `${s.player.first} ${s.player.last}`, team: P.team, v: mine, me: true }); return rows.sort((a, b) => b.v - a.v);
  }
  const rankOf = (s, name) => { const R = rankRows(s), i = name ? R.findIndex(r => r.name === name) : R.findIndex(r => r.me); return i >= 0 ? i + 1 : null; };
  function rankHtml(s) {
    const P = init(s), rows = rankRows(s), i = rows.findIndex(r => r.me);
    return `<div class="glass panel"><h4>NBL PLAYER RANKINGS</h4><p class="muted small">The league's top players by Overall, production and hardware. You're <b>#${i + 1}</b>.</p>
      <div class="pro-ranks">${rows.slice(0, Math.max(20, i + 3)).map((r, j) => `<div class="pr-row ${r.me ? 'me' : ''}"><span>#${j + 1}</span>${Art.logo(Object.assign({ id: r.team }, T(r.team)), 22)}<b>${esc(r.me ? 'YOU · ' + r.name : r.name)}</b><small>${esc(T(r.team).abbr)}</small></div>`).join('')}</div></div>`;
  }

  /* text tokens for the story: {team} {teamCity} {teamNick} {vet} {vetShort} {role} {seasonN} {votesRank} {coachName} */
  function tokens(s) {
    const P = s.pro; if (!P) return {};
    const t = T(P.team), v = vetName(s), V = P.allstar[P.n] || {};
    return { team: t.name, teamCity: t.cityName || t.city, teamNick: t.nick || t.name, vet: v, vetShort: v.replace(/^.*"(.+)".*$/, '$1'), role: Season.role(s), seasonN: P.n || 1, votesRank: V.rank ? '#' + V.rank : 'outside the top twelve', votesNow: (() => { try { const x = votes(s); return '#' + x.rank; } catch (e) { return '#20'; } })(), kaiNick: T(P.kaiTeam).nick || T(P.kaiTeam).name };
  }

  return { rankRows, rankOf, revenge, tokens, init, sync, seasonDef, offseason, move, tradeTarget, fx, awardsNight, decideAwards, trophyRoom, allStar, votes, freeAgency, offers, contractHtml, rankHtml, vetName, AW };
})();
