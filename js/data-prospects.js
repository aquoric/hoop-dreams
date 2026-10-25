/* =====================================================================
   DATA-PROSPECTS.JS — the national class: the top 300 prospects your age (Elite Hoops Network rankings),
   plus 30 just off the list who can break in. Logic: js/rankings.js · numbers: BALANCE.rankings (js/balance.js).

   PROSPECTS[i] = { id, name, pos, home, rank0 (starting rank), ovr0 (Overall at 16), trend (-1..1: rising / falling),
                    weapon (top 40 only), alias: [other spellings used on team rosters] }
   Named prospects are people you meet in the story (Kai, the national team, rival high schools, AAU stars);
   everyone else is generated from a fixed seed, so every career has the same class.
   ===================================================================== */
const PROSPECT_NAMED = [
  // [name, start rank, pos, hometown, trend, alias]
  ['Malachi Vance', 1, 'SF', 'Dallas, TX', .3],
  ['Elias Thorne', 2, 'PF', 'Baltimore, MD', .1],
  ['Kai Sterling', 3, 'PG', 'Westbrook Hills', .55],
  ['Jalen "Jet" Brooks', 8, 'PG', 'Atlanta, GA', .3],
  ['Malik Okafor', 11, 'C', 'Houston, TX', .2],
  ['Darius "D-Train" Holt', 15, 'SF', 'Northgate', .15],
  ['Andre "Dre" Castillo', 18, 'PG', 'Chicago, IL', .25],
  ['Isaiah "Big Ike" Grant', 23, 'C', 'Memphis, TN', .2, ['Isaiah Grant']],
  ['Milo Park', 27, 'SG', 'Seattle, WA', .2],
  ['Theo "Tank" Marsh', 34, 'PF', 'Westbrook Hills', 0],
  ['Javon Reese', 41, 'SG', 'Atlanta, GA', .1],
  ['Dante Ruiz', 47, 'SF', 'Los Angeles, CA', 0],
  ['Amari Price', 55, 'PG', 'Chicago, IL', .1],
  ['Brayden Cole', 62, 'PF', 'Austin, TX', -.1],
  ['Brandon Vale', 70, 'SG', 'Westbrook Hills', -.2],
  ['Chidi Eze', 78, 'C', 'St. Vincent', .15],
  ['Marcus Hale', 87, 'SG', 'Philadelphia, PA', .05],
  ['Jules Okafor', 96, 'SF', 'Westbrook Hills', 0],
  ['Quincy Fields', 110, 'SG', 'Eastview', 0],
  ['Elijah Ross', 124, 'PF', 'Oakmont', .05],
  ['Preston Ames', 138, 'PG', 'Westbrook Hills', -.1],
  ['Cam Rivers', 150, 'SG', 'Mobile, AL', .1],
  ['Tyrese Whitlock', 165, 'SF', 'Detroit, MI', .1],
  ['Deshawn Price', 182, 'PG', 'Riverside', 0],
  ['Luis Ortega', 199, 'PF', 'Phoenix, AZ', 0],
  ['Devin Shaw', 216, 'SG', 'Metro City', -.1],
  ['Pooh Jeter Jr.', 231, 'PG', 'Long Beach, CA', .2],
  ['Tariq "T-Bone" Miles', 262, 'SF', 'Halsey Street', .1],
];
const PROSPECTS = (() => {
  let seed = 0x5eed1e; const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pickR = a => a[Math.floor(R() * a.length)];
  const FIRST = ['Jaylen', 'Marcus', 'DeAndre', 'Tyler', 'Isaiah', 'Caleb', 'Jordan', 'Malik', 'Xavier', 'Elijah', 'Cameron', 'Trey', 'Darius', 'Andre', 'Josiah', 'Micah', 'Nate', 'Jalen', 'Kendrick', 'Aaron',
    'Bryce', 'Camden', 'Dominic', 'Ezra', 'Gavin', 'Hunter', 'Jamal', 'Keon', 'Landon', 'Mason', 'Nico', 'Omari', 'Quentin', 'Reggie', 'Silas', 'Terrence', 'Uriah', 'Victor', 'Wesley', 'Zeke',
    'Amir', 'Bryson', 'Cedric', 'Desmond', 'Emeka', 'Felix', 'Grayson', 'Hakim', 'Jace', 'Khalil', 'Luca', 'Moses', 'Noah', 'Rashad', 'Sincere', 'Tobias', 'Vaughn', 'Xander', 'Yusuf', 'Zion'];
  const LAST = ['Washington', 'Coleman', 'Hayes', 'Bryant', 'Mitchell', 'Carter', 'Simmons', 'Banks', 'Foster', 'Jenkins', 'Tate', 'Howard', 'Pierce', 'Dawson', 'Holloway', 'Reed', 'Sutton', 'Graves', 'Monroe', 'Fletcher',
    'Lyons', 'Booker', 'Wade', 'Harmon', 'Bishop', 'Crawford', 'Dunn', 'Ellison', 'Frazier', 'Gaines', 'Hollins', 'Ingram', 'Jefferson', 'Kemp', 'Lawson', 'McCoy', 'Nash', 'Oduya', 'Parrish', 'Quarles',
    'Rollins', 'Sanders', 'Turner', 'Underwood', 'Vasquez', 'Whitfield', 'Young', 'Zeller', 'Abernathy', 'Battle', 'Chambers', 'Delaney', 'Everett', 'Flowers', 'Gentry', 'Hightower', 'Irving', 'Jordan', 'Kimbrough', 'Lockhart',
    'Mosley', 'Nwosu', 'Oakes', 'Pruitt', 'Ransom', 'Stokes', 'Tolliver', 'Vance', 'Whitaker', 'Yates', 'Adeyemi', 'Boateng', 'Castro', 'Diallo', 'Espinoza', 'Fofana', 'Gutierrez', 'Herrera', 'Ibarra', 'Jimenez'];
  const HOME = ['Atlanta, GA', 'Chicago, IL', 'Houston, TX', 'Los Angeles, CA', 'Philadelphia, PA', 'Baltimore, MD', 'Detroit, MI', 'Memphis, TN', 'New Orleans, LA', 'Oakland, CA', 'Seattle, WA', 'Phoenix, AZ',
    'Dallas, TX', 'Charlotte, NC', 'Indianapolis, IN', 'Milwaukee, WI', 'Minneapolis, MN', 'St. Louis, MO', 'Kansas City, MO', 'Louisville, KY', 'Cleveland, OH', 'Columbus, OH', 'Newark, NJ', 'Brooklyn, NY',
    'The Bronx, NY', 'Boston, MA', 'Richmond, VA', 'Raleigh, NC', 'Birmingham, AL', 'Jackson, MS', 'Little Rock, AR', 'Tulsa, OK', 'Denver, CO', 'Las Vegas, NV', 'Sacramento, CA', 'Portland, OR', 'Miami, FL',
    'Orlando, FL', 'Jacksonville, FL', 'Nashville, TN', 'Gary, IN', 'Flint, MI', 'Camden, NJ', 'Compton, CA', 'Shreveport, LA', 'Savannah, GA', 'Omaha, NE', 'Salt Lake City, UT', 'Albuquerque, NM', 'Buffalo, NY'];
  const POS = ['PG', 'SG', 'SF', 'PF', 'C'];
  const W = Object.keys(typeof WEAPONS !== 'undefined' ? WEAPONS : {}).filter(id => WEAPONS[id] && WEAPONS[id].type !== 'stop');
  const byRank = {}; PROSPECT_NAMED.forEach(n => { byRank[n[1]] = n; });
  const used = new Set(PROSPECT_NAMED.map(n => n[0])), out = [];
  for (let r = 1; r <= 330; r++) {
    const N = byRank[r]; let name;
    if (N) name = N[0]; else { do { name = pickR(FIRST) + ' ' + pickR(LAST); } while (used.has(name)); used.add(name); }
    const tr = N ? N[4] : Math.max(-1, Math.min(1, (R() + R() - 1) * 1.1));
    out.push({ id: 'p' + String(r).padStart(3, '0'), name, pos: N ? N[2] : pickR(POS), home: N ? N[3] : pickR(HOME), rank0: r, ovr0: Math.round(58 - (Math.min(r, 300) / 300) * 18 + (R() - .5) * 2), trend: tr,
      weapon: r <= 40 && W.length ? pickR(W) : null, alias: N && N[5] ? N[5] : [], named: !!N });
  }
  return out;
})();
const PROSPECT_BY_ID = Object.fromEntries(PROSPECTS.map(p => [p.id, p]));
/* roster names → prospect (quotes / nicknames ignored too: 'Isaiah Grant' finds 'Isaiah "Big Ike" Grant') */
const PROSPECT_BY_NAME = (() => { const m = {}, plain = n => n.replace(/"[^"]*"\s*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  PROSPECTS.forEach(p => { m[p.name.toLowerCase()] = p; m[plain(p.name)] = p; p.alias.forEach(a => { m[a.toLowerCase()] = p; }); }); return { get: n => n ? m[String(n).toLowerCase()] || m[plain(String(n))] : null }; })();
