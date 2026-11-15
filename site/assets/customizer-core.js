/* avd-ops Adopter Theme Customizer core (v4.0.0): pure presets, WCAG 2.1 contrast math, token derivation,
   SVG sanitization, and adopter-theme.css generation. No DOM, no network, no storage, so tests/customizer.test.mjs
   runs offline.
   Personal project, not for production, as is; not affiliated with the author's employer or Microsoft. */

export const CUSTOMIZER_VERSION = '4.0.0';

export const LIGHT_BG = '#f5f7f7';
export const LIGHT_SURFACE = '#ffffff';
export const DARK_BG = '#0a0f11';
export const DARK_SURFACE = '#10171a';

export const PALETTE_PRESETS = [
  {
    id: 'teal',
    name: 'avd-ops Teal (Default)',
    light: {
      accent: '#0b7a6e',
      accentHover: '#075f56',
      onAccent: '#ffffff',
      accentSoft: '#e1f2ef',
      accentLine: '#a9dbd3',
      focus: '#0b7a6e',
      brand: '#1ca998',
      shell: '#0d1015',
      shellFg: '#e8f1f0',
      shellMuted: '#a3b3b8',
      shellLine: '#222b31',
      shellHover: '#1a2329',
    },
    dark: {
      accent: '#3cc8b4',
      accentHover: '#7fe0d2',
      onAccent: '#06110f',
      accentSoft: '#0f2e2b',
      accentLine: '#1f5a52',
      focus: '#7fe0d2',
      brand: '#1ca998',
      shell: '#070a0c',
      shellFg: '#e8f1f0',
      shellMuted: '#93a6ad',
      shellLine: '#1a2328',
      shellHover: '#12191d',
    },
  },
  {
    id: 'cobalt',
    name: 'Azure Cobalt',
    light: {
      accent: '#1d4ed8',
      brand: '#2563eb',
      shell: '#0c1322',
    },
    dark: {
      accent: '#60a5fa',
      brand: '#3b82f6',
      shell: '#070b14',
    },
  },
  {
    id: 'slate',
    name: 'Slate Monochrome',
    light: {
      accent: '#334155',
      brand: '#475569',
      shell: '#0f172a',
    },
    dark: {
      accent: '#cbd5e1',
      brand: '#94a3b8',
      shell: '#090d16',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    light: {
      accent: '#166534',
      brand: '#16a34a',
      shell: '#0b140e',
    },
    dark: {
      accent: '#4ade80',
      brand: '#22c55e',
      shell: '#060c08',
    },
  },
  {
    id: 'amber',
    name: 'Amber',
    light: {
      accent: '#9a5b12',
      brand: '#d97706',
      shell: '#14100a',
    },
    dark: {
      accent: '#f59e0b',
      brand: '#f59e0b',
      shell: '#0b0905',
    },
  },
];

export const FONT_PRESETS = [
  {
    id: 'grotesk-plex',
    name: 'Grotesk + IBM Plex Mono (Default)',
    display: '"Schibsted Grotesk","Segoe UI",system-ui,sans-serif',
    body: '"IBM Plex Mono",ui-monospace,"Cascadia Mono",SFMono-Regular,Menlo,Consolas,monospace',
    mono: '"IBM Plex Mono",ui-monospace,"Cascadia Mono",SFMono-Regular,Menlo,Consolas,monospace',
    wordmark: '"Schibsted Grotesk","Segoe UI",system-ui,sans-serif',
  },
  {
    id: 'system-sans',
    name: 'System Sans + System Mono',
    display: 'system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    body: 'system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    mono: 'ui-monospace,"Cascadia Mono",SFMono-Regular,Menlo,Consolas,monospace',
    wordmark: 'system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  },
  {
    id: 'editorial-serif',
    name: 'Editorial Serif + Mono',
    display: '"Source Serif 4",Georgia,"Times New Roman",serif',
    body: '"Source Serif 4",Georgia,"Times New Roman",serif',
    mono: '"IBM Plex Mono",ui-monospace,"Cascadia Mono",SFMono-Regular,Menlo,Consolas,monospace',
    wordmark: '"Source Serif 4",Georgia,"Times New Roman",serif',
  },
  {
    id: 'grotesk-sans',
    name: 'Grotesk + System Sans',
    display: '"Schibsted Grotesk","Segoe UI",system-ui,sans-serif',
    body: 'system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    mono: '"IBM Plex Mono",ui-monospace,"Cascadia Mono",SFMono-Regular,Menlo,Consolas,monospace',
    wordmark: '"Schibsted Grotesk","Segoe UI",system-ui,sans-serif',
  },
];

export function normalizeHex(hex) {
  if (typeof hex !== 'string') return null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const raw = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  return `#${raw.toLowerCase()}`;
}

export function hexToRgb(hex) {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  return [
    parseInt(norm.slice(1, 3), 16),
    parseInt(norm.slice(3, 5), 16),
    parseInt(norm.slice(5, 7), 16),
  ];
}

export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export function mixHex(hexA, hexB, weightA) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const w = Math.max(0, Math.min(1, weightA));
  return rgbToHex(
    a[0] * w + b[0] * (1 - w),
    a[1] * w + b[1] * (1 - w),
    a[2] * w + b[2] * (1 - w),
  );
}

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const lin = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  if (l1 === null || l2 === null) return null;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function pickOnColor(bgHex, lightCandidate = '#ffffff', darkCandidate = '#06110f') {
  const rLight = contrastRatio(lightCandidate, bgHex) ?? 0;
  const rDark = contrastRatio(darkCandidate, bgHex) ?? 0;
  return rLight >= rDark ? lightCandidate : darkCandidate;
}

export function deriveAccentTokens(accentHex, isDark, overrides = {}) {
  const accent = normalizeHex(accentHex) || (isDark ? '#3cc8b4' : '#0b7a6e');
  const accentHover = normalizeHex(overrides.accentHover)
    || (isDark ? mixHex(accent, '#ffffff', 0.65) : mixHex(accent, '#000000', 0.78));
  const onAccent = normalizeHex(overrides.onAccent) || pickOnColor(accent, '#ffffff', '#06110f');
  const accentSoft = normalizeHex(overrides.accentSoft)
    || (isDark ? mixHex(accent, DARK_BG, 0.18) : mixHex(accent, '#ffffff', 0.12));
  const accentLine = normalizeHex(overrides.accentLine)
    || (isDark ? mixHex(accent, DARK_BG, 0.38) : mixHex(accent, '#ffffff', 0.35));
  const focus = normalizeHex(overrides.focus) || (isDark ? accentHover : accent);
  return { accent, accentHover, onAccent, accentSoft, accentLine, focus };
}

export function deriveShellTokens(shellHex, isDark, overrides = {}) {
  const baseShell = normalizeHex(shellHex) || (isDark ? '#070a0c' : '#0d1015');
  const shell = normalizeHex(overrides.shell)
    || (isDark ? mixHex(baseShell, '#000000', 0.65) : baseShell);
  const shellFg = normalizeHex(overrides.shellFg) || pickOnColor(shell, '#e8f1f0', '#0f1c1e');
  const shellMuted = normalizeHex(overrides.shellMuted) || mixHex(shellFg, shell, 0.68);
  const shellLine = normalizeHex(overrides.shellLine) || mixHex(shellFg, shell, 0.14);
  const shellHover = normalizeHex(overrides.shellHover) || mixHex(shellFg, shell, 0.08);
  return { shell, shellFg, shellMuted, shellLine, shellHover };
}

export function resolveThemeTokens(config = {}) {
  const preset = PALETTE_PRESETS.find((p) => p.id === config.presetId) || PALETTE_PRESETS[0];
  const font = FONT_PRESETS.find((f) => f.id === config.fontId) || FONT_PRESETS[0];

  const lightAccentInput = normalizeHex(config.lightAccent) || preset.light.accent;
  const darkAccentInput = normalizeHex(config.darkAccent)
    || (config.lightAccent ? mixHex(lightAccentInput, '#ffffff', 0.55) : preset.dark.accent);
  const brandInput = normalizeHex(config.brand) || preset.light.brand;
  const lightShellInput = normalizeHex(config.shell) || preset.light.shell;
  const darkShellInput = normalizeHex(config.darkShell)
    || (config.shell ? mixHex(lightShellInput, '#000000', 0.65) : preset.dark.shell);

  const usePresetExact = !config.lightAccent && !config.darkAccent && !config.brand && !config.shell && !config.darkShell;
  const lightAccent = deriveAccentTokens(lightAccentInput, false, usePresetExact ? preset.light : {});
  const darkAccent = deriveAccentTokens(darkAccentInput, true, usePresetExact ? preset.dark : {});
  const lightShell = deriveShellTokens(lightShellInput, false, usePresetExact ? preset.light : {});
  const darkShell = deriveShellTokens(darkShellInput, true, usePresetExact ? preset.dark : {});

  return {
    preset,
    font,
    light: {
      '--accent': lightAccent.accent,
      '--accent-hover': lightAccent.accentHover,
      '--on-accent': lightAccent.onAccent,
      '--accent-soft': lightAccent.accentSoft,
      '--accent-line': lightAccent.accentLine,
      '--focus': lightAccent.focus,
      '--brand': brandInput,
      '--shell': lightShell.shell,
      '--shell-fg': lightShell.shellFg,
      '--shell-muted': lightShell.shellMuted,
      '--shell-line': lightShell.shellLine,
      '--shell-hover': lightShell.shellHover,
    },
    dark: {
      '--accent': darkAccent.accent,
      '--accent-hover': darkAccent.accentHover,
      '--on-accent': darkAccent.onAccent,
      '--accent-soft': darkAccent.accentSoft,
      '--accent-line': darkAccent.accentLine,
      '--focus': darkAccent.focus,
      '--brand': normalizeHex(config.darkBrand) || (usePresetExact ? preset.dark.brand : brandInput),
      '--shell': darkShell.shell,
      '--shell-fg': darkShell.shellFg,
      '--shell-muted': darkShell.shellMuted,
      '--shell-line': darkShell.shellLine,
      '--shell-hover': darkShell.shellHover,
    },
    fonts: {
      '--display': font.display,
      '--body': font.body,
      '--mono': font.mono,
      '--wordmark': font.wordmark,
    },
  };
}

export function wcagLevel(ratio) {
  if (ratio === null) return 'invalid';
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fails';
}

export function evaluatePaletteContrast(resolved) {
  const pairs = [
    { id: 'light-accent-bg', label: 'Light --accent on --bg', fg: resolved.light['--accent'], bg: LIGHT_BG, min: 4.5 },
    { id: 'light-accent-surface', label: 'Light --accent on --surface', fg: resolved.light['--accent'], bg: LIGHT_SURFACE, min: 4.5 },
    { id: 'light-on-accent', label: 'Light --on-accent on --accent', fg: resolved.light['--on-accent'], bg: resolved.light['--accent'], min: 4.5 },
    { id: 'light-shell', label: 'Light --shell-fg on --shell', fg: resolved.light['--shell-fg'], bg: resolved.light['--shell'], min: 4.5 },
    { id: 'dark-accent-bg', label: 'Dark --accent on --bg', fg: resolved.dark['--accent'], bg: DARK_BG, min: 4.5 },
    { id: 'dark-accent-surface', label: 'Dark --accent on --surface', fg: resolved.dark['--accent'], bg: DARK_SURFACE, min: 4.5 },
    { id: 'dark-on-accent', label: 'Dark --on-accent on --accent', fg: resolved.dark['--on-accent'], bg: resolved.dark['--accent'], min: 4.5 },
    { id: 'dark-shell', label: 'Dark --shell-fg on --shell', fg: resolved.dark['--shell-fg'], bg: resolved.dark['--shell'], min: 4.5 },
  ];

  const checks = pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg) ?? 0;
    return {
      ...p,
      ratio,
      level: wcagLevel(ratio),
      passAA: ratio >= p.min,
      passLarge: ratio >= 3,
    };
  });

  const warnings = checks
    .filter((c) => !c.passAA)
    .map((c) => `${c.label}: ${c.ratio.toFixed(1)}:1 (${c.passLarge ? 'large text/UI only, below 4.5:1 AA' : 'fails WCAG 3:1'})`);

  return {
    ok: warnings.length === 0,
    warnings,
    checks,
  };
}

export function sanitizeSvg(svgText) {
  if (typeof svgText !== 'string') return '';
  const trimmed = svgText.trim();
  if (!trimmed || !/^<svg[\s>]/i.test(trimmed) || !/<\/svg\s*>$/i.test(trimmed)) return '';
  // Reject any SVG containing scripts, foreignObject, inline event handlers, or external/javascript URIs.
  if (/<(?:script|foreignObject)\b/i.test(trimmed)) return '';
  if (/[\s/]on[a-z]+\s*=/i.test(trimmed)) return '';
  if (/(?:xlink:)?href\s*=\s*["']?\s*(?:javascript:|https?:)/i.test(trimmed)) return '';
  return trimmed;
}

export function svgToDataUri(svgText) {
  const clean = sanitizeSvg(svgText);
  if (!clean) return null;
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

function formatDeclBlock(entries) {
  return Object.entries(entries)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}

export function generateAdopterCss(config = {}) {
  const resolved = resolveThemeTokens(config);
  const wordmark = (config.wordmark || '').trim();
  const tagline = (config.tagline || '').trim();
  const brandNote = (wordmark && wordmark !== 'avd-ops') || (tagline && tagline !== 'Deploy quietly')
    ? `\n/* Brand slot HTML (header.bar .brand): replace .word ("${wordmark || 'avd-ops'}") and .tag ("${tagline || 'Deploy quietly'}"), and point img.mark at your 44x44 mark.svg. Keep details.notice and footer.foot intact. */\n`
    : '';

  return `/* avd-ops adopter-theme.css (v${CUSTOMIZER_VERSION}) — token-only override layer.
   Load AFTER avd-ops.css (and before avd-ops-portal.css / avd-ops-shell.css).
   Keeps core stylesheets untouched and upgradable. Zero external requests.
   Personal project, not for production, as is; not affiliated with the author's employer or Microsoft. */

:root {
${formatDeclBlock(resolved.light)}
${formatDeclBlock(resolved.fonts)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${formatDeclBlock(resolved.dark)}
  }
}

:root[data-theme="dark"] {
${formatDeclBlock(resolved.dark)}
}
${brandNote}`;
}

export function generateDropInSnippet() {
  return `<!-- 1. Save adopter-theme.css next to avd-ops.css in assets/ -->
<link rel="stylesheet" href="assets/avd-ops.css">
<link rel="stylesheet" href="assets/adopter-theme.css">
<link rel="stylesheet" href="assets/avd-ops-shell.css">`;
}
