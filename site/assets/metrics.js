/* Client-side live refresh, layer/maturity filtering, and sort controls on site/metrics.html. */
(() => {
  const root = document.querySelector('[data-metrics-filters]');
  const list = document.querySelector('[data-metrics-list]');
  if (!root || !list) return;

  const ledeEl = document.querySelector('[data-metrics-lede]');
  const kpisEl = document.querySelector('[data-metrics-kpis]');
  const podiumEl = document.querySelector('[data-metrics-podium]');
  const layersEl = document.querySelector('[data-metrics-layers]');
  const status = root.querySelector('[data-filter-summary]');
  const statusBox = root.querySelector('.rm-filter-status');
  const resetBtn = root.querySelector('[data-filter-reset]');

  const state = { layer: 'all', maturity: 'all', sort: 'score' };
  const MATURITY = { proven: 'Proven', 'pre-beta': 'Pre-beta', design: 'Design' };
  const LAYER_LABELS = {
    assess: 'Assess and plan',
    build: 'Build and change',
    control: 'Control planes',
    operate: 'Operate and support',
    intelligence: 'Intelligence, on top',
    'front-door': 'Front door',
  };

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const repoGuideHref = (name) => (name === 'avd-ops' ? 'docs/index.html' : `family/${encodeURIComponent(name)}.html`);

  const ciChip = (conclusion) => {
    if (conclusion === 'success') return '<span class="chip mx-ci-pass">CI passing</span>';
    if (conclusion === 'failure') return '<span class="chip mx-ci-fail">CI failing</span>';
    return '<span class="chip">CI unknown</span>';
  };

  const getCards = () => [...list.querySelectorAll('[data-metrics-card]')];

  const syncButtons = (attr, value) => {
    for (const btn of root.querySelectorAll(`[${attr}]`)) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute(attr) === value));
    }
  };

  const apply = () => {
    const cards = getCards();
    if (!cards.length) return;
    const sorted = [...cards].sort((a, b) => Number(b.dataset[state.sort] || 0) - Number(a.dataset[state.sort] || 0));
    for (const card of sorted) list.appendChild(card);

    let shown = 0;
    for (const card of sorted) {
      const matchLayer = state.layer === 'all' || card.dataset.layer === state.layer;
      const matchMaturity = state.maturity === 'all' || card.dataset.maturity === state.maturity;
      const visible = matchLayer && matchMaturity;
      card.hidden = !visible;
      if (visible) shown += 1;
    }
    const filtered = state.layer !== 'all' || state.maturity !== 'all';
    if (statusBox) statusBox.hidden = !filtered;
    if (status) status.textContent = `Showing ${shown} of ${cards.length} repositor${cards.length === 1 ? 'y' : 'ies'}`;
  };

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.hasAttribute('data-filter-layer')) {
      state.layer = btn.getAttribute('data-filter-layer');
      syncButtons('data-filter-layer', state.layer);
      apply();
    } else if (btn.hasAttribute('data-filter-maturity')) {
      state.maturity = btn.getAttribute('data-filter-maturity');
      syncButtons('data-filter-maturity', state.maturity);
      apply();
    } else if (btn.hasAttribute('data-sort')) {
      state.sort = btn.getAttribute('data-sort');
      syncButtons('data-sort', state.sort);
      apply();
    } else if (btn === resetBtn) {
      state.layer = 'all';
      state.maturity = 'all';
      state.sort = 'score';
      syncButtons('data-filter-layer', 'all');
      syncButtons('data-filter-maturity', 'all');
      syncButtons('data-sort', 'score');
      apply();
    }
  });

  const render = (metricsDoc, liveCheckedAt) => {
    const totals = metricsDoc.totals || {};
    const repos = metricsDoc.repos || [];
    const layers = metricsDoc.layers || [];
    const repoCount = totals.repos ?? repos.length;

    if (ledeEl) {
      const suffix = liveCheckedAt
        ? `snapshot as of ${esc(metricsDoc.fetchedAt || 'unknown')}; live GitHub check ${esc(liveCheckedAt)}`
        : `snapshot as of ${esc(metricsDoc.fetchedAt || 'unknown')}`;
      ledeEl.innerHTML = `Live 30-day engineering velocity, release cadence, and CI health across all ${esc(repoCount)} public repositories (${suffix}).`;
    }

    if (kpisEl) {
      kpisEl.innerHTML = [
        `<article class="card rm-mat-card"><span class="rm-role">Platform XP (30d)</span><b>${esc(totals.totalScore ?? 0)} XP</b></article>`,
        `<article class="card rm-mat-card"><span class="rm-role">Merged PRs (30d)</span><b>${esc(totals.mergedPrs30d ?? 0)}</b></article>`,
        `<article class="card rm-mat-card"><span class="rm-role">Commits (30d)</span><b>${esc(totals.commits30d ?? 0)}</b></article>`,
        `<article class="card rm-mat-card"><span class="rm-role">Published Releases</span><b>${esc(totals.releasesCount ?? 0)}</b></article>`,
        `<article class="card rm-mat-card"><span class="rm-role">Green CI Rate</span><b>${esc(totals.greenCiPct ?? 0)}% (${esc(totals.greenCiCount ?? 0)}/${esc(repoCount)})</b></article>`,
        `<article class="card rm-mat-card"><span class="rm-role">Active Repos (7d)</span><b>${esc(totals.active7dCount ?? 0)} of ${esc(repoCount)}</b></article>`,
      ].join('\n');
    }

    if (podiumEl && repos.length) {
      podiumEl.innerHTML = repos.slice(0, 3).map((r) => {
        const badgeHtml = (r.badges || []).map((b) => `<span class="chip">${esc(b)}</span>`).join(' ');
        return `<article class="card rm-card mx-podium-card">
<div class="rm-top"><span class="mx-rank">#${esc(r.rank)}</span> <span class="chip mono">${esc(r.score)} XP</span> ${ciChip(r.ciConclusion)}</div>
<h3><a class="mono" href="${repoGuideHref(r.name)}">${esc(r.name)}</a></h3>
<p class="rm-meta">${esc(r.mergedPrs30d)} merged PRs &middot; ${esc(r.commits30d)} commits &middot; ${esc(r.releasesCount)} release${r.releasesCount === 1 ? '' : 's'}</p>
<div class="rm-top">${badgeHtml}</div>
</article>`;
      }).join('\n');
    }

    if (layersEl && layers.length) {
      const maxLayerScore = Math.max(1, ...layers.map((l) => l.score));
      layersEl.innerHTML = layers.map((l) => `<article class="card rm-repo-card">
<div class="rm-top"><span class="mx-rank">#${esc(l.rank)}</span> <strong>${esc(LAYER_LABELS[l.layer] || l.layer)}</strong> <span class="chip mono">${esc(l.score)} XP</span></div>
<progress max="${esc(maxLayerScore)}" value="${esc(l.score)}"></progress>
<p class="rm-meta">${esc(l.repoCount)} repo${l.repoCount === 1 ? '' : 's'} &middot; ${esc(l.mergedPrs30d)} PRs &middot; ${esc(l.commits30d)} commits &middot; ${esc(l.releasesCount)} releases</p>
</article>`).join('\n');
    }

    if (repos.length) {
      list.innerHTML = repos.map((r) => {
        const badges = (r.badges || []).map((b) => `<span class="chip">${esc(b)}</span>`).join(' ');
        const relText = r.latestRelease ? `Latest: <code>${esc(r.latestRelease)}</code>` : 'No release yet';
        return `<article class="card rm-card" data-metrics-card data-layer="${esc(r.layer)}" data-maturity="${esc(r.maturity)}" data-score="${esc(r.score)}" data-prs="${esc(r.mergedPrs30d)}" data-commits="${esc(r.commits30d)}" data-releases="${esc(r.releasesCount)}">
<div class="rm-top"><span class="mx-rank">#${esc(r.rank)}</span> <a class="mono" href="${repoGuideHref(r.name)}"><strong>${esc(r.name)}</strong></a> <span class="mark-badge m-${esc(r.maturity)}">${esc(MATURITY[r.maturity] || r.maturity)}</span> <span class="chip">${esc(LAYER_LABELS[r.layer] || r.layer)}</span> ${ciChip(r.ciConclusion)} <span class="chip mono">${esc(r.score)} XP</span></div>
<p class="rm-meta"><strong>30d:</strong> ${esc(r.mergedPrs30d)} merged PRs (${esc(r.mergedPrs7d)} in 7d) &middot; ${esc(r.commits30d)} commits &middot; ${esc(r.releasesCount)} published release${r.releasesCount === 1 ? '' : 's'} (${relText}) &middot; ${esc(r.openIssues)} open issues</p>
<div class="rm-top">${badges} <a class="rm-meta" href="https://github.com/${esc(r.repo)}">GitHub</a></div>
</article>`;
      }).join('\n');
      apply();
    }
  };

  const mergeLiveRepos = (doc, ghRepos) => {
    const publicRepos = ghRepos.filter((r) => !r.archived && !r.fork && !r.private);
    if (!publicRepos.length) return doc;
    const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
    const ghByName = new Map(publicRepos.map((r) => [r.name, r]));
    const existing = new Map((doc.repos || []).map((r) => [r.name, r]));
    const merged = [];

    for (const r of doc.repos || []) {
      const gh = ghByName.get(r.name);
      if (!gh && ghByName.size > 0) continue;
      merged.push(r);
    }
    for (const gh of publicRepos) {
      if (existing.has(gh.name)) continue;
      merged.push({
        name: gh.name,
        repo: gh.full_name,
        layer: 'front-door',
        maturity: 'design',
        mergedPrs30d: 0,
        mergedPrs7d: 0,
        commits30d: 0,
        commits7d: 0,
        releasesCount: 0,
        latestRelease: null,
        ciConclusion: 'unknown',
        openIssues: gh.open_issues_count || 0,
        score: 0,
        badges: [],
      });
    }

    merged.sort((a, b) => b.score - a.score || b.mergedPrs30d - a.mergedPrs30d || b.commits30d - a.commits30d || a.name.localeCompare(b.name));
    merged.forEach((r, idx) => { r.rank = idx + 1; });

    const active7dCount = merged.filter((r) => {
      const gh = ghByName.get(r.name);
      return (gh && Date.parse(gh.pushed_at) >= sevenDaysAgo) || r.mergedPrs7d > 0 || r.commits7d > 0;
    }).length;
    const greenCiCount = merged.filter((r) => r.ciConclusion === 'success').length;

    return {
      ...doc,
      totals: {
        ...(doc.totals || {}),
        repos: merged.length,
        greenCiCount,
        greenCiPct: merged.length ? Math.round((greenCiCount / merged.length) * 100) : 0,
        active7dCount,
      },
      repos: merged,
    };
  };

  const refresh = async () => {
    try {
      const res = await fetch('data/metrics.json', { cache: 'no-store' });
      if (!res.ok) return;
      let doc = await res.json();
      let liveCheckedAt = null;

      try {
        const ghRes = await fetch('https://api.github.com/orgs/avd-ops/repos?per_page=100&type=public', {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (ghRes.ok) {
          const ghRepos = await ghRes.json();
          if (Array.isArray(ghRepos) && ghRepos.length) {
            doc = mergeLiveRepos(doc, ghRepos);
            liveCheckedAt = new Date().toISOString().slice(0, 10);
          }
        }
      } catch {
        // Offline or rate-limited: keep data/metrics.json snapshot.
      }

      render(doc, liveCheckedAt);
    } catch {
      // Keep build-time snapshot if fetch fails (e.g. file:// preview).
    }
  };

  refresh();
})();
