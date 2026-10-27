/* =====================================================================
   ENGINE.JS — game state, stats, progression, effects, save/load.
   Pure logic: no DOM except export/import helpers.
   ===================================================================== */
const Engine = (() => {
  const SAVE_PREFIX = 'hoopdreams_slot_';
  const SLOTS = ['1', '2', '3', 'auto'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- CREATION ---------- */
  function heightNorm(h) { return clamp((h - 70) / 17, 0, 1); }
  /* ape index = wingspan − height (inches) */
  function apeOf(height, wingspan) { return clamp((wingspan == null ? height + WINGSPAN.def : wingspan) - height, WINGSPAN.min, WINGSPAN.max); }
  function caps(pos, height, wingspan) {
    const hn = heightNorm(height), ape = apeOf(height, wingspan), out = {};
    for (const a of ATTRS) out[a.k] = CAP_RULES[a.k] ? CAP_RULES[a.k](hn) : 99;
    out.perD += ape * .8; out.intD += ape * 1.1; out.reb += ape * .9; out.dunk += ape * .6; out.finish += ape * .3;
    out.handle -= Math.max(0, ape - 3) * 1.2; out.three -= Math.max(0, ape - 4) * 1;
    for (const k in out) out[k] = Math.round(clamp(out[k], 40, 99));
    return out;
  }
  function startingAttrs(pos, height, arch, wingspan) {
    const P = POSITIONS[pos], A = ARCHETYPES[arch] || { bonus: {} }, cp = caps(pos, height, wingspan), ape = apeOf(height, wingspan);
    const wsAdj = { perD: Math.round(ape * .7), intD: Math.round(ape * .8), reb: Math.round(ape * .7), handle: -Math.round(Math.max(0, ape - 3) * .6), three: -Math.round(Math.max(0, ape - 4) * .6) };
    const rel = (height - P.h[2]) / 3; // taller/shorter than typical for position
    const out = {};
    for (const a of ATTRS) {
      let v = 34 + randi(0, 4) + (P.adj[a.k] || 0) + (A.bonus[a.k] || 0) + (wsAdj[a.k] || 0);
      if (['reb', 'intD', 'str', 'dunk'].includes(a.k)) v += Math.round(rel * 2);
      if (['speed', 'handle', 'perD'].includes(a.k)) v -= Math.round(rel * 2);
      out[a.k] = clamp(v, 20, Math.min(cp[a.k], 60));
    }
    return out;
  }

  /* Proper capitalization for names ("ski" -> "Ski", "mcdonald" stays as typed after the first letter) */
  function properName(n) { return String(n || '').trim().replace(/(^|[\s\-'’.])([a-z])/g, (m, a, b) => a + b.toUpperCase()); }
  function createState(o) {
    o = Object.assign({}, o, { first: properName(o.first), last: properName(o.last), hometown: properName(o.hometown) });
    const ws = o.wingspan == null ? o.height + WINGSPAN.def : o.wingspan;
    const attrs = startingAttrs(o.pos, o.height, o.arch, ws);
    const s = {
      v: 1, id: 'c' + Date.now().toString(36), createdAt: Date.now(), updatedAt: Date.now(),
      difficulty: o.difficulty || 'pro',
      player: {
        first: o.first, last: o.last, pos: o.pos, height: o.height, hometown: o.hometown, num: o.num, arch: o.arch, weapon: o.weapon || 'lightning_dribble', weapons: [{ id: o.weapon || 'lightning_dribble', rank: 1 }], wingspan: ws,
        look: Object.assign({}, o.look, { num: o.num }), attrs, level: 1, xp: 0, sp: 2, age: 16,
      },
      meta: { rep: 5, fans: 120, trust: 50, chem: 50, morale: 60, fatigue: 0, money: 40, injury: { games: 0, name: '' } },
      rel: { lou: 30, kai: 0, tariq: 60, mom: 70, nia: 75 },
      flags: {}, achievements: {},
      counters: { games: 0, wins: 0, losses: 0, dunks: 0, posterizers: 0, threes: 0, mids: 0, layups: 0, crosses: 0, assists: 0, stops: 0, blocks: 0, steals: 0, rebounds: 0, posts: 0, fastbreaks: 0, ftMade: 0, clutchMakes: 0, gameWinners: 0, perfects: 0, aPlus: 0, best: 0, trainings: 0, points: 0, gradePts: 0, gradeN: 0 },
      story: { chapter: 'street', node: 'start' },
      hub: null, feed: [], log: [], ovrHistory: [],
      career: { stage: 'Playground', games: [], seasons: [] },
      inventory: { owned: [], equipped: {} },
      recruit: null, season: null, stageStart: { games: 0, wins: 0, gradePts: 0, gradeN: 0, trainings: 0 },
    };
    s.ovrHistory.push({ label: 'Day 1', ovr: ovr(s) });
    return s;
  }

  /* ---------- RATINGS ---------- */
  function capsOf(s) { return caps(s.player.pos, s.player.height, s.player.wingspan); }
  function ape(s) { return apeOf(s.player.height, s.player.wingspan); }

  /* ---------- ARCHETYPE PASSIVES + WEAPONS ---------- */
  function archOf(s) { return ARCHETYPES[s.player.arch] || ARCHETYPES.lightning; }
  function weaponOf(s) { return WEAPONS[s.player.weapon] || WEAPONS.lightning_dribble; }
  /* your weapons: [{ id, rank, w }] — the rolled one first, more unlock as you level up (BALANCE.weapons.slots) */
  function weapons(s) { if (!s.player.weapons) s.player.weapons = [{ id: s.player.weapon || 'lightning_dribble', rank: 1 }];
    return s.player.weapons.filter(x => WEAPONS[x.id]).map(x => { const evo = x.evo || 1; return { id: x.id, rank: x.rank || 1, evo, w: evo > 1 ? Object.assign({}, WEAPONS[x.id], { name: Weapons.name(x.id, evo), base: WEAPONS[x.id].name, evo }) : WEAPONS[x.id] }; }); }   // evolved weapons (story awakenings) carry their tier name
  function weaponSlots(s) { return BALANCE.weapons.slots.filter(l => s.player.level >= l).length; }
  /* three weapons you can learn for an open slot — fitting your best stats, stable until you pick */
  function weaponOffers(s) {
    const own = weapons(s).map(x => x.id), R = Art.seeded(s.id + ':w' + own.length);
    const types = own.map(id => WEAPONS[id].type), score = id => { const w = WEAPONS[id]; let v = 0, t = 0; for (const k in w.stats) { v += (s.player.attrs[k] || 50) * w.stats[k]; t += w.stats[k]; } return v / t + R() * 14 - (types.includes(w.type) ? 12 : 0); };
    return Object.keys(WEAPONS).filter(id => !own.includes(id) && WEAPONS[id].type !== 'zone' && !WEAPONS[id].story).sort((a, b) => score(b) - score(a)).slice(0, 3);
  }
  function learnWeapon(s, id) { weapons(s); if (!WEAPONS[id] || s.player.weapons.length >= weaponSlots(s) || s.player.weapons.some(x => x.id === id)) return false; s.player.weapons.push({ id, rank: 1 }); return true; }
  function weaponUpgradeInfo(s, id) { const x = weapons(s).find(y => y.id === id), R = BALANCE.weapons.ranks; if (!x) return null; const next = x.rank + 1; return { rank: x.rank, max: x.rank >= R.max, cost: R.cost(x.rank), level: R.level(next), ok: x.rank < R.max && s.player.sp >= R.cost(x.rank) && s.player.level >= R.level(next) }; }
  function upgradeWeapon(s, id) { const i = weaponUpgradeInfo(s, id); if (!i || !i.ok) return false; s.player.sp -= i.cost; s.player.weapons.find(y => y.id === id).rank++; return true; }
  /* % of one of your weapons against a defender (stats) */
  function weaponPct(s, id, def, bonus) { const x = weapons(s).find(y => y.id === id) || { rank: 1, evo: 1 }; return Weapons.pct(id, Balance.userStats(s), { def, level: s.player.level, rank: x.rank, evo: x.evo, diff: s.difficulty, bonus }); }
  function passiveMod(s, key) { const m = archOf(s).passive.mods || {}; return (m[key] || 0) + (m.all || 0); }
  function passiveMg(s, key) { const m = archOf(s).passive.mg || {}; return m[key] || 1; }
  function hasSpecial(s, id) { return archOf(s).passive.special === id; }
  /* Roll: pick a rarity by odds, then a random entry of that rarity. */
  function roll(table) {
    let r = Math.random(), rar = 'common';
    for (const k of RARITY_ORDER) { r -= RARITY[k].odds; if (r <= 0) { rar = k; break; } }
    let pool = Object.keys(table).filter(id => table[id].rarity === rar);
    if (!pool.length) pool = Object.keys(table);
    return pick(pool);
  }
  /* Effective attribute: base + gear − injury penalty */
  function attr(s, k) {
    let v = s.player.attrs[k];
    for (const slot in s.inventory.equipped) { const it = SHOP_BY_ID[s.inventory.equipped[slot]]; if (it && it.boost && it.boost[k]) v += it.boost[k]; }
    if (s.meta.injury && s.meta.injury.games > 0) v -= 6;
    return clamp(v, 0, 99);
  }
  /* Avatar look with equipped gear applied */
  function look(s) {
    const L = Object.assign({}, s.player.look, { num: s.player.num });
    for (const slot in s.inventory.equipped) { const it = SHOP_BY_ID[s.inventory.equipped[slot]]; if (it) Object.assign(L, it.look); }
    if (s.shoe && s.shoe.color) L.shoeColor = s.shoe.color;   // your signature shoe (Chapter 5)
    return L;
  }
  function ovrRaw(s) {
    const w = POSITIONS[s.player.pos].w; let sum = 0, tw = 0;
    for (const k in w) { sum += s.player.attrs[k] * w[k]; tw += w[k]; }
    const badgeBonus = Math.min(4, badges(s).reduce((t, b) => t + b.tier * 0.12, 0));
    return sum / tw + badgeBonus;
  }
  function ovr(s) { return clamp(Math.round(ovrRaw(s)), 1, 99); }
  function ovrLabel(s) { return ovrRaw(s) >= 99.5 ? '99+' : String(ovr(s)); }
  function tierOf(o) {
    if (o >= 95) return { id: 'goat', name: 'GOAT' };
    if (o >= 85) return { id: 'diamond', name: 'Diamond' };
    if (o >= 75) return { id: 'gold', name: 'Gold' };
    if (o >= 60) return { id: 'silver', name: 'Silver' };
    return { id: 'bronze', name: 'Bronze' };
  }
  function radar(s) { return RADAR.map(g => ({ n: g.n, v: g.w ? g.keys.reduce((t, k) => t + s.player.attrs[k] * g.w[k], 0) : g.keys.reduce((t, k) => t + s.player.attrs[k], 0) / g.keys.length })); }   // g.w: weighted group

  /* ---------- BADGES ---------- */
  function badgeTier(s, b) {
    const v = s.player.attrs[b.attr]; let t1 = 0, t2 = 0;
    b.at.forEach((th, i) => { if (v >= th) t1 = i + 1; });
    const c = s.counters[b.counter] || 0;
    b.ct.forEach((th, i) => { if (c >= th) t2 = i + 1; });
    return Math.max(t1, t2);
  }
  function badges(s) { return BADGES.map(b => ({ id: b.id, b, tier: badgeTier(s, b) })).filter(x => x.tier > 0); }
  function badgeBonus(s, boostKey) { // +2% per tier for matching badges
    return BADGES.filter(b => b.boosts.includes(boostKey)).reduce((t, b) => t + badgeTier(s, b) * 2, 0);
  }
  function badgeSnapshot(s) { const o = {}; BADGES.forEach(b => o[b.id] = badgeTier(s, b)); return o; }
  function badgeDiff(before, s) {
    const out = []; BADGES.forEach(b => { const t = badgeTier(s, b); if (t > (before[b.id] || 0)) out.push({ b, tier: t }); }); return out;
  }

  /* ---------- XP / LEVELS / UPGRADES ---------- */
  function addXP(s, n) {
    n = Math.round(n * DIFFICULTY[s.difficulty].xp);
    s.player.xp += n; let ups = 0;
    while (s.player.xp >= PROGRESSION.xpForLevel(s.player.level)) {
      s.player.xp -= PROGRESSION.xpForLevel(s.player.level);
      s.player.level++; s.player.sp += PROGRESSION.spPerLevel; ups++;
    }
    return { xp: n, levels: ups };
  }
  function upgradeCost(v) { return PROGRESSION.upgradeCost(v); }
  function canUpgrade(s, k) { const v = s.player.attrs[k]; return v < capsOf(s)[k] && s.player.sp >= upgradeCost(v); }
  function upgrade(s, k) {
    if (!canUpgrade(s, k)) return false;
    s.player.sp -= upgradeCost(s.player.attrs[k]); s.player.attrs[k]++; return true;
  }
  /* Raise an attribute directly (training/story), respecting caps. Returns real delta. */
  function bump(s, k, n) {
    const before = s.player.attrs[k];
    s.player.attrs[k] = clamp(before + n, 0, capsOf(s)[k]);
    return s.player.attrs[k] - before;
  }

  /* ---------- EFFECTS (story choices, events) ----------
     fx: { attrs:{k:n}, xp, sp, rep, fans, trust, chem, morale, fatigue, money,
           rel:{id:n}, flag:'x'|[..], unflag, injury:{games,name}, log:'text' }
     Returns array of {label, v} for UI toasts. */
  function applyFx(s, fx) {
    const out = []; if (!fx) return out;
    if (fx.attrs) for (const k in fx.attrs) { const d = bump(s, k, fx.attrs[k]); if (d) out.push({ label: ATTR_BY_KEY[k].n, v: d }); }
    if (fx.xp) { const r = addXP(s, fx.xp); out.push({ label: 'XP', v: r.xp }); if (r.levels) out.push({ label: 'Level Up!', v: r.levels, special: 'level' }); }
    if (fx.sp) { s.player.sp += fx.sp; out.push({ label: 'Skill Points', v: fx.sp }); }
    const metaKeys = { rep: 'Reputation', trust: 'Coach Trust', chem: 'Chemistry', morale: 'Confidence', fatigue: 'Fatigue' };
    for (const k in metaKeys) if (fx[k]) { const b = s.meta[k]; s.meta[k] = clamp(b + fx[k], 0, 100); const d = s.meta[k] - b; if (d) out.push({ label: metaKeys[k], v: d, inv: k === 'fatigue' }); }
    if (fx.fans) { const d = Math.round(fx.fans); s.meta.fans = Math.max(0, s.meta.fans + d); out.push({ label: 'Fans', v: d, fmt: 'fans' }); }
    if (fx.money) { s.meta.money = Math.max(0, s.meta.money + fx.money); out.push({ label: 'Money', v: fx.money, fmt: 'money' }); }
    if (fx.rel) for (const id in fx.rel) { const b = s.rel[id] || 0; s.rel[id] = clamp(b + fx.rel[id], -100, 100); const ch = STORY.characters[id]; out.push({ label: (ch ? ch.short || ch.name : id), v: s.rel[id] - b, fmt: 'rel' }); }
    if (fx.flag) [].concat(fx.flag).forEach(f => { const was = s.flags[f]; s.flags[f] = true; if (!was && typeof Rankings !== 'undefined') Rankings.onFlag(s, f); });   // story results move your prospect rank (once)
    if (fx.unflag) [].concat(fx.unflag).forEach(f => delete s.flags[f]);
    if (fx.injury) { s.meta.injury = { games: fx.injury.games, name: fx.injury.name }; out.push({ label: 'Injury: ' + fx.injury.name, v: -fx.injury.games, fmt: 'inj' }); }
    if (fx.log) s.log.push(text(fx.log, s));
    return out;
  }

  /* Conditions used by choice requirements and branch nodes. */
  function check(s, c) {
    if (!c) return true;
    if (c.flag && ![].concat(c.flag).every(f => s.flags[f])) return false;
    if (c.notFlag && [].concat(c.notFlag).some(f => s.flags[f])) return false;
    if (c.minOvr && ovr(s) < c.minOvr) return false;
    if (c.money && s.meta.money < c.money) return false;
    if (c.minRep && s.meta.rep < c.minRep) return false;
    if (c.rel) for (const id in c.rel) if ((s.rel[id] || 0) < c.rel[id]) return false;
    if (c.maxRel) for (const id in c.maxRel) if ((s.rel[id] || 0) > c.maxRel[id]) return false;
    if (c.attr) for (const k in c.attr) if (s.player.attrs[k] < c.attr[k]) return false;
    if (c.arch && ![].concat(c.arch).includes(s.player.arch)) return false;
    if (c.pos && ![].concat(c.pos).includes(s.player.pos)) return false;
    if (c.opp && !(s.season && [].concat(c.opp).includes(s.season.nextOpp))) return false;
    if (c.notOpp && s.season && [].concat(c.notOpp).includes(s.season.nextOpp)) return false;
    if (c.minStars && !(s.recruit && s.recruit.stars >= c.minStars)) return false;
    if (c.rank && !(typeof Rankings !== 'undefined' && Rankings.on(s) && Rankings.rankOf(s) <= c.rank)) return false;   // prospect rank #c.rank or better
    if (c.maxStars && s.recruit && s.recruit.stars > c.maxStars) return false;
    if (c.college && ![].concat(c.college).includes(s.career.college)) return false;
    if (c.notCollege && [].concat(c.notCollege).includes(s.career.college)) return false;
    if (c.hs && s.career.hs !== c.hs) return false;
    if (c.path && s.career.path !== c.path) return false;
    if (c.minTrust && s.meta.trust < c.minTrust) return false;
    if (c.maxTrust && s.meta.trust > c.maxTrust) return false;
    if (c.usaInvite && !(typeof USA !== 'undefined' && USA.inviteScore(s) >= USA_CAMP.invite)) return false;   // national team list
    if (c.maxRank && !(s.recruit && s.recruit.rank <= c.maxRank)) return false;
    if (c.minCount) for (const k in c.minCount) if ((s.counters[k] || 0) < c.minCount[k]) return false;
    if (c.minDraft && (s.meta.draftStock || 0) < c.minDraft) return false;          // Chapter 3: draft stock / overseas interest / your club
    if (c.minOverseas && (s.meta.overseas || 0) < c.minOverseas) return false;
    if (c.maxDraft != null && (s.meta.draftStock || 0) > c.maxDraft) return false;
    if (c.club && ![].concat(c.club).includes(s.career.club)) return false;
    if (c.notClub && [].concat(c.notClub).includes(s.career.club)) return false;
    return true;
  }

  /* Story stat-check chance: {a:'iq'|['iq','clutch'], dc:50} */
  function checkPct(s, chk) {
    const keys = [].concat(chk.a); const v = keys.reduce((t, k) => t + attr(s, k), 0) / keys.length;
    const p = 50 + (v - chk.dc) * 2.2 + (s.meta.morale - 50) * 0.15 + DIFFICULTY[s.difficulty].pct * 0.5;
    return Math.round(clamp(p, 5, 95));
  }

  /* In-game success % for a decision.
     o: { w:{attr:weight}, def: defender rating, boost:'three' (badge key), mods: number, clutch:bool, fatigue } */
  function playPct(s, o) {
    let tw = 0, v = 0; for (const k in o.w) { v += attr(s, k) * o.w[k]; tw += o.w[k]; } v /= tw;
    let p = (o.base || 50) + (v - o.def) * (o.k || 0.95);
    p += badgeBonus(s, o.boost || '') + (o.clutch ? badgeBonus(s, 'clutch') + (attr(s, 'clutch') - 55) * 0.25 : 0);
    p += (s.meta.morale - 50) * 0.12 - (o.fatigue || 0) * 0.12 + DIFFICULTY[s.difficulty].pct + (o.mods || 0);
    return Math.round(clamp(p, 5, 95));
  }

  /* ---------- ACHIEVEMENTS ---------- */
  function checkAchievements(s) {
    const out = [];
    for (const a of ACHIEVEMENTS) if (!s.achievements[a.id]) { try { if (a.check(s)) { s.achievements[a.id] = Date.now(); out.push(a); } } catch (e) { /* ignore */ } }
    return out;
  }

  /* ---------- TEXT TEMPLATES ---------- */
  function text(str, s) {
    if (!str || !s) return str || '';
    const p = s.player;
    const map = {
      name: p.first + ' ' + p.last, first: p.first, last: p.last, pos: p.pos, posName: POSITIONS[p.pos].name,
      hometown: p.hometown, num: p.num, FIRST: p.first.toUpperCase(), LAST: p.last.toUpperCase(), arch: archOf(s).name, sig: weaponOf(s).name, weapon: weaponOf(s).name, wingspan: heightStr(p.wingspan || p.height + 2),
      height: heightStr(p.height), ovr: ovr(s),
      hs: s.career.hs && LOCAL_TEAMS[s.career.hs] ? LOCAL_TEAMS[s.career.hs].name : 'Lincoln High',
      hsShort: s.career.hs === 'westbrook' ? 'Westbrook' : 'Lincoln',
      rivalHs: s.career.hs === 'westbrook' ? 'Lincoln' : 'Westbrook',
      coach: s.career.hs === 'westbrook' ? 'Coach Graves' : 'Coach Brennan',
      stars: s.recruit ? starStr(s.recruit.stars) : '☆☆☆☆☆', starN: s.recruit ? s.recruit.stars : 0, rank: s.recruit ? '#' + s.recruit.rank : 'unranked',
      college: s.career.college && COLLEGES[s.career.college] ? COLLEGES[s.career.college].name : 'college',
      opp: s.season && s.season.nextOpp && LOCAL_TEAMS[s.season.nextOpp] ? LOCAL_TEAMS[s.season.nextOpp].name : 'them',
      club: s.career.club && LOCAL_TEAMS[s.career.club] ? LOCAL_TEAMS[s.career.club].name : 'the club', clubCity: s.career.club && OVERSEAS_CLUBS[s.career.club] ? OVERSEAS_CLUBS[s.career.club].city : 'Europe',
      clubCityUp: (s.career.club && OVERSEAS_CLUBS[s.career.club] ? OVERSEAS_CLUBS[s.career.club].city : 'Europe').toUpperCase(), seed: s.career.marchSeed || 8, draft: s.meta.draftStock || 0,
      nick: s.career.college && COLLEGES[s.career.college] ? COLLEGES[s.career.college].nick : 'team', conf: s.career.college && COLLEGES[s.career.college] ? COLLEGES[s.career.college].conf : 'conference',
    };
    return str.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
  }
  function starStr(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  function heightStr(h) { return Math.floor(h / 12) + "'" + (h % 12) + '"'; }
  function fmtFans(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); }
  function fmtMoney(n) { return '$' + (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : Math.round(n).toLocaleString()); }

  /* ---------- SOCIAL FEED ---------- */
  function post(s, p) {
    s.feed.unshift(Object.assign({ t: Date.now(), likes: randi(5, 60) * Math.max(1, Math.round(s.meta.fans / 400)) }, p, { text: text(p.text, s) }));
    s.feed = s.feed.slice(0, 60);
  }

  /* ---------- STAGE DEVELOPMENT (see PROGRESSION in data-game.js) ---------- */
  function snapshotStage(s) { const c = s.counters; s.stageStart = { games: c.games, wins: c.wins, gradePts: c.gradePts || 0, gradeN: c.gradeN || 0, trainings: c.trainings }; }
  /* 0..1 performance over the current stage: wins, game grades, training */
  function stagePerf(s) {
    const st = s.stageStart || { games: 0, wins: 0, gradePts: 0, gradeN: 0, trainings: 0 }, c = s.counters;
    const g = c.games - st.games, w = c.wins - st.wins, gn = (c.gradeN || 0) - (st.gradeN || 0), gp = (c.gradePts || 0) - (st.gradePts || 0), tr = c.trainings - st.trainings;
    const score = (g ? w / g : .5) * .4 + (gn ? gp / gn / 4 : .5) * .4 + Math.min(1, tr / Math.max(2, g)) * .2;
    return PROGRESSION.devMinPerf + (1 - PROGRESSION.devMinPerf) * clamp(score, 0, 1);
  }
  /* Natural growth: closes part of the gap to the stage target, spread over position-relevant attributes. */
  function develop(s, stage) {
    const target = PROGRESSION.CURVE[stage], perf = stagePerf(s), start = ovrRaw(s), before = ovr(s);
    const gain = Math.min(PROGRESSION.devMaxGain[stage] || 5, Math.max(0, (target - start) * perf));
    const w = POSITIONS[s.player.pos].w, bonus = archOf(s).bonus, cp = capsOf(s), deltas = {};
    let guard = 0;
    while (ovrRaw(s) < start + gain && guard++ < 600) {
      const opts = ATTRS.map(a => a.k).filter(k => s.player.attrs[k] < cp[k]);
      if (!opts.length) break;
      const wt = opts.map(k => w[k] * (bonus[k] ? 1.6 : 1) * (1 + (cp[k] - s.player.attrs[k]) / 99));
      let r = Math.random() * wt.reduce((a, b) => a + b, 0), k = opts[0];
      for (let i = 0; i < opts.length; i++) { r -= wt[i]; if (r <= 0) { k = opts[i]; break; } }
      s.player.attrs[k]++; deltas[k] = (deltas[k] || 0) + 1;
    }
    snapshotStage(s);
    return { before, after: ovr(s), perf, deltas, target };
  }

  /* ---------- RECRUITING ---------- */
  function recruitScore(s) {
    const R = RECRUITING; let sc = (ovr(s) - 40) * 2.2 + s.meta.rep * 0.15 + ((s.recruit && s.recruit.ppg) || 0) * 0.6;
    for (const k in R.bonus) if (s.flags[k]) sc += R.bonus[k];
    for (const k in R.penalty) if (s.flags[k]) sc += R.penalty[k];
    sc += (s.features && s.features.mix && s.features.mix.bonus) || 0;   // released mixtapes (js/features.js)
    if (typeof Rankings !== 'undefined') sc += Rankings.recruitBonus(s);   // your prospect rank (js/rankings.js)
    return Math.round(sc);
  }
  function starsFor(score) { let n = 1; RECRUITING.starAt.forEach((t, i) => { if (score >= t) n = i + 1; }); return n; }
  function rankFor(score) { return Math.max(2, Math.round(3000 * Math.exp(-score / 13))); }

  /* ---------- SAVE / LOAD ---------- */
  function save(s, slot = 'auto') {
    s.updatedAt = Date.now();
    try { localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(s)); return true; } catch (e) { return false; }
  }
  function load(slot) {
    try { const raw = localStorage.getItem(SAVE_PREFIX + slot); return raw ? migrate(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  function remove(slot) { try { localStorage.removeItem(SAVE_PREFIX + slot); } catch (e) { } }
  function list() {
    return SLOTS.map(slot => {
      const s = load(slot);
      return { slot, s, summary: s ? { name: s.player.first + ' ' + s.player.last, ovr: ovr(s), stage: s.career.stage, arc: typeof Story !== 'undefined' ? Story.label(s) : '', date: new Date(s.updatedAt).toLocaleString(), look: s.player.look } : null };
    });
  }
  function latest() { return list().filter(x => x.s).sort((a, b) => b.s.updatedAt - a.s.updatedAt)[0] || null; }
  function migrate(s) { // fill missing fields from newer versions
    if (!s || !s.player) return null;
    const fresh = { counters: {}, achievements: {}, flags: {}, rel: {}, feed: [], log: [], ovrHistory: [], inventory: { owned: [], equipped: {} } };
    for (const k in fresh) if (!s[k]) s[k] = fresh[k];
    // archetype/weapon split + wingspan (older saves)
    const OLD_SIG = { sharpshooter: 'splash', slasher: 'lightning', playmaker: 'nolook', lockdown: 'clamp', twoway: 'takeover', stretch: 'popbomb', post: 'dream', rimrunner: 'skyscraper' };
    if (!s.player.weapon) s.player.weapon = WEAPON_MIGRATE[OLD_SIG[s.player.arch]] || 'lightning_dribble';
    if (!WEAPONS[s.player.weapon]) s.player.weapon = 'lightning_dribble';
    if (!Array.isArray(s.player.weapons)) s.player.weapons = [{ id: s.player.weapon, rank: 1 }];   // multi-weapon saves (older saves had one)
    if (ARCH_MIGRATE[s.player.arch]) s.player.arch = ARCH_MIGRATE[s.player.arch];
    if (!ARCHETYPES[s.player.arch]) s.player.arch = 'lightning';
    s.player.first = properName(s.player.first); s.player.last = properName(s.player.last);
    if (s.player.wingspan == null) s.player.wingspan = s.player.height + WINGSPAN.def;
    if (!DIFFICULTY[s.difficulty]) s.difficulty = 'pro';   // Rookie was removed -> Pro
    if (!s.career) s.career = { stage: 'Playground', games: [] };
    if (!s.career.seasons) s.career.seasons = [];
    if (s.recruit === undefined) s.recruit = null;
    if (s.season === undefined) s.season = null;
    if (!s.stageStart) s.stageStart = { games: 0, wins: 0, gradePts: 0, gradeN: 0, trainings: 0 };
    ['games', 'wins', 'losses', 'dunks', 'posterizers', 'threes', 'mids', 'layups', 'crosses', 'assists', 'stops', 'blocks', 'steals', 'rebounds', 'posts', 'fastbreaks', 'ftMade', 'clutchMakes', 'gameWinners', 'perfects', 'aPlus', 'best', 'trainings', 'points', 'gradePts', 'gradeN'].forEach(k => { if (s.counters[k] == null) s.counters[k] = 0; });
    return s;
  }
  function exportSave(s) {
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hoopdreams-${(s.player.first + '-' + s.player.last).toLowerCase().replace(/[^a-z0-9-]/g, '')}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function importSave(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { try { const s = migrate(JSON.parse(fr.result)); s ? res(s) : rej(new Error('Not a Hoop Dreams save')); } catch (e) { rej(e); } };
      fr.onerror = () => rej(fr.error); fr.readAsText(file);
    });
  }

  return {
    clamp, rand, randi, pick, properName, caps, capsOf, ape, apeOf, archOf, weaponOf, weapons, weaponSlots, weaponOffers, learnWeapon, weaponUpgradeInfo, upgradeWeapon, weaponPct, passiveMod, passiveMg, hasSpecial, roll, createState, attr, look, ovr, ovrRaw, ovrLabel, tierOf, radar,
    badges, badgeTier, badgeBonus, badgeSnapshot, badgeDiff, addXP, upgradeCost, canUpgrade, upgrade, bump,
    applyFx, check, checkPct, playPct, checkAchievements, text, heightStr, starStr, snapshotStage, stagePerf, develop, recruitScore, starsFor, rankFor, fmtFans, fmtMoney, post,
    save, load, remove, list, latest, exportSave, importSave,
  };
})();
