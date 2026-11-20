/* Client-side layer, repo, and channel filtering on site/releases.html. */
(() => {
  const root = document.querySelector('[data-release-filters]');
  const cards = [...document.querySelectorAll('[data-release-card]')];
  if (!root || !cards.length) return;

  const state = { layer: 'all', repo: 'all', channel: 'all' };
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
      const matchLayer = state.layer === 'all' || card.dataset.layer === state.layer;
      const matchRepo = state.repo === 'all' || card.dataset.repo === state.repo;
      const matchChannel = state.channel === 'all' || card.dataset.channel === state.channel;
      const visible = matchLayer && matchRepo && matchChannel;
      card.hidden = !visible;
      if (visible) shown += 1;
    }
    const filtered = state.layer !== 'all' || state.repo !== 'all' || state.channel !== 'all';
    if (statusBox) statusBox.hidden = !filtered;
    if (status) status.textContent = `Showing ${shown} of ${cards.length} release${cards.length === 1 ? '' : 's'}`;
  };

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.hasAttribute('data-filter-layer')) {
      state.layer = btn.getAttribute('data-filter-layer');
      syncButtons('data-filter-layer', state.layer);
      apply();
    } else if (btn.hasAttribute('data-filter-repo')) {
      state.repo = btn.getAttribute('data-filter-repo');
      syncButtons('data-filter-repo', state.repo);
      apply();
    } else if (btn.hasAttribute('data-filter-channel')) {
      state.channel = btn.getAttribute('data-filter-channel');
      syncButtons('data-filter-channel', state.channel);
      apply();
    } else if (btn === resetBtn) {
      state.layer = 'all';
      state.repo = 'all';
      state.channel = 'all';
      syncButtons('data-filter-layer', 'all');
      syncButtons('data-filter-repo', 'all');
      syncButtons('data-filter-channel', 'all');
      apply();
    }
  });
})();
