// M-x load-theme (SPC h t, or the button in the top line), with a live preview
// as you move through the list. The choice is kept in localStorage, and the
// inline script in src/layouts/Base.astro applies it before the first paint.

import { $, emit } from "../util.js";
import { THEMES, DEFAULT_THEME } from "../themes.js";
import { message } from "./echo.js";
import { defcommand } from "./commands.js";
import { completingRead } from "./minibuffer.js";

const root = document.documentElement;

const currentTheme = () => root.dataset.theme || DEFAULT_THEME;
function applyTheme(id) {
  if (root.dataset.theme === id) return;
  root.dataset.theme = id;
  emit("theme", id);
}
export function setTheme(id) {
  if (!THEMES.some((t) => t.id === id)) return message(`Unable to find theme file for ‘${id}’`, "error");
  applyTheme(id);
  try { localStorage.setItem("theme", id); } catch { /* private mode */ }
  message(`Loaded theme ${id}`);
}

async function loadTheme() {
  const saved = currentTheme();
  const id = await completingRead("Load custom theme: ", THEMES.map((t) => ({ value: t.id, ann: t.desc })), {
    select: saved,
    onPreview: applyTheme,
  });
  if (id) setTheme(id);
  else applyTheme(saved);
}
defcommand("load-theme", loadTheme, { doc: "Load a theme, previewing each one", key: "SPC h t" });
$(".theme-key").addEventListener("click", loadTheme);
