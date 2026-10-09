// Bullet journal marks in the handwriting font come out at very different sizes (a tiny ·, a wide —, a big ○).
// Each mark gets its own scale and lift, measured from the font, so they read as one even set:
// X and ! stand at the same height, ○ a touch smaller (round shapes look bigger), > < a bit shorter,
// — no wider than an X, and the · big enough to see.
(function (root) {
  const CLS = { '·': 'dot', X: 'x', '○': 'o', '—': 'dash', '>': 'gt', '<': 'lt', '!': 'bang' };
  // wrap a single mark in <span class="bj bj-…"><i>…</i></span> (once)
  function dress(scope) {
    if (!scope) return;
    scope.querySelectorAll('.glyph, .glyph-s, .bg > i, .cal-list .g').forEach(el => {
      if (el.firstElementChild && el.firstElementChild.classList.contains('bj')) return;
      const ch = el.textContent.trim();
      if (!CLS[ch]) return;
      el.textContent = '';
      const s = document.createElement('span'); s.className = 'bj bj-' + CLS[ch];
      const i = document.createElement('i'); i.textContent = ch; s.appendChild(i); el.appendChild(s);
    });
  }
  root.BJ = { dress };
})(typeof window !== 'undefined' ? window : globalThis);
