/* =====================================================================
   FEATURES.JS — the feature unlock system and every feature's screens. Features unlock in the story:
   a scene's fx { unlock: 'id' } calls Features.unlock(); when the scene is over, a small "NEW FEATURE UNLOCKED"
   card explains it and its hub tab glows until you open it. Also: hub tabs (Playbook, Mixtape, Chemistry,
   Celebrations, and the future-chapter ones), match hooks (afterMatch), and the jelly lesson node (type:'flick').
   State: s.features = { v, on:{id:t}, queue:[], newTabs:{}, plays:[], mix:{clips,released}, chem:{}, duos:{}, celebs:[], celeb, jelly:{lvl} }
   ===================================================================== */
const Features = (() => {
  const esc = UI.esc, sleep = ms => new Promise(r => setTimeout(r, ms)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = id => document.getElementById(id);

  function state(s) {
    const F = s.features || (s.features = { v: 0 });
    for (const [k, v] of Object.entries({ on: {}, queue: [], newTabs: {}, plays: [], mix: { clips: [], released: [] }, chem: {}, duos: {}, celebs: [], jelly: { lvl: 0 }, missions: {}, combine: {}, rivals: {} })) if (F[k] == null) F[k] = JSON.parse(JSON.stringify(v));
    return F;
  }
  const on = (s, id) => !!(s && s.features && s.features.on[id]);
  const chIdx = id => CHAPTER_ORDER.indexOf(id);

  /* ---------- conditions (FEATURES.when / CELEBRATIONS.when) ---------- */
  function cond(s, c) {
    if (!c) return true;
    if (c.anyOf && !c.anyOf.some(x => cond(s, x))) return false;
    if (c.chapter && !(STORY.chapters[c.chapter] && (state(s).maxCh || 0) >= chIdx(c.chapter))) return false;   // a chapter that isn't built yet never matches
    if (c.flag && ![].concat(c.flag).every(f => s.flags[f])) return false;
    if (c.anyFlag && !c.anyFlag.some(f => s.flags[f])) return false;
    if (c.minLevel && s.player.level < c.minLevel) return false;
    if (c.minFans && s.meta.fans < c.minFans) return false;
    if (c.usaCamp && !s.usa) return false;
    if (c.minCount) for (const k in c.minCount) if ((s.counters[k] || 0) < c.minCount[k]) return false;
    return true;
  }

  /* ---------- unlock (from a story scene: fx { unlock }) ---------- */
  function unlock(s, id, opts = {}) {
    const F = state(s), f = FEATURE_BY_ID[id]; if (!f) return false;
    s.flags['feat_' + id] = true;                       // story branches can ask "already unlocked?"
    if (id === 'rankings' && typeof Rankings !== 'undefined' && !Rankings.on(s)) Rankings.init(s, false);   // Dee's list: you're #300
    if (F.on[id]) return false;
    F.on[id] = Date.now();
    const after = s.story ? s.story.chapter + ':' + s.story.node : null;   // the card waits until this scene is over
    F.queue.push({ ids: [id], after });
    if (f.tab) F.newTabs[f.tab] = true;                 // the hub tab glows until you open it
    starters(s); setTimeout(flush, 400);
    return true;
  }
  function setCeleb(s, id) { const F = state(s), c = CELEBRATIONS.find(x => x.id === id); if (!c) return; if (!F.celebs.includes(id)) F.celebs.push(id); F.celeb = id; }
  /* things a feature starts with, and unlocks inside features (more celebrations, duo moves) */
  function starters(s, quiet) {
    const F = state(s);
    if (on(s, 'playbook') && !F.plays.length) F.plays.push(PLAYBOOK[0].id);
    if (on(s, 'celebrations')) {
      CELEBRATIONS.forEach(c => { if (!F.celebs.includes(c.id) && cond(s, c.when)) { F.celebs.push(c.id); if (F.celeb && !quiet) UI.toast(`🕺 New celebration: <b>${esc(c.name)}</b>`, 'ach', 3200); } });
      if (!F.celeb) F.celeb = F.celebs[0];
    }
    if (on(s, 'chemistry')) CHEM_DUOS.forEach(d => { if (!F.duos[d.id] && link(s, d) >= d.need) { F.duos[d.id] = Date.now(); if (!quiet) { UI.toast(`🔗 Chemistry maxed with <b>${esc(d.short)}</b> — duo move unlocked: <b>${esc(d.move)}</b>`, 'ach', 4500); SFX.play('perfect'); } } });
  }
  /* ---------- the check (after story fx, games, training, level-ups and on load): no automatic unlocks anymore ----------
     Saves from before story unlocks (v < 2) keep what they had earned under the old rules, silently. */
  function check(s) {
    if (!s || !s.player) return [];
    const F = state(s), got = [];
    F.maxCh = Math.max(F.maxCh || 0, chIdx(s.story && s.story.chapter));
    if ((F.v || 0) < 2) {
      for (const f of FEATURES) if (!F.on[f.id] && f.legacy && cond(s, f.legacy)) { F.on[f.id] = Date.now(); got.push(f.id); if (f.tab) F.newTabs[f.tab] = true; }
      delete F.on.rep_map; delete F.legends; F.queue = (F.queue || []).filter(q => q.ids && q.ids.every(id => FEATURE_BY_ID[id]));   // the Court Rep Map is gone
      F.v = 2;
    }
    if (!F.on.rankings && typeof Rankings !== 'undefined' && (s.flags.done_street || chIdx(s.story && s.story.chapter) > 0)) {   // careers from before the rankings: a fair spot from their progress
      F.on.rankings = Date.now(); F.newTabs.ranks = true; Rankings.init(s, true); F.queue.push({ ids: ['rankings'], after: null });
    }
    Object.keys(F.on).forEach(id => { s.flags['feat_' + id] = true; });
    starters(s, got.length > 0);
    setTimeout(flush, 500);
    return got;
  }

  /* ---------- the "NEW FEATURE UNLOCKED" card: right after the scene that introduced it (never mid-game) ---------- */
  let showing = false;
  const calm = () => ['hubscreen', 'story'].includes(document.body.dataset.screen) && !document.querySelector('.cs-cv, .arc, .tkc, #modals .modal, .feat-pop, .tut');
  function flush() {
    const s = Game.state; if (!s || !s.features || showing || !s.features.queue.length) return;
    const item = s.features.queue[0], here = s.story ? s.story.chapter + ':' + s.story.node : null;
    if (!calm() || (item.after && item.after === here && document.body.dataset.screen === 'story')) return setTimeout(flush, 900);   // still in the scene
    s.features.queue.shift(); Game.save();
    showing = true; popup(item).then(() => { showing = false; if (s.features.queue.length) setTimeout(flush, 400); });
  }
  function popup(item) {
    const list = item.ids.map(id => FEATURE_BY_ID[id]).filter(Boolean); if (!list.length) return Promise.resolve();
    const one = list.length === 1 ? list[0] : null, inHub = document.body.dataset.screen === 'hubscreen';
    const el = document.createElement('div'); el.className = 'feat-pop'; el.style.setProperty('--fc', one ? one.color : '#f97316');
    el.innerHTML = `<div class="fp-card">
      <div class="fp-kicker">NEW FEATURE UNLOCKED</div>
      ${one ? `<div class="fp-icon">${one.icon}</div><h2>${esc(one.name)}</h2><span class="fp-ch">${esc(one.chapter)}</span>
        <p class="fp-tag">${esc(Engine.text(one.what[0], Game.state))}</p><ul>${one.what.slice(1).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
      : `<h2>${list.length} NEW FEATURES</h2><p class="fp-tag">Things you've already earned in this career.</p><div class="fp-list">${list.map(f => `<div style="--fc:${f.color}"><i>${f.icon}</i><b>${esc(f.name)}</b><small>${esc(f.what[1])}</small></div>`).join('')}</div>`}
      ${one && one.tab && !inHub ? `<p class="fp-where">Find it in the <b>${esc(TAB_NAMES[one.tab] || one.name)}</b> tab next time you're in the hub.</p>` : ''}
      <div class="fp-btns">${one && one.tab && inHub ? `<button class="btn ghost" data-k="go">Open ${esc(TAB_NAMES[one.tab] || one.name)} ›</button>` : ''}<button class="btn glow" data-k="ok">Got it</button></div></div>`;
    document.body.appendChild(el); SFX.play('levelup');
    requestAnimationFrame(() => el.classList.add('in'));
    return new Promise(res => {
      const close = k => { removeEventListener('keydown', kd); el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 320); SFX.play('click');
        if (inHub && Game.hubCtx && document.body.dataset.screen === 'hubscreen') UI.hub(Object.assign({}, Game.hubCtx, k === 'go' ? { tab: one.tab } : {})); res(); };   // only if you're still in the hub (never over a game or a scene)
      const kd = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); close('ok'); } };
      setTimeout(() => addEventListener('keydown', kd), 600);
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => close(b.dataset.k));
    });
  }

  /* ---------- hub tabs ---------- */
  const seenTab = (s, tab) => { if (s.features && s.features.newTabs && s.features.newTabs[tab]) { delete s.features.newTabs[tab]; Game.save(); } };
  const TAB_NAMES = { ranks: 'Rankings', playbook: 'Playbook', mixtape: 'Mixtape', chem: 'Chemistry', celebs: 'Celebrations', mentor: 'Mentor', combine: 'Combine', shoe: 'Shoe', rivals: 'Rivals' };
  function tabs(s) {
    if (!s.features) return [];
    const seen = new Set(), out = [];
    FEATURES.forEach(f => { if (f.tab && on(s, f.id) && !seen.has(f.tab)) { seen.add(f.tab); out.push([f.tab, f.tab === 'ranks' && Rankings.bigBoard(s) ? 'Big Board' : f.tab === 'playbook' && !on(s, 'playbook') ? 'Jelly' : TAB_NAMES[f.tab] || f.name, s.features.newTabs && s.features.newTabs[f.tab] ? 'new' : true]); } });
    return out;
  }
  const hub = () => Game.hubCtx, ap = s => s.hub ? s.hub.ap : 0;
  const portrait = look => Art.avatar(look, { mode: 'portrait' });
  const avgDef = s => Balance.profile(Math.max(40, Engine.ovr(s) - 2));
  function render(tab, s) {
    const F = state(s);
    switch (tab) {
      case 'playbook': {
        const def = avgDef(s), ME = Balance.userStats(s), next = PLAYBOOK.find(p => !F.plays.includes(p.id));
        const pctOf = (a, x = {}) => Balance.pct(a, ME, Object.assign({ def, diff: s.difficulty }, x)).pct;
        const plays = on(s, 'playbook') ? `<div class="glass panel"><div class="up-head"><b>📋 Playbook (${F.plays.length}/${PLAYBOOK.length})</b><span class="muted">Learned plays appear as options on offense in team games (high school and up).</span></div>
          <div class="pb-grid">${PLAYBOOK.map(p => { const got = F.plays.includes(p.id), fit = p.fit.includes(s.player.pos);
            return `<div class="pb-play ${got ? 'got' : 'locked'}"><i>${p.icon}</i><div><b>${esc(p.name)}</b><small>${esc(p.desc)}</small>${got ? `<span class="pct-chip">~${clamp(pctOf(p.action, { contest: p.contest }) + p.bonus + (fit ? 2 : 0), 5, 95)}%${fit ? ' · fits your position' : ''}</span>` : '<span class="muted small">Not learned yet</span>'}</div></div>`; }).join('')}</div>
          ${next ? `<div class="pb-next"><div>${portrait(UI.charLook(s.career.hs === 'westbrook' ? 'graves' : 'brennan') || {})}</div><div><b>Next: ${esc(next.name)}</b><small>"${esc(next.coach)}"</small></div><button class="btn glow" data-practice ${ap(s) <= 0 ? 'disabled' : ''}>Practice with Coach · 1 action</button></div>` : '<p class="hl">You know the whole playbook.</p>'}</div>` : '';
        const J = jellyLevel(s), JL = BALANCE.jelly.levels;
        const jelly = on(s, 'jelly') ? `<div class="glass panel jelly-panel"><div class="up-head"><b>🍯 Jelly Layup</b><span class="muted">Taught by Scoop DeLuca.</span></div>
          <div class="jl-row">${JL.map((l, i) => `<div class="jl-lvl ${i <= J ? 'on' : ''}"><b>${esc(l.name)}</b><small>${i <= J ? (l.bonus ? `+${l.bonus}%` : 'Learned') : 'Weapon Training (Chapter 3)'}</small></div>`).join('')}</div>
          <p class="small">~<b>${pctOf('jelly', { contest: 'heavy' }) + JL[J].bonus}%</b> at a rim protector (a plain layup there: ~${pctOf('layup', { contest: 'heavy' })}%) · ~${pctOf('jelly', { contest: 'open' }) + JL[J].bonus}% wide open (layup ~${pctOf('layup', { contest: 'open' })}%).</p>
          <p class="muted small"><b>Matches:</b> after you beat your man, pick JELLY when help is coming → flick to the side away from his arm (←/→), tap at the glass. <b>Arcade:</b> drive at the rim with a defender close, hold MOVE (L / Shift) and shoot. Career jellies: <b>${s.counters.jellies || 0}</b>.</p></div>` : '';
        return plays + jelly;
      }
      case 'mixtape': {
        const M = MIXTAPE, clips = F.mix.clips.slice().sort((a, b) => b.v - a.v), key = seasonKey(s), done = F.mix.released.some(r => r.key === key), sc = score(clips);
        return `<div class="mix-grid"><div class="glass panel mix-side"><div class="mix-tape">📼</div><b>Score ${sc}</b><small>${clips.length} clip${clips.length === 1 ? '' : 's'} saved · best ${M.release} count</small>
          <p class="small">Release boosts: <b>+${Math.round(sc * M.boost.recruit)}</b> recruiting · <b>+${Engine.fmtFans(Math.round(sc * M.boost.fans))}</b> followers · <b>+${Math.round(sc * M.boost.rep)}</b> Rep</p>
          <button class="btn glow" data-release ${done || clips.length < M.minClips ? 'disabled' : ''}>${done ? 'Released this season ✓' : clips.length < M.minClips ? `Need ${M.minClips} clips` : 'Release Mixtape'}</button>
          <p class="muted small">Once a season. Clips are saved automatically after every game; releasing uses them up.</p></div>
          <div class="glass panel"><h4>Clips</h4>${clips.map(c => `<div class="clip"><i>${clipIcon(c.k)}</i><div><b>${esc(c.t)}</b><small>${esc(c.game || '')}</small></div><span class="clip-v">${'★'.repeat(Math.min(5, Math.ceil(c.v / 2.4)))}</span></div>`).join('') || '<p class="muted">No clips yet. Make some plays.</p>'}
          ${F.mix.released.length ? `<h4>Released</h4>${F.mix.released.slice().reverse().map(r => `<div class="clip rel"><i>💿</i><div><b>"${esc(r.title)}"</b><small>${esc(r.when)} · score ${r.score}</small></div></div>`).join('')}` : ''}</div></div>`;
      }
      case 'chem': return `<p class="muted glass panel">Chemistry grows every game you play together (+2, +1 more for a win), and with how you treat him in the story. Max the link to unlock a duo move — it shows up in matches and arcade games when he's on the floor.</p>
        <div class="chem-grid">${CHEM_DUOS.map(d => { const v = link(s, d), got = F.duos[d.id], ch = STORY.characters[d.id];
          return `<div class="chem glass ${got ? 'got' : ''}"><div class="f-av">${portrait(ch ? UI.charLook(d.id) : Art.lookFromSeed(d.name))}</div><div><b>${esc(d.short)}</b><small>${esc(ch ? ch.role : '')}</small>
            <div class="chem-bar"><i style="width:${Math.min(100, v / d.need * 100)}%"></i></div><span class="small">${got ? `🔗 <b>${d.icon} ${esc(d.move)}</b> unlocked` : `${Math.min(v, d.need)} / ${d.need} link`}</span><em class="muted small">${esc(d.desc)}</em></div></div>`; }).join('')}</div>`;
      case 'celebs': return `<p class="muted glass panel">Your celebration plays after big buckets — dunks, threes, jellies and game-winners — in matches and arcade games.</p>
        <div class="celeb-grid">${CELEBRATIONS.map(c => { const got = F.celebs.includes(c.id), eq = F.celeb === c.id;
          return `<div class="celeb glass ${got ? '' : 'locked'} ${eq ? 'eq' : ''}"><canvas class="celeb-cv" data-pose="${got ? c.pose : ''}" width="64" height="64"></canvas><div><b>${got ? esc(c.name) : '🔒 ' + esc(c.name)}</b><small>${esc(c.desc)}</small></div>${got ? `<button class="btn sm ${eq ? 'ghost' : ''}" data-celeb="${c.id}" ${eq ? 'disabled' : ''}>${eq ? '✓ Equipped' : 'Equip'}</button>` : ''}</div>`; }).join('')}</div>`;
      case 'mentor': return `<p class="muted glass panel">Scoop DeLuca runs your weapon training. Each mission is one action.</p><div class="pb-grid">${WEAPON_TRAINING.missions.map(m => { const done = F.missions[m.id], ok = cond(s, m.need) && !(m.teaches === 'jelly' && jellyLevel(s) >= (m.level || 0) && s.flags.jelly);
          return `<div class="pb-play ${done ? 'got' : ok ? '' : 'locked'}"><i>🥋</i><div><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></div>${done ? '<em>✓</em>' : `<button class="btn sm" data-mission="${m.id}" ${ok && ap(s) > 0 ? '' : 'disabled'}>Start</button>`}</div>`; }).join('')}</div>`;
      case 'combine': return `<div class="glass panel"><h4>Combine Leaderboard</h4><table class="tbl"><thead><tr><th>Event</th><th>You</th><th>Class rank</th><th>All-time record</th></tr></thead><tbody>${COMBINE.events.map(e => { const r = F.combine[e.id];
          return `<tr><td>${esc(e.name)}</td><td>${r ? r.v + e.unit : '—'}</td><td>${r ? '#' + r.rank + ' / ' + COMBINE.draftClass : '—'}</td><td>${e.record.v}${e.unit} · ${esc(e.record.by)}</td></tr>`; }).join('')}</tbody></table></div>`;
      case 'shoe': { const sh = s.shoe || {}; return `<div class="glass panel"><h4>Signature Shoe</h4>${sh.name ? `<p><b>${esc(sh.name)}</b> · ${esc(sh.sil || '')} · pairs sold: ${Engine.fmtFans(sh.sold || 0)}</p>` : '<p class="muted">Your designer is waiting on you. (Chapter 5)</p>'}</div>`; }
      case 'ranks': return rankTab(s);
      case 'rivals': return `<div class="glass panel"><h4>Rivalries</h4>${Object.entries(F.rivals).map(([n, r]) => `<div class="clip"><i>⚔</i><div><b>${esc(n)}</b><small>Heat ${r.heat} · ${r.w}-${r.l}</small></div></div>`).join('') || '<p class="muted">No rivals yet.</p>'}</div>`;
    }
    return '';
  }
  function bind(tab, body, s, rerender) {
    body.querySelectorAll('[data-rkgo]').forEach(b => b.onclick = () => { const L = body.querySelector('.rk-list'), row = L && L.querySelector(`[data-rk="${b.dataset.rkgo}"]`); if (row) L.scrollTop = row.offsetTop - L.clientHeight / 2 + row.clientHeight / 2; SFX.play('click'); });
    if (tab === 'ranks') setTimeout(() => { const g = body.querySelector('[data-rkgo="me"]'); if (g) g.click(); }, 30);
    body.querySelectorAll('[data-practice]').forEach(b => b.onclick = () => practice());
    body.querySelectorAll('[data-release]').forEach(b => b.onclick = () => release());
    body.querySelectorAll('[data-mission]').forEach(b => b.onclick = () => mission(b.dataset.mission));
    body.querySelectorAll('[data-celeb]').forEach(b => b.onclick = () => { state(s).celeb = b.dataset.celeb; SFX.play('click'); Game.save(); rerender(); });
    body.querySelectorAll('canvas.celeb-cv').forEach(cv => drawPose(cv, cv.dataset.pose, s));
  }
  /* a little looping preview of a celebration pose, in your colors */
  function drawPose(cv, pose, s) {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    if (!pose) { g.fillStyle = '#0b0f1c'; g.fillRect(0, 0, 64, 64); return; }
    try {
      const lk = Engine.look(s), p = Pixel.sprite(Object.assign({}, lk, { num: s.player.num }), [lk.jersey || '#f97316', lk.trim || '#111827'], { x: 32, y: 60 }), V = { ox: 0 };
      const R = Pixel.renderer(g, Object.assign({ W: 64 }, V)), loop = () => { if (!cv.isConnected) return; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 64, 64); g.setTransform(1.8, 0, 0, 1.8, -22, -47); p.act = { type: pose, t: (performance.now() / 1000) % 1, T: 1, hold: true }; try { R.player(p, {}); } catch (e) { return; } requestAnimationFrame(loop); };   // ×1.8, centered
      loop();
    } catch (e) { }
  }

  /* ---------- Playbook: Practice with Coach teaches the next set play ---------- */
  async function practice() {
    const s = Game.state, F = state(s), next = PLAYBOOK.find(p => !F.plays.includes(p.id)); if (!next || !s.hub || s.hub.ap <= 0) return;
    SFX.play('click');
    const { m, layer } = await UI.trainingModal({ name: `Practice: ${next.name}`, desc: `"${next.coach}"` });
    const ME = Balance.userStats(s), W = DIFFICULTY[s.difficulty].window; let q = .5;
    try {
      if (['catch3', 'catchMid', 'pull3'].includes(next.action)) { let t = 0; for (let i = 0; i < 2; i++) { const r = await Match.MG.shotMeter(layer, { title: `${next.name.toUpperCase()} · REP ${i + 1}/2`, green: (.07 + Balance.eff(next.action === 'catchMid' ? ME.mid : ME.three) / 99 * .15) * W, sub: next.desc }); t += r.perfect ? 1 : r.good ? .8 : r.quality * .4; } q = t / 2; }
      else { const r = await Match.MG.passLane(layer, { title: `${next.name.toUpperCase()} · READ IT`, window: (520 + (ME.pass * .5 + ME.iq * .5) / 99 * 700) * W, names: ['Big', 'Wing', 'Corner'], target: 0 }); q = r.success ? r.quality * .5 + .5 : .3; }
    } catch (e) { console.error('practice', e); }
    F.plays.push(next.id); s.hub.ap--; s.counters.trainings++;
    const changes = Game.applyFx({ xp: Math.round(25 + q * 25), attrs: { iq: q >= .6 ? 1 : 0 }, trust: 2, fatigue: 8 });
    m.card.innerHTML = `<h2>📋 Play learned: ${esc(next.name)}</h2><p>${esc(next.desc)}</p><p class="muted small">It shows up as an option on offense in team games now.</p><div class="pg-changes">${changes.map(UI.fmtChange).join('')}</div><div class="row end"><button class="btn glow" id="tDone">Done</button></div>`;
    SFX.play('levelup'); Game.checkAch(); Game.save();
    await new Promise(r => m.card.querySelector('#tDone').onclick = r); m.close(); UI.hub(Object.assign({}, Game.hubCtx, { tab: 'playbook' }));
  }

  /* ---------- Mixtape ---------- */
  const CLIP_ICONS = { poster: '💥', gameWinner: '🎯', jelly: '🍯', dunk: '🔨', three: '👌', deep: '🌌', ankles: '🦶', block: '🚫', alleyoop: '🚀', buzzer: '⏰', halfcourt: '🌠', duo: '🔗', weapon: '⚔', bigGame: '🏟' };
  const clipIcon = k => CLIP_ICONS[k] || '🎬';
  const score = clips => clips.slice().sort((a, b) => b.v - a.v).slice(0, MIXTAPE.release).reduce((t, c) => t + c.v, 0);
  const seasonKey = s => s.season ? s.season.id : `${s.story.chapter}:${(s.career.seasons || []).length}:${s.player.age}`;
  function addClip(s, c) {
    if (!on(s, 'mixtape')) return;
    const M = state(s).mix; M.clips.push(Object.assign({ v: MIXTAPE.clipValue[c.k] || 3, at: Date.now() }, c));
    M.clips = M.clips.sort((a, b) => b.v - a.v || b.at - a.at).slice(0, MIXTAPE.keep);
  }
  function release() {
    const s = Game.state, F = state(s), sc = score(F.mix.clips), key = seasonKey(s); if (F.mix.released.some(r => r.key === key) || F.mix.clips.length < MIXTAPE.minClips) return;
    const title = `${s.player.last}: ${MIXTAPE.titles[F.mix.released.length % MIXTAPE.titles.length]}`, B = MIXTAPE.boost;
    F.mix.released.push({ key, title, score: sc, when: s.season ? s.season.name : STORY.chapters[s.story.chapter].name });
    F.mix.bonus = (F.mix.bonus || 0) + sc * B.recruit; F.mix.clips = [];
    const changes = Game.applyFx({ fans: Math.round(sc * B.fans), rep: Math.round(sc * B.rep), morale: 4, recruit: true, post: { by: 'courtvision', text: `📼 NEW MIXTAPE: "${title}" — ${sc >= 50 ? 'this tape is RIDICULOUS.' : sc >= 30 ? 'certified heat.' : 'the kid can play.'} Link in bio. #HoopDreams` } });
    SFX.play('sig'); UI.toast(`📼 Mixtape released: <b>"${esc(title)}"</b>`, 'ach', 4500); UI.fxToasts(changes);
    if (Rankings.on(s)) { const rr = Rankings.bump(s, sc * B.recruit * BALANCE.rankings.mixtape, 'Mixtape drop'); if (rr && rr.to < rr.from) UI.toast(`📈 Prospect rank <b>#${rr.from} → #${rr.to}</b> after the tape drops`, 'ach', 3800); }
    Game.save(); UI.hub(Object.assign({}, Game.hubCtx, { tab: 'mixtape' }));
  }

  /* ---------- Prospect Rankings (js/rankings.js) ---------- */
  function rankTab(s) {
    if (!Rankings.on(s)) Rankings.ensure(s);
    const L = Rankings.list(s), R = s.rank, me = L.find(r => r.me), kai = Rankings.kai(), kr = kai && L.find(r => r.id === kai.id), BB = Rankings.bigBoard(s), cut = BALANCE.rankings.bigBoard;
    const prev = R.prevMap || R.last || {}, near = n => { const i = L.indexOf(me); return L.slice(Math.max(0, i - n), i + n + 1); };
    const showAv = new Set(L.slice(0, 10).map(r => r.id).concat(near(3).map(r => r.id), kr ? [kr.id] : []));
    const av = r => r.me ? portrait(Engine.look(s)) : showAv.has(r.id) ? portrait(Art.lookFromSeed(r.p.name)) : `<i class="rk-init">${esc(r.p.name.replace(/"[^"]*"\s*/g, '').split(' ').map(w => w[0]).join('').slice(0, 2))}</i>`;
    const mv = r => { const was = r.me ? R.prev : prev[r.id]; if (!was || was === r.rank) return '<em class="rk-mv">–</em>'; return was > r.rank ? `<em class="rk-mv up">▲${was - r.rank}</em>` : `<em class="rk-mv dn">▼${r.rank - was}</em>`; };
    const row = r => `<div class="rk-row${r.me ? ' me' : ''}${kr && r.id === kr.id ? ' kai' : ''}${BB && r.rank === cut ? ' cutline' : ''}" data-rk="${r.me ? 'me' : r.id}"><b class="rk-n">#${r.rank}</b>${mv(r)}<span class="rk-av">${av(r)}</span>
      <span class="rk-name"><b>${esc(r.p.name)}</b><small>${esc(r.p.pos)} · ${esc(r.p.home)}</small></span><span class="rk-ovr">${r.me ? Engine.ovr(s) : Rankings.ovrOf(s, r.p)}<small>OVR</small></span>
      <span class="rk-wpn">${r.p.weapon && WEAPONS[r.p.weapon] ? '⚔ ' + esc(WEAPONS[r.p.weapon].name) : BB ? (r.rank <= cut / 2 ? 'Round 1' : r.rank <= cut ? 'Round 2' : 'Undrafted') : ''}</span></div>`;
    const ch = R.prev && R.prev !== me.rank ? (R.prev > me.rank ? `<em class="up">▲${R.prev - me.rank} last update</em>` : `<em class="dn">▼${me.rank - R.prev} last update</em>`) : '<em>No change last update</em>';
    return `<div class="rk-wrap"><div class="glass panel rk-head">
        <div class="rk-me"><span class="rk-av big">${portrait(Engine.look(s))}</span><div><small>${BB ? 'DRAFT BIG BOARD' : 'ELITE HOOPS NETWORK · CLASS RANKINGS'}</small><b>#${me.rank}<i>/ ${BALANCE.rankings.size}</i></b>${ch}<span class="muted small">Best: #${R.best} · ${BB ? (me.rank <= cut ? `Projected pick: <b>#${me.rank}</b> (Round ${me.rank <= cut / 2 ? 1 : 2})` : 'Projected: undrafted') : 'Climb with big games, wins over ranked players and titles.'}</span></div></div>
        <div class="rk-near">${near(2).map(r => `<div class="${r.me ? 'me' : ''}"><b>#${r.rank}</b> ${esc(r.me ? 'YOU' : r.p.name)}</div>`).join('')}</div>
        <div class="rk-btns"><button class="btn small glow" data-rkgo="me">My spot</button><button class="btn small ghost" data-rkgo="${L[0].id}">Top 10</button>${kr ? `<button class="btn small ghost" data-rkgo="${kr.id}">Kai · #${kr.rank}</button>` : ''}</div>
      </div><div class="glass panel rk-list">${L.slice(0, BALANCE.rankings.size).map(row).join('')}${me.rank > BALANCE.rankings.size ? row(me) : ''}</div></div>`;
  }

  /* ---------- Chemistry ---------- */
  const link = (s, d) => (state(s).chem[d.id] || 0) + Math.max(0, Math.floor((s.rel[d.id] || 0) / 10));
  const duoOf = (s, name) => { if (!on(s, 'chemistry')) return null; const d = CHEM_DUOS.find(x => x.name === name); return d && state(s).duos[d.id] ? d : null; };

  /* ---------- after every game (story, season, pickup) ---------- */
  function afterMatch(s, r, node = {}) {
    if (!s || !r) return; state(s);
    const c = r.counters || {}, label = `${node.title || (r.cfg && r.cfg.title) || 'Game'}${r.cfg && r.cfg.them ? ' vs ' + r.cfg.them.name : ''}`;
    // the jelly story beats
    if (c.jellies) {
      s.flags.jelly_dropped = true;
      const t = STORY.feedTemplates.jelly; if (t && Math.random() < .7) { const [by, text] = t[Math.floor(Math.random() * t.length)]; Engine.post(s, { by, text }); }
    }
    if (c.jellyPayoff && s.flags.jelly_payoff) { delete s.flags.jelly_payoff; UI.toast('🍯 <b>Scoop DeLuca</b>: "Told you. Around him."', 'ach', 4500); Engine.post(s, { by: 'courtvision', text: '🍯 That jelly over the seven-footer in the big game? Unreal. Somebody taught {first} something.' }); }
    // mixtape clips
    if (on(s, 'mixtape')) {
      for (let i = 0; i < Math.min(2, c.jellies || 0); i++) addClip(s, { k: 'jelly', t: 'Jelly over the big man', game: label });
      if (r.posterizers) addClip(s, { k: 'poster', t: (r.highlights || []).find(h => /Posterized/.test(h)) || 'Posterized somebody', game: label });
      if (r.gameWinner) addClip(s, { k: 'gameWinner', t: 'The game-winner', game: label });
      if ((c.dunks || 0) && !r.posterizers) addClip(s, { k: 'dunk', t: 'Threw it down', game: label });
      if ((c.crosses || 0) >= 1) addClip(s, { k: 'ankles', t: 'Broke his ankles', game: label });
      if ((c.duoMoves || 0) >= 1) addClip(s, { k: 'duo', t: 'Duo move', game: label });
      (r.highlights || []).forEach(h => { if (/buzzer/i.test(h)) addClip(s, { k: 'buzzer', t: h, game: label }); else if (/Alley-oop/.test(h)) addClip(s, { k: 'alleyoop', t: h, game: label }); else if (/^Weapon/.test(h)) addClip(s, { k: 'weapon', t: h, game: label }); else if (/Blocked/.test(h)) addClip(s, { k: 'block', t: h, game: label }); });
      if ((r.importance || 1) >= 3 && r.win) addClip(s, { k: 'bigGame', t: `Won the big one: ${r.cfg && r.cfg.sub || ''}`, game: label });
    }
    // chemistry with national team teammates who played
    if (on(s, 'chemistry') && r.cfg && r.cfg.us) {
      const names = [].concat(r.cfg.us.roster || []);
      CHEM_DUOS.forEach(d => { if (names.includes(d.name)) state(s).chem[d.id] = (state(s).chem[d.id] || 0) + 2 + (r.win ? 1 : 0); });
    }
    // rivalry heat (Chapter 5 — switches on with the feature)
    if (on(s, 'rivalry') && r.cfg && r.cfg.them && r.cfg.them.star) { const n = r.cfg.them.star.name, R = state(s).rivals[n] || (state(s).rivals[n] = { heat: 0, w: 0, l: 0 }); R.heat += r.win ? RIVALRY.heat.win : RIVALRY.heat.loss; r.win ? R.w++ : R.l++; }
  }

  /* ---------- jelly ---------- */
  const jellyOn = s => !!(s && s.flags && s.flags.jelly);
  const jellyLevel = s => clamp((s.features && s.features.jelly && s.features.jelly.lvl) || 0, 0, BALANCE.jelly.levels.length - 1);
  const celebPose = s => { const F = s && s.features; if (!F || !on(s, 'celebrations')) return null; const c = CELEBRATIONS.find(x => x.id === F.celeb); return c ? c.pose : null; };

  /* the lesson node: { type:'flick', title, coach, reps, need, win, venue } — fail a few, then it clicks */
  async function lesson(G, node) {
    const s = G.state, ch = STORY.characters[node.coach] || {}, ME = Balance.userStats(s), W = (DIFFICULTY[s.difficulty] || {}).window || 1, FL = BALANCE.jelly.flick, k = Balance.eff((ME.finish + ME.handle) / 2) / 99;
    UI.setBg(node.scene || 'gym');
    UI.showScreen(`<div class="usa-drill jelly-lesson">
      <div class="ud-head glass"><b>${esc(node.title || 'THE JELLY')}</b><small>He swings the pad up one side. Flick it to the other side, then kiss it off the glass.</small></div>
      <div class="ud-main"><div class="ud-stage" id="udStage"><div class="ud-card" id="udCard"></div><div class="mg-layer" id="mg"></div></div>
      <div class="ud-side glass"><div class="jl-coach">${portrait(UI.charLook(node.coach) || {})}<div><b>${esc(ch.short || 'Coach')}</b><p id="jlSay">"Watch his arm. Not the rim. The arm."</p></div></div><h4>REPS</h4><div id="jlReps" class="jl-reps"></div></div></div></div>`, 'usadrill');
    SFX.music('build');
    const say = t => { const e = $('jlSay'); if (e) e.textContent = `"${t}"`; }, reps = $('jlReps'), need = node.need || 2, max = node.reps || 6;
    const card = $('udCard'); card.innerHTML = `<small>COURT TWO</small><b>THE JELLY</b><span>Rep 1 is yours to mess up. Everybody does.</span><button class="btn primary" id="udGo">Start ›</button>`;
    await new Promise(r => { $('udGo').onclick = r; const kk = e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); removeEventListener('keydown', kk); r(); } }; addEventListener('keydown', kk); }); card.hidden = true;
    const ctx = { venue: node.venue || 'usa_center', us: LOCAL_TEAMS.usa_red || LOCAL_TEAMS.usa, them: LOCAL_TEAMS.usa_white || LOCAL_TEAMS.usa, meLook: Engine.look(s), meNum: s.player.num, defLook: UI.charLook(node.coach), defNum: 0 };
    let made = 0, i = 0;
    for (; i < max && made < need; i++) {
      const learning = i < 1, win = (FL.window[0] + (FL.window[1] - FL.window[0]) * k) * W * (learning ? .55 : 1.1), tol = (FL.tol[0] + (FL.tol[1] - FL.tol[0]) * k) * W * (learning ? .7 : 1.25);
      let r = { side: 'late', good: false };
      try { r = await Match.MG.flick($('mg'), { ctx, window: win, tol, hint: !learning, slow: !learning, lesson: true, sub: `Rep ${i + 1} · Finishing ${ME.finish} · Handles ${ME.handle}` }); } catch (e) { console.error('flick', e); }
      Match.MG.close($('mg'));
      const ok = r.side === 'right' && r.good; if (ok) made++;
      reps.insertAdjacentHTML('beforeend', `<span class="${ok ? 'g' : 'b'}">${ok ? (r.perfect ? '★' : '✓') : '✗'}</span>`);
      say(ok ? (made >= need ? 'THERE it is.' : 'Yes! Again — same thing.') : r.side === 'late' ? 'Too slow. Decide before he gets there.' : r.side === 'wrong' ? 'His side! Away from the arm.' : 'Right side. Softer — kiss the glass, don\'t hit it.');
      SFX.play(ok ? 'good' : 'bad'); await sleep(900);
    }
    if (made < need) { say('…There. That one. You felt it. Again tomorrow.'); await sleep(1200); }
    card.hidden = false; card.innerHTML = `<small>LESSON OVER</small><b class="g">IT CLICKED</b><span>${made} clean jelly${made === 1 ? '' : 's'} in ${i} reps.</span><button class="btn primary" id="udGo">Continue ›</button>`;
    await new Promise(r => $('udGo').onclick = r); SFX.play('click');
    return G.goto(s.story.chapter, node.win || node.next);
  }

  /* ---------- Weapon Training missions (Chapter 3) ---------- */
  async function mission(id) {
    const s = Game.state, m = WEAPON_TRAINING.missions.find(x => x.id === id), F = state(s); if (!m || !s.hub || s.hub.ap <= 0) return;
    const { m: md, layer } = await UI.trainingModal({ name: m.name, desc: m.desc }); const ME = Balance.userStats(s), W = DIFFICULTY[s.difficulty].window; let ok = false;
    try {
      if (m.drill === 'flick') { const r = await Match.MG.flick(layer, { ctx: { venue: 'practice', meLook: Engine.look(s), meNum: s.player.num, defLook: UI.charLook('sal') }, window: 1 * W, tol: .12 * W, hint: true, slow: true }); Match.MG.close(layer); ok = r.side === 'right' && r.good; }
      else { const r = await Match.MG.shotMeter(layer, { title: m.name.toUpperCase(), green: (.07 + Balance.eff(ME.three) / 99 * .15) * W }); ok = r.good || r.perfect; }
    } catch (e) { console.error('mission', e); }
    s.hub.ap--;
    if (ok) {
      F.missions[m.id] = Date.now();
      if (m.teaches === 'jelly') { if (!s.flags.jelly) { s.flags.jelly = true; unlock(s, 'jelly'); } else F.jelly.lvl = Math.max(F.jelly.lvl, m.level || 0); }
      else if (m.teaches && WEAPONS[m.teaches]) { Engine.weapons(s); if (!s.player.weapons.some(x => x.id === m.teaches)) s.player.weapons.push({ id: m.teaches, rank: 1 }); }
      if (m.upgrades) { const w = Engine.weapons(s)[0]; if (w) s.player.weapons.find(x => x.id === w.id).rank = Math.min(BALANCE.weapons.ranks.max, w.rank + 1); }
    }
    md.card.innerHTML = `<h2>${ok ? '🥋 Mission complete' : 'Not yet'}</h2><p>${ok ? esc(m.desc) : '"Again tomorrow." — Scoop'}</p><div class="row end"><button class="btn glow" id="tDone">Done</button></div>`;
    Game.checkAch(); Game.save(); await new Promise(r => md.card.querySelector('#tDone').onclick = r); md.close(); UI.hub(Object.assign({}, Game.hubCtx, { tab: 'mentor' }));
  }

  return { state, on, cond, check, flush, tabs, render, bind, afterMatch, addClip, jellyOn, jellyLevel, celebPose, duoOf, link, lesson, unlock, setCeleb, seenTab, practice, release, mission, seasonKey };
})();
