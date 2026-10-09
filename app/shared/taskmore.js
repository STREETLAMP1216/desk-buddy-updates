// The "⋯" panel under a task, shared by the PC app and the phone app:
// change what it is (task / event / memo line), put things under it, say how long it takes or when.
(function (root) {
  const L = root.Logic;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (tag === 'button') e.type = 'button'; return e; };

  // ----- structure -----
  const kids = (day, id) => day.tasks.filter(t => t.parent === id);
  function topBefore(day, t, custom) {
    const tr = L.tree(day.tasks, custom).filter(x => x.depth === 0).map(x => x.t);
    const i = tr.indexOf(t);
    return i > 0 ? tr[i - 1] : null;
  }
  // put `t` (and nothing under it) under `parent`, right after the parent's last sub-item
  function makeChild(day, t, parent) {
    if (!parent || parent === t || parent.parent || kids(day, t.id).length) return false;
    t.parent = parent.id; t.block = parent.block;
    placeAfterFamily(day, t, parent);
    return true;
  }
  function unChild(day, t) {
    const p = day.tasks.find(x => x.id === t.parent);
    delete t.parent;
    if (p) placeAfterFamily(day, t, p);
    return true;
  }
  function placeAfterFamily(day, t, parent) {
    const order = L.ordered(day.tasks, day.customOrder).filter(x => x !== t);
    const fam = order.filter(x => x === parent || x.parent === parent.id);
    const at = order.indexOf(fam[fam.length - 1]) + 1;
    order.splice(at, 0, t);
    day.tasks = order; day.customOrder = true;
  }
  function addChild(day, parent, raw, first) {
    const p = L.parseInput(raw);
    if (!p.text) return null;
    const c = L.newTask(p, new Date());
    c.parent = parent.id; c.block = parent.block;
    day.tasks.push(c);
    if (first) {                                    // the first small step goes right under the task
      const order = L.ordered(day.tasks, day.customOrder).filter(x => x !== c);
      order.splice(order.indexOf(parent) + 1, 0, c);
      day.tasks = order; day.customOrder = true;
    } else placeAfterFamily(day, c, parent);
    return c;
  }
  function remove(day, t) { day.tasks = day.tasks.filter(x => x !== t && x.parent !== t.id); }
  function setBlock(day, t, n) { t.block = n; kids(day, t.id).forEach(c => { c.block = n; }); }

  // ----- the panel -----
  // ctx: { T(s, vars), lang, day, changed(), say(kind) }
  let pending = null;            // the "add under it" box stays open while you type several in a row
  function panel(t, ctx) {
    const { T, day } = ctx;
    const box = el('div', 'more-panel');
    box.addEventListener('click', (e) => e.stopPropagation());
    const row = (label) => { const r = el('div', 'mp-row'); if (label) r.appendChild(el('span', 'mp-label', label)); box.appendChild(r); return r; };
    const btn = (r, text, run, on) => { const b = el('button', on ? 'on' : '', text); b.addEventListener('click', (e) => { e.stopPropagation(); run(); }); r.appendChild(b); return b; };
    const done = () => { pending = null; ctx.changed(); };
    const open = t.status === 'open';

    // fix the wording (Enter or leaving the box saves)
    {
      const f = el('form', 'mp-edit'); f.autocomplete = 'off';
      const i = el('input'); i.type = 'text'; i.value = t.text; i.setAttribute('aria-label', T('내용 고치기')); i.enterKeyHint = 'done';
      const save = () => { const v = i.value.trim(); if (v && v !== t.text) { t.text = v; done(); } };
      f.addEventListener('submit', (e) => { e.preventDefault(); e.stopPropagation(); save(); });
      i.addEventListener('blur', save);
      f.appendChild(i); box.appendChild(f);
    }
    // a line through it: not doing it after all
    if (open || t.status === 'cancelled') {
      const r0 = row(T('취소'));
      btn(r0, t.status === 'cancelled' ? '↺ ' + T('취소선 지우기') : 'S̶ ' + T('취소선 긋기'), () => { L.toggleCancel(day, t.id); done(); }, t.status === 'cancelled');
    }
    // what it is
    if (open) {
      const r = row(T('종류'));
      if (t.kind !== 'task') btn(r, '· ' + T('할 일로'), () => { t.kind = 'task'; done(); });
      if (t.kind !== 'event') btn(r, '○ ' + T('일정으로'), () => { t.kind = 'event'; done(); });
      if (t.kind !== 'note') btn(r, '— ' + T('메모로'), () => { t.kind = 'note'; done(); });
      if (t.kind === 'task') { btn(r, 'u', () => { t.u = !t.u; done(); }, t.u); btn(r, '*', () => { t.star = !t.star; done(); }, t.star); }
    }

    // under it / out from under
    const r2 = row(T('하위'));
    let input = null;
    const ask = (prefix, ph) => {
      if (input) { input.remove(); input = null; }
      const f = el('form', 'mp-add'); f.autocomplete = 'off';
      const i = el('input'); i.type = 'text'; i.placeholder = ph; i.enterKeyHint = 'done';
      const b = el('button', '', T('추가')); b.type = 'submit';
      f.append(i, b);
      f.addEventListener('submit', (e) => { e.preventDefault(); e.stopPropagation(); if (!i.value.trim()) return; addChild(day, t, prefix + i.value, prefix === 'u '); pending = prefix === 'u ' ? null : { id: t.id, prefix, ph }; ctx.changed(); });
      box.appendChild(f); input = f; setTimeout(() => i.focus(), 0);
    };
    if (!t.parent) {
      btn(r2, '↳ ' + T('하위 할 일'), () => ask('', T('하위 할 일 · Enter로 계속 추가')));
      btn(r2, '— ' + T('메모 달기'), () => ask('— ', T('이 할 일에 붙일 메모')));
      const prev = topBefore(day, t, day.customOrder);
      if (prev && !kids(day, t.id).length) btn(r2, '⇥ ' + T('위 항목 아래로'), () => { makeChild(day, t, prev); done(); });
    } else btn(r2, '⇤ ' + T('하위에서 빼기'), () => { unChild(day, t); done(); });

    // planning that makes starting easier: when/where (an if-then plan), and a first step small enough to just do
    if (t.status === 'open' && t.kind !== 'note') {
      const rp = row(T('계획'));
      const f = el('form', 'mp-edit mp-cue'); f.autocomplete = 'off';
      const i = el('input'); i.type = 'text'; i.value = t.cue || ''; i.placeholder = T('언제·어디서? 예: 점심 먹고 책상에 앉으면'); i.enterKeyHint = 'done';
      const save = () => { const v = i.value.trim(); if (v !== (t.cue || '')) { t.cue = v || undefined; done(); } };
      f.addEventListener('submit', (e) => { e.preventDefault(); e.stopPropagation(); save(); });
      i.addEventListener('blur', save);
      f.appendChild(i); rp.appendChild(f);
      if (!t.parent) btn(rp, '✂ ' + T('너무 커? 첫 걸음만'), () => ask('u ', T('5분 안에 끝나는 첫 행동 하나 · 예: 파일 열고 제목 쓰기')));
    }
    // how long / when
    if (t.kind !== 'note') {
      const r3 = row(T('시간'));
      [15, 30, 60, 120].forEach(m => btn(r3, L.durText(m, ctx.lang), () => { t.dur = t.dur === m ? undefined : m; done(); }, t.dur === m));
      const r4 = row('');
      const from = el('input'); from.type = 'time'; from.value = t.time || ''; from.setAttribute('aria-label', T('시작'));
      const to = el('input'); to.type = 'time'; to.value = t.end || ''; to.setAttribute('aria-label', T('끝'));
      const save = () => { t.time = from.value || undefined; t.end = to.value || undefined; if (t.time && t.end && t.end < t.time) t.end = undefined; done(); };
      from.addEventListener('change', save); to.addEventListener('change', save);
      r4.append(from, el('span', 'mp-tilde', '~'), to);
      if (t.dur || t.time || t.end) btn(r4, T('지우기'), () => { t.dur = undefined; t.time = undefined; t.end = undefined; done(); });
    }
    if (pending && pending.id === t.id) ask(pending.prefix, pending.ph);
    return box;
  }
  function close() { pending = null; }

  // tomorrow, written ahead: a folded section at the bottom of today's list (kept or removed here; ticked off tomorrow)
  // ctx: { T, data, key (today), open, toggle(), changed() }
  function tomorrowRows(ctx) {
    const { T } = ctx, tk = L.addDays(ctx.key, 1), d = ctx.data.days && ctx.data.days[tk];
    const items = d ? L.tree(d.tasks || [], d.customOrder).filter(x => x.t.status === 'open') : [];
    if (!items.length) return [];
    const head = el('li', 'sec sec-tmr');
    head.appendChild(document.createTextNode(T('내일 {d} · 미리 적은 {n}개', { d: L.label(tk), n: items.length })));
    const tog = el('button', 'sec-btn', ctx.open ? T('접기') : T('펼치기')); tog.addEventListener('click', ctx.toggle);
    const btns = el('span', 'sec-btns'); btns.appendChild(tog); head.appendChild(btns);
    const out = [head];
    if (ctx.open) items.forEach(({ t, depth }) => {
      const li = el('li', 'task tmr' + (depth ? ' sub' : ''));
      li.appendChild(el('span', 'marks', (t.u ? 'u' : '') + (t.star ? '*' : '')));
      li.appendChild(el('span', 'glyph-s', L.glyph(t)));
      const tx = el('span', 'text');
      const w = L.whenText(t, ctx.lang); if (w) tx.appendChild(el('span', 'when' + (t.time ? ' at' : ''), w));
      tx.appendChild(document.createTextNode(t.text)); li.appendChild(tx);
      const x = el('button', 'tmr-x', '✕'); x.setAttribute('aria-label', T('지우기'));
      x.addEventListener('click', () => { remove(d, t); ctx.changed(); });
      li.appendChild(x); out.push(li);
    });
    return out;
  }

  root.TaskMore = { tomorrowRows, panel, close, makeChild, unChild, addChild, remove, setBlock, kids };
})(typeof window !== 'undefined' ? window : globalThis);
