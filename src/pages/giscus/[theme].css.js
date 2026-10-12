// giscus themes made from the site's own colours: /giscus/<theme>.css for each
// Emacs theme, so the comments under a post match whichever one is loaded.
// The colours are read from themes.css, so a theme only has to be defined there.
// giscus loads this (and the fonts it names) from inside its own frame, so
// netlify.toml allows giscus.app to fetch both.

import styles from "../../styles/themes.css?raw";
import { THEMES, DEFAULT_THEME } from "../../scripts/themes.js";

export function getStaticPaths() {
  return THEMES.map((t) => ({ params: { theme: t.id } }));
}

// The declarations in the first block that matches, as { name: value }.
function block(selector) {
  const m = styles.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  return Object.fromEntries([...(m?.[1] ?? "").matchAll(/(--[\w-]+|color-scheme):\s*([^;]+);/g)].map((d) => [d[1], d[2].trim()]));
}

const TOKENS = ["--bg", "--bg-alt", "--fg", "--red", "--orange", "--yellow", "--green", "--cyan", "--blue", "--magenta"];

export function GET({ params }) {
  const base = block(":root");
  const theme = params.theme === DEFAULT_THEME ? base : { ...base, ...block(`:root\\[data-theme="${params.theme}"\\]`) };
  const light = theme["color-scheme"] === "light";
  const tokens = TOKENS.map((t) => `  ${t}: ${theme[t]};`).join("\n");
  return new Response(css(tokens, light), { headers: { "Content-Type": "text/css; charset=utf-8" } });
}

const mix = (a, pct, b = "transparent") => `color-mix(in srgb, var(${a}) ${pct}%, ${b === "transparent" ? b : `var(${b})`})`;

const css = (tokens, light) => `/* giscus theme for michaelneuper.com, made from the site's colours. */

@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-semibold.woff2") format("woff2");
  font-weight: 600;
  font-display: swap;
}

@font-face {
  font-family: "Computer Modern";
  src: url("/fonts/cm-regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Computer Modern";
  src: url("/fonts/cm-italic.woff2") format("woff2");
  font-style: italic;
  font-display: swap;
}

main {
  color-scheme: ${light ? "light" : "dark"};
${tokens}
  --dim: ${mix("--fg", 64, "--bg")};
  --faint: ${mix("--fg", 34, "--bg")};
  --rule: ${mix("--fg", 15, "--bg")};
  --hl: ${mix("--fg", 10, "--bg")};

  --color-prettylights-syntax-comment: var(--dim);
  --color-prettylights-syntax-constant: var(--orange);
  --color-prettylights-syntax-entity: var(--blue);
  --color-prettylights-syntax-storage-modifier-import: var(--fg);
  --color-prettylights-syntax-entity-tag: var(--green);
  --color-prettylights-syntax-keyword: var(--magenta);
  --color-prettylights-syntax-string: var(--green);
  --color-prettylights-syntax-variable: var(--orange);
  --color-prettylights-syntax-brackethighlighter-unmatched: var(--red);
  --color-prettylights-syntax-invalid-illegal-text: var(--bg);
  --color-prettylights-syntax-invalid-illegal-bg: var(--red);
  --color-prettylights-syntax-carriage-return-text: var(--bg);
  --color-prettylights-syntax-carriage-return-bg: var(--red);
  --color-prettylights-syntax-string-regexp: var(--cyan);
  --color-prettylights-syntax-markup-list: var(--yellow);
  --color-prettylights-syntax-markup-heading: var(--blue);
  --color-prettylights-syntax-markup-italic: var(--fg);
  --color-prettylights-syntax-markup-bold: var(--fg);
  --color-prettylights-syntax-markup-deleted-text: var(--red);
  --color-prettylights-syntax-markup-deleted-bg: ${mix("--red", 15)};
  --color-prettylights-syntax-markup-inserted-text: var(--green);
  --color-prettylights-syntax-markup-inserted-bg: ${mix("--green", 15)};
  --color-prettylights-syntax-markup-changed-text: var(--yellow);
  --color-prettylights-syntax-markup-changed-bg: ${mix("--yellow", 15)};
  --color-prettylights-syntax-markup-ignored-text: var(--dim);
  --color-prettylights-syntax-markup-ignored-bg: var(--hl);
  --color-prettylights-syntax-meta-diff-range: var(--magenta);
  --color-prettylights-syntax-brackethighlighter-angle: var(--dim);
  --color-prettylights-syntax-sublimelinter-gutter-mark: var(--faint);
  --color-prettylights-syntax-constant-other-reference-link: var(--cyan);

  --color-btn-text: var(--fg);
  --color-btn-bg: transparent;
  --color-btn-border: var(--faint);
  --color-btn-shadow: none;
  --color-btn-inset-shadow: none;
  --color-btn-hover-bg: var(--hl);
  --color-btn-hover-border: var(--fg);
  --color-btn-active-bg: var(--hl);
  --color-btn-active-border: var(--fg);
  --color-btn-selected-bg: var(--hl);
  --color-btn-primary-text: var(--bg);
  --color-btn-primary-bg: var(--fg);
  --color-btn-primary-border: var(--fg);
  --color-btn-primary-shadow: none;
  --color-btn-primary-inset-shadow: none;
  --color-btn-primary-hover-bg: ${mix("--fg", 85, "--bg")};
  --color-btn-primary-hover-border: ${mix("--fg", 85, "--bg")};
  --color-btn-primary-selected-bg: var(--fg);
  --color-btn-primary-selected-shadow: none;
  --color-btn-primary-disabled-text: var(--bg);
  --color-btn-primary-disabled-bg: var(--faint);
  --color-btn-primary-disabled-border: var(--faint);
  --color-action-list-item-default-hover-bg: var(--hl);
  --color-segmented-control-bg: var(--hl);
  --color-segmented-control-button-bg: var(--bg);
  --color-segmented-control-button-selected-border: var(--faint);

  --color-fg-default: var(--fg);
  --color-fg-muted: var(--dim);
  --color-fg-subtle: var(--faint);
  --color-canvas-default: transparent;
  --color-canvas-overlay: var(--bg-alt);
  --color-canvas-inset: var(--hl);
  --color-canvas-subtle: var(--hl);
  --color-border-default: var(--rule);
  --color-border-muted: var(--rule);
  --color-neutral-muted: var(--hl);
  --color-accent-fg: var(--blue);
  --color-accent-emphasis: var(--blue);
  --color-accent-muted: ${mix("--blue", 40)};
  --color-accent-subtle: ${mix("--blue", 12)};
  --color-success-fg: var(--green);
  --color-attention-fg: var(--yellow);
  --color-attention-muted: ${mix("--yellow", 40)};
  --color-attention-subtle: ${mix("--yellow", 15)};
  --color-danger-fg: var(--red);
  --color-danger-muted: ${mix("--red", 40)};
  --color-danger-subtle: ${mix("--red", 12)};
  --color-primer-shadow-inset: none;
  --color-scale-gray-7: var(--hl);
  --color-scale-blue-8: ${mix("--blue", 30, "--bg")};
  --color-social-reaction-bg-hover: var(--color-scale-gray-7);
  --color-social-reaction-bg-reacted-hover: var(--color-scale-blue-8);

  font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
}

main .pagination-loader-container {
  background-image: url(https://github.com/images/modules/pulls/progressive-disclosure-line${light ? "" : "-dark"}.svg);
}

main .gsc-loading-image {
  background-image: url(https://github.githubassets.com/images/mona-loading-${light ? "default" : "dark"}.gif);
}

/* square corners and no shadows, like the rest of the site */
main *,
main *::before,
main *::after {
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* what people write reads in the serif, like the posts */
main .markdown {
  font-family: "Computer Modern", "Latin Modern Roman", Georgia, serif;
  font-size: 17px;
  line-height: 1.55;
}

main .markdown :is(code, pre, kbd, tt) {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
}
`;
