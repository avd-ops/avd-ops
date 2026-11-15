// The docs graph on avd-ops.dev/docs/graph.html: reads graph.json (written by scripts/site/build-docs.mjs)
// and lays pages out with a deterministic force simulation in SVG. Colors come solely from design system
// tokens via classes in site.css; hovering or focusing a node highlights its connected neighborhood.
(() => {
  const box = document.querySelector('.graph');
  if (!box) return;
  const svg = box.querySelector('svg');
  const NS = 'http://www.w3.org/2000/svg';
  const W = 920, H = 560;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  fetch(box.dataset.src).then((r) => r.json()).then(({ nodes, links }) => {
    const byId = new Map(nodes.map((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      const rad = n.section ? 120 : 210;
      return [n.id, Object.assign(n, { x: W / 2 + Math.cos(a) * rad, y: H / 2 + Math.sin(a) * (rad * 0.78), vx: 0, vy: 0, deg: 0 })];
    }));
    const edges = links.map((l) => ({ s: byId.get(l.source), t: byId.get(l.target) })).filter((e) => e.s && e.t);
    for (const e of edges) { e.s.deg++; e.t.deg++; }
    for (let step = 0; step < 450; step++) {
      const k = 1 - step / 450;
      for (const a of nodes) for (const b of nodes) {
        if (a === b) continue;
        const dx = a.x - b.x, dy = a.y - b.y, d2 = Math.max(dx * dx + dy * dy, 36);
        const f = 6800 / d2;
        a.vx += dx * f / Math.sqrt(d2); a.vy += dy * f / Math.sqrt(d2);
      }
      for (const { s, t } of edges) {
        const dx = t.x - s.x, dy = t.y - s.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 145) * 0.022;
        s.vx += dx / d * f; s.vy += dy / d * f; t.vx -= dx / d * f; t.vy -= dy / d * f;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.0025; n.vy += (H / 2 - n.y) * 0.0035;
        n.x = Math.min(W - 64, Math.max(64, n.x + n.vx * k)); n.y = Math.min(H - 32, Math.max(36, n.y + n.vy * k));
        n.vx *= 0.58; n.vy *= 0.58;
      }
    }
    const el = (name, attrs, parent) => {
      const e = document.createElementNS(NS, name);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      parent.appendChild(e);
      return e;
    };
    const edgeEls = edges.map(({ s, t }) => ({
      s, t, line: el('line', { x1: s.x.toFixed(1), y1: s.y.toFixed(1), x2: t.x.toFixed(1), y2: t.y.toFixed(1), class: 'g-edge' }, svg),
    }));
    const nodeEls = new Map();
    for (const n of nodes) {
      const r = 5.5 + Math.min(n.deg, 11) * 0.75;
      const a = el('a', { href: n.url, class: `g-node g-${n.topic}${n.section ? ' g-hub' : ''}` }, svg);
      if (n.section) el('circle', { cx: n.x.toFixed(1), cy: n.y.toFixed(1), r: (r + 4.5).toFixed(1), class: 'g-ring' }, a);
      el('circle', { cx: n.x.toFixed(1), cy: n.y.toFixed(1), r: r.toFixed(1), class: 'g-dot' }, a);
      const short = n.title.length > 26 ? `${n.title.slice(0, 24)}…` : n.title;
      el('text', { x: n.x.toFixed(1), y: (n.y - r - 7).toFixed(1) }, a).textContent = short;
      el('title', {}, a).textContent = `${n.title} (${n.deg} links)`;
      nodeEls.set(n.id, a);
    }
    const focusNode = (activeId) => {
      if (!activeId) {
        box.classList.remove('has-hover');
        for (const a of nodeEls.values()) a.classList.remove('is-active', 'is-dim');
        for (const { line } of edgeEls) line.classList.remove('is-active', 'is-dim');
        return;
      }
      box.classList.add('has-hover');
      const neighbors = new Set([activeId]);
      for (const { s, t, line } of edgeEls) {
        const hit = s.id === activeId || t.id === activeId;
        if (hit) { neighbors.add(s.id); neighbors.add(t.id); }
        line.classList.toggle('is-active', hit);
        line.classList.toggle('is-dim', !hit);
      }
      for (const [id, a] of nodeEls) {
        a.classList.toggle('is-active', neighbors.has(id));
        a.classList.toggle('is-dim', !neighbors.has(id));
      }
    };
    for (const [id, a] of nodeEls) {
      a.addEventListener('mouseenter', () => focusNode(id));
      a.addEventListener('mouseleave', () => focusNode(null));
      a.addEventListener('focus', () => focusNode(id));
      a.addEventListener('blur', () => focusNode(null));
    }
  });
})();
