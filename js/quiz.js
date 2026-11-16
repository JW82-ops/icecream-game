/* ===== 퀴즈 문제 은행 ===== */
const Quiz = (() => {
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n, not = []) => shuffle(a.filter(x => !not.includes(x))).slice(0, n);

  // ---------- 지아: 한글 단어 ----------
  const KO_WORDS = [
    ['딸기','🍓'],['사과','🍎'],['포도','🍇'],['바나나','🍌'],['수박','🍉'],['우유','🥛'],['토끼','🐰'],['곰','🐻'],
    ['고양이','🐱'],['강아지','🐶'],['펭귄','🐧'],['사자','🦁'],['돼지','🐷'],['별','⭐'],['달','🌙'],['해','☀️'],
    ['꽃','🌸'],['나무','🌳'],['자동차','🚗'],['버스','🚌'],['공','⚽'],['책','📖'],['하트','❤️'],['선물','🎁'],
    ['케이크','🍰'],['사탕','🍬'],['모자','👒'],['신발','👟'],['가방','🎒'],['시계','⏰'],['우산','☂️'],['비행기','✈️'],
    ['기차','🚂'],['물고기','🐟'],['오리','🦆'],['나비','🦋'],['개구리','🐸'],['거북이','🐢'],['포크','🍴'],['아이스크림','🍦'],
  ];
  const TWO = KO_WORDS.filter(w => [...w[0]].length === 2);

  // ---------- 지안: 영어 ----------
  const EN_WORDS = [
    ['apple','🍎','사과'],['banana','🍌','바나나'],['grape','🍇','포도'],['strawberry','🍓','딸기'],['orange','🍊','오렌지'],
    ['lemon','🍋','레몬'],['peach','🍑','복숭아'],['cherry','🍒','체리'],['watermelon','🍉','수박'],['milk','🥛','우유'],
    ['cake','🍰','케이크'],['cookie','🍪','쿠키'],['candy','🍬','사탕'],['bread','🍞','빵'],['egg','🥚','달걀'],
    ['cat','🐱','고양이'],['dog','🐶','강아지'],['rabbit','🐰','토끼'],['bear','🐻','곰'],['penguin','🐧','펭귄'],
    ['fish','🐟','물고기'],['bird','🐦','새'],['lion','🦁','사자'],['pig','🐷','돼지'],['cow','🐮','소'],
    ['sun','☀️','해'],['moon','🌙','달'],['star','⭐','별'],['flower','🌸','꽃'],['tree','🌳','나무'],
    ['car','🚗','자동차'],['bus','🚌','버스'],['ball','⚽','공'],['book','📖','책'],['hat','👒','모자'],
    ['house','🏠','집'],['ice cream','🍦','아이스크림'],['heart','❤️','하트'],['gift','🎁','선물'],['bag','🎒','가방'],
    ['pencil','✏️','연필'],['clock','⏰','시계'],['shoe','👟','신발'],['frog','🐸','개구리'],['duck','🦆','오리'],
  ];
  const SHORT = EN_WORDS.filter(w => w[0].length <= 5 && !w[0].includes(' '));
  const COLORS = [
    ['red','#ef4444','빨강'],['blue','#3b82f6','파랑'],['yellow','#facc15','노랑'],['green','#22c55e','초록'],
    ['pink','#f9a8d4','분홍'],['purple','#a855f7','보라'],['orange','#fb923c','주황'],['white','#ffffff','하양'],
    ['black','#1f2937','검정'],['brown','#92400e','갈색'],
  ];
  const NUM_EN = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
  const PHRASES = [
    ['Hello!','안녕하세요'],['Thank you!','고맙습니다'],['Goodbye!','잘 가요'],['Sorry!','미안해요'],
    ['Yummy!','맛있어요'],['How much?','얼마예요?'],['I like it!','마음에 들어요'],['Good morning!','좋은 아침이에요'],
    ['One more, please.','하나 더 주세요'],['Yes, please.','네, 주세요'],['No, thank you.','괜찮아요(사양할게요)'],['See you!','또 만나요'],
  ];

  // ---------- 지안: 역사 ----------
  const HISTORY = [
    ['한글을 만든 임금님은 누구일까요?','세종대왕',['이순신','광개토대왕'],'세종대왕은 백성들이 쉽게 글을 읽고 쓰도록 한글을 만들었어요.'],
    ['거북선을 만들어 바다에서 나라를 지킨 장군은?','이순신',['강감찬','을지문덕'],'이순신 장군은 거북선과 함께 바다에서 큰 승리를 거두었어요.'],
    ['우리나라 글자의 이름은?','한글',['한자','알파벳'],'한글은 세종대왕이 만든 우리나라 고유의 글자예요.'],
    ['한글을 처음 세상에 알린 책 이름은?','훈민정음',['동의보감','삼국유사'],'훈민정음은 "백성을 가르치는 바른 소리"라는 뜻이에요.'],
    ['비의 양을 재는 측우기를 만든 과학자는?','장영실',['김홍도','허준'],'장영실은 해시계, 물시계, 측우기 같은 멋진 발명품을 만들었어요.'],
    ['5만 원짜리 지폐에 그려진 분은?','신사임당',['유관순','세종대왕'],'신사임당은 그림과 글씨를 잘한 조선의 예술가예요.'],
    ['만 원짜리 지폐에 그려진 분은?','세종대왕',['이순신','장영실'],'만 원 지폐 앞면에는 세종대왕이 있어요.'],
    ['100원짜리 동전에 그려진 분은?','이순신',['세종대왕','장영실'],'100원 동전에는 이순신 장군이 그려져 있어요.'],
    ['3·1 운동 때 "대한 독립 만세"를 외친 학생은?','유관순',['신사임당','허준'],'유관순 열사는 나라를 되찾기 위해 용감하게 만세를 외쳤어요.'],
    ['별을 관찰하던 신라의 천문대 이름은?','첨성대',['남대문','석굴암'],'첨성대는 아주 오래된 별 관측대예요. 경주에 있어요.'],
    ['조선의 임금님이 살던 큰 궁궐은?','경복궁',['불국사','첨성대'],'경복궁은 서울에 있는 조선의 대표 궁궐이에요.'],
    ['우리나라 국기의 이름은?','태극기',['일장기','성조기'],'태극기 가운데에는 빨강·파랑 태극 무늬가 있어요.'],
    ['우리나라를 대표하는 나라꽃은?','무궁화',['장미','해바라기'],'무궁화는 "끝없이 피는 꽃"이라는 뜻이에요.'],
    ['「동의보감」이라는 의학책을 쓴 의사는?','허준',['장영실','정약용'],'허준은 아픈 사람을 돕기 위해 동의보감을 썼어요.'],
    ['고구려의 땅을 아주 넓게 넓힌 왕은?','광개토대왕',['세종대왕','왕건'],'광개토대왕은 고구려를 크고 강한 나라로 만들었어요.'],
    ['우리나라 첫 나라 고조선을 세운 사람은?','단군왕검',['주몽','박혁거세'],'단군왕검이 세운 고조선이 우리 역사의 첫 나라예요.'],
    ['이순신 장군이 전쟁 중에 쓴 일기는?','난중일기',['그림일기','백범일지'],'난중일기는 전쟁 중에 쓴 이순신 장군의 일기예요.'],
    ['씨름하는 사람들 그림으로 유명한 조선의 화가는?','김홍도',['피카소','장영실'],'김홍도는 사람들의 생활 모습을 재미있게 그렸어요.'],
    ['한글날은 몇 월 며칠일까요?','10월 9일',['3월 1일','8월 15일'],'10월 9일은 한글을 기념하는 한글날이에요.'],
    ['나라를 되찾은 것을 기념하는 광복절은?','8월 15일',['10월 3일','6월 6일'],'8월 15일 광복절은 나라를 되찾은 날이에요.'],
    ['우리나라가 처음 세워진 것을 기념하는 개천절은?','10월 3일',['5월 5일','12월 25일'],'10월 3일 개천절은 "하늘이 열린 날"이라는 뜻이에요.'],
    ['세종대왕이 다스리던 나라의 이름은?','조선',['신라','고려'],'세종대왕은 조선의 네 번째 임금님이에요.'],
    ['불국사와 석굴암이 있는 도시는?','경주',['부산','인천'],'경주는 신라의 수도였던 도시예요.'],
    ['조선 시대 서울을 부르던 이름은?','한양',['평양','경주'],'조선 시대에는 서울을 한양이라고 불렀어요.'],
    ['남대문의 원래 이름은?','숭례문',['광화문','흥인지문'],'숭례문은 서울의 남쪽 큰 문이에요.'],
    ['청해진을 세워 "바다의 왕"이라 불린 사람은?','장보고',['이순신','왕건'],'장보고는 바다 무역을 이끈 신라 사람이에요.'],
    ['고려를 세운 왕은?','왕건',['이성계','주몽'],'왕건이 세운 나라가 고려예요. "코리아"라는 이름이 고려에서 왔어요.'],
    ['조선을 세운 왕은?','이성계',['왕건','세종대왕'],'이성계(태조)가 조선을 세웠어요.'],
    ['나무판에 불경을 새긴 「팔만대장경」을 만든 나라는?','고려',['조선','신라'],'팔만대장경은 고려 사람들이 만든 소중한 문화유산이에요.'],
    ['어린이날을 만든 분은?','방정환',['허준','김구'],'방정환 선생님은 어린이를 소중히 여기자고 어린이날을 만들었어요.'],
  ];

  // ---------- 출제 도우미 ----------
  const emojiOpt = (e) => `<span class="q-emoji">${e}</span>`;
  const itemRow = (src, n) => `<div class="q-items">${Array.from({ length: n }, () => `<img src="${src}">`).join('')}</div>`;
  const coinRow = (n) => `<div class="q-items coins">${Array.from({ length: n }, () => `<img src="img/icons/coin.webp">`).join('')}</div>`;
  const nums = (ans, lo, hi, n = 3) => {
    const s = new Set([ans]);
    let guard = 0;
    while (s.size < n && guard++ < 50) { const d = ans + (rnd(5) - 2) || ans + 3; if (d >= lo && d <= hi) s.add(d); }
    while (s.size < n) s.add(lo + rnd(hi - lo + 1));
    return shuffle([...s]);
  };
  const SCOOP_IMG = ['img/items/strawberry.webp','img/items/vanilla.webp','img/items/choco.webp','img/items/mint.webp','img/items/mango.webp','img/items/blueberry.webp'];

  // ---------- 지아 문제 ----------
  function jiaCount(max) {
    const n = 1 + rnd(Math.min(max, 10)); const src = pick(SCOOP_IMG);
    return { cat: '숫자', prompt: '아이스크림이 몇 개 있을까요?', say: '아이스크림이 몇 개 있을까요?',
      visual: itemRow(src, n), options: nums(n, 1, Math.max(10, max)).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: n,
      explain: `하나, 둘, 셋… 모두 ${n}개예요!` };
  }
  function jiaAdd(max) {
    const total = 2 + rnd(Math.min(max, 10) - 1); const a = 1 + rnd(total - 1), b = total - a; const src = pick(SCOOP_IMG);
    return { cat: '덧셈', prompt: `${a}개와 ${b}개를 더하면 몇 개일까요?`, say: `${a}개와 ${b}개를 더하면 몇 개일까요?`,
      visual: `<div class="q-sum">${itemRow(src, a)}<b>+</b>${itemRow(src, b)}</div>`,
      options: nums(total, 1, Math.max(10, max)).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: total,
      explain: `${a} 더하기 ${b}는 ${total}이에요!` };
  }
  function jiaSub(max) {
    const a = 3 + rnd(Math.min(max, 10) - 2); const b = 1 + rnd(a - 1); const ans = a - b; const src = pick(SCOOP_IMG);
    const vis = `<div class="q-items">${Array.from({ length: a }, (_, i) => `<img src="${src}" class="${i >= a - b ? 'eaten' : ''}">`).join('')}</div>`;
    return { cat: '뺄셈', prompt: `${a}개 중에서 ${b}개를 먹었어요. 몇 개 남았을까요?`, say: `${a}개 중에서 ${b}개를 먹었어요. 몇 개 남았을까요?`,
      visual: vis, options: nums(ans, 0, 10).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: ans,
      explain: `${a} 빼기 ${b}는 ${ans}이에요!` };
  }
  function jiaMore() {
    let a = 1 + rnd(8), b = 1 + rnd(8); while (a === b) b = 1 + rnd(8);
    const sa = pick(SCOOP_IMG), sb = pick(SCOOP_IMG);
    return { cat: '비교', prompt: '어느 쪽이 더 많을까요?', say: '어느 쪽이 더 많을까요?',
      visual: '', options: [{ v: 'a', html: itemRow(sa, a) }, { v: 'b', html: itemRow(sb, b) }], answer: a > b ? 'a' : 'b', wide: true,
      explain: `${Math.max(a, b)}개가 ${Math.min(a, b)}개보다 더 많아요!` };
  }
  function jiaWord() {
    const [w, e] = pick(KO_WORDS); const others = pickN(KO_WORDS.map(x => x[0]), 2, [w]);
    return { cat: '한글', prompt: '이 그림의 이름은 무엇일까요?', say: '이 그림의 이름은 무엇일까요?',
      visual: emojiOpt(e), options: shuffle([w, ...others]).map(v => ({ v, html: `<b class="q-word">${v}</b>` })), answer: w,
      explain: `정답은 "${w}"예요!`, sayAnswer: w };
  }
  function jiaPicture() {
    const [w, e] = pick(KO_WORDS); const others = pickN(KO_WORDS.filter(x => x[0] !== w), 2);
    return { cat: '한글', prompt: `"${w}"는 어떤 그림일까요?`, say: `${w}는 어떤 그림일까요?`,
      visual: `<b class="q-big-word">${w}</b>`, options: shuffle([[w, e], ...others]).map(x => ({ v: x[0], html: emojiOpt(x[1]) })), answer: w,
      explain: `"${w}"는 ${e} 이에요!` };
  }
  function jiaBlank() {
    const [w, e] = pick(TWO); const s = [...w]; const miss = rnd(2); const ans = s[miss];
    const pool = TWO.map(x => [...x[0]][miss]).filter(c => c !== ans);
    const opts = shuffle([ans, ...pickN([...new Set(pool)], 2)]);
    const shown = s.map((c, i) => i === miss ? '<u>?</u>' : c).join('');
    return { cat: '한글', prompt: '빈 칸에 들어갈 글자는?', say: `${w}. 빈 칸에 들어갈 글자는?`,
      visual: `${emojiOpt(e)}<b class="q-big-word">${shown}</b>`, options: opts.map(v => ({ v, html: `<b class="q-word">${v}</b>` })), answer: ans,
      explain: `"${w}"이니까 "${ans}"가 정답이에요!` };
  }
  function jiaChange(price, paid) {
    price = price || (1 + rnd(4)); paid = paid || Math.min(10, price + 1 + rnd(4)); const ans = paid - price;
    return { cat: '계산대', prompt: `아이스크림은 ${price}코인! 손님이 ${paid}코인을 냈어요. 거스름돈은 몇 코인?`,
      say: `아이스크림은 ${price}코인이에요. 손님이 ${paid}코인을 냈어요. 거스름돈은 몇 코인일까요?`,
      visual: `<div class="q-sum"><span class="q-tag">낸 돈</span>${coinRow(paid)}</div><div class="q-sum"><span class="q-tag">가격</span><b class="q-num sm">${price}</b></div>`,
      options: nums(ans, 0, 10).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: ans,
      explain: `${paid} 빼기 ${price}는 ${ans}! 거스름돈은 ${ans}코인이에요.` };
  }

  // ---------- 지안 문제 ----------
  function enListen() {
    const pool = EN_WORDS; const [w, e, ko] = pick(pool); const others = pickN(pool.filter(x => x[0] !== w), 2);
    return { cat: '영어 듣기', prompt: '🔊 잘 듣고 알맞은 그림을 골라요!', say: w, sayLang: 'en-US', listen: true, fallbackText: w,
      visual: `<button class="btn q-listen" data-say="1">🔊 다시 듣기</button>`,
      options: shuffle([[w, e], ...others]).map(x => ({ v: x[0], html: emojiOpt(x[1]) })), answer: w,
      explain: `"${w}"는 ${ko}(${e})예요!`, sayAnswer: w, sayAnswerLang: 'en-US' };
  }
  function enPicToWord(short) {
    const pool = short ? SHORT : EN_WORDS; const [w, e, ko] = pick(pool); const others = pickN(pool.map(x => x[0]), 2, [w]);
    return { cat: '영어 단어', prompt: '이 그림은 영어로 뭘까요?', say: '이 그림은 영어로 뭘까요?',
      visual: emojiOpt(e), options: shuffle([w, ...others]).map(v => ({ v, html: `<b class="q-word en">${v}</b>` })), answer: w,
      explain: `${ko}는 영어로 "${w}"예요!`, sayAnswer: w, sayAnswerLang: 'en-US' };
  }
  function enWordToPic() {
    const [w, e, ko] = pick(EN_WORDS); const others = pickN(EN_WORDS.filter(x => x[0] !== w), 2);
    return { cat: '영어 읽기', prompt: '이 단어에 맞는 그림은?', say: w, sayLang: 'en-US',
      visual: `<b class="q-big-word en">${w}</b>`, options: shuffle([[w, e], ...others]).map(x => ({ v: x[0], html: emojiOpt(x[1]) })), answer: w,
      explain: `"${w}"는 ${ko}(${e})예요!`, sayAnswer: w, sayAnswerLang: 'en-US' };
  }
  function enSpell() {
    const [w, e, ko] = pick(SHORT.filter(x => x[0].length >= 3)); const i = rnd(w.length); const ans = w[i];
    const letters = 'abcdefghijklmnoprstuwy'.split('').filter(c => c !== ans);
    const shown = w.split('').map((c, k) => k === i ? '<u>_</u>' : c).join('');
    return { cat: '스펠링', prompt: '빈 칸에 들어갈 알파벳은?', say: w, sayLang: 'en-US',
      visual: `${emojiOpt(e)}<b class="q-big-word en">${shown}</b>`, options: shuffle([ans, ...pickN(letters, 2)]).map(v => ({ v, html: `<b class="q-word en">${v}</b>` })), answer: ans,
      explain: `${ko}는 "${w}"! 빈 칸은 "${ans}"예요.`, sayAnswer: w, sayAnswerLang: 'en-US' };
  }
  function enColor() {
    const [w, c, ko] = pick(COLORS); const others = pickN(COLORS.map(x => x[0]), 2, [w]);
    return { cat: '영어 색깔', prompt: 'What color is it? 무슨 색일까요?', say: 'What color is it?', sayLang: 'en-US',
      visual: `<span class="q-color" style="background:${c}"></span>`, options: shuffle([w, ...others]).map(v => ({ v, html: `<b class="q-word en">${v}</b>` })), answer: w,
      explain: `${ko}은 영어로 "${w}"예요!`, sayAnswer: w, sayAnswerLang: 'en-US' };
  }
  function enNumber() {
    const n = 1 + rnd(10); const others = pickN(NUM_EN.slice(1), 2, [NUM_EN[n]]);
    return { cat: '영어 숫자', prompt: 'How many? 영어로 몇 개일까요?', say: 'How many?', sayLang: 'en-US',
      visual: itemRow(pick(SCOOP_IMG), n), options: shuffle([NUM_EN[n], ...others]).map(v => ({ v, html: `<b class="q-word en">${v}</b>` })), answer: NUM_EN[n],
      explain: `${n}개는 영어로 "${NUM_EN[n]}"!`, sayAnswer: NUM_EN[n], sayAnswerLang: 'en-US' };
  }
  function enPhrase() {
    const [p, ko] = pick(PHRASES); const others = pickN(PHRASES.map(x => x[1]), 2, [ko]);
    return { cat: '영어 회화', prompt: `외국 손님이 "${p}" 라고 했어요. 무슨 뜻일까요?`, say: p, sayLang: 'en-US',
      visual: `<b class="q-big-word en">💬 ${p}</b>`, options: shuffle([ko, ...others]).map(v => ({ v, html: `<b class="q-word">${v}</b>` })), answer: ko,
      explain: `"${p}"는 "${ko}"라는 뜻이에요!`, sayAnswer: p, sayAnswerLang: 'en-US' };
  }
  function history() {
    const [q, a, wr, ex] = pick(HISTORY);
    return { cat: '역사', prompt: q, say: q, visual: '📜', visualCls: 'q-scroll',
      options: shuffle([a, ...wr]).map(v => ({ v, html: `<b class="q-word">${v}</b>` })), answer: a, explain: ex };
  }
  function times(maxDan) {
    const a = 2 + rnd(Math.max(1, maxDan - 1)), b = 1 + rnd(9); const ans = a * b;
    return { cat: '구구단', prompt: `${a} × ${b} = ?`, say: `${a} 곱하기 ${b}는?`, visual: `<b class="q-big-word">${a} × ${b} = ?</b>`,
      options: nums(ans, 1, 81).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: ans, explain: `${a} × ${b} = ${ans}! "${a}단"을 외워 봐요.` };
  }
  function bigChange() {
    const price = 12 + rnd(38); const paid = price <= 20 ? 20 : price <= 30 ? 50 : (price <= 50 ? 50 : 100); const ans = paid - price;
    return { cat: '계산대', prompt: `아이스크림 값은 ${price}코인. 손님이 ${paid}코인을 냈어요. 거스름돈은?`, say: `아이스크림 값은 ${price}코인. 손님이 ${paid}코인을 냈어요. 거스름돈은?`,
      visual: `<b class="q-big-word">${paid} − ${price} = ?</b>`, options: nums(ans, 0, 99).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: ans,
      explain: `${paid} − ${price} = ${ans}코인이에요!` };
  }
  function addSub() {
    const plus = Math.random() < 0.5; let a, b, ans;
    if (plus) { a = 10 + rnd(60); b = 2 + rnd(29); ans = a + b; } else { a = 20 + rnd(70); b = 2 + rnd(Math.min(29, a - 5)); ans = a - b; }
    return { cat: '계산', prompt: `${a} ${plus ? '+' : '−'} ${b} = ?`, say: `${a} ${plus ? '더하기' : '빼기'} ${b}는?`, visual: `<b class="q-big-word">${a} ${plus ? '+' : '−'} ${b} = ?</b>`,
      options: nums(ans, 0, 120).map(v => ({ v, html: `<b class="q-num">${v}</b>` })), answer: ans, explain: `${a} ${plus ? '+' : '−'} ${b} = ${ans}!` };
  }

  // ---------- 출제 ----------
  // topic: 'any' | 'english' | 'history' | 'math' | 'korean' | 'number' | 'change'
  function make(kidKey, topic = 'any', s = {}) {
    if (kidKey === 'jia') {
      const max = s.jiaMax || 10;
      const num = [() => jiaCount(max), () => jiaAdd(max), () => jiaSub(max), jiaMore];
      const kor = [jiaWord, jiaPicture, jiaBlank];
      if (topic === 'change') return jiaChange();
      if (topic === 'number' || topic === 'math') return pick(num)();
      if (topic === 'korean') return pick(kor)();
      return Math.random() < 0.5 ? pick(num)() : pick(kor)();
    }
    const lvl = s.jianEn || 2; const dan = s.jianDan || 5;
    const eng = lvl >= 2 ? [enListen, enPicToWord, enWordToPic, enSpell, enColor, enNumber, enPhrase] : [enListen, () => enPicToWord(true), enColor, enNumber];
    const math = [() => times(dan), bigChange, addSub];
    if (topic === 'english') return pick(eng)();
    if (topic === 'history') return history();
    if (topic === 'math' || topic === 'number') return pick(math)();
    if (topic === 'change') return bigChange();
    const r = Math.random(); return r < 0.5 ? pick(eng)() : r < 0.75 ? history() : pick(math)();
  }
  return { make, shuffle, pick, rnd };
})();
