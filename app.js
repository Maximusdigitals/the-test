/* the test — runs entirely on this device. no network, no storage except one local "last result" note. */
(() => {
'use strict';
const T = window.TEST;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 60) : ms));
const fmt = s => (Math.round(s * 10) / 10).toFixed(1);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const sessionSeed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
const rnd = mulberry(sessionSeed);
let last = null; try { last = JSON.parse(localStorage.getItem('tt_last') || 'null'); } catch (e) {}

const S = {
  i: 0, hist: [], ans: {}, orders: {}, dims: Object.fromEntries(T.DIMS.map(k => [k, 0])),
  m: { times: [], hovers: 0, changed: 0, backs: 0, tabs: 0, idles: 0, timeouts: 0, deletes: 0, falseMem: false, sure: 0 },
  id: 'TT-' + String(1000 + Math.floor(rnd() * 9000)), started: 0, active: false, misremembered: false, word: '',
};
S.answerText = id => S.ans[id];
const addW = (w, sign = 1) => Object.keys(w || {}).forEach(k => S.dims[k] += sign * w[k]);

/* ---------------- phase + chrome ---------------- */
const TITLES = ['the test — find your archetype', 'the test — find your archetype', 'intake · the test', 'case file · subject ' + S.id, 'i see you', 'i see you', 'subject file · ' + S.id];
const BRAND = ['the test', 'the test', 'the test · intake', 'case file ' + S.id, 'the test', '', 'subject file'];
const THEME = ['#f4efe7', '#f4efe7', '#e9edf0', '#1e1b18', '#060606', '#060606', '#0d0e10'];
let phase = 0;
function setPhase(p) {
  phase = p; document.body.dataset.phase = String(p);
  document.title = TITLES[p]; $('#brand').textContent = BRAND[p];
  $('meta[name="theme-color"]').setAttribute('content', THEME[p]);
  $('#prog').hidden = !(p >= 1 && p <= 4);
}
function setProgress(label, frac) { $('#progLabel').textContent = label; $('#progBar').style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + '%'; }
function progressFor(n) { // n = 1-based question number
  if (phase === 1) setProgress(`question ${n} of 15`, n / 15);
  else if (phase === 2) setProgress(`field ${String(n).padStart(2, '0')} / 15`, n / 15);
  else if (phase === 3) {
    if (n === 9 && !S.progBack) { // the bar goes backwards, once
      S.progBack = true; setProgress('question 9 of 15', 9 / 15);
      setTimeout(() => setProgress('question 9 of 21', 9 / 21), reduced ? 0 : 1600);
    } else setProgress(`question ${n} of 21`, n / 21);
  } else if (phase === 4) setProgress(n === 15 ? 'question 15 of 15' : `question ${n} of —`, n === 15 ? 1 : 0.97);
}
let toastT;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }

/* ---------------- behaviour tracking (in memory only) ---------------- */
let lastInput = Date.now(), idleFlag = false, curQ = null;
['pointermove', 'pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(ev => addEventListener(ev, () => { lastInput = Date.now(); if (idleFlag) { idleFlag = false; } }, { passive: true }));
setInterval(() => {
  if (!S.active || !curQ || curQ.answered) return;
  if (!idleFlag && Date.now() - lastInput > 9000) {
    idleFlag = true; S.m.idles++;
    const n = $('.nudge'); if (!n) return;
    n.textContent = phase === 1 ? 'take your time 🌿' : phase === 2 ? 'session idle · logged' : phase === 3 ? 'take your time. i\'m timing it.' : 'i can wait. i\'m very good at waiting.';
    n.classList.add('on');
  }
}, 1000);
document.addEventListener('visibilitychange', () => {
  if (!S.active) return;
  if (document.hidden) { S.m.tabs++; if (curQ && !curQ.answered) curQ.away = (curQ.away || 0) + 1; if (phase >= 3) document.title = phase === 3 ? 'subject left the room' : 'come back'; }
  else {
    document.title = TITLES[phase];
    const n = S.m.tabs;
    const msg = phase === 1 ? 'welcome back ✨' : phase === 2 ? `logged: attention lapse (${n})` : phase === 3 ? `you looked away. that's ${n}.` : (n > 1 ? `that's ${n} times. what were you checking?` : 'you can leave. i\'ll still be here.');
    setTimeout(() => toast(msg, 3200), 400);
  }
});

/* ---------------- glitch (phase 3+) ---------------- */
const GLY = { a: 'ä', e: 'ē', i: 'ı', o: 'ø', u: 'ü', s: 'ş', t: 'ţ', n: 'ñ', r: 'ŗ', y: 'ÿ', c: 'ç' };
setInterval(() => {
  if (reduced || phase < 3 || phase > 4) return;
  const el = $('.q-prompt'); if (!el || Math.random() < 0.45) return;
  el.classList.remove('jit'); void el.offsetWidth; el.classList.add('jit');
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  const node = nodes[Math.floor(Math.random() * nodes.length)]; if (!node) return;
  const orig = node.nodeValue, ch = orig.split(''), idx = Math.floor(Math.random() * ch.length);
  if (!GLY[ch[idx]]) return; ch[idx] = GLY[ch[idx]]; node.nodeValue = ch.join('');
  setTimeout(() => { if (node.nodeValue === ch.join('')) node.nodeValue = orig; }, 180);
}, 900);

/* ---------------- iris (phase 4) follows you ---------------- */
(function iris() {
  const g = $('#irisLines'); let s = '';
  for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, r1 = 24 + (k % 3) * 2, r2 = 58 + (k % 5) * 6; s += `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}"/>`; }
  g.innerHTML = s;
  const pupil = $('#pupil'); let tx = 0, ty = 0, x = 0, y = 0, px = innerWidth / 2, py = innerHeight / 2;
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });
  (function loop(t) {
    requestAnimationFrame(loop);
    if (phase < 4 || phase > 5) return;
    tx = (px / innerWidth - 0.5) * 18; ty = (py / innerHeight - 0.5) * 18;
    if (reduced) { x = tx; y = ty; } else { x += (tx - x) * 0.04; y += (ty - y) * 0.04; }
    const dil = 1 + 0.06 * Math.sin((t || 0) / 1600) + (curQ && !curQ.answered ? Math.min(0.35, (performance.now() - curQ.t0) / 30000) : 0);
    pupil.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${dil.toFixed(3)})`);
  })();
})();

/* ---------------- typing ---------------- */
async function typeText(el, text, speed = 20) {
  if (reduced) { el.textContent = text; return; }
  el.textContent = '';
  for (let k = 0; k < text.length; k++) { el.textContent += text[k]; await new Promise(r => setTimeout(r, text[k] === '.' ? speed * 6 : speed)); }
}

/* ---------------- intro ---------------- */
function intro() {
  setPhase(0);
  app.innerHTML = `<section class="intro screen-in">
    ${last ? '<span class="welcome">welcome back ✨ ready for a fresh reflection?</span>' : ''}
    <p class="eyebrow">a personality reflection</p>
    <h1>find your<br><em>archetype.</em></h1>
    <p class="lede">fifteen gentle questions about how you move through the world. there are no wrong answers. just honest ones.</p>
    <div class="feats"><span><i></i>15 questions</span><span><i></i>about 4 minutes</span><span><i></i>private, on your device</span></div>
    <button class="btn" id="begin" type="button">begin the test</button>
    <p class="fine">no sign-up. your answers never leave this device.</p>
    <blockquote>"knowing yourself is the beginning of all wisdom."</blockquote>
  </section>`;
  $('#begin').onclick = () => { S.started = Date.now(); S.active = true; setPhase(1); showQuestion(); };
}

/* ---------------- question flow ---------------- */
const resolve = i => { const slot = T.SEQ[i]; return typeof slot === 'function' ? slot(S) : slot; };
function orderFor(qid, n) {
  if (!S.orders[qid]) { const o = [...Array(n).keys()]; for (let k = n - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [o[k], o[j]] = [o[j], o[k]]; } S.orders[qid] = o; }
  return S.orders[qid];
}
function buildOptions(qid, q) {
  if (q.type === 'accuse') {
    if (!S.accuseOpts) {
      const pool = S.hist.filter(h => h.i !== null && h.kind === 'choice' && h.phase <= 3);
      const chosen = []; const copy = pool.slice();
      while (chosen.length < 3 && copy.length) chosen.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
      S.accuseOpts = chosen.map((h, k) => {
        const other = chosen[(k + 1) % chosen.length] || h;
        return { t: `"${h.text}"`, w: { H: 1, L: 1 }, dark: other === h ? `that one. you sound very sure for someone who hesitated.` : `that one? funny. i'd have picked "${other.text}".` };
      }).concat([{ t: 'none of them', w: { L: 2 }, dark: 'none of them. that makes four.' }]);
    }
    return S.accuseOpts;
  }
  return q.options;
}

function showQuestion(opts = {}) {
  const qid = resolve(S.i), q = T.Q[qid], n = S.i + 1;
  if (q.phase !== phase) { return transition(q.phase); }
  progressFor(n);
  const options = q.options || q.type === 'accuse' ? buildOptions(qid, q) : null;
  const order = options ? orderFor(qid, options.length) : [];
  const prompt = typeof q.prompt === 'function' ? q.prompt(S) : q.prompt;
  const letters = 'abcd';
  const meta = phase === 1 ? [`question ${n}`, ''] : phase === 2 ? [`field ${String(n).padStart(2, '0')} · ${q.timed ? 'timed response' : q.type === 'slider' ? 'self-report' : 'response required'}`, `subject ${S.id}`] : phase === 3 ? [`exhibit ${String(n).padStart(2, '0')}`, `case ${S.id}`] : ['', ''];
  let evidence = '';
  if (q.type === 'accuse') {
    const lines = [];
    const slow = S.hist.filter(h => h.t).sort((a, b) => b.t - a.t)[0];
    if (slow) lines.push(`you took <span>${fmt(slow.t)}s</span> on "${esc(slow.label)}"`);
    if (S.m.changed) lines.push(`you changed <span>${S.m.changed}</span> answer${S.m.changed > 1 ? 's' : ''}`);
    if (S.m.tabs) lines.push(`you looked away <span>${S.m.tabs}</span> time${S.m.tabs > 1 ? 's' : ''}`);
    if (S.m.hovers > 2) lines.push(`you hovered over <span>${S.m.hovers}</span> answers you didn't pick`);
    if (S.m.falseMem) lines.push(`you accepted an answer you never gave`);
    if (last) lines.push(`last time you were "${esc(last.title)}". you're hoping for a different one`);
    if (lines.length < 2) lines.push('you answered smoothly. smooth is rehearsed');
    evidence = `<div class="evidence">${lines.map(l => `<p>— ${l}.</p>`).join('')}</div>`;
  }
  let body = '';
  if (options) {
    body = `<div class="opts">${order.map((oi, k) => `<button class="opt" type="button" data-i="${oi}">${phase === 2 ? `<span class="opt-code">${letters[k]}</span>` : ''}<span class="opt-mark"></span><span class="opt-t">${esc(options[oi].t)}</span></button>`).join('')}</div>`;
  } else if (q.type === 'slider') {
    body = `<div class="slider-wrap"><div class="slider-val" id="sv">50</div><input type="range" min="0" max="100" value="50" id="sl" aria-label="honesty"><div class="slider-ends"><span>0 · not at all</span><span>100 · completely</span></div><div class="submit-row"><button class="btn" id="slOk" type="button">submit</button></div></div>`;
  } else if (q.type === 'text') {
    body = `<div class="text-wrap"><input class="text-in" id="tx" maxlength="24" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="one word" aria-label="one word"><div class="submit-row"><button class="btn" id="txOk" type="button">that's me</button></div></div>`;
  }
  const timed = q.timed && !opts.original;
  app.innerHTML = `<section class="q screen-in" data-qid="${qid}">
    <div class="q-meta"><span>${meta[0]}</span><span>${meta[1]}</span></div>
    ${phase === 3 ? `<span class="stamp">${n >= 11 ? 'flagged' : 'under review'}</span>` : ''}
    <div class="q-body">
      <h2 class="q-prompt">${esc(prompt)}</h2>
      ${q.sub ? `<p class="q-sub">${esc(q.sub)}</p>` : ''}
      ${evidence}
      ${timed ? `<div class="timer"><i id="timerBar"></i></div><p class="timer-n" id="timerN">${q.timed}s</p>` : ''}
      ${body}
      ${opts.original ? `<p class="misnote">${phase === 3 ? 'you picked this one. remember?' : 'your previous answer is shown.'}</p>` : ''}
    </div>
    <div class="q-foot">${phase >= 2 && phase <= 3 && S.i >= 5 && !opts.original && S.hist.length && S.hist[S.hist.length - 1].phase === phase && !T.Q[S.hist[S.hist.length - 1].qid].timed ? '<button class="back" type="button">← back</button>' : '<span></span>'}<span class="nudge"></span></div>
  </section>${phase === 3 ? recordHTML() : ''}`;

  curQ = { qid, q, t0: performance.now(), enters: 0, answered: false, opts, options, prompt, n };
  idleFlag = false; lastInput = Date.now();

  // hesitation: count mouse hovers over options
  $$('.opt').forEach(b => b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !curQ.answered) curQ.enters++; }));
  $$('.opt').forEach(b => b.addEventListener('click', () => choose(+b.dataset.i)));
  const back = $('.back'); if (back) back.onclick = goBack;

  // misremembered answer on back-navigation
  if (opts.original && options) {
    let shown = opts.original.i;
    if (!S.misremembered && phase === 3) { const others = order.filter(oi => oi !== opts.original.i); shown = others[Math.floor(rnd() * others.length)]; S.misremembered = true; curQ.fake = shown; S.fmN = n; S.fmLabel = q.label; }
    const b = $(`.opt[data-i="${shown}"]`); if (b) b.classList.add('picked');
  }
  if (q.rephrase) curQ.timers = [setTimeout(() => { $$('.opt').forEach(b => { const o = options[+b.dataset.i]; if (!o.later) return; const t = $('.opt-t', b); t.classList.add('swap'); setTimeout(() => { t.textContent = o.later; t.classList.remove('swap'); }, 500); }); curQ.rephrased = true; }, 2600)];
  if (q.moving) setupMoving();
  if (q.fading) setupFading(options);
  if (timed) setupTimer(q.timed);
  if (q.type === 'slider') setupSlider();
  if (q.type === 'text') setupText();
}

function recordHTML() {
  const recs = S.hist.filter(h => h.kind === 'choice' && h.i !== null).slice(-4);
  if (!recs.length) return '';
  if (S.altRec === undefined) S.altRec = Math.floor(rnd() * recs.length);
  return `<aside class="record screen-in"><b>statements on record</b>${recs.map((h, k) => {
    let txt = h.text, cls = '';
    if (k === S.altRec % recs.length && h.alts && h.alts.length) { txt = h.alts[0]; cls = 'alt'; }
    const words = txt.split(' ');
    const red = words.length > 3 && k % 2 === 1 ? words.map((w, j) => j === words.length - 2 ? `<span class="redact">${esc(w)}</span>` : esc(w)).join(' ') : esc(txt);
    return `<p class="${cls}">${String(k + 1).padStart(2, '0')}. "${red}"</p>`;
  }).join('')}</aside>`;
}

function setupMoving() {
  let moves = 0;
  const move = (btn) => {
    if (moves >= 2 || curQ.answered) return; moves++;
    const list = $('.opts'), items = $$('.opt', list);
    const first = items.map(el => el.getBoundingClientRect().top);
    const idx = btn ? items.indexOf(btn) : Math.floor(rnd() * items.length);
    let j = (idx + 1 + Math.floor(rnd() * (items.length - 1))) % items.length;
    const a = items[idx], b = items[j];
    const na = a.nextSibling === b ? a : a.nextSibling; list.insertBefore(a, b); list.insertBefore(b, na);
    if (reduced) return;
    $$('.opt', list).forEach((el, k) => { const old = first[items.indexOf(el)]; const dy = old - el.getBoundingClientRect().top; el.style.transition = 'none'; el.style.transform = `translateY(${dy}px)`; requestAnimationFrame(() => { el.style.transition = ''; el.style.transform = ''; }); });
  };
  $$('.opt').forEach(b => { let t; b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') t = setTimeout(() => move(b), 700); }); b.addEventListener('pointerleave', () => clearTimeout(t)); });
  curQ.timers = [setTimeout(() => move(null), 2400)];
}
function setupFading(options) {
  const keep = options.findIndex(o => o.t === 'i couldn\'t stop');
  const order = $$('.opt').map(b => +b.dataset.i).filter(i => i !== keep);
  curQ.timers = order.map((oi, k) => setTimeout(() => { if (curQ.answered) return; const b = $(`.opt[data-i="${oi}"]`); if (b) b.classList.add('gone'); }, 3200 + k * 2600));
}
function setupTimer(sec) {
  const bar = $('#timerBar'), n = $('#timerN');
  if (!reduced) { bar.style.transition = `transform ${sec}s linear`; requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; })); }
  let left = sec;
  curQ.tick = setInterval(() => { left--; if (n) n.textContent = left > 0 ? `${left}s` : 'time.'; }, 1000);
  curQ.timeout = setTimeout(() => { if (curQ.answered) return; S.m.timeouts++; commitAnswer({ i: null, text: '(no answer)', w: { H: 2 }, dark: 'no answer is an answer. you froze. i wrote that down.', kind: 'timeout' }); }, sec * 1000);
}
function setupSlider() {
  const sl = $('#sl'), sv = $('#sv'); let adj = 0, lastV = 50;
  sl.addEventListener('input', () => { sv.textContent = sl.value; });
  sl.addEventListener('change', () => { if (+sl.value !== lastV) { adj++; lastV = +sl.value; } });
  $('#slOk').onclick = () => {
    const v = +sl.value, r = T.sliderResult(v);
    if (adj > 2) r.w.H = (r.w.H || 0) + 1;
    commitAnswer({ i: v, text: String(v), w: r.w, dark: r.dark + (adj > 2 ? ` you moved it ${adj} times first.` : ''), kind: 'slider', adj });
  };
}
function setupText() {
  const tx = $('#tx'); let dels = 0;
  setTimeout(() => tx.focus({ preventScroll: true }), 300);
  tx.addEventListener('beforeinput', e => { if (/^delete/.test(e.inputType)) dels++; });
  tx.addEventListener('keydown', e => { if (e.key === 'Enter') $('#txOk').click(); });
  $('#txOk').onclick = () => {
    const w = tx.value.trim().toLowerCase().slice(0, 24);
    S.m.deletes += dels; S.word = w;
    let dark, wt;
    if (!w) { dark = 'nothing. you couldn\'t find one word. or you found it and didn\'t like it.'; wt = { H: 2, L: 1 }; }
    else if (dels > 0) { dark = `"${w}". you deleted ${dels} character${dels > 1 ? 's' : ''} first. the version you deleted was closer.`; wt = dels > 2 ? { H: 2, L: 1 } : { H: 1, L: 1 }; }
    else { dark = `"${w}". no edits. you've had that word ready for a while.`; wt = { C: 1, D: 1 }; }
    commitAnswer({ i: 0, text: w || '(blank)', w: wt, dark, kind: 'text', dels });
  };
}
function clearTimers() { if (!curQ) return; clearTimeout(curQ.timeout); clearInterval(curQ.tick); (curQ.timers || []).forEach(clearTimeout); }

function choose(i) {
  if (curQ.answered) return;
  const opt = curQ.options[i];
  const t = (performance.now() - curQ.t0) / 1000;
  const text = curQ.rephrased && opt.later ? opt.later : opt.t;
  const alts = curQ.options.filter((o, j) => j !== i).map(o => o.t);
  const rec = { i, text, w: opt.w, dark: opt.dark, soft: opt.soft, kind: 'choice', alts };
  // re-answer after going back
  if (curQ.opts.original) {
    if (curQ.fake === i) { S.m.falseMem = true; S.m.changed++; rec.fm = true; rec.revised = true; rec.dark = 'that\'s not what you picked the first time. you just believed me.'; }
    else if (curQ.opts.original.i !== i) { S.m.changed++; rec.revised = true; }
    else if (curQ.fake !== undefined) S.fmRejected = true;
  }
  $$('.opt').forEach(b => b.classList.toggle('picked', +b.dataset.i === i));
  const eligible = phase >= 2 && phase <= 4 && !curQ.q.timed && t > 5 && S.m.sure < 3 && curQ.q.type !== 'accuse';
  if (eligible) { askSure(t, rec); return; }
  commitAnswer(rec, t);
}
function askSure(t, rec) {
  curQ.answered = true; clearTimers();
  S.m.sure++;
  const lines = [`you took ${fmt(t)} seconds. that's a long time to pick something you already knew.`,
    `${fmt(t)} seconds. the honest answer usually shows up first. was that it?`,
    curQ.enters > 1 ? `you hovered over ${curQ.enters - 1} other answer${curQ.enters > 2 ? 's' : ''} before this one. ${fmt(t)} seconds.` : `${fmt(t)} seconds. what were you deciding between?`];
  $('#modalText').textContent = lines[(S.m.sure - 1) % lines.length];
  const m = $('#modal'); m.hidden = false;
  $('#modalSure').onclick = () => { m.hidden = true; curQ.answered = false; commitAnswer(rec, t); };
  $('#modalChange').onclick = () => {
    m.hidden = true; S.m.changed++;
    const keepEnters = curQ.enters, t0 = curQ.t0, away = curQ.away;
    showQuestion(curQ.opts); curQ.enters = keepEnters; curQ.t0 = t0; curQ.away = away; curQ.changedFrom = rec.i;
    toast(phase === 2 ? 'logged: answer revised' : phase === 3 ? 'noted. the first one stays on file.' : 'go on. change it. i kept the first one.', 2800);
  };
}

async function commitAnswer(rec, tOverride) {
  if (curQ.answered && rec.kind !== 'choice') return;
  curQ.answered = true; clearTimers();
  const q = curQ.q;
  const t = tOverride !== undefined ? tOverride : (performance.now() - curQ.t0) / 1000;
  const hov = Math.max(0, curQ.enters - 1);
  S.m.hovers += hov;
  const h = Object.assign({ qid: curQ.qid, phase, label: q.label, t, hov, n: curQ.n, prompt: curQ.prompt, away: curQ.away || 0, revised: curQ.changedFrom !== undefined }, rec);
  addW(h.w); S.hist.push(h);
  if (rec.kind === 'choice') S.ans[curQ.qid] = rec.text;
  S.m.times.push(t);
  await showReadback(h);
}

async function showReadback(h) {
  const body = $('.q-body'); const opts = $('.opts, .slider-wrap, .text-wrap, .timer, .timer-n, .misnote', body);
  $$('.opts, .slider-wrap, .text-wrap, .timer, .timer-n, .misnote', body).forEach(el => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; });
  const back = $('.back'); if (back) back.remove();
  await sleep(380);
  $$('.slider-wrap, .text-wrap, .timer, .timer-n, .misnote', body).forEach(el => el.remove());
  const o = $('.opts', body); if (o) { o.style.opacity = '.35'; o.style.pointerEvents = 'none'; $$('.opt:not(.picked)', o).forEach(b => b.style.display = 'none'); }
  const top = Object.entries(h.w || {}).sort((a, b) => b[1] - a[1])[0] || ['H', 1];
  let k, main, small = '';
  if (phase === 1) { k = 'noted ✓'; main = h.soft || 'beautiful. moving on 🌿'; }
  else if (phase === 2) { k = 'logged'; main = `${T.DIM_CLINICAL[top[0]]} · +${top[1]}`; if (S.i >= 6) small = h.dark; else if (h.t > 4) small = `response latency ${fmt(h.t)}s`; }
  else if (phase === 3) { k = h.t > 4 ? `note · ${fmt(h.t)}s` : 'note'; main = h.dark; }
  else { k = ''; main = h.dark; }
  const rb = document.createElement('div'); rb.className = 'rb';
  rb.innerHTML = `${k ? `<p class="rb-k">${esc(k)}</p>` : ''}<p class="rb-t"></p>${small ? `<p class="rb-s">${esc(small)}</p>` : ''}<button class="btn" type="button" style="visibility:hidden">${phase === 1 ? 'next →' : phase === 2 ? 'continue' : phase === 3 ? 'proceed' : 'go on'}</button>`;
  body.appendChild(rb);
  requestAnimationFrame(() => rb.classList.add('on'));
  const tEl = $('.rb-t', rb);
  if (phase >= 3) await typeText(tEl, main, phase === 4 ? 26 : 18); else tEl.textContent = main;
  const btn = $('.btn', rb); btn.style.visibility = 'visible';
  btn.onclick = next; btn.focus({ preventScroll: true });
}

function next() {
  S.i++;
  if (S.i >= T.SEQ.length) return reveal();
  showQuestion();
}
function goBack() {
  if (!S.hist.length || curQ.answered) return;
  clearTimers();
  const prev = S.hist.pop(); addW(prev.w, -1); delete S.ans[prev.qid]; S.m.times.pop(); S.m.hovers -= prev.hov;
  S.m.backs++; S.i--;
  showQuestion({ original: prev });
}

async function transition(p) {
  const T2 = {
    2: ['step two', 'nice. we just need a few more details.', 'this part is standard.', 'continue'],
    3: ['notice', 'your file has been flagged for review.', 'this doesn\'t mean anything. probably.', 'open file'],
    4: ['', 'i\'ll take it from here.', '', 'okay'],
  }[p];
  setPhase(p);
  if (p === 3) setProgress('question 9 of 15', 8 / 15);
  app.innerHTML = `<section class="trans screen-in">${T2[0] ? `<p class="k">${T2[0]}</p>` : ''}<h2></h2>${T2[2] ? `<p>${T2[2]}</p>` : '<p></p>'}<button class="btn" type="button" style="visibility:hidden">${T2[3]}</button></section>`;
  const h = $('.trans h2');
  if (p >= 3) await typeText(h, T2[1], p === 4 ? 55 : 30); else h.textContent = T2[1];
  const b = $('.trans .btn'); b.style.visibility = 'visible'; b.onclick = () => showQuestion();
}

/* ---------------- the end ---------------- */
function metrics() {
  const times = S.m.times.filter(Boolean), avg = times.reduce((a, b) => a + b, 0) / Math.max(1, times.length);
  const d = new Date();
  return { avgTime: avg, avgHovers: S.m.hovers / Math.max(1, times.length), changed: S.m.changed, backs: S.m.backs, tabs: S.m.tabs, idles: S.m.idles, hour: d.getHours(), timeouts: S.m.timeouts, deletes: S.m.deletes };
}
async function reveal() {
  S.active = false; curQ = null; S.ended = Date.now();
  setPhase(5);
  const m = metrics(), res = T.score(S.dims, m);
  S.res = res; S.mm = m;
  try { localStorage.setItem('tt_last', JSON.stringify({ n: res.ending.n, title: res.ending.title })); } catch (e) {}
  const hovLine = S.m.hovers > 2 ? `you hovered over ${S.m.hovers} answers you didn't choose.` : `your slowest answer took ${fmt(Math.max(...S.m.times))} seconds.`;
  const lines = ['that\'s the end.', 'it was never about the answers.', 'it was about how long you took to give them.', hovLine, 'i kept a file.'];
  app.innerHTML = `<section class="reveal">${lines.map((l, k) => `<p class="${k === 1 || k === 2 ? 'big' : ''}">${esc(l)}</p>`).join('')}<button class="btn" type="button">open your file</button></section>`;
  const ps = $$('.reveal p');
  for (const p of ps) { p.classList.add('on'); await sleep(1700); }
  const b = $('.reveal .btn'); b.classList.add('on'); b.onclick = report;
}

function hsl(e, l = e.light, s = 70, a = 1) { return `hsla(${e.hue},${s}%,${l}%,${a})`; }
/* ---------------- the evaluation report ---------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const pad2 = n => String(n).padStart(2, '0');
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const PH_NAME = { 1: 'I · wellness', 2: 'II · intake', 3: 'III · case review', 4: 'IV · ——' };
const RISK = ['low', 'moderate', 'elevated', 'high'], CTRL = ['adequate', 'reduced', 'low', 'absent'];
const lvl = v => v < 40 ? 0 : v < 65 ? 1 : v < 85 ? 2 : 3;
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const dur = sec => `${Math.floor(sec / 60)}m ${pad2(Math.round(sec % 60))}s`;
const redact = (w = 6) => `<span class="rx" style="--w:${w}ch" aria-label="redacted"></span>`;

function analysis() {
  const res = S.res, m = S.mm, e = res.ending;
  const pct = {}, ss = {};
  T.DIMS.forEach(k => { pct[k] = T.percentile(k, res.norm[k]); ss[k] = T.scaled(res.norm[k]); });
  const items = S.hist.slice().sort((a, b) => a.n - b.n);
  const timed = items.filter(h => h.t > 0);
  const tsorted = timed.map(h => h.t).sort((a, b) => a - b);
  const median = tsorted.length ? tsorted[Math.floor(tsorted.length / 2)] : 0;
  const mean = m.avgTime, sd = Math.sqrt(timed.reduce((a, h) => a + (h.t - mean) ** 2, 0) / Math.max(1, timed.length));
  const answered = timed.filter(h => h.kind === 'choice');
  const slow = timed.slice().sort((a, b) => b.t - a.t)[0], fast = answered.slice().sort((a, b) => a.t - b.t)[0];
  const cv = mean ? sd / mean : 0;
  const hesitation = Math.round(clamp(Math.max(0, (mean - 1.2) / 6) * 40 + Math.min(20, m.avgHovers * 10) + Math.min(20, S.m.changed * 7) + S.m.timeouts * 8 + S.m.idles * 4 + Math.min(10, S.m.deletes * 1.5), 1, 99));
  const sliderH = items.find(h => h.kind === 'slider');
  const consistency = Math.round(clamp(100 - 38 * Math.min(1.2, cv) - 9 * S.m.changed - 6 * S.m.backs - (S.m.falseMem ? 18 : 0) - (sliderH && sliderH.adj > 2 ? 6 : 0) - 5 * S.m.timeouts, 4, 98));
  const conf = T.confidence(res);
  const total = ((S.ended || Date.now()) - S.started) / 1000;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const d = new Date(S.started || Date.now()), de = new Date(S.ended || Date.now());
  const caseNo = `7B-${String(d.getFullYear()).slice(2)}${pad2(d.getMonth() + 1)}-${S.id.slice(3)}-${pad2(e.n)}`;
  const risk = [
    ['affect control', 'c', Math.round(0.6 * pct.I + 0.4 * pct.D)],
    ['empathic response', 'c', Math.round(0.7 * pct.D + 0.3 * pct.M)],
    ['manipulative tendency', 'r', Math.round(0.6 * pct.L + 0.4 * pct.M)],
    ['need for control', 'r', pct.C],
    ['fixation / rumination', 'r', Math.round(0.7 * pct.O + 0.3 * pct.H)],
    ['impulse regulation', 'c', pct.I],
    ['decisional paralysis', 'r', Math.max(pct.H, hesitation)],
    ['candor', 'c', Math.round(clamp(0.65 * pct.L + (sliderH ? Math.max(0, sliderH.i - 50) * 0.5 : 10) + S.m.changed * 6, 1, 99))],
    ['reality monitoring', 'c', S.m.falseMem ? 90 : S.misremembered ? 25 : -1],
    ['attention to examiner', 'c', clamp(S.m.tabs * 30 + S.m.idles * 18, 5, 99)],
  ].map(([label, kind, v]) => v < 0 ? { label, word: 'not tested', l: -1 } : { label, l: lvl(v), word: (kind === 'c' ? CTRL : RISK)[lvl(v)], v });
  const flagged = risk.filter(r => r.l >= 2).length;
  return { res, m, e, pct, ss, items, timed, median, mean, sd, slow, fast, hesitation, consistency, conf, total, coarse, d, de, caseNo, risk, flagged, sliderH };
}

function radarSVG(A, size = 300) {
  const c = size / 2, R = size * 0.36, n = T.DIMS.length;
  const pt = (k, v) => { const a = -Math.PI / 2 + k / n * Math.PI * 2; return [c + Math.cos(a) * R * v / 100, c + Math.sin(a) * R * v / 100]; };
  const poly = vs => vs.map((v, k) => pt(k, v).map(x => x.toFixed(1)).join(',')).join(' ');
  let g = '';
  [25, 50, 75, 100].forEach(r => g += `<polygon points="${poly(T.DIMS.map(() => r))}" class="rd-ring${r === 50 ? ' mid' : ''}"/>`);
  T.DIMS.forEach((k, i) => { const [x, y] = pt(i, 100); g += `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rd-ax"/>`; });
  g += `<polygon points="${poly(T.DIMS.map(k => A.ss[k]))}" class="rd-sub"/>`;
  T.DIMS.forEach((k, i) => { const [x, y] = pt(i, A.ss[k]); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" class="rd-dot"/>`; });
  T.DIMS.forEach((k, i) => { const [x, y] = pt(i, 128); const anc = x < c - 8 ? 'end' : x > c + 8 ? 'start' : 'middle'; g += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anc}" class="rd-lb">${T.DIM_NAME[k]}<tspan x="${x.toFixed(1)}" dy="13" class="rd-v">${A.ss[k]}</tspan></text>`; });
  return `<svg class="radar" viewBox="${-size * 0.12} 0 ${size * 1.24} ${size}" role="img" aria-label="trait profile radar chart">${g}</svg>`;
}

function latencySVG(A) {
  const W = 640, H = 190, L = 34, B = 30, top = 14, its = A.items, n = its.length;
  const max = Math.max(8, Math.ceil(Math.max(...its.map(h => h.t || 0)) + 0.5));
  const bw = (W - L - 6) / n, y = t => top + (H - top - B) * (1 - t / max);
  let g = '';
  [0, max / 2, max].forEach(t => g += `<line x1="${L}" x2="${W}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" class="lt-grid"/><text x="${L - 6}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end" class="lt-ax">${fmt(t).replace('.0', '')}s</text>`);
  let ph = 0;
  its.forEach((h, k) => {
    const x = L + k * bw;
    if (h.phase !== ph) { ph = h.phase; g += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${top}" y2="${H - B + 4}" class="lt-ph"/><text x="${(x + 4).toFixed(1)}" y="${top + 9}" class="lt-pn">${['', 'I', 'II', 'III', 'IV'][ph]}</text>`; }
    const cls = h.kind === 'timeout' ? 'to' : h === A.slow ? 'sl' : h === A.fast ? 'fa' : '';
    const t = h.t || 0;
    g += `<rect x="${(x + bw * 0.18).toFixed(1)}" y="${y(t).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${(y(0) - y(t)).toFixed(1)}" class="lt-b ${cls}"><title>Q${h.n} · ${fmt(t)}s</title></rect>`;
    if (h.revised || h.away) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y(t) - 4).toFixed(1)}" text-anchor="middle" class="lt-mk">${h.revised ? '↺' : ''}${h.away ? '◌' : ''}</text>`;
    g += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - B + 16}" text-anchor="middle" class="lt-ax">${h.n}</text>`;
  });
  const ry = y(T.REF ? T.REF.latMed : 3.2);
  g += `<line x1="${L}" x2="${W}" y1="${ry.toFixed(1)}" y2="${ry.toFixed(1)}" class="lt-ref"/>`;
  return `<svg class="latency" viewBox="0 0 ${W} ${H}" role="img" aria-label="response time per question">${g}</svg>`;
}

function impressions(A) {
  const out = [], q = h => `Q${h.n} (“${esc(clip(h.label, 52))}”)`, ref = T.REF ? T.REF.latMed : 3.2;
  const [p1, p2] = A.res.order;
  out.push(`Highest elevation on <b>${T.DIM_CLINICAL[p1]}</b> (SS ${A.ss[p1]}, ${ord(A.pct[p1])} percentile), followed by ${T.DIM_CLINICAL[p2]} (SS ${A.ss[p2]}, ${ord(A.pct[p2])}). ${A.pct[p1] >= 85 ? 'Elevation exceeds the reference range.' : 'Elevation is within range, which is not reassuring.'}`);
  if (A.slow) {
    if (A.slow.kind === 'timeout') out.push(`Subject let the timer expire on ${q(A.slow)} and gave no answer. Response withheld for <b>${fmt(A.slow.t)}s</b>.`);
    else out.push(`Subject took <b>${fmt(A.slow.t)}s</b> on ${q(A.slow)}, ${fmt(A.slow.t / ref)}× the reference median, then chose “${esc(clip(A.slow.text, 60))}”.${A.slow.hov ? ` ${A.slow.hov} other option${A.slow.hov > 1 ? 's were' : ' was'} considered first.` : ''}`);
  }
  if (A.fast && A.fast !== A.slow) {
    const words = String(A.fast.prompt || A.fast.label).split(/\s+/).length, read = Math.max(0.8, words * 0.24);
    out.push(`Fastest response: <b>${fmt(A.fast.t)}s</b> on ${q(A.fast)}, “${esc(clip(A.fast.text, 50))}”. ${A.fast.t < read ? `Estimated reading time for this item is ${fmt(read)}s. The answer came before the question was finished.` : 'Consistent with a rehearsed answer.'}`);
  }
  if (S.m.falseMem) out.push(`When shown a <b>falsified record</b> of Q${S.fmN}, subject accepted the altered answer as their own. Reality monitoring: compromised.`);
  else if (S.misremembered) out.push(`Shown a falsified record of Q${S.fmN}, subject ${S.fmRejected ? 'restored the original answer' : 'chose a third option entirely'}. Subject remembers what they said. Subject checks.`);
  else out.push(`False-memory probe not administered: subject never returned to a previous item (0 back-navigations).`);
  if (S.m.changed) out.push(`<b>${S.m.changed}</b> answer${S.m.changed > 1 ? 's' : ''} revised after initial selection. Originals retained on file.`);
  if (A.sliderH) out.push(`Self-rated honesty: <b>${A.sliderH.i}/100</b>${A.sliderH.adj ? ` (adjusted ${A.sliderH.adj}× before submitting)` : ''}. Impression management at the ${ord(A.pct.L)} percentile.${A.sliderH.i >= 70 && A.pct.L >= 60 ? ' The two figures are not compatible.' : A.sliderH.i < 50 ? ' Subject volunteered dishonesty. This is itself a strategy.' : ''}`);
  const acc = A.items.find(h => h.qid === 'q13');
  if (acc) out.push(`Asked which earlier answer was a lie, subject named ${esc(acc.text)}${acc.t ? ` after ${fmt(acc.t)}s` : ''}.`);
  out.push(S.word ? `Self-description: “${esc(S.word)}”. ${S.m.deletes ? `${S.m.deletes} character${S.m.deletes > 1 ? 's' : ''} deleted before submission.` : 'Typed without correction.'}` : `Self-description: none provided. ${S.m.deletes} character${S.m.deletes === 1 ? '' : 's'} typed and deleted.`);
  out.push(S.m.tabs || S.m.idles ? `Subject left the session <b>${S.m.tabs}×</b> and went idle ${S.m.idles}× (9s+ without input). Examiner was not informed why.` : `Subject never looked away across ${dur(A.total)}. Sustained attention under observation.`);
  if (S.m.hovers > 2) out.push(`Pointer tracking recorded <b>${S.m.hovers}</b> options considered and rejected.`);
  return out;
}

function report() {
  setPhase(6);
  const A = analysis(), { e, m } = A;
  S.A = A;
  document.body.style.setProperty('--ec', hsl(e));
  const fld = (k, v, cls = '') => `<div class="fld ${cls}"><dt>${k}</dt><dd>${v}</dd></div>`;
  const tf = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = `${pad2(A.d.getDate())} ${MON[A.d.getMonth()]} ${A.d.getFullYear()}`;
  const idHTML = [
    fld('case no.', A.caseNo), fld('subject', S.id), fld('date of evaluation', dateStr),
    fld('session', `${tf(A.d)} – ${tf(A.de)}`), fld('duration', dur(A.total)), fld('input device', A.coarse ? 'touch · no pointer data' : 'pointer · tracked'),
    fld('instrument', 'form 7-b · 15-item adaptive behavioural battery', 'wide'),
    fld('examiner', `${redact(9)} <small>(automated)</small>`), fld('referral', 'self-referred'), fld('prior sessions', last ? `1 on file (“${esc(clip(last.title, 26))}”)` : 'none on file'),
  ].join('');
  const scales = T.DIMS.map(k => `<tr><td>${T.DIM_CLINICAL[k]}<small>${T.DIM_NAME[k]}</small></td><td>${fmt(A.res.adj[k])}</td><td><b>${A.ss[k]}</b></td><td>${ord(A.pct[k])}</td><td class="sbar"><i style="--v:${A.ss[k]}%" class="${A.pct[k] >= 85 ? 'hi' : ''}"></i></td></tr>`).join('');
  const flag = h => [h.kind === 'timeout' ? 'timed out' : '', h.hov ? `${h.hov} considered` : '', h.revised ? (h.fm ? 'false memory' : 'revised') : '', h.away ? 'looked away' : '', h.kind === 'slider' && h.adj ? `${h.adj} adj.` : '', h.kind === 'text' && h.dels ? `${h.dels} del.` : ''].filter(Boolean).join(' · ');
  const rows = A.items.map(h => `<tr class="${h === A.slow ? 'sl' : h === A.fast ? 'fa' : ''}"><td>${pad2(h.n)}</td><td>${esc(clip(h.label, 64))}<span class="ans">${h.kind === 'slider' ? `${esc(h.text)}/100` : h.kind === 'timeout' ? '— no answer —' : `“${esc(clip(h.text.replace(/^"|"$/g, ''), 70))}”`}</span>${flag(h) ? `<small class="obs-m">${flag(h)}</small>` : ''}</td><td>${fmt(h.t || 0)}s</td><td>${flag(h) || '—'}</td></tr>`).join('');
  const metric = (k, v, s = '') => `<div class="mt"><dt>${k}</dt><dd>${v}</dd>${s ? `<small>${s}</small>` : ''}</div>`;
  const metricsHTML = [
    metric('mean latency', `${fmt(A.mean)}s`, `median ${fmt(A.median)}s · sd ${fmt(A.sd)}s`),
    metric('hesitation index', `${A.hesitation}<em>/100</em>`, A.hesitation >= 60 ? 'elevated' : A.hesitation >= 35 ? 'moderate' : 'low'),
    metric('response consistency', `${A.consistency}<em>/100</em>`, A.consistency < 50 ? 'unreliable' : A.consistency < 75 ? 'variable' : 'stable'),
    metric('answers revised', String(S.m.changed), `${S.m.backs} back-navigation${S.m.backs === 1 ? '' : 's'}`),
    metric('false memory probe', S.m.falseMem ? 'accepted' : S.misremembered ? 'rejected' : 'n/a', S.misremembered ? `Q${S.fmN}` : 'not administered'),
    metric('honesty self-rating', A.sliderH ? `${A.sliderH.i}<em>/100</em>` : '—', A.sliderH ? `${A.sliderH.adj || 0} adjustment${A.sliderH.adj === 1 ? '' : 's'}` : ''),
    metric('looked away', `${S.m.tabs}×`, `${S.m.idles} idle period${S.m.idles === 1 ? '' : 's'}`),
    metric('timers expired', String(S.m.timeouts), 'of 2 timed items'),
    metric('one-word answer', S.word ? `“${esc(clip(S.word, 14))}”` : '—', `${S.m.deletes} deletion${S.m.deletes === 1 ? '' : 's'}`),
    metric('considered, not chosen', A.coarse && !S.m.hovers ? 'n/a' : String(S.m.hovers), A.coarse ? 'touch device' : 'pointer hovers'),
  ].join('');
  const riskHTML = A.risk.map(r => `<div class="rk l${r.l}"><span>${r.label}</span><i>${[0, 1, 2, 3].map(j => `<b class="${j <= r.l ? 'on' : ''}"></b>`).join('')}</i><em>${r.word}</em></div>`).join('');
  const soft = S.hist.filter(h => h.kind === 'choice' && h.phase === 1);
  const later = S.hist.filter(h => h.kind === 'choice' && h.phase >= 2 && h.phase <= 3);
  const picks = soft.slice().sort(() => rnd() - 0.5).slice(0, 2).concat(later.slice().sort(() => rnd() - 0.5).slice(0, 1)).sort((a, b) => a.n - b.n);
  const quotes = picks.map(h => `<tr><td>Q${pad2(h.n)}</td><td>“${esc(h.text)}”</td><td>${esc(h.dark)}</td></tr>`).join('');
  const disp = A.flagged >= 5 ? 'release not recommended' : A.flagged >= 3 ? 'continued observation' : 'monitor. subject is aware of being monitored.';
  app.innerHTML = `<article class="file rep screen-in">
    <header class="rep-head">
      <div class="lh"><span class="lh-mark"></span><div><b>office of behavioural review</b><small>division ${redact(5)} · records unit</small></div></div>
      <div class="lh-r"><b>form 7-b</b><small>rev. 3 · page 1 of 1</small></div>
    </header>
    <h1 class="rep-title">psychological evaluation report</h1>
    <p class="rep-sub">behavioural measures recorded on subject's own device · not for distribution</p>
    <section class="rs"><h3><i>01</i> identifying information</h3><dl class="ident">${idHTML}</dl></section>
    <section class="rs cls">
      <span class="stamp-conf" aria-hidden="true">confidential</span>
      <h3><i>02</i> classification</h3>
      <div class="cls-grid"><canvas id="sig" width="400" height="400"></canvas><div>
        <p class="cls-k">classification · ending ${e.n} of 70</p>
        <h2 class="cls-t">${esc(e.title)}</h2>
        <p class="cls-tag">${esc(e.tagline)}</p>
        <div class="conf"><span>match confidence</span><i><b style="--v:${A.conf}%"></b></i><strong>${A.conf}%</strong></div>
        <p class="cls-meta">primary: ${T.DIM_NAME[e.p]} · modifier: ${e.v.length === 1 && T.DIM_NAME[e.v] ? T.DIM_NAME[e.v] : { N: 'nocturnal', A: 'absent', R: 'reviser', F: 'fast' }[e.v]}</p>
      </div></div>
    </section>
    <section class="rs"><h3><i>03</i> scale scores <small>ss: mean 50, sd 15 · percentile vs reference population (n=${T.REF ? T.REF.n.toLocaleString() : '—'})</small></h3>
      <div class="sc-grid">${radarSVG(A)}
        <table class="scales"><thead><tr><th>scale</th><th>raw</th><th>ss</th><th>%ile</th><th></th></tr></thead><tbody>${scales}</tbody></table></div>
    </section>
    <section class="rs"><h3><i>04</i> behavioural evidence <small>measured, not self-reported</small></h3>
      <p class="cap">fig. 1 · response latency per item. <span class="k sl">slowest</span> <span class="k fa">fastest</span> <span class="k to">timed out</span> <span class="k rf">reference median ${fmt(T.REF ? T.REF.latMed : 3.2)}s</span> ↺ revised ◌ looked away</p>
      ${latencySVG(A)}
      <dl class="metrics">${metricsHTML}</dl>
      <table class="items"><thead><tr><th>#</th><th>item · response</th><th>time</th><th>observed</th></tr></thead><tbody>${rows}</tbody></table>
    </section>
    <section class="rs"><h3><i>05</i> clinical impressions</h3><ol class="imp">${impressions(A).map(l => `<li>${l}</li>`).join('')}</ol>
      <p class="summary"><b>examiner summary.</b> ${esc(e.text)}</p></section>
    <section class="rs"><h3><i>06</i> risk indicators <small>${A.flagged} of ${A.risk.length} flagged</small></h3><div class="risk">${riskHTML}</div></section>
    <section class="rs"><h3><i>07</i> statements on record, reinterpreted</h3><table class="quotes"><tbody>${quotes}</tbody></table></section>
    <section class="rs det">
      <div><p class="det-k">determination</p><p class="det-t">classification: <b>${esc(e.title)}</b> <span>(1 of 70)</span></p><p class="det-s">match confidence ${A.conf}% · ${A.flagged} risk indicators · disposition: ${disp}</p></div>
      <div class="sig-line"><span class="scrawl">${redact(7)}</span><small>examiner · signed electronically ${tf(A.de)}</small></div>
    </section>
    <p class="rep-foot">case ${A.caseNo} · ${redact(4)} · this page has no copy. you are the copy.</p>
    <div class="card-wrap"><canvas id="card" width="1080" height="1350"></canvas>
      <div class="card-actions"><button class="btn" id="dl" type="button">download report card</button><a class="btn ghost" id="share" target="_blank" rel="noopener">share on x</a></div>
      <p class="card-note">x can't attach images from a link. download the card and add it to your post.</p></div>
    <div class="after"><button class="linkbtn" id="again" type="button">take it again</button> <span>· it'll remember.</span>
      <p class="disclaimer">fiction. a prank. not a psychological assessment, not a diagnosis. scores are relative to simulated players. nothing you did left this device.<br>the test · made by <a href="https://x.com/voidhl" target="_blank" rel="noopener">@voidhl</a></p></div>
  </article>`;
  scrollTo({ top: 0 });
  drawSigil($('#sig').getContext('2d'), 200, 200, 170, e, true);
  drawCard(A);
  const text = `took "the test" and got a full psych evaluation report. classification: "${e.title}" (1 of 70), match confidence ${A.conf}%. it was never about the answers 💀 https://maximusdigitals.github.io/the-test/`;
  $('#share').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
  $('#dl').onclick = () => $('#card').toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `the-test-report-${e.title.replace(/[^a-z0-9]+/g, '-')}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  $('#again').onclick = () => location.reload();
}

/* ---------------- sigils: unique per ending ---------------- */
function drawSigil(c, cx, cy, R, e, bg) {
  const r = mulberry(e.n * 7919 + 13), col = hsl(e), dim = hsl(e, e.light, 60, 0.35);
  const vi = 'CDMOLIHNARF'.indexOf(e.v);
  c.save(); c.translate(cx, cy);
  if (bg) { c.fillStyle = '#121214'; c.beginPath(); c.arc(0, 0, R * 1.17, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  c.shadowColor = hsl(e, e.light, 80, 0.6); c.shadowBlur = R * 0.06;
  const lw = Math.max(1.5, R * 0.018);
  // outer rings + ticks (variant-specific)
  c.lineWidth = lw; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
  c.lineWidth = lw * 0.5; c.strokeStyle = dim; c.beginPath(); c.arc(0, 0, R * 0.9, 0, Math.PI * 2); c.stroke();
  const ticks = 6 + vi * 3; c.lineWidth = lw * 0.7;
  for (let k = 0; k < ticks; k++) { const a = k / ticks * Math.PI * 2, l = k % 3 === 0 ? 0.82 : 0.86; c.beginPath(); c.moveTo(Math.cos(a) * R * l, Math.sin(a) * R * l); c.lineTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); c.stroke(); }
  c.strokeStyle = col; c.lineWidth = lw;
  const poly = (n, rad, rot = -Math.PI / 2, skip = 1) => { c.beginPath(); for (let k = 0; k <= n; k++) { const a = rot + (k * skip) / n * Math.PI * 2; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
  // primary family
  const P = R * 0.7;
  switch (e.p) {
    case 'C': poly(4, P, -Math.PI / 4); poly(4, P * 0.7, 0); c.beginPath(); c.moveTo(-P * 0.5, 0); c.lineTo(P * 0.5, 0); c.moveTo(0, -P * 0.5); c.lineTo(0, P * 0.5); c.stroke(); break;
    case 'D': for (let k = 1; k <= 4; k++) { c.globalAlpha = 1 - k * 0.18; c.beginPath(); c.arc(0, 0, P * k / 4, 0, Math.PI * 2); c.stroke(); } c.globalAlpha = 1; c.beginPath(); c.moveTo(-P, P * 0.15); c.lineTo(P, P * 0.15); c.stroke(); break;
    case 'M': c.beginPath(); c.arc(-P * 0.28, 0, P * 0.55, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(P * 0.28, 0, P * 0.55, 0, Math.PI * 2); c.stroke(); poly(3, P * 0.35, Math.PI / 2); break;
    case 'O': c.beginPath(); for (let k = 0; k < 260; k++) { const a = k * 0.09, rad = P * (k / 260); const x = Math.cos(a) * rad, y = Math.sin(a) * rad; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); break;
    case 'L': poly(3, P, -Math.PI / 2); poly(3, P, Math.PI / 2); c.beginPath(); c.moveTo(0, -P); c.lineTo(0, P); c.stroke(); break;
    case 'I': { const n = 7 + (vi % 3); c.beginPath(); for (let k = 0; k <= n * 2; k++) { const a = -Math.PI / 2 + k / (n * 2) * Math.PI * 2, rad = k % 2 ? P * 0.42 : P; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); break; }
    case 'H': for (let k = 0; k < 5; k++) { const a0 = k * 1.256 + 0.2, rad = P * (0.45 + k * 0.12); c.beginPath(); c.arc(0, 0, rad, a0, a0 + 4.2); c.stroke(); } break;
  }
  // variant star / marks
  const sides = 3 + (vi % 6);
  c.lineWidth = lw * 0.8; c.strokeStyle = hsl(e, Math.min(85, e.light + 18));
  if (sides >= 5) poly(sides, P * 0.48, -Math.PI / 2 + r() * 0.3, 2); else poly(sides, P * 0.4, r() * Math.PI);
  const dots = 3 + vi; c.fillStyle = hsl(e, Math.min(88, e.light + 22));
  for (let k = 0; k < dots; k++) { const a = r() * Math.PI * 2, rad = R * (0.92 + r() * 0.06); c.beginPath(); c.arc(Math.cos(a) * rad, Math.sin(a) * rad, lw * 1.4, 0, Math.PI * 2); c.fill(); }
  // behavior glyphs at center
  c.lineWidth = lw; c.strokeStyle = col; c.fillStyle = col; const g = R * 0.13;
  if (e.v === 'N') { c.beginPath(); c.arc(0, 0, g, 0, Math.PI * 2); c.fill(); c.fillStyle = '#121214'; c.beginPath(); c.arc(g * 0.5, -g * 0.3, g, 0, Math.PI * 2); c.fill(); }
  else if (e.v === 'A') { c.strokeRect(-g * 0.6, -g, g * 1.2, g * 2); c.beginPath(); c.arc(g * 0.3, 0, lw, 0, Math.PI * 2); c.fill(); }
  else if (e.v === 'R') { c.beginPath(); c.arc(0, 0, g, 0.4, Math.PI * 1.8); c.stroke(); c.beginPath(); c.moveTo(g * 0.9, -g * 0.1); c.lineTo(g * 1.1, g * 0.5); c.lineTo(g * 0.4, g * 0.35); c.stroke(); }
  else if (e.v === 'F') { c.beginPath(); c.moveTo(-g * 0.4, -g); c.lineTo(g * 0.2, -g * 0.1); c.lineTo(-g * 0.2, g * 0.1); c.lineTo(g * 0.4, g); c.stroke(); }
  else { // the eye
    c.beginPath(); c.moveTo(-g * 1.4, 0); c.quadraticCurveTo(0, -g * 1.1, g * 1.4, 0); c.quadraticCurveTo(0, g * 1.1, -g * 1.4, 0); c.stroke();
    c.beginPath(); c.arc(0, 0, g * 0.38, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/* ---------------- 1080x1350 card: report excerpt ---------------- */
function wrap(c, text, maxW) { const words = text.split(' '), out = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }
function drawCard(A) {
  const e = A.e;
  const cv = $('#card'), c = cv.getContext('2d', { willReadFrequently: true }), W = 1080, H = 1350;
  const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif', MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';
  const INK = '#151515', MUT = '#6f6d66', PAPER = '#ecebe5', RED = '#a3221b', acc = hsl(e, Math.max(34, e.light - 14), 62);
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.fillStyle = '#0c0c0e'; c.fillRect(0, 0, W, H);
  c.fillStyle = PAPER; c.fillRect(28, 28, W - 56, H - 56);
  // header bar
  c.fillStyle = INK; c.fillRect(28, 28, W - 56, 108);
  c.fillStyle = hsl(e); c.fillRect(28, 136, W - 56, 8);
  c.font = `700 22px ${MONO}`; c.fillStyle = '#e8e6df'; c.fillText('PSYCHOLOGICAL EVALUATION REPORT', 64, 78);
  c.font = `500 18px ${MONO}`; c.fillStyle = '#9a988f'; c.fillText('OFFICE OF BEHAVIOURAL REVIEW · FORM 7-B', 64, 108);
  c.textAlign = 'right'; c.font = `600 20px ${MONO}`; c.fillStyle = '#e8e6df'; c.fillText('CASE ' + A.caseNo, W - 64, 78);
  c.font = `500 18px ${MONO}`; c.fillStyle = '#9a988f'; c.fillText(`ENDING ${String(e.n).padStart(2, '0')} / 70`, W - 64, 108);
  c.textAlign = 'left';
  // identifying line with redaction
  const dateStr = `${String(A.d.getDate()).padStart(2, '0')} ${MON[A.d.getMonth()].toUpperCase()} ${A.d.getFullYear()}`;
  c.font = `600 19px ${MONO}`; c.fillStyle = MUT;
  let x = 64; const seg = (t, gap = 30) => { c.fillText(t, x, 190); x += c.measureText(t).width + gap; };
  seg('SUBJECT ' + S.id); seg('DATE ' + dateStr); seg('DURATION ' + dur(A.total)); seg('EXAMINER', 12);
  c.fillStyle = INK; c.fillRect(x, 172, 140, 24);
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(64, 216); c.lineTo(W - 64, 216); c.stroke();
  // classification
  c.font = `700 19px ${MONO}`; c.fillStyle = MUT; c.fillText('02 · CLASSIFICATION', 64, 262);
  c.font = `400 70px ${SERIF}`; c.fillStyle = INK;
  const tl = wrap(c, e.title, 700).slice(0, 2); tl.forEach((ln, k) => c.fillText(ln, 60, 336 + k * 74));
  let y = 336 + (tl.length - 1) * 74 + 52;
  c.font = `italic 30px ${SERIF}`; c.fillStyle = '#4c4a45';
  const tg = wrap(c, e.tagline, 720).slice(0, 2); tg.forEach((ln, k) => c.fillText(ln, 62, y + k * 38)); y += (tg.length - 1) * 38 + 50;
  c.font = `700 20px ${MONO}`; c.fillStyle = acc; c.fillText(`MATCH CONFIDENCE ${A.conf}%`, 64, y);
  const bx = 64 + c.measureText(`MATCH CONFIDENCE ${A.conf}%`).width + 22; c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(bx, y - 14, 220, 10); c.fillStyle = acc; c.fillRect(bx, y - 14, 220 * A.conf / 100, 10);
  drawSigil(c, 905, 360, 100, e, true);
  // divider
  const dv = 590; c.strokeStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(64, dv); c.lineTo(W - 64, dv); c.stroke();
  c.font = `700 19px ${MONO}`; c.fillStyle = MUT; c.fillText('03 · SCALE PROFILE', 64, dv + 44); c.fillText('06 · RISK INDICATORS', 600, dv + 44);
  // radar
  const cx = 315, cy = 866, R = 140, n = T.DIMS.length, ang = k => -Math.PI / 2 + k / n * Math.PI * 2;
  const P = (k, v) => [cx + Math.cos(ang(k)) * R * v / 100, cy + Math.sin(ang(k)) * R * v / 100];
  const path = vs => { c.beginPath(); vs.forEach((v, k) => { const [px, py] = P(k, v); k ? c.lineTo(px, py) : c.moveTo(px, py); }); c.closePath(); };
  [25, 50, 75, 100].forEach(r => { path(T.DIMS.map(() => r)); c.strokeStyle = r === 50 ? 'rgba(0,0,0,.42)' : 'rgba(0,0,0,.14)'; c.setLineDash(r === 50 ? [6, 6] : []); c.lineWidth = r === 50 ? 2 : 1.5; c.stroke(); });
  c.setLineDash([]);
  T.DIMS.forEach((k, i) => { const [px, py] = P(i, 100); c.strokeStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke(); });
  path(T.DIMS.map(k => A.ss[k])); c.fillStyle = hsl(e, e.light, 62, 0.32); c.fill(); c.strokeStyle = acc; c.lineWidth = 4; c.stroke();
  T.DIMS.forEach((k, i) => { const [px, py] = P(i, A.ss[k]); c.fillStyle = acc; c.beginPath(); c.arc(px, py, 6, 0, Math.PI * 2); c.fill(); });
  T.DIMS.forEach((k, i) => {
    const [px, py] = P(i, 126); c.textAlign = px < cx - 10 ? 'right' : px > cx + 10 ? 'left' : 'center';
    c.font = `600 18px ${MONO}`; c.fillStyle = '#3c3a36'; c.fillText(T.DIM_NAME[k].toUpperCase(), px, py);
    c.font = `700 22px ${MONO}`; c.fillStyle = A.pct[k] >= 85 ? RED : INK; c.fillText(String(A.ss[k]), px, py + 24);
  });
  c.textAlign = 'left';
  // risk flags: top 5 by level
  const flags = A.risk.filter(r => r.l >= 0).slice().sort((a, b) => b.l - a.l || (b.v || 0) - (a.v || 0)).slice(0, 5);
  flags.forEach((r, k) => {
    const fy = dv + 112 + k * 74;
    c.font = `600 21px ${MONO}`; c.fillStyle = INK; c.fillText(r.label.toUpperCase(), 600, fy);
    for (let j = 0; j < 4; j++) { c.fillStyle = j <= r.l ? (r.l >= 2 ? RED : '#3c3a36') : 'rgba(0,0,0,.12)'; c.fillRect(600 + j * 44, fy + 16, 38, 10); }
    c.font = `800 21px ${MONO}`; c.fillStyle = r.l >= 2 ? RED : '#3c3a36'; c.textAlign = 'right'; c.fillText(r.word.toUpperCase(), W - 64, fy + 26); c.textAlign = 'left';
  });
  // 3 key stats
  const sy = 1096; c.strokeStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(64, sy - 26); c.lineTo(W - 64, sy - 26); c.stroke();
  const slowV = A.slow ? (A.slow.kind === 'timeout' ? 'TIMED OUT' : `${fmt(A.slow.t)}s`) : '—';
  const third = S.m.falseMem ? ['FALSE MEMORY', 'ACCEPTED'] : ['CONSISTENCY', `${A.consistency}/100`];
  const stats = [['HESITATION INDEX', `${A.hesitation}/100`, A.hesitation >= 60], ['SLOWEST RESPONSE', slowV, A.slow && A.slow.t > 6, A.slow ? `Q${A.slow.n}` : ''], [third[0], third[1], S.m.falseMem || A.consistency < 50]];
  const bw = (W - 128 - 40) / 3;
  stats.forEach(([lab, val, hot, sub], k) => {
    const bx2 = 64 + k * (bw + 20);
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2; c.strokeRect(bx2 + 1, sy + 1, bw, 118);
    c.font = `700 17px ${MONO}`; c.fillStyle = MUT; c.fillText(lab, bx2 + 22, sy + 38);
    c.font = `500 46px ${SERIF}`; c.fillStyle = hot ? RED : INK; c.fillText(val, bx2 + 22, sy + 96);
    if (sub) { c.font = `600 18px ${MONO}`; c.fillStyle = MUT; c.textAlign = 'right'; c.fillText(sub, bx2 + bw - 18, sy + 96); c.textAlign = 'left'; }
  });
  // footer
  c.font = `500 17px ${MONO}`; c.fillStyle = '#8b8880'; c.fillText('fiction. a prank. not a psychological assessment.', 64, H - 86);
  c.font = `700 20px ${MONO}`; c.fillStyle = INK; c.fillText('the test · by @voidhl', 64, H - 54);
  c.textAlign = 'right'; c.fillStyle = MUT; c.fillText('maximusdigitals.github.io/the-test', W - 64, H - 54); c.textAlign = 'left';
  // confidential stamp
  c.save(); c.translate(830, 528); c.rotate(-0.16); c.globalAlpha = 0.82;
  c.strokeStyle = RED; c.lineWidth = 6; c.strokeRect(-190, -46, 380, 92); c.lineWidth = 2; c.strokeRect(-180, -36, 360, 72);
  c.font = `800 46px ${MONO}`; c.fillStyle = RED; c.textAlign = 'center'; c.fillText('CONFIDENTIAL', 0, 16); c.restore();
  // paper grain
  const id = c.getImageData(0, 0, W, H), d = id.data, r = mulberry(e.n);
  for (let i = 0; i < d.length; i += 4) { const nz = (r() - 0.5) * 14; d[i] += nz; d[i + 1] += nz; d[i + 2] += nz; }
  c.putImageData(id, 0, 0);
}

window.__tt = { S, drawSigil, drawCard, report, get phase() { return phase; } };
intro();
})();
