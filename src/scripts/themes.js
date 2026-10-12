// Themes for M-x load-theme. The colours live in src/styles/style.css under
// :root[data-theme="…"]; keep this list, that CSS and the inline script in
// src/pages/index.astro in sync.

export const THEMES = [
  { id: "doom-gruvbox", desc: "Gruvbox, medium contrast. The theme my own Emacs uses" },
  { id: "doom-gruvbox-light", desc: "Gruvbox's light variant" },
  { id: "doom-one", desc: "Doom Emacs's default, inspired by Atom One Dark" },
  { id: "atom-one-dark", desc: "Atom's One Dark" },
  { id: "modus-vivendi", desc: "Emacs's built-in high-contrast dark theme" },
  { id: "modus-operandi", desc: "Emacs's built-in high-contrast light theme" },
  { id: "doom-dracula", desc: "Dracula" },
  { id: "doom-nord", desc: "Nord, arctic and north-bluish" },
  { id: "catppuccin", desc: "Catppuccin, Mocha flavour" },
  { id: "doom-tokyo-night", desc: "Tokyo Night" },
  { id: "doom-solarized-light", desc: "Solarized light" },
];

export const DEFAULT_THEME = "doom-gruvbox";
