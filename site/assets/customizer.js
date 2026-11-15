/* avd-ops Adopter Theme Customizer UI (v4.0.0) for site/design/index.html.
   Live-previews palette presets, custom colors, typography pairings, and brand slot overrides across the page,
   computes WCAG AA contrast warnings, and exports adopter-theme.css + drop-in instructions.
   Makes zero external requests and uploads nothing.
   Personal project, not for production, as is; not affiliated with the author's employer or Microsoft. */
import {
  PALETTE_PRESETS,
  FONT_PRESETS,
  resolveThemeTokens,
  evaluatePaletteContrast,
  generateAdopterCss,
  generateDropInSnippet,
  svgToDataUri,
} from './customizer-core.js';

const root = document.getElementById('customizer-panel');
if (root) {
  const state = {
    presetId: 'teal',
    fontId: 'grotesk-plex',
    lightAccent: PALETTE_PRESETS[0].light.accent,
    darkAccent: PALETTE_PRESETS[0].dark.accent,
    brand: PALETTE_PRESETS[0].light.brand,
    shell: PALETTE_PRESETS[0].light.shell,
    customColors: false,
    wordmark: 'avd-ops',
    tagline: 'Deploy quietly',
    markDataUri: null,
  };

  const presetInputs = root.querySelectorAll('input[name="cust-preset"]');
  const fontInputs = root.querySelectorAll('input[name="cust-font"]');
  const lightAccentEl = document.getElementById('cust-accent-light');
  const darkAccentEl = document.getElementById('cust-accent-dark');
  const brandEl = document.getElementById('cust-brand');
  const shellEl = document.getElementById('cust-shell');
  const wordmarkEl = document.getElementById('cust-wordmark');
  const taglineEl = document.getElementById('cust-tagline');
  const svgInputEl = document.getElementById('cust-svg');
  const fileInputEl = document.getElementById('cust-mark-file');
  const wcagEl = document.getElementById('cust-wcag');
  const cssOutEl = document.getElementById('adopter-css-out');
  const dropinOutEl = document.getElementById('adopter-dropin-out');
  const downloadBtn = document.getElementById('cust-download');
  const resetBtn = document.getElementById('cust-reset');

  const barBrand = document.querySelector('header.bar .brand');
  const barMark = barBrand && barBrand.querySelector('img.mark');
  const barWord = barBrand && barBrand.querySelector('.word');
  const barTag = barBrand && barBrand.querySelector('.tag');
  const demoBar = document.querySelector('.bar-demo');
  const demoMark = demoBar && demoBar.querySelector('img');
  const origMarkSrc = barMark ? barMark.getAttribute('src') : '../assets/brand/mark.svg';

  let styleEl = document.getElementById('adopter-preview-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'adopter-preview-css';
    document.head.appendChild(styleEl);
  }

  function currentConfig() {
    if (!state.customColors) {
      return {
        presetId: state.presetId,
        fontId: state.fontId,
        wordmark: state.wordmark,
        tagline: state.tagline,
      };
    }
    return {
      presetId: state.presetId,
      fontId: state.fontId,
      lightAccent: state.lightAccent,
      darkAccent: state.darkAccent,
      brand: state.brand,
      shell: state.shell,
      wordmark: state.wordmark,
      tagline: state.tagline,
    };
  }

  function renderWcag(evaluation) {
    if (!wcagEl) return;
    wcagEl.className = 'cust-wcag ' + (evaluation.ok ? 'is-pass' : 'is-warn');
    const summary = evaluation.ok
      ? 'WCAG AA pass: all Light & Dark text/accent/shell pairs meet 4.5:1+.'
      : 'WCAG AA warning: ' + evaluation.warnings.join(' | ');
    const badges = evaluation.checks
      .filter((c) => ['light-accent-bg', 'light-on-accent', 'dark-accent-bg', 'dark-on-accent'].includes(c.id))
      .map((c) => `${c.label.replace(' --accent', '').replace(' --on-accent', ' on-accent')}: ${c.ratio.toFixed(1)}:1 (${c.level})`)
      .join(' · ');
    wcagEl.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = summary;
    const small = document.createElement('span');
    small.className = 'cust-wcag-detail';
    small.textContent = badges;
    wcagEl.appendChild(strong);
    wcagEl.appendChild(small);
  }

  function updateBrandPreview() {
    const word = (state.wordmark || '').trim() || 'avd-ops';
    const tag = (state.tagline || '').trim();
    if (barWord) barWord.textContent = word;
    if (barTag) {
      barTag.textContent = tag;
      barTag.hidden = !tag;
    }
    if (barMark) {
      barMark.src = state.markDataUri || origMarkSrc;
    }
    if (demoMark) {
      demoMark.src = state.markDataUri || origMarkSrc;
    }
  }

  function update() {
    const cfg = currentConfig();
    const resolved = resolveThemeTokens(cfg);
    const css = generateAdopterCss(cfg);
    const isDefault = !state.customColors && state.presetId === 'teal' && state.fontId === 'grotesk-plex';

    styleEl.textContent = isDefault ? '' : css;
    if (cssOutEl) cssOutEl.value = css;
    if (dropinOutEl) dropinOutEl.value = generateDropInSnippet();

    renderWcag(evaluatePaletteContrast(resolved));
    updateBrandPreview();
    document.dispatchEvent(new CustomEvent('avd-ops-customizer'));
  }

  function syncInputsFromPreset(presetId) {
    const preset = PALETTE_PRESETS.find((p) => p.id === presetId) || PALETTE_PRESETS[0];
    const resolved = resolveThemeTokens({ presetId: preset.id });
    state.presetId = preset.id;
    state.customColors = false;
    state.lightAccent = resolved.light['--accent'];
    state.darkAccent = resolved.dark['--accent'];
    state.brand = resolved.light['--brand'];
    state.shell = resolved.light['--shell'];
    if (lightAccentEl) lightAccentEl.value = state.lightAccent;
    if (darkAccentEl) darkAccentEl.value = state.darkAccent;
    if (brandEl) brandEl.value = state.brand;
    if (shellEl) shellEl.value = state.shell;
  }

  presetInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      syncInputsFromPreset(input.value);
      update();
    });
  });

  fontInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state.fontId = input.value;
      update();
    });
  });

  [
    [lightAccentEl, 'lightAccent'],
    [darkAccentEl, 'darkAccent'],
    [brandEl, 'brand'],
    [shellEl, 'shell'],
  ].forEach(([el, key]) => {
    if (!el) return;
    el.addEventListener('input', () => {
      state.customColors = true;
      state[key] = el.value;
      update();
    });
  });

  if (wordmarkEl) {
    wordmarkEl.addEventListener('input', () => {
      state.wordmark = wordmarkEl.value;
      update();
    });
  }

  if (taglineEl) {
    taglineEl.addEventListener('input', () => {
      state.tagline = taglineEl.value;
      update();
    });
  }

  if (svgInputEl) {
    svgInputEl.addEventListener('input', () => {
      const val = svgInputEl.value.trim();
      state.markDataUri = val ? svgToDataUri(val) : null;
      updateBrandPreview();
    });
  }

  if (fileInputEl) {
    fileInputEl.addEventListener('change', () => {
      const file = fileInputEl.files && fileInputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
          if (svgInputEl) svgInputEl.value = reader.result;
          state.markDataUri = svgToDataUri(reader.result);
        } else {
          state.markDataUri = reader.result;
        }
        updateBrandPreview();
      };
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([generateAdopterCss(currentConfig())], { type: 'text/css;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'adopter-theme.css';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      syncInputsFromPreset('teal');
      state.fontId = 'grotesk-plex';
      state.wordmark = 'avd-ops';
      state.tagline = 'Deploy quietly';
      state.markDataUri = null;
      presetInputs.forEach((i) => { i.checked = i.value === 'teal'; });
      fontInputs.forEach((i) => { i.checked = i.value === 'grotesk-plex'; });
      if (wordmarkEl) wordmarkEl.value = 'avd-ops';
      if (taglineEl) taglineEl.value = 'Deploy quietly';
      if (svgInputEl) svgInputEl.value = '';
      if (fileInputEl) fileInputEl.value = '';
      update();
    });
  }

  // Copy buttons (using data-copy-target for broad browser compatibility alongside role="status" feedback)
  const copyTimers = new WeakMap();
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('button[data-copy-target]');
    if (!btn) return;
    const target = document.getElementById(btn.getAttribute('data-copy-target'));
    const tip = btn.nextElementSibling;
    if (!target) return;
    const text = target.matches('input, textarea') ? target.value.trim() : target.innerText.trim();
    if (!text) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (tip) {
      clearTimeout(copyTimers.get(btn));
      btn.removeAttribute('data-copied');
      btn.removeAttribute('data-failed');
      tip.textContent = '';
      void btn.offsetWidth;
      btn.setAttribute(ok ? 'data-copied' : 'data-failed', '');
      requestAnimationFrame(() => { tip.textContent = ok ? 'Copied' : 'Copy failed'; });
      copyTimers.set(btn, setTimeout(() => {
        btn.removeAttribute('data-copied');
        btn.removeAttribute('data-failed');
        tip.textContent = '';
      }, 2000));
    }
  });

  syncInputsFromPreset('teal');
  update();
}
