/* =====================================================================
   USA.JS — the national team selection camp: drill sessions, the staff's ranking board ("on the bubble"),
   cut days, and story talks with a gauge. Story + numbers: js/data-usa.js (USA_CAMP, STORY.chapters.usa).
   Camp points: every camper's score = offset × USA_CAMP.scale + daily form; yours = what you earn in camp
   (drills, scrimmage grades, film sessions, off-court choices). You're always near the bottom of the board
   (BALANCE.camp.board): your camp points move you around the last few spots, never into the safe ones, and the
   camper you bonded with sits right beside you. Cut days keep the top `keep`; the final board has you 12th.
   ===================================================================== */
const USA = (() => {
  const $ = id => document.getElementById(id), esc = UI.esc, sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const C = () => USA_CAMP;
  function camp(s) { return s.usa || (s.usa = { pts: 0, start: Engine.ovr(s), day: 1, cut: [], prev: {} }); }
  const youName = s => `${s.player.first} ${s.player.last}`;

  /* everyone still in camp, best first. o.cutAt: a cut is being made (you stay at or above it); o.final: the final
     sheet (you 12th, the camper you bonded with 13th) */
  function field(s, o = {}) {
    const u = camp(s), B = BALANCE.camp.board;
    const list = C().campers.filter(c => !u.cut.includes(c.name)).map(c => {
      const R = Art.seeded(c.name + '|' + u.day + '|' + (s.id || '')), form = (R() * 2 - 1) * C().form;
      return { name: c.name, score: Math.round((c.off * C().scale + form) * 10) / 10 };
    }).sort((a, b) => b.score - a.score);
    const bi = list.findIndex(x => x.name === B.bond), bond = bi >= 0 ? list.splice(bi, 1)[0] : null;
    // your spot: the last one at your worst, one above the next cut line at your best
    const n = list.length + 1 + (bond ? 1 : 0), line = n > 14 ? 14 : 12, top = line - (B.above || 1), k = clamp((u.pts - B.perf[0]) / (B.perf[1] - B.perf[0]), 0, 1);
    let pos = o.final ? Math.min(12, n) : Math.round(n - k * (n - top)); if (o.cutAt) pos = Math.min(pos, o.cutAt);
    const me = { name: youName(s), me: true, v: true };
    const above = bond && !o.final && (pos === n || (o.cutAt && pos + 1 > o.cutAt));   // he's next to you: below, unless that's past a cut being made now
    if (bond) bond.v = true;
    if (above) list.splice(Math.max(0, pos - 2), 0, bond, me); else { list.splice(pos - 1, 0, me); if (bond) list.splice(pos, 0, bond); }
    // you (and he) get board scores between your neighbours'
    for (let i = 0; i < list.length; i++) {
      if (!list[i].v) continue; let j = i; while (j < list.length && list[j].v) j++;
      const a = i > 0 ? list[i - 1].score : (j < list.length ? list[j].score + 3 : 10), b = j < list.length ? list[j].score : a - 3;
      for (let q = i; q < j; q++) list[q].score = Math.round((a - (a - b) * (q - i + 1) / (j - i + 1)) * 10) / 10;
      i = j - 1;
    }
    list.forEach(x => delete x.v);
    return list;
  }
  const rankOf = s => field(s).findIndex(x => x.me) + 1;

  /* ---------- the board ---------- */
  function boardRows(s, list, line, opts = {}) {
    const u = camp(s);
    return list.map((x, i) => {
      const was = u.prev[x.name], mv = was ? was - (i + 1) : 0;
      return `<div class="ub-row ${x.me ? 'me' : ''} ${opts.cutNames && opts.cutNames.includes(x.name) ? 'tobe' : ''}" data-n="${esc(x.name)}">
        <span class="ub-rank">${i + 1}</span><span class="ub-name">${esc(x.me ? 'YOU · ' + x.name : x.name)}</span>
        <span class="ub-mv ${mv > 0 ? 'up' : mv < 0 ? 'down' : ''}">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : '–'}</span><span class="ub-sc">${x.score.toFixed(1)}</span></div>${i + 1 === line ? '<div class="ub-line">ROSTER LINE</div>' : ''}`;
    }).join('');
  }
  function snapshot(s, list) { const u = camp(s); u.prev = {}; list.forEach((x, i) => u.prev[x.name] = i + 1); u.snap = u.pts; }
  /* how today went (camp points since the last board): the story notices a great day, even when the board barely does */
  const today = s => { const u = camp(s); return u.snap == null ? 0 : u.pts - u.snap; };
  const greatDay = s => today(s) >= BALANCE.camp.board.great;
  async function board(G, node) {
    if (node.mode === 'roster') return reveal(G, node);
    const s = G.state, u = camp(s), keep = node.keep || 12, cutting = node.mode === 'cut', list = field(s, cutting && node.safe ? { cutAt: keep } : {});   // safe: you squeak in on the bubble
    const me = list.findIndex(x => x.me) + 1;
    UI.setBg('locker');
    const cutNames = cutting ? list.slice(keep).map(x => x.name) : [];
    UI.showScreen(`<div class="usa-board glass">
      <div class="ub-head"><b>${esc(node.title || 'THE BOARD')}</b><small>${esc(node.note || (cutting ? 'Coach Reyes reads the list.' : `${greatDay(s) ? 'You were great today. So was everyone else. ' : ''}Top ${keep} make the roster. You're #${me} of ${list.length}.`))}</small></div>
      <div class="ub-list" id="ubList">${boardRows(s, list, keep)}</div>
      <div class="ub-foot" id="ubFoot">${cutting ? '<div class="ub-read" id="ubRead">…</div>' : ''}<button class="btn primary" id="ubGo" ${cutting ? 'hidden' : ''}>Continue ›</button></div></div>`, 'usaboard');
    SFX.music('build');
    let made = true;
    if (cutting) {
      made = me <= keep; SFX.music('clutch'); const read = $('ubRead');
      read.textContent = 'These players have been released from camp…'; await sleep(1400);
      // names are read one by one (yours, if it's coming, last)
      const order = cutNames.filter(n => n !== youName(s)).sort(() => Math.random() - .5).concat(cutNames.includes(youName(s)) ? [youName(s)] : []);
      for (const n of order) {
        const row = document.querySelector(`.ub-row[data-n="${CSS.escape(n)}"]`); read.textContent = n.toUpperCase() + '.';
        if (n === youName(s)) { SFX.play('heartbeat'); await sleep(900); }
        if (row) { row.classList.add('cut'); row.scrollIntoView({ block: 'nearest' }); } SFX.play(n === youName(s) ? 'bad' : 'whistle'); await sleep(n === youName(s) ? 1200 : 750);
      }
      document.querySelectorAll('.ub-row:not(.cut)').forEach(r => r.classList.add('safe'));
      read.innerHTML = made ? `<b class="ok">YOU'RE STILL HERE.</b> ${me >= keep - 1 ? `#${me} of ${keep}. Barely.` : `${keep} stay.`}` : `<b class="no">CUT.</b> Your camp ends here.`;
      SFX.play(made ? 'levelup' : 'groan'); if (made) UI.confetti && UI.confetti();
      u.cut.push(...cutNames.filter(n => n !== youName(s))); u.made = made;
      if (C().campers.some(c => c.name === 'Kai Sterling') && !u.cut.includes('Kai Sterling')) u.kai = 'made';
      $('ubGo').hidden = false;
    }
    snapshot(s, list); u.day++; G.save();
    await new Promise(r => $('ubGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, cutting ? (made ? node.made : node.cut) : node.next);
  }

  /* ---------- the final cut: Reyes reads the twelve from the top. Yours is the last name (BALANCE.camp.board) ---------- */
  async function reveal(G, node) {
    const s = G.state, u = camp(s), keep = node.keep || 12, list = field(s, { final: true }), mine = youName(s), me = list.findIndex(x => x.me) + 1;
    const short = n => n.replace(/"[^"]*"\s*/, '').split(' ').slice(-1)[0].toUpperCase(), bond = list[me] && !list[me].me ? list[me] : null;
    UI.setBg('locker');
    const rows = list.map((x, i) => `<div class="ub-row hid" data-i="${i}"><span class="ub-rank">${i + 1}</span><span class="ub-name">· · · · · · ·</span><span class="ub-mv"></span><span class="ub-sc"></span></div>${i + 1 === keep ? '<div class="ub-line">ROSTER LINE</div>' : ''}`).join('');
    UI.showScreen(`<div class="usa-board glass ub-rv">
      <div class="ub-head"><b>${esc(node.title || 'FINAL ROSTER')}</b><small>Coach Reyes reads the twelve. Top of the sheet first.</small></div>
      <div class="ub-list" id="ubList">${rows}</div>
      <div class="ub-foot"><div class="ub-read" id="ubRead">…</div><button class="btn primary" id="ubGo" hidden>Continue ›</button></div></div>`, 'usaboard');
    const read = $('ubRead'), rowAt = i => document.querySelector(`.ub-row[data-i="${i}"]`);
    const show = (i, cls) => { const x = list[i], r = rowAt(i); if (!r) return; r.querySelector('.ub-name').textContent = x.me ? 'YOU · ' + x.name : x.name; r.querySelector('.ub-sc').textContent = x.score.toFixed(1); r.classList.remove('hid'); r.classList.add('in', cls); if (x.me) r.classList.add('me'); r.scrollIntoView({ block: 'nearest' }); };
    SFX.music('clutch'); await sleep(1300);
    for (let i = 0; i < keep - 1; i++) {   // one by one from the top; yours isn't among them
      read.textContent = `${i + 1}. ${short(list[i].name)}.`; show(i, 'safe'); SFX.play(i < 3 ? 'whistle' : 'tick');
      await sleep(i < 3 ? 900 : i < 8 ? 720 : 1050);
      if (i === 7) { read.textContent = 'Four jerseys left.'; await sleep(1100); }
    }
    // one jersey left: the music cuts out, a heartbeat, close-ups
    SFX.music(null); read.textContent = 'One jersey left.'; document.querySelector('.ub-rv').classList.add('hush');
    SFX.play('heartbeat'); await sleep(950); SFX.play('heartbeat'); await sleep(950);
    if (typeof Story !== 'undefined' && typeof USA4 !== 'undefined') { const ctx = (() => { try { return G.csCtx(s.story.node); } catch (e) { return {}; } })(); await Story.cut(USA4.twelfth(s, bond && bond.name), ctx, { seenId: 'usa_twelfth' }); }
    read.textContent = 'Twelve…'; SFX.play('heartbeat'); await sleep(1500);
    show(me - 1, 'safe'); rowAt(me - 1).classList.add('pop'); document.querySelector('.ub-rv').classList.remove('hush');
    read.innerHTML = `<b class="ok">TWELVE: ${esc(short(mine))}.</b> The last jersey.`; SFX.play('stinger'); UI.confetti && UI.confetti(); SFX.music('build');
    await sleep(2200);
    // under the line: the camper you bonded with first
    read.textContent = 'These players have been released from camp…'; await sleep(1200);
    for (let i = keep; i < list.length; i++) { show(i, 'cut'); read.textContent = short(list[i].name) + '.'; SFX.play(i === keep ? 'bad' : 'whistle'); await sleep(i === keep ? 1600 : 900); }
    if (bond) read.innerHTML = `<b class="ok">YOU MADE THE TWELVE.</b> ${esc(short(bond.name))} is the first name under the line.`;
    else read.innerHTML = '<b class="ok">YOU MADE THE TWELVE.</b> The last jersey on the sheet.';
    s.flags.usa_bench = true; delete s.flags.usa_rotation; if (u.pts >= BALANCE.camp.board.perf[1] * .55) s.flags.usa_camp_good = true;   // the twelfth man rides the bench; a strong camp still earns Reyes' trust
    u.place = me; u.made = true; u.cut.push(...list.slice(keep).map(x => x.name).filter(n => n !== mine)); if (bond) u.bond = bond.name;
    if (C().campers.some(c => c.name === 'Kai Sterling') && !u.cut.includes('Kai Sterling')) u.kai = 'made';
    snapshot(s, list); u.day++; G.save();
    $('ubGo').hidden = false;
    await new Promise(r => $('ubGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, node.made);
  }

  /* ---------- drills (the match minigames, scored 0–100 and ranked) ---------- */
  const DRILLS = {
    shotMeter: { name: 'SPOT-UP SHOOTING', desc: 'Catch, set your feet, release at the top.', run: async (L, ME, W) => { const r = await Match.MG.shotMeter(L, { title: 'SPOT-UP SHOOTING', green: (.06 + Balance.eff(ME.three) / 99 * .14) * W, dur: 1, sub: `Three-Point ${ME.three}` }); return r.perfect ? 100 : r.good ? 70 + r.quality * 25 : r.quality * 55; } },
    dribbleCombo: { name: 'BALL-HANDLING GAUNTLET', desc: 'Hit every move before the cone closes.', run: async (L, ME, W) => { const r = await Match.MG.dribbleCombo(L, { title: 'BALL-HANDLING GAUNTLET', len: 5, time: (.7 + ME.handle / 99 * .6) * W }); return (r.hits || 0) / (r.total || 5) * 100; } },
    freeThrow: { name: 'FREE THROWS UNDER FATIGUE', desc: 'Three shots after a full-court sprint.', run: async (L, ME, W, s) => { const lk = Engine.look(s); const r = await Match.MG.freeThrow(L, { shots: 3, base: Balance.pct('ft', ME).pct, stat: ME.ft, zone: (.75 + Balance.eff(ME.ft) / 99) * W, wobble: 1.9, shooter: { num: s.player.num, name: s.player.last, color: '#1e3a8a', trim: '#dc2626', skin: lk.skin, hair: lk.hairColor }, lane: { us: '#1e3a8a', them: '#dc2626' } }); return (r.made || 0) / 3 * 100; } },
    drive: { name: 'ATTACK THE CLOSEOUT', desc: 'Read the defender, beat him, finish.', run: async (L, ME, W, s) => {
      const ctx = { venue: 'usa_center', us: LOCAL_TEAMS.usa, them: LOCAL_TEAMS.usa_white, meLook: Engine.look(s), meNum: s.player.num, defLook: Art.lookFromSeed('camp-def'), defNum: 21 }, hs = (Balance.eff(ME.handle) + Balance.eff(ME.speed)) / 2 / 99, B = BALANCE.layup.blowBy;
      const a = await Match.MG.blowBy(L, { ctx, window: (B.window[0] + (B.window[1] - B.window[0]) * hs) * W, tell: B.tell[0] + (B.tell[1] - B.tell[0]) * hs - .1, fake: .15, sub: `Handles ${ME.handle} · Speed ${ME.speed}` });
      const b = await Match.MG.layupStep(L, { ctx, win: (.035 + Balance.eff(ME.finish) / 99 * .06) * W * (a.read === 'right' ? 1.2 : .7), beat: .36 - Balance.eff(ME.speed) / 99 * .06, sub: `Finishing ${ME.finish}` });
      return (a.read === 'right' ? 45 + a.quality * 10 : 10) + (b.quality || 0) * 45; } },
    passLane: { name: 'OUTLET PASSING', desc: 'Hit the open teammate before the lane closes.', run: async (L, ME, W) => { const r = await Match.MG.passLane(L, { title: 'OUTLET PASSING', window: (480 + (ME.pass * .5 + ME.iq * .5) / 99 * 700) * W, names: ['Dre', 'Jet', 'Malik', 'Milo'], target: Math.floor(Math.random() * 4) }); return r.success ? 55 + r.quality * 45 : 15; } },
    defenseReact: { name: 'SHELL DEFENSE', desc: 'Mirror the attacker. Don\'t bite on the fake.', run: async (L, ME, W) => { const r = await Match.MG.defenseReact(L, { title: 'SHELL DEFENSE', window: (520 + Balance.eff(ME.perD) / 99 * 420) * W }); return r.success ? 55 + r.quality * 45 : 20; } },
  };
  async function drill(G, node) {
    const s = G.state, u = camp(s), ME = Balance.userStats(s), W = (DIFFICULTY[s.difficulty] || {}).window || 1, list = node.drills || ['shotMeter'];
    UI.setBg('gym');
    UI.showScreen(`<div class="usa-drill">
      <div class="ud-head glass"><b>${esc(node.title || 'DRILLS')}</b><small>Every rep is graded against the other ${field(s).length - 1} campers.</small></div>
      <div class="ud-main"><div class="ud-stage" id="udStage"><div class="ud-card" id="udCard"></div><div class="mg-layer" id="mg"></div></div>
      <div class="ud-side glass" id="udSide"><h4>TODAY</h4><div id="udRes"></div></div></div></div>`, 'usadrill');
    SFX.music('build'); let total = 0; const res = $('udRes');
    for (let i = 0; i < list.length; i++) {
      const D = DRILLS[list[i]] || DRILLS.shotMeter, card = $('udCard');
      card.innerHTML = `<small>DRILL ${i + 1} / ${list.length}</small><b>${D.name}</b><span>${esc(D.desc)}</span><button class="btn primary" id="udGo">Start ›</button>`; card.hidden = false;
      await new Promise(r => { $('udGo').onclick = r; const k = e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); removeEventListener('keydown', k); r(); } }; addEventListener('keydown', k); });
      card.hidden = true; await sleep(200);
      let sc = 50; Match.MG.camp(true);   // camp drills: tighter windows, faster meters (BALANCE.camp.mg)
      try { sc = Math.round(clamp(await D.run($('mg'), ME, W, s), 0, 100)); } catch (e) { console.error('drill', e); } finally { Match.MG.camp(false); }
      // the field's scores for this drill → your place (everybody here is good: BALANCE.camp.drills)
      const DS = BALANCE.camp.drills, others = C().campers.filter(c => !u.cut.includes(c.name)).map(c => { const R = Art.seeded(c.name + list[i] + u.day); return { name: c.name, sc: Math.round(clamp(DS.base + c.off * DS.off + (R() * 2 - 1) * DS.spread, 15, 99)) }; });
      const all = others.concat([{ name: 'YOU', sc, me: true }]).sort((a, b) => b.sc - a.sc), place = all.findIndex(x => x.me) + 1, pts = (sc - 55) / C().drillScale;
      total += pts;
      res.insertAdjacentHTML('beforeend', `<div class="ud-r"><b>${D.name}</b><span><i class="${sc >= 70 ? 'g' : sc < 45 ? 'b' : ''}">${sc}</i> · #${place} of ${all.length} · <em class="${pts >= 0 ? 'g' : 'b'}">${pts >= 0 ? '+' : ''}${pts.toFixed(1)}</em></span>
        <ol>${all.slice(0, 4).map(x => `<li class="${x.me ? 'me' : ''}">${esc(x.me ? 'YOU' : x.name.split(' ').slice(-1)[0])} <i>${x.sc}</i></li>`).join('')}${place > 4 ? `<li class="me">… YOU <i>${sc}</i></li>` : ''}</ol></div>`);
      SFX.play(place <= 5 ? 'good' : place <= 11 ? 'click' : 'bad'); await sleep(500);
    }
    u.pts += total; G.save();
    const card = $('udCard'); card.hidden = false;
    const rk = rankOf(s), n = field(s).length, msg = total >= BALANCE.camp.board.great * .75 ? `You were great today. So was everyone else. Still #${rk} of ${n}.` : total < 0 ? `Everybody here can do this. You're #${rk} of ${n}.` : `You're #${rk} of ${n} on the board right now.`;
    card.innerHTML = `<small>SESSION OVER</small><b class="${total >= 0 ? 'g' : 'b'}">${total >= 0 ? '+' : ''}${total.toFixed(1)} CAMP POINTS</b><span>${msg}</span><button class="btn primary" id="udGo">Continue ›</button>`;
    await new Promise(r => $('udGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, node.next);
  }

  /* ---------- a talk node (gauge conversation as a mini cutscene) ---------- */
  async function talk(G, node) {
    const s = G.state, ch = node.look && STORY.characters[node.look];
    UI.setBg(node.scene || 'locker'); UI.showScreen('<div class="usa-talkbg"></div>', 'usatalk');
    let r = { win: true };
    try { r = await Match.talk({ who: node.who, script: node.script, look: ch ? UI.charLook(node.look) : null, name: ch ? ch.name : '', title: Engine.text(node.title, s), colors: ['#1e3a8a', '#dc2626'] }); } catch (e) { console.error('talk', e); document.querySelectorAll('.tkc').forEach(e2 => e2.remove()); }
    const changes = G.applyFx(r.win ? node.winFx : node.loseFx);
    UI.toast(r.win ? '💬 That went well.' : '💬 That didn\'t land.', r.win ? 'good' : 'bad'); UI.fxToasts(changes);
    return G.goto(s.story.chapter, r.win ? (node.win || node.next) : (node.lose || node.next));
  }

  /* invite score: good enough to be on the list */
  const inviteScore = s => Engine.ovr(s) + 4 * ((s.recruit && s.recruit.stars) || 0) + (s.meta.rep || 0) * .2 + (typeof Rankings !== 'undefined' ? Rankings.inviteBonus(s) : 0);   // + your prospect rank
  return { camp, field, rankOf, board, drill, talk, inviteScore };
})();
