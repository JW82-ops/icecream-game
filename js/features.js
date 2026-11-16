/* ===== v1.2 : 바쁜 가게 · 가족 찬스 · 공부별 보상 · 성장 ===== */

/* ---------- 마이그레이션 ---------- */
function migrate12(p) {
  p.stars = p.stars || 0; p.starTotal = p.starTotal || 0; p.rewardIdx = p.rewardIdx || 0;
  p.coupons = p.coupons || []; p.qStreak = p.qStreak || 0; p.help = p.help || { date: null, left: HELP_PER_DAY };
  p.upgrades = p.upgrades || {}; p.mail = p.mail || []; p.studyLog = p.studyLog || {};
  p.bestTower = p.bestTower || 0; p.bestCombo = p.bestCombo || 0;
}
function otherKid() { return P.kid === 'jian' ? 'jia' : 'jian'; }
function up(k) { return !!(P && P.upgrades && P.upgrades[k]); }

/* ---------- 이미지 도우미 ---------- */
function custImg(type, happy) {
  if (type === 'sis') { const o = KIDS[otherKid()]; return happy ? o.poses[POSE.clap] : o.poses[POSE.idle]; }
  if (['influencer', 'reporter', 'camera', 'host'].includes(type)) return `img/cust/${type}.webp`;
  return `img/cust/${type}${happy ? '_h' : ''}.webp`;
}
function custInfo(type) {
  if (type === 'sis') { const o = KIDS[otherKid()]; return { name: `${o.name} ${P.kid === 'jia' ? '언니' : ''}`.trim(), h: o.key === 'jia' ? 215 : 240 }; }
  return CUSTOMERS[type];
}

/* ---------- 손님 수 · 러시 ---------- */
function makeSpawns(n, len) {
  // 시간대별 밀도: 오전 보통, 점심 러시, 오후 보통, 하교 러시
  const w = (f) => 1 + (f > 0.32 && f < 0.48 ? 1.6 : 0) + (f > 0.64 && f < 0.8 ? 1.3 : 0);
  const steps = 400, cdf = []; let acc = 0;
  for (let i = 0; i < steps; i++) { acc += w(i / steps); cdf.push(acc); }
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = ((i + Math.random() * 0.8) / n) * acc; const j = cdf.findIndex(v => v >= r);
    const t = 2 + (j / steps) * len * 0.9;
    out.push(t);
    if (Math.random() < 0.2 && i < n - 1) { out.push(t + 0.7 + Math.random()); i++; } // 같이 온 손님
  }
  return out.sort((a, b) => a - b);
}
function maxQueue() { return (isBig() ? 4 : 3) + (up('chair') ? 1 : 0) + (up('expand') ? 1 : 0); }
function rushNow() { if (!D) return false; const f = D.t / D.len; return (f > 0.32 && f < 0.48) || (f > 0.64 && f < 0.8); }

/* ---------- 콤보 · 피버 ---------- */
function comboHit(c) {
  D.combo = (D.combo || 0) + 1; D.maxCombo = Math.max(D.maxCombo || 0, D.combo); P.bestCombo = Math.max(P.bestCombo, D.combo);
  const need = isBig() ? 5 : 4;
  if (D.combo >= 2) floater(c.x - 40, c.y - 360, `${D.combo} 콤보!`);
  if (D.combo % need === 0) startFever();
}
function comboBreak() { if (D && D.combo >= 2) toast('콤보가 끊겼어요 😅 다시 도전!'); if (D) D.combo = 0; }
function startFever() {
  D.fever = 12 + (up('bell') ? 5 : 0);
  $('#scene').classList.add('fever'); banner('🔥 피버 타임! 돈이 2배! 🔥', 2200); Sound.sfx('level'); kidPose('jump', 1200);
  // 손님을 빨리 부름
  for (let i = D.nextSpawn; i < Math.min(D.spawns.length, D.nextSpawn + 3); i++) D.spawns[i] = Math.min(D.spawns[i], D.t + 1 + (i - D.nextSpawn) * 1.5);
}
function feverTick(dt) {
  if (!D.fever) return;
  D.fever = Math.max(0, D.fever - dt);
  const fb = $('#fever-bar'); if (fb) { fb.style.display = 'block'; fb.firstElementChild.style.width = `${D.fever / (12 + (up('bell') ? 5 : 0)) * 100}%`; }
  if (!D.fever) { $('#scene').classList.remove('fever'); if (fb) fb.style.display = 'none'; }
}

/* ---------- 엄마 · 아빠 찬스 ---------- */
function helpLeft() { if (P.help.date !== today()) P.help = { date: today(), left: HELP_PER_DAY }; return P.help.left; }
function useHelp() { if (helpLeft() <= 0) return false; P.help.left--; saveP(); updateHelpHud(); return true; }
function updateHelpHud() { const e = $('#h-help b'); if (e && P) e.textContent = helpLeft(); }
function familyPop(who, pose, text, parent) {
  const f = FAMILY[who];
  const el = h(`<div class="family-pop"><img src="${f.poses[pose]}"><div class="fbub">${text}</div></div>`);
  (parent || $('#overlay')).appendChild(el); Sound.sfx('sparkle');
  if (S.voice) Sound.say(text.replace(/<[^>]+>/g, ''));
  return el;
}
async function momChance(c, m, B, render, serveFn) {
  if (!useHelp()) { Sound.sfx('bad'); toast('오늘 찬스를 다 썼어요! 내일 다시 3번 생겨요'); return; }
  const pop = familyPop('mom', 1, '엄마가 도와줄게! 💕', m);
  c.helped = true;
  B.cont = c.order.cont; B.scoops = []; B.top = null; B.last = 'cont'; render();
  for (const f of c.order.scoops) { await wait(380); B.scoops.push(f); B.last = 'scoop'; Sound.sfx('plop'); render(); }
  if (c.order.top) { await wait(380); B.top = c.order.top; B.last = 'top'; Sound.sfx('sparkle'); render(); }
  await wait(650); pop.remove(); serveFn();
}
function dadChance(m, q, onUse) {
  if (!useHelp()) { Sound.sfx('bad'); toast('오늘 찬스를 다 썼어요! 내일 다시 3번 생겨요'); return; }
  const wrong = [...m.querySelectorAll('.q-opt')].filter(b => q.options[+b.dataset.i].v !== q.answer && !b.classList.contains('wrong'));
  if (wrong.length) { const b = pick(wrong); b.classList.add('wrong'); b.appendChild(h('<span class="q-mark">❌</span>')); }
  const pop = familyPop('dad', 2, '아빠 힌트! 이건 정답이 아니야.<br>남은 것 중에서 잘 골라 봐! 👍', m.querySelector('#quiz'));
  setTimeout(() => pop.remove(), 2600);
  onUse();
}

/* ---------- 공부별 · 보상 쿠폰 ---------- */
function rewardList(k) {
  const r = (S.rewards && S.rewards[k]) || DEFAULT_REWARDS[k];
  return r.map(([icon, name, need]) => ({ icon, name, need }));
}
function nextReward(p, k) { const l = rewardList(k); return l[p.rewardIdx] || null; }
function awardStars(firstTry, helped) {
  if (!firstTry || helped) { P.qStreak = 0; return 0; }
  P.qStreak++;
  let n = 1; if (P.qStreak % 5 === 0) n += 2; else if (P.qStreak % 3 === 0) n += 1;
  P.stars += n; P.starTotal += n;
  const d = today(); P.studyLog[d] = P.studyLog[d] || { right: 0, total: 0, stars: 0 }; P.studyLog[d].stars += n;
  updateStarHud();
  setTimeout(checkReward, 50);
  return n;
}
function logQuiz(right) { const d = today(); P.studyLog[d] = P.studyLog[d] || { right: 0, total: 0, stars: 0 }; P.studyLog[d].total++; if (right) P.studyLog[d].right++; }
function updateStarHud() {
  const e = $('#h-star'); if (!e || !P) return; const nr = nextReward(P, P.kid);
  e.innerHTML = nr ? `🌟 <b>${P.stars}</b><span>/${nr.need} ${nr.icon}</span>` : `🌟 <b>${P.stars}</b>`;
}
let rewardBusy = false;
async function checkReward() {
  if (rewardBusy) return; const nr = nextReward(P, P.kid); if (!nr || P.stars < nr.need) return;
  rewardBusy = true;
  const wasPaused = D && D.paused; if (D) D.paused = true;
  P.rewardIdx++; const cp = { icon: nr.icon, name: nr.name, date: today(), used: false, id: Date.now() };
  P.coupons.push(cp); saveP(); updateStarHud();
  const last = !nextReward(P, P.kid);
  Sound.sfx('level'); confetti(last ? 160 : 90);
  await new Promise(res => {
    const img = REWARD_IMG[nr.icon] ? `<img src="img/rewards/${REWARD_IMG[nr.icon]}.webp" class="cp-img">` : `<div style="font-size:120px">${nr.icon}</div>`;
    const m = modal(`<div class="coupon ${last ? 'final' : ''}"><div class="cp-top">🎁 공부별 보상 쿠폰 ${last ? '· 👑 최종 보상!' : ''}</div>
      <div class="row" style="justify-content:center;gap:16px">${img}<img src="${KID.poses[POSE.jump]}" style="height:230px"></div>
      <div class="cp-name">${nr.name} 쿠폰!</div>
      <div class="cp-desc">공부별 ⭐${nr.need}개를 모았어요! 엄마 아빠에게 이 쿠폰을 보여 주세요.<br><span class="muted">(가게 준비 화면 🎁쿠폰함에 보관돼요)</span></div>
      <button class="btn yellow" id="ok">야호! 🎉</button></div>`);
    if (S.voice) Sound.say(`축하해요! ${nr.name} 쿠폰을 받았어요! 엄마 아빠에게 보여 주세요!`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
  if (D && !wasPaused) D.paused = false;
  rewardBusy = false;
}
function couponHtml(c, i, withUse) {
  return `<div class="card ${c.used ? 'lock' : ''}" style="min-height:190px">${c.used ? '<span class="tagc" style="background:#9ca3af">사용 완료</span>' : '<span class="tagc">사용 가능</span>'}
    ${REWARD_IMG[c.icon] ? `<img src="img/rewards/${REWARD_IMG[c.icon]}.webp">` : `<div style="font-size:64px">${c.icon}</div>`}
    <div class="t">${c.name}</div><div class="d">${c.date} 받음</div>${withUse && !c.used ? `<button class="btn tiny" data-use="${i}">사용 완료 처리</button>` : ''}</div>`;
}

/* ---------- 홍보 이벤트 ---------- */
async function adEvents() {
  const ads = Object.keys(P.adsActive || {}).filter(k => ['magazine', 'influencer', 'tv'].includes(k) && !(P.adsShown || {})[k]);
  P.adsShown = P.adsShown || {};
  for (const k of ads) {
    P.adsShown[k] = true; P.rep += ADS[k].rep; updateHud(); saveP();
    if (k === 'magazine') await magazineScene();
    if (k === 'tv') await tvScene();
  }
}
function magazineScene() {
  return new Promise(res => {
    const stars = '★'.repeat(Math.min(5, P.level + 1));
    const m = modal(`<div class="mag"><div class="mag-h">SWEET <b>WEEKLY</b><span>${P.year}년차 ${P.month}월호</span></div>
      <div class="mag-body"><img src="${THEMES[P.theme].bg}" class="mag-bg"><img src="${KID.poses[POSE.thumb]}" class="mag-kid"><img src="img/cust/reporter.webp" class="mag-rep">
      <div class="mag-title">이번 주 맛집!<br><b>${P.shop}</b></div><div class="mag-star">${stars}</div>
      <div class="mag-quote">"${KID.name} 사장님의 아이스크림은<br>한 입 먹으면 웃음이 나요!"</div></div>
      <div class="center" style="padding:14px"><span style="font-size:24px">📰 잡지에 실렸어요! ${HEART} +${ADS.magazine.rep} · 이번 달 손님 UP!</span><br><button class="btn yellow" id="ok" style="margin-top:10px">와! 신난다 🎉</button></div></div>`);
    Sound.sfx('cheer'); confetti(60);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
}
function tvScene() {
  return new Promise(res => {
    const m = modal(`<div class="tv"><div class="tv-screen"><img src="${THEMES[P.theme].bg}" class="mag-bg"><div class="tv-live">● LIVE 생방송</div>
      <img src="img/cust/host.webp" class="tv-host"><img src="${KID.poses[POSE.clap]}" class="tv-kid"><img src="img/cust/camera.webp" class="tv-cam">
      <div class="tv-cap">📺 전국 맛집 탐방 — <b>${P.shop}</b></div></div>
      <div class="center" style="padding:14px"><span style="font-size:24px">TV에 나왔어요! ${HEART} +${ADS.tv.rep} · 이번 달 손님 폭발!</span><br><button class="btn yellow" id="ok" style="margin-top:10px">우리 가게가 TV에! 📺</button></div></div>`);
    Sound.sfx('cheer'); confetti(100);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
}

/* ---------- 업그레이드 탭 ---------- */
function hubUpgrades(el, refresh) {
  el.innerHTML = `<div class="muted center" style="font-size:22px;margin-bottom:8px">가게를 키우면 손님이 더 많이 오고, 장사가 더 쉬워져요!</div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">${Object.entries(UPGRADES).map(([k, u]) => {
      const lock = P.level < u.level; const have = up(k); const money = u.fromSavings ? P.savings : P.coins;
      return `<div class="card ${lock ? 'lock' : ''} ${have ? 'done' : ''}">${have ? '<span class="tagc">설치 완료</span>' : ''}<div style="font-size:56px">${u.icon}</div><div class="t">${u.name}</div><div class="d">${lock ? `🔒 Lv.${u.level}에 열려요` : u.desc}</div>
        ${lock || have ? '' : `<button class="btn small ${money >= u.cost ? 'green' : 'gray'}" data-u="${k}">${u.fromSavings ? '🐷' : COIN} ${u.cost}</button>`}</div>`;
    }).join('')}</div>`;
  $$('[data-u]', el).forEach(b => b.onclick = async () => {
    const k = b.dataset.u, u = UPGRADES[k];
    if (u.fromSavings) { if (P.savings < u.cost) { Sound.sfx('bad'); toast(`저금통에 ${u.cost - P.savings}코인이 더 필요해요!`); return; } P.savings -= u.cost; }
    else if (!spend(u.cost, 'decor')) { Sound.sfx('bad'); toast(`${u.cost - P.coins}코인이 더 필요해요!`); return; }
    P.upgrades[k] = true; saveP(); Sound.sfx('buy'); confetti(40); kidPose('thumb', 1500);
    toast(`${u.icon} ${u.name} 완료!`);
    if (k === 'branch') { P.trophies.push({ icon: '🏬', name: '2호점 오픈', year: P.year }); await say('🏬 2호점이 문을 열었어요!', '이제 매달 2호점에서도 돈이 들어와요. 진짜 사장님이에요! 👑'); }
    refresh();
  });
}
function branchIncome() { return up('branch') ? 300 + P.level * 60 : 0; }

/* ---------- 공부방 (스피드 퀴즈) ---------- */
async function studyRoom(refresh) {
  const N = 10; let right = 0, stars = 0, fast = 0; const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const r = await runQuiz(null, null, false, { title: `📚 공부방 ${i + 1}/${N}`, speed: true });
    if (r && r.right) right++; if (r && r.stars) stars += r.stars; if (r && r.fast) fast++;
    if (r && r.quit) break;
  }
  const secs = Math.round((Date.now() - t0) / 1000);
  const bonus = right * (isBig() ? 4 : 3) + fast * 2; addCoins(bonus, 'quiz'); saveP();
  Sound.sfx(right >= 8 ? 'level' : 'good'); if (right >= 8) confetti(70);
  await new Promise(res => {
    const m = modal(`<div style="width:720px;padding:26px" class="center"><h2>📚 공부방 결과</h2>
      <div class="row" style="justify-content:center;gap:36px;margin:16px 0;font-size:28px"><div>✅ 정답<br><b style="font-size:52px;color:#16a34a">${right}</b>/${N}</div><div>🌟 공부별<br><b style="font-size:52px;color:#f59e0b">+${stars}</b></div><div>⚡ 번개 정답<br><b style="font-size:52px;color:#c23a74">${fast}</b></div></div>
      <div style="font-size:24px">걸린 시간 ${secs}초 · 보너스 ${COIN} +${bonus}</div>
      <div class="muted" style="font-size:20px;margin-top:6px">${right >= 9 ? '완벽해요! 공부 천재!' : right >= 6 ? '잘했어요! 조금만 더 하면 만점!' : '괜찮아요, 다시 하면 더 잘할 수 있어요!'}</div>
      <button class="btn" id="ok" style="margin-top:14px">좋아요!</button></div>`);
    m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
  });
  refresh && refresh();
}
function hubStudy(el, refresh) {
  const nr = nextReward(P, P.kid);
  const log = P.studyLog[today()] || { right: 0, total: 0, stars: 0 };
  el.innerHTML = `<div class="row" style="gap:26px;justify-content:center;align-items:flex-start">
    <div class="center" style="width:420px"><img src="${KID.poses[POSE.think]}" style="height:230px"><div style="font-size:30px;margin-top:6px">🌟 공부별 <b style="color:#f59e0b;font-size:46px">${P.stars}</b>개</div>
      ${nr ? `<div class="quest" style="margin-top:8px"><span style="font-size:34px">${nr.icon}</span><div class="qb">다음 보상: <b>${nr.name}</b><div class="qbar"><i style="width:${Math.min(100, P.stars / nr.need * 100)}%"></i></div></div><span class="muted" style="font-size:20px">${P.stars}/${nr.need}</span></div>` : '<div style="font-size:24px;margin-top:8px">👑 모든 보상을 다 받았어요!</div>'}</div>
    <div style="width:520px"><div class="sect" style="font-size:26px">📚 스피드 퀴즈 10문제</div>
      <div class="muted" style="font-size:21px;line-height:1.5;margin:6px 0 14px">처음에 바로 맞히면 🌟 공부별!<br>3연속 정답 +1, 5연속 정답 +2 보너스 별<br>빨리 맞히면 ⚡ 번개 보너스 코인!</div>
      <button class="btn yellow" id="go-study" style="font-size:34px;padding:18px 34px">📚 공부 시작!</button>
      <div class="muted" style="font-size:20px;margin-top:16px">오늘: 정답 ${log.right}/${log.total} · 받은 별 ${log.stars}개 · 연속 정답 ${P.qStreak}</div></div></div>`;
  el.querySelector('#go-study').onclick = () => { Sound.sfx('pop'); studyRoom(refresh); };
}
function hubCoupons(el, refresh) {
  const list = rewardList(P.kid);
  el.innerHTML = `<div class="sect" style="font-size:24px">🎁 보상 사다리</div>
    <div class="ladder">${list.map((r, i) => `<div class="rung ${i < P.rewardIdx ? 'got' : i === P.rewardIdx ? 'now' : ''}">${REWARD_IMG[r.icon] ? `<img src="img/rewards/${REWARD_IMG[r.icon]}.webp">` : `<span style="font-size:40px">${r.icon}</span>`}<div class="d">${r.name}</div><div class="nd">⭐${r.need}</div></div>`).join('<span class="arrow">▶</span>')}</div>
    <div class="sect" style="font-size:24px;margin-top:14px">🎟️ 내 쿠폰함</div>
    ${P.coupons.length ? `<div class="grid" style="grid-template-columns:repeat(5,1fr);margin-top:6px">${P.coupons.map((c, i) => couponHtml(c, i, false)).join('')}</div>` : '<div class="muted center" style="font-size:22px;margin-top:10px">아직 쿠폰이 없어요. 퀴즈를 맞혀서 🌟공부별을 모아요!</div>'}
    <div class="muted center" style="font-size:19px;margin-top:10px">쿠폰은 엄마 아빠에게 보여 주면, 부모님 설정에서 "사용 완료"로 바꿔 줘요.</div>`;
}

/* ---------- 자매 가게 ---------- */
function hubSister(el, refresh) {
  const ok = otherKid(); const o = KIDS[ok]; const sp = Store.load(ok);
  if (!sp) { el.innerHTML = `<div class="center" style="margin-top:40px"><img src="${o.face}" style="height:140px;border-radius:24px"><div style="font-size:28px;margin-top:10px">${o.name}는 아직 가게가 없어요.<br>${o.name}도 가게를 열면 서로 놀러 갈 수 있어요!</div></div>`; return; }
  migrate12(sp);
  el.innerHTML = `<div class="row" style="gap:26px;align-items:flex-start;justify-content:center">
    <div class="sis-card" style="--c:${o.apron}"><img src="${THEMES[sp.theme].bg}" class="sis-bg"><img src="${o.poses[POSE.idle]}" class="sis-kid">
      <div class="sis-info"><b>${sp.shop}</b><br>Lv.${sp.level} ${LEVELS.find(l => l.lv === sp.level).name}<br>🌟 ${sp.stars} · 손님 ${sp.stats.customers}명</div></div>
    <div style="width:520px"><div class="sect" style="font-size:24px">💌 ${o.name}에게 선물 보내기</div>
      <div class="muted" style="font-size:20px;margin:4px 0 10px">${o.name}가 다음에 가게를 열면 선물이 도착해요! (하루 1번)</div>
      <div class="row" style="flex-wrap:wrap;gap:10px">
        <button class="btn small yellow" data-g="coin50">${COIN} 50코인</button>
        <button class="btn small yellow" data-g="coin100">${COIN} 100코인</button>
        <button class="btn small purple" data-g="sticker">⭐ 내 스티커 1장</button>
        <button class="btn small" data-g="heart">💌 응원 편지</button></div>
      <div class="muted" style="font-size:20px;margin-top:16px">🏃 ${o.name}도 가끔 내 가게에 손님으로 놀러 와요! 맛있게 만들어 주면 하트를 많이 줘요.</div></div></div>`;
  const sentToday = (P.giftDate === today());
  $$('[data-g]', el).forEach(b => {
    if (sentToday) b.disabled = true;
    b.onclick = () => {
      const g = b.dataset.g; let item = { from: P.kid, date: today() };
      if (g === 'coin50' || g === 'coin100') { const v = g === 'coin50' ? 50 : 100; if (!spend(v, 'decor')) { Sound.sfx('bad'); toast('코인이 부족해요!'); return; } item.coins = v; }
      if (g === 'sticker') { if (!P.stickers.length) { Sound.sfx('bad'); toast('보낼 스티커가 없어요!'); return; } item.sticker = P.stickers[P.stickers.length - 1]; }
      if (g === 'heart') item.letter = true;
      const s2 = Store.load(ok); migrate12(s2); s2.mail.push(item); Store.save(ok, s2);
      P.giftDate = today(); saveP(); Sound.sfx('buy'); toast(`💌 ${o.name}에게 선물을 보냈어요!`); refresh();
    };
  });
}
async function checkMail() {
  if (!P.mail || !P.mail.length) return;
  const mail = P.mail.splice(0); saveP();
  for (const it of mail) {
    const from = KIDS[it.from]; let txt = '';
    if (it.coins) { addCoins(it.coins, 'quest'); txt = `${COIN} ${it.coins}코인`; }
    if (it.sticker) { if (!P.stickers.includes(it.sticker)) P.stickers.push(it.sticker); txt = `스티커 ${it.sticker}`; }
    if (it.letter) { P.rep += 5; txt = `응원 편지 💌 (하트 +5)`; }
    await new Promise(res => {
      const m = modal(`<div style="width:680px;padding:26px" class="center"><div style="font-size:30px;color:#9a6a86">💌 선물이 도착했어요!</div>
        <img src="${from.poses[POSE.wave]}" style="height:220px;margin:8px"><h2>${from.name}${it.from === 'jian' ? ' 언니' : ''}가 보냈어요</h2><div style="font-size:30px;margin:8px 0">${txt}</div>
        <button class="btn yellow" id="ok">고마워! 💕</button></div>`);
      Sound.sfx('sparkle'); if (S.voice) Sound.say(`${from.name}가 선물을 보냈어요!`);
      m.querySelector('#ok').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
    });
  }
  saveP();
}

/* ---------- 탑 쌓기 미니게임 ---------- */
function towerGame() {
  return new Promise(res => {
    const FL = P.flavors.slice();
    const m = modal(`<div id="tower"><div class="tw-head"><b>🍦 아이스크림 탑 쌓기!</b><span id="tw-score">0층</span></div>
      <div id="tw-field"><img src="img/items/cone.webp" class="tw-cone"><div id="tw-stack"></div><img id="tw-drop" class="tw-scoop"></div>
      <div class="tw-foot muted">화면을 톡! 눌러서 스쿱을 떨어뜨려요. 콘 위에 딱 맞게 쌓아요!</div></div>`);
    const field = m.querySelector('#tw-field'), stack = m.querySelector('#tw-stack'), drop = m.querySelector('#tw-drop');
    const W = 600, SW = 130; let level = 0, baseX = W / 2, x = 60, dir = 1, speed = isBig() ? 320 : 230, falling = false, alive = true, last = performance.now();
    const pickF = () => pick(FL);
    let cur = pickF(); drop.src = `img/items/${cur}.webp`;
    const yOf = (lv) => 110 + lv * 52; // 바닥에서
    const cam = () => Math.max(0, yOf(level) - 330);
    const draw = () => {
      drop.style.left = x + 'px'; drop.style.bottom = (yOf(level) + 190 - cam()) + 'px';
      stack.style.transform = `translateY(${cam()}px)`; m.querySelector('.tw-cone').style.transform = `translateX(-50%) translateY(${cam()}px)`;
    };
    const frame = (ts) => {
      if (!alive) return; const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (!falling) { x += dir * speed * dt; if (x > W - SW / 2 - 10) { x = W - SW / 2 - 10; dir = -1; } if (x < SW / 2 + 10) { x = SW / 2 + 10; dir = 1; } }
      draw(); requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    const finish = () => {
      alive = false; const coins = level * (isBig() ? 4 : 3) + (level >= 8 ? 20 : 0);
      if (level > P.bestTower) P.bestTower = level;
      addCoins(coins, 'quest'); saveP();
      setTimeout(() => { m.querySelector('.tw-foot').innerHTML = `<div style="font-size:30px;color:#c23a74">${level}층 성공! ${COIN} +${coins} ${level >= P.bestTower && level > 0 ? '· 🏆 최고 기록!' : ''}</div><button class="btn yellow" id="tw-ok" style="margin-top:8px">좋아요!</button>`;
        m.querySelector('#tw-ok').onclick = () => { Sound.sfx('tap'); m.close(); res(coins); }; }, 500);
    };
    field.addEventListener('pointerdown', (e) => {
      e.preventDefault(); if (falling || !alive) return; falling = true;
      const off = x - baseX; const tol = SW * (isBig() ? 0.42 : 0.55);
      if (Math.abs(off) <= tol) {
        const el = h(`<img class="tw-scoop placed" src="img/items/${cur}.webp" style="left:${x}px;bottom:${yOf(level)}px">`); stack.appendChild(el);
        baseX = baseX + off * 0.5; level++; Sound.sfx('plop');
        if (Math.abs(off) < 12) { floater(640, 200, '퍼펙트! ✨'); Sound.sfx('sparkle'); }
        m.querySelector('#tw-score').textContent = `${level}층`;
        speed += isBig() ? 24 : 14; cur = pickF(); drop.src = `img/items/${cur}.webp`; x = dir > 0 ? SW / 2 + 10 : W - SW / 2 - 10;
        falling = false;
        if (level >= 15) { Sound.sfx('level'); confetti(60); finish(); }
      } else {
        Sound.sfx('sad'); drop.classList.add('fall'); kidPose('oops', 1200); finish();
      }
    });
  });
}

/* ---------- 부모님: 보상·쿠폰·리포트 ---------- */
function parentRewards() {
  const m = modal(`<div style="width:1000px;padding:24px 28px"><h2>🎁 보상 · 쿠폰 · 공부 리포트</h2><div class="scroll" id="pr" style="max-height:560px;margin-top:10px;padding-right:6px"></div></div>`, { close: true });
  const draw = () => {
    S.rewards = S.rewards || JSON.parse(JSON.stringify(DEFAULT_REWARDS));
    const body = m.querySelector('#pr');
    body.innerHTML = ['jian', 'jia'].map(k => {
      const p = Store.load(k); if (p) migrate12(p);
      const days = Object.keys(p ? p.studyLog : {}).slice(-7);
      const wk = days.reduce((a, d) => { const l = p.studyLog[d]; a.r += l.right; a.t += l.total; a.s += l.stars; return a; }, { r: 0, t: 0, s: 0 });
      return `<div class="pr-kid"><div class="row" style="gap:12px"><img src="${KIDS[k].face}" style="height:60px;border-radius:14px"><b style="font-size:28px;color:#c23a74">${KIDS[k].name}</b>
        <span style="font-size:20px">🌟 지금 ${p ? p.stars : 0}개 · 최근 7일 정답 ${wk.r}/${wk.t} (${wk.t ? Math.round(wk.r / wk.t * 100) : 0}%) · 받은 별 ${wk.s}</span></div>
        <div class="pr-rows">${S.rewards[k].map((r, i) => `<div class="pr-row"><span style="font-size:30px">${r[0]}</span><input class="pr-name" data-k="${k}" data-i="${i}" value="${r[1]}" maxlength="12"><button class="btn tiny white" data-k="${k}" data-i="${i}" data-d="-5">−5</button><b style="width:60px;text-align:center">⭐${r[2]}</b><button class="btn tiny white" data-k="${k}" data-i="${i}" data-d="5">+5</button>${p && i < p.rewardIdx ? '<span class="muted">받음</span>' : ''}</div>`).join('')}</div>
        ${p && p.coupons.length ? `<div class="grid" style="grid-template-columns:repeat(6,1fr);margin-top:8px">${p.coupons.map((c, i) => couponHtml(c, i, true).replace('data-use=', `data-kid="${k}" data-use=`)).join('')}</div>` : '<div class="muted" style="font-size:18px">아직 받은 쿠폰이 없어요</div>'}</div>`;
    }).join('') + `<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn tiny white" id="pr-reset">보상 기본값으로</button></div>`;
    $$('[data-d]', body).forEach(b => b.onclick = () => { const r = S.rewards[b.dataset.k][+b.dataset.i]; r[2] = Math.max(5, r[2] + +b.dataset.d); saveS(); Sound.sfx('tap'); draw(); });
    $$('.pr-name', body).forEach(inp => inp.onchange = () => { S.rewards[inp.dataset.k][+inp.dataset.i][1] = inp.value.trim() || S.rewards[inp.dataset.k][+inp.dataset.i][1]; saveS(); });
    $$('[data-use]', body).forEach(b => b.onclick = () => { const k = b.dataset.kid, p = Store.load(k); migrate12(p); p.coupons[+b.dataset.use].used = true; Store.save(k, p); Sound.sfx('stamp'); toast('쿠폰 사용 완료!'); draw(); });
    body.querySelector('#pr-reset').onclick = () => { S.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS)); saveS(); draw(); };
  };
  draw();
}
