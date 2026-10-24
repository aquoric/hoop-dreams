/* =====================================================================
   MAIN.JS — the career director. Walks the story graph, launches
   matches, seasons and hubs, applies results, handles recruiting,
   development, training/shop/saves.
   ===================================================================== */
const Game = {
  state: null,
  hubCtx: null,

  init() {
    const unlock = () => SFX.init();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    const mute = document.getElementById('muteBtn');
    const syncMute = () => { mute.textContent = SFX.vol.muted ? '🔇' : '🔊'; };
    mute.onclick = () => { SFX.init(); SFX.toggleMute(); syncMute(); };
    syncMute();
    document.getElementById('setBtn').onclick = () => UI.settingsModal();
    UI.title();
  },

  /* ---------- career lifecycle ---------- */
  newCareer(o) {
    const s = this.state = Engine.createState(o);
    Engine.post(s, { by: 'nia', text: 'my big brother {first} is gonna be in the NBL one day. screenshot this. 💜' });
    s.log.push(Engine.text('Age 16. A nobody from {hometown} with a dream.', s));
    this.goto('street', STORY.chapters.street.start);
  },
  loadSlot(slot) {
    const s = Engine.load(slot);
    if (!s) return UI.toast('That save could not be loaded.', 'bad');
    this.loadState(s);
  },
  loadState(s) { this.state = s; this.save(); this.resume(); },
  resume() { const s = this.state; if (s.ended) return UI.ending(s.ended); this.runNode(); },
  save() { if (this.state) Engine.save(this.state, 'auto'); },
  startChapter(id) {
    const s = this.state, ch = STORY.chapters[id]; if (!ch) return;
    s.hub = null; this.goto(id, ch.start);
  },

  /* ---------- story graph ----------
     node ids: 'nodeId' (same chapter), 'chapter:nodeId', '@season' (return to the running season) */
  goto(chapter, node) {
    const s = this.state;
    if (node === '@season' && s.season) { chapter = s.season.home.chapter; node = s.season.home.node; }
    else if (node && node.includes(':')) [chapter, node] = node.split(':');
    s.story = { chapter, node, fxApplied: null };
    this.save(); this.runNode();
  },
  node() { const st = this.state.story, ch = STORY.chapters[st.chapter]; return { ch, node: ch && ch.nodes[st.node] }; },
  runNode() {
    const s = this.state, { ch, node } = this.node();
    if (ch && !node && ch.moved && ch.moved[s.story.node]) return this.goto(s.story.chapter, ch.moved[s.story.node]);   // cut or merged node (older saves)
    if (!ch || !node) { console.error('Missing story node', s.story); UI.toast('Story node missing: ' + s.story.chapter + '/' + s.story.node, 'bad'); return UI.title(); }
    s.career.stage = typeof ch.stage === 'function' ? ch.stage(s) : ch.stage;   // Chapter 3: College / Overseas Pro / Grind League
    Features.check(s);   // new chapter / story beat → feature unlocks (popup waits for a calm screen)
    // node entry effects (applied once, even across reloads)
    const nid = s.story.chapter + ':' + s.story.node;
    if (node.fx && s.story.fxApplied !== nid) { s.story.fxApplied = nid; const ch2 = this.applyFx(node.fx); node._fxChanges = ch2; this.save(); }
    else node._fxChanges = null;
    // cinematic cutscene when entering this node (once per visit, unskippable)
    if (node.cutscene && s.story.cs !== nid && typeof Cutscene !== 'undefined') {
      s.story.cs = nid; this.save();
      const cctx = this.csCtx(s.story.node); if (node.csTeam && LOCAL_TEAMS[node.csTeam]) cctx.team = { colors: LOCAL_TEAMS[node.csTeam].colors };
      return Cutscene.play(node.cutscene, cctx).then(() => this.runNode());
    }
    switch (node.type) {
      case 'match': return this.playMatch(node, ch);
      case 'hub': return this.openHub(node, ch);
      case 'season': return this.runSeason(node, ch);
      case 'collegeChoice': return this.collegeChoice(node, ch);
      case 'drill': return USA.drill(this, node);      // national team camp (js/usa.js)
      case 'board': return USA.board(this, node);
      case 'talk': return USA.talk(this, node);
      case 'flick': return Features.lesson(this, node);   // the jelly lesson (js/features.js)
      case 'branch': {
        const b = node.branches.find(x => Engine.check(s, x.if));
        return this.goto(s.story.chapter, b ? b.next : node.else);
      }
      case 'ending': return this.endCareer(node.ending);
      case 'chapterEnd': {
        s.flags['done_' + s.story.chapter] = true; this.recordOvr(ch.title + ' end');
        if (!(s.career.milestones || (s.career.milestones = [])).some(m => m.chapter === s.story.chapter)) s.career.milestones.push({ chapter: s.story.chapter, label: ch.title + ' end', ovr: Engine.ovr(s), age: s.player.age });
        this.save();
        const nextId = typeof node.nextChapter === 'function' ? node.nextChapter(s) : node.nextChapter, next = STORY.chapters[nextId];
        return UI.chapterEnd(ch, node, {
          dev: node.fx && node.fx.develop ? s.lastDevelop : null, next,   // only chapters that grow you show the development box
          onHub: () => this.openHub({ title: next ? 'Offseason' : 'Offseason', intro: next ? `Train up before ${next.title}: ${next.name}.` : (node.teaser || 'The next chapter arrives in a later build. Your career is saved and will carry over — keep training if you like.'), locked: true, nextChapter: nextId }, ch),
          onNext: next ? () => this.startChapter(nextId) : null,
        });
      }
      default:
        return UI.story(node, ch, c => this.onChoice(c));
    }
  },
  onChoice(c) {
    const s = this.state; let next = c.next, fx = c.fx;
    if (c.check) {
      const p = Engine.checkPct(s, c.check), ok = Math.random() * 100 < p;
      UI.toast(`${ok ? '✅ Check passed' : '❌ Check failed'} <small>(${p}%)</small>`, ok ? 'good' : 'bad');
      SFX.play(ok ? 'good' : 'bad');
      if (!ok) { next = c.fail || c.next; fx = c.failFx; }
    }
    const changes = this.applyFx(fx);
    UI.fxToasts(changes);
    if (next) this.goto(s.story.chapter, next);
    else this.runNode();
  },
  /* Engine.applyFx plus game-level effects:
     post, develop:'stage', recruitOpen, recruit (re-rate), offers (check offers), hs:'teamId',
     college:'id', path:'college|overseas|grind', set:{trust:45} (absolute meta values) */
  applyFx(fx) {
    const s = this.state; if (!fx) return [];
    const before = Engine.ovr(s), bb = Engine.badgeSnapshot(s);
    if (fx.set) for (const k in fx.set) s.meta[k] = fx.set[k];
    if (fx.hs) s.career.hs = fx.hs;
    if (fx.age) s.player.age = fx.age;
    if (fx.college) { s.career.college = fx.college; s.career.path = 'college'; }
    if (fx.path) s.career.path = fx.path;
    const changes = Engine.applyFx(s, fx);
    if (fx.post) Engine.post(s, fx.post);
    if (fx.develop) {
      const d = Engine.develop(s, fx.develop); s.lastDevelop = d;
      if (d.after > d.before) changes.push({ label: 'Natural growth: Overall', v: d.after - d.before, special: 'grow' });
    }
    if (fx.recruitOpen && !s.recruit) { s.recruit = { stars: 1, rank: 9999, score: 0, offers: [], ppg: 0 }; this.updateRecruit(true); }
    if (fx.recruit) this.updateRecruit();
    if (fx.trimOffers && s.recruit) {   // national team cut: programs above your new level stop calling
      const R = s.recruit, keep = R.offers.filter(id => id === 'metrocc' || !COLLEGES[id] || COLLEGES[id].prestige <= R.stars), lost = R.offers.length - keep.length;
      if (lost && keep.length) { R.offers = keep; changes.push({ label: 'College offers withdrawn', v: -lost }); }
    }
    if (fx.offers) this.checkOffers(fx.offers === 'final');
    /* national team arc (js/data-usa.js) */
    if (fx.campStart) { s.usa = { pts: 0, start: Engine.ovr(s), day: 1, cut: [], prev: {} }; if (s.recruit && s.recruit.stars >= 5) s.usa.pts += 2; }
    if (fx.camp && s.usa) { s.usa.pts += fx.camp; changes.push({ label: 'Camp points', v: fx.camp }); }
    if (fx.unlock) [].concat(fx.unlock).forEach(id => Features.unlock(s, id));   // a story scene introduces a feature (js/features.js)
    if (fx.celeb) Features.setCeleb(s, fx.celeb);
    if (fx.jam) s.jam = Object.assign(s.jam || {}, fx.jam);
    /* Chapter 3 */
    if (fx.club) { s.career.club = fx.club; s.career.path = 'overseas'; }
    if (fx.marchSeed) { const se = (s.career.seasons || []).slice(-1)[0] || { w: 4, l: 4, result: 'eliminated' }, pct = se.w / Math.max(1, se.w + se.l);
      s.career.marchSeed = Math.max(1, Math.min(14, se.result === 'champion' ? 2 : Math.round(13 - pct * 10 - (s.flags.usa_made ? 1 : 0)))); }
    if (fx.ageUp) s.player.age += fx.ageUp;   // Summer Jam: your third man, game plan, practice boost
    if (fx.count) for (const k in fx.count) s.counters[k] = (s.counters[k] || 0) + fx.count[k];
    if (fx.draftStock) { s.meta.draftStock = (s.meta.draftStock || 0) + fx.draftStock; changes.push({ label: 'Draft stock', v: fx.draftStock }); }
    if (fx.overseas) { s.meta.overseas = (s.meta.overseas || 0) + fx.overseas; changes.push({ label: 'Overseas interest', v: fx.overseas }); }
    if (fx.medal) { (s.career.medals || (s.career.medals = [])).push({ event: 'World Youth Championship', medal: fx.medal, age: s.player.age }); changes.push({ label: { gold: '🥇 Gold medal', silver: '🥈 Silver medal', bronze: '🥉 Bronze medal' }[fx.medal], v: 1, special: 'grow' }); }
    if (fx.gear && SHOP_BY_ID[fx.gear] && !s.inventory.owned.includes(fx.gear)) { s.inventory.owned.push(fx.gear); UI.toast(`🎽 Unlocked: <b>${SHOP_BY_ID[fx.gear].name}</b> — equip it in the Shop`, 'ach', 4200); }
    if (Engine.ovr(s) !== before) this.recordOvr('Story');
    Engine.badgeDiff(bb, s).forEach(x => UI.toast(`${Art.badge(x.b, x.tier, 30)} Badge: <b>${x.b.name}</b> ${BADGE_TIERS[x.tier]}`, 'ach', 4000));
    this.checkAch();
    return changes;
  },
  checkAch() { Engine.checkAchievements(this.state).forEach(a => { UI.toast(`🏆 Achievement unlocked: <b>${a.name}</b>`, 'ach', 4000); SFX.play('perfect'); }); Features.check(this.state); },
  recordOvr(label) { const s = this.state, o = Engine.ovr(s), h = s.ovrHistory; if (!h.length || h[h.length - 1].ovr !== o) h.push({ label, ovr: o }); },

  /* context for cutscenes: real score, teams, ending title, injury */
  csCtx(nodeId) {
    const s = this.state, g = s.lastGame || {}, END = { crash2: 'crash', c2_broken: 'broken', c2_scheme2: 'locked' };
    const c3 = s.story.chapter === 'college' && LOCAL_TEAMS[s.career.path === 'overseas' ? s.career.club : s.career.path === 'grind' ? 'gl_ignition' : s.career.college];   // Chapter 3: your new team's colors
    const team = c3 || (s.career.hs && LOCAL_TEAMS[s.career.hs]);
    return { score: g.us != null ? `${g.us}-${g.them}` : '', usAbbr: g.usAbbr, themAbbr: g.themAbbr, ending: END[nodeId] && STORY.endings[END[nodeId]].title, injury: s.meta.injury && s.meta.injury.name, team: team ? { colors: team.colors } : null, them: g.themColors ? { colors: g.themColors } : null, venue: g.venue || (s.career.hs && VENUES['gym_' + s.career.hs] ? 'gym_' + s.career.hs : null), play: g.play || null, playCtx: g.ctx || null };
  },
  gradeOf(gs) { return gs >= 92 ? 'A+' : gs >= 85 ? 'A' : gs >= 80 ? 'A-' : gs >= 75 ? 'B+' : gs >= 68 ? 'B' : gs >= 62 ? 'B-' : gs >= 56 ? 'C+' : gs >= 50 ? 'C' : gs >= 44 ? 'C-' : gs >= 36 ? 'D' : 'F'; },
  /* big games end with the real deciding play as a cutscene: your (or a teammate's) game-winner, or theirs against you */
  async bigMoment(r) {
    if (typeof Cutscene === 'undefined' || !Cutscene.winner || (r.importance || 1) < 2) return;
    const play = r.gameWinner ? r.winPlay || { side: 'us', kind: 'three', by: { name: `${this.state.player.first} ${this.state.player.last}`, isUser: true, look: Engine.look(this.state), num: this.state.player.num }, final: [r.us, r.them] } : !r.win ? r.losePlay : null;
    if (!play) return;
    try { await Cutscene.winner(play, this.playCtx(r)); } catch (e) { console.warn('winner cutscene', e); }
  },
  playCtx(r) {
    const c = r.cfg, V = VENUES[r.venueId] || {};
    return { score: `${r.us}-${r.them}`, usAbbr: c.us.abbr, themAbbr: c.them.abbr, team: { colors: c.us.colors }, them: { colors: c.them.colors }, venue: r.venueId, venueName: V.name || '', home: c.venue !== 'away',
      night: V.sky === 'night' || V.style === 'arena' || V.style === 'gym', size: c.size || 5, usRoster: c.us.roster || [], themRoster: c.them.roster || [] };
  },
  /* Pickup run in the hub: 3v3 to 21 on a court you pick (uses 1 action). Arcade segments are built into the game.
     Sometimes the run moves to a street court you haven't played yet, which unlocks it. */
  async pickup() {
    const s = this.state; if (!s.hub || s.hub.ap <= 0) return UI.toast('No actions left.', 'bad');
    const route = s.story.chapter === 'college' && typeof ROUTE_COURTS !== 'undefined' && ROUTE_COURTS[s.career.path] ? s.career.path : null;   // Chapter 3: runs where you live now
    const size = 3, target = 21, o = Engine.ovr(s), home = (route && LOCAL_TEAMS[route === 'college' ? s.career.college : route === 'overseas' ? s.career.club : 'gl_ignition']) || LOCAL_TEAMS[s.career.hs] || LOCAL_TEAMS.halsey;
    const pool = route ? ROUTE_COURTS[route] : ['cage', 'rooftop', 'beach', 'rain_night'];
    let court = s.pickupCourt && Venues.unlocked(s).includes(s.pickupCourt) && (!route || pool.includes(s.pickupCourt)) ? s.pickupCourt : route ? pool[0] : 'street_night';
    const fresh = pool.filter(id => !Venues.unlocked(s).includes(id) && id !== court);
    if (fresh.length && Math.random() < .3) { court = Engine.pick(fresh); UI.toast(`📍 The run moved tonight: <b>${VENUES[court].name}</b>`, 'ach', 3500); }
    const r = await Match.play({ us: Object.assign({}, home, { id: 'yourrun', name: 'Your Run', abbr: 'YOU' }), them: this.team(route ? ROUTE_CREW[route] : 'pickup_crew'), oppRating: o - 2, mateRating: o - 3, moments: 7, level: 'street', size, target, fullArcade: true, venueId: court, title: 'Pickup Run', sub: `${VENUES[court].name} · ${size}v${size}, first to ${target}` });
    this.unlockVenue(r.venueId);
    s.hub.ap--;
    const k = Engine.pick(['three', 'finish', 'handle', 'perD', 'reb']);
    const changes = this.applyFx(Object.assign({ xp: r.win ? 60 : 30, fatigue: 10, morale: r.win ? 3 : -1 }, r.win ? { attrs: { [k]: 1 } } : {}));
    for (const c in r.counters) s.counters[c] = (s.counters[c] || 0) + r.counters[c];
    Features.afterMatch(s, r, { title: 'Pickup Run' });
    UI.toast(`${r.win ? '🏆 Won' : 'Lost'} the pickup run ${r.us}–${r.them}`, r.win ? 'good' : 'bad'); UI.fxToasts(changes);
    this.checkAch(); this.save(); UI.hub(this.hubCtx);
  },
  unlockVenue(id) { if (Venues.unlock(this.state, id)) UI.toast(`🏟 New court unlocked: <b>${VENUES[id].name}</b> — pick it for pickup runs.`, 'ach', 3800); },

  /* ---------- recruiting ---------- */
  updateRecruit(silent) {
    const s = this.state, R = s.recruit; if (!R) return;
    if (s.season && s.season.stats.gp) R.ppg = s.season.stats.pts / s.season.stats.gp;
    const oldStars = R.stars;
    R.score = Engine.recruitScore(s); R.stars = Engine.starsFor(R.score); R.rank = Engine.rankFor(R.score);
    if (!silent && R.stars !== oldStars) {
      const up = R.stars > oldStars;
      UI.toast(`${up ? '📈' : '📉'} Recruiting: <b>${Engine.starStr(oldStars)} → ${Engine.starStr(R.stars)}</b> · National rank ${'#' + R.rank}`, up ? 'ach' : 'bad', 4500);
      Engine.post(s, { by: 'recruit', text: up ? `⬆️ RANKINGS UPDATE: {name} ({height} {pos}, {hsShort}) jumps to ${R.stars} stars, ${'#' + R.rank} nationally.` : `⬇️ {name} slides to ${R.stars} stars in the latest rankings.` });
      if (up) this.checkOffers();
    }
  },
  checkOffers(final) {
    const s = this.state, R = s.recruit; if (!R) return [];
    const got = [];
    for (const [id, c] of Object.entries(COLLEGES)) {
      if (R.offers.includes(id)) continue;
      const p = c.prestige <= R.stars ? (final ? 1 : 0.65) : c.prestige === R.stars + 1 && s.meta.rep >= 55 ? (final ? .5 : .25) : 0;
      if (id === 'metrocc' || Math.random() < p) { R.offers.push(id); got.push(c); }
    }
    got.forEach(c => {
      UI.toast(`📨 Scholarship offer: <b>${c.name} ${c.nick}</b> ${'★'.repeat(c.prestige)}`, 'ach', 4500);
      Engine.post(s, { by: 'recruit', text: `🎓 OFFER: {name} has received an offer from ${c.name}. (${c.coach})` });
    });
    if (got.length) SFX.play('coin');
    return got;
  },
  collegeChoice(node, ch) {
    const s = this.state, R = s.recruit || { offers: ['metrocc'] };
    if (!R.offers.length) R.offers.push('metrocc');
    const offers = R.offers.map(id => [id, COLLEGES[id]]).sort((a, b) => b[1].prestige - a[1].prestige);
    const choices = offers.map(([id, c]) => ({
      t: `Commit to ${c.name} ${c.nick}`, hint: `${'★'.repeat(c.prestige)} · Minutes ${c.playtime}/5 · Exposure ${c.exposure}/5 · Development ${c.development}/5`,
      fx: { college: id, flag: 'path_college', rep: c.prestige, post: { by: 'recruit', text: `🚨 COMMITTED: {name} picks ${c.name}! "${c.pitch}"` } }, next: node.next,
    })).concat(node.extra || []);
    UI.story(Object.assign({}, node, { choices }), ch, c => this.onChoice(c));
  },

  /* ---------- one-off story matches ---------- */
  team(id) { const s = this.state; if (id === '@club') id = s.career.club; else if (id === '@college') id = s.career.college; else if (id === '@gl') id = 'gl_ignition';   // Chapter 3: your team on each route
    const t = LOCAL_TEAMS[id]; return Object.assign({ id }, t); },
  async playMatch(node, ch) {
    const s = this.state;
    const cfg = {
      us: this.team(node.us), them: this.team(node.them), oppRating: node.rating, mateRating: node.mateRating, moments: node.moments,
      level: node.level, importance: node.importance || 1, title: node.title, sub: node.sub,
    };
    cfg.venueId = Venues.forMatch(cfg, node);
    const o0 = Engine.ovr(s);   // ratings relative to you (national team arc) + home / away
    if (node.ratingRel != null) cfg.oppRating = o0 + node.ratingRel;
    if (node.mateRel != null) cfg.mateRating = o0 + node.mateRel;
    if (node.venueSide) cfg.venue = node.venueSide;
    cfg.jellyMoment = node.jellyMoment || this.jellyPayoff(cfg.importance);
    if (node.tutorial && !s.flags.tutorial_done) Object.assign(cfg, { tutorial: true, size: node.pickup.size || 3, target: node.pickup.target || 15, moments: (node.moments || 8) + 3,   // the first Kai game: choices + minigames + arcade segments, taught step by step
      sub: `${cfg.sub ? cfg.sub + ' · ' : ''}Tutorial · first to ${node.pickup.target || 15}` });
    if (node.jam) {   // the Summer Jam: live arcade with choice moments (js/match.js jamBreak); your crew and game plan
      const J = s.jam || {}, P = BALANCE.jam.plans[J.plan], mate = J.mate || 'Big Rudy', boost = J.boost ? BALANCE.jam.practice : 0;
      cfg.us = Object.assign({}, cfg.us, { roster: ['Tariq "T-Bone" Miles', mate].concat((cfg.us.roster || []).filter(n => !/Tariq/.test(n) && n !== mate)) });
      const us = Object.assign({}, P ? P.us : {}), them = Object.assign({}, P ? P.them : {}); if (boost) us.all = (us.all || 0) + boost;
      cfg.mods = [Object.assign({ label: P ? P.name : 'Practice' }, us), Object.assign({ label: P ? P.name : 'Game plan' }, them)]; cfg.jam = true;
    }
    if (node.pickup && !(node.tutorial && !s.flags.tutorial_done)) Object.assign(cfg, { fullArcade: true, size: node.pickup.size || 3, target: node.pickup.target || 21, sub: `${cfg.sub ? cfg.sub + ' · ' : ''}${node.pickup.size || 3}v${node.pickup.size || 3}, first to ${node.pickup.target || 21}` });
    const r = await Match.play(cfg);
    if (cfg.tutorial) s.flags.tutorial_done = true;
    if (cfg.jam && s.jam) s.jam.boost = false;   // the practice boost lasts one game
    this.unlockVenue(r.venueId);
    await this.bigMoment(r);
    const summary = this.applyMatch(r, node);
    if (node.gradeFlag && r.gradeScore >= node.gradeFlag.min) s.flags[node.gradeFlag.flag] = true;
    if (node.camp && s.usa) { const cp = (USA_CAMP.grade[r.grade[0]] || 0) + (r.win ? USA_CAMP.win : 0); s.usa.pts += cp; UI.toast(`🇺🇸 Camp points <b>${cp >= 0 ? '+' : ''}${cp}</b> (grade ${r.grade})`, cp >= 0 ? 'good' : 'bad', 3200); }
    const rfx = r.win ? node.winFx : node.loseFx; if (rfx) UI.fxToasts(this.applyFx(rfx));
    this.checkAch();
    // move the story pointer now so a reload never replays the game
    s.story = { chapter: s.story.chapter, node: r.win ? node.win : node.lose, fxApplied: null };
    this.save();
    UI.postGame(r, summary, () => this.runNode());
  },
  jellyPayoff(importance) { return this.state.flags.jelly_payoff && importance >= 2 ? { text: 'Their big man leaves his man and slides over to meet you at the rim. Scoop\'s voice in your head: "Around him."', late: true, payoff: true } : null; },
  gradeValue(g) { return { A: 4, B: 3, C: 2, D: 1, F: 0 }[g[0]] + (g[1] === '+' ? .3 : g[1] === '-' ? -.3 : 0); },
  applyMatch(r, node) {
    const s = this.state, L = Match.LEVELS[r.level] || Match.LEVELS.street, b = r.box, imp = r.importance;
    const rate = r.attempts ? r.successes / r.attempts : .5;
    const gm = { A: 1.4, B: 1.15, C: 1, D: .8, F: .65 }[r.grade[0]];
    const bb = Engine.badgeSnapshot(s);
    // counters
    for (const k in r.counters) s.counters[k] = (s.counters[k] || 0) + r.counters[k];
    s.counters.games++; r.win ? s.counters.wins++ : s.counters.losses++;
    s.counters.points += b.pts; s.counters.best = Math.max(s.counters.best, b.pts);
    s.counters.gradePts += this.gradeValue(r.grade); s.counters.gradeN++;
    if (r.grade === 'A+') s.counters.aPlus++;
    this.healTick();
    if (r.win && r.cfg.them.star && r.cfg.them.star.name === 'Kai Sterling') s.flags.beat_kai = true;
    s.lastGame = { us: r.us, them: r.them, usAbbr: r.cfg.us.abbr, themAbbr: r.cfg.them.abbr, themColors: r.cfg.them.colors, venue: r.venueId, play: r.win ? r.winPlay || null : null, ctx: r.win && r.winPlay ? this.playCtx(r) : null };   // the deciding play (story cutscenes replay it)
    // XP + meta
    const xp = Math.round((L.xp * (0.6 + rate) + r.successes * 8) * (r.win ? 1.25 : 1) * gm * (1 + (imp - 1) * .35) * ((STORY.chapters[s.story.chapter] || {}).xpBoost || 1));   // shorter chapters pay a little more per game
    const xr = Engine.addXP(s, xp);
    const fx = {
      rep: (r.win ? 2 * imp : 0) + (r.grade[0] === 'A' ? 2 : r.grade[0] === 'F' ? -1 : 0),
      fans: Math.round((b.pts * 12 + (r.win ? 80 : 20)) * imp * (1 + s.meta.rep / 50)),
      morale: (r.win ? 6 : -5) + (r.grade[0] === 'A' ? 3 : r.grade[0] === 'F' ? -3 : 0),
      fatigue: Math.round(12 + r.fatigue * .2),
      chem: r.win ? 3 : -1,
    };
    if (r.level !== 'street') fx.trust = ({ A: 4, B: 2, C: 0, D: -2, F: -4 }[r.grade[0]]) + (r.win ? 1 : 0);
    // passing builds chemistry and Coach Trust; taking the star assignment earns trust
    const c = r.counters || {}, dimes = b.ast + (c.hockeyAssists || 0);
    if (dimes >= 3) fx.chem += Math.min(4, Math.floor(dimes / 3));
    if (r.level !== 'street') fx.trust += Math.min(3, Math.floor(dimes / 4)) + ((c.starAssign || 0) && (c.starStops || 0) ? 1 : 0);
    const changes = Engine.applyFx(s, fx);
    s.career.games.push({ label: `${node.title}${node.sub ? ' · ' + node.sub : ''}`, opp: r.cfg.them.name, us: r.us, them: r.them, win: r.win, pts: b.pts, reb: b.reb, ast: b.ast, grade: r.grade });
    this.recordOvr(node.sub || node.title);
    // viral highlight (first big moment of the career goes viral)
    if (!s.flags.viral && (r.posterizers || r.gameWinner || b.pts >= 26) && s.career.hs) {
      s.flags.viral = true;
      changes.push(...Engine.applyFx(s, { fans: 25000, rep: 4 }));
      Engine.post(s, { by: 'courtvision', text: r.posterizers ? '🚨 POSTER ALERT 🚨 {name} just ENDED a man. 2.4M views and counting. #HoopDreams' : r.gameWinner ? '🎯 {name} with the CLUTCH game-winner. Ice in the veins. 1.8M views.' : `🔥 {name} drops ${b.pts}. The tape is ridiculous. 1.3M views.` });
      UI.toast('📱 Your highlight is going VIRAL!', 'ach', 4500);
    }
    // social feed
    const key = r.win ? (r.grade[0] === 'A' || b.pts >= 20 ? 'bigWin' : 'win') : (r.grade[0] === 'D' || r.grade[0] === 'F' ? 'badLoss' : 'loss');
    const [by, text] = Engine.pick(STORY.feedTemplates[key]);
    Engine.post(s, { by, text: text.replace('{pts}', b.pts).replace('{opp}', r.cfg.them.name) });
    Features.afterMatch(s, r, node);   // mixtape clips, chemistry, the jelly story beats
    this.updateRecruit();
    return { xp: xr.xp, levels: xr.levels, changes, badges: Engine.badgeDiff(bb, s), achievements: Engine.checkAchievements(s) };
  },

  healTick() { const inj = this.state.meta.injury; if (inj && inj.games > 0 && --inj.games <= 0) { inj.name = ''; UI.toast('🩹 You\'re fully healed.', 'good'); } },

  /* ---------- seasons (see season.js) ---------- */
  runSeason(node, ch) {
    const s = this.state, def = typeof node.season === 'function' ? node.season(s) : node.season;   // Chapter 3 builds seasons around your school / club
    if (!s.season || s.season.id !== def.id) {
      s.season = Season.create(s, def);
      s.season.home = { chapter: s.story.chapter, node: s.story.node };
      Engine.post(s, { by: 'ehn', text: `🏀 ${def.name} tips off. Eyes on {name} at ${(LOCAL_TEAMS[def.user] || {}).name || '{hs}'}.` });
      this.save();
    }
    else if (typeof node.season !== 'function' && s.season.phase === 'regular' && JSON.stringify(s.season.def.schedule) !== JSON.stringify(def.schedule)) {   // older save, season since shortened
      if (s.season.week === 0) s.season.def = def;
      else ['autoSim', 'simXp', 'hubAP'].forEach(k => { if (def[k] != null) s.season.def[k] = def[k]; });
      this.save();
    }
    this.seasonStep();
  },
  seasonStep() {
    const s = this.state, se = s.season, def = se.def, home = se.home.chapter;
    if (se.phase === 'regular') {
      if (se.week >= def.schedule.length) {
        Season.buildPlayoffs(s, se); this.save();
        return UI.seasonScreen(se, def.schedule.length ? 'standings' : 'bracket', () => se.phase === 'done' ? this.seasonStep() : UI.seasonScreen(se, 'bracket', () => this.seasonStep()));
      }
      const intr = def.interrupts && def.interrupts[se.week];
      if (intr && !se.shown['i' + se.week]) { se.shown['i' + se.week] = 1; return this.goto(home, intr); }
      if (def.promote && !s.flags.starter && s.meta.trust >= 60 && !se.shown.promote) { se.shown.promote = 1; return this.goto(home, def.promote); }
      const g = def.schedule[se.week]; se.nextOpp = g.opp;
      if (g.pre && !se.shown['p' + se.week]) { se.shown['p' + se.week] = 1; return this.goto(home, g.pre); }
      if (def.autoSim && !g.key) return this.simStretch();   // regular-season games between the big ones: simmed, one highlights screen
      return this.seasonHub();
    }
    if (se.phase === 'playoffs') {
      const m = Season.userMatch(se); se.nextOpp = Season.oppOf(se, m);
      const pre = def.playoff.pre && def.playoff.pre[se.playoffs.round];
      if (pre && !se.shown['pp' + se.playoffs.round]) { se.shown['pp' + se.playoffs.round] = 1; return this.goto(home, pre); }
      return this.seasonHub();
    }
    return this.finishSeason();
  },
  seasonGame() { // the user's next game as {opp, key, title, sub, importance, moments, post}
    const se = this.state.season, def = se.def;
    if (se.phase === 'playoffs') {
      const P = se.playoffs, final = P.rounds[P.round].length === 1;
      return { opp: se.nextOpp, key: true, playoff: true, title: def.playoff.name, sub: Season.roundName(se), importance: final ? 3 : 2, moments: (def.playoff.moments || [])[P.round] };
    }
    return Object.assign({ sub: `Week ${se.week + 1}` }, def.schedule[se.week], { title: def.name, sub: def.schedule[se.week].title || `Week ${se.week + 1}` });
  },
  seasonHub() {
    const s = this.state, se = s.season, g = this.seasonGame(), opp = LOCAL_TEAMS[g.opp], st = se.standings[g.opp] || { w: 0, l: 0 };
    const key = `season:${se.id}:${se.phase}:${se.phase === 'regular' ? se.week : se.playoffs.round}`;
    if (!s.hub || s.hub.key !== key) s.hub = { key, ap: se.def.hubAP || PROGRESSION.seasonHubActions };
    this.save();
    const rec = se.standings[se.user];
    const when = se.phase === 'playoffs' ? `${se.def.playoff.name} · ${Season.roundName(se)}` : `Week ${se.week + 1} of ${se.def.schedule.length}`;
    this.hubCtx = {
      key, season: true, title: `${se.name} — ${when}`, chapter: `${STORY.chapters[se.home.chapter].title} · ${STORY.chapters[se.home.chapter].name}`,
      intro: `Next: vs ${opp.name} (${st.w}-${st.l}). Your record: ${rec.w}-${rec.l} · Role: ${Season.role(s)}.${g.key ? ' 🔑 KEY GAME — this one must be played.' : ' Play it, or sim it for a quick summary.'}`,
      cta: { label: g.key ? '🔑 Play Key Game ›' : 'Play Game ›', action: () => this.playSeasonGame(false) },
      cta2: g.key ? null : { label: 'Sim ⏩', action: () => this.playSeasonGame(true) },
      next: { opp: g.opp, key: g.key, label: g.sub },
    };
    UI.hub(this.hubCtx);
  },
  /* def.autoSim: every non-key game until the next key game, story beat or the playoffs is simmed in one go */
  simStretch() {
    const s = this.state, se = s.season, def = se.def, out = [];
    while (se.phase === 'regular' && se.week < def.schedule.length) {
      const g = def.schedule[se.week];
      if (out.length && ((def.interrupts && def.interrupts[se.week] && !se.shown['i' + se.week]) || (g.pre && !se.shown['p' + se.week]) || (def.promote && !s.flags.starter && s.meta.trust >= 60 && !se.shown.promote))) break;
      if (g.key) break;
      se.nextOpp = g.opp;
      const sg = this.seasonGame(); Engine.applyFx(s, { fatigue: -8 });
      const r = Season.simUserGame(s, se, g.opp); r.cfg = { us: this.team(se.user), them: this.team(g.opp), title: se.name, sub: sg.sub }; r.importance = 1; r.level = se.level;
      const sum = this.applySim(r, sg);
      Season.finishUserWeek(s, se, r.us, r.them, r.box);
      out.push({ r, g: sg, sum });
    }
    s.hub = null; this.updateRecruit(); this.save();
    UI.simStretch(out, se, () => this.seasonStep());
  },
  async playSeasonGame(sim) {
    const s = this.state, se = s.season, g = this.seasonGame();
    Engine.applyFx(s, { fatigue: -8 }); s.hub = null;
    let r, summary;
    if (sim) {
      r = Season.simUserGame(s, se, g.opp); r.cfg = { us: this.team(se.user), them: this.team(g.opp), title: se.name, sub: g.sub }; r.importance = 1; r.level = se.level;
      summary = this.applySim(r, g);
    } else {
      const roleMom = { Starter: 10, 'Sixth Man': 8, Bench: 7 }[Season.role(s)];
      const cfg = {
        us: this.team(se.user), them: this.team(g.opp), oppRating: Math.round(Season.rating(s, se, g.opp)), mateRating: se.def.mateRating || LOCAL_TEAMS[se.user].rating,
        moments: g.moments || roleMom + (g.key ? 1 : 0), level: se.level, importance: g.importance || (g.key ? 2 : 1), title: se.name, sub: g.sub,
      };
      cfg.jellyMoment = this.jellyPayoff(cfg.importance);
      // venue: home / away alternates through the season; the final is played at a neutral arena
      const finalGame = g.playoff && se.playoffs && se.playoffs.rounds[se.playoffs.round].length === 1;
      cfg.venue = g.away ? 'away' : g.home ? 'home' : (se.week + (g.opp || '').length) % 2 ? 'away' : 'home';
      cfg.venueId = finalGame ? (se.def.finalVenue || (se.level === 'hs' ? 'college_arena' : 'tournament')) : g.venue && VENUES[g.venue] ? g.venue : Venues.forMatch(cfg);
      r = await Match.play(cfg);
      this.unlockVenue(r.venueId);
      await this.bigMoment(r);
      summary = this.applyMatch(r, { title: se.name, sub: g.sub });
    }
    // record in the season
    let outcome = null;
    if (g.playoff) outcome = Season.finishUserPlayoff(s, se, r.us, r.them, r.box);
    else Season.finishUserWeek(s, se, r.us, r.them, r.box);
    this.updateRecruit();
    const postNode = g.post && (r.win ? g.post.win : g.post.lose);
    s.story = postNode ? { chapter: se.home.chapter, node: postNode, fxApplied: null } : { chapter: se.home.chapter, node: se.home.node, fxApplied: null };
    this.save();
    const cont = () => this.runNode();
    if (sim) UI.simResult(r, g, summary, cont); else UI.postGame(r, summary, cont);
    if (outcome) summary.outcome = outcome;
  },
  applySim(r, g) {
    const s = this.state, b = r.box, L = Match.LEVELS[r.level] || Match.LEVELS.hs, bb = Engine.badgeSnapshot(s);
    s.counters.games++; r.win ? s.counters.wins++ : s.counters.losses++;
    s.counters.points += b.pts; s.counters.best = Math.max(s.counters.best, b.pts);
    s.counters.rebounds += b.reb; s.counters.assists += b.ast; s.counters.steals += b.stl; s.counters.blocks += b.blk;
    s.counters.gradePts += this.gradeValue(r.grade); s.counters.gradeN++;
    this.healTick();
    const xr = Engine.addXP(s, Math.round(L.xp * 1.2 * ((s.season && s.season.def.simXp) || PROGRESSION.simXpFactor) * (r.win ? 1.2 : 1)));
    const changes = Engine.applyFx(s, { morale: r.win ? 3 : -3, fatigue: 8, fans: Math.round(b.pts * 6 * (1 + s.meta.rep / 50)), trust: r.grade[0] === 'A' ? 2 : r.grade[0] === 'D' ? -2 : 0, rep: r.win ? 1 : 0 });
    s.career.games.push({ label: `${r.cfg.title} · ${r.cfg.sub} (sim)`, opp: r.cfg.them.name, us: r.us, them: r.them, win: r.win, pts: b.pts, reb: b.reb, ast: b.ast, grade: r.grade });
    this.recordOvr(r.cfg.sub);
    return { xp: xr.xp, levels: xr.levels, changes, badges: Engine.badgeDiff(bb, s), achievements: Engine.checkAchievements(s) };
  },
  finishSeason() {
    const s = this.state, se = s.season, def = se.def, homeNode = STORY.chapters[se.home.chapter].nodes[se.home.node];
    const st = se.stats, gp = st.gp || 1, P = se.playoffs;
    const resText = se.result === 'champion' ? 'Champions' : se.result === 'missed' ? 'Missed playoffs' : `Lost in ${P ? (P.names || [])[se.outRound != null ? se.outRound : P.round] || 'playoffs' : 'playoffs'}`;
    const summary = { id: se.id, name: se.name, team: se.user, w: st.w, l: st.l, gp: st.gp, ppg: +(st.pts / gp).toFixed(1), rpg: +(st.reb / gp).toFixed(1), apg: +(st.ast / gp).toFixed(1), result: se.result, resText, ovr: Engine.ovr(s), age: s.player.age };
    s.career.seasons.push(summary);
    if (se.result === 'champion' && def.champFlag) s.flags[def.champFlag] = true;
    if (s.recruit) s.recruit.ppg = summary.ppg;
    s.log.push(`${se.name}: ${summary.w}-${summary.l}, ${summary.ppg} PPG — ${resText}.`);
    const then = homeNode.then || {};
    const next = then[se.result] || then.done;
    const done = se; s.season = null; s.hub = null;
    this.updateRecruit(); this.checkAch(); this.save();
    UI.seasonScreen(done, 'final', () => this.goto(done.home.chapter, next), summary);
  },

  /* ---------- hub ---------- */
  openHub(node, ch) {
    const s = this.state, key = s.story.chapter + ':' + s.story.node + (node.locked ? ':post' : '');
    if (!s.hub || s.hub.key !== key) s.hub = { key, ap: PROGRESSION.hubActions };
    if (node.locked && s.hub.ap <= 0) s.hub.ap = 1; // post-chapter sandbox: always allow a little training
    this.save();
    const nextCh = node.nextChapter && STORY.chapters[node.nextChapter];
    this.hubCtx = {
      key, title: node.title, intro: node.intro, chapter: ch.title + ' · ' + ch.name,
      cta: node.locked ? (nextCh ? { label: `Start ${nextCh.cta || nextCh.title} ›`, action: () => this.startChapter(node.nextChapter) } : { label: 'Next Chapter — Coming Soon', disabled: true, action: () => { } }) : { label: 'Continue Story ›', action: () => this.leaveHub(node) },
    };
    UI.hub(this.hubCtx);
  },
  leaveHub(node) {
    const s = this.state;
    Engine.applyFx(s, { fatigue: -10 }); s.hub = null;
    this.goto(s.story.chapter, node.next);
  },
  refresh() { UI.refreshHub(this.hubCtx); },

  async train(id) {
    const s = this.state, d = TRAINING.find(t => t.id === id);
    if (!s.hub || s.hub.ap <= 0) return UI.toast('No actions left.', 'bad');
    SFX.play('click');
    const { m, layer } = await UI.trainingModal(d);
    const A = k => Engine.attr(s, k), W = DIFFICULTY[s.difficulty].window, fat = s.meta.fatigue;
    let q = 0;
    if (d.mg === 'shotMeter') {
      let t = 0; for (let i = 0; i < 3; i++) { const r = await Match.MG.shotMeter(layer, { title: `SHOOTING DRILL ${i + 1}/3`, green: (.07 + A('three') / 99 * .15) * W, sub: `Three-Point ${A('three')}` }); t += r.perfect ? 1 : r.good ? .8 : r.quality * .4; } q = t / 3;
    } else if (d.mg === 'dunkChain') { const r = await Match.MG.dunkChain(layer, { title: 'FINISHING DRILL', tol: (6 + A('dunk') / 99 * 10) * W, speed: 85 }); q = r.quality; }
    else if (d.mg === 'dribbleCombo') { const r = await Match.MG.dribbleCombo(layer, { title: 'CONE DRILL', len: 6, time: (.8 + A('handle') / 99 * .6) * W }); q = r.quality; }
    else if (d.mg === 'defenseReact') { let t = 0; for (let i = 0; i < 2; i++) { const r = await Match.MG.defenseReact(layer, { title: `SLIDE DRILL ${i + 1}/2`, window: (350 + A('perD') / 99 * 450) * W }); t += r.success ? r.quality * .5 + .5 : 0; } q = t / 2; }
    else if (d.mg === 'rebound') { let t = 0; for (let i = 0; i < 2; i++) { const r = await Match.MG.rebound(layer, { title: `BOX-OUT DRILL ${i + 1}/2`, zone: (.08 + A('reb') / 99 * .14) * W }); t += r.success ? r.quality : 0; } q = t / 2; }
    else if (d.mg === 'freeThrow') { const base = Balance.pct('ft', Balance.userStats(s), { fatigue: fat }).pct; const r = await Match.MG.freeThrow(layer, { title: 'FREE THROW ROUTINE', shots: 3, base, stat: A('ft'), zone: (.75 + Balance.eff(A('ft')) / 99) * W, wobble: 1.55 + fat * .012, shooter: { num: s.player.num, name: s.player.last, color: s.player.look.jersey, trim: s.player.look.trim, skin: s.player.look.skin, hair: s.player.look.hairColor } }); q = r.made / 3; }
    // gains: 0–3 attribute points per session, spread over the drill's attributes (main one first)
    const pts = Math.min(PROGRESSION.trainPoints, Math.floor(q * PROGRESSION.trainPoints + Math.random() * .8));
    const attrs = {}; for (let i = 0; i < pts; i++) { const k = d.keys[i % d.keys.length]; attrs[k] = (attrs[k] || 0) + 1; }
    let injured = false;
    if (fat >= 75 && Math.random() < .3) injured = true;
    const before = Engine.ovr(s);
    const changes = injured ? this.applyFx({ fatigue: 10, morale: -6, attrs: { stam: -1 } }) : this.applyFx({ attrs, xp: Math.round(10 + q * 15), fatigue: 12 });
    s.counters.trainings++; s.hub.ap--;
    this.recordOvr('Training'); this.checkAch(); this.save();
    const gradeTxt = injured ? 'You pushed too hard on dead legs and tweaked something. Session lost.' : q >= .85 ? 'Elite session. Lou is nodding.' : q >= .55 ? 'Solid work.' : 'Rough day. You still got some reps in.';
    m.card.innerHTML = `<h2>${d.name} — Done</h2><p>${gradeTxt}</p><div class="pg-changes">${changes.map(UI.fmtChange).join('') || '<span class="muted">No gains this time.</span>'}</div>${Engine.ovr(s) > before ? `<p class="hl big">Overall ${before} → ${Engine.ovr(s)}</p>` : ''}<div class="row end"><button class="btn glow" id="tDone">Done</button></div>`;
    if (changes.some(c => c.special === 'level')) UI.levelBurst();
    return new Promise(res => {
      const done = () => { m.close(); this.refresh(); res(); };
      m.card.querySelector('#tDone').onclick = done;
    });
  },
  rest() {
    const s = this.state; if (!s.hub || s.hub.ap <= 0) return;
    s.hub.ap--; UI.fxToasts(this.applyFx({ fatigue: -35, morale: 4 })); SFX.play('good'); this.save(); this.refresh();
  },
  buy(id) {
    const s = this.state, it = SHOP_BY_ID[id]; if (!it || s.meta.money < it.price) return UI.toast('Not enough cash.', 'bad');
    s.meta.money -= it.price; SFX.play('coin');
    if (it.consumable) UI.fxToasts(this.applyFx(it.fx));
    else { s.inventory.owned.push(id); s.inventory.equipped[it.slot] = id; UI.toast(`Bought & equipped <b>${it.name}</b>`, 'good'); }
    this.save(); this.refresh();
  },
  equip(id) {
    const s = this.state, it = SHOP_BY_ID[id];
    if (s.inventory.equipped[it.slot] === id) delete s.inventory.equipped[it.slot]; else s.inventory.equipped[it.slot] = id;
    SFX.play('click'); this.save(); this.refresh();
  },
  applyUpgrades(p) {
    const s = this.state, bb = Engine.badgeSnapshot(s), before = Engine.ovr(s);
    for (const k in p) for (let i = 0; i < p[k]; i++) Engine.upgrade(s, k);
    SFX.play('levelup');
    UI.toast(`Upgrades applied. Overall <b>${before} → ${Engine.ovr(s)}</b>`, 'good');
    Engine.badgeDiff(bb, s).forEach(x => UI.toast(`${Art.badge(x.b, x.tier, 30)} Badge: <b>${x.b.name}</b> ${BADGE_TIERS[x.tier]}`, 'ach', 4000));
    this.recordOvr('Upgrade'); this.checkAch(); this.save();
  },
  endCareer(id) { const s = this.state; s.ended = id; this.save(); UI.ending(id); },
};

window.addEventListener('DOMContentLoaded', () => Game.init());
