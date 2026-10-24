/* =====================================================================
   DATA-TALK-LINES.JS — the line pools for in-game and pre-game conversations (js/match.js talk()).
   Story conversations keep their own scripts (TALK.scripts in js/data-talk.js).

   TALK.lines[character] = { open: [...], push: [...], close: [...] }
     A conversation is open → push (→ close): 2–3 of their lines; you answer each one.
     A line is a string, or { t, if } where `if` must all hold (lines whose conditions match are preferred):
       topic: 'pre' | 'play' | 'minutes' | 'argue' | 'call' | 'trash'   (what the talk is about)
       score: 'up' | 'down' | 'tied' | 'bigup' | 'bigdown' | 'close'      (from YOUR side)
       ev:    'dunked_on' (you dunked on him) | 'got_dunked' (he scored on you) | 'blocked' (you blocked him)
              'missed_ft' | 'bad_call' | 'me_hot' | 'me_cold' | 'he_hot'
       when:  'early' | 'late'          vs: 'first' | 'won' | 'lost' | 'many'   (your history with this opponent)
       flag:  story flag(s) that must be set (callbacks to earlier events)
     Placeholders: {first} {last} {num} {star} {opp} {us} {score} {hs} {games}
   TALK.replies[kind][style] = your possible answers (kind: coach | ref | rival | mate). 3 styles are offered
     each time (at least one that this person likes and one he doesn't); how each style lands is in
     TALK.personalities[...].styles.
   No line repeats until every line of that pool has been used (saved per career: state.talkSeen).
   Every line: 1–2 punchy sentences.
   ===================================================================== */
TALK.lines = {
  /* ------------------------------ COACHES ------------------------------ */
  lou: {   // gruff ex-pro, three seasons with the Pistonz before his knee went. Calls you "kid".
    open: [
      { t: 'Kid. You\'re thinking too much. Talk to me.', if: { topic: 'play' } },
      { t: 'You want the ball? Tell me why, and make it quick.', if: { topic: 'play' } },
      { t: 'Three bad shots, kid. Three. What are you doing?', if: { topic: 'argue' } },
      { t: 'Sit down a second. Breathe. Then tell me what you see.', if: { topic: 'argue' } },
      { t: 'You want more run? Earn it in the next two minutes.', if: { topic: 'minutes' } },
      { t: 'I didn\'t come out here to watch you hide. Talk.', if: { topic: 'minutes' } },
      { t: 'That last bucket? Pretty. Do it again without looking at the crowd.', if: { ev: 'me_hot' } },
      { t: 'You just got cooked. It happens. What\'s the fix?', if: { ev: 'got_dunked' } },
      { t: 'Down {score}. I\'ve been down worse in bigger gyms. You?', if: { score: 'down' } },
      { t: 'Up {score}. This is where kids get lazy. Are you a kid?', if: { score: 'up' } },
      { t: 'You remember what I told you after Halsey Park? Say it back to me.', if: { flag: 'beat_kai' } },
      'Ankles taped? Head on straight? Good. Talk.',
      'In the league they\'d have eaten you alive for that. Here, I\'m just gonna ask.',
      'You\'ve got about ten seconds before I start yelling.',
    ],
    push: [
      'Everybody says that. What are you gonna DO?',
      'My knee says I\'ve heard that one before.',
      'Look at me, not the scoreboard.',
      'Half that is right. Which half?',
      'You sound like me at seventeen. That\'s not a compliment.',
      'And when he takes that away? Then what?',
      'Words are cheap on Halsey Street. Show me.',
    ],
    close: [
      'Fine. Go get it.',
      'Alright. Next trip, you show me.',
      'Don\'t make me regret this, kid.',
      'Get out there before I change my mind.',
      'That\'s the most sense you\'ve made all day.',
      'Hmph. Go.',
    ],
  },
  brennan: {   // 31 years at Lincoln, old-school, program first. Calls you "son".
    open: [
      { t: 'Son, I\'ve been running plays for thirty-one years. Why should I run one for you?', if: { topic: 'play' } },
      { t: 'You want this one drawn up? Then sell it to me.', if: { topic: 'play' } },
      { t: 'That\'s not Lincoln basketball. Explain yourself.', if: { topic: 'argue' } },
      { t: 'Take a seat. I want to hear what you think you\'re doing.', if: { topic: 'argue' } },
      { t: 'Minutes are earned in this program. What have you earned?', if: { topic: 'minutes' } },
      { t: 'Banners don\'t hang themselves, son. We\'re {score}. Talk to me.', if: { score: 'close' } },
      { t: 'Up {score} and you\'re hunting highlights. I\'ve seen it before.', if: { score: 'up' } },
      { t: 'We\'re down {score}. Somebody has to lead. Is it you?', if: { score: 'down' } },
      { t: 'Westbrook\'s been laughing at this gym for years. You want to change that?', if: { hs: 'lincoln' } },
      { t: 'You beat Kai Sterling on a playground. This isn\'t a playground.', if: { flag: 'beat_kai' } },
      'Tuck your jersey in. Now talk.',
      'I\'ve coached three All-State kids. None of them talked this much.',
      'Eyes up here, son. What do you need?',
    ],
    push: [
      'That\'s an answer. Not a good one yet.',
      'In 1994 a kid said the same thing. He ran laps.',
      'The program is bigger than you. Say it like you know that.',
      'Respect the game and it respects you. Try again.',
      'Keep going. I\'m listening.',
      'You think I haven\'t heard that one?',
    ],
    close: [
      'Alright, son. Go earn it.',
      'That\'s a Lincoln answer. Go.',
      'Fine. Don\'t embarrass the jersey.',
      'We\'ll see. Back on the floor.',
      'Good. Now play like it.',
    ],
  },
  graves: {   // Westbrook's machine. Cold, clipped, only the system matters.
    open: [
      { t: 'You want a play. The system already has plays. Why yours?', if: { topic: 'play' } },
      { t: 'Explain the last three possessions. Briefly.', if: { topic: 'argue' } },
      { t: 'Minutes follow numbers. Show me numbers.', if: { topic: 'minutes' } },
      { t: 'We\'re {score}. Variance. Not an excuse.', if: { score: 'down' } },
      { t: 'Up {score}. Do not get creative.', if: { score: 'up' } },
      { t: 'Your shot chart tonight is a crime scene.', if: { ev: 'me_cold' } },
      { t: 'Efficient. Keep it that way.', if: { ev: 'me_hot' } },
      'Fifteen seconds. Go.',
      'I don\'t do speeches. You have one sentence.',
      'Talk. Then execute.',
      'The film will be honest with you later. Be honest now.',
    ],
    push: [
      'Irrelevant.',
      'That\'s a feeling. I asked for a reason.',
      'Better. Not good.',
      'The system doesn\'t care how you feel.',
      'Again. Shorter.',
    ],
    close: [
      'Acceptable. Go.',
      'Fine. Run it as drawn.',
      'Don\'t improvise.',
      'Noted. Back in.',
    ],
  },
  coach: {   // any other coach: strict, earns-everything
    open: [
      { t: 'You want a call? Convince me in one breath.', if: { topic: 'play' } },
      { t: 'What was that last trip? Talk.', if: { topic: 'argue' } },
      { t: 'More minutes? Show me something first.', if: { topic: 'minutes' } },
      { t: 'We\'re {score}. Who wants it?', if: { score: 'close' } },
      { t: 'Down {score}. I need answers, not effort faces.', if: { score: 'down' } },
      'Quick. What do you need?',
      'Make it fast. Timeout\'s ticking.',
      'Talk to me. And look me in the eye.',
    ],
    push: ['Go on.', 'Not convinced yet.', 'And if they adjust?', 'Everybody wants the ball. Why you?', 'Prove it with the next stop.'],
    close: ['Fine. Go.', 'Alright, you\'ve got it.', 'Don\'t waste it.', 'Back out there.'],
  },
  /* ------------------------------ REFEREES ------------------------------ */
  ref_dawkins: {   // by the book, quotes rules
    open: [
      { t: 'Something to say, number {num}? Keep it respectful.', if: { topic: 'call' } },
      { t: 'Rule 10, section one. Do you know it? Then don\'t argue it.', if: { ev: 'bad_call' } },
      'You have a question. Ask it like a question.',
      'I\'ll give you ten seconds. Use them well.',
      'That was a block by the book. You want the page number?',
      'Hands at your sides, number {num}. Then talk.',
    ],
    push: ['The book says otherwise.', 'Restricted area. Two feet in. That\'s the call.', 'I saw it. I called it.', 'Careful with the tone.', 'Noted. Not changed.'],
    close: ['I\'ll watch it. Play.', 'We\'re done here.', 'Fair. Back to work.', 'Go play, {num}.'],
  },
  ref_vance: {   // short fuse
    open: [
      { t: 'Don\'t. Even. Start.', if: { topic: 'call' } },
      { t: 'You want to cry about that call? Make it quick.', if: { ev: 'bad_call' } },
      'What?',
      'You got something? Say it calm or don\'t say it.',
      'I heard you the first three times.',
      'Lower your voice and maybe I listen.',
    ],
    push: ['Watch it.', 'Keep going and see what happens.', 'Not a debate.', 'That tone costs points.', 'Last warning.'],
    close: ['Alright. Walk away.', 'Fine. Play ball.', 'We\'re done.', 'Okay. I\'ll look.'],
  },
  ref_ortiz: {   // veteran, dry humor, respects people who know the rules
    open: [
      { t: 'Thirty years with a whistle. Go ahead, educate me.', if: { topic: 'call' } },
      { t: 'I saw your face after that call. Let\'s hear it.', if: { ev: 'bad_call' } },
      'Number {num}. You look like you have a rule you want to quote.',
      'I\'ve got a minute. Make it a good one.',
      'You\'re not the first kid to think I missed that.',
    ],
    push: ['Close. Wrong rule, though.', 'Now that\'s an actual argument.', 'Go on. I\'m enjoying this.', 'Mm. Show me where.', 'You\'ve been reading. I like it.'],
    close: ['I\'ll keep an eye on it.', 'Good eye. Back to it.', 'Walk away while you\'re ahead.', 'Okay, scholar. Play.'],
  },
  /* ------------------------------ RIVALS ------------------------------ */
  kai: {   // #1 in the class, Silk Sterling's son, lives on his phone. Calls you "Halsey".
    open: [
      { t: 'Halsey. I\'ve watched your film. It was short.', if: { topic: 'pre', vs: 'first' } },
      { t: 'You still remember Halsey Park? Because I do. Every night.', if: { topic: 'pre', flag: 'beat_kai' } },
      { t: 'Halsey Park was a fluke and tonight everybody finds out.', if: { flag: 'beat_kai', vs: 'won' } },
      { t: 'Last time I sent you home. Tonight I\'m filming it.', if: { vs: 'lost' } },
      { t: 'Game {games} of you versus me. I\'m still the one with the followers.', if: { vs: 'many' } },
      { t: 'Summer Jam champion. Cute. My dad has rings.', if: { flag: 'summer_champ' } },
      { t: 'Same jersey now, huh? Don\'t get comfortable.', if: { flag: 'usa_made' } },
      { t: 'They cut you and kept me. Remember that.', if: { flag: 'usa_cut' } },
      { t: 'You really dunked on me? Enjoy it. It\'s going on my motivation wall.', if: { ev: 'dunked_on' } },
      { t: 'Did you feel the wind? That was me going by.', if: { ev: 'got_dunked' } },
      { t: 'You missed a free throw. A FREE one.', if: { ev: 'missed_ft' } },
      { t: 'Up {score} and you\'re smiling? It\'s early, Halsey.', if: { score: 'up' } },
      { t: 'Down {score}. This is the part where you get quiet.', if: { score: 'down' } },
      { t: 'I\'m on fire and you\'re on my highlight tape. Same thing.', if: { ev: 'he_hot' } },
      { t: 'Tied {score}. My favorite kind of ending.', if: { score: 'tied', when: 'late' } },
      'Four hundred thousand followers. How many are watching you?',
      'My dad\'s in row two. Wave at him before I go to work.',
      'Smile, Halsey. You\'re in my next post.',
      'You guard me like you\'re scared of my jersey.',
      'Somebody tell {last} the cameras are on me.',
    ],
    push: [
      'That\'s cute. Write that one down.',
      'You think that bothers me? I have a PR team.',
      'Say it louder. The phones can\'t hear you.',
      'Keep talking. It\'s a good look for the comments.',
      'My dad would laugh at that. He laughs at everything you do.',
      'Okay. That one was decent. Don\'t let it go to your head.',
      'You and what jumper?',
      'I\'ve heard better trash talk from my little cousin.',
    ],
    close: [
      'Next possession. You and me.',
      'Clock\'s running, Halsey.',
      'We\'ll see who\'s talking at the buzzer.',
      'Get out of my face. I\'ve got a game to win.',
      'Enjoy the view. From behind me.',
      'This is going in the vlog.',
    ],
  },
  mbaye: {   // France's "Le Prodige": calm, amused, a little bored by Americans
    open: [
      { t: 'Americans always think the final belongs to them. Interesting.', if: { topic: 'pre' } },
      { t: 'You scored on me. Bravo. Now I am awake.', if: { ev: 'dunked_on' } },
      { t: 'Down {score}. In France we call this the beginning.', if: { score: 'down' } },
      'Your shoes are very loud. Your game, less.',
      'I have played men since I was fifteen. You are still a boy.',
      'Relax. It is only the whole world watching.',
      'I watched your film on the plane. I slept well.',
    ],
    push: ['Mm. Maybe in English this is funny.', 'You talk like your coach. Very American.', 'Bof. I have heard worse.', 'Okay. Show me, then.', 'You are trying very hard. I can see it.'],
    close: ['Allez. Play.', 'We finish this on the court.', 'À tout à l\'heure.', 'Next ball. Me.'],
  },
  hothead: {   // loud, easy to set off
    open: [
      { t: 'YOU AIN\'T GUARDING ME TONIGHT.', if: { topic: 'pre' } },
      { t: 'Do that again and see what happens!', if: { ev: 'dunked_on' } },
      { t: 'GET USED TO IT! That\'s all night!', if: { ev: 'got_dunked' } },
      { t: 'We\'re up {score} and you\'re still talking?!', if: { score: 'down' } },
      { t: 'Lucky. LUCKY. That\'s all you are.', if: { score: 'up' } },
      'Who let you in here?',
      'I\'ve been waiting all week for this matchup!',
      'You flop one more time and I\'m going off!',
      'Look at me when I\'m talking to you!',
    ],
    push: ['WHAT DID YOU SAY?', 'Oh, you think you\'re funny?', 'Say that again! I dare you!', 'Ref! REF! You hear this guy?', 'Keep talking. Keep TALKING.'],
    close: ['NEXT PLAY! YOU AND ME!', 'Watch your back.', 'It\'s on. It\'s ON.', 'You\'re done. You hear me?'],
  },
  iceman: {   // says almost nothing; only composure impresses him
    open: [
      { t: 'Hm. You.', if: { topic: 'pre' } },
      { t: '…Nice move. Won\'t work twice.', if: { ev: 'dunked_on' } },
      { t: 'Scoreboard.', if: { score: 'down' } },
      'You talk a lot.',
      'Breathe. You look tired.',
      'I don\'t do this part.',
      '…',
    ],
    push: ['Okay.', 'Sure.', 'And?', 'Mm.', 'Noted.'],
    close: ['Play.', 'Ball\'s in.', 'Next.', 'Done.'],
  },
  showman: {   // everything is content; lives for the crowd
    open: [
      { t: 'Hope you brought your good side, the cameras love me.', if: { topic: 'pre' } },
      { t: 'Oh, you got the crowd on that one? Rent\'s due tomorrow, it\'s mine again.', if: { ev: 'dunked_on' } },
      { t: 'Did you SEE that? Tell me you saw that. Everybody saw that.', if: { ev: 'got_dunked' } },
      { t: 'Up {score}? I\'m still winning the comments.', if: { score: 'up' } },
      'Ladies and gentlemen, the warm-up act.',
      'I\'m going behind the back on you next trip. Get your phone out.',
      'They\'re chanting my name. Want me to teach you how that feels?',
      'You play like a tutorial video.',
    ],
    push: ['Ha! Okay, that\'s going in the blooper reel.', 'Nobody laughs at me in my own show.', 'Boring. Next.', 'Ooh, spicy. The crowd didn\'t hear it though.', 'Say it in the mic next time.'],
    close: ['Showtime. Watch.', 'Encore coming up.', 'Stay for the finale.', 'Like and subscribe.'],
  },
  /* ------------------------------ TEAMMATES (pre-game) ------------------------------ */
  tariq: {   // your best friend since forever. Jokes, nerves, loyalty.
    open: [
      { t: 'Bro. BRO. Kai Sterling is here. Are we doing this?', if: { topic: 'pre', vs: 'first' } },
      { t: 'Remember Halsey Park? Same energy tonight. Same energy.', if: { topic: 'pre', flag: 'beat_kai' } },
      { t: 'Summer Jam champs don\'t get nervous. I\'m just stretching weird.', if: { flag: 'summer_champ' } },
      'If I hit three in a row, you better pass me the fourth.',
      'My mom made a sign. It says your name wrong. Don\'t look.',
      'You look tight. Want me to tell the joke about the chicken?',
      'Feed me in the corner. I\'ve been practicing. Kind of.',
    ],
    push: ['That\'s my guy.', 'See, this is why you\'re the main character.', 'Okay but for real though.', 'You say that every time.', 'Bro, relax, I\'m kidding. Mostly.'],
    close: ['Let\'s eat.', 'Halsey on three.', 'Don\'t forget about me out there.', 'We got this. Probably.'],
  },
  mate_vet: {   // the quiet veteran
    open: [
      { t: 'Big one. You good?', if: { topic: 'pre' } },
      { t: 'They\'re gonna come at you early. Let them.', if: { topic: 'pre' } },
      'I\'ve seen you work. Don\'t rush it tonight.',
      'Talk to me on defense. Every switch.',
      'You look tight. Shoulders down.',
    ],
    push: ['Mm. Okay.', 'That\'s real.', 'We\'ll see.', 'Say less. Do more.'],
    close: ['I got your back.', 'Let\'s work.', 'Play your game.', 'Lock in.'],
  },
  mate_hype: {   // the hype man
    open: [
      { t: 'TONIGHT\'S THE NIGHT! You feel it? I feel it!', if: { topic: 'pre' } },
      { t: 'They\'re saying they\'ll hold you under twenty. I laughed so hard.', if: { topic: 'pre' } },
      'Bro, the gym is PACKED.',
      'If you dunk tonight I\'m running onto the court. I don\'t care.',
      'I made a playlist for this game. It\'s just your name on loop.',
    ],
    push: ['LET\'S GOOO!', 'That\'s what I\'m talking about!', 'Bro relax, you\'re scaring me.', 'Okay okay okay.', 'Say it again, I\'m recording.'],
    close: ['LET\'S EAT!', 'Showtime!', 'Make \'em pay!', 'Nobody\'s stopping you!'],
  },
};

/* your answers — kind → style → lines (3 styles offered each time) */
TALK.replies = {
  coach: {
    honest: ['You\'re right. That one\'s on me.', 'Honestly? I rushed it.', 'I got caught looking. Won\'t happen twice.', 'I\'m tired, but I\'m not done.', 'Fair. I\'ll fix it.'],
    effort: ['Put me on their best player.', 'I\'ll take the charge. Every one.', 'Give me two minutes. Watch my motor.', 'I\'ll outwork everybody out there.', 'Every loose ball is mine.'],
    team: ['Run it through the post. It opens the corners.', 'Make them guard all five of us.', 'I\'ll set screens all night if that\'s what it takes.', 'Swing it. Someone\'s open every time.', 'Get the bigs involved early.'],
    respect: ['Whatever you need, Coach.', 'Yes sir. What do I fix?', 'You\'ve seen more games than me. Tell me.', 'Understood, Coach.', 'I hear you. I\'m on it.'],
    joke: ['Ball. Me. Bucket. Simple math.', 'If it goes wrong, blame the mascot.', 'My jumper owes you an apology.', 'I\'ve been open since the first quarter.', 'Just pretend I\'m somebody good.'],
    ego: ['Just give me the ball.', 'I\'m the best player on this floor.', 'Nobody out there can guard me.', 'I don\'t need a play. I need the rock.', 'Everybody else is cold. I\'m not.'],
    argue: ['Are you serious right now?', 'That wasn\'t my fault and you know it.', 'Those were bad switches, not me.', 'You took me out for THAT?', 'Watch the film. I was right.'],
    excuse: ['The refs keep missing my contact.', 'Practice was too long yesterday.', 'My shoes are slipping.', 'They\'re fouling me every trip.', 'Nobody\'s setting screens for me.'],
  },
  ref: {
    calm: ['Just a quick question about that call.', 'Okay. Help me understand it.', 'All good. Just watch the hands, please.', 'I\'ll let it go. Thanks.', 'Fair enough.'],
    specific: ['His foot was on the arc. Watch it next time down.', 'He never established position — he was still sliding.', 'That\'s a hold on the off-arm. Every trip.', 'He\'s inside the restricted area on those.', 'Three seconds, ref. Every possession.'],
    respect: ['Okay. Thanks for explaining.', 'Appreciate you hearing me out.', 'Understood, sir.', 'You\'ve got a tough job tonight.', 'Thanks. I\'ll play on.'],
    argue: ['That was a terrible call!', 'You\'re kidding me!', 'He hacked me! HACKED!', 'Call it both ways!', 'That\'s a joke!'],
    sarcasm: ['Sure he was.', 'Wow. Great call. Really.', 'Do you want a jersey too?', 'Nice whistle. Very loud.', 'Thanks so much. Really.'],
    insult: ['Are you even watching the game?', 'Get some glasses!', 'Who\'s paying you tonight?', 'You\'re the worst ref in the city.'],
  },
  rival: {
    needle: [{ t: 'Funny. Everybody\'s heard of your dad.', char: 'kai' }, 'You check your followers during timeouts?', 'Your shot looks better on Instagram.', 'Who\'s guarding you, your PR team?', { t: 'Daddy\'s watching. Don\'t embarrass him.', char: 'kai' }, 'You\'re overrated and you know it.', 'You\'ve been quiet since that last bucket.', 'Your coach is yelling at you, not me.'],
    brag: ['Check the box score later.', 'Pick a side. I\'ll go the other way.', 'Go ahead. I\'ll block it.', 'I\'m about to get real lucky, then.', 'You\'ll hear about me tomorrow.'],
    joke: ['Thirty? Save some for the scouts.', 'Warm up first, you look stiff.', 'They came for the free hot dogs.', 'You talk more than my grandma.', 'Is that a jersey or a costume?'],
    calm: ['Count them. I\'ll be right here.', 'Scoreboard doesn\'t care.', 'We\'ll see.', 'Okay.', 'Good. I came to play.'],
    humble: ['I\'m just here to play.', 'You\'re really good, honestly.', 'Probably. Good luck.', 'Maybe. I\'m still learning.', 'I\'m just happy to be here.'],
    insult: ['You\'ll be crying by halftime.', 'You can\'t even spell thirty.', 'Everybody came here to boo you.', { t: 'Your dad\'s embarrassed.', char: 'kai' }, 'Go back to your phone.'],
  },
  mate: {
    honest: ['A little nervous. Talk to me out there.', 'Honestly? My legs feel heavy.', 'I\'m good. Just keep talking on D.'],
    effort: ['I\'ll take their best guy. You hunt shots.', 'Every loose ball. Watch.', 'I\'ll find you. Be ready.'],
    team: ['Straight to you if they double me.', 'We eat together tonight.', 'Run with me. I\'ll find you.'],
    joke: ['Tight? I\'m a coiled spring.', 'Tell me the chicken joke after the game.', 'If I dunk, you carry me off.'],
    respect: ['You\'ve been here longer. Tell me what you see.', 'I trust you. Lead me.', 'Your call out there.'],
    ego: ['Just get me the ball.', 'Relax. I\'ve got this.', 'Watch me take over.'],
    argue: ['Why are you on me? Worry about you.', 'I don\'t need a pep talk.'],
    excuse: ['If I miss, it\'s the rims.', 'Coach has me in the wrong spot anyway.'],
  },
};
/* every rival without his own voice gets one of the archetypes (stable per player) */
Object.assign(TALK.personalities, {
  mbaye: { kind: 'rival', trait: 'Calm and amused. Thinks Americans talk too much.', styles: { calm: 24, joke: 12, brag: 8, humble: -8, needle: -12, insult: -18 },
           good: ['…Hm. Not bad.', 'Okay. Now I am interested.'], bad: ['Bof.', 'Very American.'] },
  tariq: { kind: 'mate', char: 'tariq', trait: 'Your best friend. Nervous jokes, total loyalty.', start: 55, styles: { joke: 22, team: 18, honest: 16, effort: 12, respect: 8, ego: -10, argue: -16, excuse: -12 },
           good: ['That\'s my guy!', 'Okay, okay. We\'re good.'], bad: ['Bro… really?', 'Weird energy, man.'] },
});
