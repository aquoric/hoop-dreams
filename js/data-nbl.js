/* =====================================================================
   DATA-NBL.JS — the National Ballers League (the pro league, a parody). Loaded right after js/data-leagues.js.
   NBL_LEAGUE.teams: every team keeps its city and twists the nickname, has a conference, a team rating, its star(s)
   (ratings, the weapons that match what they're known for, a look for the 16-bit sprite and portrait) and fictional
   role players. This file renames NBL_TEAMS (ids stay the same, so saves and home courts keep working) and builds:
     LOCAL_TEAMS['nbl_<id>']  the whole team (playable)
     LOCAL_TEAMS['sl_<id>']   its Summer League squad (rookies + young guys; Chapter 4 adds the drafted rookie)
     PLAYER_WEAPONS[star]     each star's weapons
   Edit freely: star = [name, pos, Overall, Perimeter D, Interior D, [weapons], look]
   ===================================================================== */
const NBL_LEAGUE = {
  name: 'National Ballers League', abbr: 'NBL', commissioner: 'Commissioner Adam Sylvan',
  teams: {
    // id: [nickname, conference, team rating, [stars]]
    bos: ['Seltics', 'East', 82, [['Jayson Tantrum', 'SF', 93, 72, 60, ['step_back', 'spin_fade'], { skin: '#8d5524', hair: 'braids', hairColor: '#0f0d0c', beard: 'stubble' }],
                                    ['Jaylen Brownout', 'SG', 88, 78, 56, ['poster_dunk', 'lockdown'], { skin: '#6b3d25', hair: 'buzz', hairColor: '#0f0d0c', beard: 'full' }]]],
    man: ['Knicknacks', 'East', 79, [['Jalen Brunswick', 'PG', 90, 60, 44, ['step_back', 'floater'], { skin: '#7a4a2c', hair: 'fade', hairColor: '#0f0d0c', beard: 'goatee' }]]],
    bkb: ['Nyets', 'East', 70, [['Cam Thomason', 'SG', 82, 50, 40, ['phantom_shot', 'lightning_dribble'], { skin: '#5c3a21', hair: 'dreads', hairColor: '#0f0d0c' }]]],
    phf: ['77ers', 'East', 78, [['Joel Embiidle', 'C', 94, 58, 86, ['dream_shake', 'destroyer'], { skin: '#4a2a19', hair: 'buzz', hairColor: '#0f0d0c', build: 'strong' }],
                                ['Tyrese Maxed', 'PG', 87, 62, 40, ['lightning_dribble', 'floater'], { skin: '#6b3d25', hair: 'fade', hairColor: '#0f0d0c' }]]],
    tnl: ['Rapturs', 'East', 72, [['Scottie Barnyard', 'PF', 85, 70, 68, ['euro_step', 'chase_block'], { skin: '#6b3d25', hair: 'curly', hairColor: '#0f0d0c', build: 'lean' }]]],
    chw: ['Bulldozers', 'East', 73, [['DeMar DeRozen', 'SF', 84, 54, 46, ['spin_fade', 'phantom_shot'], { skin: '#5c3a21', hair: 'fade', hairColor: '#0f0d0c', beard: 'stubble' }]]],
    cle: ['Cavemen', 'East', 81, [['Donovan Mitchum', 'SG', 91, 62, 48, ['poster_dunk', 'step_back'], { skin: '#6b3d25', hair: 'buzz', hairColor: '#0f0d0c', beard: 'stubble' }],
                                  ['Evan Mobely', 'C', 86, 66, 84, ['destroyer', 'lob_threat'], { skin: '#4a2a19', hair: 'fade', hairColor: '#0f0d0c', build: 'lean' }]]],
    det: ['Pistols', 'East', 71, [['Cade Cunningsham', 'PG', 87, 58, 50, ['no_look', 'spin_fade'], { skin: '#7a4a2c', hair: 'curly', hairColor: '#0f0d0c' }]]],
    ind: ['Pacemakers', 'East', 77, [['Tyrese Halliburger', 'PG', 89, 56, 42, ['ignite_pass', 'no_look'], { skin: '#8d5524', hair: 'fade', hairColor: '#0f0d0c', build: 'lean' }]]],
    mil: ['Bucktails', 'East', 80, [['Giannis Antetokounbro', 'PF', 95, 70, 84, ['meteor_jam', 'euro_step'], { skin: '#4a2a19', hair: 'buzz', hairColor: '#0f0d0c', build: 'strong' }],
                                    ['Dame Lollard', 'PG', 88, 48, 36, ['logo_three', 'step_back'], { skin: '#5c3a21', hair: 'fade', hairColor: '#0f0d0c', beard: 'full' }]]],
    atl: ['Hawkers', 'East', 72, [['Trae Yung', 'PG', 87, 40, 32, ['logo_three', 'floater'], { skin: '#8d5524', hair: 'flattop', hairColor: '#0f0d0c', build: 'lean' }]]],
    mia: ['Heatstroke', 'East', 76, [['Jimmy Buttler', 'SF', 88, 82, 66, ['lockdown', 'post_fade'], { skin: '#7a4a2c', hair: 'braids', hairColor: '#0f0d0c', beard: 'goatee' }],
                                     ['Bam Adebayou', 'C', 85, 76, 82, ['lockdown', 'chase_block'], { skin: '#4a2a19', hair: 'buzz', hairColor: '#0f0d0c', build: 'strong' }]]],
    orl: ['Magicians', 'East', 77, [['Paolo Bankero', 'PF', 89, 60, 64, ['post_fade', 'euro_step'], { skin: '#d9a77e', hair: 'fade', hairColor: '#3b2416', build: 'strong' }]]],
    cha: ['Hornits', 'East', 68, [['LaMelo Bell', 'PG', 85, 50, 36, ['no_look', 'logo_three'], { skin: '#8d5524', hair: 'dreads', hairColor: '#facc15', build: 'lean' }]]],
    cap: ['Lizards', 'East', 66, [['Jordan Poolside', 'SG', 80, 44, 36, ['step_back', 'floater'], { skin: '#6b3d25', hair: 'curly', hairColor: '#0f0d0c' }]]],
    den: ['Nougats', 'West', 82, [['Nikola Jovan', 'C', 97, 54, 70, ['no_look', 'heaven_shot'], { skin: '#e8c19a', hair: 'buzz', hairColor: '#3b2416', beard: 'stubble', build: 'strong' }],
                                  ['Jamal Murrow', 'PG', 87, 56, 40, ['spin_fade', 'step_back'], { skin: '#7a4a2c', hair: 'fade', hairColor: '#0f0d0c', beard: 'full' }]]],
    min: ['Timberwoofs', 'West', 80, [['Ant Edwardsville', 'SG', 92, 70, 54, ['poster_dunk', 'step_back'], { skin: '#5c3a21', hair: 'buzz', hairColor: '#0f0d0c', build: 'strong' }],
                                      ['Rudy Gobble', 'C', 84, 52, 92, ['destroyer', 'hammer_board'], { skin: '#e8c19a', hair: 'curly', hairColor: '#3b2416', build: 'strong' }]]],
    okc: ['Blunder', 'West', 83, [['Shea Gilmore', 'PG', 95, 74, 50, ['vanishing_drive', 'spin_fade'], { skin: '#7a4a2c', hair: 'curly', hairColor: '#0f0d0c', build: 'lean' }],
                                  ['Chet Holloway', 'C', 85, 58, 88, ['destroyer', 'sky_three'], { skin: '#5c3a21', hair: 'fade', hairColor: '#0f0d0c', build: 'lean' }]]],
    por: ['Trail Grazers', 'West', 67, [['Anfernee Simonz', 'SG', 81, 48, 38, ['poster_dunk', 'step_back'], { skin: '#5c3a21', hair: 'dreads', hairColor: '#0f0d0c' }]]],
    uta: ['Jams', 'West', 69, [['Lauri Markkannon', 'PF', 84, 46, 58, ['sky_three', 'barrier_jumper'], { skin: '#f1d0b0', hair: 'flattop', hairColor: '#a16207', build: 'lean' }]]],
    bay: ['Worriers', 'West', 79, [['Steph Hurry', 'PG', 95, 54, 36, ['logo_three', 'sky_three'], { skin: '#c68a5c', hair: 'fade', hairColor: '#0f0d0c', build: 'lean' }],
                                   ['Draymond Greenwood', 'PF', 82, 80, 76, ['no_look', 'lockdown'], { skin: '#6b3d25', hair: 'buzz', hairColor: '#0f0d0c', beard: 'stubble', build: 'strong' }]]],
    las: ['Fakers', 'West', 80, [['LeBrawn Jamison', 'SF', 96, 70, 72, ['meteor_jam', 'no_look'], { skin: '#6b3d25', hair: 'bald', hairColor: '#0f0d0c', beard: 'full', headband: '#facc15', build: 'strong' }],
                                 ['Anthony Davies', 'C', 90, 64, 88, ['destroyer', 'lob_threat'], { skin: '#5c3a21', hair: 'buzz', hairColor: '#0f0d0c', beard: 'stubble', build: 'lean' }]]],
    lab: ['Flippers', 'West', 75, [['Kawhi Lennard', 'SF', 89, 86, 64, ['robbery', 'spin_fade'], { skin: '#5c3a21', hair: 'braids', hairColor: '#0f0d0c', beard: 'full', build: 'strong' }]]],
    sac: ['Kinglets', 'West', 74, [["De'Aaron Fax", 'PG', 86, 52, 40, ['lightning_dribble', 'floater'], { skin: '#6b3d25', hair: 'braids', hairColor: '#0f0d0c', build: 'lean' }]]],
    phx: ['Sons', 'West', 78, [['Kevin Durantula', 'SF', 93, 60, 66, ['formless_shot', 'spin_fade'], { skin: '#7a4a2c', hair: 'fade', hairColor: '#0f0d0c', beard: 'stubble', build: 'lean' }],
                               ['Devin Bookshelf', 'SG', 89, 52, 40, ['phantom_shot', 'step_back'], { skin: '#a86b43', hair: 'fade', hairColor: '#0f0d0c', beard: 'goatee' }]]],
    dal: ['Mavrecks', 'West', 81, [['Luka Donkic', 'PG', 96, 46, 50, ['step_back', 'no_look'], { skin: '#f1d0b0', hair: 'flattop', hairColor: '#7c4a1e', beard: 'stubble', build: 'strong' }],
                                   ['Kyrie Irvine', 'PG', 89, 54, 38, ['vanishing_drive', 'jelly_layup'], { skin: '#a86b43', hair: 'fade', hairColor: '#0f0d0c', beard: 'full' }]]],
    hou: ['Pockets', 'West', 74, [['Alperen Sungun', 'C', 85, 50, 72, ['dream_shake', 'no_look'], { skin: '#e8c19a', hair: 'buzz', hairColor: '#3b2416', build: 'strong' }]]],
    sas: ['Spurts', 'West', 73, [['Victor Wembanyamba', 'C', 91, 70, 96, ['destroyer', 'sky_three'], { skin: '#4a2a19', hair: 'braids', hairColor: '#0f0d0c', build: 'lean' }]]],
    mem: ['Drizzlies', 'West', 75, [['Ja Moran', 'PG', 89, 50, 40, ['poster_dunk', 'vanishing_drive'], { skin: '#6b3d25', hair: 'fade', hairColor: '#0f0d0c', build: 'lean' }]]],
    nol: ['Pelicants', 'West', 71, [['Zion Williamsburg', 'PF', 88, 44, 62, ['meteor_jam', 'hammer_board'], { skin: '#5c3a21', hair: 'buzz', hairColor: '#0f0d0c', build: 'strong' }]]],
  },
  cityName: { bay: 'Golden State', las: 'Los Angeles', lab: 'Los Angeles', man: 'New York', cap: 'Washington', ind: 'Indiana', min: 'Minnesota', uta: 'Utah', okc: 'Oklahoma City' },   // what goes in front of the nickname
  roleFirst: ['Marcus', 'Devonte', 'Jalen', 'Trey', 'Isaiah', 'Caleb', 'Darnell', 'Nico', 'Andre', 'Terrence', 'Grant', 'Malik', 'Royce', 'Quinton', 'Derrick', 'Kris', 'Elijah', 'Bryce', 'Tobias', 'Jarrett', 'Omari', 'Luca', 'Dorian', 'Kenji'],
  roleLast: ['Okoye', 'Pruitt', 'Haskins', 'Delgado', 'Brantley', 'Ferrell', 'McCrae', 'Vukovic', 'Ashby', 'Tolliver', 'Kessler', 'Abernathy', 'Rowe', 'Strickland', 'Madsen', 'Coulibaly', 'Whitfield', 'Larkin', 'Petrov', 'Sloane', 'Drummond', 'Achterberg', 'Nwosu', 'Gaines'],
};

/* build the league: parody names, playable teams, Summer League squads, star weapons */
(() => {
  const L = NBL_LEAGUE;
  let seed = 91; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, pick = a => a[Math.floor(rnd() * a.length)];
  const used = new Set();
  let lasts = new Set();   // no two teammates share a last name
  const role = () => { let n, l; do { l = pick(L.roleLast); n = pick(L.roleFirst) + ' ' + l; } while (used.has(n) || lasts.has(l)); used.add(n); lasts.add(l); return n; };
  L.stars = {};
  for (const id in L.teams) {
    const T = NBL_TEAMS[id]; if (!T) continue;
    const [nick, conf, rating, stars] = L.teams[id], city = L.cityName[id] || T.city;
    Object.assign(T, { name: `${city} ${nick}`, nick, conf, rating, cityName: city });
    const looks = {}, names = stars.map(st => {
      const [name, pos, ovr, perD, intD, weapons, look] = st;
      PLAYER_WEAPONS[name] = weapons; looks[name] = Object.assign({ outfit: 'jersey', jersey: T.colors[0], trim: T.colors[1] }, look);
      L.stars[name] = { name, team: id, pos, ovr, perD, intD, weapons }; return name;
    });
    lasts = new Set(); const roles = [role(), role(), role(), role()];
    T.stars = names; T.roles = roles;
    LOCAL_TEAMS['nbl_' + id] = { name: T.name, abbr: T.abbr, colors: T.colors, logo: T.logo, rating, conf, roster: names.concat(roles).slice(0, 5), looks,
      star: { name: names[0], perD: stars[0][3], intD: stars[0][4] } };
    // the Summer League squad: two young role players and a two-way guy (the drafted rookie is added on draft night)
    LOCAL_TEAMS['sl_' + id] = { name: `${T.name} Summer League`, abbr: T.abbr, colors: T.colors, logo: T.logo, rating: rating - 14, conf, roster: [roles[2], roles[3], role(), role()],
      star: { name: roles[2], perD: 58, intD: 52 } };
  }
})();
const NBL_IDS = Object.keys(NBL_LEAGUE.teams);
