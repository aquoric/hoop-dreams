/* =====================================================================
   BALANCE.JS — every success % in the game comes from here.
   Decision buttons, possession options, minigames and arcade mode all use
   Balance.pct(). Tweak the numbers in BALANCE below.

   HOW A % IS BUILT
   1. Your relevant stats are blended (only stats that matter for the action).
   2. The matching defender's relevant stats are blended the same way.
   3. Both go through diminishing returns (ratings above the knee count less).
   4. pct = base + (you − them) × k
   5. Situation modifiers are added (open/contested, distance, shot clock,
      fatigue, confidence, home crowd, clutch — clutch only late in close games).
   6. Archetype passives / badges / On Fire add small action-specific bonuses.
   7. Clamped to 5–95.
   Minigames then move the result: final = pct + (quality − 0.5) × skill
   (quality 0..1 from the minigame, so a perfect minigame adds skill/2).

   Difficulty only changes the DEFENDER (rating shift) and minigame windows.
   Arcade speeds, dribble moves and fast-break odds are at the bottom (BALANCE.arcade).
   ===================================================================== */
const BALANCE = {
  minPct: 5, maxPct: 95,
  /* Diminishing returns: points above `knee` count at `slope`. 99 → 70 + 29×0.55 ≈ 86. */
  dr: { knee: 70, slope: 0.55 },

  /* off: your stats (weights). def: the defender's stats (weights).
     base: % when you and the defender are equal. k: % per rating point of difference.
     skill: how far minigame performance can move the final result (± skill/2).
     abs: true = no defender (free throws): pct = base + eff(stat) × k.
     req: minimum ratings to even have the option (e.g. dunking). */
  actions: {
    catch3:   { name: 'Catch & shoot 3',  off: { three: .9, iq: .1 },            def: { perD: 1 },                  base: 41, k: 0.55, skill: 34, three: true },
    catchMid: { name: 'Catch & shoot',    off: { mid: .9, iq: .1 },              def: { perD: 1 },                  base: 47, k: 0.55, skill: 32 },
    pull3:    { name: 'Pull-up 3',        off: { three: .7, handle: .3 },        def: { perD: 1 },                  base: 36, k: 0.55, skill: 34, three: true },
    pullMid:  { name: 'Pull-up jumper',   off: { mid: .7, handle: .3 },          def: { perD: 1 },                  base: 44, k: 0.55, skill: 32 },
    layup:    { name: 'Drive & layup',    off: { finish: .5, speed: .25, handle: .25 }, def: { perD: .5, intD: .5 }, base: 55, k: 0.6, skill: 30 },
    dunk:     { name: 'Drive & dunk',     off: { dunk: .5, vert: .3, str: .2 },  def: { intD: .7, vert: .3 },       base: 62, k: 0.6, skill: 30, req: { dunk: 45, vert: 40 } },
    hook:     { name: 'Post hook',        off: { finish: .55, str: .45 },        def: { intD: .6, str: .4 },        base: 51, k: 0.6, skill: 30 },
    fade:     { name: 'Post fadeaway',    off: { mid: .75, str: .25 },           def: { intD: .6, vert: .4 },       base: 44, k: 0.6, skill: 32 },
    pass:     { name: 'Pass',             off: { pass: .6, iq: .4 },             def: { perD: .5, iq: .5 },         base: 62, k: .7, skill: 30 },
    ft:       { name: 'Free throw',       off: { ft: 1 },                        def: null,                         base: 33, k: .66, skill: 46, abs: true },
    steal:    { name: 'Steal',            off: { perD: .6, speed: .4 },          def: { handle: 1 },                base: 27, k: .8, skill: 30 },
    block:    { name: 'Block',            off: { intD: .6, vert: .4 },           def: { finish: .5, str: .5 },      base: 34, k: .8, skill: 30 },
    stop:     { name: 'Stay in front',    off: { perD: .7, speed: .3 },          def: { handle: .6, speed: .4 },    base: 55, k: .8, skill: 30 },
    contest:  { name: 'Contest',          off: { perD: .7, vert: .3 },           def: { mid: .5, three: .5 },       base: 50, k: .8, skill: 30 },
    charge:   { name: 'Take the charge',  off: { iq: .6, str: .4 },              def: { str: .5, speed: .5 },       base: 38, k: .7, skill: 20 },
    rebound:  { name: 'Rebound',          off: { reb: .5, str: .25, vert: .25 }, def: { reb: .5, str: .25, vert: .25 }, base: 53, k: .8, skill: 30 },
    move:     { name: 'Dribble move',     off: { handle: .8, speed: .2 },        def: { perD: .8, speed: .2 },      base: 38, k: .8, skill: 0 },   // arcade: beat your defender
  },

  /* Situation modifiers (added to the %) */
  mods: {
    open: 10, contested: -8, heavy: -16,          // defender distance
    deep: -6, rim: 0,                              // shot distance (deep = well beyond the arc)
    shotClock: -6,                                 // ≤ 3 seconds left
    fatigue: -10,                                  // at 100 fatigue (scales linearly)
    morale: 5,                                     // at 100 confidence (+) / 0 confidence (−)
    home: 2, away: -2,
    clutch: 1.5,                                   // per 10 Clutch points above/below 50 — only in clutch time
    fire: 6,                                       // On Fire
  },
  /* ---------- DIFFICULTY (only Pro and Hall of Fame; Pro is the default) ----------
     defense: shifts the defender's ratings in every % (and the opponent's shooting vs you).
     window:  minigame timing windows (× size). checks: % added to story stat checks.
     xp:      XP multiplier. opp: season opponents' team rating shift.
     arcade:  AI opponents in arcade play — react = seconds between decisions (lower = sharper),
              steal / block = how often they gamble, shotQ = their release quality (0..1),
              shootAt = the % they need before they shoot, moves = how often they use dribble moves,
              help = how often a help defender rotates to the rim. Your AI teammates always use Pro. */
  difficulty: {
    pro: { defense: -2, window: 1.08, checks: 2,  xp: 1.0,  opp: -1,
           arcade: { react: .62, steal: .2,  shotQ: .5,  block: .38, shootAt: 45, moves: .22, help: .38 } },
    hof: { defense: 6,  window: .8,   checks: -7, xp: .85,  opp: 4,
           arcade: { react: .4,  steal: .3,  shotQ: .63, block: .5,  shootAt: 42, moves: .42, help: .6 },
           /* early-career easing in arcade play: at Overall ≤ ovr[0] the AI is only `ai` of the way from Pro to
              Hall of Fame and your shots get +shot%; both fade out by Overall ovr[1] */
           arcadeEase: { ovr: [45, 66], ai: .45, shot: 5 } },
  },

  /* ---------- ARCADE (fast breaks + pickup games) ----------
     All speeds are in canvas pixels (the arcade court is 384×216; the floor is ~350 px wide). */
  arcade: {
    pace: {
      game: 1,                               // MASTER SPEED: .85 = 15% slower everything, 1.15 = faster
      run: spd => 34 + spd * .3,             // top speed (px/s) from Speed — 60 Speed ≈ 52 px/s
      withBall: .9,                          // dribbling = 90% of top speed
      accel: 5.5,                            // how fast players reach top speed / stop
      pass: 145,                             // pass speed (px/s)
      passTime: [.34, .8],                   // min / max pass flight time (s)
      shotFlight: d => .85 + d / 230,        // jump shot hang time (s) from distance to the rim
      gravity: 185,                          // px/s² — lower = floatier jumps
      jump: vert => 92 + vert * .45,         // take-off speed from Vertical
      gather: .16,                           // crouch before a jump shot (s)
      dribble: { stand: .52, run: .38 },     // seconds per dribble bounce
      aiThink: 1,                            // × AI reaction time (1.2 = AI 20% slower)
      slowmo: .3,                            // speed during big-dunk / ankle-breaker slow motion
      shotClock: 14,                         // pickup games (s)
      breakClock: 8,                         // fast break: seconds before the defense is set
      afterScore: 1.5,                       // pause after a basket (s)
      stamina: { regen: 7, move: 12, slide: 6 },   // stamina regen /s; cost of a dribble move / defensive slide
    },
    /* DRIBBLE MOVE button (replaces turbo). Which moves you have depends on Ball Handling (+ archetype). */
    moves: {
      cooldown: .95,                         // seconds between moves
      burst: 1.7, burstTime: .45,            // speed × and duration of the burst after a move
      range: 30,                             // a defender this close can be beaten / frozen
      freeze: .65, ankles: 1.9,              // seconds a beaten / ankle-broken defender is stuck
      spamWindow: 1.6,                       // pressing again this soon (or during cooldown) counts as spamming
      lose: { base: 2, spam: 18, lowHandle: .35, tired: 8 },   // % to lose the ball: base + per spam press + per Handling point under 60 + when out of stamina
      ankleBase: 4, ankleSpecial: 12, ankleTier: 2.5,          // % of beats that become ankle-breakers (+ Emperor Eye, + per move tier)
      list: {
        hesi:  { name: 'HESITATION',       handle: 0,  tier: 0, beat: -4, dur: .42 },
        cross: { name: 'CROSSOVER',        handle: 40, tier: 1, beat: 0,  dur: .36 },
        btl:   { name: 'BETWEEN THE LEGS', handle: 52, tier: 2, beat: 3,  dur: .4 },
        btb:   { name: 'BEHIND THE BACK',  handle: 63, tier: 3, beat: 5,  dur: .42 },
        spin:  { name: 'SPIN MOVE',        handle: 72, tier: 3, beat: 6,  dur: .48 },
      },
      /* archetypes lower the Handling a move needs */
      arch: { lightning: { btl: -12, btb: -14, spin: -10 }, emperor: { all: -20 }, formless: { spin: -16, btb: -10 }, copycat: { all: -10 },
              phantom: { btb: -12 }, sky: { spin: -10 }, bruiser: { spin: -24 }, ironheart: { spin: -24 }, titan: { spin: -22 } },
    },
    /* ARCADE SEGMENTS: every game in choices mode switches to arcade play for single possessions.
       min / match / pickup: segments per game (never below min; a random target in the range, spread across the game).
       If a stretch of the game has no segment yet, the game creates one from `mix` (a steal, loose ball, broken play…).
       chance: odds that a natural event turns into a segment (fast breaks also × your team's pace, Speed + archetype).
       clocks: seconds on the clock for each segment type ([min, max] = random in range). */
    segments: {
      min: 3, match: [3, 5], pickup: [3, 4], max: 6,
      chance: { steal: .85, block: .6, dreb: .45, mateDreb: .7, putback: .35, buzzer: .45 },
      mix: { fastbreak: 3, loose: 2.5, broken: 2, putback: 2 },
      clocks: { fastbreak: 8, loose: 8, broken: [5, 7], putback: 5, buzzer: [4, 8], final: [6, 12] },
    },
    foul: 12,                                // % a contested layup / dunk draws a foul
  },
};
/* Difficulty values feed the rest of the game */
BALANCE.defense = {};
for (const k in BALANCE.difficulty) {
  const d = BALANCE.difficulty[k]; BALANCE.defense[k] = d.defense;
  if (typeof DIFFICULTY !== 'undefined' && DIFFICULTY[k]) Object.assign(DIFFICULTY[k], { pct: d.checks, window: d.window, xp: d.xp, opp: d.opp });
}

const Balance = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eff = v => (v <= BALANCE.dr.knee ? v : BALANCE.dr.knee + (v - BALANCE.dr.knee) * BALANCE.dr.slope);
  const NAMES = typeof ATTR_BY_KEY !== 'undefined' ? ATTR_BY_KEY : {};
  function blend(stats, w) { let t = 0, tw = 0; for (const k in w) { t += (stats[k] != null ? stats[k] : 50) * w[k]; tw += w[k]; } return t / tw; }
  const mainStat = w => Object.entries(w).sort((a, b) => b[1] - a[1])[0][0];

  /* A full stat line from one rating (for defenders, teammates, AI players). */
  function profile(rating, over = {}) {
    const o = {}; const keys = ['three', 'mid', 'ft', 'finish', 'dunk', 'handle', 'pass', 'speed', 'vert', 'str', 'stam', 'perD', 'intD', 'reb', 'iq', 'clutch'];
    keys.forEach(k => o[k] = rating); return Object.assign(o, over);
  }
  /* Effective stats for the player (gear, injuries applied). */
  function userStats(s) { const o = {}; ATTRS.forEach(a => o[a.k] = Engine.attr(s, a.k)); return o; }
  function available(action, stats) { const A = BALANCE.actions[action]; if (!A || !A.req) return true; for (const k in A.req) if ((stats[k] || 0) < A.req[k]) return false; return true; }

  /* ctx: { def: defender stats, diff:'pro', contest: 'open'|'normal'|'contested'|'heavy', deep, shotClock, fatigue (0-100),
            morale (0-100), venue: 'home'|'away', clutch: bool, fire: bool, bonus: [{label, v}] } */
  function pct(action, off, ctx = {}) {
    const A = BALANCE.actions[action], M = BALANCE.mods, parts = [];
    if (!A) return { pct: 50, parts };
    const mine = eff(blend(off, A.off)), ms = mainStat(A.off);
    let p;
    if (A.abs || !ctx.def) {
      p = A.abs ? A.base + mine * A.k : A.base;
      parts.push({ label: `${(NAMES[ms] || { n: ms }).n} ${Math.round(off[ms])}`, v: null });
    } else {
      const dShift = (ctx.diff && BALANCE.defense[ctx.diff]) || 0;   // only when the defender is an opponent (diff given)
      const theirs = eff(blend(ctx.def, A.def) + dShift), ds = mainStat(A.def);
      p = A.base + (mine - theirs) * A.k;
      parts.push({ label: `${(NAMES[ms] || { n: ms }).n} ${Math.round(off[ms])}`, v: null });
      parts.push({ label: `vs ${(NAMES[ds] || { n: ds }).n} ${Math.round(ctx.def[ds] + dShift)}`, v: Math.round((mine - theirs) * A.k) });
    }
    const add = (label, v) => { if (v) { p += v; parts.push({ label, v: Math.round(v) }); } };
    if (ctx.contest === 'open') add('Open', M.open);
    if (ctx.contest === 'contested') add('Contested', M.contested);
    if (ctx.contest === 'heavy') add('Heavily contested', M.heavy);
    if (ctx.deep) add('Deep range', M.deep);
    if (ctx.shotClock) add('Shot clock', M.shotClock);
    if (ctx.fatigue) add('Tired', M.fatigue * ctx.fatigue / 100);
    if (ctx.morale != null) add(ctx.morale >= 50 ? 'Confident' : 'Shaky', M.morale * (ctx.morale - 50) / 50);
    if (ctx.venue === 'home') add('Home crowd', M.home); else if (ctx.venue === 'away') add('Road crowd', M.away);
    if (ctx.clutch) add('Clutch', M.clutch * ((off.clutch || 50) - 50) / 10);
    if (ctx.fire) add('On fire', M.fire);
    (ctx.bonus || []).forEach(b => add(b.label, b.v));
    return { pct: Math.round(clamp(p, BALANCE.minPct, BALANCE.maxPct)), parts };
  }
  /* Minigame performance moves the result. quality 0..1 (0.5 = neutral). */
  function apply(action, base, quality) {
    const A = BALANCE.actions[action] || { skill: 30 };
    return Math.round(clamp(base + ((quality == null ? .5 : quality) - .5) * A.skill, BALANCE.minPct, BALANCE.maxPct));
  }
  function roll(p) { return Math.random() * 100 < p; }
  /* "Three-Point 72 · vs Perimeter D 58 +10% · Contested −8%" */
  function describe(parts) { return parts.map(x => x.v == null ? x.label : `${x.label} ${x.v > 0 ? '+' : '−'}${Math.abs(x.v)}%`).join(' · '); }

  return { pct, apply, roll, profile, userStats, available, describe, eff, blend };
})();
