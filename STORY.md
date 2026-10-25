# Hoop Dreams — Story Overhaul Outline

Branch `story-overhaul`. Safety tag `before-story-overhaul` marks the version before this work.
This is the beat-by-beat plan for the whole story, from Chapter 1 to the end. It covers:
- the structure (arcs)
- the fixed setbacks and the climb back after each one
- how each moment is delivered on screen

Dialogue samples follow the house rule: 1–2 punchy sentences per line.

---

## 0. The rules of the story

### Arcs
- Every chapter has **2–4 named arcs**, each built around one goal or conflict. The last arc of a chapter is its climax.
- Each arc opens with an **animated title card**: black screen, a chiptune sting, the name slamming in letter by letter. A one-line goal follows, e.g. *"Goal: win your spot back."*
- **Chapter opening sequence:** a 20–30s chiptune theme over silhouettes of the cast, Kai turning to face you, and the rankings flashing with your number.
  - The opening changes as the story moves: your silhouette sharpens, new rivals appear, your number climbs, and the colors shift by chapter.
- **"Previously…"** plays when you load a save: 3–4 fast cuts of the last big moments, built from your actual flags, with a narrator line on each.
- **"Next time…"** plays at the end of each arc: a quick, cryptic teaser of the next arc, like an anime episode preview.
- **Credits and post-credits:** each chapter's final arc ends with short scrolling credits (the cast and the people you met), then a post-credits cliffhanger scene.
- The current arc name shows **in the hub header and on the save/load screen**, e.g. "Ch. 2 · The JV Arc".

### Fixed setbacks
- Each chapter has lows that **always happen**. How you played decides **how deep the fall goes** (rank drop, morale, who stays loyal) and **how fast you climb back** (what you start the next arc with).
- **The story acknowledges your performance**, so it never feels like cheating. Every setback scene has variants:
  - **You played great and still lost:** *"Thirty-one points. Still lost. That's the part that keeps you up."* The rank drop is smaller and a scout notices.
  - **You played badly:** *"You disappeared when it mattered."* The drop is bigger and the climb back is longer.
- **Foreshadowing before every setback:** Lou coughing, a scout whispering about your attitude, Silk on the phone, the club's checks arriving late.
- **The choice-based failure paths stay as alternate roads, never game overs.** They change where you go next. For example:
  - unscouted → Lincoln
  - no national team invite → the open tryout, or a different summer
  - weak offers → junior college, or the Grind League
  - undrafted → the two-way and overseas road
- The existing early endings stay: the crash, the sneaker flip and playing through the broken foot.

### The climb back (after every big low)
- **A redemption arc with clear goals on screen**, e.g. "Win your spot back · Beat Kai · Crack the top 100 again". The goals show in the hub.
- **An awakening at the end of each low:** your weapon **evolves**, gaining a new tier with a new name, animation and bonus, or a new weapon unlocks. Every setback leaves you stronger.
- **A revenge game against whoever caused the low**, marked with a boxing-poster intro: two portraits, a tale-of-the-tape card, a fight title (e.g. *"HALSEY PARK II: THE RECKONING"*), and a ring-bell sound.
- **The rankings move with all of this:** the fall shows on the list, and so does the climb back.

### Delivery: the cinematic toolkit
- **Major story moments are fully animated sequences, 20–60 seconds long.**
  - Unskippable the first time you see them; skippable on replays and in New Game+.
  - Minor scenes stay quick and skippable.
- **The animation system** extends the current cutscene engine. Characters can:
  - walk, run, fall, kneel, cry, hug and argue (pointing, stepping in)
  - move their hair and clothes (sway with motion and wind)
  - move their lips when talking and blink
  - The ball follows real arcs and bounces.
- **Lighting and weather can change during a scene:** sunset to night, rain starting, lightning, a flickering streetlight.
- **Camera:** wide establishing shots, slow pans, push-ins, quick cuts, extreme close-ups on eyes and hands, over-the-shoulder shots, and Dutch angles at the lows.
- **Inner monologue in matches (Blue Lock style):** at big plays, time freezes and your thoughts slam in as big bold text. Visual metaphors come with it:
  - your eyes glowing
  - puzzle pieces clicking together
  - the court dissolving into a dark void with only you and the defender
- **Manga panel scenes:** panels slide in on a page, with screentones, speed lines and big sound-effect text (SWISH, DOOM, BAM).
- **The lows** drain the screen of color and cut the music. Some end on just rain or a single ball bouncing on an empty court, or one line of white text on black, with faded flashbacks to happier moments.
- **The comebacks** use training montages with music, quick cuts and stat bars filling. Awakening sequences end with the background shattering and your aura bursting out.
- **Kai's point of view:** short scenes of him training alone at night and of Silk pushing him too hard, so the rivalry has depth.
- **Quick-time presses inside cutscenes:** "GET UP" (mash) at your lowest point, "PUSH" (timed) in a montage, "BREATHE" (hold) before a free throw. They're never fail states, but they change one line or one bonus.
- **Music and silence carry the emotion:** chiptune themes per character (Kai's is cold and synthetic, Lou's warm and bluesy), silence before key lines, and a single piano note for the lows.

### Save compatibility
- Old saves keep going from where they are.
- The arc a save is in comes from its current scene (a table maps every scene to its arc).
- Setbacks never apply backwards. If an old save already won the Summer Jam, that history stays, and the next chapter's setbacks still happen as usual.

---

## Chapter 1: Concrete Dreams (summer, age 16)

*Theme: you're nobody. Kai is everybody. One summer to make them know your name.*

### Arc 1: THE HALSEY PARK ARC
**Goal:** prove you belong on your own court.
1. **Opening sequence (first time).** The theme plays over a dawn time-lapse of Halsey Street Courts, a cracked rim and you shooting alone. The title slams in.
2. **Tariq, the block, and Lou watching from the bench.** Lou's first cough is a small beat; nobody notices.
3. **Kai arrives (fully animated, ~30s).** The black SUV pulls up and the crowd parts. A slow-motion walk, a close-up on his eyes, and he spins the ball on one finger. *"Smaller than it looks on the internet."*
4. **The first game vs Kai (the tutorial game).** Win or lose, Kai's last word sticks: *"Ask around about me, Halsey."*
5. **Kai's POV (short):** the SUV ride home. Silk on speakerphone: *"You let a nobody score on you?"* Kai stares out the window.
6. **Next time…** Lou: *"Kid. Six a.m. Don't be late."*

### Arc 2: THE LOU BANKS ARC
**Goal:** get Lou to train you, and learn the game the right way.
1. **Lou's terms (choice):** the respect, snub and why-me branches stay.
2. **The first training session, as a montage.** Lou's drills and a "PUSH" quick-time, with the stat bars filling. Lou's story about his knee plays as a faded-sepia flashback.
3. **Dee Carter at the rec center.** Dee shows you the Elite Hoops Network top 300, and your name is last at #300. This now happens **here, early**, so you can climb before the fall.
4. **Home:** Mom on a double shift and Nia's brand plans. Rent is tight, and you see the late notice on the fridge.
5. **The Summer Jam registration** and the pickup runs at the route courts. Your rank climbs; aim for top 250.
6. **Foreshadowing:** Lou coughs into a napkin and hides it. A scout at the courts whispers, *"Talented. Shoots too much. Attitude?"*
7. **Next time…** A poster of the Summer Jam bracket, with Westbrook Elite circled in red.

### Arc 3: THE SUMMER JAM ARC (climax)
**Goal:** win the Halsey Summer Jam.
1. **Arc title card.** Choose your third man, the street calls and your game plans (as now).
2. **Rounds 1–2,** each game played live in arcade with choice moments. Wins climb you, so you can reach about #200 by the final.
3. **The party night** branch stays: the crash ending, saving Marcus, Kai's secret.
4. **Final morning:** silence and your heartbeat. Lou tapes your ankles.
5. **THE FINAL vs Kai (fixed loss).**
   - It's played live, and you can be up big.
   - **The last play is a cutscene:** Kai crosses you up, you fall, and he hits the shot over you, then stands over you. Fully animated, unskippable the first time, about 40s.
   - **The low:** the color drains, the crowd noise cuts to a ringing silence, and one ball rolls to a stop against your hand.
   - **Rank crash:** the list flashes and your number falls back toward the bottom (to about #280–295, depending on how you played).
   - **If you played great:** *"Thirty points, and the only number anyone saw was his."* Dee still circles your name.
   - **If you played badly:** *"You had him. Then you didn't."* Dee leaves early.
6. **Night, Halsey Street, rain.** One line on black: *"Most people quit here."*
   - The "GET UP" quick-time: mash to stand.
   - Lou is on the bench under the light: *"Good. Now you know what it costs."*
7. **Awakening:** your weapon evolves to tier II (e.g. Ignite Pass → **Ignite Pass II: Overdrive**). The background shatters and your aura bursts.
8. **Scouting (an alternate road, not an ending):**
   - **Played well:** Dee's offer, Westbrook or Lincoln, as now.
   - **Played badly:** Lou makes a call and Dee comes to a workout, or you go unscouted to Lincoln with Tariq.
9. **Credits:** a short chiptune scroll over stills from the summer.
10. **Post-credits:** Kai alone in Westbrook's gym at 2 a.m., shooting until his hands bleed. Silk turns off the lights: *"Again tomorrow."* Kai doesn't move.
- **Marked revenge game:** "HALSEY PARK II" vs Kai, Chapter 2's first rivalry game.

---

## Chapter 2: Varsity Blues (sophomore to senior)

*Theme: nobody hands you anything. Earn every minute, then lose it all and earn it back.*

### Arc 1: THE CUT ARC
**Goal:** make varsity.
1. **Opening sequence, version 2:** your silhouette is sharper, and the rankings show your post-Summer-Jam number.
2. **Tryouts (played).** Brennan or Graves, Brick or Vale.
3. **The cut list (fixed setback, fully animated):**
   - The posted list, your finger running down the names, and yours isn't there. The hallway empties around you.
   - **If you played well:** *"You were the best player in that gym. Sophomores don't start here."* Coach respects you but holds you back.
   - **If you played badly:** *"You played for yourself."*
   - Small rank drop.
4. **Off-court:** Tariq made varsity and you didn't. The tension seeds the falling out later.
5. **Next time…** A JV jersey on a hook, number 00, and Lou's voice: *"Good. Now you're hungry."*

### Arc 2: THE JV ARC
**Goal:** win your spot back and get called up.
1. **The JV grind montage** (music, stat bars, 6 a.m. runs, a "PUSH" quick-time).
2. **Two JV games** (played), plus the redemption goals: average 20, beat the JV rivals, climb back above your Summer Jam rank.
3. **The call-up (awakening):** Coach in the doorway: *"Varsity. Friday."* A new weapon unlocks (from the learnable list).
4. **Revenge game: "HALSEY PARK II"** vs Kai and Westbrook, with the boxing-poster intro.
5. **Kai's POV:** Silk dissecting the film of you scoring on Kai, frame by frame.
6. **Next time…** The Peach Slam logo, and Vince Shark's purple suit.

### Arc 3: THE PEACH SLAM ARC
**Goal:** get seen by the country.
1. **Junior season** (auto-sim stretches and big games as now) and the city playoffs.
2. **Mom's money low:** she gets hurt at work and rent is due. Your choices: night shifts, Lou, Nia's page, or Vince's envelope. The booster scandal path stays.
3. **The falling out with Tariq:** a public argument, fully animated. Arguing animation, pointing, he walks away in the rain. Reconciliation is possible later through your choices.
4. **The Peach Slam** with Lou's AAU team, the Elite 100 camp and Nia's birthday choice.
5. **Recruiting heats up:** coach visits, and your rank climbs toward the top 100.
6. **Next time…** Senior Night banners, and a trainer wrapping an ankle.

### Arc 4: THE STATE ARC (climax)
**Goal:** win the state championship.
1. **Senior season**, with the rivalry rematch vs Kai (a marked revenge game if he beat you last).
2. **Foreshadowing:** Lou's cough gets worse, and he leaves practice early.
3. **Lou steps away (off-court low):** a phone call: Lou is in the hospital and won't be at the state final.
   - A short visit scene: tubes, his hand on yours. *"Don't you dare play for me. Play for you."*
4. **The ankle (fixed setback, fully animated):** the week before the state final, in practice, a sickening roll. The color drains and you hear the sound before you feel it.
   - The diagnosis is a high sprain, out a week, and doubtful for the final.
5. **The fight back:** a rehab montage (ice baths, "PUSH" quick-times).
   - The pills choice stays: take them → the broken-foot ending path. Played clean → you play hurt, with a small penalty.
6. **The state final (played).** At halftime, the cinematic locker-room speech. Lou's voice in your head (a faded flashback to Halsey Park). An inner monologue at the biggest play.
7. **Result:** the final itself can be won or lost (not a fixed setback).
   - **Win:** confetti, and you carry the trophy to Lou's hospital room.
   - **Lose:** *"You gave it everything on one leg."* The scouts write that down.
8. **Graduation and the offers piling up.** The decision waits until after the summer.
9. **Credits,** then **post-credits:** Coach Reyes signs a letter. *"National team. Get him in."*

---

## Interlude: Red, White & Hoops (summer after high school)

*Theme: from the best player in your gym to the twelfth man on the best team in the world.*

### Arc 1: THE SELECTION CAMP ARC
**Goal:** make the twelve.
1. **The invite:**
   - **Ranking cutoff:** top 100 gets an invite.
   - **Below the cutoff:** the open tryout (played).
   - **Failing the tryout:** the alternate road. A summer pro-am against grown men, a smaller rank boost, and Kai's gold on your TV.
2. **Camp:** drills ranked against 17 campers, the dorm, Dre's give-and-go (chemistry), Big Ike's blocks, Scoop's jelly lesson (as now), and King of the Court vs Kai.
3. **Cut days (fully animated board reveal):** at camp you always make the roster.
   - Your place on the board decides your role: rotation, or **the end of the bench**.
4. **Next time…** Riga, flags in the rafters, and you in a warmup jacket, sitting.

### Arc 2: THE WORLD YOUTH ARC (climax)
**Goal:** get on the floor.
1. **Riding the bench (fixed setback):** group stage, quarterfinal and semifinal play as **bench montages**.
   - Towel waving, Kai starring, and your stats reading DNP. Each game is a short sequence, with one 30-second garbage-time cameo.
   - **If you played well in camp:** *"Reyes trusts you. She just doesn't need you yet."*
   - **If you didn't:** *"You're here to watch and learn."*
2. **Kai's POV:** Kai and Silk on a video call after the semifinal. Silk tells him who's watching the final, and Kai hangs up.
3. **The final vs France and Mbaye:** Kai rolls his ankle (a mirror of yours), or the guards foul out.
   - **The one moment:** Reyes: *"You. Now."*
   - Played live: Scoop's voice, the jelly over the seven-footer. Inner monologue, the void, puzzle pieces.
   - **Awakening:** your weapon evolves to tier III, or the jelly evolves.
4. **The podium** (gold, silver or bronze, as now) and the jersey.
5. **Credits,** then **post-credits:** Kai in the airport, alone, watching your highlight on his phone. Silk's text: *"Next time it's you or me."*

---

## Chapter 3: The Next Level (one year: college, overseas or the Grind League)

*Theme: you finally made it somewhere, and the ground disappears again.*

### Arc 1: THE DECISION ARC
1. **The crossroads choice:**
   - **College:** pick from your offers. Weak offers mean junior college (Metro CC) or the Grind League.
   - **Overseas:** pick a club.
   - **Grind League.**
2. **Route intro** as now: signing day, the arrival in a new city, or the bus.

### Arc 2: THE NEW COACH ARC / THE UNPAID ARC / THE STRANDED ARC (the setback)
**College: THE NEW COACH ARC**
- **Foreshadowing:** the coach on the phone in his office, and a booster scandal on the news.
- **Mid-season (fixed):** the coach is fired, live on the TV in the lounge.
- The new coach brings his own guys and benches you: *"I didn't recruit you."*
- **If you played well:** *"Twenty a game, and he still sat you."*
- **Redemption:** practice-squad games against the starters, and the new coach's trust gauge to win back.
- **Revenge game:** your old coach's new school.

**Overseas: THE UNPAID ARC**
- **Foreshadowing:** paychecks arrive late and teammates whisper.
- **Mid-season (fixed):** the club stops paying everyone. A cold apartment, Mom on video asking if you're eating.
- **Redemption:** keep playing for a club that can't pay you, or take a loan move to a smaller club.
- **Revenge game:** the rich club that tried to sign you cheap.

**Grind League: THE STRANDED ARC**
- **Foreshadowing:** front-office people in suits watching practice.
- **Mid-season (fixed):** Ignition's coach is fired and the new coach plays veterans only.
- **Redemption:** prove it in scrimmages and earn minutes back.
- **Revenge game:** the veterans' team.

**Every route:**
- **Weapon Training** with Scoop unlocks after the low (as now). The awakening is a weapon evolution.
- **Kai's POV:** Kai benched by his own coach for the first time. Silk's reaction, from the stands.

### Arc 3: THE MARCH ARC / THE CUP ARC / THE CALL-UP ARC (climax)
- **College:** the conference tournament, March Madness, and the title game (as now).
- **Overseas:** the league playoffs and the Continental Cup.
- **Grind League:** the playoffs and the ten-day NBL call-up.
- **Every route:** a big rivalry showdown with Kai (a marked revenge game), and a top-10 push in the rankings.
- **Off-court:** a falling out with Nia over your brand, the money and her quitting school to manage you. Mended by your choices.
- **Credits,** then **post-credits:** the draft lottery. A GM: *"Projected top five. Kai's projected higher."*

---

## Chapter 4: The Draft (to build later; outline only)

*Theme: you did everything right, and the phone still doesn't ring.*

### Arc 1: THE COMBINE ARC
- Combine events and the leaderboard (feature exists), interviews, and medicals (the ankle comes up).
- **Foreshadowing:** a scout whispers about your attitude, the old ankle and the Summer Jam film.

### Arc 2: THE WORKOUT ARC
- Team workouts, where agent Priya plays teams against each other.
- **Kai's POV:** Silk demands Kai go #1 or refuse to report.
- Your mock-draft position climbs. The Big Board is your rankings tab.

### Arc 3: THE DRAFT NIGHT ARC (climax, fixed setback)
- **The green room (fully animated, 60s):** family at the table, the cameras, the commissioner at the podium.
- **Kai goes before you,** wherever you're projected.
- **The slide:** pick after pick, your phone silent and Mom squeezing your hand. Cut to empty chairs around you.
  - **The depth of the slide depends on how you played:** about 5–10 picks for a great career, out of the first round for a weak one.
  - Undrafted is a choice path that leads to the two-way and overseas road, never an ending.
- **The call:** a team that has wanted you from the start. A chiptune swell, and Mom crying.
- **Awakening:** a new weapon unlocks: **"Chip on the Shoulder"** (bonus vs every team that passed on you).
- **Revenge games:** every team that passed on you becomes a marked game in your rookie season.
- **Credits,** then **post-credits:** Kai's first NBL practice. A veteran star: *"Rookie. Rebounds and water. That's your job."*

---

## Chapter 5: The League (rookie to prime; to build later)

*Theme: the top is lonelier, and it can all be taken in one play.*

### Arc 1: THE ROOKIE WALL ARC (fixed setback)
- Stuck behind a star at your position, with DNPs and garbage time. The star is your mentor and your obstacle.
- **Redemption goals:** earn rotation minutes, and win the rookie revenge games.
- **Awakening:** the star gets hurt, you start, and a 30-point game. Your weapon evolves to tier IV.

### Arc 2: THE BREAKOUT ARC
- All-Star votes, the signature shoe (feature exists), and the rivalry system (feature exists) with Kai, now in the league.
- **Foreshadowing:** a sore knee you hide from the trainers, and Lou's warning echoing: *"Highlight players play three."*

### Arc 3: THE INJURY ARC (fixed setback at your peak)
- **Mid-dunk in a big game, fully animated:** the knee gives, the color drains, and the arena falls silent.
- A season-ending injury and the hospital (Lou's hospital, mirrored). Kai visits, the first time he's ever shown up for you.
- **Rehab:** a long montage of "GET UP" quick-times, flashbacks to Halsey Park, and Lou in the third row.
- **Awakening:** a new style, smarter and slower. A new weapon unlocks.

### Arc 4: THE FIRST FINALS ARC (climax, fixed setback)
- The playoffs run, with Kai's team in the way (a marked revenge series).
- **The Finals:** a fixed loss in Game 7. If you played great: *"Forty-one in a Game 7 loss."*
- **The low:** the confetti falls for someone else, and you sit in the locker room in your jersey for an hour.
- **Credits,** then **post-credits:** Lou, older now, on Halsey Street: *"One more, kid. Go get it."*

---

## Chapter 6: Legacy (the ending; to build later)

### Arc 1: THE RING ARC
- One more season, all the climbs paying off, and the Finals again.
- **Not fixed:** you can win it. A final showdown with Kai, mutual respect, and Silk finally clapping more than once.

### Arc 2: THE HALSEY STREET ARC (finale)
- Your ending is built from your career: rings, rankings, relationships, the road you took.
- Back to Halsey Street to put up nets on the courts, with a kid at #300 on a new list looking up at you.
- **Final credits:** the full cast, your career numbers, and a last shot of Halsey Park at sunset.

---

## What changes in the existing game (Step 2 plan)

**Chapter 1**
- Split it into the three arcs above and move Dee's rankings scene earlier.
- Make the Summer Jam final a fixed loss with a performance-aware scripted last play, the low, the "GET UP" quick-time and Lou's rain scene.
- Add the awakening (weapon evolution), credits, the post-credits scene and Kai's POV scenes.

**Chapter 2**
- Add the sophomore cut and the JV arc (two JV games), the call-up and the revenge game.
- Rework the summer into the Peach Slam arc with the Tariq falling out.
- Add Lou's hospital stay and the fixed ankle injury before the state final.

**Interlude**
- Make the roster at camp and ride the bench (with montages), then the one moment in the final.
- Keep the ranking-cutoff invite and the tryout as alternate roads.

**Chapter 3**
- Add the mid-season setback per route (coach fired, club unpaid, coach replaced) with redemption goals and revenge games.
- Add the Nia falling out.

**Chapters 4–6**
- Story data stubs with the arc structure, title cards and setback scenes outlined. The "coming soon" screen shows the "Next time…" teaser.

**New systems**
- arcs and title cards, the evolving chapter opening, "Previously…" and "Next time…", credits and post-credits
- the full animation upgrade (walk, run, fall, cry, hug, argue, hair and cloth, lip sync, ball physics, lighting and weather timelines), the cinematic camera and first-view unskippable scenes
- in-match inner monologue, manga panels, quick-time presses, revenge-game posters and weapon evolution tiers

**Saves**
- An arc table maps old scenes to arcs, and old flags carry over.
- Old saves already past a new setback don't get it retroactively. They continue at the next beat.
