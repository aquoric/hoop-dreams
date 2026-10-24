/* =====================================================================
   TUTORIAL.JS — the first game against Kai (Chapter 1, node m1) teaches the game one thing at a time.
   The steps themselves run inside the match (js/match.js, cfg.tutorial); this file draws the tips and
   lets you replay the tutorial from Settings.

   Tutorial.tip(o, meta) → Promise<'ok' | 'skip'>
     o: { title, text, target: CSS selector to highlight, keys: [desktop keys], phone: [touch buttons], art: html }
     The game is paused while a tip is open: the screen dims, the target glows with a pointer,
     and the keys / buttons to press are shown. "Got it" (Enter / Space) continues, "Skip tutorial" ends it.
   Tutorial.replay()  the same game as a practice run (no effect on your career), then back to where you were.
   ===================================================================== */
const Tutorial = (() => {
  const esc = s => UI.esc(s);
  const touch = () => matchMedia('(pointer: coarse)').matches || innerWidth < 760;

  function tip(o, meta = {}) {
    return new Promise(res => {
      document.querySelectorAll('.tut').forEach(e => e.remove());
      const el = document.createElement('div'); el.className = 'tut';
      const tgt = o.target ? [].concat(o.target).map(q => document.querySelector(q)).find(e => e && e.getBoundingClientRect().width > 0) : null;
      const r = tgt && tgt.getBoundingClientRect(), pad = 6;
      const keys = (touch() ? o.phone : o.keys) || [];
      const low = r && r.top + r.height / 2 > innerHeight * .5;
      const look = typeof UI.charLook === 'function' ? UI.charLook(o.who || 'lou') : null, ch = STORY.characters[o.who || 'lou'] || { short: 'Lou' };
      el.innerHTML = `${r ? `<div class="tut-hole" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
          <div class="tut-ptr ${low ? 'up' : ''}" style="left:${Math.round(r.left + r.width / 2)}px;top:${Math.round(low ? r.top - pad - 34 : r.bottom + pad + 4)}px">${low ? '▼' : '▲'}</div>` : '<div class="tut-dim"></div>'}
        <div class="tut-card ${low ? 'top' : 'bottom'}">
          <div class="tut-head"><div class="tut-av">${look ? Art.avatar(look, { mode: 'portrait' }) : ''}</div><div><small>TUTORIAL${meta.n ? ` · ${meta.i} / ${meta.n}` : ''} · ${esc(ch.short || 'Lou')}</small><h3>${esc(o.title)}</h3></div></div>
          <p>${esc(o.text)}</p>${o.art || ''}
          ${keys.length ? `<div class="tut-keys"><span>${touch() ? 'TAP' : 'PRESS'}</span>${keys.map(k => `<kbd>${esc(k)}</kbd>`).join('')}</div>` : ''}
          <div class="tut-btns">${meta.noSkip ? '' : '<button class="btn ghost sm" data-k="skip">Skip tutorial</button>'}<button class="btn glow" data-k="ok">Got it ›</button></div>
        </div>`;
      document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
      if (typeof SFX !== 'undefined') SFX.play('page');
      const T0 = performance.now();
      const close = k => { removeEventListener('keydown', kd, true); el.classList.remove('in'); setTimeout(() => el.remove(), 200); if (typeof SFX !== 'undefined') SFX.play('click'); res(k); };
      const kd = e => { e.stopPropagation(); if (['Space', 'Enter', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); if (performance.now() - T0 > 350) close('ok'); } };   // the game underneath gets no keys while a tip is open
      addEventListener('keydown', kd, true);
      el.addEventListener('pointerdown', e => e.stopPropagation());
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => close(b.dataset.k));
    });
  }

  /* the same game, as practice: nothing it does touches your career */
  async function replay() {
    const s = Game.state; if (!s) return;
    Game.save();
    try {
      await Match.play({ us: Object.assign({}, Game.team('halsey')), them: Game.team('sterling_squad'), oppRating: 50, mateRating: 40, moments: 11, level: 'street', size: 3, target: 15, venueId: 'park_day',
        title: 'Tutorial (practice)', sub: 'Halsey Park · nothing counts', tutorial: true, practice: true, noIntro: true });
    } catch (e) { console.error('tutorial', e); }
    UI.toast('Tutorial finished. Back to your career.', 'good');
    const back = Engine.load('auto'); if (back) Game.loadState(back); else Game.resume();   // exactly where you left off
  }
  return { tip, replay };
})();
