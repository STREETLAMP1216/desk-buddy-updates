// PC <-> phone sync, shared by the desktop app and the mobile web app.
// The data is flattened into small entries ("t|2026-10-08|<taskId>" -> task) that each carry the time they last
// changed; two copies are merged entry by entry (newest wins, deletions are kept as empty entries for a while).
// Everything is encrypted with a key made from the sync code before it leaves the device.
(function (root) {
  const KEEP_DAYS = 60;          // days older than this aren't synced (they stay where they are)
  const TOMB_DAYS = 45;          // how long a deletion is remembered
  const SETTINGS = ['routines', 'alarms', 'dayStart', 'character', 'names', 'callMe', 'callMeName', 'lang',
    'lunch', 'snack', 'dinner', 'wrapUp', 'workStart', 'workEnd'];
  const DEFAULT_SERVER = '';                          // the shared sync server (Cloudflare Worker)
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I

  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function minKey(now) { return dateKey(new Date((now || Date.now()) - KEEP_DAYS * 86400000)); }

  // stable JSON (sorted keys) so the same value always compares equal
  function stable(v) {
    if (v === undefined) return 'null';
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const empty = (v) => v == null || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);

  // ----- data <-> flat map of values -----
  function flatten(data, min) {
    const out = {};
    const days = data.days || {};
    Object.keys(days).forEach(k => {
      if (k < min) return;
      const d = days[k] || {};
      const tasks = d.tasks || [];
      tasks.forEach(t => { if (t && t.id) out[`t|${k}|${t.id}`] = t; });
      if (tasks.length) out[`o|${k}`] = tasks.map(t => t.id);
      Object.keys(d.routines || {}).forEach(r => { if (d.routines[r]) out[`r|${k}|${r}`] = d.routines[r]; });
      if (d.block && d.block !== 1) out[`b|${k}`] = d.block;
      if (d.customOrder) out[`c|${k}`] = true;
    });
    const notes = data.notes || [];
    notes.forEach(n => { if (n && n.id) out[`n|${n.id}`] = n; });
    if (notes.length) out['o|notes'] = notes.map(n => n.id);
    const s = data.settings || {};
    SETTINGS.forEach(k => { if (!empty(s[k])) out[`s|${k}`] = s[k]; });
    return out;
  }

  // entries: { key: { v, t } }  (v === null means deleted)
  function stamp(values, snap, now, min) {
    const out = {};
    Object.keys(values).forEach(k => {
      const prev = snap[k];
      const v = clone(values[k]);
      out[k] = prev && prev.v !== null && stable(prev.v) === stable(v) ? { v, t: prev.t } : { v, t: now };
    });
    Object.keys(snap).forEach(k => {
      if (out[k]) return;
      const prev = snap[k], day = dayOf(k);
      if (day && day < min) return;                                   // fell out of the window: just forget it
      if (prev.v === null) { if (now - prev.t < TOMB_DAYS * 86400000) out[k] = prev; return; }
      out[k] = { v: null, t: now };                                   // was there, now gone -> deleted here
    });
    return out;
  }
  function dayOf(k) { const p = k.split('|'); return p[0] === 't' || p[0] === 'o' && p[1] !== 'notes' || p[0] === 'r' || p[0] === 'b' || p[0] === 'c' ? p[1] : null; }

  function merge(a, b) {
    const out = {};
    new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => {
      const x = a[k], y = b[k];
      if (!x) out[k] = y; else if (!y) out[k] = x;
      else if (y.t > x.t) out[k] = y;
      else if (y.t < x.t) out[k] = x;
      else out[k] = stable(y.v) > stable(x.v) ? y : x;              // same moment: pick one the same way everywhere
    });
    return out;
  }
  function same(a, b) {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => b[k] && b[k].t === a[k].t && stable(b[k].v) === stable(a[k].v));
  }

  // write the merged entries back into data (days older than the window and device-only settings are left alone)
  function apply(data, entries, min) {
    const val = {};
    Object.keys(entries).forEach(k => { if (entries[k].v !== null) val[k] = entries[k].v; });
    const days = {};
    const dayFor = (k) => days[k] || (days[k] = { tasks: [], routines: {}, order: null, block: 1, customOrder: false });
    Object.keys(val).forEach(key => {
      const p = key.split('|');
      if (p[0] === 't') dayFor(p[1]).tasks.push(clone(val[key]));
      else if (p[0] === 'r') dayFor(p[1]).routines[p.slice(2).join('|')] = clone(val[key]);
      else if (p[0] === 'b') dayFor(p[1]).block = val[key];
      else if (p[0] === 'c') dayFor(p[1]).customOrder = !!val[key];
      else if (p[0] === 'o' && p[1] !== 'notes') dayFor(p[1]).order = val[key];
    });
    data.days = data.days || {};
    Object.keys(data.days).forEach(k => { if (k >= min && !days[k]) { const d = data.days[k]; d.tasks = []; d.routines = {}; d.block = undefined; d.customOrder = undefined; } });
    Object.keys(days).forEach(k => {
      const n = days[k], d = data.days[k] || (data.days[k] = { fired: {} });
      d.tasks = sortBy(n.tasks, n.order);
      d.routines = n.routines; d.fired = d.fired || {};
      d.block = n.block === 1 ? undefined : n.block;
      d.customOrder = n.customOrder || undefined;
    });
    const notes = Object.keys(val).filter(k => k.startsWith('n|')).map(k => clone(val[k]));
    data.notes = sortBy(notes, val['o|notes']);
    data.settings = data.settings || {};
    SETTINGS.forEach(k => { if (`s|${k}` in val) data.settings[k] = clone(val[`s|${k}`]); else if (entries[`s|${k}`]) delete data.settings[k]; });
    return data;
  }
  function sortBy(items, order) {
    const pos = {}; (order || []).forEach((id, i) => { pos[id] = i; });
    return items.map((x, i) => ({ x, i })).sort((a, b) => {
      const pa = a.x.id in pos ? pos[a.x.id] : 1e9, pb = b.x.id in pos ? pos[b.x.id] : 1e9;
      return pa - pb || String(a.x.id).localeCompare(String(b.x.id));
    }).map(o => o.x);
  }

  // ----- codes & crypto -----
  function newCode() {
    const b = new Uint8Array(16); crypto.getRandomValues(b);
    const s = Array.from(b, x => ALPHA[x % 32]).join('');
    return s.match(/.{4}/g).join('-');
  }
  function cleanCode(s) {
    const c = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return c.length === 16 ? c.match(/.{4}/g).join('-') : null;
  }
  const enc = (s) => new TextEncoder().encode(s);
  const hex = (buf) => Array.from(new Uint8Array(buf), x => x.toString(16).padStart(2, '0')).join('');
  function b64(bytes) { let s = ''; bytes.forEach(x => { s += String.fromCharCode(x); }); return btoa(s); }
  function unb64(s) { const t = atob(s); const out = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) out[i] = t.charCodeAt(i); return out; }
  async function keysFor(code) {
    const c = code.replace(/-/g, '');
    const id = hex(await crypto.subtle.digest('SHA-256', enc('desk-buddy:id:' + c)));
    const raw = await crypto.subtle.digest('SHA-256', enc('desk-buddy:key:' + c));
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { id, key };
  }
  async function seal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc(JSON.stringify(obj))));
    const all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12);
    return b64(all);
  }
  async function open(key, blob) {
    const all = unb64(blob);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, key, all.slice(12));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  // ----- the sync loop -----
  // opts: { server, getData(), changed(data), loadState(), saveState(st), onStatus(st) }
  function create(opts) {
    let st = opts.loadState() || {};
    let busy = null, again = false, keys = null, keysCode = null;
    const status = (patch) => { Object.assign(st, patch); opts.saveState(st); if (opts.onStatus) opts.onStatus(st); };
    async function k() { if (keysCode !== st.code) { keys = await keysFor(st.code); keysCode = st.code; } return keys; }
    async function req(method, body) {
      const { id } = await k();
      const r = await fetch(`${String(opts.server()).replace(/\/+$/, '')}/v1/${id}`, {
        method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store'
      });
      if (r.status !== 200 && r.status !== 409) throw new Error('HTTP ' + r.status);
      return { status: r.status, json: await r.json() };
    }
    async function once() {
      const { key } = await k();
      for (let attempt = 0; attempt < 4; attempt++) {
        const got = (await req('GET')).json;
        const remote = got.blob ? (await open(key, got.blob)).e || {} : {};
        const now = Date.now(), min = minKey(now);
        const data = opts.getData();
        // a device that just joined an existing code: its own old values count as older than everything there
        const local = stamp(flatten(data, min), st.snap || {}, st.joining ? 0 : now, min);
        const merged = merge(local, remote);
        if (!same(merged, local)) { apply(data, merged, min); opts.changed(data); }
        st.snap = merged; st.joining = false;
        if (same(merged, remote) && got.rev) { status({ rev: got.rev, last: now, error: null }); return; }
        const put = await req('PUT', { base: got.rev, blob: await seal(key, { v: 1, e: merged }) });
        if (put.status === 409) continue;
        status({ rev: put.json.rev, last: now, error: null });
        return;
      }
      throw new Error('busy');
    }
    function now() {
      if (!st.code || !opts.server()) return Promise.resolve();
      if (busy) { again = true; return busy; }
      busy = once().catch(e => { status({ error: String(e && e.message || e) }); })
        .finally(() => { busy = null; if (again) { again = false; now(); } });
      return busy;
    }
    let timer = null;
    function soon(ms) { clearTimeout(timer); timer = setTimeout(now, ms == null ? 4000 : ms); }
    return {
      now, soon,
      state: () => st,
      start() { status({ code: newCode(), rev: 0, snap: null, joining: false, error: null }); return now(); },
      join(code) { const c = cleanCode(code); if (!c) return null; status({ code: c, rev: 0, snap: null, joining: true, error: null }); return now(); },
      stop() { status({ code: null, rev: 0, snap: null, joining: false, error: null, last: null }); }
    };
  }

  const api = { create, flatten, stamp, merge, apply, same, stable, newCode, cleanCode, keysFor, seal, open, minKey, SETTINGS, DEFAULT_SERVER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Sync = api;
})(typeof window !== 'undefined' ? window : globalThis);
