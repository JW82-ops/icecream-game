/* ===== 수빈이네 아이스크림 이야기 v1.0 ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const COIN = '<img src="img/icons/coin.webp" style="height:1em;vertical-align:-0.15em">';
const HEART = '<img src="img/icons/heart.webp" style="height:1em;vertical-align:-0.15em">';

let SCALE = 1;
let S = null;          // 설정
let P = null;          // 현재 프로필
let KID = null;        // KIDS[...]
let D = null;          // 오늘 영업 상태
let screen = 'title';

const DEFAULT_SETTINGS = { pin: null, limit: 20, jiaMax: 10, jianEn: 2, jianDan: 5, sfx: true, music: true, voice: true };

/* ---------------- 화면 맞춤 ---------------- */
let PORTRAIT = false;
function fit() {
  const portrait = window.innerHeight > window.innerWidth * 1.05;
  const W = portrait ? 720 : 1280, H = portrait ? 1280 : 720;
  const st = $('#stage'); st.style.width = W + 'px'; st.style.height = H + 'px'; st.classList.toggle('portrait', portrait);
  if (portrait !== PORTRAIT) { PORTRAIT = portrait; if (P) updateHud(); }
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  SCALE = s; st.style.transform = `scale(${s})`;
  $('#rotate').style.display = 'none';
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 200));

function scenePos(el) {
  const r = el.getBoundingClientRect(), s = $('#scene').getBoundingClientRect(); const k = s.width / 1280;
  return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k };
}
function stagePos(el) {
  const r = el.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
  return { x: (r.left - s.left + r.width / 2) / SCALE, y: (r.top - s.top + r.height / 2) / SCALE };
}

/* ---------------- 공통 UI ---------------- */
function show(id) { $$('.screen').forEach(e => e.classList.toggle('on', e.id === id)); screen = id; }
function toast(html) { const t = h(`<div class="toast">${html}</div>`); $('#stage').appendChild(t); setTimeout(() => t.remove(), 2700); }
function modal(inner, { cls = '', close = false, onClose } = {}) {
  const ov = h(`<div class="ov"><div class="panel ${cls}">${close ? '<button class="btn white x">✕</button>' : ''}${inner}</div></div>`);
  $('#overlay').appendChild(ov);
  const panel = ov.firstElementChild;
  const done = () => { ov.remove(); onClose && onClose(); };
  if (close) panel.querySelector('.x').onclick = () => { Sound.sfx('tap'); done(); };
  panel.close = done;
  return panel;
}
function closeAll() { $('#overlay').innerHTML = ''; }
function floater(x, y, html) { const f = h(`<div class="floater" style="left:${x}px;top:${y}px">${html}</div>`); $('#fx').appendChild(f); setTimeout(() => f.remove(), 1400); }
function confetti(n = 70) {
  const cols = ['#f472b6', '#facc15', '#60a5fa', '#4ade80', '#c084fc', '#fb923c'];
  for (let i = 0; i < n; i++) {
    const c = h(`<i class="confetti" style="left:${rnd(1280)}px;background:${pick(cols)};--dx:${rnd(200) - 100}px;--r:${rnd(720)}deg;animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.6}s"></i>`);
    $('#overlay').appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}
function banner(text, ms = 2600) {
  const b = $('#banner'); b.innerHTML = text; b.classList.remove('off');
  clearTimeout(banner._t); banner._t = setTimeout(() => b.classList.add('off'), ms);
}
function kidPose(p, ms) {
  const k = $('#kid'); if (!k || !KID) return;
  k.src = KID.poses[POSE[p]];
  k.style.height = p === 'jump' ? '300px' : p === 'clap' ? '330px' : '340px';
  k.classList.remove('hop'); if (p === 'jump') { void k.offsetWidth; k.classList.add('hop'); }
  clearTimeout(kidPose._t);
  if (ms) kidPose._t = setTimeout(() => kidPose('idle'), ms);
}
function kidSay(text, ms = 1800) {
  const b = $('#kid-say'); if (!b) return;
  b.textContent = text; b.style.display = 'block';
  clearTimeout(kidSay._t); kidSay._t = setTimeout(() => b.style.display = 'none', ms);
}

/* ---------------- 프로필 ---------------- */
function newProfile(kidKey, theme, shop) {
  return {
    v: 1, kid: kidKey, theme, shop, year: 1, month: 3, day: 1, phase: 'day',
    coins: 100, savings: 0, rep: 0, level: 1,
    flavors: START_FLAVORS.slice(), toppings: [], decor: {}, owned: [],
    adsActive: {}, adsNext: {}, ledger: emptyLedger(), lastLedger: null,
    stats: { customers: 0, sales: 0, quizRight: 0, quizTotal: 0, vip: 0, perfect: 0, months: 0 },
    yearStats: { customers: 0, quizRight: 0 },
    seen: [], stickers: [], trophies: [], quests: null, attend: { last: null, count: 0 },
    time: { date: null, sec: 0 }, pity: false, goals: [], tutorial: true, created: Date.now(),
  };
}
function emptyLedger() { return { sales: 0, tips: 0, quiz: 0, quest: 0, interest: 0, ingredients: 0, ads: 0, research: 0, decor: 0, saved: 0 }; }
function saveP() { if (P) Store.save(P.kid, P); }
function saveS() { Store.save('settings', S); }
function addCoins(n, cat) { P.coins += n; if (cat) P.ledger[cat] = (P.ledger[cat] || 0) + n; updateHud(); }
function spend(n, cat) { if (P.coins < n) return false; P.coins -= n; P.ledger[cat] = (P.ledger[cat] || 0) + n; updateHud(); return true; }
function charm() {
  let c = 0; const placed = Object.values(P.decor);
  placed.forEach(k => c += DECOR[k].charm);
  if (P.theme === 'princess') c = Math.round(c * 1.2);
  COMBOS.forEach(cb => { if (placed.includes(cb.a) && placed.includes(cb.b)) c += cb.bonus; });
  return c;
}
function activeCombos() { const pl = Object.values(P.decor); return COMBOS.filter(cb => pl.includes(cb.a) && pl.includes(cb.b)); }
function season() { return SEASONS[P.month]; }
function levelInfo() { return LEVELS.find(l => l.lv === P.level); }
function nextLevel() { return LEVELS.find(l => l.lv === P.level + 1); }
function timeLeftSec() {
  if (!S.limit) return Infinity;
  if (P.time.date !== today()) { P.time = { date: today(), sec: 0, bonus: 0 }; }
  return S.limit * 60 + (P.time.bonus || 0) - P.time.sec;
}
function isBig() { return P.kid === 'jian'; }
function researchCost(base) { return P.theme === 'space' ? Math.round(base * 0.8) : base; }

/* ---------------- 타이틀 ---------------- */
function renderTitle() {
  show('scr-title'); if (S.music) Sound.music('title');
  const box = $('#profiles'); box.innerHTML = '';
  ['jian', 'jia'].forEach(k => {
    const kid = KIDS[k]; const p = Store.load(k);
    let sub = '새 가게를 열어요!', go = '시작하기 ▶', sleep = false;
    if (p) {
      sub = `${p.shop}<br>${p.year}년차 ${p.month}월 · ${LEVELS.find(l => l.lv === p.level).name}`;
      go = '가게 열기 ▶'; migrate12(p);
      const nr = nextReward(p, k); sub += nr ? `<div class="pstar">🌟 ${p.stars}/${nr.need} · ${nr.icon} ${nr.name}까지 ${Math.max(0, nr.need - p.stars)}개!</div>` : `<div class="pstar">👑 보상을 모두 받았어요!</div>`;
      const t = p.time && p.time.date === today() ? p.time.sec : 0;
      if (S.limit && t >= S.limit * 60 + ((p.time && p.time.date === today() && p.time.bonus) || 0)) { go = '내일 또 만나요 🌙'; sleep = true; }
    }
    const c = h(`<div class="pcard ${sleep ? 'sleep' : ''}" style="--c:${kid.apron}"><img src="${kid.face}"><div><div class="nm">${kid.name}</div><div class="sub">${sub}</div><span class="go">${go}</span></div></div>`);
    c.onclick = () => { Sound.ensure(); Sound.sfx('pop'); openProfile(k); };
    box.appendChild(c);
  });
}

async function openProfile(k) {
  KID = KIDS[k]; P = Store.load(k);
  if (!P) return setupShop(k);
  migrate(P);
  if (timeLeftSec() <= 0) {
    const m = modal(`<div style="width:640px;padding:30px" class="center"><div style="font-size:90px">🌙</div><h2>오늘은 가게 문을 닫았어요</h2>
      <p style="font-size:26px" class="muted">오늘 놀 시간을 다 썼어요.<br>내일 또 만나요! 손님들이 기다릴 거예요.</p>
      <div class="row" style="justify-content:center;gap:16px"><button class="btn small white" id="pp">👨‍👩‍👧 부모님 잠금 해제</button><button class="btn small" id="ok">알겠어요</button></div></div>`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); };
    m.querySelector('#pp').onclick = () => { m.close(); askPin(() => { P.time.bonus = (P.time.bonus || 0) + 10 * 60; saveP(); toast('⏰ 10분 더 놀 수 있어요!'); renderTitle(); }); };
    return;
  }
  await enterShop();
}
function migrate(p) {
  p.ledger = p.ledger || emptyLedger(); p.goals = p.goals || []; p.trophies = p.trophies || [];
  p.time = p.time || { date: null, sec: 0 };
  migrate12(p);
}

/* ---------------- 가게 만들기 ---------------- */
function setupShop(k) {
  const kid = KIDS[k]; show('scr-setup');
  let theme = null, name = kid.defaultShop;
  const sc = $('#scr-setup');
  const step1 = () => {
    sc.innerHTML = `<div class="setup-h">${kid.name} 사장님, 어떤 가게를 열까요?</div><div class="setup-sub">가게마다 특별한 장점이 있어요!</div>
      <div class="themes">${Object.entries(THEMES).map(([key, t]) => `<div class="theme" data-k="${key}"><img src="${t.bg}"><div class="tn">${t.emoji} ${t.name}</div><div class="tp">${t.perk}</div></div>`).join('')}</div>
      <div class="setup-foot"><button class="btn white small" id="back">◀ 처음으로</button><button class="btn" id="next" disabled>다음 ▶</button></div>`;
    $$('.theme', sc).forEach(t => t.onclick = () => {
      Sound.sfx('pop'); theme = t.dataset.k; $$('.theme', sc).forEach(x => x.classList.toggle('sel', x === t)); $('#next', sc).disabled = false;
      if (k === 'jia') Sound.say(THEMES[theme].name);
    });
    $('#back', sc).onclick = () => { Sound.sfx('tap'); renderTitle(); };
    $('#next', sc).onclick = () => { Sound.sfx('tap'); step2(); };
    if (k === 'jia') Sound.say('어떤 가게를 열까요?');
  };
  const step2 = () => {
    const opts = [kid.defaultShop, `${kid.name}의 ${THEMES[theme].name}`, `달콤 ${kid.name} 아이스크림`, `수빈이네 ${kid.name}점`, `${kid.name}랑 아이스크림`];
    sc.innerHTML = `<div class="setup-h">가게 이름을 지어요!</div><div class="setup-sub">골라도 되고, 직접 써도 돼요</div>
      <div class="center" style="margin-top:22px"><input class="name-input" id="nm" maxlength="14" value="${name}"></div>
      <div class="names">${opts.map(o => `<button class="btn white small name-opt">${o}</button>`).join('')}</div>
      <div class="setup-foot"><button class="btn white small" id="back">◀ 뒤로</button><button class="btn yellow" id="go">🎉 가게 열기!</button></div>`;
    $$('.name-opt', sc).forEach(b => b.onclick = () => { Sound.sfx('pop'); $('#nm', sc).value = b.textContent; });
    $('#back', sc).onclick = () => { Sound.sfx('tap'); step1(); };
    $('#go', sc).onclick = async () => {
      name = ($('#nm', sc).value || kid.defaultShop).trim().slice(0, 14) || kid.defaultShop;
      Sound.sfx('level'); P = newProfile(k, theme, name); migrate12(P); saveP(); KID = kid;
      await enterShop(true);
    };
  };
  step1();
}

/* ---------------- 가게 입장 ---------------- */
async function enterShop(first) {
  show('scr-shop'); buildScene(); updateHud(); shutter(true, true);
  if (S.music) Sound.music('shop');
  if (first) await intro();
  await dailyChecks();
  await checkMail(); updateStarHud(); updateHelpHud();
  if (P.phase === 'hub') return openHub(true);
  startDay();
}
async function intro() {
  kidPose('jump', 1600);
  await say(`안녕! 나는 ${KID.name} 사장님이야! 오늘부터 "${P.shop}"을 열어요!`, `손님 주문대로 아이스크림을 만들고, 번 돈으로 가게를 키워 봐요! 🍦`);
}
function say(...lines) {
  return new Promise(res => {
    let i = 0;
    const m = modal(`<div style="width:760px;padding:26px 30px" class="row"><img src="${KID.poses[0]}" style="height:220px"><div style="flex:1"><div id="sayline" style="font-size:30px;line-height:1.4;color:#7a3a62"></div>
      <div style="text-align:right;margin-top:16px"><button class="btn small" id="nx">다음 ▶</button></div></div></div>`);
    const next = () => {
      if (i >= lines.length) { m.close(); res(); return; }
      m.querySelector('#sayline').innerHTML = lines[i];
      if (P.kid === 'jia') Sound.say(lines[i].replace(/<[^>]+>|[🍦🎉✨]/g, ''));
      i++; m.querySelector('#nx').textContent = i >= lines.length ? '좋아! ✨' : '다음 ▶';
    };
    m.querySelector('#nx').onclick = () => { Sound.sfx('tap'); next(); };
    next();
  });
}

/* ---------------- 출석 · 오늘의 퀘스트 ---------------- */
async function dailyChecks() {
  const d = today();
  if (P.attend.last !== d) {
    P.attend.last = d; P.attend.count = (P.attend.count % 7) + 1;
    P.quests = makeQuests(); saveP();
    await showAttendance();
  } else if (!P.quests || P.quests.date !== d) { P.quests = makeQuests(); saveP(); }
}
function showAttendance() {
  return new Promise(res => {
    const c = P.attend.count;
    const m = modal(`<div style="width:820px;padding:26px" class="center"><h2>📅 출석 도장</h2><p class="muted" style="font-size:24px;margin:8px 0 16px">${KID.name} 사장님, 오늘도 와 줘서 고마워요!</p>
      <div class="stamps">${Array.from({ length: 7 }, (_, i) => `<div class="stamp ${i < c ? 'on' : ''}">${i < c ? '💮' : (i === 6 ? '🎁' : i + 1)}</div>`).join('')}</div>
      <div id="att-reward" style="font-size:28px;margin:18px 0 6px;min-height:40px"></div>
      <h2 style="font-size:30px;margin-top:6px">📋 오늘의 퀘스트</h2><div style="display:flex;flex-direction:column;gap:8px;margin:10px 40px">${P.quests.list.map(questHtml).join('')}</div>
      <button class="btn" id="ok" style="margin-top:14px">가게 문 열기! 🍦</button></div>`);
    Sound.sfx('stamp');
    const r = m.querySelector('#att-reward');
    if (c === 7) { const st = giveSticker(); addCoins(100, 'quest'); r.innerHTML = `🎁 7일 출석 선물! ${COIN} 100 + 스티커 ${st || ''}`; confetti(50); Sound.sfx('level'); }
    else { addCoins(10, 'quest'); r.innerHTML = `출석 보너스 ${COIN} +10`; }
    saveP();
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
}
function makeQuests() {
  const big = isBig();
  const T = [
    { id: 'serve', n: big ? 12 : 6, t: n => `손님 ${n}명 받기` },
    { id: 'quiz', n: 3, t: n => `퀴즈 ${n}개 맞히기` },
    { id: 'cone', n: big ? 5 : 3, t: n => `콘 아이스크림 ${n}개 만들기` },
    { id: 'cup', n: big ? 5 : 3, t: n => `컵 아이스크림 ${n}개 만들기` },
    { id: 'earn', n: big ? 120 : 50, t: n => `${n}코인 벌기` },
    { id: 'vip', n: 1, t: n => `⭐ 특별 손님 대접하기` },
    { id: 'perfect', n: big ? 6 : 4, t: n => `한 번에 딱 맞게 ${n}개 만들기` },
  ];
  let pool = Quiz.shuffle(T); const out = [];
  for (const q of pool) { if (out.length >= 3) break; if ((q.id === 'cone' && out.some(o => o.id === 'cup')) || (q.id === 'cup' && out.some(o => o.id === 'cone'))) continue; out.push({ id: q.id, n: q.n, text: q.t(q.n), p: 0, done: false }); }
  return { date: today(), list: out, all: false };
}
function questHtml(q) {
  return `<div class="quest ${q.done ? 'done' : ''}"><span style="font-size:32px">${q.done ? '✅' : '⬜'}</span><div class="qb">${q.text}<div class="qbar"><i style="width:${Math.min(100, q.p / q.n * 100)}%"></i></div></div><span class="muted" style="font-size:20px">${Math.min(q.p, q.n)}/${q.n}</span></div>`;
}
function questProgress(id, amt = 1) {
  if (!P.quests) return;
  P.quests.list.forEach(q => {
    if (q.id !== id || q.done) return;
    q.p += amt;
    if (q.p >= q.n) {
      q.done = true; const r = isBig() ? 30 : 20; addCoins(r, 'quest'); Sound.sfx('good');
      toast(`📋 퀘스트 완료! "${q.text}" ${COIN} +${r}`);
    }
  });
  if (!P.quests.all && P.quests.list.every(q => q.done)) {
    P.quests.all = true; const st = giveSticker();
    setTimeout(() => toast(`🎉 오늘의 퀘스트 모두 완료! 스티커 ${st || '⭐'} 획득!`), 1500);
  }
  updateHud();
}
function giveSticker() {
  const left = STICKERS.filter(s => !P.stickers.includes(s)); if (!left.length) return null;
  const s = pick(left); P.stickers.push(s); return s;
}

/* ---------------- 장면 ---------------- */
function buildScene() {
  $('#bg').src = THEMES[P.theme].bg;
  $('#kid').src = KID.poses[0]; $('#kid').classList.add('bob');
  $('#h-face').src = KID.face; $('#h-name').textContent = P.shop;
  renderDecor(); $('#custs').innerHTML = ''; $('#make-btn').classList.add('hidden');
}
function renderDecor() {
  const L = $('#decor-layer'); L.innerHTML = '';
  Object.entries(P.decor).forEach(([slot, key]) => {
    const sl = SLOTS[slot]; if (!sl || P.level < sl.level) return;
    const d = DECOR[key];
    const im = h(`<img class="decor ${d.type}" src="img/decor/${key}.webp" style="left:${sl.x}px;top:${sl.y}px;max-height:${sl.h}px;max-width:${sl.w}px;z-index:${sl.kind === 'wall' ? 1 : Math.round(sl.y)}">`);
    if (slot === 'F1') { im.style.zIndex = 800; }
    L.appendChild(im);
  });
}
function updateHud() {
  if (!P) return;
  $('#h-coins').innerHTML = `<img src="img/icons/coin.webp"> ${P.coins}`;
  const lv = levelInfo(), nx = nextLevel();
  $('#h-lv').textContent = `Lv.${P.level} ${lv.name}`;
  const pct = nx ? clamp((P.rep - lv.need) / (nx.need - lv.need), 0, 1) : 1;
  $('#h-repbar i').style.width = `${pct * 100}%`;
  $('#h-repnum').textContent = nx && !nx.locked ? `${P.rep} / ${nx.need}` : `${P.rep}`;
  $('#h-date').innerHTML = `${P.year}년차 ${P.month}월 ${P.day}일 ${SEASON_INFO[season()].emoji}`;
  updatePInfo(); updateStarHud(); updateHelpHud();
  const qd = P.quests ? P.quests.list.filter(q => !q.done).length : 0;
  $('#h-quest .dot').textContent = qd; $('#h-quest .dot').style.display = qd ? 'block' : 'none';
}
function updatePInfo() {
  if (!PORTRAIT || !P) return;
  const t = $('#p-today');
  t.innerHTML = D ? `<div class="pi-row"><div>🧍<b>${D.served}</b><span>받은 손님</span></div><div>${COIN}<b>${D.earned}</b><span>오늘 번 돈</span></div><div>${HEART}<b>${D.hearts}</b><span>하트</span></div><div>⏳<b>${D.queue.length}</b><span>기다리는 손님</span></div></div>`
    : `<div class="center muted" style="font-size:28px;padding:14px">🏪 가게 준비 중</div>`;
  const q = $('#p-quests'); const key = JSON.stringify(P.quests && P.quests.list.map(x => x.p));
  if (q._k !== key) { q._k = key; q.innerHTML = P.quests ? `<div class="sect" style="font-size:24px;margin:4px 6px">📋 오늘의 퀘스트</div>${P.quests.list.map(questHtml).join('')}` : ''; }
}
function updateClock() {
  if (!D) return;
  const f = clamp(D.t / D.len, 0, 1); $('#h-clockbar i').style.width = `${f * 100}%`;
  const mins = OPEN_HOUR * 60 + Math.floor(f * (CLOSE_HOUR - OPEN_HOUR) * 60 / 10) * 10;
  const hh = Math.floor(mins / 60), mm = String(mins % 60).padStart(2, '0');
  $('#h-time').textContent = f >= 1 ? '마감!' : `${hh < 12 ? '오전' : '오후'} ${hh > 12 ? hh - 12 : hh}:${mm}`;
}

/* ---------------- 셔터 · 축하 ---------------- */
function shutter(down, instant) {
  const s = $('#shutter'); if (!s) return;
  if (P) $('#shutter .sname').textContent = P.shop;
  $('#shutter .open').textContent = down ? 'CLOSED · 준비 중' : 'OPEN';
  s.style.transition = instant ? 'none' : 'transform 1.1s cubic-bezier(.6,.05,.3,1)';
  s.style.transform = down ? 'translateY(0)' : 'translateY(-102%)';
  if (!instant) Sound.sfx('shutter');
}
async function parade() {
  const who = (P.seen.length ? P.seen : ['grandma', 'boy', 'cat', 'mom']).slice(-8);
  const els = who.map((t, i) => {
    const gap = Math.min(150, 1040 / Math.max(1, who.length)); const x = 640 - (who.length - 1) * gap / 2 + i * gap;
    const e = h(`<div class="cust parade" style="transform:translate(${x}px,712px) translate(-50%,-100%) scale(.85);z-index:${800 + i}"><img class="body" src="${custImg(t, true)}" style="height:${CUSTOMERS[t].h}px;animation-delay:${i * 0.09}s"></div>`);
    $('#custs').appendChild(e); return e;
  });
  kidPose('clap'); Sound.sfx('cheer'); confetti(90);
  await wait(2300);
  return () => els.forEach(e => e.remove());
}

/* ---------------- 하루 영업 ---------------- */
function customersToday(weather) {
  let base = isBig() ? 11 : 8;
  base += (P.level - 1) * 3 + Math.floor(charm() / 25) + (up('expand') ? 3 : 0);
  let m = SEASON_INFO[season()].mult * weather.mult;
  if (P.theme === 'beach' && season() === '여름') m *= 1.5;
  if (P.theme === 'forest') m *= 1.1;
  let ad = 0; Object.keys(P.adsActive || {}).forEach(k => { ad += k === 'sns' ? ADS.sns.boost + charm() / 300 : (ADS[k].boost || 0); });
  m *= 1 + ad;
  return clamp(Math.round(base * m), 5, isBig() ? 32 : 22);
}
function pickWeather() {
  const s = season(); const pool = WEATHER.filter(w => !w.seasons || w.seasons.includes(s));
  const tot = pool.reduce((a, w) => a + w.w, 0); let r = Math.random() * tot;
  for (const w of pool) { r -= w.w; if (r <= 0) return w; } return pool[0];
}
function startDay() {
  closeAll();
  const saved = P.dayState && P.dayState.key === dayKey() ? P.dayState : null;
  if (saved) return resumeDay(saved);
  const weather = pickWeather();
  const n = customersToday(weather);
  const len = isBig() ? 120 : 105;
  const spawns = makeSpawns(n, len);
  const vipChance = P.level >= 3 ? 1 : 0.75;
  const vipIdx = Math.random() < vipChance ? 1 + rnd(Math.max(1, spawns.length - 2)) : -1;
  const events = [];
  if (P.day === 1) { if (P.adsActive.influencer) events.push('influencer'); if (P.adsActive.magazine) events.push('reporter'); if (P.adsActive.tv) events.push('host'); }
  D = { t: 0, len, spawns, nextSpawn: 0, total: spawns.length, served: 0, earned: 0, hearts: 0, left: 0, queue: [], all: [], weather, vipIdx,
        running: true, paused: false, ended: false, orderOpen: false, combo: 0, fever: 0, events, sisCame: false };
  $('#scene').classList.remove('fever'); const fb = $('#fever-bar'); if (fb) fb.style.display = 'none';
  if (P.day === 1 && Object.keys(P.adsActive).some(k => ['magazine', 'tv'].includes(k) && !(P.adsShown || {})[k])) { D.paused = true; setTimeout(() => adEvents().then(() => { if (D) D.paused = false; }), 900); }
  $('#custs').innerHTML = '';
  updateHud(); updateClock(); kidPose('idle');
  if (S.music) Sound.music('shop');
  shutter(true, true); setTimeout(() => shutter(false), 450);
  banner(`${P.month}월 ${P.day}일 · ${weather.emoji} ${weather.name}`, 2600);
  setTimeout(() => { if (D && D.t < 5) banner(`오늘 손님은 약 ${D.total}명! 점심·하교 시간엔 러시! 🍦`, 2400); }, 2800);
  seasonFx(weather);
  if (P.adsActive && Object.keys(P.adsActive).length && P.day === 1) setTimeout(() => toast(`📣 홍보 효과로 손님이 늘었어요!`), 5200);
  saveDay();
}
function dayKey() { return `${P.year}-${P.month}-${P.day}`; }
const DAY_FIELDS = ['t', 'len', 'spawns', 'nextSpawn', 'total', 'served', 'earned', 'hearts', 'left', 'weather', 'vipIdx', 'combo', 'maxCombo', 'events', 'sisCame'];
function saveDay() {
  if (!P || !D || D.ended) return;
  const st = { key: dayKey() }; DAY_FIELDS.forEach(k => st[k] = D[k]);
  // 가게 안에 있던 손님은 다시 들어오게
  const inside = D.queue.filter(c => !c.served).length;
  st.nextSpawn = Math.max(0, D.nextSpawn - inside);
  st.spawns = D.spawns.slice(); for (let i = st.nextSpawn; i < D.nextSpawn; i++) st.spawns[i] = Math.min(st.spawns[i], D.t + 1.5 + (i - st.nextSpawn) * 1.5);
  if (D.vipIdx >= st.nextSpawn && D.vipIdx < D.nextSpawn) st.vipIdx = D.vipIdx;
  P.dayState = st; saveP();
}
function resumeDay(st) {
  D = Object.assign({ queue: [], all: [], running: true, paused: false, ended: false, orderOpen: false, fever: 0 }, JSON.parse(JSON.stringify(st)));
  delete D.key;
  $('#scene').classList.remove('fever'); const fb = $('#fever-bar'); if (fb) fb.style.display = 'none';
  $('#custs').innerHTML = '';
  updateHud(); updateClock(); kidPose('idle');
  if (S.music) Sound.music('shop');
  shutter(true, true); setTimeout(() => shutter(false), 450);
  banner(`▶ 이어서 장사해요! ${P.month}월 ${P.day}일 ${$('#h-time').textContent}`, 2600);
  seasonFx(D.weather);
}

let lastT = 0, flakeT = 0;
function loop(ts) {
  const dt = Math.min(0.1, (ts - lastT) / 1000 || 0) * (window.__speed || 1); lastT = ts;
  if (screen === 'scr-shop' && P) {
    if (!document.hidden) { if (P.time.date !== today()) P.time = { date: today(), sec: 0, bonus: 0 }; P.time.sec += dt; }
    if (D && D.running && !D.paused) tick(dt);
    flakeT -= dt; if (flakeT <= 0 && D) { flakeT = D.weather.key === 'snow' || D.weather.key === 'party' ? 0.45 : 1.3; spawnFlake(); }
  }
  requestAnimationFrame(loop);
}
function tick(dt) {
  const clockRuns = !(D.orderOpen && !isBig()) && !D.quizOpen;
  if (clockRuns && D.t < D.len) D.t = Math.min(D.len, D.t + dt);
  updateClock();
  const maxQ = maxQueue(); feverTick(dt);
  if (rushNow() !== D.rush) { D.rush = rushNow(); if (D.rush) { banner(D.t / D.len < 0.5 ? '🍱 점심 러시! 손님이 몰려와요!' : '🎒 하교 러시! 손님이 몰려와요!', 2200); Sound.sfx('door'); } }
  if (D.nextSpawn < D.spawns.length && D.t >= D.spawns[D.nextSpawn] && D.queue.length < maxQ) { spawnCustomer(D.nextSpawn === D.vipIdx); D.nextSpawn++; }
  // 마감 후 남은 손님이 없으면 끝
  if (D.t >= D.len && D.nextSpawn < D.spawns.length && D.queue.length < maxQ) { spawnCustomer(false); D.nextSpawn++; }
  D.queue.forEach((c, i) => {
    const tx = 520 - i * (maxQ > 4 ? 95 : 120), ty = 705;
    if (c.state === 'enter' || c.state === 'wait') { c.tx = tx; c.ty = ty; }
    if (isBig() && c.state === 'wait' && !c.serving) {
      const rate = (i === 0 ? (D.orderOpen ? 1 / 110 : 1 / 55) : 1 / 85) * (up('chair') ? 0.7 : 1);
      if (!D.quizOpen) c.pat -= dt * rate;
      c.el.classList.toggle('impatient', c.pat < 0.3);
      if (c.pat < 0.3 && !c.grumbled) { c.grumbled = true; emote(c, '😣'); }
      if (c.pat <= 0) customerGiveUp(c);
    }
  });
  D.all.forEach(c => moveCustomer(c, dt));
  const front = D.queue[0];
  const showBtn = front && front.state === 'wait' && !front.serving && !D.orderOpen;
  $('#make-btn').classList.toggle('hidden', !showBtn); syncMake(showBtn);
  if (front) updateBubble(front);
  D._pi = (D._pi || 0) + dt; if (D._pi > 0.4) { D._pi = 0; updatePInfo(); }
  D._sv = (D._sv || 0) + dt; if (D._sv > 4) { D._sv = 0; saveDay(); }
  if (!D.ended && D.t >= D.len && D.nextSpawn >= D.spawns.length && D.all.length === 0) endDay();
}
function pickCustomerType(vip) {
  const lvl = P.level;
  if (D.events && D.events.length && D.nextSpawn >= 1) return { type: D.events.shift(), topic: null, event: true };
  if (!vip && !D.sisCame && D.nextSpawn > 2 && Store.load(otherKid()) && Math.random() < 0.1) { D.sisCame = true; return { type: 'sis', topic: null, sis: true }; }
  if (vip) {
    if (isBig()) { const r = Math.random(); if (r < 0.5) return { type: Math.random() < 0.5 ? 'king' : 'admiral', topic: 'history' }; if (r < 0.8 && lvl >= 1) return { type: pick(['tourist_w', 'tourist_m']), topic: 'english' }; return { type: pickNormal(), topic: 'math' }; }
    const r = Math.random(); if (r < 0.35) return { type: 'king', topic: 'korean' }; if (r < 0.6) return { type: 'admiral', topic: 'number' }; return { type: pickNormal(), topic: Math.random() < 0.5 ? 'number' : 'korean' };
  }
  return { type: pickNormal(), topic: null };
}
function pickNormal() {
  const animalW = P.theme === 'forest' ? 0.4 : 0.12;
  const r = Math.random();
  if (P.level >= 2 && r < 0.12) return pick(['tourist_w', 'tourist_m']);
  if (r < 0.12 + animalW) return pick(['bunny', 'bear', 'cat', 'penguin']);
  return pick(['grandma', 'grandpa', 'office', 'mom', 'boy', 'girl', 'student', 'rider']);
}
let custId = 0;
function spawnCustomer(vip) {
  const pc = pickCustomerType(vip); const { type, topic } = pc; if (pc.event) vip = true;
  const info = custInfo(type);
  const c = { id: ++custId, type, info, vip: !!vip, topic, event: pc.event, sis: pc.sis, x: 165, y: 560, tx: 165, ty: 560, state: 'enter', pat: 1, order: makeOrder(), tries: 0, serving: false };
  const badge = pc.event ? `<div class="vipbadge" style="background:#a78bfa;color:#fff;box-shadow:0 3px 0 #7c3aed">${type === 'influencer' ? '📱 인플루언서' : type === 'reporter' ? '📰 잡지 기자' : '📺 방송국'}</div>` : pc.sis ? `<div class="vipbadge" style="background:#f9a8d4;color:#fff;box-shadow:0 3px 0 #db2777">💕 자매 손님</div>` : vip ? `<div class="vipbadge">⭐ 퀴즈 손님</div>` : '';
  const el = h(`<div class="cust walk"><img class="body" src="${custImg(type)}" style="height:${info.h}px">${vip || pc.sis ? '<div class="sparkle"></div>' : ''}${badge}<div class="bubble hidden"></div></div>`);
  el.onclick = () => { if (D.queue[0] === c && c.state === 'wait' && !c.serving && !D.orderOpen) openOrder(c); };
  $('#custs').appendChild(el); c.el = el;
  D.queue.push(c); D.all.push(c);
  const qi = D.queue.length - 1; c.tx = 520 - qi * 120; c.ty = 705;
  moveCustomer(c, 0);
  Sound.sfx('door');
  if (type !== 'sis' && !P.seen.includes(type)) { P.seen.push(type); setTimeout(() => toast(`📖 새 손님 도감 등록! <b>${info.name}</b>`), 900); }
}
function moveCustomer(c, dt) {
  const sp = 230 * dt; const dx = c.tx - c.x, dy = c.ty - c.y; const d = Math.hypot(dx, dy);
  if (d > 1) { const k = Math.min(1, sp / d); c.x += dx * k; c.y += dy * k; c.el.classList.add('walk'); }
  else {
    c.el.classList.remove('walk');
    if (c.state === 'enter' && D.queue[0] === c) { c.state = 'wait'; arriveFront(c); }
    else if (c.state === 'enter' && D.queue.includes(c)) c.state = 'wait';
    else if (c.state === 'leave') { c.el.remove(); D.all = D.all.filter(o => o !== c); return; }
  }
  if (c.state === 'wait' && D.queue[0] === c && !c.arrived) arriveFront(c);
  const sc = 0.78 + (c.y - 560) / (705 - 560) * 0.22;
  c.el.style.transform = `translate(${c.x}px,${c.y}px) translate(-50%,-100%) scale(${sc})`;
  c.el.style.zIndex = Math.round(c.y);
  if (c.state === 'leave') c.el.style.opacity = clamp((c.x - 150) / 120, 0, 1);
}
function arriveFront(c) {
  if (c.arrived) return; c.arrived = true;
  c.el.classList.remove('hop'); void c.el.offsetWidth; c.el.classList.add('hop'); setTimeout(() => c.el.classList.remove('hop'), 600); if (Math.random() < 0.5) emote(c, pick(['😋', '🤩', '😊', '🍦']));
  const b = c.el.querySelector('.bubble'); b.classList.remove('hidden');
  b.innerHTML = `<div class="ord">${orderIcons(c.order, 44)}</div>${isBig() ? '<div class="pat"><i style="width:100%"></i></div>' : ''}`;
  kidSay(pick(['어서 오세요!', '안녕하세요!', '반가워요!', '뭐 드릴까요?']));
  if (P.tutorial && !D.tutShown) { D.tutShown = true; setTimeout(() => banner('👇 손님을 누르거나 “주문 받기”를 눌러요!', 3500), 400); }
}
function updateBubble(c) {
  if (!isBig() || !c.arrived) return;
  const i = c.el.querySelector('.pat i'); if (!i) return;
  i.style.width = `${clamp(c.pat, 0, 1) * 100}%`; i.classList.toggle('low', c.pat < 0.33);
}
function customerLeave(c) {
  c.state = 'leave'; c.tx = 120; c.ty = 600; c.el.querySelector('.bubble').classList.add('hidden');
  D.queue = D.queue.filter(o => o !== c);
  D.queue.forEach(o => { if (o.state === 'wait') { o.state = 'enter'; o.arrived = false; } });
}
function customerGiveUp(c) {
  c.el.classList.add('sad'); emote(c, '😢'); Sound.sfx('sad'); D.left++; comboBreak();
  kidPose('oops', 1200); kidSay('앗, 기다리다 가셨어요…'); customerLeave(c);
}

function emote(c, e) { const b = h(`<div class="emote">${e}</div>`); c.el.appendChild(b); setTimeout(() => b.remove(), 1600); }
function syncMake(on) { const p = $('#p-make'); if (p) p.classList.toggle('hidden', !on); }

/* ---------------- 주문 ---------------- */
function makeOrder() {
  const fl = P.flavors; const big = isBig();
  const cont = Math.random() < 0.5 ? 'cone' : 'cup';
  let n;
  if (big) { const r = Math.random(); n = r < 0.35 ? 1 : r < 0.75 ? 2 : 3; }
  else n = Math.random() < (P.stats.customers > 15 ? 0.5 : 0.3) ? 2 : 1;
  const scoops = Array.from({ length: n }, () => pick(fl));
  let top = null; if (P.toppings.length && Math.random() < (big ? 0.55 : 0.4)) top = pick(P.toppings);
  return { cont, scoops, top };
}
function orderPrice(o) { return o.scoops.reduce((a, f) => a + FLAVORS[f].price, 0) + (o.top ? TOPPINGS[o.top].price : 0); }
function orderIcons(o, size) {
  return `<img src="img/items/${o.cont}.webp" style="height:${size}px">` + o.scoops.map(f => `<img src="img/items/${f}.webp" style="height:${size}px">`).join('') + (o.top ? `<img src="img/items/${o.top}.webp" style="height:${size * 0.85}px">` : '');
}
function orderText(o) {
  const cnt = {}; o.scoops.forEach(f => cnt[f] = (cnt[f] || 0) + 1);
  const numKo = ['', '하나', '두 개', '세 개'];
  const parts = Object.entries(cnt).map(([f, n]) => n > 1 ? `${FLAVORS[f].name} ${numKo[n]}` : FLAVORS[f].name);
  let t = `${parts.join(', ')}${o.scoops.length > 1 && parts.length === 1 ? '' : ''}! ${o.cont === 'cone' ? '콘' : '컵'}에 주세요`;
  if (o.top) t += `. ${TOPPINGS[o.top].name}도 올려 주세요~`;
  return t + '!';
}
let B = null; // 만들고 있는 아이스크림
function openOrder(c) {
  Sound.sfx('pop'); c.serving = true; D.orderOpen = true; B = { cont: up('dispenser') ? c.order.cont : null, scoops: [], top: null }; kidPose('scoop'); c.openAt = performance.now();
  const hintOn = () => !isBig() || P.tutorial || c.tries >= 2;
  const m = modal(`<div id="order">
    <div id="o-left"><img class="who" src="${custImg(c.type)}"><div class="say">${orderText(c.order)}</div>
      <div class="ocard"><div class="lbl">주문서 📝</div><div class="row" style="align-items:flex-end;gap:2px">${orderIcons(c.order, 56)}</div></div>
      <div class="row" style="margin-top:12px;gap:8px;justify-content:center"><button class="btn small white" id="o-say">🔊 다시 듣기</button><button class="btn small purple" id="o-mom">👩 엄마 찬스 <b>${helpLeft()}</b></button></div></div>
    <div id="o-mid"><div class="price"></div><div id="o-hintdrop">👆 누르거나<br>여기로 끌어다 놓아요!</div><div id="o-build"></div><div class="ctl"><button class="btn tiny white" id="o-undo">↩ 하나 빼기</button><button class="btn tiny white" id="o-reset">🔄 처음부터</button></div></div>
    <div id="o-right">
      <div class="row" style="gap:18px;align-items:flex-start"><div><div class="sect">① 콘·컵</div><div class="ingr" id="i-cont">${['cone', 'cup'].map(k => `<button class="ing ${isBig() ? 'tiny' : 'lg'}" data-t="cont" data-k="${k}"><img src="img/items/${k}.webp"><span>${CONTAINERS[k].name}</span></button>`).join('')}</div></div>
        ${P.toppings.length ? `<div><div class="sect">③ 토핑</div><div class="ingr" id="i-top">${P.toppings.map(k => `<button class="ing ${isBig() ? 'tiny' : 'lg'}" data-t="top" data-k="${k}"><img src="img/items/${k}.webp"><span>${TOPPINGS[k].name}</span></button>`).join('')}</div></div>` : ''}</div>
      <div class="sect">② 아이스크림 (3개까지)</div><div class="ingr" id="i-fl">${P.flavors.map(k => `<button class="ing ${flSize()}" data-t="fl" data-k="${k}"><img src="img/items/${k}.webp"><span>${FLAVORS[k].name}</span></button>`).join('')}</div>
      <button class="btn yellow" id="o-done">완성! ✨</button>
    </div></div>`, { cls: '' });
  const sayOrder = () => Sound.say(orderText(c.order).replace('~', ''));
  if (!isBig()) sayOrder();
  m.querySelector('#o-say').onclick = () => { Sound.sfx('tap'); sayOrder(); };
  const doServe = () => { m.close(); D.orderOpen = false; serve(c); };
  m.querySelector('#o-mom').onclick = () => { if (c.momBusy) return; c.momBusy = true; momChance(c, m, B, render, doServe).finally(() => { c.momBusy = false; }); };
  const render = () => {
    const bd = m.querySelector('#o-build'); bd.innerHTML = '';
    let base = 0;
    const cl = B.last === 'cont' ? 'cont land' : 'cont';
    if (B.cont === 'cone') { bd.appendChild(h(`<img class="${cl}" src="img/items/cone.webp" style="height:190px;bottom:0">`)); base = 132; }
    if (B.cont === 'cup') { bd.appendChild(h(`<img class="${cl}" src="img/items/cup.webp" style="width:185px;bottom:0;z-index:5">`)); base = 86; }
    B.scoops.forEach((f, i) => bd.appendChild(h(`<img class="scoop ${B.last === 'scoop' && i === B.scoops.length - 1 ? 'land' : 'still'}" src="img/items/${f}.webp" style="bottom:${base + i * 68}px;z-index:${B.cont === 'cup' && i === 0 ? 4 : 10 + i}">`)));
    if (B.top) {
      const tb = base + Math.max(0, B.scoops.length - 1) * 68 + (B.scoops.length ? 104 : 0);
      const sz = { cherry: 'height:92px', sprinkle: 'width:130px', cream: 'width:140px', syrup: 'width:166px' }[B.top];
      const adj = { cherry: 0, sprinkle: -18, cream: -10, syrup: -56 }[B.top];
      bd.appendChild(h(`<img class="top ${B.last === 'top' ? 'land' : 'still'}" src="img/items/${B.top}.webp" style="${sz};bottom:${tb + adj}px;z-index:30">`));
    }
    B.last = null;
    m.querySelector('#o-hintdrop').style.display = B.cont ? 'none' : 'block';
    const pr = B.scoops.reduce((a, f) => a + FLAVORS[f].price, 0) + (B.top ? TOPPINGS[B.top].price : 0);
    m.querySelector('.price').innerHTML = pr ? `가격 ${COIN} ${pr}` : '';
    // 힌트
    $$('.ing', m).forEach(b => b.classList.remove('hint'));
    m.querySelector('#o-done').classList.remove('pulse');
    if (hintOn()) {
      let sel = null;
      if (B.cont !== c.order.cont) sel = `[data-t=cont][data-k=${c.order.cont}]`;
      else {
        const need = c.order.scoops.slice(); B.scoops.forEach(f => { const i = need.indexOf(f); if (i >= 0) need.splice(i, 1); });
        if (need.length && B.scoops.length < c.order.scoops.length) sel = `[data-t=fl][data-k=${need[0]}]`;
        else if (c.order.top && B.top !== c.order.top) sel = `[data-t=top][data-k=${c.order.top}]`;
      }
      if (sel) { const b = m.querySelector(sel); if (b) b.classList.add('hint'); }
      else if (matches(B, c.order)) m.querySelector('#o-done').classList.add('pulse');
    }
  };
  const apply = (t, k) => {
    if (t === 'cont') { B.cont = k; Sound.sfx('pop'); B.last = 'cont'; }
    else if (t === 'fl') {
      if (!B.cont) { Sound.sfx('bad'); toast('먼저 콘이나 컵을 골라요! 🍦'); shake(m.querySelector('#i-cont')); return; }
      if (B.scoops.length >= 3) { Sound.sfx('bad'); toast('3개까지만 올릴 수 있어요!'); return; }
      B.scoops.push(k); Sound.sfx('plop'); B.last = 'scoop';
    } else if (t === 'top') {
      if (!B.scoops.length) { Sound.sfx('bad'); toast('아이스크림을 먼저 올려요!'); return; }
      B.top = k; Sound.sfx('sparkle'); B.last = 'top';
    }
    render();
  };
  // 탭하거나 끌어다 놓기
  m.querySelectorAll('.ing').forEach(btn => {
    btn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      const t = btn.dataset.t, k = btn.dataset.k; const sx = ev.clientX, sy = ev.clientY; let ghost = null;
      btn.classList.add('press');
      const mid = m.querySelector('#o-mid');
      const move = (e) => {
        if (!ghost && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) {
          ghost = h(`<img class="ghost" src="img/items/${k}.webp">`); document.body.appendChild(ghost); Sound.sfx('scoop');
        }
        if (ghost) {
          ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
          const r = mid.getBoundingClientRect(); mid.classList.toggle('over', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
        }
      };
      const up = (e) => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        btn.classList.remove('press');
        if (ghost) {
          ghost.remove(); const over = mid.classList.contains('over'); mid.classList.remove('over');
          if (over) apply(t, k);
        } else if (e.type === 'pointerup') apply(t, k);
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  });
  m.querySelector('#o-undo').onclick = () => { Sound.sfx('tap'); if (B.top) B.top = null; else if (B.scoops.length) B.scoops.pop(); else B.cont = null; B.last = null; render(); };
  m.querySelector('#o-reset').onclick = () => { Sound.sfx('tap'); B = { cont: null, scoops: [], top: null }; render(); };
  m.querySelector('#o-done').onclick = () => {
    if (!B.cont || !B.scoops.length) { Sound.sfx('bad'); toast('아직 다 안 만들었어요!'); return; }
    if (matches(B, c.order)) { m.querySelector('#o-build').classList.add('done'); Sound.sfx('sparkle'); setTimeout(doServe, 420); }
    else {
      c.tries++; comboBreak(); Sound.sfx('bad'); kidPose('oops', 1200);
      const msg = mismatch(B, c.order); toast(`앗! ${msg} 주문서를 다시 봐요 👀`);
      render();
      if (P.kid === 'jia') Sound.say(`앗! ${msg}`);
    }
  };
  render();
}
function flSize() { const n = P.flavors.length; if (!isBig()) return n <= 6 ? 'xl' : n <= 9 ? 'lg' : 'small'; return n <= 4 ? 'xl' : n <= 8 ? 'lg' : 'small'; }
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function matches(b, o) {
  if (b.cont !== o.cont || b.top !== o.top || b.scoops.length !== o.scoops.length) return false;
  const a = b.scoops.slice().sort().join(), c = o.scoops.slice().sort().join(); return a === c;
}
function mismatch(b, o) {
  if (b.cont !== o.cont) return `${o.cont === 'cone' ? '콘' : '컵'}에 담아야 해요.`;
  if (b.scoops.length !== o.scoops.length) return `아이스크림이 ${o.scoops.length}개 필요해요.`;
  if (b.scoops.slice().sort().join() !== o.scoops.slice().sort().join()) return '아이스크림 맛이 달라요.';
  if (b.top !== o.top) return o.top ? `${TOPPINGS[o.top].name} 토핑이 필요해요.` : '토핑은 필요 없대요.';
  return '조금 달라요.';
}
async function serve(c) {
  c.served = true;
  const fever = D.fever > 0;
  let price = orderPrice(c.order) * (fever ? 2 : 1);
  const perfect = c.tries === 0 && !c.helped;
  let tip = isBig() ? (c.pat > 0.66 ? 3 : c.pat > 0.33 ? 2 : 1) : 1;
  if (up('freezer')) tip += 1;
  if (!perfect) tip = Math.max(0, tip - 1);
  if (c.helped) tip = 0;
  let hearts = perfect ? 2 : 1; if (c.sis) hearts += 3; if (c.event) hearts += 5;
  const secs = (performance.now() - (c.openAt || 0)) / 1000 * (window.__speed || 1);
  const quick = perfect && secs < (isBig() ? 8 : 11);
  if (quick) tip += 2;
  if (perfect) comboHit(c); else if (!c.helped) comboBreak();
  c.el.querySelector('.bubble').innerHTML = `<div class="dots">💖</div>`;
  c.el.querySelector('img.body').src = custImg(c.type, true); c.el.classList.add('happy'); emote(c, perfect ? '💖' : '😊');
  kidPose(perfect ? 'jump' : 'thumb', 1300); Sound.sfx('good'); setTimeout(() => Sound.sfx('register'), 250);
  kidSay(pick(['맛있게 드세요!', '감사합니다!', '또 오세요~', '최고의 아이스크림!']));
  if (P.tutorial) { P.tutorialCount = (P.tutorialCount || 0) + 1; if (P.tutorialCount >= 2) P.tutorial = false; }
  // 계산
  addCoins(price, 'sales'); if (tip) addCoins(tip, 'tips');
  D.earned += price + tip; D.served++; D.hearts += hearts; P.rep += hearts;
  P.stats.customers++; P.stats.sales += price; P.yearStats.customers++;
  if (perfect) { P.stats.perfect++; questProgress('perfect'); }
  questProgress('serve'); questProgress(c.order.cont); questProgress('earn', price + tip);
  floater(c.x, c.y - 300, `+${price + tip} ${COIN}${fever ? ' 🔥x2' : ''}`);
  if (quick) setTimeout(() => floater(c.x - 70, c.y - 210, '⚡ 번개 손!'), 450);
  if (c.sis) setTimeout(() => toast(`💕 ${c.info.name}가 아주 맛있대요! ${HEART} +${hearts}`), 600);
  if (c.type === 'influencer') { P.rep += ADS.influencer.rep; setTimeout(() => toast(`📱 영상 업로드! 조회수 ${(12000 + rnd(80000)).toLocaleString()}회! ${HEART} +${ADS.influencer.rep}`), 900); }
  setTimeout(() => floater(c.x + 60, c.y - 250, `+${hearts} ${HEART}`), 300);
  flyCoins(c.x, c.y - 200, Math.min(6, 2 + Math.floor(price / 3)));
  Sound.sfx('coin');
  updateHud();
  // 퀴즈
  await wait(900);
  if (c.vip && !c.event) { await runQuiz(c.topic, c, true); P.stats.vip++; questProgress('vip'); }
  else if (c.event || c.sis) { await wait(400); }
  else if (Math.random() < (isBig() ? 0.07 : 0.09)) { await runQuiz('change', c, false); }
  customerLeave(c); kidPose('idle');
  saveDay();
}
function flyCoins(x, y, n) {
  const tgt = scenePos($('#h-coins img'));
  for (let i = 0; i < n; i++) {
    const im = h(`<img class="flycoin" src="img/icons/coin.webp" style="left:${x - 22 + rnd(40) - 20}px;top:${y - 22 + rnd(30)}px">`);
    $('#fx').appendChild(im);
    setTimeout(() => { im.style.transform = `translate(${tgt.x - x}px,${tgt.y - y}px) scale(.7)`; im.style.opacity = '0.2'; }, 60 + i * 70);
    setTimeout(() => im.remove(), 1000 + i * 70);
  }
}

/* ---------------- 퀴즈 ---------------- */
function runQuiz(topic, cust, vip, opts = {}) {
  return new Promise(res => {
    if (D) D.quizOpen = true;
    const q = Quiz.make(P.kid, topic || 'any', S); window.__q = q;
    let tries = 0, usedDad = false; const qt0 = performance.now();
    Sound.sfx('quiz');
    const who = cust ? custImg(cust.type) : KID.poses[0];
    const title = opts.title || (vip ? `${cust.info.name}의 퀴즈!` : cust ? '계산대 퀴즈!' : '퀴즈!');
    const m = modal(`<div id="quiz"><div class="q-head"><img src="${who}"><div style="flex:1"><span class="q-cat">${title} · ${q.cat}</span><div class="q-prompt">${q.prompt}</div></div><button class="btn white q-say">🔊</button><button class="btn purple q-help">👨 찬스 <b>${helpLeft()}</b></button><img class="q-kid" src="${KID.poses[POSE.think]}"></div>
      <div class="q-visual ${q.visualCls || ''}">${q.visual}</div>
      <div class="q-options">${q.options.map((o, i) => `<button class="q-opt ${q.wide ? 'wide' : ''}" data-i="${i}">${o.html}</button>`).join('')}</div>
      <div class="q-result"></div><div class="q-foot"></div></div>`);
    const speak = () => { if (q.say) Sound.say(q.say, q.sayLang || 'ko-KR'); };
    m.querySelector('.q-say').onclick = () => { Sound.sfx('tap'); speak(); };
    m.querySelector('.q-help').onclick = () => { if (usedDad) return; dadChance(m, q, () => { usedDad = true; m.querySelector('.q-help').disabled = true; }); };
    const lb = m.querySelector('.q-listen'); if (lb) lb.onclick = () => { Sound.sfx('tap'); speak(); };
    if (q.listen && !Sound.canSpeak()) { m.querySelector('.q-visual').innerHTML = `<b class="q-big-word en">${q.fallbackText}</b>`; }
    if (q.listen || P.kid === 'jia') setTimeout(speak, 350);
    const finish = (right) => {
      m.querySelectorAll('.q-opt').forEach(b => b.style.pointerEvents = 'none'); m.querySelector('.q-help').disabled = true;
      const firstTry = right && tries === 0; const stars = right ? awardStars(firstTry, usedDad) : awardStars(false, false); logQuiz(right);
      const fast = right && (performance.now() - qt0) / 1000 < (isBig() ? 6 : 8);
      const bonus = right ? (opts.bonus != null ? opts.bonus : (vip ? (isBig() ? 10 : 6) : (isBig() ? 5 : 3))) : 1;
      P.stats.quizTotal++;
      if (right) { P.stats.quizRight++; P.yearStats.quizRight++; questProgress('quiz'); }
      if (!opts.noCoins) addCoins(bonus, 'quiz');
      let extra = '';
      if (right && vip) { P.rep += 1; if (D) D.hearts += 1; if (Math.random() < 0.35) { const st = giveSticker(); if (st) extra = ` · 스티커 ${st}!`; } }
      m.querySelector('.q-result').innerHTML = `${right ? '🎉 정답이에요!' : '💡 정답을 알아봐요!'} ${q.explain}<br><span style="color:#b7791f">${opts.noCoins ? '' : `보너스 ${COIN} +${bonus}`}${right && vip ? ` · ${HEART} +1` : ''}${extra}${stars ? ` · 🌟 공부별 +${stars}${P.qStreak >= 3 ? ` (${P.qStreak}연속!)` : ''}` : ''}${fast && opts.speed ? ' · ⚡번개!' : ''}</span>`;
      if (q.sayAnswer) setTimeout(() => Sound.say(q.sayAnswer, q.sayAnswerLang || 'ko-KR'), 300);
      else if (P.kid === 'jia') setTimeout(() => Sound.say(q.explain.replace(/["“”]/g, '')), 300);
      const f = m.querySelector('.q-foot'); f.innerHTML = '<button class="btn" style="margin-top:12px">계속하기 ▶</button>';
      f.firstElementChild.onclick = () => { Sound.sfx('tap'); m.close(); if (D) D.quizOpen = false; updateHud(); res(opts.speed ? { right, stars, fast } : right); };
    };
    m.querySelectorAll('.q-opt').forEach(b => b.onclick = () => {
      const o = q.options[+b.dataset.i];
      if (o.v === q.answer) {
        b.classList.add('right'); Sound.sfx('good'); b.appendChild(h('<span class="q-mark">⭕</span>'));
        m.querySelector('.q-kid').src = KID.poses[POSE.clap];
        if (cust) cust.el.classList.add('happy'); kidPose('clap', 1200); finish(tries === 0 || !isBig());
      } else {
        tries++; b.classList.add('wrong'); Sound.sfx('bad'); kidPose('oops', 1000); m.querySelector('.q-kid').src = KID.poses[POSE.oops]; shake(b);
        if (tries === 1) { m.querySelector('.q-result').innerHTML = '🤔 다시 한 번 생각해 볼까요?'; if (P.kid === 'jia') Sound.say('다시 한 번 생각해 볼까요?'); }
        else { const rb = [...m.querySelectorAll('.q-opt')].find(x => q.options[+x.dataset.i].v === q.answer); rb.classList.add('right'); rb.appendChild(h('<span class="q-mark">💡</span>')); m.querySelector('.q-kid').src = KID.poses[POSE.thumb]; finish(false); }
      }
    });
  });
}

/* ---------------- 하루 끝 ---------------- */
async function endDay() {
  D.ended = true; D.running = false; P.dayState = null; saveP(); $('#make-btn').classList.add('hidden'); syncMake(false);
  kidPose('wave'); await wait(500); shutter(true); await wait(1300);
  const ch = charm(); const repBonus = Math.floor(ch / 10);
  P.rep += repBonus;
  const lastDay = P.day >= DAYS_PER_MONTH;
  P.day++;
  if (lastDay) P.phase = 'monthend';
  saveP(); updateHud();
  kidPose('wave');
  const timeUp = timeLeftSec() <= 0;
  await new Promise(res => {
    const m = modal(`<div style="width:760px;padding:26px 30px" class="center"><h2>🌇 오늘 장사 끝!</h2>
      <div class="row" style="justify-content:center;gap:30px;margin:18px 0;font-size:30px">
        <div>🧍 손님<br><b style="font-size:46px;color:#c23a74">${D.served}</b>명</div>
        <div>${COIN} 번 돈<br><b style="font-size:46px;color:#b7791f">${D.earned}</b></div>
        <div>${HEART} 하트<br><b style="font-size:46px;color:#e11d48">${D.hearts + repBonus}</b></div>
        <div>🔥 최고 콤보<br><b style="font-size:46px;color:#f97316">${D.maxCombo || 0}</b></div></div>
      ${repBonus ? `<div class="muted" style="font-size:22px">🎀 예쁜 가게 보너스 하트 +${repBonus}</div>` : ''}
      ${D.left ? `<div class="muted" style="font-size:22px">😢 기다리다 간 손님 ${D.left}명 — 조금 더 빨리 만들어 볼까요?</div>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px;margin:14px 60px 0">${P.quests.list.map(questHtml).join('')}</div>
      ${P.day % 2 === 1 ? `<button class="btn purple" id="tw" style="margin-top:18px">🍦 보너스 탑 쌓기!</button> ` : ''}<button class="btn ${lastDay ? 'yellow' : ''}" id="ok" style="margin-top:18px">${lastDay ? '📒 한 달 정산하기' : timeUp ? '🌙 오늘은 여기까지' : `다음 날 (${P.month}월 ${P.day}일) ▶`}</button></div>`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
    const tw = m.querySelector('#tw'); if (tw) tw.onclick = async () => { Sound.sfx('pop'); m.close(); await towerGame(); res(); };
  });
  await checkLevelUp();
  if (lastDay) return monthEnd();
  if (timeUp) return sessionEnd();
  startDay();
}
async function checkLevelUp() {
  const nx = nextLevel();
  if (!nx || nx.locked || P.rep < nx.need) return;
  P.level = nx.lv; if (nx.lv === 6) P.trophies.push({ icon: '👑', name: '전설의 가게', year: P.year }); saveP(); updateHud(); renderDecor();
  shutter(false); await wait(900);
  const clean = await parade(); Sound.sfx('level');
  await new Promise(res => {
    const m = modal(`<div style="width:820px;padding:28px" class="center"><div style="font-size:30px;color:#9a6a86">평판이 올랐어요!</div>
      <div class="row" style="justify-content:center;gap:20px"><img src="${KID.poses[1]}" style="height:240px"><div><div style="font-size:64px;color:#c23a74">⭐ Lv.${nx.lv}</div><div style="font-size:52px;color:#f45d9a">${nx.name}!</div></div></div>
      <div style="font-size:24px;margin-top:12px;line-height:1.6">${nx.unlock.map(u => `<div>${u}</div>`).join('')}</div>
      <button class="btn yellow" id="ok" style="margin-top:16px">야호! 🎉</button></div>`);
    if (P.kid === 'jia') Sound.say(`축하해요! ${nx.name}이 되었어요!`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
  clean(); kidPose('idle'); shutter(true);
}

/* ---------------- 한 달 정산 ---------------- */
async function monthEnd() {
  closeAll();
  const L = P.ledger;
  L.ingredients = Math.round(L.sales * 0.3);
  P.coins = Math.max(0, P.coins - L.ingredients);
  const interest = Math.floor(P.savings * 0.05); P.savings += interest; L.interest = interest;
  L.branch = branchIncome(); if (L.branch) P.coins += L.branch;
  updateHud();
  await showLedger(L);
  const wasDec = P.month === 12;
  // 다음 달로
  P.stats.months++;
  P.lastLedger = L;
  P.month = P.month % 12 + 1; if (P.month === 1) P.year++;
  P.day = 1; P.adsActive = {}; P.adsNext = {}; P.adsShown = {}; P.ledger = emptyLedger(); P.phase = 'hub';
  saveP();
  if (wasDec) await yearEnd();
  checkGoals();
  openHub(false);
}
function showLedger(L) {
  return new Promise(res => {
    const inc = [['아이스크림', L.sales, '#f472b6'], ['팁', L.tips, '#fb923c'], ['퀴즈 보너스', L.quiz, '#a78bfa'], ['퀘스트·출석', L.quest, '#60a5fa'], ['저금 이자', L.interest, '#4ade80']].concat(L.branch ? [['🏬 2호점', L.branch, '#34d399']] : []);
    const exp = [['재료비', L.ingredients, '#f87171'], ['홍보비', L.ads, '#fbbf24'], ['연구비', L.research, '#818cf8'], ['꾸미기', L.decor, '#f9a8d4']];
    const ti = inc.reduce((a, x) => a + x[1], 0), te = exp.reduce((a, x) => a + x[1], 0);
    const mx = Math.max(1, ...inc.map(x => x[1]), ...exp.map(x => x[1]));
    const rows = (arr) => arr.map(([n, v, c]) => `<div class="lrow"><span class="lb">${n}</span><span class="bar"><i style="width:${v / mx * 100}%;background:${c}"></i></span><span class="v">${v}</span></div>`).join('');
    const style = spendStyle(L);
    const big = isBig();
    const m = modal(`<div style="width:1080px;padding:24px 28px" class="center"><h2>📒 ${P.month}월 가계부</h2>
      ${big ? `<div class="ledger"><div class="lcol"><h3 style="color:#16a34a">💰 들어온 돈 ${ti}</h3>${rows(inc)}</div><div class="lcol"><h3 style="color:#dc2626">💸 나간 돈 ${te}</h3>${rows(exp)}</div></div>`
      : `<div class="ledger"><div class="lcol"><h3 style="color:#16a34a">💰 들어온 돈</h3><div class="bignum">${ti}</div><div class="coinpile">${Array.from({ length: Math.min(40, Math.ceil(ti / 15)) }, () => '<img src="img/icons/coin.webp">').join('')}</div></div>
         <div class="lcol"><h3 style="color:#dc2626">💸 나간 돈</h3><div class="bignum">${te}</div><div class="coinpile">${Array.from({ length: Math.min(40, Math.ceil(te / 15)) }, () => '<img src="img/icons/coin.webp" style="filter:grayscale(.6)">').join('')}</div>
         <div class="muted" style="font-size:20px;margin-top:8px">재료비 ${L.ingredients} · 쓴 돈 ${L.ads + L.research + L.decor}</div></div></div>`}
      <div style="font-size:26px;margin-top:16px">${ti - te >= 0 ? `👍 이번 달은 <b style="color:#16a34a">${ti - te}코인</b> 남았어요!` : `이번 달은 쓴 돈이 더 많았어요. 다음 달엔 아껴 볼까요?`}
        ${L.interest ? `<br><span class="muted" style="font-size:22px">🐷 저금통에 이자 ${L.interest}코인이 붙었어요! (지금 저금 ${P.savings})</span>` : ''}</div>
      ${style ? `<div style="font-size:24px;margin-top:10px">이번 달 우리 가게는 <b style="color:#c23a74">${style}</b> 스타일!</div>` : ''}
      <button class="btn" id="ok" style="margin-top:16px">다음 달 준비하기 ▶</button></div>`);
    Sound.sfx('coin');
    if (!big) Sound.say(`이번 달 들어온 돈은 ${ti}코인, 나간 돈은 ${te}코인이에요!`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
}
function spendStyle(L) {
  const a = [['🍓 맛 장인', L.research], ['🎀 꾸미기 장인', L.decor], ['🏪 사업가', L.ads + (L.saved || 0)]].sort((x, y) => y[1] - x[1]);
  return a[0][1] > 0 ? a[0][0] : '';
}
async function yearEnd() {
  const ys = P.yearStats; const awards = [['🏆', '올해의 사장님 상', `${P.shop}를 1년 동안 잘 꾸려 왔어요!`]];
  if (ys.customers >= 300) awards.push(['🧍', '손님 왕 상', `손님 ${ys.customers}명을 맞이했어요`]);
  if (ys.quizRight >= 20) awards.push(['🧠', '퀴즈 박사 상', `퀴즈를 ${ys.quizRight}개 맞혔어요`]);
  if (charm() >= 60) awards.push(['🎀', '꾸미기 장인 상', `가게 매력 ${charm()}점`]);
  if (P.savings >= 500) awards.push(['🐷', '저축왕 상', `저금 ${P.savings}코인`]);
  awards.forEach(a => P.trophies.push({ icon: a[0], name: a[1], year: P.year - 1 }));
  P.yearStats = { customers: 0, quizRight: 0 }; addCoins(100 * awards.length, 'quest'); saveP();
  Sound.sfx('level'); confetti(120);
  await new Promise(res => {
    const m = modal(`<div style="width:900px;padding:28px" class="center"><div style="font-size:30px;color:#9a6a86">✨ ${P.year - 1}년차 연말 시상식 ✨</div>
      <div class="row" style="justify-content:center;gap:24px;margin-top:6px"><img src="img/icons/trophy.webp" style="height:150px"><img src="${KID.poses[1]}" style="height:230px"></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin:12px 80px">${awards.map(a => `<div class="quest done"><span style="font-size:36px">${a[0]}</span><div class="qb"><b style="color:#c23a74">${a[1]}</b><div class="muted" style="font-size:20px">${a[2]}</div></div></div>`).join('')}</div>
      <div style="font-size:24px">상금 ${COIN} ${100 * awards.length}!</div><button class="btn yellow" id="ok" style="margin-top:14px">새해 복 많이 받으세요! 🎍</button></div>`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
}
const SAVE_GOALS = [
  { at: 300, id: 'g300', name: '저축 새싹', reward: () => { const s = giveSticker(); return `스티커 ${s || '⭐'}`; } },
  { at: 1000, id: 'g1000', name: '저축왕', reward: () => { if (!P.owned.includes('statue')) P.owned.push('statue'); P.trophies.push({ icon: '🐷', name: '저축왕 트로피', year: P.year }); return '왕 아이스크림 동상 + 트로피'; } },
  { at: 2000, id: 'g2000', name: '2호점 자금', locked: true },
];
function checkGoals() {
  SAVE_GOALS.forEach(g => {
    if (g.locked || P.goals.includes(g.id) || P.savings < g.at) return;
    P.goals.push(g.id); const r = g.reward(); saveP();
    setTimeout(() => { toast(`🐷 저축 목표 달성! "${g.name}" — ${r}`); Sound.sfx('level'); }, 600);
  });
}

/* ---------------- 관리 (돈 쓰기) ---------------- */
function openHub(resume) {
  closeAll(); D = null; $('#custs').innerHTML = ''; $('#make-btn').classList.add('hidden'); syncMake(false); kidPose('idle'); updateHud(); shutter(true, true);
  if (S.music) Sound.music('hub');
  $('#h-clockbar i').style.width = '0%'; $('#h-time').textContent = '준비 중';
  let tab = 'bank';
  const m = modal(`<div id="hub"><h2>🏪 ${P.month}월 가게 준비 — 번 돈을 어떻게 쓸까요?</h2>
    <div class="hubbtns">
      <div class="hubbtn" data-t="bank"><img src="img/icons/piggy.webp">저금통</div>
      <div class="hubbtn" data-t="lab"><img src="img/icons/flask.webp">연구실</div>
      <div class="hubbtn" data-t="ads"><img src="img/icons/megaphone.webp">홍보</div>
      <div class="hubbtn" data-t="deco"><img src="img/icons/bow.webp">꾸미기</div>
      <div class="hubbtn" data-t="upg"><img src="img/icons/shop.webp">가게 키우기</div>
      <div class="hubbtn" data-t="study"><img src="img/icons/star.webp">공부방</div>
      <div class="hubbtn" data-t="coupon"><img src="img/icons/gift.webp">쿠폰함</div>
      <div class="hubbtn" data-t="sis"><img src="${KIDS[otherKid()].face}" style="border-radius:16px">${KIDS[otherKid()].name} 가게</div>
      <div class="hubbtn" data-t="book"><img src="img/icons/sticker.webp">도감</div>
    </div><div id="hub-body"></div>
    <div class="row" style="justify-content:space-between;margin-top:10px"><div style="font-size:30px;color:#b7791f" id="hub-coins"></div><div class="row" id="hub-go"></div></div></div>`);
  const body = m.querySelector('#hub-body');
  const refresh = () => {
    m.querySelector('#hub-coins').innerHTML = `${COIN} 내 돈 ${P.coins} &nbsp; 🐷 저금 ${P.savings}`;
    const left = timeLeftSec();
    const go = m.querySelector('#hub-go');
    go.innerHTML = left > 6 * 60 ? `<button class="btn white small" id="stop">🌙 오늘은 그만</button><button class="btn yellow" id="next">${P.month}월 장사 시작! ▶</button>` : `<button class="btn yellow" id="stop">🌙 오늘 장사 끝! (내일 ${P.month}월 시작)</button>`;
    go.querySelector('#stop').onclick = () => { Sound.sfx('tap'); m.close(); saveP(); sessionEnd(); };
    const nx = go.querySelector('#next'); if (nx) nx.onclick = () => { Sound.sfx('pop'); m.close(); P.phase = 'day'; saveP(); startDay(); };
    $$('.hubbtn', m).forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    ({ bank: hubBank, lab: hubLab, ads: hubAds, deco: hubDeco, book: hubBook, upg: hubUpgrades, study: hubStudy, coupon: hubCoupons, sis: hubSister })[tab](body, refresh); updateStarHud();
    updateHud();
  };
  $$('.hubbtn', m).forEach(b => b.onclick = () => { Sound.sfx('tap'); tab = b.dataset.t; refresh(); });
  refresh();
  if (!resume && P.stats.months === 1) setTimeout(() => say('첫 달 장사 수고했어요! 🎉', '이제 번 돈을 써 볼 시간이에요.<br>🐷 저금하면 이자가 붙고, 🧪 연구하면 새 맛이 생기고,', '📣 홍보하면 손님이 늘고, 🎀 꾸미면 가게가 예뻐져요! 어떻게 쓸지는 사장님 마음!'), 300);
}
function hubBank(el, refresh) {
  const big = isBig(); const steps = big ? [10, 50, 100] : [10, 30];
  const goal = SAVE_GOALS.find(g => !P.goals.includes(g.id));
  el.innerHTML = `<div class="row" style="gap:30px;justify-content:center;height:100%">
    <div class="center" style="width:360px"><img src="img/icons/piggy.webp" style="height:170px"><div style="font-size:30px">저금통 <b style="color:#c23a74;font-size:44px">${P.savings}</b>코인</div>
      <div class="muted" style="font-size:21px;margin-top:6px;line-height:1.4">한 달마다 이자가 5% 붙어요!<br>${big ? '100코인을 넣으면 → 다음 달 105코인' : '많이 모을수록 더 많이 늘어나요!'}</div></div>
    <div style="width:520px">
      <div class="sect" style="font-size:24px">💰 저금하기</div><div class="row" style="flex-wrap:wrap;margin:6px 0 14px">${steps.map(s => `<button class="btn green small" data-d="${s}" ${P.coins < s ? 'disabled' : ''}>+${s}</button>`).join('')}<button class="btn green small" data-d="half" ${P.coins < 2 ? 'disabled' : ''}>절반</button></div>
      <div class="sect" style="font-size:24px">🛍️ 꺼내 쓰기</div><div class="row" style="flex-wrap:wrap;margin:6px 0 14px">${steps.map(s => `<button class="btn white small" data-w="${s}" ${P.savings < s ? 'disabled' : ''}>−${s}</button>`).join('')}<button class="btn white small" data-w="all" ${!P.savings ? 'disabled' : ''}>전부</button></div>
      ${goal ? `<div class="quest"><span style="font-size:32px">🎯</span><div class="qb">저축 목표: ${goal.at}코인 "${goal.name}" ${goal.locked ? '<span class="muted">(다음 업데이트에서 열려요!)</span>' : ''}<div class="qbar"><i style="width:${Math.min(100, P.savings / goal.at * 100)}%"></i></div></div><span class="muted" style="font-size:20px">${P.savings}/${goal.at}</span></div>` : ''}
    </div></div>`;
  $$('[data-d]', el).forEach(b => b.onclick = () => { const v = b.dataset.d === 'half' ? Math.floor(P.coins / 2) : +b.dataset.d; if (P.coins < v || !v) return; P.coins -= v; P.savings += v; P.ledger.saved = (P.ledger.saved || 0) + v; Sound.sfx('coin'); checkGoals(); saveP(); refresh(); });
  $$('[data-w]', el).forEach(b => b.onclick = () => { const v = b.dataset.w === 'all' ? P.savings : +b.dataset.w; if (P.savings < v || !v) return; P.savings -= v; P.coins += v; Sound.sfx('tap'); saveP(); refresh(); });
}
function hubLab(el, refresh) {
  const fl = FLAVOR_ORDER.filter(k => !P.flavors.includes(k)).map(k => ({ kind: 'fl', k, name: FLAVORS[k].name, cost: researchCost(FLAVORS[k].cost), d: `한 개 ${FLAVORS[k].price}코인${FLAVORS[k].signature ? ' · 시그니처!' : ''}` }));
  const tp = TOPPING_ORDER.filter(k => !P.toppings.includes(k)).map(k => ({ kind: 'top', k, name: TOPPINGS[k].name + ' 토핑', cost: researchCost(TOPPINGS[k].cost), d: `+${TOPPINGS[k].price}코인 · 손님이 좋아해요` }));
  const list = [...tp.slice(0, 2), ...fl.slice(0, 4)].sort((a, b) => a.cost - b.cost);
  el.innerHTML = `<div class="muted center" style="font-size:22px;margin-bottom:8px">새 맛을 연구하면 손님이 더 다양하게 주문하고, 비싼 메뉴로 돈도 더 벌어요! ${P.theme === 'space' ? '🚀 우주 가게 연구비 20% 할인 중!' : ''}<br>연구할 때 퀴즈를 맞히면 성공 확률이 올라가요 🧪</div>
    <div class="grid" style="grid-template-columns:repeat(6,1fr)">${list.map((r, i) => `<div class="card"><img src="img/items/${r.k}.webp"><div class="t">${r.name}</div><div class="d">${r.d}</div><button class="btn small ${P.coins >= r.cost ? 'purple' : 'gray'}" data-i="${i}">🧪 ${r.cost}</button></div>`).join('')}
    ${list.length ? '' : '<div class="center" style="grid-column:1/-1;font-size:30px">🎉 모든 맛을 다 연구했어요! 진짜 맛 장인!</div>'}</div>
    <div class="muted" style="font-size:20px;margin-top:10px">지금 메뉴: ${P.flavors.map(k => FLAVORS[k].name).join(', ')}${P.toppings.length ? ' · 토핑: ' + P.toppings.map(k => TOPPINGS[k].name).join(', ') : ''}</div>`;
  $$('[data-i]', el).forEach(b => b.onclick = async () => {
    const r = list[+b.dataset.i];
    if (P.coins < r.cost) { Sound.sfx('bad'); toast(`${r.cost - P.coins}코인이 더 필요해요!`); return; }
    spend(r.cost, 'research'); Sound.sfx('buy'); refresh();
    await doResearch(r); saveP(); refresh();
  });
}
async function doResearch(r) {
  const qn = isBig() ? 3 : 2; let right = 0;
  for (let i = 0; i < qn; i++) {
    const topic = isBig() ? pick(['english', 'math', 'history']) : pick(['number', 'korean']);
    const ok = await runQuiz(topic, null, false, { title: `🧪 ${r.name} 연구 ${i + 1}/${qn}`, bonus: 0, noCoins: true });
    if (ok) right++;
  }
  const chance = isBig() ? 55 + right * 15 : 100;
  const success = P.pity || Math.random() * 100 < chance;
  if (success) {
    if (r.kind === 'fl') P.flavors.push(r.k); else P.toppings.push(r.k);
    P.pity = false; Sound.sfx('level'); confetti(60); kidPose('jump', 1600);
    await new Promise(res => { const m = modal(`<div style="width:640px;padding:28px" class="center"><div style="font-size:30px;color:#9a6a86">연구 성공!</div><img src="img/items/${r.k}.webp" style="height:180px;margin:10px"><h2>${r.name} 완성! 🎉</h2><p class="muted" style="font-size:22px">이제 손님들이 ${r.name}도 주문할 거예요!</p><button class="btn yellow" id="ok">좋아요!</button></div>`);
      if (P.kid === 'jia') Sound.say(`${r.name} 완성!`); m.querySelector('#ok').onclick = () => { m.close(); res(); }; });
  } else {
    P.pity = true; Sound.sfx('sad'); kidPose('oops', 1500);
    P.coins += Math.round(r.cost / 2); P.ledger.research -= Math.round(r.cost / 2);
    await new Promise(res => { const m = modal(`<div style="width:640px;padding:28px" class="center"><div style="font-size:80px">💥</div><h2>아깝다! 연구 실패…</h2><p class="muted" style="font-size:22px">퀴즈 ${right}/${qn}개 정답 · 연구비 절반을 돌려받았어요.<br>연구 노트가 쌓여서 <b>다음엔 꼭 성공</b>해요!</p><button class="btn" id="ok">다음엔 꼭!</button></div>`);
      m.querySelector('#ok').onclick = () => { m.close(); res(); }; });
  }
}
function hubAds(el, refresh) {
  el.innerHTML = `<div class="muted center" style="font-size:22px;margin-bottom:10px">홍보를 하면 이번 달에 손님이 많이 와요! 하지만 맛있고 예쁜 가게여야 손님들이 또 오겠죠? 😉</div>
    <div class="grid" style="grid-template-columns:repeat(5,1fr)">${Object.entries(ADS).map(([k, a]) => {
      const lock = a.locked || P.level < a.level; const bought = P.adsActive[k];
      return `<div class="card ${lock ? 'lock' : ''} ${bought ? 'done' : ''}">${bought ? '<span class="tagc">이번 달 진행 중</span>' : ''}<div style="font-size:64px">${a.icon}</div><div class="t">${a.name}</div><div class="d">${lock ? (a.locked ? '🔒 곧 열려요!' : `🔒 Lv.${a.level}에 열려요`) : a.desc}</div>
      ${lock ? '' : `<button class="btn small ${bought ? 'gray' : P.coins >= a.cost ? 'blue' : 'gray'}" data-k="${k}" ${bought ? 'disabled' : ''}>${COIN} ${a.cost}</button>`}</div>`;
    }).join('')}</div>
    <div class="muted center" style="font-size:20px;margin-top:12px">${Object.keys(P.adsActive).length ? `이번 달 진행 중인 홍보: ${Object.keys(P.adsActive).map(k => ADS[k].icon + ADS[k].name).join(', ')}` : '이번 달은 진행 중인 홍보가 없어요'} · 가게 매력 ${charm()}점</div>`;
  $$('[data-k]', el).forEach(b => b.onclick = () => {
    const k = b.dataset.k, a = ADS[k];
    if (P.coins < a.cost) { Sound.sfx('bad'); toast(`${a.cost - P.coins}코인이 더 필요해요!`); return; }
    spend(a.cost, 'ads'); P.adsActive[k] = true; Sound.sfx('buy'); toast(`${a.icon} ${a.name} 홍보 시작! 이번 달 손님이 늘어나요`); saveP(); refresh();
  });
}
function hubDeco(el, refresh) {
  const slots = Object.entries(SLOTS);
  el.innerHTML = `<div class="row" style="gap:22px;align-items:flex-start;height:100%">
    <div style="width:520px"><div class="sect" style="font-size:24px">🎀 장식 자리 (누르면 바꿀 수 있어요)</div>
      <div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:6px">${slots.map(([id, s]) => {
        const lock = P.level < s.level; const k = P.decor[id];
        return `<div class="card ${lock ? 'lock' : ''}" data-s="${id}" style="cursor:pointer;min-height:150px">${k ? `<img src="img/decor/${k}.webp">` : `<div style="font-size:60px;color:#f9a8d4">${lock ? '🔒' : '＋'}</div>`}<div class="d">${s.label}${lock ? ` (Lv.${s.level})` : ''}</div></div>`;
      }).join('')}</div></div>
    <div style="flex:1"><div style="font-size:30px">✨ 가게 매력 <b style="color:#c23a74">${charm()}</b>점</div>
      <div class="muted" style="font-size:20px;line-height:1.4;margin:4px 0 10px">매력이 높으면 손님이 늘고, 하트도 매일 더 받아요!${P.theme === 'princess' ? ' 🏰 공주 카페는 매력 +20%!' : ''}</div>
      <div class="sect" style="font-size:22px">💞 콤보 (둘을 함께 두면 보너스!)</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">${COMBOS.map(cb => { const on = activeCombos().includes(cb); return `<div class="quest ${on ? 'done' : ''}" style="font-size:19px;padding:6px 10px"><img src="img/decor/${cb.a}.webp" style="height:34px"><img src="img/decor/${cb.b}.webp" style="height:34px"><span>${cb.name} +${cb.bonus}${on ? ' ✅' : ''}</span></div>`; }).join('')}</div></div></div>`;
  $$('[data-s]', el).forEach(c => c.onclick = () => {
    const id = c.dataset.s, s = SLOTS[id]; if (P.level < s.level) { Sound.sfx('bad'); toast(`Lv.${s.level}이 되면 열려요!`); return; }
    Sound.sfx('tap'); pickDecor(id, refresh);
  });
}
function pickDecor(slotId, refresh) {
  const s = SLOTS[slotId]; const items = Object.entries(DECOR).filter(([k, d]) => d.type === s.kind);
  const placedElsewhere = (k) => Object.entries(P.decor).some(([sid, v]) => v === k && sid !== slotId);
  const m = modal(`<div style="width:1000px;padding:24px" class="center"><h2>${s.label}에 놓을 장식</h2>
    <div class="grid scroll" style="grid-template-columns:repeat(4,1fr);margin-top:14px;max-height:470px;padding:6px">${items.map(([k, d]) => {
      const own = P.owned.includes(k); const here = P.decor[slotId] === k; const other = placedElsewhere(k);
      return `<div class="card ${here ? 'done' : ''}">${here ? '<span class="tagc">여기 있어요</span>' : ''}<img src="img/decor/${k}.webp"><div class="t">${d.name}</div><div class="d">매력 +${d.charm}${other ? ' · 다른 자리에 있음' : ''}</div>
        ${here ? `<button class="btn small white" data-r="${k}">치우기</button>` : own ? `<button class="btn small green" data-p="${k}">놓기</button>` : `<button class="btn small ${P.coins >= d.price ? '' : 'gray'}" data-b="${k}">${COIN} ${d.price}</button>`}</div>`;
    }).join('')}</div></div>`, { close: true, onClose: refresh });
  const place = (k) => { Object.keys(P.decor).forEach(sid => { if (P.decor[sid] === k) delete P.decor[sid]; }); P.decor[slotId] = k; renderDecor(); saveP(); const before = activeCombos().length; m.close(); if (activeCombos().some(cb => cb.a === k || cb.b === k)) { toast(`💞 콤보 완성! 가게 매력 UP!`); Sound.sfx('level'); confetti(40); } };
  $$('[data-p]', m).forEach(b => b.onclick = () => { Sound.sfx('pop'); place(b.dataset.p); });
  $$('[data-b]', m).forEach(b => b.onclick = () => { const k = b.dataset.b; const d = DECOR[k]; if (!spend(d.price, 'decor')) { Sound.sfx('bad'); toast(`${d.price - P.coins}코인이 더 필요해요!`); return; } P.owned.push(k); Sound.sfx('buy'); place(k); });
  $$('[data-r]', m).forEach(b => b.onclick = () => { Sound.sfx('tap'); delete P.decor[slotId]; renderDecor(); saveP(); m.close(); });
}
function hubBook(el) {
  let t = el._tab || 'cust';
  const draw = () => {
    el._tab = t;
    let inner = '';
    if (t === 'cust') inner = `<div class="grid" style="grid-template-columns:repeat(8,1fr)">${Object.entries(CUSTOMERS).map(([k, c]) => { const s = P.seen.includes(k); return `<div class="card ${s ? '' : 'lock'}"><img src="img/cust/${k}.webp" style="${s ? '' : 'filter:brightness(0) opacity(.35)'}"><div class="d">${s ? c.name : '???'}</div></div>`; }).join('')}</div>`;
    if (t === 'menu') inner = `<div class="grid" style="grid-template-columns:repeat(8,1fr)">${[...FLAVOR_ORDER.map(k => ['fl', k, FLAVORS[k].name, P.flavors.includes(k)]), ...TOPPING_ORDER.map(k => ['tp', k, TOPPINGS[k].name, P.toppings.includes(k)])].map(([_, k, n, o]) => `<div class="card ${o ? '' : 'lock'}"><img src="img/items/${k}.webp"><div class="d">${o ? n : '???'}</div></div>`).join('')}</div>`;
    if (t === 'st') inner = `<div class="grid" style="grid-template-columns:repeat(10,1fr)">${STICKERS.map(s => `<div class="card" style="font-size:52px;padding:8px">${P.stickers.includes(s) ? s : '<span style="opacity:.2">❔</span>'}</div>`).join('')}</div><div class="muted center" style="font-size:20px;margin-top:8px">스티커 ${P.stickers.length}/${STICKERS.length} · 퀘스트, 출석, 퀴즈 손님에게서 받아요!</div>`;
    if (t === 'tro') inner = P.trophies.length ? `<div class="grid" style="grid-template-columns:repeat(5,1fr)">${P.trophies.map(x => `<div class="card"><div style="font-size:60px">${x.icon}</div><div class="t">${x.name}</div><div class="d">${x.year}년차</div></div>`).join('')}</div>` : `<div class="center muted" style="font-size:26px;margin-top:40px">🏆 연말 시상식(12월 끝)에서 트로피를 받아요!</div>`;
    if (t === 'stat') inner = `<div class="grid" style="grid-template-columns:repeat(4,1fr)">${[['🧍', '받은 손님', P.stats.customers], ['🍦', '판 아이스크림 돈', P.stats.sales], ['🧠', '맞힌 퀴즈', `${P.stats.quizRight}/${P.stats.quizTotal}`], ['⭐', '특별 손님', P.stats.vip], ['💯', '한 번에 성공', P.stats.perfect], ['📅', '장사한 달', P.stats.months], ['❤️', '평판 하트', P.rep], ['✨', '가게 매력', charm()]].map(([i, n, v]) => `<div class="card"><div style="font-size:46px">${i}</div><div class="d">${n}</div><div class="t" style="font-size:30px">${v}</div></div>`).join('')}</div>`;
    el.innerHTML = `<div class="tabs">${[['cust', '🧍 손님'], ['menu', '🍦 메뉴'], ['st', '⭐ 스티커'], ['tro', '🏆 트로피'], ['stat', '📊 기록']].map(([k, n]) => `<div class="tab ${t === k ? 'on' : ''}" data-t="${k}">${n}</div>`).join('')}</div><div class="scroll" style="max-height:330px;padding:4px">${inner}</div>`;
    $$('.tab', el).forEach(b => b.onclick = () => { Sound.sfx('tap'); t = b.dataset.t; draw(); });
  };
  draw();
}

/* ---------------- 오늘 끝 ---------------- */
function sessionEnd() {
  closeAll(); if (D) { D.running = false; } D = null; saveP(); if (S.music) Sound.music('hub'); shutter(true);
  kidPose('wave');
  const c = P.attend.count;
  const tease = pick(['내일은 ⭐ 특별 손님이 올지도 몰라요!', '내일은 어떤 손님이 올까요? 🐧', '새 맛을 연구해 볼까요? 🧪', '가게를 더 예쁘게 꾸며 봐요! 🎀', '퀴즈 손님이 기다리고 있어요! 🧠']);
  const m = modal(`<div style="width:860px;padding:28px" class="center"><div class="row" style="justify-content:center;gap:20px"><img src="${KID.poses[3]}" style="height:260px">
    <div><h2 style="font-size:46px">오늘 장사 끝!</h2><div style="font-size:28px;margin-top:8px">${KID.name} 사장님, 수고했어요! 👋<br>내일 또 만나요!</div></div></div>
    <div class="stamps" style="margin-top:14px">${Array.from({ length: 7 }, (_, i) => `<div class="stamp ${i < c ? 'on' : ''}">${i < c ? '💮' : (i === 6 ? '🎁' : i + 1)}</div>`).join('')}</div>
    <div style="font-size:24px;margin-top:14px;color:#9a6a86">${tease}</div>
    <button class="btn" id="ok" style="margin-top:16px">처음 화면으로</button></div>`);
  if (P.kid === 'jia') Sound.say(`오늘 장사 끝! 수고했어요. 내일 또 만나요!`);
  m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); P = null; KID = null; renderTitle(); };
}

/* ---------------- 일시정지 메뉴 ---------------- */
function openMenu() {
  if (!D) return; D.paused = true; Sound.sfx('tap');
  const m = modal(`<div style="width:620px;padding:28px" class="center"><h2>⏸ 잠깐 멈춤</h2>
    <div style="display:flex;flex-direction:column;gap:14px;margin-top:20px;align-items:center">
    <button class="btn" id="m-resume" style="width:360px">▶ 계속하기</button>
    <button class="btn white" id="m-quest" style="width:360px">📋 오늘의 퀘스트</button>
    <button class="btn white" id="m-book" style="width:360px">📖 도감</button>
    <button class="btn white" id="m-sound" style="width:360px">${S.music ? '🔊 음악 끄기' : '🔈 음악 켜기'}</button>
    <button class="btn gray" id="m-quit" style="width:360px">🏠 처음 화면 (저장하고 나가기)</button></div></div>`, { onClose: () => { if (D) D.paused = false; } });
  m.querySelector('#m-resume').onclick = () => { Sound.sfx('tap'); m.close(); };
  m.querySelector('#m-quest').onclick = () => { m.close(); D.paused = true; showQuests(); };
  m.querySelector('#m-book').onclick = () => { m.close(); D.paused = true; const b = modal(`<div style="width:1180px;padding:20px 24px"><h2>📖 도감</h2><div id="bk"></div></div>`, { close: true, onClose: () => { if (D) D.paused = false; } }); hubBook(b.querySelector('#bk')); };
  m.querySelector('#m-sound').onclick = () => { S.music = !S.music; Sound.set({ music: S.music }); if (S.music) Sound.startBgm(); saveS(); m.close(); };
  m.querySelector('#m-quit').onclick = () => { Sound.sfx('tap'); closeAll(); saveDay(); D = null; saveP(); P = null; KID = null; renderTitle(); };
}
function showQuests() {
  if (D) D.paused = true;
  modal(`<div style="width:720px;padding:26px" class="center"><h2>📋 오늘의 퀘스트</h2><div style="display:flex;flex-direction:column;gap:10px;margin:16px 20px">${P.quests.list.map(questHtml).join('')}</div>
    <div class="muted" style="font-size:20px">하나 끝낼 때마다 ${COIN} ${isBig() ? 30 : 20} · 모두 끝내면 스티커!</div></div>`, { close: true, onClose: () => { if (D) D.paused = false; } });
}

/* ---------------- 부모 설정 ---------------- */
function askPin(onOk) {
  let val = '';
  const setting = !S.pin; let first = null;
  const m = modal(`<div style="width:520px;padding:26px" class="center"><h2 id="pt">${setting ? '부모님 비밀번호 만들기' : '부모님 비밀번호'}</h2><div class="muted" id="ps" style="font-size:20px">${setting ? '아이들이 모르는 숫자 4자리를 정해 주세요' : '숫자 4자리를 눌러 주세요'}</div>
    <div class="pindots">${'<i></i>'.repeat(4)}</div><div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(n => `<button class="btn ${typeof n === 'number' ? 'white' : 'gray'}" data-n="${n}">${n}</button>`).join('')}</div></div>`, { close: true });
  const dots = () => $$('.pindots i', m).forEach((d, i) => d.classList.toggle('on', i < val.length));
  const submit = () => {
    if (val.length < 4) return;
    if (setting) {
      if (!first) { first = val; val = ''; m.querySelector('#ps').textContent = '한 번 더 눌러 주세요'; dots(); return; }
      if (first === val) { S.pin = val; saveS(); m.close(); onOk(); } else { first = null; val = ''; m.querySelector('#ps').textContent = '서로 달라요. 처음부터 다시!'; dots(); Sound.sfx('bad'); }
      return;
    }
    if (val === S.pin) { m.close(); onOk(); } else { val = ''; dots(); Sound.sfx('bad'); m.querySelector('#ps').textContent = '비밀번호가 달라요'; }
  };
  $$('[data-n]', m).forEach(b => b.onclick = () => {
    Sound.sfx('tap'); const n = b.dataset.n;
    if (n === '⌫') val = val.slice(0, -1); else if (n === '✓') return submit(); else if (val.length < 4) val += n;
    dots(); if (val.length === 4) setTimeout(submit, 120);
  });
}
function parentSettings() {
  const seg = (key, opts) => `<div class="seg" data-key="${key}">${opts.map(([v, n]) => `<button data-v="${v}" class="${S[key] === v ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const prof = (k) => { const p = Store.load(k); return p ? `${KIDS[k].name}: ${p.shop} · ${p.year}년차 ${p.month}월 · 오늘 ${p.time && p.time.date === today() ? Math.round(p.time.sec / 60) : 0}분 놀았어요` : `${KIDS[k].name}: 아직 가게 없음`; };
  const m = modal(`<div style="width:900px;padding:24px 30px"><h2>👨‍👩‍👧 부모님 설정</h2><div class="scroll" style="max-height:540px;margin-top:10px;padding-right:8px">
    <div class="setrow">⏰ 하루 놀이 시간 (아이별)${seg('limit', [[10, '10분'], [20, '20분'], [30, '30분'], [0, '제한 없음']])}</div>
    <div class="setrow">🔢 지아 숫자 범위${seg('jiaMax', [[5, '1~5'], [10, '1~10']])}</div>
    <div class="setrow">🔤 지안 영어 단계${seg('jianEn', [[1, '쉬움'], [2, '보통']])}</div>
    <div class="setrow">✖️ 지안 구구단${seg('jianDan', [[5, '2~5단'], [9, '2~9단']])}</div>
    <div class="setrow">🎵 배경음악${seg('music', [[true, '켜기'], [false, '끄기']])}</div>
    <div class="setrow">🔔 효과음${seg('sfx', [[true, '켜기'], [false, '끄기']])}</div>
    <div class="setrow">🗣️ 읽어주기 목소리${seg('voice', [[true, '켜기'], [false, '끄기']])}</div>
    ${['jian', 'jia'].map(k => `<div class="setrow"><span style="font-size:20px">${prof(k)}</span><span class="row"><button class="btn tiny white" data-more="${k}">+10분</button><button class="btn tiny white" data-reset="${k}">처음부터</button></span></div>`).join('')}
    <div class="setrow"><span>🎁 공부별 보상 · 쿠폰 · 공부 리포트</span><button class="btn tiny" id="rw">열기</button></div>
    <div class="setrow"><span style="font-size:20px">저장: 이 기기${Store.remote ? ' + 클로드 계정(다른 기기에서도 이어서)' : ''}</span><button class="btn tiny white" id="chpin">비밀번호 바꾸기</button></div>
    <div class="muted" style="font-size:18px;margin-top:10px">v1.2 · 다음 업데이트: 친구 안은별·이채은 등장</div></div></div>`, { close: true, onClose: renderTitle });
  $$('.seg', m).forEach(sg => $$('button', sg).forEach(b => b.onclick = () => {
    const key = sg.dataset.key; let v = b.dataset.v; v = v === 'true' ? true : v === 'false' ? false : +v; S[key] = v; saveS();
    Sound.set({ sfx: S.sfx, music: S.music, voice: S.voice }); if (key === 'music' && v) Sound.startBgm();
    $$('button', sg).forEach(x => x.classList.toggle('on', x === b)); Sound.sfx('tap');
  }));
  $$('[data-more]', m).forEach(b => b.onclick = () => { const k = b.dataset.more; const p = Store.load(k); if (!p) return; if (!p.time || p.time.date !== today()) p.time = { date: today(), sec: 0 }; p.time.bonus = (p.time.bonus || 0) + 600; Store.save(k, p); toast(`${KIDS[k].name}: 오늘 10분 더!`); });
  $$('[data-reset]', m).forEach(b => b.onclick = () => {
    const k = b.dataset.reset;
    const c = modal(`<div style="width:560px;padding:26px" class="center"><h2>정말 처음부터?</h2><p style="font-size:22px" class="muted">${KIDS[k].name}의 가게가 모두 지워져요.</p><div class="row" style="justify-content:center"><button class="btn white small" id="n">아니요</button><button class="btn small" id="y">지우기</button></div></div>`);
    c.querySelector('#n').onclick = () => c.close();
    c.querySelector('#y').onclick = () => { Store.save(k, { deleted: true }); c.close(); toast('지웠어요'); };
  });
  m.querySelector('#rw').onclick = () => { Sound.sfx('tap'); parentRewards(); };
  m.querySelector('#chpin').onclick = () => { S.pin = null; saveS(); m.close(); askPin(() => toast('비밀번호를 바꿨어요')); };
}

/* ---------------- 계절 효과 ---------------- */
function seasonFx() { $('#season-fx').innerHTML = ''; }
function spawnFlake() {
  const w = D.weather.key; const s = season();
  if (w === 'rain') return;
  const e = (w === 'snow' || s === '겨울') ? '❄️' : w === 'party' ? '🎊' : s === '봄' ? '🌸' : s === '가을' ? '🍁' : '✨';
  const f = h(`<div class="flake" style="left:${rnd(1280)}px;--dx:${rnd(160) - 80}px;--r:${rnd(360)}deg;animation-duration:${6 + Math.random() * 5}s;font-size:${18 + rnd(16)}px">${e}</div>`);
  $('#season-fx').appendChild(f); setTimeout(() => f.remove(), 11500);
}

/* ---------------- 시작 ---------------- */
function init() {
  S = Object.assign({}, DEFAULT_SETTINGS, Store.load('settings') || {});
  Sound.set({ sfx: S.sfx, music: S.music, voice: S.voice });
  fit();
  $('#rotate-ok').onclick = () => { window._rotOk = true; fit(); };
  $('#btn-parent').onclick = () => { Sound.ensure(); Sound.sfx('tap'); askPin(parentSettings); };
  $('#btn-sound').onclick = () => { Sound.ensure(); S.music = !S.music; Sound.set({ music: S.music }); if (S.music) Sound.music('title'); else Sound.stopBgm(); $('#btn-sound').textContent = S.music ? '🎵' : '🔇'; saveS(); };
  $('#btn-sound').textContent = S.music ? '🎵' : '🔇';
  $('#p-make').onclick = () => { const f = D && D.queue[0]; if (f && f.state === 'wait' && !f.serving && !D.orderOpen) openOrder(f); };
  $('#make-btn').onclick = () => { const f = D && D.queue[0]; if (f && f.state === 'wait' && !f.serving && !D.orderOpen) openOrder(f); };
  $('#h-menu').onclick = openMenu;
  $('#h-quest').onclick = () => { Sound.sfx('tap'); if (P) showQuests(); };
  document.addEventListener('pointerdown', () => { Sound.ensure(); try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } catch (e) {} if (S.music) Sound.music(); }, { once: true });
  renderTitle();
  requestAnimationFrame(loop);
  Store.connect((k) => { if (screen === 'scr-title') { if (k === 'settings') S = Object.assign({}, DEFAULT_SETTINGS, Store.load('settings') || {}); renderTitle(); } });
  if (window.claude && window.claude.use) window.claude.use('tts').then(t => { if (t) Sound.setTts(t); }).catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.hidden && P) { if (D && !D.ended) saveDay(); else saveP(); } });
  window.addEventListener('pagehide', () => { if (P) { if (D && !D.ended) saveDay(); else saveP(); } });
}
window.addEventListener('DOMContentLoaded', init);
