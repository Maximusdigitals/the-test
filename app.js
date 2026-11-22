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
  if (document.hidden) { S.m.tabs++; if (phase >= 3) document.title = phase === 3 ? 'subject left the room' : 'come back'; }
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

  curQ = { qid, q, t0: performance.now(), enters: 0, answered: false, opts, options };
  idleFlag = false; lastInput = Date.now();

  // hesitation: count mouse hovers over options
  $$('.opt').forEach(b => b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !curQ.answered) curQ.enters++; }));
  $$('.opt').forEach(b => b.addEventListener('click', () => choose(+b.dataset.i)));
  const back = $('.back'); if (back) back.onclick = goBack;

  // misremembered answer on back-navigation
  if (opts.original && options) {
    let shown = opts.original.i;
    if (!S.misremembered && phase === 3) { const others = order.filter(oi => oi !== opts.original.i); shown = others[Math.floor(rnd() * others.length)]; S.misremembered = true; curQ.fake = shown; }
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
    commitAnswer({ i: v, text: String(v), w: r.w, dark: r.dark + (adj > 2 ? ` you moved it ${adj} times first.` : ''), kind: 'slider' });
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
    commitAnswer({ i: 0, text: w || '(blank)', w: wt, dark, kind: 'text' });
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
    if (curQ.fake === i) { S.m.falseMem = true; S.m.changed++; rec.dark = 'that\'s not what you picked the first time. you just believed me.'; }
    else if (curQ.opts.original.i !== i) S.m.changed++;
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
    const keepEnters = curQ.enters, t0 = curQ.t0;
    showQuestion(curQ.opts); curQ.enters = keepEnters; curQ.t0 = t0; curQ.changedFrom = rec.i;
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
  const h = Object.assign({ qid: curQ.qid, phase, label: q.label, t, hov }, rec);
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
  S.active = false; curQ = null;
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
function report() {
  setPhase(6);
  const { ending: e, norm } = S.res, m = S.mm;
  document.body.style.setProperty('--ec', hsl(e));
  const times = S.hist.filter(h => h.t);
  const slow = times.slice().sort((a, b) => b.t - a.t)[0], fast = times.slice().sort((a, b) => a.t - b.t)[0];
  const d = new Date(), tod = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(/\s/g, '') + ' · ' + d.toLocaleDateString([], { weekday: 'long' }).toLowerCase();
  const total = (Date.now() - S.started) / 1000;
  const stat = (k, v, wide) => `<div class="${wide ? 'wide' : ''}"><dt>${k}</dt><dd>${v}</dd></div>`;
  const statsHTML = [
    stat('average time per answer', `${fmt(m.avgTime)}s`),
    stat('time of day', esc(tod)),
    stat('slowest answer', slow ? `${fmt(slow.t)}s on "${esc(slow.label)}"` : '—', true),
    stat('fastest answer', fast ? `${fmt(fast.t)}s on "${esc(fast.label)}"` : '—', true),
    stat('answers considered, not chosen', `${S.m.hovers}${S.m.hovers === 0 ? ' <small>(or you were on a phone)</small>' : ''}`),
    stat('answers changed', String(S.m.changed)),
    stat('times you went back', String(S.m.backs)),
    stat('accepted a false memory', S.m.falseMem ? 'yes' : (S.m.backs ? 'no' : 'not tested')),
    stat('times you looked away', String(S.m.tabs)),
    stat('idle stretches', String(S.m.idles)),
    stat('timers you ran out', String(S.m.timeouts)),
    stat('characters deleted', String(S.m.deletes)),
    stat('total time', `${Math.floor(total / 60)}m ${Math.round(total % 60)}s`),
    stat('self-description', S.word ? `"${esc(S.word)}"` : '—'),
  ].join('');
  const vals = T.DIMS.map(k => norm[k]); const mn = Math.min(...vals), mx = Math.max(...vals);
  const traits = T.DIMS.map(k => { const v = Math.round(12 + 88 * (norm[k] - mn) / Math.max(0.001, mx - mn)); return `<div class="trait"><span>${T.DIM_CLINICAL[k]}</span><i style="--v:${v}%"></i><b>${v}</b></div>`; }).join('');
  // reinterpret the harmless early answers first
  const soft = S.hist.filter(h => h.kind === 'choice' && h.phase === 1);
  const later = S.hist.filter(h => h.kind === 'choice' && h.phase >= 2 && h.phase <= 3);
  const picks = soft.sort(() => rnd() - 0.5).slice(0, 2).concat(later.sort(() => rnd() - 0.5).slice(0, 1));
  const quotes = picks.map(h => `<blockquote><q>you said: "${esc(h.text)}"</q><p>${esc(h.dark)}</p></blockquote>`).join('');
  const nextNote = S.m.changed || S.m.backs ? 'you changed things. the originals are in here too.' : 'you never went back. you never changed a thing. that\'s its own kind of answer.';
  app.innerHTML = `<article class="file screen-in">
    <div class="file-head"><span>subject file · ${S.id}</span><span>ending ${e.n} / 70</span><span>classification: ${esc(T.DIM_NAME[e.p])}</span></div>
    <div class="file-hero"><canvas id="sig" width="400" height="400"></canvas><div><p class="cls-k">archetype</p><h1 class="cls-t">${esc(e.title)}</h1><p class="cls-tag">${esc(e.tagline)}</p></div></div>
    <section class="file-sec"><h3>assessment</h3><p class="write">${esc(e.text)}</p>
      <p class="reveal-note">the questions didn't matter. every option was written to sound bad later. what we measured was how you behaved while answering: how long you took, what you almost picked, what you changed, when you looked away. ${esc(nextNote)}</p></section>
    <section class="file-sec"><h3>measured on your device</h3><dl class="stats">${statsHTML}</dl></section>
    <section class="file-sec"><h3>trait profile (relative)</h3><div class="traits">${traits}</div></section>
    <section class="file-sec"><h3>statements, reinterpreted</h3><div class="quotes">${quotes}</div></section>
    <div class="card-wrap"><canvas id="card" width="1080" height="1350"></canvas>
      <div class="card-actions"><button class="btn" id="dl" type="button">download file</button><a class="btn ghost" id="share" target="_blank" rel="noopener">share on x</a></div>
      <p class="card-note">x can't attach images from a link. download the card and add it to your post.</p></div>
    <div class="after"><button class="linkbtn" id="again" type="button">take it again</button> <span>· it'll remember.</span>
      <p class="disclaimer">fiction. a prank. not a psychological assessment, not a diagnosis. nothing you did left this device.<br>the test · made by <a href="https://x.com/voidhl" target="_blank" rel="noopener">@voidhl</a></p></div>
  </article>`;
  scrollTo({ top: 0 });
  drawSigil($('#sig').getContext('2d'), 200, 200, 170, e, true);
  drawCard(e, m, slow);
  const text = `took "the test" and it classified me as "${e.title}" (ending ${e.n}/70). it was never about the answers 💀 https://maximusdigitals.github.io/the-test/`;
  $('#share').href = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
  $('#dl').onclick = () => $('#card').toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `the-test-${e.title.replace(/[^a-z0-9]+/g, '-')}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
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

/* ---------------- 1080x1350 card ---------------- */
function wrap(c, text, maxW) { const words = text.split(' '), out = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }
function drawCard(e, m, slow) {
  const cv = $('#card'), c = cv.getContext('2d', { willReadFrequently: true }), W = 1080, H = 1350;
  const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif', MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';
  c.fillStyle = '#0c0c0e'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); }
  for (let y = 0; y <= H; y += 40) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
  const glow = c.createRadialGradient(W / 2, 400, 20, W / 2, 400, 520); glow.addColorStop(0, hsl(e, e.light, 70, 0.22)); glow.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = glow; c.fillRect(0, 0, W, H);
  c.fillStyle = hsl(e); c.fillRect(0, 0, W, 10);
  c.font = `600 26px ${MONO}`; c.textBaseline = 'alphabetic';
  c.fillStyle = '#d8d6cf'; c.textAlign = 'left'; c.fillText('SUBJECT FILE · ' + S.id, 64, 74);
  c.fillStyle = hsl(e); c.textAlign = 'right'; c.fillText(`ENDING ${String(e.n).padStart(2, '0')}/70`, W - 64, 74);
  drawSigil(c, W / 2, 380, 230, e, false);
  c.textAlign = 'left';
  c.font = `600 22px ${MONO}`; c.fillStyle = '#7d7b75'; c.fillText('ARCHETYPE', 64, 720);
  c.font = `400 74px ${SERIF}`; c.fillStyle = '#efece5';
  const tl = wrap(c, e.title, W - 128).slice(0, 2); tl.forEach((ln, k) => c.fillText(ln, 60, 798 + k * 80));
  let y = 798 + (tl.length - 1) * 80 + 58;
  c.font = `italic 34px ${SERIF}`; c.fillStyle = hsl(e, Math.min(82, e.light + 14));
  wrap(c, e.tagline, W - 128).slice(0, 2).forEach((ln, k) => c.fillText(ln, 64, y + k * 42));
  const tg = wrap(c, e.tagline, W - 128).slice(0, 2);
  y += (tg.length - 1) * 42 + 56;
  c.font = `400 27px ${SERIF}`; c.fillStyle = '#9d9a92';
  const wl = wrap(c, e.text, W - 128); let k2 = 0;
  while (k2 < wl.length && y + k2 * 38 < 1030) { let ln = wl[k2]; if (k2 < wl.length - 1 && y + (k2 + 1) * 38 >= 1030) ln = ln.replace(/[ .,]*$/, '') + '…'; c.fillText(ln, 64, y + k2 * 38); k2++; }
  // stats grid
  const box = (x, y, w, label, val) => { c.strokeStyle = 'rgba(255,255,255,.12)'; c.strokeRect(x + .5, y + .5, w, 100); c.font = `600 19px ${MONO}`; c.fillStyle = '#7d7b75'; c.fillText(label, x + 22, y + 36); c.font = `500 40px ${SERIF}`; c.fillStyle = '#efece5'; c.fillText(val, x + 22, y + 83); };
  const gy = 1062, bw = (W - 128 - 20) / 2;
  box(64, gy, bw, 'AVG HESITATION', `${fmt(m.avgTime)}s`);
  box(64 + bw + 20, gy, bw, 'SLOWEST ANSWER', slow ? `${fmt(slow.t)}s` : '—');
  box(64, gy + 116, bw, 'ANSWERS CHANGED', String(S.m.changed));
  box(64 + bw + 20, gy + 116, bw, 'LOOKED AWAY', `${S.m.tabs}×`);
  c.font = `600 22px ${MONO}`; c.fillStyle = '#8d8a83'; c.fillText('the test · by @voidhl', 64, H - 34);
  c.textAlign = 'right'; c.fillStyle = '#55534e'; c.fillText('maximusdigitals.github.io/the-test', W - 64, H - 34);
  const id = c.getImageData(0, 0, W, H), d = id.data, r = mulberry(e.n);
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  c.putImageData(id, 0, 0);
}

window.__tt = { S, drawSigil, get phase() { return phase; } };
intro();
})();
