/* =====================================================================
   CUTSCENE.JS — cinematic cutscenes built in code (no video files).
   Letterbox bars, camera pans/zooms, slow motion, dramatic lighting,
   speed lines, anime-style impact frames, portraits + dialogue, title cards.

   Cutscene.play(id, ctx) -> Promise   (always skippable: tap/click/Space = next shot, Skip = end)
   ctx: { score:'61-58', opp:'Westbrook', team:{colors}, title, sub, ... }  → used by {tokens} in text
   Unlocked cutscenes are stored in state.cutscenes and can be rewatched in the hub (Cutscenes tab).

   SHOT FORMAT
   { scene: background (Art scenes), cam: [from, to] camera presets, dur: ms,
     actors: [{ who:'you'|character id, x: 0-100 (%), scale, expr, from:'left'|'right'|'below', mode:'full'|'bust' }],
     text: [speaker, line]   or   title: 'BIG TEXT', sub: 'small text',
     impact: true (inverted impact frame + shake), speed: true (speed lines), slow: true (slow-motion),
     light: 'gold'|'red'|'blue'|'spot'|'dark', score: true (TV score bug), confetti: true,
     sfx: 'roar' | ['dunk','roar'], music: mood }
   ===================================================================== */
const CUTSCENES = {
  opening: { name: 'Concrete Dreams', chapter: 'Chapter 1', shots: [
    { scene: 'playground', cam: ['wide', 'push'], dur: 3200, title: '{hometown}', sub: 'Halsey Street Courts · Summer', light: 'gold', music: 'story', sfx: 'crowd' },
    { scene: 'playground', cam: ['left', 'right'], dur: 3400, actors: [{ who: 'you', x: 50, scale: 1.15, from: 'below' }], text: ['narrator', 'Sixteen years old. No ranking. No name. Just a cracked court and a rim with no net.'] },
    { scene: 'playground', cam: ['push', 'close'], dur: 2400, actors: [{ who: 'you', x: 50, scale: 1.5, expr: 'fierce', mode: 'bust' }], text: ['you', 'One day, everybody\'s gonna know my name.'], light: 'spot' },
    { scene: 'title', cam: ['close', 'wide'], dur: 2600, impact: true, speed: true, title: 'HOOP DREAMS', sub: 'From nobody to the GOAT', sfx: ['dunk', 'roar'], music: 'menu' },
  ] },
  kai_showdown: { name: 'The Rival', chapter: 'Chapter 1', shots: [
    { scene: 'playground', cam: ['wide', 'left'], dur: 2600, actors: [{ who: 'kai', x: 30, scale: 1.1, from: 'left' }], text: ['narrator', 'A black SUV. A kid in a gold headband. The whole court goes quiet.'], music: 'clutch' },
    { scene: 'playground', cam: ['right', 'push'], dur: 2200, actors: [{ who: 'kai', x: 28, scale: 1.25, expr: 'smile', mode: 'bust' }, { who: 'you', x: 72, scale: 1.25, expr: 'fierce', mode: 'bust', from: 'right' }], light: 'red', speed: true, title: 'KAI STERLING', sub: '#1 sophomore in the country' },
    { scene: 'playground', cam: ['close', 'close'], dur: 1600, impact: true, actors: [{ who: 'you', x: 50, scale: 1.7, expr: 'fierce', mode: 'bust' }], title: 'VS', sfx: 'whoosh' },
  ] },
  scouted: { name: 'The Notebook', chapter: 'Chapter 1', shots: [
    { scene: 'playground', cam: ['wide', 'right'], dur: 2800, actors: [{ who: 'dee', x: 70, scale: 1.1, from: 'right' }], text: ['narrator', 'A woman in a navy blazer walks straight across the court toward you.'], music: 'story' },
    { scene: 'playground', cam: ['push', 'close'], dur: 2600, actors: [{ who: 'dee', x: 30, scale: 1.3, mode: 'bust', expr: 'smile' }, { who: 'you', x: 72, scale: 1.3, mode: 'bust' }], text: ['dee', 'You get better when it gets harder. I can\'t teach that.'], light: 'gold' },
    { scene: 'playground', cam: ['close', 'wide'], dur: 2200, slow: true, title: 'SCOUTED', sub: 'Elite Hoops Network · {name}', sfx: 'levelup', speed: true },
  ] },
  varsity: { name: 'Varsity', chapter: 'Chapter 2', shots: [
    { scene: 'gym', cam: ['wide', 'push'], dur: 2800, text: ['narrator', 'The list goes up on the locker room door. Everybody crowds around it.'], music: 'story' },
    { scene: 'gym', cam: ['push', 'close'], dur: 2400, actors: [{ who: 'you', x: 50, scale: 1.4, mode: 'bust', expr: 'smile', from: 'below' }], text: ['you', 'Number {num}. Starting five. That\'s me.'], light: 'spot' },
    { scene: 'gym', cam: ['close', 'wide'], dur: 2200, impact: true, speed: true, title: 'VARSITY', sub: '{hs}', sfx: ['dunk', 'roar'] },
  ] },
  game_winner: { name: 'Game-Winner', chapter: 'Any big game', shots: [
    { scene: 'arena', cam: ['wide', 'push'], dur: 2000, score: true, light: 'dark', text: ['narrator', 'Final seconds. {scoreline}.'], music: 'clutch', sfx: 'heartbeat' },
    { scene: 'arena', cam: ['push', 'close'], dur: 2200, slow: true, speed: true, actors: [{ who: 'you', x: 50, scale: 1.5, expr: 'fierce', mode: 'bust' }], text: ['narrator', 'The whole arena holds its breath…'] },
    { scene: 'arena', cam: ['close', 'close'], dur: 1500, impact: true, title: 'BANG!', sfx: ['swish', 'roar'] },
    { scene: 'arena', cam: ['close', 'wide'], dur: 2600, confetti: true, light: 'gold', score: true, title: 'GAME-WINNER', sub: '{name} · {scoreline}', music: 'victory' },
  ] },
  state_champ: { name: 'State Champions', chapter: 'Chapter 2', shots: [
    { scene: 'arena', cam: ['wide', 'push'], dur: 2400, score: true, text: ['narrator', 'Twelve thousand people. One buzzer.'], music: 'clutch', sfx: 'buzzer' },
    { scene: 'arena', cam: ['push', 'close'], dur: 2000, impact: true, speed: true, actors: [{ who: 'you', x: 50, scale: 1.6, expr: 'smile', mode: 'bust' }], title: 'CHAMPIONS', sfx: 'roar' },
    { scene: 'arena', cam: ['close', 'wide'], dur: 3200, confetti: true, light: 'gold', actors: [{ who: 'you', x: 50, scale: 1.1 }, { who: 'mom', x: 22, scale: .95, expr: 'smile' }, { who: 'lou', x: 78, scale: .95, expr: 'smile' }], title: 'STATE CHAMPIONS', sub: '{hs}', music: 'victory' },
  ] },
  injury: { name: 'The Sound', chapter: 'Any chapter', shots: [
    { scene: 'arena', cam: ['wide', 'push'], dur: 1600, slow: true, light: 'dark', text: ['narrator', 'You land wrong. You hear it before you feel it.'], music: 'sad', sfx: 'groan' },
    { scene: 'hospital', cam: ['push', 'close'], dur: 2200, impact: true, actors: [{ who: 'you', x: 50, scale: 1.4, mode: 'bust', expr: 'sad' }], title: 'INJURED', sub: '{injury}' },
    { scene: 'hospital', cam: ['close', 'wide'], dur: 2800, light: 'blue', text: ['narrator', 'Everything you built suddenly feels very far away.'] },
  ] },
  career_end: { name: 'The End of the Road', chapter: 'Early ending', shots: [
    { scene: 'street_night', cam: ['wide', 'push'], dur: 2600, light: 'red', text: ['narrator', 'Some nights change everything.'], music: 'sad' },
    { scene: 'hospital', cam: ['push', 'close'], dur: 2600, slow: true, actors: [{ who: 'mom', x: 50, scale: 1.3, mode: 'bust', expr: 'sad' }], text: ['narrator', 'Mom doesn\'t let go of your hand.'] },
    { scene: 'playground_night', cam: ['close', 'wide'], dur: 3200, light: 'blue', title: '{ending}', sub: 'Your career is over' },
  ] },
};

const Cutscene = (() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CAM = { wide: 'scale(1) translate(0,0)', push: 'scale(1.12) translate(0,-1%)', close: 'scale(1.3) translate(0,-3%)', left: 'scale(1.15) translate(5%,0)', right: 'scale(1.15) translate(-5%,0)' };

  function lookFor(who, ctx) {
    const s = Game.state;
    if (who === 'you') { const L = Object.assign({}, Engine.look(s)); if (ctx.team) { L.jersey = ctx.team.colors[0]; L.trim = ctx.team.colors[1]; } return L; }
    return UI.charLook(who);
  }
  function fill(t, ctx) {
    const s = Game.state;
    const map = Object.assign({ scoreline: ctx.score ? `${ctx.usAbbr || 'US'} ${ctx.score} ${ctx.themAbbr || 'THEM'}` : '', injury: ctx.injury || 'Out indefinitely', ending: ctx.ending || 'The End' }, ctx);
    return Engine.text(String(t || '').replace(/\{(scoreline|injury|ending|score|opp)\}/g, (m, k) => map[k] != null ? map[k] : m), s);
  }

  /* 16-bit backdrops: story scenes map to real venues; anything else is the scene art pixelated */
  const SCENE_VENUE = { playground: 'street_night', playground_night: 'street_night', street_night: 'rain_night', gym: null, arena: 'college_arena' };
  async function sceneBg(el, scene, ctx) {
    const s = Game.state, hs = s && s.career && s.career.hs, home = (hs && LOCAL_TEAMS[hs]) || LOCAL_TEAMS.halsey, team = ctx.team ? Object.assign({}, home, { colors: ctx.team.colors }) : home;
    let vid = SCENE_VENUE[scene]; if (scene === 'gym') vid = hs && VENUES['gym_' + hs] ? 'gym_' + hs : 'rec_center'; if (scene === 'playground' && !/night/.test(scene)) vid = 'park_day';
    el.innerHTML = '';
    if (typeof Pixel === 'undefined') { el.innerHTML = Art.scene(scene, 'cs' + scene); return; }
    if (vid && VENUES[vid]) { const cv = Pixel.snapshot(vid, team, LOCAL_TEAMS.westbrook || home); cv.className = 'pxc cs-pxbg'; el.appendChild(cv); return; }
    el.innerHTML = Art.scene(scene, 'cs' + scene + (hs || '')); await Pixel.pixelateEl(el, .2, 'pxc cs-pxbg').catch(() => { });
  }
  async function play(id, ctx = {}) {
    const C = CUTSCENES[id]; if (!C) return;
    const s = Game.state;
    if (s) { s.cutscenes = s.cutscenes || {}; s.cutscenes[id] = { at: Date.now(), ctx: JSON.parse(JSON.stringify(ctx)) }; }
    const root = document.createElement('div'); root.className = 'cs';
    root.innerHTML = `<div class="cs-cam"><div class="cs-bg"></div><div class="cs-actors"></div></div>
      <canvas class="cs-fx"></canvas><div class="cs-light"></div><div class="cs-score"></div>
      <div class="cs-bar top"></div><div class="cs-bar bot"></div>
      <div class="cs-title"></div><div class="cs-dialog"><b></b><p></p></div>
      <button class="cs-skip">Skip ⏭</button><div class="cs-hint">Tap / Space to continue</div>`;
    document.body.appendChild(root);
    const $ = sel => root.querySelector(sel);
    const cv = $('.cs-fx'), cx = cv.getContext('2d');
    let speed = false, alive = true, confetti = [];
    const fit = () => { cv.width = innerWidth; cv.height = innerHeight; }; fit(); addEventListener('resize', fit);
    const fx = () => {
      if (!alive) return;
      cx.clearRect(0, 0, cv.width, cv.height);
      if (speed) { // anime speed lines
        const W = cv.width, H = cv.height, mx = W / 2, my = H / 2;
        for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, r1 = Math.min(W, H) * (.28 + Math.random() * .2), r2 = Math.max(W, H);
          cx.strokeStyle = `rgba(255,255,255,${.12 + Math.random() * .3})`; cx.lineWidth = 1 + Math.random() * 3; cx.beginPath(); cx.moveTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); cx.lineTo(mx + Math.cos(a) * r2, my + Math.sin(a) * r2); cx.stroke(); }
      }
      confetti.forEach(p => { p.y += p.vy; p.x += p.vx; p.r += .1; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-5, -3, 10, 6); cx.restore(); });
      confetti = confetti.filter(p => p.y < cv.height + 20);
      requestAnimationFrame(fx);
    };
    requestAnimationFrame(fx);
    requestAnimationFrame(() => root.classList.add('in'));

    let skipAll = false, next = null;
    const advance = () => { if (next) { const n = next; next = null; n(); } };
    root.addEventListener('pointerdown', e => { if (e.target.closest('.cs-skip')) return; advance(); });
    $('.cs-skip').onclick = () => { skipAll = true; advance(); };
    const kd = e => { if (e.code === 'Escape') { skipAll = true; advance(); } else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); } };
    addEventListener('keydown', kd);

    for (const sh of C.shots) {
      if (skipAll) break;
      const cam = $('.cs-cam'), [c0, c1] = sh.cam || ['wide', 'wide'];
      if (sh.scene) await sceneBg($('.cs-bg'), sh.scene, ctx);
      cam.style.transition = 'none'; cam.style.transform = CAM[c0] || CAM.wide; void cam.offsetWidth;
      cam.style.transition = `transform ${sh.dur * (sh.slow ? 1.6 : 1)}ms cubic-bezier(.2,.6,.3,1)`; cam.style.transform = CAM[c1] || CAM.wide;
      // actors
      const actorsEl = $('.cs-actors'); actorsEl.style.visibility = 'hidden';
      actorsEl.innerHTML = (sh.actors || []).map(a => `<div class="cs-actor from-${a.from || 'none'} ${sh.slow ? 'slow' : ''}" style="left:${a.x}%;--sc:${a.scale || 1}">${Art.avatar(Object.assign({}, lookFor(a.who, ctx), { expr: a.expr || 'neutral' }), { mode: a.mode || 'full' })}</div>`).join('');
      if (typeof Pixel !== 'undefined') await Pixel.pixelateEl(actorsEl, .32).catch(() => { });   // 16-bit portraits
      actorsEl.style.visibility = '';
      requestAnimationFrame(() => root.querySelectorAll('.cs-actor').forEach(el => el.classList.add('on')));
      // text
      const title = $('.cs-title'), dlg = $('.cs-dialog');
      title.className = 'cs-title'; dlg.className = 'cs-dialog';
      if (sh.title) { title.innerHTML = `${esc(fill(sh.title, ctx))}${sh.sub ? `<small>${esc(fill(sh.sub, ctx))}</small>` : ''}`; requestAnimationFrame(() => title.classList.add('on')); }
      if (sh.text) {
        const [who, line] = sh.text, ch = STORY.characters[who];
        dlg.querySelector('b').textContent = who === 'narrator' ? '' : who === 'you' ? `${s.player.first} ${s.player.last}` : ch ? ch.name : who;
        dlg.querySelector('b').style.display = who === 'narrator' ? 'none' : '';
        dlg.querySelector('p').textContent = fill(line, ctx); dlg.classList.toggle('narr', who === 'narrator');
        requestAnimationFrame(() => dlg.classList.add('on'));
      }
      // score bug
      const sc = $('.cs-score');
      if (sh.score && ctx.score) { sc.innerHTML = `<span>${esc(ctx.usAbbr || 'US')}</span><b>${esc(ctx.score)}</b><span>${esc(ctx.themAbbr || 'THEM')}</span>`; sc.classList.add('on'); } else sc.classList.remove('on');
      // effects
      root.dataset.light = sh.light || '';
      speed = !!sh.speed;
      if (sh.impact) { root.classList.remove('impact'); void root.offsetWidth; root.classList.add('impact'); }
      if (sh.confetti) for (let i = 0; i < 160; i++) confetti.push({ x: Math.random() * cv.width, y: -Math.random() * cv.height * .5, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, r: Math.random() * 6, c: ['#f97316', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#fff'][i % 6] });
      if (sh.music) SFX.music(sh.music);
      [].concat(sh.sfx || []).forEach((n, i) => setTimeout(() => SFX.play(n), i * 160));
      await new Promise(res => { next = res; setTimeout(() => { if (next === res) { next = null; res(); } }, sh.dur * (sh.slow ? 1.6 : 1)); });
    }
    alive = false; removeEventListener('keydown', kd); removeEventListener('resize', fit);
    root.classList.remove('in'); await sleep(350); root.remove();
  }
  function list(s) { return Object.entries(CUTSCENES).map(([id, c]) => ({ id, name: c.name, chapter: c.chapter, unlocked: !!(s.cutscenes && s.cutscenes[id]), ctx: s.cutscenes && s.cutscenes[id] && s.cutscenes[id].ctx })); }
  return { play, list };
})();
