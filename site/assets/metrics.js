/* Client-side layer, maturity, and sort controls on site/metrics.html. */
(() => {
  const root = document.querySelector('[data-metrics-filters]');
  const list = document.querySelector('[data-metrics-list]');
  if (!root || !list) return;
  const cards = [...list.querySelectorAll('[data-metrics-card]')];
  if (!cards.length) return;

  const state = { layer: 'all', maturity: 'all', sort: 'score' };
  const status = root.querySelector('[data-filter-summary]');
  const statusBox = root.querySelector('.rm-filter-status');
  const resetBtn = root.querySelector('[data-filter-reset]');

  const syncButtons = (attr, value) => {
    for (const btn of root.querySelectorAll(`[${attr}]`)) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute(attr) === value));
    }
  };

  const apply = () => {
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
})();
