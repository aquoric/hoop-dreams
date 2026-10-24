/* =====================================================================
   DATA-CH3-WORLD.JS — the world of Chapter 3 "The Next Level": college programs, overseas clubs and the
   NBL Grind League (development league) as playable teams, their arenas, route pickup courts, the people,
   and the chapter's cinematics. Story: js/data-story-ch3*.js.
   Teams go into LOCAL_TEAMS (so seasons, sims and matches can use them): rating = team strength for sims.
   ===================================================================== */

/* ---------- college programs (the COLLEGES list + a few more for the March field) ---------- */
(() => {
  const R = {   // rating, roster (star first), star's defense, style
    blueridge:    [68, ['Theo "Tank" Marsh', 'Jules Okafor', 'Preston Ames', 'Caleb Wynn'], 66, 60],
    commonwealth: [67, ['Jalen "Jet" Brooks', 'Marcus Dell', 'Andre Pike', 'Silas Grant'], 64, 56],
    tobacco:      [67, ['Malik Okafor', 'Ricky Flowers', 'Ben Hollister', 'Javon Teague'], 58, 70],
    westwood:     [65, ['Milo Park', 'Dante Reese', 'Kobe Ashford', 'Tre Mendez'], 60, 58],
    prairie:      [64, ['Andre "Dre" Castillo', 'Wyatt Knox', 'Gus Pelley', 'Lamar Fitch'], 62, 58],
    spokane:      [64, ['Lachie Doyle', 'Nils Haugen', 'Corey Beck', 'Iggy Laurent'], 60, 56],
    magnolia:     [61, ['Darius "D-Train" Holt', 'Jace Fontenot', 'Boo Delacroix', 'Kendrick Pugh'], 58, 60],
    motorcity:    [60, ['Tyrese Whitlock', 'Nate Holloway', 'Ollie Brandt', 'Jamal Ruffin'], 62, 56],
    gulfcoast:    [58, ['Cam Rivers', 'Remy Batiste', 'Hollis Grey', 'Tuck Landry'], 56, 54],
    desert:       [57, ['Luis Ortega', 'Zeke Monroe', 'Ammon Price', 'Ray Benally'], 55, 55],
    metrocc:      [52, ['Devin Shaw', 'Corey Banks', 'Ty Morales', 'Keith Lumpkin'], 50, 50],
  };
  for (const id in R) { const c = COLLEGES[id], [rating, roster, perD, intD] = R[id];
    LOCAL_TEAMS[id] = { name: `${c.name} ${c.nick}`, abbr: c.abbr, colors: c.colors, logo: c.logo, rating, roster, star: { name: roster[0], perD, intD }, conf: c.conf, college: true }; }
  // the rest of the March field (not recruiting you — they only show up in the bracket)
  Object.assign(LOCAL_TEAMS, {
    bayou:     { name: 'Bayou Tech Gators', abbr: 'BTG', colors: ['#166534', '#facc15', '#ffffff'], logo: { shape: 'circle', icon: 'claw' }, rating: 62, roster: ['Boudreaux Lee', 'Pierre Mouton', 'Abe Ricard', 'T.J. Guidry'], star: { name: 'Boudreaux Lee', perD: 58, intD: 58 }, college: true },
    granite:   { name: 'Granite State Mountaineers', abbr: 'GSM', colors: ['#334155', '#f59e0b', '#ffffff'], logo: { shape: 'shield', icon: 'mountain' }, rating: 60, roster: ['Brody Hale', 'Ezra Quint', 'Mason Lark', 'Owen Thorne'], star: { name: 'Brody Hale', perD: 56, intD: 56 }, college: true },
    lakeshore: { name: 'Lakeshore University Lakers', abbr: 'LKU', colors: ['#0369a1', '#f8fafc', '#0c4a6e'], logo: { shape: 'roundel', icon: 'sail' }, rating: 63, roster: ['Dion Achebe', 'Grady Moss', 'Ike Vance', 'Leo Strand'], star: { name: 'Dion Achebe', perD: 62, intD: 54 }, college: true },
    sierra:    { name: 'Sierra Pines Lumberjacks', abbr: 'SPL', colors: ['#14532d', '#fef3c7', '#78350f'], logo: { shape: 'hex', icon: 'tree' }, rating: 59, roster: ['Hank Bodie', 'Rex Wilder', 'Sol Garza', 'Cy Anders'], star: { name: 'Hank Bodie', perD: 55, intD: 58 }, college: true },
    capitalu:  { name: 'Capital University Senators', abbr: 'CAP', colors: ['#7f1d1d', '#e5e7eb', '#111827'], logo: { shape: 'shield', icon: 'stars' }, rating: 61, roster: ['Grant Whitaker', 'Neil Aston', 'Paul Eddy', 'Ross Kimble'], star: { name: 'Grant Whitaker', perD: 58, intD: 56 }, college: true },
  });
})();
/* every college gets its own arena in its colors */
(() => { const fl = { blueridge: 'wood_dark', tobacco: 'wood', commonwealth: 'wood_pro' };
  Object.keys(LOCAL_TEAMS).filter(id => LOCAL_TEAMS[id].college).forEach(id => { const t = LOCAL_TEAMS[id];
    VENUES['col_' + id] = { name: `${t.name.replace(/ [A-Z][\w-]+$/, '')} Arena`, group: 'School & College', desc: `Home of the ${t.name}. Student section painted, band on the baseline.`, style: 'arena', floor: fl[id] || 'wood', team: id, theme: 'college', crowd: .9, lights: 'spots', backboard: 'glass', net: 'nylon', ambient: 'chant' }; }); })();

/* ---------- overseas clubs as playable teams (+ local league opposition) ---------- */
Object.assign(LOCAL_TEAMS, {
  madrid:   Object.assign({}, OVERSEAS_CLUBS.madrid, { rating: 70, roster: ['Marc Ribera', 'Iker Solana', 'Dani Vela', 'Pablo Ruiz'], star: { name: 'Marc Ribera', perD: 66, intD: 62 }, club: true, coach: 'Coach Álvaro Merino' }),
  istanbul: Object.assign({}, OVERSEAS_CLUBS.istanbul, { rating: 67, roster: ['Emre Kaya', 'Burak Demir', 'Mehmet Arslan', 'Can Yıldız'], star: { name: 'Emre Kaya', perD: 62, intD: 62 }, club: true, coach: 'Coach Ozan Erdem' }),
  athens:   Object.assign({}, OVERSEAS_CLUBS.athens, { rating: 66, roster: ['Nikos Pappas', 'Giannis Lekkas', 'Stavros Mitro', 'Kostas Dimou'], star: { name: 'Nikos Pappas', perD: 62, intD: 60 }, club: true, coach: 'Coach Dimitris Kostas' }),
  belgrade: Object.assign({}, OVERSEAS_CLUBS.belgrade, { rating: 68, roster: ['Vuk Radenko', 'Lazar Petrak', 'Ognjen Milas', 'Dušan Krsto'], star: { name: 'Vuk Radenko', perD: 56, intD: 74 }, club: true, coach: 'Coach Zoran Ilić' }),
  paris:    Object.assign({}, OVERSEAS_CLUBS.paris, { rating: 68, roster: ['Bastien Mbaye', 'Yanis Bakari', 'Enzo Lacaze', 'Louis Ferrand'], star: { name: 'Bastien Mbaye', perD: 70, intD: 64 }, club: true, coach: 'Coach Hugo Delmas' }),
  tokyo:    Object.assign({}, OVERSEAS_CLUBS.tokyo, { rating: 63, roster: ['Ren Takeda', 'Haruto Sato', 'Daichi Mori', 'Kenji Ota'], star: { name: 'Ren Takeda', perD: 62, intD: 52 }, club: true, coach: 'Coach Akira Nomura' }),
  sydney:   Object.assign({}, OVERSEAS_CLUBS.sydney, { rating: 64, roster: ['Bailey Moana', 'Cooper Vance', 'Jett Harlow', 'Mitch Rourke'], star: { name: 'Bailey Moana', perD: 58, intD: 58 }, club: true, coach: 'Coach Greg Talbot' }),
  beijing:  Object.assign({}, OVERSEAS_CLUBS.beijing, { rating: 63, roster: ['Li Wei', 'Zhang Hao', 'Chen Bo', 'Wang Lei'], star: { name: 'Li Wei', perD: 58, intD: 60 }, club: true, coach: 'Coach Liu Jian' }),
  // local league teams (the weekly grind between the big clubs)
  porto:    { name: 'Porto Atlântico', abbr: 'POA', colors: ['#1d4ed8', '#f8fafc', '#facc15'], logo: { shape: 'circle', icon: 'sail' }, rating: 61, roster: ['Rui Matos', 'Tiago Sá', 'Nuno Alves', 'Hugo Pinto'], star: { name: 'Rui Matos', perD: 56, intD: 56 }, club: true },
  vilnius:  { name: 'Vilnius Amber', abbr: 'VIL', colors: ['#facc15', '#14532d', '#ffffff'], logo: { shape: 'shield', icon: 'flame' }, rating: 64, roster: ['Rokas Valaitis', 'Mantas Girdz', 'Tadas Brazys', 'Ignas Kurka'], star: { name: 'Rokas Valaitis', perD: 58, intD: 56 }, club: true },
  seoul:    { name: 'Seoul Tigers', abbr: 'SEO', colors: ['#1d4ed8', '#f8fafc', '#dc2626'], logo: { shape: 'circle', icon: 'claw' }, rating: 61, roster: ['Min-jun Park', 'Ji-ho Lee', 'Seo-jun Kim', 'Do-yun Choi'], star: { name: 'Min-jun Park', perD: 58, intD: 54 }, club: true },
  osaka:    { name: 'Osaka Thunder', abbr: 'OSA', colors: ['#7c3aed', '#facc15', '#111827'], logo: { shape: 'hex', icon: 'bolt' }, rating: 60, roster: ['Yuto Kimura', 'Sota Ito', 'Riku Abe', 'Kaito Mori'], star: { name: 'Yuto Kimura', perD: 58, intD: 52 }, club: true },
  manila:   { name: 'Manila Volcanoes', abbr: 'MNL', colors: ['#dc2626', '#1d4ed8', '#facc15'], logo: { shape: 'roundel', icon: 'flame' }, rating: 60, roster: ['Paolo Reyes', 'Jun Mercado', 'Kiefer Dizon', 'Ramon Cruz'], star: { name: 'Paolo Reyes', perD: 56, intD: 54 }, club: true },
  auckland: { name: 'Auckland Breakers', abbr: 'AKL', colors: ['#111827', '#f8fafc', '#0ea5e9'], logo: { shape: 'shield', icon: 'sail' }, rating: 62, roster: ['Tama Ngata', 'Finn Walker', 'Rua Hohaia', 'Sam Kerr'], star: { name: 'Tama Ngata', perD: 58, intD: 60 }, club: true },
  taipei:   { name: 'Taipei Typhoons', abbr: 'TPE', colors: ['#0f766e', '#f8fafc', '#facc15'], logo: { shape: 'circle', icon: 'pinwheel' }, rating: 59, roster: ['Wei-Lun Chen', 'Hao Lin', 'Jia Wu', 'Kai-Ming Tsai'], star: { name: 'Wei-Lun Chen', perD: 56, intD: 54 }, club: true },
  munich:   { name: 'Munich Alpen', abbr: 'MUA', colors: ['#dc2626', '#f8fafc', '#111827'], logo: { shape: 'hex', icon: 'mountain' }, rating: 62, roster: ['Jonas Keller', 'Felix Brandt', 'Lukas Heim', 'Max Vogel'], star: { name: 'Jonas Keller', perD: 58, intD: 58 }, club: true },
});
const CLUB_COACH_LOOK = { skin: '#d9a77e', hair: 'buzz', hairColor: '#9ca3af', beard: 'stubble', outfit: 'polo', jersey: '#111827', trim: '#f8fafc' };

/* ---------- the NBL Grind League (development league) ---------- */
Object.assign(LOCAL_TEAMS, {
  gl_ignition: { name: 'Grind League Ignition', abbr: 'IGN', colors: ['#111827', '#f97316', '#facc15'], logo: { shape: 'hex', icon: 'flame' }, rating: 60, roster: ['Desmond "Dez" Rollins', 'Isaiah "Big Ike" Grant', 'Pooh Jeter Jr.', 'Marlon Cross'], star: { name: 'Desmond "Dez" Rollins', perD: 58, intD: 56 }, gl: true },
  gl_ignition_kai: { name: 'Grind League Ignition', abbr: 'IGN', colors: ['#111827', '#f97316', '#facc15'], logo: { shape: 'hex', icon: 'flame' }, rating: 66, roster: ['Kai Sterling', 'Desmond "Dez" Rollins', 'Isaiah "Big Ike" Grant', 'Marlon Cross'], star: { name: 'Kai Sterling', perD: 66, intD: 54 }, gl: true },
  gl_ropers:   { name: 'Rio Grande Ropers', abbr: 'RGR', colors: ['#7c2d12', '#fbbf24', '#111827'], logo: { shape: 'shield', icon: 'star' }, rating: 62, roster: ['Hector "Hex" Villa', 'Big Shoes', 'Trey Calloway', 'Lonnie Ware'], star: { name: 'Hector "Hex" Villa', perD: 58, intD: 58 }, gl: true },
  gl_thunder:  { name: 'Prairie Thunder', abbr: 'PRT', colors: ['#1e3a8a', '#e5e7eb', '#facc15'], logo: { shape: 'circle', icon: 'bolt' }, rating: 63, roster: ['Quincy Dawes', 'Hammer Jones', 'Shane Polk', 'Arturo Diaz'], star: { name: 'Quincy Dawes', perD: 60, intD: 58 }, gl: true },
  gl_gators:   { name: 'Bayou Gators', abbr: 'BYG', colors: ['#14532d', '#a3e635', '#111827'], logo: { shape: 'roundel', icon: 'claw' }, rating: 61, roster: ['Fontaine Reed', 'Q-Tip', 'Gerald Moss', 'Chet Arnaud'], star: { name: 'Fontaine Reed', perD: 56, intD: 60 }, gl: true },
  gl_vipers:   { name: 'Desert Vipers', abbr: 'DVP', colors: ['#c2410c', '#fde68a', '#1c1917'], logo: { shape: 'diamond', icon: 'zigzag' }, rating: 62, roster: ['Marcus "Smoke" Bell', 'Andre Lyle', 'Victor Sosa', 'Jerome Tate'], star: { name: 'Marcus "Smoke" Bell', perD: 58, intD: 54 }, gl: true },
  gl_herd:     { name: 'Lakeshore Herd', abbr: 'LKH', colors: ['#0c4a6e', '#f8fafc', '#16a34a'], logo: { shape: 'shield', icon: 'antler' }, rating: 60, roster: ['Ole Brekke', 'Darnell Vick', 'Paul Ashe', 'Stu Kamara'], star: { name: 'Ole Brekke', perD: 56, intD: 60 }, gl: true },
  gl_hustle:   { name: 'Capital Hustle', abbr: 'CHU', colors: ['#991b1b', '#f8fafc', '#1e3a8a'], logo: { shape: 'circle', icon: 'stars' }, rating: 63, roster: ['Jordan "Juice" Avery', 'Rashad Mills', 'Kofi Mensah', 'Tim Okoro'], star: { name: 'Jordan "Juice" Avery', perD: 60, intD: 56 }, gl: true },
  gl_cruisers: { name: 'Motor City Cruisers', abbr: 'MCC', colors: ['#1d4ed8', '#e5e7eb', '#dc2626'], logo: { shape: 'roundel', icon: 'gear' }, rating: 61, roster: ['Terrell Banks', 'Ivan Petrov', 'Sammy Ford', 'Leon Pratt'], star: { name: 'Terrell Banks', perD: 58, intD: 56 }, gl: true },
  world_select: { name: 'World Select', abbr: 'WLD', colors: ['#0f172a', '#facc15', '#38bdf8'], logo: { shape: 'roundel', icon: 'stars' }, rating: 68, roster: ['Bastien Mbaye', 'Vuk Radenko', 'Ren Takeda', 'Rokas Valaitis'], star: { name: 'Bastien Mbaye', perD: 70, intD: 64 } },
  // the call-up: a 10-day contract in the NBL
  nbl_okc_cu: { name: 'Oklahoma Twisters', abbr: 'OKC', colors: NBL_TEAMS.okc.colors, logo: NBL_TEAMS.okc.logo, rating: 76, roster: ['Shea Gilmore', 'Lu Dort-Ray', 'Chet Holloway', 'Jalen Wills'], star: { name: 'Shea Gilmore', perD: 74, intD: 66 } },
  nbl_den_cu: { name: 'Denver Summit', abbr: 'DEN', colors: NBL_TEAMS.den.colors, logo: NBL_TEAMS.den.logo, rating: 78, roster: ['Nikola Jovan', 'Jamal Murrow', 'Mike Porterfield', 'Aaron Gordy'], star: { name: 'Nikola Jovan', perD: 64, intD: 76 } },
  // Kai at Blue Ridge (the routes where he goes to college)
  blueridge_kai: { name: 'Blue Ridge University Devils', abbr: 'BRU', colors: COLLEGES.blueridge.colors, logo: COLLEGES.blueridge.logo, rating: 70, roster: ['Kai Sterling', 'Theo "Tank" Marsh', 'Jules Okafor', 'Preston Ames'], star: { name: 'Kai Sterling', perD: 66, intD: 54 }, college: true },
  // pickup crews for each route
  crew_campus: { name: 'Campus Rec Regulars', abbr: 'REC', colors: ['#64748b', '#f8fafc', '#111827'], logo: { shape: 'circle', icon: 'ball' }, rating: 56, roster: ['Intramural Dave', 'Grad Student Gus', 'Walk-On Wes', 'Lifeguard Luke'] },
  crew_euro:   { name: 'Plaza Locals', abbr: 'PLZ', colors: ['#0f766e', '#fef3c7', '#111827'], logo: { shape: 'roundel', icon: 'ball' }, rating: 60, roster: ['Old Stefan', 'Tomi', 'Little Andrej', 'Café Owner Marco'] },
  crew_gl:     { name: 'Motel Lot Run', abbr: 'LOT', colors: ['#78350f', '#fde68a', '#111827'], logo: { shape: 'circle', icon: 'ball' }, rating: 60, roster: ['Night Manager Earl', 'Truck Driver Tony', 'Bellhop Benny', 'Rookie Vic'] },
});
(() => { const w = { gl_ignition: 'paint', gl_ropers: 'brick', gl_thunder: 'block', gl_gators: 'wood', gl_vipers: 'paint', gl_herd: 'block', gl_hustle: 'brick', gl_cruisers: 'block' };
  for (const id in w) { const t = LOCAL_TEAMS[id];
    VENUES['gl_' + id] = { name: `${t.name} Expo Center`, group: 'Pro', desc: `Grind League. Folding chairs, a few thousand fans and a lot of scouts.`, style: 'gym', walls: w[id], floor: 'wood', team: id, crowd: .4, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'gym' }; } })();
Object.assign(PLAYER_WEAPONS, {
  'Theo "Tank" Marsh': ['poster_dunk', 'destroyer'], 'Desmond "Dez" Rollins': ['step_back', 'pickpocket'], 'Hector "Hex" Villa': ['floater', 'no_look'], 'Quincy Dawes': ['logo_three'],
  'Jordan "Juice" Avery': ['lightning_dribble', 'step_back'], 'Shea Gilmore': ['ankle_break', 'floater'], 'Nikola Jovan': ['no_look', 'sky_hook'], 'Emre Kaya': ['barrier_jumper'], 'Nikos Pappas': ['post_fade'],
  'Ren Takeda': ['logo_three', 'lightning_dribble'], 'Boudreaux Lee': ['poster_dunk'], 'Brody Hale': ['step_back'], 'Grant Whitaker': ['no_look'],
});

/* ---------- route pickup courts ---------- */
Object.assign(VENUES, {
  campus_rec:    { name: 'Campus Rec Center', group: 'School & College', desc: 'Six courts, intramural jerseys, and one guy who calls every foul.', style: 'gym', walls: 'paint', floor: 'wood', crowd: .2, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'gym' },
  quad_courts:   { name: 'The Quad Courts', group: 'Streetball', desc: 'Outdoor courts behind the library. Frisbees, finals stress, real runs.', style: 'street', sky: 'day', backdrop: 'park', fence: 'low', floor: 'park', lights: null, crowd: 14, backboard: 'metal', net: 'nylon', ambient: 'park' },
  euro_plaza:    { name: 'Old Town Plaza Court', group: 'Overseas', desc: 'Cobblestones to the baseline, a church bell for a shot clock.', style: 'street', sky: 'dusk', backdrop: 'city', fence: 'low', floor: 'asphalt', lights: 'strings', crowd: 16, backboard: 'metal', net: 'chain', ambient: 'city' },
  harbor_court:  { name: 'Harbor Cage', group: 'Overseas', desc: 'Fishing boats, seagulls and the toughest run on the coast.', style: 'street', sky: 'sunset', backdrop: 'cage', fence: 'cage', floor: 'cage', lights: 'lamps', crowd: 12, backboard: 'metal', net: 'chain', ambient: 'waves' },
  motel_court:   { name: 'Motel 9 Court', group: 'Streetball', desc: 'One hoop behind a motel off the interstate. The ice machine is louder than the crowd.', style: 'street', sky: 'night', backdrop: 'city', fence: 'chain', floor: 'asphalt', lights: 'lamps', crowd: 6, backboard: 'metal', net: 'chain', ambient: 'city' },
  warehouse_run: { name: 'The Warehouse Run', group: 'Streetball', desc: 'A converted warehouse where pros run in the offseason. No refs. No mercy.', style: 'gym', walls: 'brick', floor: 'wood_dark', crowd: .3, lights: 'ceiling', backboard: 'glass', net: 'nylon', ambient: 'gym' },
});
const ROUTE_COURTS = { college: ['campus_rec', 'quad_courts'], overseas: ['euro_plaza', 'harbor_court'], grind: ['motel_court', 'warehouse_run'] };
const ROUTE_CREW = { college: 'crew_campus', overseas: 'crew_euro', grind: 'crew_gl' };

/* ---------- people ---------- */
Object.assign(STORY.characters, {
  ccoach: { get name() { const s = Game.state, c = s && COLLEGES[s.career.college]; return c ? c.coach : 'Head Coach'; }, get short() { const s = Game.state, c = s && COLLEGES[s.career.college]; return c ? c.coach.replace(/^Coach (\w+) /, 'Coach ') : 'Coach'; },
            role: 'Your college head coach', color: '#38bdf8', look: { skin: '#eac4a6', hair: 'flattop', hairColor: '#6b7280', outfit: 'polo', jersey: '#1f2937', trim: '#f8fafc' } },
  ocoach: { get name() { const s = Game.state, t = s && LOCAL_TEAMS[s.career.club]; return (t && t.coach) || 'The Head Coach'; }, get short() { return this.name.replace(/^Coach (\S+) /, 'Coach '); },
            role: 'Your club\'s head coach', color: '#f87171', look: CLUB_COACH_LOOK },
  gcoach: { name: 'Coach Ray Bledsoe', short: 'Bledsoe', role: 'Ignition head coach · twenty years in the Grind', color: '#fb923c', look: { skin: '#6b3d25', hair: 'bald', hairColor: '#0f0d0c', beard: 'goatee', outfit: 'tracksuit', jersey: '#111827', trim: '#f97316' } },
  marko:  { name: 'Marko Vukić', short: 'Marko', role: 'Club captain · 34 years old, 14 seasons', color: '#a78bfa', look: { skin: '#eac4a6', hair: 'buzz', hairColor: '#57534e', beard: 'full', outfit: 'jersey', jersey: '#1f2937', trim: '#f8fafc', build: 'strong' } },
  lena:   { name: 'Lena Novak', short: 'Lena', role: 'Club liaison & translator', color: '#f472b6', look: { skin: '#f1d0b5', hair: 'ponytail', hairColor: '#a0703a', femme: true, outfit: 'polo', jersey: '#334155', trim: '#f8fafc' } },
  dez:    { name: 'Desmond "Dez" Rollins', short: 'Dez', role: 'Ignition · 29, two call-ups, still waiting', color: '#fbbf24', look: { skin: '#5a3420', hair: 'braids', hairColor: '#0f0d0c', beard: 'stubble', outfit: 'jersey', jersey: '#111827', trim: '#f97316', num: 2 } },
  priya:  { name: 'Priya Shah', short: 'Priya', role: 'Sports agent', color: '#22d3ee', look: { skin: '#a86b43', hair: 'long', hairColor: '#0f0d0c', femme: true, outfit: 'polo', jersey: '#0f172a', trim: '#22d3ee' } },
  advisor:{ name: 'Dr. Helen Ward', short: 'Dr. Ward', role: 'Academic advisor', color: '#86efac', look: { skin: '#eac4a6', hair: 'bun', hairColor: '#9ca3af', femme: true, outfit: 'polo', jersey: '#14532d', trim: '#f8fafc' } },
  rook:   { name: 'Danny Okoye', short: 'Danny', role: 'Your college roommate · walk-on', color: '#93c5fd', look: { skin: '#4a2a19', hair: 'afro', hairColor: '#0f0d0c', outfit: 'tee', jersey: '#334155', trim: '#f8fafc' } },
});

/* ---------- cinematics ---------- */
window.EXTRA_CUTSCENES = Object.assign(window.EXTRA_CUTSCENES || {}, {
  c3_signing: { name: 'Signing Day', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'gym', grade: 'gold', music: 'build', tr: 'fade', cam: [[0, -30, -10, 1.04], [1, 20, -6, 1.12]], title: { text: 'SIGNING DAY', sub: 'Your old high school gym', style: 'loc', at: 250 }, ev: [[0, 'cheer'], [400, 'sfx', 'shutter'], [900, 'sfx', 'shutter']] },
    { d: 2600, scene: 'gym', grade: 'spot', cam: [[0, 10, 0, 1.15], [1, 20, 6, 1.26, 'io']], cast: [{ id: 'mom', kind: 'bust', x: .45, expr: 'smile', rim: '#f9a8d4' }, { id: 'nia', kind: 'bust', x: -.5, expr: 'smile', rim: '#d8b4fe', d: 1.1 }],
      say: ['narrator', 'Mom took the night off. Nia brought a sign with glitter on it.'], ev: [[200, 'sfx', 'shutter']] },
    { d: 2600, scene: 'gym', grade: 'spot', cam: [[0, 0, 0, 1.12], [1, 0, -4, 1.28, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#fde68a' }],
      say: ['narrator', 'August. One signature makes it real.'], ev: [[300, 'sfx', 'write']] },
    { d: 2400, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], title: { text: 'SIGNED', sub: '{college}', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'shake', 6], [100, 'confetti', 120], [300, 'cheer']] },
  ] },
  c3_campus: { name: 'Campus', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'highway', cam: [[0, -30, -6, 1.15], [1, 20, -4, 1.2]], grade: 'sunset', music: 'build', tr: 'fade', cast: [{ id: 'bus', kind: 'bus', x: 0, y: 66, d: 1 }],
      title: { text: 'MOVE-IN DAY', sub: '{college}', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 2600, scene: 'arena_ext', cam: [[0, 30, -16, 1.08], [1, 0, -10, 1.16]], say: ['narrator', 'Your face is on a banner outside the arena. You didn\'t know about the banner.'], ev: [[200, 'cheer']] },
    { d: 2600, scene: 'arena', grade: 'blue', cam: [[0, 0, -12, 1.05], [1, 0, -4, 1.2, 'io']], cast: [{ id: 'you', kind: 'full', x: 0, y: 104, sil: true, rim: '#93c5fd', d: 1 }],
      say: ['narrator', 'Fifteen thousand empty seats. In November, every one of them is full.'], ev: [[0, 'sfx', 'crowd', .3]] },
  ] },
  c3_selection: { name: 'Selection Sunday', chapter: 'Chapter 3', shots: [
    { d: 2600, scene: 'locker', grade: 'dark', music: null, cam: [[0, 0, 0, 1.1], [1, 0, 4, 1.22]], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#93c5fd' }],
      say: ['narrator', 'Selection Sunday. The whole team crammed around one TV.'], ev: [[0, 'sfx', 'heartbeat'], [1300, 'sfx', 'heartbeat']] },
    { d: 2400, scene: 'locker', grade: 'dark', cam: [[0, 10, 0, 1.15], [1, 20, 6, 1.26, 'io']], cast: [{ id: 'ccoach', kind: 'bust', x: .4, expr: 'neutral', rim: '#93c5fd' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
      say: ['narrator', 'Three regions down and nobody breathes. Coach stares at the floor.'], ev: [[0, 'sfx', 'heartbeat'], [900, 'sfx', 'heartbeat'], [1700, 'sfx', 'heartbeat']] },
    { d: 2400, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], title: { text: 'YOU\'RE IN', sub: 'The Big Dance · Seed #{seed}', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'shake', 8], [200, 'sfx', 'roar'], [200, 'confetti', 100]] },
  ] },
  c3_bigdance: { name: 'The Big Dance', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'city', grade: 'night', music: 'build', tr: 'fade', cam: [[0, -40, -10, 1.05], [1, 30, -14, 1.14]], title: { text: 'FINAL FOUR WEEKEND', sub: 'March Mayhem Dome', style: 'loc', at: 250 } },
    { d: 2400, scene: 'arena_ext', cam: [[0, 30, -16, 1.08], [1, 0, -10, 1.16]], say: ['narrator', 'Seventy thousand seats. They built a basketball court in a football stadium.'], ev: [[100, 'cheer'], [100, 'sfx', 'crowd', 1.4]] },
    { d: 2300, scene: 'tunnel', cam: [[0, 0, 0, 1], [1, 0, -6, 1.25, 'in']], cast: [{ id: 'you', kind: 'full', x: 0, y: 104, sil: true, rim: '#fde68a', d: 1 }], ev: [[0, 'sfx', 'crowd', 1.4], [1200, 'riser', 1]] },
    { d: 2200, scene: 'arena', grade: 'spot', cam: [[0, 0, -10, 1.2], [1, 0, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#facc15' }], ev: [[150, 'freeze', 1500, 'you'], [150, 'sfx', 'stinger'], [150, 'cheer'], [300, 'sfx', 'roar']] },
  ] },
  c3_champs: { name: 'One Shining Moment', chapter: 'Chapter 3', shots: [
    { d: 3600, scene: 'arena', grade: 'gold', music: 'victory', cam: [[0, 0, -8, 1.2], [1, 0, 0, 1.35, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'smile', rim: '#fde68a' }],
      title: { text: 'NATIONAL CHAMPIONS', sub: '{college}', style: 'slam', at: 300 }, ev: [[300, 'sfx', 'stinger'], [300, 'confetti', 200], [300, 'cheer'], [600, 'sfx', 'roar']] },
  ] },
  c3_abroad: { name: 'A New City', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'sky', cam: [[0, -20, 0, 1.1], [1, 20, 0, 1.18]], music: 'build', tr: 'fade', cast: [{ id: 'plane', kind: 'plane', x: 0, y: 10, d: 1 }], title: { text: 'ONE-WAY TICKET', sub: 'Next stop: {clubCity}', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 2600, scene: 'city', grade: 'night', tr: 'fade', cam: [[0, -40, -10, 1.05], [1, 30, -14, 1.14]], title: { text: '{clubCityUp}', sub: '{club}', style: 'loc', at: 250 } },
    { d: 2600, scene: 'street_night', grade: 'night', cam: [[0, 0, 0, 1.1], [1, 10, -2, 1.2]], cast: [{ id: 'you', kind: 'full', x: -.3, y: 100, from: { dx: -90, t: 1600, ease: 'out' }, walk: true, rim: '#93c5fd' }],
      say: ['narrator', 'You can\'t read a single sign. The rim is still ten feet, though.'] },
  ] },
  c3_eurocup: { name: 'The Cup', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'arena_ext', grade: 'night', music: 'build', tr: 'fade', cam: [[0, 30, -16, 1.08], [1, 0, -10, 1.16]], title: { text: 'CONTINENTAL CUP', sub: 'Final Four', style: 'loc', at: 250 }, ev: [[0, 'cheer']] },
    { d: 2400, scene: 'arena', grade: 'red', cam: [[0, 0, -10, 1.15], [1, 0, -4, 1.3, 'io']], say: ['narrator', 'Flares in the upper deck, drums since warmups. Nobody here is sitting down.'], ev: [[0, 'sfx', 'roar'], [600, 'sfx', 'crowd', 1.4]] },
    { d: 2200, scene: 'tunnel', cam: [[0, 0, 0, 1], [1, 0, -6, 1.25, 'in']], cast: [{ id: 'you', kind: 'full', x: 0, y: 104, sil: true, rim: '#fca5a5', d: 1 }], ev: [[0, 'sfx', 'crowd', 1.4], [1200, 'riser', 1]] },
    { d: 2200, scene: 'arena', grade: 'red', cam: [[0, 0, -10, 1.2], [1, 0, -4, 1.32, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#fde68a' }], title: { text: 'FINAL FOUR', sub: '{club}', style: 'slam', at: 150 }, ev: [[150, 'sfx', 'stinger'], [150, 'shake', 6], [300, 'sfx', 'roar']] },
  ] },
  c3_bus: { name: 'The Grind', chapter: 'Chapter 3', shots: [
    { d: 2600, scene: 'highway', grade: 'night', music: 'sad', tr: 'fade', cam: [[0, -30, -6, 1.15], [1, 20, -4, 1.2]], cast: [{ id: 'bus', kind: 'bus', x: 0, y: 66, d: 1 }],
      title: { text: 'THE GRIND LEAGUE', sub: 'Nine hours to the next game', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 2600, scene: 'street_night', grade: 'night', cam: [[0, 0, 0, 1.1], [1, 10, -2, 1.18]], cast: [{ id: 'you', kind: 'full', x: 0, y: 100, rim: '#fdba74' }],
      say: ['narrator', 'Motel 9, and the sign is missing the 9. Lights out at midnight, shootaround at eight.'] },
    { d: 2600, scene: 'locker', grade: 'dark', cam: [[0, 10, 0, 1.15], [1, 20, 6, 1.26, 'io']], cast: [{ id: 'dez', kind: 'bust', x: .4, expr: 'smile', rim: '#fbbf24' }, { id: 'you', kind: 'bust', x: -.72, y: 130, sil: true, rim: '#fdba74', d: 1.2 }],
      say: ['narrator', 'Dez has done this for eight years. He still checks his phone for the call every morning.'] },
  ] },
  c3_callup: { name: 'The Call-Up', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'sky', cam: [[0, -20, 0, 1.1], [1, 20, 0, 1.18]], music: 'build', tr: 'fade', cast: [{ id: 'plane', kind: 'plane', x: 0, y: 10, d: 1 }], title: { text: 'TEN-DAY CONTRACT', sub: 'Oklahoma Twisters', style: 'loc', at: 300 }, ev: [[0, 'sfx', 'engine']] },
    { d: 2400, scene: 'arena_ext', grade: 'night', cam: [[0, 30, -16, 1.08], [1, 0, -10, 1.16]], say: ['narrator', 'An NBL arena. Your name is taped above a locker, spelled right.'], ev: [[0, 'cheer']] },
    { d: 2200, scene: 'tunnel', cam: [[0, 0, 0, 1], [1, 0, -6, 1.25, 'in']], cast: [{ id: 'you', kind: 'full', x: 0, y: 104, sil: true, rim: '#fde68a', d: 1 }], ev: [[0, 'sfx', 'crowd', 1.4], [1200, 'riser', 1]] },
  ] },
  c3_kai: { name: 'Kai, Again', chapter: 'Chapter 3', shots: [
    { d: 2400, scene: 'arena_ext', grade: 'night', music: 'build', tr: 'fade', cam: [[0, 30, -16, 1.08], [1, 0, -10, 1.16]], say: ['narrator', 'A camera crew, a new pair of shoes, and the same smirk.'], ev: [[0, 'cheer']] },
    { d: 2400, scene: 'vs', cam: [[0, 0, 0, 1.25], [1, 0, 0, 1, 'snap']], speed: 'radial', music: 'clutch',
      cast: [{ id: 'kai', kind: 'bust', x: .55, expr: 'smile', from: { dx: 160, t: 300, ease: 'back' }, rim: '#fca5a5' }, { id: 'you', kind: 'bust', x: -.55, expr: 'determined', from: { dx: -160, t: 300, ease: 'back' }, rim: '#93c5fd' }],
      title: { text: 'ROUND FOUR', sub: 'You vs Kai Sterling', style: 'slam', at: 320 }, ev: [[320, 'impact', 150], [320, 'sfx', 'impact'], [320, 'shake', 8]] },
  ] },
  c3_declare: { name: 'Declaring', chapter: 'Chapter 3', shots: [
    { d: 2600, scene: 'locker', grade: 'spot', music: 'build', tr: 'fade', cam: [[0, 0, 0, 1.12], [1, 0, 4, 1.26, 'io']], cast: [{ id: 'you', kind: 'bust', x: 0, expr: 'determined', rim: '#fde68a' }],
      say: ['narrator', 'A press room, six microphones, Mom in the front row.'], ev: [[0, 'sfx', 'shutter'], [500, 'sfx', 'shutter'], [900, 'sfx', 'shutter']] },
    { d: 2400, scene: 'locker', grade: 'spot', cam: [[0, 0, 0, 1.1], [1, 0, -4, 1.22, 'io']], cast: [{ id: 'mom', kind: 'bust', x: 0, expr: 'smile', rim: '#f9a8d4' }],
      say: ['narrator', 'She worked nights for eighteen years for this. She doesn\'t even try to hide the tears.'], ev: [[300, 'sfx', 'shutter']] },
    { d: 2400, scene: 'title', cam: [[0, 0, 0, 1.3], [1, 0, 0, 1, 'snap']], title: { text: 'DECLARING FOR THE DRAFT', sub: '{name}', style: 'slam', at: 100 }, ev: [[100, 'sfx', 'stinger'], [100, 'shake', 8], [100, 'flash', '#ffffff', .6]] },
  ] },
});
