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
    jelly:    { name: 'Jelly layup',      off: { finish: .5, handle: .35, vert: .15 }, def: { perD: .55, intD: .3, vert: .15 }, base: 52, k: 0.55, skill: 32 },   // touch over power: rim protectors count less (BALANCE.jelly)
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
    scramble: { name: 'Loose-ball scramble', off: { speed: .4, vert: .3, str: .3 }, def: { speed: .4, vert: .3, str: .3 }, base: 50, k: .8, skill: 20 },   // arcade: who comes up with a 50/50 ball
    save:     { name: 'Save the ball',    off: { speed: .5, iq: .3, vert: .2 }, def: null,                base: 6,  k: .62, skill: 40, abs: true },   // close call: dive before it goes out
    touch:    { name: 'Shooter\'s touch', off: { finish: .4, mid: .4, clutch: .2 }, def: null,              base: 12, k: .6,  skill: 40, abs: true },   // close call: ball rolling around the rim
    move:     { name: 'Dribble move',     off: { handle: .8, speed: .2 },        def: { perD: .8, speed: .2 },      base: 38, k: .8, skill: 0 },   // arcade: beat your defender
  },

  /* JELLY LAYUP — the underhand wrist-flick finish that curls around a shot blocker and spins up off the glass.
     A little lower than a layup when you're open (actions.jelly + distance adj), much better against a rim protector:
       contestFactor: how much of a contest still counts (× contested / heavy penalties)
       blockFactor:   × block chance vs a normal layup (arcade + choices)      wrongBlock: chance you're blocked flicking toward his arm
       offer:         choices mode offers it after the blow-by when you're cut off / contested or help is coming
       flick:         the flick minigame: side-choice window (s, Ball Handling stretches it) and timing tolerance (s, Finishing widens it)
       levels:        Weapon Training upgrades it: name + bonus % at each level */
  jelly: { contestFactor: .32, blockFactor: .3, wrongBlock: .7, offer: ['contested', 'heavy'],
           flick: { window: [.65, 1.15], tol: [.08, .14] },
           levels: [{ name: 'Jelly Layup', bonus: 0 }, { name: 'Reverse Jelly', bonus: 3 }, { name: 'Under-the-Arm Jelly', bonus: 6 }] },

  /* SHOT DISTANCE — how far from the rim (feet) sets the starting % of every shot: choices, minigames and arcade, for you and everyone.
     curve:     [feet, %] for an AVERAGE shooter (50 shooting vs a 50 defender) who is OPEN; in between it's interpolated.
                rim ~63 · short mid ~46 · long mid ~40 · corner three ~38 · three ~35 · deep three ~25 · logo ~13 · halfcourt ~3
     range:     beyond `from` ft, good shooters are judged from closer: (shooting stat − 50) × perPoint ft (−2 … max);
                a deep-range weapon (Logo Three, Sky-High Three) adds weaponFt more. Past fadeFrom ft that help and the
                shooter-vs-defender edge shrink, so logo range stays hard even for great shooters.
     heave / heaveMax: from `heave` ft out (halfcourt and beyond) a shot is capped at heaveMax % for everyone.
     openBonus: the 'open' bonus for shots (lightly guarded = curve − openBonus; contests take more on top).
     adj:       per shot type vs a catch-and-shoot (pull-ups are harder, dunks easier).
     byAction:  the usual distance of each shot in choices mode; deepFt for deep heaves (buzzer, "from the logo").
     green:     the perfect / green window shrinks with distance: × green[0] at the rim down to × green[1] from halfcourt. */
  distance: {
    curve: [[0, 64], [4, 60], [8, 50], [12, 46], [16, 42], [20, 40], [22, 38], [23.75, 35], [27, 25], [30, 19], [35, 13], [40, 7], [44, 3], [60, 2]],
    range: { from: 20, perPoint: .1, max: 4.5, weaponFt: 4, weapons: ['logo_three', 'sky_three'], fadeFrom: 25, fadeTo: 44 },   // fade: past fadeFrom ft, range help + skill shrink toward fadeTo
    heave: 44, heaveMax: 4, openBonus: 6,
    adj: { catch3: 0, pull3: -3, catchMid: 0, pullMid: -2, fade: -3, hook: -2, layup: 0, dunk: 8, jelly: -4 },
    byAction: { layup: 2, jelly: 3, dunk: 0, hook: 6, fade: 13, catchMid: 15, pullMid: 17, catch3: 23, pull3: 24 }, deepFt: 30,
    green: [1.15, .18, 1.6],   // window × at the rim, × from halfcourt, curve shape (higher = stays wide longer)
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
  /* ---------- PERFECT RELEASES ----------
     A perfect (green) release on a shot is worth a lot: it replaces the shot's % with `curve` (by distance in
     feet: rim → mid → three → deep → halfcourt), never lower than the normal % + `floor`. Contests still bite
     (× contested / heavy). Free throws use `ft`. Arcade contests cut a perfect shot by only `arcadeCut` of
     the usual amount. Good-but-not-perfect timing moves the normal % by (quality − .5) × skill × `goodK`;
     bad timing by × `badK` (much lower). `ai`: the chance any other player's shot is a perfect release
     (× .6–1.4 by his shooting stat), so teammates and opponents get greens too.
     SHOTS: the actions this applies to (blocks, passes, steals… keep the plain formula). */
  perfect: {
    curve: [[0, 94], [10, 93], [16, 92], [21, 90], [22, 89], [24, 87], [26, 80], [27, 70], [30, 64], [35, 44], [40, 28], [44, 18], [60, 15]],
    ft: 98, floor: 8, contested: .84, heavy: .8, arcadeCut: .45, goodK: .4, badK: 1.8, ai: .09, max: 99,
    shots: ['catch3', 'pull3', 'catchMid', 'pullMid', 'fade', 'hook', 'layup', 'jelly', 'dunk', 'ft', 'touch'],
  },

  /* ---------- WEAPONS (signature moves — see WEAPONS in js/data-game.js) ----------
     pct = base + (weapon stats − defender stats) × k + your level × perLevel + (rank − 1) × perRank + rarity bonus,
     using ONLY the stats listed on the weapon (weights) and the defender stats in `def` for its type.
     Minigames then move it by ± skill/2. Clamped to minPct–max (never automatic).
     npc: other players' weapons (teammates, opponents, stars) — dangerous, never automatic.
     ranks: upgrade costs (Skill Points) and the player level each rank needs. slots: level when weapon slot 1–4 opens. */
  weapons: {
    base: 47, k: .75, perLevel: .3, perRank: 3.5, skill: 30, max: 92,
    rarity: { common: 0, rare: 2, epic: 4, legendary: 6, mythic: 8 },
    def: { three: { perD: 1 }, mid: { perD: .7, vert: .3 }, drive: { perD: .5, intD: .5 }, dunk: { intD: .7, vert: .3 }, post: { intD: .6, str: .4 },
           pass: { perD: .5, iq: .5 }, steal: { handle: .8, iq: .2 }, block: { finish: .5, dunk: .3, str: .2 }, stop: { handle: .6, speed: .4 }, zone: null },
    npc: { base: 45, k: .7, max: 72, star: 4, charge: 2 },     // star: extra % for a team's star · charge: their makes before a weapon is ready
    ranks: { max: 5, cost: r => 2 + r * 2, level: r => (r - 1) * 3 },
    evo: { max: 4, bonus: [0, 4, 7, 10], arcade: [0, 3, 5, 8] },   // weapon evolution (story awakenings): % added at tier I–IV (arcade: on the matching action)
    slots: [1, 5, 11, 18],
    arcade: { bonus: 12, perRank: 2, aura: 4, aiUse: .4 },   // arcade: % bonus on the matching action while the aura is up (s)
  },
  /* ---------- PASSING moments (choices mode) ----------
     open: % added to the teammate's shot by how open he is. quality: a perfect pass adds up to this % to his shot.
     kinds: how often each passing moment comes up (weights). */
  passing: {
    open: { wide: 12, open: 7, normal: 0, tight: -8 }, quality: 12, lobTol: 9, hockeyOpen: 'wide',
    kinds: { kickout: 3, lob: 2, alleyoop: 1.5, giveandgo: 2, hockey: 1.2, skip: 1.5, outlet: 1.2 },
  },
  /* ---------- OTHER PLAYERS (choices mode) ----------
     moments: how often teammates / opponents get their own visible possessions (weights next to yours).
     star: a star "takes over" after `heatAt` straight buckets for `takeover` moments (+bonus %), and the
     coach asks you to guard him (askGuard = chance per defensive moment while he's hot). */
  // in-game conversations (coach / ref / rival): at most this many per game, only after something meaningful
  // (an opponent run, three misses in a row, a bad call, ankles broken, the star taking over)
  talk: { perGame: 1, every: 3 },
  /* ---------- CINEMATIC CONVERSATIONS (Cutscene.cine) — the important in-game talks become full cutscenes ----------
     every: games between cinematic talks in regular play · big: importance at which any eligible talk goes cinematic
     bigChance: chance in important games (rivalry / playoffs) when the gap isn't there yet
     halftimeDown: points behind at the half for a locker-room speech (any big game gets one) · clutchBy: margin for a clutch-timeout huddle */
  cine: { every: 3, big: 3, bigChance: .55, halftimeDown: 4, clutchBy: 4 },
  /* ---------- PROSPECT RANKINGS (js/rankings.js, prospects in js/data-prospects.js) ----------
     Everyone has ranking points (pts); the list is sorted by them. #1 starts at top, #300 at bottom (curve between them).
     You start below #300 (start). Your points move with games, story results and your Overall (perOvr per point gained).
     Other prospects drift every update (drift / trend), and now and then someone breaks out or falls off. */
  rankings: {
    size: 300, top: 1000, bottom: 120, curve: 1.3, start: 110, perOvr: 11, min: 20, max: 1250,
    game: { grade: { 'A+': 18, A: 15, 'A-': 12, 'B+': 10, B: 8, 'B-': 6, 'C+': 3, C: 1, 'C-': 0, D: -6, F: -12 }, win: 4, loss: -6,
      per10pts: 2, assists: [6, 3], efficient: [.55, 6, 3], jelly: 4, gameWinner: 10, poster: 4, importance: [1, 1.35, 1.7, 2.1], pickup: .5, sim: .45 },
    vs: { beatHigher: [6, .15, 30], loseLower: [5, .08, 18], transfer: .5 },   // [base, per rank of difference, cap]; the other prospect gains/loses transfer × your change
    drift: 5, trend: 2.5, breakout: [.01, 45, 95], falloff: [.008, 60, 120],
    flags: { summer_champ: 45, good_final: 15, beat_kai: 25, beat_kai_1v1: 25, elite_camp: 15, viral: 15, starter: 10, city_champ: 30, aau_champ: 40, state_champ: 60,
      usa_made: 50, usa_medal: 20, usa_gold: 45, usa_cut: -35, usa_missed: -15, booster_scandal: -45, police_record: -35, benched_fight: -20, scheme_once: -10, academic_probation: -15,
      conf_champ: 25, national_champ: 70, league_champ: 40, cup_champ: 45, gl_champ: 35, called_up: 45, beat_kai_c3: 30 },
    mixtape: 3,   // × the tape's recruiting bonus
    milestones: [100, 50, 10, 1],
    milestoneFx: { 100: { draftStock: 1, overseas: 1, rep: 3 }, 50: { draftStock: 1, overseas: 1, rep: 4 }, 10: { draftStock: 2, overseas: 2, rep: 6 }, 1: { draftStock: 3, overseas: 2, rep: 10 }, kai: { draftStock: 1, rep: 5 } },
    recruit: [[10, 14], [25, 10], [50, 7], [100, 4], [150, 2], [200, 0], [250, -2], [301, -4]],   // [rank at or better, recruiting score bonus]
    invite: [[10, 10], [25, 7], [50, 5], [100, 3], [200, 0], [301, -2]],                           // national team invite score bonus
    bigBoard: 60,   // Draft Big Board: prospects ranked this high are projected to be drafted
  },
  /* ---------- SUMMER JAM (3x3 with choice moments inside the live game) ----------
     first: total points before the first choice moment · every: points between them · max: choice moments (+ the clutch one)
     closeBy / lateBy: the clutch moment comes when it's within closeBy and someone is within lateBy of the target
     plans: the game plan before each round → bonuses for you (us) and against them (them), per action or `all` */
  jam: { first: [4, 7], every: [6, 9], max: 4, closeBy: 3, lateBy: 4,
    plans: {
      run:  { name: 'Run and gun', us: { layup: 4, dunk: 4, catch3: -1, pull3: -1 }, them: { all: 1 } },
      slow: { name: 'Slow it down', us: { catchMid: 3, pullMid: 3, catch3: 2, pull3: 2, layup: -1 }, them: { all: -2 } },
      lock: { name: 'Lock in on D', us: { all: -1 }, them: { all: -4 } },
    }, practice: 2 },   // in-game conversations: at most one per game, in about one game out of `every`
  /* ---------- LAYUP DRIVES: read → (gather) → release ----------
     blowBy: the defender shows a tell (lean / feet / reach / hips) toward the side he overplays — attack the other side.
       window: seconds to pick a side (Ball Handling + Speed move it from low to high end, × difficulty window)
       tell:   tell size 0..1 (Handling + Speed raise it; the defender's Perimeter D shrinks it by perD × how far above 50 he is;
               Hall of Fame takes hofTell off). At .5+ an arrow over his head shows the lean; below that only his body gives it away.
       fakeStar / fake: chance a star / anyone shows a fake tell first. cutOff: what a wrong or late read turns into.
     gather: chance per layup (+contested when cut off or contested, +help when the help defender is waiting),
       beat = seconds per step, tol = timing tolerance, clean/sloppy = layup window multiplier, travel = chance a bad gather is a travel */
  layup: {
    blowBy: { window: [.55, 1.05], tell: [.45, 1], perD: .9, hofTell: .2, fakeStar: .35, fake: .08, cutOff: { contested: .55, charge: .2, steal: .25 } },
    gather: { chance: .22, contested: .3, help: .15, beat: .34, tol: .12, clean: 1.35, sloppy: .75, travel: .45 },
  },
  others: { mate: 1.6, opp: 1.3, weaponUse: .5, star: { heatAt: 2, takeover: 3, bonus: 6, askGuard: .7 } },
  /* ---------- CLOSE CALLS (slow motion, zoom, crowd build-up + a quick reaction minigame) ----------
     chance per moment: early in the game / late in a close game (margin = "close"). max per game.
     kinds: weights. tooLate: buzzer-beater minigame quality below this = released after the horn. */
  close: { early: .05, late: .38, margin: 6, max: 4, tooLate: .22,
    kinds: { rimroll: 3, collision: 2.2, charge: 2, save: 1.6, buzzer: 1.6, clutchft: 1.2, stop: 1.4 } },

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
           arcade: { react: .62, steal: .2,  shotQ: .5,  block: .38, shootAt: 40, moves: .22, help: .38 } },
    hof: { defense: 6,  window: .8,   checks: -7, xp: .85,  opp: 4,
           arcade: { react: .4,  steal: .3,  shotQ: .63, block: .5,  shootAt: 38, moves: .42, help: .6 },
           /* early-career easing in arcade play: at Overall ≤ ovr[0] the AI is only `ai` of the way from Pro to
              Hall of Fame and your shots get +shot%; both fade out by Overall ovr[1] */
           arcadeEase: { ovr: [45, 66], ai: .45, shot: 5 } },
  },

  /* ---------- TIMING (every timing minigame + the arcade shot meter) ----------
     GREEN on screen is exactly the PERFECT window; YELLOW around it is "good". An input is judged at the moment you press
     (or let go), and also against the frame you were looking at, ± tol seconds for input delay. */
  timing: { tol: .012 },

  /* ---------- NATIONAL TEAM SELECTION CAMP (js/usa.js, js/match.js, js/arcade.js) ----------
     A big step up from high school: applies to every drill and every camp game (match nodes with camp:true).
     board: where you sit on the staff's board. You're always in the bottom `band` spots (never the safe ones):
       camp points from `perf[0]` (worst) to `perf[1]` (best) move you from the last spot up to just above the next
       cut line. The final board always has you 12th, with `bond` (the camper you bonded with) cut right below you.
       great: a day's camp points at or above this get "You were great today. So was everyone else."
     drills: the other campers' drill scores = base + offset × off ± spread.
     mg: every minigame (× size, × speed): green / perfect = shot meter + layup windows and the perfect slice,
       speed = how fast meters and beats move, zone / wobble = free-throw make zone and reticle drift,
       combo = time per dribble move (+comboLen moves), window = reaction windows (blow-by, shell defense, finish
       pick), tell = how readable the blow-by tell is (+ = easier), fake = extra fake chance, lanes = passing-lane
       window, tol = gather / dunk tolerance, push = their strength in post-ups, flick = jelly window (not the lesson).
     opp: + opponent rating in camp games. weapons: × how often opponents use weapons, cap = uses per weapon,
       charge = their makes before their star's weapon is ready.
     arcade: react × (lower = quicker AI), steal / block / shotQ / moves / help added to the AI, shootAt added,
       speed × for opponents' feet, window × your shot greens; pm: Playmaker lanes (open × how long a lane stays
       open, period × how fast it breathes, read × time to read). */
  camp: {
    board: { band: 5, perf: [-6, 24], bond: 'Cam Rivers', great: 4 },
    drills: { base: 62, off: 2.5, spread: 12 },
    mg: { green: .8, perfect: .78, speed: 1.1, zone: .85, wobble: 1.2, combo: .8, comboLen: 1, window: .8, tell: -.2, fake: .15, lanes: .76, tol: .78, push: 6, flick: .88 },
    opp: 3,
    weapons: { use: 1.7, cap: 3, charge: 1 },
    arcade: { react: .78, steal: .07, block: .1, shotQ: .06, moves: .16, help: .16, shootAt: -2, speed: 1.07, window: .84,
              pm: { open: .8, period: .82, read: .8 } },
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
    /* ARCADE SEGMENTS inside matches: at least `min` per full match, a target picked from `match`, never more than `max`.
       They're spread over the whole game (each stretch of moments owes its share) and full matches get `extraMoments`
       more moments so the choices + minigames stay the main way of playing. `mix` = created segments (weights drop each
       time a kind is used, so they don't repeat); end-of-quarter possessions and the clutch final possession come on top. */
    segments: {
      min: 5, match: [6, 8], pickup: [3, 4], max: 9, extraMoments: 2,
      chance: { steal: .85, block: .6, dreb: .45, mateDreb: .7, playmaker: .45, buzzer: .45 },
      mix: { fastbreak: 3, loose: 2.5, broken: 2.2, playmaker: 2.6 },
      clocks: { fastbreak: 8, loose: 8, broken: [5, 7], playmaker: 14, buzzer: [4, 8], final: [6, 12] },
    },
    foul: 12,                                // % a contested layup / dunk draws a foul
    /* CONTESTS — on defense, JUMP (the shoot/block button) near a shooter to contest. contest = closeness × timing × stat × (AI skill):
       range / rimRange: px from the shooter where a jump still bothers him (jumpers / layups + dunks); window: s off the ideal moment
       (your jump's peak right as he releases) before the timing bonus is gone; stand: a defender who doesn't jump still gets this much.
       Stats: Perimeter D for jump shots, Interior D + Vertical at the rim. cut: how much a perfect contest takes off his %.
       blockAt / blockK: great contests at the rim turn into blocks (dunks half as often); jumperBlock: rare blocked jumpers.
       fakeStun: jumping before he even starts his shot = faked out (stunned on landing). foulSpeed / foul: crashing into him = a foul.
       aiJump: how much more often an AI defender close to a shooter jumps to contest (on top of his block skill).
       labels: SMOTHERED! at smother+, CONTESTED! at contest+, WIDE OPEN when nobody is within `open` px. */
    contest: { range: 34, rimRange: 27, window: .36, stand: .3, aiJump: .35, cut: { jumper: .55, layup: .45, dunk: .3 }, blockAt: .58, blockK: 1.3, jumperBlock: .22,
               fakeStun: .5, foulSpeed: 58, foul: .3, labels: { smother: .5, contest: .16, open: 32 } },
    /* LOOSE BALLS + SCRAMBLES: AI players react after `react` seconds (like a person), predict the landing spot with `aim` px of error,
       and dive when within `aiDive` px. Your dive (J / SPACE / GRAB): `dive` s burst at × `diveSpeed`, grab reach `reach` (normal `grab`).
       Who comes up with it: BALANCE.actions.scramble (Speed + Vertical + Strength), × diveBonus while diving, closer = better. */
    scramble: { react: [.38, .62], aim: 14, aiDive: 24, dive: .32, diveSpeed: 2.3, reach: 20, grab: 13, diveBonus: 1.25, cooldown: .9 },
    /* PLAYMAKER (an arcade segment): you have the ball and the defense is scrambling. Time slows, the passing lanes light up and
       defenders slide in and out of them. Each teammate gets a numbered badge: press his number (or tap the badge / him) while his
       lane is open. 1 or 2 passes, then a shot: after the first pass, SPACE lets him shoot or one more number moves it again.
       The pass itself (chest, bounce, lob, skip) is picked for you from where the defenders are.
       skill = your Passing (.6) + IQ (.4) after diminishing returns, 0..1.
       slow: time scale while reading · read: seconds per read [low skill, high skill] · period: a defender's slide in/out cycle (s)
       [low, high skill] · open: share of the cycle the lane is open [low, high] · defK: Perimeter D above 50 shortens both (better
       defenders close lanes faster) · base: % through an open lane at equal ratings · k: % per point of the passer's Passing/IQ vs
       the lane defender's Perimeter D/IQ · closed: % off when his lane was closed · perfect: an open lane + a roll this far under
       the % = PERFECT PASS · steal: share of lost passes that are steals (the rest are tipped loose) · movement: look = shot % for
       the open look a scrambling defense gives up, shot = % for the second pass (BALL MOVEMENT!), open = how far (px) the shooter's
       man is left behind per pass · duo: % on a pass to a Chemistry Link duo partner · farX: px apart for a skip pass · bigAt: a
       lane defender with this Interior D (or Vertical + 4) gets a bounce pass under his arms, a smaller one a lob over his hands
       maxPasses: passes in one chain · shootAt: the % the final shooter needs to let it fly from where he caught it (below it he
       attacks the rim instead) */
    /* FINISHING AT THE RIM (you, in layup range): tap SPACE / SHOOT = layup, double-tap and hold the second tap = dunk,
       SHIFT + SPACE / JELLY = jelly. Away from the rim SPACE is still a jump shot (hold, release at the top).
       dbl: s after the first tap that a second tap still turns the layup into a dunk · hold: s to hold the second tap for the
       full slam (let go sooner = a weaker dunk) · q / qEarly: your dunk's release quality on a full hold / an early let-go ·
       tapQ: your layup and jelly release quality (a tap, no timing) · strong: % added to the strong layup you get when your
       Dunking and Vertical are too low to dunk */
    finish: { dbl: .3, hold: .3, q: .86, qEarly: .45, tapQ: .62, strong: 6 },
    playmaker: { maxPasses: 2, slow: .16, read: [3.4, 6.5], period: [1.6, 2.6], open: [.46, .7], defK: .35,
      base: 90, k: .45, closed: 42, perfect: 25, steal: .5,
      movement: { look: 8, shot: 8, open: 14 }, duo: 12, farX: 150, bigAt: 62, shootAt: 40 },
    /* ALLEY-OOPS: a teammate with Vertical + Dunking (average after diminishing returns) of minSkill or more who can get to the rim
       gets a golden OOP lane when the air is open: no rim protector within clearR px of the rim, or one whose rating (Interior D
       × def.intD + Vertical × def.vert) is under the cutter's skill + margin. A Chemistry Link duo lob always qualifies.
       Then a timing tap: lob it (or, when you're the one cutting, jump) as he takes off.
       pct = base + (Passing × w.pass + his Vertical × w.vert + his Dunking × w.dunk − the rim protector's rating) × k (+ the duo
       bonus), clamped min..max (noProt = the rating when nobody is back) · timing: within perfect s (scaled up from [low, high] as
       the % goes from 40 to 90) = a clean catch and slam every time; within good s = roll the %; worse = roll the % × badK, and a
       miss is a fumbled catch (late lob / early jump), a deflection (rim protector within deflectR px) or a lob he can't finish
       takeoff: [px out from the rim, px below it] where he leaves the floor · rise: s from takeoff to the catch at the peak (he
       hangs there if the ball is late) · minFlight: shortest lob (s) · arc: px the lob floats above its ends · auto: s after
       takeoff before a lob / jump goes off by itself (late) · hold: s he holds it overhead before the slam · sprint: speed on the cut (faster when it's far: he gets there in runMax s)
       slow: time scale while you wait to time it / while the lob floats / at the catch
       aiThrow: chance a teammate lobs it to you when you cut to the rim (moving at cutSpeed+ px/s toward it, range px from it)
       cooldown: s between those · replay: the slam gets an instant replay when it was perfect, a duo move, or yours */
    oop: { minSkill: 58, clearR: 30, margin: 6, w: { pass: .4, vert: .3, dunk: .3 }, def: { intD: .6, vert: .4 }, noProt: 30,
      base: 62, k: .6, min: 8, max: 95, perfect: [.05, .09], good: [.12, .2], badK: .25, deflectR: 46,
      takeoff: [24, 14], rise: .5, minFlight: .3, arc: 22, auto: .3, hold: .12, sprint: 1.25, runMax: .7,
      slow: { run: .5, flight: .6, catch: .22 }, aiThrow: .55, cutSpeed: 22, range: [36, 140], cooldown: 4 },
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
    // shots start from the distance curve (BALANCE.distance) instead of a flat base
    const D = BALANCE.distance, SHOT = !!(D && D.adj[action] != null && !A.abs);
    const dist = SHOT ? (ctx.dist != null ? ctx.dist : ctx.deep ? D.deepFt : D.byAction[action]) : null;
    if (SHOT) {
      let de = dist;
      const fade = clamp((D.range.fadeTo - dist) / (D.range.fadeTo - D.range.fadeFrom), 0, 1);   // range help and shooting skill matter less and less way out
      if (dist > D.range.from) { const st = (A.three ? off.three : off.mid) || 50; de = Math.max(D.range.from, dist - (clamp((st - 50) * D.range.perPoint, -2, D.range.max) + (ctx.longRange ? D.range.weaponFt : 0)) * Math.max(fade, .45)); }
      const skill = p - A.base;
      p = curveAt(D.curve, de) + D.adj[action] - D.openBonus + skill * (dist > D.range.fadeFrom ? .4 + .6 * fade : 1);
      parts.splice(1, 0, { label: `${Math.round(dist)} ft${de < dist - .5 ? ` (range of ${Math.round(de)})` : ''}`, v: null });
    }
    const add = (label, v) => { if (v) { p += v; parts.push({ label, v: Math.round(v) }); } };
    if (ctx.contest === 'open') add('Open', SHOT ? D.openBonus : M.open);
    const cf = action === 'jelly' ? BALANCE.jelly.contestFactor : 1;   // the jelly curls around a contest
    if (ctx.contest === 'contested') add('Contested', M.contested * cf);
    if (ctx.contest === 'heavy') add('Heavily contested', M.heavy * cf);
    if (ctx.deep && !SHOT) add('Deep range', M.deep);
    if (ctx.shotClock) add('Shot clock', M.shotClock);
    if (ctx.fatigue) add('Tired', M.fatigue * ctx.fatigue / 100);
    if (ctx.morale != null) add(ctx.morale >= 50 ? 'Confident' : 'Shaky', M.morale * (ctx.morale - 50) / 50);
    if (ctx.venue === 'home') add('Home crowd', M.home); else if (ctx.venue === 'away') add('Road crowd', M.away);
    if (ctx.clutch) add('Clutch', M.clutch * ((off.clutch || 50) - 50) / 10);
    if (ctx.fire) add('On fire', M.fire);
    (ctx.bonus || []).forEach(b => add(b.label, b.v));
    if (SHOT && dist >= D.heave) p = Math.min(p, D.heaveMax + (ctx.longRange ? 1 : 0));   // halfcourt and beyond: barely ever
    return { pct: Math.round(clamp(p, SHOT && dist >= 27 ? 1 : BALANCE.minPct, BALANCE.maxPct)), parts, dist };
  }
  function curveAt(C, x) { if (x <= C[0][0]) return C[0][1]; for (let i = 1; i < C.length; i++) if (x <= C[i][0]) { const [a, pa] = C[i - 1], [b, pb] = C[i]; return pa + (pb - pa) * (x - a) / (b - a); } return C[C.length - 1][1]; }
  /* the perfect window at this distance (× of the normal one) */
  function greenAt(dist) { const D = BALANCE.distance, G = D.green; if (dist == null) return 1; return clamp(G[0] - (G[0] - G[1]) * Math.pow(clamp(dist / D.heave, 0, 1), G[2] || 1), G[1], G[0]); }
  /* Minigame performance moves the result. quality 0..1 (0.5 = neutral). */
  /* o: { perfect, contest: 'open'|'normal'|'contested'|'heavy' } — a perfect release on a shot uses BALANCE.perfect */
  function perfectPct(action, base, dist, contest) {
    const PF = BALANCE.perfect, D = BALANCE.distance;
    let p = action === 'ft' ? PF.ft : curveAt(PF.curve, dist != null ? dist : (D.byAction[action] != null ? D.byAction[action] : 3));
    p *= contest === 'heavy' ? PF.heavy : contest === 'contested' ? PF.contested : 1;
    return Math.round(clamp(Math.max(p, (base || 0) + PF.floor), 1, PF.max));
  }
  function apply(action, base, quality, dist, o = {}) {
    const A = BALANCE.actions[action] || { skill: 30 }, D = BALANCE.distance, far = dist != null && dist >= 27, PF = BALANCE.perfect, shot = PF && PF.shots.includes(action);
    const q = quality == null ? .5 : quality;
    if (shot && (o.perfect || q >= .999)) return perfectPct(action, base, dist, o.contest);   // a GREEN: most of them go in
    const p = base + (q - .5) * A.skill * (far ? .6 : 1) * (shot ? (q < .5 ? PF.badK : PF.goodK) : 1);   // timing matters less on heaves…
    if (dist != null && dist >= D.heave) return Math.round(clamp(p, 1, D.heaveMax * 2));    // …and halfcourt stays a prayer
    return Math.round(clamp(p, far ? 1 : BALANCE.minPct, BALANCE.maxPct));
  }
  function roll(p) { return Math.random() * 100 < p; }
  /* "Three-Point 72 · vs Perimeter D 58 +10% · Contested −8%" */
  function describe(parts) { return parts.map(x => x.v == null ? x.label : `${x.label} ${x.v > 0 ? '+' : '−'}${Math.abs(x.v)}%`).join(' · '); }

  return { pct, apply, perfectPct, roll, profile, userStats, available, describe, eff, blend, curveAt, greenAt };
})();

/* ---------- named players: stats with a style + their weapons ---------- */
const Weapons = (() => {
  const W = () => BALANCE.weapons;
  const hash = str => { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const ROLE_OF = { three: 'shooter', mid: 'shooter', drive: 'slasher', dunk: 'big', post: 'big', pass: 'playmaker', steal: 'stopper', stop: 'stopper', block: 'big', zone: 'slasher' };
  const POOL = { shooter: ['logo_three', 'step_back', 'barrier_jumper', 'spin_fade'], slasher: ['euro_step', 'floater', 'vanishing_drive', 'lightning_dribble'], big: ['post_fade', 'sky_hook', 'poster_dunk', 'chase_block', 'lob_threat'], playmaker: ['no_look', 'ignite_pass', 'step_back'], stopper: ['lockdown', 'pickpocket', 'chase_block'] };
  /* 1–2 weapons for any player: the PLAYER_WEAPONS list, else picked from the name (stable) */
  function forName(name, star) {
    if (typeof PLAYER_WEAPONS !== 'undefined' && PLAYER_WEAPONS[name]) return PLAYER_WEAPONS[name].slice();
    const h = hash(name), roles = Object.keys(POOL), role = roles[h % roles.length], pool = POOL[role];
    const a = pool[(h >>> 4) % pool.length], b = pool[(h >>> 9) % pool.length];   // >>> (unsigned): '>>' turned big hashes negative → undefined weapons → crashes
    return star || (h >>> 13) % 3 === 0 ? [...new Set([a, b])] : [a];
  }
  const roleOf = ids => { const c = {}; ids.forEach(id => { const w = WEAPONS[id]; if (w) c[ROLE_OF[w.type]] = (c[ROLE_OF[w.type]] || 0) + 1; }); return Object.entries(c).sort((x, y) => y[1] - x[1])[0]?.[0] || 'slasher'; };
  const STYLE = {
    shooter: { three: 9, mid: 6, ft: 6, intD: -6, reb: -5, str: -4 }, slasher: { finish: 7, speed: 6, handle: 5, three: -5 },
    big: { intD: 9, reb: 9, str: 8, dunk: 6, vert: 3, three: -12, handle: -8, speed: -4 }, playmaker: { pass: 10, iq: 7, handle: 6, str: -5 },
    stopper: { perD: 10, speed: 4, iq: 3, three: -4 },
  };
  /* a named player's stat line: team rating + his style (+ a little for stars) */
  function npc(name, rating, star) {
    const ids = forName(name, star).filter(id => WEAPONS[id]), role = roleOf(ids), st = Balance.profile(rating + (star ? W().npc.star : 0)), adj = STYLE[role] || {};
    for (const k in adj) st[k] = Math.max(20, Math.min(99, st[k] + adj[k]));
    return { stats: st, weapons: ids, role };
  }
  /* success % of a weapon. o: { def: defender stats, level, rank, npc, star, diff, bonus:[{label,v}] } */
  function pct(id, stats, o = {}) {
    const w = WEAPONS[id], C = W(); if (!w) return { pct: 50, parts: [] };
    const parts = [], eff = Balance.eff, mine = eff(Balance.blend(stats, w.stats)), main = Object.entries(w.stats).sort((a, b) => b[1] - a[1])[0][0];
    const base = o.npc ? C.npc.base : C.base, k = o.npc ? C.npc.k : C.k, dw = C.def[w.type];
    let p;
    const NM = typeof ATTR_BY_KEY !== 'undefined' ? ATTR_BY_KEY : {};
    parts.push({ label: `${w.name}: ${Object.keys(w.stats).map(s => (NM[s] ? NM[s].s : s) + ' ' + Math.round(stats[s] || 50)).join(' · ')}`, v: null });
    if (dw && o.def) { const dShift = (o.diff && BALANCE.defense[o.diff]) || 0, theirs = eff(Balance.blend(o.def, dw) + dShift); p = base + (mine - theirs) * k; parts.push({ label: 'vs defender', v: Math.round((mine - theirs) * k) }); }
    else { p = base + (mine - 50) * k * .6; }
    const add = (label, v) => { if (v) { p += v; parts.push({ label, v: Math.round(v) }); } };
    if (!o.npc) { add('Your level', (o.level || 1) * C.perLevel); add(`Rank ${o.rank || 1}`, ((o.rank || 1) - 1) * C.perRank); if (o.evo > 1) add(`Tier ${ROMAN[o.evo]}`, C.evo.bonus[o.evo - 1] || 0); }
    add(RARITY[w.rarity].name, C.rarity[w.rarity] || 0);
    if (o.star) add('Star', C.npc.star);
    (o.bonus || []).forEach(b => add(b.label, b.v));
    return { pct: Math.round(Math.max(BALANCE.minPct, Math.min(o.npc ? C.npc.max : C.max, p))), parts };
  }
  /* weapon evolution: "Ignite Pass II: Overdrive" (WEAPON_EVO in js/data-game.js) */
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  function suffix(id, evo) { const w = WEAPONS[id], E = typeof WEAPON_EVO !== 'undefined' ? WEAPON_EVO : { id: {}, type: {} }; if (!w || !(evo > 1)) return ''; const L = E.id[id] || E.type[w.type] || ['Awakened', 'Ascended', 'Transcendent']; return L[Math.min(L.length, evo - 1) - 1]; }
  function name(id, evo) { const w = WEAPONS[id]; if (!w) return ''; return evo > 1 ? `${w.name} ${ROMAN[evo]}: ${suffix(id, evo)}` : w.name; }
  /* which weapon fits a situation: action → weapon types that can be used for it */
  const FITS = { catch3: ['three'], pull3: ['three'], catchMid: ['mid'], pullMid: ['mid'], fade: ['mid', 'post'], hook: ['post'], layup: ['drive'], dunk: ['dunk', 'drive'], pass: ['pass'], steal: ['steal'], block: ['block'], stop: ['stop', 'steal'], contest: ['stop', 'block'] };
  const fits = (id, action) => { const w = WEAPONS[id]; return !!w && (FITS[action] || []).includes(w.type); };
  return { forName, npc, pct, fits, roleOf, FITS, hash, name, suffix, ROMAN };
})();
