/* =====================================================================
   DATA-LEAGUES.JS — teams outside the main league.
   LOCAL_TEAMS: playground crews (and later high schools) used in story matches.
   Each team: id, name, abbr, colors [primary, secondary, accent],
   logo { shape: shield|circle|hex|diamond|roundel, icon: glyph name (see Art.GLYPHS) },
   roster: names used by play-by-play, star: { name, perD, intD } = main defender.
   ===================================================================== */

const LOCAL_TEAMS = {
  /* ---- Chapter 1: Halsey Street (playground) ---- */
  halsey: {
    name: 'Halsey Street', abbr: 'HAL', colors: ['#f97316', '#1f2937', '#fde68a'],
    logo: { shape: 'roundel', icon: 'ball' },
    roster: ['Tariq "T-Bone" Miles', 'Big Rudy', 'Smoke', 'Lil\' Dez'],
  },
  sterling_squad: {
    name: 'Sterling Squad', abbr: 'STR', colors: ['#2563eb', '#e5e7eb', '#0f172a'],
    logo: { shape: 'diamond', icon: 'crown' },
    roster: ['Kai Sterling', 'Brandon Vale', 'Preston Ames', 'Jules Okafor'],
    star: { name: 'Kai Sterling', perD: 52, intD: 44 },
  },
  southside: {
    name: 'Southside Bricklayers', abbr: 'SSB', colors: ['#b91c1c', '#fbbf24', '#1c1917'],
    logo: { shape: 'shield', icon: 'gear' },
    roster: ['Hammer Jones', 'Q-Tip', 'Marlon Cross', 'Big Shoes'],
    star: { name: 'Hammer Jones', perD: 40, intD: 46 },
  },
  eastend: {
    name: 'East End Runners', abbr: 'EER', colors: ['#16a34a', '#f8fafc', '#14532d'],
    logo: { shape: 'hex', icon: 'bolt' },
    roster: ['Flash Gordon Lee', 'Ricky Two-Times', 'Mo Bamba-ish', 'Deshawn'],
    star: { name: 'Flash Gordon Lee', perD: 45, intD: 38 },
  },
  westbrook_elite: {
    name: 'Westbrook Elite', abbr: 'WBE', colors: ['#1e3a8a', '#facc15', '#ffffff'],
    logo: { shape: 'shield', icon: 'wing' },
    roster: ['Kai Sterling', 'Brandon Vale', 'Theo "Tank" Marsh', 'Jules Okafor'],
    star: { name: 'Kai Sterling', perD: 55, intD: 46 },
  },

  /* ---- Chapter 2: Metro Prep League (high school). rating = team strength for sims ---- */
  lincoln: {
    name: 'Lincoln High Lions', abbr: 'LIN', colors: ['#b91c1c', '#fbbf24', '#111827'], rating: 50,
    logo: { shape: 'shield', icon: 'paw' },
    roster: ['Tariq "T-Bone" Miles', 'Darnell "Brick" Hollis', 'Jordan Pike', 'Andre Cole', 'Big Rudy'],
    star: { name: 'Darnell "Brick" Hollis', perD: 48, intD: 50 },
  },
  westbrook: {
    name: 'Westbrook Academy Eagles', abbr: 'WBA', colors: ['#1e3a8a', '#facc15', '#ffffff'], rating: 55,
    logo: { shape: 'shield', icon: 'wing' },
    roster: ['Kai Sterling', 'Brandon Vale', 'Theo "Tank" Marsh', 'Jules Okafor', 'Preston Ames'],
    star: { name: 'Kai Sterling', perD: 58, intD: 48 },
  },
  northgate: {
    name: 'Northgate Titans', abbr: 'NGT', colors: ['#6d28d9', '#d1d5db', '#1e1b4b'], rating: 56,
    logo: { shape: 'hex', icon: 'sword' },
    roster: ['Darius "D-Train" Holt', 'Mikey Lau', 'Sam Okoro', 'Trey Bishop', 'Cal Henning'],
    star: { name: 'Darius "D-Train" Holt', perD: 55, intD: 54 },
  },
  eastview: {
    name: 'Eastview Panthers', abbr: 'EVW', colors: ['#0f766e', '#111827', '#5eead4'], rating: 48,
    logo: { shape: 'circle', icon: 'claw' },
    roster: ['Quincy Fields', 'Ray Delgado', 'Omar Haddad', 'Vince Pruitt', 'Kyle Ng'],
    star: { name: 'Quincy Fields', perD: 47, intD: 44 },
  },
  central: {
    name: 'Central Tech Engineers', abbr: 'CTE', colors: ['#ea580c', '#1e3a8a', '#ffffff'], rating: 45,
    logo: { shape: 'roundel', icon: 'gear' },
    roster: ['Felix Moreno', 'Isaiah Grant', 'Dmitri Volkov', 'Ben Asante', 'Luis Ortega'],
    star: { name: 'Isaiah Grant', perD: 44, intD: 46 },
  },
  stvincent: {
    name: 'St. Vincent Prep Friars', abbr: 'SVP', colors: ['#15803d', '#ffffff', '#14532d'], rating: 53,
    logo: { shape: 'shield', icon: 'star' },
    roster: ['Patrick Doyle', 'Liam Brennan-Ross', 'Chidi Eze', 'Marco Russo', 'Owen Walsh'],
    star: { name: 'Chidi Eze', perD: 52, intD: 52 },
  },
  riverside: {
    name: 'Riverside Raiders', abbr: 'RVR', colors: ['#991b1b', '#0a0a0a', '#f87171'], rating: 44,
    logo: { shape: 'diamond', icon: 'sail' },
    roster: ['Jalen Brooks Jr.', 'Tony Vu', 'Deshawn Price', 'Cody Hart', 'Malik Shaw'],
    star: { name: 'Deshawn Price', perD: 45, intD: 42 },
  },
  oakmont: {
    name: 'Oakmont Academy Knights', abbr: 'OAK', colors: ['#7f1d1d', '#d4a017', '#1c1917'], rating: 51,
    logo: { shape: 'shield', icon: 'crown' },
    roster: ['Grant Whitfield', 'Elijah Ross', 'Nate Kimura', 'Will Hayes', 'Ade Bakare'],
    star: { name: 'Elijah Ross', perD: 50, intD: 47 },
  },
  /* Tryout scrimmage squads */
  lincoln_hopefuls: { name: 'Lincoln Tryout Squad', abbr: 'TRY', colors: ['#9ca3af', '#111827', '#f8fafc'], logo: { shape: 'circle', icon: 'paw' }, roster: ['Tariq "T-Bone" Miles', 'Jordan Pike', 'Kid from Algebra', 'Freshman Ty'] },
  lincoln_varsity: { name: 'Lincoln Varsity Returners', abbr: 'VAR', colors: ['#b91c1c', '#fbbf24', '#111827'], logo: { shape: 'shield', icon: 'paw' }, roster: ['Darnell "Brick" Hollis', 'Andre Cole', 'Big Rudy', 'Sean Platt'], star: { name: 'Darnell "Brick" Hollis', perD: 48, intD: 50 } },
  westbrook_white: { name: 'Westbrook White', abbr: 'WHT', colors: ['#f8fafc', '#1e3a8a', '#facc15'], logo: { shape: 'shield', icon: 'wing' }, roster: ['Brandon Vale', 'Preston Ames', 'Walk-on Will', 'Jules Okafor'] },
  westbrook_blue: { name: 'Westbrook Blue', abbr: 'BLU', colors: ['#1e3a8a', '#facc15', '#ffffff'], logo: { shape: 'shield', icon: 'wing' }, roster: ['Kai Sterling', 'Theo "Tank" Marsh', 'Rich Kid Carter', 'Lucas Bell'], star: { name: 'Kai Sterling', perD: 57, intD: 47 } },

  /* 1-on-1 showdown opponent */
  kai_solo: { name: 'Kai Sterling', abbr: 'KAI', colors: ['#1e3a8a', '#facc15', '#ffffff'], rating: 60, logo: { shape: 'diamond', icon: 'crown' }, roster: ['Kai Sterling'], star: { name: 'Kai Sterling', perD: 60, intD: 50 } },
  pickup_crew: { name: 'Halsey Pickup Crew', abbr: 'PKP', colors: ['#64748b', '#f8fafc', '#111827'], rating: 46, logo: { shape: 'circle', icon: 'ball' }, roster: ['Big Rudy', 'Smoke', 'Lil\' Dez', 'Old Man Pete'] },
  /* ---- Chapter 2: Summer AAU circuit — "The Peach Slam" ---- */
  halsey_hoops: { name: 'Halsey Hoops AAU', abbr: 'HHA', colors: ['#f97316', '#111827', '#fde68a'], rating: 55, logo: { shape: 'roundel', icon: 'flame' }, roster: ['Tariq "T-Bone" Miles', 'Big Rudy', 'Quincy Fields', 'Chidi Eze', 'Smoke'] },
  sterling_select: { name: 'Sterling Select', abbr: 'SEL', colors: ['#0f172a', '#facc15', '#38bdf8'], rating: 61, logo: { shape: 'diamond', icon: 'crown' }, roster: ['Kai Sterling', 'Brandon Vale', 'Darius "D-Train" Holt', 'Theo "Tank" Marsh', 'Jules Okafor'], star: { name: 'Kai Sterling', perD: 60, intD: 50 } },
  atl_heat: { name: 'Peachtree Heat', abbr: 'PTH', colors: ['#dc2626', '#fde047', '#111827'], rating: 56, logo: { shape: 'circle', icon: 'flame' }, roster: ['Javon Reese', 'Marcus Dial', 'Tre Wilkes', 'Bo Jenkins', 'CJ Holloway'], star: { name: 'Javon Reese', perD: 56, intD: 48 } },
  cali_supreme: { name: 'Cali Supreme', abbr: 'CAL', colors: ['#2563eb', '#fbbf24', '#ffffff'], rating: 57, logo: { shape: 'hex', icon: 'sun' }, roster: ['Kenji Morales', 'Dante Ruiz', 'Shawn Patel', 'Luke Carter', 'Zion Abara'], star: { name: 'Dante Ruiz', perD: 55, intD: 50 } },
  tx_takeover: { name: 'Texas Takeover', abbr: 'TXT', colors: ['#b45309', '#f8fafc', '#1f2937'], rating: 55, logo: { shape: 'shield', icon: 'star' }, roster: ['Brayden Cole', 'Isaac Mendez', 'Ty Ward', 'Ronnie Blake', 'Jace Hill'], star: { name: 'Brayden Cole', perD: 54, intD: 52 } },
  chi_fire: { name: 'Chi-Town Fire', abbr: 'CHF', colors: ['#991b1b', '#111827', '#f97316'], rating: 56, logo: { shape: 'roundel', icon: 'bolt' }, roster: ['Amari Price', 'Josh Kowal', 'Devon Lake', 'Rico Banks', 'Eli Stone'], star: { name: 'Amari Price', perD: 55, intD: 47 } },
};

/* =====================================================================
   COLLEGES (fictional) — recruiting offers in Chapter 2, setup for Chapter 3.
   prestige 1–5 = recruiting stars usually needed for an offer.
   playtime / exposure / development: 1–5 (shown on the offer cards).
   ===================================================================== */
const COLLEGES = {
  blueridge:    { name: 'Blue Ridge University', nick: 'Devils', abbr: 'BRU', colors: ['#1e3a8a', '#f8fafc', '#93c5fd'], logo: { shape: 'shield', icon: 'horns' }, prestige: 5, coach: 'Coach Mike Kowalski', conf: 'Atlantic Coast', playtime: 2, exposure: 5, development: 5, pitch: 'Five banners. Forty years. One standard: championships.' },
  commonwealth: { name: 'Commonwealth State', nick: 'Wildcats', abbr: 'CWS', colors: ['#1d4ed8', '#ffffff', '#0f172a'], logo: { shape: 'circle', icon: 'claw' }, prestige: 5, coach: 'Coach Dale Pruitt', conf: 'Southland', playtime: 3, exposure: 5, development: 4, pitch: 'We put more players in the NBL than anybody. Period.' },
  tobacco:      { name: 'Tobacco Road University', nick: 'Tar Herons', abbr: 'TRU', colors: ['#7dd3fc', '#0c4a6e', '#ffffff'], logo: { shape: 'roundel', icon: 'bird' }, prestige: 5, coach: 'Coach Roy Whitlock', conf: 'Atlantic Coast', playtime: 3, exposure: 5, development: 4, pitch: 'Family first. Fast break always.' },
  westwood:     { name: 'Westwood University', nick: 'Bruins', abbr: 'WWU', colors: ['#2563eb', '#facc15', '#ffffff'], logo: { shape: 'shield', icon: 'paw' }, prestige: 4, coach: 'Coach Ana Morales', conf: 'Pacific', playtime: 4, exposure: 4, development: 4, pitch: 'Sunshine, a dynasty, and a starting spot on day one.' },
  prairie:      { name: 'Prairie State', nick: 'Jayhawkers', abbr: 'PSU', colors: ['#b91c1c', '#1d4ed8', '#ffffff'], logo: { shape: 'circle', icon: 'wing' }, prestige: 4, coach: 'Coach Bill Hensley', conf: 'Heartland', playtime: 3, exposure: 4, development: 5, pitch: 'The loudest building in college basketball.' },
  spokane:      { name: 'Spokane College', nick: 'Bulldogs', abbr: 'SPC', colors: ['#1e293b', '#dc2626', '#ffffff'], logo: { shape: 'hex', icon: 'paw' }, prestige: 4, coach: 'Coach Mark Fewell', conf: 'Northwest', playtime: 4, exposure: 3, development: 5, pitch: 'We develop. Ask anybody who left here a pro.' },
  magnolia:     { name: 'Magnolia State', nick: 'Tigers', abbr: 'MGS', colors: ['#6b21a8', '#facc15', '#ffffff'], logo: { shape: 'shield', icon: 'claw' }, prestige: 3, coach: 'Coach Earl Simmons', conf: 'Gulf', playtime: 5, exposure: 3, development: 3, pitch: 'You\'d be the face of this program from the first tip.' },
  motorcity:    { name: 'Motor City Tech', nick: 'Spartans', abbr: 'MCT', colors: ['#166534', '#ffffff', '#14532d'], logo: { shape: 'shield', icon: 'sword' }, prestige: 3, coach: 'Coach Tom Izzard', conf: 'Great Lakes', playtime: 4, exposure: 3, development: 4, pitch: 'Tough, physical, March-ready. Every year.' },
  gulfcoast:    { name: 'Gulf Coast A&M', nick: 'Pelicans', abbr: 'GCA', colors: ['#0e7490', '#f97316', '#ffffff'], logo: { shape: 'circle', icon: 'bird' }, prestige: 2, coach: 'Coach Ray Thibodeaux', conf: 'Gulf', playtime: 5, exposure: 2, development: 3, pitch: 'Start all four years. Become a legend here.' },
  desert:       { name: 'Desert State', nick: 'Coyotes', abbr: 'DSU', colors: ['#c2410c', '#fef3c7', '#78350f'], logo: { shape: 'diamond', icon: 'sun' }, prestige: 2, coach: 'Coach Lena Ortiz', conf: 'Mountain', playtime: 5, exposure: 2, development: 3, pitch: 'We run, we gun, and we\'ll give you the keys.' },
  metrocc:      { name: 'Metro City College', nick: 'Comets', abbr: 'MCC', colors: ['#475569', '#f97316', '#ffffff'], logo: { shape: 'roundel', icon: 'star' }, prestige: 1, coach: 'Coach Bobby Lyle', conf: 'Juco East', playtime: 5, exposure: 1, development: 2, pitch: 'Two years here, then transfer up. Plenty of guys have done it.' },
};


/* ---------- NBL (the pro league, parody) — used for pro home courts (Chapter 4+) ----------
   Each team: name, city, abbr, colors [primary, secondary, accent], logo { shape, icon } */
const NBL_TEAMS = {
  bos: { city: 'Boston', name: 'Boston Harbor Hounds', abbr: 'BHH', colors: ['#047857', '#f8fafc', '#064e3b'], logo: { shape: 'circle', icon: 'clover' } },
  man: { city: 'New York', name: 'Manhattan Monarchs', abbr: 'MAN', colors: ['#1d4ed8', '#f97316', '#ffffff'], logo: { shape: 'shield', icon: 'crown' } },
  bkb: { city: 'Brooklyn', name: 'Brooklyn Bridges', abbr: 'BKB', colors: ['#111827', '#f8fafc', '#6b7280'], logo: { shape: 'roundel', icon: 'bridge' } },
  phf: { city: 'Philadelphia', name: 'Philly Founders', abbr: 'PHF', colors: ['#1d4ed8', '#dc2626', '#ffffff'], logo: { shape: 'circle', icon: 'stars' } },
  tnl: { city: 'Toronto', name: 'Toronto Northern Lights', abbr: 'TNL', colors: ['#7c3aed', '#0f172a', '#e5e7eb'], logo: { shape: 'hex', icon: 'snow' } },
  chw: { city: 'Chicago', name: 'Chicago Windstorm', abbr: 'CHW', colors: ['#b91c1c', '#111827', '#ffffff'], logo: { shape: 'diamond', icon: 'horns' } },
  cle: { city: 'Cleveland', name: 'Cleveland Ironworks', abbr: 'CLE', colors: ['#7f1d1d', '#fbbf24', '#111827'], logo: { shape: 'shield', icon: 'gear' } },
  det: { city: 'Detroit', name: 'Detroit Assembly', abbr: 'DET', colors: ['#1e40af', '#dc2626', '#e5e7eb'], logo: { shape: 'roundel', icon: 'gear' } },
  ind: { city: 'Indianapolis', name: 'Indiana Racers', abbr: 'IND', colors: ['#1e3a8a', '#facc15', '#ffffff'], logo: { shape: 'circle', icon: 'chevrons' } },
  mil: { city: 'Milwaukee', name: 'Milwaukee Brewhawks', abbr: 'MIL', colors: ['#14532d', '#fef3c7', '#1e3a8a'], logo: { shape: 'shield', icon: 'antler' } },
  atl: { city: 'Atlanta', name: 'Atlanta Firebirds', abbr: 'ATL', colors: ['#dc2626', '#fde047', '#111827'], logo: { shape: 'circle', icon: 'bird' } },
  mia: { city: 'Miami', name: 'Miami Riptide', abbr: 'MIA', colors: ['#be123c', '#111827', '#fb923c'], logo: { shape: 'hex', icon: 'flame' } },
  orl: { city: 'Orlando', name: 'Orlando Comets', abbr: 'ORL', colors: ['#0369a1', '#e5e7eb', '#111827'], logo: { shape: 'roundel', icon: 'rocket' } },
  cha: { city: 'Charlotte', name: 'Charlotte Stingers', abbr: 'CHA', colors: ['#0d9488', '#6d28d9', '#ffffff'], logo: { shape: 'diamond', icon: 'stinger' } },
  cap: { city: 'Washington', name: 'Capital Eagles', abbr: 'CAP', colors: ['#1e3a8a', '#dc2626', '#e5e7eb'], logo: { shape: 'shield', icon: 'wing' } },
  den: { city: 'Denver', name: 'Denver Summit', abbr: 'DEN', colors: ['#0e3a8a', '#fbbf24', '#991b1b'], logo: { shape: 'circle', icon: 'mountain' } },
  min: { city: 'Minneapolis', name: 'Minnesota Frost', abbr: 'MIN', colors: ['#0c4a6e', '#22c55e', '#e5e7eb'], logo: { shape: 'hex', icon: 'tree' } },
  okc: { city: 'Oklahoma City', name: 'Oklahoma Twisters', abbr: 'OKC', colors: ['#0284c7', '#f97316', '#1e3a8a'], logo: { shape: 'roundel', icon: 'pinwheel' } },
  por: { city: 'Portland', name: 'Portland Pioneers', abbr: 'POR', colors: ['#dc2626', '#111827', '#f8fafc'], logo: { shape: 'diamond', icon: 'zigzag' } },
  uta: { city: 'Salt Lake City', name: 'Utah Peaks', abbr: 'UTA', colors: ['#4c1d95', '#facc15', '#0f172a'], logo: { shape: 'shield', icon: 'mountain' } },
  bay: { city: 'San Francisco', name: 'Bay City Gold', abbr: 'BAY', colors: ['#1d4ed8', '#fbbf24', '#ffffff'], logo: { shape: 'circle', icon: 'bridge' } },
  las: { city: 'Los Angeles', name: 'Los Angeles Stars', abbr: 'LAS', colors: ['#6b21a8', '#facc15', '#ffffff'], logo: { shape: 'roundel', icon: 'star' } },
  lab: { city: 'Los Angeles', name: 'LA Breakers', abbr: 'LAB', colors: ['#1d4ed8', '#dc2626', '#e5e7eb'], logo: { shape: 'hex', icon: 'sail' } },
  sac: { city: 'Sacramento', name: 'Sacramento Royals', abbr: 'SAC', colors: ['#5b21b6', '#cbd5e1', '#111827'], logo: { shape: 'shield', icon: 'crown' } },
  phx: { city: 'Phoenix', name: 'Phoenix Scorch', abbr: 'PHX', colors: ['#ea580c', '#4c1d95', '#111827'], logo: { shape: 'circle', icon: 'sun' } },
  dal: { city: 'Dallas', name: 'Dallas Lone Stars', abbr: 'DAL', colors: ['#1d4ed8', '#94a3b8', '#0f172a'], logo: { shape: 'diamond', icon: 'star' } },
  hou: { city: 'Houston', name: 'Houston Orbit', abbr: 'HOU', colors: ['#b91c1c', '#e5e7eb', '#111827'], logo: { shape: 'roundel', icon: 'rocket' } },
  sas: { city: 'San Antonio', name: 'San Antonio Missions', abbr: 'SAS', colors: ['#111827', '#9ca3af', '#f8fafc'], logo: { shape: 'shield', icon: 'sword' } },
  mem: { city: 'Memphis', name: 'Memphis Blues', abbr: 'MEM', colors: ['#1e3a8a', '#93c5fd', '#facc15'], logo: { shape: 'circle', icon: 'note' } },
  nol: { city: 'New Orleans', name: 'New Orleans Jazzmen', abbr: 'NOL', colors: ['#0f172a', '#d4a017', '#b91c1c'], logo: { shape: 'hex', icon: 'note' } },
};

/* ---------- Overseas clubs (Chapter 3 overseas route) — each gets a themed arena ----------
   chant: shown on the LED ribbon / chanted by the crowd. landmark: silhouette painted above the stands. */
const OVERSEAS_CLUBS = {
  madrid:   { city: 'Madrid', name: 'Castilla Madrid', abbr: 'CMA', league: 'EuroLeeg', colors: ['#f8fafc', '#6d28d9', '#d4a017'], logo: { shape: 'shield', icon: 'crown' }, chant: 'OLE OLE OLE', landmark: 'arches' },
  istanbul: { city: 'Istanbul', name: 'Bosphorus Istanbul', abbr: 'BOS', league: 'EuroLeeg', colors: ['#facc15', '#1e3a8a', '#ffffff'], logo: { shape: 'circle', icon: 'stars' }, chant: 'HAYDI HAYDI', landmark: 'domes' },
  athens:   { city: 'Athens', name: 'Acropolis Athens', abbr: 'ACA', league: 'EuroLeeg', colors: ['#15803d', '#ffffff', '#14532d'], logo: { shape: 'roundel', icon: 'clover' }, chant: 'ELA ELA', landmark: 'columns' },
  belgrade: { city: 'Belgrade', name: 'Danube Belgrade', abbr: 'DBG', league: 'EuroLeeg', colors: ['#dc2626', '#ffffff', '#1e3a8a'], logo: { shape: 'shield', icon: 'star' }, chant: 'AJDE AJDE', landmark: 'fortress' },
  paris:    { city: 'Paris', name: 'Paris Lumiere', abbr: 'PLU', league: 'EuroLeeg', colors: ['#1e3a8a', '#f8fafc', '#dc2626'], logo: { shape: 'hex', icon: 'star' }, chant: 'ALLEZ ALLEZ', landmark: 'tower' },
  tokyo:    { city: 'Tokyo', name: 'Tokyo Neon Dragons', abbr: 'TND', league: 'Pacific Pro League', colors: ['#dc2626', '#f8fafc', '#111827'], logo: { shape: 'circle', icon: 'flame' }, chant: 'GANBARE', landmark: 'tokyotower' },
  sydney:   { city: 'Sydney', name: 'Sydney Harbour Sharks', abbr: 'SHS', league: 'Pacific Pro League', colors: ['#38bdf8', '#facc15', '#0f172a'], logo: { shape: 'roundel', icon: 'sail' }, chant: 'AUSSIE AUSSIE OI OI OI', landmark: 'opera' },
  beijing:  { city: 'Beijing', name: 'Beijing Golden Dragons', abbr: 'BGD', league: 'Pacific Pro League', colors: ['#b91c1c', '#facc15', '#111827'], logo: { shape: 'shield', icon: 'flame' }, chant: 'JIA YOU JIA YOU', landmark: 'pagoda' },
};
