/* =====================================================================
   STORY-FX.JS — the story systems (STORY.md section 0):
     • arcs + animated title cards (black screen, a chiptune sting, the name slamming in letter by letter, the goal)
     • the chapter opening sequence (theme, the cast as silhouettes, Kai turning to face you, your number, your silhouette
       sharpening chapter by chapter)
     • "Previously…" when a save loads · "Next time…" when an arc ends
     • credits + post-credits at the end of a chapter
     • revenge games: a rival who caused a low is marked, and the next game against him opens with a boxing poster
     • weapon evolution: tiers II–IV with an awakening sequence (the GET UP press, the eyes, the shatter, the aura)
     • first-view unskippable cutscenes (skippable once seen, in any career on this device)
     • in-match inner monologue lines (Cutscene.monologue draws them)
   Data: js/data-arcs.js (arcs, openings, recap lines, monologue) · WEAPON_EVO (js/data-game.js) · BALANCE.weapons.evo
   Save fields: s.arcs { v, cur:{ ch, id }, openings, ended } · s.seen · s.recap · s.marks · s.pendingAwaken
   ===================================================================== */
const Story = (() => {
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const txt = (t, s) => (s && typeof Engine !== 'undefined' ? Engine.text(String(t || ''), s) : String(t || ''));
  const st = () => Game.state;
  const csOk = () => typeof Cutscene !== 'undefined' && typeof CUTSCENES !== 'undefined';

  /* ---------- seen: major cutscenes are unskippable the first time ---------- */
  const GKEY = 'hoopdreams_seen';
  const gSeen = () => { try { return JSON.parse(localStorage.getItem(GKEY) || '{}') || {}; } catch (e) { return {}; } };
  function seen(id) { const s = st(); return !!((s && s.seen && s.seen[id]) || gSeen()[id]); }
  function markSeen(id) { const s = st(); if (s) (s.seen || (s.seen = {}))[id] = 1; try { const g = gSeen(); g[id] = 1; localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) { } }
  /* play a cutscene: unskippable the first time unless it's minor; o.seenId groups dynamic scenes (one per chapter / arc) */
  /* a feature popup that is already open finishes first (a cutscene never starts underneath it) */
  const clear = async () => { for (let i = 0; i < 600 && document.querySelector('.feat-pop'); i++) await new Promise(r => setTimeout(r, 250)); };
  async function cut(id, ctx, o = {}) {
    if (!csOk() || !CUTSCENES[id]) return; const key = o.seenId || id, C = CUTSCENES[id];
    await clear();
    const skippable = o.skippable != null ? o.skippable : !!C.minor || seen(key);
    try { await Cutscene.play(id, ctx || {}, { skippable }); } catch (e) { console.warn('story cutscene', id, e); }
    markSeen(key);
  }
  const ctxNow = () => { const s = st(); try { return Game.csCtx(s.story.node); } catch (e) { return {}; } };

  /* ---------- arcs ---------- */
  const arcsOf = ch => { const C = STORY.chapters[ch]; const L = (C && C.arcs) || []; L.forEach((a, i) => { if (!a._set) { a._set = new Set(String(a.nodes || '').split(/\s+/).filter(Boolean)); if (a.order == null) a.order = i + 1; } }); return L; };
  const routeOk = (a, s) => !a.route || a.route === (s.career && s.career.path);
  const val = (v, s) => typeof v === 'function' ? v(s) : v;
  function arcFor(s, ch, node) { return arcsOf(ch).find(a => routeOk(a, s) && a._set.has(node)) || null; }
  function arcById(ch, id) { return arcsOf(ch).find(a => a.id === id) || null; }
  function current(s) { s = s || st(); if (!s || !s.arcs || !s.arcs.cur) return null; return arcById(s.arcs.cur.ch, s.arcs.cur.id); }
  const shortCh = t => String(t || '').replace(/^Chapter (\d+)/, 'Ch. $1');
  /* "Ch. 2 · The JV Arc" (hub header, save screen) */
  function label(s) {
    s = s || st(); if (!s || !s.story) return ''; const ch = STORY.chapters[s.story.chapter]; if (!ch) return '';
    const a = (s.arcs && s.arcs.cur && s.arcs.cur.ch === s.story.chapter && current(s)) || arcFor(s, s.story.chapter, s.story.node);
    return a ? `${shortCh(ch.title)} · ${val(a.name, s)}` : `${shortCh(ch.title)} · ${ch.name}`;
  }
  /* older saves (and brand-new careers) get the arc state here; older saves never replay openings or credits they're past */
  function ensure(s) {
    if (s.arcs && s.arcs.v) return s.arcs;
    const a = arcFor(s, s.story.chapter, s.story.node), fresh = s.counters && !s.counters.games && s.story.chapter === 'street' && s.story.node === 'start';
    s.arcs = { v: 1, cur: fresh ? null : a ? { ch: s.story.chapter, id: a.id } : { ch: s.story.chapter, id: null }, openings: {}, ended: {} };
    if (!fresh) Object.keys(STORY.chapters).forEach(id => { if (s.flags['done_' + id] || id === s.story.chapter) s.arcs.openings[id] = 1; if (s.flags['done_' + id]) s.arcs.ended[id] = 1; });
    return s.arcs;
  }
  /* entering a story node: a new chapter → its opening + the first arc's title card; a later arc → "Next time…" + its card */
  function beforeNode(s, chId, nodeId) {
    if (!csOk()) return null;
    const A = ensure(s), arc = arcFor(s, chId, nodeId), cur = A.cur, curArc = cur && cur.ch === chId ? arcById(chId, cur.id) : null, seq = [];
    if (!cur || cur.ch !== chId) {
      const G = A.gamesAt || (A.gamesAt = {}); if (G[chId] == null) G[chId] = (s.career.games || []).length;   // credits: the people you met this chapter
      if (!A.openings[chId] && STORY.openings && STORY.openings[chId]) { A.openings[chId] = 1; seq.push(() => opening(s, chId)); }
      const first = arc || arcsOf(chId).find(a => routeOk(a, s));
      A.cur = { ch: chId, id: first ? first.id : null }; if (first) seq.push(() => card(s, chId, first));
    } else if (arc && (!curArc || arc.order > curArc.order)) {
      if (curArc && curArc.next) seq.push(() => nextTime(s, chId, curArc, arc));
      A.cur = { ch: chId, id: arc.id }; seq.push(() => card(s, chId, arc));
    }
    if (!seq.length) return null;
    Game.save();
    return seq.reduce((p, f) => p.then(() => f()).catch(e => console.warn('story', e)), Promise.resolve());
  }
  /* the animated arc title card */
  async function card(s, chId, arc) { await clear(); return cardNow(s, chId, arc); }
  function cardNow(s, chId, arc) {
    const ch = STORY.chapters[chId], name = String(val(arc.name, s)).toUpperCase(), goal = txt(val(arc.goal, s), s), key = 'arc_' + chId + '_' + arc.id, sk = seen(key);
    markSeen(key);
    return new Promise(res => {
      const el = document.createElement('div'); el.className = 'arc-card' + (arc.climax ? ' climax' : '');
      let n = 0; const letters = name.split(' ').map(w => `<span class="w">${[...w].map(c => `<span style="--i:${n++}">${esc(c)}</span>`).join('')}</span>`).join('<i class="sp"></i>');   // words never break
      el.innerHTML = `<div class="ac-in"><small>${esc(ch.title)} · ${esc(ch.name)}${arc.climax ? ' · <b>Climax</b>' : ''}</small><h1>${letters}</h1><p style="--d:${n * 55 + 380}ms"><b>GOAL</b> ${esc(goal)}</p></div>${sk ? '<em>TAP TO SKIP</em>' : ''}`;
      document.body.appendChild(el); SFX.music(null); SFX.play('sting');
      const ticks = []; for (let i = 0; i < n; i++) ticks.push(setTimeout(() => SFX.play('qte'), 120 + i * 55)); ticks.push(setTimeout(() => SFX.play('impact'), 160 + n * 55));
      requestAnimationFrame(() => el.classList.add('on'));
      let done = false; const fin = () => { if (done) return; done = true; ticks.forEach(clearTimeout); clearTimeout(tm); removeEventListener('keydown', key2, true); el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 380); };
      const key2 = e => { e.preventDefault(); e.stopPropagation(); if (sk) fin(); };
      addEventListener('keydown', key2, true); el.addEventListener('pointerdown', () => { if (sk) fin(); });
      const tm = setTimeout(fin, 1300 + n * 55 + Math.max(1600, goal.length * 32));
    });
  }
  /* "Next time…": an anime-style preview of the next arc */
  function nextTime(s, chId, arc, nextArc) {
    const N = val(arc.next, s); if (!N || !N.line) return Promise.resolve();
    CUTSCENES._next = { name: 'Next time', shots: [
      { d: 1100, scene: 'void', music: null, title: { text: 'NEXT TIME…', style: 'next', at: 0 }, ev: [[0, 'sfx', 'whoosh']] },
      { d: 2200, scene: N.scene || 'street_night', grade: N.grade || 'dark', tr: 'flash', speed: 'h', rot: N.rot || 0, cam: [[0, -14, 0, 1.15], [1, 12, -4, 1.32, 'io']], cast: N.cast || [], say: [N.who || 'narrator', N.line], ev: [[0, 'sfx', 'heartbeat']] },
      { d: 1900, scene: 'void', title: { text: val(nextArc.name, s), sub: 'Next time on Hoop Dreams', style: 'next2', at: 80 }, ev: [[80, 'sfx', 'sting']] },
    ] };
    return cut('_next', ctxNow(), { seenId: 'next_' + chId + '_' + arc.id });
  }

  /* ---------- the chapter opening (20–30s; it changes as the story moves) ---------- */
  function rankRows(s) {
    if (typeof Rankings !== 'undefined' && Rankings.on(s)) { const L = Rankings.list(s), i = L.findIndex(r => r.me); return L.slice(Math.max(0, i - 8), i + 6).map(r => ({ rank: r.rank, name: r.p.name, me: !!r.me })); }
    const rows = (typeof PROSPECTS !== 'undefined' ? PROSPECTS.slice(286, 300) : []).map(p => ({ rank: p.rank0, name: p.name }));
    rows.push({ rank: '—', name: `${s.player.first} ${s.player.last} (unranked)`, me: true }); return rows;
  }
  function opening(s, chId) {
    const O = STORY.openings[chId], ch = STORY.chapters[chId], ctx = ctxNow(), rim = O.rim || '#fdba74';
    ctx.rankRows = rankRows(s); ctx.night = !!O.night;
    const cast = O.cast.filter(id => STORY.characters[id]), xs = cast.map((_, i) => cast.length < 2 ? 0 : -.74 + i * 1.48 / (cast.length - 1));
    const rank = typeof Rankings !== 'undefined' && Rankings.on(s) ? Rankings.rankOf(s) : null;
    const rivals = (O.rivals || []).slice(0, 3).map((id, i) => ({ id: 'rv_' + id, kind: 'bust', x: -.72 + i * .3, y: 132, d: .8, sil: true, rim: '#ef4444', from: { dx: -60, t: 500 + i * 140, ease: 'out' } }));
    CUTSCENES._opening = { name: ch.name, chapter: ch.title, shots: [
      { d: 3600, scene: O.scene, grade: O.grade, music: 'theme', tr: 'fade', wind: .5, cam: [[0, -90, -26, 1.05], [1, 60, -8, 1.18, 'lin']], title: { text: O.place, sub: O.sub, style: 'loc', at: 400 } },
      { d: 3400, scene: O.scene, grade: 'dark', cam: [[0, 0, 14, 1.2], [1, 0, 6, 1.08, 'out']], speed: 'h',
        cast: cast.map((id, i) => ({ id, kind: 'full', x: xs[i], y: 100 + (i % 2) * 6, d: .9 + (i % 2) * .1, sil: true, rim, from: { dy: 50, t: 420 + i * 200, ease: 'back' } })),
        ev: cast.map((_, i) => [420 + i * 200, 'sfx', 'whoosh']) },
      { d: 3200, scene: O.scene, grade: 'night', cam: [[0, 10, -4, 1.12], [1, 26, -10, 1.3, 'io']],
        cast: rivals.concat([{ id: 'kai', kind: 'bust', x: .3, sil: true, rim: '#93c5fd', flip: true }]),
        ev: [[0, 'sfx', 'heartbeat'], [1000, 'turn', 'kai'], [1500, 'glint', 'kai'], [1500, 'sfx', 'stinger'], [1500, 'shake', 4]] },
      { d: 2800, scene: 'ranks', cam: [[0, 0, 0, 1], [1, 0, 0, 1.15]], title: { text: rank ? '#' + rank : 'UNRANKED', sub: 'Elite Hoops Network', style: 'slam', at: 900 }, ev: [[900, 'impact', 120], [900, 'sfx', 'impact']] },
      { d: 2600, court: O.court || '@venue', grade: O.grade === 'sunset' ? 'sunset' : null, cam: [[0, 0, 40, 1.35], [.45, 0, 0, 1.25], [1, 0, -60, 1.6, 'io']], cast: [{ id: 'you', kind: 'sprite', x: 192, y: 160 }],
        slow: [[700, 2600, .45]], speed: 'radial', focus: [.5, .3], ev: [[0, 'riser', 2.6]], play(S, t) { CSK.jumper(S, S.sp.you, t, .25, { made: true, flight: 1.3, onMake: () => S.fx.impact(150) }); } },
      { d: 2600, scene: O.scene, grade: 'spot', cam: [[0, 0, -6, 1.08], [1, 0, 0, 1.3, 'io']],
        cast: [{ id: 'you', kind: 'full', x: 0, y: 104, expr: 'determined', rim: '#facc15', sil: O.you >= 1, silA: O.you < 1 ? O.you : 0 }], ev: [[1300, 'aura', 'you'], [1300, 'sfx', 'sig']] },
      { d: 3400, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], speed: 'radial', title: { text: 'HOOP DREAMS', sub: `${ch.title} · ${ch.name}`, style: 'slam', at: 80 },
        ev: [[80, 'sfx', 'stinger'], [80, 'flash', '#ffffff', .9], [80, 'shake', 8], [300, 'sfx', 'roar']] },
    ] };
    return cut('_opening', ctx, { seenId: 'opening_' + chId });
  }

  /* ---------- "Previously…" (a save loads): fast cuts of the last big moments, a narrator line on each ---------- */
  function note(s, r) { if (!s || !r || !r.line) return; const L = s.recap || (s.recap = []); r.line = txt(r.line, s); if (L.length && L[L.length - 1].line === r.line) return; L.push(r); if (L.length > 8) L.splice(0, L.length - 8); }
  function noteCut(s, id) {
    const line = STORY.recapLines && STORY.recapLines[id], C = csOk() && CUTSCENES[id]; if (!line || !C) return;
    const sh = C.shots.find(x => x.scene && x.scene !== 'void' && (x.cast || []).some(a => ['face', 'bust', 'full'].includes(a.kind))) || C.shots.find(x => x.scene && x.scene !== 'void') || {};
    note(s, { line, scene: sh.scene || 'street_sunset', cast: (sh.cast || []).filter(a => ['face', 'bust', 'full'].includes(a.kind)).slice(0, 2).map(a => ({ id: a.id, kind: a.kind, x: a.x, y: a.y, expr: a.expr, rim: a.rim })) });
  }
  function noteGame(s, r, title) {
    if (!r || (r.importance || 1) < 2) return; const opp = r.cfg && r.cfg.them ? r.cfg.them.name : 'them', lvl = r.level || 'street';
    note(s, { line: r.win ? `You beat ${opp}, ${r.us}-${r.them}${title ? ' in the ' + title : ''}.` : `${opp} beat you, ${r.them}-${r.us}${title ? ' in the ' + title : ''}.`,
      scene: lvl === 'street' ? 'street_sunset' : lvl === 'hs' ? 'gym' : 'arena', cast: [{ id: 'you', kind: 'bust', x: 0, expr: r.win ? 'smile' : 'sad', rim: r.win ? '#fde68a' : '#93c5fd' }] });
  }
  function previously(s) {
    if (!csOk() || !s || s.ended || !s.story) return Promise.resolve();
    let cuts = (s.recap || []).slice(-4);
    if (cuts.length < 2) cuts = (s.log || []).slice(-3).map(line => ({ line, scene: s.story.chapter === 'street' ? 'street_sunset' : s.story.chapter === 'highschool' ? 'gym' : 'arena', cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#fde68a' }] }));
    if (!cuts.length || (s.counters && !s.counters.games && cuts.length < 2)) return Promise.resolve();
    CUTSCENES._prev = { name: 'Previously', shots: [
      { d: 1200, scene: 'void', music: 'story', title: { text: 'PREVIOUSLY…', sub: 'On Hoop Dreams', style: 'next', at: 0 }, ev: [[0, 'sfx', 'whoosh']] },
      ...cuts.map((c, i) => ({ d: 1300, scene: c.scene || 'street_sunset', sepia: true, tr: 'flash', cam: [[0, i % 2 ? 26 : -26, 0, 1.1], [1, i % 2 ? -8 : 8, -4, 1.22]], cast: c.cast || [], say: ['narrator', c.line], ev: [[0, 'sfx', 'page']] })),
      { d: 1300, scene: 'void', title: { text: label(s), sub: 'Now', style: 'next2', at: 60 }, ev: [[60, 'sfx', 'sting']] },
    ] };
    return Cutscene.play('_prev', ctxNow(), { skippable: true }).catch(e => console.warn('previously', e));
  }

  /* ---------- credits + post-credits (a chapter's final arc ends) ---------- */
  function chapterEnd(s, chId) {
    if (!csOk()) return null; const A = ensure(s); if (A.ended[chId]) return null;
    A.ended[chId] = 1; Game.save();
    const ch = STORY.chapters[chId];
    return (async () => { await credits(s, chId); const pc = val(ch.postCredits, s); if (pc && CUTSCENES[pc]) { await cut(pc, ctxNow()); noteCut(s, pc); } })().catch(e => console.warn('credits', e));
  }
  function credits(s, chId) {
    const ch = STORY.chapters[chId], O = (STORY.openings || {})[chId] || {}, cast = (ch.cast || ['you', 'lou', 'tariq', 'kai', 'mom']).filter(id => id === 'you' || STORY.characters[id]);
    const from = (s.arcs.gamesAt && s.arcs.gamesAt[chId]) || 0, met = [...new Set((s.career.games || []).slice(from).map(g => g.opp).filter(Boolean))].slice(-10);
    const lines = ['HOOP DREAMS', `${ch.title} · ${ch.name}`.toUpperCase(), '', 'STARRING', `${s.player.first} ${s.player.last}`, '',
      ...cast.filter(id => id !== 'you').flatMap(id => [STORY.characters[id].name.toUpperCase(), STORY.characters[id].role || '', '']),
      ...(met.length ? ['AND THE PEOPLE YOU MET', ...met, ''] : []), 'MUSIC', 'Synthesized live, chiptune style', '', 'THANKS FOR PLAYING', '', 'TO BE CONTINUED…'];
    const per = 1900, n = cast.length, speed = (lines.length * 13 + 140) / (n * per);
    const ctx = Object.assign(ctxNow(), { credits: lines });
    CUTSCENES._credits = { name: 'Credits', shots: cast.map((id, i) => ({ d: per, scene: 'credits', music: i ? undefined : 'theme', creditsOff: i * per, creditsSpeed: speed, tr: i ? 'cut' : 'fade',
      manga: { panels: [{ r: [.03, .12, .5, .76], at: 0, from: i % 2 ? 'bottom' : 'top', tone: i % 3 === 0, shot: { d: per, scene: O.scene || 'street_sunset', grade: O.grade, cam: [[0, 0, 4, 1.12], [1, 0, 0, 1.24]], cast: [{ id, kind: 'bust', x: 0, expr: id === 'kai' ? 'smile' : id === 'you' ? 'determined' : 'smile', rim: O.rim || '#fde68a' }] } }] } })) };
    return cut('_credits', ctx, { seenId: 'credits_' + chId });
  }

  /* ---------- revenge games: marked rivals + the boxing poster ---------- */
  function mark(s, m) { if (!m) return; (s.marks || (s.marks = {}))[m.id || m.star] = Object.assign({ ch: s.story.chapter }, m); }
  async function prematch(s, cfg, node) {
    if (!csOk()) return; const star = cfg.them && cfg.them.star && cfg.them.star.name, roster = (cfg.them && cfg.them.roster) || [];
    let m = node && node.revenge;
    if (!m && s.marks) { const k = Object.keys(s.marks).find(k2 => { const M = s.marks[k2]; return M.star && (M.star === star || roster.includes(M.star)); }); if (k) { m = s.marks[k]; delete s.marks[k]; } }
    if (!m) return; cfg.revenge = m.title; Game.save();
    await poster(s, m, cfg);
  }
  function poster(s, m, cfg) {
    const id = STORY.characters[m.id] ? m.id : 'them', ctx = Object.assign(ctxNow(), { team: { colors: cfg.us.colors }, them: { colors: cfg.them.colors } });
    if (id === 'them') { ctx.looks = { them: Art.lookFromSeed(m.star || 'rival') }; ctx.names = { them: m.star }; }
    const info = typeof Rankings !== 'undefined' && Rankings.on(s) ? Rankings.infoFor(s, m.star) : null, me = Rankings.on(s) ? Rankings.rankOf(s) : null, P = info && info.p;
    const myW = Engine.weapons(s)[0], theirW = (typeof PLAYER_WEAPONS !== 'undefined' && PLAYER_WEAPONS[m.star] || [])[0] || (P && P.weapon);
    const rows = [['OVERALL', Engine.ovr(s), info ? info.ovr : cfg.oppRating || '?'], ['RANK', me ? '#' + me : '—', info ? '#' + info.rank : '—'], ['POSITION', s.player.pos, P ? P.pos : '—'],
      ['FROM', s.player.hometown, P ? P.home : cfg.them.name], ['WEAPON', myW ? (myW.evo > 1 ? `${myW.w.base} ${ROMAN[myW.evo]}` : myW.w.name) : '—', theirW && WEAPONS[theirW] ? WEAPONS[theirW].name : '—']];
    CUTSCENES._poster = { name: m.title, shots: [
      { d: 3200, scene: 'poster', music: 'clutch', speed: 'radial', cam: [[0, 0, 6, 1.3], [1, 0, 0, 1.06, 'snap']],
        cast: [{ id: 'you', kind: 'bust', x: -.5, expr: 'fierce', rim: '#fde68a', from: { dx: -170, t: 300, ease: 'back' } }, { id, kind: 'bust', x: .5, expr: 'smile', rim: '#fca5a5', from: { dx: 170, t: 300, ease: 'back' } }],
        title: { text: m.title, sub: m.sub || 'The rematch', style: 'poster', at: 380 }, ev: [[0, 'sfx', 'bell'], [380, 'impact', 150], [380, 'sfx', 'impact'], [380, 'shake', 10]] },
      { d: 3800, scene: 'poster', grade: 'dark', cam: [[0, 0, 0, 1.06], [1, 0, 0, 1.12]],
        cast: [{ id: 'you', kind: 'bust', x: -.66, y: 120, expr: 'determined', rim: '#fde68a' }, { id, kind: 'bust', x: .66, y: 120, expr: 'smile', rim: '#fca5a5' }], ev: [[120, 'tape', rows]] },
    ] };
    return cut('_poster', ctx, { seenId: 'poster_' + m.title, skippable: seen('poster_' + m.title) || null });
  }

  /* ---------- weapon evolution + the awakening ---------- */
  function evolve(s, spec) {
    const W = Engine.weapons(s); if (!W.length) return null;
    const o = typeof spec === 'object' ? spec : { tier: typeof spec === 'number' ? spec : 2 }, x = s.player.weapons.find(y => y.id === (o.weapon || W[0].id)) || s.player.weapons[0];
    const E = BALANCE.weapons.evo, from = x.evo || 1, to = Math.min(E.max, Math.max(from, o.tier || from + 1)); if (to <= from) return null;
    x.evo = to;
    const info = { id: x.id, from, to, name: Weapons.name(x.id, to), base: WEAPONS[x.id].name, suffix: Weapons.suffix(x.id, to), bonus: (E.bonus[to - 1] || 0) - (E.bonus[from - 1] || 0), line: o.line, scene: o.scene };
    s.pendingAwaken = info; return info;
  }
  function afterFx(s) { const A = s.pendingAwaken; if (!A || !csOk()) return null; delete s.pendingAwaken; Game.save(); return awaken(s, A); }
  function awaken(s, A) {
    let after = 50; try { after = Engine.weaponPct(s, A.id).pct; } catch (e) { }
    const before = Math.max(5, after - A.bonus), sc = A.scene || 'rain_night', lie = { id: 'you', kind: 'actor', x: 0, y: 64, s: 3, acts: [[0, 'down', 99]] };
    CUTSCENES._awaken = { name: 'Awakening', shots: [
      { d: 2800, scene: sc, weather: 'rain', drain: .9, music: null, tr: 'fade', cam: [[0, 0, 26, 1.2], [1, 0, 30, 1.32]], cast: [lie], ev: [[200, 'sfx', 'piano'], [500, 'line', A.line || 'Most people quit here.']] },
      { d: 2600, scene: sc, weather: 'rain', drain: .9, rot: -.14, cam: [[0, 0, 34, 1.55], [1, 0, 26, 1.7]], cast: [Object.assign({}, lie)],
        ev: [[250, 'qte', { kind: 'mash', label: 'GET UP', id: 'getup', n: 12, time: 6500 }], [260, 'act', 'you', 'kneel', 99], [260, 'drain', .25, 900], [260, 'sfx', 'heartbeat'], [1500, 'act', 'you', null], [1500, 'sfx', 'heartbeat']] },
      { d: 1800, scene: 'void', grade: 'red', bars: 58, cam: [[0, 0, 24, 2.2], [1, 0, 22, 2.45]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'determined', rim: '#facc15' }],
        say: (ctx, q) => q.getup === false ? ['you', 'Get up. Get up.'] : ['you', 'Not yet. I\'m not done.'], ev: [[0, 'sfx', 'heartbeat'], [600, 'glint', 'you']] },
      { d: 3600, scene: 'title', music: 'clutch', cam: [[0, 0, 10, 1.3], [1, 0, 0, 1.1, 'out']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'fierce', rim: '#facc15' }],
        ev: [[200, 'shake', 3], [500, 'sfx', 'crack'], [700, 'shake', 5], [900, 'shatter'], [950, 'aura', 'you'], [950, 'flash', '#fde68a', .8], [950, 'sfx', 'sig'], [1000, 'speed', 'radial'],
          [1150, 'title', `${A.base} ${ROMAN[A.to]}`, A.suffix, 'slam'], [1150, 'impact', 150]] },
      { d: 3200, scene: 'title', cam: [[0, 0, 0, 1.1], [1, 0, -4, 1.16]], cast: [{ id: 'you', kind: 'bust', x: -.42, expr: 'determined', rim: '#facc15' }],
        ev: [[0, 'aura', 'you'], [200, 'stats', [['SUCCESS %', before, after, after + '%']], `Weapon evolved · Tier ${ROMAN[A.to]}`]], title: { text: 'AWAKENING', sub: `${A.name} · +${A.bonus}% success`, style: 'rise', at: 100 } },
    ] };
    return cut('_awaken', ctxNow(), { seenId: 'awaken_' + A.to }).then(() => {
      if (typeof UI !== 'undefined') UI.toast(`⚔ Weapon evolved: <b>${esc(A.name)}</b> (+${A.bonus}% success)`, 'ach', 5000);
      note(s, { line: `You got up. ${A.name} awakened.`, scene: sc, cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'fierce', rim: '#facc15' }] });
    });
  }

  /* ---------- in-match inner monologue ---------- */
  function mono(kind, s) { const L = STORY.monologue && STORY.monologue[kind]; if (!L || !L.length) return null; const m = L[Math.floor(Math.random() * L.length)]; return { lines: m.lines.map(l => txt(l, s)), metaphor: m.metaphor }; }

  /* ---------- the hub: redemption goals of the current arc ---------- */
  function goals(s) { const a = current(s); if (!a || !a.goals) return []; return val(a.goals, s).map(g => ({ t: txt(g.t, s), done: !!(g.done && Engine.check(s, g.done)) })); }
  function goalsHtml(s) { const G = goals(s); if (!G.length) return ''; const a = current(s);
    return `<div class="arc-goals"><b>${esc(val(a.name, s))} · Goals</b>${G.map(g => `<span class="${g.done ? 'done' : ''}">${g.done ? '✔' : '◻'} ${esc(g.t)}</span>`).join('')}</div>`; }

  return { seen, markSeen, cut, ensure, beforeNode, afterFx, chapterEnd, previously, label, current, arcFor, goals, goalsHtml, note, noteCut, noteGame, mark, prematch, evolve, awaken, mono, card, opening, credits, nextTime, poster };
})();
