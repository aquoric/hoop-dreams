/* =====================================================================
   CS-PLAYS.JS — cutscenes rebuilt from the REAL play (js/match.js / js/arcade.js record it).
   Cutscene.winner(play, ctx) → Promise    the game-winner (yours, a teammate's, or theirs against you)
   Cutscene.playShots(play, ctx, o)         just the court shots of a play (used by other story cutscenes)

   play: { side:'us'|'them', kind, by:{name,short,look,num,isUser}, def, ast, px, py (venue pixels), ft, clock (s left), buzzer, pts, final:[us,them] }
   kinds: three · deep · mid · fade · hook · layup · jelly · dunk · putback · ft · block · steal · stop
   ctx:  { usAbbr, themAbbr, team:{colors}, them:{colors}, venue, venueName, home (true = our gym), size (players a side), usRoster, themRoster }

   Every cutscene is assembled from pieces picked at random: an opening (the set-up, a push-in on the
   shooter's face), the play from one of several camera setups (behind, side, under the rim, the stands,
   following the ball), sometimes a slow-motion second angle, then the aftermath (buzzer and red light, or
   getting back on defense with time left) and one or two celebrations (the mob, the bench storming the
   court, a solo moment, the crowd, the other team's reaction).
   ===================================================================== */
(() => {
  if (typeof Cutscene === 'undefined') return;
  const H = PIX.hoop, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, span = CSK.span, ease = CSK.ease;
  const JUMPER = ['three', 'deep', 'mid', 'fade', 'hook'], RIM = ['layup', 'jelly', 'dunk', 'putback'], DEF = ['block', 'steal', 'stop'];
  const fmtClock = c => c >= 10 ? `0:${String(Math.floor(c)).padStart(2, '0')}` : c.toFixed(1);
  const camAtPt = (x, y, z) => ({ x: x - 192, y: y - 108, z });

  /* announcer lines (1–2 sentences) */
  const LINES = {
    three: ['{sc} rises from deep…', '{sc} gets a look from three…', 'Step-back — {sc} lets it fly…'],
    deep: ['{sc} pulls up from WAY downtown…', 'From the logo… {sc}…', 'That is a heat check from {sc}…'],
    mid: ['{sc} pulls up at the elbow…', 'Jab, rise, fire — {sc}…', '{sc} stops on a dime…'],
    fade: ['{sc} turns… and fades away…', 'Over the shoulder — {sc}…'],
    hook: ['{sc} backs him down. Hook shot…', 'Drop step, sky hook — {sc}…'],
    layup: ['{sc} turns the corner and attacks the rim…', '{sc} gets downhill…', 'Lane opens — {sc} goes…'],
    jelly: ['{sc} goes up, {df} jumps… and {sc} goes AROUND him…', 'Wrong hand, right side — {sc}…'],
    dunk: ['{sc} has a lane…', 'Nobody between {sc} and the rim…', '{sc} takes off…'],
    putback: ['Off the rim — {sc} is THERE!', 'It rims out… {sc} crashes!'],
    ft: ['{sc} at the line. Everything rides on this.', 'The gym goes quiet. {sc} at the stripe.'],
    block: ['{vs} goes up for the win — {sc} comes from nowhere!', '{vs} thinks he\'s got it… {sc}!'],
    steal: ['{vs} is dribbling out the clock — {sc} reads it!', '{sc} jumps the dribble!'],
    stop: ['{vs} rises for the win… {sc} is right there!', 'Last shot for {vs}… contested by {sc}!'],
    assist: ['{as} finds {sc}…', '{as} swings it to {sc}…', 'Kick-out from {as} — {sc}…'],
  };
  const TITLES = {
    mine: { three: 'GAME-WINNER', deep: 'FROM WAY DOWNTOWN', mid: 'PULL-UP WINNER', fade: 'FADEAWAY FOR THE WIN', hook: 'SKY HOOK WINNER', layup: 'GAME-WINNER', jelly: 'JELLY FOR THE WIN', dunk: 'WALK-OFF SLAM', putback: 'PUT-BACK WINNER', ft: 'ICE IN THE VEINS', block: 'GAME-SEALING BLOCK', steal: 'PICKED HIS POCKET', stop: 'THE STOP' },
    theirs: { block: 'STONEWALLED', steal: 'STRIPPED', stop: 'NO GOOD' },
  };

  /* ---------- who's on the floor ---------- */
  function cast(play, ctx) {
    const mine = play.side === 'us', size = ctx.size || 5;
    const lookOf = (d, team) => { const cols = team === 0 ? (ctx.team && ctx.team.colors) : (ctx.them && ctx.them.colors); const L = Object.assign({}, d && d.look ? d.look : Art.lookFromSeed((d && d.name) || 'p' + team)); if (cols) Object.assign(L, { jersey: cols[0], trim: cols[1], outfit: 'jersey' }); return L; };
    const scT = mine ? 0 : 1, dfT = 1 - scT;
    const A = { sc: { d: play.by, team: scT }, df: play.def ? { d: play.def, team: dfT } : null, as: play.ast ? { d: play.ast, team: scT } : null };
    const fill = (names, team, n, skip) => names.filter(x => !skip.includes(x)).slice(0, n).map(name => ({ d: { name, look: Art.lookFromSeed(name) }, team }));
    const used = [play.by, play.def, play.ast].filter(Boolean).map(d => d.name);
    const mates = size > 1 ? fill((scT === 0 ? ctx.usRoster : ctx.themRoster) || [], scT, Math.min(3, size - 1 - (A.as ? 1 : 0)), used) : [];
    const opps = size > 1 ? fill((dfT === 0 ? ctx.usRoster : ctx.themRoster) || [], dfT, Math.min(3, size - 1), used) : [];
    while (size > 1 && mates.length < Math.min(2, size - 1 - (A.as ? 1 : 0))) mates.push({ d: { name: 'mate' + mates.length, look: Art.lookFromSeed('csm' + mates.length + (ctx.usAbbr || '')) }, team: scT });
    while (size > 1 && opps.length < Math.min(2, size - 1)) opps.push({ d: { name: 'opp' + opps.length, look: Art.lookFromSeed('cso' + opps.length + (ctx.themAbbr || '')) }, team: dfT });
    return { A, mates, opps, lookOf, mine };
  }
  const sprite = (C, id, who, x, y) => ({ id, kind: 'sprite', x, y, team: who.team, look: C.lookOf(who.d, who.team), num: who.d && who.d.num != null ? who.d.num : undefined });

  /* ---------- the play itself (court choreography); returns { cast, play(S,t), tMake, tEnd, focus } ---------- */
  function choreo(play, C) {
    const k = play.kind, side = (play.px || 220) >= H.x ? 1 : -1;
    let sx = clamp(play.px || H.x + side * 70, 40, 344), sy = clamp(play.py || 130, 72, 200);
    if (RIM.includes(k) && Math.hypot(sx - H.x, (sy - H.y) * 1.3) < 70) { const a = Math.atan2(sy - H.y + 40, sx - H.x); sx = clamp(H.x + Math.cos(a) * 90, 60, 324); sy = clamp(H.y + 40 + Math.sin(a) * 60, 110, 190); }   // drives start from out on the floor
    if (k === 'ft') { sx = H.x; sy = 109; }
    const list = [], spots = {};
    const add = (id, who, x, y) => { if (!who) return; list.push(sprite(C, id, who, x, y)); spots[id] = [x, y]; };
    // the attacker on stops is THEIR player (vs = play.def)
    const atk = DEF.includes(k) ? (C.A.df || { d: { name: 'Shooter' }, team: 1 - C.A.sc.team }) : C.A.sc;
    const dfn = DEF.includes(k) ? C.A.sc : C.A.df;
    const ax = sx, ay = sy, toward = (x, y, d) => { const dx = H.x - x, dy = H.y - y, l = Math.hypot(dx, dy) || 1; return [x + dx / l * d, y + dy / l * d]; };
    add('sc', atk, ax, ay);
    if (dfn) { const [dx, dy] = k === 'ft' ? [H.x + 30, 96] : toward(ax, ay, k === 'steal' ? 6 : 14); add('df', dfn, dx, dy); }
    if (C.A.as && !DEF.includes(k) && k !== 'ft') add('as', C.A.as, clamp(ax + (ax > H.x ? -90 : 90), 40, 344), clamp(ay + 20, 110, 196));
    // everybody else spaced out (on free throws: lined up on the lane)
    const lane = [[H.x - 24, 78], [H.x + 24, 84], [H.x - 24, 92], [H.x + 24, 70]], floor = [[70, 170], [314, 165], [120, 104], [270, 98], [192, 186], [60, 90]];
    let li = 0; [...C.mates.map(m => ['m', m]), ...C.opps.map(m => ['o', m])].forEach(([p, m], i) => { const s = k === 'ft' ? lane[li++ % 4] : floor[i % floor.length]; add(p + i, m, s[0] + rnd(-6, 6), s[1] + rnd(-4, 4)); });
    const out = { cast: list, spots, side, made: true, tMake: 1.6, tEnd: 3.2 };
    const P = S => S.sp.sc, D = S => S.sp.df, B = S => S.ball, swish = S => { S.R.E.net.swish = 1; SFX.play('swish'); SFX.play('net'); };
    const settle = S => { Object.keys(S.sp).forEach(id => { if (id[0] === 'o' || id[0] === 'm') { const p = S.sp[id]; p.stance = id[0] === 'o'; p.face = H.x >= p.x ? 1 : -1; } }); };
    const dropBall = (S, a) => { const b = B(S); b.holder = null; b.x = H.x; b.y = H.y + Math.min(6, a * 30); b.z = Math.max(0, H.z - a * 70); };

    if (JUMPER.includes(k)) {
      const t0 = C.A.as ? 1.0 : .8, F = { three: 1.1, deep: 1.4, mid: .95, fade: 1, hook: .85 }[k], J = { deep: 13, hook: 9, fade: 15 }[k] || 15;
      out.tMake = t0 + .44 + F; out.tEnd = out.tMake + 1.2; out.release = t0 + .44;
      out.play = (S, t) => { const p = P(S), d = D(S), b = B(S); settle(S);
        if (C.A.as && t < .7 && S.sp.as) { const a = S.sp.as, u = span(t, .25, .65); b.holder = u <= 0 ? a : u >= 1 ? p : null; if (u > 0 && u < 1) { b.x = lerp(a.x, p.x, u); b.y = lerp(a.y, p.y, u); b.z = 26 + Math.sin(u * Math.PI) * 8; } if (u >= 1 && !p._caught) { p._caught = 1; SFX.play('pass'); } }
        else if (t < t0) b.holder = p;
        if ((k === 'mid' || k === 'three') && t > .25 && t < t0 && !C.A.as) { p.act = { type: 'move', id: 'cross', t: (t - .25) % .4, T: .4, f0: -1, f1: 1 }; if (d) d.act = t > .6 ? { type: 'stumble', t: t - .6, T: 1 } : null; }
        if (k === 'fade' && t > t0) { const u = span(t, t0, t0 + .6); p.x = ax + (ax - H.x) / 12 * u; p.y = ay + 8 * u; }
        if (d && t > t0 + .1) { d.act = { type: 'block', t: .1 }; d.z = Math.max(0, Math.sin(clamp((t - t0 - .1) / .6, 0, 1) * Math.PI) * 10); }
        if (t >= t0) CSK.jumper(S, p, t, t0, { made: true, flight: F, jump: J, arc: k === 'deep' ? 40 : 26, onMake: () => S.fx.impact(150) });
      };
    } else if (k === 'layup' || k === 'jelly' || k === 'dunk') {
      const t1 = 1.0, ex = H.x + side * (k === 'jelly' ? 20 : k === 'dunk' ? 8 : 14), ey = H.y + (k === 'dunk' ? 14 : 20);
      out.tMake = k === 'dunk' ? t1 + .7 : k === 'jelly' ? t1 + .95 : t1 + .7; out.tEnd = out.tMake + 1.3; out.release = t1 + .35;
      out.play = (S, t) => { const p = P(S), d = D(S), b = B(S); settle(S); p.face = H.x >= p.x ? 1 : -1;
        if (t < t1) { b.holder = p; CSK.run(p, t, .1, t1, ax, ay, ex, ey); if (d) { CSK.run(d, t, .3, t1 + .1, d.x, d.y, H.x - side * (k === 'jelly' ? 2 : 10), H.y + 18); d.stance = true; } return; }
        const u = t - t1;
        if (d) { if (!d._rx) d.act = { type: 'block', t: .1 }; d.face = side; d.z = Math.max(0, Math.sin(clamp((u - .05) / .7, 0, 1) * Math.PI) * (k === 'jelly' ? 13 : 9));
          if (k === 'jelly' && !d._rx) d.poseAct = { type: 'jellyD', u: clamp(u / .4, 0, 1), lift: 0 }; }   // the jelly: he rises with both arms up
        if (k === 'dunk') {
          p.act = { type: 'dunk', t: Math.min(1.04, u * 1.2), T: 1.05 }; const up = span(u, .1, .5); p.x = lerp(ex, H.x + side * 4, up); p.y = lerp(ey, H.y + 3, up); p.z = Math.sin(up * Math.PI / 2) * (H.z - 10);
          if (u < .55) { b.holder = p; return; }
          if (!p._sl) { p._sl = 1; SFX.play('dunk'); S.fx.impact(170); S.fx.shake(10); S.R.E.rim = 1.2; S.R.E.net.swish = 1.4; }
          dropBall(S, u - .55); if (u > .95) { p.z = Math.max(0, p.z - (u - .95) * 80); p.act = { type: 'jump', t: u }; }
          return;
        }
        p.act = { type: 'layup', t: Math.min(.68, u * .9), T: .7 }; p.z = u < .45 ? Math.sin(span(u, 0, .35) * Math.PI / 2) * 14 : Math.max(0, 14 - (u - .45) * 50);
        if (k === 'jelly') {   // the keyframed jelly pose (js/pixel.js), afterimages on the flick
          const lvl = p.isUser && typeof Features !== 'undefined' && Game.state ? Features.jellyLevel(Game.state) : 0;
          Object.assign(p.act, { jelly: { lvl }, released: u >= .35, ju: u < .35 ? .28 + u / .35 * .27 : Math.min(1, .58 + (u - .35) / .5 * .42) }); p.ghost = u > .2 && u < .9;
          if (u > .2 && !p._tw) { p._tw = 1; SFX.play('whoosh'); }
          if (u >= .35 && !p._fl) { p._fl = 1; if (lvl !== 2) p.face = -p.face; SFX.play('flick'); S.fx.impact(70); }   // the wrist snap
        }
        if (u < .35) { b.holder = p; return; }
        b.holder = null; const r = u - .35;
        if (k === 'jelly') { const G = { x: H.x + side * 9, y: H.y - 2, z: H.z + 14 }, C = { x: (d ? d.x : p.x) + side * 3, y: (d ? d.y : p.y) - 4, z: (d ? d.z : 0) + 52 };
          b.jelly = r < .62;
          if (r < .35) { const q = r / .35, w = 1 - q; b.x = w * w * p.x + 2 * w * q * C.x + q * q * G.x; b.y = w * w * p.y + 2 * w * q * C.y + q * q * G.y; b.z = w * w * (p.z + 30) + 2 * w * q * C.z + q * q * G.z; S.R.burst(b.x, b.y - b.z, '#fde68a', 1, 6); return; }
          if (!p._ks) { p._ks = 1; SFX.play('kiss'); SFX.play('ooh'); S.R.shine(side); S.fx.impact(90); }   // a soft kiss, a shine across the glass
          const q = clamp((r - .35) / .25, 0, 1); if (q < 1) { const e = q * q; b.x = lerp(G.x, H.x, e); b.y = lerp(G.y, H.y, e); b.z = lerp(G.z, H.z + 1, e); return; }
          if (!p._sw) { p._sw = 1; swish(S); SFX.play('jelly'); if (d) { d.poseAct = null; d._rx = 1; d.act = pick([{ type: 'stumble', t: 0, T: 2 }, { type: 'down', t: .5, T: 2 }, { type: 'watch', t: 0, T: 2 }]); } } return dropBall(S, r - .6); }
        if (r < .3) { const q = r / .3; b.x = lerp(p.x + p.face * 3, H.x, q); b.y = lerp(p.y, H.y, q); b.z = lerp(p.z + 32, H.z + 1, q) + Math.sin(q * Math.PI) * 6; return; }
        if (!p._sw) { p._sw = 1; swish(S); } dropBall(S, r - .3);
      };
    } else if (k === 'putback') {
      // a teammate's shot rims out, you crash and put it back
      const shooter = C.mates[0] || C.A.as || { d: { name: 'Teammate' }, team: C.A.sc.team };
      out.cast.push(sprite(C, 'sh', shooter, clamp(H.x - side * 80, 60, 324), 150));
      const sc0 = [H.x + side * 26, H.y + 34]; out.cast[0].x = sc0[0]; out.cast[0].y = sc0[1];
      out.tMake = 2.25; out.tEnd = 3.5; out.release = .64;
      out.play = (S, t) => { const p = P(S), b = B(S), sh = S.sp.sh; settle(S);
        if (t < 1.75) { if (t >= .2) CSK.jumper(S, sh, t, .2, { made: false, flight: 1 }); else b.holder = sh; CSK.run(p, t, .9, 1.6, sc0[0], sc0[1], H.x + side * 10, H.y + 14); return; }
        const u = t - 1.75; p.act = { type: u < .4 ? 'reb' : 'land', t: u, T: .3 }; p.z = Math.max(0, Math.sin(clamp(u / .5, 0, 1) * Math.PI) * 18);
        if (u < .25) { b.x = lerp(b.x, p.x, .3); b.y = lerp(b.y, p.y, .3); b.z = lerp(b.z, p.z + 38, .3); return; }
        const q = clamp((u - .25) / .25, 0, 1); if (q < 1) { b.x = lerp(p.x, H.x, q); b.y = lerp(p.y, H.y, q); b.z = lerp(p.z + 38, H.z + 1, q); return; }
        if (!p._sw) { p._sw = 1; swish(S); S.fx.impact(150); } dropBall(S, u - .5);
      };
    } else if (k === 'ft') {
      out.tMake = 1.4 + .44 + 1; out.tEnd = out.tMake + 1.2; out.release = 1.84;
      out.play = (S, t) => { const p = P(S), b = B(S); settle(S); p.face = 1;
        Object.keys(S.sp).forEach(id => { if (id !== 'sc') { const q = S.sp[id]; q.stance = false; q.face = q.x < H.x ? 1 : -1; q.act = t > 1.2 && t < 1.7 ? { type: 'reb', t: 0 } : null; } });
        if (t < 1.4) { b.holder = p; p.act = null; if (t > .3 && t < .9) p.dribT = (p.dribT || 0) + .05; return; }
        CSK.jumper(S, p, t, 1.4, { made: true, flight: 1, jump: 3, arc: 22 });
      };
    } else if (k === 'block' || k === 'stop') {
      // their shooter goes up, our man (the scorer of this play) meets him
      const shooter = C.A.df ? 'df' : null; out.cast.forEach(a => { if (a.id === 'sc') { a.x = H.x + side * 40; a.y = H.y + 46; } });
      if (shooter) { const a = out.cast.find(q => q.id === 'df'); a.x = sx; a.y = sy; }
      out.tMake = k === 'block' ? 1.35 : 2.3; out.tEnd = out.tMake + 1.4; out.release = 1.1;
      out.play = (S, t) => { const p = P(S), a = S.sp.df, b = B(S); settle(S); if (!a) return;
        p.face = a.x >= p.x ? 1 : -1; a.face = H.x >= a.x ? 1 : -1;
        if (k === 'block') {
          if (t < .9) { b.holder = a; CSK.run(a, t, .1, .9, sx, sy, H.x + side * 18, H.y + 26); CSK.run(p, t, .3, .95, H.x + side * 40, H.y + 46, H.x + side * 12, H.y + 30); return; }
          const u = t - .9; a.act = { type: 'layup', t: Math.min(.4, u), T: .7 }; a.z = Math.sin(clamp(u / .4, 0, 1) * Math.PI / 2) * 12;
          p.act = { type: 'block', t: .1 }; p.z = Math.max(0, Math.sin(clamp((u - .05) / .7, 0, 1) * Math.PI) * 18);
          if (u < .4) { b.holder = a; return; }
          if (!p._bl) { p._bl = 1; SFX.play('slap'); SFX.play('dunk'); S.fx.impact(180); S.fx.shake(9); b.holder = null; b.x = a.x; b.y = a.y; b.z = a.z + 34; }
          const r = u - .4; b.x += (side > 0 ? -1 : 1) * 2.4; b.y += 1.2; b.z = Math.max(0, b.z + (24 - r * 60) * .05); a.act = r > .4 ? { type: 'stumble', t: r - .4, T: 2 } : a.act; a.z = Math.max(0, a.z - r * 40);
        } else {
          if (t < 1.1) { b.holder = a; if (t > .4 && t < .9) a.act = { type: 'move', id: 'hesi', t: t - .4, T: .5 }; CSK.run(p, t, .2, 1, H.x + side * 40, H.y + 46, a.x + (H.x - a.x) / 8, a.y - 10); return; }
          CSK.jumper(S, a, t, 1.1, { made: false, flight: 1, onMiss: () => S.fx.impact(120) });
          p.act = { type: 'block', t: .1 }; p.z = Math.max(0, Math.sin(clamp((t - 1.2) / .6, 0, 1) * Math.PI) * 15);
        }
      };
    } else if (k === 'steal') {
      const a0 = [clamp(sx, 120, 264), clamp(sy, 130, 190)];
      out.cast.forEach(a => { if (a.id === 'df') { a.x = a0[0]; a.y = a0[1]; } if (a.id === 'sc') { a.x = a0[0] + side * 16; a.y = a0[1] - 6; } });
      out.tMake = 1.15; out.tEnd = 3; out.release = 1;
      out.play = (S, t) => { const p = P(S), a = S.sp.df, b = B(S); settle(S); if (!a) return;
        a.face = side; p.face = -side; p.stance = t < .9;
        if (t < .9) { b.holder = a; a.x = a0[0] + Math.sin(t * 5) * 4; return; }
        if (t < 1.15) { p.act = { type: 'reach', t: t - .9, T: .3 }; b.holder = null; b.x = lerp(a.x, p.x, span(t, .95, 1.15)); b.y = a.y + 2; b.z = 8; if (!p._st) { p._st = 1; SFX.play('slap'); SFX.play('whoosh'); S.fx.impact(120); } return; }
        b.holder = p; a.act = { type: 'stumble', t: t - 1.15, T: 2 }; CSK.run(p, t, 1.2, 2.6, p.x, p.y, p.x - side * 30, 205);
      };
    }
    out.focus = S => { const b = S.ball, p = S.sp.sc; return b.holder ? { x: b.holder.x, y: b.holder.y - (b.holder.z || 0) - 16 } : { x: b.x, y: b.y - b.z }; };
    out.who = S => S.sp.sc;
    return out;
  }

  /* camera setups: functions of (S, k) → {x,y,z} */
  const CAMS = {
    behind: (O) => (S, k) => { const p = O.who(S) || { x: 192, y: 140 }, dx = p.x - H.x, dy = p.y - H.y, l = Math.hypot(dx, dy) || 1, u = ease(clamp(k * 1.3, 0, 1)); return camAtPt(lerp(p.x + dx / l * 24, (p.x + H.x) / 2, u), lerp(p.y + dy / l * 18 - 14, (p.y + H.y) / 2, u), lerp(1.85, 1.45, u)); },
    side: (O) => (S, k) => { const p = O.who(S) || { x: 192, y: 140 }; return camAtPt((p.x + H.x) / 2 + (k - .5) * 16, (p.y + H.y) / 2 - 6, 1.2 + k * .1); },
    rim: () => (S, k) => camAtPt(H.x + Math.sin(k * 2) * 4, H.y - 8, 2.1 + k * .2),
    crowd: () => (S, k) => camAtPt(192, 100 - k * 6, 1.02 + k * .06),
    flight: (O) => (S, k) => { const f = O.focus(S); return camAtPt(f.x, f.y, S.ball.holder ? 1.65 : 1.95); },
  };

  /* one shot of the play from a camera */
  function playShot(play, ctx, C, camName, o = {}) {
    const O = choreo(play, C), mine = C.mine, k = play.kind, buzzer = !!play.buzzer;
    const ms = x => Math.round(x * 1000), tm = O.tMake;
    const pre = play.final ? (mine ? [play.final[0] - (play.pts || 0), play.final[1]] : [play.final[0], play.final[1] - (play.pts || 0)]) : null;
    const preTxt = pre ? `${pre[0]}-${pre[1]}` : ctx.score, finTxt = play.final ? `${play.final[0]}-${play.final[1]}` : ctx.score;
    const ev = [], scoring = !DEF.includes(k);
    // the clock: free throws are dead-ball, everything else ticks down to the decisive moment
    const cEnd = buzzer ? 0 : Math.max(0, play.clock || 0), cStart = k === 'ft' ? cEnd : cEnd + (buzzer ? Math.min(4, Math.ceil(tm)) : Math.min(3, tm * .9));
    const tZero = buzzer ? Math.min(tm - .05, (O.release || tm - .5) + .25) : tm;
    if (k !== 'ft') for (let i = 0; i <= 8; i++) { const u = i / 8, at = tZero * u, v = lerp(cStart, cEnd, u); ev.push([ms(at), 'score', fmtClock(Math.max(0, v))]); }
    if (buzzer) ev.push([ms(tZero), 'score', '0.0'], [ms(tZero), 'red'], [ms(tZero), 'sfx', 'buzzer'], [ms(tZero), 'flash', '#ef4444', .25]);
    ev.push([0, 'sfx', 'heartbeat'], [ms(Math.max(0, tm - 1.2)), 'riser', 1.2]);
    if (scoring) ev.push([ms(tm), 'bug', finTxt], [ms(tm), 'cheer'], [ms(tm + .05), 'sfx', mine || !ctx.home ? 'roar' : 'groan']);
    else ev.push([ms(tm), 'cheer'], [ms(tm + .05), 'sfx', ctx.home ? 'roar' : 'ooh']);
    if (k === 'dunk' || k === 'block') ev.push([ms(tm), 'shake', 8]);
    const slowAround = o.slow ? [[0, 99999, o.slow]] : buzzer || camName === 'flight' ? [[ms(Math.max(0, tm - 1)), ms(tm + .3), .42]] : [[ms(Math.max(0, tm - .5)), ms(tm + .2), .6]];
    const sh = { d: ms(O.tEnd), court: '@venue', score: true, scoreText: preTxt, clockText: k === 'ft' ? fmtClock(cEnd) : fmtClock(cStart), cast: O.cast, play: O.play, ev, slow: slowAround,
      camFn: CAMS[camName](O), speed: camName === 'flight' ? 'radial' : null, focus: [.5, .4], grade: o.grade || (ctx.night ? 'night' : null), music: o.music, tr: o.tr || 'cut' };
    if (camName === 'crowd') { sh.fgCrowd = (ctx.home ? (ctx.team && ctx.team.colors) : (ctx.them && ctx.them.colors)) || ['#64748b']; }
    if (o.say) sh.say = ['narrator', o.say];
    if (o.label) sh.title = { text: o.label, style: 'loc', at: 100 };
    return sh;
  }

  /* ---------- the aftermath and celebrations ---------- */
  function celebShots(play, ctx, C) {
    const mine = C.mine, by = play.by || {}, finTxt = play.final ? `${play.final[0]}-${play.final[1]}` : ctx.score, out = [];
    const scLook = C.lookOf(by, C.A.sc.team), myPose = mine && by.isUser && typeof Features !== 'undefined' ? Features.celebPose(Game.state) : null;
    const pose = () => myPose || pick(['flex', 'point', 'thump', 'joy', 'celebrate']);
    const T = (mine ? TITLES.mine : Object.assign({}, TITLES.mine, TITLES.theirs))[play.kind] || 'GAME-WINNER';
    const title = { text: play.buzzer && !DEF.includes(play.kind) ? 'AT THE BUZZER' : mine ? T : pick(['HEARTBREAK', 'THEY WIN IT', 'GUT PUNCH']), sub: `${by.name || ''} · ${ctx.usAbbr || 'US'} ${finTxt} ${ctx.themAbbr || 'THEM'}${ctx.venueName ? ' · ' + ctx.venueName : ''}`, style: 'slam', at: 500 };
    const teamOf = t => t === C.A.sc.team, scT = C.A.sc.team;
    const grd = mine ? 'gold' : 'red';
    const mob = () => {
      const cast = [sprite(C, 'sc', C.A.sc, 192, 140)], n = Math.max(2, (ctx.size || 5) - 1);
      for (let i = 0; i < Math.min(4, n); i++) cast.push(sprite(C, 'm' + i, (C.mates[i] || C.A.as || { d: { name: 'mob' + i }, team: scT }), [110, 280, 140, 250][i], [180, 176, 100, 104][i]));
      if (C.A.df) cast.push(sprite(C, 'df', C.A.df, 320, 120));
      return { d: 3200, court: '@venue', cam: [[0, 0, 30, 1.25], [1, 0, 22, 1.45, 'io']], grade: grd, score: true, scoreText: finTxt, clockText: '0.0', music: mine ? 'victory' : 'sad', cast,
        ev: [[0, 'cheer'], [0, 'confetti', mine ? 140 : 0], [300, 'sfx', mine ? 'roar' : 'boo'], [1400, 'sfx', 'slap']],
        play(S, t) { const p = S.sp.sc; S.ball.holder = null; S.ball.z = 0; S.ball.x = 200; S.ball.y = 196; CSK.cel(p, t < 1.3 ? pose() : 'joy', t);
          Object.keys(S.sp).forEach((id, i) => { if (id[0] !== 'm') return; const q = S.sp[id], tx = 192 + Math.cos(i * 1.7) * 18, ty = 142 + Math.sin(i * 1.7) * 10; if (!q._0) q._0 = [q.x, q.y]; CSK.run(q, t, .1 + i * .08, 1.1, q._0[0], q._0[1], tx, ty); q.face = q.x < p.x ? 1 : -1;
            if (i === 1 && t > 1.3 && t < 1.9) { q.act = { type: 'chestbump', t: t - 1.3, T: .55 }; p.act = { type: 'chestbump', t: t - 1.3, T: .55 }; } else CSK.cel(q, 'joy', t + i * .2); });
          if (S.sp.df) S.sp.df.act = { type: t > 1 ? 'sit' : 'hang', t, T: 99 }; } };
    };
    const bench = () => {
      const cast = [sprite(C, 'sc', C.A.sc, 192, 132)];
      for (let i = 0; i < 8; i++) cast.push(sprite(C, 'b' + i, { d: { name: (ctx.usAbbr || '') + 'bench' + i + scT }, team: scT }, 40 + i * 44, 232));
      return { d: 3400, court: '@venue', cam: [[0, 0, 40, 1.05], [1, 0, 28, 1.3, 'io']], grade: grd, score: true, scoreText: finTxt, music: mine ? 'victory' : 'sad', cast, title: mine ? { text: 'THE BENCH EMPTIES', style: 'loc', at: 200 } : null,
        ev: [[0, 'cheer'], [200, 'sfx', 'roar'], [400, 'confetti', mine ? 200 : 0], [1500, 'shake', 5]],
        play(S, t) { const p = S.sp.sc; S.ball.holder = null; S.ball.z = 0; CSK.cel(p, pose(), t);
          for (let i = 0; i < 8; i++) { const q = S.sp['b' + i], a = i / 8 * Math.PI * 2; CSK.run(q, t, .15 + i * .07, 1.4 + i * .05, 40 + i * 44, 232, 192 + Math.cos(a) * 28, 136 + Math.sin(a) * 14); if (t > 1.5) CSK.cel(q, i % 2 ? 'joy' : 'clap', t + i * .3); q.face = q.x < p.x ? 1 : -1; } } };
    };
    const solo = () => ({ d: 2700, scene: 'arena', grade: 'spot', cam: [[0, 0, 6, 1.25], [1, 0, 12, 1.45, 'io']], music: mine ? 'victory' : 'sad',
      cast: [{ id: 'sc', kind: 'bust', x: 0, expr: mine ? 'smile' : 'smile', rim: mine ? '#fde68a' : '#fca5a5' }], ev: [[0, 'sfx', 'stinger'], [0, 'impact', 140]],
      say: by.isUser ? ['you', pick(['Ball game.', 'Told you. Give me the ball.', 'That one\'s mine.', 'Nobody leaves early.'])] : ['sc', mine ? pick(['Just like practice.', 'I got you.', 'We don\'t lose that one.']) : pick(['Too easy.', 'Our house.', 'Next time, rookie.'])] });
    const crowd = () => ({ d: 2400, court: '@venue', cam: [[0, 0, -70, 1.6], [1, 0, -66, 1.75, 'io']], grade: mine ? null : 'dark', score: true, scoreText: finTxt,
      fgCrowd: ((mine === !!ctx.home) ? (ctx.team && ctx.team.colors) : (ctx.them && ctx.them.colors)) || ['#64748b'], fgHop: mine === !!ctx.home || !mine && !ctx.home,
      cast: [], ev: mine === !!ctx.home || (!mine && !ctx.home) ? [[0, 'cheer'], [0, 'sfx', 'roar'], [0, 'confetti', mine ? 160 : 60]] : [[0, 'sfx', 'groan']],
      say: ['narrator', mine ? pick(['The building is SHAKING.', 'Nobody in here is sitting down.', 'Phones up. Everybody saw it.']) : ctx.home ? pick(['Silence. You can hear their bench.', 'The home crowd can\'t believe it.']) : pick(['Their whole gym is losing it.', 'The noise is unbelievable.'])] });
    const rival = () => mine
      ? (C.A.df ? { d: 2300, scene: 'arena', grade: 'blue', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.4]], cast: [{ id: 'df', kind: 'bust', x: 0, expr: 'sad', rim: '#93c5fd' }], say: ['narrator', pick(['{df} can only stare at the rim.', '{df} sits down on the floor. Hands on his head.']).replace('{df}', play.def.short || play.def.name)] } : null)
      : { d: 2300, scene: 'arena', grade: 'blue', cam: [[0, 0, 6, 1.3], [1, 0, 10, 1.45]], cast: [{ id: 'you', kind: 'face', x: 0, expr: 'shocked', rim: '#93c5fd' }], say: ['narrator', pick(['You can\'t believe it.', 'So close. That one\'s going to sting.', 'You stare at the scoreboard. It doesn\'t change.'])] };
    // time left: get back on defense, then the horn
    if (!play.buzzer && (play.clock || 0) > .6 && !DEF.includes(play.kind)) {
      const cl = play.clock, cast = [sprite(C, 'sc', C.A.sc, 192, 120)]; C.mates.slice(0, 3).forEach((m, i) => cast.push(sprite(C, 'm' + i, m, 140 + i * 50, 110)));
      out.push({ d: 2600, court: '@venue', cam: [[0, 0, 10, 1.2], [1, 0, 50, 1.3]], score: true, scoreText: finTxt, clockText: fmtClock(cl), cast,
        say: ['narrator', mine ? `${fmtClock(cl)} left. Get back — one stop.` : `${fmtClock(cl)} left. Not enough.`],
        ev: [[0, 'cheer'], [1400, 'score', fmtClock(cl / 2)], [2300, 'score', '0.0'], [2300, 'red'], [2300, 'sfx', 'buzzer']],
        play(S, t) { const p = S.sp.sc; S.ball.holder = null; S.ball.z = 0; S.ball.x = 192; S.ball.y = 70; Object.keys(S.sp).forEach((id, i) => { const q = S.sp[id]; if (!q._0) q._0 = [q.x, q.y]; CSK.run(q, t, .1 + i * .1, 1.6, q._0[0], q._0[1], q._0[0] + (i - 1.5) * 10, 196); q.face = 1; });
          if (t > 1.7) CSK.cel(p, 'point', t); } });
    }
    const first = pick(mine ? [mob, bench, solo, mob] : [mob, solo]), second = pick(mine ? [crowd, rival, null, crowd] : [rival, crowd]);
    const a = first(); out.push(a); const b = second && !out[1] && second(); if (b) out.push(b);   // with a get-back-on-D shot, one celebration is enough
    (b || a).title = title; if (b) b.grade = b.grade || grd;
    return out;
  }

  /* the opening: the set-up on the floor, or a slow push-in on the shooter's face */
  function opening(play, ctx, C) {
    const mine = C.mine, by = play.by || {}, pre = play.final ? (mine ? [play.final[0] - (play.pts || 0), play.final[1]] : [play.final[0], play.final[1] - (play.pts || 0)]) : null;
    const diff = pre ? pre[0] - pre[1] : 0, clock = play.buzzer ? pick([3, 4, 5]) : Math.max(1, Math.round((play.clock || 0) + rnd(2, 5)));
    const sit = DEF.includes(play.kind) ? `They have the ball. ${clock} seconds. One stop wins it.` : !pre ? `${clock} seconds left.` : diff === 0 ? `Tied ${pre[0]}-${pre[1]}. ${clock} seconds left.` : diff < 0 ? `Down ${-diff}. ${clock} seconds on the clock.` : `Up ${diff}. ${clock} seconds left.`;
    const line = mine ? sit : DEF.includes(play.kind) ? `Your ball. ${clock} seconds.` : diff === 0 ? `Tied. ${clock} seconds. Their ball.` : `${clock} seconds. ${ctx.themAbbr || 'They'} have it.`;
    const v = pick(play.kind === 'ft' ? ['face', 'set'] : ['set', 'face', 'set']);
    if (v === 'face') return { d: 2200, scene: 'arena', grade: 'spot', music: 'build', tr: 'fade', cam: [[0, 0, 6, 1.35], [1, 0, 14, 1.75, 'in']], speed: 'h',
      cast: [{ id: by.isUser ? 'you' : 'sc', kind: 'face', x: 0, expr: 'determined', rim: mine ? '#fde68a' : '#fca5a5' }], say: ['narrator', line], ev: [[100, 'sfx', 'heartbeat'], [1000, 'sfx', 'heartbeat']] };
    return { d: 2300, court: '@venue', music: 'build', tr: 'fade', grade: 'dark', score: true, scoreText: pre ? `${pre[0]}-${pre[1]}` : ctx.score, clockText: fmtClock(clock),
      cam: [[0, 0, -10, 1.0], [1, 0, 0, 1.12]], cast: choreo(play, C).cast, say: ['narrator', line],
      play(S, t) { const atk = DEF.includes(play.kind) ? S.sp.df : S.sp.sc; Object.keys(S.sp).forEach(id => { const q = S.sp[id]; q.face = H.x >= q.x ? 1 : -1; q.stance = id[0] === 'o' || (id === 'df' && !DEF.includes(play.kind)); }); if (atk) { S.ball.holder = atk; atk.x += Math.sin(t * 3) * .3; } },
      ev: [[0, 'sfx', 'heartbeat'], [1100, 'sfx', 'heartbeat']] };
  }

  /* the court shots of a play: main angle (+ maybe a slow-motion second angle) */
  function playShots(play, ctx, o = {}) {
    const C = cast(play, ctx), k = play.kind;
    const allowed = JUMPER.includes(k) ? ['behind', 'side', 'rim', 'crowd', 'flight'] : k === 'ft' ? ['behind', 'side', 'rim', 'crowd'] : DEF.includes(k) ? ['side', 'rim', 'behind', 'crowd'] : ['behind', 'side', 'rim', 'flight', 'crowd'];
    const cam1 = pick(allowed), cam2 = pick(allowed.filter(c => c !== cam1 && c !== 'crowd'));
    const lineKey = C.A.as && !DEF.includes(k) && Math.random() < .5 ? 'assist' : k;
    const nm = d => d ? (d.short || d.name || '') : '';
    const say = pick(LINES[lineKey] || LINES.three).replace(/\{sc\}/g, nm(DEF.includes(k) ? play.by : play.by)).replace(/\{df\}/g, nm(play.def)).replace(/\{vs\}/g, nm(play.def)).replace(/\{as\}/g, nm(play.ast));
    const out = [playShot(play, ctx, C, cam1, { say, music: o.music === undefined ? null : o.music })];
    if (o.replay !== false && Math.random() < .55) out.push(playShot(play, ctx, C, cam2, { slow: .45, label: 'REPLAY', tr: 'flash' }));
    return { shots: out, C };
  }

  function ctxFor(play, ctx) {
    const looks = Object.assign({}, ctx.looks), names = Object.assign({}, ctx.names);
    const team = t => t === 0 ? (ctx.team && ctx.team.colors) : (ctx.them && ctx.them.colors);
    const mine = play.side === 'us', put = (id, d, t) => { if (!d) return; const cols = team(t), L = Object.assign({}, d.look || Art.lookFromSeed(d.name || id)); if (cols) Object.assign(L, { jersey: cols[0], trim: cols[1], outfit: 'jersey' }); looks[id] = L; names[id] = d.name; };
    put('sc', play.by, mine ? 0 : 1); put('df', play.def, mine ? 1 : 0); put('as', play.ast, mine ? 0 : 1);
    return Object.assign({}, ctx, { looks, names, score: play.final ? `${play.final[0]}-${play.final[1]}` : ctx.score });
  }

  /* ---------- the game-winner ---------- */
  function winner(play, ctx = {}) {
    if (!play || !play.by) return Promise.resolve(false);
    if (play.kind === 'three' && (play.ft || 0) >= 26.5) play.kind = 'deep';
    const X = ctxFor(play, ctx), { shots, C } = playShots(play, X);
    CUTSCENES._winner = { name: 'Game-Winner', shots: [opening(play, X, C), ...shots, ...celebShots(play, X, C)].filter(Boolean) };
    return Cutscene.play('_winner', X);
  }
  Cutscene.winner = winner;
  Cutscene.playShots = (play, ctx, o) => playShots(play, ctxFor(play, ctx), o).shots;
  Cutscene.ctxFor = ctxFor;
})();
