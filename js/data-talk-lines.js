/* =====================================================================
   DATA-TALK-LINES.JS — the line pools for in-game and pre-game conversations (js/match.js talk()).
   Story conversations keep their own scripts (TALK.scripts in js/data-talk.js and the chapter files).

   TALK.lines[character] = { open: [...], push: [...], close: [...], base?: 'coach' }
     A conversation is open → push (→ close): 2–3 of their lines; you answer each one.
     close lines can carry mood: 'good' (default) or 'bad' — the one that matches how the talk went is used.
     open / push lines are EXCHANGES: { t, if, r: { style: your answer, ... } }. Your answers are written for that
     line, so they always answer what was just said; 3 of them are offered (at least one this person likes and one
     he doesn't, see TALK.personalities[...].styles). close lines are { t, if } (or a string).
     base: also use the generic pool of that id (stage-neutral lines) when the character's own lines run out.
   A line is only picked when every condition in `if` holds — and every open / push line names its topic:
     topic: 'pre' (before tip-off) · 'run' (timeout: they just went on a run) · 'cold' (you've had three bad trips in a row)
            'half' (halftime speech) · 'clutch' (late, close game) · 'minutes' (you come off the bench and just had a good stretch)
            'call' (the ref, after a blocking foul on you) · 'trash' (a rival at a dead ball)
     stage: 'street' | 'hs' | 'usa' | 'college' | 'overseas' | 'grind' | 'draft' | 'pro' (one or a list)
     score: 'up' | 'down' | 'tied' | 'bigup' | 'bigdown' | 'close'      (from YOUR side)
     ev:    what JUST happened (the last two moments): 'ankles' (you crossed him up) · 'he_hot' (he scored three straight)
            'dunked_on' (you dunked on him) · 'got_dunked' · 'blocked' (you blocked him) · 'missed_ft' · 'me_hot' · 'me_cold'
     when:  'early' | 'mid' | 'late'      vs: 'first' | 'won' | 'lost' | 'many'   (your history with this opponent)
     rank:  'below' (he's ranked above you) | 'above'      flag / notFlag: story flags      role: your season role
   Placeholders: {first} {last} {num} {star} {opp} {us} {score} {hs} {games} {myrank} {theirrank} {in} ("in the class" / "in the NBL")
   No line repeats until every line of that pool has been used (saved per career: state.talkSeen).
   Every line: 1–2 punchy sentences that make sense on their own.
   ===================================================================== */
const HS_ERA = ['street', 'hs', 'usa'];   // before college: the class rankings, the followers, Silk in row two
TALK.lines = {
  /* ------------------------------ COACHES ------------------------------ */
  coach: {   // any coach without his own voice (and the follow-ups every coach can use): stage-neutral, plain basketball
    open: [
      { t: 'Big one tonight, {first}. {star} is their guy. Ready for him?', if: { topic: 'pre' },
        r: { effort: 'Ready. Put me on him from the tip.', honest: 'Nervous. That usually means I\'m ready.', team: 'Ready. We guard him with all five, not just me.', ego: 'He should be asking if he\'s ready for me.', excuse: 'Depends how the refs call it.' } },
      { t: 'They\'re going to be physical early. How do you handle it?', if: { topic: 'pre' },
        r: { effort: 'Hit first. Every box-out, every screen.', team: 'Move the ball. Physical teams hate chasing it.', honest: 'Last time I got rattled. Not tonight.', ego: 'They can try. Nobody pushes me around.', joke: 'Bring an extra mouthguard for them.' } },
      { t: 'Timeout. That run killed us. What\'s going wrong out there?', if: { topic: 'run' },
        r: { honest: 'We stopped talking on defense. Me too.', team: 'We\'re settling for jumpers. Attack the paint and move it.', effort: 'Put me on their hot hand. I\'ll slow him down.', ego: 'Nothing a few of my buckets won\'t fix.', excuse: 'The refs are letting them hold everything.' } },
      { t: 'They just ripped off a run. I need somebody to stop the bleeding. Who?', if: { topic: 'run' },
        r: { effort: 'Me. Next stop is mine.', team: 'Run something for the bigs. Get an easy one inside.', honest: 'I can, but I\'ve been forcing it. I\'ll get a good shot.', ego: 'Give me the ball and get out of the way.', joke: 'Can we call a timeout on their shooter?' } },
      { t: 'That run put us down {score}. Talk to me.', if: { topic: 'run', score: 'down' },
        r: { honest: 'We\'re rushing. Slow it down and get a good look.', team: 'Swing it side to side. They can\'t rotate that fast.', effort: 'I\'ll pick up full court. Make them work.', ego: 'I got us here, I\'ll get us out. Ball, please.', excuse: 'We haven\'t gotten one call all night.' } },
      { t: 'We\'re still up {score}, but that run woke them up. What now?', if: { topic: 'run', score: 'up' },
        r: { team: 'Get back to what built the lead. Move the ball.', effort: 'First stop out of this timeout. That kills it.', honest: 'We got lazy with the lead. I did too.', ego: 'Relax, Coach. We\'re still winning.', joke: 'Tell them to stop. Politely.' } },
      { t: 'That\'s three bad trips in a row with you in the middle of all of them. What\'s happening?', if: { topic: 'cold' },
        r: { honest: 'I\'m forcing it. I\'ll make the simple play.', respect: 'You tell me, Coach. What do you see?', team: 'I\'ll move it. Somebody else is open.', excuse: 'They keep fouling me and nobody calls it.', argue: 'Those were good looks. They didn\'t fall.' } },
      { t: 'You\'re pressing, {first}. I can see it from here. Talk.', if: { topic: 'cold' },
        r: { honest: 'Yeah. I want it too bad right now.', effort: 'Then I\'ll get it back on defense first.', respect: 'Okay. What do I fix?', ego: 'I\'m not pressing. I\'m just due.', argue: 'I\'m not the only one out there.' } },
      { t: 'Sit down. We\'re down {score} at the half. Give me one adjustment.', if: { topic: 'half', score: 'down' },
        r: { team: 'Run them off screens. Our shooters are open on the switch.', honest: 'I\'ve been ball-watching on defense. That\'s first.', effort: 'Full-court pressure. Make them tired.', ego: 'Give me the ball more.', excuse: 'Second half, maybe the refs wake up.' } },
      { t: 'We\'re up {score} at the half. Teams lose leads in the third quarter. Why?', if: { topic: 'half', score: 'up' },
        r: { honest: 'They stop doing what built the lead.', team: 'They stop moving the ball and start hunting shots.', effort: 'They take the first five minutes off. We won\'t.', ego: 'Not with me out there.', joke: 'Too many halftime orange slices.' } },
      { t: 'Halftime. Give me one thing we do better in the second half.', if: { topic: 'half' },
        r: { team: 'Move the ball. Their help is slow.', effort: 'Win the first five minutes. Every loose ball.', honest: 'Defensive rebounding. They\'re getting second shots.', ego: 'Get me the ball more.', excuse: 'Hope the refs see it better.' } },
      { t: 'Close game at the half. One thing we do better this half. Go.', if: { topic: 'half', score: 'close' },
        r: { team: 'Get stops and run. Easy points.', effort: 'Win every loose ball.', honest: 'Rebounding. We\'re giving them second shots.', ego: 'Feed the hot hand. That\'s me.', excuse: 'Hope they miss, honestly.' } },
      { t: 'Last timeout, it\'s {score}. Who takes the shot?', if: { topic: 'clutch' },
        r: { respect: 'Whoever you draw it up for. I\'ll make it work.', honest: 'Me. I want it, and I\'ve got the matchup.', team: 'Me at the top. If they double, the corner\'s open.', ego: 'Is that a real question?', joke: 'Rock, paper, scissors? No? Me, then.' } },
      { t: 'It\'s {score} and the clock\'s dying. What do you see out there?', if: { topic: 'clutch' },
        r: { team: 'They switch everything. Screen, slip, I\'m open.', honest: 'Their guy\'s tired. Make him guard me.', effort: 'A stop first. Then we win it.', ego: 'I see a game-winner.', excuse: 'I see refs swallowing their whistles.' } },
      { t: 'Good stretch off the bench. You want more minutes? Tell me why.', if: { topic: 'minutes' },
        r: { effort: 'Because I\'ll guard whoever you point at.', team: 'The second unit moves the ball when I\'m out there.', honest: 'Because I\'m playing the right way right now.', ego: 'Because I\'m better than the guy starting.', excuse: 'I\'d be even better if I got real minutes.' } },
      { t: 'Two good trips in a row. Keep it up and you stay in. What\'s working?', if: { topic: 'minutes' },
        r: { honest: 'I\'m taking what they give me.', team: 'I\'m finding the open man early.', effort: 'I\'m outworking my guy.', ego: 'Me. I\'m what\'s working.', joke: 'My legs finally woke up.' } },
    ],
    push: [
      { t: 'And if {star} takes that away?', if: { topic: ['pre', 'run', 'clutch'] },
        r: { team: 'Then somebody else is open. I\'ll find him.', honest: 'Then I go to my counter. I\'ve been saving it.', effort: 'Then I work harder for the next one.', ego: 'He won\'t.', excuse: 'Then it\'s on the play call.' } },
      { t: 'Everybody says that. What are you going to DO?', if: { topic: ['run', 'cold', 'half'] },
        r: { effort: 'Win the next loose ball. Watch.', honest: 'Make the simple play, three trips in a row.', team: 'Set screens until somebody gets loose.', ego: 'Score.', argue: 'I just told you.' } },
      { t: 'You sure about that? Everybody\'s sure in a timeout.', if: { topic: 'clutch' },
        r: { honest: 'Sure enough to own it if it fails.', respect: 'If you see something better, I\'ll run it.', effort: 'I\'ve worked on this exact shot all year.', ego: 'I\'m always sure.', joke: 'Ninety percent sure. That\'s a lot.' } },
      { t: 'What about defense? You gave up easy ones.', if: { topic: ['cold', 'half', 'run'] },
        r: { honest: 'Yeah. I got lazy on the closeouts.', effort: 'Put me on the ball. I\'ll pick up full court.', team: 'We need to talk on switches. I\'ll start it.', excuse: 'Our bigs aren\'t helping.', argue: 'My guy didn\'t score. Look at the other guys.' } },
      { t: 'If you get the ball next trip, what are you looking for?', if: { topic: ['run', 'cold', 'clutch', 'minutes'] },
        r: { team: 'Attack, draw two, and kick it.', honest: 'A shot I\'ve made a thousand times. Nothing fancy.', effort: 'Contact. I\'ll get to the line.', ego: 'The rim. Nobody stops me.', joke: 'The ball, first.' } },
      { t: 'Last thing. Can you keep your head if it goes wrong?', if: { topic: ['pre', 'half'] },
        r: { honest: 'I\'m working on it. Tonight I will.', respect: 'Yes, Coach. Next play every time.', effort: 'A miss just means I run back harder.', ego: 'It won\'t go wrong.', argue: 'Why does everybody ask me that?' } },
    ],
    close: [
      { t: 'Alright. Go get it.' }, { t: 'Fine. Show me on the floor.' }, { t: 'Okay. Don\'t make me regret it.' }, { t: 'Good. Now play like it.' },
      { t: 'Let\'s go. Next trip, you show me.', if: { topic: ['run', 'cold', 'minutes'] } },
      { t: 'Alright. One possession at a time.', if: { topic: 'clutch' } },
      { t: 'Good. Let\'s go win the half.', if: { topic: 'half' } },
      { t: 'We\'ll talk about that after the game. Go.', mood: 'bad' }, { t: 'Just play. Go.', mood: 'bad' }, { t: 'I\'ve heard enough. Get out there.', mood: 'bad' },
    ],
  },
  lou: {   // gruff ex-pro, three seasons in the league before his knee went. Calls you "kid". Chapter 1's coach (the Summer Jam)
    base: 'coach',
    open: [
      { t: 'Big crowd today, kid. They came to see if you\'re for real. Are you?', if: { topic: 'pre' },
        r: { honest: 'I don\'t know yet. I\'m about to find out.', effort: 'I\'ll outwork whoever they put on me.', team: 'Tariq and me, we\'re for real together.', ego: 'They\'ll leave knowing my name.', excuse: 'If the court\'s not wet, maybe.' } },
      { t: 'Kai Sterling\'s on the other side. You scared?', if: { topic: 'pre', star: 'kai' },
        r: { honest: 'A little. I\'m playing anyway.', effort: 'Scared means I\'ll guard him harder.', ego: 'He should be scared.', respect: 'You played guys like him. What do I do?', joke: 'Scared of his followers, maybe.' } },
      { t: 'You\'re playing scared, kid, and the whole park can see it. Why?', if: { topic: 'half', score: 'down' },
        r: { honest: 'I keep looking at the score instead of my man.', effort: 'Not anymore. Watch the first possession.', respect: 'Tell me what you see, Lou.', excuse: 'My shoes are slipping on this court.', ego: 'I\'m not scared. My shots just aren\'t falling.' } },
      { t: 'Halfway there and we\'re {score}. What did you learn about their best guy?', if: { topic: 'half' },
        r: { honest: 'He wants his right hand every time.', team: 'He doesn\'t help on defense. Tariq\'s open all day.', effort: 'He gets tired. I\'m going to run him.', ego: 'That he can\'t guard me.', joke: 'That he really likes his headband.' } },
      { t: 'Last possession, kid. This is the part they remember. Who takes it?', if: { topic: 'clutch' },
        r: { honest: 'Me. I want it.', team: 'Me, and if they collapse, Tariq\'s in the corner.', respect: 'You tell me, Lou.', ego: 'You already know.', excuse: 'Whoever, I just don\'t want to miss.' } },
      { t: 'They just went on a run and you put your head down. Pick it up. What\'s the fix?', if: { topic: 'run' },
        r: { honest: 'Stop hunting my shot. Get stops first.', effort: 'I\'ll guard their best guy myself.', team: 'Get Tariq going. He\'s open every time.', excuse: 'They\'re calling fouls on everything.', ego: 'Give me three straight. I\'ll end it.' } },
      { t: 'That\'s three bad ones in a row, kid. You\'re forcing it. Why?', if: { topic: 'cold' },
        r: { honest: 'I want it too bad.', respect: 'Okay. What would you do?', team: 'I\'ll move it. Somebody else gets a turn.', excuse: 'The rim\'s bent. I swear.', argue: 'I\'m the only one even shooting.' } },
    ],
    push: [
      { t: 'Words are cheap on Halsey Street. Show me what you mean.', if: { topic: ['pre', 'half', 'cold', 'run'] },
        r: { effort: 'Next possession. Watch my feet, not my mouth.', honest: 'Fair. I\'ll stop talking and play.', team: 'First play, I set the screen for Tariq.', ego: 'Watch this, then.', argue: 'I am showing you.' } },
      { t: 'You sound like me at seventeen. That\'s not a compliment. Try again.', if: { topic: ['cold', 'half', 'run'] },
        r: { honest: 'Okay. I\'m rushing everything.', respect: 'What did you wish you did at seventeen?', effort: 'Then I\'ll play like you at twenty-five.', excuse: 'You weren\'t playing on this court.', ego: 'You were pretty good at seventeen.' } },
    ],
    close: [{ t: 'Fine. Go get it.' }, { t: 'Don\'t make me regret this, kid.' }, { t: 'That\'s the most sense you\'ve made all day. Go.' }, { t: 'Hmph. Go. And think next time.', mood: 'bad' }],
  },
  brennan: {   // 31 years at Lincoln, old-school, program first. Calls you "son". Chapter 2 (Lincoln)
    base: 'coach',
    open: [
      { t: 'Big one tonight, son. Thirty-one years and I still get nervous. Do you?', if: { topic: 'pre' },
        r: { honest: 'Yes, sir. I\'m using it.', respect: 'If you still do, I\'m in good company.', effort: 'Nerves go away after the first stop.', ego: 'No. I was built for this.', joke: 'Only about the bus food.' } },
      { t: 'Son, we\'re down {score} and nobody in this locker room has quit on me yet. Don\'t be the first. What do we fix?', if: { topic: 'half', score: 'down' },
        r: { respect: 'Whatever you see, Coach. I\'ll run it.', team: 'Get the ball inside. They have nobody tall.', effort: 'Defense. I\'ll take their best guy.', ego: 'Run everything through me.', excuse: 'The refs are home-cooking us.' } },
      { t: 'Up {score} at the half. That\'s when Lincoln teams used to get comfortable. Not this one. Right?', if: { topic: 'half', score: 'up' },
        r: { respect: 'Right, Coach. First five minutes are ours.', effort: 'We\'ll come out harder than they do.', team: 'We keep sharing it. That\'s why we\'re up.', ego: 'Not with me out there.', joke: 'Comfortable? These benches?' } },
      { t: 'Lincoln has waited a long time for a possession like this. Who takes it?', if: { topic: 'clutch' },
        r: { respect: 'Whoever you call, Coach.', honest: 'Me, Coach. I want it.', team: 'Me, with a screen. If they trap, the corner\'s open.', ego: 'Me. Obviously.', joke: 'You, Coach. Thirty-one years of practice.' } },
      { t: 'That\'s not Lincoln basketball, son. Three bad trips in a row. Explain yourself.', if: { topic: 'cold' },
        r: { respect: 'You\'re right, Coach. I\'ll run the offense.', honest: 'I got selfish. It won\'t happen again.', effort: 'I\'ll make up for it on defense.', argue: 'I\'m the only one taking shots.', excuse: 'They\'re hacking me every time.' } },
      { t: 'They just ran off a streak in our gym. Somebody has to answer. Is it you?', if: { topic: 'run' },
        r: { respect: 'If you want it to be, Coach.', effort: 'Yes, sir. I\'ll start with a stop.', team: 'All of us. Get the ball moving again.', ego: 'It\'s always me.', excuse: 'The refs gave them half of that run.' } },
    ],
    push: [
      { t: 'In 1994 a kid said the same thing to me. He ran laps. Say it like you mean it.', if: { topic: ['half', 'cold', 'run'] },
        r: { respect: 'Yes, sir. I mean it.', effort: 'I\'ll run the laps after the game. Right now I\'ll run the floor.', honest: 'Okay. I mean it this time.', ego: 'That kid wasn\'t me.', argue: 'Can we just play?' } },
      { t: 'The program is bigger than any one of us. Do you believe that?', if: { topic: ['pre', 'half', 'clutch'] },
        r: { respect: 'Yes, Coach.', team: 'That\'s why I trust the guys next to me.', honest: 'I\'m starting to.', ego: 'Tonight the program is me.', joke: 'The program is bigger than my shoes, and they\'re thirteens.' } },
    ],
    close: [{ t: 'Alright, son. Go earn it.' }, { t: 'That\'s a Lincoln answer. Go.' }, { t: 'Good. Now play like it.' }, { t: 'Fine. Don\'t embarrass the jersey.', mood: 'bad' }],
  },
  graves: {   // Westbrook's coach. Cold, clipped, sets and numbers. Chapter 2 (Westbrook)
    base: 'coach',
    open: [
      { t: 'Our scouting report says {star} goes right ninety percent of the time. What do you do with that?', if: { topic: 'pre' },
        r: { team: 'Shade him left and send help from the right.', honest: 'Make him go left and live with the ten percent.', effort: 'Sit on his right hand all night.', ego: 'Doesn\'t matter. He can\'t score on me either way.', joke: 'Ask him to go left nicely.' } },
      { t: 'We run sets at Westbrook. Down {score} means we stopped running them. Who stopped?', if: { topic: 'half', score: 'down' },
        r: { honest: 'Me. I freelanced.', team: 'All of us. We\'ll run them.', respect: 'Tell me which set, Coach.', ego: 'The sets don\'t work. I do.', argue: 'Not me. Look at the others.' } },
      { t: 'Up {score} at the half. Do not get creative. Understand?', if: { topic: 'half', score: 'up' },
        r: { respect: 'Understood.', team: 'Run the sets, share it, keep the lead.', honest: 'Got it. No hero ball.', ego: 'Creative is how we got up.', joke: 'Can I get a little creative?' } },
      { t: 'One possession. Convince me it should run through you.', if: { topic: 'clutch' },
        r: { team: 'Run me off the stagger. If they switch, our big has a mismatch.', honest: 'I\'m six of eight tonight. Ride it.', respect: 'Run the set you trust. I\'ll execute.', ego: 'Because I\'m the best player here.', excuse: 'Because nobody else wants it.' } },
      { t: 'Three bad possessions in a row. The film will be honest with you. Be honest now.', if: { topic: 'cold' },
        r: { honest: 'I forced all three.', respect: 'I left the set. I\'ll stay in it.', team: 'I\'ll move it to the open man.', excuse: 'They were good looks that rimmed out.', argue: 'The set wasn\'t working.' } },
      { t: 'That run is a breakdown. Name it.', if: { topic: 'run' },
        r: { honest: 'We stopped getting back in transition.', team: 'We quit screening. Nobody\'s getting open.', effort: 'I\'ll fix transition myself. Every time.', ego: 'They got lucky.', excuse: 'Nobody\'s calling their travels.' } },
    ],
    push: [
      { t: 'That\'s a feeling. I asked for a reason.', if: { topic: ['half', 'cold', 'run', 'clutch'] },
        r: { honest: 'Their help comes late from the weak side.', team: 'They overplay passes. The backdoor is open.', respect: 'Fair. Give me ten seconds to look.', ego: 'The reason is I\'m better.', argue: 'Feelings win games too.' } },
      { t: 'Again. Shorter.', if: { topic: ['pre', 'half', 'cold', 'clutch'] },
        r: { honest: 'Stay in the set.', team: 'Move it. Find the mismatch.', respect: 'Execute.', ego: 'Give me the ball.', joke: 'Ball. Hoop.' } },
    ],
    close: [{ t: 'Acceptable. Go.' }, { t: 'Fine. Run it as drawn.' }, { t: 'Wrong answers. Run it as drawn anyway.', mood: 'bad' }],
  },
  pcoach: {   // Coach Marv Dellinger, the pros: thirty years, three rings as an assistant
    base: 'coach',
    open: [
      { t: 'Eighty-two games, and this is the one on everybody\'s calendar. You ready for {star}?', if: { topic: 'pre', stage: 'pro' },
        r: { effort: 'Give me the assignment. I want him.', honest: 'Ready. He\'s going to score some. I\'ll make it hard.', team: 'We load up on him and make the others beat us.', ego: 'He\'s the one who should be worried.', excuse: 'Depends who\'s reffing.' } },
      { t: 'This league is a game of runs. They just had theirs. What\'s ours?', if: { topic: 'run', stage: 'pro' },
        r: { team: 'Pick-and-roll until they show us a coverage they can\'t hold.', effort: 'Turn up the pressure. Make them play in the half court.', honest: 'Get stops first. We\'re trying to answer every bucket with a three.', ego: 'Me in isolation.', excuse: 'Our run starts when the whistles even out.' } },
    ],
    close: [{ t: 'Alright. Go to work.' }, { t: 'Good. Let\'s see it.' }],
  },
  reyes: { base: 'coach', open: [], push: [], close: [{ t: 'Good. Now show me.' }, { t: 'Go. Play for the jersey.' }] },
  ccoach: { base: 'coach', open: [], push: [], close: [{ t: 'Go. Play forty minutes.' }, { t: 'Good. Now go get it.' }] },
  vance: { base: 'coach', open: [], push: [], close: [{ t: 'We\'ll see. Go.' }, { t: 'Fine. Earn it.' }] },
  ocoach: { base: 'coach', open: [], push: [], close: [{ t: 'Okay. Play.' }, { t: 'Good. Go.' }] },
  gcoach: { base: 'coach', open: [], push: [], close: [{ t: 'Go get paid.' }, { t: 'Alright. Go.' }] },

  /* ------------------------------ REFEREES (always right after a blocking foul on you) ------------------------------ */
  ref: {   // every ref can use these
    open: [
      { t: 'Something to say about that block, number {num}? Keep it respectful.', if: { topic: 'call' },
        r: { calm: 'Just a question. I thought I was set.', specific: 'My feet were set before he left the floor.', respect: 'Okay. Can you tell me what you saw?', argue: 'That was a charge all day!', sarcasm: 'Sure. Great call.', insult: 'Were you even looking?' } },
      { t: 'You had a foot moving on that one. That\'s a block.', if: { topic: 'call' },
        r: { specific: 'I was sliding over, but I was set when he went up.', calm: 'Okay. I\'ll get there earlier.', respect: 'Thanks for explaining it.', argue: 'I was planted!', sarcasm: 'Moving? I was a statue.', insult: 'Get some glasses.' } },
    ],
    push: [
      { t: 'I saw it from the baseline. You were still sliding.', if: { topic: 'call' },
        r: { specific: 'Then watch the next one. I\'ll be set early.', calm: 'Fair enough.', respect: 'You had the better angle.', argue: 'No way I was sliding!', sarcasm: 'The baseline must be far away.', insult: 'You saw nothing.' } },
      { t: 'You want to keep talking, or play the next possession?', if: { topic: 'call' },
        r: { calm: 'Play. Thanks for hearing me out.', respect: 'Play. Appreciate it.', specific: 'Play. Just watch his off arm.', argue: 'I want the call fixed!', sarcasm: 'Can I do both?', insult: 'Whatever. You\'ll miss the next one too.' } },
    ],
    close: [{ t: 'I\'ll watch it. Play.' }, { t: 'Fair. Back to work.' }, { t: 'We\'re done here.', mood: 'bad' }, { t: 'Walk away. Now.', mood: 'bad' }],
  },
  ref_dawkins: {   // by the book, quotes rules
    base: 'ref',
    open: [{ t: 'Rule ten, section one: the defender has to be set. You weren\'t. Questions?', if: { topic: 'call' },
      r: { specific: 'I was set outside the restricted area. Check the arc.', calm: 'No. I\'ll be set earlier.', respect: 'You know the book. Thanks.', argue: 'I was set!', sarcasm: 'Want to read me the whole book?', insult: 'You don\'t know the rule.' } }],
    push: [{ t: 'Hands at your sides, number {num}. Then finish your point.', if: { topic: 'call' },
      r: { calm: 'Sorry. Just asking you to watch my feet.', specific: 'His off arm hooked me first.', respect: 'Okay. That\'s all.', argue: 'My point is it\'s a terrible call!', sarcasm: 'Yes, sir, Mister Rulebook.' } }],
    close: [{ t: 'Go play, {num}.' }, { t: 'Noted. Play on.' }],
  },
  ref_vance: {   // short fuse
    base: 'ref',
    open: [{ t: 'Don\'t start with me about that block. You got ten seconds.', if: { topic: 'call' },
      r: { calm: 'Okay. Just watch my feet next time.', respect: 'Fair. Thanks for listening.', specific: 'I was outside the circle.', argue: 'It was a charge and you know it!', sarcasm: 'Ten whole seconds?', insult: 'You\'re the problem tonight.' } }],
    push: [{ t: 'Watch the tone. One more and it costs you.', if: { topic: 'call' },
      r: { calm: 'Understood. I\'m done.', respect: 'My bad. Won\'t happen again.', specific: 'I\'m just saying he lowered his shoulder.', argue: 'Then call it right!', sarcasm: 'Ooh. Scary.' } }],
    close: [{ t: 'Alright. Walk away.' }, { t: 'Fine. Play ball.' }],
  },
  ref_ortiz: {   // veteran, dry humor, respects players who know the rules
    base: 'ref',
    open: [{ t: 'Thirty years with a whistle. Go ahead, tell me why that wasn\'t a block.', if: { topic: 'call' },
      r: { specific: 'I had position before he started his move. That\'s a charge.', calm: 'I thought I beat him there. Maybe not.', respect: 'You\'ve seen more than me. What did I miss?', argue: 'Because it was a charge!', sarcasm: 'Thirty years and you missed that?', insult: 'Thirty years too many.' } }],
    push: [{ t: 'Close. Wrong rule, though. You can\'t slide into him.', if: { topic: 'call' },
      r: { specific: 'Got it. Set early, then stay vertical.', respect: 'Good to know. Thanks.', calm: 'Okay. Lesson learned.', argue: 'I wasn\'t sliding!', sarcasm: 'Thanks for the lecture.' } }],
    close: [{ t: 'Okay, scholar. Play.' }, { t: 'Walk away while you\'re ahead.' }],
  },

  /* ------------------------------ RIVALS ------------------------------ */
  rival: {   // any opponent's best player (and every rival's fallback): plain, situation-first trash talk
    open: [
      { t: 'You\'re guarding me tonight? Tell your coach thanks.', if: { topic: 'pre' },
        r: { calm: 'Good. I came to play.', brag: 'Check the box score later.', joke: 'Warm up first, you look stiff.', humble: 'Yeah. Go easy on me.', needle: 'Funny, I asked for you.', insult: 'You\'ll be crying by halftime.' } },
      { t: 'Lucky crossover. Do it again and see what happens.', if: { topic: 'trash', ev: 'ankles' },
        r: { brag: 'I will. Same move, same result.', calm: 'Okay. Next trip.', joke: 'You okay down there? You fell kind of hard.', humble: 'I got lucky. You\'re quick.', needle: 'Everybody in the gym saw you fall.', insult: 'Stay on the floor next time.' } },
      { t: 'That\'s three in a row on you. You can\'t guard me.', if: { topic: 'trash', ev: 'he_hot' },
        r: { calm: 'Hot streaks end. I\'m still here.', brag: 'Shoot the next one over me. Try.', joke: 'Save some for the second half.', humble: 'You\'re cooking. I need to fix it.', needle: 'Your team\'s still {score}.', insult: 'Enjoy it. It\'s the best night you\'ll have.' } },
      { t: 'You\'re {myrank} and I\'m {theirrank} {in}. The list knows.', if: { topic: ['pre', 'trash'], rank: 'below' },
        r: { calm: 'Lists don\'t play defense.', brag: 'Tonight I take your spot.', joke: 'You print it out and carry it around?', humble: 'You earned it. I\'m coming for it.', needle: 'Then why are you talking to me?' } },
      { t: 'Ranked above me? Not after tonight.', if: { topic: ['pre', 'trash'], rank: 'above' },
        r: { calm: 'Then go take it.', brag: 'I\'m staying up there.', joke: 'You can visit.', humble: 'It\'s just a number.', needle: 'You keep checking, huh?' } },
      { t: 'You\'re up {score}? It\'s early.', if: { topic: 'trash', score: 'up', when: 'early' },
        r: { calm: 'It\'ll stay early all night.', brag: 'Wait till I warm up.', joke: 'Early for you, maybe.', humble: 'Long way to go, you\'re right.', needle: 'Your coach looks worried.' } },
      { t: 'Down {score}. This is where you get quiet.', if: { topic: 'trash', score: 'down' },
        r: { calm: 'Scoreboard doesn\'t care who\'s quiet.', brag: 'This is where I come back.', joke: 'I\'m always quiet. You\'re loud enough for both of us.', humble: 'You\'re playing great. We\'ll see.', needle: 'You only talk when you\'re winning.' } },
    ],
    push: [
      { t: 'Keep talking. It doesn\'t bother me.', if: { topic: ['pre', 'trash'] },
        r: { needle: 'Then why are your ears red?', calm: 'Good. Me neither.', brag: 'It will in the fourth.', joke: 'It bothers your teammates.', humble: 'Fair enough.' } },
      { t: 'You and me, all night. No switching.', if: { topic: ['pre', 'trash'] },
        r: { calm: 'I\'ll be there.', brag: 'Bring help.', joke: 'Can I bring a friend?', humble: 'Okay.', needle: 'Your coach already wants to switch.' } },
    ],
    close: [{ t: 'Ball\'s in. Let\'s go.' }, { t: 'We\'ll see at the buzzer.' }, { t: 'Get out of my face.' }],
  },
  kai: {   // Kai Sterling: #1 in your class, Silk Sterling's son, lives on his phone. Calls you "Halsey"
    base: 'rival',
    open: [
      { t: 'Halsey. I\'ve watched your film. It was short.', if: { topic: 'pre', vs: 'first', stage: HS_ERA },
        r: { needle: 'Funny. Everybody\'s seen your dad\'s film.', calm: 'Watch the live version tonight.', brag: 'Make some room on the tape.', humble: 'There\'s not much yet.', joke: 'Did you like the soundtrack?' } },
      { t: 'You still think about Halsey Park? Because I do. Every night.', if: { topic: 'pre', flag: 'beat_kai' },
        r: { needle: 'I bet your dad does too.', calm: 'I don\'t. I think about tonight.', brag: 'Good. Remember it again in two hours.', humble: 'You almost had me.', joke: 'You should get some sleep.' } },
      { t: 'Last time I sent you home. Tonight I\'m filming it.', if: { topic: 'pre', vs: 'lost' },
        r: { calm: 'Film the whole thing. Don\'t cut the end.', brag: 'Hope your phone has battery.', needle: 'Your dad filming too?', humble: 'You earned last time.', insult: 'Film yourself losing.' } },
      { t: 'Game {games}, you and me. I\'m still the one with the cameras.', if: { topic: 'pre', vs: 'many' },
        r: { calm: 'Cameras don\'t win games.', brag: 'They\'ll be on me by the fourth.', needle: 'Your dad bought those cameras.', joke: 'Tell them to get my good side.', humble: 'You\'ve earned the cameras.' } },
      { t: 'Four hundred thousand followers, Halsey. How many are watching you?', if: { topic: 'pre', stage: HS_ERA },
        r: { needle: 'Half of them are your dad\'s.', calm: 'Everybody in this gym.', brag: 'More after tonight.', joke: 'My mom. She\'s loud.', humble: 'A few. That\'s fine.' } },
      { t: 'Smile, Halsey. You\'re in my next post.', if: { topic: ['pre', 'trash'] },
        r: { needle: 'Post the score too.', calm: 'Tag me.', brag: 'I\'ll be the highlight.', joke: 'Get my good side.', humble: 'Okay.', insult: 'Nobody reads your posts.' } },
      { t: 'You crossed me up? Enjoy it. It\'s going on my motivation wall.', if: { topic: 'trash', ev: 'ankles' },
        r: { needle: 'Your dad\'s going to see that one.', brag: 'Make room. There\'s more coming.', calm: 'Get up. Next trip.', joke: 'Put it next to your trophies.', humble: 'You\'ll get me back. You always do.' } },
      { t: 'Three in a row, Halsey. You guard me like you\'re scared of my jersey.', if: { topic: 'trash', ev: 'he_hot' },
        r: { calm: 'Keep shooting. It runs out.', needle: 'It\'s a nice jersey. Your dad pick it?', brag: 'Next one\'s getting blocked.', joke: 'It is a scary jersey.', humble: 'You\'re cooking. I have to fix it.' } },
      { t: 'They cut you and kept me. Remember that.', if: { topic: ['pre', 'trash'], flag: 'usa_cut' },
        r: { calm: 'I remember. That\'s why I\'m here.', needle: 'They kept your last name.', brag: 'Bad call by them.', humble: 'You earned the spot.', insult: 'Lucky you.' } },
      { t: 'Down {score} and you\'re still smiling? It\'s the NBL, Halsey. Grow up.', if: { topic: 'trash', stage: 'pro', score: 'down' },
        r: { calm: 'Long season. Long game.', brag: 'I smile when I come back.', needle: 'You only got loud when you went up.', joke: 'My dentist says smile more.', humble: 'You\'re playing well.' } },
    ],
    push: [
      { t: 'Say it louder. The phones can\'t hear you.', if: { topic: ['pre', 'trash'] },
        r: { needle: 'I\'ll say it louder when you lose.', calm: 'They\'ll hear the crowd instead.', brag: 'They\'ll hear the net.', joke: 'You have a phone for that?', humble: 'Nah, I\'m good.' } },
      { t: 'My dad would laugh at that. He laughs at everything you do.', if: { topic: ['pre', 'trash'] },
        r: { needle: 'Does he laugh at you too?', calm: 'Good. He should enjoy the game.', brag: 'He won\'t be laughing at the box score.', joke: 'Tell him I said hi.', humble: 'He\'s a legend. He can laugh.' } },
    ],
    close: [{ t: 'Next possession. You and me.' }, { t: 'Clock\'s running, Halsey.' }, { t: 'We\'ll see who\'s talking at the buzzer.' }, { t: 'This is going in the vlog.' }],
  },
  mbaye: {   // France's "Le Prodige": calm, amused, a little bored by Americans
    base: 'rival',
    open: [
      { t: 'Americans always think the final belongs to them. Interesting.', if: { topic: 'pre' },
        r: { calm: 'It belongs to whoever wins it.', brag: 'This one does.', joke: 'We brought snacks. Very confident.', humble: 'You\'re the favorite. I know.', needle: 'You sound nervous.' } },
      { t: 'You crossed me. Bravo. Now I am awake.', if: { topic: 'trash', ev: 'ankles' },
        r: { calm: 'Good. Stay awake.', brag: 'Go back to sleep. It\'s easier.', joke: 'Want a coffee?', humble: 'You\'re still the best player out here.', needle: 'You were asleep for a quarter.' } },
    ],
    push: [{ t: 'Mm. Maybe in English this is funny.', if: { topic: ['pre', 'trash'] },
      r: { calm: 'It\'s not funny. It\'s basketball.', joke: 'It\'s funnier in French. Trust me.', brag: 'The scoreboard will translate.', humble: 'Fair.', needle: 'You laughed, though.' } }],
    close: [{ t: 'Allez. Play.' }, { t: 'We finish this on the court.' }],
  },
  hothead: {   // loud, easy to set off
    base: 'rival',
    open: [
      { t: 'YOU AIN\'T GUARDING ME TONIGHT.', if: { topic: 'pre' },
        r: { calm: 'Okay. We\'ll see.', needle: 'Then why are you yelling?', joke: 'Inside voice.', brag: 'I\'m guarding you and your whole bench.', humble: 'I\'ll try.' } },
      { t: 'Do that crossover again! I DARE you!', if: { topic: 'trash', ev: 'ankles' },
        r: { brag: 'Okay. Next trip.', calm: 'Get up first.', needle: 'Everybody saw you fall.', joke: 'You dropped something. Your ankles.', humble: 'Lucky one.' } },
      { t: 'GET USED TO IT! That\'s all night!', if: { topic: 'trash', ev: 'he_hot' },
        r: { calm: 'Long game.', needle: 'You\'re still losing, though.', joke: 'All night? You need a nap.', brag: 'Next one\'s mine.', humble: 'You\'re hot. I see it.' } },
    ],
    push: [{ t: 'Oh, you think you\'re funny?', if: { topic: ['pre', 'trash'] },
      r: { joke: 'A little funny.', needle: 'Funnier than your jumper.', calm: 'I think it\'s your ball.', brag: 'I think I\'m better.', humble: 'No. Sorry.' } }],
    close: [{ t: 'NEXT PLAY! YOU AND ME!' }, { t: 'It\'s on. It\'s ON.' }],
  },
  iceman: {   // says almost nothing; only composure impresses him
    base: 'rival',
    open: [
      { t: 'Hm. You.', if: { topic: 'pre' },
        r: { calm: 'Me.', joke: 'Good to see you too.', brag: 'Yeah. Me.', humble: 'Hi.', needle: 'Big speech.' } },
      { t: '…Nice move. Won\'t work twice.', if: { topic: 'trash', ev: 'ankles' },
        r: { calm: 'I have more than one.', joke: 'You said that out loud?', brag: 'It\'ll work three times.', humble: 'Probably not.', needle: 'Your ankles disagree.' } },
      { t: 'Three in a row. You talk a lot for that.', if: { topic: 'trash', ev: 'he_hot' },
        r: { calm: 'Then I\'ll stop talking.', joke: 'I talk when I\'m nervous.', brag: 'I\'ll talk after I stop you.', humble: 'Fair.', needle: 'You counted?' } },
    ],
    push: [{ t: 'And?', if: { topic: ['pre', 'trash'] },
      r: { calm: 'And nothing. Let\'s play.', joke: 'And that\'s my whole speech.', brag: 'And I\'m better.', humble: 'That\'s it.', needle: 'And you\'re rattled.' } }],
    close: [{ t: 'Play.' }, { t: 'Next.' }],
  },
  showman: {   // everything is content; lives for the crowd
    base: 'rival',
    open: [
      { t: 'Hope you brought your good side. The cameras love me.', if: { topic: 'pre' },
        r: { joke: 'I only have good sides.', calm: 'I\'m here to play, not pose.', needle: 'They love the guy who wins.', brag: 'They\'ll switch to me.', humble: 'They\'re all yours.' } },
      { t: 'Okay, you got the crowd on that crossover. Rent\'s due. They\'re mine again next trip.', if: { topic: 'trash', ev: 'ankles' },
        r: { joke: 'I\'ll take a lease.', calm: 'Keep them. I\'ll keep scoring.', needle: 'They\'re still laughing at you.', brag: 'I\'m buying the building.', humble: 'They love you, man.' } },
      { t: 'Did you SEE that? Three straight! Tell me you saw that.', if: { topic: 'trash', ev: 'he_hot' },
        r: { joke: 'I saw it. I was right there, unfortunately.', calm: 'Saw it. Next one\'s different.', needle: 'Your team is still {score}.', brag: 'Watch mine.', humble: 'Yeah. That was nice.' } },
    ],
    push: [{ t: 'Ha! That one\'s going in the blooper reel.', if: { topic: ['pre', 'trash'] },
      r: { joke: 'Put me in the credits.', calm: 'Put the score in it too.', needle: 'You\'re in every blooper.', brag: 'I\'m in the highlights.', humble: 'Fair.' } }],
    close: [{ t: 'Showtime. Watch.' }, { t: 'Stay for the finale.' }],
  },

  /* ------------------------------ TEAMMATES (pre-game only) ------------------------------ */
  mate: {   // any teammate
    open: [
      { t: 'You good? You look tight.', if: { topic: 'pre' },
        r: { honest: 'A little. Talk to me out there.', joke: 'Tight? I\'m a coiled spring.', team: 'I\'m good. We\'re good.', ego: 'I\'m fine. Just get me the ball.', argue: 'Worry about yourself.' } },
      { t: 'If they double you tonight, where\'s the ball going?', if: { topic: 'pre' },
        r: { team: 'Straight to you. Be ready.', effort: 'Wherever it needs to go. I\'ll find you.', honest: 'I always try to split it. I\'ll look for you.', ego: 'Nowhere. I\'m splitting it.', joke: 'To the guy with the best haircut. You.', argue: 'Just get open and you\'ll see.' } },
    ],
    push: [
      { t: 'Talk to me on defense tonight. Every switch.', if: { topic: 'pre' },
        r: { team: 'Every switch. Loud.', effort: 'I\'ll talk the whole game.', honest: 'I forget sometimes. Remind me.', ego: 'You talk. I\'ll guard.', joke: 'I\'ll sing it if I have to.', excuse: 'It\'s loud in here. You might not hear me.' } },
    ],
    close: [{ t: 'Let\'s work.' }, { t: 'I got your back.' }, { t: 'Lock in.' }, { t: 'Okay. Just play.', mood: 'bad' }],
  },
  tariq: {   // your best friend since second grade. Jokes, nerves, loyalty
    base: 'mate',
    open: [
      { t: 'Bro. BRO. Kai Sterling is right there. Are we really doing this?', if: { topic: 'pre', star: 'kai' },
        r: { joke: 'Ask him for an autograph after we win.', team: 'We\'re doing it together. Feed me, I feed you.', honest: 'I\'m nervous too. Let\'s go anyway.', ego: 'He should be nervous.', argue: 'Stop staring at him.' } },
      { t: 'If I hit three in a row, you better pass me the fourth.', if: { topic: 'pre' },
        r: { team: 'Hit two and I\'ll pass you the third.', joke: 'You\'ve never hit three in a row.', honest: 'If you\'re open, it\'s yours.', ego: 'We\'ll see. I\'m hot tonight too.', argue: 'Just play your game.' } },
      { t: 'My mom made a sign. It spells your name wrong. Don\'t look.', if: { topic: 'pre' },
        r: { joke: 'I\'m looking. I\'m looking right now.', team: 'Tell her I love it anyway.', honest: 'That\'s the best thing I\'ve heard all day.', ego: 'Everybody will know how to spell it after tonight.', argue: 'Bro, focus.' } },
    ],
    push: [{ t: 'Okay but for real though. You good?', if: { topic: 'pre' },
      r: { honest: 'For real? Nervous. Glad you\'re here.', joke: 'For real I\'m always good.', team: 'We\'re good. Halsey on three.', ego: 'I\'m better than good.', argue: 'Stop asking.' } }],
    close: [{ t: 'Let\'s eat.' }, { t: 'Halsey on three.' }, { t: 'We got this. Probably.' }],
  },
  mate_vet: {   // the quiet veteran
    base: 'mate',
    open: [{ t: 'They\'re going to come at you early tonight. Let them.', if: { topic: 'pre' },
      r: { honest: 'Okay. I usually rush when that happens.', effort: 'Let them. I\'ll still be there in the fourth.', team: 'If they load up on me, you\'ll be open.', ego: 'They can come. They won\'t stop me.', excuse: 'If the refs let them.' } }],
    push: [{ t: 'Say less. Do more. Got it?', if: { topic: 'pre' },
      r: { honest: 'Got it.', effort: 'Watch.', team: 'Got it. You too.', ego: 'I can do both.', argue: 'You\'re talking more than me.' } }],
    close: [{ t: 'Play your game.' }, { t: 'Let\'s work.' }],
  },
  mate_hype: {   // the hype man
    base: 'mate',
    open: [{ t: 'TONIGHT\'S THE NIGHT! You feel it? I feel it!', if: { topic: 'pre' },
      r: { joke: 'I feel your elbow in my ribs, mostly.', effort: 'I feel it. Let\'s run them out of here.', team: 'We all feel it. Let\'s eat.', ego: 'It\'s my night. You\'re invited.', honest: 'I feel nervous, honestly.', argue: 'Can you not yell in my ear?' } }],
    push: [{ t: 'If you dunk tonight, I\'m running onto the court. I don\'t care.', if: { topic: 'pre' },
      r: { joke: 'Bring a towel. And a cape.', team: 'Catch the lob and I\'ll run onto the court.', effort: 'Then I\'m dunking.', ego: 'Start stretching.', honest: 'Please don\'t. That\'s a technical.', excuse: 'If my legs show up, maybe.' } }],
    close: [{ t: 'LET\'S EAT!' }, { t: 'Showtime!' }],
  },
};

/* how they react to your answer: kind → style → { good, bad } (good = this person liked that style; see the personality's styles).
   A character can override any of these with TALK.personalities[id].react[style]. */
TALK.reacts = {
  coach: {
    honest: { good: ['Good. Own it and fix it.', 'That\'s honest. I can work with honest.'], bad: ['Honest is nice. I need a plan.', 'Okay, you know it. Now fix it.'] },
    effort: { good: ['That\'s what I want to hear.', 'Good. Now do it.'], bad: ['Effort\'s the minimum. I need more.', 'Running hard isn\'t a plan.'] },
    team: { good: ['Now you\'re thinking like a leader.', 'Good. Trust the guys next to you.'], bad: ['That\'s nice. I asked about you.', 'Passing isn\'t the answer to everything.'] },
    respect: { good: ['Good. Listen and play.', 'Alright. I\'ll tell you, then.'], bad: ['Don\'t just agree with me. Think.', 'I need an answer, not a "yes, Coach."'] },
    joke: { good: ['Ha. Loose is good.', 'Okay. At least you\'re relaxed.'], bad: ['Funny. Not the time.', 'Save the jokes for the bus.'] },
    ego: { good: ['Confidence. I\'ll take it.', 'Okay. Back it up.'], bad: ['You\'re not that guy yet.', 'Show me first. Then talk.'] },
    argue: { good: ['Fine. Prove me wrong.'], bad: ['Watch your tone.', 'Don\'t argue with me in a timeout.'] },
    excuse: { good: ['Okay. Play through it.'], bad: ['That\'s an excuse.', 'Nobody cares about the refs. Play.'] },
  },
  ref: {
    calm: { good: ['Okay. I hear you.', 'Fair. I\'ll watch it.'], bad: ['Calm doesn\'t change the call.'] },
    specific: { good: ['That\'s a real argument. I\'ll watch for it.', 'Good eye. Noted.'], bad: ['That\'s not how the rule works.', 'Nice try. Still a block.'] },
    respect: { good: ['Appreciate that.', 'Thanks. Play on.'], bad: ['Polite. Still a block.'] },
    argue: { good: ['Okay, okay. I\'ll look.'], bad: ['Don\'t raise your voice at me.', 'Careful.'] },
    sarcasm: { good: ['Ha. Fair.'], bad: ['Keep that up and see what happens.', 'You want a T?'] },
    insult: { good: ['…'], bad: ['That\'s enough.', 'One more word.'] },
  },
  rival: {   // ego gauge: "good" = it got to him
    needle: { good: ['…Say that again. I dare you.', 'Shut up. Just shut up.'], bad: ['Cute.', 'That\'s all you got?'] },
    brag: { good: ['We\'ll see about that!', 'You wish.'], bad: ['Ha. Okay.', 'Talk is cheap.'] },
    joke: { good: ['Okay, that was funny. Don\'t do it again.', 'Nobody laughs at me!'], bad: ['Boring.', 'Not funny.'] },
    calm: { good: ['…Hm. You\'re not scared.', 'Okay. Cool customer.'], bad: ['Yawn.', 'Wake up.'] },
    humble: { good: ['…Thanks, I guess.'], bad: ['Ha! Soft.', 'That\'s what I thought.'] },
    insult: { good: ['Watch yourself!'], bad: ['That\'s weak.', 'Grow up.'] },
  },
  mate: {
    honest: { good: ['That\'s real. I got you.', 'Good. Me too.'], bad: ['Okay… don\'t overthink it.'] },
    effort: { good: ['That\'s my guy!', 'Let\'s work.'], bad: ['Calm down, it\'s warmups.'] },
    team: { good: ['That\'s what I like to hear.', 'We eat together.'], bad: ['Okay, okay.'] },
    joke: { good: ['Ha! Okay, we\'re loose.', 'LET\'S GOOO!'], bad: ['Bro, focus.', 'Weird energy.'] },
    respect: { good: ['I got you.'], bad: ['You don\'t need my permission.'] },
    ego: { good: ['Alright, superstar.'], bad: ['Relax.', 'We\'ll see.'] },
    argue: { good: ['Fair.'], bad: ['Whoa. Okay.', 'Bro, relax.'] },
    excuse: { good: ['Okay.'], bad: ['Don\'t start that.', 'No excuses tonight.'] },
  },
};

/* every rival without his own voice gets one of the archetypes (stable per player) */
Object.assign(TALK.personalities, {
  mbaye: { kind: 'rival', trait: 'Calm and amused. Thinks Americans talk too much.', styles: { calm: 24, joke: 12, brag: 8, humble: -8, needle: -12, insult: -18 } },
  tariq: { kind: 'mate', char: 'tariq', trait: 'Your best friend. Nervous jokes, total loyalty.', start: 55, styles: { joke: 22, team: 18, honest: 16, effort: 12, respect: 8, ego: -10, argue: -16, excuse: -12 } },
  /* the coach of each stage (js/match.js picks him): your college / club / Grind League / NBL / national team coach */
  ccoach: { kind: 'coach', char: 'ccoach', trait: 'Builds men for March. Hates shortcuts.', start: 55, styles: { effort: 20, honest: 18, team: 16, respect: 12, joke: -8, ego: -20, argue: -20, excuse: -24 } },
  vance: { kind: 'coach', char: 'vance', trait: 'The new coach. Brought his own guys, owes you nothing.', start: 45, styles: { respect: 22, effort: 18, team: 12, honest: 8, joke: -14, ego: -26, argue: -28, excuse: -26 } },
  ocoach: { kind: 'coach', char: 'ocoach', trait: 'European club coach. Positions first, highlights never.', start: 52, styles: { team: 24, honest: 16, respect: 14, effort: 10, joke: -10, ego: -26, argue: -18, excuse: -22 } },
  gcoach: { kind: 'coach', char: 'gcoach', trait: 'Twenty years in the Grind. Respects grinders.', start: 55, styles: { effort: 24, honest: 16, team: 12, respect: 10, joke: 4, ego: -18, argue: -16, excuse: -26 } },
  pcoach: { kind: 'coach', char: 'pcoach', trait: 'Thirty years in the league. Plays whoever defends.', start: 55, styles: { effort: 20, team: 18, honest: 16, respect: 10, joke: 2, ego: -18, argue: -20, excuse: -24 } },
});
