/* =====================================================================
   UI.JS — screens, components, modals, toasts.
   Screens: title, create, story, hub (tabs), postGame, chapterEnd, ending.
   ===================================================================== */
const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const S = () => Game.state;
  const settings = Object.assign({ textSpeed: 2 }, (() => { try { return JSON.parse(localStorage.getItem('hoopdreams_ui') || '{}'); } catch (e) { return {}; } })());
  const saveSettings = () => { try { localStorage.setItem('hoopdreams_ui', JSON.stringify(settings)); } catch (e) { } };

  /* ---------- screen + background management ---------- */
  function showScreen(html, cls = '') {
    const sc = $('#screen'); sc.className = 'screen scr-' + cls; sc.innerHTML = html; sc.scrollTop = 0;
    sc.classList.add('enter'); requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.remove('enter')));
    document.body.dataset.screen = cls;
    return sc;
  }
  function setBg(scene, seed) {
    const bg = $('#bg'); const key = scene + (seed || '');
    if (bg.dataset.key === key) return; bg.dataset.key = key;
    const layer = document.createElement('div'); layer.className = 'bg-layer'; layer.innerHTML = Art.scene(scene, seed);
    bg.appendChild(layer); requestAnimationFrame(() => layer.classList.add('on'));
    const old = $$('.bg-layer', bg).slice(0, -1); setTimeout(() => old.forEach(o => o.remove()), 900);
  }

  /* ---------- toasts, bursts, modals ---------- */
  function toast(html, cls = '', ms = 2600) {
    const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = html; $('#toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, ms);
  }
  function fmtChange(c) {
    const sign = c.v > 0 ? '+' : '';
    let v = c.fmt === 'money' ? (c.v < 0 ? '−' : '+') + Engine.fmtMoney(Math.abs(c.v)) : c.fmt === 'fans' ? sign + Engine.fmtFans(c.v) : c.fmt === 'inj' ? `out ${-c.v} games` : sign + c.v;
    const good = c.inv ? c.v < 0 : c.v > 0;
    return `<span class="chg ${c.special ? 'special' : good ? 'up' : 'down'}">${esc(c.label)} <b>${v}</b></span>`;
  }
  function fxToasts(changes) {
    if (!changes || !changes.length) return;
    toast(changes.map(fmtChange).join(''), 'fx', 3200);
    if (changes.some(c => c.special === 'level')) levelBurst();
  }
  function levelBurst(text = 'LEVEL UP!') {
    SFX.play('levelup');
    const b = document.createElement('div'); b.className = 'burst'; b.innerHTML = `<div class="burst-ring"></div><div class="burst-text">${text}<small>+${PROGRESSION.spPerLevel} Skill Points</small></div>`;
    $('#fx').appendChild(b); setTimeout(() => b.remove(), 2200);
  }
  function confetti(n = 120) {
    const box = $('#fx');
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = ['#f97316', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#fff'][i % 6];
      c.style.animationDuration = (2 + Math.random() * 2.5) + 's'; c.style.animationDelay = Math.random() * .6 + 's'; c.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(c); setTimeout(() => c.remove(), 5500);
    }
  }
  function modal(html, o = {}) {
    const m = document.createElement('div'); m.className = 'modal ' + (o.cls || '');
    m.innerHTML = `<div class="modal-card glass">${o.noClose ? '' : '<button class="x" aria-label="Close">✕</button>'}${html}</div>`;
    $('#modals').appendChild(m); requestAnimationFrame(() => m.classList.add('in'));
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 250); o.onClose && o.onClose(); };
    if (!o.noClose) { $('.x', m).onclick = close; m.addEventListener('pointerdown', e => { if (e.target === m) close(); }); }
    return { el: m, card: $('.modal-card', m), close };
  }
  function confirmBox(title, text, yes = 'Yes', no = 'Cancel') {
    return new Promise(res => {
      const m = modal(`<h2>${title}</h2><p>${text}</p><div class="row end"><button class="btn ghost" data-a="no">${no}</button><button class="btn" data-a="yes">${yes}</button></div>`, { onClose: () => res(false) });
      $('[data-a=no]', m.el).onclick = () => { m.close(); };
      $('[data-a=yes]', m.el).onclick = () => { res(true); m.el.remove(); };
    });
  }

  /* ---------- components ---------- */
  function charLook(id, expr) {
    const ch = STORY.characters[id]; if (!ch) return null;
    if (id === 'you') return Object.assign(Engine.look(S()), { expr: expr || 'neutral' });
    const L = Object.assign({}, ch.look, { expr: expr || 'neutral' });
    if (L.skin === 'family') L.skin = S().player.look.skin;
    return L;
  }
  function radar(vals, size = 220, cmp) { // vals: [{n, v}]
    const c = size / 2, R = size * 0.3, n = vals.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * Math.max(0.04, v / 99); return [c + Math.cos(a) * r, c + Math.sin(a) * r]; };
    let g = '';
    [.25, .5, .75, 1].forEach(k => { g += `<polygon points="${vals.map((_, i) => pt(i, 99 * k).join(',')).join(' ')}" fill="none" stroke="#ffffff1a"/>`; });
    vals.forEach((_, i) => { const [x, y] = pt(i, 99); g += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="#ffffff14"/>`; });
    if (cmp) g += `<polygon points="${cmp.map((v, i) => pt(i, v.v).join(',')).join(' ')}" fill="#22c55e33" stroke="#22c55e" stroke-width="2"/>`;
    g += `<polygon class="radar-poly" points="${vals.map((v, i) => pt(i, v.v).join(',')).join(' ')}" fill="#f9731640" stroke="#f97316" stroke-width="2.5"/>`;
    vals.forEach((v, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, x = c + Math.cos(a) * (R + size * .12), y = c + Math.sin(a) * (R + size * .1) - size * .02; g += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${size * .05}" fill="#cbd5e1" font-family="Oswald, sans-serif">${v.n.toUpperCase()}</text><text x="${x}" y="${y + size * .055}" text-anchor="middle" font-size="${size * .055}" fill="#fff" font-weight="700" font-family="Oswald, sans-serif">${Math.round((cmp ? cmp[i].v : v.v))}</text>`; });
    return `<svg class="radar" viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px">${g}</svg>`;
  }
  /* Player trading card. d: {first,last,pos,arch,num,height,ovr,ovrLabel,look,radar,team} */
  function card(d, cls = '') {
    const tier = Engine.tierOf(d.ovr), A = ARCHETYPES[d.arch] || { name: 'Archetype: ???', icon: 'star' }, W = WEAPONS[d.weapon];
    return `<div class="pcard tier-${tier.id} ${cls}">
      <div class="pc-shine"></div>
      <div class="pc-top"><div class="pc-ovr">${d.ovrLabel || d.ovr}<small>OVR</small></div><div class="pc-pos">${d.pos}</div><div class="pc-arch" title="${A.name}">${Art.icon(A.icon, '#fff', '#0006', 22)}</div></div>
      <div class="pc-art">${Art.avatar(d.look, { mode: 'bust' })}</div>
      <div class="pc-name"><span>${esc(d.first)}</span><b>${esc(d.last)}</b></div>
      <div class="pc-archname">${A.name}${W ? `<small>⚔ ${W.name}</small>` : ''}</div>
      <div class="pc-stats">${d.radar.map(r => `<div><b>${Math.round(r.v)}</b><span>${r.n.slice(0, 3).toUpperCase()}</span></div>`).join('')}</div>
      <div class="pc-foot"><span>#${d.num}</span><span>${Engine.heightStr(d.height)}</span><span class="pc-tier">${tier.name}</span></div>
    </div>`;
  }
  function cardFromState(s, cls) { const p = s.player; return card({ first: p.first, last: p.last, pos: p.pos, arch: p.arch, weapon: p.weapon, num: p.num, height: p.height, ovr: Engine.ovr(s), ovrLabel: Engine.ovrLabel(s), look: Engine.look(s), radar: Engine.radar(s) }, cls); }
  function bar(v, max = 100, cls = '') { return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></i></div>`; }
  function feedPost(p) {
    const acc = STORY.accounts[p.by] || {}; const look = acc.char ? charLook(acc.char) : (acc.look || Art.lookFromSeed(p.by));
    return `<div class="post"><div class="post-av">${Art.avatar(look, { mode: 'portrait' })}</div><div class="post-main"><div class="post-head"><b>${esc(acc.name || p.by)}</b>${acc.verified ? '<i class="verified">✔</i>' : ''}<span>${esc(acc.handle || '')}</span></div><div class="post-text">${esc(p.text)}</div><div class="post-foot">♥ ${Engine.fmtFans(p.likes || 0)} · ↻ ${Engine.fmtFans(Math.round((p.likes || 0) / 6))}</div></div></div>`;
  }

  /* =================================================================
     TITLE SCREEN
     ================================================================= */
  function title() {
    setBg('title'); SFX.music('menu');
    const last = Engine.latest();
    showScreen(`
      <div class="title-wrap">
        <div class="title-logo">
          <div class="tl-ball">${Art.icon('ball', '#f97316', '#1c1917', 90)}</div>
          <h1><span>HOOP</span><span>DREAMS</span></h1>
          <p class="tl-sub">START YOUR BALL CAREER · FROM NOBODY TO GOAT</p>
        </div>
        <div class="title-menu">
          ${last ? `<button class="btn big glow" data-a="continue">▶ Continue <small>${esc(last.summary.name)} · ${last.summary.ovr} OVR · ${esc(last.summary.stage)}</small></button>` : ''}
          <button class="btn big ${last ? 'alt' : 'glow'}" data-a="new">＋ New Career</button>
          <button class="btn ghost" data-a="load">Load Game</button>
          <button class="btn ghost" data-a="how">How to Play</button>
          <button class="btn ghost" data-a="settings">Settings</button>
        </div>
        ${last ? `<div class="title-card">${Art.avatar(last.summary.look, { mode: 'full' })}</div>` : ''}
        <div class="title-foot">A fan-made parody basketball RPG · All names, teams & art are original or parody.</div>
      </div>`, 'title');
    const sc = $('#screen');
    $$('[data-a]', sc).forEach(b => b.onclick = () => {
      SFX.init(); SFX.play('click');
      const a = b.dataset.a;
      if (a === 'new') create();
      if (a === 'continue') Game.loadSlot(last.slot);
      if (a === 'load') loadMenu();
      if (a === 'how') howTo();
      if (a === 'settings') settingsModal();
    });
  }
  function howTo() {
    modal(`<h2>How to Play</h2>
      <div class="howto">
        <p><b>Your goal:</b> start as an unknown 16-year-old (~40 Overall) and become the GOAT (99 Overall). Your choices shape your stats, relationships and reputation — and some choices can end your career.</p>
        <p><b>Story:</b> click or press <kbd>Space</kbd> to advance dialogue. Choices with a <span class="pct mid">%</span> are stat checks.</p>
        <p><b>Games:</b> each game is 8–15 key moments. Decision buttons show your live success chance (<span class="pct hi">green</span> / <span class="pct mid">yellow</span> / <span class="pct lo">red</span>) based on your stats vs. the defender, fatigue and confidence. Press <kbd>1</kbd>–<kbd>4</kbd> to pick.</p>
        <p><b>Minigames:</b> Shot Meter (tap at the green), Free Throws (tap when centered), Dribble Combo (arrows/WASD/swipe), Dunk Timing (tap when rings meet), Lock-In Defense (mirror the move), Box Out (tap in the zone), Passing Lane (tap the open man).</p>
        <p><b>🕹 Arcade segments:</b> every game switches to real-time arcade play for single possessions at least 3 times — <b>FAST BREAK!</b> after a steal, block or defensive rebound, <b>LOOSE BALL!</b> scrambles, <b>SCRAMBLE!</b> put-back battles, <b>BROKEN PLAY!</b> with the shot clock running out, <b>BEAT THE BUZZER!</b> at the end of a quarter, and the <b>FINAL POSSESSION!</b> of a close game. Controls: move WASD/joystick · shoot <kbd>J</kbd>/<kbd>Space</kbd> (hold &amp; release at the top) · pass/steal <kbd>K</kbd> · dribble move <kbd>L</kbd>/<kbd>Shift</kbd>.</p>
        <p><b>Hot streaks:</b> 3 successes in a row = <b>ON FIRE</b>. Successes charge your <b>Signature Move</b>. Close games end in <b>Clutch Time</b>.</p>
        <p><b>Hub:</b> train (minigames raise attributes), rest, spend Skill Points, earn Badges, shop for gear, read your social feed.</p>
        <p><b>Saves:</b> autosave after every step. 3 manual slots + export/import as a file in Settings.</p>
      </div>`);
  }
  function loadMenu() {
    const rows = Engine.list();
    const m = modal(`<h2>Load Game</h2><div class="slots">${rows.map(r => r.s ? `
      <div class="slot"><div class="slot-av">${Art.avatar(r.summary.look, { mode: 'portrait' })}</div><div class="slot-info"><b>${esc(r.summary.name)}</b><span>${r.summary.ovr} OVR · ${esc(r.summary.stage)}</span><small>${r.slot === 'auto' ? 'Autosave' : 'Slot ' + r.slot} · ${r.summary.date}</small></div>
      <button class="btn sm" data-load="${r.slot}">Load</button><button class="btn sm ghost" data-del="${r.slot}">✕</button></div>` : `<div class="slot empty">${r.slot === 'auto' ? 'Autosave' : 'Slot ' + r.slot} — empty</div>`).join('')}</div>
      <div class="row"><label class="btn ghost sm">Import save file<input type="file" accept=".json,application/json" hidden id="impFile"></label></div>`);
    $$('[data-load]', m.el).forEach(b => b.onclick = () => { m.close(); Game.loadSlot(b.dataset.load); });
    $$('[data-del]', m.el).forEach(b => b.onclick = async () => { if (await confirmBox('Delete save?', 'This cannot be undone.', 'Delete')) { Engine.remove(b.dataset.del); m.close(); loadMenu(); } });
    $('#impFile', m.el).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const s = await Engine.importSave(f); m.close(); Game.loadState(s); toast('Save imported!'); } catch (err) { toast('Could not import: ' + esc(err.message), 'bad'); } };
  }
  function settingsModal() {
    const inGame = !!S() && document.body.dataset.screen !== 'title';
    const v = SFX.vol;
    const m = modal(`<h2>Settings</h2>
      <div class="set-grid">
        <label>Master volume<input type="range" min="0" max="1" step=".05" value="${v.master}" data-v="master"></label>
        <label>Music<input type="range" min="0" max="1" step=".05" value="${v.music}" data-v="music"></label>
        <label>Sound effects<input type="range" min="0" max="1" step=".05" value="${v.sfx}" data-v="sfx"></label>
        <label>Text speed<select id="tspd"><option value="1">Slow</option><option value="2">Normal</option><option value="4">Fast</option><option value="99">Instant</option></select></label>
      </div>
      ${inGame ? `<h3>Save</h3><div class="row wrap">${['1', '2', '3'].map(n => `<button class="btn sm" data-save="${n}">Save to Slot ${n}</button>`).join('')}<button class="btn sm ghost" data-a="export">Export save file</button><button class="btn sm ghost" data-a="load">Load…</button></div>
      <h3>Career</h3><div class="row wrap"><span class="muted">Difficulty: <b>${DIFFICULTY[S().difficulty].name}</b></span><button class="btn sm ghost" data-a="menu">Main Menu</button><button class="btn sm danger" data-a="restart">Restart Career</button></div>` : ''}
      <h3>Music</h3><div class="row wrap"><span class="muted">Now playing: <b id="npName">${esc((SFX.song && SFX.song.name) || '—')}</b></span><button class="btn sm ghost" id="npSkip">Next track ⏭</button></div>`);
    $('#tspd', m.el).value = String(settings.textSpeed);
    $('#tspd', m.el).onchange = e => { settings.textSpeed = +e.target.value; saveSettings(); };
    $$('[data-v]', m.el).forEach(r => r.oninput = () => { SFX.init(); SFX.setVol(r.dataset.v, +r.value); });
    $('#npSkip', m.el).onclick = () => { SFX.init(); SFX.skip(); setTimeout(() => { const n = $('#npName'); if (n) n.textContent = (SFX.song && SFX.song.name) || '—'; }, 100); };
    $$('[data-save]', m.el).forEach(b => b.onclick = () => { Engine.save(S(), b.dataset.save) ? toast(`Saved to slot ${b.dataset.save}`) : toast('Save failed (storage full?)', 'bad'); });
    $$('[data-a]', m.el).forEach(b => b.onclick = async () => {
      const a = b.dataset.a;
      if (a === 'export') Engine.exportSave(S());
      if (a === 'load') { m.close(); loadMenu(); }
      if (a === 'menu') { m.close(); Game.save(); title(); }
      if (a === 'restart') { if (await confirmBox('Restart career?', 'Your current autosave will be overwritten when you start a new career. Manual slots are kept.', 'Restart')) { m.close(); create(); } }
    });
  }

  /* =================================================================
     CHARACTER CREATION
     ================================================================= */
  /* Rolled archetype / weapon result cards */
  function rarityTag(r) { const R = RARITY[r]; return `<span class="rar rar-${r}" style="--rc:${R.color}">${R.name}</span>`; }
  function archCard(id) {
    const a = ARCHETYPES[id]; if (!a) return '';
    return `<div class="rcard rar-${a.rarity}" style="--rc:${RARITY[a.rarity].color}"><div class="rc-top">${rarityTag(a.rarity)}<div class="rc-ico">${Art.icon(a.icon, a.color, '#0006', 40)}</div></div>
      <b class="rc-name">${esc(a.name)}</b><p>${esc(a.desc)}</p>
      <div class="ac-bon">${Object.entries(a.bonus).map(([k, v]) => `<em>+${v} ${ATTR_BY_KEY[k].s}</em>`).join('')}</div>
      <div class="rc-pass"><b>PASSIVE · ${esc(a.passive.name)}</b><span>${esc(a.passive.desc)}</span></div></div>`;
  }
  const WTYPE = { three: 'Three-pointer', mid: 'Jump shot', drive: 'Drive', dunk: 'Dunk', pass: 'Pass', post: 'Post move', steal: 'Steal + finish', block: 'Block + break', zone: 'Zone state' };
  function weaponCard(id) {
    const w = WEAPONS[id]; if (!w) return '';
    return `<div class="rcard rar-${w.rarity}" style="--rc:${RARITY[w.rarity].color}"><div class="rc-top">${rarityTag(w.rarity)}<div class="rc-ico">${Art.icon(w.icon, RARITY[w.rarity].color, '#0006', 40)}</div></div>
      <b class="rc-name">⚔ ${esc(w.name)}</b><p>${esc(w.desc)}</p>
      <div class="ac-bon"><em>${WTYPE[w.type]}</em><em>${w.power}% success</em><em>Charges after ${w.charge} wins</em></div></div>`;
  }

  /* =================================================================
     CHARACTER CREATION
     ================================================================= */
  function create() {
    setBg('playground', 'create'); SFX.music('menu');
    const c = {
      first: '', last: '', hometown: 'Brooklyn, NY', num: 7, difficulty: 'pro', pos: 'SG', height: 77, ape: WINGSPAN.def, arch: null, weapon: null,
      used: { arch: 0, weapon: 0 }, rolling: false,
      look: Object.assign({}, Art.DEFAULT_LOOK, { jersey: '#f97316', trim: '#111827', expr: 'fierce' }), step: 0,
    };
    const STEPS = ['Identity', 'Body', 'Roll', 'Look'];
    const spinsLeft = k => Math.max(0, ROLL_SPINS[c.difficulty] - c.used[k]);
    let previewAttrs = null;
    const regen = () => { previewAttrs = Engine.createState({ first: 'A', last: 'B', pos: c.pos, height: c.height, wingspan: c.height + c.ape, arch: c.arch || 'none', weapon: c.weapon, look: c.look, num: c.num, hometown: '' }); };
    regen();
    showScreen(`
      <div class="create">
        <div class="create-head"><h2>CREATE YOUR PLAYER</h2><div class="steps">${STEPS.map((s, i) => `<button class="step" data-step="${i}"><b>${i + 1}</b>${s}</button>`).join('')}</div></div>
        <div class="create-body">
          <div class="create-form glass" id="cform"></div>
          <div class="create-preview"><div id="cprev"></div><div id="cradar" class="glass"></div></div>
        </div>
        <div class="create-foot"><button class="btn ghost" id="cback">‹ Back</button><button class="btn glow" id="cnext">Next ›</button></div>
      </div>`, 'create');
    const form = $('#cform');
    const preview = () => {
      const st = previewAttrs; st.player.look = Object.assign({}, c.look, { num: c.num });
      $('#cprev').innerHTML = card({ first: c.first || 'Your', last: c.last || 'Name', pos: c.pos, arch: c.arch, weapon: c.weapon, num: c.num, height: c.height, ovr: Engine.ovr(st), look: Object.assign({}, c.look, { num: c.num }), radar: Engine.radar(st) }, 'big');
      $('#cradar').innerHTML = `<div class="cr-title">STARTING ATTRIBUTES</div>${radar(Engine.radar(st), 210)}`;
    };
    const wingNote = ape => ape <= -1 ? 'Short arms: tighter handle and a cleaner shot, but harder to defend, rebound and block.' : ape <= 2 ? 'Average length. No big strengths or weaknesses.' : ape <= 5 ? 'Long arms: better perimeter D, rebounding, blocks and steals.' : 'Pterodactyl arms: elite defense, boards and finishing. Handles and pure shooting get a little harder.';
    const steps = [
      () => `
        <div class="fgrid">
          <label>First name<input id="fFirst" maxlength="14" value="${esc(c.first)}" placeholder="e.g. Jaylen"></label>
          <label>Last name<input id="fLast" maxlength="16" value="${esc(c.last)}" placeholder="e.g. Brooks"></label>
          <label>Hometown<input id="fHome" maxlength="28" value="${esc(c.hometown)}" list="towns"><datalist id="towns">${['Brooklyn, NY', 'Chicago, IL', 'Oakland, CA', 'Compton, CA', 'Baltimore, MD', 'Philadelphia, PA', 'Houston, TX', 'Atlanta, GA', 'Detroit, MI', 'Toronto, ON', 'London, UK', 'Lagos, Nigeria', 'Paris, France', 'Tokyo, Japan'].map(t => `<option value="${t}">`).join('')}</datalist></label>
          <label>Jersey number<input id="fNum" type="number" min="0" max="99" value="${c.num}"></label>
        </div>
        <h3>Difficulty</h3>
        <div class="opt-cards two">${Object.entries(DIFFICULTY).map(([k, d]) => `<button class="ocard ${c.difficulty === k ? 'sel' : ''}" data-diff="${k}"><b>${d.name}</b><span>${d.desc} ${ROLL_SPINS[k]} rolls each for archetype & weapon.</span></button>`).join('')}</div>`,
      () => {
        const P = POSITIONS[c.pos], ws = c.height + c.ape, cp = Engine.caps(c.pos, c.height, ws);
        return `<h3>Position</h3>
        <div class="opt-cards five">${Object.entries(POSITIONS).map(([k, p]) => `<button class="ocard pos ${c.pos === k ? 'sel' : ''}" data-pos="${k}"><b>${k}</b><span>${p.name}</span></button>`).join('')}</div>
        <div class="body-sliders">
          <div><h3>Height: <span class="hl">${Engine.heightStr(c.height)}</span></h3>
            <input type="range" id="fHeight" min="${P.h[0]}" max="${P.h[1]}" value="${c.height}"></div>
          <div><h3>Wingspan: <span class="hl">${Engine.heightStr(ws)}</span> <small class="ape ${c.ape >= 3 ? 'pos' : c.ape < 0 ? 'neg' : ''}">${c.ape >= 0 ? '+' : ''}${c.ape}"</small></h3>
            <input type="range" id="fWing" min="${c.height + WINGSPAN.min}" max="${c.height + WINGSPAN.max}" value="${ws}"></div>
        </div>
        <p class="muted">Height sets your base caps: guards move and handle better, bigs rebound and protect the rim. Wingspan follows your height. ${esc(wingNote(c.ape))}</p>
        <div class="caps">${['speed', 'handle', 'three', 'perD', 'reb', 'intD', 'str', 'dunk'].map(k => `<div class="cap"><span>${ATTR_BY_KEY[k].n}</span>${bar(cp[k], 99, cp[k] >= 90 ? 'good' : cp[k] >= 80 ? '' : 'warn')}<b>${cp[k]}</b></div>`).join('')}</div>`;
      },
      () => `<p class="muted">Your archetype (play style + passive) and your weapon (signature move) are rolled separately. Rarer rolls are stronger. You get <b>${ROLL_SPINS[c.difficulty]}</b> rolls for each on ${DIFFICULTY[c.difficulty].name}, and you keep whatever you land last.</p>
        <div class="roll-grid">
          ${[['arch', 'Archetype', archCard], ['weapon', 'Weapon', weaponCard]].map(([k, label, fn]) => `
          <div class="roll-box">
            <h3>${label}</h3>
            <div class="reel" id="reel-${k}">${c[k] ? fn(c[k]) : `<div class="reel-empty">?</div>`}</div>
            <button class="btn big ${c[k] ? 'ghost' : 'glow'}" data-roll="${k}" ${spinsLeft(k) <= 0 || c.rolling ? 'disabled' : ''}>🎲 ${c[k] ? 'Re-roll' : 'Roll'} ${label} <small>${spinsLeft(k)} roll${spinsLeft(k) === 1 ? '' : 's'} left</small></button>
          </div>`).join('')}
        </div>
        <div class="odds">${RARITY_ORDER.map(r => `${rarityTag(r)} ${Math.round(RARITY[r].odds * 100)}%`).join(' ')}</div>`,
      () => {
        const sw = (key, arr, round) => `<div class="swatches">${arr.map(v => `<button class="sw ${round ? 'round' : ''} ${c.look[key] === v ? 'sel' : ''}" data-look="${key}" data-val="${v}" style="background:${v || 'transparent'}">${v ? '' : '∅'}</button>`).join('')}</div>`;
        const chips = (key, arr) => `<div class="chips">${arr.map(v => `<button class="chip ${c.look[key] === v ? 'sel' : ''}" data-look="${key}" data-val="${v}">${v}</button>`).join('')}</div>`;
        return `<div class="look-grid">
          <div><h4>Skin tone</h4>${sw('skin', Art.SKINS, true)}</div>
          <div><h4>Hair</h4>${chips('hair', Art.HAIRS)}</div>
          <div><h4>Hair color</h4>${sw('hairColor', Art.HAIR_COLORS, true)}</div>
          <div><h4>Facial hair</h4>${chips('beard', Art.BEARDS)}</div>
          <div><h4>Headband</h4>${sw('headband', Art.ACCENTS)}</div>
          <div><h4>Arm sleeve</h4>${sw('sleeve', Art.ACCENTS)}</div>
          <div><h4>Jersey color</h4>${sw('jersey', ['#f97316', '#dc2626', '#2563eb', '#16a34a', '#7c3aed', '#0f172a', '#facc15', '#f8fafc', '#0891b2', '#be185d'])}</div>
          <div><h4>Jersey trim</h4>${sw('trim', ['#111827', '#ffffff', '#facc15', '#f97316', '#2563eb', '#dc2626'])}</div>
          <div><h4>Shoes</h4>${chips('shoes', Art.SHOES)}</div>
          <div><h4>Shoe color</h4>${sw('shoeColor', ['#ffffff', '#111827', '#dc2626', '#2563eb', '#facc15', '#a3e635', '#f97316', '#a855f7'])}</div>
          <div><h4>Build</h4>${chips('build', ['lean', 'normal', 'strong'])}</div>
          <div><h4>Extras</h4><div class="chips"><button class="chip ${c.look.goggles ? 'sel' : ''}" data-tog="goggles">Goggles</button><button class="chip ${c.look.chain ? 'sel' : ''}" data-tog="chain">Chain</button><button class="chip" data-a="random">🎲 Randomize</button></div></div>
        </div>`;
      },
    ];
    const render = () => {
      form.innerHTML = steps[c.step]();
      $$('.step').forEach((b, i) => { b.classList.toggle('on', i === c.step); b.classList.toggle('done', i < c.step); });
      $('#cnext').innerHTML = c.step === STEPS.length - 1 ? '🏀 Start Career' : 'Next ›';
      $('#cback').style.visibility = c.step ? 'visible' : 'hidden';
      bind(); preview();
    };
    /* slot-machine reel: flicker through entries, slow down, land on the rolled result */
    const doRoll = async k => {
      if (c.rolling || spinsLeft(k) <= 0) return;
      const table = k === 'arch' ? ARCHETYPES : WEAPONS, result = Engine.roll(table), ids = Object.keys(table);
      c.rolling = true; c.used[k]++; SFX.init();
      $$('[data-roll]', form).forEach(b => b.disabled = true);
      const reel = $('#reel-' + k);
      {
        let delay = 45;
        for (let n = 0; n < 22; n++) {
          const id = ids[Math.floor(Math.random() * ids.length)], it = table[id];
          reel.innerHTML = `<div class="reel-spin" style="--rc:${RARITY[it.rarity].color}">${Art.icon(it.icon, RARITY[it.rarity].color, '#0006', 34)}<b>${esc(it.name)}</b>${rarityTag(it.rarity)}</div>`;
          SFX.play('tick'); await sleep(delay); delay *= 1.12;
        }
      }
      c[k] = result; c.rolling = false;
      const rar = table[result].rarity, ri = RARITY_ORDER.indexOf(rar);
      SFX.play(ri >= 3 ? 'levelup' : ri >= 2 ? 'perfect' : 'good');
      if (ri >= 4) confetti(140); else if (ri >= 3) confetti(60);
      toast(`${k === 'arch' ? 'Archetype' : 'Weapon'}: <b>${esc(table[result].name)}</b> ${rarityTag(rar)}`, ri >= 3 ? 'ach' : 'good');
      regen(); render();
      const box = $('#reel-' + k); if (box) { box.classList.add('landed'); }
    };
    const bind = () => {
      const on = (id, ev, fn) => { const el = $('#' + id); if (el) el.addEventListener(ev, fn); };
      on('fFirst', 'input', e => { c.first = e.target.value.trim(); preview(); });
      on('fLast', 'input', e => { c.last = e.target.value.trim(); preview(); });
      on('fHome', 'input', e => { c.hometown = e.target.value.trim(); });
      on('fNum', 'input', e => { c.num = Math.max(0, Math.min(99, parseInt(e.target.value || '0', 10))); preview(); });
      on('fHeight', 'input', e => { c.height = +e.target.value; regen(); form.innerHTML = steps[1](); bind(); preview(); });
      on('fWing', 'input', e => { c.ape = +e.target.value - c.height; regen(); form.innerHTML = steps[1](); bind(); preview(); });
      $$('[data-diff]', form).forEach(b => b.onclick = () => { c.difficulty = b.dataset.diff; SFX.play('click'); render(); });
      $$('[data-pos]', form).forEach(b => b.onclick = () => { c.pos = b.dataset.pos; c.height = POSITIONS[c.pos].h[2]; regen(); SFX.play('click'); render(); });
      $$('[data-roll]', form).forEach(b => b.onclick = () => doRoll(b.dataset.roll));
      $$('[data-look]', form).forEach(b => b.onclick = () => { c.look[b.dataset.look] = b.dataset.val; SFX.play('click'); render(); });
      $$('[data-tog]', form).forEach(b => b.onclick = () => { c.look[b.dataset.tog] = !c.look[b.dataset.tog]; SFX.play('click'); render(); });
      const rnd = $('[data-a=random]', form); if (rnd) rnd.onclick = () => { const r = Art.lookFromSeed(Math.random() + ''); Object.assign(c.look, { skin: r.skin, hair: r.hair, hairColor: r.hairColor, beard: r.beard, headband: Engine.pick(Art.ACCENTS), sleeve: Engine.pick(Art.ACCENTS), shoes: Engine.pick(Art.SHOES), shoeColor: Engine.pick(['#ffffff', '#111827', '#dc2626', '#facc15']) }); render(); };
    };
    const validate = target => {
      if (!c.first || !c.last) { toast('Enter a first and last name.', 'bad'); c.step = 0; render(); $('#fFirst').focus(); return false; }
      if (!c.hometown) c.hometown = 'Brooklyn, NY';
      if (target > 2 && (!c.arch || !c.weapon)) { toast('Roll your archetype AND your weapon first.', 'bad'); c.step = 2; render(); return false; }
      return true;
    };
    $$('.step').forEach((b, i) => b.onclick = () => { if (c.rolling) return; if (i <= c.step || validate(i)) { c.step = i; render(); } });
    $('#cback').onclick = () => { if (c.step && !c.rolling) { c.step--; render(); } };
    $('#cnext').onclick = () => {
      SFX.init(); SFX.play('click');
      if (c.rolling || !validate(c.step + 1)) return;
      if (c.step < STEPS.length - 1) { c.step++; render(); return; }
      c.look.expr = 'neutral';
      Game.newCareer({ first: c.first, last: c.last, hometown: c.hometown, num: c.num, difficulty: c.difficulty, pos: c.pos, height: c.height, wingspan: c.height + c.ape, arch: c.arch, weapon: c.weapon, look: c.look });
    };
    render();
  }

  /* =================================================================
     STORY SCENE (visual-novel style)
     node: resolved node; onChoice(choice) called when done.
     ================================================================= */
  function story(node, chapter, onChoice) {
    const s = S();
    setBg(node.scene || 'playground', (node.scene || '') + (s.career.hs || ''));
    SFX.music(node.music || (node.scene === 'hospital' || node.scene === 'street_night' ? 'sad' : 'story'));
    const lines = (node.lines || []).filter(l => Engine.check(s, l[3]));
    const choices = (node.choices || []).filter(c => Engine.check(s, c.req));
    showScreen(`
      <div class="story">
        <div class="story-top"><span class="chap">${chapter.title} · ${chapter.name}</span><button class="icon-btn" id="skipBtn" title="Skip to choices">⏭</button></div>
        <div class="portraits"><div class="portrait left" id="pl"></div><div class="portrait right" id="pr"></div></div>
        <div class="dialog glass" id="dlg">
          <div class="speaker" id="spk"></div>
          <div class="dtext" id="dtext"></div>
          <div class="dnext" id="dnext">▼</div>
          <div class="choices" id="choices"></div>
        </div>
      </div>`, 'story');
    let i = -1, typing = false, full = '', timer = null, leftId = null, done = false;
    const dtext = $('#dtext'), spk = $('#spk'), dlgEl = $('#dlg');
    const alive = () => $('#dlg') === dlgEl; let picked = false;
    const setPortrait = (el, id, expr, active) => {
      if (!id) { el.innerHTML = ''; el.className = el.className.replace(/ ?(active|dim)/g, ''); return; }
      const key = id + (expr || '');
      if (el.dataset.key !== key) { el.dataset.key = key; el.innerHTML = Art.avatar(charLook(id, expr), { mode: 'bust' }) + `<div class="p-name">${esc(STORY.characters[id].short || STORY.characters[id].name)}</div>`; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
      el.classList.toggle('active', active); el.classList.toggle('dim', !active);
    };
    const showLine = () => {
      if (!alive()) return cleanup();
      i++;
      if (i >= lines.length) return showChoices();
      const [who, raw, expr] = lines[i]; full = Engine.text(raw, s);
      const ch = STORY.characters[who];
      if (who === 'narrator') { spk.innerHTML = ''; spk.className = 'speaker none'; dtext.className = 'dtext narr'; setPortrait($('#pl'), leftId, null, false); setPortrait($('#pr'), 'you', null, false); }
      else {
        const isYou = who === 'you';
        spk.className = 'speaker'; spk.style.setProperty('--c', isYou ? '#facc15' : ch.color || '#f97316');
        spk.innerHTML = `<b>${esc(isYou ? s.player.first + ' ' + s.player.last : ch.name)}</b><span>${esc(isYou ? POSITIONS[s.player.pos].name : ch.role)}</span>`;
        dtext.className = 'dtext';
        if (!isYou) { leftId = who; setPortrait($('#pl'), who, expr, true); setPortrait($('#pr'), 'you', null, false); }
        else { setPortrait($('#pl'), leftId, null, false); setPortrait($('#pr'), 'you', expr, true); }
      }
      // typewriter
      let k = 0; typing = true; dtext.textContent = ''; $('#dnext').style.opacity = 0;
      clearInterval(timer);
      const sp = settings.textSpeed;
      if (sp >= 99) { dtext.textContent = full; typing = false; $('#dnext').style.opacity = 1; return; }
      timer = setInterval(() => { if (!alive()) return clearInterval(timer); k += sp; dtext.textContent = full.slice(0, k); if (k % 6 === 0) SFX.play('tick'); if (k >= full.length) { clearInterval(timer); typing = false; $('#dnext').style.opacity = 1; } }, 22);
    };
    const advance = () => {
      if (done || !alive()) return;
      if (typing) { clearInterval(timer); dtext.textContent = full; typing = false; $('#dnext').style.opacity = 1; return; }
      SFX.play('page'); showLine();
    };
    const showChoices = () => {
      done = true; $('#dnext').style.display = 'none';
      const box = $('#choices');
      const list = choices.length ? choices : [{ t: 'Continue ›', next: node.next, cont: true }];
      box.innerHTML = list.map((c, k) => {
        let tag = '';
        if (c.check) { const p = Engine.checkPct(s, c.check); tag = `<span class="pct ${p >= 60 ? 'hi' : p >= 40 ? 'mid' : 'lo'}">${[].concat(c.check.a).map(a => ATTR_BY_KEY[a].s).join('+')} ${p}%</span>`; }
        if (c.hint) tag += `<span class="hint">${esc(c.hint)}</span>`;
        return `<button class="choice ${c.cont ? 'cont' : ''}" data-k="${k}"><kbd>${k + 1}</kbd><span>${esc(Engine.text(c.t, s))}</span>${tag}</button>`;
      }).join('');
      box.classList.add('show');
      $$('.choice', box).forEach(b => b.onclick = () => pickC(+b.dataset.k));
      function pickC(k) { if (!alive() || picked) return; picked = true; cleanup(); SFX.play('click'); $$('.choice', box).forEach(b => b.disabled = true); onChoice(list[k]); }
    };
    const kd = e => {
      if (done) { const k = parseInt(e.key, 10); if (k >= 1) { const b = $(`.choice[data-k="${k - 1}"]`); b && b.click(); } else if ((e.code === 'Space' || e.code === 'Enter') && $$('.choice').length === 1) $('.choice').click(); return; }
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); }
    };
    const cleanup = () => { window.removeEventListener('keydown', kd); clearInterval(timer); };
    window.addEventListener('keydown', kd);
    $('#dlg').addEventListener('click', e => { if (!e.target.closest('.choice')) advance(); });
    $('#skipBtn').onclick = () => { clearInterval(timer); typing = false; i = lines.length - 1; if (lines.length) { const l = lines[i]; full = Engine.text(l[1], s); dtext.textContent = full; } showChoices(); };
    if (node._fxChanges) setTimeout(() => fxToasts(node._fxChanges), 300);
    showLine();
  }

  /* =================================================================
     HUB
     ================================================================= */
  let hubTab = 'home', pendingUp = {};
  function hub(ctx) { // ctx: { title, intro, cta:{label, action}, chapter }
    const s = S(); hubTab = ctx.tab || hubTab || 'home'; pendingUp = {};
    setBg('rec', 'hub'); SFX.music('hub');
    showScreen(`<div class="hub">
      <header class="hub-top glass" id="hubTop"></header>
      <nav class="hub-tabs" id="hubTabs">${[['home', 'Home'], (s.season || (s.career.seasons || []).length) && ['season', 'Season'], s.recruit && ['recruit', 'Recruiting'], ['train', 'Train'], ['upgrade', 'Upgrade'], ['badges', 'Badges'], ['shop', 'Shop'], ['social', 'Social'], ['career', 'Career'], ['trophies', 'Achievements'], ['courts', 'Courts'], ['cutscenes', 'Cutscenes']].filter(Boolean).map(([k, n]) => `<button data-tab="${k}">${n}${k === 'upgrade' ? '<i class="dot" id="spDot"></i>' : ''}</button>`).join('')}</nav>
      <section class="hub-body" id="hubBody"></section>
      <footer class="hub-cta"><div class="hub-cta-info"><b>${esc(ctx.title || 'Free Time')}</b><span id="apInfo"></span></div><div class="cta-btns">${ctx.cta2 ? `<button class="btn big ghost" id="cta2Btn">${ctx.cta2.label}</button>` : ''}<button class="btn big glow" id="ctaBtn" ${ctx.cta.disabled ? 'disabled' : ''}>${ctx.cta.label}</button></div></footer>
    </div>`, 'hubscreen');
    $$('#hubTabs button').forEach(b => b.onclick = () => { SFX.play('click'); hubTab = b.dataset.tab; renderHub(ctx); });
    const go = c => { if (Object.keys(pendingUp).length) { toast('You have un-applied upgrades — apply or reset them first.', 'bad'); hubTab = 'upgrade'; renderHub(ctx); return; } SFX.play('click'); c.action(); };
    $('#ctaBtn').onclick = () => go(ctx.cta);
    if (ctx.cta2) $('#cta2Btn').onclick = () => go(ctx.cta2);
    if (!$(`#hubTabs [data-tab="${hubTab}"]`)) hubTab = 'home';
    renderHub(ctx);
    if (ctx.intro && !ctx.season && !s.flags['seen_' + ctx.key]) { s.flags['seen_' + ctx.key] = true; setTimeout(() => toast(`<b>${esc(ctx.title)}</b><br>${esc(ctx.intro)}`, 'info', 7000), 400); }
  }
  function renderTop() {
    const s = S(), p = s.player, need = PROGRESSION.xpForLevel(p.level), tier = Engine.tierOf(Engine.ovr(s));
    $('#hubTop').innerHTML = `
      <div class="ht-av">${Art.avatar(Engine.look(s), { mode: 'portrait' })}</div>
      <div class="ht-id"><b>${esc(p.first)} ${esc(p.last)}</b><span>${p.pos} · ${ARCHETYPES[p.arch].name} · Age ${p.age} · ${esc(s.career.stage)}</span></div>
      <div class="ht-ovr tier-${tier.id}"><b>${Engine.ovrLabel(s)}</b><span>OVR</span></div>
      <div class="ht-lvl"><span>LVL <b>${p.level}</b></span>${bar(p.xp, need, 'xp')}<small>${p.xp}/${need} XP</small></div>
      <div class="ht-stats"><div title="Skill Points"><b>${p.sp}</b><span>SP</span></div><div title="Money"><b>${Engine.fmtMoney(s.meta.money)}</b><span>CASH</span></div><div title="Fans"><b>${Engine.fmtFans(s.meta.fans)}</b><span>FANS</span></div><div title="Reputation"><b>${s.meta.rep}</b><span>REP</span></div>${s.recruit ? `<div title="Recruiting stars · national rank"><b class="stars">${Engine.starStr(s.recruit.stars)}</b><span>#${s.recruit.rank}</span></div>` : ''}</div>
      <button class="icon-btn" id="setBtn2" title="Settings">⚙</button>`;
    $('#setBtn2').onclick = settingsModal;
    const dot = $('#spDot'); if (dot) dot.style.display = p.sp > 0 ? 'inline-block' : 'none';
    const ap = s.hub ? s.hub.ap : 0; $('#apInfo').innerHTML = `Actions left: ${'<i class="ap on"></i>'.repeat(ap)}${'<i class="ap"></i>'.repeat(Math.max(0, (s.hub && s.hub.key.startsWith('season:') ? PROGRESSION.seasonHubActions : PROGRESSION.hubActions) - ap))}`;
  }
  function renderHub(ctx) {
    const s = S(); renderTop();
    $$('#hubTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === hubTab));
    const body = $('#hubBody'); body.className = 'hub-body tab-' + hubTab;
    const T = {
      home: () => {
        const m = s.meta;
        const rels = ['lou', 'tariq', 'kai', 'mom', 'nia'].map(id => { const v = s.rel[id] || 0, ch = STORY.characters[id]; return `<div class="rel"><div class="rel-av">${Art.avatar(charLook(id), { mode: 'portrait' })}</div><div><b>${ch.short}</b>${bar(v + 100, 200, v >= 30 ? 'good' : v <= -20 ? 'warn' : '')}<small>${v >= 60 ? 'Ride or die' : v >= 30 ? 'Close' : v >= 0 ? 'Neutral' : v >= -30 ? 'Tense' : 'Enemy'}</small></div></div>`; }).join('');
        return `<div class="home-grid">
          <div class="home-card">${cardFromState(s)}</div>
          <div class="home-main">
            <div class="glass panel next-card">${ctx.next ? `<div class="nc-vs">${Art.logo(LOCAL_TEAMS[S().season ? S().season.user : 'lincoln'], 54)}<span>VS</span>${Art.logo(LOCAL_TEAMS[ctx.next.opp], 54)}${ctx.next.key ? '<em class="keytag">🔑 KEY GAME</em>' : ''}</div>` : ''}<div class="nc-tag">${esc(ctx.chapter || '')}</div><h3>${esc(ctx.title || '')}</h3><p>${esc(ctx.intro || 'Train, upgrade and gear up — then continue the story.')}</p></div>
            <div class="glass panel"><h4>Status</h4><div class="meters">
              <div class="mtr"><span>Confidence</span>${bar(m.morale, 100, m.morale >= 60 ? 'good' : m.morale < 35 ? 'warn' : '')}<b>${m.morale}</b></div>
              <div class="mtr"><span>Fatigue</span>${bar(m.fatigue, 100, m.fatigue >= 60 ? 'warn' : '')}<b>${m.fatigue}</b></div>
              <div class="mtr"><span>Reputation</span>${bar(m.rep)}<b>${m.rep}</b></div>
              <div class="mtr"><span>Team Chemistry</span>${bar(m.chem)}<b>${m.chem}</b></div>
              ${m.injury.games > 0 ? `<div class="mtr inj"><span>🩹 ${esc(m.injury.name)}</span><b>${m.injury.games} games</b></div>` : ''}
            </div>${m.fatigue >= 60 ? '<p class="warn-text">High fatigue lowers your success % and makes free throws wobble. Rest or grab an Ice Bath.</p>' : ''}</div>
            <div class="glass panel style-panel"><h4>Play Style</h4>${(() => { const A = Engine.archOf(s), W = Engine.weaponOf(s), ap = Engine.ape(s); return `
              <div class="sp-row"><div class="sp-ico">${Art.icon(A.icon, A.color, '#0006', 30)}</div><div><b>${esc(A.name)}</b> ${rarityTag(A.rarity)}<small>${esc(A.passive.name)}: ${esc(A.passive.desc)}</small></div></div>
              <div class="sp-row"><div class="sp-ico">${Art.icon(W.icon, RARITY[W.rarity].color, '#0006', 30)}</div><div><b>⚔ ${esc(W.name)}</b> ${rarityTag(W.rarity)}<small>${esc(W.desc)} ${W.power}% success · charges after ${W.charge} wins${Engine.hasSpecial(s, 'formless') ? ' · two uses per game' : ''}.</small></div></div>
              <div class="sp-row"><div class="sp-ico">📏</div><div><b>${Engine.heightStr(s.player.height)} · wingspan ${Engine.heightStr(s.player.wingspan)}</b><small>Ape index ${ap >= 0 ? '+' : ''}${ap}". ${ap >= 3 ? 'Long arms boost your blocks, steals, contests and rebounds.' : ap < 0 ? 'Short arms: tighter handle, tougher on defense.' : 'Average length.'}</small></div></div>`; })()}</div>
            <div class="glass panel"><h4>Relationships</h4><div class="rels">${rels}</div></div>
            <div class="glass panel"><h4>Latest posts</h4>${s.feed.slice(0, 3).map(feedPost).join('') || '<p class="muted">Nobody\'s talking about you. Yet.</p>'}</div>
          </div></div>`;
      },
      season: () => {
        const se = s.season;
        if (!se) { const last = s.career.seasons.slice(-3).reverse(); return `<div class="glass panel"><h4>Season History</h4>${seasonHistory(last)}</div>`; }
        const rec = se.standings[se.user];
        return `<div class="season-grid">
          <div class="glass panel"><h4>${esc(se.name)} · ${rec.w}-${rec.l}</h4><div class="statboxes">${[['GP', se.stats.gp], ['PPG', (se.stats.pts / (se.stats.gp || 1)).toFixed(1)], ['RPG', (se.stats.reb / (se.stats.gp || 1)).toFixed(1)], ['APG', (se.stats.ast / (se.stats.gp || 1)).toFixed(1)], ['Role', Season.role(s)]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div></div>
          <div class="glass panel"><h4>Standings</h4>${standingsHTML(se)}</div>
          <div class="glass panel"><h4>${se.playoffs ? esc(se.def.playoff.name) + ' Bracket' : 'Schedule'}</h4>${se.playoffs ? bracketHTML(se) : scheduleHTML(se)}</div>
          ${se.playoffs ? `<div class="glass panel"><h4>Regular Season</h4>${scheduleHTML(se)}</div>` : ''}
          ${s.career.seasons.length ? `<div class="glass panel"><h4>Past Seasons</h4>${seasonHistory(s.career.seasons.slice(-3).reverse())}</div>` : ''}
        </div>`;
      },
      recruit: () => {
        const R = s.recruit, sc = Engine.recruitScore(s);
        const offers = R.offers.map(id => [id, COLLEGES[id]]).sort((a, b) => b[1].prestige - a[1].prestige);
        return `<div class="recruit-grid">
          <div class="glass panel rec-head"><div class="rec-stars">${Engine.starStr(R.stars)}</div><div><b>National rank #${R.rank}</b><span>Recruiting score ${sc} · next star at ${RECRUITING.starAt[R.stars] != null ? RECRUITING.starAt[R.stars] : '—'}</span></div>
            <p class="muted small">Stars move with your Overall, reputation, scoring average and big moments (titles, beating Kai, going viral). Programs offer once you reach their level.</p></div>
          <div class="offers">${offers.map(([id, c]) => `<div class="offer glass"><div class="offer-logo">${Art.logo(c, 64)}</div><div class="offer-main"><b>${esc(c.name)} ${esc(c.nick)}</b><span class="stars">${'★'.repeat(c.prestige)}</span><small>${esc(c.coach)} · ${esc(c.conf)}</small><em>"${esc(c.pitch)}"</em>
            <div class="offer-bars"><span>Minutes</span>${bar(c.playtime, 5, 'good')}<span>Exposure</span>${bar(c.exposure, 5)}<span>Development</span>${bar(c.development, 5, 'xp')}</div></div></div>`).join('') || '<p class="muted glass panel">No offers yet. Keep playing — coaches are watching.</p>'}</div>
          <div class="glass panel"><h4>Still Watching</h4><div class="watching">${Object.entries(COLLEGES).filter(([id]) => !R.offers.includes(id)).map(([id, c]) => `<div title="${esc(c.name)}">${Art.logo(c, 40)}<small>${'★'.repeat(c.prestige)}</small></div>`).join('')}</div></div>
        </div>`;
      },
      train: () => `<p class="muted glass panel">Each session uses 1 action and plays a short minigame — better performance = bigger gains. Fatigue builds up; rest when you need to.</p>
        <div class="train-grid">${TRAINING.map(t => `<button class="tcard glass" data-train="${t.id}" ${s.hub.ap <= 0 ? 'disabled' : ''}><div class="tc-ico">${Art.icon(t.icon, '#f97316', '#0006', 40)}</div><b>${t.name}</b><span>${t.desc}</span><div class="tc-attrs">${t.keys.map(k => `<em>${ATTR_BY_KEY[k].s} ${s.player.attrs[k]}</em>`).join('')}</div></button>`).join('')}
          <button class="tcard glass pickup" data-pickup ${s.hub.ap <= 0 ? 'disabled' : ''}><div class="tc-ico">${Art.icon('ball', '#38bdf8', '#0006', 40)}</div><b>Pickup Run</b><span>3v3 to 21 at <b>${esc(VENUES[s.pickupCourt && Venues.unlocked(s).includes(s.pickupCourt) ? s.pickupCourt : 'street_night'].name)}</b>. Win for XP and a small stat bump. Change courts in the Courts tab.</span><div class="tc-attrs"><em>+30–60 XP</em><em>🕹 Arcade segments</em></div></button>
          <button class="tcard glass rest" data-rest ${s.hub.ap <= 0 ? 'disabled' : ''}><div class="tc-ico">${Art.icon('heart', '#22c55e', '#0006', 40)}</div><b>Rest & Recover</b><span>Sleep in, eat right, ice the knees.</span><div class="tc-attrs"><em>−35 Fatigue</em><em>+4 Confidence</em></div></button></div>
        ${s.hub.ap <= 0 ? '<p class="warn-text center">No actions left. Continue the story to refresh.</p>' : ''}`,
      upgrade: () => {
        const cp = Engine.capsOf(s);
        const groups = {}; ATTRS.forEach(a => (groups[a.g] = groups[a.g] || []).push(a));
        const pend = k => pendingUp[k] || 0;
        const tmp = JSON.parse(JSON.stringify(s)); for (const k in pendingUp) tmp.player.attrs[k] += pendingUp[k];
        const spLeft = s.player.sp - Object.entries(pendingUp).reduce((t, [k, n]) => { let c = 0; for (let j = 0; j < n; j++) c += Engine.upgradeCost(s.player.attrs[k] + j); return t + c; }, 0);
        return `<div class="up-grid"><div class="up-list glass panel">
          <div class="up-head"><b>Skill Points: <span class="hl">${spLeft}</span></b><span class="muted">Cost per +1: 1 SP (&lt;60) · 2 (&lt;75) · 3 (&lt;87) · 4 (87+)</span></div>
          ${Object.entries(groups).map(([g, list]) => `<h4>${g}</h4>${list.map(a => { const v = s.player.attrs[a.k] + pend(a.k), cost = Engine.upgradeCost(v); return `<div class="up-row"><span class="up-n">${a.n}</span><div class="up-bar"><i style="width:${s.player.attrs[a.k] / 99 * 100}%"></i><i class="pend" style="left:${s.player.attrs[a.k] / 99 * 100}%;width:${pend(a.k) / 99 * 100}%"></i><u style="left:${cp[a.k] / 99 * 100}%" title="Cap ${cp[a.k]}"></u></div><b class="${pend(a.k) ? 'hl' : ''}">${v}</b><button class="mini" data-dn="${a.k}" ${pend(a.k) ? '' : 'disabled'}>−</button><button class="mini plus" data-up="${a.k}" ${v >= cp[a.k] || cost > spLeft ? 'disabled' : ''} title="Cost ${cost} SP">+</button></div>`; }).join('')}`).join('')}
        </div><div class="up-side glass panel"><h4>Overall</h4><div class="up-ovr"><b>${Engine.ovr(s)}</b>${Object.keys(pendingUp).length ? ` → <b class="hl">${Engine.ovr(tmp)}</b>` : ''}</div>${radar(Engine.radar(s), 240, Object.keys(pendingUp).length ? Engine.radar(tmp) : null)}
          <div class="row"><button class="btn ghost" id="upReset" ${Object.keys(pendingUp).length ? '' : 'disabled'}>Reset</button><button class="btn glow" id="upApply" ${Object.keys(pendingUp).length ? '' : 'disabled'}>Apply</button></div>
          <p class="muted small">The grey tick on each bar is your height-based cap.</p></div></div>`;
      },
      badges: () => `<div class="badge-grid">${BADGES.map(b => { const t = Engine.badgeTier(s, b), nx = t < 4 ? `Next: ${ATTR_BY_KEY[b.attr].n} ${b.at[t]} or ${b.ct[t]} career ${b.counter.replace(/([A-Z])/g, ' $1').toLowerCase()} (${s.counters[b.counter] || 0})` : 'MAXED'; return `<div class="bcard glass ${t ? '' : 'locked'}">${Art.badge(b, t, 58)}<div><b>${b.name}</b><span class="btier t${t}">${BADGE_TIERS[t]}</span><p>${b.desc}</p><small>${nx}</small></div></div>`; }).join('')}</div>`,
      shop: () => {
        const cats = [...new Set(SHOP.map(i => i.cat))];
        return `<div class="shop-grid"><div class="shop-prev glass panel">${Art.avatar(Engine.look(s), { mode: 'full' })}<b>${Engine.fmtMoney(s.meta.money)}</b><span class="muted">Equipped gear shows on your avatar everywhere.</span></div><div class="shop-items">
          ${cats.map(cat => `<h4>${cat}</h4><div class="items">${SHOP.filter(i => i.cat === cat).map(it => {
            const own = s.inventory.owned.includes(it.id), eq = it.slot && s.inventory.equipped[it.slot] === it.id;
            const sw = it.look ? (it.look.headband || it.look.sleeve || it.look.wrist || it.look.shoeColor || (it.look.goggles ? '#93c5fd' : it.look.chain ? '#facc15' : '#64748b')) : '#22c55e';
            const btn = it.consumable ? `<button class="btn sm" data-buy="${it.id}" ${s.meta.money < it.price ? 'disabled' : ''}>Buy ${Engine.fmtMoney(it.price)}</button>` : own ? `<button class="btn sm ${eq ? 'ghost' : ''}" data-eq="${it.id}">${eq ? 'Unequip' : 'Equip'}</button>` : `<button class="btn sm" data-buy="${it.id}" ${s.meta.money < it.price ? 'disabled' : ''}>Buy ${Engine.fmtMoney(it.price)}</button>`;
            return `<div class="item glass ${eq ? 'eq' : ''}"><i class="swatch" style="background:${sw}"></i><div><b>${it.name}</b><small>${it.desc || (it.boost ? Object.entries(it.boost).map(([k, v]) => `+${v} ${ATTR_BY_KEY[k].n}`).join(', ') : 'Cosmetic')}</small></div>${btn}</div>`;
          }).join('')}</div>`).join('')}</div></div>`;
      },
      social: () => `<div class="feed glass panel"><div class="feed-head"><b>Your feed</b><span>${Engine.fmtFans(s.meta.fans)} followers</span></div>${s.feed.map(feedPost).join('') || '<p class="muted">No posts yet.</p>'}</div>`,
      career: () => {
        const c = s.counters, g = s.career.games, gp = g.length || 1;
        const avg = k => (g.reduce((t, x) => t + (x[k] || 0), 0) / gp).toFixed(1);
        const h = s.ovrHistory.slice(-30); const max = Math.max(...h.map(x => x.ovr), 50), min = Math.min(...h.map(x => x.ovr), 30);
        const pts = h.map((x, i) => `${(h.length > 1 ? i / (h.length - 1) : 0) * 560 + 20},${170 - (x.ovr - min) / (max - min || 1) * 140}`).join(' ');
        return `<div class="career-grid">
          <div class="glass panel"><h4>Career Totals</h4><div class="statboxes">${[['Games', c.games], ['W-L', `${c.wins}-${c.losses}`], ['PPG', avg('pts')], ['RPG', avg('reb')], ['APG', avg('ast')], ['Dunks', c.dunks], ['Threes', c.threes], ['Game-winners', c.gameWinners], ['Best game', c.best + ' pts'], ['Trainings', c.trainings]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div></div>
          <div class="glass panel"><h4>Overall Progression</h4><svg viewBox="0 0 600 190" class="linechart"><polyline points="${pts}" fill="none" stroke="#f97316" stroke-width="3"/>${h.map((x, i) => `<circle cx="${(h.length > 1 ? i / (h.length - 1) : 0) * 560 + 20}" cy="${170 - (x.ovr - min) / (max - min || 1) * 140}" r="4" fill="#facc15"><title>${esc(x.label)}: ${x.ovr}</title></circle>`).join('')}<text x="4" y="24" fill="#94a3b8" font-size="12">${max}</text><text x="4" y="172" fill="#94a3b8" font-size="12">${min}</text></svg></div>
          <div class="glass panel wide"><h4>Game Log</h4><table class="tbl"><thead><tr><th>Game</th><th>Result</th><th>PTS</th><th>REB</th><th>AST</th><th>Grade</th></tr></thead><tbody>${g.slice().reverse().map(x => `<tr><td>${esc(x.label)}</td><td class="${x.win ? 'w' : 'l'}">${x.win ? 'W' : 'L'} ${x.us}-${x.them}</td><td>${x.pts}</td><td>${x.reb}</td><td>${x.ast}</td><td><span class="grade-s g${x.grade[0]}">${x.grade}</span></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No games yet.</td></tr>'}</tbody></table></div>
          <div class="glass panel wide"><h4>Story Log</h4><ul class="log">${s.log.slice().reverse().map(l => `<li>${esc(l)}</li>`).join('') || '<li class="muted">Your story is just beginning.</li>'}</ul></div>
        </div>`;
      },
      courts: () => {
        const un = Venues.unlocked(s), cur = s.pickupCourt && un.includes(s.pickupCourt) ? s.pickupCourt : 'street_night', G = Venues.groups();
        return `<p class="muted glass panel">Courts you've played on unlock here (<b>${un.length}</b> / ${Object.keys(VENUES).length}). Pick any unlocked court for your pickup runs. Street courts can also turn up on their own — the run moves around.</p>
          ${Object.entries(G).map(([g, ids]) => `<h4 class="courts-h">${esc(g)}</h4><div class="courts">${ids.map(id => { const v = VENUES[id], ok = un.includes(id);
            return `<div class="court-card glass ${ok ? '' : 'locked'} ${id === cur ? 'sel' : ''}"><canvas class="ccv" data-venue="${ok ? id : ''}" width="192" height="108"></canvas><div><b>${ok ? esc(v.name) : '???'}</b><small>${ok ? esc(v.desc || '') : 'Play here to unlock'}</small>${ok ? `<button class="btn sm ${id === cur ? 'ghost' : ''}" data-court="${id}" ${id === cur ? 'disabled' : ''}>${id === cur ? '✓ Pickup court' : 'Use for pickup'}</button>` : ''}</div></div>`; }).join('')}</div>`).join('')}`;
      },
      cutscenes: () => `<p class="muted glass panel">Rewatch the cutscenes you've unlocked. New ones unlock as your story unfolds.</p><div class="cs-gallery">${Cutscene.list(s).map(c => `<div class="csg glass ${c.unlocked ? '' : 'locked'}"><div class="csg-thumb">${Art.scene(CUTSCENES[c.id].shots[CUTSCENES[c.id].shots.length - 1].scene || 'title', 'thumb' + c.id)}<span>${c.unlocked ? '' : '🔒'}</span></div><div class="csg-info"><div><b>${c.unlocked ? esc(c.name) : '???'}</b><small>${esc(c.chapter)}</small></div>${c.unlocked ? `<button class="btn sm" data-cs="${c.id}">▶ Watch</button>` : ''}</div></div>`).join('')}</div>`,
      trophies: () => `<div class="ach-grid">${ACHIEVEMENTS.map(a => `<div class="ach glass ${s.achievements[a.id] ? 'got' : ''}"><div class="ach-ico">${s.achievements[a.id] ? '🏆' : '🔒'}</div><div><b>${a.name}</b><span>${a.desc}</span></div></div>`).join('')}</div>`,
    };
    body.innerHTML = T[hubTab]();
    // bindings
    $$('[data-train]', body).forEach(b => b.onclick = () => Game.train(b.dataset.train));
    $$('[data-rest]', body).forEach(b => b.onclick = () => Game.rest());
    $$('[data-pickup]', body).forEach(b => b.onclick = () => Game.pickup());
    $$('[data-court]', body).forEach(b => b.onclick = () => { s.pickupCourt = b.dataset.court; SFX.play('click'); Game.save(); renderHub(ctx); });
    $$('canvas[data-venue]', body).forEach(cv => { const id = cv.dataset.venue, g = cv.getContext('2d'); g.imageSmoothingEnabled = false; if (!id) { g.fillStyle = '#0b0f1c'; g.fillRect(0, 0, 192, 108); Pixel.text(g, 'LOCKED', 96, 50, '#475569', 2, 'center'); return; }
      const home = LOCAL_TEAMS[s.career.hs] || LOCAL_TEAMS.halsey, V = Pixel.venue(id, home, LOCAL_TEAMS.pickup_crew, 384); g.drawImage(V.bg, 0, 0, 384, 216, 0, 0, 192, 108); const R = Pixel.renderer(g, V); g.save(); g.scale(.5, .5); R.crowd(); R.hoop(false); R.hoop(true); R.lights(); g.restore(); g.drawImage(V.vg, 0, 0, 192, 108); });
    $$('[data-cs]', body).forEach(b => b.onclick = () => { const it = Cutscene.list(s).find(x => x.id === b.dataset.cs); Cutscene.play(b.dataset.cs, (it && it.ctx) || {}); });
    $$('[data-buy]', body).forEach(b => b.onclick = () => Game.buy(b.dataset.buy));
    $$('[data-eq]', body).forEach(b => b.onclick = () => Game.equip(b.dataset.eq));
    $$('[data-up]', body).forEach(b => b.onclick = () => { pendingUp[b.dataset.up] = (pendingUp[b.dataset.up] || 0) + 1; SFX.play('tick'); renderHub(ctx); });
    $$('[data-dn]', body).forEach(b => b.onclick = () => { const k = b.dataset.dn; pendingUp[k]--; if (!pendingUp[k]) delete pendingUp[k]; renderHub(ctx); });
    const ap = $('#upApply', body); if (ap) ap.onclick = () => { Game.applyUpgrades(pendingUp); pendingUp = {}; renderHub(ctx); };
    const rs = $('#upReset', body); if (rs) rs.onclick = () => { pendingUp = {}; renderHub(ctx); };
  }
  function refreshHub(ctx) { if (document.body.dataset.screen === 'hubscreen') renderHub(ctx); }

  /* Training minigame modal */
  async function trainingModal(drill) {
    const m = modal(`<h2>${drill.name}</h2><p class="muted">${drill.desc}</p><div class="train-stage" id="tstage"></div>`, { noClose: true, cls: 'train' });
    try { const home = LOCAL_TEAMS[S().career.hs] || LOCAL_TEAMS.halsey, V = Pixel.venue('practice', home, home, 384), bgc = document.createElement('canvas'); bgc.width = 384; bgc.height = 216; bgc.className = 'train-bg';
      const g = bgc.getContext('2d'); g.drawImage(V.bg, 0, 0); const R = Pixel.renderer(g, V); R.hoop(false); R.hoop(true); R.crowd(); g.drawImage(V.vg, 0, 0); $('#tstage', m.el).appendChild(bgc); } catch (e) { }
    await sleep(300);
    return { m, layer: $('#tstage', m.el) };
  }

  /* =================================================================
     POST-GAME
     ================================================================= */
  function postGame(r, summary, onContinue) {
    const s = S(), b = r.box, cfg = r.cfg;
    setBg(r.win ? 'playground' : 'playground_night', 'post');
    const [who, quotes] = STORY.reactions[r.grade[0] === 'A' ? 'A' : r.grade[0] === 'B' ? 'B' : r.grade[0] === 'C' ? 'C' : 'F'];
    const speaker = s.flags.lou_snub ? 'tariq' : who;
    const quote = s.flags.lou_snub ? (r.win ? 'BRO. That was crazy. Let\'s gooo!' : 'We\'ll get \'em next time, bro. Shake it off.') : Engine.pick(quotes);
    showScreen(`<div class="postgame">
      <div class="pg-head glass">
        <div class="pg-team">${Art.logo(cfg.us, 56)}<b>${esc(cfg.us.name)}</b></div>
        <div class="pg-score"><span class="${r.win ? 'w' : ''}">${r.us}</span><em>FINAL</em><span class="${r.win ? '' : 'w'}">${r.them}</span></div>
        <div class="pg-team">${Art.logo(cfg.them, 56)}<b>${esc(cfg.them.name)}</b></div>
      </div>
      <div class="pg-result ${r.win ? 'win' : 'loss'}">${r.win ? 'VICTORY' : 'DEFEAT'}<small>${esc(cfg.title)}${cfg.sub ? ' · ' + esc(cfg.sub) : ''}</small></div>
      <div class="pg-grid">
        <div class="glass panel pg-grade-box"><div class="pg-grade g${r.grade[0]}">${r.grade}</div><span>GAME GRADE</span>
          <div class="pg-line">${[['PTS', b.pts], ['REB', b.reb], ['AST', b.ast], ['STL', b.stl], ['BLK', b.blk], ['FG', b.fgm + '/' + b.fga], ['3PT', b.tpm + '/' + b.tpa], ['FT', b.ftm + '/' + b.fta], ['TO', b.to]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
          <div class="pg-moments">Key moments won: <b>${Math.round(r.successes)}/${r.attempts}</b>${r.clutchMoments ? ` · Clutch: <b>${r.clutchWins}</b>` : ''}</div>
        </div>
        <div class="glass panel pg-rewards"><h4>Rewards</h4>
          <div class="pg-xp"><span>+${summary.xp} XP</span>${bar(0, 1, 'xp')}<small>Level ${s.player.level}</small></div>
          <div class="pg-changes">${summary.changes.map(fmtChange).join('')}</div>
          ${summary.badges.length ? `<h4>Badge Unlocked</h4><div class="pg-badges">${summary.badges.map(x => `<div>${Art.badge(x.b, x.tier, 46)}<b>${x.b.name}</b><span>${BADGE_TIERS[x.tier]}</span></div>`).join('')}</div>` : ''}
          ${summary.achievements.length ? `<h4>Achievements</h4>${summary.achievements.map(a => `<div class="pg-ach">🏆 <b>${a.name}</b> — ${a.desc}</div>`).join('')}` : ''}
        </div>
        <div class="glass panel pg-high"><h4>Highlights</h4><ul>${(r.highlights.length ? r.highlights : [r.win ? 'Got the W' : 'Took the L, learned something']).map(h => `<li>${esc(h)}</li>`).join('')}</ul>
          <div class="pg-quote"><div class="q-av">${Art.avatar(charLook(speaker, r.win ? 'smile' : 'neutral'), { mode: 'portrait' })}</div><div><b>${STORY.characters[speaker].short}</b><p>"${esc(quote)}"</p></div></div>
        </div>
      </div>
      <div class="pg-foot"><button class="btn big glow" id="pgCont">Continue ›</button></div>
    </div>`, 'postgame');
    // animate XP bar
    setTimeout(() => { const i = $('.pg-xp .bar i'); if (i) i.style.width = Math.min(100, s.player.xp / PROGRESSION.xpForLevel(s.player.level) * 100) + '%'; }, 300);
    if (summary.levels) setTimeout(() => levelBurst(`LEVEL ${s.player.level}!`), 700);
    if (r.win) confetti(r.importance > 1 ? 160 : 70);
    if (summary.badges.length) setTimeout(() => SFX.play('perfect'), 1200);
    $('#pgCont').onclick = () => { SFX.play('click'); onContinue(); };
  }

  /* =================================================================
     CHAPTER END + ENDINGS
     ================================================================= */
  function chapterEnd(chapter, node, o) {
    const s = S(); setBg('playground_night', 'chend'); SFX.music('victory'); confetti(120);
    const recap = (node.recap || []).filter(r => Engine.check(s, r.if)).map(r => Engine.text(r.t, s));
    const d = o.dev;
    showScreen(`<div class="chend">
      <div class="ce-tag">${chapter.title} COMPLETE</div><h1>${chapter.name}</h1>
      <p class="ce-sum">${esc(Engine.text(node.summary, s))}</p>
      ${d && d.after > d.before ? `<div class="ce-dev glass"><b>Natural development</b><span>Overall ${d.before} → <em>${d.after}</em></span><small>Stage performance ${Math.round(d.perf * 100)}% · ${Object.entries(d.deltas).map(([k, v]) => `+${v} ${ATTR_BY_KEY[k].s}`).join(' · ')}</small></div>` : ''}
      <div class="ce-grid">${cardFromState(s, 'big')}
        <div class="glass panel ce-stats"><h4>Chapter Recap</h4>
          <div class="statboxes">${[['Overall', Engine.ovr(s)], ['Level', s.player.level], ['Record', s.counters.wins + '-' + s.counters.losses], ['Fans', Engine.fmtFans(s.meta.fans)], ['Reputation', s.meta.rep], ['Badges', Engine.badges(s).length]].concat(s.recruit ? [['Recruit', Engine.starStr(s.recruit.stars)]] : []).map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
          <ul class="log">${recap.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </div></div>
      <div class="ce-next glass"><b>NEXT: ${o.next ? esc(o.next.title + ' — ' + o.next.name) : esc(node.nextTitle || 'Next chapter')}</b><span>${esc(o.next ? (o.next.blurb || '') : (node.teaser || 'Not in this build yet — your save is ready to carry over.'))}</span></div>
      <div class="row center wrap">${o.onNext ? `<button class="btn big glow" id="ceNext">Start ${esc(o.next.title)} ›</button>` : ''}<button class="btn big ${o.onNext ? 'ghost' : 'glow'}" id="ceHub">Train in the Hub</button><button class="btn big ghost" id="ceMenu">Save & Main Menu</button></div>
    </div>`, 'chend');
    $('#ceHub').onclick = o.onHub; $('#ceMenu').onclick = () => { Game.save(); title(); };
    if (o.onNext) $('#ceNext').onclick = o.onNext;
  }

  /* =================================================================
     SEASON COMPONENTS: standings, schedule, bracket, season screens
     ================================================================= */
  const tname = id => (LOCAL_TEAMS[id] || {}).name || id;
  function standingsHTML(se) {
    const n = se.def.playoff ? se.def.playoff.teams : 0;
    return `<table class="tbl standings"><thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>+/−</th><th>Last</th></tr></thead><tbody>${Season.table(se).map((t, i) => `<tr class="${t.id === se.user ? 'me' : ''} ${i === n - 1 ? 'cutline' : ''}"><td>${i + 1}</td><td class="tm">${Art.logo(LOCAL_TEAMS[t.id], 24)}<span>${esc(tname(t.id))}</span></td><td>${t.w}</td><td>${t.l}</td><td>${t.pf - t.pa > 0 ? '+' : ''}${t.pf - t.pa}</td><td class="last">${t.last.map(x => `<i class="${x}">${x}</i>`).join('')}</td></tr>`).join('')}</tbody></table>${n ? `<p class="muted small">Top ${n} make the ${esc(se.def.playoff.name)}.</p>` : ''}`;
  }
  function scheduleHTML(se) {
    return `<ul class="sched">${se.def.schedule.map((g, i) => {
      const r = se.results.find(x => x.user && x.week === i);
      const res = r ? (r.sa > r.sb ? `<b class="w">W ${r.sa}-${r.sb}</b>` : `<b class="l">L ${r.sa}-${r.sb}</b>`) : i === se.week && se.phase === 'regular' ? '<b class="nxt">NEXT</b>' : '';
      return `<li class="${i === se.week && se.phase === 'regular' ? 'cur' : ''}"><span class="wk">W${i + 1}</span>${Art.logo(LOCAL_TEAMS[g.opp], 22)}<span class="op">${esc(tname(g.opp))}${g.key ? ' <em class="keytag sm">KEY</em>' : ''}</span>${res}</li>`;
    }).join('')}</ul>`;
  }
  function bracketHTML(se) {
    const P = se.playoffs; if (!P) return '';
    const total = Math.log2(P.rounds[0].length * 2), rounds = [];
    for (let i = 0; i < total; i++) rounds.push(P.rounds[i] || Array(P.rounds[0].length / Math.pow(2, i)).fill(null));
    const champ = Season.champion(se);
    const side = (id, sc, win, seed) => id ? `<div class="bk-team ${win ? 'win' : ''} ${id === se.user ? 'me' : ''}">${seed ? `<i>${seed}</i>` : ''}${Art.logo(LOCAL_TEAMS[id], 20)}<span>${esc(LOCAL_TEAMS[id].abbr)}</span><b>${sc != null ? sc : ''}</b></div>` : `<div class="bk-team tbd"><span>TBD</span></div>`;
    return `<div class="bracket">${rounds.map((r, i) => `<div class="bk-round"><div class="bk-name">${esc((P.names || [])[i] || 'Round ' + (i + 1))}</div>${r.map(m => `<div class="bk-match">${m ? side(m.a, m.sa, m.winner && m.winner === m.a, m.seedA) + side(m.b, m.sb, m.winner && m.winner === m.b, m.seedB) : side(null) + side(null)}</div>`).join('')}</div>`).join('')}
      <div class="bk-round champ"><div class="bk-name">Champion</div><div class="bk-champ">${champ ? `${Art.logo(LOCAL_TEAMS[champ], 56)}<b>${esc(tname(champ))}</b>` : '<span>🏆</span>'}</div></div></div>`;
  }
  function seasonHistory(list) {
    return `<table class="tbl"><thead><tr><th>Season</th><th>Team</th><th>W-L</th><th>PPG</th><th>RPG</th><th>APG</th><th>Result</th></tr></thead><tbody>${list.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(LOCAL_TEAMS[x.team] ? LOCAL_TEAMS[x.team].abbr : x.team)}</td><td>${x.w}-${x.l}</td><td>${x.ppg}</td><td>${x.rpg}</td><td>${x.apg}</td><td>${esc(x.resText)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No seasons yet.</td></tr>'}</tbody></table>`;
  }
  /* mode: 'standings' (end of regular season), 'bracket' (playoffs start), 'final' (season over) */
  function seasonScreen(se, mode, onContinue, summary) {
    setBg('rec', 'season'); SFX.music(mode === 'final' && se.result === 'champion' ? 'victory' : 'hub');
    const rec = se.standings[se.user];
    const title = mode === 'standings' ? 'Final Standings' : mode === 'bracket' ? `${se.def.playoff.name}` : se.result === 'champion' ? 'CHAMPIONS!' : 'Season Over';
    const sub = mode === 'standings' ? (se.phase === 'done' ? `You finished ${rec.w}-${rec.l} and missed the cut.` : `${rec.w}-${rec.l} — you're in the ${se.def.playoff.name}!`) : mode === 'bracket' ? 'Win or go home. Every playoff game is a key game.' : summary ? `${summary.w}-${summary.l} · ${summary.ppg} PPG · ${summary.rpg} RPG · ${summary.apg} APG — ${summary.resText}` : '';
    showScreen(`<div class="seasonscr">
      <div class="ce-tag">${esc(se.name)}</div><h1 class="${mode === 'final' && se.result === 'champion' ? 'gold' : ''}">${esc(title)}</h1><p class="ce-sum">${esc(sub)}</p>
      <div class="glass panel">${mode === 'standings' ? standingsHTML(se) : bracketHTML(se)}</div>
      ${mode === 'final' ? `<div class="glass panel">${standingsHTML(se)}</div>` : ''}
      <div class="row center"><button class="btn big glow" id="ssCont">Continue ›</button></div>
    </div>`, 'season');
    if (mode === 'final' && se.result === 'champion') confetti(180);
    $('#ssCont').onclick = () => { SFX.play('click'); onContinue(); };
  }
  /* Short summary for a simulated game */
  function simResult(r, g, summary, onContinue) {
    const b = r.box, opp = LOCAL_TEAMS[g.opp], me = LOCAL_TEAMS[Game.state.season ? Game.state.season.user : r.cfg.us.id] || r.cfg.us;
    const head = r.win ? Engine.pick([`${S().player.last} leads the way in a ${r.us}-${r.them} win`, `Business as usual: W over ${opp.name}`, `${S().player.last} gets buckets, team rolls`]) : Engine.pick([`Off night as ${opp.name} pull away`, `${opp.name} hand you a loss`, `Not enough: ${r.them}-${r.us} defeat`]);
    const m = modal(`<div class="simres"><div class="ce-tag">SIMULATED · ${esc(g.sub || '')}</div>
      <div class="sim-score">${Art.logo(me, 52)}<b class="${r.win ? 'w' : ''}">${r.us}</b><span>FINAL</span><b class="${r.win ? '' : 'w'}">${r.them}</b>${Art.logo(opp, 52)}</div>
      <h3>${esc(head)}</h3>
      <div class="pg-line">${[['PTS', b.pts], ['REB', b.reb], ['AST', b.ast], ['STL', b.stl], ['BLK', b.blk]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
      <div class="pg-changes">${[{ label: 'XP', v: summary.xp }].concat(summary.changes).map(fmtChange).join('')}<span class="chg"><b class="grade-s g${r.grade[0]}">${r.grade}</b></span></div>
      <div class="row end"><button class="btn glow" id="simCont">Continue ›</button></div></div>`, { noClose: true, cls: 'sim' });
    if (summary.levels) levelBurst();
    SFX.play(r.win ? 'good' : 'bad');
    const go = () => { m.close(); onContinue(); };
    $('#simCont', m.el).onclick = go;
  }
  function ending(id) {
    const s = S(), E = STORY.endings[id]; setBg(E.scene || 'playground_night', 'end'); SFX.music('sad');
    showScreen(`<div class="ending">
      <div class="end-tag">${E.tag}</div><h1>${E.title}</h1><p>${esc(Engine.text(E.text, s))}</p>
      <div class="summary-card glass" id="sumCard">
        <div class="sc-left">${Art.avatar(Engine.look(s), { mode: 'full' })}</div>
        <div class="sc-right"><div class="sc-title">${esc(s.player.first)} <b>${esc(s.player.last)}</b></div><div class="sc-sub">${POSITIONS[s.player.pos].name} · ${ARCHETYPES[s.player.arch].name} · ${esc(s.player.hometown)}</div>
          <div class="statboxes">${[['Peak OVR', Math.max(...s.ovrHistory.map(x => x.ovr), Engine.ovr(s))], ['Games', s.counters.games], ['Record', s.counters.wins + '-' + s.counters.losses], ['Points', s.counters.points], ['Fans', Engine.fmtFans(s.meta.fans)], ['Badges', Engine.badges(s).length]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
          <div class="sc-ending">ENDING: ${E.title.toUpperCase()}</div></div>
      </div>
      <p class="muted center">Screenshot your career card, then try again — different choices, different career.</p>
      <div class="row center"><button class="btn big glow" id="endNew">Start a New Career</button><button class="btn big ghost" id="endMenu">Main Menu</button></div>
    </div>`, 'ending');
    $('#endNew').onclick = () => create(); $('#endMenu').onclick = () => title();
  }

  /* "Now playing" label when a new track starts */
  window.addEventListener('hd-song', e => {
    let el = $('#nowplaying'); if (!el) { el = document.createElement('div'); el.id = 'nowplaying'; document.body.appendChild(el); }
    el.innerHTML = `<i>♪</i> ${esc(e.detail.name)}`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    const n = $('#npName'); if (n) n.textContent = e.detail.name;
  });

  return { $, $$, esc, showScreen, setBg, toast, fxToasts, levelBurst, confetti, modal, confirmBox, card, cardFromState, radar, bar, charLook, title, create, story, hub, refreshHub, renderTop, trainingModal, postGame, chapterEnd, ending, settingsModal, loadMenu, settings, fmtChange, seasonScreen, simResult, standingsHTML, bracketHTML, scheduleHTML };
})();
