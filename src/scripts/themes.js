// Themes for M-x load-theme. The colours live in src/styles/themes.css under
// :root[data-theme="…"]; keep this list, that CSS and the inline script in
// src/layouts/Base.astro in sync.

export const THEMES = [
  { id: "gruvbox", desc: "Gruvbox, medium contrast. The theme my own Emacs uses" },
  { id: "gruvbox-light", desc: "Gruvbox's light variant" },
  { id: "doom-one", desc: "Doom Emacs's default, inspired by Atom One Dark" },
  { id: "atom-one-dark", desc: "Atom's One Dark" },
  { id: "modus-vivendi", desc: "Emacs's built-in high-contrast dark theme" },
  { id: "modus-operandi", desc: "Emacs's built-in high-contrast light theme" },
  { id: "dracula", desc: "Dracula" },
  { id: "nord", desc: "Nord, arctic and north-bluish" },
  { id: "catppuccin", desc: "Catppuccin, Mocha flavour" },
  { id: "tokyo-night", desc: "Tokyo Night" },
  { id: "solarized-dark", desc: "Solarized dark" },
  { id: "solarized-light", desc: "Solarized light" },
];

export const DEFAULT_THEME = "gruvbox";
