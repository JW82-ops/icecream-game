/* ===== 게임 데이터 ===== */
const KIDS = {
  jian: { key: 'jian', name: '지안', apron: '#f7a8c4', face: 'img/chars/jian_face.webp',
          poses: [0,1,2,3,4,5,6,7].map(i => `img/chars/jian${i}.webp`),
          defaultShop: '지안이네 아이스크림', mode: 'big' },
  jia:  { key: 'jia',  name: '지아', apron: '#ffd96b', face: 'img/chars/jia_face.webp',
          poses: [0,1,2,3,4,5,6,7].map(i => `img/chars/jia${i}.webp`),
          defaultShop: '지아네 아이스크림', mode: 'small' },
};
// pose index
const POSE = { idle: 0, jump: 1, oops: 2, wave: 3, scoop: 4, clap: 5, think: 6, thumb: 7 };

const THEMES = {
  princess: { name: '공주 디저트 카페', emoji: '🏰', bg: 'img/bg/princess.webp',
              perk: '꾸미기 매력 +20%', color: '#f9a8d4' },
  forest:   { name: '동물 숲 아이스크림', emoji: '🌳', bg: 'img/bg/forest.webp',
              perk: '동물 손님이 자주 와요 · 손님 +10%', color: '#c08a4a' },
  space:    { name: '우주 젤라또', emoji: '🚀', bg: 'img/bg/space.webp',
              perk: '연구비 20% 할인', color: '#8b7cf6' },
  beach:    { name: '바닷가 빙수집', emoji: '🏖️', bg: 'img/bg/beach.webp',
              perk: '여름 손님 +50%', color: '#38bdf8' },
};

// 맛: tier → 가격
const FLAVORS = {
  vanilla:   { name: '바닐라',     en: 'vanilla',    price: 3, cost: 0 },
  strawberry:{ name: '딸기',       en: 'strawberry', price: 3, cost: 0 },
  choco:     { name: '초코',       en: 'chocolate',  price: 3, cost: 0 },
  mint:      { name: '민트초코',   en: 'mint',       price: 4, cost: 120 },
  mango:     { name: '망고',       en: 'mango',      price: 4, cost: 150 },
  blueberry: { name: '블루베리',   en: 'blueberry',  price: 4, cost: 180 },
  cookie:    { name: '쿠키앤크림', en: 'cookies & cream', price: 5, cost: 230 },
  peach:     { name: '복숭아',     en: 'peach',      price: 5, cost: 270 },
  soda:      { name: '소다',       en: 'soda',       price: 5, cost: 310 },
  greentea:  { name: '녹차',       en: 'green tea',  price: 5, cost: 350 },
  rainbow:   { name: '무지개',     en: 'rainbow',    price: 6, cost: 420 },
  fig:       { name: '무화과',     en: 'fig',        price: 8, cost: 520, signature: true },
};
const FLAVOR_ORDER = Object.keys(FLAVORS);
const START_FLAVORS = ['vanilla', 'strawberry', 'choco'];

const TOPPINGS = {
  cherry:   { name: '체리',       price: 2, cost: 100 },
  sprinkle: { name: '스프링클',   price: 2, cost: 140 },
  cream:    { name: '생크림',     price: 2, cost: 180 },
  syrup:    { name: '초코시럽',   price: 3, cost: 230 },
};
const TOPPING_ORDER = Object.keys(TOPPINGS);
const CONTAINERS = { cone: { name: '콘' }, cup: { name: '컵' } };

// 꾸미기
const DECOR = {
  poster:  { name: '선데 액자',     type: 'wall',  price: 80,  charm: 8 },
  clock:   { name: '도넛 시계',     type: 'wall',  price: 100, charm: 10 },
  bunting: { name: '파티 깃발',     type: 'wall',  price: 120, charm: 12 },
  neon:    { name: '네온 간판',     type: 'wall',  price: 260, charm: 22 },
  plant:   { name: '몬스테라 화분', type: 'floor', price: 90,  charm: 9 },
  flower:  { name: '꽃병',          type: 'floor', price: 110, charm: 11 },
  balloon: { name: '풍선 다발',     type: 'floor', price: 140, charm: 13 },
  gumball: { name: '껌볼 머신',     type: 'floor', price: 180, charm: 15 },
  table:   { name: '카페 테이블',   type: 'floor', price: 200, charm: 18 },
  shelf:   { name: '장난감 책장',   type: 'floor', price: 240, charm: 20 },
  jukebox: { name: '레트로 주크박스', type: 'floor', price: 320, charm: 26 },
  statue:  { name: '왕 아이스크림 동상', type: 'floor', price: 450, charm: 35 },
};
const COMBOS = [
  { a: 'table',   b: 'flower',  name: '카페 세트',       bonus: 20 },
  { a: 'balloon', b: 'bunting', name: '파티 세트',       bonus: 20 },
  { a: 'jukebox', b: 'neon',    name: '레트로 세트',     bonus: 30 },
  { a: 'shelf',   b: 'plant',   name: '아늑한 코너',     bonus: 20 },
  { a: 'poster',  b: 'clock',   name: '달콤한 갤러리',   bonus: 15 },
  { a: 'statue',  b: 'gumball', name: '아이스크림 랜드', bonus: 30 },
];
// 장식 자리 (stage 1280x720 좌표, foot = 바닥 기준점)
const SLOTS = {
  W1: { kind: 'wall',  x: 318,  y: 255, h: 115, w: 120, level: 1, label: '벽 왼쪽' },
  F1: { kind: 'floor', x: 1205, y: 660, h: 190, w: 150, level: 1, label: '카운터 옆' },
  F2: { kind: 'floor', x: 340,  y: 488, h: 140, w: 170, level: 1, label: '안쪽 왼쪽' },
  W2: { kind: 'wall',  x: 1050, y: 175, h: 125, w: 210, level: 2, label: '벽 오른쪽' },
  F3: { kind: 'floor', x: 520,  y: 488, h: 140, w: 170, level: 3, label: '안쪽 가운데' },
};

// 손님
const CUSTOMERS = {
  grandma:   { name: '할머니',       h: 210, pool: 'town' },
  grandpa:   { name: '할아버지',     h: 220, pool: 'town' },
  office:    { name: '회사원 아저씨', h: 235, pool: 'town' },
  mom:       { name: '엄마 손님',    h: 225, pool: 'town' },
  boy:       { name: '꼬마 친구',    h: 185, pool: 'town' },
  girl:      { name: '풍선 소녀',    h: 190, pool: 'town' },
  student:   { name: '중학생 언니',  h: 220, pool: 'town' },
  rider:     { name: '배달 기사님',  h: 230, pool: 'town' },
  bunny:     { name: '토끼 손님',    h: 175, pool: 'animal' },
  bear:      { name: '곰돌이 손님',  h: 180, pool: 'animal' },
  cat:       { name: '고양이 손님',  h: 175, pool: 'animal' },
  penguin:   { name: '펭귄 손님',    h: 170, pool: 'animal' },
  tourist_w: { name: '여행객 언니',  h: 230, pool: 'tourist' },
  tourist_m: { name: '여행객 오빠',  h: 230, pool: 'tourist' },
  king:      { name: '세종대왕님',   h: 240, pool: 'vip' },
  admiral:   { name: '이순신 장군님', h: 240, pool: 'vip' },
};

// 평판 단계
const LEVELS = [
  { lv: 1, need: 0,    name: '동네 작은 가게', unlock: [] },
  { lv: 2, need: 200,  name: '동네 맛집',      unlock: ['📱 SNS 홍보가 열렸어요', '🖼️ 벽 장식 자리 1칸 추가', '✈️ 여행객 손님이 오기 시작해요'] },
  { lv: 3, need: 900,  name: '소문난 맛집',    unlock: ['📰 잡지 홍보가 열렸어요', '🪴 바닥 장식 자리 1칸 추가', '🔔 호출벨·디스펜서를 살 수 있어요'] },
  { lv: 4, need: 2000, name: '줄 서는 맛집',   unlock: ['🌟 인플루언서 홍보가 열렸어요', '🏪 가게 넓히기를 할 수 있어요', '손님이 줄을 서기 시작해요!'] },
  { lv: 5, need: 3600, name: '전국 맛집',      unlock: ['📺 TV 방송 섭외가 왔어요!', '하루 손님이 더 많아져요'] },
  { lv: 6, need: 6000, name: '전설의 가게',    unlock: ['🏬 2호점을 열 수 있어요!', '👑 전설의 가게 트로피'] },
];

// 홍보 채널
const ADS = {
  flyer:      { name: '전단지',     icon: '📄', cost: 50,  level: 1, desc: '이번 달 손님 +25%', boost: 0.25 },
  sns:        { name: 'SNS',        icon: '📱', cost: 150, level: 2, desc: '이번 달 손님 +20%, 가게가 예쁠수록 더!', boost: 0.2 },
  magazine:   { name: '잡지',       icon: '📰', cost: 350, level: 3, desc: '"이번 주 맛집" 기사! 손님 +40%, 하트 +30', boost: 0.4, rep: 30 },
  influencer: { name: '인플루언서', icon: '🌟', cost: 700, level: 4, desc: '인플루언서가 와서 영상을 찍어요! 손님 +60%', boost: 0.6, rep: 60 },
  tv:         { name: 'TV 방송',    icon: '📺', cost: 1500, level: 5, desc: '생방송 출연! 손님 +90%, 하트 +150', boost: 0.9, rep: 150 },
};

const SEASONS = {
  3: '봄', 4: '봄', 5: '봄', 6: '여름', 7: '여름', 8: '여름',
  9: '가을', 10: '가을', 11: '가을', 12: '겨울', 1: '겨울', 2: '겨울',
};
const SEASON_INFO = {
  봄:  { emoji: '🌸', mult: 1.0 },
  여름:{ emoji: '☀️', mult: 1.3 },
  가을:{ emoji: '🍁', mult: 1.0 },
  겨울:{ emoji: '❄️', mult: 0.8 },
};
const WEATHER = [
  { key: 'sunny', name: '맑은 날', emoji: '🌤️', mult: 1.0, w: 5 },
  { key: 'hot',   name: '아주 더운 날! 손님이 많아요', emoji: '🥵', mult: 1.3, w: 2, seasons: ['봄','여름','가을'] },
  { key: 'rain',  name: '비 오는 날', emoji: '🌧️', mult: 0.8, w: 1 },
  { key: 'party', name: '동네 축제 날! 손님이 많아요', emoji: '🎉', mult: 1.4, w: 1 },
  { key: 'snow',  name: '눈 오는 날', emoji: '☃️', mult: 0.85, w: 2, seasons: ['겨울'] },
];

const STICKERS = ['🦄','🌈','🍭','🧁','🍩','🎈','🐳','🦋','🌻','🍀','⭐','🌙','🎀','👑','💎','🚀','🐣','🐼','🦊','🐬','🍓','🍒','🎵','🏆','🎠','🧸','🌸','🍉','🐝','🦕'];

const DAYS_PER_MONTH = 8;
const OPEN_HOUR = 10, CLOSE_HOUR = 18;

// 특별 손님 (홍보)
Object.assign(CUSTOMERS, {
  influencer: { name: '인플루언서 언니', h: 230, pool: 'event' },
  reporter:   { name: '잡지 기자님',     h: 230, pool: 'event' },
  camera:     { name: '촬영 감독님',     h: 235, pool: 'event' },
  host:       { name: 'TV 진행자',       h: 230, pool: 'event' },
});
const FAMILY = {
  mom: { name: '엄마', poses: [0,1,2,3].map(i => `img/chars/mom${i}.webp`) },
  dad: { name: '아빠', poses: [0,1,2,3].map(i => `img/chars/dad${i}.webp`) },
};
// 가게 업그레이드
const UPGRADES = {
  chair:     { name: '손님 의자',      icon: '🪑', level: 2, cost: 300,  desc: '줄을 1명 더 설 수 있고, 손님이 더 오래 기다려요' },
  freezer:   { name: '큰 냉동고',      icon: '🧊', level: 2, cost: 450,  desc: '아이스크림이 더 맛있어져서 팁 +1' },
  bell:      { name: '호출벨',         icon: '🔔', level: 3, cost: 550,  desc: '피버 타임이 5초 더 길어요' },
  dispenser: { name: '콘·컵 디스펜서', icon: '🍦', level: 3, cost: 650,  desc: '주문에 맞는 콘·컵이 자동으로 나와요' },
  expand:    { name: '가게 넓히기',    icon: '🏪', level: 4, cost: 1200, desc: '하루 손님 +3명, 줄 1명 더' },
  branch:    { name: '2호점 열기',     icon: '🏬', level: 6, cost: 2000, desc: '매달 2호점에서 돈이 들어와요! (저금통에서 2000 필요)', fromSavings: true },
};
// 공부별 보상 (기본값, 부모님 설정에서 수정)
const DEFAULT_REWARDS = {
  jia:  [['🍬','사탕',10],['🍪','과자',20],['🍦','아이스크림',35],['🍢','떡볶이 간식',50],['🍔','햄버거',70],['🌶️','마라탕',100]],
  jian: [['🍬','사탕',15],['🍪','과자',30],['🍦','아이스크림',50],['🍢','떡볶이 간식',70],['🍔','햄버거',100],['🌶️','마라탕',140]],
};
const REWARD_IMG = { '🍬': 'candy', '🍪': 'snack', '🍦': 'icecream', '🍢': 'tteok', '🍔': 'burger', '🌶️': 'mala' };
const HELP_PER_DAY = 3;
