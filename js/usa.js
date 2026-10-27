/* =====================================================================
   USA.JS — the national team selection camp: drill sessions, the staff's ranking board ("on the bubble"),
   cut days, and story talks with a gauge. Story + numbers: js/data-usa.js (USA_CAMP, STORY.chapters.usa).
   Camp points: every camper's score = offset × USA_CAMP.scale + daily form; yours = what you earn in camp
   (drills, scrimmage grades, film sessions, off-court choices). Cut days keep the top `keep` on the board.
   ===================================================================== */
const USA = (() => {
  const $ = id => document.getElementById(id), esc = UI.esc, sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const C = () => USA_CAMP;
  function camp(s) { return s.usa || (s.usa = { pts: 0, start: Engine.ovr(s), day: 1, cut: [], prev: {} }); }
  const youName = s => `${s.player.first} ${s.player.last}`;

  /* everyone still in camp, best first */
  function field(s) {
    const u = camp(s);
    const list = C().campers.filter(c => !u.cut.includes(c.name)).map(c => {
      const R = Art.seeded(c.name + '|' + u.day + '|' + (s.id || '')), form = (R() * 2 - 1) * C().form;
      return { name: c.name, score: Math.round((c.off * C().scale + form) * 10) / 10 };
    });
    list.push({ name: youName(s), me: true, score: Math.round(u.pts * 10) / 10 });
    return list.sort((a, b) => b.score - a.score);
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
  function snapshot(s, list) { const u = camp(s); u.prev = {}; list.forEach((x, i) => u.prev[x.name] = i + 1); }
  async function board(G, node) {
    const s = G.state, u = camp(s), list = field(s), keep = node.keep || 12, roster = node.mode === 'roster';
    if (node.safe || roster) { const i = list.findIndex(x => x.me); if (i >= keep) {   // at camp you always make it: on the bubble, you squeak in (just ahead of the first one out)
      const me0 = list.splice(i, 1)[0], next = list[keep - 1], above = list[keep - 2]; if (next) me0.score = u.pts = Math.min(above ? above.score : 99, Math.round((next.score + .1) * 10) / 10); list.splice(keep - 1, 0, me0); } }
    const me = list.findIndex(x => x.me) + 1, rot = node.rotation || 8;
    UI.setBg('locker');
    const cutting = node.mode === 'cut' || roster, cutNames = cutting ? list.slice(keep).map(x => x.name) : [];
    UI.showScreen(`<div class="usa-board glass">
      <div class="ub-head"><b>${esc(node.title || 'THE BOARD')}</b><small>${esc(node.note || (cutting ? 'Coach Reyes reads the list.' : `Top ${keep} make the roster. You're #${me} of ${list.length}.`))}</small></div>
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
      if (roster) { s.flags[me <= rot ? 'usa_rotation' : 'usa_bench'] = true; u.place = me; }   // your place on the board decides your role
      read.innerHTML = roster ? `<b class="ok">YOU MADE THE TWELVE.</b> #${me} on the board · ${me <= rot ? 'Rotation player' : 'End of the bench'}`
        : made ? `<b class="ok">YOU'RE STILL HERE.</b> ${keep === 12 ? 'Twelve jerseys — one has your name on it.' : `${keep} stay.`}` : `<b class="no">CUT.</b> Your camp ends here.`;
      SFX.play(made ? 'levelup' : 'groan'); if (made) UI.confetti && UI.confetti();
      u.cut.push(...cutNames.filter(n => n !== youName(s))); u.made = made;
      if (C().campers.some(c => c.name === 'Kai Sterling') && !u.cut.includes('Kai Sterling')) u.kai = 'made';
      $('ubGo').hidden = false;
    }
    snapshot(s, list); u.day++; G.save();
    await new Promise(r => $('ubGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, cutting ? (made ? node.made : node.cut) : node.next);
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
      let sc = 50; try { sc = Math.round(clamp(await D.run($('mg'), ME, W, s), 0, 100)); } catch (e) { console.error('drill', e); }
      // the field's scores for this drill → your place
      const others = C().campers.filter(c => !u.cut.includes(c.name)).map(c => { const R = Art.seeded(c.name + list[i] + u.day); return { name: c.name, sc: Math.round(clamp(55 + c.off * 3 + (R() * 2 - 1) * 15, 15, 99)) }; });
      const all = others.concat([{ name: 'YOU', sc, me: true }]).sort((a, b) => b.sc - a.sc), place = all.findIndex(x => x.me) + 1, pts = (sc - 55) / C().drillScale;
      total += pts;
      res.insertAdjacentHTML('beforeend', `<div class="ud-r"><b>${D.name}</b><span><i class="${sc >= 70 ? 'g' : sc < 45 ? 'b' : ''}">${sc}</i> · #${place} of ${all.length} · <em class="${pts >= 0 ? 'g' : 'b'}">${pts >= 0 ? '+' : ''}${pts.toFixed(1)}</em></span>
        <ol>${all.slice(0, 4).map(x => `<li class="${x.me ? 'me' : ''}">${esc(x.me ? 'YOU' : x.name.split(' ').slice(-1)[0])} <i>${x.sc}</i></li>`).join('')}${place > 4 ? `<li class="me">… YOU <i>${sc}</i></li>` : ''}</ol></div>`);
      SFX.play(place <= 5 ? 'good' : place <= 11 ? 'click' : 'bad'); await sleep(500);
    }
    u.pts += total; G.save();
    const card = $('udCard'); card.hidden = false;
    card.innerHTML = `<small>SESSION OVER</small><b class="${total >= 0 ? 'g' : 'b'}">${total >= 0 ? '+' : ''}${total.toFixed(1)} CAMP POINTS</b><span>You're #${rankOf(s)} on the board right now.</span><button class="btn primary" id="udGo">Continue ›</button>`;
    await new Promise(r => $('udGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, node.next);
  }

  /* ---------- a talk node (gauge conversation as a mini cutscene) ---------- */
  async function talk(G, node) {
    const s = G.state, ch = node.look && STORY.characters[node.look];
    UI.setBg(node.scene || 'locker'); UI.showScreen('<div class="usa-talkbg"></div>', 'usatalk');
    let r = { win: true };
    try { r = await Match.talk({ who: node.who, script: node.script, look: ch ? UI.charLook(node.look) : null, name: ch ? ch.name : '', title: node.title, colors: ['#1e3a8a', '#dc2626'] }); } catch (e) { console.error('talk', e); document.querySelectorAll('.tkc').forEach(e2 => e2.remove()); }
    const changes = G.applyFx(r.win ? node.winFx : node.loseFx);
    UI.toast(r.win ? '💬 That went well.' : '💬 That didn\'t land.', r.win ? 'good' : 'bad'); UI.fxToasts(changes);
    return G.goto(s.story.chapter, r.win ? (node.win || node.next) : (node.lose || node.next));
  }

  /* invite score: good enough to be on the list */
  const inviteScore = s => Engine.ovr(s) + 4 * ((s.recruit && s.recruit.stars) || 0) + (s.meta.rep || 0) * .2 + (typeof Rankings !== 'undefined' ? Rankings.inviteBonus(s) : 0);   // + your prospect rank
  return { camp, field, rankOf, board, drill, talk, inviteScore };
})();
