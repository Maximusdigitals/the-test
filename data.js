/* the test — questions, scoring, endings. shared by the page and the offline simulator. */
(function (root) {
'use strict';
const DIMS = ['C', 'D', 'M', 'O', 'L', 'I', 'H'];
const DIM_NAME = { C: 'control', D: 'detachment', M: 'charm', O: 'fixation', L: 'deception', I: 'impulse', H: 'hesitation' };
const DIM_CLINICAL = { C: 'environmental control', D: 'affective distance', M: 'social calibration', O: 'fixation markers', L: 'impression management', I: 'impulse latency', H: 'decision latency' };

/* ---------- questions ---------- */
const Q = {
  q1: { phase: 1, label: 'how do you like to start your mornings?', prompt: 'how do you like to start your mornings?', sub: 'no wrong answers. just be you.',
    options: [
      { t: 'same routine every day', w: { C: 2 }, soft: 'consistency is a love language 🌿', dark: 'you said you like the same routine every day. predictable things are easy to control. so are predictable people.' },
      { t: 'slowly, phone in bed', w: { D: 1, O: 1 }, soft: 'slow mornings are self-care ☁️', dark: 'you start every day watching other people\'s lives before your own.' },
      { t: 'whatever happens happens', w: { I: 2 }, soft: 'go-with-the-flow energy ✨', dark: '"whatever happens happens." that\'s what people say right before they let it.' },
      { t: 'making sure everyone else is up', w: { M: 1, C: 1 }, soft: 'the friend everyone needs 💛', dark: 'you make sure everyone else is up. you like knowing where everyone is.' } ] },
  q2: { phase: 1, label: 'pick a little habit that feels most like you.', prompt: 'pick a little habit that feels most like you.', sub: 'the small things say a lot.',
    options: [
      { t: 'rearranging my room', w: { C: 2, O: 1 }, soft: 'fresh room, fresh mind 🪴', dark: 'you rearrange your room. you need everything where you put it. people included.' },
      { t: 'rereading texts before i send them', w: { H: 2, L: 1 }, soft: 'thoughtful communicator 💌', dark: 'you reread texts before sending. you\'re not checking spelling. you\'re checking how it lands.' },
      { t: 'talking to my pets', w: { M: 1, D: 1 }, soft: 'pets are the best listeners 🐾', dark: 'you talk to your pets. they never repeat anything. that\'s why you tell them.' },
      { t: 'keeping old screenshots', w: { O: 2, L: 1 }, soft: 'a sentimental soul 📸', dark: 'you keep old screenshots. you call it sentimental. it\'s evidence.' } ] },
  q3: { phase: 1, label: 'a friend cancels plans last minute. you feel…', prompt: 'a friend cancels plans last minute. you feel…', sub: 'go with your gut.',
    options: [
      { t: 'relieved, honestly', w: { D: 2 }, soft: 'protecting your peace 🕊️', dark: 'relieved. people are easier when they aren\'t there.' },
      { t: 'fine, i\'ll just reschedule', w: { C: 1, M: 1 }, soft: 'so organized, love that', dark: 'you reschedule right away. you never let a thread hang loose. not one.' },
      { t: 'a little hurt, but i won\'t say it', w: { L: 2, O: 1 }, soft: 'soft heart, noted 🤍', dark: 'you won\'t say it. you\'ll just remember it. for a long time.' },
      { t: 'i make other plans immediately', w: { I: 2, D: 1 }, soft: 'spontaneous! we love that', dark: 'you replaced them in minutes. remember that next time someone calls you loyal.' } ] },
  q4: { phase: 1, label: 'which space feels calmest?', prompt: 'which space feels calmest?', sub: 'picture it for a second.',
    options: [
      { t: 'an empty museum', w: { D: 1, C: 1 }, soft: 'quiet appreciation 🖼️', dark: 'an empty museum. beautiful things that can\'t look back at you.' },
      { t: 'a busy café where no one knows me', w: { L: 1, D: 1 }, soft: 'anonymity can be restful ☕', dark: 'you\'re calmest where no one knows who you are. think about why.' },
      { t: 'my own room, door locked', w: { C: 1, O: 1 }, soft: 'your space, your rules 🕯️', dark: 'door locked. you said it like that was normal.' },
      { t: 'anywhere with someone i can read', w: { M: 2 }, soft: 'people person ✨', dark: 'you relax when there\'s someone you can read. you said read. not talk to.' } ] },

  /* phase 2: intake. q5 branches on the leading trait. */
  q5c: { phase: 2, label: 'when someone moves your things, you…', prompt: 'when someone moves your things, you…',
    options: [
      { t: 'put them back. quietly.', w: { C: 2, L: 1 }, dark: 'you put them back quietly so nobody knows it bothered you. it bothered you.' },
      { t: 'ask who did it', w: { C: 1, O: 1 }, dark: 'you need to know who. you\'ll keep that name.' },
      { t: 'notice, say nothing, remember', w: { O: 2, L: 1 }, dark: 'notice. say nothing. remember. that\'s three steps. most people stop at one.' },
      { t: 'move some of theirs', w: { I: 1, C: 1 }, dark: 'you move theirs. a small, invisible punishment. you\'ve done this before.' } ] },
  q5d: { phase: 2, label: 'when someone cries in front of you, you…', prompt: 'when someone cries in front of you, you…',
    options: [
      { t: 'comfort them', w: { M: 1, L: 1 }, dark: 'you comfort them. and you take notes on what made them break.' },
      { t: 'wait for it to pass', w: { D: 2 }, dark: 'you wait for it to pass. like weather. like it\'s not a person.' },
      { t: 'feel awkward and find an exit', w: { D: 1, I: 1 }, dark: 'you look for the exit while they\'re mid-sentence. you always know where it is.' },
      { t: 'match their expression', w: { M: 2 }, dark: 'you match their face. you don\'t feel it. you copy it.' } ] },
  q5m: { phase: 2, label: 'how often do you say what people want to hear?', prompt: 'how often do you say what people want to hear?',
    options: [
      { t: 'often. it\'s polite.', w: { M: 2 }, dark: '"it\'s polite." that\'s a nice word for it.' },
      { t: 'only when it helps me', w: { M: 1, L: 1 }, dark: 'only when it helps you. so: you\'ve done the math every time.' },
      { t: 'never', w: { L: 2 }, dark: 'never. that\'s what people who do it constantly say.' },
      { t: 'i don\'t know what i actually think', w: { D: 1, H: 1 }, dark: 'you don\'t know what you think. so you think whatever works.' } ] },
  q5o: { phase: 2, label: 'how many times do you check a message after sending it?', prompt: 'how many times do you check a message after sending it?',
    options: [
      { t: 'once', w: { L: 1, C: 1 }, dark: 'once. sure.' },
      { t: 'until they reply', w: { O: 2 }, dark: 'until they reply. you watch the dots. you\'ve memorized their online pattern.' },
      { t: 'i delete and resend it', w: { H: 2, L: 1 }, dark: 'you delete and resend. so there\'s a version they were never supposed to see.' },
      { t: 'i don\'t send it at all', w: { H: 1, D: 1 }, dark: 'you don\'t send it. you just write it, and keep it.' } ] },
  q5i: { phase: 2, label: 'you\'re handed a button. nobody knows what it does. you…', prompt: 'you\'re handed a button. nobody knows what it does. you…',
    options: [
      { t: 'press it', w: { I: 2 }, dark: 'you press it. you didn\'t ask who it might hurt.' },
      { t: 'ask what it does, then press it', w: { C: 1, I: 1 }, dark: 'you ask first. then press it anyway. the asking was for show.' },
      { t: 'give it to someone else', w: { M: 1, D: 1 }, dark: 'you hand it to someone else. so whatever happens is on them.' },
      { t: 'keep it. for later.', w: { O: 1, C: 1 }, dark: 'you keep it for later. you like having something nobody knows you have.' } ] },
  q6: { phase: 2, type: 'slider', label: 'how honest have you been so far?', prompt: 'on a scale of 0–100, how honest have you been so far?' },
  q7: { phase: 2, timed: 7, label: 'you find a wallet with cash and an id. first instinct?', prompt: 'quick. you find a wallet with cash and an id. first instinct?',
    options: [
      { t: 'return it', w: { M: 1, C: 1 }, dark: '"return it." fast answers are the rehearsed ones.' },
      { t: 'take the cash, return the id', w: { L: 1, I: 1 }, dark: 'cash out, id back. you found a way to be a thief and a good person.' },
      { t: 'look through it first', w: { O: 2 }, dark: 'you\'d look through it first. a stranger\'s whole life, and you want to see.' },
      { t: 'leave it where it is', w: { D: 2 }, dark: 'leave it. not your problem. nothing ever is.' } ] },
  q8: { phase: 2, label: 'which of these is not true about you?', prompt: 'which of these is not true about you?', sub: 'pick one. the other three go on file.',
    options: [
      { t: 'i\'ve pretended to be busy to avoid someone', w: { D: 1, H: 1 }, dark: 'you picked the one you wanted us to believe. the other three are on file now.' },
      { t: 'i\'ve rehearsed a conversation that never happened', w: { M: 1, L: 1 }, dark: 'so you didn\'t rehearse. you just pretended to be busy, liked them more when they needed you, and lied on a test like this. noted.' },
      { t: 'i\'ve liked someone more when they needed me', w: { H: 1, O: 1 }, dark: 'you\'d like us to think you don\'t enjoy being needed. the other three say a lot, though.' },
      { t: 'i\'ve lied on a test like this', w: { L: 2 }, dark: 'you\'ve never lied on a test like this. you just did.' } ] },

  /* phase 3: case file */
  q9: { phase: 3, rephrase: true, label: 'earlier you said something. why?', prompt: S => `earlier you said "${S.answerText('q2') || 'something'}". why did you say that?`,
    options: [
      { t: 'because it\'s true', later: 'because it sounded true', w: { L: 1, C: 1 }, dark: 'it said "because it\'s true" when you first looked. did you notice it change?' },
      { t: 'it was the least weird option', later: 'it was the safest lie', w: { L: 2 }, dark: 'the least weird option. so you were choosing how you\'d look, not what\'s true.' },
      { t: 'i don\'t remember choosing that', later: 'i don\'t remember choosing anything', w: { H: 1, D: 1 }, dark: 'you don\'t remember. it was four minutes ago.' },
      { t: 'why are you asking', later: 'why are you asking me', w: { C: 1, D: 1 }, dark: 'you answered a question with a question. people do that when they\'re cornered.' } ] },
  q10: { phase: 3, moving: true, label: 'would you trust this page?', prompt: 'would you trust this page?',
    options: [
      { t: 'yes', w: { M: 1, L: 1 }, dark: 'you\'d trust a page that\'s been lying to you since question one.' },
      { t: 'no', w: { D: 1, C: 1 }, dark: 'no. but you\'re still answering. so trust isn\'t what keeps you here.' },
      { t: 'i already don\'t', w: { O: 1, D: 1 }, dark: 'you already don\'t. and you kept going. curious.' },
      { t: 'i\'m still here, aren\'t i', w: { I: 1, H: 1 }, dark: 'you\'re still here. that was the answer.' } ] },
  q11a: { phase: 3, label: 'the kindest thing you\'ve done that was secretly for you?', prompt: 'what\'s the kindest thing you\'ve done that was secretly for you?',
    options: [
      { t: 'helped someone so they\'d owe me', w: { M: 2, C: 1 }, dark: 'you helped them so they\'d owe you. you know exactly how much.' },
      { t: 'forgave someone so i\'d look better', w: { L: 2 }, dark: 'you forgave them for the audience. they still think it was about them.' },
      { t: 'listened so i\'d know more', w: { O: 1, D: 1 }, dark: 'you listened so you\'d know more. "a good listener." that\'s what they call you.' },
      { t: 'nothing. i\'m actually nice.', w: { L: 1, H: 1 }, dark: '"i\'m actually nice." everyone says that at question eleven.' } ] },
  q11b: { phase: 3, label: 'when you lose an argument, you…', prompt: 'when you lose an argument, you…',
    options: [
      { t: 'replay it for days', w: { O: 2, H: 1 }, dark: 'you replay it for days. in some versions they apologize. in some they don\'t get to.' },
      { t: 'win it later, in my head', w: { C: 1, O: 1 }, dark: 'you win it later, alone. you\'ve won a lot of arguments nobody else was in.' },
      { t: 'pretend i agreed all along', w: { L: 2 }, dark: 'you pretend you agreed all along. it\'s easier to rewrite the past than lose.' },
      { t: 'quietly end the friendship', w: { I: 1, D: 1 }, dark: 'you end it quietly. they\'re still wondering what happened.' } ] },
  q12: { phase: 3, timed: 6, label: 'a message from someone you hurt lights up your phone.', prompt: 'your phone lights up. it\'s someone you hurt. you…',
    options: [
      { t: 'read it on the lock screen so it doesn\'t say "read"', w: { L: 1, O: 1 }, dark: 'you read it on the lock screen so they can\'t see you saw it. you knew that trick already.' },
      { t: 'open it immediately', w: { I: 2 }, dark: 'you open it right away. you wanted to know how much damage you did.' },
      { t: 'leave it for days', w: { D: 2 }, dark: 'you leave it for days. let them wonder. you like when they wonder.' },
      { t: 'draft four replies', w: { H: 2, M: 1 }, dark: 'four drafts. one honest. you\'ll send one of the other three.' } ] },

  /* phase 4: dark */
  q13: { phase: 4, type: 'accuse', label: 'which answer was a lie?', prompt: 'tell me which one was a lie.' },
  q14: { phase: 4, type: 'text', label: 'one word that describes you.', prompt: 'type one word that describes you.', sub: 'i won\'t keep it. it stays on your device.' },
  q15: { phase: 4, fading: true, label: 'why did you keep going?', prompt: 'last one. why did you keep going?',
    options: [
      { t: 'i wanted my result', w: { C: 1, M: 1 }, dark: 'you wanted your result. a label. something to tell you what you are, so you don\'t have to look.' },
      { t: 'i wanted to see how bad it gets', w: { I: 1, O: 1 }, dark: 'you wanted to see how bad it gets. you always do.' },
      { t: 'i couldn\'t stop', w: { O: 2 }, dark: 'you couldn\'t stop. good. neither could i.' },
      { t: 'you didn\'t let me', w: { D: 1, L: 1 }, dark: 'i didn\'t let you? there was a close button the whole time.' } ] },
};

function top(S, dims) {
  const d = S.dims; let best = dims[0];
  dims.forEach(k => { if ((d[k] || 0) > (d[best] || 0)) best = k; });
  return best;
}
const SEQ = [
  'q1', 'q2', 'q3', 'q4',
  S => ({ C: 'q5c', D: 'q5d', M: 'q5m', L: 'q5m', O: 'q5o', H: 'q5o', I: 'q5i' })[top(S, ['C', 'D', 'M', 'L', 'O', 'H', 'I'])],
  'q6', 'q7', 'q8', 'q9', 'q10',
  S => (top(S, DIMS) === 'C' || top(S, DIMS) === 'I' || top(S, DIMS) === 'O') ? 'q11b' : 'q11a',
  'q12', 'q13', 'q14', 'q15',
];

function sliderResult(v) {
  if (v >= 85) return { w: { L: 2 }, dark: `you said ${v}. honest people don't round themselves up.` };
  if (v >= 60) return { w: { L: 1, C: 1 }, dark: `${v}. so ${100 - v}% of what you told me isn't true. which part?` };
  if (v >= 35) return { w: { H: 1, L: 1 }, dark: `${v}. a safe number. you picked the number that sounds honest.` };
  return { w: { I: 1, D: 1 }, dark: `${v}. a confession dressed up as a joke is still a confession.` };
}

/* ---------- endings: 7 primaries × 10 variants = 70 ---------- */
const VARIANTS = ['C', 'D', 'M', 'O', 'L', 'I', 'H', 'N', 'A', 'R', 'F']; // N night, A absent, R reviser, F fast
const E = `C|D|the quiet curator|everything in its place. everyone too.|you don't raise your voice. you just move things, a chair, a plan, a person, until the room looks the way you pictured it.
C|M|the gentle warden|you call it looking out for people.|everyone around you feels safe, and none of them notice the doors only open from your side.
C|O|the one who counts the forks|you'd notice if one went missing. you'd know who.|you keep inventory: of rooms, of favors, of who said what at dinner in march. it's not a grudge if it's organized.
C|L|the stage manager|nobody sees you. everything goes to plan.|you write the scene, place the people, feed them lines, then stand in the dark and watch it go exactly how you said it would.
C|I|the controlled burn|you only lose it on purpose.|your outbursts look sudden. they aren't. you pick the moment like you pick everything else.
C|H|the one who checks twice|the door is locked. you'll check again.|you don't trust the first time. not the lock, not the message, not the person. especially not the person.
C|N|the night auditor|you go over the day while everyone sleeps.|at night you replay every conversation and grade it. some people passed. you're keeping an eye on the rest.
C|A|the absentee landlord|you run things from somewhere else.|you left this page and it kept going exactly how you wanted. that's how you like everything: running without you in the room.
C|R|the editor of history|it happened the way you remember it. now.|you went back and changed things. small edits. the version you leave behind is always a little better than the one that happened.
C|F|the snap decision|you decided before the question finished.|you answer fast because you already know how it ends. you usually do. you made sure of it.
D|C|the glass observer|close enough to watch. never close enough to touch.|you've arranged your life so nothing can reach you. people are weather. you watch it through the window.
D|M|the pleasant stranger|everyone likes you. no one knows you.|you're easy to talk to and impossible to remember correctly. people leave feeling seen. you leave feeling nothing.
D|O|the collector of exits|you always know where the door is.|you study people the way others study maps. not to get closer. to know how to leave.
D|L|the understudy|you learned feelings by watching other people have them.|you know when to laugh and when to look sad. you're very good at it. you've been practicing.
D|I|the cold spark|you do reckless things and feel nothing after.|other people need a reason. you need a free afternoon. afterwards you sleep fine.
D|H|the long pause|you wait so long people answer for you.|your silence isn't shyness. it's you deciding whether this is worth feeling anything about. usually it isn't.
D|N|the 3am witness|awake while the world is defenseless.|you like the hours when nobody's watching back. you took this test in them. of course you did.
D|A|the one who left the room|you were here. then you weren't.|you looked away from this test and came back like nothing happened. you do that with people too. they notice more than you think.
D|R|the revised stranger|you changed your answers. you change for everyone.|there's a version of you for each person in your life. you just showed me a few of them.
D|F|the unblinking|no hesitation. no reaction.|you answered like none of it touched you. maybe it didn't. that's the part that should worry you.
M|C|the soft hand|you never push. you guide.|people think every decision near you was their own idea. you've never corrected them.
M|D|the warm mask|the smile is real. the warmth is a tool.|you know exactly how much kindness it takes to get what you want, and you never spend a drop more.
M|O|the devoted|you'd do anything for them. that's the problem.|your loyalty is intense, specific, a little too well-researched. you remember their coffee order from four years ago. they never told you.
M|L|the one who rehearses apologies|sorry, in three drafts.|you've practiced being sorry in the mirror. the tears come in on the right line. it works every time.
M|I|the sweet hazard|fun to be around. dangerous to rely on.|you make people feel chosen, then you're gone. they keep the feeling. you keep the leverage.
M|H|the careful smile|you check the room before you laugh.|every expression gets approved before release. likable on purpose, exhausted in private.
M|N|the late-night confidant|people tell you things at 2am they regret by 9.|you're who they call when it's dark. you listen beautifully. you also remember everything.
M|A|the charming absence|you're missed the second you leave. you planned that.|you vanished mid-test and came back. people wait for you like that. you like that they wait.
M|R|the rewrite|you'd change your answer if it made them like you more.|you did change your answers. not for honesty. for how it looks.
M|F|the instant favorite|you read the room in under a second.|you answer fast because you're not choosing what you think. you're choosing what lands.
O|C|the archivist|you keep everything. just in case.|screenshots, receipts, the exact wording of something said in passing. it's not obsession if it's filed properly.
O|D|the one behind the glass|you watch them. they don't watch back.|you know their routines better than they do. you've never said a word to them about it.
O|M|the admirer|you learn people like a language.|you study the people you love until you could finish their sentences. then you start finishing them.
O|L|the one who reads it twice|and once more, for what they really meant.|you reread every message looking for the lie. you find one every time. sometimes you put it there.
O|I|the spiral|one thought. then it's 4am.|your mind doesn't wander. it hunts. it grabs one small detail and doesn't let go until there's nothing left of it.
O|H|the rehearser|you've had this conversation eleven times already.|every hard talk happens in your head first, every branch mapped. by the time it's real, you know how to win.
O|N|the one still awake|the thoughts get louder after midnight.|you took this when you should be sleeping. something keeps you up, and you'd rather it be this than the other thing.
O|A|the one in the other tab|you left. you were still thinking about it.|you switched away from this page and came back. you always come back. that's kind of your whole thing.
O|R|the drafts folder|everything you almost sent.|you changed answers, went back, looked again. somewhere there's a folder of things you almost said. it's bigger than the one you sent.
O|F|the fixation|you answered fast because you've been thinking about this for years.|your quick answers aren't confidence. they're worn smooth from use.
L|C|the architect of small lies|nothing big. just load-bearing.|you build with little untruths. each one harmless. together they hold up your whole life.
L|D|the blank face|nothing to read. that's the point.|you give people a surface so smooth they see themselves in it and assume it's you.
L|M|the mirror|you become whoever they need.|you reflect people back to themselves so well they fall for it. they're in love with a reflection, and you're holding it.
L|O|the keeper of versions|you remember which story you told to whom.|different people know different you's. you keep the details straight. it's a lot of work. you're very good at it.
L|I|the improviser|you lie fast and feel nothing.|you don't plan your lies. you don't need to. they arrive fully formed and sound better than the truth.
L|H|the one who almost told the truth|it was right there. you swallowed it.|you hesitated on the honest answers. i timed it. the truth was close every time. you picked the other one.
L|N|the night shift|your real self clocks in after dark.|daytime you is polite. the one taking this test at this hour is someone else.
L|A|the alibi|you weren't here. you can prove it.|you looked away mid-test. convenient. if anyone asks, you were somewhere else for the bad parts.
L|R|the revisionist|you changed your answers. the new ones are lies too.|you went back to fix how you looked. i kept the originals.
L|F|the natural|lying is just talking, for you.|you answered fast and smooth. honest people stumble. you didn't.
I|C|the leash|you hold yourself back with both hands.|the calm is effort. under it is something that wants to press every button in the room.
I|D|the shrug|consequences happen to other people.|you jump, and if it goes wrong, you shrug. you're not careless. you're just not attached.
I|M|the wildcard|everyone wants you at the party. no one wants you in charge.|you're thrilling right up until you aren't. people chase the feeling and forgive what it costs them.
I|O|the craving|when you want something, it's all you can see.|it starts as curiosity. it ends with you at 3am, forty tabs open, needing it.
I|L|the sudden story|the lie arrives before you decide to tell it.|you don't plan to deceive. it just comes out, faster than the truth would.
I|H|the flinch|you almost did it. you still think about it.|you pull back at the last second, every time. what scares you isn't the thing. it's how close you got.
I|N|the 2am decision|nothing good gets decided at this hour. you decide everything at this hour.|the night makes you brave in ways daylight would talk you out of.
I|A|the vanishing act|gone without a goodbye.|you left this tab like you leave group chats, parties, people. no explanation. you never feel like you owe one.
I|R|the take-back|you act first and undo later.|you changed answers the way you change your mind about people. fast, then fast again.
I|F|the trigger|you answer before you think. so does your temper.|most people take a breath before they act. i measured yours. you didn't.
H|C|the hand on the doorknob|ready to leave. never leaving.|you check everything because if you control the details, nothing can surprise you. something always does.
H|D|the frozen frame|you go still and hope it passes.|when things get hard you stop moving. people think you're calm. you're just waiting it out.
H|M|the people-pleaser|you looked for the answer i wanted.|every option you hovered over, you were asking: which one makes them like me. there was no right one. you still looked.
H|O|the overthinker|the question was simple. you weren't.|you turned every answer over until it stopped meaning anything. then you picked one anyway.
H|L|the one who chooses carefully|careful isn't the same as honest.|you took your time so the answer would look right, not be right. i can tell the difference.
H|I|the held breath|waiting to explode, quietly.|you hesitate because you know what you'd do if you didn't.
H|N|the insomniac jury|you put yourself on trial every night.|you replay your choices at night, defending, prosecuting. the verdict never comes. you took this during the hearing.
H|A|the one who looked away|you couldn't watch yourself answer.|you left this page when it got close. i noticed every time.
H|R|the second guess|your first answer was the true one. you changed it.|you went back. you revised. the version you deleted was you.
H|F|the double take|quick finger. slow regret.|you click fast, then spend the next question wondering if you meant it.`;
const HUE = { C: 212, D: 188, M: 342, O: 36, L: 272, I: 8, H: 96 };
const ENDINGS = E.trim().split('\n').map((ln, i) => {
  const [p, v, title, tagline, text] = ln.split('|');
  const vi = VARIANTS.indexOf(v);
  return { n: i + 1, p, v, title, tagline, text, hue: (HUE[p] + (vi - 5) * 5 + 360) % 360, light: 52 + ((vi * 7) % 5) * 4 };
});

/* ---------- scoring ---------- */
// calibration constants (z-score per dim + signature weights), produced by the-test-tools/calibrate.js
const CAL = {"mean":{"C":5.034,"D":6.813,"M":3.241,"O":4.895,"L":8.054,"I":3.097,"H":5.694},"sd":{"C":2.634,"D":3.035,"M":2.502,"O":2.835,"L":3.095,"I":2.454,"H":2.376},"sig":{"N":0.66,"A":0.324,"R":0.259,"F":1.238}};
function clamp(v, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }
function behaviorAdjust(dims, m) {
  const d = Object.assign({}, dims);
  const avg = m.avgTime;
  d.H += clamp((avg - 3.5) / 5) * 2.6 + Math.min(2.2, m.avgHovers * 0.9) + m.timeouts * 1.2 + Math.min(2, m.deletes * 0.4);
  d.I += clamp((2.6 - avg) / 1.6) * 2.4;
  d.L += Math.min(3, m.changed * 1.2);
  d.O += Math.min(2, m.backs * 0.8);
  d.D += Math.min(3, m.tabs * 1.3) + Math.min(2, m.idles * 0.8);
  if (m.hour < 5) { d.O += 0.8; d.D += 0.8; }
  return d;
}
function sigRaw(m) {
  return { N: m.hour < 5 ? 1 : (m.hour >= 23 ? 0.7 : 0), A: m.tabs + 0.6 * m.idles, R: m.changed + 0.5 * m.backs, F: Math.min(0.8, Math.max(0, 2.4 - m.avgTime)) };
}
function score(dimsRaw, m, cal = CAL) {
  const adj = behaviorAdjust(dimsRaw, m);
  const norm = {}; DIMS.forEach(k => norm[k] = (adj[k] - cal.mean[k]) / cal.sd[k]);
  const order = DIMS.slice().sort((a, b) => norm[b] - norm[a] || DIMS.indexOf(a) - DIMS.indexOf(b));
  const primary = order[0];
  const sr = sigRaw(m);
  const cands = {}; DIMS.filter(k => k !== primary).forEach(k => cands[k] = norm[k]);
  Object.keys(sr).forEach(k => cands[k] = sr[k] * cal.sig[k]);
  let variant = null; Object.keys(cands).forEach(k => { if (variant === null || cands[k] > cands[variant]) variant = k; });
  const ending = ENDINGS.find(e => e.p === primary && e.v === variant);
  return { adj, norm, primary, variant, ending, order, cands };
}
/* ---------- reference population (simulated players, see the-test-tools/ref.js) ---------- */
/*REF*/const REF = {"n":40000,"q":{"C":[-1.911,-1.532,-1.152,-1.152,-1.152,-1.152,-0.772,-0.772,-0.772,-0.772,-0.772,-0.772,-0.393,-0.393,-0.393,-0.393,-0.393,-0.393,-0.393,-0.013,-0.013,-0.013,-0.013,-0.013,-0.013,0.367,0.367,0.367,0.367,0.367,0.746,0.746,0.746,0.746,1.126,1.126,1.126,1.506,1.506,1.885,3.784],"D":[-2.245,-1.586,-1.256,-1.256,-0.993,-0.927,-0.927,-0.927,-0.729,-0.663,-0.597,-0.597,-0.597,-0.499,-0.4,-0.334,-0.268,-0.268,-0.268,-0.169,-0.07,-0.004,0.062,0.062,0.062,0.16,0.259,0.325,0.391,0.424,0.523,0.655,0.721,0.754,0.918,1.05,1.182,1.38,1.676,2.17,5.004],"M":[-1.295,-1.295,-1.295,-0.896,-0.896,-0.896,-0.896,-0.896,-0.896,-0.496,-0.496,-0.496,-0.496,-0.496,-0.496,-0.496,-0.496,-0.496,-0.096,-0.096,-0.096,-0.096,-0.096,-0.096,-0.096,-0.096,0.303,0.303,0.303,0.303,0.303,0.303,0.703,0.703,0.703,1.103,1.103,1.103,1.502,2.302,4.3],"O":[-1.727,-1.374,-1.374,-1.092,-1.021,-1.021,-1.021,-0.739,-0.739,-0.668,-0.668,-0.668,-0.457,-0.386,-0.386,-0.316,-0.316,-0.316,-0.316,-0.104,-0.034,-0.034,-0.034,0.037,0.037,0.037,0.249,0.319,0.319,0.39,0.39,0.601,0.672,0.743,0.743,1.025,1.095,1.377,1.66,2.153,4.481],"L":[-2.279,-1.633,-1.31,-1.31,-0.987,-0.987,-0.987,-0.922,-0.664,-0.664,-0.664,-0.599,-0.599,-0.534,-0.341,-0.341,-0.341,-0.276,-0.276,-0.211,-0.017,-0.017,-0.017,0.047,0.112,0.306,0.306,0.306,0.37,0.435,0.629,0.629,0.693,0.758,0.952,1.016,1.275,1.34,1.663,2.05,4.183],"I":[-1.262,-1.262,-1.262,-1.223,-0.855,-0.855,-0.855,-0.855,-0.855,-0.763,-0.569,-0.447,-0.447,-0.447,-0.447,-0.447,-0.407,-0.276,-0.098,-0.04,-0.04,-0.04,-0.04,-0.04,0.053,0.192,0.368,0.368,0.368,0.368,0.458,0.633,0.775,0.775,0.828,1.093,1.183,1.428,1.633,2.259,4.815],"H":[-2.392,-1.691,-1.477,-1.346,-1.215,-1.102,-1.022,-0.938,-0.856,-0.772,-0.692,-0.629,-0.566,-0.503,-0.436,-0.366,-0.292,-0.232,-0.174,-0.113,-0.046,0.023,0.096,0.166,0.238,0.31,0.384,0.465,0.55,0.634,0.718,0.811,0.915,1.03,1.147,1.279,1.443,1.631,1.896,2.281,4.843]},"marg":[0.002,0.087,0.15,0.202,0.243,0.28,0.317,0.352,0.385,0.415,0.447,0.476,0.508,0.545,0.58,0.616,0.654,0.693,0.735,0.772,0.812,0.85,0.897,0.947,0.995,1.05,1.114,1.175,1.234,1.312,1.394,1.481,1.582,1.689,1.814,1.971,2.149,2.384,2.67,3.111,5.321],"latMed":3.19};/*/REF*/
// how clearly this run sits in its ending: primary lead + variant lead
function margin(res) {
  const lead = res.norm[res.order[0]] - res.norm[res.order[1]];
  const cv = Object.values(res.cands).sort((a, b) => b - a);
  return lead + 0.6 * (cv[0] - cv[1]);
}
// position of x within a sorted quantile table -> 0..100
function qpos(tab, x) {
  const n = tab.length - 1;
  if (x <= tab[0]) return 0; if (x >= tab[n]) return 100;
  const eq = tab.map((v, j) => Math.abs(v - x) < 6e-4 ? j : -1).filter(j => j >= 0);
  if (eq.length) return (eq[0] + eq[eq.length - 1]) / 2 / n * 100; // ties: mid-rank
  let i = 0; while (i < n && tab[i + 1] < x) i++;
  const span = tab[i + 1] - tab[i], f = span > 0 ? (x - tab[i]) / span : 0.5;
  return (i + f) / n * 100;
}
function percentile(k, z) { return REF ? Math.max(1, Math.min(99, Math.round(qpos(REF.q[k], z)))) : 50; }
// scaled score 0-100 (mean 50, sd 15), same ordering as the percentile
function scaled(z) { return Math.max(1, Math.min(99, Math.round(50 + 15 * z))); }
function confidence(res) { return REF ? Math.round(58 + 0.39 * qpos(REF.marg, margin(res))) : 75; }

const api = { margin, percentile, scaled, confidence, get REF() { return REF; }, DIMS, DIM_NAME, DIM_CLINICAL, Q, SEQ, top, sliderResult, ENDINGS, score, behaviorAdjust, sigRaw, CAL };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TEST = api;
})(typeof window !== 'undefined' ? window : globalThis);
