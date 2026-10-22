/* =====================================================================
   MATCH.JS — the animated canvas court, the 7 minigames, and the match
   flow (8–15 key "moments" per game + scorebug + play-by-play).
   Match.play(cfg) -> Promise<result>
   Minigames are reusable for training: Match.MG.shotMeter(layer, opts)
   ===================================================================== */
const Match = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const EASE = {
    lin: t => t, out: t => 1 - (1 - t) * (1 - t), in: t => t * t,
    io: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  };
  const HOOP = { x: 0, y: 5.25, z: 10 };

  /* =================================================================
     COURT (choices mode) — drawn with the same 16-bit renderer as the arcade (js/pixel.js),
     so switching between the two is seamless. World units are feet: x ∈ [-25,25],
     y ∈ [0 baseline, 47 half-court], z = height. They map onto the 384×216 pixel court.
     ================================================================= */
  class Court {
    constructor(canvas, us, them, venueId) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      this.us = us; this.them = them; this.venueId = venueId || 'rec_center';
      this.players = []; this.ball = { x: 0, y: 30, z: 3, holder: null, show: true, spin: 0, dribble: true };
      this.tweens = []; this.pops = [];
      this.shakeAmt = 0; this.timeScale = 1; this.zoom = 1; this.netWave = 0; this.rimBend = 0; this.flashA = 0;
      this.t = 0; this.excite = 0.3; this.fire = false; this.clutch = false; this.trail = null; this.cam = 0;
      this.VW = 0; this.resize();
      this._rs = () => this.resize(); window.addEventListener('resize', this._rs);
      this.alive = true; this.last = performance.now();
      this.amb = setInterval(() => { if (this.alive) Pixel.ambient(this.V, this.excite); }, 4800);
      const loop = now => { if (!this.alive) return; const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.update(dt); this.draw(dt); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    destroy() { this.alive = false; clearInterval(this.amb); window.removeEventListener('resize', this._rs); }
    resize() {
      const r = this.cv.parentElement.getBoundingClientRect(), asp = (r.width || 640) / Math.max(1, r.height || 360);
      const wide = asp >= PIX.W / PIX.H, VW = wide ? clamp(Math.round(PIX.H * asp / 2) * 2, PIX.W, 560) : clamp(Math.round(PIX.H * asp / 2) * 2, 256, PIX.W);
      if (VW === this.VW && this.V) return;
      this.VW = VW; this.cv.width = VW; this.cv.height = PIX.H; this.ctx.imageSmoothingEnabled = false;
      this.V = Pixel.venue(this.venueId, this.us, this.them, wide ? VW : PIX.W); this.R = Pixel.renderer(this.ctx, this.V);
      this.cam = (this.V.W - VW) / 2;
    }
    setVenue(id) { if (id === this.venueId) return; this.venueId = id; this.VW = 0; this.resize(); }
    /* world (feet) -> pixels */
    X(x) { return this.V.ox + PIX.hoop.x + x * 6.96; }
    Y(y) { return 41 + y * 3.6; }
    P(x, y, z = 0) { return { x: this.X(x), y: this.Y(y) - z * 3.2, s: 1 }; }
    /* ---------- tweening ---------- */
    tween(obj, to, dur, ease = 'io', onUpd) {
      return new Promise(res => {
        const from = {}; for (const k in to) from[k] = obj[k];
        this.tweens.push({ obj, from, to, dur: Math.max(0.01, dur), el: 0, ease: EASE[ease] || EASE.io, res, onUpd });
      });
    }
    wait(sec) { return new Promise(res => this.tweens.push({ obj: {}, from: {}, to: {}, dur: sec, el: 0, ease: EASE.lin, res })); }
    update(dt) {
      const sdt = dt * this.timeScale; this.t += sdt;
      for (let i = this.tweens.length - 1; i >= 0; i--) {
        const tw = this.tweens[i]; tw.el += sdt; const k = tw.ease(clamp(tw.el / tw.dur, 0, 1));
        for (const p in tw.to) tw.obj[p] = lerp(tw.from[p], tw.to[p], k);
        tw.onUpd && tw.onUpd(k);
        if (tw.el >= tw.dur) { this.tweens.splice(i, 1); tw.res(); }
      }
      this.pops.forEach(p => { p.life -= dt; p.y -= dt * 14; }); this.pops = this.pops.filter(p => p.life > 0);
      this.shakeAmt *= Math.pow(0.02, dt); this.netWave *= Math.pow(0.05, dt); this.rimBend *= Math.pow(0.01, dt); this.flashA *= Math.pow(0.02, dt);
      if (this.trail && !this.ball.holder) { const b = this.ball; this.R.E.fx.push({ x: this.X(b.x), y: this.Y(b.y) - b.z * 3.2, vx: 0, vy: 0, life: .3, col: this.trail }); }
    }
    user() { return this.players.find(p => p.isUser); }
    /* sprite for a court player (shared look with the arcade) */
    spr(p) {
      if (!p._s) { const cols = p.team === 'us' ? this.us.colors : this.them.colors; p._s = Pixel.sprite(Object.assign({}, p.look || {}, { num: p.num }), cols, { i: p.ph || 0 }); p._s.px = null; }
      return p._s;
    }
    /* ---------- drawing ---------- */
    draw(dt) {
      const c = this.ctx, R = this.R, E = R.E, V = this.V, b = this.ball;
      E.t = this.t; E.hype = Math.max(E.hype, this.excite); E.net.swish = Math.max(E.net.swish, Math.min(1, this.netWave)); E.rim = Math.max(E.rim, Math.min(1, this.rimBend));
      // camera (narrow screens follow the ball)
      if (this.VW < V.W) { const bx = b.holder ? this.X(b.holder.x) : this.X(b.x); this.cam += (clamp(bx - this.VW / 2, 0, V.W - this.VW) - this.cam) * Math.min(1, dt * 3); }
      const cam = Math.round(this.cam);
      c.setTransform(1, 0, 0, 1, 0, 0);
      if (this.zoom > 1.001) { const z = this.zoom, fx = this.X(0) - cam, fy = 30; c.setTransform(z, 0, 0, z, fx * (1 - z), fy * (1 - z)); }
      if (this.shakeAmt > .3) c.translate(Math.round(rnd(-1, 1) * this.shakeAmt * .4), Math.round(rnd(-1, 1) * this.shakeAmt * .4));
      c.translate(-cam, 0);
      c.drawImage(V.bg, 0, 0);
      R.crowd();
      c.save(); c.translate(V.ox, 0); R.hoop(false); c.restore();
      const hold = b.holder;
      const vis = this.players.filter(p => !p.hidden);
      vis.forEach(p => {
        const s = this.spr(p), nx = this.X(p.x) - V.ox, ny = this.Y(p.y);
        if (s.px != null && dt > 0) { s.vx = (nx - s.px) / dt; s.vy = (ny - s.py) / dt; } s.px = nx; s.py = ny;
        if (!p.moving && Math.hypot(s.vx, s.vy) < 30) { s.vx *= .5; s.vy *= .5; }
        s.x = nx; s.y = ny; s.z = p.z * 3.2;
        const sp = Math.hypot(s.vx, s.vy); s.phase += sp * dt * .21; s.dribT += dt / (sp > 12 ? .38 : .52);
        s.hasBall = hold === p && b.show; s.holdBall = b.dribble === false;
        s.stance = p.pose === 'def';
        s.act = p.anim || (p.pose === 'shoot' ? { type: 'shoot', air: p.z > .2, released: false } : p.pose === 'block' ? { type: 'block', t: .1 } : null);
        if (Math.abs(s.vx) > 8) s.face = Math.sign(s.vx);
        else if (p.faceX != null) s.face = p.faceX;
        else if (s.stance && hold && hold !== p) s.face = this.X(hold.x) >= this.X(p.x) ? 1 : -1;
        else if (!s.stance) s.face = p.x < 0 ? 1 : -1;
        s.fire = this.fire && p.isUser;
      });
      c.save(); c.translate(V.ox, 0);
      if (V.def.reflect) vis.forEach(p => R.reflection(p._s));
      const items = vis.map(p => ({ y: p._s.y, d: () => R.player(p._s, { me: p.isUser, fire: p.isUser && this.fire, tag: p.tag && !p.isUser ? p.tag : '' }) }));
      if (b.show && !hold) items.push({ y: this.Y(b.y) + .5, d: () => R.freeBall({ x: this.X(b.x) - V.ox, y: this.Y(b.y), z: b.z * 3.2, spin: this.t * 12 }, this.fire) });
      items.sort((a, z) => a.y - z.y).forEach(i => i.d());
      R.hoop(true);
      const hang = vis.find(p => p.anim && p.anim.type === 'dunk' && p.anim.t > .62 && p.anim.t < .95); if (hang) R.player(hang._s, { me: hang.isUser });
      c.restore();
      R.fx(dt);
      this.pops.forEach(p => R.text(p.text, p.x, p.y, p.c, p.sc, 'center', '#0a0a12'));
      R.weather(dt); R.lights();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(V.vg, cam, 0, this.VW, PIX.H, 0, 0, this.VW, PIX.H);
      if (this.flashA > 0.02) { c.fillStyle = `rgba(255,255,255,${this.flashA})`; c.fillRect(0, 0, this.VW, PIX.H); }
    }
    /* ---------- effects ---------- */
    pop(text, wx, wy, wz, color = '#facc15', size = 34) { this.pops.push({ text, x: this.X(wx), y: this.Y(wy) - wz * 3.2 - 22, c: color, sc: size >= 40 ? 3 : 2, life: 1.4 }); }
    confetti(n = 120) { const E = this.R.E; for (let i = 0; i < n; i++) E.fx.push({ x: rnd(0, this.V.W), y: rnd(-40, 0), vx: rnd(-12, 12), vy: rnd(20, 45), life: rnd(2, 4), col: pick(['#f97316', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#fff']), conf: 1 }); }
    sparks(wx, wy, wz, col = '#facc15', n = 26) { this.R.burst(this.X(wx), this.Y(wy) - wz * 3.2, col, Math.round(n * .7), 70); }
    shake(n = 10) { this.shakeAmt = n; }

    /* ---------- formation ---------- */
    setPlayers(list) { this.players = list.map((p, i) => Object.assign({ x: 0, y: 30, z: 0, ph: i, pose: '', moving: false }, p)); }

    ballPos() {
      const b = this.ball;
      if (b.holder) { const h = b.holder; return { x: h.x + 0.7, y: h.y + 0.3, z: h.pose === 'shoot' || (h.anim && /shoot|layup|dunk/.test(h.anim.type)) ? h.z + 8.5 : h.z + 3.2 }; }
      return b;
    }
    /* ---------- choreographed animations (16-bit action frames) ---------- */
    async moveTo(p, x, y, dur = .6) { p.moving = true; await this.tween(p, { x, y }, dur, 'io'); p.moving = false; }
    async jump(p, h = 3, dur = .5) { const own = !p.anim; if (own) p.anim = { type: 'reb', t: 0 }; await this.tween(p, { z: h }, dur / 2, 'out'); await this.tween(p, { z: 0 }, dur / 2, 'in'); if (own) p.anim = null; }
    async pass(from, to, dur) {
      const b = this.ball, s = this.ballPos(); from.anim = { type: 'pass', t: .15, T: .26, thrown: true }; b.holder = null; Object.assign(b, s); SFX.play('pass');
      const d = Math.hypot(to.x - s.x, to.y - s.y); dur = dur || clamp(d / 34, .3, .7);
      await this.tween(b, { x: to.x + .7, y: to.y + .3, z: 3.5 }, dur, 'lin'); b.holder = to; from.anim = null;
      to.anim = { type: 'catch', t: 0, T: .2 }; setTimeout(() => { if (to.anim && to.anim.type === 'catch') to.anim = null; }, 220);
    }
    /* Shot: gather, rise, release at the top, follow-through; ball arcs to the rim.
       outcome: 'swish' | 'rimin' | 'miss' | 'airball'. opts.layup = layup animation */
    async shoot(p, outcome, opts = {}) {
      p.faceX = p.x < 0 ? 1 : -1;
      p.anim = opts.layup ? { type: 'layup', t: .1, T: .7, released: false } : { type: 'shoot', t: 0, air: false, released: false };
      await this.wait(opts.layup ? .08 : .14);
      if (p.anim) { p.anim.air = true; p.anim.t = .3; }
      const jh = opts.jump || (opts.layup ? 3 : 2.2);
      await this.tween(p, { z: jh }, .26, 'out');
      const b = this.ball, s = this.ballPos(); b.holder = null; Object.assign(b, s); if (p.anim) p.anim.released = true;
      this.tween(p, { z: 0 }, .3, 'in').then(() => { p.anim = null; p.faceX = null; });
      const d = Math.hypot(HOOP.x - s.x, HOOP.y - s.y), arc = opts.arc || clamp(d * .45 + 4, 5, 14), dur = (opts.dur || clamp(.6 + d / 40, .65, 1.35));
      const sx = s.x, sy = s.y, sz = s.z;
      const tx = outcome === 'miss' ? rnd(-.9, .9) : outcome === 'airball' ? rnd(-3, 3) : 0, ty = outcome === 'airball' ? 7.5 : HOOP.y + (outcome === 'miss' ? rnd(-.6, .6) : 0);
      const o = { k: 0 };
      if (opts.slowmo) { this.timeScale = .35; this.tween(this, { zoom: 1.4 }, .5, 'io'); }
      await this.tween(o, { k: 1 }, dur, 'lin', k => { b.x = lerp(sx, tx, k); b.y = lerp(sy, ty, k); b.z = lerp(sz, HOOP.z + .4, k) + arc * 4 * k * (1 - k); });
      if (opts.slowmo) { this.timeScale = 1; this.tween(this, { zoom: 1 }, .6, 'io'); }
      if (outcome === 'swish' || outcome === 'rimin') {
        if (outcome === 'rimin') { SFX.play('rim'); this.rimBend = .4; await this.tween(b, { z: HOOP.z + 1.2, x: rnd(-.4, .4) }, .15, 'out'); await this.tween(b, { z: HOOP.z, x: 0 }, .15, 'in'); }
        SFX.play('swish'); this.netWave = 1;
        await this.tween(b, { z: HOOP.z - 2.5 }, .22, 'in');
        await this.tween(b, { z: 0, y: HOOP.y + 1.5 }, .35, 'in'); SFX.play('bounce');
        return true;
      }
      if (outcome === 'airball') { await this.tween(b, { z: 0, y: 2 }, .3, 'in'); SFX.play('bounce'); return false; }
      SFX.play('rim'); this.rimBend = .8; this.R.E.net.sway = 1;
      const ox = rnd(-8, 8), oy = rnd(10, 16);
      await this.tween(b, { x: ox * .3, y: HOOP.y + 2, z: HOOP.z + 3 }, .25, 'out');
      await this.tween(b, { x: ox, y: oy, z: 0 }, .5, 'in'); SFX.play('bounce');
      return false;
    }
    async drive(p, toX = rnd(-2.5, 2.5), toY = 7.5, dur = .7) { SFX.play('squeak'); this.ball.dribble = true; await this.moveTo(p, toX, toY, dur); }
    async layup(p, made) {
      await this.drive(p, rnd(-2, 2), 6.5, .55);
      return this.shoot(p, made ? (Math.random() < .5 ? 'swish' : 'rimin') : 'miss', { arc: 2.5, dur: .45, layup: true });
    }
    async dunk(p, made, poster) {
      await this.drive(p, rnd(-1.5, 1.5), 7.5, .55);
      const b = this.ball; b.dribble = false; p.faceX = p.x < 0 ? 1 : -1;
      p.anim = { type: 'dunk', t: 0, T: 1.05 };
      await this.wait(.12); p.anim.t = .22;
      if (poster) { this.timeScale = .4; this.tween(this, { zoom: 1.35 }, .4); }
      await this.tween(p, { z: 6.2, y: HOOP.y + 1.2, x: 0 }, .45, 'out', k => { if (p.anim) p.anim.t = .22 + k * .41; });
      if (poster) { this.timeScale = 1; this.tween(this, { zoom: 1 }, .7); }
      p.anim.t = .66; p.anim.made = made;
      if (!made) {
        b.holder = null; Object.assign(b, { x: 0, y: HOOP.y + 1, z: HOOP.z + .5 }); SFX.play('rim'); this.rimBend = .5;
        p.anim = { type: 'jump', t: 0 }; this.tween(p, { z: 0, y: 7 }, .4, 'in').then(() => { p.anim = null; p.faceX = null; });
        await this.tween(b, { x: rnd(-6, 6), y: rnd(12, 16), z: 0 }, .6, 'in'); return false;
      }
      b.holder = null; Object.assign(b, { x: 0, y: HOOP.y, z: HOOP.z + .6 });
      SFX.play('dunk'); this.shake(poster ? 22 : 13); this.rimBend = 1.2; this.netWave = 1.5; this.flashA = poster ? .5 : .25;
      this.sparks(0, HOOP.y, HOOP.z, '#facc15', poster ? 50 : 24);
      await this.tween(b, { z: 0 }, .35, 'in', k => { if (p.anim) p.anim.t = .66 + k * .24; }); SFX.play('bounce');
      p.anim = { type: 'jump', t: 0 }; await this.tween(p, { z: 0, y: 7 }, .3, 'in'); p.anim = null; p.faceX = null;
      return true;
    }
    async steal(user, from) {
      SFX.play('squeak'); user.pose = 'def'; user.anim = { type: 'reach', t: .1, T: .32 }; await this.moveTo(user, from.x + .8, from.y + .5, .25);
      this.ball.holder = user; this.sparks(user.x, user.y, 3, '#38bdf8', 18); SFX.play('whoosh'); user.pose = ''; user.anim = null;
      from.anim = { type: 'stumble', t: 0, T: .5 }; setTimeout(() => { if (from.anim && from.anim.type === 'stumble') from.anim = null; }, 500);
    }
    async block(user, shooter, success) {
      shooter.anim = { type: 'shoot', t: .3, air: true, released: false }; user.anim = { type: 'block', t: .1 };
      const b = this.ball; b.holder = null; Object.assign(b, { x: shooter.x, y: shooter.y, z: 8 });
      this.moveTo(user, shooter.x + .6, shooter.y - .8, .3);
      const j = this.tween(user, { z: 4 }, .3, 'out').then(() => this.tween(user, { z: 0 }, .3, 'in')); await this.tween(shooter, { z: 2 }, .25, 'out'); await this.tween(shooter, { z: 0 }, .25, 'in');
      shooter.anim = null;
      if (success) {
        SFX.play('dunk'); this.shake(10); this.sparks(b.x, b.y, 10, '#38bdf8', 30);
        await this.tween(b, { x: b.x + rnd(-14, 14), y: b.y + 14, z: 0 }, .55, 'in'); await j; user.anim = null; return true;
      }
      await j; user.anim = null;
      return this.shoot(shooter, 'swish', { jump: .2, arc: 4 });
    }
  }

  /* =================================================================
     MINIGAMES — each renders into `layer` and resolves a result.
     All support mouse, touch, and keyboard.
     ================================================================= */
  function mgShell(layer, title, hint, extraCls = '') {
    const el = document.createElement('div');
    el.className = 'mg ' + extraCls;
    el.innerHTML = `<div class="mg-card"><div class="mg-title">${title}</div><div class="mg-body"></div><div class="mg-hint">${hint}</div></div>`;
    layer.classList.remove('ftmode');
    layer.appendChild(el); layer.classList.add('on');
    requestAnimationFrame(() => el.classList.add('in'));
    return { el, body: el.querySelector('.mg-body'), card: el.querySelector('.mg-card'), close: async (msg, good) => {
      if (msg) { const f = document.createElement('div'); f.className = 'mg-result ' + (good ? 'good' : 'bad'); f.textContent = msg; el.querySelector('.mg-card').appendChild(f); await sleep(750); }
      el.classList.remove('in'); await sleep(180); el.remove(); if (!layer.children.length) layer.classList.remove('on');
    } };
  }
  /* universal "tap" input: pointer on element, or Space/Enter */
  function onTap(target, fn) {
    const pd = e => { e.preventDefault(); fn(); };
    const kd = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); fn(); } };
    target.addEventListener('pointerdown', pd); window.addEventListener('keydown', kd);
    return () => { target.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd); };
  }
  function dirInput(fn) { // arrows / WASD
    const map = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D' };
    const kd = e => { if (map[e.code]) { e.preventDefault(); fn(map[e.code]); } };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  }
  const ARROW = { L: '◀', R: '▶', U: '▲', D: '▼' };

  const MG = {
    /* 1. SHOOTING METER — stop the rising bar in the green zone */
    shotMeter(layer, o = {}) {
      const green = clamp(o.green || .14, .05, .4), dur = o.dur || 1.05, center = .8;
      const sh = mgShell(layer, o.title || 'SHOT METER', 'Tap / click / SPACE to release at the top', 'mg-shot');
      sh.body.innerHTML = `<div class="meter"><div class="meter-green" style="bottom:${(center - green / 2) * 100}%;height:${green * 100}%"><div class="meter-perfect"></div></div><div class="meter-fill"></div><div class="meter-line"></div></div><div class="mg-sub">${o.sub || ''}</div>`;
      const fill = sh.body.querySelector('.meter-fill'), line = sh.body.querySelector('.meter-line');
      return new Promise(res => {
        let t0 = performance.now(), done = false, v = 0;
        const finish = async () => {
          if (done) return; done = true; off();
          const dist = Math.abs(v - center) / (green / 2);
          let r; if (dist <= .28) r = 'perfect'; else if (dist <= 1) r = 'good'; else r = v < center ? 'early' : 'late';
          const q = clamp(1 - Math.max(0, dist - 1) / 2.5, 0, 1);
          SFX.play(r === 'perfect' ? 'perfect' : r === 'good' ? 'good' : 'bad');
          await sh.close(r === 'perfect' ? 'PERFECT RELEASE' : r === 'good' ? 'GOOD RELEASE' : (r === 'early' ? 'TOO EARLY' : 'TOO LATE'), r === 'perfect' || r === 'good');
          res({ result: r, quality: dist <= 1 ? 1 - dist * .3 : q * .6, perfect: r === 'perfect', good: r === 'good' || r === 'perfect' });
        };
        const off = onTap(sh.el, finish);
        const step = now => {
          if (done) return; const t = (now - t0) / 1000 / dur;
          v = t < 1 ? EASE.out(t) * 1 : 1 - (t - 1) * 1.6; // rise to top, then fall
          fill.style.height = clamp(v, 0, 1) * 100 + '%'; line.style.bottom = clamp(v, 0, 1) * 100 + '%';
          if (t > 1.6) { v = 0; return finish(); }
                    requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    /* 2. FREE THROWS — dedicated view from behind the shooter.
          Layout (never overlaps): top = title + attempt dots + result,
          middle = aiming canvas, bottom = stat label + instructions.
          The reticle drifts inside the aiming area; tap when it turns GREEN.
          o: { shots, base (% from Balance), stat, zone (make-zone size × rim radius), wobble (drift × rim radius),
               pressure, shooter:{num,name,color,trim,skin,hair}, lane:{us,them}, onShot(made) } */
    freeThrow(layer, o = {}) {
      const shots = o.shots || 2, zoneMul = clamp(o.zone || 1.2, .45, 2.4), ampMul = clamp(o.wobble || 1.6, .8, 3.4), base = o.base != null ? o.base : 65;
      const sh = o.shooter || { num: 0, name: '', color: '#f97316', trim: '#111', skin: '#a86b43', hair: '#111' }, lane = o.lane || { us: '#f97316', them: '#2563eb' };
      const el = document.createElement('div'); el.className = 'mg mg-ftview';
      el.innerHTML = `<div class="ftv-top"><b>${o.title || 'FREE THROWS'}</b><span class="ftv-dots">${'<i></i>'.repeat(shots)}</span><span class="ftv-score"></span><span class="ftv-res"></span></div>
        <div class="ftv-stage"><canvas></canvas></div>
        <div class="ftv-bot"><span>${o.stat != null ? `Free Throw <b>${o.stat}</b> · ` : ''}base <b>${base}%</b>${o.pressure ? ' · <em class="press">PRESSURE</em>' : ''}</span><span>Tap / click / SPACE when the reticle turns <b class="g">GREEN</b></span></div>`;
      layer.appendChild(el); layer.classList.add('on', 'ftmode'); requestAnimationFrame(() => el.classList.add('in'));
      const stage = el.querySelector('.ftv-stage'), cv = stage.querySelector('canvas'), c = cv.getContext('2d');
      const dots = el.querySelectorAll('.ftv-dots i'), resEl = el.querySelector('.ftv-res'), scEl = el.querySelector('.ftv-score');
      const showScore = () => { if (o.scoreText) scEl.textContent = o.scoreText(); }; showScore();
      let W = 300, H = 200;
      const PXS = 1 / 3;   // 16-bit look: drawn at a third of the resolution and scaled up crisp
      const fit = () => { const r = stage.getBoundingClientRect(); W = Math.max(200, r.width); H = Math.max(150, r.height); cv.width = Math.round(W * PXS); cv.height = Math.round(H * PXS); cv.style.width = W + 'px'; cv.style.height = H + 'px'; c.setTransform(PXS, 0, 0, PXS, 0, 0); c.imageSmoothingEnabled = false; };
      fit(); const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null; ro && ro.observe(stage);
      const G = () => { const rr = Math.min(W * .075, H * .085); return { rr, RX: W / 2, RY: H * .33, zone: rr * zoneMul, amp: rr * ampMul, aimW: rr * 3.3, aimH: rr * 2.1 }; };
      return new Promise(res => {
        let k = 0, made = 0, perfect = 0, busy = false, alive = true, t0 = performance.now(), ph = [rnd(0, 6), rnd(0, 6), rnd(0, 6)], net = 0;
        const ret = { x: 0, y: 0 }; let ball = null;
        const person = (x, y, sc, col, trim, num, back) => { // small lane player / big shooter
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y, 14 * sc, 4 * sc, 0, 0, 7); c.fill();
          c.fillStyle = '#7c4a2a'; c.fillRect(x - 6 * sc, y - 26 * sc, 4 * sc, 24 * sc); c.fillRect(x + 2 * sc, y - 26 * sc, 4 * sc, 24 * sc);
          c.fillStyle = col; c.fillRect(x - 10 * sc, y - 36 * sc, 20 * sc, 12 * sc); c.fillRect(x - 10 * sc, y - 62 * sc, 20 * sc, 28 * sc);
          if (num != null) { c.fillStyle = trim; c.font = `900 ${12 * sc}px "Bebas Neue", Impact`; c.textAlign = 'center'; c.fillText(num, x, y - 42 * sc); }
          c.fillStyle = '#8a5233'; c.beginPath(); c.arc(x, y - 70 * sc, 7 * sc, 0, 7); c.fill();
        };
        const draw = now => {
          if (!alive) return;
          const g = G(), { rr, RX, RY } = g;
          if (!busy) { const t = (now - t0) / 1000;
            ret.x = clamp(RX + Math.sin(t * 1.5 + ph[0]) * g.amp + Math.sin(t * 2.9 + ph[1]) * g.amp * .25, RX - g.aimW, RX + g.aimW);
            ret.y = clamp(RY + Math.sin(t * 2.1 + ph[2]) * g.amp * .55, RY - g.aimH, RY + g.aimH); }
          const d = Math.hypot(ret.x - RX, ret.y - RY), inside = d <= g.zone; cv.dataset.inside = inside ? '1' : '0';
          // arena + floor
          const bgG = c.createLinearGradient(0, 0, 0, H); bgG.addColorStop(0, '#0b1020'); bgG.addColorStop(.55, '#1a2236'); bgG.addColorStop(.56, '#8a5a2b'); bgG.addColorStop(1, '#c98b4e');
          c.fillStyle = bgG; c.fillRect(0, 0, W, H);
          for (let i = 0; i < 70; i++) { c.fillStyle = ['#1e293b', '#334155', lane.us, lane.them][i % 4]; c.globalAlpha = .55; c.beginPath(); c.arc((i * 97) % W, (i * 37) % (H * .42), 2.4, 0, 7); c.fill(); } c.globalAlpha = 1;
          // lane (paint) in perspective
          const farY = RY + rr * 2.6, nearY = H * 1.02, farW = rr * 3.4, nearW = W * .62;
          c.fillStyle = lane.us + 'aa'; c.beginPath(); c.moveTo(RX - farW, farY); c.lineTo(RX + farW, farY); c.lineTo(RX + nearW, nearY); c.lineTo(RX - nearW, nearY); c.closePath(); c.fill();
          c.strokeStyle = '#ffffffcc'; c.lineWidth = 2; c.stroke();
          // lane players lined up on both sides
          [.18, .45, .72].forEach((t, i) => { const y = lerp(farY, nearY, t) - 2, sc = .55 + t * .7, w = lerp(farW, nearW, t) + 14 * sc;
            person(RX - w, y, sc, i % 2 ? lane.us : lane.them, '#fff', null); person(RX + w, y, sc, i % 2 ? lane.them : lane.us, '#fff', null); });
          // backboard, rim, net
          c.fillStyle = 'rgba(226,232,240,.18)'; c.strokeStyle = '#e2e8f0'; c.lineWidth = 3;
          c.fillRect(RX - rr * 2.6, RY - rr * 2.8, rr * 5.2, rr * 3.2); c.strokeRect(RX - rr * 2.6, RY - rr * 2.8, rr * 5.2, rr * 3.2);
          c.strokeStyle = '#ef4444'; c.strokeRect(RX - rr * .9, RY - rr * 1.6, rr * 1.8, rr * 1.3);
          c.fillStyle = '#334155'; c.fillRect(RX - 3, RY - rr * 2.8 - H, 6, H);
          const wv = Math.sin(now / 40) * net * 4; net *= .93;
          c.strokeStyle = '#ffffffb0'; c.lineWidth = 1.2;
          for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(RX + i * rr * .22, RY + 2); c.lineTo(RX + i * rr * .13 + wv, RY + rr * 1.25 + net * rr * .4); c.stroke(); }
          // make zone (green) + perfect ring
          c.fillStyle = inside && !busy ? 'rgba(34,197,94,.38)' : 'rgba(34,197,94,.16)'; c.strokeStyle = '#4ade80'; c.lineWidth = 2;
          c.beginPath(); c.arc(RX, RY, g.zone, 0, 7); c.fill(); c.stroke();
          c.setLineDash([4, 4]); c.beginPath(); c.arc(RX, RY, g.zone * .35, 0, 7); c.stroke(); c.setLineDash([]);
          c.strokeStyle = '#f97316'; c.lineWidth = 4; c.beginPath(); c.ellipse(RX, RY, rr, rr * .3, 0, 0, 7); c.stroke();
          // shooter (from behind)
          const sx = W / 2, sy = H * 1.06, sc = Math.min(W, H) / 150;
          c.fillStyle = sh.color; c.beginPath(); c.moveTo(sx - 30 * sc, sy); c.lineTo(sx - 24 * sc, sy - 46 * sc); c.lineTo(sx + 24 * sc, sy - 46 * sc); c.lineTo(sx + 30 * sc, sy); c.fill();
          c.fillStyle = sh.trim; c.font = `900 ${22 * sc}px "Bebas Neue", Impact`; c.textAlign = 'center'; c.fillText(sh.num, sx, sy - 14 * sc);
          c.font = `700 ${7 * sc}px Oswald, sans-serif`; c.fillText(String(sh.name || '').toUpperCase(), sx, sy - 34 * sc);
          c.fillStyle = sh.skin; c.fillRect(sx - 32 * sc, sy - 64 * sc, 8 * sc, 22 * sc); c.fillRect(sx + 24 * sc, sy - 64 * sc, 8 * sc, 22 * sc);
          c.beginPath(); c.arc(sx, sy - 56 * sc, 11 * sc, 0, 7); c.fill(); c.fillStyle = sh.hair; c.beginPath(); c.arc(sx, sy - 58 * sc, 11 * sc, Math.PI, 2 * Math.PI); c.fill();
          // ball (in hands, or flying)
          const bx0 = sx, by0 = sy - 74 * sc;
          if (ball) {
            const p = clamp((now - ball.t) / ball.dur, 0, 1);
            let x, y, r = lerp(rr * .75, rr * .5, Math.min(1, p * 1.4));
            if (p < .62) { const q = p / .62; x = lerp(bx0, ball.tx, q); y = lerp(by0, ball.ty, q) - Math.sin(q * Math.PI) * H * .32; }
            else { const q = (p - .62) / .38; const o2 = ball.kind;
              if (o2 === 'swish') { x = RX; y = lerp(RY, RY + rr * 1.6, q); }
              else if (o2 === 'rimin') { x = lerp(ball.tx, RX, q); y = RY - Math.sin(q * Math.PI) * rr * .9 + q * rr * 1.2; }
              else if (o2 === 'rimout') { x = ball.tx + (ball.tx >= RX ? 1 : -1) * q * rr * 3; y = RY - Math.sin(Math.min(1, q * 1.5) * Math.PI) * rr + q * q * rr * 3; }
              else { x = ball.tx; y = ball.ty + q * rr * 2.5; } }
            c.fillStyle = '#ea580c'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = '#431407'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke();
          } else {
            c.fillStyle = '#ea580c'; c.beginPath(); c.arc(bx0, by0, rr * .75, 0, 7); c.fill();
            // reticle
            const col = inside ? '#4ade80' : '#facc15'; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(ret.x, ret.y, rr * .42, 0, 7);
            c.moveTo(ret.x - rr * .9, ret.y); c.lineTo(ret.x - rr * .25, ret.y); c.moveTo(ret.x + rr * .25, ret.y); c.lineTo(ret.x + rr * .9, ret.y);
            c.moveTo(ret.x, ret.y - rr * .9); c.lineTo(ret.x, ret.y - rr * .25); c.moveTo(ret.x, ret.y + rr * .25); c.lineTo(ret.x, ret.y + rr * .9); c.stroke();
            if (inside) { c.fillStyle = 'rgba(74,222,128,.35)'; c.beginPath(); c.arc(ret.x, ret.y, rr * .42, 0, 7); c.fill(); }
          }
          requestAnimationFrame(draw);
        };
        const shoot = async () => {
          if (busy || k >= shots) return; busy = true;
          const g = G(), d = Math.hypot(ret.x - g.RX, ret.y - g.RY);
          const q = d <= g.zone ? 1 - (d / g.zone) * .45 : clamp(.5 - (d - g.zone) / (g.zone * 2.2), 0, .5);
          const fin = Balance.apply('ft', base, q), ok = Math.random() * 100 < fin;
          const kind = ok ? (q > .8 ? 'swish' : 'rimin') : (d > g.zone * 2.6 ? 'airball' : 'rimout');
          ball = { t: performance.now(), dur: 1050, kind, tx: kind === 'airball' ? ret.x : kind === 'swish' ? g.RX : g.RX + (ret.x >= g.RX ? 1 : -1) * g.rr * .8, ty: kind === 'airball' ? g.RY + g.rr * 1.4 : g.RY };
          await sleep(650);
          if (kind === 'swish' || kind === 'rimin') { net = 1; SFX.play(kind === 'swish' ? 'swish' : 'rim'); if (kind === 'rimin') setTimeout(() => SFX.play('swish'), 180); } else if (kind === 'rimout') SFX.play('rim');
          await sleep(420);
          if (ok) { made++; if (q > .9) perfect++; }
          dots[k].className = ok ? 'make' : 'miss';
          resEl.textContent = { swish: 'SWISH!', rimin: 'RIM IN!', rimout: 'RIM OUT', airball: 'AIRBALL' }[kind]; resEl.className = 'ftv-res ' + (ok ? 'good' : 'bad');
          o.onShot && o.onShot(ok); showScore();
          k++; ball = null;
          await sleep(650);
          if (k >= shots) { alive = false; off(); ro && ro.disconnect(); el.classList.remove('in'); await sleep(200); el.remove(); if (!layer.children.length) layer.classList.remove('on'); layer.classList.remove('ftmode'); return res({ made, attempts: shots, perfect }); }
          resEl.textContent = ''; t0 = performance.now(); ph = [rnd(0, 6), rnd(0, 6), rnd(0, 6)]; busy = false;
        };
        const off = onTap(el, shoot);
        requestAnimationFrame(draw);
      });
    },

    /* 3. DRIBBLE COMBO — hit the arrow sequence in time (keys, swipes or buttons) */
    dribbleCombo(layer, o = {}) {
      const len = o.len || 5, per = (o.time || 1.0) * 1000;
      const seq = [...Array(len)].map(() => pick(['L', 'R', 'U', 'D']));
      const sh = mgShell(layer, o.title || 'DRIBBLE COMBO', 'Arrow keys / WASD, swipe, or tap the buttons', 'mg-combo');
      sh.body.innerHTML = `<div class="combo-seq">${seq.map(d => `<span>${ARROW[d]}</span>`).join('')}</div><div class="timer"><i></i></div>
        <div class="dpad"><button data-d="U">▲</button><button data-d="L">◀</button><button data-d="D">▼</button><button data-d="R">▶</button></div>`;
      const spans = sh.body.querySelectorAll('.combo-seq span'), bar = sh.body.querySelector('.timer i');
      return new Promise(res => {
        let i = 0, hits = 0, t0 = performance.now(), done = false, sx = 0, sy = 0;
        spans[0].classList.add('cur');
        const input = d => {
          if (done) return;
          const ok = d === seq[i]; spans[i].className = ok ? 'hit' : 'miss'; SFX.play(ok ? 'squeak' : 'bad'); if (ok) { hits++; SFX.play('bounce'); }
          next();
        };
        const next = () => { i++; t0 = performance.now(); if (i >= len) return end(); spans[i].classList.add('cur'); };
        const end = async () => { done = true; offK(); sh.el.removeEventListener('pointerdown', pdown); sh.el.removeEventListener('pointerup', pup); await sh.close(hits === len ? 'ANKLES BROKEN!' : `${hits} / ${len}`, hits >= len - 1); res({ hits, total: len, quality: hits / len }); };
        const offK = dirInput(input);
        sh.body.querySelectorAll('.dpad button').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); input(b.dataset.d); }));
        const pdown = e => { sx = e.clientX; sy = e.clientY; };
        const pup = e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return; input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); };
        sh.el.addEventListener('pointerdown', pdown); sh.el.addEventListener('pointerup', pup);
        const step = now => {
          if (done) return; const p = (now - t0) / per; bar.style.width = clamp(1 - p, 0, 1) * 100 + '%';
          if (p >= 1) { spans[i].className = 'miss'; SFX.play('bad'); next(); }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    /* 4. TIMING RINGS (dunks, layups, hooks) — tap when each shrinking ring meets the circle.
          quality = average accuracy over all rings (0..1) */
    dunkChain(layer, o = {}) {
      const rings = o.rings || 3, tol = o.tol || 10, labels = o.labels || ['GATHER', 'RISE', 'SLAM'];
      const sh = mgShell(layer, o.title || 'DUNK TIMING', 'Tap / click / SPACE when the ring hits the circle', 'mg-dunk');
      sh.body.innerHTML = `<canvas class="pxc" width="130" height="100" style="width:260px;aspect-ratio:26/20"></canvas><div class="ft-dots">${'<i></i>'.repeat(rings)}</div><div class="mg-sub ring-lbl"></div>`;
      const cv = sh.body.querySelector('canvas'), c = cv.getContext('2d'), dots = sh.body.querySelectorAll('.ft-dots i'), lbl = sh.body.querySelector('.ring-lbl'); c.setTransform(.5, 0, 0, .5, 0, 0);
      const TR = 30;
      return new Promise(res => {
        let k = 0, hits = 0, acc = 0, r = 105, sp = (o.speed || 85), done = false, flash = 0, last = performance.now();
        const tap = () => {
          if (done) return; const e = Math.abs(r - TR), ok = e <= tol; flash = ok ? 1 : -1;
          dots[k].className = ok ? 'make' : 'miss'; if (ok) { hits++; acc += 1 - e / tol * .6; } SFX.play(ok ? 'good' : 'bad'); k++; r = 105; sp *= 1.2;
          if (k >= rings) { done = true; off(); const q = acc / rings; sh.close(hits === rings ? (rings > 1 ? 'POSTERIZED!' : 'PERFECT TOUCH') : hits ? 'GOT IT UP' : 'STUFFED', hits >= Math.ceil(rings * .6)).then(() => res({ hits, total: rings, quality: q })); }
        };
        const off = onTap(sh.el, tap);
        const step = now => {
          if (done) return; const dt = (now - last) / 1000; last = now; r -= sp * dt;
          if (r < TR - tol - 4) tap();
          c.clearRect(0, 0, 260, 200);
          c.fillStyle = flash > 0 ? '#22c55e55' : flash < 0 ? '#ef444455' : '#ffffff10'; flash *= .9;
          c.beginPath(); c.arc(130, 100, TR, 0, 7); c.fill();
          c.strokeStyle = '#22c55e66'; c.lineWidth = tol * 2; c.beginPath(); c.arc(130, 100, TR, 0, 7); c.stroke();
          c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(130, 100, TR, 0, 7); c.stroke();
          c.strokeStyle = '#f97316'; c.lineWidth = 5; c.beginPath(); c.arc(130, 100, Math.max(2, r), 0, 7); c.stroke();
          const lb = labels[Math.min(k, labels.length - 1)] || ''; if (lbl.textContent !== lb) lbl.textContent = lb;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    /* 5. DEFENSE REACTION — read the attacker's move and mirror it */
    defenseReact(layer, o = {}) {
      const win = o.window || 600;
      const sh = mgShell(layer, o.title || 'LOCK IN', 'Mirror the move: ◀ ▶ slide, ▲ contest. Don\'t bite early!', 'mg-def');
      sh.body.innerHTML = `<div class="def-stage"><div class="def-att">${o.attackerSvg || ''}</div><div class="def-tell">…</div></div><div class="timer"><i></i></div>
        <div class="dpad three"><button data-d="L">◀ SLIDE</button><button data-d="U">▲ CONTEST</button><button data-d="R">SLIDE ▶</button></div>`;
      const tell = sh.body.querySelector('.def-tell'), bar = sh.body.querySelector('.timer i'), att = sh.body.querySelector('.def-att');
      if (o.attackerSvg && typeof Pixel !== 'undefined') Pixel.pixelate(o.attackerSvg, 44, 54).then(cv => { cv.className = 'pxc'; att.innerHTML = ''; att.appendChild(cv); });
      return new Promise(res => {
        const move = pick(['L', 'R', 'U']), delay = rnd(700, 1700), t0 = performance.now(); let shown = 0, done = false;
        const fakeAt = Math.random() < .45 ? delay * rnd(.35, .6) : 0;
        const finish = async (ok, q, msg) => { if (done) return; done = true; offK(); SFX.play(ok ? 'good' : 'bad'); await sh.close(msg, ok); res({ success: ok, quality: q }); };
        const input = d => {
          if (done) return;
          if (!shown) return finish(false, 0, 'BIT ON THE FAKE');
          const rt = performance.now() - shown;
          if (d === move) finish(true, clamp(1 - rt / win, .2, 1), rt < win * .4 ? 'LOCKED UP!' : 'STAYED IN FRONT');
          else finish(false, 0, 'WRONG WAY');
        };
        const offK = dirInput(input);
        sh.body.querySelectorAll('.dpad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); input(b.dataset.d); }));
        const step = now => {
          if (done) return; const t = now - t0;
          if (fakeAt && t > fakeAt && t < fakeAt + 180) { tell.textContent = pick(['◀?', '▶?']); tell.className = 'def-tell fake'; att.style.transform = `translateX(${rnd(-8, 8)}px)`; }
          else if (!shown && t < delay) { tell.textContent = '…'; tell.className = 'def-tell'; att.style.transform = ''; }
          if (!shown && t >= delay) { shown = performance.now(); tell.textContent = ARROW[move]; tell.className = 'def-tell go'; att.style.transform = move === 'L' ? 'translateX(-26px) rotate(-6deg)' : move === 'R' ? 'translateX(26px) rotate(6deg)' : 'translateY(-14px)'; SFX.play('squeak'); }
          if (shown) { const p = (now - shown) / win; bar.style.width = clamp(1 - p, 0, 1) * 100 + '%'; if (p >= 1) return finish(false, 0, 'TOO SLOW'); }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    /* 6. REBOUND — time the box-out jump as the ball comes off the rim */
    rebound(layer, o = {}) {
      const zone = clamp(o.zone || .14, .06, .35), zc = rnd(.6, .8);
      const sh = mgShell(layer, o.title || 'BOX OUT', 'Tap / SPACE to jump when the ball hits the zone', 'mg-reb');
      sh.body.innerHTML = `<canvas class="pxc" width="150" height="85" style="width:300px;aspect-ratio:30/17"></canvas>${o.sub ? `<div class="mg-sub">${o.sub}</div>` : ''}`;
      const cv = sh.body.querySelector('canvas'), c = cv.getContext('2d'); c.setTransform(.5, 0, 0, .5, 0, 0);
      return new Promise(res => {
        let t0 = performance.now(), done = false, p = 0; const dur = o.dur || 1.3;
        const pos = k => ({ x: 30 + k * 240, y: 140 - Math.sin(k * Math.PI * 1.25) * 110 * (1 - k * .35) });
        const fin = async () => {
          if (done) return; done = true; off();
          const d = Math.abs(p - zc) / (zone / 2), ok = d <= 1;
          SFX.play(ok ? 'good' : 'bad'); await sh.close(ok ? (d < .35 ? 'SKYWALKER BOARD' : 'GOT IT!') : (p < zc ? 'JUMPED EARLY' : 'TOO LATE'), ok);
          res({ success: ok, quality: ok ? 1 - d * .4 : 0 });
        };
        const off = onTap(sh.el, fin);
        const step = now => {
          if (done) return; p = (now - t0) / 1000 / dur; if (p > 1.05) return fin();
          c.clearRect(0, 0, 300, 170);
          const a = pos(zc - zone / 2), b = pos(zc + zone / 2);
          c.fillStyle = '#22c55e33'; c.fillRect(a.x, 0, b.x - a.x, 170); c.strokeStyle = '#22c55e'; c.strokeRect(a.x, 0, b.x - a.x, 170);
          c.strokeStyle = '#f97316'; c.lineWidth = 4; c.beginPath(); c.ellipse(30, 140, 18, 5, 0, 0, 7); c.stroke();
          c.setLineDash([4, 6]); c.strokeStyle = '#fff4'; c.lineWidth = 2; c.beginPath(); for (let k = 0; k <= 1; k += .02) { const q = pos(k); k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } c.stroke(); c.setLineDash([]);
          const q = pos(clamp(p, 0, 1)); c.fillStyle = '#ea580c'; c.beginPath(); c.arc(q.x, q.y, 11, 0, 7); c.fill();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    /* 7. PASSING LANE — hit the open teammate before the window closes */
    passLane(layer, o = {}) {
      const win = o.window || 800, names = o.names || ['1', '2', '3', '4'];
      const sh = mgShell(layer, o.title || 'FIND THE OPEN MAN', 'Tap the glowing teammate (or press 1–4). Don\'t throw into coverage!', 'mg-pass');
      sh.body.innerHTML = `<div class="pl-court">${[0, 1, 2, 3].map(i => `<button class="pl-mate" data-i="${i}" style="left:${[14, 80, 22, 72][i]}%;top:${[30, 30, 72, 72][i]}%"><b>${i + 1}</b><span>${names[i] || ''}</span></button>`).join('')}<div class="pl-you">YOU</div></div><div class="timer"><i></i></div>`;
      const mates = [...sh.body.querySelectorAll('.pl-mate')], bar = sh.body.querySelector('.timer i');
      return new Promise(res => {
        let open = -1, openAt = 0, done = false, t0 = performance.now(); const total = 4200;
        const setOpen = () => { mates.forEach(m => m.classList.remove('open')); let n; do { n = Math.floor(Math.random() * 4); } while (n === open); open = n; openAt = performance.now(); mates[n].classList.add('open'); SFX.play('tick'); };
        const fin = async (ok, q, msg) => { if (done) return; done = true; offK(); SFX.play(ok ? 'pass' : 'bad'); await sh.close(msg, ok); res({ success: ok, quality: q }); };
        const choose = i => { if (done) return; if (i === open) fin(true, clamp(1 - (performance.now() - openAt) / win, .3, 1), 'DIME!'); else fin(false, 0, 'INTERCEPTED'); };
        mates.forEach(m => m.addEventListener('pointerdown', e => { e.preventDefault(); choose(+m.dataset.i); }));
        const kd = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) choose(n - 1); }; window.addEventListener('keydown', kd); const offK = () => window.removeEventListener('keydown', kd);
        setTimeout(() => !done && setOpen(), rnd(400, 900));
        const step = now => {
          if (done) return; const t = now - t0; bar.style.width = clamp(1 - t / total, 0, 1) * 100 + '%';
          if (t > total) return fin(false, 0, 'SHOT CLOCK!');
          if (open >= 0 && now - openAt > win) { mates[open].classList.remove('open'); mates[open].classList.add('covered'); setTimeout(() => mates.forEach(m => m.classList.remove('covered')), 300); open = -1; setTimeout(() => !done && setOpen(), rnd(250, 600)); }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },

    /* 8. STRENGTH PUSH (post-ups) — mash to back your defender down into the green zone */
    strengthPush(layer, o = {}) {
      const mine = o.mine || 50, theirs = o.theirs || 50, dur = 2600;
      const sh = mgShell(layer, o.title || 'BACK HIM DOWN', 'Tap / click / SPACE as fast as you can — or hammer the PUSH button', 'mg-push');
      sh.body.innerHTML = `<div class="push-track"><div class="push-zone">RIM</div><div class="push-mark">YOU</div></div><div class="timer"><i></i></div><button class="push-btn">PUSH</button><div class="mg-sub">Strength ${mine} vs ${theirs}</div>`;
      const mark = sh.body.querySelector('.push-mark'), bar = sh.body.querySelector('.timer i');
      return new Promise(res => {
        let pos = .1, done = false, t0 = performance.now(), last = t0;
        const push = () => { if (done) return; pos = Math.min(1, pos + .05 + Balance.eff(mine) / 99 * .035); SFX.play('bounce'); };
        const off = onTap(sh.el, push);
        const step = now => {
          if (done) return; const dt = (now - last) / 1000; last = now;
          pos = Math.max(0, pos - dt * (.14 + Balance.eff(theirs) / 99 * .22));
          mark.style.left = pos * 86 + '%'; bar.style.width = clamp(1 - (now - t0) / dur, 0, 1) * 100 + '%';
          if (now - t0 >= dur) { done = true; off(); const q = clamp(pos / .85, 0, 1); SFX.play(q >= .8 ? 'good' : 'bad'); sh.close(q >= .8 ? 'DEEP POSITION' : q >= .5 ? 'DECENT SPOT' : 'PUSHED OUT', q >= .5).then(() => res({ quality: q })); return; }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },
  };

  /* =================================================================
     MATCH FLOW
     cfg: { title, sub, level, us:{name,abbr,colors,logo,roster}, them:{..., star},
            oppRating, mateRating, moments, importance(1-3), venue:'home'|'away' }

     Moments:
       off_poss  — you get the ball, CHOOSE an option, then PLAY its minigame
       def_poss  — choose a defensive approach, then play the defense minigame
       quick_off / quick_def — fast decision-only moments (keeps the pace up)
       rebound, free_throws
     Every % comes from Balance.pct() (js/balance.js); minigame quality then
     moves the result with Balance.apply().
     ================================================================= */
  const LEVELS = {
    street: { periods: 2, periodMin: 10, pts: 38, label: 'H', shot: 20, bg: .25, xp: 60 },
    hs:     { periods: 4, periodMin: 8,  pts: 58, label: 'Q', shot: 30, bg: .5, xp: 80 },
    pro:    { periods: 4, periodMin: 12, pts: 108, label: 'Q', shot: 24, bg: 1, xp: 150 },
  };
  /* Names keep their capitalization; every sentence starts with a capital letter. */
  const properName = n => String(n || '').replace(/(^|[\s\-'’.])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const sentence = t => String(t).replace(/^((?:\s|<[^>]+>|[^\w<])*)([a-z])/, (m, a, b) => a + b.toUpperCase());
  const escH = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function play(cfg) {
    const s = Game.state, D = DIFFICULTY[s.difficulty];
    /* cfg.target = "first to N" pickup game (normal mode); cfg.size = players per side (3 = 3v3, 1 = 1v1) */
    const L = cfg.target ? Object.assign({}, LEVELS[cfg.level] || LEVELS.street, { pts: cfg.target * 1.7, bg: 0 }) : (LEVELS[cfg.level] || LEVELS.street);
    const size = Math.max(1, Math.min(5, cfg.size || 5));
    const n = cfg.moments || 9, oppR = cfg.oppRating || 45, diffShift = BALANCE.defense[s.difficulty] || 0;
    const myOvr = Engine.ovr(s), usR = cfg.usRating || Math.round(myOvr * .45 + (cfg.mateRating || 42) * .55);
    const star = (cfg.them && cfg.them.star) || { name: (cfg.them.roster || ['Their best'])[0], perD: oppR, intD: oppR };
    const C = STORY.commentary, ME = Balance.userStats(s), myName = properName(s.player.last);
    const DEF = Balance.profile(oppR, { perD: star.perD || oppR, intD: star.intD || oppR });   // your defender
    const THEM = Balance.profile(oppR + 2);                                                     // their scorer
    const MATE = Balance.profile(cfg.mateRating || 45);                                         // your teammates
    const st = {
      us: 0, them: 0, i: 0, box: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, to: 0 },
      succ: 0, att: 0, streak: 0, fire: false, sig: 0, sigUsed: false, sigUses: 0, mirror: 0, zone: false, postponed: false, fatigue: s.meta.fatigue * .4, clutchN: 0, clutchW: 0, perfects: 0, highlights: [],
      counters: {}, gameWinner: false, lastType: '', posterizers: 0, clutch: false, last: false, fb: 0,
    };
    const cnt = (k, v = 1) => st.counters[k] = (st.counters[k] || 0) + v;

    /* ---------- DOM ---------- */
    const logoUs = Art.logo(cfg.us, 40), logoThem = Art.logo(cfg.them, 40);
    UI.showScreen(`
      <div class="match">
        <div class="scorebug" id="sb">
          <div class="sb-team us" style="--tc:${cfg.us.colors[0]}">${logoUs}<span class="sb-abbr">${cfg.us.abbr}</span><span class="sb-score" id="sbUs">0</span></div>
          <div class="sb-mid"><div class="sb-per" id="sbPer">${L.label}1</div><div class="sb-clock" id="sbClock">${L.periodMin}:00</div><div class="sb-shot" id="sbShot">${L.shot}</div></div>
          <div class="sb-team them" style="--tc:${cfg.them.colors[0]}"><span class="sb-score" id="sbThem">0</span><span class="sb-abbr">${cfg.them.abbr}</span>${logoThem}</div>
          <div class="sb-flag" id="sbFlag"></div>
        </div>
        <div class="match-title"><b>${escH(cfg.title || 'Game')}</b>${cfg.sub ? ' · ' + escH(cfg.sub) : ''}<span class="mom-count" id="momCount"></span></div>
        <div class="match-main">
          <div class="court-wrap" id="courtWrap"><canvas id="court"></canvas><div class="vignette" id="vig"></div><div class="court-banner" id="banner"></div><div class="mg-layer" id="mg"></div></div>
          <aside class="pbp glass">
            <div class="statline" id="statline"></div>
            <div class="meters"><div class="mini-meter"><span>WEAPON</span><div class="bar sig"><i id="sigBar"></i></div></div><div class="mini-meter"><span>FATIGUE</span><div class="bar fat"><i id="fatBar"></i></div></div></div>
            <div class="pbp-head">PLAY-BY-PLAY</div><ol class="pbp-list" id="pbp"></ol>
          </aside>
        </div>
        <div class="moment-panel glass" id="panel"></div>
      </div>`, 'match');
    SFX.music('game'); UI.setBg('matchbg', cfg.us.abbr);
    const $ = id => document.getElementById(id);
    const court = new Court($('court'), cfg.us, cfg.them, cfg.venueId && VENUES[cfg.venueId] ? cfg.venueId : Venues.forMatch(cfg));

    /* ---------- roster sprites ---------- */
    const lk = Engine.look(s), myIdx = ['PG', 'SG', 'SF', 'PF', 'C'].indexOf(s.player.pos);
    const OFF = [[0, 29], [16, 21], [-16, 21], [-20, 6], [6, 9]];
    const mateNames = size > 1 ? (cfg.us.roster || []).slice(0, 4) : [];
    const themNames = (cfg.them.roster || []).slice(0, 5);
    // same look per name as in arcade play (Art.lookFromSeed(name)), so switching views is seamless
    const mk = (team, name, i) => { const seed = Art.lookFromSeed(name || (team === 'us' ? cfg.us.abbr : cfg.them.abbr) + i); return { team, name, look: seed, skin: seed.skin, hair: seed.hairColor, num: seed.num, headband: seed.headband }; };
    let mi = 0;
    const usP = [0, 1, 2, 3, 4].map(i => i === myIdx ? Object.assign(mk('us', 'You', i), { isUser: true, look: lk, skin: lk.skin, hair: lk.hairColor, num: s.player.num, headband: lk.headband }) : Object.assign(mk('us', mateNames[mi++] || 'Teammate ' + i, i), { tag: '' }));
    const themP = [0, 1, 2, 3, 4].map(i => mk('them', themNames[i] || 'Defender ' + i, i));
    const starIdx = Math.max(0, themNames.indexOf(star.name)); themP[starIdx].tag = star.name.split(' ').slice(-1)[0];
    court.setPlayers([...usP, ...themP]);
    const U = court.players[myIdx], STAR = court.players.slice(5)[starIdx];
    let US = court.players.slice(0, 5), TH = court.players.slice(5);
    if (size < 5) {   // small-sided pickup: you + teammates vs their star + crew
      US = [U].concat(US.filter(p => p !== U).slice(0, size - 1)); TH = [STAR].concat(TH.filter(p => p !== STAR).slice(0, size - 1));
      court.players.forEach(p => { p.hidden = !US.includes(p) && !TH.includes(p); });
    }
    const MATES = () => US.filter(p => !p.isUser);

    function formation(off, userSpot) {
      const offT = off === 'us' ? US : TH, defT = off === 'us' ? TH : US;
      offT.forEach((p, i) => { p.x = OFF[i][0] + rnd(-1, 1); p.y = OFF[i][1] + rnd(-1, 1); p.z = 0; p.pose = ''; });
      if (off === 'us' && userSpot) { const sw = US.find(p => !p.isUser && Math.hypot(p.x - userSpot[0], p.y - userSpot[1]) < 7); if (sw) { sw.x = U.x; sw.y = U.y; } U.x = userSpot[0]; U.y = userSpot[1]; }
      // matchups: you and their star guard each other, everyone else pairs up in order
      const oRest = offT.filter(p => p !== U && p !== STAR), dRest = defT.filter(p => p !== U && p !== STAR);
      [[off === 'us' ? STAR : U, off === 'us' ? U : STAR]].concat(dRest.map((d, i) => [d, oRest[i] || offT[0]]))
        .forEach(([d, m]) => { d.x = lerp(m.x, HOOP.x, .2); d.y = lerp(m.y, HOOP.y, .2); d.pose = 'def'; d.z = 0; });
      court.ball.dribble = true;
    }
    /* Free throw line-up: shooter at the line, everyone else on the lane blocks */
    function ftLineup() {
      U.x = 0; U.y = 19; U.z = 0; U.pose = ''; court.ball.holder = U; court.ball.dribble = false;
      const others = US.concat(TH).filter(p => !p.isUser), slots = [[-8.6, 7], [8.6, 7], [-8.6, 10.5], [8.6, 10.5], [-8.6, 14], [8.6, 14]];
      others.forEach((p, i) => { const sl = slots[i]; if (sl) { p.x = sl[0]; p.y = sl[1]; } else { p.x = (i % 2 ? 1 : -1) * 12; p.y = 30; } p.pose = ''; p.z = 0; });
    }

    /* ---------- UI helpers ---------- */
    const pbp = (txt, cls = '') => { const li = document.createElement('li'); li.className = cls; li.innerHTML = `<time>${clockStr()}</time>${sentence(txt)}`; $('pbp').prepend(li); };
    const banner = async (txt, cls = '', ms = 1300) => { const el = $('banner'); el.className = 'court-banner show ' + cls; el.innerHTML = txt; await sleep(ms); el.className = 'court-banner'; };
    const say = (key, extra = {}) => {
      const pool = C[key] || [key];
      const v = Object.assign({ me: myName, first: properName(s.player.first), def: properName(star.name.split(' ').slice(-1)[0]), mate: pick(mateNames.length ? mateNames : ['a teammate']), them: cfg.them.name, us: cfg.us.name }, extra);
      return sentence(pick(pool).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m));
    };
    function clockFor(i) { const f = (i + 1) / (n + 1) + .015, tot = L.periods * L.periodMin * 60, el = f * tot, per = Math.min(L.periods, Math.floor(el / (L.periodMin * 60)) + 1), rem = per * L.periodMin * 60 - el; return { per, rem }; }
    let clk = { per: 1, rem: L.periodMin * 60 };
    function clockStr() { const m = Math.floor(clk.rem / 60), sec = Math.floor(clk.rem % 60); return `${L.label}${clk.per} ${m}:${String(sec).padStart(2, '0')}`; }
    function updBug() {
      $('sbUs').textContent = st.us; $('sbThem').textContent = st.them;
      $('sbPer').textContent = clk.per > L.periods ? 'OT' : L.label + clk.per;
      const m = Math.floor(clk.rem / 60), sec = Math.floor(clk.rem % 60); $('sbClock').textContent = clk.rem < 60 ? clk.rem.toFixed(1) : `${m}:${String(sec).padStart(2, '0')}`;
      const b = st.box; $('statline').innerHTML = `<div class="sl-name">${escH(properName(s.player.first)[0])}. ${escH(myName)} <em>#${s.player.num}</em></div><div class="sl-grid">${[['PTS', b.pts], ['REB', b.reb], ['AST', b.ast], ['STL', b.stl], ['BLK', b.blk], ['FG', b.fgm + '/' + b.fga], ['3P', b.tpm + '/' + b.tpa], ['FT', b.ftm + '/' + b.fta]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>`;
      $('sigBar').style.width = (st.sigUsed ? 0 : Math.min(1, st.sig / WPN.charge) * 100) + '%'; $('sigBar').parentElement.classList.toggle('ready', sigReady());
      $('fatBar').style.width = Math.min(100, st.fatigue) + '%';
      $('sbFlag').innerHTML = st.fire ? '<span class="fire-tag">🔥 ON FIRE</span>' : st.zone ? '<span class="fire-tag zone">⚡ THE ZONE</span>' : '';
      $('sb').classList.toggle('fire', st.fire);
    }
    /* pickups ("first to N"): nobody reaches the target before the final whistle */
    const capTarget = () => { if (cfg.target) { st.us = Math.min(st.us, cfg.target - 1); st.them = Math.min(st.them, cfg.target - 1); } };
    function addPts(side, p) {
      if (!p) return;
      if (side === 'us') st.us += p; else st.them += p;
      capTarget();
      updBug(); const el = $(side === 'us' ? 'sbUs' : 'sbThem'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
    function success(big) {
      st.succ++; st.att++; st.streak++; if (!st.sigUsed) st.sig++;
      if (st.streak >= 3 && !st.fire) { st.fire = true; court.fire = true; pbp(`🔥 <b>${myName} is ON FIRE!</b>`, 'hot'); banner('🔥 ON FIRE', 'fire'); SFX.play('roar'); }
      court.excite = Math.min(1, court.excite + (big ? .5 : .25)); updBug();
    }
    function fail() { st.att++; st.streak = 0; if (st.fire) { st.fire = false; court.fire = false; pbp('The fire cools off.', 'cold'); } court.excite = Math.max(.2, court.excite - .1); updBug(); }
    const tire = () => { st.fatigue = Math.min(100, st.fatigue + (100 - Engine.attr(s, 'stam')) / 14 + 1.5); };
    const roll = p => Math.random() * 100 < p;

    /* ---------- the % for an action (see js/balance.js) ---------- */
    const WPN = Engine.weaponOf(s), APE = Engine.ape(s);
    const sigReady = () => st.sig >= WPN.charge && !st.sigUsed;
    const MGX = k => Engine.passiveMg(s, k) * (st.zone ? 1.3 : 1);
    const WIN = () => D.window;
    const KEYMAP = { catch3: 'three', pull3: 'three', catchMid: 'mid', pullMid: 'mid', fade: 'mid', layup: 'finish', dunk: 'dunk', hook: 'str', pass: 'pass', steal: 'steal', block: 'intD', stop: 'perD', contest: 'perD', charge: 'iq', rebound: 'reb', ft: 'ft' };
    function bonuses(action) {
      const key = KEYMAP[action], out = [], arch = Engine.archOf(s), m = arch.passive.mods || {};
      const pv = (m[key] || 0) + (m.all || 0); if (pv) out.push({ label: arch.passive.name, v: pv });
      if ((action === 'catch3' || action === 'pull3') && st.clutch && m.clutch3) out.push({ label: arch.passive.name + ' (clutch)', v: m.clutch3 });
      const bb = Engine.badgeBonus(s, key); if (bb) out.push({ label: 'Badges', v: bb });
      if (Engine.hasSpecial(s, 'misdirection') && st.i < 3 && action !== 'ft') out.push({ label: 'Misdirection', v: 12 });
      if (Engine.hasSpecial(s, 'mirror') && st.mirror && ['three', 'mid', 'finish', 'dunk', 'str', 'pass'].includes(key)) out.push({ label: 'Perfect Copy', v: st.mirror });
      if (st.zone) out.push({ label: 'The Zone', v: 12 });
      const wsv = ({ intD: .6, steal: .4, perD: .4, str: .3, dunk: .3, reb: .4 }[key] || 0) * APE; if (Math.abs(wsv) >= .5) out.push({ label: 'Wingspan', v: Math.round(wsv) });
      return out;
    }
    const calc = (action, x = {}) => Balance.pct(action, ME, Object.assign({ def: DEF, diff: s.difficulty, fatigue: st.fatigue, morale: s.meta.morale, venue: cfg.venue || 'home', clutch: st.clutch, fire: st.fire, bonus: bonuses(action) }, x));
    /* their shot vs your defense (difficulty makes them better shooters) */
    const theirPct = (action, contest, by = THEM) => Balance.pct(action, by, { def: ME, contest, bonus: diffShift ? [{ label: 'Difficulty', v: Math.round(diffShift * .6) }] : [] }).pct;
    /* minigame quality helpers */
    const meterQ = r => r.perfect ? 1 : r.good ? .62 + r.quality * .28 : r.quality * .45;
    const green = stat => (.06 + Balance.eff(stat) / 99 * .14) * WIN();

    /* ---------- decision panel (options show % + breakdown on hover / long-press) ---------- */
    function choose(setupHtml, options) {
      return new Promise(res => {
        const p = $('panel');
        p.innerHTML = `<div class="mp-setup">${setupHtml}</div><div class="mp-opts">${options.map((o, i) => {
          const pc = o.pct != null ? `<span class="pct ${o.pct >= 55 ? 'hi' : o.pct >= 38 ? 'mid' : 'lo'}">${o.pct}%</span>` : `<span class="pct mg">🕹</span>`;
          const tip = o.parts && o.parts.length ? `<span class="opt-tip">${escH(Balance.describe(o.parts))}</span>` : '';
          return `<button class="opt ${o.cls || ''}" data-i="${i}"><kbd>${i + 1}</kbd><span class="opt-l">${o.label}<small>${o.desc || ''}${o.mg ? ` <i class="opt-mg">🎮 ${o.mg}</i>` : ''}</small></span>${pc}${tip}</button>`;
        }).join('')}</div><div class="mp-hint">Hover or long-press an option to see what affects its %.</div>`;
        p.classList.add('show'); p.classList.remove('busy');
        let long = false, timer = null;
        const go = i => { if (!options[i]) return; window.removeEventListener('keydown', kd); p.classList.remove('show'); SFX.play('click'); res(options[i]); };
        const kd = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= options.length) go(k - 1); };
        window.addEventListener('keydown', kd);
        p.querySelectorAll('.opt').forEach(b => {
          b.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; long = false; timer = setTimeout(() => { long = true; p.querySelectorAll('.opt').forEach(x => x.classList.remove('tipon')); b.classList.add('tipon'); }, 450); });
          b.addEventListener('pointerup', () => clearTimeout(timer)); b.addEventListener('pointerleave', () => clearTimeout(timer));
          b.addEventListener('click', () => { if (long) { long = false; return; } go(+b.dataset.i); });
        });
      });
    }
    /* Keeps the situation text readable while a minigame plays */
    function busy(setupHtml, now) { const p = $('panel'); p.innerHTML = `<div class="mp-setup">${setupHtml}</div><div class="mp-now">${now || 'Get ready…'}</div>`; p.classList.add('show', 'busy'); }
    async function showSetup(html, ms = 900) { busy(html); await sleep(ms); }
    const idle = () => { const p = $('panel'); p.classList.remove('show', 'busy'); p.innerHTML = '<div class="mp-idle">Play continues…</div>'; };

    /* ---------- outcome helpers (animate + score + stats) ---------- */
    async function myShot(kind, made, o = {}) {
      const pts = kind === 'three' ? 3 : 2;
      st.box.fga++; if (kind === 'three') st.box.tpa++;
      if (kind === 'dunk') made = await court.dunk(U, made, o.poster);
      else if (kind === 'layup' || kind === 'drive' || kind === 'hook') made = await court.layup(U, made);
      else made = await court.shoot(U, made ? (o.perfect || Math.random() < .55 ? 'swish' : 'rimin') : (Math.random() < .08 ? 'airball' : 'miss'), { slowmo: o.slowmo });
      if (made) {
        st.box.fgm++; st.box.pts += pts; if (kind === 'three') { st.box.tpm++; cnt('threes'); } else if (kind === 'mid' || kind === 'fade') cnt('mids'); else if (kind === 'dunk') { cnt('dunks'); if (o.poster) { cnt('posterizers'); st.posterizers++; } } else cnt('layups');
        if (kind === 'hook' || kind === 'fade') cnt('posts');
        addPts('us', pts); court.pop(kind === 'dunk' ? (o.poster ? 'POSTERIZED!' : 'SLAM!') : '+' + pts, U.x, U.y, 9, kind === 'three' ? '#38bdf8' : '#facc15', o.poster ? 46 : 36);
        SFX.play('crowd', 1 + (st.clutch ? .8 : 0));
        if (st.clutch) { cnt('clutchMakes'); st.clutchW++; }
      } else SFX.play('groan');
      return made;
    }
    async function theyShoot(action, contest, by = STAR) {
      const p = theirPct(action, contest), made = roll(p), pts = BALANCE.actions[action].three ? 3 : 2;
      court.ball.holder = by;
      if (action === 'layup' || action === 'dunk') { await court.drive(by, rnd(-2, 2), 8, .4); }
      await court.shoot(by, made ? 'swish' : 'miss', { arc: action === 'layup' ? 3 : undefined });
      if (made) { addPts('them', pts); court.pop('+' + pts, by.x, by.y, 9, '#f87171', 30); }
      return made;
    }
    async function boardAfterMiss(offensive) { // quick rebound roll (no minigame) — or a live put-back scramble
      if (offensive && natOk() && Math.random() < SGC.chance.putback / (1 + (st.segKinds.putback || 0)) * (st.seg >= segTarget ? .3 : 1)) { await arcadeSegment('putback', { sub: 'BATTLE FOR THE BOARD' }); return false; }
      const p = calc('rebound', { def: Balance.profile(oppR) }).pct * (offensive ? .45 : 1.15);
      if (roll(p)) { st.box.reb++; cnt('rebounds'); court.ball.holder = U; pbp(say(offensive ? 'oreb' : 'dreb')); updBug(); if (!offensive) await maybeFastBreak('dreb', 'me'); return true; }
      if (!offensive && MATES().length) await maybeFastBreak('dreb', 'mate', SGC.chance.mateDreb);   // a teammate grabbed it and pushes
      return false;
    }

    /* =================================================================
       OFFENSIVE POSSESSION — choose, then play
       ================================================================= */
    const SPOTS = { wing: [16, 21], top: [0, 29], corner: [-21, 6], elbow: [-8, 17], post: [6, 8.5], break: [4, 40] };
    const SIT_TEXT = {
      wing: ['You catch it on the wing, {def} closing out hard.', 'Swing pass — the ball finds you on the wing.'],
      top: ['You bring it up top. {def} is sitting in a stance, daring you.', 'Top of the key, ball in your hands, {sc} on the clock.'],
      corner: ['Drive-and-kick — you\'re spotted up in the corner.', 'The defense collapses and you drift to the corner.'],
      elbow: ['You flash to the elbow and catch it facing the rim.'],
      post: ['You seal {def} deep on the block. Entry pass is in.', 'Back to the basket, low post, {def} on your hip.'],
      break: ['Long rebound — you\'re out in transition with one man back!', 'Steal at half court! You\'re running the break!'],
    };
    function pickSit() {
      const big = ['PF', 'C'].includes(s.player.pos) || ['ironheart', 'bruiser', 'titan'].includes(s.player.arch);
      const w = big ? { post: 5, elbow: 2, wing: 1, top: 1, corner: 1 } : { wing: 3, top: 3, corner: 2, elbow: 1, post: s.player.pos === 'SF' ? 1 : 0 };
      if (['sniper', 'barrier'].includes(s.player.arch)) w.corner += 1;
      const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = Math.random() * tot;
      for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'wing';
    }
    function offOptions(sit, clutchCtx) {
      const three = ['wing', 'top', 'corner'].includes(sit), o = [];
      const contest = sit === 'break' || sit === 'corner' ? 'open' : 'normal';
      const clock = clutchCtx || Math.random() < .2 ? { shotClock: !clutchCtx } : {};
      const add = (k, label, desc, action, mg, extra = {}) => {
        if (!Balance.available(action, ME)) return;
        const c = calc(action, Object.assign({}, clock, extra)); o.push({ k, label, desc, action, pct: c.pct, parts: c.parts, mg, extra });
      };
      if (sit !== 'post') add('catch', three ? 'Catch & shoot three' : 'Catch & shoot', 'Feet set, let it fly', three ? 'catch3' : 'catchMid', 'Shot meter', { contest });
      if (sit !== 'post' && sit !== 'corner') add('pull', three ? 'Pull-up three' : 'Pull-up jumper', 'Shake him, rise up', three ? 'pull3' : 'pullMid', 'Dribble move → shot meter', { contest: 'normal' });
      if (sit !== 'post') add('layup', 'Drive & finish', 'Beat your man to the rim', 'layup', 'Combo → layup timing', sit === 'break' ? { contest: 'open' } : {});
      if (sit !== 'post') add('dunk', 'Drive & throw it down', 'Attack and rise', 'dunk', 'Combo → dunk timing', sit === 'break' ? { contest: 'open' } : {});
      if (sit === 'post' || sit === 'elbow') { add('hook', 'Post up → hook', 'Back him down, hook it over the top', 'hook', 'Strength push → hook timing'); add('fade', 'Post up → fadeaway', 'Back him down, turn and fade', 'fade', 'Strength push → shot meter'); }
      const pc = calc('pass', clock), mate = Balance.pct('catchMid', MATE, { def: DEF, diff: s.difficulty, contest: 'open' });
      if (MATES().length) o.push({ k: 'pass', label: 'Find the open man', desc: 'Pass, then your teammate shoots', action: 'pass', pct: Math.round(pc.pct * mate.pct / 100), parts: pc.parts.concat([{ label: `Teammate's open shot ${mate.pct}%`, v: null }]), mg: 'Passing lane', passPct: pc.pct, matePct: mate.pct });
      if (sigReady()) o.push(weaponOpt());
      return o;
    }
    async function offPossession(clutchCtx) {
      const sit = clutchCtx ? (s.player.pos === 'C' ? 'post' : 'top') : pickSit();
      formation('us', SPOTS[sit]); court.ball.holder = U;
      const shot = clutchCtx ? Math.ceil(clk.rem) : Math.floor(rnd(4, 18)); $('sbShot').textContent = shot;
      const text = clutchCtx ? clutchCtx.text : Engine.pick(SIT_TEXT[sit]).replace('{def}', properName(star.name.split(' ').slice(-1)[0])).replace('{sc}', shot);
      const opts = offOptions(sit, clutchCtx);
      const ch = await choose(`<b>${escH(text)}</b>`, opts);
      return runOffense(ch, text, sit);
    }
    async function runOffense(o, text, sit) {
      tire();
      const setup = `<b>${escH(text)}</b>`;
      if (o.k === 'sig') return weapon(setup);
      if (o.k === 'pass') return passPlay(o, setup);
      let q = .5, kind, poster = false, perfect = false;
      if (o.k === 'catch') {
        const mateWithBall = MATES().length ? pick(MATES()) : STAR; court.ball.holder = mateWithBall; await court.pass(mateWithBall, U);
        busy(setup, `🎮 ${o.label}`);
        const stat = o.action === 'catch3' ? ME.three : ME.mid;
        const r = await MG.shotMeter($('mg'), { title: o.label.toUpperCase(), green: green(stat) * MGX('green') + (st.fire ? .03 : 0), dur: st.clutch ? .9 : 1.05, sub: `${o.action === 'catch3' ? 'Three-Point' : 'Mid-Range'} ${stat} · base ${o.pct}%` });
        q = meterQ(r); perfect = r.perfect; if (perfect) { cnt('perfects'); st.perfects++; }
        kind = o.action === 'catch3' ? 'three' : 'mid';
      } else if (o.k === 'pull') {
        busy(setup, `🎮 Dribble move`);
        const r1 = await MG.dribbleCombo($('mg'), { title: 'CREATE SPACE', len: 3, time: (.7 + ME.handle / 99 * .6) * WIN() * MGX('comboTime') });
        if (r1.quality >= (Engine.hasSpecial(s, 'ankles') ? .6 : 1)) { cnt('crosses'); court.pop('ANKLES!', STAR.x, STAR.y, 7, '#f472b6', 30); pbp(say('ankles'), 'good'); }
        busy(setup, `🎮 Rise up`);
        const stat = o.action === 'pull3' ? ME.three : ME.mid;
        const r2 = await MG.shotMeter($('mg'), { title: o.label.toUpperCase(), green: green(stat) * MGX('green'), dur: .95, sub: `${o.action === 'pull3' ? 'Three-Point' : 'Mid-Range'} ${stat} · Handles ${ME.handle}` });
        q = r1.quality * .35 + meterQ(r2) * .65; perfect = r2.perfect; kind = o.action === 'pull3' ? 'three' : 'mid';
      } else if (o.k === 'layup' || o.k === 'dunk') {
        busy(setup, `🎮 Beat your man`);
        const r1 = await MG.dribbleCombo($('mg'), { title: 'BEAT YOUR MAN', len: 4, time: (.7 + ME.handle / 99 * .6) * WIN() * MGX('comboTime') });
        if (r1.quality >= (Engine.hasSpecial(s, 'ankles') ? .6 : 1)) { cnt('crosses'); pbp(say('ankles'), 'good'); }
        busy(setup, o.k === 'dunk' ? '🎮 Throw it down' : '🎮 Finish');
        let r2q;
        if (o.k === 'dunk') { const r2 = await MG.dunkChain($('mg'), { title: 'DUNK TIMING', tol: (6 + ME.dunk / 99 * 9 + ME.vert / 99 * 4) * WIN() * MGX('dunkTol'), speed: 90 + (st.clutch ? 20 : 0) }); r2q = r2.quality; poster = r2.hits === r2.total && roll(30 + ME.dunk * .4); }
        else { const r2 = await MG.dunkChain($('mg'), { title: 'LAYUP', rings: 1, labels: ['RELEASE'], tol: (7 + ME.finish / 99 * 9) * WIN(), speed: 85 }); r2q = r2.quality; }
        q = r1.quality * .5 + r2q * .5; kind = o.k;
        cnt('fastbreaks', sit === 'break' ? 1 : 0);
      } else if (o.k === 'hook' || o.k === 'fade') {
        court.ball.dribble = false; busy(setup, '🎮 Back him down');
        const r1 = await MG.strengthPush($('mg'), { title: 'BACK HIM DOWN', mine: ME.str, theirs: DEF.str + diffShift });
        busy(setup, o.k === 'hook' ? '🎮 Hook shot' : '🎮 Fadeaway');
        let r2q;
        if (o.k === 'hook') { const r2 = await MG.dunkChain($('mg'), { title: 'HOOK SHOT', rings: 1, labels: ['RELEASE'], tol: (7 + ME.finish / 99 * 9) * WIN(), speed: 80 }); r2q = r2.quality; }
        else { const r2 = await MG.shotMeter($('mg'), { title: 'FADEAWAY', green: green(ME.mid) * MGX('green'), dur: 1, sub: `Mid-Range ${ME.mid}` }); r2q = meterQ(r2); }
        q = r1.quality * .4 + r2q * .6; kind = o.k;
      }
      idle();
      let fin = Balance.apply(o.action, o.pct, q), made = roll(fin);
      if (!made && (o.k === 'hook' || o.k === 'fade') && Engine.hasSpecial(s, 'postpone') && !st.postponed) { st.postponed = true; pbp('⏳ <b>Right of Postponement</b>: you hang in the air and wait out the block…', 'hot'); made = roll(Math.min(95, fin + 10)); }
      made = await myShot(kind === 'dunk' ? 'dunk' : kind === 'layup' ? 'layup' : kind === 'hook' ? 'hook' : kind, made, { poster, perfect, slowmo: st.clutch && st.last });
      const key = { three: 'three', mid: 'mid', layup: 'drive', dunk: 'dunk', hook: 'post', fade: 'mid' }[kind];
      pbp(say(key === 'dunk' ? (made ? (poster ? 'poster' : 'dunk') : 'dunk_miss') : key + (made ? '_make' : '_miss')) + ` <i class="pct-note">${fin}%</i>`, made ? 'good' : '');
      if (poster && made) st.highlights.push(`Posterized ${star.name}`);
      if (made) success(kind === 'dunk' || perfect); else fail();
      if (!made && (kind === 'layup' || kind === 'dunk') && roll(30)) { SFX.play('whistle'); pbp(say('fouled')); await T.free_throws({ shots: 2 }); return made; }
      if (made && (kind === 'layup' || kind === 'hook') && roll(10 + ME.str * .12)) { SFX.play('whistle'); pbp(say('and1'), 'good'); await T.free_throws({ shots: 1 }); }
      if (!made) await boardAfterMiss(true);
      return made;
    }
    async function passPlay(o, setup) {
      busy(setup, '🎮 Find the open man');
      const mates = MATES();
      const r = await MG.passLane($('mg'), { window: (450 + (ME.pass * .5 + ME.iq * .5) / 99 * 700) * WIN() * MGX('passWindow'), names: mates.map(m => (m.name || '').split(' ').slice(-1)[0]) });
      idle();
      const complete = r.success && roll(Balance.apply('pass', o.passPct, r.quality));
      if (!complete) { if (!r.success || roll(50)) { st.box.to++; court.ball.holder = STAR; await court.moveTo(STAR, 0, 40, .6); pbp(say('turnover'), 'bad'); } else pbp('The pass is deflected out of bounds. Reset.'); fail(); return false; }
      const mate = pick(mates); await court.pass(U, mate);
      const made = roll(Balance.apply('catchMid', o.matePct, .5 + r.quality * .2));
      await court.shoot(mate, made ? 'swish' : 'miss');
      if (made) { st.box.ast++; cnt('assists'); addPts('us', mate.x * mate.x > 300 ? 3 : 2); court.pop('+AST', U.x, U.y, 9, '#a78bfa'); pbp(say('assist', { mate: mate.name }), 'good'); success(); }
      else { pbp(say('mate_miss', { mate: mate.name })); st.att++; await boardAfterMiss(true); }
      return made;
    }

    /* =================================================================
       DEFENSIVE POSSESSION — choose an approach, then play it
       ================================================================= */
    async function defPossession(clutchCtx) {
      formation('them'); court.ball.holder = STAR; STAR.x = 4; STAR.y = 26; U.x = 3.6; U.y = 23; U.pose = 'def';
      const sit = clutchCtx ? 'iso' : pick(['iso', 'iso', 'drive', 'shooter']);
      const sName = properName(star.name.split(' ').slice(-1)[0]);
      const text = clutchCtx ? clutchCtx.text : { iso: `${sName} isolates on you at the top of the key.`, drive: `${sName} turns the corner and attacks the paint.`, shooter: `${sName} comes off a screen looking for his shot.` }[sit];
      const o = [];
      const add = (k, label, desc, action, mg, x = {}) => { const c = calc(action, Object.assign({ def: Balance.profile(oppR + 2) }, x)); o.push({ k, label, desc, action, pct: c.pct, parts: c.parts, mg }); };
      add('press', 'Press up', 'Crowd him. Steal chance if you read it.', 'stop', 'Mirror the move (fast)', { bonus: bonuses('stop').concat([{ label: 'Pressure (riskier)', v: -6 }]) });
      add('back', 'Stay back & contain', 'Give space, take away the drive', 'stop', 'Mirror the move', { bonus: bonuses('stop').concat([{ label: 'Cushion', v: 8 }]) });
      add('steal', 'Go for the steal', 'Big reward, big risk', 'steal', 'Quick-hands reaction');
      if (sit !== 'shooter') add('help', 'Help & block', 'Meet him at the rim', 'block', 'Block timing');
      if (sit !== 'drive') add('contest', 'Contest the shot', 'Hand in his face', 'contest', 'Contest timing');
      const ch = await choose(`<b>${escH(text)}</b>`, o);
      tire();
      const setup = `<b>${escH(text)}</b>`, fin = q => Balance.apply(ch.action, ch.pct, q);
      const attackerSvg = Art.avatar(Art.lookFromSeed(star.name, { jersey: cfg.them.colors[0], trim: cfg.them.colors[1], expr: 'fierce' }), { mode: 'bust' });
      let stop = false, shotAction = null, contest = 'normal';
      if (ch.k === 'press' || ch.k === 'back' || ch.k === 'steal') {
        busy(setup, ch.k === 'steal' ? '🎮 Read it and strike' : '🎮 Mirror his move');
        const base = (330 + (ME.perD * .6 + ME.speed * .4) / 99 * 470) * WIN() * MGX('defWindow') * (ch.k === 'back' ? 1.25 : ch.k === 'steal' ? .8 : 1);
        const r = await MG.defenseReact($('mg'), { window: base, attackerSvg, title: ch.k === 'steal' ? 'GO FOR THE STEAL' : 'LOCK IN' });
        idle();
        const ok = r.success && roll(fin(r.quality));
        if (ch.k === 'steal') {
          if (ok) return stealPlay();
          pbp(`${myName} gambles and misses. Easy look for ${sName}.`, 'bad'); shotAction = 'layup'; contest = 'open';
        } else if (ok) {
          cnt('stops');
          if (ch.k === 'press' && r.quality > .65 && roll(calc('steal').pct * (Engine.hasSpecial(s, 'stealer') ? 1.6 : 1))) return stealPlay();
          shotAction = ch.k === 'press' ? 'pullMid' : pick(['pullMid', 'pull3']); contest = ch.k === 'press' ? 'heavy' : 'contested';
        } else { shotAction = 'layup'; contest = ch.k === 'press' ? 'open' : 'normal'; }
      } else if (ch.k === 'help') {
        const att = TH.length > 1 ? pick(TH.filter(p => p !== STAR)) : STAR; court.ball.holder = att; att.x = -10; att.y = 14; U.x = 3; U.y = 9;
        busy(setup, '🎮 Time the block');
        const r = await MG.rebound($('mg'), { title: 'BLOCK IT', zone: (.07 + (ME.intD * .6 + ME.vert * .4) / 99 * .14) * WIN() * (1 + APE * .02) });
        idle();
        await court.drive(att, -3, 8, .45);
        const ok = r.success && roll(fin(r.quality));
        await court.block(U, att, ok);
        if (ok) { st.box.blk++; cnt('blocks'); cnt('stops'); pbp(say('block'), 'good'); court.pop('REJECTED!', U.x, U.y, 10, '#38bdf8', 38); success(true); if (!(await maybeFastBreak('block', Math.random() < .6 ? 'me' : 'mate'))) await boardAfterMiss(false); return true; }
        addPts('them', 2); pbp(say('block_fail', { att: att.name }), 'bad'); fail(); return false;
      } else if (ch.k === 'contest') {
        busy(setup, '🎮 Contest timing');
        const r = await MG.rebound($('mg'), { title: 'CONTEST', zone: (.08 + (ME.perD * .7 + ME.vert * .3) / 99 * .14) * WIN() });
        idle();
        const ok = r.success && roll(fin(r.quality));
        shotAction = Math.random() < .5 ? 'catch3' : 'catchMid'; contest = ok ? (r.quality > .75 ? 'heavy' : 'contested') : 'open';
        if (ok) cnt('stops');
      }
      // they shoot
      U.pose = contest === 'heavy' || contest === 'contested' ? 'block' : 'def';
      const made = await theyShoot(shotAction, contest); U.pose = '';
      if (made) { pbp(say('scored_on', { def: star.name, n: BALANCE.actions[shotAction].three ? 3 : 2 }), 'bad'); fail(); return false; }
      pbp(contest === 'open' ? `${sName} misses a good look. Lucky.` : say('stop', { def: star.name }), 'good');
      stop = true; success(); await boardAfterMiss(false); return stop;
    }
    async function stealPlay() {
      await court.steal(U, STAR); st.box.stl++; cnt('steals'); cnt('stops'); pbp(say('steal'), 'good'); court.pop('STEAL!', U.x, U.y, 8, '#38bdf8'); SFX.play('crowd', 1.3);
      if (await maybeFastBreak('steal', 'me')) { success(true); return true; }
      const act = Balance.available('dunk', ME) ? 'dunk' : 'layup', p = calc(act, { contest: 'open' }).pct;
      const made = await myShot(act, roll(p)); if (made) pbp(say('breakaway'), 'good'); success(true); return true;
    }

    /* ---------- QUICK decision-only moments (pace) ---------- */
    async function quickOff() {
      formation('us', SPOTS.wing); court.ball.holder = U; const shot = Math.floor(rnd(2, 6)); $('sbShot').textContent = shot;
      const opts = [];
      const add = (k, label, action, x) => { if (!Balance.available(action, ME)) return; const c = calc(action, Object.assign({ shotClock: shot <= 3 }, x)); opts.push({ k, label, desc: 'Quick decision', action, pct: c.pct, parts: c.parts }); };
      add('three', 'Pull-up three', 'pull3', { contest: 'contested' }); add('mid', 'Step-back jumper', 'pullMid', { contest: 'contested' }); add('layup', 'Attack the rim', 'layup', {});
      const ch = await choose(`<b>${shot} on the shot clock — no time to think. ${escH(say('setup_iso'))}</b>`, opts);
      tire(); const made = await myShot(ch.k === 'three' ? 'three' : ch.k === 'mid' ? 'mid' : 'layup', roll(ch.pct));
      pbp(say((ch.k === 'layup' ? 'drive' : ch.k) + (made ? '_make' : '_miss')) + ` <i class="pct-note">${ch.pct}%</i>`, made ? 'good' : ''); made ? success() : (fail(), await boardAfterMiss(true)); return made;
    }
    async function quickDef() {
      formation('them'); const h = TH.find(p => p !== STAR) || STAR; court.ball.holder = h;
      const st1 = calc('steal'), ct = calc('contest');
      const ch = await choose(`<b>${escH(say('setup_lane'))}</b>`, [
        { k: 'steal', label: 'Jump the passing lane', desc: 'Quick decision · risky', pct: st1.pct, parts: st1.parts },
        { k: 'contest', label: 'Stay disciplined, contest', desc: 'Quick decision', pct: ct.pct, parts: ct.parts },
      ]);
      tire(); const ok = roll(ch.pct);
      if (ch.k === 'steal') { if (ok) return stealPlay(); await court.pass(h, STAR); await theyShoot('catch3', 'open'); pbp(say('gamble_fail'), 'bad'); fail(); return false; }
      await court.pass(h, STAR); const made = await theyShoot(pick(['catch3', 'catchMid']), ok ? 'contested' : 'open');
      if (made) { pbp(say('scored_on', { def: star.name, n: 2 }), 'bad'); fail(); return false; }
      cnt('stops'); pbp(say('contest_good', { def: star.name }), 'good'); success(); await boardAfterMiss(false); return true;
    }

    /* ---------- REBOUND + FREE THROWS ---------- */
    const T = {
      async rebound() {
        const off = MATES().length > 0 && Math.random() < .4; formation(off ? 'us' : 'them'); U.x = 3; U.y = 10;
        const c = calc('rebound', { def: Balance.profile(oppR) });
        await showSetup(`<b>${escH(say(off ? 'setup_oreb' : 'setup_dreb'))}</b> <span class="pct ${c.pct >= 55 ? 'hi' : 'mid'}">${c.pct}%</span>`);
        const shooter = off ? pick(MATES()) : STAR; court.ball.holder = shooter;
        const shotP = court.shoot(shooter, 'miss');
        const r = await MG.rebound($('mg'), { zone: (.07 + (ME.reb * .6 + ME.vert * .4) / 99 * .16) * WIN() * MGX('rebZone') * (1 + APE * .02), sub: `Rebounding ${ME.reb} · base ${c.pct}%` });
        idle(); await shotP;
        if (r.success && roll(Balance.apply('rebound', c.pct, r.quality))) {
          st.box.reb++; cnt('rebounds'); court.ball.holder = U; U.z = 0; court.jump(U, 3, .5); pbp(say(off ? 'oreb' : 'dreb'), 'good'); court.pop('BOARD!', U.x, U.y, 9, '#22c55e');
          if (off) { const p = calc('layup', { contest: 'contested' }).pct; const made = await myShot('layup', roll(p)); pbp(say(made ? 'putback' : 'putback_miss'), made ? 'good' : ''); }
          success(); if (!off) await maybeFastBreak('dreb', 'me'); return true;
        }
        if (!off) { const by = pick(TH); await theyShoot('layup', 'normal', by); pbp(say('lost_board'), 'bad'); } else pbp(say('lost_oreb'));
        fail(); return false;
      },
      async free_throws(ctx) {
        ftLineup();
        const shots = (ctx && ctx.shots) || 2, pressure = st.clutch;
        const c = Balance.pct('ft', ME, { fatigue: st.fatigue, bonus: (pressure ? [{ label: 'Pressure', v: -6 }] : []).concat(bonuses('ft').filter(b => b.label !== 'Wingspan')) });
        if (!ctx) await showSetup(`<b>${escH(say('setup_ft'))}</b>`);
        busy(`<b>${shots === 1 ? 'And-one free throw.' : 'Two shots at the line.'}</b>`, `🎮 Free throws · base ${c.pct}%`);
        let made = 0;
        const r = await MG.freeThrow($('mg'), {
          shots, base: c.pct, stat: ME.ft, full: true, pressure,
          zone: (.75 + Balance.eff(ME.ft) / 99 * 1.0) * WIN() * MGX('ftZone'), wobble: 1.55 + st.fatigue * .012 + (pressure ? .55 : 0),
          shooter: { num: s.player.num, name: myName, color: cfg.us.colors[0], trim: cfg.us.colors[1], skin: lk.skin, hair: lk.hairColor },
          lane: { us: cfg.us.colors[0], them: cfg.them.colors[0] }, scoreText: () => `${cfg.us.abbr} ${st.us} – ${st.them} ${cfg.them.abbr}`,
          onShot: ok => { st.box.fta++; if (ok) { made++; st.box.ftm++; st.box.pts++; cnt('ftMade'); addPts('us', 1); SFX.play('crowd', .6); } else SFX.play('groan'); },
        });
        idle();
        pbp(say(r.made === shots ? 'ft_all' : r.made ? 'ft_split' : 'ft_none', { n: r.made, of: shots }) + ` <i class="pct-note">${c.pct}% base</i>`, r.made === shots ? 'good' : '');
        if (pressure && r.made) cnt('clutchMakes');
        r.made === shots ? success() : r.made ? (st.att++, st.succ += .5) : fail();
        return r.made;
      },
    };

    /* ---------- WEAPON (rolled signature move) ---------- */
    function weaponOpt() {
      const p = Math.min(95, WPN.power + (st.zone ? 5 : 0));
      return { k: 'sig', label: '⚔ ' + WPN.name, desc: `Weapon (${RARITY[WPN.rarity].name}) — ${WPN.desc}`, pct: p, parts: [{ label: `${WPN.name} power ${WPN.power}%`, v: null }].concat(st.zone ? [{ label: 'The Zone', v: 5 }] : []), mg: 'Weapon minigame', cls: 'sig' };
    }
    async function weaponMinigame(setup) {
      const sg = WPN, t = sg.type, title = '⚔ ' + sg.name.toUpperCase();
      busy(setup, `🎮 ${sg.name}`);
      let r;
      if (t === 'three' || t === 'mid' || t === 'zone') { r = await MG.shotMeter($('mg'), { title, green: Math.min(.4, green(t === 'three' ? ME.three : ME.mid) * 1.5 * MGX('green')), dur: .95, sub: sg.desc }); return meterQ(r); }
      if (t === 'drive') { r = await MG.dribbleCombo($('mg'), { title, len: 5, time: (.8 + ME.handle / 99 * .6) * WIN() * 1.2 }); return r.quality; }
      if (t === 'dunk') { r = await MG.dunkChain($('mg'), { title, tol: (8 + ME.dunk / 99 * 10) * WIN() * 1.2, speed: 95 }); return r.quality; }
      if (t === 'pass') { r = await MG.passLane($('mg'), { title, window: (600 + ME.pass / 99 * 700) * WIN() * 1.3 }); return r.success ? r.quality : 0; }
      if (t === 'post') { r = await MG.strengthPush($('mg'), { title, mine: ME.str + 10, theirs: DEF.str }); return r.quality; }
      r = await MG.defenseReact($('mg'), { title, window: (450 + ME.perD / 99 * 450) * WIN() * 1.3 }); return r.success ? Math.max(.5, r.quality) : .1;
    }
    async function weapon(setup) {
      const sg = WPN, p = weaponOpt().pct;
      st.sigUses++; st.sig = 0; st.sigUsed = st.sigUses >= (Engine.hasSpecial(s, 'formless') ? 2 : 1);
      SFX.play('sig'); court.flashA = .6; court.timeScale = .5;
      await banner(`<small>WEAPON · ${RARITY[sg.rarity].name.toUpperCase()}</small>${escH(sg.name)}`, 'sig', 1400);
      court.timeScale = 1;
      const q = await weaponMinigame(setup); idle();
      const ok = roll(Math.max(5, Math.min(95, Math.round(p + (q - .5) * 30))));
      let made = false;
      if (sg.type === 'zone') {
        st.zone = true; court.fire = true; $('vig').classList.add('zone'); SFX.play('levelup');
        pbp('⚡ <b>THE ZONE.</b> Everything slows down. +12% on everything and wider timing windows for the rest of the game.', 'hot');
        await banner('<small>YOU ENTERED</small>THE ZONE', 'sig', 1300);
        made = await myShot('mid', ok, { slowmo: true, perfect: ok });
      } else if (sg.type === 'mid') {
        await court.moveTo(U, U.x > 0 ? 9 : -9, 16, .35); court.trail = '#a78bfa';
        made = await myShot('mid', ok, { slowmo: true, perfect: ok }); court.trail = null;
      } else if (sg.type === 'block') {
        formation('them'); court.ball.holder = STAR; await court.drive(STAR, 1, 8, .4);
        await court.block(U, STAR, true); st.box.blk++; cnt('blocks'); court.pop('DESTROYED!', U.x, U.y, 10, '#38bdf8', 40);
        court.ball.holder = U; court.trail = '#7c3aed'; made = await myShot('dunk', ok); court.trail = null;
      } else if (sg.type === 'three') {
        await court.moveTo(U, U.x > 0 ? 12 : -12, 34, .4); court.trail = '#f97316';
        made = await myShot('three', ok, { slowmo: true, perfect: true }); court.trail = null;
      } else if (sg.type === 'drive') {
        court.trail = '#38bdf8'; made = await myShot('layup', ok); court.trail = null; court.sparks(U.x, U.y, 4, '#38bdf8', 40);
      } else if (sg.type === 'pass') {
        const mate = MATES().length ? pick(MATES()) : U; court.trail = '#a78bfa'; await court.pass(U, mate, .3); court.trail = null;
        made = ok; await court.dunk(mate, ok, false);
        if (ok) { st.box.ast++; cnt('assists'); addPts('us', 2); court.pop(sg.name.toUpperCase() + '!', U.x, U.y, 9, '#a78bfa', 34); }
      } else if (sg.type === 'steal') {
        court.ball.holder = STAR; await court.steal(U, STAR); st.box.stl++; cnt('steals');
        court.trail = '#22c55e'; made = await myShot('dunk', ok, { poster: ok }); court.trail = null;
      } else if (sg.type === 'post') {
        await court.moveTo(U, 4, 8, .3); court.trail = '#ef4444';
        const sp = { r: 0 }; await court.tween(sp, { r: 1 }, .5, 'io', k => { U.x = 4 + Math.sin(k * 6.28) * 1.5; });
        STAR.z = 2.5; court.tween(STAR, { z: 0 }, .8, 'in'); court.trail = null;
        made = await myShot('hook', ok); cnt('posts');
      } else { court.trail = '#ec4899'; made = await myShot('dunk', ok, { poster: true }); court.trail = null; }
      if (made) { court.confetti(60); SFX.play('roar'); pbp(`⚔ <b>${escH(sg.name.toUpperCase())}!</b> ${say('sig_make')}`, 'good hot'); st.highlights.push(`Weapon: ${sg.name}`); success(true); }
      else { pbp(say('sig_miss', { sig: sg.name }), 'bad'); fail(); }
      return made;
    }

    /* ---------- ARCADE SEGMENTS ----------
       Every game switches into arcade play for single possessions — at least BALANCE.arcade.segments.min times,
       spread across the game. Triggers: fast breaks (steal / block / defensive rebound), loose balls, put-back
       scrambles, broken plays, the last possession of a quarter/half, and the final possession of a close game.
       If a stretch of the game has none yet, the game creates one (a deflection, a loose ball…). */
    const SGC = BALANCE.arcade.segments;
    const PACE_T = clamp(.9 + (ME.speed - 55) / 120 + (['sky', 'lightning', 'formless', 'thief', 'phantom'].includes(s.player.arch) ? .15 : 0) + (cfg.us.pace || 0), .7, 1.4);
    const segRange = size < 5 || cfg.target ? SGC.pickup : SGC.match;
    const segTarget = Math.max(SGC.min, segRange[0] + Math.floor(Math.random() * (segRange[1] - segRange[0] + 1)));
    st.seg = 0; st.segKinds = {}; st.segAt = -9;
    const segDue = i => Math.min(segTarget, Math.floor((i + 1) * segTarget / n + 1e-9));
    const clockOf = k => { const v = SGC.clocks[k]; return Array.isArray(v) ? rnd(v[0], v[1]) : v; };
    const SEGK = {
      fastbreak: { title: 'FAST BREAK!', label: 'Fast break' }, loose: { title: 'LOOSE BALL!', label: 'Loose ball' }, putback: { title: 'SCRAMBLE!', label: 'Scramble' },
      broken: { title: 'BROKEN PLAY!', label: 'Broken play' }, buzzer: { title: 'BEAT THE BUZZER!', label: 'Buzzer' }, final: { title: 'FINAL POSSESSION!', label: 'Final possession' },
    };
    const canSeg = () => typeof Arcade !== 'undefined' && st.seg < SGC.max && !st.inSeg;
    /* natural triggers stay on an even spread: never more than one segment ahead of schedule, never back-to-back */
    const natOk = () => canSeg() && st.seg <= segDue(st.i) && st.segAt < st.i - 1;
    async function arcadeSegment(kind, o = {}) {
      if (!canSeg()) return null;
      st.seg++; st.inSeg = true; st.segAt = st.i; (st.segMoments = st.segMoments || []).push(st.i + 1); st.segKinds[kind] = (st.segKinds[kind] || 0) + 1; cnt('arcadeSegments'); if (kind === 'fastbreak') cnt('fastbreaks');
      const K = SEGK[kind], offense = o.offense != null ? o.offense : 0;
      let no = Math.min(3, size), nd = Math.min(3, size), backD = 1, setup = { loose: 'loose', putback: 'putback', fastbreak: 'break' }[kind] || 'half';
      if (kind === 'fastbreak') {   // you alone vs a trailing defender, 2-on-1, or 3-on-2
        const opts = o.trigger === 'steal' ? [[1, 1, 0, 3], [2, 1, 1, 3], [3, 2, 1, 2]] : [[2, 1, 1, 3], [3, 2, 1, 3], [1, 1, 0, 1]];
        const ok = opts.filter(x => x[0] <= size && x[1] <= size), tot = ok.reduce((t, x) => t + x[3], 0);
        let r0 = Math.random() * tot, pk = ok[0]; for (const x of ok) { r0 -= x[3]; if (r0 <= 0) { pk = x; break; } }
        [no, nd, backD] = pk;
      }
      const untilClock = kind === 'buzzer' || kind === 'final';
      const clock = clamp(o.clock || clockOf(kind), 3, 16);
      const clockLabel = kind === 'fastbreak' ? 'BREAK' : kind === 'final' ? 'FINAL' : kind === 'buzzer' ? `${L.label}${clk.per}` : 'SHOT';
      SFX.play('whoosh'); court.excite = 1; if (kind === 'final') { SFX.music('clutch'); SFX.play('heartbeat'); }
      await banner(`<small>${escH(o.sub || '')}</small>${K.title}`, 'fb seg-' + kind, kind === 'final' ? 1200 : 800);
      const hd = no > 1 ? (o.handler || 'me') : 'me';
      const r = await Arcade.segment({ kind, setup, offense, clock, clockLabel, untilClock, title: kind === 'fastbreak' && no > nd ? `FAST BREAK! ${no} ON ${nd}` : K.title,
        us: cfg.us, them: cfg.them, star, oppRating: oppR, mateRating: cfg.mateRating || 45, numbers: [no, nd], backD, handler: hd,
        score: [st.us, st.them], venue: court.venueId, bonus: a => bonuses(a), stats: Object.assign({}, ME), stamina: 100 - st.fatigue });
      st.inSeg = false;
      // box score, counters, fatigue
      const b = r.me || {};
      ['fga', 'fgm', 'tpa', 'tpm', 'reb', 'ast', 'stl', 'blk', 'to', 'pts'].forEach(k => st.box[k] += b[k] || 0);
      if (b.dunks) cnt('dunks', b.dunks); if (b.tpm) cnt('threes', b.tpm); if (b.ast) cnt('assists', b.ast); if (b.stl) cnt('steals', b.stl); if (b.blk) cnt('blocks', b.blk); if (b.reb) cnt('rebounds', b.reb); if (r.ankles) cnt('crosses', r.ankles);
      if (b.fgm && b.dunks < b.fgm && !b.tpm) cnt('layups', b.fgm - (b.dunks || 0));
      st.fatigue = Math.min(100, st.fatigue + 2 + (r.stamina || 0) * .12);
      formation(r.ptsUs ? 'them' : 'us'); court.ball.holder = r.ptsUs ? STAR : U;
      if (r.ptsUs) addPts('us', r.ptsUs); if (r.ptsThem) addPts('them', r.ptsThem);
      const last = n => n ? properName(String(n).split(' ').slice(-1)[0]) : '';
      const who = r.scorer === 'me' ? myName : last(r.scorerName);
      const how = r.end === 'score' || (r.end === 'foul' && (r.ptsUs || r.ptsThem))
        ? (r.ptsUs ? (r.buzzer ? `${who} beats the buzzer!` : r.dunk ? `${who} throws it down!` : `${who} scores.`) + (r.foul ? ' And one!' : '') : `${who} scores for ${cfg.them.name}.`)
        : ({ foul: r.foul && r.foul.team === 1 ? `Foul on ${cfg.us.name} — they go to the line.` : `${r.fouled === 'me' ? myName : 'Your teammate'} is fouled.`, to: 'Turnover.', stop: 'Stop!', set: 'The defense recovers — reset.', oreb: 'Offensive board — reset.', miss: 'No good.', buzzer: 'Time runs out.' }[r.end] || '');
      const extra = (r.log || []).filter(t => /ankles|bulldoze|posterize|pocket|passing lane|blocks|loose ball/.test(t)).slice(-1)[0];
      pbp(`🕹 <b>${K.label}${r.ptsUs ? ` +${r.ptsUs}` : r.ptsThem ? ` (−${r.ptsThem})` : ''}!</b> ${escH(how)}${extra ? ` <i>${escH(extra)}.</i>` : ''}${b.ast ? ' (assist)' : ''}`, r.ptsUs || r.end === 'stop' ? 'good hot' : r.ptsThem || r.end === 'to' ? 'bad' : '');
      if (r.dunk && r.scorer === 'me') st.highlights.push(`${K.label} slam`);
      if (r.buzzer && r.scorer === 'me') st.highlights.push('Beat the buzzer');
      if (r.ankles) st.highlights.push('Broke some ankles in the open floor');
      if (r.foul) {
        if (r.foul.team === 1) { const fp = Balance.pct('ft', THEM).pct; let m = 0; for (let i = 0; i < r.foul.shots; i++) if (roll(fp)) m++; if (m) addPts('them', m); pbp(`${cfg.them.name} go ${m}/${r.foul.shots} at the line.`, m ? 'bad' : 'good'); }
        else if (r.fouled === 'me' || r.scorer === 'me' || !MATES().length) { SFX.play('whistle'); await T.free_throws({ shots: r.foul.shots }); }
        else { const fp = Balance.pct('ft', MATE).pct; let m = 0; for (let i = 0; i < r.foul.shots; i++) if (roll(fp)) m++; if (m) addPts('us', m); pbp(`Your teammate goes ${m}/${r.foul.shots} at the line.`); }
      }
      if (r.ptsUs || r.end === 'stop') success(r.dunk || r.buzzer); else if (r.ptsThem || r.end === 'to' || r.end === 'miss') fail();
      updBug();
      return r;
    }
    /* natural triggers (steal / block / defensive rebound / offensive board) */
    async function maybeFastBreak(trigger, handler, mult = 1) {
      const due = st.seg < segDue(st.i), force = false;
      if (!canSeg() || st.segAt === st.i || (!due && !force && !natOk())) return false;
      if (!due && !force && Math.random() >= SGC.chance[trigger] * PACE_T * mult * (st.seg >= segTarget ? .3 : 1)) return false;
      await arcadeSegment('fastbreak', { handler, trigger, sub: trigger === 'steal' ? 'YOU PICKED HIS POCKET' : trigger === 'block' ? 'OFF THE BLOCK' : handler === 'me' ? 'YOU PUSH IT' : 'OUTLET — RUN THE LANE' });
      return true;
    }
    /* the game creates a segment when a stretch has none yet — mixed trigger types */
    async function createdSegment() {
      const w = Object.assign({}, SGC.mix); for (const k in w) w[k] /= 1 + (st.segKinds[k] || 0) * 1.5;
      if (size === 1) w.fastbreak *= .5;
      const tot = Object.values(w).reduce((a, x) => a + x, 0); let r = Math.random() * tot, kind = 'loose';
      for (const k in w) { r -= w[k]; if (r <= 0) { kind = k; break; } }
      const sc = Math.floor(rnd(4, 8));
      if (kind === 'fastbreak') { formation('them'); const mine = MATES().length === 0 || Math.random() < .55; pbp(mine ? `${myName} jumps the passing lane — and you're off!` : 'Your teammate tips the pass ahead — you\'re off and running!', 'good'); if (mine) { st.box.stl++; cnt('steals'); } return arcadeSegment('fastbreak', { handler: mine ? 'me' : 'mate', trigger: mine ? 'steal' : 'dreb', sub: mine ? 'YOU PICKED IT OFF' : 'TIPPED PASS' }); }
      if (kind === 'loose') { formation('them'); pbp('A deflection! The ball squirts loose — everybody dives for it.'); return arcadeSegment('loose', { sub: '50/50 BALL — GO GET IT' }); }
      if (kind === 'putback') { formation('us'); pbp(MATES().length ? 'Your teammate\'s jumper rims out — crash the glass!' : 'Your shot rims out — get the board!'); return arcadeSegment('putback', { sub: 'BATTLE FOR THE BOARD' }); }
      formation('us'); $('sbShot').textContent = sc; pbp(`The set falls apart — ${sc} on the shot clock. Make something happen!`);
      return arcadeSegment('broken', { clock: sc + rnd(0, .9), sub: `${sc} ON THE SHOT CLOCK` });
    }

    /* ---------- moment selection ---------- */
    function pickMoment() {
      const big = ['PF', 'C'].includes(s.player.pos);
      const w = { off_poss: 5, def_poss: 4, quick_off: 1.5, quick_def: 1.5, rebound: big ? 2 : 1 };
      const ar = s.player.arch;
      if (['thief', 'copycat', 'emperor', 'titan'].includes(ar)) w.def_poss += 1;
      if (['titan', 'bruiser'].includes(ar)) w.rebound += 1;
      if (st.lastType === 'rebound') w.rebound = 0;
      if (st.lastType === 'quick_off' || st.lastType === 'quick_def') { w.quick_off = 0; w.quick_def = 0; }
      const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = Math.random() * tot;
      for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'off_poss';
    }
    const RUN = { off_poss: () => offPossession(), def_poss: () => defPossession(), quick_off: quickOff, quick_def: quickDef, rebound: () => T.rebound() };
    /* simulate scoring between moments */
    function simSegment(frac) {
      const oR = oppR + diffShift * .5;
      const myShare = L.pts * frac * (1 + (usR - oR) * .013) - .9 * frac * n;
      const thShare = L.pts * frac * (1 - (usR - oR) * .013) - .7 * frac * n;
      st.us += Math.max(0, Math.round(myShare * rnd(.65, 1.35))); st.them += Math.max(0, Math.round(thShare * rnd(.65, 1.35)));
      capTarget();
    }
    /* Perfect Copy: defensive stops stack an offense bonus */
    async function withMirror(fn) { const ok = await fn(); if (ok && Engine.hasSpecial(s, 'mirror') && st.mirror < 12) { st.mirror += 3; pbp(`🪞 <b>Perfect Copy</b>: you copied their move. Offense +${st.mirror}%`, 'hot'); } return ok; }

    /* ---------- GAME LOOP ---------- */
    updBug(); formation('us');
    await banner(`<div class="tip">${logoUs}<span>VS</span>${logoThem}</div><small>${escH(cfg.us.name)} vs ${escH(cfg.them.name)}</small>TIP-OFF`, 'tip', 1800);
    SFX.play('whistle'); pbp(`<b>Tip-off!</b> ${escH(cfg.us.name)} vs ${escH(cfg.them.name)}.`, 'sys');
    let prevPer = 1;
    for (let i = 0; i < n; i++) {
      st.i = i; $('momCount').textContent = `Moment ${i + 1}/${n}`;
      const last = i === n - 1;
      simSegment(1 / (n + 1));
      if (last && Math.abs(st.us - st.them) <= 10 && Math.random() < .7) { const target = Math.floor(rnd(-3, 3)); const d = st.us - st.them - target; if (d > 0) st.them += d; else st.us -= d; }
      capTarget();
      clk = clockFor(i); if (last) clk.rem = Math.min(clk.rem, rnd(4, 18));
      updBug();
      if (clk.per !== prevPer) { SFX.play('buzzer'); await banner(`END OF ${L.label === 'H' ? '1ST HALF' : 'Q' + prevPer}`, '', 1000); prevPer = clk.per; pbp(`— ${L.label}${clk.per} —`, 'sys'); }
      const diff = st.us - st.them;
      st.clutch = clk.per === L.periods && (i >= n - 2) && Math.abs(diff) <= 6; st.last = last;
      $('vig').classList.toggle('on', st.clutch); court.clutch = st.clutch;
      if (st.clutch) { SFX.music('clutch'); SFX.play('heartbeat'); st.clutchN++; if (i === n - 2 || last) await banner('CLUTCH TIME', 'clutch', 1100); }
      let type;
      const periodEnds = !last && clockFor(i + 1).per !== clk.per;
      if (last && st.clutch && canSeg()) {   // FINAL POSSESSION — the biggest moment of the game, played live
        const secs = clamp(Math.ceil(clk.rem), 6, 14);
        if (diff <= 0) {
          pbp(diff === 0 ? `Tied ${st.us}-${st.them}. ${secs} seconds left. Ball in your hands. Win it.` : `Down ${-diff}. ${secs} seconds left. ${-diff >= 3 ? 'You need a three to tie.' : 'Everybody knows who\'s taking this shot.'}`, 'hot');
          const before = st.us; await arcadeSegment('final', { offense: 0, clock: secs, sub: diff === 0 ? `TIED · ${secs} SECONDS · WIN IT` : `DOWN ${-diff} · ${secs} SECONDS` }); type = 'final_off';
          if (st.us > st.them && before <= st.them) { st.gameWinner = true; cnt('gameWinners'); st.highlights.push('Hit the game-winner'); }
        } else {
          pbp(`Up ${diff}, ${secs} seconds left. ${star.name} has the ball. Get one stop.`, 'hot');
          const before = st.them; await arcadeSegment('final', { offense: 1, clock: secs, sub: `UP ${diff} · GET ONE STOP` }); type = 'final_def';
          if (st.them - before < diff) { cnt('clutchMakes'); st.clutchW++; st.highlights.push(`Game-sealing stop on ${star.name}`); }
        }
      } else if (periodEnds && canSeg() && st.segAt < i - 1 && (st.seg < segDue(i) || (natOk() && Math.random() < SGC.chance.buzzer) / (1 + (st.segKinds.buzzer || 0))) && !(st.segKinds.buzzer >= 2)) {
        const mine = Math.random() < .72, secs = Math.round(rnd(SGC.clocks.buzzer[0], SGC.clocks.buzzer[1]));
        formation(mine ? 'us' : 'them');
        pbp(mine ? `${secs} seconds left in the ${L.label === 'H' ? 'half' : 'quarter'}. Hold for the last shot.` : `${cfg.them.name} hold for the last shot of the ${L.label === 'H' ? 'half' : 'quarter'}.`);
        await arcadeSegment('buzzer', { offense: mine ? 0 : 1, clock: secs, sub: mine ? `LAST SHOT · ${secs} SECONDS` : 'GET A STOP BEFORE THE HORN' }); type = 'buzzer';
      } else if (st.seg < segDue(i) && canSeg()) { await createdSegment(); type = 'segment'; }
      else {
        type = pickMoment();
        if (type === 'def_poss' || type === 'quick_def') await withMirror(RUN[type]); else await RUN[type]();
      }
      st.lastType = type; idle();
      if (clk.per === L.periods && last) clk.rem = 0;
      updBug(); await sleep(500);
    }
    let ot = 0;
    while (st.us === st.them && ot < 2) {
      ot++; SFX.play('buzzer'); await banner('OVERTIME', 'clutch', 1200); clk = { per: L.periods + ot, rem: 20 }; st.clutch = true; $('vig').classList.add('on');
      st.us += Math.floor(rnd(2, 7)); st.them += Math.floor(rnd(2, 7)); const d = st.us - st.them; if (d > 0) st.them += d; else st.us -= d; capTarget();
      updBug(); const before = st.us;
      if (canSeg() && (st.segKinds.final || 0) < 2) { pbp(`Overtime. Tied ${st.us}-${st.them}. Final possession — make a play.`, 'hot'); await arcadeSegment('final', { offense: 0, clock: 10, sub: 'OVERTIME · LAST SHOT' }); }
      else await offPossession({ text: `Overtime. Tied ${st.us}-${st.them}. Final possession — make a play.` });
      if (st.us > before) { st.gameWinner = true; cnt('gameWinners'); st.highlights.push('Won it in overtime'); }
    }
    if (st.us === st.them) st.them += 1;
    if (cfg.target) {   // pickup: winner lands on exactly the target
      const won = st.us > st.them, k = cfg.target / Math.max(st.us, st.them), lo = Math.min(cfg.target - 2, Math.round(Math.min(st.us, st.them) * k));
      if (won) { st.us = cfg.target; st.them = lo; } else { st.them = cfg.target; st.us = Math.min(cfg.target - 1, Math.max(lo, st.box.pts)); }
    }
    if (size === 1) {   // 1v1: every one of your team's points is yours
      const add = st.us - st.box.pts; if (add > 0) { const fg = Math.round(add / 2); st.box.fgm += fg; st.box.fga += fg + Math.round(fg * rnd(.6, 1.1)); }
      st.box.pts = st.us;
    }
    clk.rem = 0; updBug(); SFX.play('buzzer');
    const win = st.us > st.them;
    $('vig').classList.remove('on', 'zone');
    if (win) { court.confetti(160); SFX.play('roar'); SFX.music('victory'); } else { SFX.play('groan'); SFX.music('sad'); }
    await banner(win ? `<small>FINAL</small>${st.us} – ${st.them}<em>VICTORY</em>` : `<small>FINAL</small>${st.us} – ${st.them}<em class="l">DEFEAT</em>`, win ? 'win' : 'loss', 2200);

    /* ---------- background production (stats from off-screen possessions) ---------- */
    const bg = L.bg, o = myOvr;
    const made2 = Math.round(rnd(.2, .65) * (o / 10) * bg * 2);
    const extra = { pts: made2 * 2, reb: Math.round(rnd(.3, 1.2) * (ME.reb / 18) * bg), ast: Math.round(rnd(.3, 1.2) * (ME.pass / 20) * bg) };
    st.box.pts += extra.pts; st.box.reb += extra.reb; st.box.ast += extra.ast; st.box.fgm += made2; st.box.fga += made2 + Math.round(made2 * rnd(.4, 1.1));

    /* ---------- grade ---------- */
    const rate = st.att ? st.succ / st.att : .5;
    const gs = 18 + rate * 66 + (win ? 12 : 0) + st.clutchW * 6 + st.perfects * 2 + Math.min(8, st.box.pts / 3) - st.box.to * 3;
    const grade = gs >= 92 ? 'A+' : gs >= 85 ? 'A' : gs >= 80 ? 'A-' : gs >= 75 ? 'B+' : gs >= 68 ? 'B' : gs >= 62 ? 'B-' : gs >= 56 ? 'C+' : gs >= 50 ? 'C' : gs >= 44 ? 'C-' : gs >= 36 ? 'D' : 'F';
    court.destroy();
    return {
      win, us: st.us, them: st.them, box: st.box, grade, gradeScore: gs, successes: st.succ, attempts: st.att, clutchMoments: st.clutchN, clutchWins: st.clutchW,
      gameWinner: st.gameWinner, highlights: st.highlights, counters: st.counters, perfects: st.perfects, posterizers: st.posterizers, segments: st.seg, segKinds: st.segKinds, segMoments: st.segMoments || [], moments: n, venueId: court.venueId,
      fatigue: st.fatigue, level: cfg.level, importance: cfg.importance || 1, cfg,
    };
  }

  return { play, MG, Court, LEVELS };
})();
