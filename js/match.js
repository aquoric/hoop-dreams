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
  /* instant-replay shots: pre = seconds before the climax angle 1 starts, cut = when angle 2 takes over (before the climax), post = after it,
     s1/s2 = playback speed of each angle, z1/z2 = zoom, rot = angle-2 tilt (radians) */
  const REPLAY = {
    dunk:   { pre: 1.3, cut: .38, post: .45, s1: 1.1, s2: .42, z1: 1.6, z2: 2.6, rot: -.06 },
    three:  { pre: 1.7, cut: .3,  post: .45, s1: 1.25, s2: .4, z1: 1.45, z2: 2.4, rot: .05 },
    block:  { pre: 1.1, cut: .3,  post: .45, s1: 1.1, s2: .4, z1: 1.6, z2: 2.7, rot: .06 },
    ankles: { pre: 1.2, cut: .35, post: .6, s1: 1.1, s2: .38, z1: 1.6, z2: 2.4, rot: -.05 },
    andone: { pre: 1.3, cut: .35, post: .45, s1: 1.1, s2: .38, z1: 1.55, z2: 2.5, rot: -.05 },
    buzzer: { pre: 1.9, cut: .3,  post: .5, s1: 1.3, s2: .38, z1: 1.4, z2: 2.3, rot: .05 },
    winner: { pre: 1.6, cut: .32, post: .5, s1: 1.2, s2: .38, z1: 1.45, z2: 2.4, rot: -.05 },
    jelly:  { pre: 1.5, cut: .42, post: .6, s1: 1.1, s2: .34, z1: 1.6, z2: 2.7, rot: .07 },
  };
  class Court {
    constructor(canvas, us, them, venueId) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      this.us = us; this.them = them; this.venueId = venueId || 'rec_center';
      this.players = []; this.ball = { x: 0, y: 30, z: 3, holder: null, show: true, spin: 0, dribble: true };
      this.tweens = []; this.pops = [];
      this.shakeAmt = 0; this.timeScale = 1; this.zoom = 1; this.netWave = 0; this.rimBend = 0; this.flashA = 0; this.flashCol = '255,255,255'; this.stopT = 0; this.kick = 0; this.vdt = 0; this.cutAt = -99;
      this.t = 0; this.excite = 0.3; this.fire = false; this.clutch = false; this.trail = null; this.cam = 0;
      this.tsGoal = null; this.tsRate = 6; this.gradeA = 0; this.gradeOn = false; this.camF = null; this.camFc = null; this.tilt = 0; this.tiltC = 0;   // slow-mo ramp, slow-mo look, camera focus + tilt (the jelly)
      this.VW = 0; this.resize();
      this._rs = () => this.resize(); window.addEventListener('resize', this._rs);
      this.alive = true; this.last = performance.now();
      Pixel.ambient(this.V, this.excite); this.lvlT = 0;   // one venue ambience loop (js/audio.js Crowd); its level follows the excitement
      const loop = now => { if (!this.alive) return; const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
        try { if (this.rp) this.rpTick(Math.min(.12, (now - (this.rp.last || now)) / 1000), this.rp.last = now); else { this.update(dt); this.draw(this.vdt, dt); if (this.vdt > 0) this.rec(); } } catch (e) { console.error(e); if (this.rp) this.rp.done(); }
        requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    destroy() { this.alive = false; window.removeEventListener('resize', this._rs); if (typeof SFX !== 'undefined' && SFX.crowd) SFX.crowd.stop(); }
    resize() {
      const r = this.cv.parentElement.getBoundingClientRect(), asp = (r.width || 640) / Math.max(1, r.height || 360);
      const wide = asp >= PIX.W / PIX.H, VW = wide ? clamp(Math.round(PIX.H * asp / 2) * 2, PIX.W, 560) : clamp(Math.round(PIX.H * asp / 2) * 2, 256, PIX.W);
      if (VW === this.VW && this.V) return;
      this.VW = VW; this.cv.width = VW; this.cv.height = PIX.H; this.ctx.imageSmoothingEnabled = false;
      this.V = Pixel.venue(this.venueId, this.us, this.them, wide ? VW : PIX.W); this.R = Pixel.renderer(this.ctx, this.V);
      this.R.E.onLand = (p, h) => { if (h > 12) SFX.play('thud', .5); };
      this.cam = (this.V.W - VW) / 2;
    }
    setVenue(id) { if (id === this.venueId) return; this.venueId = id; this.VW = 0; this.resize(); Pixel.ambient(this.V, this.excite); }
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
      // hit-stop: everything (tweens, poses, particles) freezes for a few frames
      const stopped = this.stopT > 0; if (stopped) this.stopT = Math.max(0, this.stopT - dt);
      if (this.tsGoal != null) this.timeScale += (this.tsGoal - this.timeScale) * (1 - Math.exp(-dt * this.tsRate));   // slow motion ramps in (real time)
      this.gradeA += ((this.gradeOn ? 1 : 0) - this.gradeA) * (1 - Math.exp(-dt * 5)); this.tiltC += (this.tilt - this.tiltC) * (1 - Math.exp(-dt * 5));
      if (this.camF || this.camFc) { const tg = this.camF ? this.camF() : { x: this.X(0), y: 30 }; if (!this.camFc) this.camFc = Object.assign({}, tg); const m = 1 - Math.exp(-dt * 7); this.camFc.x += (tg.x - this.camFc.x) * m; this.camFc.y += (tg.y - this.camFc.y) * m; if (!this.camF && this.zoom < 1.01) this.camFc = null; }
      const sdt = stopped ? 0 : dt * this.timeScale; this.t += sdt; this.vdt = sdt;
      this.players.forEach(p => { const a = p.anim; if (a && a.tick) { a.t += sdt; if (a.auto && a.T && a.t >= a.T) p.anim = null; } if (p.auraT > 0) p.auraT -= dt; });
      this.kick *= Math.pow(.004, dt);
      for (let i = this.tweens.length - 1; i >= 0; i--) {
        const tw = this.tweens[i]; tw.el += sdt; const k = tw.ease(clamp(tw.el / tw.dur, 0, 1));
        try { for (const p in tw.to) tw.obj[p] = lerp(tw.from[p], tw.to[p], k); tw.onUpd && tw.onUpd(k); }
        catch (e) { console.error('tween', e); tw.el = tw.dur; }   // a broken tween finishes instead of blocking whatever waits on it
        if (tw.el >= tw.dur) { this.tweens.splice(i, 1); tw.res(); this.onBeat && this.onBeat(); }
      }
      this.pops.forEach(p => { p.life -= dt; p.y -= dt * (p.wob ? 4 : 14); }); this.pops = this.pops.filter(p => p.life > 0);
      this.shakeAmt *= Math.pow(0.02, dt); this.netWave *= Math.pow(0.05, dt); this.rimBend *= Math.pow(0.01, dt); this.flashA *= Math.pow(0.02, dt);
      if (this.trail && !this.ball.holder && sdt > 0) { const b = this.ball; this.trailK = (this.trailK || 0) + 1; if (this.trailK % 2 === 0) this.R.E.fx.push({ x: this.X(b.x) + rnd(-1, 1), y: this.Y(b.y) - b.z * 3.2 - 2 + rnd(-1, 1), vx: 0, vy: 0, life: .1, col: this.trailK % 4 ? this.trail : '#ffffff', sz: 1 }); }   // a light, sparkly trail (slow motion doesn't stretch it into a beam)
    }
    user() { return this.players.find(p => p.isUser); }
    /* sprite for a court player (shared look with the arcade) */
    spr(p) {
      if (!p._s) { const cols = p.team === 'us' ? this.us.colors : this.them.colors; p._s = Pixel.sprite(Object.assign({}, p.look || {}, { num: p.num }), cols, { i: p.ph || 0 }); p._s.px = null; }
      return p._s;
    }
    /* ---------- drawing ---------- */
    draw(dt, rdt = dt) {
      const rp = this.rp, c = this.ctx, R = this.R, E = R.E, V = this.V, b = rp ? rp.ball : this.ball, T = rp ? rp.t : this.t;
      E.t = T; E.hype = Math.max(E.hype, this.excite); if ((this.lvlT -= rdt) <= 0) { this.lvlT = .8; SFX.crowd && SFX.crowd.level(Math.max(this.excite, E.hype * .8)); } E.net.swish = Math.max(E.net.swish, Math.min(1, rp ? rp.net : this.netWave)); E.rim = Math.max(E.rim, Math.min(1, rp ? rp.rim : this.rimBend));
      // camera (narrow screens follow the ball)
      if (this.VW < V.W && !this.view) { const bx = b.holder ? this.X(b.holder.x) : this.X(b.x); this.cam += (clamp(bx - this.VW / 2, 0, V.W - this.VW) - this.cam) * Math.min(1, rdt * 3); }
      const vw = this.view, cam = vw ? 0 : Math.round(this.cam);
      c.setTransform(1, 0, 0, 1, 0, 0);
      const zz = this.zoom + this.kick;
      if (vw) { c.translate(this.VW / 2, PIX.H * .56); c.rotate(vw.rot || 0); c.scale(vw.z, vw.z); c.translate(-vw.x, -vw.y); }   // replay camera: centred on the action, zoomed, maybe tilted
      else if (zz > 1.001) { const z = zz, fx = (this.camFc ? this.camFc.x : this.X(0)) - cam, fy = this.camFc ? clamp(this.camFc.y, 24, PIX.H - 50) : 30; c.setTransform(z, 0, 0, z, fx * (1 - z), fy * (1 - z)); if (Math.abs(this.tiltC) > .001) { c.translate(fx, fy); c.rotate(this.tiltC); c.translate(-fx, -fy); } }
      if (this.shakeAmt > .3 && !vw) c.translate(Math.round(rnd(-1, 1) * this.shakeAmt * .4), Math.round(rnd(-1, 1) * this.shakeAmt * .4));
      c.translate(-cam, 0);
      c.drawImage(V.bg, 0, 0);
      R.crowd();
      c.save(); c.translate(V.ox, 0); R.hoop(false); c.restore();
      const hold = b.holder;
      const vis = (rp ? rp.players : this.players).filter(p => !p.hidden);
      vis.forEach(p => {
        const s = this.spr(p), nx = this.X(p.x) - V.ox, ny = this.Y(p.y);
        if (s.px != null && dt > 0) { s.vx = (nx - s.px) / dt; s.vy = (ny - s.py) / dt; } if (dt > 0) { s.px = nx; s.py = ny; }
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
        s.fire = this.fire && p.isUser; s.sweaty = p.isUser && this.sweaty;
      });
      c.save(); c.translate(V.ox, 0);
      if (V.def.reflect) vis.forEach(p => R.reflection(p._s));
      const items = vis.map(p => ({ y: p._s.y, d: () => R.player(p._s, { me: p.isUser, fire: p.isUser && this.fire, tag: p.tag && !p.isUser && !rp ? p.tag : '' }) }));
      if (b.show && !hold) items.push({ y: this.Y(b.y) + .5, d: () => R.freeBall({ x: this.X(b.x) - V.ox, y: this.Y(b.y), z: b.z * 3.2, spin: T * 12, jelly: b.jelly, gold: b.gold }, this.fire) });
      items.sort((a, z) => a.y - z.y).forEach(i => i.d());
      vis.forEach(p => { if (!(p.auraT > 0) || dt <= 0) return; const s2 = p._s; for (let k = 0; k < 3; k++) E.fx.push({ x: s2.x + rnd(-6, 6), y: s2.y - s2.z - rnd(0, 30), vx: rnd(-10, 10), vy: -rnd(20, 50), life: .4, col: k ? p.auraCol : '#ffffff', sz: 2, g: -.4 }); if (Math.random() < .12) R.ring(s2.x, s2.y, p.auraCol, 70, .35, 1, .35); });   // weapon aura
      R.hoop(true);
      const hang = vis.find(p => p.anim && p.anim.type === 'dunk' && p.anim.t > .62 && p.anim.t < .95); if (hang) R.player(hang._s, { me: hang.isUser });
      c.restore();
      R.fx(dt);
      if (!vw) this.pops.forEach(p => p.wob ? R.wobble(p.text, p.x, p.y, p.c, p.sc, p.L - p.life) : R.text(p.text, p.x, p.y, p.c, p.sc, 'center', '#0a0a12'));
      R.weather(dt); R.lights();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(V.vg, vw ? clamp(Math.round(vw.x - this.VW / 2), 0, Math.max(0, V.W - this.VW)) : cam, 0, this.VW, PIX.H, 0, 0, this.VW, PIX.H);
      if (vw) return;
      if (this.gradeA > .02) R.grade(this.VW, PIX.H, this.gradeA);
      if (this.timeScale < .6 && this.zoom > 1.1) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, this.VW, 12); c.fillRect(0, PIX.H - 12, this.VW, 12); }   // letterbox in slow motion
      if (this.flashA > 0.02) { c.fillStyle = `rgba(${this.flashCol},${Math.min(.85, this.flashA)})`; c.fillRect(0, 0, this.VW, PIX.H); }
    }
    /* ---------- effects ---------- */
    pop(text, wx, wy, wz, color = '#facc15', size = 34, wob) { this.pops.push({ text, x: this.X(wx), y: this.Y(wy) - wz * 3.2 - 22, c: color, sc: size >= 40 ? 3 : 2, life: wob ? 1.7 : 1.4, L: wob ? 1.7 : 1.4, wob }); }
    confetti(n = 120) { const E = this.R.E; for (let i = 0; i < n; i++) E.fx.push({ x: rnd(0, this.V.W), y: rnd(-40, 0), vx: rnd(-12, 12), vy: rnd(20, 45), life: rnd(2, 4), col: pick(['#f97316', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#fff']), conf: 1 }); }
    sparks(wx, wy, wz, col = '#facc15', n = 26) { this.R.burst(this.X(wx), this.Y(wy) - wz * 3.2, col, Math.round(n * .7), 70); }
    shake(n = 10) { this.shakeAmt = n; }
    /* weapon aura around a player (seconds) */
    aura(p, col = '#facc15', sec = 2) { if (p) { p.auraT = sec; p.auraCol = col; } }
    /* close call: the ball rolls around the rim in slow motion, then falls in or out */
    async rimRoll(made, from) {
      const b = this.ball, s = from ? { x: from.x + .7, y: from.y + .3, z: from.z + 8.5 } : this.ballPos(); b.holder = null; Object.assign(b, s);
      const o = { k: 0 }, sx = b.x, sy = b.y, sz = b.z;
      await this.tween(o, { k: 1 }, .6, 'lin', k => { b.x = lerp(sx, 0, k); b.y = lerp(sy, HOOP.y, k); b.z = lerp(sz, HOOP.z + .6, k) + 5 * 4 * k * (1 - k); });
      SFX.play('rim'); this.rimBend = .5; const prevTs = this.timeScale; this.timeScale = .45; this.tween(this, { zoom: 1.45 }, .5, 'io');
      const loops = made ? 2.3 : 1.8, r = { k: 0 }; let lastQ = 0;
      await this.tween(r, { k: 1 }, 1.7, 'io', k => { const a = k * loops * Math.PI * 2; b.x = Math.sin(a) * 1.05 * (1 - k * .25); b.y = HOOP.y + Math.cos(a) * .35; b.z = HOOP.z + .55 + Math.abs(Math.sin(a * 2)) * .25; const q = Math.floor(a / Math.PI); if (q !== lastQ) { lastQ = q; SFX.play('rim'); this.rimBend = .25; } });
      this.timeScale = prevTs; this.tween(this, { zoom: 1 }, .6, 'io');
      if (made) { SFX.play('swish'); SFX.play('net'); this.netWave = 1; await this.tween(b, { x: 0, z: HOOP.z - 2.5 }, .25, 'in'); await this.tween(b, { z: 0, y: HOOP.y + 1.5 }, .35, 'in'); SFX.play('bounce'); return true; }
      SFX.play('rim'); this.rimBend = .7; await this.tween(b, { x: rnd(-4, 4), y: HOOP.y + 3, z: HOOP.z + 2 }, .25, 'out'); await this.tween(b, { x: rnd(-8, 8), y: rnd(10, 15), z: 0 }, .45, 'in'); SFX.play('bounce'); return false;
    }
    /* close call: the ball carrier runs into a set defender — charge (defender falls) or blocking foul */
    async collide(att, def, charge) {
      SFX.play('squeak'); await this.moveTo(att, def.x + .4, def.y + 1.2, .35); SFX.play('slap'); this.impact(.12, 8, .2, .05);
      if (charge) { this.act(def, 'down', 1.3); this.act(att, 'stumble', .6); this.R.dust(this.X(def.x) - this.V.ox, this.Y(def.y), 10); }
      else { this.act(def, 'stumble', .6); }
      SFX.play('whistle'); await this.wait(.5);
    }
    /* close call: dive for a loose ball heading out of bounds */
    async dive(p, side, saved, to) {
      const b = this.ball; b.holder = null; Object.assign(b, { x: p.x + side * 4, y: p.y + 2, z: 2 });
      const bt = this.tween(b, { x: side * 26, y: p.y + 6, z: 0 }, 1.0, 'out');
      p.anim = { type: 'reach', t: .1, T: .32 }; this.timeScale = .45; this.tween(this, { zoom: 1.3 }, .4);
      await this.tween(p, { x: side * 23.5, y: p.y + 4, z: 1.2 }, .55, 'out'); this.act(p, 'down', 1.2); this.R.dust(this.X(p.x) - this.V.ox, this.Y(p.y), 12); SFX.play('thud');
      this.timeScale = 1; this.tween(this, { zoom: 1 }, .5);
      if (saved && to) { await this.pass({ x: p.x, y: p.y, z: 0, anim: null }, to, .45, 2); return true; }
      await bt; SFX.play('whistle'); return false;
    }
    /* impact: hit-stop freeze + shake + flash + camera punch-in */
    impact(stop = .12, shake = 10, flash = .25, kick = .05, col = '255,255,255') { this.stopT = Math.max(this.stopT, stop); this.shakeAmt = Math.max(this.shakeAmt, shake); this.flashA = Math.max(this.flashA, flash); this.flashCol = col; this.kick = Math.max(this.kick, kick); }
    /* quick anime close-up cut for your highlight plays (rate-limited, needs the portrait ready) */
    highlight(kind, caption, delay = 200, o = {}) { setTimeout(() => { if (this.alive && !busyElsewhere()) this.mini(kind, caption, o); }, delay); }
    /* mini cutscene (2–3s, tap to skip): the court freezes underneath, then play picks up right where it was.
       A few per game: at least 6s apart, max 6 per game (o.force skips the spacing for huddles / face-offs). */
    async mini(kind, caption, o = {}) {
      const u = this.user(); if (!u || typeof Cutscene === 'undefined' || !Cutscene.highlight || !this.alive) return false;
      const look = o.look || u.look, canRp = REPLAY[kind] && this.buf && this.buf.length > 20;
      if (!canRp && (!Cutscene.ready(look) || (o.look2 && !Cutscene.ready(o.look2)))) return false;
      if (!o.force && (this.t - this.cutAt < 6 || this.cuts >= 6 || busyElsewhere())) return false;
      this.cutAt = this.t; this.cuts = (this.cuts || 0) + 1;
      const name = o.name || (Game.state ? `${Game.state.player.first} ${Game.state.player.last}` : u.name);
      // plays that just happened on the court are REPLAYED from the court's own recording (right player, colours, shot and result);
      // the rest (huddle, face-off, weapon, run) are anime cards. Either way a safety timer always hands control back.
      if (canRp) return this.replay(kind, Object.assign({ caption, name, focus: o.focus || u }, o));
      this.stopT = 99;
      try { return await Promise.race([Cutscene.highlight(Object.assign({ kind, look, name, caption, colors: o.colors || this.us.colors }, o)), new Promise(r => setTimeout(() => r(false), 6000))]); }
      catch (e) { return false; } finally { this.stopT = 0; }
    }
    /* ---------- instant replay ----------
       rec() keeps the last few seconds of the court (positions, poses, ball, net) every frame. replay() plays the key moment back:
       angle 1 follows the play at speed, then a white cut to angle 2 — tight, tilted and in slow motion — on the climax. */
    rec() {
      const B = this.buf || (this.buf = []), b = this.ball;
      B.push({ t: this.t, p: this.players.map(p => ({ p, x: p.x, y: p.y, z: p.z || 0, a: p.anim ? Object.assign({}, p.anim) : null, pose: p.pose, hid: p.hidden, fx: p.faceX, mv: p.moving })),
        b: { x: b.x, y: b.y, z: b.z, holder: b.holder, show: b.show, dribble: b.dribble, jelly: b.jelly, gold: b.gold }, net: this.netWave, rim: this.rimBend });
      while (B.length > 2 && B[0].t < this.t - 4.5) B.shift();
    }
    replay(kind, o) {
      const B = this.buf, R0 = REPLAY[kind], u = o.focus, rim = { x: this.X(0), y: PIX.hoop.y - PIX.hoop.z };
      // a different replay every time: tilt direction, zoom, slow-motion speed and what angle 2 frames
      const R = Object.assign({}, R0, { rot: R0.rot * (Math.random() < .5 ? -1 : 1) * rnd(.6, 1.6), z1: R0.z1 * rnd(.9, 1.12), z2: R0.z2 * rnd(.85, 1.18), s2: R0.s2 * rnd(.8, 1.25), mix: rnd(.45, .85) });
      const ballAt = f => f.b.holder ? { x: this.X(f.b.holder.x), y: this.Y(f.b.holder.y) - 20 } : { x: this.X(f.b.x), y: this.Y(f.b.y) - f.b.z * 3.2 };
      const me = f => f.p.find(e => e.p === u);
      // find the climax: ball at the rim (shots, dunks), the block, or the defender hitting the floor
      let ci = -1;
      if (kind === 'block') ci = B.findIndex(f => { const e = me(f); return e && (e.a && e.a.type === 'block' || e.pose === 'block'); });
      else if (kind === 'ankles') ci = B.findIndex(f => f.p.some(e => e.p !== u && e.a && (e.a.type === 'stumble' || e.a.type === 'sit')));
      else if (kind === 'dunk') ci = B.findIndex(f => { const e = me(f); return e && e.a && e.a.type === 'dunk' && e.a.t > .55; });
      if (ci < 0) { for (let i = B.length - 1; i >= 0; i--) { const f = B[i]; if (f.b.holder || !f.b.show) continue; const q = ballAt(f); if (Math.hypot(q.x - rim.x, q.y - rim.y) < 14) { ci = i; break; } } }   // the latest time the ball reached the rim
      if (ci < 0) ci = Math.floor(B.length * .75);
      const t0 = B[0].t, tE = B[B.length - 1].t, tc = B[ci].t;
      const A = { from: Math.max(t0, tc - R.pre), to: Math.max(t0, tc - R.cut) }, Bb = { from: Math.max(t0, tc - R.cut - .12), to: Math.min(tE, tc + R.post) };
      const focus2 = kind === 'block' || kind === 'ankles' ? pick([null, null, rim]) : kind === 'three' || kind === 'buzzer' || kind === 'winner' ? pick(['ball', 'ball', rim, null]) : pick([rim, rim, 'ball', null]);   // angle 2: on you, on the ball's flight, or at the rim
      this.R.E.fx.length = 0;
      const ghosts = new Map(), ghost = p => { if (!p) return null; let g = ghosts.get(p); if (!g) { g = Object.create(p); g._s = null; g.auraT = 0; ghosts.set(p, g); } return g; };   // replay copies: the live players are never touched
      return new Promise(res => {
        const wrap = this.cv.parentElement, T0 = performance.now();
        const skip = e => { if (performance.now() - T0 > 250) { if (e && e.preventDefault) e.preventDefault(); rp.done(); } };
        const hide = () => { if (document.hidden) rp.done(); };
        const rp = this.rp = { kind, o, R, pass: A.to - A.from > .15 ? 0 : 1, T: 0, cutF: 0, done: () => {
          if (rp.over) return; rp.over = true; clearTimeout(rp.safe); wrap.removeEventListener('pointerdown', skip); removeEventListener('keydown', skip, true); document.removeEventListener('visibilitychange', hide);
          this.rp = null; this.view = null; this.R.E.fx.length = 0; this.players.forEach(p => { if (p._s) p._s.px = null; }); res(true);
        } };
        rp.seg = [A, Bb]; rp.time = rp.seg[rp.pass].from; rp.focus2 = focus2; rp.ghost = ghost; rp.ball = {}; rp.players = [];
        wrap.addEventListener('pointerdown', skip); addEventListener('keydown', skip, true); document.addEventListener('visibilitychange', hide);
        rp.safe = setTimeout(rp.done, ((A.to - A.from) / R.s1 + (Bb.to - Bb.from) / R.s2 + 4) * 1000);   // never stuck: control always comes back
        SFX.play('whoosh');
      });
    }
    rpTick(dt) {
      const rp = this.rp, R = rp.R || REPLAY[rp.kind], seg = rp.seg[rp.pass], B = this.buf, sp = rp.pass ? R.s2 : R.s1;
      rp.T += dt; rp.time += dt * sp;
      if (rp.time >= seg.to) {
        if (rp.pass === 0) { rp.pass = 1; rp.time = rp.seg[1].from; rp.cutF = 1; rp.cam = null; SFX.play('impact'); rp.players.forEach(p => { if (p._s) p._s.px = null; }); }
        else if ((rp.hold = (rp.hold || 0) + dt) > .45) return rp.done();
        else rp.time = seg.to;
      }
      if (rp.pass === 1 && !rp.hit && rp.time >= seg.to - R.post) { rp.hit = true; SFX.play(rp.kind === 'block' ? 'slap' : rp.kind === 'ankles' ? 'squeak' : rp.kind === 'dunk' || rp.kind === 'andone' ? 'impact' : 'net'); rp.flash = .5; }
      // the recorded frame at rp.time (positions interpolated, poses from the nearest frame)
      let i = 0; while (i < B.length - 2 && B[i + 1].t <= rp.time) i++;
      const f = B[i], g = B[i + 1] || f, k = g.t > f.t ? clamp((rp.time - f.t) / (g.t - f.t), 0, 1) : 0;
      rp.players = f.p.map(e => { const e2 = g.p.find(q => q.p === e.p) || e, a = e.a && e2.a && e.a.type === e2.a.type ? Object.assign({}, e.a, { t: lerp(e.a.t || 0, e2.a.t || 0, k) }) : e.a && Object.assign({}, e.a);
        return Object.assign(rp.ghost(e.p), { x: lerp(e.x, e2.x, k), y: lerp(e.y, e2.y, k), z: lerp(e.z, e2.z, k), anim: a, pose: e.pose, hidden: e.hid, faceX: e.fx, moving: e.mv }); });
      Object.assign(rp.ball, { x: lerp(f.b.x, g.b.x, k), y: lerp(f.b.y, g.b.y, k), z: lerp(f.b.z, g.b.z, k), holder: rp.ghost(f.b.holder), show: f.b.show, dribble: f.b.dribble, jelly: f.b.jelly, gold: f.b.gold });
      rp.t = lerp(f.t, g.t, k); rp.net = f.net; rp.rim = f.rim;
      // camera: angle 1 follows player + ball; angle 2 sits tight (and tilted) on the climax
      const rim = { x: this.X(0), y: PIX.hoop.y - PIX.hoop.z }, u = rp.ghost(rp.o.focus), ux = this.X(u.x), uy = this.Y(u.y) - (u.z || 0) * 3.2 - 18, bl = rp.ball.holder ? { x: ux, y: uy } : { x: this.X(rp.ball.x), y: this.Y(rp.ball.y) - rp.ball.z * 3.2 };
      const tgt = rp.pass === 0 ? { x: lerp(bl.x, ux, R.mix || .67), y: lerp(bl.y, uy, R.mix || .67), z: R.z1, rot: 0 } : rp.focus2 === 'ball' ? { x: bl.x * .7 + rim.x * .3, y: bl.y * .7 + rim.y * .3, z: R.z2, rot: R.rot } : { x: rp.focus2 ? (rp.focus2.x * .55 + ux * .45) : ux, y: rp.focus2 ? (rp.focus2.y * .5 + uy * .5) : uy, z: R.z2, rot: R.rot };
      if (!rp.cam) rp.cam = Object.assign({}, tgt, { z: tgt.z * (rp.pass ? 1.12 : .92) });
      const m = Math.min(1, dt * (rp.pass ? 3 : 5)); rp.cam.x += (tgt.x - rp.cam.x) * m; rp.cam.y += (tgt.y - rp.cam.y) * m; rp.cam.z += (tgt.z - rp.cam.z) * Math.min(1, dt * 2); rp.cam.rot += (tgt.rot - rp.cam.rot) * Math.min(1, dt * 2);
      this.view = rp.cam;
      this.draw(dt * sp, dt);
      // replay chrome: letterbox, REPLAY tag, caption + name, the white cut between angles
      const c = this.ctx, W = this.VW, H = PIX.H; c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, 16); c.fillRect(0, H - 16, W, 16);
      if (Math.floor(rp.T * 3) % 2 === 0) { c.fillStyle = '#ef4444'; c.fillRect(8, 5, 5, 5); } Pixel.text(c, rp.pass ? 'REPLAY · SLOW-MO' : 'REPLAY', 17, 4, '#f8fafc', 1, 'left');
      const cap = (rp.o.caption || '').toUpperCase(), col = (rp.o.colors || this.us.colors)[0];
      if (rp.pass === 1 && rp.capAt == null) rp.capAt = rp.T;
      if (rp.pass === 1 && cap) { const e = EASE.out(clamp((rp.T - rp.capAt) / .2, 0, 1)), sc = Pixel.textWidth(cap, 3) < W - 24 ? 3 : 2;
        c.save(); c.translate(W / 2, H - 46); c.scale(e, e); Pixel.text(c, cap, 0, 0, '#fde68a', sc, 'center', '#0a0a12'); c.restore();
        if (rp.o.name) { c.fillStyle = col; c.fillRect(W / 2 - 60, H - 14, 120, 10); Pixel.text(c, rp.o.name.toUpperCase(), W / 2, H - 13, Pixel.lum(col) > .6 ? '#0a0a12' : '#f8fafc', 1, 'center'); } }
      if (rp.cutF > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, rp.cutF)})`; c.fillRect(0, 0, W, H); rp.cutF -= dt * 5; }
      if (rp.flash > 0) { c.fillStyle = `rgba(255,255,255,${rp.flash * .6})`; c.fillRect(0, 0, W, H); rp.flash -= dt * 3; }
    }
    /* timed pose that plays out on its own (celebrations, landings) */
    act(p, type, T, extra) { if (!p) return; const a = Object.assign({ type, t: 0, T, tick: true, auto: true }, extra || {}); p.anim = a; return a; }
    /* celebrations + reactions after a make: scorer flexes / points, teammates jump, the other team hangs its heads */
    celebrate(scorer, kind) {
      if (!scorer) return;
      const big = kind === 'dunk' || kind === 'three' || kind === 'jelly' || this.fire, mine = scorer.team, vis = this.players.filter(p => !p.hidden);
      const go = (p, type, T, d) => setTimeout(() => { if (this.alive && (!p.anim || p.anim.auto)) this.act(p, type, T, { hop: true }); }, d);
      const mineC = scorer.isUser && (big || kind === 'jelly') && typeof Features !== 'undefined' ? Features.celebPose(Game.state) : null;   // your celebration (Celebrations tab)
      go(scorer, mineC || (kind === 'dunk' ? pick(['flex', 'thump']) : kind === 'three' || kind === 'jelly' ? 'point' : pick(['celebrate', 'clap', 'point'])), mineC ? 1.3 : 1.0, 380);
      vis.filter(p => p.team === mine && p !== scorer).forEach((p, i) => go(p, big ? 'joy' : 'clap', .9, 300 + i * 90));
      vis.filter(p => p.team !== mine).forEach((p, i) => go(p, 'hang', 1.1, 420 + i * 60));
      this.R.cheer(mine === 'us' ? (big ? 1 : .6) : .3, big && mine === 'us');
      if (big && mine === 'us') SFX.play('roar');
    }

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
    async pass(from, to, dur, arc = 0) {
      const b = this.ball, s = this.ballPos(); from.anim = { type: 'pass', t: .15, T: .26, thrown: true }; b.holder = null; Object.assign(b, s); SFX.play('pass');
      const d = Math.hypot(to.x - s.x, to.y - s.y); dur = dur || clamp(d / 34, .3, .7) * (arc ? 1.5 : 1);
      const o = { k: 0 }, sx = s.x, sy = s.y, sz = s.z, tz = arc ? 9 : 3.5;
      await this.tween(o, { k: 1 }, dur, arc ? 'io' : 'lin', k => { b.x = lerp(sx, to.x + .7, k); b.y = lerp(sy, to.y + .3, k); b.z = lerp(sz, tz, k) + arc * 4 * k * (1 - k); }); b.holder = to; from.anim = null;
      to.anim = { type: 'catch', t: 0, T: .2 }; setTimeout(() => { if (to.anim && to.anim.type === 'catch') to.anim = null; }, 220);
    }
    /* Shot: gather, rise, release at the top, follow-through; ball arcs to the rim.
       outcome: 'swish' | 'rimin' | 'miss' | 'airball'. opts.layup = layup animation */
    async shoot(p, outcome, opts = {}) {
      p.faceX = p.x < 0 ? 1 : -1;
      const A = p.anim = opts.layup ? { type: 'layup', t: 0, T: .7, released: false } : { type: 'shoot', t: 0, air: false, released: false };
      await this.tween(A, { t: opts.layup ? .17 : .2 }, opts.layup ? .1 : .17, 'out');        // anticipation: gather + crouch
      if (p.anim === A) { A.air = true; A.t = .3; }
      const jh = opts.jump || (opts.layup ? 3 : 2.2);
      await this.tween(p, { z: jh }, .26, 'out');
      const b = this.ball, s = this.ballPos(); b.holder = null; Object.assign(b, s); if (p.anim === A) A.released = true;
      SFX.play('whoosh');
      this.wait(.12).then(() => this.tween(p, { z: 0 }, .26, 'in')).then(() => { if (p.anim === A) this.act(p, 'land', .17); p.faceX = null; });   // follow-through hangs, then lands
      const d = Math.hypot(HOOP.x - s.x, HOOP.y - s.y), arc = opts.arc || clamp(d * .45 + 4, 5, 14), dur = (opts.dur || clamp(.6 + d / 40, .65, 1.35));
      const sx = s.x, sy = s.y, sz = s.z;
      const tx = outcome === 'miss' ? rnd(-.9, .9) : outcome === 'airball' ? rnd(-3, 3) : 0, ty = outcome === 'airball' ? 7.5 : HOOP.y + (outcome === 'miss' ? rnd(-.6, .6) : 0);
      const o = { k: 0 };
      if (opts.slowmo) { this.timeScale = .35; this.tween(this, { zoom: 1.4 }, .5, 'io'); }
      await this.tween(o, { k: 1 }, dur, 'lin', k => { b.x = lerp(sx, tx, k); b.y = lerp(sy, ty, k); b.z = lerp(sz, HOOP.z + .4, k) + arc * 4 * k * (1 - k); });
      if (opts.slowmo) { this.timeScale = 1; this.tween(this, { zoom: 1 }, .6, 'io'); }
      if (outcome === 'swish' || outcome === 'rimin') {
        if (outcome === 'rimin') { SFX.play('rim'); this.rimBend = .4; await this.tween(b, { z: HOOP.z + 1.2, x: rnd(-.4, .4) }, .15, 'out'); await this.tween(b, { z: HOOP.z, x: 0 }, .15, 'in'); }
        SFX.play('swish'); SFX.play('net'); this.netWave = 1; if (opts.green) green();
        if (opts.big) { this.impact(.09, 4, .12, .04); this.R.ring(this.X(0) - this.V.ox, this.Y(HOOP.y) - HOOP.z * 3.2 + 3, '#e0f2fe', 90, .3, 1); }
        await this.tween(b, { z: HOOP.z - 2.5 }, .22, 'in');
        await this.tween(b, { z: 0, y: HOOP.y + 1.5 }, .35, 'in'); SFX.play('bounce');
        return true;
      }
      if (outcome === 'airball') { await this.tween(b, { z: 0, y: 2 }, .3, 'in'); SFX.play('bounce'); return false; }
      SFX.play('rim'); this.rimBend = .8; this.R.E.net.sway = 1; this.sparks(b.x, b.y, b.z, '#fde68a', 6);
      const ox = rnd(-8, 8), oy = rnd(10, 16);
      await this.tween(b, { x: ox * .3, y: HOOP.y + 2, z: HOOP.z + 3 }, .25, 'out');
      await this.tween(b, { x: ox, y: oy, z: 0 }, .5, 'in'); SFX.play('bounce');
      return false;
    }
    async drive(p, toX = rnd(-2.5, 2.5), toY = 7.5, dur = .7) { SFX.play('squeak'); this.ball.dribble = true; await this.moveTo(p, toX, toY, dur); }
    async layup(p, made, g) {
      await this.drive(p, rnd(-2, 2), 6.5, .55);
      return this.shoot(p, made ? (Math.random() < .5 ? 'swish' : 'rimin') : 'miss', { arc: 2.5, dur: .45, layup: true, green: g && made });
    }
    /* THE JELLY, beat by beat: long low stride → gather and contort away from the shot blocker while he rises →
       wrist flick (hit-stop, sparkle, afterimages) → the ball floats past his fingers (spin lines, glow) → kisses the glass (shine) →
       drops through a slow-motion net, then time snaps back. o: { side, perfect, lvl 0 jelly | 1 reverse | 2 under-the-arm, drama }.
       Regular play keeps it ~2.5s; drama (game-winners, clutch, the story's first jelly) goes deeper into slow motion. */
    async jelly(p, made, big, o = {}) {
      const side = o.side || (p.x < 0 ? -1 : 1), b = this.ball, lvl = clamp(o.lvl || 0, 0, 2), D = !!o.drama, bigOn = !!(big && !big.hidden), gold = !!(o.perfect && made);
      const slow = D ? .24 : .46, mode = pick(['rim', 'ball', 'ball', 'low']), ox = this.V.ox;
      const at = (q, dz = 0) => ({ x: this.X(q.x), y: this.Y(q.y) - ((q.z || 0) + dz) * 3.2 });
      this.tilt = (Math.random() < .5 ? -1 : 1) * rnd(.012, D ? .05 : .035);
      // 1 · the approach: a long, low, explosive last stride
      SFX.play('squeak'); b.dribble = true; p.faceX = -side;
      const A = p.anim = { type: 'jelly', u: 0, lvl, released: false };
      if (bigOn) { big.faceX = side; this.moveTo(big, side * .5, 6.8, .26); }
      this.tween(A, { u: .28 }, .26, 'out');
      await this.moveTo(p, side * 3.6, 9.8, .26);
      this.R.dust(this.X(p.x), this.Y(p.y), 7); SFX.play('squeak', .8);
      // 2 · gather and contort — time ramps down, the camera pushes in, he rises with both arms up
      this.tsGoal = slow; this.tsRate = D ? 4 : 7; this.gradeOn = true; SFX.play('whoosh');
      this.camF = mode === 'low' ? () => { const u = at(p, 3); return { x: (u.x + this.X(0)) / 2, y: u.y - 4 }; } : () => at(p, 4);
      this.tween(this, { zoom: D ? 1.42 : 1.3 }, .3, 'io');
      if (bigOn) { const BA = big.anim = { type: 'jellyD', u: 0 }; this.tween(BA, { u: 1 }, .34, 'out'); this.tween(big, { z: 3.9, x: side * (lvl === 1 ? 1.7 : 1.2), y: 6.7 }, .34, 'out').then(() => this.tween(big, { z: 0 }, .45, 'in')); }
      this.wait(.14).then(() => { p.ghost = true; });
      const gx = lvl === 1 ? side * .1 : lvl === 2 ? side * 2.6 : side * 3.0, gy = lvl === 1 ? 6.2 : 8.2;   // reverse: glide under the rim behind him
      await Promise.all([this.tween(A, { u: .55 }, .32, 'io'), this.tween(p, { z: lvl === 2 ? 3.1 : 3.6, x: gx, y: gy }, .32, 'out')]);
      // 3 · the flick: hit-stop on the wrist snap, a sparkle at the fingertips, afterimages behind the arm
      A.u = .58; A.released = true; if (lvl === 1) p.faceX = side;
      this.stopT = D ? .2 : .1; SFX.play('flick'); SFX.play('gasp');
      const h = p._s && p._s.hand; if (h) { this.R.burst(h.x + ox, h.y - 2, '#ffffff', 5, 40); this.R.burst(h.x + ox, h.y - 2, gold ? '#facc15' : '#fde68a', 7, 55); this.R.ring(h.x + ox, h.y - 2, '#ffffff', 40, .2, 1, 1); }
      const s0 = this.ballPos(); b.holder = null; Object.assign(b, s0); b.jelly = true; b.gold = gold; this.trail = gold ? '#facc15' : '#fde68a';
      this.tween(A, { u: 1 }, .5, 'out').then(() => this.tween(p, { z: 0 }, .26, 'in')).then(() => { p.ghost = false; if (p.anim === A) this.act(p, 'land', .2); p.faceX = null; });
      // 4 · ball flight — a different path per jelly level
      const by = bigOn ? big : { x: side * 1.4, z: 0 };
      const G = { x: (lvl === 1 ? -side : side) * 1.25, y: HOOP.y - .7, z: HOOP.z + 2.7 };
      const C = lvl === 1 ? { x: side * .1, y: HOOP.y + .7, z: HOOP.z - .8 }                       // reverse: under the rim, up the far side
        : lvl === 2 ? { x: by.x + side * .2, y: 7.1, z: (by.z || 0) + 4.4 }                          // under-the-arm: through his armpit
        : { x: by.x + side * .35, y: 7.0, z: (by.z || 0) + 9.6 };                                   // the jelly: up past his fingertips
      this.camF = mode === 'rim' ? () => ({ x: this.X(0), y: this.Y(HOOP.y) - HOOP.z * 3.2 }) : () => at(b);
      this.tween(this, { zoom: D ? 1.62 : 1.46 }, .3, 'io');
      const k = { u: 0 }, q = (a, c2, g, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c2 + u * u * g;
      await this.tween(k, { u: 1 }, D ? .34 : .3, 'lin', () => { const u = k.u; b.x = q(s0.x, C.x, G.x, u); b.y = q(s0.y, C.y, G.y, u); b.z = q(s0.z, C.z, G.z, u); });
      // 5 · off the glass: a soft kiss, a shine sweeps the backboard
      SFX.play('kiss'); SFX.play('ooh'); this.R.shine(G.x < 0 ? -1 : 1); this.stopT = Math.max(this.stopT, .05);
      const gp = at(G); this.R.ring(gp.x, gp.y, '#fde68a', 60, .3, 1); this.R.burst(gp.x, gp.y, gold ? '#facc15' : '#fef9c3', 8, 30);
      // 6 · the drop: rolls down soft and through a slow-motion net
      const tx = made ? 0 : -G.x * .55;
      await this.tween(k, { u: 0 }, D ? .2 : .16, 'in', () => { const w = 1 - k.u; b.x = lerp(G.x, tx, w); b.y = lerp(G.y, HOOP.y, w); b.z = lerp(G.z, HOOP.z + .4, w); });
      const snap = () => { this.tsGoal = null; this.timeScale = 1; this.gradeOn = false; this.camF = null; this.tilt = 0; this.tween(this, { zoom: 1 }, .45, 'out'); b.jelly = false; b.gold = false; this.trail = null; };
      if (!made) {
        snap(); SFX.play('rim'); this.rimBend = .7; this.R.E.net.sway = 1;
        await this.tween(b, { x: G.x * -2.6, y: HOOP.y + 3, z: HOOP.z + 2.5 }, .25, 'out'); await this.tween(b, { x: G.x * -5, y: rnd(11, 15), z: 0 }, .45, 'in'); SFX.play('bounce');
        if (bigOn) this.act(big, 'land', .3);
        return false;
      }
      SFX.play('swish'); SFX.play('net'); SFX.play('jelly'); this.netWave = 1.5;
      await this.tween(b, { z: HOOP.z - 2.6, y: HOOP.y + .3 }, D ? .24 : .17, 'lin');
      // 7 · time snaps back: shake, the wobbly JELLY!, the crowd goes from the OOOH into cheers
      snap(); this.impact(0, D ? 9 : 6, gold ? .3 : .16, .05, gold ? '250,204,21' : '253,230,138');
      if (navigator.vibrate) try { navigator.vibrate(gold ? [30, 40, 70] : [35, 30, 45]); } catch (e) { }
      this.R.ring(this.X(0) - ox, this.Y(HOOP.y) - HOOP.z * 3.2 + 2, '#fde68a', 140, .4, 1); this.sparks(0, HOOP.y, HOOP.z, gold ? '#facc15' : '#fde047', gold ? 44 : 26);
      this.pop(gold ? 'PERFECT JELLY!' : lvl === 1 ? 'REVERSE JELLY!' : lvl === 2 ? 'UNDER THE ARM!' : 'JELLY!', 0, HOOP.y + 2, HOOP.z, gold ? '#4ade80' : '#facc15', 46, true);
      if (gold) { green(); this.confetti(60); }
      if (bigOn) {   // his reaction — never the same twice
        const r = pick(D ? ['down', 'sit', 'watch', 'down'] : ['stumble', 'watch', 'down', 'stumble', 'sit']);
        setTimeout(() => { if (!this.alive) return;
          if (r === 'watch') { big.faceX = big.x < 0 ? 1 : -1; this.act(big, 'watch', 1.4); this.pop('…', big.x, big.y, 8, '#e2e8f0', 30); }
          else { this.act(big, r, r === 'down' ? 1.3 : r === 'sit' ? 1.4 : 1.0); this.pop('?!', big.x, big.y, 8, '#fca5a5', 30); this.R.dust(this.X(big.x), this.Y(big.y), 6); }
        }, 120);
      }
      this.R.cheer(1, true); setTimeout(() => { if (this.alive) { SFX.play('roar', gold || D ? 1 : .8); this.R.cheer(1, true); } }, 380);
      this.tween(b, { z: 0, y: HOOP.y + 1.5 }, .32, 'in').then(() => SFX.play('bounce'));   // play goes on while it bounces
      return true;
    }
    async dunk(p, made, poster) {
      await this.drive(p, rnd(-1.5, 1.5), 7.5, .55);
      const b = this.ball; b.dribble = false; p.faceX = p.x < 0 ? 1 : -1;
      const A = p.anim = { type: 'dunk', t: 0, T: 1.05 };
      await this.tween(A, { t: .21 }, .17, 'out');                       // anticipation: deep crouch, ball loaded
      SFX.play('whoosh');
      if (poster) { this.timeScale = .4; this.tween(this, { zoom: 1.35 }, .4); }
      await this.tween(p, { z: 6.2, y: HOOP.y + 1.2, x: 0 }, .45, 'out', k => { if (p.anim) p.anim.t = .22 + k * .41; });   // rise, wind-up behind the head, hammer
      if (poster) { this.timeScale = 1; this.tween(this, { zoom: 1 }, .7); }
      p.anim.t = .66; p.anim.made = made;
      if (!made) {
        b.holder = null; Object.assign(b, { x: 0, y: HOOP.y + 1, z: HOOP.z + .5 }); SFX.play('rim'); this.rimBend = .5;
        p.anim = { type: 'jump', t: 0 }; this.tween(p, { z: 0, y: 7 }, .4, 'in').then(() => { p.anim = null; p.faceX = null; });
        await this.tween(b, { x: rnd(-6, 6), y: rnd(12, 16), z: 0 }, .6, 'in'); return false;
      }
      b.holder = null; Object.assign(b, { x: 0, y: HOOP.y, z: HOOP.z + .6 });
      SFX.play('dunk'); this.impact(poster ? .2 : .14, poster ? 22 : 13, poster ? .5 : .28, poster ? .1 : .06); this.rimBend = 1.2; this.netWave = 1.5; if (this.greenNext) { this.greenNext = false; green(); }
      this.sparks(0, HOOP.y, HOOP.z, '#facc15', poster ? 50 : 24); this.R.ring(this.X(0) - this.V.ox, this.Y(HOOP.y) - HOOP.z * 3.2 + 2, '#fde68a', 170, .4);
      this.R.sweat(this.X(p.x) - this.V.ox, this.Y(p.y) - p.z * 3.2 - 26, 6);
      if (p.isUser) this.highlight('dunk', poster ? 'POSTERIZED!' : pick(['SLAM!', 'WITH AUTHORITY!', 'HELLO, RIM!']), 230);
      await this.tween(b, { z: 0 }, .35, 'in', k => { if (p.anim) p.anim.t = .66 + k * .24; }); SFX.play('bounce');
      p.anim = { type: 'jump', t: 0 }; await this.tween(p, { z: 0, y: 7 }, .3, 'in'); this.act(p, 'land', .2); p.faceX = null;
      return true;
    }
    async steal(user, from) {
      SFX.play('squeak'); user.pose = 'def'; user.anim = { type: 'reach', t: .1, T: .32 }; await this.moveTo(user, from.x + .8, from.y + .5, .25);
      this.ball.holder = user; this.sparks(user.x, user.y, 3, '#38bdf8', 18); SFX.play('whoosh'); SFX.play('slap'); this.kick = .04; user.pose = ''; user.anim = null;
      from.anim = { type: 'stumble', t: 0, T: .5 }; setTimeout(() => { if (from.anim && from.anim.type === 'stumble') from.anim = null; }, 500);
    }
    async block(user, shooter, success) {
      shooter.anim = { type: 'shoot', t: .3, air: true, released: false }; user.anim = { type: 'block', t: .1 };
      const b = this.ball; b.holder = null; Object.assign(b, { x: shooter.x, y: shooter.y, z: 8 });
      this.moveTo(user, shooter.x + .6, shooter.y - .8, .3);
      const j = this.tween(user, { z: 4 }, .3, 'out').then(() => this.tween(user, { z: 0 }, .3, 'in')); await this.tween(shooter, { z: 2 }, .25, 'out'); await this.tween(shooter, { z: 0 }, .25, 'in');
      shooter.anim = null;
      if (success) {
        SFX.play('dunk'); SFX.play('crowd', 1.5); this.impact(.13, 10, .22, .06, '186,230,253'); this.sparks(b.x, b.y, 10, '#38bdf8', 30); this.R.ring(this.X(b.x) - this.V.ox, this.Y(b.y) - b.z * 3.2, '#bae6fd', 130, .3); this.R.cheer(.8);
        user.anim = { type: 'block', t: .3 };
        if (user.isUser) this.highlight('block', pick(['REJECTED!', 'NOT IN MY HOUSE!', 'SWAT CITY!']), 150);
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
    if (layer._drive) closeDrive(layer);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();   // Space / Enter must reach the minigame, not a focused button
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
  const mgOffs = new Set();   // input listeners of the running minigame (released if it's cut short)
  /* universal "tap" input: pointer on element, or Space/Enter */
  function onTap(target, fn) {
    const pd = e => { e.preventDefault(); fn(); };
    const kd = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); fn(); } };
    target.addEventListener('pointerdown', pd); window.addEventListener('keydown', kd);
    const off = () => { target.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd); mgOffs.delete(off); }; mgOffs.add(off); return off;
  }
  function dirInput(fn) { // arrows / WASD
    const map = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D' };
    const kd = e => { if (map[e.code]) { e.preventDefault(); fn(map[e.code]); } };
    window.addEventListener('keydown', kd); const off = () => { window.removeEventListener('keydown', kd); mgOffs.delete(off); }; mgOffs.add(off); return off;
  }
  const ARROW = { L: '◀', R: '▶', U: '▲', D: '▼' };
  /* GREEN: perfect timing in any minigame (and arcade releases) — its own sound + a quick "GREEN!" flash */
  let greenAt = 0;
  function green(label = 'GREEN!') {
    const now = performance.now(); if (now - greenAt < 250) return; greenAt = now;
    SFX.play('green'); const el = document.createElement('div'); el.className = 'green-pop'; el.innerHTML = `<b>${label}</b>`; document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /* ---------- the drive stage (shared by blowBy / gatherStep / layupStep) ---------- */
  let mgHold = false;   // a minigame is waiting on a tutorial card: its watchdog clock stops
  const DRIVE_VEN = new Map(), nextFrame = () => new Promise(r => requestAnimationFrame(r));
  const dvAnim = (sec, fn) => new Promise(res => { const t0 = performance.now(); const f = now => { const k = Math.min(1, (now - t0) / 1000 / sec); fn(k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  function driveStage(layer, o) {
    if (layer._drive && layer._drive.el.isConnected) return layer._drive;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const X = o.ctx || {}, us = X.us || { colors: ['#f97316', '#111827'] }, them = X.them || { colors: ['#1e3a8a', '#e5e7eb'] }, vid = X.venue && VENUES[X.venue] ? X.venue : 'rec_center';
    const key = vid + us.colors + them.colors; let V = DRIVE_VEN.get(key); if (!V) { V = Pixel.venue(vid, us, them, 384); DRIVE_VEN.set(key, V); }
    const touch = matchMedia('(pointer: coarse)').matches;
    const el = document.createElement('div'); el.className = 'mg mg-drive' + (touch ? ' touch' : '');
    el.innerHTML = `<div class="mg-card dv-card">
        <div class="dv-steps"><b data-p="read">1 · READ</b><b data-p="step">2 · STEP</b><b data-p="rel">3 · RELEASE</b></div>
        <div class="dv-stage"><canvas width="256" height="144"></canvas><div class="dv-say"></div><div class="dv-fb"></div>
          <button class="dv-key l" data-d="L"><b>${touch ? '◀' : '←'}</b><small>${touch ? 'LEFT' : 'A'}</small></button>
          <button class="dv-key r" data-d="R"><b>${touch ? '▶' : '→'}</b><small>${touch ? 'RIGHT' : 'D'}</small></button>
          <button class="dv-key c" data-d="T"><b>${touch ? 'TAP' : 'SPACE'}</b></button></div>
        <div class="timer dv-timer"><i></i></div><div class="dv-sub"></div></div>`;
    layer.querySelectorAll('.mg').forEach(e => e.remove());
    layer.classList.remove('ftmode'); layer.appendChild(el); layer.classList.add('on'); requestAnimationFrame(() => el.classList.add('in'));
    const cv = el.querySelector('canvas'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const mk = (look, num, cols, x, y) => Pixel.sprite(Object.assign({}, look || {}, { num }), cols, { x, y });
    const D = { el, c, V, R: Pixel.renderer(c, V), me: mk(X.meLook, X.meNum, us.colors, 192, 162), df: mk(X.defLook, X.defNum, them.colors, 192, 124), cam: { x: 192, y: 115, z: 1.35 }, camT: { x: 192, y: 115, z: 1.35 }, t0: performance.now(), last: performance.now(), input: null, alive: true, touch };
    D.R.E.hype = .5; D.me.hasBall = true;
    const kd = e => { const m = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', Space: 'T', Enter: 'T' }[e.code]; if (m && D.input && !el.querySelector('.dv-tut')) { e.preventDefault(); D.input(m); } };
    addEventListener('keydown', kd);
    el.querySelectorAll('.dv-key').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); D.input && D.input(b.dataset.d); }));
    const stage = el.querySelector('.dv-stage'); let sx = 0;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; if (D.tapAny && D.input && !e.target.closest('.dv-tut')) D.input('T'); });
    stage.addEventListener('pointerup', e => { const dx = e.clientX - sx; if (Math.abs(dx) > 30 && D.input) D.input(dx > 0 ? 'R' : 'L'); });
    const off = () => { removeEventListener('keydown', kd); mgOffs.delete(off); }; mgOffs.add(off); D.off = off;
    const frame = now => { if (!D.alive || !el.isConnected) { off(); return; } const dt = Math.min(.05, (now - D.last) / 1000); D.last = now; try { drawDrive(D, dt); } catch (e) { console.error('drive', e); } requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    layer._drive = D; return D;
  }
  function drawDrive(D, dt) {
    const { c, V, R, me, df } = D; D.t = (performance.now() - D.t0) / 1000; R.E.t = D.t;
    const k = Math.min(1, dt * 5); for (const a of ['x', 'y', 'z']) D.cam[a] += (D.camT[a] - D.cam[a]) * k;
    [me, df].forEach(p => {
      if (p._lx != null && dt > 0) { p.vx = (p.x - p._lx) / dt; p.vy = (p.y - p._ly) / dt; } p._lx = p.x; p._ly = p.y;
      const sp = Math.hypot(p.vx || 0, p.vy || 0); p.phase += sp * dt * .21; if (p.hasBall) p.dribT += dt / (sp > 12 ? .38 : .5);
      if (p.act && !p.act.hold && p.act.T) { p.act.t += dt; if (p.act.t >= p.act.T) p.act = null; }
    });
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#05070d'; c.fillRect(0, 0, 256, 144);
    const z = D.cam.z; c.setTransform(z, 0, 0, z, Math.round(128 - z * (D.cam.x + V.ox)), Math.round(72 - z * D.cam.y));
    c.drawImage(V.bg, 0, 0); R.crowd(); c.save(); c.translate(V.ox, 0); R.hoop(false);
    if (D.under) D.under(c);
    [me, df].slice().sort((a, b) => a.y - b.y).forEach(p => R.player(p, { me: p === me }));
    R.hoop(true); if (D.over) D.over(c); c.restore(); R.fx(dt); R.lights();
    c.setTransform(1, 0, 0, 1, 0, 0); if (D.screen) D.screen(c);
  }
  const dvSay = (D, html, cls = '') => { const e = D.el.querySelector('.dv-say'); if (e.dataset.h === html) return; e.dataset.h = html; e.innerHTML = html.replace(/<small>/, '<small>'); e.className = 'dv-say' + (html ? ' on ' + cls : ''); };
  const dvSub = (D, t) => { D.el.querySelector('.dv-sub').textContent = t || ''; };
  const dvKeys = (D, on) => D.el.querySelectorAll('.dv-key').forEach(b => { b.classList.toggle('on', on.includes(b.dataset.d)); if (!on.length) b.classList.remove('hit'); });
  const dvHit = (D, d) => { const b = D.el.querySelector(`.dv-key[data-d="${d}"]`); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } };
  const dvTimer = (D, f) => { const t = D.el.querySelector('.dv-timer'); t.firstChild.style.width = clamp(f, 0, 1) * 100 + '%'; t.classList.toggle('low', f < .3); };
  const dvPhase = (D, p) => D.el.querySelectorAll('.dv-steps b').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  const dvDone = (D, p) => { const b = D.el.querySelector(`.dv-steps b[data-p="${p}"]`); if (b) b.classList.add('done'); };
  const dvFb = async (D, text, good, ms = 700) => { const e = D.el.querySelector('.dv-fb'); e.textContent = text; e.className = 'dv-fb ' + (good ? 'good' : 'bad'); void e.offsetWidth; e.classList.add('on'); SFX.play(good ? 'good' : 'bad'); await sleep(ms); e.classList.remove('on'); };
  function closeDrive(layer) { const D = layer && layer._drive; if (!D) return; layer._drive = null; D.alive = false; D.off && D.off(); D.el.classList.remove('in'); setTimeout(() => { D.el.remove(); if (!layer.children.length) layer.classList.remove('on'); }, 180); }
  async function driveTutorial(D) {
    let seen = false; try { seen = localStorage.getItem('hd_drive_tut') === '1'; } catch (e) { }
    if (seen) return;
    const k = D.touch ? ['◀ / ▶', '◀ then ▶', 'TAP'] : ['← / →', '← then →', 'SPACE'];
    const box = document.createElement('div'); box.className = 'dv-tut';
    box.innerHTML = `<h3>THE DRIVE</h3><ol>
      <li><b>1 · READ</b> His lean, feet or reaching arm gives away the side he's covering. Go the <u>other</u> way: <kbd>${k[0]}</kbd></li>
      <li><b>2 · STEP</b> Sometimes: hit <kbd>${k[1]}</kbd> as each footprint lights up under you.</li>
      <li><b>3 · RELEASE</b> <kbd>${k[2]}</kbd> when the ring hits the green zone on the rim.</li></ol><button class="btn sm">GOT IT</button>`;
    D.el.querySelector('.dv-card').appendChild(box); mgHold = true;
    await new Promise(r => { const go = () => { removeEventListener('keydown', kk); r(); }; const kk = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); go(); } }; addEventListener('keydown', kk); box.querySelector('button').onclick = go; });
    mgHold = false; try { localStorage.setItem('hd_drive_tut', '1'); } catch (e) { } box.remove();
  }

  async function flickTutorial(D) {
    let seen = false; try { seen = localStorage.getItem('hd_flick_tut') === '1'; } catch (e) { }
    if (seen) return;
    const k = D.touch ? ['◀ / ▶', 'TAP'] : ['← / →', 'SPACE'];
    const box = document.createElement('div'); box.className = 'dv-tut';
    box.innerHTML = `<h3>THE JELLY</h3><ol>
      <li><b>FLICK</b> In the air his arm swings up one side (red). Flick the ball to the <u>other</u> side: <kbd>${k[0]}</kbd></li>
      <li><b>KISS IT</b> Then <kbd>${k[1]}</kbd> as the white ring closes on the glass.</li>
      <li>Right side + soft touch = it drops. His side = he probably swats it.</li></ol><button class="btn sm">GOT IT</button>`;
    D.el.querySelector('.dv-card').appendChild(box); mgHold = true;
    await new Promise(r => { const go = () => { removeEventListener('keydown', kk); r(); }; const kk = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); go(); } }; addEventListener('keydown', kk); box.querySelector('button').onclick = go; });
    mgHold = false; try { localStorage.setItem('hd_flick_tut', '1'); } catch (e) { } box.remove();
  }

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
          SFX.play(r === 'bad' || r === 'early' || r === 'late' ? 'bad' : 'good');
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
          const fin = Balance.apply('ft', base, q, null, { perfect: q > .9 }), ok = Math.random() * 100 < fin;   // a perfect free throw almost never misses
          const kind = ok ? (q > .8 ? 'swish' : 'rimin') : (d > g.zone * 2.6 ? 'airball' : 'rimout');
          ball = { t: performance.now(), dur: 1050, kind, tx: kind === 'airball' ? ret.x : kind === 'swish' ? g.RX : g.RX + (ret.x >= g.RX ? 1 : -1) * g.rr * .8, ty: kind === 'airball' ? g.RY + g.rr * 1.4 : g.RY };
          await sleep(650);
          if (kind === 'swish' || kind === 'rimin') { net = 1; SFX.play(kind === 'swish' ? 'swish' : 'rim'); if (kind === 'rimin') setTimeout(() => SFX.play('swish'), 180); if (q > .9) setTimeout(() => green(), kind === 'rimin' ? 180 : 0); } else if (kind === 'rimout') SFX.play('rim');   // green only when a perfect release drops
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
          if (k >= rings) { done = true; off(); const q = acc / rings; sh.close(hits === rings ? (rings > 1 ? 'POSTERIZED!' : 'PERFECT TOUCH') : hits ? 'GOT IT UP' : 'STUFFED', hits >= Math.ceil(rings * .6)).then(() => res({ hits, total: rings, quality: q, perfect: hits === rings && q > .9 })); }
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

    /* 4b. LAYUP — the 1-2 step: two footprints light up on the beat, then RELEASE on the gather.
           A ring shrinks around the ball and meets the target circle at the rim on the release beat.
           o.win = perfect window half-size in seconds (Finishing, contests make it smaller), o.beat = seconds per step. */
    layupStep(layer, o = {}) {
      const beat = o.beat || .34, win = clamp(o.win || .06, .025, .14), T = beat * 2 + .05;
      const sh = mgShell(layer, o.title || 'LAYUP · 1-2 STEP', 'Tap / click / SPACE on the gather — when the ring meets the circle', 'mg-lay');
      sh.body.innerHTML = `<canvas class="pxc" width="160" height="80" style="width:320px;max-width:100%;aspect-ratio:2/1"></canvas><div class="mg-sub">${o.sub || ''}</div>`;
      const cv = sh.body.querySelector('canvas'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
      const foot = (x, y, on, flip) => { const col = on ? '#facc15' : '#334155'; P(x, y, 6, 9, col); P(x + (flip ? 4 : -1), y - 3, 3, 3, col); P(x + (flip ? -1 : 4), y - 3, 3, 3, col); if (on) { c.fillStyle = 'rgba(250,204,21,.25)'; c.fillRect(x - 3, y - 6, 12, 18); } };
      return new Promise(res => {
        let t0 = performance.now() + 450, done = false, step = 0;
        const fin = async (tapAt) => {
          if (done) return; done = true; off();
          const e = tapAt == null ? 1 : Math.abs(tapAt - beat * 2), perfect = e <= win * .5, good = e <= win;
          const q = good ? 1 - e / win * .35 : clamp(.55 - (e - win) / (win * 3), 0, .5);
          SFX.play(good ? 'good' : 'bad');
          await sh.close(tapAt == null ? 'TOO LATE' : perfect ? 'PERFECT GATHER' : good ? 'GOOD TOUCH' : tapAt < beat * 2 ? 'TOO EARLY' : 'TOO LATE', good);
          res({ quality: q, perfect, good, success: good });
        };
        const off = onTap(sh.el, () => { const t = (performance.now() - t0) / 1000; if (t > -.1) fin(t); });
        const draw = now => {
          if (done) return; const t = (now - t0) / 1000;
          if (t > T + win + .25) return fin(null);
          c.fillStyle = '#c88e52'; c.fillRect(0, 0, 160, 80); for (let y = 0; y < 80; y += 4) P(0, y, 160, 1, '#b97f45'); P(0, 62, 160, 1, '#fef3c7');
          // hoop on the right
          P(140, 8, 3, 38, '#475569'); P(124, 10, 18, 14, '#e2e8f0'); P(126, 12, 14, 10, '#93c5fd'); P(118, 26, 14, 2, '#ea580c');
          // footprints: 1, 2 → gather
          const s1 = t >= 0, s2 = t >= beat; foot(30, 60, s1, false); foot(62, 52, s2, true);
          Pixel.text(c, '1', 33, 70, s1 ? '#111827' : '#64748b'); Pixel.text(c, '2', 65, 62, s2 ? '#111827' : '#64748b');
          if (s1 && step === 0) { step = 1; SFX.play('squeak'); } if (s2 && step === 1) { step = 2; SFX.play('squeak'); }
          // the ball rides up toward the rim; a ring shrinks around it and meets the target circle on the release beat
          const k = clamp(t / (beat * 2), 0, 1.2), bx = 22 + k * 98, by = 50 - Math.sin(Math.min(1, k) * Math.PI / 2) * 28, tx = 120, ty = 22;
          c.strokeStyle = '#4ade80'; c.lineWidth = 2; c.beginPath(); c.arc(tx, ty, 6, 0, 7); c.stroke();
          c.strokeStyle = 'rgba(74,222,128,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(tx, ty, 6 + win * 60, 0, 7); c.stroke();
          const rr = 6 + Math.max(0, beat * 2 - t) * 60; c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, Math.max(3, rr), 0, 7); c.stroke();
          P(bx - 2, by - 2, 5, 5, '#0a0a12'); P(bx - 1, by - 2, 3, 5, '#e8651b'); P(bx - 2, by - 1, 5, 3, '#e8651b');
          if (t < 0) Pixel.text(c, 'READY', 80, 6, '#111827', 1, 'center');
          if (t >= beat * 2 - win && t <= beat * 2 + win) Pixel.text(c, 'NOW!', 80, 6, '#14532d', 1, 'center');
          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      });
    },

    /* THE DRIVE (layups), played on the real court with the game's sprites — one stage across three phases:
       1 BLOW-BY  the defender shifts his weight, then gives away the side he covers (lean / reach / arrow at easy settings);
                  go the OTHER way (← → / A D / swipe / on-screen keys) before the timer runs out → { read: 'right'|'wrong'|'late', quality }
       2 GATHER   (sometimes) footprints light up on the floor one by one: ← then → on the beat → { clean, sloppy, travel }
       3 RELEASE  you rise to the rim; press SPACE / tap when the ring hits the green zone at the rim → { quality, perfect, good }
       o.ctx: { venue, us, them, meLook, meNum, defLook, defNum } */
    blowBy(layer, o = {}) {
      const D = driveStage(layer, o), my = D.run = {}; dvPhase(D, 'read');
      const W = o.window || .8, tell = clamp(o.tell == null ? .7 : o.tell, 0, 1), amt = 2 + tell * 6, arrow = tell >= .5, reach = tell >= .25;
      const over = Math.random() < .5 ? -1 : 1, faked = Math.random() < (o.fake || 0), T_SHOW = .6, T_TELL = T_SHOW + (faked ? .45 : 0);
      D.el.dataset.read = -over;   // (the right answer, for automated tests)
      const me = D.me, df = D.df;
      Object.assign(me, { x: 192, y: 162, z: 0, act: null, hasBall: true, face: 1 }); Object.assign(df, { x: 192, y: 124, z: 0, act: null, stance: true, face: -1 });
      D.camT = { x: 192, y: 115, z: 1.35 }; D.under = D.screen = null; dvSub(D, o.sub);   // both players fit under the instruction band
      return (async () => {
        await driveTutorial(D);
        dvSay(D, 'READ THE DEFENDER<small>GO THE OTHER WAY!</small>'); dvKeys(D, ['L', 'R']);
        const t0 = performance.now(); let choice = null, at = 0, shown = 0;
        const side = t => t < T_SHOW ? 0 : faked && t < T_TELL ? -over : over;   // the side his tell shows right now
        D.input = d => { if (choice != null || d === 'T') return; const t = (performance.now() - t0) / 1000; if (t < T_SHOW - .1) return; choice = d === 'L' ? -1 : 1; at = t; dvHit(D, d); };
        D.over = c => {   // easy reads: an arrow over his head shows where his weight is going
          const t = (performance.now() - t0) / 1000, s2 = side(t); if (!s2 || !arrow || choice != null) return;
          const x = Math.round(df.x + s2 * (13 + (t * 8 % 3))), y = Math.round(df.y - 22);   // beside his body, pointing where his weight is going
          for (let i = 0; i < 3; i++) { const ax = x + s2 * i * 4; c.fillStyle = '#000'; c.fillRect(ax - 1, y - 4, 4, 9); c.fillStyle = i === 2 ? '#fecaca' : '#ef4444'; for (let j = -3; j <= 3; j++) c.fillRect(ax + s2 * (3 - Math.abs(j)), y + j, 2, 1); }
        };
        for (;;) {
          const t = (performance.now() - t0) / 1000, s2 = side(t);
          df.x = 192 + Math.sin(t * 5) * (s2 ? .4 : 1.4) + s2 * amt; df.face = s2 || (Math.sin(t * 1.6) > 0 ? 1 : -1);   // shifting his weight, then the tell
          df.act = s2 && reach ? { type: 'reach', t: .16, T: 9, hold: true } : null;
          me.x = 192 + Math.sin(t * 2.3) * 2.5; me.face = Math.sin(t * 1.1) > -.6 ? 1 : -1;                         // you, sizing him up
          if (s2 && s2 !== shown) { shown = s2; SFX.play('squeak', .6); }
          dvTimer(D, t < T_TELL ? 1 : 1 - (t - T_TELL) / W);
          if (choice == null && t > T_TELL + W) { choice = 0; at = t; }
          if (choice != null) break;
          await nextFrame(); if (D.run !== my) return Object.assign({}, MG_FALLBACK);
        }
        D.input = null; D.over = null; dvKeys(D, []); dvSay(D, '');
        const right = choice === -over, q = right ? clamp(1 - (at - T_TELL) / W * .45, .5, 1) : 0, go = choice || over;
        if (right) {   // burst past him
          SFX.play('whoosh'); df.act = null;
          await dvAnim(.42, k => { me.face = go; me.x = 192 + go * 22 * Math.min(1, k * 1.7); me.y = 162 - 50 * k; if (k > .3) df.act = { type: 'stumble', t: k - .3, T: .5, hold: true }; });
          D.R.dust(me.x, me.y, 6);
        } else {         // he slides over and cuts you off
          SFX.play('impact'); D.R.dust(df.x, df.y, 6);
          await dvAnim(.34, k => { df.x = 192 + go * 10 * k; df.y = 124 + 12 * k; me.x = 192 + go * 9 * k; me.y = 162 - 10 * k; df.act = { type: 'reach', t: .16, T: 9, hold: true }; });
          me.act = { type: 'stumble', t: 0, T: .45 };
        }
        await dvFb(D, right ? 'BLOW BY!' : choice === 0 ? 'TOO SLOW — CUT OFF!' : 'CUT OFF!', right);
        dvDone(D, 'read');
        return { read: choice === 0 ? 'late' : right ? 'right' : 'wrong', side: choice, quality: q, faked };
      })();
    },
    gatherStep(layer, o = {}) {
      const D = driveStage(layer, o), my = D.run = {}; dvPhase(D, 'step');
      const beat = o.beat || .34, tol = o.tol || .12, me = D.me, df = D.df, x0 = me.x, y0 = me.y, dir = x0 >= 192 ? -1 : 1;
      const F = [{ x: x0 + dir * 4 - 7, y: y0 - 17, k: 'L', at: beat }, { x: x0 + dir * 10 + 6, y: y0 - 34, k: 'R', at: beat * 2 }];   // ahead of you, left then right
      D.camT = { x: (x0 + 192) / 2, y: y0 - 26, z: 1.7 }; dvSub(D, o.sub);
      return (async () => {
        dvSay(D, 'STEP! STEP!<small>LEFT, THEN RIGHT — ON THE BEAT</small>');
        const t0 = performance.now() + 450, got = [];
        const tNow = () => (performance.now() - t0) / 1000;
        D.input = d => { if (d === 'T' || got.length >= 2) return; const t = tNow(); if (t < -.15) return; const i = got.length, ok = d === F[i].k && Math.abs(t - F[i].at) <= tol;
          got.push({ d, t, ok }); dvHit(D, d); SFX.play(ok ? 'squeak' : 'bad', ok ? 1 : .6); const f = F[i], fx = me.x, fy = me.y; dvAnim(.14, k => { me.x = fx + (f.x - fx) * k; me.y = fy + (f.y - fy) * k; }); };
        D.under = c => {   // the footprints, on the floor under you, lighting up one by one with their key
          const t = tNow();
          F.forEach((f, i) => { const g = got[i], near = !g && Math.abs(t - f.at) <= tol, lit = t >= f.at - .25;
            const col = g ? (g.ok ? '#4ade80' : '#f87171') : near ? '#facc15' : lit ? '#fde68a' : 'rgba(226,232,240,.35)';
            const x = Math.round(f.x), y = Math.round(f.y), m = f.k === 'L' ? -1 : 1;   // a sneaker print: sole + heel, outlined
            c.fillStyle = '#0a0a12'; c.fillRect(x - 3, y - 6, 7, 5); c.fillRect(x - 2 + m, y - 9, 5, 4); c.fillRect(x - 2, y - 1, 5, 4);
            c.fillStyle = col; c.fillRect(x - 2, y - 5, 5, 3); c.fillRect(x - 1 + m, y - 8, 3, 3); c.fillRect(x - 1, y, 3, 2);
            if (near || (!g && lit)) { c.strokeStyle = near ? '#facc15' : 'rgba(253,230,138,.6)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x + .5, y - 3, 8 + (near ? Math.sin(t * 30) : 0), 4, 0, 0, 7); c.stroke(); }
            if (!g || near) Pixel.text(c, f.k, x + m * 9, y - 8, near ? '#facc15' : '#f8fafc', 1, 'center', '#000'); });
        };
        for (;;) {
          const t = tNow(); dvTimer(D, 1 - clamp(t / (beat * 2 + tol), 0, 1));
          dvKeys(D, got.length === 0 ? (t > beat - .3 ? ['L'] : []) : got.length === 1 ? ['R'] : []);
          df.x += ((x0 - dir * 16) - df.x) * .05; df.y += ((y0 - 36) - df.y) * .05; df.face = dir; df.act = { type: 'reach', t: .16, T: 9, hold: true };   // the help defender steps over from the rim side
          if (got.length >= 2 || t > beat * 2 + tol * 3 + .3) break;
          await nextFrame(); if (D.run !== my) return Object.assign({}, MG_FALLBACK);
        }
        D.input = null; dvKeys(D, []); dvSay(D, ''); await sleep(120);
        const errs = [0, 1].map(i => { const g = got[i]; return !g || g.d !== F[i].k ? 9 : Math.abs(g.t - F[i].at); });
        const clean = errs.every(e => e <= tol), mess = errs.some(e => e > tol * 2.5), travel = mess && Math.random() < (o.travel != null ? o.travel : .45);
        if (travel) SFX.play('whistle');
        await dvFb(D, clean ? 'CLEAN STEPS!' : travel ? 'TRAVEL!' : 'OFF-BEAT!', clean);
        D.under = null; dvDone(D, 'step');
        return { clean, sloppy: !clean && !travel, travel, errs };
      })();
    },
    layupStep(layer, o = {}) {
      const D = driveStage(layer, o), my = D.run = {}; dvPhase(D, 'rel');
      const beat = o.beat || .34, win = clamp(o.win || .06, .025, .14), T = beat * 2, me = D.me, df = D.df;
      const x0 = me.x, y0 = me.y, side = x0 >= 192 ? 1 : -1, tx = 192 + side * 7, ty = 70;
      D.camT = { x: 192, y: 52, z: 1.35 }; D.tapAny = true; dvSub(D, o.sub); dvKeys(D, ['T']);   // the rim (and its release ring) high in the frame, you rising toward it
      return (async () => {
        dvSay(D, 'GET UP…', 'low');
        const t0 = performance.now() + 450, tNow = () => (performance.now() - t0) / 1000; let tapAt = null;
        D.input = d => { if (d !== 'T' || tapAt != null) return; const t = tNow(); if (t > -.1) { tapAt = t; dvHit(D, 'T'); } };
        D.screen = c => {   // the release ring sits on the rim: green = good, bright band = perfect
          const z = D.cam.z, rx = 128 + z * (192 - D.cam.x), ry = 72 + z * (PIX.hoop.y - PIX.hoop.z - D.cam.y), t = tNow(), R0 = 7;
          c.strokeStyle = 'rgba(74,222,128,.35)'; c.lineWidth = Math.max(2, win * 120); c.beginPath(); c.arc(rx, ry, R0 + win * 30, 0, 7); c.stroke();
          c.strokeStyle = '#4ade80'; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, R0, 0, 7); c.stroke();
          c.strokeStyle = '#bbf7d0'; c.lineWidth = 1; c.beginPath(); c.arc(rx, ry, R0 + win * 15, 0, 7); c.stroke();
          if (tapAt == null) { const r = R0 + Math.max(0, T - t) * 60; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, Math.max(3, r), 0, 7); c.stroke(); }
          Pixel.text(c, 'PERFECT', rx, ry + R0 + win * 30 + 4, '#4ade80', 1, 'center', '#000');
        };
        for (;;) {
          const t = tNow(), k = clamp(t / T, 0, 1.2);
          me.act = { type: 'layup', t: Math.min(.68, k * .6), T: .7, hold: true }; me.face = side;   // rise toward the rim
          me.x = x0 + (tx - x0) * Math.min(1, k); me.y = y0 + (ty - y0) * Math.min(1, k); me.z = Math.sin(Math.min(1, k) * Math.PI / 2) * 20;
          if (t >= T - win - .18) dvSay(D, 'RELEASE!', 'go low');
          dvTimer(D, 1 - clamp(t / (T + win), 0, 1));
          if (tapAt != null || t > T + win + .25) break;
          await nextFrame(); if (D.run !== my) return Object.assign({}, MG_FALLBACK);
        }
        D.input = null; D.tapAny = false; dvKeys(D, []); dvSay(D, '');
        const e = tapAt == null ? 1 : Math.abs(tapAt - T), perfect = e <= win * .5, good = e <= win;
        const q = good ? 1 - e / win * .35 : clamp(.55 - (e - win) / (win * 3), 0, .5);
        await dvFb(D, tapAt == null ? 'TOO LATE' : perfect ? 'PERFECT RELEASE!' : good ? 'GOOD TOUCH' : tapAt < T ? 'TOO EARLY' : 'TOO LATE', good, 600);
        dvDone(D, 'rel'); closeDrive(layer);
        return { quality: q, perfect, good, success: good };
      })();
    },

    /* FINISH PICK — help is coming: layup or jelly? (inside the drive card; 1 / 2, a tap, or the clock picks the layup) */
    finishPick(layer, o = {}) {
      const D = driveStage(layer, o), my = D.run = {}, opts = o.opts || [], T = o.time || 2.6;
      return (async () => {
        dvSay(D, (o.title || 'HELP IS COMING!') + '<small>PICK YOUR FINISH</small>'); dvKeys(D, []); dvSub(D, o.sub);
        const box = document.createElement('div'); box.className = 'dv-pick';
        box.innerHTML = opts.map((x, i) => `<button class="${x.jelly ? 'jelly' : ''}" data-i="${i}"><kbd>${i + 1}</kbd><span>${x.label}</span><b class="${x.pct >= 55 ? 'hi' : x.pct >= 38 ? 'mid' : 'lo'}">${x.pct}%</b><small>${x.desc || ''}</small></button>`).join('');
        D.el.querySelector('.dv-stage').appendChild(box);
        let pickI = null; const t0 = performance.now();
        const kd = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= opts.length) { e.preventDefault(); pickI = k - 1; } };
        addEventListener('keydown', kd); box.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pickI = +b.dataset.i; }));
        for (;;) { const t = (performance.now() - t0) / 1000; dvTimer(D, 1 - t / T); if (pickI == null && t > T) pickI = 0; if (pickI != null) break; await nextFrame(); if (D.run !== my) { removeEventListener('keydown', kd); box.remove(); return 0; } }
        removeEventListener('keydown', kd); box.querySelector(`[data-i="${pickI}"]`).classList.add('on'); SFX.play('click'); await sleep(220); box.remove();
        return pickI;
      })();
    },
    /* JELLY FLICK — in the air, the shot blocker's arm swings up one side (slow motion).
       ←/→: flick the ball to the OTHER side. Then SPACE / tap when the ring closes on the glass.
       → { side: 'right'|'wrong'|'late', good, perfect, quality } */
    flick(layer, o = {}) {
      const D = driveStage(layer, o), my = D.run = {}, X = o.ctx || {};
      const steps = o.lesson ? ['1 · RISE', '2 · FLICK', '3 · GLASS'] : null;
      if (steps) D.el.querySelectorAll('.dv-steps b').forEach((b, i) => b.textContent = steps[i]); else { const b = D.el.querySelector('.dv-steps b[data-p="rel"]'); if (b) b.textContent = '3 · JELLY'; }
      dvPhase(D, o.lesson ? 'step' : 'rel');
      if (X.defLook) { const th = (X.them && X.them.colors) || ['#1e3a8a', '#e5e7eb']; D.df = Pixel.sprite(Object.assign({}, X.defLook, { num: X.defNum }), th, { x: 192, y: 96 }); }
      const W = clamp(o.window || .9, .35, 2), tol = clamp(o.tol || .11, .05, .25), T2 = .62, arm = o.arm || (Math.random() < .5 ? -1 : 1);
      D.el.dataset.arm = arm;   // (for automated tests)
      const me = D.me, df = D.df, x0 = me.x === 192 ? 214 : me.x, y0 = me.y > 140 ? 118 : me.y, sx = x0 >= 192 ? 1 : -1;
      const rim = { x: 192, y: PIX.hoop.y - PIX.hoop.z };
      Object.assign(me, { act: null, hasBall: false, z: 0 }); Object.assign(df, { x: 192 - sx * 3, y: 92, z: 0, act: null, stance: true, face: sx });
      D.camT = { x: 192, y: 62, z: 1.45 }; dvSub(D, o.sub); D.tapAny = false;
      const ball = { x: x0, y: y0 - 28, show: true }, trail = [];
      let ph = 'rise', choice = null, tapAt = null, armK = 0, tA = 0, tB = 0, flight = 0;
      const hand = s2 => ({ x: me.x + s2 * 8, y: me.y - me.z - 30 });
      D.over = c => {
        // the arm: from his shoulder up toward the ball, on its side; red while it's coming
        if (ph !== 'rise') {
          const sh = { x: df.x + arm * 4, y: df.y - df.z - 27 }, tip = { x: sh.x + arm * (6 + armK * 4), y: sh.y + 10 - armK * 26 };
          c.strokeStyle = '#0a0a12'; c.lineWidth = 5; c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(tip.x, tip.y); c.stroke();
          c.strokeStyle = (X.defLook && X.defLook.skin) || '#8d5a3b'; c.lineWidth = 3; c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(tip.x, tip.y); c.stroke();
          if (ph === 'side') { c.strokeStyle = `rgba(239,68,68,${.5 + Math.sin(performance.now() / 70) * .3})`; c.lineWidth = 1; c.beginPath(); c.arc(tip.x, tip.y, 5, 0, 7); c.stroke();
            Pixel.text(c, 'ARM', tip.x + arm * 10, tip.y - 3, '#fca5a5', 1, 'center', '#000');
            if (o.hint !== false) { const gx = me.x - arm * 22, gy = me.y - me.z - 32, f = Math.floor(performance.now() / 160) % 2; c.fillStyle = f ? '#4ade80' : '#bbf7d0'; for (let j = -3; j <= 3; j++) c.fillRect(gx - arm * (3 - Math.abs(j)) * 2, gy + j, 2, 1); Pixel.text(c, 'HERE', gx, gy + 6, '#86efac', 1, 'center', '#000'); } }
        }
        // the glass target (backboard, on the side you flicked to) + the closing ring
        if (ph === 'glass' || ph === 'fly') {
          const G = { x: rim.x + choice * 9, y: rim.y - 13 };
          c.strokeStyle = '#4ade80'; c.lineWidth = 1; c.beginPath(); c.arc(G.x, G.y, 4, 0, 7); c.stroke(); c.fillStyle = 'rgba(74,222,128,.25)'; c.fillRect(G.x - 2, G.y - 2, 4, 4);
          if (ph === 'glass' && tapAt == null) { const r = 4 + Math.max(0, T2 - tB) * 34; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(G.x, G.y, Math.max(2, r), 0, 7); c.stroke(); Pixel.text(c, 'KISS IT', G.x, G.y - 14, '#bbf7d0', 1, 'center', '#000'); }
        }
        // the ball (+ spin trail off the glass)
        trail.forEach((q, i) => { c.fillStyle = `rgba(253,230,138,${i / trail.length * .6})`; c.fillRect(Math.round(q.x) - 1, Math.round(q.y) - 1, 3, 3); });
        if (ball.show) { c.fillStyle = '#0a0a12'; c.fillRect(Math.round(ball.x) - 3, Math.round(ball.y) - 3, 7, 7); c.fillStyle = '#f97316'; c.fillRect(Math.round(ball.x) - 2, Math.round(ball.y) - 2, 5, 5); c.fillStyle = '#7c2d12'; c.fillRect(Math.round(ball.x), Math.round(ball.y) - 2, 1, 5); }
      };
      D.screen = c => { if (ph === 'side' && o.slow !== false) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, 256, 9); c.fillRect(0, 135, 256, 9); Pixel.text(c, 'SLOW-MO', 6, 137, '#fde68a', 1, 'left'); } };
      return (async () => {
        await flickTutorial(D);
        // 1) rise toward the rim, the big man comes over
        await dvAnim(.42, k => { me.x = lerp(x0, 192 + sx * 12, k); me.y = lerp(y0, 82, k); me.z = Math.sin(k * Math.PI / 2) * 16; me.act = { type: 'layup', t: Math.min(.3, k * .3), T: .7, hold: true }; me.face = -sx;
          df.x = lerp(192 - sx * 3, 192 + sx * 2, k); df.z = Math.sin(k * Math.PI / 2) * 12; df.act = { type: 'block', t: .1, T: 9, hold: true }; Object.assign(ball, hand(sx)); });
        // 2) slow motion: his arm comes up — pick the other side
        ph = 'side'; SFX.play('heartbeat'); dvSay(D, 'HIS ARM IS COMING!<small>FLICK IT THE OTHER WAY</small>', 'go'); dvKeys(D, ['L', 'R']);
        D.input = d => { if (choice != null || d === 'T' || ph !== 'side') return; choice = d === 'L' ? -1 : 1; dvHit(D, d); };
        const t0 = performance.now();
        for (;;) { tA = (performance.now() - t0) / 1000; armK = clamp(tA / W, 0, 1); dvTimer(D, 1 - armK); me.z = 16 + Math.sin(tA * 2) * .4; df.z = 12 + armK * 3;
          if (choice != null || tA > W) break; await nextFrame(); if (D.run !== my) return Object.assign({}, MG_FALLBACK, { side: 'late' }); }
        D.input = null; dvKeys(D, []);
        const right = choice != null && choice === -arm, side = choice == null ? 'late' : right ? 'right' : 'wrong';
        if (choice == null) choice = arm;
        SFX.play('whoosh'); me.face = choice;   // the twist: the ball swings to the other hand
        await dvAnim(.16, k => { const a = hand(-choice), b = hand(choice); ball.x = lerp(a.x, b.x, k); ball.y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 4; });
        let e = 1, perfect = false, good = false;
        if (side !== 'late') {
          // 3) kiss it off the glass: tap as the ring closes
          ph = 'glass'; dvSay(D, 'NOW — OFF THE GLASS!', 'go low'); dvKeys(D, ['T']); D.tapAny = true;
          D.input = d => { if (d !== 'T' || tapAt != null) return; tapAt = tB; dvHit(D, 'T'); };
          const t1 = performance.now();
          for (;;) { tB = (performance.now() - t1) / 1000; dvTimer(D, 1 - clamp(tB / (T2 + tol), 0, 1)); Object.assign(ball, hand(choice)); if (tapAt != null || tB > T2 + tol + .2) break; await nextFrame(); if (D.run !== my) return Object.assign({}, MG_FALLBACK, { side }); }
          D.input = null; D.tapAny = false; dvKeys(D, []);
          e = tapAt == null ? 1 : Math.abs(tapAt - T2); perfect = e <= tol * .45; good = e <= tol;
        }
        dvSay(D, '');
        // the flick: off the glass and down — or straight into his hand
        ph = 'fly'; const from = { x: ball.x, y: ball.y }, G = { x: rim.x + choice * 9, y: rim.y - 13 };
        if (side === 'right') {
          await dvAnim(.3, k => { ball.x = lerp(from.x, G.x, k); ball.y = lerp(from.y, G.y, k) - Math.sin(k * Math.PI) * 6; trail.push({ x: ball.x, y: ball.y }); if (trail.length > 10) trail.shift(); });
          SFX.play('kiss'); D.R.burst && D.R.burst(G.x + D.V.ox, G.y, '#fde68a', 8, 30);
          await dvAnim(.22, k => { ball.x = lerp(G.x, rim.x, k); ball.y = lerp(G.y, rim.y + 1, k); trail.push({ x: ball.x, y: ball.y }); if (trail.length > 10) trail.shift(); });
        } else {
          const tip = { x: df.x + arm * 8, y: df.y - df.z - 40 };
          await dvAnim(.22, k => { ball.x = lerp(from.x, tip.x, k); ball.y = lerp(from.y, tip.y, k); });
          SFX.play('slap'); D.R.dust && D.R.dust(df.x, df.y, 4);
        }
        ph = 'done';
        const q = side === 'right' ? (good ? 1 - e / tol * .35 : clamp(.55 - (e - tol) / (tol * 3), .1, .5)) : side === 'wrong' ? .1 : 0;
        await dvFb(D, side === 'late' ? 'TOO SLOW!' : side === 'wrong' ? 'HIS SIDE!' : perfect ? 'PERFECT JELLY!' : good ? 'SOFT TOUCH!' : tapAt == null ? 'NO TOUCH — TOO LATE' : tapAt < T2 ? 'TOO HARD — EARLY' : 'TOO SOFT — LATE', side === 'right' && good, 650);
        dvDone(D, o.lesson ? 'step' : 'rel'); D.over = D.screen = null; trail.length = 0;
        return { side, good: side === 'right' && good, perfect: side === 'right' && perfect, quality: q, arm, choice };
      })();
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
          if (d === move) { finish(true, clamp(1 - rt / win, .2, 1), rt < win * .4 ? 'LOCKED UP!' : 'STAYED IN FRONT'); }
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
        const only = o.target != null && o.target < 4 ? o.target : null;
        if (only != null) mates.forEach((m, i) => { if (i !== only) m.classList.add('dim'); else m.classList.add('target'); });
        const setOpen = () => { mates.forEach(m => m.classList.remove('open')); let n; if (only != null) n = only; else do { n = Math.floor(Math.random() * 4); } while (n === open); open = n; openAt = performance.now(); mates[n].classList.add('open'); SFX.play('tick'); };
        const fin = async (ok, q, msg) => { if (done) return; done = true; offK(); SFX.play(ok ? 'pass' : 'bad'); await sh.close(msg, ok); res({ success: ok, quality: q }); };
        const choose = i => { if (done) return; if (i === open) fin(true, clamp(1 - (performance.now() - openAt) / win, .3, 1), 'DIME!'); else fin(false, 0, only != null && i === only ? 'TELEGRAPHED — TOO EARLY' : 'INTERCEPTED'); };
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
  /* ---------- MINIGAME GUARD — one minigame at a time, and it always hands control back ----------
     If a minigame throws or stops responding (its animation loop died), it resolves with a neutral result after
     MG_LIMIT seconds of visible time; its card is removed and its key / pointer listeners are released. */
  const MG_LIMIT = { freeThrow: 150 }, MG_FALLBACK = { success: false, quality: .35, perfect: false, good: false, hits: 0, total: 3, made: 0, result: 'late', read: 'late', clean: false, sloppy: true, travel: false };
  let mgActive = null;
  const busyElsewhere = () => !!(mgActive || document.querySelector('.arc, .cs:not(.cs-hl), .tkc'));
  function guardMG(name, fn, layer, o) {
    if (mgActive) mgActive.kill('another minigame started');
    return new Promise(res => {
      let done = false, secs = 0;
      const clean = () => { mgOffs.forEach(f => f()); mgOffs.clear(); if (layer) { layer.querySelectorAll('.mg').forEach(e => e.remove()); layer.classList.remove('on', 'ftmode'); } };
      const end = (v, why, silent) => { if (done) return; done = true; clearInterval(iv); removeEventListener('error', onErr); if (mgActive === tok) mgActive = null;
        if (why) { console.warn(`minigame ${name}: ${why}`); clean(); } if (!silent) res(v || Object.assign({}, MG_FALLBACK)); };
      const tok = { name, kill: why => end(null, why, true) }; mgActive = tok;
      const onErr = e => { if (/\/js\/match\.js/.test(e.filename || '')) end(null, 'error: ' + e.message); }; addEventListener('error', onErr);
      const iv = setInterval(() => { if (!document.hidden && !mgHold && ++secs > (MG_LIMIT[name] || 25)) end(null, 'timed out'); }, 1000);
      try { Promise.resolve(fn(layer, o)).then(v => end(v), e => end(null, 'error: ' + (e && e.message))); } catch (e) { end(null, 'error: ' + e.message); }
    });
  }
  for (const k of Object.keys(MG)) { const fn = MG[k]; MG[k] = (layer, o = {}) => guardMG(k, fn, layer, o); }
  MG.close = layer => closeDrive(layer);   // close the drive card (not a minigame)

  const STYLE_EXPR = { ego: 'fierce', brag: 'fierce', needle: 'fierce', joke: 'smile', calm: 'determined', respect: 'determined', honest: 'determined', effort: 'determined', team: 'smile', specific: 'determined', humble: 'neutral', excuse: 'sad', argue: 'angry', insult: 'angry', sarcasm: 'smile' };
  function zoomCourt(court, to, ms) { return new Promise(res => { if (!court) return res(); const z0 = court.zoom, t0 = performance.now(); const f = now => { const k = Math.min(1, (now - t0) / ms); court.zoom = z0 + (to - z0) * EASE.io(k); if (k < 1 && court.alive) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); }
  async function talkSceneCore(o, env) {   // env: { court (optional), meLook, first, last, beat(), waitInput(setup) }
    const court = env.court, beat = env.beat || (() => { }), waitInput = env.waitInput, meLook = env.meLook, PH = 112;
    const el = document.createElement('div'); el.className = 'tkc';
    el.innerHTML = `<div class="tkc-dim"></div>
      <div class="tkc-bar top"><b class="tkc-title">${escH(o.title)}</b><div class="tk-gauge${o.ego ? ' ego' : ''}"><span>${o.gaugeLabel}</span><div class="tk-bar"><i style="width:${Math.min(100, o.g)}%"></i></div><em class="tk-delta"></em></div></div>
      <div class="tkc-stage">
        <div class="tkc-p me"><span class="tkc-tag">${escH(env.first + ' ' + env.last)}</span><canvas></canvas></div>
        <div class="tkc-box"><b class="tkc-who"></b><p class="tkc-line"></p><i class="tkc-more">▼</i></div>
        <div class="tkc-p them"><span class="tkc-tag">${escH(o.name)}<small>${escH(o.trait || '')}</small></span><canvas></canvas></div>
      </div>
      <div class="tkc-bar bot"><div class="tkc-opts mp-opts"></div></div>`;
    document.body.appendChild(el);
    const q = sel => el.querySelector(sel), side = { me: { el: q('.tkc-p.me'), look: meLook, cur: null }, them: { el: q('.tkc-p.them'), look: o.look || meLook, cur: null } };
    const frames = async (who, expr) => { try { return await Promise.race([Cutscene.portrait(side[who].look, expr, 'bust', PH), sleep(2500).then(() => null)]); } catch (e) { return null; } };
    const paint = (who, frame) => { const S = side[who], F = S.cur && S.cur[frame]; if (!F) return; const cv = S.el.querySelector('canvas'); if (cv.width !== F.cv.width) { cv.width = F.cv.width; cv.height = F.cv.height; } const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(F.cv, 0, 0); };
    const expr = async (who, e) => { const f = await frames(who, e); if (f) { side[who].cur = f; paint(who, 'base'); } };
    // in: pause + push in, bars slide, portraits slide in from the sides
    if (court) court.stopT = 99; const z0 = court ? court.zoom : 1; SFX.crowd.duck(true); SFX.play('whoosh');
    await Promise.all([expr('me', 'neutral'), expr('them', o.startExpr || 'neutral')]);
    requestAnimationFrame(() => el.classList.add('in')); zoomCourt(court, 1.45, 450);
    let blinkT = 0; const blinker = setInterval(() => { ['me', 'them'].forEach(w => { if (!side[w].talking && Math.random() < .12) { paint(w, 'blink'); setTimeout(() => !side[w].talking && paint(w, 'base'), 120); } }); }, 400);
    await sleep(380);
    let skipLine = false; q('.tkc-box').addEventListener('pointerdown', () => { skipLine = true; });
    const api = {
      /* one line, typewriter style; the speaker lights up and talks */
      async say(who, text, e, voice) {
        beat(); if (e) await expr(who, e);
        el.querySelectorAll('.tkc-p').forEach(p => p.classList.toggle('spk', p === side[who].el)); el.classList.toggle('me-spk', who === 'me');
        q('.tkc-who').textContent = who === 'me' ? env.first.toUpperCase() : o.name.toUpperCase(); q('.tkc-who').className = 'tkc-who ' + who;
        const line = q('.tkc-line'); line.textContent = ''; q('.tkc-more').classList.remove('on'); skipLine = false; side[who].talking = true;
        for (let i = 1; i <= text.length; i++) {
          if (skipLine || !el.isConnected) { line.textContent = text; break; }
          line.textContent = text.slice(0, i); if (i % 2 === 0 && /[a-z0-9]/i.test(text[i - 1])) { SFX.play('blip', voice); paint(who, (i / 2) % 2 ? 'talk' : 'base'); }
          await sleep(26);
        }
        side[who].talking = false; paint(who, 'base'); q('.tkc-more').classList.add('on'); beat();
      },
      /* the reply choices (keys 1–3 or tap) — returns the index */
      ask(opts) {
        const box = q('.tkc-opts'); box.innerHTML = opts.map((t, i) => `<button class="opt talk-opt" data-i="${i}"><kbd>${i + 1}</kbd><span class="opt-l">${escH(t)}</span></button>`).join(''); box.classList.add('on');
        return waitInput((res) => { const kd = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= opts.length) res(n - 1); }; addEventListener('keydown', kd); box.querySelectorAll('.talk-opt').forEach(b => b.onclick = () => res(+b.dataset.i)); return () => removeEventListener('keydown', kd); })
          .then(i => { box.querySelectorAll('.talk-opt').forEach((b, j) => { b.disabled = true; if (j === i) b.classList.add('picked'); }); setTimeout(() => box.classList.remove('on'), 250); return i; });
      },
      face: (who, e) => expr(who, e),
      gauge(g, delta, good) { const bar = q('.tk-bar i'), dl = q('.tk-delta'); bar.style.width = Math.min(100, g) + '%'; dl.textContent = delta; dl.className = 'tk-delta ' + (good ? 'good' : 'bad'); void dl.offsetWidth; dl.classList.add('pop'); el.classList.remove('hit-good', 'hit-bad'); void el.offsetWidth; el.classList.add(good ? 'hit-good' : 'hit-bad'); },
      async close() {
        clearInterval(blinker); el.classList.remove('in'); el.classList.add('out'); await zoomCourt(court, z0 || 1, 420);
        el.remove(); if (court) court.stopT = 0; SFX.crowd.duck(false); beat();
      },
    };
    return api;
  }

  /* A conversation outside a game (story nodes: camp evaluations, film sessions…) — the same cutscene, gauge and personalities.
     o: { who: TALK personality id, script: TALK.scripts key, look, name, title, colors:[jersey, trim] } → { win, g, backfires, ended } */
  async function storyTalk(o) {
    const s = Game.state, P = TALK.personalities[o.who], script = TALK.scripts[o.script]; if (!P || !script) return { win: true, g: 60 };
    const ego = P.kind === 'rival', team = o.colors || ['#1e3a8a', '#dc2626']; let g = ego ? 100 : P.start, backfires = 0, ended = false;
    const fillT = t => Engine.text(String(t).replace(/\{first\}/g, s.player.first).replace(/\{last\}/g, s.player.last).replace(/\{num\}/g, s.player.num), s);
    const waitInput = setup => new Promise(res => { let rm = null; rm = setup(v => { rm && rm(); res(v); }, () => rm && rm()); });
    const voice = { f: P.kind === 'ref' ? 160 : ego ? 330 : P.kind === 'mate' ? 240 : 140, w: 'square', g: .035 }, myVoice = { f: 280, w: 'square', g: .03 };
    const T = await talkSceneCore({ title: o.title || (o.name || P.name || ''), name: o.name || P.name || 'Coach', trait: P.trait, look: o.look, ego, g, gaugeLabel: ego ? 'EGO' : P.kind === 'mate' ? 'TRUST' : 'PATIENCE', startExpr: ego ? 'smile' : 'neutral' },
      { court: null, meLook: Object.assign({}, Engine.look(s), { num: s.player.num, jersey: team[0], trim: team[1], outfit: 'jersey' }), first: s.player.first, last: s.player.last, waitInput });
    try {
      for (let k = 0; k < script.length && !ended; k++) {
        const ex = script[k], opts = ex.opts.slice().sort(() => Math.random() - .5);
        await T.say('them', fillT(ex.say), ego ? 'smile' : k ? 'determined' : null, voice);
        const pickI = await T.ask(opts.map(x => fillT(x[1])));
        const style = opts[pickI][0], v = Math.round((P.styles[style] || 0) + rnd(-3, 3)), good = v > 0;
        await T.say('me', fillT(opts[pickI][1]), STYLE_EXPR[style] || 'determined', myVoice);
        if (ego) g = clamp(g - v, 0, 130); else g = clamp(g + v, 0, 100); if (!good) backfires++;
        T.gauge(g, (ego ? (good ? '−' : '+') : (good ? '+' : '−')) + Math.abs(v), good); SFX.play(good ? 'good' : 'bad');
        await T.say('them', pick(good ? P.good : P.bad), ego ? (good ? 'angry' : 'smile') : (good ? 'smile' : 'angry'), voice);
        T.face('me', good ? 'smile' : 'shocked'); await sleep(600);
        if (v <= TALK.endAt || (!ego && g <= 0)) ended = true;
      }
    } finally { await T.close(); }
    return { win: ego ? g <= 60 : !ended && g >= 60, g, backfires, ended };
  }

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
    college: { periods: 2, periodMin: 20, pts: 72, label: 'H', shot: 30, bg: .7, xp: 115 },   // Chapter 3 routes
    euro:   { periods: 4, periodMin: 10, pts: 80, label: 'Q', shot: 24, bg: .75, xp: 120 },
    dev:    { periods: 4, periodMin: 12, pts: 104, label: 'Q', shot: 24, bg: .85, xp: 120 },
  };
  /* Names keep their capitalization; every sentence starts with a capital letter. */
  const properName = n => String(n || '').replace(/(^|[\s\-'’.])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const sentence = t => String(t).replace(/^((?:\s|<[^>]+>|[^\w<])*)([a-z])/, (m, a, b) => a + b.toUpperCase());
  const escH = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* two teams in near-identical colors: the opponent wears its alternate (light) kit */
  function kits(cfg) {
    const rgb = h => { h = (h || '#000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
    const d = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
    const u = cfg.us && cfg.us.colors, t = cfg.them && cfg.them.colors;
    if (!u || !t || d(u[0], t[0]) > 120) return;
    const alt = [t[1], t[2], '#f8fafc'].find(c => c && d(c, u[0]) > 140) || '#f8fafc';
    cfg.them = Object.assign({}, cfg.them, { colors: [alt, t[0], t[2] || t[1]] });
  }
  async function play(cfg) {
    const s = Game.state, D = DIFFICULTY[s.difficulty];
    kits(cfg);
    /* cfg.target = "first to N" pickup game (normal mode); cfg.size = players per side (3 = 3v3, 1 = 1v1) */
    const L = cfg.target ? Object.assign({}, LEVELS[cfg.level] || LEVELS.street, { pts: cfg.target * 1.7, bg: 0 }) : (LEVELS[cfg.level] || LEVELS.street);
    const size = Math.max(1, Math.min(5, cfg.size || 5));
    const FULL = !!cfg.fullArcade && typeof Arcade !== 'undefined' && !!Arcade.play;   // pickups: the whole game is played live in arcade mode
    const n = (cfg.moments || 9) + (!cfg.target && !FULL && size >= 5 ? (BALANCE.arcade.segments.extraMoments || 0) : 0), oppR = cfg.oppRating || 45, diffShift = BALANCE.defense[s.difficulty] || 0;
    const myOvr = Engine.ovr(s), usR = cfg.usRating || (size === 1 ? myOvr : Math.round(myOvr * .45 + (cfg.mateRating || 42) * .55));
    const star = (cfg.them && cfg.them.star) || { name: (cfg.them.roster || ['Their best'])[0], perD: oppR, intD: oppR };
    const C = STORY.commentary, ME = Balance.userStats(s), myName = properName(s.player.last);
    const DEF = Balance.profile(oppR, { perD: star.perD || oppR, intD: star.intD || oppR });   // your defender
    const THEM = Balance.profile(oppR + 2);                                                     // their scorer
    const MATE = Balance.profile(cfg.mateRating || 45);                                         // your teammates
    const st = {
      us: 0, them: 0, i: 0, tutI: 0, tutDone: false, box: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, to: 0 },
      succ: 0, att: 0, streak: 0, fire: false, sig: 0, sigUsed: false, sigUses: 0, mirror: 0, zone: false, postponed: false, fatigue: s.meta.fatigue * .4, clutchN: 0, clutchW: 0, perfects: 0, highlights: [],
      counters: {}, gameWinner: false, lastType: '', posterizers: 0, clutch: false, last: false, fb: 0,
      wUses: {}, waitInput: 0, inputOffs: new Set(), beatAt: 0, oppSig: 0, starRun: 0, takeover: 0, closeN: 0, closeKinds: {}, mateMakes: 0, wMini: {}, run: { side: null, pts: 0 }, talkN: 0, talkAt: -9, talkQ: null, failRun: 0, bench: 0, nextBonus: null, rattled: 0, shaken: 0, refFavor: false, minutes: false,
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
        <div class="match-title"><b>${escH(cfg.title || 'Game')}</b>${cfg.sub ? ' · ' + escH(cfg.sub) : ''}<span class="mom-count" id="momCount"></span><button class="fs-btn" id="fsBtn" title="Fullscreen" aria-label="Toggle fullscreen">⛶</button></div>
        <div class="match-main">
          <div class="court-wrap" id="courtWrap"><canvas id="court"></canvas><div class="vignette" id="vig"></div><div class="court-banner" id="banner"></div><div class="mg-layer" id="mg"></div></div>
          <aside class="pbp glass">
            <div class="statline" id="statline"></div>
            <div class="meters"><div class="mini-meter"><span>WEAPON</span><div class="bar sig"><i id="sigBar"></i></div></div><div class="mini-meter"><span>FATIGUE</span><div class="bar fat"><i id="fatBar"></i></div></div></div>
            <div class="pbp-head pbp-tabs"><button class="on" data-pv="pbp">PLAY-BY-PLAY</button><button data-pv="box">BOX SCORE</button></div><ol class="pbp-list" id="pbp"></ol><div class="box-live" id="boxLive" hidden></div>
          </aside>
        </div>
        <div class="moment-panel glass" id="panel"></div>
      </div>`, 'match');
    SFX.music('game'); UI.setBg('matchbg', cfg.us.abbr);
    const $ = id => document.getElementById(id);
    // fullscreen: remembered from last time, otherwise offered (non-blocking) at tip-off
    $('fsBtn').onclick = e => { e.currentTarget.blur(); UI.setFullscreen(!UI.isFull()); }; $('fsBtn').classList.toggle('on', UI.isFull());
    const offerFs = () => { if (UI.fsPref() === '1') { if (!UI.isFull()) UI.setFullscreen(true); return; } if (UI.isFull() || !$('courtWrap')) return; const of = document.createElement('div'); of.className = 'fs-offer'; of.innerHTML = '<b>PLAY FULLSCREEN?</b><button class="btn primary sm" data-f="1">⛶ Fullscreen</button><button class="btn ghost sm" data-f="0">Not now</button>';
      $('courtWrap').appendChild(of); const close = () => { of.classList.add('out'); setTimeout(() => of.remove(), 300); }; of.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.f === '1') UI.setFullscreen(true); close(); }; setTimeout(close, 7000); };
    const court = new Court($('court'), cfg.us, cfg.them, cfg.venueId && VENUES[cfg.venueId] ? cfg.venueId : Venues.forMatch(cfg));
    document.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => { document.querySelectorAll('[data-pv]').forEach(x => x.classList.toggle('on', x === b)); $('pbp').hidden = b.dataset.pv !== 'pbp'; $('boxLive').hidden = b.dataset.pv !== 'box'; if (b.dataset.pv === 'box') renderLiveBox(); });

    /* ---------- roster sprites ---------- */
    const lk = Engine.look(s), myIdx = ['PG', 'SG', 'SF', 'PF', 'C'].indexOf(s.player.pos);
    const OFF = [[0, 29], [16, 21], [-16, 21], [-20, 6], [6, 9]];
    const mateNames = size > 1 ? (cfg.us.roster || []).slice(0, 4) : [];
    const themNames = (cfg.them.roster || []).slice(0, 5);
    // same look per name as in arcade play (Art.lookFromSeed(name)), so switching views is seamless
    const mk = (team, name, i) => { const seed = Object.assign(Art.lookFromSeed(name || (team === 'us' ? cfg.us.abbr : cfg.them.abbr) + i), ((team === 'us' ? cfg.us : cfg.them).looks || {})[name]); return { team, name, look: seed, skin: seed.skin, hair: seed.hairColor, num: seed.num, headband: seed.headband }; };
    let mi = 0;
    const usP = [0, 1, 2, 3, 4].map(i => i === myIdx ? Object.assign(mk('us', 'You', i), { isUser: true, look: lk, skin: lk.skin, hair: lk.hairColor, num: s.player.num, headband: lk.headband }) : Object.assign(mk('us', mateNames[mi++] || 'Teammate ' + i, i), { tag: '' }));
    const themP = [0, 1, 2, 3, 4].map(i => mk('them', themNames[i] || 'Defender ' + i, i));
    const starIdx = Math.max(0, themNames.indexOf(star.name)); themP[starIdx].tag = star.name.split(' ').slice(-1)[0];
    court.setPlayers([...usP, ...themP]);
    if (typeof Cutscene !== 'undefined' && Cutscene.prep) Cutscene.prep(lk);   // portraits for mini cutscenes
    const U = court.players[myIdx], STAR = court.players.slice(5)[starIdx];
    let US = court.players.slice(0, 5), TH = court.players.slice(5);
    if (size < 5) {   // small-sided pickup: you + teammates vs their star + crew
      US = [U].concat(US.filter(p => p !== U).slice(0, size - 1)); TH = [STAR].concat(TH.filter(p => p !== STAR).slice(0, size - 1));
      court.players.forEach(p => { p.hidden = !US.includes(p) && !TH.includes(p); });
    }
    const MATES = () => US.filter(p => !p.isUser);
    /* every player on the floor: his own stats (team rating + style), weapons and box-score line */
    const nbox = () => ({ pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, to: 0 });
    const shortOf = n => properName(String(n || '').replace(/"[^"]*"\s*/, '').trim().split(' ').slice(-1)[0] || n);
    court.players.forEach(p => {
      if (p.isUser) { p.stats = ME; p.weapons = Engine.weapons(s).map(x => x.id); p.box = st.box; p.full = `${s.player.first} ${s.player.last}`; p.short = myName; p.role = 'you'; return; }
      const named = p.name && !/^(Teammate|Defender) \d/.test(p.name), N = Weapons.npc(named ? p.name : (p.team === 'us' ? cfg.us.abbr : cfg.them.abbr) + p.name, p.team === 'us' ? (cfg.mateRating || 45) : oppR, p === STAR);
      p.stats = N.stats; p.weapons = N.weapons; p.role = N.role; p.box = nbox(); p.full = named ? p.name : (p.team === 'us' ? cfg.us.abbr : cfg.them.abbr) + ' ' + p.name.split(' ').pop(); p.short = named ? shortOf(p.name) : p.full;
    });
    if (typeof Cutscene !== 'undefined' && Cutscene.prep) [STAR, ...US.filter(p => !p.isUser)].forEach(p => Cutscene.prep(p.look));
    STAR.stats.perD = Math.max(STAR.stats.perD, DEF.perD); STAR.stats.intD = Math.max(STAR.stats.intD, DEF.intD);
    const rest = arr => arr.filter(p => p !== U && p !== STAR);
    /* who guards whom: you and their star, everyone else in order */
    const opp = p => { if (p === U) return STAR; if (p === STAR) return U; const mine = p.team === 'us' ? US : TH, other = p.team === 'us' ? TH : US, i = rest(mine).indexOf(p); return rest(other)[i] || (p.team === 'us' ? STAR : U); };
    function shotBox(p, made, three) { const b = p && p.box; if (!b || p.isUser) return; b.fga++; if (three) b.tpa++; if (made) { b.fgm++; b.pts += three ? 3 : 2; if (three) b.tpm++; } }

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
    const beat = () => { st.beatAt = performance.now(); };
    const pbp = (txt, cls = '') => { beat(); const li = document.createElement('li'); li.className = cls; li.innerHTML = `<time>${clockStr()}</time>${sentence(txt)}`; $('pbp').prepend(li); };
    const banner = async (txt, cls = '', ms = 1300) => { beat(); const el = $('banner'); el.className = 'court-banner show ' + cls; el.innerHTML = txt; await sleep(ms); el.className = 'court-banner'; };
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
      if (!$('boxLive').hidden) renderLiveBox();
    }
    /* live box score for both teams (aside tab) */
    function renderLiveBox() {
      const row = p => `<tr class="${p.isUser ? 'me' : ''}"><td>${escH(p.isUser ? myName : p.short || p.name)}${p === STAR ? ' ★' : ''}</td><td>${p.box.pts}</td><td>${p.box.reb}</td><td>${p.box.ast}</td><td>${p.box.fgm}/${p.box.fga}</td></tr>`;
      const tbl = (nm, list, sc) => `<div class="bl-team"><b>${escH(nm)} · ${sc}</b><table><tr><th></th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th></tr>${list.map(row).join('')}</table></div>`;
      $('boxLive').innerHTML = tbl(cfg.us.abbr, US, st.us) + tbl(cfg.them.abbr, TH, st.them) + '<small class="muted">Visible plays only — the rest fills in at the final buzzer.</small>';
    }
    /* pickups ("first to N"): every real basket counts — the first team to reach the target wins on the spot */
    const PICK = !!cfg.target;
    const FEAT = typeof Features !== 'undefined';
    const TUT = !!cfg.tutorial && typeof Tutorial !== 'undefined';   // the first Kai game teaches the game (js/tutorial.js)
    const tutOn = () => TUT && !st.tutDone;   // unlockable features (js/features.js): playbook, duo moves, the jelly
    function addPts(side, p, info) {
      if (!p || st.done) return;
      if (tutOn() && PICK && st[side] + p > cfg.target - 2) { p = Math.max(0, cfg.target - 2 - st[side]); if (!p) return; }   // nobody wins (or loses) before the tutorial is covered
      const lead0 = side === 'us' ? st.us - st.them : st.them - st.us;
      if (side === 'us') st.us += p; else st.them += p;
      // the record of the play (who, what, where, when) — the deciding one becomes the game-winner cutscene
      const P = Object.assign({ side, pts: p, clock: Math.max(0, Math.round(clk.rem * 10) / 10), us: st.us, them: st.them }, info || { kind: p === 1 ? 'ft' : p === 3 ? 'three' : 'layup' });
      if (P.buzzer == null) P.buzzer = (st.last || st.finalSeg) && P.clock <= .5;
      st.lastPlay = P;
      if (PICK ? st[side] >= cfg.target : (st.last || st.finalSeg || st.ot) && lead0 <= 0 && lead0 + p > 0) { if (side === 'us') st.gwPlay = P; else st.lwPlay = P; }
      // momentum runs (visible baskets in a row for one side)
      if (st.run.side === side) st.run.pts += p; else st.run = { side, pts: p, shown: false };
      if (st.run.pts >= 8 && !st.run.shown && !st.done) { st.run.shown = true; const ours = side === 'us', sl = STAR.look;
        court.highlight('run', ours ? `${st.run.pts}-0 RUN!` : `${cfg.them.abbr} ${st.run.pts}-0 RUN`, 450, ours ? { sub: `${st.run.pts}-0` } : { look: sl, name: STAR.full, colors: cfg.them.colors, sub: `${st.run.pts}-0` });
        if (!ours) queueTalk('coach', 1, 'play'); }
      if (PICK && st[side] >= cfg.target && !(cfg.jam && st.inSeg)) { st.done = side; if (side === 'us' && st.them >= cfg.target - 4) { st.gameWinner = true; cnt('gameWinners'); st.highlights.push('Hit the game-winner'); } }
      updBug(); const el = $(side === 'us' ? 'sbUs' : 'sbThem'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
    const who = p => p ? { name: p.isUser ? `${s.player.first} ${s.player.last}` : (p.full || p.name), short: p.isUser ? myName : p.short, look: p.look, num: p.isUser ? s.player.num : p.num, isUser: !!p.isUser } : null;
    const KIND_OF = { catch3: 'three', pull3: 'three', catchMid: 'mid', pullMid: 'mid', fade: 'fade', hook: 'hook', layup: 'layup', dunk: 'dunk', jelly: 'jelly', ft: 'ft' };
    /* a play by p: kind = three | deep | mid | fade | hook | layup | jelly | dunk | putback | ft | block | steal | stop; spot in venue pixels */
    function playOf(p, kind, o = {}) {
      const ft = Math.hypot(p.x - HOOP.x, (p.y - HOOP.y));
      if (kind === 'three' && ft >= 26.5) kind = 'deep';
      return { kind, by: who(p), px: court.X(p.x) - court.V.ox, py: court.Y(p.y), ft, def: who(o.def !== undefined ? o.def : opp(p)), ast: who(o.ast || null), poster: !!o.poster, putback: !!o.putback };
    }
    /* an arcade play (js/arcade.js records it) → the same shape, with the court's own sprites when we can find them */
    function fromArc(P) {
      if (!P) return null;
      const ad = d => d && (d.isUser ? who(U) : (() => { const q = court.players.find(x => x.full === d.name || x.name === d.name); return q ? who(q) : { name: d.name, short: shortOf(d.name), look: d.look, num: d.num }; })());
      return { kind: P.kind, by: ad(P.by), def: ad(P.def || P.vs), ast: ad(P.ast), px: P.x, py: P.y, ft: P.ft, clock: Math.round((P.clock || 0) * 10) / 10, buzzer: !!P.buzzer, arcade: true };
    }
    function success(big) {
      st.failRun = 0; st.succ++; st.att++; st.streak++; if (!st.sigUsed) st.sig++;
      if (st.streak >= 3 && !st.fire) { st.fire = true; st.talkEv = 'me_hot'; court.fire = true; pbp(`🔥 <b>${myName} is ON FIRE!</b>`, 'hot'); banner('🔥 ON FIRE', 'fire'); SFX.play('roar'); }
      court.excite = Math.min(1, court.excite + (big ? .5 : .25)); updBug();
    }
    function fail() { st.failRun++; if (st.failRun >= 2) st.talkEv = 'me_cold'; if (st.failRun >= 3) { st.failRun = 0; queueTalk('coach', .8, 'argue'); } st.att++; st.streak = 0; if (st.fire) { st.fire = false; court.fire = false; pbp('The fire cools off.', 'cold'); } court.excite = Math.max(.2, court.excite - .1); updBug(); }
    const tire = () => { st.fatigue = Math.min(100, st.fatigue + (100 - Engine.attr(s, 'stam')) / 14 + 1.5); court.sweaty = st.fatigue > 50; };
    const roll = p => Math.random() * 100 < p;

    /* ---------- the % for an action (see js/balance.js) ---------- */
    const WPN = Engine.weaponOf(s), APE = Engine.ape(s);
    const sigReady = () => st.sig >= WPN.charge && !st.sigUsed;
    const MGX = k => Engine.passiveMg(s, k) * (st.zone ? 1.3 : 1);
    const WIN = () => D.window;
    const KEYMAP = { catch3: 'three', pull3: 'three', catchMid: 'mid', pullMid: 'mid', fade: 'mid', layup: 'finish', jelly: 'finish', dunk: 'dunk', hook: 'str', pass: 'pass', steal: 'steal', block: 'intD', stop: 'perD', contest: 'perD', charge: 'iq', rebound: 'reb', ft: 'ft' };
    function bonuses(action) {
      const key = KEYMAP[action], out = [], arch = Engine.archOf(s), m = arch.passive.mods || {};
      const pv = (m[key] || 0) + (m.all || 0); if (pv) out.push({ label: arch.passive.name, v: pv });
      if ((action === 'catch3' || action === 'pull3') && st.clutch && m.clutch3) out.push({ label: arch.passive.name + ' (clutch)', v: m.clutch3 });
      const bb = Engine.badgeBonus(s, key); if (bb) out.push({ label: 'Badges', v: bb });
      if (Engine.hasSpecial(s, 'misdirection') && st.i < 3 && action !== 'ft') out.push({ label: 'Misdirection', v: 12 });
      if (Engine.hasSpecial(s, 'mirror') && st.mirror && ['three', 'mid', 'finish', 'dunk', 'str', 'pass'].includes(key)) out.push({ label: 'Perfect Copy', v: st.mirror });
      if (st.zone) out.push({ label: 'The Zone', v: 12 });
      if (tutOn()) out.push({ label: 'Warm-up', v: 6 });
      if (st.nextBonus && action !== 'ft') out.push(st.nextBonus);
      if (st.shaken > 0) out.push({ label: 'Shaken', v: -4 });
      const wsv = ({ intD: .6, steal: .4, perD: .4, str: .3, dunk: .3, reb: .4 }[key] || 0) * APE; if (Math.abs(wsv) >= .5) out.push({ label: 'Wingspan', v: Math.round(wsv) });
      return out;
    }
    const LONG = Engine.weapons(s).some(w => BALANCE.distance.range.weapons.includes(w.id));   // a deep-range weapon extends your range
    const calc = (action, x = {}) => Balance.pct(action, ME, Object.assign({ longRange: LONG, def: DEF, diff: s.difficulty, fatigue: st.fatigue, morale: s.meta.morale, venue: cfg.venue || 'home', clutch: st.clutch, fire: st.fire, bonus: bonuses(action) }, x));
    /* their shot vs your defense (difficulty makes them better shooters) */
    const theirPct = (action, contest, by = THEM) => Balance.pct(action, by, { def: ME, contest, bonus: diffShift ? [{ label: 'Difficulty', v: Math.round(diffShift * .6) }] : [] }).pct;
    /* minigame quality helpers */
    const meterQ = r => r.perfect ? 1 : r.good ? .62 + r.quality * .28 : r.quality * .45;
    const green = (stat, dist) => (.06 + Balance.eff(stat) / 99 * .14) * WIN() * Balance.greenAt(dist);   // the perfect zone shrinks with distance
    const FT = a => BALANCE.distance.byAction[a];

    /* ---------- decision panel (options show % + breakdown on hover / long-press) ---------- */
    /* waiting on the player (a choice or a reply): not a stall; its listeners are released if the moment is reset */
    function waitInput(setup) {
      return new Promise(res => {
        let rm = null, done = false; const off = () => { if (done) return; done = true; st.waitInput = Math.max(0, st.waitInput - 1); st.inputOffs.delete(off); rm && rm(); beat(); };
        st.waitInput++; st.inputOffs.add(off); rm = setup(v => { off(); res(v); }, off);
      });
    }
    function choose(setupHtml, options) {
      return waitInput((res, off) => {
        const p = $('panel');
        p.innerHTML = `<div class="mp-setup">${setupHtml}</div><div class="mp-opts">${options.map((o, i) => {
          const pc = o.pct != null ? `<span class="pct ${o.pct >= 55 ? 'hi' : o.pct >= 38 ? 'mid' : 'lo'}">${o.pct}%</span>` : `<span class="pct mg">🕹</span>`;
          const tip = o.parts && o.parts.length ? `<span class="opt-tip">${escH(Balance.describe(o.parts))}</span>` : '';
          return `<button class="opt ${o.cls || ''}" data-i="${i}"><kbd>${i + 1}</kbd><span class="opt-l">${o.label}<small>${o.desc || ''}${o.mg ? ` <i class="opt-mg">🎮 ${o.mg}</i>` : ''}</small></span>${pc}${tip}</button>`;
        }).join('')}</div><div class="mp-hint">Hover or long-press an option to see what affects its %.</div>`;
        p.classList.add('show'); p.classList.remove('busy');
        if (st.tutChoose) { const id = st.tutChoose; st.tutChoose = null; setTimeout(() => tutTip(id), 60); }
        let long = false, timer = null;
        let gone = false; const go = i => { if (!options[i] || gone) return; gone = true; p.classList.remove('show'); SFX.play('click'); res(options[i]); };
        const kd = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= options.length) go(k - 1); };
        window.addEventListener('keydown', kd);
        p.querySelectorAll('.opt').forEach(b => {
          b.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; long = false; timer = setTimeout(() => { long = true; p.querySelectorAll('.opt').forEach(x => x.classList.remove('tipon')); b.classList.add('tipon'); }, 450); });
          b.addEventListener('pointerup', () => clearTimeout(timer)); b.addEventListener('pointerleave', () => clearTimeout(timer));
          b.addEventListener('click', () => { if (long) { long = false; return; } go(+b.dataset.i); });
        });
        return () => window.removeEventListener('keydown', kd);
      });
    }
    /* Keeps the situation text readable while a minigame plays */
    function busy(setupHtml, now) { beat(); const p = $('panel'); p.innerHTML = `<div class="mp-setup">${setupHtml}</div><div class="mp-now">${now || 'Get ready…'}</div>`; p.classList.add('show', 'busy'); }
    async function showSetup(html, ms = 900) { busy(html); await sleep(ms); }
    const idle = () => { beat(); const p = $('panel'); p.classList.remove('show', 'busy'); p.innerHTML = '<div class="mp-idle">Play continues…</div>'; };

    /* ---------- outcome helpers (animate + score + stats) ---------- */
    async function myShot(kind, made, o = {}) {
      const pts = kind === 'three' ? 3 : 2;
      st.box.fga++; if (kind === 'three') st.box.tpa++;
      if (kind === 'dunk') { court.greenNext = !!(o.perfect && made); made = await court.dunk(U, made, o.poster); court.greenNext = false; }
      else if (kind === 'layup' || kind === 'drive' || kind === 'hook') made = await court.layup(U, made, o.perfect);
      else made = await court.shoot(U, made ? (o.perfect || Math.random() < .55 ? 'swish' : 'rimin') : (Math.random() < .08 ? 'airball' : 'miss'), { slowmo: o.slowmo, green: o.perfect && made });
      if (o.perfect && !made) pbp('<i class="pct-note">Perfect release — still no good.</i>');
      if (made) {
        st.box.fgm++; st.box.pts += pts; if (kind === 'dunk') st.talkEv = 'dunked_on'; if (kind === 'three') { st.box.tpm++; cnt('threes'); } else if (kind === 'mid' || kind === 'fade') cnt('mids'); else if (kind === 'dunk') { cnt('dunks'); if (o.poster) { cnt('posterizers'); st.posterizers++; } } else cnt('layups');
        if (kind === 'hook' || kind === 'fade') cnt('posts');
        addPts('us', pts, playOf(U, kind === 'hook' ? 'hook' : kind, { poster: o.poster, ast: o.ast || st.astNext, putback: o.putback })); court.pop(kind === 'dunk' ? (o.poster ? 'POSTERIZED!' : 'SLAM!') : '+' + pts, U.x, U.y, 9, kind === 'three' ? '#38bdf8' : '#facc15', o.poster ? 46 : 36);
        if (cfg.venue === 'away' && (kind === 'dunk' || kind === 'three')) SFX.play('boo', .65); else SFX.play('crowd', 1 + (st.clutch ? .8 : 0)); court.celebrate(U, kind === 'three' ? 'three' : kind === 'dunk' ? 'dunk' : 'two');
        if (st.clutch) { cnt('clutchMakes'); st.clutchW++; if (st.last && kind !== 'dunk') court.highlight('winner', 'CLUTCH!', 350); }
        else if (kind === 'three' && (o.deep || Math.random() < .3)) await court.mini('three', o.deep ? 'FROM THE LOGO!' : 'FROM DOWNTOWN!');
      } else SFX.play('groan');
      return made;
    }
    async function theyShoot(action, contest, by = STAR, o = {}) {
      const dst = o.def ? (o.def.stats || MATE) : ME;
      const p = o.pct != null ? o.pct : Balance.pct(action, by.stats || THEM, { def: dst, contest, bonus: diffBonus().concat(heatBonus(by)) }).pct;
      const green = o.made == null && o.pct == null && Math.random() < BALANCE.perfect.ai * (.6 + Balance.eff((by.stats || THEM)[BALANCE.actions[action].three ? 'three' : 'mid'] || 50) / 99 * .8);   // they get greens too
      const pp = green ? Balance.apply(action, p, 1, undefined, { perfect: true, contest }) : p;
      const made = o.made != null ? o.made : roll(pp), three = !!BALANCE.actions[action].three, pts = three ? 3 : 2;
      court.ball.holder = by; st.lastTheirPct = pp;
      if (action === 'dunk') await court.dunk(by, made, o.poster);
      else { if (action === 'layup' || action === 'hook') await court.drive(by, rnd(-2, 2), 8, .4); await court.shoot(by, made ? 'swish' : 'miss', { arc: action === 'layup' ? 3 : undefined, slowmo: o.slowmo }); }
      shotBox(by, made, three);
      if (made) { if (cfg.venue === 'away') SFX.play('crowd', 1.2); addPts('them', pts, playOf(by, KIND_OF[action] || (three ? 'three' : 'layup'), { def: o.def || U })); if (by === STAR) st.talkEv = 'got_dunked'; st.oppSig++; court.pop('+' + pts, by.x, by.y, 9, '#f87171', 30); court.celebrate(by, three ? 'three' : action === 'dunk' ? 'dunk' : 'two'); }
      if (by === STAR) heatCheck(made);
      return made;
    }
    async function boardAfterMiss(offensive) { // quick rebound roll (no minigame) — or a live put-back scramble
      if (st.done) return false;
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
      const pc = calc('pass', clock);
      if (MATES().length) o.push({ k: 'pass', label: sit === 'post' ? 'Kick it out of the double team' : sit === 'break' ? 'Look for the alley-oop' : 'Find the open man', desc: 'Pick the teammate — each shows his %', action: 'pass', pct: pc.pct, parts: pc.parts, mg: 'Passing lane', passKind: sit === 'break' ? 'alleyoop' : sit === 'post' ? 'kickout' : pick(['kickout', 'skip', 'giveandgo']) });
      if (FEAT && !PICK && size >= 5 && cfg.level !== 'street' && !clutchCtx && Features.on(s, 'playbook')) {   // set plays you've learned (1–2 a possession)
        const learned = Features.state(s).plays.map(id => PLAYBOOK.find(p => p.id === id)).filter(p => p && (p.anim === 'post') === (sit === 'post' || (sit === 'elbow' && p.anim === 'post')) && Balance.available(p.action, ME));
        learned.sort(() => Math.random() - .5).slice(0, o.length >= 5 ? 1 : 2).forEach(p => {   // keep the list short
          const extra = { contest: p.contest, bonus: bonuses(p.action).concat([{ label: p.name, v: p.bonus + (p.fit.includes(s.player.pos) ? 2 : 0) }]) }, c = calc(p.action, Object.assign({}, clock, extra));
          o.push({ k: 'play', play: p, label: `📋 ${p.name}`, desc: p.desc, action: p.action, pct: c.pct, parts: c.parts, mg: 'Set play', extra, cls: 'play' });
        });
      }
      if (FEAT) MATES().forEach(m => {   // duo moves with a linked teammate on the floor
        const d = Features.duoOf(s, m.full || m.name); if (!d || o.some(x => x.k === 'duo')) return;
        const mateFin = d.action === 'dunk' || d.action === 'catch3', base = mateFin ? Balance.pct(d.action, m.stats, { def: opp(m).stats, contest: 'open' }) : calc(d.action, { contest: 'open' });
        o.push({ k: 'duo', duo: d, m, mateFin, label: `🔗 ${d.move}`, desc: `With ${m.short} · ${d.desc}`, action: d.action, pct: clamp(base.pct + d.bonus, 5, 95), parts: base.parts.concat([{ label: d.move, v: d.bonus }]), mg: mateFin ? 'Lob / pass timing' : 'Pass → finish', cls: 'duo' });
      });
      if (sigReady()) weaponOpts('off').forEach(w => o.push(w));
      return o;
    }
    /* ---------- TUTORIAL (cfg.tutorial): one thing at a time, a tip before each ---------- */
    const meterArt = '<div class="tut-meter"><i class="g"></i><i class="p"></i><b></b></div>';
    const TIPS = {
      decide: { title: 'Every play is a choice', target: ['#panel .mp-opts'], text: 'Each option shows your odds: green is good, yellow is a coin flip, red is a prayer. Pick what fits YOUR stats — hover or long-press to see why.', keys: ['1', '2', '3', 'or click'], phone: ['Tap an option'] },
      meter: { title: 'The shot meter', target: ['#courtWrap'], text: 'Stop the bar in the green. Hit the bright line for a GREEN release — and the farther out you are, the smaller the green gets.', art: meterArt, keys: ['SPACE', 'or click'], phone: ['TAP'] },
      drive: { title: 'Attack the rim', target: ['#courtWrap'], text: 'Read his lean and go the other way for a BLOW BY. If you gather, hit left-right on the beat, then release when the ring meets the rim.', keys: ['← / →', 'SPACE'], phone: ['◀ / ▶', 'TAP'] },
      pass: { title: 'Find the open man', target: ['#panel .mp-opts'], text: 'Every teammate shows his own %. Pick the open one, then tap him when he lights up. Assists win games — and build chemistry.', keys: ['1–3', 'then 1–4 / click'], phone: ['Tap him', 'then tap the glow'] },
      defense: { title: 'Lock him up', target: ['#panel .mp-opts'], text: 'On D, pick your approach first. Then mirror his move — slide left or right, jump to contest. Don\'t bite on the fake.', keys: ['←', '→', '↑ contest'], phone: ['◀', '▶', '▲'] },
      ft: { title: 'Free throws', target: ['#courtWrap'], text: 'The reticle drifts. Release when it\'s centered on the rim — tired legs make it shake more.', keys: ['SPACE', 'or click'], phone: ['TAP'] },
      arcade: { title: 'Now play it live', target: ['#courtWrap'], text: 'Fast break — you control everything. Move, shoot at the top of your jump, beat your man with a dribble move, and jump to block.', keys: ['WASD move', 'J shoot / jump', 'K pass', 'L dribble move'], phone: ['Joystick', 'SHOOT', 'PASS', 'MOVE'] },
      close: { title: 'Close call', target: ['#courtWrap'], text: 'The game slows down when it\'s tight. React fast — set your feet before he gets there.', keys: ['SPACE', 'or click'], phone: ['TAP'] },
    };
    const TUT_STEPS = ['shoot', 'drive', 'pass', 'defense', 'ft', 'arcade', 'close'], TIP_I = { decide: 1, meter: 2, drive: 3, pass: 4, defense: 5, ft: 6, arcade: 7, close: 8 };
    async function tutTip(id) {
      if (!tutOn() || !TIPS[id] || (st.tipSeen = st.tipSeen || {})[id]) return; st.tipSeen[id] = 1;
      st.waitInput++; mgHold = true;
      try { const r = await Tutorial.tip(TIPS[id], { i: TIP_I[id], n: 8 }); if (r === 'skip') endTutorial(true); }
      catch (e) { console.warn('tutorial tip', e); }
      finally { st.waitInput = Math.max(0, st.waitInput - 1); mgHold = false; beat(); }
    }
    function endTutorial(skipped) {
      if (st.tutDone) return; st.tutDone = true; st.tutChoose = null; document.querySelectorAll('.tut').forEach(e => e.remove());
      pbp(skipped ? '⏭ Tutorial skipped. First to 15 — go win it.' : '🎓 <b>Tutorial complete.</b> Kai stops playing nice. First to 15.', 'sys');
      if (!skipped) banner('<small>TUTORIAL COMPLETE</small>NOW BEAT HIM', 'win', 1400);
    }
    async function tutMoment() {
      const id = TUT_STEPS[st.tutI++]; st.tut = id; st.i = Math.max(st.i, 0);
      try {
        if (id === 'shoot') { st.tutChoose = 'decide'; await offPossession(null, 'shoot'); }
        else if (id === 'drive') await offPossession(null, 'drive');
        else if (id === 'pass') { st.tutChoose = 'pass'; await passMoment('kickout', 'Tariq is wide open in the corner. Kai\'s cheating off him.'); }
        else if (id === 'defense') { st.tutChoose = 'defense'; await defPossession(); }
        else if (id === 'ft') { pbp('You get hacked going to the rim. Two shots.'); await tutTip('ft'); if (tutOn()) await T.free_throws({ shots: 2 }); }
        else if (id === 'arcade') { await tutTip('arcade'); if (tutOn()) { pbp('Kai coughs it up — you\'re off!', 'good'); await arcadeSegment('fastbreak', { sub: 'TUTORIAL · PLAY IT LIVE', trigger: 'steal', handler: 'me', forceHelp: true }); } }
        else if (id === 'close') { await tutTip('close'); if (tutOn()) await closeCall('charge'); }
      } finally { st.tut = null; }
      if (st.tutI >= TUT_STEPS.length) endTutorial(false);
      return 'tut_' + id;
    }
    /* INNER MONOLOGUE (js/story-fx.js lines, drawn by Cutscene.monologue): time freezes at a big play and your thoughts slam in.
       At most 2 a game: the final possession of a big game, the story's jelly moment, the Summer Jam's clutch possession. */
    async function innerVoice(kind) {
      if ((st.monoN || 0) >= 2 || typeof Story === 'undefined' || typeof Cutscene === 'undefined' || !Cutscene.monologue || tutOn()) return;
      const m = Story.mono(kind, s); if (!m) return; st.monoN = (st.monoN || 0) + 1;
      const D = kind === 'final_def' ? STAR : opp(U);
      try { await Cutscene.monologue(Object.assign(m, { look: U.look, look2: D && D.look, colors: cfg.us.colors, colors2: cfg.them.colors, name: myName })); } catch (e) { console.warn('monologue', e); }
    }
    /* the jelly moment (story): a rim protector waiting at the rim, once a game (cfg.jellyMoment) */
    const JM = cfg.jellyMoment && FEAT && Features.jellyOn(s) ? cfg.jellyMoment : null;
    const jmDue = () => !!JM && !st.jmDone && !st.clutch && (JM.first || st.i >= Math.floor(n * .55));
    const rimGuy = () => TH.filter(p => !p.hidden && p !== opp(U)).sort((a, b) => (b.stats.intD || 0) - (a.stats.intD || 0))[0] || opp(U);
    const nickOf = p => { const m = /"([^"]+)"/.exec(p.full || ''); return m ? m[1] : p.short; };   // Big Ike, not Grant
    const jellyBonus = () => { const L = BALANCE.jelly.levels[Features.jellyLevel(s)]; return L && L.bonus ? [{ label: L.name, v: L.bonus }] : []; };
    /* set-play choreography on the court before the shot */
    async function runPlay(p) {
      const M = MATES(), m1 = M[0], m2 = M[1] || M[0], D = opp(U), sd = U.x < 0 ? -1 : 1;
      court.pop(p.name.toUpperCase(), U.x, U.y, 10, '#38bdf8', 30); SFX.play('click');
      if (p.anim === 'screen' && m1) { await court.moveTo(m1, D.x - sd * 1.2, D.y + .8, .45); court.ball.holder = U; await court.drive(U, D.x - sd * 3.5, D.y - 3, .5); court.act(D, 'stumble', .5); }
      else if (p.anim === 'backdoor' && m1) { await court.pass(U, m1); await court.moveTo(U, U.x + sd * 3, U.y + 3, .3); SFX.play('squeak'); await court.moveTo(U, rnd(-2, 2), 9, .45); await court.pass(m1, U, .35, 1); }
      else if (p.anim === 'clear') await Promise.all(M.map((m, i) => court.moveTo(m, -sd * (12 + i * 3), 18 + i * 5, .6)));
      else if (p.anim === 'post') { await court.moveTo(U, sd * 6, 9, .45); if (m1) { court.ball.holder = m1; await court.pass(m1, U, .4); } }
      else if (p.anim === 'flare' && m1) { await court.moveTo(m1, U.x - sd * 2, U.y + 2, .4); await court.moveTo(U, sd * 20, 18, .5); if (m2) { court.ball.holder = m2; await court.pass(m2, U, .45); } }
      else if (p.anim === 'horns' && m1) { court.moveTo(m1, -6, 19, .5); if (m2) await court.moveTo(m2, 6, 19, .5); court.ball.holder = U; await court.pass(U, m1, .35); await court.pass(m1, U, .35); }
    }
    async function duoPlay(o, setup) {
      const m = o.m, d = o.duo, three = !!BALANCE.actions[d.action].three; cnt('duoMoves');
      court.pop(`${d.icon} ${d.move.toUpperCase()}`, U.x, U.y, 10, '#4ade80', 30); SFX.play('sig');
      busy(setup, `🔗 ${d.move} with ${escH(m.short)}`);
      let q;
      if (d.action === 'dunk') { const r = await MG.dunkChain($('mg'), { title: d.move.toUpperCase(), rings: 1, labels: ['LOB'], tol: (PB.lobTol + Balance.eff(ME.pass) / 99 * 8 + 3) * WIN() * MGX('passWindow'), speed: 80 }); q = r.quality; }
      else { const r = await MG.passLane($('mg'), { title: d.move.toUpperCase(), window: (600 + (ME.pass * .5 + ME.iq * .5) / 99 * 700) * WIN() * MGX('passWindow'), names: MATES().map(x => x.short), target: MATES().indexOf(m) }); q = r.success ? r.quality : 0; }
      idle();
      if (q <= 0) { st.box.to++; const th = opp(m); if (th.box) th.box.stl++; court.ball.holder = U; await court.pass(U, th, .35); pbp(`The ${d.move} gets jumped. Turnover.`, 'bad'); fail(); return false; }
      const fin = Balance.apply(d.action, o.pct, Math.min(q, .95)), made = roll(fin);   // pass quality, not a release
      if (o.mateFin) {
        court.ball.holder = U; await court.pass(U, m, .45, d.action === 'dunk' ? 2 : 0);
        await animShot(m, d.action, made, { poster: d.action === 'dunk' && q >= .9 }); shotBox(m, made, three);
        if (made) { addPts('us', three ? 3 : 2, playOf(m, KIND_OF[d.action] || 'dunk', { ast: U })); st.box.ast++; cnt('assists'); court.celebrate(m, three ? 'three' : 'dunk'); pbp(`🔗 <b>${escH(d.move)}!</b> ${myName} and ${escH(m.short)} — they've done this before. <i class="pct-note">${fin}%</i>`, 'good hot'); st.highlights.push(`${d.move} with ${m.short}`); success(true); }
        else { pbp(`${escH(m.short)} can't finish the ${escH(d.move)}. <i class="pct-note">${fin}%</i>`); st.att++; await boardAfterMiss(true); }
        return made;
      }
      court.ball.holder = U; await court.pass(U, m); SFX.play('squeak'); await court.moveTo(U, rnd(-2, 2), three ? 22 : 9, .45); await court.pass(m, U, .3);
      const ok = await myShot(three ? 'three' : 'layup', made);
      pbp(ok ? `🔗 <b>${escH(d.move)}!</b> ${escH(m.short)} gives it right back and ${myName} cashes in. <i class="pct-note">${fin}%</i>` : `The ${escH(d.move)} works — the finish doesn't. <i class="pct-note">${fin}%</i>`, ok ? 'good hot' : '');
      if (ok) { if (m.box) m.box.ast++; st.highlights.push(`${d.move} with ${m.short}`); success(true); } else { fail(); await boardAfterMiss(true); }
      return ok;
    }
    /* JELLY: flick it around the rim protector (MG.flick), then the jelly on the court */
    async function jellyFinish(jc, big, DCTX, JMn, setup) {
      const JB = BALANCE.jelly, FL = JB.flick, k = Balance.eff((ME.finish + ME.handle) / 2) / 99;
      busy(setup, '🍯 Jelly');
      const fr = await MG.flick($('mg'), { ctx: Object.assign({}, DCTX, { defLook: big && big.look, defNum: big && big.num }), window: lerp(FL.window[0], FL.window[1], k) * WIN() * MGX('comboTime'), tol: lerp(FL.tol[0], FL.tol[1], k) * WIN(), hint: s.difficulty !== 'hof', slow: true,
        sub: `Finishing ${ME.finish} · Handles ${ME.handle} vs ${big ? escH(big.short) : 'the big'}` });
      closeDrive($('mg')); idle(); cnt('jellyTries'); st.box.fga++;
      const side = U.x >= 0 ? 1 : -1, bigName = big ? nickOf(big) : 'the big man';
      if (fr.side !== 'right' && roll(JB.wrongBlock * 100)) {   // flicked it into his hand
        await court.drive(U, side * 3, 9, .3); if (big) { await court.block(big, U, true); if (big.box) big.box.blk++; }
        cnt('jellyBlocks'); pbp(say('jelly_block') + ` <i class="pct-note">${fr.side === 'late' ? 'too slow' : 'wrong side'}</i>`, 'bad'); fail(); await boardAfterMiss(true); return false;
      }
      const fin = Balance.apply('jelly', jc.pct, fr.side === 'right' ? fr.quality : .15, 3, { perfect: fr.side === 'right' && fr.perfect, contest: 'contested' }), made = roll(fin);
      // the full dramatic version (deep slow motion + replay) only for big moments: clutch / last possession, the story's jelly moment, your first jelly ever
      const drama = !!(st.clutch || st.last || JMn || !((s.counters.jellies || 0) + (st.counters.jellies || 0)));
      const ok = await court.jelly(U, made, big, { side, perfect: fr.perfect && made, lvl: Features.jellyLevel(s), drama });
      if (ok) {
        st.box.fgm++; st.box.pts += 2; addPts('us', 2, playOf(U, 'jelly', { def: big })); cnt('jellies'); cnt('layups'); if (JMn && JMn.payoff) cnt('jellyPayoff'); if (fr.perfect) { cnt('perfects'); st.perfects++; }
        pbp(say('jelly_make') + ` <i class="pct-note">${fin}%</i>`, 'good hot'); pbp(`The bench is on the floor. ${escH(bigName)} is still looking for the ball.`, 'hot');
        st.highlights.push(`Jelly over ${bigName}`); court.celebrate(U, 'jelly'); success(true);
        if (drama) await court.mini('jelly', pick(['JELLY!', 'AROUND HIM!', 'SILK.']), { force: true });
        if (!st.done && roll(8 + (st.refFavor ? 12 : 0))) { st.refFavor = false; SFX.play('whistle'); pbp(say('and1'), 'good'); await court.mini('andone', 'AND ONE!'); await T.free_throws({ shots: 1 }); }
      } else { SFX.play('groan'); pbp(say('jelly_miss') + ` <i class="pct-note">${fin}%</i>`); fail(); await boardAfterMiss(true); }
      return ok;
    }
    async function offPossession(clutchCtx, tutKind) {
      const sit = clutchCtx ? (s.player.pos === 'C' ? 'post' : 'top') : (tutKind ? 'wing' : pickSit());
      formation('us', SPOTS[sit]); court.ball.holder = U;
      const shot = clutchCtx ? Math.ceil(clk.rem) : Math.floor(rnd(4, 18)); $('sbShot').textContent = shot;
      const text = clutchCtx ? clutchCtx.text : Engine.pick(SIT_TEXT[sit]).replace('{def}', properName(star.name.split(' ').slice(-1)[0])).replace('{sc}', shot);
      let opts = offOptions(sit, clutchCtx), txt = text;
      if (tutKind === 'shoot') { const sh = opts.filter(x => x.k === 'catch' || x.k === 'pull'); if (sh.length) opts = sh; txt = 'You catch it on the wing. Kai is a step late.'; }
      if (tutKind === 'drive') { const dr = opts.filter(x => x.k === 'layup'); if (dr.length) opts = dr; txt = 'Kai crowds you on the wing. Make him pay.'; }
      if (!clutchCtx && jmDue()) {   // the story's jelly moment: drive at the rim protector
        st.jmDone = true; st.jmNow = JM; txt = JM.text;
        const dr = opts.find(x => x.k === 'layup'); if (dr) { dr.label = '🍯 Attack the rim'; dr.desc = 'He\'s waiting for you. Go around him.'; dr.cls = 'jm'; opts = [dr].concat(opts.filter(x => x !== dr)); }
      }
      const ch = await choose(`<b>${escH(txt)}</b>`, opts);
      return runOffense(ch, txt, sit);
    }
    async function runOffense(o, text, sit) {
      if (!o.chained) tire();
      const setup = `<b>${escH(text)}</b>`, JMn = o.k === 'layup' ? st.jmNow : null; st.jmNow = null; st.astNext = null;
      if (o.k === 'sig') return weapon(setup, o.wid);
      if (st.tut === 'shoot' && (o.k === 'catch' || o.k === 'pull')) await tutTip('meter');
      if (st.tut === 'drive' && o.k === 'layup') await tutTip('drive');
      if (o.k === 'duo') return duoPlay(o, setup);
      if (o.k === 'play') {   // a set play from the Playbook: the choreography, then the shot it was drawn up for
        cnt('setPlays'); await runPlay(o.play); pbp(`📋 <b>${escH(o.play.name)}</b>.`, 'sys');
        const K = { layup: 'layup', dunk: 'dunk', catch3: 'catch', catchMid: 'catch', pull3: 'pull', pullMid: 'pull', hook: 'hook', fade: 'fade' }[o.play.action] || 'layup';
        return runOffense(Object.assign({}, o, { k: K, chained: true }), text, sit);
      }
      if (o.k === 'pass') return passMoment(o.passKind || 'kickout');
      let q = .5, kind, poster = false, perfect = false, shotCon = (o.extra && o.extra.contest) || 'normal';
      if (o.k === 'catch') {
        const mateWithBall = MATES().length ? pick(MATES()) : STAR; court.ball.holder = mateWithBall; await court.pass(mateWithBall, U); st.astNext = MATES().includes(mateWithBall) ? mateWithBall : null;
        busy(setup, `🎮 ${o.label}`);
        const stat = o.action === 'catch3' ? ME.three : ME.mid;
        const r = await MG.shotMeter($('mg'), { title: o.label.toUpperCase(), green: green(stat, FT(o.action)) * MGX('green') + (st.fire ? .03 : 0), dur: st.clutch ? .9 : 1.05, sub: `${o.action === 'catch3' ? 'Three-Point' : 'Mid-Range'} ${stat} · base ${o.pct}%` });
        q = meterQ(r); perfect = r.perfect; if (perfect) { cnt('perfects'); st.perfects++; }
        kind = o.action === 'catch3' ? 'three' : 'mid';
      } else if (o.k === 'pull') {
        busy(setup, `🎮 Dribble move`);
        const r1 = await MG.dribbleCombo($('mg'), { title: 'CREATE SPACE', len: 3, time: (.7 + ME.handle / 99 * .6) * WIN() * MGX('comboTime') });
        if (r1.quality >= (Engine.hasSpecial(s, 'ankles') ? .6 : 1)) { cnt('crosses'); court.pop('ANKLES!', STAR.x, STAR.y, 7, '#f472b6', 30); pbp(say('ankles'), 'good'); await court.mini('ankles', 'ANKLES!', { name2: star.name, colors2: cfg.them.colors }); queueTalk('rival', .35); }
        busy(setup, `🎮 Rise up`);
        const stat = o.action === 'pull3' ? ME.three : ME.mid;
        const r2 = await MG.shotMeter($('mg'), { title: o.label.toUpperCase(), green: green(stat, FT(o.action)) * MGX('green'), dur: .95, sub: `${o.action === 'pull3' ? 'Three-Point' : 'Mid-Range'} ${stat} · Handles ${ME.handle}` });
        q = r1.quality * .35 + meterQ(r2) * .65; perfect = r2.perfect; kind = o.action === 'pull3' ? 'three' : 'mid';
      } else if (o.k === 'layup') {
        // 1) BLOW-BY read → 2) sometimes a GATHER STEP → 3) the layup release (js/balance.js BALANCE.layup)
        const LB = BALANCE.layup, BB = LB.blowBy, D = opp(U), hs = (Balance.eff(ME.handle) + Balance.eff(ME.speed)) / 2 / 99, pdK = Math.max(0, ((DEF.perD || oppR) + diffShift - 50) / 49);
        busy(setup, '🎮 Read your man');
        const DCTX = { venue: court.venueId, us: cfg.us, them: cfg.them, meLook: U.look, meNum: s.player.num, defLook: D && D.look, defNum: D && D.num };
        const r1 = await MG.blowBy($('mg'), { ctx: DCTX, sub: `Handles ${ME.handle} · Speed ${ME.speed} vs Perimeter D ${DEF.perD || oppR}`, window: lerp(BB.window[0], BB.window[1], hs) * WIN() * MGX('comboTime'), tell: clamp(lerp(BB.tell[0], BB.tell[1], hs) - pdK * BB.perD * .5 - (s.difficulty === 'hof' ? BB.hofTell || .2 : 0), .1, 1),   // ≥ .5 shows the arrow; Hall of Fame and good defenders hide it
          fake: (cfg.them && cfg.them.star) || st.takeover > 0 ? BB.fakeStar : BB.fake, cols: cfg.them.colors, mine: cfg.us.colors });
        let contest = (o.extra && o.extra.contest) || 'normal';
        if (r1.read === 'right') { contest = 'open'; cnt('blowbys'); court.pop('BLOW BY!', U.x, U.y, 8, '#4ade80', 30); pbp(`💨 ${myName} reads ${escH(D ? D.short : 'him')} and blows by.`, 'good'); }
        else {
          const w = BB.cutOff, r = Math.random() * (w.contested + w.charge + w.steal), out = r < w.contested ? 'contested' : r < w.contested + w.charge && r1.read === 'wrong' ? 'charge' : r < w.contested + w.charge ? 'contested' : 'steal';
          court.pop('CUT OFF!', U.x, U.y, 8, '#f87171', 30);
          if (out !== 'contested') closeDrive($('mg'));
          if (out === 'charge') { idle(); st.box.to++; cnt('chargesOn'); SFX.play('whistle'); await court.drive(U, D ? D.x : 0, (D ? D.y : 10) + 1.5, .35); if (D) court.act(D, 'sit', .9); await banner('<small>OFFENSIVE FOUL</small>CHARGE!', 'loss', 1000); pbp(`${myName} runs right into ${escH(D ? D.short : 'the defender')}. Charge.`, 'bad'); fail(); return false; }
          if (out === 'steal') { idle(); st.box.to++; if (D && D.box) D.box.stl++; if (D) await court.steal(D, U); pbp(`${escH(D ? D.short : 'The defender')} cuts you off and pokes it loose.`, 'bad'); fail(); return false; }
          contest = 'heavy'; pbp(`${escH(D ? D.short : 'The defender')} cuts you off. Tough finish ahead.`, 'bad');
        }
        if (JMn) contest = 'heavy';   // the big man is already there, arms up
        shotCon = contest;
        // GATHER STEP — now and then, more often in traffic
        let gk = 1, gathered = false; const gch = LB.gather.chance + (contest === 'heavy' || contest === 'contested' ? LB.gather.contested : 0) + (sit === 'post' || o.extra && o.extra.help ? LB.gather.help : 0);
        if (Math.random() < gch) {
          busy(setup, '🎮 Gather step'); cnt('gathers'); gathered = true;
          const g = await MG.gatherStep($('mg'), { ctx: DCTX, beat: LB.gather.beat, tol: LB.gather.tol * WIN(), travel: LB.gather.travel, sub: contest === 'heavy' ? 'Cut off — help is coming' : 'Help defender waiting' });
          if (g.travel) { closeDrive($('mg')); idle(); st.box.to++; cnt('travels'); SFX.play('whistle'); await banner('<small>VIOLATION</small>TRAVELING', 'loss', 1000); pbp(`${myName} shuffles the feet on the gather. Travel.`, 'bad'); fail(); return false; }
          gk = g.clean ? LB.gather.clean : g.sloppy || g.travel ? LB.gather.sloppy : 1;
        }
        if (contest !== ((o.extra && o.extra.contest) || 'normal')) o = Object.assign({}, o, { pct: calc(o.action, Object.assign({}, o.extra, { contest })).pct });
        // help is coming (or a rim protector): LAYUP or JELLY? (wide open, the plain layup is the better shot)
        if (FEAT && Features.jellyOn(s) && (JMn || BALANCE.jelly.offer.includes(contest) || gathered || sit === 'post')) {
          const big = (JMn && JMn.by && TH.find(p => p.full === JMn.by)) || rimGuy(), bd = big && big.stats ? { def: Object.assign({}, DEF, { intD: Math.max(DEF.intD, big.stats.intD), vert: Math.max(DEF.vert || 0, big.stats.vert || 0) }) } : {};   // the shot is now over the rim protector
          const jc = calc('jelly', Object.assign({}, o.extra, bd, { contest, bonus: bonuses('jelly').concat(jellyBonus(), JMn ? [{ label: 'Scoop\'s lesson', v: 10 }] : []) }));   // the story moment: his voice in your head
          o = Object.assign({}, o, { pct: calc(o.action, Object.assign({}, o.extra, bd, { contest })).pct });
          busy(setup, '🍯 Pick your finish');
          const pk = await MG.finishPick($('mg'), { ctx: DCTX, title: big ? `${nickOf(big).toUpperCase()} IS COMING!` : 'HELP IS COMING!', sub: `Contest: ${contest} · the jelly curls around a shot blocker`,
            opts: [{ label: 'LAYUP', pct: o.pct, desc: 'Go up strong' }, { label: '🍯 JELLY', pct: jc.pct, desc: 'Flick it around him', jelly: true }] });
          if (pk === 1) return jellyFinish(jc, big, DCTX, JMn, setup);
        }
        busy(setup, '🎮 Finish');
        const ck = { open: 1.2, normal: 1, contested: .8, heavy: .65 }[contest];
        const r2 = await MG.layupStep($('mg'), { ctx: DCTX, win: (.035 + Balance.eff(ME.finish) / 99 * .06) * WIN() * ck * gk, beat: .36 - Balance.eff(ME.speed) / 99 * .06, sub: `Finishing ${ME.finish}${ck < 1 ? ' · cut off' : ck > 1 ? ' · open lane' : ''}${gk > 1 ? ' · clean gather' : gk < 1 ? ' · sloppy gather' : ''}` });
        q = r1.quality * .4 + r2.quality * .6; perfect = !!r2.perfect; kind = 'layup';
        cnt('fastbreaks', sit === 'break' ? 1 : 0);
      } else if (o.k === 'dunk') {
        busy(setup, `🎮 Beat your man`);
        const r1 = await MG.dribbleCombo($('mg'), { title: 'BEAT YOUR MAN', len: 4, time: (.7 + ME.handle / 99 * .6) * WIN() * MGX('comboTime') });
        if (r1.quality >= (Engine.hasSpecial(s, 'ankles') ? .6 : 1)) { cnt('crosses'); pbp(say('ankles'), 'good'); await court.mini('ankles', 'ANKLES!', { name2: star.name, colors2: cfg.them.colors }); queueTalk('rival', .35); }
        busy(setup, o.k === 'dunk' ? '🎮 Throw it down' : '🎮 Finish');
        let r2q;
        const ck = { open: 1.2, normal: 1, contested: .8, heavy: .65 }[(o.extra && o.extra.contest) || 'normal'];   // defenders shrink the window
        if (o.k === 'dunk') { const r2 = await MG.dunkChain($('mg'), { title: 'DUNK TIMING', tol: (6 + ME.dunk / 99 * 9 + ME.vert / 99 * 4) * WIN() * MGX('dunkTol') * ck, speed: 90 + (st.clutch ? 20 : 0) }); r2q = r2.quality; perfect = !!r2.perfect; poster = r2.hits === r2.total && roll(30 + ME.dunk * .4); }
        else { const r2 = await MG.layupStep($('mg'), { win: (.035 + Balance.eff(ME.finish) / 99 * .06) * WIN() * ck, beat: .36 - Balance.eff(ME.speed) / 99 * .06, sub: `Finishing ${ME.finish}${ck < 1 ? ' · contested' : ck > 1 ? ' · open lane' : ''}` }); r2q = r2.quality; perfect = !!r2.perfect; }
        q = r1.quality * .5 + r2q * .5; kind = o.k;
        cnt('fastbreaks', sit === 'break' ? 1 : 0);
      } else if (o.k === 'hook' || o.k === 'fade') {
        court.ball.dribble = false; busy(setup, '🎮 Back him down');
        const r1 = await MG.strengthPush($('mg'), { title: 'BACK HIM DOWN', mine: ME.str, theirs: DEF.str + diffShift });
        busy(setup, o.k === 'hook' ? '🎮 Hook shot' : '🎮 Fadeaway');
        let r2q;
        if (o.k === 'hook') { const r2 = await MG.dunkChain($('mg'), { title: 'HOOK SHOT', rings: 1, labels: ['RELEASE'], tol: (7 + ME.finish / 99 * 9) * WIN(), speed: 80 }); r2q = r2.quality; }
        else { const r2 = await MG.shotMeter($('mg'), { title: 'FADEAWAY', green: green(ME.mid, FT('fade')) * MGX('green'), dur: 1, sub: `Mid-Range ${ME.mid}` }); r2q = meterQ(r2); }
        q = r1.quality * .4 + r2q * .6; kind = o.k;
      }
      idle();
      let fin = Balance.apply(o.action, o.pct, q, FT(o.action), { perfect, contest: shotCon }), made = roll(fin);   // a perfect release goes in most of the time (BALANCE.perfect)
      if (!made && (o.k === 'hook' || o.k === 'fade') && Engine.hasSpecial(s, 'postpone') && !st.postponed) { st.postponed = true; pbp('⏳ <b>Right of Postponement</b>: you hang in the air and wait out the block…', 'hot'); made = roll(Math.min(95, fin + 10)); }
      made = await myShot(kind === 'dunk' ? 'dunk' : kind === 'layup' ? 'layup' : kind === 'hook' ? 'hook' : kind, made, { poster, perfect, slowmo: st.clutch && st.last });
      const key = { three: 'three', mid: 'mid', layup: 'drive', dunk: 'dunk', hook: 'post', fade: 'mid' }[kind];
      pbp(say(key === 'dunk' ? (made ? (poster ? 'poster' : 'dunk') : 'dunk_miss') : key + (made ? '_make' : '_miss')) + ` <i class="pct-note">${fin}%</i>`, made ? 'good' : '');
      if (poster && made) st.highlights.push(`Posterized ${star.name}`);
      if (made) success(kind === 'dunk' || perfect); else fail();
      if (!made && (kind === 'layup' || kind === 'dunk') && roll(30 + (st.refFavor ? 15 : 0))) { st.refFavor = false; SFX.play('whistle'); pbp(say('fouled')); await T.free_throws({ shots: 2 }); return made; }
      if (made && !st.done && (kind === 'layup' || kind === 'hook' || kind === 'dunk') && roll(10 + ME.str * .12 + (st.refFavor ? 12 : 0))) { st.refFavor = false; SFX.play('whistle'); pbp(say('and1'), 'good'); await court.mini('andone', 'AND ONE!'); await T.free_throws({ shots: 1 }); }
      if (!made) await boardAfterMiss(true);
      return made;
    }
    /* =================================================================
       DEFENSIVE POSSESSION — choose an approach, then play it
       ================================================================= */
    async function defPossession(clutchCtx) {
      const sw = starWeapon(); if (sw && Math.random() < OB.weaponUse + (st.takeover > 0 ? .25 : 0)) return weaponCounter(STAR, sw, clutchCtx && clutchCtx.text);
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
      if (sigReady()) weaponOpts('def').forEach(w => o.push(Object.assign(w, { action: WEAPONS[w.wid].type === 'block' ? 'block' : WEAPONS[w.wid].type === 'steal' ? 'steal' : 'stop' })));
      const ch = await choose(`<b>${escH(text)}</b>`, o);
      if (ch.k === 'sig') return defWeapon(ch, text);
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
        await court.block(U, att, ok); shotBox(att, !ok, false);
        if (ok) { st.box.blk++; cnt('blocks'); cnt('stops'); st.talkEv = 'blocked'; st.lastStop = Object.assign(playOf(U, 'block', { def: STAR }), { side: 'us', clock: Math.round(clk.rem * 10) / 10 }); pbp(say('block'), 'good'); court.pop('REJECTED!', U.x, U.y, 10, '#38bdf8', 38); success(true); if (!(await maybeFastBreak('block', Math.random() < .6 ? 'me' : 'mate'))) await boardAfterMiss(false); return true; }
        addPts('them', 2, playOf(att, 'layup', { def: U })); pbp(say('block_fail', { att: att.name }), 'bad'); fail(); return false;
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
    async function stealPlay(from = STAR) {
      court.ball.holder = from; st.lastStop = Object.assign(playOf(U, 'steal', { def: from }), { side: 'us', clock: Math.round(clk.rem * 10) / 10 }); await court.steal(U, from); st.box.stl++; if (from.box) from.box.to++; cnt('steals'); cnt('stops'); pbp(say('steal'), 'good'); court.pop('STEAL!', U.x, U.y, 8, '#38bdf8'); SFX.play('crowd', 1.3);
      if (await maybeFastBreak('steal', 'me')) { success(true); return true; }
      const act = Balance.available('dunk', ME) ? 'dunk' : 'layup', p = calc(act, { contest: 'open' }).pct;
      const made = await myShot(act, roll(p)); if (made) pbp(say('breakaway'), 'good'); success(true); return true;
    }

    /* your defensive weapon (Lockdown Stance, Pickpocket, Chase-Down Block…) */
    async function defWeapon(ch, text) {
      const w = WEAPONS[ch.wid]; st.sigUses++; st.sig = 0; st.sigUsed = st.sigUses >= (Engine.hasSpecial(s, 'formless') ? 2 : 1);
      await weaponFlash(U, ch.wid, 'us'); busy(`<b>${escH(text)}</b>`, `🎮 ${w.name}`);
      let q;
      if (w.type === 'block') { const r = await MG.rebound($('mg'), { title: '⚔ ' + w.name.toUpperCase(), zone: (.1 + (ME.intD * .6 + ME.vert * .4) / 99 * .16) * WIN() }); q = r.success ? r.quality : 0; }
      else { const r = await MG.defenseReact($('mg'), { title: '⚔ ' + w.name.toUpperCase(), window: (450 + ME.perD / 99 * 450) * WIN() * 1.3 }); q = r.success ? Math.max(.5, r.quality) : .1; }
      idle(); const ok = roll(clamp(Math.round(ch.pct + (q - .5) * WB.skill), 5, WB.max));
      if (ok && w.type === 'steal') { pbp(`⚔ <b>${escH(w.name)}!</b>`, 'good hot'); return stealPlay(STAR); }
      if (ok && w.type === 'block') { await court.drive(STAR, 1, 8, .35); await court.block(U, STAR, true); st.box.blk++; cnt('blocks'); cnt('stops'); pbp(`⚔ <b>${escH(w.name)}!</b> ${myName} sends it back.`, 'good hot'); st.highlights.push(`Weapon: ${w.name}`); success(true); await boardAfterMiss(false); return true; }
      U.pose = ok ? 'block' : 'def'; const made = await theyShoot(pick(['pullMid', 'pull3']), ok ? 'heavy' : 'normal', STAR, { made: ok ? roll(12) : undefined }); U.pose = '';
      if (!made) { cnt('stops'); pbp(`⚔ <b>${escH(w.name)}</b> — ${escH(STAR.short)} can't shake you.`, 'good hot'); success(true); await boardAfterMiss(false); return true; }
      pbp(`${escH(STAR.short)} scores through ${escH(w.name)}.`, 'bad'); fail(); return false;
    }

    /* =================================================================
       EVERYONE PLAYS — teammates and opponents take real shots with their own stats + weapons
       ================================================================= */
    const OB = BALANCE.others, PB = BALANCE.passing, CL = BALANCE.close, WB = BALANCE.weapons;
    const ACT_OF = { three: 'pull3', mid: 'pullMid', drive: 'layup', dunk: 'dunk', post: 'fade', zone: 'pullMid' };
    const roleAction = p => { const st2 = p.stats || MATE, r = p.role; if (r === 'shooter') return Math.random() < .6 ? 'catch3' : 'pullMid'; if (r === 'big') return Balance.available('dunk', st2) && Math.random() < .45 ? 'dunk' : 'hook'; if (r === 'slasher') return Math.random() < .7 ? 'layup' : 'pullMid'; if (r === 'playmaker') return pick(['pullMid', 'layup', 'catch3']); return pick(['layup', 'catchMid']); };
    const ACT_LABEL = { catch3: 'catch-and-shoot three', pull3: 'pull-up three', catchMid: 'open jumper', pullMid: 'pull-up jumper', layup: 'drive and finish', dunk: 'throw it down', hook: 'post hook', fade: 'post fadeaway' };
    /* one of our offensive weapons is usable for this action? (NPCs: each weapon twice per game) */
    const npcWeapon = (p, action) => { const id = (p.weapons || []).find(w => Weapons.fits(w, action)); return id && (st.wUses[p.name + id] || 0) < 2 ? id : null; };
    async function weaponFlash(p, id, side) {
      const w = WEAPONS[id]; st.wUses[p.name + id] = (st.wUses[p.name + id] || 0) + 1; cnt(side === 'us' && p.isUser ? 'weaponUses' : 'npcWeapons');
      court.aura(p, side === 'us' ? '#facc15' : '#ef4444', 2.4); court.impact(.28, 6, .4, .06, side === 'us' ? '250,204,21' : '239,68,68'); SFX.play('sig');
      const first = !st.wMini[p.name]; st.wMini[p.name] = 1;
      const shown = first && (p.isUser || p === STAR || Math.random() < .5) && await court.mini('weapon', '⚔ ' + w.name.toUpperCase(), { look: p.look, name: p.full || p.name, colors: side === 'us' ? cfg.us.colors : cfg.them.colors, mine: side === 'us' });
      if (!shown) { const ts = court.timeScale; court.timeScale = .35; await banner(`<small>⚔ ${escH(p.full || p.name)}</small>${escH(w.name)}`, 'sig wpn-' + side, 1150); court.timeScale = ts; }
      pbp(`⚔ <b>${escH(p.short)}</b> uses <b>${escH(w.name)}</b>!`, side === 'us' ? 'hot' : 'bad');
    }
    /* animate any player's shot (not yours) — returns made */
    async function animShot(p, action, made, o = {}) {
      court.ball.holder = p;
      if (action === 'dunk') return court.dunk(p, made, o.poster);
      if (action === 'layup') return court.layup(p, made);
      if (action === 'hook' || action === 'fade') { await court.moveTo(p, p.x > 0 ? 5 : -5, 9, .35); return court.shoot(p, made ? 'swish' : 'miss', { arc: 4, slowmo: o.slowmo }); }
      if (action === 'pull3' || action === 'pullMid') { SFX.play('squeak'); await court.moveTo(p, p.x + (p.x > 0 ? 1.5 : -1.5), p.y + 1.2, .25); }
      return court.shoot(p, made ? (Math.random() < .55 ? 'swish' : 'rimin') : (Math.random() < .06 ? 'airball' : 'miss'), { slowmo: o.slowmo });
    }
    function heatCheck(made) {
      if (!made) { st.starRun = 0; return; }
      st.starRun++;
      if (st.starRun >= OB.star.heatAt && !(st.takeover > 0)) { st.takeover = OB.star.takeover; st.talkEv = 'he_hot'; queueTalk('rival', .7); court.aura(STAR, '#ef4444', 3); pbp(`🔥 <b>${escH(STAR.short)} is taking over!</b> ${st.starRun} straight bucket${st.starRun > 1 ? 's' : ''}.`, 'bad'); banner(`<small>${escH(STAR.full)}</small>IS TAKING OVER`, 'fire', 1300); SFX.play('roar'); }
    }
    const heatBonus = by => by !== STAR ? [] : [].concat(st.takeover > 0 ? [{ label: 'Taking over', v: OB.star.bonus }] : [], st.rattled > 0 ? [{ label: 'Rattled', v: -8 }] : []);
    const diffBonus = () => (diffShift ? [{ label: 'Difficulty', v: Math.round(diffShift * .6) }] : []).concat(tutOn() ? [{ label: 'Warm-up', v: -8 }] : []);   // Kai takes it easy until the tutorial is done
    /* a teammate's own possession — you choose how to help, then he plays it with his stats (and maybe a weapon) */
    async function matePlay() {
      const mates = MATES(); if (!mates.length) return offPossession();
      const m = pick(mates.concat(mates.filter(x => x.role === 'shooter' || x.role === 'slasher')));
      formation('us'); court.ball.holder = m; m.x = m.role === 'big' ? 6 : m.x; m.y = m.role === 'big' ? 10 : m.y;
      let action = roleAction(m); const wid = Math.random() < OB.weaponUse * 1.4 ? (m.weapons || []).map(id => [id, ACT_OF[WEAPONS[id] && WEAPONS[id].type]]).find(([id, a]) => a && npcWeapon(m, a)) : null;
      if (wid) action = wid[1];
      const d = opp(m), def = d.stats || DEF;
      const base = wid ? Weapons.pct(wid[0], m.stats, { def, npc: true, diff: s.difficulty }) : Balance.pct(action, m.stats, { def, diff: s.difficulty, contest: 'normal' });
      const scr = Math.round(4 + (Balance.eff(ME.str) * .5 + Balance.eff(ME.iq) * .5) / 99 * 6);
      const opts = [
        { k: 'screen', label: 'Set a screen for him', desc: `Strength ${ME.str} + IQ ${ME.iq} free him up (+${scr}%)`, pct: Math.min(95, base.pct + scr), parts: base.parts.concat([{ label: 'Your screen', v: scr }]) },
        { k: 'spot', label: 'Spot up for the kick-out', desc: 'If his man helps, he finds you open', pct: base.pct, parts: base.parts },
        { k: 'crash', label: 'Crash the offensive glass', desc: 'If he misses, the board is yours more often', pct: base.pct, parts: base.parts },
      ];
      const ch = await choose(`<b>${escH(m.short)} has it — ${escH(ACT_LABEL[action] || 'attacking')} coming. ${wid ? `⚔ He's ready to use <i>${escH(WEAPONS[wid[0]].name)}</i>.` : ''}</b>`, opts);
      tire();
      if (ch.k === 'spot' && roll(34)) {   // kick-out to you
        pbp(`${escH(m.short)} draws the help and kicks it out to ${myName}!`); await court.pass(m, U);
        const c = calc('catch3', { contest: 'open' }); busy(`<b>Kick-out from ${escH(m.short)}!</b>`, '🎮 Catch & shoot');
        const r = await MG.shotMeter($('mg'), { title: 'CATCH & SHOOT', green: green(ME.three, FT('catch3')) * MGX('green'), dur: 1, sub: `Three-Point ${ME.three} · base ${c.pct}%` }); idle();
        const fin = Balance.apply('catch3', c.pct, meterQ(r), FT('catch3'), { perfect: r.perfect, contest: 'open' }), made = await myShot('three', roll(fin), { perfect: r.perfect });
        if (made) { m.box.ast++; pbp(`${myName} buries it off ${escH(m.short)}'s kick-out. <i class="pct-note">${fin}%</i>`, 'good'); success(); } else { pbp(`${myName} can't knock down the kick-out. <i class="pct-note">${fin}%</i>`); fail(); await boardAfterMiss(true); }
        return made;
      }
      if (wid) await weaponFlash(m, wid[0], 'us');
      const made = roll(ch.pct), three = !!BALANCE.actions[action].three;
      await animShot(m, action, made, { poster: action === 'dunk' && made && wid }); shotBox(m, made, three);
      if (ch.k === 'screen') cnt('screens');
      if (made) { addPts('us', three ? 3 : 2, playOf(m, KIND_OF[action] || 'layup')); court.celebrate(m, three ? 'three' : action === 'dunk' ? 'dunk' : 'two'); pbp(`${escH(m.short)} ${three ? 'drills a three' : action === 'dunk' ? 'throws it down' : 'scores'}${ch.k === 'screen' ? ' off your screen' : ''}. <i class="pct-note">${ch.pct}%</i>`, 'good'); st.mateMakes++; if (ch.k === 'screen') success(); return true; }
      pbp(`${escH(m.short)} misses. <i class="pct-note">${ch.pct}%</i>`);
      if (ch.k === 'crash') { const p = Math.min(90, calc('rebound', { def: Balance.profile(oppR) }).pct * .8); if (roll(p)) { st.box.reb++; cnt('rebounds'); court.ball.holder = U; pbp(say('oreb'), 'good'); const pm = await myShot('layup', roll(calc('layup', { contest: 'contested' }).pct)); pbp(say(pm ? 'putback' : 'putback_miss'), pm ? 'good' : ''); success(); return pm; } pbp(say('lost_oreb')); return false; }
      await boardAfterMiss(true); return false;
    }
    /* one of their role players attacks one of your teammates — you decide whether to help */
    async function oppPlay() {
      const others = TH.filter(p => p !== STAR); if (!others.length || !MATES().length) return defPossession();
      const a = pick(others), g = opp(a), gd = g.stats || MATE;
      formation('them'); court.ball.holder = a;
      let action = roleAction(a); const wid = Math.random() < OB.weaponUse ? (a.weapons || []).map(id => [id, ACT_OF[WEAPONS[id] && WEAPONS[id].type]]).find(([id, x]) => x && npcWeapon(a, x)) : null;
      if (wid) action = wid[1];
      const their = wid ? Weapons.pct(wid[0], a.stats, { def: gd, npc: true, bonus: diffBonus() }).pct : Balance.pct(action, a.stats, { def: gd, contest: 'normal', bonus: diffBonus() }).pct;
      const blk = calc('block', { def: a.stats }), stl = calc('steal', { def: a.stats });
      const ch = await choose(`<b>${escH(a.short)} attacks ${escH(g.short)}${wid ? ` — ⚔ <i>${escH(WEAPONS[wid[0]].name)}</i> incoming!` : '.'}</b>`, [
        { k: 'home', label: 'Stay home on your man', desc: `Trust ${g.short} to defend`, pct: 100 - their, parts: [{ label: `${a.short}'s shot ${their}% vs ${g.short}`, v: null }] },
        { k: 'help', label: 'Help at the rim', desc: 'Block chance — but your man is left open', pct: blk.pct, parts: blk.parts, mg: 'Block timing' },
        { k: 'lane', label: 'Jump the passing lane', desc: 'Quick decision · risky', pct: stl.pct, parts: stl.parts },
      ]);
      tire();
      if (wid && ch.k !== 'lane') await weaponFlash(a, wid[0], 'them');
      if (ch.k === 'lane') { if (roll(ch.pct)) return stealPlay(a); pbp(`${myName} gambles — ${escH(a.short)} goes right by.`, 'bad'); const mm = await theyShoot('layup', 'open', a, { def: g }); if (mm) fail(); return !mm; }
      if (ch.k === 'help') {
        busy(`<b>${escH(a.short)} drives on ${escH(g.short)}</b>`, '🎮 Time the block');
        const r = await MG.rebound($('mg'), { title: 'BLOCK IT', zone: (.07 + (ME.intD * .6 + ME.vert * .4) / 99 * .14) * WIN() * (1 + APE * .02) }); idle();
        const ok = r.success && roll(Balance.apply('block', blk.pct, r.quality));
        await court.drive(a, -2, 8, .4); await court.block(U, a, ok);
        if (ok) { st.box.blk++; cnt('blocks'); cnt('stops'); pbp(`${myName} rotates over and swats ${escH(a.short)}!`, 'good'); success(true); await boardAfterMiss(false); return true; }
        pbp(`${escH(a.short)} sees you coming and kicks it to the open man.`, 'bad'); const mm = await theyShoot('catch3', 'open', STAR, { def: U }); if (mm) pbp(`${escH(STAR.short)} hits the open three.`, 'bad'); else pbp(`${escH(STAR.short)} misses the open three. Lucky.`); mm ? fail() : success(); if (!mm) await boardAfterMiss(false); return !mm;
      }
      const mm = await theyShoot(action, 'normal', a, { def: g, pct: their });
      pbp(mm ? `${escH(a.short)} scores on ${escH(g.short)}. <i class="pct-note">${their}%</i>` : `${escH(g.short)} holds ${escH(a.short)} — miss. <i class="pct-note">${their}%</i>`, mm ? 'bad' : 'good');
      if (!mm) await boardAfterMiss(false); return !mm;
    }
    /* a star uses a weapon on you: choose how to defend, then a quick defense minigame */
    const DEFOPT = {
      shot: [['crowd', 'Crowd the shooter', 'contest', 'Contest timing', 4], ['stay', 'Stay down — don\'t bite', 'stop', 'Mirror the move', 2], ['late', 'Give space, late contest', 'contest', 'Contest timing', -4]],
      rim: [['wall', 'Wall up at the rim', 'block', 'Block timing', 3], ['charge', 'Take the charge', 'charge', 'Set your feet', 0], ['strip', 'Strip it on the gather', 'steal', 'Quick hands', -3]],
      pass: [['lane', 'Jump the passing lane', 'steal', 'Quick hands', 0], ['home', 'Stay home', 'stop', 'Mirror the move', 4]],
    };
    async function weaponCounter(att, id, text) {
      const w = WEAPONS[id], fam = ['three', 'mid'].includes(w.type) ? 'shot' : w.type === 'pass' ? 'pass' : 'rim', action = ACT_OF[w.type] || 'layup';
      formation('them'); court.ball.holder = att; att.x = 4; att.y = w.type === 'three' ? 27 : 20; U.x = 3.6; U.y = att.y - 3; U.pose = 'def';
      await weaponFlash(att, id, 'them'); st.oppSig = 0;
      const wp = Weapons.pct(id, att.stats, { def: ME, npc: true, star: att === STAR, bonus: heatBonus(att).concat(diffBonus()) }).pct;
      const opts = DEFOPT[fam].map(([k, label, act, mg, mod]) => { const dp = calc(act, { def: att.stats }).pct, their = clamp(Math.round(wp - (dp - 50) * .6 - mod), 5, 95); return { k, label, desc: `${w.name} is ${wp}% — you cut it to ${their}%`, act, pct: 100 - their, parts: [{ label: `${w.name} ${wp}%`, v: null }, { label: `Your ${BALANCE.actions[act].name.toLowerCase()} ${dp}%`, v: Math.round((dp - 50) * .6) }], mg, their }; });
      const mine = sigReady() ? Engine.weapons(s).find(x => ['stop', 'steal', 'block'].includes(x.w.type)) : null;
      if (mine) { const p = Engine.weaponPct(s, mine.id, att.stats, bonuses('stop')).pct; opts.push({ k: 'mywpn', label: '⚔ ' + mine.w.name, desc: 'Answer with your own weapon', act: mine.w.type === 'block' ? 'block' : mine.w.type === 'steal' ? 'steal' : 'stop', pct: Math.round((p + (100 - wp)) / 2), parts: [{ label: `${mine.w.name} ${p}% vs ${w.name} ${wp}%`, v: null }], mg: 'Weapon minigame', cls: 'sig', their: 100 - Math.round((p + (100 - wp)) / 2) }); }
      const ch = await choose(`<b>⚔ ${escH(att.short)} is using <i>${escH(w.name)}</i> on you! ${escH(text || '')}</b>`, opts);
      tire();
      if (ch.k === 'mywpn') { st.sigUses++; st.sig = 0; st.sigUsed = st.sigUses >= (Engine.hasSpecial(s, 'formless') ? 2 : 1); await weaponFlash(U, mine.id, 'us'); }
      const setup = `<b>Stop ${escH(att.short)}'s ${escH(w.name)}!</b>`; let q = .5;
      busy(setup, `🎮 ${ch.mg}`);
      if (ch.act === 'block' || ch.act === 'contest' || ch.act === 'charge') { const r = await MG.rebound($('mg'), { title: ch.act === 'charge' ? 'SET YOUR FEET' : ch.act === 'block' ? 'BLOCK IT' : 'CONTEST', zone: (.07 + (ch.act === 'charge' ? ME.iq : ME.perD * .6 + ME.vert * .4) / 99 * .14) * WIN() * MGX('defWindow'), dur: ch.act === 'charge' ? 1 : 1.3 }); q = r.success ? r.quality : 0; }
      else { const r = await MG.defenseReact($('mg'), { window: (330 + (ME.perD * .6 + ME.speed * .4) / 99 * 470) * WIN() * MGX('defWindow') * (ch.k === 'mywpn' ? 1.25 : 1), title: ch.act === 'steal' ? 'GO FOR THE STEAL' : 'LOCK IN', attackerSvg: Art.avatar(Art.lookFromSeed(att.name, { jersey: cfg.them.colors[0], trim: cfg.them.colors[1], expr: 'fierce' }), { mode: 'bust' }) }); q = r.success ? r.quality : 0; }
      idle();
      const stopP = clamp(Math.round(ch.pct + (q - .5) * WB.skill), 5, 95), stopped = roll(stopP);
      if (stopped && ch.act === 'steal') { pbp(`${myName} reads <b>${escH(w.name)}</b> and strips ${escH(att.short)}! <i class="pct-note">${stopP}% stop</i>`, 'good hot'); st.highlights.push(`Stopped ${att.short}'s ${w.name}`); return stealPlay(att); }
      if (stopped && ch.act === 'charge') { await court.collide(att, U, true); banner('OFFENSIVE FOUL!', 'clutch', 1000); cnt('charges'); cnt('stops'); pbp(`${myName} takes the charge on ${escH(att.short)}'s <b>${escH(w.name)}</b>! <i class="pct-note">${stopP}%</i>`, 'good hot'); st.highlights.push(`Took a charge on ${att.short}`); success(true); SFX.play('roar'); return true; }
      if (stopped && ch.act === 'block') { await court.drive(att, 1, 8, .35); await court.block(U, att, true); st.box.blk++; cnt('blocks'); cnt('stops'); pbp(`REJECTED! ${myName} meets ${escH(att.short)}'s <b>${escH(w.name)}</b> at the rim. <i class="pct-note">${stopP}%</i>`, 'good hot'); st.highlights.push(`Blocked ${att.short}'s ${w.name}`); success(true); await boardAfterMiss(false); return true; }
      U.pose = stopped ? 'block' : 'def';
      const made = await theyShoot(action, stopped ? 'heavy' : 'normal', att, { made: !stopped, slowmo: true }); U.pose = '';
      if (made) { pbp(`<b>${escH(w.name)}</b> — ${escH(att.short)} gets you. <i class="pct-note">${stopP}% stop</i>`, 'bad'); fail(); return false; }
      cnt('stops'); pbp(`${myName} stays with it — ${escH(att.short)}'s <b>${escH(w.name)}</b> misses! <i class="pct-note">${stopP}% stop</i>`, 'good hot'); st.highlights.push(`Stopped ${att.short}'s ${w.name}`); if (att === STAR) cnt('starStops'); success(true); await boardAfterMiss(false); return true;
    }
    const starWeapon = () => { const id = (STAR.weapons || []).find(x => WEAPONS[x] && WEAPONS[x].type !== 'stop' && WEAPONS[x].type !== 'steal' && WEAPONS[x].type !== 'block'); return id && (st.oppSig || 0) >= WB.npc.charge && (st.wUses[STAR.name + id] || 0) < 3 ? id : null; };
    /* the star is hot: the coach asks if you can guard him */
    async function guardStar() {
      st.takeover--; const g = MATES().length ? opp(STAR) === U ? MATES()[0] : opp(STAR) : U;
      const theirMe = Balance.pct('pullMid', STAR.stats, { def: ME, contest: 'normal', bonus: heatBonus(STAR).concat(diffBonus()) }).pct, theirMate = Balance.pct('pullMid', STAR.stats, { def: g.stats || MATE, contest: 'normal', bonus: heatBonus(STAR).concat(diffBonus()) }).pct;
      formation('them'); court.ball.holder = STAR;
      const ch = g === U ? { k: 'me' } : await choose(`<b>📣 Coach: "${escH(STAR.short)} is cooking. ${escH(properName(s.player.first))} — can you guard him?"</b>`, [
        { k: 'me', label: '"I got him."', desc: 'Take the assignment (Coach Trust)', pct: 100 - theirMe, parts: [{ label: `${STAR.short} ${theirMe}% vs you`, v: null }] },
        { k: 'mate', label: `Let ${g.short} take him`, desc: 'You stay on your own man', pct: 100 - theirMate, parts: [{ label: `${STAR.short} ${theirMate}% vs ${g.short}`, v: null }] }]);
      if (ch.k === 'me') { cnt('starAssign'); pbp(`${myName} takes the ${escH(STAR.short)} assignment.`, 'hot'); const id = starWeapon(); if (id) return weaponCounter(STAR, id, 'He wants to cook you.'); return defPossession({ text: `${STAR.short} isolates on you. Everybody clears out.` }); }
      const made = await theyShoot(pick(['pullMid', 'pull3', 'layup']), 'normal', STAR, { def: g });
      pbp(made ? `${escH(STAR.short)} scores over ${escH(g.short)} again.` : `${escH(g.short)} gets a stop on ${escH(STAR.short)}!`, made ? 'bad' : 'good'); if (!made) await boardAfterMiss(false); return !made;
    }


    /* =================================================================
       TALK — quick conversations with a gauge (coach / ref PATIENCE, rival EGO). Data: js/data-talk.js
       ================================================================= */
    const TK = typeof TALK !== 'undefined' ? TALK : null;
    const coachId = cfg.level === 'street' ? (PICK ? null : 'lou') : s.career.hs === 'lincoln' ? 'brennan' : s.career.hs === 'westbrook' ? 'graves' : 'coach';
    const refId = cfg.level === 'street' ? null : pick(['ref_dawkins', 'ref_vance', 'ref_ortiz']);
    const rivalId = star.name === 'Kai Sterling' ? 'kai' : star.name === 'Bastien Mbaye' ? 'mbaye' : ['hothead', 'iceman', 'showman'][Weapons.hash(star.name) % 3];   // each star keeps the same voice
    const MATE_LOOK = () => Object.assign({}, TMATE().look, { jersey: cfg.us.colors[0], trim: cfg.us.colors[1], outfit: 'jersey' });   // your teammate wears your colors in talks
    const TMATE = () => US.filter(p => !p.isUser).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0], mateId = US.some(p => /Tariq/.test(p.full || p.name || '')) ? 'tariq' : ['mate_vet', 'mate_hype'][Weapons.hash(cfg.us.name || 'x') % 2];
    /* prospect rankings: the star's rank (face-off card, talk lines, cinematic name plates) */
    const RK = typeof Rankings !== 'undefined' && Rankings.on(s), myRank = RK ? Rankings.rankOf(s) : null, starRank = RK ? Rankings.infoFor(s, star.name) : null;
    if (!cfg.starSub && starRank) cfg.starSub = `#${starRank.rank} in the class · ${cfg.them.name}`;
    /* CINEMATIC CONVERSATIONS (Cutscene.cine): rival face-offs (Kai, big stars, higher-ranked prospects), halftime speeches,
       clutch huddles and heated refs in big games — about one every few games (BALANCE.cine), more in rivalry games and playoffs.
       They replace a regular talk; they never add one. */
    const CN = BALANCE.cine || { every: 3, big: 3, bigChance: .5 }, imp0 = cfg.importance || 1;
    function cineKind(type, topic) {
      if (typeof Cutscene === 'undefined' || !Cutscene.cine || cfg.practice || tutOn() || (st.cineN || 0) >= (imp0 >= 2 ? 2 : 1)) return null;
      const k = topic === 'half' ? 'halftime' : topic === 'clutch' ? 'huddle' : type === 'ref' && imp0 >= 2 ? 'ref'
        : type === 'rival' && (rivalId === 'kai' || (starRank && myRank && starRank.rank < myRank) || (imp0 >= 2 && oppR >= usR + 2) || rivalId === 'mbaye') ? 'faceoff' : null;
      if (!k) return null;
      const gap = s.cineGap == null ? 99 : s.cineGap;
      return gap >= CN.every - 1 || imp0 >= CN.big || rivalId === 'kai' || (imp0 >= 2 && Math.random() < CN.bigChance) ? k : null;
    }
    const venueScene = () => { const V = court.V.def || {}; return V.rain || V.weather === 'rain' ? 'rain_night' : V.style === 'arena' ? 'arena' : V.style === 'gym' ? 'gym' : V.sky === 'night' ? 'street_night' : 'street_sunset'; };
    function rankRows() { if (!RK) return null; const L = Rankings.list(s), i = L.findIndex(r => r.me); return L.slice(Math.max(0, i - 8), i + 6).map(r => ({ rank: r.rank, name: r.p.name, me: !!r.me })); }
    async function cineScene(o, ck, id, P) {
      const sub = id === rivalId && starRank ? `#${starRank.rank} in the class` : P.kind === 'ref' ? 'Referee' : P.kind === 'coach' ? 'Coach' : P.trait ? P.trait.split('.')[0] : '';
      const d = st.us - st.them, scoreTxt = d === 0 ? `TIED ${st.us}-${st.them}` : d > 0 ? `UP ${d} · ${st.us}-${st.them}` : `DOWN ${-d} · ${st.us}-${st.them}`;
      const C = await Cutscene.cine({ kind: ck, scene: ck === 'halftime' ? 'locker' : venueScene(), rain: /rain/.test(venueScene()),
        ctx: { team: cfg.us, them: cfg.them, usAbbr: cfg.us.abbr, themAbbr: cfg.them.abbr, score: `${st.us}-${st.them}`, venue: court.venueId, night: true },
        cast: { you: Object.assign({}, U.look || {}, { num: s.player.num, jersey: cfg.us.colors[0], trim: cfg.us.colors[1], outfit: 'jersey' }), them: o.look },
        names: { them: o.name }, subs: { you: myRank ? `#${myRank} in the class · ${s.player.pos}` : s.player.pos, them: sub }, rim: { you: '#93c5fd', them: ck === 'faceoff' ? '#fca5a5' : '#fde68a' },
        title: ck === 'faceoff' ? 'FACE-OFF' : ck === 'halftime' ? 'HALFTIME' : ck === 'huddle' ? 'TIMEOUT' : 'DEAD BALL', sub: ck === 'faceoff' && starRank && myRank ? `#${myRank} vs #${starRank.rank}` : scoreTxt,
        gauge: { label: o.gaugeLabel, g: o.g, ego: o.ego }, rankRows: rankRows() });
      if (!C) return null;
      st.cineN = (st.cineN || 0) + 1; cnt('cineTalks');
      const w = who => who === 'me' ? 'you' : who;
      return { say: (who, t, e, v) => C.say(w(who), t, e, v), ask: opts => C.ask(opts), face: (who, e) => C.face(w(who), e), gauge: (g, dl, good) => C.gauge(g, dl, good), close: () => C.close(), peak: (k, who) => C.peak(k, who && w(who)), get skipped() { return C.skipped; }, cine: ck };
    }
    /* in-game conversations happen in about 1 game in 3 (BALANCE.talk.every), never more than once */
    const talkOK = !cfg.practice && ((s.talkGap == null ? 99 : s.talkGap) >= ((BALANCE.talk && BALANCE.talk.every) || 3) - 1);
    const talkLook = id => { const P = TK && TK.personalities[id]; if (!P) return null; if (P.kind === 'rival') return Object.assign({}, STAR.look, { jersey: cfg.them.colors[0], trim: cfg.them.colors[1], outfit: 'jersey' }); if (P.kind === 'mate') return TMATE() ? MATE_LOOK() : Art.lookFromSeed(id, P.look || {}); if (P.char && STORY.characters[P.char]) return UI.charLook(P.char); return Art.lookFromSeed(P.name || id, P.look || {}); };
    const talkName = id => { const P = TK.personalities[id]; return P.kind === 'rival' ? STAR.full : P.kind === 'mate' ? (TMATE() ? TMATE().full || TMATE().name : 'Teammate') : P.char && STORY.characters[P.char] ? STORY.characters[P.char].name : P.name || 'Coach'; };
    /* ask for a conversation at the next dead ball (with probability p) */
    function queueTalk(type, p = 1, topic) { if (!TK || tutOn() || !talkOK || st.talkQ || st.done || st.talkN >= ((BALANCE.talk && BALANCE.talk.perGame) ?? 1) || Math.random() > p) return; if (type === 'coach' && !coachId) return; if (type === 'ref' && !refId) return; if (type === 'ref') st.talkEv = 'bad_call'; st.talkQ = { type, topic }; if (type === 'coach' && typeof Cutscene !== 'undefined') Cutscene.prep(talkLook(coachId)); }
    /* =================================================================
       IN-GAME DIALOGUE AS A MINI CUTSCENE — the game pauses, the camera pushes in, letterbox bars slide in and the
       background dims. You and the other person face off in big 16-bit portraits (expressions change as you talk);
       the speaker lights up, lines type out, and the choices + gauge sit in the letterbox bars (never on the faces).
       ================================================================= */
    const talkScene = o => talkSceneCore(o, { court, meLook: Object.assign({}, U.look || {}, { num: s.player.num, jersey: cfg.us.colors[0], trim: cfg.us.colors[1], outfit: 'jersey' }), first: s.player.first, last: s.player.last, beat, waitInput });
    /* ---------- conversations from the line pools (js/data-talk-lines.js): fit the moment, never repeat until a pool is used up ---------- */
    function talkCtx() {
      const d = st.us - st.them, V = (s.vs || {})[STAR.full];
      const score = (d >= 10 ? ['bigup', 'up'] : d <= -10 ? ['bigdown', 'down'] : d > 0 ? ['up'] : d < 0 ? ['down'] : ['tied']).concat(Math.abs(d) <= 3 ? ['close'] : []);
      return { rank: starRank && myRank ? [starRank.rank < myRank ? 'below' : 'above', 'ranked'] : []   /* from YOUR side: below = he's ranked higher */, score, ev: st.talkEv ? [st.talkEv] : [], when: st.i >= n * .6 ? 'late' : 'early', vs: [!V || !V.g ? 'first' : null, V && V.last > 0 ? 'won' : null, V && V.last < 0 ? 'lost' : null, V && V.g >= 3 ? 'many' : null].filter(Boolean), games: V ? V.g + 1 : 1 };
    }
    function condOk(c, X, topic) {
      if (!c) return true;
      for (const k in c) { const v = c[k];
        if (k === 'topic' ? v !== topic : k === 'rank' ? !X.rank.includes(v) : k === 'score' ? !X.score.includes(v) : k === 'ev' ? !X.ev.includes(v) : k === 'when' ? v !== X.when : k === 'vs' ? !X.vs.includes(v) : k === 'flag' ? ![].concat(v).every(f => s.flags[f]) : k === 'hs' ? s.career.hs !== v : false) return false; }
      return true;
    }
    function drawLine(key, pool, ok, prefer) {   // no repeats until the pool is used up (saved per career)
      const seen = s.talkSeen || (s.talkSeen = {}), used = seen[key] || (seen[key] = []);
      const items = (pool || []).map((l, i) => Object.assign({ i }, typeof l === 'string' ? { t: l } : l)).filter(ok);
      if (!items.length) return null;
      let cand = items.filter(l => !used.includes(l.i)); if (!cand.length) { seen[key] = used.filter(i => !items.some(l => l.i === i)); cand = items; }
      const pref = prefer ? cand.filter(prefer) : []; const L = pref.length && Math.random() < .8 ? pick(pref) : pick(cand);
      seen[key].push(L.i); return L.t;
    }
    function buildTalk(id, P, topic, pre) {
      const X = talkCtx(), key = TK.lines[id] ? id : P.kind === 'coach' ? 'coach' : P.kind === 'ref' ? 'ref_dawkins' : P.kind === 'mate' ? 'mate_vet' : 'hothead', L = TK.lines[key], kind = P.kind;
      const ok = l => condOk(l.if, X, topic), specific = l => l.if && Object.keys(l.if).length > 0;
      const lines = [drawLine(key + ':open', L.open, ok, l => specific(l) && (!l.if.topic || l.if.topic === topic) && (l.if.topic === topic || Object.keys(l.if).some(k => k !== 'topic')))];
      if (!pre || Math.random() < .5) lines.push(drawLine(key + ':push', L.push, ok));
      if (!pre && Math.random() < .35) lines.push(drawLine(key + ':push', L.push, ok));
      // your 3 answers: something this person likes, something he doesn't, and one more
      const sty = Object.entries(P.styles), R = TK.replies[kind] || TK.replies.coach, has = k => R[k] && R[k].length;
      const exch = lines.filter(Boolean).map(say => {
        const good = sty.filter(([k, v]) => v > 0 && has(k)), bad = sty.filter(([k, v]) => v <= 0 && has(k));
        const pickS = list => list.length ? pick(list)[0] : null, a = pickS(good), b = pickS(bad), c = pickS(sty.filter(([k]) => has(k) && k !== a && k !== b));
        const opts = [a, b, c].filter(Boolean).map(stl => [stl, drawLine(`r:${kind}:${stl}`, R[stl], l => !l.char || l.char === id) || pick(R[stl].map(x => x.t || x))]);
        return { say, opts };
      });
      exch.close = drawLine(key + ':close', L.close, ok);
      return exch;
    }
    if (window.__talkDebug) window.__talkDebug = { build: (type, topic, pre) => { const id = type === 'coach' ? coachId : type === 'ref' ? refId : type === 'mate' ? mateId : rivalId; return id && TK.personalities[id] ? Object.assign(buildTalk(id, TK.personalities[id], topic, pre), { id }) : null; }, st };   // automated tests only
    async function talk(type, topic, pre) {   // pre = the short pre-game talk (doesn't count toward the in-game limit)
      const id = type === 'coach' ? coachId : type === 'ref' ? refId : type === 'mate' ? mateId : rivalId, P = TK.personalities[id]; if (!P) return;
      if (pre) cnt('pretalks'); else { st.talkN++; st.talkAt = st.i; cnt('talks'); }
      const tp = pre ? 'pre' : type === 'coach' ? (topic || pick(['play', 'minutes'])) : type === 'ref' ? 'call' : 'trash', ck = cineKind(type, topic);
      const script = buildTalk(id, P, tp, pre);
      const nEx = script.length, ego = P.kind === 'rival';
      let g = ego ? 100 : P.start, backfires = 0, ended = false;
      const look = talkLook(id), name = talkName(id), first = properName(s.player.first), X = talkCtx(), fillT = t => t.replace(/\{first\}/g, first).replace(/\{last\}/g, myName).replace(/\{num\}/g, s.player.num)
        .replace(/\{star\}/g, STAR.short).replace(/\{opp\}/g, cfg.them.name).replace(/\{us\}/g, cfg.us.name).replace(/\{score\}/g, `${Math.max(st.us, st.them)}-${Math.min(st.us, st.them)}`).replace(/\{hs\}/g, s.career.hs && LOCAL_TEAMS[s.career.hs] ? LOCAL_TEAMS[s.career.hs].name : 'the team').replace(/\{games\}/g, X.games).replace(/\{myrank\}/g, myRank ? '#' + myRank : 'unranked').replace(/\{theirrank\}/g, starRank ? '#' + starRank.rank : 'unranked');
      const voice = { f: type === 'ref' ? 160 : type === 'rival' ? 330 : type === 'mate' ? 240 : 140, w: 'square', g: .035 }, myVoice = { f: 280, w: 'square', g: .03 };
      const tag = pre ? 'PRE-GAME' : type === 'coach' ? 'TIMEOUT' : type === 'ref' ? 'DEAD BALL' : type === 'rival' ? 'FACE-OFF' : 'HUDDLE';
      const so = { title: `${tag} · ${name}`, name, trait: P.trait, look, ego, g, gaugeLabel: ego ? 'EGO' : P.kind === 'mate' ? 'TRUST' : 'PATIENCE', startExpr: type === 'rival' ? 'smile' : 'neutral' };
      const T = (ck && await cineScene(so, ck, id, P)) || await talkScene(so), CI = !!T.cine, pk = (k, who) => { if (CI) T.peak(k, who); };
      if (CI && ck === 'faceoff') pk(starRank && myRank && starRank.rank < myRank ? 'predator' : 'glint', 'them');
      let shattered = false;
      try {
        for (let k = 0; k < nEx && !ended; k++) {
          const ex = script[k], opts = ex.opts.slice().sort(() => Math.random() - .5);
          await T.say('them', fillT(ex.say), type === 'rival' ? 'smile' : type === 'ref' && k ? 'determined' : null, voice);
          let pickI = await T.ask(opts.map(o2 => fillT(o2[1])));
          if (pickI < 0) { let bi = 0, bv = 99; opts.forEach((o2, j) => { const v2 = Math.abs(P.styles[o2[0]] || 0); if (v2 < bv) { bv = v2; bi = j; } }); pickI = bi; ended = true; }   // skipped: the calmest answer, and the talk ends there
          const style = opts[pickI][0], v = Math.round((P.styles[style] || 0) + rnd(-3, 3)), good = v > 0;
          await T.say('me', fillT(opts[pickI][1]), STYLE_EXPR[style] || 'determined', myVoice);
          if (ego) g = clamp(g - v, 0, 130); else g = clamp(g + v, 0, 100); if (!good) backfires++;
          T.gauge(g, (ego ? (good ? '−' : '+') : (good ? '+' : '−')) + Math.abs(v), good); SFX.play(good ? 'good' : 'bad');
          if (CI) { if (good && ego && g <= 60 && !shattered) { shattered = true; pk('shatter'); } else if (good) pk('aura', 'me'); else pk(ego ? 'predator' : 'glint', 'them'); }   // the peak: his composure breaks / your aura / his glare
          await T.say('them', pick(good ? P.good : P.bad), ego ? (good ? 'angry' : 'smile') : (good ? 'smile' : 'angry'), voice);
          T.face('me', good ? 'smile' : 'shocked'); await sleep(CI ? 200 : 700);
          if (v <= TK.endAt || (!ego && g <= 0)) ended = true;   // the wrong thing ends it early
        }
        if (!ended && script.close) { if (CI) { pk(ck === 'faceoff' ? 'eyes' : 'aura', ck === 'faceoff' ? 'them' : 'me'); if (ck !== 'faceoff' && RK) pk('ranks'); } await T.say('them', fillT(script.close), ego ? 'fierce' : 'determined', voice); await sleep(CI ? 100 : 400); }
      } finally { await T.close(); }
      idle();
      /* ---------- outcomes ---------- */
      if (pre) {   // small pre-game effects
        if (type === 'rival') { if (g <= 60) { st.rattled = 1; pbp(`😤 ${escH(STAR.short)} looked rattled before tip-off.`, 'good'); } else if (backfires >= 2) { st.shaken = 1; pbp(`${escH(STAR.short)} got the last word before tip-off.`, 'bad'); } else pbp(`${escH(STAR.short)} smirks and jogs off.`); }
        else if (!ended && g >= 60) { st.nextBonus = { label: type === 'mate' ? 'Chemistry' : 'Game plan', v: type === 'mate' ? 3 : 4 }; pbp(type === 'mate' ? `🤝 ${escH(name)} is locked in with you. (+3% next play)` : `📣 ${escH(name)} likes your answer. (+4% next play)`, 'good'); }
        else if (g <= 20) { s.meta.morale = Math.max(0, s.meta.morale - 2); pbp(`${escH(name)} walks away shaking his head.`, 'bad'); }
        else pbp(`${escH(name)}: "Let's just play."`);
        return;
      }
      if (type === 'coach') {
        const win = !ended && g >= 60;
        if (win && topic === 'half') { st.nextBonus = { label: 'Halftime adjustments', v: 6 }; st.morale2 = 1; pbp(`📣 ${escH(name)}'s halftime speech lands. You come out of the locker room on fire (+6%).`, 'good hot'); }
        else if (win && topic === 'clutch') { st.playCalled = true; st.nextBonus = { label: 'Clutch play call', v: 8 }; pbp(`📣 ${escH(name)} draws it up for you. Last plays run through you (+8%).`, 'good hot'); }
        else if (topic === 'half' || topic === 'clutch') pbp(`📣 ${escH(name)}: "Just go win it."`);
        else if (win && topic === 'play') { st.playCalled = true; st.nextBonus = { label: 'Play called for you', v: 8 }; pbp(`📣 ${escH(name)} calls your number. Next trip runs through you (+8%).`, 'good hot'); }
        else if (win && topic === 'minutes') { st.minutes = true; st.nextBonus = { label: 'Coach\'s trust', v: 4 }; pbp(`📣 ${escH(name)}: "You're playing the rest of the way." More minutes, more numbers.`, 'good hot'); cnt('trustWins'); }
        else if (win) { st.nextBonus = { label: 'Fired up', v: 5 }; pbp(`📣 ${escH(name)} keeps you in. Don't waste it.`, 'good'); }
        else if (g <= 0 && !PICK) { st.bench = 1; cnt('benched'); s.meta.morale = Math.max(0, s.meta.morale - 4); pbp(`🪑 ${escH(name)} has heard enough. You're on the bench for a stretch.`, 'bad'); }
        else pbp(`${escH(name)} waves you off. "Just play."`);
      } else if (type === 'ref') {
        if (g <= 0) { cnt('technicals'); SFX.play('whistle'); SFX.play('boo'); await banner('<small>REFEREE</small>TECHNICAL FOUL', 'loss', 1100); const ft = roll(Balance.pct('ft', STAR.stats).pct); if (ft) { STAR.box.ftm++; STAR.box.pts++; STAR.box.fta++; addPts('them', 1, playOf(STAR, 'ft', { def: null })); } else STAR.box.fta++; pbp(`T'd up! ${escH(STAR.short)} ${ft ? 'hits' : 'misses'} the technical free throw.`, 'bad'); s.meta.morale = Math.max(0, s.meta.morale - 3); }
        else if (!ended && g >= 60) { st.refFavor = true; pbp(`🦓 ${escH(name)} heard you. The next close call might go your way.`, 'good'); }
        else pbp(`🦓 ${escH(name)} walks away. Call stands.`);
      } else {
        if (g <= 35) { st.rattled = 3; pbp(`😤 ${escH(STAR.short)} is rattled. His shots and weapons are off for a stretch.`, 'good hot'); st.highlights.push(`Got in ${STAR.short}'s head`); court.aura(STAR, '#64748b', 2); }
        else if (backfires >= 2 || g >= 100) { st.shaken = 2; s.meta.morale = Math.max(0, s.meta.morale - 4); pbp(`${escH(STAR.short)} won that exchange. Your confidence takes a hit.`, 'bad'); }
        else pbp(`${escH(STAR.short)} shrugs it off. Back to basketball.`);
      }
    }

    /* =================================================================
       PASSING MOMENTS — pick the teammate (each shows his %), make the pass, he plays it
       ================================================================= */
    const PASS_KIND = {
      kickout: { name: 'Kick-out', text: 'You drive and suck in two defenders. Kick it out!', mod: 0, mg: 'lane' },
      lob: { name: 'Lob to the big', text: 'Their big steps up to stop you — your big man is alone behind him. Throw the lob!', mod: -4, mg: 'lob' },
      alleyoop: { name: 'Alley-oop', text: 'A teammate is cutting baseline with nobody near him. Alley-oop?', mod: -8, mg: 'lob' },
      giveandgo: { name: 'Give-and-go', text: 'Pass and cut — the give-and-go is wide open.', mod: 2, mg: 'lane' },
      hockey: { name: 'Hockey assist', text: 'Swing it — one more pass finds the open man.', mod: -2, mg: 'lane' },
      skip: { name: 'Skip pass', text: 'The defense loads up on the strong side. Skip it across the court!', mod: -6, mg: 'lane' },
      outlet: { name: 'Outlet pass', text: 'Rebound secured. Hit the outlet and run!', mod: 4, mg: 'lane' },
    };
    const OPEN_TXT = { wide: 'WIDE OPEN', open: 'open', normal: 'covered', tight: 'tightly guarded' };
    function rollOpen(kind) { const w = kind === 'skip' || kind === 'hockey' ? { wide: 3, open: 3, normal: 1, tight: .3 } : kind === 'kickout' ? { wide: 2, open: 3, normal: 2, tight: 1 } : { wide: 1, open: 3, normal: 2, tight: 1 }; let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'open'; }
    function mateOpt(m, kind, i) {
      const action = kind === 'lob' ? (Balance.available('dunk', m.stats) ? 'dunk' : 'layup') : kind === 'alleyoop' ? 'dunk' : kind === 'outlet' ? 'layup' : (m.role === 'big' ? 'catchMid' : m.role === 'shooter' || kind === 'skip' || kind === 'hockey' || Math.random() < .5 ? 'catch3' : 'catchMid');
      const open = kind === 'hockey' ? 'wide' : rollOpen(kind), ob = [{ label: OPEN_TXT[open][0].toUpperCase() + OPEN_TXT[open].slice(1), v: PB.open[open] }], def = (opp(m).stats) || DEF;
      let c = Balance.pct(action, m.stats, { def, diff: s.difficulty, bonus: ob }), wid = (m.weapons || []).find(id => Weapons.fits(id, action) || (kind === 'alleyoop' || kind === 'lob') && WEAPONS[id].type === 'dunk');
      if (wid) { const wc = Weapons.pct(wid, m.stats, { def, npc: true, diff: s.difficulty, bonus: ob }); if (wc.pct > c.pct) c = wc; else wid = null; }
      return { k: 'mate', i, m, action, open, wid, label: `${m.short} — ${ACT_LABEL[action]}`, desc: `${OPEN_TXT[open]} · ${m.role}${wid ? ` · ⚔ ${WEAPONS[wid].name}` : ''}`, pct: c.pct, parts: c.parts, cls: open === 'wide' ? 'open' : '' };
    }
    async function passMoment(kind, text) {
      const mates = MATES(); if (!mates.length) return offPossession();
      if (kind === 'lob' || kind === 'alleyoop') { if (!mates.some(m => m.role === 'big' || Balance.available('dunk', m.stats))) kind = 'kickout'; }
      const K = PASS_KIND[kind]; formation('us', kind === 'skip' ? SPOTS.wing : kind === 'outlet' ? [4, 12] : SPOTS.top); court.ball.holder = U;
      if (kind === 'kickout' || kind === 'lob') { await court.drive(U, rnd(-3, 3), 11, .5); }
      const passC = calc('pass', { bonus: bonuses('pass').concat(K.mod ? [{ label: K.name, v: K.mod }] : []) });
      let opts = mates.map((m, i) => mateOpt(m, kind, i));
      if (kind === 'giveandgo') { const lay = calc('layup', { contest: 'open' }); opts = mates.map((m, i) => { const pb = Math.round((Balance.eff(m.stats.pass) - 50) * .3); return { k: 'mate', i, m, label: `Give it to ${m.short}, cut for the return`, desc: `You finish at the rim · ${m.short} passes ${m.stats.pass}`, pct: clamp(lay.pct + 2 + pb, 5, 95), parts: lay.parts.concat([{ label: `${m.short}'s return pass`, v: 2 + pb }]), action: 'layup', give: true }; }); }
      if (kind === 'hockey' && mates.length > 1) opts = mates.map((m, i) => { const to = mates[(i + 1) % mates.length], o = mateOpt(to, 'hockey', mates.indexOf(to)); return Object.assign(o, { label: `${m.short} swings it to ${to.short}`, desc: `${to.short} ${OPEN_TXT[o.open]} · ${ACT_LABEL[o.action]}${o.wid ? ' · ⚔ ' + WEAPONS[o.wid].name : ''}`, via: m }); });
      opts.push({ k: 'keep', label: 'Keep it — attack yourself', desc: 'Pick your own shot', pct: null });
      const ch = await choose(`<b>${escH(text || K.text)}</b> <span class="pct-note">${K.name} · pass ${passC.pct}%</span>`, opts);
      if (ch.k === 'keep') return offPossession();
      tire();
      const recv = ch.via || ch.m, idx = mates.indexOf(recv);
      busy(`<b>${K.name} to ${escH(recv.short)}</b>`, K.mg === 'lob' ? '🎮 Time the lob' : '🎮 Thread the pass');
      let q;
      if (K.mg === 'lob') { const r = await MG.dunkChain($('mg'), { title: kind === 'alleyoop' ? 'ALLEY-OOP' : 'LOB IT', rings: 1, labels: ['LOB'], tol: (PB.lobTol + Balance.eff(ME.pass) / 99 * 8) * WIN() * MGX('passWindow'), speed: 85 }); q = r.quality; }
      else { const r = await MG.passLane($('mg'), { title: K.name.toUpperCase(), window: (480 + (ME.pass * .5 + ME.iq * .5) / 99 * 700) * WIN() * MGX('passWindow'), names: mates.map(x => x.short), target: idx }); q = r.success ? r.quality : 0; }
      idle();
      const done = q > 0 && roll(Balance.apply('pass', passC.pct, q));
      if (!done) { st.box.to++; const thief = opp(recv); thief.box && thief.box.stl++; court.ball.holder = U; await court.pass(U, thief, .35); pbp(`${K.name} picked off by ${escH(thief.short || 'the defense')}. <i class="pct-note">pass ${passC.pct}%</i>`, 'bad'); fail(); return false; }
      const bonus = Math.round(q * PB.quality), lob = K.mg === 'lob' ? 2 : 0;
      if (ch.give) {   // give-and-go: pass, cut, get it back, finish
        await court.pass(U, recv); SFX.play('squeak'); await court.moveTo(U, rnd(-2, 2), 9, .45); await court.pass(recv, U, .3);
        const fin = Math.min(95, ch.pct + bonus), made = await myShot('layup', roll(fin));
        if (made) { recv.box.ast++; cnt('giveAndGo'); pbp(`Give-and-go! ${escH(recv.short)} hits ${myName} on the cut. <i class="pct-note">${fin}%</i>`, 'good'); success(); } else { pbp(`${myName} gets it back on the cut but misses. <i class="pct-note">${fin}%</i>`); fail(); await boardAfterMiss(true); }
        return made;
      }
      if (ch.via) { await court.pass(U, ch.via); await court.pass(ch.via, ch.m, .35); } else await court.pass(U, recv, kind === 'skip' ? .55 : kind === 'outlet' ? .6 : undefined, lob);
      if (kind === 'outlet' && canSeg()) { pbp(`${myName} hits ${escH(recv.short)} with the outlet — he's off!`, 'good'); return arcadeSegment('fastbreak', { handler: 'mate', trigger: 'outlet', sub: 'OUTLET — RUN THE LANE' }); }
      if (ch.wid) await weaponFlash(ch.m, ch.wid, 'us');
      const fin = Math.min(95, ch.pct + bonus), made = roll(fin), three = !!BALANCE.actions[ch.action].three;
      await animShot(ch.m, ch.action, made, { poster: ch.action === 'dunk' && kind === 'alleyoop' });
      shotBox(ch.m, made, three);
      if (made) {
        addPts('us', three ? 3 : 2, playOf(ch.m, KIND_OF[ch.action] || 'layup', { ast: ch.via ? ch.via : U })); court.celebrate(ch.m, three ? 'three' : ch.action === 'dunk' ? 'dunk' : 'two');
        if (ch.via) { ch.via.box.ast++; cnt('hockeyAssists'); pbp(`Hockey assist! ${myName} → ${escH(ch.via.short)} → ${escH(ch.m.short)}, ${three ? 'three' : 'bucket'}. <i class="pct-note">${fin}%</i>`, 'good'); }
        else { st.box.ast++; cnt('assists'); court.pop('+AST', U.x, U.y, 9, '#a78bfa'); pbp(`${K.name}! ${myName} finds ${escH(ch.m.short)} — ${kind === 'alleyoop' ? 'ALLEY-OOP!' : ACT_LABEL[ch.action] + ', good'}. <i class="pct-note">${fin}%${bonus ? ` (+${bonus}% pass)` : ''}</i>`, 'good'); }
        if (kind === 'alleyoop') st.highlights.push(`Alley-oop to ${ch.m.short}`);
        success(kind === 'alleyoop'); return true;
      }
      pbp(`${escH(ch.m.short)} can't finish. <i class="pct-note">${fin}%</i>`); st.att++; await boardAfterMiss(true); return false;
    }

    /* =================================================================
       CLOSE CALLS — slow motion, zoom, crowd build-up, then a quick reaction minigame
       ================================================================= */
    function closeKind(periodEnds, last) {
      const w = Object.assign({}, CL.kinds), diff = st.us - st.them;
      if (!(periodEnds || last)) w.buzzer = 0;
      if (clk.per < L.periods) w.clutchft = 0; else if (!(st.clutch || last)) w.clutchft *= .4;
      if (!(last && diff > 0)) w.stop = 0;
      for (const k in w) w[k] /= 1 + (st.closeKinds[k] || 0) * 2;
      let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'rimroll';
    }
    async function closeCall(kind) {
      st.closeN++; st.closeKinds[kind] = (st.closeKinds[kind] || 0) + 1; cnt('closeCalls');
      court.excite = 1; SFX.play('heartbeat'); let b = 0; const build = setInterval(() => SFX.crowd.level(Math.min(1, .55 + (++b) * .08)), 520);   // the crowd builds (one loop getting louder, not stacked cheers)
      const slow = on => { court.timeScale = on ? .4 : 1; court.tween(court, { zoom: on ? 1.35 : 1 }, .35); };
      const endBuild = good => { clearInterval(build); slow(false); SFX.play(good ? 'roar' : 'groan'); };
      const diffTxt = () => { const d = st.us - st.them; return d === 0 ? `Tied ${st.us}-${st.them}.` : d > 0 ? `Up ${d}.` : `Down ${-d}.`; };
      await banner('<small>CLOSE CALL</small>' + { rimroll: 'ON THE RIM…', collision: 'COLLISION AT THE RIM', charge: 'CHARGE OR BLOCK?', save: 'SAVE IT!', buzzer: 'AT THE HORN…', clutchft: 'CLUTCH FREE THROWS', stop: 'ONE STOP' }[kind], 'clutch', 900);
      try {
        if (kind === 'rimroll') {
          formation('us', SPOTS.elbow); court.ball.holder = U;
          const c = Balance.pct('touch', ME, { bonus: st.clutch ? [{ label: 'Clutch', v: (ME.clutch - 50) * .15 }] : [] });
          busy(`<b>${myName}'s floater kisses the front rim… it's rolling…</b> <span class="pct ${c.pct >= 50 ? 'hi' : 'mid'}">${c.pct}%</span>`, '🎮 Body English');
          const r = await MG.rebound($('mg'), { title: 'BODY ENGLISH', sub: `Touch ${Math.round(Balance.blend(ME, BALANCE.actions.touch.off))} · tap when it's over the rim`, zone: (.08 + Balance.eff(Balance.blend(ME, BALANCE.actions.touch.off)) / 99 * .12) * WIN(), dur: 1.5 }); idle();
          const fin = Balance.apply('touch', c.pct, r.success ? r.quality : .1), made = roll(fin);
          U.anim = { type: 'shoot', t: .3, air: true, released: true }; setTimeout(() => { if (U.anim && U.anim.type === 'shoot') U.anim = null; }, 500);
          st.box.fga++; const ok = await court.rimRoll(made, U);
          if (ok) { st.box.fgm++; st.box.pts += 2; addPts('us', 2, playOf(U, 'layup')); court.celebrate(U, 'two'); pbp(`It rolls… and DROPS! ${myName}'s floater falls. <i class="pct-note">${fin}%</i>`, 'good hot'); st.highlights.push('Rolled one in'); success(); }
          else { pbp(`It rolls around… and out. <i class="pct-note">${fin}%</i>`, 'bad'); fail(); await boardAfterMiss(true); }
          endBuild(ok); return ok;
        }
        if (kind === 'collision') {
          const big = TH.slice().sort((a, z) => (z.stats.intD || 0) - (a.stats.intD || 0))[0] || STAR;
          formation('us', SPOTS.top); court.ball.holder = U;
          if (Balance.available('dunk', ME)) {
            const c = calc('dunk', { def: big.stats });
            busy(`<b>${myName} rises — ${escH(big.short)} meets him at the rim!</b> <span class="pct">${c.pct}%</span>`, '🎮 Block or dunk?');
            const r = await MG.dunkChain($('mg'), { title: 'BLOCK OR DUNK?', tol: (6 + ME.dunk / 99 * 9 + ME.vert / 99 * 4) * WIN() * MGX('dunkTol'), speed: 100 }); idle();
            const fin = Balance.apply('dunk', c.pct, r.quality, 1, { contest: 'heavy' }), made = roll(fin); slow(true);
            if (made) { await myShot('dunk', true, { poster: true }); pbp(`${myName} DUNKS ON ${escH(big.short.toUpperCase())}! <i class="pct-note">${fin}%</i>`, 'good hot'); st.highlights.push(`Posterized ${big.short}`); success(true); }
            else { st.box.fga++; await court.drive(U, 1, 8, .3); await court.block(big, U, true); big.box.blk++; pbp(`${escH(big.short)} STUFFS ${myName} at the rim! <i class="pct-note">${fin}%</i>`, 'bad'); fail(); }
            endBuild(made); return made;
          }
          const att = big; formation('them'); court.ball.holder = att;
          const c = calc('block', { def: att.stats });
          busy(`<b>${escH(att.short)} takes off — you're the last line!</b> <span class="pct">${c.pct}%</span>`, '🎮 Meet him at the rim');
          const r = await MG.rebound($('mg'), { title: 'MEET HIM AT THE RIM', zone: (.07 + (ME.intD * .6 + ME.vert * .4) / 99 * .14) * WIN() * (1 + APE * .02), dur: 1.1 }); idle();
          const ok = r.success && roll(Balance.apply('block', c.pct, r.quality)); slow(true);
          if (ok) { await court.drive(att, 1, 8, .3); await court.block(U, att, true); st.box.blk++; cnt('blocks'); pbp(`${myName} meets ${escH(att.short)} at the summit — BLOCKED!`, 'good hot'); st.highlights.push(`Blocked ${att.short} at the rim`); success(true); }
          else { const mm = await theyShoot('dunk', 'heavy', att, { made: true, poster: true }); void mm; pbp(`${escH(att.short)} dunks on ${myName}. Ouch.`, 'bad'); fail(); }
          endBuild(ok); return ok;
        }
        if (kind === 'charge') {
          const att = pick(TH); formation('them'); court.ball.holder = att; att.x = 2; att.y = 24; U.x = 1; U.y = 12; U.pose = 'def';
          const c = calc('charge', { def: att.stats });
          busy(`<b>${escH(att.short)} barrels down the lane — set your feet!</b> <span class="pct">${c.pct}%</span>`, '🎮 Set your feet in time');
          const r = await MG.rebound($('mg'), { title: 'SET YOUR FEET', sub: `IQ ${ME.iq} · Strength ${ME.str}`, zone: (.07 + Balance.eff(ME.iq) / 99 * .12) * WIN() * MGX('defWindow'), dur: .95 }); idle();
          const ok = r.success && roll(Balance.apply('charge', c.pct, r.quality)); slow(true);
          await court.collide(att, U, ok); U.pose = '';
          if (ok) { await banner('<small>THE CALL…</small>OFFENSIVE FOUL!', 'win', 1100); cnt('charges'); cnt('stops'); pbp(`${myName} takes the charge on ${escH(att.short)}! Our ball.`, 'good hot'); st.highlights.push(`Took a charge on ${att.short}`); success(true); }
          else { await banner('<small>THE CALL…</small>BLOCKING FOUL', 'loss', 1100); SFX.play('boo', .7); queueTalk('ref', .8); court.ball.holder = att; await court.shoot(att, 'swish', { arc: 3 }); shotBox(att, true, false); addPts('them', 2, playOf(att, 'layup', { def: U })); const ft = roll(Balance.pct('ft', att.stats).pct); att.box.fta++; if (ft) { att.box.ftm++; att.box.pts++; addPts('them', 1, playOf(att, 'ft', { def: null })); } pbp(`Blocking foul on ${myName} — ${escH(att.short)} scores${ft ? ' and hits the free throw' : ''}.`, 'bad'); fail(); }
          endBuild(ok); return ok;
        }
        if (kind === 'save') {
          formation('them'); court.ball.holder = null; const side = Math.random() < .5 ? -1 : 1; Object.assign(court.ball, { x: side * 14, y: 22, z: 3 });
          const c = Balance.pct('save', ME), to = MATES().length ? pick(MATES()) : null;
          busy(`<b>A tipped pass is heading out of bounds — dive for it!</b> <span class="pct">${c.pct}%</span>`, '🎮 Dive!');
          const r = await MG.rebound($('mg'), { title: 'DIVE!', sub: `Speed ${ME.speed} · IQ ${ME.iq}`, zone: (.08 + Balance.eff(ME.speed) / 99 * .12) * WIN(), dur: .9 }); idle();
          const ok = r.success && roll(Balance.apply('save', c.pct, r.quality));
          U.x = side * 14; U.y = 20; const saved = await court.dive(U, side, ok, to || STAR);
          if (saved && to) { cnt('saves'); pbp(`${myName} dives and saves it to ${escH(to.short)}!`, 'good hot'); st.highlights.push('Saved a ball from going out'); const a = roleAction(to), p = Balance.pct(a, to.stats, { def: opp(to).stats, contest: 'open' }).pct, made = roll(p), three = !!BALANCE.actions[a].three; await animShot(to, a, made); shotBox(to, made, three); if (made) { st.box.ast++; cnt('assists'); addPts('us', three ? 3 : 2, playOf(to, KIND_OF[a] || 'layup', { ast: U })); pbp(`…and ${escH(to.short)} cashes in! <i class="pct-note">${p}%</i>`, 'good'); } success(true); endBuild(true); return true; }
          pbp(`${myName} dives — but it's out. Their ball.`, 'bad'); fail(); endBuild(false); return false;
        }
        if (kind === 'buzzer') {
          formation('us', SPOTS.top); court.ball.holder = U; U.y = 33; clk.rem = Math.min(clk.rem, 2.4); updBug();
          const c = calc('pull3', { contest: 'contested', shotClock: true, deep: true });
          busy(`<b>3… 2… 1… ${myName} lets it fly from deep!</b> <span class="pct">${c.pct}%</span>`, '🎮 Beat the horn');
          const r = await MG.shotMeter($('mg'), { title: 'BEAT THE HORN', green: green(ME.three, BALANCE.distance.deepFt) * MGX('green'), dur: .75, sub: 'Release before the red light' }); idle();
          const q = meterQ(r), late = q < CL.tooLate, fin = Balance.apply('pull3', c.pct, q, BALANCE.distance.deepFt, { perfect: r.perfect, contest: 'contested' }), inBasket = roll(fin);
          st.box.fga++; st.box.tpa++; SFX.play('buzzer'); court.flashA = .3; court.flashCol = '239,68,68';
          await court.shoot(U, inBasket ? 'swish' : 'miss', { slowmo: true, arc: 12 });
          await banner('<small>INSTANT REPLAY</small>⏪ REVIEW', 'clutch', 900);
          formation('us', SPOTS.top); court.ball.holder = U; U.y = 33; court.timeScale = .3; court.tween(court, { zoom: 1.5 }, .5);
          await court.shoot(U, inBasket ? 'swish' : 'miss', { arc: 12 }); court.timeScale = 1; court.tween(court, { zoom: 1 }, .5);
          const counts = inBasket && !late;
          if (counts) { st.box.fgm++; st.box.tpm++; st.box.pts += 3; cnt('threes'); addPts('us', 3, Object.assign(playOf(U, 'three'), { buzzer: true, clock: 0 })); await court.mini('buzzer', 'AT THE BUZZER!', { force: true }); await banner('<small>THE CALL STANDS</small>GOOD! IT COUNTS!', 'win', 1300); court.celebrate(U, 'three'); court.confetti(60); pbp(`${myName} BEATS THE HORN from deep! <i class="pct-note">${fin}%</i>`, 'good hot'); st.highlights.push('Beat the buzzer from deep'); success(true); }
          else if (inBasket) { await banner('<small>AFTER REVIEW</small>TOO LATE — NO GOOD', 'loss', 1400); pbp(`It goes in — but the replay shows it was a hair too late. Waved off!`, 'bad'); fail(); }
          else { pbp(`${myName}'s heave at the horn is no good. <i class="pct-note">${fin}%</i>`); fail(); }
          endBuild(counts); return counts;
        }
        if (kind === 'clutchft') {
          const secs = Math.max(2, Math.ceil(Math.min(clk.rem, rnd(3, 40))));
          pbp(`${myName} is fouled with ${secs} seconds left. ${diffTxt()} The whole gym is on its feet.`, 'hot');
          const was = st.clutch; st.clutch = true; const m = await T.free_throws({ shots: 2 }); st.clutch = was; endBuild(m === 2); return m === 2;
        }
        if (kind === 'stop') { st.lastStop = null; const ok = await defPossession({ text: `${diffTxt()} One stop seals it. ${STAR.short} has the ball.` }); if (ok) { st.highlights.push('Got the game-sealing stop'); st.sealPlay = st.lastStop || Object.assign(playOf(U, 'stop', { def: STAR }), { side: 'us', clock: Math.round(clk.rem * 10) / 10 }); } endBuild(ok); return ok; }
      } finally { clearInterval(build); court.timeScale = 1; }
      endBuild(false); return false;
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
        const shooter = off ? pick(MATES()) : STAR; court.ball.holder = shooter; shotBox(shooter, false, false);
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
        if (st.done) return 0;
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
          onShot: ok => { st.box.fta++; if (ok) { made++; st.box.ftm++; st.box.pts++; cnt('ftMade'); addPts('us', 1, playOf(U, 'ft', { def: null })); SFX.play('crowd', .6); } else { st.talkEv = 'missed_ft'; } if (!ok) SFX.play('groan'); },
        });
        idle();
        pbp(say(r.made === shots ? 'ft_all' : r.made ? 'ft_split' : 'ft_none', { n: r.made, of: shots }) + ` <i class="pct-note">${c.pct}% base</i>`, r.made === shots ? 'good' : '');
        if (pressure && r.made) cnt('clutchMakes');
        r.made === shots ? success() : r.made ? (st.att++, st.succ += .5) : fail();
        return r.made;
      },
    };

    /* ---------- WEAPON (rolled signature move) ---------- */
    /* your weapons that fit this moment ('off' or 'def'), each with its own % (stats-only formula, BALANCE.weapons) */
    function weaponOpts(side) {
      const offT = ['three', 'mid', 'drive', 'dunk', 'post', 'pass', 'zone'], defT = ['stop', 'steal', 'block'];
      return Engine.weapons(s).filter(x => (side === 'off' ? offT : defT).includes(x.w.type)).map(x => {
        const c = Engine.weaponPct(s, x.id, side === 'off' ? DEF : THEM, st.zone ? [{ label: 'The Zone', v: 5 }] : []);
        return { k: 'sig', wid: x.id, label: '⚔ ' + x.w.name, desc: `Weapon · rank ${x.rank} — ${x.w.desc}`, pct: c.pct, parts: c.parts, mg: 'Weapon minigame', cls: 'sig' };
      });
    }
    async function weaponMinigame(setup, sg) {
      const t = sg.type, title = '⚔ ' + sg.name.toUpperCase();
      busy(setup, `🎮 ${sg.name}`);
      let r;
      if (t === 'three' || t === 'mid' || t === 'zone') { r = await MG.shotMeter($('mg'), { title, green: Math.min(.4, green(t === 'three' ? ME.three : ME.mid, FT(t === 'three' ? 'catch3' : 'catchMid')) * 1.5 * MGX('green')), dur: .95, sub: sg.desc }); return meterQ(r); }
      if (t === 'drive') { r = await MG.dribbleCombo($('mg'), { title, len: 5, time: (.8 + ME.handle / 99 * .6) * WIN() * 1.2 }); return r.quality; }
      if (t === 'dunk') { r = await MG.dunkChain($('mg'), { title, tol: (8 + ME.dunk / 99 * 10) * WIN() * 1.2, speed: 95 }); return r.quality; }
      if (t === 'pass') { r = await MG.passLane($('mg'), { title, window: (600 + ME.pass / 99 * 700) * WIN() * 1.3 }); return r.success ? r.quality : 0; }
      if (t === 'post') { r = await MG.strengthPush($('mg'), { title, mine: ME.str + 10, theirs: DEF.str }); return r.quality; }
      r = await MG.defenseReact($('mg'), { title, window: (450 + ME.perD / 99 * 450) * WIN() * 1.3 }); return r.success ? Math.max(.5, r.quality) : .1;
    }
    async function weapon(setup, wid) {
      wid = wid || Engine.weapons(s)[0].id;
      const sg = WEAPONS[wid], p = Engine.weaponPct(s, wid, DEF, st.zone ? [{ label: 'The Zone', v: 5 }] : []).pct;
      st.sigUses++; st.sig = 0; st.sigUsed = st.sigUses >= (Engine.hasSpecial(s, 'formless') ? 2 : 1);
      court.aura(U, '#facc15', 3); court.impact(.3, 6, .5, .07, '250,204,21'); SFX.play('sig'); court.timeScale = .5; cnt('weaponUses');
      await banner(`<small>⚔ WEAPON · ${RARITY[sg.rarity].name.toUpperCase()}</small>${escH(sg.name)}`, 'sig', 1400);
      court.timeScale = 1;
      const q = await weaponMinigame(setup, sg); idle();
      const ok = roll(Math.max(5, Math.min(WB.max, Math.round(p + (q - .5) * WB.skill))));
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
        if (ok) { st.box.ast++; cnt('assists'); addPts('us', 2, playOf(mate, 'dunk', { ast: U })); court.pop(sg.name.toUpperCase() + '!', U.x, U.y, 9, '#a78bfa', 34); }
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
    const canSeg = () => typeof Arcade !== 'undefined' && st.seg < SGC.max && !st.inSeg && !st.done;
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
      let r = null; try { r = await Arcade.segment({ kind, setup, offense, clock, clockLabel, untilClock, title: kind === 'fastbreak' && no > nd ? `FAST BREAK! ${no} ON ${nd}` : K.title,
        us: cfg.us, them: cfg.them, star, oppRating: oppR - (tutOn() ? 8 : 0), forceHelp: !!o.forceHelp, mateRating: cfg.mateRating || 45, numbers: [no, nd], backD, handler: hd,
        score: [st.us, st.them], venue: court.venueId, bonus: a => bonuses(a), stats: Object.assign({}, ME), stamina: 100 - st.fatigue, weapons: Engine.weapons(s).map(x => ({ id: x.id, rank: x.rank })), level: s.player.level }); } catch (e) { console.error('arcade segment', e); }
      document.querySelectorAll('.arc').forEach(el => el.remove()); document.body.classList.remove('arc-open');   // nothing left on top of the match
      if (!r || typeof r !== 'object') r = { ptsUs: 0, ptsThem: 0, end: 'set', me: {}, all: [], log: [], weapons: [] };
      st.inSeg = false; beat();
      // box score, counters, fatigue
      const b = r.me || {};
      (r.all || []).forEach(x => { if (x.isUser) return; const p = (x.team === 0 ? US : TH).find(q => q.name === x.name); if (!p || !p.box) return; ['pts', 'reb', 'ast', 'stl', 'blk', 'fgm', 'fga', 'tpm', 'tpa', 'to'].forEach(k => p.box[k] += x.box[k] || 0); });
      (r.weapons || []).forEach(w => pbp(`🕹 ⚔ <b>${escH(shortOf(w.name))}</b> used <b>${escH(w.weapon)}</b>.`, w.team === 0 ? 'hot' : 'bad'));
      ['fga', 'fgm', 'tpa', 'tpm', 'reb', 'ast', 'stl', 'blk', 'to', 'pts'].forEach(k => st.box[k] += b[k] || 0);
      if (b.dunks) cnt('dunks', b.dunks); if (b.tpm) cnt('threes', b.tpm); if (b.ast) cnt('assists', b.ast); if (b.stl) cnt('steals', b.stl); if (b.blk) cnt('blocks', b.blk); if (b.reb) cnt('rebounds', b.reb); if (r.ankles) cnt('crosses', r.ankles);
      if (b.fgm && b.dunks < b.fgm && !b.tpm) cnt('layups', b.fgm - (b.dunks || 0));
      st.fatigue = Math.min(100, st.fatigue + 2 + (r.stamina || 0) * .12);
      formation(r.ptsUs ? 'them' : 'us'); court.ball.holder = r.ptsUs ? STAR : U;
      st.finalSeg = kind === 'final';
      if (r.ptsUs) addPts('us', r.ptsUs, fromArc(r.play)); if (r.ptsThem) addPts('them', r.ptsThem, fromArc(r.play));
      if (r.end === 'stop' && offense === 1) st.lastStop = Object.assign(fromArc(r.stop) || { kind: 'stop', by: who(U), def: who(STAR), px: 192, py: 110 }, { side: 'us', kind: (r.stop && r.stop.kind) || 'stop', clock: Math.round((r.clock || 0) * 10) / 10 });
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
      arcadeExtras(r);
      if (r.foul) {
        if (r.foul.team === 1) { const fp = Balance.pct('ft', THEM).pct; let m = 0; for (let i = 0; i < r.foul.shots; i++) if (roll(fp)) m++; if (m) addPts('them', m, Object.assign(fromArc(r.play) || {}, { kind: 'ft', by: who(STAR), def: null })); pbp(`${cfg.them.name} go ${m}/${r.foul.shots} at the line.`, m ? 'bad' : 'good'); }
        else if (r.fouled === 'me' || r.scorer === 'me' || !MATES().length) { SFX.play('whistle'); await T.free_throws({ shots: r.foul.shots }); }
        else { const fp = Balance.pct('ft', MATE).pct; let m = 0; for (let i = 0; i < r.foul.shots; i++) if (roll(fp)) m++; if (m) addPts('us', m, Object.assign(fromArc(r.play) || {}, { kind: 'ft', by: who(MATES()[0]), def: null })); pbp(`Your teammate goes ${m}/${r.foul.shots} at the line.`); }
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
      const hasM = MATES().length > 0, hasO = TH.length > 1;
      const w = { off_poss: 5, def_poss: 4, quick_off: 1.5, quick_def: 1.5, rebound: big ? 2 : 1, pass_play: hasM ? 2.2 : 0, mate_play: hasM ? OB.mate : 0, opp_play: hasO && hasM ? OB.opp : 0 };
      if (st.lastType === 'pass_play') w.pass_play *= .3; if (st.lastType === 'mate_play') w.mate_play *= .3;
      const ar = s.player.arch;
      if (['thief', 'copycat', 'emperor', 'titan'].includes(ar)) w.def_poss += 1;
      if (['titan', 'bruiser'].includes(ar)) w.rebound += 1;
      if (st.lastType === 'rebound') w.rebound = 0;
      if (st.lastType === 'quick_off' || st.lastType === 'quick_def') { w.quick_off = 0; w.quick_def = 0; }
      const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = Math.random() * tot;
      for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'off_poss';
    }
    const passKind = () => { const w = PB.kinds; let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'kickout'; };
    const RUN = { off_poss: () => offPossession(), def_poss: () => defPossession(), quick_off: quickOff, quick_def: quickDef, rebound: () => T.rebound(), pass_play: () => passMoment(passKind()), mate_play: matePlay, opp_play: oppPlay, guard_star: guardStar };
    /* simulate scoring between moments */
    function simSegment(frac) {
      const oR = oppR + diffShift * .5;
      if (PICK) {   // pickups: off-screen buckets only keep the pace — they never reach the target, the deciding basket is always played
        const edge = clamp((usR - oR) * .012, -.22, .22), goal = cfg.target * .8 * (st.i + 1) / n;
        st.simCap = st.simCap || { us: cfg.target - 2 - Math.floor(rnd(0, 4)), them: cfg.target - 2 - Math.floor(rnd(0, 4)) };   // how far off-screen buckets can carry each team (varies per game)
        ['us', 'them'].forEach(side => { const want = goal * (1 + (side === 'us' ? edge : -edge)); if (st[side] < want) st[side] = Math.max(st[side], Math.min(st.simCap[side], st[side] + Math.max(0, Math.round((want - st[side]) * rnd(.45, .9))))); });
        return;
      }
      const myShare = L.pts * frac * (1 + (usR - oR) * .013) - .9 * frac * n;
      const thShare = L.pts * frac * (1 - (usR - oR) * .013) - .7 * frac * n;
      st.us += Math.max(0, Math.round(myShare * rnd(.65, 1.35))); st.them += Math.max(0, Math.round(thShare * rnd(.65, 1.35)));
    }
    /* Perfect Copy: defensive stops stack an offense bonus */
    async function withMirror(fn) { const ok = await fn(); if (ok && Engine.hasSpecial(s, 'mirror') && st.mirror < 12) { st.mirror += 3; pbp(`🪞 <b>Perfect Copy</b>: you copied their move. Offense +${st.mirror}%`, 'hot'); } return ok; }

    /* ---------- PRE-GAME — big games get a cinematic (travel / arrival / tunnel / face-off) and one short talk ---------- */
    const pgTier = Math.max(FULL ? 2 : 0, Math.min(4, (cfg.importance || 1) + (oppR >= usR + 3 ? 1 : 0) + (rivalId === 'kai' ? 1 : 0) + (cfg.venue === 'away' && (cfg.importance || 1) >= 2 ? 1 : 0)));
    if (pgTier >= 2 && typeof Cutscene !== 'undefined' && Cutscene.pregame && !cfg.noIntro) {
      const VD = court.V.def, kind = PICK || cfg.level === 'street' ? 'pickup' : cfg.venue === 'away' ? 'away' : 'home', vName = (VENUES[court.venueId] || {}).name || '';
      const top = STAR.stats ? Object.entries(STAR.stats).filter(([, v]) => typeof v === 'number').sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k.slice(0, 3).toUpperCase(), Math.round(v)]) : [];
      const ctx = { team: cfg.us, them: cfg.them, usAbbr: cfg.us.abbr, themAbbr: cfg.them.abbr, themName: cfg.them.name, venue: court.venueId, city: cfg.them.city, night: VD.sky === 'night' || VD.style === 'arena' || VD.style === 'gym',
        homeCols: kind === 'away' ? cfg.them.colors : cfg.us.colors, homeScene: VD.style === 'arena' ? 'arena' : 'gym',
        looks: { star: Object.assign({}, STAR.look, { jersey: cfg.them.colors[0], trim: cfg.them.colors[1], outfit: 'jersey' }), coach: coachId ? talkLook(coachId) : null, mate: TMATE() ? MATE_LOOK() : null }, names: { star: STAR.full, coach: coachId ? talkName(coachId) : 'Coach', mate: TMATE() ? TMATE().full || TMATE().name : 'Teammate' } };
      try { cnt('pregames'); await Cutscene.pregame({ kind, tier: pgTier, flight: kind === 'away' && /college|pro|euro/.test(cfg.level || ''), city: cfg.them.city, place: vName, starName: STAR.full, starSub: cfg.starSub || `${cfg.them.name}'s best player`, starStats: top }, ctx);
      SFX.music('game'); Pixel.ambient(court.V, court.excite);
      if (TK && !cfg.practice && ((cfg.importance || 1) >= 2 || rivalId === 'kai')) { const who = kind === 'pickup' ? (Math.random() < .6 ? 'rival' : 'mate') : kind === 'away' ? (rivalId === 'kai' || oppR >= usR + 3 ? 'rival' : 'coach') : (Math.random() < .5 || !coachId ? 'mate' : 'coach');
        await talk(who === 'coach' && !coachId ? 'mate' : who === 'mate' && !TMATE() ? 'rival' : who, null, true); }
      } catch (e) { console.error('[match] pre-game', e); st.inputOffs.forEach(f => f()); st.inputOffs.clear(); st.waitInput = 0; idle(); if (SFX.crowd && SFX.crowd.reset) SFX.crowd.reset(); }
    }
    offerFs();

    /* ---------- SAFETY NET — every moment runs inside guardMoment():
       • an error inside a moment is caught (logged) and the game moves on to the next moment;
       • a WATCHDOG notices when nothing has happened for WD_MS (no play-by-play, panel, banner, court animation
         finishing…) while the game isn't waiting on the player, a minigame, an arcade segment or a cutscene — and moves on;
       • recover() clears whatever was left behind: minigame cards + their listeners, choice listeners, stray overlays,
         frozen court state, a ducked crowd. Only one moment ever runs at a time. */
    const WD_MS = 20000;
    court.onBeat = beat;
    function guardMoment(fn, label) {
      return new Promise(res => {
        let done = false; beat();
        const end = (v, why) => { if (done) return; done = true; clearInterval(iv); if (why) { console.warn(`[match] ${label}: ${why}`); cnt('recovered'); recover(); } res(v); };
        const iv = setInterval(() => {
          const waiting = document.hidden || st.waitInput > 0 || st.inSeg || mgActive || (typeof Cutscene !== 'undefined' && Cutscene.playing) || court.rp;
          if (waiting) return beat();
          if (performance.now() - st.beatAt > WD_MS) end(undefined, 'no progress — moving on');
        }, 1000);
        Promise.resolve().then(fn).then(v => end(v), e => { console.error(`[match] ${label}`, e); end(undefined, 'error: ' + (e && e.message)); });
      });
    }
    function recover() {
      try {
        st.inputOffs.forEach(f => f()); st.inputOffs.clear(); st.waitInput = 0;
        if (mgActive) mgActive.kill('moment reset');
        const L = $('mg'); if (L) { L.querySelectorAll('.mg').forEach(e => e.remove()); L.classList.remove('on', 'ftmode'); }
        if (!st.inSeg) { document.querySelectorAll('.arc').forEach(e => e.remove()); document.body.classList.remove('arc-open'); }
        court.tweens.length = 0; court.stopT = 0; court.timeScale = 1; court.zoom = 1; court.kick = 0;   // the stuck moment's animations are dropped (never resumed)
        court.players.forEach(p => { p.anim = null; p.pose = ''; p.moving = false; p.z = 0; }); court.ball.holder = U; court.ball.show = true; court.ball.z = 3;
        document.querySelectorAll('.tkc').forEach(e => e.remove());
        $('banner').className = 'court-banner'; if (SFX.crowd && SFX.crowd.reset) SFX.crowd.reset();
        formation('us'); idle(); updBug(); pbp('Play resets.', 'sys');
      } catch (e) { console.error('recover', e); }
    }

    /* ---------- FULL ARCADE GAME (pickups + the Kai 1-on-1): tip-off to the final basket, live ---------- */
    function arcadeExtras(r) {   // jellies + duo moves played live in arcade
      if (r.jellies) { cnt('jellies', r.jellies); st.highlights.push(r.jellies > 1 ? `${r.jellies} jellies in the open floor` : 'Jelly in the open floor'); if (JM && JM.payoff && !st.jmDone) { st.jmDone = true; cnt('jellyPayoff'); } }
      if (r.jellyTries) cnt('jellyTries', r.jellyTries); if (r.jellyBlocks) cnt('jellyBlocks', r.jellyBlocks); if (r.duos) cnt('duoMoves', r.duos);
    }
    /* ---------- SUMMER JAM (cfg.jam): the live game stops at some dead balls for a choice moment ----------
       street calls (they set up your next possession), matchups (who you guard), key possessions (a decision + minigame),
       and the clutch possession near the target. About 3–5 per game (BALANCE.jam). */
    function jamBreak(b) {
      const J = st.jam || (st.jam = { n: 0, at: rnd(BALANCE.jam.first[0], BALANCE.jam.first[1]), matched: false, clutch: 0 }), JB = BALANCE.jam;
      const [u, t] = b.score, tgt = cfg.target || 21, mine = b.next === 0, close = Math.abs(u - t) <= JB.closeBy, late = Math.max(u, t) >= tgt - JB.lateBy;
      let kind = null;
      if (late && close && J.clutch < 1) kind = 'clutch';
      else if (J.n < JB.max && u + t >= J.at) kind = !J.matched && !mine ? 'matchup' : mine && s.flags.street_calls !== false && Math.random() < .55 ? 'call' : 'key';
      if (!kind) return null;
      J.n++; J.at = u + t + rnd(JB.every[0], JB.every[1]); if (kind === 'clutch') J.clutch++; if (kind === 'matchup') J.matched = true;
      cnt('jamMoments'); return runJamBreak(kind, b);
    }
    async function runJamBreak(kind, b) {
      try {
        st.us = b.score[0]; st.them = b.score[1]; updBug(); formation(b.next === 0 ? 'us' : 'them'); court.ball.holder = b.next === 0 ? U : STAR;
        const title = { call: 'TIMEOUT · STREET CALL', matchup: 'DEAD BALL · MATCHUPS', key: 'KEY POSSESSION', clutch: 'CLUTCH' }[kind];
        await banner(`<small>${b.score[0]} – ${b.score[1]}</small>${title}`, kind === 'clutch' ? 'clutch' : 'fb', 850);
        if (kind === 'call') {
          const mates = MATES(), hot = mates.slice().sort((a, c) => (c.box.pts || 0) - (a.box.pts || 0))[0], m0 = mates[0];
          const opts = [{ k: 'give', label: 'Give-and-go', desc: `Hit ${m0 ? m0.short : 'your man'}, cut hard, get it back at the rim`, pct: null, mg: 'Live: cut to the rim' },
            { k: 'iso', label: 'Iso for me', desc: 'Clear a side. You against your man, no help comes', pct: null, mg: 'Live: +5% on your next shot' },
            { k: 'hot', label: 'Feed the hot hand', desc: hot ? `${hot.short} has ${hot.box.pts || 0}. Ride him` : 'Ride whoever is cooking', pct: null, mg: 'Live: he gets the ball, +7%' },
            { k: 'clear', label: 'Clear out', desc: 'Everybody to the corners. Space to drive', pct: null, mg: 'Live: no help defense' }];
          const ch = await choose('<b>Timeout. Make the call.</b> <span class="pct-note">It sets up your next possession.</span>', opts); idle();
          pbp(`📣 Street call: <b>${escH(ch.label)}</b>.`, 'sys'); return { call: ch.k, next: 0, banner: ch.label.toUpperCase() + '!' };
        }
        if (kind === 'matchup') {
          const vis = TH.filter(p => !p.hidden), by = k => vis.slice().sort((a, c) => (c.stats[k] || 0) - (a.stats[k] || 0))[0];
          const scorer = STAR, big = by('intD') === STAR ? vis.find(p => p !== STAR) || STAR : by('intD'), shooter = vis.filter(p => p !== big).sort((a, c) => (c.stats.three || 0) - (a.stats.three || 0))[0] || STAR;
          const opts = [{ k: 'scorer', p: scorer, label: `Guard ${scorer.short} (their scorer)`, desc: 'Take away their star. Everybody else gets more shots', pct: calc('stop', {}).pct },
            { k: 'big', p: big, label: `Guard ${big.short} (the big man)`, desc: 'Keep him off the glass and out of the paint', pct: Balance.pct('stop', ME, { def: big.stats }).pct },
            { k: 'shooter', p: shooter, label: `Guard ${shooter.short} (the shooter)`, desc: 'Run him off the line. No open threes', pct: Balance.pct('stop', ME, { def: shooter.stats }).pct }];
          const ch = await choose('<b>Dead ball. Who are you taking?</b>', opts); idle();
          pbp(`🛡 You're on <b>${escH(ch.p.short)}</b> now.`, 'sys'); return { guard: ch.p.full || ch.p.name, next: 1, banner: `ON ${ch.p.short.toUpperCase()}` };
        }
        // a key possession (or the clutch one): the usual decision moment + minigame, then the other team's ball
        const u0 = st.us, t0 = st.them, mine = b.next === 0, d = st.us - st.them;
        if (kind === 'clutch') { st.clutch = true; SFX.play('heartbeat'); SFX.music('clutch'); if (mine) await innerVoice('jam'); }
        const txt = kind === 'clutch' ? `${d === 0 ? 'Tied' : d > 0 ? `Up ${d}` : `Down ${-d}`} near ${cfg.target}. ${mine ? 'Your ball. Make it count.' : `${STAR.short} wants it. Get a stop.`}` : null;
        if (mine) await offPossession(txt ? { text: txt } : null); else await withMirror(() => defPossession(txt ? { text: txt } : null));
        st.clutch = false; idle(); SFX.music('game');
        return { pts: [Math.max(0, st.us - u0), Math.max(0, st.them - t0)], next: mine ? 1 : 0 };
      } catch (e) { console.error('[match] jam break', e); idle(); return {}; }
    }
    async function fullArcadeGame() {
      st.inSeg = true; cnt('arcadeGames');
      const toPl = p => p.isUser ? Object.assign(Arcade.userPlayer(), { stamina: 100 - st.fatigue })
        : { name: p.full || p.name, stats: p.stats, look: p.look, num: p.num, weapons: (p.weapons || []).filter(id => WEAPONS[id]).map(id => ({ id, rank: 1 })), star: p === STAR };
      let r = null;
      try { r = await Arcade.play({ teams: [{ name: cfg.us.name, abbr: cfg.us.abbr, colors: cfg.us.colors, players: US.map(toPl) }, { name: cfg.them.name, abbr: cfg.them.abbr, colors: cfg.them.colors, players: TH.map(toPl), style: cfg.them.style }],
        target: cfg.target || 21, venue: court.venueId, title: cfg.title || 'PICKUP', sub: cfg.sub || '', difficulty: s.difficulty, mods: cfg.mods, onBreak: cfg.jam ? jamBreak : null }); } catch (e) { console.error('arcade game', e); }
      document.querySelectorAll('.arc').forEach(el => el.remove()); document.body.classList.remove('arc-open'); st.inSeg = false;
      if (!r || !r.score) { const w = Math.random() < .5; r = { score: w ? [cfg.target || 21, (cfg.target || 21) - 4] : [(cfg.target || 21) - 4, cfg.target || 21], box: {}, all: [] }; }   // the game couldn't run: neutral result
      st.us = r.score[0]; st.them = r.score[1]; st.done = r.forfeit ? 'them' : st.us > st.them ? 'us' : 'them';
      if (r.play && !r.forfeit) { const P = Object.assign(fromArc(r.play), { side: r.play.team === 0 ? 'us' : 'them', us: st.us, them: st.them }); if (P.side === 'us' && st.done === 'us') st.gwPlay = P; if (P.side === 'them' && st.done === 'them') st.lwPlay = P; }
      const b = r.box || {}; ['pts', 'reb', 'ast', 'stl', 'blk', 'fgm', 'fga', 'tpm', 'tpa', 'to', 'ftm', 'fta'].forEach(k => st.box[k] = (st.box[k] || 0) + (b[k] || 0));
      (r.all || []).forEach(x => { if (x.isUser) return; const p = (x.team === 0 ? US : TH).find(q => (q.full || q.name) === x.name); if (p && p.box) ['pts', 'reb', 'ast', 'stl', 'blk', 'fgm', 'fga', 'tpm', 'tpa', 'to'].forEach(k => p.box[k] += (x.box && x.box[k]) || 0); });
      st.att += (b.fga || 0) + (b.stl || 0) + (b.blk || 0); st.succ += (b.fgm || 0) + (b.stl || 0) + (b.blk || 0);
      if (b.tpm) cnt('threes', b.tpm); if (b.stl) cnt('steals', b.stl); if (b.blk) cnt('blocks', b.blk); if (b.reb) cnt('rebounds', b.reb); if (b.ast) cnt('assists', b.ast); if (r.ankles) cnt('crosses', r.ankles);
      arcadeExtras(r);
      pbp(`🕹 <b>${st.us}–${st.them}.</b> ${st.done === 'us' ? 'You take the run.' : r.forfeit ? 'You walked off the court.' : 'They hold the court.'}`, st.done === 'us' ? 'good hot' : 'bad');
      if (r.fire) st.highlights.push('Caught fire'); if (r.shatter) st.highlights.push('Shattered the backboard');
      updBug();
    }
    if (FULL) await guardMoment(fullArcadeGame, 'arcade game');

    /* ---------- GAME LOOP ---------- */
    updBug(); formation('us');
    if (!FULL) await banner(`<div class="tip">${logoUs}<span>VS</span>${logoThem}</div><small>${escH(cfg.us.name)} vs ${escH(cfg.them.name)}</small>TIP-OFF`, 'tip', 1800);
    if (!FULL) { SFX.play('whistle'); pbp(`<b>Tip-off!</b> ${escH(cfg.us.name)} vs ${escH(cfg.them.name)}.`, 'sys'); }
    let prevPer = 1;
    for (let i = 0; i < n && !st.done && !FULL; i++) {
      st.i = i; $('momCount').textContent = `Moment ${i + 1}/${n}`;
      st.oppSig += .5;   // their star's weapon charges as the game goes (and faster with every bucket)
      const last = i === n - 1;
      simSegment(1 / (n + 1));
      if (!PICK && last && Math.abs(st.us - st.them) <= 10 && Math.random() < .7) { const target = Math.floor(rnd(-3, 3)); const d = st.us - st.them - target; if (d > 0) st.them += d; else st.us -= d; }
      clk = clockFor(i); if (last) clk.rem = Math.min(clk.rem, rnd(4, 18));
      updBug();
      if (clk.per !== prevPer) { SFX.play('buzzer'); await banner(`END OF ${L.label === 'H' ? '1ST HALF' : 'Q' + prevPer}`, '', 1000); prevPer = clk.per; pbp(`— ${L.label}${clk.per} —`, 'sys');
        // HALFTIME: a locker-room speech when you're losing or it's a big game (it replaces the game's conversation)
        if (clk.per === Math.floor(L.periods / 2) + 1 && !st.half && !PICK && coachId && TK && talkOK && !st.talkN && !st.talkQ && (st.us - st.them <= -(CN.halftimeDown || 4) || imp0 >= 2) && cineKind('coach', 'half')) {
          st.half = true; st.talkEv = st.us < st.them ? 'me_cold' : null; formation('us'); await guardMoment(() => talk('coach', 'half'), 'halftime'); updBug(); } }
      if (st.talkQ && st.talkAt < i) {   // dead ball: a quick conversation (huddle or face-off first)
        const q = st.talkQ; st.talkQ = null; formation('us');
        await guardMoment(async () => {
          await talk(q.type, q.topic || (q.type === 'coach' ? pick(['play', 'minutes']) : null));
        }, 'talk'); updBug();
        if (st.done) break;
      }
      if (st.bench > 0) { st.bench--; pbp(`🪑 You watch from the bench as ${escH(cfg.us.name)} play on.`, 'bad'); simSegment(1 / (n + 1)); updBug(); st.lastType = 'bench'; await sleep(600); continue; }
      const diff = st.us - st.them;
      st.clutch = clk.per === L.periods && (i >= n - 2) && Math.abs(diff) <= 6; st.last = last;
      $('vig').classList.toggle('on', st.clutch); court.clutch = st.clutch;
      if (st.clutch) { SFX.music('clutch'); SFX.play('heartbeat'); st.clutchN++; if (i === n - 2 || last) await banner('CLUTCH TIME', 'clutch', 1100);
        // CLUTCH TIMEOUT: the huddle in a close game (it replaces the game's conversation)
        if (i === n - 2 && !PICK && coachId && TK && talkOK && !st.talkN && !st.talkQ && Math.abs(diff) <= (CN.clutchBy || 4) && cineKind('coach', 'clutch')) { formation('us'); await guardMoment(() => talk('coach', 'clutch'), 'huddle'); updBug(); } }
      const periodEnds = !last && clockFor(i + 1).per !== clk.per;
      const type = await guardMoment(async () => { let type;
      if (tutOn() && st.tutI < TUT_STEPS.length) type = await tutMoment();
      else if (jmDue() && !last) { if (JM.payoff || JM.first) await innerVoice('jelly'); await RUN.off_poss(); type = 'off_poss'; }   // the story's jelly moment comes first
      else if (last && st.clutch && canSeg()) {   // FINAL POSSESSION — the biggest moment of the game, played live
        const secs = clamp(Math.ceil(clk.rem), 6, 14);
        if (diff <= 0) {
          pbp(diff === 0 ? `Tied ${st.us}-${st.them}. ${secs} seconds left. Ball in your hands. Win it.` : `Down ${-diff}. ${secs} seconds left. ${-diff >= 3 ? 'You need a three to tie.' : 'Everybody knows who\'s taking this shot.'}`, 'hot');
          if (imp0 >= 2 || cfg.revenge) await innerVoice('final');
          const before = st.us; await arcadeSegment('final', { offense: 0, clock: secs, sub: diff === 0 ? `TIED · ${secs} SECONDS · WIN IT` : `DOWN ${-diff} · ${secs} SECONDS` }); type = 'final_off';
          if (st.us > st.them && before <= st.them) { st.gameWinner = true; cnt('gameWinners'); st.highlights.push('Hit the game-winner'); }
        } else {
          pbp(`Up ${diff}, ${secs} seconds left. ${star.name} has the ball. Get one stop.`, 'hot');
          if (imp0 >= 2 || cfg.revenge) await innerVoice('final_def');
          const before = st.them; await arcadeSegment('final', { offense: 1, clock: secs, sub: `UP ${diff} · GET ONE STOP` }); type = 'final_def';
          if (st.them - before < diff) { st.sealPlay = st.lastStop || Object.assign(playOf(U, 'stop', { def: STAR }), { side: 'us', clock: 0 }); cnt('clutchMakes'); st.clutchW++; st.highlights.push(`Game-sealing stop on ${star.name}`); }
        }
      } else if (periodEnds && canSeg() && st.segAt < i - 1 && (st.seg < segDue(i) || (natOk() && Math.random() < SGC.chance.buzzer) / (1 + (st.segKinds.buzzer || 0))) && !(st.segKinds.buzzer >= 2)) {
        const mine = Math.random() < .72, secs = Math.round(rnd(SGC.clocks.buzzer[0], SGC.clocks.buzzer[1]));
        formation(mine ? 'us' : 'them');
        pbp(mine ? `${secs} seconds left in the ${L.label === 'H' ? 'half' : 'quarter'}. Hold for the last shot.` : `${cfg.them.name} hold for the last shot of the ${L.label === 'H' ? 'half' : 'quarter'}.`);
        await arcadeSegment('buzzer', { offense: mine ? 0 : 1, clock: secs, sub: mine ? `LAST SHOT · ${secs} SECONDS` : 'GET A STOP BEFORE THE HORN' }); type = 'buzzer';
      } else if (st.seg < segDue(i) && canSeg()) { await createdSegment(); type = 'segment'; }
      else if (st.closeN < CL.max && st.lastType !== 'close' && Math.random() < (Math.abs(diff) <= CL.margin && clk.per > L.periods / 2 ? CL.late : CL.early)) { await closeCall(closeKind(periodEnds, last)); type = 'close'; }
      else {
        type = st.playCalled || jmDue() ? 'off_poss' : st.takeover > 0 && Math.random() < OB.star.askGuard ? 'guard_star' : pickMoment();
        if (type === 'def_poss' || type === 'quick_def' || type === 'guard_star') await withMirror(RUN[type]); else await RUN[type]();
      }
      return type; }, `moment ${i + 1}`) || 'recovered';
      st.lastType = type; idle(); st.nextBonus = st.playCalled ? st.nextBonus : null; st.playCalled = false; if (st.rattled > 0) st.rattled--; if (st.shaken > 0) st.shaken--;
      if (clk.per === L.periods && last) clk.rem = 0;
      updBug(); await sleep(500);
    }
    /* pickups: nobody at the target yet → keep playing until somebody gets there ("next bucket wins" at the end) */
    for (let sd = 1; PICK && !st.done && sd <= 16; sd++) {
      st.i = n - 1 + sd; simSegment(); clk.rem = 0; updBug(); $('momCount').textContent = 'Win by reaching ' + cfg.target;
      const near = st.us >= cfg.target - 3 && st.them >= cfg.target - 3;
      if (sd === 1 || near) { await banner(`<small>${st.us} – ${st.them} · FIRST TO ${cfg.target}</small>${near ? 'NEXT BUCKET WINS' : 'KEEP PLAYING'}`, 'clutch', 1100); pbp(near ? `${st.us}-${st.them}. Next bucket wins.` : `${st.us}-${st.them}. First to ${cfg.target} — keep playing.`, 'hot'); }
      st.clutch = near; st.last = near; $('vig').classList.toggle('on', near);
      const type = pickMoment(); await guardMoment(() => type === 'def_poss' || type === 'quick_def' ? withMirror(RUN[type]) : RUN[type](), 'next bucket');
      st.lastType = type; idle(); updBug(); await sleep(400);
    }
    if (PICK && !st.done) { const side = st.us === st.them ? (Math.random() < .5 ? 'us' : 'them') : st.us > st.them ? 'us' : 'them'; const add = cfg.target - st[side]; st.done = side; st[side] = cfg.target; pbp(`${side === 'us' ? escH(cfg.us.name) : escH(cfg.them.name)} close it out (+${add}).`, side === 'us' ? 'good' : 'bad'); }
    if (PICK && st.done) pbp(`🏁 <b>GAME!</b> ${escH(st.done === 'us' ? cfg.us.name : cfg.them.name)} reach ${cfg.target}.`, st.done === 'us' ? 'good hot' : 'bad');
    let ot = 0;
    while (!PICK && st.us === st.them && ot < 2) {
      ot++; st.ot = true; SFX.play('buzzer'); await banner('OVERTIME', 'clutch', 1200); clk = { per: L.periods + ot, rem: Math.round(rnd(2, 9) * 10) / 10 }; st.clutch = true; $('vig').classList.add('on');   // the last possession of overtime
      st.us += Math.floor(rnd(2, 7)); st.them += Math.floor(rnd(2, 7)); const d = st.us - st.them; if (d > 0) st.them += d; else st.us -= d;
      updBug(); const before = st.us;
      await guardMoment(async () => {
        if (canSeg() && (st.segKinds.final || 0) < 2) { pbp(`Overtime. Tied ${st.us}-${st.them}. Final possession — make a play.`, 'hot'); await arcadeSegment('final', { offense: 0, clock: 10, sub: 'OVERTIME · LAST SHOT' }); }
        else await offPossession({ text: `Overtime. Tied ${st.us}-${st.them}. Final possession — make a play.` });
      }, 'overtime');
      if (st.us > before) { st.gameWinner = true; cnt('gameWinners'); st.highlights.push('Won it in overtime'); }
    }
    if (!PICK && st.us === st.them) st.them += 1;
    if (size === 1) {   // 1v1: every one of your team's points is yours
      const add = st.us - st.box.pts; if (add > 0) { const fg = Math.round(add / 2); st.box.fgm += fg; st.box.fga += fg + Math.round(fg * rnd(.6, 1.1)); }
      st.box.pts = st.us;
    }
    clk.rem = 0; updBug(); SFX.play('buzzer');
    const win = PICK ? st.done === 'us' : st.us > st.them;
    if (!cfg.practice) {   // conversation pacing + your history with their star (callbacks in the next conversations)
      s.talkGap = st.talkN ? 0 : (s.talkGap == null ? 3 : s.talkGap + 1);
      s.cineGap = st.cineN ? 0 : (s.cineGap == null ? 3 : s.cineGap + 1);   // pacing of the cinematic conversations
      const V = s.vs || (s.vs = {}), R = V[STAR.full] || (V[STAR.full] = { g: 0, w: 0, l: 0 }); R.g++; if (win) R.w++; else R.l++; R.last = win ? 1 : -1;
    }
    // the play that decided it (big games replay it as the game-winner cutscene, js/cutscene.js Cutscene.winner)
    const close = PICK ? Math.min(st.us, st.them) >= cfg.target - 4 : Math.abs(st.us - st.them) <= 3;
    let winPlay = null, losePlay = null;
    if (win) {
      winPlay = (st.gwPlay && st.gwPlay.side === 'us' && st.gwPlay) || (st.sealPlay && close && st.sealPlay) || (st.gameWinner && st.lastPlay && st.lastPlay.side === 'us' && st.lastPlay) || null;
      if (winPlay && !st.gameWinner && close) { st.gameWinner = true; if (winPlay.by && winPlay.by.isUser) { cnt('gameWinners'); st.highlights.push(winPlay.kind === 'block' || winPlay.kind === 'steal' || winPlay.kind === 'stop' ? 'Made the game-winning stop' : 'Hit the game-winner'); } else if (winPlay.by) st.highlights.push(`${winPlay.by.short} hit the game-winner`); }
      if (!st.gameWinner) winPlay = null;
    } else if (close && st.lwPlay && st.lwPlay.side === 'them') losePlay = st.lwPlay;
    if (winPlay) winPlay.final = [st.us, st.them]; if (losePlay) losePlay.final = [st.us, st.them];
    $('vig').classList.remove('on', 'zone');
    if (win) { court.confetti(160); SFX.play('roar'); SFX.music('victory'); } else { SFX.play('groan'); SFX.music('sad'); }
    await banner(win ? `<small>FINAL</small>${st.us} – ${st.them}<em>VICTORY</em>` : `<small>FINAL</small>${st.us} – ${st.them}<em class="l">DEFEAT</em>`, win ? 'win' : 'loss', 2200);

    /* ---------- background production (stats from off-screen possessions) ---------- */
    const bg = FULL ? 0 : L.bg * (st.minutes ? 1.4 : 1), o = myOvr;
    const made2 = Math.round(rnd(.2, .65) * (o / 10) * bg * 2);
    const extra = { pts: made2 * 2, reb: Math.round(rnd(.3, 1.2) * (ME.reb / 18) * bg), ast: Math.round(rnd(.3, 1.2) * (ME.pass / 20) * bg) };
    st.box.pts += extra.pts; st.box.reb += extra.reb; st.box.ast += extra.ast; st.box.fgm += made2; st.box.fga += made2 + Math.round(made2 * rnd(.4, 1.1));

    /* ---------- full box score: points the visible plays didn't cover are spread over each roster ---------- */
    function fillTeam(list, total) {
      const others = list.filter(p => !p.isUser); if (!others.length) return;
      let left = total - list.reduce((t, p) => t + p.box.pts, 0);
      while (left < 0 && others.some(p => p.box.pts >= 2)) { const p = others.filter(q => q.box.pts >= 2).sort((a, z) => z.box.pts - a.box.pts)[0]; p.box.pts -= 2; p.box.fgm = Math.max(0, p.box.fgm - 1); left += 2; }
      const wt = p => (p === STAR ? 3 : 1) + (p.role === 'shooter' || p.role === 'slasher' ? .5 : 0);
      for (let g = 0; left > 0 && g < 500; g++) {
        let r = Math.random() * others.reduce((t, p) => t + wt(p), 0), p = others[0]; for (const q of others) { r -= wt(q); if (r <= 0) { p = q; break; } }
        const b = p.box;
        if (left >= 3 && Math.random() < (p.role === 'shooter' ? .45 : .18)) { b.pts += 3; b.fgm++; b.fga++; b.tpm++; b.tpa++; left -= 3; }
        else if (left >= 2) { b.pts += 2; b.fgm++; b.fga++; left -= 2; }
        else { b.pts++; b.ftm++; b.fta++; left--; }
        if (Math.random() < .6) { b.fga++; if (p.role === 'shooter' && Math.random() < .6) b.tpa++; }
      }
      others.forEach(p => { const b = p.box, k = Math.max(.3, L.bg * 2); b.reb += Math.round(rnd(.2, 1) * (p.role === 'big' ? 4 : 1.6) * k); b.ast += Math.round(rnd(0, 1) * (p.role === 'playmaker' ? 3 : 1.2) * k); b.stl += Math.random() < .3 * k ? 1 : 0; b.blk += p.role === 'big' && Math.random() < .35 * k ? 1 : 0; });
    }
    fillTeam(US, st.us); fillTeam(TH, st.them);
    const rowOf = p => Object.assign({ name: p.isUser ? `${s.player.first} ${s.player.last}` : p.full, short: p.short, isUser: !!p.isUser, star: p === STAR, weapons: (p.weapons || []).map(id => WEAPONS[id] && WEAPONS[id].name).filter(Boolean) }, p.box);
    const teams = { us: US.map(rowOf), them: TH.map(rowOf) };

    /* ---------- grade ---------- */
    const rate = st.att ? st.succ / st.att : .5;
    const gs = 18 + rate * 66 + (win ? 12 : 0) + st.clutchW * 6 + st.perfects * 2 + Math.min(8, st.box.pts / 3) - st.box.to * 3;
    const grade = gs >= 92 ? 'A+' : gs >= 85 ? 'A' : gs >= 80 ? 'A-' : gs >= 75 ? 'B+' : gs >= 68 ? 'B' : gs >= 62 ? 'B-' : gs >= 56 ? 'C+' : gs >= 50 ? 'C' : gs >= 44 ? 'C-' : gs >= 36 ? 'D' : 'F';
    court.destroy();
    return {
      win, us: st.us, them: st.them, box: st.box, grade, gradeScore: gs, successes: st.succ, attempts: st.att, clutchMoments: st.clutchN, clutchWins: st.clutchW,
      gameWinner: st.gameWinner, highlights: st.highlights, counters: st.counters, perfects: st.perfects, posterizers: st.posterizers, segments: st.seg, segKinds: st.segKinds, segMoments: st.segMoments || [], moments: n, venueId: court.venueId,
      fatigue: st.fatigue, level: cfg.level, importance: cfg.importance || 1, cfg, teams, closeCalls: st.closeN, winPlay, losePlay,
    };
  }

  return { play, MG, Court, LEVELS, green, talk: storyTalk };
})();
