/* =====================================================================
   DATA-TALK.JS — quick in-game conversations (dead balls, timeouts, after big plays and bad calls).
   Every line is 1–2 sentences. Logic: js/match.js (talk()).

   PERSONALITIES — how much each answer STYLE moves the gauge (+ = good for you).
     coach / ref: gauge = PATIENCE (start → 0 cuts the conversation; coach can bench you, ref gives a technical)
     rival:       gauge = EGO (starts at 100, your good answers drain it; low ego = rattled, backfires = you get shaken)
   A very wrong answer (≤ endAt) ends the conversation on the spot. Same scripts, different personalities:
   the right answer depends on who you're talking to.
   SCRIPTS — each exchange: their line + 3 answers [style, text]. 2–4 exchanges per conversation.
   ===================================================================== */
const TALK = {
  endAt: -24,
  personalities: {
    /* ---- coaches (patience) ---- */
    lou:     { kind: 'coach', char: 'lou', trait: 'Gruff. Respects honesty and work, hates excuses.', start: 60,
               styles: { honest: 24, effort: 16, team: 10, joke: 4, respect: 4, ego: -12, argue: -16, excuse: -30 },
               good: ['Hmph. That\'s honest.', 'Now you sound like a hooper.'], bad: ['Don\'t sell me excuses, kid.', 'I played in the league. Try again.'] },
    brennan: { kind: 'coach', char: 'brennan', trait: 'Proud and old-school. Wants respect and effort.', start: 55,
               styles: { respect: 22, effort: 18, team: 14, honest: 8, joke: -14, argue: -22, excuse: -26, ego: -30 },
               good: ['That\'s a captain talking.', 'Thirty-one years. That\'s the right answer.'], bad: ['Watch your tone, son.', 'Nobody\'s bigger than this program.'] },
    graves:  { kind: 'coach', char: 'graves', trait: 'Cold and calculating. Only the system matters.', start: 55,
               styles: { team: 24, honest: 14, effort: 10, respect: 8, ego: -24, excuse: -22, argue: -22, joke: -28 },
               good: ['Acceptable. The system thanks you.', 'Correct.'], bad: ['That\'s noise. I don\'t do noise.', 'Wrong answer.'] },
    coach:   { kind: 'coach', trait: 'Strict. Earn everything.', start: 55, look: { skin: '#c68a5c', hair: 'buzz', hairColor: '#3b2416', outfit: 'polo', jersey: '#1f2937', trim: '#f8fafc' },
               styles: { respect: 16, effort: 18, team: 16, honest: 10, joke: -10, argue: -20, excuse: -24, ego: -24 },
               good: ['Good. That\'s what I want.', 'Okay. I hear you.'], bad: ['Not the time.', 'Sit down and think about that.'] },
    /* ---- referees (patience) ---- */
    ref_dawkins: { kind: 'ref', name: 'Ref Dawkins', trait: 'Strict, by the book.', start: 55, look: { skin: '#eac4a6', hair: 'bald', beard: 'mustache', hairColor: '#9ca3af', outfit: 'tee', jersey: '#f8fafc', trim: '#111827' },
               styles: { specific: 22, calm: 16, respect: 12, argue: -26, sarcasm: -26, insult: -60 },
               good: ['Fair question. I\'ll watch it.', 'Noted.'], bad: ['Careful.', 'One more word.'] },
    ref_vance:   { kind: 'ref', name: 'Ref Petey Vance', trait: 'Short fuse. Stay calm or else.', start: 45, look: { skin: '#a86b43', hair: 'fade', hairColor: '#0f0d0c', outfit: 'tee', jersey: '#f8fafc', trim: '#111827' },
               styles: { calm: 24, respect: 18, specific: 6, argue: -32, sarcasm: -32, insult: -60 },
               good: ['…Alright. Keep it like that.', 'Okay. I hear you.'], bad: ['Don\'t raise your voice at me.', 'You want a T? Keep going.'] },
    ref_ortiz:   { kind: 'ref', name: 'Ref Lorraine Ortiz', trait: 'Veteran. Respects players who know the rules.', start: 55, look: { skin: '#d9a77e', hair: 'bun', hairColor: '#3b2416', femme: true, outfit: 'tee', jersey: '#f8fafc', trim: '#111827' },
               styles: { specific: 28, respect: 10, calm: 10, argue: -18, sarcasm: -22, insult: -60 },
               good: ['You know the book. I respect that.', 'Good eye.'], bad: ['That\'s not how the rule works.', 'Walk away.'] },
    /* ---- rivals (ego: positive drains it) ---- */
    kai:      { kind: 'rival', char: 'kai', trait: 'Hot-headed. Lives in his famous dad\'s shadow.',
               styles: { needle: 30, brag: 16, joke: 10, calm: 6, insult: -10, humble: -18 },
               good: ['…Say that again. I dare you.', 'Shut up. Just — shut up.'], bad: ['Cute. Keep talking, Halsey.', 'That\'s what I thought.'] },
    hothead:  { kind: 'rival', trait: 'Hot-headed. Easy to get under his skin.', styles: { needle: 24, brag: 20, joke: 8, calm: 4, insult: -8, humble: -16 },
               good: ['You got a mouth on you!', 'Watch yourself!'], bad: ['Ha! Soft.', 'That all you got?'] },
    iceman:   { kind: 'rival', trait: 'Ice cold. Only respects composure.', styles: { calm: 26, joke: 14, brag: 4, humble: -6, needle: -16, insult: -20 },
               good: ['…Hm.', 'Okay. You\'re not scared.'], bad: ['Talk is cheap.', 'Yawn.'] },
    showman:  { kind: 'rival', trait: 'A showman. Hates being upstaged.', styles: { joke: 26, needle: 14, calm: 10, brag: -12, humble: -10, insult: -12 },
               good: ['Okay, okay — that was funny.', 'Nobody laughs at me!'], bad: ['Ha! The crowd loves me, not you.', 'Boring.'] },
    /* ---- teammates (trust: good answers build it) — pre-game only ---- */
    mate_vet:  { kind: 'mate', trait: 'Quiet veteran. Wants honesty and effort.', start: 50, look: { skin: '#8a5233', hair: 'buzz', hairColor: '#0f0d0c', beard: 'goatee' },
               styles: { honest: 24, effort: 20, team: 18, joke: 2, respect: 10, ego: -20, argue: -14, excuse: -22 },
               good: ['That\'s what I like to hear.', 'Alright. I got your back.'], bad: ['Talk is cheap, rook.', 'We\'ll see.'] },
    mate_hype: { kind: 'mate', trait: 'The hype man. Loves energy and jokes.', start: 50, look: { skin: '#d9a77e', hair: 'dreads', hairColor: '#3b2416' },
               styles: { joke: 24, effort: 16, team: 14, ego: 8, honest: 6, respect: 4, argue: -12, excuse: -18 },
               good: ['LET\'S GOOO!', 'That\'s my guy!'], bad: ['Bro, relax.', 'Okay… weird energy.'] },
  },
  scripts: {
    /* PRE-GAME — one short talk before big games (2 exchanges, small effect) */
    pre_coach: [
      { say: 'Big one tonight, {first}. You ready?', opts: [['effort', 'Ready. I\'ll guard whoever you want.'], ['ego', 'I was born ready, Coach.'], ['honest', 'Nervous. But ready.']] },
      { say: 'Their best player will test you early. Then what?', opts: [['team', 'Make the extra pass and keep it simple.'], ['ego', 'Then I test him back.'], ['excuse', 'Hopefully the refs protect me.']] },
    ],
    pre_mate: [
      { say: 'You good? You look tight.', opts: [['honest', 'A little. Talk to me out there.'], ['joke', 'Tight? I\'m a coiled spring.'], ['ego', 'I\'m fine. Just get me the ball.']] },
      { say: 'If they double you, where\'s the ball going?', opts: [['team', 'Straight to you. Be ready.'], ['ego', 'Nowhere. I\'m splitting it.'], ['effort', 'Wherever it needs to. I\'ll find you.']] },
    ],
    pre_rival: [
      { say: 'Heard you\'ve been talking. Tonight you find out.', opts: [['calm', 'Good. I came to play.'], ['needle', 'Funny, I heard you\'re overrated.'], ['humble', 'I\'m just happy to be here.']] },
      { say: 'Try to keep up.', opts: [['brag', 'Check the box score later.'], ['joke', 'Warm up first, you look stiff.'], ['insult', 'You\'ll be crying by halftime.']] },
    ],
    /* coach: ask for a play called for you */
    coach_play: [
      { say: 'Make it quick, {first}. What do you want?', opts: [['respect', 'Run something for me, Coach. I\'m hot.'], ['ego', 'Just give me the ball. Everybody else is cold.'], ['joke', 'Ball. Me. Bucket. Simple math.']] },
      { say: 'Why you? Convince me.', opts: [['effort', 'I\'ve won my matchup all night.'], ['excuse', 'The refs keep missing my contact.'], ['team', 'It frees up the corners for everybody.']] },
      { say: 'And if it fails?', opts: [['honest', 'Then it\'s on me. I\'ll own it.'], ['ego', 'It won\'t. Trust me.'], ['joke', 'Then we blame the mascot.']] },
    ],
    /* coach: ask for more minutes */
    coach_minutes: [
      { say: 'You want more minutes? Earn them.', opts: [['effort', 'Put me on their best player.'], ['ego', 'I\'m the best player on this floor.'], ['excuse', 'I\'d be sharper if practice wasn\'t so long.']] },
      { say: 'Your defense was soft last quarter.', opts: [['honest', 'You\'re right. It won\'t happen again.'], ['argue', 'Those were bad switches, not me.'], ['joke', 'My defense was napping too.']] },
      { say: 'Fine. What do I get?', opts: [['team', 'Every loose ball. Every box-out.'], ['ego', 'Highlights.'], ['respect', 'Whatever you need, Coach.']] },
    ],
    /* coach: argue a decision (you just got subbed out) */
    coach_argue: [
      { say: 'You\'re coming out. Sit.', opts: [['respect', 'Okay, Coach. What do I fix?'], ['argue', 'Are you serious right now?'], ['effort', 'Give me one more stop to prove it.']] },
      { say: 'You forced three bad shots in a row.', opts: [['honest', 'Fair. I\'ll move the ball.'], ['excuse', 'They were good looks. They just rimmed out.'], ['ego', 'I\'m the only one shooting it.']] },
      { say: 'So why should I put you back in?', opts: [['team', 'Because I make the others better.'], ['effort', 'Because I\'ll outwork everybody out there.'], ['argue', 'Because you need me.']] },
    ],
    /* ref: argue a call */
    ref_call: [
      { say: 'Something to say, number {num}?', opts: [['calm', 'Just a quick question about that call.'], ['argue', 'That was a terrible call!'], ['insult', 'Are you even watching the game?']] },
      { say: 'He was outside the restricted area.', opts: [['specific', 'His foot was on the arc. Watch it next time down.'], ['sarcasm', 'Sure he was.'], ['respect', 'Okay. Thanks for explaining.']] },
      { say: 'I\'ll keep an eye on it. Go play.', opts: [['calm', 'Appreciate it.'], ['argue', 'You owe me one.'], ['sarcasm', 'Wow. Thanks so much.']] },
    ],
    /* rival: trash talk at a dead ball */
    rival_trash: [
      { say: '{last}? Never heard of you.', opts: [['needle', 'Funny. Everybody\'s heard of your dad.'], ['brag', 'You\'ll hear about me tomorrow.'], ['humble', 'I\'m just here to play.']] },
      { say: 'I\'m dropping thirty on you tonight.', opts: [['calm', 'Count them. I\'ll be right here.'], ['joke', 'Thirty? Save some for the scouts.'], ['insult', 'You can\'t even spell thirty.']] },
      { say: 'Watch this next one.', opts: [['needle', 'Daddy\'s watching too.'], ['brag', 'Go ahead. I\'ll block it.'], ['humble', 'Good luck.']] },
    ],
    rival_trash2: [
      { say: 'That last bucket was luck.', opts: [['brag', 'Then I\'m about to get real lucky.'], ['calm', 'Scoreboard doesn\'t care.'], ['humble', 'Maybe. You\'re really good.']] },
      { say: 'Everybody came here to see me.', opts: [['joke', 'They came for the free hot dogs.'], ['needle', 'They came to see you lose.'], ['insult', 'They came to boo you.']] },
      { say: 'You won\'t score on me again.', opts: [['calm', 'We\'ll see.'], ['brag', 'Pick a side. I\'ll go the other way.'], ['humble', 'Probably not.']] },
    ],
  },
};
