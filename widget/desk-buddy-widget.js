// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: book-open;

// 책상 친구 — 아이폰 위젯 (Scriptable)
// 홈 화면(작게·중간·크게)과 잠금 화면 위젯. PC 카드처럼 보여줄 칸을 골라 조합할 수 있어요.
//
// 처음: Scriptable 앱 안에서 ▶ 실행 → 연동 코드 입력 (PC 설정 › 폰 연동의 16자리)
// 꾸미기: 앱 안에서 다시 실행 › "위젯 꾸미기" → 칸을 고르면 조합 글자가 복사돼요.
//         홈 화면 위젯을 길게 눌러 › 위젯 편집 › Parameter 에 붙여 넣기.
// Parameter 예: 큰캐릭터, 말, 지금블럭      /  블럭, 할일, 일정      /  작은캐릭터, 진행, u
//   칸: 캐릭터(큰캐릭터·작은캐릭터) 말 날짜 시간 진행 블럭 지금블럭 할일 u 루틴 일정 메모
//   비워 두면 크기에 맞는 기본 조합.

const SERVER = 'https://desk-buddy-sync.soohwanj97.workers.dev';
const APP = 'https://streetlamp1216.github.io/desk-buddy-updates/app/';
const NOTIFY = true;            // 일정·알람 알림
const EVENT_LEAD_MIN = 10;      // 일정 몇 분 전에 알려줄지
const KEY_NAME = 'desk-buddy-sync-code';

const THEMES = {
  shiori: { name: '시오리', names: { en: 'Shiori', ja: 'しおり' }, mint: '#A8DCC6', deep: '#4E8A6B', soft: '#F2F7F4', line: '#D6DED9' },
  fubuki: { name: '후부키', names: { en: 'Fubuki', ja: 'ふぶき' }, mint: '#EBDB9C', deep: '#8A7224', soft: '#FAF6E8', line: '#E5DDC4' },
  suu: { name: '수우', names: { en: 'Suu', ja: 'すう' }, mint: '#AAC7E7', deep: '#3E679A', soft: '#F0F4FA', line: '#D3DCE8' }
};
const WORDS = {
  ko: { block: '블럭', left: '남은 거', allDone: '오늘 할 일 다 끝냈어 X', none: '아직 적은 게 없어', next: '다음', noEvent: '남은 일정 없음', noMemo: '메모 없음', noU: 'u 할 일 없음', today: '오늘', more: '그 외 {n}개', routine: '루틴' },
  en: { block: 'Block', left: 'left', allDone: 'All done today X', none: 'Nothing written yet', next: 'Next', noEvent: 'No more events', noMemo: 'No memos', noU: 'No u tasks', today: 'Today', more: '{n} more', routine: 'Routine' },
  ja: { block: 'ブロック', left: '残り', allDone: '今日のタスク全部終わった X', none: 'まだ何もないよ', next: '次', noEvent: '残りの予定なし', noMemo: 'メモなし', noU: 'u タスクなし', today: '今日', more: 'ほか {n}件', routine: 'ルーティン' }
};
const WEEK = { ko: ['일', '월', '화', '수', '목', '금', '토'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ja: ['日', '月', '火', '水', '木', '金', '土'] };

// ======================= crypto (no WebCrypto in Scriptable) =======================
const Crypto = (() => {
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256(bytes) {
    const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6;
    const m = new Uint8Array(n); m.set(bytes); m[l] = 0x80;
    const bits = l * 8; for (let i = 0; i < 4; i++) m[n - 1 - i] = (bits >>> (8 * i)) & 0xff;
    m[n - 5] = Math.floor(bits / 0x100000000) & 0xff;
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const W = new Uint32Array(64);
    const r = (x, k) => (x >>> k) | (x << (32 - k));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = (m[o + 4 * i] << 24) | (m[o + 4 * i + 1] << 16) | (m[o + 4 * i + 2] << 8) | m[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) out[4 * i + j] = (H[i] >>> (24 - 8 * j)) & 0xff;
    return out;
  }
  // AES-256 (encryption direction only — GCM decrypts with the counter stream)
  const S = new Uint8Array(256), X2 = (a) => ((a << 1) ^ (a & 0x80 ? 0x11b : 0)) & 0xff;
  (() => {
    let p = 1, q = 1;
    do {
      p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0);
      q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff; if (q & 0x80) q ^= 0x09;
      const x = q ^ ((q << 1) | (q >> 7)) & 0xff ^ ((q << 2) | (q >> 6)) & 0xff ^ ((q << 3) | (q >> 5)) & 0xff ^ ((q << 4) | (q >> 4)) & 0xff;
      S[p] = (x ^ 0x63) & 0xff;
    } while (p !== 1);
    S[0] = 0x63;
  })();
  function expand(key) {
    const w = new Uint8Array(240); w.set(key);
    let rcon = 1;
    for (let i = 32; i < 240; i += 4) {
      let t = w.slice(i - 4, i);
      if (i % 32 === 0) { t = new Uint8Array([S[t[1]] ^ rcon, S[t[2]], S[t[3]], S[t[0]]]); rcon = X2(rcon); }
      else if (i % 32 === 16) t = t.map(x => S[x]);
      for (let j = 0; j < 4; j++) w[i + j] = w[i - 32 + j] ^ t[j];
    }
    return w;
  }
  function block(w, inp) {
    const s = inp.slice();
    for (let i = 0; i < 16; i++) s[i] ^= w[i];
    for (let rd = 1; rd <= 14; rd++) {
      for (let i = 0; i < 16; i++) s[i] = S[s[i]];
      const t = s.slice();                                     // shift rows
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[4 * c + r] = t[4 * ((c + r) % 4) + r];
      if (rd < 14) for (let c = 0; c < 4; c++) {               // mix columns
        const a = s.slice(4 * c, 4 * c + 4), x = a[0] ^ a[1] ^ a[2] ^ a[3];
        for (let r = 0; r < 4; r++) s[4 * c + r] = a[r] ^ x ^ X2(a[r] ^ a[(r + 1) % 4]);
      }
      for (let i = 0; i < 16; i++) s[i] ^= w[16 * rd + i];
    }
    return s;
  }
  function gcmOpen(key, iv, ct) {                               // tag isn't checked: a bad key just gives unreadable JSON
    const w = expand(key), body = ct.slice(0, ct.length - 16), out = new Uint8Array(body.length);
    const ctr = new Uint8Array(16); ctr.set(iv); let n = 2;
    for (let o = 0; o < body.length; o += 16, n++) {
      ctr[12] = (n >>> 24) & 0xff; ctr[13] = (n >>> 16) & 0xff; ctr[14] = (n >>> 8) & 0xff; ctr[15] = n & 0xff;
      const ks = block(w, ctr);
      for (let i = 0; i < 16 && o + i < body.length; i++) out[o + i] = body[o + i] ^ ks[i];
    }
    return out;
  }
  const utf8 = (s) => { const b = []; for (const ch of s) { let c = ch.codePointAt(0); if (c < 0x80) b.push(c); else if (c < 0x800) b.push(0xc0 | c >> 6, 0x80 | c & 63); else if (c < 0x10000) b.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63); else b.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63); } return new Uint8Array(b); };
  function fromUtf8(b) {
    let s = '', i = 0;
    while (i < b.length) {
      const c = b[i++];
      let cp = c < 0x80 ? c : c < 0xe0 ? ((c & 31) << 6) | (b[i++] & 63) : c < 0xf0 ? ((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63)
        : ((c & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
      s += String.fromCodePoint(cp);
    }
    return s;
  }
  function b64(s) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', clean = s.replace(/[^A-Za-z0-9+/]/g, '');
    const out = new Uint8Array(Math.floor(clean.length * 3 / 4)); let bits = 0, val = 0, j = 0;
    for (const ch of clean) { val = (val << 6) | A.indexOf(ch); bits += 6; if (bits >= 8) { bits -= 8; out[j++] = (val >> bits) & 0xff; } }
    return out.slice(0, j);
  }
  const hex = (b) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  function keysFor(code) {
    const c = code.replace(/-/g, '');
    return { id: hex(sha256(utf8('desk-buddy:id:' + c))), key: sha256(utf8('desk-buddy:key:' + c)) };
  }
  function open(key, blob) { const all = b64(blob); return JSON.parse(fromUtf8(gcmOpen(key, all.slice(0, 12), all.slice(12)))); }
  return { sha256, keysFor, open, utf8, hex };
})();

// ======================= data =======================
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function dayKey(d, start) { const [h, m] = String(start || '04:00').split(':').map(Number); return dateKey(new Date(d.getTime() - (h * 60 + (m || 0)) * 60000)); }
function addDays(key, n) { const [y, m, d] = key.split('-').map(Number); return dateKey(new Date(y, m - 1, d + n)); }
const glyph = (t) => (t.kind === 'event' ? (t.status === 'done' ? 'X' : '○') : t.kind === 'note' ? '—' : t.kind === 'idea' ? '!' : { open: '·', done: 'X', migrated: '>', scheduled: '<' }[t.status] || '·');
const DEFAULT_ROUTINES = [{ id: 'ledger', label: '가계부', days: [0, 1, 2, 3, 4, 5, 6] }, { id: 'diary', label: '일기', days: [0, 1, 2, 3, 4, 5, 6] }, { id: 'exercise', label: '운동', days: [1, 2, 3, 4, 5, 6] }];

function readDay(e, key) {
  const val = (k) => (e[k] && e[k].v !== null ? e[k].v : undefined);
  const order = val(`o|${key}`) || [];
  const tasks = Object.keys(e).filter(k => k.startsWith(`t|${key}|`) && e[k].v !== null).map(k => e[k].v);
  const pos = {}; order.forEach((id, i) => { pos[id] = i; });
  tasks.sort((a, b) => (a.id in pos ? pos[a.id] : 1e9) - (b.id in pos ? pos[b.id] : 1e9));
  const ordered = val(`c|${key}`) ? tasks : tasks.map((t, i) => ({ t, i })).sort((a, b) => (a.t.u === b.t.u ? a.i - b.i : a.t.u ? -1 : 1)).map(x => x.t);
  const [y, m, d] = key.split('-').map(Number), dow = new Date(y, m - 1, d).getDay();
  const routines = (val('s|routines') || DEFAULT_ROUTINES).filter(r => (r.days || []).includes(dow)).map(r => ({ ...r, done: !!val(`r|${key}|${r.id}`) }));
  return { tasks: ordered, routines, block: val(`b|${key}`) || 1 };
}

// everything a widget might show, worked out once
function model(e, now) {
  const val = (k) => (e[k] && e[k].v !== null ? e[k].v : undefined);
  const ch = THEMES[val('s|character')] ? val('s|character') : 'shiori';
  const lang = ['ko', 'en', 'ja'].includes(val('s|lang')) ? val('s|lang') : 'ko';
  const key = dayKey(now, val('s|dayStart'));
  const day = readDay(e, key);
  const tasks = day.tasks.filter(t => t.kind === 'task');
  const done = tasks.filter(t => t.status === 'done').length + day.routines.filter(r => r.done).length;
  const total = tasks.filter(t => t.status === 'open' || t.status === 'done').length + day.routines.length;
  const open = day.routines.filter(r => !r.done).map(r => ({ text: r.label, block: r.block, routine: true, kind: 'task', status: 'open' }))
    .concat(day.tasks.filter(t => (t.kind === 'task' || t.kind === 'event') && t.status === 'open'));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const events = day.tasks.filter(t => t.kind === 'event' && t.status === 'open')
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
    .filter(t => !t.time || (() => { const [h, m] = t.time.split(':').map(Number); return h * 60 + m >= nowMin - 30; })());
  const tomorrow = readDay(e, addDays(key, 1)).tasks.filter(t => t.kind === 'event' && t.status === 'open').sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const notesAll = Object.keys(e).filter(k => k.startsWith('n|') && e[k].v !== null).map(k => e[k].v).filter(n => (n.text || '').trim());
  const npos = {}; (val('o|notes') || []).forEach((id, i) => { npos[id] = i; });
  notesAll.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.id in npos ? npos[a.id] : 1e9) - (b.id in npos ? npos[b.id] : 1e9));
  const blocks = [1, 2, 3, 4, 5, 6].map(n => day.routines.filter(r => r.block === n).map(r => (r.done ? 'X' : '·'))
    .concat(day.tasks.filter(t => t.block === n && (t.kind === 'task' || t.kind === 'event')).map(glyph)));
  const who = ((val('s|names') || {})[ch]) || (lang !== 'ko' && THEMES[ch].names[lang]) || THEMES[ch].name;
  return { ch, lang, th: THEMES[ch], W: WORDS[lang], key, day, done, total, open, events, tomorrow, notes: notesAll, blocks, who,
    current: open.filter(x => x.block === day.block), us: open.filter(x => x.u), routines: day.routines,
    callMe: val('s|callMe'), callMeName: val('s|callMeName'), meals: { lunch: val('s|lunch') || '12:30', dinner: val('s|dinner') || '18:30', snack: val('s|snack') || '15:30' } };
}

async function fetchEntries(code) {
  const { id, key } = Crypto.keysFor(code);
  const req = new Request(`${SERVER}/v1/${id}`);
  req.timeoutInterval = 15;
  const got = await req.loadJSON();
  if (!got || !got.blob) return null;
  return Crypto.open(key, got.blob).e || {};
}
const fm = FileManager.local();
const cache = (name) => fm.joinPath(fm.cacheDirectory(), name);
async function load(code) {
  try { const e = await fetchEntries(code); if (e) fm.writeString(cache('desk-buddy-entries.json'), JSON.stringify({ at: Date.now(), e })); return { e, at: Date.now(), live: true }; }
  catch (err) { const p = cache('desk-buddy-entries.json'); if (fm.fileExists(p)) { const c = JSON.parse(fm.readString(p)); return { e: c.e, at: c.at, live: false }; } throw err; }
}
// drawings and lines come from the phone app's files (kept for a day)
async function image(path) {
  const p = cache('db-' + path.replace(/\//g, '_'));
  if (fm.fileExists(p) && Date.now() - fm.modificationDate(p).getTime() < 7 * 86400000) return fm.readImage(p);
  try { const img = await new Request(APP + path).loadImage(); fm.writeImage(p, img); return img; } catch (e) { return fm.fileExists(p) ? fm.readImage(p) : null; }
}
async function lineBank(ch, lang) {
  const file = lang === 'ko' ? { shiori: 'lines.js', fubuki: 'lines_fubuki.js', suu: 'lines_suu.js' }[ch] : `lines/${ch}_${lang}.js`;
  const p = cache('db-lines-' + file.replace(/\//g, '_'));
  let code = null;
  if (fm.fileExists(p) && Date.now() - fm.modificationDate(p).getTime() < 86400000) code = fm.readString(p);
  else { try { code = await new Request(APP + 'shared/' + file).loadString(); fm.writeString(p, code); } catch (e) { if (fm.fileExists(p)) code = fm.readString(p); } }
  if (!code) return {};
  try { const win = {}; new Function('window', 'globalThis', 'module', code)(win, win, undefined); return (win.LineBanks || {})[`${ch}:${lang}`] || {}; } catch (e) { return {}; }
}

// what she'd say right now, and which drawing goes with it
function situation(m, now) {
  const min = now.getHours() * 60 + now.getMinutes();
  const near = (hhmm, before, after) => { const [h, mm] = hhmm.split(':').map(Number); const t = h * 60 + mm; return min >= t - before && min <= t + after; };
  if (min >= 23 * 60 || min < 5 * 60) return { kind: 'night', pose: 'pajama' };
  if (m.total && !m.open.length) return { kind: 'praiseAll', pose: 'done' };
  if (near(m.meals.lunch, 15, 45) || near(m.meals.dinner, 15, 45)) return { kind: near(m.meals.lunch, 15, 45) ? 'lunch' : 'dinner', pose: 'meal' };
  if (near(m.meals.snack, 10, 25)) return { kind: 'snack', pose: 'snack' };
  if (min < 10 * 60) return { kind: 'morning', pose: 'morning' };
  if (m.open.length) return { kind: 'nudge', pose: 'memo_open' };
  return { kind: min >= 18 * 60 ? 'evening' : 'nudgeEmpty', pose: 'memo_open' };
}
function speak(bank, kind, m) {
  const pool = bank[kind] || [];
  if (!pool.length) return '';
  const pick = pool[Math.floor(Date.now() / (15 * 60000)) % pool.length];           // changes every 15 minutes
  const next = (m.current[0] || m.open[0] || {}).text || '';
  let s = pick;
  Object.entries({ task: next, count: m.done, left: m.open.length, name: m.who }).forEach(([k, v]) => { s = s.split('{' + k + '}').join(String(v)); });
  return s.replace(/\{\w+\}/g, '').trim();
}

// ======================= widget parts =======================
const INK = '#1E1E1E', MUTED = '#5B6670', RED = '#C0392B';
const C = (hex) => new Color(hex);
const ALIASES = {
  캐릭터: 'char', 큰캐릭터: 'charBig', 캐릭터크게: 'charBig', 작은캐릭터: 'charSmall', 캐릭터작게: 'charSmall', 말: 'talk', 말풍선: 'talk',
  날짜: 'date', 시간: 'time', 시계: 'time', 진행: 'progress', 블럭: 'blocks', 블록: 'blocks', 지금블럭: 'now', 현재블럭: 'now', 할일: 'tasks',
  u: 'u', U: 'u', 루틴: 'routines', 일정: 'events', 메모: 'memo',
  char: 'char', big: 'charBig', small: 'charSmall', talk: 'talk', date: 'date', time: 'time', progress: 'progress', blocks: 'blocks', now: 'now',
  tasks: 'tasks', routines: 'routines', events: 'events', memo: 'memo'
};
const DEFAULTS = {
  small: 'charSmall,progress,now',
  medium: 'charBig,talk,now',
  large: 'charBig,talk,blocks,tasks,events,memo',
  extraLarge: 'charBig,talk,blocks,tasks,events,memo'
};
function parseParam(p, family) {
  const toks = String(p || '').split(/[,\s+·/]+/).map(s => s.trim()).filter(Boolean).map(s => ALIASES[s] || ALIASES[s.toLowerCase()]).filter(Boolean);
  const list = toks.length ? toks : DEFAULTS[family].split(',');
  const charMode = list.includes('charBig') ? 'big' : list.includes('charSmall') || list.includes('char') ? 'small' : null;
  return { charMode, talk: list.includes('talk'), parts: list.filter(x => !['char', 'charBig', 'charSmall', 'talk'].includes(x)) };
}

function txt(stack, s, size, color, opts) {
  const t = stack.addText(s);
  t.font = opts && opts.bold ? Font.boldSystemFont(size) : opts && opts.mono ? Font.semiboldMonospacedSystemFont(size) : Font.systemFont(size);
  t.textColor = C(color); if (opts && opts.lines) t.lineLimit = opts.lines; if (opts && opts.min) t.minimumScaleFactor = opts.min;
  return t;
}
function headLine(stack, m, fs) {
  const row = stack.addStack(); row.centerAlignContent();
  txt(row, `${m.W.block} ${m.day.block}`, fs, m.th.deep, { bold: true });
  row.addSpacer();
  txt(row, m.total ? `${m.done}/${m.total}` : '–', fs - 1, m.total && m.done === m.total ? RED : INK, { mono: true });
}
function progress(stack, m, width) {
  const bar = stack.addStack(); bar.size = new Size(width, 6); bar.backgroundColor = C(m.th.line); bar.cornerRadius = 3;
  const f = m.total ? m.done / m.total : 0;
  if (f > 0) { const fill = bar.addStack(); fill.size = new Size(Math.max(6, width * f), 6); fill.backgroundColor = C(m.th.deep); fill.cornerRadius = 3; }
  bar.addSpacer();
}
function itemRow(stack, x, m, fs, dimOther) {
  const row = stack.addStack(); row.centerAlignContent(); row.spacing = 4;
  const g = txt(row, x.routine ? '·' : glyph(x), fs + 1, x.routine ? m.th.deep : INK, { bold: true });
  g.font = Font.boldSystemFont(fs + 1);
  const mk = (x.u ? 'u ' : '') + (x.star ? '* ' : '');
  const color = x.routine ? m.th.deep : dimOther && x.block !== m.day.block ? MUTED : INK;
  txt(row, `${mk}${x.time ? x.time + ' ' : ''}${x.text}`, fs, color, { lines: 1 });
}
function list(stack, items, m, fs, max, empty, dimOther) {
  if (!items.length) { txt(stack, empty, fs - 1, MUTED, { lines: 1 }); return 1; }
  const shown = items.slice(0, max);
  shown.forEach(x => itemRow(stack, x, m, fs, dimOther));
  if (items.length > shown.length && max > 2) txt(stack, m.W.more.replace('{n}', items.length - shown.length), fs - 2, MUTED);
  return shown.length + (items.length > shown.length ? 1 : 0);
}
function blockGrid(stack, m, width) {
  const row = stack.addStack(); row.spacing = 3;
  const cw = Math.floor((width - 15) / 6);
  m.blocks.forEach((gs, i) => {
    const n = i + 1, cell = row.addStack(); cell.layoutVertically(); cell.size = new Size(cw, 30); cell.cornerRadius = 6;
    cell.borderWidth = n === m.day.block ? 1.5 : 0.5; cell.borderColor = C(n === m.day.block ? m.th.deep : m.th.line);
    cell.backgroundColor = C(n === m.day.block ? m.th.soft : '#FFFFFF'); cell.setPadding(2, 2, 2, 2);
    const top = cell.addStack(); top.addSpacer(); txt(top, String(n), 9, n === m.day.block ? m.th.deep : MUTED, { bold: true }); top.addSpacer();
    const bot = cell.addStack(); bot.addSpacer();
    const s = gs.slice(0, 3).join('') + (gs.length > 3 ? '…' : '');
    const t = txt(bot, s || ' ', 10, INK, { mono: true }); t.lineLimit = 1; t.minimumScaleFactor = 0.6;
    bot.addSpacer();
    if (n < m.day.block) cell.backgroundColor = C('#FAFAFA');
  });
}
function bubble(stack, text, m, fs, lines) {
  const b = stack.addStack(); b.backgroundColor = C('#FFFFFF'); b.cornerRadius = 10; b.borderWidth = 1; b.borderColor = C(INK);
  b.setPadding(5, 8, 5, 8);
  txt(b, text, fs, INK, { lines, min: 0.75 });
  return b;
}
function sectionTitle(stack, s, m) { txt(stack, s, 10, m.th.deep, { bold: true }); }

// lays out the chosen parts in a column of the given width; `budget` = how many lines fit
function parts(col, cfg, m0, width, budget, fs, family) {
  let used = 0;
  // events get their own section when it's shown, so the task lists leave them out
  const m = cfg.parts.includes('events') ? { ...m0, open: m0.open.filter(x => x.kind !== 'event'), current: m0.current.filter(x => x.kind !== 'event'), us: m0.us.filter(x => x.kind !== 'event') } : m0;
  const room = () => budget - used;
  for (const p of cfg.parts) {
    if (room() <= 0) break;
    if (used) col.addSpacer(family === 'small' ? 3 : 5);
    if (p === 'date') {
      const r = col.addStack(); r.centerAlignContent();
      const now = new Date();
      txt(r, `${now.getMonth() + 1}/${now.getDate()} (${WEEK[m.lang][now.getDay()]})`, fs + 2, INK, { bold: true });
      used += 1;
    } else if (p === 'time') {
      const d = col.addDate(new Date()); d.applyTimeStyle(); d.font = Font.boldMonospacedSystemFont(fs + 6); d.textColor = C(INK); used += 2;
    } else if (p === 'progress') {
      headLine(col, m, fs); col.addSpacer(3); progress(col, m, width); used += 1.5;
    } else if (p === 'blocks') {
      blockGrid(col, m, width); used += 2.3;
    } else if (p === 'now') {
      if (!cfg.parts.includes('progress')) { headLine(col, m, fs); col.addSpacer(2); used += 1; }
      used += list(col, m.current.length ? m.current : m.open, m, fs, Math.max(1, Math.floor(room())), m.total ? m.W.allDone : m.W.none, true);
    } else if (p === 'tasks') {
      if (!cfg.parts.includes('progress') && !cfg.parts.includes('now')) { headLine(col, m, fs); col.addSpacer(2); used += 1; }
      const rest = cfg.parts.includes('now') ? m.open.filter(x => x.block !== m.day.block) : m.current.concat(m.open.filter(x => x.block !== m.day.block));
      if (cfg.parts.includes('now') && !rest.length) continue;
      used += list(col, rest, m, fs, Math.max(1, Math.floor(room())), m.total ? m.W.allDone : m.W.none, true);
    } else if (p === 'u') {
      sectionTitle(col, 'u', m); used += 0.7;
      used += list(col, m.us, m, fs, Math.max(1, Math.floor(room())), m.W.noU);
    } else if (p === 'routines') {
      sectionTitle(col, m.W.routine, m); used += 0.7;
      const rs = m.routines.map(r => ({ text: r.label, routine: !r.done, kind: 'task', status: r.done ? 'done' : 'open', block: r.block }));
      used += list(col, rs, m, fs, Math.max(1, Math.floor(room())), '–');
    } else if (p === 'events') {
      const evs = m.events.length ? m.events : m.tomorrow.map(t => ({ ...t, text: t.text + ' (+1)' }));
      if (!evs.length) { txt(col, '○ ' + m.W.noEvent, fs - 1, MUTED, { lines: 1 }); used += 1; continue; }
      evs.slice(0, Math.max(1, Math.floor(room()))).forEach(t => {
        const r = col.addStack(); r.spacing = 5;
        txt(r, '○', fs, m.th.deep, { bold: true }); if (t.time) txt(r, t.time, fs, m.th.deep, { bold: true }); txt(r, t.text, fs, INK, { lines: 1 });
        used += 1;
      });
    } else if (p === 'memo') {
      if (!m.notes.length) { txt(col, m.W.noMemo, fs - 1, MUTED); used += 1; continue; }
      m.notes.slice(0, Math.max(1, Math.floor(room()))).forEach(n => {
        const r = col.addStack(); r.spacing = 5;
        txt(r, n.pinned ? '📌' : '—', fs - 1, m.th.deep);
        txt(r, (n.text || '').split('\n').find(s => s.trim()).trim(), fs, INK, { lines: 1 });
        used += 1;
      });
    }
  }
}

const SIZES = { small: [158, 158], medium: [338, 158], large: [338, 354], extraLarge: [715, 354] };
async function buildHome(m, info, family, param) {
  const cfg = parseParam(param, family);
  const [Wd, Ht] = SIZES[family] || SIZES.medium;
  const w = new ListWidget();
  w.backgroundColor = C(m.th.soft); w.url = APP;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
  const padX = family === 'small' ? 12 : 14;
  w.setPadding(family === 'small' ? 12 : 12, padX, 10, padX);
  const now = new Date(), sit = situation(m, now);
  const bank = cfg.talk ? await lineBank(m.ch, m.lang) : null;
  const line = cfg.talk ? speak(bank, sit.kind, m) : '';
  const pose = cfg.charMode === 'big' ? await image(`shared/assets/${m.ch}/${sit.pose}.png`) || await image(`shared/assets/${m.ch}/memo_open.png`) : null;
  const face = cfg.charMode === 'small' ? await image(`shared/assets/icon_${m.ch}.png`) : null;
  const fs = family === 'small' ? 12 : 13;
  const innerW = Wd - 2 * padX;

  if (family === 'small') {
    // small: a little face + the parts, or the full drawing with a line underneath
    if (cfg.charMode === 'big') {
      const top = w.addStack(); top.addSpacer();
      if (pose) { const im = top.addImage(pose); im.imageSize = new Size(cfg.talk ? 84 : 110, cfg.talk ? 84 : 110); }
      top.addSpacer();
      if (cfg.talk && line) { w.addSpacer(4); bubble(w, line, m, 11, 2); }
      else if (cfg.parts.length) { w.addSpacer(4); parts(w, { parts: cfg.parts.slice(0, 1) }, m, innerW, 1.5, fs, family); }
    } else {
      if (face || cfg.talk) {
        const top = w.addStack(); top.centerAlignContent(); top.spacing = 6;
        if (face) { const im = top.addImage(face); im.imageSize = new Size(26, 26); im.cornerRadius = 13; }
        if (cfg.talk && line) txt(top, line, 10, INK, { lines: 2, min: 0.7 }); else txt(top, m.who, 12, m.th.deep, { bold: true });
        w.addSpacer(6);
      }
      parts(w, cfg, m, innerW, face || cfg.talk ? 4 : 6, fs, family);
    }
    w.addSpacer();
    footer(w, m, info, false);
    return w;
  }

  if (family === 'medium') {
    const row = w.addStack(); row.spacing = 10;
    let colW = innerW;
    if (cfg.charMode === 'big' && pose) {
      const left = row.addStack(); left.layoutVertically(); left.size = new Size(104, 132);
      left.addSpacer(); const im = left.addImage(pose); im.imageSize = new Size(104, 120); left.addSpacer();
      colW = innerW - 114;
    }
    const col = row.addStack(); col.layoutVertically();
    let budget = 6.5;
    if (cfg.charMode === 'small' && face) {
      const top = col.addStack(); top.centerAlignContent(); top.spacing = 6;
      const im = top.addImage(face); im.imageSize = new Size(24, 24); im.cornerRadius = 12;
      if (cfg.talk && line) txt(top, line, 11, INK, { lines: 2, min: 0.75 }); else txt(top, m.who, 13, m.th.deep, { bold: true });
      col.addSpacer(5); budget -= 1.6;
    } else if (cfg.talk && line) { bubble(col, line, m, 11, 2); col.addSpacer(6); budget -= 2; }
    parts(col, cfg, m, colW, budget, fs, family);
    col.addSpacer();
    footer(col, m, info, true);
    return w;
  }

  // large (and iPad extra large)
  let budget = 15;
  if (cfg.charMode || cfg.talk) {
    const top = w.addStack(); top.spacing = 10; top.centerAlignContent();
    if (cfg.charMode === 'big' && pose) { const im = top.addImage(pose); im.imageSize = new Size(110, 110); budget -= 5.5; }
    else if (face) { const im = top.addImage(face); im.imageSize = new Size(32, 32); im.cornerRadius = 16; budget -= 2; }
    if (cfg.talk && line) { const b = bubble(top, line, m, 13, 3); if (!(cfg.charMode === 'big' && pose)) budget -= 1; }
    else if (!(cfg.charMode === 'big' && pose)) txt(top, m.who, 15, m.th.deep, { bold: true });
    w.addSpacer(8);
  }
  parts(w, cfg, m, innerW, budget, 14, family);
  w.addSpacer();
  footer(w, m, info, true);
  return w;
}
function footer(stack, m, info, showEvent) {
  const foot = stack.addStack(); foot.centerAlignContent();
  foot.addSpacer();
  const d = new Date(info.at);
  txt(foot, `${info.live ? '' : '⚠ '}${pad(d.getHours())}:${pad(d.getMinutes())}`, 9, MUTED);
}

// lock screen: one line, a small box, or a circle
function buildLock(m, info, family, param) {
  const w = new ListWidget(); w.url = APP;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
  const next = (m.current[0] || m.open[0]);
  const ev = m.events.find(t => t.time);
  if (family === 'accessoryInline') {
    const s = m.total && !m.open.length ? `X ${m.W.allDone}` : `${m.W.block} ${m.day.block} · ${m.done}/${m.total}${next ? ' · ' + next.text : ''}`;
    w.addText(s);
    return w;
  }
  if (family === 'accessoryCircular') {
    w.addAccessoryWidgetBackground = true;
    const s = w.addStack(); s.layoutVertically(); s.centerAlignContent();
    const a = s.addStack(); a.addSpacer(); const t1 = a.addText(`${m.done}/${m.total}`); t1.font = Font.boldRoundedSystemFont(15); t1.minimumScaleFactor = 0.6; a.addSpacer();
    const b = s.addStack(); b.addSpacer(); const t2 = b.addText(`${m.W.block} ${m.day.block}`); t2.font = Font.systemFont(9); b.addSpacer();
    return w;
  }
  // accessoryRectangular
  const want = parseParam(param, 'small').parts;
  const t1 = w.addText(`${m.W.block} ${m.day.block} · ${m.done}/${m.total}`); t1.font = Font.boldSystemFont(13);
  const rows = want.includes('events') && ev ? [`○ ${ev.time} ${ev.text}`] : [];
  (m.current.length ? m.current : m.open).slice(0, 2 - rows.length).forEach(x => rows.push(`${x.routine ? '·' : glyph(x)} ${x.u ? 'u ' : ''}${x.text}`));
  if (!rows.length) rows.push(m.total ? m.W.allDone : m.W.none);
  rows.forEach(s => { const t = w.addText(s); t.font = Font.systemFont(12); t.lineLimit = 1; });
  return w;
}

// ======================= notifications =======================
async function schedule(e, m) {
  const THREAD = 'desk-buddy';
  const pending = await Notification.allPending();
  for (const n of pending) if (n.threadIdentifier === THREAD) n.remove();     // replace ours with the current list
  const now = new Date(), val = (k) => (e[k] && e[k].v !== null ? e[k].v : undefined);
  const at = (key, hhmm, minus) => { const [y, mo, d] = key.split('-').map(Number); const [h, mi] = hhmm.split(':').map(Number); return new Date(y, mo - 1, d, h, mi - (minus || 0)); };
  const L = { ko: (n) => `${EVENT_LEAD_MIN}분 뒤야. 준비하자.`, en: () => `In ${EVENT_LEAD_MIN} minutes. Get ready.`, ja: () => `${EVENT_LEAD_MIN}分後だよ。準備しよう。` }[m.lang];
  for (const key of [m.key, addDays(m.key, 1)]) {
    for (const t of readDay(e, key).tasks) {
      if (t.kind !== 'event' || !t.time || t.status !== 'open') continue;
      const when = at(key, t.time, EVENT_LEAD_MIN);
      if (when <= now) continue;
      const n = new Notification();
      n.title = `○ ${t.time} ${t.text}`; n.body = `${m.who}: ${L()}`;
      n.threadIdentifier = THREAD; n.identifier = `db-ev-${key}-${t.id}`; n.openURL = APP; n.setTriggerDate(when);
      await n.schedule();
    }
  }
  for (const a of val('s|alarms') || []) {
    if (!a.on || !a.time) continue;
    const n = new Notification();
    n.title = `⏰ ${a.label || (m.lang === 'ko' ? '알람' : m.lang === 'ja' ? 'アラーム' : 'Alarm')} · ${a.time}`; n.body = m.who; n.sound = 'alarm';
    n.threadIdentifier = THREAD; n.identifier = `db-al-${a.id}`; n.openURL = APP;
    const [h, mi] = a.time.split(':').map(Number);
    if (a.repeat) n.setDailyTrigger(h, mi, true);
    else { const when = new Date(); when.setHours(h, mi, 0, 0); if (when <= now) continue; n.setTriggerDate(when); }
    await n.schedule();
  }
}

// ======================= in the app: code, previews, designer =======================
function message(text) { const w = new ListWidget(); w.backgroundColor = C('#F2F7F4'); w.url = APP; txt(w, text, 13, MUTED); return w; }
async function askCode(current) {
  const a = new Alert();
  a.title = '책상 친구 연동 코드';
  a.message = 'PC 설정 › 폰 연동(또는 폰 앱 설정 › PC 연동)에 보이는 16자리 코드를 넣어 주세요.';
  a.addTextField('XXXX-XXXX-XXXX-XXXX', current || '');
  a.addAction('저장'); a.addCancelAction('취소');
  if ((await a.present()) === -1) return null;
  const c = a.textFieldValue(0).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== 16) { const b = new Alert(); b.title = '16자리가 아니에요'; b.addAction('확인'); await b.present(); return null; }
  const code = c.match(/.{4}/g).join('-');
  Keychain.set(KEY_NAME, code);
  return code;
}
const PART_MENU = [['큰캐릭터', '캐릭터 그림 (크게)'], ['작은캐릭터', '캐릭터 얼굴 (작게)'], ['말', '말풍선 (지금 상황에 맞는 한마디)'], ['날짜', '날짜'], ['시간', '시계'],
  ['진행', '끝낸 수 / 전체 + 진행 막대'], ['블럭', '블럭 6칸 (불릿 기호)'], ['지금블럭', '지금 블럭 할 일'], ['할일', '남은 할 일 전부'], ['u', 'u 할 일만'],
  ['루틴', '오늘 루틴'], ['일정', '다음 일정'], ['메모', '메모 첫 줄 (고정 먼저)']];
async function designer(m, info) {
  const picked = [];
  for (;;) {
    const a = new Alert();
    a.title = '위젯 꾸미기';
    a.message = (picked.length ? `지금: ${picked.join(', ')}\n` : '') + '보여줄 칸을 위에서부터 순서대로 골라요.';
    PART_MENU.filter(([k]) => !picked.includes(k)).forEach(([k, d]) => a.addAction(`${k} — ${d}`));
    if (picked.length) a.addDestructiveAction('다 골랐어');
    a.addCancelAction('취소');
    const r = await a.present();
    if (r === -1) return;
    const left = PART_MENU.filter(([k]) => !picked.includes(k));
    if (r >= left.length) break;
    picked.push(left[r][0]);
  }
  const param = picked.join(', ');
  Pasteboard.copy(param);
  const fam = new Alert(); fam.title = '미리보기 크기'; ['작게', '중간', '크게'].forEach(s => fam.addAction(s)); fam.addCancelAction('건너뛰기');
  const f = await fam.present();
  if (f >= 0) { const family = ['small', 'medium', 'large'][f]; const w = await buildHome(m, info, family, param); await w[{ small: 'presentSmall', medium: 'presentMedium', large: 'presentLarge' }[family]](); }
  const done = new Alert();
  done.title = '복사했어요';
  done.message = `"${param}"\n\n홈 화면 위젯을 길게 눌러 › 위젯 편집 › Parameter 칸에 붙여 넣으세요. 위젯마다 다르게 해도 돼요.`;
  done.addAction('확인'); await done.present();
}

async function main() {
  let code = Keychain.contains(KEY_NAME) ? Keychain.get(KEY_NAME) : null;
  const inApp = !config.runsInWidget && !config.runsInAccessoryWidget;
  let action = 'preview';
  if (inApp) {
    if (!code) code = await askCode();
    if (!code) return;
    const a = new Alert(); a.title = '책상 친구'; a.message = `연동 코드: ${code}`;
    ['위젯 꾸미기', '미리보기 · 작게', '미리보기 · 중간', '미리보기 · 크게', '코드 바꾸기', '앱 열기'].forEach(s => a.addAction(s)); a.addCancelAction('닫기');
    const r = await a.present();
    if (r === -1) return;
    if (r === 4) { code = await askCode(code) || code; }
    if (r === 5) { Safari.open(APP); return; }
    action = ['design', 'small', 'medium', 'large', 'medium'][r];
  }
  const family = config.widgetFamily || (['small', 'medium', 'large'].includes(action) ? action : 'medium');
  const show = async (w) => { if (inApp) await w[{ small: 'presentSmall', medium: 'presentMedium', large: 'presentLarge' }[family] || 'presentMedium'](); else Script.setWidget(w); };
  if (!code) return show(message('Scriptable 앱에서 이 스크립트를 한 번 실행해 연동 코드를 넣어 주세요.'));
  let info;
  try { info = await load(code); }
  catch (err) { const w = message('연결이 안 돼요. 잠시 뒤 다시 볼게요.'); w.refreshAfterDate = new Date(Date.now() + 10 * 60000); return show(w); }
  if (!info.e) return show(message('아직 이 코드로 저장된 게 없어요. PC에서 연동을 먼저 켜 주세요.'));
  const m = model(info.e, new Date());
  if (NOTIFY && info.live) { try { await schedule(info.e, m); } catch (e) {} }
  if (action === 'design') return designer(m, info);
  const w = family.startsWith('accessory') ? buildLock(m, info, family, args.widgetParameter) : await buildHome(m, info, family, args.widgetParameter);
  await show(w);
}

if (typeof module !== 'undefined' && module.exports && typeof Script === 'undefined') module.exports = { Crypto, readDay, dayKey, model, buildHome, buildLock, parseParam, situation, speak, lineBank };
else { await main(); Script.complete(); }
