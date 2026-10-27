/* =====================================================================
   PAUSE.JS — one pause for the whole game (loaded first, before every other script).

   How it freezes everything exactly where it is: the game's clock lives here.
     • performance.now(), requestAnimationFrame, setTimeout / setInterval are wrapped: while paused the clock stands
       still, frame callbacks wait, and timers keep their remaining time (matches, the arcade, the AI, minigame timers
       and meters, quick-time presses, cutscenes — they all run on these)
     • CSS animations / transitions are paused; the music and sounds are suspended (SFX.suspend) and resume in place
     • keys and touches during the pause never reach the game; a key or touch released while paused is replayed
       after the resume, so nothing stays "held"
   How to pause: the ⏸ button (top-left, during matches, arcade play, minigames and cutscenes), Esc or P, or
   automatically when the tab is hidden (switching tabs, minimizing, locking the phone).
   The menu: Resume · Settings (volume, music, sound effects, fullscreen) · Controls (for the current mode) · Quit
   (confirmed; a match counts as a loss, a pickup game as a forfeit — Game.quitActivity). The screen behind is dimmed
   and blurred, and resuming a minigame, arcade play or a quick-time press starts with a 3-2-1 countdown.
   ===================================================================== */
const Pause = (() => {
  /* ---------- the clock ---------- */
  const N = { setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window), raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window), now: performance.now.bind(performance) };
  let paused = false, pausedAt = 0, offset = 0, busy = false;
  const vnow = () => (paused ? pausedAt : N.now()) - offset;
  try { performance.now = vnow; } catch (e) { }
  // frames: callbacks wait while paused, then run with the game's (paused-out) timestamp
  const RF = new Map(), held = new Map(); let rid = 1;
  const rafWrap = (id, cb) => ts => { if (paused) { held.set(id, cb); return; } RF.delete(id); cb(ts - offset); };
  window.requestAnimationFrame = cb => { const id = rid++; RF.set(id, N.raf(rafWrap(id, cb))); return id; };
  window.cancelAnimationFrame = id => { if (RF.has(id)) N.caf(RF.get(id)); RF.delete(id); held.delete(id); };
  // timers: due times on the game clock; a timer that comes due while paused waits for the resume
  const T = new Map(); let tid = 1;
  function arm(id) { const t = T.get(id); if (t) t.n = N.setTimeout(() => fire(id), Math.max(0, t.due - vnow())); }
  function fire(id) {
    const t = T.get(id); if (!t) return; t.n = null;
    if (paused) { t.wait = true; return; }
    if (t.due - vnow() > 1) return arm(id);
    if (t.every) { t.due = vnow() + t.every; arm(id); } else T.delete(id);
    t.fn(...t.args);
  }
  const fnOf = fn => typeof fn === 'function' ? fn : () => (0, eval)(String(fn));
  window.setTimeout = (fn, ms, ...args) => { const id = tid++; T.set(id, { fn: fnOf(fn), args, due: vnow() + (+ms || 0) }); arm(id); return id; };
  window.setInterval = (fn, ms, ...args) => { const id = tid++, every = Math.max(4, +ms || 0); T.set(id, { fn: fnOf(fn), args, every, due: vnow() + every }); arm(id); return id; };
  window.clearTimeout = window.clearInterval = id => { const t = T.get(id); if (!t) return; if (t.n != null) N.clearTimeout(t.n); T.delete(id); };

  /* ---------- when can you pause ---------- */
  const $ = q => document.querySelector(q);
  function mode() {
    if ($('.cs-qte.on:not(.ok):not(.fail)')) return 'qte';
    if (document.body.classList.contains('arc-open') || $('.arc')) return 'arcade';
    if ($('.mg')) return 'minigame';
    if ($('.cs-mono')) return 'mono';
    if ($('.cs, .arc-card')) return 'cutscene';
    if (document.body.dataset.screen === 'match') return 'match';
    return null;
  }
  const blocked = () => !!$('.feat-pop') || [...document.querySelectorAll('#modals .modal')].some(m => !m.querySelector('.mg'));   // a popup / dialog of its own is up
  const pausable = () => !paused && !busy && !!mode() && !blocked();

  /* ---------- input while paused ---------- */
  const keysDown = new Set(), keysUp = new Set(), ptrs = new Map(), ptrsUp = new Set();
  const inMenu = e => !!(e.target && e.target.closest && e.target.closest('#pz'));
  addEventListener('keydown', e => {
    if (e.__hd) return;
    if (paused) { if (!busy && (e.code === 'Escape' || e.code === 'KeyP')) { e.preventDefault(); back(); } else if (!busy && /^Arrow(Up|Down)$/.test(e.code)) { e.preventDefault(); moveFocus(e.code === 'ArrowDown' ? 1 : -1); } else if (!inMenu(e) || busy) e.preventDefault(); e.stopImmediatePropagation(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat && pausable() && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) { e.preventDefault(); e.stopImmediatePropagation(); pause(); return; }
    keysDown.add(e.code);
  }, true);
  addEventListener('keyup', e => { if (e.__hd) return; if (paused) { if (keysDown.has(e.code)) keysUp.add(e.code); e.stopImmediatePropagation(); return; } keysDown.delete(e.code); }, true);
  addEventListener('pointerdown', e => { if (e.__hd) return; if (!paused) ptrs.set(e.pointerId, e.target); }, true);
  const ptrEnd = e => { if (e.__hd) return; if (paused && !inMenu(e)) { if (ptrs.has(e.pointerId)) ptrsUp.add(e.pointerId); e.stopImmediatePropagation(); return; } ptrs.delete(e.pointerId); };
  addEventListener('pointerup', ptrEnd, true); addEventListener('pointercancel', ptrEnd, true);
  function replayInput() {   // released while paused → released now
    keysUp.forEach(code => { const ev = new KeyboardEvent('keyup', { code, key: code === 'Space' ? ' ' : code.replace(/^Key/, '').toLowerCase(), bubbles: true }); ev.__hd = true; dispatchEvent(ev); keysDown.delete(code); }); keysUp.clear();
    ptrsUp.forEach(id => { const tg = ptrs.get(id); ptrs.delete(id); if (!tg || !tg.isConnected) return; for (const type of ['pointerup', 'pointercancel']) { let ev; try { ev = new PointerEvent(type, { pointerId: id, bubbles: true }); } catch (err) { ev = new Event(type, { bubbles: true }); } ev.__hd = true; tg.dispatchEvent(ev); } }); ptrsUp.clear();
  }
  // auto-pause: switching tabs, minimizing the window, locking the phone
  let autoOn = true;   // (tests in a hidden browser pane turn it off)
  document.addEventListener('visibilitychange', () => { if (autoOn && document.hidden && pausable()) pause(true); });
  addEventListener('pagehide', () => { if (autoOn && pausable()) pause(true); });

  /* ---------- pause / resume ---------- */
  let anims = [], el = null, curMode = null;
  function pause(auto) {
    if (paused || busy) return; curMode = mode(); if (!curMode) return;
    paused = true; pausedAt = N.now();
    anims = document.getAnimations ? document.getAnimations().filter(a => a.playState === 'running' && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#pz'))) : [];
    anims.forEach(a => { try { a.pause(); } catch (e) { } });
    if (typeof SFX !== 'undefined' && SFX.suspend) SFX.suspend();
    document.body.classList.add('paused');
    menu(auto === true);
  }
  function unfreeze() {
    if (!paused) return; offset += N.now() - pausedAt; paused = false;
    held.forEach((cb, id) => RF.set(id, N.raf(rafWrap(id, cb)))); held.clear();
    T.forEach((t, id) => { if (t.wait) { t.wait = false; arm(id); } });
    anims.forEach(a => { try { if (a.playState === 'paused') a.play(); } catch (e) { } }); anims = [];
    if (typeof SFX !== 'undefined' && SFX.resume) SFX.resume();
    document.body.classList.remove('paused');
    replayInput();
  }
  /* resume: minigames, arcade play and quick-time presses get a 3-2-1 first (the screen stays dimmed until GO) */
  function resume() {
    if (!paused || busy) return; const m = mode(), count = m === 'qte' || m === 'arcade' || m === 'minigame';
    if (!count) { closeMenu(); unfreeze(); return; }
    busy = true; el.classList.add('count'); const c = el.querySelector('.pz-count'); let n = 3;
    const step = () => { if (n === 0) { busy = false; closeMenu(); unfreeze(); return; } c.textContent = n; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); n--; N.setTimeout(step, 600); };
    step();
  }

  /* ---------- the menu ---------- */
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const txt = q => { const e = $(q); return e ? (e.innerText || e.textContent).replace(/\s*\n\s*/g, ' · ').replace(/\s+/g, ' ').trim() : ''; };
  function situation() {
    const m = curMode;
    if ((m === 'arcade') && $('#ahS0')) return { head: txt('#ahMode') || 'Arcade', score: `${txt('.ah-team b')} ${txt('#ahS0')} – ${txt('#ahS1')} ${txt('.ah-team.r b')}`, time: txt('#ahClock'), line: '' };
    if (document.body.dataset.screen === 'match' && $('#sbUs')) {
      const abbr = [...document.querySelectorAll('.sb-abbr')].map(e => e.textContent);
      return { head: m === 'minigame' ? `Minigame · ${txt('.mg h3, .mg .mg-title, .mg b') || 'in play'}` : m === 'cutscene' || m === 'mono' ? 'Highlight' : m === 'arcade' ? 'Arcade' : 'Match',
        score: `${abbr[0] || 'US'} ${txt('#sbUs')} – ${txt('#sbThem')} ${abbr[1] || 'THEM'}`, time: `${txt('#sbPer')} ${txt('#sbClock')}`, line: txt('#pbp li') };
    }
    if (m === 'minigame') return { head: 'Minigame', score: txt('.mg h3, .mg .mg-title') || '', time: '', line: '' };
    if (m === 'qte') return { head: 'Quick-time press', score: txt('.cs-qte b'), time: '', line: txt('.cs-dialog.on p') };
    return { head: 'Cutscene', score: txt('.cs-title.on') || txt('.arc-card h1') || '', time: '', line: txt('.cs-dialog.on p') };
  }
  const CONTROLS = {
    match: [['Pick a play', 'Click it, or press 1–4'], ['Minigames', 'SPACE / tap at the right moment'], ['Arcade segments', 'Move WASD · shoot J / SPACE · pass K · move L · touch: stick + buttons'], ['Pause', 'ESC or P · the ⏸ button']],
    arcade: [['Move', 'WASD / arrow keys · touch: left stick'], ['Shoot / block', 'J or SPACE, hold & release · touch: SHOOT'], ['Pass / steal', 'K · touch: PASS'], ['Dribble move', 'L or SHIFT · touch: MOVE'], ['Weapon', 'E · touch: ⚔'], ['Playmaker', 'click / tap a teammate or 1–3, then B / L / S / N · SPACE: let him shoot'], ['Pause', 'ESC or P · the ⏸ button']],
    minigame: [['Timing', 'SPACE / tap when the meter hits the zone'], ['Reads & moves', 'Arrow keys / swipe when the prompt asks'], ['Pause', 'ESC or P · the ⏸ button']],
    qte: [['GET UP', 'Tap fast / mash SPACE'], ['PUSH', 'Tap / SPACE when the marker is in the zone'], ['BREATHE', 'Hold SPACE / hold your finger down'], ['Pause', 'ESC or P · the ⏸ button']],
    cutscene: [['Dialogue', 'Tap / SPACE to speed up a line'], ['Choices', 'Click them or press 1–4'], ['Skip', 'Tap / any key (scenes you\'ve seen) · SKIP in conversations'], ['Pause', 'ESC or P · the ⏸ button']],
  };
  function quitInfo() {
    const A = typeof Game !== 'undefined' && Game.activity, k = A && A.kind;
    if (k === 'season') return { label: 'Quit to hub', warn: 'Quitting counts as a loss in your season.' };
    if (k === 'pickup') return { label: 'Quit to hub', warn: 'Quitting counts as a forfeit (a loss) and uses the action.' };
    if (k === 'train') return { label: 'Quit to hub', warn: 'You lose this session: the action is used and nothing is gained.' };
    if (k === 'story') return { label: 'Forfeit & quit', warn: 'Quitting counts as a loss. The story goes on from the loss.' };
    return { label: 'Quit to title', warn: 'Your career is saved. This scene starts again when you continue.' };
  }
  function menu(auto) {
    const S = situation(), Q = quitInfo(), V = typeof SFX !== 'undefined' ? SFX.vol : { master: 1, music: 1, sfx: 1 }, m = curMode === 'mono' ? 'match' : curMode;
    const ctl = CONTROLS[m] || CONTROLS.match, full = typeof UI !== 'undefined' && UI.isFull ? UI.isFull() : !!document.fullscreenElement;
    el = document.createElement('div'); el.id = 'pz'; el.className = 'pz';
    el.innerHTML = `<div class="pz-sit"><small>${esc(S.head)}</small>${S.score ? `<b>${esc(S.score)}</b>` : ''}${S.time ? `<em>${esc(S.time)}</em>` : ''}${S.line ? `<p>${esc(S.line.slice(0, 110))}</p>` : ''}</div>
      <div class="pz-box" role="dialog" aria-label="Paused">
        <h2>PAUSED${auto ? '<small>Paused while you were away</small>' : ''}</h2>
        <div class="pz-p on" data-p="main"><button data-a="resume">▶ Resume</button><button data-a="settings">⚙ Settings</button><button data-a="controls">🎮 Controls</button><button class="danger" data-a="quit">✕ ${esc(Q.label)}</button></div>
        <div class="pz-p" data-p="settings">
          <label>Volume<input type="range" min="0" max="1" step=".05" value="${V.master}" data-v="master"></label>
          <label>Music<input type="range" min="0" max="1" step=".05" value="${V.music}" data-v="music"></label>
          <label>Sound effects<input type="range" min="0" max="1" step=".05" value="${V.sfx}" data-v="sfx"></label>
          <button data-a="full">⛶ Fullscreen: <b>${full ? 'On' : 'Off'}</b></button><button data-a="back">‹ Back</button><span class="pz-ver">${esc(typeof UI !== 'undefined' ? UI.version() : '')}</span></div>
        <div class="pz-p" data-p="controls"><dl>${ctl.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><button data-a="back">‹ Back</button></div>
        <div class="pz-p" data-p="quit"><p>${esc(Q.warn)}</p><button class="danger" data-a="quitYes">✕ ${esc(Q.label)}</button><button data-a="back">‹ Cancel</button></div>
      </div><div class="pz-count"></div>`;
    document.body.appendChild(el); N.raf(() => el && el.classList.add('in'));
    el.querySelectorAll('[data-v]').forEach(r => r.oninput = () => { if (typeof SFX !== 'undefined') SFX.setVol(r.dataset.v, +r.value); });
    el.querySelectorAll('[data-a]').forEach(b => b.onclick = e => { e.stopPropagation(); act(b.dataset.a, b); });
    focusFirst();
  }
  function panel(p) { el.querySelectorAll('.pz-p').forEach(x => x.classList.toggle('on', x.dataset.p === p)); focusFirst(); }
  const panelOn = () => el && el.querySelector('.pz-p.on');
  function focusFirst() { const b = panelOn() && panelOn().querySelector('button, input'); if (b) try { b.focus({ preventScroll: true }); } catch (e) { } }
  function moveFocus(d) { const L = [...(panelOn() ? panelOn().querySelectorAll('button, input') : [])]; if (!L.length) return; const i = L.indexOf(document.activeElement); L[(i + d + L.length) % L.length].focus(); }
  function back() { const p = panelOn(); if (p && p.dataset.p !== 'main') panel('main'); else resume(); }
  function act(a, b) {
    if (busy) return;
    if (a === 'resume') return resume();
    if (a === 'settings' || a === 'controls' || a === 'quit') return panel(a);
    if (a === 'back') return panel('main');
    if (a === 'full') { const on = !(UI.isFull ? UI.isFull() : !!document.fullscreenElement); try { UI.setFullscreen(on); } catch (e) { } N.setTimeout(() => { const x = b.querySelector('b'); if (x) x.textContent = (UI.isFull ? UI.isFull() : !!document.fullscreenElement) ? 'On' : 'Off'; }, 300); return; }
    if (a === 'quitYes') { busy = true; b.textContent = 'Saving…'; try { Game.quitActivity(curMode); } catch (e) { console.error('quit', e); busy = false; } }
  }
  function closeMenu() { if (!el) return; const e2 = el; el = null; e2.classList.remove('in'); N.setTimeout(() => e2.remove(), 160); }

  /* ---------- the ⏸ button ---------- */
  const btn = document.createElement('button'); btn.id = 'pauseBtn'; btn.className = 'pz-btn'; btn.setAttribute('aria-label', 'Pause'); btn.textContent = '⏸';
  btn.addEventListener('click', e => { e.stopPropagation(); pause(); });
  btn.addEventListener('pointerdown', e => e.stopPropagation());
  const sync = () => { const show = !paused && !!mode() && !blocked(); btn.classList.toggle('on', show); if (show && !btn.isConnected) document.body.appendChild(btn); };
  const tick = () => { try { sync(); } catch (e) { } N.setTimeout(tick, 300); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', tick); else tick();

  /* test hook: a test page can drive frames / timers itself (hidden browser panes) — the pause still controls them */
  function useNative(o) { Object.assign(N, o); }
  return { pause, resume, get paused() { return paused; }, mode, pausable, now: vnow, useNative, set auto(v) { autoOn = !!v; } };
})();
