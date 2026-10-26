/* =====================================================================
   AUDIO.JS — every sound is synthesized live with the Web Audio API.
   SFX.play('swish'), SFX.music('game'), SFX.setVol('music', 0.5), SFX.skip()

   MUSIC: a small procedural band. Each song below is plain data (tempo, key,
   chord progression, drum patterns, instruments). Songs have an intro, A and B
   sections with drum fills, and rotate to another song of the same mood
   after ~32 bars. Edit SONGS to add or change tracks.
   ===================================================================== */

/* ---------- SONG LIST (moods: menu, hub, story, game, clutch, build, victory, sad) ----------
   root: MIDI note of the key (45 = A2). scale: see SCALES. prog: scale degrees (0 = i/I).
   drums: 16-step patterns. 'x' = hit, 'o' = soft hit, '.' = rest.
     k kick, s snare, c clap, h closed hat, oh open hat, r rimshot
   bass: '.'=rest, 'x'=root, 'o'=octave up, '5'=fifth.  bassType: sub | saw | 808 | pluck
   keys: pad | ep | stab | none (keysPat = when stabs/ep hit).  lead: pluck | bell | saw | arp | none
   rolls: trap hi-hat rolls. crackle: vinyl noise. kick808: long trap kick. gain: volume trim so songs sit at a similar loudness. */
const SONGS = [
  // ---------------- MENU ----------------
  { name: 'Concrete Dreams', gain: 0.55, mood: 'menu', bpm: 140, swing: 0, root: 45, scale: 'minor', prog: [0, 5, 2, 6], barsPerChord: 2,
    drums: { k: 'x.......x.x.....', c: '........x.......', h: 'x.x.x.x.x.x.x.x.', oh: '.......x........' },
    drumsB: { k: 'x.....x.x.x...x.', c: '........x.......', h: 'xxx.x.x.xxx.x.xx', oh: '......x.......x.' },
    bass: 'x.........x.....', bassType: '808', keys: 'pad', lead: 'bell', leadDensity: .35, rolls: true, kick808: true },
  { name: 'Tip-Off', gain: 1.1, mood: 'menu', bpm: 92, swing: .14, root: 41, scale: 'dorian', prog: [0, 3, 0, 4],
    drums: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', r: '...........o....' },
    drumsB: { k: 'x.....x.x..x....', s: '....x.......x..o', h: 'x.x.x.xxx.x.x.x.', oh: '..............x.' },
    bass: 'x.....x.x.....o.', bassType: 'sub', keys: 'ep', keysPat: 'x.....x...x.....', lead: 'pluck', leadDensity: .4 },
  // ---------------- HUB ----------------
  { name: 'Halsey Nights', gain: 0.85, mood: 'hub', bpm: 78, swing: .2, root: 50, scale: 'dorian', prog: [0, 3, 6, 4],
    drums: { k: 'x......xx.......', s: '....x.......x...', h: 'x.o.x.o.x.o.x.o.' },
    drumsB: { k: 'x......xx.x.....', s: '....x.......x...', h: 'x.oxx.o.x.oxx.o.', oh: '..............o.' },
    bass: 'x......x........', bassType: 'sub', keys: 'ep', keysPat: 'x.......x.......', lead: 'bell', leadDensity: .22, crackle: true },
  { name: 'Rec Center', gain: 0.8, mood: 'hub', bpm: 86, swing: .16, root: 48, scale: 'major', prog: [3, 4, 2, 5],
    drums: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    drumsB: { k: 'x.....x.x.x.....', s: '....x.......x...', h: 'x.xxx.x.x.xxx.x.', r: '..o.......o.....' },
    bass: 'x.......x.o.....', bassType: 'sub', keys: 'ep', keysPat: 'x.....x.........', lead: 'pluck', leadDensity: .3, crackle: true },
  { name: 'Fifth Street', gain: 1.4, mood: 'hub', bpm: 90, swing: .1, root: 43, scale: 'minor', prog: [0, 0, 5, 4],
    drums: { k: 'x..x......x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', r: '.......o........' },
    drumsB: { k: 'x..x..x...x..x..', s: '....x.......x...', h: 'xxx.x.x.xxx.x.x.' },
    bass: 'x..x......x.....', bassType: 'saw', keys: 'stab', keysPat: 'x.......x.......', lead: 'pluck', leadDensity: .28 },
  // ---------------- STORY ----------------
  { name: 'Mama Jo', gain: 1.4, mood: 'story', bpm: 70, swing: .08, root: 48, scale: 'major', prog: [0, 4, 5, 3],
    drums: { k: '', h: '' }, drumsB: { k: 'x.......x.......', h: '....o.......o...' },
    bass: 'x.......x.......', bassType: 'sub', keys: 'pad', lead: 'bell', leadDensity: .3 },
  { name: 'Old Man Lou', gain: 1.5, mood: 'story', bpm: 74, swing: .22, root: 45, scale: 'dorian', prog: [0, 3, 0, 4],
    drums: { k: 'x.......x.......', h: 'o.o.o.o.o.o.o.o.' }, drumsB: { k: 'x.......x..x....', s: '....o.......o...', h: 'o.ooo.o.o.ooo.o.' },
    bass: 'x...x...x...5...', bassType: 'pluck', keys: 'ep', keysPat: 'x.......x.......', lead: 'none' },
  // ---------------- GAME ----------------
  { name: 'Full Court Press', gain: 1.1, mood: 'game', bpm: 100, swing: 0, root: 40, scale: 'minor', prog: [0, 5, 6, 4],
    drums: { k: 'x..x..x...x.....', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', oh: '..x.......x.....' },
    drumsB: { k: 'x..x..x...x..x..', c: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', oh: '..x...x...x...x.' },
    bass: 'x..x..x...x..o..', bassType: 'saw', keys: 'stab', keysPat: 'x.....x...x.....', lead: 'saw', leadDensity: .35 },
  { name: 'Shot Clock', gain: 1.0, mood: 'game', bpm: 112, swing: .08, root: 43, scale: 'dorian', prog: [0, 3, 4, 3],
    drums: { k: 'x.....x...x.....', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', r: '.......x......x.' },
    drumsB: { k: 'x.x...x...x.x...', c: '....x.......x..x', h: 'x.xxx.x.x.xxx.xx', oh: '......x.......x.' },
    bass: 'x.x...x.o.x...5.', bassType: 'pluck', keys: 'stab', keysPat: '..x...x...x...x.', lead: 'pluck', leadDensity: .45 },
  { name: 'Run It Back', gain: 0.9, mood: 'game', bpm: 108, swing: 0, root: 45, scale: 'minor', prog: [0, 5, 3, 4],
    drums: { k: 'x...x...x...x...', c: '....x.......x...', h: '..x...x...x...x.' },
    drumsB: { k: 'x...x...x...x...', c: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', oh: '..x...x...x...x.' },
    bass: 'x.ox.ox.x.ox.ox.', bassType: 'saw', keys: 'pad', lead: 'arp', leadDensity: 1 },
  // ---------------- CLUTCH ----------------
  { name: 'Final Possession', gain: 0.85, mood: 'clutch', bpm: 128, swing: 0, root: 40, scale: 'harm', prog: [0, 0, 5, 4],
    drums: { k: 'x...x...x...x...', h: '..x...x...x...x.' }, drumsB: { k: 'x...x...x...x...', c: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
    bass: 'xxxxxxxxxxxxxxxx', bassType: 'saw', keys: 'pad', lead: 'bell', leadDensity: .18 },
  { name: 'Ice Veins', gain: 0.65, mood: 'clutch', bpm: 136, swing: 0, root: 41, scale: 'phryg', prog: [0, 1, 0, 6], barsPerChord: 2,
    drums: { k: 'x.......x..x....', c: '........x.......', h: 'x.x.x.x.x.x.x.x.' },
    drumsB: { k: 'x.....x.x..x....', c: '........x.......', h: 'x.xxx.x.xxx.x.xx' },
    bass: 'x.......x..x....', bassType: '808', keys: 'pad', lead: 'bell', leadDensity: .25, rolls: true, kick808: true },
  // ---------------- BUILD (cutscene tension that leads into the big moment) ----------------
  { name: 'Rising Tension', gain: 0.9, mood: 'build', bpm: 124, swing: 0, root: 40, scale: 'harm', prog: [0, 0, 5, 4],
    drums: { k: 'x.......x.......', h: '' }, drumsB: { k: 'x...x...x...x...', h: '..x...x...x...x.', c: '............x...' },
    bass: 'x.x.x.x.x.x.x.x.', bassType: 'saw', keys: 'pad', lead: 'bell', leadDensity: .12 },
  // ---------------- VICTORY ----------------
  { name: 'Banner Night', gain: 0.85, mood: 'victory', bpm: 116, swing: 0, root: 48, scale: 'major', prog: [0, 4, 5, 3],
    drums: { k: 'x...x...x...x...', c: '....x.......x...', h: '..x...x...x...x.' },
    drumsB: { k: 'x...x...x...x...', c: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', oh: '..x...x...x...x.' },
    bass: 'x.o.x.o.x.o.x.o.', bassType: 'saw', keys: 'pad', lead: 'saw', leadDensity: .5 },
  { name: 'Champions Parade', gain: 1.25, mood: 'victory', bpm: 98, swing: .1, root: 43, scale: 'major', prog: [0, 3, 4, 0],
    drums: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    drumsB: { k: 'x.....x.x..x....', s: '....x.......x...', h: 'x.xxx.x.x.xxx.x.', oh: '..............x.' },
    bass: 'x.....x.x...o...', bassType: 'sub', keys: 'stab', keysPat: 'x...x.....x.....', lead: 'pluck', leadDensity: .5 },
  // ---------------- THEME (the chapter opening) + CHARACTER THEMES ----------------
  { name: 'Hoop Dreams (Opening)', gain: 0.8, mood: 'theme', bpm: 132, swing: 0, root: 45, scale: 'minor', prog: [0, 5, 3, 4], barsPerChord: 1,
    drums: { k: 'x...x...x..x....', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', oh: '..............x.' },
    drumsB: { k: 'x...x.x.x..x..x.', c: '....x.......x..x', h: 'xxx.x.xxx.x.xxx.', oh: '......x.......x.' },
    bass: 'x.o.x.o.x.o.x.5.', bassType: 'saw', keys: 'stab', keysPat: 'x.....x...x.....', lead: 'saw', leadDensity: .62 },
  { name: 'Cold Gold (Kai)', gain: 0.7, mood: 'kai', bpm: 120, swing: 0, root: 42, scale: 'phryg', prog: [0, 1, 0, 6],   // cold, synthetic
    drums: { k: 'x.......x.......', h: '..x...x...x...x.' }, drumsB: { k: 'x.....x.x.......', c: '........x.......', h: 'x.x.x.x.x.x.x.x.' },
    bass: 'x.x.x.x.x.x.x.x.', bassType: 'saw', keys: 'pad', lead: 'arp', leadDensity: .8 },
  { name: 'Back Porch (Lou)', gain: 1.5, mood: 'lou', bpm: 68, swing: .3, root: 43, scale: 'dorian', prog: [0, 3, 0, 4],   // warm and bluesy
    drums: { k: 'x.......x.......', h: 'o..o..o..o..o..o' }, drumsB: { k: 'x.......x..x....', s: '....o.......o...', h: 'o..o..o..o..o..o' },
    bass: 'x..5..o.x..5..o.', bassType: 'pluck', keys: 'ep', keysPat: 'x.....x.........', lead: 'pluck', leadDensity: .25, crackle: true },
  // ---------------- SAD ----------------
  { name: 'Empty Gym', gain: 1.2, mood: 'sad', bpm: 64, swing: 0, root: 45, scale: 'minor', prog: [0, 5, 2, 6],
    drums: { k: '' }, drumsB: { k: 'x...............', h: '........o.......' },
    bass: 'x...............', bassType: 'sub', keys: 'pad', lead: 'bell', leadDensity: .2 },
  { name: 'Hospital Lights', gain: 2.2, mood: 'sad', bpm: 60, swing: 0, root: 48, scale: 'minor', prog: [5, 3, 0, 4],
    drums: { k: '' }, bass: 'x.......x.......', bassType: 'sub', keys: 'ep', keysPat: 'x...x...x...x...', lead: 'none' },
];

const SFX = (() => {
  let ctx = null, master, comp, musicBus, sfxBus, noiseBuf, band = null, crowdBus = null, duckGain = null;
  const vol = { master: 0.8, music: 0.4, sfx: 0.8, muted: false };
  try { Object.assign(vol, JSON.parse(localStorage.getItem('hoopdreams_audio') || '{}')); } catch (e) { }

  function makeNoise(c) {
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function init() {
    if (ctx) { if (ctx.state === 'suspended' && !held) ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .2;
    master = ctx.createGain(); master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    noiseBuf = makeNoise(ctx);
    duckGain = ctx.createGain(); duckGain.connect(sfxBus); crowdBus = ctx.createGain(); crowdBus.gain.value = .9; crowdBus.connect(duckGain);
    loadCrowd();
    band = createBand(ctx, musicBus, noiseBuf, onSong);
    applyVol();
    if (pendingMood) music(pendingMood);
  }
  function applyVol() {
    if (!ctx) return;
    master.gain.value = vol.muted ? 0 : vol.master; Crowd.vol();
    musicBus.gain.value = vol.music; sfxBus.gain.value = vol.sfx;
    try { localStorage.setItem('hoopdreams_audio', JSON.stringify(vol)); } catch (e) { }
  }
  function setVol(k, v) { vol[k] = v; applyVol(); }
  function toggleMute() { vol.muted = !vol.muted; applyVol(); return vol.muted; }

  /* ---------- SFX primitives ---------- */
  function tone(f, dur, type = 'sine', g = 0.3, when = 0, bus = sfxBus, f2) {
    const t = ctx.currentTime + when, o = ctx.createOscillator(), a = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a); a.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, fType, f, g = 0.3, when = 0, f2, q = 1, bus = sfxBus, attack = 0.01) {
    const t = ctx.currentTime + when, src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), a = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true; flt.type = fType; flt.frequency.setValueAtTime(f, t); flt.Q.value = q;
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + attack); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(a); a.connect(bus); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  const LIB = {
    click: () => tone(900, 0.05, 'triangle', 0.12),
    hover: () => tone(1400, 0.03, 'sine', 0.04),
    swish: () => { noise(0.28, 'bandpass', 2600, 0.35, 0, 6500, 1.2); noise(0.18, 'highpass', 5000, 0.1, 0.05); },
    rim: () => { tone(520, 0.35, 'triangle', 0.2); tone(1310, 0.25, 'sine', 0.08); noise(0.08, 'bandpass', 3000, 0.15); },
    bounce: (v = 1) => { tone(110, 0.14, 'sine', 0.45 * v, 0, sfxBus, 45); noise(0.03, 'bandpass', 900, 0.06 * v, 0, 500, 1); },
    squeak: (v = 1) => { const f = 2100 + Math.random() * 500; tone(f, 0.09, 'sine', 0.07 * v, 0, sfxBus, f * 1.4); tone(f * 1.25, 0.06, 'sine', 0.05 * v, 0.07, sfxBus, f * .9); },
    whistle: () => { tone(2900, 0.45, 'sine', 0.15); tone(2960, 0.45, 'sine', 0.08); },
    buzzer: () => { if (!Crowd.oneShot('buzzer', .9)) { tone(220, 1.1, 'sawtooth', 0.14); tone(233, 1.1, 'square', 0.07); } },
    /* crowd reactions come from real recordings (Crowd.react caps how many play at once) */
    crowd: (intensity = 1) => Crowd.react(intensity >= 1.5 ? 'roar' : 'cheer', Math.min(1, .45 + intensity * .35)),
    roar: (v = 1) => Crowd.react('roar', v),
    boo: (v = 1) => Crowd.react('boo', v),
    groan: () => noise(1.2, 'lowpass', 500, 0.2, 0, 200, 0.6, sfxBus, 0.2),
    dunk: () => { tone(70, 0.4, 'sine', 0.6, 0, sfxBus, 35); LIB.rim(); noise(0.2, 'lowpass', 400, 0.4); Crowd.react('roar', 1); },
    whoosh: () => noise(0.35, 'bandpass', 400, 0.25, 0, 3000, 2),
    pass: () => { noise(0.12, 'bandpass', 1200, 0.15, 0, 2400, 2); tone(160, 0.08, 'sine', 0.25, 0.1, sfxBus, 90); },
    good: () => { tone(660, 0.12, 'triangle', 0.18); tone(990, 0.18, 'triangle', 0.15, 0.09); },
    bad: () => { tone(300, 0.2, 'sawtooth', 0.1, 0, sfxBus, 160); },
    perfect: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.05)); },
    levelup: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.08)); noise(0.6, 'highpass', 6000, 0.05, 0.3); },
    coin: () => { tone(988, 0.08, 'square', 0.08); tone(1319, 0.2, 'square', 0.08, 0.08); },
    tick: () => tone(1800, 0.03, 'square', 0.05),
    heartbeat: () => { tone(60, 0.12, 'sine', 0.5); tone(55, 0.12, 'sine', 0.35, 0.18); },
    sig: () => { noise(0.8, 'bandpass', 300, 0.3, 0, 5000, 3); [392, 523, 659, 784].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.06, i * 0.06)); },
    page: () => noise(0.12, 'highpass', 3000, 0.06),
    /* animation + cutscene sounds */
    thud: (v = 1) => { tone(90, 0.12, 'sine', 0.3 * v, 0, sfxBus, 48); noise(0.06, 'lowpass', 700, 0.08 * v); },
    slap: () => { noise(0.07, 'bandpass', 1600, 0.35, 0, 900, 1.4); tone(220, 0.08, 'triangle', 0.15, 0, sfxBus, 120); },
    ooh: () => { if (Crowd.react('ooh', 1)) return; noise(1.1, 'bandpass', 520, 0.22, 0, 820, 3, sfxBus, 0.18); noise(1.1, 'bandpass', 1050, 0.08, 0, 1500, 3, sfxBus, 0.2); },
    net: () => { noise(0.22, 'highpass', 4200, 0.12, 0, 7000, 0.8); noise(0.16, 'bandpass', 2000, 0.08, 0.04, 3200, 1); },
    shutter: (v = 1) => { noise(0.02, 'highpass', 5000, 0.12 * v); noise(0.03, 'bandpass', 2400, 0.08 * v, 0.05); },
    riser: (dur = 2) => { noise(dur, 'bandpass', 250, 0.16, 0, 6000, 2.5, sfxBus, dur * .9); tone(110, dur, 'sawtooth', 0.04, 0, sfxBus, 880); },
    impact: () => { tone(64, 1.1, 'sine', 0.7, 0, sfxBus, 28); noise(0.5, 'lowpass', 900, 0.4, 0, 120, 0.7); noise(0.06, 'highpass', 3500, 0.2); },
    stinger: () => { LIB.impact(); [0, 7, 12, 15].forEach(n => tone(110 * Math.pow(2, n / 12), 0.9, 'sawtooth', 0.045, 0.01)); },
    crack: () => { noise(0.05, 'highpass', 2500, 0.45); tone(180, 0.09, 'square', 0.12, 0, sfxBus, 60); },
    crash: () => { LIB.impact(); for (let i = 0; i < 9; i++) tone(2600 + Math.random() * 3000, 0.25, 'triangle', 0.035, 0.05 + i * 0.03); noise(0.9, 'highpass', 3000, 0.14, 0.05, 6000, 0.6); },
    thunder: () => { noise(2.8, 'lowpass', 300, 0.35, 0, 80, 0.5, sfxBus, 0.05); noise(0.4, 'lowpass', 1200, 0.2, 0, 300, 0.6); },
    engine: () => { tone(48, 2.2, 'sawtooth', 0.06, 0, sfxBus, 40); noise(2.2, 'lowpass', 220, 0.12, 0, 160, 0.6, sfxBus, 0.4); },
    beep: () => tone(1046, 0.09, 'sine', 0.06),
    write: () => { for (let i = 0; i < 4; i++) noise(0.05, 'bandpass', 3500 + Math.random() * 1500, 0.05, i * 0.07); },
    /* GREEN: a perfect release — bright two-bell chime, sparkle, soft thump (clearly not a normal make) */
    green: () => { tone(1568, 0.5, 'triangle', 0.16, 0, sfxBus); tone(2093, 0.6, 'triangle', 0.13, 0.07, sfxBus); tone(3136, 0.35, 'sine', 0.05, 0.12, sfxBus); tone(784, 0.18, 'square', 0.05, 0, sfxBus, 1568); noise(0.4, 'highpass', 7000, 0.07, 0.05, 11000, 0.6); tone(70, 0.18, 'sine', 0.25, 0, sfxBus, 45); },
    /* dialogue voice blip — v: { f: pitch, w: wave } per character */
    /* the jelly build: the wrist snap (a dry click + a rising whip), and the crowd sucking in its breath before the OOOH */
    glint: () => { tone(2637, 0.12, 'sine', 0.08); tone(3520, 0.22, 'triangle', 0.05, 0.05); tone(5274, 0.1, 'sine', 0.02, 0.08); },   // a glint in the eye
    flick: () => { noise(0.03, 'highpass', 4500, 0.22); tone(900, 0.07, 'square', 0.05, 0, sfxBus, 2400); noise(0.16, 'bandpass', 1800, 0.12, 0.02, 5200, 2); },
    gasp: () => { noise(0.5, 'bandpass', 700, 0.16, 0, 1500, 1.6, sfxBus, 0.32); noise(0.4, 'bandpass', 1500, 0.05, 0.05, 2600, 2, sfxBus, 0.3); },
    /* the jelly: a soft kiss off the glass, then a rubbery "bloop" + sparkle */
    kiss: () => { noise(0.05, 'bandpass', 4200, 0.12, 0, 2600, 3); tone(1760, 0.12, 'sine', 0.07, 0, sfxBus, 1320); tone(2640, 0.08, 'sine', 0.03, 0.01); },
    jelly: () => { tone(220, 0.28, 'sine', 0.22, 0, sfxBus, 660); tone(330, 0.22, 'triangle', 0.1, 0.05, sfxBus, 990); [1319, 1568, 2093].forEach((f, i) => tone(f, 0.16, 'triangle', 0.05, 0.12 + i * 0.05)); },
    /* story systems: a single low piano note (the lows) · the boxing-ring bell (revenge posters) · the arc title sting · quick-time taps */
    piano: () => { [110, 220, 330.5, 440.3].forEach((f, i) => tone(f, 3.2 - i * .5, i ? 'sine' : 'triangle', [.22, .12, .05, .03][i])); noise(0.03, 'lowpass', 900, 0.08); },
    bell: () => { for (let k = 0; k < 3; k++) [1150, 2470, 3330].forEach((f, i) => tone(f, 0.9 - i * .2, 'sine', [.16, .07, .04][i], k * .22)); },
    sting: () => { [0, 3, 7, 12, 15].forEach((n, i) => tone(220 * Math.pow(2, n / 12), 0.16, 'square', 0.06, i * 0.055)); tone(55, 0.7, 'sawtooth', 0.12, 0.28, sfxBus, 41); noise(0.4, 'highpass', 5000, 0.06, 0.28); },
    qte: () => tone(1320 + Math.random() * 120, 0.04, 'square', 0.05),
    rumble: () => { noise(1.6, 'lowpass', 140, 0.4, 0, 60, 0.7, sfxBus, 0.3); tone(41, 1.6, 'sine', 0.3, 0, sfxBus, 33); },
    blip: (v = {}) => tone((v.f || 300) * (0.94 + Math.random() * 0.12), 0.05, v.w || 'square', v.g || 0.035),
    /* venue ambience: one recorded loop at a time (Crowd.ambience); h = crowd excitement 0..1 */
    amb_city: h => Crowd.ambience('street', h), amb_park: h => Crowd.ambience('street', h), amb_wind: h => Crowd.ambience('street', h), amb_waves: h => Crowd.ambience('street', h), amb_rain: h => Crowd.ambience('street', h),
    amb_gym: h => Crowd.ambience('gym', h), amb_practice: h => Crowd.ambience('gym', Math.min(h, .2)), amb_arena: h => Crowd.ambience('arena', h), amb_chant: h => Crowd.ambience('arena', h),
  };

  /* =================================================================
     CROWD — real CC0 recordings in assets/audio (credits in README).
     One ambience loop at a time (seamless: each pass crossfades into the next; venues crossfade too),
     reactions (cheer / roar / ooh / boo) on top — never more than MAX at once, repeats debounced.
     Everything fades out with stopAll(); duck() lowers the crowd under dialogue and cutscenes.
     Opened from disk (file://), where fetch is blocked, it falls back to <audio> elements.
     ================================================================= */
  const Crowd = (() => {
    const FILES = { arena: 'crowd-arena', gym: 'crowd-gym', street: 'street-ambience', cheer: 'cheer', cheerGym: 'cheer-gym', roar: 'roar', ooh: 'ooh', boo: 'boo', buzzer: 'buzzer' };
    const LEN = { cheer: 3.4, cheerGym: 3.2, roar: 4.2, ooh: 2.4, boo: 3.2, buzzer: 1.9 };       // seconds of each clip we play
    const GAIN = { arena: .55, gym: .6, street: .5, cheer: .8, cheerGym: .8, roar: .75, ooh: .8, boo: .7, buzzer: .55 };
    const MAX = 2, XF = 1.6, FADE = 1.2;
    const buf = {}, files = location.protocol === 'file:';
    let amb = null, ambKind = null, level = .4, lastLevel = 0, react = [], last = {}, ducks = 0, el = {};
    const liveEls = new Set();   // <audio> fallback elements (paused / resumed with the game)
    const track = a => { liveEls.add(a); a.addEventListener('pause', () => { if (!a.__held) liveEls.delete(a); }); return a; };
    const vol1 = () => vol.muted ? 0 : vol.master * vol.sfx;
    function load() {
      if (files) { for (const k in FILES) el[k] = 'assets/audio/' + FILES[k] + '.mp3'; return; }
      for (const k in FILES) fetch('assets/audio/' + FILES[k] + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => ctx.decodeAudioData(b)).then(d => { buf[k] = d; if (k === ambKind && !amb) ambience(k, level); }).catch(() => { });
    }
    const lvlGain = k => GAIN[k] * (.55 + level * .7);
    /* a seamless loop: overlapping passes with equal-power crossfades */
    function loop(k) {
      const b = buf[k], out = ctx.createGain(), skip = .06, len = b.duration - skip * 2, xf = Math.min(XF, len / 4);
      const up = new Float32Array(32).map((_, i) => Math.sin(i / 31 * Math.PI / 2)), down = up.slice().reverse();
      out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(lvlGain(k), ctx.currentTime + FADE); out.connect(crowdBus);
      let next = ctx.currentTime + .02, alive = true; const srcs = new Set();
      const sched = () => { if (next < ctx.currentTime + .05) next = ctx.currentTime + .05;   // fell behind (throttled timers): curves in the past get clamped onto each other
        while (alive && next < ctx.currentTime + 3) { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.connect(g); g.connect(out);
        try { g.gain.setValueCurveAtTime(up, next, xf); g.gain.setValueCurveAtTime(down, next + len - xf, xf); }
        catch (e) { g.gain.cancelScheduledValues(0); g.gain.setValueAtTime(0, next); g.gain.linearRampToValueAtTime(1, next + xf); g.gain.setValueAtTime(1, next + len - xf); g.gain.linearRampToValueAtTime(0, next + len); }   // some browsers refuse touching curves: plain ramps
        s.start(next, skip, len); srcs.add(s); s.onended = () => srcs.delete(s); next += len - xf; } };
      sched(); const iv = setInterval(sched, 700);
      return { k, out, stop(f = FADE) { alive = false; clearInterval(iv); const t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + f); srcs.forEach(s => { try { s.stop(t + f + .05); } catch (e) { } }); setTimeout(() => { try { out.disconnect(); } catch (e) { } }, (f + .3) * 1000); } };
    }
    /* <audio> fallback (file://): one looping element, faded with a timer */
    function elLoop(k) { const a = track(new Audio(el[k])); a.loop = true; a.volume = 0; a.play().catch(() => { }); const o = { k, a, v: 0, t: 1 }; o.iv = setInterval(() => { o.v += (o.t * GAIN[k] * (.55 + level * .7) * vol1() - o.v) * .15; a.volume = Math.max(0, Math.min(1, o.v * (ducks ? .35 : 1))); if (o.t === 0 && o.v < .01) { clearInterval(o.iv); a.pause(); } }, 60); o.stop = () => { o.t = 0; }; return o; }
    function ambience(k, h) {
      if (h != null) setLevel(h);
      if (k === ambKind && (amb || (!files && !buf[k]))) return;
      if (amb) { amb.stop(); amb = null; }
      ambKind = k; if (!k || !ctx) return;
      if (files) { if (el[k]) amb = elLoop(k); return; }
      if (buf[k]) amb = loop(k);   // not loaded yet → starts when it is
    }
    function setLevel(h) { level = Math.max(0, Math.min(1, h)); if (!ctx || !amb || Math.abs(level - lastLevel) < .05) return; lastLevel = level; if (amb.out) { const t = ctx.currentTime; amb.out.gain.cancelScheduledValues(t); amb.out.gain.setTargetAtTime(lvlGain(amb.k), t, .6); } }
    /* reaction one-shot (cheer / roar / ooh / boo) — returns false if it can't play a recording */
    function reactTo(kind, v = 1) {
      if (!ctx) return false;
      if (kind === 'cheer' && ambKind === 'gym' && (buf.cheerGym || el.cheerGym)) kind = 'cheerGym';
      const now = ctx.currentTime; if (last[kind] && now - last[kind] < .6) return true; last[kind] = now;    // debounce repeats
      react = react.filter(r => r.end > now);
      while (react.length >= MAX) { const o = react.shift(); o.fade(); }                                  // cap: fade the oldest
      return oneShot(kind, v, true);
    }
    function oneShot(kind, v = 1, isReact) {
      if (!ctx) return false;
      const len = LEN[kind] || 3, g0 = GAIN[kind] * v;
      if (files) { if (!el[kind]) return false; const a = track(new Audio(el[kind])); a.volume = Math.min(1, g0 * vol1() * (ducks && kind !== 'buzzer' ? .4 : 1)); a.play().catch(() => { }); const t = setTimeout(() => a.pause(), len * 1000); if (isReact) react.push({ end: ctx.currentTime + len, fade: () => { clearTimeout(t); a.pause(); } }); return true; }
      const b = buf[kind]; if (!b) return false;
      const s = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime, start = kind === 'buzzer' ? 0 : Math.min(.4, Math.max(0, b.duration - len) * Math.random() * .2);
      s.buffer = b; s.connect(g); g.connect(kind === 'buzzer' ? sfxBus : crowdBus);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0, t + .06); g.gain.setValueAtTime(g0, t + len * .55); g.gain.linearRampToValueAtTime(0, t + len);
      s.start(t, start, len + .05);
      if (isReact) react.push({ end: t + len, fade: () => { const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0, n + .25); try { s.stop(n + .3); } catch (e) { } } });
      return true;
    }
    /* stop everything crowd-related (scene / game / cutscene over) */
    function stopAll() { ambience(null); react.forEach(r => r.fade()); react = []; }
    /* duck the crowd under dialogue / cutscenes (counted, so nested calls are safe) */
    function duck(on) { ducks = on === null ? 0 : Math.max(0, ducks + (on ? 1 : -1)); if (!ctx || !duckGain) return; const t = ctx.currentTime; duckGain.gain.cancelScheduledValues(t); duckGain.gain.setTargetAtTime(ducks ? .3 : 1, t, .25); }
    const info = () => ({ amb: ambKind, playing: !!amb, level: +level.toFixed(2), reacts: ctx ? react.filter(r => r.end > ctx.currentTime).length : 0, ducks, loaded: Object.keys(files ? el : buf).length });
    function hold(on) { liveEls.forEach(a => { if (on && !a.paused) { a.__held = true; a.pause(); } else if (!on && a.__held) { a.__held = false; a.play().catch(() => { }); } }); }
    return { load, ambience, level: setLevel, react: reactTo, oneShot, stopAll, duck, info, hold, vol() { }, get kind() { return ambKind; } };
  })();
  function loadCrowd() { Crowd.load(); }
  function play(name, arg) { if (!ctx || vol.muted) return; try { LIB[name] && LIB[name](arg); } catch (e) { } }
  const has = name => !!LIB[name];

  /* =================================================================
     THE BAND — procedural song player. Works on any AudioContext
     (also an OfflineAudioContext, which is how it's tested).
     ================================================================= */
  const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], major: [0, 2, 4, 5, 7, 9, 11], phryg: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

  function createBand(c, out, nbuf, onSongChange) {
    // shared FX: reverb + tempo-free echo
    const verb = c.createConvolver(), len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    verb.buffer = ir; const verbOut = c.createGain(); verbOut.gain.value = .55; verb.connect(verbOut); verbOut.connect(out);
    const dly = c.createDelay(1.5), dlyFb = c.createGain(), dlyOut = c.createGain(), dlyLp = c.createBiquadFilter();
    dlyFb.gain.value = .32; dlyOut.gain.value = .3; dlyLp.type = 'lowpass'; dlyLp.frequency.value = 2400;
    dly.connect(dlyLp); dlyLp.connect(dlyFb); dlyFb.connect(dly); dlyLp.connect(dlyOut); dlyOut.connect(out);

    let cur = null, timer = null, mood = null;

    function newSong(song, t0) {
      const bus = c.createGain(), vs = c.createGain(), ds = c.createGain(), lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = song.crackle ? 4200 : 16000; // lofi warmth
      bus.connect(lp); lp.connect(out); vs.connect(verb); ds.connect(dly);
      bus.gain.setValueAtTime(0.0001, t0); bus.gain.exponentialRampToValueAtTime(song.gain || 1, t0 + 1.2);
      dly.delayTime.setValueAtTime(60 / song.bpm * .75, t0); // dotted-eighth echo
      const r = seeded(song.name), sc = SCALES[song.scale] || SCALES.minor;
      // lead motif: 16 steps of chord-relative scale degrees (null = rest)
      const pool = [0, 0, 2, 2, 4, 4, 1, 3, 5, 7];
      const motif = [...Array(16)].map((_, i) => (r() < song.leadDensity * (i % 4 === 0 ? 1.4 : 1) ? pool[Math.floor(r() * pool.length)] : null));
      return { song, sc, bus, vs, ds, lp, step: 0, next: t0 + .05, motif, rnd: r };
    }
    function fadeOut(S, t, dur = .9) {
      S.bus.gain.cancelScheduledValues(t); S.bus.gain.setValueAtTime(Math.max(.0001, S.bus.gain.value), t); S.bus.gain.exponentialRampToValueAtTime(.0001, t + dur);
      setTimeout(() => { try { S.bus.disconnect(); S.vs.disconnect(); S.ds.disconnect(); } catch (e) { } }, (dur + 3) * 1000);
    }
    function pickSong(m, avoid) {
      const list = SONGS.filter(s => s.mood === m); if (!list.length) return null;
      const pool = list.length > 1 ? list.filter(s => s !== avoid) : list;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    /* ----- instruments: (S = song state, t = time) ----- */
    const vEnv = (g, t, peak, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    function osc(type, f, t, end) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end + .05); return o; }
    function nz(t, end) { const s = c.createBufferSource(); s.buffer = nbuf; s.loop = true; s.start(t, Math.random()); s.stop(end + .05); return s; }
    function filt(type, f, q = .7) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
    const I = {
      kick(S, t, v) {
        const long = S.song.kick808, o = osc('sine', long ? 150 : 135, t, t + (long ? .8 : .35)), g = c.createGain();
        o.frequency.exponentialRampToValueAtTime(long ? 38 : 46, t + (long ? .25 : .11));
        vEnv(g, t, .9 * v, .004, long ? .75 : .32); o.connect(g); g.connect(S.bus);
        const cl = nz(t, t + .02), cg = c.createGain(), cf = filt('highpass', 3000); vEnv(cg, t, .12 * v, .001, .015); cl.connect(cf); cf.connect(cg); cg.connect(S.bus);
      },
      snare(S, t, v) {
        const n = nz(t, t + .22), f = filt('bandpass', 1900, .8), g = c.createGain(); vEnv(g, t, .32 * v, .002, .19); n.connect(f); f.connect(g); g.connect(S.bus); g.connect(S.vs);
        const o = osc('triangle', 200, t, t + .1), og = c.createGain(); o.frequency.exponentialRampToValueAtTime(140, t + .08); vEnv(og, t, .22 * v, .002, .08); o.connect(og); og.connect(S.bus);
      },
      clap(S, t, v) {
        [0, .011, .022].forEach((d, i) => { const n = nz(t + d, t + d + (i === 2 ? .2 : .02)), f = filt('bandpass', 1300, 1.1), g = c.createGain(); vEnv(g, t + d, .28 * v, .001, i === 2 ? .17 : .012); n.connect(f); f.connect(g); g.connect(S.bus); g.connect(S.vs); });
      },
      hat(S, t, v, open) {
        const n = nz(t, t + (open ? .25 : .05)), f = filt('highpass', open ? 6500 : 7800), g = c.createGain();
        vEnv(g, t, (open ? .09 : .07) * v, .001, open ? .22 : .035); n.connect(f); f.connect(g); g.connect(S.bus);
      },
      rim(S, t, v) { const o = osc('square', 1650, t, t + .03), f = filt('bandpass', 1700, 3), g = c.createGain(); vEnv(g, t, .09 * v, .001, .03); o.connect(f); f.connect(g); g.connect(S.bus); },
      bass(S, t, m, dur) {
        const type = S.song.bassType, g = c.createGain(), f = hz(m);
        if (type === '808') {
          const o = osc('sine', f * 2, t, t + dur + .2); o.frequency.exponentialRampToValueAtTime(f, t + .06);
          const sh = c.createWaveShaper(), curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.2); } sh.curve = curve;
          vEnv(g, t, .55, .005, Math.max(.3, dur)); o.connect(sh); sh.connect(g);
        } else if (type === 'saw' || type === 'pluck') {
          const o = osc('sawtooth', f, t, t + dur + .1), lp = filt('lowpass', type === 'pluck' ? 1400 : 700, 4);
          lp.frequency.setValueAtTime(type === 'pluck' ? 1600 : 900, t); lp.frequency.exponentialRampToValueAtTime(140, t + Math.min(dur, .35));
          vEnv(g, t, type === 'pluck' ? .28 : .22, .005, type === 'pluck' ? Math.min(dur, .3) : dur); o.connect(lp); lp.connect(g);
          const sub = osc('sine', f, t, t + dur + .1), sg = c.createGain(); vEnv(sg, t, .2, .005, dur); sub.connect(sg); sg.connect(S.bus);
        } else {
          const o = osc('sine', f, t, t + dur + .1), o2 = osc('triangle', f * 2, t, t + dur + .1), g2 = c.createGain(); g2.gain.value = .15;
          vEnv(g, t, .45, .01, dur); o.connect(g); o2.connect(g2); g2.connect(g);
        }
        g.connect(S.bus);
      },
      pad(S, t, notes, dur) {
        notes.forEach(m => {
          const g = c.createGain(), lp = filt('lowpass', 1100, .6);
          lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(1600, t + dur * .5); lp.frequency.linearRampToValueAtTime(800, t + dur);
          [-7, 7].forEach(cents => { const o = osc('sawtooth', hz(m), t, t + dur + .8); o.detune.value = cents; o.connect(lp); });
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.035, t + Math.min(.6, dur * .3)); g.gain.setValueAtTime(.035, t + dur - .05); g.gain.linearRampToValueAtTime(0.0001, t + dur + .7);
          lp.connect(g); g.connect(S.bus); g.connect(S.vs);
        });
      },
      ep(S, t, notes, dur) { // FM electric piano
        notes.forEach(m => {
          const car = osc('sine', hz(m), t, t + dur + .5), mod = osc('sine', hz(m), t, t + dur + .5), mg = c.createGain(), g = c.createGain();
          mg.gain.setValueAtTime(hz(m) * 1.4, t); mg.gain.exponentialRampToValueAtTime(hz(m) * .05, t + .4);
          mod.connect(mg); mg.connect(car.frequency); vEnv(g, t, .06, .006, Math.min(1.6, dur + .3)); car.connect(g); g.connect(S.bus); g.connect(S.vs);
        });
      },
      stab(S, t, notes) {
        notes.forEach(m => { const o = osc('square', hz(m), t, t + .25), lp = filt('lowpass', 2200, 1), g = c.createGain(); lp.frequency.exponentialRampToValueAtTime(500, t + .2); vEnv(g, t, .035, .004, .18); o.connect(lp); lp.connect(g); g.connect(S.bus); g.connect(S.ds); });
      },
      lead(S, t, m, dur, type) {
        const g = c.createGain(), f = hz(m);
        if (type === 'bell') {
          const a = osc('sine', f, t, t + 1.6), b = osc('sine', f * 2.76, t, t + .7), bg = c.createGain(); bg.gain.value = .25;
          vEnv(g, t, .07, .003, 1.4); a.connect(g); b.connect(bg); bg.connect(g); g.connect(S.vs);
        } else if (type === 'saw') {
          const o = osc('sawtooth', f, t, t + dur + .1), lp = filt('lowpass', 2600, 2), lfo = osc('sine', 5.5, t, t + dur + .1), lg = c.createGain();
          lg.gain.value = f * .012; lfo.connect(lg); lg.connect(o.frequency);
          g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.045, t + .03); g.gain.setValueAtTime(.045, t + dur * .8); g.gain.linearRampToValueAtTime(.0001, t + dur + .05);
          o.connect(lp); lp.connect(g); g.connect(S.ds);
        } else { // pluck / arp
          const o = osc('triangle', f, t, t + .5), o2 = osc('square', f * 2, t, t + .2), g2 = c.createGain(); g2.gain.value = .25;
          vEnv(g, t, type === 'arp' ? .04 : .07, .002, type === 'arp' ? .16 : .32); o.connect(g); o2.connect(g2); g2.connect(g); g.connect(S.ds);
        }
        g.connect(S.bus);
      },
      crackle(S, t) { if (S.rnd() < .5) { const n = nz(t, t + .01), f = filt('highpass', 2500), g = c.createGain(); vEnv(g, t + S.rnd() * .1, .02 + S.rnd() * .03, .001, .006); n.connect(f); f.connect(g); g.connect(S.bus); } },
    };

    const degSemi = (sc, d) => sc[((d % sc.length) + sc.length) % sc.length] + 12 * Math.floor(d / sc.length);
    function chordOf(S, deg) { return [0, 2, 4, 6].map(k => S.song.root + 12 + degSemi(S.sc, deg + k)); }

    /* schedule one 16th-note step */
    function step(S, t) {
      const g = S.song, i = S.step % 16, bar = Math.floor(S.step / 16), six = 60 / g.bpm / 4;
      const intro = 2, inIntro = bar < intro, phraseBar = (bar - intro) % 8, B = !inIntro && Math.floor((bar - intro) / 8) % 2 === 1;
      const fill = !inIntro && phraseBar === 7 && i >= 12;
      const bpc = g.barsPerChord || 1, deg = g.prog[Math.floor(bar / bpc) % g.prog.length];
      const tt = t + (i % 2 ? (g.swing || 0) * six : 0);
      const D = (B && g.drumsB) || g.drums, hit = (p, k) => p && p[k] && p[k][i] !== '.' && p[k][i] !== undefined ? (p[k][i] === 'o' ? .5 : 1) : 0;
      // drums
      if (inIntro) { const h = hit(D, 'h'); if (h) I.hat(S, tt, h * .6); }
      else if (fill) { I.snare(S, tt, .35 + (i - 12) * .18); if (i === 12 || i === 14) I.kick(S, tt, .8); }
      else {
        let v; if ((v = hit(D, 'k'))) I.kick(S, tt, v); if ((v = hit(D, 's'))) I.snare(S, tt, v); if ((v = hit(D, 'c'))) I.clap(S, tt, v);
        if ((v = hit(D, 'h'))) { I.hat(S, tt, v * (i % 4 === 0 ? 1 : .7)); if (g.rolls && B && (i === 6 || i === 14) && S.rnd() < .6) for (let k = 1; k < 3; k++) I.hat(S, tt + k * six / 3, .5); }
        if ((v = hit(D, 'oh'))) I.hat(S, tt, v, true); if ((v = hit(D, 'r'))) I.rim(S, tt, v);
      }
      // bass
      if (!inIntro && g.bass && g.bass[i] && g.bass[i] !== '.') {
        let n = 1; while (i + n < 16 && g.bass[i + n] === '.') n++;
        const m = g.root + degSemi(S.sc, deg) - (degSemi(S.sc, deg) > 6 ? 12 : 0) + (g.bass[i] === 'o' ? 12 : g.bass[i] === '5' ? 7 : 0);
        I.bass(S, tt, m, n * six * .9);
      }
      // keys
      const chord = chordOf(S, deg);
      if (g.keys === 'pad' && i === 0 && bar % bpc === 0) I.pad(S, t, chord.slice(0, 3), six * 16 * bpc);
      if ((g.keys === 'ep' || g.keys === 'stab') && g.keysPat && g.keysPat[i] === 'x') {
        if (g.keys === 'ep') I.ep(S, tt, chord, six * 6); else I.stab(S, tt, chord.slice(0, 3));
      }
      // lead (verse = sparse, chorus = full motif, intro = none)
      if (!inIntro && g.lead && g.lead !== 'none') {
        if (g.lead === 'arp') { if (B || i % 2 === 0) I.lead(S, tt, chord[[0, 1, 2, 3, 2, 1][i % 6]] + 12, six, 'arp'); }
        else {
          let d = S.motif[i]; if (d != null && (B || i < 8)) { if (B && i % 4 === 3) d += 1; I.lead(S, tt, g.root + 24 + degSemi(S.sc, deg + d), six * 2, g.lead); }
        }
      }
      if (g.crackle && i % 2 === 0) I.crackle(S, t);
    }

    function scheduleUntil(tEnd) {
      while (cur && cur.next < tEnd) {
        const S = cur, six = 60 / S.song.bpm / 4;
        step(S, S.next);
        S.next += six; S.step++;
        if (S.step >= 34 * 16) { // song over → crossfade into another track of the same mood
          const nxt = pickSong(mood, S.song); fadeOut(S, S.next, 1.5);
          cur = nxt ? newSong(nxt, S.next) : null; if (cur && onSongChange) onSongChange(cur.song);
        }
      }
    }
    function setMood(m, now) {
      if (m === mood && cur) return;
      mood = m; const t = (now != null ? now : c.currentTime) + .05;
      if (cur) fadeOut(cur, t);
      const song = m ? pickSong(m, cur && cur.song) : null;
      cur = song ? newSong(song, t + (cur ? .3 : 0)) : null;
      if (cur && onSongChange) onSongChange(cur.song);
    }
    function skip() { if (!mood) return; const m = mood; mood = null; setMood(m); }
    function playSong(name, now) { const song = SONGS.find(s => s.name === name); if (!song) return; mood = song.mood; if (cur) fadeOut(cur, (now || c.currentTime)); cur = newSong(song, (now || c.currentTime) + .05); }
    function start() { if (timer) return; timer = setInterval(() => scheduleUntil(c.currentTime + .25), 40); }
    if (typeof c.startRendering !== 'function') start();
    return { setMood, skip, scheduleUntil, playSong, get song() { return cur && cur.song; }, get mood() { return mood; } };
  }

  /* ---------- public music API ---------- */
  let pendingMood = null;
  function onSong(song) { try { window.dispatchEvent(new CustomEvent('hd-song', { detail: song })); } catch (e) { } }
  function music(mood) { pendingMood = mood; if (!band) return; band.setMood(mood); }
  /* the pause (js/pause.js): everything stops where it is and carries on from there — the audio clock stands still too */
  let held = false;
  function suspend() { if (!ctx || held) return; held = true; try { ctx.suspend(); } catch (e) { } try { Crowd.hold(true); } catch (e) { } }
  function resume() { if (!ctx || !held) return; held = false; try { ctx.resume(); } catch (e) { } try { Crowd.hold(false); } catch (e) { } }
  function stopMusic() { music(null); }
  function skip() { if (band) band.skip(); }
  /* crowd API: venue ambience ('arena' | 'gym' | 'street' | null), excitement level, reactions, ducking, stop */
  /* every crowd call is fenced off: audio problems must never break the game flow */
  const safe = f => (...a) => { try { return f(...a); } catch (e) { console.warn('crowd audio', e); } };
  const crowd = { ambience: safe((k, h) => { if (ctx) Crowd.ambience(k, h); }), level: safe(h => Crowd.level(h)), react: safe((k, v) => !vol.muted && Crowd.react(k, v)), duck: safe(on => Crowd.duck(on)),
    info: () => Crowd.info(), stop: safe(() => { if (ctx) Crowd.stopAll(); }), reset: safe(() => Crowd.duck(null)) };
  return { init, play, has, music, stopMusic, skip, setVol, toggleMute, vol, crowd, suspend, resume, get mood() { return band ? band.mood : pendingMood; }, get song() { return band && band.song; } };
})();
