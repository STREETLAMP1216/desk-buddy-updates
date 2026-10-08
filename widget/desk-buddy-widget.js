// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: book-open;

// 책상 친구 — 아이폰 위젯 (Scriptable)
// · 홈 화면 위젯: 지금 블럭, 남은 할 일, 다음 일정
// · 알림: 오늘·내일 일정 10분 전, PC에서 맞춘 알람 시각
// 처음 한 번 Scriptable 앱 안에서 실행하면 연동 코드를 물어봐요 (PC 설정 › 폰 연동의 코드).
// 코드를 바꾸려면 앱 안에서 다시 실행 › "코드 바꾸기".

const SERVER = 'https://desk-buddy-sync.soohwanj97.workers.dev';
const APP = 'https://streetlamp1216.github.io/desk-buddy-updates/app/';
const NOTIFY = true;            // 일정·알람 알림
const EVENT_LEAD_MIN = 10;      // 일정 몇 분 전에 알려줄지
const KEY_NAME = 'desk-buddy-sync-code';

const THEMES = {
  shiori: { name: '시오리', mint: '#A8DCC6', deep: '#4E8A6B', soft: '#F2F7F4', line: '#D6DED9' },
  fubuki: { name: '후부키', mint: '#EBDB9C', deep: '#8A7224', soft: '#FAF6E8', line: '#E5DDC4' },
  suu: { name: '수우', mint: '#AAC7E7', deep: '#3E679A', soft: '#F0F4FA', line: '#D3DCE8' }
};

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
const glyph = (t) => (t.kind === 'event' ? '○' : t.kind === 'note' ? '—' : t.kind === 'idea' ? '!' : { open: '·', done: 'X', migrated: '>', scheduled: '<' }[t.status] || '·');

function readDay(e, key) {
  const val = (k) => (e[k] && e[k].v !== null ? e[k].v : undefined);
  const order = val(`o|${key}`) || [];
  const tasks = Object.keys(e).filter(k => k.startsWith(`t|${key}|`) && e[k].v !== null).map(k => e[k].v);
  const pos = {}; order.forEach((id, i) => { pos[id] = i; });
  tasks.sort((a, b) => (a.id in pos ? pos[a.id] : 1e9) - (b.id in pos ? pos[b.id] : 1e9));
  const ordered = val(`c|${key}`) ? tasks : tasks.map((t, i) => ({ t, i })).sort((a, b) => (a.t.u === b.t.u ? a.i - b.i : a.t.u ? -1 : 1)).map(x => x.t);
  const [y, m, d] = key.split('-').map(Number), dow = new Date(y, m - 1, d).getDay();
  const routines = (val('s|routines') || [{ id: 'ledger', label: '가계부', days: [0, 1, 2, 3, 4, 5, 6] }, { id: 'diary', label: '일기', days: [0, 1, 2, 3, 4, 5, 6] }, { id: 'exercise', label: '운동', days: [1, 2, 3, 4, 5, 6] }])
    .filter(r => (r.days || []).includes(dow)).map(r => ({ ...r, done: !!val(`r|${key}|${r.id}`) }));
  return { tasks: ordered, routines, block: val(`b|${key}`) || 1 };
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
const cachePath = fm.joinPath(fm.cacheDirectory(), 'desk-buddy-entries.json');
async function load(code) {
  try { const e = await fetchEntries(code); if (e) fm.writeString(cachePath, JSON.stringify({ at: Date.now(), e })); return { e, at: Date.now(), live: true }; }
  catch (err) { if (fm.fileExists(cachePath)) { const c = JSON.parse(fm.readString(cachePath)); return { e: c.e, at: c.at, live: false }; } throw err; }
}
async function icon(ch) {
  const p = fm.joinPath(fm.cacheDirectory(), `desk-buddy-icon-${ch}.png`);
  if (fm.fileExists(p)) return fm.readImage(p);
  try { const img = await new Request(`${APP}shared/assets/icon_${ch}.png`).loadImage(); fm.writeImage(p, img); return img; } catch (e) { return null; }
}

// ======================= notifications =======================
async function schedule(e, today) {
  const THREAD = 'desk-buddy';
  const pending = await Notification.allPending();
  for (const n of pending) if (n.threadIdentifier === THREAD) n.remove();     // replace ours with the current list
  const now = new Date(), val = (k) => (e[k] && e[k].v !== null ? e[k].v : undefined);
  const ch = THEMES[val('s|character')] ? val('s|character') : 'shiori';
  const who = ((val('s|names') || {})[ch]) || THEMES[ch].name;
  const at = (key, hhmm, minus) => { const [y, m, d] = key.split('-').map(Number); const [h, mi] = hhmm.split(':').map(Number); return new Date(y, m - 1, d, h, mi - (minus || 0)); };
  let count = 0;
  for (const key of [today, addDays(today, 1)]) {
    for (const t of readDay(e, key).tasks) {
      if (t.kind !== 'event' || !t.time || t.status !== 'open') continue;
      const when = at(key, t.time, EVENT_LEAD_MIN);
      if (when <= now) continue;
      const n = new Notification();
      n.title = `○ ${t.time} ${t.text}`; n.body = `${who}: ${EVENT_LEAD_MIN}분 뒤야. 준비하자.`;
      n.threadIdentifier = THREAD; n.identifier = `db-ev-${key}-${t.id}`; n.openURL = APP; n.setTriggerDate(when);
      await n.schedule(); count++;
    }
  }
  for (const a of val('s|alarms') || []) {
    if (!a.on || !a.time) continue;
    const n = new Notification();
    n.title = `⏰ ${a.label || '알람'} · ${a.time}`; n.body = `${who}가 PC에서 맞춘 알람이야.`; n.sound = 'alarm';
    n.threadIdentifier = THREAD; n.identifier = `db-al-${a.id}`; n.openURL = APP;
    const [h, mi] = a.time.split(':').map(Number);
    if (a.repeat) n.setDailyTrigger(h, mi, true);
    else { let when = new Date(); when.setHours(h, mi, 0, 0); if (when <= now) continue; n.setTriggerDate(when); }
    await n.schedule(); count++;
  }
  return count;
}

// ======================= widget =======================
async function build(e, info) {
  const val = (k) => (e[k] && e[k].v !== null ? e[k].v : undefined);
  const ch = THEMES[val('s|character')] ? val('s|character') : 'shiori', th = THEMES[ch];
  const today = dayKey(new Date(), val('s|dayStart'));
  const day = readDay(e, today);
  const family = config.widgetFamily || 'medium';
  const tasks = day.tasks.filter(t => t.kind === 'task'), done = tasks.filter(t => t.status === 'done').length + day.routines.filter(r => r.done).length;
  const total = tasks.filter(t => t.status === 'open' || t.status === 'done').length + day.routines.length;
  const open = day.routines.filter(r => !r.done).map(r => ({ text: r.label, block: r.block, routine: true }))
    .concat(day.tasks.filter(t => (t.kind === 'task' || t.kind === 'event') && t.status === 'open'));
  const inBlock = open.filter(x => x.block === day.block), rest = open.filter(x => x.block !== day.block);
  const max = family === 'small' ? 3 : family === 'large' ? 11 : 4;
  const list = inBlock.concat(rest).slice(0, max);
  const nextEv = day.tasks.filter(t => t.kind === 'event' && t.time && t.status === 'open').sort((a, b) => a.time.localeCompare(b.time))
    .find(t => { const [h, m] = t.time.split(':').map(Number); const d = new Date(); return h * 60 + m >= d.getHours() * 60 + d.getMinutes(); });

  const w = new ListWidget();
  w.backgroundColor = new Color(th.soft); w.url = APP;
  w.setPadding(12, 14, 10, 14);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
  const ink = new Color('#1E1E1E'), muted = new Color('#5B6670'), deep = new Color(th.deep), red = new Color('#C0392B');

  const head = w.addStack(); head.centerAlignContent();
  const img = await icon(ch);
  if (img) { const im = head.addImage(img); im.imageSize = new Size(22, 22); im.cornerRadius = 11; head.addSpacer(6); }
  const title = head.addText(`블럭 ${day.block}`); title.font = Font.boldSystemFont(14); title.textColor = deep;
  head.addSpacer();
  const cnt = head.addText(total ? `${done}/${total}` : '–'); cnt.font = Font.semiboldMonospacedSystemFont(13); cnt.textColor = done && done === total ? red : ink;
  w.addSpacer(6);

  if (!list.length) {
    const t = w.addText(total ? '오늘 할 일 다 끝냈어 X' : '아직 적은 게 없어'); t.font = Font.systemFont(13); t.textColor = muted;
  }
  list.forEach((x, i) => {
    const row = w.addStack(); row.centerAlignContent();
    const g = row.addText(x.routine ? '·' : glyph(x)); g.font = Font.boldSystemFont(14); g.textColor = x.routine ? deep : ink;
    row.addSpacer(5);
    const mk = (x.u ? 'u ' : '') + (x.star ? '* ' : '');
    const tx = row.addText(`${mk}${x.time ? x.time + ' ' : ''}${x.text}`);
    tx.font = Font.systemFont(family === 'small' ? 12 : 13); tx.lineLimit = 1;
    tx.textColor = x.routine ? deep : x.block === day.block ? ink : muted;
    if (i < list.length - 1) w.addSpacer(2);
  });
  w.addSpacer();
  const foot = w.addStack(); foot.centerAlignContent();
  if (nextEv && family !== 'small') { const ev = foot.addText(`○ ${nextEv.time} ${nextEv.text}`); ev.font = Font.systemFont(11); ev.textColor = deep; ev.lineLimit = 1; }
  foot.addSpacer();
  const d = new Date(info.at), st = foot.addText(`${info.live ? '' : '⚠ '}${pad(d.getHours())}:${pad(d.getMinutes())}`);
  st.font = Font.systemFont(10); st.textColor = muted;
  return w;
}

function message(text) { const w = new ListWidget(); w.backgroundColor = new Color('#F2F7F4'); w.url = APP; const t = w.addText(text); t.font = Font.systemFont(13); t.textColor = new Color('#5B6670'); return w; }

// ======================= run =======================
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

async function main() {
  let code = Keychain.contains(KEY_NAME) ? Keychain.get(KEY_NAME) : null;
  if (!config.runsInWidget && !config.runsInAccessoryWidget) {
    if (code) {
      const a = new Alert(); a.title = '책상 친구'; a.message = `연동 코드: ${code}`;
      a.addAction('위젯 미리보기'); a.addAction('코드 바꾸기'); a.addAction('앱 열기'); a.addCancelAction('닫기');
      const r = await a.present();
      if (r === 1) code = await askCode(code) || code;
      if (r === 2) { Safari.open(APP); return; }
      if (r === -1) return;
    } else code = await askCode();
  }
  if (!code) { const w = message('Scriptable 앱에서 이 스크립트를 한 번 실행해 연동 코드를 넣어 주세요.'); Script.setWidget(w); if (!config.runsInWidget) await w.presentMedium(); return; }
  let info;
  try { info = await load(code); }
  catch (err) { const w = message('연결이 안 돼요. 잠시 뒤 다시 볼게요.'); w.refreshAfterDate = new Date(Date.now() + 10 * 60000); Script.setWidget(w); if (!config.runsInWidget) await w.presentMedium(); return; }
  if (!info.e) { const w = message('아직 이 코드로 저장된 게 없어요. PC에서 연동을 먼저 켜 주세요.'); Script.setWidget(w); if (!config.runsInWidget) await w.presentMedium(); return; }
  const val = (k) => (info.e[k] && info.e[k].v !== null ? info.e[k].v : undefined);
  if (NOTIFY && info.live) { try { await schedule(info.e, dayKey(new Date(), val('s|dayStart'))); } catch (e) {} }
  const w = await build(info.e, info);
  if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
}

if (typeof module !== 'undefined' && module.exports && typeof Script === 'undefined') module.exports = { Crypto, readDay, dayKey };
else { await main(); Script.complete(); }
