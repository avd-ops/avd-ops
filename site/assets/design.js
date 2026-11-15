/* avd-ops.dev design page (site/design/): each swatch shows its token's value in the current theme and, for text
   and its grounds, the contrast against the page; a press copies var(--token). Reads computed styles only; makes no
   requests and stores nothing. Personal project, not for production, as is; not affiliated with the author's
   employer or Microsoft. */
(function () {
  var live = document.querySelector('.ds-live');
  var TEXT = { '--fg': 1, '--muted': 1, '--accent': 1, '--accent-hover': 1, '--good': 1, '--caution': 1, '--bad': 1, '--info': 1, '--warn-fg': 1, '--shell-fg': '--shell', '--shell-muted': '--shell', '--on-accent': '--accent', '--term-text': '--term-bg', '--prompt': '--term-bg' };
  function val(t) { return getComputedStyle(document.documentElement).getPropertyValue(t).trim(); }
  function rgb(h) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h);
    if (!m) return null;
    var x = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    return [0, 2, 4].map(function (i) { return parseInt(x.substr(i, 2), 16) / 255; });
  }
  function lum(c) {
    var l = c.map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function ratio(a, b) {
    var x = rgb(a), y = rgb(b);
    if (!x || !y) return null;
    var p = lum(x), q = lum(y);
    return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05);
  }
  function paint() {
    document.querySelectorAll('.swatch[data-token]').forEach(function (b) {
      var t = b.getAttribute('data-token'), v = val(t), out = b.querySelector('.v');
      var against = TEXT[t] === 1 ? '--bg' : TEXT[t];
      var r = against ? ratio(v, val(against)) : null;
      out.textContent = v + (r ? ' ' + r.toFixed(1) + ':1 ' + (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'large text') : '');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.swatch[data-token]');
    if (!b) return;
    var text = 'var(' + b.getAttribute('data-token') + ')';
    var done = function () { if (live) live.textContent = 'Copied ' + text; };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { if (live) live.textContent = text; });
    else if (live) live.textContent = text;
  });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  paint();
})();
