// Progressive-enhancement filter controls for site/roadmap.html.
// Personal project, not for production, as is; not affiliated with the author's employer or Microsoft.
(() => {
  const root = document.querySelector('[data-rm-filters]');
  if (!root) return;

  const state = { layer: 'all', theme: 'all', repo: 'all' };
  const cards = [...document.querySelectorAll('.rm-card')];
  const layerBtns = [...root.querySelectorAll('[data-filter-layer]')];
  const themeBtns = [...root.querySelectorAll('[data-filter-theme]')];
  const repoBtns = [...document.querySelectorAll('[data-filter-repo]')];
  const statusBar = root.querySelector('.rm-filter-status');
  const summaryEl = root.querySelector('[data-filter-summary]');
  const resetBtn = root.querySelector('[data-filter-reset]');

  const updateCounts = () => {
    for (const col of document.querySelectorAll('.rm-col, #recently-done')) {
      const countEl = col.querySelector('.rm-col-count');
      if (!countEl) continue;
      const list = col.classList.contains('rm-col')
        ? col.querySelector('.rm-list')
        : document.querySelector('.rm-done');
      if (!list) continue;
      const visible = [...list.querySelectorAll('.rm-card')].filter((c) => !c.hidden).length;
      countEl.textContent = `(${visible})`;
    }
  };

  const apply = () => {
    let shown = 0;
    for (const c of cards) {
      const matchLayer = state.layer === 'all' || c.dataset.layer === state.layer;
      const matchTheme = state.theme === 'all' || c.dataset.theme === state.theme;
      const matchRepo = state.repo === 'all' || c.dataset.repo === state.repo;
      const ok = matchLayer && matchTheme && matchRepo;
      c.hidden = !ok;
      if (ok) shown += 1;
    }
    for (const b of layerBtns) b.setAttribute('aria-pressed', String(b.dataset.filterLayer === state.layer));
    for (const b of themeBtns) b.setAttribute('aria-pressed', String(b.dataset.filterTheme === state.theme));
    for (const b of repoBtns) b.setAttribute('aria-pressed', String(b.dataset.filterRepo === state.repo));

    const active = state.layer !== 'all' || state.theme !== 'all' || state.repo !== 'all';
    if (statusBar) statusBar.hidden = !active;
    if (summaryEl && active) {
      const parts = [];
      if (state.repo !== 'all') parts.push(`repo: ${state.repo}`);
      if (state.layer !== 'all') parts.push(`layer: ${state.layer}`);
      if (state.theme !== 'all') parts.push(`theme: ${state.theme}`);
      summaryEl.textContent = `Showing ${shown} of ${cards.length} items (${parts.join(', ')})`;
    }
    updateCounts();
  };

  for (const b of layerBtns) {
    b.addEventListener('click', () => {
      state.layer = b.dataset.filterLayer;
      apply();
    });
  }
  for (const b of themeBtns) {
    b.addEventListener('click', () => {
      state.theme = b.dataset.filterTheme;
      apply();
    });
  }
  for (const b of repoBtns) {
    b.addEventListener('click', () => {
      const target = b.dataset.filterRepo;
      state.repo = state.repo === target ? 'all' : target;
      apply();
      if (state.repo !== 'all') {
        document.getElementById('board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  resetBtn?.addEventListener('click', () => {
    state.layer = 'all';
    state.theme = 'all';
    state.repo = 'all';
    apply();
  });
})();
