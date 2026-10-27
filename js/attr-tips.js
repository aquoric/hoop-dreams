/* =====================================================================
   ATTR-TIPS.JS — what each attribute (and the Overall) does in the game, as tooltips.
   Upgrade screen: hover a row (desktop) → the card docks in the side panel, so it never covers a + / − button;
   tap or long-press (phone) → it opens under the row. Elsewhere (the Overall in the hub header and on the
   player card, the card's six stat groups): a small floating tooltip.
   The numbers come from the config, so they stay right when values change: BALANCE.actions (which decisions use
   a stat, the success % preview), BALANCE.arcade (speeds, jumps, dribble moves, stamina), BALANCE.mods,
   POSITIONS (Overall weights), WEAPONS and the story's stat checks. Only the wording lives here.
   ===================================================================== */
const AttrTips = (() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = () => Game.state, A = () => BALANCE.actions, PACE = () => BALANCE.arcade.pace;
  const fx1 = v => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  const ARCADE_ONLY = ['move', 'scramble'];   // actions only arcade play rolls
  const MISC = ['save', 'touch'];             // close-call minigames, listed after the main decisions

  /* one line each + the minigame / arcade effects that live in code rather than in BALANCE.actions · pv: the action the "Next +1" preview shows (default: the one leaning on it most) */
  const TEXT = {
    three:  { d: 'Shooting from beyond the arc.', mg: 'bigger green zone on three-point shot meters', ar: 'a wider release window on arcade threes' },
    mid:    { d: 'Jumpers inside the arc: pull-ups, catch and shoot, fadeaways.', mg: 'bigger green zone on mid-range shot meters', ar: 'a wider release window on arcade jumpers' },
    ft:     { d: 'Free throws, including the ones that decide games.', mg: 'a wider zone in the free throw minigame', ar: 'free throws after you\'re fouled on a drive' },
    finish: { pv: 'layup', d: 'Layups and touch around the rim.', mg: 'a bigger window on the layup step and the jelly flick', ar: 'a wider release window on arcade layups' },
    dunk:   { d: 'Power finishes at the rim.', mg: 'bigger dunk windows', ar: 'a wider dunk window; big dunks from 70' },
    handle: { pv: 'layup', d: 'Dribbling, moves and keeping the ball.', mg: 'more time on the dribble combo and blow-by reads' },
    pass:   { d: 'Vision and accuracy on passes.', mg: 'a bigger passing-lane window and better looks for teammates', ar: 'no direct effect: arcade passes always arrive' },
    speed:  { d: 'Quickness with and without the ball.', mg: 'more time to read the defender on drives' },
    vert:   { d: 'How high you get off the floor.', mg: 'dunk options' },
    str:    { d: 'Physicality: posting up, boxing out, finishing through contact.', ar: 'winning position in the post, box-outs and loose balls' },
    stam:   { d: 'How long you last before fatigue hurts your %.' },
    perD:   { d: 'Guarding the ball: staying in front, contesting, stealing.', mg: 'a longer window in shell-defense reads', ar: 'contests on jump shots, steals, and not getting your ankles broken' },
    intD:   { d: 'Protecting the rim: blocks and contests inside.', ar: 'contests and blocks at the rim (with Vertical)' },
    reb:    { d: 'Grabbing misses on both ends.', ar: 'winning rebound battles off the rim' },
    iq:     { pv: 'pass', d: 'Reading the game: passes, charges, smart decisions.', mg: 'a bigger passing-lane window', ar: 'no direct effect' },
    clutch: { d: 'Playing your best when it\'s close and late.', ar: 'Your clutch bonus applies on the final possession' },
  };

  /* ---------- facts pulled from the config ---------- */
  const actionsFor = (k, side = 'off') => Object.entries(A()).filter(([id, a]) => a[side] && a[side][k] >= .15).sort((x, y) => y[1][side][k] - x[1][side][k]).map(([id, a]) => ({ id, a, w: a[side][k] }));
  const list = (arr, n = 4) => arr.length > n ? arr.slice(0, n).join(', ') + ` +${arr.length - n} more` : arr.join(', ');
  const posW = s => POSITIONS[s.player.pos].w;
  const impact = (s, k) => {
    const w = posW(s), tw = Object.values(w).reduce((t, x) => t + x, 0), max = Math.max(...Object.values(w)), share = (w[k] || 0) / tw;
    return { lvl: w[k] >= max * .75 ? 'High' : w[k] >= max * .4 ? 'Medium' : 'Low', share, perPt: (w[k] || 0) / tw };
  };
  let checkCount = null;   // story choices that check each stat (counted once)
  const storyChecks = k => {
    if (!checkCount) { checkCount = {}; for (const ch of Object.values(STORY.chapters)) for (const n of Object.values(ch.nodes || {})) for (const c of n.choices || []) if (c.check) [].concat(c.check.a).forEach(a => checkCount[a] = (checkCount[a] || 0) + 1); }
    return checkCount[k] || 0;
  };
  const myStats = (s, k, v) => { const st = Balance.userStats(s); if (v != null) st[k] = v; return st; };
  const typicalDef = s => Balance.profile(Math.max(40, Engine.ovr(s) - 2));   // a defender at your level
  function pctAt(s, id, k, v) {   // the action's % against a typical defender, one decimal (from the 10-point slope)
    const ctx = { def: typicalDef(s), diff: s.difficulty, contest: 'normal' }, at = x => Balance.pct(id, myStats(s, k, x), ctx).pct;
    const hi = v + 10 <= 99, slope = hi ? (at(v + 10) - at(v)) / 10 : (at(v) - at(v - 10)) / 10;
    return { now: at(v), next: at(v) + slope };
  }
  /* dribble moves: Handling each one needs (your archetype can lower it) */
  const moveNeeds = s => { const MV = BALANCE.arcade.moves, adj = MV.arch[s.player.arch] || {}; return Object.entries(MV.list).map(([id, m]) => ({ id, name: m.name, need: Math.max(0, m.handle + (adj[id] || 0) + (adj.all || 0)) })).sort((a, b) => a.need - b.need); };
  const titleCase = t => t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  function arcadeLine(s, k, v) {
    const P = PACE(), T = TEXT[k];
    if (k === 'speed') return `Top speed ${fx1(P.run(v))} → ${fx1(P.run(v + 1))} px/s, plus the burst after a dribble move`;
    if (k === 'vert') { const h = x => P.jump(x) ** 2 / (2 * P.gravity); return `Jump height +${fx1((h(v + 1) / h(v) - 1) * 100)}% per point: blocks, contests, rebounds, dunks`; }
    if (k === 'stam') { const r = x => P.stamina.regen * (1 + (x - 50) / 100); return `Stamina comes back faster: ${fx1(r(v))} → ${fx1(r(v + 1))} per second`; }
    if (k === 'handle') { const M = moveNeeds(s), have = M.filter(m => v >= m.need), nx = M.find(m => v < m.need), L = BALANCE.arcade.moves.lose;
      return `Moves: ${have.map(m => titleCase(m.name)).join(', ') || 'none yet'}${nx ? ` · next: ${titleCase(nx.name)} at ${nx.need}` : ''}${v < 60 ? ` · −${L.lowHandle}% lost-ball chance per point up to 60` : ''}`; }
    return T.ar ? T.ar[0].toUpperCase() + T.ar.slice(1) : '';
  }
  function choicesLine(k) {
    const own = actionsFor(k).filter(x => !ARCADE_ONLY.includes(x.id)), main = own.filter(x => !MISC.includes(x.id)), misc = own.filter(x => MISC.includes(x.id));
    const names = main.map(x => x.a.name).concat(misc.map(x => x.a.name.toLowerCase() + ' (close call)')), mg = TEXT[k].mg;
    if (k === 'stam') return `You tire slower each possession; full fatigue costs ${Math.abs(BALANCE.mods.fatigue)}% on every roll`;
    if (k === 'clutch') return `+${BALANCE.mods.clutch}% per 10 points above 50 in clutch time${names.length ? ' · ' + list(names, 2) : ''}`;
    if (k === 'dunk' || k === 'vert') { const d = A().dunk.req; return `${list(names)} · dunks need Dunking ${d.dunk} and Vertical ${d.vert}`; }
    return [list(names), mg].filter(Boolean).join(' · ');
  }
  function defenseLine(k) {
    const opp = actionsFor(k, 'def').filter(x => !ARCADE_ONLY.includes(x.id)).map(x => x.a.name);
    return opp.length ? `Lowers the other team's odds: ${list(opp, 3)}` : '';
  }
  function weaponsLine(s, k) {
    const mine = Engine.weapons(s).filter(x => x.w.stats && x.w.stats[k]);
    return mine.length ? mine.map(x => `${x.w.name} (${Math.round(x.w.stats[k] / Object.values(x.w.stats).reduce((t, y) => t + y, 0) * 100)}%)`).join(', ') : '';
  }
  /* the next point: what it changes */
  function nextLine(s, k, v) {
    const cap = Engine.capsOf(s)[k], out = [];
    if (v >= cap) return `At your cap (${cap}). Height and position set it.`;
    const own = actionsFor(k).filter(x => !ARCADE_ONLY.includes(x.id) && !MISC.includes(x.id)), main = own.find(x => x.id === TEXT[k].pv) || own[0];
    if (main) { const p = pctAt(s, main.id, k, v); out.push(`${main.a.name} ${p.now}% → ${fx1(p.next)}%`); }
    if (k === 'stam') { const f = x => (100 - x) / 14 + 1.5; out.push(`Fatigue per possession ${fx1(f(v))} → ${fx1(f(v + 1))}`); }   // same as tire() in js/match.js
    if (k === 'clutch') { const c = x => { const b = BALANCE.mods.clutch * (x - 50) / 10; return (b < 0 ? '−' : '+') + fx1(Math.abs(b)) + '%'; }; out.push(`Clutch bonus ${c(v)} → ${c(v + 1)}`); }
    if (k === 'handle') { const nx = moveNeeds(s).find(m => v < m.need); if (nx && nx.need === v + 1) out.push(`Unlocks ${titleCase(nx.name)}`); }
    const im = impact(s, k); out.push(`Overall +${(im.perPt).toFixed(2)}`);
    const knee = BALANCE.dr.knee;
    return `<b>Next +1</b> (${PROGRESSION.upgradeCost(v)} SP): ${out.join(' · ')}${v >= knee ? `<small>Above ${knee}, each point counts ${Math.round(BALANCE.dr.slope * 100)}% in every %.</small>` : ''}`;
  }

  /* ---------- the cards ---------- */
  function attrCard(k, v) {
    const s = S(), a = ATTR_BY_KEY[k]; if (!s || !a) return '';
    v = v != null ? v : s.player.attrs[k];
    const im = impact(s, k), n = storyChecks(k);
    const rows = [['Choices', choicesLine(k)], ['Defense', defenseLine(k)], ['Arcade', arcadeLine(s, k, v)], ['Weapons', weaponsLine(s, k)],
      ['Overall', `${im.lvl} impact for a ${s.player.pos} · ${Math.round(im.share * 100)}% of your Overall`], ['Story', n ? `${n} story choice${n === 1 ? '' : 's'} check${n === 1 ? 's' : ''} it` : '']].filter(r => r[1]);
    return `<div class="atip"><div class="atip-h"><b>${esc(a.n)}</b><i>${v}</i></div><p class="atip-d">${esc(TEXT[k].d)}</p>
      <dl>${rows.map(([t, x]) => `<dt>${t}</dt><dd>${x.includes('<') ? x : esc(x)}</dd>`).join('')}</dl><div class="atip-next">${nextLine(s, k, v)}</div></div>`;
  }
  function ovrCard() {
    const s = S(); if (!s) return '';
    const w = posW(s), tw = Object.values(w).reduce((t, x) => t + x, 0), pos = POSITIONS[s.player.pos];
    const top = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, x]) => `${ATTR_BY_KEY[k].n} ${Math.round(x / tw * 100)}%`);
    let sum = 0; for (const k in w) sum += s.player.attrs[k] * w[k];
    const bonus = Engine.ovrRaw(s) - sum / tw;
    const R = BALANCE.rankings;
    return `<div class="atip"><div class="atip-h"><b>Overall</b><i>${Engine.ovrLabel(s)}</i></div>
      <p class="atip-d">A weighted average of your 16 attributes for a ${esc(pos.name)}, plus up to +4 from badges${bonus >= .05 ? ` (you have +${fx1(bonus)})` : ''}.</p>
      <dl><dt>Counts most</dt><dd>${esc(top.join(' · '))}</dd>
      <dt>Rankings</dt><dd>Every Overall point moves you about ${R.perOvr} ranking points</dd>
      <dt>Offers</dt><dd>College, overseas and pro interest, plus the national team invite</dd>
      <dt>Story</dt><dd>Some choices and roads need a minimum Overall</dd></dl></div>`;
  }
  function groupCard(i) {
    const s = S(), g = RADAR[i]; if (!s || !g) return '';
    const v = Engine.radar(s)[i].v;
    return `<div class="atip"><div class="atip-h"><b>${esc(g.n)}</b><i>${Math.round(v)}</i></div>
      <p class="atip-d">${g.keys.map(k => `${ATTR_BY_KEY[k].n} ${s.player.attrs[k]}${g.w ? ` (${Math.round(g.w[k] * 100)}%)` : ''}`).join(' · ')}</p></div>`;
  }

  /* ---------- showing them ---------- */
  const touch = () => matchMedia('(hover: none)').matches;
  const rowKey = row => { const b = row.querySelector('[data-up]'); return b && b.dataset.up; };
  const rowVal = row => { const b = row.querySelector('b'); return b ? +b.textContent : null; };
  let docked = null, undockT = 0, floatEl = null;
  function dock(html, key) {
    const side = document.querySelector('.up-side'); if (!side) return;
    clearTimeout(undockT); let d = side.querySelector('.atip-dock');
    if (!d) { d = document.createElement('div'); d.className = 'atip-dock'; const o = side.querySelector('.up-ovr'); o ? o.after(d) : side.prepend(d); }
    if (docked !== key || d.innerHTML !== html) d.innerHTML = html;
    side.classList.add('tipping'); docked = key;
  }
  function undock(now) {
    clearTimeout(undockT);
    const go = () => { const side = document.querySelector('.up-side'); if (side) { side.classList.remove('tipping'); const d = side.querySelector('.atip-dock'); if (d) d.remove(); } docked = null; };
    if (now) go(); else undockT = setTimeout(go, 220);
  }
  function inline(row, html, key, keep) {   // keep: re-open it (after a re-render) instead of toggling it closed
    const open = document.querySelector('.atip-inline'), same = open && open.dataset.k === key;
    if (open) open.remove(); if (same && !keep) return;
    const d = document.createElement('div'); d.className = 'atip-inline'; d.dataset.k = key; d.innerHTML = html; row.after(d);
  }
  function float(el, html) {
    hideFloat(); floatEl = document.createElement('div'); floatEl.className = 'atip-float'; floatEl.innerHTML = html; document.body.appendChild(floatEl);
    const r = el.getBoundingClientRect(), w = floatEl.offsetWidth, h = floatEl.offsetHeight, pad = 8;
    const left = Math.max(pad, Math.min(innerWidth - w - pad, r.left + r.width / 2 - w / 2)), below = r.bottom + 8 + h < innerHeight - pad;
    floatEl.style.left = left + 'px'; floatEl.style.top = (below ? r.bottom + 8 : Math.max(pad, r.top - 8 - h)) + 'px';
  }
  function hideFloat() { if (floatEl) { floatEl.remove(); floatEl = null; } }
  /* what (if anything) under this element has a tooltip */
  function target(el) {
    const row = el.closest('.up-row'); if (row && rowKey(row)) return { kind: 'row', el: row, key: rowKey(row), html: () => attrCard(rowKey(row), rowVal(row)) };
    const uo = el.closest('.up-ovr'); if (uo) return { kind: 'upovr', el: uo, key: 'ovr', html: ovrCard };
    const ov = el.closest('.ht-ovr, .pc-ovr'); if (ov && S()) return { kind: 'float', el: ov, key: 'ovr', html: ovrCard };
    const st = el.closest('.pc-stats > div'); if (st && S()) { const i = [...st.parentElement.children].indexOf(st); return { kind: 'float', el: st, key: 'g' + i, html: () => groupCard(i) }; }
    return null;
  }

  /* desktop: hover */
  document.addEventListener('mouseover', e => {
    if (touch()) return;
    const t = target(e.target);
    if (t && (t.kind === 'row' || t.kind === 'upovr')) { hideFloat(); dock(t.html(), t.key); return; }
    if (t && t.kind === 'float') { if (!floatEl || floatEl.dataset.k !== t.key) { float(t.el, t.html()); floatEl.dataset.k = t.key; } return; }
    hideFloat();
    if (docked && !e.target.closest('.atip-dock, .up-side .row')) undock();
  });
  /* + / − re-render the list: keep the card up for the row you just changed (the next point you'd spend) */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-up], [data-dn]');
    if (b) { const k = b.dataset.up || b.dataset.dn, row = document.querySelector(`[data-up="${k}"]`)?.closest('.up-row'); if (!row) return;
      if (touch()) inline(row, attrCard(k, rowVal(row)), k, true); else dock(attrCard(k, rowVal(row)), k);
      return; }
    if (!touch()) return;
    /* phone: tap (or long-press) a row or an Overall to open its card; tap anything else to close */
    if (e.target.closest('button, a, input, select')) { hideFloat(); return; }
    const t = target(e.target);
    if (!t) { hideFloat(); document.querySelector('.atip-inline')?.remove(); return; }
    if (t.kind === 'row' || t.kind === 'upovr') { hideFloat(); inline(t.el, t.html(), t.key); }
    else if (floatEl && floatEl.dataset.k === t.key) hideFloat(); else { float(t.el, t.html()); floatEl.dataset.k = t.key; }
  });
  addEventListener('scroll', hideFloat, true); addEventListener('resize', () => { hideFloat(); undock(true); });

  return { attrCard, ovrCard, groupCard };
})();
