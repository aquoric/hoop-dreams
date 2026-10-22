/* =====================================================================
   DATA-VENUES.JS — every court in the game (16-bit style, drawn by js/pixel.js).
   Add a venue by adding an entry to VENUES. Fields:
     name, group ('Streetball' | 'School & College' | 'Pro' | 'Overseas' | 'Training'), desc
     style:    'street' | 'gym' | 'arena' | 'practice'                  (overall look)
     sky:      'night' | 'day' | 'dusk' | 'sunset'                      (street only)
     backdrop: 'city' | 'park' | 'cage' | 'rooftop' | 'beach'           (street only)
     fence:    'chain' | 'low' | 'cage' | 'rail' | null
     floor:    'asphalt' | 'wet' | 'park' | 'cage' | 'rooftop' | 'beach' | 'wood' | 'wood_dark' | 'wood_pro'
     walls:    'brick' | 'wood' | 'block' | 'paint'                     (gyms)
     team:     team id whose colors / logo the venue uses (LOCAL_TEAMS, COLLEGES, NBL_TEAMS or OVERSEAS_CLUBS)
     theme:    'college' | 'tournament' | 'pro' | 'combine' | 'summer' | 'allstar' | 'finals' | 'overseas'
     crowd:    number of fans (street) or density 0..1 (gyms / arenas)
     lights:   'lamps' | 'strings' | 'ceiling' | 'spots' | 'lasers' | null
     weather:  'rain' (animated rain) · reflect: true (puddle reflections)
     backboard:'metal' | 'glass' · net: 'chain' | 'nylon'
     ambient:  sound loop: 'city' | 'park' | 'wind' | 'waves' | 'rain' | 'gym' | 'arena' | 'chant' | 'practice'
     unlocked: true = available from the start for pickup runs
   ===================================================================== */
const VENUES = {
  /* ---------------- Streetball ---------------- */
  street_night: { name: 'Halsey Street Courts', group: 'Streetball', desc: 'Cracked asphalt under the streetlights. Where it all started.', style: 'street', sky: 'night', backdrop: 'city', fence: 'chain', floor: 'asphalt', lights: 'lamps', crowd: 12, backboard: 'metal', net: 'chain', ambient: 'city', unlocked: true },
  park_day:     { name: 'Halsey Park (Day)', group: 'Streetball', desc: 'Fresh paint, green court, blue sky. Old heads on the benches.', style: 'street', sky: 'day', backdrop: 'park', fence: 'low', floor: 'park', lights: null, crowd: 10, backboard: 'metal', net: 'nylon', ambient: 'park', unlocked: true },
  cage:         { name: 'The Cage', group: 'Streetball', desc: 'Fenced in on all sides. No out of bounds, no mercy.', style: 'street', sky: 'dusk', backdrop: 'cage', fence: 'cage', floor: 'cage', lights: 'lamps', crowd: 18, backboard: 'metal', net: 'chain', ambient: 'city' },
  rooftop:      { name: 'Skyline Rooftop', group: 'Streetball', desc: 'Forty floors up. String lights and the whole city below you.', style: 'street', sky: 'night', backdrop: 'rooftop', fence: 'rail', floor: 'rooftop', lights: 'strings', crowd: 8, backboard: 'glass', net: 'nylon', ambient: 'wind' },
  beach:        { name: 'Boardwalk Beach Court', group: 'Streetball', desc: 'Sunset runs by the ocean. Sand in your shoes.', style: 'street', sky: 'sunset', backdrop: 'beach', fence: null, floor: 'beach', lights: null, crowd: 14, backboard: 'metal', net: 'nylon', ambient: 'waves' },
  rain_night:   { name: 'Rainy Night Run', group: 'Streetball', desc: 'Puddles, neon reflections and the diehards who play anyway.', style: 'street', sky: 'night', backdrop: 'city', fence: 'chain', floor: 'wet', weather: 'rain', reflect: true, lights: 'lamps', crowd: 5, backboard: 'metal', net: 'chain', ambient: 'rain' },

  /* ---------------- School & College ---------------- */
  rec_center:   { name: 'Halsey Community Center', group: 'School & College', desc: 'Cinderblock walls, a busted scoreboard, packed bleachers.', style: 'gym', walls: 'block', floor: 'wood', team: 'halsey', crowd: .55, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'gym' },
  aau_showcase: { name: 'Elite Showcase Expo Hall', group: 'School & College', desc: 'Convention-center courts full of scouts with clipboards.', style: 'gym', walls: 'paint', floor: 'wood', team: 'halsey_hoops', crowd: .4, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'gym', theme: 'showcase' },
  college_arena:{ name: 'Collegiate Fieldhouse', group: 'School & College', desc: 'Student section painted head to toe. Band on the baseline.', style: 'arena', floor: 'wood', theme: 'college', crowd: .85, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'arena' },
  tournament:   { name: 'March Mayhem Dome', group: 'School & College', desc: 'The big dance. Bracket banners, 70,000 seats, one shining moment.', style: 'arena', floor: 'wood', theme: 'tournament', crowd: 1, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'arena' },

  /* ---------------- Pro (special) ---------------- */
  combine:      { name: 'Draft Combine Gym', group: 'Pro', desc: 'Scouts, stopwatches, and measuring tape. Every rep is graded.', style: 'practice', floor: 'wood', theme: 'combine', crowd: .15, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'practice' },
  summer_league:{ name: 'Summer League Pavilion', group: 'Pro', desc: 'Desert heat, half-full stands, rookies with something to prove.', style: 'arena', floor: 'wood', theme: 'summer', crowd: .45, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'arena' },
  allstar:      { name: 'All-Star Weekend Arena', group: 'Pro', desc: 'Lasers, celebrities courtside, nobody plays defense.', style: 'arena', floor: 'wood_pro', theme: 'allstar', crowd: 1, lights: 'lasers', backboard: 'glass', net: 'nylon', ambient: 'arena' },
  finals:       { name: 'NBL Finals', group: 'Pro', desc: 'The biggest stage. Gold trim, extra lights, confetti cannons.', style: 'arena', floor: 'wood_pro', theme: 'finals', crowd: 1, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'arena' },

  /* ---------------- Training ---------------- */
  practice:     { name: 'Practice Facility', group: 'Training', desc: 'Ball racks, cones, and a banner that says OUTWORK EVERYBODY.', style: 'practice', floor: 'wood', crowd: 0, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'practice' },
};

/* High school gyms (one per Metro Prep League school, in its colors) */
(() => {
  const walls = { lincoln: 'brick', westbrook: 'wood', northgate: 'block', eastview: 'paint', central: 'block', stvincent: 'wood', riverside: 'brick', oakmont: 'wood' };
  for (const id in walls) {
    const t = LOCAL_TEAMS[id]; if (!t) continue;
    VENUES['gym_' + id] = { name: `${t.name.replace(/ [A-Z][a-z]+$/, '')} Gym`, group: 'School & College', desc: `Home of the ${t.name}.`, style: 'gym', walls: walls[id], floor: id === 'westbrook' || id === 'stvincent' ? 'wood_dark' : 'wood', team: id, crowd: id === 'westbrook' ? .8 : .65, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'gym' };
  }
})();
/* A home arena for every NBL team (team colors + logo at center court) */
(() => { for (const id in NBL_TEAMS) { const t = NBL_TEAMS[id]; VENUES['nbl_' + id] = { name: `${t.name} Arena`, group: 'Pro', desc: `${t.city}. Home of the ${t.name}.`, style: 'arena', floor: 'wood_pro', team: id, theme: 'pro', crowd: .95, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'arena' }; } })();
/* An arena for each overseas club, themed to its city */
(() => { for (const id in OVERSEAS_CLUBS) { const t = OVERSEAS_CLUBS[id]; VENUES['ovs_' + id] = { name: `${t.name} Arena`, group: 'Overseas', desc: `${t.city} · ${t.league}. The crowd never sits down.`, style: 'arena', floor: 'wood_dark', team: id, theme: 'overseas', crowd: 1, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'chant', chant: t.chant, landmark: t.landmark }; } })();

const Venues = {
  get(id) { return Object.assign({ id: VENUES[id] ? id : 'street_night' }, VENUES[id] || VENUES.street_night); },
  /* colors / logo source for a team id from any league */
  team(id) { return (typeof LOCAL_TEAMS !== 'undefined' && LOCAL_TEAMS[id]) || (typeof COLLEGES !== 'undefined' && COLLEGES[id]) || (typeof NBL_TEAMS !== 'undefined' && NBL_TEAMS[id]) || (typeof OVERSEAS_CLUBS !== 'undefined' && OVERSEAS_CLUBS[id]) || null; },
  /* the home court of a team */
  home(teamId) {
    const base = String(teamId || '').replace(/_(hopefuls|varsity|white|blue)$/, '');
    if (VENUES['gym_' + base]) return 'gym_' + base;
    if (VENUES['nbl_' + base]) return 'nbl_' + base;
    if (VENUES['ovs_' + base]) return 'ovs_' + base;
    if (typeof COLLEGES !== 'undefined' && COLLEGES[base]) return 'college_arena';
    if (/hoops|select|heat|supreme|takeover|fire/.test(base)) return 'aau_showcase';
    return null;
  },
  /* pick the venue for a game: story node > explicit cfg > home/away > level */
  forMatch(cfg = {}, node = null) {
    if (node && node.venue && VENUES[node.venue]) return node.venue;
    if (cfg.venueId && VENUES[cfg.venueId]) return cfg.venueId;
    const us = cfg.us && cfg.us.id, them = cfg.them && cfg.them.id, homeGame = cfg.venue !== 'away';
    const v = homeGame ? (this.home(us) || this.home(them)) : (this.home(them) || this.home(us));
    if (v) return v;
    return { street: 'street_night', hs: 'rec_center', college: 'college_arena', pro: 'nbl_man' }[cfg.level] || 'street_night';
  },
  /* unlocks (state.venues = { id: true }) */
  unlocked(s) { const u = Object.assign({}, s && s.venues); for (const id in VENUES) if (VENUES[id].unlocked) u[id] = true; return Object.keys(VENUES).filter(id => u[id]); },
  unlock(s, id) { if (!s || !VENUES[id]) return false; s.venues = s.venues || {}; if (s.venues[id] || VENUES[id].unlocked) return false; s.venues[id] = true; return true; },
  groups() { const g = {}; for (const id in VENUES) (g[VENUES[id].group] = g[VENUES[id].group] || []).push(id); return g; },
};
