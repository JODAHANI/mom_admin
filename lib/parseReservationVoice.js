// 한국어 음성 transcript에서 예약 정보를 추출한다.
// 지원: 날짜(년월일/상대), 시간(시분/오전오후), 연락처, 인원(어른/어린이), 메뉴+수량, 이름.
// 메모(notes)는 음성으로 받지 않는다 — 수기 입력 전용.

const NATIVE_TIME_NUMS = {
  '한': 1, '두': 2, '세': 3, '네': 4, '다섯': 5, '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9,
  '열': 10, '열한': 11, '열두': 12,
};

const NATIVE_COUNT_NUMS = {
  '한': 1, '하나': 1, '두': 2, '둘': 2, '세': 3, '셋': 3, '네': 4, '넷': 4,
  '다섯': 5, '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10,
  '열한': 11, '열두': 12, '열셋': 13, '열넷': 14, '열다섯': 15,
  '스무': 20, '스물': 20,
};

const ITEM_UNITS = '개|인분|그릇|잔|병|마리|판|봉|세트';
const PERIOD_RE = '오전|오후|낮|저녁|밤';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ymd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nativeKeysDesc(map) {
  return Object.keys(map).sort((a, b) => b.length - a.length);
}

function parseDate(text, baseDate) {
  // 1. YYYY[년] M월 D일
  let m = text.match(/(\d{4})\s*년?\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    return { date: ymd(new Date(y, mo - 1, d)), match: m[0] };
  }
  // 2. M월 D일
  m = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (m) {
    const mo = parseInt(m[1], 10);
    const d = parseInt(m[2], 10);
    let year = baseDate.getFullYear();
    const todayMid = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const candidate = new Date(year, mo - 1, d);
    if (candidate < todayMid) year += 1;
    return { date: ymd(new Date(year, mo - 1, d)), match: m[0] };
  }
  // 3. 상대 (오늘/내일/모레/글피)
  const REL = { '오늘': 0, '내일': 1, '모레': 2, '글피': 3 };
  for (const kw of Object.keys(REL)) {
    if (text.includes(kw)) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + REL[kw]);
      return { date: ymd(d), match: kw };
    }
  }
  // 4. 이번주/다음주 X요일 (월요일 시작 주 기준)
  m = text.match(/(이번|다음)\s*주\s*([일월화수목금토])요일/);
  if (m) {
    const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
    const target = DAYS.indexOf(m[2]);
    const dowMon = (n) => (n === 0 ? 7 : n); // Mon=1..Sat=6, Sun=7
    const currentDow = dowMon(baseDate.getDay());
    const targetDow = dowMon(target);
    let diff = targetDow - currentDow;
    if (m[1] === '다음') diff += 7;
    const d = new Date(baseDate);
    d.setDate(d.getDate() + diff);
    return { date: ymd(d), match: m[0] };
  }
  // 5. 요일 없이 "다음주"만 → +7일 (이번주는 모호하므로 무시)
  m = text.match(/다음\s*주/);
  if (m) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    return { date: ymd(d), match: m[0] };
  }
  return null;
}

function applyPeriod(hour, period) {
  if (period === '오후' || period === '낮' || period === '저녁' || period === '밤') {
    if (hour < 12) return hour + 12;
  } else if (period === '오전') {
    if (hour === 12) return 0;
  } else if (!period && hour >= 1 && hour <= 10) {
    // 식당 예약 맥락 — 1~10시는 PM(13~22)으로 추정
    return hour + 12;
  }
  return hour;
}

function parseTime(text) {
  // 1. 디지트 + 시
  let re = new RegExp(`(${PERIOD_RE})?\\s*(\\d{1,2})\\s*시\\s*(반|\\d{1,2}\\s*분)?`);
  let m = text.match(re);
  if (m) {
    let hour = parseInt(m[2], 10);
    let minute = 0;
    if (m[3] === '반') minute = 30;
    else if (m[3]) {
      const mm = m[3].match(/\d+/);
      if (mm) minute = parseInt(mm[0], 10);
    }
    hour = applyPeriod(hour, m[1]);
    return { time: `${pad2(hour)}:${pad2(minute)}`, match: m[0] };
  }
  // 2. 한글 숫자 + 시
  const keys = nativeKeysDesc(NATIVE_TIME_NUMS);
  re = new RegExp(`(${PERIOD_RE})?\\s*(${keys.join('|')})\\s*시\\s*(반|\\d{1,2}\\s*분)?`);
  m = text.match(re);
  if (m) {
    let hour = NATIVE_TIME_NUMS[m[2]];
    let minute = 0;
    if (m[3] === '반') minute = 30;
    else if (m[3]) {
      const mm = m[3].match(/\d+/);
      if (mm) minute = parseInt(mm[0], 10);
    }
    hour = applyPeriod(hour, m[1]);
    return { time: `${pad2(hour)}:${pad2(minute)}`, match: m[0] };
  }
  return null;
}

function parsePhone(text) {
  // 1. 0XX-XXXX-XXXX 전체 패턴
  let m = text.match(/0\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}/);
  // 2. 앞자리 0 누락 (3~4 + 4 + 4)
  if (!m) m = text.match(/(?:^|[^\d])(\d{3,4}[\s-]?\d{4}[\s-]?\d{4})(?:[^\d]|$)/);
  // 3. 두 개의 4자리 묶음 (XXXX XXXX)
  if (!m) m = text.match(/(?:^|[^\d])(\d{4}[\s-]?\d{4})(?:[^\d]|$)/);
  // 4. 4자리 한 묶음만 있어도 전화번호로 인식
  if (!m) m = text.match(/(?:^|[^\d])(\d{4})(?:[^\d]|$)/);
  if (!m) return null;
  const raw = m[1] || m[0];
  const digits = raw.replace(/\D/g, '');
  let formatted = digits;
  if (digits.length === 11) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 8) {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return { phone: formatted, match: raw };
}

function parseCountByKeyword(text, keywords) {
  const kw = keywords.map(escapeRegex).join('|');
  let m = text.match(new RegExp(`(${kw})\\s*(\\d{1,2})\\s*(?:명|사람|분)?`));
  if (m) return { count: parseInt(m[2], 10), match: m[0] };
  const keys = nativeKeysDesc(NATIVE_COUNT_NUMS);
  // 키워드가 명시되면 "명" 단위는 옵션 (예: "어른 셋"). 그리디 매칭으로 "명"이 있으면 같이 소비.
  m = text.match(new RegExp(`(${kw})\\s*(${keys.join('|')})\\s*(?:명|사람|분)?`));
  if (m) return { count: NATIVE_COUNT_NUMS[m[2]], match: m[0] };
  return null;
}

function parseBareCount(text) {
  let m = text.match(/(\d{1,2})\s*(?:명|사람)/);
  if (m) return { count: parseInt(m[1], 10), match: m[0] };
  const keys = nativeKeysDesc(NATIVE_COUNT_NUMS);
  m = text.match(new RegExp(`(${keys.join('|')})\\s*(?:명|사람)`));
  if (m) return { count: NATIVE_COUNT_NUMS[m[1]], match: m[0] };
  return null;
}

function parseItems(text) {
  // {메뉴명} {수량}{단위} 패턴을 자유롭게 추출 (상품 DB 매칭 X)
  // 메뉴명은 한글/영문/숫자 토큰, 단위는 ITEM_UNITS 중 하나.
  const items = [];
  const used = [];

  const nameRe = '[가-힣A-Za-z][가-힣A-Za-z0-9]*';

  // 1) 메뉴명 + 디지트 + (단위)
  const re1 = new RegExp(`(${nameRe})\\s*(\\d{1,2})\\s*(?:${ITEM_UNITS})`, 'g');
  let m;
  while ((m = re1.exec(text)) !== null) {
    items.push({ name: m[1], quantity: parseInt(m[2], 10) });
    used.push(m[0]);
  }

  // 2) 메뉴명 + 한글숫자 + 단위
  const keys = nativeKeysDesc(NATIVE_COUNT_NUMS);
  const re2 = new RegExp(`(${nameRe})\\s*(${keys.join('|')})\\s*(?:${ITEM_UNITS})`, 'g');
  while ((m = re2.exec(text)) !== null) {
    if (used.some((u) => u.includes(m[0]) || m[0].includes(u))) continue;
    items.push({ name: m[1], quantity: NATIVE_COUNT_NUMS[m[2]] });
    used.push(m[0]);
  }

  let residual = text;
  for (const u of used) {
    residual = residual.replace(u, ' ');
  }
  return { items, residual };
}

function parseName(text) {
  // 1. 이름 라벨
  let m = text.match(/이름\s*(?:은|는)?\s*([가-힣]{2,4})/);
  if (m) return { name: m[1], match: m[0] };
  // 2. ~씨/~님 접미사
  m = text.match(/([가-힣]{2,4})\s*(?:씨|님)(?=\s|$)/);
  if (m) return { name: m[1], match: m[0] };
  // 3. 잔여 텍스트에서 2-4자 한글 단어 (보수적으로 첫 번째만)
  m = text.match(/(?:^|\s)([가-힣]{2,4})(?=\s|$)/);
  if (m) {
    const w = m[1];
    // 흔한 한국어 일반 단어는 제외 (이름일 가능성 낮음)
    const blacklist = ['예약', '주문', '메뉴', '특이사항', '참고', '메모', '오전', '오후', '저녁', '어른', '성인', '어린이', '아이', '아동', '소아', '아기', '점심', '저녁', '이름', '연락처', '전화', '핸드폰', '휴대폰'];
    if (!blacklist.includes(w)) {
      return { name: w, match: m[0] };
    }
  }
  return null;
}

function parseNotesLabel(text) {
  const m = text.match(/(?:특이사항|메모|참고|참고로|요청사항)\s*(?:은|는)?\s*[:：]?\s*(.+)/);
  if (m) return { notes: m[1].trim(), match: m[0] };
  return null;
}

export function parseReservationVoice(transcript, { baseDate = new Date() } = {}) {
  if (!transcript) return { fields: {}, residual: '' };

  let residual = ' ' + transcript.replace(/[,，、.]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const fields = {};
  const filled = {};

  const dateRes = parseDate(residual, baseDate);
  if (dateRes) {
    fields.reservationDate = dateRes.date;
    filled.reservationDate = true;
    residual = residual.replace(dateRes.match, ' ');
  }

  const timeRes = parseTime(residual);
  if (timeRes) {
    fields.reservationTime = timeRes.time;
    filled.reservationTime = true;
    residual = residual.replace(timeRes.match, ' ');
  }

  const phoneRes = parsePhone(residual);
  if (phoneRes) {
    fields.phone = phoneRes.phone;
    filled.phone = true;
    residual = residual.replace(phoneRes.match, ' ');
  }

  const adultRes = parseCountByKeyword(residual, ['어른', '성인']);
  if (adultRes) {
    fields.adults = adultRes.count;
    filled.adults = true;
    residual = residual.replace(adultRes.match, ' ');
  }

  const childRes = parseCountByKeyword(residual, ['어린이', '아이', '아동', '소아', '아기', '유아']);
  if (childRes) {
    fields.children = childRes.count;
    filled.children = true;
    residual = residual.replace(childRes.match, ' ');
  }

  const itemsRes = parseItems(residual);
  if (itemsRes.items.length > 0) {
    fields.items = itemsRes.items;
    filled.items = true;
    residual = itemsRes.residual;
  }

  if (fields.adults === undefined) {
    const bare = parseBareCount(residual);
    if (bare) {
      fields.adults = bare.count;
      filled.adults = true;
      residual = residual.replace(bare.match, ' ');
    }
  }

  const nameRes = parseName(residual);
  if (nameRes) {
    fields.customerName = nameRes.name;
    filled.customerName = true;
    residual = residual.replace(nameRes.match, ' ');
  }

  residual = residual.replace(/\s+/g, ' ').trim();

  return { fields, filled, residual };
}
