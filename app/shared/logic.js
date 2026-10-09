// Pure logic (no DOM), shared by the app and the tests.
(function (root) {
  const pad = (n) => String(n).padStart(2, '0');
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];       // replaced in place by setWeek() for other languages
  function setWeek(names) { names.forEach((n, i) => { WEEK[i] = n; }); }

  function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function addDays(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return dateKey(dt);
  }
  // the day a moment belongs to: before the "day starts at" time (default 4:00) it still counts as the day before,
  // so working past midnight doesn't wipe the list
  function dayKey(d, startHHMM) {
    const s = minutes(startHHMM || '04:00');
    const shifted = new Date(d.getTime() - s * 60000);
    return dateKey(shifted);
  }
  function label(key) {
    const [y, m, d] = key.split('-').map(Number);
    return `${m}/${d} (${WEEK[new Date(y, m - 1, d).getDay()]})`;
  }
  function minutes(hhmm) { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); }
  function nowMinutes(d) { return d.getHours() * 60 + d.getMinutes(); }

  // ----- tasks -----
  // "u * 민기 연락" -> { text: '민기 연락', u: true, star: true, kind: 'task' }
  function parseInput(raw) {
    let s = String(raw || '').trim();
    const t = { text: '', u: false, star: false, kind: 'task' };
    for (;;) {
      const m = s.match(/^(u|U|\*|○|o|O|—|-|!|·|ㄴ)(\s+|$)/);
      if (!m) break;
      const k = m[1];
      if (k === 'u' || k === 'U') t.u = true;
      else if (k === '*') t.star = true;
      else if (k === '○' || k === 'o' || k === 'O') t.kind = 'event';
      else if (k === '—' || k === '-') t.kind = 'note';
      else if (k === '!') t.kind = 'idea';
      else if (k === 'ㄴ') t.sub = true;              // "ㄴ 내용": goes under the task above
      s = s.slice(m[0].length);
    }
    t.text = s.trim();
    return t;
  }

  let seq = 0;
  function newTask(parsed, now) {
    seq += 1;
    return { id: `${(now || new Date()).getTime().toString(36)}-${seq}`, text: parsed.text, u: !!parsed.u, star: !!parsed.star, kind: parsed.kind || 'task', status: 'open' };
  }

  function ensureDay(data, key) {
    data.days = data.days || {};
    if (!data.days[key]) data.days[key] = { tasks: [], routines: {}, fired: {} };
    const day = data.days[key];
    day.tasks = day.tasks || []; day.routines = day.routines || {}; day.fired = day.fired || {};
    return day;
  }

  // days: 0 = 일 … 6 = 토
  const DEFAULT_ROUTINES = [
    { id: 'ledger', label: '가계부', days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'diary', label: '일기', days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'exercise', label: '운동', days: [1, 2, 3, 4, 5, 6] }
  ];
  function routinesFor(key, routines) {
    const [y, m, d] = key.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return (routines || DEFAULT_ROUTINES).filter(r => (r.days || []).includes(dow));
  }
  function newRoutine(label, days) {
    seq += 1;
    return { id: `r${Date.now().toString(36)}${seq}`, label: String(label).trim(), days: (days || [0, 1, 2, 3, 4, 5, 6]).slice().sort() };
  }

  // u first (they're quick wins), then the rest; the original order is kept inside each group.
  // Once you've dragged tasks into your own order (custom), that order is kept as it is.
  function ordered(tasks, custom) {
    if (custom) return tasks.slice();
    return tasks.map((t, i) => ({ t, i }))
      .sort((a, b) => (a.t.u === b.t.u ? a.i - b.i : a.t.u ? -1 : 1))
      .map(x => x.t);
  }

  function isOpen(t) { return t.kind === 'task' && t.status === 'open'; }
  // tasks only, or tasks + today's routines when the routine list is given
  function counts(day, routines) {
    const tasks = day.tasks.filter(t => t.kind === 'task');
    let done = tasks.filter(t => t.status === 'done').length;
    let open = tasks.filter(t => t.status === 'open').length;
    (routines || []).forEach(r => { const s = day.routines && day.routines[r.id]; if (s === 'cancel') return; if (s) done++; else open++; });   // a struck-out routine doesn't count that day
    return { done, open, total: done + open };
  }

  // what to suggest: quick (u) first, then important (*), then the rest; skip ones in `skip`
  function suggest(day, skip) {
    const s = new Set(skip || []);
    const open = ordered(day.tasks, day.customOrder).filter(t => isOpen(t) && !s.has(t.id));
    const score = (t) => (t.u ? 0 : t.star ? 1 : 2);
    return open.sort((a, b) => score(a) - score(b))[0] || null;
  }

  // > : move to the next day (stays on today as ">")
  function migrate(data, key, id) {
    const day = ensureDay(data, key);
    const t = day.tasks.find(x => x.id === id);
    if (!t || t.status !== 'open') return null;
    const to = addDays(key, 1);
    t.status = 'migrated'; t.to = to;
    ensureDay(data, to).tasks.push({ ...t, id: t.id + '>', status: 'open', to: undefined, from: key, parent: undefined });
    moveKids(day, ensureDay(data, to), t.id, t.id + '>', key, '>');
    return to;
  }

  // < : move to a fixed date (stays on today as "< → date")
  function schedule(data, key, id, toKey) {
    const day = ensureDay(data, key);
    const t = day.tasks.find(x => x.id === id);
    if (!t || t.status !== 'open' || !toKey || toKey === key) return null;
    t.status = 'scheduled'; t.to = toKey;
    ensureDay(data, toKey).tasks.push({ ...t, id: t.id + '<', status: 'open', to: undefined, from: key, parent: undefined });
    moveKids(day, ensureDay(data, toKey), t.id, t.id + '<', key, '<');
    return toKey;
  }

  // open tasks left on earlier days (up to `days` back): [{ key, task }]
  function leftovers(data, key, days) {
    const out = [];
    for (let i = 1; i <= (days || 14); i++) {
      const k = addDays(key, -i), d = data.days && data.days[k];
      if (!d || !d.tasks) continue;
      const openIds = new Set(d.tasks.filter(t => t.status === 'open').map(t => t.id));
      // a sub-item whose parent is also left over comes along with the parent
      d.tasks.forEach(t => { if ((t.kind === 'task' || t.kind === 'event') && t.status === 'open' && !t.dismissed && !(t.parent && openIds.has(t.parent))) out.push({ key: k, task: t }); });
    }
    return out;
  }
  // bring a leftover into today (it stays on its own day as ">")
  function carryOver(data, fromKey, id, toKey) {
    const from = ensureDay(data, fromKey);
    const t = from.tasks.find(x => x.id === id);
    if (!t || t.status !== 'open') return false;
    t.status = 'migrated'; t.to = toKey;
    ensureDay(data, toKey).tasks.push({ ...t, id: t.id + '>', status: 'open', to: undefined, from: fromKey, parent: undefined });
    moveKids(from, ensureDay(data, toKey), t.id, t.id + '>', fromKey, '>');
    return true;
  }
  function dropLeftover(data, fromKey, id) {
    const from = ensureDay(data, fromKey);
    from.tasks = from.tasks.filter(x => x.id !== id && x.parent !== id);
  }
  // open sub-items (and memo lines) go along with their task; the open ones stay behind as ">"
  function moveKids(fromDay, toDay, oldId, newId, fromKey, mark) {
    fromDay.tasks.filter(c => c.parent === oldId && c.status === 'open').forEach(c => {
      toDay.tasks.push({ ...c, id: c.id + mark, parent: newId, from: fromKey, to: undefined });
      if (c.kind === 'task') c.status = mark === '>' ? 'migrated' : 'scheduled';
    });
  }

  // ----- sub-items: a task can sit under another (t.parent = id), one level deep -----
  // [{ t, depth, block }] — sub-items right after their task, in your order; they take the task's block
  function tree(tasks, custom) {
    const byId = {}; tasks.forEach(t => { byId[t.id] = t; });
    const rootOf = (t) => { let r = t, n = 0; while (r.parent && byId[r.parent] && r.parent !== r.id && n++ < 8) r = byId[r.parent]; return r; };
    const ord = ordered(tasks, custom), kids = {}, top = [];
    ord.forEach(t => { const r = rootOf(t); if (r === t) top.push(t); else (kids[r.id] = kids[r.id] || []).push(t); });
    const out = [];
    top.forEach(p => { out.push({ t: p, depth: 0, block: p.block }); (kids[p.id] || []).forEach(c => out.push({ t: c, depth: 1, block: p.block })); });
    return out;
  }
  function kidsOf(tasks, id) { return tasks.filter(t => t.parent === id); }
  // how long / when: "30분", "1시간 30분", "14:00–15:30"
  const DUR = { ko: [(h) => h + '시간', (m) => m + '분'], en: [(h) => h + 'h', (m) => m + 'm'], ja: [(h) => h + '時間', (m) => m + '分'] };
  function durText(min, lang) {
    const f = DUR[lang] || DUR.ko, h = Math.floor(min / 60), m = min % 60;
    return [h ? f[0](h) : '', m ? f[1](m) : ''].filter(Boolean).join(lang === 'en' ? ' ' : ' ');
  }
  function whenText(t, lang) {
    if (t.time && t.end) return `${t.time}–${t.end}`;
    if (t.time) return t.time;
    if (t.dur) return durText(t.dur, lang);
    return '';
  }

  // a line through it: not happening after all (that day was different). Its open sub-items go with it.
  function strike(s) { return Array.from(String(s)).map(c => (c === ' ' ? c : c + '\u0336')).join(''); }
  function toggleCancel(day, id) {
    const t = day.tasks.find(x => x.id === id);
    if (!t || (t.status !== 'open' && t.status !== 'cancelled')) return null;
    const to = t.status === 'open' ? 'cancelled' : 'open';
    t.status = to;
    day.tasks.filter(c => c.parent === t.id && c.status === (to === 'cancelled' ? 'open' : 'cancelled')).forEach(c => { c.status = to; });
    return to;
  }
  function routineState(day, id) { const s = day.routines && day.routines[id]; return s === 'cancel' ? 'cancel' : s ? 'done' : 'open'; }
  function toggleDone(day, id) {
    const t = day.tasks.find(x => x.id === id);
    if (!t || (t.kind !== 'task' && t.kind !== 'event')) return null;     // events can be ticked off too (○ → X)
    if (t.status !== 'open' && t.status !== 'done') return null;
    if (t.status === 'open') t.status = 'done';
    else if (t.status === 'done') t.status = 'open';
    return t.status;
  }

  // plain text in the notebook's symbols, ready to paste or copy by hand
  function glyph(t) {
    if (t.kind === 'event') return t.status === 'done' ? 'X' : '○';
    if (t.kind === 'note') return '—';
    if (t.kind === 'idea') return '!';
    return { open: '·', done: 'X', migrated: '>', scheduled: '<' }[t.status] || '·';
  }
  function line(t) {
    const marks = (t.u ? 'u ' : '') + (t.star ? '* ' : '');
    const to = t.status === 'scheduled' && t.to ? ` → ${t.to.slice(5).replace('-', '/').replace(/^0/, '').replace('/0', '/')}` : '';
    const when = whenText(t);
    const body = `${when ? when + ' ' : ''}${t.text}${t.cue && t.status === 'open' ? ` (${t.cue})` : ''}`;
    return `${marks}${glyph(t)}  ${t.status === 'cancelled' ? strike(body) : body}${to}`;
  }
  function toPlainText(data, key, words) {
    const w = words || { routines: '[매일 루틴]', today: '[오늘]' };
    const day = ensureDay(data, key);
    const out = [label(key), '', w.routines];
    routinesFor(key, data.settings && data.settings.routines).forEach(r => { const s = day.routines[r.id]; out.push(s === 'cancel' ? `·  ${strike(r.label)}` : `${s ? 'X' : '·'}  ${r.label}`); });
    out.push('', w.today);
    tree(day.tasks, day.customOrder).forEach(({ t, depth }) => out.push((depth ? '    ' : '') + line(t)));
    return out.join('\n');
  }

  // ----- time & pose -----
  function slot(d) {
    const h = d.getHours();
    if (h >= 6 && h < 11) return 'morning';
    if (h >= 11 && h < 18) return 'day';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
  }
  function inWindow(d, startHHMM, lengthMin) {
    const n = nowMinutes(d), s = minutes(startHHMM);
    return n >= s && n < s + lengthMin;
  }
  function workHours(d, settings) {
    const n = nowMinutes(d);
    return n >= minutes(settings.workStart || '09:00') && n < minutes(settings.workEnd || '22:00');
  }

  // which drawing to show
  const NIGHT_AWAKE_SEC = 15 * 60;
  const AWAY_SEC = 30 * 60;
  function pose(ctx) {
    const { now, idleSec, panelOpen, study, settings, focusing } = ctx;
    if (panelOpen) return 'memo';
    if (idleSec < 4 || focusing) return 'laptop';
    const s = slot(now);
    // paused in work hours: "hm?" first, then she alternates between thinking and resting on the desk
    if (idleSec >= 60 && idleSec < AWAY_SEC && workHours(now, settings)) {
      return idleSec < 180 || Math.floor(idleSec / 240) % 2 === 0 ? 'hm' : 'rest';
    }
    if (idleSec >= AWAY_SEC && s !== 'night') return 'away';            // you've been gone a while: she stepped out too
    // how long the snack drawing stays up depends on how much she's allowed to change poses
    const snackLen = { never: 10, normal: 15, often: 20 }[settings.variety || 'normal'] || 15;
    if (inWindow(now, settings.snack || '15:30', snackLen)) return 'snack';
    if (study) return 'study';
    if (s === 'morning') return 'morning';
    if (s === 'day') return 'laptop';
    if (s === 'evening') return 'hoodie';
    // night: while you're still at the computer she stays up with you ("still online");
    // only after you've been gone a while does she change into pajamas and doze off
    return idleSec < NIGHT_AWAKE_SEC ? 'hoodie' : 'pajama';
  }

  // ----- weather (Open-Meteo / WMO codes) -----
  function weatherText(code) {
    const c = Number(code);
    if (c === 0) return '맑음';
    if (c <= 2) return '구름 조금';
    if (c === 3) return '흐림';
    if (c === 45 || c === 48) return '안개';
    if (c >= 51 && c <= 57) return '이슬비';
    if (c >= 61 && c <= 67) return '비';
    if (c >= 71 && c <= 77) return '눈';
    if (c >= 80 && c <= 82) return '소나기';
    if (c === 85 || c === 86) return '눈';
    if (c >= 95) return '뇌우';
    return '날씨';
  }
  function umbrella(w) {
    if (!w) return false;
    const wet = (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
    return (w.rainChance != null && w.rainChance >= 50) || wet(Number(w.todayCode)) || wet(Number(w.code));
  }

  // ----- system load -----
  // samples: [{ t, cpu, ram, gpu }] (gpu may be null). rendering = GPU busy for a while
  // while you're away from the keyboard; done = it was rendering and the GPU has gone quiet.
  function sysState(samples, now, idleSec, wasRendering) {
    // rendering = the GPU that renders (the discrete one, when the laptop has two) held at 90%+ for over a minute.
    // An integrated GPU busy with the screen never counts.
    const within = (sec) => samples.filter(s => now - s.t <= sec * 1000);
    const rg = (s) => (s.dgpu != null ? s.dgpu : s.gpu);
    const g90 = within(90).filter(s => rg(s) != null);
    const span = g90.length ? now - g90[0].t : 0;
    const last = samples[samples.length - 1] || {};
    const avg = g90.length ? g90.reduce((a, s) => a + rg(s), 0) / g90.length : 0;
    let render = span >= 75000 && g90.length >= 10 && avg >= 90 && g90.every(s => rg(s) >= 70);
    if (!render && wasRendering && rg(last) != null && rg(last) >= 40) render = true;
    const g20 = within(20).filter(s => rg(s) != null);
    const done = !!wasRendering && !render && g20.length >= 4 && g20.every(s => rg(s) < 25);
    const c60 = within(60).filter(s => s.cpu != null);
    const cspan = c60.length ? now - c60[0].t : 0;
    const cpuAvg = c60.length ? c60.reduce((a, s) => a + s.cpu, 0) / c60.length : 0;
    let strain = null;
    if (cspan >= 50000 && cpuAvg >= 90) strain = 'cpu';
    else if (last.ram != null && last.ram >= 92) strain = 'ram';
    return { render, done, strain };
  }

  const api = { dateKey, dayKey, leftovers, carryOver, dropLeftover, toggleCancel, routineState, strike, tree, kidsOf, durText, whenText, addDays, label, minutes, parseInput, newTask, ensureDay, routinesFor, newRoutine, DEFAULT_ROUTINES, WEEK, setWeek, weatherText, umbrella, sysState, ordered, counts, suggest, migrate, schedule, toggleDone, glyph, line, toPlainText, slot, inWindow, workHours, pose, isOpen };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Logic = api;
})(typeof window !== 'undefined' ? window : globalThis);
