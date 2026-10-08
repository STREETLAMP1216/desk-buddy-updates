// 책상 친구 — phone version. Same data as the PC app (shared logic.js), kept in sync through sync.js.
(function () {
  const L = window.Logic, S = window.Sync;
  const CHARS = window.Character.CHARACTERS;
  const $ = (id) => document.getElementById(id);
  const STORE = 'desk-buddy-mobile';
  const SYNC_STORE = 'desk-buddy-mobile-sync';
  let LANG = 'ko';
  const T = (s, vars) => window.I18N.t(LANG, s, vars);

  // ---------- data ----------
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    d = d || { settings: {}, days: {}, notes: [] };
    d.settings = d.settings || {}; d.days = d.days || {}; d.notes = d.notes || [];
    return d;
  }
  const data = load();
  function saveLocal() { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {} }
  function persist() { saveLocal(); if (syncer) syncer.soon(2500); }

  const ui = { key: null, view: 'today', blockView: null, leftOpen: false, openActs: null, calMonth: null, calSel: null };
  let CH = CHARS.shiori;
  const dk = (d) => L.dayKey(d || new Date(), data.settings.dayStart || '04:00');
  const today = () => L.ensureDay(data, ui.key);
  const routines = () => data.settings.routines || (data.settings.routines = L.DEFAULT_ROUTINES.map(r => ({ ...r, days: r.days.slice() })));
  const CNT = (day, key) => L.counts(day, L.routinesFor(key || ui.key, routines()));
  const curBlock = () => today().block || 1;

  // ---------- character ----------
  const has = (name) => (window.ASSETS[CH.id] || []).includes(name);
  const A = (name) => `shared/assets/${CH.id}/${name}.png`;
  const charName = (c) => (LANG !== 'ko' && c.names && c.names[LANG]) || c.name;
  const displayName = () => (data.settings.names || {})[CH.id] || charName(CH);
  const MOOD = { nudge: 'neutral', nudgeEmpty: 'puzzled', poke: 'surprised', switchIn: 'neutral', praise: 'smug', praiseAll: 'smug', schedule: 'smug',
    lunch: 'eat', snack: 'eat', dinner: 'eat', morning: 'sleepy', night: 'sleepy', memo: 'calm', migrate: 'calm', back: 'neutral', evening: 'calm' };
  const REACT = { praise: 'cheer', praiseAll: 'done', migrate: 'migrate', schedule: 'migrate', poke: 'poke', nudge: 'nudge', nudgeEmpty: 'nudge',
    lunch: 'meal', dinner: 'meal', snack: 'snack', back: 'back', evening: 'chat', switchIn: 'chat' };
  const CALL_KINDS = new Set(['back', 'nudge', 'nudgeEmpty', 'lunch', 'dinner', 'snack', 'morning', 'evening', 'night']);
  const bags = {};
  function bank(lang) { return (window.LineBanks || {})[`${CH.id}:${lang || LANG}`] || (window.LineBanks || {})[`${CH.id}:ko`] || {}; }
  function line(kind, vars) {
    const b = bank(), pool = (b[kind] && b[kind].length ? b[kind] : bank('ko')[kind]) || [];
    if (!pool.length) return '';
    const k = `${CH.id}:${LANG}:${kind}`;
    if (!bags[k] || !bags[k].length) bags[k] = pool.map((_, i) => i).sort(() => Math.random() - 0.5);
    let s = pool[bags[k].pop() % pool.length];
    Object.entries(Object.assign({ name: displayName() }, vars || {})).forEach(([n, v]) => { s = s.split('{' + n + '}').join(String(v)); });
    const c = callMe();
    if (c && CALL_KINDS.has(kind)) s = s.startsWith('…') ? `${c}… ${s.slice(1).trimStart()}` : `${c}${LANG === 'ja' ? '、' : ', '}${s}`;
    return s;
  }
  function callMe() {
    const c = data.settings.callMe;
    if (!c) return '';
    const CALL = { 야: { en: 'Hey', ja: 'ねえ' }, 저기: { en: 'Psst', ja: 'ちょっと' }, 이봐: { en: 'Yo', ja: 'おい' } };
    if (c !== 'custom') return LANG === 'ko' ? c : ((CALL[c] || {})[LANG] || c);
    const n = (data.settings.callMeName || '').trim(); if (!n) return '';
    const last = n.charCodeAt(n.length - 1);
    if (LANG === 'ko' && last >= 0xAC00 && last <= 0xD7A3) return n + ((last - 0xAC00) % 28 ? '아' : '야');
    return n;
  }

  // which drawing sits in the corner: by time of day, or the reaction to what just happened
  const pose = { react: null, until: 0, blink: false };
  function basePose() {
    const now = new Date(), m = now.getHours() * 60 + now.getMinutes(), st = data.settings;
    const near = (hhmm, before, after) => { if (!hhmm) return false; const t = L.minutes(hhmm); return m >= t - before && m <= t + after; };
    if (near(st.lunch || '12:30', 15, 45) || near(st.dinner || '18:30', 15, 45)) return has('meal') ? 'meal' : 'memo_open';
    if (near(st.snack || '15:30', 10, 25) && has('snack')) return 'snack';
    if (m >= 23 * 60 || m < 5 * 60) return has('pajama') ? 'pajama' : 'memo_open';
    if (m < 10 * 60 && has('morning')) return 'morning';
    return 'memo_open';
  }
  function renderBuddy() {
    let name = Date.now() < pose.until && pose.react && has(pose.react) ? pose.react : basePose();
    if (name === 'memo_open' && pose.blink && has('memo_closed')) name = 'memo_closed';
    const src = A(name);
    if ($('buddyImg').getAttribute('src') !== src) $('buddyImg').src = src;
  }
  function blinkLoop() {
    setTimeout(() => { pose.blink = true; renderBuddy(); setTimeout(() => { pose.blink = false; renderBuddy(); blinkLoop(); }, 160); }, 3500 + Math.random() * 4000);
  }
  function hop() { const b = $('buddy'); b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); }

  // ---------- speech bubble ----------
  let bubbleTimer = null;
  function say(text, opts) {
    opts = opts || {};
    if (!text) return;
    const kind = opts.kind;
    $('bubbleText').textContent = text;
    const face = kind && MOOD[kind] ? `face_${MOOD[kind]}` : null;
    if (face && has(face) && !(kind && REACT[kind] && has(REACT[kind]))) { $('bubbleFace').src = A(face); $('bubbleFace').hidden = false; } else $('bubbleFace').hidden = true;
    const bb = $('bubbleButtons'); bb.innerHTML = '';
    (opts.buttons || []).forEach(b => {
      const el = document.createElement('button'); el.type = 'button'; el.textContent = b.label; if (b.primary) el.className = 'primary';
      el.addEventListener('click', (e) => { e.stopPropagation(); hideBubble(); if (b.run) b.run(); });
      bb.appendChild(el);
    });
    $('bubble').hidden = false;
    if (kind && REACT[kind]) { pose.react = REACT[kind]; pose.until = Date.now() + 5000; renderBuddy(); setTimeout(renderBuddy, 5100); }
    clearTimeout(bubbleTimer);
    if (!(opts.buttons && opts.buttons.length)) bubbleTimer = setTimeout(hideBubble, Math.max(4500, text.length * 140));
  }
  const sayKind = (kind, vars, opts) => say(line(kind, vars), Object.assign({ kind }, opts || {}));
  function hideBubble() { clearTimeout(bubbleTimer); $('bubble').hidden = true; }
  $('bubble').addEventListener('click', () => { if (!$('bubbleButtons').children.length) hideBubble(); });
  $('buddyImg').addEventListener('click', () => {
    if (!$('bubble').hidden && $('bubbleButtons').children.length) return;
    hop();
    const t = L.suggest(today());
    if (t && Math.random() < 0.6) sayKind('nudge', { task: t.text });
    else sayKind('poke');
  });

  // first time today / coming back: one line that fits the hour
  function greet() {
    const fired = today().fired;
    const h = new Date().getHours();
    const slot = h < 11 ? 'morning' : h >= 22 || h < 4 ? 'night' : h >= 18 ? 'evening' : 'back';
    if (!fired.mGreet) { fired.mGreet = true; saveLocal(); return setTimeout(() => sayKind(slot), 700); }
    const c = CNT(today());
    if (Math.random() < 0.5) setTimeout(() => (c.open ? sayKind('back') : c.done ? sayKind('praiseAll') : sayKind(slot)), 700);
  }

  // ---------- theme & language ----------
  function applyTheme() {
    const t = CH.theme || {}, r = document.documentElement.style;
    r.setProperty('--mint', t.mint); r.setProperty('--mint-deep', t.deep); r.setProperty('--mint-hover', t.hover);
    r.setProperty('--soft', t.soft); r.setProperty('--line', t.line);
    document.querySelector('meta[name=theme-color]').content = t.soft || '#F2F7F4';
  }
  function applyLang() {
    LANG = ['ko', 'en', 'ja'].includes(data.settings.lang) ? data.settings.lang : 'ko';
    document.documentElement.lang = LANG;
    window.I18N.translateDom(document.body, LANG);
    L.setWeek(window.I18N.week(LANG));
  }
  function setCharacter(id, quiet) {
    CH = CHARS[id] || CHARS.shiori;
    applyTheme(); renderBuddy(); renderCharPick();
    if (!quiet) { hop(); sayKind('switchIn'); }
  }

  // ---------- today ----------
  function header() {
    $('dayLabel').textContent = { cal: T('달력'), notes: T('메모'), set: T('설정') }[ui.view] || L.label(ui.key);
    const c = CNT(today());
    $('dayCount').textContent = ui.view === 'notes' ? T('메모 {n}개', { n: notes().filter(n => (n.text || '').trim()).length })
      : ui.view === 'set' ? '' : c.total ? T('{a} / {b} 끝 · 남은 거 {n}개', { a: c.done, b: c.total, n: c.open }) : T('아직 적은 게 없어요');
  }
  function blockGlyph(t) { return L.glyph(t); }
  function renderBlocks() {
    const box = $('blocks'), d = today(), cur = curBlock();
    $('blockNow').textContent = T('현재 블럭 {n}', { n: cur });
    $('blockPrev').disabled = cur <= 1; $('blockNext').disabled = cur >= 6;
    box.innerHTML = ''; box.classList.toggle('by-block', ui.blockView === 'byBlock');
    for (let n = 1; n <= 6; n++) {
      const cell = document.createElement('button'); cell.type = 'button';
      cell.className = 'block' + (n === cur ? ' cur' : '') + (n < cur ? ' past' : '') + (ui.blockView === n ? ' focus' : '');
      const num = document.createElement('span'); num.className = 'bn'; num.textContent = n; cell.appendChild(num);
      const gl = document.createElement('span'); gl.className = 'bg';
      L.routinesFor(ui.key, routines()).filter(r => r.block === n).forEach(r => {
        const s = document.createElement('i'), dn = !!d.routines[r.id]; s.textContent = dn ? 'X' : '·'; s.className = 'g-routine' + (dn ? ' g-done' : ''); gl.appendChild(s);
      });
      L.ordered(d.tasks, d.customOrder).filter(t => t.block === n && (t.kind === 'task' || t.kind === 'event')).forEach(t => {
        const s = document.createElement('i'); s.textContent = blockGlyph(t); s.className = 'g-' + (t.kind === 'event' ? 'event' : t.status); gl.appendChild(s);
      });
      cell.appendChild(gl);
      cell.addEventListener('click', (e) => { e.stopPropagation(); ui.blockView = ui.blockView === n ? null : n; renderToday(); });
      box.appendChild(cell);
    }
  }
  $('blocks').addEventListener('click', () => { ui.blockView = ui.blockView === 'byBlock' ? null : 'byBlock'; renderToday(); });
  function setBlock(n) { today().block = Math.max(1, Math.min(6, n)); persist(); renderToday(); }
  $('blockPrev').addEventListener('click', () => setBlock(curBlock() - 1));
  $('blockNext').addEventListener('click', () => {
    const d = today(), cur = curBlock();
    const left = d.tasks.filter(t => t.block === cur && t.kind === 'task' && t.status === 'open');
    if (!left.length) return setBlock(cur + 1);
    say(T('{n}블럭에 남은 거 {c}개, 다음 블럭으로 옮길까?', { n: cur, c: left.length }), { kind: 'migrate', buttons: [
      { label: T('옮기고 넘어가기'), primary: true, run: () => { left.forEach(t => { t.block = cur + 1; }); setBlock(cur + 1); } },
      { label: T('그냥 넘어가기'), run: () => setBlock(cur + 1) },
      { label: T('취소') }
    ] });
  });
  function checkBlockDone() {
    const d = today(), cur = curBlock();
    const inBlock = d.tasks.filter(t => t.block === cur && t.kind === 'task').map(t => t.status)
      .concat(L.routinesFor(ui.key, routines()).filter(r => r.block === cur).map(r => (d.routines[r.id] ? 'done' : 'open')));
    if (!inBlock.length || inBlock.includes('open') || !inBlock.includes('done') || cur >= 6) return;
    if (d.fired['block' + cur]) return;
    d.fired['block' + cur] = true; saveLocal();
    setTimeout(() => say(T('{n}블럭 다 끝냈어. 다음 블럭으로 넘어갈까?', { n: cur }), { kind: 'praiseAll', buttons: [
      { label: T('{n}블럭으로', { n: cur + 1 }), primary: true, run: () => setBlock(cur + 1) }, { label: T('조금 더') }
    ] }), 2200);
  }
  function praise() {
    const c = CNT(today()); hop();
    if (c.open === 0 && c.done > 0) sayKind('praiseAll'); else sayKind('praise', { count: c.done, left: c.open });
  }
  function carry(fromKey, id) {
    if (!L.carryOver(data, fromKey, id, ui.key)) return;
    const d = today(), nt = d.tasks[d.tasks.length - 1]; if (nt) nt.block = curBlock();
  }

  function renderToday() {
    header();
    const day = today(), list = $('taskList'); list.innerHTML = '';
    const left = L.leftovers(data, ui.key, 14);
    if (left.length) {
      const head = document.createElement('li'); head.className = 'sec sec-left';
      head.append(document.createTextNode(T('지난 날 남은 거 {n}개', { n: left.length })));
      const btns = document.createElement('span'); btns.className = 'sec-btns';
      const tog = mk('button', 'sec-btn', ui.leftOpen ? T('접기') : T('펼치기')); tog.addEventListener('click', () => { ui.leftOpen = !ui.leftOpen; renderToday(); });
      const all = mk('button', 'sec-btn', T('모두 오늘로')); all.addEventListener('click', () => { left.forEach(x => carry(x.key, x.task.id)); persist(); renderToday(); sayKind('migrate'); });
      btns.append(tog, all); head.appendChild(btns); list.appendChild(head);
      if (ui.leftOpen) left.forEach(({ key, task }) => {
        const li = mk('li', 'task leftover');
        li.appendChild(mk('span', 'marks', (task.u ? 'u' : '') + (task.star ? '*' : '')));
        li.appendChild(mk('span', 'glyph-s', L.glyph(task)));
        const tx = mk('span', 'text', task.text); tx.appendChild(mk('span', 'from', L.label(key))); li.appendChild(tx);
        const a = mk('span', 'lacts');
        const back = mk('button', '', '↩'); back.setAttribute('aria-label', T('오늘 할 일로')); back.addEventListener('click', () => { carry(key, task.id); persist(); renderToday(); });
        const del = mk('button', '', '✕'); del.setAttribute('aria-label', T('지우기')); del.addEventListener('click', () => { L.dropLeftover(data, key, task.id); persist(); renderToday(); });
        a.append(back, del); li.appendChild(a); list.appendChild(li);
      });
    }
    const v = ui.blockView;
    const items = L.routinesFor(ui.key, routines()).map(r => ({ r, block: r.block }))
      .concat(L.ordered(day.tasks, day.customOrder).map(t => ({ t, block: t.block })));
    const bnum = (x) => x.block || 7;
    let shown = items;
    if (v === 'byBlock') shown = items.map((x, i) => ({ x, i })).sort((a, b) => bnum(a.x) - bnum(b.x) || a.i - b.i).map(y => y.x);
    else if (typeof v === 'number') {
      shown = items.map((x, i) => ({ x, i, k: x.block === v ? 0 : 1 })).sort((a, b) => a.k - b.k || a.i - b.i).map(y => y.x);
      list.appendChild(mk('li', 'sec', T('{n}블럭', { n: v }) + (v === curBlock() ? ' · ' + T('지금 블럭') : '')));
    }
    if (!day.tasks.length && !items.length) list.appendChild(mk('li', 'empty', T('수첩에 적은 할 일을 여기도 적어 두면, PC에서도 같이 보여요. 5분짜리는 앞에 u.')));
    let lastB = null;
    shown.forEach(x => {
      if (v === 'byBlock' && bnum(x) !== lastB) {
        lastB = bnum(x);
        list.appendChild(mk('li', 'sec', lastB === 7 ? T('블럭 없음') : T('{n}블럭', { n: lastB }) + (lastB === curBlock() ? ' · ' + T('지금 블럭') : '')));
      }
      const row = x.r ? routineRow(x.r, day) : taskRow(x.t, day);
      if (typeof v === 'number' && x.block !== v) row.classList.add('dim');
      list.appendChild(row);
    });
    renderBlocks();
    checkBlockDone();
  }
  function mk(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (tag === 'button') e.type = 'button'; return e; }

  function routineRow(r, day) {
    const done = !!day.routines[r.id];
    const li = mk('li', 'task routine-row' + (done ? ' done' : ''));
    li.appendChild(mk('span', 'marks'));
    const bk = mk('button', 'blk' + (r.block ? '' : ' none'), r.block || '–'); bk.setAttribute('aria-label', T('블럭 고르기'));
    bk.addEventListener('click', () => { ui.openActs = ui.openActs === 'r:' + r.id ? null : 'r:' + r.id; renderToday(); });
    li.appendChild(bk);
    const g = mk('button', 'glyph' + (done ? ' done' : ''), done ? 'X' : '·');
    g.addEventListener('click', () => { day.routines[r.id] = !day.routines[r.id]; if (!day.routines[r.id]) delete day.routines[r.id]; persist(); renderToday(); if (day.routines[r.id]) praise(); });
    li.appendChild(g);
    li.appendChild(mk('span', 'text', r.label));
    if (ui.openActs === 'r:' + r.id) {
      li.classList.add('open-acts');
      const acts = mk('div', 'acts'), row = mk('div', 'blkrow');
      [1, 2, 3, 4, 5, 6, 0].forEach(n => {
        const b = mk('button', (r.block || 0) === n ? 'on' : '', n || '–');
        b.addEventListener('click', () => { const x = routines().find(y => y.id === r.id); if (x) x.block = n || undefined; ui.openActs = null; persist(); renderToday(); });
        row.appendChild(b);
      });
      acts.appendChild(row); li.appendChild(acts);
    }
    return li;
  }

  function taskRow(t, day) {
    const li = mk('li', `task ${t.status}${t.kind !== 'task' ? ' ' + t.kind : ''}`);
    li.appendChild(mk('span', 'marks', (t.u ? 'u' : '') + (t.star ? '*' : '')));
    const bk = mk('button', 'blk' + (t.block ? '' : ' none'), t.block || '–'); bk.setAttribute('aria-label', T('블럭 고르기'));
    bk.addEventListener('click', () => toggleActs(t.id));
    li.appendChild(bk);
    const g = mk('button', 'glyph' + (t.status === 'done' ? ' done' : ''), L.glyph(t));
    g.disabled = !(t.kind === 'task' && (t.status === 'open' || t.status === 'done'));
    g.addEventListener('click', () => { const st = L.toggleDone(today(), t.id); persist(); renderToday(); if (st === 'done') praise(); });
    li.appendChild(g);
    const tx = mk('span', 'text');
    if (t.time) tx.appendChild(mk('span', 'time', t.time));
    tx.appendChild(document.createTextNode(t.text));
    if (t.status === 'scheduled' && t.to) tx.appendChild(document.createTextNode(`  → ${L.label(t.to)}`));
    if (t.status === 'migrated') tx.appendChild(document.createTextNode('  → ' + T('내일')));
    if (t.from) tx.appendChild(mk('span', 'from', T('({d}에서)', { d: L.label(t.from) })));
    tx.addEventListener('click', () => toggleActs(t.id));
    li.appendChild(tx);
    const more = mk('button', 'more', '⋯'); more.setAttribute('aria-label', T('더 보기')); more.addEventListener('click', () => toggleActs(t.id));
    li.appendChild(more);
    if (ui.openActs === t.id) { li.classList.add('open-acts'); li.appendChild(taskActs(t, day)); }
    return li;
  }
  function toggleActs(id) { ui.openActs = ui.openActs === id ? null : id; renderToday(); }
  function taskActs(t, day) {
    const acts = mk('div', 'acts');
    const btn = (label, run, cls) => { const b = mk('button', cls || '', label); b.addEventListener('click', run); acts.appendChild(b); return b; };
    const done = () => { ui.openActs = null; persist(); renderToday(); };
    const row = mk('div', 'blkrow');
    [1, 2, 3, 4, 5, 6, 0].forEach(n => {
      const b = mk('button', (t.block || 0) === n ? 'on' : '', n || '–');
      b.addEventListener('click', () => { t.block = n || undefined; done(); });
      row.appendChild(b);
    });
    acts.appendChild(row);
    if (t.kind === 'task' && t.status === 'open') {
      btn('> ' + T('내일로'), () => { L.migrate(data, ui.key, t.id); done(); sayKind('migrate'); });
      const date = document.createElement('input'); date.type = 'date'; date.min = L.addDays(ui.key, 1);
      date.addEventListener('change', () => { if (!date.value) return; L.schedule(data, ui.key, t.id, date.value); done(); sayKind('schedule', { date: L.label(date.value) }); });
      acts.appendChild(date);
      btn('< ' + T('날짜로'), () => { try { date.showPicker(); } catch (e) { date.focus(); date.click(); } });
    }
    if ((t.kind === 'task' || t.kind === 'event') && t.status === 'open') {
      btn(t.kind === 'task' ? '○ ' + T('일정으로') : '· ' + T('할 일로'), () => { t.kind = t.kind === 'task' ? 'event' : 'task'; done(); });
    }
    btn('u', () => { t.u = !t.u; done(); }, t.u ? 'on' : '');
    btn('*', () => { t.star = !t.star; done(); }, t.star ? 'on' : '');
    const i = day.tasks.indexOf(t);
    btn('↑', () => move(day, t, -1)); btn('↓', () => move(day, t, 1));
    btn('✕ ' + T('지우기'), () => { day.tasks = day.tasks.filter(x => x !== t); done(); }, 'danger');
    return acts;
  }
  // move within your own order (the same list the PC drags)
  function move(day, t, dir) {
    const order = L.ordered(day.tasks, day.customOrder);
    const i = order.indexOf(t), j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    day.tasks = order; day.customOrder = true; persist(); renderToday();
  }

  $('addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = L.parseInput($('addInput').value);
    if (!p.text) return;
    const nt = L.newTask(p, new Date()); nt.block = typeof ui.blockView === 'number' ? ui.blockView : curBlock();
    today().tasks.push(nt);
    $('addInput').value = '';
    persist(); renderToday();
    const list = $('views'); setTimeout(() => { list.scrollTop = list.scrollHeight; }, 0);
  });

  // ---------- memos ----------
  const notes = () => data.notes || (data.notes = []);
  const noteTitle = (n) => ((n.text || '').split('\n').find(s => s.trim()) || '').trim();
  function stampTime(t) { if (!t) return ''; const d = new Date(t), p = (x) => String(x).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; }
  function renderNotes() {
    header();
    const box = $('noteList'); box.innerHTML = '';
    const list = notes().filter(n => n.pinned).concat(notes().filter(n => !n.pinned));
    if (!list.length) box.appendChild(mk('p', 'sub', T('아직 메모가 없어요. + 새 메모로 시작해요.')));
    list.forEach(n => {
      const c = mk('button', 'memo' + (n.pinned ? ' pinned' : ''));
      const t = mk('div', 't'); if (n.pinned) t.appendChild(mk('span', 'pin-i', '📌')); t.appendChild(document.createTextNode(noteTitle(n) || T('(빈 메모)')));
      const rest = (n.text || '').split('\n').filter(s => s.trim()).slice(1).join(' ');
      c.append(t); if (rest) c.appendChild(mk('div', 'p', rest)); c.appendChild(mk('div', 'w', stampTime(n.updated)));
      c.addEventListener('click', () => openNote(n));
      box.appendChild(c);
    });
  }
  $('noteNew').addEventListener('click', () => {
    const n = { id: 'n' + Date.now().toString(36), text: '', updated: Date.now() };
    notes().unshift(n); openNote(n, true);
  });
  let editing = null;
  function openNote(n, isNew) {
    editing = n;
    const body = $('sheetBody'); body.innerHTML = '';
    const ed = mk('div', 'editor'), bar = mk('div', 'bar');
    const left = mk('span'), right = mk('span');
    const close = mk('button', 'pill', T('완료'));
    const pin = mk('button', 'ghost', n.pinned ? T('고정 풀기') : T('위에 고정'));
    const del = mk('button', 'ghost', T('지우기')); del.style.color = '#A94234';
    left.append(pin, del); right.append(close); bar.append(left, right);
    const ta = document.createElement('textarea'); ta.value = n.text || ''; ta.placeholder = T('첫 줄은 제목');
    let tmr = null;
    ta.addEventListener('input', () => { n.text = ta.value; n.updated = Date.now(); clearTimeout(tmr); tmr = setTimeout(persist, 600); });
    pin.addEventListener('click', () => { n.pinned = !n.pinned; pin.textContent = n.pinned ? T('고정 풀기') : T('위에 고정'); persist(); });
    del.addEventListener('click', () => {
      if ((n.text || '').trim() && !del.dataset.sure) { del.dataset.sure = '1'; del.textContent = T('정말 지울까?'); setTimeout(() => { delete del.dataset.sure; del.textContent = T('지우기'); }, 2500); return; }
      data.notes = notes().filter(x => x !== n); closeSheet(true);
    });
    close.addEventListener('click', () => closeSheet());
    ed.append(bar, ta); body.appendChild(ed);
    $('sheet').hidden = false;
    if (isNew) setTimeout(() => ta.focus(), 50);
  }
  function closeSheet(deleted) {
    const n = editing; editing = null;
    if (n && !deleted && !(n.text || '').trim()) data.notes = notes().filter(x => x !== n);   // empty memo: don't keep it
    else if (n && !deleted && (n.text || '').trim()) sayKind('memo');
    $('sheet').hidden = true; persist(); renderNotes();
  }
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });

  // ---------- calendar ----------
  function renderCal() {
    header();
    const [y, m] = ui.calMonth.split('-').map(Number);
    $('calTitle').textContent = `${y}. ${m}`;
    const grid = $('calGrid'); grid.innerHTML = '';
    L.WEEK.forEach((w, i) => grid.appendChild(mk('span', 'wd' + (i === 0 ? ' sun' : i === 6 ? ' sat' : ''), w)));
    const first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(document.createElement('span'));
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const day = data.days[key], ts = day ? (day.tasks || []).filter(t => t.kind === 'task') : [];
      const done = ts.filter(t => t.status === 'done').length, open = ts.filter(t => t.status === 'open').length;
      const evs = day ? (day.tasks || []).filter(t => t.kind === 'event').sort((a, b) => (a.time || '99').localeCompare(b.time || '99')) : [];
      const c = mk('button', 'cd' + (key === ui.key ? ' today' : '') + (key === ui.calSel ? ' sel' : '') + (open && key < ui.key ? ' left' : ''));
      c.appendChild(mk('span', 'n', d));
      c.appendChild(mk('span', 'dots', ts.length ? `${done}/${ts.length}` : ''));
      if (evs.length) c.appendChild(mk('span', 'ev1', '○' + (evs[0].text || '').slice(0, 4) + (evs.length > 1 ? '+' + (evs.length - 1) : '')));
      c.addEventListener('click', () => { ui.calSel = key; renderCal(); });
      grid.appendChild(c);
    }
    const box = $('calDay'); box.innerHTML = '';
    const key = ui.calSel, day = data.days[key];
    const head = mk('div', 'cal-dh', L.label(key) + (key === ui.key ? ' · ' + T('오늘') : ''));
    if (key === ui.key) { const go = mk('button', 'pill', T('할 일 열기')); go.addEventListener('click', () => showView('today')); head.appendChild(go); }
    box.appendChild(head);
    const ul = mk('ul', 'cal-list');
    const all = day ? L.ordered(day.tasks || [], day.customOrder) : [];
    const items = all.filter(t => t.kind === 'event').sort((a, b) => (a.time || '99').localeCompare(b.time || '99')).concat(all.filter(t => t.kind !== 'event'));
    if (!items.length) ul.appendChild(mk('li', 'dim', T('적은 게 없어요')));
    items.forEach(t => {
      const li = mk('li', 's-' + t.status + (t.kind === 'event' ? ' ev' : ''));
      li.appendChild(mk('span', 'g', L.glyph(t)));
      li.appendChild(mk('span', 'x', `${t.time ? t.time + '  ' : ''}${t.u ? 'u ' : ''}${t.star ? '* ' : ''}${t.text}`));
      if ((key > ui.key && t.status === 'open') || t.kind === 'event') {
        const x = mk('button', '', '✕'); x.setAttribute('aria-label', T('지우기'));
        x.addEventListener('click', () => { day.tasks = day.tasks.filter(z => z !== t); persist(); renderCal(); });
        li.appendChild(x);
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    const f = mk('form', 'cal-add'); f.autocomplete = 'off';
    const kind = document.createElement('select');
    [['event', T('일정')], ['task', T('할 일')]].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; kind.appendChild(o); });
    if (key < ui.key) kind.disabled = true;
    kind.value = ui.calKind && key >= ui.key ? ui.calKind : 'event';
    const tm = document.createElement('input'); tm.type = 'time';
    const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = T('이 날에 추가');
    const b = mk('button', '', T('추가')); b.type = 'submit';
    const syncKind = () => { tm.hidden = kind.value !== 'event'; };
    kind.addEventListener('change', () => { ui.calKind = kind.value; syncKind(); }); syncKind();
    f.append(kind, tm, inp, b);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = L.parseInput(inp.value); if (!p.text) return;
      if (kind.value === 'event') p.kind = 'event';
      const nt = L.newTask(p, new Date());
      if (p.kind === 'event' && tm.value) nt.time = tm.value;
      L.ensureDay(data, key).tasks.push(nt); persist(); renderCal();
    });
    box.appendChild(f);
  }
  $('calPrev').addEventListener('click', () => { ui.calMonth = shiftMonth(ui.calMonth, -1); renderCal(); });
  $('calNext').addEventListener('click', () => { ui.calMonth = shiftMonth(ui.calMonth, 1); renderCal(); });
  function shiftMonth(ym, n) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

  // ---------- settings ----------
  function renderCharPick() {
    const box = $('charPick'); box.innerHTML = '';
    Object.values(CHARS).forEach(c => {
      const b = mk('button', c.id === CH.id ? 'on' : '');
      const im = document.createElement('img'); im.src = `shared/assets/icon_${c.id}.png`; im.alt = '';
      b.append(im, document.createTextNode((data.settings.names || {})[c.id] || charName(c)));
      b.addEventListener('click', () => { if (c.id === CH.id) return; data.settings.character = c.id; persist(); setCharacter(c.id); });
      box.appendChild(b);
    });
  }
  function fillSettings() {
    $('setLang').value = LANG;
    $('setCallMe').value = data.settings.callMe || '';
    $('setCallMeName').value = data.settings.callMeName || '';
    $('callMeNameRow').hidden = data.settings.callMe !== 'custom';
    $('setDayStart').value = data.settings.dayStart || '04:00';
    $('syncServer').value = data.settings.syncServer || '';
    $('syncServer').placeholder = S.DEFAULT_SERVER || 'https://….workers.dev';
    renderRoutineEditor(); renderCharPick(); renderSync();
  }
  $('setLang').addEventListener('change', () => { data.settings.lang = $('setLang').value; persist(); location.reload(); });
  $('setCallMe').addEventListener('change', () => { data.settings.callMe = $('setCallMe').value; $('callMeNameRow').hidden = data.settings.callMe !== 'custom'; persist(); });
  $('setCallMeName').addEventListener('change', () => { data.settings.callMeName = $('setCallMeName').value.trim(); persist(); });
  $('setDayStart').addEventListener('change', () => { data.settings.dayStart = $('setDayStart').value || '04:00'; persist(); refreshDay(); });
  function renderRoutineEditor() {
    const ul = $('routineEditor'); ul.innerHTML = '';
    routines().forEach(r => {
      const li = mk('li');
      li.appendChild(mk('span', 'rl', r.label));
      const del = mk('button', 'del', '✕'); del.setAttribute('aria-label', T('지우기'));
      del.addEventListener('click', () => { data.settings.routines = routines().filter(x => x !== r); persist(); renderRoutineEditor(); });
      li.appendChild(del);
      const days = mk('div', 'days');
      L.WEEK.forEach((w, i) => {
        const b = mk('button', (r.days || []).includes(i) ? 'on' : '', w);
        b.addEventListener('click', () => { const s = new Set(r.days || []); s.has(i) ? s.delete(i) : s.add(i); r.days = [...s].sort(); persist(); renderRoutineEditor(); });
        days.appendChild(b);
      });
      li.appendChild(days); ul.appendChild(li);
    });
  }
  $('routineAdd').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('routineInput').value.trim(); if (!v) return;
    routines().push(L.newRoutine(v)); $('routineInput').value = ''; persist(); renderRoutineEditor();
  });

  // ---------- sync ----------
  let syncer = null;
  const server = () => (data.settings.syncServer || S.DEFAULT_SERVER || '').trim();
  function renderSync(note) {
    const st = syncer ? syncer.state() : {}, on = !!st.code;
    $('syncOff').hidden = on; $('syncOn').hidden = !on;
    $('syncCode').textContent = st.code || '';
    const pad = (n) => String(n).padStart(2, '0'), last = st.last ? new Date(st.last) : null;
    $('syncStatus').textContent = st.error ? T('동기화 실패: {e}', { e: st.error })
      : last ? T('마지막 동기화 {t}', { t: `${last.getMonth() + 1}/${last.getDate()} ${pad(last.getHours())}:${pad(last.getMinutes())}` }) : T('동기화 중…');
    $('syncNote').textContent = typeof note === 'string' ? note : '';
    const dot = $('syncDot');
    dot.className = 'sync-dot' + (!on ? '' : st.error ? ' err' : st.last ? ' ok' : ' busy');
  }
  function afterRemote() {
    saveLocal();
    const lang = ['ko', 'en', 'ja'].includes(data.settings.lang) ? data.settings.lang : 'ko';
    if (lang !== LANG) { location.reload(); return; }
    if (data.settings.character && data.settings.character !== CH.id) setCharacter(data.settings.character, true);
    refreshDay(true);
    if (ui.view === 'set' && !document.activeElement.closest('#setView')) fillSettings();
  }
  function startSync() {
    syncer = S.create({
      server,
      getData: () => data,
      changed: afterRemote,
      loadState: () => { try { return JSON.parse(localStorage.getItem(SYNC_STORE) || 'null'); } catch (e) { return null; } },
      saveState: (st) => { try { localStorage.setItem(SYNC_STORE, JSON.stringify(st)); } catch (e) {} },
      onStatus: () => renderSync()
    });
    $('syncJoin').addEventListener('submit', (e) => { e.preventDefault(); join($('syncJoinInput').value); });
    $('syncStart').addEventListener('click', () => { if (!server()) return needServer(); syncer.start(); renderSync(); });
    $('syncNow').addEventListener('click', () => { $('syncStatus').textContent = T('동기화 중…'); syncer.now(); });
    $('syncStop').addEventListener('click', () => { if (confirm(T('연동을 끊을까요? 이 기기의 데이터는 그대로 남아요.'))) { syncer.stop(); renderSync(); } });
    $('syncServer').addEventListener('change', () => { data.settings.syncServer = $('syncServer').value.trim(); saveLocal(); syncer.now(); });
    $('syncDot').addEventListener('click', () => { if (syncer.state().code) syncer.now(); showView('set'); });
    checkHash();
    window.addEventListener('hashchange', checkHash);
    renderSync();
    syncer.now();
    setInterval(() => { if (document.visibilityState === 'visible') syncer.now(); }, 30000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { refreshDay(); syncer.now(); } else syncer.now(); });
  }
  // opened from the QR code on the PC: #join=CODE
  function checkHash() {
    const m = location.hash.match(/join=([A-Za-z0-9-]+)/);
    if (m) {
      history.replaceState(null, '', location.pathname + location.search);
      const code = S.cleanCode(m[1]);
      if (code && syncer.state().code !== code) {
        if (!syncer.state().code) join(code, true);
        else say(T('PC의 다른 연동 코드로 바꿀까?'), { buttons: [{ label: T('바꾸기'), primary: true, run: () => join(code, true) }, { label: T('취소') }] });
      }
    }
  }
  function needServer() { renderSync(T('서버 주소가 아직 없어요')); $('syncServer').closest('details').open = true; }
  function join(code, fromLink) {
    if (!server()) return needServer();
    const p = syncer.join(code);
    if (!p) return renderSync(T('코드가 16자리가 아니에요'));
    $('syncJoinInput').value = '';
    renderSync();
    p.then(() => { if (!syncer.state().error) { hop(); say(T('PC랑 연결됐어. 이제 어디서 적어도 같이 보여.'), { kind: 'praise' }); } });
  }

  // ---------- views ----------
  function showView(v) {
    ui.view = v;
    ['today', 'notes', 'cal', 'set'].forEach(x => { $(x + 'View').hidden = x !== v; });
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    $('addForm').hidden = v !== 'today';
    document.body.classList.toggle('no-add', v !== 'today');
    if (v === 'today') renderToday();
    if (v === 'notes') renderNotes();
    if (v === 'cal') { if (!ui.calSel) ui.calSel = ui.key; renderCal(); }
    if (v === 'set') { header(); fillSettings(); }
    $('views').scrollTop = 0;
  }
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  function refreshDay(soft) {
    const k = dk();
    if (k !== ui.key) { ui.key = k; ui.calSel = k; ui.calMonth = k.slice(0, 7); }
    L.ensureDay(data, ui.key);
    if (ui.view === 'today') renderToday();
    else if (ui.view === 'notes' && !editing) renderNotes();
    else if (ui.view === 'cal' && !(document.activeElement && document.activeElement.closest('#calView'))) renderCal();
    else header();
    renderBuddy();
  }

  // ---------- start ----------
  LANG = ['ko', 'en', 'ja'].includes(data.settings.lang) ? data.settings.lang : 'ko';
  applyLang();
  CH = CHARS[data.settings.character] || CHARS.shiori;
  applyTheme();
  ui.key = dk(); ui.calSel = ui.key; ui.calMonth = ui.key.slice(0, 7);
  L.ensureDay(data, ui.key);
  $('verLabel').textContent = window.MOBILE_VERSION ? 'v' + window.MOBILE_VERSION : '';
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) $('installHint').hidden = true;
  showView('today');
  renderBuddy(); blinkLoop();
  setInterval(() => refreshDay(), 60000);
  startSync();
  greet();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__m = { data, ui, say, showView, get syncer() { return syncer; } };
})();
