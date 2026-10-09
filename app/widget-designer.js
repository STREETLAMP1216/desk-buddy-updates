// 위젯 꾸미기: the real widget script, run here against a small stand-in for Scriptable's widget API,
// so you see the widget with your own data and copy the Parameter text that gives exactly that.
(function () {
  // ---------- a stand-in for Scriptable (enough for the widget's drawing) ----------
  class Color { constructor(hex, a) { this.hex = a != null && a < 1 ? hex + Math.round(a * 255).toString(16).padStart(2, '0') : hex; } }
  class Size { constructor(w, h) { this.width = w; this.height = h; } }
  const Font = {};
  ['systemFont', 'boldSystemFont', 'semiboldSystemFont', 'boldRoundedSystemFont', 'semiboldMonospacedSystemFont', 'boldMonospacedSystemFont', 'mediumSystemFont'].forEach(n => {
    Font[n] = (size) => ({ size, bold: /bold|semibold/i.test(n), mono: /Mono/.test(n) });
  });
  class Img { constructor(uri) { this.uri = uri; } }
  class Base {
    constructor(vertical) { this.kids = []; this.vertical = vertical; this.spacing = 0; this.pad = null; this.align = 'top'; }
    addStack() { const s = new Base(false); this.kids.push(s); return s; }
    addText(t) { const x = { type: 'text', text: String(t), font: Font.systemFont(14), textColor: new Color('#000'), lineLimit: 0 }; this.kids.push(x); return x; }
    addImage(img) { const x = { type: 'img', img, imageSize: null, cornerRadius: 0 }; this.kids.push(x); return x; }
    addDate(d) { const x = { type: 'text', text: '', font: Font.systemFont(14), textColor: new Color('#000'), applyTimeStyle() { this.text = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } }; this.kids.push(x); return x; }
    addSpacer(n) { this.kids.push({ type: 'spacer', n }); }
    setPadding(t, l, b, r) { this.pad = [t, l, b, r]; }
    layoutVertically() { this.vertical = true; } layoutHorizontally() { this.vertical = false; }
    centerAlignContent() { this.align = 'center'; } topAlignContent() { this.align = 'top'; } bottomAlignContent() { this.align = 'bottom'; }
  }
  class ListWidget extends Base { constructor() { super(true); this.pad = [16, 16, 16, 16]; } }
  const mem = {};
  const FileManager = { local: () => ({
    cacheDirectory: () => '/c', documentsDirectory: () => '/c', joinPath: (a, b) => a + '/' + b,
    fileExists: (p) => p in mem, readString: (p) => mem[p], writeString: (p, s) => { mem[p] = s; },
    readImage: (p) => mem[p], writeImage: (p, i) => { mem[p] = i; }, modificationDate: () => new Date()
  }) };
  const here = (url) => url.replace(/^https:\/\/[^/]+\/desk-buddy-updates\/app\//, './');
  class Request {
    constructor(url) { this.url = url; }
    async loadImage() { const u = here(this.url); await new Promise((ok, no) => { const i = new Image(); i.onload = ok; i.onerror = no; i.src = u; }); return new Img(u); }
    async loadString() { const r = await fetch(here(this.url)); if (!r.ok) throw new Error(r.status); return r.text(); }
    async loadJSON() { throw new Error('preview'); }
  }
  let batt = null;
  if (navigator.getBattery) navigator.getBattery().then(b => { batt = b; }).catch(() => {});
  const Device = {
    batteryLevel: () => { if (!batt) throw new Error('no battery'); return batt.level; },
    isCharging: () => !!(batt && batt.charging), isFullyCharged: () => !!(batt && batt.charging && batt.level >= 1)
  };

  // ---------- drawing the tree as HTML ----------
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const col = (c) => (c ? c.hex : 'inherit');
  function draw(n, parentV) {
    if (n.type === 'spacer') return n.n == null ? '<div style="flex:1 1 0"></div>' : `<div style="flex:0 0 ${n.n}px;${parentV ? 'height' : 'width'}:${n.n}px"></div>`;
    if (n.type === 'text') {
      const f = n.font || {};
      const clamp = n.lineLimit ? (n.lineLimit === 1 ? 'white-space:nowrap;text-overflow:ellipsis;overflow:hidden;' : `display:-webkit-box;-webkit-line-clamp:${n.lineLimit};-webkit-box-orient:vertical;overflow:hidden;`) : '';
      return `<div style="min-width:0;flex:0 1 auto;font-size:${f.size}px;font-weight:${f.bold ? 700 : 400};${f.mono ? 'font-family:ui-monospace,Menlo,monospace;' : ''}color:${col(n.textColor)};line-height:1.2;${clamp}">${esc(n.text)}</div>`;
    }
    if (n.type === 'img') { const s = n.imageSize || new Size(40, 40); return `<img src="${n.img.uri}" style="flex:none;width:${s.width}px;height:${s.height}px;object-fit:contain;border-radius:${n.cornerRadius || 0}px">`; }
    const v = n.vertical, p = n.pad || [0, 0, 0, 0], flex = n.kids.some(k => k.type === 'spacer' && k.n == null);
    const st = [`display:flex`, `flex-direction:${v ? 'column' : 'row'}`, `gap:${n.spacing || 0}px`, `padding:${p[0]}px ${p[3]}px ${p[2]}px ${p[1]}px`,
      `align-items:${v ? 'flex-start' : n.align === 'center' ? 'center' : n.align === 'bottom' ? 'flex-end' : 'flex-start'}`, 'min-width:0', 'box-sizing:border-box', 'overflow:hidden'];
    if (!v && flex) st.push('align-self:stretch');
    if (v && flex) st.push('flex:1 1 auto');
    if (n.size) { if (n.size.width) st.push(`width:${n.size.width}px;flex:none`); if (n.size.height) st.push(`height:${n.size.height}px`); }
    if (n.backgroundColor) st.push(`background:${col(n.backgroundColor)}`);
    if (n.cornerRadius) st.push(`border-radius:${n.cornerRadius}px`);
    if (n.borderWidth) st.push(`border:${n.borderWidth}px solid ${col(n.borderColor)}`);
    return `<div style="${st.join(';')}">${n.kids.map(k => draw(k, v)).join('')}</div>`;
  }
  const SIZE = { small: [158, 158, 22], medium: [338, 158, 22], large: [338, 354, 22], accessoryRectangular: [172, 76, 14], accessoryCircular: [76, 76, 38], accessoryInline: [260, 24, 8] };
  function widgetHTML(w, fam) {
    const [W, H, R] = SIZE[fam], lock = fam.startsWith('accessory');
    const p = lock ? [4, 8, 4, 8] : w.pad;
    if (lock) { const white = (n) => { if (n.type === 'text') n.textColor = new Color('#fff'); (n.kids || []).forEach(white); }; white(w); }
    return `<div class="wd-box${lock ? ' lock' : ''}" style="width:${W}px;height:${H}px;border-radius:${R}px;background:${lock ? 'rgba(255,255,255,.2)' : col(w.backgroundColor) || '#fff'}">
      <div style="display:flex;flex-direction:column;height:100%;padding:${p[0]}px ${p[3]}px ${p[2]}px ${p[1]}px;box-sizing:border-box;${fam === 'accessoryCircular' ? 'justify-content:center;' : ''}">${w.kids.map(k => draw(k, true)).join('')}</div></div>`;
  }

  // ---------- loading the widget script ----------
  let api = null;
  async function widgetApi() {
    if (api) return api;
    const src = await (await fetch('shared/desk-buddy-widget.js', { cache: 'no-cache' })).text();
    const body = src.slice(0, src.indexOf('if (typeof module'));
    const names = ['Color', 'Size', 'Font', 'ListWidget', 'FileManager', 'Request', 'Device', 'config', 'args'];
    api = new Function(...names, body + '\nreturn { model, buildHome, buildLock, parseParam };')(Color, Size, Font, ListWidget, FileManager, Request, Device, {}, {});
    return api;
  }

  // ---------- the designer ----------
  const PARTS = [['큰캐릭터', '캐릭터 그림'], ['작은캐릭터', '캐릭터 얼굴'], ['말', '말풍선'], ['날짜', '날짜'], ['시간', '시계'], ['진행', '진행 막대'],
    ['블럭', '블럭 6칸'], ['지금블럭', '지금 블럭 할 일'], ['할일', '남은 할 일'], ['u', 'u 할 일'], ['루틴', '루틴'], ['일정', '일정'], ['메모', '메모'], ['배터리', '폰 배터리']];
  const FAMS = [['small', '작게'], ['medium', '중간'], ['large', '크게'], ['accessoryRectangular', '잠금 · 네모'], ['accessoryCircular', '잠금 · 동그라미'], ['accessoryInline', '잠금 · 한 줄']];
  const DEFAULTS = { small: '작은캐릭터, 진행, 지금블럭', medium: '큰캐릭터, 말, 지금블럭', large: '큰캐릭터, 말, 블럭, 할일, 일정, 메모' };

  // ctx: { T, mk, entries(), body (element to fill), close() }
  async function open(ctx) {
    const { T, mk } = ctx;
    const st = { fam: 'medium', picked: null };
    const body = ctx.body; body.innerHTML = '';
    const wrap = mk('div', 'wd');
    const bar = mk('div', 'wd-bar'); bar.appendChild(mk('b', '', T('위젯 꾸미기'))); const x = mk('button', 'pill', T('완료')); x.addEventListener('click', ctx.close); bar.appendChild(x);
    const fams = mk('div', 'wd-fams');
    const stage = mk('div', 'wd-stage');
    const hint = mk('p', 'sub wd-hint');
    const partsBox = mk('div', 'wd-parts');
    const out = mk('div', 'wd-out');
    wrap.append(bar, fams, stage, hint, partsBox, out); body.appendChild(wrap);

    FAMS.forEach(([f, label]) => { const b = mk('button', '', T(label)); b.dataset.f = f; b.addEventListener('click', () => { st.fam = f; st.picked = null; render(); }); fams.appendChild(b); });
    let a;
    try { a = await widgetApi(); } catch (e) { stage.textContent = T('미리보기를 불러오지 못했어요.'); return; }

    const lock = () => st.fam.startsWith('accessory');
    const param = () => (st.picked === null ? '' : st.picked.join(', '));
    async function render() {
      fams.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === st.fam));
      const m = a.model(ctx.entries(), new Date()), info = { at: Date.now(), live: true };
      let w;
      try { w = lock() ? a.buildLock(m, info, st.fam, param()) : await a.buildHome(m, info, st.fam, param()); }
      catch (e) { stage.textContent = String(e && e.message || e); return; }
      stage.className = 'wd-stage' + (lock() ? ' dark' : '');
      stage.innerHTML = widgetHTML(w, st.fam);
      // parts
      partsBox.innerHTML = '';
      hint.textContent = lock() ? (st.fam === 'accessoryRectangular' ? T('네모 잠금 위젯은 "일정"만 고를 수 있어요 (다음 일정을 맨 위에).') : T('이 크기는 고를 칸이 없어요. Parameter는 비워 두세요.'))
        : st.picked === null ? T('지금은 기본 조합이에요. 아래에서 칸을 누르면 그 순서대로 위에서부터 놓여요.') : T('누른 순서대로 위에서부터 놓여요. 다시 누르면 빠져요.');
      const avail = lock() ? (st.fam === 'accessoryRectangular' ? PARTS.filter(p => p[0] === '일정') : []) : PARTS;
      const cur = st.picked || [];
      avail.forEach(([k, d]) => {
        const i = cur.indexOf(k);
        const b = mk('button', 'wd-part' + (i >= 0 ? ' on' : ''));
        if (i >= 0) b.appendChild(mk('span', 'wd-n', String(i + 1)));
        b.appendChild(document.createTextNode(T(k)));
        b.title = T(d);
        b.addEventListener('click', () => {
          const p = (st.picked || []).slice(), j = p.indexOf(k);
          if (j >= 0) p.splice(j, 1); else {
            if (k === '큰캐릭터') { const q = p.indexOf('작은캐릭터'); if (q >= 0) p.splice(q, 1); }
            if (k === '작은캐릭터') { const q = p.indexOf('큰캐릭터'); if (q >= 0) p.splice(q, 1); }
            p.push(k);
          }
          st.picked = p.length ? p : null; render();
        });
        partsBox.appendChild(b);
      });
      if (!lock()) {
        const reset = mk('button', 'wd-part ghost', T('기본으로')); reset.addEventListener('click', () => { st.picked = null; render(); });
        if (st.picked !== null) partsBox.appendChild(reset);
      }
      // the text to paste
      out.innerHTML = '';
      const text = param();
      const box = mk('div', 'wd-code', text || T('(비워 두기 — 기본 조합)'));
      const copy = mk('button', 'pill', text ? T('복사') : T('복사할 게 없어요'));
      copy.disabled = !text;
      copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(text); copy.textContent = T('복사했어요'); setTimeout(() => { copy.textContent = T('복사'); }, 2000); } catch (e) { box.focus(); } });
      out.append(mk('div', 'sub', T('Parameter 칸에 넣을 글')), box, copy,
        mk('p', 'sub', T('홈 화면 위젯을 길게 눌러 › 위젯 편집 › Parameter에 붙여 넣어요. 그림은 미리보기라 실제와 조금 다를 수 있어요.')));
    }
    render();
  }
  window.WidgetDesigner = { open };
})();
