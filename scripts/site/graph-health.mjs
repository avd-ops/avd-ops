// KB health over the docs graph that build-docs.mjs writes (site/docs/graph.json): which pages
// nobody links to, which can't be reached from the nav, which pages most others lean on, and which
// links still point at a superseded decision. Pure: it takes the graph and returns findings, so the
// tests run it on fixtures and on the real graph.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.

export function graphHealth({ nodes, links }, { hubs = 5 } = {}) {
  const ids = new Set(nodes.map((n) => n.id));
  const edges = links.filter((l) => ids.has(l.source) && ids.has(l.target) && l.source !== l.target);
  const into = new Map(nodes.map((n) => [n.id, 0]));
  const out = new Map(nodes.map((n) => [n.id, []]));
  for (const l of edges) {
    into.set(l.target, into.get(l.target) + 1);
    out.get(l.source).push(l.target);
  }
  // A section page is reached from the nav on every page, so it needs no inbound link.
  const roots = nodes.filter((n) => n.section).map((n) => n.id);
  const reached = new Set(roots);
  for (const queue = [...roots]; queue.length;) {
    for (const t of out.get(queue.shift())) if (!reached.has(t)) { reached.add(t); queue.push(t); }
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const superseded = (n) => /^superseded/i.test(n.status || '');
  return {
    orphans: nodes.filter((n) => !n.section && into.get(n.id) === 0).map((n) => n.id),
    unreachable: nodes.filter((n) => !reached.has(n.id)).map((n) => n.id),
    deadEnds: nodes.filter((n) => out.get(n.id).length === 0).map((n) => n.id),
    hubs: nodes.filter((n) => into.get(n.id) > 0)
      .sort((a, b) => into.get(b.id) - into.get(a.id) || a.id.localeCompare(b.id))
      .slice(0, hubs).map((n) => ({ id: n.id, title: n.title, url: n.url, linkedFrom: into.get(n.id) })),
    // A superseded decision may be linked from the decision records (its successor, the index), not from guidance.
    supersededLinks: edges.filter((l) => superseded(byId.get(l.target)) && byId.get(l.source).topic !== 'decisions'),
  };
}
