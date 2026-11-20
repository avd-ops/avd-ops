/* Client-side tag and repo filtering on site/blog/index.html. */
(() => {
  const root = document.querySelector('[data-blog-filters]');
  const cards = [...document.querySelectorAll('[data-blog-card]')];
  if (!root || !cards.length) return;

  const state = { tag: 'all', repo: 'all' };
  const status = root.querySelector('[data-filter-summary]');
  const statusBox = root.querySelector('.rm-filter-status');
  const resetBtn = root.querySelector('[data-filter-reset]');

  const syncButtons = (attr, value) => {
    for (const btn of root.querySelectorAll(`[${attr}]`)) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute(attr) === value));
    }
  };

  const apply = () => {
    let shown = 0;
    for (const card of cards) {
      const tags = (card.dataset.tags || '').split(',').filter(Boolean);
      const repos = (card.dataset.repos || '').split(',').filter(Boolean);
      const matchTag = state.tag === 'all' || tags.includes(state.tag);
      const matchRepo = state.repo === 'all' || repos.includes(state.repo);
      const visible = matchTag && matchRepo;
      card.hidden = !visible;
      if (visible) shown += 1;
    }
    const filtered = state.tag !== 'all' || state.repo !== 'all';
    if (statusBox) statusBox.hidden = !filtered;
    if (status) status.textContent = `Showing ${shown} of ${cards.length} post${cards.length === 1 ? '' : 's'}`;
  };

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.hasAttribute('data-filter-tag')) {
      state.tag = btn.getAttribute('data-filter-tag');
      syncButtons('data-filter-tag', state.tag);
      apply();
    } else if (btn.hasAttribute('data-filter-repo')) {
      state.repo = btn.getAttribute('data-filter-repo');
      syncButtons('data-filter-repo', state.repo);
      apply();
    } else if (btn === resetBtn) {
      state.tag = 'all';
      state.repo = 'all';
      syncButtons('data-filter-tag', 'all');
      syncButtons('data-filter-repo', 'all');
      apply();
    }
  });
})();
