/* =====================================================================
   ARCADE.JS — real-time 16-bit arcade basketball.
   Used in exactly two places:
     1. FAST BREAKS inside matches  -> Arcade.fastBreak(cfg)
     2. PICKUP GAMES (3v3, first to 21) in the hub and in story playground games -> Arcade.play(cfg)
   Every shot / steal / block / rebound / dribble-move chance uses Balance.pct() — the same
   formulas as the rest of the game. All speeds, dribble moves and AI values live in
   js/balance.js (BALANCE.arcade and BALANCE.difficulty).

   Players are drawn with a tiny skeleton (hips, knees, shoulders, elbows) so every action has a
   real animation: idle, run, defensive slide, dribble, jump shot, layup, dunk, pass, steal, block,
   rebound, knocked down, ankle-broken, and the five dribble moves.

   Controls: move WASD / arrows · SHOOT/BLOCK J or SPACE (hold, release at the top of the jump)
             PASS/STEAL K · DRIBBLE MOVE L or SHIFT (on defense: slide; slide + STEAL = shove)
   Touch:    joystick (left) + SHOOT / PASS / MOVE buttons (right).
   ===================================================================== */
const ARCADE = {
  W: 384, H: 216,
  hoop: { x: 192, y: 60, z: 32 },                   // ground point under the rim + rim height (px)
  three: { rx: 116, ry: 84 },                       // 3pt arc radii around the hoop
  court: { x0: 18, x1: 366, y0: 46, y1: 212 },
  layupRange: 34, dunkRange: 40,
  spots: [[192, 166], [110, 132], [274, 132], [78, 74], [306, 74]],   // half-court spots (top, wings, corners)
  lines: {
    dunk: ['KABLAMO!', 'WITH AUTHORITY!', 'SKY WALKER!', 'HELLO, RIM!', 'FROM THE ROOFTOPS!'],
    three: ['DOWNTOWN EXPRESS!', 'NOTHING BUT NYLON!', 'CASH MONEY!', 'FROM WAY OUT!'],
    two: ['TOO EASY!', 'BUCKETS!', 'GET BUCKETS!', 'SMOOTH!'],
    block: ['REJECTED!', 'SWAT CITY!', 'NOT IN MY HOUSE!', 'GET THAT OUTTA HERE!'],
    steal: ['PICKPOCKET!', 'STOLEN!', 'SNATCHED!'],
    shove: ['TIMBER!', 'BULLDOZED!', 'OUT OF MY WAY!'],
    ankles: ['ANKLES!!', 'BROKE HIS ANKLES!', 'CALL A DOCTOR!', 'HE FELL DOWN!'],
    beat: ['BLOWN BY!', 'FROZE HIM!', 'SEE YA!', 'TOO QUICK!'],
    heating: ['HEATING UP!'], fire: ['ON FIRE!'], shatter: ['SHATTERED!! THE GLASS IS GONE!'],
  },
};

const Arcade = (() => {
  const A = ARCADE, CF = () => BALANCE.arcade;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.3);
  const toHoop = p => Math.hypot(p.x - A.hoop.x, (p.y - A.hoop.y) * 1.3);
  const isThree = p => Math.pow((p.x - A.hoop.x) / A.three.rx, 2) + Math.pow((p.y - A.hoop.y) / A.three.ry, 2) > 1;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SHADES = new Map();
  function shade(hex, amt) {
    const key = hex + amt; if (SHADES.has(key)) return SHADES.get(key);
    let h = String(hex || '#888').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16) || 0, t = amt < 0 ? 0 : 255, k = Math.abs(amt);
    const ch = s => Math.round(lerp((n >> s) & 255, t, k)).toString(16).padStart(2, '0');
    const out = '#' + ch(16) + ch(8) + ch(0); SHADES.set(key, out); return out;
  }

  /* Which dribble moves a player has (Ball Handling + archetype) */
  function movesFor(pl) {
    const M = CF().moves, am = M.arch[pl.arch] || {}, h = (pl.st || pl.stats || {}).handle || 50;
    return Object.keys(M.list).filter(k => h >= M.list[k].handle + (am[k] || 0) + (am.all || 0));
  }

  /* =================================================================
     ENGINE
     cfg: { mode: 'game' | 'seg', teams:[{name,abbr,colors,players:[{name,stats,look,num,arch,isUser,bonus,stamina}]}, …],
            target, title, sub, venue (VENUES id), difficulty,
            seg (one possession inside a match): { kind, setup: 'break'|'half'|'loose'|'putback', offense: 0|1,
                 clock (s), clockLabel, untilClock (keep playing after offensive boards until the clock runs out), handler: 'me'|'mate' },
            backD (fast break: defenders already back), score:[us,them] (shown in the HUD) }
     ================================================================= */
  const VENUE_ALIAS = { street: 'street_night', gym: 'rec_center', arena: 'college_arena' };
  const blendAI = (a, b, k) => { const o = {}; for (const key in b) o[key] = a[key] + (b[key] - a[key]) * k; return o; };
  function run(cfg) {
    return new Promise(resolve => {
      const PACE = CF().pace, MV = CF().moves;
      const diff = DIFFICULTY[cfg.difficulty] ? cfg.difficulty : (Game.state && DIFFICULTY[Game.state.difficulty] ? Game.state.difficulty : 'pro');
      const AIP = BALANCE.difficulty.pro.arcade, WINDOW = DIFFICULTY[diff].window;
      // Hall of Fame eases off for low-Overall players (hard, not hopeless, early in a career)
      const EZ = BALANCE.difficulty[diff].arcadeEase, ovr = Game.state && Game.state.player ? Engine.ovr(Game.state) : 70;
      const ease = EZ ? clamp((ovr - EZ.ovr[0]) / (EZ.ovr[1] - EZ.ovr[0]), 0, 1) : 1;
      const AIO = blendAI(AIP, BALANCE.difficulty[diff].arcade, EZ ? EZ.ai + (1 - EZ.ai) * ease : 1), easeShot = EZ ? Math.round(EZ.shot * (1 - ease)) : 0;
      const mode = cfg.mode === 'break' ? 'seg' : (cfg.mode || 'game'), SEGM = mode !== 'game', target = cfg.target || 21;
      const SEG = SEGM ? Object.assign({ kind: 'fastbreak', setup: 'break', offense: 0, clock: PACE.breakClock, clockLabel: 'BREAK' }, cfg.seg || {}) : null;
      const BREAK = SEGM && SEG.setup === 'break';
      const T0 = cfg.teams[0], T1 = cfg.teams[1];
      const VEN = Pixel.venue(VENUE_ALIAS[cfg.venue] || cfg.venue || 'street_night', T0, T1, A.W);
      const portrait = innerHeight > innerWidth * 1.15 && innerWidth < 760, VW = portrait ? 256 : A.W;   // phones held upright: a closer camera

      /* ---------- DOM ---------- */
      const root = document.createElement('div'); root.className = 'arc' + (SEGM ? ' brk seg-' + SEG.kind : '') + (portrait ? ' arc-portrait' : '');
      const touch = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
      const sc0 = SEGM ? (cfg.score || [0, 0])[0] : 0, sc1 = SEGM ? (cfg.score || [0, 0])[1] : 0;
      root.innerHTML = `
        <div class="arc-hud">
          <div class="ah-team" style="--tc:${T0.colors[0]}"><i></i><b>${esc(T0.abbr)}</b><span class="ah-s" id="ahS0">${sc0}</span></div>
          <div class="ah-mid"><b id="ahMode">${esc(cfg.title || (SEGM ? 'FAST BREAK' : 'STREETBALL'))}</b><span id="ahClock">${SEGM ? 'GO!' : 'FIRST TO ' + target}</span></div>
          <div class="ah-team r" style="--tc:${T1.colors[0]}"><span class="ah-s" id="ahS1">${sc1}</span><b>${esc(T1.abbr)}</b><i></i></div>
          <div class="ah-btns"><button class="arc-btn-sm" data-a="help" aria-label="Controls">?</button>${SEGM ? '' : '<button class="arc-btn-sm" data-a="quit">Quit</button>'}</div>
        </div>
        <div class="arc-stage" style="aspect-ratio:${VW} / ${A.H}"><canvas width="${VW}" height="${A.H}"></canvas><div class="arc-scan"></div><div class="arc-tags"></div><div class="arc-pop"></div><div class="arc-intro"></div><div class="arc-trans"><div class="at-stripes"></div><b></b></div></div>
        <div class="arc-bar"><div class="ab-stam"><span>STAMINA</span><div class="ab-meter"><i id="abStam"></i></div></div><div class="ab-move" id="abMove"><span>DRIBBLE MOVE</span><b>READY</b></div><div class="ab-move ab-wpn" id="abWpn"><span>⚔ WEAPON${touch ? '' : ' [E]'}</span><b>READY</b></div>
          <div class="arc-keys"> ${touch ? '' : 'MOVE <kbd>WASD</kbd> · SHOOT/BLOCK <kbd>J</kbd>/<kbd>SPACE</kbd> hold &amp; release · PASS/STEAL <kbd>K</kbd> · DRIBBLE MOVE <kbd>L</kbd>/<kbd>SHIFT</kbd>'}</div></div>
        <div class="arc-touch ${touch ? 'on' : ''}"><div class="arc-joy"><div class="arc-knob"></div></div><div class="arc-pad"><button data-b="wpn" id="tbWpn" class="wpn">⚔<small>WEAPON</small></button><button data-b="move" id="tbMove">MOVE<small>DRIBBLE</small></button><button data-b="pass">PASS<small>STEAL</small></button><button data-b="shoot" class="big">SHOOT<small>BLOCK</small></button></div></div>
        <div class="arc-help"><div class="arc-help-card"><h3>ARCADE CONTROLS</h3>
          <p><b>Move</b> WASD / arrow keys · touch: joystick</p>
          <p><b>Shoot</b> hold J / SPACE (or SHOOT), release at the top of your jump. Near the rim you lay it up or dunk.</p>
          <p><b>Pass</b> K — toward the joystick direction, or to the open man. Without the ball, K calls for it.</p>
          <p><b>Dribble move</b> L / SHIFT (MOVE). Stick away from where you face = crossover-type move, no stick = hesitation, stick forward with a defender in front = spin. Each move gives a burst of speed and a chance to beat or freeze your man. There's a short cooldown — spamming it can cost you the ball.</p>
          <p><b>Defense</b> J = jump to block · K = steal · L = defensive slide (slide then K = shove)</p>
          <p><b>⚔ Weapon</b> E (or ⚔) — fires the weapon that fits the moment (shot, drive, steal, block…). A short aura boosts that play. Teammates with an <b>OPEN</b> tag are calling for the ball.</p>
          <p class="arc-moves" id="arcMoves"></p>
          <button class="btn glow" data-a="gotit">Got it — let's play</button></div></div>`;
      document.body.appendChild(root); document.body.classList.add('arc-open');
      const $ = id => root.querySelector('#' + id);
      const cv = root.querySelector('canvas'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      const popEl = root.querySelector('.arc-pop'), tagEl = root.querySelector('.arc-tags'), intro = root.querySelector('.arc-intro'), help = root.querySelector('.arc-help'), trans = root.querySelector('.arc-trans');

      /* ---------- teams + players ---------- */
      const players = [];
      cfg.teams.forEach((tm, ti) => tm.players.forEach((pl, i) => {
        const look = pl.look || Art.lookFromSeed(pl.name);
        players.push({ team: ti, i, name: pl.name, short: String(pl.name).replace(/"[^"]*"\s*/, '').trim().split(' ').slice(-1)[0], st: pl.stats, arch: pl.arch, isUser: !!pl.isUser, bonusFn: pl.bonus, isStar: !!pl.star,
          weapons: (pl.weapons || []).map(w => typeof w === 'string' ? { id: w, rank: 1 } : w).filter(w => WEAPONS[w.id]), wpn: null, wUsed: 0,
          num: pl.num != null ? pl.num : (look.num || (7 + i * 13 + ti * 5) % 60),
          skin: look.skin || '#a86b43', skinD: shade(look.skin || '#a86b43', -.28), hair: look.hair || 'fade', hairC: look.hairColor || '#111', band: look.headband || '', shoe: look.shoeColor || '#f8fafc',
          col: tm.colors[0], colD: shade(tm.colors[0], -.32), colL: shade(tm.colors[0], .18), col2: tm.colors[1] || '#ffffff',
          x: 192, y: 160, z: 0, vz: 0, vx: 0, vy: 0, face: 1, look, phase: rnd(0, 6), dribT: rnd(0, 1), stamina: clamp(pl.stamina != null ? pl.stamina : 100, 20, 100), stun: 0, act: null,
          cool: 0, spam: 0, lastMove: -9, burst: 0, bdx: 0, bdy: 0, slide: 0, stealCD: 0, aiT: rnd(0, .3), goal: null, guard: null, catchT: -9, stance: false,
          streak: 0, fire: 0, moves: null, box: { pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, reb: 0, ast: 0, stl: 0, blk: 0, dunks: 0, to: 0 } });
      }));
      players.forEach(p => p.moves = movesFor(p));
      const me = players.find(p => p.isUser) || players[0];
      const teamOf = t => players.filter(p => p.team === t);
      const ball = { state: 'held', owner: null, x: 192, y: 160, z: 10, vx: 0, vy: 0, vz: 0, spin: 0, shot: null, pass: null, lastPasser: null, passT: -9, sx: 0, sy: 0, sz: 0 };
      const G = { score: [0, 0], off: 0, clock: SEGM ? SEG.clock : PACE.shotClock, over: false, paused: true, started: false, time: 0, real: 0, cam: (A.W - VW) / 2,
        slowT: 0, zoom: 1, zf: { x: A.hoop.x, y: 40 }, shake: 0, flash: 0, speedT: 0, stop: 0, kick: 0, vt: 0, cutAt: -99, cuts: 0, flashCol: '255,255,255', wlog: [], callT: 0,
        anyFire: false, mustClear: false, endAt: 0, pending: null, log: [], stamUsed: 0, lastScorer: null, lastShooter: null, fbStart: 0 };
      const RD = Pixel.renderer(c, VEN), E = RD.E;
      E.onLand = (p, h) => { if (h > 14) SFX.play('thud', p === me ? .9 : .45); };
      if (typeof Cutscene !== 'undefined' && Cutscene.prep) Cutscene.prep(me.look || Engine.look(Game.state));   // portrait for highlight close-ups
      const input = { jx: 0, jy: 0, shoot: false };

      /* ---------- setup ---------- */
      function resetP(p) { p.z = 0; p.vz = 0; p.vx = 0; p.vy = 0; p.stun = 0; p.act = null; p.goal = null; p.burst = 0; p.slide = 0; p.celebNext = null; p.bumpTo = null; }
      function giveBall(p) { ball.state = 'held'; ball.owner = p; ball.shot = null; ball.pass = null; p.catchT = G.time; }
      function setupHalf(off) {
        G.off = off; G.clock = SEGM ? SEG.clock : PACE.shotClock; G.mustClear = false;
        const O = teamOf(off), D = teamOf(1 - off);
        O.forEach((p, i) => { const sp = A.spots[i] || A.spots[0]; resetP(p); p.x = sp[0] + rnd(-4, 4); p.y = sp[1] + rnd(-3, 3); p.face = p.x < A.hoop.x ? 1 : -1; });
        D.forEach((p, i) => { const m = O[i] || O[0]; resetP(p); p.guard = m; p.x = lerp(m.x, A.hoop.x, .22); p.y = lerp(m.y, A.hoop.y, .22); p.face = m.x < p.x ? -1 : 1; });
        O.forEach(p => p.guard = null);
        const h = O.includes(me) && !(SEGM && SEG.handler === 'mate' && O.length > 1) ? me : O.find(p => p !== me) || O[0]; h.x = 192; h.y = 168; giveBall(h);
        ball.lastPasser = null;
      }
      function setupLoose() {   // LOOSE BALL: everyone dives for it, whoever wins it plays the possession
        G.off = -1; G.clock = SEG.clock;
        const bx = 192 + rnd(-50, 50), by = 128 + rnd(-22, 22);
        players.forEach((p, i) => { resetP(p); const a = (i / players.length) * Math.PI * 2 + rnd(-.3, .3), r = 34 + rnd(0, 16); p.x = clamp(bx + Math.cos(a) * r * 1.4, 30, 354); p.y = clamp(by + Math.sin(a) * r, 70, 205); p.face = bx >= p.x ? 1 : -1; });
        looseBall(bx, by, rnd(-30, 30), rnd(-20, 20), 30); ball.z = 12; ball.stripFrom = 'loose';
      }
      function setupPutback() {   // SCRAMBLE: our shot is coming off the rim, battle for the board
        G.off = 0; G.clock = SEG.clock; G.pbGrab = false;
        const O = teamOf(0), D = teamOf(1), H = A.hoop;
        O.forEach((p, i) => { resetP(p); p.x = 192 + [-24, 24, 0][i % 3] + rnd(-6, 6); p.y = 80 + [8, 12, 36][i % 3] + rnd(-4, 4); });
        D.forEach((p, i) => { resetP(p); const m = O[i] || O[0]; p.x = m.x + (m.x < 192 ? 6 : -6); p.y = m.y - 7; });
        looseBall(H.x + rnd(-4, 4), H.y + 2, rnd(-55, 55), rnd(25, 55), 55); ball.z = H.z + 2; SFX.play('rim'); E.rim = .6;
      }
      function setupBreak() {
        G.off = 0; G.clock = PACE.breakClock;
        const O = teamOf(0), D = teamOf(1), h = O[0], back = cfg.backD != null ? cfg.backD : 1;
        resetP(h); h.x = 192 + rnd(-24, 24); h.y = 198; h.vy = -40; h.face = h.x < 192 ? 1 : -1;
        const lanes = [96, 288, 150]; let li = 0;
        O.filter(p => p !== h).forEach(p => { resetP(p); p.x = lanes[li++ % 3] + rnd(-8, 8); p.y = 204 + rnd(-4, 6); p.vy = -36; });
        D.forEach((p, i) => { resetP(p); p.guard = O[i] || h;
          if (i < back) { p.x = 192 + rnd(-14, 14); p.y = 104 + i * 18; p.face = h.x < p.x ? -1 : 1; p.role = 'back'; }
          else { p.x = h.x + rnd(-26, 26); p.y = 212; p.vy = -20; p.role = 'trail'; } });
        O.forEach(p => p.guard = null);
        giveBall(h); ball.lastPasser = null; G.speedT = 1.1;
      }
      if (!SEGM) setupHalf(cfg.first != null ? cfg.first : 0);
      else if (SEG.setup === 'break') setupBreak(); else if (SEG.setup === 'loose') setupLoose(); else if (SEG.setup === 'putback') setupPutback(); else setupHalf(SEG.offense === 1 ? 1 : 0);

      /* ---------- formulas (Balance) ---------- */
      const nearestDef = p => { let best = null, d = 999; players.forEach(q => { if (q.team !== p.team && q.stun <= 0 && dist(q, p) < d) { d = dist(q, p); best = q; } }); return best; };
      const openness = p => { let d = 999; players.forEach(q => { if (q.team !== p.team) d = Math.min(d, dist(q, p)); }); return d; };
      const contestFor = s => {
        let d = 999; players.forEach(q => { if (q.team !== s.team && q.stun <= 0) d = Math.min(d, dist(q, s) - (q.z > 0 ? 6 : 0)); });
        if (toHoop(s) < A.dunkRange) players.forEach(q => { if (q.team !== s.team && q.stun <= 0 && toHoop(q) < 26) d = Math.min(d, 13); });   // rim protection
        return d > 34 ? 'open' : d > 18 ? 'normal' : d > 10 ? 'contested' : 'heavy';
      };
      const canDunk = p => Balance.available('dunk', p.st);
      const bonusOf = (p, action) => {
        const out = p.bonusFn ? p.bonusFn(action) : [];
        if (p.team !== me.team && BALANCE.defense[diff]) out.push({ label: 'Difficulty', v: BALANCE.defense[diff] * .6 });
        if (p.fire > 0) out.push({ label: 'On fire', v: 6 });
        if (p.wpn && p.wpn.t > 0 && Weapons.fits(p.wpn.id, action)) out.push({ label: WEAPONS[p.wpn.id].name, v: WA.bonus + (p.wpn.rank - 1) * WA.perRank });
        if (BREAK && p.team === 0 && ['layup', 'dunk', 'catchMid', 'pullMid', 'catch3', 'pull3'].includes(action)) out.push({ label: 'Fast break', v: 6 });
        if (easeShot && p.team === me.team && ['layup', 'dunk', 'catchMid', 'pullMid', 'catch3', 'pull3', 'move'].includes(action)) out.push({ label: 'Early career', v: easeShot });
        return out;
      };
      function shotChance(p) {
        const dh = toHoop(p), three = isThree(p), def = nearestDef(p), fresh = G.time - p.catchT < .9;
        const action = dh < A.layupRange ? (canDunk(p) && dh < A.dunkRange && p.st.dunk >= 45 ? 'dunk' : 'layup') : three ? (fresh ? 'catch3' : 'pull3') : (fresh ? 'catchMid' : 'pullMid');
        const ctx = { def: def ? def.st : null, diff: p.team === me.team ? diff : '_none', contest: contestFor(p), deep: three && dh > A.three.rx * 1.25, fatigue: 100 - p.stamina, bonus: bonusOf(p, action) };
        return { action, three, dh, pct: Balance.pct(action, p.st, ctx).pct };
      }
      const pctOf = (action, p, def, extra = {}) => Balance.pct(action, p.st, Object.assign({ def: def ? def.st : null, diff: p.team === me.team ? diff : '_none', fatigue: 100 - p.stamina, bonus: bonusOf(p, action) }, extra)).pct;

      /* ---------- text pops ---------- */
      function pop(text, color = '#facc15', big) {
        const el = document.createElement('div'); el.className = 'arc-msg' + (big ? ' big' : ''); el.style.color = color; el.textContent = text;
        popEl.appendChild(el); setTimeout(() => el.remove(), 1600);
      }
      function tag(text, p, color = '#fff') {  // small text above a player
        const el = document.createElement('div'); el.className = 'arc-tag'; el.style.color = color; el.textContent = text;
        el.style.left = ((p.x - G.cam) / VW * 100) + '%'; el.style.top = ((p.y - p.z - 40) / A.H * 100) + '%';
        tagEl.appendChild(el); setTimeout(() => el.remove(), 1100);
      }
      const logLine = t => G.log.push(t);
      /* ---- WEAPONS: anyone can fire one — name pop-up, freeze frame, aura, then a boost on the matching play ---- */
      const WA = BALANCE.weapons.arcade;
      const wLimit = p => SEGM ? 1 : 2 + Math.floor(p.box.pts / 7);
      const wReady = p => p.weapons.length && p.wUsed < wLimit(p) && !(p.wpn && p.wpn.t > 0);
      function activateWeapon(p, id) {
        const w = WEAPONS[id]; if (!w) return false;
        const rank = (p.weapons.find(x => x.id === id) || { rank: 1 }).rank, mine = p.team === me.team;
        p.wpn = { id, t: WA.aura, rank }; p.wUsed++;
        G.stop = Math.max(G.stop, .32); G.flash = Math.max(G.flash, .35); G.flashCol = mine ? '250,204,21' : '239,68,68'; G.kick = Math.max(G.kick, .06);
        pop(`⚔ ${w.name.toUpperCase()}`, mine ? '#facc15' : '#f87171', true); tag(p === me ? 'WEAPON!' : p.short.toUpperCase(), p, mine ? '#fde68a' : '#fca5a5'); SFX.play('sig');
        RD.ring(p.x, p.y, mine ? '#facc15' : '#ef4444', 120, .5, 2, .4); G.wlog.push({ name: p.name, weapon: w.name, team: p.team }); logLine(`${p.name} uses ${w.name}`);
        return true;
      }
      /* the weapon that fits what p is doing right now */
      function fitWeapon(p, action) { return (p.weapons.find(x => Weapons.fits(x.id, action)) || {}).id; }
      const aiWeapon = (p, action) => { if (p === me || !wReady(p) || Math.random() > WA.aiUse * (p.isStar ? 1.5 : 1)) return; const id = fitWeapon(p, action); if (id) activateWeapon(p, id); };
      const spendWeapon = (p, action) => { if (p.wpn && Weapons.fits(p.wpn.id, action)) p.wpn.t = Math.min(p.wpn.t, .5); };
      function pressWeaponBtn() {
        if (!live()) return;
        if (!wReady(me)) { tag(me.wpn && me.wpn.t > 0 ? 'ACTIVE!' : me.weapons.length ? 'USED' : 'NO WEAPON', me, '#94a3b8'); return; }
        let id;
        if (ball.owner === me) { const sc = shotChance(me); id = fitWeapon(me, sc.action) || fitWeapon(me, 'layup') || fitWeapon(me, isThree(me) ? 'pull3' : 'pullMid') || fitWeapon(me, 'pass'); }
        else if (G.off !== me.team) id = fitWeapon(me, 'steal') || fitWeapon(me, 'block') || fitWeapon(me, 'stop');
        else id = fitWeapon(me, 'catch3') || fitWeapon(me, 'catchMid') || fitWeapon(me, 'layup');
        if (!id) { tag('NO WEAPON FITS', me, '#94a3b8'); return; }
        activateWeapon(me, id);
      }
      /* ---- impact feel: hit-stop freeze, camera punch-in, flash ---- */
      function impact(stop, shake, flash, kick = .05, col = '255,255,255') { G.stop = Math.max(G.stop, stop); G.shake = Math.max(G.shake, shake); G.flash = Math.max(G.flash, flash); G.flashCol = col; G.kick = Math.max(G.kick, kick); }
      /* ---- quick cut to an anime close-up for highlight plays (rate-limited) ---- */
      function highlight(kind, p, caption, delay = 170) {
        if (typeof Cutscene === 'undefined' || !Cutscene.highlight || G.over || G.real - G.cutAt < 7 || G.cuts >= (SEGM ? 1 : 3)) return;
        const tm = cfg.teams[p.team], ok = p === me ? Cutscene.ready(me.look) : false; if (!ok) return;
        G.cutAt = G.real; G.cuts++;
        setTimeout(() => { if (G.over) return; G.stop = Math.max(G.stop, 1.25); Cutscene.highlight({ kind, look: me.look, name: p.name, caption, colors: tm.colors, bench: teamOf(p.team).length }); }, delay);
      }
      /* ---- celebrations + reactions after a basket ---- */
      function celebrate(p, kind, pts) {
        const big = kind === 'dunk' || pts === 3 || p.fire > 0;
        p.celebNext = kind === 'dunk' ? pick(['flex', 'thump', 'flex']) : pts === 3 ? pick(['point', 'point', 'celebrate']) : pick(['celebrate', 'clap', 'point']);
        teamOf(p.team).filter(q => q !== p && q.stun <= 0).forEach(q => { q.celebNext = 'joy'; if (big && dist(q, p) < 90) q.bumpTo = p; });
        teamOf(1 - p.team).forEach(q => { if (q.stun <= 0) q.celebNext = 'hang'; });
        RD.cheer(big ? 1 : .55, big);
      }
      function burst(x, y, col, n = 14, sp = 60) { for (let i = 0; i < n; i++) E.fx.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.3, sp * .2), life: rnd(.4, .8), col }); }

      /* =================================================================
         ACTIONS
         ================================================================= */
      const busyActs = ['shoot', 'layup', 'dunk', 'pass', 'down', 'sit'];
      function canAct(p) { return p.stun <= 0 && !(p.act && busyActs.includes(p.act.type)); }

      /* ---- shooting ---- */
      function pressShoot(p) {
        if (ball.owner !== p || ball.state !== 'held' || !canAct(p) || p.z > 0) return;
        if (G.mustClear && !isThree(p)) { if (p === me) tag('TAKE IT BACK!', p, '#fca5a5'); return; }
        if (p.act && p.act.type === 'move') p.act = null;
        if (p !== me) aiWeapon(p, shotChance(p).action);
        const sc = shotChance(p); spendWeapon(p, sc.action);
        if (sc.action === 'dunk') return startDunk(p, sc);
        if (sc.action === 'layup') return startLayup(p, sc);
        p.act = { type: 'shoot', t: 0, sc, air: false, released: false };
        p.vx *= .2; p.vy *= .2; p.face = A.hoop.x >= p.x ? 1 : -1;
        if (p !== me) p.act.aiRel = rnd(-.07, .07);
        armBlockers(p);
      }
      function releaseShoot(p) { if (p.act && ['shoot', 'layup', 'dunk'].includes(p.act.type)) p.act.wantRelease = true; }
      function releaseQuality(p, err, stat, wide = 1) {
        if (p !== me) return clamp(aiFor(p).shotQ + rnd(-.22, .22), 0, 1);
        const win = (.05 + Balance.eff(stat) / 99 * .09) * WINDOW * wide;
        if (err < win * .35) { pop('PERFECT RELEASE', '#4ade80'); SFX.play('perfect'); return 1; }
        return clamp(1 - err / (win * 3), 0, 1);
      }
      function armBlockers(s) { players.forEach(q => { if (q.team !== s.team) q.blockOn = null; }); }
      function blockCheck(shooter, kind) {   // a defender who jumped at the right time can block it
        let blocker = null;
        players.forEach(q => {
          if (blocker || q.team === shooter.team || q.stun > 0 || !(q.act && q.act.type === 'block') || q.act.t > .5) return;
          if (dist(q, shooter) > (q.act.chase ? 20 : 17)) return;
          const p = pctOf('block', q, shooter) * (kind === 'dunk' ? .45 : kind === 'layup' ? .8 : 1) * (q === me ? 1 : .6 + aiFor(q).block * .4) * (q.act.chase ? 1.15 : 1); spendWeapon(q, 'block');
          if (Math.random() * 100 < p) blocker = q;
        });
        return blocker;
      }
      function blocked(q, shooter) {
        q.box.blk++; ball.shot = null; ball.owner = null; ball.state = 'loose';
        ball.x = shooter.x + shooter.face * 4; ball.y = shooter.y; ball.z = Math.max(18, shooter.z + 26); ball.vx = (q.x < shooter.x ? 1 : -1) * rnd(50, 110); ball.vy = rnd(10, 60); ball.vz = 50;
        pop(pick(A.lines.block), '#38bdf8', true); SFX.play('dunk'); SFX.play('crowd', 1.5); impact(.13, 7, .25, .06, '186,230,253'); E.hype = Math.min(1, E.hype + .3); burst(ball.x, ball.y - ball.z, '#e0f2fe', 16); RD.ring(ball.x, ball.y - ball.z, '#bae6fd', 140, .3); RD.sweat(shooter.x, shooter.y - shooter.z - 22, 5); RD.cheer(.8);
        if (q === me) highlight('block', q, pick(A.lines.block), 140);
        shooter.streak = 0; if (shooter.fire) shooter.fire = 0;
        logLine(`${q.name} blocks ${shooter.name}!`);
      }
      function launch(p, sc, q) {
        const blk = blockCheck(p, 'shot'); if (blk) { p.box.fga++; if (sc.three) p.box.tpa++; G.lastShooter = p; return blocked(blk, p); }
        const pct = Balance.apply(sc.action, sc.pct, q), made = Math.random() * 100 < pct;
        const res = made ? (q > .8 || Math.random() < .55 ? 'swish' : 'rimin') : (q < .15 && sc.dh > 70 && Math.random() < .5 ? 'airball' : Math.random() < .55 ? 'rimout' : 'back');
        const hand = p.hand || { x: p.x + p.face * 3, y: p.y - p.z - 32 };
        ball.owner = null; ball.state = 'shot';
        const from = { x: p.x + p.face * 2, y: p.y, z: p.z + 32 }, H = A.hoop;
        const to = res === 'airball' ? { x: H.x + rnd(-8, 8), y: H.y + 10, z: H.z - 9 } : res === 'rimout' ? { x: H.x + rnd(-3, 3), y: H.y + 3, z: H.z + 1 } : res === 'back' ? { x: H.x + rnd(-2, 2), y: H.y - 3, z: H.z + 2 } : { x: H.x, y: H.y, z: H.z + 1 };
        ball.shot = { by: p, from, to, t: 0, T: PACE.shotFlight(sc.dh), made, res, three: sc.three, action: sc.action, peak: 18 + sc.dh * .16, pct };
        if ((SEGM && SEG.untilClock && G.clock < 2.2) || (!SEGM && made && G.score[p.team] + (sc.three ? 3 : 2) >= target)) { G.slowT = 1.2; G.zoomT = 1; G.winShot = !SEGM && made; SFX.play('heartbeat'); }
        Object.assign(ball, { x: from.x, y: from.y, z: from.z }); void hand;
        p.box.fga++; if (sc.three) p.box.tpa++; G.lastShooter = p;
      }
      function startLayup(p, sc) {
        p.act = { type: 'layup', t: 0, T: .7, sc, from: { x: p.x, y: p.y }, released: false, foul: foulCheck(p) };
        p.face = A.hoop.x >= p.x ? 1 : -1; armBlockers(p);
      }
      function startDunk(p, sc) {
        const poster = players.some(q => q.team !== p.team && q.stun <= 0 && toHoop(q) < 22);
        const big = BREAK || poster || p.st.dunk >= 70 || Math.random() < .35;
        p.act = { type: 'dunk', t: 0, T: 1.05, sc, from: { x: p.x, y: p.y }, big, poster, foul: foulCheck(p) };
        p.face = A.hoop.x >= p.x ? 1 : -1; SFX.play('whoosh'); armBlockers(p);
      }
      function foulCheck(p) {
        const close = players.filter(q => q.team !== p.team && q.stun <= 0 && dist(q, p) < 12).length;
        return close > 0 && Math.random() * 100 < CF().foul * (close > 1 ? 1.5 : 1);
      }

      /* ---- scoring ---- */
      function scoreBasket(p, pts, kind, foul) {
        G.score[p.team] += pts; p.box.pts += pts; p.box.fgm++; if (pts === 3) p.box.tpm++; if (kind === 'dunk') p.box.dunks++;
        G.lastScorer = p;
        let assist = null;
        if (ball.lastPasser && ball.lastPasser.team === p.team && ball.lastPasser !== p && G.time - ball.passT < 3.5) { ball.lastPasser.box.ast++; assist = ball.lastPasser; }
        p.streak++; players.forEach(q => { if (q.team !== p.team) { q.streak = 0; q.fire = 0; } });
        if (p.streak === 2 && !p.fire) pop(pick(A.lines.heating), '#fb923c');
        if (p.streak >= 3 && !p.fire) { p.fire = 4; G.anyFire = G.anyFire || p === me; pop(pick(A.lines.fire), '#f97316', true); SFX.play('roar'); } else if (p.fire) p.fire--;
        pop(kind === 'dunk' ? pick(A.lines.dunk) : pts === 3 ? pick(A.lines.three) : pick(A.lines.two), p.team === me.team ? '#facc15' : '#f87171', kind === 'dunk');
        SFX.play(kind === 'dunk' ? 'dunk' : 'swish'); SFX.play('net'); SFX.play('crowd', kind === 'dunk' ? 1.6 : 1.1);
        celebrate(p, kind, pts);
        const wins = !SEGM && G.score[p.team] + (foul ? 1 : 0) >= target;
        if (wins) { RD.confetti(180); SFX.play('roar'); if (p.team === me.team) highlight('winner', me, 'GAME!', 420); }
        E.hype = Math.min(1, E.hype + (kind === 'dunk' ? .5 : .25));
        $('ahS' + p.team).textContent = (SEGM ? (p.team ? sc1 : sc0) : 0) + G.score[p.team];
        $('ahS' + p.team).classList.remove('bump'); void $('ahS' + p.team).offsetWidth; $('ahS' + p.team).classList.add('bump');
        logLine(`${p.name} ${kind === 'dunk' ? 'throws it down' : pts === 3 ? 'drills a three' : kind === 'layup' ? 'finishes at the rim' : 'knocks down the jumper'}${assist ? ` (assist: ${assist.name})` : ''}`);
        if (foul) { pop('AND ONE!', '#f472b6', true); SFX.play('whistle'); }
        if (SEGM) { const bz = SEG.untilClock && G.clock <= 0; if (bz) { pop('AT THE BUZZER!!', '#fde047', true); RD.confetti(120); if (p.team === me.team) highlight('winner', me, 'AT THE BUZZER!', 350); } return endSoon({ end: foul ? 'foul' : 'score', foul: foul ? { shots: 1, team: p.team } : null, pts, scorer: p, dunk: kind === 'dunk', buzzer: bz }, 1.1); }
        if (foul) { G.score[p.team] += 1; p.box.pts += 1; $('ahS' + p.team).textContent = G.score[p.team]; }
        if (G.score[0] >= target || G.score[1] >= target) return endSoon({}, 1.2);
        G.paused = 'score'; G.resume = { at: G.time + PACE.afterScore + .35, fn: () => setupHalf(1 - p.team) };   // loser's ball (sim time: waits through hit-stops + close-ups)
      }
      function changePossession(team, why, by) {
        if (SEGM) return endSoon({ end: G.off === 0 ? 'to' : 'stop' }, .9);
        G.off = team; G.clock = PACE.shotClock; G.mustClear = true;
        if (by && by === me) tag('TAKE IT BACK!', me, '#fde68a');
      }
      function endSoon(res, delay) { if (G.pending && !(res.pts && !G.pending.pts)) return; G.pending = res; G.endAt = G.time + delay; }
      const role = q => !q ? null : q === me ? 'me' : q.team === 0 ? 'mate' : 'them';

      /* ---- passing ---- */
      function startPass(from, to) {
        if (ball.owner !== from || !to || !canAct(from) || from.z > 0) return;
        if (from.act && from.act.type === 'move') from.act = null;
        from.act = { type: 'pass', t: 0, T: .26, to };
        from.face = to.x >= from.x ? 1 : -1;
      }
      function throwPass(from, to) {
        let intercept = null;
        const d0 = dist(from, to) || 1;
        const noLook = from.wpn && from.wpn.t > 0 && Weapons.fits(from.wpn.id, 'pass'); if (noLook) { spendWeapon(from, 'pass'); tag(WEAPONS[from.wpn.id].name.toUpperCase(), from, '#fde68a'); }
        players.forEach(d => { if (noLook || d.team === from.team || d.stun > 0 || intercept) return;
          const t = clamp(((d.x - from.x) * (to.x - from.x) + (d.y - from.y) * (to.y - from.y) * 1.69) / (d0 * d0), 0, 1);
          const px_ = from.x + (to.x - from.x) * t, py = from.y + (to.y - from.y) * t;
          if (Math.hypot(d.x - px_, (d.y - py) * 1.3) < 8 && t > .15 && t < .9 && Math.random() * 100 < pctOf('steal', d, from) * .6) intercept = d; });
        ball.owner = null; ball.state = 'pass';
        const T = clamp(d0 / PACE.pass, PACE.passTime[0], PACE.passTime[1]);
        ball.pass = { from, to: intercept || to, t: 0, T, sx: from.x + from.face * 5, sy: from.y, sz: from.z + 18, intercept: !!intercept };
        SFX.play('pass');
      }
      /* ---- steals / shoves ---- */
      function trySteal(p) {
        if (p.stealCD > 0 || !canAct(p) || p.z > 0) return; p.stealCD = .7;
        const h = ball.owner;
        p.act = { type: 'reach', t: 0, T: .32 }; if (h) p.face = h.x >= p.x ? 1 : -1;
        if (!h || h.team === p.team || ball.state !== 'held' || dist(p, h) > 17) return;
        if (p.slide > 0 && p === me) return shove(p, h);
        const busy = h.act && (h.act.type === 'move' || h.act.type === 'shoot');
        if (p !== me) aiWeapon(p, 'steal');
        const pct = pctOf('steal', p, h) * .62 * (busy ? .6 : 1); spendWeapon(p, 'steal');
        if (Math.random() * 100 < pct) {
          h.box.to++; p.box.stl++; pop(pick(A.lines.steal), '#38bdf8'); SFX.play('whoosh'); SFX.play('slap'); E.hype = Math.min(1, E.hype + .25); burst(h.x + h.face * 5, h.y - 12, '#7dd3fc', 8, 40); G.kick = Math.max(G.kick, .03);
          logLine(`${p.name} picks ${h.name}'s pocket!`);
          if (Math.random() < .5) { h.act = null; giveBall(p); changePossession(p.team, 'stl', p); }
          else { h.act = null; looseBall(h.x + p.face * -4, h.y, (p.x - h.x) * 3 + rnd(-20, 20), rnd(-10, 20), 22); ball.stripFrom = h.team; }
        } else { p.stun = .28; }
      }
      function shove(p, h) {
        const ok = Math.random() * 100 < Balance.pct('stop', { perD: p.st.str, speed: p.st.str }, { def: { handle: h.st.str, speed: h.st.str } }).pct;
        if (ok) { knockDown(h, 1.3); looseBall(h.x, h.y, rnd(-40, 40), rnd(10, 40), 20); pop(pick(A.lines.shove), '#f472b6', true); impact(.1, 7, .12); RD.dust(h.x, h.y, 8); RD.sweat(h.x, h.y - 24, 4); SFX.play('dunk'); h.box.to++; logLine(`${p.name} bulldozes ${h.name}!`); }
        else { p.stun = .7; tag('WHIFFED!', p, '#94a3b8'); }
      }
      function knockDown(p, T) { p.act = { type: 'down', t: 0, T }; p.stun = T; p.vx = -p.face * 20; p.vz = 0; }
      function looseBall(x, y, vx, vy, vz = 30) { ball.state = 'loose'; ball.owner = null; ball.shot = null; ball.pass = null; ball.x = x; ball.y = y; ball.vx = vx; ball.vy = vy; ball.vz = vz; ball.z = Math.max(ball.z || 0, 8); ball.stripFrom = null; }
      /* ---- blocks / jumps ---- */
      function tryBlock(p) {
        if (!canAct(p) || p.z > 0) return;
        if (p !== me) aiWeapon(p, 'block');
        const chase = BREAK && p.role === 'trail';
        p.act = { type: 'block', t: 0, chase }; p.vz = PACE.jump(p.st.vert) * 1.05; p.z = .1;
        const sh = ball.owner && ball.owner.team !== p.team ? ball.owner : null; if (sh) p.face = sh.x >= p.x ? 1 : -1;
        const S = ball.shot;   // ball already in the air (early) — swat it
        if (S && ball.state === 'shot' && S.by.team !== p.team && S.t < S.T * .3 && dist(p, S.by) < 18) {
          if (Math.random() * 100 < pctOf('block', p, S.by) * (p === me ? .9 : .5 + aiFor(p).block * .4)) blocked(p, S.by);
        }
      }

      /* ---- DRIBBLE MOVES ---- */
      function doMove(p, ix, iy) {
        if (ball.owner !== p || ball.state !== 'held' || p.z > 0 || p.stun > 0 || (p.act && p.act.type !== 'catch')) return;
        const now = G.time, recent = now - p.lastMove < MV.spamWindow;
        if (p.cool > 0 || p.stamina < 4) {                                  // spamming
          p.spam++; if (p === me) tag('EASY…', p, '#fca5a5');
          if (Math.random() * 100 < MV.lose.spam * p.spam * .8) return loseHandle(p);
          return;
        }
        p.spam = recent ? p.spam + 1 : 0;
        const L = MV.list, has = k => p.moves.includes(k), mag = Math.hypot(ix, iy);
        const def = nearestDef(p), dd = def ? dist(def, p) : 999, inFront = def && dd < MV.range && toHoop(def) < toHoop(p) + 6;
        let id;
        if (mag < .25) id = 'hesi';
        else if (ix * p.face < -.3) { const fam = ['btb', 'btl', 'cross'].filter(has); id = fam.length ? (Math.random() < .6 ? fam[0] : pick(fam)) : 'hesi'; }
        else id = inFront && has('spin') ? 'spin' : (['btl', 'cross'].filter(has)[0] && Math.random() < .5 ? ['btl', 'cross'].filter(has)[0] : 'hesi');
        const mv = L[id], f0 = p.face, flip = ['cross', 'btl', 'btb'].includes(id);
        let dx = ix, dy = iy;
        if (mag < .25) { const h = Math.hypot(A.hoop.x - p.x, A.hoop.y + 20 - p.y) || 1; dx = (A.hoop.x - p.x) / h; dy = (A.hoop.y + 20 - p.y) / h; }
        if (flip && mag < .25) { dx = -f0 * .8; dy = -.6; }
        const l = Math.hypot(dx, dy) || 1;
        p.act = { type: 'move', id, t: 0, T: mv.dur, f0, f1: flip ? -f0 : f0 };
        p.cool = MV.cooldown; p.lastMove = now; p.bdx = dx / l; p.bdy = dy / l; p.burst = mv.dur + MV.burstTime;
        p.stamina = Math.max(0, p.stamina - PACE.stamina.move); if (p === me) G.stamUsed += PACE.stamina.move;
        SFX.play('squeak'); if (p === me) G.speedT = Math.max(G.speedT, .35);
        tag(mv.name, p, p.team === me.team ? '#fde68a' : '#fca5a5');
        // losing the ball: base + spam + low handles + tired
        const loseP = MV.lose.base + MV.lose.spam * p.spam + MV.lose.lowHandle * Math.max(0, 60 - p.st.handle) + MV.lose.tired * (p.stamina < 10 ? 1 : 0);
        if (Math.random() * 100 < loseP) { p.act.fumbleAt = mv.dur * .55; return; }
        // beat / freeze the defender
        if (inFront && def.stun <= 0) {
          const pct = pctOf('move', p, def, { bonus: bonusOf(p, 'move').concat([{ label: mv.name, v: mv.beat }]) });
          if (Math.random() * 100 < pct) {
            const ank = MV.ankleBase + (p.bonusFn && p.isUser && Engine.hasSpecial && Game.state && Engine.hasSpecial(Game.state, 'ankles') ? MV.ankleSpecial : 0) + MV.ankleTier * mv.tier + Math.max(0, p.st.handle - def.st.perD) * .15;
            p.act.beat = { def, ankles: Math.random() * 100 < ank };
          } else p.act.stayed = def;
        }
      }
      function resolveMove(p, a) {   // at the moment the move "hits"
        if (a.beat) {
          const d = a.beat.def;
          if (a.beat.ankles) { d.act = { type: 'sit', t: 0, T: MV.ankles }; d.stun = MV.ankles; pop(pick(A.lines.ankles), '#f472b6', true); G.slowT = .7; G.zoomT = 1; impact(.18, 5, .2, .08, '244,114,182'); RD.dust(d.x, d.y, 12); RD.sweat(d.x, d.y - 22, 6); RD.ring(d.x, d.y, '#f9a8d4', 90, .4, 1, .35); SFX.play('ooh'); SFX.play('crowd', 1.8); RD.cheer(1, true); E.hype = 1; if (p === me) highlight('ankles', p, pick(A.lines.ankles), 380); logLine(`${p.name} breaks ${d.name}'s ankles!`); if (p === me) G.anklesBy = (G.anklesBy || 0) + 1; }
          else { d.act = { type: 'stumble', t: 0, T: MV.freeze }; d.stun = MV.freeze; tag(pick(A.lines.beat), d, '#fde68a'); E.hype = Math.min(1, E.hype + .15); }
        } else if (a.stayed) tag('STAYED WITH IT', a.stayed, '#94a3b8');
      }
      function loseHandle(p) {
        p.act = null; p.box.to++; pop('LOST THE HANDLE!', '#f87171'); SFX.play('bounce');
        looseBall(p.x + p.face * 8, p.y + 2, p.face * rnd(40, 70), rnd(-20, 30), 18); ball.stripFrom = p.team; ball.noGrab = p; ball.noGrabT = G.time + .6; p.spam = 0;
        logLine(`${p.name} loses the handle.`);
      }
      function slide(p, ix, iy) {   // defense: quick lateral burst
        if (p.cool > 0 || !canAct(p) || p.z > 0) return;
        const l = Math.hypot(ix, iy); if (l < .2) return;
        p.cool = MV.cooldown * .6; p.slide = .32; p.bdx = ix / l; p.bdy = iy / l; p.stamina = Math.max(0, p.stamina - PACE.stamina.slide); if (p === me) G.stamUsed += PACE.stamina.slide;
        SFX.play('squeak');
      }

      /* =================================================================
         INPUT
         ================================================================= */
      const keys = {};
      const stick = () => {
        let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + (input.jx || 0);
        let iy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + (input.jy || 0);
        const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } return [ix, iy];
      };
      const kd = e => {
        if (help.classList.contains('on')) return;
        const k = e.code; if (keys[k]) return; keys[k] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) e.preventDefault();
        if ((k === 'KeyJ' || k === 'Space') && !input.shoot) { input.shoot = true; pressShootBtn(); }
        if (k === 'KeyK') pressPassBtn();
        if (k === 'KeyL' || k === 'ShiftLeft' || k === 'ShiftRight') pressMoveBtn();
        if (k === 'KeyE') pressWeaponBtn();
      };
      const ku = e => { keys[e.code] = false; if ((e.code === 'KeyJ' || e.code === 'Space') && input.shoot) { input.shoot = false; releaseShoot(me); } };
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      const live = () => !G.paused && !G.over && !G.pending;
      function pressShootBtn() {
        if (!live()) return;
        if (ball.owner === me) return pressShoot(me);
        const theirBall = (ball.owner && ball.owner.team !== me.team) || (ball.state === 'shot' && ball.shot && ball.shot.by.team !== me.team);
        if (theirBall || ball.state === 'loose') tryBlock(me);
      }
      function pressPassBtn() {
        if (!live()) return;
        if (ball.owner === me) {
          const mates = teamOf(me.team).filter(p => p !== me); if (!mates.length) return;
          const [ix, iy] = stick(); let best = null;
          if (Math.hypot(ix, iy) > .3) { let ba = 9; mates.forEach(m => { const dx = m.x - me.x, dy = (m.y - me.y) * 1.3, l = Math.hypot(dx, dy) || 1, a = Math.acos(clamp((dx * ix + dy * iy) / l, -1, 1)); if (a < ba) { ba = a; best = m; } }); if (ba > 1.2) best = null; }
          if (!best) best = mates.slice().sort((a, b) => openness(b) - openness(a))[0];
          return startPass(me, best);
        }
        if (ball.owner && ball.owner.team === me.team && ball.state === 'held') { tag('HERE!', me, '#fde68a'); return startPass(ball.owner, me); }   // call for it
        if (ball.owner && ball.owner.team !== me.team) return trySteal(me);
        if (ball.state === 'pass' || ball.state === 'loose') me.act = me.act || { type: 'reach', t: 0, T: .3 };
      }
      function pressMoveBtn() {
        if (!live()) return;
        const [ix, iy] = stick();
        if (ball.owner === me) return doMove(me, ix, iy);
        if (G.off !== me.team) return slide(me, ix, iy);
        if (me.cool <= 0 && canAct(me)) { const l = Math.hypot(ix, iy); const dx = l > .2 ? ix / l : (A.hoop.x - me.x) / (toHoop(me) || 1), dy = l > .2 ? iy / l : (A.hoop.y + 20 - me.y) / (toHoop(me) || 1); me.bdx = dx; me.bdy = dy; me.burst = .4; me.cool = MV.cooldown * .7; me.stamina = Math.max(0, me.stamina - PACE.stamina.slide); tag('CUT!', me, '#fde68a'); }
      }
      // touch: joystick + buttons
      const joy = root.querySelector('.arc-joy'), knob = root.querySelector('.arc-knob'); let joyId = null, jc = null;
      joy.addEventListener('pointerdown', e => { joyId = e.pointerId; const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2 }; try { joy.setPointerCapture(e.pointerId); } catch (err) { } moveJoy(e); });
      const moveJoy = e => { if (e.pointerId !== joyId) return; let dx = e.clientX - jc.x, dy = e.clientY - jc.y; const l = Math.hypot(dx, dy), m = Math.min(l, jc.R); if (l > 0) { dx = dx / l * m; dy = dy / l * m; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.jx = dx / jc.R; input.jy = dy / jc.R; };
      joy.addEventListener('pointermove', moveJoy);
      const endJoy = e => { if (e.pointerId !== joyId) return; joyId = null; input.jx = 0; input.jy = 0; knob.style.transform = ''; };
      joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);
      root.querySelectorAll('[data-b]').forEach(b => {
        const k = b.dataset.b;
        b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('down'); if (k === 'move') pressMoveBtn(); if (k === 'wpn') pressWeaponBtn(); if (k === 'pass') pressPassBtn(); if (k === 'shoot' && !input.shoot) { input.shoot = true; pressShootBtn(); } });
        const up = () => { b.classList.remove('down'); if (k === 'shoot' && input.shoot) { input.shoot = false; releaseShoot(me); } };
        b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      });
      root.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'help') { showHelp(); }
        if (a === 'gotit') { help.classList.remove('on'); try { localStorage.setItem('hd_arcade_help2', '1'); } catch (e) { } if (G.started) G.paused = G.wasPaused || false; else begin(); }
        if (a === 'quit' && confirm('Quit this game? It counts as a loss.')) finish({ forfeit: true });
      });
      function showHelp() {
        const L = MV.list, am = MV.arch[me.arch] || {};
        $('arcMoves').innerHTML = '<b>Your moves</b> (Handling ' + Math.round(me.st.handle) + '): ' + Object.keys(L).map(k => me.moves.includes(k) ? `<span class="on">✓ ${L[k].name.toLowerCase()}</span>` : `<span>🔒 ${L[k].name.toLowerCase()} (${L[k].handle + (am[k] || 0) + (am.all || 0)})</span>`).join(' ');
        G.wasPaused = G.paused; G.paused = true; help.classList.add('on');
      }

      /* =================================================================
         AI (your teammates always play at Pro; opponents use the difficulty)
         ================================================================= */
      const aiFor = p => (p.team === me.team ? AIP : AIO);
      function landing() { let x = ball.x, y = ball.y, z = ball.z, vz = ball.vz; for (let i = 0; i < 40 && z > 6; i++) { x += ball.vx * .05; y += ball.vy * .05; vz -= PACE.gravity * .05; z += vz * .05; } return { x: clamp(x, A.court.x0, A.court.x1), y: clamp(y, A.court.y0 + 4, A.court.y1) }; }
      function aiThink(p) {
        const AI = aiFor(p); p.aiT = AI.react * rnd(.7, 1.3) * PACE.aiThink;
        p.stance = G.off !== p.team && ball.state !== 'loose' && ball.state !== 'shot';
        if (ball.state === 'loose') { const l = landing(); p.goal = { x: l.x + rnd(-4, 4), y: l.y + rnd(-3, 3) }; return; }
        if (ball.state === 'shot') {   // crash / box out
          const near = toHoop(p) < 70; p.goal = near || Math.random() < .5 ? { x: A.hoop.x + rnd(-26, 26), y: A.hoop.y + rnd(16, 34) } : p.goal; return; }
        const hasBall = ball.owner === p, off = G.off === p.team;
        if (hasBall) return aiHandler(p, AI);
        if (off) return aiOffBall(p, AI);
        return aiDefend(p, AI);
      }
      function aiHandler(p, AI) {
        if (p.act && busyActs.includes(p.act.type)) return;
        if (p.isStar) AI = Object.assign({}, AI, { shootAt: AI.shootAt - 6, moves: AI.moves + .15 });   // stars hunt their shot
        const dh = toHoop(p), def = nearestDef(p), dd = def ? dist(def, p) : 999;
        const inFront = def && dd < 22 && toHoop(def) < dh;
        if (G.mustClear && !isThree(p)) { const a = Math.atan2(p.y - A.hoop.y, p.x - A.hoop.x); p.goal = { x: A.hoop.x + Math.cos(a) * (A.three.rx + 14), y: A.hoop.y + Math.max(.4, Math.sin(a)) * (A.three.ry + 14) }; return; }
        const mates = teamOf(p.team).filter(q => q !== p), open = mates.filter(q => openness(q) > 24 && !(q.act && busyActs.includes(q.act.type)));
        if (BREAK) {   // attack: pass if cut off, use a move, pull up — always get a shot before the defense sets
          const left = G.clock;
          if (dh < A.layupRange + 2 || left < 2) { p.wantShoot = true; return; }
          if (inFront && dd < 20) {
            if (open.length && Math.random() < .65) { startPass(p, open.sort((a, b) => toHoop(a) - toHoop(b))[0]); return; }
            if (p.cool <= 0 && Math.random() < AI.moves + .3) { doMove(p, p.x < def.x ? -1 : 1, -.6); return; }
            if (dh < 95 || left < 3.5) { p.wantShoot = true; return; }
          }
          p.goal = { x: A.hoop.x + (def && def.x > p.x ? -12 : 12), y: A.hoop.y + 14 }; return;
        }
        const sc = shotChance(p);
        if (dh < A.layupRange || sc.pct >= AI.shootAt + rnd(-5, 5) || (openness(p) > 28 && sc.pct >= AI.shootAt - 8) || G.clock < 2.2) { p.wantShoot = true; return; }
        if (inFront && p.cool <= 0 && Math.random() < AI.moves) { doMove(p, Math.random() < .5 ? -p.face : p.face * .4, rnd(-.6, .2)); return; }
        if (open.length && Math.random() < .3) { aiWeapon(p, 'pass'); startPass(p, open.includes(me) && Math.random() < .5 ? me : pick(open)); return; }
        const laneClear = !def || (toHoop(def) > dh - 4) || Math.abs(def.x - p.x) > 14;
        p.goal = laneClear && Math.random() < .55 ? { x: A.hoop.x + rnd(-12, 12), y: A.hoop.y + 22 } : { x: clamp(p.x + rnd(-44, 44), 40, 344), y: clamp(p.y + rnd(-14, 26), 76, 196) };
      }
      function aiOffBall(p, AI) {
        const h = ball.owner;
        if (BREAK) {
          const lane = p.x < A.hoop.x ? -1 : 1;
          if (h && h.y < 140) p.goal = { x: A.hoop.x + lane * (Math.random() < .5 ? 24 : 70), y: A.hoop.y + (Math.random() < .5 ? 20 : 44) };
          else p.goal = { x: A.hoop.x + lane * 84, y: Math.max(A.hoop.y + 50, (h ? h.y : 120) - 16) };
          return;
        }
        const i = teamOf(p.team).indexOf(p), sp = A.spots[(i + 1 + Math.floor(G.time / 4)) % A.spots.length];
        p.goal = Math.random() < .22 ? { x: A.hoop.x + rnd(-22, 22), y: A.hoop.y + 22 } : { x: sp[0] + rnd(-12, 12), y: sp[1] + rnd(-10, 10) };
      }
      function aiDefend(p, AI) {
        const h = ball.owner;
        p.stance = true;
        if (BREAK) {
          if (!h) return;
          if (p.role === 'back') {   // protect the rim, step up when he gets close
            const dh = toHoop(h);
            if (dh < 46) p.goal = { x: lerp(h.x, A.hoop.x, .3), y: lerp(h.y, A.hoop.y, .3) };
            else { const k = Math.min(.5, 40 / (dh || 1)); p.goal = { x: lerp(A.hoop.x, h.x, k), y: lerp(A.hoop.y + 10, h.y, k) }; }
            if (dist(p, h) < 15 && Math.random() < AI.steal) trySteal(p);
          } else p.goal = { x: h.x + (A.hoop.x - h.x) * .08, y: h.y - 4 };   // trailer: chase from behind
          return;
        }
        const O = teamOf(1 - p.team), man = p.guard && O.includes(p.guard) ? p.guard : O[teamOf(p.team).indexOf(p)] || O[0];
        if (h && h.team !== p.team && h !== man && toHoop(h) < 54 && Math.random() < AI.help) { p.goal = { x: lerp(h.x, A.hoop.x, .45), y: lerp(h.y, A.hoop.y, .45) + 4 }; return; }
        const k = h === man ? 11 : 20, d = Math.max(1, toHoop(man));
        p.goal = { x: man.x + (A.hoop.x - man.x) / d * k, y: man.y + (A.hoop.y - man.y) / d * k };
        if (h === man && dist(p, man) < 14 && Math.random() < AI.steal * .55) trySteal(p);
        else if (h === man && dist(p, man) < 13 && Math.random() < .015 && !BREAK) shoveAI(p, man);
      }
      function shoveAI(p, h) { if (canAct(p)) { p.act = { type: 'reach', t: 0, T: .3 }; shove(p, h); } }

      /* =================================================================
         UPDATE
         ================================================================= */
      function update(dt) {
        G.time += dt;
        if (G.paused === true || G.over) return;
        if (G.resume && G.time >= G.resume.at) { const f = G.resume.fn; G.resume = null; f(); G.paused = false; }
        const frozen = typeof G.paused === 'string';     // after a basket / whistle: animations continue, play doesn't
        if (G.pending && G.time >= G.endAt) return finish(G.pending);
        // clocks
        const shooting = ball.owner && ball.owner.act && ['shoot', 'layup', 'dunk'].includes(ball.owner.act.type);
        const inPlay = (ball.state === 'held' && !shooting) || ball.state === 'pass';
        if (!G.pending && !frozen && inPlay && G.off >= 0) {
          G.clock -= dt;
          if (G.clock <= 0) {
            if (SEGM) {
              SFX.play(SEG.untilClock ? 'buzzer' : 'whistle');
              if (SEG.untilClock) { pop('BUZZER!', '#f87171', true); logLine('Time runs out.'); return endSoon({ end: 'buzzer' }, .7); }
              if (G.off === 1) { pop('SHOT CLOCK!', '#4ade80', true); if (ball.owner) ball.owner.box.to++; logLine('Shot-clock violation — stop!'); return endSoon({ end: 'stop' }, .7); }
              pop('DEFENSE IS SET', '#93c5fd', true); logLine('The defense gets back and sets up.'); return endSoon({ end: 'set' }, .7);
            }
            pop('SHOT CLOCK!', '#f87171'); SFX.play('buzzer'); if (ball.owner) ball.owner.box.to++;
            G.paused = 'sc'; setTimeout(() => { if (!G.over) { setupHalf(1 - G.off); G.paused = false; } }, 900); return;
          }
        }
        if (G.mustClear && ball.owner && ball.state === 'held' && isThree(ball.owner)) { G.mustClear = false; if (ball.owner === me) tag('CLEARED', me, '#86efac'); }
        const [six, siy] = stick();
        players.forEach(p => {
          p.stealCD = Math.max(0, p.stealCD - dt); p.cool = Math.max(0, p.cool - dt); p.burst = Math.max(0, p.burst - dt); p.slide = Math.max(0, p.slide - dt);
          if (p.wpn) { p.wpn.t -= dt; if (p.wpn.t <= 0) p.wpn = null; }
          if (p.stun > 0) p.stun = Math.max(0, p.stun - dt);
          if (G.time - p.lastMove > MV.spamWindow) p.spam = 0;
          let ix = 0, iy = 0;
          const ctrl = p === me;
          p.sweaty = p.stamina < 45;
          if (!p.act && p.celebNext && p.z <= 0 && p.stun <= 0) { p.act = { type: p.celebNext, t: 0, T: p.celebNext === 'hang' ? 1.3 : 1.1, hop: true }; p.celebNext = null; }
          if (p.bumpTo) {   // teammates run in for a chest bump
            const q = p.bumpTo, dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy * 1.3);
            if (l < 11 || !(p.act && p.act.type === 'joy') && p.act) { if (l < 11 && q.z <= 0) { p.face = dx >= 0 ? 1 : -1; q.face = -p.face; p.act = { type: 'chestbump', t: 0, T: .55 }; q.act = { type: 'chestbump', t: 0, T: .55 }; q.celebNext = null; SFX.play('slap'); burst((p.x + q.x) / 2, Math.min(p.y, q.y) - 26, '#ffffff', 8, 40); RD.cheer(.9); } p.bumpTo = null; }
            else { ix = dx / l; iy = dy / l; }
          }
          else if (frozen) { /* stand still */ }
          else if (ctrl) { ix = six; iy = siy; p.stance = G.off !== p.team; }
          else {
            p.aiT -= dt; if (p.aiT <= 0) aiThink(p);
            if (p.wantShoot) { p.wantShoot = false; pressShoot(p); }
            if (p.goal) { const dx = p.goal.x - p.x, dy = p.goal.y - p.y, l = Math.hypot(dx, dy); if (l > 3) { ix = dx / l; iy = dy / l; if (l < 12) { ix *= l / 12; iy *= l / 12; } } }
            // defenders jump at shooters
            const s = players.find(q => q.team !== p.team && q.act && ['shoot', 'layup', 'dunk'].includes(q.act.type) && !q.act.released);
            if (s && p.z === 0 && canAct(p) && dist(p, s) < 18 && !p.blockTry) { p.blockTry = s.act; if (Math.random() < aiFor(p).block * (p.role === 'trail' ? 1.3 : 1)) { const delay = s.act.type === 'shoot' ? Math.max(0, PACE.gather - s.act.t) + .05 : .08; setTimeout(() => !G.over && tryBlock(p), delay * 1000 / PACE.game); } }
            if (!s) p.blockTry = null;
          }
          if (p.act) tickAct(p, dt);
          // movement
          const a = p.act, locked = p.stun > 0 || (a && ['shoot', 'pass', 'down', 'sit', 'stumble', 'hang', 'flex', 'point', 'thump', 'clap', 'chestbump'].includes(a.type)) || (a && a.type === 'dunk') || (a && a.type === 'layup' && a.t > .2);
          let l = Math.hypot(ix, iy);
          if (p.burst > 0 && ball.owner === p && a && a.type === 'move' && a.t < a.T * .45) { ix *= .15; iy *= .15; l *= .15; }      // the move itself is slow — the burst comes after
          else if (p.burst > 0 || p.slide > 0) { if (l < .3) { ix = p.bdx; iy = p.bdy; l = 1; } }
          const hasBall = ball.owner === p && ball.state === 'held';
          const fat = .82 + .18 * p.stamina / 100;
          let sp = PACE.run(p.st.speed) * fat * (hasBall ? PACE.withBall : 1) * (p.burst > 0 && !(a && a.type === 'move' && a.t < a.T * .45) ? CF().moves.burst : 1) * (p.slide > 0 ? 1.45 : 1) * (BREAK && p.role === 'trail' ? 1.12 : 1) * (p.z > 0 ? .55 : 1);
          if (locked) sp = 0;
          if (a && a.type === 'layup' && a.t <= .2) sp *= .7;
          const k = Math.min(1, dt * PACE.accel * (p.burst > 0 || p.slide > 0 ? 2 : 1));
          if (p.z <= 0 || p.act && p.act.type === 'layup') { p.vx += (ix * sp - p.vx) * k; p.vy += (iy * sp * .78 - p.vy) * k; }
          if (a && a.type === 'down') { p.vx *= Math.pow(.05, dt); p.vy *= Math.pow(.05, dt); }
          if (!(a && a.type === 'dunk' && a.t > .22)) { p.x = clamp(p.x + p.vx * dt, A.court.x0, A.court.x1); p.y = clamp(p.y + p.vy * dt, A.court.y0 + 8, A.court.y1); }
          const spd = Math.hypot(p.vx, p.vy);
          p.phase += spd * dt * .21;
          if (hasBall) { const per = spd > 12 ? PACE.dribble.run : PACE.dribble.stand, prev = p.dribT % 1; p.dribT += dt / per; if (prev < .5 && p.dribT % 1 >= .5 && (!a || a.type !== 'move')) SFX.play('bounce', p === me ? 1 : .3); }
          // sneaker squeak + dust on hard cuts
          const hd = Math.atan2(p.vy, p.vx);
          if (spd > 34 && p.z <= 0 && p._hd != null && G.time - (p._sqk || 0) > .3) { let dh = Math.abs(hd - p._hd); if (dh > Math.PI) dh = Math.PI * 2 - dh; if (dh > .9) { p._sqk = G.time; SFX.play('squeak', p === me ? 1 : .45); RD.dust(p.x, p.y, 3); } }
          if (spd > 20) p._hd = hd;
          // facing
          if (!(a && ['move', 'shoot', 'layup', 'dunk', 'pass', 'down', 'sit'].includes(a.type))) {
            if (Math.abs(p.vx) > 7 && !(p.stance && !hasBall && ball.owner)) p.face = Math.sign(p.vx);
            else if (p.stance && ball.owner && ball.owner !== p) p.face = ball.owner.x >= p.x ? 1 : -1;
          }
          // stamina
          if (p.burst <= 0 && p.slide <= 0) p.stamina = Math.min(100, p.stamina + PACE.stamina.regen * (1 + (p.st.stam - 50) / 100) * dt);
          // jumping
          if (p.z > 0 || p.vz > 0) {
            if (!(a && a.type === 'dunk')) { p.z += p.vz * dt; p.vz -= PACE.gravity * dt; }
            if (p.z <= 0) { p.z = 0; p.vz = 0; if (a && (['block', 'reb', 'jump', 'celebrate'].includes(a.type) || (['shoot', 'layup'].includes(a.type) && a.released))) p.act = p.stun > 0 ? null : { type: 'land', t: 0, T: .17 }; }
          }
        });
        // separation: players don't stack on top of each other
        for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) {
          const p = players[i], q = players[j], dx = q.x - p.x, dy = (q.y - p.y) * 1.3, d = Math.hypot(dx, dy);
          if (d < 7 && d > 0) { const push = (7 - d) * .5; q.x += dx / d * push; q.y += dy / d * push / 1.3; p.x -= dx / d * push; p.y -= dy / d * push / 1.3; }
        }
        updateBall(dt);
      }

      /* ---- per-action timelines ---- */
      function tickAct(p, dt) {
        const a = p.act; a.t += dt;
        switch (a.type) {
          case 'shoot': {
            if (!a.air && a.t >= PACE.gather) { a.air = true; p.vz = PACE.jump(p.st.vert); p.z = .1; a.apex = PACE.gather + p.vz / PACE.gravity; if (a.aiRel != null) a.aiRel = a.apex + a.aiRel; }
            if (a.air && !a.released && ball.owner === p) {
              const rel = a.aiRel != null ? a.t >= a.aiRel : (a.wantRelease || a.t > a.apex + .55 || (p.z <= .5 && a.t > PACE.gather + .1));
              if (rel) { a.released = true; const stat = a.sc.three ? p.st.three : p.st.mid; launch(p, a.sc, releaseQuality(p, Math.abs(a.t - a.apex), stat)); }
            }
            if (ball.owner !== p && !a.released) p.act = null;   // stripped / blocked
            break;
          }
          case 'layup': {
            const H = A.hoop;
            if (a.t > .18 && !a.jumped) { a.jumped = true; p.vz = PACE.jump(p.st.vert) * .8; p.z = .1; a.apex = .18 + p.vz / PACE.gravity; }
            if (a.t > .18) { p.vx = (H.x - p.x) * 2.2; p.vy = (H.y + 10 - p.y) * 2.2; }
            const relAt = a.apex ? Math.min(a.apex, .5) : .5;
            if (!a.released && ball.owner === p && a.t >= relAt) {
              a.released = true;
              const blk = blockCheck(p, 'layup'); p.box.fga++; G.lastShooter = p;
              if (blk) return blocked(blk, p);
              const q = p === me ? (a.relT != null ? releaseQuality(p, Math.abs(a.relT - relAt), p.st.finish, 1.6) : .5) : clamp(aiFor(p).shotQ + rnd(-.2, .2), 0, 1);
              const made = Math.random() * 100 < Balance.apply('layup', a.sc.pct, q);
              ball.owner = null; ball.state = 'shot';
              const from = { x: p.x + p.face * 3, y: p.y, z: p.z + 34 };
              ball.shot = { by: p, from, to: { x: H.x, y: H.y, z: H.z + 1 }, t: 0, T: .34, made, res: made ? (Math.random() < .5 ? 'rimin' : 'swish') : 'rimout', three: false, action: 'layup', peak: 6, foul: a.foul };
              Object.assign(ball, from);
            }
            if (a.wantRelease && a.relT == null) a.relT = a.t;
            break;
          }
          case 'dunk': {
            const H = A.hoop, k = a.t / a.T;
            if (a.wantRelease && a.relT == null) a.relT = a.t;
            if (a.t < .22) { p.vx = (H.x - p.x) * 1.5; p.vy = (H.y + 8 - p.y) * 1.5; p.x += p.vx * dt; p.y += p.vy * dt; }
            else if (a.t < .64) {
              if (!a.rise) { a.rise = { x: p.x, y: p.y }; if (a.big) { G.slowT = .9; G.zoomT = 1; } }
              const u = (a.t - .22) / .42, e = 1 - Math.pow(1 - u, 2);
              p.x = lerp(a.rise.x, H.x - p.face * 4, e); p.y = lerp(a.rise.y, H.y + 3, e); p.z = Math.sin(u * Math.PI * .5) * (H.z - 10);
              if (!a.chk && u > .4) { a.chk = true; const blk = blockCheck(p, 'dunk'); if (blk) { p.box.fga++; G.lastShooter = p; a.stuffed = true; blocked(blk, p); p.act = { type: 'jump', t: 0 }; p.vz = 0; return; } }
            } else if (!a.slammed) {
              a.slammed = true; p.box.fga++; G.lastShooter = p;
              const q = p === me ? (a.relT != null ? releaseQuality(p, Math.abs(a.relT - .6), p.st.dunk, 2) : .55) : clamp(aiFor(p).shotQ + .1 + rnd(-.15, .15), 0, 1);
              a.made = Math.random() * 100 < Balance.apply('dunk', a.sc.pct, q);
              G.slowT = 0; impact(a.big ? .2 : .14, a.big ? 11 : 8, .35, a.big ? .1 : .06); E.rim = 1; E.net.swish = 1; RD.sweat(p.x, p.y - p.z - 26, 6);
              if (a.made) {
                const shatter = p.st.dunk >= 75 && Math.random() < .04;
                if (shatter) { E.shatter = true; G.flash = 1; G.shake = 16; for (let i = 0; i < 70; i++) E.glass.push({ x: H.x + rnd(-20, 20), y: H.y - H.z - rnd(0, 20), vx: rnd(-90, 90), vy: rnd(-60, 40), life: rnd(1, 2.2) }); pop(pick(A.lines.shatter), '#e0f2fe', true); SFX.play('roar'); }
                burst(H.x, H.y - H.z, '#facc15', 30); RD.ring(H.x, H.y - H.z + 2, '#fde68a', 170, .4); RD.cheer(1, true); if (shatter) G.stop = .32;
                const vic = players.find(q2 => q2.team !== p.team && q2.stun <= 0 && toHoop(q2) < 22 && q2.z === 0);
                if (vic && a.poster) { knockDown(vic, 1.5); pop('POSTERIZED!', '#f472b6', true); RD.dust(vic.x, vic.y, 10); SFX.play('ooh'); logLine(`${p.name} posterizes ${vic.name}!`); }
                if (p === me && (a.big || a.poster || shatter)) highlight('dunk', p, shatter ? 'SHATTERED!' : a.poster ? 'POSTERIZED!' : pick(A.lines.dunk), 230);
                ball.owner = null; ball.state = 'net'; ball.x = H.x; ball.y = H.y; ball.z = H.z; ball.vz = -40; ball.netT = 0;
                scoreBasket(p, 2, 'dunk', a.foul);
              } else {
                pop('RIMMED OUT!', '#f87171'); SFX.play('rim'); looseBall(H.x, H.y + 4, rnd(-80, 80), rnd(30, 70), 60); ball.z = H.z;
                p.streak = 0; if (p.fire) p.fire--;
                if (a.foul) foulMiss(p);
              }
            } else if (a.t < .9 && a.made) { p.x = H.x - p.face * 3; p.y = H.y + 3; p.z = H.z - 12; }      // hang on the rim
            else { p.act = { type: 'jump', t: 0 }; p.vz = 0; p.z = Math.max(p.z, 1); }
            break;
          }
          case 'pass': if (!a.thrown && a.t >= .1) { a.thrown = true; throwPass(p, a.to); } if (a.t >= a.T) p.act = null; break;
          case 'move': {
            if (a.f0 !== a.f1 && a.t >= a.T * .5) p.face = a.f1;
            if (a.id === 'spin') p.face = Math.floor(a.t / a.T * 4) % 2 ? -a.f0 : a.f0;
            if (a.fumbleAt != null && a.t >= a.fumbleAt) return loseHandle(p);
            if (!a.hit && a.t >= a.T * .45) { a.hit = true; resolveMove(p, a); }
            if (a.t >= a.T) { p.face = a.id === 'spin' ? a.f0 : a.f1; p.act = null; }
            break;
          }
          case 'catch': case 'reach': case 'stumble': case 'celebrate': case 'land': case 'flex': case 'point': case 'thump': case 'joy': case 'clap': case 'hang': case 'chestbump': if (a.t >= (a.T || .3)) p.act = null; break;
          case 'down': case 'sit': if (a.t >= a.T) p.act = null; break;
          case 'block': case 'reb': case 'jump': if (a.t > 2) p.act = null; break;
        }
      }
      function foulMiss(p) {   // fouled on a missed layup / dunk
        pop('FOUL!', '#f472b6', true); SFX.play('whistle');
        if (SEGM) return endSoon({ end: 'foul', foul: { shots: 2, team: p.team }, pts: 0, fouled: p }, 1);
        logLine(`${p.name} is fouled — ball back.`);
        G.paused = 'foul'; setTimeout(() => { if (!G.over) { setupHalf(p.team); G.paused = false; } }, 1000);
      }

      /* ---- ball ---- */
      function updateBall(dt) {
        ball.spin += dt * (ball.state === 'shot' ? 14 : ball.state === 'loose' ? 9 : 0);
        if (ball.state === 'held' && ball.owner) { const o = ball.owner; ball.x = o.x + o.face * 5; ball.y = o.y + 1; ball.z = o.z + 10; }
        else if (ball.state === 'pass' && ball.pass) {
          const P = ball.pass; P.t += dt; const k = clamp(P.t / P.T, 0, 1);
          ball.x = lerp(P.sx, P.to.x, k); ball.y = lerp(P.sy, P.to.y, k); ball.z = lerp(P.sz, P.to.z + 18, k) + Math.sin(k * Math.PI) * 6;
          if (k >= 1) {
            const rc = P.to; giveBall(rc); ball.lastPasser = P.intercept ? null : P.from; ball.passT = G.time; ball.pass = null;
            if (canAct(rc) && rc.z === 0) rc.act = { type: 'catch', t: 0, T: .2 };
            if (P.intercept) { P.from.box.to++; rc.box.stl++; pop(pick(A.lines.steal), '#38bdf8'); logLine(`${rc.name} jumps the passing lane!`); changePossession(rc.team, 'stl', rc); }
          }
        } else if (ball.state === 'shot' && ball.shot) {
          const S = ball.shot; S.t += dt; const k = clamp(S.t / S.T, 0, 1);
          ball.x = lerp(S.from.x, S.to.x, k); ball.y = lerp(S.from.y, S.to.y, k); ball.z = lerp(S.from.z, S.to.z, k) + S.peak * 4 * k * (1 - k);
          if (k >= 1) arrive(S);
        } else if (ball.state === 'roll') {   // rolling around the rim
          const R = ball.roll; R.t += dt; const u = R.t / R.T, H = A.hoop;
          ball.x = H.x + Math.sin(R.t * 14) * 4 * (1 - u); ball.y = H.y + Math.cos(R.t * 14) * 1.5 * (1 - u); ball.z = H.z + 1 + Math.abs(Math.sin(R.t * 9)) * 5 * (1 - u);
          if (u >= 1) { if (R.made) { ball.state = 'net'; ball.netT = 0; E.net.swish = .7; scoreBasket(R.by, R.three ? 3 : 2, R.action === 'layup' ? 'layup' : 'shot', R.foul); } else { SFX.play('rim'); E.rim = .5; looseBall(H.x, H.y + 2, rnd(-70, 70), rnd(20, 70), 50); ball.z = H.z + 2; } }
          else if (Math.floor(R.t * 9 / Math.PI) !== Math.floor((R.t - dt) * 9 / Math.PI)) { SFX.play('rim'); E.rim = .3; }
        } else if (ball.state === 'net') {     // dropping through the net
          ball.netT += dt; ball.x = A.hoop.x; ball.y = A.hoop.y; ball.z = A.hoop.z - ball.netT * 60;
          if (ball.z <= 1) { ball.state = 'dead'; ball.z = 0; ball.vx = rnd(-20, 20); ball.vy = rnd(10, 30); ball.vz = 40; }
        } else if (ball.state === 'dead' || ball.state === 'loose') {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vx *= Math.pow(.45, dt); ball.vy *= Math.pow(.45, dt);
          ball.z += ball.vz * dt; ball.vz -= PACE.gravity * dt;
          if (ball.z <= 0) { ball.z = 0; ball.vz = Math.abs(ball.vz) * .55; if (ball.vz > 14) { if (ball.state === 'loose') SFX.play('bounce'); } else ball.vz = 0; }
          ball.x = clamp(ball.x, A.court.x0, A.court.x1); ball.y = clamp(ball.y, A.court.y0 + 4, A.court.y1);
          if (ball.state === 'loose' && ball.z < 26 && !G.pending) rebound();
        }
      }
      function arrive(S) {
        const H = A.hoop, p = S.by;
        if (S.made && S.res === 'swish') { ball.state = 'net'; ball.netT = 0; E.net.swish = 1; return scoreBasket(p, S.three ? 3 : 2, S.action === 'layup' ? 'layup' : 'shot', S.foul); }
        if (S.made) { ball.state = 'roll'; ball.roll = { t: 0, T: .55, made: true, by: p, three: S.three, action: S.action, foul: S.foul }; SFX.play('rim'); E.rim = .4; return; }
        p.streak = 0; if (p.fire) p.fire--;
        if (S.res === 'airball') { pop('AIRBALL!', '#94a3b8'); SFX.play('groan'); looseBall(ball.x, ball.y, (S.to.x - S.from.x) * .3, 30, -10); ball.z = S.to.z; logLine(`${p.name} airballs it.`); }
        else if (Math.random() < .25 && S.res === 'rimout') { ball.state = 'roll'; ball.roll = { t: 0, T: .5, made: false, by: p }; SFX.play('rim'); }
        else { SFX.play('rim'); E.rim = .7; E.net.sway = 1; looseBall(H.x, H.y + (S.res === 'back' ? -1 : 3), rnd(-75, 75), S.res === 'back' ? rnd(30, 80) : rnd(25, 70), 55); ball.z = H.z + 2; }
        if (S.foul) foulMiss(p);
        if (S.res !== 'airball') logLine(`${p.name} misses${S.three ? ' from three' : ''}.`);
      }
      function rebound() {
        const near = players.filter(p => dist(p, ball) < 13 && p.stun <= 0 && !(p.act && busyActs.includes(p.act.type)) && !(ball.noGrab === p && G.time < ball.noGrabT));
        if (!near.length) return;
        const w = near.map(p => Math.max(5, Balance.pct('rebound', p.st, { def: Balance.profile(50) }).pct) * (p.team === ball.stripFrom ? .6 : 1));
        let r = Math.random() * w.reduce((a, b) => a + b, 0), got = near[0]; for (let i = 0; i < near.length; i++) { r -= w[i]; if (r <= 0) { got = near[i]; break; } }
        near.forEach(p => { if (ball.z > 8 && p.z === 0 && canAct(p)) { p.act = { type: 'reb', t: 0 }; p.vz = PACE.jump(p.st.vert) * .7; p.z = .1; } });
        const fromShot = ball.stripFrom == null;
        if (G.off < 0) {   // loose-ball scramble won
          giveBall(got); ball.lastPasser = null; G.off = got.team; G.clock = SEG.clock;
          tag(got.team === me.team ? 'OURS!' : 'THEIRS!', got, got.team === me.team ? '#4ade80' : '#f87171'); SFX.play('whoosh'); E.hype = Math.min(1, E.hype + .3);
          logLine(`${got.name} comes up with the loose ball.`); if (got.team === me.team) got.box.stl += got === me ? 1 : 0;
          return;
        }
        giveBall(got); if (fromShot) got.box.reb++; ball.lastPasser = null;
        if (fromShot) logLine(`${got.name} grabs the ${got.team === G.off ? 'offensive ' : ''}rebound.`);
        if (got.team !== G.off) {
          if (SEGM) return endSoon({ end: G.off === 0 ? (fromShot ? 'miss' : 'to') : 'stop' }, .8);
          changePossession(got.team, 'reb', got);
        } else {
          if (SEGM) {
            if (SEG.setup === 'putback' && !G.pbGrab) { G.pbGrab = true; G.clock = SEG.clock; tag('PUT IT BACK!', got, '#fde68a'); return; }
            if (SEG.untilClock && G.clock > 0) return;
            return endSoon({ end: 'oreb' }, .8);
          }
          G.clock = Math.max(G.clock, 7);
        }
      }

      /* =================================================================
         RENDER (shared 16-bit renderer: js/pixel.js)
         ================================================================= */
      function drawP(p) {
        const K = RD.player(p, { me: p === me, mate: p.team === me.team && p !== me, fire: p.fire > 0 });
        if (p.wpn && p.wpn.t > 0) { const col = p.team === me.team ? '#facc15' : '#ef4444'; for (let k = 0; k < 2; k++) E.fx.push({ x: p.x + rnd(-6, 6), y: p.y - p.z - rnd(0, 30), vx: rnd(-10, 10), vy: -rnd(20, 50), life: .35, col: k ? col : '#ffffff', sz: 2, g: -.4 }); }
        if (ball.owner === me && p.team === me.team && p !== me && ball.state === 'held' && openness(p) > 24 && !G.pending) {   // OPEN indicator over teammates calling for the ball
          const y = Math.round(K.head[1] - 13 + Math.sin(G.real * 8) * 1.5), x = Math.round(K.head[0]);
          RD.text('OPEN', x, y - 6, '#86efac', 1, 'center', '#0a0a12'); RD.px(x - 2, y, 5, 1, '#86efac'); RD.px(x - 1, y + 1, 3, 1, '#86efac'); RD.px(x, y + 2, 1, 1, '#86efac');
          if (G.real - (p.callT || 0) > 2.4 && Math.random() < .02) { p.callT = G.real; tag(pick(['HERE!', 'I\'M OPEN!', 'BALL!']), p, '#86efac'); SFX.play('blip', { f: 240 + p.i * 40, w: 'square', g: .03 }); }
        }
        if (p === me && p.act && p.act.type === 'shoot' && !p.act.released) {   // shot meter over your head
          const a = p.act, apex = a.apex || (PACE.gather + PACE.jump(p.st.vert) / PACE.gravity), kk = clamp(a.t / (apex * 2), 0, 1);
          const stat = a.sc.three ? p.st.three : p.st.mid, win = (.05 + Balance.eff(stat) / 99 * .09) * WINDOW, gh = Math.max(2, Math.round(win * 2 / (apex * 2) * 22));
          const bx = Math.round(p.x) + 9, by = Math.round(K.head[1]) - 10;
          RD.px(bx - 1, by - 1, 5, 24, '#0a0a12'); RD.px(bx, by, 3, 22, '#1e293b'); RD.px(bx, by + 11 - gh / 2, 3, gh, '#22c55e'); RD.px(bx - 1, by + 21 - Math.round(kk * 21), 5, 1, '#fff');
        }
      }
      function render(rdt, vdt) {
        E.t = G.vt;
        if (VW < A.W) { const tgt = ball.owner ? ball.owner.x : ball.x; G.cam += (clamp(tgt - VW / 2, 0, A.W - VW) - G.cam) * Math.min(1, rdt * 3); }
        const cam = Math.round(G.cam);
        c.setTransform(1, 0, 0, 1, 0, 0);
        // camera focus follows the action (ball / dunker); zoom = big-moment push-in + impact punch-in
        const act = players.find(p => p.act && p.act.type === 'dunk') || (ball.owner) || null, tx = act ? act.x : ball.x, ty = act ? act.y - act.z - 14 : ball.y - ball.z;
        G.zf.x += (tx - G.zf.x) * Math.min(1, rdt * 5); G.zf.y += (clamp(ty, 30, A.H - 40) - G.zf.y) * Math.min(1, rdt * 5);
        const z = G.zoom + G.kick;
        if (z > 1.001) { const fx_ = clamp(G.zf.x - cam, 0, VW), fy = G.zf.y; c.setTransform(z, 0, 0, z, fx_ * (1 - z), fy * (1 - z)); }
        if (G.shake > .3) c.translate(Math.round(rnd(-1, 1) * G.shake), Math.round(rnd(-1, 1) * G.shake));
        c.translate(-cam, 0);
        c.drawImage(VEN.bg, 0, 0);
        RD.crowd(); RD.hoop(false);
        players.forEach(p => { p.hasBall = ball.owner === p && ball.state === 'held'; });
        if (VEN.def.reflect) players.forEach(p => RD.reflection(p));
        const items = players.map(p => ({ y: p.y, d: () => drawP(p) }));
        if (ball.state !== 'held') items.push({ y: ball.y + .5, d: () => RD.freeBall(ball, !!(ball.shot && ball.shot.by && ball.shot.by.fire > 0)) });
        items.sort((a, b) => a.y - b.y).forEach(i => i.d());
        const dunker = players.find(p => p.act && p.act.type === 'dunk' && p.act.t > .5 && p.act.t < .95);
        RD.hoop(true);
        if (dunker) drawP(dunker);   // hanging on the rim, in front of it
        RD.fx(vdt);
        if (G.speedT > 0) { c.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 18; i++) { const x = (i * 53 + G.real * 900) % A.W, y = (i * 37 + G.real * 620) % A.H; c.fillRect(Math.round(x), Math.round(y), 1, 10 + (i % 3) * 8); } }
        RD.weather(vdt); RD.lights();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(VEN.vg, cam, 0, VW, A.H, 0, 0, VW, A.H);
        if (G.flash > .05) { c.fillStyle = `rgba(${G.flashCol},${Math.min(.85, G.flash)})`; c.fillRect(0, 0, VW, A.H); }
        if (G.slowT > 0 && G.zoomT) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, VW, 12); c.fillRect(0, A.H - 12, VW, 12); }   // letterbox during slow motion
        // HUD values (HTML)
        $('abStam').style.width = me.stamina + '%'; $('abStam').classList.toggle('low', me.stamina < 25);
        const mv = $('abMove'), ready = me.cool <= 0; mv.classList.toggle('cd', !ready); mv.querySelector('b').textContent = ready ? (ball.owner === me ? 'READY' : G.off === me.team ? 'CUT' : 'SLIDE') : '…';
        const wb = $('abWpn'), wr = wReady(me), wa = me.wpn && me.wpn.t > 0; wb.classList.toggle('cd', !wr && !wa); wb.classList.toggle('on', wa); wb.querySelector('b').textContent = !me.weapons.length ? '—' : wa ? WEAPONS[me.wpn.id].name.toUpperCase() : wr ? 'READY' : 'USED'; $('tbWpn').classList.toggle('ready', wr); $('tbWpn').classList.toggle('on', wa);
        const tb = $('tbMove'); tb.style.setProperty('--cd', ready ? 0 : me.cool / CF().moves.cooldown); const ctxt = ball.owner === me ? ['MOVE', 'DRIBBLE'] : G.off === me.team ? ['CUT', 'OFF BALL'] : ['SLIDE', 'DEFENSE']; if (tb.firstChild.textContent !== ctxt[0]) { tb.firstChild.textContent = ctxt[0]; tb.querySelector('small').textContent = ctxt[1]; }
        const clk = $('ahClock'); clk.textContent = G.pending ? '' : SEGM ? (G.off < 0 ? 'LOOSE BALL' : `${SEG.clockLabel || 'CLOCK'} ${Math.max(0, G.clock).toFixed(1)}`) : `TO ${target} · ${Math.max(0, Math.ceil(G.clock))}`; clk.classList.toggle('low', G.clock < 3);
      }

      /* =================================================================
         LOOP @ 60fps fixed step (pace + slow motion scale the sim time)
         ================================================================= */
      let last = performance.now(), acc = 0, raf = 0;
      const loop = now => {
        if (G.over) return;
        const rdt = Math.min(.05, (now - last) / 1000); last = now; G.real += rdt;
        // hit-stop: freeze the sim and the visuals for a few frames on big impacts
        const stopped = G.stop > 0; if (stopped) G.stop = Math.max(0, G.stop - rdt);
        const vdt = stopped ? 0 : rdt * (G.slowT > 0 ? Math.max(.45, PACE.slowmo) : 1); G.vt += vdt;
        if (!stopped) { G.slowT = Math.max(0, G.slowT - rdt); G.speedT = Math.max(0, G.speedT - rdt); }
        const zt = G.slowT > 0 && G.zoomT ? (G.winShot ? 1.3 : 1.22) : 1; G.zoom += (zt - G.zoom) * Math.min(1, rdt * 6); if (G.slowT <= 0) G.zoomT = 0;
        G.shake *= Math.pow(.02, rdt); G.flash *= Math.pow(.02, rdt); G.kick *= Math.pow(.004, rdt);
        if (!stopped) acc += rdt * PACE.game * (G.slowT > 0 ? PACE.slowmo : 1);
        let n = 0; while (acc >= 1 / 60 && n < 8) { update(1 / 60); acc -= 1 / 60; n++; }
        render(rdt, vdt); raf = requestAnimationFrame(loop);
      };
      const amb = setInterval(() => { if (!G.paused && !G.over) Pixel.ambient ? Pixel.ambient(VEN, E.hype) : SFX.play('crowd', .4 + E.hype * .5); }, 4200);

      async function begin() {
        G.started = true;
        if (SEGM) {
          SFX.play('whoosh'); SFX.play('crowd', 1.4); if (SEG.kind === 'final') { SFX.music('clutch'); SFX.play('heartbeat'); }
          trans.querySelector('b').textContent = cfg.title || 'FAST BREAK!'; trans.className = 'arc-trans in';
          await sleep(650); trans.className = 'arc-trans out'; G.paused = false; G.fbStart = G.time;
          setTimeout(() => { trans.className = 'arc-trans'; }, 500);
          return;
        }
        intro.className = 'arc-intro on'; intro.innerHTML = `<b>${esc(cfg.title || 'STREETBALL')}</b><small>${esc(T0.name)} vs ${esc(T1.name)} · ${esc(cfg.sub || 'first to ' + target)}</small>`;
        SFX.music('game'); SFX.play('whoosh'); await sleep(1300);
        for (const n of ['3', '2', '1']) { intro.innerHTML = `<b class="cd">${n}</b>`; SFX.play('tick'); await sleep(560); }
        intro.innerHTML = '<b class="cd">BALL!</b>'; SFX.play('whistle'); await sleep(450); intro.className = 'arc-intro';
        G.paused = false;
      }
      function finish(extra = {}) {
        if (G.over) return; G.over = true;
        clearInterval(amb); removeEventListener('keydown', kd); removeEventListener('keyup', ku);
        let res, banner, sub = '';
        if (SEGM) {
          const scorer = extra.scorer || null;
          res = { kind: SEG.kind, ptsUs: G.score[0], ptsThem: G.score[1], pts: G.score[0], end: extra.end || 'miss', offense: G.off, scorer: role(scorer), scorerName: scorer && scorer.name, me: Object.assign({}, me.box),
            foul: extra.foul || null, fouled: role(extra.fouled || (extra.foul && scorer)), dunk: !!extra.dunk, buzzer: !!extra.buzzer, stamina: Math.round(G.stamUsed + (100 - me.stamina) * .3), log: G.log.slice(), ankles: G.anklesBy || 0,
            all: players.map(p => ({ team: p.team, name: p.name, isUser: p.isUser, box: p.box })), weapons: G.wlog.slice() };
          banner = res.ptsUs ? (extra.foul ? 'AND ONE!' : extra.buzzer ? 'AT THE BUZZER!' : `+${res.ptsUs}`) : res.ptsThem ? (extra.foul ? 'AND ONE — THEM' : 'THEY SCORE') :
            ({ foul: res.foul && res.foul.team === 1 ? 'FOUL ON YOU' : 'FOUL — TO THE LINE', to: 'TURNOVER', set: 'DEFENSE SET', oreb: 'RESET', miss: 'NO GOOD', stop: 'STOP!', buzzer: 'BUZZER' })[res.end] || 'NO GOOD';
        } else {
          const win = extra.forfeit ? false : G.score[0] > G.score[1];
          res = { win, score: G.score.slice(), box: me.box, fire: G.anyFire, shatter: E.shatter, forfeit: !!extra.forfeit, ankles: G.anklesBy || 0, fatigue: clamp(Math.round(G.stamUsed / 5 + 15), 15, 60), all: players.map(p => ({ team: p.team, name: p.name, isUser: p.isUser, box: p.box })), weapons: G.wlog.slice() };
          banner = win ? 'YOU WIN!' : 'GAME OVER'; sub = `${G.score[0]} – ${G.score[1]}`;
        }
        intro.className = 'arc-intro on'; intro.innerHTML = `<b>${banner}</b>${sub ? `<small>${sub}</small>` : ''}`;
        SFX.play(SEGM ? (res.ptsUs || res.end === 'stop' ? 'roar' : res.ptsThem ? 'groan' : 'whistle') : (res.win ? 'roar' : 'groan'));
        const hold = SEGM ? 1000 : 2000;
        setTimeout(() => {
          cancelAnimationFrame(raf);
          if (SEGM) { trans.querySelector('b').textContent = 'BACK TO THE GAME'; trans.className = 'arc-trans in'; }
          root.classList.add('out');
          setTimeout(() => { root.remove(); document.body.classList.remove('arc-open'); resolve(res); }, SEGM ? 520 : 320);
        }, hold);
      }
      requestAnimationFrame(() => root.classList.add('in'));
      raf = requestAnimationFrame(loop);
      let seen = false; try { seen = localStorage.getItem('hd_arcade_help2') === '1'; } catch (e) { }
      if (!seen) { showHelp(); G.wasPaused = true; } else begin();
    });
  }

  /* =================================================================
     ENTRY POINTS
     ================================================================= */
  const KEYMAP = { catch3: 'three', pull3: 'three', catchMid: 'mid', pullMid: 'mid', layup: 'finish', dunk: 'dunk', steal: 'steal', block: 'intD', rebound: 'reb', move: 'handle' };
  function userPlayer() {
    const s = Game.state, arch = Engine.archOf(s);
    const bonus = action => { const k = KEYMAP[action], m = arch.passive.mods || {}, out = []; const v = (m[k] || 0) + (m.all || 0); if (v) out.push({ label: arch.passive.name, v }); const bb = Engine.badgeBonus(s, k); if (bb) out.push({ label: 'Badges', v: bb }); return out; };
    return { name: `${s.player.first} ${s.player.last}`, stats: Balance.userStats(s), look: Engine.look(s), num: s.player.num, arch: s.player.arch, isUser: true, bonus, weapons: Engine.weapons(s).map(x => ({ id: x.id, rank: x.rank })) };
  }
  function crew(team, rating, n, star) {
    const names = (team.roster || []).filter(nm => !/Kai Sterling/.test(nm) || (star && star.name === nm));
    if (star && !names.includes(star.name)) names.unshift(star.name);
    return [...Array(n)].map((_, i) => { const nm = names[i] || `${team.abbr} ${i + 1}`, isStar = !!(star && nm === star.name), N = Weapons.npc(nm, rating + (isStar ? 0 : -2 + Math.random() * 4), isStar);
      if (isStar) { N.stats.perD = Math.max(N.stats.perD, star.perD || rating); N.stats.intD = Math.max(N.stats.intD, star.intD || rating); }
      return { name: nm, stats: N.stats, weapons: N.weapons, star: isStar }; });
  }
  /* Pickup game (first to `target`) — same result shape as before */
  function play(cfg) { return run(Object.assign({ mode: 'game', venue: 'street' }, cfg)); }
  /* One arcade possession inside a match (fast break, loose ball, scramble, broken play, buzzer, final possession).
     m: { kind, setup:'break'|'half'|'loose'|'putback', offense:0|1, clock, clockLabel, untilClock, title,
          us, them, star, oppRating, mateRating, numbers:[ours, theirs], backD, handler:'me'|'mate', score:[us,them], venue, bonus, stats, stamina } */
  function segment(m) {
    const [no, nd] = m.numbers || [2, 1];
    const meP = userPlayer(); if (m.bonus) meP.bonus = m.bonus;
    if (m.stats) meP.stats = m.stats;
    if (m.stamina != null) meP.stamina = m.stamina;
    if (m.weapons) meP.weapons = m.weapons;
    const mates = crew(m.us, m.mateRating || 45, Math.max(0, no - 1));
    const usPl = m.handler === 'mate' && mates.length && m.setup === 'break' ? [mates[0], meP].concat(mates.slice(1)) : [meP].concat(mates);
    const thPl = crew(m.them, m.oppRating || 45, Math.max(1, nd), m.star && nd >= 1 ? m.star : null);
    const pace = BALANCE.arcade.pace;
    return run({ mode: 'seg', teams: [{ name: m.us.name, abbr: m.us.abbr, colors: m.us.colors, players: usPl }, { name: m.them.name, abbr: m.them.abbr, colors: m.them.colors, players: thPl }],
      seg: { kind: m.kind || 'fastbreak', setup: m.setup || 'break', offense: m.offense != null ? m.offense : 0, clock: m.clock || pace.breakClock, clockLabel: m.clockLabel || 'BREAK', untilClock: !!m.untilClock, handler: m.handler },
      backD: m.backD, score: m.score, venue: m.venue || 'rec_center', title: m.title || 'FAST BREAK!' });
  }
  function fastBreak(m) { const [no, nd] = m.numbers || [2, 1]; return segment(Object.assign({ kind: 'fastbreak', setup: 'break', offense: 0, title: no > nd ? `FAST BREAK! ${no} ON ${nd}` : 'FAST BREAK!' }, m)); }
  return { play, segment, fastBreak, userPlayer, crew, movesFor };
})();
